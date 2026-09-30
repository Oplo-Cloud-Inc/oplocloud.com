/* ==========================================================================
   OEdu Lab — Pathway, helpers for writing topics. See lab/pathkit.js.

   A topic's generator is `function (R, d)`: R is a seeded random source
   (LAB.rng), d is 1, 2 or 3 (easier … harder). It returns one question:

     q      the stem, with $math$ in it
     a      the answer, one of
              { k: "num",  v, lowest?, tol?, abs? }        a number
              { k: "list", v: [..], ordered?, tol?, abs? }  several numbers
              { k: "pt",   v: [x, y] }                      an ordered pair
              { k: "expr", v: "3x+2", form? }               an expression
                 form: "simp" | "fac" (with nf: how many factors) | "rad" |
                       "mono" | "posexp" | "expanded"
              { k: "eq",   v: "y=2x+3", form? }             an equation
                 form: "slope" | "std"
              { k: "rel",  v: "x>3", x? }                   an inequality
              { k: "choice", opts: [{t, why}], ok }         one of several
     walk   the worked solution: [[math, why], …]
     hint   one nudge that is not the answer
     fig    an SVG string (H.plane) shown with the question
     unit   text shown after the answer box
     fb     [{ v, say }] — a wrong number the student is likely to give, and
            the mistake it points to
     ver    () => true — an independent check of the answer, used by the
            tests only

   Everything here makes the writing of those shorter; nothing here knows what
   a student is.
   ========================================================================== */
