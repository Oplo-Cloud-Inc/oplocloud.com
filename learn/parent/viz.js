/* ==========================================================================
   OEdu Family — the charts.

   Every chart on the family view is drawn here, from numbers the server
   computed. Nothing in this file computes a fact about a student; it only
   draws one.

   The rules, because they are what make a chart something a parent can trust
   on a phone at the end of a day:

     one axis, always      two measures get two charts, never two scales
     text stays text       labels wear ink; a coloured mark beside them
                           carries identity
     quiet marks           2px lines, bars no thicker than 24px with 4px
                           rounded data ends, a 2px surface gap between
                           touching fills
     answers back          every chart has a tooltip, a keyboard reading and
                           a table twin
     one colour pair       transferred credit is blue and EHS credit orange,
                           everywhere — the pair the student sees on their own
                           Grades page, validated as colour-blind safe
   ========================================================================== */
window.OPLO_VIZ = (function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] != null) n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }

  function text(parent, x, y, str, cls, anchor) {
    var t = el("text", { x: x, y: y, "class": cls, "text-anchor": anchor || "start" }, parent);
    t.textContent = str;
    return t;
  }

  function div(cls, html) {
    var n = document.createElement("div");
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function pc(x) { return (Math.max(0, Math.min(1, x)) * 100).toFixed(3) + "%"; }

  /* ------------------------------------------------------------- Tooltip
     One for the page, positioned by whoever asks. It never covers the thing
     being pointed at: it sits above the pointer, and below it only when there
     is no room above. */
  var tipNode = null;
  function tipShow(html, x, y) {
    tipNode = tipNode || document.getElementById("tip");
    if (!tipNode) return;
    tipNode.innerHTML = html;
    tipNode.hidden = false;
    var w = tipNode.offsetWidth, h = tipNode.offsetHeight;
    var left = Math.min(window.innerWidth - w - 10, Math.max(10, x - w / 2));
    var top = y - h - 14;
    if (top < 10) top = y + 20;
    tipNode.style.left = left + "px";
    tipNode.style.top = top + "px";
  }
  function tipHide() { if (tipNode) tipNode.hidden = true; }
  function tipAt(node, html) {
    var r = node.getBoundingClientRect();
    tipShow(html, r.left + r.width / 2, r.top);
  }
  function hover(node, html) {
    function at(e) { tipShow(html(), e.clientX, e.clientY); }
    node.addEventListener("pointerenter", at);
    node.addEventListener("pointermove", at);
    node.addEventListener("pointerleave", tipHide);
  }
  function tipHead(t) { return "<div class='tt-head'>" + esc(t) + "</div>"; }
  function tipRow(sw, label, value) {
    return "<div class='tt-row'>" + (sw ? "<i class='sw " + sw + "'></i>" : "") +
      "<span>" + esc(label) + "</span>" + (value != null ? "<b>" + esc(value) + "</b>" : "") + "</div>";
  }
  function tipNote(t) { return t ? "<div class='tt-note'>" + esc(t) + "</div>" : ""; }

  /* A chart drawn at the width it is given, rather than one drawing scaled
     down until its labels are six pixels tall on a phone. */
  function responsive(host, draw) {
    var last = 0;
    function paint() {
      var w = Math.round(host.clientWidth);
      if (!w || Math.abs(w - last) < 4) return;
      last = w;
      host.innerHTML = "";
      draw(w);
    }
    if (typeof ResizeObserver === "function") new ResizeObserver(paint).observe(host);
    else window.addEventListener("resize", paint);
    requestAnimationFrame(paint);
    return host;
  }

  function ticks(lo, hi, n) {
    if (hi <= lo) hi = lo + 1;
    var raw = (hi - lo) / (n || 4);
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var step = mag * 10;
    [1, 2, 2.5, 5, 10].some(function (m) { if (m * mag >= raw) { step = m * mag; return true; } return false; });
    var out = [];
    for (var v = Math.floor(lo / step) * step; v <= Math.ceil(hi / step) * step + step / 2; v += step) {
      out.push(Math.round(v * 1000) / 1000);
    }
    return out;
  }

  function roundedTop(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, h, w / 2));
    return "M" + x + " " + (y + h) + "V" + (y + r) + "Q" + x + " " + y + " " + (x + r) + " " + y +
      "H" + (x + w - r) + "Q" + (x + w) + " " + y + " " + (x + w) + " " + (y + r) + "V" + (y + h) + "Z";
  }

  function legend(items) {
    var n = div("vz-legend");
    items.forEach(function (it) {
      n.appendChild(div("vz-key", "<i class='sw " + it.cls + "'></i><span>" + esc(it.name) + "</span>"));
    });
    return n;
  }

  /* The same numbers as a table, one click away. A chart that cannot be read
     without seeing colour is not finished. */
  function twin(caption, columns, rows) {
    var d = document.createElement("details");
    d.className = "vz-twin";
    var head = "<tr>" + columns.map(function (c) {
      return "<th" + (c.num ? " class='num'" : "") + " scope='col'>" + esc(c.label) + "</th>";
    }).join("") + "</tr>";
    var body = rows.map(function (r) {
      return "<tr>" + r.map(function (v, i) {
        return "<td" + (columns[i] && columns[i].num ? " class='num'" : "") + ">" + esc(v) + "</td>";
      }).join("") + "</tr>";
    }).join("");
    d.innerHTML = "<summary>Show as a table</summary><div class='ftab-wrap'><table class='ftab'>" +
      "<caption class='sr'>" + esc(caption) + "</caption><thead>" + head + "</thead><tbody>" + body +
      "</tbody></table></div>";
    return d;
  }

  /* ---------------------------------------------------------------- Ring
     Parts of one whole, clockwise from twelve. Each part is separated from
     the next by a surface gap, and what is not filled is the track. */
  function ring(o) {
    var size = o.size || 220, sw = o.stroke || 12, c0 = size / 2, r = c0 - sw / 2 - 1;
    var C = 2 * Math.PI * r, total = o.total > 0 ? o.total : 1, GAP = o.gap == null ? 2.5 : o.gap;
    var root = el("svg", { viewBox: "0 0 " + size + " " + size, "class": "vz vz-ring", role: "img",
                           "aria-label": o.label || "" });
    var g = el("g", { transform: "rotate(-90 " + c0 + " " + c0 + ")" }, root);
    var at = 0;
    var parts = (o.segments || []).filter(function (s) { return s.value > 0; });
    parts.forEach(function (s) {
      var len = Math.min(s.value, total) / total * C;
      var dash = Math.max(0.5, len - GAP);
      var arc = el("circle", { cx: c0, cy: c0, r: r, fill: "none", "stroke-width": sw, "class": "vz-arc " + s.cls,
                               "stroke-dasharray": dash + " " + (C - dash), "stroke-dashoffset": -at }, g);
      if (o.interactive !== false) {
        hover(arc, function () { return tipHead(o.title || "") + tipRow(s.cls, s.label, s.text) + tipNote(s.note); });
      }
      at += len;
    });
    var rest = C - at;
    if (rest > GAP * 2) {
      var track = el("circle", { cx: c0, cy: c0, r: r, fill: "none", "stroke-width": sw, "class": "vz-track",
                                 "stroke-dasharray": (rest - GAP) + " " + (C - rest + GAP),
                                 "stroke-dashoffset": -at }, g);
      if (o.rest && o.interactive !== false) {
        hover(track, function () { return tipHead(o.title || "") + tipRow("s-track", o.rest.label, o.rest.text); });
      }
    }
    return root;
  }

  /* ---------------------------------------------------------------- Line
     One series over ordered points, with a crosshair that follows the pointer
     and the arrow keys, reference lines drawn as hairlines, and the last value
     labelled where the line ends. */
  function line(o) {
    var host = div("vz vz-line");
    var pts = o.points || [];
    var fmt = o.format || String;
    var cls = o.cls || "s-one";
    responsive(host, function (W) {
      var H = o.height || Math.round(Math.max(170, Math.min(250, W * 0.4)));
      var pad = { l: 38, r: o.endLabel === false ? 12 : 56, t: 16, b: 30 };
      var vals = pts.map(function (p) { return p.value; }).concat((o.refs || []).map(function (r) { return r.value; }));
      var tk = ticks(o.min != null ? o.min : Math.min.apply(null, vals),
                     o.max != null ? o.max : Math.max.apply(null, vals), o.tickCount || 4);
      var lo = tk[0], hi = tk[tk.length - 1];
      var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b, n = pts.length;
      function X(i) { return pad.l + (n === 1 ? iw / 2 : i * iw / (n - 1)); }
      function Y(v) { return pad.t + (1 - (v - lo) / (hi - lo)) * ih; }

      var svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, "class": "vz-svg",
                            tabindex: 0, role: "img", "aria-label": o.label || "" });
      tk.forEach(function (t) {
        el("line", { x1: pad.l, x2: W - pad.r, y1: Y(t), y2: Y(t), "class": "vz-grid" }, svg);
        text(svg, pad.l - 8, Y(t) + 4, (o.tick || String)(t), "vz-tick", "end");
      });
      (o.refs || []).forEach(function (r) {
        el("line", { x1: pad.l, x2: W - pad.r, y1: Y(r.value), y2: Y(r.value), "class": "vz-ref" }, svg);
        text(svg, pad.l + 6, Y(r.value) - 6, r.label, "vz-reflabel");
      });
      var every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 64))));
      pts.forEach(function (p, i) {
        var lastOk = i === n - 1 && (n - 1) % every >= Math.ceil(every / 2);
        if (i % every !== 0 && !lastOk) return;
        text(svg, X(i), H - 9, p.label, "vz-tick", n === 1 ? "middle" : i === 0 ? "start" : i === n - 1 ? "end" : "middle");
      });

      if (n > 1) {
        var d = pts.map(function (p, i) { return (i ? "L" : "M") + X(i) + " " + Y(p.value); }).join("");
        if (o.area) {
          el("path", { d: d + "L" + X(n - 1) + " " + (pad.t + ih) + "L" + X(0) + " " + (pad.t + ih) + "Z",
                       "class": "vz-wash " + cls }, svg);
        }
        el("path", { d: d, "class": "vz-path " + cls }, svg);
      }
      var cross = el("line", { y1: pad.t, y2: pad.t + ih, "class": "vz-cross", visibility: "hidden" }, svg);
      var dots = pts.map(function (p, i) {
        return el("circle", { cx: X(i), cy: Y(p.value), r: 4, "class": "vz-dot " + cls }, svg);
      });
      if (o.endLabel !== false && n) {
        text(svg, X(n - 1) + 10, Y(pts[n - 1].value) + 4, fmt(pts[n - 1].value), "vz-end");
      }

      var active = -1;
      function show(i, cx, cy) {
        active = i;
        cross.setAttribute("x1", X(i));
        cross.setAttribute("x2", X(i));
        cross.setAttribute("visibility", "visible");
        dots.forEach(function (dd, j) { dd.setAttribute("r", j === i ? 6 : 4); });
        var p = pts[i];
        var html = tipHead(p.detail || p.label) + tipRow(cls, o.series || "Value", fmt(p.value)) + tipNote(p.note);
        if (cx == null) tipAt(dots[i], html); else tipShow(html, cx, cy);
      }
      function clear() {
        active = -1;
        cross.setAttribute("visibility", "hidden");
        dots.forEach(function (dd) { dd.setAttribute("r", 4); });
        tipHide();
      }
      var hit = el("rect", { x: Math.max(0, pad.l - 12), y: 0, width: iw + 24, height: H, fill: "transparent" }, svg);
      hit.addEventListener("pointermove", function (e) {
        var b = svg.getBoundingClientRect();
        var i = n === 1 ? 0 : Math.round((e.clientX - b.left - pad.l) / (iw / (n - 1)));
        show(Math.max(0, Math.min(n - 1, i)), e.clientX, e.clientY);
      });
      hit.addEventListener("pointerleave", clear);
      svg.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") { if (e.key === "Escape") clear(); return; }
        e.preventDefault();
        var step = e.key === "ArrowRight" ? 1 : -1;
        var i = active < 0 ? (step > 0 ? 0 : n - 1) : active + step;
        show(Math.max(0, Math.min(n - 1, i)));
      });
      svg.addEventListener("blur", clear);
      host.appendChild(svg);
    });
    return host;
  }

  /* ------------------------------------------------------------- Columns
     Magnitude from a zero baseline. Stacked parts are split by a surface gap,
     and only the top of a column is rounded — it grows from the baseline, so
     the baseline end stays square. */
  function columns(o) {
    var host = div("vz vz-cols");
    var fmt = o.format || String;
    responsive(host, function (W) {
      var H = o.height || 210, pad = { l: 38, r: 10, t: 24, b: 30 };
      var items = o.items || [];
      var totals = items.map(function (it) {
        return it.segs.reduce(function (a, s) { return a + (s.value > 0 ? s.value : 0); }, 0);
      });
      var tk = ticks(0, Math.max.apply(null, totals.concat([o.floorMax || 1])), 4);
      var hi = tk[tk.length - 1], iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
      var band = iw / Math.max(1, items.length), bw = Math.min(24, band * 0.62);
      function Y(v) { return pad.t + ih - v / hi * ih; }

      var svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, "class": "vz-svg",
                            tabindex: 0, role: "img", "aria-label": o.label || "" });
      tk.forEach(function (t) {
        el("line", { x1: pad.l, x2: W - pad.r, y1: Y(t), y2: Y(t), "class": t === 0 ? "vz-axis" : "vz-grid" }, svg);
        text(svg, pad.l - 8, Y(t) + 4, (o.tick || String)(t), "vz-tick", "end");
      });
      var every = Math.max(1, Math.ceil(items.length / Math.max(1, Math.floor(iw / 44))));
      var hits = [];
      items.forEach(function (it, i) {
        var cx = pad.l + band * i + band / 2, x = cx - bw / 2, acc = 0;
        var live = it.segs.filter(function (s) { return s.value > 0; });
        live.forEach(function (s, k) {
          var y0 = Y(acc), y1 = Y(acc + s.value);
          acc += s.value;
          var top = k === live.length - 1;
          var yTop = y1 + (top ? 0 : 1), yBot = y0 - (k > 0 ? 1 : 0);
          if (yBot - yTop < 0.6) return;
          el("path", { d: top ? roundedTop(x, yTop, bw, yBot - yTop, 4)
                              : "M" + x + " " + yTop + "h" + bw + "V" + yBot + "H" + x + "Z",
                       "class": "vz-bar " + s.cls }, svg);
        });
        if (o.valueLabels !== false && totals[i] > 0 && bw >= 6) {
          text(svg, cx, Y(totals[i]) - 7, fmt(totals[i]), "vz-cap", "middle");
        }
        if (i % every === 0) text(svg, cx, H - 9, it.label, "vz-tick", "middle");
        var hit = el("rect", { x: pad.l + band * i, y: pad.t - 10, width: band, height: ih + 10, fill: "transparent" }, svg);
        var html = function () {
          return tipHead(it.detail || it.label) +
            it.segs.map(function (s) { return tipRow(s.cls, s.name, fmt(s.value || 0)); }).join("") +
            (it.segs.length > 1 ? tipRow(null, "Total", fmt(totals[i])) : "") + tipNote(it.note);
        };
        hover(hit, html);
        hits.push({ node: hit, html: html });
      });
      var active = -1;
      svg.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") { if (e.key === "Escape") tipHide(); return; }
        e.preventDefault();
        active = Math.max(0, Math.min(hits.length - 1, active + (e.key === "ArrowRight" ? 1 : -1)));
        tipAt(hits[active].node, hits[active].html());
      });
      svg.addEventListener("blur", tipHide);
      host.appendChild(svg);
    });
    return host;
  }

  /* ---------------------------------------------------------------- Bars
     Horizontal, in HTML so the labels wrap like text rather than clipping like
     SVG. A row can carry a bed (how far the requirement goes), filled parts,
     and a reference tick — the requirement line, or 65 on an exam. */
  function bars(o) {
    var n = div("vz vz-bars");
    n.setAttribute("role", "list");
    if (o.label) n.setAttribute("aria-label", o.label);
    var scale = o.scale > 0 ? o.scale : 1;
    (o.rows || []).forEach(function (r) {
      var row = div("vz-brow" + (r.cls ? " " + r.cls : ""));
      row.setAttribute("role", "listitem");
      row.appendChild(div("vz-blabel", "<span>" + esc(r.label) + "</span>" +
                                        (r.sub ? "<small>" + esc(r.sub) + "</small>" : "")));
      var track = div("vz-btrack");
      if (r.bed != null) {
        var bed = div("vz-bbed");
        bed.style.width = pc(r.bed / scale);
        track.appendChild(bed);
      }
      var live = (r.segs || []).filter(function (s) { return s.value > 0; }), at = 0;
      live.forEach(function (s, k) {
        var f = div("vz-bfill " + s.cls + (k === live.length - 1 ? " end" : ""));
        f.style.left = pc(at / scale);
        f.style.width = "calc(" + pc(Math.min(s.value, scale - at) / scale) + (k < live.length - 1 ? " - 2px" : "") + ")";
        track.appendChild(f);
        at += s.value;
      });
      if (r.ref != null) {
        var tick = div("vz-bref");
        tick.style.left = pc(r.ref / scale);
        track.appendChild(tick);
      }
      row.appendChild(track);
      row.appendChild(div("vz-bval", r.valueHtml != null ? r.valueHtml : esc(r.value)));
      if (r.tip) {
        row.tabIndex = 0;
        hover(row, function () { return r.tip; });
        row.addEventListener("focus", function () { tipAt(track, r.tip); });
        row.addEventListener("blur", tipHide);
      }
      n.appendChild(row);
    });
    return n;
  }

  /* ----------------------------------------------------------- Sparkline
     The shape of a trend inside a tile, where the numbers live one tap away.
     No hover: a tile is a door, not a chart. */
  function spark(values, o) {
    o = o || {};
    var W = o.width || 260, H = o.height || 46, pad = 5;
    var vals = values.filter(function (v) { return v != null && isFinite(v); });
    var root = el("svg", { viewBox: "0 0 " + W + " " + H, "class": "vz-spark", "aria-hidden": "true",
                           preserveAspectRatio: "none" });
    if (vals.length < 2) return root;
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (hi - lo < 1e-6) { hi += 1; lo -= 1; }
    function X(i) { return pad + i * (W - pad * 2) / (vals.length - 1); }
    function Y(v) { return pad + (1 - (v - lo) / (hi - lo)) * (H - pad * 2); }
    var d = vals.map(function (v, i) { return (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1); }).join("");
    el("path", { d: d + "L" + X(vals.length - 1) + " " + H + "L" + X(0) + " " + H + "Z", "class": "vz-spark-wash" }, root);
    el("path", { d: d, "class": "vz-spark-line", "vector-effect": "non-scaling-stroke" }, root);
    return root;
  }

  return {
    esc: esc, ring: ring, line: line, columns: columns, bars: bars, spark: spark,
    legend: legend, twin: twin, tipShow: tipShow, tipHide: tipHide, tipAt: tipAt, hover: hover,
    tipHead: tipHead, tipRow: tipRow
  };
})();
