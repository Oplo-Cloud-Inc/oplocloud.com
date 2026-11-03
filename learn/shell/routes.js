/* ==========================================================================
   The route table — the one place that says what the menu is.

   Seven sections and Admin tools, each with its pages (a section is a "module" in the
   code, a page is a "tab"); a page may have a second row of views (C-09b, "sub") but never a
   third level, so the menu is two levels deep. A menu word is the page's title word for word:
   the shell writes it over the old page's own heading. The address of any screen is

       /admin/{module}/{tab}/{sub-or-record}/{record-tab}?filters

   (Admin tools is flat, as D-07 settles: /admin/settings, /admin/security, /admin/audit-log.)
   A tab or a sub-tab is drawn by a screen of its own once that screen is built;
   until then it names the old console page that does the job, in `legacy`, and the
   shell hosts that page. The first legacy key the school has (it depends on the
   country and on who is signed in) is the one drawn, so a tab nobody can open is
   not in the menu at all: items a role cannot use are hidden, never greyed, and
   a module that is not built is behind a flag, never shown.

   Pure: no DOM, no network. api/scripts/test-routes.mjs runs it.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL = window.OL || {};

  /* A flag is false until the thing behind it ships. Documents wait for file storage (the brief), Fees,
     Messages, Dashboards and Year-end for their modules, the homework diary and lesson plans for theirs. */
  var FLAGS = { family: false, fees: false, documents: false, homework: false, lessonPlans: false, messages: false, dashboards: false,
                yearEnd: false, staffAttendance: false, standards: false, sftp: false };

  /* A school's own say (O8): the modules it may turn on, off until it does (Admin › Settings › Modules), and the new frame, on until it
     is turned off. A tab that names a flag is shown when the flag above AND the school's switch are on, so the flag stays the hard
     off-switch and a module that is not built cannot be turned on from a school's settings; a flag that is not a school switch
     (documents, dashboards…) is the flag alone. setSchool() is given the school's profile when someone signs in and again when
     the Modules page saves. The same five names are api/src/services/profile.js MODULES (test-routes.mjs checks they agree). */
  var SWITCHES = ["family", "fees", "homework", "lessonPlans", "messages"];
  var school = { modules: {}, frame: true };
  function setSchool(p) { school = { modules: (p && p.modules) || {}, frame: !p || p.frame !== false }; }

  function tab(key, legacy, more) {
    var t = { key: key, legacy: legacy ? [].concat(legacy) : [] };
    if (more) for (var k in more) t[k] = more[k];
    return t;
  }
  function sub(key, legacy, more) { return tab(key, legacy, more); }
  function withSubs(key, subs, more) { var t = tab(key, null, more); t.subs = subs; return t; }

  /* `phone` is the section's answer to "and on a phone?" (D11). "page": the jobs done away from a desk have a phone page of their
     own, named in `phonePages` (pages of this section); the rest of the section is cards. "cards": desktop-first, every table becomes
     a card list. The new frame stays desktop-only until a section's phone pages are built, and DESIGN.md says where each one is.

     `soon: true` on a page that is behind a flag draws it in the menu as a row that says "Coming soon" instead of leaving it out, for
     an administrator only (the rows a school office will look for: fees, messages, standards, SFTP). It is not a link, and when the
     flag goes true the page takes its place. Those rows sit at the end of their section. */
  var MODULES = [
    { key: "today", icon: "home", solo: true, phone: "page", phonePages: ["overview"], tabs: [tab("overview", "today")] },

    { key: "students", icon: "users", phone: "page", phonePages: ["admissions"], tabs: [
      tab("directory", "students"),
      withSubs("classes", [sub("sections", "in-classes"), sub("lists", "rosters")]),
      tab("admissions", "enrollment"),
      withSubs("families", [sub("list", "guardians"), sub("invites", "invite-sheets", { flag: "family" })]),
      tab("health", "health"),
      tab("documents", "documents", { flag: "documents" }),
      tab("certificates", "in-certs"),
      tab("records", "records"),
      tab("graduation", "graduation"),
      withSubs("support", [sub("needs-attention", "support"), sub("early-warning", "in-ews"), sub("mentoring", "in-cases"), sub("discipline", "behavior"),
        sub("referrals", "referrals"), sub("learning-support", "senplans"), sub("accommodations", "accommodations"), sub("detention", "detention")])
    ] },

    { key: "attendance", icon: "calendar-check", phone: "page", phonePages: ["registers"], tabs: [
      tab("registers", "in-register"),
      tab("low-attendance", "in-watch"),
      tab("condonation", "in-condone"),
      tab("by-subject", "attendance"),
      tab("change-log", "in-changes"),
      tab("staff", null, { flag: "staffAttendance" })
    ] },

    { key: "exams", icon: "clipboard-check", phone: "page", phonePages: ["marks"], tabs: [
      tab("plan", "in-exams"),
      tab("assessments", "assessments"),
      tab("marks", "gradebook"),
      withSubs("results", [sub("analysis", "in-analysis"), sub("gpa", "gpa"), sub("transcripts", "transcripts")]),
      tab("scales", "in-scales"),
      tab("competencies", "in-comp"),
      tab("report-cards", "reportcards"),
      tab("periods", "periods"),
      tab("standards", "standards", { flag: "standards", soon: true })
    ] },

    { key: "timetable", icon: "clock", phone: "page", phonePages: ["timetable", "homework"], tabs: [
      tab("school-days", "sc-days"),
      tab("bell-schedule", "sc-bell"),
      tab("subjects", "sc-courses"),
      tab("timetable", "sc-sections"),
      tab("future-plans", "sc-plans"),
      tab("add-drop", "sc-adddrop"),
      withSubs("curriculum", [sub("courses", "curriculum"), sub("map", "curmap")]),
      tab("lesson-plans", null, { flag: "lessonPlans" }),
      tab("homework", null, { flag: "homework" })
    ] },

    { key: "people", icon: "message", phone: "page", phonePages: ["circulars"], tabs: [
      tab("teachers", "staff"),
      tab("leave", "leave"),
      tab("cover", "cover"),
      tab("departments", "departments"),
      tab("qualifications", "certs"),
      tab("access", "permissions"),
      tab("teacher-analytics", "teacher-analytics"),
      tab("inbox", "inbox"),
      tab("circulars", "forms"),
      tab("events", "events"),
      tab("outbox", "outbox"),
      tab("messages", null, { flag: "messages", soon: true })
    ] },

    { key: "office", icon: "building", phone: "cards", tabs: [
      tab("transport", "routes"),
      tab("library", "loans"),
      withSubs("facilities", [sub("orders", "fx-orders"), sub("spaces", "fx-spaces"), sub("assets", "fx-assets"), sub("routines", "fx-upkeep"),
        sub("bookings", "fx-bookings"), sub("vendors", "fx-vendors"), sub("documents", "fx-documents", { flag: "documents" }), sub("reports", "fx-reports")]),
      tab("equipment", "checkouts"),
      tab("menus", "menus"),
      tab("eligibility", "eligibility"),
      tab("lockers", "lockers"),
      tab("fees", null, { flag: "fees", soon: true })
    ] },

    /* Admin tools sits at the foot of the rail with a gear, as one entry: analytics, reports, the data centre, security, the audit log and
       settings. Its URLs are flat (D-07), so a page key here must not be the key of a section. */
    { key: "admin", icon: "settings", flat: true, foot: true, phone: "cards", tabs: [
      withSubs("analytics", [sub("academic", "analytics"), sub("assessments", "an-assessments"), sub("growth", "growth"), sub("groups", "groups"),
        sub("longitudinal", "longitudinal"), sub("standards", "an-standards", { flag: "standards" })]),
      withSubs("reports", [sub("office", "office"), sub("builder", "builder")]),
      tab("dashboards", null, { flag: "dashboards" }),
      withSubs("data", [sub("exports", "data"), sub("imports", "imports"), sub("integrations", "sis"), sub("api", "api"), sub("state", "state"), sub("district", "district")]),
      tab("compliance", "in-compliance"),
      tab("security", "security"),
      tab("audit-log", "activity"),
      withSubs("settings", [sub("general", "system"), sub("modules", "modules")]),
      tab("year-end", null, { flag: "yearEnd" }),
      tab("sftp", "sftp", { flag: "sftp", soon: true })
    ] }
  ];

  /* Old console pages that are reached from another screen rather than from a menu row, and the tab that now owns them. */
  var ALIASES = { roster: ["exams", "marks"], missing: ["students", "support", "needs-attention"], courses: ["timetable", "subjects"],
                  people: ["people", "teachers"] };

  var byKey = {};
  MODULES.forEach(function (m) { byKey[m.key] = m; });

  var on = function (o) { return !o.flag || (FLAGS[o.flag] === true && (SWITCHES.indexOf(o.flag) < 0 || school.modules[o.flag] === true)); };

  /* The sub-tabs or legacy keys of a tab that this person can open. `allowed` is a function: legacy key → bool. */
  function open(t, allowed) {
    if (!on(t)) return null;
    if (t.subs) {
      var subs = t.subs.filter(function (s) { return on(s) && s.legacy.some(allowed); });
      return subs.length ? subs : null;
    }
    return t.legacy.some(allowed) ? [] : null;
  }

  /* The sections and pages this person sees: { key, icon, flat, foot, tabs: [{ key, subs: [{ key }]|[] }], soon: [{ key }] }.
     `soon` is the pages that are promised and not built (see MODULES), for someone who is asked as allowed("@soon"): kept apart from
     `tabs`, which is only ever pages that open. */
  function visible(allowed) {
    var promised = !!allowed("@soon");
    return MODULES.filter(on).map(function (m) {
      var tabs = [], soon = [];
      m.tabs.forEach(function (t) {
        var subs = open(t, allowed);
        if (subs) tabs.push({ key: t.key, subs: subs.map(function (s) { return { key: s.key }; }) });
        else if (promised && t.soon && !on(t)) soon.push({ key: t.key });
      });
      return tabs.length ? { key: m.key, icon: m.icon, flat: !!m.flat, foot: !!m.foot, solo: !!m.solo, tabs: tabs, soon: soon } : null;
    }).filter(Boolean);
  }

  /* The old page a tab (and sub-tab) is drawn by: the first legacy key this person is allowed. */
  function legacyOf(moduleKey, tabKey, subKey, allowed) {
    var m = byKey[moduleKey], t = m && m.tabs.filter(function (x) { return x.key === tabKey; })[0];
    if (!t || !on(t)) return null;
    var leaf = t;
    if (t.subs) {
      var live = t.subs.filter(function (s) { return on(s) && s.legacy.some(allowed); });
      leaf = (subKey && live.filter(function (s) { return s.key === subKey; })[0]) || live[0];
      if (!leaf) return null;
    }
    return leaf.legacy.filter(allowed)[0] || null;
  }

  /* Where a legacy key now lives: { module, tab, sub|null } or null. An alias also says so: the page is a way into the tab, not the tab. */
  function locate(k) {
    if (ALIASES[k]) return { module: ALIASES[k][0], tab: ALIASES[k][1], sub: ALIASES[k][2] || null, alias: true };
    for (var i = 0; i < MODULES.length; i++) {
      var m = MODULES[i];
      for (var j = 0; j < m.tabs.length; j++) {
        var t = m.tabs[j];
        if (t.legacy.indexOf(k) > -1) return { module: m.key, tab: t.key, sub: null };
        if (t.subs) for (var s = 0; s < t.subs.length; s++) if (t.subs[s].legacy.indexOf(k) > -1) return { module: m.key, tab: t.key, sub: t.subs[s].key };
      }
    }
    return null;
  }

  /* "students/directory/stu_123/attendance?class=X-C" → the pieces. `allowed` decides sub-tab versus record. */
  function parse(rest, allowed) {
    var qi = String(rest || "").indexOf("?"), q = qi > -1 ? String(rest).slice(qi + 1) : "";
    var seg = (qi > -1 ? String(rest).slice(0, qi) : String(rest || "")).split("/").filter(Boolean).map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } });
    var lower = function (x) { return String(x || "").toLowerCase(); };
    var out = { module: null, tab: null, sub: null, record: null, recordTab: null, query: q, legacy: null };
    if (!seg.length) return out;
    var m = byKey[lower(seg[0])], rest2;
    if (m && !m.flat) { out.module = m.key; rest2 = seg.slice(1); }
    else {
      // Admin is flat: /admin/security. Find the module that owns the first segment as a tab.
      m = MODULES.filter(function (x) { return x.flat && x.tabs.some(function (t) { return t.key === lower(seg[0]); }); })[0];
      if (!m) return out;
      out.module = m.key; rest2 = seg;
    }
    var t = m.solo ? m.tabs[0] : m.tabs.filter(function (x) { return x.key === lower(rest2[0]) && on(x); })[0];
    if (!t) { out.tab = null; return out; }
    if (m.solo) rest2 = [t.key].concat(rest2);
    out.tab = t.key;
    var next = 1;
    if (t.subs && rest2[1]) {
      var s = t.subs.filter(function (x) { return x.key === lower(rest2[1]) && on(x); })[0];
      if (s) { out.sub = s.key; next = 2; }
    }
    out.record = rest2[next] || null;
    out.recordTab = rest2[next + 1] || null;
    if (allowed) out.legacy = legacyOf(out.module, out.tab, out.sub, allowed);
    return out;
  }

  /* The path (no leading slash, no query) of a tab. A sub-tab shows in the path only when the row of them is drawn
     (more than one), so the address of a tab with a single page does not carry a segment that adds nothing. */
  function pathOf(p, allowed) {
    var m = byKey[p.module];
    if (!m) return "";
    var parts = m.flat ? [] : [m.key];
    if (p.tab && !m.solo) parts.push(p.tab);
    var t = p.tab && m.tabs.filter(function (x) { return x.key === p.tab; })[0];
    if (t && t.subs && p.sub) {
      var live = allowed ? t.subs.filter(function (s) { return on(s) && s.legacy.some(allowed); }) : t.subs;
      if (live.length > 1) parts.push(p.sub);
    }
    if (p.record) { parts.push(p.record); if (p.recordTab) parts.push(p.recordTab); }
    return parts.join("/");
  }

  function pathForLegacy(k, allowed) {
    var at = locate(k);
    return at ? pathOf({ module: at.module, tab: at.tab, sub: at.sub }, allowed) : null;
  }

  /* The module's own front door: its first tab (D-02 lets a role pick a better one; the shell passes `prefer`). */
  function front(moduleKey, allowed, prefer) {
    var v = visible(allowed).filter(function (m) { return m.key === moduleKey; })[0];
    if (!v) return null;
    var t = (prefer && v.tabs.filter(function (x) { return x.key === prefer; })[0]) || v.tabs[0];
    return { module: v.key, tab: t.key, sub: t.subs.length ? t.subs[0].key : null };
  }

  OL.routes = { MODULES: MODULES, FLAGS: FLAGS, SWITCHES: SWITCHES, setSchool: setSchool, frame: function () { return school.frame; }, ALIASES: ALIASES, visible: visible, legacyOf: legacyOf, locate: locate, parse: parse, pathOf: pathOf,
                pathForLegacy: pathForLegacy, front: front, module: function (k) { return byKey[k] || null; } };
})();
