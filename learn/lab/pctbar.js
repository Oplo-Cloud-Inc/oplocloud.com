/* ==========================================================================
   The percent bar. A percent is a part of a bar: the bar is the whole, the
   handle is how much of it. Dragging makes the idea a thing you do, and the
   number beside the bar is what that part is worth for this whole.

   One piece, five jobs, all `type: "pctbar"` (or a learn step's scene):

     make      drag the bar to a percent of the whole ("make 75% of 20"), or to
               an amount ("make the bar show 36"): goal: { pct } | { value }
     explore   free play; the percent and the amount are live; `wholes` are
               buttons that change the whole and keep the percent
     base      the amount is fixed and a marker sits at the percent of a whole
               you can stretch: "9 is 15% of what?" — stretch until it meets 9
     repeat    the part is drawn once for each year: simple interest as t bars
     last      a still picture of the learner's own last bar (a takeaway)

   spec: { whole, cells (4), max (1.25 × whole), tone (0–3), start (percent),
           goal, snap, label, top: { whole, fill }, repeat, unit, wholes,
           base: { amount, pct, max, start }, show: "last", fallback }

   A wrong answer is information: the bar stays where it was left, and says
   what that bar is ("That bar is 50% of 100, which is 50"). Nothing is red.
   Every handle is a slider for the keyboard and for a screen reader.
   ========================================================================== */
