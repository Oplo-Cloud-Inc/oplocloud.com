/* ==========================================================================
   The Oplo API adapter.

   This is the seam. It is the only file in the frontend that knows a backend
   exists, and the only one that will need to change if the backend moves,
   changes database, or is put behind a different gateway. Everything above it
   asks for accounts, courses and grades and is told nothing about how they
   arrive.

   Three rules govern it.

   The first: this file never decides who the user is. It asks. `me()` returns
   whoever the session cookie resolves to on the server, and there is no
   argument to it and no way to influence the answer. A frontend that can name
   its own account is a frontend whose permissions are decoration.

   The second: it never invents an answer. If the API cannot be reached, calls
   reject with a reason, and the screens above say so. The failure mode of a
   study app that cannot reach its server is "we cannot reach the server", not
   a quietly stale grade that a student takes into an exam.

   The third: the session lives in an HttpOnly cookie set by the server, so
   there is no token in this file, nothing in localStorage, and nothing an
   injected script could read. `credentials: "include"` is what carries it,
   and it is why the API keeps a CORS allowlist rather than a wildcard.
   ========================================================================== */
window.OPLO_API = (function () {
  "use strict";

  /* Where the API is.

     The hostname is carried over from the page rather than hardcoded, and
     that is not tidiness — it is the difference between working and not.
     `localhost` and `127.0.0.1` are different hosts to a browser, so a page
     served from one calling an API on the other is a cross-site request, and
     a SameSite=Lax session cookie is correctly not sent with it. The symptom
     is a successful sign-in followed by 401 on everything after it.

     In production `oplocloud.com` and `api.oplocloud.com` share a registrable
     domain, so they are same-site and the cookie travels. */
  function defaultBase() {
    var h = location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" ||
        /^192\.168\./.test(h) || /^10\./.test(h)) {
      return location.protocol + "//" + h + ":8787/api/v1";
    }
    return "https://api.oplocloud.com/api/v1";
  }

  var base = defaultBase();
  var reachable = null;        // null = not yet asked, true/false once known

  /* An error a screen can act on. `code` is the server's, so a client can
     branch on `invalid_credentials` without matching on English. */
  function ApiError(status, code, message, field) {
    var e = new Error(message || "That did not work.");
    e.status = status; e.code = code; e.field = field;
    return e;
  }

  function request(method, path, body, opts) {
    opts = opts || {};
    var init = {
      method: method,
      credentials: "include",     // the session cookie, and nothing else
      headers: {}
    };
    if (body !== undefined) {
      init.headers["content-type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    // A request that hangs forever leaves a spinner on screen forever.
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = null;
    if (ctrl) {
      init.signal = ctrl.signal;
      timer = setTimeout(function () { ctrl.abort(); }, opts.timeout || 12000);
    }

    return fetch(base + path, init).then(function (res) {
      if (timer) clearTimeout(timer);
      reachable = true;
      if (res.status === 204) return null;
      return res.text().then(function (text) {
        var data = null;
        if (text) { try { data = JSON.parse(text); } catch (e) { data = null; } }
        if (!res.ok) {
          var err = (data && data.error) || {};
          throw ApiError(res.status, err.code || "http_" + res.status,
                         err.message || "The server refused that.", err.field);
        }
        return data;
      });
    }).catch(function (e) {
      if (timer) clearTimeout(timer);
      if (e && e.status) throw e;               // a real answer, just not a happy one
      reachable = false;
      throw ApiError(0, "offline",
        "Cannot reach the Oplo account service at " + base + ".");
    });
  }

  var get  = function (p, o) { return request("GET", p, undefined, o); };
  var post = function (p, b, o) { return request("POST", p, b || {}, o); };
  var put  = function (p, b, o) { return request("PUT", p, b || {}, o); };
  var patch= function (p, b, o) { return request("PATCH", p, b || {}, o); };
  var del  = function (p, o) { return request("DELETE", p, undefined, o); };

  function q(params) {
    var out = [];
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] == null || params[k] === "") return;
      out.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
    });
    return out.length ? "?" + out.join("&") : "";
  }

  /* The browser's offset from UTC, sent with anything that has to know what
     day it is for this person. A streak computed in UTC tells a student in
     Los Angeles who studied at 11pm that they missed a day. */
  function tzOffset() { return new Date().getTimezoneOffset(); }

  return {
    /* ------------------------------------------------------------ Where */
    base: function () { return base; },
    setBase: function (url) { base = String(url).replace(/\/+$/, ""); reachable = null; },
    reachable: function () { return reachable; },
    health: function () {
      return get("/health", { timeout: 5000 })
        .then(function () { return true; })
        .catch(function () { return false; });
    },

    /* --------------------------------------------------------- Identity
       One Oplo Account. Not an OEdu account — OEdu is a product that reads
       this, the way OMaps and OShopping will. */
    login: function (email, password) {
      return post("/auth/login", { email: email, password: password }, { timeout: 20000 })
        .then(function (r) { return r.account; });
    },
    logout: function () { return post("/auth/logout"); },
    me: function () { return get("/me").then(function (r) { return r.account; }); },
    changePassword: function (currentPassword, newPassword) {
      return post("/auth/password",
        { currentPassword: currentPassword, newPassword: newPassword }, { timeout: 20000 });
    },

    /* --------------------------------------------------------- Accounts */
    accounts: {
      list: function (orgId) {
        return get("/accounts" + q({ orgId: orgId })).then(function (r) { return r.accounts; });
      },
      get: function (id) { return get("/accounts/" + id).then(function (r) { return r.account; }); },
      create: function (data) {
        return post("/accounts", data, { timeout: 20000 }).then(function (r) { return r.account; });
      },
      update: function (id, patchData) {
        return patch("/accounts/" + id, patchData).then(function (r) { return r.account; });
      },
      role: function (id, product, role, orgId, revoke) {
        return post("/accounts/" + id + "/roles",
          { product: product, role: role, orgId: orgId, revoke: !!revoke })
          .then(function (r) { return r.roles; });
      }
    },

    /* ---------------------------------------------------------- Courses */
    courses: {
      mine: function () { return get("/courses?mine=true").then(function (r) { return r.courses; }); },
      all: function (orgId) {
        return get("/courses" + q({ mine: "false", orgId: orgId }))
          .then(function (r) { return r.courses; });
      },
      get: function (id) { return get("/courses/" + id).then(function (r) { return r.course; }); },
      create: function (data) { return post("/courses", data).then(function (r) { return r.course; }); },
      update: function (id, patchData) {
        return patch("/courses/" + id, patchData).then(function (r) { return r.course; });
      },
      members: function (id) {
        return get("/courses/" + id + "/members").then(function (r) { return r.members; });
      },
      enrol: function (id, accountId, role, remove) {
        return post("/courses/" + id + "/members",
          { accountId: accountId, role: role || "student", remove: !!remove })
          .then(function (r) { return r.members; });
      },
      assignments: function (id) {
        return get("/courses/" + id + "/assignments").then(function (r) { return r.assignments; });
      },
      addAssignment: function (id, data) {
        return post("/courses/" + id + "/assignments", data)
          .then(function (r) { return r.assignment; });
      },
      updateAssignment: function (assignmentId, data) {
        return patch("/assignments/" + assignmentId, data)
          .then(function (r) { return r.assignment; });
      },
      removeAssignment: function (assignmentId) { return del("/assignments/" + assignmentId); }
    },

    /* ----------------------------------------------------------- Grades
       Read by the student they belong to and by the teachers of their
       courses; written only by those teachers. Both rules are enforced on
       the server — this object cannot bypass them and does not try. */
    grades: {
      list: function (opts) {
        opts = opts || {};
        return get("/grades" + q({ courseId: opts.courseId, accountId: opts.accountId }));
      },

      /* A whole class in one call: the students, the work, every mark, each
         student's computed grade, and what is still owed. The console used to
         build this out of sixty requests. */
      book: function (courseId) { return get("/courses/" + courseId + "/gradebook"); },

      /* One mark. `patch` carries only what is changing — a score, a status,
         a comment — because a write that sends the fields it was not asked
         about is a write that quietly reverts them. */
      put: function (assignmentId, accountId, patchData) {
        var body = { assignmentId: assignmentId, accountId: accountId };
        Object.keys(patchData || {}).forEach(function (k) { body[k] = patchData[k]; });
        // Resolves with the mark AND the student's recomputed grade, so a
        // screen can show the new grade without adding up its own columns.
        return put("/grades", body);
      },

      /* Many marks, one request — filling a column. Resolves with what was
         written and what was refused, because a batch that reports only
         success is a batch that loses marks silently. */
      batch: function (entries) {
        return post("/grades/batch", { grades: [].concat(entries) }, { timeout: 30000 });
      },

      history: function (opts) {
        opts = opts || {};
        return get("/grades/history" + q({ assignmentId: opts.assignmentId,
                                           accountId: opts.accountId,
                                           courseId: opts.courseId, limit: opts.limit }))
          .then(function (r) { return r.events; });
      }
    },

    /* -------------------------------------------------------- Study sets
       Authored by teachers, studied by their classes, and stored in the
       database — which is what makes a set a teacher writes something they
       can give to a class rather than something that lives in their browser. */
    studySets: {
      /* Everything this account may study: their courses' sets, sets published
         to their organization, and their own drafts. */
      mine: function () {
        return get("/study-sets").then(function (r) { return r.studySets; });
      },
      authored: function () {
        return get("/study-sets?mine=true").then(function (r) { return r.studySets; });
      },
      forCourse: function (courseId) {
        return get("/study-sets" + q({ courseId: courseId }))
          .then(function (r) { return r.studySets; });
      },
      get: function (setId) {
        return get("/study-sets/" + setId).then(function (r) { return r.studySet; });
      },
      create: function (data) {
        return post("/study-sets", data, { timeout: 20000 })
          .then(function (r) { return r.studySet; });
      },
      update: function (setId, data) {
        return patch("/study-sets/" + setId, data, { timeout: 20000 })
          .then(function (r) { return r.studySet; });
      },
      archive: function (setId) { return del("/study-sets/" + setId); }
    },

    /* -------------------------------------------------------- Graduation
       Diploma progress, computed on the server so that every screen shows
       the same numbers. The transcript behind it is read-only from here for
       anybody who is not an administrator, and the server enforces that —
       these methods cannot get round it and do not try. */
    graduation: {
      get: function (accountId) {
        return get("/graduation" + q({ accountId: accountId }))
          .then(function (r) { return r.graduation; });
      },
      setProgram: function (accountId, data) {
        return put("/accounts/" + accountId + "/program", data)
          .then(function (r) { return r.program; });
      },
      importTranscript: function (accountId, data) {
        return post("/accounts/" + accountId + "/transcripts", data, { timeout: 30000 })
          .then(function (r) { return r.record; });
      },
      updateRecord: function (recordId, data) {
        return patch("/transcripts/" + recordId, data).then(function (r) { return r.record; });
      },
      decide: function (courseId, data) {
        return patch("/transcript-courses/" + courseId, data).then(function (r) { return r.course; });
      }
    },

    /* --------------------------------------------------------- Progress
       The student's own record, synchronised across their devices. Scoped
       finely — one study set, one unit — so two devices working on different
       material never collide. */
    progress: {
      all: function (accountId) {
        return get("/progress" + q({ accountId: accountId }))
          .then(function (r) { return r.progress; });
      },
      put: function (scope, state, courseId) {
        return put("/progress", { scope: scope, state: state, courseId: courseId });
      }
    },

    /* ---------------------------------------------------- Gamification
       Events go up; the award comes back. There is deliberately no way to
       send an XP total from here — the server prices what happened, and this
       adapter has no field in which to argue. */
    gamification: {
      standing: function (accountId) {
        return get("/gamification/standing" + q({ accountId: accountId, tzOffset: tzOffset() }))
          .then(function (r) { return r.standing; });
      },
      report: function (events) {
        return post("/gamification/events",
          { events: [].concat(events), tzOffset: tzOffset() });
      },

      /* The same call, on the way out of the page. `keepalive` is what lets a
         request outlive the document, and it cannot go through `request()`
         because that one aborts on a timeout — which is exactly the thing a
         beacon must not do.

         It lives here rather than in app.js because this file is meant to be
         the only place that knows a backend exists, and an exception carved
         out "just for the beacon" is how a seam stops being one. */
      beacon: function (events) {
        if (!events || !events.length) return false;
        try {
          return fetch(base + "/gamification/events", {
            method: "POST",
            credentials: "include",
            keepalive: true,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ events: [].concat(events), tzOffset: tzOffset() })
          }), true;
        } catch (e) {
          return false;    // nothing more can be done from a page that is closing
        }
      }
    }
  };
})();
