/* ==========================================================================
   Grade 1 Math on Kern — where things are. See lab/k1kit.js.

   No page in this file. It answers three questions about a picture:

     Is the cat ON the table, UNDER it, INSIDE the box?   (REL)
     What is true of it right now?                        (which)
     Where would it have to be for a word to be true?     (solve)

   and it holds the words themselves: one colour and one small diagram for
   each, so "on" looks the same in every lesson. Everything here works on
   plain numbers, so it is tested without a browser (t/geom-test.js).

   A placed thing is { x, y, w, h, s, zones, rests } in scene units, where
   (x, y) is its top left. Zones come from the sprite (lab/k1art.js) and are
   moved and scaled with the thing:
     { rect: [x, y, w, h] }      a region      — "inside", "under", a rack
     { line: [x1, x2, y] }       a surface     — "on"
   ========================================================================== */
(function (root) {
  "use strict";

  /* ------------------------------------------------------------- Placing */
  function zoneTo(z, x, y, s) {
    if (!z) return null;
    if (z.rect) return { rect: [x + z.rect[0] * s, y + z.rect[1] * s, z.rect[2] * s, z.rect[3] * s] };
    if (z.line) return { line: [x + z.line[0] * s, x + z.line[1] * s, y + z.line[2] * s] };
    return null;
  }
  // A sprite put at (x, y) with scale s.
  function place(sprite, x, y, s) {
    s = s || 1;
    var T = { x: x, y: y, s: s, w: sprite.w * s, h: sprite.h * s, zones: {}, rests: [], label: sprite.label, round: !!sprite.round, tapR: sprite.tapR, hit: sprite.hit };
    Object.keys(sprite.zones || {}).forEach(function (k) {
      var z = sprite.zones[k];
      if (k === "edge") T.edge = { top: y + z.top * s, bottom: y + z.bottom * s };
      else T.zones[k] = zoneTo(z, x, y, s);
    });
    (sprite.rests || []).forEach(function (r) { T.rests.push([x + r[0] * s, x + r[1] * s, y + r[2] * s]); });
    return T;
  }
  function move(T, x, y) {
    var dx = x - T.x, dy = y - T.y;
    T.x = x; T.y = y;
    Object.keys(T.zones).forEach(function (k) {
      var z = T.zones[k];
      if (!z) return;
      if (z.rect) { z.rect[0] += dx; z.rect[1] += dy; } else { z.line[0] += dx; z.line[1] += dx; z.line[2] += dy; }
    });
    if (T.edge) { T.edge.top += dy; T.edge.bottom += dy; }
    T.rests.forEach(function (r) { r[0] += dx; r[1] += dx; r[2] += dy; });
    return T;
  }
  function cx(T) { return T.x + T.w / 2; }
  function cy(T) { return T.y + T.h / 2; }
  function bottom(T) { return T.y + T.h; }
  function overlap(a, b) {            // the area two boxes share, over the area of the first
    var w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return w > 0 && h > 0 ? (w * h) / (a.w * a.h) : 0;
  }
  function gap(a, b) {                // the distance between two boxes (0 when they touch or overlap)
    var dx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w)), dy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
    return Math.hypot(dx, dy);
  }
  function inX(I, x1, x2, slack) { var c = cx(I); return c >= x1 - (slack || 0) && c <= x2 + (slack || 0); }
  function lineOf(R, name) { var z = R.zones[name || "on"]; return z && z.line ? z.line : null; }
  function rectOf(R, name) { var z = R.zones[name]; return z && z.rect ? { x: z.rect[0], y: z.rect[1], w: z.rect[2], h: z.rect[3] } : null; }
  function topY(R) { return R.edge ? R.edge.top : R.y; }
  function botY(R) { return R.edge ? R.edge.bottom : R.y + R.h; }
  // Does I stand over (or under) R, so that "above" and "below" mean anything?
  function aligned(I, R) { var a = Math.min(I.x + I.w, R.x + R.w) - Math.max(I.x, R.x); return a > Math.min(I.w, R.w) * 0.3; }

  /* ----------------------------------------------------------- Relations
     Each takes the item I, the thing R it is measured against, and the name
     of a zone when R has more than one (a shelf's racks). */
  var REL = {};
  REL.on = function (I, R, zone) {
    var z = R.zones[zone || "on"];
    if (!z) return false;
    if (z.line) return inX(I, z.line[0], z.line[1], 6) && bottom(I) >= z.line[2] - 30 && bottom(I) <= z.line[2] + 14;
    var r = rectOf(R, zone || "on");
    return cx(I) >= r.x && cx(I) <= r.x + r.w && cy(I) >= r.y && cy(I) <= r.y + r.h;
  };
  REL.under = function (I, R, zone) {
    var r = rectOf(R, zone || "under");
    return !!r && inX(I, r.x, r.x + r.w, 0) && bottom(I) >= r.y + 24 && bottom(I) <= r.y + r.h + 16 && cy(I) >= r.y;
  };
  REL.inside = function (I, R, zone) {
    var r = rectOf(R, zone || "inside");
    return !!r && inX(I, r.x, r.x + r.w, 0) && bottom(I) >= r.y + Math.min(r.h * 0.3, 30) && bottom(I) <= r.y + r.h + 10;
  };
  REL.outside = function (I, R, zone) {
    var r = rectOf(R, zone || "box");
    if (!r) return false;
    return overlap(I, r) <= 0.08 && !REL.inside(I, R);
  };
  // The stretch a thing covers, for above and below: a named zone, or the thing itself.
  function span(R, zone) {
    var r = zone && rectOf(R, zone);
    return r ? { x: r.x, w: r.w, top: r.y, bottom: r.y + r.h, gap: 2 } : { x: R.x, w: R.w, top: topY(R), bottom: botY(R), gap: 24 };
  }
  function over(I, sp) { var a = Math.min(I.x + I.w, sp.x + sp.w) - Math.max(I.x, sp.x); return a > Math.min(I.w, sp.w) * 0.3; }
  REL.above = function (I, R, zone) { var sp = span(R, zone); return over(I, sp) && bottom(I) <= sp.top - sp.gap; };
  REL.below = function (I, R, zone) { var sp = span(R, zone); return over(I, sp) && I.y >= sp.bottom - (zone ? 4 : 6); };
  // Is the centre of I inside a named zone of R? (a smile belongs on the lower part of the face)
  REL.within = function (I, R, zone) { var r = rectOf(R, zone); return !!r && cx(I) >= r.x && cx(I) <= r.x + r.w && cy(I) >= r.y && cy(I) <= r.y + r.h; };
  // The racks of a shelf: top, middle, bottom.
  ["top", "middle", "bottom"].forEach(function (k) {
    REL[k] = function (I, R) {
      var r = rectOf(R, k);
      return !!r && inX(I, r.x, r.x + r.w, 0) && bottom(I) >= r.y + r.h * 0.35 && bottom(I) <= r.y + r.h + 12;
    };
  });
  REL.near = function (I, R) { return gap(I, R) <= 56 && !REL.inside(I, R); };
  REL.far = function (I, R) { return gap(I, R) >= 200; };

  var ORDER = ["inside", "on", "under", "top", "middle", "bottom", "below", "above"];
  // The most specific word that is true of I beside R (or null).
  function which(I, R, among) {
    var list = among || ORDER;
    for (var i = 0; i < list.length; i++) if (REL[list[i]] && REL[list[i]](I, R)) return list[i];
    return null;
  }

  /* --------------------------------------------------------------- Solve
     Where does I (w × h) go for the word to be true of R? Returns its top
     left. `n` is which of several things going to the same place this is, so
     two things in one rack do not sit on one another. `ground` is the line
     things stand on and `W` the width of the scene. */
  function solve(rel, I, R, o) {
    o = o || {};
    var n = o.n || 0, ground = o.ground, W = o.W || 640, zone = o.zone, i, r, L;
    function put(cxv, btm) { return { x: cxv - I.w / 2, y: btm - I.h }; }
    if (rel === "on") {
      L = lineOf(R, zone);
      if (L) return put((L[0] + L[1]) / 2 + (n ? (n % 2 ? 1 : -1) * Math.ceil(n / 2) * I.w * 0.9 : 0), L[2]);
      r = rectOf(R, zone || "on"); return put(r.x + r.w / 2, r.y + r.h / 2 + I.h / 2);
    }
    if (rel === "under") { r = rectOf(R, zone || "under"); return put(r.x + r.w / 2 + (n ? (n % 2 ? 1 : -1) * Math.ceil(n / 2) * I.w * 0.9 : 0), r.y + r.h - 2); }
    if (rel === "inside") { r = rectOf(R, zone || "inside"); return put(r.x + r.w / 2 + (n ? (n % 2 ? 1 : -1) * Math.ceil(n / 2) * I.w * 0.8 : 0), r.y + r.h * 0.72); }
    if (rel === "top" || rel === "middle" || rel === "bottom") {
      r = rectOf(R, rel);
      return put(r.x + r.w * 0.2 + ((n * I.w * 1.2) % (r.w * 0.7)) + I.w / 2, r.y + r.h - 4);
    }
    if (rel === "outside") {
      var rr = rectOf(R, zone || "box"), left = rr.x - I.w - 34, rightX = rr.x + rr.w + 34;
      var bx = left >= 4 ? left : Math.min(rightX, W - I.w - 4);
      return { x: bx - (n ? n * (I.w + 12) : 0), y: (ground != null ? ground : bottom(R)) - I.h };
    }
    if ((rel === "above" || rel === "below") && zone && rectOf(R, zone)) {
      r = rectOf(R, zone);
      return rel === "above" ? put(r.x + r.w / 2, r.y - 4) : put(r.x + r.w / 2, r.y + r.h + I.h + 8);
    }
    if (rel === "above") return put(cx(R) + (n ? (n % 2 ? 1 : -1) * Math.ceil(n / 2) * I.w * 1.1 : 0), topY(R) - 34);
    if (rel === "below") return put(cx(R) + (n ? (n % 2 ? 1 : -1) * Math.ceil(n / 2) * I.w * 1.1 : 0), Math.min(botY(R) + I.h + 20, (ground != null ? ground : 9999)));
    if (rel === "near") { var g = ground != null ? ground : bottom(R); return { x: Math.min(R.x + R.w + 14, W - I.w - 4), y: g - I.h }; }
    if (rel === "far") { var g2 = ground != null ? ground : bottom(R); return { x: cx(R) > W / 2 ? 8 : W - I.w - 8, y: g2 - I.h }; }
    return null;
  }

  /* ---------------------------------------------------------------- Words
     One colour, one small diagram and one plain meaning for every word the
     unit teaches. */
  var WORDS = {
    on:      { col: "#2f6df0", means: "ON means sitting on the top, touching it." },
    under:   { col: "#d9650f", means: "UNDER means down below something, hiding beneath it." },
    inside:  { col: "#1c9a52", means: "INSIDE means in the middle of something, with its sides all round." },
    outside: { col: "#8a4fe0", means: "OUTSIDE means not in it, out beside it." },
    above:   { col: "#d6336c", means: "ABOVE means higher up, with space in between." },
    below:   { col: "#0e8a9a", means: "BELOW means lower down." },
    top:     { col: "#d63a3a", means: "The TOP is the highest place." },
    centre:  { col: "#a8740a", means: "The MIDDLE is the part in the centre." },
    middle:  { col: "#a8740a", means: "The MIDDLE is between the top and the bottom." },
    bottom:  { col: "#7c5a3a", means: "The BOTTOM is the lowest place." },
    before:  { col: "#2f6df0", means: "BEFORE means earlier: nearer the front." },
    after:   { col: "#d9650f", means: "AFTER means later: farther back." },
    first:   { col: "#1c9a52", means: "FIRST means nothing comes before it." },
    last:    { col: "#8a4fe0", means: "LAST means nothing comes after it." },
    near:    { col: "#2f6df0", means: "NEAR means close by." },
    far:     { col: "#d9650f", means: "FAR means a long way off." },
    corner:  { col: "#d63a3a", means: "A CORNER is where two sides meet." },
    side:    { col: "#0e8a9a", means: "A SIDE is along the edge, away from the corners." },
    in:      { col: "#1c9a52", means: "IN means inside." },
    out:     { col: "#8a4fe0", means: "OUT means outside." }
  };
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function chip(w, text) { return '<b class="k1w k1w-' + w + '">' + (text || w) + "</b>"; }
  // "Moti is ON the table." — the relation word set as a chip.
  function sentence(item, rel, ref, plural) {
    var h = {
      on: "{I} {B} {W} {R}.", under: "{I} {B} {W} {R}.", inside: "{I} {B} {W} {R}.", outside: "{I} {B} {W} {R}.",
      above: "{I} {B} {W} {R}.", below: "{I} {B} {W} {R}.",
      top: "{I} {B} at the {W} of {R}.", middle: "{I} {B} in the {W} of {R}.", bottom: "{I} {B} at the {W} of {R}.",
      near: "{I} {B} {W} {R}.", far: "{I} {B} {W} from {R}."
    }[rel] || "{I} and {R}.";
    return cap(h.replace("{I}", item).replace("{B}", plural ? "are" : "is").replace("{W}", chip(rel)).replace("{R}", ref));
  }
  // "ON the table", "at the TOP of the cupboard": the word and what it is measured against.
  function phrase(rel, ref) {
    var h = { top: "at the {W} of {R}", middle: "in the {W} of {R}", bottom: "at the {W} of {R}", far: "{W} from {R}" }[rel] || "{W} {R}";
    return h.replace("{W}", chip(rel)).replace("{R}", ref);
  }
  // Words only, for the voice: a paragraph or line is a gap, a word set in a chip is not.
  function plain(html) {
    return String(html).replace(/<\/?(?:p|div|li|br|ul|ol|figure|figcaption)\b[^>]*>/gi, " ").replace(/<\/?span class="ch-ln"[^>]*>/g, " ").replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+([.,!?])/g, "$1").replace(/\s+/g, " ").trim();
  }

  /* A small diagram of a word: 56 × 56, the word's colour for the thing that
     moves, grey for the thing it is measured against. */
  function icon(rel) {
    var col = (WORDS[rel] || {}).col || "#2f6df0", gry = "#c9d0e0", gl = "#8d98b3";
    function slab(x, y, w, h) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" fill="' + gry + '" stroke="' + gl + '" stroke-width="2"/>'; }
    function dot(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="6" fill="' + col + '"/>'; }
    function sq(i, hot) { return '<rect x="' + (3 + i * 10.6) + '" y="24" width="8.4" height="8.4" rx="2" fill="' + (hot === 1 ? col : hot === 2 ? "#fff" : gry) + '" stroke="' + (hot === 2 ? col : gl) + '" stroke-width="' + (hot === 2 ? 2.4 : 1.4) + '"/>'; }
    var b;
    switch (rel) {
      case "on": b = slab(10, 34, 36, 10) + '<path d="M16 44V52M40 44V52" stroke="' + gl + '" stroke-width="3" stroke-linecap="round"/>' + dot(28, 27); break;
      case "under": b = slab(10, 12, 36, 10) + '<path d="M16 22V50M40 22V50" stroke="' + gl + '" stroke-width="3" stroke-linecap="round"/>' + dot(28, 40); break;
      case "inside": case "in": b = '<path d="M10 14V46Q10 50 14 50H42Q46 50 46 46V14" fill="' + gry + '" stroke="' + gl + '" stroke-width="2.4" stroke-linejoin="round"/>' + dot(28, 38); break;
      case "outside": case "out": b = '<path d="M4 14V46Q4 50 8 50H26Q30 50 30 46V14" fill="' + gry + '" stroke="' + gl + '" stroke-width="2.4" stroke-linejoin="round"/>' + dot(45, 38); break;
      case "above": b = slab(10, 38, 36, 10) + dot(28, 14); break;
      case "below": b = slab(10, 8, 36, 10) + dot(28, 42); break;
      case "top": b = slab(8, 6, 40, 12) + slab(8, 22, 40, 12) + slab(8, 38, 40, 12) + dot(28, 12); break;
      case "middle": b = slab(8, 6, 40, 12) + slab(8, 22, 40, 12) + slab(8, 38, 40, 12) + dot(28, 28); break;
      case "bottom": b = slab(8, 6, 40, 12) + slab(8, 22, 40, 12) + slab(8, 38, 40, 12) + dot(28, 44); break;
      case "before": b = sq(0, 1) + sq(1, 1) + sq(2, 2) + sq(3, 0) + sq(4, 0); break;
      case "after": b = sq(0, 0) + sq(1, 0) + sq(2, 2) + sq(3, 1) + sq(4, 1); break;
      case "first": b = sq(0, 1) + sq(1, 0) + sq(2, 0) + sq(3, 0) + sq(4, 0); break;
      case "last": b = sq(0, 0) + sq(1, 0) + sq(2, 0) + sq(3, 0) + sq(4, 1); break;
      case "centre": b = '<rect x="6" y="12" width="44" height="32" rx="3" fill="' + gry + '" stroke="' + gl + '" stroke-width="2"/>' + dot(28, 28); break;
      case "corner": b = '<rect x="6" y="12" width="44" height="32" rx="3" fill="' + gry + '" stroke="' + gl + '" stroke-width="2"/>' + dot(14, 20); break;
      case "side": b = '<rect x="6" y="12" width="44" height="32" rx="3" fill="' + gry + '" stroke="' + gl + '" stroke-width="2"/>' + dot(28, 19); break;
      case "near": b = slab(6, 24, 20, 20) + dot(36, 34); break;
      case "far": b = slab(2, 24, 16, 20) + dot(46, 34); break;
      default: b = dot(28, 28);
    }
    return '<svg viewBox="0 0 56 56" aria-hidden="true">' + b + "</svg>";
  }

  var API = { place: place, move: move, cx: cx, cy: cy, bottom: bottom, overlap: overlap, gap: gap, REL: REL, which: which, solve: solve, WORDS: WORDS, chip: chip, sentence: sentence, phrase: phrase, plain: plain, icon: icon, cap: cap, ORDER: ORDER };
  root.OPLO_K1GEOM = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
