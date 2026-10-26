/* ==========================================================================
   The component gallery — every component in every state, on one page, in every
   theme, density and language. It is the thing a reviewer opens to see whether
   the library is finished, and the page the visual and accessibility tests walk.

   Dev only: _ui.html and this file are in .assetsignore, so neither is
   published. The data is made up on the spot (1,801 students, 68 sections —
   the size of a real school, which is the point) and nothing here touches the
   network.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };

  /* ------------------------------------------------------------- made-up data */
  var seed = 7;
  function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
  var FIRST = ["Aarav", "Vihaan", "Aditya", "Arjun", "Reyansh", "Ishaan", "Kabir", "Krish", "Rohan", "Dev", "Ananya", "Diya", "Saanvi", "Aadhya", "Myra", "Anika", "Riya", "Kiara", "Navya", "Meera", "Harpreet", "Gurpreet", "Simran", "Jaspreet", "Manpreet", "Tanvi", "Ritika", "Pooja", "Sehej", "Zoya"];
  var LAST = ["Sharma", "Verma", "Singh", "Kaur", "Gupta", "Mehta", "Chopra", "Bhatia", "Sood", "Kapoor", "Malhotra", "Arora", "Khanna", "Joshi", "Nair", "Iyer", "Reddy", "Das", "Roy", "Sandhu"];
  var LEVELS = [["Nursery", 3], ["LKG", 3], ["UKG", 3], ["I", 4], ["II", 4], ["III", 4], ["IV", 4], ["V", 4], ["VI", 4], ["VII", 4], ["VIII", 4], ["IX", 5], ["X", 5], ["XI", 8], ["XII", 9]];
  var CLASSES = LEVELS.map(function (l) {
    var secs = []; for (var i = 0; i < l[1]; i++) { var L = String.fromCharCode(65 + i); secs.push({ id: l[0] + "-" + L, label: l[0] + "-" + L, count: 20 + Math.floor(rnd() * 26) }); }
    return { id: l[0], label: /^(Nursery|LKG|UKG)$/.test(l[0]) ? l[0] : "Class " + l[0], sections: secs };
  });
  var SECTIONS = [].concat.apply([], CLASSES.map(function (c) { return c.sections; }));
  var STUDENTS = [];
  for (var i = 0; i < 1801; i++) {
    var sec = SECTIONS[i % SECTIONS.length];
    STUDENTS.push({
      id: "stu_" + (i + 1), name: FIRST[Math.floor(rnd() * FIRST.length)] + " " + LAST[Math.floor(rnd() * LAST.length)],
      adm: "EHS/" + (2015 + (i % 11)) + "/" + String(1000 + i), cls: sec.label, roll: 1 + Math.floor(i / SECTIONS.length),
      att: 60 + Math.floor(rnd() * 41), status: ["active", "active", "active", "active", "on_leave", "left"][Math.floor(rnd() * 6)], fee: rnd() < .12 ? "overdue" : "paid"
    });
  }
  function searchStudents(q) {
    q = (q || "").toLowerCase();
    return new Promise(function (res) {
      setTimeout(function () {
        var list = !q ? STUDENTS.slice(0, 3).map(function (s) { return { id: s.id, name: s.name, sub: s.cls + " · " + s.adm, group: "Recent" }; })
          : STUDENTS.filter(function (s) { return (s.name + " " + s.adm + " " + s.cls).toLowerCase().indexOf(q) > -1; }).slice(0, 25).map(function (s) { return { id: s.id, name: s.name, sub: s.cls + " · " + s.adm }; });
        res(list);
      }, 180);
    });
  }

  /* ------------------------------------------------------------------ layout */
  var SECTIONS_DEF = [];
  function section(id, title, cnum, blurb, nodes) { SECTIONS_DEF.push({ id: id, title: title }); return h("section", { class: "gl-sec", id: id }, h("header", { class: "gl-sec__h" }, h("h2", { text: title }), cnum ? h("span", { class: "gl-sec__c", text: cnum }) : null), blurb ? h("p", { class: "gl-sec__p", text: blurb }) : null, h("div", { class: "gl-grid" }, nodes)); }
  function demo(title, node, wide) { return h("figure", { class: OL.cx("gl-demo", wide && "is-wide") }, node, h("figcaption", { text: title })); }
  function row() { return h("div", { class: "gl-row" }, [].slice.call(arguments)); }

  /* ---------------------------------------------------------------- sections */
  function foundations() {
    var tokens = ["--c-bg", "--c-bg-subtle", "--c-surface", "--c-line", "--c-line-strong", "--c-line-input", "--c-text", "--c-text-2", "--c-text-3", "--c-accent", "--c-accent-soft", "--c-success", "--c-success-soft", "--c-warning", "--c-warning-soft", "--c-danger", "--c-danger-soft", "--c-info", "--c-info-soft"];
    var sw = h("div", { class: "gl-sw" });
    tokens.forEach(function (k) { sw.appendChild(h("div", { class: "gl-sw__i" }, h("i", { style: { background: "var(" + k + ")" } }), h("code", { text: k }))); });
    var type = h("div", { class: "gl-type" });
    [["display", "Display 28/36 — Today"], ["h1", "H1 22/30 — Students"], ["h2", "H2 17/24 — Class X-C"], ["h3", "H3 15/22 — Attendance"], ["body", "Body 14/20 — Asha Verma, Class X-C, roll 21"], ["small", "Small 13/18 — Last saved 10:42 am"], ["caption", "CAPTION 12/16 — ADMISSION NO."]].forEach(function (x) {
      type.appendChild(h("div", { class: "gl-type__r", style: { font: "var(--t-" + x[0] + ")" }, text: x[1] }));
    });
    return section("foundations", "Foundations", "Tokens", "Colour, type and spacing come from tokens.css and nothing else. Switch theme and density above.", [demo("Colour tokens", sw, true), demo("Type scale (Inter 650 / 600 / 400)", type, true)]);
  }

  function buttons() {
    var B = OL.ui.button.render, out = [];
    ["primary", "secondary", "ghost", "danger", "link"].forEach(function (v) {
      out.push(demo(v, row(B({ label: "Save register", variant: v }), B({ label: "With icon", variant: v, icon: "plus" }), B({ label: "Loading", variant: v, loading: true }), B({ label: "Disabled", variant: v, disabled: true, disabledReason: "Take attendance first" }))));
    });
    out.push(demo("sizes and icon-only", row(B({ label: "Small", size: "sm", variant: "secondary" }), B({ label: "Medium", variant: "secondary" }), B({ label: "Large", size: "lg", variant: "secondary" }), B({ iconOnly: true, icon: "settings", ariaLabel: "Settings", variant: "secondary" }), B({ iconOnly: true, icon: "trash", ariaLabel: "Delete", variant: "ghost" }))));
    return section("buttons", "Button", "C-01", "One primary per view. Disabled stays focusable and says why on hover and focus.", out);
  }

  function inputs() {
    var I = OL.ui.input.render, C = OL.ui.check;
    return section("inputs", "Input, textarea, checkbox, radio, switch", "C-02", "Label above, helper below, the error takes the helper's place with an icon.", [
      demo("default with helper", I({ label: "Guardian's name", helper: "As on the birth certificate" })),
      demo("error", I({ label: "Mobile number", value: "98765", error: "Enter a 10-digit number starting with 6, 7, 8 or 9" })),
      demo("prefix and suffix", row(I({ label: "Fee amount", prefix: "₹", value: "12,500", inputMode: "numeric" }), I({ label: "Weightage", suffix: "%", value: "40", inputMode: "numeric" }))),
      demo("optional, disabled, read-only", row(I({ label: "Alternate phone", optional: true, prefix: "+91" }), I({ label: "Admission no.", value: "EHS/2024/1042", disabled: true }), I({ label: "Section", value: "X-C", readOnly: true }))),
      demo("textarea with counter", I({ label: "Message", multiline: true, rows: 3, maxLength: 160, counter: true, value: "Parent-teacher meeting on Saturday." })),
      demo("checkbox", C.field({ label: "Send by WhatsApp", helper: "Falls back to SMS if undelivered", checked: true })),
      demo("radio group", C.radios({ label: "Attendance mode", options: [{ value: "day", label: "Once a day" }, { value: "period", label: "Every period", hint: "Teachers mark their own period" }], value: "day" })),
      demo("switch", C.toggle({ label: "Parents can see results", checked: false, helper: "Takes effect at once" }))
    ]);
  }

  function selects() {
    var S = OL.ui.select.render;
    var subj = [{ value: "bio", label: "Biology", count: 12, group: "Science" }, { value: "chem", label: "Chemistry", count: 9, group: "Science" }, { value: "phy", label: "Physics", count: 14, group: "Science" }, { value: "eng", label: "English", count: 28, group: "Languages" }, { value: "hin", label: "Hindi", count: 26, group: "Languages" }, { value: "pun", label: "Punjabi", count: 8, group: "Languages" }, { value: "mat", label: "Mathematics", count: 31, group: "Core" }];
    var states = ["Andhra Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"].map(function (s) { return { value: s, label: s }; });
    return section("selects", "Select", "C-03", "Searchable, single or multi, grouped, async. The summary reads \"Biology, Chemistry +2\".", [
      demo("single, searchable", S({ label: "State", options: states, value: "Punjab" })),
      demo("single, short list (no search)", S({ label: "Board", options: [{ value: "cbse", label: "CBSE" }, { value: "cisce", label: "CISCE" }, { value: "state", label: "State board" }], value: "cbse" })),
      demo("multi, grouped, select all in group, with counts", S({ label: "Subjects", options: subj, multiple: true, selectAllInGroup: true, values: ["bio", "chem", "phy", "eng"], searchable: true })),
      demo("async (type to search)", S({ label: "Transport route", load: function (q) { return new Promise(function (r) { setTimeout(function () { r(["Sector 17", "Sector 22", "Mohali Phase 3", "Zirakpur", "Panchkula Sector 5", "Kharar"].filter(function (x) { return x.toLowerCase().indexOf((q || "").toLowerCase()) > -1; }).map(function (x) { return { value: x, label: x, count: 3 + x.length % 9 }; })); }, 250); }); }, optional: true, clearable: true })),
      demo("error", S({ label: "Academic year", options: [{ value: "2026", label: "2026–27" }, { value: "2025", label: "2025–26" }], error: "Choose the academic year" })),
      demo("disabled", S({ label: "Stream", options: [], disabled: true, placeholder: "Classes XI–XII only" }))
    ]);
  }

  function pickers() {
    var cp = OL.ui.classpicker.render({ label: "Send to classes", classes: CLASSES, values: ["X-A", "X-B", "X-C", "X-D", "XI-A", "XI-B"], helper: "Tick a section, a whole class or a whole stage" });
    var cp1 = OL.ui.classpicker.render({ label: "Class and section", classes: CLASSES, multiple: false, values: ["IX-B"] });
    var byId = {}; STUDENTS.forEach(function (s) { byId[s.adm] = s; });
    var pp = OL.ui.people.render({ label: "Student", kind: "student", search: searchStudents, values: [{ id: STUDENTS[4].id, name: STUDENTS[4].name, sub: STUDENTS[4].cls + " · " + STUDENTS[4].adm }] });
    var pm = OL.ui.people.render({ label: "Send to students", kind: "student", multiple: true, search: searchStudents,
      resolve: function (toks) { return new Promise(function (r) { setTimeout(function () { var found = [], missing = []; toks.forEach(function (x) { var s = byId[x]; if (s) found.push({ id: s.id, name: s.name, sub: s.cls + " · " + s.adm }); else missing.push(x); }); r({ found: found, missing: missing }); }, 200); }); } });
    return section("pickers", "Class and section picker, people picker", "C-04 · C-05", "Replace the 80-chip grid. 68 sections, 15 classes, five stages; a search narrows the tree. People are found from 1,801 by name, admission number or class.", [
      demo("class and section (multi) — summary \"Class X (all 4), XI-A, XI-B\"", cp), demo("class and section (single)", cp1), demo("student (async)", pp), demo("students (multi, paste admission numbers like EHS/2015/1000)", pm)
    ]);
  }

  function dates() {
    var D = OL.ui.date;
    var terms = [{ id: "t1", label: "Term 1", from: "2026-04-01", to: "2026-09-30" }, { id: "t2", label: "Term 2", from: "2026-10-01", to: "2027-03-31" }];
    var off = function (iso) { return OL.fmt.cal.dow(iso) === 6; };
    var echo = h("output", { class: "gl-echo", text: "—" });
    return section("dates", "Date, time and navigator", "C-06 · C-08", "Typed or picked, shown the way the school writes it, stored as ISO. The placeholder shows the format.", [
      demo("date (type 26-10-26, press Tab)", D.render({ label: "Date of birth", value: "2012-03-14", max: OL.fmt.today(), onChange: function (v) { echo.textContent = "stored: " + v; } })), demo("what was stored", echo),
      demo("date range with presets", D.range({ label: "Admitted between" })),
      demo("month", OL.ui.month.render({ label: "Fee month", value: "2026-10" })),
      demo("time and date-time", row(OL.ui.time.render({ label: "Bell", value: "08:55", step: 5 }), OL.ui.datetime.render({ label: "Publish at", value: "2026-10-26T09:30" }))),
      demo("navigator: day (skips Sundays)", OL.ui.datenav.render({ mode: "day", isOff: off })),
      demo("navigator: week", OL.ui.datenav.render({ mode: "week" })),
      demo("navigator: month", OL.ui.datenav.render({ mode: "month" })),
      demo("navigator: term", OL.ui.datenav.render({ mode: "term", terms: terms, value: "t2" }))
    ]);
  }

  function chipsSection() {
    var tokens = h("div", { class: "gl-row" });
    ["Class X-C", "Absent", "Fees overdue"].forEach(function (x) { tokens.appendChild(OL.ui.chips.token({ label: x, onRemove: function (e) { e.currentTarget.parentNode.remove(); } })); });
    return section("chips", "Chips, segmented control, tabs", "C-07 · C-09", "A chip filters and carries its count (\"Open · 12\"). Segmented is for two to four mutually exclusive views.", [
      demo("filter chips with counts", OL.ui.chips.render({ label: "Status", items: [{ value: "all", label: "All", count: 1801 }, { value: "open", label: "Open", count: 12 }, { value: "done", label: "Done", count: 0 }], value: "open" })),
      demo("multi chips", OL.ui.chips.render({ label: "House", multiple: true, items: [{ value: "a", label: "Agni" }, { value: "j", label: "Jal" }, { value: "p", label: "Prithvi" }, { value: "v", label: "Vayu" }], values: ["a", "v"] })),
      demo("active filter tokens", tokens),
      demo("segmented", OL.ui.segmented.render({ label: "View", items: [{ value: "list", label: "List" }, { value: "period", label: "By period" }], value: "list" })),
      demo("page tabs with counts", tabsDemo("page")), demo("sub-tab row (smaller)", tabsDemo("sub")),
      demo("tabs that overflow into More ▾ (narrow container)", h("div", { style: { width: "360px", "max-width": "100%" } }, tabsDemo("page")))
    ]);
  }
  function tabsDemo(size) {
    var wrap = h("div"), panel = h("div", { class: "gl-panel", role: "tabpanel" });
    var tabs = OL.ui.tabs.render({ size: size, label: "Admissions", items: [{ key: "enq", label: "Enquiries", count: 31 }, { key: "app", label: "Applications", count: 12 }, { key: "ass", label: "Assessments" }, { key: "lot", label: "RTE lottery" }, { key: "off", label: "Offers", count: 4 }, { key: "set", label: "Settings" }],
      active: "app", onSelect: function (k) { panel.textContent = "Panel: " + k; panel.id = tabs.panelId(k); } });
    panel.id = tabs.panelId("app"); panel.textContent = "Panel: app";
    wrap.appendChild(tabs); wrap.appendChild(panel); return wrap;
  }

  function tables() {
    var P = OL.ui.pill.render, A = OL.ui.avatar.render;
    var cols = [
      { key: "name", label: "Student", sort: true, mobile: "title", render: function (r) { return h("span", { class: "gl-who" }, A({ name: r.name, id: r.id, size: 24 }), h("a", { class: "ol-link", href: "#" + r.id, text: r.name })); }, value: function (r) { return r.name; } },
      { key: "cls", label: "Class", sort: true, mobile: "sub" },
      { key: "adm", label: "Admission no.", sort: true, mobile: "sub" },
      { key: "roll", label: "Roll", num: true, sort: true },
      { key: "att", label: "Attendance", num: true, sort: true, render: function (r) { return r.att + "%"; }, value: function (r) { return r.att; } },
      { key: "status", label: "Record", mobile: "status", render: function (r) { return P({ status: r.status }); }, value: function (r) { return r.status; } },
      { key: "fee", label: "Fees", render: function (r) { return P({ status: r.fee }); }, value: function (r) { return r.fee; } },
      { key: "phone", label: "Guardian phone", hidden: true, render: function () { return null; } }
    ];
    var st = { page: 1, sort: null }, tbl;
    function sortedAll() {
      if (!st.sort) return STUDENTS;
      var c = cols.filter(function (x) { return x.key === st.sort.key; })[0], d = st.sort.dir === "desc" ? -1 : 1;
      return STUDENTS.slice().sort(function (a, b) { var x = c.value ? c.value(a) : a[c.key], y = c.value ? c.value(b) : b[c.key]; return (x < y ? -1 : x > y ? 1 : 0) * d; });
    }
    function load() {
      var all = sortedAll();
      tbl.update({ loading: true });
      setTimeout(function () { tbl.update({ rows: all.slice((st.page - 1) * 50, st.page * 50), page: st.page, total: all.length, loading: false }); }, 120);
    }
    tbl = OL.ui.table.render({ caption: "Students, 1,801 in all", columns: cols, rows: STUDENTS.slice(0, 50), total: STUDENTS.length, page: 1, pageSize: 50, selectable: true, columnChooser: true, resizable: true, prefsKey: "gallery-students",
      selectAllMatching: { total: STUDENTS.length }, onOpen: function (r) { OL.ui.toast.show({ text: "Opened " + r.name, tone: "info" }); },
      onPage: function (n) { st.page = n; load(); }, onSort: function (k, d) { st.sort = { key: k, dir: d }; st.page = 1; load(); },
      rowActions: function (r) { return [{ label: "Open record", icon: "user", onClick: function () { OL.ui.toast.show({ text: "Open " + r.name }); } }, { label: "Message guardian", icon: "message" }, { sep: true }, { label: "Withdraw student", icon: "trash", danger: true }] } });

    var big = STUDENTS.slice(0, 1000);
    var win = OL.ui.table.render({ caption: "1,000 students, windowed", columns: cols.slice(0, 6), rows: big, onOpen: function () {} });
    win.style.setProperty("--ol-table-max", "320px");
    var exp = OL.ui.table.render({ caption: "Fee summary", selectable: false, totals: true,
      columns: [{ key: "head", label: "Fee head", sort: true }, { key: "due", label: "Due", num: true, sort: true, render: function (r) { return OL.fmt.money(r.due, { whole: true }); }, total: function (rows) { return OL.fmt.money(rows.reduce(function (a, r) { return a + r.due; }, 0), { whole: true }); } },
        { key: "paid", label: "Paid", num: true, render: function (r) { return OL.fmt.money(r.paid, { whole: true }); }, total: function (rows) { return OL.fmt.money(rows.reduce(function (a, r) { return a + r.paid; }, 0), { whole: true }); } },
        { key: "note", label: "Note" }],
      rows: [{ id: 1, head: "Tuition", due: 480000, paid: 455000, note: "" }, { id: 2, head: "Transport", due: 96000, paid: 96000, note: "Paid in full" }, { id: 3, head: "Activity", due: 36000, paid: 12000, note: null }],
      expand: function (r) { return h("p", { text: "Breakdown for " + r.head + ": instalments due 10 Apr, 10 Jul, 10 Oct, 10 Jan." }); } });
    var empty = OL.ui.table.render({ caption: "Empty", columns: cols.slice(0, 3), rows: [], empty: { kind: "filtered", title: "No students match these filters.", onClear: function () {} } });
    var first = OL.ui.table.render({ caption: "Empty first use", columns: cols.slice(0, 3), rows: [], empty: { kind: "first", title: "No students yet", text: "Students appear here once they are admitted or imported.", why: "Admit one at a time, or bring a whole class in from a spreadsheet.", primary: { label: "Add student", icon: "plus" }, secondary: { label: "Import from a file" } } });
    return section("tables", "Data table", "C-10", "50 rows a page from the server (\"1–50 of 1,801\"), sort, select (shift-click a range; select all 1,801), column chooser, resize (drag or ←/→ on the handle), row menu. Under 640 px each row is a card.", [
      demo("1,801 students, server paging, sorting, selection", tbl, true), demo("1,000 rows client-side — windowed, only a screenful in the DOM", win, true),
      demo("expandable rows, totals row, em-dash for empty", exp, true), demo("filtered empty", empty), demo("first-use empty", first),
      demo("loading skeleton (appears after 300 ms)", (function () { var d = h("div", { style: { position: "relative", "min-height": "200px" } }); var stop = OL.ui.skeleton.later(d, { type: "rows", n: 4 }, 0); d.skeletonStop = stop; return d; })())
    ]);
  }

  function grids() {
    var reg = STUDENTS.slice(0, 45).map(function (s, i) { return { id: s.id, roll: i + 1, name: s.name, mark: "P", note: "" }; });
    var saves = h("output", { class: "gl-echo", text: "Autosave sends batches here after 5 s, on leaving the grid, or Ctrl+S." });
    var register = OL.ui.grid.render({ caption: "Register, Class X-C, Monday 26 October 2026", rows: reg, autosaveMs: 2500, advance: true,
      columns: [{ key: "roll", label: "Roll", type: "readonly", width: 64 }, { key: "name", label: "Student", type: "readonly", header: true },
        { key: "mark", label: "Mark", type: "code", codes: { P: "P", A: "AB", M: "ML", L: "LT", X: "" } }, { key: "note", label: "Note", type: "text", maxLength: 40 }],
      onSave: function (changes) { return new Promise(function (r) { setTimeout(function () { saves.textContent = "Saved " + changes.length + " change(s): " + changes.slice(0, 3).map(function (c) { return c.rowKey + "→" + (c.value === "" ? "clear" : c.value); }).join(", ") + (changes.length > 3 ? "…" : ""); r(); }, 300); }); },
      onSubmit: function () { OL.ui.toast.show({ text: "Register submitted", tone: "success" }); } });
    var marks = STUDENTS.slice(0, 12).map(function (s, i) { return { id: s.id, name: s.name, theory: i === 3 ? "AB" : 40 + i, practical: 18 + (i % 3), total: "" }; });
    var markGrid = OL.ui.grid.render({ caption: "Marks, Half-yearly, Chemistry", rows: marks, autosaveMs: 0,
      columns: [{ key: "name", label: "Student", type: "readonly", header: true },
        { key: "theory", label: "Theory /80", type: "number", max: 80, codes: { A: "AB", M: "ML", E: "EX" } }, { key: "practical", label: "Practical /20", type: "number", max: 20, codes: { A: "AB", M: "ML", E: "EX" } }] });
    return section("grids", "Grid editor", "C-11", "The register and marks entry. Type A, M, X; Ctrl+D fills down; Shift+arrows selects; Ctrl+Z undoes; ? lists the keys. A mark above the maximum stays open with its message.", [
      demo("attendance register (P present · A absent · M medical · L late · X clear)", h("div", null, register, saves), true), demo("marks entry (try 85 in Theory; A for absent)", markGrid, true)
    ]);
  }

  function surfaces() {
    var K = OL.ui.kpi.render, P = OL.ui.pill.render, A = OL.ui.avatar.render, B = OL.ui.banner.render, E = OL.ui.empty.render, C = OL.ui.card.render;
    var pills = h("div", { class: "gl-row gl-wrap" });
    Object.keys(OL.ui.pill.TONES).forEach(function (tone) { OL.ui.pill.TONES[tone].forEach(function (s) { pills.appendChild(P({ status: s })); }); });
    return section("surfaces", "KPI, pill, card, banner, empty state, skeleton, avatar", "C-12 · C-13 · C-14 · C-18 · C-19 · C-20 · C-21", "Flat hairline surfaces; colour only as meaning, and always with a word or an icon.", [
      demo("KPI tiles (the whole tile is the button)", row(K({ label: "PRESENT TODAY", value: "1,642", context: "of 1,801", delta: { dir: "up", text: "2.1% vs last week", good: true }, onClick: function () {} }), K({ label: "ABSENT", value: "159", context: "unexplained 38", delta: { dir: "up", text: "11 vs last week", good: false }, selected: true, onClick: function () {} }), K({ label: "LATE", value: "—", context: "no data yet" }))),
      demo("status pills — one word, one colour, everywhere", pills, true),
      demo("card with header action, footer link, collapsible", C({ title: "Fees overdue", why: "Families more than 30 days behind", actions: OL.ui.button.render({ label: "Remind all", variant: "secondary", size: "sm" }), collapsible: true, body: h("p", { text: "62 families owe ₹4,12,500 in all." }), footer: { label: "See all (62)", href: "#" } })),
      demo("banners", h("div", { class: "gl-stack" }, B({ tone: "info", title: "Register is open.", text: "Closes at 10:30 am.", dismissible: true }), B({ tone: "warning", text: "3 students have no guardian phone number.", actions: OL.ui.button.render({ label: "Fix now", variant: "secondary", size: "sm" }) }), B({ tone: "danger", text: "Could not reach the server. Your changes are kept on this device." }), B({ tone: "success", text: "Results published to 1,801 families." }), B({ tone: "offline", text: "You are offline. Marks entered now are saved when you reconnect." }))),
      demo("avatars (colour from the id) and group", row(A({ name: "Asha Verma", id: "stu_1", size: 40 }), A({ name: "Kabir Singh", id: "stu_2", size: 32 }), A({ name: "Diya Sood", id: "stu_3", size: 24 }), OL.ui.avatar.group([{ name: "Asha Verma", id: "a" }, { name: "Kabir Singh", id: "b" }, { name: "Diya Sood", id: "c" }, { name: "Ritika Sood", id: "d" }, { name: "Zoya Khan", id: "e" }]))),
      demo("empty: not permitted", E({ kind: "denied", title: "You do not have access to Fees", text: "Ask your administrator to give you the Accounts role." })),
      demo("skeleton: KPI and card", h("div", { class: "gl-stack" }, OL.ui.skeleton.render({ type: "kpi" }), OL.ui.skeleton.render({ type: "card", n: 1 })))
    ]);
  }

  function overlays() {
    var B = OL.ui.button.render, out = [];
    function form(dirtyCb) {
      var f = h("div", { class: "gl-stack" }, OL.ui.input.render({ label: "Student name", value: "Asha Verma", onInput: dirtyCb }), OL.ui.input.render({ label: "Guardian's phone", prefix: "+91", onInput: dirtyCb }),
        OL.ui.classpicker.render({ label: "Class and section", classes: CLASSES, multiple: false, onChange: dirtyCb }), OL.ui.date.render({ label: "Date of birth", onChange: dirtyCb }));
      return f;
    }
    out.push(demo("drawer — form, 560, dirty guard on Esc/close", row(B({ label: "Add student", variant: "primary", icon: "plus", onClick: function () {
      var d, save = B({ label: "Save student", variant: "primary", onClick: function () { d.setDirty(false); d.close(); OL.ui.toast.show({ text: "Student added", tone: "success", undo: function () {} }); } });
      d = OL.ui.drawer.open({ title: "Add student", subtitle: "Step 1 of 1", width: 560, body: form(function () { d.setDirty(true); }), footer: [B({ label: "Cancel", variant: "secondary", onClick: function () { d.close(); } }), save] });
    } }))));
    out.push(demo("drawer — record peek, 720, tabs, ↑/↓ next record, open full page", row(B({ label: "Peek at a student", variant: "secondary", onClick: function () {
      var idx = 0, d;
      function show() { var s = STUDENTS[idx]; d.setTitle(s.name); d.setBody(h("div", { class: "gl-stack" }, row(OL.ui.avatar.render({ name: s.name, id: s.id, size: 40 }), h("div", null, h("strong", { text: s.cls + " · roll " + s.roll }), h("div", { class: "ol-help", text: s.adm }))), OL.ui.pill.render({ status: s.status }), h("p", { text: "Attendance " + s.att + "%" }))); }
      d = OL.ui.drawer.open({ title: "", width: 720, tabs: [{ key: "ov", label: "Overview" }, { key: "at", label: "Attendance" }, { key: "fe", label: "Fees", count: 2 }], activeTab: "ov", onTab: function () {}, openFull: { href: "#full" }, onStep: function (n) { idx = Math.max(0, idx + n); show(); } });
      show();
    } }))));
    out.push(demo("modal — confirm, danger, type to confirm", row(
      B({ label: "Publish results", variant: "secondary", onClick: function () { OL.ui.modal.confirm({ title: "Publish results?", text: "Families will see Half-yearly results for Class X.", confirmLabel: "Publish results" }).then(function (y) { OL.ui.toast.show({ text: y ? "Published" : "Cancelled", tone: y ? "success" : "info" }); }); } }),
      B({ label: "Delete 12 entries", variant: "danger", onClick: function () { OL.ui.modal.confirm({ title: "Delete 12 timetable entries?", text: "This cannot be undone.", confirmLabel: "Delete 12 entries", danger: true }); } }),
      B({ label: "Send to all families", variant: "secondary", onClick: function () { OL.ui.modal.confirm({ title: "Send to 1,801 families?", text: "This message goes by WhatsApp, with SMS as the fallback.", confirmLabel: "Send message", typeToConfirm: "SEND" }); } }))));
    out.push(demo("toast — bottom-left, 5 s, 10 s with Undo, max 3", row(
      B({ label: "Success", variant: "secondary", onClick: function () { OL.ui.toast.show({ text: "Register saved", tone: "success" }); } }),
      B({ label: "With undo", variant: "secondary", onClick: function () { OL.ui.toast.show({ text: "Holiday deleted", tone: "info", undo: function () { OL.ui.toast.show({ text: "Restored" }); } }); } }),
      B({ label: "Error", variant: "secondary", onClick: function () { OL.ui.toast.show({ text: "Could not save. Try again.", tone: "error" }); } }))));
    out.push(demo("breadcrumb: trail, and from a filtered list", h("div", { class: "gl-stack" }, OL.ui.breadcrumb.render({ items: [{ label: "Students", href: "#" }, { label: "Directory", href: "#" }, { label: "Asha Verma" }] }), OL.ui.breadcrumb.render({ back: { label: "Directory (X-C, Absent)", href: "#" }, items: [{ label: "Students", href: "#" }, { label: "Directory", href: "#" }, { label: "Asha Verma" }] }))));
    out.push(demo("menu", row(B({ label: "Actions", variant: "secondary", iconAfter: "chevron-down", onClick: function (e, el) { OL.ui.menu.open({ anchor: el, items: [{ label: "Export CSV", icon: "download" }, { label: "Print", icon: "printer" }, { sep: true }, { label: "Delete", icon: "trash", danger: true }, { label: "Locked", disabled: true }] }); } }))));
    return section("overlays", "Drawer, modal, toast, menu, breadcrumb", "C-15 · C-16 · C-17 · C-22", "Esc closes the top layer only; focus is trapped and handed back; the page behind is inert. No centred popups for records or forms.", out);
  }

  /* ----------------------------------------------------------------- the page */
  function render(host) {
    SECTIONS_DEF.length = 0;
    var main = h("main", { class: "gl-main", id: "main" }, foundations(), buttons(), inputs(), selects(), pickers(), dates(), chipsSection(), tables(), grids(), surfaces(), overlays());
    var nav = h("nav", { class: "gl-nav", "aria-label": "Components" }, SECTIONS_DEF.map(function (s) { return h("a", { href: "#" + s.id, text: s.title }); }));
    OL.clear(host);
    host.appendChild(h("a", { class: "gl-skip", href: "#main", text: "Skip to components" }));
    host.appendChild(h("div", { class: "gl-shell" }, nav, main));
  }

  /* The bar across the top: theme, density, language, country. Each is applied at once and the
     page is drawn again, so every component is seen in every combination. The choice is kept in
     the address (?theme=dark&density=dense&lang=hi-IN&region=US) so a test can open it directly. */
  function mount(host) {
    var q = new URLSearchParams(location.search);
    var state = { theme: q.get("theme") || "light", density: q.get("density") || "standard", lang: q.get("lang") || "en-IN", region: q.get("region") || "IN" };
    var body = h("div", { id: "gl-body" });
    function apply() {
      var root = document.documentElement;
      root.setAttribute("data-theme", state.theme); root.setAttribute("data-density", state.density);
      OL.fmt.config({ region: state.region });
      OL.i18n.use(state.lang, function () { render(body); });
    }
    function seg(label, key, items) {
      return OL.ui.segmented.render({ label: label, items: items, value: state[key], onChange: function (v) { state[key] = v; apply(); } });
    }
    var bar = h("header", { class: "gl-bar" }, h("strong", { class: "gl-bar__t", text: "Oplo Learn components" }),
      seg("Theme", "theme", [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "auto", label: "Auto" }, { value: "hc", label: "High contrast" }]),
      seg("Density", "density", [{ value: "comfortable", label: "Comfortable" }, { value: "standard", label: "Standard" }, { value: "dense", label: "Dense" }]),
      seg("Language", "lang", [{ value: "en-IN", label: "English" }, { value: "hi-IN", label: "हिन्दी" }]),
      seg("Country", "region", [{ value: "IN", label: "India" }, { value: "US", label: "US school" }]));
    OL.clear(host); host.appendChild(bar); host.appendChild(body);
    apply();
  }

  OL.pages.gallery = { render: render, mount: mount, data: { STUDENTS: STUDENTS, CLASSES: CLASSES, SECTIONS: SECTIONS } };
})();
