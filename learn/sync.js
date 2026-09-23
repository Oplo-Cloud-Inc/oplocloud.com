/* ==========================================================================
   Sync.

   One person's progress, the same on every device they sign in on.

   Everything is written to this browser first — the record in store.js, and
   each study set's concept states in learn.js — so no answer waits on a
   request and no dropped connection costs one. This file keeps those local
   copies in step with the account, and it is built around the thing that
   makes that hard: two devices can each have done work the other has not
   seen.

   Three rules.

   1. MERGE, NEVER REPLACE. A pulled copy is merged into the local one by what
      each field means — a section once checked stays checked, mastery only
      rises, the newest answer to a concept wins. Last-write-wins on the whole
      copy, which is what this used to do, erases a morning on a laptop because
      a phone saved a minute later.

   2. THE SERVER'S CLOCK, NEVER OURS. Every write carries `base`: the server's
      updatedAt this device last saw. If another device has written since,
      the server refuses with 409, and this device fetches that scope, merges,
      and writes again. No local clock is compared with the server's, so a
      laptop whose clock runs fast cannot win every argument.

   3. LOCAL FIRST. Offline, work stays here and is marked owed. Closing the tab
      sends what it can with keepalive; whatever does not arrive is still in
      this browser, and the next sign-in merges it.

   Scopes are the progress API's: `record` for the student record and
   `set:<id>` for each set's concept states.
   ========================================================================== */
