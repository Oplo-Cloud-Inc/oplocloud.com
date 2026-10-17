/* ==========================================================================
   OEdu on a phone — the school's smaller records.

   Leave, cover, referrals, detention, support plans, accommodations, events,
   forms, certifications, menus, lockers, equipment: the platform keeps these
   as one kind of thing, each with its own fields and its own statuses, and the
   server says what they are (GET /item-kinds). So one screen draws all of them
   and none is written out here:

     list     grouped by status, the ones that want someone first; narrow it
              with a status; a date tile for what has a day, a face for what is
              about a person
     one      what it says, its status changed with one tap (that is how a
              leave request is approved or declined), edit, remove
     new      a form made from the kind's own fields

   The same calls as the console's page: items.list / create / update / remove.
   The server decides who may do which; a refusal is said, not swallowed.
   Mounted by phone.js: OPLO_PHONE_RECORDS(P); P.records(tab, config).
   ========================================================================== */
window.OPLO_PHONE_RECORDS = function (P) {
  "use strict";

  var K = P.K, el = P.el, esc = P.esc, API = K.API;
  var KINDS = null, PEOPLE = null;
  function kinds() { return KINDS ? Promise.resolve(KINDS) : API.items.kinds().then(function (k) { KINDS = k; return k; }); }
  function people() {
    if (PEOPLE) return Promise.resolve(PEOPLE);
    return API.accounts.list(K.S.me.orgId).then(function (l) { PEOPLE = l || []; return PEOPLE; }, function () { return []; });
  }
  function nameOf(id) { var p = (PEOPLE || []).filter(function (x) { return x.id === id; })[0]; return p ? (p.name || p.email) : ""; }
  function cap(s) { return s ? String(s)[0].toUpperCase() + String(s).slice(1) : ""; }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b || a + "s"); }
  function X() { return K.stu().kit; }

  function pillTone(st) {
    return /^(overdue|skipped|declined|canceled|expired)$/.test(st) ? "red"
      : /^(pending|new|needed|assigned|draft|in review)$/.test(st) ? "orange"
      : /^(approved|served|covered|valid|returned|active|published|cleared)$/.test(st) ? "green"
      : /^(open|out|scheduled)$/.test(st) ? "blue" : "";
  }
  var MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  function dateTile(ymd) {
    var p = String(ymd).split("-");
    var t = el("span", "ph-dt", "<small>" + (MON[+p[1] - 1] || "") + "</small><b>" + (+p[2] || "") + "</b>");
    return t;
  }
  function field(label, node) { var l = el("label", "ph-field", "<small>" + esc(label) + "</small>"); l.appendChild(node); return l; }
  function cta(text, cls, go) { var b = el("button", "ph-cta" + (cls ? " " + cls : ""), esc(text)); b.type = "button"; b.addEventListener("click", go); return b; }

  /* Finding a person: a few letters, a short list, a pick. */
  P.finder = function (placeholder, pick) {
    var wrap = el("div"), inp = el("input"), out = el("div", "ph-found");
    inp.type = "search"; inp.placeholder = placeholder; inp.setAttribute("autocomplete", "off");
    inp.addEventListener("input", function () {
      var t = inp.value.trim().toLowerCase();
      out.innerHTML = "";
      if (t.length < 2) return;
      people().then(function (all) {
        var hits = all.filter(function (p) { return (p.name || "").toLowerCase().indexOf(t) > -1 || (p.email || "").toLowerCase().indexOf(t) > -1; }).slice(0, 6);
        out.innerHTML = "";
        if (!hits.length) out.appendChild(el("p", "ph-sub", "Nobody by that name."));
        hits.forEach(function (p) {
          var r = el("button", "ph-row has-ic");
          r.type = "button";
          r.appendChild(P.shared.avatar(p.name || p.email, 34));
          r.appendChild(el("span", "t", "<b>" + esc(p.name || p.email) + "</b><small>" + esc(p.title || p.email || "") + "</small>"));
          r.addEventListener("click", function () { inp.value = ""; out.innerHTML = ""; pick(p); });
          out.appendChild(r);
        });
      });
    });
    wrap.appendChild(inp); wrap.appendChild(out);
    return wrap;
  };

  /* ================================================================ The list */
  P.records = function (tab, cfg, o) {
    o = o || {};
    return P.present("rec:" + tab, 1, { tone: o.tone || "blue", label: cfg.title }, function (L) { build(L, tab, cfg, o); });
  };

  function build(L, tab, cfg, o) {
    L.head({ eyebrow: cfg.eyebrow || "Records", title: cfg.title, sub: cfg.sub });
    var host = L.add(el("div"));
    host.appendChild(P.skel(4, 72));
    Promise.all([kinds(), people()]).then(function (r) {
      var spec = r[0][cfg.kind];
      host.innerHTML = "";
      if (!spec) { host.appendChild(P.empty("This kind of record isn’t set up", "")); return; }
      var state = { status: "all", limit: 40 }, rows = [], me = K.S.me;
      var canMake = cfg.canCreate !== false && o.canCreate !== false;
      if (canMake) L.right.insertBefore(P.btn("", P.icon("plus"), "New " + spec.label.toLowerCase(), function () { editor(null); }), L.right.firstChild);
      var chips = el("div", "ph-fchips"), list = el("div");
      host.appendChild(chips);
      host.appendChild(list);
      L.refresh = load; L.onReveal = load;

      function load() {
        list.innerHTML = "";
        list.appendChild(P.skel(3, 72));
        API.items.list({ kind: cfg.kind }).then(function (l) { rows = l; draw(); }, function (e) { P.fail(list, e, load); });
      }
      function drawChips() {
        chips.innerHTML = "";
        var counts = { all: rows.length };
        spec.statuses.forEach(function (s) { counts[s] = rows.filter(function (x) { return x.status === s; }).length; });
        if (spec.statuses.length < 2) return;
        [["all", "All"]].concat(spec.statuses.map(function (s) { return [s, cap(s)]; })).filter(function (k) { return k[0] === "all" || counts[k[0]] || state.status === k[0]; }).forEach(function (k) {
          var b = el("button", "ph-ch" + (state.status === k[0] ? " on" : ""), esc(k[1]) + " <small>" + counts[k[0]] + "</small>");
          b.type = "button";
          b.setAttribute("aria-pressed", state.status === k[0] ? "true" : "false");
          b.addEventListener("click", function () { state.status = k[0]; state.limit = 40; draw(); });
          chips.appendChild(b);
        });
      }
      function rowFor(r) {
        var b = el("button", "ph-row has-ic" + (spec.about === "none" || !r.subjectName ? "" : ""));
        b.type = "button";
        if (r.dueOn && (spec.dated || spec.about === "none")) b.appendChild(dateTile(r.dueOn));
        else if (r.subjectName) b.appendChild(P.shared.avatar(r.subjectName, 36));
        else b.appendChild(el("span", "ph-dt", "<small>NEW</small><b>•</b>"));
        var extra = spec.fields.filter(function (f) { return f.type !== "longtext" && f.type !== "check" && r.data && r.data[f.k] != null && r.data[f.k] !== ""; }).slice(0, 2)
          .map(function (f) { var v = r.data[f.k]; return f.type === "person" ? nameOf(v) : String(v).slice(0, 40); }).filter(Boolean);
        var bits = [r.subjectName, r.courseTitle].concat(extra).filter(Boolean);
        b.appendChild(el("span", "t", "<b>" + esc(r.title) + "</b>" + (bits.length ? "<small>" + esc(bits.join(" · ")) + "</small>" : "")));
        b.insertAdjacentHTML("beforeend", P.chev);
        b.addEventListener("click", function () { detail(r); });
        return b;
      }
      function draw() {
        drawChips();
        list.innerHTML = "";
        var shown = rows.filter(function (x) { return state.status === "all" || x.status === state.status; });
        if (cfg.summary) { var sm = cfg.summary(rows); if (sm) list.appendChild(el("p", "ph-sub", esc(sm))); }
        if (!shown.length) {
          list.appendChild(P.empty(rows.length ? "Nothing with that status" : "Nothing here", canMake && !rows.length ? "Tap + to add one." : ""));
          return;
        }
        // The statuses that want someone first.
        var order = spec.statuses.slice();
        var by = {};
        shown.forEach(function (x) { (by[x.status] = by[x.status] || []).push(x); });
        var n = 0, more = 0;
        Object.keys(by).sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); }).forEach(function (st) {
          var items = by[st].sort(function (a, b) { return String(b.dueOn || "").localeCompare(String(a.dueOn || "")) || (b.createdAt || 0) - (a.createdAt || 0); });
          var room = state.limit - n;
          if (room <= 0) { more += items.length; return; }
          list.appendChild(P.sh(cap(st), { label: String(items.length) }));
          var g = P.group();
          items.slice(0, room).forEach(function (x) { g.appendChild(rowFor(x)); n++; });
          if (items.length > room) more += items.length - room;
          list.appendChild(g);
        });
        if (more) { var rr = el("div", "ph-btnrow"); rr.appendChild(cta("Show more", "quiet", function () { state.limit += 40; draw(); })); list.appendChild(rr); }
      }

      /* One record: what it says, and what can be done to it. */
      function detail(r) {
        var ctl = P.sheet({ title: r.title, sub: [r.subjectName ? "About " + r.subjectName : "", r.courseTitle, r.dueOn ? X().short(r.dueOn) : ""].filter(Boolean).join(" · "), tone: o.tone || "blue", body: function (b) {
          if (spec.statuses.length > 1) {
            b.appendChild(el("p", "ph-sub", "Status"));
            var seg = P.seg(spec.statuses.map(function (s) { return { k: s, label: cap(s) }; }), r.status, function (k) {
              API.items.update(r.id, update(r, { status: k })).then(function () { P.toast("Marked " + k); r.status = k; load(); }, function (e) { seg.set(r.status); P.toast(e && e.message ? e.message : "That was refused."); });
            });
            seg.style.marginTop = "0";
            b.appendChild(seg);
          }
          var g = P.group();
          g.style.marginTop = "14px";
          spec.fields.forEach(function (f) {
            var v = r.data && r.data[f.k];
            if (v == null || v === "" || v === false) return;
            var shown = f.type === "check" ? "Yes" : f.type === "person" ? (nameOf(v) || "—") : String(v);
            g.appendChild(el("div", "ph-kv", "<small>" + esc(f.label) + "</small><span>" + esc(shown) + "</span>"));
          });
          if (g.children.length) b.appendChild(g);
          var row = el("div", "ph-btnrow");
          row.appendChild(cta("Edit", "quiet", function () { ctl.close(); setTimeout(function () { editor(r); }, 300); }));
          row.appendChild(cta("Remove", "danger", function () {
            var c2 = P.sheet({ title: "Remove this?", sub: "“" + r.title + "” will be taken off the record.", tone: "gray", body: function (bb) {
              var rr = el("div", "ph-btnrow");
              rr.appendChild(cta("Keep it", "quiet", function () { c2.close(); }));
              rr.appendChild(cta("Remove", "danger", function () { API.items.remove(r.id).then(function () { c2.close(); ctl.close(); P.toast("Removed"); load(); }, function (e) { P.toast(e && e.message ? e.message : "That was refused."); }); }));
              bb.appendChild(rr);
            } });
          }));
          b.appendChild(row);
        } });
      }
      function update(r, patch) {
        var d = { title: r.title, status: r.status, data: r.data || {}, dueOn: r.dueOn || null };
        if (spec.about !== "none") d.subjectId = r.subjectId || null;
        if (spec.course) d.courseId = r.courseId || null;
        Object.keys(patch).forEach(function (k) { d[k] = patch[k]; });
        return d;
      }

      /* New, or edit: a form made from the kind's own fields. */
      function editor(r) {
        var isNew = !r, f = r || { title: "", status: spec.statuses[0], data: {}, dueOn: "" };
        var title = el("input"); title.type = "text"; title.value = f.title || ""; title.placeholder = cap(spec.label);
        var status = el("select", "ph-sel");
        spec.statuses.forEach(function (s) { var op = el("option"); op.value = s; op.textContent = cap(s); if (s === f.status) op.selected = true; status.appendChild(op); });
        var when = el("input"); when.type = "date"; when.value = f.dueOn || "";
        var subjectId = r ? r.subjectId : null, who = el("p", "ph-sub", r && r.subjectName ? esc(r.subjectName) : "Nobody chosen yet.");
        who.style.margin = "0 0 8px";
        var course = el("select", "ph-sel");
        var c0 = el("option"); c0.value = ""; c0.textContent = "No course"; course.appendChild(c0);
        var inputs = {};
        var ctl = P.sheet({ title: isNew ? "New " + spec.label.toLowerCase() : "Edit", sub: isNew ? "" : r.title, tone: o.tone || "blue", body: function (b) {
          var g = P.group();
          g.appendChild(field("Title", title));
          if (spec.dated) g.appendChild(field("Date", when));
          if (spec.statuses.length > 1) g.appendChild(field("Status", status));
          if (spec.about !== "none") {
            var wrap = el("div"); wrap.appendChild(who);
            wrap.appendChild(P.finder(spec.about === "staff" ? "Find a member of staff" : "Find a student", function (p) { subjectId = p.id; who.textContent = p.name || p.email; }));
            g.appendChild(field(spec.about === "staff" ? "Staff member" : "Student", wrap));
          }
          if (spec.course) {
            API.courses.mine().then(function (cs) { cs.forEach(function (c) { var op = el("option"); op.value = c.id; op.textContent = c.title; if (r && r.courseId === c.id) op.selected = true; course.appendChild(op); }); });
            g.appendChild(field("Course", course));
          }
          spec.fields.forEach(function (fd) {
            var val = f.data && f.data[fd.k], node;
            if (fd.type === "longtext") { node = el("textarea"); node.rows = 4; node.value = val || ""; }
            else if (fd.type === "select") { node = el("select", "ph-sel"); var o0 = el("option"); o0.value = ""; o0.textContent = "—"; node.appendChild(o0); fd.options.forEach(function (opt) { var oo = el("option"); oo.value = opt; oo.textContent = opt; if (opt === val) oo.selected = true; node.appendChild(oo); }); }
            else if (fd.type === "check") {
              var l = el("label", "ph-row"); l.innerHTML = '<span class="t"><b>' + esc(fd.label) + '</b></span><input type="checkbox" class="ph-sw"' + (val ? " checked" : "") + ">";
              inputs[fd.k] = l.querySelector("input"); g.appendChild(l); return;
            }
            else if (fd.type === "number") { node = el("input"); node.type = "number"; node.inputMode = "decimal"; node.value = val == null ? "" : val; }
            else if (fd.type === "date") { node = el("input"); node.type = "date"; node.value = val || ""; }
            else if (fd.type === "time") { node = el("input"); node.type = "time"; node.value = val || ""; }
            else if (fd.type === "person") {
              node = el("div");
              var cur = el("p", "ph-sub", val ? esc(nameOf(val) || "Chosen") : "Nobody chosen yet.");
              cur.style.margin = "0 0 8px";
              node.appendChild(cur);
              node.appendChild(P.finder("Find a person", function (p) { node.value = p.id; cur.textContent = p.name || p.email; }));
              node.value = val || "";
            } else { node = el("input"); node.type = "text"; node.value = val || ""; }
            inputs[fd.k] = node;
            g.appendChild(field(fd.label + (fd.required ? " *" : ""), node));
          });
          b.appendChild(g);
          var row = el("div", "ph-btnrow");
          var go = cta(isNew ? "Add" : "Save", "", function () {
            var data = {};
            spec.fields.forEach(function (fd) { var n = inputs[fd.k]; data[fd.k] = fd.type === "check" ? n.checked : n.value; });
            var miss = spec.fields.filter(function (fd) { return fd.required && !String(data[fd.k] == null ? "" : data[fd.k]).trim(); })[0];
            if (!title.value.trim()) { P.toast("A title, please."); return; }
            if (miss) { P.toast(miss.label + " is needed."); return; }
            var d = { title: title.value.trim(), status: status.value, data: data, dueOn: when.value || null };
            if (spec.about !== "none") d.subjectId = subjectId;
            if (spec.course) d.courseId = course.value || null;
            go.disabled = true;
            var call = isNew ? (d.kind = cfg.kind, API.items.create(d)) : API.items.update(r.id, d);
            call.then(function () { P.toast(isNew ? "Added" : "Saved"); ctl.close(); load(); }, function (e) { go.disabled = false; P.toast(e && e.message ? e.message : "That was refused."); });
          });
          row.appendChild(go);
          b.appendChild(row);
        } });
      }
      load();
    }, function (e) { P.fail(host, e, function () { L.el.remove(); P.records(tab, cfg, o); }); });
  }
};
