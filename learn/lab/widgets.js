/* ==========================================================================
   OEdu Lab — the manipulatives. See lab/core.js.

   Each is a step type the player already knows how to run: it returns
   { el, ready, check, reveal } like any other, so a lesson can say "solve
   this on the balance" exactly as it says "choose one". In a lesson's idea
   card the same piece runs in explore mode — no Check, just a scene to play
   with, and Continue waits (when the lesson asks it to) until the move that
   shows the idea has been made.

     balance     an equation as a balance: x-blocks and unit blocks on two
                 pans. Whatever you do to one side, do to the other.
     numberline  points and rays on a line: values, inequalities, distance
     plane       a coordinate plane: draggable points, sliders under a
                 family of curves, slope triangles, shaded half-planes
     tiles       algebra tiles and area models: multiplying, factoring,
                 completing the square
     machine     a function machine: a number in, a number out
     pattern     growing figures for sequences
     race        runners at different rates, with their distance–time graph
     square      a square's area and its side — square roots
     cube        a cube's volume and its edge — cube roots, in 3D
     units       a chain of conversion factors whose units cancel
     table       a table with cells to fill
     bars        two ways of growing, side by side: adding and multiplying
     trick       think of a number: the same steps with a number and a letter
     evalsteps   order of operations: tap what comes next
     tilemat     algebra tiles for like terms: zero pairs cancel
     rectangle   a rectangle sized with sliders; its perimeter and area live
     tester      two expressions side by side at the same x
     share       division as fitting pieces — and why pieces of size 0 can't

   Every draggable thing is keyboard-operable (Tab to it, arrow keys to move
   it), and every scene says in words what it shows.
   ========================================================================== */
