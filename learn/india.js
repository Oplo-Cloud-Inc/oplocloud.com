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
  function classes(v) {
    var P = K.cxPage(v, "India", "Classes",
      "Each class of the school year with its class teacher, room and strength. Open one to see its children and what is still missing for each.");
    P.tools.appendChild(K.cnAction("Load from a file", function () { loader(function () { K.openAdmin(true, "in-classes"); }); }));
    P.tools.appendChild(K.cnAction("New class", function () { classForm(null, function () { K.openAdmin(true, "in-classes"); }); }, true));
    var slot = el("div", "en-slot");
    v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Loading classes…"));
    IN.classes().then(function (r) {
      slot.innerHTML = "";
      if (!r.classes.length) {
        slot.appendChild(K.cnEmpty("No classes yet.", "Make a class such as X-C, or load the school's classes and children from a file.", "New class", function () { classForm(null, function () { K.openAdmin(true, "in-classes"); }); }));
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
          function () { roll(c); }, c.id);
      });
      slot.appendChild(t);
    }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, "in-classes"); }); });
  }

  function classForm(pre, done) {
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
                     room: room.value() || null, capacity: cap.value() ? Number(cap.value()) : null };
        if (teacher.get()) body.classTeacherId = teacher.get().id; else if (!teacher.typed()) body.classTeacherId = null;
        return IN.putClass(body).then(function () { toast("Saved."); done(); });
      }
    });
  }

  /* The children of one class, and what each still lacks. */
  function roll(c) {
    var ctl = dialog({
      title: "Class " + c.label,
      sub: (c.classTeacher ? "Class teacher: " + c.classTeacher.name + ". " : "") + (c.room ? "Room " + c.room + ". " : "") + plural(c.strength, "child", "children") + ".",
      wide: true,
      body: function (h) {
        var slot = el("div", "en-slot");
        h.appendChild(slot);
        slot.appendChild(el("div", "admin-loading", "Loading the class…"));
        IN.students(c.id).then(function (r) {
          slot.innerHTML = "";
          if (!r.students.length) { slot.appendChild(K.cnEmpty("Nobody in this class yet.", "Children come in from a file, or open a child and give them this class.")); return; }
          var t = K.cnTable([{ label: "Roll", w: "52px" }, { label: "Name", w: "minmax(150px, 1.3fr)" }, { label: "Admission no", w: "130px" }, { label: "House", w: "80px" },
            { label: "APAAR", w: "130px" }, { label: "Consent", w: "100px" }, { label: "Needs", w: "90px" }]);
          r.students.forEach(function (s) {
            var blocks = s.problems.filter(function (p) { return p.level === "blocks"; }).length, fixes = s.problems.length - blocks;
            t.row([s.rollNo ? esc(s.rollNo) : none(), "<b>" + esc(s.name) + "</b>", s.admissionNo ? esc(s.admissionNo) : none(), s.house ? esc(s.house) : none(),
                   apaarCell(s.apaar), consentCell(s.consentStatus),
                   blocks ? "<span class='en-late'>" + blocks + " to add</span>" : fixes ? esc(fixes + " to fix") : "<span class='cn-none'>Complete</span>"],
              function () { studentForm(s.id, function () { ctl.close(); roll(c); }); }, s.id);
          });
          slot.appendChild(t);
        }, function (e) { K.failed(slot, e); });
      }
    });
    ctl.acts.insertBefore(btn("Edit class", "quiet", function () { ctl.close(); classForm(c, function () { K.openAdmin(true, "in-classes"); }); }), ctl.acts.firstChild);
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

      var order = [["In school", ["classId", "rollNo", "admissionNo", "admittedOn", "house", "secondLanguage", "transport"]],
        ["About the child", ["gender", "dob", "category", "bloodGroup", "address", "pin", "district", "state"]],
        ["Numbers", ["apaar", "pen", "aadhaar"]], ["Parental consent", ["consentStatus", "consentMethod", "consentOn", "consentNote"]],
        ["Family", ["fatherName", "fatherPhone", "motherName", "motherPhone", "primaryContact", "whatsapp", "language", "guardianEmail"]]];
      dialog({
        title: s.name, sub: (s.classLabel ? "Class " + s.classLabel + ". " : "") + "Only the office can see this page.", wide: true, action: "Save",
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
    }, function (e) { toast(e && e.message ? e.message : "That did not load."); });
  }

  /* ========================================================= Compliance */
  var LEVEL = "blocks";
  function compliance(v) {
    var P = K.cxPage(v, "India", "Compliance",
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

  return { classes: classes, compliance: compliance };
};
