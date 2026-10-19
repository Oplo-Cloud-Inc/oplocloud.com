/* ==========================================================================
   OEdu — India.

   What an Indian school's office keeps and is asked for: its classes (X-C,
   with a class teacher and a room), the identity numbers a board and the state
   ask for, the parental consent the law asks for, and a file that loads them
   for a whole school at once.

     classes      the school year's classes and, in each, the children
     compliance   what is on file, what is missing, what blocks a list, and
                  the lists themselves as downloads
     load         a CSV, checked before a single row is written

   The numbers and the rules are the server's (api/src/services/india.js);
   this file draws what it returns. Dates are written DD/MM/YYYY.

   Mounted by app.js with the console kit: OPLO_INDIA(kit) → { classes,
   compliance }.
   ========================================================================== */
window.OPLO_INDIA = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, toast = K.toast, IN = API.india;

  /* ----------------------------------------------------------- Pieces */
  function dmy(ymd) {
    var p = String(ymd || "").split("-");
    return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : "";
  }
  function num(v) { return Number(v).toLocaleString("en-IN"); }
  function plural(n, a, b) { return num(n) + " " + (n === 1 ? a : b || a + "s"); }
  function none() { return "<span class='cn-none'>—</span>"; }
  function chip(tone, label) { return "<span class='en-st en-" + tone + "'><i></i>" + esc(label) + "</span>"; }
  function btn(label, cls, go) {
    var b = el("button", "en-btn" + (cls ? " " + cls : ""), esc(label));
    b.type = "button";
    if (go) b.addEventListener("click", go);
    return b;
  }
  function pct(v) { return v == null ? "—" : v + "%"; }

  function apaarCell(v) {
    return v === "REFUSED" ? chip("muted", "Refused") : v === "NOGEN" ? chip("muted", "Not generated") : v ? esc(v) : "<span class='cn-none'>Pending</span>";
  }
  function consentCell(v) {
    return v === "verified" ? chip("green", "Verified") : v === "withdrawn" ? chip("muted", "Withdrawn") : chip("orange", "Pending");
  }

  /* A sheet with a body and one decision. Its buttons are .en-btn on purpose:
     the console's sheet closes on any .cn-btn pressed inside it. */
  function dialog(o) {
    var box = el("div", "en-dlg" + (o.wide ? " en-wide" : ""));
    box.appendChild(el("h2", "en-dlg-h", esc(o.title)));
    if (o.sub) box.appendChild(el("p", "en-dlg-sub", esc(o.sub)));
    var host = el("div", "en-dlg-body");
    box.appendChild(host);
    var err = el("div", "en-dlg-err");
    err.hidden = true;
    box.appendChild(err);
    var acts = el("div", "en-dlg-acts");
    var sheet = null;
    var ctl = { close: function () { if (sheet) sheet.close(); }, error: function (m) { err.hidden = !m; err.textContent = m || ""; }, host: host, acts: acts };
    acts.appendChild(btn(o.action ? "Cancel" : "Close", "quiet", ctl.close));
    if (o.action) {
      var go = btn(o.action, "strong", function () {
        ctl.error("");
        go.disabled = true;
        var out;
        try { out = o.onSubmit(ctl); } catch (e) { go.disabled = false; ctl.error(e.message); return; }
        Promise.resolve(out).then(function () { ctl.close(); }, function (e) { go.disabled = false; ctl.error(e && e.message ? e.message : "That did not work."); });
      });
      acts.appendChild(go);
    }
    box.appendChild(acts);
    sheet = K.cxSheet(box);
    if (o.body) o.body(host, ctl);
    return ctl;
  }

  function fld(kind, label, value, o) {
    o = o || {};
    var w = el("label", "admin-field en-f");
    w.appendChild(el("span", null, esc(label) + (o.req ? " <i class='en-req'>*</i>" : "")));
    var i;
    if (kind === "select") {
      i = el("select");
      (o.options || []).forEach(function (x) { var op = el("option"); op.value = x[0]; op.textContent = x[1]; i.appendChild(op); });
    } else if (kind === "area") { i = el("textarea"); i.rows = o.rows || 3; }
    else { i = el("input"); i.type = kind === "date" ? "date" : "text"; }
    i.value = value == null ? "" : value;
    if (o.hint) i.placeholder = o.hint;
    if (o.max) i.maxLength = o.max;
    w.appendChild(i);
    if (o.note) w.appendChild(el("small", "en-fnote", esc(o.note)));
    return { node: w, input: i, value: function () { return i.value.trim(); } };
  }

  /* People the school has: a few letters, a short list, a pick. */
  var PEOPLE = null;
  function people() {
    if (PEOPLE) return Promise.resolve(PEOPLE);
    return API.accounts.list(K.S.me.orgId).then(function (l) { PEOPLE = l || []; return PEOPLE; }, function () { return []; });
  }
  function teacherPicker(pre) {
    var chosen = pre || null;
    var wrap = el("div", "en-f care-pick");
    var lab = el("label", "admin-field");
    lab.appendChild(el("span", null, "Class teacher"));
    var inp = el("input");
    inp.type = "search"; inp.placeholder = "Start typing a name"; inp.value = pre ? pre.name : "";
    lab.appendChild(inp); wrap.appendChild(lab);
    var list = el("div", "care-pick-list");
    wrap.appendChild(list);
    inp.addEventListener("input", function () {
      if (!inp.value.trim()) chosen = null;
      var t = inp.value.trim().toLowerCase();
      list.innerHTML = "";
      if (t.length < 2) return;
      people().then(function (all) {
        all.filter(function (p) { return (p.name || "").toLowerCase().indexOf(t) > -1 && p.status !== "suspended"; }).slice(0, 6).forEach(function (p) {
          var b = el("button", "care-pick-i", esc(p.name) + (p.title ? " <small>" + esc(p.title) + "</small>" : ""));
          b.type = "button";
          b.addEventListener("click", function () { chosen = p; inp.value = p.name; list.innerHTML = ""; });
          list.appendChild(b);
        });
      });
    });
    return { node: wrap, get: function () { return chosen; }, typed: function () { return inp.value.trim(); } };
  }

  /* ============================================================ Classes */
  var YEAR = null;                       // the school year on show; null is this year
  function shiftYear(y, by) { var a = +String(y).slice(0, 4) + by; return a + "-" + (a + 1); }
  function classes(v) {
    var P = K.cxPage(v, "Students", "Classes",
      "Each class and section of the school year (X-C is Class X, section C) with its class teacher, room and strength. Open one to see its children and what is still missing for each.");
    P.tools.appendChild(K.cnAction("Load from a file", function () { loader(function () { K.openAdmin(true, "in-classes"); }); }));
    var yearBar = el("div", "en-years");
    v.appendChild(yearBar);
    var slot = el("div", "en-slot");
    v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Loading classes…"));
    IN.classes(YEAR).then(function (r) {
      slot.innerHTML = "";
      var here = r.year;
      P.tools.appendChild(K.cnAction("New class", function () { classForm(null, function () { K.openAdmin(true, "in-classes"); }, here); }, true));
      var yrs = [shiftYear(here, -1), here, shiftYear(here, 1)];
      var chips = K.cnFilters(yrs.map(function (y) { return { k: y, name: y.replace(/(\d{4})-\d{2}(\d{2})/, "$1–$2") }; }), here, function (k) { YEAR = k; K.openAdmin(true, "in-classes"); });
      yearBar.appendChild(chips);
      if (!r.classes.length) {
        slot.appendChild(K.cnEmpty("No classes in this school year.", "Make a class such as X-C, or load the school's classes and children from a file.", "New class", function () { classForm(null, function () { K.openAdmin(true, "in-classes"); }, here); }));
        return;
      }
      var total = r.classes.reduce(function (a, c) { return a + c.strength; }, 0);
      slot.appendChild(el("p", "en-note", esc(plural(r.classes.length, "class", "classes") + " in " + r.year.replace("-", "–").replace(/(\d{4})–\d{2}(\d{2})/, "$1–$2") + ", " + plural(total, "child", "children") + " on file.")));
      var t = K.cnTable([{ label: "Class", w: "90px" }, { label: "Programme", w: "minmax(150px, 1.2fr)" }, { label: "Class teacher", w: "minmax(150px, 1.2fr)" },
        { label: "Room", w: "80px" }, { label: "Children", w: "100px" }]);
      r.classes.forEach(function (c) {
        var full = c.capacity && c.strength > c.capacity;
        t.row(["<b>" + esc(c.label) + "</b>", c.programme ? esc(c.programme) + (c.stream ? "<span class='cn-sub2'>" + esc(c.stream) + "</span>" : "") : none(),
               c.classTeacher ? esc(c.classTeacher.name) : "<span class='cn-none'>Not set</span>", c.room ? esc(c.room) : none(),
               "<span" + (full ? " class='en-late'" : "") + ">" + num(c.strength) + (c.capacity ? " of " + num(c.capacity) : "") + "</span>"],
          function () { roll(c, r); }, c.id);
      });
      slot.appendChild(t);
    }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, "in-classes"); }); });
  }

  function classForm(pre, done, year) {
    var grade = fld("text", "Class", pre ? pre.grade : "", { req: true, hint: "X, IX, KG, LKG…", max: 20 });
    var section = fld("text", "Section", pre ? pre.section : "", { req: true, hint: "A", max: 3 });
    var programme = fld("text", "Programme", pre ? pre.programme : "", { hint: "ICSE, ISC / IB Diploma…", max: 80 });
    var stream = fld("text", "Stream", pre ? pre.stream : "", { hint: "Science (PCM), Commerce…", max: 80 });
    var room = fld("text", "Room", pre ? pre.room : "", { max: 40 });
    var cap = fld("text", "Capacity", pre && pre.capacity != null ? pre.capacity : "", { hint: "30", max: 3 });
    var teacher = teacherPicker(pre && pre.classTeacher);
    dialog({
      title: pre ? "Class " + pre.label : "New class", sub: "A class is where a child sits all day and is marked in the register.", wide: true, action: "Save",
      body: function (h) {
        var g = el("div", "en-form-grid");
        [grade, section, programme, stream, room, cap].forEach(function (f) { g.appendChild(f.node); });
        if (pre) { grade.input.disabled = true; section.input.disabled = true; }
        h.appendChild(g); h.appendChild(teacher.node);
      },
      onSubmit: function () {
        var missing = [];
        if (!grade.value()) missing.push("the class");
        if (!section.value()) missing.push("the section");
        if (missing.length) throw new Error("Still needed: " + missing.join(" and ") + ".");
        if (teacher.typed() && !teacher.get() && !(pre && pre.classTeacher)) throw new Error("Choose the class teacher from the list.");
        var body = { grade: grade.value(), section: section.value(), programme: programme.value() || null, stream: stream.value() || null,
                     year: pre ? pre.year : year || undefined,
                     room: room.value() || null, capacity: cap.value() ? Number(cap.value()) : null };
        if (teacher.get()) body.classTeacherId = teacher.get().id; else if (!teacher.typed()) body.classTeacherId = null;
        return IN.putClass(body).then(function () { toast("Saved."); done(); });
      }
    });
  }

  /* The children of one section: who sits in it, their roll numbers, and what each still lacks. */
  function roll(c, all) {
    var ctl = dialog({
      title: "Class " + c.label + (c.year ? " · " + c.year.replace(/(\d{4})-\d{2}(\d{2})/, "$1–$2") : ""),
      sub: (c.classTeacher ? "Class teacher: " + c.classTeacher.name + ". " : "") + (c.room ? "Room " + c.room + ". " : "") + plural(c.strength, "child", "children") + ".",
      wide: true,
      body: function (h) {
        var slot = el("div", "en-slot");
        h.appendChild(slot);
        slot.appendChild(el("div", "admin-loading", "Loading the class…"));
        IN.students(c.id).then(function (r) {
          slot.innerHTML = "";
          if (!r.students.length) { slot.appendChild(K.cnEmpty("Nobody in this class yet.", "Add children the school has, load them from a file, or move up a class from last year.")); return; }
          var t = K.cnTable([{ label: "Roll", w: "52px" }, { label: "Name", w: "minmax(150px, 1.3fr)" }, { label: "Admission no", w: "130px" }, { label: "House", w: "80px" },
            { label: "Category", w: "84px" }, { label: "APAAR", w: "130px" }, { label: "Consent", w: "100px" }, { label: "Needs", w: "90px" }]);
          r.students.forEach(function (s) {
            var blocks = s.problems.filter(function (p) { return p.level === "blocks"; }).length, fixes = s.problems.length - blocks;
            t.row([s.rollNo ? esc(s.rollNo) : none(), "<b>" + esc(s.name) + "</b>" + (s.cwsn === 1 ? "<span class='cn-sub2'>Special needs</span>" : ""), s.admissionNo ? esc(s.admissionNo) : none(), s.house ? esc(s.house) : none(),
                   s.category ? esc(s.category) : none(), apaarCell(s.apaar), consentCell(s.consentStatus),
                   blocks ? "<span class='en-late'>" + blocks + " to add</span>" : fixes ? esc(fixes + " to fix") : "<span class='cn-none'>Complete</span>"],
              function () { studentForm(s.id, function () { ctl.close(); roll(c, all); }); }, s.id);
          });
          slot.appendChild(t);
        }, function (e) { K.failed(slot, e); });
      }
    });
    var again = function () { K.openAdmin(true, "in-classes"); };
    ctl.acts.insertBefore(btn("Promote…", "quiet", function () { ctl.close(); promoteDialog(c, all, again); }), ctl.acts.firstChild);
    ctl.acts.insertBefore(btn("Number the rolls A–Z", "quiet", function () {
      IN.numberRolls(c.id, "name").then(function (r) { toast(plural(r.numbered, "child", "children") + " numbered, alphabetically."); ctl.close(); roll(c, all); }, function (e) { toast(e.message); });
    }), ctl.acts.firstChild);
    ctl.acts.insertBefore(btn("Add children", "quiet", function () { ctl.close(); seatDialog(c, again); }), ctl.acts.firstChild);
    ctl.acts.insertBefore(btn("Edit class", "quiet", function () { ctl.close(); classForm(c, again); }), ctl.acts.firstChild);
  }

  /* Seat children the school has but has not yet put in a section. */
  function seatDialog(c, done) {
    var picked = {};
    dialog({
      title: "Add children to " + c.label, sub: "Children the school has who sit in no section yet.", wide: true, action: "Add",
      body: function (h) {
        var slot = el("div", "en-slot");
        h.appendChild(slot);
        slot.appendChild(el("div", "admin-loading", "Loading…"));
        IN.unplaced().then(function (r) {
          slot.innerHTML = "";
          if (!r.students.length) { slot.appendChild(K.cnEmpty("Everyone is seated.", "Every child the school has is already in a section.")); return; }
          var box = el("div", "en-pick");
          r.students.forEach(function (s) {
            var lab = el("label", "en-pickrow"), cb = el("input");
            cb.type = "checkbox";
            cb.addEventListener("change", function () { if (cb.checked) picked[s.id] = 1; else delete picked[s.id]; });
            lab.appendChild(cb);
            lab.appendChild(el("span", null, esc(s.name)));
            box.appendChild(lab);
          });
          slot.appendChild(box);
        }, function (e) { K.failed(slot, e); });
      },
      onSubmit: function () {
        var ids = Object.keys(picked);
        if (!ids.length) throw new Error("Tick at least one child.");
        return IN.seat(c.id, ids).then(function (r) { toast(plural(r.seated, "child", "children") + " added to " + c.label + "."); done(); });
      }
    });
  }

  /* The year turns: move a whole section into one of the next year. */
  function promoteDialog(c, all, done) {
    var nextYear = shiftYear(c.year || all.year, 1);
    var pick = fld("select", "Move them to", "", { options: [["", "Loading…"]] });
    var order = fld("select", "Roll numbers", "name", { options: [["name", "Number them again, A–Z"], ["none", "Leave them to be numbered later"]] });
    dialog({
      title: "Promote " + c.label, sub: "Everyone in " + c.label + " moves to a section of " + nextYear.replace(/(\d{4})-\d{2}(\d{2})/, "$1–$2") + ". " + c.label + " stays on each child's record as last year's section.", wide: true, action: "Promote",
      body: function (h) {
        var g = el("div", "en-form-grid");
        g.appendChild(pick.node); g.appendChild(order.node);
        h.appendChild(g);
        IN.classes(nextYear).then(function (r) {
          pick.input.innerHTML = "";
          if (!r.classes.length) { var op = el("option"); op.value = ""; op.textContent = "No sections in " + nextYear + " yet"; pick.input.appendChild(op); h.appendChild(el("p", "en-note", "Make next year's section first: Classes, then the next school year, then New class.")); return; }
          var op0 = el("option"); op0.value = ""; op0.textContent = "Choose a section"; pick.input.appendChild(op0);
          r.classes.forEach(function (x) { var op = el("option"); op.value = x.id; op.textContent = x.label + (x.programme ? " · " + x.programme : "") + " (" + plural(x.strength, "child", "children") + " now)"; pick.input.appendChild(op); });
        }, function (e) { h.appendChild(el("p", "en-note", esc(e.message))); });
      },
      onSubmit: function () {
        if (!pick.value()) throw new Error("Choose the section they move to.");
        return IN.promote(c.id, { toClassId: pick.value(), rolls: order.value() }).then(function (r) { toast(plural(r.moved, "child", "children") + " moved to " + r.to + "."); done(); });
      }
    });
  }

  /* One child's India details. */
  var GENDERS = [["", "—"], ["F", "Female"], ["M", "Male"], ["O", "Other"]];
  var CATEGORIES = [["", "—"], ["General", "General"], ["EWS/DG", "EWS / DG"], ["SC", "SC"], ["ST", "ST"], ["OBC", "OBC"]];
  var BLOOD = [["", "—"]].concat(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(function (b) { return [b, b]; }));
  var CONSENT = [["pending", "Pending"], ["verified", "Verified"], ["withdrawn", "Withdrawn"]];
  var METHODS = [["", "—"], ["signed_form", "Signed form"], ["digilocker", "DigiLocker"], ["other", "Other"]];
  var CONTACTS = [["", "—"], ["Father", "Father"], ["Mother", "Mother"], ["Guardian", "Guardian"]];
  var YESNO = [["", "Not asked"], ["1", "Opted in"], ["0", "Not opted in"]];

  function studentForm(id, done) {
    Promise.all([IN.student(id), IN.classes()]).then(function (res) {
      var s = res[0].student, cl = res[1].classes;
      var F = {};
      function add(key, kind, label, o) { F[key] = fld(kind, label, s[key] == null ? "" : s[key], o); return F[key]; }
      F.classId = fld("select", "Class", s.classId || "", { options: [["", "No class"]].concat(cl.map(function (c) { return [c.id, c.label]; })) });
      add("rollNo", "text", "Roll number", { max: 3 }); add("admissionNo", "text", "Admission number", { max: 40 }); add("admittedOn", "date", "Admitted on");
      add("house", "text", "House", { max: 40 }); add("secondLanguage", "text", "Second language", { max: 60 }); add("transport", "text", "Transport", { hint: "Own / pickup, or a route", max: 60 });
      add("gender", "select", "Gender", { options: GENDERS }); F.dob = fld("date", "Date of birth", s.dob || ""); add("category", "select", "Category", { options: CATEGORIES });
      add("bloodGroup", "select", "Blood group", { options: BLOOD });
      F.address = fld("text", "Address", s.address || "", { max: 400 }); add("pin", "text", "PIN code", { max: 7 }); add("district", "text", "District", { max: 60 }); add("state", "text", "State", { max: 60 });
      add("apaar", "text", "APAAR ID", { hint: "12 digits, REFUSED or NOGEN", note: "Leave empty while it is pending." });
      add("pen", "text", "PEN", { hint: "11 digits" });
      F.aadhaar = fld("text", "Aadhaar", "", { hint: s.aadhaar ? "On file: " + s.aadhaar : "Not on file", note: "Never required. Only the last four digits are kept; type REFUSED if the family declines. Leave empty to change nothing." });
      add("consentStatus", "select", "Parental consent", { options: CONSENT }); add("consentMethod", "select", "Given by", { options: METHODS });
      add("consentOn", "date", "Consent date"); add("consentNote", "text", "Note", { hint: "For example: analytics only", max: 120 });
      add("fatherName", "text", "Father's name", { max: 120 }); add("fatherPhone", "text", "Father's mobile", { hint: "+91 98765 43210" });
      add("motherName", "text", "Mother's name", { max: 120 }); add("motherPhone", "text", "Mother's mobile", { hint: "+91 98765 43210" });
      add("primaryContact", "select", "Primary contact", { options: CONTACTS });
      F.whatsapp = fld("select", "WhatsApp", s.whatsapp == null ? "" : String(s.whatsapp), { options: YESNO });
      add("language", "text", "Family's language", { max: 60 }); add("guardianEmail", "text", "Family email", { max: 200 });
      add("guardianName", "text", "Guardian's name", { max: 120, note: "Only when the guardian is neither parent." }); add("guardianPhone", "text", "Guardian's mobile", { hint: "+91 98765 43210" });
      add("guardianRelation", "text", "Guardian is the child's", { hint: "Aunt, grandfather…", max: 60 });
      F.cwsn = fld("select", "Child with special needs", s.cwsn == null ? "" : String(s.cwsn), { options: [["", "Not asked"], ["1", "Yes"], ["0", "No"]] });
      add("disability", "text", "Kind of disability", { max: 120 }); add("udid", "text", "Disability ID (UDID)", { max: 40 });
      F.migrant = fld("select", "Migrant family", s.migrant == null ? "" : String(s.migrant), { options: [["", "Not asked"], ["1", "Yes"], ["0", "No"]] });
      add("motherTongue", "text", "Mother tongue", { max: 60 }); add("boardRollNo", "text", "Board roll number", { max: 30, note: "The board's number for Class X or XII, not the school's roll." });
      add("previousSchool", "text", "Previous school", { max: 120 });

      var order = [["In school", ["classId", "rollNo", "admissionNo", "admittedOn", "house", "secondLanguage", "transport"]],
        ["About the child", ["gender", "dob", "category", "bloodGroup", "address", "pin", "district", "state"]],
        ["Numbers", ["apaar", "pen", "aadhaar"]], ["Parental consent", ["consentStatus", "consentMethod", "consentOn", "consentNote"]],
        ["Family", ["fatherName", "fatherPhone", "motherName", "motherPhone", "guardianName", "guardianRelation", "guardianPhone", "primaryContact", "whatsapp", "language", "guardianEmail"]],
        ["Needs and background", ["cwsn", "disability", "udid", "migrant", "motherTongue", "boardRollNo", "previousSchool"]]];
      var ctl = dialog({
        title: s.name, sub: (s.classLabel ? "Class " + s.classLabel + ". " : "") + (s.leftOn ? "Left the school on " + dmy(s.leftOn) + ". " : "") + "Only the office can see this page.", wide: true, action: "Save",
        body: function (h) {
          var pr = res[0].problems || [];
          if (pr.length) h.appendChild(el("p", "en-note", pr.map(function (p) { return esc(p.message); }).join(" ")));
          order.forEach(function (sec) {
            h.appendChild(el("h3", "en-h3", esc(sec[0])));
            var g = el("div", "en-form-grid");
            sec[1].forEach(function (k) { g.appendChild(F[k].node); });
            h.appendChild(g);
          });
        },
        onSubmit: function () {
          var body = {};
          Object.keys(F).forEach(function (k) {
            var val = F[k].value();
            if (k === "aadhaar" && !val) return;
            body[k] = val === "" ? null : val;
          });
          if (!body.classId) body.classId = null;
          return IN.putStudent(id, body).then(function () { toast("Saved."); done(); });
        }
      });
      ctl.acts.insertBefore(btn("Leaves the school", "quiet", function () { ctl.close(); leaveDialog(s, done); }), ctl.acts.firstChild);
      IN.classHistory(id).then(function (r) {
        if (r.classes.length > 1 || (r.classes[0] && r.classes[0].leftOn)) ctl.host.insertBefore(el("p", "en-note", "Sections so far: " + r.classes.map(function (x) { return esc(x.label) + " (" + esc(x.year.replace(/(\d{4})-\d{2}(\d{2})/, "$1–$2")) + (x.rollNo ? ", roll " + esc(x.rollNo) : "") + ")"; }).join(", ") + "."), ctl.host.firstChild);
      }, function () { /* the history is a courtesy */ });
    }, function (e) { toast(e && e.message ? e.message : "That did not load."); });
  }

  function leaveDialog(s, done) {
    var on = fld("date", "Left on", new Date().toISOString().slice(0, 10));
    var why = fld("text", "Why", "", { max: 200, hint: "Moved to another city, transfer, passed out…" });
    dialog({
      title: s.name + " leaves the school", sub: "They come out of their section and the register. Everything the school holds about them stays on record.", action: "Record",
      body: function (h) { var g = el("div", "en-form-grid"); g.appendChild(on.node); g.appendChild(why.node); h.appendChild(g); },
      onSubmit: function () {
        return IN.leave(s.id, { on: on.value() || undefined, reason: why.value() || undefined }).then(function (r) { toast("Recorded: left on " + dmy(r.on) + "."); done(); });
      }
    });
  }

  /* ========================================================= Certificates
     The document itself: a transfer certificate in the form schools use, a bonafide,
     a character certificate. It is made from the child's record alone; nothing
     on it, and nothing needed to issue it, is about money. */
  var ORD = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth", "Twentieth",
    "Twenty-first", "Twenty-second", "Twenty-third", "Twenty-fourth", "Twenty-fifth", "Twenty-sixth", "Twenty-seventh", "Twenty-eighth", "Twenty-ninth", "Thirtieth", "Thirty-first"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var TO19 = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  var TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function below100(n) { return n < 20 ? TO19[n] : TENS[Math.floor(n / 10)] + (n % 10 ? "-" + TO19[n % 10] : ""); }
  function yearWords(y) {
    if (y >= 2000 && y < 2100) return "Two Thousand" + (y % 100 ? " " + below100(y % 100) : "");
    if (y >= 1900 && y < 2000) return "Nineteen " + (y % 100 ? below100(y % 100) : "Hundred");
    return String(y);
  }
  /* 2010-09-10 → "Tenth September Two Thousand Ten", as a transfer certificate writes a date of birth. */
  function dateWords(ymd) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || "");
    return m ? ORD[+m[3]] + " " + MONTHS[+m[2] - 1] + " " + yearWords(+m[1]) : "";
  }

  function printCertificate(item, draft) {
    var d = item.data || {}, school = K.schoolName ? K.schoolName() : "";
    IN.student(item.subjectId).then(function (r) {
      var s = r.student, kind = d.type || "Certificate";
      var line = function (n, label, value) { return "<tr><td style='width:34px'>" + n + "</td><td style='width:46%'>" + esc(label) + "</td><td>" + (value ? esc(value) : "&nbsp;") + "</td></tr>"; };
      var cls = d.lastClass || s.classLabel || "", pron = s.gender === "F" ? ["daughter", "She", "her"] : s.gender === "M" ? ["son", "He", "his"] : ["child", "The child", "the child’s"];
      var parent = s.fatherName || s.motherName || s.guardianName || "";
      var head = "<div style='text-align:center'><h2 style='margin:0'>" + esc(school) + "</h2><p style='margin:2px 0'>" + esc(kind.toUpperCase()) + "</p>" +
        "<p style='margin:2px 0'>" + (d.number ? "No. " + esc(d.number) : draft ? "DRAFT: not issued" : "") + "</p></div>";
      var body;
      if (kind === "Transfer certificate") {
        body = "<table class='tc'><tbody>" +
          line(1, "Name of the pupil", s.name) + line(2, "Mother’s name", s.motherName) + line(3, "Father’s / guardian’s name", s.fatherName || s.guardianName) +
          line(4, "Date of birth (in figures)", s.dob ? dmy(s.dob) : "") + line("", "Date of birth (in words)", dateWords(s.dob)) +
          line(5, "Admission number and date of admission", [s.admissionNo, s.admittedOn ? dmy(s.admittedOn) : ""].filter(Boolean).join(" · ")) +
          line(6, "Class in which the pupil last studied", cls) + line(7, "Whether qualified for promotion to a higher class", d.promotion ? "Yes, to " + d.promotion : "") +
          line(8, "Date of leaving the school", d.leftOn ? dmy(d.leftOn) : "") + line(9, "Reason for leaving", d.reason) + line(10, "General conduct", d.conduct) +
          line(11, "Remarks", d.note) + "</tbody></table>";
      } else if (kind === "Bonafide certificate") {
        body = "<p style='line-height:1.9;margin-top:24px'>This is to certify that <b>" + esc(s.name) + "</b>, " + pron[0] + " of " + esc(parent) + ", is a bonafide student of this school, studying in Class " + esc(cls) +
          (s.admissionNo ? " (admission number " + esc(s.admissionNo) + ")" : "") + (s.dob ? ". " + pron[1] + " was born on " + esc(dmy(s.dob)) : "") + ".</p>" + (d.purpose ? "<p>This certificate is issued for " + esc(d.purpose) + ".</p>" : "");
      } else if (kind === "Character certificate") {
        body = "<p style='line-height:1.9;margin-top:24px'>This is to certify that <b>" + esc(s.name) + "</b>, " + pron[0] + " of " + esc(parent) + ", " + (d.leftOn ? "studied" : "studies") + " in this school in Class " + esc(cls) +
          ". To the best of our knowledge " + pron[2] + " conduct and character " + (d.leftOn ? "were" : "are") + " <b>" + esc((d.conduct || "good").toLowerCase()) + "</b>.</p>" + (d.purpose ? "<p>Issued for " + esc(d.purpose) + ".</p>" : "");
      } else body = "<p>" + esc(d.note || "") + "</p>";
      var foot = "<p style='margin-top:40px'>Date of issue: " + (d.issuedOn ? esc(dmy(d.issuedOn)) : "______________") + "</p><p style='margin-top:54px'>Prepared by ______________ &nbsp;&nbsp; Checked by ______________ &nbsp;&nbsp; Principal ______________</p>";
      K.cxPrint(kind + " " + s.name, "<style>table.tc{width:100%;border-collapse:collapse;margin-top:16px}table.tc td{border:1px solid #999;padding:7px 9px;font-size:13px}</style>" + head + body + foot);
    }, function (e) { toast(e && e.message ? e.message : "The child’s record did not load."); });
  }

  /* ========================================================= Disclosure
     What the school says about itself in public, and whether it posts its transfer certificates. */
  function disclosureForm(done) {
    IN.disclosure().then(function (r) {
      var d = r.disclosure, g = d.general, F = {};
      [["affiliationNo", "Affiliation number"], ["schoolCode", "School code"], ["affiliatedTo", "Affiliated to"], ["established", "Established"], ["principal", "Principal"], ["principalQualification", "Principal’s qualification"],
       ["phone", "Phone"], ["email", "Email"], ["website", "Website"], ["address", "Address"]].forEach(function (x) { F[x[0]] = fld("text", x[1], g[x[0]] || "", { max: 300 }); });
      var facts = fld("area", "Other facts it states, one a line: Label: value", d.facts.map(function (f) { return f.label + ": " + f.value; }).join("\n"), { rows: 6 });
      var tc = fld("select", "Transfer certificates on the public page", d.publishTc ? "1" : "0", { options: [["0", "Not posted"], ["1", "Posted (only those the office ticks)"]] });
      var link = location.origin + (location.pathname.replace(/\/(admin|teacher|student|parent)\/.*$/, "/").replace(/\/$/, "")) + "/disclosure/?school=" + encodeURIComponent(r.slug);
      dialog({
        title: "Public disclosure", wide: true, action: "Save",
        sub: "What the school publishes about itself. The enrolment and staff numbers on the page are counted from OEdu; a transfer certificate appears only if the school posts them and the office ticked it. Link: " + link,
        body: function (h) {
          var gd = el("div", "en-form-grid");
          Object.keys(F).forEach(function (k) { gd.appendChild(F[k].node); });
          h.appendChild(gd); h.appendChild(facts.node); h.appendChild(tc.node);
        },
        onSubmit: function () {
          var body = { general: {}, facts: [], publishTc: tc.value() === "1" };
          Object.keys(F).forEach(function (k) { body.general[k] = F[k].value() || null; });
          facts.value().split(/\n+/).forEach(function (l) { var i = l.indexOf(":"); if (l.trim() && i > 0) body.facts.push({ label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() }); });
          return IN.putDisclosure(body).then(function () { toast("Saved."); if (done) done(); });
        }
      });
    }, function (e) { toast(e && e.message ? e.message : "The disclosure did not load."); });
  }

  /* ========================================================= Compliance */
  var LEVEL = "blocks";
  function compliance(v) {
    var P = K.cxPage(v, "Reports", "Compliance",
      "What the school holds for boards, the state and the data-protection law, what is missing, and the lists ready to send once it is not. Aadhaar is never kept in full.");
    P.tools.appendChild(K.cnAction("Load from a file", function () { loader(function () { K.openAdmin(true, "in-compliance"); }); }));
    var metrics = el("div"), slot = el("div", "en-slot");
    v.appendChild(metrics); v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Reading the school’s records…"));
    IN.compliance().then(function (r) {
      slot.innerHTML = "";
      var s = r.summary;
      if (!s.students) {
        slot.appendChild(K.cnEmpty("Nothing on file yet.", r.unloaded ? plural(r.unloaded, "student has", "students have") + " no India details. Load them from a file." : "Load the school’s children from a file to see where it stands.", "Load from a file", function () { loader(function () { K.openAdmin(true, "in-compliance"); }); }));
        return;
      }
      K.cxMetrics(metrics, [
        { label: "Children on file", value: num(s.students), note: r.unloaded ? esc(plural(r.unloaded, "more has", "more have")) + " no details yet" : null },
        { label: "APAAR answered", value: s.apaarAnswered == null ? null : s.apaarAnswered, unit: "%", line: s.apaarAnswered,
          note: esc(num(s.apaar.have) + " have · " + num(s.apaar.refused) + " refused · " + num(s.apaar.nogen) + " not generated · " + num(s.apaar.pending) + " pending") },
        { label: "Classes IX–XII answered", value: s.board.percent == null ? null : s.board.percent, unit: "%", line: s.board.percent,
          note: esc(num(s.board.answered) + " of " + num(s.board.students) + " for a board list") },
        { label: "PEN on file", value: num(s.pen.have), note: s.pen.missing ? esc(num(s.pen.missing) + " missing") : "everyone" },
        { label: "Consent verified", value: s.consentVerified == null ? null : s.consentVerified, unit: "%", line: s.consentVerified,
          note: esc(num(s.consent.pending) + " pending · " + num(s.consent.withdrawn) + " withdrawn") },
        { label: "Blocked from a list", value: num(s.blocked), bad: true, note: s.blocked ? "a field a list needs is missing" : "none" }
      ]);

      v.appendChild(el("h3", "cn-h2", "Lists to send"));
      var lists = el("div", "cn-acts");
      [["apaar", "APAAR status"], ["udise", "State student list"], ["consent", "Consent register"], ["register", "Student register"]].forEach(function (x) {
        lists.appendChild(K.cnAction(x[1] + " (CSV)", function () {
          IN.exportKind(x[0]).then(function (d) { K.csvDownload(d.file, [d.columns].concat(d.rows)); }, function (e) { toast(e.message); });
        }));
      });
      v.appendChild(lists);
      v.appendChild(el("p", "en-note", "These are OEdu’s own column order, one row per child. A board’s upload format is matched once its specification is in hand."));

      v.appendChild(el("h3", "cn-h2", "By class"));
      var t = K.cnTable([{ label: "Class", w: "90px" }, { label: "Children", w: "90px" }, { label: "APAAR answered", w: "130px" }, { label: "Consent verified", w: "130px" }, { label: "Blocked", w: "90px" }]);
      s.classes.forEach(function (c) {
        t.row(["<b>" + esc(c.label) + "</b>", num(c.students), pct(c.students ? Math.round(c.apaarAnswered / c.students * 1000) / 10 : null),
               pct(c.students ? Math.round(c.consentVerified / c.students * 1000) / 10 : null), c.blocked ? "<span class='en-late'>" + num(c.blocked) + "</span>" : "<span class='cn-none'>0</span>"]);
      });
      v.appendChild(t);

      v.appendChild(el("h3", "cn-h2", "What is missing"));
      var chips = K.cnFilters([{ k: "blocks", name: "Blocks a list" }, { k: "fix", name: "Should fix" }], LEVEL, function (k) { LEVEL = k; chips.mark(k); paint(); });
      v.appendChild(chips);
      var box = el("div", "en-slot");
      v.appendChild(box);
      function paint() {
        box.innerHTML = "";
        var rows = r.problems.filter(function (p) { return p.items.some(function (i) { return i.level === LEVEL; }); });
        if (!rows.length) { box.appendChild(K.cnEmpty(LEVEL === "blocks" ? "Nothing blocks a list." : "Nothing to fix.", "")); return; }
        var tb = K.cnTable([{ label: "Name", w: "minmax(150px, 1.2fr)" }, { label: "Class", w: "80px" }, { label: "Missing", w: "minmax(220px, 2fr)" }]);
        rows.slice(0, 200).forEach(function (p) {
          tb.row(["<b>" + esc(p.name) + "</b>", p.classLabel ? esc(p.classLabel) : none(),
                  p.items.filter(function (i) { return i.level === LEVEL; }).map(function (i) { return esc(i.message); }).join("<br>")],
            function () { studentForm(p.id, function () { K.openAdmin(true, "in-compliance"); }); }, p.id);
        });
        box.appendChild(tb);
        var total = rows.length;
        if (total > 200 || r.problemStudents > r.problems.length) box.appendChild(el("p", "en-note", "Showing the first " + Math.min(200, total) + ". Fix these and the next appear."));
      }
      paint();
    }, function (e) {
      slot.innerHTML = "";
      if (e && e.status === 403) slot.appendChild(el("p", "en-note", esc(e.message)));
      else K.failed(slot, e, function () { K.openAdmin(true, "in-compliance"); });
    });
  }

  /* ================================================================ Load
     A CSV of the school's children, one row each, matched to the people the
     school already has by email. Checked first; nothing is written until the
     check has been read. */
  var HEAD = {
    email: "email", "class": "class", programme: "programme", stream: "stream", room: "room", capacity: "capacity",
    class_teacher_email: "classTeacherEmail", dob: "dob", date_of_birth: "dob", address: "address", consent: "consent", dpdp_consent: "consent",
    admission_no: "admissionNo", admission_number: "admissionNo", admitted_on: "admittedOn", admission_date: "admittedOn", roll_no: "rollNo", roll: "rollNo",
    gender: "gender", house: "house", category: "category", second_language: "secondLanguage", blood_group: "bloodGroup",
    apaar: "apaar", apaar_id: "apaar", pen: "pen", udise_pen: "pen", aadhaar: "aadhaar", transport: "transport", pin: "pin", pin_code: "pin",
    district: "district", state: "state", father_name: "fatherName", father_phone: "fatherPhone", mother_name: "motherName", mother_phone: "motherPhone",
    primary_contact: "primaryContact", whatsapp: "whatsapp", whatsapp_opt_in: "whatsapp", language: "language", preferred_language: "language",
    guardian_email: "guardianEmail", family_email: "guardianEmail"
  };
  var TEMPLATE = ["email", "class", "programme", "stream", "room", "capacity", "class_teacher_email", "admission_no", "admitted_on", "roll_no", "gender", "dob", "house",
    "category", "second_language", "blood_group", "apaar_id", "pen", "aadhaar", "consent", "transport", "address", "pin", "district", "state", "father_name", "father_phone",
    "mother_name", "mother_phone", "primary_contact", "whatsapp_opt_in", "preferred_language", "guardian_email"];

  function parseCsv(text) {
    var rows = [], row = [], cur = "", inq = false;
    text = String(text).replace(/^﻿/, "");
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      if (inq) { if (c === '"') { if (text.charAt(i + 1) === '"') { cur += '"'; i++; } else inq = false; } else cur += c; }
      else if (c === '"') inq = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text.charAt(i + 1) === "\n") i++;
        row.push(cur); cur = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else cur += c;
    }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }

  function loader(done) {
    var parsed = null;
    var summary = el("div", "en-slot");
    var file = el("input"); file.type = "file"; file.accept = ".csv,text/csv";
    var checked = null;
    var go = null;

    function chunks(rows, check, progress) {
      var out = { rows: 0, matched: 0, ready: 0, written: 0, classesMade: 0, unmatched: [], unmatchedCount: 0, errors: [], errorCount: 0, teachers: [] };
      var chain = Promise.resolve();
      for (var i = 0; i < rows.length; i += 200) (function (off) {
        chain = chain.then(function () {
          progress("Reading rows " + num(off + 1) + " to " + num(Math.min(rows.length, off + 200)) + " of " + num(rows.length) + "…");
          return IN.importRows(rows.slice(off, off + 200), check).then(function (r) {
            out.rows += r.rows; out.matched += r.matched; out.ready += r.ready; out.written += r.written; out.classesMade += r.classesMade;
            out.unmatchedCount += r.unmatchedCount; out.errorCount += r.errorCount;
            r.unmatched.forEach(function (u) { if (out.unmatched.length < 20 && out.unmatched.indexOf(u) < 0) out.unmatched.push(u); });
            r.errors.forEach(function (e) { if (out.errors.length < 100) out.errors.push({ row: e.row + off, email: e.email, message: e.message }); });
            r.teachersNotFound.forEach(function (t) { if (out.teachers.indexOf(t) < 0) out.teachers.push(t); });
          });
        });
      })(i);
      return chain.then(function () { return out; });
    }

    function show(r, wrote) {
      summary.innerHTML = "";
      var lines = [];
      if (wrote) lines.push("<b>" + esc(plural(r.written, "child", "children")) + " loaded</b>" + (r.classesMade ? ", " + esc(plural(r.classesMade, "class", "classes")) + " made" : "") + ".");
      else lines.push("<b>" + esc(plural(r.ready, "row")) + " ready</b> of " + esc(num(r.rows)) + ". " + esc(num(r.matched)) + " matched a person the school has.");
      if (r.unmatchedCount) lines.push(esc(plural(r.unmatchedCount, "row")) + " matched nobody (for example " + esc(r.unmatched.slice(0, 3).join(", ")) + "). Load the people first under Data Center › Imports.");
      if (r.errorCount) lines.push(esc(plural(r.errorCount, "row")) + " have something wrong and are skipped" + (wrote ? "" : " unless you fix them") + ":");
      if (r.teachers.length) lines.push("No class teacher found for " + esc(r.teachers.slice(0, 3).join(", ")) + (r.teachers.length > 3 ? " and others" : "") + ".");
      lines.forEach(function (l) { summary.appendChild(el("p", "en-note", l)); });
      if (r.errors.length) {
        var t = K.cnTable([{ label: "Line", w: "60px" }, { label: "Person", w: "minmax(160px, 1fr)" }, { label: "What is wrong", w: "minmax(220px, 2fr)" }]);
        r.errors.slice(0, 30).forEach(function (e) { t.row([esc(e.row + 1), esc(e.email), esc(e.message)]); });
        summary.appendChild(t);
        if (r.errorCount > 30) summary.appendChild(el("p", "en-note", "…and " + num(r.errorCount - 30) + " more."));
      }
    }

    var ctl = dialog({
      title: "Load children from a file", wide: true,
      sub: "One row per child, matched by email to a person the school already has. Nothing is written until you have read the check.",
      body: function (h) {
        h.appendChild(el("p", "en-note", "Columns: " + esc(TEMPLATE.join(", ")) + ". Dates may be DD/MM/YYYY. A class is written X-C; one that does not exist yet is made. Aadhaar, if given, is cut down to its last four digits."));
        var row = el("div", "cn-acts");
        row.appendChild(btn("Download a blank file", "quiet", function () { K.csvDownload("india-details-template.csv", [TEMPLATE]); }));
        h.appendChild(row);
        h.appendChild(file);
        h.appendChild(summary);
        file.addEventListener("change", function () {
          checked = null; summary.innerHTML = "";
          if (go) go.disabled = true;
          var f = file.files && file.files[0];
          if (!f) return;
          var rd = new FileReader();
          rd.onload = function () {
            var grid = parseCsv(rd.result);
            if (grid.length < 2) { summary.appendChild(el("p", "en-note", "That file has no rows.")); return; }
            var keys = grid[0].map(function (hd) { return HEAD[String(hd).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")] || null; });
            if (keys.indexOf("email") < 0) { summary.appendChild(el("p", "en-note", "The file needs an email column to match each row to a person.")); return; }
            var ignored = grid[0].filter(function (hd, i) { return !keys[i]; });
            parsed = grid.slice(1).map(function (r) {
              var o = {};
              keys.forEach(function (k, i) { if (k && r[i] != null && String(r[i]).trim() !== "") o[k] = String(r[i]).trim(); });
              return o;
            });
            summary.appendChild(el("p", "en-note", esc(plural(parsed.length, "row")) + " read." + (ignored.length ? " Ignored columns: " + esc(ignored.join(", ")) + "." : "")));
            var chk = btn("Check the file", "strong", function () {
              chk.disabled = true;
              var prog = el("p", "en-note"); summary.appendChild(prog);
              chunks(parsed, true, function (m) { prog.textContent = m; }).then(function (r) {
                chk.disabled = false; prog.remove(); checked = r; summary.innerHTML = ""; show(r, false);
                summary.appendChild(chk);
                go.disabled = !r.ready;
              }, function (e) { chk.disabled = false; prog.textContent = e && e.message ? e.message : "The check did not finish."; });
            });
            summary.appendChild(chk);
          };
          rd.readAsText(f);
        });
      },
      action: "Load the checked rows",
      onSubmit: function (c) {
        if (!parsed || !checked) throw new Error("Choose a file and check it first.");
        var prog = el("p", "en-note"); summary.appendChild(prog);
        return chunks(parsed, false, function (m) { prog.textContent = m.replace("Reading", "Loading"); }).then(function (r) {
          toast(plural(r.written, "child", "children") + " loaded.");
          done();
        });
      }
    });
    go = ctl.acts.lastChild;
    go.disabled = true;
  }

  return { classes: classes, compliance: compliance, printCertificate: printCertificate, disclosureForm: disclosureForm, studentForm: studentForm,
           ui: { dialog: dialog, btn: btn, fld: fld, chip: chip, none: none, num: num, plural: plural, dmy: dmy } };
};
