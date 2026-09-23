/* ==========================================================================
   OEdu Family — the family view.

   A family's view of a child's school record: every section a family portal
   is expected to have, laid out as a place rather than a list. It reads the
   same API the student and the teacher read, under the family's own session,
   and the server decides what that session may see. Nothing here is hidden
   for security's sake, and nothing here could grant anything if it tried.

   Two kinds of content, and the page always says which it is showing:

     from the record   computed by the server from marks, transcripts and
                       exams — the same numbers the student sees
     from the school   entered by the school, section by section, and shown
                       exactly as entered. A section the school has not
                       written is empty and says so. Nothing is estimated to
                       fill it.

   The server's plan for a student is written to the student ("send your
   transcript"). Where it is shown here it is labelled as the student's plan
   rather than rewritten, because a reworded instruction is a new instruction
   nobody at the school wrote.

   An administrator can open any student's family view, to see what the
   family will see, and is the only person who can add to the school's part
   or link a guardian.
   ========================================================================== */
(function () {
  "use strict";

  var API = window.OPLO_API;
  var V = window.OPLO_VIZ;
  var SCHOOL = "Excel High School";
  var REDUCED = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* The entrance is an animation from invisible. A page drawn in a tab nobody
     is looking at has its animations paused at their first frame — so it is
     only used when somebody will see it run, or the record would open blank
     in a background tab, an in-app browser or a print preview. */
  function rise() { return !REDUCED && document.visibilityState === "visible" ? " rise" : ""; }
  var FINE = !!(window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches);

  /* ============================================================ Helpers */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) { return V.esc(s); }
  function h(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function btn(cls, html, onClick, label) {
    var b = h("button", cls, html);
    b.type = "button";
    if (label) b.setAttribute("aria-label", label);
    if (onClick) b.addEventListener("click", onClick);
    return b;
  }

  var ICONS = {
    home: "M3 11 12 4l9 7v8.5a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5z",
    learning: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5",
    milestones: "M5 21V4M5 4h12l-2.5 4L17 12H5",
    support: "M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z",
    school: "M3 21h18M5 21V9l7-5 7 5v12M9 21v-5h6v5M10 11h4",
    family: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.9-3.5 3.3-5.5 6.5-5.5s5.6 2 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.7 3 2.5 3.5 5.2",
    grades: "M4 20h16M6 16l4-4.5 3 3 5.5-6.5M15 8h3.5v3.5",
    assignments: "M9 3.5h6v3H9zM7 5H5.5v15.5h13V5H17M9 13.5l2 2 4-4",
    assessments: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 11.3a.7.7 0 1 0 0 1.4.7.7 0 0 0 0-1.4z",
    reading: "M3 5c3-1.2 6-1 9 1 3-2 6-2.2 9-1v14c-3-1.2-6-1-9 1-3-2-6-2.2-9-1zM12 6v14",
    promotion: "M4 20h4v-4h4v-4h4V8h4M16 4h4v4",
    graduation: "M2 9.5 12 4.5l10 5-10 5zM6 11.5v5c3.2 2.6 8.8 2.6 12 0v-5M22 9.5v6",
    pathways: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z",
    iep: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
    supports: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6",
    wellness: "M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9zM6.5 12h3l1.5-2.2 2 4.4 1.5-2.2h3",
    attendance: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4",
    schedule: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3.2 2",
    transportation: "M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12H5zM5 11h14M8 17v3M16 17v3M8.5 14h.01M15.5 14h.01",
    enrollment: "M4 5h16v14H4zM8 10a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM6.5 16c.7-1.7 2-2.5 3.5-2.5s2.8.8 3.5 2.5M15 9h3M15 12h3",
    documents: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
    student: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.2-4 4.3-6 8-6s6.8 2 8 6",
    guardians: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.9-3.5 3.3-5.5 6.5-5.5s5.6 2 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.7 3 2.5 3.5 5.2",
    emergency: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
    search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
    x: "M6 6l12 12M18 6 6 18",
    left: "M15 5l-7 7 7 7",
    right: "M9 5l7 7-7 7",
    down: "M6 9l6 6 6-6",
    edit: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
    plus: "M12 5v14M5 12h14",
    out: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
    ccheck: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12.5l3 3 5-6",
    warn: "M12 4 2.5 20h19zM12 10v4M12 17h.01",
    xcirc: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9l6 6M15 9l-6 6",
    info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5h.01",
    spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
    source: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
    school2: "M12 3l9 5-9 5-9-5zM7 10.5V16c2.8 2 7.2 2 10 0v-5.5",
    link: "M7 17 17 7M9 7h8v8",
    trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
    sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
  };
  function icon(name, size) {
    var s = size || 18;
    return "<svg class='ic' viewBox='0 0 24 24' width='" + s + "' height='" + s + "' fill='none' stroke='currentColor'" +
      " stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='" +
      (ICONS[name] || ICONS.info) + "'/></svg>";
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August",
                     "September", "October", "November", "December"];

  /* Credits as the school writes them: 2.0, 1.75, 15.125 — never 2 or 2.000. */
  function cr(n) {
    if (n == null || !isFinite(n)) return "—";
    var s = (Math.round(n * 1000) / 1000).toFixed(3).replace(/0+$/, "");
    return /\.$/.test(s) ? s + "0" : s;
  }
  function fixed(n, d) { return n == null || !isFinite(n) ? "—" : Number(n).toFixed(d); }
  function trim1(n) { return n == null || !isFinite(n) ? "—" : String(Math.round(n * 10) / 10); }
  function ym(s, long) {
    var m = /^(\d{4})-(\d{2})/.exec(s || "");
    return m ? (long ? MONTHS_LONG : MONTHS)[+m[2] - 1] + " " + m[1] : (s || "—");
  }
  function day(v) {
    if (v == null || v === "") return "—";
    var d = typeof v === "number" ? new Date(v) : new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? v + "T12:00:00" : v);
    if (isNaN(d.getTime())) return String(v);
    return MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }
  function since(ms) {
    if (!ms) return "";
    var s = Math.round((Date.now() - ms) / 1000);
    if (s < 90) return "just now";
    if (s < 3600) return Math.round(s / 60) + " minutes ago";
    if (s < 86400) return Math.round(s / 3600) + " hours ago";
    if (s < 86400 * 14) return Math.round(s / 86400) + " days ago";
    return "on " + day(ms);
  }
  function termShort(t) {
    var m = /(\d{4})\D+(\d+)\s*$/.exec(t || "");
    return m ? "’" + m[1].slice(2) + " T" + m[2] : (t || "");
  }
  function yearShort(y) {
    var m = /^(\d{4})-(\d{4})$/.exec(y || "");
    return m ? m[1] + "–" + m[2].slice(2) : (y || "—");
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  function listOf(a) {
    a = a.filter(Boolean);
    if (a.length < 3) return a.join(" and ");
    return a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  }
  var AREA = {
    english: "English", math: "Math", science: "Science", social_studies: "Social Studies",
    health: "Health", pe: "Physical Education", fine_art: "Fine Art", world_language: "World Language",
    elective: "Electives"
  };
  function areaName(k) {
    return AREA[k] || String(k || "Other").replace(/_/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }
  function chip(kind, textHtml) {
    var ic = { good: "ccheck", warn: "warn", serious: "warn", critical: "xcirc", info: "info" }[kind] || "info";
    return "<span class='st " + kind + "'>" + icon(ic, 14) + textHtml + "</span>";
  }
  var RELATIONSHIP = { parent: "Parent", guardian: "Guardian", grandparent: "Grandparent",
                       foster_parent: "Foster parent", relative: "Relative", other: "Family" };

  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.classList.remove("on"); }, 3600);
  }

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private window */ } }
  };

  /* ============================================================ The map */

  var GROUPS = [
    { key: "learning", name: "Learning", line: "How the work is going, mark by mark." },
    { key: "milestones", name: "Milestones", line: "Where the record is heading.", mirror: true },
    { key: "support", name: "Support and wellbeing", line: "What is in place around the work." },
    { key: "school", name: "School life", line: "The day-to-day of being a student.", mirror: true },
    { key: "family", name: "Family", line: "Who the student is, and who to call." }
  ];

  /* Every section, in the order a family reads it. `facts` and `columns` are
     what an administrator is offered when they first write a section — a
     starting shape, not a rule; the school can rename or remove any of it. */
  var SECTIONS = [
    { key: "grades", name: "Grades", group: "learning", icon: "grades", size: "w2 h2 big",
      empty: "Marks appear here once there is a transcript or a marked course on the record.",
      facts: [], columns: ["Course", "Term", "Mark", "Credit"] },
    { key: "assignments", name: "Assignments", group: "learning", icon: "assignments",
      empty: "Work a teacher sets appears here with its due date — and, once marked, the score and the comment.",
      facts: [], columns: ["Assignment", "Course", "Due", "Status"] },
    { key: "reading_math", name: "Reading and Math Progress", group: "learning", icon: "reading",
      empty: "Reading and math benchmarks appear here when the school records them.",
      facts: ["Reading level", "Math level", "Last benchmark"], columns: ["Benchmark", "Date", "Reading", "Math"] },
    { key: "assessments", name: "Assessments", group: "learning", icon: "assessments", size: "w2",
      empty: "State exams and course tests appear here as they are recorded.",
      facts: [], columns: ["Assessment", "Date", "Score", "Result"] },

    { key: "graduation", name: "Graduation Tracker", group: "milestones", icon: "graduation", size: "w2 h2 big",
      empty: "The road to a diploma appears here once there is a record to measure it against.",
      facts: [], columns: ["Requirement", "Needed", "Earned"] },
    { key: "promotion", name: "Promotion Tracker", group: "milestones", icon: "promotion", size: "w2",
      empty: "The school's promotion decision appears here once it has been made.",
      facts: ["Promotion status", "Next grade", "Decided on"], columns: ["Requirement", "Needed", "On record"] },
    { key: "pathways", name: "College and Career Pathways", group: "milestones", icon: "pathways", size: "w2",
      empty: "Interests, a counselor's plan and college and career milestones appear here when the school adds them.",
      facts: ["Interests", "Counselor", "Plan after high school"], columns: ["Milestone", "Target date", "Status"] },

    { key: "attendance", name: "Attendance", group: "support", icon: "attendance", size: "w2 h2 big",
      empty: "Days present, absent and late appear here once the school records attendance.",
      facts: ["Attendance rate", "Days present", "Days absent", "Late arrivals"], columns: ["Month", "Present", "Absent", "Late"] },
    { key: "iep", name: "IEP", group: "support", icon: "iep",
      empty: "If there is an Individualized Education Program, its services and review dates are recorded here.",
      facts: ["IEP on file", "Classification", "Annual review", "Next reevaluation", "Case manager"],
      columns: ["Service", "Frequency", "Group size", "Location"] },
    { key: "supports", name: "Student Academic Supports", group: "support", icon: "supports",
      empty: "Tutoring, intervention and other academic supports appear here when the school records them.",
      facts: [], columns: ["Support", "Subject", "When", "With"] },
    { key: "wellness", name: "Student Wellness", group: "support", icon: "wellness", size: "w2",
      empty: "Counseling and wellness information appears here if the school shares it.",
      facts: ["Counselor", "Last check-in"], columns: ["Date", "Note"] },

    { key: "schedule", name: "Schedule", group: "school", icon: "schedule", size: "w2 h2 big",
      empty: "Class periods, rooms and teachers appear here when the school publishes a schedule.",
      facts: [], columns: ["Period", "Course", "Teacher", "Room", "Days"] },
    { key: "transportation", name: "Transportation", group: "school", icon: "transportation",
      empty: "A bus route, stops and times appear here if the school arranges transportation.",
      facts: ["Eligibility", "Mode", "Route"], columns: ["Leg", "Stop", "Time"] },
    { key: "enrollment", name: "Enrollment", group: "school", icon: "enrollment",
      empty: "Enrollment dates and status appear here once the school records them.",
      facts: ["Status", "Admitted", "Grade", "Official class"], columns: [] },
    { key: "documents", name: "Student Documents", group: "school", icon: "documents", size: "w2",
      empty: "Report cards, letters and forms the school files appear here.",
      facts: [], columns: ["Document", "Date", "From", "Status"] },

    { key: "guardians", name: "Guardians", group: "family", icon: "guardians", size: "w2 h2 big", record: false,
      empty: "Nobody is linked to this student as family yet." },
    { key: "student", name: "Student", group: "family", icon: "student", size: "w2",
      empty: "Details such as a preferred name appear here when the school adds them.",
      facts: ["Preferred name", "Pronouns", "Home language"], columns: [] },
    { key: "emergency", name: "Emergency Contact", group: "family", icon: "emergency", size: "w2",
      empty: "Emergency contacts appear here when the school records them.",
      facts: [], columns: ["Name", "Relationship", "Phone", "Alternate phone"] }
  ];
  var SEC = {};
  SECTIONS.forEach(function (s, i) { s.index = i; SEC[s.key] = s; });
  function groupOf(key) { return GROUPS.filter(function (g) { return g.key === key; })[0]; }

  /* ============================================================== State */

  var S = {
    me: null,          // /me
    family: null,      // /family
    admin: false,      // may preview any student and write the school's part
    student: null,     // who this view is about
    data: null,        // everything read about them, each part settled on its own
    open: null,        // the open section
    pushed: false,     // whether opening it added a history entry
    lastTile: null,
    dirty: false       // the home screen needs redrawing when the sheet closes
  };

  function part(k) { return S.data && S.data[k] && S.data[k].ok ? S.data[k].v : null; }
  function partError(k) { return S.data && S.data[k] && !S.data[k].ok ? S.data[k].e : null; }
  function grad() { return part("grad"); }
  function records() {
    if (!S.data) return {};
    if (!S.data.records.ok) return {};
    S.data.records.v = S.data.records.v || {};
    return S.data.records.v;
  }
  function rec(key) { return records()[key] || null; }
  /* The name the school says a student goes by, where it says one. Sentences
     use it; the legal name stays where a legal name belongs — at the top of
     the page and on the Student card. */
  function factOf(key, label) {
    var r = rec(key);
    var f = r && (r.facts || []).filter(function (x) {
      return String(x.label).toLowerCase() === label.toLowerCase() && x.value;
    })[0];
    return f ? f.value : null;
  }
  function preferred() { return factOf("student", "Preferred name"); }
  function first() {
    return preferred() || (S.student && (S.student.firstName || (S.student.name || "").split(/\s+/)[0])) || "The student";
  }
  function ageOf(dob) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob || "");
    if (!m) return null;
    var now = new Date(), a = now.getFullYear() - +m[1];
    if (now.getMonth() + 1 < +m[2] || (now.getMonth() + 1 === +m[2] && now.getDate() < +m[3])) a--;
    return a;
  }
  function possessive(name) { return name + (/s$/i.test(name) ? "’" : "’s"); }

  /* ============================================================== Theme */

  function applyTheme(t) {
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
    store.set("oedu-family-theme", t === "light" || t === "dark" ? t : null);
  }
  function currentTheme() { return document.documentElement.getAttribute("data-theme") || "system"; }

  /* ============================================================ Sign in
     There is no sign-in on this page. Everybody — administrators, teachers,
     students and families — signs in on the one page at the root of OEdu,
     which sends each person to their own address by their roles (home.js).
     Arriving here signed out goes there, and comes straight back afterwards. */

  var H = window.OPLO_HOME;
  var ROOT = H.parse(location.pathname).root;

  function toSignIn() {
    location.replace(ROOT + "?next=" + encodeURIComponent(location.pathname + location.search + location.hash));
  }

  /* ============================================================== Start */

  function start() {
    wireShell();
    API.me().then(signedIn, function (e) {
      if (e && e.code === "offline") {
        return problemScreen("The Oplo account service is not answering.", "It could not be reached at " + API.base() + ".");
      }
      toSignIn();
    });
  }

  function hasRole(me, product, role) {
    return (me.roles || []).some(function (r) { return r.product === product && r.role === role; });
  }

  function signedIn(me) {
    // Somebody whose roles do not include this page is sent to their own.
    var dest = H.destination(me.roles, location, null);
    if (!dest.stay) { location.replace(dest.href); return; }
    S.me = me;
    $("#boot").hidden = false;
    API.family.mine().then(function (fam) {
      S.family = fam;
      S.admin = !!fam.canPreview;
      var want = new URLSearchParams(location.search).get("student");
      var kids = fam.students || [];
      var mine = kids.filter(function (k) { return k.id === want; })[0];
      if (mine) return choose(mine);
      if (want && S.admin) {
        return API.accounts.get(want).then(function (a) { choose(a); },
          function (e) { problemScreen("That student could not be opened.", e.message); });
      }
      if (kids.length) return choose(kids[0]);
      if (S.admin) return pickStudent();
      if (hasRole(me, "learn", "guardian")) {
        return noticeScreen("No student is linked to your account yet.",
          "The school links a family to a student. Once they have, " + "everything the school keeps " +
          "about your child appears here.");
      }
      return noticeScreen("This is the family view.",
        "It is for parents and guardians. Your own work is in <a href='../'>OEdu</a>.");
    }, function (e) {
      if (e && e.status === 401) return toSignIn();
      problemScreen("The family view could not be opened.", e && e.message);
    });
  }

  function shellOn() {
    $("#boot").hidden = true;
    $("#app").hidden = false;
    paintMe();
  }

  function noticeScreen(title, body) {
    shellOn();
    $("#who").hidden = true;
    $("#dock").hidden = true;
    $("#findBtn").hidden = true;
    var st = $("#stage");
    st.innerHTML = "";
    var box = h("div", "fh-portrait" + rise());
    box.style.gridTemplateColumns = "1fr";
    box.style.maxWidth = "760px";
    box.style.margin = "8vh auto 0";
    box.innerHTML = "<div><p class='fh-eyebrow'>OEdu Family</p><h1 class='fh-name'>" + esc(title) + "</h1>" +
      "<p style='color:var(--ink-2);font-size:17px;max-width:52ch'>" + body + "</p></div>";
    st.appendChild(box);
  }
  function problemScreen(title, detail) {
    noticeScreen(title, esc(detail || "Something went wrong reaching the record.") +
      " <a href='' onclick='location.reload();return false'>Try again</a>.");
  }

  /* An administrator with nobody linked: every account in the organisation,
     to open the family view of any one of them. */
  function pickStudent() {
    shellOn();
    $("#who").hidden = true;
    $("#dock").hidden = true;
    $("#findBtn").hidden = true;
    var st = $("#stage");
    st.innerHTML = "";
    var wrap = h("div", rise().trim());
    wrap.style.maxWidth = "900px";
    wrap.style.margin = "4vh auto 0";
    wrap.innerHTML = "<p class='fh-eyebrow'>OEdu Family · administrator</p>" +
      "<h1 class='fh-name'>Whose family view?</h1>" +
      "<p style='color:var(--ink-2);max-width:60ch;margin-bottom:22px'>Open a student to see exactly what their " +
      "family sees, add a guardian, and fill in the parts of the record that are not marks.</p>";
    var list = h("div", "people");
    list.innerHTML = "<p style='color:var(--ink-3)'>Reading the organisation…</p>";
    wrap.appendChild(list);
    st.appendChild(wrap);
    var orgId = (S.me.organizations && S.me.organizations[0]) ? S.me.organizations[0].id : null;
    API.accounts.list(orgId).then(function (people) {
      list.innerHTML = "";
      people.filter(function (p) { return p.id !== S.me.id; }).forEach(function (p) {
        var b = btn("person", "", function () {
          history.replaceState(null, "", "?student=" + encodeURIComponent(p.id));
          choose(p);
        });
        b.style.textAlign = "left";
        b.innerHTML = "<div class='top'><span class='av lg' style='--hue:" + esc(p.hue || "#2a78d6") + "'>" +
          esc(p.initials || "") + "</span><div><div class='nm'>" + esc(p.name) + "</div><div class='rel'>" +
          esc(p.title || p.email || "") + "</div></div></div>";
        list.appendChild(b);
      });
    }, function (e) { list.innerHTML = "<div class='problem'>" + esc(e.message) + "</div>"; });
  }

  function settle(p) {
    return Promise.resolve(p).then(function (v) { return { ok: true, v: v }; },
                                   function (e) { return { ok: false, e: e }; });
  }

  function choose(student) {
    S.student = student;
    S.data = null;
    closeSheet(true);
    var kids = (S.family && S.family.students) || [];
    if (S.admin || kids.length > 1) {
      var q = "?student=" + encodeURIComponent(student.id);
      if (location.search !== q) history.replaceState(null, "", q + location.hash);
    }
    shellOn();
    $("#who").hidden = false;
    $("#dock").hidden = false;
    $("#findBtn").hidden = false;
    paintWho();
    paintBanner();
    var st = $("#stage");
    st.innerHTML = "";
    $("#boot").hidden = false;

    var id = student.id;
    var calls = {
      grad: API.graduation.get(id),
      work: API.reporting.coursework(id),
      report: API.reporting.report(id),
      records: API.family.records(id),
      guardians: API.family.guardians(id),
      progress: API.progress.all(id),
      standing: API.gamification.standing(id),
      contact: API.family.getContact(id)
    };
    var keys = Object.keys(calls);
    return Promise.all(keys.map(function (k) { return settle(calls[k]); })).then(function (out) {
      if (S.student !== student) return;
      var d = {};
      keys.forEach(function (k, i) { d[k] = out[i]; });
      S.data = d;
      var g = grad();
      if (g && g.program && S.student.gradeLevel == null) S.student.gradeLevel = g.program.gradeLevel;
      $("#boot").hidden = true;
      paintWho();
      renderHome();
      route();
    });
  }

  /* ============================================================== Shell */

  function paintMe() {
    var me = S.me;
    if (!me) return;
    $("#me").innerHTML = "<span class='av' style='--hue:" + esc(me.hue || "#0f766e") + "'>" + esc(me.initials || "") + "</span>";
    $("#me").setAttribute("aria-label", "Your account: " + (me.name || me.email));
  }

  function paintWho() {
    var s = S.student;
    if (!s) return;
    var kids = (S.family && S.family.students) || [];
    var can = S.admin || kids.length > 1;
    var w = $("#who");
    w.innerHTML = "<span class='av' style='--hue:" + esc(s.hue || "#2a78d6") + "'>" + esc(s.initials || "") + "</span>" +
      "<span class='nm'>" + esc(s.name || "") + "</span>" +
      (s.gradeLevel != null ? "<span class='gr'>Grade " + esc(s.gradeLevel) + "</span>" : "") +
      (can ? "<span class='chev'>" + icon("down", 14) + "</span>" : "");
    w.disabled = !can;
  }

  function paintBanner() {
    var b = $("#banner");
    var kids = (S.family && S.family.students) || [];
    var linked = kids.some(function (k) { return S.student && k.id === S.student.id; });
    if (S.admin && !linked) {
      b.hidden = false;
      b.innerHTML = icon("info", 16) + "<span><b>Administrator preview.</b> This is what " +
        esc(possessive(first())) + " family sees. Only you can add to the school's part.</span>";
    } else b.hidden = true;
  }

  function openMenu(anchor, fill) {
    var m = $("#menu");
    if (!m.hidden && m.anchor === anchor) { closeMenu(); return; }
    m.innerHTML = "";
    fill(m);
    m.hidden = false;
    m.anchor = anchor;
    anchor.setAttribute("aria-expanded", "true");
    var r = anchor.getBoundingClientRect();
    var w = m.offsetWidth;
    m.style.top = (r.bottom + 8) + "px";
    m.style.left = Math.max(10, Math.min(window.innerWidth - w - 10, r.left + r.width / 2 - w / 2)) + "px";
    var firstBtn = m.querySelector("button, a");
    if (firstBtn) firstBtn.focus();
  }
  function closeMenu() {
    var m = $("#menu");
    if (m.hidden) return;
    m.hidden = true;
    if (m.anchor) { m.anchor.setAttribute("aria-expanded", "false"); m.anchor = null; }
  }

  function wireShell() {
    $("#who").addEventListener("click", function () {
      var kids = (S.family && S.family.students) || [];
      openMenu($("#who"), function (m) {
        m.appendChild(h("div", "hd", "<b>" + (S.admin ? "Students" : "Your children") + "</b>"));
        kids.forEach(function (k) {
          var b = btn("", "<span class='av' style='--hue:" + esc(k.hue || "#2a78d6") + "'>" + esc(k.initials || "") +
            "</span><span>" + esc(k.name) + "</span>", function () { closeMenu(); choose(k); });
          b.setAttribute("role", "menuitemradio");
          b.setAttribute("aria-checked", String(S.student && S.student.id === k.id));
          m.appendChild(b);
        });
        if (S.admin) {
          if (kids.length) m.appendChild(h("div", "sep"));
          m.appendChild(btn("", icon("search", 16) + "<span>Open another student…</span>", function () {
            closeMenu();
            history.replaceState(null, "", location.pathname);
            S.student = null;
            pickStudent();
          }));
        }
      });
    });

    $("#me").addEventListener("click", function () {
      openMenu($("#me"), function (m) {
        m.appendChild(h("div", "hd", "<b>" + esc(S.me.name || "") + "</b><span>" + esc(S.me.email || "") + "</span>"));
        var seg = h("div", "seg");
        [["system", "Auto"], ["light", "Light"], ["dark", "Dark"]].forEach(function (t) {
          var b = btn("", t[1], function () {
            applyTheme(t[0]);
            [].forEach.call(seg.children, function (x) { x.setAttribute("aria-pressed", "false"); });
            b.setAttribute("aria-pressed", "true");
            if (S.data) { renderHome(); if (S.open) renderSheet(S.open); }
          });
          b.setAttribute("aria-pressed", String(currentTheme() === t[0]));
          seg.appendChild(b);
        });
        m.appendChild(seg);
        var more = (S.me.roles || []).some(function (r) {
          return r.product === "platform" || (r.product === "learn" && r.role !== "guardian");
        });
        if (more) {
          var a = h("a", "", icon("link", 16) + "<span>Open OEdu</span>");
          a.href = H.pathFor(ROOT, H.home(S.me.roles));
          m.appendChild(a);
        }
        m.appendChild(h("div", "sep"));
        m.appendChild(btn("", icon("out", 16) + "<span>Sign out</span>", function () {
          closeMenu();
          API.logout().catch(function () { /* already gone */ }).then(function () {
            // Everything read about a child goes with the session, rather than
            // staying in memory for whoever picks up the device next.
            S.me = S.family = S.student = S.data = null;
            $("#stage").innerHTML = "";
            closeSheet(true);
            location.replace(ROOT);
          });
        }));
      });
    });

    $("#findBtn").innerHTML = icon("search", 17) + "<span class='lbl'>Find a section</span><kbd>⌘K</kbd>";
    $("#findBtn").addEventListener("click", openFinder);

    document.addEventListener("click", function (e) {
      var m = $("#menu");
      if (!m.hidden && !m.contains(e.target) && m.anchor && !m.anchor.contains(e.target)) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (!S.data) return;
        e.preventDefault();
        openFinder();
        return;
      }
      if (e.key === "Escape") {
        if (!$("#finder").hidden) { closeFinder(); return; }
        if (!$("#menu").hidden) { closeMenu(); return; }
        if (S.open) { dismiss(); return; }
      }
      if (e.key === "/" && S.data && !/INPUT|TEXTAREA|SELECT/.test((e.target.tagName || "")) && $("#finder").hidden) {
        e.preventDefault();
        openFinder();
      }
    });
    window.addEventListener("hashchange", route);
    $("#sheetScrim").addEventListener("click", dismiss);
    window.addEventListener("scroll", function () { V.tipHide(); closeMenu(); }, { passive: true });
  }

  /* ============================================================= Router */

  function route() {
    if (!S.data) return;
    var key = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    if (key && SEC[key]) openSheet(key, S.lastTile);
    else if (S.open) closeSheet();
    S.lastTile = null;
  }

  function go(key, tile) {
    S.lastTile = tile || null;
    if (S.open) {
      location.replace("#/" + key);
    } else {
      S.pushed = true;
      location.hash = "/" + key;
    }
  }

  function dismiss() {
    if (!S.open) return;
    if (S.pushed) { S.pushed = false; history.back(); }
    else {
      history.replaceState(null, "", location.pathname + location.search);
      closeSheet();
    }
  }

  /* ============================================================== Home */

  function renderHome() {
    var st = $("#stage");
    st.innerHTML = "";
    st.appendChild(phoneHome());
    st.appendChild(hero());
    GROUPS.forEach(function (g, i) { st.appendChild(constellation(g, i)); });
    var foot = h("footer", "fm-foot");
    foot.innerHTML = "<p>Everything here is read from " + esc(SCHOOL) + "’s record for " + esc(S.student.name || "") +
      ", under your own sign-in. Families can read all of it; only the school can change it. Sections marked " +
      "<b>From the record</b> are computed from marks and transcripts, the same numbers the student sees. " +
      "Sections marked <b>From the school</b> are entered by the school.</p>";
    st.appendChild(foot);
    paintDock();
    wireTilt(st);
    S.dirty = false;
  }

  function hero() {
    var g = grad();
    var s = S.student;
    var wrap = h("section", "fh" + rise());
    wrap.id = "g-home";

    /* ----- the portrait: the student at the centre of their own record */
    var p = h("div", "fh-portrait");
    var orb = h("div", "fh-orb");
    orb.style.setProperty("--hue", s.hue || "#2a78d6");
    orb.appendChild(h("div", "halo"));
    if (g && g.track) {
      var ehsApplied = Math.min(g.totals.ehsEarned || 0, g.totals.applied || 0);
      orb.appendChild(V.ring({
        size: 240, stroke: 9, total: g.track.total, title: "Credits toward the diploma",
        label: cr(g.totals.applied) + " of " + g.track.total + " credits toward the diploma",
        segments: [
          { value: (g.totals.applied || 0) - ehsApplied, cls: "s-transfer", label: "Transferred", text: cr((g.totals.applied || 0) - ehsApplied) },
          { value: ehsApplied, cls: "s-ehs", label: "Earned at " + SCHOOL, text: cr(ehsApplied) }
        ],
        rest: { label: "Still to plan", text: cr(g.totals.remaining) }
      }));
    }
    orb.appendChild(h("div", "face", esc(s.initials || (s.name || "?").slice(0, 1))));
    p.appendChild(orb);

    var txt = h("div");
    var t = g && g.transfer;
    txt.appendChild(h("p", "fh-eyebrow", esc(S.admin && !isLinked() ? "Family view · preview" : "Your family view")));
    txt.appendChild(h("h1", "fh-name", esc(s.name || "")));
    var pref = preferred();
    var gradeLevel = g && g.program && g.program.gradeLevel != null ? g.program.gradeLevel : s.gradeLevel;
    var enrolled = !!(g && g.enrollment && (g.enrollment.enrolledOn || g.enrollment.status === "active"));
    var where = enrolled
      ? SCHOOL + (g.enrollment.enrolledOn ? " since " + day(g.enrollment.enrolledOn) : "")
      : t ? "Transferring from " + t.school : null;
    var chips = h("div", "fh-chips");
    if (pref && pref !== s.firstName) chips.appendChild(h("span", "fchip", "Goes by <b>" + esc(pref) + "</b>"));
    if (gradeLevel != null) chips.appendChild(h("span", "fchip", "<b>Grade " + esc(gradeLevel) + "</b>"));
    if (where) chips.appendChild(h("span", "fchip", esc(where)));
    if (enrolled && t) chips.appendChild(h("span", "fchip", "Previously " + esc(t.school)));
    if (g && g.program && g.program.name) chips.appendChild(h("span", "fchip", esc(g.program.name)));
    txt.appendChild(chips);
    // On a phone, one quiet line in place of the chips: five chips are five lines.
    txt.appendChild(h("p", "fh-meta", esc([pref && pref !== s.firstName ? "Goes by " + pref : null,
      gradeLevel != null ? "Grade " + gradeLevel : null, enrolled ? SCHOOL : where].filter(Boolean).join(" · "))));

    if (g) {
      var figs = h("div", "fh-figs");
      figs.innerHTML =
        "<div class='fh-fig'><div class='v'>" + cr(g.totals.applied) + "<small> / " + esc(g.track.total) + "</small></div>" +
        "<div class='l'><span class='long'>credits toward the diploma</span><span class='short'>credits</span></div></div>" +
        (t && t.cumulativeAverage != null
          ? "<div class='fh-fig'><div class='v'>" + esc(t.cumulativeAverage) + "<small>%</small></div><div class='l'><span class='long'>cumulative average</span><span class='short'>average</span></div></div>"
          : g.ehs && g.ehs.average != null
            ? "<div class='fh-fig'><div class='v'>" + esc(trim1(g.ehs.average)) + "<small>%</small></div><div class='l'>average at " + esc(SCHOOL) + "</div></div>"
            : "") +
        (g.board && g.board.taken
          ? "<div class='fh-fig'><div class='v'>" + g.board.covered + "<small> / 4</small></div><div class='l'><span class='long'>core state exams covered</span><span class='short'>core exams</span></div></div>"
          : g.gpa && g.gpa.value != null
            ? "<div class='fh-fig'><div class='v'>" + fixed(g.gpa.value, 2) + "</div><div class='l'>GPA" + (g.gpa.issued == null ? " estimate" : "") + "</div></div>"
            : "");
      txt.appendChild(figs);
    } else if (partError("grad")) {
      txt.appendChild(h("p", "problem", "The diploma record could not be read: " + esc(partError("grad").message)));
    }
    p.appendChild(txt);
    wrap.appendChild(p);

    /* ----- what matters now: the top of the student's own plan */
    var now = h("aside", "fh-now");
    now.appendChild(h("h2", null, "What matters now"));
    var steps = g && g.nextSteps ? g.nextSteps.slice(0, 3) : [];
    if (steps.length) {
      now.appendChild(h("p", "why", "The top of " + esc(possessive(first())) + " plan, ranked by what each step unlocks. " +
        "Written to " + esc(first()) + ", shown here as written."));
      var stepRow = h("div", "fh-steps");
      steps.forEach(function (st, i) {
        var b = btn("fh-step", "<span class='n'>" + (i + 1) + "</span><span><span class='t'>" + esc(st.title) +
          "</span><span class='e'>" + esc(st.effort || "") + "</span></span>", function () { go("graduation", null); });
        stepRow.appendChild(b);
      });
      now.appendChild(stepRow);
      var more = btn("more", "See the whole plan " + icon("right", 14), function () { go("graduation", null); });
      now.appendChild(more);
    } else {
      now.appendChild(h("p", "why", g ? "Nothing on the record needs a step right now."
                                        : "When there is a record to read, the next steps on it appear here."));
    }
    wrap.appendChild(now);
    return wrap;
  }

  /* ============================================================== Phone
     A phone gets a different page, not this one folded smaller. Three things
     and no more: who the student is; a deck of the four facts a family asks
     about first, to swipe through, turning in space like cards in a hand; and
     every section as one line of a list, with the sections the school has not
     filled in folded away until somebody asks for them. The long parts of a
     section wait behind a button in the sheet, for the same reason. */

  function creditRing(g, size, stroke, interactive) {
    var T = g.totals, ehsA = Math.min(T.ehsEarned || 0, T.applied || 0);
    return {
      size: size, stroke: stroke, total: g.track.total, interactive: interactive, title: "Credits toward the diploma",
      label: cr(T.applied) + " of " + g.track.total + " credits toward the diploma",
      segments: [
        { value: (T.applied || 0) - ehsA, cls: "s-transfer", label: "Transferred", text: cr((T.applied || 0) - ehsA) },
        { value: ehsA, cls: "s-ehs", label: "Earned at " + SCHOOL, text: cr(ehsA) }
      ],
      rest: { label: "Still to plan", text: cr(T.remaining) }
    };
  }

  var DERIVED_FIRST = ["grades", "assessments", "graduation", "guardians", "promotion", "reading_math", "assignments", "student"];

  /* A section in a few words, for the right-hand side of its row. */
  function shortValue(key, src) {
    var g = grad();
    function fromSchool() {
      var f = firstFact(rec(key));
      return f ? f.value : "On file";
    }
    if (src === "none") return null;
    if (src === "school" && DERIVED_FIRST.indexOf(key) < 0) return fromSchool();
    try {
      switch (key) {
        case "grades":
          return g.transfer && g.transfer.cumulativeAverage != null ? g.transfer.cumulativeAverage + "%"
            : g.ehs && g.ehs.average != null ? trim1(g.ehs.average) + "%" : plural((g.courses || []).length, "course");
        case "assignments": {
          var tt = part("work").totals;
          return tt.overdue ? tt.overdue + " past due" : tt.all + " set";
        }
        case "assessments": return g.board.met + " of 4 met";
        case "reading_math": {
          var sd = part("standing");
          return sd && sd.xp ? sd.xp.toLocaleString() + " XP" : "On record";
        }
        case "graduation": return cr(g.totals.applied) + " of " + g.track.total;
        case "promotion": return g.program && g.program.gradeLevel != null ? "Grade " + g.program.gradeLevel : plural((g.years || []).length, "year");
        case "pathways": return g.strengths[0].name;
        case "supports": return g.risk.name + " focus";
        case "schedule": return plural((g.current || []).length, "course");
        case "enrollment": return g.enrollment && (g.enrollment.enrolledOn || g.enrollment.status === "active") ? "Enrolled" : "On file";
        case "documents": return "1 on file";
        case "student": {
          var ct = part("contact"), y = ct ? ageOf(ct.dateOfBirth) : null;
          return first() + (y != null ? " · " + y : "");
        }
        case "guardians": {
          var gs = part("guardians") || [];
          return gs.length === 1 ? (gs[0].firstName || gs[0].name) : gs.length + " linked";
        }
        case "emergency": return plural((part("guardians") || []).length, "guardian");
      }
    } catch (e) { /* fall through to what the school wrote */ }
    return src === "school" ? fromSchool() : null;
  }

  function phRow(sec, src) {
    var v = shortValue(sec.key, src);
    var b = btn("ph-row" + (src === "none" ? " off" : ""),
      "<span class='pi'>" + icon(sec.icon, 17) + "</span><span class='n'>" + esc(sec.name) + "</span>" +
      "<span class='v'>" + (v ? esc(v) : "") + "</span>" + icon("right", 14), null);
    b.addEventListener("click", function () { go(sec.key, b); });
    return b;
  }

  function phoneHome() {
    var g = grad(), s = S.student, t = g && g.transfer;
    var root = h("section", "ph");
    var pref = preferred();
    var gradeLevel = g && g.program && g.program.gradeLevel != null ? g.program.gradeLevel : s.gradeLevel;
    var enrolled = !!(g && g.enrollment && (g.enrollment.enrolledOn || g.enrollment.status === "active"));

    var hero = h("div", "ph-hero");
    var orb = h("div", "ph-orb");
    orb.style.setProperty("--hue", s.hue || "#2a78d6");
    if (g && g.track) orb.appendChild(V.ring(creditRing(g, 120, 5, false)));
    orb.appendChild(h("div", "face", esc(s.initials || "")));
    hero.appendChild(orb);
    hero.appendChild(h("div", "ph-id",
      (pref && pref !== s.firstName ? "<p class='ph-hi'>Goes by " + esc(pref) + "</p>" : "") +
      "<h1>" + esc(s.name || "") + "</h1><p class='ph-meta'>" +
      esc([gradeLevel != null ? "Grade " + gradeLevel : null, enrolled ? SCHOOL : t ? "From " + t.school : null]
            .filter(Boolean).join(" · ")) + "</p>"));
    root.appendChild(hero);

    var deck = h("div", "ph-deck");
    function card(key, inner, cls) {
      var b = btn("ph-card" + (cls ? " " + cls : ""), inner, null);
      b.addEventListener("click", function () { go(key, b); });
      deck.appendChild(b);
      return b;
    }
    if (g && g.track) {
      var c1 = card("graduation", "<span class='k'>" + icon("graduation", 15) + "Graduation</span>");
      var rw = h("div", "ph-ring");
      rw.appendChild(V.ring(creditRing(g, 160, 12, false)));
      rw.appendChild(h("div", "mid", "<b>" + cr(g.totals.applied) + "</b><span>of " + esc(g.track.total) + " credits</span>"));
      c1.appendChild(rw);
      c1.appendChild(h("span", "s", esc(cr(g.totals.remaining) + " to go" +
        (g.pace && g.pace.finishBy ? " · about " + ym(g.pace.finishBy) : ""))));
    }
    if (g && ((t && t.cumulativeAverage != null) || (g.ehs && g.ehs.average != null))) {
      var avg = t && t.cumulativeAverage != null ? t.cumulativeAverage : trim1(g.ehs.average);
      var c2 = card("grades", "<span class='k'>" + icon("grades", 15) + "Grades</span><b class='big'>" + esc(avg) +
        "<small>%</small></b><span class='s'>cumulative average</span>");
      if ((g.trend || []).length > 1) c2.appendChild(V.spark(g.trend.map(function (x) { return x.average; }), { height: 70 }));
      if (g.gpa && g.gpa.value != null) {
        c2.appendChild(h("span", "s faint", "GPA" + (g.gpa.issued == null ? " estimate " : " ") + fixed(g.gpa.value, 2)));
      }
    }
    if (g && g.board && (g.exams || []).length) {
      var pips = (g.board.areas || []).map(function (a) {
        var kind = a.state === "met" ? "good" : a.state === "low_pass" ? "warn" : "critical";
        return "<span class='ft-pip'>" + icon(kind === "good" ? "ccheck" : kind === "warn" ? "warn" : "xcirc", 13)
          .replace("class='ic'", "class='ic' style='color:var(--" + kind + ")'") + esc(a.name) +
          " <b>" + (a.score != null ? esc(a.score) : "—") + "</b></span>";
      }).join("");
      card("assessments", "<span class='k'>" + icon("assessments", 15) + "State exams</span><b class='big'>" +
        esc(g.board.met) + "<small> of 4</small></b><span class='s'>core areas met at 65+</span><span class='ft-pips'>" +
        pips + "</span>");
    }
    var step = g && (g.nextSteps || [])[0];
    if (step) {
      card("graduation", "<span class='k'>" + icon("spark", 15) + "Next step</span><b class='t'>" + esc(step.title) +
        "</b><span class='s'>" + esc(step.effort || "") + "</span><span class='s faint'>The top of " +
        esc(possessive(first())) + " plan</span>", "ph-step");
    }
    if (deck.children.length) {
      root.appendChild(deck);
      var dots = h("div", "ph-dots");
      [].forEach.call(deck.children, function () { dots.appendChild(h("i")); });
      root.appendChild(dots);
      wireDeck(deck, dots);
    }

    var list = h("div", "ph-list");
    GROUPS.forEach(function (gr) {
      var secs = SECTIONS.filter(function (x) { return x.group === gr.key; });
      var have = secs.filter(function (x) { return sourceOf(x.key) !== "none"; });
      var none = secs.filter(function (x) { return sourceOf(x.key) === "none"; });
      var grp = h("div", "ph-group");
      grp.appendChild(h("h2", "ph-gh", esc(gr.name)));
      var rows = h("div", "ph-rows");
      have.forEach(function (x) { rows.appendChild(phRow(x, sourceOf(x.key))); });
      if (none.length) {
        var folded = h("div", "ph-none");
        folded.hidden = true;
        none.forEach(function (x) { folded.appendChild(phRow(x, "none")); });
        var tog = btn("ph-more", "<span>" + esc(have.length
          ? plural(none.length, "more section") + " not on file yet"
          : plural(none.length, "section") + ", none on file yet") + "</span>" + icon("down", 14), function () {
          folded.hidden = !folded.hidden;
          tog.classList.toggle("open", !folded.hidden);
          tog.setAttribute("aria-expanded", String(!folded.hidden));
        });
        tog.setAttribute("aria-expanded", "false");
        rows.appendChild(tog);
        rows.appendChild(folded);
      }
      grp.appendChild(rows);
      list.appendChild(grp);
    });
    root.appendChild(list);
    root.appendChild(h("p", "ph-foot", "Read from " + esc(SCHOOL) + "’s record, under your own sign-in. " +
      "Families can read all of it; only the school can change it."));
    return root;
  }

  /* Each card turns away and recedes as it leaves the centre, and the dots
     follow whichever is nearest it. Read from the scroll position each frame,
     so it tracks a finger exactly rather than animating after it. */
  function wireDeck(deck, dots) {
    var cards = [].slice.call(deck.children);
    function paint() {
      var w = deck.clientWidth;
      if (!w) return;
      var mid = deck.scrollLeft + w / 2, active = 0, best = Infinity;
      cards.forEach(function (c, i) {
        var d = (c.offsetLeft + c.offsetWidth / 2 - mid) / w;
        if (Math.abs(d) < best) { best = Math.abs(d); active = i; }
        if (REDUCED) return;
        var k = Math.max(-1, Math.min(1, d));
        c.style.transform = "perspective(900px) rotateY(" + (-k * 16).toFixed(2) + "deg) scale(" + (1 - Math.abs(k) * 0.08).toFixed(3) + ")";
        c.style.opacity = (1 - Math.abs(k) * 0.3).toFixed(3);
      });
      [].forEach.call(dots.children, function (dot, i) { dot.classList.toggle("on", i === active); });
    }
    var raf = 0;
    deck.addEventListener("scroll", function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); }, { passive: true });
    if (typeof ResizeObserver === "function") new ResizeObserver(paint).observe(deck);
    requestAnimationFrame(paint);
  }

  function isLinked() {
    var kids = (S.family && S.family.students) || [];
    return kids.some(function (k) { return S.student && k.id === S.student.id; });
  }

  function constellation(g, i) {
    var band = h("section", "fc" + rise() + (g.mirror ? " mirror" : ""));
    band.id = "g-" + g.key;
    band.style.animationDelay = (REDUCED ? 0 : 60 + i * 70) + "ms";
    var secs = SECTIONS.filter(function (s) { return s.group === g.key; });
    var filled = secs.filter(function (s) { return sourceOf(s.key) !== "none"; }).length;
    var head = h("div", "fc-head");
    head.innerHTML = "<h2>" + esc(g.name) + "</h2><p>" + esc(g.line) + "</p><span class='cnt'>" +
      filled + " of " + secs.length + " with something on file</span>";
    band.appendChild(head);
    var grid = h("div", "fc-grid");
    secs.forEach(function (s) { grid.appendChild(tile(s)); });
    band.appendChild(grid);
    return band;
  }

  /* Where a section's content comes from: the school's own entry wins the
     label, because it is the more specific claim; then what can be computed
     from the record; then nothing. */
  function sourceOf(key) {
    if (rec(key)) return "school";
    var g = grad(), w = part("work");
    switch (key) {
      case "grades": return g && ((g.courses || []).length || (g.ehsCourses || []).length || (g.trend || []).length || (g.current || []).length) ? "record" : "none";
      case "assignments": return w && w.work && w.work.length ? "record" : "none";
      case "assessments": return g && (g.exams || []).length ? "record" : "none";
      case "reading_math": return (g && (g.strengths || []).length) || (part("standing") && part("standing").xp) ? "record" : "none";
      case "promotion": return g && (g.years || []).length ? "record" : "none";
      case "graduation": return g && g.track ? "record" : "none";
      case "pathways": return g && (g.strengths || []).length ? "record" : "none";
      case "supports": return g && g.risk ? "record" : "none";
      case "schedule": return g && (g.current || []).length ? "record" : "none";
      case "enrollment": return g && (g.program || g.enrollment) ? "record" : "none";
      case "documents": return g && g.transfer ? "record" : "none";
      case "student": return "record";
      case "guardians": return part("guardians") && part("guardians").length ? "record" : "none";
      case "emergency": return part("guardians") && part("guardians").length ? "record" : "none";
      default: return "none";
    }
  }

  function tile(sec) {
    var src = sourceOf(sec.key);
    var look = glimpse(sec, src);
    var t = btn("ft " + (sec.size || "").replace("big", "") + (sec.size && sec.size.indexOf("big") > -1 ? " big" : "") +
                (look.empty ? " ft-none" : ""), "", null);
    t.dataset.key = sec.key;
    var label = src === "school" ? "From the school" : src === "record" ? "From the record" : "Not on file yet";
    var top = h("div", "ft-top", "<span class='ft-ic'>" + icon(sec.icon, 18) + "</span><span class='ft-name'>" +
      esc(sec.name) + "</span><span class='ft-state " + (src === "school" ? "sch" : src === "record" ? "rec" : "") +
      "'><i></i>" + label + "</span>");
    t.appendChild(top);
    var body = h("div", "ft-body");
    if (look.viz) body.appendChild(look.viz);
    if (look.stat != null) body.appendChild(h("div", "ft-stat", look.stat));
    if (look.sub) body.appendChild(h("div", "ft-sub", look.sub));
    if (look.after) body.appendChild(look.after);
    t.appendChild(body);
    t.setAttribute("aria-label", sec.name + ". " + label + ". " + (look.aria || ""));
    t.addEventListener("click", function () { go(sec.key, t); });
    return t;
  }

  function firstFact(r) {
    if (!r) return null;
    var f = (r.facts || []).filter(function (x) { return x.value; })[0];
    return f || null;
  }
  function recordGlimpse(sec) {
    var r = rec(sec.key);
    if (!r) return { empty: true, stat: "Nothing yet", sub: esc(sec.empty) };
    var f = firstFact(r);
    if (f) return { stat: esc(f.value), sub: esc(f.label) + (r.summary ? " · " + esc(clip(r.summary, 70)) : "") };
    if (r.rows && r.rows.items.length) return { stat: esc(r.rows.items.length), sub: esc(plural(r.rows.items.length, "entry", "entries")) + " on file" };
    return { stat: "On file", sub: esc(clip(r.summary || r.notes || "", 110)) };
  }
  function clip(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; }

  function glimpse(sec, src) {
    var g = grad();
    var k = sec.key;
    if (src === "school" && ["grades", "assessments", "graduation", "guardians", "promotion", "reading_math", "assignments", "student"].indexOf(k) < 0) {
      return recordGlimpse(sec);
    }
    if (src === "none") return recordGlimpse(sec);

    if (k === "grades") {
      var t = g.transfer;
      var avg = t && t.cumulativeAverage != null ? t.cumulativeAverage : (g.ehs && g.ehs.average != null ? trim1(g.ehs.average) : null);
      var out = {
        stat: avg != null ? esc(avg) + "<small>%</small>" : esc((g.courses || []).length + (g.ehsCourses || []).length),
        sub: avg != null ? "cumulative average" + ((g.trend || []).length ? " across " + g.trend.length + " terms" : "") : "courses on the record"
      };
      if ((g.trend || []).length > 1) out.viz = V.spark(g.trend.map(function (x) { return x.average; }), { height: 70 });
      if (g.gpa && g.gpa.value != null) {
        out.after = h("div", "ft-pips", "<span class='ft-pip'>GPA" + (g.gpa.issued == null ? " estimate" : "") +
          " <b>" + fixed(g.gpa.value, 2) + "</b></span><span class='ft-pip'>Lettered courses <b>" + esc(g.gpa.courses) + "</b></span>");
      }
      return out;
    }
    if (k === "assignments") {
      var w = part("work"), tt = w.totals;
      return {
        stat: tt.overdue ? esc(tt.overdue) + "<small> past due</small>" : esc(tt.all),
        sub: tt.overdue ? esc(tt.marked + " marked · " + tt.missing + " missing") : esc(plural(tt.all, "piece") + " of work · " + tt.marked + " marked")
      };
    }
    if (k === "assessments") {
      var b = g.board;
      var pips = h("div", "ft-pips");
      (b.areas || []).forEach(function (a) {
        var kind = a.state === "met" ? "good" : a.state === "low_pass" ? "warn" : "critical";
        pips.appendChild(h("span", "ft-pip", icon(kind === "good" ? "ccheck" : kind === "warn" ? "warn" : "xcirc", 13).replace("class='ic'", "class='ic' style='color:var(--" + kind + ")'") +
          esc(a.name) + " <b>" + (a.score != null ? esc(a.score) : "—") + "</b>"));
      });
      return { stat: esc(b.met) + "<small> of 4 met at 65+</small>", sub: b.lowPass ? esc(plural(b.lowPass, "area") + " in the 55–64 low-pass band") : esc(plural((g.exams || []).length, "exam sitting") + " on the record"), after: pips };
    }
    if (k === "reading_math") {
      var sd = part("standing");
      var strong = (g && g.strengths) || [];
      var eng = strong.filter(function (x) { return x.area === "english"; })[0];
      var math = strong.filter(function (x) { return x.area === "math"; })[0];
      var bars = h("div", "ft-bars");
      [eng, math].forEach(function (x) {
        if (!x) return;
        bars.appendChild(h("div", "ft-bar", "<span>" + esc(x.name) + "</span><span class='tr'><i style='width:" + Math.min(100, x.average) + "%'></i></span><b>" + esc(trim1(x.average)) + "</b>"));
      });
      return {
        stat: sd && sd.xp ? esc(sd.xp.toLocaleString()) + "<small> XP studied</small>" : (eng || math ? "Averages" : "—"),
        sub: sd && sd.xp ? esc((sd.streak ? sd.streak + "-day streak · " : "") + plural((sd.days || []).length, "active day") + " this month") : "English and math across the record",
        after: bars.children.length ? bars : null
      };
    }
    if (k === "graduation") {
      var ring = h("div", "ft-ring");
      var ehsA = Math.min(g.totals.ehsEarned || 0, g.totals.applied || 0);
      ring.appendChild(V.ring({ size: 200, stroke: 14, total: g.track.total, interactive: false,
        segments: [{ value: g.totals.applied - ehsA, cls: "s-transfer" }, { value: ehsA, cls: "s-ehs" }] }));
      ring.appendChild(h("div", "mid", "<b>" + cr(g.totals.applied) + "</b><span>of " + esc(g.track.total) + " credits</span>"));
      return { viz: ring, stat: null, sub: esc(cr(g.totals.remaining) + " still to plan" + (g.pace && g.pace.finishBy ? " · about " + ym(g.pace.finishBy, true) + " at the pace on record" : "")) };
    }
    if (k === "promotion") {
      var gl = g.program && g.program.gradeLevel;
      return {
        stat: gl != null ? "Grade " + esc(gl) : esc((g.years || []).length) + "<small> years</small>",
        sub: esc(g.years.map(function (y) { return yearShort(y.year) + " " + cr(y.credits); }).join(" · ") + " credits" +
             (g.pace && g.pace.creditsPerYear ? " — " + cr(g.pace.creditsPerYear) + " a year" : ""))
      };
    }
    if (k === "pathways") {
      var top = g.strengths[0];
      var earned = (g.achievements || []).filter(function (a) { return a.earned; }).length;
      return { stat: esc(top.name), sub: "strongest subject on the record · average " + esc(trim1(top.average)) +
        (earned ? " · " + plural(earned, "achievement") : "") };
    }
    if (k === "supports") {
      return { stat: esc(g.risk.name), sub: "where the record says effort counts most — computed, not a referral" };
    }
    if (k === "schedule") {
      var cur = g.current || [];
      return { stat: esc(cur.length) + "<small> " + (cur.length === 1 ? "course" : "courses") + "</small>", sub: esc(listOf(cur.map(function (c) { return c.title; }))) };
    }
    if (k === "enrollment") {
      var e = g.enrollment;
      return e && (e.enrolledOn || e.status === "active")
        ? { stat: e.enrolledOn ? esc(ym(e.enrolledOn)) : "Enrolled",
            sub: esc(SCHOOL + (g.transfer ? " · previously " + g.transfer.school : "")) }
        : { stat: g.program && g.program.gradeLevel != null ? "Grade " + esc(g.program.gradeLevel) : "On file",
            sub: esc((g.program && g.program.name ? g.program.name + " · " : "") + (g.track ? g.track.total + "-credit track" : "")) };
    }
    if (k === "documents") {
      return { stat: "1<small> on file</small>", sub: esc(g.transfer.school + " transcript · " + (g.transfer.kind === "official" ? "official" : "unofficial copy")) };
    }
    if (k === "student") {
      var ct = part("contact"), yrs = ct ? ageOf(ct.dateOfBirth) : null;
      return { stat: esc(first()), sub: esc([S.student.name, yrs != null ? yrs + " years old" : null].filter(Boolean).join(" · ")) };
    }
    if (k === "guardians" || k === "emergency") {
      var gs = part("guardians") || [];
      if (k === "emergency") {
        return { stat: esc(gs.length) + "<small> " + (gs.length === 1 ? "guardian" : "guardians") + " on file</small>", sub: "No separate emergency contact recorded yet" };
      }
      var people = h("div", "ft-people");
      gs.slice(0, 5).forEach(function (x) { people.appendChild(h("span", "av", esc(x.initials || ""))).style.setProperty("--hue", x.hue || "#0f766e"); });
      return { viz: people, stat: esc(listOf(gs.map(function (x) { return x.firstName || x.name; }))), sub: esc(gs.map(function (x) { return x.label || RELATIONSHIP[x.relationship] || "Family"; }).join(" · ")) };
    }
    return recordGlimpse(sec);
  }

  /* The tile leans toward the pointer, and a highlight follows it — the glass
     catching light. Only where there is a fine pointer and motion is welcome. */
  function wireTilt(root) {
    if (REDUCED || !FINE) return;
    [].forEach.call(root.querySelectorAll(".ft"), function (t) {
      t.addEventListener("pointermove", function (e) {
        var r = t.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        var strength = r.width > 500 ? 3 : 6;
        t.classList.add("tilting");
        t.style.setProperty("--ry", ((x - 0.5) * strength).toFixed(2) + "deg");
        t.style.setProperty("--rx", ((0.5 - y) * strength).toFixed(2) + "deg");
        t.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        t.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      t.addEventListener("pointerleave", function () {
        t.classList.remove("tilting");
        t.style.setProperty("--rx", "0deg");
        t.style.setProperty("--ry", "0deg");
      });
    });
  }

  function paintDock() {
    var d = $("#dock");
    d.innerHTML = "";
    var items = [{ key: "home", name: "Overview", icon: "home" }].concat(GROUPS.map(function (g) {
      return { key: g.key, name: g.name, icon: g.key };
    }));
    items.forEach(function (it) {
      var b = btn("", icon(it.icon, 20) + "<span class='lbl'>" + esc(it.name) + "</span>", function () {
        if (S.open) dismiss();
        var target = document.getElementById("g-" + it.key);
        if (target) target.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
      }, it.name);
      b.dataset.key = it.key;
      d.appendChild(b);
    });
    if (typeof IntersectionObserver === "function") {
      if (paintDock.io) paintDock.io.disconnect();
      paintDock.io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var key = en.target.id.replace(/^g-/, "");
          [].forEach.call(d.children, function (b) { b.setAttribute("aria-current", String(b.dataset.key === key)); });
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      [].forEach.call(document.querySelectorAll("#stage > section[id^='g-']"), function (s) { paintDock.io.observe(s); });
    }
  }

  /* ============================================================= Finder */

  function openFinder() {
    closeMenu();
    var wrap = $("#finder");
    wrap.innerHTML = "";
    wrap.hidden = false;
    var box = h("div", "ff");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Find a section");
    var inRow = h("div", "ff-in", icon("search", 18));
    var input = h("input");
    input.placeholder = "Grades, the bus, who to call…";
    input.setAttribute("aria-label", "Section");
    inRow.appendChild(input);
    box.appendChild(inRow);
    var ul = h("ul");
    ul.setAttribute("role", "listbox");
    box.appendChild(ul);
    wrap.appendChild(box);
    var active = 0, shown = [];
    function paint() {
      var q = input.value.trim().toLowerCase();
      shown = SECTIONS.filter(function (s) {
        return !q || (s.name + " " + groupOf(s.group).name + " " + s.key.replace("_", " ")).toLowerCase().indexOf(q) > -1;
      });
      active = Math.min(active, Math.max(0, shown.length - 1));
      ul.innerHTML = "";
      shown.forEach(function (s, i) {
        var li = h("li");
        var b = btn("", "<span class='ft-ic'>" + icon(s.icon, 16) + "</span><span>" + esc(s.name) + "</span><span class='g'>" +
          esc(groupOf(s.group).name) + "</span>", function () { closeFinder(); go(s.key, null); });
        b.setAttribute("role", "option");
        b.setAttribute("aria-selected", String(i === active));
        li.appendChild(b);
        ul.appendChild(li);
      });
      if (!shown.length) ul.appendChild(h("li", null, "<p style='padding:14px;color:var(--ink-3)'>No section by that name.</p>"));
    }
    input.addEventListener("input", function () { active = 0; paint(); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        active = Math.max(0, Math.min(shown.length - 1, active + (e.key === "ArrowDown" ? 1 : -1)));
        paint();
        var sel = ul.querySelector("[aria-selected='true']");
        if (sel) sel.scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter" && shown[active]) {
        var key = shown[active].key;
        closeFinder();
        go(key, null);
      }
    });
    wrap.onclick = function (e) { if (e.target === wrap) closeFinder(); };
    paint();
    input.focus();
  }
  function closeFinder() { $("#finder").hidden = true; $("#finder").innerHTML = ""; }

  /* ============================================================== Sheet */

  function openSheet(key, fromTile) {
    var already = !!S.open;
    function show() {
      S.open = key;
      document.body.classList.add("sheet-open");
      $("#sheetWrap").hidden = false;
      renderSheet(key);
      var close = $("#sheetClose");
      if (close) close.focus({ preventScroll: true });
    }
    if (!already && fromTile && document.startViewTransition && !REDUCED) {
      fromTile.style.viewTransitionName = "fm-open";
      var t = document.startViewTransition(function () {
        fromTile.style.viewTransitionName = "";
        $("#sheet").style.viewTransitionName = "fm-open";
        show();
      });
      t.finished.then(function () { $("#sheet").style.viewTransitionName = ""; }, function () {});
    } else show();
  }

  function closeSheet(silent) {
    var was = S.open;
    S.open = null;
    V.tipHide();
    document.body.classList.remove("sheet-open");
    $("#sheetWrap").hidden = true;
    $("#sheet").innerHTML = "";
    $("#sheet").style.transform = "";
    $("#sheet").style.transition = "";
    if (silent) return;
    if (S.dirty) renderHome();
    var tileNode = was && document.querySelector(".ft[data-key='" + was + "']");
    if (tileNode) tileNode.focus({ preventScroll: true });
  }

  /* On a phone a sheet is pulled down to close, the way every sheet on the
     phone closes. Only from its header: the body scrolls, and the charts in it
     answer a finger, so neither is a place to begin a dismissal. */
  function wireSwipe(sheet, handle) {
    if (!("ontouchstart" in window)) return;
    var y0 = null, dy = 0;
    handle.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      y0 = e.touches[0].clientY;
      dy = 0;
      sheet.style.transition = "none";
    }, { passive: true });
    handle.addEventListener("touchmove", function (e) {
      if (y0 == null) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      sheet.style.transform = "translateY(" + dy + "px)";
    }, { passive: true });
    function end() {
      if (y0 == null) return;
      y0 = null;
      sheet.style.transition = "transform .32s cubic-bezier(.2,.8,.2,1)";
      if (dy > 110) {
        sheet.style.transform = "translateY(100%)";
        setTimeout(dismiss, 240);
      } else {
        sheet.style.transform = "";
      }
    }
    handle.addEventListener("touchend", end);
    handle.addEventListener("touchcancel", end);
  }

  function renderSheet(key) {
    var sec = SEC[key];
    var sheet = $("#sheet");
    sheet.innerHTML = "";
    var src = sourceOf(key);
    var headNode = h("header", "fs-head");
    headNode.innerHTML = "<span class='fs-ic'>" + icon(sec.icon, 22) + "</span><div class='fs-titles'><p class='fs-eyebrow'>" +
      esc(groupOf(sec.group).name) + " · " + esc(S.student.name || "") + "</p><h2 class='fs-title' id='sheetTitle'>" +
      esc(sec.name) + "</h2></div>";
    var nav = h("nav", "fs-nav");
    var prev = SECTIONS[(sec.index + SECTIONS.length - 1) % SECTIONS.length];
    var next = SECTIONS[(sec.index + 1) % SECTIONS.length];
    nav.appendChild(btn("fb-icon pn", icon("left", 18), function () { go(prev.key); }, "Previous: " + prev.name));
    nav.appendChild(btn("fb-icon pn", icon("right", 18), function () { go(next.key); }, "Next: " + next.name));
    var close = btn("fb-icon", icon("x", 18), dismiss, "Close");
    close.id = "sheetClose";
    nav.appendChild(close);
    headNode.appendChild(nav);
    headNode.insertBefore(h("span", "fs-grab"), headNode.firstChild);
    sheet.appendChild(headNode);
    wireSwipe(sheet, headNode);
    var body = h("div", "fs-body");
    var inner = h("div", "fs-inner");
    body.appendChild(inner);
    sheet.appendChild(body);
    var gridNode = h("div", "fgrid");
    inner.appendChild(gridNode);
    try {
      (RENDER[key] || renderRecordOnly)(gridNode, sec, src);
    } catch (e) {
      gridNode.appendChild(h("div", "problem s12", "This part of the record could not be drawn: " + esc(e.message)));
      if (window.console) console.error(e);
    }
    // What a phone shows before "more": the first parts of each section, in
    // the order they were drawn. Only the phone's stylesheet acts on it.
    var keep = CURATE[key] != null ? CURATE[key] : 2;
    var rest = [].slice.call(gridNode.children, keep);
    if (rest.length) {
      rest.forEach(function (n) { n.classList.add("more"); });
      inner.classList.add("curated");
      var moreBtn = btn("fs-more", "Show " + esc(plural(rest.length, "more part")) + icon("down", 14), function () {
        inner.classList.remove("curated");
        moreBtn.remove();
      });
      gridNode.appendChild(moreBtn);
    }
    body.scrollTop = 0;
  }

  /* ============================================================ Builders */

  function panel(parent, span, title, lede, cls) {
    var p = h("section", "fp " + (span || "s12") + (cls ? " " + cls : ""));
    if (title || lede) {
      var hd = h("div", "fp-h");
      var t = h("div");
      if (title) t.appendChild(h("h3", null, esc(title)));
      if (lede) t.appendChild(h("p", "lede", lede));
      hd.appendChild(t);
      p.appendChild(hd);
      p.head = hd;
    }
    parent.appendChild(p);
    return p;
  }
  function lead(parent, html) {
    var p = h("section", "fp lead s12", "<p>" + html + "</p>");
    parent.appendChild(p);
    return p;
  }
  function stats(list) {
    var n = h("div", "stats");
    list.filter(Boolean).forEach(function (s) {
      n.appendChild(h("div", "stat" + (s.text ? " text" : ""), "<div class='l'>" + esc(s.l) + "</div><div class='v'>" + s.v +
        "</div>" + (s.n ? "<div class='n'>" + esc(s.n) + "</div>" : "")));
    });
    return n;
  }
  function sourceLine(textHtml) { return h("p", "fp-src", icon("source", 14) + "<span>" + textHtml + "</span>"); }
  function problemFor(parent, k, what) {
    var e = partError(k);
    parent.appendChild(h("div", "problem s12", esc(what) + " could not be read" + (e ? ": " + esc(e.message) : ".")));
  }
  function emptyState(title, detail) {
    return h("div", "empty", "<span class='eo'>" + icon("spark", 22) + "</span><div><p>" + esc(title) + "</p><span>" +
      esc(detail || "") + "</span></div>");
  }
  function table(columns, rows, opts) {
    opts = opts || {};
    var wrap = h("div", "ftab-wrap");
    var html = "<table class='ftab stack'>" + (opts.caption ? "<caption class='sr'>" + esc(opts.caption) + "</caption>" : "") +
      "<thead><tr>" + columns.map(function (c) {
        return "<th scope='col'" + (c.num ? " class='num'" : "") + ">" + esc(c.label) + "</th>";
      }).join("") + "</tr></thead><tbody>";
    rows.forEach(function (r) {
      if (r.sub) { html += "<tr class='sub'><td colspan='" + columns.length + "'>" + esc(r.sub) + "</td></tr>"; return; }
      html += "<tr" + (r.cls ? " class='" + r.cls + "'" : "") + ">" + r.cells.map(function (c, i) {
        // The heading travels with each cell, so a phone can lay a row out as
        // label and value instead of a table scrolled sideways.
        return "<td data-label='" + esc(columns[i] ? columns[i].label : "") + "'" +
          (columns[i] && columns[i].num ? " class='num'" : "") + ">" + c + "</td>";
      }).join("") + "</tr>";
    });
    wrap.innerHTML = html + "</tbody></table>";
    return wrap;
  }

  /* A card of labelled values. On a phone they sit two to a row; a value too
     long for half the card takes the whole row, and so does a short value with
     no short neighbour, rather than leaving half a row empty.
     Rows are [label, valueHtml, plainText, forceWide, extraClass]. */
  function kvFill(dl, rows) {
    rows = rows.filter(function (r) { return r[1]; });
    function fits(r) { return !r[3] && String(r[2] == null ? "" : r[2]).length <= 20; }
    for (var i = 0; i < rows.length; i++) {
      var pair = fits(rows[i]) && !!rows[i + 1] && fits(rows[i + 1]);
      (pair ? [rows[i], rows[i + 1]] : [rows[i]]).forEach(function (r) {
        dl.appendChild(h("div", ((pair ? "" : "wide") + (r[4] ? " " + r[4] : "")).trim() || null,
          "<dt>" + esc(r[0]) + "</dt><dd>" + r[1] + "</dd>"));
      });
      if (pair) i++;
    }
  }

  /* ======================================== The school's part of a section */

  function renderRecordOnly(gridNode, sec) { recordPanel(gridNode, sec.key); }

  function isNumeric(v) { return /^-?\d+(\.\d+)?%?$/.test(String(v).trim()); }

  function recordPanel(gridNode, key, o) {
    o = o || {};
    var sec = SEC[key];
    if (sec.record === false) return null;
    var r = rec(key);
    var p = h("section", "fp s12 fp-record");
    var hd = h("div", "fp-h");
    var t = h("div");
    t.appendChild(h("span", "badge-src", "<i></i>From the school"));
    t.appendChild(h("h3", null, esc(o.title || (r ? sec.name + " on file" : "Nothing from the school yet"))));
    if (r && r.updatedAt) t.appendChild(h("p", "who", "Updated " + esc(since(r.updatedAt)) + (r.updatedBy ? " by " + esc(r.updatedBy) : "")));
    hd.appendChild(t);
    if (S.admin) {
      var acts = h("div", "act");
      acts.appendChild(btn("fb-btn sm quiet", icon(r ? "edit" : "plus", 15) + (r ? "Edit" : "Add to the record"), function () {
        editRecord(p, key);
      }));
      hd.appendChild(acts);
    }
    p.appendChild(hd);

    if (!r) {
      p.appendChild(emptyState(o.emptyTitle || "Not on file", o.empty || sec.empty));
    } else {
      if (r.summary) p.appendChild(h("p", "rec-sum", esc(r.summary)));
      var facts = (r.facts || []).filter(function (f) { return f.value; });
      if (facts.length) {
        p.appendChild(stats(facts.map(function (f) {
          var long = String(f.value).length > 14;
          return { l: f.label, v: esc(f.value), text: long };
        })));
      }
      if (r.rows && r.rows.columns && r.rows.items.length) {
        var cols = r.rows.columns;
        // A column the school filled with numbers, over enough rows to have a
        // shape, is drawn as well as listed: attendance by month reads better
        // as columns than as a column of figures.
        var numCol = -1;
        if (r.rows.items.length >= 3) {
          for (var c = 1; c < cols.length && numCol < 0; c++) {
            if (r.rows.items.every(function (row) { return row[c] !== "" && isNumeric(row[c]); })) numCol = c;
          }
        }
        if (numCol > 0) {
          var chartBox = h("div", "rec-chart");
          chartBox.appendChild(h("p", "who", esc(cols[numCol]) + " by " + esc((cols[0] || "row").toLowerCase())));
          chartBox.appendChild(V.columns({
            label: cols[numCol] + " by " + cols[0], height: 190,
            items: r.rows.items.map(function (row) {
              return { label: clip(row[0], 10), detail: row[0], segs: [{ value: parseFloat(row[numCol]), cls: "s-one", name: cols[numCol] }] };
            }),
            format: function (v) { return trim1(v); }
          }));
          p.appendChild(chartBox);
        }
        p.appendChild(table(cols.map(function (cName, i) {
          return { label: cName, num: i > 0 && r.rows.items.every(function (row) { return row[i] === "" || isNumeric(row[i]); }) };
        }), r.rows.items.map(function (row) { return { cells: row.map(esc) }; }), { caption: sec.name }));
      }
      if (r.notes) p.appendChild(h("div", "rec-notes", esc(r.notes)));
    }
    gridNode.appendChild(p);
    return p;
  }

  function editRecord(p, key) {
    var sec = SEC[key];
    var cur = rec(key);
    p.innerHTML = "";
    var hd = h("div", "fp-h", "<div><span class='badge-src'><i></i>From the school</span><h3>" +
      (cur ? "Edit " : "Add to ") + esc(sec.name) + "</h3><p class='lede'>What you write here is shown to " +
      esc(possessive(first())) + " family exactly as written. Leave out anything they should not see.</p></div>");
    p.appendChild(hd);
    var form = h("form", "fe");
    form.noValidate = true;

    function field(label, node, help) {
      var row = h("label", "fe-row", "<span>" + esc(label) + "</span>");
      row.appendChild(node);
      if (help) row.appendChild(h("small", null, esc(help)));
      return row;
    }
    function input(value, placeholder) {
      var i = h("input");
      i.value = value || "";
      if (placeholder) i.placeholder = placeholder;
      return i;
    }

    var summary = h("textarea");
    summary.value = (cur && cur.summary) || "";
    summary.placeholder = "What a family should know first, in a sentence or two.";
    form.appendChild(field("Summary", summary));

    var factsWrap = h("div", "fe-row", "<span>Facts</span>");
    var factsBox = h("div", "fe-facts");
    factsWrap.appendChild(factsBox);
    function addFact(label, value) {
      var row = h("div", "fe-fact");
      var l = input(label, "Label");
      var v = input(value, "Value");
      l.setAttribute("aria-label", "Fact label");
      v.setAttribute("aria-label", "Fact value");
      row.appendChild(l);
      row.appendChild(v);
      row.appendChild(btn("fb-icon", icon("x", 16), function () { row.remove(); }, "Remove this fact"));
      factsBox.appendChild(row);
    }
    var startFacts = cur && (cur.facts || []).length ? cur.facts : sec.facts.map(function (l) { return { label: l, value: "" }; });
    startFacts.forEach(function (f) { addFact(f.label, f.value); });
    factsWrap.appendChild(h("div", "fe-acts")).appendChild(btn("fb-btn sm quiet", icon("plus", 14) + "Add a fact", function () { addFact("", ""); }));
    factsWrap.appendChild(h("small", null, "A fact with no value is left out."));
    form.appendChild(factsWrap);

    var tableWrap = h("div", "fe-row", "<span>Table</span>");
    var tbox = h("div", "fe-table");
    tableWrap.appendChild(tbox);
    var cols = cur && cur.rows ? cur.rows.columns.slice() : sec.columns.slice();
    var rowsData = cur && cur.rows ? cur.rows.items.map(function (r) { return r.slice(); }) : [];
    if (!cols.length) cols = ["Item", "Detail"];
    function readTable() {
      var ths = tbox.querySelectorAll("thead input");
      cols = [].map.call(ths, function (i) { return i.value; });
      rowsData = [].map.call(tbox.querySelectorAll("tbody tr"), function (tr) {
        return [].map.call(tr.querySelectorAll("input"), function (i) { return i.value; });
      });
    }
    function paintTable() {
      var tbl = h("table");
      var thead = h("thead");
      var htr = h("tr");
      cols.forEach(function (cName, ci) {
        var th = h("th");
        var i = input(cName, "Heading");
        i.setAttribute("aria-label", "Column " + (ci + 1) + " heading");
        th.appendChild(i);
        htr.appendChild(th);
      });
      var hx = h("th");
      if (cols.length > 1) hx.appendChild(btn("fb-icon", icon("x", 14), function () { readTable(); cols.pop(); rowsData.forEach(function (r) { r.length = cols.length; }); paintTable(); }, "Remove the last column"));
      htr.appendChild(hx);
      thead.appendChild(htr);
      tbl.appendChild(thead);
      var tbody = h("tbody");
      rowsData.forEach(function (r, ri) {
        var tr = h("tr");
        cols.forEach(function (cName, ci) {
          var td = h("td");
          var i = input(r[ci] || "", cName);
          i.setAttribute("aria-label", (cName || "Column " + (ci + 1)) + ", row " + (ri + 1));
          td.appendChild(i);
          tr.appendChild(td);
        });
        var tx = h("td");
        tx.appendChild(btn("fb-icon", icon("x", 14), function () { readTable(); rowsData.splice(ri, 1); paintTable(); }, "Remove row " + (ri + 1)));
        tr.appendChild(tx);
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      tbox.innerHTML = "";
      tbox.appendChild(tbl);
    }
    paintTable();
    var tacts = h("div", "fe-acts");
    tacts.appendChild(btn("fb-btn sm quiet", icon("plus", 14) + "Add a row", function () { readTable(); rowsData.push(cols.map(function () { return ""; })); paintTable(); }));
    tacts.appendChild(btn("fb-btn sm quiet", icon("plus", 14) + "Add a column", function () {
      readTable();
      if (cols.length >= 8) { toast("A table holds up to 8 columns."); return; }
      cols.push("");
      paintTable();
    }));
    tableWrap.appendChild(tacts);
    tableWrap.appendChild(h("small", null, "Rows left completely empty are not saved."));
    form.appendChild(tableWrap);

    var notes = h("textarea");
    notes.value = (cur && cur.notes) || "";
    notes.placeholder = "Anything else, in the school's words.";
    form.appendChild(field("Notes", notes));

    var acts = h("div", "fe-acts");
    var save = btn("fb-btn", "Save", null);
    save.type = "submit";
    acts.appendChild(save);
    acts.appendChild(btn("fb-btn quiet", "Cancel", function () { renderSheet(key); }));
    acts.appendChild(h("span", "sp"));
    if (cur) {
      acts.appendChild(btn("fb-btn danger", icon("trash", 15) + "Clear this section", function () {
        if (!window.confirm("Clear " + sec.name + " for " + first() + "? The family stops seeing it.")) return;
        API.family.clearRecord(S.student.id, key).then(function () {
          delete records()[key];
          S.dirty = true;
          toast(sec.name + " cleared.");
          renderSheet(key);
        }, function (e) { toast(e.message); });
      }));
    }
    form.appendChild(acts);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      readTable();
      var facts = [].map.call(factsBox.querySelectorAll(".fe-fact"), function (row) {
        var ins = row.querySelectorAll("input");
        return { label: ins[0].value.trim(), value: ins[1].value.trim() };
      }).filter(function (f) { return f.label && f.value; });
      var items = rowsData.filter(function (r) { return r.some(function (c) { return String(c || "").trim(); }); });
      var usable = cols.some(function (c) { return c.trim(); });
      var body = {
        summary: summary.value.trim() || null,
        facts: facts,
        rows: usable && items.length ? { columns: cols.map(function (c) { return c.trim(); }), items: items } : null,
        notes: notes.value.trim() || null
      };
      save.disabled = true;
      save.textContent = "Saving…";
      API.family.putRecord(S.student.id, key, body).then(function (saved) {
        var entry = saved || body;
        entry.updatedAt = Date.now();
        entry.updatedBy = S.me.name || null;
        records()[key] = entry;
        S.dirty = true;
        toast(sec.name + " saved. " + possessive(first()) + " family sees it now.");
        renderSheet(key);
      }, function (err) {
        save.disabled = false;
        save.textContent = "Save";
        toast(err.message || "That did not save.");
      });
    });
    p.appendChild(form);
    var firstInput = form.querySelector("textarea, input");
    if (firstInput) firstInput.focus();
  }

  /* =========================================================== Sections */

  var RENDER = {};

  /* How many of a section's parts a phone shows before "Show more". The
     rest — full course lists, checks, footnotes — are one tap away. */
  var CURATE = {
    graduation: 3, grades: 2, assessments: 2, reading_math: 2, promotion: 2, pathways: 2,
    enrollment: 1, documents: 1, student: 2, schedule: 2, supports: 2, emergency: 2, assignments: 2,
    guardians: 99
  };

  function exam(st, score) {
    if (st === "passed") return chip("good", "Passed");
    if (st === "superseded") return chip("info", "Superseded by a later sitting");
    if (st === "below_65") return score != null && score >= 55 ? chip("warn", "Below 65 · low-pass band") : chip("critical", "Below 65");
    if (st === "not_passed") return chip("critical", "Not passed");
    return chip("info", esc(st || "Recorded"));
  }
  function areaState(a) {
    if (a.state === "met") return chip("good", "Met at 65+");
    if (a.state === "low_pass") return chip("warn", esc(a.toPass) + (a.toPass === 1 ? " point" : " points") + " from 65 · low pass");
    if (a.state === "short") return chip("serious", esc(a.toPass) + " points from 65");
    return chip("critical", "No exam on the record");
  }

  /* ------------------------------------------------------------- Grades */
  RENDER.grades = function (gridNode) {
    var g = grad();
    if (!g) { problemFor(gridNode, "grad", "The academic record"); recordPanel(gridNode, "grades"); return; }
    var t = g.transfer;
    var top = panel(gridNode, "s12");
    top.appendChild(stats([
      t && t.cumulativeAverage != null ? { l: "Cumulative average", v: esc(t.cumulativeAverage) + "<small>%</small>", n: "As " + t.school + " printed it" } : null,
      g.ehs && g.ehs.average != null ? { l: "Average at " + SCHOOL, v: esc(trim1(g.ehs.average)) + "<small>%</small>", n: plural(g.ehs.count, "course") } : null,
      g.gpa && g.gpa.value != null ? { l: g.gpa.issued != null ? "GPA" : "GPA estimate", v: fixed(g.gpa.value, 2),
        n: g.gpa.issued != null ? "Issued " + fixed(g.gpa.issued, 2) + (g.gpa.matchesIssued ? " — checks out" : "") : "EHS 4.0 scale, " + g.gpa.courses + " lettered courses" } : null,
      { l: "Credits earned", v: cr(g.totals.earned), n: t && t.creditsEarned != null ? cr(t.creditsEarned) + " as " + t.school + " counts them" : "EHS credits" },
      { l: "Courses on the record", v: esc((g.courses || []).length + (g.ehsCourses || []).length), n: (t ? t.school : "") + ((g.ehsCourses || []).length ? " and " + SCHOOL : "") }
    ]));

    if ((g.trend || []).length > 1) {
      var tp = panel(gridNode, "s8", "Term by term", g.momentum && g.momentum.says ? esc(g.momentum.says) : "The average of each term, as the school issued it.");
      var vals = g.trend.map(function (x) { return x.average; });
      tp.appendChild(V.line({
        label: "Term averages", series: "Term average", area: true,
        points: g.trend.map(function (x) { return { label: termShort(x.term), detail: x.term, value: x.average }; }),
        min: Math.min(60, Math.floor(Math.min.apply(null, vals) / 5) * 5), max: Math.max(90, Math.ceil(Math.max.apply(null, vals) / 5) * 5),
        refs: [{ value: 65, label: "65 · the credit line" }],
        format: function (v) { return fixed(v, 1) + "%"; }, tick: function (v) { return v + "%"; }
      }));
      tp.appendChild(V.twin("Term averages", [{ label: "Term" }, { label: "Average", num: true }],
        g.trend.map(function (x) { return [x.term, fixed(x.average, 2) + "%"]; })));
    } else if ((g.years || []).length) {
      var yp = panel(gridNode, "s8", "Year by year", "The average of each school year on the record.");
      yp.appendChild(V.columns({ label: "Average by year", items: g.years.filter(function (y) { return y.average != null; }).map(function (y) {
        return { label: yearShort(y.year), detail: y.label || y.year, segs: [{ value: y.average, cls: "s-one", name: "Average" }] };
      }), format: function (v) { return trim1(v); } }));
    }

    if (g.gpa && g.gpa.distribution) {
      var dist = g.gpa.distribution;
      var dp = panel(gridNode, (g.trend || []).length > 1 || (g.years || []).length ? "s4" : "s12", "Every lettered mark",
        "How many courses landed in each of EHS's letter bands.");
      dp.appendChild(V.columns({
        label: "Lettered courses by letter", height: 230,
        items: ["A", "B", "C", "D", "F"].map(function (L) {
          return { label: L, detail: L + " — " + ({ A: "90+", B: "80–89", C: "70–79", D: "60–69", F: "below 60" })[L],
                   segs: [{ value: dist[L] || 0, cls: "s-one", name: "Courses" }],
                   note: g.gpa.distributionCredits ? cr(g.gpa.distributionCredits[L] || 0) + " EHS credits" : null };
        }),
        format: function (v) { return String(v); }
      }));
      dp.appendChild(V.twin("Lettered courses by letter", [{ label: "Letter" }, { label: "Courses", num: true }, { label: "Credits", num: true }],
        ["A", "B", "C", "D", "F"].map(function (L) { return [L, String(dist[L] || 0), cr((g.gpa.distributionCredits || {})[L] || 0)]; })));
    }

    var cur = g.current || [];
    var rep = part("report");
    if (cur.length) {
      var np = panel(gridNode, "s12", "This year, in OEdu", "Courses " + esc(first()) + " is taking now, with the mark as it stands today.");
      np.appendChild(table([{ label: "Course" }, { label: "Mark", num: true }, { label: "Marked work", num: true }, { label: "Teacher's comment" }],
        cur.map(function (c) {
          var rc = rep && (rep.courses || []).filter(function (x) { return x.courseId === c.courseId; })[0];
          var comment = rc && rc.comment ? (rc.comment.body || "") : "";
          return { cells: [
            "<b>" + esc(c.title) + "</b>",
            c.percent != null ? esc(fixed(c.percent, 1)) + "%" + (c.letter ? " · " + esc(c.letter) : "") : "<span style='color:var(--ink-3)'>No marks yet</span>",
            esc(c.itemCount || 0),
            comment ? esc(comment) : "<span style='color:var(--ink-3)'>—</span>"
          ] };
        })));
    }

    var all = (g.courses || []).map(function (c) { return { c: c, src: "transfer" }; })
      .concat((g.ehsCourses || []).map(function (c) { return { c: c, src: "ehs" }; }));
    if (all.length) {
      var years = [];
      all.forEach(function (x) { if (x.c.year && years.indexOf(x.c.year) < 0) years.push(x.c.year); });
      years.sort();
      var cp = panel(gridNode, "s12", "The course record", "Every course, grouped the way the transcript prints it. " +
        "Marks are verbatim; a course that earned no credit is shaded.");
      var seg = h("div", "seg");
      var pick = years[years.length - 1];
      var host = h("div", "crec-host");
      function paintYear() {
        [].forEach.call(seg.children, function (b) { b.setAttribute("aria-pressed", String(b.dataset.y === pick)); });
        var rows = [];
        var list = all.filter(function (x) { return pick === "all" || x.c.year === pick; });
        var lastTerm = null;
        list.forEach(function (x) {
          var c = x.c;
          var termLabel = (pick === "all" ? yearShort(c.year) + " · " : "") + (c.term || "—");
          if (termLabel !== lastTerm) { rows.push({ sub: termLabel + (x.src === "ehs" ? " · " + SCHOOL : "") }); lastTerm = termLabel; }
          var flags = (c.flags || []).map(function (f) {
            return "<span class='flag' title='" + esc({ weighted: "Weighted course", not_averaged: "Not averaged", recovered: "Mastery passed — credit recovered" }[f] || f) + "'>" +
              esc({ weighted: "**", not_averaged: "*", recovered: "MP" }[f] || f) + "</span>";
          }).join("");
          var lost = x.src === "transfer" && c.attempted > 0 && c.earned === 0;
          rows.push({ cls: lost ? "lost" : "", cells: [
            "<b>" + esc(c.title) + "</b>" + flags + (c.code ? "<span class='code'>" + esc(c.code) + "</span>" : ""),
            esc(c.mark || "—") + (c.letter ? " <span style='color:var(--ink-3)'>" + esc(c.letter) + "</span>" : ""),
            x.src === "transfer" ? cr(c.earned) + " / " + cr(c.attempted) : cr(c.credits),
            x.src === "transfer" ? cr(c.ehsCredits) : cr(c.credits),
            esc(areaName(c.area)) + (lost ? "<br>" + chip("critical", "No credit") : c.decision === "declined" ? "<br>" + chip("serious", "Declined by EHS") : "")
          ] });
        });
        host.innerHTML = "";
        host.appendChild(table([{ label: "Course" }, { label: "Mark", num: true }, { label: "Earned / tried", num: true },
                                { label: "EHS credit", num: true }, { label: "Counts toward" }], rows, { caption: "Course record" }));

        // The same courses for a phone: one line each, the mark where the eye
        // lands, and the credit arithmetic underneath in small type.
        var clist = h("div", "crec");
        var lastT = null;
        list.forEach(function (x) {
          var c = x.c;
          var tl = (pick === "all" ? yearShort(c.year) + " · " : "") + (c.term || "—");
          if (tl !== lastT) { clist.appendChild(h("div", "crec-sub", esc(tl + (x.src === "ehs" ? " · " + SCHOOL : "")))); lastT = tl; }
          var lost = x.src === "transfer" && c.attempted > 0 && c.earned === 0;
          var flags = (c.flags || []).map(function (f) {
            return "<span class='flag'>" + esc({ weighted: "**", not_averaged: "*", recovered: "MP" }[f] || f) + "</span>";
          }).join("");
          clist.appendChild(h("div", "crec-row" + (lost ? " lost" : ""),
            "<div class='t'><b>" + esc(c.title) + "</b>" + flags + "</div>" +
            "<div class='m'>" + esc(c.mark || "—") + (c.letter ? "<small>" + esc(c.letter) + "</small>" : "") + "</div>" +
            "<div class='d'>" + esc([x.src === "transfer" ? cr(c.earned) + " of " + cr(c.attempted) + " earned" : null,
                                     cr(x.src === "transfer" ? c.ehsCredits : c.credits) + " EHS", areaName(c.area)]
                                    .filter(Boolean).join(" · ")) +
            (lost ? chip("critical", "No credit") : c.decision === "declined" ? chip("serious", "Declined by EHS") : "") + "</div>"));
        });
        host.appendChild(clist);
      }
      [["all", "Every year"]].concat(years.map(function (y) { return [y, yearShort(y)]; })).forEach(function (y) {
        var b = btn("", esc(y[1]), function () { pick = y[0]; paintYear(); });
        b.dataset.y = y[0];
        seg.appendChild(b);
      });
      cp.head.appendChild(h("div", "act")).appendChild(seg);
      cp.appendChild(host);
      paintYear();
      cp.appendChild(sourceLine("<b>MP</b> mastery passed · <b>*</b> not averaged · <b>**</b> weighted. " +
        (t && t.conversion ? esc(t.conversion) : "")));
    }
    recordPanel(gridNode, "grades");
  };

  /* -------------------------------------------------------- Assignments */
  RENDER.assignments = function (gridNode) {
    var w = part("work");
    if (!w) { problemFor(gridNode, "work", "Coursework"); recordPanel(gridNode, "assignments"); return; }
    var tt = w.totals;
    var sp = panel(gridNode, "s12");
    sp.appendChild(stats([
      { l: "Work set", v: esc(tt.all) },
      { l: "Marked", v: esc(tt.marked) },
      { l: "Waiting to be marked", v: esc(tt.waiting) },
      { l: "Past due", v: esc(tt.overdue), n: tt.overdue ? "Due and not yet marked" : null },
      { l: "Missing", v: esc(tt.missing), n: tt.missing ? "Counts as zero until handed in" : null }
    ]));
    if (!w.work.length) {
      var g = grad();
      var names = g ? (g.current || []).map(function (c) { return c.title; }) : [];
      var ep = panel(gridNode, "s12");
      ep.appendChild(emptyState("Nothing has been set yet",
        (names.length ? first() + " is enrolled in " + listOf(names) + ". " : "") +
        "When a teacher sets work, it appears here with its due date, and once it is marked, the score and the teacher's comment."));
    } else {
      var byCourse = {};
      w.work.forEach(function (x) { (byCourse[x.courseTitle] = byCourse[x.courseTitle] || []).push(x); });
      var now = Date.now();
      Object.keys(byCourse).forEach(function (title) {
        var list = byCourse[title];
        var cp = panel(gridNode, "s12", title, plural(list.length, "piece") + " of work.");
        cp.appendChild(table([{ label: "Work" }, { label: "Due" }, { label: "Status" }, { label: "Score", num: true }, { label: "Comment" }],
          list.map(function (x) {
            var st;
            if (x.status === "missing") st = chip("critical", "Missing");
            else if (x.status === "excused") st = chip("info", "Excused");
            else if (x.status === "marked" && x.score != null) st = chip("good", "Marked");
            else if (x.dueAt && x.dueAt < now) st = chip("warn", "Past due");
            else st = chip("info", "Not marked yet");
            if (x.late) st += " " + chip("serious", "Late");
            return { cls: x.status === "missing" ? "lost" : "", cells: [
              "<b>" + esc(x.title) + "</b>" + (x.category ? "<span class='code'>" + esc(x.category) + (x.extraCredit ? " · extra credit" : "") + "</span>" : ""),
              x.dueAt ? esc(day(x.dueAt)) : "<span style='color:var(--ink-3)'>No date</span>",
              st,
              x.score != null ? esc(trim1(x.score)) + " / " + esc(trim1(x.outOf)) : "—",
              x.feedback ? esc(x.feedback) : "<span style='color:var(--ink-3)'>—</span>"
            ] };
          }), { caption: title }));
      });
    }
    recordPanel(gridNode, "assignments");
  };

  /* -------------------------------------------------------- Assessments */
  RENDER.assessments = function (gridNode) {
    var g = grad();
    if (!g) { problemFor(gridNode, "grad", "The exam record"); recordPanel(gridNode, "assessments"); return; }
    var b = g.board;
    if (b && (g.exams || []).length) {
      lead(gridNode, esc(b.met) + " of the four core New York State exam areas are met at 65 or above" +
        (b.lowPass ? ", and " + esc(plural(b.lowPass, "is", "are").replace(/^\d+ /, b.lowPass + " ")) + " in the 55–64 low-pass band" : "") + ". " +
        (b.needsPlusOne ? "<em>The fifth assessment of the 4+1 is still to come.</em>" : "<em>The fifth assessment is on the record.</em>"));

      var ap = panel(gridNode, "s12", "The four core areas", "The best sitting in each area. 65 is the pass line New York draws.");
      var cards = h("div", "areas4");
      (b.areas || []).forEach(function (a) {
        var c = h("div", "area");
        c.innerHTML = "<div class='n'>" + esc(a.name) + "</div><div class='s'>" + (a.score != null ? esc(a.score) : "—") +
          "<small>" + (a.score != null ? " / 100" : "") + "</small></div><div class='meter65' role='img' aria-label='" +
          esc(a.score != null ? a.score + " against a pass line of 65" : "No sitting") + "'><i style='width:" + (a.score || 0) +
          "%'></i><u></u></div><div class='x'>" + esc(a.exam || "No exam on the record") + (a.sitting ? " · " + esc(ym(a.sitting)) : "") +
          "</div><div>" + areaState(a) + "</div>";
        cards.appendChild(c);
      });
      ap.appendChild(cards);

      var ep = panel(gridNode, "s7", "Every sitting", "Each exam as it was sat, against the 65 line.");
      var sorted = (g.exams || []).slice().sort(function (x, y) { return String(x.sitting).localeCompare(String(y.sitting)); });
      ep.appendChild(V.bars({
        label: "Exam scores", scale: 100,
        rows: sorted.map(function (e) {
          return { label: e.name, sub: ym(e.sitting), bed: 100, segs: [{ value: e.score || 0, cls: "s-one" }], ref: 65,
                   value: e.score != null ? String(e.score) : "—",
                   tip: V.tipHead(e.name + " · " + ym(e.sitting, true)) + V.tipRow("s-one", "Score", e.score) + V.tipRow(null, "Pass line", 65) };
        })
      }));
      ep.appendChild(V.twin("Exam sittings", [{ label: "Exam" }, { label: "Sitting" }, { label: "Score", num: true }, { label: "Result" }],
        sorted.map(function (e) { return [e.name, ym(e.sitting, true), e.score == null ? "—" : String(e.score), String(e.status).replace(/_/g, " ")]; })));

      var rp = panel(gridNode, "s5", "Results", null);
      var list = h("div", "list");
      sorted.slice().reverse().forEach(function (e) {
        list.appendChild(h("div", "item", "<span class='badge'>" + (e.score != null ? esc(e.score) : "—") + "</span><div><div class='t'>" +
          esc(e.name) + "</div><div class='d'>" + exam(e.status, e.score) + "</div></div><span class='m'>" + esc(ym(e.sitting)) + "</span>"));
      });
      rp.appendChild(list);

      if ((b.pathways || []).length) {
        var pp = panel(gridNode, "s12", "What the exams mean for a diploma", "Two New York diplomas, and what each still needs on this record.");
        var pl = h("div", "list");
        b.pathways.forEach(function (x) {
          pl.appendChild(h("div", "item", "<span class='badge'>" + icon(x.met ? "ccheck" : "graduation", 16) + "</span><div><div class='t'>" + esc(x.name) +
            "</div><div class='d'>" + esc(x.says) + "</div>" + (x.blockers && x.blockers.length
              ? "<div class='d' style='margin-top:6px'>Still needs: " + esc(listOf(x.blockers)) + ".</div>" : "") +
            "</div><span class='m'>" + (x.met ? chip("good", "Met") : chip("info", "Not yet")) + "</span>"));
        });
        pp.appendChild(pl);
        pp.appendChild(sourceLine("From " + esc(g.transfer ? g.transfer.school + "’s" : "the") + " transcript. " + SCHOOL +
          " does not require state exams; these are the student's New York record, and a counselor confirms what they mean."));
      }
    }

    if ((g.stateTests || []).length) {
      var sp2 = panel(gridNode, "s12", "State tests before high school", "Verbatim, as the previous school printed them.");
      sp2.appendChild(table([{ label: "Year" }, { label: "Grade", num: true }, { label: "Test" }, { label: "Score", num: true }, { label: "Level", num: true }],
        g.stateTests.map(function (x) {
          return { cells: [esc(x.year || "—"), esc(x.grade || "—"), esc(x.exam || "—"), esc(x.score || "—"), x.level != null ? esc(x.level) + " of 4" : "—"] };
        })));
    }

    var w = part("work");
    var tests = w ? w.work.filter(function (x) { return /quiz|test|exam|assess/i.test(x.category || x.title || ""); }) : [];
    if (tests.length) {
      var tp = panel(gridNode, "s12", "Course tests in OEdu", "Quizzes and tests set in current courses.");
      tp.appendChild(table([{ label: "Test" }, { label: "Course" }, { label: "Score", num: true }],
        tests.map(function (x) { return { cells: ["<b>" + esc(x.title) + "</b>", esc(x.courseTitle), x.score != null ? esc(trim1(x.score)) + " / " + esc(trim1(x.outOf)) : "—"] }; })));
    }
    if (!(g.exams || []).length && !(g.stateTests || []).length && !tests.length) {
      panel(gridNode, "s12").appendChild(emptyState("No assessments on the record yet", SEC.assessments.empty));
    }
    recordPanel(gridNode, "assessments");
  };

  /* ----------------------------------------------- Reading and math */
  RENDER.reading_math = function (gridNode) {
    var g = grad();
    var sd = part("standing");
    var strong = (g && g.strengths) || [];
    var eng = strong.filter(function (x) { return x.area === "english"; })[0];
    var math = strong.filter(function (x) { return x.area === "math"; })[0];
    var board = g && g.board;
    var ela = board && (board.areas || []).filter(function (a) { return a.key === "english"; })[0];
    var alg = board && (board.areas || []).filter(function (a) { return a.key === "math"; })[0];

    if (eng || math) {
      var top = panel(gridNode, "s12");
      top.appendChild(stats([
        eng ? { l: "English average", v: esc(trim1(eng.average)), n: "Across " + plural(eng.marks, "numeric mark") } : null,
        math ? { l: "Math average", v: esc(trim1(math.average)), n: "Across " + plural(math.marks, "numeric mark") } : null,
        ela && ela.score != null ? { l: ela.exam, v: esc(ela.score), n: ym(ela.sitting, true) + " · " + (ela.state === "met" ? "met at 65+" : ela.toPass + " from 65") } : null,
        alg && alg.score != null ? { l: alg.exam, v: esc(alg.score), n: ym(alg.sitting, true) + " · " + (alg.state === "met" ? "met at 65+" : alg.toPass + " from 65") } : null
      ]));

      /* Small multiples on one shared scale, so a 70 in math and a 70 in
         English sit at the same height and the two can be compared by eye. */
      ["english", "math"].forEach(function (area) {
        var marks = (g.courses || []).filter(function (c) { return c.area === area && c.markNumeric != null; });
        var ehs = (g.ehsCourses || []).filter(function (c) { return c.area === area && c.markNumeric != null; });
        var pts = marks.map(function (c) { return { label: termShort(c.term), detail: c.title + " · " + (c.term || ""), value: c.markNumeric }; })
          .concat(ehs.map(function (c) { return { label: c.term || "EHS", detail: c.title + " · " + SCHOOL, value: c.markNumeric }; }));
        if (pts.length < 2) return;
        var p = panel(gridNode, "s6", areaName(area) + ", course by course", "Each " + areaName(area) + " mark in the order it was earned.");
        p.appendChild(V.line({ label: areaName(area) + " marks", series: "Mark", points: pts, min: 40, max: 100,
          refs: [{ value: 65, label: "65" }], format: function (v) { return String(v); }, height: 210 }));
        p.appendChild(V.twin(areaName(area) + " marks", [{ label: "Course" }, { label: "Term" }, { label: "Mark", num: true }],
          marks.map(function (c) { return [c.title, c.term || "", c.mark]; }).concat(ehs.map(function (c) { return [c.title, c.term || SCHOOL, c.mark]; }))));
      });
    }

    if (sd) {
      var byDay = {};
      (sd.days || []).forEach(function (d) { byDay[d.day] = d.xp; });
      var items = [];
      for (var i = 29; i >= 0; i--) {
        var d = new Date(Date.now() - i * 864e5);
        var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
        items.push({ label: MONTHS[d.getMonth()] + " " + d.getDate(), detail: day(key), segs: [{ value: byDay[key] || 0, cls: "s-one", name: "XP" }] });
      }
      var sp = panel(gridNode, "s12", "Studying in OEdu", "Practice " + esc(first()) + " has done in OEdu courses — " +
        "priced by the server from answers, not typed in by anyone.");
      sp.appendChild(stats([
        { l: "Experience earned", v: esc((sd.xp || 0).toLocaleString()), n: "All time" },
        { l: "Today", v: esc(sd.today || 0) },
        { l: "Current streak", v: esc(sd.streak || 0) + "<small> days</small>", n: "Longest " + (sd.longestStreak || 0) },
        { l: "Active days", v: esc((sd.days || []).length), n: "In the last 30 days" }
      ]));
      var chartHost = h("div");
      chartHost.style.marginTop = "18px";
      chartHost.appendChild(V.columns({ label: "Experience by day, last 30 days", items: items, valueLabels: false,
        format: function (v) { return v.toLocaleString() + " XP"; }, height: 180 }));
      sp.appendChild(chartHost);
      var prog = part("progress") || {};
      var scopes = Object.keys(prog);
      if (scopes.length) {
        sp.appendChild(h("h3", null, "What has been worked on")).style.cssText = "font-size:14px;margin:18px 0 8px";
        sp.appendChild(table([{ label: "Work" }, { label: "Last saved" }], scopes.map(function (sc) {
          var name = sc === "record" ? "Course reading and practice record"
            : /^set:/.test(sc) ? "Study set · " + sc.slice(4).replace(/[-_]/g, " ")
            : /^unit:/.test(sc) ? "Unit " + sc.slice(5) : sc;
          return { cells: [esc(name), esc(since(prog[sc].updatedAt))] };
        })));
      }
    } else if (partError("standing")) {
      problemFor(gridNode, "standing", "Study progress");
    }

    if (!eng && !math && !sd) panel(gridNode, "s12").appendChild(emptyState("No reading or math progress yet", SEC.reading_math.empty));
    recordPanel(gridNode, "reading_math", { title: rec("reading_math") ? "Benchmarks from the school" : null });
  };

  /* --------------------------------------------------------- Promotion */
  RENDER.promotion = function (gridNode) {
    var g = grad();
    if (!g) { problemFor(gridNode, "grad", "The academic record"); recordPanel(gridNode, "promotion"); return; }
    var years = g.years || [];
    var gradeOf = {};
    (g.courses || []).forEach(function (c) { if (c.year && c.gradeLevel != null) gradeOf[c.year] = c.gradeLevel; });
    var current = g.program && g.program.gradeLevel;

    if (current != null) {
      lead(gridNode, esc(first()) + " is in <em>grade " + esc(current) + "</em>" +
        (g.pace && g.pace.creditsPerYear ? ", and has earned about " + esc(cr(g.pace.creditsPerYear)) + " EHS credits a year on the record so far" : "") + ".");
    }

    var lp = panel(gridNode, "s12", "Grade by grade", "What each year on the record added. Credits are EHS credits.");
    var ladder = h("div", "ladder");
    var known = Object.keys(gradeOf).map(function (y) { return gradeOf[y]; });
    var startGrade = known.length ? Math.min.apply(null, known) : (current != null ? current : 9);
    var endGrade = Math.max(12, current || 0);
    for (var gl = startGrade; gl <= endGrade; gl++) {
      var yr = years.filter(function (y) { return gradeOf[y.year] === gl; })[0];
      var cls = gl === current ? "now" : yr ? "" : current != null && gl > current ? "ahead" : "";
      var r = h("div", "rung " + cls);
      r.innerHTML = "<div class='y'>" + (yr ? esc(yr.label || yearShort(yr.year)) : gl === current ? "This year" : current != null && gl > current ? "Ahead" : "—") +
        "</div><div class='g'>Grade " + gl + "</div>" +
        (yr ? "<div class='c'><b>" + cr(yr.credits) + "</b> credits" + (yr.average != null ? " · average " + esc(trim1(yr.average)) : "") + "</div>"
            : gl === current ? "<div class='c'>" + esc(listOf((g.current || []).map(function (c) { return c.title; })) || "In progress") + "</div>"
            : "<div class='c'></div>");
      ladder.appendChild(r);
    }
    lp.appendChild(ladder);

    if (years.length) {
      var anyEhs = years.some(function (y) { return y.ehs > 0; });
      var cp = panel(gridNode, "s7", "Credits each year", anyEhs ? null : "Every credit so far is transferred from " + esc(g.transfer ? g.transfer.school : "the previous school") + ".");
      if (anyEhs) cp.appendChild(V.legend([{ cls: "s-transfer", name: "Transferred" }, { cls: "s-ehs", name: "Earned at " + SCHOOL }]));
      cp.appendChild(V.columns({
        label: "Credits by school year", height: 220,
        items: years.map(function (y) {
          return { label: yearShort(y.year), detail: (y.label || y.year) + (gradeOf[y.year] ? " · grade " + gradeOf[y.year] : ""),
                   segs: [{ value: y.transfer || 0, cls: "s-transfer", name: "Transferred" }, { value: y.ehs || 0, cls: "s-ehs", name: "At " + SCHOOL }],
                   note: plural(y.courses || 0, "course") };
        }),
        format: cr
      }));
      cp.appendChild(V.twin("Credits by year", [{ label: "Year" }, { label: "Grade", num: true }, { label: "Transferred", num: true }, { label: "At EHS", num: true }, { label: "Average", num: true }],
        years.map(function (y) { return [y.label || y.year, String(gradeOf[y.year] || "—"), cr(y.transfer), cr(y.ehs), y.average != null ? trim1(y.average) : "—"]; })));
    }

    var pc = g.pace;
    if (pc && pc.creditsPerYear) {
      var pp = panel(gridNode, years.length ? "s5" : "s12", "Pace", "At the pace on the record, how long what is left takes.");
      pp.appendChild(stats([
        { l: "Credits a year", v: cr(pc.creditsPerYear), n: "On the record so far" },
        { l: "Still to plan", v: cr(pc.creditsLeft) },
        pc.finishBy ? { l: "At this pace, done by", v: esc(ym(pc.finishBy)), n: pc.duration ? "About " + pc.duration.replace(/^about /, "") : null, text: true } : null
      ]));
      pp.appendChild(sourceLine("Projected from the pace of the record itself, not from a school schedule — an estimate of time, not a promise from the school."));
    }

    if (g.momentum && g.momentum.says) {
      var mp = panel(gridNode, "s12", "Direction", esc(g.momentum.says));
      mp.appendChild(stats([
        g.momentum.first ? { l: "First " + (g.momentum.basis === "terms" ? "term" : "year"), v: esc(fixed(g.momentum.first.average, 1)), n: g.momentum.first.term || g.momentum.first.year } : null,
        g.momentum.best ? { l: "Best", v: esc(fixed(g.momentum.best.average, 1)), n: g.momentum.best.term || g.momentum.best.year } : null,
        g.momentum.last ? { l: "Most recent", v: esc(fixed(g.momentum.last.average, 1)), n: g.momentum.last.term || g.momentum.last.year } : null
      ]));
    }
    recordPanel(gridNode, "promotion", { title: rec("promotion") ? "The school's promotion decision" : null,
      emptyTitle: "No promotion decision recorded",
      empty: "Promotion rules are the school's. When a decision is made, it appears here beside the credits above." });
  };

  /* -------------------------------------------------------- Graduation */
  RENDER.graduation = function (gridNode) {
    var g = grad();
    if (!g || !g.track) { problemFor(gridNode, "grad", "The diploma record"); recordPanel(gridNode, "graduation"); return; }
    var T = g.totals;
    var ehsA = Math.min(T.ehsEarned || 0, T.applied || 0);

    lead(gridNode, esc(cr(T.applied)) + " of the " + esc(g.track.total) + " credits a " + esc(g.track.name.toLowerCase()) +
      " needs are on the record — <em>" + esc(cr(T.remaining)) + " still to plan</em>" +
      (g.pace && g.pace.finishBy ? ", about " + esc(ym(g.pace.finishBy, true)) + " at the pace so far" : "") + ".");

    var rp = panel(gridNode, "s5", "Toward the diploma", null);
    rp.appendChild(V.legend([{ cls: "s-transfer", name: "Transferred" }, { cls: "s-ehs", name: "Earned at " + SCHOOL }, { cls: "s-track", name: "Still to plan" }]));
    var rw = h("div", "ringwrap");
    rw.appendChild(V.ring({ size: 260, stroke: 22, total: g.track.total, title: g.track.name,
      label: cr(T.applied) + " of " + g.track.total + " credits",
      segments: [
        { value: T.applied - ehsA, cls: "s-transfer", label: "Transferred", text: cr(T.applied - ehsA), note: g.transfer && g.transfer.status !== "evaluated" ? "An estimate until EHS evaluates the transcript" : null },
        { value: ehsA, cls: "s-ehs", label: "Earned at " + SCHOOL, text: cr(ehsA) }
      ],
      rest: { label: "Still to plan", text: cr(T.remaining) } }));
    rw.appendChild(h("div", "mid", "<b>" + esc(Math.round(T.requirementsPercent != null ? T.requirementsPercent : T.applied / g.track.total * 100)) +
      "%</b><span>of requirements</span>"));
    rp.appendChild(rw);
    rp.appendChild(stats([
      { l: "Still to plan", v: cr(T.remaining) },
      T.surplus ? { l: "Beyond a requirement", v: cr(T.surplus), n: "Extra in one area does not fill another" } : null
    ]));

    var bp = panel(gridNode, "s7", "Requirement by requirement", "Each bar runs to what the requirement asks for; the tick is the line.");
    if (ehsA > 0 || (g.areas || []).some(function (a) { return a.ehs > 0; })) {
      bp.appendChild(V.legend([{ cls: "s-transfer", name: "Transferred" }, { cls: "s-ehs", name: "Earned at " + SCHOOL }]));
    }
    var scale = Math.max.apply(null, (g.groups || []).map(function (x) { return Math.max(x.required, x.earned); }));
    bp.appendChild(V.bars({
      label: "Credits by requirement", scale: scale,
      rows: (g.groups || []).map(function (grp) {
        var parts = (g.areas || []).filter(function (a) { return a.group === grp.key; });
        var tr = parts.reduce(function (s, a) { return s + Math.min(a.transfer || 0, a.required || Infinity); }, 0);
        var eh = parts.reduce(function (s, a) { return s + (a.ehs || 0); }, 0);
        var earned = Math.min(grp.earned, grp.required);
        tr = Math.min(tr, earned);
        eh = Math.max(0, Math.min(eh, earned - tr));
        return {
          label: grp.name, sub: grp.includes ? listOf(grp.includes) : null, bed: grp.required, ref: grp.required,
          segs: [{ value: tr, cls: "s-transfer" }, { value: eh, cls: "s-ehs" }],
          valueHtml: esc(cr(grp.earned)) + " <small>of " + esc(cr(grp.required)) + "</small>",
          tip: V.tipHead(grp.name) + V.tipRow("s-transfer", "Transferred", cr(tr)) + (eh ? V.tipRow("s-ehs", "At " + SCHOOL, cr(eh)) : "") +
               V.tipRow(null, "Required", cr(grp.required)) + V.tipRow(null, "Still to plan", cr(grp.left))
        };
      })
    }));
    bp.appendChild(V.twin("Credits by requirement", [{ label: "Requirement" }, { label: "Required", num: true }, { label: "Earned", num: true }, { label: "Left", num: true }],
      (g.groups || []).map(function (x) { return [x.name, cr(x.required), cr(x.earned), cr(x.left)]; })));

    if (g.transfer) {
      var tp = panel(gridNode, "s12", "The transcript from " + g.transfer.school,
        g.transfer.status === "evaluated" ? "Evaluated by " + esc(SCHOOL) + " — the transferred credit above is final."
          : "Until " + esc(SCHOOL) + " evaluates an official transcript, every transferred credit is an estimate.");
      var steps = h("div", "steps");
      (g.transfer.statusSteps || []).forEach(function (s, i) {
        steps.appendChild(h("div", "step " + (i < g.transfer.statusAt ? "done" : i === g.transfer.statusAt ? "now" : ""), esc(s) +
          (i === g.transfer.statusAt ? "<small>Where it stands</small>" : "")));
      });
      tp.appendChild(steps);
      tp.appendChild(stats([
        { l: "Courses counted", v: esc(g.transfer.courses) },
        { l: "EHS credits", v: cr(g.transfer.credits), n: g.transfer.creditsEarned != null ? cr(g.transfer.creditsEarned) + " as " + g.transfer.school + " counts them" : null },
        { l: "Transfer limit", v: esc(g.track.transferCap), n: "The most " + SCHOOL + " accepts" },
        { l: "Minimum at " + SCHOOL, v: esc(g.track.minAtEhs), n: g.residency ? cr(g.residency.earnedAtEhs) + " earned there so far" : null }
      ]));
    }

    var steps2 = g.nextSteps || [];
    if (steps2.length) {
      var np = panel(gridNode, "s7", possessive(first()) + " plan", "Ranked by what each step unlocks. Written to " + esc(first()) + " and shown here as written.");
      var list = h("div", "list");
      steps2.forEach(function (st, i) {
        var it = h("div", "item", "<span class='badge'>" + (i + 1) + "</span><div><div class='t'>" + esc(st.title) + "</div>" +
          "<details><summary>Why</summary><div class='d'>" + esc(st.detail || "") + (st.why ? "<br><br>" + esc(st.why) : "") + "</div></details></div>" +
          "<span class='m'>" + esc(st.effort || "") + "</span>");
        list.appendChild(it);
      });
      np.appendChild(list);
    }

    var gaps = g.gaps || [];
    if (gaps.length) {
      var gp = panel(gridNode, steps2.length ? "s5" : "s12", "What is left, and what closes it", "Courses " + esc(SCHOOL) + " offers in each area still open.");
      var gl = h("div", "list");
      gaps.forEach(function (x) {
        gl.appendChild(h("div", "item", "<span class='badge'>" + icon("graduation", 15) + "</span><div><div class='t'>" + esc(x.name) + " · " +
          esc(cr(x.left)) + " left</div><div class='d'>" + esc(listOf(x.options || [])) + "</div>" +
          (x.enrolled && x.enrolled.length ? "<div class='d'>In progress: " + esc(listOf(x.enrolled.map(function (e) { return e.title || e; }))) + "</div>" : "") +
          "</div><span class='m'>" + cr(x.earned) + " / " + cr(x.required) + "</span>"));
      });
      gp.appendChild(gl);
    }

    if ((g.milestones || []).length || (g.achievements || []).length) {
      var mp = panel(gridNode, "s12", "Milestones", null);
      var ms = h("div", "steps");
      (g.milestones || []).forEach(function (m, i, arr) {
        var nowIdx = arr.filter(function (x) { return x.reached; }).length;
        ms.appendChild(h("div", "step " + (m.reached ? "done" : i === nowIdx ? "now" : ""), esc(m.label) + "<small>" + esc(m.at) + "%</small>"));
      });
      mp.appendChild(ms);
    }

    if ((g.checks || []).length) {
      var kp = panel(gridNode, "s12", "The record, checked against itself", "What adds up, and what is worth asking the registrar about.");
      var kl = h("div", "list");
      g.checks.forEach(function (c) {
        var kind = c.level === "ok" ? "good" : c.level === "check" ? "warn" : "info";
        kl.appendChild(h("div", "item", "<span class='badge'>" + icon(kind === "good" ? "ccheck" : kind === "warn" ? "warn" : "info", 16) +
          "</span><div><div class='t'>" + esc(c.title) + "</div><div class='d'>" + esc(c.detail || "") + "</div></div><span class='m'>" +
          chip(kind, kind === "good" ? "Checks out" : kind === "warn" ? "Worth asking" : "Note") + "</span>"));
      });
      kp.appendChild(kl);
    }
    if ((g.assumptions || []).length) {
      var fp = panel(gridNode, "s12", "How these numbers are counted", null);
      g.assumptions.forEach(function (a) { fp.appendChild(sourceLine(esc(a))); });
    }
    recordPanel(gridNode, "graduation", { title: rec("graduation") ? "Notes from the school" : null });
  };

  /* ---------------------------------------------------------- Pathways */
  RENDER.pathways = function (gridNode) {
    var g = grad();
    var r = rec("pathways");
    if (g && (g.strengths || []).length) {
      var top = g.strengths[0];
      lead(gridNode, "On the record, " + esc(possessive(first())) + " strongest subject is <em>" + esc(top.name) + "</em>, at an average of " +
        esc(trim1(top.average)) + (g.strengths[1] ? ", then " + esc(g.strengths[1].name) + " at " + esc(trim1(g.strengths[1].average)) : "") + ".");
      var sp = panel(gridNode, "s7", "Where the marks are strongest", "The average of every numeric mark in each subject.");
      sp.appendChild(V.bars({
        label: "Average by subject", scale: 100,
        rows: g.strengths.map(function (x) {
          return { label: x.name, sub: plural(x.marks, "mark"), bed: 100, segs: [{ value: x.average, cls: "s-one" }], value: trim1(x.average),
                   tip: V.tipHead(x.name) + V.tipRow("s-one", "Average", trim1(x.average)) + V.tipRow(null, "Marks", x.marks) };
        })
      }));
      sp.appendChild(V.twin("Average by subject", [{ label: "Subject" }, { label: "Average", num: true }, { label: "Marks", num: true }],
        g.strengths.map(function (x) { return [x.name, trim1(x.average), String(x.marks)]; })));

      var ach = (g.achievements || []);
      if (ach.length) {
        var ap = panel(gridNode, "s5", "Achievements on the record", ach.filter(function (a) { return a.earned; }).length + " of " + ach.length + " earned.");
        var cl = h("div", "chips");
        ach.slice().sort(function (a, b) { return (b.earned ? 1 : 0) - (a.earned ? 1 : 0); }).forEach(function (a) {
          cl.appendChild(h("div", "ach" + (a.earned ? "" : " off"), icon(a.earned ? "spark" : "milestones", 16) + "<div><b>" + esc(a.name) + "</b><span>" + esc(a.detail || "") + "</span></div>"));
        });
        ap.appendChild(cl);
      }
      if (g.board && g.board.needsPlusOne) {
        var pp = panel(gridNode, "s12", "The +1 in the 4+1", "New York's diploma pathways allow a fifth assessment in an area a student chooses — " +
          "a further Regents exam, a career and technical assessment, an arts assessment, or the CDOS credential.");
        pp.appendChild(sourceLine("The record shows the core areas and no fifth assessment yet. Which pathway fits is a conversation with the school counselor."));
      }
    } else if (!r) {
      panel(gridNode, "s12").appendChild(emptyState("Nothing on the record yet", SEC.pathways.empty));
    }
    recordPanel(gridNode, "pathways", { title: r ? "The school's plan" : null });
  };

  /* ---------------------------------------------------------- Supports */
  RENDER.supports = function (gridNode) {
    var g = grad();
    recordPanel(gridNode, "supports", { title: rec("supports") ? "Supports in place" : null });
    if (g && g.risk) {
      var p = panel(gridNode, "s12", "Where the record points: " + g.risk.name,
        "Computed from marks and credits — the area where the largest requirement, the lowest marks and a lost credit sit together. " +
        "It is not a referral, and it is not a school decision.");
      var l = h("div", "list");
      (g.risk.evidence || []).forEach(function (e) { l.appendChild(h("div", "item", "<span class='badge'>" + icon("info", 15) + "</span><div><div class='t'>" + esc(e) + "</div></div><span></span>")); });
      p.appendChild(l);
    }
  };

  RENDER.iep = function (gridNode) {
    recordPanel(gridNode, "iep", { emptyTitle: "No IEP information on file",
      empty: "If " + first() + " has an Individualized Education Program, the school records its services, providers and review dates here. " +
             "The absence of an entry is not a statement that there is no IEP." });
  };
  RENDER.wellness = function (gridNode) { recordPanel(gridNode, "wellness", { emptyTitle: "No wellness information shared" }); };
  RENDER.attendance = function (gridNode) { recordPanel(gridNode, "attendance", { emptyTitle: "No attendance recorded yet" }); };
  RENDER.transportation = function (gridNode) { recordPanel(gridNode, "transportation", { emptyTitle: "No transportation on file" }); };

  /* ---------------------------------------------------------- Schedule */
  RENDER.schedule = function (gridNode) {
    var g = grad();
    var cur = (g && g.current) || [];
    recordPanel(gridNode, "schedule", { title: rec("schedule") ? "The timetable" : null, emptyTitle: "No timetable published yet" });
    if (cur.length) {
      var p = panel(gridNode, "s12", "Enrolled in OEdu", "Courses " + esc(first()) + " is taking now.");
      var people = h("div", "people");
      cur.forEach(function (c) {
        people.appendChild(h("div", "person", "<div class='top'><span class='ft-ic'>" + icon("learning", 18) + "</span><div><div class='nm'>" +
          esc(c.title) + "</div><div class='rel'>" + (c.percent != null ? "Mark " + esc(fixed(c.percent, 1)) + "%" : "No marks yet") +
          (c.credits ? " · " + esc(cr(c.credits)) + " credit" + (c.area ? " in " + esc(areaName(c.area)) : "") : "") + "</div></div></div>"));
      });
      p.appendChild(people);
    }
  };

  /* -------------------------------------------------------- Enrollment */
  RENDER.enrollment = function (gridNode) {
    var g = grad();
    if (g) {
      var p = panel(gridNode, "s12", SCHOOL, null);
      var kv = h("dl", "kv");
      var rows = [
        ["Program", g.program && g.program.name],
        ["Diploma track", g.track ? g.track.name + " · " + g.track.total + " credits" : null],
        ["Grade", g.program && g.program.gradeLevel != null ? "Grade " + g.program.gradeLevel : null],
        ["Enrolled", g.enrollment && g.enrollment.enrolledOn ? day(g.enrollment.enrolledOn) : null],
        ["Standing", g.enrollment && g.enrollment.status ? g.enrollment.status.replace(/^\w/, function (c) { return c.toUpperCase(); }) : null],
        ["Expected to graduate", g.program && g.program.expectedGrad ? ym(g.program.expectedGrad, true) : null]
      ];
      // A row with nothing in it is left out rather than printed as "Not recorded".
      kvFill(kv, rows.map(function (r) { return [r[0], r[1] ? esc(r[1]) : null, r[1]]; }));
      p.appendChild(kv);
      if (g.transfer) {
        var tp = panel(gridNode, "s12", "Previous school", null);
        var kv2 = h("dl", "kv");
        kvFill(kv2, [["School", g.transfer.school], ["Authority", g.transfer.authority], ["Years on the transcript", g.transfer.firstYear ? yearShort(g.transfer.firstYear) + " to " + yearShort(g.transfer.lastYear) : null],
         ["Transcript", (g.transfer.kind === "official" ? "Official" : "Unofficial copy") + (g.transfer.printedOn ? ", printed " + day(g.transfer.printedOn) : "")],
         ["Cumulative average", g.transfer.cumulativeAverage != null ? g.transfer.cumulativeAverage + "%" : null],
         ["Credits there", g.transfer.creditsEarned != null ? cr(g.transfer.creditsEarned) + " earned of " + cr(g.transfer.creditsAttempted) + " attempted" : null]
        ].map(function (r) { return [r[0], r[1] ? esc(r[1]) : null, r[1]]; }));
        tp.appendChild(kv2);
      }
    } else problemFor(gridNode, "grad", "The enrollment record");
    recordPanel(gridNode, "enrollment", { title: rec("enrollment") ? "Enrollment details from the school" : null });
  };

  /* --------------------------------------------------------- Documents */
  RENDER.documents = function (gridNode) {
    var g = grad();
    if (g && g.transfer) {
      var t = g.transfer;
      var p = panel(gridNode, "s12", "On file", "Documents the record is built from.");
      var people = h("div", "people");
      people.appendChild(h("div", "person", "<div class='top'><span class='ft-ic'>" + icon("documents", 18) + "</span><div><div class='nm'>Transcript</div><div class='rel'>" +
        esc(t.school) + (t.authority ? " · " + esc(t.authority) : "") + "</div></div></div><dl><dt>Kind</dt><dd>" +
        (t.kind === "official" ? "Official, sent by the school" : "Unofficial copy supplied by the family") + "</dd><dt>Printed</dt><dd>" + esc(day(t.printedOn)) +
        "</dd><dt>Status</dt><dd>" + esc((t.statusSteps || [])[t.statusAt] || t.status) + "</dd><dt>Courses</dt><dd>" + esc(t.courses) + "</dd></dl>"));
      var rep = part("report");
      if (rep && (rep.courses || []).length) {
        people.appendChild(h("div", "person", "<div class='top'><span class='ft-ic'>" + icon("grades", 18) + "</span><div><div class='nm'>Report</div><div class='rel'>" +
          esc(SCHOOL) + " · assembled from the marks, never stored</div></div></div><dl><dt>Courses</dt><dd>" + esc(rep.courses.length) +
          "</dd><dt>As of</dt><dd>Now — it changes when a mark does</dd></dl>"));
      }
      p.appendChild(people);
      p.appendChild(sourceLine("Files themselves are kept by the school. Ask the registrar for a copy of anything listed here."));
    }
    recordPanel(gridNode, "documents", { title: rec("documents") ? "Filed by the school" : null });
  };

  /* ----------------------------------------------------------- Student */
  RENDER.student = function (gridNode) {
    var s = S.student, g = grad(), c = part("contact"), r = rec("student");
    var used = { "preferred name": true };
    function fact(label) {
      var v = factOf("student", label);
      if (v) used[label.toLowerCase()] = true;
      return v;
    }
    var pref = preferred();
    var yrs = c ? ageOf(c.dateOfBirth) : null;

    var p = panel(gridNode, "s12");
    var pr = h("div", "profile");
    pr.appendChild(h("span", "av", esc(s.initials || ""))).style.setProperty("--hue", s.hue || "#2a78d6");
    pr.appendChild(h("div", null, "<p class='fh-eyebrow'>Student</p><h3>" + esc(s.name || "") + "</h3>" +
      (pref && pref !== s.firstName ? "<p class='goes'>Goes by <b>" + esc(pref) + "</b></p>" : "")));
    p.appendChild(pr);
    var kv = h("dl", "kv");
    kv.style.marginTop = "18px";
    kvFill(kv, [["First name", fact("First name") || s.firstName],
     ["Middle name", fact("Middle name")],
     ["Last name", fact("Last name")],
     ["Suffix", fact("Suffix")],
     ["Preferred name", pref],
     ["Gender", fact("Gender")],
     ["Date of birth", c && c.dateOfBirth ? day(c.dateOfBirth) + (yrs != null ? " · " + yrs + " years old" : "") : null],
     ["Ethnicity", fact("Ethnicity")],
     ["Grade", g && g.program && g.program.gradeLevel != null ? "Grade " + g.program.gradeLevel : null],
     ["School", SCHOOL]
    ].map(function (x) { return [x[0], x[1] ? esc(x[1]) : null, x[1]]; }));
    p.appendChild(kv);

    var cp = panel(gridNode, "s12", "Contact", null);
    var sms = fact("SMS notifications");
    function tel(n) { return n ? "<a href='tel:" + esc(n.replace(/[^\d+]/g, "")) + "'>" + esc(n) + "</a>" : null; }
    var rows = [
      ["Address", c && c.mailingAddress ? esc(c.mailingAddress) : null],
      ["Email", s.email ? "<a href='mailto:" + esc(s.email) + "'>" + esc(s.email) + "</a>" : null],
      ["Cell", c ? tel(c.cellPhone) : null],
      ["Alternate", c ? tel(c.altPhone) : null],
      ["SMS notifications", sms ? esc(sms) : null]
    ].filter(function (x) { return x[1]; });
    if (rows.length) {
      var ckv = h("dl", "kv");
      kvFill(ckv, rows.map(function (x) {
        var phone = x[0] === "Cell" || x[0] === "Alternate";
        return [x[0], x[1], phone ? "phone" : x[1], x[0] === "Address" || x[0] === "Email", x[0] === "Address" ? "addr" : ""];
      }));
      cp.appendChild(ckv);
    } else {
      cp.appendChild(emptyState("No contact details on file", "The school records an address and phone numbers here."));
    }
    if (!c && partError("contact")) {
      cp.appendChild(h("p", "problem", "Contact details could not be read: " + esc(partError("contact").message)));
    }
    if (c && (S.admin || (S.me && S.me.id === s.id))) {
      cp.head.appendChild(h("div", "act")).appendChild(btn("fb-btn sm quiet", icon("edit", 14) + "Edit", function () {
        editContact(cp, { id: s.id, name: s.name, contact: c }, "student");
      }));
    }

    // Anything else the school wrote about the student, without repeating the
    // facts already on the card above.
    var extra = ((r && r.facts) || []).filter(function (f) { return f.value && !used[String(f.label).toLowerCase()]; });
    if (S.admin) {
      recordPanel(gridNode, "student", { title: r ? "The school's details" : null, emptyTitle: "No details from the school yet" });
    } else if (extra.length) {
      var ep = panel(gridNode, "s12", "More from the school", null);
      ep.appendChild(stats(extra.map(function (f) { return { l: f.label, v: esc(f.value), text: String(f.value).length > 14 }; })));
    }
  };

  /* --------------------------------------------------------- Guardians */
  RENDER.guardians = function (gridNode) {
    var list = part("guardians");
    if (!list) { problemFor(gridNode, "guardians", "The family"); return; }
    var p = panel(gridNode, "s12", list.length ? "Linked to " + first() : null,
      list.length ? "The people who can open this view. Each signs in with their own Oplo Account." : null);
    if (!list.length) p.appendChild(emptyState("Nobody is linked yet", S.admin ? "Add a guardian below and they can sign in to this view." : SEC.guardians.empty));
    var people = h("div", "people");
    list.forEach(function (x) {
      var mine = S.me && x.id === S.me.id;
      var card = h("div", "person");
      card.innerHTML = "<div class='top'><span class='av lg' style='--hue:" + esc(x.hue || "#0f766e") + "'>" + esc(x.initials || "") +
        "</span><div><div class='nm'>" + esc(x.name) + "</div><div class='rel'>" + esc([x.label, RELATIONSHIP[x.relationship]].filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(" · ")) +
        (x.primary ? " · primary" : "") + (mine ? " · you" : "") + "</div></div></div>";
      var dl = h("dl");
      var c = x.contact || {};
      var rows = [["Email", x.email ? "<a href='mailto:" + esc(x.email) + "'>" + esc(x.email) + "</a>" : "—"],
                  ["Cell", c.cellPhone ? "<a href='tel:" + esc(c.cellPhone.replace(/[^\d+]/g, "")) + "'>" + esc(c.cellPhone) + "</a>" : "Not given"],
                  ["Alternate", c.altPhone ? "<a href='tel:" + esc(c.altPhone.replace(/[^\d+]/g, "")) + "'>" + esc(c.altPhone) + "</a>" : "Not given"]];
      if ("mailingAddress" in c) rows.push(["Mailing address", c.mailingAddress ? esc(c.mailingAddress) : "Not given"]);
      if ("dateOfBirth" in c) rows.push(["Date of birth", c.dateOfBirth ? esc(day(c.dateOfBirth)) : "Not given"]);
      rows.forEach(function (r) { dl.innerHTML += "<dt>" + esc(r[0]) + "</dt><dd>" + r[1] + "</dd>"; });
      card.appendChild(dl);
      var acts = h("div", "acts");
      if (mine || S.admin) acts.appendChild(btn("fb-btn sm quiet", icon("edit", 14) + (mine ? "Edit my details" : "Edit details"), function () { editContact(card, x); }));
      if (S.admin) acts.appendChild(btn("fb-btn sm danger", "Remove from " + esc(first()), function () {
        if (!window.confirm("Remove " + x.name + " from " + first() + "? Their account stays; they stop seeing this record.")) return;
        API.family.removeGuardian(S.student.id, x.id).then(function (next) {
          S.data.guardians = { ok: true, v: next };
          S.dirty = true;
          toast(x.name + " is no longer linked to " + first() + ".");
          renderSheet("guardians");
        }, function (e) { toast(e.message); });
      }));
      if (acts.children.length) card.appendChild(acts);
      people.appendChild(card);
    });
    if (list.length) p.appendChild(people);
    p.appendChild(sourceLine("Phone numbers are shown to the student's family and teachers. A mailing address and date of birth are shown only to the person they belong to and to the school's administrators."));
    if (S.admin) addGuardianPanel(gridNode);
  };

  function editContact(card, x, section) {
    section = section || "guardians";
    var c = x.contact || {};
    card.innerHTML = "";
    var form = h("form", "fe");
    form.noValidate = true;
    form.appendChild(h("div", "person-h", "<div class='nm' style='font:400 24px/1 var(--serif)'>" + esc(x.name) + "</div>"));
    function row(label, type, value, help) {
      var l = h("label", "fe-row", "<span>" + esc(label) + "</span>");
      var i = h(type === "textarea" ? "textarea" : "input");
      if (type !== "textarea") i.type = type;
      i.value = value || "";
      l.appendChild(i);
      if (help) l.appendChild(h("small", null, esc(help)));
      form.appendChild(l);
      return i;
    }
    var cell = row("Cell phone", "tel", c.cellPhone);
    var alt = row("Alternate phone", "tel", c.altPhone);
    var addr = row("Mailing address", "textarea", c.mailingAddress);
    var dob = row("Date of birth", "date", c.dateOfBirth);
    form.appendChild(h("p", "fe-note", "Leave a field empty, or write N/A, when there is nothing to give."));
    var acts = h("div", "fe-acts");
    var save = btn("fb-btn sm", "Save", null);
    save.type = "submit";
    acts.appendChild(save);
    acts.appendChild(btn("fb-btn sm quiet", "Cancel", function () { renderSheet(section); }));
    form.appendChild(acts);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      save.disabled = true;
      API.family.contact(x.id, { cellPhone: cell.value, altPhone: alt.value, mailingAddress: addr.value, dateOfBirth: dob.value })
        .then(function () {
          return section === "student" ? API.family.getContact(S.student.id) : API.family.guardians(S.student.id);
        })
        .then(function (next) {
          S.data[section === "student" ? "contact" : "guardians"] = { ok: true, v: next };
          S.dirty = true;
          toast("Saved.");
          renderSheet(section);
        }, function (err) { save.disabled = false; toast(err.message); });
    });
    card.appendChild(form);
    cell.focus();
  }

  /* Adding a guardian. The account is created on the server, which hashes the
     password there; this page sends it once and keeps nothing. An email that
     already holds an Oplo Account is linked as it is, and its owner keeps
     their own password. */
  function addGuardianPanel(gridNode) {
    var p = panel(gridNode, "s12", "Add a guardian", "Creates their Oplo Account and links it to " + esc(first()) +
      ". They sign in at " + esc(location.host + location.pathname.replace(/[^/]*$/, "")) + " and see this view.");
    var form = h("form", "fe");
    form.noValidate = true;
    var grid2 = h("div", "fe-grid2");
    function row(label, type, help, attrs) {
      var l = h("label", "fe-row", "<span>" + esc(label) + "</span>");
      var i = h("input");
      i.type = type;
      Object.keys(attrs || {}).forEach(function (k) { i.setAttribute(k, attrs[k]); });
      l.appendChild(i);
      if (help) l.appendChild(h("small", null, esc(help)));
      grid2.appendChild(l);
      return i;
    }
    var name = row("Full name", "text", null, { autocomplete: "off" });
    var email = row("Email", "email", "Their sign-in.", { autocomplete: "off", autocapitalize: "none", spellcheck: "false" });
    var pw = row("Password", "password", "Leave empty if this email already has an Oplo Account.", { autocomplete: "new-password" });
    var relL = h("label", "fe-row", "<span>Relationship</span>");
    var rel = h("select");
    Object.keys(RELATIONSHIP).forEach(function (k) {
      var o = h("option");
      o.value = k;
      o.textContent = RELATIONSHIP[k];
      rel.appendChild(o);
    });
    relL.appendChild(rel);
    grid2.appendChild(relL);
    var label = row("Described as", "text", "How the family says it — Father, Aunt.", { autocomplete: "off" });
    var cell = row("Cell phone", "tel", null, { autocomplete: "off" });
    var alt = row("Alternate phone", "tel", null, { autocomplete: "off" });
    var addr = row("Mailing address", "text", null, { autocomplete: "off" });
    var dob = row("Date of birth", "date", null, {});
    form.appendChild(grid2);
    var prim = h("label", "fe-check", "<input type='checkbox'> <span>Primary guardian</span>");
    form.appendChild(prim);
    form.appendChild(h("p", "fe-note", "Leave a field empty, or write N/A, when there is nothing to give. The password is sent once over HTTPS " +
      "and hashed on the server; it is never stored in this page and never reaches the database in a readable form."));
    var acts = h("div", "fe-acts");
    var save = btn("fb-btn", icon("plus", 15) + "Add and link", null);
    save.type = "submit";
    acts.appendChild(save);
    form.appendChild(acts);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!name.value.trim() && !pw.value) { /* linking an existing account needs only the email */ }
      var body = {
        email: email.value.trim(), name: name.value.trim(), relationship: rel.value, label: label.value.trim(),
        primary: prim.querySelector("input").checked,
        contact: { cellPhone: cell.value, altPhone: alt.value, mailingAddress: addr.value, dateOfBirth: dob.value }
      };
      if (pw.value) body.password = pw.value;
      save.disabled = true;
      API.family.addGuardian(S.student.id, body).then(function (next) {
        pw.value = "";
        S.data.guardians = { ok: true, v: next };
        S.dirty = true;
        toast((body.name || body.email) + " is linked to " + first() + ".");
        renderSheet("guardians");
      }, function (err) {
        save.disabled = false;
        pw.value = "";
        toast(err.message || "That did not work.");
      });
    });
    p.appendChild(form);
  }

  /* --------------------------------------------------------- Emergency */
  RENDER.emergency = function (gridNode) {
    var r = rec("emergency");
    recordPanel(gridNode, "emergency", { title: r ? "Emergency contacts" : null, emptyTitle: "No separate emergency contact recorded" });
    var gs = part("guardians") || [];
    if (!r && gs.length) {
      var p = panel(gridNode, "s12", "Until one is recorded", "These are the guardians on file. The school calls them first.");
      var people = h("div", "people");
      gs.forEach(function (x) {
        var c = x.contact || {};
        people.appendChild(h("div", "person", "<div class='top'><span class='av lg' style='--hue:" + esc(x.hue || "#0f766e") + "'>" + esc(x.initials || "") +
          "</span><div><div class='nm'>" + esc(x.name) + "</div><div class='rel'>" + esc(x.label || RELATIONSHIP[x.relationship] || "Family") + "</div></div></div>" +
          "<dl><dt>Cell</dt><dd>" + (c.cellPhone ? "<a href='tel:" + esc(c.cellPhone.replace(/[^\d+]/g, "")) + "'>" + esc(c.cellPhone) + "</a>" : "Not given") +
          "</dd><dt>Email</dt><dd>" + esc(x.email || "—") + "</dd></dl>"));
      });
      p.appendChild(people);
    }
  };

  /* ================================================================ Go */

  start();
})();
