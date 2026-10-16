/* ==========================================================================
   OEdu — Facilities: rooms and what is in them.

   A room is where a request, a booking, a schedule and an asset all point.
   It is added by range (101 to 118) because forty one-at-a-time forms is how
   a system stays empty, it carries its own booking rules, and it has a QR
   label: a phone that scans it opens the report-a-problem page with the room
   already chosen.

   An asset has a code printed on it. Counting a room is reading those codes
   against what the register says is there.

   Adds `spaces` and `assets` to OPLO_FX (see facilities.js).
   ========================================================================== */
OPLO_FX.add(function (H) {
  "use strict";
  var el = H.el, esc = H.esc, K = H.K, API = H.API, toast = H.toast;
  var DAYNAMES = [[1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"]];
  var ASSET_STATUS = { in_service: ["green", "In service"], repair: ["orange", "Repair"], storage: ["muted", "In storage"], retired: ["muted", "Retired"], lost: ["red", "Lost"] };

  /* Where a room's QR code leads: the phone page, with the room chosen. */
  function roomUrl(id) {
    var home = window.OPLO_HOME, root = home && home.parse ? home.parse(location.pathname).root : "/";
    return location.origin + root + "jobs/?room=" + encodeURIComponent(id);
  }
  H.roomUrl = roomUrl;

  function labelPage(rooms, list) {
    var css = "<style>.sheet{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.lab{border:.5pt dashed #bbb;padding:.14in;text-align:center;" +
      "break-inside:avoid;box-sizing:border-box}.lab svg{width:1.6in;height:1.6in}.lab b{display:block;font-size:15pt;margin-top:.04in}" +
      ".lab span{display:block;font-size:9pt;color:#444}.lab small{display:block;font-size:6.5pt;color:#777;word-break:break-all;margin-top:.04in}" +
      "@media print{.lab{border:0}}</style>";
    return css + "<div class='sheet'>" + rooms.map(function (s) {
      return "<div class='lab'>" + OPLO_QR.svg(roomUrl(s.id), { level: "M" }) + "<b>" + esc(s.name) + "</b><span>Scan to report a problem</span>" +
        "<small>" + esc(H.path(list, s.id)) + "</small></div>";
    }).join("") + "</div>";
  }

  /* The rules of a room, as a form: hours, days, how far ahead, notice,
     length, the gap to leave. */
  function rulesForm(rules) {
    var r = rules || {};
    var box = el("div", "fx-rules");
    var opens = H.fld("time", "Opens", r.opens || "07:00"), closes = H.fld("time", "Closes", r.closes || "21:00");
    var ahead = H.fld("number", "Up to how many days ahead", r.daysAhead == null ? 180 : r.daysAhead, { min: 1, max: 730 });
    var notice = H.fld("number", "Hours of notice", r.noticeHours || 0, { min: 0, max: 720 });
    var max = H.fld("number", "Longest booking, minutes", r.maxMinutes || 0, { min: 0, max: 1440, note: "0 for no limit." });
    var buf = H.fld("number", "Minutes to leave between bookings", r.bufferMinutes || 0, { min: 0, max: 240 });
    var g = el("div", "en-form-grid");
    [opens, closes, ahead, notice, max, buf].forEach(function (f) { g.appendChild(f.node); });
    box.appendChild(g);
    var days = el("div", "fx-days");
    var on = {};
    (r.days || [1, 2, 3, 4, 5]).forEach(function (d) { on[d] = true; });
    var boxes = DAYNAMES.map(function (d) {
      var c = H.check(d[1], !!on[d[0]]);
      c.day = d[0];
      days.appendChild(c.node);
      return c;
    });
    box.appendChild(el("span", "fx-label", "Days it can be held"));
    box.appendChild(days);
    var blocked = H.fld("area", "Days it cannot be held", (r.blocked || []).join("\n"), { rows: 2, note: "One date a line, like 2026-12-25." });
    box.appendChild(blocked.node);
    return {
      node: box,
      value: function () {
        return {
          opens: opens.value(), closes: closes.value(), daysAhead: +ahead.value() || 180, noticeHours: +notice.value() || 0,
          maxMinutes: +max.value() || 0, bufferMinutes: +buf.value() || 0,
          days: boxes.filter(function (b) { return b.value(); }).map(function (b) { return b.day; }),
          blocked: blocked.value().split(/[\s,]+/).filter(Boolean)
        };
      }
    };
  }

  /* ============================================================== Rooms */
  var SS = { q: "" };

  function spaces(v) {
    var P = K.cxPage(v, "Facilities", "Spaces",
      "The buildings, floors and rooms — and for each, what is in it, what is open there, and the rules for holding it. Rooms are added by the dozen.");
    P.tools.appendChild(K.cnAction("Add rooms", function () { addRooms(null, refresh); }, true));
    P.tools.appendChild(K.cnAction("Print room labels", function () { labels(); }));
    var tools = el("div", "cn-bar en-tools");
    var find = el("input", "cn-search");
    find.type = "search"; find.placeholder = "Search rooms"; find.value = SS.q;
    tools.appendChild(find);
    v.appendChild(tools);
    var slot = H.slot(v);
    var timer = null;
    find.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { SS.q = find.value.trim().toLowerCase(); draw(); }, 200); });
    var data = null;
    function refresh() { H.bust(); load(); }
    function load() {
      slot.innerHTML = "";
      slot.appendChild(el("div", "admin-loading", "Loading rooms…"));
      H.spaces().then(function (list) { data = list; draw(); }, function (e) { H.fail(slot, e, load); });
    }
    function draw() {
      slot.innerHTML = "";
      var list = data;
      if (!list.length) {
        slot.appendChild(K.cnEmpty("No rooms yet.", "Start with a building, then add its rooms by range: 101 to 118 is eighteen rooms in one step.", "Add rooms", function () { addRooms(null, refresh); }));
        return;
      }
      var t = K.cnTable([{ label: "Name", w: "minmax(220px, 1.8fr)" }, { label: "Number", w: "90px" }, { label: "Seats", w: "70px", align: "right" },
        { label: "Assets", w: "70px", align: "right" }, { label: "Open work", w: "90px", align: "right" }, { label: "Can be held", w: "110px" }]);
      var shown = 0;
      list.ordered.forEach(function (x) {
        var s = x.s;
        if (SS.q && (s.name + " " + (s.code || "") + " " + H.path(list, s.id)).toLowerCase().indexOf(SS.q) < 0) return;
        shown++;
        t.row(["<span style='display:block;padding-left:" + (x.depth * 18) + "px'><b>" + esc(s.name) + "</b>" + (s.kind !== "room" ? "<span class='cn-sub2'>" + esc(s.kind) + "</span>" : "") + "</span>",
               s.code ? "<span class='cn-mono'>" + esc(s.code) + "</span>" : "<span class='cn-none'>—</span>",
               s.capacity != null ? String(s.capacity) : "<span class='cn-none'>—</span>", s.assets ? String(s.assets) : "<span class='cn-none'>0</span>",
               s.open ? "<b>" + s.open + "</b>" : "<span class='cn-none'>0</span>",
               s.bookable ? H.chip("green", s.approverName ? "Needs " + s.approverName.split(" ")[0] : "Yes") : "<span class='cn-none'>No</span>"],
          function () { roomSheet(s.id, refresh); }, s.id);
      });
      if (!shown) slot.appendChild(el("p", "en-note", "No room matches that."));
      else slot.appendChild(t);
    }
    load();
  }

  /* One room, or a run of them. */
  function addRooms(parentId, done) {
    H.spaces().then(function (list) {
      var kind = H.fld("select", "What is it", "room", { options: [["building", "A building"], ["floor", "A floor"], ["room", "A room"], ["area", "An area (gym, yard, hall)"]] });
      var parent = H.fld("select", "Inside", parentId || "", { options: H.spaceOptions(list, { blank: "Nothing — it is at the top" }) });
      var mode = H.fld("select", "How many", "range", { options: [["one", "One"], ["range", "A run of numbered rooms"]] });
      var name = H.fld("text", "Name", "", { max: 120, hint: "Main building" });
      var prefix = H.fld("text", "Before the number", "Room ", { max: 40 });
      var from = H.fld("number", "From", 101, { min: 0, max: 99999 });
      var to = H.fld("number", "To", 110, { min: 0, max: 99999 });
      var seats = H.fld("number", "Seats in each", "", { min: 0, max: 5000 });
      var bookable = H.check("Can be held (booked)", false);
      var rg = el("div"), one = el("div");
      var gr = el("div", "en-form-grid");
      [prefix, from, to].forEach(function (f) { gr.appendChild(f.node); });
      rg.appendChild(gr);
      one.appendChild(name.node);
      function sync() { var r = mode.value() === "range" && kind.value() !== "building" && kind.value() !== "floor"; rg.hidden = !r; one.hidden = r; mode.node.hidden = kind.value() === "building" || kind.value() === "floor"; }
      kind.input.addEventListener("change", sync); mode.input.addEventListener("change", sync);
      H.dialog({
        title: "Add rooms", sub: "A room's number is its code; two rooms cannot share one.", wide: true, action: "Add",
        body: function (h) {
          var g = el("div", "en-form-grid");
          [kind, parent, mode].forEach(function (f) { g.appendChild(f.node); });
          h.appendChild(g); h.appendChild(one); h.appendChild(rg);
          var g2 = el("div", "en-form-grid"); g2.appendChild(seats.node); h.appendChild(g2);
          h.appendChild(bookable.node);
          sync();
        },
        onSubmit: function () {
          var data = { kind: kind.value(), parentId: parent.value() || undefined, capacity: seats.value() === "" ? undefined : +seats.value(), bookable: bookable.value() };
          if (mode.value() === "range" && kind.value() !== "building" && kind.value() !== "floor") {
            if (from.value() === "" || to.value() === "") throw new Error("Say where the run starts and ends.");
            data.range = { prefix: prefix.input.value, from: +from.value(), to: +to.value() };
          } else {
            if (!name.value()) throw new Error("Give it a name.");
            data.name = name.value();
          }
          return API.addSpaces(data).then(function (made) { H.bust(); toast(made.length === 1 ? "Added." : made.length + " rooms added."); if (done) done(); });
        }
      });
    });
  }

  /* Labels for the doors: a QR code that opens the report-a-problem page. */
  function labels(only) {
    H.spaces().then(function (list) {
      var rooms = only || list.ordered.filter(function (x) { return x.s.kind === "room" || x.s.kind === "area"; }).map(function (x) { return x.s; });
      if (!rooms.length) { toast("Add some rooms first."); return; }
      K.cxPrint("Room labels", K.printHead("Room labels", H.plural(rooms.length, "label")) + labelPage(rooms, list));
    });
  }

  /* ============================================================ One room */
  function roomSheet(id, done) {
    Promise.all([API.space(id), H.spaces(), H.team()]).then(function (r) {
      var d = r[0], s = d.space, list = r[1], who = r[2];
      var box = el("div", "en-dlg en-wide");
      var ref = null;
      function reload() { H.bust(); if (ref) ref.close(); roomSheet(id, done); if (done) done(); }
      box.appendChild(el("h2", "en-dlg-h", esc(s.name)));
      box.appendChild(el("p", "en-dlg-sub", esc(H.path(list, id)) + (s.capacity != null ? " · " + s.capacity + " seats" : "") + (s.bookable ? " · can be held" : "")));

      // what is here
      box.appendChild(el("h3", "en-h3", "What is here"));
      if (d.assets.length) {
        var t = K.cnTable([{ label: "Name", w: "minmax(160px, 1.4fr)" }, { label: "Code", w: "110px" }, { label: "Kept by", w: "minmax(100px, 1fr)" }, { label: "Status", w: "100px" }]);
        d.assets.forEach(function (a) {
          t.row(["<b>" + esc(a.name) + "</b>", "<span class='cn-mono'>" + esc(a.code) + "</span>",
                 a.custodianName || a.custodianLabel ? esc(a.custodianName || a.custodianLabel) : "<span class='cn-none'>—</span>",
                 H.chip(ASSET_STATUS[a.status][0], ASSET_STATUS[a.status][1])], function () { assetSheet(a.id, reload); }, a.id);
        });
        box.appendChild(t);
      } else box.appendChild(el("p", "en-note", "Nothing is registered in this room yet."));

      if (d.open.length) {
        box.appendChild(el("h3", "en-h3", "Open work"));
        d.open.forEach(function (o) {
          var b = el("button", "fx-linkrow", "<span>" + esc(H.number(o.number)) + "</span> " + esc(o.title) + " " + H.status(o.status));
          b.type = "button";
          b.addEventListener("click", function () { H.open.order(o.id, reload); });
          box.appendChild(b);
        });
      }
      if (d.documents.length) {
        box.appendChild(el("h3", "en-h3", "Papers"));
        d.documents.forEach(function (x) { box.appendChild(el("div", "fx-linkrow flat", esc(x.kind) + " — " + esc(x.title) + " " + H.expiry(x.state, x.expiresOn))); });
      }
      if (d.bookings.length) {
        box.appendChild(el("h3", "en-h3", "Next 30 days"));
        d.bookings.slice(0, 8).forEach(function (b) {
          box.appendChild(el("div", "fx-linkrow flat", esc(H.dayShort(b.day)) + " · " + esc(b.starts) + "–" + esc(b.ends) + " — " + esc(b.title) +
            (b.bookerName ? " (" + esc(b.bookerName) + ")" : "") + (b.status === "pending" ? " " + H.chip("orange", "Waiting") : "")));
        });
      }

      // the label
      box.appendChild(el("h3", "en-h3", "Label"));
      var lab = el("div", "fx-label-row");
      lab.innerHTML = "<div class='fx-qr'>" + OPLO_QR.svg(roomUrl(id), { px: 120, level: "M" }) + "</div><p class='en-note'>Stick this on the door. A phone that scans it opens the " +
        "report-a-problem page with <b>" + esc(s.name) + "</b> already chosen.</p>";
      box.appendChild(lab);

      // the rules
      box.appendChild(el("h3", "en-h3", "Holding this room"));
      var bookable = H.check("This room can be held (booked)", s.bookable);
      var approver = H.fld("select", "Who approves", s.approverId || "", { options: H.teamOptions(who, "Nobody — a booking is approved on the spot") });
      var rules = rulesForm(s.rules);
      box.appendChild(bookable.node); box.appendChild(approver.node); box.appendChild(rules.node);

      var acts = el("div", "en-dlg-acts en-wrap");
      acts.appendChild(H.btn("Save the rules", "strong", function () {
        API.updateSpace(id, { bookable: bookable.value(), approverId: approver.value() || null, rules: rules.value() })
          .then(function () { toast("Saved."); reload(); }, function (e) { toast(e.message); });
      }));
      if (s.parentId) {
        acts.appendChild(H.btn("Use these rules for every room on this floor", "", function () {
          var ids = (list.kids[s.parentId] || []).filter(function (x) { return x.kind === "room" || x.kind === "area"; }).map(function (x) { return x.id; });
          API.spaceRules({ ids: ids, bookable: bookable.value(), approverId: approver.value() || null, rules: rules.value() })
            .then(function (r2) { toast("Applied to " + H.plural(r2.changed, "room") + "."); reload(); }, function (e) { toast(e.message); });
        }));
      }
      acts.appendChild(H.btn("Count this room…", "", function () { countRoom(s, d.assets, reload); }));
      acts.appendChild(H.btn("Report a problem here", "", function () { H.open.newOrder({ spaceId: id }, reload); }));
      acts.appendChild(H.btn("Add an asset here", "", function () { assetForm({ spaceId: id }, reload); }));
      if (H.open.addDocument) acts.appendChild(H.btn("Add a paper…", "", function () { H.open.addDocument({ ownerKind: "space", ownerId: id }, reload); }));
      acts.appendChild(H.btn("Print label", "quiet", function () { labels([s]); }));
      acts.appendChild(H.btn("Edit name…", "quiet", function () {
        var n = H.fld("text", "Name", s.name, { max: 120 }), c = H.fld("text", "Number", s.code || "", { max: 40 });
        var sc = H.fld("number", "Seats", s.capacity == null ? "" : s.capacity, { min: 0, max: 100000 }), nt = H.fld("area", "Notes", s.notes || "", { rows: 2, max: 1000 });
        H.dialog({ title: "Edit room", action: "Save", body: function (h) { h.appendChild(n.node); h.appendChild(c.node); h.appendChild(sc.node); h.appendChild(nt.node); },
          onSubmit: function () { return API.updateSpace(id, { name: n.value(), code: c.value() || null, capacity: sc.value() === "" ? null : +sc.value(), notes: nt.value() || null }).then(function () { toast("Saved."); reload(); }); } });
      }));
      acts.appendChild(H.btn("Close", "quiet", function () { ref.close(); }));
      box.appendChild(acts);
      ref = K.cxSheet(box);
    }, function (e) { toast(e.message); });
  }

  /* Reading a room's codes against the register. */
  function countRoom(space, assets, done) {
    var ticks = assets.filter(function (a) { return a.status !== "retired" && a.status !== "lost"; }).map(function (a) {
      var c = H.check(a.name + " — " + a.code, false);
      c.code = a.code;
      return c;
    });
    var extra = H.fld("area", "Other codes you saw here", "", { rows: 2, note: "Paste scanned codes, one a line, for anything not on the list above." });
    var out = el("div");
    function codes() {
      var seen = ticks.filter(function (c) { return c.value(); }).map(function (c) { return c.code; });
      extra.value().split(/[\s,;]+/).filter(Boolean).forEach(function (c) { if (seen.indexOf(c) < 0) seen.push(c); });
      return seen;
    }
    var ctl = H.dialog({
      title: "Count " + space.name, sub: "Tick what you can see. Nothing changes until you record the count.", wide: true, action: "Record the count",
      body: function (h) {
        if (ticks.length) {
          var all = H.btn("Tick everything", "quiet", function () { ticks.forEach(function (c) { c.input.checked = true; }); });
          h.appendChild(all);
          ticks.forEach(function (c) { h.appendChild(c.node); });
        } else h.appendChild(el("p", "en-note", "Nothing is registered in this room, so there is nothing to tick."));
        h.appendChild(extra.node);
        var preview = H.btn("What would this say?", "quiet", function () {
          API.count(space.id, codes(), false).then(function (r) { show(r); }, function (e) { toast(e.message); });
        });
        h.appendChild(preview);
        h.appendChild(out);
      },
      onSubmit: function () { return API.count(space.id, codes(), true).then(function (r) { toast("Counted: " + r.found.length + " found, " + r.missing.length + " missing."); if (done) done(); }); }
    });
    function show(r) {
      out.innerHTML = "";
      function group(title, list, tone, fn) {
        if (!list.length) return;
        var g = el("div", "fx-already");
        g.innerHTML = "<b>" + esc(title) + " (" + list.length + ")</b>" + list.map(function (x) { return "<span>" + esc(fn ? fn(x) : x.name + " — " + x.code) + "</span>"; }).join("");
        out.appendChild(g);
      }
      group("Found", r.found); group("Missing", r.missing);
      group("Here, but registered somewhere else", r.elsewhere, null, function (a) { return a.name + " — " + a.code + " (registered in " + (a.spaceName || "nowhere") + ")"; });
      group("Not in the register", r.unknown, null, function (c) { return c; });
    }
  }

  /* ============================================================ Assets */
  var AS = { f: "service", q: "" };

  function assets(v) {
    var P = K.cxPage(v, "Facilities", "Assets",
      "What the school owns that needs looking after: projectors, boilers, carts of laptops. Each has a code on it, a room, and someone who has it.");
    P.tools.appendChild(K.cnAction("Add an asset", function () { assetForm({}, load); }, true));
    var filters = el("div");
    filters.style.cssText = "display:flex;flex-wrap:wrap;margin-bottom:14px";
    v.appendChild(filters);
    var tools = el("div", "cn-bar en-tools");
    var find = el("input", "cn-search");
    find.type = "search"; find.placeholder = "Search name, code, room or who has it"; find.value = AS.q;
    tools.appendChild(find);
    v.appendChild(tools);
    var slot = H.slot(v);
    var chips = K.cnFilters([{ k: "service", name: "In service" }, { k: "repair", name: "Repair" }, { k: "warranty", name: "Warranty ending" },
      { k: "gone", name: "Retired or lost" }, { k: "all", name: "All" }], AS.f, function (k) { AS.f = k; chips.mark(k); draw(); });
    filters.appendChild(chips);
    var timer = null, rows = null;
    find.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { AS.q = find.value.trim().toLowerCase(); draw(); }, 200); });
    function load() {
      slot.innerHTML = "";
      slot.appendChild(el("div", "admin-loading", "Loading assets…"));
      API.assets().then(function (r) { rows = r.assets; draw(); }, function (e) { H.fail(slot, e, load); });
    }
    function draw() {
      slot.innerHTML = "";
      var list = rows.filter(function (a) {
        if (AS.f === "service" && ["in_service", "storage"].indexOf(a.status) < 0) return false;
        if (AS.f === "repair" && a.status !== "repair") return false;
        if (AS.f === "warranty" && !(a.warranty === "soon" || a.warranty === "expired")) return false;
        if (AS.f === "gone" && ["retired", "lost"].indexOf(a.status) < 0) return false;
        return !AS.q || [a.name, a.kind, a.code, a.serial, a.spaceName, a.custodianName, a.custodianLabel].join(" ").toLowerCase().indexOf(AS.q) > -1;
      });
      if (!list.length) {
        slot.appendChild(K.cnEmpty(rows.length ? "Nothing matches." : "No assets yet.",
          rows.length ? "Change the filter or clear the search." : "Add the things that need looking after — start with the ones that break: projectors, boilers, the laptop carts.",
          rows.length ? null : "Add an asset", rows.length ? null : function () { assetForm({}, load); }));
        return;
      }
      var t = K.cnTable([{ label: "Name", w: "minmax(180px, 1.5fr)" }, { label: "Code", w: "110px" }, { label: "Room", w: "minmax(110px, 1fr)" },
        { label: "Kept by", w: "minmax(110px, 1fr)" }, { label: "Warranty", w: "130px" }, { label: "Status", w: "100px" }]);
      list.slice(0, 500).forEach(function (a) {
        t.row(["<b>" + esc(a.name) + "</b>" + (a.kind ? "<span class='cn-sub2'>" + esc(a.kind) + "</span>" : ""), "<span class='cn-mono'>" + esc(a.code) + "</span>",
               a.spaceName ? esc(a.spaceName) : "<span class='cn-none'>—</span>",
               a.custodianName || a.custodianLabel ? esc(a.custodianName || a.custodianLabel) : "<span class='cn-none'>—</span>",
               H.expiry(a.warranty, a.warrantyEnd), H.chip(ASSET_STATUS[a.status][0], ASSET_STATUS[a.status][1])],
          function () { assetSheet(a.id, load); }, a.id);
      });
      slot.appendChild(t);
    }
    load();
  }

  function assetForm(pre, done, existing) {
    Promise.all([H.spaces(), H.people()]).then(function (r) {
      var list = r[0], people = r[1];
      var a = existing || {};
      var name = H.fld("text", "Name", a.name || "", { req: true, max: 160, hint: "Projector" });
      var kind = H.fld("text", "Kind", a.kind || "", { max: 80, hint: "Projector, boiler, laptop cart…" });
      var code = H.fld("text", "Code on its label", a.code || "", { max: 64, note: existing ? "" : "Leave empty for the next number." });
      var serial = H.fld("text", "Serial number", a.serial || "", { max: 80 });
      var room = H.fld("select", "Room", a.spaceId || pre.spaceId || "", { options: H.spaceOptions(list, { blank: "Not placed", only: "rooms" }) });
      var cust = H.fld("text", "Kept by", a.custodianName || a.custodianLabel || "", { max: 120, note: "A person's name, or a room or cart written in words." });
      var dl = el("datalist");
      dl.id = "fx-people-" + Date.now();
      people.slice(0, 400).forEach(function (p) { var o = el("option"); o.value = p.name; dl.appendChild(o); });
      cust.input.setAttribute("list", dl.id);
      var status = H.fld("select", "Status", a.status || "in_service", { options: [["in_service", "In service"], ["repair", "In for repair"], ["storage", "In storage"], ["retired", "Retired"], ["lost", "Lost"]] });
      var cond = H.fld("select", "Condition", a.condition || "", { options: [["", "Not rated"], ["good", "Good"], ["fair", "Fair"], ["poor", "Poor"]] });
      var inst = H.fld("date", "Installed", a.installedOn || ""), warr = H.fld("date", "Warranty ends", a.warrantyEnd || "");
      var life = H.fld("number", "Expected life, years", a.lifeYears == null ? "" : a.lifeYears, { min: 0, max: 200 });
      var notes = H.fld("area", "Notes", a.notes || "", { rows: 2, max: 1000 });
      H.dialog({
        title: existing ? "Edit asset" : "Add an asset", sub: "A date here is a fact about the thing. What it cost is not kept: OEdu does not do finance.", wide: true, action: "Save",
        body: function (h) {
          h.appendChild(name.node);
          var g = el("div", "en-form-grid");
          [kind, code, serial, room, cust, status, cond, inst, warr, life].forEach(function (f) { g.appendChild(f.node); });
          h.appendChild(g); h.appendChild(dl); h.appendChild(notes.node);
        },
        onSubmit: function () {
          if (!name.value()) throw new Error("Give it a name.");
          var who = cust.value(), person = people.filter(function (p) { return p.name === who; })[0];
          var data = { name: name.value(), kind: kind.value() || null, serial: serial.value() || null, spaceId: room.value() || null,
            custodianId: person ? person.id : null, custodianLabel: !person && who ? who : null, status: status.value(),
            condition: cond.value() || null, installedOn: inst.value() || null, warrantyEnd: warr.value() || null,
            lifeYears: life.value() === "" ? null : +life.value(), notes: notes.value() || null };
          if (existing) { data.code = code.value() || existing.code; return API.updateAsset(existing.id, data).then(function () { toast("Saved."); if (done) done(); }); }
          if (code.value()) data.code = code.value();
          return API.addAsset(data).then(function () { toast("Added."); if (done) done(); });
        }
      });
    }, function (e) { toast(e.message); });
  }

  function assetSheet(id, done) {
    API.asset(id).then(function (d) {
      var a = d.asset;
      var box = el("div", "en-dlg en-wide");
      var ref = null;
      function reload() { if (ref) ref.close(); assetSheet(id, done); if (done) done(); }
      box.appendChild(el("h2", "en-dlg-h", esc(a.name)));
      var st = ASSET_STATUS[a.status];
      box.appendChild(el("p", "en-dlg-sub", H.chip(st[0], st[1]) + " &nbsp; <span class='cn-mono'>" + esc(a.code) + "</span>" + (a.kind ? " · " + esc(a.kind) : "")));
      H.line(box, "Room", a.spaceName); H.line(box, "Kept by", a.custodianName || a.custodianLabel); H.line(box, "Serial", a.serial);
      H.line(box, "Condition", a.condition); H.line(box, "Installed", a.installedOn ? H.day(a.installedOn) : "");
      if (a.warrantyEnd) box.appendChild(el("p", "en-line", "<b>Warranty</b> " + H.expiry(a.warranty, a.warrantyEnd)));
      H.line(box, "Expected life", a.lifeYears != null ? a.lifeYears + " years" : "");
      H.line(box, "Last counted", a.lastSeenOn ? H.day(a.lastSeenOn) : ""); H.line(box, "Notes", a.notes);
      if (d.orders && d.orders.length) {
        box.appendChild(el("h3", "en-h3", "Work on it"));
        d.orders.slice(0, 8).forEach(function (o) {
          var b = el("button", "fx-linkrow", "<span>" + esc(H.number(o.number)) + "</span> " + esc(o.title) + " " + H.status(o.status));
          b.type = "button";
          b.addEventListener("click", function () { H.open.order(o.id, reload); });
          box.appendChild(b);
        });
      }
      if (d.documents && d.documents.length) {
        box.appendChild(el("h3", "en-h3", "Papers"));
        d.documents.forEach(function (x) { box.appendChild(el("div", "fx-linkrow flat", esc(x.kind) + " — " + esc(x.title) + " " + H.expiry(x.state, x.expiresOn))); });
      }
      H.history(box, d.events.map(function (e) { return e; }));
      var acts = el("div", "en-dlg-acts en-wrap");
      acts.appendChild(H.btn("Report a problem", "strong", function () { H.open.newOrder({ assetId: a.id, spaceId: a.spaceId, title: a.name + ": " }, reload); }));
      acts.appendChild(H.btn("Edit…", "", function () { ref.close(); assetForm({}, function () { assetSheet(id, done); if (done) done(); }, a); }));
      if (H.open.addDocument) acts.appendChild(H.btn("Add a paper…", "", function () { H.open.addDocument({ ownerKind: "asset", ownerId: id }, reload); }));
      acts.appendChild(H.btn("Close", "quiet", function () { ref.close(); }));
      box.appendChild(acts);
      ref = K.cxSheet(box);
    }, function (e) { toast(e.message); });
  }

  H.open.room = roomSheet;
  H.open.asset = assetSheet;
  H.open.addRooms = addRooms;
  H.labels = labels;

  return { spaces: spaces, assets: assets };
});