(function () {
  "use strict";
  var LAB = window.OPLO_LAB, P = LAB && LAB.PATH;
  if (!P) return;
  var H = P.h = {};

  H.num = LAB.num;
  H.tex = LAB.num;
  H.par = function (v) { return v < 0 ? "(" + LAB.num(v) + ")" : LAB.num(v); };
  H.sg = function (v) { return v < 0 ? "- " + LAB.num(-v) : "+ " + LAB.num(v); };
  H.fr = LAB.frac;              // reduced: 6/8 → \frac{3}{4}
  /* A fraction exactly as given, not reduced, with the sign out in front. */
  H.frac = function (n, d) {
    var neg = (n < 0) !== (d < 0);
    return (neg ? "-" : "") + "\\frac{" + Math.abs(n) + "}{" + Math.abs(d) + "}";
  };
  H.frT = LAB.fracText;
  H.poly = LAB.poly;
  H.lin = LAB.lin;
  H.gcd = LAB.gcd;
  H.lcm = function (a, b) { return Math.abs(a * b) / LAB.gcd(a, b); };
  H.sqrt = function (n) { return "\\sqrt{" + n + "}"; };
  /* c·v with the 1s and 0s a person leaves out: 1x → x, −1x → −x. */
  H.term = function (c, v) { return LAB.poly([[c, v]]); };
  /* a sum of terms as text for a typed answer: "3x+2" */
  H.typed = function (terms) { return LAB.poly(terms).replace(/\s+/g, ""); };

  /* Independent checks for the tests: does this value solve this equation? */
  H.holds = function (eqText, env) {
    var r = LAB.parseRel(eqText), a = LAB.evalTree(r.sides[0], env), b = LAB.evalTree(r.sides[1], env);
    return Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
  };
  H.same = function (a, b) { return LAB.equivalent(LAB.parse(a), LAB.parse(b)); };
  H.val = function (expr, env) { return LAB.evalTree(LAB.parse(expr), env || {}); };

  /* One right choice and wrong ones that each know why they are wrong.
     wrongs: [[text, why], …]. Duplicates of the right answer are dropped. */
  H.choice = function (R, right, wrongs, o) {
    var seen = {}, list = [{ t: right, ok: true }];
    seen[String(right)] = 1;
    wrongs.forEach(function (w) {
      var t = Array.isArray(w) ? w[0] : w.t, why = Array.isArray(w) ? w[1] : w.why;
      if (seen[String(t)]) return;
      seen[String(t)] = 1;
      list.push({ t: t, why: why || "" });
    });
    if (o && o.max && list.length > o.max) list = [list[0]].concat(R.shuffle(list.slice(1)).slice(0, o.max - 1));
    var order = o && o.keep ? list : R.shuffle(list);
    var ix = 0;
    order.forEach(function (x, i) { if (x.ok) ix = i; });
    return { k: "choice", opts: order.map(function (x) { return { t: x.t, why: x.why || "" }; }), ok: ix };
  };

  /* A coordinate plane. o: { x: [-6, 6], y: [-6, 6], pts: [{ x, y, l, c }],
     lines: [{ m, b } | { x1, y1, x2, y2 }, c], size } */
  H.plane = function (o) {
    var xr = o.x || [-6, 6], yr = o.y || [-6, 6], S = o.size || 240;
    var cw = S / (xr[1] - xr[0]), ch = S / (yr[1] - yr[0]);
    function X(v) { return +(((v - xr[0]) * cw)).toFixed(2); }
    function Y(v) { return +(((yr[1] - v) * ch)).toFixed(2); }
    var s = '<svg class="pw-plane" viewBox="-22 -14 ' + (S + 44) + " " + (S + 34) + '" role="img" aria-label="' + (o.label || "A coordinate plane") + '">';
    var i;
    for (i = Math.ceil(xr[0]); i <= xr[1]; i++) s += '<line class="g" x1="' + X(i) + '" y1="0" x2="' + X(i) + '" y2="' + S + '"/>';
    for (i = Math.ceil(yr[0]); i <= yr[1]; i++) s += '<line class="g" x1="0" y1="' + Y(i) + '" x2="' + S + '" y2="' + Y(i) + '"/>';
    s += '<line class="ax" x1="0" y1="' + Y(0) + '" x2="' + S + '" y2="' + Y(0) + '"/><line class="ax" x1="' + X(0) + '" y1="0" x2="' + X(0) + '" y2="' + S + '"/>';
    var step = (xr[1] - xr[0]) > 14 ? 5 : 2;
    for (i = Math.ceil(xr[0]); i <= xr[1]; i++) if (i && i % step === 0) s += '<text class="tk" x="' + X(i) + '" y="' + (S + 14) + '" text-anchor="middle">' + i + "</text>";
    for (i = Math.ceil(yr[0]); i <= yr[1]; i++) if (i && i % step === 0) s += '<text class="tk" x="-6" y="' + (Y(i) + 4) + '" text-anchor="end">' + i + "</text>";
    s += '<text class="tk" x="' + (S + 12) + '" y="' + (Y(0) + 4) + '">x</text><text class="tk" x="' + X(0) + '" y="-4" text-anchor="middle">y</text>';
    (o.lines || []).forEach(function (L) {
      var x1, y1, x2, y2;
      if (L.m != null) { x1 = xr[0]; y1 = L.m * x1 + L.b; x2 = xr[1]; y2 = L.m * x2 + L.b; }
      else { var dx = L.x2 - L.x1, dy = L.y2 - L.y1; var t0 = -60, t1 = 60; x1 = L.x1 + dx * t0; y1 = L.y1 + dy * t0; x2 = L.x1 + dx * t1; y2 = L.y1 + dy * t1; }
      // clip the segment to the box by stepping in until inside
      function clip(ax, ay, bx, by) {
        var ts = [0, 1];
        [[xr[0], 0], [xr[1], 0], [yr[0], 1], [yr[1], 1]].forEach(function (w) {
          var d = w[1] ? by - ay : bx - ax, o0 = w[1] ? ay : ax;
          if (Math.abs(d) > 1e-9) { var t = (w[0] - o0) / d; if (t > 0 && t < 1) ts.push(t); }
        });
        ts.sort(function (p, q) { return p - q; });
        var best = null;
        for (var k = 0; k < ts.length - 1; k++) {
          var tm = (ts[k] + ts[k + 1]) / 2, mx = ax + (bx - ax) * tm, my = ay + (by - ay) * tm;
          if (mx >= xr[0] - 1e-9 && mx <= xr[1] + 1e-9 && my >= yr[0] - 1e-9 && my <= yr[1] + 1e-9) {
            var seg = [ax + (bx - ax) * ts[k], ay + (by - ay) * ts[k], ax + (bx - ax) * ts[k + 1], ay + (by - ay) * ts[k + 1]];
            if (!best || (ts[k + 1] - ts[k]) > best.len) best = { seg: seg, len: ts[k + 1] - ts[k] };
          }
        }
        return best && best.seg;
      }
      var seg = clip(x1, y1, x2, y2);
      if (seg) s += '<line class="ln' + (L.c ? " " + L.c : "") + '" x1="' + X(seg[0]) + '" y1="' + Y(seg[1]) + '" x2="' + X(seg[2]) + '" y2="' + Y(seg[3]) + '"/>';
    });
    (o.pts || []).forEach(function (p) {
      s += '<circle class="pt' + (p.c ? " " + p.c : "") + '" cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="4.5"/>';
      if (p.l) s += '<text class="pl" x="' + (X(p.x) + 8) + '" y="' + (Y(p.y) - 7) + '">' + p.l + "</text>";
    });
    return s + "</svg>";
  };

  /* What a step of working looks like when typed into a walk. */
  H.eqtex = function (a, b, v) { return LAB.lin(a, b, v || "x"); };
})();
