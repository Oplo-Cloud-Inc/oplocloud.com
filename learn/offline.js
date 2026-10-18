/* ==========================================================================
   OEdu — what is said with no signal is kept and sent when there is one.

   A class teacher's phone drops its signal in a classroom, a corridor, a bus.
   The register, the diary and a word to the families are small and each can be
   sent twice without harm (the server finds a repeat by its key), so they are
   kept on the phone and sent in order as soon as the phone is back.

     submit(item)  sends it now; with no signal, keeps it and says so. An answer
                   from the server that is a refusal (a mistake in the item) is
                   not kept: it is given back so the screen can say what is wrong.
     flush()       sends what is kept, oldest first. Stops at the first sign the
                   signal is still gone. An item the server refuses is moved to
                   `failed()` with its reason, so nobody believes it was sent.

   An item with the same `merge` as one still waiting replaces it: the last
   register saved for a section and a day is the only one worth sending.

   What is kept is only what the teacher typed, on this device, tagged with who
   they were; it is sent only while that person is signed in. It is not a way to
   open the page with no signal: the page has to have been opened once.
   ========================================================================== */
window.OPLO_QUEUE = (function () {
  "use strict";

  var KEY = "oplo.queue.v1";

  function make(o) {
    var store = o.storage, send = o.send, who = o.who || function () { return null; }, online = o.online || function () { return true; };
    var listeners = [], busy = null, timer = null;

    function read() {
      try { var v = JSON.parse(store.getItem(KEY) || "null"); return v && Array.isArray(v.items) ? v : { items: [], failed: [] }; }
      catch (e) { return { items: [], failed: [] }; }
    }
    function write(v) { try { store.setItem(KEY, JSON.stringify(v)); } catch (e) { /* storage full or private: it stays in memory for this page only */ mem = v; } }
    var mem = null;
    function state() { return mem || read(); }
    function save(v) { mem = null; write(v); changed(); }
    function changed() { listeners.forEach(function (f) { try { f(api); } catch (e) { /* a screen's mistake does not stop the queue */ } }); }
    function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
    function isGone(e) { return e && (e.status === 0 || e.code === "offline"); }
    function isRefusal(e) { return e && e.status >= 400 && e.status < 500 && e.status !== 408 && e.status !== 429; }

    function keep(item) {
      var v = state();
      var entry = { id: newId(), by: who(), at: Date.now(), label: item.label || "", method: item.method, path: item.path, body: item.body, merge: item.merge || null, tries: 0 };
      if (entry.merge) v.items = v.items.filter(function (x) { return !(x.merge === entry.merge && x.by === entry.by); });
      v.items.push(entry);
      save(v);
      schedule();
      return entry;
    }

    /* Send now, or keep. Resolves { sent, data } or { queued, item }; rejects with a refusal. */
    function submit(item) {
      var me = who();
      // Anything already waiting goes first, so a later save never overtakes an earlier one.
      var ahead = state().items.some(function (x) { return x.by === me; });
      if (ahead || !online()) {
        if (!online() || ahead) {
          var e = keep(item);
          if (online()) flush();
          return Promise.resolve({ queued: true, item: e });
        }
      }
      return send(item.method, item.path, item.body).then(function (data) { return { sent: true, data: data }; }, function (e) {
        if (isGone(e)) return { queued: true, item: keep(item) };
        throw e;
      });
    }

    function flush() {
      if (busy) return busy;
      var me = who();
      if (!me) return Promise.resolve({ sent: 0, left: pending().length });
      var sent = 0;
      function next() {
        var v = state();
        var item = v.items.filter(function (x) { return x.by === me; })[0];
        if (!item) return Promise.resolve();
        return send(item.method, item.path, item.body).then(function () {
          var w = state(); w.items = w.items.filter(function (x) { return x.id !== item.id; }); sent++; save(w); return next();
        }, function (e) {
          var w = state();
          if (isRefusal(e)) {
            w.items = w.items.filter(function (x) { return x.id !== item.id; });
            w.failed.push({ id: item.id, label: item.label, message: (e && e.message) || "The server refused it.", at: Date.now() });
            save(w);
            return next();
          }
          // The signal is still gone, or the server had a bad moment: try again later.
          item.tries = (item.tries || 0) + 1; save(w);
          return Promise.resolve();
        });
      }
      busy = next().then(function () { busy = null; return { sent: sent, left: pending().length }; }, function () { busy = null; return { sent: sent, left: pending().length }; });
      return busy;
    }

    function pending() { var me = who(); return state().items.filter(function (x) { return x.by === me; }); }
    function failed() { return state().failed.slice(); }
    function dismiss(id) { var v = state(); v.failed = v.failed.filter(function (x) { return x.id !== id; }); save(v); }
    function schedule() {
      if (timer || typeof setInterval !== "function" || o.noTimer) return;
      timer = setInterval(function () { if (!pending().length) { clearInterval(timer); timer = null; return; } if (online()) flush(); }, 20000);
    }
    function onChange(f) { listeners.push(f); return function () { listeners = listeners.filter(function (x) { return x !== f; }); }; }
    if (pending().length) schedule();

    var api = { submit: submit, flush: flush, pending: pending, failed: failed, dismiss: dismiss, onChange: onChange, online: online };
    return api;
  }

  /* The queue this page uses: this device's storage, the console's own requests, the signed-in person. */
  var shared = null;
  function theQueue() {
    if (shared) return shared;
    var store = (function () { try { var s = window.localStorage; s.getItem("x"); return s; } catch (e) { var m = {}; return { getItem: function (k) { return m[k] || null; }, setItem: function (k, v) { m[k] = v; } }; } })();
    shared = make({
      storage: store,
      send: function (method, path, body) { return window.OPLO_API.send(method, path, body); },
      who: function () { var a = window.OPLO_WHO; return a ? a() : null; },
      online: function () { return typeof navigator === "undefined" || navigator.onLine !== false; }
    });
    if (window.addEventListener) window.addEventListener("online", function () { shared.flush(); });
    return shared;
  }

  return { make: make, shared: theQueue };
})();
