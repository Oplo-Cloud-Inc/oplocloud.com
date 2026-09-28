/* ==========================================================================
   OC EFM — interface kit.

   Every screen is built from these pieces, so a table in Payables and a
   table in the ledger behave the same, a refusal always explains itself,
   and a number anywhere can be clicked through to where it came from.

   Nothing here parses HTML from strings: names and memos arrive as data and
   go in with textContent.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM;

  /* ------------------------------------------------------------- DOM */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "on") for (var ev in v) el.addEventListener(ev, v[ev]);
      else if (k === "style" && typeof v === "object") for (var s in v) {
        // camelCase keys go through the style object; custom properties and
        // kebab-case through setProperty (which ignores camelCase silently).
        if (s.indexOf("-") >= 0) el.style.setProperty(s, v[s]); else el.style[s] = v[s];
      }
      else if (k === "data") for (var d in v) el.dataset[d] = v[d];
      else if (k === "html") el.innerHTML = v;        // only ever for trusted, static markup (icons)
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { add(el, k); }); return; }
    el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function svg(tag, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (attrs) for (var k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) el.appendChild(arguments[i]);
    return el;
  }

  /* ------------------------------------------------------------ Icons
     16px line icons on a 16-unit grid, 1.6 stroke, drawn for this product. */
  var ICONS = {
    home: "M2.5 7.2 8 2.8l5.5 4.4V13a.5.5 0 0 1-.5.5H9.5V10h-3v3.5H3a.5.5 0 0 1-.5-.5z",
    inbox: "M2.5 9.5 4 3.5h8l1.5 6M2.5 9.5V13h11V9.5M2.5 9.5h3.2l.8 1.5h3l.8-1.5h3.2",
    book: "M3 2.5h7.5a1.5 1.5 0 0 1 1.5 1.5v9.5H4.5A1.5 1.5 0 0 1 3 12zM3 12a1.5 1.5 0 0 1 1.5-1.5H12M6 5.5h3.5",
    journal: "M4 2.5h8a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5zM6 5.5h4M6 8h4M6 10.5h2.5",
    report: "M3 13.5h10M4.5 11V8M8 11V4.5M11.5 11V6.5",
    payables: "M3.5 12.5 12.5 3.5M6 3.5h6.5V10",
    receivables: "M12.5 3.5 3.5 12.5M10 12.5H3.5V6",
    bank: "M2.5 6 8 3l5.5 3M3.5 6.5v5M6.5 6.5v5M9.5 6.5v5M12.5 6.5v5M2.5 13h11",
    box: "M8 2.5 13 5v6l-5 2.5L3 11V5zM3 5l5 2.5L13 5M8 7.5v6",
    target: "M8 13.5A5.5 5.5 0 1 0 8 2.5a5.5 5.5 0 0 0 0 11zM8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM8 8h.01",
    trend: "M2.5 11.5 6 8l2.5 2.5 5-5M10 5.5h3.5V9",
    close: "M8 13.5A5.5 5.5 0 1 0 8 2.5a5.5 5.5 0 0 0 0 11zM5.5 8.2l1.7 1.7 3.3-3.4",
    layers: "M8 2.5 13.5 5.5 8 8.5 2.5 5.5zM2.5 8.5 8 11.5l5.5-3M2.5 11 8 14l5.5-3",
    shield: "M8 2.2 13 4v4c0 3-2.2 5-5 5.8C5.2 13 3 11 3 8V4zM6 7.8l1.4 1.4L10.2 6.4",
    search: "M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM10.6 10.6 13.5 13.5",
    bell: "M4 11V7a4 4 0 0 1 8 0v4l1 1.5H3zM6.5 13.5a1.5 1.5 0 0 0 3 0",
    chev: "M6 3.5 10.5 8 6 12.5",
    chevd: "M3.5 6 8 10.5 12.5 6",
    updown: "M5 6l3-3 3 3M5 10l3 3 3-3",
    plus: "M8 3v10M3 8h10",
    x: "M4 4l8 8M12 4l-8 8",
    check: "M3.5 8.5 6.5 11.5 12.5 4.5",
    alert: "M8 2.5 14 13H2zM8 6.5v3M8 11.2h.01",
    info: "M8 13.5A5.5 5.5 0 1 0 8 2.5a5.5 5.5 0 0 0 0 11zM8 7.5v3.5M8 5.2h.01",
    lock: "M4.5 7.5h7v6h-7zM6 7.5V5.5a2 2 0 0 1 4 0v2",
    unlock: "M4.5 7.5h7v6h-7zM6 7.5V5.5a2 2 0 0 1 3.9-.6",
    arrow: "M3 8h10M9 4l4 4-4 4",
    back: "M13 8H3M7 4 3 8l4 4",
    undo: "M4.5 6.5h5.5a3 3 0 0 1 0 6H6M6.5 4 4 6.5 6.5 9",
    link: "M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M9 11.5l-1 1a2.5 2.5 0 0 1-3.5-3.5l1-1",
    doc: "M4 2.5h5.5L12.5 5.5V13a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5zM9.5 2.5v3h3",
    clip: "M11.5 7.5 7.2 11.8a2.5 2.5 0 0 1-3.5-3.5L8.4 3.6a1.7 1.7 0 0 1 2.4 2.4L6.3 10.4a.8.8 0 0 1-1.2-1.2L9 5.3",
    user: "M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 13.5c.6-2.4 2.6-3.5 5-3.5s4.4 1.1 5 3.5",
    users: "M6 7.5a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4zM2 13c.4-2.2 2-3.3 4-3.3s3.6 1.1 4 3.3M10.5 3.3a2.2 2.2 0 0 1 0 4.2M11.5 9.8c1.3.4 2.2 1.4 2.5 3.2",
    globe: "M8 13.5A5.5 5.5 0 1 0 8 2.5a5.5 5.5 0 0 0 0 11zM2.5 8h11M8 2.5c1.6 1.5 2.3 3.3 2.3 5.5S9.6 12 8 13.5C6.4 12 5.7 10.2 5.7 8S6.4 4 8 2.5z",
    swap: "M3 5.5h9.5L10 3M13 10.5H3.5L6 13",
    calendar: "M3 4h10v9.5H3zM3 7h10M5.5 2.5v3M10.5 2.5v3",
    play: "M5 3.5v9l7-4.5z",
    spark: "M8 2.5v3M8 10.5v3M2.5 8h3M10.5 8h3M4.1 4.1l2 2M9.9 9.9l2 2M11.9 4.1l-2 2M6.1 9.9l-2 2",
    filter: "M2.5 3.5h11L9.5 8.5v4l-3 1.5V8.5z",
    download: "M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10",
    eye: "M1.8 8S4 3.8 8 3.8 14.2 8 14.2 8 12 12.2 8 12.2 1.8 8 1.8 8zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    card: "M2.5 4h11v8h-11zM2.5 6.5h11M4.5 10h2.5",
    phone: "M5 2.5h2l1 3-1.5 1a7 7 0 0 0 3 3l1-1.5 3 1v2a1.5 1.5 0 0 1-1.6 1.5C7.2 12.3 3.7 8.8 3.5 4.1A1.5 1.5 0 0 1 5 2.5z",
    mail: "M2.5 4h11v8h-11zM2.5 4.5 8 8.5l5.5-4",
    dot: "M8 9.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z",
    more: "M3.5 8h.01M8 8h.01M12.5 8h.01",
    settings: "M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 1.8v1.7M8 12.5v1.7M1.8 8h1.7M12.5 8h1.7M3.6 3.6l1.2 1.2M11.2 11.2l1.2 1.2M3.6 12.4l1.2-1.2M11.2 4.8l1.2-1.2",
    sparkle: "M8 2.5c.4 2.6 1.9 4.1 4.5 4.5-2.6.4-4.1 1.9-4.5 4.5-.4-2.6-1.9-4.1-4.5-4.5 2.6-.4 4.1-1.9 4.5-4.5zM12.5 11v2.5M11.2 12.2h2.6",
    hash: "M5.5 2.5 4.5 13.5M11.5 2.5l-1 11M2.5 6h11M2 10h11",
    refresh: "M13 3.5v3h-3M3 12.5v-3h3M12.4 6.5A5 5 0 0 0 3.8 5M3.6 9.5a5 5 0 0 0 8.6 1.5"
  };
  function icon(name, cls) {
    var d = ICONS[name] || ICONS.dot;
    var s = svg("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", "stroke-width": "1.6",
      "stroke-linecap": "round", "stroke-linejoin": "round", class: "ico" + (cls ? " " + cls : ""), "aria-hidden": "true" });
    s.appendChild(svg("path", { d: d }));
    return s;
  }
  function logo() {
    var s = svg("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", "stroke-width": "1.7", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" });
    // A ledger's two columns meeting in balance.
    s.appendChild(svg("path", { d: "M3 4.5h10M3 8h4M9 8h4M3 11.5h10M8 3v10" }));
    return s;
  }

  /* ---------------------------------------------------------- Formats */
  function E() { return EFM.app && EFM.app.E; }
  function money(minor, cur, o) { return E().fmt(minor, cur || "USD", o); }
  function amt(minor, cur, o) {
    o = o || {};
    var s = h("span", { class: "num" + (minor < 0 && !o.plain ? " neg" : "") + (o.cls ? " " + o.cls : "") }, money(minor, cur, o));
    if (o.title) s.title = o.title;
    return s;
  }
  function pct(x, dp) {
    if (x == null || !isFinite(x)) return "—";
    return (x * 100).toFixed(dp == null ? 0 : dp) + "%";
  }
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function date(d, style) {
    if (!d) return "—";
    var y = d.slice(0, 4), m = +d.slice(5, 7) - 1, day = +d.slice(8, 10);
    if (style === "long") return DAYS[new Date(d.slice(0, 10) + "T12:00:00Z").getUTCDay()] + ", " + MONL[m] + " " + day;
    if (style === "full") return MONL[m] + " " + day + ", " + y;
    if (style === "year" || y !== EFM.app.E.fy) return MON[m] + " " + day + ", " + y;
    return MON[m] + " " + day;
  }
  function time(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return date(iso.slice(0, 10)) + " · " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  function period(p, long) { return E().periodLabel(p, long); }

  /* People: colleagues, and the signed-in person. */
  var HUES = { dana: "#5e5ce6", marcus: "#0a84ff", priya: "#bf5af2", tomas: "#30b0c7", hannah: "#ff9f0a", leo: "#34c759",
               oliver: "#ff6482", aiko: "#ac8e68", grace: "#64d2ff", system: "#8e8e93" };
  function person(id) {
    var app = EFM.app, p = id === "me" ? app.me : app.E.people[id];
    if (!p) return { id: id, name: id || "—", initials: "?", color: "#8e8e93" };
    var init = p.initials || p.name.split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
    var color = id === "me" ? (app.me.color || "#1d1d1f") : HUES[id] || "#8e8e93";
    return { id: id, name: id === "me" ? app.me.name + " (you)" : p.name, short: id === "me" ? "You" : p.name.split(" ")[0], title: p.title || (EFM.app.E.roles[p.role] || {}).name, initials: id === "system" ? "OC" : init, color: color };
  }
  function avatar(id, sm) {
    var p = person(id);
    return h("span", { class: "avatar" + (sm ? " sm" : ""), style: { background: p.color }, title: p.name, "aria-hidden": "true" }, p.initials);
  }
  function who(id) {
    var p = person(id);
    return h("span", { class: "row", style: { gap: "7px", whiteSpace: "nowrap" } }, avatar(id, true), h("span", null, p.name));
  }

  /* ------------------------------------------------------ Small parts */
  var STATUS_TONE = {
    paid: "good", posted: "good", matched: "good", done: "good", reconciled: "good", approved: "accent", scheduled: "accent", active: "good",
    open: "plain", current: "plain", review: "warn", captured: "warn", pending: "warn", "in-progress": "accent", partial: "warn",
    hold: "serious", overdue: "serious", draft: "plain", rejected: "bad", discarded: "plain", unmatched: "warn", locked: "plain", closed: "plain",
    soft: "warn", blocked: "serious", todo: "plain", critical: "bad", serious: "serious", attention: "warn", info: "plain", resolved: "good",
    dismissed: "plain", escalated: "serious", declined: "bad", "partially received": "warn", disposed: "plain", "fully depreciated": "plain"
  };
  var STATUS_LABEL = { review: "Awaiting approval", captured: "Captured", "in-progress": "In progress", todo: "To do", hold: "On hold", soft: "Soft close", partial: "Partly paid" };
  function status(s, label) {
    var tone = STATUS_TONE[s] || "plain";
    var text = label || STATUS_LABEL[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
    return h("span", { class: "st " + tone }, h("i"), text);
  }
  function tag(text, tone) { return h("span", { class: "tag" + (tone ? " " + tone : "") }, text); }
  function sev(level) {
    var ic = { critical: "alert", serious: "alert", attention: "info", info: "dot" }[level] || "dot";
    var label = { critical: "Critical", serious: "Serious", attention: "Needs attention", info: "For information" }[level] || level;
    return h("span", { class: "sev " + level, title: label, role: "img", "aria-label": label }, icon(ic));
  }

  function btn(label, o) {
    o = o || {};
    var b = h("button", { type: "button", class: "btn" + (o.kind ? " " + o.kind : "") + (o.size ? " " + o.size : ""), title: o.title || null },
      o.icon ? icon(o.icon) : null, label ? h("span", null, label) : null);
    if (o.disabled) { b.disabled = true; }
    if (o.onClick) b.addEventListener("click", function (ev) { if (!b.disabled) o.onClick(ev, b); });
    if (o.label) b.setAttribute("aria-label", o.label);
    return b;
  }
  /* A button for an action the engine may refuse. If the current role
     cannot do it, the button stays visible, disabled, and says why — people
     learn the controls by meeting them, not by guessing. */
  function gated(action, ctx, label, onClick, o) {
    o = o || {};
    var r = EFM.app.E.can(action, EFM.app.actor(), ctx || {});
    var b = btn(label, { kind: o.kind, icon: o.icon, size: o.size, disabled: !r.ok, onClick: onClick });
    if (!r.ok) {
      b.title = r.reason + (r.rule ? "\n" + r.rule : "");
      b.setAttribute("aria-disabled", "true");
      if (o.explain !== false) {
        var wrap = h("span", { class: "stack", style: { gap: "0", display: "inline-flex" } }, b);
        if (o.explain === "inline") wrap.appendChild(h("span", { class: "gate-why" }, icon("lock"), h("span", null, r.reason)));
        return wrap;
      }
    }
    return b;
  }
  function seg(options, value, onChange, o) {
    var el = h("div", { class: "seg", role: "group", "aria-label": (o && o.label) || null });
    options.forEach(function (opt) {
      var id = opt.id != null ? opt.id : opt, lbl = opt.label != null ? opt.label : opt;
      el.appendChild(h("button", { type: "button", "aria-pressed": String(id === value), on: { click: function () { onChange(id); } } }, lbl));
    });
    return el;
  }
  function select(options, value, onChange, o) {
    o = o || {};
    var s = h("select", { class: "input", "aria-label": o.label || null, style: o.width ? { width: o.width } : null });
    options.forEach(function (opt) {
      var id = opt.id != null ? opt.id : opt, lbl = opt.label != null ? opt.label : opt;
      var op = h("option", { value: id }, lbl);
      if (String(id) === String(value)) op.selected = true;
      s.appendChild(op);
    });
    s.addEventListener("change", function () { onChange(s.value); });
    return s;
  }
  function chipFilter(label, count, pressed, onClick) {
    return h("button", { type: "button", class: "chipf", "aria-pressed": String(!!pressed), on: { click: onClick } }, label, count != null ? h("span", { class: "c" }, String(count)) : null);
  }

  function card(o) {
    var el = h("section", { class: "card" + (o.cls ? " " + o.cls : "") });
    if (o.title || o.tools) {
      var hd = h("div", { class: "card-h" }, h("h2", null, o.title), o.meta ? h("span", { class: "meta" }, o.meta) : null);
      if (o.tools) hd.appendChild(h("div", { class: "tools" }, o.tools));
      el.appendChild(hd);
    }
    var b = h("div", { class: "card-b" + (o.flush ? " flush" : "") }, o.body);
    el.appendChild(b);
    if (o.foot) el.appendChild(h("div", { class: "card-f" }, o.foot));
    if (o.span) el.classList.add("c" + o.span);
    return el;
  }
  function kpis(tiles) {
    var el = h("div", { class: "kpis" });
    tiles.forEach(function (t) {
      var tile = h(t.onClick ? "button" : "div", { class: "kpi", type: t.onClick ? "button" : null, on: t.onClick ? { click: t.onClick } : null },
        h("div", { class: "l", title: t.label }, t.icon ? icon(t.icon, "sm") : null, h("span", null, t.label)),
        h("div", { class: "v" }, t.value),
        h("div", { class: "d" }, t.delta || null, t.sub ? h("span", null, t.sub) : null),
        t.spark ? h("div", { class: "spark" }, t.spark) : null);
      el.appendChild(tile);
    });
    return el;
  }
  function delta(v, o) {
    o = o || {};
    if (v == null || !isFinite(v)) return null;
    var good = o.invert ? v < 0 : v > 0;
    var cls = Math.abs(v) < 0.0005 ? "flat" : good ? "up" : "down";
    var txt = o.text || ((v > 0 ? "+" : v < 0 ? "−" : "") + (Math.abs(v) * 100).toFixed(o.dp == null ? 1 : o.dp) + "%");
    return h("span", { class: "delta " + cls }, txt);
  }
  function meter(frac, o) {
    o = o || {};
    var tone = o.tone || (frac > 1.1 ? "bad" : frac > 1 ? "warn" : "");
    var m = h("div", { class: "meter" + (tone ? " " + tone : ""), role: "meter", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(Math.round(frac * 100)) },
      h("i", { style: { width: Math.max(0, Math.min(1, frac / (o.max || 1))) * 100 + "%" } }));
    if (o.mark != null) m.appendChild(h("span", { class: "mark", style: { left: "calc(" + Math.min(1, o.mark / (o.max || 1)) * 100 + "% - 1px)" } }));
    return m;
  }
  function empty(title, text, ic) {
    return h("div", { class: "empty" }, icon(ic || "check"), h("b", null, title), text ? h("div", null, text) : null);
  }

  /* ----------------------------------------------------------- Tables
     columns: [{ key, label, num, render(row) → node|string, sort(row) → value,
                 width, cls }]
     rows, onRow(row), empty, dense, foot: [cells] */
  function table(o) {
    var sortKey = o.sortKey || null, dir = o.sortDir || -1;
    var wrap = h("div", { class: "tbl-wrap" });
    function draw() {
      clear(wrap);
      var rows = o.rows.slice();
      if (sortKey) {
        var col = o.columns.filter(function (c) { return c.key === sortKey; })[0];
        if (col && col.sort) rows.sort(function (a, b) {
          var x = col.sort(a), y = col.sort(b);
          return (x < y ? -1 : x > y ? 1 : 0) * dir;
        });
      }
      var t = h("table", { class: "tbl" + (o.dense ? " dense" : "") });
      var hr = h("tr");
      o.columns.forEach(function (c) {
        var th = h("th", { class: (c.num ? "num " : "") + (c.cls || ""), scope: "col", style: c.width ? { width: c.width } : null });
        if (c.sort && o.sortable !== false) {
          var arrow = sortKey === c.key ? (dir < 0 ? " ↓" : " ↑") : "";
          th.appendChild(h("button", { type: "button", on: { click: function () { if (sortKey === c.key) dir = -dir; else { sortKey = c.key; dir = c.num ? -1 : 1; } draw(); } } }, c.label + arrow));
          if (sortKey === c.key) th.setAttribute("aria-sort", dir < 0 ? "descending" : "ascending");
        } else if (c.label instanceof Node) th.appendChild(c.label);
        else th.appendChild(document.createTextNode(c.label || ""));
        hr.appendChild(th);
      });
      t.appendChild(h("thead", null, hr));
      var tb = h("tbody");
      if (!rows.length) {
        tb.appendChild(h("tr", null, h("td", { colspan: String(o.columns.length) }, o.empty || empty("Nothing here", null, "check"))));
      }
      var limit = o.limit || 400;
      rows.slice(0, limit).forEach(function (r) {
        var tr = h("tr", { class: (o.onRow ? "link" : "") + (o.rowClass ? " " + (o.rowClass(r) || "") : "") });
        if (o.onRow) {
          tr.tabIndex = 0;
          tr.addEventListener("click", function (ev) { if (ev.target.closest("button, a, input, select")) return; o.onRow(r, ev); });
          tr.addEventListener("keydown", function (ev) {
            if (ev.key === "Enter") o.onRow(r, ev);
            else if (ev.key === "ArrowDown" && tr.nextSibling) { ev.preventDefault(); tr.nextSibling.focus(); }
            else if (ev.key === "ArrowUp" && tr.previousSibling) { ev.preventDefault(); tr.previousSibling.focus(); }
          });
        }
        o.columns.forEach(function (c) {
          var v = c.render ? c.render(r) : r[c.key];
          tr.appendChild(h("td", { class: (c.num ? "num " : "") + (c.cls || "") }, v));
        });
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      if (rows.length > limit) {
        t.appendChild(h("tfoot", null, h("tr", null, h("td", { colspan: String(o.columns.length), class: "muted", style: { fontWeight: "400" } },
          "Showing " + limit + " of " + rows.length + ". Narrow the filters to see the rest."))));
      } else if (o.foot) {
        var fr = h("tr");
        o.foot.forEach(function (cell, i) { fr.appendChild(h("td", { class: o.columns[i] && o.columns[i].num ? "num" : "" }, cell)); });
        t.appendChild(h("tfoot", null, fr));
      }
      wrap.appendChild(t);
    }
    draw();
    wrap.redraw = draw;
    return wrap;
  }

  /* Journal lines as debits and credits, with the balance check shown. */
  function jeTable(lines, cur, o) {
    o = o || {};
    var eng = E(), dr = 0, cr = 0;
    var t = h("table", { class: "je" },
      h("thead", null, h("tr", null, h("th", null, "Account"), h("th", null, "Memo"), h("th", { class: "num" }, "Debit"), h("th", { class: "num" }, "Credit"))));
    var tb = h("tbody");
    lines.forEach(function (l) {
      var a = eng.accounts[l.account] || { name: "?" };
      var d = l.dr != null ? l.dr : (l.amt > 0 ? l.amt : 0), c = l.cr != null ? l.cr : (l.amt < 0 ? -l.amt : 0);
      dr += d || 0; cr += c || 0;
      var dims = h("div", { class: "dims" });
      var dd = l.dims || {};
      ["dept", "product", "project"].forEach(function (k) { if (dd[k]) dims.appendChild(tag(eng.dimName(k, dd[k]))); });
      if (dd.vendor && eng.vendors[dd.vendor]) dims.appendChild(tag(eng.vendors[dd.vendor].name));
      if (dd.customer && eng.customers[dd.customer]) dims.appendChild(tag(eng.customers[dd.customer].name));
      if (dd.counterparty) dims.appendChild(tag("↔ " + dd.counterparty));
      var acctCell = h("td", { class: c ? "cr-in" : "" }, h("div", { class: "acct" }, l.account + " " + a.name), dims.childNodes.length ? dims : null);
      if (o.onAccount) { acctCell.style.cursor = "pointer"; acctCell.addEventListener("click", function () { o.onAccount(l.account); }); }
      tb.appendChild(h("tr", null, acctCell, h("td", { class: "muted" }, l.memo || ""),
        h("td", { class: "num" }, d ? money(d, cur, { sym: false }) : ""), h("td", { class: "num" }, c ? money(c, cur, { sym: false }) : "")));
    });
    t.appendChild(tb);
    var ok = dr === cr && dr > 0;
    t.appendChild(h("tfoot", null, h("tr", null,
      h("td", null, h("span", { class: "balanced" + (ok ? "" : " no") }, icon(ok ? "check" : "alert", "sm"), ok ? "Balanced" : "Out of balance by " + money(Math.abs(dr - cr), cur))),
      h("td", { class: "muted", style: { fontWeight: "400" } }, cur),
      h("td", { class: "num" }, money(dr, cur, { sym: false })), h("td", { class: "num" }, money(cr, cur, { sym: false })))));
    return t;
  }

  function timeline(events, o) {
    o = o || {};
    var chain = o.chain ? EFM.app.E.chain() : null;
    var el = h("div", { class: "tl" });
    if (!events.length) el.appendChild(h("p", { class: "muted" }, "No recorded events."));
    events.forEach(function (ev) {
      var hash = chain ? chain[ev.seq - 1] : null;
      el.appendChild(h("div", { class: "tl-i" }, avatar(ev.actor, true),
        h("div", null, h("div", { class: "t" }, ev.summary),
          h("div", { class: "m" }, person(ev.actor).name + " · " + time(ev.at) + (ev.reason ? " · “" + ev.reason + "”" : "")),
          hash ? h("div", { class: "h", title: "SHA-256 of this event and the one before it" }, "#" + ev.seq + " · " + hash.hash.slice(0, 16) + "…") : null)));
    });
    return el;
  }

  /* ------------------------------------------------------------ Toasts */
  var toastBox = null;
  function toast(msg, o) {
    o = o || {};
    if (!toastBox) { toastBox = h("div", { class: "toasts", role: "status", "aria-live": "polite" }); document.body.appendChild(toastBox); }
    var t = h("div", { class: "toast" + (o.err ? " err" : "") }, icon(o.err ? "alert" : "check"),
      h("div", { class: "grow" }, h("div", null, msg), o.sub ? h("small", null, o.sub) : null),
      o.action ? h("button", { type: "button", on: { click: function () { o.action.fn(); dismiss(); } } }, o.action.label) : null);
    toastBox.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("on"); });
    var timer = setTimeout(dismiss, o.err ? 7000 : 5200);
    function dismiss() { clearTimeout(timer); t.classList.remove("on"); setTimeout(function () { t.remove(); }, 300); }
    return dismiss;
  }
  /* Runs an engine command, and turns a refusal into a toast that says why. */
  function attempt(fn, okMsg) {
    try {
      var r = fn();
      if (okMsg) toast(typeof okMsg === "function" ? okMsg(r) : okMsg);
      return r;
    } catch (e) {
      if (e instanceof EFM.Refusal) { toast(e.message, { err: true, sub: e.rule || null }); return null; }
      console.error(e);
      toast("Something went wrong: " + (e.message || e), { err: true });
      return null;
    }
  }

  /* ------------------------------------------------------------ Modals */
  function modal(o) {
    var last = document.activeElement;
    var scrim = h("div", { class: "modal-scrim" });
    var box = h("div", { class: "modal" + (o.wide ? " wide" : "") + (o.cls ? " " + o.cls : ""), role: "dialog", "aria-modal": "true", "aria-label": o.title || "Dialog" });
    if (o.title) box.appendChild(h("div", { class: "modal-h" }, h("h2", null, o.title), o.text ? h("p", null, o.text) : null));
    if (o.body) box.appendChild(h("div", { class: "modal-b" }, o.body));
    if (o.actions) {
      var f = h("div", { class: "modal-f" }, o.foot || null, h("span", { class: "sp" }));
      o.actions.forEach(function (a) {
        f.appendChild(btn(a.label, { kind: a.kind, disabled: a.disabled, onClick: function () { var keep = a.fn && a.fn(close); if (keep !== true) close(); } }));
      });
      box.appendChild(f);
    }
    scrim.appendChild(box);
    scrim.addEventListener("mousedown", function (ev) { if (ev.target === scrim) close(); });
    function key(ev) {
      if (ev.key === "Escape") { ev.stopPropagation(); close(); }
      if (ev.key === "Tab") {
        var f = box.querySelectorAll("button:not([disabled]), input, select, textarea, [tabindex='0']");
        if (!f.length) return;
        if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
        else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
      }
    }
    document.addEventListener("keydown", key, true);
    document.body.appendChild(scrim);
    requestAnimationFrame(function () { scrim.classList.add("on"); var f = box.querySelector("[autofocus], input, textarea, select, .btn.primary, button"); if (f) f.focus(); });
    var closed = false;
    function close() {
      if (closed) return; closed = true;
      document.removeEventListener("keydown", key, true);
      scrim.classList.remove("on");
      setTimeout(function () { scrim.remove(); }, 200);
      if (o.onClose) o.onClose();
      if (last && last.focus) try { last.focus(); } catch (e) { /* gone */ }
    }
    return { close: close, box: box };
  }
  function confirm(o) {
    return new Promise(function (resolve) {
      var done = false;
      modal({ title: o.title, text: o.text, body: o.body, wide: o.wide,
        actions: [{ label: o.cancelLabel || "Cancel", fn: function () { done = true; resolve(false); } },
                  { label: o.confirmLabel || "Confirm", kind: o.danger ? "danger solid" : "primary", fn: function () { done = true; resolve(true); } }],
        onClose: function () { if (!done) resolve(false); } });
    });
  }
  function ask(o) {
    return new Promise(function (resolve) {
      var done = false;
      var inp = o.multiline ? h("textarea", { class: "input", rows: "3", placeholder: o.placeholder || "" }) : h("input", { class: "input", placeholder: o.placeholder || "", value: o.value || "" });
      var err = h("div", { class: "gate-why", style: { color: "var(--bad)" } });
      modal({ title: o.title, text: o.text, wide: o.wide,
        body: h("div", { class: "stack", style: { gap: "10px" } }, o.body || null, h("label", { class: "field" }, h("span", null, o.label || "Reason"), inp), err),
        actions: [{ label: "Cancel", fn: function () { done = true; resolve(null); } },
                  { label: o.confirmLabel || "Save", kind: o.danger ? "danger solid" : "primary", fn: function () {
                    var v = inp.value.trim();
                    if (o.required !== false && !v) { err.textContent = "Required — this stays on the record."; inp.focus(); return true; }
                    done = true; resolve(v);
                  } }],
        onClose: function () { if (!done) resolve(null); } });
    });
  }

  /* ------------------------------------------------------------- Menus */
  function menu(anchor, items, o) {
    o = o || {};
    var m = h("div", { class: "menu", role: "menu" });
    items.forEach(function (it) {
      if (it === "-") { m.appendChild(h("div", { class: "menu-sep" })); return; }
      if (it.label && !it.fn && it.heading) { m.appendChild(h("div", { class: "menu-l" }, it.label)); return; }
      m.appendChild(h("button", { type: "button", class: "menu-i", role: "menuitem", on: { click: function () { close(); it.fn(); } } },
        it.icon ? icon(it.icon) : it.avatar ? it.avatar : null,
        h("span", { class: "grow" }, h("span", null, it.label), it.sub ? h("small", null, it.sub) : null),
        it.checked ? icon("check", "ck") : null));
    });
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect();
    var w = Math.max(o.width || 240, m.offsetWidth);
    m.style.width = w + "px";
    var left = o.alignLeft ? r.left : r.right - w;
    m.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, left)) + "px";
    m.style.top = (r.bottom + 6) + "px";
    requestAnimationFrame(function () { m.classList.add("on"); var f = m.querySelector(".menu-i"); if (f) f.focus(); });
    function outside(ev) { if (!m.contains(ev.target) && !anchor.contains(ev.target)) close(); }
    function key(ev) {
      if (ev.key === "Escape") { close(); anchor.focus(); }
      var its = Array.prototype.slice.call(m.querySelectorAll(".menu-i")), i = its.indexOf(document.activeElement);
      if (ev.key === "ArrowDown") { ev.preventDefault(); (its[i + 1] || its[0]).focus(); }
      if (ev.key === "ArrowUp") { ev.preventDefault(); (its[i - 1] || its[its.length - 1]).focus(); }
    }
    setTimeout(function () { document.addEventListener("mousedown", outside); }, 0);
    document.addEventListener("keydown", key);
    function close() { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", key); m.remove(); }
    return close;
  }

  /* ============================================================ Charts
     Built to the data-viz method: 2px lines, bars ≤ 24px with 4px rounded
     data ends on a single baseline, hairline grid, a hover layer by default,
     values in text tokens, preliminary periods hatched rather than solid. */

  function niceTicks(lo, hi, n) {
    if (lo === hi) { hi = lo + 1; }
    var span = hi - lo, step = Math.pow(10, Math.floor(Math.log10(span / n)));
    var err = n / span * step;
    if (err <= 0.15) step *= 10; else if (err <= 0.35) step *= 5; else if (err <= 0.75) step *= 2;
    var t0 = Math.floor(lo / step) * step, t1 = Math.ceil(hi / step) * step, out = [];
    for (var v = t0; v <= t1 + step / 2; v += step) out.push(Math.round(v * 1e6) / 1e6);
    return out;
  }
  /* Draws on mount and whenever the width changes. */
  function responsive(draw, height) {
    var box = h("div", { class: "chart", style: { height: height + "px" } });
    var lastW = 0;
    function go() {
      var w = Math.floor(box.clientWidth);
      if (!w || w === lastW) return;
      lastW = w;
      clear(box);
      draw(box, w, height);
    }
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(go).observe(box);
    requestAnimationFrame(go);
    return box;
  }
  function hatch(id, color) {
    return svg("pattern", { id: id, width: "5", height: "5", patternUnits: "userSpaceOnUse", patternTransform: "rotate(135)" },
      svg("rect", { width: "5", height: "5", fill: color, opacity: ".18" }),
      svg("line", { x1: "0", y1: "0", x2: "0", y2: "5", stroke: color, "stroke-width": "2.2" }));
  }
  var uid = 0;

  function tipBox(box) {
    var t = h("div", { class: "tip", role: "tooltip" });
    box.appendChild(t);
    return {
      show: function (x, y, title, rows, w) {
        clear(t);
        t.appendChild(h("div", { class: "th" }, title));
        rows.forEach(function (r) {
          t.appendChild(h("div", { class: "tr" }, r.color ? h("i", { style: { background: r.color } }) : null, h("b", null, r.value), h("span", null, r.label)));
        });
        t.classList.add("on");
        var tw = t.offsetWidth;
        var left = x + 14 + tw > w ? x - tw - 14 : x + 14;
        t.style.left = Math.max(0, left) + "px";
        t.style.top = Math.max(0, y - 10) + "px";
      },
      hide: function () { t.classList.remove("on"); }
    };
  }

  /* Lines. o = { height, labels:[], series:[{name, color, values:[], dashFrom, area}],
     split (index where the forecast starts), yFormat(v), tipFormat(v),
     xFormat(label, i) → axis text or null, tipTitle(label, i), zero } */
  function lineChart(o) {
    var H = o.height || 220;
    return responsive(function (box, W) {
      var padL = 54, padR = 12, padT = 12, padB = 26;
      var all = [];
      o.series.forEach(function (s) { s.values.forEach(function (v) { if (v != null) all.push(v); }); });
      var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
      if (o.zero) lo = Math.min(0, lo);
      var pad = (hi - lo) * 0.08 || 1; lo -= o.zero ? 0 : pad; hi += pad;
      var ticks = niceTicks(lo, hi, 4);
      lo = ticks[0]; hi = ticks[ticks.length - 1];
      var n = o.labels.length;
      var x = function (i) { return padL + (n <= 1 ? 0 : i * (W - padL - padR) / (n - 1)); };
      var y = function (v) { return padT + (hi - v) / (hi - lo) * (H - padT - padB); };
      var s = svg("svg", { width: W, height: H, role: "img", "aria-label": o.label || "Chart" });
      var g = svg("g");
      ticks.forEach(function (t) {
        g.appendChild(svg("line", { x1: padL, x2: W - padR, y1: y(t), y2: y(t), class: t === 0 ? "base" : "gridl" }));
        var tx = svg("text", { x: padL - 8, y: y(t) + 4, "text-anchor": "end", class: "axis" });
        tx.textContent = o.yFormat ? o.yFormat(t) : t;
        g.appendChild(tx);
      });
      var step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - padL) / 70))));
      o.labels.forEach(function (lb, i) {
        var txt = o.xFormat ? o.xFormat(lb, i) : lb;
        // Every `step`th label, and the last — unless it would collide with
        // the one before it.
        if (txt == null || (i % step && i !== n - 1)) return;
        if (i !== n - 1 && i % step === 0 && n - 1 - i < step && n - 1 - i > 0) return;
        var tx = svg("text", { x: x(i), y: H - 6, "text-anchor": i === 0 ? "start" : i === n - 1 ? "end" : "middle", class: "axis" });
        tx.textContent = txt;
        g.appendChild(tx);
      });
      if (o.split != null) {
        var sx = x(o.split);
        g.appendChild(svg("line", { x1: sx, x2: sx, y1: padT - 4, y2: H - padB, stroke: "var(--ink-4)", "stroke-width": "1", "stroke-dasharray": "2 3" }));
        var tt = svg("text", { x: sx + 6, y: padT + 6, class: "axis" }); tt.textContent = o.splitLabel || "Today";
        g.appendChild(tt);
      }
      s.appendChild(g);
      o.series.forEach(function (sr) {
        var pts = sr.values.map(function (v, i) { return v == null ? null : [x(i), y(v)]; });
        function path(from, to) {
          var d = "", started = false;
          for (var i = from; i <= to; i++) {
            if (!pts[i]) { started = false; continue; }
            d += (started ? "L" : "M") + pts[i][0].toFixed(1) + " " + pts[i][1].toFixed(1);
            started = true;
          }
          return d;
        }
        var last = pts.length - 1, df = sr.dashFrom != null ? sr.dashFrom : last + 1;
        if (sr.area) {
          var first = pts.findIndex(function (p) { return p; });
          var end = Math.min(last, df);
          while (end > first && !pts[end]) end--;
          var ad = path(first, end) + "L" + x(end) + " " + (H - padB) + "L" + x(first) + " " + (H - padB) + "Z";
          s.appendChild(svg("path", { d: ad, fill: sr.color, opacity: ".09" }));
        }
        s.appendChild(svg("path", { d: path(0, Math.min(last, df)), fill: "none", stroke: sr.color, "stroke-width": "2", "stroke-linejoin": "round", "stroke-linecap": "round" }));
        if (df <= last) s.appendChild(svg("path", { d: path(df, last), fill: "none", stroke: sr.color, "stroke-width": "2", "stroke-dasharray": "4 4", "stroke-linecap": "round" }));
        if (sr.endDot !== false && pts[last]) s.appendChild(svg("circle", { cx: pts[last][0], cy: pts[last][1], r: "4", fill: sr.color, stroke: "var(--surface)", "stroke-width": "2" }));
      });
      var hair = svg("line", { y1: padT, y2: H - padB, class: "xhair", opacity: "0" });
      var dots = o.series.map(function (sr) { return svg("circle", { r: "4", fill: sr.color, stroke: "var(--surface)", "stroke-width": "2", opacity: "0" }); });
      s.appendChild(hair); dots.forEach(function (d) { s.appendChild(d); });
      var hit = svg("rect", { x: padL, y: 0, width: W - padL - padR, height: H, fill: "transparent", tabindex: "0", "aria-label": (o.label || "Chart") + " — use arrow keys to read values" });
      s.appendChild(hit);
      box.appendChild(s);
      var tip = tipBox(box), cur = -1;
      function show(i) {
        if (i < 0 || i >= n) return;
        cur = i;
        hair.setAttribute("x1", x(i)); hair.setAttribute("x2", x(i)); hair.setAttribute("opacity", "1");
        var rows = [];
        o.series.forEach(function (sr, k) {
          var v = sr.values[i];
          if (v == null) { dots[k].setAttribute("opacity", "0"); return; }
          dots[k].setAttribute("cx", x(i)); dots[k].setAttribute("cy", y(v)); dots[k].setAttribute("opacity", "1");
          rows.push({ color: sr.color, value: (o.tipFormat || o.yFormat || String)(v), label: sr.name });
        });
        if (o.tipExtra) rows = rows.concat(o.tipExtra(i));
        var top = Math.min.apply(null, o.series.map(function (sr) { return sr.values[i] == null ? H : y(sr.values[i]); }));
        tip.show(x(i), top, o.tipTitle ? o.tipTitle(o.labels[i], i) : o.labels[i], rows, W);
      }
      function hide() { hair.setAttribute("opacity", "0"); dots.forEach(function (d) { d.setAttribute("opacity", "0"); }); tip.hide(); }
      hit.addEventListener("pointermove", function (ev) {
        var r = s.getBoundingClientRect(), px = ev.clientX - r.left;
        show(Math.round((px - padL) / ((W - padL - padR) / Math.max(1, n - 1))));
      });
      hit.addEventListener("pointerleave", hide);
      hit.addEventListener("focus", function () { show(cur < 0 ? n - 1 : cur); });
      hit.addEventListener("blur", hide);
      hit.addEventListener("keydown", function (ev) {
        if (ev.key === "ArrowLeft") { ev.preventDefault(); show(Math.max(0, cur - 1)); }
        if (ev.key === "ArrowRight") { ev.preventDefault(); show(Math.min(n - 1, cur + 1)); }
      });
    }, H);
  }

  /* Columns. o = { height, labels, series:[{name, color, values}], stacked,
     prelimFrom (index), marks:{name, values} (a tick per column, e.g. budget),
     yFormat, tipFormat, onClick(i) } */
  function columns(o) {
    var H = o.height || 220;
    return responsive(function (box, W) {
      var padL = 54, padR = 8, padT = 12, padB = 26;
      var n = o.labels.length, S = o.series.length;
      var tops = [], bots = [0];
      for (var i = 0; i < n; i++) {
        if (o.stacked) {
          var pos = 0, neg = 0;
          o.series.forEach(function (s) { var v = s.values[i] || 0; if (v > 0) pos += v; else neg += v; });
          tops.push(pos); bots.push(neg);
        } else o.series.forEach(function (s) { tops.push(s.values[i] || 0); bots.push(Math.min(0, s.values[i] || 0)); });
        if (o.marks && o.marks.values[i] != null) tops.push(o.marks.values[i]);
      }
      var ticks = niceTicks(Math.min.apply(null, bots), Math.max.apply(null, tops) * 1.05, 4);
      var lo = ticks[0], hi = ticks[ticks.length - 1];
      var y = function (v) { return padT + (hi - v) / (hi - lo) * (H - padT - padB); };
      var band = (W - padL - padR) / n;
      var groupW = Math.min(band * 0.72, o.stacked ? 24 : 24 * S + 2 * (S - 1));
      var barW = o.stacked ? groupW : Math.min(24, (groupW - 2 * (S - 1)) / S);
      var s = svg("svg", { width: W, height: H, role: "img", "aria-label": o.label || "Chart" });
      var defs = svg("defs");
      var hid = "hatch" + (++uid);
      o.series.forEach(function (sr, k) { defs.appendChild(hatch(hid + "-" + k, sr.color)); });
      s.appendChild(defs);
      ticks.forEach(function (t) {
        s.appendChild(svg("line", { x1: padL, x2: W - padR, y1: y(t), y2: y(t), class: t === 0 ? "base" : "gridl" }));
        var tx = svg("text", { x: padL - 8, y: y(t) + 4, "text-anchor": "end", class: "axis" });
        tx.textContent = o.yFormat ? o.yFormat(t) : t;
        s.appendChild(tx);
      });
      var tip = tipBox(box);
      function bar(x0, v0, v1, w, fill, roundTop) {
        var yt = y(Math.max(v0, v1)), yb = y(Math.min(v0, v1)), hgt = Math.max(0, yb - yt);
        var r = Math.min(4, w / 2, hgt);
        var up = v1 >= v0;
        var d = up
          ? "M" + x0 + " " + yb + "V" + (yt + r) + "Q" + x0 + " " + yt + " " + (x0 + r) + " " + yt + "H" + (x0 + w - r) + "Q" + (x0 + w) + " " + yt + " " + (x0 + w) + " " + (yt + r) + "V" + yb + "Z"
          : "M" + x0 + " " + yt + "V" + (yb - r) + "Q" + x0 + " " + yb + " " + (x0 + r) + " " + yb + "H" + (x0 + w - r) + "Q" + (x0 + w) + " " + yb + " " + (x0 + w) + " " + (yb - r) + "V" + yt + "Z";
        if (!roundTop) d = "M" + x0 + " " + yt + "H" + (x0 + w) + "V" + yb + "H" + x0 + "Z";
        return svg("path", { d: d, fill: fill });
      }
      for (i = 0; i < n; i++) (function (i) {
        var gx = padL + band * i + (band - groupW) / 2;
        var g = svg("g", { class: "col" });
        var prelim = o.prelimFrom != null && i >= o.prelimFrom;
        if (o.stacked) {
          var accP = 0, accN = 0;
          o.series.forEach(function (sr, k) {
            var v = sr.values[i] || 0;
            if (!v) return;
            var base = v > 0 ? accP : accN, topV = base + v;
            var last = o.series.slice(k + 1).every(function (x) { return !(x.values[i] > 0 === v > 0 && x.values[i]); });
            g.appendChild(bar(gx, base, topV, barW, prelim ? "url(#" + hid + "-" + k + ")" : sr.color, last));
            // the 2px surface gap between stacked segments
            if (!last) g.appendChild(svg("line", { x1: gx, x2: gx + barW, y1: y(topV), y2: y(topV), stroke: "var(--surface)", "stroke-width": "2" }));
            if (v > 0) accP = topV; else accN = topV;
          });
        } else {
          o.series.forEach(function (sr, k) {
            var v = sr.values[i];
            if (v == null) return;
            g.appendChild(bar(gx + k * (barW + 2), 0, v, barW, prelim ? "url(#" + hid + "-" + k + ")" : sr.color, true));
          });
        }
        if (o.marks && o.marks.values[i] != null) {
          var my = y(o.marks.values[i]);
          g.appendChild(svg("line", { x1: gx - 4, x2: gx + groupW + 4, y1: my, y2: my, stroke: "var(--ink)", "stroke-width": "2", "stroke-linecap": "round" }));
        }
        var hitR = svg("rect", { x: padL + band * i, y: padT, width: band, height: H - padT - padB, fill: "transparent", tabindex: "0",
          "aria-label": o.labels[i] + ": " + o.series.map(function (sr) { return sr.name + " " + (o.tipFormat || o.yFormat || String)(sr.values[i] || 0); }).join(", ") });
        function on() {
          g.setAttribute("opacity", ".82");
          var rows = o.series.map(function (sr) { return { color: sr.color, value: (o.tipFormat || o.yFormat || String)(sr.values[i] || 0), label: sr.name }; });
          if (o.marks && o.marks.values[i] != null) rows.push({ color: "var(--ink)", value: (o.tipFormat || o.yFormat || String)(o.marks.values[i]), label: o.marks.name });
          if (prelim) rows.push({ value: "Preliminary", label: "period still open" });
          if (o.tipExtra) rows = rows.concat(o.tipExtra(i));
          tip.show(padL + band * i + band / 2, y(Math.max.apply(null, o.series.map(function (sr) { return sr.values[i] || 0; }))), o.tipTitle ? o.tipTitle(o.labels[i], i) : o.labels[i], rows, W);
        }
        function off() { g.removeAttribute("opacity"); tip.hide(); }
        hitR.addEventListener("pointerenter", on); hitR.addEventListener("pointerleave", off);
        hitR.addEventListener("focus", on); hitR.addEventListener("blur", off);
        if (o.onClick) { hitR.style.cursor = "pointer"; hitR.addEventListener("click", function () { o.onClick(i); }); hitR.addEventListener("keydown", function (ev) { if (ev.key === "Enter") o.onClick(i); }); }
        s.appendChild(g);
        s.appendChild(hitR);
        var tx = svg("text", { x: padL + band * i + band / 2, y: H - 6, "text-anchor": "middle", class: "axis" });
        tx.textContent = o.xFormat ? o.xFormat(o.labels[i], i) : o.labels[i];
        s.appendChild(tx);
      })(i);
      box.appendChild(s);
    }, H);
  }

  function spark(values, o) {
    o = o || {};
    var W = o.w || 120, H = o.h || 26;
    var lo = Math.min.apply(null, values), hi = Math.max.apply(null, values);
    if (hi === lo) { hi += 1; lo -= 1; }
    var s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, "aria-hidden": "true" });
    var d = values.map(function (v, i) { return (i ? "L" : "M") + (i * (W - 4) / (values.length - 1) + 2).toFixed(1) + " " + (2 + (hi - v) / (hi - lo) * (H - 4)).toFixed(1); }).join("");
    s.appendChild(svg("path", { d: d, fill: "none", stroke: o.color || "var(--ink-4)", "stroke-width": "1.6", "stroke-linejoin": "round", "stroke-linecap": "round" }));
    var lx = W - 2, ly = 2 + (hi - values[values.length - 1]) / (hi - lo) * (H - 4);
    s.appendChild(svg("circle", { cx: lx, cy: ly, r: "2.6", fill: o.accent || "var(--accent)" }));
    return s;
  }
  function ring(frac, o) {
    o = o || {};
    var S = o.size || 76, sw = o.stroke || 7, r = (S - sw) / 2, c = 2 * Math.PI * r;
    var s = svg("svg", { width: S, height: S, viewBox: "0 0 " + S + " " + S, "aria-hidden": "true" },
      svg("circle", { cx: S / 2, cy: S / 2, r: r, fill: "none", stroke: "var(--sunken)", "stroke-width": sw }),
      svg("circle", { cx: S / 2, cy: S / 2, r: r, fill: "none", stroke: o.color || "var(--good-dot)", "stroke-width": sw, "stroke-linecap": "round",
        "stroke-dasharray": (c * Math.max(0, Math.min(1, frac))).toFixed(1) + " " + c.toFixed(1), transform: "rotate(-90 " + S / 2 + " " + S / 2 + ")" }));
    return h("div", { class: "ring", style: { width: S + "px", height: S + "px" }, role: "img", "aria-label": o.label || Math.round(frac * 100) + "%" }, s, h("b", null, o.text || Math.round(frac * 100) + "%"));
  }
  function legend(items) {
    return h("div", { class: "legend" }, items.map(function (it) {
      return h("span", null, h("i", { class: it.kind || "", style: { background: it.color, borderColor: it.color } }), it.label);
    }));
  }

  /* ---------------------------------------------------------- Page parts */
  function pageHead(title, sub, actions) {
    return h("div", { class: "ph" }, h("div", null, h("h1", null, title), sub ? h("p", null, sub) : null),
      actions && actions.length ? h("div", { class: "actions" }, actions) : null);
  }
  /* A search field that filters in place: the caller redraws only the list,
     so the field keeps its focus and caret while someone types. */
  function searchBox(placeholder, value, onChange, o) {
    o = o || {};
    var inp = h("input", { type: "search", class: "input", placeholder: placeholder, value: value || "", "aria-label": placeholder, autocomplete: "off", spellcheck: "false" });
    var t = null;
    inp.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { onChange(inp.value.trim()); }, 90); });
    inp.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && inp.value) { ev.stopPropagation(); inp.value = ""; onChange(""); } });
    return h("label", { class: "searchf", style: o.width ? { width: o.width } : null }, icon("search", "sm"), inp);
  }
  function csv(name, rows) {
    var text = rows.map(function (r) {
      return r.map(function (c) { c = c == null ? "" : String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(",");
    }).join("\n");
    var a = h("a", { href: URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" })), download: name });
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  /* Major units → minor, accepting "1,234.56" and "(1,234.56)". NaN if not a number. */
  function parseMoney(text, dp) {
    var t = String(text || "").trim(), neg = /^\(.*\)$/.test(t) || /^[-−]/.test(t);
    t = t.replace(/[^0-9.]/g, "");
    if (!t || (t.match(/\./g) || []).length > 1) return NaN;
    var v = Math.round(parseFloat(t) * Math.pow(10, dp));
    return neg ? -v : v;
  }
  function majorOf(minor, dp) { return (minor / Math.pow(10, dp)).toFixed(dp); }

  EFM.ui = {
    h: h, clear: clear, svg: svg, icon: icon, logo: logo, money: money, amt: amt, pct: pct, date: date, time: time, period: period,
    person: person, avatar: avatar, who: who, status: status, tag: tag, sev: sev, btn: btn, gated: gated, seg: seg, select: select,
    chipFilter: chipFilter, card: card, kpis: kpis, delta: delta, meter: meter, empty: empty, table: table, jeTable: jeTable,
    timeline: timeline, toast: toast, attempt: attempt, modal: modal, confirm: confirm, ask: ask, menu: menu,
    charts: { line: lineChart, columns: columns, spark: spark, ring: ring, legend: legend, niceTicks: niceTicks },
    pageHead: pageHead, searchBox: searchBox, csv: csv, parseMoney: parseMoney, majorOf: majorOf,
    ICONS: ICONS
  };
})(window);
