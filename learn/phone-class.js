/* ==========================================================================
   OEdu on a phone — the class teacher's day.

   An Indian class teacher does five things for the section each day: take the
   morning register, write the diary, send a word to the families, note a
   remark on a child, and be done. This is one layer for all of it, built to be
   finished in under ten minutes standing in a corridor:

     Register   everyone starts present; one tap for who is away, and why
     Diary      the homework or a note, to the section's families
     Families   a word to all of them, or to one child's, in one tap
     Done       says how long the day took (the school keeps the number)

   Nothing here needs the signal at the moment it is pressed. What is said is
   kept on the phone and sent when the phone is back (learn/offline.js), and the
   last roll of the section is kept so the register can be taken with none.
   Mounted by phone-staff.js: OPLO_PHONE_CLASS(P, F).
   ========================================================================== */
window.OPLO_PHONE_CLASS = function (P, F) {
  "use strict";

  var K = P.K, el = P.el, esc = P.esc, API = K.API, RG = API.register, Q = null;
  function q() { return Q || (Q = window.OPLO_QUEUE.shared()); }
  function dmy(ymd) { return window.OPLO_LOCALE ? window.OPLO_LOCALE.dmy(ymd) : ymd; }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b || a + "s"); }
  function key() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function localDay() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  /* What the teacher is told when there is no signal (D3): where it is, and that it will go by itself. */
  var SAVED = "Saved on this phone, will send when the signal returns.";
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function cta(text, cls, go) { var b = el("button", "ph-cta" + (cls ? " " + cls : ""), esc(text)); b.type = "button"; b.addEventListener("click", go); return b; }
  function chipBtn(text, on, go) { var b = el("button", "ph-chk pc-chip" + (on ? " on" : ""), esc(text)); b.type = "button"; b.addEventListener("click", go); return b; }

  /* What was last read of a section, so a register can be taken with no signal. */
  var CK = "oplo.roster.";
  function remember(classId, data) { try { localStorage.setItem(CK + classId, JSON.stringify({ at: Date.now(), data: data })); } catch (e) { /* private window */ } }
  function recall(classId) { try { var v = JSON.parse(localStorage.getItem(CK + classId) || "null"); return v && v.data ? v.data : null; } catch (e) { return null; } }

  function open(classId, label) {
    var key0 = "cd:" + classId;
    K.push("ph:" + key0, label || "My class", function () { P.present(key0, 2, { tone: "teal", label: label || "My class" }, function (L) { build(L, classId); }); });
    return P.present(key0, 2, { tone: "teal", label: label || "My class" }, function (L) { build(L, classId); });
  }
  F.openClassDay = open;

  function build(L, classId) {
    var started = Date.now(), steps = {}, offlineUsed = false, data = null, day = null;
    L.head({ eyebrow: "Your class", title: "Today", sub: "Reading the register…" });
    var bar = L.add(el("div", "pc-bar"));
    var timer = el("span", "pc-timer", "0:00");
    var wait = el("span", "pc-wait");
    bar.appendChild(timer); bar.appendChild(wait);
    var hadWaiting = false;
    function paintWait() {
      var n = q().pending().length, f = q().failed();
      if (n) hadWaiting = true; else if (hadWaiting && !f.length) { hadWaiting = false; P.toast("Sent"); }
      wait.innerHTML = (n ? "<b>" + n + "</b> waiting to send" : "") + (f.length ? (n ? " · " : "") + "<span class='pc-bad'>" + plural(f.length, "thing") + " did not go</span>" : "");
      wait.hidden = !n && !f.length;
    }
    var off = q().onChange(paintWait);
    paintWait();
    var tick = setInterval(function () {
      if (!L.el.isConnected) { clearInterval(tick); off(); return; }
      timer.textContent = mmss((Date.now() - started) / 1000);
    }, 1000);
    var host = L.add(el("div"));
    host.appendChild(P.skel(5, 62));

    function load() {
      return RG.get(classId, null).then(function (r) { remember(classId, r); return r; }, function (e) {
        var c = recall(classId);
        if (e && e.status === 0 && c) { offlineUsed = true; c.cached = true; c.students.forEach(function (s) { s.status = null; s.reason = null; }); c.marked = 0; c.taken = false; c.canEdit = true; c.schoolDay = { kind: "school", label: null }; c.day = c.today = localDay(); return c; }
        throw e;
      });
    }
    load().then(function (r) { data = r; day = r.day; draw(); }, function (e) { P.fail(host, e, function () { L.el.remove(); open(classId, label0()); }); });
    function label0() { return data ? data.class.label : ""; }

    function draw() {
      host.innerHTML = "";
      L.titleEl.innerHTML = "<p class='eb'>" + esc(data.class.label) + " · " + esc(dmy(day)) + "</p><h1>Today</h1><p>" + esc(data.cached ? "Working from the last roll on this phone. It will send when the signal returns." : plural(data.strength, "child", "children")) + "</p>";
      if (data.schoolDay.kind !== "school") host.appendChild(P.note("Not a school day" + (data.schoolDay.label ? " (" + data.schoolDay.label + ")" : "") + ". The register can’t be taken."));
      host.appendChild(P.sh("Register"));
      register();
      host.appendChild(P.sh("Diary"));
      diary();
      host.appendChild(P.sh("Families"));
      families();
      var done = el("div", "ph-btnrow pc-done");
      done.appendChild(cta("I’m done for today", "", finish));
      host.appendChild(done);
    }

    /* ---------------------------------------------------------- Register */
    function register() {
      var codes = data.codes, kind = {};
      codes.forEach(function (c) { kind[c.key] = c.kind; });
      var first = codes[0].key, st = {}, why = {}, dirty = false;
      var main = ["present", "absent", "late"].map(function (k) { return codes.filter(function (c) { return c.key === k; })[0]; }).filter(Boolean);
      var leave = codes.filter(function (c) { return c.kind === "excused"; })[0];
      if (leave) main.push(leave);
      data.students.forEach(function (s) { st[s.id] = s.status || first; why[s.id] = s.reason || null; });
      var tally = el("div", "ph-tally"), list = el("div", "ph-roll");
      host.appendChild(tally); host.appendChild(list);
      function count() {
        var n = { present: 0, tardy: 0, absent: 0, excused: 0 };
        data.students.forEach(function (s) { var k = kind[st[s.id]] || "present"; n[k]++; });
        tally.innerHTML = "<span class='p'><b>" + n.present + "</b> present</span><span class='l'><b>" + n.tardy + "</b> late</span><span class='a'><b>" + n.absent + "</b> absent</span>" + (n.excused ? "<span class='e'><b>" + n.excused + "</b> on leave</span>" : "");
      }
      var save, paints = [];
      data.students.forEach(function (s) {
        var row = el("div", "ph-rr pc-row"), top = el("div", "pc-top");
        top.appendChild(P.shared.avatar(s.name, 34));
        top.appendChild(el("span", "nm", "<b>" + esc(s.name) + "</b><small>" + (s.rollNo ? "Roll " + esc(s.rollNo) : "") + "</small>"));
        var chips = el("span", "ch");
        top.appendChild(chips);
        var reasons = el("div", "pc-reasons");
        row.appendChild(top); row.appendChild(reasons);
        function paint() {
          chips.innerHTML = ""; reasons.innerHTML = "";
          main.forEach(function (c) {
            var b = el("button", "ph-chk " + c.kind + (st[s.id] === c.key ? " on" : ""), esc(c.mark));
            b.type = "button"; b.setAttribute("aria-label", c.label + " — " + s.name); b.setAttribute("aria-pressed", st[s.id] === c.key ? "true" : "false");
            b.addEventListener("click", function () { st[s.id] = c.key; if (kind[c.key] === "present" || kind[c.key] === "tardy") why[s.id] = null; dirty = true; save.disabled = false; paint(); count(); });
            chips.appendChild(b);
          });
          var k = kind[st[s.id]];
          if (k === "absent" || k === "excused") data.reasons.forEach(function (r) { reasons.appendChild(chipBtn(r.label, why[s.id] === r.key, function () { why[s.id] = why[s.id] === r.key ? null : r.key; dirty = true; save.disabled = false; paint(); })); });
        }
        paint(); paints.push(paint);
        list.appendChild(row);
      });
      var dock = el("div", "ph-btnrow pc-regbtns");
      var all = cta("Everyone present", "quiet", function () { data.students.forEach(function (s) { st[s.id] = first; why[s.id] = null; }); dirty = true; save.disabled = false; paints.forEach(function (f) { f(); }); count(); });
      save = cta(data.taken ? "Save changes" : "Save the register", "", function () {
        save.disabled = true;
        var body = { classId: classId, day: day, marks: data.students.map(function (s) { return { accountId: s.id, status: st[s.id], reason: why[s.id] || undefined }; }) };
        q().submit({ label: "Register " + data.class.label + " " + dmy(day), method: "PUT", path: "/register", body: body, merge: "reg:" + classId + ":" + day }).then(function (r) {
          steps.register = true; dirty = false;
          if (r.queued) { offlineUsed = true; P.toast(SAVED); } else P.toast("Register saved");
          save.textContent = r.queued ? "Waiting to send" : "Register in ✓";
          if (r.queued) {
            var mine = "reg:" + classId + ":" + day, stop = q().onChange(function () {
              if (q().pending().some(function (x) { return x.merge === mine; }) || q().failed().some(function (x) { return x.merge === mine; })) return;
              save.textContent = "Register in ✓"; stop();
            });
          }
        }, function (e) { save.disabled = false; P.toast(e && e.message ? e.message : "The register couldn’t be saved."); });
      });
      save.disabled = !!data.taken || data.schoolDay.kind !== "school" || !data.canEdit;
      all.disabled = save.disabled && !!data.taken;
      if (data.taken) save.textContent = "Register in ✓";
      dock.appendChild(all); dock.appendChild(save);
      host.appendChild(dock);
      count();
    }

    /* ------------------------------------------------------------- Diary */
    function diary() {
      var g = P.group();
      var subject = el("input"); subject.type = "text"; subject.placeholder = "Subject (optional)"; subject.maxLength = 60;
      var text = el("textarea"); text.rows = 3; text.maxLength = 1500; text.placeholder = "Homework or a note for the families";
      var kindSel = el("select"); [["homework", "Homework"], ["note", "Note"], ["circular", "Circular"]].forEach(function (x) { var o = el("option"); o.value = x[0]; o.textContent = x[1]; kindSel.appendChild(o); });
      [kindSel, subject, text].forEach(function (n) { n.className = "pc-in"; g.appendChild(n); });
      host.appendChild(g);
      var send = cta("Send to the diary", "quiet", function () {
        if (!text.value.trim()) { P.toast("Write something first."); return; }
        send.disabled = true;
        q().submit({ label: "Diary " + data.class.label, method: "POST", path: "/diary", body: { classId: classId, day: day, kind: kindSel.value, subject: subject.value.trim() || undefined, body: text.value.trim(), clientKey: key() } }).then(function (r) {
          steps.diary = true; text.value = ""; send.disabled = false;
          if (r.queued) { offlineUsed = true; P.toast(SAVED); } else P.toast("In the diary");
        }, function (e) { send.disabled = false; P.toast(e && e.message ? e.message : "That didn’t send."); });
      });
      host.appendChild(el("div", "ph-btnrow")).appendChild(send);
    }

    /* ---------------------------------------------------------- Families */
    var QUICK = ["Please send the signed circular tomorrow.", "School closes early tomorrow. Please arrange pick-up.", "Please bring the project work on Monday.", "Please meet me at school this week."];
    function families() {
      var g = P.group();
      var text = el("textarea"); text.rows = 2; text.maxLength = 800; text.placeholder = "A word to every family of " + data.class.label; text.className = "pc-in";
      var quick = el("div", "pc-quick");
      QUICK.forEach(function (m) { quick.appendChild(chipBtn(m, false, function () { text.value = m; })); });
      g.appendChild(quick); g.appendChild(text);
      host.appendChild(g);
      var send = cta("Send to all families", "quiet", function () {
        if (!text.value.trim()) { P.toast("Write or choose a message."); return; }
        var body = text.value.trim();
        var sh = P.sheet({ title: "Send to " + plural(data.strength, "family", "families") + "?", sub: body, tone: "gray", body: function (b) {
          var r = el("div", "ph-btnrow");
          r.appendChild(cta("Send", "", function () {
            sh.close(); send.disabled = true;
            q().submit({ label: "Message to " + data.class.label, method: "POST", path: "/register/message", body: { classId: classId, body: body, clientKey: key() } }).then(function (res) {
              steps.message = true; text.value = ""; send.disabled = false;
              if (res.queued) { offlineUsed = true; P.toast(SAVED); } else P.toast("Sent");
            }, function (e) { send.disabled = false; P.toast(e && e.message ? e.message : "That didn’t send."); });
          }));
          r.appendChild(cta("Not yet", "quiet", function () { sh.close(); }));
          b.appendChild(r);
        } });
      });
      host.appendChild(el("div", "ph-btnrow")).appendChild(send);
      // One child's family: pick a name, then a remark.
      host.appendChild(P.sh("A remark on one child"));
      var who = P.group();
      data.students.slice(0, 80).forEach(function (s) {
        who.appendChild(P.row({ title: s.name, sub: s.rollNo ? "Roll " + s.rollNo : "", chev: true, go: function () { remark(s); } }));
      });
      host.appendChild(who);
    }
    function remark(s) {
      var QR = ["Excellent work this week.", "Needs to revise and practise more.", "Please meet me at school.", "Was unwell at school today; please check on them."];
      var text = el("textarea"); text.rows = 3; text.maxLength = 800; text.className = "pc-in"; text.placeholder = "A remark for " + s.name + "’s family";
      var sh = P.sheet({ title: s.name, sub: "Goes to the child’s family.", tone: "gray", body: function (b) {
        var qk = el("div", "pc-quick");
        QR.forEach(function (m) { qk.appendChild(chipBtn(m, false, function () { text.value = m; })); });
        b.appendChild(qk); b.appendChild(text);
        var r = el("div", "ph-btnrow");
        r.appendChild(cta("Send", "", function () {
          if (!text.value.trim()) { P.toast("Write or choose a remark."); return; }
          var body = text.value.trim(); sh.close();
          q().submit({ label: "Remark on " + s.name, method: "POST", path: "/register/message", body: { classId: classId, to: [s.id], body: body, clientKey: key() } }).then(function (res) {
            steps.remarks = true;
            if (res.queued) { offlineUsed = true; P.toast(SAVED); } else P.toast("Sent");
          }, function (e) { P.toast(e && e.message ? e.message : "That didn’t send."); });
        }));
        b.appendChild(r);
      } });
    }

    /* -------------------------------------------------------------- Done */
    function finish() {
      var seconds = Math.min(4 * 3600, Math.round((Date.now() - started) / 1000));
      var list = Object.keys(steps);
      q().submit({ label: "Day done " + data.class.label, method: "POST", path: "/register/day", body: { classId: classId, day: day, seconds: seconds, steps: list, offline: offlineUsed }, merge: "day:" + classId + ":" + day }).then(function (r) {
        P.toast("Done in " + mmss(seconds) + (r.queued ? " (will send)" : ""));
        P.close();
        if (P.home()) P.home().at = 0;
      }, function (e) { P.toast(e && e.message ? e.message : "That didn’t save."); });
    }
  }
};
