/* ==========================================================================
   OC EFM — visualisation.

   From the one-line trend in a table cell to a whole book laid out at once:
   treemaps and sunbursts for what the money was, Sankey flows for where it
   moved, calendars for when, heat matrices for how it changed, waterfalls for
   how a total was built, networks for what is connected to what, and a
   constellation of every transaction so the odd one shows itself.

   All of it is plain SVG drawn here — no library, nothing fetched — and reads
   the same tokens as the rest of the product, so it follows light and dark.
   Every mark can be hovered, focused and clicked through to the record behind
   it, because a picture of a number you can't open is decoration.

     EFM.viz.<chart>(options) → an element
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h, svg = ui.svg;
  var V = EFM.viz = {};

  /* ------------------------------------------------------------- Helpers */
  function col(i) { return "var(--v" + (((i % 10) + 10) % 10 + 1) + ")"; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function sum(a, f) { var s = 0; for (var i = 0; i < a.length; i++) s += f ? f(a[i], i) : a[i]; return s; }
  function tw(s, fs) { return String(s).length * (fs || 11) * 0.56; }
  function trunc(s, px, fs) {
    s = String(s); var max = Math.floor(px / ((fs || 11) * 0.56));
    return s.length <= max ? s : max < 2 ? "" : s.slice(0, max - 1) + "…";
  }
  function empty(msg) { return h("div", { class: "viz-empty" }, msg || "Nothing to show yet."); }
  function money(o) { return o.fmt || function (v) { return String(Math.round(v)); }; }
  function pctText(x) { return (x * 100 >= 10 ? Math.round(x * 100) : (x * 100).toFixed(1)) + "%"; }
  /* A tint of a token: `share` of the colour over the surface. */
  function mix(c, share) { return "color-mix(in srgb, " + c + " " + Math.round(clamp(share, 0, 1) * 100) + "%, var(--surface))"; }

  /* A responsive chart box with a tooltip. `draw(box, width, height, tip)`. */
  function frame(o, height, draw, label) {
    var box = ui.responsive(function (b, W, H) { draw(b, W, H, ui.tipBox(b)); }, height);
    box.classList.add("viz");
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", label || (o && o.label) || "Chart");
    return box;
  }
  /* Tooltip on hover and focus. `get()` → { title, rows:[{color,value,label}] }. */
  function hover(el, box, tip, W, get, onEnter, onLeave) {
    function at(x, y) { var d = get(); tip.show(x, y, d.title, d.rows || [], W); }
    el.addEventListener("mousemove", function (ev) { var r = box.getBoundingClientRect(); at(ev.clientX - r.left, ev.clientY - r.top); });
    el.addEventListener("mouseenter", function () { if (onEnter) onEnter(); });
    el.addEventListener("mouseleave", function () { tip.hide(); if (onLeave) onLeave(); });
    el.addEventListener("focus", function () {
      var r = box.getBoundingClientRect(), b = el.getBoundingClientRect();
      at(b.left - r.left + b.width / 2, b.top - r.top + b.height / 2); if (onEnter) onEnter();
    });
    el.addEventListener("blur", function () { tip.hide(); if (onLeave) onLeave(); });
  }
  /* A mark somebody can click, tab to and press Enter on. */
  function act(el, label, onClick, focusable) {
    el.classList.add("mk");
    if (label) el.setAttribute("aria-label", label);
    if (onClick) {
      el.addEventListener("click", function (ev) { ev.stopPropagation(); onClick(ev); });
      if (focusable !== false) {
        el.setAttribute("tabindex", "0"); el.setAttribute("role", "button");
        el.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onClick(ev); } });
      }
    }
    return el;
  }
  V.color = col; V.mix = mix; V.empty = empty;

  /* --------------------------------------------------------------- Treemap
     items: [{ id, label, value, group?, color?, data? }]. With `group` the
     rectangles nest: groups first, their members inside. */
  function squarify(nodes, x, y, w, hh) {
    var total = sum(nodes, function (n) { return n.value; });
    if (total <= 0 || w <= 0 || hh <= 0) { nodes.forEach(function (n) { n.x = x; n.y = y; n.w = 0; n.h = 0; }); return; }
    var k = w * hh / total, queue = nodes.slice().sort(function (a, b) { return b.value - a.value; });
    var rx = x, ry = y, rw = w, rh = hh;
    while (queue.length) {
      var side = Math.min(rw, rh), row = [], area = 0, mx = 0, mn = Infinity, worst = Infinity;
      while (queue.length) {
        var n = queue[0], a = n.value * k, na = area + a, nmx = Math.max(mx, a), nmn = Math.min(mn, a);
        var nw = Math.max(side * side * nmx / (na * na), na * na / (side * side * nmn));
        if (row.length && nw > worst) break;
        row.push(queue.shift()); area = na; mx = nmx; mn = nmn; worst = nw;
      }
      var thick = area / side;
      if (rw >= rh) {
        var cy = ry; row.forEach(function (n) { var t = n.value * k / thick; n.x = rx; n.y = cy; n.w = thick; n.h = t; cy += t; });
        rx += thick; rw -= thick;
      } else {
        var cx = rx; row.forEach(function (n) { var t = n.value * k / thick; n.x = cx; n.y = ry; n.w = t; n.h = thick; cx += t; });
        ry += thick; rh -= thick;
      }
    }
  }
  V.treemap = function (o) {
    var items = (o.items || []).filter(function (i) { return i.value > 0; });
    if (!items.length) return empty(o.empty);
    var fmt = money(o), total = sum(items, function (i) { return i.value; });
    return frame(o, o.height || 340, function (box, W, H, tip) {
      var s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H });
      var groups = {}, order = [];
      items.forEach(function (it) { var g = it.group || "_"; if (!groups[g]) { groups[g] = { id: g, value: 0, items: [] }; order.push(groups[g]); } groups[g].value += it.value; groups[g].items.push(it); });
      var nested = order.length > 1 || (order.length === 1 && order[0].id !== "_");
      squarify(order, 0, 0, W, H);
      order.forEach(function (g, gi) {
        var base = col(gi);
        var pad = nested ? 2 : 0, head = nested && g.h > 54 && g.w > 90 ? 17 : 0;
        if (nested) {
          s.appendChild(svg("rect", { x: g.x + 1, y: g.y + 1, width: Math.max(0, g.w - 2), height: Math.max(0, g.h - 2), rx: 6, fill: mix(base, 0.12) }));
          if (head) s.appendChild(svg("text", { x: g.x + 8, y: g.y + 13, class: "t-strong", "font-size": 11 }, document.createTextNode(trunc(g.id + " · " + fmt(g.value), g.w - 14))));
        }
        var leaves = g.items.map(function (i) { return { it: i, value: i.value }; });
        squarify(leaves, g.x + pad + 1, g.y + pad + 1 + head, Math.max(0, g.w - 2 * pad - 2), Math.max(0, g.h - 2 * pad - 2 - head));
        leaves.sort(function (a, b) { return b.value - a.value; });
        leaves.forEach(function (lf, li) {
          var it = lf.it, x = lf.x + 1, y = lf.y + 1, w = Math.max(0, lf.w - 2), hh = Math.max(0, lf.h - 2);
          if (w < 1 || hh < 1) return;
          var c = it.color || (nested ? base : col(li)), share = it.value / total;
          var r = svg("rect", { x: x, y: y, width: w, height: hh, rx: 4, fill: c, "fill-opacity": clamp(0.95 - li * 0.045, 0.55, 0.95), class: "rim" });
          act(r, it.label + ", " + fmt(it.value), o.onClick ? function () { o.onClick(it); } : null, items.length <= 60);
          hover(r, box, tip, W, function () { return { title: it.label, rows: [{ color: c, value: fmt(it.value), label: pctText(share) + " of the total" }].concat(it.group ? [{ value: it.group, label: "in" }] : []) }; },
            function () { box.classList.add("dim"); r.classList.add("on"); }, function () { box.classList.remove("dim"); r.classList.remove("on"); });
          s.appendChild(r);
          if (w > 58 && hh > 30) {
            s.appendChild(svg("text", { x: x + 8, y: y + 17, class: "t-in", "font-size": 11.5, "pointer-events": "none" }, document.createTextNode(trunc(it.label, w - 14, 11.5))));
            if (hh > 44) s.appendChild(svg("text", { x: x + 8, y: y + 32, class: "t-in t-sm", "font-weight": 500, "pointer-events": "none" }, document.createTextNode(trunc(fmt(it.value), w - 14, 10))));
          } else if (w > 26 && hh > 16) s.appendChild(svg("text", { x: x + 4, y: y + 12, class: "t-in t-sm", "pointer-events": "none" }, document.createTextNode(trunc(it.label, w - 6, 10))));
        });
      });
      box.appendChild(s);
    }, o.label || "Treemap");
  };

  /* ---------------------------------------------------------------- Sankey
     nodes: [{ id, label, color?, layer? }]  links: [{ source, target, value }] */
  V.sankey = function (o) {
    var nodes = (o.nodes || []).map(function (n, i) { return { id: n.id, label: n.label || n.id, color: n.color, layer: n.layer, i: i, in: [], out: [], v: 0 }; });
    var byId = {}; nodes.forEach(function (n) { byId[n.id] = n; });
    var links = (o.links || []).filter(function (l) { return l.value > 0 && byId[l.source] && byId[l.target] && l.source !== l.target; })
      .map(function (l) { return { s: byId[l.source], t: byId[l.target], value: l.value }; });
    if (!links.length) return empty(o.empty);
    links.forEach(function (l) { l.s.out.push(l); l.t.in.push(l); });
    nodes = nodes.filter(function (n) { return n.in.length || n.out.length; });
    nodes.forEach(function (n) { n.v = Math.max(sum(n.in, function (l) { return l.value; }), sum(n.out, function (l) { return l.value; })); });
    // Layers: given, or the longest path from a source (guarded against cycles).
    var guard = nodes.length + 1;
    nodes.forEach(function (n) { if (n.layer == null) n.layer = 0; else n.fixed = true; });
    for (var it = 0; it < guard; it++) {
      var moved = false;
      links.forEach(function (l) { if (!l.t.fixed && l.t.layer < l.s.layer + 1) { l.t.layer = l.s.layer + 1; moved = true; } });
      if (!moved) break;
    }
    var L = Math.max.apply(null, nodes.map(function (n) { return n.layer; })) + 1;
    var fmt = money(o), total = Math.max.apply(null, Array.apply(null, Array(L)).map(function (_, k) { return sum(nodes.filter(function (n) { return n.layer === k; }), function (n) { return n.v; }); }));
    var H = o.height || 420;
    return frame(o, H, function (box, W, HH, tip) {
      var padL = o.padL != null ? o.padL : 4, padR = o.padR != null ? o.padR : Math.min(160, Math.max(70, W * 0.2)), nodeW = 12, gap = 8, top = 6, bot = 6;
      var layers = []; for (var k = 0; k < L; k++) layers.push(nodes.filter(function (n) { return n.layer === k; }).sort(function (a, b) { return b.v - a.v; }));
      var ky = Infinity; layers.forEach(function (ns) { if (ns.length) ky = Math.min(ky, (HH - top - bot - (ns.length - 1) * gap) / Math.max(1, sum(ns, function (n) { return n.v; }))); });
      var labelW = Math.min(150, (W - padL - padR) / (L * 1.6));
      var x0 = padL + (o.labelsLeft === false ? 0 : 0), xs = L > 1 ? (W - padL - padR - nodeW - 0) / (L - 1) : 0;
      nodes.forEach(function (n) { n.h = Math.max(2, n.v * ky); n.x = padL + n.layer * xs; });
      // Place and relax: order each layer by the centre of what feeds it, a few times each way.
      function place(ns) {
        var tot = sum(ns, function (n) { return n.h; }) + (ns.length - 1) * gap, y = top + Math.max(0, (HH - top - bot - tot) / 2);
        ns.forEach(function (n) { n.y = y; y += n.h + gap; });
      }
      layers.forEach(place);
      for (var pass = 0; pass < 6; pass++) {
        for (var a = 1; a < L; a++) { layers[a].forEach(function (n) { n.b = n.in.length ? sum(n.in, function (l) { return (l.s.y + l.s.h / 2) * l.value; }) / sum(n.in, function (l) { return l.value; }) : n.y; }); layers[a].sort(function (p, q) { return p.b - q.b; }); place(layers[a]); }
        for (var c = L - 2; c >= 0; c--) { layers[c].forEach(function (n) { n.b = n.out.length ? sum(n.out, function (l) { return (l.t.y + l.t.h / 2) * l.value; }) / sum(n.out, function (l) { return l.value; }) : n.y; }); layers[c].sort(function (p, q) { return p.b - q.b; }); place(layers[c]); }
      }
      // Ribbons: where each one leaves and arrives on its nodes.
      nodes.forEach(function (n) {
        n.out.sort(function (p, q) { return (p.t.y + p.t.h / 2) - (q.t.y + q.t.h / 2); });
        n.in.sort(function (p, q) { return (p.s.y + p.s.h / 2) - (q.s.y + q.s.h / 2); });
        var oy = n.y, iy = n.y; var ko = n.h / Math.max(1, n.v);
        n.out.forEach(function (l) { l.h = l.value * ko; l.y0 = oy; oy += l.h; });
        n.in.forEach(function (l) { l.h = Math.max(l.h || 0, 0); l.y1 = iy; iy += l.value * ko; });
      });
      var s = svg("svg", { width: W, height: HH, viewBox: "0 0 " + W + " " + HH });
      var linkEls = [], nodeEls = [];
      links.forEach(function (l, i) {
        var xa = l.s.x + nodeW, xb = l.t.x, xm = (xa + xb) / 2, hh = l.h;
        var d = "M" + xa + "," + l.y0 + "C" + xm + "," + l.y0 + " " + xm + "," + l.y1 + " " + xb + "," + l.y1 + "L" + xb + "," + (l.y1 + hh) + "C" + xm + "," + (l.y1 + hh) + " " + xm + "," + (l.y0 + hh) + " " + xa + "," + (l.y0 + hh) + "Z";
        var p = svg("path", { d: d, fill: l.s.color || col(l.s.i), class: "lk" });
        hover(p, box, tip, W, function () { return { title: l.s.label + " → " + l.t.label, rows: [{ color: l.s.color || col(l.s.i), value: fmt(l.value), label: pctText(l.value / l.s.v) + " of " + l.s.label }] }; },
          function () { box.classList.add("dim"); p.classList.add("on"); }, function () { box.classList.remove("dim"); p.classList.remove("on"); });
        s.appendChild(p); linkEls.push(p);
      });
      nodes.forEach(function (n) {
        var c = n.color || col(n.i);
        var r = svg("rect", { x: n.x, y: n.y, width: nodeW, height: n.h, rx: 3, fill: c });
        act(r, n.label + ", " + fmt(n.v), o.onClick ? function () { o.onClick(n); } : null, nodes.length <= 40);
        function related(on) { linkEls.forEach(function (p, i) { var l = links[i]; p.classList.toggle("on", on && (l.s === n || l.t === n)); }); box.classList.toggle("dim", on); r.classList.toggle("on", on); }
        hover(r, box, tip, W, function () { return { title: n.label, rows: [{ color: c, value: fmt(n.v), label: pctText(n.v / total) + " of the widest column" }] }; }, function () { related(true); }, function () { related(false); });
        s.appendChild(r);
        var lastCol = n.layer === L - 1, tx = n.x + nodeW + 6, room = lastCol ? padR - 12 : Math.max(48, xs - nodeW - 14);
        if (n.h >= (lastCol ? 8 : 13)) s.appendChild(svg("text", { x: tx, y: n.y + n.h / 2 + (n.h > 27 ? -1 : 4), class: "t-strong halo", "font-size": 11, "pointer-events": "none" }, document.createTextNode(trunc(n.label, room, 11))));
        if (n.h > 27) s.appendChild(svg("text", { x: tx, y: n.y + n.h / 2 + 13, class: "t-sm halo", "pointer-events": "none" }, document.createTextNode(trunc(fmt(n.v), room, 10))));
      });
      box.appendChild(s);
    }, o.label || "Flow diagram");
  };

  /* -------------------------------------------------------------- Sunburst
     root: { label, value?, children:[…], id?, color? }. Click an arc to zoom
     into it; click the middle to come back out. */
  V.sunburst = function (o) {
    function total(n) { if (n.children && n.children.length) { n.value = sum(n.children, total); } return n.value || 0; }
    var root = JSON.parse(JSON.stringify(o.root || { label: "", children: [] }));
    (function keep(n, d) { n.depth = d; (n.children || []).forEach(function (c) { keep(c, d + 1); }); })(root, 0);
    if (!(total(root) > 0)) return empty(o.empty);
    var fmt = money(o), focus = root, wrap = h("div"), trail = [root];
    function paint() {
      wrap.innerHTML = "";
      var crumb = h("div", { class: "viz-crumb" }, trail.map(function (n, i) { return i === trail.length - 1 ? h("b", null, n.label || "All") : h("span", null, h("button", { type: "button", on: { click: function () { trail = trail.slice(0, i + 1); focus = n; paint(); } } }, n.label || "All"), " ›"); }));
      if (trail.length > 1) wrap.appendChild(crumb);
      wrap.appendChild(frame(o, o.height || 420, function (box, W, H, tip) {
        var cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 6, rings = 3, r0 = R * 0.28, rw = (R - r0) / rings;
        var s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H });
        function arc(a0, a1, ra, rb) {
          var p = function (a, r) { return [cx + r * Math.sin(a), cy - r * Math.cos(a)]; }, big = a1 - a0 > Math.PI ? 1 : 0;
          if (a1 - a0 >= Math.PI * 2 - 1e-6) a1 = a0 + Math.PI * 2 - 1e-4;
          var A = p(a0, rb), B = p(a1, rb), C = p(a1, ra), D = p(a0, ra);
          return "M" + A + "A" + rb + "," + rb + " 0 " + big + " 1 " + B + "L" + C + "A" + ra + "," + ra + " 0 " + big + " 0 " + D + "Z";
        }
        var ft = focus.value;
        (function lay(n, a0, a1, ring, base) {
          if (ring > rings || !n.children) return;
          var a = a0, kids = n.children.slice().sort(function (p, q) { return q.value - p.value; });
          kids.forEach(function (c, ci) {
            var span = (a1 - a0) * (c.value / n.value), b = a + span;
            var c0 = ring === 1 ? col(ci) : base, ra = r0 + (ring - 1) * rw + 1, rb = r0 + ring * rw - 1;
            if (span > 0.004) {
              var p = svg("path", { d: arc(a, b, ra, rb), fill: c.color || c0, "fill-opacity": clamp(1 - (ring - 1) * 0.2, 0.5, 1), class: "rim" });
              act(p, c.label + ", " + fmt(c.value), function () { if (c.children && c.children.length) { focus = c; trail.push(c); paint(); } else if (o.onClick) o.onClick(c); }, false);
              hover(p, box, tip, W, function () { return { title: c.label, rows: [{ color: c.color || c0, value: fmt(c.value), label: pctText(c.value / ft) + " of " + (focus.label || "the total") }].concat(c.children && c.children.length ? [{ value: c.children.length, label: "parts — click to open" }] : []) }; },
                function () { box.classList.add("dim"); p.classList.add("on"); }, function () { box.classList.remove("dim"); p.classList.remove("on"); });
              s.appendChild(p);
              var mid = (a + b) / 2, rm = (ra + rb) / 2, arcLen = span * rm;
              if (arcLen > 34 && rb - ra > 16) {
                var tx = cx + rm * Math.sin(mid), ty = cy - rm * Math.cos(mid), rot = mid * 180 / Math.PI - 90; if (mid > Math.PI) rot += 180;
                s.appendChild(svg("text", { x: tx, y: ty + 3.5, class: "t-in t-sm", "text-anchor": "middle", transform: "rotate(" + rot + " " + tx + " " + ty + ")", "pointer-events": "none" }, document.createTextNode(trunc(c.label, Math.min(arcLen - 6, rb - ra + 30), 10))));
              }
              lay(c, a, b, ring + 1, c.color || c0);
            }
            a = b;
          });
        })(focus, 0, Math.PI * 2, 1, col(0));
        var hub = svg("circle", { cx: cx, cy: cy, r: r0 - 4, fill: "var(--sunken)", class: trail.length > 1 ? "mk" : "" });
        if (trail.length > 1) act(hub, "Back", function () { trail.pop(); focus = trail[trail.length - 1]; paint(); }, true);
        s.appendChild(hub);
        s.appendChild(svg("text", { x: cx, y: cy - 2, "text-anchor": "middle", class: "t-lg", "pointer-events": "none", "font-size": 18 }, document.createTextNode(fmt(focus.value))));
        s.appendChild(svg("text", { x: cx, y: cy + 16, "text-anchor": "middle", "pointer-events": "none" }, document.createTextNode(trunc(focus.label || "Total", r0 * 1.7, 11) + (trail.length > 1 ? " · back" : ""))));
        box.appendChild(s);
      }, o.label || "Sunburst"));
    }
    paint();
    return wrap;
  };

  /* ------------------------------------------------------------- Calendar
     values: { "2026-09-28": 1234, … }; a year of days as weeks. */
  V.calendar = function (o) {
    var vals = o.values || {}, keys = Object.keys(vals);
    if (!keys.length) return empty(o.empty);
    var fmt = money(o), from = o.from || keys.sort()[0], to = o.to || keys.sort()[keys.length - 1];
    var d0 = new Date(from + "T00:00:00Z"), d1 = new Date(to + "T00:00:00Z");
    var start = new Date(d0); start.setUTCDate(start.getUTCDate() - start.getUTCDay());
    var days = Math.round((d1 - start) / 864e5) + 1, cols = Math.ceil(days / 7);
    var nz = keys.map(function (k) { return Math.abs(vals[k]); }).filter(function (v) { return v > 0; }).sort(function (a, b) { return a - b; });
    function level(v) { if (!v) return 0; var a = Math.abs(v), i = 0; while (i < nz.length && nz[i] < a) i++; return 1 + Math.min(3, Math.floor(i / Math.max(1, nz.length) * 4)); }
    var H = 7 * 26 + 24 + 26;
    return frame(o, H, function (box, W, HH, tip) {
      var left = 30, cell = clamp((W - left) / cols, 6, 26), gap = cell > 9 ? 2.5 : 1.2, s = svg("svg", { width: W, height: HH, viewBox: "0 0 " + W + " " + HH });
      var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], lastM = -1;
      ["Mon", "Wed", "Fri"].forEach(function (d, i) { s.appendChild(svg("text", { x: 0, y: 24 + (1 + i * 2) * cell + cell * 0.7, class: "t-sm" }, document.createTextNode(d))); });
      var c = o.color || "var(--heat)", tot = 0;
      for (var i = 0; i < days; i++) {
        var d = new Date(start); d.setUTCDate(start.getUTCDate() + i);
        var iso = d.toISOString().slice(0, 10), wk = Math.floor(i / 7), dow = i % 7, x = left + wk * cell, y = 24 + dow * cell;
        if (iso < from || iso > to) continue;
        if (dow === 0 && d.getUTCMonth() !== lastM && d.getUTCDate() < 15 || (i === 0)) { lastM = d.getUTCMonth(); s.appendChild(svg("text", { x: x, y: 12, class: "t-sm" }, document.createTextNode(MON[lastM]))); }
        var v = vals[iso] || 0, lv = level(v);
        var r = svg("rect", { x: x, y: y, width: cell - gap, height: cell - gap, rx: Math.min(3, cell / 4), fill: lv ? mix(c, 0.22 + lv * 0.19) : "var(--sunken)", class: "cell" });
        act(r, iso + ", " + fmt(v), o.onClick ? (function (iso, v) { return function () { o.onClick(iso, v); }; })(iso, v) : null, false);
        (function (iso, v) { hover(r, box, tip, W, function () { return { title: ui.date(iso, "year"), rows: [{ color: c, value: v ? fmt(v) : "—", label: o.unit || "" }] }; }); })(iso, v);
        s.appendChild(r);
      }
      // A scale, so the shades mean something.
      var lx = W - 5 * 14 - 62; s.appendChild(svg("text", { x: lx, y: HH - 6, class: "t-sm", "text-anchor": "end" }, document.createTextNode("Less")));
      for (var q = 0; q < 5; q++) s.appendChild(svg("rect", { x: lx + 6 + q * 14, y: HH - 6 - 11, width: 12, height: 12, rx: 2, fill: q ? mix(c, 0.22 + q * 0.19) : "var(--sunken)" }));
      s.appendChild(svg("text", { x: lx + 8 + 5 * 14, y: HH - 6, class: "t-sm" }, document.createTextNode("More")));
      box.appendChild(s);
    }, o.label || "Calendar heat map");
  };

  /* ---------------------------------------------------------- Heat matrix
     rows × columns of numbers, shaded by size; the shape of a book at a glance.
     { rows:[{id,label}], cols:[{id,label}], value(rowId, colId), onClick(row, col) } */
  V.heatmatrix = function (o) {
    var rows = o.rows || [], cols = o.cols || [];
    if (!rows.length || !cols.length) return empty(o.empty);
    var fmt = money(o), rh = o.rowHeight || 24, top = 26, labelW = o.labelW || 190, totW = o.totals === false ? 0 : 78;
    var grid = rows.map(function (r) { return cols.map(function (c) { return o.value(r.id, c.id) || 0; }); });
    var rowTot = grid.map(function (g) { return sum(g); }), mx = Math.max.apply(null, grid.map(function (g, i) { return o.perRow ? Math.max.apply(null, g.map(Math.abs)) : 0; }).concat(o.perRow ? [] : [Math.max.apply(null, [].concat.apply([], grid).map(Math.abs))]));
    var H = top + rows.length * rh + 6;
    return frame(o, H, function (box, W, HH, tip) {
      var cw = Math.max(20, (W - labelW - totW) / cols.length), s = svg("svg", { width: W, height: HH, viewBox: "0 0 " + W + " " + HH });
      cols.forEach(function (c, j) { s.appendChild(svg("text", { x: labelW + j * cw + cw / 2, y: 16, "text-anchor": "middle", class: "t-sm" }, document.createTextNode(cw > 30 ? c.label : ""))); });
      if (totW) s.appendChild(svg("text", { x: W - 6, y: 16, "text-anchor": "end", class: "t-sm" }, document.createTextNode("Total")));
      rows.forEach(function (r, i) {
        var y = top + i * rh, m = o.perRow ? Math.max.apply(null, grid[i].map(Math.abs)) || 1 : mx || 1;
        s.appendChild(svg("text", { x: 0, y: y + rh / 2 + 4, class: "t-strong", "font-size": 11.5 }, document.createTextNode(trunc(r.label, labelW - 12, 11.5))));
        cols.forEach(function (c, j) {
          var v = grid[i][j], sh = v ? 0.12 + 0.82 * Math.sqrt(Math.abs(v) / m) : 0;
          var rc = svg("rect", { x: labelW + j * cw + 1, y: y + 1, width: cw - 2, height: rh - 2, rx: 4, fill: v ? mix(v < 0 ? "var(--v2)" : (o.color || "var(--heat)"), sh) : "var(--sunken)", class: "cell" });
          act(rc, r.label + " " + c.label + ", " + fmt(v), o.onClick ? function () { o.onClick(r, c, v); } : null, false);
          hover(rc, box, tip, W, function () { return { title: r.label + " · " + c.label, rows: [{ color: o.color || "var(--heat)", value: fmt(v), label: o.unit || "" }] }; });
          s.appendChild(rc);
          if (v && cw > 54 && sh > 0.5) s.appendChild(svg("text", { x: labelW + j * cw + cw / 2, y: y + rh / 2 + 4, "text-anchor": "middle", class: "t-in t-sm", "pointer-events": "none" }, document.createTextNode(fmt(v))));
        });
        if (totW) s.appendChild(svg("text", { x: W - 6, y: y + rh / 2 + 4, "text-anchor": "end", class: "t-strong" }, document.createTextNode(fmt(rowTot[i]))));
      });
      box.appendChild(s);
    }, o.label || "Heat matrix");
  };

  /* ------------------------------------------------------------- Waterfall
     steps: [{ label, value, kind: "total" | "delta" }]; a "total" stands on
     the baseline, a "delta" floats from where the last one ended. */
  V.waterfall = function (o) {
    var steps = o.steps || [];
    if (!steps.length) return empty(o.empty);
    var fmt = money(o), run = 0, bars = steps.map(function (st) {
      var b;
      if (st.kind === "total") { b = { lo: Math.min(0, st.value), hi: Math.max(0, st.value), end: st.value, st: st }; run = st.value; }
      else { b = { lo: Math.min(run, run + st.value), hi: Math.max(run, run + st.value), end: run + st.value, st: st }; run += st.value; }
      return b;
    });
    var lo = Math.min(0, Math.min.apply(null, bars.map(function (b) { return b.lo; }))), hi = Math.max.apply(null, bars.map(function (b) { return b.hi; })) || 1;
    var ticks = ui.charts.niceTicks(lo, hi, 4);
    return frame(o, o.height || 300, function (box, W, H, tip) {
      var padL = 54, padB = 46, padT = 16, padR = 8, ih = H - padT - padB, iw = W - padL - padR;
      var y0 = ticks[0], y1 = ticks[ticks.length - 1], Y = function (v) { return padT + (y1 - v) / (y1 - y0) * ih; };
      var s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H });
      ticks.forEach(function (t) { s.appendChild(svg("line", { x1: padL, x2: W - padR, y1: Y(t), y2: Y(t), class: t === 0 ? "zero" : "grid" })); s.appendChild(svg("text", { x: padL - 8, y: Y(t) + 4, "text-anchor": "end", class: "t-sm" }, document.createTextNode(fmt(t)))); });
      var bw = Math.min(46, iw / bars.length * 0.62), step = iw / bars.length;
      bars.forEach(function (b, i) {
        var x = padL + i * step + (step - bw) / 2, st = b.st, c = st.kind === "total" ? (o.totalColor || "var(--v1)") : st.value >= 0 ? "var(--v3)" : "var(--v2)";
        if (st.color) c = st.color;
        var r = svg("rect", { x: x, y: Y(b.hi), width: bw, height: Math.max(1.5, Y(b.lo) - Y(b.hi)), rx: 4, fill: c, class: "rim" });
        act(r, st.label + ", " + fmt(st.value), o.onClick ? function () { o.onClick(st); } : null, bars.length <= 30);
        hover(r, box, tip, W, function () { return { title: st.label, rows: [{ color: c, value: fmt(st.value), label: st.kind === "total" ? "total" : (st.value >= 0 ? "adds" : "takes away") }, { value: fmt(b.end), label: "running total" }] }; });
        s.appendChild(r);
        if (i < bars.length - 1) s.appendChild(svg("line", { x1: x + bw, x2: x + step, y1: Y(b.end), y2: Y(b.end), class: "hair", "stroke-dasharray": "2 3" }));
        s.appendChild(svg("text", { x: x + bw / 2, y: (st.value >= 0 || st.kind === "total" ? Y(b.hi) - 5 : Y(b.lo) + 12), "text-anchor": "middle", class: "t-strong t-sm" }, document.createTextNode(fmt(st.value))));
        var lab = trunc(st.label, step - 4, 11);
        s.appendChild(svg("text", { x: x + bw / 2, y: H - padB + 16, "text-anchor": "middle" }, document.createTextNode(lab)));
      });
      box.appendChild(s);
    }, o.label || "Waterfall");
  };

  /* --------------------------------------------------------------- Bullet
     rows: [{ label, actual, target, note?, id? }] — actual against a target
     mark; over the target turns the bar warm. */
  V.bullet = function (o) {
    var rows = o.rows || [];
    if (!rows.length) return empty(o.empty);
    var fmt = money(o), mx = Math.max.apply(null, rows.map(function (r) { return Math.max(r.actual, r.target || 0); })) * 1.08 || 1, rh = 34;
    return frame(o, rows.length * rh + 6, function (box, W, H, tip) {
      var labelW = Math.min(170, Math.max(96, W * 0.38)), valW = 60, iw = W - labelW - valW - 10, s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H });
      rows.forEach(function (r, i) {
        var y = i * rh + 4, over = r.target && r.actual > r.target * (o.warnAt || 1);
        s.appendChild(svg("text", { x: 0, y: y + 17, class: "t-strong", "font-size": 12 }, document.createTextNode(trunc(r.label, labelW - 10, 12))));
        s.appendChild(svg("rect", { x: labelW, y: y + 6, width: iw, height: 12, rx: 6, class: "ghost" }));
        var b = svg("rect", { x: labelW, y: y + 6, width: Math.max(2, r.actual / mx * iw), height: 12, rx: 6, fill: over ? "var(--v2)" : "var(--v1)" });
        act(b, r.label + ", " + fmt(r.actual) + (r.target ? " of " + fmt(r.target) : ""), o.onClick ? function () { o.onClick(r); } : null, rows.length <= 30);
        hover(b, box, tip, W, function () { return { title: r.label, rows: [{ color: over ? "var(--v2)" : "var(--v1)", value: fmt(r.actual), label: "actual" }].concat(r.target ? [{ value: fmt(r.target), label: "target" }, { value: pctText(r.actual / r.target), label: "of it" }] : []) }; });
        s.appendChild(b);
        if (r.target) s.appendChild(svg("rect", { x: labelW + r.target / mx * iw - 1.5, y: y + 2, width: 3, height: 20, rx: 1.5, fill: "var(--ink)" }));
        s.appendChild(svg("text", { x: W, y: y + 17, "text-anchor": "end", class: over ? "t-strong" : "" }, document.createTextNode(r.target ? pctText(r.actual / r.target) : fmt(r.actual))));
      });
      box.appendChild(s);
    }, o.label || "Progress against targets");
  };

  /* --------------------------------------------------------------- Pareto
     items sorted by size with the running share — who the total depends on. */
  V.pareto = function (o) {
    var items = (o.items || []).filter(function (i) { return i.value > 0; }).sort(function (a, b) { return b.value - a.value; }).slice(0, o.max || 14);
    if (!items.length) return empty(o.empty);
    var fmt = money(o), total = o.total || sum(items, function (i) { return i.value; }), run = 0;
    items.forEach(function (i) { run += i.value; i.cum = run / total; });
    return frame(o, o.height || 260, function (box, W, H, tip) {
      var padL = 50, padR = 40, padT = 12, padB = 54, iw = W - padL - padR, ih = H - padT - padB, mx = items[0].value * 1.1;
      var s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H }), step = iw / items.length, bw = Math.min(34, step * 0.66);
      ui.charts.niceTicks(0, mx, 4).forEach(function (t) { if (t > mx) return; var y = padT + (1 - t / mx) * ih; s.appendChild(svg("line", { x1: padL, x2: W - padR, y1: y, y2: y, class: "grid" })); s.appendChild(svg("text", { x: padL - 8, y: y + 4, "text-anchor": "end", class: "t-sm" }, document.createTextNode(fmt(t)))); });
      [0, 0.5, 0.8, 1].forEach(function (p) { var y = padT + (1 - p) * ih; s.appendChild(svg("text", { x: W - padR + 6, y: y + 4, class: "t-sm" }, document.createTextNode(Math.round(p * 100) + "%"))); });
      var path = "";
      items.forEach(function (it, i) {
        var x = padL + i * step + (step - bw) / 2, hh = it.value / mx * ih, c = it.color || col(i);
        var r = svg("rect", { x: x, y: padT + ih - hh, width: bw, height: Math.max(1, hh), rx: 4, fill: c });
        act(r, it.label + ", " + fmt(it.value), o.onClick ? function () { o.onClick(it); } : null, items.length <= 30);
        hover(r, box, tip, W, function () { return { title: it.label, rows: [{ color: c, value: fmt(it.value), label: pctText(it.value / total) + " of the total" }, { value: pctText(it.cum), label: "cumulative" }] }; });
        s.appendChild(r);
        path += (i ? "L" : "M") + (x + bw / 2) + "," + (padT + (1 - it.cum) * ih);
        var lab = svg("text", { x: x + bw / 2, y: H - padB + 14, "text-anchor": "end", transform: "rotate(-38 " + (x + bw / 2) + " " + (H - padB + 14) + ")" }, document.createTextNode(trunc(it.label, 90, 11)));
        s.appendChild(lab);
      });
      s.appendChild(svg("line", { x1: padL, x2: W - padR, y1: padT + 0.2 * ih, y2: padT + 0.2 * ih, class: "hair", "stroke-dasharray": "3 4" }));
      s.appendChild(svg("path", { d: path, fill: "none", stroke: "var(--ink)", "stroke-width": 1.8, "stroke-linejoin": "round", "stroke-linecap": "round" }));
      items.forEach(function (it, i) { s.appendChild(svg("circle", { cx: padL + i * step + step / 2, cy: padT + (1 - it.cum) * ih, r: 3, fill: "var(--surface)", stroke: "var(--ink)", "stroke-width": 1.6, "pointer-events": "none" })); });
      box.appendChild(s);
    }, o.label || "Pareto chart");
  };

  V._h = { col: col, clamp: clamp, sum: sum, tw: tw, trunc: trunc, empty: empty, money: money, pctText: pctText, mix: mix, frame: frame, hover: hover, act: act };
})(window);
