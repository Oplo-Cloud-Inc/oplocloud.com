/* ==========================================================================
   OEdu assessments — the student's side.

   Built to docs/OEDU_ASSESSMENT_EXPERIENCE_SYSTEM.md. The short version: the
   student should feel like they are thinking, not operating software. One
   task at a time, tools beside it, work that cannot be lost, the rules said
   before the clock starts, and nothing that tells them whether they were
   right until their teacher says so.

   The layers (§69), each a section below:

     Content       a published spec from /api/v1/assessments — released only
                   to its students, once open — and the math markup its text
                   is written in
     Session       what the student has done — on this device at once, and on
                   their account as the progress scope exam:<id>
     Clock         the server's time, and when the sitting ends
     Interactions  choices, written answers, a graph
     Tools         calculator and reference sheet, when the policy allows
     Screens       the Exams tab, the briefing, a task, review, finished

   A spec never carries answers (§36). There is nothing in this file that
   could say whether a response is right, and there should never be.
   ========================================================================== */
(function () {
  "use strict";

  var API = window.OPLO_API;
  var LOCAL = "oplo.exam.";
  var SCOPE = "exam:";

  /* ------------------------------------------------------------- Helpers */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + "</svg>";
  }
  var ICON = {
    clock:  '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    tasks:  '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
    calc:   '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7.5h7"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01M8.5 18.2h.01M12 18.2h.01M15.5 18.2h.01"/>',
    ref:    '<path d="M6 3.5h9l3 3v14H6z"/><path d="M15 3.5v3h3"/><path d="M9 11h6M9 14.5h6M9 18h3.5"/>',
    flag:   '<path d="M6.5 21V4.2"/><path d="M6.5 4.2h10.8l-2.4 3.9 2.4 3.9H6.5"/>',
    check:  '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    right:  '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    left:   '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
    close:  '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    eye:    '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.6A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.4M6.3 6.8C3.9 8.5 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1"/>',
    ban:    '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
    cloud:  '<path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.2 4.7 4.7 0 0 0 7 18.5z"/>',
    offline:'<path d="M3 3l18 18"/><path d="M8.5 18.5H17.5a4 4 0 0 0 2.2-.66M20.9 13.6a4 4 0 0 0-2.8-3.05A6 6 0 0 0 9.4 6.7M6.3 8.6A6 6 0 0 0 6.6 9.2a4.7 4.7 0 0 0 .4 9.3"/>',
    lock:   '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    pencil: '<path d="M4 20h4L19.3 8.7a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'
  };

  function when(ms, withDay) {
    var d = new Date(ms);
    var t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (!withDay) return t;
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + " at " + t;
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }

  function reduced() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ======================================================= Content: math
     A spec's text is plain Unicode — x², √, π, − — plus the few things
     Unicode cannot lay out: \frac{a}{b}, \sqrt{x}, \cbrt{x}, ^{…} for an
     exponent longer than one character and _{…} for a subscript. Everything
     else is text, escaped. The hidden words ("over", "square root of") are
     what a screen reader says for a layout it cannot see (§33). */
  function mathHTML(s) {
    s = String(s == null ? "" : s);
    var i = 0, out = "", buf = "";
    function group() {
      if (s[i] !== "{") return "";
      var depth = 0, start = i + 1;
      for (; i < s.length; i++) {
        if (s[i] === "{") depth++;
        else if (s[i] === "}" && --depth === 0) { var inner = s.slice(start, i); i++; return inner; }
      }
      return s.slice(start);
    }
    function flush() { out += esc(buf); buf = ""; }
    while (i < s.length) {
      if (s[i] === "\\") {
        var m = /^\\(frac|sqrt|cbrt)/.exec(s.slice(i));
        if (m) {
          flush();
          i += m[0].length;
          if (m[1] === "frac") {
            var a = group(), b = group();
            out += '<span class="mx-frac"><span class="mx-num">' + mathHTML(a) +
              '</span><span class="sr"> over </span><span class="mx-den">' + mathHTML(b) + "</span></span>";
          } else {
            var r = group();
            out += '<span class="mx-root"><span aria-hidden="true">' + (m[1] === "cbrt" ? "∛" : "√") +
              '</span><span class="sr">' + (m[1] === "cbrt" ? "cube root of " : "square root of ") +
              '</span><span class="mx-rad">' + mathHTML(r) + '</span><span class="sr">, end root</span></span>';
          }
          continue;
        }
      }
      if ((s[i] === "^" || s[i] === "_") && s[i + 1] === "{") {
        var tag = s[i] === "^" ? "sup" : "sub";
        flush();
        i++;
        out += "<" + tag + ">" + mathHTML(group()) + "</" + tag + ">";
        continue;
      }
      buf += s[i];
      i++;
    }
    flush();
    return out;
  }

  function promptHTML(blocks) {
    return (blocks || []).map(function (b) {
      if (b.math) {
        return '<div class="ex-math">' + b.math.map(function (line) {
          return "<div>" + mathHTML(line) + "</div>";
        }).join("") + "</div>";
      }
      return "<p>" + mathHTML(b.p) + "</p>";
    }).join("");
  }
  /* The same text with the markup reduced to something that reads on one
     line — for the review list, where a stacked fraction would not fit. */
  function flat(s) {
    return String(s || "")
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, function (m, a, b) {
        var wrap = function (x) { return /^[\w.²³⁴π]+$/.test(x) ? x : "(" + x + ")"; };
        return wrap(a) + "/" + wrap(b);
      })
      .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
      .replace(/\\cbrt\{([^{}]*)\}/g, "∛($1)")
      .replace(/\^\{([^{}]*)\}/g, "^($1)")
      .replace(/_\{([^{}]*)\}/g, "$1");
  }

  /* ===================================================== Content: specs
     Both come from the API (api/src/routes/assessments.js). The list is
     cards — the rules, and no question. The questions arrive only when a
     student opens an assessment that was set for them and has opened; the
     server refuses everyone else, and no copy of them ships with the app.

     §32 still holds: while a sitting is running its questions are kept on
     this device, so a refresh with no connection can resume it, and they are
     removed the moment it is submitted. The list is kept too — it holds no
     question. */
  function kept(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; }
  }
  function keep(key, v) {
    try {
      if (v == null) localStorage.removeItem(key);
      else localStorage.setItem(key, typeof v === "string" ? v : JSON.stringify(v));
    } catch (e) { /* full or blocked */ }
  }
  function specKey(accountId, id) { return LOCAL + accountId + ".spec." + id; }
  function listKey(accountId) { return LOCAL + accountId + ".list"; }
  function lostConnection(e) { return !e || e.status === 0; }

  var specs = {};
  function spec(id) {
    var me = ME;
    if (!specs[id]) {
      specs[id] = (API ? API.assessments.get(id) : Promise.reject({ status: 0 })).then(function (a) {
        return a.spec;
      }, function (e) {
        // Only a lost connection falls back to the copy kept for a running
        // sitting. A refusal from the server is a refusal.
        var copy = lostConnection(e) && me ? kept(specKey(me.id, id)) : null;
        if (copy) return copy;
        throw e;
      }).then(function (raw) {
        var s = prepare(JSON.parse(JSON.stringify(raw)));
        s.raw = JSON.stringify(raw);
        return s;
      }).catch(function (e) { delete specs[id]; throw e; });
    }
    return specs[id];
  }
  /* Keep the questions on this device for as long as a sitting runs. */
  function holdSpec(s, sess) {
    if (s && s.raw && sess) keep(specKey(sess.account, sess.id), sess.status === "active" ? s.raw : null);
  }
  function prepare(s) {
    var tasks = [];
    (s.stages || []).forEach(function (st) {
      (st.tasks || []).forEach(function (t) {
        t.stage = st;
        t.n = tasks.length + 1;
        t.response = t.response || { type: "constructed", fields: [{ id: "answer", label: "Answer" }] };
        tasks.push(t);
      });
    });
    s.tasks = tasks;
    return card_(s);
  }
  /* A list card and a full spec answer the same questions the same way. */
  function card_(c) {
    c.policy = c.policy || {};
    c.policy.tools = c.policy.tools || {};
    c.course = c.course || { name: "" };
    c.kind = c.kind || "Assessment";
    return c;
  }
  function taskTotal(s) { return s.tasks ? s.tasks.length : (s.taskCount || 0); }

  function manifest() {
    var me = ME;
    if (!API) return Promise.reject({ status: 0 });
    return API.assessments.mine().then(function (cards) {
      if (me) keep(listKey(me.id), cards);
      return cards.map(card_);
    }, function (e) {
      var copy = lostConnection(e) && me ? kept(listKey(me.id)) : null;
      if (copy) return copy.map(card_);
      throw e;
    });
  }
  function openWindow(c) {
    var t = Date.now();
    if (c.opensAt && c.opensAt > t) return { state: "later", at: c.opensAt };
    if (c.closesAt && c.closesAt < t) return { state: "closed", at: c.closesAt };
    return { state: "open" };
  }

  /* ================================================================ Clock
     The server's time, learned from the stamp on every write it accepts.
     A student whose laptop runs ten minutes slow still gets ninety minutes,
     not eighty. */
  var skew = 0, skewKnown = false;
  function now() { return Date.now() + skew; }
  function learnClock(serverAt) {
    if (!serverAt) return;
    skew = serverAt - Date.now();
    skewKnown = true;
  }

  /* ============================================================== Session
     §70. One record per student per assessment:

       status       ready · active · submitted
       startedAt    the server's time the clock started
       expiresAt    startedAt + the sitting's length
       submittedAt, endedBy   "student" or "time"
       current      the task on screen, so a refresh lands on it
       responses    { taskId: { v, at } } — each answer and when it changed
       flags        { taskId: { on, at } } — marked for review
       events       [[type, at, detail]] — §71, neutral words only
       tools        { calculator: n, reference: n } — times opened
       at           when anything last changed

     It lives on this device first — written on every change, so nothing a
     student typed is ever only in memory — and on their account as the
     progress scope exam:<id>, which only they can write and their teachers
     can read. */
  var RANK = { ready: 0, active: 1, submitted: 2 };

  function blank(s, me) {
    return {
      v: 1, id: s.id, version: s.version || "1", account: me.id,
      status: "ready", startedAt: null, expiresAt: null, submittedAt: null, endedBy: null,
      at: 0, current: 0, responses: {}, flags: {}, events: [], tools: {}
    };
  }

  /* Two copies of one sitting — this device's and the server's, or two
     tabs' — become one without losing anything either holds: the earlier
     start, the furthest status, the newer version of each answer. */
  function merge(a, b) {
    if (!a || !a.v) return b && b.v ? clone(b) : null;
    if (!b || !b.v) return clone(a);
    var hi = (a.at || 0) >= (b.at || 0) ? a : b, lo = hi === a ? b : a;
    var out = clone(hi);
    if (lo.startedAt && (!out.startedAt || lo.startedAt < out.startedAt)) {
      out.startedAt = lo.startedAt;
      out.expiresAt = lo.expiresAt;
    }
    if ((RANK[lo.status] || 0) > (RANK[out.status] || 0)) out.status = lo.status;
    if (lo.submittedAt && (!out.submittedAt || lo.submittedAt < out.submittedAt)) {
      out.submittedAt = lo.submittedAt;
      out.endedBy = lo.endedBy;
    }
    ["responses", "flags"].forEach(function (k) {
      out[k] = out[k] || {};
      Object.keys(lo[k] || {}).forEach(function (id) {
        var x = lo[k][id], y = out[k][id];
        if (!y || (x.at || 0) > (y.at || 0)) out[k][id] = clone(x);
      });
    });
    var seen = {};
    out.events = (out.events || []).concat(lo.events || []).filter(function (e) {
      var key = e[0] + "@" + e[1];
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).sort(function (x, y) { return x[1] - y[1]; }).slice(-300);
    out.tools = out.tools || {};
    Object.keys(lo.tools || {}).forEach(function (k) {
      out.tools[k] = Math.max(out.tools[k] || 0, lo.tools[k] || 0);
    });
    out.at = Math.max(a.at || 0, b.at || 0);
    return out;
  }

  function localKey(accountId, id) { return LOCAL + accountId + "." + id; }
  function readLocal(accountId, id) {
    try { return JSON.parse(localStorage.getItem(localKey(accountId, id)) || "null"); }
    catch (e) { return null; }
  }
  function writeLocal(sess) {
    try { localStorage.setItem(localKey(sess.account, sess.id), JSON.stringify(sess)); return true; }
    catch (e) { return false; }
  }
  /* What the server has acknowledged, per sitting, so a copy that never got
     there — a submission made offline, then the page closed — is sent the
     next time this student is here, sitting open or not. */
  function sentKey(accountId, id) { return LOCAL + "sent." + accountId + "." + id; }
  function markSent(accountId, id, at) {
    try { localStorage.setItem(sentKey(accountId, id), String(at || 0)); } catch (e) { /* blocked */ }
  }
  function unsent(sess) {
    var at = 0;
    try { at = Number(localStorage.getItem(sentKey(sess.account, sess.id)) || 0); } catch (e) { at = 0; }
    return (sess.at || 0) > at;
  }
  function drain(accountId, id) {
    if (!API || (R && R.sess.id === id)) return Promise.resolve();
    var local = readLocal(accountId, id);
    if (!local || !unsent(local)) return Promise.resolve();
    return fetchServer(id).then(function (srv) {
      var m = merge(local, srv.state);
      return API.progress.put(SCOPE + id, m, null, srv.at).then(function () {
        writeLocal(m);
        markSent(accountId, id, m.at);
      });
    }).catch(function () { /* still offline; the next arrival tries again */ });
  }
  function drainAll() {
    if (!ME) return;
    var me = ME;
    manifest().then(function (entries) {
      entries.forEach(function (x) { drain(me.id, x.id); });
    }, function () { /* no manifest, nothing known to send */ });
  }

  function fetchServer(id) {
    if (!API) return Promise.reject(new Error("no api"));
    return API.progress.one(SCOPE + id).then(function (row) {
      return row ? { state: row.state, at: row.updatedAt } : { state: null, at: 0 };
    });
  }
  /* Both copies, merged. `server` is false when it could not be asked. */
  function sessionFor(s, me) {
    var local = readLocal(me.id, s.id);
    return fetchServer(s.id).then(function (srv) {
      return { sess: merge(local, srv.state) || blank(s, me), base: srv.at, server: true };
    }, function () {
      return { sess: local || blank(s, me), base: null, server: false };
    });
  }

  function answeredState(task, r) {
    var v = r && r.v, resp = task.response;
    if (resp.type === "choice") return v != null && v !== "" ? "done" : "none";
    var fields = resp.fields || [];
    var filled = fields.filter(function (f) { return v && String(v[f.id] || "").trim(); }).length;
    var points = v && v.graph && v.graph.points ? v.graph.points.length : 0;
    var graphDone = !resp.graph || points >= 2;
    if (fields.length && filled === fields.length && graphDone) return "done";
    if (!fields.length && resp.graph && graphDone) return "done";
    var any = filled || points || (v && String(v.work || "").trim());
    return any ? "part" : "none";
  }
  function answeredCount(s, sess) {
    return s.tasks.filter(function (t) { return answeredState(t, sess.responses[t.id]) === "done"; }).length;
  }

  /* ==================================================== The open sitting
     One at a time. R holds everything about it; nothing else in this file
     keeps state about a sitting. */
  var ME = null, R = null, HUB = null;

  function event(type, detail) {
    if (!R) return;
    var e = [type, now()];
    if (detail != null) e.push(detail);
    R.sess.events.push(e);
    if (R.sess.events.length > 300) R.sess.events.splice(0, R.sess.events.length - 300);
  }

  /* Every change comes through here: written to this device before this
     function returns, then to the account a moment later (§30). */
  function changed(immediate) {
    if (!R) return;
    R.sess.at = now();
    if (R.spec && R.spec.tasks) R.sess.answered = answeredCount(R.spec, R.sess);
    R.local = writeLocal(R.sess);
    setSave("saving");
    clearTimeout(R.debounce);
    R.debounce = setTimeout(push, immediate ? 0 : 650);
  }

  function push() {
    var r = R;
    if (!r || !API) return;
    if (r.inflight) { r.again = true; return; }
    r.inflight = true;
    clearTimeout(r.retry);
    var ready = r.base == null
      ? fetchServer(r.sess.id).then(function (srv) {
          r.base = srv.at;
          if (srv.state) {
            r.sess = merge(r.sess, srv.state);
            writeLocal(r.sess);
            if (R === r) paintTrack();     // another device's answers show up here too
          }
        })
      : Promise.resolve();
    var sent = null;
    ready.then(function () {
      sent = r.sess.at;
      return API.progress.put(SCOPE + r.sess.id, r.sess, null, r.base);
    }).then(function (res) {
      r.base = res.updatedAt;
      var before = skew, firstClock = !skewKnown;
      learnClock(res.updatedAt);
      calibrate(r, before, firstClock);
      r.tries = 0;
      r.synced = sent;
      markSent(r.sess.account, r.sess.id, sent);
      if (r.offline) {
        r.offline = false;
        event("ONLINE");
        notice("You're back online. Your answers are saved.", "ok");
        r.again = true;
      }
      if (r.sess.at === sent) setSave("saved");
    }, function (e) {
      if (e && e.status === 409 && r.tries < 4) {
        r.tries++;
        r.base = null;          // fetch theirs, merge, write again
        r.again = true;
        return;
      }
      if (!e || e.status === 0) {
        if (!r.offline) {
          r.offline = true;
          event("OFFLINE");
          r.sess.at = now();
          writeLocal(r.sess);
          notice("Connection interrupted. Your answers are saved on this device and will be sent " +
                 "when you're back online.", "warn", true);
        }
        setSave("offline");
      } else {
        setSave("error");
      }
      r.tries = (r.tries || 0) + 1;
      r.retry = setTimeout(push, Math.min(20000, 1500 * Math.pow(2, Math.min(r.tries, 4))));
    }).then(function () {
      r.inflight = false;
      if (r.again && R === r) { r.again = false; push(); }
    });
  }

  /* The clock was started before this device had heard the server's time.
     If the two disagree, the start moves by the difference, so the sitting
     is exactly as long as the policy says. */
  function calibrate(r, before, firstClock) {
    if (!firstClock || !r.uncalibrated || !r.sess.startedAt) return;
    r.uncalibrated = false;
    var d = skew - before;
    if (Math.abs(d) < 1500) return;
    r.sess.startedAt += d;
    r.sess.expiresAt += d;
    r.sess.at = now();
    writeLocal(r.sess);
    r.again = true;
  }

  window.addEventListener("online", function () { if (R) push(); else drainAll(); });
  window.addEventListener("pagehide", function () {
    if (!R || !API) return;
    writeLocal(R.sess);
    if (R.synced !== R.sess.at && R.base != null) {
      API.progress.beacon(SCOPE + R.sess.id, R.sess, R.base);
    }
  });
  /* §71: leaving the page is noted, in neutral words, while a sitting is
     running — and only then. Nothing is recorded about anything else. */
  document.addEventListener("visibilitychange", function () {
    if (!R || R.sess.status !== "active" || !R.policy.noteLeaving) return;
    if (document.visibilityState === "hidden") {
      R.leftAt = now();
      event("LEFT_PAGE");
      writeLocal(R.sess);
      if (API && R.base != null) API.progress.beacon(SCOPE + R.sess.id, R.sess, R.base);
    } else if (R.leftAt) {
      event("RETURNED", Math.round((now() - R.leftAt) / 1000));
      R.leftAt = null;
      changed();
    }
  });

  /* Browser Back inside a running sitting stays in it. The entry it would
     have gone to is put back, and the student is told how to finish. This
     runs before the app's own listener, which never hears about it. */
  function guardBack() {
    if (!R || R.guarded) return;
    R.guarded = true;
    try { history.pushState({ exGuard: 1 }, ""); } catch (e) { /* sandboxed frame */ }
  }
  window.addEventListener("popstate", function (e) {
    if (!R || R.sess.status !== "active") return;
    e.stopImmediatePropagation();
    R.guarded = false;
    guardBack();
    notice("You're in an assessment. When you're done, submit it from Review.", "info");
  });

  /* ============================================================= Overlay
     A sitting takes the whole window. Everything behind it is made inert —
     unreachable by keyboard, pointer or screen reader — so the tutor, the
     app's navigation and its notifications are simply not there (§6, §38). */
  function overlay() {
    var o = document.getElementById("exam");
    if (!o) {
      o = el("div", "ex");
      o.id = "exam";
      o.setAttribute("role", "dialog");
      o.setAttribute("aria-modal", "true");
      document.body.appendChild(o);
    }
    [].forEach.call(document.body.children, function (n) {
      if (n === o || n.tagName === "SCRIPT" || n.hasAttribute("inert")) return;
      n.setAttribute("inert", "");
      n.setAttribute("data-ex-inert", "");
    });
    document.body.classList.add("ex-on");
    return o;
  }
  function dropOverlay() {
    var o = document.getElementById("exam");
    if (o) o.remove();
    [].forEach.call(document.querySelectorAll("[data-ex-inert]"), function (n) {
      n.removeAttribute("inert");
      n.removeAttribute("data-ex-inert");
    });
    document.body.classList.remove("ex-on");
  }
  function setUrl(id) {
    try {
      var u = new URL(location.href);
      if (id) u.searchParams.set("exam", id); else u.searchParams.delete("exam");
      history.replaceState(history.state, "", u.pathname + u.search + u.hash);
    } catch (e) { /* sandboxed frame */ }
  }

  /* ================================================================= Hub
     The Exams tab. Real assessments, each with the one fact that matters:
     can I begin, how far am I, or is it in. No sample data — a list of
     exams nobody set is worse than an empty one. */
  function hub(host, me) {
    ME = me;
    HUB = host;
    host.innerHTML = "";
    host.appendChild(el("header", "exh-head", '<h1 class="lx-h1">Exams</h1>'));
    var list = el("div", "exh-list");
    list.innerHTML = '<div class="exh-card exh-skel" aria-hidden="true"><i></i><i></i><i></i></div>';
    host.appendChild(list);

    manifest().then(function (cards) {
      return Promise.all(cards.map(function (c) {
        return sessionFor(c, me).then(function (x) {
          return { entry: c, spec: c, sess: x.sess };
        });
      }));
    }).then(function (items) {
      if (HUB !== host) return;
      items = items.filter(Boolean);
      list.innerHTML = "";
      badge(items);
      if (!items.length) {
        list.appendChild(el("div", "exh-empty",
          icon("check") + "<h2>No exams right now.</h2>" +
          "<p>When your teacher sets one, it appears here with everything you need to know before you start.</p>"));
        return;
      }
      var open = items.filter(function (x) { return x.sess.status !== "submitted"; });
      var done = items.filter(function (x) { return x.sess.status === "submitted"; });
      open.forEach(function (x) { list.appendChild(hubCard(x)); });
      if (!open.length) {
        list.appendChild(el("div", "exh-clear", icon("check") +
          "<div><b>You're all caught up.</b><span>Anything new your teacher sets appears here.</span></div>"));
      }
      if (done.length) {
        var sec = el("section", "exh-done");
        sec.appendChild(el("h2", "exh-h2", "Submitted"));
        done.sort(function (a, b) { return b.sess.submittedAt - a.sess.submittedAt; });
        done.forEach(function (x) {
          var row = el("button", "exh-row");
          row.type = "button";
          row.innerHTML = '<span class="exh-row-ic">' + icon("check") + "</span>" +
            '<span class="exh-row-t"><b>' + esc(x.spec.title) + "</b><span>Submitted " +
            esc(when(x.sess.submittedAt, true)) + "</span></span>" +
            '<span class="exh-row-s">Results not released yet</span>';
          row.addEventListener("click", function () { open_(x.spec.id); });
          sec.appendChild(row);
        });
        list.appendChild(sec);
      }
    }, function () {
      if (HUB !== host) return;
      list.innerHTML = "";
      var err = el("div", "exh-empty",
        icon("offline") + "<h2>Your exams could not be loaded.</h2>" +
        "<p>Check your connection, then try again.</p>");
      var again = el("button", "ex-btn", "Try again");
      again.type = "button";
      again.addEventListener("click", function () { hub(host, me); });
      err.appendChild(again);
      list.appendChild(err);
    });
  }

  function facts(s) {
    var p = s.policy, out = [];
    if (p.durationMinutes) out.push([icon("clock"), plural(p.durationMinutes, "minute")]);
    out.push([icon("tasks"), plural(taskTotal(s), "task")]);
    if (p.tools.calculator) out.push([icon("calc"), "Calculator"]);
    if (p.tools.referenceSheet) out.push([icon("ref"), "Reference sheet"]);
    return '<ul class="exh-facts">' + out.map(function (f) {
      return "<li>" + f[0] + "<span>" + esc(f[1]) + "</span></li>";
    }).join("") + "</ul>";
  }

  function hubCard(x) {
    var s = x.spec, sess = x.sess, win = openWindow(x.entry);
    var active = sess.status === "active";
    var expired = active && sess.expiresAt && sess.expiresAt <= now();
    var card = el("article", "exh-card" + (active ? " is-active" : ""));
    var pill = active ? (expired ? '<span class="exh-pill end">Time ended</span>' : '<span class="exh-pill live">In progress</span>')
      : win.state === "later" ? '<span class="exh-pill">Opens ' + esc(when(win.at, true)) + "</span>"
      : win.state === "closed" ? '<span class="exh-pill">Closed</span>'
      : '<span class="exh-pill ready">Ready</span>';
    card.innerHTML =
      '<div class="exh-top"><span class="exh-course">' + esc(s.course.name) + " · " + esc(s.kind) + "</span>" + pill + "</div>" +
      '<h2 class="exh-title">' + esc(s.title) + "</h2>" +
      '<p class="exh-sum">' + esc(s.summary) + "</p>" +
      facts(s);
    var act = el("div", "exh-act");
    if (active && !expired) {
      var n = sess.answered || 0, total = taskTotal(s);
      var pct = total ? Math.round(n / total * 100) : 0;
      act.innerHTML = '<div class="exh-prog"><span>' + n + " of " + total + " answered · " +
        esc(left(sess.expiresAt - now())) + '</span><i><b style="width:' + pct + '%"></b></i></div>';
    }
    var go = el("button", "ex-btn primary lg");
    go.type = "button";
    go.innerHTML = (active ? (expired ? "See what happened" : "Resume") : "Begin") + icon("right");
    go.disabled = !active && win.state !== "open";
    go.addEventListener("click", function () { open_(s.id); });
    act.appendChild(go);
    card.appendChild(act);
    return card;
  }

  /* A quiet dot on the Exams tab while something is waiting to be started or
     finished. A count would be one more number to read; a dot is enough. */
  function badge(items) {
    var nav = document.getElementById("navExams");
    if (!nav) return;
    var waiting = items.some(function (x) {
      return x.sess.status !== "submitted" && openWindow(x.entry).state === "open";
    });
    nav.classList.toggle("ex-waiting", waiting);
  }

  /* ============================================================= Opening */
  function open_(id, how) {
    if (!ME) return Promise.resolve();
    var me = ME;
    var o = overlay();
    o.className = "ex is-loading";
    o.innerHTML = '<div class="ex-wait" role="status"><span class="ex-spin" aria-hidden="true"></span>Opening your assessment…</div>';
    setUrl(id);
    return spec(id).then(function (s) {
      return sessionFor(s, me).then(function (x) { start(s, x.sess, x.base, how); });
    }).catch(function (e) {
      o.className = "ex";
      o.innerHTML = "";
      var refused = e && (e.status === 403 || e.status === 404);
      var box = el("div", "ex-fail", icon(refused ? "lock" : "offline") +
        "<h1>" + (refused ? "This assessment isn't open to you." : "This assessment could not be opened.") + "</h1>" +
        "<p>" + (refused ? "It may not have opened yet, or it was not set for you. Your teacher can tell you when." :
          "Your connection may have dropped. Nothing you have done is lost.") + "</p>");
      var row = el("div", "ex-fail-act");
      var again = el("button", "ex-btn primary", "Try again");
      again.type = "button";
      again.addEventListener("click", function () { open_(id, how); });
      var back = el("button", "ex-btn", "Back to OEdu");
      back.type = "button";
      back.addEventListener("click", function () { close(); });
      row.appendChild(again);
      row.appendChild(back);
      box.appendChild(row);
      o.appendChild(box);
      again.focus();
    });
  }

  function start(s, sess, base, how) {
    clearTimers();
    R = {
      spec: s, sess: sess, base: base == null ? null : base, policy: s.policy,
      tries: 0, local: true, synced: base ? sess.at : null,
      tool: null, dir: 1
    };
    var o = document.getElementById("exam") || overlay();
    o.setAttribute("aria-label", s.title);
    if (sess.status === "active" && sess.expiresAt && sess.expiresAt <= now()) {
      /* The clock ran out while the page was closed. The answers given
         before then stand, and are submitted as of that moment. */
      finish("time", sess.expiresAt);
      return;
    }
    if (sess.status === "submitted") { drawDone(); return; }
    if (sess.status === "active") {
      holdSpec(s, sess);
      event("RESUMED");
      changed(true);
      drawRunner();
      if (how === "resume") notice("Your session has been restored.", "ok");
      return;
    }
    drawBriefing();
  }

  function clearTimers() {
    if (!R) return;
    clearTimeout(R.debounce);
    clearTimeout(R.retry);
    clearInterval(R.ticker);
    clearTimeout(R.noticeT);
  }

  /* Closing the window onto a sitting — never the sitting itself. */
  function close(silent) {
    var had = R;
    if (had) {
      writeLocal(had.sess);
      clearTimeout(had.debounce);
      clearTimeout(had.retry);
      clearInterval(had.ticker);
      clearTimeout(had.noticeT);
    }
    R = null;
    if (had && had.synced !== had.sess.at && ME) drain(ME.id, had.sess.id);
    dropOverlay();
    setUrl(null);
    document.removeEventListener("keydown", keys, true);
    if (!silent && ME) {
      var me = ME;
      manifest().then(function (entries) {
        badgeQuick(entries, me);
      }, function () { /* the dot stays as it was */ });
    }
    if (!silent && HUB && HUB.isConnected && ME) hub(HUB, ME);
  }

  /* ============================================================ Briefing
     §27, §28, §63: everything the student needs to know before the clock
     starts — generated from the policy, so it cannot say one thing while the
     runtime does another. */
  function drawBriefing() {
    var s = R.spec, p = R.policy;
    var o = document.getElementById("exam");
    o.className = "ex is-brief";
    o.innerHTML = "";
    document.addEventListener("keydown", keys, true);

    var have = [];
    if (p.durationMinutes) have.push(["clock", plural(p.durationMinutes, "minute"), "The timer starts when you begin."]);
    if (p.tools.calculator) have.push(["calc", "Calculator", "In the top bar, whenever you need it."]);
    if (p.tools.referenceSheet) have.push(["ref", "Reference sheet", "Formulas and conversions, beside your task."]);
    var cant = [];
    if (p.internet === false) cant.push("Use other websites or apps");
    if (p.ai === false) cant.push("Use AI tools or anyone else's help");
    if (p.leave === false) cant.push("Leave the assessment once it starts");
    cant.push("Change your answers after you submit");

    var how = [
      plural(s.tasks.length, "task") + ", one at a time. " +
        (p.navigation === "linear" ? "Each one is final when you continue." :
          "Move between them freely until you submit."),
      "Your work saves as you go. If your connection drops or this page closes, you'll pick up " +
        "where you left off" + (p.durationMinutes ? " — the timer keeps running." : "."),
      p.feedback === "none" ? "You won't see whether answers are right. Your teacher releases results." : null,
      p.noteLeaving ? "Switching to another tab or app is noted in your session." : null
    ].filter(Boolean);

    var wrap = el("div", "exb");
    var x = el("button", "ex-x", icon("close"));
    x.type = "button";
    x.setAttribute("aria-label", "Close — not now");
    x.addEventListener("click", function () { close(); });
    wrap.appendChild(x);

    var inner = el("div", "exb-in");
    inner.innerHTML =
      '<p class="exb-eyebrow">' + esc(s.course.name) + " · " + esc(s.kind) + "</p>" +
      '<h1 class="exb-title" tabindex="-1">' + esc(s.title) + "</h1>" +
      '<p class="exb-sum">' + esc(s.summary) + "</p>" +
      '<div class="exb-rules">' +
        '<section class="exb-have"><h2>You have</h2><ul>' + have.map(function (h) {
          return "<li>" + icon(h[0]) + "<div><b>" + esc(h[1]) + "</b><span>" + esc(h[2]) + "</span></div></li>";
        }).join("") + "</ul></section>" +
        '<section class="exb-cant"><h2>You can’t</h2><ul>' + cant.map(function (c) {
          return "<li>" + icon("ban") + "<div><b>" + esc(c) + "</b></div></li>";
        }).join("") + "</ul></section>" +
      "</div>" +
      '<section class="exb-how"><h2>How it works</h2><ul>' + how.map(function (h) {
        return "<li>" + esc(h) + "</li>";
      }).join("") + "</ul></section>";
    var go = el("div", "exb-go");
    var begin = el("button", "ex-btn primary xl", "Begin assessment" + icon("right"));
    begin.type = "button";
    begin.addEventListener("click", begin_);
    go.appendChild(begin);
    go.appendChild(el("p", null, "Make sure you're ready." +
      (p.durationMinutes ? " Your timer begins when you start." : "")));
    inner.appendChild(go);
    wrap.appendChild(inner);
    o.appendChild(wrap);
    requestAnimationFrame(function () { var h = o.querySelector(".exb-title"); if (h) h.focus(); });
  }

  function begin_() {
    if (!R || R.sess.status !== "ready") return;
    var t = now();
    R.sess.status = "active";
    R.sess.startedAt = t;
    R.sess.expiresAt = R.policy.durationMinutes ? t + R.policy.durationMinutes * 60000 : null;
    R.sess.current = 0;
    R.uncalibrated = !skewKnown;
    holdSpec(R.spec, R.sess);
    event("STARTED");
    changed(true);
    drawRunner(true);
  }

  /* ============================================================== Runner */
  function drawRunner(entering) {
    var s = R.spec, p = R.policy;
    var o = document.getElementById("exam");
    o.className = "ex is-run" + (entering && !reduced() ? " is-entering" : "");
    o.innerHTML = "";
    document.addEventListener("keydown", keys, true);

    /* The bar: who, tools, and the three facts a student glances at — saved,
       time, how far. Nothing else. */
    var bar = el("header", "ex-bar");
    var who = el("div", "ex-who",
      '<svg class="ex-mark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/></svg>' +
      '<span class="ex-name">' + esc(s.title) + "</span>");
    bar.appendChild(who);

    var tools = el("div", "ex-tools");
    if (p.tools.calculator) tools.appendChild(toolButton("calculator", "calc", "Calculator"));
    if (p.tools.referenceSheet) tools.appendChild(toolButton("reference", "ref", "Reference"));
    bar.appendChild(tools);

    var stat = el("div", "ex-stat");
    stat.appendChild(el("span", "ex-save", ""));
    if (R.sess.expiresAt) {
      var timer = el("button", "ex-timer");
      timer.type = "button";
      timer.addEventListener("click", toggleTimer);
      stat.appendChild(timer);
    }
    var mapBtn = el("button", "ex-mapbtn");
    mapBtn.type = "button";
    mapBtn.setAttribute("aria-haspopup", "dialog");
    mapBtn.addEventListener("click", function () { toggleMap(); });
    stat.appendChild(mapBtn);
    bar.appendChild(stat);
    o.appendChild(bar);

    /* The track: one segment per task, filled when that task is answered —
       answered, not visited (§14). */
    var track = el("div", "ex-track");
    track.setAttribute("aria-hidden", "true");
    s.tasks.forEach(function (t, i) {
      var seg = el("button", "ex-seg");
      seg.type = "button";
      seg.tabIndex = -1;
      seg.addEventListener("click", function () { go(i); });
      track.appendChild(seg);
    });
    o.appendChild(track);

    o.appendChild(el("div", "ex-notice", ""));

    var stage = el("main", "ex-stage");
    stage.appendChild(el("div", "ex-scroll"));
    var panel = el("aside", "ex-panel");
    panel.hidden = true;
    stage.appendChild(panel);
    o.appendChild(stage);

    var foot = el("footer", "ex-foot");
    var back = el("button", "ex-btn ghost ex-back", icon("left") + "<span>Back</span>");
    back.type = "button";
    back.addEventListener("click", function () { go(R.sess.current - 1); });
    var where = el("span", "ex-where", "");
    where.setAttribute("aria-live", "polite");
    var next = el("button", "ex-btn primary ex-next", "");
    next.type = "button";
    next.addEventListener("click", function () {
      if (R.sess.current >= s.tasks.length - 1) drawReview();
      else go(R.sess.current + 1);
    });
    foot.appendChild(back);
    foot.appendChild(where);
    foot.appendChild(next);
    o.appendChild(foot);

    o.appendChild(el("div", "sr ex-live", "")).setAttribute("aria-live", "polite");

    guardBack();
    clearInterval(R.ticker);
    R.ticker = setInterval(tick, 1000);
    tick();
    drawTask(false);
    paintTrack();
    setSave(R.synced === R.sess.at ? "saved" : R.offline ? "offline" : "saving");
  }

  function toolButton(id, ic, label) {
    var b = el("button", "ex-tool", icon(ic) + "<span>" + esc(label) + "</span>");
    b.type = "button";
    b.dataset.tool = id;
    b.setAttribute("aria-expanded", "false");
    b.addEventListener("click", function () { openTool(R.tool === id ? null : id); });
    return b;
  }

  /* Move to a task. Back never destroys work (§40); nothing here does. */
  function go(i) {
    if (!R) return;
    var n = R.spec.tasks.length;
    if (i < 0 || i >= n) return;
    closeMap();
    if (i === R.sess.current && document.querySelector(".ex-card")) return;
    R.dir = i > R.sess.current ? 1 : -1;
    R.sess.current = i;
    changed();
    drawTask(true);
    paintTrack();
  }

  function drawTask(animate) {
    var s = R.spec, total = s.tasks.length;
    R.sess.current = Math.min(Math.max(0, R.sess.current | 0), total - 1);
    var t = s.tasks[R.sess.current];
    var o = document.getElementById("exam");
    var scroll = o.querySelector(".ex-scroll");
    scroll.innerHTML = "";

    var card = el("article", "ex-card" + (animate && !reduced() ? (R.dir > 0 ? " in-next" : " in-prev") : ""));
    var top = el("div", "ex-card-top");
    var eyebrow = (t.stage && t.stage.title ? esc(t.stage.title) + " · " : "") + "Task " + t.n;
    top.appendChild(el("span", "ex-eyebrow", eyebrow));
    var flagged = R.sess.flags[t.id] && R.sess.flags[t.id].on;
    var flag = el("button", "ex-flag" + (flagged ? " on" : ""), icon("flag") + "<span>" +
      (flagged ? "Marked for review" : "Mark for review") + "</span>");
    flag.type = "button";
    flag.setAttribute("aria-pressed", String(!!flagged));
    flag.addEventListener("click", function () {
      var on = !(R.sess.flags[t.id] && R.sess.flags[t.id].on);
      R.sess.flags[t.id] = { on: on, at: now() };
      flag.classList.toggle("on", on);
      flag.setAttribute("aria-pressed", String(on));
      flag.lastChild.textContent = on ? "Marked for review" : "Mark for review";
      changed();
      paintTrack();
    });
    top.appendChild(flag);
    card.appendChild(top);

    var prompt = el("div", "ex-prompt", '<span class="sr">Task ' + t.n + " of " + total + ". </span>" +
      promptHTML(t.prompt));
    prompt.id = "ex-prompt";
    prompt.tabIndex = -1;
    card.appendChild(prompt);

    var body = el("div", "ex-response");
    body.appendChild(interaction(t));
    card.appendChild(body);
    scroll.appendChild(card);
    scroll.scrollTop = 0;

    var last = R.sess.current === total - 1;
    o.querySelector(".ex-back").disabled = R.sess.current === 0;
    o.querySelector(".ex-next").innerHTML = last ? "<span>Review answers</span>" + icon("right")
                                                  : "<span>Continue</span>" + icon("right");
    o.querySelector(".ex-where").textContent = (last ? "Final task · " : "") + t.n + " of " + total;
    requestAnimationFrame(function () { prompt.focus({ preventScroll: true }); });
  }

  function paintTrack() {
    var o = document.getElementById("exam");
    if (!o || !R) return;
    var s = R.spec, segs = o.querySelectorAll(".ex-seg");
    s.tasks.forEach(function (t, i) {
      var st = answeredState(t, R.sess.responses[t.id]);
      var seg = segs[i];
      if (!seg) return;
      seg.className = "ex-seg " + st + (i === R.sess.current ? " cur" : "") +
        (R.sess.flags[t.id] && R.sess.flags[t.id].on ? " flag" : "");
    });
    var n = answeredCount(s, R.sess);
    var mb = o.querySelector(".ex-mapbtn");
    if (mb) {
      mb.innerHTML = icon("tasks") + "<span><b>" + n + "</b> of " + s.tasks.length + "</span>";
      mb.setAttribute("aria-label", n + " of " + s.tasks.length + " answered. Show all tasks");
    }
  }

  function setAnswer(t, v) {
    R.sess.responses[t.id] = { v: v, at: now() };
    changed();
    paintTrack();
  }

  /* ======================================================== Interactions
     §52. Each takes a task and the answer so far, and reports changes. The
     spec chooses; nothing here decides what a task should be. */
  function interaction(t) {
    var r = R.sess.responses[t.id], v = r ? r.v : null;
    if (t.response.type === "choice") return choiceInput(t, v);
    return constructedInput(t, v || {});
  }

  function choiceInput(t, v) {
    var fs = el("fieldset", "ex-choices");
    fs.appendChild(el("legend", "sr", "Choose one answer"));
    t.response.options.forEach(function (opt, i) {
      var id = "ex-" + t.id + "-" + i;
      var lab = el("label", "ex-choice" + (v === i ? " on" : ""));
      lab.setAttribute("for", id);
      var inp = el("input");
      inp.type = "radio";
      inp.name = "ex-" + t.id;
      inp.id = id;
      inp.value = String(i);
      inp.checked = v === i;
      inp.addEventListener("change", function () {
        [].forEach.call(fs.querySelectorAll(".ex-choice"), function (c) { c.classList.remove("on"); });
        lab.classList.add("on");
        setAnswer(t, i);
      });
      lab.appendChild(inp);
      lab.appendChild(el("span", "ex-key", String.fromCharCode(65 + i)));
      lab.appendChild(el("span", "ex-opt", mathHTML(opt)));
      fs.appendChild(lab);
    });
    return fs;
  }

  function constructedInput(t, v) {
    var resp = t.response, box = el("div", "ex-built");
    var val = clone(v);
    function save() { setAnswer(t, clone(val)); }

    if (resp.graph) {
      box.appendChild(graphInput(resp.graph, val.graph, function (g) { val.graph = g; save(); }));
    }
    if (resp.work) {
      var w = el("label", "ex-work");
      w.appendChild(el("span", "ex-lbl", esc(resp.work)));
      var ta = el("textarea", "ex-ta math");
      ta.rows = 5;
      ta.value = val.work || "";
      ta.setAttribute("spellcheck", "false");
      ta.addEventListener("input", function () { val.work = ta.value; grow(ta); save(); });
      w.appendChild(ta);
      box.appendChild(w);
      requestAnimationFrame(function () { grow(ta); });
    }
    var fields = el("div", "ex-fields" + ((resp.fields || []).length > 1 ? " multi" : ""));
    (resp.fields || []).forEach(function (f) {
      var lab = el("label", "ex-field");
      lab.appendChild(el("span", "ex-lbl", mathHTML(f.label)));
      var inp = el("input", "ex-in math");
      inp.type = "text";
      inp.autocomplete = "off";
      inp.setAttribute("spellcheck", "false");
      inp.value = val[f.id] || "";
      inp.addEventListener("input", function () { val[f.id] = inp.value; save(); });
      lab.appendChild(inp);
      fields.appendChild(lab);
    });
    box.appendChild(fields);
    box.appendChild(symbolBar(box));
    return box;
  }
  function grow(ta) {
    ta.style.height = "auto";
    ta.style.height = Math.min(420, Math.max(120, ta.scrollHeight + 2)) + "px";
  }

  /* Maths is hard to type. The symbols a written answer needs sit under the
     field that has focus, and insert where the cursor is. */
  var SYMBOLS = ["√", "∛", "²", "³", "^", "π", "±", "≤", "≥", "≠", "·", "÷", "∞", "θ", "i", "|"];
  function symbolBar(scope) {
    var bar = el("div", "ex-symbols");
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Insert a symbol");
    bar.hidden = true;
    var target = null;
    SYMBOLS.forEach(function (sym) {
      var b = el("button", "ex-sym", esc(sym));
      b.type = "button";
      b.tabIndex = -1;
      b.setAttribute("aria-label", "Insert " + sym);
      b.addEventListener("mousedown", function (e) { e.preventDefault(); });
      b.addEventListener("click", function () {
        if (!target) return;
        insertAt(target, sym);
      });
      bar.appendChild(b);
    });
    scope.addEventListener("focusin", function (e) {
      if (e.target.classList && e.target.classList.contains("math")) {
        target = e.target;
        bar.hidden = false;
        target.parentNode.insertBefore(bar, target.nextSibling);
      }
    });
    scope.addEventListener("focusout", function (e) {
      if (!scope.contains(e.relatedTarget)) { bar.hidden = true; }
    });
    return bar;
  }
  function insertAt(input, text) {
    var a = input.selectionStart == null ? input.value.length : input.selectionStart;
    var b = input.selectionEnd == null ? a : input.selectionEnd;
    input.value = input.value.slice(0, a) + text + input.value.slice(b);
    input.selectionStart = input.selectionEnd = a + text.length;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }

  /* ---------------------------------------------------------- The graph
     A task that says "graph" is answered with a graph (§10). The student
     chooses the x-axis scale — a grid ruled in π/8 would tell them the
     period before they worked it out — then places points, which are joined
     left to right with a smooth curve. Clicking a point again removes it;
     one point per column, because the thing being graphed is a function.

     The keyboard does everything the pointer does, and the points are also
     listed as text (§33, §34). */
  var SCALES = [
    { id: "pi/8", label: "π/8", den: 8 },
    { id: "pi/4", label: "π/4", den: 4 },
    { id: "pi/2", label: "π/2", den: 2 },
    { id: "1", label: "1", den: 0 }
  ];
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function xLabel(scaleId, k) {
    var sc = SCALES.filter(function (x) { return x.id === scaleId; })[0] || SCALES[0];
    if (!sc.den) return String(k).replace("-", "−");
    if (k === 0) return "0";
    var g = gcd(Math.abs(k), sc.den), n = k / g, d = sc.den / g;
    var num = (n === 1 ? "" : n === -1 ? "−" : String(n).replace("-", "−")) + "π";
    return d === 1 ? num : num + "/" + d;
  }
  function yLabel(j) { return String(j).replace("-", "−"); }

  function graphInput(cfg, value, onChange) {
    var X0 = cfg.xMin != null ? cfg.xMin : -2, X1 = cfg.xMax != null ? cfg.xMax : 14;
    var Y0 = cfg.yMin != null ? cfg.yMin : -8, Y1 = cfg.yMax != null ? cfg.yMax : 8;
    var C = 30, ML = 46, MT = 16, MR = 16, MB = 40;
    var W = ML + (X1 - X0) * C + MR, H = MT + (Y1 - Y0) * C + MB;
    var st = {
      scale: (value && value.scale) || (cfg.trig ? "pi/8" : "1"),
      points: value && value.points ? value.points.slice() : []
    };
    var cursor = [0, 0];

    var wrap = el("div", "ex-graph");
    var tools = el("div", "exg-tools");
    if (cfg.trig) {
      var seg = el("div", "exg-scale");
      seg.setAttribute("role", "radiogroup");
      seg.setAttribute("aria-label", "x-axis scale, per grid square");
      seg.appendChild(el("span", "exg-cap", "x-axis, per square"));
      SCALES.forEach(function (sc) {
        var b = el("button", "exg-sc", esc(sc.label));
        b.type = "button";
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", String(st.scale === sc.id));
        b.addEventListener("click", function () {
          st.scale = sc.id;
          [].forEach.call(seg.querySelectorAll(".exg-sc"), function (x) { x.setAttribute("aria-checked", "false"); });
          b.setAttribute("aria-checked", "true");
          draw();
          emit();
        });
        seg.appendChild(b);
      });
      tools.appendChild(seg);
    }
    var clear = el("button", "exg-clear", "Clear points");
    clear.type = "button";
    clear.addEventListener("click", function () { st.points = []; draw(); emit(); });
    tools.appendChild(clear);
    wrap.appendChild(tools);

    var NS = "http://www.w3.org/2000/svg";
    var svgEl = document.createElementNS(NS, "svg");
    svgEl.setAttribute("viewBox", "0 0 " + W + " " + H);
    svgEl.setAttribute("class", "exg-svg");
    svgEl.setAttribute("tabindex", "0");
    svgEl.setAttribute("role", "application");
    svgEl.setAttribute("aria-label", "Graph. Arrow keys move the cursor; Enter places or removes a point.");
    wrap.appendChild(svgEl);

    var said = el("p", "exg-said", "");
    said.setAttribute("aria-live", "polite");
    wrap.appendChild(said);

    function px(i) { return ML + (i - X0) * C; }
    function py(j) { return MT + (Y1 - j) * C; }
    function node(tag, attrs, parent) {
      var n = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      (parent || svgEl).appendChild(n);
      return n;
    }
    function emit() {
      onChange({ scale: st.scale, points: st.points.slice().sort(function (a, b) { return a[0] - b[0]; }) });
    }
    function toggle(i, j) {
      var at = -1;
      st.points.forEach(function (p, k) { if (p[0] === i) at = k; });
      if (at > -1 && st.points[at][1] === j) st.points.splice(at, 1);
      else if (at > -1) st.points[at] = [i, j];
      else st.points.push([i, j]);
      draw();
      emit();
    }
    function curve(pts) {
      if (pts.length < 2) return "";
      var p = pts.map(function (q) { return [px(q[0]), py(q[1])]; });
      var d = "M" + p[0][0] + " " + p[0][1];
      for (var k = 0; k < p.length - 1; k++) {
        var p0 = p[k - 1] || p[k], p1 = p[k], p2 = p[k + 1], p3 = p[k + 2] || p2;
        var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += " C" + c1[0].toFixed(1) + " " + c1[1].toFixed(1) + " " + c2[0].toFixed(1) + " " +
             c2[1].toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
      }
      return d;
    }
    function draw() {
      while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
      var g = node("g", { "class": "exg-grid" });
      for (var i = X0; i <= X1; i++) node("line", { x1: px(i), x2: px(i), y1: py(Y0), y2: py(Y1), "class": i === 0 ? "ax" : "" }, g);
      for (var j = Y0; j <= Y1; j++) node("line", { x1: px(X0), x2: px(X1), y1: py(j), y2: py(j), "class": j === 0 ? "ax" : "" }, g);
      var lab = node("g", { "class": "exg-lab" });
      for (var a = X0; a <= X1; a++) {
        if (a === 0 || a % 2) continue;
        var tx = node("text", { x: px(a), y: py(0) + 17, "text-anchor": "middle" }, lab);
        tx.textContent = xLabel(st.scale, a);
      }
      for (var b = Y0; b <= Y1; b++) {
        if (b === 0 || b % 2) continue;
        var ty = node("text", { x: px(0) - 7, y: py(b) + 4, "text-anchor": "end" }, lab);
        ty.textContent = yLabel(b);
      }
      var o0 = node("text", { x: px(0) - 7, y: py(0) + 17, "text-anchor": "end" }, lab);
      o0.textContent = "0";
      var xl = node("text", { x: px(X1) - 2, y: py(0) - 7, "text-anchor": "end", "class": "exg-axis" }, lab);
      xl.textContent = "x";
      var yl = node("text", { x: px(0) + 8, y: py(Y1) + 12, "class": "exg-axis" }, lab);
      yl.textContent = "y";

      var pts = st.points.slice().sort(function (p, q) { return p[0] - q[0]; });
      if (pts.length > 1) node("path", { d: curve(pts), "class": "exg-curve" });
      pts.forEach(function (p) { node("circle", { cx: px(p[0]), cy: py(p[1]), r: 6, "class": "exg-pt" }); });
      node("circle", { cx: px(cursor[0]), cy: py(cursor[1]), r: 10, "class": "exg-cursor" });

      said.textContent = pts.length
        ? "Your points: " + pts.map(function (p) { return "(" + xLabel(st.scale, p[0]) + ", " + yLabel(p[1]) + ")"; }).join(", ")
        : "No points yet. Click the grid to place one.";
    }
    function gridAt(e) {
      var r = svgEl.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
      var i = Math.round((x - ML) / C) + X0, j = Y1 - Math.round((y - MT) / C);
      if (i < X0 || i > X1 || j < Y0 || j > Y1) return null;
      return [i, j];
    }
    svgEl.addEventListener("click", function (e) {
      var at = gridAt(e);
      if (!at) return;
      cursor = at;
      toggle(at[0], at[1]);
      svgEl.focus({ preventScroll: true });
    });
    svgEl.addEventListener("keydown", function (e) {
      var k = e.key, moved = true;
      if (k === "ArrowLeft") cursor[0] = Math.max(X0, cursor[0] - 1);
      else if (k === "ArrowRight") cursor[0] = Math.min(X1, cursor[0] + 1);
      else if (k === "ArrowUp") cursor[1] = Math.min(Y1, cursor[1] + 1);
      else if (k === "ArrowDown") cursor[1] = Math.max(Y0, cursor[1] - 1);
      else if (k === "Enter" || k === " ") { toggle(cursor[0], cursor[1]); moved = false; }
      else if (k === "Backspace" || k === "Delete") {
        st.points = st.points.filter(function (p) { return p[0] !== cursor[0]; });
        draw(); emit(); moved = false;
      } else return;
      e.preventDefault();
      e.stopPropagation();
      if (moved) {
        draw();
        said.textContent = "Cursor at x " + xLabel(st.scale, cursor[0]) + ", y " + yLabel(cursor[1]) + ".";
      }
    });
    draw();
    return wrap;
  }

  /* =============================================================== Tools
     §21, §22: visible, labelled, beside the task — never over it on a
     screen wide enough to have room. Opening one is noted (§71). */
  function openTool(id) {
    var o = document.getElementById("exam");
    if (!o || !R) return;
    var panel = o.querySelector(".ex-panel");
    R.tool = id;
    [].forEach.call(o.querySelectorAll(".ex-tool"), function (b) {
      var on = b.dataset.tool === id;
      b.classList.toggle("on", on);
      b.setAttribute("aria-expanded", String(on));
    });
    o.classList.toggle("has-panel", !!id);
    if (!id) { panel.hidden = true; panel.innerHTML = ""; return; }
    R.sess.tools[id] = (R.sess.tools[id] || 0) + 1;
    event("RESOURCE_OPENED", id);
    changed();
    panel.hidden = false;
    panel.innerHTML = "";
    var head = el("div", "ex-panel-head");
    head.appendChild(el("h2", null, id === "calculator" ? "Calculator" : "Reference sheet"));
    var x = el("button", "ex-icon", icon("close"));
    x.type = "button";
    x.setAttribute("aria-label", "Close " + (id === "calculator" ? "calculator" : "reference sheet"));
    x.addEventListener("click", function () { openTool(null); });
    head.appendChild(x);
    panel.appendChild(head);
    panel.appendChild(id === "calculator" ? calculator() : reference(R.policy.tools.referenceSheet));
    var first = panel.querySelector("input, button:not(.ex-icon)");
    if (first) first.focus();
  }

  /* ----------------------------------------------------------- Calculator
     Scientific, with the one statistics function this course's calculators
     have — normalcdf — because a normal-distribution task without it would
     measure access to a table rather than statistics (§34). Parsed, never
     eval'd. */
  var CALC = { deg: false, ans: 0, expr: "" };

  function calcTokens(src) {
    var s = src.replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
    var out = [], i = 0, m;
    while (i < s.length) {
      var rest = s.slice(i);
      if ((m = /^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/.exec(rest))) { out.push({ t: "n", v: parseFloat(m[0]) }); i += m[0].length; continue; }
      if ((m = /^(normalcdf|asin|acos|atan|sin|cos|tan|ln|log|sqrt|cbrt|abs|ans|pi|inf)/i.exec(rest))) {
        out.push({ t: "id", v: m[0].toLowerCase() }); i += m[0].length; continue;
      }
      var c = s[i];
      if (c === "π") out.push({ t: "id", v: "pi" });
      else if (c === "e") out.push({ t: "id", v: "e" });
      else if (c === "∞") out.push({ t: "id", v: "inf" });
      else if ("+-*/^(),!²³√∛".indexOf(c) > -1) out.push({ t: c });
      else throw new Error("unknown " + c);
      i++;
    }
    return out;
  }
  var FN = {
    sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1, ln: 1, log: 1, sqrt: 1, cbrt: 1, abs: 1, normalcdf: 4
  };
  function erf(x) {
    var s = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function phi(z) {
    if (z === Infinity) return 1;
    if (z === -Infinity) return 0;
    return 0.5 * (1 + erf(z / Math.SQRT2));
  }
  function calcEval(src) {
    var tk = calcTokens(src), p = 0;
    function peek() { return tk[p]; }
    function eat(t) { if (tk[p] && tk[p].t === t) { p++; return true; } return false; }
    function need(t) { if (!eat(t)) throw new Error("expected " + t); }
    function starts(x) { return x && (x.t === "n" || x.t === "id" || x.t === "(" || x.t === "√" || x.t === "∛"); }
    function expr() {
      var v = term();
      for (;;) {
        if (eat("+")) v += term();
        else if (eat("-")) v -= term();
        else return v;
      }
    }
    function term() {
      var v = unary();
      for (;;) {
        if (eat("*")) v *= unary();
        else if (eat("/")) v /= unary();
        else if (starts(peek())) v *= unary();
        else return v;
      }
    }
    function unary() {
      if (eat("-")) return -unary();
      if (eat("+")) return unary();
      return power();
    }
    function power() {
      var b = postfix();
      if (eat("^")) return Math.pow(b, unary());
      return b;
    }
    function postfix() {
      var v = primary();
      for (;;) {
        if (eat("²")) v = v * v;
        else if (eat("³")) v = v * v * v;
        else if (eat("!")) v = fact(v);
        else return v;
      }
    }
    function fact(n) {
      if (n < 0 || n !== Math.floor(n) || n > 170) throw new Error("factorial");
      var r = 1;
      for (var k = 2; k <= n; k++) r *= k;
      return r;
    }
    function trigIn(x) { return CALC.deg ? x * Math.PI / 180 : x; }
    function trigOut(x) { return CALC.deg ? x * 180 / Math.PI : x; }
    function primary() {
      var x = peek();
      if (!x) throw new Error("end");
      if (eat("(")) { var v = expr(); eat(")"); return v; }
      if (eat("√")) return Math.sqrt(postfix());
      if (eat("∛")) return Math.cbrt(postfix());
      if (x.t === "n") { p++; return x.v; }
      if (x.t === "id") {
        p++;
        if (x.v === "pi") return Math.PI;
        if (x.v === "e") return Math.E;
        if (x.v === "inf") return Infinity;
        if (x.v === "ans") return CALC.ans;
        var arity = FN[x.v];
        need("(");
        var args = [expr()];
        while (eat(",")) args.push(expr());
        eat(")");
        if (args.length !== arity) throw new Error("args");
        var a = args[0];
        switch (x.v) {
          case "sin": return Math.sin(trigIn(a));
          case "cos": return Math.cos(trigIn(a));
          case "tan": return Math.tan(trigIn(a));
          case "asin": return trigOut(Math.asin(a));
          case "acos": return trigOut(Math.acos(a));
          case "atan": return trigOut(Math.atan(a));
          case "ln": return Math.log(a);
          case "log": return Math.log10(a);
          case "sqrt": return Math.sqrt(a);
          case "cbrt": return Math.cbrt(a);
          case "abs": return Math.abs(a);
          case "normalcdf":
            if (!(args[3] > 0)) throw new Error("sd");
            return phi((args[1] - args[2]) / args[3]) - phi((args[0] - args[2]) / args[3]);
        }
      }
      throw new Error("unexpected");
    }
    var v = expr();
    if (p !== tk.length) throw new Error("trailing");
    return v;
  }
  function fmtNum(v) {
    if (v === Infinity) return "∞";
    if (v === -Infinity) return "−∞";
    if (!isFinite(v)) return null;
    if (Math.abs(v) < 1e-12) return "0";
    var s = Math.abs(v) >= 1e10 || Math.abs(v) < 1e-6 ? v.toExponential(8) : String(parseFloat(v.toPrecision(12)));
    s = s.replace(/(\.\d*?)0+e/, "$1e").replace(/\.e/, "e");
    return s.replace("-", "−");
  }

  function calculator() {
    var box = el("div", "xc");
    var screen = el("div", "xc-screen");
    var expr = el("input", "xc-expr");
    expr.type = "text";
    expr.value = CALC.expr;
    expr.autocomplete = "off";
    expr.setAttribute("spellcheck", "false");
    expr.setAttribute("aria-label", "Calculation");
    var out = el("output", "xc-out", "&nbsp;");
    out.setAttribute("aria-live", "polite");
    screen.appendChild(expr);
    screen.appendChild(out);
    box.appendChild(screen);

    var mode = el("div", "xc-mode");
    mode.setAttribute("role", "radiogroup");
    mode.setAttribute("aria-label", "Angle unit");
    [["Rad", false], ["Deg", true]].forEach(function (m) {
      var b = el("button", "xc-m", m[0]);
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(CALC.deg === m[1]));
      b.addEventListener("click", function () {
        CALC.deg = m[1];
        [].forEach.call(mode.children, function (c) { c.setAttribute("aria-checked", "false"); });
        b.setAttribute("aria-checked", "true");
        if (expr.value.trim()) run();
      });
      mode.appendChild(b);
    });
    box.appendChild(mode);

    function run() {
      CALC.expr = expr.value;
      if (!expr.value.trim()) { out.innerHTML = "&nbsp;"; return; }
      try {
        var v = calcEval(expr.value), f = fmtNum(v);
        if (f == null) throw new Error("nan");
        CALC.ans = v;
        out.textContent = "= " + f;
        out.classList.remove("err");
      } catch (e) {
        out.textContent = "Check the expression";
        out.classList.add("err");
      }
    }
    expr.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); run(); }
    });
    expr.addEventListener("input", function () { CALC.expr = expr.value; });

    var KEYS = [
      ["sin", "sin("], ["cos", "cos("], ["tan", "tan("], ["(", "("], [")", ")"],
      ["ln", "ln("], ["log", "log("], ["√", "√("], ["xʸ", "^"], ["x²", "²"],
      ["7"], ["8"], ["9"], ["÷", "÷"], ["⌫", "BACK"],
      ["4"], ["5"], ["6"], ["×", "×"], ["AC", "CLEAR"],
      ["1"], ["2"], ["3"], ["−", "−"], ["π", "π"],
      ["0"], ["."], [",", ","], ["+", "+"], ["=", "RUN"],
      ["|x|", "abs("], ["e", "e"], ["∞", "∞"], ["ans", "ans"], ["normalcdf", "normalcdf("]
    ];
    var pad = el("div", "xc-keys");
    KEYS.forEach(function (k) {
      var b = el("button", "xc-k" + (/^\d$|^\.$/.test(k[0]) ? " num" : "") +
        (k[1] === "RUN" ? " run" : "") + (k[0] === "normalcdf" ? " wide" : ""), esc(k[0]));
      b.type = "button";
      var ins = k[1] || k[0];
      b.setAttribute("aria-label", {
        BACK: "Delete", CLEAR: "Clear", RUN: "Equals", "√(": "Square root", "^": "Power",
        "²": "Squared", "abs(": "Absolute value", "normalcdf(": "Normal cdf: lower, upper, mean, standard deviation"
      }[ins] || k[0]);
      b.addEventListener("mousedown", function (e) { e.preventDefault(); });
      b.addEventListener("click", function () {
        if (ins === "RUN") { run(); return; }
        if (ins === "CLEAR") { expr.value = ""; CALC.expr = ""; out.innerHTML = "&nbsp;"; expr.focus(); return; }
        if (ins === "BACK") {
          var a = expr.selectionStart, z = expr.selectionEnd;
          if (a === z && a > 0) a--;
          expr.value = expr.value.slice(0, a) + expr.value.slice(z);
          expr.selectionStart = expr.selectionEnd = a;
          CALC.expr = expr.value;
          expr.focus();
          return;
        }
        insertAt(expr, ins);
      });
      pad.appendChild(b);
    });
    box.appendChild(pad);
    box.appendChild(el("p", "xc-hint", "normalcdf(lower, upper, mean, SD). Use −∞ for “below”."));
    if (expr.value.trim()) run();
    return box;
  }

  /* -------------------------------------------------------- Reference */
  var REFERENCE = {
    "nys-algebra-2": {
      groups: [
        { h: "Formulas", rows: [
          ["Triangle", "A = \\frac{1}{2}bh"],
          ["Parallelogram", "A = bh"],
          ["Circle", "A = πr²"],
          ["Circle", "C = πd  or  C = 2πr"],
          ["General prisms", "V = Bh"],
          ["Cylinder", "V = πr²h"],
          ["Sphere", "V = \\frac{4}{3}πr³"],
          ["Cone", "V = \\frac{1}{3}πr²h"],
          ["Pyramid", "V = \\frac{1}{3}Bh"],
          ["Pythagorean theorem", "a² + b² = c²"],
          ["Quadratic formula", "x = \\frac{−b ± \\sqrt{b² − 4ac}}{2a}"],
          ["Arithmetic sequence", "a_{n} = a_{1} + (n − 1)d"],
          ["Geometric sequence", "a_{n} = a_{1}r^{n − 1}"],
          ["Geometric series", "S_{n} = \\frac{a_{1} − a_{1}r^{n}}{1 − r}  where r ≠ 1"],
          ["Radians", "1 radian = \\frac{180}{π} degrees"],
          ["Degrees", "1 degree = \\frac{π}{180} radians"],
          ["Exponential growth/decay", "A = A_{0}e^{k(t − t_{0})} + B_{0}"]
        ] },
        { h: "Conversions", rows: [
          ["", "1 inch = 2.54 centimeters"], ["", "1 meter = 39.37 inches"],
          ["", "1 mile = 5280 feet"], ["", "1 mile = 1760 yards"],
          ["", "1 mile = 1.609 kilometers"], ["", "1 kilometer = 0.62 mile"],
          ["", "1 pound = 16 ounces"], ["", "1 pound = 0.454 kilogram"],
          ["", "1 kilogram = 2.2 pounds"], ["", "1 ton = 2000 pounds"],
          ["", "1 cup = 8 fluid ounces"], ["", "1 pint = 2 cups"],
          ["", "1 quart = 2 pints"], ["", "1 gallon = 4 quarts"],
          ["", "1 gallon = 3.785 liters"], ["", "1 liter = 0.264 gallon"],
          ["", "1 liter = 1000 cubic centimeters"]
        ] }
      ]
    }
  };
  function reference(id) {
    var ref = REFERENCE[id];
    var box = el("div", "xr");
    if (!ref) { box.appendChild(el("p", null, "This reference sheet is not available.")); return box; }
    ref.groups.forEach(function (g) {
      var sec = el("section", "xr-g");
      sec.appendChild(el("h3", null, esc(g.h)));
      var dl = el("dl", g.rows[0][0] ? "xr-rows" : "xr-rows plain");
      g.rows.forEach(function (r) {
        var d = el("div");
        if (r[0]) d.appendChild(el("dt", null, esc(r[0])));
        d.appendChild(el("dd", null, mathHTML(r[1])));
        dl.appendChild(d);
      });
      sec.appendChild(dl);
      box.appendChild(sec);
    });
    return box;
  }

  /* ================================================================ Clock
     §28, §29: calm, present, never dominant. Minutes until ten are left,
     then minutes and seconds. Amber at five — never red, never flashing —
     and a hidden timer comes back by itself at five minutes. */
  function left(ms) {
    if (ms <= 0) return "Time's up";
    if (ms < 10 * 60000) {
      var s = Math.ceil(ms / 1000);
      return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2) + " left";
    }
    var m = Math.ceil(ms / 60000);
    if (m >= 60) {
      var h = Math.floor(m / 60), mm = m % 60;
      return h + " hr" + (mm ? " " + mm + " min" : "") + " left";
    }
    return m + " min left";
  }
  var SAY_AT = [30, 10, 5, 1];
  function tick() {
    if (!R || R.sess.status !== "active") return;
    var o = document.getElementById("exam");
    var t = o && o.querySelector(".ex-timer");
    if (!R.sess.expiresAt) return;
    var ms = R.sess.expiresAt - now();
    if (ms <= 0) { finish("time", R.sess.expiresAt); return; }
    if (!t) return;
    var low = ms <= 5 * 60000;
    if (low && R.timerHidden) R.timerHidden = false;
    var text = R.timerHidden ? "Show time" : left(ms);
    if (t.dataset.text !== text) {
      t.dataset.text = text;
      t.innerHTML = icon(R.timerHidden ? "eyeOff" : "clock") + "<span>" + esc(text) + "</span>";
      t.setAttribute("aria-label", R.timerHidden ? "Timer hidden. Show time" : text + ". Hide timer");
    }
    t.classList.toggle("low", low);
    var mins = Math.ceil(ms / 60000);
    R.said = R.said || {};
    SAY_AT.forEach(function (m) {
      if (mins <= m && !R.said[m] && ms > (m - 1) * 60000) {
        R.said[m] = true;
        if (R.said.first) live(plural(m, "minute") + " left.");
      }
    });
    R.said.first = true;
  }
  function toggleTimer() {
    if (!R) return;
    if (R.sess.expiresAt - now() <= 5 * 60000) return;
    R.timerHidden = !R.timerHidden;
    var t = document.querySelector("#exam .ex-timer");
    if (t) t.dataset.text = "";
    tick();
  }

  /* ========================================================= Save state */
  function setSave(state) {
    if (!R) return;
    R.saveState = state;
    var o = document.getElementById("exam");
    var n = o && o.querySelector(".ex-save");
    if (n) {
      var map = {
        saving:  ["cloud", "Saving…"],
        saved:   ["check", "Saved"],
        offline: ["offline", "Saved on this device"],
        error:   ["cloud", "Saved on this device"]
      }[state] || ["cloud", ""];
      n.className = "ex-save " + state;
      n.innerHTML = icon(map[0]) + "<span>" + esc(map[1]) + "</span>";
      n.title = state === "saved" ? "Saved to your account" :
        state === "offline" ? "You're offline. Your answers will be sent when you're back online." :
        state === "error" ? "Your answers are on this device and will be sent again shortly." : "";
    }
    var sync = o && o.querySelector(".exd-sync");
    if (sync) paintDoneSync(sync);
  }

  /* One line under the bar for the rare thing worth saying — a lost
     connection, a restored session. Never a tip, never praise (§57). */
  function notice(text, kind, sticky) {
    if (!R) return;
    var o = document.getElementById("exam");
    var n = o && o.querySelector(".ex-notice");
    if (!n) return;
    clearTimeout(R.noticeT);
    n.className = "ex-notice on " + (kind || "");
    n.innerHTML = (kind === "warn" ? icon("offline") : kind === "ok" ? icon("check") : "") +
      "<span>" + esc(text) + "</span>";
    n.setAttribute("role", "status");
    if (!sticky) R.noticeT = setTimeout(function () { n.className = "ex-notice"; }, 3800);
  }
  function live(text) {
    var n = document.querySelector("#exam .ex-live");
    if (n) { n.textContent = ""; setTimeout(function () { n.textContent = text; }, 40); }
  }

  /* ========================================================== Task map */
  function toggleMap() {
    var o = document.getElementById("exam");
    if (o.querySelector(".ex-map")) { closeMap(); return; }
    var s = R.spec;
    var map = el("div", "ex-map");
    map.setAttribute("role", "dialog");
    map.setAttribute("aria-label", "All tasks");
    var n = answeredCount(s, R.sess);
    var flagged = s.tasks.filter(function (t) { return R.sess.flags[t.id] && R.sess.flags[t.id].on; }).length;
    map.innerHTML = '<div class="ex-map-head"><h2>All tasks</h2><p>' + n + " of " + s.tasks.length + " answered" +
      (flagged ? " · " + flagged + " marked for review" : "") + "</p></div>";
    var grid = el("div", "ex-map-grid");
    s.tasks.forEach(function (t, i) {
      var st = answeredState(t, R.sess.responses[t.id]);
      var fl = R.sess.flags[t.id] && R.sess.flags[t.id].on;
      var b = el("button", "ex-tile " + st + (i === R.sess.current ? " cur" : "") + (fl ? " flag" : ""),
        "<b>" + t.n + "</b>");
      b.type = "button";
      b.setAttribute("aria-label", "Task " + t.n + ", " +
        (st === "done" ? "answered" : st === "part" ? "started" : "not answered") + (fl ? ", marked for review" : "") +
        (i === R.sess.current ? ", current" : ""));
      b.addEventListener("click", function () { go(i); });
      grid.appendChild(b);
    });
    map.appendChild(grid);
    map.appendChild(el("div", "ex-map-key",
      '<span><i class="k done"></i>Answered</span><span><i class="k part"></i>Started</span>' +
      '<span><i class="k none"></i>Not answered</span><span><i class="k flag"></i>Marked</span>'));
    var acts = el("div", "ex-map-act");
    var rev = el("button", "ex-btn primary", "Review answers");
    rev.type = "button";
    rev.addEventListener("click", function () { closeMap(); drawReview(); });
    acts.appendChild(rev);
    if (R.policy.leave !== false) {
      var out = el("button", "ex-btn ghost", "Save and exit");
      out.type = "button";
      out.addEventListener("click", function () { close(); });
      acts.appendChild(out);
    }
    map.appendChild(acts);
    var scrim = el("div", "ex-scrim");
    scrim.addEventListener("click", closeMap);
    o.appendChild(scrim);
    o.appendChild(map);
    o.querySelector(".ex-mapbtn").setAttribute("aria-expanded", "true");
    var cur = map.querySelector(".ex-tile.cur") || map.querySelector(".ex-tile");
    if (cur) cur.focus();
  }
  function closeMap() {
    var o = document.getElementById("exam");
    if (!o) return;
    var m = o.querySelector(".ex-map"), s = o.querySelector(".ex-scrim");
    if (m) m.remove();
    if (s) s.remove();
    var b = o.querySelector(".ex-mapbtn");
    if (b) b.setAttribute("aria-expanded", "false");
  }

  /* ============================================================= Review
     §59: every task, whether it has an answer, and the answer itself —
     so a student checks what they said, not just that they said something. */
  function summary(t, r) {
    var v = r && r.v;
    if (v == null) return null;
    if (t.response.type === "choice") {
      return String.fromCharCode(65 + v) + " · " + flat(t.response.options[v]);
    }
    var parts = (t.response.fields || []).map(function (f) { return String(v[f.id] || "").trim(); }).filter(Boolean);
    if (t.response.graph && v.graph && v.graph.points && v.graph.points.length) {
      parts.unshift(plural(v.graph.points.length, "point") + " plotted");
    }
    return parts.join(" · ") || (String(v.work || "").trim() ? "Work shown, no answer yet" : null);
  }

  function drawReview() {
    if (!R) return;
    openTool(null);
    closeMap();
    var s = R.spec;
    var o = document.getElementById("exam");
    o.classList.add("is-review");
    var scroll = o.querySelector(".ex-scroll");
    scroll.innerHTML = "";
    var n = answeredCount(s, R.sess), missing = s.tasks.length - n;
    var flagged = s.tasks.filter(function (t) { return R.sess.flags[t.id] && R.sess.flags[t.id].on; });

    var box = el("article", "ex-review" + (reduced() ? "" : " in-next"));
    box.innerHTML = '<p class="ex-eyebrow">Review</p>' +
      '<h1 class="ex-review-h" tabindex="-1">Review your answers</h1>' +
      '<p class="ex-review-sum">' + n + " of " + s.tasks.length + " answered" +
      (flagged.length ? " · " + flagged.length + " marked for review" : "") + "</p>" +
      (missing ? '<p class="ex-review-note">' + icon("pencil") + "<span>" +
        plural(missing, "task has", "tasks have") + " no complete answer. You can still submit.</span></p>" : "");
    var list = el("ol", "ex-review-list");
    s.tasks.forEach(function (t, i) {
      var st = answeredState(t, R.sess.responses[t.id]);
      var fl = R.sess.flags[t.id] && R.sess.flags[t.id].on;
      var li = el("li");
      var b = el("button", "ex-rrow " + st + (fl ? " flag" : ""));
      b.type = "button";
      var said = summary(t, R.sess.responses[t.id]);
      var first = (t.prompt[0] || {}).p || ((t.prompt[0] || {}).math || []).join("  ");
      var line = flat(first);
      if (line.length > 110) line = line.slice(0, 108).replace(/\s+\S*$/, "") + "…";
      b.innerHTML = '<span class="ex-rn">' + t.n + "</span>" +
        '<span class="ex-rt"><b>' + esc(line) + "</b>" +
        "<span>" + (said ? esc(said) : "No answer") + "</span></span>" +
        '<span class="ex-rs">' + (fl ? icon("flag") : "") + (st === "done" ? icon("check") : "") + "</span>";
      b.setAttribute("aria-label", "Task " + t.n + ": " + (said || "no answer") + (fl ? ", marked for review" : ""));
      b.addEventListener("click", function () {
        o.classList.remove("is-review");
        restoreFoot();
        R.dir = -1;
        R.sess.current = i;
        changed();
        drawTask(true);
        paintTrack();
      });
      li.appendChild(b);
      list.appendChild(li);
    });
    box.appendChild(list);
    scroll.appendChild(box);
    scroll.scrollTop = 0;

    var back = o.querySelector(".ex-back");
    var fresh = back.cloneNode(false);
    fresh.disabled = false;
    back.parentNode.replaceChild(fresh, back);
    fresh.innerHTML = icon("left") + "<span>Back to tasks</span>";
    fresh.addEventListener("click", function () {
      o.classList.remove("is-review");
      restoreFoot();
      R.dir = -1;
      drawTask(true);
      paintTrack();
    });
    var next = o.querySelector(".ex-next");
    var sub = next.cloneNode(true);
    next.parentNode.replaceChild(sub, next);
    sub.innerHTML = "<span>Submit assessment</span>";
    sub.classList.add("submit");
    sub.addEventListener("click", confirmSubmit);
    o.querySelector(".ex-where").textContent = "Review";
    requestAnimationFrame(function () { var h = box.querySelector(".ex-review-h"); if (h) h.focus(); });
  }
  function restoreFoot() {
    var o = document.getElementById("exam");
    var s = R.spec;
    var back = o.querySelector(".ex-back"), b2 = back.cloneNode(false);
    b2.className = "ex-btn ghost ex-back";
    b2.innerHTML = icon("left") + "<span>Back</span>";
    b2.addEventListener("click", function () { go(R.sess.current - 1); });
    back.parentNode.replaceChild(b2, back);
    var next = o.querySelector(".ex-next"), n2 = next.cloneNode(false);
    n2.className = "ex-btn primary ex-next";
    n2.addEventListener("click", function () {
      if (R.sess.current >= s.tasks.length - 1) drawReview();
      else go(R.sess.current + 1);
    });
    next.parentNode.replaceChild(n2, next);
  }

  function confirmSubmit() {
    var o = document.getElementById("exam");
    var n = answeredCount(R.spec, R.sess), total = R.spec.tasks.length;
    var scrim = el("div", "ex-scrim dark");
    var dlg = el("div", "ex-confirm");
    dlg.setAttribute("role", "alertdialog");
    dlg.setAttribute("aria-modal", "true");
    dlg.setAttribute("aria-labelledby", "ex-confirm-h");
    dlg.innerHTML = '<h2 id="ex-confirm-h">Submit your assessment?</h2>' +
      "<p>You won't be able to change your answers after you submit." +
      (n < total ? " " + plural(total - n, "task has", "tasks have") + " no complete answer." : "") + "</p>";
    var row = el("div", "ex-confirm-act");
    var keep = el("button", "ex-btn", "Keep working");
    keep.type = "button";
    var go_ = el("button", "ex-btn primary", "Submit");
    go_.type = "button";
    function shut() { scrim.remove(); dlg.remove(); }
    keep.addEventListener("click", function () { shut(); var s = o.querySelector(".ex-next"); if (s) s.focus(); });
    scrim.addEventListener("click", shut);
    go_.addEventListener("click", function () { shut(); finish("student"); });
    row.appendChild(keep);
    row.appendChild(go_);
    dlg.appendChild(row);
    o.appendChild(scrim);
    o.appendChild(dlg);
    keep.focus();
  }

  /* ============================================================ Finished */
  function finish(by, at) {
    if (!R || R.sess.status === "submitted") return;
    R.sess.status = "submitted";
    R.sess.submittedAt = at || now();
    R.sess.endedBy = by;
    holdSpec(R.spec, R.sess);
    event(by === "time" ? "TIME_EXPIRED" : "SUBMITTED");
    clearInterval(R.ticker);
    changed(true);
    drawDone(by);
  }

  function drawDone() {
    var s = R.spec, sess = R.sess;
    var o = document.getElementById("exam");
    document.addEventListener("keydown", keys, true);
    o.className = "ex is-done";
    o.innerHTML = "";
    var byTime = sess.endedBy === "time";
    var n = answeredCount(s, sess);
    var box = el("div", "exd" + (reduced() ? "" : " in"));
    box.innerHTML =
      '<div class="exd-mark" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="29"/>' +
      '<path d="m20 33 8.5 8.5L45 24"/></svg></div>' +
      '<h1 class="exd-h" tabindex="-1">' + (byTime ? "Time's up." : "You're finished.") + "</h1>" +
      '<p class="exd-lead">' + (byTime
        ? "Your answers were submitted when time ran out."
        : "Your assessment has been submitted.") + "</p>" +
      '<dl class="exd-facts">' +
        "<div><dt>Assessment</dt><dd>" + esc(s.title) + "</dd></div>" +
        "<div><dt>" + (byTime ? "Ended" : "Submitted") + "</dt><dd>" + esc(when(sess.submittedAt, true)) + "</dd></div>" +
        "<div><dt>Answered</dt><dd>" + n + " of " + s.tasks.length + "</dd></div>" +
      "</dl>" +
      '<p class="exd-sync"></p>' +
      '<p class="exd-next">' + (R.policy.results === "released_by_teacher" || R.policy.feedback === "none"
        ? "Your teacher will release results when they're available."
        : "Your results will appear here when they're ready.") + "</p>";
    var back = el("button", "ex-btn primary lg", "Return to OEdu");
    back.type = "button";
    back.addEventListener("click", function () { close(); });
    box.appendChild(back);
    o.appendChild(box);
    paintDoneSync(box.querySelector(".exd-sync"));
    requestAnimationFrame(function () { var h = box.querySelector(".exd-h"); if (h) h.focus(); });
  }
  /* Whether the submission has reached the account — said plainly, because
     "submitted" on a screen that has not told the server is a lie (§45). */
  function paintDoneSync(n) {
    if (!R || !n) return;
    var st = R.saveState;
    var sent = R.synced === R.sess.at && st === "saved";
    n.className = "exd-sync " + (sent ? "ok" : st === "offline" || st === "error" ? "wait" : "busy");
    n.innerHTML = sent
      ? icon("check") + "<span>Received by OEdu.</span>"
      : st === "offline" || st === "error"
        ? icon("offline") + "<span>Saved on this device. It will be sent as soon as you're back online — " +
          "keep OEdu open, or open it again later.</span>"
        : '<span class="ex-spin" aria-hidden="true"></span><span>Sending…</span>';
  }

  /* ============================================================ Keyboard
     §40: the same keys always mean the same thing. Arrows move between
     tasks only when nothing else wants them; letters choose an option. */
  function keys(e) {
    if (!R || !document.getElementById("exam")) return;
    var o = document.getElementById("exam");
    if (e.key === "Escape") {
      if (o.querySelector(".ex-confirm")) { o.querySelector(".ex-confirm .ex-btn").click(); e.preventDefault(); return; }
      if (o.querySelector(".ex-map")) { closeMap(); e.preventDefault(); return; }
      if (R.tool) { openTool(null); e.preventDefault(); return; }
      return;
    }
    if (!o.classList.contains("is-run") || o.classList.contains("is-review")) return;
    if (o.querySelector(".ex-confirm, .ex-map")) return;
    var a = document.activeElement, tag = a && a.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || (a && a.closest && a.closest(".ex-panel, .exg-svg"))) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = R.spec.tasks[R.sess.current];
    if (e.key === "ArrowRight" && !(a && a.type === "radio")) {
      e.preventDefault();
      if (R.sess.current >= R.spec.tasks.length - 1) drawReview(); else go(R.sess.current + 1);
    } else if (e.key === "ArrowLeft" && !(a && a.type === "radio")) {
      e.preventDefault();
      go(R.sess.current - 1);
    } else if (t && t.response.type === "choice" && /^[a-z]$/i.test(e.key)) {
      var k = e.key.toUpperCase().charCodeAt(0) - 65;
      var inp = o.querySelectorAll(".ex-choice input")[k];
      if (inp) { e.preventDefault(); inp.checked = true; inp.dispatchEvent(new Event("change")); inp.focus(); }
    }
  }

  /* ========================================================== Resuming
     Called when a student arrives in the app. A sitting that was running
     when the page went away comes straight back (§32) — whether that was a
     refresh, a crash or a closed laptop. */
  function resume(me) {
    ME = me;
    if (!me) return;
    drainAll();
    var asked = null;
    try { asked = new URL(location.href).searchParams.get("exam"); } catch (e) { asked = null; }
    manifest().then(function (mine) {
      badgeQuick(mine, me);
      if (asked && mine.some(function (x) { return x.id === asked; })) { open_(asked, "resume"); return; }
      if (asked) setUrl(null);
      var running = mine.filter(function (x) {
        var l = readLocal(me.id, x.id);
        return l && l.status === "active";
      })[0];
      if (running) { open_(running.id, "resume"); return; }
      /* Nothing on this device, but the account may have a sitting from
         another one. Ask once, quietly. */
      mine.forEach(function (x) {
        fetchServer(x.id).then(function (srv) {
          if (!R && srv.state && srv.state.status === "active") open_(x.id, "resume");
        }, function () { /* offline: nothing to resume from here */ });
      });
    }, function () { /* no manifest: nothing to resume */ });
  }
  function badgeQuick(entries, me) {
    var nav = document.getElementById("navExams");
    if (!nav) return;
    nav.classList.toggle("ex-waiting", entries.some(function (x) {
      var l = readLocal(me.id, x.id);
      return openWindow(x).state === "open" && !(l && l.status === "submitted");
    }));
  }

  window.OPLO_EXAM = {
    hub: hub,
    open: function (id) { return open_(id, "fresh"); },
    resume: resume,
    close: function (signOut) { if (signOut) { close(true); ME = null; HUB = null; } else close(); },
    isOpen: function () { return !!R; },
    // For tests and for the teacher's view, when there is one.
    _calc: calcEval,
    _merge: merge,
    _math: mathHTML
  };
})();
