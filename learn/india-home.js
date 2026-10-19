/* ==========================================================================
   OEdu — the principal's desk, for an Indian school.

   The first screen an administrator sees. It is not a report: it answers
   "what does my school need from me today?" in the order a head of school
   asks it — are the children in, what is waiting on my signature, who is
   slipping, what is coming. A school in India does not run on courses and
   letter grades, so this does not read them; it reads the section registers,
   the exam cycle, the certificate and leave queues, admissions and the
   identity records, and says nothing it did not read.

   Every number is the server's, from the places the console already reads
   (api/src/routes/register.js, exams.js, items.js, enrollment.js, india.js).
   A card whose source cannot be read says so and the rest still draw.

   Mounted by app.js with the console kit: OPLO_INDIA_HOME(kit) → { home }.
   ========================================================================== */
window.OPLO_INDIA_HOME = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, go = K.openAdmin;
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------ Pieces */
  function num(n) { return Number(n || 0).toLocaleString("en-IN"); }
  function plural(n, a, b) { return num(n) + " " + (n === 1 ? a : b || a + "s"); }
  function pct(a, b) { return b ? Math.round(a / b * 1000) / 10 : null; }
  function ymd(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function dayName(iso) { return new Date(iso + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }); }
  function short(iso) { return new Date(iso + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" }); }
  function icon(name) { return K.icon(name); }
  function soft(p) { return p.catch(function () { return null; }); }

  /* A number that counts up to itself, once, unless the person asked for stillness. */
  function countTo(node, to, dec) {
    var fmt = function (n) { return dec ? n.toFixed(dec) : num(Math.round(n)); };
    if (REDUCED || !isFinite(to)) { node.textContent = fmt(to); return; }
    var t0 = null, dur = 900;
    function tick(t) {
      if (t0 == null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      node.textContent = fmt(to * e);
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* A ring: a quiet track and one solid arc. */
  function ring(p, size, stroke, color) {
    var r = (size - stroke) / 2, C = 2 * Math.PI * r, off = C * (1 - Math.max(0, Math.min(100, p)) / 100);
    return '<svg class="ih-ring" viewBox="0 0 ' + size + " " + size + '" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<circle class="trk" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"/>' +
      '<circle class="arc" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke + '" stroke-linecap="round" ' +
      'stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (REDUCED ? off : C).toFixed(1) + '" transform="rotate(-90 ' + size / 2 + " " + size / 2 + ')" data-off="' + off.toFixed(1) + '"/></svg>';
  }
  function settle(root) {
    [].forEach.call(root.querySelectorAll(".ih-ring .arc"), function (a) {
      requestAnimationFrame(function () { requestAnimationFrame(function () { a.style.strokeDashoffset = a.getAttribute("data-off"); }); });
    });
  }

  /* A smooth line for a series of numbers, with a faint flat wash under it. */
  function area(vals, w, h, lo, hi, color) {
    if (vals.length < 2) return "";
    var pad = 4, step = (w - pad * 2) / (vals.length - 1);
    var pts = vals.map(function (v, i) { return [pad + i * step, h - pad - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo || 1) * (h - pad * 2)]; });
    var d = "M" + pts[0][0] + "," + pts[0][1];
    for (var i = 1; i < pts.length; i++) {
      var p0 = pts[i - 1], p1 = pts[i], mx = (p0[0] + p1[0]) / 2;
      d += " C" + mx + "," + p0[1] + " " + mx + "," + p1[1] + " " + p1[0] + "," + p1[1];
    }
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="100%" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + d + " L" + pts[pts.length - 1][0] + "," + h + " L" + pts[0][0] + "," + h + ' Z" fill="' + color + '" fill-opacity=".07"/>' +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
      '<circle cx="' + pts[pts.length - 1][0] + '" cy="' + pts[pts.length - 1][1] + '" r="3.6" fill="#fff" stroke="' + color + '" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  }

  function card(cls, title, hue, more) {
    var c = el("section", "ih-card " + cls);
    if (hue) c.dataset.hue = hue;
    if (title) {
      var h = el("header", "ih-ch");
      h.innerHTML = "<h3>" + esc(title) + "</h3>";
      if (more) {
        var b = el("button", "more", esc(more[0]) + " ›");
        b.type = "button";
        b.addEventListener("click", more[1]);
        h.appendChild(b);
      }
      c.appendChild(h);
    }
    return c;
  }
  function shimmer(c, n) {
    var s = el("div", "ih-skel");
    for (var i = 0; i < (n || 3); i++) s.appendChild(el("i", "cx-skel"));
    c.appendChild(s);
    return s;
  }
  function quiet(c, text) { c.appendChild(el("p", "ih-quiet", esc(text))); }

  /* ================================================================= Home */
  function home(v) {
    var me = K.me() || {}, P = {};   // each source, read once, shared by the cards that need it
    P.reg = soft(API.register.classes());
    P.pulse = soft(API.register.pulse(30));
    P.watch = soft(API.register.watch());
    P.early = soft(API.register.early());
    P.papers = soft(API.exams.papers());
    P.certs = soft(API.items.list({ kind: "certificate", limit: 200 }));
    P.leave = soft(API.items.list({ kind: "leave", limit: 200 }));
    P.cover = soft(API.items.list({ kind: "substitute", limit: 200 }));
    P.events = soft(API.items.list({ kind: "event", limit: 200 }));
    P.enroll = soft(API.enrollment.summary());
    P.comp = soft(API.india.compliance());
    P.inbox = soft(API.inbox.unread());

    var root = el("div", "ih");
    v.appendChild(root);

    /* The school's day as one object: today if registers are being taken today,
       otherwise the last day that has any. Everything below reads it. */
    P.day = Promise.all([P.reg, P.pulse]).then(function (r) {
      var reg = r[0], pulse = r[1];
      if (!reg) return null;
      var isToday = reg.schoolDay && reg.schoolDay.kind === "school", dayIso = reg.day;
      var byId = {};
      var latest = pulse && pulse.latest;
      if (latest) latest.classes.forEach(function (c) { byId[c.id] = c; });
      var useLatest = !isToday || !reg.classes.some(function (c) { return c.taken; });
      var classes = reg.classes.map(function (c) {
        var x = byId[c.id], showing = (isToday && c.taken) || (useLatest && x);
        var here = showing && x ? x : null;
        return { id: c.id, label: c.label, strength: c.strength, teacher: c.classTeacher && c.classTeacher.name, taken: !!c.taken,
                 present: here ? here.present : 0, marked: here ? here.marked : 0, pct: here && here.marked ? pct(here.present, here.marked) : null };
      });
      var inCount = reg.classes.filter(function (c) { return c.taken; }).length;
      var tot = classes.reduce(function (a, c) { a.p += c.present; a.m += c.marked; return a; }, { p: 0, m: 0 });
      return { reg: reg, isToday: isToday, dayIso: useLatest && latest ? latest.day : dayIso, classes: classes, in: inCount, total: reg.classes.length,
               pct: tot.m ? pct(tot.p, tot.m) : null, present: tot.p, away: tot.m - tot.p, children: reg.classes.reduce(function (a, c) { return a + c.strength; }, 0), showingLatest: useLatest && !!latest };
    });

    /* ----- Hero */
    var hero = el("section", "ih-hero");
    hero.innerHTML =
      '<div class="ih-hero-art" aria-hidden="true"><i></i><i></i><i></i></div>' +
      '<div class="ih-hero-main">' +
        '<div class="ih-chips"><span class="ih-chip"><i></i>' + esc(new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })) + "</span>" +
        '<span class="ih-chip ghost" data-slot="term"></span></div>' +
        "<h1>" + esc(K.greeting()) + ", " + esc(me.first || String(me.name || "").split(" ")[0]) + ".</h1>" +
        '<p class="ih-lede" data-slot="lede">Reading your school…</p>' +
        '<div class="ih-hero-acts"></div>' +
      "</div>" +
      '<div class="ih-hero-ring" data-slot="ring"><div class="ih-ringwrap">' + ring(0, 176, 10, "#30d158") + "<b>–</b></div></div>";
    root.appendChild(hero);
    var acts = hero.querySelector(".ih-hero-acts");
    function heroBtn(label, cls, fn) { var b = el("button", "ih-hbtn " + cls, label); b.type = "button"; b.addEventListener("click", fn); acts.appendChild(b); }
    heroBtn("Class registers", "solid", function () { go(false, "in-register"); });
    heroBtn("Add a child", "glass", function () { K.addPerson(); });
    heroBtn("Write a circular", "glass", function () { go(false, "forms"); });
    var prof = ((me.orgs || [])[0] || {}).profile || {}, now = new Date(), sm = prof.yearStartMonth || 4;
    var y0 = now.getMonth() + 1 >= sm ? now.getFullYear() : now.getFullYear() - 1;
    hero.querySelector('[data-slot="term"]').textContent = y0 + "–" + String(y0 + 1).slice(2) + (prof.boards && prof.boards.length ? " · " + prof.boards.join(", ") : "");

    P.day.then(function (d) {
      var lede = hero.querySelector('[data-slot="lede"]'), ringBox = hero.querySelector('[data-slot="ring"]');
      if (!d) { lede.textContent = "The registers could not be read just now."; ringBox.innerHTML = ""; return; }
      if (!d.total) { lede.textContent = "No sections yet. Make the school's classes and seat the children, and this page fills with what your day is."; ringBox.innerHTML = ""; return; }
      var line = d.isToday
        ? (d.in === d.total ? "Every register is in. " : plural(d.in, "register is", "registers are") + " in so far, " + (d.total - d.in) + " to come. ")
        : "No school today; this is " + dayName(d.dayIso) + ". ";
      lede.textContent = line + "Below is what is waiting on you.";
      var small = d.isToday && d.in ? "present today" : "present on " + short(d.dayIso);
      ringBox.innerHTML = '<div class="ih-ringwrap">' + ring(d.pct || 0, 176, 10, "#30d158") + '<b><span data-n></span><small>%</small></b></div>' +
        '<div class="ih-ringcap"><strong>' + esc(small) + "</strong><span>" + num(d.present) + " here · " + num(d.away) + " away</span><span>" + d.in + " of " + d.total + " registers" + (d.isToday ? " in" : "") + "</span></div>";
      countTo(ringBox.querySelector("[data-n]"), d.pct || 0, 1);
      settle(ringBox);
    });

    /* ----- KPI strip */
    var kpis = el("div", "ih-kpis");
    root.appendChild(kpis);
    function kpi(hue, ic, label, key) {
      var k = el("button", "ih-kpi");
      k.type = "button";
      k.dataset.hue = hue;
      k.innerHTML = '<span class="ic">' + icon(ic) + "</span><span class='lab'>" + esc(label) + "</span><b data-v>–</b><em data-sub>&nbsp;</em><span class='viz' data-viz></span>";
      kpis.appendChild(k);
      return k;
    }
    function fill(k, value, sub, viz, to, dec, unit) {
      var b = k.querySelector("[data-v]");
      b.innerHTML = '<span data-n></span>' + (unit ? "<small>" + unit + "</small>" : "");
      countTo(b.querySelector("[data-n]"), value, dec);
      k.querySelector("[data-sub]").innerHTML = sub;
      if (viz != null) k.querySelector("[data-viz]").innerHTML = viz;
      if (to) k.addEventListener("click", to);
    }
    function dead(k, text) { k.querySelector("[data-sub]").textContent = text; }
    var k1 = kpi("indigo", "people", "Children", "c"), k2 = kpi("emerald", "check", "Attendance, 30 days", "a"), k3 = kpi("rose", "alert", "Under 75%", "w"),
        k4 = kpi("violet", "table", "Exam papers published", "e"), k5 = kpi("amber", "heart", "Early warnings", "x"), k6 = kpi("teal", "shield", "Identity records", "i");

    P.day.then(function (d) {
      if (!d) return dead(k1, "not readable");
      fill(k1, d.children, plural(d.total, "section") + " · " + plural(d.classes.filter(function (c) { return c.strength > 36; }).length, "near full", "near full"), null, function () { go(false, "in-classes"); });
      k1.querySelector("[data-sub]").textContent = plural(d.total, "section") + " this year";
    });
    P.pulse.then(function (p) {
      if (!p || !p.days.length) return dead(k2, "no registers yet");
      var series = p.days.map(function (x) { return pct(x.present, x.marked); }), avg = series.reduce(function (a, b) { return a + b; }, 0) / series.length;
      fill(k2, avg, "across " + plural(p.days.length, "school day"), area(series, 120, 38, Math.max(70, Math.min.apply(null, series) - 4), 100, "#0071e3"), function () { go(false, "in-register"); }, 1, "%");
    });
    P.watch.then(function (w) {
      if (!w) return dead(k3, "not readable");
      var s = w.summary;
      fill(k3, s.below, s.watch ? plural(s.watch, "child") + " close to the line" : "of " + num(s.below + s.watch + s.ok + (s.none || 0)) + " children", null, function () { go(false, "in-watch"); });
      k3.classList.toggle("alarm", s.below > 0);
    });
    P.papers.then(function (r) {
      if (!r) return dead(k4, "not readable");
      var ps = r.papers || [], pub = ps.filter(function (p) { return p.state === "published"; }).length;
      fill(k4, pub, "of " + plural(ps.length, "paper") + " across all sections", '<span class="bar"><i style="width:' + (ps.length ? pub / ps.length * 100 : 0) + '%"></i></span>', function () { go(false, "in-exams"); });
    });
    P.early.then(function (r) {
      if (!r) return dead(k5, "not readable");
      var s = r.summary;
      fill(k5, s.high + s.medium, plural(s.high, "high") + " · " + plural(s.medium, "medium"), null, function () { go(false, "in-ews"); });
    });
    P.comp.then(function (r) {
      if (!r) return dead(k6, "not readable");
      var s = r.summary;
      fill(k6, s.apaarAnswered || 0, "APAAR answered · consent " + (s.consentVerified || 0) + "% verified", '<span class="bar"><i style="width:' + (s.apaarAnswered || 0) + '%"></i></span>', function () { go(false, "in-compliance"); }, 1, "%");
    });

    /* ----- Row: needs you + registers today */
    var row1 = el("div", "ih-row");
    root.appendChild(row1);
    var needs = card("ih-needs", "Needs you", "amber");
    needs.querySelector(".ih-ch").insertAdjacentHTML("beforeend", '<small data-count></small>');
    shimmer(needs, 4);
    row1.appendChild(needs);
    var stack = el("div", "ih-stack");
    row1.appendChild(stack);
    var board = card("ih-board", "Registers", "emerald", ["All registers", function () { go(false, "in-register"); }]);
    shimmer(board, 3);
    stack.appendChild(board);
    var quick = card("ih-quick", "Start something", "indigo");
    var qgrid = el("div", "ih-qgrid");
    [["emerald", "check", "Take a register", function () { go(false, "in-register"); }],
     ["blue", "people", "Add a child", function () { K.addPerson(); }],
     ["orange", "doc", "Certificate request", function () { go(false, "in-certs"); }],
     ["amber", "mail", "Write a circular", function () { go(false, "forms"); }],
     ["violet", "table", "Exam papers", function () { go(false, "in-exams"); }],
     ["teal", "server", "Load from a file", function () { go(false, "imports"); }]].forEach(function (q, i) {
      var b = el("button", "ih-q");
      b.type = "button"; b.dataset.hue = q[0]; b.style.setProperty("--i", i);
      b.innerHTML = '<span class="ic">' + icon(q[1]) + "</span><b>" + esc(q[2]) + "</b>";
      b.addEventListener("click", q[3]);
      qgrid.appendChild(b);
    });
    quick.appendChild(qgrid);
    stack.appendChild(quick);

    Promise.all([P.papers, P.certs, P.leave, P.cover, P.enroll, P.watch, P.early, P.comp, P.day, P.inbox]).then(function (r) {
      var papers = (r[0] && r[0].papers) || [], certs = r[1] || [], leave = r[2] || [], cover = r[3] || [], enr = r[4], watch = r[5], early = r[6], comp = r[7], d = r[8], inbox = r[9];
      var items = [];
      function by(arr, key, val) { return arr.filter(function (x) { return x[key] === val; }); }
      var checked = by(papers, "state", "checked").length, submitted = by(papers, "state", "submitted").length, approved = by(papers, "state", "approved").length;
      if (checked) items.push({ hue: "violet", ic: "check", t: plural(checked, "paper") + " waiting for your approval", s: "Checked by the dean; the principal approves.", to: "in-exams", tone: "now" });
      if (approved) items.push({ hue: "blue", ic: "doc", t: plural(approved, "paper") + " ready to publish", s: "Approved. Publishing makes the report cards readable.", to: "in-exams", tone: "now" });
      if (submitted) items.push({ hue: "sky", ic: "pencil", t: plural(submitted, "paper") + " waiting to be checked", s: "Handed in by teachers.", to: "in-exams", tone: "soon" });
      var sign = by(certs, "status", "awaiting signature"), req = by(certs, "status", "requested");
      if (sign.length) items.push({ hue: "orange", ic: "pencil", t: plural(sign.length, "certificate") + " awaiting your signature", s: sign.slice(0, 2).map(function (c) { return c.subjectName || c.title; }).join(", ") + (sign.length > 2 ? " and more" : ""), to: "in-certs", tone: "now" });
      if (req.length) items.push({ hue: "amber", ic: "doc", t: plural(req.length, "certificate request"), s: "To prepare and send for signature.", to: "in-certs", tone: "soon" });
      var pend = by(leave, "status", "pending");
      if (pend.length) items.push({ hue: "fuchsia", ic: "calendar", t: plural(pend.length, "leave request") + " to answer", s: pend.slice(0, 2).map(function (c) { return c.subjectName || c.title; }).join(", "), to: "leave", tone: "now" });
      var need = by(cover, "status", "needed");
      if (need.length) items.push({ hue: "rose", ic: "alert", t: plural(need.length, "class") + " need cover", s: need.slice(0, 2).map(function (c) { return c.subjectName || c.title; }).join(", ") + " is away", to: "cover", tone: "now" });
      if (d && d.isToday && d.total - d.in > 0) items.push({ hue: "emerald", ic: "clock", t: plural(d.total - d.in, "register") + " not in yet", s: d.classes.filter(function (c) { return !c.taken; }).slice(0, 4).map(function (c) { return c.label; }).join(", "), to: "in-register", tone: "soon" });
      if (enr && enr.applications) {
        var a = enr.applications, n = (a.awaitingReview || 0) + (a.awaitingDecision || 0) + (a.readyToEnroll || 0);
        if (n) items.push({ hue: "blue", ic: "people", t: plural(n, "admission") + " to move on", s: (a.awaitingReview ? a.awaitingReview + " to review · " : "") + (a.awaitingDecision ? a.awaitingDecision + " to decide · " : "") + (a.readyToEnroll || 0) + " ready to enrol", to: "enrollment", tone: "soon" });
      }
      if (watch && watch.summary.below) items.push({ hue: "rose", ic: "heart", t: plural(watch.summary.below, "child", "children") + " under 75% attendance", s: "Condonation papers can still be started.", to: "in-watch", tone: "now" });
      if (early && early.summary.high) items.push({ hue: "red", ic: "alert", t: plural(early.summary.high, "child", "children") + " at high risk of leaving", s: "Marks, attendance and age together.", to: "in-ews", tone: "now" });
      if (comp && comp.summary && comp.summary.blocked) items.push({ hue: "teal", ic: "shield", t: plural(comp.summary.blocked, "record") + " would block a board list", s: "No PEN, APAAR, date of birth or category.", to: "in-compliance", tone: "soon" });
      // API.inbox.unread() already answers with the count itself.
      if (inbox > 0) items.push({ hue: "indigo", ic: "mail", t: plural(inbox, "unread message"), s: "In your inbox.", to: "inbox", tone: "soon" });
      var order = { now: 0, soon: 1 };
      items.sort(function (a, b) { return order[a.tone] - order[b.tone]; });

      needs.querySelector(".ih-skel").remove();
      var cnt = needs.querySelector("[data-count]");
      cnt.textContent = items.length ? plural(items.filter(function (x) { return x.tone === "now"; }).length, "to decide") + " · " + items.length + " in all" : "";
      if (!items.length) {
        needs.appendChild(el("div", "ih-clear", '<span>' + icon("check") + "</span><b>Nothing is waiting on you.</b><em>Registers are in, papers are moving, queues are empty.</em>"));
        return;
      }
      var list = el("div", "ih-list"), SHOW = 6;
      items.forEach(function (x, i) {
        var b = el("button", "ih-need " + x.tone + (i >= SHOW ? " more" : ""));
        b.type = "button";
        b.dataset.hue = x.hue;
        b.style.setProperty("--i", i);
        b.innerHTML = '<span class="ic">' + icon(x.ic) + '</span><span class="t"><b>' + esc(x.t) + "</b><span>" + esc(x.s) + '</span></span><span class="go">' + (x.tone === "now" ? "Decide" : "Open") + " ›</span>";
        b.addEventListener("click", function () { go(false, x.to); });
        list.appendChild(b);
      });
      needs.appendChild(list);
      if (items.length > SHOW) {
        var all = el("button", "ih-all", "Show " + (items.length - SHOW) + " more");
        all.type = "button";
        all.addEventListener("click", function () {
          var open = list.classList.toggle("all");
          all.textContent = open ? "Show fewer" : "Show " + (items.length - SHOW) + " more";
        });
        needs.appendChild(all);
      }
    });

    P.day.then(function (d) {
      board.querySelector(".ih-skel").remove();
      if (!d || !d.total) { quiet(board, d ? "No sections yet." : "The registers could not be read."); return; }
      var head = board.querySelector(".ih-ch h3");
      head.textContent = d.isToday ? "Registers today" : "Registers · " + short(d.dayIso);
      var sum = el("p", "ih-boardsum", d.isToday ? "<b>" + d.in + "</b> of " + d.total + " in" : "Showing the last school day");
      board.appendChild(sum);
      var grid = el("div", "ih-tiles");
      d.classes.forEach(function (c, i) {
        var t = el("button", "ih-tile" + (c.marked || c.taken ? "" : " wait") + (c.pct != null ? (c.pct >= 95 ? " hi" : c.pct >= 88 ? " mid" : " lo") : ""));
        t.type = "button";
        t.style.setProperty("--i", i);
        t.title = c.label + (c.teacher ? " · " + c.teacher : "") + (c.pct != null ? " · " + c.pct + "% present" : " · register not in");
        t.innerHTML = "<b>" + esc(c.label) + "</b><span>" + (c.pct != null ? Math.round(c.pct) + "%" : "–") + "</span><i style='width:" + (c.pct != null ? Math.max(6, c.pct) : 0) + "%'></i>";
        t.addEventListener("click", function () { K.register(c.id, d.reg.day); });
        grid.appendChild(t);
      });
      board.appendChild(grid);
      var leg = el("div", "ih-legend", "<span class='hi'>95%+</span><span class='mid'>88–95</span><span class='lo'>under 88</span><span class='wait'>not in</span>");
      board.appendChild(leg);
    });

    /* ----- Row: attendance curve + exam cycle */
    var row2 = el("div", "ih-row two");
    root.appendChild(row2);
    var trend = card("ih-trend", "Attendance, school-wide", "emerald", ["Class registers", function () { go(false, "in-register"); }]);
    shimmer(trend, 2);
    row2.appendChild(trend);
    var cycle = card("ih-cycle", "Exam cycle", "violet", ["Exams", function () { go(false, "in-exams"); }]);
    shimmer(cycle, 3);
    row2.appendChild(cycle);

    P.pulse.then(function (p) {
      trend.querySelector(".ih-skel").remove();
      if (!p || p.days.length < 2) { quiet(trend, "A curve needs a few days of registers."); return; }
      var series = p.days.map(function (x) { return pct(x.present, x.marked); }), lo = Math.floor(Math.min.apply(null, series)) - 2, hi = 100;
      var avg = series.reduce(function (a, b) { return a + b; }, 0) / series.length, last = series[series.length - 1], first = series[0];
      var head = el("div", "ih-trendhead", "<div><b>" + last.toFixed(1) + "<small>%</small></b><span>latest day, " + esc(short(p.days[p.days.length - 1].day)) + "</span></div>" +
        "<div><b>" + avg.toFixed(1) + "<small>%</small></b><span>average over " + p.days.length + " days</span></div>" +
        "<div><b class='" + (last >= first ? "up" : "down") + "'>" + (last >= first ? "▲" : "▼") + " " + Math.abs(last - first).toFixed(1) + "</b><span>since " + esc(short(p.days[0].day)) + "</span></div>");
      trend.appendChild(head);
      var chart = el("div", "ih-chartbox");
      chart.innerHTML = area(series, 640, 150, lo, hi, "#0071e3");
      var axis = el("div", "ih-axis", "<span>" + esc(short(p.days[0].day)) + "</span><span>" + esc(short(p.days[Math.floor(p.days.length / 2)].day)) + "</span><span>" + esc(short(p.days[p.days.length - 1].day)) + "</span>");
      trend.appendChild(chart); trend.appendChild(axis);
    });

    P.papers.then(function (r) {
      cycle.querySelector(".ih-skel").remove();
      var ps = (r && r.papers) || [];
      if (!r) { quiet(cycle, "Papers could not be read."); return; }
      if (!ps.length) { quiet(cycle, "No exam is set up. Make an exam and its papers under Academics."); return; }
      var stages = [["entry", "With teachers", "sky"], ["submitted", "Handed in", "blue"], ["checked", "Checked", "indigo"], ["approved", "Approved", "violet"], ["published", "Published", "emerald"]];
      var counts = {};
      stages.forEach(function (s) { counts[s[0]] = ps.filter(function (p) { return p.state === s[0]; }).length; });
      cycle.querySelector(".ih-ch").insertAdjacentHTML("beforeend", "<small>" + esc(ps[0].exam || "") + "</small>");
      var fun = el("div", "ih-funnel");
      stages.forEach(function (s, i) {
        var n = counts[s[0]], seg = el("div", "stage" + (n ? "" : " zero"));
        seg.dataset.hue = s[2];
        seg.style.setProperty("--i", i);
        seg.innerHTML = "<b>" + n + "</b><div class='bar'><i style='height:" + (n ? Math.max(10, Math.round(n / ps.length * 100)) : 4) + "%'></i></div><span>" + esc(s[1]) + "</span>";
        fun.appendChild(seg);
      });
      cycle.appendChild(fun);
      cycle.appendChild(el("p", "ih-quiet", plural(ps.length, "paper") + " in " + new Set(ps.map(function (p) { return p.classId; })).size + " sections. A paper moves one step at a time: the teacher hands it in, a dean checks, the principal approves, the office publishes."));
    });

    /* ----- Row: who needs a look + coming up */
    var row3 = el("div", "ih-row");
    root.appendChild(row3);
    var look = card("ih-look", "Who needs a look", "rose", ["Early warning", function () { go(false, "in-ews"); }]);
    shimmer(look, 4);
    row3.appendChild(look);
    var soon = card("ih-soon", "Coming up", "sky", ["Events", function () { go(false, "events"); }]);
    shimmer(soon, 4);
    row3.appendChild(soon);

    P.early.then(function (r) {
      look.querySelector(".ih-skel").remove();
      if (!r) { quiet(look, "The early-warning list could not be read."); return; }
      var kids = (r.students || []).filter(function (s) { return s.level === "high" || s.level === "medium"; }).slice(0, 6);
      if (!kids.length) { quiet(look, "Nobody is on the early-warning list."); return; }
      var list = el("div", "ih-people");
      kids.forEach(function (s, i) {
        var b = el("button", "ih-person");
        b.type = "button";
        b.style.setProperty("--i", i);
        var why = (s.signals || []).map(function (x) { return x.text; })[0] || "";
        b.innerHTML = '<span class="av" data-lv="' + esc(s.level) + '">' + esc((s.name || "?").split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("")) + "</span>" +
          '<span class="t"><b>' + esc(s.name) + "</b><span>" + esc(s.classLabel || "") + (s.rollNo ? " · roll " + s.rollNo : "") + " · " + esc(why) + "</span></span>" +
          '<span class="lv ' + esc(s.level) + '">' + (s.level === "high" ? "High" : "Medium") + "</span>";
        b.addEventListener("click", function () { K.student({ id: s.id, name: s.name }); });
        list.appendChild(b);
      });
      look.appendChild(list);
    });

    Promise.all([P.events, P.certs, P.leave, P.cover, P.enroll]).then(function (r) {
      soon.querySelector(".ih-skel").remove();
      var today = ymd(new Date()), rows = [];
      (r[0] || []).filter(function (e) { return e.status !== "canceled" && e.dueOn && e.dueOn >= today; }).forEach(function (e) {
        rows.push({ day: e.dueOn, t: e.title, s: [e.data && e.data.place, e.data && e.data.audience && e.data.audience !== "everyone" ? "for " + e.data.audience : "", e.data && e.data.start].filter(Boolean).join(" · "), hue: "sky", ic: "calendar", to: "events" });
      });
      (r[1] || []).filter(function (c) { return (c.status === "requested" || c.status === "awaiting signature") && c.dueOn; }).forEach(function (c) {
        rows.push({ day: c.dueOn, t: "Due: " + (c.data && c.data.type || "certificate") + " for " + (c.subjectName || ""), s: c.status === "awaiting signature" ? "Awaiting signature" : "Requested", hue: "orange", ic: "doc", to: "in-certs", late: c.dueOn < today });
      });
      (r[2] || []).filter(function (c) { return c.status === "approved" && c.dueOn && c.dueOn >= today; }).forEach(function (c) {
        rows.push({ day: c.dueOn, t: (c.subjectName || "A teacher") + " on leave", s: "Approved" + (c.data && c.data.until && c.data.until !== c.dueOn ? " until " + short(c.data.until) : ""), hue: "fuchsia", ic: "badge", to: "leave" });
      });
      rows.sort(function (a, b) { return a.day < b.day ? -1 : 1; });
      rows = rows.slice(0, 7);
      if (!rows.length) { quiet(soon, "Nothing is dated in the days ahead."); return; }
      var list = el("div", "ih-dated");
      rows.forEach(function (x, i) {
        var b = el("button", "ih-date" + (x.late ? " late" : ""));
        b.type = "button";
        b.dataset.hue = x.hue;
        b.style.setProperty("--i", i);
        var dt = new Date(x.day + "T12:00:00");
        b.innerHTML = '<span class="cal"><em>' + esc(dt.toLocaleDateString(undefined, { month: "short" })) + "</em><b>" + dt.getDate() + '</b></span><span class="t"><b>' + esc(x.t) + "</b><span>" + esc(x.s) + "</span></span>" + (x.late ? '<span class="lv high">Overdue</span>' : "");
        b.addEventListener("click", function () { go(false, x.to); });
        list.appendChild(b);
      });
      soon.appendChild(list);
    });

    // The rings settle once everything above has drawn.
    setTimeout(function () { settle(root); }, 60);
  }

  return { home: home };
};
