/* ==========================================================================
   Grade 1 Math on Kern — the pictures. See lab/k1kit.js.

   Every picture in the Grade 1 course is drawn here, as plain SVG, in one
   flat style: soft shapes, a thin darker line, a small palette. Nothing is a
   file; nothing is borrowed from the textbook the course follows.

   A sprite is a function from options to
     { w, h,            its box, in its own units (the top left is 0, 0)
       back, front,     SVG for the layer behind and in front of anything
                        that is placed "inside" it (a basket's far rim and
                        its near wall: a ball between the two is in the basket)
       zones }          where things can be on / under / inside it — the
                        lines and rectangles the kit measures a child's drop
                        against (see k1kit.js, REL)
   Zones carry names, never numbers a lesson has to know.
   ========================================================================== */
window.OPLO_K1ART = (function () {
  "use strict";

  /* ------------------------------------------------------------ Palette */
  var C = {
    ink: "#2b2d42", line: "rgba(43,45,66,.34)", lineS: "rgba(43,45,66,.2)",
    wall: "#fff0d6", wallD: "#f6e0b8", floor: "#e9c48f", floorD: "#d9ab70",
    wood: "#d2954f", woodD: "#a9712f", woodL: "#e8b678",
    red: "#e8505b", redD: "#bf3943", orange: "#ff9244", orangeD: "#d96d1f", yellow: "#ffd23f", yellowD: "#e0a91d",
    green: "#47b872", greenD: "#2f8f55", leaf: "#82d46f", leafD: "#5bb552", blue: "#4a8cff", blueD: "#2f67d1",
    sky: "#cbe8ff", skyD: "#a9d6fb", purple: "#8a63f0", purpleD: "#6b46d1", pink: "#ff8fb7", pinkL: "#ffd3e3",
    white: "#ffffff", fur: "#ffffff", furD: "#e4e9f5", grass: "#a6df8f", grassD: "#86cb74", hill: "#8fd47c",
    stone: "#a9b0bf", stoneD: "#8a92a4", stoneL: "#c8ceda", cream: "#fff6e6", navy: "#1a2a7a", saffron: "#ff9933", flag: "#138808",
    skin: ["#8d5a34", "#c68642", "#e0ac69", "#f1c27d"], hair: "#2a2018"
  };
  var S = ' stroke="' + C.line + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"';
  var N = ' stroke="none"';

  /* ---------------------------------------------------------- Builders */
  function rect(x, y, w, h, rx, fill, ex) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 0) + '" fill="' + fill + '"' + (ex == null ? S : ex) + "/>"; }
  function circ(x, y, r, fill, ex) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + (ex == null ? S : ex) + "/>"; }
  function ell(x, y, rx, ry, fill, ex) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (ex == null ? S : ex) + "/>"; }
  function path(d, fill, ex) { return '<path d="' + d + '" fill="' + (fill || "none") + '"' + (ex == null ? S : ex) + "/>"; }
  function poly(pts, fill, ex) { return '<polygon points="' + pts + '" fill="' + fill + '"' + (ex == null ? S : ex) + "/>"; }
  function line(x1, y1, x2, y2, col, w, ex) { return '<path d="M' + x1 + " " + y1 + "L" + x2 + " " + y2 + '" fill="none" stroke="' + col + '" stroke-width="' + (w || 2) + '" stroke-linecap="round"' + (ex || "") + "/>"; }
  function g(inner, tr) { return "<g" + (tr ? ' transform="' + tr + '"' : "") + ">" + inner + "</g>"; }
  // A stroke drawn twice, so it has a thin outline: a tail, a handle, a rope.
  function tube(d, w, fill, out) { return path(d, "none", ' stroke="' + (out || C.line) + '" stroke-width="' + (w + 4) + '" stroke-linecap="round"') + path(d, "none", ' stroke="' + fill + '" stroke-width="' + w + '" stroke-linecap="round"'); }

  var ART = {};

  /* ============================================================ Moti
     A white furry cat with a red collar and a gold bell. 120 × 124. */
  ART.cat = function (o) {
    o = o || {};
    var fur = o.fur || C.fur, shade = C.furD;
    var tail = "M88 112 C 122 112 124 80 110 66";
    var b =
      tube(tail, 14, fur) +
      // body and belly
      path("M26 120 C 14 118 16 84 32 70 C 44 60 76 60 88 70 C 104 84 106 118 94 120 Z", fur) +
      path("M42 118 C 40 100 46 86 60 86 C 74 86 80 100 78 118 Z", shade, N) +
      // front paws
      ell(46, 118, 12, 7, fur) + ell(74, 118, 12, 7, fur) +
      line(44, 121, 44, 117, C.lineS, 1.6) + line(49, 121, 49, 117, C.lineS, 1.6) + line(71, 121, 71, 117, C.lineS, 1.6) + line(76, 121, 76, 117, C.lineS, 1.6) +
      // ears
      path("M28 36 L30 8 Q31 5 34 7 L52 22 Z", fur) + path("M92 36 L90 8 Q89 5 86 7 L68 22 Z", fur) +
      path("M33 30 L34 15 L46 24 Z", C.pink, N) + path("M87 30 L86 15 L74 24 Z", C.pink, N) +
      // head, wider at the cheeks, with two fur tufts
      path("M60 20 C 86 20 98 34 98 50 C 98 62 92 70 82 72 L86 77 L76 74 C 70 76 50 76 44 74 L34 77 L38 72 C 28 70 22 62 22 50 C 22 34 34 20 60 20 Z", fur) +
      // collar and bell
      path("M40 70 Q60 80 80 70 L80 78 Q60 88 40 78 Z", C.red) + circ(60, 86, 6, C.yellow, ' stroke="' + C.yellowD + '" stroke-width="2"') + line(60, 82, 60, 90, C.yellowD, 1.6) +
      // face
      ell(46, 49, 5, 7, C.ink, N) + ell(74, 49, 5, 7, C.ink, N) + circ(47.8, 46.6, 1.9, "#fff", N) + circ(75.8, 46.6, 1.9, "#fff", N) +
      ell(37, 59, 6, 3.6, C.pinkL, N) + ell(83, 59, 6, 3.6, C.pinkL, N) +
      path("M56 57 H64 L60 62 Z", C.pink, ' stroke="#e46f9a" stroke-width="1.4" stroke-linejoin="round"') +
      path("M60 62 Q60 67 54 67 M60 62 Q60 67 66 67", "none", ' stroke="#b25a7a" stroke-width="1.8" stroke-linecap="round"') +
      line(24, 58, 8, 54, C.stoneL, 1.8) + line(24, 63, 8, 64, C.stoneL, 1.8) + line(96, 58, 112, 54, C.stoneL, 1.8) + line(96, 63, 112, 64, C.stoneL, 1.8);
    return { w: 124, h: 124, back: b, front: "", label: o.label || "Moti", article: "", zones: {}, tapR: 52 };
  };

  /* A ball: red with a white band. 56 × 56. */
  ART.ball = function (o) {
    o = o || {};
    var col = o.colour || C.red, dark = o.dark || C.redD;
    var b = circ(28, 28, 26, col) + path("M5 20 Q28 34 51 20 L53 28 Q28 44 3 28 Z", "#fff", N) + path("M2 36 Q28 52 54 36", "none", ' stroke="' + dark + '" stroke-width="3" opacity=".45" stroke-linecap="round"') +
      ell(19, 15, 7, 4, "rgba(255,255,255,.55)", N) + circ(28, 28, 26, "none");
    return { w: 56, h: 56, back: b, front: "", label: o.label || "the ball", zones: {}, round: true };
  };

  /* A table, seen from the side. 200 × 130. */
  ART.table = function (o) {
    o = o || {};
    var b =
      rect(26, 40, 16, 88, 4, C.woodD) + rect(158, 40, 16, 88, 4, C.woodD) +
      rect(14, 34, 172, 14, 3, C.wood) +
      rect(0, 8, 200, 28, 8, C.woodL) + path("M8 14 H192", "none", ' stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linecap="round"') +
      rect(0, 8, 200, 28, 8, "none");
    return { w: 200, h: 130, back: b, front: "", label: o.label || "the table",
      zones: { on: { line: [8, 192, 8] }, under: { rect: [46, 50, 108, 78] }, edge: { top: 8, bottom: 36 } } };
  };

  /* A bed, seen from the side, high enough to hide under. 250 × 190. */
  ART.bed = function (o) {
    o = o || {};
    var b =
      rect(10, 126, 16, 62, 3, C.woodD) + rect(224, 126, 16, 62, 3, C.woodD) +
      rect(0, 34, 22, 154, 5, C.wood) + rect(228, 92, 22, 96, 5, C.wood) +
      rect(10, 104, 230, 22, 3, C.wood) +
      rect(16, 76, 218, 32, 10, "#fff6e6") +
      rect(26, 62, 62, 24, 10, "#ffffff") +
      path("M98 76 H226 Q234 76 234 84 V104 Q234 108 228 108 H98 Z", C.blue) +
      path("M112 76 V108 M132 76 V108 M152 76 V108 M172 76 V108 M192 76 V108 M212 76 V108", "none", ' stroke="rgba(255,255,255,.28)" stroke-width="4"');
    return { w: 250, h: 190, back: b, front: "", label: o.label || "the bed",
      zones: { on: { line: [24, 226, 76] }, under: { rect: [30, 128, 190, 60] }, edge: { top: 76, bottom: 126 } } };
  };

  /* A tree with a round crown. 230 × 290. Things in the leaves are "on" the tree. */
  ART.tree = function (o) {
    o = o || {};
    var b =
      path("M98 288 C 104 250 104 212 100 170 L134 170 C 130 212 130 250 138 288 Z", C.woodD) +
      path("M118 200 L146 176 M114 224 L92 200", "none", ' stroke="' + C.woodD + '" stroke-width="9" stroke-linecap="round"') +
      circ(60, 118, 52, C.leafD) + circ(172, 118, 52, C.leafD) + circ(116, 62, 58, C.leafD) + circ(116, 136, 62, C.leafD) +
      circ(60, 108, 42, C.leaf, N) + circ(170, 108, 42, C.leaf, N) + circ(116, 54, 48, C.leaf, N) + circ(116, 126, 52, C.leaf, N) +
      circ(88, 40, 8, "rgba(255,255,255,.35)", N) + circ(150, 96, 7, "rgba(255,255,255,.3)", N) + circ(52, 100, 7, "rgba(255,255,255,.3)", N) + circ(122, 150, 8, "rgba(255,255,255,.25)", N);
    return { w: 230, h: 290, back: b, front: "", label: o.label || "the tree",
      zones: { on: { rect: [30, 20, 170, 150] }, under: { rect: [10, 186, 210, 100] }, edge: { top: 8, bottom: 180 } } };
  };

  /* A little bird. 60 × 50. */
  ART.bird = function (o) {
    o = o || {};
    var col = o.colour || C.blue, dark = o.dark || C.blueD;
    var b =
      path("M8 24 Q-6 14 -4 30 Q0 34 12 32 Z", dark, N) +
      ell(28, 30, 22, 17, col) + ell(30, 36, 14, 9, "#fff6e6", N) +
      circ(42, 18, 13, col) + path("M54 17 L64 21 L54 25 Z", C.yellow, ' stroke="' + C.yellowD + '" stroke-width="1.5" stroke-linejoin="round"') +
      circ(44, 15, 2.8, C.ink, N) + circ(45, 14, 1, "#fff", N) +
      path("M14 28 Q26 20 38 32 Q28 42 14 28 Z", dark, N) +
      line(26, 46, 26, 50, C.yellowD, 2.6) + line(34, 46, 34, 50, C.yellowD, 2.6);
    return { w: 64, h: 50, back: b, front: "", label: o.label || "the bird", zones: {} };
  };

  /* A wicker basket, open at the top. 180 × 110. Back rim and inside, then the near wall. */
  ART.basket = function (o) {
    o = o || {};
    var back =
      ell(90, 18, 84, 16, "#8a5a2b") + ell(90, 22, 78, 12, "#5e3b1a", N);
    var weave = "";
    for (var i = 0; i < 5; i++) weave += path("M" + (14 + i * 2) + " " + (36 + i * 14) + " H" + (166 - i * 2), "none", ' stroke="rgba(0,0,0,.14)" stroke-width="2"');
    for (var j = 0; j < 9; j++) weave += path("M" + (26 + j * 16) + " 32 V104", "none", ' stroke="rgba(0,0,0,.1)" stroke-width="2"');
    var front =
      path("M6 26 Q90 52 174 26 L160 96 Q90 114 20 96 Z", "#d9a05a") + weave +
      path("M6 26 Q90 52 174 26", "none", ' stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"');
    return { w: 180, h: 112, back: back, front: front, label: o.label || "the basket",
      zones: { inside: { rect: [18, 4, 144, 78] }, box: { rect: [0, 0, 180, 112] } } };
  };

  /* A cardboard box with its flaps open. 170 × 130. */
  ART.box = function (o) {
    o = o || {};
    var back =
      // the far flap, folded back, and the dark inside
      path("M26 26 L38 4 L132 4 L144 26 Z", "#b9803d") +
      rect(14, 22, 142, 56, 2, "#8f5a22", N) +
      // side flaps open outwards
      path("M14 26 L-2 12 L4 46 L14 50 Z", "#e3a866") + path("M156 26 L172 12 L166 46 L156 50 Z", "#e3a866");
    var front =
      rect(6, 74, 158, 52, 6, "#d9a05a") +
      rect(6, 74, 158, 14, 5, "#e8b678") +
      path("M64 98 H106 V110 H64 Z", "rgba(0,0,0,.1)", N);
    return { w: 170, h: 130, back: back, front: front, label: o.label || "the box",
      zones: { inside: { rect: [20, 30, 130, 84] }, box: { rect: [0, 4, 170, 124] } } };
  };

  /* A sitting place for things to rest on: a closed crate, on which things are "on". 150 × 100. */
  ART.crate = function (o) {
    var b = rect(4, 18, 142, 78, 8, "#d9a05a") + rect(4, 18, 142, 16, 6, "#e8b678") + path("M4 58 H146 M50 18 V96 M100 18 V96", "none", ' stroke="rgba(0,0,0,.12)" stroke-width="3"');
    return { w: 150, h: 100, back: b, front: "", label: (o && o.label) || "the box", zones: { on: { line: [10, 140, 18] }, edge: { top: 18, bottom: 96 } } };
  };

  /* A cupboard with three racks, open at the front. 300 × 290.
     The racks are the top, the middle and the bottom. */
  ART.shelf = function (o) {
    o = o || {};
    var b =
      rect(0, 0, 300, 276, 8, C.woodD) +
      rect(14, 14, 272, 248, 3, "#fff3dc", N) +
      rect(14, 14, 272, 10, 0, "rgba(0,0,0,.08)", N) +
      rect(10, 92, 280, 10, 2, C.wood) + rect(10, 180, 280, 10, 2, C.wood) +
      rect(0, 0, 300, 18, 8, C.woodL) + rect(0, 258, 300, 18, 6, C.wood) +
      rect(20, 274, 26, 14, 3, C.woodD) + rect(254, 274, 26, 14, 3, C.woodD);
    return { w: 300, h: 290, back: b, front: "", label: o.label || "the cupboard",
      zones: {
        top: { rect: [14, 24, 272, 68] }, middle: { rect: [14, 102, 272, 78] }, bottom: { rect: [14, 190, 272, 68] },
        on: { line: [10, 290, 0] }, edge: { top: 0, bottom: 276 }
      },
      rests: [[16, 284, 92], [16, 284, 180], [16, 284, 258]] };
  };

  /* A block, for a tower. 110 × 54. */
  ART.block = function (o) {
    o = o || {};
    var col = o.colour || C.red, dark = o.dark || C.redD;
    var b = rect(2, 2, 106, 50, 9, col) + rect(2, 2, 106, 14, 8, "rgba(255,255,255,.28)", N) + rect(2, 40, 106, 12, 8, "rgba(0,0,0,.14)", N) + rect(2, 2, 106, 50, 9, "none");
    return { w: 110, h: 54, back: b, front: "", label: o.label || "a block", zones: { on: { line: [6, 104, 2] }, edge: { top: 2, bottom: 52 } } };
  };

  /* A straw hat. 96 × 56. */
  ART.hat = function (o) {
    var b = ell(48, 42, 46, 12, "#e9c26b") + path("M20 40 Q20 6 48 6 Q76 6 76 40 Z", "#f2d588") + rect(20, 28, 56, 10, 2, C.red, N) +
      path("M26 14 Q34 8 44 8", "none", ' stroke="rgba(255,255,255,.7)" stroke-width="3" stroke-linecap="round"') + ell(48, 42, 46, 12, "none");
    return { w: 96, h: 56, back: b, front: "", label: (o && o.label) || "the hat", zones: { on: { line: [24, 72, 6] }, edge: { top: 6, bottom: 52 } } };
  };

  /* The sun, with a smile. 100 × 100. */
  ART.sun = function () {
    var rays = "";
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6, x1 = 50 + Math.cos(a) * 36, y1 = 50 + Math.sin(a) * 36, x2 = 50 + Math.cos(a) * 47, y2 = 50 + Math.sin(a) * 47;
      rays += line(x1.toFixed(1), y1.toFixed(1), x2.toFixed(1), y2.toFixed(1), "#ffb830", 5);
    }
    var b = rays + circ(50, 50, 30, "#ffd23f", ' stroke="#f2a81d" stroke-width="2"') + circ(40, 45, 3.4, C.ink, N) + circ(60, 45, 3.4, C.ink, N) +
      path("M38 58 Q50 70 62 58", "none", ' stroke="#b86b00" stroke-width="3" stroke-linecap="round"') + ell(34, 56, 5, 3, "rgba(255,120,60,.35)", N) + ell(66, 56, 5, 3, "rgba(255,120,60,.35)", N);
    return { w: 100, h: 100, back: b, front: "", label: "the sun", zones: {} };
  };

  /* A cloud. 130 × 64. */
  ART.cloud = function () {
    var b = path("M24 58 C4 58 4 32 24 30 C24 10 52 4 62 22 C72 8 104 14 104 36 C124 34 130 58 108 58 Z", "#fff", ' stroke="#d8e6f6" stroke-width="2"');
    return { w: 130, h: 64, back: b, front: "", label: "a cloud", zones: {} };
  };

  /* A yellow car with a window to sit in. 250 × 120. */
  ART.car = function (o) {
    o = o || {};
    var back =
      path("M52 60 L72 26 Q76 20 84 20 H156 Q166 20 172 28 L196 60 Z", "#bfe3ff", ' stroke="' + C.line + '" stroke-width="2"') +
      path("M70 60 L84 32 H116 V60 Z", "#e6f4ff", N) + path("M122 60 V32 H156 L176 60 Z", "#e6f4ff", N);
    var front =
      path("M10 90 V68 Q10 58 22 56 L52 54 Q58 52 62 46 L72 28 Q76 22 84 22 H158 Q166 22 172 30 L196 58 L226 62 Q242 64 242 80 V90 Z M72 60 L84 32 H118 V60 Z M124 60 V32 H156 L176 60 Z", C.yellow, ' fill-rule="evenodd" stroke="' + C.line + '" stroke-width="2" stroke-linejoin="round"') +
      path("M10 90 V68 Q10 58 22 56", "none", ' stroke="' + C.yellowD + '" stroke-width="2"') +
      rect(10, 78, 232, 14, 6, C.yellowD, N) +
      // the window, as a frame over the glass
      path("M72 60 L84 32 H118 V60 Z M124 60 V32 H156 L176 60 Z", "none", ' stroke="' + C.line + '" stroke-width="3"') +
      rect(214, 66, 22, 10, 4, "#fff6c9", N) + rect(12, 70, 14, 8, 3, "#ff7a5a", N) +
      circ(60, 94, 20, "#3a3d52") + circ(60, 94, 9, "#c8ceda") + circ(186, 94, 20, "#3a3d52") + circ(186, 94, 9, "#c8ceda");
    return { w: 250, h: 120, back: back, front: front, label: o.label || "the car",
      zones: { inside: { rect: [74, 30, 98, 30] }, on: { line: [84, 156, 20] }, box: { rect: [10, 20, 232, 94] }, edge: { top: 20, bottom: 114 } } };
  };

  /* A cave of rocks with a dark mouth. 250 × 170. */
  ART.cave = function (o) {
    var back = path("M30 168 V104 Q30 40 125 40 Q220 40 220 104 V168 Z", "#3f3a4d", N);
    var front =
      path("M0 168 Q0 70 40 54 Q60 24 100 26 Q125 14 152 28 Q196 22 212 56 Q250 74 250 168 L226 168 L222 110 Q216 46 125 44 Q36 46 28 110 L24 168 Z", C.stone) +
      path("M10 130 Q22 110 30 130 M200 52 Q218 40 236 60 M96 34 Q112 24 128 34", "none", ' stroke="rgba(255,255,255,.35)" stroke-width="4" stroke-linecap="round"') +
      ell(24, 160, 30, 12, C.stoneD, N) + ell(228, 160, 30, 12, C.stoneD, N);
    return { w: 250, h: 170, back: back, front: front, label: (o && o.label) || "the cave",
      zones: { inside: { rect: [44, 72, 162, 92] }, box: { rect: [0, 14, 250, 156] } } };
  };

  /* A brown bear, sitting. 110 × 120. */
  ART.bear = function (o) {
    o = o || {};
    var col = o.colour || "#a8683a", dark = o.dark || "#7a4624", light = "#e6bd8f";
    var b =
      circ(24, 22, 14, col) + circ(86, 22, 14, col) + circ(24, 22, 7, light, N) + circ(86, 22, 7, light, N) +
      ell(55, 92, 36, 28, col) + ell(55, 98, 22, 20, light, N) +
      ell(30, 112, 15, 8, dark) + ell(80, 112, 15, 8, dark) +
      circ(55, 46, 34, col) + ell(55, 58, 17, 13, light, N) + ell(55, 52, 6, 4.4, C.ink, N) +
      path("M55 56 V62 M47 64 Q55 70 63 64", "none", ' stroke="' + C.ink + '" stroke-width="2.4" stroke-linecap="round"') +
      circ(42, 40, 3.6, C.ink, N) + circ(68, 40, 3.6, C.ink, N) + circ(43, 39, 1.2, "#fff", N) + circ(69, 39, 1.2, "#fff", N);
    return { w: 110, h: 120, back: b, front: "", label: o.label || "the bear", zones: {} };
  };

  /* A yellow toy duck. 76 × 70. */
  ART.duck = function (o) {
    var b = ell(36, 52, 30, 16, C.yellow) + path("M60 44 Q74 36 70 26 Q66 20 58 22", "none", "") +
      circ(46, 26, 18, C.yellow) + path("M60 26 Q74 24 72 32 Q70 36 58 34 Z", C.orange, ' stroke="' + C.orangeD + '" stroke-width="1.6" stroke-linejoin="round"') +
      circ(46, 21, 3.2, C.ink, N) + circ(47, 20, 1.1, "#fff", N) + path("M16 50 Q26 40 36 52 Q26 62 16 50 Z", C.yellowD, N) + ell(48, 60, 4, 2, "rgba(255,255,255,.0)", N);
    return { w: 80, h: 70, back: b, front: "", label: (o && o.label) || "the duck", zones: {} };
  };

  /* A yellow flower head. 48 × 48. */
  ART.flower = function (o) {
    o = o || {};
    var col = o.colour || C.yellow, dark = o.dark || C.yellowD, b = "";
    for (var i = 0; i < 6; i++) {
      var a = i * Math.PI / 3 + 0.3;
      b += ell((24 + Math.cos(a) * 12).toFixed(1), (24 + Math.sin(a) * 12).toFixed(1), 10, 7, col, ' stroke="' + dark + '" stroke-width="1.6"').replace("<ellipse", '<ellipse transform="rotate(' + (a * 180 / Math.PI).toFixed(0) + " " + (24 + Math.cos(a) * 12).toFixed(1) + " " + (24 + Math.sin(a) * 12).toFixed(1) + ')"');
    }
    b += circ(24, 24, 7, C.orange, ' stroke="' + C.orangeD + '" stroke-width="1.6"');
    return { w: 48, h: 48, back: b, front: "", label: o.label || "a flower", zones: {}, round: true };
  };

  /* A dustbin with its lid tipped back. 108 × 130. */
  ART.dustbin = function (o) {
    var back = path("M8 40 L92 40 L92 120 L8 120 Z", "#2c8f6f", N) + ell(50, 42, 42, 10, "#14503f", N) +
      g(rect(-84, -7, 84, 14, 7, "#34a583") + rect(-50, -14, 24, 8, 4, "#2c8f6f"), "translate(92 38) rotate(30)");
    var front = path("M8 44 Q50 54 92 44 L86 124 Q50 130 14 124 Z", "#3aa987") + path("M22 62 V112 M42 66 V116 M62 66 V116 M78 62 V112", "none", ' stroke="rgba(0,0,0,.14)" stroke-width="3" stroke-linecap="round"') +
      rect(4, 40, 92, 8, 4, "#2c8f6f");
    return { w: 108, h: 130, back: back, front: front, label: (o && o.label) || "the dustbin",
      zones: { inside: { rect: [14, 40, 72, 70] }, box: { rect: [4, 8, 92, 122] } } };
  };

  /* A crumpled ball of paper. 40 × 40. */
  ART.paper = function () {
    var b = path("M8 24 L12 10 L24 4 L34 12 L36 26 L26 36 L12 34 Z", "#f4f6fb") + path("M12 10 L22 20 L34 12 M22 20 L26 36 M8 24 L22 20", "none", ' stroke="#b9c2d6" stroke-width="1.8" stroke-linejoin="round"');
    return { w: 42, h: 40, back: b, front: "", label: "the paper", zones: {}, round: true };
  };

  /* The flag with three bands, a wheel in the middle, on a pole. 230 × 190.
     Top, middle and bottom are its three bands; the wheel is in the middle. */
  ART.flag = function () {
    var spokes = "";
    for (var i = 0; i < 24; i++) {
      var a = i * Math.PI / 12;
      spokes += line((120 + Math.cos(a) * 3).toFixed(1), (75 + Math.sin(a) * 3).toFixed(1), (120 + Math.cos(a) * 12.4).toFixed(1), (75 + Math.sin(a) * 12.4).toFixed(1), C.navy, 1.2);
    }
    var b =
      rect(28, 4, 6, 184, 3, "#8a6d3b") + circ(31, 6, 7, "#e9c26b", ' stroke="#b8923c" stroke-width="1.6"') +
      rect(36, 14, 186, 54, 0, C.saffron, N) + rect(36, 68, 186, 54, 0, "#ffffff", N) + rect(36, 122, 186, 54, 0, C.flag, N) +
      rect(36, 14, 186, 162, 0, "none", ' stroke="' + C.line + '" stroke-width="2"') +
      circ(129, 95, 16, "none", ' stroke="' + C.navy + '" stroke-width="2"') + circ(129, 95, 2.4, C.navy, N) + g(spokes, "translate(9 20)");
    return { w: 230, h: 190, back: b, front: "", label: "the flag",
      zones: { topband: { rect: [36, 14, 186, 54] }, midband: { rect: [36, 68, 186, 54] }, botband: { rect: [36, 122, 186, 54] }, wheel: { rect: [111, 77, 36, 36] } } };
  };

  /* A little steam engine, facing left. 170 × 126. */
  ART.engine = function () {
    var b =
      circ(116, 20, 12, "rgba(255,255,255,.9)", N) + circ(138, 8, 9, "rgba(255,255,255,.75)", N) + circ(154, -4, 6, "rgba(255,255,255,.6)", N) +
      rect(22, 34, 22, 34, 4, "#2f3347") + rect(16, 28, 34, 10, 4, "#2f3347") +
      rect(8, 52, 100, 44, 20, "#3d4260") + rect(8, 78, 100, 12, 0, C.red, N) +
      rect(100, 26, 62, 76, 8, C.red) + rect(94, 18, 76, 12, 5, C.redD) + rect(112, 40, 38, 28, 6, "#e6f4ff", ' stroke="' + C.line + '" stroke-width="2"') +
      circ(70, 50, 10, C.yellow, ' stroke="' + C.yellowD + '" stroke-width="2"') +
      path("M2 112 L24 96 L24 112 Z", "#2f3347") +
      rect(0, 100, 168, 10, 3, "#2f3347") +
      circ(36, 108, 14, "#3a3d52") + circ(36, 108, 6, "#c8ceda", N) + circ(78, 108, 14, "#3a3d52") + circ(78, 108, 6, "#c8ceda", N) + circ(138, 108, 16, "#3a3d52") + circ(138, 108, 7, "#c8ceda", N) +
      line(36, 108, 138, 108, "#c8ceda", 3);
    return { w: 170, h: 126, back: b, front: "", label: "the engine", zones: {} };
  };

  /* A bogie, any colour. 120 × 92. */
  ART.bogie = function (o) {
    o = o || {};
    var col = o.colour || C.blue, dark = o.dark || C.blueD;
    var b =
      rect(-6, 74, 12, 6, 3, "#2f3347", N) + rect(114, 74, 12, 6, 3, "#2f3347", N) +
      rect(4, 14, 112, 66, 12, col) + rect(4, 14, 112, 14, 10, dark, N) + rect(4, 66, 112, 14, 6, "rgba(0,0,0,.16)", N) +
      rect(16, 34, 24, 22, 5, "#e6f4ff", ' stroke="' + C.line + '" stroke-width="2"') + rect(48, 34, 24, 22, 5, "#e6f4ff", ' stroke="' + C.line + '" stroke-width="2"') + rect(80, 34, 24, 22, 5, "#e6f4ff", ' stroke="' + C.line + '" stroke-width="2"') +
      circ(28, 82, 11, "#3a3d52") + circ(28, 82, 5, "#c8ceda", N) + circ(92, 82, 11, "#3a3d52") + circ(92, 82, 5, "#c8ceda", N) + rect(4, 14, 112, 66, 12, "none");
    return { w: 120, h: 94, back: b, front: "", label: o.label || "a bogie", zones: {} };
  };

  /* A child, standing. 76 × 152. */
  ART.kid = function (o) {
    o = o || {};
    var skin = C.skin[(o.skin || 0) % C.skin.length], shirt = o.shirt || C.blue, shorts = o.shorts || "#3b4a8c", hair = o.hair || C.hair;
    var long = !!o.long;
    var b =
      (long ? path("M16 28 Q16 2 38 2 Q60 2 60 28 L62 62 L52 62 L52 30 L24 30 L24 62 L14 62 Z", hair) : "") +
      rect(24, 128, 12, 16, 4, "#3a3d52") + rect(40, 128, 12, 16, 4, "#3a3d52") + rect(21, 142, 18, 8, 4, "#fff") + rect(37, 142, 18, 8, 4, "#fff") +
      rect(24, 98, 12, 34, 5, skin) + rect(40, 98, 12, 34, 5, skin) +
      rect(20, 88, 36, 24, 8, shorts) +
      rect(16, 50, 44, 50, 14, shirt) + rect(16, 50, 44, 14, 10, "rgba(255,255,255,.22)", N) +
      rect(6, 54, 12, 36, 6, skin) + rect(58, 54, 12, 36, 6, skin) +
      circ(38, 30, 22, skin) +
      (long ? path("M16 28 Q16 6 38 6 Q60 6 60 28 Q50 16 38 16 Q26 16 16 28 Z", hair, N)
            : path("M16 28 Q14 4 38 4 Q62 4 60 28 Q54 14 38 14 Q22 14 16 28 Z", hair, N)) +
      circ(30, 32, 2.8, C.ink, N) + circ(46, 32, 2.8, C.ink, N) + path("M31 41 Q38 47 45 41", "none", ' stroke="' + C.ink + '" stroke-width="2.2" stroke-linecap="round"') +
      ell(24, 38, 4, 2.6, "rgba(255,120,120,.3)", N) + ell(52, 38, 4, 2.6, "rgba(255,120,120,.3)", N);
    return { w: 76, h: 152, back: b, front: "", label: o.label || "a child", zones: {}, tapR: 40 };
  };

  /* A button: colour, shape (round or square) and size (big or small) are what it can be sorted by.
     big 60 × 60, small 40 × 40. */
  ART.button = function (o) {
    o = o || {};
    var col = o.colour || C.red, dark = o.dark || C.redD, sz = o.size === "small" ? 40 : 60, k = sz / 60;
    var shape = o.shape || "round", b;
    if (shape === "square") b = rect(4, 4, 52, 52, 12, col) + rect(10, 10, 40, 40, 8, "none", ' stroke="' + dark + '" stroke-width="2.4" opacity=".55"');
    else b = circ(30, 30, 27, col) + circ(30, 30, 19, "none", ' stroke="' + dark + '" stroke-width="2.4" opacity=".55"');
    b += circ(22, 23, 3.8, C.ink, N) + circ(38, 23, 3.8, C.ink, N) + circ(22, 37, 3.8, C.ink, N) + circ(38, 37, 3.8, C.ink, N) + path("M22 23 L38 37 M38 23 L22 37", "none", ' stroke="' + dark + '" stroke-width="1.6" opacity=".7"') +
      ell(18, 14, 8, 3.4, "rgba(255,255,255,.4)", N);
    return { w: sz, h: sz, back: g(b, "scale(" + k + ")"), front: "", label: o.label || "a button", zones: {}, round: shape === "round" };
  };

  /* A leaf. 60 × 40. */
  ART.leaf = function (o) {
    o = o || {};
    var b = path("M4 34 Q8 6 56 6 Q54 34 4 34 Z", o.colour || C.leaf, ' stroke="' + C.greenD + '" stroke-width="2" stroke-linejoin="round"') + path("M4 34 Q26 22 52 10", "none", ' stroke="' + C.greenD + '" stroke-width="2" stroke-linecap="round"') +
      path("M22 25 L24 14 M34 20 L36 12 M30 24 L34 30", "none", ' stroke="' + C.greenD + '" stroke-width="1.4" opacity=".7" stroke-linecap="round"');
    return { w: 62, h: 40, back: b, front: "", label: o.label || "a leaf", zones: {} };
  };

  /* A pebble. 50 × 36. */
  ART.pebble = function (o) {
    var b = path("M4 26 Q2 8 22 6 Q46 4 48 24 Q48 34 28 34 Q6 36 4 26 Z", "#aab1c2", ' stroke="#7c8499" stroke-width="2"') + path("M14 14 Q22 10 30 12", "none", ' stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linecap="round"') + circ(34, 24, 1.6, "#7c8499", N) + circ(20, 26, 1.4, "#7c8499", N);
    return { w: 52, h: 38, back: b, front: "", label: (o && o.label) || "a pebble", zones: {} };
  };

  /* A piece of chalk. 64 × 22. */
  ART.chalk = function (o) {
    var b = rect(3, 4, 58, 15, 7, "#fdfdfb") + rect(3, 4, 58, 15, 7, "none") + path("M10 8 H46", "none", ' stroke="#dfe3ea" stroke-width="2.4" stroke-linecap="round"') + path("M52 5 Q60 11 52 18", "none", ' stroke="#cfd5df" stroke-width="2"');
    return { w: 66, h: 22, back: b, front: "", label: (o && o.label) || "a chalk", zones: {} };
  };

  /* A face to finish: eyes and a nose, and nothing else. 220 × 250.
     The eyebrows go above the eyes; the smile goes below the nose. */
  ART.face = function (o) {
    o = o || {};
    var skin = C.skin[(o.skin == null ? 2 : o.skin) % C.skin.length];
    var b =
      path("M6 90 Q6 8 110 8 Q214 8 214 90 Q214 150 190 150 L30 150 Q6 150 6 90 Z", C.hair, N) +
      ell(16, 126, 14, 20, skin) + ell(204, 126, 14, 20, skin) +
      path("M20 86 Q20 22 110 22 Q200 22 200 86 L200 150 Q200 238 110 240 Q20 238 20 150 Z", skin) +
      path("M18 80 Q16 18 110 16 Q204 18 202 80 Q184 40 110 44 Q36 40 18 80 Z", C.hair, N) +
      path("M60 112 Q76 96 94 112 Q76 126 60 112 Z", "#fff", ' stroke="' + C.line + '" stroke-width="2"') + path("M126 112 Q144 96 160 112 Q144 126 126 112 Z", "#fff", ' stroke="' + C.line + '" stroke-width="2"') +
      circ(77, 111, 8, C.ink, N) + circ(143, 111, 8, C.ink, N) + circ(80, 108, 2.6, "#fff", N) + circ(146, 108, 2.6, "#fff", N) +
      path("M110 128 Q100 154 112 158 Q120 158 122 152", "none", ' stroke="rgba(120,60,20,.6)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"') +
      ell(52, 160, 14, 8, "rgba(255,120,120,.26)", N) + ell(168, 160, 14, 8, "rgba(255,120,120,.26)", N);
    return { w: 220, h: 250, back: b, front: "", label: o.label || "the face",
      zones: { eyes: { rect: [56, 96, 108, 32] }, nose: { rect: [96, 126, 28, 36] }, forehead: { rect: [40, 40, 140, 50] }, chin: { rect: [60, 170, 100, 60] }, upper: { rect: [24, 20, 172, 100] }, lower: { rect: [30, 150, 160, 92] } } };
  };
  /* Eyebrows, a pair. 120 × 26. */
  ART.brows = function () {
    var b = path("M6 20 Q22 4 50 12", "none", ' stroke="' + C.hair + '" stroke-width="9" stroke-linecap="round"') + path("M70 12 Q98 4 114 20", "none", ' stroke="' + C.hair + '" stroke-width="9" stroke-linecap="round"');
    return { w: 120, h: 26, back: b, front: "", label: "the eyebrows", zones: {}, hit: 14 };
  };
  /* A smile. 84 × 36. */
  ART.smile = function () {
    var b = path("M6 8 Q42 44 78 8 Q42 24 6 8 Z", "#d9435a", ' stroke="#a82b40" stroke-width="3" stroke-linejoin="round"');
    return { w: 84, h: 38, back: b, front: "", label: "the smile", zones: {}, hit: 14 };
  };

  /* A head, for a passenger at a window. 46 × 46. */
  ART.head = function (o) {
    o = o || {};
    var skin = C.skin[(o.skin || 0) % C.skin.length], hair = o.hair || C.hair;
    var b = (o.long ? path("M3 26 Q3 2 23 2 Q43 2 43 26 L45 44 L36 44 L36 26 L10 26 L10 44 L1 44 Z", hair) : "") + circ(23, 25, 19, skin) +
      path("M4 24 Q4 4 23 4 Q42 4 42 24 Q36 12 23 12 Q10 12 4 24 Z", hair, N) +
      circ(16, 28, 2.4, C.ink, N) + circ(30, 28, 2.4, C.ink, N) + path("M17 35 Q23 40 29 35", "none", ' stroke="' + C.ink + '" stroke-width="2" stroke-linecap="round"');
    return { w: 46, h: 46, back: b, front: "", label: o.label || "the girl", zones: {}, round: true };
  };

  /* A child sitting on the ground, reading. 96 × 96. */
  ART.kidsit = function (o) {
    o = o || {};
    var skin = C.skin[(o.skin || 0) % C.skin.length], shirt = o.shirt || C.orange, shorts = o.shorts || "#3b4a8c", hair = o.hair || C.hair;
    var b =
      rect(12, 62, 70, 16, 8, shorts) + rect(70, 62, 22, 16, 8, skin) + rect(78, 66, 16, 12, 5, "#fff") +
      rect(14, 34, 40, 40, 14, shirt) + rect(14, 34, 40, 12, 10, "rgba(255,255,255,.22)", N) +
      rect(40, 46, 34, 12, 6, skin) +
      rect(52, 36, 28, 22, 3, "#e8505b") + rect(54, 38, 24, 18, 2, "#fff6e6", N) + path("M66 38 V56", "none", ' stroke="#bfa98a" stroke-width="1.6"') +
      circ(32, 22, 18, skin) + path("M14 20 Q14 2 32 2 Q50 2 50 20 Q44 10 32 10 Q20 10 14 20 Z", hair, N) +
      circ(26, 26, 2.4, C.ink, N) + circ(38, 26, 2.4, C.ink, N) + path("M27 33 Q32 37 37 33", "none", ' stroke="' + C.ink + '" stroke-width="2" stroke-linecap="round"');
    return { w: 96, h: 80, back: b, front: "", label: o.label || "the boy", zones: {}, tapR: 40 };
  };

  /* A crayon, to paint with. 26 × 96. */
  ART.crayon = function (o) {
    o = o || {};
    var col = o.colour || C.red, dark = o.dark || C.redD;
    var b = path("M3 30 L13 4 L23 30 Z", col, ' stroke="' + dark + '" stroke-width="2" stroke-linejoin="round"') + rect(3, 28, 20, 64, 4, col, ' stroke="' + dark + '" stroke-width="2"') + rect(3, 44, 20, 22, 0, "#fff6e6", N) + path("M7 55 H19", "none", ' stroke="' + dark + '" stroke-width="2" opacity=".5"');
    return { w: 26, h: 96, back: b, front: "", label: o.label || "a crayon", zones: {} };
  };

  /* A little girl and boy to be in a line: same body, different clothes. */

  /* A bridge-free "stool" to hide under or sit on. 120 × 90. */
  ART.stool = function (o) {
    var b = rect(18, 30, 10, 58, 3, C.woodD) + rect(92, 30, 10, 58, 3, C.woodD) + rect(0, 10, 120, 24, 8, C.woodL) + rect(30, 62, 60, 7, 2, C.wood, N);
    return { w: 120, h: 90, back: b, front: "", label: (o && o.label) || "the stool",
      zones: { on: { line: [6, 114, 10] }, under: { rect: [32, 36, 56, 52] }, edge: { top: 10, bottom: 34 } } };
  };

  /* ====================================================== Backgrounds
     Each draws a W × H scene and says where the ground is (the line things
     stand on). */
  var BG = {};
  BG.room = function (W, H) {
    var gy = Math.round(H * 0.86);
    var s =
      rect(0, 0, W, H, 0, C.wall, N) + rect(0, Math.round(H * 0.7), W, H, 0, C.floor, N) + rect(0, Math.round(H * 0.7), W, 8, 0, C.floorD, N) +
      rect(Math.round(W * 0.07), 28, 110, 120, 10, "#d7ecff", ' stroke="' + C.woodD + '" stroke-width="7"') + path("M" + Math.round(W * 0.07 + 55) + " 28 V148 M" + Math.round(W * 0.07) + " 88 H" + Math.round(W * 0.07 + 110), "none", ' stroke="' + C.woodD + '" stroke-width="5"') +
      path("M" + Math.round(W * 0.07 + 12) + " 40 L" + Math.round(W * 0.07 + 40) + " 40", "none", ' stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"') +
      path("M0 " + Math.round(H * 0.7 + 30) + " H" + W, "none", ' stroke="rgba(0,0,0,.05)" stroke-width="2"') + path("M0 " + Math.round(H * 0.7 + 62) + " H" + W, "none", ' stroke="rgba(0,0,0,.05)" stroke-width="2"');
    return { svg: s, ground: gy, groundLabel: "the floor" };
  };
  BG.garden = function (W, H) {
    var gy = Math.round(H * 0.9), hy = Math.round(H * 0.68);
    var s =
      rect(0, 0, W, H, 0, C.sky, N) +
      path("M40 66 C22 66 22 44 40 42 C40 26 64 22 72 36 C80 24 104 28 104 46 C122 46 126 66 108 66 Z", "#fff", ' opacity=".85"') +
      path("M" + (W - 150) + " 50 C" + (W - 166) + " 50 " + (W - 166) + " 32 " + (W - 150) + " 30 C" + (W - 150) + " 16 " + (W - 128) + " 14 " + (W - 120) + " 26 C" + (W - 112) + " 16 " + (W - 92) + " 20 " + (W - 92) + " 34 C" + (W - 76) + " 34 " + (W - 72) + " 50 " + (W - 88) + " 50 Z", "#fff", ' opacity=".85"') +
      path("M0 " + hy + " Q" + Math.round(W * 0.22) + " " + (hy - 46) + " " + Math.round(W * 0.45) + " " + (hy - 10) + " T" + W + " " + (hy - 20) + " V" + H + " H0 Z", C.hill, N) +
      path("M0 " + (hy + 24) + " Q" + Math.round(W * 0.3) + " " + (hy - 6) + " " + Math.round(W * 0.6) + " " + (hy + 20) + " T" + W + " " + (hy + 14) + " V" + H + " H0 Z", C.grass, N) +
      path("M0 " + (hy + 70) + " H" + W + " V" + H + " H0 Z", C.grassD, N);
    return { svg: s, ground: gy, groundLabel: "the grass" };
  };
  BG.plain = function (W, H) {
    var gy = Math.round(H * 0.88);
    var s = rect(0, 0, W, H, 0, "#f3f6fc", N) + rect(0, gy - 8, W, H - gy + 8, 0, "#e3e9f5", N) + path("M0 " + (gy - 8) + " H" + W, "none", ' stroke="#d2dbed" stroke-width="3"');
    return { svg: s, ground: gy, groundLabel: "the floor" };
  };
  BG.track = function (W, H) {
    var gy = Math.round(H * 0.74);
    var s = rect(0, 0, W, H, 0, C.sky, N) + path("M0 " + Math.round(H * 0.6) + " Q" + Math.round(W * 0.3) + " " + Math.round(H * 0.46) + " " + Math.round(W * 0.6) + " " + Math.round(H * 0.58) + " T" + W + " " + Math.round(H * 0.55) + " V" + H + " H0 Z", C.hill, N) +
      rect(0, gy - 4, W, H - gy + 4, 0, C.grass, N) + rect(0, gy + 8, W, 5, 0, "#6b5a46", N) + rect(0, gy + 18, W, 5, 0, "#6b5a46", N);
    for (var x = 8; x < W; x += 34) s += rect(x, gy + 4, 20, 24, 2, "#8a7457", N);
    return { svg: s, ground: gy + 10, groundLabel: "the track" };
  };
  BG.shelfwall = function (W, H) {
    var s = rect(0, 0, W, H, 0, "#e8f0ff", N) + rect(0, Math.round(H * 0.9), W, H, 0, "#d4e0f7", N);
    return { svg: s, ground: Math.round(H * 0.9), groundLabel: "the floor" };
  };

  return { C: C, ART: ART, BG: BG, util: { rect: rect, circ: circ, ell: ell, path: path, poly: poly, line: line, g: g, tube: tube, S: S, N: N } };
})();
