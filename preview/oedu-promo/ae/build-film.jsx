/* Builds the OEdu product film in After Effects from film.json (the storyboard,
   exported from the web preview by export-film.js) and the real screens in ../shots.

   Everything is left editable:
     - every caption is ONE text layer (change the words; the word-by-word reveal is a
       Text Animator on it, and bold/quiet is character styling)
     - the real UI is real layers: "Window" (a pre-comp of the five screens) and the
       cards lifted out of them, each its own layer with a rounded mask and shadow
     - all motion is ordinary keyframes on ordinary properties; the camera is a Null
     - the Oplo mark is vector shapes with a Trim Paths draw-on

   Run it from After Effects (File > Scripts > Run Script File) or:
     osascript -e 'tell application "Adobe After Effects 2026" to DoScriptFile "<path>/build-film.jsx"'
   It writes build.log next to itself. ES3 on purpose — ExtendScript has no let, const or JSON. */
(function () {
  var LOG = [];
  function log(s) { LOG.push(s); }
  var here = File($.fileName).parent;
  function readJSON(f) { f.open("r"); var t = f.read(); f.close(); return eval("(" + t + ")"); }
  var F = readJSON(File(here.fsName + "/film.json"));
  var S = 1.5, W = 1920, H = 1080, FPS = F.fps, END = F.end, K = F.win.w / 1440;   // stage px -> comp px

  function rgb(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  var INK = rgb(F.brand.ink), QUIET_L = rgb(F.brand.quiet), QUIET_D = rgb("#8e8e93"), WHITE = [1, 1, 1];

  /* ---------- keyframes: values, easing, springs ---------- */
  function clean(keys) {                                   // strictly increasing times
    var out = [], i;
    for (i = 0; i < keys.length; i++) {
      if (out.length && Math.abs(keys[i].t - out[out.length - 1].t) < 1e-6) out[out.length - 1] = keys[i]; else out.push(keys[i]);
    }
    return out;
  }
  function copy(o) { var c = {}, p; for (p in o) c[p] = o[p]; return c; }
  function springs(keys, geo) {                            // a spring is a peak 10% past the goal, then a settle
    var out = [keys[0]], i, j, a, b, m, bb;
    for (i = 1; i < keys.length; i++) {
      a = keys[i - 1]; b = keys[i];
      if (b.e === "spring") {
        m = copy(b); m.t = a.t + 0.285 * (b.t - a.t); m.e = "out";
        for (j = 0; j < geo.length; j++) m[geo[j]] = a[geo[j]] + (b[geo[j]] - a[geo[j]]) * 1.10;
        bb = copy(b); bb.e = "io"; out.push(m); out.push(bb);
      } else out.push(b);
    }
    return out;
  }
  function easeArr(type, side, dims) {
    var infl = 70, d, a = [];
    if (type === "out") infl = side === "out" ? 18 : 88;
    else if (type === "in") infl = side === "out" ? 88 : 18;
    for (d = 0; d < dims; d++) a.push(new KeyframeEase(0, infl));
    return a;
  }
  function track(prop, keys, get, opts) {
    opts = opts || {};
    keys = clean(opts.geo ? springs(keys, opts.geo) : keys);
    var i, idx, dims, z, inT, outT, inI, outI;
    for (i = 0; i < keys.length; i++) prop.setValueAtTime(keys[i].t, get(keys[i]));
    dims = prop.isSpatial ? 1 : ((prop.value instanceof Array) ? prop.value.length : 1);   // a spatial property eases along its path: one value
    z = []; for (i = 0; i < dims; i++) z.push(0);
    for (i = 0; i < keys.length; i++) {
      idx = i + 1;
      inT = i > 0 ? keys[i].e : "io"; outT = i < keys.length - 1 ? keys[i + 1].e : "io";
      inI = inT === "lin" ? KeyframeInterpolationType.LINEAR : KeyframeInterpolationType.BEZIER;
      outI = outT === "lin" ? KeyframeInterpolationType.LINEAR : KeyframeInterpolationType.BEZIER;
      prop.setInterpolationTypeAtKey(idx, inI, outI);
      if (inI === KeyframeInterpolationType.BEZIER || outI === KeyframeInterpolationType.BEZIER)
        prop.setTemporalEaseAtKey(idx, easeArr(inT, "in", dims), easeArr(outT, "out", dims));
      if (opts.spatial) { try { prop.setSpatialTangentsAtKey(idx, z, z); } catch (e) { } }
    }
  }
  function pad(prop, x, y, zv) { return prop.value.length === 3 ? [x, y, zv === undefined ? 0 : zv] : [x, y]; }

  /* ---------- shapes ---------- */
  function roundRect(w, h, r) {
    var k = 0.5523 * r, s = new Shape();
    s.vertices = [[r, 0], [w - r, 0], [w, r], [w, h - r], [w - r, h], [r, h], [0, h - r], [0, r]];
    s.inTangents = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]];
    s.outTangents = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]];
    s.closed = true; return s;
  }
  function round(layer, w, h, r) {
    var m = layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    m.name = "Rounded corners"; m.property("ADBE Mask Shape").setValue(roundRect(w, h, r));
  }
  function fx(layer, match) { return layer.property("ADBE Effect Parade").addProperty(match); }

  var proj = app.project;
  app.beginUndoGroup("Build OEdu film");
  // re-runnable: clear what an earlier run of this script made (and nothing else)
  var mine = { "Window — the five real screens": 1, "OEdu — product film": 1, "Real OEdu screens": 1, "Cards (real UI, cropped)": 1 };
  for (var z = proj.numItems; z >= 1; z--) { try { if (mine[proj.item(z).name]) proj.item(z).remove(); } catch (e) { } }
  try {
    /* ---------- import the real screens and cards ---------- */
    var shots = here.parent.fsName + "/shots/";
    var fScreens = proj.items.addFolder("Real OEdu screens"), fCards = proj.items.addFolder("Cards (real UI, cropped)");
    function imp(file, folder) { var it = proj.importFile(new ImportOptions(File(shots + file))); it.parentFolder = folder; return it; }

    /* ---------- the window: a pre-comp of the screens, which dissolve into each other ---------- */
    var winComp = proj.items.addComp("Window — the five real screens", 1440, 900, 1, END, FPS);
    var i, j, k;
    for (i = 0; i < F.screens.length; i++) {
      var sc = F.screens[i], sl = winComp.layers.add(imp(sc.file, fScreens));
      sl.name = "Screen — " + sc.id; sl.scale.setValue([50, 50]); sl.position.setValue([720, 450]);
      track(sl.opacity, sc.keys, function (k) { return k.o * 100; });
    }
    log("window comp ok, " + F.screens.length + " screens");

    /* ---------- the film ---------- */
    var comp = proj.items.addComp("OEdu — product film", W, H, 1, END, FPS);
    comp.bgColor = [0.96, 0.96, 0.97]; comp.displayStartTime = 0;
    var bg = comp.layers.addSolid([0.961, 0.961, 0.969], "Background (light)", W, H, 1);
    try {
      var rp = fx(bg, "ADBE Ramp");
      rp.property(1).setValue([960, 0]); rp.property(2).setValue([0.961, 0.961, 0.969]);
      rp.property(3).setValue([960, 1080]); rp.property(4).setValue([0.91, 0.91, 0.929]);
    } catch (e) { log("ramp: " + e); }

    /* camera: a Null everything real is parented to; a slow push-in through each shot */
    var cam = comp.layers.addNull(); cam.name = "Camera (push-in) — keyframe me";
    cam.position.setValue([W / 2, H / 2]);
    track(cam.anchorPoint, F.camera, function (k) { return pad(cam.anchorPoint, k.x * S, k.y * S); });
    track(cam.scale, F.camera, function (k) { return pad(cam.scale, k.s * 100, k.s * 100, 100); });

    /* the window layer */
    var wl = comp.layers.add(winComp); wl.name = "Window (real OEdu screens)";
    wl.anchorPoint.setValue([720, 0]);
    var wx = (F.win.x + F.win.w / 2) * S, wy0 = F.win.y * S, wbase = F.win.w * S / 1440 * 100;
    track(wl.position, F.winKeys, function (k) { return pad(wl.position, wx, wy0 + k.y * S); }, { geo: ["y", "s"], spatial: 1 });
    track(wl.scale, F.winKeys, function (k) { return pad(wl.scale, wbase * k.s, wbase * k.s, 100); }, { geo: ["y", "s"] });
    track(wl.opacity, F.winKeys, function (k) { return k.o * 100; });
    round(wl, 1440, 900, 24 / K);
    var ep = wl.property("ADBE Effect Parade");                  // add all three, then fetch: adding one invalidates the earlier handles
    ep.addProperty("ADBE Brightness & Contrast 2"); ep.addProperty("ADBE Gaussian Blur 2"); ep.addProperty("ADBE Drop Shadow");
    var bc = ep.property(1), gb = ep.property(2), sh = ep.property(3);
    track(bc.property(1), F.winKeys, function (k) { return -k.dim * 100; });
    track(gb.property(1), F.winKeys, function (k) { return k.blur * S; });
    sh.property(2).setValue(0.30 * 255); sh.property(3).setValue(180); sh.property(4).setValue(44 * S); sh.property(5).setValue(120 * S);
    wl.setParentWithJump(cam);
    log("window layer ok");

    /* the cards, lifted out of the real screens */
    var cardBase = K * S / 2 * 100;
    for (i = 0; i < F.cards.length; i++) {
      var c = F.cards[i], cl = comp.layers.add(imp(c.file, fCards));
      cl.name = "Card — " + c.id;
      var hx = (F.win.x + (c.x + c.w / 2) * K) * S, hy = (F.win.y + (c.y + c.h / 2) * K) * S;
      (function (cl, c, hx, hy) {
        track(cl.position, c.keys, function (k) { return pad(cl.position, hx + k.dx * S, hy + k.dy * S); }, { geo: ["dx", "dy", "s"], spatial: 1 });
        track(cl.scale, c.keys, function (k) { return pad(cl.scale, cardBase * k.s, cardBase * k.s, 100); }, { geo: ["dx", "dy", "s"] });
        track(cl.opacity, c.keys, function (k) { return Math.min(1, k.o) * 100; });
        round(cl, c.w * 2, c.h * 2, c.r * 2);
        var s2 = fx(cl, "ADBE Drop Shadow");
        s2.property(3).setValue(180);
        track(s2.property(2), c.keys, function (k) { return 0.34 * Math.min(1.2, k.lift) * 255; });
        track(s2.property(4), c.keys, function (k) { return 30 * k.lift * S; });
        track(s2.property(5), c.keys, function (k) { return 90 * k.lift * S; });
        cl.setParentWithJump(cam);
      })(cl, c, hx, hy);
    }
    log("cards ok: " + F.cards.length);

    /* iris: the black circle that carries light -> black -> light instead of a cut */
    var iris = comp.layers.addShape(); iris.name = "Iris (black wipe)";
    var ig = iris.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var ie = ig.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse");
    ie.property("ADBE Vector Ellipse Size").setValue([4672, 4672]);
    var ifill = ig.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill"); ifill.property("ADBE Vector Fill Color").setValue([0, 0, 0]);
    iris.position.setValue([W / 2, H / 2]);
    track(iris.scale, F.iris, function (k) { return pad(iris.scale, k.r / 150 * 100, k.r / 150 * 100, 100); });
    log("iris ok");

    /* ---------- words ---------- */
    function fontExists(ps) { try { return app.fonts.getFontsByPostScriptName(ps).length > 0; } catch (e) { return false; } }
    var BOLD = "HelveticaNeue-Bold", MED = fontExists("HelveticaNeue-Medium") ? "HelveticaNeue-Medium" : BOLD;
    function parseLine(line, br) {                        // *stars* mark the bold words; br breaks the line after that many words
      var words = line.split(" "), on = false, txt = "", ranges = [], mix = line.indexOf("*") >= 0, w, em, a;
      for (var q = 0; q < words.length; q++) {
        w = words[q]; em = on;
        if (w.charAt(0) === "*") { on = true; em = true; w = w.substr(1); }
        if (w.charAt(w.length - 1) === "*") { on = false; w = w.substr(0, w.length - 1); }
        a = txt.length; txt += (q ? (q === br ? "\r" : " ") : "") + w;
        if (em) ranges.push([a + (q ? 1 : 0), txt.length]);
      }
      return { text: txt, ranges: ranges, mix: mix, n: words.length };
    }
    function exit(layer, base, t1, dy) {                   // words leave together: fade, rise, soften
      var t0 = t1 - 0.5;
      track(layer.opacity, [{ t: t0, v: 100, e: "io" }, { t: t1, v: 0, e: "io" }], function (k) { return k.v; });
      var b = fx(layer, "ADBE Gaussian Blur 2");
      track(b.property(1), [{ t: t0, v: 0, e: "io" }, { t: t1, v: 8 * S, e: "io" }], function (k) { return k.v; });
      track(layer.position, [{ t: t0, v: 0, e: "io" }, { t: t1, v: dy, e: "io" }], function (k) { return [base[0], base[1] + k.v]; }, { spatial: 1 });
    }
    function animator(layer, t0, n) {                     // the word-by-word reveal, on the text itself
      var an = layer.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
      an.name = "Words rise in";
      var ap = an.property("ADBE Text Animator Properties");
      ap.addProperty("ADBE Text Opacity").setValue(0);
      ap.addProperty("ADBE Text Position 3D").setValue([0, 46 * S, 0]);
      ap.addProperty("ADBE Text Blur").setValue([10 * S, 10 * S]);
      var sel = an.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
      var adv = sel.property("ADBE Text Range Advanced");
      adv.property("ADBE Text Range Units").setValue(1); adv.property("ADBE Text Range Type2").setValue(3);
      adv.property("ADBE Text Selector Smoothness").setValue(100);
      track(sel.property("ADBE Text Percent Start"), [{ t: t0, v: 0, e: "io" }, { t: t0 + n * 0.075 + 0.9, v: 100, e: "out" }], function (k) { return k.v; });
    }
    function makeText(name, str, font, size, color, base, tracking) {
      var tl = comp.layers.addText(str); tl.name = name;
      var td = tl.property("Source Text").value;
      td.resetCharStyle(); td.font = font; td.fontSize = size; td.fillColor = color; td.applyFill = true;
      td.justification = ParagraphJustification.CENTER_JUSTIFY; td.tracking = tracking;
      tl.property("Source Text").setValue(td);
      tl.position.setValue(base);
      return tl;
    }
    var ci;
    for (ci = 0; ci < F.captions.length; ci++) {
      var cp = F.captions[ci], pl = parseLine(cp.line, cp.br), dark = !!cp.dark;
      var ink = dark ? WHITE : INK, quiet = dark ? QUIET_D : QUIET_L, fs = cp.size * S;
      var base = [W / 2, (cp.top + cp.size * 0.86) * S];
      var tl = makeText("Caption — " + cp.line.replace(/\*/g, ""), pl.text, BOLD, fs, pl.mix ? quiet : ink, base, -35);
      if (pl.mix) {                                        // bold ink for the starred words, the rest quiet
        try {
          var td2 = tl.property("Source Text").value;
          for (j = 0; j < pl.ranges.length; j++) { var cr = td2.characterRange(pl.ranges[j][0], pl.ranges[j][1]); cr.fillColor = ink; }
          tl.property("Source Text").setValue(td2);
        } catch (e) { log("characterRange: " + e); }
      }
      animator(tl, cp.start, pl.n); exit(tl, base, cp.end, -26 * S);
      tl.inPoint = Math.max(0, cp.start - 0.1); tl.outPoint = cp.end + 0.05;
      if (cp.sub) {
        var sb = [W / 2, (cp.top + cp.size * 1.04 + 16 + 22) * S];
        var st = makeText("Subtitle — " + cp.sub, cp.sub, MED, 24 * S, quiet, sb, -10);
        var t0s = cp.start + pl.n * 0.075 + 0.2;
        track(st.opacity, [{ t: t0s, v: 0, e: "out" }, { t: t0s + 0.9, v: 100, e: "out" }], function (k) { return k.v; });
        exit2(st, sb, cp.end, t0s);
        st.inPoint = Math.max(0, t0s - 0.1); st.outPoint = cp.end + 0.05;
      }
    }
    function exit2(layer, base, t1, t0s) {                 // the sub-line: rises in, then leaves with its headline
      var t0 = t1 - 0.5, op = layer.opacity;
      op.setValueAtTime(t0, 100); op.setValueAtTime(t1, 0);
      var b = fx(layer, "ADBE Gaussian Blur 2");
      track(b.property(1), [{ t: t0, v: 0, e: "io" }, { t: t1, v: 8 * S, e: "io" }], function (k) { return k.v; });
      track(layer.position, [{ t: t0s, v: 18 * S, e: "out" }, { t: t0s + 0.9, v: 0, e: "out" }, { t: t0, v: 0, e: "io" }, { t: t1, v: -26 * S, e: "io" }],
        function (k) { return [base[0], base[1] + k.v]; }, { spatial: 1 });
    }
    log("captions ok: " + F.captions.length);

    /* ---------- the logo reveal: vector mark, draw-on, then the name ---------- */
    function parsePath(d) {
      var subs = [], cur = null, re = /([MLCZ])([^MLCZ]*)/g, m, n, p, q;
      while ((m = re.exec(d))) {
        n = m[2].replace(/^\s+|\s+$/g, "").split(/[\s,]+/); for (q = 0; q < n.length; q++) n[q] = parseFloat(n[q]);
        if (m[1] === "M") { cur = { v: [[n[0], n[1]]], i: [[0, 0]], o: [[0, 0]], closed: false }; subs.push(cur); }
        else if (m[1] === "L") { cur.v.push([n[0], n[1]]); cur.i.push([0, 0]); cur.o.push([0, 0]); }
        else if (m[1] === "C") {
          for (p = 0; p + 5 < n.length + 0; p += 6) {
            var prev = cur.v[cur.v.length - 1];
            cur.o[cur.o.length - 1] = [n[p] - prev[0], n[p + 1] - prev[1]];
            cur.v.push([n[p + 4], n[p + 5]]); cur.i.push([n[p + 2] - n[p + 4], n[p + 3] - n[p + 5]]); cur.o.push([0, 0]);
          }
        } else if (m[1] === "Z" && cur) { cur.closed = true; }
      }
      return subs;
    }
    var TX = 73.919875 - 187.495, TY = 252.710833 - 205.255;      // centre the mark on its own origin
    var subs = parsePath(F.markPath), mark = comp.layers.addShape(); mark.name = "Oplo mark (vector)";
    var mg = mark.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"), mc = mg.property("ADBE Vectors Group");
    for (i = 0; i < subs.length; i++) {
      var sp = subs[i]; if (sp.v.length < 3) continue;
      var lastv = sp.v[sp.v.length - 1], f0 = sp.v[0];
      if (sp.closed && Math.abs(lastv[0] - f0[0]) < 0.01 && Math.abs(lastv[1] - f0[1]) < 0.01) { sp.i[0] = sp.i[sp.i.length - 1]; sp.v.pop(); sp.i.pop(); sp.o.pop(); }
      var shp = new Shape(), vv = [];
      for (j = 0; j < sp.v.length; j++) vv.push([sp.v[j][0] + TX, sp.v[j][1] + TY]);
      shp.vertices = vv; shp.inTangents = sp.i; shp.outTangents = sp.o; shp.closed = true;
      var pp = mc.addProperty("ADBE Vector Shape - Group"); pp.name = "Mark path " + (i + 1); pp.property("ADBE Vector Shape").setValue(shp);
    }
    mc.addProperty("ADBE Vector Filter - Trim"); mc.addProperty("ADBE Vector Graphic - Stroke"); mc.addProperty("ADBE Vector Graphic - Fill");
    var trim = mc.property("ADBE Vector Filter - Trim"), stroke = mc.property("ADBE Vector Graphic - Stroke"), fill = mc.property("ADBE Vector Graphic - Fill");   // fetched again: adding invalidates handles
    stroke.property("ADBE Vector Stroke Color").setValue(WHITE); stroke.property("ADBE Vector Stroke Width").setValue(1.4);
    fill.property("ADBE Vector Fill Color").setValue(WHITE);
    var O = F.outro.at, sc0 = 255 / 206.73 * 100;
    mark.position.setValue([W / 2, H / 2 - 80 * S / 1.5]);
    track(mark.opacity, [{ t: O - 0.3, v: 0, e: "io" }, { t: O + 0.4, v: 100, e: "io" }], function (k) { return k.v; });
    track(trim.property("ADBE Vector Trim End"), [{ t: O + 0.1, v: 0, e: "io" }, { t: O + 1.8, v: 100, e: "io" }], function (k) { return k.v; });
    track(fill.property("ADBE Vector Fill Opacity"), [{ t: O + 1.5, v: 0, e: "io" }, { t: O + 2.4, v: 100, e: "io" }], function (k) { return k.v; });
    track(mark.scale, [{ t: O, v: 0.92, e: "out" }, { t: O + 6, v: 1.04, e: "out" }], function (k) { return pad(mark.scale, sc0 * k.v, sc0 * k.v, 100); });
    mark.inPoint = O - 0.3;
    var nameL = makeText("Name — " + F.outro.name, F.outro.name, BOLD, 92 * S, WHITE, [W / 2, H / 2 + 150 * S / 1.5 + 30], -40);
    animator(nameL, O + 2.0, 1); nameL.inPoint = O + 1.9;
    var byL = makeText("Byline — " + F.outro.by, F.outro.by, MED, 24 * S, [0.63, 0.63, 0.65], [W / 2, H / 2 + 150 * S / 1.5 + 100], 10);
    track(byL.opacity, [{ t: O + 3.0, v: 0, e: "io" }, { t: O + 3.8, v: 100, e: "io" }], function (k) { return k.v; }); byL.inPoint = O + 2.9;
    log("logo ok");

    /* ---------- tidy ---------- */
    comp.workAreaStart = 0; comp.workAreaDuration = END;
    comp.openInViewer();
    proj.save(File(here.fsName + "/OEdu-Film.aep"));
    var sd = Folder(here.fsName + "/stills"); if (!sd.exists) sd.create();
    var marks = F.stills || [1.5, 7.9, 13.8, 18.8, 23.6, 28.4, 34.2];
    for (i = 0; i < marks.length; i++) { try { comp.saveFrameToPng(marks[i], File(sd.fsName + "/frame-" + (i + 1) + "-" + marks[i] + "s.png")); } catch (e) { log("still " + marks[i] + ": " + e); } }
    log("saved: OEdu-Film.aep + " + marks.length + " stills");
  } catch (e) { log("FAIL: " + e.toString() + " (line " + e.line + ")"); }
  app.endUndoGroup();
  var lf = File(here.fsName + "/build.log"); lf.open("w"); lf.write(LOG.join("\n")); lf.close();
})();
