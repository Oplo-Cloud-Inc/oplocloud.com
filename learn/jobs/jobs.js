/* ==========================================================================
   OEdu Jobs — the phone's page.

   Two things a person on their feet does: report what is broken (a label on
   the door opens this with the room already chosen), and work the jobs they
   have been given — start, tick the checklist, take a photo, finish.

   It is its own page, not the console squeezed onto a phone. Whether a person
   may do any of it is the server's decision (api/src/core/guard.js); this page
   only draws what it was told. Nothing is stored on the phone.

   Everyone signs in at the root of OEdu. Signed out comes to the sign-in and
   straight back here, with the room still chosen.
   ========================================================================== */
(function () {
  "use strict";

  var API = window.OPLO_API, HOME = window.OPLO_HOME, F = API.facilities;
  var ROOT = location.pathname.replace(/jobs\/?$/, "");
  var app = document.getElementById("app");
  var S = { me: null, can: {}, spaces: [], by: {}, room: new URLSearchParams(location.search).get("room") || "", view: "", orders: null };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function show(nodes) { app.innerHTML = ""; [].concat(nodes).forEach(function (n) { if (n) app.appendChild(n); }); window.scrollTo(0, 0); }
  function btn(label, cls, go) { var b = el("button", "jb-btn" + (cls ? " " + cls : ""), esc(label)); b.type = "button"; if (go) b.addEventListener("click", go); return b; }
  function field(label, node) { var l = el("label", "jb-f"); l.appendChild(el("span", null, esc(label))); l.appendChild(node); return l; }
  function day(ymd) {
    if (!ymd) return "";
    var d = new Date(ymd + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  }
  function path(id) {
    var names = [], s = S.by[id], g = 0;
    while (s && g++ < 8) { names.unshift(s.name); s = s.parentId ? S.by[s.parentId] : null; }
    return names.join(" › ");
  }
  function oops(e) { return e && e.message ? e.message : "That did not work."; }

  /* ---- a photo, made small enough to send (the limit is 700 KB) */
  function readImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) return reject(new Error("Choose a photo."));
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        var q = 0.82, data = c.toDataURL("image/jpeg", q).split(",")[1];
        while (data.length * 0.75 > 690 * 1024 && q > 0.3) { q -= 0.1; data = c.toDataURL("image/jpeg", q).split(",")[1]; }
        resolve({ name: "photo.jpg", type: "image/jpeg", data: data });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("That photo could not be opened.")); };
      img.src = url;
    });
  }
  function photoInput() {
    var i = el("input");
    i.type = "file"; i.accept = "image/*"; i.setAttribute("capture", "environment");
    return i;
  }

  /* ============================================================== Start */
  function toSignIn() {
    location.replace(ROOT + "?next=" + encodeURIComponent(location.pathname + location.search));
  }

  function start() {
    API.me().then(signedIn, function (e) {
      if (e && e.code === "offline") return show(el("p", "jb-err", "The Oplo account service is not answering."));
      toSignIn();
    });
  }

  function signedIn(me) {
    var ok = HOME.allowed(me.roles);
    if (ok.indexOf("admin") < 0 && ok.indexOf("teacher") < 0) {
      return show([el("h1", null, "OEdu Jobs"), el("p", "jb-note", "This page is for the school's staff. Your own work is in <a href='" + esc(ROOT) + "'>OEdu</a>.")]);
    }
    S.me = me;
    Promise.all([F.summary(), F.spaces()]).then(function (r) {
      S.can = r[0].can || {};
      S.spaces = r[1];
      r[1].forEach(function (s) { S.by[s.id] = s; });
      S.view = S.room ? "report" : S.can.work ? "jobs" : "report";
      draw();
    }, function (e) { show(el("p", "jb-err", esc(oops(e)))); });
  }

  function frame(body) {
    var top = el("div", "jb-top", "<b>OEdu Jobs</b><span class='jb-sp'></span><span>" + esc(S.me.firstName || S.me.name || "") + "</span>");
    var seg = el("div", "jb-seg");
    [["jobs", "My jobs", S.can.work], ["report", "Report a problem", true], ["mine", "My requests", true]].forEach(function (v) {
      if (!v[2]) return;
      var b = el("button", S.view === v[0] ? "on" : "", esc(v[1]));
      b.type = "button";
      b.addEventListener("click", function () { S.view = v[0]; S.room = v[0] === "report" ? S.room : ""; draw(); });
      seg.appendChild(b);
    });
    show([top, seg, body]);
  }

  function draw() {
    if (S.view === "jobs") return jobs();
    if (S.view === "mine") return mine();
    return report();
  }

  /* ============================================================= Report */
  function report(sent) {
    var box = el("div");
    if (sent) {
      var done = el("div", "jb-done", "<i>✓</i><h1>Sent</h1><p class='jb-note'>" + esc(sent.title) + "<br>The office will look at it. You can follow it under My requests.</p>");
      box.appendChild(done);
      box.appendChild(btn("Report another", "quiet", function () { S.room = ""; report(); }));
      return frame(box);
    }
    var title = el("input"); title.type = "text"; title.maxLength = 160; title.placeholder = "The projector will not turn on";
    var room = el("select");
    var blank = el("option"); blank.value = ""; blank.textContent = "Choose a room…"; room.appendChild(blank);
    S.spaces.filter(function (s) { return s.kind === "room" || s.kind === "area"; }).sort(function (a, b) { return path(a.id).localeCompare(path(b.id), undefined, { numeric: true }); })
      .forEach(function (s) { var o = el("option"); o.value = s.id; o.textContent = path(s.id); room.appendChild(o); });
    room.value = S.room && S.by[S.room] ? S.room : "";
    var urgency = el("select");
    [["normal", "Normal"], ["high", "Needs doing soon"], ["urgent", "Unsafe or urgent"]].forEach(function (x) { var o = el("option"); o.value = x[0]; o.textContent = x[1]; urgency.appendChild(o); });
    var details = el("textarea"); details.maxLength = 4000; details.placeholder = "Anything that would help";
    var already = el("div", "jb-already"); already.hidden = true;
    var err = el("p", "jb-err"); err.hidden = true;
    var photo = null;
    var cam = photoInput();
    var shot = btn("Add a photo", "quiet", function () { cam.click(); });
    cam.addEventListener("change", function () {
      var f = cam.files && cam.files[0];
      if (!f) return;
      shot.textContent = "Reading the photo…";
      readImage(f).then(function (p) { photo = p; shot.textContent = "Photo added ✓"; }, function (e) { photo = null; shot.textContent = "Add a photo"; err.hidden = false; err.textContent = oops(e); });
    });
    function look() {
      already.hidden = true;
      if (!room.value) return;
      F.openIn(room.value).then(function (open) {
        if (!open.length) return;
        already.hidden = false;
        already.innerHTML = "<b>Already open in this room</b>" + open.map(function (o) { return "<div>" + esc(o.title) + "</div>"; }).join("");
      }, function () {});
    }
    room.addEventListener("change", look);
    box.appendChild(el("h1", null, "Report a problem"));
    if (room.value) box.appendChild(el("p", "jb-note", esc(path(room.value))));
    box.appendChild(field("What is wrong", title));
    box.appendChild(field("Where", room));
    box.appendChild(already);
    box.appendChild(field("How urgent", urgency));
    box.appendChild(field("More detail", details));
    box.appendChild(shot);
    box.appendChild(err);
    var send = btn("Send it", "", function () {
      err.hidden = true;
      if (!title.value.trim()) { err.hidden = false; err.textContent = "Say what is wrong in a line."; return; }
      send.disabled = true;
      var key = "ph-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      F.addOrder({ title: title.value.trim(), details: details.value.trim() || undefined, spaceId: room.value || undefined, priority: urgency.value, clientKey: key })
        .then(function (r) {
          if (photo) return F.addPhoto(r.order.id, photo).then(function () { return r; }, function () { return r; });
          return r;
        }).then(function (r) { report({ title: r.order.title }); }, function (e) { send.disabled = false; err.hidden = false; err.textContent = oops(e); });
    });
    box.appendChild(send);
    frame(box);
    if (room.value) look();
  }

  /* ================================================================ Jobs */
  function jobs() {
    var box = el("div");
    box.appendChild(el("h1", null, "My jobs"));
    var list = el("div");
    list.appendChild(el("p", "jb-wait", "Loading…"));
    box.appendChild(list);
    frame(box);
    F.orders({ mine: 1, status: "unfinished" }).then(function (r) {
      list.innerHTML = "";
      if (!r.orders.length) { list.appendChild(el("p", "jb-note", "Nothing is waiting for you.")); return; }
      r.orders.forEach(function (o) {
        var c = el("button", "jb-card");
        c.type = "button";
        c.innerHTML = "<b>" + esc(o.title) + "</b><span>" + (o.priority === "urgent" ? "<i class='jb-chip bad'>Urgent</i>" : o.priority === "high" ? "<i class='jb-chip warn'>High</i>" : "") +
          (o.overdue ? "<i class='jb-chip bad'>Overdue</i>" : "") + esc(o.spaceId && S.by[o.spaceId] ? path(o.spaceId) : "") + (o.dueOn ? " · due " + esc(day(o.dueOn)) : "") + "</span>";
        c.addEventListener("click", function () { job(o.id); });
        list.appendChild(c);
      });
    }, function (e) { list.innerHTML = "<p class='jb-err'>" + esc(oops(e)) + "</p>"; });
  }

  function job(id) {
    F.order(id).then(function (d) {
      var o = d.order, box = el("div");
      var back = btn("‹ My jobs", "quiet", function () { S.view = "jobs"; draw(); });
      box.appendChild(back);
      box.appendChild(el("h1", null, esc(o.title)));
      box.appendChild(el("p", "jb-note", esc([o.spaceId && S.by[o.spaceId] ? path(o.spaceId) : "", o.assetName, o.dueOn ? "due " + day(o.dueOn) : ""].filter(Boolean).join(" · "))));
      if (o.details) box.appendChild(el("p", null, esc(o.details)));
      var err = el("p", "jb-err"); err.hidden = true;

      if (o.checklist && o.checklist.length) {
        box.appendChild(el("h2", null, "Checklist"));
        var editable = ["open", "in_progress", "on_hold"].indexOf(o.status) > -1;
        o.checklist.forEach(function (c) {
          var row = el("div", "jb-row");
          if (c.type === "check") {
            var cb = el("input"); cb.type = "checkbox"; cb.checked = !!c.done; cb.disabled = !editable;
            cb.addEventListener("change", function () { F.act(id, "checklist", { answers: [{ id: c.id, done: cb.checked }] }).catch(function (e) { err.hidden = false; err.textContent = oops(e); }); });
            row.appendChild(cb);
          } else if (c.type === "pass_fail") {
            var s = el("select"); s.disabled = !editable;
            [["", "—"], ["pass", "Pass"], ["fail", "Fail"], ["na", "N/A"]].forEach(function (x) { var op = el("option"); op.value = x[0]; op.textContent = x[1]; s.appendChild(op); });
            s.value = c.result || "";
            s.addEventListener("change", function () { F.act(id, "checklist", { answers: [{ id: c.id, result: s.value || undefined }] }).catch(function (e) { err.hidden = false; err.textContent = oops(e); }); });
            row.appendChild(s);
          }
          row.appendChild(el("span", null, esc(c.text)));
          box.appendChild(row);
        });
      }
      if (d.files && d.files.length) {
        var strip = el("div", "jb-photos");
        box.appendChild(strip);
        d.files.forEach(function (f) {
          if (!/^image\//.test(f.type)) return;
          F.photo(id, f.id).then(function (file) { var im = el("img"); im.alt = f.name; im.src = "data:" + file.type + ";base64," + file.data; strip.appendChild(im); }, function () {});
        });
      }
      box.appendChild(err);
      function go(p, then) { p.then(then || function () { job(id); }, function (e) { err.hidden = false; err.textContent = oops(e) + (e.unfinished ? " " + e.unfinished.map(function (x) { return "“" + x.text + "”"; }).join(", ") : ""); }); }
      if (o.status === "open" || o.status === "on_hold") box.appendChild(btn(o.status === "on_hold" ? "Resume" : "Start", "", function () { go(F.act(id, "start")); }));
      if (o.status === "open" || o.status === "in_progress") box.appendChild(btn("Put on hold", "quiet", function () { go(F.act(id, "hold")); }));
      if (["open", "in_progress", "on_hold"].indexOf(o.status) > -1) {
        var mins = el("input"); mins.type = "number"; mins.min = 0; mins.inputMode = "numeric";
        var note = el("textarea"); note.maxLength = 400; note.placeholder = "What you found or did";
        box.appendChild(el("h2", null, "Finish"));
        box.appendChild(field("Minutes spent", mins));
        box.appendChild(field("What you found or did", note));
        box.appendChild(btn("Mark it done", "", function () {
          go(F.act(id, "complete", { minutes: mins.value === "" ? undefined : +mins.value, outcome: note.value.trim() || undefined }), function () { S.view = "jobs"; draw(); });
        }));
      } else if (o.status === "done") {
        box.appendChild(el("p", "jb-note", "Done" + (o.outcome ? " — " + esc(o.outcome) : "")));
      }
      var cam = photoInput();
      cam.addEventListener("change", function () {
        var f = cam.files && cam.files[0];
        if (f) readImage(f).then(function (p) { return F.addPhoto(id, p); }).then(function () { job(id); }, function (e) { err.hidden = false; err.textContent = oops(e); });
      });
      box.appendChild(btn("Add a photo", "quiet", function () { cam.click(); }));
      frame(box);
    }, function (e) { show(el("p", "jb-err", esc(oops(e)))); });
  }

  /* ============================================================= Mine */
  function mine() {
    var box = el("div");
    box.appendChild(el("h1", null, "My requests"));
    var list = el("div");
    list.appendChild(el("p", "jb-wait", "Loading…"));
    box.appendChild(list);
    frame(box);
    F.orders({ requested: 1 }).then(function (r) {
      list.innerHTML = "";
      if (!r.orders.length) { list.appendChild(el("p", "jb-note", "You have not reported anything.")); return; }
      r.orders.forEach(function (o) {
        var word = o.status === "pending" ? "Waiting" : o.status === "open" ? "Accepted" : o.status === "in_progress" ? "Being worked on" : o.status === "on_hold" ? "On hold"
          : o.status === "done" ? "Done" : o.status === "declined" ? "Declined" : "Cancelled";
        var c = el("div", "jb-card");
        c.innerHTML = "<b>" + esc(o.title) + "</b><span><i class='jb-chip " + (o.status === "done" ? "ok" : o.status === "declined" ? "bad" : "") + "'>" + word + "</i>" +
          esc(o.spaceId && S.by[o.spaceId] ? path(o.spaceId) : "") + (o.assigneeName ? " · with " + esc(o.assigneeName) : "") + "</span>" +
          (o.status === "declined" && o.declineReason ? "<span>" + esc(o.declineReason) + "</span>" : "");
        list.appendChild(c);
      });
    }, function (e) { list.innerHTML = "<p class='jb-err'>" + esc(oops(e)) + "</p>"; });
  }

  start();
})();
