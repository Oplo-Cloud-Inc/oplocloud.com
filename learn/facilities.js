/* ==========================================================================
   OEdu — Facilities.

   The building as the people who run it see it: what has been reported and
   what is being done (work orders), the rooms and what is in them, what
   recurs (preventive jobs, inspections, the checks a school must be able to
   show it did), who holds which room when, the outside people and their
   papers, and the numbers.

   A teacher sees the part that is theirs: report a problem, watch it move,
   hold a room, and what is in their keeping.

   Whether a person may do any of it is decided on the server
   (api/src/core/guard.js, `facility.*`); this file draws what it was given,
   and a page the server refuses says so instead of showing less.

   Three files, one namespace. This is the core: helpers, work orders, and the
   staff page. facilities-places.js adds rooms and assets; facilities-upkeep.js
   adds schedules, bookings, vendors, documents and reports. app.js makes the
   lot with the console kit: OPLO_FX.make(kit) → { orders, spaces, assets,
   upkeep, bookings, vendors, documents, reports, staff }.
   ========================================================================== */
window.OPLO_FX = (function () {
  "use strict";

  var parts = [];

  function make(K) {
    var H = helpers(K);
    var pages = {};
    parts.forEach(function (fn) { var p = fn(H); for (var k in p) pages[k] = p[k]; });
    pages.H = H;
    return pages;
  }

  function helpers(K) {
    var el = K.el, esc = K.esc, API = K.API.facilities;
    var H = { K: K, el: el, esc: esc, API: API, toast: K.toast, open: {} };
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    /* ---- dates */
    H.day = function (ymd) {
      if (!ymd) return "";
      var p = String(ymd).split("-");
      return p.length === 3 ? (+p[2]) + " " + MONTHS[+p[1] - 1] + " " + p[0] : String(ymd);
    };
    H.dayShort = function (ymd) {
      var d = new Date(ymd + "T00:00:00");
      return DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()];
    };
    H.weekday = function (ymd) { return new Date(ymd + "T00:00:00").getDay(); };
    H.today = function () {
      var d = new Date();
      return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    };
    H.plus = function (ymd, n) {
      var d = new Date(ymd + "T00:00:00");
      d.setDate(d.getDate() + n);
      return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    };
    H.ago = function (ms) {
      if (!ms) return "";
      var s = Math.floor((Date.now() - ms) / 1000);
      if (s < 3600) return Math.max(1, Math.floor(s / 60)) + " min ago";
      if (s < 86400) return Math.floor(s / 3600) + " h ago";
      var d = Math.floor(s / 86400);
      return d === 1 ? "yesterday" : d + " days ago";
    };
    H.plural = function (n, a, b) { return n + " " + (n === 1 ? a : b || a + "s"); };
    H.number = function (n) { return "WO-" + ("0000" + n).slice(-4); };
    H.every = function (n, unit) { return n === 1 ? "Every " + unit : "Every " + n + " " + unit + "s"; };

    /* ---- chips */
    H.chip = function (tone, label) { return "<span class='en-st en-" + tone + "'><i></i>" + esc(label) + "</span>"; };
    var STATUS = { pending: ["orange", "Needs triage"], open: ["blue", "Open"], in_progress: ["blue", "In progress"],
                   on_hold: ["muted", "On hold"], done: ["green", "Done"], declined: ["muted", "Declined"], cancelled: ["muted", "Cancelled"] };
    /* To the person who asked, "needs triage" is the team's word; to them it is waiting. */
    H.status = function (s, asRequester) {
      var x = STATUS[s] || ["muted", s];
      return H.chip(x[0], asRequester && s === "pending" ? "Waiting" : x[1]);
    };
    H.statusName = function (s) { return (STATUS[s] || [0, s])[1]; };
    var PRIORITY = { urgent: ["red", "Urgent"], high: ["orange", "High"], normal: [null, "Normal"], low: ["muted", "Low"] };
    H.priority = function (p) { var x = PRIORITY[p]; return x && x[0] ? H.chip(x[0], x[1]) : "<span class='cn-none'>" + esc(x ? x[1] : p) + "</span>"; };
    H.expiry = function (state, on) {
      if (state === "expired") return H.chip("red", "Expired " + H.day(on));
      if (state === "soon") return H.chip("orange", "Expires " + H.day(on));
      if (state === "ok") return "<span>" + esc(H.day(on)) + "</span>";
      return "<span class='cn-none'>No date</span>";
    };
    H.CATEGORIES = [["maintenance", "Maintenance"], ["custodial", "Cleaning"], ["it", "Technology"], ["safety", "Safety"], ["grounds", "Grounds"], ["other", "Other"]];
    H.categoryName = function (c) { var x = H.CATEGORIES.filter(function (y) { return y[0] === c; })[0]; return x ? x[1] : c; };
    H.PRIORITIES = [["low", "Low"], ["normal", "Normal"], ["high", "High"], ["urgent", "Urgent"]];

    /* ---- forms and dialogs (the buttons are .en-btn on purpose: the
       console's sheet closes on any .cn-btn pressed inside it) */
    H.fld = function (kind, label, value, o) {
      o = o || {};
      var w = el("label", "admin-field en-f");
      w.appendChild(el("span", null, esc(label) + (o.req ? " <i class='en-req'>*</i>" : "")));
      var i;
      if (kind === "select") {
        i = el("select");
        (o.options || []).forEach(function (x) { var op = el("option"); op.value = x[0]; op.textContent = x[1]; i.appendChild(op); });
      } else if (kind === "area") { i = el("textarea"); i.rows = o.rows || 3; }
      else { i = el("input"); i.type = kind === "date" ? "date" : kind === "time" ? "time" : kind === "number" ? "number" : "text"; if (kind === "number") { i.min = o.min == null ? 0 : o.min; if (o.max != null) i.max = o.max; } }
      i.value = value == null ? "" : value;
      if (o.hint) i.placeholder = o.hint;
      if (o.max && kind !== "number") i.maxLength = o.max;
      w.appendChild(i);
      if (o.note) w.appendChild(el("small", "en-fnote", esc(o.note)));
      return { node: w, input: i, value: function () { return i.value.trim(); }, set: function (v) { i.value = v == null ? "" : v; } };
    };
    H.check = function (label, on) {
      var w = el("label", "en-radio");
      var c = el("input");
      c.type = "checkbox";
      c.checked = !!on;
      w.appendChild(c);
      w.appendChild(el("span", null, esc(label)));
      return { node: w, input: c, value: function () { return c.checked; } };
    };
    H.btn = function (label, cls, go) {
      var b = el("button", "en-btn" + (cls ? " " + cls : ""), esc(label));
      b.type = "button";
      if (go) b.addEventListener("click", go);
      return b;
    };
    H.dialog = function (o) {
      var box = el("div", "en-dlg" + (o.wide ? " en-wide" : ""));
      box.appendChild(el("h2", "en-dlg-h", esc(o.title)));
      if (o.sub) box.appendChild(el("p", "en-dlg-sub", o.rawSub ? o.sub : esc(o.sub)));
      var host = el("div", "en-dlg-body");
      box.appendChild(host);
      var err = el("div", "en-dlg-err");
      err.hidden = true;
      box.appendChild(err);
      var acts = el("div", "en-dlg-acts" + (o.wrap ? " en-wrap" : ""));
      var sheet = null;
      var ctl = { close: function () { if (sheet) sheet.close(); },
                  error: function (m) { err.hidden = !m; err.innerHTML = m ? (m.nodeType ? "" : esc(m)) : ""; if (m && m.nodeType) { err.appendChild(m); } },
                  host: host, actions: acts };
      acts.appendChild(H.btn(o.action ? "Cancel" : "Close", "quiet", ctl.close));
      if (o.action) {
        var go = H.btn(o.action, o.tone === "danger" ? "danger" : "strong", function () {
          ctl.error("");
          go.disabled = true;
          var out;
          try { out = o.onSubmit(ctl); } catch (e) { go.disabled = false; ctl.error(e.message); return; }
          Promise.resolve(out).then(function () { ctl.close(); }, function (e) {
            go.disabled = false;
            if (e && e.silent) return;            // the caller has already said what it wanted said
            ctl.error(e && e.message ? e.message : "That did not work.");
          });
        });
        acts.appendChild(go);
      }
      if (o.extra) o.extra(acts, ctl);
      box.appendChild(acts);
      sheet = K.cxSheet(box);
      if (o.body) o.body(host, ctl);
      return ctl;
    };
    H.fail = function (slot, e, retry) { K.failed(slot, e, retry); };

    /* ---- the rooms, read once and reused until something changes them */
    var SP = null;
    H.spaces = function (force) {
      if (!force && SP) return SP;
      SP = API.spaces().then(function (list) {
        var by = {}, kids = {};
        list.forEach(function (s) { by[s.id] = s; });
        list.forEach(function (s) { var p = s.parentId && by[s.parentId] ? s.parentId : ""; (kids[p] = kids[p] || []).push(s); });
        function cmp(a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); }
        var ordered = [];
        (function walk(p, depth) {
          (kids[p] || []).sort(cmp).forEach(function (s) { ordered.push({ s: s, depth: depth }); walk(s.id, depth + 1); });
        })("", 0);
        list.by = by; list.kids = kids; list.ordered = ordered;
        return list;
      }, function (e) { SP = null; throw e; });
      return SP;
    };
    H.bust = function () { SP = null; };
    H.path = function (list, id) {
      var names = [], s = list.by[id], g = 0;
      while (s && g++ < 8) { names.unshift(s.name); s = s.parentId ? list.by[s.parentId] : null; }
      return names.join(" › ");
    };
    H.spaceOptions = function (list, o) {
      o = o || {};
      var out = o.blank == null ? [] : [["", o.blank]];
      list.ordered.forEach(function (x) {
        if (o.only === "bookable" && !x.s.bookable) return;
        if (o.only === "rooms" && x.s.kind !== "room" && x.s.kind !== "area") return;
        out.push([x.s.id, new Array(x.depth + 1).join(" ") + x.s.name]);
      });
      return out;
    };

    var TEAM = null;
    H.team = function () {
      if (!TEAM) TEAM = API.team().catch(function () { return []; });
      return TEAM;
    };
    H.teamOptions = function (team, blank) {
      return [["", blank || "Nobody yet"]].concat(team.map(function (m) { return [m.id, m.name + (m.title ? " — " + m.title : "")]; }));
    };

    var PEOPLE = null;
    H.people = function () {
      if (PEOPLE) return Promise.resolve(PEOPLE);
      return K.API.accounts.list(K.S.me.orgId).then(function (l) { PEOPLE = l || []; return PEOPLE; }, function () { return []; });
    };

    var ME = null;
    H.me = function (force) {
      if (!force && ME) return ME;
      ME = API.summary().catch(function () { ME = null; return { can: {} }; });
      return ME;
    };

    /* ---- photos: a phone photo is several megabytes; the limit is 700 KB.
       Drawn smaller in the browser, which loses nothing a work order needs. */
    H.readImage = function (file) {
      return new Promise(function (resolve, reject) {
        if (!file) return reject(new Error("Choose a photo."));
        if (file.type === "application/pdf") {
          if (file.size > 700 * 1024) return reject(new Error("That PDF is " + Math.round(file.size / 1024) + " KB; the limit is 700 KB. Add a link to it instead."));
          var fr = new FileReader();
          fr.onload = function () { resolve({ name: file.name, type: file.type, data: String(fr.result).split(",")[1] }); };
          fr.onerror = function () { reject(new Error("That file could not be read.")); };
          return fr.readAsDataURL(file);
        }
        if (!/^image\//.test(file.type)) return reject(new Error("Choose a photo or a PDF."));
        var url = URL.createObjectURL(file), img = new Image();
        img.onload = function () {
          var edge = 1600, k = Math.min(1, edge / Math.max(img.width, img.height));
          var c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          var q = 0.82, data = c.toDataURL("image/jpeg", q).split(",")[1];
          while (data.length * 0.75 > 690 * 1024 && q > 0.3) { q -= 0.1; data = c.toDataURL("image/jpeg", q).split(",")[1]; }
          if (data.length * 0.75 > 700 * 1024) return reject(new Error("That photo is too large even when made smaller."));
          resolve({ name: file.name.replace(/\.[^.]+$/, "") + ".jpg", type: "image/jpeg", data: data });
        };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("That photo could not be opened here.")); };
        img.src = url;
      });
    };
    H.chooseFile = function (accept, got) {
      var i = el("input");
      i.type = "file"; i.accept = accept || "image/*,application/pdf";
      i.style.display = "none";
      document.body.appendChild(i);
      i.addEventListener("change", function () { var f = i.files && i.files[0]; i.remove(); if (f) got(f); });
      i.click();
    };
    H.show = function (file) {
      var w = window.open("", "_blank");
      if (!w) { K.toast("Allow pop-ups for this site to open it."); return; }
      var type = file.type || "application/octet-stream";
      var bin = atob(file.data), n = bin.length, u8 = new Uint8Array(n);
      for (var i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
      w.location.href = URL.createObjectURL(new Blob([u8], { type: type }));
    };

    /* ---- the pieces of a record that more than one page draws */
    H.line = function (box, label, value) {
      if (value == null || value === "") return;
      box.appendChild(el("p", "en-line", "<b>" + esc(label) + "</b> " + esc(value)));
    };
    H.history = function (box, events, title) {
      if (!events || !events.length) return;
      box.appendChild(el("h3", "en-h3", title || "History"));
      events.slice(0, 40).forEach(function (e) {
        box.appendChild(el("div", "en-step-r", "<span>" + esc(H.ago(e.at)) + "</span><small>" + esc(e.byName || "") + (e.byName ? " — " : "") +
          esc(e.kind === "note" ? "internal note" : e.kind) + (e.note ? ": " + esc(e.note).replace(/in_progress/g, "in progress").replace(/on_hold/g, "on hold") : "") + "</small>"));
      });
    };
    H.slot = function (v) { var s = el("div", "en-slot"); v.appendChild(s); return s; };

    /* parts add themselves, then make() runs them with these helpers */
    return H;
  }

  /* ======================================================== Work orders */
  parts.push(function (H) {
    var el = H.el, esc = H.esc, K = H.K, API = H.API, toast = H.toast;
    var ST = { f: "open", mine: false, q: "" };

    /* ---- the queue (the team's page) */
    function orders(v) {
      var P = K.cxPage(v, "Facilities", "Work orders",
        "What has been reported and what is being done about it. A request waits here until someone accepts it; the person who sent it watches it move.");
      P.tools.appendChild(K.cnAction("New work order", function () { newOrder({}, function () { K.openAdmin(true, "fx-orders"); }); }, true));
      var metrics = el("div");
      v.appendChild(metrics);
      var filters = el("div");
      filters.style.cssText = "display:flex;flex-wrap:wrap;margin-bottom:14px";
      v.appendChild(filters);
      var tools = el("div", "cn-bar en-tools");
      var find = el("input", "cn-search");
      find.type = "search"; find.placeholder = "Search title, room, asset or person"; find.value = ST.q;
      tools.appendChild(find);
      v.appendChild(tools);
      var slot = H.slot(v);

      var chips = K.cnFilters([{ k: "pending", name: "Needs triage" }, { k: "open", name: "Open" }, { k: "mine", name: "Mine" },
        { k: "overdue", name: "Overdue" }, { k: "done", name: "Finished" }, { k: "all", name: "All" }], ST.mine ? "mine" : ST.f, function (k) {
        ST.mine = k === "mine"; ST.f = k === "mine" ? "open" : k; chips.mark(k); load();
      });
      filters.appendChild(chips);
      var timer = null;
      find.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { ST.q = find.value.trim(); load(); }, 250); });

      H.me(true).then(function (s) {
        if (!s.orders) return;
        K.cxMetrics(metrics, [
          { label: "Needs triage", value: s.orders.pending, bad: true, go: function () { ST.f = "pending"; ST.mine = false; chips.mark("pending"); load(); } },
          { label: "Open", value: s.orders.open + s.orders.inProgress + s.orders.onHold, note: s.orders.unassigned ? s.orders.unassigned + " unassigned" : "" },
          { label: "Overdue", value: s.orders.overdue, bad: true, go: function () { ST.f = "overdue"; ST.mine = false; chips.mark("overdue"); load(); } },
          { label: "Mine", value: s.orders.mine, go: function () { ST.mine = true; chips.mark("mine"); load(); } },
          { label: "Papers running out", value: s.documents.expired + s.documents.soon, bad: s.documents.expired > 0, go: function () { K.openAdmin(false, "fx-documents"); } }
        ]);
      });

      function query() {
        var o = { q: ST.q || undefined };
        if (ST.mine) { o.mine = 1; o.status = "unfinished"; }
        else if (ST.f === "pending") o.status = "pending";
        else if (ST.f === "open") o.status = "open,in_progress,on_hold";
        else if (ST.f === "overdue") o.overdue = 1;
        else if (ST.f === "done") o.status = "done,declined,cancelled";
        return o;
      }
      function load() {
        slot.innerHTML = "";
        slot.appendChild(el("div", "admin-loading", "Loading work orders…"));
        Promise.all([API.orders(query()), H.spaces()]).then(function (r) {
          slot.innerHTML = "";
          var rows = r[0].orders;
          if (!rows.length) {
            slot.appendChild(K.cnEmpty(ST.q ? "Nothing matches." : ST.f === "pending" ? "Nothing is waiting." : "No work orders here.",
              ST.q ? "Clear the search to see more." : "A request from a teacher, a job a schedule writes, or one you raise yourself appears here.",
              "New work order", function () { newOrder({}, load); }));
            return;
          }
          var t = K.cnTable([{ label: "#", w: "76px" }, { label: "What", w: "minmax(210px, 1.7fr)" }, { label: "Where", w: "minmax(140px, 1.1fr)" },
            { label: "Priority", w: "92px" }, { label: "Assigned", w: "minmax(100px, .8fr)" }, { label: "Due", w: "96px" }, { label: "Status", w: "112px" }]);
          rows.slice(0, 400).forEach(function (o) {
            var late = o.overdue;
            t.row(["<span class='cn-mono'>" + esc(H.number(o.number)) + "</span>",
                   "<b>" + esc(o.title) + "</b><span class='cn-sub2'>" + esc(H.categoryName(o.category)) +
                     (o.requesterName && o.kind === "request" ? " · from " + esc(o.requesterName) : o.kind !== "request" ? " · " + esc(o.kind) : "") + "</span>",
                   o.spaceId && r[1].by[o.spaceId] ? esc(r[1].by[o.spaceId].name) : "<span class='cn-none'>—</span>",
                   H.priority(o.priority), o.assigneeName ? esc(o.assigneeName) : "<span class='cn-none'>—</span>",
                   o.dueOn ? "<span class='" + (late ? "en-late" : "") + "'>" + esc(H.day(o.dueOn)) + "</span>" : "<span class='cn-none'>—</span>",
                   H.status(o.status)], function () { sheet(o.id, load); }, o.id);
          });
          slot.appendChild(t);
          if (rows.length > 400) slot.appendChild(el("p", "en-note", "Showing the first 400. Search to narrow it."));
        }, function (e) { H.fail(slot, e, load); });
      }
      load();
    }

    /* ---- a new order: the team's full form, or a teacher's short one */
    function newOrder(pre, done) {
      pre = pre || {};
      Promise.all([H.spaces(), H.me(), H.team()]).then(function (r) {
        var list = r[0], team = r[1].can && r[1].can.work, who = r[2];
        var title = H.fld("text", "What needs doing", pre.title || "", { req: true, max: 160, hint: "The projector will not turn on" });
        var where = H.fld("select", "Where", pre.spaceId || "", { options: H.spaceOptions(list, { blank: "Choose a room…", only: "rooms" }) });
        var cat = H.fld("select", "Kind of job", pre.category || "maintenance", { options: H.CATEGORIES });
        var pri = H.fld("select", "How urgent", pre.priority || "normal", { options: H.PRIORITIES });
        var assignee = H.fld("select", "Give it to", "", { options: H.teamOptions(who) });
        var due = H.fld("date", "Due", "");
        var details = H.fld("area", "More detail", pre.details || "", { rows: 3, max: 4000 });
        var photo = null, photoLine = el("p", "en-note", "");
        var already = el("div", "fx-already");
        where.input.addEventListener("change", function () {
          already.innerHTML = "";
          if (!where.input.value) return;
          API.openIn(where.input.value).then(function (open) {
            if (!open.length) return;
            already.innerHTML = "<b>Already open in this room</b>" + open.map(function (o) {
              return "<span>" + esc(H.number(o.number)) + " · " + esc(o.title) + " — " + esc(H.statusName(o.status)) + "</span>";
            }).join("");
          });
        });
        if (pre.spaceId) where.input.dispatchEvent(new Event("change"));
        H.dialog({
          title: team ? "New work order" : "Report a problem",
          sub: team ? "It goes straight onto the list." : "The office will look at it and you will see it move here.",
          wide: true, action: team ? "Create it" : "Send it",
          body: function (h) {
            h.appendChild(title.node);
            var g = el("div", "en-form-grid");
            [where, cat, pri].forEach(function (f) { g.appendChild(f.node); });
            if (team) { g.appendChild(assignee.node); g.appendChild(due.node); }
            h.appendChild(g);
            h.appendChild(already);
            h.appendChild(details.node);
            var pick = H.btn("Add a photo…", "quiet", function () {
              H.chooseFile("image/*", function (f) {
                photoLine.textContent = "Reading the photo…";
                H.readImage(f).then(function (p) { photo = p; photoLine.textContent = p.name + " — " + Math.round(p.data.length * 0.75 / 1024) + " KB, ready."; },
                  function (e) { photoLine.textContent = e.message; });
              });
            });
            h.appendChild(pick); h.appendChild(photoLine);
          },
          onSubmit: function () {
            if (!title.value()) throw new Error("Say what needs doing in a line.");
            return API.addOrder({ title: title.value(), details: details.value(), spaceId: where.value() || undefined, category: cat.value(),
              priority: pri.value(), assigneeId: team && assignee.value() ? assignee.value() : undefined,
              dueOn: team && due.value() ? due.value() : undefined, assetId: pre.assetId, clientKey: "ui-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) })
              .then(function (r) {
                if (photo) return API.addPhoto(r.order.id, photo).then(function () { return r; }, function () { toast("Sent, but the photo did not go."); return r; });
                return r;
              }).then(function () { H.me(true); toast(team ? "Created." : "Sent. You can follow it under Facilities."); if (done) done(); });
          }
        });
      }, function (e) { toast(e.message); });
    }

    /* ---- one order, with what can be done to it */
    function sheet(id, done) {
      Promise.all([API.order(id), H.spaces(), H.team()]).then(function (r) {
        var d = r[0], o = d.order, list = r[1], who = r[2], can = d.can;
        var box = el("div", "en-dlg en-wide");
        var sheetRef = null;
        function reload() { if (sheetRef) sheetRef.close(); sheet(id, done); }
        function fire(p, msg) {
          return p.then(function () { toast(msg); H.me(true); reload(); if (done) done(); }, function (e) {
            if (e.unfinished) toast(e.message); else toast(e.message);
          });
        }
        box.appendChild(el("h2", "en-dlg-h", esc(o.title)));
        box.appendChild(el("p", "en-dlg-sub", H.status(o.status, !can.work) + " &nbsp; " + esc(H.number(o.number)) + " · " + esc(H.categoryName(o.category)) +
          " · " + (o.kind === "request" ? "request" : esc(o.kind))));
        H.line(box, "Where", o.spaceId && list.by[o.spaceId] ? H.path(list, o.spaceId) : "");
        H.line(box, "Asset", o.assetName ? o.assetName + (o.assetCode ? " (" + o.assetCode + ")" : "") : "");
        H.line(box, "Priority", H.PRIORITIES.filter(function (p) { return p[0] === o.priority; })[0][1]);
        H.line(box, "From", o.requesterName);
        H.line(box, "Assigned to", o.assigneeName);
        H.line(box, "Due", o.dueOn ? H.day(o.dueOn) + (o.overdue ? " — overdue" : "") : "");
        H.line(box, "Vendor", o.vendorName);
        H.line(box, "Detail", o.details);
        H.line(box, "Why not", o.declineReason);
        H.line(box, "What was done", o.outcome);
        if (o.minutes != null) H.line(box, "Time", o.minutes + " minutes");

        if (o.checklist && o.checklist.length) {
          box.appendChild(el("h3", "en-h3", "Checklist"));
          var answers = {};
          var editable = can.work && ["open", "in_progress", "on_hold"].indexOf(o.status) > -1;
          o.checklist.forEach(function (c) {
            var row = el("div", "fx-check");
            var lab = el("span", null, esc(c.text) + (c.raised ? " <small>— raised an order</small>" : ""));
            if (c.type === "check") {
              var cb = el("input"); cb.type = "checkbox"; cb.checked = !!c.done || c.result === "na"; cb.disabled = !editable;
              cb.addEventListener("change", function () { save([{ id: c.id, done: cb.checked }]); });
              row.appendChild(cb);
            } else if (c.type === "pass_fail") {
              var s = el("select"); s.disabled = !editable;
              [["", "—"], ["pass", "Pass"], ["fail", "Fail"], ["na", "N/A"]].forEach(function (x) { var op = el("option"); op.value = x[0]; op.textContent = x[1]; s.appendChild(op); });
              s.value = c.result || "";
              s.addEventListener("change", function () { save([{ id: c.id, result: s.value || undefined }]); });
              row.appendChild(s);
            } else {
              var ni = el("input"); ni.type = "text"; ni.value = c.note || ""; ni.placeholder = "Note"; ni.disabled = !editable;
              ni.addEventListener("change", function () { save([{ id: c.id, note: ni.value }]); });
              row.appendChild(ni);
            }
            row.appendChild(lab);
            if (c.note && c.type !== "note") row.appendChild(el("small", "fx-note", esc(c.note)));
            box.appendChild(row);
          });
          var saveT = null;
          function save(a) {
            a.forEach(function (x) { answers[x.id] = Object.assign(answers[x.id] || {}, x); });
            clearTimeout(saveT);
            saveT = setTimeout(function () {
              API.act(id, "checklist", { answers: Object.keys(answers).map(function (k) { return answers[k]; }) }).then(function () { answers = {}; }, function (e) { toast(e.message); });
            }, 300);
          }
        }

        if (d.files && d.files.length) {
          box.appendChild(el("h3", "en-h3", "Photos"));
          var strip = el("div", "fx-photos");
          box.appendChild(strip);
          d.files.forEach(function (f) {
            var b = el("button", "fx-photo", esc(f.name));
            b.type = "button";
            b.addEventListener("click", function () { API.photo(id, f.id).then(function (file) { H.show(file); }, function (e) { toast(e.message); }); });
            strip.appendChild(b);
            if (/^image\//.test(f.type)) {
              API.photo(id, f.id).then(function (file) {
                b.textContent = "";
                var im = el("img"); im.alt = f.name; im.src = "data:" + file.type + ";base64," + file.data;
                b.appendChild(im);
              }, function () {});
            }
          });
        }
        H.history(box, d.events);

        var acts = el("div", "en-dlg-acts en-wrap");
        function note(text, internal) { return fire(API.act(id, "comment", { note: text, internal: internal }), "Added."); }
        function ask(title, label, hint, action, go, extra) {
          var f = H.fld("area", label, "", { rows: 3, max: 400, hint: hint });
          H.dialog({ title: title, action: action, body: function (h) { h.appendChild(f.node); if (extra) extra(h); },
            onSubmit: function () { return go(f.value()); } });
        }
        var mayWork = can.work;
        if (mayWork) {
          if (o.status === "pending") {
            acts.appendChild(H.btn("Accept…", "strong", function () {
              var asg = H.fld("select", "Give it to", o.assigneeId || "", { options: H.teamOptions(who) });
              var pri = H.fld("select", "How urgent", o.priority, { options: H.PRIORITIES });
              var due = H.fld("date", "Due", o.dueOn || "");
              H.dialog({ title: "Accept this request", sub: "It becomes an open work order, and the person who sent it sees that.", action: "Accept",
                body: function (h) { h.appendChild(asg.node); h.appendChild(pri.node); h.appendChild(due.node); },
                onSubmit: function () { return fire(API.act(id, "approve", { assigneeId: asg.value() || undefined, priority: pri.value(), dueOn: due.value() || undefined }), "Accepted."); } });
            }));
            acts.appendChild(H.btn("Decline…", "", function () {
              ask("Decline this request", "Why not", "Say why, so they know what to do next", "Decline", function (t) {
                if (!t) throw new Error("Give a reason; they will read it.");
                return fire(API.act(id, "decline", { reason: t }), "Declined.");
              });
            }));
          }
          if (o.status === "open" || o.status === "on_hold") acts.appendChild(H.btn(o.status === "on_hold" ? "Resume" : "Start", "strong", function () { fire(API.act(id, "start"), "Started."); }));
          if (o.status === "open" || o.status === "in_progress") acts.appendChild(H.btn("Put on hold…", "", function () {
            ask("Put on hold", "What it is waiting for", "A part, a person, a date", "Hold it", function (t) { return fire(API.act(id, "hold", { note: t || undefined }), "On hold."); });
          }));
          if (["open", "in_progress", "on_hold"].indexOf(o.status) > -1) {
            acts.appendChild(H.btn("Complete…", "strong", function () {
              var mins = H.fld("number", "Minutes spent", "", { min: 0, max: 100000 });
              var out = H.fld("area", "What was found or done", "", { rows: 3, max: 400 });
              H.dialog({ title: "Complete this work order", action: "Mark it done",
                body: function (h) { h.appendChild(mins.node); h.appendChild(out.node); },
                onSubmit: function (ctl) {
                  return API.act(id, "complete", { minutes: mins.value() === "" ? undefined : +mins.value(), outcome: out.value() || undefined }).then(
                    function () { toast("Done."); H.me(true); reload(); if (done) done(); },
                    function (e) {
                      if (e.unfinished && e.unfinished.length) {
                        throw new Error(e.message + " " + e.unfinished.map(function (x) { return "“" + x.text + "”"; }).join(", ") + ". Answer them on the order first.");
                      }
                      throw e;
                    });
                } });
            }));
            acts.appendChild(H.btn("Assign…", "", function () {
              var asg = H.fld("select", "Give it to", o.assigneeId || "", { options: H.teamOptions(who) });
              H.dialog({ title: "Assign", action: "Save", body: function (h) { h.appendChild(asg.node); },
                onSubmit: function () { return fire(API.act(id, "assign", { assigneeId: asg.value() || null }), "Assigned."); } });
            }));
          }
          if (o.status === "done" || o.status === "cancelled") acts.appendChild(H.btn("Reopen", "", function () { fire(API.act(id, "reopen"), "Reopened."); }));
          if (o.status === "declined") acts.appendChild(H.btn("Reconsider", "", function () { fire(API.act(id, "reconsider"), "Back in the queue."); }));
        }
        if (["pending", "open", "in_progress", "on_hold"].indexOf(o.status) > -1 && (mayWork || (can.own && ["pending", "open"].indexOf(o.status) > -1))) {
          acts.appendChild(H.btn(can.own && !mayWork ? "Withdraw it" : "Cancel it", "quiet", function () {
            ask(can.own && !mayWork ? "Withdraw this request" : "Cancel this work order", "Why", "Optional", "Yes, cancel it", function (t) { return fire(API.act(id, "cancel", { note: t || undefined }), "Cancelled."); });
          }));
        }
        if (can.work || can.own) {
          acts.appendChild(H.btn("Add a note…", "quiet", function () {
            var f = H.fld("area", "Note", "", { rows: 3, max: 2000 });
            var internal = H.check("Only the team sees this", false);
            H.dialog({ title: "Add a note", action: "Add", body: function (h) { h.appendChild(f.node); if (can.work) h.appendChild(internal.node); },
              onSubmit: function () { if (!f.value()) throw new Error("Write the note."); return note(f.value(), can.work && internal.value()); } });
          }));
          acts.appendChild(H.btn("Add a photo…", "quiet", function () {
            H.chooseFile("image/*", function (file) {
              H.readImage(file).then(function (p) { return API.addPhoto(id, p); }).then(function () { toast("Photo added."); reload(); }, function (e) { toast(e.message); });
            });
          }));
        }
        acts.appendChild(H.btn("Close", "quiet", function () { sheetRef.close(); }));
        box.appendChild(acts);
        sheetRef = K.cxSheet(box);
      }, function (e) { toast(e.message); });
    }

    H.open.order = sheet;
    H.open.newOrder = newOrder;

    /* ======================================== the staff page (a teacher's) */
    function staff(v) {
      var P = K.cxPage(v, "School", "Facilities",
        "Report something that needs fixing and watch it move, hold a room, and see what is in your keeping.");
      P.tools.appendChild(K.cnAction("Report a problem", function () { newOrder({}, function () { K.openAdmin(true, "facilities"); }); }, true));
      P.tools.appendChild(K.cnAction("Book a room", function () { if (H.open.book) H.open.book({}, function () { K.openAdmin(true, "facilities"); }); }));
      var metrics = el("div");
      v.appendChild(metrics);
      var mine = el("div");
      v.appendChild(mine);
      var books = el("div");
      v.appendChild(books);
      var keep = el("div");
      v.appendChild(keep);

      function loadMine() {
        mine.innerHTML = "<h3 class='en-h3'>Your requests</h3>";
        var slot = H.slot(mine);
        slot.appendChild(el("div", "admin-loading", "Loading…"));
        Promise.all([API.orders({}), H.spaces()]).then(function (r) {
          slot.innerHTML = "";
          var rows = r[0].orders;
          K.cxMetrics(metrics, [
            { label: "Waiting", value: rows.filter(function (o) { return o.status === "pending"; }).length },
            { label: "Being worked on", value: rows.filter(function (o) { return ["open", "in_progress", "on_hold"].indexOf(o.status) > -1; }).length },
            { label: "Done", value: rows.filter(function (o) { return o.status === "done"; }).length }
          ]);
          if (!rows.length) { slot.appendChild(K.cnEmpty("You have not reported anything.", "When something needs fixing, report it here and you will see who has it and when it is done.", "Report a problem", function () { newOrder({}, loadMine); })); return; }
          var t = K.cnTable([{ label: "#", w: "76px" }, { label: "What", w: "minmax(200px, 1.6fr)" }, { label: "Where", w: "minmax(120px, 1fr)" },
            { label: "Sent", w: "100px" }, { label: "Status", w: "112px" }]);
          rows.forEach(function (o) {
            t.row(["<span class='cn-mono'>" + esc(H.number(o.number)) + "</span>", "<b>" + esc(o.title) + "</b>" +
                   (o.status === "declined" && o.declineReason ? "<span class='cn-sub2'>" + esc(o.declineReason) + "</span>" : o.assigneeName ? "<span class='cn-sub2'>With " + esc(o.assigneeName) + "</span>" : ""),
                   o.spaceId && r[1].by[o.spaceId] ? esc(r[1].by[o.spaceId].name) : "<span class='cn-none'>—</span>",
                   esc(H.ago(o.createdAt)), H.status(o.status, true)], function () { sheet(o.id, loadMine); }, o.id);
          });
          slot.appendChild(t);
        }, function (e) { H.fail(slot, e, loadMine); });
      }
      function loadBooks() {
        books.innerHTML = "<h3 class='en-h3'>Your room bookings</h3>";
        var slot = H.slot(books);
        API.bookings({ mine: 1 }).then(function (r) {
          var rows = r.bookings.filter(function (b) { return b.day >= r.today && b.status !== "cancelled" && b.status !== "declined"; });
          if (!rows.length) { slot.appendChild(el("p", "en-note", "Nothing booked. Use Book a room to hold one.")); return; }
          var t = K.cnTable([{ label: "When", w: "minmax(150px, 1fr)" }, { label: "Room", w: "minmax(120px, 1fr)" }, { label: "For", w: "minmax(160px, 1.4fr)" }, { label: "Status", w: "112px" }, { label: "", w: "90px" }]);
          rows.forEach(function (b) {
            var cancel = H.btn("Cancel", "quiet", function () {
              API.bookAct(b.id, "cancel", { series: false }).then(function () { toast("Cancelled."); loadBooks(); }, function (e) { toast(e.message); });
            });
            t.row([esc(H.dayShort(b.day)) + " · " + esc(b.starts) + "–" + esc(b.ends), esc(b.spaceName), esc(b.title),
                   b.status === "pending" ? H.chip("orange", "Waiting") : H.chip("green", "Approved"), cancel]);
          });
          slot.appendChild(t);
        }, function (e) { slot.appendChild(el("p", "en-note", esc(e.message))); });
      }
      function loadKeep() {
        API.assets({ mine: 1 }).then(function (r) {
          if (!r.assets.length) return;
          keep.innerHTML = "<h3 class='en-h3'>In your keeping</h3>";
          var t = K.cnTable([{ label: "Name", w: "minmax(160px, 1.4fr)" }, { label: "Code", w: "110px" }, { label: "Room", w: "minmax(100px, 1fr)" }, { label: "", w: "150px" }]);
          r.assets.forEach(function (a) {
            var rep = H.btn("Report a problem", "quiet", function () { newOrder({ assetId: a.id, spaceId: a.spaceId, title: a.name + ": " }, loadMine); });
            t.row(["<b>" + esc(a.name) + "</b>", "<span class='cn-mono'>" + esc(a.code) + "</span>", a.spaceName ? esc(a.spaceName) : "<span class='cn-none'>—</span>", rep]);
          });
          keep.appendChild(t);
        }, function () {});
      }
      loadMine(); loadBooks(); loadKeep();
    }

    return { orders: orders, staff: staff };
  });

  return { make: make, add: function (fn) { parts.push(fn); } };
})();
