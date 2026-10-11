/* ==========================================================================
   OEdu Family — applications.

   Where a family asks for a place and follows what becomes of the request.
   It is the family's side of the school's Enrollment workflow: the same
   application, the same server rules, none of the school's working papers.

   A family sees where things stand, in plain words, and what is asked of
   it. It never sees how a decision was weighed, who else was a possible
   match, or the school's notes — the server does not send them.

   Built so that stopping is safe. Every step saves, an application is a
   draft until it is sent, and the one thing sending asks for is the
   consent the school's policy requires. Nothing is lost by leaving.

   OPLO_APPLY.open(host, { me, back, toast }) draws into `host`.
   ========================================================================== */
window.OPLO_APPLY = (function () {
  "use strict";

  var API = window.OPLO_API;
  var NS = API.enrollment;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function h(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function btn(label, cls, go) {
    var b = h("button", "fb-btn " + (cls || ""), esc(label));
    b.type = "button";
    if (go) b.addEventListener("click", go);
    return b;
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function day(ymd) {
    if (!ymd) return "";
    var p = String(ymd).split("-");
    return p.length === 3 ? (+p[2]) + " " + MONTHS[+p[1] - 1] + " " + p[0] : String(ymd);
  }
  function yearName(y) { return y && /^\d{4}-\d{4}$/.test(y) ? y.slice(0, 4) + "–" + y.slice(7) : y || ""; }
  function ago(ms) {
    if (!ms) return "";
    var s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    var d = Math.floor(s / 86400);
    return d === 1 ? "yesterday" : d < 30 ? d + " days ago" : day(new Date(ms).toISOString().slice(0, 10));
  }
  function kb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }

  /* What a status means to the person who applied — never the school's own
     words for its queue. */
  var PHASE = {
    draft: ["Not sent yet", "draft"], submitted: ["With the school", "wait"], incomplete: ["Waiting for documents", "ask"],
    under_review: ["Being reviewed", "wait"], changes_requested: ["The school needs something", "ask"],
    awaiting_decision: ["Being reviewed", "wait"], waitlisted: ["On the waiting list", "wait"],
    admitted: ["Offered a place", "good"], rejected: ["Not offered a place", "end"], withdrawn: ["Withdrawn", "end"]
  };

  var ROOT = null, OPTS = {}, DATA = null;

  function toast(m) { if (OPTS.toast) OPTS.toast(m); }

  /* ------------------------------------------------------------- Entry */
  function open(host, opts) {
    ROOT = host;
    OPTS = opts || {};
    ROOT.innerHTML = "";
    var wait = h("p", "fa-wait", "Opening your applications…");
    ROOT.appendChild(wait);
    return load().then(function () { drawList(); }, function (e) {
      ROOT.innerHTML = "";
      var box = h("div", "fa-wrap");
      box.appendChild(head("Applications", "They could not be opened."));
      box.appendChild(h("p", "fa-note", esc(e && e.message ? e.message : "Something went wrong reaching the school.")));
      box.appendChild(btn("Try again", "quiet", function () { open(host, opts); }));
      ROOT.appendChild(box);
    });
  }

  function load() {
    return NS.mine().then(function (r) { DATA = r; return r; });
  }

  function head(title, sub, eyebrow) {
    var f = h("header", "fa-head");
    f.appendChild(h("p", "fh-eyebrow", esc(eyebrow || "OEdu Family · Applications")));
    f.appendChild(h("h1", "fa-title", esc(title)));
    if (sub) f.appendChild(h("p", "fa-sub", esc(sub)));
    return f;
  }

  function fresh(app) {
    for (var i = 0; i < DATA.applications.length; i++) if (DATA.applications[i].id === app.id) { DATA.applications[i] = app; return; }
    DATA.applications.unshift(app);
  }

  /* --------------------------------------------------------------- List */
  function nextWords(a) {
    var ev = a.evaluation || {}, miss = (ev.fields && ev.fields.missing) || [];
    var docsOut = (a.documents || []).filter(function (d) { return d.required && (d.status === "missing" || d.status === "returned"); });
    if (a.enrollmentId) return "Enrolled" + (a.intendedStart ? " — starting " + day(a.intendedStart) : "") + ".";
    switch (a.status) {
      case "draft":
        if (miss.length) return "Finish the details, then send it. Still needed: " + miss.slice(0, 3).map(function (m) { return m.label.toLowerCase(); }).join(", ") + (miss.length > 3 ? "…" : ".");
        if (docsOut.length) return "Ready to send. The school will also need: " + docsOut.slice(0, 3).map(function (d) { return d.label.toLowerCase(); }).join(", ") + ".";
        return "Everything is filled in — review it and send it to the school.";
      case "submitted": return "The school has it and will review it.";
      case "incomplete": return "The school is waiting for: " + docsOut.map(function (d) { return d.label.toLowerCase(); }).join(", ") + ".";
      case "under_review":
      case "awaiting_decision": return "The school is reviewing your application. You will see the answer here.";
      case "changes_requested": return "The school asked for corrections. Make them, then send it back.";
      case "waitlisted": return "You are on the waiting list. The school will be in touch if a place opens.";
      case "admitted":
        return a.acceptance === "pending" ? "You have been offered a place" + (a.offerUntil ? " until " + day(a.offerUntil) : "") + ". Please accept or decline."
          : "You have been admitted. The school will confirm the start day.";
      case "rejected": return "The school was not able to offer a place this time.";
      case "withdrawn": return "This application was withdrawn.";
      default: return "";
    }
  }

  function drawList() {
    ROOT.innerHTML = "";
    var wrap = h("div", "fa-wrap");
    wrap.appendChild(head("Applications", "Apply for a place, and follow what happens to it."));
    var top = h("div", "fa-top");
    top.appendChild(btn("Apply for a place", "lg", function () { drawStart(); }));
    if (OPTS.back) top.appendChild(btn("Back to the record", "quiet lg", OPTS.back));
    wrap.appendChild(top);

    var apps = DATA.applications.slice();
    if (!apps.length) {
      var e = h("div", "fa-empty");
      e.innerHTML = "<b>You have not applied for anything yet.</b><p>Start an application for a child. You can save it and come back to it, and nothing goes to the school until you send it.</p>";
      wrap.appendChild(e);
    }
    apps.forEach(function (a) {
      var card = h("article", "fa-card fa-" + (PHASE[a.status] || ["", "wait"])[1]);
      var phase = a.enrollmentId ? ["Enrolled", "good"] : PHASE[a.status] || [a.status, "wait"];
      var top2 = h("div", "fa-card-top");
      top2.appendChild(h("div", "fa-card-who", "<b>" + esc(a.student.name || "New applicant") + "</b><span>" + esc(a.grade) + " · " + esc(yearName(a.schoolYear)) + "</span>"));
      top2.appendChild(h("span", "fa-pill fa-" + phase[1], esc(phase[0])));
      card.appendChild(top2);
      if (a.status === "draft" || a.status === "changes_requested") {
        var bar = h("div", "fa-bar");
        bar.innerHTML = "<i style='width:" + a.evaluation.percent + "%'></i>";
        card.appendChild(bar);
      }
      card.appendChild(h("p", "fa-next", esc(nextWords(a))));
      var open2 = (a.corrections || []).filter(function (c) { return !c.resolved; });
      if (open2.length) {
        var ul = h("ul", "fa-asks");
        open2.forEach(function (c) { ul.appendChild(h("li", null, esc(c.message))); });
        card.appendChild(ul);
      }
      var acts = h("div", "fa-card-acts");
      var editable = a.status === "draft" || a.status === "changes_requested";
      acts.appendChild(btn(editable ? "Continue" : "See details", editable ? "" : "quiet", function () { editable ? drawEditor(a, 0) : drawStatus(a); }));
      if (a.status === "admitted" && a.acceptance === "pending" && !a.enrollmentId) {
        acts.appendChild(btn("Accept the place", "", function () { answer(a, "accept"); }));
        acts.appendChild(btn("Decline", "quiet", function () { answer(a, "decline"); }));
      }
      card.appendChild(acts);
      wrap.appendChild(card);
    });

    // Another year for a child the school already has.
    var wards = (DATA.students || []).filter(function (s) {
      return !DATA.applications.some(function (a) {
        return a.student.id === s.id && ["draft", "submitted", "incomplete", "under_review", "changes_requested", "awaiting_decision", "waitlisted", "admitted"].indexOf(a.status) > -1 && !a.enrollmentId;
      });
    });
    if (wards.length) {
      var next = DATA.years.filter(function (y) { return y > DATA.currentYear; })[0];
      var box = h("section", "fa-block");
      box.appendChild(h("h2", null, "Next year"));
      wards.forEach(function (w) {
        var row = h("div", "fa-row");
        row.appendChild(h("span", null, "<b>" + esc(w.name) + "</b>"));
        row.appendChild(btn("Re-enrol for " + yearName(next || DATA.currentYear), "quiet sm", function () { startReturning(w, next || DATA.currentYear); }));
        box.appendChild(row);
      });
      wrap.appendChild(box);
    }
    ROOT.appendChild(wrap);
  }

  function answer(a, action) {
    NS.act(a.id, action, {}).then(function (r) {
      fresh(r.application);
      toast(action === "accept" ? "Thank you — the school has your answer." : "The school has been told.");
      drawList();
    }, function (e) { toast(e.message); });
  }

  /* --------------------------------------------------------------- Start */
  function field(label, value, o) {
    o = o || {};
    var w = h("label", "fa-f" + (o.cls ? " " + o.cls : ""));
    w.appendChild(h("span", null, esc(label) + (o.req ? " <i>*</i>" : "")));
    var i;
    if (o.options) {
      i = h("select");
      o.options.forEach(function (x) { var op = h("option"); op.value = x[0]; op.textContent = x[1]; i.appendChild(op); });
    } else if (o.area) { i = h("textarea"); i.rows = o.rows || 3; }
    else { i = h("input"); i.type = o.type || "text"; }
    i.value = value == null ? "" : value;
    if (o.hint) i.placeholder = o.hint;
    if (o.max) i.maxLength = o.max;
    w.appendChild(i);
    if (o.note) w.appendChild(h("small", null, esc(o.note)));
    return { node: w, input: i, value: function () { return i.value.trim(); } };
  }

  function drawStart() {
    ROOT.innerHTML = "";
    var wrap = h("div", "fa-wrap");
    wrap.appendChild(head("Apply for a place", "Tell us who the student is. You can add everything else next, and come back to it."));
    var grades = DATA.grades.map(function (g) { return [g, g]; });
    var years = DATA.years.map(function (y) { return [y, yearName(y)]; });
    var f = {
      first: field("Student's legal first name", "", { req: true, max: 80 }),
      last: field("Student's legal last name", "", { req: true, max: 80 }),
      dob: field("Date of birth", "", { type: "date", req: true }),
      year: field("School year", DATA.currentYear, { options: years }),
      grade: field("Grade applying to", DATA.grades[2] || DATA.grades[0], { options: grades, req: true }),
      type: field("Is the student new to the school?", "new", { options: [["new", "Yes — starting school here"], ["transfer", "Coming from another school"]] })
    };
    var g = h("div", "fa-grid");
    [f.first, f.last, f.dob, f.year, f.grade, f.type].forEach(function (x) { g.appendChild(x.node); });
    wrap.appendChild(g);
    var err = h("p", "fa-err"); err.hidden = true;
    wrap.appendChild(err);
    var acts = h("div", "fa-acts");
    var key = "fam-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    var go = btn("Start the application", "lg", function () {
      err.hidden = true;
      if (!f.first.value() || !f.last.value()) { err.hidden = false; err.textContent = "Please give the student's first and last name."; return; }
      go.disabled = true;
      NS.create({ clientKey: key, grade: f.grade.value(), schoolYear: f.year.value(), type: f.type.value(),
                  student: { legalFirst: f.first.value(), legalLast: f.last.value(), dob: f.dob.value() || undefined } })
        .then(function (r) { fresh(r.application); drawEditor(r.application, 0); },
              function (e) { go.disabled = false; err.hidden = false; err.textContent = e.message; });
    });
    acts.appendChild(go);
    acts.appendChild(btn("Cancel", "quiet lg", function () { drawList(); }));
    wrap.appendChild(acts);
    ROOT.appendChild(wrap);
  }

  function startReturning(ward, year) {
    NS.create({ clientKey: "ret-" + ward.id + "-" + year, studentId: ward.id, schoolYear: year, type: "returning" })
      .then(function (r) { fresh(r.application); drawEditor(r.application, 0); },
            function (e) { toast(e.message); });
  }

  /* -------------------------------------------------------------- Editor */
  var STEPS = ["The student", "Your family", "Documents", "Review and send"];

  function stepper(step, go) {
    var ol = h("ol", "fa-steps");
    STEPS.forEach(function (s, i) {
      var li = h("li", (i === step ? "on" : i < step ? "done" : ""), "<i>" + (i < step ? "✓" : i + 1) + "</i><span>" + esc(s) + "</span>");
      li.addEventListener("click", function () { go(i); });
      ol.appendChild(li);
    });
    return ol;
  }

  function drawEditor(a, step) {
    ROOT.innerHTML = "";
    var wrap = h("div", "fa-wrap");
    var title = a.student.name || "New application";
    wrap.appendChild(head(title, a.grade + " · " + yearName(a.schoolYear)));
    var open2 = (a.corrections || []).filter(function (c) { return !c.resolved; });
    if (open2.length) {
      var ask = h("section", "fa-ask");
      ask.appendChild(h("h3", null, "The school asked for"));
      var ul = h("ul");
      open2.forEach(function (c) { ul.appendChild(h("li", null, esc(c.message))); });
      ask.appendChild(ul);
      wrap.appendChild(ask);
    }
    wrap.appendChild(stepper(step, function (i) { drawEditor(a, i); }));
    var pane = h("div", "fa-pane");
    wrap.appendChild(pane);
    ROOT.appendChild(wrap);
    [stepStudent, stepFamily, stepDocs, stepReview][step](pane, a, function (to) { drawEditor(freshApp(a), to); });
    window.scrollTo(0, 0);
  }
  function freshApp(a) {
    for (var i = 0; i < DATA.applications.length; i++) if (DATA.applications[i].id === a.id) return DATA.applications[i];
    return a;
  }

  function nav(pane, step, saveFn, nextLabel) {
    var err = h("p", "fa-err"); err.hidden = true;
    pane.appendChild(err);
    var acts = h("div", "fa-acts");
    if (step > 0) acts.appendChild(btn("Back", "quiet lg", function () { saveFn(step - 1, err); }));
    acts.appendChild(btn(nextLabel || "Save and continue", "lg", function () { saveFn(step + 1, err); }));
    acts.appendChild(btn("Save and finish later", "quiet lg", function () { saveFn(-1, err); }));
    pane.appendChild(acts);
  }

  function saver(a, collect, again) {
    return function (to, err) {
      err.hidden = true;
      var body = collect();
      body.ifUpdatedAt = freshApp(a).updatedAt;
      NS.update(a.id, body).then(function (r) {
        fresh(r.application);
        if (to === -1) { toast("Saved. You can come back to it any time."); drawList(); }
        else again(to);
      }, function (e) { err.hidden = false; err.textContent = e.message; });
    };
  }

  /* Step 1 — the student and the place */
  function stepStudent(pane, a, again) {
    var f = a.form || {}, stu = f.student || {}, prev = f.previous || {};
    var X = {
      first: field("Legal first name", a.student.legalFirst, { req: true, max: 80 }),
      last: field("Legal last name", a.student.legalLast, { req: true, max: 80 }),
      pref: field("Name they go by", a.student.preferredName, { max: 80, note: "If different from the legal name" }),
      dob: field("Date of birth", a.student.dob, { type: "date", req: true }),
      gender: field("Gender", stu.gender, { options: [["", "Prefer not to say"], ["Female", "Female"], ["Male", "Male"], ["Non-binary", "Non-binary"]] }),
      lang: field("Language spoken at home", stu.language, { max: 60 }),
      year: field("School year", a.schoolYear, { options: DATA.years.map(function (y) { return [y, yearName(y)]; }) }),
      grade: field("Grade", a.grade, { options: DATA.grades.map(function (g) { return [g, g]; }), req: true }),
      type: field("Is the student new to the school?", a.type, { options: [["new", "Yes — starting school here"], ["transfer", "Coming from another school"], ["returning", "Already here — continuing"]] }),
      start: field("Day they would like to start", a.intendedStart, { type: "date", req: true }),
      pSchool: field("Previous school", prev.school, { max: 160 }),
      pLoc: field("Where it is", prev.location, { max: 120 }),
      pGrade: field("Last grade completed", prev.lastGrade, { max: 40 }),
      pTc: field("Transfer certificate number", prev.tcNumber, { max: 60, note: "If you have one" })
    };
    var g = h("div", "fa-grid");
    [X.first, X.last, X.pref, X.dob, X.gender, X.lang].forEach(function (x) { g.appendChild(x.node); });
    pane.appendChild(g);
    pane.appendChild(h("h2", "fa-h2", "Where and when"));
    var g2 = h("div", "fa-grid");
    [X.year, X.grade, X.type, X.start].forEach(function (x) { g2.appendChild(x.node); });
    pane.appendChild(g2);
    var prevBox = h("div", "fa-prev");
    pane.appendChild(prevBox);
    function drawPrev() {
      prevBox.innerHTML = "";
      if (X.type.value() === "transfer") {
        prevBox.appendChild(h("h2", "fa-h2", "Where they have been"));
        var g3 = h("div", "fa-grid");
        [X.pSchool, X.pLoc, X.pGrade, X.pTc].forEach(function (x) { g3.appendChild(x.node); });
        prevBox.appendChild(g3);
      }
    }
    X.type.input.addEventListener("change", drawPrev);
    drawPrev();
    nav(pane, 0, saver(a, function () {
      return {
        student: { legalFirst: X.first.value(), legalLast: X.last.value(), preferredName: X.pref.value(), dob: X.dob.value() },
        grade: X.grade.value(), schoolYear: X.year.value(), type: X.type.value(), intendedStart: X.start.value(),
        form: { student: { gender: X.gender.value(), language: X.lang.value() },
                previous: { school: X.pSchool.value(), location: X.pLoc.value(), lastGrade: X.pGrade.value(), tcNumber: X.pTc.value(),
                            board: prev.board || "", lastYear: prev.lastYear || "", reason: prev.reason || "" } }
      };
    }, again));
  }

  /* Step 2 — the family */
  function stepFamily(pane, a, again) {
    var f = a.form || {}, con = f.contact || {}, em = f.emergency || {}, sup = f.support;
    var guardians = ((f.guardians || []).length ? f.guardians : [{ name: "", relationship: "", phone: "", email: "", primary: true }]).map(function (g) {
      return { name: g.name || "", relationship: g.relationship || "", phone: g.phone || "", email: g.email || "", primary: !!g.primary, address: g.address || "" };
    });
    pane.appendChild(h("h2", "fa-h2", "Parents and guardians"));
    pane.appendChild(h("p", "fa-note", "At least one, with a phone number or an email. The school writes to the first one."));
    var list = h("div", "fa-guards");
    pane.appendChild(list);
    function draw() {
      list.innerHTML = "";
      guardians.forEach(function (g, i) {
        var row = h("div", "fa-guard");
        var n = field("Name", g.name, { max: 120 }), r = field("Relationship", g.relationship, { max: 40, hint: "Mother, father, guardian…" });
        var p = field("Phone", g.phone, { max: 40 }), m = field("Email", g.email, { type: "email", max: 320 });
        [[n, "name"], [r, "relationship"], [p, "phone"], [m, "email"]].forEach(function (x) {
          x[0].input.addEventListener("input", function () { g[x[1]] = x[0].input.value; });
          row.appendChild(x[0].node);
        });
        if (guardians.length > 1) {
          row.appendChild(btn("Remove", "quiet sm", function () { guardians.splice(i, 1); draw(); }));
        }
        list.appendChild(row);
      });
      if (guardians.length < 4) list.appendChild(btn("Add another parent or guardian", "quiet sm", function () {
        guardians.push({ name: "", relationship: "", phone: "", email: "", primary: false }); draw();
      }));
    }
    draw();
    pane.appendChild(h("h2", "fa-h2", "Home"));
    var X = {
      addr: field("Home address", con.address, { area: true, rows: 3, req: true, max: 400 }),
      phone: field("Home phone", con.phone, { max: 40 }),
      lang: field("Language you would like the school to write in", con.language, { max: 60 }),
      eName: field("Somebody to call in an emergency", em.name, { max: 120 }),
      eRel: field("Their relationship to the student", em.relationship, { max: 40 }),
      ePhone: field("Their phone", em.phone, { max: 40 })
    };
    var g = h("div", "fa-grid");
    [X.addr, X.phone, X.lang, X.eName, X.eRel, X.ePhone].forEach(function (x) { g.appendChild(x.node); });
    pane.appendChild(g);
    pane.appendChild(h("h2", "fa-h2", "Anything the school should know"));
    var support = field("Support or accessibility needs (optional)", sup && sup.notes, { area: true, rows: 3, max: 2000,
      note: "Only the school's administrators can read this. Share only what would help them prepare a place." });
    pane.appendChild(support.node);
    nav(pane, 1, saver(a, function () {
      return { form: { guardians: guardians,
        contact: { address: X.addr.value(), phone: X.phone.value(), language: X.lang.value(), correspondence: con.correspondence || "", channel: con.channel || "" },
        emergency: { name: X.eName.value(), relationship: X.eRel.value(), phone: X.ePhone.value() },
        support: { notes: support.value() } } };
    }, again));
  }

  /* Step 3 — documents */
  function stepDocs(pane, a, again) {
    var cur = freshApp(a);
    pane.appendChild(h("p", "fa-note", "Send what you have now; the rest can follow. The school marks a document as accepted once they have looked at it. Files up to 700 KB — a PDF or a photo."));
    if (!cur.documents.length) pane.appendChild(h("p", "fa-note", "The school does not ask for any documents for this application."));
    cur.documents.forEach(function (d) {
      var row = h("div", "fa-doc fa-" + ({ verified: "good", waived: "good", returned: "ask", received: "wait", missing: "draft" }[d.status] || "wait"));
      var info = h("div", "fa-doc-i", "<b>" + esc(d.label) + "</b><small>" + (d.required ? "Needed" : "Optional") + (d.hint ? " · " + esc(d.hint) : "") + "</small>" +
        (d.status === "returned" && d.note ? "<p class='fa-ask-t'>The school says: " + esc(d.note) + "</p>" : ""));
      row.appendChild(info);
      var st = h("div", "fa-doc-s", esc({ missing: "Not sent yet", received: "Sent", verified: "Accepted", returned: "Please send again", waived: "Not needed" }[d.status] || d.status) +
        (d.file ? "<small>" + esc(d.file.name) + " · " + kb(d.file.size) + "</small>" : ""));
      row.appendChild(st);
      if (d.status !== "verified" && d.status !== "waived") {
        var pick = h("input"); pick.type = "file"; pick.hidden = true;
        pick.accept = ".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*";
        pick.addEventListener("change", function () {
          var file = pick.files[0];
          if (!file) return;
          if (file.size > 700 * 1024) { toast(file.name + " is " + kb(file.size) + ". The limit is 700 KB — scan it smaller, or save it as a PDF."); return; }
          var rd = new FileReader();
          rd.onload = function () {
            var s = String(rd.result);
            NS.uploadFile(cur.id, d.key, { name: file.name, type: file.type || "application/pdf", data: s.slice(s.indexOf(",") + 1) })
              .then(function (r) { fresh(r.application); toast(d.label + " sent."); again(2); }, function (e) { toast(e.message); });
          };
          rd.readAsDataURL(file);
        });
        row.appendChild(pick);
        row.appendChild(btn(d.file ? "Send a different file" : "Choose a file", "quiet sm", function () { pick.click(); }));
      }
      pane.appendChild(row);
    });
    var acts = h("div", "fa-acts");
    acts.appendChild(btn("Back", "quiet lg", function () { again(1); }));
    acts.appendChild(btn("Continue", "lg", function () { again(3); }));
    acts.appendChild(btn("Save and finish later", "quiet lg", function () { drawList(); }));
    pane.appendChild(acts);
  }

  /* Step 4 — review and send */
  function stepReview(pane, a, again) {
    var cur = freshApp(a);
    var ev = cur.evaluation || {};
    var f = cur.form || {};
    var miss = (ev.fields && ev.fields.missing || []).filter(function (m) { return m.key !== "consent"; });
    var sum = h("div", "fa-sum");
    function line(k, v) { return "<div><span>" + esc(k) + "</span><b>" + (v ? esc(v) : "<em>Not given</em>") + "</b></div>"; }
    sum.innerHTML = line("Student", cur.student.name) + line("Date of birth", day(cur.student.dob)) + line("Applying to", cur.grade + ", " + yearName(cur.schoolYear)) +
      line("Starting", day(cur.intendedStart)) + line("Parent or guardian", ((f.guardians || [])[0] || {}).name) +
      line("Contact", ((f.guardians || [])[0] || {}).phone || ((f.guardians || [])[0] || {}).email) + line("Address", (f.contact || {}).address) +
      (cur.type === "transfer" ? line("Previous school", (f.previous || {}).school) : "");
    pane.appendChild(sum);
    var docsOut = (cur.documents || []).filter(function (d) { return d.required && (d.status === "missing" || d.status === "returned"); });
    if (miss.length) {
      var m = h("section", "fa-ask");
      m.appendChild(h("h3", null, "Still to fill in"));
      var ul = h("ul");
      miss.forEach(function (x) { ul.appendChild(h("li", null, esc(x.label))); });
      m.appendChild(ul);
      pane.appendChild(m);
    }
    if (docsOut.length) {
      pane.appendChild(h("p", "fa-note", "Not sent yet: " + docsOut.map(function (d) { return d.label.toLowerCase(); }).join(", ") +
        ". You can send the application now; the school will wait for these."));
    }
    var consent = cur.consent || {};
    var lab = h("label", "fa-consent");
    var cb = h("input"); cb.type = "checkbox"; cb.checked = !!consent.current;
    lab.appendChild(cb);
    lab.appendChild(h("span", null, esc(consent.statement || "")));
    pane.appendChild(lab);
    var err = h("p", "fa-err"); err.hidden = true;
    pane.appendChild(err);
    var acts = h("div", "fa-acts");
    acts.appendChild(btn("Back", "quiet lg", function () { again(2); }));
    var send = btn(cur.status === "changes_requested" ? "Send it back to the school" : "Send to the school", "lg", function () {
      err.hidden = true;
      if (miss.length) { err.hidden = false; err.textContent = "Please fill in what is listed above first."; return; }
      if (!cb.checked && !consent.current) { err.hidden = false; err.textContent = "Please tick the box to confirm."; return; }
      send.disabled = true;
      var go = function () {
        return NS.act(cur.id, cur.status === "changes_requested" ? "resubmit" : "submit", {});
      };
      var p = consent.current ? go() : NS.update(cur.id, { consent: true, ifUpdatedAt: cur.updatedAt }).then(function (r) { fresh(r.application); return go(); });
      p.then(function (r) {
        fresh(r.application);
        toast("Sent. The school will take it from here.");
        drawStatus(r.application);
      }, function (e) { send.disabled = false; err.hidden = false; err.textContent = e.message; });
    });
    acts.appendChild(send);
    acts.appendChild(btn("Save and finish later", "quiet lg", function () { drawList(); }));
    pane.appendChild(acts);
  }

  /* ------------------------------------------------------------- Status */
  function eventWords(e) {
    switch (e.kind) {
      case "status":
        if (!e.from) return "Application started";
        return ({ draft: "Back to a draft", submitted: "Sent to the school", incomplete: "Received — waiting for documents",
          under_review: "The school began its review", changes_requested: "The school asked for corrections",
          awaiting_decision: "Review complete", waitlisted: "Placed on the waiting list", admitted: "Offered a place",
          rejected: "The school was not able to offer a place", withdrawn: "Withdrawn" })[e.to] || "Updated";
      case "document": return e.to === "received" ? "A document was received" : e.to === "verified" ? "A document was accepted" : e.to === "returned" ? "A document was sent back to you" : "A document was updated";
      case "decision": return e.to === "accepted" ? "Offer accepted" : e.to === "declined" ? "Offer declined" : "A decision was made";
      case "enrollment": return e.to === "enrolled" ? "Enrolled" : "Enrollment updated";
      default: return null;
    }
  }

  function drawStatus(a) {
    ROOT.innerHTML = "";
    var wrap = h("div", "fa-wrap");
    wrap.appendChild(head(a.student.name || "Application", a.grade + " · " + yearName(a.schoolYear) + " · " + a.number));
    var phase = a.enrollmentId ? ["Enrolled", "good"] : PHASE[a.status] || [a.status, "wait"];
    var card = h("article", "fa-card fa-" + phase[1]);
    card.appendChild(h("div", "fa-card-top", "<div class='fa-card-who'><b>" + esc(phase[0]) + "</b></div>"));
    card.appendChild(h("p", "fa-next", esc(nextWords(a))));
    var open2 = (a.corrections || []).filter(function (c) { return !c.resolved; });
    if (open2.length) {
      var ul = h("ul", "fa-asks");
      open2.forEach(function (c) { ul.appendChild(h("li", null, esc(c.message))); });
      card.appendChild(ul);
    }
    var acts = h("div", "fa-card-acts");
    if (a.status === "changes_requested" || a.status === "draft") acts.appendChild(btn("Make the corrections", "", function () { drawEditor(a, 0); }));
    if (a.status === "admitted" && a.acceptance === "pending" && !a.enrollmentId) {
      acts.appendChild(btn("Accept the place", "", function () { answer(a, "accept"); }));
      acts.appendChild(btn("Decline", "quiet", function () { answer(a, "decline"); }));
    }
    if (["draft", "submitted", "incomplete", "under_review", "changes_requested", "awaiting_decision", "waitlisted"].indexOf(a.status) > -1 && !a.enrollmentId) {
      acts.appendChild(btn("Withdraw this application", "danger sm", function () { withdraw(a); }));
    }
    card.appendChild(acts);
    wrap.appendChild(card);

    // Documents
    var docs = (a.documents || []);
    if (docs.length) {
      var box = h("section", "fa-block");
      box.appendChild(h("h2", null, "Documents"));
      docs.forEach(function (d) {
        box.appendChild(h("div", "fa-row", "<span><b>" + esc(d.label) + "</b>" + (d.status === "returned" && d.note ? "<small class='fa-ask-t'>" + esc(d.note) + "</small>" : "") + "</span><em>" +
          esc({ missing: "Not sent yet", received: "Sent", verified: "Accepted", returned: "Please send again", waived: "Not needed" }[d.status] || d.status) + "</em>"));
      });
      wrap.appendChild(box);
    }

    var ups = (a.events || []).map(function (e) { return { at: e.at, text: eventWords(e) }; }).filter(function (x) { return x.text; });
    if (ups.length) {
      var hist = h("section", "fa-block");
      hist.appendChild(h("h2", null, "Updates"));
      ups.slice(0, 12).forEach(function (u) { hist.appendChild(h("div", "fa-row", "<span>" + esc(u.text) + "</span><em>" + esc(ago(u.at)) + "</em>")); });
      wrap.appendChild(hist);
    }
    var back = h("div", "fa-acts");
    back.appendChild(btn("All applications", "quiet lg", function () { load().then(drawList); }));
    wrap.appendChild(back);
    ROOT.appendChild(wrap);
    window.scrollTo(0, 0);
  }

  function withdraw(a) {
    if (!window.confirm("Withdraw this application? The school will be told, and you can start a new one at any time.")) return;
    NS.act(a.id, "withdraw", { reason: "Withdrawn by the family" }).then(function (r) {
      fresh(r.application);
      toast("Withdrawn.");
      drawList();
    }, function (e) { toast(e.message); });
  }

  /* What the school has chosen to show a family about conduct, and a child's
     own health record. Read-only; the school keeps both. */
  function notes(host, opts) {
    ROOT = host;
    OPTS = opts || {};
    host.innerHTML = "";
    var st = OPTS.student;
    var wrap = h("div", "fa-wrap");
    wrap.appendChild(head("Conduct and health", st ? st.name + " — what the school keeps and has chosen to show you." : "", "OEdu Family · The school's record"));
    var top = h("div", "fa-top");
    if (OPTS.back) top.appendChild(btn("Back to the record", "quiet lg", OPTS.back));
    wrap.appendChild(top);
    host.appendChild(wrap);
    if (!st) return;
    var KINDS = { incident: "Incident", merit: "Merit", counseling: "Counseling" };
    var HK = { allergy: "Allergy", condition: "Condition", immunization: "Immunization", medication: "Medication", screening: "Screening", visit: "Visit", insurance: "Insurance" };
    var c = h("section", "fa-block"); c.appendChild(h("h2", null, "Conduct")); wrap.appendChild(c);
    var m = h("section", "fa-block"); m.appendChild(h("h2", null, "Health")); wrap.appendChild(m);
    API.conduct.forStudent(st.id).then(function (r) {
      if (!r.entries.length) c.appendChild(h("p", "fa-note", "The school has not shared any entries."));
      r.entries.forEach(function (e) {
        var row = h("div", "fa-row");
        row.innerHTML = "<span><b>" + esc(e.title) + "</b><small>" + esc((KINDS[e.kind] || e.kind) + " · " + day(e.occurredOn) +
          (e.location ? " · " + e.location : "") + (e.details ? " — " + e.details : "") + (e.actionTaken ? " · What was done: " + e.actionTaken : "")) + "</small></span><em>" +
          esc(e.status === "open" ? "Open" : "Resolved") + "</em>";
        c.appendChild(row);
      });
    }, function (e) { c.appendChild(h("p", "fa-note", esc(e.message))); });
    API.health.forStudent(st.id).then(function (r) {
      var act = r.entries.filter(function (e) { return e.status === "active"; });
      if (!act.length) m.appendChild(h("p", "fa-note", "Nothing is on file."));
      act.forEach(function (e) {
        var row = h("div", "fa-row");
        row.innerHTML = "<span><b>" + esc(e.title) + "</b><small>" + esc([HK[e.kind] || e.kind, e.severity, e.onDate ? day(e.onDate) : "", e.detail].filter(Boolean).join(" · ")) +
          "</small></span><em>" + esc(e.dueOn ? "Next " + day(e.dueOn) : "") + "</em>";
        m.appendChild(row);
      });
    }, function (e) { m.appendChild(h("p", "fa-note", esc(e.message))); });
  }

  return { open: open, notes: notes };
})();