window.OPLO_SYNC = (function () {
  "use strict";

  var RECORD = "record";
  var SET = "set:";

  /* JSON with keys in a fixed order, so two copies holding the same things
     compare equal however they were assembled. Without it every merge looks
     like a change and every pull echoes back as a push. */
  function stable(x) {
    if (x === undefined) return "null";
    if (x === null || typeof x !== "object") return JSON.stringify(x);
    if (Array.isArray(x)) return "[" + x.map(stable).join(",") + "]";
    return "{" + Object.keys(x).sort()
      .filter(function (k) { return x[k] !== undefined; })
      .map(function (k) { return JSON.stringify(k) + ":" + stable(x[k]); })
      .join(",") + "}";
  }
  function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }

  /* Replace an object's contents and keep the object. The app holds
     references straight into the record — S.m, S.sets and S.readDone are the
     record's own objects, and an open screen holds a set's state — so
     swapping in new objects would leave every one of them writing to
     something nobody saves. */
  function refill(target, source) {
    if (Array.isArray(target) && Array.isArray(source)) {
      target.length = 0;
      source.forEach(function (v) { target.push(v); });
      return target;
    }
    Object.keys(target).forEach(function (k) {
      if (!Object.prototype.hasOwnProperty.call(source, k)) delete target[k];
    });
    Object.keys(source).forEach(function (k) {
      var t = target[k], s = source[k];
      if (t && s && typeof t === "object" && typeof s === "object" &&
          Array.isArray(t) === Array.isArray(s)) refill(t, s);
      else target[k] = s;
    });
    return target;
  }

  /* o: { api, record, store, learn, personId, onChange, onStatus, delay, pullGap } */
  function create(o) {
    var api = o.api, record = o.record, ST = o.store, L = o.learn, me = o.personId;
    var onChange = o.onChange || function () {};
    var onStatus = o.onStatus || function () {};
    var DELAY = o.delay != null ? o.delay : 2500;
    var PULL_GAP = o.pullGap != null ? o.pullGap : 30000;

    var metaKey = "oplo.sync." + me;
    var meta = loadMeta();
    var snap = {};              // scope -> the server's copy, as last seen
    var owed = {};              // scope -> a change counter not yet pushed
    var timers = {};
    var flight = {};
    var ready = false, stopped = false, quiet = false;
    var pulling = null, lastPull = 0;
    var status = { state: "idle", at: meta.savedAt || null };

    function loadMeta() {
      try {
        var m = JSON.parse(localStorage.getItem(metaKey) || "null");
        if (m && m.scopes) return m;
      } catch (e) { /* private mode */ }
      return { scopes: {} };
    }
    function saveMeta() {
      try { localStorage.setItem(metaKey, JSON.stringify(meta)); } catch (e) { /* full */ }
    }
    function baseOf(scope) { var s = meta.scopes[scope]; return s && s.at ? s.at : 0; }
    function anyOwed() { return Object.keys(owed).length > 0; }
    function setStatus(state) {
      status = { state: state, at: state === "saved" ? Date.now() : status.at };
      if (state === "saved") { meta.savedAt = status.at; saveMeta(); }
      try { onStatus(status); } catch (e) { /* a listener's problem */ }
    }

    /* ------------------------------------------------------ Local copies */
    function localSets() {
      var out = [], prefix = "oplo.learn." + me + ".";
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          // `.at` keys are the old sync's timestamps and mean nothing now.
          if (k && k.indexOf(prefix) === 0 && !/\.at$/.test(k)) out.push(SET + k.slice(prefix.length));
        }
      } catch (e) { /* private mode */ }
      return out;
    }
    function read(scope) {
      if (scope === RECORD) return record.d;
      return new L.Store(me, scope.slice(SET.length)).all();
    }
    function write(scope, state) {
      quiet = true;           // our own write is not a change to push
      try {
        if (scope === RECORD) { refill(record.d, state); record.flush(); }
        else new L.Store(me, scope.slice(SET.length)).adopt(state);
      } finally { quiet = false; }
    }
    function mergeScope(scope, local, remote) {
      if (remote == null) return clone(local);
      if (local == null) return clone(remote);
      return scope === RECORD ? ST.merge(local, remote) : L.mergeStates(local, remote);
    }
    /* What counts as a change worth sending. The record's `last` moves on
       every write and its experience block is the ledger's to set, so neither
       is a reason to push — only the daily goal, which is a choice. */
    function comparable(scope, state) {
      if (scope !== RECORD || !state) return stable(state);
      var c = {};
      Object.keys(state).forEach(function (k) { if (k !== "last" && k !== "game") c[k] = state[k]; });
      if (state.game) c.goal = state.game.goal;
      return stable(c);
    }

    /* Take in the server's copy of one scope. `moved` says the local copy
       changed; `owes` says the merged copy holds work the server lacks. */
    function absorb(scope, row) {
      var remote = row ? row.state : null;
      snap[scope] = remote;
      meta.scopes[scope] = { at: row ? row.updatedAt : 0 };
      saveMeta();
      var local = read(scope);
      var merged = mergeScope(scope, local, remote);
      var moved = comparable(scope, merged) !== comparable(scope, local);
      if (moved) write(scope, merged);
      var owes = remote == null
        ? (scope === RECORD || Object.keys(merged || {}).length > 0)
        : comparable(scope, merged) !== comparable(scope, remote);
      return { moved: moved, owes: owes };
    }

    /* --------------------------------------------------------------- Pull */
    function pull() {
      if (stopped) return Promise.resolve([]);
      if (pulling) return pulling;
      lastPull = Date.now();
      pulling = api.progress.all().then(function (rows) {
        rows = rows || {};
        var scopes = [RECORD].concat(localSets());
        Object.keys(rows).forEach(function (s) {
          if (s.indexOf(SET) === 0 && scopes.indexOf(s) < 0) scopes.push(s);
        });
        var moved = [];
        scopes.forEach(function (scope) {
          var r = absorb(scope, rows[scope] || null);
          if (r.moved) moved.push(scope);
          if (r.owes) owed[scope] = (owed[scope] || 0) + 1;
        });
        ready = true;
        if (anyOwed()) Object.keys(owed).forEach(function (s) { push(s); });
        else setStatus("saved");
        return moved;
      }, function (e) {
        // Work on locally; the next push finds out whether anything moved.
        ready = true;
        setStatus(e && e.status === 0 ? "offline" : "error");
        return [];
      }).then(function (moved) {
        pulling = null;
        if (moved.length) { try { onChange(moved); } catch (e) { /* a listener's problem */ } }
        return moved;
      });
      return pulling;
    }
    function maybePull() {
      if (Date.now() - lastPull < PULL_GAP) return Promise.resolve([]);
      return pull();
    }

    /* --------------------------------------------------------------- Push */
    function markOwed(scope) {
      if (stopped || quiet) return;
      owed[scope] = (owed[scope] || 0) + 1;
      if (!ready) return;               // the first pull pushes whatever is owed
      clearTimeout(timers[scope]);
      timers[scope] = setTimeout(function () { push(scope); }, DELAY);
    }

    function push(scope, tries) {
      tries = tries || 0;
      clearTimeout(timers[scope]);
      if (stopped || !owed[scope]) return Promise.resolve(false);
      if (flight[scope]) { flight[scope].again = true; return flight[scope].p; }

      var version = owed[scope];
      var local = read(scope);
      var merged = mergeScope(scope, local, snap[scope]);
      if (Object.prototype.hasOwnProperty.call(snap, scope) &&
          comparable(scope, merged) === comparable(scope, snap[scope])) {
        if (owed[scope] === version) delete owed[scope];
        if (!anyOwed()) setStatus("saved");
        return Promise.resolve(false);
      }
      if (comparable(scope, merged) !== comparable(scope, local)) write(scope, merged);

      setStatus("saving");
      var entry = { again: false };
      entry.p = api.progress.put(scope, merged, null, baseOf(scope)).then(function (res) {
        flight[scope] = null;
        snap[scope] = merged;
        meta.scopes[scope] = { at: (res && res.updatedAt) || baseOf(scope) };
        saveMeta();
        if (owed[scope] === version) delete owed[scope];
        if (entry.again || owed[scope]) return push(scope);
        if (!anyOwed()) setStatus("saved");
        return true;
      }, function (e) {
        flight[scope] = null;
        if (e && e.status === 409 && tries < 3) {
          // Another device wrote first. Take its copy, merge, and go again.
          return api.progress.one(scope).then(function (row) {
            var r = absorb(scope, row);
            if (r.moved) { try { onChange([scope]); } catch (x) { /* a listener's problem */ } }
            owed[scope] = (owed[scope] || 0) + 1;
            return push(scope, tries + 1);
          }, function (x) {
            setStatus(x && x.status === 0 ? "offline" : "error");
            return false;
          });
        }
        // Still owed. The next change, reconnection or sign-in carries it.
        setStatus(e && e.status === 0 ? "offline" : "error");
        return false;
      });
      flight[scope] = entry;
      return entry.p;
    }

    function flush() {
      return Promise.all(Object.keys(owed).map(function (s) { return push(s); }));
    }

    /* The page is closing. There is no time to handle a refusal, so this
       sends the merged copy with keepalive and trusts the next sign-in to
       reconcile anything that did not land — it is all still in this browser. */
    function flushNow() {
      if (stopped) return;
      Object.keys(owed).forEach(function (scope) {
        clearTimeout(timers[scope]);
        var merged = mergeScope(scope, read(scope), snap[scope]);
        if (api.progress.beacon) api.progress.beacon(scope, merged, baseOf(scope));
      });
    }

    function onOnline() { if (ready) flush(); else pull(); }
    if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("online", onOnline);

    function stop() {
      stopped = true;
      Object.keys(timers).forEach(function (s) { clearTimeout(timers[s]); });
      if (typeof window !== "undefined" && window.removeEventListener) window.removeEventListener("online", onOnline);
    }

    return {
      pull: pull, maybePull: maybePull, dirty: markOwed, push: push,
      flush: flush, flushNow: flushNow, stop: stop,
      status: function () { return status; },
      owed: function () { return Object.keys(owed); }
    };
  }

  return { create: create, stable: stable, refill: refill, RECORD: RECORD };
})();