(function () {
  "use strict";
  var LAB = window.OPLO_LAB, CH = window.OPLO_CHALLENGE;
  if (!LAB || !CH || CH.kinds.pctbar) return;
  var el = LAB.el, m = LAB.m, num = LAB.num, button = LAB.button;
  var NS = "http://www.w3.org/2000/svg";
  var VW = 700, X0 = 56, BW = 450, BH = 40;

  function S(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] != null) n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function round(v, d) { var k = Math.pow(10, d == null ? 2 : d); return Math.round(v * k) / k; }
  function pct(v) { return num(round(v, 1)) + "%"; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  // The coarsest step that still lands exactly on a target: whole numbers where it can.
  function step(v) {
    var c = [1, 0.5, 0.25, 0.1, 0.05, 0.01];
    for (var i = 0; i < c.length; i++) if (Math.abs(v / c[i] - Math.round(v / c[i])) < 1e-9) return c[i];
    return 0.01;
  }
  // The step a hand can use: about four pixels a step, and still landing exactly on the target. A whole of 100
  // moves by 1; a whole of 4000 by 40. (A target that needs halves or tenths keeps the fine step.)
  function autoSnap(g, whole) {
    if (Math.abs(g - Math.round(g)) > 1e-9) return step(g);
    g = Math.round(g);
    for (var d = Math.max(1, Math.ceil(whole * 4 / BW - 1e-9)); d < g; d++) if (g % d === 0) return d;
    return 1;
  }
  function reduced() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function sfx(n) { try { if (window.OPLO_KERN && window.OPLO_FEEL) window.OPLO_FEEL.SFX.play(n); } catch (e) { /* no sound */ } }

  CH.addKind("pctbar", function (spec, seed, mode) {
    mode = mode || {};
    var api = {};
    var base = spec.base || null;
    var explore = !!mode.explore && !spec.goal && !base;
    var still = spec.show === "last";
    var last = LAB.pctLast || null;
    var W = spec.whole || 100, tone = spec.tone || 0, cells = spec.cells || 4, MAX = spec.max || 1.25;
    var rep = spec.repeat || 0;
    // A takeaway shows the learner's own last bar; a learner who jumped straight here sees the example.
    if (still) {
      var fb = spec.fallback || {};
      var src = last || { whole: fb.whole || 100, pct: fb.pct == null ? 60 : fb.pct, tone: fb.tone || 0, cells: fb.cells || 5 };
      W = src.whole; tone = src.tone || 0; cells = src.cells || 4;
    }
    var goal = spec.goal || null;
    var goalValue = goal ? (goal.value != null ? goal.value : goal.pct * W / 100) : null;
    var snap = spec.snap || (goal ? autoSnap(goalValue, W) : explore ? W / 100 : 1);
    if (base) { W = base.start || Math.round(base.max / 3); snap = base.snap || 1; }
    var baseMax = base ? base.max : 0;
    var value = base ? W : (spec.start != null ? spec.start * W / 100 : W);
    if (still) value = (src.pct / 100) * W;
    var moved = false, locked = false, shown = null;             // shown: the label above the end of the bar
    var seen = { over: false, under: false };                   // which sides of the whole have been visited
    var visited = {}; visited[W] = true;
    var wholes = (explore && spec.wholes) || null;

    var rows = rep ? Math.min(rep, 6) : 1;
    var botY = 112, H = botY + BH + 62 + (rows - 1) * 50 + (rep ? 18 : 0);
    var box = el("div", "lw pb pb-t" + tone);
    var svg = S("svg", { viewBox: "0 0 " + VW + " " + H, class: "pb-svg", role: "group", "aria-label": spec.alt || "A percent bar." }, box);
    var read = el("div", "lw-read pb-read");
    read.setAttribute("aria-live", "polite");

    var scale = base ? baseMax : W * MAX;                         // units across the whole track
    function X(v) { return X0 + (base ? v / baseMax * (BW * MAX) : v / W * BW); }
    function V(px) { return base ? (px - X0) / (BW * MAX) * baseMax : (px - X0) / BW * W; }
    function svgPt(e) {
      var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      var c = svg.getScreenCTM();
      return c ? p.matrixTransform(c.inverse()) : { x: 0, y: 0 };
    }
    var gRef = S("g", { class: "pb-ref" }, svg), gBar = S("g", { class: "pb-bar" }, svg), gTop = S("g", { class: "pb-lab" }, svg);
    var hit = null, handle = null;

    function text(cls, x, y, t, parent, anchor) {
      var n = S("text", { class: "pb-tx " + cls, x: x, y: y, "text-anchor": anchor || "start" }, parent || gTop);
      n.textContent = t; return n;
    }
    function cellLines(parent, y) {
      for (var i = 1; i < cells; i++) S("line", { class: "pb-cell", x1: X0 + BW * i / cells, y1: y, x2: X0 + BW * i / cells, y2: y + BH }, parent);
    }

    /* ---- the reference bar: the whole, 0% to 100% */
    function drawRef() {
      gRef.innerHTML = "";
      var topFill = spec.top ? spec.top.fill / spec.top.whole : 1;
      if (base) {
        // The whole you can stretch, with a marker at its percent.
        S("rect", { class: "pb-fill pb-dim", x: X0, y: 36, width: X(W) - X0, height: BH, rx: 3 }, gRef);
        for (var i = 1; i < 10; i++) S("line", { class: "pb-cell", x1: X0 + (X(W) - X0) * i / 10, y1: 36, x2: X0 + (X(W) - X0) * i / 10, y2: 36 + BH }, gRef);
        S("rect", { class: "pb-edge", x: X0, y: 36, width: X(W) - X0, height: BH, rx: 3 }, gRef);
        var mk = X0 + (X(W) - X0) * base.pct / 100;
        S("line", { class: "pb-mark", x1: mk, y1: 26, x2: mk, y2: 36 + BH + 8 }, gRef);
        text("pb-soft", X0, 22, "0", gRef);
        text("pb-mk", mk, 18, pct(base.pct), gRef, "middle");
        text("pb-val", X(W) + 8, 62, num(round(W, 1)), gRef);
        return;
      }
      if (spec.top) {
        S("rect", { class: "pb-track", x: X0, y: 36, width: BW, height: BH, rx: 3 }, gRef);
        S("rect", { class: "pb-fill pb-dim", x: X0, y: 36, width: BW * topFill, height: BH, rx: 3 }, gRef);
        cellLines(gRef, 36);
        S("rect", { class: "pb-edge", x: X0, y: 36, width: BW, height: BH, rx: 3 }, gRef);
        text("pb-soft", X0, 28, "0", gRef);
        text("pb-soft", X0 + BW, 28, num(spec.top.whole), gRef, "end");
        text("pb-val", X0 + BW * topFill, 28, num(spec.top.fill), gRef, "middle");
        text("pb-soft", X0 + BW + 10, 62, "out of " + num(spec.top.whole), gRef);
        return;
      }
      S("rect", { class: "pb-fill pb-dim", x: X0, y: 36, width: BW, height: BH, rx: 3 }, gRef);
      cellLines(gRef, 36);
      S("rect", { class: "pb-edge", x: X0, y: 36, width: BW, height: BH, rx: 3 }, gRef);
      // The road past the whole: where a tax or a mark-up goes.
      S("rect", { class: "pb-over", x: X0 + BW, y: 36, width: BW * (MAX - 1), height: BH }, gRef);
      text("pb-soft", X0, 28, "0%", gRef);
      text("pb-soft", X0 + BW, 28, "100%", gRef, "middle");
      text("pb-val", X0 + BW + 10, 62, num(round(W, 2)), gRef);
    }

    /* ---- the bar you move */
    function drawBar() {
      gBar.innerHTML = ""; gTop.innerHTML = "";
      var y = botY;
      for (var r = 0; r < rows; r++) {
        var yy = y + r * 50, mine = r === 0;
        if (base) {
          S("rect", { class: "pb-fill" + (mine ? "" : " pb-ghost"), x: X0, y: yy, width: X(base.amount) - X0, height: BH, rx: 3 }, gBar);
          S("rect", { class: "pb-edge", x: X0, y: yy, width: X(base.amount) - X0, height: BH, rx: 3 }, gBar);
          text("pb-val", X(base.amount) + 8, yy + 26, num(base.amount), gBar);
          S("line", { class: "pb-guide", x1: X(base.amount), y1: 36 + BH + 4, x2: X(base.amount), y2: yy }, gBar);
          break;
        }
        S("rect", { class: "pb-track", x: X0, y: yy, width: BW * MAX, height: BH, rx: 3 }, gBar);
        // Two bars of different wholes line up when they are the same part of the whole.
        if (spec.top && spec.top.guide !== false && mine) S("line", { class: "pb-guide", x1: X0 + BW * spec.top.fill / spec.top.whole, y1: 36 + BH + 4, x2: X0 + BW * spec.top.fill / spec.top.whole, y2: yy }, gBar);
        var w = Math.max(0, X(value) - X0);
        S("rect", { class: "pb-fill" + (mine ? "" : " pb-ghost"), x: X0, y: yy, width: w, height: BH, rx: 3 }, gBar);
        cellLines(gBar, yy);
        S("rect", { class: "pb-edge", x: X0, y: yy, width: w, height: BH, rx: 3 }, gBar);
        if (rep) text("pb-soft", 8, yy + 26, "Year " + (r + 1), gBar);
        if (mine) text("pb-val", X0 + w + (rep ? 30 : 10), yy + 26, num(round(value, 2)), gBar);
      }
      if (rep) {
        var tot = round(value * rows, 2);
        text("pb-tot", X0 + BW * MAX, botY + rows * 50 + 8, rows + " years: " + num(tot), gBar, "end");
      }
      // The label over the end of the bar: live while exploring, after Check otherwise.
      if (!base && (explore || shown) && !still) {
        text("pb-pct " + (shown && shown.cls ? shown.cls : ""), X0 + Math.max(0, X(value) - X0), botY - 8, (shown && shown.t) || pct(value / W * 100), gTop, "middle");
      }
      if (still) {
        text("pb-pct pb-ok", X0 + Math.max(0, X(value) - X0), botY - 8, pct(value / W * 100), gTop, "middle");
        text("pb-soft", X0, botY - 8, "0%", gTop);
      } else if (!base && !(explore || shown)) text("pb-soft", X0, botY - 8, "0%", gTop);
    }

    /* ---- the handle */
    function drawHandle() {
      if (still) return;
      handle = S("g", { class: "pb-handle" + (locked ? " done" : ""), tabindex: locked ? -1 : 0, role: "slider" }, svg);
      // With a bar for each year the handle sits on the first one's end, not under it (it would land on year 2).
      var hx = base ? X(W) : X(value), cy = base ? 36 + BH + 26 : rep ? botY + BH / 2 : botY + BH + 26, by = base ? 36 + BH : botY + BH;
      if (!rep) S("line", { class: "pb-stem", x1: hx, y1: by, x2: hx, y2: cy }, handle);
      S("circle", { class: "pb-hit", cx: hx, cy: cy, r: 26 }, handle);
      S("circle", { class: "pb-knob", cx: hx, cy: cy, r: 13 }, handle);
      S("circle", { class: "pb-core", cx: hx, cy: cy, r: 6 }, handle);
      if (locked) S("path", { class: "pb-tick", d: "M" + (hx - 6) + " " + cy + " l4 4 l8 -9" }, handle);
      var v = base ? W : value, hi = base ? baseMax : round(W * MAX, 2);
      handle.setAttribute("aria-valuemin", "0"); handle.setAttribute("aria-valuemax", String(hi)); handle.setAttribute("aria-valuenow", String(round(v, 2)));
      handle.setAttribute("aria-label", base ? "The whole: drag its end, or use the arrow keys." : "The bar: drag it, or use the arrow keys.");
      handle.setAttribute("aria-valuetext", base ? "The whole is " + num(round(W, 1)) + ". " + pct(base.pct) + " of it is " + num(round(W * base.pct / 100, 2)) + "."
        : num(round(v, 2)) + " out of " + num(W) + (explore || shown ? ", " + pct(v / W * 100) : ""));
      wire(handle);
    }
    function drawHit() {
      if (still) return;
      hit = S("rect", { class: "pb-grab", x: X0, y: (base ? 36 : botY) - 6, width: BW * MAX, height: BH + 12 }, svg);
      hit.setAttribute("aria-hidden", "true");
      wireHit(hit);
    }

    function foundInExplore() {
      if (!mode.explore || goal) return false;
      if (base) return Math.abs(W - base.answer) < snap / 2 + 1e-9;
      if (spec.top) return Math.abs(value - spec.top.fill / spec.top.whole * W) < snap / 2 + 1e-9;
      return false;
    }
    function paint() {
      if (!base) { if (value > W + 1e-9) seen.over = true; if (value < W - 1e-9) seen.under = true; }
      // A scene that was solved by hand leaves its bar for the takeaway.
      if (foundInExplore()) LAB.pctLast = { whole: W, value: base ? base.amount : value, pct: base ? base.pct : value / W * 100, tone: tone, cells: cells };
      svg.innerHTML = "";
      gRef = S("g", { class: "pb-ref" }, svg); gBar = S("g", { class: "pb-bar" }, svg); gTop = S("g", { class: "pb-lab" }, svg);
      drawRef(); drawBar(); drawHit(); drawHandle();
      readout();
      if (api.onChange) api.onChange();
    }
    function readout() {
      if (still) { read.innerHTML = m(pct(value / W * 100).replace("%", "\\%") + "\\text{ of } " + num(round(W, 2)) + " = " + num(round(value, 2))); return; }
      if (base) { read.innerHTML = m(pct(base.pct).replace("%", "\\%") + "\\text{ of } " + num(round(W, 1)) + " = " + num(round(W * base.pct / 100, 2))); return; }
      if (explore) { read.innerHTML = m(pct(value / W * 100).replace("%", "\\%") + "\\text{ of } " + num(round(W, 2)) + " = " + num(round(value, 2))); return; }
      read.innerHTML = spec.read ? LAB.fmt(spec.read) : "";
    }

    /* ---- moving it */
    function setFrom(px, fine) {
      var raw = V(px), lo = base ? Math.max(snap, base.min || snap) : 0, hi = base ? baseMax : W * MAX;
      var v = clamp(Math.round(raw / snap) * snap, lo, hi);
      v = round(v, 4);
      if (base) { if (v !== W) { W = v; moved = true; shown = null; paint(); } }
      else if (v !== value) { value = v; moved = true; shown = null; paint(); }
    }
    var drag = null;
    function start(e) {
      if (locked || still) return;
      e.preventDefault();
      drag = { id: e.pointerId };
      try { svg.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ }
      setFrom(svgPt(e).x);
      sfx("pick");
    }
    function wire(h) { h.addEventListener("pointerdown", start); h.addEventListener("keydown", key); }
    function wireHit(h) { h.addEventListener("pointerdown", start); }
    svg.addEventListener("pointermove", function (e) { if (drag && e.pointerId === drag.id) setFrom(svgPt(e).x); });
    function end(e) { if (!drag || (e && e.pointerId !== drag.id)) return; drag = null; sfx("drop"); }
    svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
    function key(e) {
      if (locked) return;
      var d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key], hi = base ? baseMax : W * MAX, cur = base ? W : value;
      var v = null;
      if (d) v = cur + d * snap * (e.shiftKey ? 10 : 1);
      else if (e.key === "Home") v = 0;
      else if (e.key === "End") v = base ? baseMax : W;
      else if (e.key === "PageUp") v = cur + (base ? baseMax : W) / cells;
      else if (e.key === "PageDown") v = cur - (base ? baseMax : W) / cells;
      if (v == null) return;
      e.preventDefault();
      v = round(clamp(Math.round(v / snap) * snap, base ? snap : 0, hi), 4);
      if (base) W = v; else value = v;
      moved = true; shown = null; paint();
      var h = svg.querySelector(".pb-handle"); if (h) h.focus();
    }

    /* ---- the whole, in explore mode */
    if (wholes) {
      var bar = el("div", "pb-wholes");
      bar.appendChild(el("span", "pb-wl", "The whole is"));
      wholes.forEach(function (w, i) {
        var b = button("pb-wb pb-t" + (i % 4), String(w));
        b.type = "button";
        b.setAttribute("aria-pressed", String(w === W));
        b.addEventListener("click", function () {
          var p = value / W;
          W = w; tone = i % 4; visited[w] = true;
          box.className = box.className.replace(/pb-t\d/, "pb-t" + tone);
          value = round(Math.round(p * 100) * W / 100, 4); snap = W / 100;
          [].forEach.call(bar.querySelectorAll(".pb-wb"), function (x, j) { x.setAttribute("aria-pressed", String(j === i)); x.classList.toggle("on", j === i); });
          moved = true; sfx("tap"); paint();
        });
        if (w === W) b.classList.add("on");
        bar.appendChild(b);
      });
      box.appendChild(bar);
    }
    box.appendChild(read);
    paint();

    /* ---- the contract every step kind keeps */
    function now() { return base ? W : value; }
    api.el = box;
    api.state = function () { return { whole: base ? W : W, value: base ? W * base.pct / 100 : value, pct: base ? base.pct : value / W * 100, moved: moved }; };
    api.ready = function () {
      if (still) return true;
      if (explore) {
        var need = wholes ? Math.min(2, wholes.length) : 1, n = Object.keys(visited).length;
        if (spec.top && spec.gate) return foundInExplore();
        if (spec.sides && spec.gate) return seen.over && seen.under;
        return spec.gate ? moved && n >= need : true;
      }
      // Played as a scene in a lesson, "find the whole" is done when the marker meets the amount.
      if (base && mode.explore) return foundInExplore();
      return moved;
    };
    api.check = function () {
      if (still || explore) return { ok: true };
      var v = now();
      if (base) {
        var ok = Math.abs(v - base.answer) < snap / 2 + 1e-9, say = null;
        if (ok) { locked = true; shown = null; LAB.pctLast = { whole: v, value: base.amount, pct: base.pct, tone: tone, cells: cells }; paint(); return { ok: true }; }
        var got = round(v * base.pct / 100, 2);
        say = "With a whole of " + num(round(v, 1)) + ", " + pct(base.pct) + " of it is " + num(got) + ", not " + num(base.amount) + ". " +
          (got < base.amount ? "The whole needs to be bigger." : "The whole needs to be smaller.");
        paint();
        return { ok: false, say: say };
      }
      var good = Math.abs(v - goalValue) < snap / 2 + 1e-9;
      if (good) {
        locked = true; shown = { t: pct(goalValue / W * 100), cls: "pb-ok" };
        LAB.pctLast = { whole: W, value: goalValue, pct: goalValue / W * 100, tone: tone, cells: cells };
        paint();
        return { ok: true };
      }
      var p = v / W * 100, msg;
      shown = { t: pct(p), cls: "pb-try" };
      if (goal.pct != null && W !== 100 && Math.abs(v - goal.pct) < snap / 2 + 1e-9)
        msg = "That bar shows " + num(round(v, 2)) + ", which is " + pct(p) + " of " + num(W) + ". " + pct(goal.pct) + " is " + num(goal.pct) + " out of every 100: count it against the whole of " + num(W) + ".";
      else if (goal.pct != null)
        msg = "That bar is " + pct(p) + " of " + num(W) + ", which is " + num(round(v, 2)) + ". " + (p < goal.pct ? "You need more of the bar: " : "You need less of the bar: ") + pct(goal.pct) + ".";
      else
        msg = "That bar shows " + num(round(v, 2)) + ", which is " + pct(p) + " of " + num(W) + ". " + (v < goalValue ? "You need it to reach " : "You need it to stop at ") + num(goalValue) + ".";
      paint();
      return { ok: false, say: msg };
    };
    api.reveal = function () {
      if (still || explore) return;
      if (base) { W = base.answer; LAB.pctLast = { whole: W, value: base.amount, pct: base.pct, tone: tone, cells: cells }; }
      else { value = goalValue; shown = { t: pct(goalValue / W * 100), cls: "pb-ok" }; LAB.pctLast = { whole: W, value: goalValue, pct: goalValue / W * 100, tone: tone, cells: cells }; }
      moved = true; locked = true; paint();
    };
    return api;
  });
})();
