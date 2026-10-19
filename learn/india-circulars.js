/* ==========================================================================
   OEdu — circulars: what the school tells its families, and whether they read it.

   A school's office writes a circular, says who it is for (the school, one
   class, the staff), attaches the PDF if there is one, and wants to know
   afterwards who has not opened it. The platform already keeps each person's
   notices with the moment they opened them; a circular is a `form` record
   that makes one for each person it is for (api/src/routes/items.js), and
   /items/:id/reach counts how many were opened.

   Honest about what leaves the building: the app reaches every family. Email
   goes to those who have email notices on, through the Outbox, once the school
   connects a mail service. Text messages need a sender registered with the
   telecom regulator and WhatsApp needs a business account; neither is
   connected, so neither is offered as if it were. What works today for the
   WhatsApp groups a school already runs is a circular written once and copied
   or opened in WhatsApp with its text ready.

   Mounted by app.js with the console kit: OPLO_INDIA_CIRCULARS(kit) →
   { circulars }.
   ========================================================================== */
window.OPLO_INDIA_CIRCULARS = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, IT = API.items, U = K.ui;
  var dmy = U.dmy, plural = U.plural, num = U.num;

  var CATEGORIES = [["General", "slate"], ["Academic", "violet"], ["Exam", "indigo"], ["Holiday", "emerald"], ["Event", "amber"], ["Transport", "orange"], ["Safety", "rose"]];
  var HUE = {}; CATEGORIES.forEach(function (c) { HUE[c[0]] = c[1]; });
  var AUD = { everyone: "Everyone", families: "Families", students: "Students", staff: "Staff" };
  function ymd(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function soft(p) { return p.catch(function () { return null; }); }
  function who(d) {
    var a = AUD[(d && d.audience) || "everyone"] || "Everyone", c = String((d && d.classes) || "").trim();
    return c ? a + " of " + c : a === "Everyone" ? "Whole school" : a;
  }
  function text(it) { return it.title + "\n\n" + ((it.data && it.data.body) || "") + "\n\n— " + K.schoolName(); }
  function copy(s) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(function () { K.toast("Copied."); }, function () { K.toast("Could not copy."); });
    else K.toast("Your browser would not copy.");
  }

  var ST = { filter: "open", cat: "" };

  function circulars(v) {
    var P = K.cxPage(v, "Communicate", "Circulars", "What the school tells families, students and staff: who it was for, and how many have opened it.");
    P.tools.appendChild(K.cnAction("New circular", function () { compose(); }, true));
    var metrics = el("div"), bar = el("div", "cr-bar"), slot = el("div", "en-slot");
    v.appendChild(metrics); v.appendChild(bar); v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Reading the circulars…"));

    IT.list({ kind: "form", limit: 200 }).then(function (rows) {
      rows.sort(function (a, b) { return b.createdAt - a.createdAt; });
      slot.innerHTML = "";
      var month = ymd(new Date()).slice(0, 7);
      var openN = rows.filter(function (r) { return r.status === "open"; }).length;
      var thisMonth = rows.filter(function (r) { return ymd(new Date(r.createdAt)).slice(0, 7) === month; }).length;
      var rate = K.cxMetrics(metrics, [
        { label: "In the school's voice", value: num(rows.length), note: plural(openN, "circular") + " open" },
        { label: "Sent this month", value: thisMonth, note: "to families, students and staff" },
        { label: "Opened, on average", value: null, note: "counting the latest ten…" },
        { label: "Not yet opened", value: null, note: "in those ten" }
      ]);

      var filters = K.cnFilters([{ k: "open", name: "Open", n: openN }, { k: "closed", name: "Withdrawn", n: rows.length - openN }, { k: "all", name: "All", n: rows.length }], ST.filter, function (k) { ST.filter = k; filters.mark(k); draw(); });
      var sel = el("select", "cx-select");
      sel.innerHTML = '<option value="">All categories</option>' + CATEGORIES.map(function (c) { return '<option value="' + c[0] + '"' + (ST.cat === c[0] ? " selected" : "") + ">" + c[0] + "</option>"; }).join("");
      sel.addEventListener("change", function () { ST.cat = sel.value; draw(); });
      bar.appendChild(filters); bar.appendChild(sel);

      var host = el("div", "cr-list");
      slot.appendChild(host);
      var reached = [], loaded = 0;
      function tally() {
        if (!reached.length) return;
        var sent = reached.reduce(function (a, r) { return a + r.sent; }, 0), read = reached.reduce(function (a, r) { return a + r.read; }, 0);
        var fresh = el("div"); K.cxMetrics(fresh, [{ label: "Opened, on average", value: sent ? Math.round(read / sent * 100) : null, unit: "%", note: num(read) + " of " + num(sent) + " notices", line: sent ? read / sent * 100 : null },
          { label: "Not yet opened", value: num(sent - read), bad: sent - read > 0, note: "across the latest " + plural(reached.length, "circular") }]);
        var row = metrics.firstChild, kids = [].slice.call(fresh.firstChild.children);
        row.replaceChild(kids[0], row.children[2]); row.replaceChild(kids[1], row.children[3]);
      }
      function draw() {
        host.innerHTML = "";
        var list = rows.filter(function (r) { return (ST.filter === "all" || (ST.filter === "open" ? r.status === "open" : r.status !== "open")) && (!ST.cat || (r.data && r.data.category || "General") === ST.cat); });
        if (!list.length) { host.appendChild(K.cnEmpty(rows.length ? "No circular matches." : "No circular has been written yet.", rows.length ? "Clear a filter." : "A circular reaches each family's inbox, and shows you who opened it.", rows.length ? null : "Write the first", rows.length ? null : compose)); return; }
        list.forEach(function (it, i) { host.appendChild(card(it, i, i < 10 && ST.filter !== "closed", function (r) { if (r && !it._counted) { it._counted = true; reached.push(r); tally(); } })); });
      }
      draw();
    }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, "forms"); }); });
  }

  function card(it, i, withReach, onReach) {
    var d = it.data || {}, cat = d.category || "General";
    var c = el("article", "cr-card" + (it.status === "open" ? "" : " off"));
    c.dataset.hue = HUE[cat] || "slate";
    c.style.setProperty("--i", i);
    c.innerHTML =
      '<div class="cr-top"><span class="cr-cat">' + esc(cat) + "</span><span class='cr-aud'>" + esc(who(d)) + "</span><time>" + esc(dmy(it.dueOn || ymd(new Date(it.createdAt)))) + "</time>" +
      (it.status === "open" ? "" : "<span class='cr-off'>Withdrawn</span>") + "</div>" +
      "<h3>" + esc(it.title) + "</h3><p class='cr-body'>" + esc(d.body || "") + "</p>";
    var foot = el("div", "cr-foot");
    var reachBox = el("div", "cr-reach");
    reachBox.innerHTML = withReach ? "<span class='cr-skel'></span>" : "";
    foot.appendChild(reachBox);
    var acts = el("div", "cr-acts");
    if (d.file) { var f = el("button", "cr-file", "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 12.5 12.5 21a5.5 5.5 0 0 1-8-8L13 4.5a3.5 3.5 0 0 1 5 5L9.5 18a1.5 1.5 0 0 1-2-2L15 8.5'/></svg>" + esc(d.file)); f.type = "button"; f.addEventListener("click", function () { download(it); }); acts.appendChild(f); }
    [["WhatsApp", "wa", function () { window.open("https://wa.me/?text=" + encodeURIComponent(text(it)), "_blank", "noopener"); }],
     ["Copy", "", function () { copy(text(it)); }],
     [it.status === "open" ? "Withdraw" : "Reopen", "quiet", function () { IT.update(it.id, { status: it.status === "open" ? "closed" : "open" }).then(function () { K.openAdmin(true, "forms"); }, function (e) { K.toast(e && e.message ? e.message : "That did not save."); }); }]].forEach(function (b) {
      var x = el("button", "cr-btn " + b[1], b[0]); x.type = "button"; x.addEventListener("click", b[2]); acts.appendChild(x);
    });
    foot.appendChild(acts);
    c.appendChild(foot);
    if (withReach && it.status === "open") {
      IT.reach(it.id).then(function (r) {
        reachBox.innerHTML = r.sent ? "<div class='bar'><i style='width:" + (r.percent || 0) + "%'></i></div><span><b>" + (r.percent || 0) + "%</b> opened · " + num(r.read) + " of " + num(r.sent) + (r.groups.families.sent ? " · families " + Math.round(r.groups.families.read / r.groups.families.sent * 100) + "%" : "") + "</span>" : "<span>Nobody it was for has an inbox yet.</span>";
        onReach(r);
      }, function () { reachBox.innerHTML = ""; });
    }
    return c;
  }

  function download(it) {
    IT.get(it.id).then(function (r) {
      var f = (r.files || [])[0];
      if (!f) { K.toast("The attachment is not there."); return; }
      return API.files.get(f.id).then(function (x) {
        var bin = atob(x.data), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        var a = el("a"); a.href = URL.createObjectURL(new Blob([arr], { type: x.type })); a.download = x.name; document.body.appendChild(a); a.click(); a.remove();
      });
    }).then(null, function (e) { K.toast(e && e.message ? e.message : "That did not open."); });
  }

  /* ======================================================== The composer */
  function compose() {
    var box = el("div", "crc");
    var S = { title: "", body: "", cat: "General", aud: "everyone", classes: {}, file: null, date: ymd(new Date()), email: false };
    box.innerHTML =
      '<div class="crc-main"><h2>New circular</h2><p class="sub">Write it once. It reaches each family\'s inbox, and you will see who opened it.</p>' +
      '<label class="crc-f"><span>Title</span><input data-f="title" maxlength="160" placeholder="Winter timings from 1 November"></label>' +
      '<label class="crc-f"><span>Message</span><textarea data-f="body" rows="6" placeholder="What families need to know, and what to do."></textarea></label>' +
      '<div class="crc-f"><span>Category</span><div class="crc-chips" data-cats></div></div>' +
      '<div class="crc-f"><span>Who it is for</span><div class="cn-seg" data-aud></div></div>' +
      '<div class="crc-f" data-classwrap><span>Which classes <em>blank means every class</em></span><div class="crc-chips" data-classes><i class="crc-load">Reading the sections…</i></div></div>' +
      '<div class="crc-two"><label class="crc-f"><span>Date on the circular</span><input type="date" data-f="date"></label>' +
      '<div class="crc-f"><span>Attachment <em>PDF or photo, up to 800 KB</em></span><label class="crc-file"><input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp"><b data-fname>Choose a file</b></label></div></div>' +
      '<div class="crc-f"><span>How it is sent</span><div class="crc-chan" data-chan></div></div>' +
      '<div class="crc-err" hidden></div>' +
      '<div class="crc-acts"></div></div>' +
      '<aside class="crc-side"><span class="lab">How a family sees it</span><div class="crc-phone"><div class="app"><div class="hd"><i></i><b data-pschool></b></div><article><em data-pcat>General</em><h4 data-ptitle>Your title</h4><p data-pbody>Your message appears here as you write it.</p><small data-pfoot></small></article></div></div></aside>';
    var sheet = K.cxSheet(box);
    var q = function (s) { return box.querySelector(s); };
    box.querySelector("[data-pschool]").textContent = K.schoolName();

    var cats = q("[data-cats]");
    CATEGORIES.forEach(function (c) {
      var b = el("button", "crc-chip" + (c[0] === S.cat ? " on" : ""), c[0]); b.type = "button"; b.dataset.hue = c[1];
      b.addEventListener("click", function () { S.cat = c[0]; [].forEach.call(cats.children, function (x) { x.classList.toggle("on", x === b); }); preview(); });
      cats.appendChild(b);
    });
    var aud = q("[data-aud]");
    [["everyone", "Everyone"], ["families", "Families"], ["students", "Students"], ["staff", "Staff"]].forEach(function (a) {
      var b = el("button", "cn-segb" + (a[0] === S.aud ? " on" : ""), a[1]); b.type = "button";
      b.addEventListener("click", function () { S.aud = a[0]; [].forEach.call(aud.children, function (x) { x.classList.toggle("on", x === b); }); q("[data-classwrap]").hidden = a[0] === "staff"; preview(); });
      aud.appendChild(b);
    });
    API.india.classes().then(function (r) {
      var host = q("[data-classes]"); host.innerHTML = "";
      r.classes.forEach(function (c) {
        var b = el("button", "crc-chip", esc(c.label)); b.type = "button";
        b.addEventListener("click", function () { if (S.classes[c.label]) delete S.classes[c.label]; else S.classes[c.label] = 1; b.classList.toggle("on", !!S.classes[c.label]); preview(); });
        host.appendChild(b);
      });
    }, function () { q("[data-classes]").innerHTML = "<i class='crc-load'>The sections could not be read.</i>"; });

    var chan = q("[data-chan]");
    chan.innerHTML =
      "<div class='on'><b>The OEdu app</b><span>Every family and every member of staff. Always.</span></div>" +
      "<label class='opt'><input type='checkbox' data-email><b>Email</b><span>To those who have email notices on, through the Outbox. Held there until the school connects a mail service.</span></label>" +
      "<div class='off'><b>SMS</b><span>Needs a sender registered with the telecom regulator. Not connected.</span></div>" +
      "<div class='off'><b>WhatsApp</b><span>Needs a WhatsApp Business account. Not connected. After sending, <u>Share on WhatsApp</u> opens the text ready to forward.</span></div>";
    chan.querySelector("[data-email]").addEventListener("change", function (e) { S.email = e.target.checked; });

    [].forEach.call(box.querySelectorAll("[data-f]"), function (i) { i.value = S[i.dataset.f]; i.addEventListener("input", function () { S[i.dataset.f] = i.value; preview(); }); });
    var fileIn = box.querySelector("input[type=file]");
    fileIn.addEventListener("change", function () {
      var f = fileIn.files[0];
      if (!f) { S.file = null; q("[data-fname]").textContent = "Choose a file"; return; }
      if (f.size > 800 * 1024) { fileIn.value = ""; S.file = null; q("[data-fname]").textContent = "Too large: 800 KB at most"; return; }
      var rd = new FileReader();
      rd.onload = function () { S.file = { name: f.name, type: f.type || "application/pdf", data: String(rd.result).split(",")[1] }; q("[data-fname]").textContent = f.name; preview(); };
      rd.readAsDataURL(f);
    });
    function preview() {
      var cl = Object.keys(S.classes).join(", ");
      q("[data-pcat]").textContent = S.cat; q("[data-pcat]").dataset.hue = HUE[S.cat];
      q("[data-ptitle]").textContent = S.title || "Your title"; q("[data-pbody]").textContent = S.body || "Your message appears here as you write it.";
      q("[data-pfoot]").textContent = who({ audience: S.aud, classes: cl }) + " · " + dmy(S.date || ymd(new Date())) + (S.file ? " · 📎 " + S.file.name : "");
    }
    preview();

    var acts = q(".crc-acts"), err = q(".crc-err");
    var send = U.btn("Send the circular", "strong", function () {
      err.hidden = true;
      if (!S.title.trim()) { err.textContent = "Give it a title."; err.hidden = false; return; }
      if (!S.body.trim()) { err.textContent = "Write the message."; err.hidden = false; return; }
      send.disabled = true; send.textContent = "Sending…";
      var data = { body: S.body.trim(), audience: S.aud, category: S.cat, classes: S.aud === "staff" ? "" : Object.keys(S.classes).join(", "), channels: S.email ? "email" : "" };
      IT.create({ kind: "form", title: S.title.trim(), status: "open", dueOn: S.date || null, data: data }).then(function (it) {
        if (!S.file) return it;
        return API.files.put({ ownerKind: "item", ownerId: it.id, name: S.file.name, type: S.file.type, data: S.file.data })
          .then(function () { data.file = S.file.name; return IT.update(it.id, { data: data }); });
      }).then(function () { sheet.close(); K.toast("Sent."); K.openAdmin(true, "forms"); }, function (e) { send.disabled = false; send.textContent = "Send the circular"; err.textContent = e && e.message ? e.message : "That did not send."; err.hidden = false; });
    });
    var cancel = U.btn("Cancel", "quiet", function () { sheet.close(); });
    acts.appendChild(cancel); acts.appendChild(send);
  }

  return { circulars: circulars };
};
