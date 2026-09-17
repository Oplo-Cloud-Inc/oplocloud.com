/* ==========================================================================
   Media Arts — Unit 8, Intro to Animation. Sections 8.1 to 8.9.

   Written from the EHS course text the way Units 5 to 7 were: curated rather
   than copied, every tested definition kept, and every idea shown as well as
   said. This unit is about movement, so for the first time a figure moves:
   five motion labs (see motionBlock in app.js) let a student switch a
   principle on and off and watch what changes — ones against twos, key
   frames with and without in-betweens, a walk cycle that works and the
   course's one that does not, a bouncing ball with spacing, arcs and squash
   and stretch, and a character with and without anticipation and
   follow-through. Each shows its frames on a strip under the stage: keys,
   new drawings and holds.

   Every definition carries a second line in plain words (the `p` of a def),
   each section opens with the everyday words a reader may not have, and
   "Try it" and "In the real world" cards tie the ideas to things a student
   can do or has seen.

   ------------------------------------------------------------ Corrections

   Marked in the reader with a note rather than silently rewritten.

     8.1  The thaumatrope's two pictures "form one moving animation". Most
          thaumatropes combine two pictures into one still image.
     8.1  The side note's "first animation on standard picture film", The
          Enchanted Drawing (1900), used stop-camera substitution, not
          frame-by-frame drawing; Humorous Phases of Funny Faces (1906) is
          the usual answer.
     8.1  "Logarithms" (twice) for algorithms; crash animations are the
          output of simulations.
     8.1  Limited animation as "the use of the cel technique". Cels were used
          for full animation too.
     8.1  Stop motion "is not" time-consuming. Aardman: about two seconds of
          film per animator per day (Smithsonian, 2026).
     8.1  3D modeling as "a more complex form of 3D animation". It is the
          first step, and many models are never animated.
     8.1  Rigging "an emerging technique". Standard for decades.
     8.2  The key frame as "the first drawing". Keys fall wherever a move
          starts, ends or turns.
     8.2  Ones for "very fast movement", twos for slower. Ones and twos change
          smoothness, not speed; the lab shows it.
     8.2  Frame-by-frame changes "the stage or background". In Adobe's
          sense the stage is the whole picture; the background can stay.
     8.2  A three-drawing walk cycle. It cannot loop; the lab shows it.
     8.2  Pose to pose less fluid because poses are hard to make "after the
          key frames". Garbled: its risk is even, stiff in-betweens.
     8.2  Snappy and swimmy as frame rate. They are timing and spacing.
     8.2  Motion capture "created" the uncanny valley, a dip in "aptitude".
          Mori, 1970, about robots; the dip is in affinity.
     8.4  The key frame as "the first drawing", again.
     8.5  "The rule of thirds or the golden ratio", as in 6.6 and 7.5.
     8.7  Greeking as "words or small synopses". It is placeholder text.
     8.9  A ".awf" format (probably .asf); .mov dated 1998 (1991); QuickTime
          for Windows (ended 2016); WMV's "codes" (codecs).
     8.9  A niche blog as one about current events. A niche is a narrow
          subject.

   ------------------------------------------------------------------ Checks

   8.1, 8.2, 8.3, 8.5, 8.6, 8.7 and 8.8 use the course's own Check Your
   Understanding questions, lightly reworded. 8.4 and 8.9 had interactive
   exercises instead, so their checks are new.

   ---------------------------------------------------------------- Pictures

   Twenty diagrams drawn for OEdu, labels set to render at 13px or larger in
   the reading column. Eighteen photographs and one animation from Wikimedia
   Commons, each checked at its source for licence and author and credited
   beside the figure. No figure flashes: the motion labs move smoothly, and
   they do not start on their own for a reader who has asked for reduced
   motion.
   ========================================================================== */
