/* ==========================================================================
   OEdu Lab — Geometry's kit. See lab/core.js (COURSE_KIT) and lab/widgets.js.

   Loaded after the manipulatives and before any Geometry unit. The general
   pieces (graph paper, a number line, a coordinate plane, LAB.fig) are in
   lab/widgets.js; this kit adds what a geometry desk has on it: a ruler, a
   protractor, a compass, and solids to turn over in your hands.

     GT.fig        LAB.fig, plus what geometry draws: a compass arc in
                   pencil, arcs marking equal angles, a plane as a slanted
                   sheet, a length written beside a segment, ellipses and
                   outlines for solids
     GT.ruler      a segment laid on a ruler — centimetres and millimetres,
                   or inches cut into halves, quarters, eighths, sixteenths
     GT.protractor an angle with a protractor laid on it, both scales
     GT.solid      a solid drawn the textbook way: hidden edges dashed
     sketch        (a step) a drawing with points to drag — along a segment,
                   round a circle, or anywhere — redrawn from where they are
                   as they move, with a live line of words under it
     solid3        (a step) a polyhedron you turn with the pointer, hidden
                   edges dashed, its faces, edges and vertices counted

   Every drawing takes its colours from the lab's tokens, so it reads the
   same on the light console and on the dark student side.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.OPLO_LAB || !window.OPLO_CHALLENGE) return;
  var LAB = window.OPLO_LAB, CH = window.OPLO_CHALLENGE;
  var el = LAB.el, esc = LAB.esc, button = LAB.button, fmt = LAB.fmt, num = LAB.num;
  var NS = "http://www.w3.org/2000/svg";
  var GT = {};

  /* ----------------------------------------------------------------- Style */
  var styleEl = null;
  function css(text) {
    if (!styleEl) {
      var old = document.getElementById("geotools-css");
      if (old) old.parentNode.removeChild(old);
      styleEl = document.createElement("style");
      styleEl.id = "geotools-css";
      document.head.appendChild(styleEl);
    }
    styleEl.appendChild(document.createTextNode(text));
  }
  css(
    ".gt-pencil{stroke:currentColor;stroke-width:1.5;fill:none;stroke-linecap:round}" +
    ".gt-marc{stroke:currentColor;stroke-width:1.8;fill:none}" +
    ".gt-plane{stroke:currentColor;stroke-width:1.6;fill:currentColor;fill-opacity:.08;stroke-linejoin:round}" +
    ".gt-face{stroke:none;fill:currentColor;fill-opacity:.1}" +
    ".gt-face.base{fill-opacity:.2}" +
    ".gt-edge{stroke:currentColor;stroke-width:2.2;fill:none;stroke-linecap:round;stroke-linejoin:round}" +
    ".gt-edge.hid{stroke-width:1.5;stroke-dasharray:5 5;opacity:.75}" +
    ".gt-vname{font-family:var(--lw-mathf);font-style:italic;font-size:16px;fill:currentColor;paint-order:stroke;stroke:var(--lw-surface);stroke-width:4px;stroke-linejoin:round}" +
    ".gt-vname.hid{opacity:.55}" +
    ".gt-rbody{fill:var(--lw-tile);stroke:var(--lw-axis);stroke-width:1.2}" +
    ".gt-rtick{stroke:var(--ink);stroke-width:1.1}" +
    ".gt-rtick.u{stroke-width:1.6}" +
    ".gt-rnum{font-family:var(--text);font-size:12px;font-weight:600;fill:var(--ink);text-anchor:middle}" +
    ".gt-runit{font-family:var(--text);font-size:11px;fill:var(--ink-3)}" +
    ".gt-guide{stroke:currentColor;stroke-width:1.1;stroke-dasharray:3 4;opacity:.7}" +
    ".gt-pbody{fill:var(--lw-blue);fill-opacity:.07;stroke:var(--lw-blue);stroke-opacity:.55;stroke-width:1.3}" +
    ".gt-ptick{stroke:var(--ink-3);stroke-width:1}" +
    ".gt-ptick.t10{stroke:var(--ink-2);stroke-width:1.3}" +
    ".gt-pout{font-family:var(--text);font-size:10.5px;font-weight:600;fill:var(--ink);text-anchor:middle}" +
    ".gt-pin{font-family:var(--text);font-size:9.5px;fill:var(--ink-3);text-anchor:middle}" +
    ".gt-sketch{display:grid;gap:10px}" +
    ".gt-sketch .gt-stage{position:relative;margin:0 auto;width:100%}" +
    ".gt-sketch svg{display:block;width:100%;height:auto;overflow:hidden;border-radius:12px;touch-action:none;user-select:none;-webkit-user-select:none}" +
    ".gt-sketch .gt-cap{text-align:center;font-size:14px;line-height:1.45;color:var(--ink-2)}" +
    ".gt-solid3 svg{cursor:grab}.gt-solid3 svg.on{cursor:grabbing}" +
    ".gt-hint{text-align:center;font-size:13px;color:var(--ink-3)}" +
    ".gt-pname{font-size:22px;fill:currentColor;paint-order:stroke;stroke:var(--lw-surface);stroke-width:4px;stroke-linejoin:round}" +
    ".gt-scr{font-size:1.22em;line-height:1;font-style:normal}" +
    /* ---- sliders, option buttons and the observation table under a sketch */
    ".gt-ctl{display:grid;gap:10px;width:min(520px,100%);margin:0 auto}.gt-ctl[hidden]{display:none}" +
    ".gt-chips{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center}" +
    ".gt-chips .lw-sl-name{margin-right:4px}" +
    "@keyframes gt-pulse{from{transform:scale(1);opacity:.8}to{transform:scale(2.6);opacity:0}}" +
    ".gt-pulse{fill:none;stroke:var(--c);stroke-width:2.5;pointer-events:none;transform-box:fill-box;transform-origin:center;animation:gt-pulse 1.7s ease-out infinite}" +
    "@media (prefers-reduced-motion:reduce){.gt-pulse{animation:none;opacity:.5}}" +
    ".gt-log{overflow:auto;display:flex;justify-content:center}" +
    ".gt-log table{border-collapse:collapse;font-size:16px;font-variant-numeric:tabular-nums}" +
    ".gt-log th{font-weight:600;font-size:14px;color:var(--ink-2);padding:6px 18px;text-align:center;border-bottom:1.5px solid var(--lw-axis);white-space:nowrap}" +
    ".gt-log td{padding:6px 18px;text-align:center;border-bottom:1px solid var(--lw-grid);white-space:nowrap}" +
    ".gt-log tr.ok td{color:var(--lw-green);font-weight:600}.gt-log tr.ph td{color:var(--ink-3)}" +
    ".m .mneg{margin-right:.06em}" +
    ".gt-dim{opacity:.45}" +
    ".gt-tap{cursor:pointer;outline:none}.gt-tap-c{fill:var(--paper);stroke:var(--c);stroke-width:2;stroke-dasharray:4 3;transition:fill .12s}" +
    ".gt-tap.c-blue{--c:var(--lw-blue)}.gt-tap.c-green{--c:var(--lw-green)}.gt-tap.c-orange{--c:var(--lw-orange)}.gt-tap.c-red{--c:var(--lw-red)}.gt-tap.c-purple{--c:var(--lw-purple)}" +
    ".gt-tap:hover .gt-tap-c,.gt-tap:focus-visible .gt-tap-c{stroke-dasharray:none;stroke-width:3}" +
    ".gt-tap.on .gt-tap-c{fill:var(--c);stroke-dasharray:none}.gt-tap-l{font:600 15px var(--lw-mathf,var(--text));fill:var(--ink);pointer-events:none}.gt-tap.on .gt-tap-l{fill:#fff}" +
    /* ---- truth tables */
    ".gt-tt{gap:16px}.gt-tt-sw{display:grid;gap:10px}" +
    ".gt-tt-var{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center}" +
    ".gt-tt-name{font-size:21px;min-width:22px;text-align:center}.gt-tt-say{color:var(--ink-2);font-size:16px}" +
    ".gt-tt-seg{display:inline-flex;gap:6px}" +
    ".gt-tt-wrap{overflow:auto;display:flex;justify-content:center}" +
    ".gt-tt-table{border-collapse:separate;border-spacing:0;font-size:18px;font-variant-numeric:tabular-nums}" +
    ".gt-tt-table th{padding:8px 18px;font-weight:600;border-bottom:1.5px solid var(--lw-axis);text-align:center;white-space:nowrap}" +
    ".gt-tt-table td{padding:6px 18px;text-align:center;font-weight:600;min-width:52px;border-bottom:1px solid var(--lw-grid)}" +
    ".gt-tt-table .gt-tt-v:last-of-type{border-right:1.5px solid var(--lw-axis)}" +
    ".gt-tt-table td.t,.gt-read b.t,.lw-read b.t,.gt-tt-cell.t{color:var(--lw-green)}" +
    ".gt-tt-table td.f,.lw-read b.f,.gt-tt-cell.f{color:var(--lw-red)}" +
    ".gt-tt-table td.q{color:var(--ink-3);font-weight:400}" +
    ".gt-tt-table tr.here td{background:color-mix(in srgb,var(--lw-blue) 14%,transparent)}" +
    ".gt-tt-cell{width:46px;height:36px;border-radius:10px;font:inherit;font-weight:700;background:var(--paper);box-shadow:inset 0 0 0 1.5px var(--rule);cursor:pointer}" +
    ".gt-tt-cell.blank{box-shadow:inset 0 0 0 1.5px var(--ink-3);opacity:.7}" +
    ".gt-tt-cell:hover{box-shadow:inset 0 0 0 2px var(--lw-blue)}.gt-tt-cell.given{opacity:.65;cursor:default;box-shadow:none;background:transparent}" +
    ".gt-tt-cell.no{box-shadow:inset 0 0 0 2.5px var(--lw-red)}" +
    /* ---- logic grid */
    ".gt-lg{gap:16px}.gt-lg-row{display:flex;gap:28px;align-items:flex-start;justify-content:center;flex-wrap:wrap}" +
    ".gt-lg-clues{margin:0;padding:0 0 0 22px;max-width:340px;display:grid;gap:8px;font-size:16px;line-height:1.45;color:var(--ink)}" +
    ".gt-lg-clues li{cursor:pointer;padding:2px 6px;border-radius:8px}.gt-lg-clues li:hover{background:var(--canvas)}" +
    ".gt-lg-clues li.used{color:var(--ink-3);text-decoration:line-through}" +
    ".gt-lg-note{text-align:center;font-size:13px;color:var(--ink-3)}" +
    ".gt-lg-table{border-collapse:separate;border-spacing:4px}" +
    ".gt-lg-table th{font-weight:600;font-size:15px;padding:4px 8px;text-align:center}.gt-lg-table tbody th{text-align:right}" +
    ".gt-lg-cell{width:50px;height:46px;border-radius:12px;font-size:24px;font-weight:700;line-height:1;background:var(--paper);box-shadow:inset 0 0 0 1.5px var(--rule);color:var(--ink-3);cursor:pointer;transition:box-shadow .12s,background .12s}" +
    ".gt-lg-cell:hover{box-shadow:inset 0 0 0 2px var(--lw-blue)}" +
    ".gt-lg-cell.x{color:var(--lw-red)}.gt-lg-cell.v{color:var(--paper);background:var(--lw-green);box-shadow:none}.gt-lg-cell.auto{color:var(--ink-3);opacity:.45}" +
    ".gt-lg-cell.no{box-shadow:inset 0 0 0 3px var(--lw-red)}" +
    /* ---- river crossing */
    ".gt-cross{gap:12px}.gt-cross-scene{display:flex;justify-content:center}" +
    ".gt-cross-svg{width:100%;max-width:620px;height:auto;border-radius:14px;overflow:hidden}" +
    ".gt-bank{fill:color-mix(in srgb,var(--lw-green) 22%,var(--canvas))}.gt-water{fill:color-mix(in srgb,var(--lw-blue) 24%,var(--canvas))}" +
    ".gt-wave{fill:none;stroke:color-mix(in srgb,var(--lw-blue) 55%,var(--ink-3));stroke-width:2;stroke-linecap:round;opacity:.6}" +
    ".gt-boat{fill:color-mix(in srgb,var(--lw-orange) 55%,var(--canvas));stroke:var(--lw-orange);stroke-width:2;stroke-linejoin:round}" +
    ".gt-tok{cursor:pointer;outline:none}.gt-tok-c{fill:var(--c);stroke:var(--paper);stroke-width:3;transition:r .12s}" +
    ".gt-tok:hover .gt-tok-c,.gt-tok:focus-visible .gt-tok-c{r:29}.gt-tok.c-blue{--c:var(--lw-blue)}.gt-tok.c-red{--c:var(--lw-red)}.gt-tok.c-green{--c:var(--lw-green)}.gt-tok.c-orange{--c:var(--lw-orange)}" +
    ".gt-tok-l{font:700 22px var(--text);fill:#fff}.gt-tok-n{font:600 13px var(--text);fill:var(--ink)}" +
    ".gt-cross-msg{min-height:30px;font-size:17px}.gt-cross-msg b.f{color:var(--lw-red)}.gt-cross-msg b.t{color:var(--lw-green)}" +
    ".gt-cross-bar{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}.gt-cross-bar .lw-btn:disabled{opacity:.4;cursor:default}" +
    ".gt-cross-net{overflow:auto;display:flex;justify-content:center}.gt-net-svg{width:100%;max-width:660px;height:auto}" +
    ".gt-edge{stroke:var(--ink-3);stroke-width:1.5;opacity:.45}.gt-edge.on{stroke:var(--lw-blue);stroke-width:2.5;opacity:1}" +
    ".gt-vtx rect{fill:var(--paper);stroke:var(--rule);stroke-width:1.5}.gt-vtx text{font:600 12px var(--text);fill:var(--ink-2)}" +
    ".gt-vtx.seen rect{stroke:var(--lw-blue)}.gt-vtx.seen text{fill:var(--ink)}.gt-vtx.here rect{fill:var(--lw-blue);stroke:var(--lw-blue)}.gt-vtx.here text{fill:#fff}" +
    ".gt-vtx.dead rect{fill:color-mix(in srgb,var(--lw-red) 25%,var(--paper));stroke:var(--lw-red)}.gt-vtx.goal rect{stroke:var(--lw-green);stroke-width:2.5}.gt-vtx.goal.here rect{fill:var(--lw-green)}" +
    ""
  );

  /* ---------------------------------------------------------------- Type
     Geometry sets its maths and its diagram labels in SF (San Francisco),
     the face the words round them are already set in, so a sentence and
     its maths read as one voice: italic letters for points and variables,
     upright numbers and signs. SF is the system font of every Mac, iPhone
     and iPad and is never downloaded — its licence doesn't allow it on a
     website. Other systems get their own interface font (Segoe UI,
     Roboto), and a maths face catches any symbol a system font lacks.
     Everything here is scoped to the course's pages (data-course="geo",
     set by lab/core.js), so no other course changes. The script capitals
     that name planes stay in a maths face: SF has none. */
  var SF = '"SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, "Helvetica Neue", "STIX Two Math", "Cambria Math", sans-serif';
  var G = '[data-course="geo"]';
  css(
    G + "," + G + " .lw," + G + " .lb-unit," + G + " .ch-card{--lw-mathf:" + SF + "}" +
    G + " .m{font-size:1em;font-kerning:normal}" +
    G + " .m .mv{padding:0 .015em}" +
    G + " .m .mt{font-size:1em}" +
    G + " .m .mo{margin:0 .2em}" +
    G + " .m .mf{font-size:.88em}" +
    G + " .m .mov{border-top-width:.075em;padding-top:.06em}" +
    G + " .lf-name," + G + " .gt-vname," + G + " .lw-mv-name{font-size:15px;font-weight:500}" +
    G + " .lf-eqt{font-size:15px}" +
    G + " .lf-it{font-size:1em;font-weight:500}" +
    G + " .lw-pl," + G + " .lw-tl{font-size:14px}" +
    G + " .lw-tl," + G + " .lw-axl text," + G + " .lf-num," + G + " .gt-rnum," + G + " .gt-pout," + G + " .gt-pin," + G + " .lw-read," + G + " .lb-in{font-variant-numeric:tabular-nums}" +
    G + " .lb-in{font-size:22px}" +
    ".gt-pname,.gt-scr{font-family:\"STIX Two Math\",\"STIX Two Text\",\"Cambria Math\",\"Apple Symbols\",serif}"
  );

  /* ------------------------------------------------------------- Helpers */
  function S(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] != null) n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function svgPt(svg, e) {
    var p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    var mtx = svg.getScreenCTM();
    return mtx ? p.matrixTransform(mtx.inverse()) : { x: 0, y: 0 };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function f1(v) { return (+v).toFixed(1); }
  var RAD = Math.PI / 180;
  function dist(a, b) { return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])); }
  function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
  function polar(c, r, deg) { return [c[0] + r * Math.cos(deg * RAD), c[1] + r * Math.sin(deg * RAD)]; }
  // The angle at b between ba and bc, 0–180.
  function angle(a, b, c) {
    var t1 = Math.atan2(a[1] - b[1], a[0] - b[0]), t2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    var d = Math.abs(t1 - t2) / RAD;
    return d > 180 ? 360 - d : d;
  }
  function dir(a, b) { var d = Math.atan2(b[1] - a[1], b[0] - a[0]) / RAD; return d < 0 ? d + 360 : d; }
  GT.dist = dist; GT.mid = mid; GT.polar = polar; GT.angle = angle; GT.dir = dir;
  // Words in a drawing: a lone letter next to a number or a sign is a
  // variable, set in italics (4x − 5, x + 2); everything else stays upright.
  function words(s, eq) {
    s = String(s).replace(/-(?=[\d(a-z])/g, "−").replace(/ - /g, " − ");
    if (!eq) return esc(s);
    // Variables: a lone lowercase letter (5y, x + 2 — but not the m of
    // "12 m"), or a run of one to three capitals (PQ, AB, x).
    var out = "", i = 0;
    while (i < s.length) {
      var m = /^[A-Z]{1,3}(?![A-Za-z])|^[a-z](?![A-Za-z])/.exec(s.slice(i));
      var prev = i ? s[i - 1] : " ";
      if (m && !/[A-Za-z]/.test(prev) && !(/[a-z]/.test(m[0]) && /\d \s*$/.test(s.slice(0, i)) && i === s.length - 1)) {
        out += '<tspan class="lf-it">' + esc(m[0]) + "</tspan>";
        i += m[0].length;
      } else { out += esc(s[i]); i++; }
    }
    return out;
  }
  var COLS = { ink: 1, soft: 1, blue: 1, green: 1, red: 1, purple: 1, orange: 1 };
  function col(c, dflt) { return "lf-" + (COLS[c] ? c : dflt || "ink"); }

  /* ================================================================ Figure
     GT.fig(o) is LAB.fig(o) with more to draw. The window, the paper and
     every item LAB.fig knows are LAB.fig's own; these are added on top (or,
     with under: true, beneath everything but the paper):

       { arc: [centre, r, from°, to°], c }         a compass arc, in pencil
       { amarks: [a, v, b], n: 1–3, r, c }          arcs in the angle at v —
                                                    equal angles, the book's way
       { plane: [p, q, r, s], name, c }             a plane: a slanted sheet
       { len: "7 cm", seg: [p, q], side: ±1, off, c, eq }   words beside a segment
       { ell: [centre, rx, ry], part, c, dash }     an ellipse (part: "front",
                                                    the lower half; "back")
       { path: [p, q, …], closed, fill, c, dash }   a broken line
       { word: "text", at: [x, y], c, anchor, eq }  words (eq: letters as maths)
       { dline: [p, q], ray, bare, c, dash }         a line drawn from p to q with a head at
                                                    each end (ray: only at q) — a line that
                                                    stops short of the frame, as books draw one
     Angles are counterclockwise from east, as in LAB.fig's turn. */
  var EXTRA = { arc: 1, amarks: 1, plane: 1, len: 1, ell: 1, path: 1, word: 1, dline: 1 };
  function isExtra(it) { for (var k in EXTRA) if (it[k] != null) return true; return false; }
  function frame(o) {
    var xr = o.x || [-6, 6], yr = o.y || [-6, 6], u = o.u || 26;
    var grid = o.grid !== false, axes = grid && o.axes !== false, nums = axes && o.nums !== false;
    var pad = o.pad != null ? o.pad : nums ? 24 : 16;
    return {
      xr: xr, yr: yr, u: u, pad: pad,
      W: Math.round((xr[1] - xr[0]) * u + 2 * pad), H: Math.round((yr[1] - yr[0]) * u + 2 * pad),
      X: function (v) { return +(pad + (v - xr[0]) * u).toFixed(1); },
      Y: function (v) { return +(pad + (yr[1] - v) * u).toFixed(1); }
    };
  }
  GT.frame = frame;
  function head(p, from) {                        // an arrowhead at p (pixels), pointing away from `from`
    var a = Math.atan2(p[1] - from[1], p[0] - from[0]), w = 0.42, z = 10;
    return '<path class="lf-head" d="M' + f1(p[0] - z * Math.cos(a - w)) + " " + f1(p[1] - z * Math.sin(a - w)) + "L" + f1(p[0]) + " " + f1(p[1]) +
      "L" + f1(p[0] - z * Math.cos(a + w)) + " " + f1(p[1] - z * Math.sin(a + w)) + 'Z"/>';
  }
  function dashA(d) { return d ? ' stroke-dasharray="' + (d === true ? "6 5" : d) + '"' : ""; }
  function drawExtra(items, F) {
    var X = F.X, Y = F.Y, u = F.u, out = [];
    function g(c, body, dflt) { out.push('<g class="' + col(c, dflt) + '">' + body + "</g>"); }
    items.forEach(function (it) {
      var s;
      if (it.arc) {
        var c = it.arc[0], r = it.arc[1] * u, a0 = it.arc[2], a1 = it.arc[3];
        var span = (((a1 - a0) % 360) + 360) % 360 || 360;
        var p0 = [X(c[0]) + r * Math.cos(a0 * RAD), Y(c[1]) - r * Math.sin(a0 * RAD)];
        var p1 = [X(c[0]) + r * Math.cos(a1 * RAD), Y(c[1]) - r * Math.sin(a1 * RAD)];
        if (span >= 359.9) s = '<circle class="gt-pencil" cx="' + X(c[0]) + '" cy="' + Y(c[1]) + '" r="' + f1(r) + '"' + dashA(it.dash) + "/>";
        else s = '<path class="gt-pencil" d="M' + f1(p0[0]) + " " + f1(p0[1]) + "A" + f1(r) + " " + f1(r) + " 0 " + (span > 180 ? 1 : 0) + " 0 " + f1(p1[0]) + " " + f1(p1[1]) + '"' + dashA(it.dash) + "/>";
        g(it.c, s, "soft");
      } else if (it.amarks) {
        var A = it.amarks[0], V = it.amarks[1], B = it.amarks[2], vx = X(V[0]), vy = Y(V[1]);
        var ta = Math.atan2(Y(A[1]) - vy, X(A[0]) - vx), tb = Math.atan2(Y(B[1]) - vy, X(B[0]) - vx), d = tb - ta;
        while (d <= -Math.PI) d += 2 * Math.PI;
        while (d > Math.PI) d -= 2 * Math.PI;
        s = "";
        for (var k = 0; k < (it.n || 1); k++) {
          var rr = (it.r || 18) + k * 5;
          s += '<path class="gt-marc" d="M' + f1(vx + rr * Math.cos(ta)) + " " + f1(vy + rr * Math.sin(ta)) + "A" + rr + " " + rr + " 0 0 " + (d > 0 ? 1 : 0) + " " +
            f1(vx + rr * Math.cos(tb)) + " " + f1(vy + rr * Math.sin(tb)) + '"/>';
        }
        g(it.c, s, "orange");
      } else if (it.plane) {
        var pp = it.plane;
        s = '<polygon class="gt-plane" points="' + pp.map(function (p) { return X(p[0]) + " " + Y(p[1]); }).join(" ") + '"/>';
        if (it.name) {
          var at = it.nameAt || [pp[3][0] + (pp[2][0] - pp[3][0]) * 0.06 + (pp[0][0] - pp[3][0]) * 0.18, pp[3][1] + (pp[0][1] - pp[3][1]) * 0.22];
          s += '<text class="gt-pname" x="' + X(at[0]) + '" y="' + (Y(at[1]) + 7) + '" text-anchor="middle">' + esc(it.name) + "</text>";
        }
        g(it.c, s, "blue");
      } else if (it.len != null) {
        var p = it.seg[0], q = it.seg[1], mx = (X(p[0]) + X(q[0])) / 2, my = (Y(p[1]) + Y(q[1])) / 2;
        var dx = X(q[0]) - X(p[0]), dy = Y(q[1]) - Y(p[1]), L = Math.sqrt(dx * dx + dy * dy) || 1;
        var side = it.side || 1, off = it.off || 15, nx = dy / L * side, ny = -dx / L * side;
        g(it.c, '<text class="lf-word" x="' + f1(mx + nx * off) + '" y="' + f1(my + ny * off + 4.5) + '" text-anchor="middle">' + words(it.len, it.eq) + "</text>", "ink");
      } else if (it.ell) {
        var ce = it.ell[0], rx = it.ell[1] * u, ry = it.ell[2] * u, cx = X(ce[0]), cy = Y(ce[1]);
        if (!it.part || it.part === "full") s = '<ellipse class="lf-stroke" cx="' + cx + '" cy="' + cy + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '"' + dashA(it.dash) + "/>";
        else s = '<path class="lf-stroke" d="M' + f1(cx - rx) + " " + cy + "A" + f1(rx) + " " + f1(ry) + " 0 0 " + (it.part === "front" ? 0 : 1) + " " + f1(cx + rx) + " " + cy + '"' + dashA(it.dash) + "/>";
        if (it.fill) s = '<ellipse class="gt-face base" cx="' + cx + '" cy="' + cy + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '"/>' + s;
        g(it.c, s, "blue");
      } else if (it.path) {
        var d2 = it.path.map(function (p, i) { return (i ? "L" : "M") + X(p[0]) + " " + Y(p[1]); }).join("") + (it.closed ? "Z" : "");
        s = (it.fill ? '<path class="gt-face" d="' + d2 + '"/>' : "") + '<path class="lf-stroke" d="' + d2 + '"' + dashA(it.dash) + "/>";
        g(it.c, s, "blue");
      } else if (it.dline) {
        // Kept inside the window (a line drawn long, to show it goes on, stops at the frame).
        var e0 = it.dline[0], e1 = it.dline[1], lo = 0, hi = 1, m = 0.15, ddx = e1[0] - e0[0], ddy = e1[1] - e0[1];
        [[ddx, e0[0], F.xr[0] + m, F.xr[1] - m], [ddy, e0[1], F.yr[0] + m, F.yr[1] - m]].forEach(function (q) {
          if (Math.abs(q[0]) < 1e-12) { if (q[1] < q[2] || q[1] > q[3]) hi = -1; return; }
          var t1 = (q[2] - q[1]) / q[0], t2 = (q[3] - q[1]) / q[0];
          lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
        });
        if (hi <= lo) return;
        var c0 = [e0[0] + lo * ddx, e0[1] + lo * ddy], c1 = [e0[0] + hi * ddx, e0[1] + hi * ddy];
        var d0 = [X(c0[0]), Y(c0[1])], d1 = [X(c1[0]), Y(c1[1])];
        s = '<path class="lf-stroke" d="M' + d0.join(" ") + "L" + d1.join(" ") + '"' + dashA(it.dash) + "/>";
        if (!it.bare) s += head(d1, d0) + (it.ray ? "" : head(d0, d1));
        g(it.c, s, "ink");
      } else if (it.word != null) {
        g(it.c, '<text class="' + (it.name ? "lf-name" : "lf-word") + '" x="' + X(it.at[0]) + '" y="' + (Y(it.at[1]) + 4.5) + '" text-anchor="' + (it.anchor || "middle") + '">' + words(it.word, it.eq) + "</text>", "ink");
      }
    });
    return out.join("");
  }
  function fig(o) {
    o = o || {};
    var base = [], over = [], under = [];
    (o.items || []).forEach(function (it) {
      if (!it) return;
      if (!isExtra(it)) base.push(it);
      else if (it.under || (it.plane && it.under !== false)) under.push(it);
      else over.push(it);
    });
    var html = LAB.fig(Object.assign({}, o, { items: base }));
    var F = frame(o);
    if (over.length) html = html.replace("</svg>", drawExtra(over, F) + "</svg>");
    if (under.length) {
      var add = drawExtra(under, F), at = html.indexOf('<g class="lf-');
      html = at < 0 ? html.replace("</svg>", add + "</svg>") : html.slice(0, at) + add + html.slice(at);
    }
    return html;
  }
  GT.fig = fig;
  GT.figs = LAB.figs;
  // The inside of a figure's drawing, and its size: for a scene that redraws.
  function figInner(o) {
    var html = fig(Object.assign({}, o, { cap: null }));
    var m = /<svg[^>]*viewBox="0 0 ([\d.]+) ([\d.]+)"[^>]*>([\s\S]*)<\/svg>/.exec(html);
    return m ? { w: +m[1], h: +m[2], inner: m[3] } : { w: 100, h: 100, inner: "" };
  }

  /* ================================================================= Ruler
     GT.ruler({ unit: "cm" | "in", div, len, seg: [a, b], names, lift, w,
                alt, cap, c })
     A ruler `len` units long, each unit cut into `div` parts (cm: 1 or 10;
     in: 1, 2, 4, 8 or 16), with a segment lying above it from a to b (in
     units from the ruler's zero), its ends dropped to the scale. */
  function rulerSVG(o, ux) {
    var unit = o.unit || "cm", div = o.div || (unit === "cm" ? 10 : 16), len = o.len || 6;
    var U = ux || (unit === "cm" ? 64 : 104), padL = 22, padR = 44, top = o.seg || o.room ? 56 : 14, H0 = 50;
    var W = Math.round(len * U + padL + padR), H = top + H0 + 8;
    function X(v) { return +(padL + v * U).toFixed(1); }
    var out = ['<rect class="lf-bg" width="' + W + '" height="' + H + '" rx="12"/>'];
    out.push('<rect class="gt-rbody" x="' + (padL - 12) + '" y="' + top + '" width="' + (len * U + 46) + '" height="' + H0 + '" rx="5"/>');
    var ticks = "";
    for (var i = 0; i <= len * div; i++) {
      var v = i / div, h;
      if (i % div === 0) h = 20;
      else if (unit === "cm") h = i % (div / 2) === 0 ? 14 : 8;
      else {
        var f = i % div, lv = 0;                      // how coarse a mark this is: ½ → 1, ¼ → 2, ⅛ → 3, 1/16 → 4
        for (var k = 1, d = div / 2; d >= 1; k++, d /= 2) { if (f % d === 0) { lv = k; break; } }
        h = [20, 15, 11, 8, 6][lv] || 6;
      }
      ticks += "M" + X(v) + " " + top + "v" + h;
      if (i % div === 0) out.push('<text class="gt-rnum" x="' + X(v) + '" y="' + (top + 35) + '">' + (i / div) + "</text>");
    }
    out.push('<path class="gt-rtick" d="' + ticks + '"/>');
    out.push('<text class="gt-runit" x="' + (X(len) + 28) + '" y="' + (top + 35) + '" text-anchor="end">' + (unit === "cm" ? "cm" : "in.") + "</text>");
    if (o.seg) {
      var a = o.seg[0], b = o.seg[1], y = top - 22, nm = o.names || [];
      var s = '<path class="gt-guide" d="M' + X(a) + " " + y + "V" + top + "M" + X(b) + " " + y + "V" + top + '"/>' +
        '<path class="lf-stroke" d="M' + X(a) + " " + y + "H" + X(b) + '"/>' +
        '<circle class="lf-dot" cx="' + X(a) + '" cy="' + y + '" r="4.2"/><circle class="lf-dot" cx="' + X(b) + '" cy="' + y + '" r="4.2"/>';
      if (nm[0]) s += '<text class="lf-name" x="' + X(a) + '" y="' + (y - 10) + '" text-anchor="middle">' + esc(nm[0]) + "</text>";
      if (nm[1]) s += '<text class="lf-name" x="' + X(b) + '" y="' + (y - 10) + '" text-anchor="middle">' + esc(nm[1]) + "</text>";
      out.push('<g class="' + col(o.c, "blue") + '">' + s + "</g>");
    }
    return { W: W, H: H, inner: out.join(""), X: X, top: top };
  }
  GT.ruler = function (o) {
    o = o || {};
    var r = rulerSVG(o);
    var alt = o.alt || ("A ruler marked in " + (o.unit === "in" ? "inches" : "centimeters") + (o.seg ? ", with a segment lying along it." : "."));
    return '<figure class="lf" style="max-width:' + (o.w || r.W) + 'px"><svg class="lf-svg" viewBox="0 0 ' + r.W + " " + r.H + '" role="img" aria-label="' + esc(alt) + '">' +
      r.inner + "</svg>" + (o.cap ? "<figcaption>" + fmt(o.cap) + "</figcaption>" : "") + "</figure>";
  };

  /* ============================================================ Protractor
     GT.protractor({ a, b, names: [onA, vertex, onB], w, alt, cap, marks })
     An angle whose rays point a° and b° (counterclockwise from east), with
     a protractor centred on its vertex, its straight edge along the
     horizontal. The outer scale counts up counterclockwise from the right
     (it reads the direction itself); the inner scale counts the other way,
     from the left — the two scales every protractor has. */
  function protractorSVG(o) {
    var R = o.R || 150, cx = R + 34, cy = R + 30, W = 2 * R + 68, H = R + 62;
    function P(deg, r) { return [cx + r * Math.cos(deg * RAD), cy - r * Math.sin(deg * RAD)]; }
    var out = ['<rect class="lf-bg" width="' + W + '" height="' + H + '" rx="12"/>'];
    out.push('<path class="gt-pbody" d="M' + (cx - R) + " " + cy + "A" + R + " " + R + " 0 0 1 " + (cx + R) + " " + cy + 'Z"/>');
    var t1 = "", t10 = "";
    for (var d = 0; d <= 180; d++) {
      var len = d % 10 === 0 ? 14 : d % 5 === 0 ? 9 : 5, p = P(d, R), q = P(d, R - len);
      if (d % 10 === 0) t10 += "M" + f1(p[0]) + " " + f1(p[1]) + "L" + f1(q[0]) + " " + f1(q[1]);
      else t1 += "M" + f1(p[0]) + " " + f1(p[1]) + "L" + f1(q[0]) + " " + f1(q[1]);
      if (d % 10 === 0) {
        var da = d === 0 ? 4 : d === 180 ? 176 : d, po = P(da, R - 24), pi = P(d === 0 ? 5 : d === 180 ? 175 : d, R - 42);
        out.push('<text class="gt-pout" x="' + f1(po[0]) + '" y="' + f1(po[1] + 4) + '">' + d + "</text>");
        out.push('<text class="gt-pin" x="' + f1(pi[0]) + '" y="' + f1(pi[1] + 3.5) + '">' + (180 - d) + "</text>");
      }
    }
    out.push('<path class="gt-ptick" d="' + t1 + '"/><path class="gt-ptick t10" d="' + t10 + '"/>');
    out.push('<path class="gt-ptick t10" d="M' + (cx - 6) + " " + cy + "H" + (cx + 6) + "M" + cx + " " + (cy - 6) + "V" + cy + '"/>');
    return { W: W, H: H, cx: cx, cy: cy, R: R, P: P, out: out };
  }
  function protractorRays(pr, a, b, names, c) {
    var L = pr.R + 20, pa = pr.P(a, L), pb = pr.P(b, L), s = "", nm = names || [];
    [pa, pb].forEach(function (p) {
      var ang = Math.atan2(p[1] - pr.cy, p[0] - pr.cx);
      s += '<path class="lf-stroke" d="M' + pr.cx + " " + pr.cy + "L" + f1(p[0]) + " " + f1(p[1]) + '"/>' +
        '<path class="lf-head" d="M' + f1(p[0] - 10 * Math.cos(ang - 0.42)) + " " + f1(p[1] - 10 * Math.sin(ang - 0.42)) + "L" + f1(p[0]) + " " + f1(p[1]) +
        "L" + f1(p[0] - 10 * Math.cos(ang + 0.42)) + " " + f1(p[1] - 10 * Math.sin(ang + 0.42)) + 'Z"/>';
    });
    var qa = pr.P(a, pr.R + 2), qb = pr.P(b, pr.R + 2);
    s += '<circle class="lf-dot" cx="' + pr.cx + '" cy="' + pr.cy + '" r="4.2"/>';
    if (nm[1]) s += '<text class="lf-name" x="' + pr.cx + '" y="' + (pr.cy + 20) + '" text-anchor="middle">' + esc(nm[1]) + "</text>";
    [[nm[0], a, qa], [nm[2], b, qb]].forEach(function (z) {
      if (!z[0]) return;
      var t = pr.P(z[1], pr.R + 30);
      s += '<circle class="lf-dot" cx="' + f1(z[2][0]) + '" cy="' + f1(z[2][1]) + '" r="3.6"/><text class="lf-name" x="' + f1(t[0]) + '" y="' + f1(t[1] + 5) + '" text-anchor="middle">' + esc(z[0]) + "</text>";
    });
    return '<g class="' + col(c, "orange") + '">' + s + "</g>";
  }
  GT.protractor = function (o) {
    o = o || {};
    var pr = protractorSVG(o);
    var body = pr.out.join("") + protractorRays(pr, o.a, o.b, o.names, o.c);
    var alt = o.alt || "An angle with a protractor on it.";
    return '<figure class="lf" style="max-width:' + (o.w || pr.W) + 'px"><svg class="lf-svg" viewBox="0 0 ' + pr.W + " " + pr.H + '" role="img" aria-label="' + esc(alt) + '">' +
      body + "</svg>" + (o.cap ? "<figcaption>" + fmt(o.cap) + "</figcaption>" : "") + "</figure>";
  };

  /* ================================================================ Sketch
     A drawing with points to drag. The author says where the points start
     and what may move; `draw(s)` returns GT.fig items from where they are
     now, and the whole drawing is redrawn from it on every move, so any
     measure it shows is always true of the picture.

       { type: "sketch", x, y, u, grid, axes, nums, w, cap,
         pts: { M: { at: [x, y], drag: true, snap: 0.5, name: "M", c,
                     on: { seg: [p, q] } | { line: [p, q] } | { ray: [p, q] } |
                         { circle: [centre, r], snapDeg: 1 } | { x: v } | { y: v } } },
         draw: function (s) → items,       s.M = [x, y], s.moved
         readout: function (s) → html,
         goal, check, fb, answer: { M: [x, y] }, describe }

     `ruler: { unit, div, len }` or `protractor: true` lays a ruler or a
     protractor under the drawing (see GT.ruler / GT.protractor); then the
     points are in the ruler's units along it, or in degrees round the
     protractor (the `on.circle` of a protractor point is set for you). */
  function project(p, on, s) {
    function P(v) { return typeof v === "string" ? s[v] : v; }
    if (!on) return p;
    if (on.fn) return on.fn(p, s);
    if (on.x != null) return [on.x, p[1]];
    if (on.y != null) return [p[0], on.y];
    if (on.circle) {
      var c = P(on.circle[0]), r = on.circle[1], t = Math.atan2(p[1] - c[1], p[0] - c[0]) / RAD;
      if (on.snapDeg) t = Math.round(t / on.snapDeg) * on.snapDeg;
      if (on.range) { var t2 = t < on.range[0] - 90 ? t + 360 : t; t = clamp(t2, on.range[0], on.range[1]); }
      return polar(c, r, t);
    }
    var ln = on.seg || on.line || on.ray;
    if (ln) {
      var a = P(ln[0]), b = P(ln[1]), dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
      var k = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2;
      if (on.seg) k = clamp(k, on.inset || 0, 1 - (on.inset || 0));
      if (on.ray) k = Math.max(0, k);
      return [a[0] + k * dx, a[1] + k * dy];
    }
    return p;
  }
  function snapPt(p, pt, s) {
    var on = pt.on, sn = pt.snap;
    if (on && (on.circle || on.fn)) return project(p, on, s);
    if (sn) {
      if (on && (on.seg || on.line || on.ray)) {
        // Snap the distance along the line, so a slanted line still snaps.
        var a = typeof (on.seg || on.line || on.ray)[0] === "string" ? s[(on.seg || on.line || on.ray)[0]] : (on.seg || on.line || on.ray)[0];
        var q = project(p, on, s), d = dist(a, q), b2 = typeof (on.seg || on.line || on.ray)[1] === "string" ? s[(on.seg || on.line || on.ray)[1]] : (on.seg || on.line || on.ray)[1];
        var L = dist(a, b2) || 1, sign = ((q[0] - a[0]) * (b2[0] - a[0]) + (q[1] - a[1]) * (b2[1] - a[1])) < 0 ? -1 : 1;
        var k = Math.round(sign * d / sn) * sn / L;
        return project([a[0] + k * (b2[0] - a[0]), a[1] + k * (b2[1] - a[1])], on, s);
      }
      p = [Math.round(p[0] / sn) * sn, Math.round(p[1] / sn) * sn];
    }
    return project(p, on, s);
  }
  /* A slider under a drawing: its label, its range and its value as it moves. */
  function gtSlider(label, o, onInput, onDone) {
    var row = el("label", "lw-slider");
    var name = el("span", "lw-sl-name", fmt(label));
    var input = el("input");
    input.type = "range";
    input.min = o.min; input.max = o.max; input.step = o.step || 1; input.value = o.v;
    input.setAttribute("aria-label", String(label).replace(/\$|\\[a-z]+|[{}]/g, ""));
    var val = el("span", "lw-sl-val");
    row.appendChild(name); row.appendChild(input); row.appendChild(val);
    function show() { val.innerHTML = o.show ? fmt(o.show(+input.value)) : fmt("$" + num(+input.value) + "$"); }
    input.addEventListener("input", function () { show(); onInput(+input.value); });
    if (onDone) input.addEventListener("change", function () { onDone(+input.value); });
    show();
    return { el: row, input: input, set: function (v) { input.value = v; show(); } };
  }
  /* A row of option buttons: one is on. o = { opts: [[value, label], …], v }. */
  function gtChips(label, o, onPick) {
    var row = el("div", "gt-chips"), btns = {};
    if (label) row.appendChild(el("span", "lw-sl-name", fmt(label)));
    function set(v) {
      Object.keys(btns).forEach(function (k) { btns[k].classList.toggle("on", k === String(v)); btns[k].setAttribute("aria-pressed", String(k === String(v))); });
    }
    o.opts.forEach(function (op) {
      var b = button("lw-btn", fmt(op[1]));
      btns[op[0]] = b;
      b.addEventListener("click", function () { set(op[0]); onPick(op[0]); });
      row.appendChild(b);
    });
    set(o.v);
    return { el: row, set: set };
  }

  CH.addKind("sketch", function (spec, seed, mode) {
    var api = {}, moved = false, locked = false;
    var box = el("div", "lw gt-sketch");
    var stage = el("div", "gt-stage");
    box.appendChild(stage);
    var read = el("div", "lw-read");
    var cap = spec.cap ? el("div", "gt-cap", fmt(spec.cap)) : null;
    var names = Object.keys(spec.pts || {});
    var s = {};
    names.forEach(function (k) { s[k] = spec.pts[k].at.slice(); });
    // Sliders and option buttons: s.p.k and s.c.k in draw, readout and goal.
    s.p = {}; s.c = {}; s.sel = {}; s.selList = []; s.seen = {}; s.tracked = {};
    var ctl = el("div", "gt-ctl"), sl = {}, chs = {};
    Object.keys(spec.params || {}).forEach(function (k) {
      var o = spec.params[k];
      s.p[k] = o.v;
      sl[k] = gtSlider(o.label || "$" + k + "$", o, function (v) { s.p[k] = v; moved = true; paint(); },
        function () { if (logSpec && logSpec.auto !== false) logAdd(); });
      ctl.appendChild(sl[k].el);
    });
    Object.keys(spec.chips || {}).forEach(function (k) {
      var o = spec.chips[k];
      s.c[k] = o.v; s.seen[k] = {}; s.seen[k][o.v] = true;
      chs[k] = gtChips(o.label, o, function (v) { s.c[k] = v; s.seen[k][v] = true; moved = true; paint(); });
      ctl.appendChild(chs[k].el);
    });
    ctl.hidden = !(Object.keys(sl).length + Object.keys(chs).length);
    if (spec.protractor) names.forEach(function (k) {
      var pt = spec.pts[k];
      if (!pt.on) pt.on = { circle: [[0, 0], (spec.R || 150) + 8], snapDeg: pt.snapDeg || 1, range: [0, 180] };
      s[k] = project(s[k], pt.on, s);
    });
    // The window, and the maps between it and the drawing.
    var W, H, X, Y, VX, VY, base = null, pr = null, ru = null;
    if (spec.protractor) {
      pr = protractorSVG({ R: spec.R || 150 });
      W = pr.W; H = pr.H;
      X = function (v) { return pr.cx + v * 1; }; Y = function (v) { return pr.cy - v * 1; };
      VX = function (px) { return px - pr.cx; }; VY = function (py) { return pr.cy - py; };
      base = pr.out.join("");
    } else if (spec.ruler) {
      ru = rulerSVG(Object.assign({}, spec.ruler, { room: true, seg: null }));
      W = ru.W; H = ru.H;
      var Uu = ru.X(1) - ru.X(0);
      X = function (v) { return ru.X(v); }; Y = function (v) { return ru.top - 22 - v * Uu; };
      VX = function (px) { return (px - ru.X(0)) / Uu; }; VY = function (py) { return (ru.top - 22 - py) / Uu; };
      base = ru.inner;
    } else {
      var F = frame(spec);
      W = F.W; H = F.H; X = F.X; Y = F.Y;
      VX = function (px) { return F.xr[0] + (px - F.pad) / F.u; };
      VY = function (py) { return F.yr[1] - (py - F.pad) / F.u; };
    }
    var svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });
    svg.style.maxWidth = (spec.w || W) + "px";
    svg.style.margin = "0 auto";
    stage.appendChild(svg);
    var layer = S("g", {}, svg), handles = S("g", {}, svg);
    box.appendChild(read);
    box.appendChild(ctl);
    // A table that fills as the student tries positions: what the drawing
    // showed each time, side by side, so the pattern can be seen.
    var logSpec = spec.log || null, logRows = [], logBox = logSpec ? el("div", "gt-log") : null, logBtn = null;
    if (logBox) {
      box.appendChild(logBox);
      if (logSpec.auto === false) {
        logBtn = button("lw-btn", fmt(logSpec.add || "Add this to the table"));
        logBtn.addEventListener("click", function () { logAdd(); });
        box.appendChild(logBtn);
      }
    }
    if (cap) box.appendChild(cap);

    function drawItems(items) {
      if (pr) {
        // Items in protractor space: { ray: deg, name, c } rays from the centre.
        var rays = (items || []).filter(function (it) { return it.pray != null; });
        var a = rays[0] ? rays[0].pray : 0, b = rays[1] ? rays[1].pray : 0;
        return protractorRays(pr, a, b, spec.names, spec.c);
      }
      if (ru) {
        var sg = (items || []).filter(function (it) { return it.rseg; })[0];
        if (!sg) return "";
        var r2 = rulerSVG(Object.assign({}, spec.ruler, { room: true, seg: sg.rseg, names: sg.names, c: sg.c }));
        var m = /(<g class="lf-[a-z]+">[\s\S]*<\/g>)$/.exec(r2.inner);
        return m ? m[1] : "";
      }
      return figInner(Object.assign({}, spec, { items: items, cap: null, bg: true })).inner;
    }
    function logPaint() {
      if (!logBox) return;
      var need = logSpec.need || 0, h = "<table><thead><tr>" + logSpec.cols.map(function (c) { return "<th>" + fmt(c.h) + "</th>"; }).join("") + "</tr></thead><tbody>";
      logRows.forEach(function (r) { h += "<tr" + (r.ok ? ' class="ok"' : "") + ">" + r.vals.map(function (v) { return "<td>" + fmt(v) + "</td>"; }).join("") + "</tr>"; });
      for (var i = logRows.length; i < Math.max(need, logSpec.show || 0); i++) h += '<tr class="ph">' + logSpec.cols.map(function () { return "<td>·</td>"; }).join("") + "</tr>";
      logBox.innerHTML = h + "</tbody></table>";
    }
    function logAdd() {
      if (!logSpec) return;
      var st = state();
      if (logSpec.when && !logSpec.when(st)) return;                              // a position the table is not about is not added
      var vals = logSpec.cols.map(function (c) { return c.f(st); }), key = vals.join("|");
      if (logRows.some(function (r) { return r.key === key; })) return;          // a position already in the table is not added twice
      logRows.push({ key: key, vals: vals, ok: logSpec.ok ? !!logSpec.ok(st) : false });
      if (logRows.length > (logSpec.max || 6)) logRows.shift();
      logPaint();
      if (api.onChange) api.onChange();
    }
    // What the drawing has shown so far (spec.track(s) → a key per kind of thing seen): “find all four”.
    function trackNow() { if (spec.track) { var key = spec.track(s); if (key != null) s.tracked[key] = true; } }
    var tapNames = Object.keys(spec.taps || {});
    function tapHandles() {
      tapNames.forEach(function (k) {
        var t = spec.taps[k], on = !!s.sel[k], at = typeof t.at === "function" ? t.at(s) : t.at;
        var g = S("g", { class: "gt-tap" + (on ? " on" : "") + " c-" + (t.c || "blue"), transform: "translate(" + f1(X(at[0])) + "," + f1(Y(at[1])) + ")", role: "button", tabindex: "0", "aria-pressed": String(on) }, handles);
        g.setAttribute("aria-label", (t.say || t.label || k) + (on ? ", chosen" : ""));
        S("circle", { r: t.r || 20, class: "gt-tap-c" }, g);
        var tx = S("text", { y: 5, "text-anchor": "middle", class: "gt-tap-l" }, g); tx.textContent = t.label || k;
        function flip() {
          if (locked) return;
          if (s.sel[k]) { delete s.sel[k]; s.selList = s.selList.filter(function (x) { return x !== k; }); }
          else { s.sel[k] = true; s.selList.push(k); var mx = spec.maxSel || 99; while (s.selList.length > mx) delete s.sel[s.selList.shift()]; }
          moved = true; paint();
          var again = handles.querySelector('.gt-tap[aria-label^="' + (t.say || t.label || k).replace(/"/g, "") + '"]'); if (again) again.focus();
        }
        g.dataset.tk = k;
        g.addEventListener("click", flip);
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
      });
    }
    function paint() {
      trackNow();
      var items = spec.draw ? spec.draw(s) : [];
      layer.innerHTML = (base || "") + drawItems(items);
      handles.innerHTML = "";
      tapHandles();
      names.forEach(function (k) {
        var pt = spec.pts[k];
        if (!pt.drag || locked || (pt.hide && pt.hide(s))) return;
        var g = S("g", { class: "lw-pt c-" + (pt.c || "blue"), transform: "translate(" + f1(X(s[k][0])) + "," + f1(Y(s[k][1])) + ")" }, handles);
        S("circle", { r: 20, class: "lw-hit" }, g);
        if (!moved && window.OPLO_KERN) S("circle", { r: 10, class: "gt-pulse" }, g);   // Kern: "drag me", until something has moved
        S("circle", { r: 8.5, class: "lw-dot" }, g);
        g.setAttribute("aria-label", (pt.say || "Point " + (pt.name || k)) + ". Drag it, or use the arrow keys.");
        g.setAttribute("data-k", k);
        hook(g, k);
      });
      read.innerHTML = spec.readout ? fmt(spec.readout(state())) : "";
      read.hidden = !spec.readout;
      svg.setAttribute("aria-label", spec.describe ? spec.describe(state()) : "A drawing with points you can move.");
      if (api.onChange) api.onChange();
    }
    function state() { var o = Object.assign({}, s); o.moved = moved; o.rows = logRows.length; return o; }
    function place(k, p) {
      if (!pr && !ru) {
        var xr = spec.x || [-6, 6], yr = spec.y || [-6, 6];
        p = [clamp(p[0], xr[0] + 0.2, xr[1] - 0.2), clamp(p[1], yr[0] + 0.2, yr[1] - 0.2)];
      }
      s[k] = snapPt(p, spec.pts[k], s);
      moved = true;
    }
    function hook(g, k) {
      var pt = spec.pts[k], active = false;
      g.setAttribute("tabindex", "0");
      g.classList.add("lw-drag");
      g.addEventListener("pointerdown", function (e) {
        e.preventDefault(); active = true;
        try { g.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ }
        g.classList.add("on");
        var pl = g.querySelector(".gt-pulse"); if (pl) pl.remove();
      });
      g.addEventListener("pointermove", function (e) {
        if (!active) return;
        var q = svgPt(svg, e);
        place(k, [VX(q.x), VY(q.y)]);
        g.setAttribute("transform", "translate(" + f1(X(s[k][0])) + "," + f1(Y(s[k][1])) + ")");
        trackNow();
        var items = spec.draw ? spec.draw(s) : [];
        layer.innerHTML = (base || "") + drawItems(items);
        [].forEach.call(handles.querySelectorAll(".gt-tap"), function (tg) {                // spots that follow the drawing move with it
          var t = spec.taps[tg.dataset.tk]; if (t && typeof t.at === "function") { var at = t.at(s); tg.setAttribute("transform", "translate(" + f1(X(at[0])) + "," + f1(Y(at[1])) + ")"); }
        });
        read.innerHTML = spec.readout ? fmt(spec.readout(state())) : "";
        if (api.onChange) api.onChange();
      });
      function end() {
        if (!active) return;
        active = false; g.classList.remove("on");
        paint();
        if (logSpec && logSpec.auto !== false) logAdd();
      }
      g.addEventListener("pointerup", end);
      g.addEventListener("pointercancel", end);
      g.addEventListener("keydown", function (e) {
        var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
        if (!d) return;
        e.preventDefault();
        var on = pt.on, cur = s[k];
        if (on && on.circle) {
          var c = typeof on.circle[0] === "string" ? s[on.circle[0]] : on.circle[0];
          var t = Math.atan2(cur[1] - c[1], cur[0] - c[0]) / RAD + (d[0] || d[1]) * (on.snapDeg || 1) * (e.shiftKey ? 10 : 1);
          place(k, polar(c, on.circle[1], t));
        } else {
          var st = pt.snap || (pr ? 1 : 0.1);
          if (on && (on.seg || on.line || on.ray)) {
            var ln = on.seg || on.line || on.ray, a = typeof ln[0] === "string" ? s[ln[0]] : ln[0], b = typeof ln[1] === "string" ? s[ln[1]] : ln[1];
            var L = dist(a, b) || 1, sg = (d[0] || d[1]);
            place(k, [cur[0] + sg * st * (b[0] - a[0]) / L, cur[1] + sg * st * (b[1] - a[1]) / L]);
          } else place(k, [cur[0] + d[0] * st, cur[1] + d[1] * st]);
        }
        paint();
        var again = handles.querySelector('[data-k="' + k + '"]');
        if (again) again.focus();
      });
      g.addEventListener("keyup", function (e) {
        if (logSpec && logSpec.auto !== false && /^Arrow/.test(e.key)) logAdd();
      });
    }
    paint();
    logPaint();
    api.el = box;
    api.state = state;
    api.ready = function () {
      var logOk = !(logSpec && logSpec.need) || logRows.length >= logSpec.need;
      if (spec.goal && (mode.explore || !spec.check)) return mode.explore ? (!!spec.goal(state()) && logOk) : moved || !!spec.goal(state());
      if (mode.explore) return spec.gate ? (moved && logOk) : true;
      return moved;
    };
    api.check = function () {
      var st = state();
      if (spec.check) { var r = spec.check(st); return typeof r === "object" ? r : { ok: !!r }; }
      if (spec.goal) { var ok = !!spec.goal(st); return { ok: ok, say: ok ? null : spec.fb ? spec.fb(st) : null }; }
      return { ok: true };
    };
    api.reveal = function () {
      var a = spec.answer || {};
      names.forEach(function (k) { if (a[k]) s[k] = a[k].slice(); });
      Object.keys(a.p || {}).forEach(function (k) { s.p[k] = a.p[k]; if (sl[k]) sl[k].set(a.p[k]); });
      Object.keys(a.c || {}).forEach(function (k) { s.c[k] = a.c[k]; if (chs[k]) chs[k].set(a.c[k]); });
      moved = true; locked = true;
      paint();
    };
    // For a test: put a point, a slider or an option where a hand would.
    api.put = function (k, p) { place(k, p); paint(); if (logSpec && logSpec.auto !== false) logAdd(); };
    api.setParam = function (k, v) { s.p[k] = v; if (sl[k]) sl[k].set(v); moved = true; paint(); };
    api.tap = function (k) { var el0 = handles.querySelector('.gt-tap[aria-label^="' + ((spec.taps[k] || {}).say || (spec.taps[k] || {}).label || k) + '"]'); if (el0) el0.dispatchEvent(new MouseEvent("click", { bubbles: true })); };
    api.setChip = function (k, v) { s.c[k] = v; s.seen[k][v] = true; if (chs[k]) chs[k].set(v); moved = true; paint(); };
    return api;
  });

  /* ================================================================ Solids
     A polyhedron as vertices and faces, turned and drawn flat: a face is
     seen when it faces the viewer; an edge between two faces that both
     face away is hidden, and drawn dashed, the way a textbook draws it.

       GT.poly(shape, o) → { v: [[x, y, z]…], f: [[i, j, k…]…], base: [face…] }
       shapes: prism (o.n, o.r, o.h), box (o.w, o.h, o.d), pyramid (o.n, o.r,
       o.h; o.w, o.d for a rectangle), tetra, cube, octa, dodeca, icosa. */
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cen(pts) { var c = [0, 0, 0]; pts.forEach(function (p) { c[0] += p[0] / pts.length; c[1] += p[1] / pts.length; c[2] += p[2] / pts.length; }); return c; }
  function norm(a) { var l = Math.sqrt(dot(a, a)) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  // Put each face's corners in order round it, counterclockwise seen from outside.
  function orient(v, faces) {
    var C = cen(v);
    return faces.map(function (f) {
      var pts = f.map(function (i) { return v[i]; }), c = cen(pts);
      var n = norm(sub(c, C)), a = norm(sub(pts[0], c)), b = cross(n, a);
      var ord = f.slice().sort(function (i, j) {
        var pi = sub(v[i], c), pj = sub(v[j], c);
        return Math.atan2(dot(pi, b), dot(pi, a)) - Math.atan2(dot(pj, b), dot(pj, a));
      });
      return ord;
    });
  }
  function ngon(n, r, y, rot) {
    var out = [];
    for (var i = 0; i < n; i++) { var t = (rot || 0) + 2 * Math.PI * i / n; out.push([r * Math.cos(t), y, r * Math.sin(t)]); }
    return out;
  }
  function poly(shape, o) {
    o = o || {};
    var v = [], f = [], base = [], i, n;
    if (shape === "box" || shape === "cube") {
      var w = (o.w || 2) / 2, h = (o.h || 2) / 2, d = (o.d || 2) / 2;
      if (shape === "cube") w = h = d = (o.s || 2) / 2;
      v = [[-w, -h, d], [w, -h, d], [w, h, d], [-w, h, d], [-w, -h, -d], [w, -h, -d], [w, h, -d], [-w, h, -d]];
      f = [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]];
      base = shape === "box" ? [4, 5] : [];
    } else if (shape === "prism") {
      n = o.n || 3;
      v = ngon(n, o.r || 1.2, -(o.h || 2) / 2, o.rot).concat(ngon(n, o.r || 1.2, (o.h || 2) / 2, o.rot));
      f.push(ngon(n, 0, 0).map(function (_, k) { return k; }));
      f.push(ngon(n, 0, 0).map(function (_, k) { return k + n; }));
      for (i = 0; i < n; i++) f.push([i, (i + 1) % n, (i + 1) % n + n, i + n]);
      base = [0, 1];
    } else if (shape === "pyramid") {
      if (o.w) {
        var hw = o.w / 2, hd = (o.d || o.w) / 2, yb = -(o.h || 2) / 2;
        v = [[-hw, yb, hd], [hw, yb, hd], [hw, yb, -hd], [-hw, yb, -hd]];
        n = 4;
      } else { n = o.n || 4; v = ngon(n, o.r || 1.3, -(o.h || 2) / 2, o.rot != null ? o.rot : Math.PI / n); }
      v.push([0, (o.h || 2) / 2, 0]);
      f.push(v.slice(0, n).map(function (_, k) { return k; }));
      for (i = 0; i < n; i++) f.push([i, (i + 1) % n, n]);
      base = [0];
    } else if (shape === "tetra") {
      var a = 1.1;
      v = [[a, a, a], [a, -a, -a], [-a, a, -a], [-a, -a, a]];
      f = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]];
    } else if (shape === "octa") {
      var b = 1.5;
      v = [[b, 0, 0], [-b, 0, 0], [0, b, 0], [0, -b, 0], [0, 0, b], [0, 0, -b]];
      f = [[0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2], [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5]];
    } else if (shape === "icosa" || shape === "dodeca") {
      var p = (1 + Math.sqrt(5)) / 2, sc = 0.9;
      var I = [[-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0], [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p], [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1]]
        .map(function (q) { return [q[0] * sc, q[1] * sc, q[2] * sc]; });
      var IF = [];
      for (var x = 0; x < 12; x++) for (var y = x + 1; y < 12; y++) for (var z = y + 1; z < 12; z++) {
        var e = 2 * sc + 1e-6;
        if (Math.sqrt(dot(sub(I[x], I[y]), sub(I[x], I[y]))) < e && Math.sqrt(dot(sub(I[y], I[z]), sub(I[y], I[z]))) < e && Math.sqrt(dot(sub(I[x], I[z]), sub(I[x], I[z]))) < e) IF.push([x, y, z]);
      }
      if (shape === "icosa") { v = I; f = IF; }
      else {
        // The dodecahedron is the icosahedron's dual: a corner at the middle
        // of each of its faces, a face round each of its corners.
        v = IF.map(function (t) { var c = cen(t.map(function (k) { return I[k]; })); return [c[0] * 1.25, c[1] * 1.25, c[2] * 1.25]; });
        f = I.map(function (_, k) { var out = []; IF.forEach(function (t, j) { if (t.indexOf(k) >= 0) out.push(j); }); return out; });
      }
    }
    f = orient(v, f);
    return { v: v, f: f, base: base };
  }
  GT.poly = poly;
  function edgesOf(P) {
    var map = {}, out = [];
    P.f.forEach(function (f, fi) {
      f.forEach(function (a, k) {
        var b = f[(k + 1) % f.length], key = Math.min(a, b) + "-" + Math.max(a, b);
        if (!map[key]) { map[key] = { a: a, b: b, faces: [] }; out.push(map[key]); }
        map[key].faces.push(fi);
      });
    });
    return out;
  }
  GT.counts = function (P) { return { v: P.v.length, f: P.f.length, e: edgesOf(P).length }; };
  // Turned about the vertical axis by yaw, then tipped towards the viewer by pitch.
  function turn3(p, yaw, pitch) {
    var x = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw), z = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw), y = p[1];
    var y2 = y * Math.cos(pitch) - z * Math.sin(pitch), z2 = y * Math.sin(pitch) + z * Math.cos(pitch);
    return [x, y2, z2];
  }
  function drawPoly(P, o, W, H, sc) {
    var yaw = o.yaw != null ? o.yaw : 0.55, pitch = o.pitch != null ? o.pitch : 0.38;
    var T = P.v.map(function (p) { return turn3(p, yaw, pitch); });
    var cx = W / 2, cy = H / 2;
    function X(p) { return cx + p[0] * sc; }
    function Y(p) { return cy - p[1] * sc; }
    var seen = P.f.map(function (f) {
      var n = cross(sub(T[f[1]], T[f[0]]), sub(T[f[2]], T[f[0]]));
      return n[2] > 1e-9;
    });
    var out = [], ed = edgesOf(P);
    // Faces first (only the seen ones, lightly filled), then hidden edges, then seen ones.
    P.f.forEach(function (f, i) {
      if (!seen[i]) return;
      var isBase = (P.base || []).indexOf(i) >= 0 && o.bases !== false;
      out.push('<g class="' + col(isBase ? o.baseC || "orange" : o.c || "blue") + '"><path class="gt-face' + (isBase ? " base" : "") + '" d="' +
        f.map(function (k, j) { return (j ? "L" : "M") + f1(X(T[k])) + " " + f1(Y(T[k])); }).join("") + 'Z"/></g>');
    });
    var hid = "", vis = "";
    ed.forEach(function (e) {
      var shown = e.faces.some(function (fi) { return seen[fi]; });
      var d = "M" + f1(X(T[e.a])) + " " + f1(Y(T[e.a])) + "L" + f1(X(T[e.b])) + " " + f1(Y(T[e.b]));
      if (shown) vis += d; else hid += d;
    });
    out.push('<g class="' + col(o.c || "blue") + '">' + (o.hidden === false ? "" : '<path class="gt-edge hid" d="' + hid + '"/>') + '<path class="gt-edge" d="' + vis + '"/></g>');
    if (o.names) {
      var C = cen(T), s = "";
      o.names.forEach(function (nm, k) {
        if (!nm || !T[k]) return;
        var p = T[k], dx = X(p) - X(C), dy = Y(p) - Y(C), L = Math.sqrt(dx * dx + dy * dy) || 1;
        var back = !P.f.some(function (f, i) { return seen[i] && f.indexOf(k) >= 0; });
        s += '<circle class="lf-dot" cx="' + f1(X(p)) + '" cy="' + f1(Y(p)) + '" r="' + (back ? 2.6 : 3.4) + '"' + (back ? ' opacity=".55"' : "") + "/>";
        s += '<text class="gt-vname' + (back ? " hid" : "") + '" x="' + f1(X(p) + dx / L * 15) + '" y="' + f1(Y(p) + dy / L * 15 + 5) + '" text-anchor="middle">' + esc(nm) + "</text>";
      });
      out.push('<g class="lf-ink">' + s + "</g>");
    }
    return out.join("");
  }
  // Curved solids, drawn from the front and a little above.
  function drawCurved(shape, o, W, H, sc) {
    var cx = W / 2, cy = H / 2, r = (o.r || 1.2) * sc, h = (o.h || 2.2) * sc, ry = r * 0.32, out = [], c = col(o.c || "blue");
    function ell(x, y, part, dashd) {
      if (part === "full") return '<ellipse class="lf-stroke" cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(r) + '" ry="' + f1(ry) + '"' + (dashd ? ' stroke-dasharray="5 5" opacity=".75"' : "") + "/>";
      return '<path class="lf-stroke" d="M' + f1(x - r) + " " + f1(y) + "A" + f1(r) + " " + f1(ry) + " 0 0 " + (part === "front" ? 0 : 1) + " " + f1(x + r) + " " + f1(y) + '"' +
        (dashd ? ' stroke-dasharray="5 5" opacity=".75"' : "") + "/>";
    }
    var lab = o.labels || {};
    if (shape === "cylinder") {
      var t = cy - h / 2, b = cy + h / 2;
      out.push('<path class="gt-face" d="M' + f1(cx - r) + " " + f1(t) + "L" + f1(cx - r) + " " + f1(b) + "A" + f1(r) + " " + f1(ry) + " 0 0 0 " + f1(cx + r) + " " + f1(b) + "L" + f1(cx + r) + " " + f1(t) + 'Z"/>');
      out.push('<ellipse class="gt-face base" cx="' + f1(cx) + '" cy="' + f1(t) + '" rx="' + f1(r) + '" ry="' + f1(ry) + '"/>');
      out.push(ell(cx, t, "full"), ell(cx, b, "front"), ell(cx, b, "back", true));
      out.push('<path class="lf-stroke" d="M' + f1(cx - r) + " " + f1(t) + "V" + f1(b) + "M" + f1(cx + r) + " " + f1(t) + "V" + f1(b) + '"/>');
      if (lab.r) out.push('<path class="lf-stroke" stroke-dasharray="4 4" d="M' + f1(cx) + " " + f1(t) + "H" + f1(cx + r) + '"/><circle class="lf-dot" cx="' + f1(cx) + '" cy="' + f1(t) + '" r="3"/><text class="lf-word" x="' + f1(cx + r / 2) + '" y="' + f1(t - 7) + '" text-anchor="middle">' + words(lab.r, true) + "</text>");
      if (lab.h) out.push('<text class="lf-word" x="' + f1(cx + r + 9) + '" y="' + f1(cy + 4) + '" text-anchor="start">' + words(lab.h, true) + "</text>");
    } else if (shape === "cone") {
      var ap = cy - h / 2, bb = cy + h / 2;
      // The sides touch the base ellipse where the tangent from the apex meets it.
      var k = h, x0 = r * Math.sqrt(Math.max(0, 1 - (ry * ry) / (k * k))) , y0 = bb - ry * ry / k;
      out.push('<path class="gt-face" d="M' + f1(cx) + " " + f1(ap) + "L" + f1(cx - x0) + " " + f1(y0) + "A" + f1(r) + " " + f1(ry) + " 0 0 0 " + f1(cx + x0) + " " + f1(y0) + 'Z"/>');
      out.push(ell(cx, bb, "front"), ell(cx, bb, "back", true));
      out.push('<path class="lf-stroke" d="M' + f1(cx - x0) + " " + f1(y0) + "L" + f1(cx) + " " + f1(ap) + "L" + f1(cx + x0) + " " + f1(y0) + '"/>');
      if (lab.h) out.push('<path class="lf-stroke" stroke-dasharray="4 4" d="M' + f1(cx) + " " + f1(ap) + "V" + f1(bb) + '"/><text class="lf-word" x="' + f1(cx - 7) + '" y="' + f1(cy + 10) + '" text-anchor="end">' + words(lab.h, true) + "</text>");
      if (lab.r) out.push('<path class="lf-stroke" stroke-dasharray="4 4" d="M' + f1(cx) + " " + f1(bb) + "H" + f1(cx + r) + '"/><circle class="lf-dot" cx="' + f1(cx) + '" cy="' + f1(bb) + '" r="3"/><text class="lf-word" x="' + f1(cx + r / 2) + '" y="' + f1(bb + 18) + '" text-anchor="middle">' + words(lab.r, true) + "</text>");
      if (lab.l) out.push('<text class="lf-word" x="' + f1(cx + x0 / 2 + 12) + '" y="' + f1((ap + y0) / 2) + '" text-anchor="start">' + words(lab.l, true) + "</text>");
    } else if (shape === "sphere") {
      out.push('<circle class="gt-face" cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(r) + '"/><circle class="lf-stroke" cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(r) + '"/>');
      out.push(ell(cx, cy, "front"), ell(cx, cy, "back", true));
      if (lab.r) out.push('<path class="lf-stroke" stroke-dasharray="4 4" d="M' + f1(cx) + " " + f1(cy) + "L" + f1(cx + r * 0.7) + " " + f1(cy - r * 0.7) + '"/><circle class="lf-dot" cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="3"/><text class="lf-word" x="' + f1(cx + r * 0.42) + '" y="' + f1(cy - r * 0.35 - 4) + '" text-anchor="end">' + words(lab.r, true) + "</text>");
    }
    return '<g class="' + c + '">' + out.join("") + "</g>";
  }
  /* GT.solid({ shape, n, r, h, w, d, yaw, pitch, names, labels, size, sizeH, scale, maxW, alt, cap, c })
     A still drawing of a solid. Polyhedra take the GT.poly shapes; cylinder,
     cone and sphere are drawn upright. `labels` (curved solids): { r, h, l }. */
  GT.solid = function (o) {
    o = o || {};
    var W = o.size || 220, H = o.sizeH || o.size || 220, sc = o.scale || 50, inner;
    if (o.shape === "cylinder" || o.shape === "cone" || o.shape === "sphere") inner = drawCurved(o.shape, o, W, H, sc);
    else inner = drawPoly(poly(o.shape, o), o, W, H, sc);
    var alt = o.alt || ("A " + o.shape + ".");
    return '<figure class="lf" style="max-width:' + (o.maxW || W) + 'px"><svg class="lf-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(alt) + '">' +
      '<rect class="lf-bg" width="' + W + '" height="' + H + '" rx="12"/>' + inner + "</svg>" + (o.cap ? "<figcaption>" + fmt(o.cap) + "</figcaption>" : "") + "</figure>";
  };

  /* solid3: turn a polyhedron with the pointer (or the arrow keys).
     { type: "solid3", shape, n, r, h, w, d, names, counts: true, euler,
       goal: "turn" (Continue waits for a turn), readout(s) }            */
  CH.addKind("solid3", function (spec, seed, mode) {
    var api = {}, turned = 0, yaw = spec.yaw != null ? spec.yaw : 0.55, pitch = spec.pitch != null ? spec.pitch : 0.38;
    var P = poly(spec.shape, spec), C = GT.counts(P);
    var box = el("div", "lw gt-sketch gt-solid3");
    var W = spec.size || 340, H = spec.sizeH || spec.size || 300, sc = spec.scale || 70;
    var svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", tabindex: "0" });
    svg.style.maxWidth = W + "px"; svg.style.margin = "0 auto";
    box.appendChild(svg);
    var hint = el("div", "gt-hint", "Drag the solid to turn it (or use the arrow keys).");
    box.appendChild(hint);
    var read = el("div", "lw-read");
    box.appendChild(read);
    function paint() {
      svg.innerHTML = '<rect class="lf-bg" width="' + W + '" height="' + H + '" rx="12"/>' + drawPoly(P, Object.assign({}, spec, { yaw: yaw, pitch: pitch }), W, H, sc);
      var st = { f: C.f, e: C.e, v: C.v, turned: turned };
      read.innerHTML = spec.readout ? fmt(spec.readout(st)) : spec.counts ? fmt("**" + C.f + "** faces <span class='lw-sep'>·</span> **" + C.e + "** edges <span class='lw-sep'>·</span> **" + C.v + "** vertices" +
        (spec.euler ? "<br>$F + V = " + C.f + " + " + C.v + " = " + (C.f + C.v) + "$, and $E + 2 = " + C.e + " + 2 = " + (C.e + 2) + "$" : "")) : "";
      read.hidden = !read.innerHTML;
      svg.setAttribute("aria-label", spec.describe || ("A " + spec.shape + " you can turn: " + C.f + " faces, " + C.e + " edges and " + C.v + " vertices."));
      if (api.onChange) api.onChange();
    }
    var down = null;
    svg.addEventListener("pointerdown", function (e) { down = [e.clientX, e.clientY]; svg.classList.add("on"); try { svg.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ } });
    svg.addEventListener("pointermove", function (e) {
      if (!down) return;
      yaw += (e.clientX - down[0]) * 0.012; pitch = clamp(pitch + (e.clientY - down[1]) * 0.01, -1.3, 1.3);
      turned += Math.abs(e.clientX - down[0]) + Math.abs(e.clientY - down[1]);
      down = [e.clientX, e.clientY];
      paint();
    });
    function up() { down = null; svg.classList.remove("on"); }
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", up);
    svg.addEventListener("keydown", function (e) {
      var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!d) return;
      e.preventDefault();
      yaw += d[0] * 0.2; pitch = clamp(pitch + d[1] * 0.15, -1.3, 1.3); turned += 40;
      paint();
    });
    paint();
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? turned > 60 : true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () { turned = 100; paint(); };
    return api;
  });

  /* =========================================================== Truth table
     Statements p, q, … each true or false, and what a compound statement
     built from them is, row by row.

       { type: "ttable", vars: ["p", "q"] | [{ id, say }], mode: "explore" | "fill",
         cols: [{ h: "p \\wedge q", f: function (v) { return v.p && v.q; } }, …],
         say: function (v, r) → words under the switches (explore),
         need: rows to visit before it is done (explore; default every row),
         given: [column indexes shown already (fill)] }

     explore  Switch each statement true or false. The table fills a row at a
              time, the row you have set; the rest stay “?” until you get there.
     fill     The table is there; press a cell to make it T, then F, then empty.
              Check marks the wrong cells. */
  CH.addKind("ttable", function (spec, seed, mode) {
    var api = {}, fill = spec.mode === "fill";
    var vars = (spec.vars || []).map(function (v) { return typeof v === "string" ? { id: v } : v; });
    var n = vars.length, rows = [];
    for (var i = 0; i < (1 << n); i++) { var r = {}; vars.forEach(function (v, j) { r[v.id] = !((i >> (n - 1 - j)) & 1); }); rows.push(r); }
    var box = el("div", "lw gt-tt");
    var cur = {}, visited = {}, moved = false, locked = false;
    vars.forEach(function (v) { cur[v.id] = true; });
    var TF = function (b) { return b ? "T" : "F"; };
    var hd = "";
    var sw = el("div", "gt-tt-sw");
    var swb = {};
    if (!fill) {
      vars.forEach(function (v) {
        var row = el("div", "gt-tt-var");
        row.appendChild(el("span", "gt-tt-name", fmt("$" + v.id + "$")));
        if (v.say) row.appendChild(el("span", "gt-tt-say", fmt(v.say)));
        var seg = el("div", "gt-tt-seg");
        [[true, "True"], [false, "False"]].forEach(function (o) {
          var b = button("lw-btn", o[1]);
          b.addEventListener("click", function () { cur[v.id] = o[0]; moved = true; mark(); paint(); });
          seg.appendChild(b);
          swb[v.id + (o[0] ? "T" : "F")] = b;
        });
        row.appendChild(seg);
        sw.appendChild(row);
      });
      box.appendChild(sw);
    }
    var wrap = el("div", "gt-tt-wrap"), tbl = el("table", "gt-tt-table");
    wrap.appendChild(tbl);
    box.appendChild(wrap);
    var read = el("div", "lw-read");
    box.appendChild(read);
    var cells = {};              // fill mode: the student's marks, "r:c" → true | false
    var given = {};
    (spec.given || []).forEach(function (c) { given[c] = true; });
    function rowIx(v) { for (var i = 0; i < rows.length; i++) { var ok = true; vars.forEach(function (x) { if (rows[i][x.id] !== v[x.id]) ok = false; }); if (ok) return i; } return 0; }
    function mark() { visited[rowIx(cur)] = true; }
    function value(ri, ci) { return !!spec.cols[ci].f(rows[ri]); }
    function paint() {
      var h = "<thead><tr>" + vars.map(function (v) { return '<th class="gt-tt-v">' + fmt("$" + v.id + "$") + "</th>"; }).join("") +
        spec.cols.map(function (c) { return "<th>" + fmt("$" + c.h + "$") + "</th>"; }).join("") + "</tr></thead><tbody>";
      var here = fill ? -1 : rowIx(cur);
      rows.forEach(function (r, ri) {
        h += '<tr class="' + (ri === here ? "here" : "") + '">' + vars.map(function (v) { return '<td class="gt-tt-v ' + (r[v.id] ? "t" : "f") + '">' + TF(r[v.id]) + "</td>"; }).join("");
        spec.cols.forEach(function (c, ci) {
          if (fill) {
            var k = ri + ":" + ci, mk = given[ci] ? value(ri, ci) : cells[k];
            h += '<td><button type="button" class="gt-tt-cell ' + (mk == null ? "blank" : mk ? "t" : "f") + (given[ci] ? " given" : "") + (bad[k] ? " no" : "") + '" data-k="' + k + '"' + (given[ci] || locked ? " disabled" : "") +
              ' aria-label="Row ' + (ri + 1) + ", " + c.h.replace(/\\[a-z]+/g, "") + ": " + (mk == null ? "empty" : mk ? "true" : "false") + '">' + (mk == null ? "" : TF(mk)) + "</button></td>";
          } else if (visited[ri]) {
            var v2 = value(ri, ci);
            h += '<td class="' + (v2 ? "t" : "f") + '">' + TF(v2) + "</td>";
          } else h += '<td class="q">?</td>';
        });
        h += "</tr>";
      });
      tbl.innerHTML = h + "</tbody>";
      if (fill) [].forEach.call(tbl.querySelectorAll(".gt-tt-cell"), function (b) {
        b.addEventListener("click", function () {
          var k = b.getAttribute("data-k"), c = cells[k];
          cells[k] = c == null ? true : c === true ? false : null;
          if (cells[k] == null) delete cells[k];
          delete bad[k]; moved = true; paint();
        });
      });
      else {
        vars.forEach(function (v) {
          swb[v.id + "T"].classList.toggle("on", cur[v.id] === true); swb[v.id + "F"].classList.toggle("on", cur[v.id] === false);
          swb[v.id + "T"].setAttribute("aria-pressed", String(cur[v.id] === true)); swb[v.id + "F"].setAttribute("aria-pressed", String(cur[v.id] === false));
        });
        read.innerHTML = spec.say ? fmt(spec.say(cur)) : spec.cols.map(function (c) {
          var b = !!c.f(cur);
          return fmt("$" + c.h + "$") + " is <b class='" + (b ? "t" : "f") + "'>" + (b ? "true" : "false") + "</b>";
        }).join(' <span class="lw-sep"></span> ');
      }
      read.hidden = fill;
      if (api.onChange) api.onChange();
    }
    var bad = {};
    if (!fill) mark();
    paint();
    api.el = box;
    api.visited = function () { return Object.keys(visited).length; };
    api.set = function (id, b) { cur[id] = b; moved = true; mark(); paint(); };
    api.ready = function () {
      if (fill) {
        var all = true;
        rows.forEach(function (r, ri) { spec.cols.forEach(function (c, ci) { if (!given[ci] && cells[ri + ":" + ci] == null) all = false; }); });
        return all;
      }
      return mode.explore && !spec.gate ? true : Object.keys(visited).length >= (spec.need || rows.length);
    };
    api.check = function () {
      if (!fill) return { ok: true };
      bad = {}; var nb = 0;
      rows.forEach(function (r, ri) { spec.cols.forEach(function (c, ci) { if (!given[ci] && cells[ri + ":" + ci] !== value(ri, ci)) { bad[ri + ":" + ci] = true; nb++; } }); });
      paint();
      if (!nb) { locked = true; paint(); return { ok: true }; }
      return { ok: false, say: nb === 1 ? "One cell is wrong — it is marked." : nb + " cells are wrong — they are marked." + (spec.nudge ? " " + spec.nudge : "") };
    };
    api.reveal = function () {
      if (fill) rows.forEach(function (r, ri) { spec.cols.forEach(function (c, ci) { cells[ri + ":" + ci] = value(ri, ci); }); });
      else rows.forEach(function (r, ri) { visited[ri] = true; });
      bad = {}; locked = true; paint();
    };
    return api;
  });

  /* ============================================================ Logic grid
     A puzzle of who has what. Press a cell to cross it out (×), press again
     to mark it a match (✓), again to clear it. A ✓ rules out the rest of its
     row and column, and those cells grey over by themselves — pull the ✓ off
     and they come back.

       { type: "lgrid", rows: ["Ada", …], cols: ["Cello", …], answer: [2, 0, …],
         clues: ["…", …], start: [[row, col, "x" | "v"], …] }

     answer[i] is the column that row i matches. */
  CH.addKind("lgrid", function (spec, seed, mode) {
    var api = {}, R = spec.rows, C = spec.cols, nR = R.length, nC = C.length;
    var m = [], moved = false, locked = false, bad = {};
    for (var i = 0; i < nR; i++) { m.push([]); for (var j = 0; j < nC; j++) m[i].push(""); }
    (spec.start || []).forEach(function (s0) { m[s0[0]][s0[1]] = s0[2]; });
    var box = el("div", "lw gt-lg");
    var layout = el("div", "gt-lg-row");
    var cl = el("ol", "gt-lg-clues"), used = {};
    (spec.clues || []).forEach(function (t, k) {
      var li = el("li", "", fmt(t));
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      li.setAttribute("aria-pressed", "false");
      function tog() { used[k] = !used[k]; li.classList.toggle("used", !!used[k]); li.setAttribute("aria-pressed", String(!!used[k])); }
      li.addEventListener("click", tog);
      li.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); tog(); } });
      cl.appendChild(li);
    });
    if (spec.clues && spec.clues.length) layout.appendChild(cl);
    var tbl = el("table", "gt-lg-table");
    layout.appendChild(tbl);
    box.appendChild(layout);
    var note = el("div", "gt-lg-note", spec.clues && spec.clues.length ? "Press a clue once you have used it." : "");
    note.hidden = !(spec.clues && spec.clues.length);
    box.appendChild(note);
    function hasV(i, j) { for (var a = 0; a < nC; a++) if (m[i][a] === "v" && a !== j) return true; for (var b = 0; b < nR; b++) if (m[b][j] === "v" && b !== i) return true; return false; }
    function paint() {
      var h = "<thead><tr><th></th>" + C.map(function (c) { return "<th>" + fmt(c) + "</th>"; }).join("") + "</tr></thead><tbody>";
      for (var i = 0; i < nR; i++) {
        h += "<tr><th>" + fmt(R[i]) + "</th>";
        for (var j = 0; j < nC; j++) {
          var v = m[i][j], auto = !v && hasV(i, j);
          h += '<td><button type="button" class="gt-lg-cell ' + (v === "v" ? "v" : v === "x" ? "x" : auto ? "auto" : "") + (bad[i + ":" + j] ? " no" : "") + '" data-i="' + i + '" data-j="' + j + '"' + (locked ? " disabled" : "") +
            ' aria-label="' + esc(String(R[i]).replace(/<[^>]+>|\$/g, "") + ", " + String(C[j]).replace(/<[^>]+>|\$/g, "")) + ": " + (v === "v" ? "match" : v === "x" ? "ruled out" : auto ? "ruled out by a match" : "empty") + '">' +
            (v === "v" ? "✓" : v === "x" || auto ? "×" : "") + "</button></td>";
        }
        h += "</tr>";
      }
      tbl.innerHTML = h + "</tbody>";
      [].forEach.call(tbl.querySelectorAll(".gt-lg-cell"), function (b) {
        b.addEventListener("click", function () {
          var i = +b.getAttribute("data-i"), j = +b.getAttribute("data-j");
          m[i][j] = m[i][j] === "" ? "x" : m[i][j] === "x" ? "v" : "";
          delete bad[i + ":" + j]; moved = true; paint();
          var again = tbl.querySelector('[data-i="' + i + '"][data-j="' + j + '"]'); if (again) again.focus();
        });
      });
      if (api.onChange) api.onChange();
    }
    function picks() { return m.map(function (row) { var v = -1; row.forEach(function (c, j) { if (c === "v") v = v === -1 ? j : -2; }); return v; }); }
    function solved() { var p = picks(); return p.every(function (v, i) { return v === spec.answer[i]; }); }
    paint();
    api.el = box;
    api.solved = solved;
    api.mark = function (i, j, v) { m[i][j] = v; moved = true; paint(); };
    api.ready = function () { return mode.explore ? (spec.gate ? solved() : true) : picks().every(function (v) { return v >= 0; }); };
    api.check = function () {
      var p = picks(); bad = {};
      var wrong = 0;
      p.forEach(function (v, i) { if (v >= 0 && v !== spec.answer[i]) { bad[i + ":" + v] = true; wrong++; } });
      var multi = p.some(function (v) { return v === -2; });
      paint();
      if (solved()) { locked = true; paint(); return { ok: true }; }
      if (multi) return { ok: false, say: "A row has more than one ✓. Each one matches exactly one." };
      return { ok: false, say: wrong ? (wrong === 1 ? "One match is wrong — it is marked." : wrong + " matches are wrong — they are marked.") + " Read the clues again." : "Every ✓ so far is right, but a row is still without one." };
    };
    api.reveal = function () { for (var i = 0; i < nR; i++) for (var j = 0; j < nC; j++) m[i][j] = j === spec.answer[i] ? "v" : ""; bad = {}; locked = true; paint(); };
    return api;
  });

  /* ======================================================= River crossing
     The farmer, the wolf, the goat and the cabbage. The boat holds the farmer
     and one thing. Left alone, the wolf eats the goat and the goat eats the
     cabbage. Press a thing to take it across; press the farmer to cross
     alone. Every state you reach is drawn as a vertex in a network; every
     crossing is an edge. A state where something is eaten is a dead end.

       { type: "crossing", gate: true }                                      */
  CH.addKind("crossing", function (spec, seed, mode) {
    var api = {};
    var NAMES = ["Farmer", "Wolf", "Goat", "Cabbage"], LET = ["F", "W", "G", "C"], COL = ["blue", "red", "green", "orange"];
    // A state is four bits: bit k set = thing k is on the far bank.
    function side(st, k) { return (st >> k) & 1; }
    function unsafe(st) {
      var f = side(st, 0);
      return (side(st, 1) === side(st, 2) && side(st, 1) !== f) || (side(st, 2) === side(st, 3) && side(st, 2) !== f);
    }
    function label(st) {
      var a = "", b = "";
      LET.forEach(function (l, k) { if (side(st, k)) b += l; else a += l; });
      return "(" + (a || "—") + ", " + (b || "—") + ")";
    }
    function moves(st) {
      var out = [], f = side(st, 0);
      out.push(st ^ 1);
      for (var k = 1; k < 4; k++) if (side(st, k) === f) out.push(st ^ 1 ^ (1 << k));
      return out;
    }
    var GOAL = 15, START = 0;
    // The whole network of workable states, for the “show it all” button.
    var full = {}, order = [START], seen = {}; seen[START] = 0;
    for (var q = 0; q < order.length; q++) {
      var st0 = order[q];
      full[st0] = moves(st0).filter(function (t) { return !unsafe(t); });
      full[st0].forEach(function (t) { if (seen[t] == null) { seen[t] = seen[st0] + 1; order.push(t); } });
    }
    var cur = START, path = [START], nodes = {}, edges = {}, count = 0, won = false, showAll = false, msg = "";
    nodes[START] = true;
    var box = el("div", "lw gt-cross");
    var scene = el("div", "gt-cross-scene");
    box.appendChild(scene);
    var status = el("div", "lw-read gt-cross-msg");
    box.appendChild(status);
    var bar = el("div", "gt-cross-bar");
    var undo = button("lw-btn ghost", "Undo"), reset = button("lw-btn ghost", "Start again"), all = button("lw-btn ghost", "Show the whole network");
    bar.appendChild(undo); bar.appendChild(reset); bar.appendChild(all);
    box.appendChild(bar);
    var net = el("div", "gt-cross-net");
    box.appendChild(net);
    function ek(a, b) { return Math.min(a, b) + "-" + Math.max(a, b); }
    function go(to) {
      if (won && !unsafe(cur)) return;
      if (unsafe(cur)) return;
      nodes[to] = true; edges[ek(cur, to)] = [cur, to];
      cur = to; path.push(to); count++;
      if (unsafe(cur)) msg = "bad";
      else if (cur === GOAL) { won = true; msg = "won"; }
      else msg = "";
      paint();
    }
    undo.addEventListener("click", function () { if (path.length < 2) return; path.pop(); cur = path[path.length - 1]; count = Math.max(0, count - 1); won = false; msg = ""; paint(); });
    reset.addEventListener("click", function () { cur = START; path = [START]; count = 0; won = false; msg = ""; paint(); });
    all.addEventListener("click", function () { showAll = !showAll; all.textContent = showAll ? "Hide the rest" : "Show the whole network"; paint(); });
    function tok(k, x, y, onBank) {
      var g = '<g class="gt-tok c-' + COL[k] + (onBank ? "" : " boat") + '" transform="translate(' + x + "," + y + ')" data-k="' + k + '" tabindex="0" role="button" aria-label="' + NAMES[k] + (k === 0 ? ": cross alone" : ": take across") + '">' +
        '<circle r="26" class="gt-tok-c"/><text class="gt-tok-l" y="7" text-anchor="middle">' + LET[k] + "</text><text class=\"gt-tok-n\" y=\"46\" text-anchor=\"middle\">" + NAMES[k] + "</text></g>";
      return g;
    }
    function paintScene() {
      var f = side(cur, 0), W = 620, H = 190, h = '<svg viewBox="0 0 ' + W + " " + H + '" class="gt-cross-svg" role="img" aria-label="' + esc("The farmer is on the " + (f ? "far" : "near") + " bank. " + LET.map(function (l, k) { return NAMES[k] + " is on the " + (side(cur, k) ? "far" : "near") + " bank."; }).join(" ")) + '">';
      h += '<rect x="0" y="0" width="150" height="' + H + '" class="gt-bank"/><rect x="' + (W - 150) + '" y="0" width="150" height="' + H + '" class="gt-bank"/>';
      h += '<rect x="150" y="0" width="' + (W - 300) + '" height="' + H + '" class="gt-water"/>';
      h += '<path class="gt-wave" d="M190 70q15-10 30 0t30 0t30 0M390 130q15-10 30 0t30 0t30 0M300 40q12-8 24 0t24 0"/>';
      // The boat, on the farmer's bank.
      var bx = f ? W - 150 - 118 : 150 + 18;
      h += '<path class="gt-boat" d="M' + bx + " 112h100l-16 26h-68z\"/>";
      // The things, on their banks: near bank at x 28–122, far bank at W-122.
      var slot = [0, 0], pos = [];
      for (var k = 0; k < 4; k++) {
        var b = side(cur, k);
        var idx = slot[b]++;
        pos[k] = [b ? W - 150 + 28 + (idx % 2) * 62 + 20 : 28 + (idx % 2) * 62 + 20, 36 + Math.floor(idx / 2) * 78];
      }
      for (k = 0; k < 4; k++) h += tok(k, pos[k][0], pos[k][1], true);
      h += "</svg>";
      scene.innerHTML = h;
      [].forEach.call(scene.querySelectorAll(".gt-tok"), function (g) {
        function act() {
          var k = +g.getAttribute("data-k");
          if (unsafe(cur)) return;
          if (k === 0) go(cur ^ 1); else if (side(cur, k) === side(cur, 0)) go(cur ^ 1 ^ (1 << k));
          else { msg = "far"; paint(); }
        }
        g.addEventListener("click", act);
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
      });
    }
    function paintNet() {
      // Levels: how many crossings from the start along the shortest way.
      var vs = Object.keys(showAll ? Object.assign({}, nodes, (function () { var o = {}; order.forEach(function (s0) { o[s0] = true; }); return o; })()) : nodes).map(Number);
      var lvl = {}, byL = {};
      vs.forEach(function (v) {
        var l = seen[v] != null ? seen[v] : (function () { var best = 99; Object.keys(edges).forEach(function (k) { var e = edges[k]; if (e[1] === v && seen[e[0]] != null) best = Math.min(best, seen[e[0]] + 1); if (e[0] === v && seen[e[1]] != null) best = Math.min(best, seen[e[1]] + 1); }); return best === 99 ? 1 : best; })();
        lvl[v] = l; (byL[l] = byL[l] || []).push(v);
      });
      var maxL = Math.max.apply(null, vs.map(function (v) { return lvl[v]; }).concat([0])), maxN = Math.max.apply(null, Object.keys(byL).map(function (l) { return byL[l].length; }).concat([1]));
      var W = 660, rowH = 38, H = Math.max(80, maxN * rowH + 24), pos = {};
      Object.keys(byL).forEach(function (l) {
        var arr = byL[l].sort(function (a, b) { return a - b; });
        arr.forEach(function (v, i) { pos[v] = [44 + (W - 88) * (maxL ? lvl[v] / Math.max(maxL, 7) : 0), H / 2 + (i - (arr.length - 1) / 2) * rowH]; });
      });
      var h = '<svg viewBox="0 0 ' + W + " " + H + '" class="gt-net-svg" role="img" aria-label="' + esc("A network of the states reached so far: " + vs.length + " vertices.") + '">';
      var drawn = {};
      function edge(a, b, on) { var k = ek(a, b); if (drawn[k] || !pos[a] || !pos[b]) return; drawn[k] = 1; h += '<line class="gt-edge' + (on ? " on" : "") + '" x1="' + pos[a][0] + '" y1="' + pos[a][1] + '" x2="' + pos[b][0] + '" y2="' + pos[b][1] + '"/>'; }
      if (showAll) order.forEach(function (a) { full[a].forEach(function (b) { edge(a, b, !!edges[ek(a, b)]); }); });
      Object.keys(edges).forEach(function (k) { edge(edges[k][0], edges[k][1], true); });
      vs.forEach(function (v) {
        var p = pos[v], cls = (v === cur ? " here" : "") + (unsafe(v) ? " dead" : nodes[v] ? " seen" : "") + (v === GOAL ? " goal" : "");
        h += '<g class="gt-vtx' + cls + '" transform="translate(' + p[0] + "," + p[1] + ')"><rect x="-36" y="-12" width="72" height="24" rx="12"/><text y="4.5" text-anchor="middle">' + label(v) + "</text></g>";
      });
      net.innerHTML = h + "</svg>";
    }
    function paint() {
      paintScene(); paintNet();
      status.innerHTML = msg === "bad" ? "<b class='f'>Dead end.</b> " + (side(cur, 1) === side(cur, 2) && side(cur, 1) !== side(cur, 0) ? "The wolf eats the goat." : "The goat eats the cabbage.") + " Press Undo."
        : msg === "won" ? "<b class='t'>Across!</b> " + count + " crossings. Is there a way with fewer? Press “Show the whole network”."
        : msg === "far" ? "That one is on the other bank. The farmer can only take what is with him."
        : "Crossings: " + count + (count ? "" : " · Press a thing to take it across.");
      undo.disabled = path.length < 2;
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.go = function (k) { var s0 = cur; if (k === 0) go(s0 ^ 1); else if (side(s0, k) === side(s0, 0)) go(s0 ^ 1 ^ (1 << k)); };
    api.won = function () { return won; };
    api.ready = function () { return mode.explore ? (spec.gate ? won : true) : won; };
    api.check = function () { return { ok: won, say: won ? null : "Get all four across first." }; };
    api.reveal = function () { showAll = true; all.textContent = "Hide the rest"; paint(); };
    return api;
  });

  LAB.GT = GT;
})();
