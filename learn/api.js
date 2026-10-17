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
          var fault = ApiError(res.status, err.code || "http_" + res.status,
                               err.message || "The server refused that.", err.field);
          /* Whatever else the server said about the refusal — the blockers of
             an enrollment step, the dates of a booking that cannot be made,
             the checklist lines still open — rides along on the error. */
          Object.keys(err).forEach(function (k) {
            if (k !== "code" && k !== "message" && k !== "field" && !(k in fault)) fault[k] = err[k];
          });
          throw fault;
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

  /* Today, as this person's own calendar says it — what an overdue date is
     measured against. The server's clock is in UTC, which is yesterday for a
     school in New York until evening and tomorrow for one in Pune by lunch. */
  function localDay() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }

  /* The school's day and clock as this person's own: "2026-10-12T09:30". A
     booking is judged against it — hours, notice — and the server's clock is
     in UTC. */
  function localNow() {
    var d = new Date();
    return localDay() + "T" + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
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
    /* Where this account is signed in, and signing out of everywhere but
       here. The server returns raw user-agents; naming them is the page's job. */
    sessions: function () { return get("/auth/sessions").then(function (r) { return r.sessions; }); },
    revokeSessions: function (sessionId) {
      return post("/auth/sessions/revoke", sessionId ? { sessionId: sessionId } : {});
    },
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
      removeAssignment: function (assignmentId) { return del("/assignments/" + assignmentId); },
      gradebook: function (id) { return get("/courses/" + id + "/gradebook"); },

      /* What a course's teachers keep about it that is not a grade: a seating
         chart, lesson plans, stock comments, objectives, an override, an
         announcement. A student of the course is sent announcements only. */
      docs: function (id, kind) {
        return get("/courses/" + id + "/docs" + q({ kind: kind })).then(function (r) { return r.docs; });
      },
      putDoc: function (id, kind, docId, body) {
        return put("/courses/" + id + "/docs/" + kind + "/" + encodeURIComponent(docId), { body: body })
          .then(function (r) { return r.doc; });
      },
      removeDoc: function (id, kind, docId) {
        return del("/courses/" + id + "/docs/" + kind + "/" + encodeURIComponent(docId));
      },

      /* Hand in work that was set on OEdu, with what OEdu measured. Not a
         mark: the teacher marks it. Only a student in the course can. */
      submit: function (assignmentId, result) {
        return post("/assignments/" + assignmentId + "/submission", { result: result || null })
          .then(function (r) { return r.submission; });
      }
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

      /* A whole course in one call: the students, the work, every mark, each
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

      /* Put a mark back to what it was. Not a delete: the change and its
         reversal both stay on the record. */
      undo: function (eventId) {
        return post("/grades/undo", { eventId: eventId });
      },

      /* "What happens if she gets 85 on the final?" Asked of the server,
         because the alternative is a second implementation of the weighting,
         the drop rule and the late penalty — and two of those part company
         the first time a policy changes. Writes nothing. */
      whatif: function (courseId, accountId, changes, impact) {
        return post("/courses/" + courseId + "/whatif",
          { accountId: accountId, changes: [].concat(changes || []), impact: !!impact });
      },

      history: function (opts) {
        opts = opts || {};
        return get("/grades/history" + q({ assignmentId: opts.assignmentId,
                                           accountId: opts.accountId,
                                           courseId: opts.courseId, limit: opts.limit }))
          .then(function (r) { return r.events; });
      }
    },

    /* --------------------------------------------------------- Reporting
       A report card is a view, not a file. There is no generate call here and
       there is not going to be one — `report` asks what the record says now,
       and asking again after a mark changes returns something different. */
    reporting: {
      /* Every course this account teaches, with what each one owes. The
         console's first screen, in one request. */
      teaching: function () { return get("/teaching"); },

      /* Every student the caller teaches, once, with their standing in each
         course they share. A teacher thinks in people as often as in courses. */
      students: function () { return get("/students"); },

      /* Every piece of work set on the courses this person is in, with their
         own mark on it if there is one. The student's half of `teaching` —
         and the only place work with no mark yet can be seen, which is the
         only work anybody can still do something about. */
      coursework: function (accountId) {
        return get("/coursework" + q({ accountId: accountId }));
      },

      /* What has happened to the marks, across every course. */
      activity: function (limit) {
        return get("/activity" + q({ limit: limit })).then(function (r) { return r.events; });
      },

      /* Whether a term's reporting is finished, and whose marking is missing. */
      readiness: function (opts) {
        opts = opts || {};
        return get("/reporting" + q({ courseId: opts.courseId, term: opts.term }));
      },

      /* The sentence about the term, as opposed to the comment on one piece of
         work — which is `grades.put`'s `feedback`. */
      comment: function (courseId, accountId, body, term) {
        return put("/reporting/comment",
          { courseId: courseId, accountId: accountId, body: body, term: term })
          .then(function (r) { return r.comment; });
      },

      report: function (accountId, term) {
        return get("/students/" + accountId + "/report" + q({ term: term }))
          .then(function (r) { return r.report; });
      }
    },

    /* ------------------------------------------------------ Assessments
       What a student has been set, as cards with the rules and no questions;
       and, only to them and only once it has opened, the questions. Never an
       answer — the server refuses to store one. */
    assessments: {
      mine: function () { return get("/assessments").then(function (r) { return r.assessments; }); },
      // Every assessment in the school, for an administrator.
      all: function () { return get("/assessments?all=true").then(function (r) { return r.assessments; }); },
      get: function (id) {
        return get("/assessments/" + encodeURIComponent(id)).then(function (r) { return r.assessment; });
      }
    },

    /* -------------------------------------------------------- Study sets
       Authored by teachers, studied by their students, and stored in the
       database — which is what makes a set a teacher writes something they
       can give to a course rather than something that lives in their browser. */
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
      putEhsRecord: function (accountId, data) {
        return put("/accounts/" + accountId + "/ehs-record", data, { timeout: 30000 })
          .then(function (r) { return r.record; });
      },
      updateRecord: function (recordId, data) {
        return patch("/transcripts/" + recordId, data).then(function (r) { return r.record; });
      },
      decide: function (courseId, data) {
        return patch("/transcript-courses/" + courseId, data).then(function (r) { return r.course; });
      }
    },

    /* ----------------------------------------------------------- Family
       A student's guardians, and the school record beyond marks. A family
       reads all of it and writes only their own contact card; the server
       decides that, not the page that happens to hide the edit buttons. */
    family: {
      /* The children the signed-in person is family to. Names nobody, so
         there is nothing to change to ask for somebody else's. */
      mine: function () { return get("/family"); },
      guardians: function (studentId) {
        return get("/students/" + studentId + "/guardians").then(function (r) { return r.guardians; });
      },
      addGuardian: function (studentId, data) {
        return post("/students/" + studentId + "/guardians", data, { timeout: 20000 })
          .then(function (r) { return r.guardians; });
      },
      removeGuardian: function (studentId, guardianId) {
        return del("/students/" + studentId + "/guardians/" + encodeURIComponent(guardianId))
          .then(function (r) { return r.guardians; });
      },
      getContact: function (accountId) {
        return get("/accounts/" + accountId + "/contact").then(function (r) { return r.contact; });
      },
      contact: function (accountId, data) {
        return put("/accounts/" + accountId + "/contact", data).then(function (r) { return r.contact; });
      },
      records: function (studentId) {
        return get("/students/" + studentId + "/records").then(function (r) { return r.sections; });
      },
      putRecord: function (studentId, section, data) {
        return put("/students/" + studentId + "/records/" + section, data)
          .then(function (r) { return r.record; });
      },
      clearRecord: function (studentId, section) {
        return del("/students/" + studentId + "/records/" + section);
      }
    },

    /* ------------------------------------------- Behavior and health
       Conduct entries and health records. Who may read or write either is the
       server's decision; a refusal comes back as a 403 with the rule named. */
    conduct: {
      list: function (o) { o = o || {}; return get("/conduct" + q(o)); },
      forStudent: function (id) { return get("/conduct" + q({ studentId: id })); },
      summary: function (today) { return get("/conduct/summary" + q({ today: today })); },
      get: function (id) { return get("/conduct/" + id); },
      create: function (data) { return post("/conduct", data); },
      update: function (id, data) { return patch("/conduct/" + id, data); },
      act: function (id, action, data) { return post("/conduct/" + id + "/actions/" + action, data || {}); }
    },
    /* ------------------------------------------------------------ India
       Classes, the numbers a board and the state ask for, and consent. Read by
       the office, written by the administrator and registrar; a refusal is a
       403 with the rule named. */
    india: {
      classes: function (year) { return get("/india/classes" + q({ year: year })); },
      putClass: function (data) { return put("/india/classes", data); },
      students: function (classId) { return get("/india/students" + q({ classId: classId })); },
      student: function (id) { return get("/students/" + id + "/india"); },
      putStudent: function (id, data) { return put("/students/" + id + "/india", data); },
      compliance: function () { return get("/india/compliance"); },
      exportKind: function (kind) { return get("/india/export/" + kind); },
      importRows: function (rows, check) { return post("/india/import", { rows: rows, check: !!check }, { timeout: 60000 }); }
    },
    // Not `health`: that name is the connectivity check above, and the second
    // definition of a key in an object literal silently replaces the first.
    healthRecords: {
      list: function (o) { return get("/health-records" + q(o || {})); },
      forStudent: function (id) { return get("/health-records" + q({ studentId: id })); },
      summary: function (today) { return get("/health-records/summary" + q({ today: today })); },
      flags: function (o) { return get("/health-records/flags" + q(o)).then(function (r) { return r.flags; }); },
      create: function (data) { return post("/health-records", data); },
      update: function (id, data) { return patch("/health-records/" + id, data); },
      history: function (id) { return get("/health-records/" + id + "/history").then(function (r) { return r.events; }); }
    },

    /* ------------------------------------------------------- Facilities
       Rooms, what is in them, what has to be done, who holds a room when.
       Every call carries the school's own day, because "overdue" and "too
       late to book" are questions about this person's calendar, not the
       server's. A refusal comes back as a 409 with `unavailable` or
       `unfinished` saying exactly which. */
    facilities: {
      summary: function () { return get("/facilities/summary" + q({ today: localDay() })); },
      team: function () { return get("/facilities/team").then(function (r) { return r.team; }); },
      templates: function () { return get("/facilities/templates").then(function (r) { return r.templates; }); },
      reports: function (from, to) { return get("/facilities/reports" + q({ from: from, to: to, today: localDay() })).then(function (r) { return r.report; }); },

      spaces: function () { return get("/facilities/spaces").then(function (r) { return r.spaces; }); },
      space: function (id) { return get("/facilities/spaces/" + id + q({ today: localDay() })); },
      addSpaces: function (data) { return post("/facilities/spaces", data).then(function (r) { return r.spaces; }); },
      updateSpace: function (id, data) { return patch("/facilities/spaces/" + id, data).then(function (r) { return r.space; }); },
      spaceRules: function (data) { return put("/facilities/spaces/rules", data); },
      count: function (id, codes, apply) {
        return post("/facilities/spaces/" + id + "/count", { codes: codes, apply: !!apply, today: localDay() });
      },

      assets: function (o) { return get("/facilities/assets" + q(Object.assign({ today: localDay() }, o || {}))); },
      asset: function (id) { return get("/facilities/assets/" + id + q({ today: localDay() })); },
      addAsset: function (data) { return post("/facilities/assets", data).then(function (r) { return r.asset; }); },
      updateAsset: function (id, data) { return patch("/facilities/assets/" + id, data).then(function (r) { return r.asset; }); },

      orders: function (o) { return get("/facilities/orders" + q(Object.assign({ today: localDay() }, o || {}))); },
      openIn: function (spaceId) { return get("/facilities/orders" + q({ brief: 1, spaceId: spaceId })).then(function (r) { return r.open; }); },
      order: function (id) { return get("/facilities/orders/" + id + q({ today: localDay() })); },
      addOrder: function (data) { data.today = localDay(); return post("/facilities/orders", data); },
      updateOrder: function (id, data) { data.today = localDay(); return patch("/facilities/orders/" + id, data).then(function (r) { return r.order; }); },
      act: function (id, action, data) {
        data = data || {};
        data.today = localDay();
        return post("/facilities/orders/" + id + "/actions/" + action, data).then(function (r) { return r.order; });
      },
      addPhoto: function (id, file) { return post("/facilities/orders/" + id + "/files", file, { timeout: 30000 }); },
      photo: function (id, fileId) { return get("/facilities/orders/" + id + "/files/" + fileId, { timeout: 30000 }).then(function (r) { return r.file; }); },

      schedules: function () { return get("/facilities/schedules" + q({ today: localDay() })); },
      schedule: function (id) { return get("/facilities/schedules/" + id + q({ today: localDay() })); },
      addSchedule: function (data) { data.today = localDay(); return post("/facilities/schedules", data).then(function (r) { return r.schedule; }); },
      updateSchedule: function (id, data) { data.today = localDay(); return patch("/facilities/schedules/" + id, data).then(function (r) { return r.schedule; }); },
      scheduleAct: function (id, action) { return post("/facilities/schedules/" + id + "/actions/" + action, { today: localDay() }); },

      bookings: function (o) { return get("/facilities/bookings" + q(Object.assign({ today: localDay() }, o || {}))); },
      book: function (data) { data.nowAt = localNow(); return post("/facilities/bookings", data); },
      bookAct: function (id, action, data) {
        data = data || {};
        data.today = localDay();
        return post("/facilities/bookings/" + id + "/actions/" + action, data).then(function (r) { return r.bookings; });
      },

      vendors: function () { return get("/facilities/vendors" + q({ today: localDay() })).then(function (r) { return r.vendors; }); },
      vendor: function (id) { return get("/facilities/vendors/" + id + q({ today: localDay() })); },
      addVendor: function (data) { data.today = localDay(); return post("/facilities/vendors", data).then(function (r) { return r.vendor; }); },
      updateVendor: function (id, data) { data.today = localDay(); return patch("/facilities/vendors/" + id, data).then(function (r) { return r.vendor; }); },

      documents: function (o) { return get("/facilities/documents" + q(Object.assign({ today: localDay() }, o || {}))).then(function (r) { return r.documents; }); },
      addDocument: function (data) { data.today = localDay(); return post("/facilities/documents", data).then(function (r) { return r.document; }); },
      updateDocument: function (id, data) { data.today = localDay(); return patch("/facilities/documents/" + id, data).then(function (r) { return r.document; }); },
      putDocumentFile: function (id, file) { return post("/facilities/documents/" + id + "/file", file, { timeout: 30000 }).then(function (r) { return r.document; }); },
      documentFile: function (id) { return get("/facilities/documents/" + id + "/file", { timeout: 30000 }).then(function (r) { return r.file; }); }
    },

    /* ------------------------------------------------------- Enrollment
       Admitting a student, as a workflow. An application is one attempt to
       be admitted for one school year; an enrollment is that student's year
       once it has been approved and activated. Every step is a call to
       `act`, and the server decides whether the step is true and who may
       take it — a refusal comes back as a 409 carrying the `blockers`. */
    enrollment: {
      team: function () { return get("/enrollment/team").then(function (r) { return r.team; }); },
      settings: function () { return get("/enrollment/settings"); },
      putSettings: function (settings) { return put("/enrollment/settings", { settings: settings }); },
      summary: function (year) { return get("/enrollment/summary" + q({ year: year, today: localDay() })); },
      lookup: function (who) { return get("/enrollment/lookup" + q(who)); },
      list: function (opts) {
        opts = opts || {};
        opts.today = localDay();
        return get("/applications" + q(opts));
      },
      get: function (id) { return get("/applications/" + id + q({ today: localDay() })).then(function (r) { return r.application; }); },
      create: function (data) { return post("/applications", data, { timeout: 20000 }); },
      update: function (id, data) { return patch("/applications/" + id, data); },
      act: function (id, action, data) {
        return post("/applications/" + id + "/actions/" + action + q({ today: localDay() }), data || {}, { timeout: 30000 });
      },
      putDocument: function (id, key, data) {
        return put("/applications/" + id + "/documents/" + encodeURIComponent(key), data);
      },
      /* A file is sent as base64 in JSON. The server holds a scan only up to
         what a database row can carry and says so when it is more. */
      uploadFile: function (id, key, file) {
        return post("/applications/" + id + "/documents/" + encodeURIComponent(key) + "/file", file, { timeout: 60000 });
      },
      getFile: function (id, key) {
        return get("/applications/" + id + "/documents/" + encodeURIComponent(key) + "/file", { timeout: 30000 })
          .then(function (r) { return r.file; });
      },
      bulk: function (data) { return post("/applications/bulk", data); },
      reenrol: function (data) { return post("/enrollment/reenrol", data, { timeout: 60000 }); },
      enrollments: function (opts) {
        opts = opts || {};
        opts.today = localDay();
        return get("/enrollments" + q(opts));
      },
      enrollmentAct: function (id, action, data) {
        return post("/enrollments/" + id + "/actions/" + action + q({ today: localDay() }), data || {}, { timeout: 30000 });
      },
      /* What a family sees: the applications it made, or is family to. */
      mine: function () { return get("/family/applications" + q({ today: localDay() })); }
    },

    /* ------------------------------------------------------- Attendance
       One register per course and day. The server decides who may write one
       (the course's teacher, a dean, a principal, a registrar) and who may
       read the school's: this object only asks. */
    attendance: {
      list: function (opts) {
        opts = opts || {};
        return get("/attendance" + q({ courseId: opts.courseId, accountId: opts.accountId, day: opts.day, from: opts.from, to: opts.to }))
          .then(function (r) { return r.attendance; });
      },
      // via: which screen the change came from — register, student, bulk or fix.
      put: function (day, courseId, marks, via) {
        return put("/attendance", { day: day, courseId: courseId || null, marks: marks, via: via || undefined, today: localDay() });
      },
      // Attendance as a mark in the gradebook: a snapshot, one piece of work named "Attendance".
      grade: function (courseId, rules) { return post("/courses/" + courseId + "/attendance-grade", rules, { timeout: 30000 }); },
      // What a mark can say, and what a teacher may change: { codes, lockDays, closed }.
      codes: function () { return get("/attendance/codes"); },
      summary: function (from, to) { return get("/attendance/summary" + q({ from: from, to: to })); },
      // A student's marks as their family reads them: { attendance, online }.
      // online is false when the school has not put attendance online.
      family: function (accountId) { return get("/attendance" + q({ accountId: accountId })); },
      // Which registers were taken on which days, and the marks that look wrong.
      review: function (from, to) { return get("/attendance/review" + q({ from: from, to: to, today: localDay() })); },
      // The history of a mark: one date for everybody, or one student for every date.
      log: function (opts) {
        opts = opts || {};
        return get("/attendance/log" + q({ day: opts.day, accountId: opts.accountId, courseId: opts.courseId }));
      },
      settings: function () { return get("/attendance/settings").then(function (r) { return r.settings; }); },
      putSettings: function (s) { return put("/attendance/settings", s).then(function (r) { return r.settings; }); },
      ada: function (from, to) { return get("/attendance/ada" + q({ from: from, to: to })); },
      remove: function (ids) { return post("/attendance/remove", { ids: ids }); }
    },

    /* ----------------------------------------------------------- Schedule
       The school's courses, its sections (a section is a course with a
       roster), its bell schedules and its calendar. Anyone signed in reads
       the bell schedules and the calendar; the rest is the school's. */
    schedule: {
      subjects: function () { return get("/subjects").then(function (r) { return r.subjects; }); },
      createSubject: function (d) { return post("/subjects", d).then(function (r) { return r.subject; }); },
      updateSubject: function (id, d) { return patch("/subjects/" + id, d).then(function (r) { return r.subject; }); },
      sections: function () { return get("/sections").then(function (r) { return r.sections; }); },
      createSection: function (d) { return post("/sections", d).then(function (r) { return r.section; }); },
      putSection: function (courseId, d) { return put("/sections/" + courseId, d).then(function (r) { return r.section; }); },
      addStudents: function (courseId, d) { return post("/sections/" + courseId + "/students", d); },
      dropStudents: function (courseId, d) { return post("/sections/" + courseId + "/drop", d); },
      studentSections: function (accountId) { return get("/students/" + accountId + "/sections").then(function (r) { return r.sections; }); },
      bell: function () { return get("/bell-schedules").then(function (r) { return r.schedules; }); },
      createBell: function (d) { return post("/bell-schedules", d).then(function (r) { return r.schedule; }); },
      updateBell: function (id, d) { return patch("/bell-schedules/" + id, d).then(function (r) { return r.schedule; }); },
      deleteBell: function (id) { return del("/bell-schedules/" + id); },
      weekdays: function (id) { return post("/bell-schedules/" + id + "/weekdays", {}); },
      calendar: function (from, to) { return get("/calendar" + q({ from: from, to: to })); },
      putPattern: function (d) { return put("/calendar/pattern", d); },
      putDays: function (days) { return put("/calendar/days", { days: days }); },
      day: function (date) { return get("/schedule/day" + q({ date: date })); },
      mine: function (date, accountId) { return get("/schedule/mine" + q({ date: date, accountId: accountId })); },
      /* Monday to Friday as one person has them; a weekend shows the week coming. */
      week: function (accountId) {
        var t = new Date(), dow = t.getDay(), back = dow === 0 ? -6 : 1 - dow;
        if (dow === 0 || dow === 6) back += 7;
        var days = [];
        for (var i = 0; i < 5; i++) {
          var x = new Date(t.getFullYear(), t.getMonth(), t.getDate() + back + i);
          days.push(x.getFullYear() + "-" + ("0" + (x.getMonth() + 1)).slice(-2) + "-" + ("0" + x.getDate()).slice(-2));
        }
        return Promise.all(days.map(function (day) {
          return get("/schedule/mine" + q({ date: day, accountId: accountId })).then(function (r) { r.date = day; return r; });
        }));
      },
      archive: function (courseIds, restore) { return post("/sections/archive", { courseIds: courseIds, restore: !!restore }).then(function (r) { return r.changed; }); },
      drafts: function () { return get("/schedule/drafts").then(function (r) { return r.drafts; }); },
      createDraft: function (d) { return post("/schedule/drafts", d).then(function (r) { return r.draft; }); },
      draft: function (id) { return get("/schedule/drafts/" + id); },
      deleteDraft: function (id) { return del("/schedule/drafts/" + id); },
      addDraftSection: function (id, d) { return post("/schedule/drafts/" + id + "/sections", d).then(function (r) { return r.section; }); },
      putDraftSection: function (id, sid, d) { return put("/schedule/drafts/" + id + "/sections/" + sid, d).then(function (r) { return r.section; }); },
      deleteDraftSection: function (id, sid) { return del("/schedule/drafts/" + id + "/sections/" + sid); },
      previewPublish: function (id) { return get("/schedule/drafts/" + id + "/publish"); },
      publish: function (id) { return post("/schedule/drafts/" + id + "/publish", {}, { timeout: 60000 }); },
      build: function (id, dry) { return post("/schedule/drafts/" + id + "/build", { dry: !!dry }, { timeout: 30000 }); },
      analyze: function (draft) { return get("/schedule/analyze" + q({ draft: draft || "live" })); },
      requests: function (o) { return get("/course-requests" + q(o)).then(function (r) { return r.requests; }); },
      putRequests: function (accountId, list) { return put("/course-requests/" + accountId, { requests: list }); }
    },

    /* --------------------------------------------------- Platform services
       Telling people things, the school's smaller records, files, and data in
       and out. The server decides who may do each; a refusal says why. */
    inbox: {
      list: function (box, archived) { return get("/inbox" + q({ box: box, archived: archived ? 1 : undefined })); },
      unread: function () { return get("/inbox/unread").then(function (r) { return r.unread; }); },
      read: function (ids) { return post("/inbox/read", ids ? { ids: ids } : { all: true }); },
      archive: function (ids, undo) { return post("/inbox/archive", { ids: ids, undo: !!undo }); },
      thread: function (id) { return get("/inbox/thread/" + encodeURIComponent(id)); },
      send: function (d) { return post("/messages", d); },
      prefs: function () { return get("/inbox/prefs"); },
      putPrefs: function (prefs) { return put("/inbox/prefs", { prefs: prefs }); },
      runReminders: function (d) { return post("/reminders/run", d || {}); },
      outbox: function () { return get("/outbox"); },
      flush: function () { return post("/outbox/flush", {}); }
    },
    items: {
      kinds: function () { return get("/item-kinds").then(function (r) { return r.kinds; }); },
      list: function (o) { return get("/items" + q(o || {})).then(function (r) { return r.items; }); },
      get: function (id) { return get("/items/" + id).then(function (r) { return r.item; }); },
      create: function (d) { return post("/items", d).then(function (r) { return r.item; }); },
      update: function (id, d) { return patch("/items/" + id, d).then(function (r) { return r.item; }); },
      remove: function (id) { return del("/items/" + id); }
    },
    files: {
      put: function (d) { return post("/files", d, { timeout: 30000 }).then(function (r) { return r.file; }); },
      get: function (id) { return get("/files/" + id, { timeout: 30000 }).then(function (r) { return r.file; }); },
      remove: function (id) { return del("/files/" + id); }
    },
    exchange: {
      exportRows: function (set, from, to) { return get("/exchange/export" + q({ set: set, from: from, to: to }), { timeout: 60000 }); },
      importRows: function (d) { return post("/exchange/import", d, { timeout: 60000 }); },
      extract: function () { return get("/exchange/extract", { timeout: 60000 }); },
      ping: function () { return post("/exchange/webhooks/test", {}); }
    },
    district: { summary: function () { return get("/district/summary"); } },
    feeds: { link: function () { return get("/feeds/link").then(function (r) { return r.url; }); } },

    /* ------------------------------------------------- Marking periods
       Open, grading, posted, locked: one way forward. Posting a course
       freezes what each student earned in it, and a posted grade moves only
       by a request someone else approves. */
    periods: {
      list: function () { return get("/periods").then(function (r) { return r.periods; }); },
      create: function (data) { return post("/periods", data).then(function (r) { return r.period; }); },
      move: function (id, state) { return patch("/periods/" + id, { state: state }).then(function (r) { return r.period; }); },
      post: function (id, courseId) { return post("/periods/" + id + "/post", { courseId: courseId }, { timeout: 30000 }); },
      posted: function (id, opts) {
        opts = opts || {};
        return get("/periods/" + id + "/posted" + q({ courseId: opts.courseId, accountId: opts.accountId })).then(function (r) { return r.posted; });
      },
      changes: function (status) { return get("/grade-changes" + q({ status: status })); },
      decide: function (id, approve, note) { return post("/grade-changes/" + id + "/decision", { approve: !!approve, note: note || null }); }
    },

    /* --------------------------------------------------------- Progress
       The student's own record, synchronised across their devices. Scoped
       finely — one study set, one unit — so two devices working on different
       material never collide. */
    /* --------------------------------------------------------------- Marks
       What a student left in the text. The id travels from the client, so
       posting the same mark twice writes one row — which is what lets the
       reader save locally first and reach the network whenever it can. */
    marks: {
      list: function (opts) {
        opts = opts || {};
        return get("/marks" + q({ scope: opts.scope, accountId: opts.accountId }))
          .then(function (r) { return r.marks || []; });
      },
      put: function (mark) { return post("/marks", mark); },
      remove: function (markId) { return del("/marks/" + encodeURIComponent(markId)); }
    },

    progress: {
      all: function (accountId) {
        return get("/progress" + q({ accountId: accountId }))
          .then(function (r) { return r.progress; });
      },
      /* One scope by name — what a device asks for after its write was
         refused because another device got there first. */
      one: function (scope) {
        return get("/progress" + q({ scope: scope }))
          .then(function (r) { return (r.progress || {})[scope] || null; });
      },
      /* `since` is the server's updatedAt this device last saw for the scope,
         or 0 for "nothing stored yet". Given one, the server refuses (409) a
         write that would overwrite a change this device has not seen. */
      put: function (scope, state, courseId, since) {
        var body = { scope: scope, state: state, courseId: courseId };
        if (since != null) body.base = since;
        return put("/progress", body);
      },
      /* The same write from a page that is closing. Browsers cap keepalive
         bodies, so a copy too large to fit is not attempted — it is still in
         this browser, and the next sign-in merges and sends it. */
      beacon: function (scope, state, since) {
        try {
          var payload = JSON.stringify({ scope: scope, state: state, base: since });
          if (payload.length > 60000) return false;
          fetch(base + "/progress", {
            method: "PUT",
            credentials: "include",
            keepalive: true,
            headers: { "content-type": "application/json" },
            body: payload
          });
          return true;
        } catch (e) {
          return false;
        }
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