(function () {
  "use strict";
  var LAB = window.OPLO_LAB, CH = window.OPLO_CHALLENGE;
  var el = LAB.el, esc = LAB.esc, button = LAB.button, fmt = LAB.fmt, m = LAB.m, num = LAB.num;
  var NS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------------- Helpers */
  function S(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] != null) n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function svgRoot(w, h, cls) {
    var s = S("svg", { viewBox: "0 0 " + w + " " + h, class: "lw-svg " + (cls || "") });
    s.setAttribute("role", "img");
    return s;
  }
  function svgPt(svg, e) {
    var p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    var mtx = svg.getScreenCTM();
    return mtx ? p.matrixTransform(mtx.inverse()) : { x: 0, y: 0 };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function snapTo(v, step) { return step ? Math.round(v / step) * step : v; }
  function r2(v) { return Math.round(v * 1000) / 1000; }
  /* Drag an SVG element; also move it with the arrow keys once focused. */
  function draggable(svg, handle, o) {
    var active = false;
    handle.setAttribute("tabindex", "0");
    handle.classList.add("lw-drag");
    handle.addEventListener("pointerdown", function (e) {
      if (o.disabled && o.disabled()) return;
      e.preventDefault();
      active = true;
      try { handle.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ }
      handle.classList.add("on");
      if (o.start) o.start();
      o.move(svgPt(svg, e));
    });
    handle.addEventListener("pointermove", function (e) { if (active) o.move(svgPt(svg, e)); });
    function end() { if (!active) return; active = false; handle.classList.remove("on"); if (o.end) o.end(); }
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
    handle.addEventListener("keydown", function (e) {
      if (o.disabled && o.disabled()) return;
      var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
      if (!d || !o.key) return;
      e.preventDefault();
      o.key(d[0], d[1], e.shiftKey);
      if (o.end) o.end();
    });
  }
  function slider(label, o, onInput) {
    var row = el("label", "lw-slider");
    var name = el("span", "lw-sl-name", fmt(label));
    var input = el("input");
    input.type = "range";
    input.min = o.min; input.max = o.max; input.step = o.step || 1; input.value = o.v;
    input.setAttribute("aria-label", String(label).replace(/\$|\\[a-z]+|[{}]/g, ""));
    var val = el("span", "lw-sl-val");
    row.appendChild(name); row.appendChild(input); row.appendChild(val);
    function show() { val.innerHTML = o.show ? fmt(o.show(+input.value)) : m(num(+input.value)); }
    input.addEventListener("input", function () { show(); onInput(+input.value); });
    show();
    return { el: row, input: input, set: function (v) { input.value = v; show(); } };
  }
  function note(cls, html) { return el("div", "lw-note " + (cls || ""), html); }
  /* Text in a drawing, with its letters set as math: 3x, x + 2, x². */
  function mtext(node, str) {
    node.textContent = "";
    String(str).replace(/-/g, "−").split(/([a-zA-Z]+)/).forEach(function (part) {
      if (!part) return;
      var t = document.createElementNS(NS, "tspan");
      if (/^[a-zA-Z]$/.test(part)) t.setAttribute("font-style", "italic");
      t.textContent = part;
      node.appendChild(t);
    });
    return node;
  }
  function done(api) { api.ready = api.ready || function () { return true; }; return api; }

  /* ============================================================= Balance
     spec: { L: {x, c}, R: {x, c}, x: hidden value,
             steps?: how many moves to allow per turn, explore?: bool,
             gate?: "tip" | "solve" }
     Blocks: blue x-blocks, yellow unit blocks. Buttons do the same thing to
     both sides; tapping a single block takes it from one side only, and the
     beam tips — which is the point. */
  CH.addKind("balance", function (spec, seed, mode) {
    var api = {}, X = spec.x;
    var st = { L: { x: spec.L.x || 0, c: spec.L.c || 0 }, R: { x: spec.R.x || 0, c: spec.R.c || 0 } };
    var hist = [], tipped = false, everTipped = false;
    var box = el("div", "lw lw-balance");
    var svg = svgRoot(680, 330);
    svg.setAttribute("viewBox", "0 44 680 286");     // the beam never rises above y = 58
    box.appendChild(svg);
    var eqLine = el("div", "lw-eq");
    box.appendChild(eqLine);
    var tools = el("div", "lw-tools");
    box.appendChild(tools);
    var msg = el("div", "lw-msg");
    box.appendChild(msg);
    var log = el("ol", "lw-log");
    box.appendChild(log);

    // Stand and beam.
    S("path", { d: "M340 312 L318 312 L340 250 L362 312 Z", class: "lw-stand" }, svg);
    S("rect", { x: 250, y: 312, width: 180, height: 8, rx: 4, class: "lw-base" }, svg);
    var beamG = S("g", { class: "lw-beam" }, svg);
    S("rect", { x: 110, y: 104, width: 460, height: 10, rx: 5, class: "lw-bar" }, beamG);
    S("circle", { cx: 340, cy: 109, r: 9, class: "lw-pivot" }, beamG);
    var panL = S("g", {}, svg), panR = S("g", {}, svg);
    function pan(g) {
      g.innerHTML = "";
      S("line", { x1: 0, y1: 0, x2: -86, y2: 118, class: "lw-string" }, g);
      S("line", { x1: 0, y1: 0, x2: 86, y2: 118, class: "lw-string" }, g);
      S("path", { d: "M-100 118 H100 L88 134 H-88 Z", class: "lw-pan" }, g);
      return S("g", {}, g);
    }
    function weight(side) { return side.x * X + side.c; }
    function blocks(g, side, which) {
      // x-blocks on the left of the pan, units stacked beside them.
      var xs = side.x, cs = side.c, cells = [];
      for (var i = 0; i < xs; i++) cells.push("x");
      for (var j = 0; j < cs; j++) cells.push("1");
      var xW = 32, uW = 20, gap = 4, row = 0, rowX = -92, rowH = 0, placed = [];
      cells.forEach(function (k) {
        var w = k === "x" ? xW : uW;
        if (rowX + w > 92) { row++; rowX = -92; }
        placed.push({ k: k, x: rowX, row: row, w: w });
        rowX += w + gap;
      });
      var rows = row + 1;
      placed.forEach(function (p, idx) {
        var h = p.k === "x" ? 32 : 20;
        var y = 116 - (rows - p.row) * 36 + (36 - h) - 2;
        var node = S("g", { class: "lw-blk " + (p.k === "x" ? "lw-bx" : "lw-b1"), transform: "translate(" + p.x + "," + y + ")" }, g);
        S("rect", { width: p.w, height: h, rx: p.k === "x" ? 7 : 4 }, node);
        var t = S("text", { x: p.w / 2, y: h / 2 + (p.k === "x" ? 6 : 4.5), "text-anchor": "middle" }, node);
        t.textContent = p.k === "x" ? "x" : "1";
        if (!mode.explore || spec.tap !== false) {
          node.setAttribute("tabindex", "0");
          node.setAttribute("role", "button");
          node.setAttribute("aria-label", "Take " + (p.k === "x" ? "an x-block" : "a 1-block") + " off the " + which + " side only");
          var take = function () { takeOne(which, p.k); };
          node.addEventListener("click", take);
          node.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); take(); } });
        }
      });
    }
    function eqText() { return LAB.poly([[st.L.x, "x"], [st.L.c, ""]]) + " = " + LAB.poly([[st.R.x, "x"], [st.R.c, ""]]); }
    function solved() {
      var a = st.L, b = st.R;
      return !tipped && ((a.x === 1 && a.c === 0 && b.x === 0) || (b.x === 1 && b.c === 0 && a.x === 0));
    }
    function paint() {
      var wl = weight(st.L), wr = weight(st.R);
      var ang = wl === wr ? 0 : clamp((wr - wl) / Math.max(1, wl + wr) * 40, -12, 12);
      tipped = Math.abs(wl - wr) > 1e-9;
      if (tipped) everTipped = true;
      beamG.setAttribute("transform", "rotate(" + ang + " 340 109)");
      var rad = ang * Math.PI / 180;
      var lx = 340 - 220 * Math.cos(rad), ly = 109 - 220 * Math.sin(rad);
      var rx = 340 + 220 * Math.cos(rad), ry = 109 + 220 * Math.sin(rad);
      panL.setAttribute("transform", "translate(" + lx + "," + ly + ")");
      panR.setAttribute("transform", "translate(" + rx + "," + ry + ")");
      blocks(pan(panL), st.L, "left");
      blocks(pan(panR), st.R, "right");
      box.classList.toggle("tipped", tipped);
      box.classList.toggle("solved", solved());
      eqLine.innerHTML = tipped ? m(LAB.poly([[st.L.x, "x"], [st.L.c, ""]]) + (wl > wr ? " > " : " < ") + LAB.poly([[st.R.x, "x"], [st.R.c, ""]])) +
        '<span class="lw-tag bad">not balanced</span>' : m(eqText()) + (solved() ? '<span class="lw-tag good">solved</span>' : "");
      svg.setAttribute("aria-label", "A balance. Left pan: " + st.L.x + " x-blocks and " + st.L.c + " unit blocks. Right pan: " +
        st.R.x + " x-blocks and " + st.R.c + " unit blocks." + (tipped ? " The balance is tipped." : " The balance is level."));
      paintTools();
      if (api.onChange) api.onChange();
    }
    function paintTools() {
      tools.innerHTML = "";
      if (tipped) {
        var undo = button("lw-btn", "Put it back");
        undo.addEventListener("click", function () { var h = hist.pop(); if (h) { st = h.st; tipped = false; log.lastChild && log.lastChild.remove(); msg.innerHTML = ""; paint(); } });
        tools.appendChild(undo);
        return;
      }
      var ops = [];
      var minC = Math.min(st.L.c, st.R.c), minX = Math.min(st.L.x, st.R.x);
      if (minC > 0) ops.push({ t: "Take " + (minC === 1 ? "1" : minC) + " from each side", f: function () { apply("−" + minC, { L: { x: st.L.x, c: st.L.c - minC }, R: { x: st.R.x, c: st.R.c - minC } }); } });
      if (minC > 1) ops.push({ t: "Take 1 from each side", f: function () { apply("−1", { L: { x: st.L.x, c: st.L.c - 1 }, R: { x: st.R.x, c: st.R.c - 1 } }); } });
      if (minX > 0) ops.push({ t: "Take " + (minX === 1 ? "an x" : minX + " x's") + " from each side", f: function () { apply("−" + (minX === 1 ? "x" : minX + "x"), { L: { x: st.L.x - minX, c: st.L.c }, R: { x: st.R.x - minX, c: st.R.c } }); } });
      var all = [st.L.x, st.L.c, st.R.x, st.R.c].filter(function (v) { return v > 0; });
      for (var k = 2; k <= 12; k++) {
        if (all.length && all.every(function (v) { return v % k === 0; }) && (st.L.x + st.R.x) >= k) {
          (function (k) {
            ops.push({ t: "Split each side into " + k + " equal groups", f: function () { apply("÷" + k, { L: { x: st.L.x / k, c: st.L.c / k }, R: { x: st.R.x / k, c: st.R.c / k } }); } });
          })(k);
        }
      }
      if (spec.add) ops.push({ t: "Add 1 to each side", f: function () { apply("+1", { L: { x: st.L.x, c: st.L.c + 1 }, R: { x: st.R.x, c: st.R.c + 1 } }); } });
      ops.forEach(function (o) {
        var b = button("lw-btn", esc(o.t));
        b.addEventListener("click", o.f);
        tools.appendChild(b);
      });
      if (hist.length) {
        var back = button("lw-btn ghost", "Undo");
        back.addEventListener("click", function () { var h = hist.pop(); if (h) { st = h.st; log.lastChild && log.lastChild.remove(); msg.innerHTML = ""; paint(); } });
        tools.appendChild(back);
      }
    }
    function copy() { return { L: { x: st.L.x, c: st.L.c }, R: { x: st.R.x, c: st.R.c } }; }
    function apply(label, next) {
      hist.push({ st: copy() });
      st = next;
      log.appendChild(el("li", null, '<span class="lw-op">' + esc(label) + "</span>" + m(eqText())));
      msg.innerHTML = solved() ? "<b>x is on its own.</b> " + m("x = " + (st.L.x ? st.R.c : st.L.c)) : "";
      paint();
    }
    function takeOne(side, k) {
      if (tipped) return;
      hist.push({ st: copy() });
      var s = st[side === "left" ? "L" : "R"];
      if (k === "x") s.x--; else s.c--;
      log.appendChild(el("li", "bad", '<span class="lw-op">' + (k === "x" ? "−x" : "−1") + " (" + side + " only)</span>"));
      msg.innerHTML = "<b>It tips.</b> Taking something from one side only changes the weights — the two sides aren't equal any more.";
      paint();
    }
    paint();
    api.el = box;
    api.ready = function () {
      if (mode.explore) {
        var g = spec.gateKind || spec.gate;
        return g === "tip" ? everTipped : g === "solve" ? solved() : g ? hist.length > 0 : true;
      }
      return solved();
    };
    api.check = function () { return { ok: solved(), say: tipped ? "The balance is tipped — put it back and do the same to both sides." : "Keep going until $x$ is alone on one side." }; };
    api.reveal = function () {
      // Undo to the start, then the textbook moves.
      while (hist.length) st = hist.pop().st;
      log.innerHTML = ""; tipped = false; msg.innerHTML = "";
      var guard = 0;
      while (!solved() && guard++ < 10) {
        var mx = Math.min(st.L.x, st.R.x), mc = Math.min(st.L.c, st.R.c);
        if (mx > 0) apply("−" + (mx === 1 ? "x" : mx + "x"), { L: { x: st.L.x - mx, c: st.L.c }, R: { x: st.R.x - mx, c: st.R.c } });
        else if (st.L.x && st.L.c) apply("−" + st.L.c, { L: { x: st.L.x, c: 0 }, R: { x: st.R.x, c: st.R.c - st.L.c } });
        else if (st.R.x && st.R.c) apply("−" + st.R.c, { L: { x: st.L.x, c: st.L.c - st.R.c }, R: { x: st.R.x, c: 0 } });
        else if (st.L.x > 1) apply("÷" + st.L.x, { L: { x: 1, c: 0 }, R: { x: 0, c: st.R.c / st.L.x } });
        else if (st.R.x > 1) apply("÷" + st.R.x, { L: { x: 0, c: st.L.c / st.R.x }, R: { x: 1, c: 0 } });
        else break;
      }
      tools.innerHTML = "";
    };
    return api;
  });

  /* ========================================================== Number line
     spec: { min, max, tick (1), label (every n ticks), points: [{ v, drag,
             label, snap }], ray: { at, dir: "left"|"right", closed, drag },
             seg: { a, b, ca, cb } (a closed/open interval), mode:
             "point" | "ray" | "seg" | "explore", answer, distance: [i, j] } */
  CH.addKind("numberline", function (spec, seed, mode) {
    var api = {}, min = spec.min != null ? spec.min : -10, max = spec.max != null ? spec.max : 10;
    var tick = spec.tick || 1, lab = spec.label || (max - min > 24 ? 5 : max - min > 12 ? 2 : 1), snap = spec.snap || tick;
    var W = 680, H = spec.ray || spec.seg || spec.distance ? 150 : 120, x0 = 40, x1 = W - 40, y = 70;
    function X(v) { return x0 + (v - min) / (max - min) * (x1 - x0); }
    function V(px) { return min + (px - x0) / (x1 - x0) * (max - min); }
    var box = el("div", "lw lw-nl");
    var svg = svgRoot(W, H);
    box.appendChild(svg);
    var read = el("div", "lw-read");
    box.appendChild(read);
    S("line", { x1: x0 - 22, y1: y, x2: x1 + 22, y2: y, class: "lw-axis" }, svg);
    S("path", { d: "M" + (x1 + 26) + " " + y + " l-9 -5 v10 z", class: "lw-arrow" }, svg);
    S("path", { d: "M" + (x0 - 26) + " " + y + " l9 -5 v10 z", class: "lw-arrow" }, svg);
    for (var v = Math.ceil(min / tick) * tick; v <= max + 1e-9; v += tick) {
      var major = Math.abs(Math.round(v / (tick * lab)) * (tick * lab) - v) < 1e-9;
      S("line", { x1: X(v), y1: y - (major ? 8 : 5), x2: X(v), y2: y + (major ? 8 : 5), class: "lw-tick" + (major ? " major" : "") }, svg);
      if (major) { var t = S("text", { x: X(v), y: y + 28, "text-anchor": "middle", class: "lw-tl" + (Math.abs(v) < 1e-9 ? " zero" : "") }, svg); t.textContent = num(v).replace("-", "−"); }
    }
    var shadeG = S("g", {}, svg), distG = S("g", {}, svg), ptG = S("g", {}, svg);
    var pts = (spec.points || []).map(function (p, i) { return { v: p.v, drag: p.drag !== false && (spec.mode !== "explore" || p.drag), label: p.label, color: p.color || "blue", i: i }; });
    var ray = spec.ray ? { at: spec.ray.at, dir: spec.ray.dir || "right", closed: !!spec.ray.closed, drag: spec.ray.drag !== false } : null;
    var seg = spec.seg ? { a: spec.seg.a, b: spec.seg.b, ca: !!spec.seg.ca, cb: !!spec.seg.cb, outside: !!spec.seg.outside } : null;
    var moved = false;

    function paint() {
      shadeG.innerHTML = ""; ptG.innerHTML = ""; distG.innerHTML = "";
      if (ray) {
        var ax = X(ray.at), end = ray.dir === "right" ? x1 + 18 : x0 - 18;
        S("line", { x1: ax, y1: y, x2: end, y2: y, class: "lw-ray" }, shadeG);
        S("path", { d: ray.dir === "right" ? "M" + (end + 8) + " " + y + " l-12 -7 v14 z" : "M" + (end - 8) + " " + y + " l12 -7 v14 z", class: "lw-rayhead" }, shadeG);
        endpoint(ray.at, ray.closed, function (nv) { ray.at = nv; }, function () { ray.closed = !ray.closed; }, ray.drag);
        dirButtons();
      }
      if (seg) {
        if (seg.outside) {
          S("line", { x1: x0 - 18, y1: y, x2: X(seg.a), y2: y, class: "lw-ray" }, shadeG);
          S("line", { x1: X(seg.b), y1: y, x2: x1 + 18, y2: y, class: "lw-ray" }, shadeG);
        } else S("line", { x1: X(seg.a), y1: y, x2: X(seg.b), y2: y, class: "lw-ray" }, shadeG);
        endpoint(seg.a, seg.ca, function (nv) { seg.a = Math.min(nv, seg.b); }, function () { seg.ca = !seg.ca; }, true);
        endpoint(seg.b, seg.cb, function (nv) { seg.b = Math.max(nv, seg.a); }, function () { seg.cb = !seg.cb; }, true);
      }
      pts.forEach(function (p) {
        var g = S("g", { class: "lw-pt c-" + p.color, transform: "translate(" + X(p.v) + "," + y + ")" }, ptG);
        S("circle", { r: 18, class: "lw-hit" }, g);
        S("circle", { r: 9, class: "lw-dot" }, g);
        if (p.label) { var tl = S("text", { y: -22, "text-anchor": "middle", class: "lw-pl" }, g); tl.textContent = p.label; }
        g.setAttribute("aria-label", (p.label ? p.label + " " : "Point ") + "at " + num(p.v));
        if (p.drag) draggable(svg, g, {
          move: function (pt) { p.v = clamp(snapTo(V(pt.x), snap), min, max); moved = true; g.setAttribute("transform", "translate(" + X(p.v) + "," + y + ")"); readout(); paintDist(); if (api.onChange) api.onChange(); },
          key: function (dx) { p.v = clamp(r2(p.v + dx * snap), min, max); moved = true; paint(); },
          end: function () { paint(); }
        });
      });
      paintDist();
      readout();
      if (api.onChange) api.onChange();
    }
    function paintDist() {
      distG.innerHTML = "";
      if (!spec.distance) return;
      var a = pts[spec.distance[0]].v, b = pts[spec.distance[1]].v, lo = Math.min(a, b), hi = Math.max(a, b);
      S("path", { d: "M" + X(lo) + " " + (y + 44) + " v6 H" + X(hi) + " v-6", class: "lw-brace" }, distG);
      var t = S("text", { x: (X(lo) + X(hi)) / 2, y: y + 70, "text-anchor": "middle", class: "lw-dl" }, distG);
      t.textContent = "distance " + num(hi - lo);
    }
    function endpoint(v, closed, set, toggle, drag) {
      var g = S("g", { class: "lw-end" + (closed ? " closed" : ""), transform: "translate(" + X(v) + "," + y + ")" }, ptG);
      S("circle", { r: 20, class: "lw-hit" }, g);
      S("circle", { r: 9, class: "lw-ring" }, g);
      g.setAttribute("aria-label", "Endpoint at " + num(v) + ", " + (closed ? "closed (included)" : "open (not included)") + ". Press Enter to switch.");
      var start = null;
      if (drag) draggable(svg, g, {
        start: function () { start = v; },
        move: function (pt) { var nv = clamp(snapTo(V(pt.x), snap), min, max); set(nv); moved = true; g.setAttribute("transform", "translate(" + X(nv) + "," + y + ")"); },
        key: function (dx) { set(clamp(r2(v + dx * snap), min, max)); moved = true; paint(); },
        end: function () { paint(); }
      });
      g.addEventListener("click", function () { if (start === null || Math.abs((ray ? ray.at : v) - start) < 1e-9) { toggle(); moved = true; paint(); } start = null; });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter") { toggle(); moved = true; paint(); } });
    }
    var dirBox = null;
    function dirButtons() {
      if (!ray || !ray.drag) return;
      if (!dirBox) {
        dirBox = el("div", "lw-dir");
        ["left", "right"].forEach(function (d) {
          var b = button("lw-btn", d === "left" ? "← Shade left" : "Shade right →");
          b.addEventListener("click", function () { ray.dir = d; moved = true; paint(); });
          dirBox.appendChild(b);
        });
        var tg = button("lw-btn ghost", "Open ⟷ closed");
        tg.addEventListener("click", function () { ray.closed = !ray.closed; moved = true; paint(); });
        dirBox.appendChild(tg);
        box.insertBefore(dirBox, read);
      }
      [].forEach.call(dirBox.children, function (b, i) { if (i < 2) b.classList.toggle("on", (i === 0 ? "left" : "right") === ray.dir); });
    }
    function readout() {
      if (spec.readout) { read.innerHTML = fmt(spec.readout(state())); return; }
      if (ray) {
        var op = ray.dir === "right" ? (ray.closed ? "\\ge" : ">") : (ray.closed ? "\\le" : "<");
        read.innerHTML = m((spec.variable || "x") + " " + op + " " + num(ray.at));
      } else if (seg) {
        read.innerHTML = seg.outside ? m("x " + (seg.ca ? "\\le" : "<") + " " + num(seg.a) + "\\text{ or }x " + (seg.cb ? "\\ge" : ">") + " " + num(seg.b))
          : m(num(seg.a) + (seg.ca ? " \\le " : " < ") + "x" + (seg.cb ? " \\le " : " < ") + num(seg.b));
      } else if (pts.length && spec.show !== false) read.innerHTML = pts.map(function (p) { return m((p.label || "x") + " = " + num(p.v)); }).join('<span class="lw-sep"></span>');
    }
    function state() { return { points: pts.map(function (p) { return p.v; }), ray: ray, seg: seg, moved: moved }; }
    paint();
    api.el = box;
    api.state = state;
    api.ready = function () {
      if (spec.goal) return !!spec.goal(state());
      return mode.explore ? (spec.gate ? moved : true) : moved;
    };
    api.check = function () {
      var a = spec.answer, ok = false, say = null;
      if (spec.check) { var r = spec.check(state()); return typeof r === "object" ? r : { ok: !!r }; }
      if (a && ray) {
        ok = Math.abs(ray.at - a.at) < 1e-9 && ray.dir === a.dir && ray.closed === !!a.closed;
        if (!ok) {
          if (Math.abs(ray.at - a.at) > 1e-9) say = "The endpoint is in the wrong place. Where does the boundary number sit?";
          else if (ray.closed !== !!a.closed) say = ray.closed ? "Is " + m("x = " + num(a.at)) + " itself a solution? A filled circle says it is." : "Is " + m("x = " + num(a.at)) + " itself a solution? An open circle says it isn't.";
          else say = "Right endpoint, wrong direction. Try a number on each side and see which one works.";
        }
      } else if (a && seg) {
        ok = Math.abs(seg.a - a.a) < 1e-9 && Math.abs(seg.b - a.b) < 1e-9 && seg.ca === !!a.ca && seg.cb === !!a.cb;
        say = ok ? null : "Check each end: where it is, and whether it's included.";
      } else if (a && a.points) {
        ok = a.points.every(function (v, i) { return Math.abs(pts[i].v - v) < 1e-9; });
      }
      return { ok: ok, say: say };
    };
    api.reveal = function () {
      var a = spec.answer;
      if (!a) return;
      if (ray) { ray.at = a.at; ray.dir = a.dir; ray.closed = !!a.closed; }
      if (seg) { seg.a = a.a; seg.b = a.b; seg.ca = !!a.ca; seg.cb = !!a.cb; }
      if (a.points) a.points.forEach(function (v, i) { pts[i].v = v; });
      moved = true;
      paint();
    };
    return api;
  });

  /* ================================================================ Plane
     spec: { x: [-10, 10], y: [-10, 10], grid: 1,
             params: { m: { v, min, max, step, label } },     sliders
             fns: [{ f: "m*x + b" | function (x, p), color, dashed, label,
                     shade: "above"|"below", strict, domain: [a, b] }],
             points: [{ id, x, y, drag: true|"x"|"y", snap, label, color, coords }],
             lines: [{ through: [id, id], slope: true, color }],
             marks: [{ x, y, label }]   fixed dots
             hline / vline: [values], segs: [[x1,y1,x2,y2]],
             readout: function (state) → text,  goal: function (state) → bool,
             check: function (state) → { ok, say },  answer: { params, points },
             click: "point"  → the answer is a clicked lattice point } */
  CH.addKind("plane", function (spec, seed, mode) {
    var api = {};
    var xr = spec.x || [-10, 10], yr = spec.y || [-10, 10];
    var W = 560, H = Math.round(W * (spec.aspect || (yr[1] - yr[0]) / (xr[1] - xr[0]))), pad = 26;
    if (H > 560) H = 560;
    function X(v) { return pad + (v - xr[0]) / (xr[1] - xr[0]) * (W - 2 * pad); }
    function Y(v) { return H - pad - (v - yr[0]) / (yr[1] - yr[0]) * (H - 2 * pad); }
    function VX(px) { return xr[0] + (px - pad) / (W - 2 * pad) * (xr[1] - xr[0]); }
    function VY(py) { return yr[0] + (H - pad - py) / (H - 2 * pad) * (yr[1] - yr[0]); }
    var box = el("div", "lw lw-plane");
    var stageRow = el("div", "lw-plane-row");
    var svg = svgRoot(W, H);
    stageRow.appendChild(svg);
    box.appendChild(stageRow);
    var side = el("div", "lw-side");
    var read = el("div", "lw-read");
    var sliders = el("div", "lw-sliders");
    box.appendChild(read);
    box.appendChild(sliders);

    var P = {};
    Object.keys(spec.params || {}).forEach(function (k) { P[k] = spec.params[k].v; });
    var pts = (spec.points || []).map(function (p, i) {
      return { id: p.id || String.fromCharCode(65 + i), x: p.x, y: p.y, drag: p.drag, snap: p.snap != null ? p.snap : (spec.snap || 1),
               label: p.label, color: p.color || "blue", coords: p.coords !== false, hidden: p.hidden };
    });
    var clicked = null, moved = false;
    function pt(id) { return pts.filter(function (p) { return p.id === id; })[0]; }
    var fnC = (spec.fns || []).map(function (f) {
      if (typeof f.f === "function") return f.f;
      var tree = LAB.parse(f.f);
      return function (x, p) { var env = Object.assign({ x: x }, p); return LAB.evalTree(tree, env); };
    });

    // Static layers: grid, axes.
    var gridG = S("g", { class: "lw-grid" }, svg);
    var gstep = spec.grid || 1, lstep = spec.labelEvery || (xr[1] - xr[0] > 24 ? 5 : xr[1] - xr[0] > 12 ? 2 : 1);
    for (var gx = Math.ceil(xr[0] / gstep) * gstep; gx <= xr[1] + 1e-9; gx += gstep) S("line", { x1: X(gx), y1: Y(yr[0]), x2: X(gx), y2: Y(yr[1]), class: Math.abs(gx) < 1e-9 ? "" : "g" }, gridG);
    for (var gy = Math.ceil(yr[0] / gstep) * gstep; gy <= yr[1] + 1e-9; gy += gstep) S("line", { x1: X(xr[0]), y1: Y(gy), x2: X(xr[1]), y2: Y(gy), class: Math.abs(gy) < 1e-9 ? "" : "g" }, gridG);
    var axG = S("g", { class: "lw-axes" }, svg);
    if (yr[0] <= 0 && yr[1] >= 0) S("line", { x1: X(xr[0]) - 8, y1: Y(0), x2: X(xr[1]) + 10, y2: Y(0) }, axG);
    if (xr[0] <= 0 && xr[1] >= 0) S("line", { x1: X(0), y1: Y(yr[0]) + 8, x2: X(0), y2: Y(yr[1]) - 10 }, axG);
    var lblG = S("g", { class: "lw-axl" }, svg);
    var lsy = spec.labelEveryY || (yr[1] - yr[0] > 24 ? 5 : yr[1] - yr[0] > 12 ? 2 : 1);
    for (var lx = Math.ceil(xr[0] / lstep) * lstep; lx <= xr[1]; lx += lstep) {
      if (Math.abs(lx) < 1e-9) continue;
      var tx = S("text", { x: X(lx), y: clamp(Y(0) + 17, 14, H - 6), "text-anchor": "middle" }, lblG); tx.textContent = num(lx).replace("-", "−");
    }
    for (var ly = Math.ceil(yr[0] / lsy) * lsy; ly <= yr[1]; ly += lsy) {
      if (Math.abs(ly) < 1e-9) continue;
      var ty = S("text", { x: clamp(X(0) - 8, 16, W - 4), y: Y(ly) + 4, "text-anchor": "end" }, lblG); ty.textContent = num(ly).replace("-", "−");
    }
    if (spec.axisLabels) {
      var ax1 = S("text", { x: X(xr[1]) + 4, y: Y(0) - 8, "text-anchor": "end", class: "lw-axname" }, lblG); ax1.textContent = spec.axisLabels[0];
      var ax2 = S("text", { x: X(0) + 8, y: Y(yr[1]) + 6, class: "lw-axname" }, lblG); ax2.textContent = spec.axisLabels[1];
    }
    var shadeG = S("g", {}, svg), curveG = S("g", {}, svg), lineG = S("g", {}, svg), markG = S("g", {}, svg), ptG = S("g", {}, svg);
    var clip = "lwc" + Math.random().toString(36).slice(2, 8);
    var defs = S("defs", {}, svg);
    var cp = S("clipPath", { id: clip }, defs);
    S("rect", { x: X(xr[0]), y: Y(yr[1]), width: X(xr[1]) - X(xr[0]), height: Y(yr[0]) - Y(yr[1]) }, cp);
    [shadeG, curveG, lineG].forEach(function (g) { g.setAttribute("clip-path", "url(#" + clip + ")"); });

    function pathFor(fn, dom) {
      var d = "", pen = false, n = 480, a = dom ? Math.max(dom[0], xr[0]) : xr[0], b = dom ? Math.min(dom[1], xr[1]) : xr[1];
      var prevY = null;
      for (var i = 0; i <= n; i++) {
        var x = a + (b - a) * i / n, yv = fn(x, P);
        if (!isFinite(yv) || (prevY != null && Math.abs(yv - prevY) > (yr[1] - yr[0]) * 2)) { pen = false; prevY = isFinite(yv) ? yv : null; continue; }
        var yy = clamp(Y(yv), -2000, 2000);
        d += (pen ? "L" : "M") + X(x).toFixed(2) + " " + yy.toFixed(2);
        pen = true; prevY = yv;
      }
      return d;
    }
    function paint() {
      shadeG.innerHTML = ""; curveG.innerHTML = ""; lineG.innerHTML = ""; markG.innerHTML = ""; ptG.innerHTML = "";
      (spec.fns || []).forEach(function (f, i) {
        if (f.hidden && f.hidden(P)) return;
        var fn = fnC[i];
        var d = pathFor(fn, f.domain);
        if (f.shade) {
          var edge = f.shade === "above" ? Y(yr[1]) - 20 : Y(yr[0]) + 20;
          var n = 200, poly = "";
          for (var k = 0; k <= n; k++) { var x = xr[0] + (xr[1] - xr[0]) * k / n, yv = fn(x, P); poly += (k ? "L" : "M") + X(x).toFixed(1) + " " + clamp(Y(yv), -2000, 2000).toFixed(1); }
          poly += "L" + X(xr[1]) + " " + edge + "L" + X(xr[0]) + " " + edge + "Z";
          S("path", { d: poly, class: "lw-shade c-" + (f.color || "blue") }, shadeG);
        }
        S("path", { d: d, class: "lw-curve c-" + (f.color || "blue") + (f.dashed || f.strict ? " dashed" : "") }, curveG);
        if (f.label) {
          var lxv = f.labelAt != null ? f.labelAt : xr[1] - (xr[1] - xr[0]) * 0.12, lyv = fn(lxv, P);
          if (isFinite(lyv) && lyv > yr[0] && lyv < yr[1]) {
            var t = S("text", { x: X(lxv), y: Y(lyv) - 10, class: "lw-fl c-" + (f.color || "blue"), "text-anchor": "middle" }, markG);
            t.textContent = typeof f.label === "function" ? f.label(P) : f.label;
          }
        }
      });
      (spec.hline || []).forEach(function (v) { S("line", { x1: X(xr[0]), y1: Y(v), x2: X(xr[1]), y2: Y(v), class: "lw-curve c-red" }, lineG); });
      (spec.vline || []).forEach(function (v) { S("line", { x1: X(v), y1: Y(yr[0]), x2: X(v), y2: Y(yr[1]), class: "lw-curve c-red" }, lineG); });
      (spec.segs || []).forEach(function (s2) { S("line", { x1: X(s2[0]), y1: Y(s2[1]), x2: X(s2[2]), y2: Y(s2[3]), class: "lw-curve c-" + (s2[4] || "blue") }, lineG); });
      (spec.lines || []).forEach(function (ln) {
        var a = pt(ln.through[0]), b = pt(ln.through[1]);
        if (!a || !b) return;
        if (a.x === b.x && a.y === b.y) return;
        var x1, y1, x2, y2;
        if (Math.abs(a.x - b.x) < 1e-9) { x1 = x2 = a.x; y1 = yr[0] - 50; y2 = yr[1] + 50; }
        else { var sl = (b.y - a.y) / (b.x - a.x); x1 = xr[0] - 50; x2 = xr[1] + 50; y1 = a.y + sl * (x1 - a.x); y2 = a.y + sl * (x2 - a.x); }
        if (ln.extend !== false) S("line", { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2), class: "lw-curve c-" + (ln.color || "blue") }, lineG);
        else S("line", { x1: X(a.x), y1: Y(a.y), x2: X(b.x), y2: Y(b.y), class: "lw-curve c-" + (ln.color || "blue") }, lineG);
        if (ln.slope && Math.abs(a.x - b.x) > 1e-9) {
          var run = b.x - a.x, rise = b.y - a.y;
          S("path", { d: "M" + X(a.x) + " " + Y(a.y) + " H" + X(b.x) + " V" + Y(b.y), class: "lw-tri" }, markG);
          var rt = S("text", { x: (X(a.x) + X(b.x)) / 2, y: Y(a.y) + (rise >= 0 ? 18 : -9), "text-anchor": "middle", class: "lw-run" }, markG);
          rt.textContent = "run " + num(run).replace("-", "−");
          var rs = S("text", { x: X(b.x) + (run >= 0 ? 8 : -8), y: (Y(a.y) + Y(b.y)) / 2 + 4, "text-anchor": run >= 0 ? "start" : "end", class: "lw-rise" }, markG);
          rs.textContent = "rise " + num(rise).replace("-", "−");
        }
      });
      (spec.marks || []).forEach(function (mk) {
        var yv = typeof mk.y === "function" ? mk.y(P) : mk.y, xv = typeof mk.x === "function" ? mk.x(P) : mk.x;
        if (!isFinite(xv) || !isFinite(yv)) return;
        var g = S("g", { class: "lw-mark c-" + (mk.color || "ink"), transform: "translate(" + X(xv) + "," + Y(yv) + ")" }, markG);
        S("circle", { r: mk.r || 5 }, g);
        if (mk.label) { var tl = S("text", { x: 9, y: -9, class: "lw-pl" }, g); tl.textContent = typeof mk.label === "function" ? mk.label(P) : mk.label; }
      });
      pts.forEach(function (p) {
        if (p.hidden) return;
        var g = S("g", { class: "lw-pt c-" + p.color, transform: "translate(" + X(p.x) + "," + Y(p.y) + ")" }, ptG);
        S("circle", { r: 20, class: "lw-hit" }, g);
        S("circle", { r: p.drag ? 8.5 : 6, class: "lw-dot" }, g);
        if (p.label || p.coords) {
          var tl = S("text", { x: 12, y: -12, class: "lw-pl" }, g);
          tl.textContent = (p.label ? p.label + " " : "") + (p.coords ? "(" + num(p.x).replace("-", "−") + ", " + num(p.y).replace("-", "−") + ")" : "");
        }
        g.setAttribute("aria-label", (p.label || "Point") + " at (" + num(p.x) + ", " + num(p.y) + ")");
        if (p.drag && !(mode.explore && spec.lock)) {
          draggable(svg, g, {
            move: function (q) {
              if (p.drag !== "y") p.x = clamp(snapTo(VX(q.x), p.snap), xr[0], xr[1]);
              if (p.drag !== "x") p.y = clamp(snapTo(VY(q.y), p.snap), yr[0], yr[1]);
              moved = true;
              paint();
            },
            key: function (dx, dy) {
              if (p.drag !== "y") p.x = clamp(r2(p.x + dx * (p.snap || 1)), xr[0], xr[1]);
              if (p.drag !== "x") p.y = clamp(r2(p.y + dy * (p.snap || 1)), yr[0], yr[1]);
              moved = true; paint();
              var again = ptG.querySelector('[aria-label^="' + (p.label || "Point") + '"]'); if (again) again.focus();
            }
          });
        }
      });
      if (clicked) {
        var cg = S("g", { class: "lw-pt c-orange", transform: "translate(" + X(clicked[0]) + "," + Y(clicked[1]) + ")" }, ptG);
        S("circle", { r: 8.5, class: "lw-dot" }, cg);
        var ct = S("text", { x: 12, y: -12, class: "lw-pl" }, cg); ct.textContent = "(" + num(clicked[0]).replace("-", "−") + ", " + num(clicked[1]).replace("-", "−") + ")";
      }
      var st = state();
      read.innerHTML = spec.readout ? fmt(spec.readout(st)) : "";
      read.hidden = !spec.readout;
      svg.setAttribute("aria-label", spec.describe ? spec.describe(st) : "A coordinate plane." + pts.map(function (p) { return " Point " + (p.label || p.id) + " at (" + num(p.x) + ", " + num(p.y) + ")."; }).join(""));
      if (api.onChange) api.onChange();
    }
    if (spec.click) {
      svg.classList.add("clickable");
      svg.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest(".lw-drag")) return;
        var q = svgPt(svg, e), s2 = spec.clickSnap || 1;
        clicked = [clamp(snapTo(VX(q.x), s2), xr[0], xr[1]), clamp(snapTo(VY(q.y), s2), yr[0], yr[1])];
        moved = true;
        paint();
      });
    }
    var sl = {};
    Object.keys(spec.params || {}).forEach(function (k) {
      var o = spec.params[k];
      if (o.fixed) return;
      sl[k] = slider(o.label || "$" + k + "$", o, function (v) { P[k] = v; moved = true; paint(); });
      sliders.appendChild(sl[k].el);
    });
    sliders.hidden = !Object.keys(sl).length;
    function state() {
      var o = { params: Object.assign({}, P), points: {}, clicked: clicked, moved: moved };
      pts.forEach(function (p) { o.points[p.id] = { x: p.x, y: p.y }; });
      o.pt = function (id) { return o.points[id]; };
      return o;
    }
    paint();
    api.el = box;
    api.state = state;
    api.ready = function () {
      if (spec.goal) return !!spec.goal(state());
      if (mode.explore) return spec.gate ? moved : true;
      if (spec.click) return !!clicked;
      return moved;
    };
    api.check = function () {
      var st = state();
      if (spec.check) { var r = spec.check(st); return typeof r === "object" ? r : { ok: !!r }; }
      if (spec.click && spec.answer) {
        var a = spec.answer.point, ok = clicked && Math.abs(clicked[0] - a[0]) < 1e-6 && Math.abs(clicked[1] - a[1]) < 1e-6;
        return { ok: !!ok, say: ok ? null : spec.clickFb ? spec.clickFb(clicked) : null };
      }
      if (spec.goal) return { ok: !!spec.goal(st), say: spec.fb ? spec.fb(st) : null };
      return { ok: true };
    };
    api.reveal = function () {
      var a = spec.answer || {};
      if (a.params) Object.keys(a.params).forEach(function (k) { P[k] = a.params[k]; if (sl[k]) sl[k].set(a.params[k]); });
      if (a.points) Object.keys(a.points).forEach(function (id) { var p = pt(id); if (p) { p.x = a.points[id][0]; p.y = a.points[id][1]; } });
      if (a.point) clicked = a.point.slice();
      moved = true;
      pts.forEach(function (p) { p.drag = false; });
      paint();
    };
    return api;
  });

  /* ================================================================ Tiles
     Algebra tiles. spec: { mode: "factor" | "multiply" | "square" | "area",
       factor:   target { b, c } for x² + bx + c; the student sets p and q in
                 (x + p)(x + q) and the rectangle fills itself
       multiply: p, q given; the rectangle is shown and counted
       square:   b; x² + bx arranged as a square missing its corner
       area:     rows [..], cols [..] labels; a generic area model } */
  CH.addKind("tiles", function (spec, seed, mode) {
    var api = {};
    var box = el("div", "lw lw-tiles");
    var stage = el("div", "lw-tiles-stage");
    box.appendChild(stage);
    var ctl = el("div", "lw-tiles-ctl");
    box.appendChild(ctl);
    var read = el("div", "lw-read");
    box.appendChild(read);
    var p = spec.p != null ? spec.p : 1, q = spec.q != null ? spec.q : 1, fill = 0, moved = false;
    var U = 24, XL = 92;           // a unit's side and x's side, in px (x is "some length")

    function rectSvg(pv, qv, target) {
      // (x + p) wide, (x + q) tall.
      var neg = pv < 0 || qv < 0;
      var w = XL + Math.abs(pv) * U, h = XL + Math.abs(qv) * U;
      var svg = svgRoot(w + 70, h + 60, "lw-rect");
      var g = S("g", { transform: "translate(52,36)" }, svg);
      // dimension labels
      var top = S("text", { x: w / 2, y: -14, "text-anchor": "middle", class: "lw-dim" }, g);
      mtext(top, "x " + (pv < 0 ? "− " + Math.abs(pv) : "+ " + pv));
      var lf = S("text", { x: -12, y: h / 2 + 5, "text-anchor": "end", class: "lw-dim" }, g);
      mtext(lf, "x " + (qv < 0 ? "− " + Math.abs(qv) : "+ " + qv));
      S("rect", { x: 0, y: 0, width: XL, height: XL, rx: 5, class: "lw-t2" }, g);
      label(g, XL / 2, XL / 2, "x²");
      for (var i = 0; i < Math.abs(pv); i++) { S("rect", { x: XL + i * U, y: 0, width: U, height: XL, rx: 4, class: pv < 0 ? "lw-tx neg" : "lw-tx" }, g); label(g, XL + i * U + U / 2, XL / 2, pv < 0 ? "−x" : "x", true); }
      for (var j = 0; j < Math.abs(qv); j++) { S("rect", { x: 0, y: XL + j * U, width: XL, height: U, rx: 4, class: qv < 0 ? "lw-tx neg" : "lw-tx" }, g); label(g, XL / 2, XL + j * U + U / 2, qv < 0 ? "−x" : "x", true); }
      for (i = 0; i < Math.abs(pv); i++) for (j = 0; j < Math.abs(qv); j++) {
        var negU = (pv < 0) !== (qv < 0);
        S("rect", { x: XL + i * U, y: XL + j * U, width: U, height: U, rx: 3, class: negU ? "lw-t1 neg" : "lw-t1" }, g);
      }
      S("rect", { x: -1, y: -1, width: w + 2, height: h + 2, rx: 6, class: "lw-frame" }, g);
      return svg;
    }
    function label(g, x, y, t, small) {
      var n = S("text", { x: x, y: y + (small ? 4 : 6), "text-anchor": "middle", class: small ? "lw-tl2 s" : "lw-tl2" }, g);
      n.textContent = t;
    }
    function stepper(name, get, set) {
      var row = el("div", "lw-step");
      row.appendChild(el("span", "lw-step-n", fmt(name)));
      var minus = button("lw-sbtn", "−"), plus = button("lw-sbtn", "+"), val = el("span", "lw-step-v");
      minus.setAttribute("aria-label", "Decrease"); plus.setAttribute("aria-label", "Increase");
      function show() { val.innerHTML = m(String(get())); }
      minus.addEventListener("click", function () { set(get() - 1); moved = true; show(); paint(); });
      plus.addEventListener("click", function () { set(get() + 1); moved = true; show(); paint(); });
      row.appendChild(minus); row.appendChild(val); row.appendChild(plus);
      show();
      return row;
    }
    function paint() {
      stage.innerHTML = "";
      if (spec.mode === "square") {
        var b = spec.b, half = b / 2, w = XL + half * U;
        var svg = svgRoot(w + 70, w + 60, "lw-rect");
        var g = S("g", { transform: "translate(52,36)" }, svg);
        S("rect", { x: 0, y: 0, width: XL, height: XL, rx: 5, class: "lw-t2" }, g); label(g, XL / 2, XL / 2, "x²");
        for (var i = 0; i < half; i++) { S("rect", { x: XL + i * U, y: 0, width: U, height: XL, rx: 4, class: "lw-tx" }, g); label(g, XL + i * U + U / 2, XL / 2, "x", true); }
        for (var j = 0; j < half; j++) { S("rect", { x: 0, y: XL + j * U, width: XL, height: U, rx: 4, class: "lw-tx" }, g); label(g, XL / 2, XL + j * U + U / 2, "x", true); }
        var shown = 0;
        for (i = 0; i < half; i++) for (j = 0; j < half; j++) {
          var on = shown < fill;
          S("rect", { x: XL + i * U, y: XL + j * U, width: U, height: U, rx: 3, class: on ? "lw-t1" : "lw-t1 ghost" }, g);
          shown++;
        }
        var tt = S("text", { x: w / 2, y: -14, "text-anchor": "middle", class: "lw-dim" }, g); mtext(tt, "x + " + num(half));
        var tl = S("text", { x: -12, y: w / 2 + 5, "text-anchor": "end", class: "lw-dim" }, g); mtext(tl, "x + " + num(half));
        stage.appendChild(svg);
        read.innerHTML = fmt("$x^2 + " + b + "x" + (fill ? " + " + fill : "") + "$" + (fill === half * half ? " $= (x + " + num(half) + ")^2$ — a complete square." : " — the corner is missing " + (half * half - fill) + " unit" + (half * half - fill === 1 ? "" : "s") + "."));
      } else if (spec.mode === "area") {
        stage.appendChild(areaModel());
      } else {
        stage.appendChild(rectSvg(p, q));
        var x2 = 1, xs = p + q, cs = p * q;
        var t = spec.target;
        var parts = [];
        if (t) {
          parts.push('<span class="' + (xs === t.b ? "ok" : "") + '">' + m("x") + "-tiles: " + xs + " of " + t.b + "</span>");
          parts.push('<span class="' + (cs === t.c ? "ok" : "") + '">units: ' + cs + " of " + t.c + "</span>");
          read.innerHTML = m("(x " + LAB.signed(p) + ")(x " + LAB.signed(q) + ") = " + LAB.poly([[1, "x^2"], [xs, "x"], [cs, ""]])) + '<div class="lw-counts">' + parts.join("") + "</div>";
        } else read.innerHTML = m("(x " + LAB.signed(p) + ")(x " + LAB.signed(q) + ") = x^2 " + (xs ? LAB.signed(xs) + "x " : "") + (cs ? LAB.signed(cs) : ""));
      }
      box.classList.toggle("solved", api.ready ? api.ready() : false);
      if (api.onChange) api.onChange();
    }
    function areaModel() {
      var rows = spec.rows, cols = spec.cols, cw = spec.cw || cols.map(function () { return 120; }), rh = spec.rh || rows.map(function () { return 80; });
      var W2 = cw.reduce(function (a, b) { return a + b; }, 0), H2 = rh.reduce(function (a, b) { return a + b; }, 0);
      var svg = svgRoot(W2 + 80, H2 + 60, "lw-rect");
      var g = S("g", { transform: "translate(70,40)" }, svg);
      var x = 0;
      cols.forEach(function (c, i) { var t = S("text", { x: x + cw[i] / 2, y: -14, "text-anchor": "middle", class: "lw-dim" }, g); mtext(t, c); x += cw[i]; });
      var y = 0;
      rows.forEach(function (r, j) {
        var t = S("text", { x: -12, y: y + rh[j] / 2 + 5, "text-anchor": "end", class: "lw-dim" }, g); mtext(t, r);
        var x2 = 0;
        cols.forEach(function (c, i) {
          S("rect", { x: x2, y: y, width: cw[i], height: rh[j], class: "lw-acell c" + ((i + j) % 4), rx: 3 }, g);
          var cell = spec.cells && spec.cells[j] && spec.cells[j][i];
          if (cell != null && (spec.reveal || fill)) { var ct = S("text", { x: x2 + cw[i] / 2, y: y + rh[j] / 2 + 6, "text-anchor": "middle", class: "lw-cellt" }, g); mtext(ct, cell); }
          x2 += cw[i];
        });
        y += rh[j];
      });
      S("rect", { x: -1, y: -1, width: W2 + 2, height: H2 + 2, rx: 4, class: "lw-frame" }, g);
      read.innerHTML = spec.readout && (spec.reveal || fill) ? fmt(spec.readout) : "";
      return svg;
    }
    if (spec.mode === "factor" || (spec.mode === "multiply" && spec.adjust)) {
      ctl.appendChild(stepper(spec.pLabel || "$p$", function () { return p; }, function (v) { p = clamp(v, spec.min != null ? spec.min : -9, 9); }));
      ctl.appendChild(stepper(spec.qLabel || "$q$", function () { return q; }, function (v) { q = clamp(v, spec.min != null ? spec.min : -9, 9); }));
    }
    if (spec.mode === "square") {
      var fb = button("lw-btn", "Add a unit to the corner");
      fb.addEventListener("click", function () { if (fill < (spec.b / 2) * (spec.b / 2)) { fill++; moved = true; paint(); } });
      ctl.appendChild(fb);
      var fr = button("lw-btn ghost", "Start again");
      fr.addEventListener("click", function () { fill = 0; paint(); });
      ctl.appendChild(fr);
    }
    if (spec.mode === "area" && !spec.reveal) {
      var rv = button("lw-btn", "Fill in the areas");
      rv.addEventListener("click", function () { fill = 1; moved = true; paint(); rv.remove(); });
      ctl.appendChild(rv);
    }
    api.el = box;
    api.ready = function () {
      if (spec.mode === "factor") return mode.explore && !spec.gate ? true : !!(spec.target && p + q === spec.target.b && p * q === spec.target.c);
      if (spec.mode === "square") return mode.explore && !spec.gate ? true : fill === (spec.b / 2) * (spec.b / 2);
      return mode.explore ? (spec.gate ? moved : true) : moved;
    };
    api.check = function () {
      var t = spec.target, ok = api.ready();
      var say = null;
      if (!ok && t) say = p + q !== t.b ? "The x-tiles don't match yet: you have " + (p + q) + ", you need " + t.b + "." : "The x-tiles match — now the unit tiles: you have " + p * q + ", you need " + t.c + ".";
      return { ok: ok, say: say };
    };
    api.reveal = function () { if (spec.answer) { p = spec.answer[0]; q = spec.answer[1]; } if (spec.mode === "square") fill = (spec.b / 2) * (spec.b / 2); moved = true; ctl.innerHTML = ""; paint(); };
    paint();
    return api;
  });

  /* ============================================================== Machine
     spec: { rule: "2x + 1", hidden: true, inputs: [1, 2, 3, 5],
             name: "f", free: true (any input by slider) } */
  CH.addKind("machine", function (spec, seed, mode) {
    var api = {}, fn = LAB.compile(spec.rule), rows = [], busy = false;
    var box = el("div", "lw lw-machine");
    var stage = el("div", "lw-mach");
    stage.innerHTML = '<div class="lw-min"><span>in</span><b class="lw-mv">?</b></div>' +
      '<div class="lw-mbox"><span class="lw-mname">' + fmt(spec.name ? "$" + spec.name + "$" : "machine") + '</span><b class="lw-mrule">' +
      (spec.hidden ? "?" : fmt("$" + (spec.show || spec.rule) + "$")) + '</b><i class="lw-gear"></i></div>' +
      '<div class="lw-mout"><span>out</span><b class="lw-mo">?</b></div>';
    box.appendChild(stage);
    var ins = el("div", "lw-mins");
    box.appendChild(ins);
    var table = el("table", "lw-table");
    var v = spec.v || "x";
    table.innerHTML = "<thead><tr><th>" + fmt("$" + v + "$") + "</th><th>" + (spec.name ? (spec.name.length > 1 ? esc(spec.name) : fmt("$" + spec.name + "(" + v + ")$")) : "out") + "</th></tr></thead><tbody></tbody>";
    box.appendChild(table);
    function feed(v) {
      if (busy) return;
      busy = true;
      stage.querySelector(".lw-mv").innerHTML = m(num(v));
      stage.classList.remove("run"); void stage.offsetWidth; stage.classList.add("run");
      setTimeout(function () {
        var out = fn({ x: v });
        stage.querySelector(".lw-mo").innerHTML = m(isFinite(out) ? num(out) : "\\text{undefined}");
        if (!rows.some(function (r) { return r[0] === v; })) {
          rows.push([v, out]);
          var tr = el("tr", "new", "<td>" + m(num(v)) + "</td><td>" + m(isFinite(out) ? num(out) : "—") + "</td>");
          table.querySelector("tbody").appendChild(tr);
        }
        busy = false;
        if (api.onChange) api.onChange();
      }, 520);
    }
    (spec.inputs || [1, 2, 3, 4]).forEach(function (v) {
      var b = button("lw-btn", m(num(v)));
      b.setAttribute("aria-label", "Put " + v + " in");
      b.addEventListener("click", function () { feed(v); });
      ins.appendChild(b);
    });
    api.el = box;
    api.ready = function () { return rows.length >= (spec.need || (mode.explore ? (spec.gate ? 3 : 0) : 1)); };
    api.check = function () { return { ok: true }; };
    api.reveal = function () { (spec.inputs || []).forEach(function (v, i) { setTimeout(function () { feed(v); }, i * 600); }); };
    return api;
  });

  /* ============================================================== Pattern
     spec: { a: first count, d: add each step | r: multiply each step,
             n: figure shown, max, shape: "squares" } */
  CH.addKind("pattern", function (spec, seed, mode) {
    var api = {}, n = spec.n || 3, moved = false, maxN = spec.max || 6;
    function count(k) { return spec.r ? spec.a * Math.pow(spec.r, k - 1) : spec.a + spec.d * (k - 1); }
    var box = el("div", "lw lw-pattern");
    var stage = el("div", "lw-pat");
    box.appendChild(stage);
    var ctl = el("div", "lw-sliders");
    box.appendChild(ctl);
    var table = el("div", "lw-pat-t");
    box.appendChild(table);
    var s = slider(spec.label || "Figure $n$", { min: 1, max: maxN, step: 1, v: n }, function (v) { n = v; moved = true; paint(); });
    ctl.appendChild(s.el);
    function paint() {
      stage.innerHTML = "";
      var shownFigs = spec.all === false ? [n] : Array.from({ length: n }, function (_, i) { return i + 1; });
      shownFigs.forEach(function (k) {
        var fig = el("div", "lw-fig");
        var c = count(k), prev = k > 1 ? count(k - 1) : 0;
        var grid = el("div", "lw-fig-g");
        var cols = spec.r ? Math.ceil(Math.sqrt(c)) : Math.max(1, spec.cols || Math.ceil(c / Math.max(1, Math.round(Math.sqrt(c)))));
        grid.style.gridTemplateColumns = "repeat(" + Math.min(cols, 12) + ", var(--cell))";
        var shownCells = Math.min(c, 144);
        for (var i = 0; i < shownCells; i++) grid.appendChild(el("i", i >= prev && k > 1 ? "new" : ""));
        fig.appendChild(grid);
        fig.appendChild(el("span", "lw-fig-n", "Figure " + k + (c > 144 ? " · " + c : "")));
        stage.appendChild(fig);
      });
      var cells = "";
      for (var k = 1; k <= maxN; k++) cells += '<span class="' + (k <= n ? "on" : "") + '"><b>' + k + "</b><i>" + (k <= n ? num(count(k)) : "?") + "</i></span>";
      table.innerHTML = '<span class="lw-pat-h"><b>n</b><i>blocks</i></span>' + cells;
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? n >= (spec.gateN || maxN) : true) : moved; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () {};
    return api;
  });

  /* ================================================================= Race
     spec: { runners: [{ name, rate, start, color }], t: time max, unit,
             timeUnit, len: track length, graph: true } */
  CH.addKind("race", function (spec, seed, mode) {
    var api = {}, t = 0, T = spec.t || 10, moved = false, timer = null;
    var len = spec.len || Math.max.apply(null, spec.runners.map(function (r) { return (r.start || 0) + r.rate * T; }));
    var box = el("div", "lw lw-race");
    var row = el("div", "lw-race-row");
    var svg = svgRoot(400, 60 + spec.runners.length * 54, "lw-track");
    var gsvg = spec.graph === false ? null : svgRoot(260, 220, "lw-rgraph");
    row.appendChild(svg);
    if (gsvg) row.appendChild(gsvg);
    box.appendChild(row);
    var ctl = el("div", "lw-sliders");
    box.appendChild(ctl);
    var read = el("div", "lw-read");
    box.appendChild(read);
    var play = button("lw-btn", "▶ Play");
    play.addEventListener("click", function () {
      if (timer) { stop(); return; }
      if (t >= T) t = 0;
      play.textContent = "❚❚ Pause";
      timer = setInterval(function () { t = Math.min(T, r2(t + T / 120)); s.set(t); moved = true; paint(); if (t >= T) stop(); }, 30);
    });
    function stop() { clearInterval(timer); timer = null; play.textContent = "▶ Play"; }
    var s = slider("time $t$", { min: 0, max: T, step: T / 100, v: 0, show: function (v) { return "$" + num(Math.round(v * 10) / 10) + "$ " + (spec.timeUnit || ""); } }, function (v) { stop(); t = v; moved = true; paint(); });
    ctl.appendChild(s.el);
    ctl.appendChild(play);
    function pos(r, tt) { return (r.start || 0) + r.rate * tt; }
    function paint() {
      svg.innerHTML = "";
      spec.runners.forEach(function (r, i) {
        var yy = 30 + i * 54;
        S("rect", { x: 16, y: yy, width: 368, height: 34, rx: 17, class: "lw-lane c-" + (r.color || "blue") }, svg);
        var d = clamp(pos(r, t), 0, len), px = 30 + d / len * 340;
        var g = S("g", { class: "lw-runner c-" + (r.color || "blue"), transform: "translate(" + px + "," + (yy + 17) + ")" }, svg);
        S("circle", { r: 13 }, g);
        var nm = S("text", { y: 5, "text-anchor": "middle" }, g); nm.textContent = r.name[0];
      });
      if (gsvg) {
        gsvg.innerHTML = "";
        var gx = function (v) { return 34 + v / T * 212; }, gy = function (v) { return 196 - v / len * 180; };
        S("line", { x1: 34, y1: 196, x2: 250, y2: 196, class: "lw-gax" }, gsvg);
        S("line", { x1: 34, y1: 196, x2: 34, y2: 10, class: "lw-gax" }, gsvg);
        var xl = S("text", { x: 250, y: 214, "text-anchor": "end", class: "lw-glab" }, gsvg); xl.textContent = "time";
        var yl = S("text", { x: 8, y: 14, class: "lw-glab" }, gsvg); yl.textContent = spec.unit || "distance";
        spec.runners.forEach(function (r) {
          S("line", { x1: gx(0), y1: gy(pos(r, 0)), x2: gx(T), y2: gy(pos(r, T)), class: "lw-gline c-" + (r.color || "blue") }, gsvg);
          S("circle", { cx: gx(t), cy: gy(pos(r, t)), r: 4.5, class: "lw-gdot c-" + (r.color || "blue") }, gsvg);
        });
        S("line", { x1: gx(t), y1: 196, x2: gx(t), y2: 10, class: "lw-gcur" }, gsvg);
      }
      read.innerHTML = spec.runners.map(function (r) {
        return '<span class="lw-rr c-' + (r.color || "blue") + '"><i></i>' + esc(r.name) + ": " + m(num(Math.round(pos(r, t) * 100) / 100)) + " " + esc(spec.unit || "") + "</span>";
      }).join("");
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? t >= T - 1e-9 : true) : moved; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () {};
    api.destroy = stop;
    return api;
  });

  /* ======================================================= Square & cube
     spec: { side, max, target: area or volume } */
  CH.addKind("square", function (spec, seed, mode) {
    var api = {}, sd = spec.side || 1, moved = false, maxS = spec.max || 10;
    var box = el("div", "lw lw-square");
    var stage = el("div", "lw-sq-stage");
    box.appendChild(stage);
    var ctl = el("div", "lw-sliders");
    box.appendChild(ctl);
    var read = el("div", "lw-read");
    box.appendChild(read);
    var s = slider("side", { min: spec.min || 1, max: maxS, step: spec.step || 1, v: sd }, function (v) { sd = v; moved = true; paint(); });
    ctl.appendChild(s.el);
    function paint() {
      var cell = Math.min(34, 300 / maxS);
      stage.innerHTML = "";
      var g = el("div", "lw-sq");
      g.style.setProperty("--c", cell + "px");
      var whole = Math.floor(sd + 1e-9);
      g.style.width = g.style.height = (sd * cell) + "px";
      g.style.backgroundSize = cell + "px " + cell + "px";
      stage.appendChild(g);
      var area = r2(sd * sd);
      var hit = spec.target != null && Math.abs(area - spec.target) < 1e-9;
      read.innerHTML = m("\\text{side } " + num(sd) + " \\;\\to\\; \\text{area } " + num(sd) + "^2 = " + num(area)) +
        (spec.target != null ? (hit ? '<span class="lw-tag good">area ' + spec.target + "</span>" : '<span class="lw-tag">target area ' + spec.target + "</span>") : "");
      box.classList.toggle("solved", hit);
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return spec.target != null ? Math.abs(sd * sd - spec.target) < 1e-9 : mode.explore ? (spec.gate ? moved : true) : moved; };
    api.check = function () { return { ok: api.ready() }; };
    api.reveal = function () { if (spec.target != null) { sd = Math.sqrt(spec.target); s.set(sd); paint(); } };
    return api;
  });
  CH.addKind("cube", function (spec, seed, mode) {
    var api = {}, sd = spec.side || 2, moved = false, rx = -24, ry = 38, maxS = spec.max || 6;
    var box = el("div", "lw lw-cube");
    var scene = el("div", "lw-cube-scene");
    var cube = el("div", "lw-cube-c");
    scene.appendChild(cube);
    box.appendChild(scene);
    var ctl = el("div", "lw-sliders");
    box.appendChild(ctl);
    var read = el("div", "lw-read");
    box.appendChild(read);
    var s = slider("edge", { min: 1, max: maxS, step: 1, v: sd }, function (v) { sd = v; moved = true; paint(); });
    ctl.appendChild(s.el);
    ["front", "back", "left", "right", "top", "bottom"].forEach(function (f) { cube.appendChild(el("div", "lw-face " + f)); });
    // Turn it with a drag, or the arrow keys.
    var drag = null;
    scene.tabIndex = 0;
    scene.setAttribute("aria-label", "A cube. Drag, or use the arrow keys, to turn it.");
    scene.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY, rx: rx, ry: ry }; try { scene.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ } });
    scene.addEventListener("pointermove", function (e) { if (!drag) return; ry = drag.ry + (e.clientX - drag.x) * 0.5; rx = clamp(drag.rx - (e.clientY - drag.y) * 0.5, -80, 80); turn(); });
    scene.addEventListener("pointerup", function () { drag = null; });
    scene.addEventListener("keydown", function (e) {
      var d = { ArrowLeft: [0, -8], ArrowRight: [0, 8], ArrowUp: [8, 0], ArrowDown: [-8, 0] }[e.key];
      if (!d) return; e.preventDefault(); rx = clamp(rx + d[0], -80, 80); ry += d[1]; turn();
    });
    function turn() { cube.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg)"; }
    function paint() {
      var size = 170, cell = size / sd;
      cube.style.setProperty("--s", size + "px");
      cube.style.setProperty("--cell", cell + "px");
      turn();
      var vol = sd * sd * sd;
      var hit = spec.target != null && vol === spec.target;
      read.innerHTML = m("\\text{edge } " + sd + " \\;\\to\\; \\text{volume } " + sd + "^3 = " + vol) +
        (spec.target != null ? '<span class="lw-tag' + (hit ? " good" : "") + '">target volume ' + spec.target + "</span>" : "");
      box.classList.toggle("solved", hit);
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return spec.target != null ? sd * sd * sd === spec.target : mode.explore ? (spec.gate ? moved : true) : moved; };
    api.check = function () { return { ok: api.ready() }; };
    api.reveal = function () { if (spec.target != null) { sd = Math.round(Math.cbrt(spec.target)); s.set(sd); paint(); } };
    return api;
  });

  /* ================================================================ Units
     Dimensional analysis. spec: { start: [value, "num unit", "den unit"],
       target: ["num unit", "den unit"], factors: [[a, "ua", b, "ub"], …] }
     A factor is a fraction worth 1 (a ua = b ub); it can be flipped. */
  CH.addKind("units", function (spec, seed, mode) {
    var api = {}, chain = [], moved = false;
    var box = el("div", "lw lw-units");
    var row = el("div", "lw-chain");
    box.appendChild(row);
    var tray = el("div", "lw-utray");
    box.appendChild(el("p", "lw-hint", "Tap a conversion to add it. Tap ⇅ to flip it."));
    box.appendChild(tray);
    var read = el("div", "lw-read");
    box.appendChild(read);
    var facs = spec.factors.map(function (f, i) { return { a: f[0], ua: f[1], b: f[2], ub: f[3], flip: false, i: i }; });
    function fracHtml(n, un, d, ud, cancel) {
      return '<span class="lw-uf"><span class="lw-un">' + m(num(n)) + ' <span class="lw-u' + (cancel.n ? " x" : "") + '">' + esc(un) + "</span></span>" +
        '<span class="lw-ud">' + m(num(d)) + ' <span class="lw-u' + (cancel.d ? " x" : "") + '">' + esc(ud) + "</span></span></span>";
    }
    function units() {
      // Count units top and bottom.
      var top = {}, bot = {};
      function add(o, u) { if (!u) return; o[u] = (o[u] || 0) + 1; }
      add(top, spec.start[1]); add(bot, spec.start[2]);
      chain.forEach(function (f) { add(top, f.flip ? f.ub : f.ua); add(bot, f.flip ? f.ua : f.ub); });
      var left = { top: {}, bot: {} };
      Object.keys(top).forEach(function (u) { var k = top[u] - (bot[u] || 0); if (k > 0) left.top[u] = k; });
      Object.keys(bot).forEach(function (u) { var k = bot[u] - (top[u] || 0); if (k > 0) left.bot[u] = k; });
      return left;
    }
    function value() {
      var v = spec.start[0];
      chain.forEach(function (f) { v *= f.flip ? f.b / f.a : f.a / f.b; });
      return v;
    }
    function paint() {
      var left = units();
      function cancelled(u, where) { return !(where === "n" ? left.top[u] : left.bot[u]); }
      row.innerHTML = "";
      row.appendChild(el("span", "lw-uitem", spec.start[2] ? fracHtml(spec.start[0], spec.start[1], 1, spec.start[2], { n: cancelled(spec.start[1], "n"), d: cancelled(spec.start[2], "d") }).replace('<span class="lw-ud">' + m("1") + " ", '<span class="lw-ud">') :
        '<span class="lw-uf solo">' + m(num(spec.start[0])) + ' <span class="lw-u' + (cancelled(spec.start[1], "n") ? " x" : "") + '">' + esc(spec.start[1]) + "</span></span>"));
      chain.forEach(function (f, i) {
        row.appendChild(el("span", "lw-times", "×"));
        var n1 = f.flip ? f.b : f.a, u1 = f.flip ? f.ub : f.ua, d1 = f.flip ? f.a : f.b, u2 = f.flip ? f.ua : f.ub;
        var item = el("span", "lw-uitem in", fracHtml(n1, u1, d1, u2, { n: cancelled(u1, "n"), d: cancelled(u2, "d") }));
        var flip = button("lw-flip", "⇅"); flip.setAttribute("aria-label", "Flip this factor");
        flip.addEventListener("click", function () { f.flip = !f.flip; moved = true; paint(); });
        var rm = button("lw-rm", "×"); rm.setAttribute("aria-label", "Remove this factor");
        rm.addEventListener("click", function () { chain.splice(i, 1); tray.appendChild(tile(f)); moved = true; paint(); });
        item.appendChild(flip); item.appendChild(rm);
        row.appendChild(item);
      });
      var tops = Object.keys(left.top), bots = Object.keys(left.bot);
      var unitText = (tops.join("·") || "1") + (bots.length ? " / " + bots.join("·") : "");
      row.appendChild(el("span", "lw-times", "="));
      row.appendChild(el("span", "lw-uresult", m(num(Math.round(value() * 1e4) / 1e4)) + " " + esc(unitText)));
      var done = tops.length === 1 && tops[0] === spec.target[0] && (spec.target[1] ? bots.length === 1 && bots[0] === spec.target[1] : !bots.length);
      box.classList.toggle("solved", done);
      read.innerHTML = done ? '<span class="lw-tag good">in ' + esc(spec.target[0] + (spec.target[1] ? " per " + spec.target[1] : "")) + "</span>" :
        '<span class="lw-tag">aim for ' + esc(spec.target[0] + (spec.target[1] ? " per " + spec.target[1] : "")) + "</span>";
      if (api.onChange) api.onChange();
      return done;
    }
    function tile(f) {
      var b = button("lw-utile", fracHtml(f.a, f.ua, f.b, f.ub, {}));
      b.addEventListener("click", function () { chain.push(f); b.remove(); moved = true; paint(); });
      return b;
    }
    facs.forEach(function (f) { tray.appendChild(tile(f)); });
    paint();
    api.el = box;
    api.value = value;
    api.ready = function () { return mode.explore ? (spec.gate ? box.classList.contains("solved") : true) : box.classList.contains("solved"); };
    api.check = function () { return { ok: box.classList.contains("solved") }; };
    api.reveal = function () {
      if (!spec.answer) return;
      chain = spec.answer.map(function (a) { var f = facs[a[0]]; f.flip = !!a[1]; return f; });
      tray.innerHTML = "";
      paint();
    };
    return api;
  });

  /* ================================================================ Table
     spec: { head: ["$x$", "$y$"], rows: [[1, 5], [2, null], …], answers: [[r, c, value]] } */
  CH.addKind("table", function (spec, seed, mode) {
    var api = {}, inputs = [];
    var box = el("div", "lw lw-tablew");
    var t = el("table", "lw-table big");
    var th = "<thead><tr>" + spec.head.map(function (h) { return "<th>" + fmt(h) + "</th>"; }).join("") + "</tr></thead>";
    t.innerHTML = th + "<tbody></tbody>";
    var tb = t.querySelector("tbody");
    spec.rows.forEach(function (r, i) {
      var tr = el("tr");
      r.forEach(function (c, j) {
        var td = el("td");
        if (c == null) {
          var inp = el("input", "lw-cell");
          inp.type = "text"; inp.inputMode = "decimal"; inp.autocomplete = "off";
          inp.setAttribute("aria-label", "Row " + (i + 1) + ", " + String(spec.head[j]).replace(/\$|\\[a-z]+|[{}]/g, ""));
          inp.addEventListener("input", function () { inp.classList.remove("no"); if (api.onChange) api.onChange(); });
          inputs.push({ el: inp, r: i, c: j });
          td.appendChild(inp);
        } else td.innerHTML = m(typeof c === "number" ? num(c) : String(c));
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    box.appendChild(t);
    function want(i, j) { var a = (spec.answers || []).filter(function (x) { return x[0] === i && x[1] === j; })[0]; return a ? a[2] : null; }
    api.el = box;
    api.ready = function () { return inputs.every(function (x) { return isFinite(CH.readNum(x.el.value)); }); };
    api.check = function () {
      var bad = 0;
      inputs.forEach(function (x) {
        var ok = Math.abs(CH.readNum(x.el.value) - want(x.r, x.c)) < 1e-6;
        x.el.classList.toggle("no", !ok); x.el.classList.toggle("yes", ok);
        if (!ok) bad++;
      });
      if (!bad) inputs.forEach(function (x) { x.el.disabled = true; });
      return { ok: !bad, say: bad ? (bad === 1 ? "One cell is off — it's marked." : bad + " cells are off — they're marked.") : null };
    };
    api.reveal = function () { inputs.forEach(function (x) { x.el.value = num(want(x.r, x.c)); x.el.disabled = true; x.el.classList.remove("no"); x.el.classList.add("yes"); }); };
    api.focus = function () { if (inputs[0]) inputs[0].el.focus(); };
    return api;
  });

  /* ================================================================= Bars
     Two ways of growing, step by step. spec: { series: [{ name, f: "3 + 2n",
     color }], n: steps, max } */
  CH.addKind("bars", function (spec, seed, mode) {
    var api = {}, n = spec.start || 1, moved = false, N = spec.n || 8;
    var fns = spec.series.map(function (s) { return LAB.compile(s.f); });
    var box = el("div", "lw lw-bars");
    var stage = el("div", "lw-bars-stage");
    box.appendChild(stage);
    var ctl = el("div", "lw-sliders");
    box.appendChild(ctl);
    var s = slider(spec.label || "step $n$", { min: 0, max: N, step: 1, v: n }, function (v) { n = v; moved = true; paint(); });
    ctl.appendChild(s.el);
    function paint() {
      var mx = spec.max || Math.max.apply(null, spec.series.map(function (x, i) { return fns[i]({ n: N }); }));
      stage.innerHTML = "";
      spec.series.forEach(function (sr, i) {
        var col = el("div", "lw-bcol");
        var chart = el("div", "lw-bchart");
        for (var k = 0; k <= N; k++) {
          var v = fns[i]({ n: k });
          var b = el("i", "c-" + (sr.color || "blue") + (k <= n ? " on" : ""));
          b.style.height = Math.max(2, Math.min(100, v / mx * 100)) + "%";
          b.title = "n = " + k + ": " + num(v);
          chart.appendChild(b);
        }
        col.appendChild(chart);
        col.appendChild(el("div", "lw-bname", '<span class="c-' + (sr.color || "blue") + '"><i></i>' + fmt(sr.name) + "</span><b>" + m(num(fns[i]({ n: n }))) + "</b>"));
        stage.appendChild(col);
      });
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? n >= N : true) : moved; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () {};
    return api;
  });


  /* ================================================================ Trick
     Think of a number. spec: { steps: [{ t: "Double it", e: "2n" }, …],
     min, max, v }  — each step's value for your number, and, when you ask,
     the same steps written with a letter and drawn as tiles. */
  CH.addKind("trick", function (spec, seed, mode) {
    var api = {}, n = spec.v || 7, tried = {}, shown = false;
    tried[n] = true;
    var fns = spec.steps.map(function (s) { return LAB.compile(s.e); });
    var box = el("div", "lw lw-trick");
    var ctl = el("div", "lw-sliders");
    var s = slider("your number", { min: spec.min || 1, max: spec.max || 20, step: 1, v: n }, function (v) { n = v; tried[v] = true; paint(); });
    ctl.appendChild(s.el);
    box.appendChild(ctl);
    var list = el("ol", "lw-tsteps");
    box.appendChild(list);
    var tog = button("lw-btn", "Show it with a letter");
    tog.addEventListener("click", function () { shown = !shown; tog.textContent = shown ? "Hide the letter" : "Show it with a letter"; paint(); });
    var row = el("div", "lw-tools");
    row.appendChild(tog);
    box.appendChild(row);
    function linParts(f) {                 // a·n + b, read off two points
      var b = f({ n: 0 }), a = f({ n: 1 }) - b;
      return { a: Math.round(a * 1000) / 1000, b: Math.round(b * 1000) / 1000 };
    }
    function tilesFor(f) {
      var p = linParts(f), h = "";
      if (p.a % 1 || p.b % 1 || p.a < 0 || p.b < 0 || p.a > 6 || p.b > 12) return "";
      for (var i = 0; i < p.a; i++) h += '<i class="tn">n</i>';
      for (var j = 0; j < p.b; j++) h += '<i class="t1"></i>';
      return '<span class="lw-ttiles">' + h + "</span>";
    }
    function paint() {
      list.innerHTML = "";
      spec.steps.forEach(function (st, i) {
        var v = fns[i]({ n: n });
        var li = el("li", "lw-tstep" + (i === spec.steps.length - 1 ? " last" : ""));
        li.innerHTML = '<span class="lw-tn">' + (i + 1) + '</span><span class="lw-tt">' + fmt(st.t) + "</span>" +
          '<b class="lw-tv">' + m(num(v)) + "</b>" +
          (shown ? '<span class="lw-te">' + m(st.e.replace(/\*/g, "")) + tilesFor(fns[i]) + "</span>" : "");
        list.appendChild(li);
      });
      box.classList.toggle("shown", shown);
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? Object.keys(tried).length >= 3 && shown : true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () {};
    return api;
  });

  /* ============================================================ Evalsteps
     Order of operations, one tap at a time. spec: { stages: [[seg, …], …] }
     where a seg is { t: tex, go: true } (the operation that comes next),
     { t: tex, op: true, fb } (an operation that doesn't come next yet), or
     { t: tex } (just text), and { t, now: true } marks a freshly worked
     value. Tap the operation you'd do next; the last stage is the answer. */
  CH.addKind("evalsteps", function (spec, seed, mode) {
    var api = {}, k = 0, misses = 0;
    var box = el("div", "lw lw-evs");
    var stage = el("div", "lw-evs-line");
    box.appendChild(stage);
    var msg = el("div", "lw-msg");
    box.appendChild(msg);
    var trail = el("ol", "lw-evs-trail");
    box.appendChild(trail);
    function paint() {
      stage.innerHTML = "";
      var segs = spec.stages[k];
      segs.forEach(function (sg) {
        if (sg.go || sg.op) {
          var b = button("lw-evs-op" + (k === spec.stages.length - 1 ? " done" : ""), m(sg.t));
          b.addEventListener("click", function () {
            if (sg.go) {
              trail.appendChild(el("li", null, m(spec.stages[k].map(function (x) { return x.t; }).join(" "))));
              k++; msg.innerHTML = ""; msg.className = "lw-msg";
              paint();
            } else {
              misses++;
              b.classList.remove("bad"); void b.offsetWidth; b.classList.add("bad");
              msg.className = "lw-msg bad";
              msg.innerHTML = fmt(sg.fb || "Not yet — something else comes first.");
            }
          });
          stage.appendChild(b);
        } else stage.appendChild(el("span", "lw-evs-t" + (sg.now ? " now" : ""), m(sg.t)));
      });
      var finished = k === spec.stages.length - 1;
      box.classList.toggle("solved", finished);
      if (finished) { msg.className = "lw-msg good"; msg.innerHTML = spec.done ? fmt(spec.done) : "Done — that's the value."; }
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return k === spec.stages.length - 1; };
    api.check = function () { return { ok: api.ready(), helped: misses > 0 }; };
    api.reveal = function () { k = spec.stages.length - 1; paint(); };
    api.misses = function () { return misses; };
    return api;
  });

  /* ============================================================= Tile mat
     Algebra tiles for combining like terms. spec: { terms: [[3, "x"], [2, "1"],
     [-1, "x"], [-5, "1"], [2, "y"]] }. A positive and a negative tile of the
     same kind are a zero pair: tap one, then its opposite, and both go.
     Gathering puts like tiles side by side. Done when no zero pairs remain. */
  CH.addKind("tilemat", function (spec, seed, mode) {
    var api = {}, tiles = [], sel = null, grouped = false, pairs = 0, id = 0;
    spec.terms.forEach(function (t, ti) {
      for (var i = 0; i < Math.abs(t[0]); i++) tiles.push({ id: id++, k: t[1], s: t[0] < 0 ? -1 : 1, term: ti });
    });
    var box = el("div", "lw lw-mat");
    var mat = el("div", "lw-mat-in");
    box.appendChild(mat);
    var tools = el("div", "lw-tools");
    var gb = button("lw-btn", "Gather like tiles");
    gb.addEventListener("click", function () { grouped = !grouped; gb.textContent = grouped ? "Back to the expression's order" : "Gather like tiles"; paint(); });
    tools.appendChild(gb);
    box.appendChild(tools);
    var msg = el("div", "lw-msg");
    box.appendChild(msg);
    var read = el("div", "lw-read");
    box.appendChild(read);
    var KIND = { x: "x", y: "y", "1": "1", x2: "x^2" };
    function exprNow() {
      // In the expression's own order, or gathered.
      var groups = [];
      if (grouped) {
        ["x2", "x", "y", "1"].forEach(function (k) {
          var c = tiles.filter(function (t) { return t.k === k; }).reduce(function (a, t) { return a + t.s; }, 0);
          if (tiles.some(function (t) { return t.k === k; })) groups.push([c, k === "1" ? "" : KIND[k]]);
        });
        return LAB.poly(groups);
      }
      spec.terms.forEach(function (t, ti) {
        var left = tiles.filter(function (x) { return x.term === ti; });
        if (!left.length) return;
        groups.push([left.reduce(function (a, x) { return a + x.s; }, 0), t[1] === "1" ? "" : KIND[t[1]]]);
      });
      return groups.length ? LAB.poly(groups, { keepZero: true }) : "0";
    }
    function simplified() {
      return ["x2", "x", "y", "1"].every(function (k) {
        var ts = tiles.filter(function (t) { return t.k === k; });
        return !(ts.some(function (t) { return t.s > 0; }) && ts.some(function (t) { return t.s < 0; }));
      });
    }
    function tileEl(t) {
      var b = button("lw-tile k-" + t.k + (t.s < 0 ? " neg" : "") + (sel === t ? " sel" : ""),
        t.k === "1" ? (t.s < 0 ? "−1" : "1") : (t.s < 0 ? "−" : "") + (t.k === "x2" ? "x²" : t.k));
      b.setAttribute("aria-label", (t.s < 0 ? "negative " : "") + (t.k === "1" ? "one" : t.k === "x2" ? "x squared" : t.k) + " tile");
      b.addEventListener("click", function () { tap(t, b); });
      return b;
    }
    function tap(t, b) {
      if (!sel) { sel = t; paint(); return; }
      if (sel === t) { sel = null; paint(); return; }
      if (sel.k === t.k && sel.s !== t.s) {
        var a = sel;
        sel = null;
        pairs++;
        var gone = mat.querySelectorAll(".sel, [data-id='" + t.id + "']");
        [].forEach.call(mat.querySelectorAll(".lw-tile"), function (n) {
          if (+n.dataset.id === a.id || +n.dataset.id === t.id) n.classList.add("zap");
        });
        msg.className = "lw-msg good";
        msg.innerHTML = fmt("A zero pair: $" + (t.k === "1" ? "1 + (-1)" : t.k === "x2" ? "x^2 + (-x^2)" : t.k + " + (-" + t.k + ")") + " = 0$. They cancel.");
        setTimeout(function () { tiles = tiles.filter(function (x) { return x !== a && x !== t; }); paint(); }, reduced() ? 0 : 280);
        return;
      }
      msg.className = "lw-msg bad";
      msg.innerHTML = sel.k !== t.k ? fmt("$" + (sel.k === "1" ? "1" : KIND[sel.k]) + "$ and $" + (t.k === "1" ? "1" : KIND[t.k]) + "$ are different kinds of tile — they can't cancel or combine.")
        : "Those two have the same sign. A zero pair is one positive and one negative.";
      sel = t;
      paint();
    }
    function reduced() { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    function paint() {
      mat.innerHTML = "";
      if (grouped) {
        ["x2", "x", "y", "1"].forEach(function (k) {
          var ts = tiles.filter(function (t) { return t.k === k; });
          if (!ts.length) return;
          var row = el("div", "lw-mat-row");
          ts.sort(function (a, b) { return b.s - a.s; }).forEach(function (t) { var e = tileEl(t); e.dataset.id = t.id; row.appendChild(e); });
          mat.appendChild(row);
        });
      } else {
        spec.terms.forEach(function (tm, ti) {
          var ts = tiles.filter(function (t) { return t.term === ti; });
          if (!ts.length) return;
          var g = el("div", "lw-mat-g");
          ts.forEach(function (t) { var e = tileEl(t); e.dataset.id = t.id; g.appendChild(e); });
          mat.appendChild(g);
        });
      }
      if (!tiles.length) mat.appendChild(el("div", "lw-mat-empty", "Nothing left: it all cancelled, so the value is 0."));
      var done = simplified();
      read.innerHTML = m(exprNow()) + (done ? '<span class="lw-tag good">simplified: ' + m(simplest()) + "</span>" : '<span class="lw-tag">' + pairs + " zero pair" + (pairs === 1 ? "" : "s") + " removed</span>");
      box.classList.toggle("solved", done);
      if (api.onChange) api.onChange();
    }
    function simplest() {
      var g = [];
      ["x2", "x", "y", "1"].forEach(function (k) {
        var c = tiles.filter(function (t) { return t.k === k; }).reduce(function (a, t) { return a + t.s; }, 0);
        if (c) g.push([c, k === "1" ? "" : KIND[k]]);
      });
      return LAB.poly(g);
    }
    paint();
    api.el = box;
    api.ready = function () { return simplified(); };
    api.check = function () { return { ok: simplified(), say: "There's still a positive and a negative tile of the same kind. Pair them off." }; };
    api.reveal = function () {
      ["x2", "x", "y", "1"].forEach(function (k) {
        var pos = tiles.filter(function (t) { return t.k === k && t.s > 0; }), neg = tiles.filter(function (t) { return t.k === k && t.s < 0; });
        var n2 = Math.min(pos.length, neg.length);
        tiles = tiles.filter(function (t) { return pos.slice(0, n2).indexOf(t) < 0 && neg.slice(0, n2).indexOf(t) < 0; });
      });
      grouped = true; paint();
    };
    return api;
  });

  /* ============================================================ Rectangle
     A rectangle you size with sliders; its perimeter 2l + 2w and area lw
     worked out live. spec: { l, w: { v, min, max }, target: { P, A } } */
  CH.addKind("rectangle", function (spec, seed, mode) {
    var api = {}, l = spec.l.v, w = spec.w.v, moved = false;
    var box = el("div", "lw lw-rectw");
    var maxL = spec.l.max, maxW = spec.w.max, u = Math.min(420 / maxL, 220 / maxW);
    var svg = svgRoot(560, Math.round(maxW * u + 56));
    box.appendChild(svg);
    var ctl = el("div", "lw-sliders");
    ctl.appendChild(slider("length $l$", spec.l, function (v) { l = v; moved = true; paint(); }).el);
    ctl.appendChild(slider("width $w$", spec.w, function (v) { w = v; moved = true; paint(); }).el);
    box.appendChild(ctl);
    var read = el("div", "lw-read lw-rect-read");
    box.appendChild(read);
    function paint() {
      svg.innerHTML = "";
      var x0 = Math.round((560 - l * u) / 2) - 16, y0 = 32;
      var g = S("g", {}, svg);
      for (var i = 0; i <= l; i++) S("line", { x1: x0 + i * u, y1: y0, x2: x0 + i * u, y2: y0 + w * u, class: "lw-rgrid" }, g);
      for (var j = 0; j <= w; j++) S("line", { x1: x0, y1: y0 + j * u, x2: x0 + l * u, y2: y0 + j * u, class: "lw-rgrid" }, g);
      S("rect", { x: x0, y: y0, width: l * u, height: w * u, rx: 4, class: "lw-rrect" }, g);
      var tl = S("text", { x: x0 + l * u / 2, y: y0 - 10, "text-anchor": "middle", class: "lw-dim" }, g); mtext(tl, "l = " + l);
      var tw = S("text", { x: x0 + l * u + 12, y: y0 + w * u / 2 + 6, class: "lw-dim" }, g); mtext(tw, "w = " + w);
      var P = 2 * l + 2 * w, A = l * w;
      var t = spec.target || {};
      var hitP = t.P == null || P === t.P, hitA = t.A == null || A === t.A;
      read.innerHTML = '<span class="' + (t.P != null ? (P === t.P ? "ok" : "") : "") + '">' + m("P = 2l + 2w = 2(" + l + ") + 2(" + w + ") = " + P) + "</span>" +
        '<span class="' + (t.A != null ? (A === t.A ? "ok" : "") : "") + '">' + m("A = lw = " + l + " \\cdot " + w + " = " + A) + "</span>" +
        (t.P != null || t.A != null ? '<span class="lw-tag' + (hitP && hitA ? " good" : "") + '">aim: ' + (t.P != null ? "P = " + t.P : "") + (t.P != null && t.A != null ? ", " : "") + (t.A != null ? "A = " + t.A : "") + "</span>" : "");
      box.classList.toggle("solved", (t.P != null || t.A != null) && hitP && hitA);
      if (api.onChange) api.onChange();
    }
    paint();
    function hit() { var t = spec.target || {}; return (t.P == null || 2 * l + 2 * w === t.P) && (t.A == null || l * w === t.A); }
    api.el = box;
    api.ready = function () { return spec.target ? hit() : mode.explore ? (spec.gate ? moved : true) : moved; };
    api.check = function () { return { ok: hit(), say: "Not yet — check both the perimeter and the area." }; };
    api.reveal = function () { if (spec.answer) { l = spec.answer[0]; w = spec.answer[1]; ctl.querySelectorAll("input").forEach(function (x, i) { x.value = i ? w : l; x.dispatchEvent(new Event("input")); }); } };
    return api;
  });

  /* =============================================================== Tester
     Two expressions, one value of x, both worked out side by side — the
     way to test whether they are equivalent. spec: { a, b, x: { v, min, max },
     goal: "differ" | "agree3" } */
  CH.addKind("tester", function (spec, seed, mode) {
    var api = {}, x = spec.x.v, fa = LAB.compile(spec.a), fb = LAB.compile(spec.b), log = [], differed = false;
    var box = el("div", "lw lw-tester");
    var cards = el("div", "lw-tcards");
    box.appendChild(cards);
    var ctl = el("div", "lw-sliders");
    ctl.appendChild(slider("$x$", spec.x, function (v) { x = v; record(); paint(); }).el);
    box.appendChild(ctl);
    var table = el("div", "lw-tlog");
    box.appendChild(table);
    function record() {
      if (log.some(function (r) { return r[0] === x; })) return;
      var a = fa({ x: x }), b = fb({ x: x });
      log.push([x, a, b]);
      if (Math.abs(a - b) > 1e-9) differed = true;
    }
    function paint() {
      var a = fa({ x: x }), b = fb({ x: x }), same = Math.abs(a - b) < 1e-9;
      cards.innerHTML = '<div class="lw-tcard"><span>' + m(spec.aTex || spec.a) + "</span><b>" + m(LAB.sub(spec.aTex || spec.a, { x: x }) + " = " + num(a)) + "</b></div>" +
        '<div class="lw-teq ' + (same ? "same" : "diff") + '">' + (same ? "=" : "≠") + "</div>" +
        '<div class="lw-tcard"><span>' + m(spec.bTex || spec.b) + "</span><b>" + m(LAB.sub(spec.bTex || spec.b, { x: x }) + " = " + num(b)) + "</b></div>";
      table.innerHTML = log.length ? "<span class='lw-tlog-h'>Tried</span>" + log.map(function (r) {
        var eq = Math.abs(r[1] - r[2]) < 1e-9;
        return '<span class="' + (eq ? "eq" : "ne") + '">' + m("x = " + num(r[0])) + " " + (eq ? "✓" : "✗") + "</span>";
      }).join("") : "";
      if (api.onChange) api.onChange();
    }
    record();
    paint();
    api.el = box;
    api.ready = function () { return spec.goal === "differ" ? differed : spec.goal === "agree3" ? log.length >= 3 : true; };
    api.check = function () { return { ok: api.ready() }; };
    api.reveal = function () {};
    return api;
  });

  /* ================================================================ Share
     Division as fitting pieces: how many pieces of size d fit into 12? As d
     shrinks the count explodes, and at d = 0 no count is possible.
     spec: { total, d: { v, min, max, step } } */
  CH.addKind("share", function (spec, seed, mode) {
    var api = {}, d = spec.d.v, total = spec.total || 12, reachedZero = false;
    var box = el("div", "lw lw-share");
    var svg = svgRoot(640, 110);
    box.appendChild(svg);
    var ctl = el("div", "lw-sliders");
    ctl.appendChild(slider("piece size $d$", Object.assign({ show: function (v) { return "$" + num(v) + "$"; } }, spec.d), function (v) { d = v; if (v === 0) reachedZero = true; paint(); }).el);
    box.appendChild(ctl);
    var read = el("div", "lw-read");
    box.appendChild(read);
    function paint() {
      svg.innerHTML = "";
      var x0 = 20, W = 600, y = 30, h = 40;
      S("rect", { x: x0, y: y, width: W, height: h, rx: 8, class: "lw-sbar" }, svg);
      if (d > 0) {
        var n = total / d, pw = W / n, count = Math.floor(n + 1e-9);
        if (count <= 240) {
          for (var i = 0; i < count; i++) S("rect", { x: x0 + i * pw + 1, y: y + 1, width: Math.max(0.6, pw - 2), height: h - 2, rx: Math.min(6, pw / 3), class: "lw-spiece " + (i % 2 ? "b" : "a") }, svg);
        } else S("rect", { x: x0, y: y, width: W, height: h, rx: 8, class: "lw-spiece dense" }, svg);
        read.innerHTML = m(total + " \\div " + num(d) + " = " + num(Math.round(total / d * 1000) / 1000)) + " &nbsp;<span class='lw-note'>— that many pieces of size " + num(d) + " fit.</span>";
      } else {
        var t = S("text", { x: x0 + W / 2, y: y + h / 2 + 6, "text-anchor": "middle", class: "lw-szero" }, svg);
        t.textContent = "pieces of size 0 never fill it — no count works";
        read.innerHTML = m(total + " \\div 0") + " is <b>undefined</b>.";
      }
      var ax = S("text", { x: x0, y: y + h + 22, class: "lw-glab" }, svg); ax.textContent = "0";
      var bx = S("text", { x: x0 + W, y: y + h + 22, "text-anchor": "end", class: "lw-glab" }, svg); bx.textContent = String(total);
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? reachedZero : true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () {};
    return api;
  });

  LAB.widgetsReady = true;
})();
