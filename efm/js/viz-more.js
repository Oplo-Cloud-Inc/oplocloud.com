/* ==========================================================================
   OC EFM — visualisation, continued: change over time, distribution,
   connection and integrity. See viz.js.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h, svg = ui.svg, V = EFM.viz, U = V._h;
  var col = U.col, clamp = U.clamp, sum = U.sum, trunc = U.trunc, empty = U.empty, money = U.money, pctText = U.pctText, mix = U.mix, frame = U.frame, hover = U.hover, act = U.act;

  /* A smooth curve through points that never overshoots them (monotone cubic). */
  function mono(pts, move) {
    var n = pts.length; if (n < 2) return n ? (move === false ? "L" : "M") + pts[0] : "";
    var dx = [], dy = [], m = [], t = [];
    for (var i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; dy[i] = pts[i + 1][1] - pts[i][1]; m[i] = dx[i] ? dy[i] / dx[i] : 0; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (i = 0; i < n - 1; i++) { if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; } var a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b; if (s > 9) { var k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; } }
    var d = (move === false ? "L" : "M") + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1);
    for (i = 0; i < n - 1; i++) { var w = dx[i] / 3; d += "C" + (pts[i][0] + w).toFixed(1) + "," + (pts[i][1] + t[i] * w).toFixed(1) + " " + (pts[i + 1][0] - w).toFixed(1) + "," + (pts[i + 1][1] - t[i + 1] * w).toFixed(1) + " " + pts[i + 1][0].toFixed(1) + "," + pts[i + 1][1].toFixed(1); }
    return d;
  }

  /* --------------------------------------------------------------- Stacked
     labels + series over time. mode: "area" | "stream" | "percent" | "columns". */
  V.stacked = function (o) {
    var labels = o.labels || [], all = (o.series || []).filter(function (s) { return s.values.some(Boolean); });
    if (!labels.length || !all.length) return empty(o.empty);
    var wrap = h("div"), off = {}, fmt = money(o);
    var chartHost = h("div");
    var legend = h("div", { class: "viz-legend" });
    wrap.appendChild(chartHost); if (o.legend !== false) wrap.appendChild(legend);
    function draw() {
      var series = all.map(function (s, i) { return { s: s, i: i, on: !off[i] }; }).filter(function (x) { return x.on; });
      ui.clear(legend);
      all.forEach(function (s, i) { legend.appendChild(h("button", { type: "button", class: off[i] ? "off" : "", on: { click: function () { off[i] = !off[i]; if (all.every(function (_, k) { return off[k]; })) off = {}; draw(); } } }, h("i", { style: { background: s.color || col(i) } }), s.name)); });
      ui.clear(chartHost);
      if (!series.length) return;
      var mode = o.mode || "area", n = labels.length;
      var stacks = labels.map(function (_, j) { return sum(series, function (x) { return x.s.values[j] || 0; }); });
      var base = labels.map(function (_, j) { return mode === "stream" ? -stacks[j] / 2 : 0; });
      var tot = mode === "percent" ? stacks.map(function (v) { return v || 1; }) : null;
      var lo = Math.min.apply(null, base), hi = Math.max.apply(null, labels.map(function (_, j) { return base[j] + (tot ? stacks[j] / tot[j] : stacks[j]); }));
      if (tot) { lo = 0; hi = 1; }
      chartHost.appendChild(frame(o, o.height || 280, function (box, W, H, tip) {
        var padL = mode === "stream" ? 12 : 54, padR = 12, padT = 12, padB = 26, iw = W - padL - padR, ih = H - padT - padB;
        var ticks = mode === "stream" ? [] : ui.charts.niceTicks(lo, hi, 4), y0 = ticks.length ? Math.min(lo, ticks[0]) : lo, y1 = ticks.length ? Math.max(hi, ticks[ticks.length - 1]) : hi;
        var X = function (j) { return padL + (mode === "columns" ? (j + 0.5) / n : n === 1 ? 0.5 : j / (n - 1)) * iw; }, Y = function (v) { return padT + (y1 - v) / ((y1 - y0) || 1) * ih; };
        var s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H });
        ticks.forEach(function (t) { s.appendChild(svg("line", { x1: padL, x2: W - padR, y1: Y(t), y2: Y(t), class: t === 0 ? "zero" : "grid" })); s.appendChild(svg("text", { x: padL - 8, y: Y(t) + 4, "text-anchor": "end", class: "t-sm" }, document.createTextNode(tot ? Math.round(t * 100) + "%" : fmt(t)))); });
        var acc = base.slice(), layers = [];
        series.forEach(function (x, k) {
          var lower = acc.slice(), upper = acc.map(function (a, j) { var v = (x.s.values[j] || 0) / (tot ? tot[j] : 1); return a + v; });
          acc = upper; layers.push({ x: x, lower: lower, upper: upper });
        });
        var els = [];
        layers.forEach(function (ly, k) {
          var c = ly.x.s.color || col(ly.x.i), el;
          if (mode === "columns") {
            var bw = Math.min(40, iw / n * 0.66), g = svg("g");
            labels.forEach(function (_, j) { var yb = Y(ly.lower[j]), yt = Y(ly.upper[j]); if (yb - yt < 0.4) return; g.appendChild(svg("rect", { x: X(j) - bw / 2, y: yt, width: bw, height: yb - yt, fill: c, rx: k === layers.length - 1 ? 3 : 0 })); });
            el = g;
          } else {
            var top = labels.map(function (_, j) { return [X(j), Y(ly.upper[j])]; }), bot = labels.map(function (_, j) { return [X(j), Y(ly.lower[j])]; }).reverse();
            el = svg("path", { d: mono(top) + mono(bot, false) + "Z", fill: c, "fill-opacity": mode === "stream" ? 0.9 : 0.86, stroke: "var(--surface)", "stroke-width": 1 });
          }
          el.classList.add("mk");
          el.addEventListener("mouseenter", function () { els.forEach(function (e, q) { e.style.opacity = q === k ? 1 : 0.28; }); });
          el.addEventListener("mouseleave", function () { els.forEach(function (e) { e.style.opacity = 1; }); });
          els.push(el); s.appendChild(el);
        });
        if (o.partialLast && n > 1) {
          var pid = "stripe" + Math.floor(Math.random() * 1e6), defs = svg("defs", null, svg("pattern", { id: pid, width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" },
            svg("rect", { width: 6, height: 6, fill: "var(--surface)", "fill-opacity": 0.5 }), svg("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: "var(--surface)", "stroke-width": 3, "stroke-opacity": 0.85 })));
          s.appendChild(defs);
          var px = mode === "columns" ? X(n - 1) - Math.min(40, iw / n * 0.66) / 2 : X(n - 2), pw = mode === "columns" ? Math.min(40, iw / n * 0.66) : X(n - 1) - X(n - 2);
          s.appendChild(svg("rect", { x: px, y: padT, width: pw, height: ih, fill: "url(#" + pid + ")", "pointer-events": "none" }));
          s.appendChild(svg("text", { x: px + pw - 2, y: padT + 10, "text-anchor": "end", class: "t-sm halo" }, document.createTextNode(o.partialLabel || "so far")));
        }
        // A crosshair that reads every layer at one point in time.
        var xh = svg("line", { y1: padT, y2: H - padB, class: "xhair", opacity: 0 }); s.appendChild(xh);
        var hit = svg("rect", { x: padL, y: padT, width: iw, height: ih, fill: "transparent" });
        function idxAt(ev) { var r = box.getBoundingClientRect(), px = ev.clientX - r.left - padL; return clamp(mode === "columns" ? Math.floor(px / (iw / n)) : Math.round(px / iw * (n - 1)), 0, n - 1); }
        hit.addEventListener("mousemove", function (ev) {
          var j = idxAt(ev), r = box.getBoundingClientRect(); xh.setAttribute("x1", X(j)); xh.setAttribute("x2", X(j)); xh.setAttribute("opacity", mode === "columns" ? 0 : 1);
          tip.show(ev.clientX - r.left, ev.clientY - r.top, o.tipTitle ? o.tipTitle(labels[j], j) : labels[j], layers.slice().reverse().map(function (ly) { var v = ly.x.s.values[j] || 0; return { color: ly.x.s.color || col(ly.x.i), value: fmt(v) + (tot ? " · " + pctText(v / tot[j]) : ""), label: ly.x.s.name }; }).concat([{ value: fmt(stacks[j]), label: "all" }]), W);
        });
        hit.addEventListener("mouseleave", function () { tip.hide(); xh.setAttribute("opacity", 0); });
        if (o.onClick) hit.addEventListener("click", function (ev) { o.onClick(idxAt(ev), labels); });
        hit.style.cursor = o.onClick ? "pointer" : "default";
        s.appendChild(hit);
        labels.forEach(function (lb, j) { var every = Math.ceil(n / Math.max(2, Math.floor(iw / 46))); if (j % every) return; s.appendChild(svg("text", { x: X(j), y: H - 8, "text-anchor": "middle", class: "t-sm" }, document.createTextNode(o.xFormat ? o.xFormat(lb, j) : lb))); });
        box.appendChild(s);
      }, o.label || "Stacked chart"));
    }
    draw();
    return wrap;
  };

  /* ------------------------------------------------------------------ Rose
     values by label around a circle, area proportional to size — a year of
     months, a week of days: the shape of a season. */
  V.rose = function (o) {
    var labels = o.labels || [], vals = o.values || [];
    if (!labels.length || !vals.some(Boolean)) return empty(o.empty);
    var fmt = money(o), mx = Math.max.apply(null, vals) || 1;
    return frame(o, o.height || 300, function (box, W, H, tip) {
      var cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 22, r0 = R * 0.16, n = labels.length, s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H });
      [0.25, 0.5, 0.75, 1].forEach(function (f) { s.appendChild(svg("circle", { cx: cx, cy: cy, r: r0 + (R - r0) * Math.sqrt(f), fill: "none", class: "grid" })); });
      var P = function (a, r) { return [cx + r * Math.sin(a), cy - r * Math.cos(a)]; };
      vals.forEach(function (v, i) {
        var a0 = i / n * Math.PI * 2 + 0.02, a1 = (i + 1) / n * Math.PI * 2 - 0.02, r1 = r0 + (R - r0) * Math.sqrt(Math.max(0, v) / mx);
        var d = "M" + P(a0, r0) + "A" + r0 + "," + r0 + " 0 0 1 " + P(a1, r0) + "L" + P(a1, r1) + "A" + r1 + "," + r1 + " 0 0 0 " + P(a0, r1) + "Z";
        var p = svg("path", { d: d, fill: o.colors ? o.colors[i] : col(i % 10), "fill-opacity": 0.9 });
        act(p, labels[i] + ", " + fmt(v), o.onClick ? function () { o.onClick(i); } : null, n <= 14);
        hover(p, box, tip, W, function () { return { title: labels[i], rows: [{ color: o.colors ? o.colors[i] : col(i), value: fmt(v), label: pctText(v / (sum(vals) || 1)) + " of the year" }] }; });
        s.appendChild(p);
        var m = (a0 + a1) / 2, lp = P(m, R + 12); s.appendChild(svg("text", { x: lp[0], y: lp[1] + 4, "text-anchor": "middle", class: "t-sm" }, document.createTextNode(labels[i])));
      });
      box.appendChild(s);
    }, o.label || "Seasonality");
  };

  /* --------------------------------------------------------- Constellation
     points: [{ id, x: "YYYY-MM-DD", y: amount, label, color?, group? }]. Every
     transaction as a star; size and height are amount, and the ones far from
     the pattern are ringed. */
  V.constellation = function (o) {
    var pts = (o.points || []).filter(function (p) { return p.y > 0 && p.x; });
    if (!pts.length) return empty(o.empty);
    var fmt = money(o), logY = o.log !== false, ys = pts.map(function (p) { return logY ? Math.log10(p.y) : p.y; });
    var mean = sum(ys) / ys.length, sd = Math.sqrt(sum(ys, function (v) { return (v - mean) * (v - mean); }) / ys.length) || 1;
    pts.forEach(function (p, i) { p.z = (ys[i] - mean) / sd; });
    var xs = pts.map(function (p) { return Date.parse(p.x + "T00:00:00Z"); }), x0 = o.from ? Date.parse(o.from + "T00:00:00Z") : Math.min.apply(null, xs), x1 = o.to ? Date.parse(o.to + "T00:00:00Z") : Math.max.apply(null, xs);
    if (x1 === x0) x1 = x0 + 864e5;
    var ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
    return frame(o, o.height || 340, function (box, W, H, tip) {
      var padL = 54, padR = 12, padT = 12, padB = 26, iw = W - padL - padR, ih = H - padT - padB, s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H });
      var lo = logY ? Math.floor(ymin) : 0, hi = logY ? Math.ceil(ymax) : ymax * 1.05; if (hi === lo) hi = lo + 1;
      var X = function (t) { return padL + (t - x0) / (x1 - x0) * iw; }, Y = function (v) { return padT + (hi - v) / (hi - lo) * ih; };
      var ticks = logY ? [] : ui.charts.niceTicks(0, hi, 4);
      if (logY) for (var e = lo; e <= hi; e++) ticks.push(e);
      ticks.forEach(function (t) { s.appendChild(svg("line", { x1: padL, x2: W - padR, y1: Y(t), y2: Y(t), class: "grid" })); s.appendChild(svg("text", { x: padL - 8, y: Y(t) + 4, "text-anchor": "end", class: "t-sm" }, document.createTextNode(fmt(logY ? Math.pow(10, t) : t)))); });
      var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (var d = new Date(x0); d <= new Date(x1); d.setUTCMonth(d.getUTCMonth() + 1, 1)) { var t = d.getTime(); if (t >= x0) s.appendChild(svg("text", { x: X(t), y: H - 8, "text-anchor": "middle", class: "t-sm" }, document.createTextNode(MON[d.getUTCMonth()]))); }
      var order = pts.slice().sort(function (a, b) { return a.y - b.y; });
      order.forEach(function (p, i) {
        var cx = X(Date.parse(p.x + "T00:00:00Z")), cy = Y(logY ? Math.log10(p.y) : p.y), r = 2.4 + clamp((p.z + 2) / 5, 0, 1) * 4.2, c = p.color || col(0);
        var out = Math.abs(p.z) > (o.z || 2.4);
        if (out) s.appendChild(svg("circle", { cx: cx, cy: cy, r: r + 4, fill: "none", stroke: c, "stroke-width": 1.2, "stroke-dasharray": "2 2", "pointer-events": "none" }));
        var k = svg("circle", { cx: cx, cy: cy, r: r, fill: c, "fill-opacity": 0.72, stroke: "var(--surface)", "stroke-width": 0.8 });
        act(k, (p.label || p.id) + ", " + fmt(p.y), o.onClick ? function () { o.onClick(p); } : null, false);
        hover(k, box, tip, W, function () { return { title: p.label || p.id, rows: [{ color: c, value: fmt(p.y), label: ui.date(p.x, "year") }].concat(out ? [{ value: p.z > 0 ? "unusually large" : "unusually small", label: "for this book" }] : []) }; });
        s.appendChild(k);
      });
      box.appendChild(s);
    }, o.label || "Every transaction");
  };

  /* ------------------------------------------------------------- Histogram */
  V.histogram = function (o) {
    var vals = (o.values || []).filter(function (v) { return v > 0; }).sort(function (a, b) { return a - b; });
    if (vals.length < 2) return empty(o.empty);
    var fmt = money(o), log = o.log !== false, bins = o.bins || 14, tv = vals.map(function (v) { return log ? Math.log10(v) : v; }), lo = tv[0], hi = tv[tv.length - 1] || lo + 1;
    if (hi === lo) hi = lo + 1;
    var counts = Array.apply(null, Array(bins)).map(function () { return 0; });
    tv.forEach(function (t) { counts[Math.min(bins - 1, Math.floor((t - lo) / (hi - lo) * bins))]++; });
    var mx = Math.max.apply(null, counts), med = vals[Math.floor(vals.length / 2)], p90 = vals[Math.floor(vals.length * 0.9)];
    return frame(o, o.height || 200, function (box, W, H, tip) {
      var padL = 36, padR = 8, padT = 16, padB = 28, iw = W - padL - padR, ih = H - padT - padB, bw = iw / bins, s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H });
      var val = function (i) { var t = lo + i / bins * (hi - lo); return log ? Math.pow(10, t) : t; };
      counts.forEach(function (c, i) {
        var hh = c / mx * ih, r = svg("rect", { x: padL + i * bw + 1, y: padT + ih - hh, width: bw - 2, height: Math.max(c ? 1.5 : 0, hh), rx: 3, fill: "var(--v1)", "fill-opacity": 0.85 });
        hover(r, box, tip, W, function () { return { title: fmt(val(i)) + " – " + fmt(val(i + 1)), rows: [{ color: "var(--v1)", value: String(c), label: c === 1 ? "entry" : "entries" }] }; });
        s.appendChild(r);
        if (i % Math.max(2, Math.ceil(bins / Math.max(2, Math.floor(iw / 64)))) === 0) s.appendChild(svg("text", { x: padL + i * bw, y: H - 8, class: "t-sm" }, document.createTextNode(fmt(val(i)))));
      });
      [[med, "median"], [p90, "90th"]].forEach(function (m, k) {
        var t = log ? Math.log10(m[0]) : m[0], x = padL + (t - lo) / (hi - lo) * iw;
        s.appendChild(svg("line", { x1: x, x2: x, y1: padT - 4, y2: padT + ih, stroke: "var(--ink)", "stroke-dasharray": "3 3", "stroke-width": 1 }));
        s.appendChild(svg("text", { x: x + 4, y: padT + 6 + k * 12, class: "t-strong t-sm" }, document.createTextNode(m[1] + " " + fmt(m[0]))));
      });
      s.appendChild(svg("text", { x: 0, y: padT + 4, class: "t-sm" }, document.createTextNode(mx)));
      box.appendChild(s);
    }, o.label || "Distribution of sizes");
  };

  /* --------------------------------------------------------------- Gauge */
  V.gauge = function (o) {
    var mn = o.min || 0, mx = o.max != null ? o.max : 1, v = clamp(o.value, mn, mx), f = (v - mn) / ((mx - mn) || 1), fmt = o.fmt || function (x) { return String(Math.round(x * 10) / 10); };
    return frame(o, o.height || 150, function (box, W, H) {
      var R = Math.min(W / 2 - 8, H - 26), cx = W / 2, cy = H - 20, sw = Math.max(10, R * 0.17), s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H });
      var P = function (a, r) { return [cx + r * Math.cos(Math.PI + a * Math.PI), cy + r * Math.sin(Math.PI + a * Math.PI)]; };
      function arcPath(a0, a1) { var A = P(a0, R), B = P(a1, R); return "M" + A + "A" + R + "," + R + " 0 " + (a1 - a0 > 1 ? 1 : 0) + " 1 " + B; }
      s.appendChild(svg("path", { d: arcPath(0, 1), fill: "none", stroke: "var(--sunken)", "stroke-width": sw, "stroke-linecap": "round" }));
      var bands = o.bands || [{ to: 1, color: "var(--v1)" }], from = 0, bc = bands[0].color;
      bands.forEach(function (b) { if (f > from) bc = b.color; from = b.to; if (f <= b.to) bc = b.color; });
      var pick = (bands.filter(function (b) { return f <= b.to; })[0] || bands[bands.length - 1]).color;
      if (f > 0.002) s.appendChild(svg("path", { d: arcPath(0, f), fill: "none", stroke: pick, "stroke-width": sw, "stroke-linecap": "round" }));
      s.appendChild(svg("text", { x: cx, y: cy - R * 0.28, "text-anchor": "middle", class: "t-lg" }, document.createTextNode(o.text || fmt(o.value))));
      if (o.caption) s.appendChild(svg("text", { x: cx, y: cy - R * 0.28 + 18, "text-anchor": "middle" }, document.createTextNode(o.caption)));
      s.appendChild(svg("text", { x: cx - R, y: cy + 14, "text-anchor": "middle", class: "t-sm" }, document.createTextNode(fmt(mn))));
      s.appendChild(svg("text", { x: cx + R, y: cy + 14, "text-anchor": "middle", class: "t-sm" }, document.createTextNode(fmt(mx))));
      box.appendChild(s);
    }, o.label || "Gauge");
  };

  /* --------------------------------------------------------------- Donut */
  V.donut = function (o) {
    var items = (o.items || []).filter(function (i) { return i.value > 0; });
    if (!items.length) return empty(o.empty);
    var fmt = money(o), tot = sum(items, function (i) { return i.value; });
    var chart = frame(o, o.height || 240, function (box, W, H, tip) {
      var R = Math.min(W, H) / 2 - 6, r0 = R * 0.62, cx = W / 2, cy = H / 2, a = 0, s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H });
      var P = function (ang, r) { return [cx + r * Math.sin(ang), cy - r * Math.cos(ang)]; };
      items.forEach(function (it, i) {
        var span = it.value / tot * Math.PI * 2, b = a + span - 0.012, c = it.color || col(i);
        var d = "M" + P(a, R) + "A" + R + "," + R + " 0 " + (span > Math.PI ? 1 : 0) + " 1 " + P(b, R) + "L" + P(b, r0) + "A" + r0 + "," + r0 + " 0 " + (span > Math.PI ? 1 : 0) + " 0 " + P(a, r0) + "Z";
        var p = svg("path", { d: span > 6.27 ? "M" + cx + "," + (cy - R) + "A" + R + "," + R + " 0 1 1 " + (cx - 0.01) + "," + (cy - R) + "L" + (cx - 0.01) + "," + (cy - r0) + "A" + r0 + "," + r0 + " 0 1 0 " + cx + "," + (cy - r0) + "Z" : d, fill: c });
        act(p, it.label + ", " + fmt(it.value), o.onClick ? function () { o.onClick(it); } : null, items.length <= 12);
        hover(p, box, tip, W, function () { return { title: it.label, rows: [{ color: c, value: fmt(it.value), label: pctText(it.value / tot) }] }; },
          function () { box.classList.add("dim"); p.classList.add("on"); }, function () { box.classList.remove("dim"); p.classList.remove("on"); });
        s.appendChild(p); a += span;
      });
      s.appendChild(svg("text", { x: cx, y: cy + 2, "text-anchor": "middle", class: "t-lg", "font-size": 17 }, document.createTextNode(fmt(tot))));
      s.appendChild(svg("text", { x: cx, y: cy + 18, "text-anchor": "middle" }, document.createTextNode(o.center || "total")));
      box.appendChild(s);
    }, o.label || "Composition");
    if (o.legend === false) return chart;
    var wrap = h("div"), legend = h("div", { class: "viz-legend", style: { flexDirection: "column", gap: "3px" } });
    items.slice(0, 10).forEach(function (it, i) {
      legend.appendChild(h("button", { type: "button", style: { justifyContent: "space-between", width: "100%" }, on: { click: function () { if (o.onClick) o.onClick(it); } } },
        h("span", { style: { display: "inline-flex", alignItems: "center", gap: "6px", minWidth: 0 } }, h("i", { style: { background: it.color || col(i) } }), h("span", { class: "ell", style: { maxWidth: "150px" } }, it.label)),
        h("span", { class: "num", style: { color: "var(--ink-3)" } }, pctText(it.value / tot))));
    });
    wrap.appendChild(chart); wrap.appendChild(legend);
    return wrap;
  };

  /* ---------------------------------------------------------------- Chord
     links: [{ a, b, value }] between named nodes; a ring of who is tied to whom. */
  V.chord = function (o) {
    var links = (o.links || []).filter(function (l) { return l.value > 0; });
    if (!links.length) return empty(o.empty);
    var fmt = money(o), names = [], seen = {};
    (o.order || []).concat(links.map(function (l) { return l.a; }), links.map(function (l) { return l.b; })).forEach(function (n) { if (!seen[n]) { seen[n] = 1; names.push(n); } });
    var nodes = names.map(function (n, i) { return { id: n, label: (o.labels && o.labels[n]) || n, i: i, v: 0, links: [] }; }), by = {}; nodes.forEach(function (n) { by[n.id] = n; });
    links.forEach(function (l) { by[l.a].v += l.value; by[l.b].v += l.value; by[l.a].links.push(l); by[l.b].links.push(l); });
    var total = sum(nodes, function (n) { return n.v; });
    return frame(o, o.height || 420, function (box, W, H, tip) {
      var cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - (o.labelPad || 92), s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H }), gap = 0.02, a = 0, k = (Math.PI * 2 - gap * nodes.length) / total;
      var P = function (ang, r) { return [cx + r * Math.sin(ang), cy - r * Math.cos(ang)]; };
      nodes.forEach(function (n) { n.a0 = a; n.a1 = a + n.v * k; a = n.a1 + gap; var cur = n.a0; n.links.sort(function (p, q) { return by[p.a === n.id ? p.b : p.a].i - by[q.a === n.id ? q.b : q.a].i; }); n.links.forEach(function (l) { var t = l.value * k; if (l.a === n.id) { l.a0 = cur; l.a1 = cur + t; } else { l.b0 = cur; l.b1 = cur + t; } cur += t; }); });
      var ribs = [];
      links.forEach(function (l) {
        var A = by[l.a], c = col(A.i);
        var d = "M" + P(l.a0, R) + "A" + R + "," + R + " 0 " + (l.a1 - l.a0 > Math.PI ? 1 : 0) + " 1 " + P(l.a1, R) + "Q" + cx + "," + cy + " " + P(l.b0, R) + "A" + R + "," + R + " 0 " + (l.b1 - l.b0 > Math.PI ? 1 : 0) + " 1 " + P(l.b1, R) + "Q" + cx + "," + cy + " " + P(l.a0, R) + "Z";
        var p = svg("path", { d: d, fill: c, class: "lk" });
        hover(p, box, tip, W, function () { return { title: A.label + " ↔ " + by[l.b].label, rows: [{ color: c, value: fmt(l.value), label: "" }] }; }, function () { box.classList.add("dim"); p.classList.add("on"); }, function () { box.classList.remove("dim"); p.classList.remove("on"); });
        if (o.onClick) act(p, A.label + " and " + by[l.b].label, function () { o.onClick(l); }, false);
        s.appendChild(p); ribs.push({ p: p, l: l });
      });
      nodes.forEach(function (n) {
        var c = col(n.i), r1 = R + 10, d = "M" + P(n.a0, R + 3) + "A" + (R + 3) + "," + (R + 3) + " 0 " + (n.a1 - n.a0 > Math.PI ? 1 : 0) + " 1 " + P(n.a1, R + 3) + "L" + P(n.a1, r1) + "A" + r1 + "," + r1 + " 0 " + (n.a1 - n.a0 > Math.PI ? 1 : 0) + " 0 " + P(n.a0, r1) + "Z";
        var p = svg("path", { d: d, fill: c });
        function rel(on) { ribs.forEach(function (r) { r.p.classList.toggle("on", on && (r.l.a === n.id || r.l.b === n.id)); }); box.classList.toggle("dim", on); }
        hover(p, box, tip, W, function () { return { title: n.label, rows: [{ color: c, value: fmt(n.v), label: pctText(n.v / total * 1) + " of all ties" }] }; }, function () { rel(true); }, function () { rel(false); });
        s.appendChild(p);
        var m = (n.a0 + n.a1) / 2, lp = P(m, r1 + 8), right = Math.sin(m) >= 0;
        if (n.a1 - n.a0 > 0.05) s.appendChild(svg("text", { x: lp[0], y: lp[1] + 4, "text-anchor": right ? "start" : "end", class: "t-strong t-sm" }, document.createTextNode(trunc(n.label, 130, 10))));
      });
      box.appendChild(s);
    }, o.label || "Connections");
  };

  /* --------------------------------------------------------------- Network
     A force-directed map of what is tied to what. Drag a node and its
     neighbours follow; hover to see only its own links.
     nodes: [{ id, label, group?, value, color? }]  links: [{ source, target, value }] */
  V.network = function (o) {
    var nodes = (o.nodes || []).map(function (n, i) { return Object.assign({ x: 0, y: 0, dx: 0, dy: 0, i: i, v: n.value || 1 }, n); }), by = {};
    nodes.forEach(function (n) { by[n.id] = n; });
    var links = (o.links || []).filter(function (l) { return by[l.source] && by[l.target] && l.source !== l.target; }).map(function (l) { return { s: by[l.source], t: by[l.target], v: l.value || 1 }; });
    if (nodes.length < 2 || !links.length) return empty(o.empty);
    var fmt = money(o), groups = []; nodes.forEach(function (n) { if (groups.indexOf(n.group) < 0) groups.push(n.group); });
    var mxv = Math.max.apply(null, nodes.map(function (n) { return n.v; })) || 1, mxl = Math.max.apply(null, links.map(function (l) { return l.v; })) || 1;
    nodes.forEach(function (n) { n.r = 4 + Math.sqrt(n.v / mxv) * 17; n.c = n.color || col(groups.indexOf(n.group)); n.nb = []; });
    links.forEach(function (l) { l.s.nb.push(l.t); l.t.nb.push(l.s); });
    return frame(o, o.height || 460, function (box, W, H, tip) {
      var pad = 24, area = (W - 2 * pad) * (H - 2 * pad), k = Math.sqrt(area / nodes.length) * 0.6, cx = W / 2, cy = H / 2;
      nodes.forEach(function (n, i) { var g = groups.indexOf(n.group), a = g / groups.length * Math.PI * 2 + (i % 7) * 0.31; n.x = cx + Math.cos(a) * Math.min(W, H) * 0.3 + (i % 5) * 3; n.y = cy + Math.sin(a) * Math.min(W, H) * 0.3 + (i % 3) * 3; });
      function step(iters, pinned) {
        var t0 = Math.min(W, H) / 8;
        for (var it = 0; it < iters; it++) {
          var temp = t0 * (1 - it / iters) + 0.5;
          nodes.forEach(function (n) { n.dx = 0; n.dy = 0; });
          for (var a = 0; a < nodes.length; a++) for (var b = a + 1; b < nodes.length; b++) {
            var A = nodes[a], B = nodes[b], dx = A.x - B.x, dy = A.y - B.y, d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2), f = (k * k / d) * (1 + (A.r + B.r) / 60);
            A.dx += dx / d * f; A.dy += dy / d * f; B.dx -= dx / d * f; B.dy -= dy / d * f;
          }
          links.forEach(function (l) {
            var dx = l.s.x - l.t.x, dy = l.s.y - l.t.y, d = Math.sqrt(dx * dx + dy * dy) + 0.01, f = d * d / k * (0.4 + 0.6 * l.v / mxl);
            l.s.dx -= dx / d * f; l.s.dy -= dy / d * f; l.t.dx += dx / d * f; l.t.dy += dy / d * f;
          });
          nodes.forEach(function (n) {
            n.dx += (cx - n.x) * 0.16; n.dy += (cy - n.y) * 0.16;
            if (n === pinned) return;
            var d = Math.sqrt(n.dx * n.dx + n.dy * n.dy) + 0.01, m = Math.min(d, temp);
            n.x = clamp(n.x + n.dx / d * m, pad + n.r, W - pad - n.r); n.y = clamp(n.y + n.dy / d * m, pad + n.r, H - pad - n.r);
          });
        }
      }
      step(300);
      var s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H }), edgeEls = [], nodeEls = [], labelEls = [];
      links.forEach(function (l) { var e = svg("path", { class: "edge", "stroke-width": 0.8 + 3.2 * l.v / mxl }); edgeEls.push(e); s.appendChild(e); });
      nodes.forEach(function (n) {
        var g = svg("g", { class: "mk nd" }), circ = svg("circle", { r: n.r, fill: n.c, "fill-opacity": 0.88, stroke: "var(--surface)", "stroke-width": 1.5 });
        var lb = svg("text", { "text-anchor": "middle", class: "t-strong t-sm", "pointer-events": "none", opacity: n.r > 11 ? 1 : 0 }, document.createTextNode(trunc(n.label, 110, 10)));
        g.appendChild(circ); nodeEls.push(g); labelEls.push(lb);
        g.setAttribute("tabindex", "0"); g.setAttribute("aria-label", n.label + ", " + fmt(n.v));
        function rel(on) {
          box.classList.toggle("dim", on); g.classList.toggle("on", on);
          nodeEls.forEach(function (e, q) { e.classList.toggle("on", on && (q === n.i || n.nb.indexOf(nodes[q]) >= 0)); });
          edgeEls.forEach(function (e, q) { e.classList.toggle("on", on && (links[q].s === n || links[q].t === n)); });
          labelEls.forEach(function (e, q) { e.setAttribute("opacity", on ? (q === n.i || n.nb.indexOf(nodes[q]) >= 0 ? 1 : 0) : (nodes[q].r > 11 ? 1 : 0)); });
        }
        hover(g, box, tip, W, function () { return { title: n.label, rows: [{ color: n.c, value: fmt(n.v), label: n.group || "" }, { value: String(n.nb.length), label: "connections" }] }; }, function () { rel(true); }, function () { rel(false); });
        var drag = null;
        g.addEventListener("pointerdown", function (ev) { drag = { x: ev.clientX, y: ev.clientY, moved: false }; g.setPointerCapture(ev.pointerId); });
        g.addEventListener("pointermove", function (ev) {
          if (!drag) return; var r = box.getBoundingClientRect();
          if (Math.abs(ev.clientX - drag.x) + Math.abs(ev.clientY - drag.y) > 3) drag.moved = true;
          if (!drag.moved) return;
          n.x = clamp(ev.clientX - r.left, pad, W - pad); n.y = clamp(ev.clientY - r.top, pad, H - pad); step(14, n); paint();
        });
        g.addEventListener("pointerup", function () { if (drag && !drag.moved && o.onClick) o.onClick(n); drag = null; });
        g.addEventListener("keydown", function (ev) { if ((ev.key === "Enter" || ev.key === " ") && o.onClick) { ev.preventDefault(); o.onClick(n); } });
        s.appendChild(g);
      });
      labelEls.forEach(function (l) { s.appendChild(l); });
      function paint() {
        links.forEach(function (l, i) { var mx = (l.s.x + l.t.x) / 2, my = (l.s.y + l.t.y) / 2, dx = l.t.x - l.s.x, dy = l.t.y - l.s.y; edgeEls[i].setAttribute("d", "M" + l.s.x + "," + l.s.y + "Q" + (mx - dy * 0.12) + "," + (my + dx * 0.12) + " " + l.t.x + "," + l.t.y); });
        nodes.forEach(function (n, i) { nodeEls[i].setAttribute("transform", "translate(" + n.x + "," + n.y + ")"); labelEls[i].setAttribute("x", n.x); labelEls[i].setAttribute("y", n.y + n.r + 12); });
      }
      paint();
      box.appendChild(s);
    }, o.label || "Network");
  };

  /* ----------------------------------------------------------------- Chain
     The hash chain as what it is: blocks, each one carrying a picture drawn
     from its own hash, linked to the one before. Change one and its picture
     — and everything after — no longer matches. blocks: [{ seq, hash, who,
     label, at, bad? }] */
  V.chain = function (o) {
    var blocks = o.blocks || [];
    if (!blocks.length) return empty(o.empty);
    var who = {}, order = []; blocks.forEach(function (b) { if (who[b.who] == null) { who[b.who] = order.length; order.push(b.who); } });
    var cell = 6, bs = cell * 5 + 12, gap = 22, rowH = bs + 34;
    var per = 1, n = blocks.length;
    return frame(o, 100, function (box, W, H0, tip) {
      per = Math.max(1, Math.floor((W + gap) / (bs + gap))); var rows = Math.ceil(n / per), H = rows * rowH + 6;
      box.style.height = H + "px";
      var s = svg("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H }), fmt = o.fmt || String;
      blocks.forEach(function (b, i) {
        var r = Math.floor(i / per), c = i % per, x = c * (bs + gap), y = r * rowH + 4, bad = !!b.bad, base = bad ? "var(--bad)" : col(who[b.who]);
        if (i) { var pr = Math.floor((i - 1) / per), pc = (i - 1) % per; if (pr === r) s.appendChild(svg("line", { x1: x - gap + 2, x2: x - 2, y1: y + bs / 2, y2: y + bs / 2, stroke: bad ? "var(--bad)" : "var(--ink-4)", "stroke-width": 1.5 })); else s.appendChild(svg("path", { d: "M" + (pc * (bs + gap) + bs) + "," + (pr * rowH + 4 + bs / 2) + "h8v" + (rowH - bs / 2 + 4) + "H" + (x - 8) + "v" + 0 + "h8", fill: "none", stroke: "var(--ink-4)", "stroke-width": 1, "stroke-dasharray": "2 3", opacity: 0.5 })); }
        var g = svg("g", { class: "mk" });
        g.appendChild(svg("rect", { x: x, y: y, width: bs, height: bs, rx: 8, fill: "var(--surface)", stroke: base, "stroke-width": bad ? 2 : 1.4 }));
        var nib = (b.hash || "0000000000000000").slice(0, 15).split("").map(function (ch) { return parseInt(ch, 16) > 7; });
        for (var q = 0; q < 15; q++) { var gx = q % 3, gy = Math.floor(q / 3); if (!nib[q]) continue; [gx, 4 - gx].filter(function (v, k, a) { return a.indexOf(v) === k; }).forEach(function (cx2) { g.appendChild(svg("rect", { x: x + 6 + cx2 * cell, y: y + 6 + gy * cell, width: cell - 1, height: cell - 1, rx: 1.5, fill: base })); }); }
        act(g, "Command " + b.seq, o.onClick ? function () { o.onClick(b); } : null, blocks.length <= 80);
        hover(g, box, tip, W, function () { return { title: "#" + b.seq + (b.label ? " · " + b.label : ""), rows: [{ color: base, value: b.who || "", label: b.at ? ui.time(b.at) : "" }, { value: (b.hash || "").slice(0, 12) + "…", label: "hash" }].concat(bad ? [{ value: "broken", label: "does not match its hash" }] : []) }; });
        s.appendChild(g);
        s.appendChild(svg("text", { x: x + bs / 2, y: y + bs + 13, "text-anchor": "middle", class: "t-sm" }, document.createTextNode(String(b.seq))));
      });
      box.appendChild(s);
    }, o.label || "The hash chain");
  };

  /* ------------------------------------------------------- Small multiples
     items: [{ id, label, values:[…], value, prev?, color? }] — one little chart
     each, on one shared scale if `shared`. */
  V.multiples = function (o) {
    var items = (o.items || []).filter(function (i) { return i.values && i.values.some(Boolean); });
    if (!items.length) return empty(o.empty);
    var fmt = money(o), gmax = Math.max.apply(null, [].concat.apply([], items.map(function (i) { return i.values; })).map(Math.abs)) || 1;
    var grid = h("div", { class: "sm-grid" });
    items.forEach(function (it, k) {
      var vals = it.values, W = 150, H = 38, mx = o.shared ? gmax : Math.max.apply(null, vals.map(Math.abs)) || 1, c = it.color || col(k);
      var pts = vals.map(function (v, j) { return [3 + j / Math.max(1, vals.length - 1) * (W - 6), H - 3 - Math.abs(v) / mx * (H - 8)]; });
      var s = svg("svg", { width: "100%", height: H, viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", "aria-hidden": "true" });
      s.appendChild(svg("path", { d: mono(pts) + "L" + pts[pts.length - 1][0] + "," + (H - 2) + "L" + pts[0][0] + "," + (H - 2) + "Z", fill: c, "fill-opacity": 0.14 }));
      s.appendChild(svg("path", { d: mono(pts), fill: "none", stroke: c, "stroke-width": 1.6, "stroke-linecap": "round", "vector-effect": "non-scaling-stroke" }));
      var hi = vals.indexOf(Math.max.apply(null, vals)); s.appendChild(svg("circle", { cx: pts[hi][0], cy: pts[hi][1], r: 2.4, fill: c }));
      var d = it.prev ? (it.value - it.prev) / Math.abs(it.prev) : null;
      var cellEl = h("button", { type: "button", class: "sm-cell", on: { click: function () { if (o.onClick) o.onClick(it); } }, title: it.label },
        h("div", { class: "n" }, it.label), h("div", { class: "v" }, fmt(it.value != null ? it.value : vals[vals.length - 1])), s,
        d != null && isFinite(d) ? h("div", { class: "d" }, ui.delta(d, { invert: o.invert })) : null);
      grid.appendChild(cellEl);
    });
    return grid;
  };

  /* ---------------------------------------------------------------- Micro
     What fits in a table cell. */
  V.micro = {
    bars: function (values, o) {
      o = o || {}; var mx = Math.max.apply(null, values.map(Math.abs)) || 1, last = values.length - 1;
      return h("span", { class: "micro-bars micro", role: "img", "aria-label": o.label || "Trend" }, values.map(function (v, i) { return h("i", { class: i === last ? "hi" : "", style: { height: Math.max(1, Math.abs(v) / mx * 22) + "px" } }); }));
    },
    spark: function (values, o) { return values.length > 1 ? ui.charts.spark(values, o) : h("span"); }
  };

  V.mono = mono;
})(window);
