/* ==========================================================================
   OEdu — certificates, as the office works them.

   A family asks for a bonafide, a character certificate, a migration
   certificate or, the serious one, a transfer certificate. The office
   prepares it, the principal signs it, it is issued with a number that is
   never used twice, and the family collects it. That is three places a
   request can be, so it is drawn as three columns, and moving a card on is
   the whole workflow: drag it, or press the one button it offers.

   The rules are the server's (api/src/routes/certificates.js): a number is
   given when a certificate is issued, and issuing a transfer certificate
   takes the child out of their section and says so on their record. This
   file asks before it does that, and draws what happened.

   Mounted by app.js with the console kit: OPLO_INDIA_CERTS(kit) → { board }.
   ========================================================================== */
window.OPLO_INDIA_CERTS = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, IT = API.items, U = K.ui;
  var dmy = U.dmy, plural = U.plural;
  var KINDS = ["Bonafide certificate", "Character certificate", "Transfer certificate", "Migration certificate", "Other"];
  var COLS = [["requested", "Requested", "amber", "Asked for by a family or the office; not yet prepared."],
              ["awaiting signature", "Awaiting signature", "violet", "Prepared, waiting for the principal."],
              ["issued", "Issued", "emerald", "Signed and numbered. Ready to print and hand over."]];
  function hueOf(n) { var h = 0; for (var i = 0; i < String(n).length; i++) h = (h * 31 + String(n).charCodeAt(i)) % 8; return h; }
  function initials(n) { return String(n || "?").split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase(); }
  function ymd(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function days(from, to) { return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000); }

  var SHOW_DECLINED = false;

  function board(v) {
    var P = K.cxPage(v, "Students", "Certificates", "Transfer, bonafide, character and migration certificates: from a request to a signed, numbered certificate in the family's hand.");
    P.tools.appendChild(K.cnAction("Record a request", function () { request(); }, true));
    var metrics = el("div"), slot = el("div", "en-slot");
    v.appendChild(metrics); v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Reading the requests…"));

    IT.list({ kind: "certificate", limit: 300 }).then(function (rows) {
      slot.innerHTML = "";
      var today = ymd(new Date());
      var by = {}; COLS.forEach(function (c) { by[c[0]] = []; }); by.declined = [];
      rows.forEach(function (r) { (by[r.status] || (by[r.status] = [])).push(r); });
      var late = by.requested.concat(by["awaiting signature"]).filter(function (r) { return r.dueOn && r.dueOn < today; }).length;
      K.cxMetrics(metrics, [
        { label: "Requested", value: by.requested.length, note: "to prepare" },
        { label: "Awaiting signature", value: by["awaiting signature"].length, bad: by["awaiting signature"].length > 0, note: "for the principal" },
        { label: "Issued", value: by.issued.length, note: "all time" },
        { label: "Overdue", value: late, bad: true, note: "past the date asked for" }
      ]);
      var grid = el("div", "cb-cols");
      COLS.forEach(function (c) { grid.appendChild(column(c, by[c[0]], today, rows)); });
      slot.appendChild(grid);
      if (by.declined.length) {
        var d = el("div", "cb-declined");
        var tg = el("button", "cr-btn quiet", (SHOW_DECLINED ? "Hide" : "Show") + " " + plural(by.declined.length, "declined request"));
        tg.type = "button"; tg.addEventListener("click", function () { SHOW_DECLINED = !SHOW_DECLINED; K.openAdmin(true, "in-certs"); });
        d.appendChild(tg);
        if (SHOW_DECLINED) by.declined.forEach(function (r) { d.appendChild(card(r, today, "declined")); });
        slot.appendChild(d);
      }
    }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, "in-certs"); }); });
  }

  function column(def, list, today, all) {
    var col = el("section", "cb-col"), key = def[0];
    col.dataset.hue = def[2];
    col.innerHTML = "<header><h3>" + esc(def[1]) + "</h3><em>" + list.length + "</em></header><p>" + esc(def[3]) + "</p>";
    var body = el("div", "cb-body");
    col.appendChild(body);
    list.sort(function (a, b) { return (a.dueOn || "9") < (b.dueOn || "9") ? -1 : 1; });
    list.forEach(function (r) { body.appendChild(card(r, today, key)); });
    if (!list.length) body.appendChild(el("p", "cb-none", "Nothing here."));
    col.addEventListener("dragover", function (e) { e.preventDefault(); col.classList.add("over"); });
    col.addEventListener("dragleave", function () { col.classList.remove("over"); });
    col.addEventListener("drop", function (e) {
      e.preventDefault(); col.classList.remove("over");
      var id = e.dataTransfer.getData("text/plain"), r = all.filter(function (x) { return x.id === id; })[0];
      if (r && r.status !== key) move(r, key);
    });
    return col;
  }

  function card(r, today, key) {
    var d = r.data || {}, c = el("article", "cb-card");
    c.draggable = true;
    c.dataset.id = r.id;
    c.addEventListener("dragstart", function (e) { e.dataTransfer.setData("text/plain", r.id); c.classList.add("drag"); });
    c.addEventListener("dragend", function () { c.classList.remove("drag"); });
    var kind = d.type || "Certificate", late = r.dueOn && r.dueOn < today && key !== "issued" && key !== "declined";
    c.innerHTML = '<div class="top"><span class="k" data-k="' + esc(kind.split(" ")[0]) + '">' + esc(kind.replace(" certificate", "")) + "</span>" + (r.dueOn ? '<span class="due' + (late ? " late" : "") + '">' + (late ? days(r.dueOn, today) + " days late" : "by " + dmy(r.dueOn)) + "</span>" : "") + "</div>" +
      '<div class="who"><span class="cx-av" data-h="' + hueOf(r.subjectName) + '">' + esc(initials(r.subjectName)) + "</span><b>" + esc(r.subjectName || r.title) + "</b></div>" +
      (d.purpose ? "<p>" + esc(d.purpose) + "</p>" : "") + (d.number ? '<div class="no">' + esc(d.number) + (d.issuedOn ? " · " + dmy(d.issuedOn) : "") + "</div>" : "");
    var acts = el("div", "acts");
    function b(label, cls, fn) { var x = el("button", "cb-btn " + cls, label); x.type = "button"; x.addEventListener("click", fn); acts.appendChild(x); }
    if (key === "requested") { b("Prepare", "go", function () { move(r, "awaiting signature"); }); b("Decline", "q", function () { move(r, "declined"); }); }
    if (key === "awaiting signature") { b("Sign and issue", "go", function () { move(r, "issued"); }); b("Back", "q", function () { move(r, "requested"); }); }
    if (key === "issued") b("Print", "go", function () { K.printCertificate(r); });
    if (key !== "issued" && key !== "declined") b("Draft", "q", function () { K.printCertificate(r, true); });
    if (key === "declined") b("Reopen", "q", function () { move(r, "requested"); });
    c.appendChild(acts);
    return c;
  }

  function move(r, to) {
    var d = r.data || {};
    if (to === "issued" && d.type === "Transfer certificate" && !confirm("Issuing a transfer certificate takes " + (r.subjectName || "the child") + " out of their section and marks them as having left the school. Issue it?")) return;
    IT.update(r.id, { status: to }).then(function (x) {
      K.toast(to === "issued" ? "Issued" + (x && x.data && x.data.number ? ": " + x.data.number : "") + "." : "Moved to " + to + ".");
      K.openAdmin(true, "in-certs");
    }, function (e) { K.toast(e && e.message ? e.message : "That did not save."); });
  }

  /* ------------------------------------------------------- A new request */
  function request() {
    var kids = null, chosen = null;
    var kind = U.fld("select", "Kind", KINDS[0], { options: KINDS.map(function (k) { return [k, k]; }) });
    var purpose = U.fld("text", "What it is for", "", { max: 160, hint: "Passport, bank account, scholarship, admission elsewhere…" });
    var due = U.fld("date", "Needed by", "");
    var inp = el("input"); inp.type = "search"; inp.placeholder = "Start typing the child's name"; inp.autocomplete = "off";
    var lab = el("label", "admin-field"); lab.appendChild(el("span", null, "Child")); lab.appendChild(inp);
    var list = el("div", "care-pick-list");
    var note = el("p", "en-note");
    U.dialog({
      title: "Record a request", action: "Record it", wide: false,
      sub: "A family asked for a certificate, in person or on paper. It starts in Requested.",
      body: function (h) {
        h.appendChild(lab); h.appendChild(list);
        var g = el("div", "en-form-grid"); g.appendChild(kind.node); g.appendChild(due.node); h.appendChild(g); h.appendChild(purpose.node); h.appendChild(note);
        inp.addEventListener("input", function () {
          chosen = null; list.innerHTML = "";
          var t = inp.value.trim().toLowerCase();
          if (t.length < 2) return;
          (kids ? Promise.resolve(kids) : API.india.students().then(function (r) { kids = r.students || []; return kids; })).then(function (all) {
            all.filter(function (s) { return !s.leftOn && ((s.name || "").toLowerCase().indexOf(t) > -1 || (s.admissionNo || "").toLowerCase().indexOf(t) > -1); }).slice(0, 6).forEach(function (s) {
              var b = el("button", "care-pick-i", esc(s.name) + " <small>" + esc(s.classLabel || "") + (s.rollNo ? " · roll " + s.rollNo : "") + "</small>");
              b.type = "button";
              b.addEventListener("click", function () { chosen = s; inp.value = s.name; list.innerHTML = ""; });
              list.appendChild(b);
            });
          });
        });
      },
      onSubmit: function () {
        if (!chosen) throw new Error("Choose the child from the list.");
        var data = { type: kind.value(), purpose: purpose.value() };
        if (data.type === "Transfer certificate" && chosen.classLabel) data.lastClass = chosen.classLabel;
        return IT.create({ kind: "certificate", title: data.type + " - " + chosen.name, status: "requested", subjectId: chosen.id, dueOn: due.value() || null, data: data })
          .then(function () { K.toast("Recorded."); K.openAdmin(true, "in-certs"); });
      }
    });
  }

  return { board: board };
};
