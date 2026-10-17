/* ==========================================================================
   OEdu on a phone — what every role shares.

     Inbox    messages, announcements, reminders, alerts: a list, a thread,
              a reply, a new message, what you hear about
     Adapt    the console's own pages, in a layer, for the places that have no
              phone page of their own yet: tables become cards, a table's header
              becomes the label on each value, a dialog is a sheet

   Mounted by phone.js: OPLO_PHONE_SHARED(P). Reads and writes through the
   same API calls the console's inbox does; the server decides who may do what.
   ========================================================================== */
window.OPLO_PHONE_SHARED = function (P) {
  "use strict";

  var K = P.K, el = P.el, esc = P.esc, API = K.API;
  var S = P.shared = {};

  /* ----------------------------------------------------------- Pieces */
  function ago(ms) {
    if (!ms) return "";
    var d = new Date(ms), now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    var y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
  }
  function initials(name) {
    var w = String(name || "?").trim().split(/\s+/);
    return ((w[0] || "?")[0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
  }
  function avatar(name, size) {
    var a = el("span", "ph-ava t-" + P.toneOf(name || "School"), esc(initials(name)));
    if (size) { a.style.width = a.style.height = size + "px"; a.style.fontSize = Math.round(size * .36) + "px"; }
    return a;
  }
  S.avatar = avatar; S.ago = ago;
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b || a + "s"); }

  var PEOPLE = null;
  function people() {
    if (PEOPLE) return Promise.resolve(PEOPLE);
    return API.accounts.list(K.S.me.orgId).then(function (l) { PEOPLE = l || []; return PEOPLE; }, function () { return []; });
  }
  function field(label, node) {
    var l = el("label", "ph-field", "<small>" + esc(label) + "</small>");
    l.appendChild(node);
    return l;
  }
  function cta(text, cls, go) {
    var b = el("button", "ph-cta" + (cls ? " " + cls : ""), esc(text));
    b.type = "button";
    b.addEventListener("click", go);
    return b;
  }

  /* ================================================================ Inbox */
  var BOX = { box: "inbox", archived: false };
  S.refreshUnread = function () { return API.inbox.unread().catch(function () { return 0; }); };

  S.buildInbox = function (L) {
    L.head({ eyebrow: "Communicate", title: "Inbox" });
    L.right.insertBefore(P.btn("", P.icon("pencil"), "New message", function () { S.compose(); }), L.right.firstChild);
    var seg = P.seg([{ k: "inbox", label: "Inbox" }, { k: "sent", label: "Sent" }, { k: "archived", label: "Archived" }],
      BOX.archived ? "archived" : BOX.box, function (k) { BOX.archived = k === "archived"; BOX.box = k === "sent" ? "sent" : "inbox"; draw(); });
    L.add(seg);
    var host = L.add(el("div"));
    L.refresh = draw;
    function draw() {
      host.innerHTML = "";
      host.appendChild(P.skel(4, 78));
      API.inbox.list(BOX.box, BOX.archived).then(function (r) {
        host.innerHTML = "";
        if (!r.notices.length) {
          host.appendChild(P.empty(BOX.archived ? "Nothing archived" : BOX.box === "sent" ? "Nothing sent" : "All clear",
            BOX.archived || BOX.box === "sent" ? "" : "Messages, announcements and reminders from your school appear here."));
          return;
        }
        var unread = r.notices.filter(function (x) { return !x.readAt; }).length;
        if (BOX.box === "inbox" && !BOX.archived && unread) {
          host.appendChild(P.sh(unread + " unread", { label: "Mark all read", go: function () { API.inbox.read().then(draw); } }));
        } else host.appendChild(el("div")).style.height = "14px";
        var seen = {}, g = P.group();
        r.notices.forEach(function (x) {
          if (BOX.box === "inbox" && x.kind === "message" && seen[x.threadId]) return;
          seen[x.threadId] = true;
          var who = x.from ? x.from.name : "School";
          var b = el("button", "ph-ml" + (x.readAt ? "" : " unread"));
          b.type = "button";
          b.appendChild(avatar(who, 42));
          var body = el("span", "b");
          body.innerHTML = '<span class="r1"><b>' + esc(who) + "</b><span>" + esc(ago(x.createdAt)) + '</span></span><span class="sj">' + esc(x.title) + "</span>" +
            (x.body ? '<span class="sn">' + esc(x.body.slice(0, 160)) + "</span>" : "") + (x.kind !== "message" ? '<span class="tg">' + P.pill(x.kind[0].toUpperCase() + x.kind.slice(1), x.kind === "alert" ? "orange" : "") + "</span>" : "");
          b.appendChild(body);
          if (!x.readAt) b.appendChild(el("i", "u"));
          b.addEventListener("click", function () { open(x); });
          g.appendChild(b);
        });
        host.appendChild(g);
        P.rise([g], 0);
      }, function (e) { P.fail(host, e, draw); });
    }
    draw();
  };

  function open(x) {
    if (x.kind !== "message" && x.kind !== "announcement") {
      // A reminder or an alert opens what it is about.
      API.inbox.read([x.id]);
      P.sheet({ title: x.title, sub: ago(x.createdAt) + (x.from ? " · " + x.from.name : ""), tone: "orange", body: function (b) {
        var g = P.group();
        g.appendChild(el("div", "ph-prose", esc(x.body || "")));
        b.appendChild(g);
        if (x.link && K.openLink) { var r = el("div", "ph-btnrow"); r.appendChild(cta("Open", "", function () { K.openLink(x.link); })); b.appendChild(r); }
      } });
      return;
    }
    K.push("ph:thread:" + x.threadId, x.title, function () { showThread(x); });
    showThread(x);
  }
  function showThread(x) {
    P.present("thread:" + x.threadId, 2, { tone: "blue", label: x.title, back: { label: "Inbox", go: function () { K.openInbox(); } } }, function (L) {
      L.head({ eyebrow: x.kind === "announcement" ? "Announcement" : "Conversation", title: x.title });
      var host = L.add(el("div"));
      host.appendChild(P.skel(2, 110));
      var mine = x.box === "sent" || (x.from && x.from.id === K.S.me.id);
      var more = P.btn("", P.icon("dots"), "More", function () {
        P.sheet({ title: "This conversation", tone: "gray", body: function (b) {
          var g = P.group();
          g.appendChild(P.row({ icon: "inbox", tone: "blue", title: x.archivedAt ? "Move to inbox" : "Archive", chev: false, go: function () {
            API.inbox.archive([x.id], !!x.archivedAt).then(function () { P.toast(x.archivedAt ? "Moved to inbox" : "Archived"); P.close(); });
          } }));
          b.appendChild(g);
        } });
      });
      L.right.insertBefore(more, L.right.firstChild);
      API.inbox.thread(x.threadId).then(function (r) {
        host.innerHTML = "";
        if (r.members > 1) host.appendChild(el("p", "ph-sub", esc(plural(r.members, "person", "people") + " in this conversation")));
        r.notices.forEach(function (m) {
          var card = el("div", "ph-msg" + (m.from && m.from.id === K.S.me.id ? " mine" : ""));
          var who = m.from ? m.from.name : "School";
          card.appendChild(avatar(who, 36));
          var bd = el("div", "bd");
          bd.innerHTML = '<div class="h"><b>' + esc(who) + "</b><span>" + esc(ago(m.createdAt)) + "</span></div><p>" + esc(m.body || "") + "</p>";
          card.appendChild(bd);
          host.appendChild(card);
        });
        P.rise([].slice.call(host.querySelectorAll(".ph-msg")), 0);
        if (x.kind === "message" && !mine) {
          var row = el("div", "ph-btnrow");
          row.appendChild(cta("Reply", "", function () { reply(x, function () { L.reload(); }); }));
          host.appendChild(row);
        }
        S.refreshUnread();
      }, function (e) { P.fail(host, e, function () { showThread(x); }); });
      L.reload = function () { host.innerHTML = ""; showThread(x); };
    });
  }
  function reply(x, done) {
    var body = el("textarea"); body.rows = 5; body.placeholder = "Write a reply";
    var ctl = P.sheet({ title: "Reply", sub: "Re: " + x.title.replace(/^Re: /, ""), tone: "blue", body: function (b) {
      var g = P.group();
      g.appendChild(field("Message", body));
      b.appendChild(g);
      var row = el("div", "ph-btnrow");
      var go = cta("Send", "", function () {
        if (!body.value.trim()) { P.toast("Write a reply first."); return; }
        go.disabled = true;
        API.inbox.send({ threadId: x.threadId, title: "Re: " + x.title.replace(/^Re: /, ""), body: body.value.trim() }).then(function () {
          P.toast("Sent"); ctl.close(); done && done();
        }, function (e) { go.disabled = false; P.toast(e && e.message ? e.message : "That didn’t send."); });
      });
      row.appendChild(go);
      b.appendChild(row);
    } });
    setTimeout(function () { try { body.focus(); } catch (e) { /* old browsers */ } }, 380);
  }

  S.compose = function (to, opts) {
    opts = opts || {};
    var chosen = to ? [to] : [];
    var title = el("input"), body = el("textarea");
    title.type = "text"; title.placeholder = "Subject"; body.rows = 6; body.placeholder = "Write your message";
    var me = K.S.me, staff = me.role === "admin" || me.role === "teacher";
    var aud = el("select", "ph-sel");
    [["", "Specific people"], ["course", "A course I teach"], ["students", "All students"], ["staff", "All staff"], ["families", "All families"]].forEach(function (o) { var op = el("option"); op.value = o[0]; op.textContent = o[1]; aud.appendChild(op); });
    var course = el("select", "ph-sel");
    var c0 = el("option"); c0.value = ""; c0.textContent = "Choose a course"; course.appendChild(c0);
    var chips = el("div", "ph-chips");
    function drawChips() {
      chips.innerHTML = "";
      chosen.forEach(function (p, i) {
        var c = el("span", "ph-chip", esc(p.name || p.email) + " ");
        var x = el("button", null, "×"); x.type = "button"; x.setAttribute("aria-label", "Remove " + (p.name || p.email));
        x.addEventListener("click", function () { chosen.splice(i, 1); drawChips(); });
        c.appendChild(x);
        chips.appendChild(c);
      });
    }
    drawChips();
    var find = el("input"), results = el("div", "ph-found");
    find.type = "search"; find.placeholder = "Find a person"; find.setAttribute("autocomplete", "off");
    find.addEventListener("input", function () {
      var t = find.value.trim().toLowerCase();
      results.innerHTML = "";
      if (t.length < 2) return;
      people().then(function (all) {
        var hits = all.filter(function (p) { return (p.name || "").toLowerCase().indexOf(t) > -1 || (p.email || "").toLowerCase().indexOf(t) > -1; }).slice(0, 6);
        results.innerHTML = "";
        if (!hits.length) results.appendChild(el("p", "ph-sub", "Nobody by that name."));
        hits.forEach(function (p) {
          var r = el("button", "ph-row has-ic", "");
          r.type = "button";
          r.appendChild(avatar(p.name || p.email, 34));
          r.appendChild(el("span", "t", "<b>" + esc(p.name || p.email) + "</b><small>" + esc(p.email || "") + "</small>"));
          r.addEventListener("click", function () { if (!chosen.some(function (c) { return c.id === p.id; })) chosen.push(p); drawChips(); find.value = ""; results.innerHTML = ""; });
          results.appendChild(r);
        });
      });
    });
    var courseRow = field("Course", course);
    courseRow.hidden = true;
    aud.addEventListener("change", function () { courseRow.hidden = aud.value !== "course"; });
    if (staff) API.courses.mine().then(function (cs) {
      cs.filter(function (c) { return c.myRole === "teacher" || c.myRole === "assistant" || me.role === "admin"; }).forEach(function (c) { var o = el("option"); o.value = c.id; o.textContent = c.title; course.appendChild(o); });
      if (opts.courseId) { aud.value = "course"; course.value = opts.courseId; courseRow.hidden = false; }
    });
    var ctl = P.sheet({ title: "New message", sub: staff ? "To people, a course, or a whole group." : "To your teachers and the school’s staff.", tone: "blue", body: function (b) {
      var g = P.group();
      if (staff) { g.appendChild(field("To", aud)); g.appendChild(courseRow); }
      var who = el("div"); who.appendChild(chips); who.appendChild(find); who.appendChild(results);
      g.appendChild(field("People", who));
      g.appendChild(field("Subject", title));
      g.appendChild(field("Message", body));
      b.appendChild(g);
      var row = el("div", "ph-btnrow");
      var go = cta("Send", "", function () {
        var d = { title: title.value.trim(), body: body.value.trim() };
        if (!d.title || !d.body) { P.toast("A subject and a message, please."); return; }
        if (aud.value === "course") { if (!course.value) { P.toast("Choose the course."); return; } d.audience = { kind: "course", courseId: course.value }; }
        else if (aud.value) d.audience = { kind: aud.value };
        if (chosen.length) d.to = chosen.map(function (c) { return c.id; });
        if (!d.audience && !d.to) { P.toast("Choose who it’s for."); return; }
        go.disabled = true;
        API.inbox.send(d).then(function (r) { P.toast("Sent to " + plural(r.reached, "person", "people")); BOX.box = "sent"; BOX.archived = false; ctl.close(); var t = P.top(); if (t && t.refresh) t.refresh(); },
          function (e) { go.disabled = false; P.toast(e && e.message ? e.message : "That didn’t send."); });
      });
      row.appendChild(go);
      b.appendChild(row);
    } });
  };
  S.prefs = function () {
    API.inbox.prefs().then(function (r) {
      var rows = r.prefs, NAME = { announcement: "Announcements", reminder: "Reminders", alert: "Alerts", report: "Reports" };
      P.sheet({ title: "What you hear about", sub: "Messages from people always arrive. These you can turn off.", tone: "gray", body: function (b) {
        rows.forEach(function (p) {
          b.appendChild(el("p", "ph-sub", esc(NAME[p.kind] || p.kind)));
          var g = P.group();
          g.style.marginBottom = "14px";
          [["inApp", "In the app"], ["email", "By email"]].forEach(function (k) {
            var l = el("label", "ph-row");
            l.innerHTML = '<span class="t"><b>' + k[1] + '</b></span><input type="checkbox" class="ph-sw" ' + (p[k[0]] ? "checked" : "") + ">";
            l.querySelector("input").addEventListener("change", function (e) { p[k[0]] = e.target.checked; });
            g.appendChild(l);
          });
          b.appendChild(g);
        });
        if (!r.mail) b.appendChild(P.note("Email is queued but not sent yet: the school hasn’t connected a mail service."));
        var row = el("div", "ph-btnrow");
        row.appendChild(cta("Save", "", function () { API.inbox.putPrefs(rows).then(function () { P.toast("Saved"); }, function (e) { P.toast(e && e.message ? e.message : "That didn’t save."); }); }));
        b.appendChild(row);
      } });
    });
  };

  /* ================================================================= Adapt
     A console page, drawn into a layer, for a place with no phone page yet.
     CSS (phone-adapt.css) does the reflow; this labels the cells, so each value
     keeps the name its column header gave it, and keeps doing it when the page
     redraws itself. */
  S.adapt = function (w) {
    w.classList.add("ph-adapt");
    var queued = false;
    function label() {
      queued = false;
      [].forEach.call(w.querySelectorAll(".cn-tbl"), function (t) {
        var heads = [].map.call(t.querySelectorAll(".cn-tr.head .cn-th"), function (h) { return h.textContent.trim(); });
        t.classList.toggle("ph-notitles", !heads.length);
        [].forEach.call(t.querySelectorAll(".cn-tbody .cn-tr"), function (r) {
          [].forEach.call(r.children, function (c, i) {
            if (c.dataset.l == null) c.dataset.l = heads[i] || "";
            var empty = !c.textContent.trim() && !c.querySelector("svg,img,button,input,select");
            c.classList.toggle("ph-void", empty);
          });
        });
      });
    }
    var mo = new MutationObserver(function () { if (!queued) { queued = true; requestAnimationFrame(label); } });
    mo.observe(w, { childList: true, subtree: true });
    label();
  };
};
