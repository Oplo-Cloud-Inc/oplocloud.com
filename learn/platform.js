/* ==========================================================================
   OEdu — what every console shares.

     inbox      messages, announcements, reminders and alerts, with preferences
     records    the school's smaller records, drawn from the server's registry:
                events, referrals, detention, support plans, leave, cover,
                certifications, menus, checkouts, forms, fees, invoices …
     exchange   data in and out: exports, a checked import, an extract
     builder    a report from the school's own data, saved and re-run
     district   schools under one district, side by side
     outbox     mail waiting for a provider

   Mounted by app.js with the console kit: OPLO_PLATFORM(kit). The registry of
   kinds comes from GET /item-kinds, so this file never says what a referral is.
   ========================================================================== */
window.OPLO_PLATFORM = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, toast = K.toast;
  var P = {};

  /* ----------------------------------------------------------- Pieces */
  function button(text, cls, go) {
    var b = el("button", cls || "en-btn", esc(text));
    b.type = "button";
    if (go) b.addEventListener("click", go);
    return b;
  }
  function pill(t, tone) { return "<span class='sx-pill" + (tone ? " " + tone : "") + "'>" + esc(t) + "</span>"; }
  function none(t) { return "<span class='cn-none'>" + esc(t || "—") + "</span>"; }
  function ago(ms) {
    if (!ms) return "";
    var d = new Date(ms), now = new Date();
    var same = d.toDateString() === now.toDateString();
    return same ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
  }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b || a + "s"); }
  function dialog(o) {
    var box = el("div", "en-dlg" + (o.wide ? " en-wide" : ""));
    box.appendChild(el("h2", "en-dlg-h", esc(o.title)));
    if (o.sub) box.appendChild(el("p", "en-dlg-sub", esc(o.sub)));
    var host = el("div", "en-dlg-body");
    box.appendChild(host);
    var err = el("div", "en-dlg-err");
    err.hidden = true;
    box.appendChild(err);
    var acts = el("div", "en-dlg-acts en-wrap");
    var sheet = null;
    var ctl = { close: function () { if (sheet) sheet.close(); }, error: function (m) { err.hidden = !m; err.textContent = m || ""; }, host: host };
    (o.extra || []).forEach(function (b) { acts.appendChild(b(ctl)); });
    acts.appendChild(button(o.action ? "Cancel" : "Close", "en-btn quiet", ctl.close));
    if (o.action) {
      var go = button(o.action, "en-btn strong", function () {
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
  function field(text, node) {
    var l = el("label", "sx-field");
    l.appendChild(el("span", null, esc(text)));
    l.appendChild(node);
    return l;
  }
  function input(type, value, ph) {
    var i = el("input", "sx-in");
    i.type = type; i.value = value == null ? "" : String(value);
    if (ph) i.placeholder = ph;
    return i;
  }
  function textarea(value, rows) {
    var t = el("textarea", "sx-in");
    t.rows = rows || 4; t.value = value == null ? "" : value;
    return t;
  }
  function select(options, value) {
    var s = el("select", "cx-select sx-sel");
    options.forEach(function (o) {
      var op = el("option"); op.value = o[0] == null ? "" : String(o[0]); op.textContent = o[1];
      if (String(o[0] == null ? "" : o[0]) === String(value == null ? "" : value)) op.selected = true;
      s.appendChild(op);
    });
    return s;
  }
  var PEOPLE = null;
  function people() {
    if (PEOPLE) return Promise.resolve(PEOPLE);
    return API.accounts.list(K.S.me.orgId).then(function (l) { PEOPLE = l || []; return PEOPLE; }, function () { return []; });
  }
  /* Finding one person, or several: a few letters, a short list, a pick. */
  function finder(placeholder, pick) {
    var wrap = el("div", "sx-find");
    var inp = el("input", "sx-in");
    inp.type = "search"; inp.placeholder = placeholder;
    var list = el("div", "sx-findlist");
    list.hidden = true;
    inp.addEventListener("input", function () {
      var t = inp.value.trim().toLowerCase();
      list.innerHTML = "";
      if (t.length < 2) { list.hidden = true; return; }
      people().then(function (all) {
        var hits = all.filter(function (p) { return (p.name || "").toLowerCase().indexOf(t) > -1 || (p.email || "").toLowerCase().indexOf(t) > -1; }).slice(0, 8);
        list.innerHTML = "";
        if (!hits.length) list.appendChild(el("p", "sx-quiet", "Nobody by that name."));
        hits.forEach(function (p) {
          var b = el("button", "sx-findrow", "<b>" + esc(p.name || p.email) + "</b><small>" + esc(p.email || "") + "</small>");
          b.type = "button";
          b.addEventListener("click", function () { list.hidden = true; inp.value = ""; pick(p); });
          list.appendChild(b);
        });
        list.hidden = false;
      });
    });
    wrap.appendChild(inp);
    wrap.appendChild(list);
    return wrap;
  }
  function nameOf(id) {
    var p = (PEOPLE || []).filter(function (x) { return x.id === id; })[0];
    return p ? (p.name || p.email) : "";
  }
  function csv(rows) {
    return rows.map(function (r) {
      return r.map(function (c) {
        var s = c == null ? "" : String(c);
        return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(",");
    }).join("\r\n");
  }
  function download(name, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type || "text/csv" }));
    var a = el("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function parseCsv(text) {
    var rows = [], row = [], cur = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = []; }
      else cur += c;
    }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }
  function slot(v) { var s = el("div", "sx-slot"); v.appendChild(s); return s; }
  function failedAt(s, e, retry) { var n = K.loading(s, ""); K.failed(n, e, retry); }

  /* ================================================================ Inbox */
  var BOX = { box: "inbox", archived: false };
  P.inbox = function (v) {
    var page = K.cxPage(v, "Communicate", "Inbox", "Messages, announcements, reminders and alerts for you.");
    page.tools.appendChild(K.cnAction("Preferences", prefs));
    page.tools.appendChild(K.cnAction("New message", function () { compose(); }, true));
    var s = slot(v);
    var bar = el("div", "cx-bar sx-bar0");
    var filters = K.cnFilters([{ k: "inbox", name: "Inbox" }, { k: "sent", name: "Sent" }, { k: "archived", name: "Archived" }],
      BOX.archived ? "archived" : BOX.box, function (k) { BOX.archived = k === "archived"; BOX.box = k === "sent" ? "sent" : "inbox"; draw(); });
    bar.appendChild(filters);
    bar.appendChild(button("Mark all read", "cn-btn small", function () { API.inbox.read().then(function () { draw(); count(); }); }));
    s.appendChild(bar);
    var host = el("div");
    s.appendChild(host);

    function draw() {
      filters.mark(BOX.archived ? "archived" : BOX.box);
      host.innerHTML = "";
      var n = K.loading(host, "your inbox");
      API.inbox.list(BOX.box, BOX.archived).then(function (r) {
        n.remove();
        if (!r.notices.length) { host.appendChild(K.cnEmpty(BOX.archived ? "Nothing archived." : BOX.box === "sent" ? "Nothing sent." : "Nothing here.", BOX.archived || BOX.box === "sent" ? "" : "Messages, announcements and reminders arrive here.")); return; }
        var seen = {};
        var t = K.cnTable([{ label: "", w: "14px" }, { label: "From", w: "170px" }, { label: "Subject", w: "minmax(220px, 1fr)" }, { label: "", w: "90px" }, { label: "", w: "76px", align: "right" }]);
        r.notices.forEach(function (x) {
          if (BOX.box === "inbox" && x.kind === "message" && seen[x.threadId]) return;   // one row a conversation
          seen[x.threadId] = true;
          var dot = x.readAt ? "" : "<i class='sx-dot' aria-label='Unread'></i>";
          var row = t.row([dot, "<b" + (x.readAt ? " style='font-weight:400'" : "") + ">" + esc(x.from ? x.from.name : "School") + "</b>",
            "<span" + (x.readAt ? "" : " style='font-weight:600'") + ">" + esc(x.title) + "</span>" + (x.body ? "<span class='cn-sub2'>" + esc(x.body.slice(0, 110)) + "</span>" : ""),
            x.kind === "message" ? "" : pill(x.kind[0].toUpperCase() + x.kind.slice(1), x.kind === "alert" ? "orange" : ""), esc(ago(x.createdAt))],
            function () { open(x); });
          row.dataset.id = x.id;
        });
        host.appendChild(t);
      }).catch(function (e) { n.remove(); failedAt(host, e, draw); });
    }
    function count() { K.railCount && K.railCount("inbox", 0); P.refreshCount(); }

    function open(x) {
      if (x.kind !== "message" && x.kind !== "announcement") {
        // A reminder or an alert opens what it is about.
        API.inbox.read([x.id]).then(function () { P.refreshCount(); });
        dialog({ title: x.title, sub: ago(x.createdAt) + (x.from ? " · " + x.from.name : ""), body: function (h) { h.appendChild(el("p", "sx-prose", esc(x.body || ""))); },
          extra: x.link ? [function (ctl) { return button("Open", "en-btn strong", function () { ctl.close(); if (K.openLink) K.openLink(x.link); }); }] : [] });
        draw();
        return;
      }
      API.inbox.thread(x.threadId).then(function (r) {
        var reply = textarea("", 4);
        dialog({ wide: true, title: x.title, sub: plural(r.members, "person", "people") + " in this conversation",
          body: function (h) {
            r.notices.forEach(function (m) {
              h.appendChild(el("div", "sx-post", "<b>" + esc(m.from ? m.from.name : "School") + "</b><small>" + esc(ago(m.createdAt)) + "</small><p>" + esc(m.body || "") + "</p>"));
            });
            if (x.kind === "message" && x.box !== "sent") h.appendChild(field("Reply", reply));
          },
          action: x.kind === "message" ? "Send reply" : null,
          extra: [function (ctl) { return button(x.archivedAt ? "Move to inbox" : "Archive", "en-btn quiet", function () {
            API.inbox.archive([x.id], !!x.archivedAt).then(function () { ctl.close(); draw(); P.refreshCount(); }); }); }],
          onSubmit: function () {
            if (!reply.value.trim()) throw new Error("Write a reply first.");
            return API.inbox.send({ threadId: x.threadId, title: "Re: " + x.title.replace(/^Re: /, ""), body: reply.value.trim() }).then(function () { toast("Sent"); draw(); });
          } });
        draw(); P.refreshCount();
      }, function (e) { toast(e && e.message ? e.message : "That did not open."); });
    }

    function compose(to) {
      var chosen = to ? [to] : [];
      var title = input("text", ""), body = textarea("", 6);
      var aud = select([["", "Specific people"], ["course", "A course I teach"], ["students", "All students"], ["staff", "All staff"], ["families", "All families"]], "");
      var course = select([["", "Choose a course"]], "");
      var chips = el("div", "sx-chips");
      var staff = K.S.me.role === "admin" || K.S.me.role === "teacher";
      function drawChips() {
        chips.innerHTML = "";
        chosen.forEach(function (p, i) {
          var c = el("span", "sx-chip", esc(p.name || p.email) + " ");
          var x = el("button", "sx-rm", "×"); x.type = "button";
          x.addEventListener("click", function () { chosen.splice(i, 1); drawChips(); });
          c.appendChild(x); chips.appendChild(c);
        });
      }
      drawChips();
      var courseRow = field("Course", course);
      courseRow.hidden = true;
      aud.addEventListener("change", function () { courseRow.hidden = aud.value !== "course"; });
      if (staff) API.courses.mine().then(function (cs) {
        cs.filter(function (c) { return c.myRole === "teacher" || c.myRole === "assistant" || K.S.me.role === "admin"; }).forEach(function (c) {
          var o = el("option"); o.value = c.id; o.textContent = c.title; course.appendChild(o);
        });
      });
      dialog({ wide: true, title: "New message", sub: staff ? "To people, a course, or a whole group." : "To your teachers and the school’s staff.",
        body: function (h) {
          if (staff) { h.appendChild(field("To", aud)); h.appendChild(courseRow); }
          var who = el("div"); who.appendChild(chips);
          who.appendChild(finder("Find a person", function (p) { if (!chosen.some(function (c) { return c.id === p.id; })) { chosen.push(p); drawChips(); } }));
          h.appendChild(field("People", who));
          h.appendChild(field("Subject", title));
          h.appendChild(field("Message", body));
        }, action: "Send",
        onSubmit: function () {
          var d = { title: title.value.trim(), body: body.value.trim() };
          // Everything missing, said at once, not the first thing and then the next.
          var missing = [];
          if (!aud.value && !chosen.length) missing.push("who it is for");
          if (aud.value === "course" && !course.value) missing.push("the course");
          if (!d.title) missing.push("a subject");
          if (!d.body) missing.push("a message");
          if (missing.length) throw new Error("Still needed: " + missing.join(", ") + ".");
          if (aud.value === "course") d.audience = { kind: "course", courseId: course.value };
          else if (aud.value) d.audience = { kind: aud.value };
          if (chosen.length) d.to = chosen.map(function (c) { return c.id; });
          return API.inbox.send(d).then(function (r) { toast("Sent to " + plural(r.reached, "person", "people")); BOX.box = "sent"; BOX.archived = false; draw(); });
        } });
    }
    P.compose = compose;

    function prefs() {
      API.inbox.prefs().then(function (r) {
        var rows = r.prefs;
        var NAME = { announcement: "Announcements", reminder: "Reminders", alert: "Alerts", report: "Reports" };
        dialog({ title: "What you hear about", sub: "Messages from people always arrive. These you can turn off.",
          body: function (h) {
            rows.forEach(function (p) {
              var line = el("div", "sx-askrow");
              line.appendChild(el("b", null, esc(NAME[p.kind] || p.kind)));
              var a = el("label", "sx-check"), ai = el("input"); ai.type = "checkbox"; ai.checked = p.inApp;
              ai.addEventListener("change", function () { p.inApp = ai.checked; });
              a.appendChild(ai); a.appendChild(el("span", null, "In the app"));
              var m = el("label", "sx-check"), mi = el("input"); mi.type = "checkbox"; mi.checked = p.email; mi.disabled = false;
              mi.addEventListener("change", function () { p.email = mi.checked; });
              m.appendChild(mi); m.appendChild(el("span", null, "By email"));
              line.appendChild(a); line.appendChild(m);
              h.appendChild(line);
            });
            if (!r.mail) h.appendChild(el("p", "cx-note", "Email is queued but not sent yet: the school has not connected a mail service."));
          }, action: "Save",
          onSubmit: function () { return API.inbox.putPrefs(rows).then(function () { toast("Saved"); }); } });
      });
    }
    draw();
  };

  /* The number beside Inbox, polled while the page is open. */
  var POLL = null, LAST = -1;
  P.refreshCount = function () {
    return API.inbox.unread().then(function (n) {
      if (n !== LAST) { LAST = n; if (K.setUnread) K.setUnread(n); }
      return n;
    }, function () { return 0; });
  };
  P.watch = function () {
    if (POLL) return;
    P.refreshCount();
    POLL = setInterval(function () { if (!document.hidden) P.refreshCount(); }, 30000);
  };

  /* ============================================================== Records */
  var KINDS = null;
  function kinds() {
    if (KINDS) return Promise.resolve(KINDS);
    return API.items.kinds().then(function (k) { KINDS = k; return k; });
  }

  /* cfg: { kind, eyebrow, title, sub, aboutLabel?, course?: bool, mine?: bool, tools?: [...] } */
  P.records = function (v, cfg) {
    var page = K.cxPage(v, cfg.eyebrow || "Records", cfg.title, cfg.sub || "");
    var s = slot(v);
    var state = { status: "all" };
    kinds().then(function (all) {
      var spec = all[cfg.kind];
      if (!spec) { s.appendChild(K.cnEmpty("This kind of record is not set up.", "")); return; }
      if (cfg.canCreate !== false) page.tools.appendChild(K.cnAction(cfg.newLabel || "New " + spec.label.toLowerCase(), function () { editor(null); }, true));
      (cfg.tools || []).forEach(function (t) { page.tools.appendChild(K.cnAction(t[0], t[1])); });
      var bar = el("div", "cx-bar sx-bar0");
      var filters = K.cnFilters([{ k: "all", name: "All" }].concat(spec.statuses.map(function (x) { return { k: x, name: x[0].toUpperCase() + x.slice(1) }; })),
        state.status, function (k) { state.status = k; draw(); });
      bar.appendChild(filters);
      s.appendChild(bar);
      var host = el("div");
      s.appendChild(host);
      var rows = [];

      function load() {
        host.innerHTML = "";
        var n = K.loading(host, spec.plural.toLowerCase());
        var q = { kind: cfg.kind };
        if (cfg.subjectId) q.subjectId = cfg.subjectId;
        if (cfg.courseId) q.courseId = cfg.courseId;
        API.items.list(q).then(function (list) { n.remove(); rows = list; draw(); })
          .catch(function (e) { n.remove(); failedAt(host, e, load); });
      }
      function draw() {
        filters.mark(state.status);
        host.innerHTML = "";
        var shown = rows.filter(function (r) { return state.status === "all" || r.status === state.status; });
        if (cfg.summary) { var sm = cfg.summary(rows); if (sm) host.appendChild(el("p", "cx-note", esc(sm))); }
        if (!shown.length) { host.appendChild(K.cnEmpty("Nothing here.", cfg.canCreate === false ? "" : "Add one to start.")); return; }
        var cols = [{ label: spec.dated ? "Date" : "Added", w: "104px" }, { label: "Title", w: "minmax(180px, 1.4fr)" }];
        if (spec.about !== "none") cols.push({ label: spec.about === "staff" ? "Staff member" : "Student", w: "minmax(130px, 1fr)" });
        var extra = spec.fields.slice(0, 2);
        extra.forEach(function (f) { cols.push({ label: f.label, w: "minmax(100px, .9fr)" }); });
        cols.push({ label: "Status", w: "110px" });
        var t = K.cnTable(cols);
        shown.forEach(function (r) {
          var cells = [esc(r.dueOn || ago(r.createdAt)), "<b>" + esc(r.title) + "</b>" + (r.courseTitle ? "<span class='cn-sub2'>" + esc(r.courseTitle) + "</span>" : "")];
          if (spec.about !== "none") cells.push(r.subjectName ? esc(r.subjectName) : none());
          extra.forEach(function (f) {
            var val = r.data[f.k];
            cells.push(val == null || val === "" ? none() : f.type === "check" ? (val ? "Yes" : "No") : esc(String(val).slice(0, 60)));
          });
          cells.push(pill(r.status || "", r.status === "overdue" || r.status === "skipped" || r.status === "declined" ? "red" : r.status === "pending" || r.status === "new" || r.status === "needed" ? "orange" : ""));
          t.row(cells, function () { editor(r); });
        });
        host.appendChild(t);
      }

      function editor(r) {
        var isNew = !r;
        var f = r || { title: "", status: spec.statuses[0], data: {}, dueOn: "" };
        var title = input("text", f.title);
        var status = select(spec.statuses.map(function (x) { return [x, x[0].toUpperCase() + x.slice(1)]; }), f.status);
        var when = input("date", f.dueOn || "");
        var who = null, whoPick = null, subjectId = r ? r.subjectId : (cfg.subjectId || null);
        var course = select([["", "No course"]], r ? r.courseId : "");
        var inputs = {};
        dialog({ wide: true, title: isNew ? "New " + spec.label.toLowerCase() : r.title,
          sub: r && r.subjectName ? "About " + r.subjectName : "",
          body: function (h, ctl) {
            h.appendChild(field("Title", title));
            var row = el("div", "sx-row2");
            if (spec.dated) row.appendChild(field("Date", when));
            row.appendChild(field("Status", status));
            h.appendChild(row);
            if (spec.about !== "none") {
              who = el("p", "sx-quiet", subjectId ? esc((r && r.subjectName) || nameOf(subjectId) || "Chosen") : "Nobody chosen yet.");
              var wrap = el("div"); wrap.appendChild(who);
              if (isNew || K.S.me.role !== "student") wrap.appendChild(finder(spec.about === "staff" ? "Find a member of staff" : "Find a student", function (p) {
                subjectId = p.id; who.textContent = p.name || p.email;
              }));
              h.appendChild(field(spec.about === "staff" ? "Staff member" : "Student", wrap));
            }
            if (spec.course) {
              API.courses.mine().then(function (cs) { cs.forEach(function (c) { var o = el("option"); o.value = c.id; o.textContent = c.title; if (r && r.courseId === c.id) o.selected = true; course.appendChild(o); }); });
              h.appendChild(field("Course", course));
            }
            spec.fields.forEach(function (fd) {
              var val = f.data[fd.k];
              var node;
              if (fd.type === "longtext") node = textarea(val, 4);
              else if (fd.type === "select") node = select([["", "—"]].concat(fd.options.map(function (o) { return [o, o]; })), val);
              else if (fd.type === "check") { node = el("input"); node.type = "checkbox"; node.checked = !!val; }
              else if (fd.type === "number") node = input("number", val);
              else if (fd.type === "date") node = input("date", val);
              else if (fd.type === "time") node = input("time", val);
              else if (fd.type === "person") {
                node = el("div");
                var cur = el("p", "sx-quiet", val ? esc(nameOf(val) || "Chosen") : "Nobody chosen yet.");
                node.appendChild(cur);
                node.appendChild(finder("Find a person", function (p) { inputs[fd.k].value = p.id; cur.textContent = p.name || p.email; }));
                node.value = val || "";
              } else node = input("text", val);
              inputs[fd.k] = node;
              h.appendChild(field(fd.label + (fd.required ? " *" : ""), node));
            });
            if (!isNew) files(h, r.id);
            if (!isNew && cfg.kind === "event" && r.data.rsvp && K.S.me.role !== "admin") {
              h.appendChild(el("p", "sx-lab", "Will you come?"));
              var rs = el("div", "sx-acts");
              ["yes", "maybe", "no"].forEach(function (a) {
                rs.appendChild(button(a[0].toUpperCase() + a.slice(1), "en-btn quiet", function () {
                  API.items.create({ kind: "rsvp", title: "Reply: " + r.title, status: a, data: { eventId: r.id } })
                    .then(function () { toast("Replied: " + a); ctl.close(); }, function (e) { ctl.error(e && e.message ? e.message : "That did not send."); });
                }));
              });
              h.appendChild(rs);
            }
          },
          extra: isNew ? [] : [function (ctl) {
            return button("Remove", "en-btn quiet", function () {
              API.items.remove(r.id).then(function () { toast("Removed"); ctl.close(); load(); }, function (e) { ctl.error(e.message); });
            });
          }].concat((cfg.extras || []).map(function (fn) { return function (ctl) { return fn(ctl, r, button); }; })),
          action: isNew ? "Add" : "Save",
          onSubmit: function () {
            var data = {};
            spec.fields.forEach(function (fd) {
              var n = inputs[fd.k];
              data[fd.k] = fd.type === "check" ? n.checked : n.value;
            });
            var d = { title: title.value.trim(), status: status.value, data: data, dueOn: when.value || null };
            if (!d.title) throw new Error("A title.");
            if (spec.about !== "none") d.subjectId = subjectId;
            if (spec.course) d.courseId = course.value || null;
            if (isNew) { d.kind = cfg.kind; return API.items.create(d).then(function () { toast("Added"); load(); }); }
            return API.items.update(r.id, d).then(function () { toast("Saved"); load(); });
          } });
      }
      load();
    }, function (e) { failedAt(s, e, function () { P.records(v, cfg); }); });
  };

  /* The files on a record: the list, each one's download, and a way to add. */
  function files(host, itemId) {
    var box = el("div", "sx-files");
    host.appendChild(el("p", "sx-lab", "Files"));
    host.appendChild(box);
    function draw() {
      box.innerHTML = "";
      API.items.get(itemId).then(function (it) {
        (it.files || []).forEach(function (f) {
          var row = el("div", "sx-ev");
          row.appendChild(el("span", "t", esc(f.name) + " <small>" + Math.round(f.size / 1024) + " KB</small>"));
          row.appendChild(button("Download", "en-btn quiet", function () {
            API.files.get(f.id).then(function (x) {
              var bin = atob(x.data), arr = new Uint8Array(bin.length);
              for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
              var url = URL.createObjectURL(new Blob([arr], { type: x.type }));
              var a = el("a"); a.href = url; a.download = x.name; document.body.appendChild(a); a.click(); a.remove();
              setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
            }, function (e) { toast(e.message); });
          }));
          box.appendChild(row);
        });
        if (!(it.files || []).length) box.appendChild(el("p", "sx-quiet", "None."));
        var pick = el("input"); pick.type = "file"; pick.accept = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt";
        pick.addEventListener("change", function () {
          var f = pick.files[0];
          if (!f) return;
          if (f.size > 800 * 1024) { toast("Files are limited to 800 KB."); return; }
          var rd = new FileReader();
          rd.onload = function () {
            var b64 = String(rd.result).split(",")[1];
            API.files.put({ ownerKind: "item", ownerId: itemId, name: f.name, type: f.type || "application/pdf", data: b64 }).then(function () { toast("Attached"); draw(); },
              function (e) { toast(e && e.message ? e.message : "That did not attach."); });
          };
          rd.readAsDataURL(f);
        });
        box.appendChild(pick);
      });
    }
    draw();
  }

  /* ============================================================== Exchange */
  var SETS = [["users", "People"], ["families", "Families: each student and their guardians"], ["sections", "Sections"], ["enrollments", "Who is in which section"], ["attendance", "Attendance (a date range)"], ["grades", "Marks"]];
  P.exchange = function (v) {
    K.cxPage(v, "Data Center", "Imports and exports", "Records out as a spreadsheet, and people and rosters in from one.");
    var s = slot(v);
    var grid = el("div", "cx-grid");
    s.appendChild(grid);

    var ex = K.cxSection(grid, "cx-s6", "Export", "A file for a spreadsheet, a district or a vendor");
    var set = select(SETS, "users");
    var from = input("date", ""), to = input("date", "");
    var range = el("div", "sx-row2"); range.appendChild(field("From", from)); range.appendChild(field("To", to));
    range.hidden = true;
    set.addEventListener("change", function () { range.hidden = set.value !== "attendance"; });
    ex.appendChild(field("What", set)); ex.appendChild(range);
    ex.appendChild(button("Download", "cn-btn strong", function () {
      API.exchange.exportRows(set.value, from.value || undefined, to.value || undefined).then(function (r) {
        download("oedu-" + r.set + "-" + new Date().toISOString().slice(0, 10) + ".csv", csv([r.columns].concat(r.rows)));
        toast(plural(r.rows.length, "row") + " exported");
      }, function (e) { toast(e && e.message ? e.message : "That could not be exported."); });
    }));

    var im = K.cxSection(grid, "cx-s6", "Import", "Check first: a check writes nothing");
    var iset = select([["users", "People: name, email, role"], ["enrollments", "Rosters: section, email, role"]], "users");
    var cols = el("p", "cx-note", "Roles: student (the default), teacher, or an office role: admin, principal, registrar, admissions, counselor, dean, nurse, facilities, office, it. " +
      "Optional columns, to link a parent to the child: guardian_email, guardian_name, relationship, primary. " +
      "New people are invited without a password, and each sets their own. A row with a problem is skipped and listed; the rest load. Running a file again is safe.");
    iset.addEventListener("change", function () { cols.hidden = iset.value !== "users"; });
    var area = textarea("", 8);
    area.placeholder = "Paste rows with a header line, or choose a file.";
    var pickf = el("input"); pickf.type = "file"; pickf.accept = ".csv,text/csv";
    pickf.addEventListener("change", function () {
      var f = pickf.files[0]; if (!f) return;
      var rd = new FileReader(); rd.onload = function () { area.value = String(rd.result); }; rd.readAsText(f);
    });
    var out = el("div");
    var CHUNK = 200;   // what the server takes at a time
    function num(n) { return Number(n).toLocaleString(); }
    function rowsOf() {
      var t = parseCsv(area.value.trim());
      if (t.length < 2) throw new Error("A header line and at least one row.");
      var head = t[0].map(function (h) { return h.trim().toLowerCase(); });
      return t.slice(1).map(function (r) { var o = {}; head.forEach(function (h, i) { o[h] = (r[i] || "").trim(); }); return o; });
    }
    /* People go up CHUNK rows at a time and the answers are added together.
       A guardian met in two chunks is one person, so people are counted by
       address: those invited, and those who already had an account. */
    function chunked(rows, dry, progress) {
      var t = { rows: 0, guardiansLinked: 0, skipped: 0, problemCount: 0, problems: [], invited: {}, known: {} };
      var chain = Promise.resolve();
      for (var off = 0; off < rows.length; off += CHUNK) (function (off) {
        chain = chain.then(function () {
          progress("Reading rows " + num(off + 1) + " to " + num(Math.min(rows.length, off + CHUNK)) + " of " + num(rows.length) + "…");
          return API.exchange.importRows({ set: "users", rows: rows.slice(off, off + CHUNK), dry: dry, offset: off }).then(function (r) {
            ["rows", "guardiansLinked", "skipped", "problemCount"].forEach(function (k) { t[k] += r[k]; });
            r.problems.forEach(function (p) { if (t.problems.length < 100) t.problems.push(p); });
            r.invitedEmails.forEach(function (e) { t.invited[e.toLowerCase()] = 1; });
            r.matchedEmails.forEach(function (e) { t.known[e.toLowerCase()] = 1; });
          }, function (e) {
            var m = e && e.message ? e.message : "That could not be imported.";
            throw new Error(dry ? m : m + " Rows before " + num(off + 1) + " were loaded; run the same file again and they will be matched.");
          });
        });
      })(off);
      return chain.then(function () { return t; });
    }
    function run(dry) {
      var rows;
      try { rows = rowsOf(); } catch (e) { toast(e.message); return; }
      out.innerHTML = "";
      if (iset.value === "users") {
        var prog = el("p", "cx-note"); out.appendChild(prog);
        acts.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
        chunked(rows, dry, function (m) { prog.textContent = m; }).then(function (t) { showPeople(t, dry); }, function (e) { out.innerHTML = ""; toast(e.message); })
          .then(function () { acts.querySelectorAll("button").forEach(function (b) { b.disabled = false; }); });
        return;
      }
      API.exchange.importRows({ set: iset.value, rows: rows, dry: dry }).then(function (r) { show(r, dry); }, function (e) {
        // A 422 carries the problems.
        if (e && e.body && e.body.problems) show(e.body, dry); else toast(e && e.message ? e.message : "That could not be imported.");
      });
    }
    function showPeople(t, dry) {
      out.innerHTML = "";
      var invited = Object.keys(t.invited).length, good = t.rows - t.skipped;
      // Someone made by an earlier chunk of this very file is not "already had an account".
      var matched = Object.keys(t.known).filter(function (e) { return !t.invited[e]; }).length;
      out.appendChild(el("p", "cx-note", "<b>" + esc(num(good) + " of " + num(t.rows) + " rows " + (dry ? "are good" : "were loaded")) + ".</b> " +
        esc(num(invited) + (invited === 1 ? " person" : " people") + (dry ? " would be invited" : " invited") + ", without a password") +
        (matched ? esc(", " + num(matched) + " already had an account") : "") +
        (t.guardiansLinked ? esc(", " + num(t.guardiansLinked) + (t.guardiansLinked === 1 ? " guardian link" : " guardian links")) : "") + "."));
      if (!dry && invited) out.appendChild(el("p", "cx-note", "Nobody has a password yet. Each invited person sets their own, with api/scripts/set-password.sh until sign-in mail is set up."));
      if (t.skipped) {
        out.appendChild(el("p", "cx-note", esc(num(t.skipped) + (t.skipped === 1 ? " row has" : " rows have") + " a problem and " + (dry ? "would be" : t.skipped === 1 ? "was" : "were") + " skipped. Fix " + (t.skipped === 1 ? "it" : "them") + " in the file and run it again.")));
        var pt = K.cnTable([{ label: "Line", w: "48px" }, { label: "Person", w: "minmax(90px, 1fr)" }, { label: "Problem", w: "minmax(140px, 2fr)" }]);
        t.problems.forEach(function (p) { pt.row([String(p.row + 1), esc(p.email || ""), "<b>" + esc(p.field) + "</b> " + esc(p.message)]); });
        out.appendChild(pt);
        if (t.problemCount > t.problems.length) out.appendChild(el("p", "cx-note", esc("…and " + num(t.problemCount - t.problems.length) + " more.")));
      }
      if (dry && good) out.appendChild(el("p", "cx-note", "Choose Import to load the good rows."));
    }
    function show(r, dry) {
      out.innerHTML = "";
      if (r.problems && r.problems.length) {
        out.appendChild(el("p", "cx-note", esc(plural(r.problemCount || r.problems.length, "problem") + " found. Nothing was written.")));
        var t = K.cnTable([{ label: "Row", w: "60px" }, { label: "Field", w: "110px" }, { label: "Problem", w: "minmax(200px, 1fr)" }]);
        r.problems.slice(0, 40).forEach(function (p) { t.row([String(p.row), esc(p.field), esc(p.message)]); });
        out.appendChild(t);
        return;
      }
      if (r.applied) { out.appendChild(el("p", "cx-note", esc(plural(r.rows, "row") + " imported."))); return; }
      out.appendChild(el("p", "cx-note", esc(plural(r.rows, "row") + " are good. Choose Import to write them.")));
    }
    im.appendChild(field("What", iset));
    im.appendChild(cols);
    im.appendChild(pickf);
    im.appendChild(field("Rows (CSV)", area));
    var acts = el("div", "sx-acts");
    acts.appendChild(button("Check", "cn-btn", function () { run(true); }));
    acts.appendChild(button("Import", "cn-btn strong", function () { run(false); }));
    im.appendChild(acts);
    im.appendChild(out);
  };

  /* ========================================================= State reporting */
  /* What a district or state asks a school for. Today that is OEdu's own
     enrollment extract, checked student by student; a state's own file layout
     is added when its specification is, and this page says so rather than
     implying the file can be sent. */
  P.state = function (v) {
    K.cxPage(v, "Data Center", "State reporting", "The enrollment rows a district or state asks for, and what is missing from each student before they are sent.");
    var s = slot(v);
    var grid = el("div", "cx-grid");
    s.appendChild(grid);
    var xt = K.cxSection(grid, "cx-s12", "Enrollment extract", "Checked now, from the school’s records");
    var xbody = el("div");
    xt.appendChild(xbody);
    function check() {
      xbody.innerHTML = "";
      var n = K.loading(xbody, "the school’s records");
      API.exchange.extract().then(function (r) {
        n.remove();
        xbody.appendChild(el("p", "cx-note", esc(!r.rows.length ? "No students are enrolled yet, so there is nothing to send."
          : r.ready ? "Every student has what the extract needs." : plural(r.problems.length, "problem") + " to fix before this is sent.")));
        if (r.problems.length) {
          var t = K.cnTable([{ label: "Student", w: "minmax(150px, 1fr)" }, { label: "Field", w: "140px" }, { label: "Problem", w: "minmax(200px, 1.4fr)" }]);
          r.problems.slice(0, 60).forEach(function (p) { t.row(["<b>" + esc(p.student || "") + "</b>", esc(p.field), esc(p.message)]); });
          xbody.appendChild(t);
        }
        var acts = el("div", "sx-acts");
        acts.appendChild(button("Download the rows", "cn-btn strong", function () { download("oedu-enrollment-extract.csv", csv([r.columns].concat(r.rows))); }));
        acts.appendChild(button("Check again", "cn-btn", check));
        xbody.appendChild(acts);
        if (r.note) xbody.appendChild(el("p", "cx-note", esc(r.note)));
      }, function (e) { n.remove(); failedAt(xbody, e, check); });
    }
    check();
  };

  /* ================================================================ Builder */
  P.builder = function (v) {
    var page = K.cxPage(v, "Reports", "Report builder", "Choose a dataset, the columns and a filter; print it, download it, or keep it to run again.");
    var s = slot(v);
    var set = select(SETS.concat([["extract", "Students and what the school knows of them"]]), "users");
    var from = input("date", ""), to = input("date", "");
    var needle = input("text", "", "Only rows containing…");
    var bar = el("div", "sx-row2");
    bar.appendChild(field("Dataset", set));
    var rg = el("div", "sx-row2"); rg.appendChild(field("From", from)); rg.appendChild(field("To", to)); rg.hidden = true;
    set.addEventListener("change", function () { rg.hidden = set.value !== "attendance"; });
    bar.appendChild(rg);
    s.appendChild(bar);
    var acts = el("div", "sx-acts");
    var cols = el("div", "sx-chips");
    var table = el("div");
    var data = null, picked = {};
    var status = el("p", "cx-note", "Choose Run to load this dataset. Its columns then appear below, and you untick the ones you do not want.");
    function say(t) { status.textContent = t; }
    acts.appendChild(button("Run", "cn-btn strong", function () { run(); }));
    acts.appendChild(button("Download", "cn-btn", function () {
      if (!data) { say("Run the report first, then download it."); return; }
      var r = view();
      download("oedu-report.csv", csv([r.head].concat(r.rows)));
    }));
    acts.appendChild(button("Save this report", "cn-btn", function () {
      if (!data) { say("Run the report first, then save it."); return; }
      var name = prompt("Name this report");
      if (!name) return;
      // The columns shown, not the ones that happened to be touched: a column nobody unticked is still in the report.
      API.items.create({ kind: "report", title: name, data: { dataset: set.value, columns: view().head.join(","), filter: needle.value } })
        .then(function () { toast("Saved"); saved(); }, function (e) { toast(e.message); });
    }));
    s.appendChild(acts);
    s.appendChild(status);
    s.appendChild(field("Contains", needle));
    s.appendChild(cols);
    s.appendChild(table);
    var keep = el("div");
    s.appendChild(el("h3", "sx-h3", "Saved reports"));
    s.appendChild(keep);

    function view() {
      var idx = data.columns.map(function (c, i) { return i; }).filter(function (i) { return picked[data.columns[i]] !== false; });
      var n = needle.value.trim().toLowerCase();
      var rows = data.rows.filter(function (r) { return !n || r.some(function (c) { return String(c == null ? "" : c).toLowerCase().indexOf(n) > -1; }); });
      return { head: idx.map(function (i) { return data.columns[i]; }), rows: rows.map(function (r) { return idx.map(function (i) { return r[i]; }); }) };
    }
    function draw() {
      cols.innerHTML = "";
      data.columns.forEach(function (c) {
        var l = el("label", "sx-check"), i = el("input"); i.type = "checkbox"; i.checked = picked[c] !== false;
        i.addEventListener("change", function () { picked[c] = i.checked; draw(); });
        l.appendChild(i); l.appendChild(el("span", null, esc(c)));
        cols.appendChild(l);
      });
      table.innerHTML = "";
      var r = view();
      table.appendChild(el("p", "cx-note", esc(plural(r.rows.length, "row")) + (r.rows.length > 200 ? " — the first 200 are shown; the download has all of them." : "")));
      var t = K.cnTable(r.head.map(function (h) { return { label: h, w: "minmax(100px, 1fr)" }; }));
      r.rows.slice(0, 200).forEach(function (row) { t.row(row.map(function (c) { return esc(c == null ? "" : String(c)); })); });
      table.appendChild(t);
    }
    function run(saved) {
      say("Running…");
      var p = set.value === "extract"
        ? API.exchange.extract().then(function (r) { return { columns: r.columns, rows: r.rows }; })
        : API.exchange.exportRows(set.value, from.value || undefined, to.value || undefined);
      p.then(function (r) {
        data = r;
        picked = {};
        // A kept report shows only the columns it was saved with.
        if (saved && saved.columns) { var keep = saved.columns.split(","); r.columns.forEach(function (c) { picked[c] = keep.indexOf(c) > -1; }); }
        say("Untick the columns you do not want, then download or save the report.");
        draw();
      }, function (e) { say(e && e.message ? e.message : "That could not be run."); });
    }
    function saved() {
      keep.innerHTML = "";
      API.items.list({ kind: "report" }).then(function (list) {
        if (!list.length) { keep.appendChild(el("p", "sx-quiet", "None yet.")); return; }
        list.forEach(function (r) {
          var row = el("div", "sx-ev");
          row.appendChild(el("span", "t", "<b>" + esc(r.title) + "</b> <small>" + esc(r.data.dataset) + "</small>"));
          row.appendChild(button("Run", "en-btn quiet", function () {
            set.value = r.data.dataset; needle.value = r.data.filter || "";
            run({ columns: r.data.columns });
          }));
          keep.appendChild(row);
        });
      });
    }
    saved();
  };

  /* ================================================================ District */
  P.district = function (v) {
    K.cxPage(v, "Data Center", "District", "The schools under this organisation, side by side. A student’s record stays in their own school.");
    var s = slot(v);
    var n = K.loading(s, "the schools");
    API.district.summary().then(function (r) {
      n.remove();
      if (!r.isDistrict) s.appendChild(el("p", "cx-note", "This school is not part of a district yet. A platform administrator joins schools to one."));
      var t = K.cnTable([{ label: "School", w: "minmax(180px, 1.4fr)" }, { label: "Students", w: "90px", align: "right" }, { label: "Teachers", w: "90px", align: "right" },
        { label: "Sections", w: "90px", align: "right" }, { label: "Attendance, 30 days", w: "150px", align: "right" }]);
      r.schools.forEach(function (x) {
        t.row(["<b>" + esc(x.name) + "</b>", String(x.students), String(x.teachers), String(x.sections), x.attendanceRate == null ? none() : x.attendanceRate + "%"]);
      });
      s.appendChild(t);
    }).catch(function (e) { n.remove(); failedAt(s, e, function () { P.district(v); }); });
  };

  /* ================================================================= Outbox */
  P.outbox = function (v) {
    var page = K.cxPage(v, "Communicate", "Mail queue", "Email waiting to be sent. Nothing leaves until the school connects a mail service.");
    var s = slot(v);
    function load() {
      s.innerHTML = "";
      var n = K.loading(s, "the queue");
      API.inbox.outbox().then(function (r) {
        n.remove();
        s.appendChild(el("p", "cx-note", r.demo ? "This is a demo school: mail is off, and nothing here is ever sent." : r.configured ? "A mail service is connected." : "No mail service is connected, so these stay queued."));
        var acts = el("div", "sx-acts");
        acts.appendChild(button("Send what is queued", "cn-btn strong", function () { API.inbox.flush().then(function (x) { toast(x.configured ? plural(x.sent, "message") + " sent" : "No mail service is connected."); load(); }); }));
        acts.appendChild(button("Run reminders now", "cn-btn", function () { API.inbox.runReminders().then(function (x) { toast(plural(x.made.roll + x.made.due + x.made.documents, "reminder") + " made"); }); }));
        s.appendChild(acts);
        if (!r.mail.length) { s.appendChild(K.cnEmpty("Nothing queued.", "People who ask for email on a kind of notice appear here.")); return; }
        var t = K.cnTable([{ label: "To", w: "minmax(180px, 1fr)" }, { label: "Subject", w: "minmax(200px, 1.4fr)" }, { label: "Queued", w: "110px" }, { label: "Status", w: "90px" }]);
        r.mail.forEach(function (m) { t.row([esc(m.to), esc(m.subject), esc(ago(m.createdAt)), pill(m.status, m.status === "failed" ? "red" : m.status === "sent" ? "ok" : m.status === "suppressed" ? "" : "orange")]); });
        s.appendChild(t);
      }).catch(function (e) { n.remove(); failedAt(s, e, load); });
    }
    load();
  };

  /* ============================================================ Webhooks */
  P.webhooks = function (v) {
    P.records(v, { kind: "webhook", eyebrow: "Data Center", title: "Integrations", sub: "An address that is told when a record is made or changed, signed so the receiver knows it is us. " +
      "There is no file transfer by schedule here: send to a webhook, or download an export.", newLabel: "New webhook",
      tools: [["Send a test ping", function () { API.exchange.ping().then(function () { toast("Sent"); }, function (e) { toast(e.message); }); }]] });
  };

  Object.keys(P).forEach(function (k) { /* surface is P */ });
  return P;
};