window.OPLO_UNIT8 = (function () {
  "use strict";

  var P = function (t) { return { k: "p", t: t }; };
  var H = function (t) { return { k: "h", t: t }; };
  /* A definition, and the same thing said plainly. */
  var D = function (t, d, plain) { return { k: "def", t: t, d: d, p: plain || null }; };
  var N = function (t) { return { k: "note", t: t }; };
  var L = function (t, items) { return { k: "list", t: t, items: items }; };
  var R = function (items) { return { k: "refs", items: items }; };
  /* Everyday words the section leans on, said simply. */
  var W = function (items) { return { k: "words", items: items }; };
  /* Something to do, and somewhere the idea turns up outside the course. */
  var TRY = function (t, d) { return { k: "try", t: t, d: d }; };
  var WORLD = function (t, d) { return { k: "world", t: t, d: d }; };
  var F = function (o) {
    return { k: "fig", imgs: o.imgs, cap: o.cap, credits: o.credits,
             cols: o.cols || null, natural: !!o.natural,
             diagram: !!o.diagram, size: o.size || null };
  };

  var M = "media/unit8/";
  var OEDU = [{ what: "Diagram", by: "OEdu" }];
  var OEDU_M = [{ what: "Animation", by: "OEdu" }];
  function commons(file) { return "https://commons.wikimedia.org/wiki/File:" + file; }
  function cc(by, file, license, url, what) {
    return { what: what, by: by, byUrl: commons(file), site: "Wikimedia Commons", siteUrl: commons(file),
             license: license, licenseUrl: url };
  }
  var BY2 = "https://creativecommons.org/licenses/by/2.0/";
  var BY3 = "https://creativecommons.org/licenses/by/3.0/";
  var BY4 = "https://creativecommons.org/licenses/by/4.0/";
  var BYSA2 = "https://creativecommons.org/licenses/by-sa/2.0/";
  var BYSA3 = "https://creativecommons.org/licenses/by-sa/3.0/";
  var BYSA4 = "https://creativecommons.org/licenses/by-sa/4.0/";

  /* ------------------------------------------------------------ Motion labs
     A lab is a figure with a clock. `draw(f, o, ghost)` returns the SVG for
     the drawing that starts on frame f with the options o; `frames(o)` says
     which frames start a new drawing (the rest hold the one before); `keys`
     which of them are key frames. The reader supplies play, pause, step,
     the onion skin and the strip of frames. */
  var C_BLUE = "#2a78d6", C_BLUE_L = "#9cc0ea", C_INK = "#1d1d1f", C_INK3 = "#86868b",
      C_ORANGE = "#eb6834", C_GROUND = "#86868b";
  function n1(v) { return Math.round(v * 10) / 10; }
  function every(len, step) { var o = []; for (var f = 0; f < len; f += step) o.push(f); return o; }
  function ground(y) {
    return '<line x1="0" y1="' + y + '" x2="640" y2="' + y + '" stroke="' + C_GROUND + '" stroke-width="2"/>';
  }
  function MO(o) { o.k = "motion"; o.credits = o.credits || OEDU_M; return o; }

  /* 8.2 — ones, twos and fours. The ball crosses in exactly one second
     whichever is chosen: only the number of drawings changes. */
  var ROLL = MO({
    w: 640, h: 230, len: 48, fps: 24,
    alt: "A striped ball rolls across the stage and back, one second each way. The lab can show it with a new " +
         "drawing every frame, every second frame, or every fourth frame.",
    controls: [{ key: "n", label: "Drawings", def: "1",
                 opts: [["1", "On ones"], ["2", "On twos"], ["4", "On fours"]] }],
    frames: function (o) { return every(48, +o.n); },
    keys: function () { return [0, 24]; },
    back: function (o) {
      return ground(196) +
        '<text x="20" y="38" font-size="22" font-weight="700" fill="' + C_INK + '">' + (24 / +o.n) +
        ' drawings a second</text><text x="20" y="64" font-size="18" fill="#6e6e73">' +
        'Always 24 frames a second, and one second to cross</text>';
    },
    draw: function (f, o, ghost) {
      var t = f < 24 ? f / 24 : (48 - f) / 24;
      var x = 80 + 480 * t, r = 30, turn = (x - 80) / r * 57.2958;
      if (ghost) return '<circle cx="' + n1(x) + '" cy="166" r="' + r + '" fill="none" stroke="' + C_BLUE + '"/>';
      return '<g transform="translate(' + n1(x) + ' 166) rotate(' + n1(turn) + ')">' +
        '<circle r="' + r + '" fill="' + C_BLUE + '"/><rect x="-30" y="-4" width="60" height="8" fill="#fff"/>' +
        '<circle r="' + r + '" fill="none" stroke="' + C_INK + '" stroke-width="2"/></g>';
    },
    cap: "Switch between ones, twos and fours. The ball always takes one second to cross — the speed never " +
         "changes. What changes is how many drawings share that second, and so how smooth it looks. The strip " +
         "under the stage shows each frame: a darker block where a new drawing starts, a pale one where the " +
         "last drawing is held."
  });

  /* 8.2 — a walk cycle, and the course's three-drawing version that cannot
     loop. Near leg blue, far leg orange, as animators often colour them. */
  function walker(ph, ghost) {
    var TAU = Math.PI * 2, D2R = Math.PI / 180;
    var hx = 320, hy = 118 - 5 * Math.abs(Math.sin(TAU * ph));
    function leg(p) {
      p = ((p % 1) + 1) % 1;
      var a = 26 * Math.cos(TAU * p) * D2R;
      var k = (p < 0.5 ? 4 : 62 * Math.sin(Math.PI * (p - 0.5) / 0.5)) * D2R;
      var kx = hx + 46 * Math.sin(a), ky = hy + 46 * Math.cos(a);
      var ax = kx + 44 * Math.sin(a - k), ay = ky + 44 * Math.cos(a - k);
      return [kx, ky, ax, ay];
    }
    function arm(p) {
      var a = -22 * Math.cos(TAU * p) * D2R, sx = hx, sy = hy - 56;
      var ex = sx + 30 * Math.sin(a), ey = sy + 30 * Math.cos(a);
      var b = a + 24 * D2R;
      return [sx, sy, ex, ey, ex + 28 * Math.sin(b), ey + 28 * Math.cos(b)];
    }
    function limb(pts, col, w) {
      return '<polyline points="' + pts.map(n1).join(" ") + '" fill="none" stroke="' + col +
        '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    var L_ = leg(ph), R_ = leg(ph + 0.5);
    var foot = function (l, col, w) {
      return limb([l[2], l[3], l[2] + 14, l[3] + 1], col, w);
    };
    if (ghost) {
      return limb([hx, hy, L_[0], L_[1], L_[2], L_[3]], C_BLUE, 1.5) +
             limb([hx, hy, R_[0], R_[1], R_[2], R_[3]], C_ORANGE, 1.5);
    }
    var aL = arm(ph), aR = arm(ph + 0.5);
    return limb([hx, hy, R_[0], R_[1], R_[2], R_[3]], C_ORANGE, 8) + foot(R_, C_ORANGE, 8) +
      limb(aR, C_ORANGE, 7) +
      limb([hx, hy, hx, hy - 62], C_INK, 10) +
      '<circle cx="' + hx + '" cy="' + n1(hy - 84) + '" r="17" fill="#fff" stroke="' + C_INK + '" stroke-width="3"/>' +
      limb([hx, hy, L_[0], L_[1], L_[2], L_[3]], C_BLUE, 8) + foot(L_, C_BLUE, 8) +
      limb(aL, C_BLUE, 7);
  }
  var WALK = MO({
    w: 640, h: 250, len: 24, fps: 24,
    alt: "A stick figure walks on the spot while the ground slides past, one full cycle of two steps a second. " +
         "The lab can build the cycle from the course's three drawings, from four, or from eight.",
    controls: [{ key: "n", label: "Drawings in the cycle", def: "4",
                 opts: [["3", "The course's 3"], ["4", "4"], ["8", "8"]] }],
    frames: function (o) { return o.n === "3" ? [0, 8, 16] : every(24, 24 / +o.n); },
    keys: function (o) { return o.n === "3" ? [0, 16] : [0, 12]; },
    back: function () {
      return '<text x="20" y="36" font-size="19" font-weight="700" fill="' + C_BLUE + '">Left leg</text>' +
        '<text x="20" y="60" font-size="19" font-weight="700" fill="' + C_ORANGE + '">Right leg</text>';
    },
    draw: function (f, o, ghost) {
      // The course's three: left forward, legs together, right forward — and
      // then straight back to left forward, with no passing pose between.
      var ph = o.n === "3" ? [0, 0.25, 0.5][f / 8] : f / 24;
      var shift = -((f / 24) * 151) % 50;
      var dashes = "";
      if (!ghost) {
        for (var x = shift; x < 660; x += 50) {
          dashes += '<rect x="' + n1(x) + '" y="214" width="26" height="4" rx="2" fill="#c7c7cc"/>';
        }
      }
      return (ghost ? "" : ground(208) + dashes) + walker(ph, ghost);
    },
    cap: "A walk cycle loops: the last drawing has to lead back into the first. With four drawings — left " +
         "foot forward, passing, right foot forward, passing — it does. Choose the course's three and watch " +
         "the legs swap places in a single frame when it loops. Eight drawings is smoother still."
  });

  /* 8.4 — keys first, then in-betweens. */
  var HOP = MO({
    w: 640, h: 250, len: 48, fps: 24,
    alt: "A ball hops right, then left, with key frames at take-off, at the top of each hop and at landing. The " +
         "lab adds none, one, three or eleven in-betweens between each pair of keys.",
    controls: [{ key: "n", label: "In-betweens between keys", def: "0",
                 opts: [["0", "None"], ["1", "1"], ["3", "3"], ["11", "11"]] }],
    frames: function (o) { return every(48, 12 / (+o.n + 1)); },
    keys: function () { return [0, 12, 24, 36]; },
    back: function () { return ground(220); },
    draw: function (f, o, ghost) {
      var t = f < 24 ? f / 24 : (48 - f) / 24;
      var u = (f % 24) / 24;
      var x = 100 + 440 * t, y = 220 - 22 - 150 * 4 * u * (1 - u);
      var key = f % 12 === 0;
      if (ghost) {
        return '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="22" fill="' + (key ? C_BLUE_L : "none") +
          '" stroke="' + (key ? C_INK : C_BLUE) + '" stroke-width="' + (key ? 2 : 1.2) + '"/>';
      }
      return '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="22" fill="' + C_BLUE + '" stroke="' + C_INK +
        '" stroke-width="2"/>' + (key ? '<text x="' + n1(x) + '" y="' + n1(y - 34) +
        '" font-size="18" font-weight="700" fill="' + C_INK + '" text-anchor="middle">KEY</text>' : "");
    },
    cap: "With no in-betweens, the ball jumps from key to key and hangs there. Add one, then three, then eleven, " +
         "and the jumps melt into a smooth hop — the same keys, more drawings between them. Turn on “Show every " +
         "drawing” to see where each one falls."
  });

  /* 8.5 — the bouncing ball, three principles at a time. Everything starts
     switched off, so the first thing a reader sees is the robotic version. */
  var ARC = (function () {
    var n = 240, s = [0], acc = 0, px = 0, py = 0;
    for (var i = 1; i <= n; i++) {
      var q = i / n, x = q, y = 4 * q * (1 - q) * (170 / 240);
      acc += Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
      s.push(acc); px = x; py = y;
    }
    return s.map(function (v) { return v / acc; });
  })();
  function arcParam(p) {
    for (var i = 1; i < ARC.length; i++) {
      if (ARC[i] >= p) {
        var a = ARC[i - 1], b = ARC[i];
        return (i - 1 + (b > a ? (p - a) / (b - a) : 0)) / (ARC.length - 1);
      }
    }
    return 1;
  }
  function bounceAt(f, o) {
    var u = (f % 16) / 16, hop = Math.floor(f / 16);
    var p = o.space === "ease"
      ? (u < 0.5 ? 0.5 * (1 - (1 - 2 * u) * (1 - 2 * u)) : 0.5 + 0.5 * (2 * u - 1) * (2 * u - 1))
      : u;
    var x0 = -20 + hop * 240, g = 260, r = 20, H = 170;
    var s = o.path === "arc" ? arcParam(p) : p;
    var x = x0 + 240 * s;
    var y = o.path === "arc" ? g - r - H * 4 * s * (1 - s) : g - r - H * (1 - Math.abs(2 * s - 1));
    return { x: x, y: y, u: u, p: p };
  }
  var BOUNCE = MO({
    w: 640, h: 290, len: 48, fps: 24,
    alt: "A ball bounces across the stage three times a loop. The lab can switch its spacing between even and " +
         "slow in and slow out, its path between straight lines and arcs, and squash and stretch off and on.",
    controls: [
      { key: "space", label: "Spacing", def: "even", opts: [["even", "Even"], ["ease", "Slow in and out"]] },
      { key: "path", label: "Path", def: "line", opts: [["line", "Straight"], ["arc", "Arc"]] },
      { key: "sq", label: "Squash and stretch", def: "off", opts: [["off", "Off"], ["on", "On"]] }],
    keys: function () { return [0, 8, 16, 24, 32, 40]; },
    back: function () { return ground(260); },
    draw: function (f, o, ghost) {
      var a = bounceAt(f, o), b = bounceAt(f + 0.25, o);
      var r = 20, rx = r, ry = r, rot = 0, y = a.y;
      if (o.sq === "on") {
        if (a.u === 0) {
          rx = r * 1.45; ry = r / 1.45; y = 260 - ry;
        } else {
          var speed = o.space === "ease" ? Math.abs(1 - 2 * a.u) : 0.45;
          var k = 1 + 0.42 * speed;
          rx = r * k; ry = r / k;
          rot = Math.atan2(b.y - a.y, b.x - a.x) * 57.2958;
        }
      }
      var shape = '<ellipse cx="0" cy="0" rx="' + n1(rx) + '" ry="' + n1(ry) + '"';
      var at = ' transform="translate(' + n1(a.x) + " " + n1(y) + ") rotate(" + n1(rot) + ')"';
      if (ghost) return shape + at + ' fill="none" stroke="' + C_BLUE + '"/>';
      return shape + at + ' fill="' + C_ORANGE + '" stroke="' + C_INK + '" stroke-width="2"/>';
    },
    cap: "Everything starts switched off, and the ball moves like a machine. Turn on slow in and out: it hangs " +
         "at the top and speeds up near the ground. Turn on the arc: it stops zigzagging. Turn on squash and " +
         "stretch: it flattens as it lands and stretches when it is fast. Then turn on “Show every drawing” " +
         "and compare the spacing with the photograph above."
  });

  /* 8.5 — a flour-sack character jumps. Anticipation adds the crouch;
     follow-through lets its antenna lag and settle. The antenna is a damped
     spring driven by the body's vertical acceleration, run for several loops
     so the saved cycle starts where it ends (within a thousandth of a radian). */
  function sackBody(f, ant) {
    var h = 92, w = 60, lift = 0;
    var ease = function (v) { return 0.5 - 0.5 * Math.cos(Math.PI * v); };
    if (ant && f >= 6 && f < 16) {
      var c = f < 13 ? ease((f - 6) / 7) : 1 - ease((f - 13) / 3);
      h = 92 - 34 * c; w = 60 + 22 * c;
    }
    if (f >= 16 && f < 28) {
      var u = (f - 16) / 12;
      lift = 150 * 4 * u * (1 - u);
      var st = Math.max(0, 1 - 4 * u * (1 - u) * 1.6);
      h = 92 + 16 * st; w = 60 - 8 * st;
    } else if (f >= 28 && f < 33) {
      var d = 1 - (f - 28) / 5;
      h = 92 - 28 * d; w = 60 + 20 * d;
    }
    return { h: h, w: w, lift: lift };
  }
  var SACK = {};
  ["off", "on"].forEach(function (ant) {
    var ys = [], out = [], th = 0, vel = 0, rest = 0.45;
    for (var f = 0; f < 48; f++) {
      var s = sackBody(f, ant === "on");
      ys.push(s.lift + s.h);
    }
    th = rest;
    for (var loop = 0; loop < 6; loop++) {
      for (var g = 0; g < 48; g++) {
        // The body's upward acceleration, clipped so a hard landing bends the
        // antenna rather than spinning it right round.
        var acc = Math.max(-14, Math.min(14, ys[(g + 1) % 48] - 2 * ys[g] + ys[(g + 47) % 48]));
        for (var step = 0; step < 4; step++) {
          vel += -0.05 * (th - rest) - 0.18 * vel + 0.004 * acc;
          th += vel;
        }
        if (loop === 5) out.push(th);
      }
    }
    SACK[ant] = out;
  });
  var SACKLAB = MO({
    w: 640, h: 290, len: 48, fps: 24,
    alt: "An orange sack-shaped character with an antenna jumps once and lands. The lab can add anticipation, a " +
         "crouch before the jump, and follow-through, an antenna that lags behind and settles after landing.",
    controls: [
      { key: "ant", label: "Anticipation", def: "off", opts: [["off", "Off"], ["on", "On"]] },
      { key: "fol", label: "Follow-through", def: "off", opts: [["off", "Off"], ["on", "On"]] }],
    keys: function (o) { return o.ant === "on" ? [6, 13, 22, 28] : [16, 22, 28]; },
    back: function () { return ground(262); },
    draw: function (f, o, ghost) {
      var s = sackBody(f, o.ant === "on"), cx = 320, g = 262;
      var top = g - s.lift - s.h, th = o.fol === "on" ? SACK[o.ant][f] : 0.45;
      var bx = cx + 4, by = top + 4, len = 52;
      var tx = bx + len * Math.sin(th), ty = by - len * Math.cos(th);
      var mx = bx + len * 0.55 * Math.sin(th * 0.35), my = by - len * 0.55 * Math.cos(th * 0.35);
      var body = '<rect x="' + n1(cx - s.w / 2) + '" y="' + n1(top) + '" width="' + n1(s.w) + '" height="' +
        n1(s.h) + '" rx="' + n1(Math.min(s.w, s.h) / 2.3) + '"';
      if (ghost) {
        return body + ' fill="none" stroke="' + C_ORANGE + '"/>' +
          '<circle cx="' + n1(tx) + '" cy="' + n1(ty) + '" r="5" fill="none" stroke="#d70015"/>';
      }
      var shadow = 1 - s.lift / 220;
      return '<ellipse cx="' + cx + '" cy="' + (g + 2) + '" rx="' + n1(38 * shadow) + '" ry="' + n1(6 * shadow) +
        '" fill="#000" fill-opacity=".12"/>' +
        '<path d="M' + n1(bx) + " " + n1(by) + " Q" + n1(mx) + " " + n1(my) + " " + n1(tx) + " " + n1(ty) +
        '" fill="none" stroke="#d70015" stroke-width="4" stroke-linecap="round"/>' +
        '<circle cx="' + n1(tx) + '" cy="' + n1(ty) + '" r="7" fill="#d70015"/>' +
        body + ' fill="' + C_ORANGE + '" stroke="' + C_INK + '" stroke-width="2"/>' +
        '<circle cx="' + n1(cx - 8) + '" cy="' + n1(top + s.h * 0.32) + '" r="4" fill="' + C_INK + '"/>' +
        '<circle cx="' + n1(cx + 11) + '" cy="' + n1(top + s.h * 0.32) + '" r="4" fill="' + C_INK + '"/>';
    },
    cap: "With both off, the jump comes from nowhere and the antenna is as stiff as a stick. Turn on " +
         "anticipation and the character crouches first, so your eye is ready. Turn on follow-through and the " +
         "antenna drags behind on the way up, whips over on landing, and wobbles to a stop after the body has " +
         "already stopped."
  });

  return [{
    n: "8.1", t: "Drawings That Move", kicker: "Intro to animation",
    stand: "Animation is the oldest special effect there is: still pictures, each a little different, shown fast " +
           "enough to come alive. The tools have changed from painted cups to computers. The trick never has.",
    mins: 14,
    objectives: ["Briefly summarise the history of animation",
                 "List the various uses of animation",
                 "Identify and describe the various styles of animation"],
    body: [
      P("Every animation, from a Victorian toy to a Pixar film, runs on one trick. Make a series of still " +
        "pictures, each changed a little from the one before, and show them quickly one after another. The " +
        "brain stops seeing separate pictures and sees movement instead."),
      W([["Illusion", "something that tricks your eyes or brain into seeing what isn't really there"],
         ["Sequence", "a set of things in a certain order, one after another"],
         ["Project", "to shine a picture onto a wall or screen, the way a projector does"],
         ["Algorithm", "a list of step-by-step instructions that a computer follows"],
         ["Simulation", "a computer's pretend version of something real, like a car crash"]]),
      D("Animation", "The making of a sequence of still images, each slightly different, that appear to move " +
        "when shown in quick succession. The images can be drawn, painted, built, photographed or computed.",
        "Lots of still pictures, each a tiny bit different, shown so fast that they seem to move."),
      F({ imgs: [{ src: M + "8-1-timeline.svg", w: 700, h: 580,
                   alt: "Timeline in two columns. Before film: a painted goblet about 5,000 years old, the magic " +
                        "lantern of 1659, the thaumatrope of 1825, the phenakistiscope of 1833, the zoetrope of " +
                        "1834, the flip book of 1868 and the praxinoscope of 1877. On film and computers: Humorous " +
                        "Phases of Funny Faces 1906, Fantasmagorie 1908, Gertie the Dinosaur 1914, Steamboat Willie " +
                        "1928, Snow White 1937, Neighbours 1952 and Toy Story 1995." }],
          cap: "Moving pictures over five thousand years. Each device on the left is a different way of showing " +
               "one drawing, then the next, fast enough to fool the eye.",
          credits: OEDU, diagram: true }),

      H("Before film"),
      P("People tried to show motion long before they could make it. A clay goblet about 5,000 years old, " +
        "found at Shahr-e Sukhteh — the Burnt City — in Iran, is painted with five pictures of a wild goat " +
        "leaping at a tree. Turn the cup and the goat seems to jump, and it is often called the oldest known " +
        "animation."),
      P("The <b>magic lantern</b>, developed in the 1650s, was an early projector: a lamp and a lens that threw " +
        "pictures painted on glass onto a wall in a dark room. Some slides had moving parts, so a picture could " +
        "change as it was shown, and later showmen used lanterns for ghost shows in which skeletons and demons " +
        "seemed to rush at the audience."),
      F({ imgs: [{ src: M + "8-1-magic-lantern.jpg", w: 588, h: 772,
                   alt: "An old metal magic lantern with a brass lens at the front and a chimney on top, with a long " +
                        "painted glass slide pushed through its middle." }],
          cap: "A magic lantern at Aulendorf Castle museum, in Germany. The painted glass slide slides through the " +
               "slot in the middle; the lamp inside shines through it and the lens throws the picture onto a wall.",
          credits: [cc("Andreas Praefcke", "Laterna_magica_Aulendorf.jpg", "CC BY 3.0", BY3)], size: "medium" }),
      P("In 1825 a toy called the thaumatrope went on sale in London. It is a disc of card with a picture on " +
        "each side — a bird on one, a cage on the other — and a string at each edge. Twirl the strings and the " +
        "disc flips so fast that you see both pictures at once."),
      F({ imgs: [{ src: M + "8-1-thaumatrope.svg", w: 700, h: 368,
                   alt: "A thaumatrope: the front of a card shows a bird, the back shows a cage drawn upside down, " +
                        "and when the card spins the bird appears inside the cage." }],
          cap: "Two pictures, one image. The back is drawn upside down, because the card turns over as it spins.",
          credits: OEDU, diagram: true }),
      D("Thaumatrope", "A 19th-century optical toy: a disc with a different picture on each side, spun on " +
        "strings so fast that the two pictures seem to become one.",
        "A spinning card with a picture on each side. Spin it fast and the two pictures look like one."),
      N("<b>A correction to the course text.</b> It says a thaumatrope's pictures “run together to form one " +
        "moving animation”. Most thaumatropes show no movement at all: they join two pictures into one still " +
        "image, like the bird in its cage. What they proved is that the eye blends pictures that follow each " +
        "other quickly — the idea every animation device after them was built on."),

      H("Toys that really moved"),
      P("The first devices to show true animation arrived in 1833. Joseph Plateau's <b>phenakistiscope</b> was a " +
        "disc with a ring of drawings, each a step further through a movement, and slots round its edge. You spun " +
        "it in front of a mirror and looked through the slots: each slot showed one drawing for an instant and " +
        "hid the blur in between, so the drawings ran."),
      F({ imgs: [{ src: M + "8-1-phenakistiscope.gif", w: 440, h: 440,
                   alt: "A round cream-coloured disc printed with a ring of black rats and slots round its edge. The " +
                        "rats run in a circle as the animation plays." }],
          cap: "A phenakistiscope disc of running rats, made in London in 1833, played from its sixteen drawings. " +
               "On the real toy you watched this through the slots, in a mirror.",
          credits: [{ by: "Thomas Mann Baynes (disc); animated by Basile Morin",
                      byUrl: commons("Animated_phenakistiscope_disc_-_Running_rats_Fantascope_by_Thomas_Mann_Baynes_1833.gif"),
                      site: "Wikimedia Commons",
                      siteUrl: commons("Animated_phenakistiscope_disc_-_Running_rats_Fantascope_by_Thomas_Mann_Baynes_1833.gif"),
                      license: "Public domain" }],
          natural: true, size: "medium" }),
      P("The <b>zoetrope</b> did the same job with a drum. A strip of drawings sits inside a spinning cylinder, " +
        "and you watch through slits in its side — no mirror needed, and several people can look at once. " +
        "William Horner built the first in 1834, and as the zoetrope it became a popular toy from 1866. The " +
        "<b>flip book</b> (1868) needed no machine at all, only a thumb, and Émile Reynaud's <b>praxinoscope</b> " +
        "(1877) swapped the slits for a ring of mirrors, which gave a brighter, steadier picture."),
      F({ imgs: [{ src: M + "8-1-zoetrope.jpg", w: 1400, h: 1050,
                   alt: "A black metal zoetrope drum on a stand, decorated with blue patterns, with a strip of " +
                        "drawings of a horse and rider running round the inside and tall slots in its upper wall." }],
          cap: "A zoetrope at Leeds Industrial Museum. The drawings of a horse and rider run round the inside of " +
               "the drum; spin it and look through the slots, and the horse gallops.",
          credits: [cc("Clem Rutter", "Leeds_Industrial_Museum_zoetrope_7125.JPG", "CC BY-SA 3.0", BYSA3)] }),
      TRY("Make a flip book", "Take a pad of sticky notes and start on the last page, so you can see each drawing " +
          "faintly through the page on top of it. Draw a ball near the top. On the next page up, draw it a little " +
          "lower, and keep going until it hits the bottom and bounces back. Then flick the pages past your thumb " +
          "from back to front. Twelve pages is enough to see it move."),

      H("From toys to film"),
      P("Once there were film cameras, drawings could be photographed one at a time and projected. J. Stuart " +
        "Blackton's <i>Humorous Phases of Funny Faces</i> (1906) brought chalk faces to life on a blackboard, " +
        "and Émile Cohl's <i>Fantasmagorie</i> (1908) was made entirely of drawings."),
      F({ imgs: [{ src: M + "8-1-funny-faces.jpg", w: 950, h: 716, label: "1906 · Blackton",
                   alt: "A white chalk drawing of a clown holding a hoop, with a small dog, on a black background." },
                 { src: M + "8-1-fantasmagorie.jpg", w: 595, h: 446, label: "1908 · Cohl",
                   alt: "A white line drawing on black of a small clown-like figure sitting on the trunk of an " +
                        "elephant." }],
          cap: "Two of the first drawn films. Blackton's figures were drawn in chalk on a blackboard; Cohl drew on " +
               "paper and printed his film in negative, so the lines glow white on black.",
          credits: [cc("J. Stuart Blackton", "Humorous_Phases_of_Funny_Faces_screenshot.jpg", "Public domain", null, "Left"),
                    cc("Émile Cohl", "Fantasmagorie.png", "Public domain", null, "Right")] }),
      N("<b>A correction to the course text.</b> Its side note names <i>The Enchanted Drawing</i> (1900) as the " +
        "first animation recorded on standard picture film. That film is often named as the first with animated " +
        "moments, but they were made with a camera trick — stop filming, swap the drawing, start again — rather " +
        "than frame-by-frame drawing. <i>Humorous Phases of Funny Faces</i> (1906) is the usual answer for the " +
        "first true animated film on standard film."),
      P("Winsor McCay's <i>Gertie the Dinosaur</i> (1914) showed that a drawing could have a personality: Gertie " +
        "sulks, cries and dances, across thousands of drawings. In 1937 Disney released <i>Snow White and the " +
        "Seven Dwarfs</i>, the first feature-length animated film made in America."),

      H("Animation at work"),
      P("Animation isn't only for entertainment. It can show what no camera can film: the inside of a beating " +
        "heart, a molecule folding, a building that hasn't been built."),
      L("Where you'll find it", [
        ["Medicine", "Surgeons study animations of new procedures, and hospitals use them to show patients what " +
         "an operation involves. Students watch processes too small or too fast to see, like a cell dividing."],
        ["Business", "Animated training videos for new staff, explainer videos, and pitches that show a product " +
         "before it exists."],
        ["Architecture", "A walk-through of a building made from its plans, so a client can explore it before " +
         "paying to build it."],
        ["Car safety", "Engineers run crashes as computer simulations and turn the results into animations, to " +
         "see how a car's structure and its passengers would move in a collision."],
        ["Science and news", "Weather maps, space missions, and anything that happened where no camera was."]
      ]),
      N("<b>A correction to the course text.</b> Twice it says animations are made with “logarithms”. It means " +
        "<i>algorithms</i>, the step-by-step instructions a computer follows; a logarithm is a kind of maths. And " +
        "a car-crash animation is the output of a crash simulation, which calculates how the car would behave — " +
        "the animation is how engineers see the answer."),
      WORLD("Crash tests before the crash", "Carmakers still crash real cars, but long before that they crash " +
            "virtual ones, over and over, on computers. Each simulated crash becomes an animation an engineer can " +
            "slow down, spin round and replay from inside the car."),

      H("Three families of animation"),
      F({ imgs: [{ src: M + "8-1-styles.svg", w: 700, h: 530,
                   alt: "Three families of animation. Drawn, or 2D: traditional, limited and 2D digital. Stop " +
                        "motion: puppets and objects, clay, and pixilation. Computer, or 3D: model, texture, rig, " +
                        "animate and render." }],
          cap: "Every style makes frames. What differs is how each frame is made: drawn, photographed or " +
               "calculated by a computer.",
          credits: OEDU, diagram: true }),
      P("<b>Traditional animation</b> — also called classical or hand-drawn animation — is made by drawing every " +
        "frame by hand. It was the main way cartoons were made for most of the 20th century, until computer " +
        "animation took over."),
      F({ imgs: [{ src: M + "8-1-gertie-frames.jpg", w: 1400, h: 464,
                   alt: "Two pencil-and-ink drawings on yellowed paper: on the left the dinosaur Gertie bends down " +
                        "to drink from a lake; on the right only her head and neck appear at the edge of the scene." }],
          cap: "Two of the thousands of drawings for <i>Gertie the Dinosaur</i> (1914). Notice that the trees and " +
               "rocks are redrawn on every sheet too — before cels, that was the only way.",
          credits: [cc("Winsor McCay", "Two_frames_from_Gertie_the_Dinosaur_(original_art).jpg", "Public domain")] }),
      D("Cel", "A clear sheet of celluloid plastic on which a character is inked and painted, so it can be laid " +
        "over a painted background and photographed. The background is painted only once.",
        "A see-through plastic sheet with a drawing on it. You lay it on top of a background, so the background " +
        "never has to be drawn again."),
      D("Limited animation", "Animation that saves time and money by reusing drawings and redrawing only the " +
        "parts that move — a mouth, an arm — while the rest of the character stays still.",
        "Only redraw what moves. If a character is just talking, draw the mouth again and again, and keep the rest."),
      F({ imgs: [{ src: M + "8-1-cel-layers.svg", w: 700, h: 510,
                   alt: "Four layers stacked like cards: a painted room, a clear cel with a woman's body in a chair, " +
                        "a cel with her head, and a cel with only her mouth. Together they make one frame. Only the " +
                        "mouth layer is redrawn as she talks." }],
          cap: "The course's example of limited animation: a woman in a chair, talking. Her body is drawn once, " +
               "and only the top cel — her mouth — is redrawn for each sound.",
          credits: OEDU, diagram: true }),
      N("<b>A note on the course text.</b> It describes limited animation as “the use of the cel technique”. Cels " +
        "made limited animation practical, because a still layer can sit under a moving one — but full " +
        "animation, like <i>Snow White</i>, was painted on cels too. The cel is the tool; limited animation is " +
        "the choice to redraw as little as possible."),
      P("<b>2D digital animation</b> works the same way, except that the drawings are made directly on a " +
        "computer or tablet, usually on layers that behave like cels. There is no paper to scan, colours fill in " +
        "a click, and a mistake can be undone."),

      H("Stop motion"),
      D("Stop motion", "Animation made by photographing real objects one frame at a time, moving them slightly " +
        "between photographs, so that they seem to move by themselves when the frames are played.",
        "Move a toy a tiny bit and take a photo. Move it again, take another. Play the photos fast and the toy " +
        "moves by itself."),
      P("Stop-motion figures are usually built over an <b>armature</b>, a jointed metal skeleton that holds each " +
        "pose, and covered in clay, foam or fabric. Clay animation, like <i>Wallace and Gromit</i>, is one kind; " +
        "puppets, paper cut-outs, building bricks and even food are others."),
      F({ imgs: [{ src: M + "8-1-clay-animation.jpg", w: 1200, h: 840, label: "Clay figures",
                   alt: "Two brightly coloured clay characters sit on a bench by a campfire in front of a snowy " +
                        "clay house at night." },
                 { src: M + "8-1-armature-hand.jpg", w: 1080, h: 722, label: "Inside: an armature",
                   alt: "A small jointed steel hand for a stop-motion puppet, with long twisted wire fingers, on a " +
                        "grey background." }],
          cap: "Left: a clay set and characters from the <i>Kuzmich</i> series by Max Sviridov Studios. Right: a " +
               "jointed steel hand, the kind of armature hidden inside a puppet so its fingers hold each pose.",
          credits: [cc("Max Sviridov", "Animacion-con-plastilina-y-clay-animation-pelicula-Kuzmich-153.jpg",
                       "Public domain", null, "Left"),
                    cc("Danylo Maliuha (cropped)",
                       "Steel_Animation_Hands_with_Aluminum_Wire_Fingers_–_Armature_Puppet_(2021).jpg",
                       "CC BY-SA 4.0", BYSA4, "Right")] }),
      N("<b>A correction to the course text.</b> It says that stop motion, unlike 2D digital animation, “is not” " +
        "time-consuming. It is one of the slowest kinds of animation there is: every frame means moving every " +
        "puppet a fraction and taking a new photograph. At Aardman, the studio behind <i>Wallace and Gromit</i>, " +
        "an animator finishes about two seconds of film a day."),
      D("Pixilation", "A form of stop motion in which live actors are the objects: they hold a pose for each " +
        "frame and shift it slightly before the next, so they move like puppets on screen.",
        "Stop motion with real people. They freeze, get photographed, move a little, and freeze again."),
      P("Norman McLaren's <i>Neighbours</i> (1952), made at the National Film Board of Canada, is the classic " +
        "example, and it won an Academy Award. Pixilation lets people glide across the ground without walking, " +
        "or hover in the air."),
      TRY("Make your friends fly", "Put a phone somewhere steady and open any free stop-motion app. Ask a friend " +
          "to jump, and take a photo only while they are in the air. Do it twenty times, with your friend a step " +
          "further along each time. Play it back: they fly across the room."),

      H("3D computer animation"),
      P("In <b>3D animation</b>, often called CGI (computer-generated imagery), characters and sets exist as " +
        "models inside a computer. Artists pose them, and the computer draws each frame with depth, light and " +
        "shadow that would be very hard to draw by hand. <i>Toy Story</i> (1995) was the first feature film made " +
        "this way from start to finish."),
      D("3D modeling", "Building a mathematical description of an object's surface in three dimensions — usually " +
        "a mesh of many small flat faces — so a computer can show it from any angle.",
        "Building an object inside the computer out of lots of tiny flat pieces, like a paper model, so you can " +
        "look at it from any side."),
      F({ imgs: [{ src: M + "8-1-utah-teapot-real.jpg", w: 1000, h: 750, label: "The real teapot",
                   alt: "A plain white porcelain teapot in a museum display case." },
                 { src: M + "8-1-utah-teapot-model.jpg", w: 1000, h: 662, label: "The 3D model",
                   alt: "A smooth grey computer-generated teapot on a white floor, lit from above, with a soft " +
                        "shadow." }],
          cap: "The Utah teapot. In 1975 Martin Newell turned his family's teapot into numbers a computer could " +
               "draw. The model became one of the most-used test objects in computer graphics, and the real teapot " +
               "is now in the Computer History Museum.",
          credits: [cc("The wub", "Utah_Teapot_circa_1974,_Computer_History_Museum.jpg", "CC BY-SA 4.0", BYSA4, "Left"),
                    cc("Dhatfield", "Utah_teapot_simple_2.png", "CC BY-SA 3.0", BYSA3, "Right")] }),
      N("<b>A correction to the course text.</b> It calls 3D modeling “a more complex form of 3D animation”. " +
        "Modeling isn't a kind of animation; it is the first step of one. A model has to exist before it can be " +
        "textured, rigged and moved — and many models, like a part sent to a 3D printer, are never animated."),
      F({ imgs: [{ src: M + "8-1-3d-pipeline.svg", w: 700, h: 330,
                   alt: "Five steps with one simple figure: a wire-mesh model, the same figure with a striped " +
                        "texture, a skeleton rig inside it, the skeleton posed with an arm raised, and a shaded " +
                        "render with a shadow." }],
          cap: "The order a 3D character is made in. Each step depends on the one before.",
          credits: OEDU, diagram: true }),
      D("Texture mapping", "Wrapping a flat image — a photograph or a painting — around the surface of a 3D model " +
        "to give it colour, pattern and detail.",
        "Wrapping a picture around a 3D shape, like wrapping paper round a present, so it looks like skin, wood " +
        "or cloth."),
      F({ imgs: [{ src: M + "8-1-texture-mapping.png", w: 800, h: 600,
                   alt: "Texture-mapping software: on the left a face's texture laid out flat with a grid over it, " +
                        "on the right the same texture wrapped round a 3D head." }],
          cap: "Texture mapping in UVMapper. The same picture of a face appears flat on the left and wrapped round " +
               "the 3D head on the right; the grid shows which part of the flat picture lands where.",
          credits: [cc("Asier03", "Texture_Mapping_example.png", "CC BY-SA 4.0", BYSA4)] }),
      D("Rigging", "Building a skeleton of connected joints — a rig — inside a 3D model, with controls that let an " +
        "animator bend and pose it.",
        "Putting bones inside a 3D character so an animator can move its arms, legs and face, like the strings " +
        "on a puppet."),
      P("Without a rig, a model is a statue: it can be moved as a whole, but it can't bend an elbow. With one, an " +
        "animator turns a control and the arm swings."),
      N("<b>A note on the course text.</b> It calls rigging “an emerging animation technique”. Rigging has been a " +
        "standard part of 3D animation for decades; what is still developing is how much of it can be done " +
        "automatically."),
      R([
        { by: "Frank Thomas and Ollie Johnston", year: "1981", title: "The Illusion of Life: Disney Animation",
          pub: "Abbeville Press", note: "The history of Disney's craft, told by two of its animators." },
        { by: "Donald Crafton", year: "1993", title: "Before Mickey: The Animated Film 1898–1928",
          pub: "University of Chicago Press", note: "Blackton, Cohl and McCay, and the first years of animated film." },
        { by: "Sonja Anderson", year: "2026",
          title: "Here's How Animators Make Stop-Motion Masterpieces Like 'Wallace & Gromit' Come Alive",
          pub: "Smithsonian Magazine",
          url: "https://www.smithsonianmag.com/smart-news/heres-how-animators-make-stop-motion-masterpieces-like-wallace-and-gromit-come-alive-180988254/" },
        { by: "Computer History Museum", title: "The Utah Teapot", pub: "Revolution: The First 2000 Years of Computing",
          url: "https://www.computerhistory.org/revolution/computer-graphics-music-and-art/15/206" }
      ])
    ],
    check: { q: "True or false: Stop-motion animators physically move the subject or object, and photograph each new " +
                "position.",
             opts: ["True", "False"], right: 0,
             why: "True. Each frame is a photograph of the object in a slightly new position, which is why stop " +
                  "motion is so slow to make." }
  }, {
    n: "8.2", t: "The Language of Animation", kicker: "Animation terms",
    stand: "Animators have a word for everything that happens between two drawings. Learn the words and you can " +
           "read an animation the way an animator does: frame by frame.",
    mins: 14,
    objectives: ["Identify and define the key terms used in animation"],
    body: [
      P("A good animator needs more than skill with a pencil or a mouse; they need the language animators use " +
        "with each other. These are the words you'll hear in any studio."),
      W([["Interval", "the gap between two things"],
         ["Pose", "the position a character holds at one moment"],
         ["Replica", "a copy made to look like the real thing"],
         ["Hypothesis", "an idea that scientists test, not yet proven"],
         ["Eerie", "strange in a way that makes you uneasy"]]),

      H("Frames and keys"),
      P("A <b>frame</b> is one still image in an animation. It is also the unit animators count time in: film " +
        "shows 24 frames every second, so a frame lasts one twenty-fourth of a second."),
      D("Key frame", "A drawing or pose that marks an important moment in a movement — where it starts, where it " +
        "ends, or where it changes direction. Key frames are made first; the frames between them come after.",
        "The most important pictures in a move, drawn first — like the dots in a dot-to-dot before you draw the " +
        "lines."),
      N("<b>A correction to the course text.</b> It says the key frame is “the first drawing in an animation or " +
        "scene”. A key frame can fall anywhere. A ball's hop needs at least three: take-off, the top of the hop " +
        "and the landing."),
      F({ imgs: [{ src: M + "8-2-keys-inbetweens.svg", w: 700, h: 440,
                   alt: "A ball's hop in thirteen frames: keys at frames 1, 7 and 13, breakdowns at 4 and 10, and " +
                        "in-betweens everywhere else, with a numbered strip of frames marked K, B and i." }],
          cap: "Keys fix the take-off, the top and the landing. Breakdowns decide the path between them. " +
               "In-betweens fill the rest.",
          credits: OEDU, diagram: true }),
      D("In-betweening", "Creating the frames between two key frames so that one pose flows smoothly into the " +
        "next. Also called tweening; the drawings made are in-betweens.",
        "Drawing the pictures that go in the gaps between the key pictures, so the move looks smooth."),
      P("In a big studio, lead animators draw the keys and assistants — in-betweeners — fill the gaps. In " +
        "software the computer can do the in-betweening, which is why the result is called a <b>tween</b>. A " +
        "<b>breakdown</b> is the first in-between an animator draws, and it decides the path from one key to the " +
        "next: whether the ball flies high or skims low. Keys at the very ends of a movement are also called " +
        "<b>extremes</b>."),

      H("Ones, twos and frame rate"),
      P("<b>Frame rate</b>, from Unit 7, is how many frames are shown each second, and film runs at 24. But an " +
        "animator doesn't have to make a new drawing for every one of those 24 frames."),
      D("On twos", "Animating with each drawing held for two frames: twelve drawings for each second of film. " +
        "Animating on ones means a new drawing on every frame, twenty-four a second.",
        "Showing each drawing twice in a row. Half as many drawings, the same speed — just a little less smooth."),
      ROLL,
      N("<b>A correction to the course text.</b> It says animating on ones makes “a very fast movement” and on " +
        "twos a slower one. Ones and twos don't change speed: the ball above crosses in one second either way. " +
        "They change smoothness. Animators do often switch to ones for fast action, because big jumps between " +
        "fewer drawings would stutter."),
      WORLD("Spider-Man, on twos", "In <i>Spider-Man: Into the Spider-Verse</i> (2018), Miles Morales is " +
            "animated on twos early in the film, while he is still clumsy, next to an experienced Spider-Man " +
            "animated on ones. Once Miles masters his powers, he moves on ones too. The frame count tells his " +
            "story."),

      H("Frame by frame, or tweened"),
      P("In animation software, <b>frame-by-frame</b> animation means every frame is its own drawing. It gives " +
        "the most control, for complex changes, and it makes the biggest files. <b>Tweened</b> animation stores " +
        "only the key frames and lets the program calculate the rest, which is quicker and keeps files small."),
      N("<b>A correction to the course text.</b> It says frame-by-frame animation changes “the stage or " +
        "background” in every frame. In animation software, the stage is the whole picture area, not the " +
        "background. Frame by frame means each frame's contents are drawn separately; the background can stay " +
        "exactly the same."),

      H("Holding still"),
      P("A <b>hold</b> keeps one drawing on screen for a moment, which reads as a pause. In hand-drawn " +
        "animation that works well. In 3D animation, where every surface is perfectly still, an exact hold makes " +
        "a character look frozen solid."),
      D("Moving hold", "A pause in which the character keeps moving very slightly — a breath, a blink, a drifting " +
        "hand — so it doesn't look frozen.",
        "A pause where the character still moves a tiny bit, so it looks alive and not like a statue."),
      D("Boil", "A shimmer made by tracing the same drawing several times and cycling through the copies. No two " +
        "tracings match exactly, so the lines wriggle while the character holds still.",
        "Drawing the same picture a few times and playing them in a loop. The lines wiggle a little, so the " +
        "picture feels alive."),
      P("A boil can be a whole style. The cartoon <i>Dr. Katz, Professional Therapist</i> was made with " +
        "Squigglevision, which loops five slightly different drawings so that every outline shivers."),

      H("Cycles"),
      D("Cycle", "A short series of drawings that ends where it begins, so it can repeat over and over — a walk, a " +
        "run, a flag waving.",
        "A few drawings that loop, like a GIF. The last one leads straight back into the first."),
      P("The classic is the walk cycle. One step with each foot takes at least four poses: the left foot forward " +
        "(a <b>contact</b>), the legs passing, the right foot forward, and the legs passing again. Then it loops."),
      WALK,
      N("<b>A correction to the course text.</b> It describes a three-frame walk: left leg forward, legs together, " +
        "right leg forward, and repeat. That loop breaks. From “right leg forward” it jumps straight back to " +
        "“left leg forward”, and the legs swap places in a single frame — choose “The course's 3” above to see " +
        "it. A cycle has to pass through the middle again on the way back."),

      H("Two ways to work"),
      F({ imgs: [{ src: M + "8-2-straight-vs-pose.svg", w: 700, h: 490,
                   alt: "Two rows of frames. Straight ahead: a flame drawn in frames 1 to 7 in order. Pose to pose: " +
                        "a ball's hop where the two keys are drawn first, the breakdown third and the in-betweens last." }],
          cap: "The same seven frames, drawn in two different orders.",
          credits: OEDU, diagram: true }),
      D("Pose to pose", "Animating by planning a scene's key poses first, then the breakdowns, then the " +
        "in-betweens. The opposite method, straight ahead action, draws each frame in order from first to last.",
        "Draw the big, important poses first, then fill in the gaps. The other way, straight ahead, draws picture " +
        "1, then 2, then 3, in order."),
      P("Straight ahead gives lively, surprising movement, which is why animators use it for fire, water, smoke " +
        "and wild action. Pose to pose gives control: the poses are clear and the timing is planned, so most " +
        "acting and emotional scenes are done that way. Many animators mix the two — pose to pose for the " +
        "character, straight ahead for its flapping coat."),
      N("<b>A correction to the course text.</b> It explains that pose to pose is less fluid because it is “much " +
        "more difficult to create exact and convincing poses after the key frames”. That has it backwards: pose " +
        "to pose makes the poses easy to control. Its risk is in-betweens that come out too even and stiff."),

      H("Snappy and swimmy"),
      P("Animators also have words for how movement feels. <b>Snappy</b> movement gets into each pose quickly " +
        "and holds it, so actions read crisply — good for comedy and action. <b>Swimmy</b> movement drifts from " +
        "pose to pose without clear stops, so everything feels mushy, and an animator who hears it will go back " +
        "and fix the timing."),
      N("<b>A correction to the course text.</b> It says snappy and swimmy describe frame rate. They describe " +
        "timing and spacing — where the drawings fall in time — and a film at 24 frames a second can be either. " +
        "(And a viewer's interest is <i>piqued</i>, not “peaked”.)"),

      H("Borrowing real movement"),
      D("Rotoscope", "A device, patented by Max Fleischer in 1917, that projects live-action film one frame at a " +
        "time onto glass so an animator can trace the movement. Tracing over live footage is called rotoscoping.",
        "A machine that shows a real film on glass so an artist can trace over it. The cartoon then moves just " +
        "like a real person."),
      F({ imgs: [{ src: M + "8-2-rotoscope-patent.png", w: 900, h: 900,
                   alt: "A patent drawing of a man standing at an upright drawing board, pencil in hand, with a film " +
                        "projector mounted behind the board throwing its picture onto it." }],
          cap: "A drawing from Max Fleischer's rotoscope patent. The projector throws one frame of film onto the " +
               "drawing surface; the animator traces it, then winds on to the next frame.",
          credits: [cc("Max Fleischer, US patent 1,242,674", "US_patent_1242674_figure_3.png", "Public domain")],
          size: "medium" }),
      P("Fleischer applied for the patent in 1915, and filmed his brother Dave in a clown suit to create Koko the " +
        "Clown. His studio later rotoscoped the bandleader Cab Calloway's dancing for Betty Boop cartoons. In " +
        "visual effects today, rotoscoping also means tracing round a moving object to cut it out of footage."),
      D("Motion capture", "Recording the movement of a real performer — usually with markers on a suit tracked by " +
        "many cameras — and applying it to a digital character. Often shortened to mo-cap.",
        "An actor wears a suit covered in dots. Cameras follow the dots, and a computer character copies every " +
        "move."),
      F({ imgs: [{ src: M + "8-2-motion-capture.jpg", w: 1400, h: 933,
                   alt: "In a bright studio, an actor in a black motion-capture suit dotted with markers stands with " +
                        "arms out while a technician adjusts a camera headset on her head." }],
          cap: "An actor being fitted for motion capture at Bones Studio in Warsaw. Cameras round the room track the " +
               "markers on her suit; the small camera on the headset records her face.",
          credits: [cc("Gabriela Cybulska", "Aktor_motion_capture.jpg", "CC BY-SA 4.0", BYSA4)] }),
      P("Motion capture animates film characters and video-game players — sports games capture real athletes so " +
        "their virtual versions move correctly — and it is used outside entertainment too, in sports science, " +
        "medicine and robotics."),

      H("The uncanny valley"),
      D("Uncanny valley", "The drop in how comfortable people feel about an artificial human as it comes very " +
        "close to looking real, but not quite. An almost-perfect digital human can seem eerie where a cartoon " +
        "does not. The idea was proposed by the roboticist Masahiro Mori in 1970.",
        "When a fake person looks almost real, but not quite, it feels creepy. A cartoon doesn't."),
      F({ imgs: [{ src: M + "8-2-uncanny-valley.svg", w: 700, h: 420,
                   alt: "A graph: as something looks more human, people like it more, from an industrial robot to a " +
                        "cartoon hero, until the line drops into a valley at an almost-real digital human and then " +
                        "climbs steeply to a real person." }],
          cap: "Drawn after Mori's graph, with animation examples. The valley sits just short of real.",
          credits: OEDU, diagram: true }),
      N("<b>A correction to the course text.</b> It says motion capture created the uncanny valley, and that the " +
        "valley is a dip in the viewer's “aptitude” for the replica. Mori described it in 1970, about robots, " +
        "long before motion-captured films. And the dip is in <i>affinity</i> — how much we like and feel at ease " +
        "with something — not aptitude, which means skill."),
      P("Animated films have fallen into the valley: many critics found the motion-captured children of <i>The " +
        "Polar Express</i> (2004) creepy. Most studios now stylise their humans on purpose — bigger eyes, simpler " +
        "shapes — to stay on the safe side of the curve."),
      R([
        { by: "Richard Williams", year: "2001", title: "The Animator's Survival Kit", pub: "Faber and Faber",
          note: "Keys, breakdowns, ones and twos, and walk cycles, drawn out step by step." },
        { by: "Masahiro Mori, trans. Karl F. MacDorman and Norri Kageki", year: "2012",
          title: "The Uncanny Valley", pub: "IEEE Robotics & Automation Magazine 19 (2), 98–100",
          url: "https://ieeexplore.ieee.org/document/6213238" },
        { by: "Max Fleischer", year: "1917", title: "Method of Producing Moving-Picture Cartoons",
          pub: "US patent 1,242,674", url: "https://patents.google.com/patent/US1242674A/en" },
        { by: "Adobe", title: "Frame-by-frame animation with Animate", pub: "Animate User Guide",
          url: "https://helpx.adobe.com/animate/using/frame-by-frame-animation.html" }
      ])
    ],
    check: { q: "True or false: Max Fleischer patented the first rotoscope, a device for tracing over live-action film.",
             opts: ["True", "False"], right: 0,
             why: "True. He applied in 1915 and the patent was granted in 1917." }
  }, {
    n: "8.3", t: "Planning an Animation", kicker: "Preproduction",
    stand: "Nobody animates a story they haven't seen first. A storyboard is the whole film drawn as a comic, " +
           "before a single frame is made.",
    mins: 8,
    objectives: ["Summarise the process and purpose of storyboarding in animation"],
    body: [
      P("Before anyone draws a frame, the story has to be settled: what happens, in what order, and what the " +
        "audience should feel at each moment. Sometimes the animator invents it. Sometimes a writer or a client " +
        "brings a script and hires an animator to show it. Either way, the animator needs to know the message " +
        "and every emotion the piece must carry."),
      W([["Script", "the written story: what happens and what everyone says"],
         ["Synopsis", "a short summary of a story"],
         ["Pitch", "a short talk to convince someone to back your idea"],
         ["Client", "the person or company paying for the work"]]),
      D("Storyboard", "A sequence of drawings, in order, showing each shot of a film, animation or game, usually " +
        "with notes on the action, dialogue and camera. It is the plan everyone works from.",
        "A comic-strip version of the film, drawn before it is made, so everyone can see the plan."),
      P("Storyboarding as we know it was developed at the Walt Disney studio in the early 1930s. Story artist " +
        "Webb Smith is credited with pinning sketches of each scene to a wall, so the team could see the whole " +
        "story at once — and rearrange it. <i>Three Little Pigs</i> (1933) was the first short with a complete " +
        "storyboard, and by the end of the decade every American animation studio used them."),
      P("Storyboard artists must be able to read a script and draw pictures that show each scene exactly, so " +
        "that directors, animators and actors can all see how the story should look and move. The camera work " +
        "from Unit 7 — shot sizes, angles, moves — is planned here too."),
      F({ imgs: [{ src: M + "8-3-storyboard-dr-floyd.jpg", w: 1600, h: 1237,
                   alt: "A storyboard page with six rough cyan sketches of two cartoon characters, each panel " +
                        "numbered, with the action and dialogue typed underneath." }],
          cap: "A storyboard page by Tom Ray for <i>The Radio Adventures of Dr. Floyd</i>, episode 408. Each panel " +
               "has a scene number and a background; underneath are the action and the dialogue.",
          credits: [cc("Tom Ray", "Storyboard_for_The_Radio_Adventures_of_Dr._Floyd.jpg", "CC BY-SA 2.0", BYSA2)] }),

      H("Three kinds of storyboard"),
      F({ imgs: [{ src: M + "8-3-storyboard-stages.svg", w: 700, h: 400,
                   alt: "Four cards in order: concept, a few rough sketches; production, every shot with notes; " +
                        "presentation, clean finished panels; and animatic, the panels timed to sound as a video." }],
          cap: "Rough, then detailed, then polished — and then moving.",
          credits: OEDU, diagram: true }),
      P("A <b>concept</b> storyboard, or proof of concept, comes first. It tells the story in a few quick " +
        "sketches — a synopsis in pictures — so the team, and anyone who might pay for the project, can see what " +
        "it is about and how events will unfold."),
      D("Production storyboard", "A detailed storyboard showing every shot as it should be drawn or filmed, with " +
        "the technical notes needed to make it: dialogue, shot size, camera angle and movement, special effects " +
        "and transitions.",
        "The full, detailed plan: every shot, plus notes on what's said, where the camera goes and which effects " +
        "to use."),
      F({ imgs: [{ src: M + "8-3-storyboard-panel.svg", w: 700, h: 440,
                   alt: "One production storyboard panel with its parts labelled: scene and shot number, shot size, a " +
                        "sketch of a girl reaching for a door, arrows for a push-in camera move, and notes for " +
                        "action, dialogue, sound, time and the transition." }],
          cap: "One panel from a production storyboard, and everything written round it.",
          credits: OEDU, diagram: true }),
      P("A <b>presentation</b> storyboard is the polished version, cleaned up and coloured for people outside the " +
        "team — often a client who would find rough sketches hard to read. Not every project needs one; for " +
        "many, the production storyboard is the most detailed board ever made."),
      N("<b>A note on the course text.</b> The three names — concept, production and presentation — are the " +
        "course's. Studios use other terms for the same stages, such as thumbnails, rough boards and clean-up " +
        "boards. The idea is the same everywhere: rough first, detailed next, polished last."),

      H("Making it work"),
      L("Words storyboard artists use", [
        ["Pace", "How fast the story moves from panel to panel. A romance lingers; an action scene races."],
        ["Pitch", "Presenting the storyboard to a client or studio, panel by panel, telling the story as you go."],
        ["Sequential", "In order. Panels are laid out to read like a comic, left to right and top to bottom."],
        ["Visual treatment", "Adding the camera work to the panels: shot sizes, angles, moves, effects and " +
         "transitions."]
      ]),
      N("<b>A note on the word “treatment”.</b> In the film industry, a treatment usually means a written " +
        "summary of a story, in prose, before the script. The course's “visual treatment” is something " +
        "different: the camera and effects notes added to a storyboard."),
      D("Animatic", "A storyboard turned into a video: the panels are timed to the dialogue, music and sound " +
        "effects and played in order, so the team can judge the pacing and length before animating.",
        "The storyboard made into a slideshow with sound, to check the timing before the real animation starts."),
      P("An animatic shows a client how the finished piece will flow, and it is how many animators decide how " +
        "long a film should be. Pixar calls them story reels, and watches and rebuilds them again and again " +
        "before the final animation begins."),
      TRY("Board a short story", "Fold a sheet of paper into six panels and draw a story in six shots: a " +
          "character wants something, tries, and fails or succeeds. Under each panel, write the action, any " +
          "dialogue and the shot size. Photograph the panels and play them as a slideshow, two seconds each. " +
          "That's your animatic."),
      R([
        { by: "D23", title: "Storyboards", pub: "Disney A to Z", url: "https://d23.com/a-to-z/storyboards/" },
        { by: "Ed Catmull with Amy Wallace", year: "2014", title: "Creativity, Inc.", pub: "Random House",
          note: "How Pixar builds and rebuilds its films as story reels." },
        { by: "John Hart", year: "2008", title: "The Art of the Storyboard", pub: "2nd ed., Focal Press" }
      ])
    ],
    check: { q: "Which kind of storyboard shows what will happen on screen and also gives the crucial technical " +
                "details for making the piece?",
             opts: ["Concept", "Production", "Presentation", "Technical"], right: 1,
             why: "The production storyboard: every shot, with dialogue, shot size, camera angle and movement, " +
                  "effects and transitions." }
  }, {
    n: "8.4", t: "Your First Animation", kicker: "Creating a simple animation",
    stand: "Start with one idea and one moving thing. A ball that bounces well teaches more about animation " +
           "than a whole story done badly.",
    mins: 7,
    objectives: ["Define frames, key frames and in-between frames"],
    body: [
      P("Making a first animation can feel huge. Start small: a short story, one idea told as directly as " +
        "possible, and tools that are easy to use. Plenty of professional animators began with a single " +
        "bouncing ball."),
      W([["Stage", "the part of the screen where you draw and see your animation"],
         ["Layer", "a see-through sheet in the software; things on different layers don't get in each other's way"],
         ["Export", "to save a finished project as a file other people can open"]]),

      H("Frames, keys and in-betweens"),
      P("The words from 8.2 are the whole job. Every drawing is a <b>frame</b>, the unit animation is measured " +
        "in. The frames that fix the important poses are <b>key frames</b>, and they set the stage for " +
        "everything after them. The frames that fill the gaps are <b>in-betweens</b>, and they turn one pose " +
        "smoothly into the next."),
      HOP,
      N("<b>The same correction as in 8.2.</b> The course again calls the key frame “the first drawing in an " +
        "animation or the scene”. Keys are the important poses wherever they fall — in the lab above, the top of " +
        "every hop is one."),

      H("Doing it in software"),
      F({ imgs: [{ src: M + "8-4-software-timeline.svg", w: 700, h: 570,
                   alt: "A sketch of animation software: a stage with a ball on a dotted arc and faded onion-skin " +
                        "copies, and a timeline with a Ball layer holding keyframes at 1, 12 and 24 joined by tweens, " +
                        "a Background layer held from 1 to 24, and a red playhead at frame 6." }],
          cap: "Almost every animation program looks like this: the stage on top, the timeline underneath, one row " +
               "for each layer.",
          credits: OEDU, diagram: true }),
      P("Adobe Animate, Toon Boom Harmony, the free programs Krita and Pencil2D, and phone apps like FlipaClip all " +
        "share this layout. The <b>stage</b> is the picture you are working on. The <b>timeline</b> is a row of " +
        "numbered frames for each <b>layer</b>, and the playhead marks the frame on the stage."),
      L("Your first animation, step by step", [
        ["1. Set up", "Choose the size of the stage and the frame rate. Twenty-four frames a second is standard."],
        ["2. Bring in your object", "Draw it or import it. If it's the wrong size, the free transform tool resizes " +
         "it: drag a corner handle."],
        ["3. First key frame", "Put the object in its starting pose on frame 1, and make frame 1 a key frame, so " +
         "the software knows it is one."],
        ["4. More keys", "Move along the timeline — say to frame 12 — add a key frame, and move the object to its " +
         "next pose."],
        ["5. In-betweens", "Draw the frames in between yourself, or have the software create a tween."],
        ["6. Check with onion skin", "Onion skinning shows faded copies of the frames around the current one. Use " +
         "it to spot jumps and fix the spacing."],
        ["7. Play and export", "Play it back, adjust the timing, then export it as a video or a GIF."]
      ]),
      WORLD("The exercise everyone starts with", "The bouncing ball is one of the first exercises in many " +
            "animation courses, and animators come back to it for years, because one small loop holds timing, " +
            "spacing, arcs and squash and stretch. You'll take it apart in 8.5."),
      TRY("Animate a bouncing ball", "In any free animation app, make a ball drop and bounce once in 24 frames: " +
          "keys on frame 1 (in the air), frame 12 (on the ground) and frame 24 (back in the air). Add the " +
          "in-betweens, then turn on onion skin and check the spacing."),
      R([
        { by: "Richard Williams", year: "2001", title: "The Animator's Survival Kit", pub: "Faber and Faber",
          note: "Its bouncing-ball chapters are where many animators start." },
        { by: "Adobe", title: "Use frames and keyframes in Adobe Animate", pub: "Animate User Guide",
          url: "https://helpx.adobe.com/animate/using/frames-keyframes.html" },
        { by: "Pencil2D", title: "Pencil2D Animation", pub: "A free, open-source 2D animation program",
          url: "https://www.pencil2d.org/" }
      ])
    ],
    check: { q: "In a 24-frame animation, a ball is posed on frames 1, 12 and 24, and the software creates the " +
                "frames between. What are frames 2 to 11 called?",
             opts: ["Key frames", "In-betweens", "Holds", "Extremes"], right: 1,
             why: "In-betweens, or tweens. The poses on frames 1, 12 and 24 are the key frames." }
  }, {
    n: "8.5", t: "The Twelve Principles", kicker: "Principles of animation",
    stand: "In the 1930s Disney's animators worked out why some drawings felt alive and others didn't. They " +
           "boiled it down to twelve principles, and animators in every style still use them.",
    mins: 15,
    objectives: ["Identify the 12 principles of animation and explain how they are used"],
    body: [
      P("Frank Thomas and Ollie Johnston, two of Disney's leading animators, set the twelve principles down in " +
        "their 1981 book <i>The Illusion of Life</i>. They describe how real things move, and how to push that " +
        "movement just far enough to feel alive on screen."),
      W([["Inertia", "the way a moving thing keeps moving, and a still thing stays still, until something " +
          "pushes it"],
         ["Volume", "how much space something takes up"],
         ["Trajectory", "the path something travels along"],
         ["Caricature", "a drawing that exaggerates someone's features on purpose"]]),
      F({ imgs: [{ src: M + "8-5-twelve-principles.svg", w: 700, h: 884,
                   alt: "A grid of twelve small pictures, one for each principle: squash and stretch, anticipation, " +
                        "staging, straight ahead and pose to pose, follow-through and overlapping action, slow in " +
                        "and slow out, arcs, secondary action, timing, exaggeration, solid drawing and appeal." }],
          cap: "All twelve on one page. The rest of this section takes them one at a time.",
          credits: OEDU, diagram: true }),

      H("1. Squash and stretch"),
      D("Squash and stretch", "Changing an object's shape as it moves — flattening on impact, lengthening at " +
        "speed — while keeping its volume the same, to show that it is flexible and has weight.",
        "A ball flattens when it hits the floor and gets longer when it zooms. But it never gets bigger or " +
        "smaller overall."),
      P("Thomas and Johnston called it the most important discovery of all. Their test was a half-filled flour " +
        "sack: drop it and it slumps flat; pick it up by the corners and it stretches long; yet it always holds " +
        "the same amount of flour. Something that never changes shape as it moves looks stiff."),
      F({ imgs: [{ src: M + "8-5-bouncing-ball-strobe.jpg", w: 1400, h: 901,
                   alt: "A basketball photographed many times on one frame against black as it bounces twice from " +
                        "left to right, making two arcs of balls, bunched together at the top of each arc and " +
                        "spread apart near the ground." }],
          cap: "A real bouncing ball, photographed 25 times a second with a strobe light. Just after each bounce " +
               "the ball is squashed out of round. The balls also bunch up at the top of each arc and spread out " +
               "near the ground: slow in and slow out, done by gravity.",
          credits: [cc("MichaelMaggs, edited by Richard Bartz", "Bouncing_ball_strobe_edit.jpg", "CC BY-SA 3.0", BYSA3)] }),
      F({ imgs: [{ src: M + "8-5-squash-stretch.svg", w: 700, h: 440,
                   alt: "A ball bouncing along an arc, round at the top, stretched when fast, flattened on landing; " +
                        "beside it, a squashed ball that grows wider marked right, and one that is only flattened " +
                        "marked wrong." }],
          cap: "Squash it and it must get wider. Flatten it without widening and it looks as if it shrank.",
          credits: OEDU, diagram: true }),
      BOUNCE,

      H("2. Anticipation"),
      D("Anticipation", "A small preparatory movement before a main action — crouching before a jump, winding up " +
        "before a throw — that tells the audience something is about to happen.",
        "A little get-ready move before the big move, like bending your knees before you jump."),
      P("Disney's animators found that audiences missed actions that came out of nowhere, so they added a short " +
        "move the other way first: down before up, back before forward. It is true to life, too. Try jumping " +
        "without bending your knees."),

      H("3. Staging"),
      P("<b>Staging</b> means presenting each idea so clearly that nobody can miss it: the character, the " +
        "action, the camera and the background all point the same way. The composition tools from 6.6 and 7.5 " +
        "help — placing the subject where the thirds lines cross, and leaving lead room, looking room and head " +
        "room."),
      N("<b>A correction to the course text.</b> Once again it gives “the rule of thirds or the golden ratio” as " +
        "one idea; see 6.6 for why they differ. It also mixes up the kinds of room in a frame, so use the " +
        "definitions from 7.5."),

      H("4. Straight ahead and pose to pose"),
      P("The two ways of working from 8.2 are a principle in themselves: straight ahead for lively, unpredictable " +
        "action, pose to pose for clear, controlled acting."),

      H("5. Follow-through and overlapping action"),
      D("Follow-through", "The way loose parts — hair, ears, clothes, a tail — keep moving after the main body " +
        "stops, then settle back. Its partner, overlapping action, is different parts of a body moving at " +
        "different times and speeds.",
        "When you stop running, your hair and your jacket keep going for a moment, then swing back. Not " +
        "everything stops at once."),
      P("Both come from physics. Loose parts have inertia, so they carry on when the body stops and lag behind " +
        "when it starts. When a character runs, its head doesn't bob in time with its legs. A character whose " +
        "parts all stop on the same frame looks like a stiff toy."),
      SACKLAB,

      H("6. Slow in and slow out"),
      D("Slow in and slow out", "Placing more drawings near the start and end of a movement and fewer in the " +
        "middle, so the action speeds up gradually and slows down before it stops. Also called easing in and out.",
        "Things start moving slowly, go faster, then slow down before they stop. Animators draw more pictures at " +
        "the start and end to show it."),
      F({ imgs: [{ src: M + "8-5-spacing.svg", w: 700, h: 420,
                   alt: "Two rows of nine balls covering the same distance: evenly spaced in the first row, bunched " +
                        "at both ends and spread in the middle in the second." }],
          cap: "Same nine drawings, same distance. Only the spacing changed — and with it, the whole feel.",
          credits: OEDU, diagram: true }),

      H("7. Arcs"),
      P("Almost every natural movement follows a curve: a thrown ball, a swinging arm, a turning head. A ball's " +
        "arc is set by how hard it was thrown. Animators draw the <b>arc</b> first and place the drawings along " +
        "it, because movement in straight lines between poses looks mechanical — which is exactly why robots are " +
        "sometimes animated that way on purpose."),

      H("8. Secondary action"),
      P("<b>Secondary action</b> is a smaller movement that supports the main one: arms swinging during a walk, a " +
        "character whistling as they stroll, fingers drumming while they wait. It adds life and personality — " +
        "but if it pulls attention away from the main action, cut it."),

      H("9. Timing"),
      D("Timing", "The number of drawings or frames given to an action, which sets how fast it happens on screen — " +
        "and so how heavy, light, calm or urgent it feels.",
        "How many pictures you use for a move. Few pictures make it fast. Lots of pictures make it slow."),
      P("Timing also shows weight and mood. A bowling ball takes longer to get going than a balloon; a tired " +
        "character's head droops over many frames, while a startled one snaps round in two."),

      H("10. Exaggeration"),
      P("<b>Exaggeration</b> pushes a pose, an expression or an action further than real life, so it reads " +
        "clearly and feels alive. It can be wild, like eyes popping out of a head, or subtle, like a slightly " +
        "bigger smile in a realistic film. It applies to character design and story, not just movement."),

      H("11. Solid drawing"),
      P("<b>Solid drawing</b> means drawing characters as real forms in three-dimensional space, with weight, " +
        "balance and volume, and with light and shadow. It's why a good 2D character seems to turn in space " +
        "instead of sliding about like a paper cut-out."),

      H("12. Appeal"),
      P("<b>Appeal</b> is what makes a character worth watching. It doesn't mean cute or good — villains need it " +
        "as much as heroes. It comes from a clear design, readable expressions and a personality the audience " +
        "can connect with."),
      WORLD("Real movement, studied", "Animators have long studied film of real people and animals, frame by " +
            "frame, and Eadweard Muybridge's motion photographs — the galloping horse from 7.1 — to see how " +
            "bodies really move before they exaggerate them."),
      WORLD("The same rules in games", "Game animators use the same twelve principles. A character that crouches " +
            "before it jumps and whose cape keeps moving after it lands feels good to control; one that doesn't " +
            "feels floaty."),
      R([
        { by: "Frank Thomas and Ollie Johnston", year: "1981", title: "The Illusion of Life: Disney Animation",
          pub: "Abbeville Press", note: "Where the twelve principles were first set out." },
        { by: "John Lasseter", year: "1987",
          title: "Principles of Traditional Animation Applied to 3D Computer Animation",
          pub: "Computer Graphics 21 (4), 35–44", url: "https://dl.acm.org/doi/10.1145/37402.37407",
          note: "The Pixar director's case that the same principles hold for computer animation." }
      ])
    ],
    check: { q: "Which principle is about the number of drawings or frames used for a particular action?",
             opts: ["Exaggeration", "Overlapping action", "Arcs", "Timing"], right: 3,
             why: "Timing. More frames make an action slower; fewer make it faster." }
  }, {
    n: "8.6", t: "Critiquing Media Art", kicker: "Media critique",
    stand: "A good critique isn't a verdict. It is a careful look that helps an artist see what their work " +
           "actually says to other people.",
    mins: 7,
    objectives: ["Outline the four key steps to critiquing media art"],
    body: [
      P("In art classes, students often hold group critiques: an artist shows a piece and classmates respond " +
        "with constructive criticism. Media art can be critiqued the same way."),
      W([["Constructive", "helpful; meant to make something better, not to put someone down"],
         ["Element", "one part of a design, like a line, a colour, a shape or a sound"],
         ["Objective", "fair, and based on what is really there rather than on feelings"],
         ["Limitation", "something a tool or program can't do"]]),

      H("What a critique is for"),
      P("Media art, like studio art, usually carries a meaning: a feeling, a question, a comment on society or a " +
        "current event. What makes it media art is that it uses technology — video, sound, animation, code, the " +
        "web — and the technology is part of how the message reaches the viewer."),
      P("So the point of a media critique is for the artist to learn how well that message landed. Viewers say " +
        "what they noticed and understood, ask questions to check whether they read the purpose right, and " +
        "suggest what might work better."),
      D("Critique", "A careful, fair response to a work of art that describes, analyzes and interprets it before " +
        "judging it, so the artist learns how well the work communicates.",
        "A careful look at someone's work that says what you see, how it works and what it means — and only then " +
        "whether it works."),
      P("A fair critique doesn't dwell only on the best parts or the worst. The most useful comments are often " +
        "about the middle: parts that are good but not yet great, and that caught someone's eye. Descriptive, " +
        "precise words matter too. “The music speeds up just as the camera pushes in” helps the artist; “it was " +
        "cool” doesn't."),
      P("Fairness also means knowing the tools. Every medium has limits, so a critic should understand the " +
        "software and technology the artist used and what they can and can't do — and may suggest a different " +
        "tool that could carry the message better."),

      H("The four steps"),
      F({ imgs: [{ src: M + "8-6-critique-steps.svg", w: 700, h: 460,
                   alt: "A staircase of four steps: describe, what do I see and hear; analyze, how is it put " +
                        "together; interpret, what does it mean; judge, does it work and why. Each has a sentence " +
                        "starter, and an arrow runs from facts first to opinion last." }],
          cap: "Climb in order. Each step stands on the one below it, and opinion waits for the top.",
          credits: OEDU, diagram: true }),
      P("The art educator Edmund Burke Feldman set out four steps for looking at art, and they work just as well " +
        "for media. Take them in order: each builds on the one before, and your own opinion waits until the end."),
      L("Describe, analyze, interpret, judge", [
        ["1. Describe", "Say what is there, without judging it: what you see and hear, and the media and " +
         "technology used. Be exact enough that someone who hasn't seen it could picture it."],
        ["2. Analyze", "Explain how the parts work together: which elements and design principles the artist " +
         "used, and which choices succeeded — with reasons, and constructive criticism."],
        ["3. Interpret", "Work out what it means. Why might the artist have chosen these elements and not others? " +
         "What is the work saying?"],
        ["4. Judge", "Now give your considered opinion: does it work, and how could it be stronger? For the " +
         "artist, this is often the most useful part."]
      ]),
      WORLD("How Pixar critiques", "At Pixar, a group of senior filmmakers called the Braintrust watches each film " +
            "while it is being made and gives the director frank notes. As co-founder Ed Catmull describes it, " +
            "the notes are about the film, not the person — and the director decides what to do with them."),
      TRY("Critique a 30-second ad", "Pick an animated advert or a short film online. Write two sentences for each " +
          "of the four steps, and don't write a single opinion until step 4."),
      R([
        { by: "North Carolina Museum of Art", title: "Feldman Method of Art Criticism", pub: "Learn at NCMA",
          url: "https://learn.ncartmuseum.org/wp-content/uploads/2019/01/Feldman-Method-of-Art-Criticism_0.pdf" },
        { by: "Ed Catmull with Amy Wallace", year: "2014", title: "Creativity, Inc.", pub: "Random House",
          note: "The chapter on the Braintrust, and why candid notes need trust." }
      ])
    ],
    check: { q: "True or false: The main difference between media art and studio art is that media art uses " +
                "technology as part of the piece.",
             opts: ["True", "False"], right: 0,
             why: "True. Both can carry a message; media art delivers it through technology." }
  }, {
    n: "8.7", t: "Presenting a Critique", kicker: "Slideshows",
    stand: "A slideshow should help people listen to you, not hand them something else to read. Plan it like a " +
           "story, with a beginning, a middle and an end.",
    mins: 7,
    objectives: ["Identify effective principles to follow when creating a slideshow presentation"],
    body: [
      P("A critique can be presented as a slideshow, with the work broken into sections. A few principles make " +
        "every slide readable and easy to follow."),
      W([["Target audience", "the particular people you are making something for"],
         ["Placeholder", "something that holds a spot until the real thing is ready"],
         ["Contrast", "how different two colours look next to each other"],
         ["Coherent", "clear and logical, so all the parts fit together"]]),

      H("Plan before you open the software"),
      P("Information is easier to take in when it comes in parts: books have chapters, and courses have lessons. " +
        "A presentation needs a beginning that introduces it, a middle that carries most of the information, and " +
        "an end that ties it all together."),
      L("Plan in this order", [
        ["Length", "Usually set for you. It decides how much you can say and how many images you can show."],
        ["Audience", "Who is watching shapes the images, language, colours and effects you choose."],
        ["Material", "Gather the images, clips and text you'll use: your own photos, or high-quality images you " +
         "are allowed to use, with credit."],
        ["Order", "Arrange it all so the message builds. This takes longest, and it matters most."]
      ]),
      N("For a critique, the middle can follow the four steps from 8.6, with a section each to describe, analyze, " +
        "interpret and judge the work."),
      D("Greeking", "Filling a layout with placeholder text — often scrambled Latin such as “lorem ipsum” — or " +
        "grey bars, to show where text will go before it is written.",
        "Fake text that holds the space where the real words will go later."),
      P("It's called greeking because it's meant to be unreadable — as in “it's all Greek to me”. Lorem ipsum " +
        "is jumbled Latin from a book by Cicero, written over 2,000 years ago. Laying out your slides this way " +
        "lets you plan the whole show before the wording is final."),
      N("<b>A correction to the course text.</b> It says greeking means filling slides with “words or small " +
        "synopses”. A short summary of each slide is a useful plan, but it isn't greeking: greeking is " +
        "deliberately meaningless placeholder text."),

      H("The beginning and the middle"),
      P("Open with the message you want the audience to remember, and give them a reason to care in the first " +
        "few slides. Then organise the body into a few main topics — the parts of the work that stood out in " +
        "your analysis and interpretation. A clear structure makes an audience more likely to follow you, and " +
        "to agree."),

      H("Design for listening"),
      F({ imgs: [{ src: M + "8-7-slides.svg", w: 700, h: 560,
                   alt: "Four example slides: a wall of text, marked wrong, beside one picture and three big words, " +
                        "marked right; orange text on yellow with a contrast of 1.6 to 1, marked wrong, beside dark " +
                        "text on white with a contrast of 16.8 to 1, marked right." }],
          cap: "Slides that help, and slides that get in the way. The numbers are contrast ratios.",
          credits: OEDU, diagram: true }),
      P("Slides work best with little text: key words, short bullet points and strong images. If a slide is full " +
        "of sentences, people read it instead of listening to you. Research on multimedia learning agrees: " +
        "people tend to learn more from pictures with spoken words than from pictures, spoken words and the same " +
        "words printed on screen."),
      P("Choose a bold, clear font and colours with strong contrast. Orange text on a yellow background strains " +
        "the eyes, and the example above scores 1.6 : 1 — far below the 4.5 : 1 that web accessibility " +
        "guidelines ask for ordinary text."),

      H("The end"),
      P("Finish by returning to the message you opened with, and give your final judgement. That ties every " +
        "section back to the main point, and reminds the audience why it mattered to them."),
      TRY("The five-word test", "Take any slide you've made. Can you say its point in five words or fewer? If " +
          "not, split it into two slides, or turn some of its words into a picture."),
      R([
        { by: "Richard E. Mayer", year: "2009", title: "Multimedia Learning", pub: "2nd ed., Cambridge University Press",
          note: "The research behind “don't read your slides aloud”." },
        { by: "W3C", title: "Understanding Success Criterion 1.4.3: Contrast (Minimum)", pub: "WCAG 2.2",
          url: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" },
        { by: "Nancy Duarte", year: "2008", title: "slide:ology", pub: "O'Reilly Media" }
      ])
    ],
    check: { q: "True or false: Slideshows are generally more successful when they include lots of text.",
             opts: ["True", "False"], right: 1,
             why: "False. Key words and strong images keep the audience listening to you." }
  }, {
    n: "8.8", t: "Bias in the Media", kicker: "Objectivity and bias",
    stand: "Every news story is a set of choices: what to include, what to leave out, and which words to use. " +
           "Spotting those choices is how you read the news instead of being led by it.",
    mins: 9,
    objectives: ["Describe the nature of bias in the media"],
    body: [
      P("A critique should judge a work on its content and message, not on the critic's own leanings. The same " +
        "goes for news: to understand an event, you need to know how the people reporting it might tilt the story."),
      W([["Bias", "leaning toward one side, often without meaning to"],
         ["Context", "the background you need to understand something properly"],
         ["Verify", "to check that something is really true"],
         ["Embellish", "to add made-up or exaggerated details to make a story more exciting"]]),

      H("How a story tilts"),
      D("Selective omission", "Leaving out facts, sources or events so that a story gives a particular impression. " +
        "Its partner, selective placement, puts some facts where everyone will see them — the headline, the front " +
        "page — and buries others.",
        "Telling only part of the story on purpose, so people see it your way — or putting some facts up front " +
        "and hiding others at the bottom."),
      F({ imgs: [{ src: M + "8-8-crop.svg", w: 700, h: 530,
                   alt: "A drawing of stadium stands, half full of people and half empty. A crop of the full part " +
                        "looks like a packed house; a crop of the empty part looks as if nobody came." }],
          cap: "Nothing here is fake. Each crop is a true picture of the stands — and each tells a false story.",
          credits: OEDU, diagram: true }),
      L("Six ways bias gets in", [
        ["Omission and placement", "Choosing which facts to report, and where. A story on the front page feels " +
         "more important than the same story on page twenty."],
        ["Imbalanced reporting", "Relying on the same source, or one side, so other views of an event never " +
         "appear — sometimes on purpose, often from not checking enough sources."],
        ["Missing context", "Leaving out the background needed to understand a situation, or blowing an event out " +
         "of proportion to draw viewers."],
        ["Loaded words", "Words that carry feelings. A plan can be “bold” or “reckless”; a crowd can “gather” or " +
         "“swarm”. Guesses about a celebrity can be embellished until they sound like facts."],
        ["Opinion dressed as news", "A reporter's own view, delivered in a confident news voice, so it sounds like " +
         "fact."],
        ["Distortion", "Publishing before checking, oversimplifying, or exaggerating, until the story no longer " +
         "matches what happened."]
      ]),
      F({ imgs: [{ src: M + "8-8-tabloids.jpg", w: 1000, h: 653, label: "Tabloids",
                   alt: "A newsstand rack of British tabloid newspapers with large, dramatic front-page headlines." },
                 { src: M + "8-8-broadsheets.jpg", w: 1000, h: 692, label: "Broadsheets",
                   alt: "A newsstand rack of British broadsheet newspapers with smaller headlines and several " +
                        "stories on each front page." }],
          cap: "British newspapers on the same morning, 5 July 2011. Each paper picked its own front-page story, " +
               "and its own words for it: selective placement on a single newsstand.",
          credits: [cc("Bobbie Johnson", "British_tabloids_-_July_5_2011_(cropped).jpg", "CC BY-SA 2.0", BYSA2, "Left"),
                    cc("Bobbie Johnson", "British_broadsheets_-_July_5_2011_(cropped).jpg", "CC BY-SA 2.0", BYSA2,
                       "Right")] }),

      H("Why we fall for it"),
      P("Bias isn't only on the reporter's side. People tend to look for, and remember, information that agrees " +
        "with what they already believe, and to skip what doesn't. Psychologists call this confirmation bias. " +
        "It's why two people can read the same article and both come away more certain of opposite views."),
      P("Removing every opinion from the news is extremely hard, so the reader's job is to notice the difference " +
        "between what was observed and what was supposed — and between a confident voice and a checked fact."),
      WORLD("The chocolate diet that wasn't", "In 2015 the science journalist John Bohannon ran a small, " +
            "deliberately weak study, announced that chocolate helps you lose weight, and sent out a press " +
            "release. News sites around the world ran the story without checking the study. Then he revealed the " +
            "hoax, to show how easily poor science becomes a headline."),

      H("Read laterally"),
      P("Professional fact-checkers don't read a doubtful page from top to bottom. They open new tabs and check " +
        "what other sources say about it — reading <b>laterally</b>, across the web. The SIFT method, from the " +
        "digital-literacy researcher Mike Caulfield, turns that habit into four moves."),
      L("SIFT", [
        ["Stop", "Notice how you feel. A headline that makes you angry or thrilled is a signal to slow down."],
        ["Investigate the source", "Who is behind this, and what do other people say about them?"],
        ["Find better coverage", "Look for trusted reporting on the same claim."],
        ["Trace it back", "Follow quotes, pictures and numbers to where they first appeared, and check nothing was " +
         "changed or cut."]
      ]),
      TRY("Two headlines, one event", "Find one news event covered by two different outlets. Write down each " +
          "headline and the first three facts each gives. What did one include that the other left out?"),
      R([
        { by: "Mike Caulfield", year: "2019", title: "SIFT (The Four Moves)", pub: "Hapgood",
          url: "https://hapgood.us/2019/06/19/sift-the-four-moves/" },
        { by: "Dan Charles", year: "2015",
          title: "Trickster Journalist Explains Why He Duped The Media On Chocolate Study", pub: "NPR",
          url: "https://www.npr.org/sections/thesalt/2015/05/29/410609184/trickster-journalist-explains-why-he-duped-the-media-on-chocolate-study" },
        { by: "Raymond S. Nickerson", year: "1998",
          title: "Confirmation Bias: A Ubiquitous Phenomenon in Many Guises",
          pub: "Review of General Psychology 2 (2), 175–220" }
      ])
    ],
    check: { q: "True or false: Reporters never disguise their personal opinions as news.",
             opts: ["True", "False"], right: 1,
             why: "False. An opinion delivered in a confident news voice can sound like fact — which is why it " +
                  "helps to check other sources." }
  }, {
    n: "8.9", t: "Sharing Your Work Online", kicker: "Web presence",
    stand: "Posting your work online can find you an audience. It can also tell strangers where you live. Share " +
           "the art, not the address.",
    mins: 11,
    objectives: ["Outline some of the precautions to take when sharing media on the web",
                 "Explain why some video sharing platforms only accept certain file types",
                 "Explain why bloggers should write about what they know and are interested in"],
    body: [
      P("An online presence lets an artist show their work to anyone, quickly. It also makes personal " +
        "information easy to find, so protecting yourself comes first."),
      W([["Personal information", "facts that point to you: your name, address, school, phone number"],
         ["Identity theft", "when someone uses your details to pretend to be you"],
         ["Compress", "to squeeze a file so it takes up less space"],
         ["Metadata", "hidden information stored inside a file, like when and where a photo was taken"]]),

      H("Stay safe while you share"),
      P("Sign-up forms for blogs and video sites ask for personal details. Never put personal information online " +
        "without permission from a parent or guardian — especially your full name, phone numbers, home address, " +
        "school, where you are now, or where you're going to be."),
      F({ imgs: [{ src: M + "8-9-overshare.svg", w: 700, h: 520,
                   alt: "A made-up social media post saying the writer is home alone all weekend, tagged with a " +
                        "street, with a photo showing a house number and a school sweatshirt. Six clues are marked: " +
                        "full name, school, when the house is empty, location tag, house number, and the location " +
                        "hidden in the photo file." }],
          cap: "A made-up post. None of it looks dangerous on its own; together it is an address, a schedule and " +
               "an empty house.",
          credits: OEDU, diagram: true }),
      L("Why each one matters", [
        ["Name and birthday", "Starting points for identity theft: with them, someone can pretend to be you."],
        ["Phone and address", "Handy for family, and for anyone who wants to turn up uninvited — including " +
         "stalkers and burglars."],
        ["Where you are, and aren't", "A check-in or location tag tells strangers where to find you, and when " +
         "your home is empty. Some apps add one automatically."],
        ["Photos", "A house number, school logo or street sign can give away more than the caption."]
      ]),
      WORLD("The map inside your photos", "Phones can save the exact GPS location in a photo's metadata. Many " +
            "social apps remove it when you post, but not every app, email or shared link does. You can turn " +
            "location tagging off in your camera settings."),

      H("Getting video onto the web"),
      P("Video sites accept only certain kinds of file, and some limit how big a file can be. So before you share, " +
        "you may need to convert a file or make it smaller — and making it smaller usually costs some quality."),
      D("Lossy compression", "Making a file smaller by permanently discarding some of its data — detail the " +
        "viewer is unlikely to notice. Also called irreversible compression. Lossless, or reversible, compression " +
        "makes a file smaller without losing any data.",
        "Shrinking a file by throwing away tiny details you probably won't miss. You can't get them back. " +
        "Lossless shrinking keeps every single detail."),
      F({ imgs: [{ src: M + "8-9-lossless-lossy.svg", w: 700, h: 480,
                   alt: "A strip of sixteen sky pixels. Lossless packs it as counts of identical colours and " +
                        "unpacks it exactly. Lossy treats similar blues as one colour: much smaller, but the " +
                        "shading is gone." }],
          cap: "Lossless writes down exactly what is there, more briefly. Lossy decides what you won't miss.",
          credits: OEDU, diagram: true }),
      F({ imgs: [{ src: M + "8-9-jpeg-quality.png", w: 519, h: 600,
                   alt: "A photograph of a wildcat's face that is sharp on the right and grows blockier toward the " +
                        "left, where the picture breaks into coloured squares." }],
          cap: "One photo, saved at lower and lower JPEG quality from right to left. Each step makes the file " +
               "smaller, and the blocks on the left are the detail that was thrown away.",
          credits: [{ by: "AzaToth, from a photo by Michael Gäbler",
                      byUrl: commons("Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png"),
                      site: "Wikimedia Commons",
                      siteUrl: commons("Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png"),
                      license: "CC BY 3.0", licenseUrl: BY3 }], size: "medium" }),
      P("Lossy compression is what makes streaming possible: JPEG photos, MP3 music and almost all online video " +
        "use it, and it is the usual choice for storing and sending media. Lossless compression is essential " +
        "wherever every bit matters — text, spreadsheets, software, bank records — because one changed digit is " +
        "a different number."),

      H("File types"),
      F({ imgs: [{ src: M + "8-9-container-codec.svg", w: 700, h: 470,
                   alt: "A video file drawn as a box labelled clip.mp4, holding a video track, an audio track and " +
                        "extras, beside lists of container types and video codecs." }],
          cap: "The file's name tells you the box. What's inside, and how it was squeezed, can differ.",
          credits: OEDU, diagram: true }),
      P("A video file's extension names its <b>container</b>, the box that holds the picture, the sound and extra " +
        "information. The picture inside has been squeezed with a <b>codec</b> (short for coder-decoder). A " +
        "player or website has to understand both, which is why a site may accept one file and refuse another " +
        "that looks the same."),
      L("Common video files", [
        [".mov", "Apple's QuickTime format, introduced in 1991. Its design became the basis for MP4."],
        [".mp4", "MPEG-4, the most widely supported container today: phones, browsers and nearly every video site."],
        [".avi", "Audio Video Interleave, introduced by Microsoft in 1992. It interleaves — alternates — chunks of " +
         "sound and picture so they play in sync."],
        [".wmv", "Windows Media Video, a family of Microsoft codecs, part of the Windows Media framework."],
        [".flv", "Flash Video, from the Adobe Flash era. Flash Player itself was retired at the end of 2020."],
        [".webm", "An open format made for the web, played by all major browsers."]
      ]),
      N("<b>Corrections to the course text.</b> It lists an “.awf” video format; there isn't a common one, and it " +
        "probably means .asf, the Microsoft container that holds WMV video. It dates .mov to 1998, but QuickTime " +
        "and its file format appeared in 1991. It says Windows computers open .mov files with QuickTime, but " +
        "Apple stopped making QuickTime for Windows in 2016; Windows plays them with its own apps or a free " +
        "player such as VLC. And WMV's three “codes” are codecs."),
      P("Each platform publishes the formats it takes. YouTube, for example, accepts MOV, MP4, AVI, WMV, FLV and " +
        "WebM, among others. Several sites the course lists have since closed — LiveLeak and Metacafe in 2021, " +
        "Veoh in 2024 — while YouTube, Vimeo, Dailymotion and Twitch carry on."),

      H("What to blog about"),
      P("When you start a blog, begin with what genuinely interests you. Above all, people search the internet " +
        "for answers, which is why focused blogs do well."),
      D("Niche blog", "A blog about one specific subject for a particular audience — stop-motion puppets, vintage " +
        "cameras, vegan baking — rather than about everything.",
        "A blog about one special topic that a certain group of people really cares about."),
      N("<b>A correction to the course text.</b> It defines a niche blog as one that “keeps the public up to date " +
        "on current events”, such as fashion or entertainment. A niche is a narrow subject, and a blog that " +
        "covers all current events is the opposite. A fashion blog becomes a niche blog when it narrows — to " +
        "thrifted streetwear, say."),
      L("Why write about what you love", [
        ["You'll keep going", "Interest keeps you putting in the time, and makes you less likely to abandon the " +
         "blog when life gets busy."],
        ["You won't run out", "Once a blog has followers, they expect regular posts — sometimes daily. A real " +
         "interest keeps producing ideas."],
        ["It shows", "Energy and knowledge come through in writing, and that is what builds a following."]
      ]),
      TRY("Find your niche", "List your hobbies, what you do in your free time, and what friends ask you for help " +
          "with. Circle anything that appears twice. That's a blog topic."),
      R([
        { by: "YouTube Help", title: "Video formats that you can upload to YouTube", pub: "Google",
          url: "https://support.google.com/youtube/troubleshooter/2888402" },
        { by: "Adobe", title: "Adobe Flash Player End of Life", pub: "adobe.com",
          url: "https://www.adobe.com/products/flashplayer/end-of-life.html" },
        { by: "Federal Trade Commission", title: "What To Know About Identity Theft", pub: "consumer.ftc.gov",
          url: "https://consumer.ftc.gov/articles/what-know-about-identity-theft" }
      ])
    ],
    check: { q: "Why might a video site refuse a file that plays perfectly on your own computer?",
             opts: ["The file is too colourful", "The site doesn't accept that file's format or codec",
                    "Video sites only accept lossless files", "The file name is too long"], right: 1,
             why: "Sites accept only certain containers and codecs, and sizes. Converting to one they list — MP4 is " +
                  "accepted almost everywhere — usually fixes it." }
  }];
})();
