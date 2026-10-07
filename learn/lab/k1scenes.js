/* ==========================================================================
   Grade 1 Math on Kern — the scenes. See lab/k1kit.js.

   A scene recipe puts sprites (lab/k1art.js) where a step needs them and
   returns a scene spec. Lessons and practice both build from these, so a
   table is the same table in every lesson.

   Scenes are 640 wide; the floor of a room, the grass of a garden is the
   ground line things stand on. The refs stay put; the movers are what the
   child moves; the taps are what the child taps.
   ========================================================================== */
(function () {
  "use strict";
  var K = window.OPLO_K1;
  if (!K || K.S) return;
  var W = 640, H = 360;

  function ref(art, id, cx, s, o) { return Object.assign({ id: id, art: art, role: "ref", cx: cx, bottom: "ground", s: s || 1 }, o || {}); }
  function tap(art, id, cx, s, o) { return Object.assign({ id: id, art: art, role: "tap", cx: cx, bottom: "ground", s: s || 1 }, o || {}); }
  function mv(art, id, x, s, o) { return Object.assign({ id: id, art: art, role: "move", x: x, bottom: "ground", s: s || 1 }, o || {}); }
  function mk(bg, things, o) { return Object.assign({ w: W, h: H, bg: bg, things: things }, o || {}); }
  function moti(x, o) { return mv("cat", "moti", x == null ? 36 : x, 0.6, Object.assign({ label: "Moti" }, o || {})); }
  function ball(x, o) { return mv("ball", "ball", x == null ? 566 : x, 0.8, Object.assign({ label: "the ball" }, o || {})); }
  function bird(id, x, o) { return mv("bird", id, x, 0.8, Object.assign({ label: "the bird" }, o || {})); }

  var S = { mk: mk, ref: ref, tap: tap, mv: mv, moti: moti, ball: ball, bird: bird };

  /* ---- on, under */
  S.table = function (o) { o = o || {}; return mk("room", [ref("table", "table", 372, 1.2), moti(o.moti)].concat(o.ball === false ? [] : [ball(o.ballX)]), { alt: "A room with a table, a white cat called Moti and a red ball." }); };
  S.bed = function (o) { o = o || {}; return mk("room", [ref("bed", "bed", 356, 1.35), moti(o.moti)].concat(o.ball === false ? [] : [ball(o.ballX)]), { alt: "A room with a bed, a white cat called Moti and a red ball." }); };
  S.tree = function (o) { o = o || {}; return mk("garden", [ref("tree", "tree", 340, 1)].concat(o.birds === false ? [] : [bird("bird1", 40), bird("bird2", 96)]).concat(o.moti ? [moti(o.motiX)] : []), { alt: "A garden with a big tree and two small birds." }); };
  // Static: a boy under the tree, birds in it.
  S.boyTree = function () {
    return mk("garden", [ref("tree", "tree", 330, 1), ref("kidsit", "boy", 330, 1.1, { args: { shirt: "#ff9244", skin: 1 }, label: "the boy" }), ref("bird", "bird1", 270, 0.8, { bottom: 160, label: "the bird" }), ref("bird", "bird2", 392, 0.8, { bottom: 140, label: "the bird", flip: true })], { alt: "A boy sitting under a big tree. Two birds are in the tree." });
  };
  S.catOnBox = function () { return mk("room", [ref("crate", "crate", 330, 1.3), ref("cat", "moti", 330, 0.6, { bottom: 310 - 100 * 1.3 + 18 * 1.3 + 2, label: "Moti" })], { alt: "Moti sitting on top of a box." }); };
  S.catUnderTable = function () { return mk("room", [ref("table", "table", 330, 1.2), ref("cat", "moti", 330, 0.6, { bottom: "ground", label: "Moti" })], { alt: "Moti sitting under a table." }); };
  S.catOnTable = function () { return mk("room", [ref("table", "table", 330, 1.2), ref("cat", "moti", 330, 0.6, { bottom: 154 + 9.6 + 1, label: "Moti" })], { alt: "Moti sitting on top of a table." }); };
  S.ballUnderBed = function () { return mk("room", [ref("bed", "bed", 340, 1.35), ref("ball", "ball", 340, 0.8, { bottom: "ground", label: "the ball" })], { alt: "A red ball under a bed." }); };
  S.ballOnBed = function () { return mk("room", [ref("bed", "bed", 340, 1.35), ref("ball", "ball", 300, 0.8, { bottom: 310 - 190 * 1.35 + 76 * 1.35 + 1, label: "the ball" })], { alt: "A red ball on a bed." }); };
  S.catOnBed = function () { return mk("room", [ref("bed", "bed", 340, 1.35), ref("cat", "moti", 300, 0.6, { bottom: 310 - 190 * 1.35 + 76 * 1.35 + 1, label: "Moti" })], { alt: "Moti on a bed." }); };
  S.catUnderBed = function () { return mk("room", [ref("bed", "bed", 340, 1.35), ref("cat", "moti", 340, 0.6, { bottom: "ground", label: "Moti" })], { alt: "Moti under a bed." }); };
  S.catUnderTree = function () { return mk("garden", [ref("tree", "tree", 340, 1), ref("cat", "moti", 340, 0.6, { bottom: "ground", label: "Moti" })], { alt: "Moti sitting under a big tree." }); };
  S.birdOnTree = function () { return mk("garden", [ref("tree", "tree", 330, 0.8), ref("bird", "bird1", 330, 0.9, { bottom: 150, label: "the bird" })], { alt: "A bird in a big tree." }); };

  /* ---- in, out */
  S.basketToss = function () { return mk("garden", [ref("basket", "basket", 500, 1.2), mv("ball", "ball", 60, 0.9, { label: "the ball" })], { alt: "A garden with a basket and a red ball to throw.", gravity: true }); };
  S.ballBox = function (o) { o = o || {}; return mk("room", [ref("box", "box", 400, 1.15), moti(o.moti), o.ballIn ? mv("ball", "ball", 312, 0.8, { y: 204, label: "the ball" }) : ball(o.ballX)], { alt: "A room with an open box, Moti and a red ball." }); };
  S.dustbin = function () { return mk("room", [ref("dustbin", "bin", 450, 1.4), mv("paper", "paper", 70, 1.1, { label: "the paper" })], { alt: "A dustbin with its lid open, and a crumpled piece of paper." }); };
  S.flowerBasket = function () {
    return mk("garden", [ref("basket", "basket", 320, 1.3),
      tap("flower", "f1", 262, 0.9, { bottom: 228, label: "a flower" }), tap("flower", "f2", 322, 0.9, { bottom: 226, label: "a flower" }), tap("flower", "f3", 382, 0.9, { bottom: 228, label: "a flower" }),
      tap("flower", "f4", 96, 0.9, { label: "a flower" }), tap("flower", "f5", 556, 0.9, { label: "a flower" })], { alt: "A basket with three yellow flowers in it, and two yellow flowers on the grass outside it." });
  };
  S.carPeople = function () {
    return mk("garden", [ref("car", "car", 392, 1.25), tap("head", "girl", 392 - 125 + 86 * 1.25 + 8, 0.78, { bottom: 174 + 60 * 1.25 + 6, label: "the girl", args: { skin: 2, long: true } }),
      tap("kid", "man", 110, 0.78, { label: "the man", args: { shirt: "#f2f2f2", shorts: "#4a5568", skin: 1 } })], { alt: "A yellow car with a girl in the window, and a man standing beside it." });
  };
  S.caveBears = function () {
    return mk("garden", [ref("cave", "cave", 300, 1.25), tap("bear", "bearA", 240, 0.5, { bottom: 324 - 10, label: "a bear" }), tap("bear", "bearB", 330, 0.46, { bottom: 324 - 12, label: "a bear" }),
      tap("bear", "bearC", 520, 0.66, { label: "a bear" }), tap("bear", "bearD", 580, 0.4, { label: "a bear", args: { colour: "#c98a4a", dark: "#8f5b28" } })], { alt: "A cave with two bears inside it, and two bears outside." });
  };
  S.toyBox = function () {
    return mk("room", [ref("box", "box", 330, 1.3), tap("bear", "teddy", 300, 0.78, { bottom: 238, label: "the teddy", args: { colour: "#d19a56", dark: "#9b6a2c" } }),
      tap("duck", "duck", 520, 0.9, { label: "the duck" }), tap("ball", "ball2", 120, 0.9, { label: "the ball" })], { alt: "A toy box with a teddy bear in it, and a yellow duck and a red ball outside it." });
  };

  /* ---- above, below, near, far */
  S.hatTable = function (o) {
    o = o || {};
    return mk("room", [ref("table", "table", 330, 1.2), ref("hat", "hat", 330, 0.9, { bottom: 310 - 156 + 9.6 + 4, label: "the hat" }), moti(o.moti)], { alt: "A table with a straw hat on top, and Moti." });
  };
  S.treeSun = function () {
    return mk("garden", [ref("sun", "sun", 540, 0.9, { bottom: 140, label: "the sun" }), ref("tree", "tree", 250, 0.95), ref("bird", "bird1", 150, 0.9, { bottom: 120, label: "the bird" })], { alt: "A big tree, the sun and a bird high in the sky." });
  };
  S.birdAbove = function () { return mk("garden", [ref("tree", "tree", 330, 0.8), ref("bird", "bird1", 330, 0.9, { bottom: 56, label: "the bird" })], { alt: "A bird flying high above a tree." }); };
  S.face = function () {
    return mk("plain", [ref("face", "face", 330, 1.12, { bottom: 340, label: "the face" }), mv("brows", "brows", 18, 1, { y: 24, label: "the eyebrows", plural: true }), mv("smile", "smile", 534, 1, { y: 270, label: "the smile" })], { alt: "A face with eyes and a nose, and eyebrows and a smile to put on it." });
  };
  S.nearFar = function () { return mk("garden", [ref("tree", "tree", 86, 0.8), moti(330), ball(560)], { alt: "A garden with a tree at the left, Moti and a red ball." }); };

  /* ---- top, middle, bottom */
  S.shelf = function (o) {
    o = o || {};
    return mk("shelfwall", [ref("shelf", "shelf", 320, 0.95), mv("ball", "ball", 26, 0.85, { label: "the ball" }), mv("duck", "duck", 84, 0.75, { label: "the duck" }), mv("bear", "bear", 536, 0.55, { label: "the bear" })].concat(o.four ? [mv("block", "block", 560, 0.6, { label: "the block" })] : []), { alt: "A tall cupboard with three racks, and three toys to put in it." });
  };
  S.shelfMoti = function () { return mk("shelfwall", [ref("shelf", "shelf", 320, 0.95), moti(24)], { alt: "A cupboard with three racks, and Moti." }); };
  S.tower = function (o) {
    o = o || {};
    var cols = o.colours || ["red", "blue", "green"], P = { red: ["#e8505b", "#bf3943"], blue: ["#4a8cff", "#2f67d1"], green: ["#47b872", "#2f8f55"], yellow: ["#ffd23f", "#e0a91d"], purple: ["#8a63f0", "#6b46d1"], orange: ["#ff9244", "#d96d1f"] };
    var base = 317, n = cols.length, hh = n > 4 ? 56 : n > 3 ? 68 : 80, sc = hh / 54;
    return mk("plain", cols.map(function (c, i) { return tap("block", "k" + (i + 1), 320, sc, { bottom: base - (n - 1 - i) * hh, label: "the " + c + " block", args: { colour: P[c][0], dark: P[c][1] } }); }), { alt: "A tower of " + n + " blocks: " + cols.join(", ") + ", from the top down." });
  };
  S.flag = function () { return mk("garden", [ref("flag", "flag", 330, 1.3, { label: "the flag" })], { alt: "The Indian flag on a pole: saffron on top, white in the middle with a blue wheel, green at the bottom." }); };

  /* ---- before, after */
  var BOG = { blue: ["#4a8cff", "#2f67d1"], orange: ["#ff9244", "#d96d1f"], green: ["#47b872", "#2f8f55"], yellow: ["#ffd23f", "#e0a91d"], pink: ["#ff8fb7", "#d6568a"], red: ["#e8505b", "#bf3943"], purple: ["#8a63f0", "#6b46d1"], plain: ["#eef1f8", "#c2cadc"] };
  S.train = function (cols, o) {
    o = o || {};
    var n = cols.length, pitch = Math.min(94, Math.floor((W - 152 - 6) / n)), sc = (pitch - 4) / 120, things = [];
    things.push(ref("engine", "engine", 4 + 170 * 0.85 / 2, 0.85, { label: "the engine" }));
    cols.forEach(function (c, i) {
      var C = BOG[c] || BOG.plain, painted = o.paint && o.paint.indexOf(i) > -1;
      things.push((o.role === "ref" || (o.fixed && o.fixed.indexOf(i) > -1) ? ref : tap)("bogie", "b" + (i + 1), 152 + i * pitch + (pitch - 4) / 2 + 6, sc, { label: "bogie " + (i + 1), args: painted ? { colour: BOG.plain[0], dark: BOG.plain[1] } : { colour: C[0], dark: C[1] } }));
    });
    return mk("track", things, { h: 300, alt: "A little train: an engine, then " + n + " bogies, " + cols.join(", ") + "." });
  };
  var KIDS = [
    { n: "Meera", skin: 1, shirt: "#e8505b", long: true }, { n: "Rohit", skin: 0, shirt: "#4a8cff" }, { n: "Asha", skin: 2, shirt: "#47b872", long: true },
    { n: "Imran", skin: 1, shirt: "#ffd23f" }, { n: "Leela", skin: 3, shirt: "#8a63f0", long: true }
  ];
  S.kidsLine = function (n) {
    n = n || 5;
    var xs = { 3: [180, 320, 460], 4: [130, 250, 370, 490], 5: [86, 206, 326, 446, 566] }[n], things = [], labels = [];
    for (var i = 0; i < n; i++) {
      var k = KIDS[i];
      things.push(tap("kid", "k" + (i + 1), xs[i], 0.84, { label: k.n, args: { shirt: k.shirt, skin: k.skin, long: k.long } }));
      labels.push({ x: xs[i], y: 346, t: k.n });
    }
    return mk("garden", things, { labels: labels, ground: 322, alt: "Children standing in a line: " + KIDS.slice(0, n).map(function (k) { return k.n; }).join(", ") + "." });
  };
  S.kids = KIDS;

  /* ---- sorting */
  var BTN = { red: ["#e8505b", "#bf3943"], blue: ["#4a8cff", "#2f67d1"], green: ["#47b872", "#2f8f55"], yellow: ["#ffd23f", "#e0a91d"] };
  S.buttons = function (list, o) {
    o = o || {};
    var things = list.map(function (b, i) {
      var P = BTN[b.colour];
      return (o.role === "ref" ? ref("button", "b" + (i + 1), 0, 1, { x: b.x, y: b.y, cx: undefined, bottom: undefined, label: "a " + b.colour + " button", args: { colour: P[0], dark: P[1], shape: b.shape || "round", size: b.size || "big" } }) : mv("button", "b" + (i + 1), b.x, 1, { y: b.y, label: "a " + b.colour + " button", attrs: { colour: b.colour, shape: b.shape || "round", size: b.size || "big" },
        args: { colour: P[0], dark: P[1], shape: b.shape || "round", size: b.size || "big" } }));
    });
    return mk("plain", things, { h: 380, ground: 9999, deco: o.deco || '<rect x="12" y="8" width="616" height="196" rx="34" fill="#f7eedb"/>', alt: "A pile of buttons to sort: " + list.length + " buttons in different colours, shapes and sizes." });
  };
  S.leaves = function (o) {
    // three kinds of thing, mixed up on a mat
    var spots = [[34, 18], [236, 24], [440, 14], [122, 82], [334, 90], [522, 78], [44, 136], [246, 132], [436, 140]];
    var kinds = o && o.kinds || ["leaf", "chalk", "pebble", "chalk", "leaf", "pebble", "pebble", "leaf", "chalk"];
    var things = kinds.map(function (k, i) {
      var sp = spots[i % spots.length], lab = { leaf: "a leaf", chalk: "a piece of chalk", pebble: "a pebble" }[k];
      return mv(k, "i" + (i + 1), sp[0], k === "chalk" ? 1.5 : k === "leaf" ? 1.4 : 1.35, { y: sp[1], label: lab, attrs: { kind: k } });
    });
    return mk("plain", things, { h: 380, ground: 9999, deco: '<rect x="12" y="8" width="616" height="196" rx="34" fill="#f7eedb"/>', alt: "Leaves, pieces of chalk and pebbles, all mixed up." });
  };

  /* ---- the project */
  S.motiRoom = function () {
    return mk("room", [ref("bed", "bed", 128, 0.85), ref("box", "box", 336, 0.8), ref("table", "table", 520, 1.0),
      moti(196, { y: 10 }), ball(300, { y: 18 }), mv("duck", "duck", 396, 0.8, { label: "the duck", y: 12 })], { alt: "A room with a bed, a box and a table. Moti, a red ball and a yellow duck are to be put in the right places." });
  };
  // Moti and the toys, on a tray of floor: for the second round.
  S.catAboveHat = function () { return mk("room", [ref("table", "table", 330, 1.2), ref("hat", "hat", 330, 0.9, { bottom: 310 - 156 + 9.6 + 4, label: "the hat" }), ref("cat", "moti", 330, 0.6, { bottom: 76, label: "Moti" })], { alt: "Moti up high above a straw hat on a table." }); };
  S.catBelowHat = function () { return mk("room", [ref("table", "table", 330, 1.2), ref("hat", "hat", 330, 0.9, { bottom: 310 - 156 + 9.6 + 4, label: "the hat" }), ref("cat", "moti", 330, 0.6, { bottom: "ground", label: "Moti" })], { alt: "Moti on the floor, far below a straw hat on a table." }); };
  S.ballInBox = function () { return mk("room", [ref("box", "box", 400, 1.15), ref("ball", "ball", 400, 0.8, { bottom: 252, label: "the ball" }), ref("cat", "moti", 120, 0.6, { label: "Moti" })], { alt: "A red ball inside an open box, and Moti beside it." }); };
  S.ballOutBox = function () { return mk("room", [ref("box", "box", 400, 1.15), ref("ball", "ball", 140, 0.8, { label: "the ball" }), ref("cat", "moti", 520, 0.6, { label: "Moti" })], { alt: "An open box, with a red ball and Moti outside it." }); };
  // A static picture of a mover placed to make a word true, from any scene recipe: { scene, item, ref, rel }.
  S.opposite = { on: "under", under: "on", inside: "outside", outside: "inside", above: "below", below: "above", top: "bottom", bottom: "top", middle: "top" };
  S.staged = function (spec, itemId, refId, rel, zone, keep) {
    var S0 = K.Scene(spec), T = S0.T[itemId], R = S0.T[refId], p = K.G.solve(rel, T.g, R.g, { ground: S0.ground, W: S0.W, zone: zone });
    S0.destroy();
    var out = JSON.parse(JSON.stringify(spec));
    out.things.forEach(function (t) {
      if (t.id === itemId) { if (!keep) t.role = "ref"; delete t.cx; delete t.bottom; t.x = p.x; t.y = p.y; }
      else if (!keep && t.role === "move") t.role = "ref";
    });
    return out;
  };
  // The same scene with nothing movable: every mover is where it starts.
  S.still = function (spec) { var out = JSON.parse(JSON.stringify(spec)); out.things.forEach(function (t) { if (t.role === "move") t.role = "ref"; }); return out; };

  K.S = S; K.BOG = BOG; K.BTN = BTN;
})();
