/* OEdu — "Learning you can touch" — the redesigned product film, built in After Effects.

   One continuous 3D camera flies through five REAL OEdu student screens hung in space.
   Real cards lift off each screen toward the camera, HUD labels follow them (expressions
   on toComp), a luminous "Touch" presses things, type rises letter by letter, and at the
   end the whole tunnel collapses into the Oplo mark.

   Everything is editable and nothing is baked:
     - the camera is a real After Effects camera (depth of field on), keyframed
     - screens and cards are real 3D layers; each card's lift is a keyframe on Position Z
     - captions are text layers with a Text Animator; labels are text layers whose
       position is an expression that follows their card
     - the Touch, ripples, flash, the mark and the call to action are ordinary layers
   Storyboard: film2.json <- export-film2.js <- the top of ../v2/index.html.
   Re-runnable: it clears its own items first.  ES3 on purpose (no let/const/JSON).
   Log: build2.log next to this file.                                                    */
(function () {
  var LOG = [];
  function log(s) { LOG.push(s); }
  var here = File($.fileName).parent;
  function readJSON(f) { f.open("r"); var t = f.read(); f.close(); return eval("(" + t + ")"); }
  var F = readJSON(File(here.fsName + "/film2.json"));
  var S = 1.5, ZF = 1.5, ZOOM = 2100, W = 1920, H = 1080, CX = 960, CY = 540, FPS = F.fps, END = F.end, K = 1000 / 1440;
  var CARDBASE = K * S / 2 * 100;                            // a 2x crop of the real UI, at the size the web storyboard shows it (52.08%)

  /* ---------- small tools ---------- */
  function rgb(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  function hsl(h, s, l) {                                    // h 0-360, s and l 0-1 -> [r,g,b]
    h = ((h % 360) + 360) % 360 / 360; var r, g, b;
    function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)];
  }
  function clean(keys) { var out = [], i; for (i = 0; i < keys.length; i++) { if (out.length && Math.abs(keys[i].t - out[out.length - 1].t) < 1e-6) out[out.length - 1] = keys[i]; else out.push(keys[i]); } return out; }
  function copy(o) { var c = {}, p; for (p in o) c[p] = o[p]; return c; }
  function springs(keys, geo) {                              // a spring: a peak 10% past the goal, then the settle
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
    if (type === "out") infl = side === "out" ? 18 : 88; else if (type === "in") infl = side === "out" ? 88 : 18;
    for (d = 0; d < dims; d++) a.push(new KeyframeEase(0, infl));
    return a;
  }
  function track(prop, keys, get, opts) {
    opts = opts || {};
    keys = clean(opts.geo ? springs(keys, opts.geo) : keys);
    var i, idx, dims, z, inT, outT, inI, outI;
    for (i = 0; i < keys.length; i++) prop.setValueAtTime(keys[i].t, get(keys[i]));
    dims = prop.isSpatial ? 1 : ((prop.value instanceof Array) ? prop.value.length : 1);
    z = []; for (i = 0; i < (prop.value instanceof Array ? prop.value.length : 1); i++) z.push(0);
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
  function V3(x, y, z) { return [x, y, z]; }
  function roundRect(w, h, r, centred) {
    var k = 0.5523 * r, s = new Shape(), ox = centred ? -w / 2 : 0, oy = centred ? -h / 2 : 0, v = [[r, 0], [w - r, 0], [w, r], [w, h - r], [w - r, h], [r, h], [0, h - r], [0, r]], i;
    for (i = 0; i < v.length; i++) v[i] = [v[i][0] + ox, v[i][1] + oy];
    s.vertices = v;
    s.inTangents = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]];
    s.outTangents = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]];
    s.closed = true; return s;
  }
  function circleShape(r) {
    var k = 0.5523 * r, s = new Shape();
    s.vertices = [[0, -r], [r, 0], [0, r], [-r, 0]];
    s.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]]; s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]]; s.closed = true; return s;
  }
  function maskRound(layer, w, h, r) {
    var m = layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); m.name = "Rounded corners"; m.property("ADBE Mask Shape").setValue(roundRect(w, h, r, false));
  }
  function addFx(layer, match) { var p = layer.property("ADBE Effect Parade"); p.addProperty(match); return p.property(p.numProperties); }
  function shapeLayer(name) { var l = comp.layers.addShape(); l.name = name; return l; }
  function contents(l) { return l.property("ADBE Root Vectors Group"); }
  function addGroup(l) { var g = contents(l).addProperty("ADBE Vector Group"); return g.property("ADBE Vectors Group"); }
  function key(prop, list, scale) {                          // [[t, v], ...] with the usual ease
    var i, ks = []; for (i = 0; i < list.length; i++) ks.push({ t: list[i][0], v: list[i][1], e: list[i][2] || "io" });
    track(prop, ks, function (k) { return k.v; });
  }

  /* depth: everything in the tunnel thins out as the camera passes it, and fogs with distance */
  var DEPTH = 'var c=thisComp.activeCamera; var d=toWorld(anchorPoint)[2]-c.toWorld([0,0,0])[2]; var n=linear(d,1290,1650,0,100), f=linear(d,4350,6600,100,0); value*Math.min(n,f)/100;';
  function fontExists(ps) { try { return app.fonts.getFontsByPostScriptName(ps).length > 0; } catch (e) { return false; } }
  var BOLD = "HelveticaNeue-Bold", MED = fontExists("HelveticaNeue-Medium") ? "HelveticaNeue-Medium" : BOLD;
  var MONO = fontExists("Menlo-Regular") ? "Menlo-Regular" : (fontExists("Courier") ? "Courier" : BOLD);
  var VIOLET = [0.545, 0.482, 1], BLUE = [0.302, 0.635, 1], CYAN = [0.369, 0.906, 1], PINK = [1, 0.541, 0.847];

  var proj = app.project, comp;
  app.beginUndoGroup("Build OEdu v2 film");
  var mine = { "OEdu v2 — Learning you can touch": 1, "OEdu v2 — real screens": 1, "OEdu v2 — cards": 1 };
  for (var z0 = proj.numItems; z0 >= 1; z0--) { try { if (mine[proj.item(z0).name]) proj.item(z0).remove(); } catch (e) { } }
  try {
    var shots = here.parent.fsName + "/shots/";
    var fS = proj.items.addFolder("OEdu v2 — real screens"), fC = proj.items.addFolder("OEdu v2 — cards");
    function imp(file, folder) { var it = proj.importFile(new ImportOptions(File(shots + file))); it.parentFolder = folder; return it; }
    comp = proj.items.addComp("OEdu v2 — Learning you can touch", W, H, 1, END, FPS);
    comp.bgColor = [0.016, 0.02, 0.04]; comp.displayStartTime = 0;
    var i, j, k;

    /* ---------- the void, the aurora, the floor ---------- */
    var bg = comp.layers.addSolid([0.016, 0.02, 0.04], "Void", W, H, 1);
    // soft light is a radial ramp on a plain solid, screened over the dark: a blurred shape gets its blur cut at its own bounds and leaves hard rectangles
    function blob(layer, cx, cy, colour, radius) {
      var r = addFx(layer, "ADBE Ramp"); r.name = "Blob";
      r.property(1).setValue([cx, cy]); r.property(2).setValue(colour);
      r.property(3).setValue([cx + radius, cy]); r.property(4).setValue([0, 0, 0]); r.property(5).setValue(2);
      return r;
    }
    var aur = [["Aurora violet", VIOLET, 500, 300, 1040], ["Aurora blue", BLUE, 1500, 820, 1200], ["Aurora pink", PINK, 1000, 1050, 880]];
    for (i = 0; i < aur.length; i++) {
      var al = comp.layers.addSolid([0, 0, 0], aur[i][0], W, H, 1);
      var ar = blob(al, aur[i][2], aur[i][3], aur[i][1], aur[i][4]);
      ar.property(1).expression = "wiggle(0.12,260)";
      ar.property(3).expression = 'effect("Blob")(1)+[' + aur[i][4] + ',0]';
      al.blendingMode = BlendingMode.SCREEN;
      al.opacity.setValue(34); al.opacity.expression = "value + 8*Math.pow(1-((time/" + (60 / F.bpm) + ")%1),3)";
    }
    try {                                                      // a perspective floor grid, added to the dark so only its lines show
      var fl = comp.layers.addSolid([0, 0, 0], "Floor grid", 9000, 9000, 1); fl.threeDLayer = true; fl.blendingMode = BlendingMode.SCREEN;
      fl.property("X Rotation").setValue(90); fl.position.setValue([CX, CY + 1000, 3400]);
      var gr = addFx(fl, "ADBE Grid");
      gr.property(2).setValue(3);                                  // size from: width and height sliders
      gr.property(4).setValue(220); gr.property(5).setValue(220); gr.property(6).setValue(2.4);
      gr.property(12).setValue([0.55, 0.62, 1]); gr.property(13).setValue(45);
    } catch (e) { log("floor: " + e.toString()); }
    log("backdrop ok");

    /* ---------- the five real screens ---------- */
    var nulls = {}, screens = {};
    for (i = 0; i < F.panes.length; i++) {
      var p = F.panes[i];
      (function (p, i) {
        // glow behind, and a great outlined word for depth
        var hl = comp.layers.addSolid([0, 0, 0], "Glow — " + p.id, 3000, 3000, 1); hl.threeDLayer = true;
        blob(hl, 1500, 1500, hsl(p.hue, 0.9, 0.58), 1300);
        hl.position.setValue([CX + p.x * S, CY + p.y * S, -(p.z - 80) * ZF]); hl.blendingMode = BlendingMode.SCREEN;
        hl.opacity.setValue(40); hl.opacity.expression = DEPTH + "";
        var gt = comp.layers.addText(p.ghost); gt.name = "Ghost word — " + p.ghost; gt.threeDLayer = true;
        var gd = gt.property("Source Text").value; gd.resetCharStyle(); gd.font = BOLD; gd.fontSize = 780; gd.applyFill = false; gd.applyStroke = true; gd.strokeColor = [1, 1, 1]; gd.strokeWidth = 3; gd.justification = ParagraphJustification.CENTER_JUSTIFY; gd.tracking = -50;
        gt.property("Source Text").setValue(gd);
        gt.position.setValue([CX + p.x * S, CY + p.y * S + 260, -(p.z - 300) * ZF]); gt.opacity.setValue(20); gt.opacity.expression = DEPTH;

        var nl = comp.layers.addNull(); nl.name = "Pane — " + p.id; nl.threeDLayer = true; nulls[p.id] = nl;
        track(nl.position, p.keys, function (k) { return V3(CX + p.x * S, CY + p.y * S, -(p.z + k.dz) * ZF); }, { geo: ["dz", "s"], spatial: 1 });
        track(nl.scale, p.keys, function (k) { return V3(k.s * 100, k.s * 100, k.s * 100); }, { geo: ["dz", "s"] });
        nl.property("Y Rotation").setValue(-p.ry);
        track(nl.property("Z Rotation"), p.keys, function (k) { return k.rz; });

        var sl = comp.layers.add(imp(p.file, fS)); sl.name = "Screen — " + p.id; sl.threeDLayer = true; screens[p.id] = sl;
        sl.setParentWithJump(nl); sl.position.setValue([0, 0, 0]); sl.scale.setValue([52.083, 52.083, 52.083]);
        maskRound(sl, 2880, 1800, 18 * S / 0.52083);
        track(sl.opacity, p.keys, function (k) { return k.o * 100; }); sl.opacity.expression = DEPTH;
        if (i === 0) { var bf = addFx(sl, "ADBE Gaussian Blur 2"); track(bf.property(1), p.keys, function (k) { return k.bl * S; }); }

        var rim = shapeLayer("Rim — " + p.id), rg = addGroup(rim);
        rg.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(roundRect(2880, 1800, 18 * S / 0.52083, true));
        var rs = rg.addProperty("ADBE Vector Graphic - Stroke"); rs.property("ADBE Vector Stroke Color").setValue([0.78, 0.82, 1]); rs.property("ADBE Vector Stroke Width").setValue(6);
        rim.threeDLayer = true; rim.setParentWithJump(sl); rim.position.setValue([1440, 900, -3]);   // the rim is drawn about its own origin; a child sits on its parent's top-left, so lift it to the screen's centre
        rim.opacity.setValue(75); rim.opacity.expression = DEPTH;
        try { var rgl = addFx(rim, "ADBE Glo2"); rgl.property(3).setValue(60); rgl.property(4).setValue(1.1); rgl.property(7).setValue(2); rgl.property(12).setValue(VIOLET); rgl.property(13).setValue(CYAN); } catch (e) { log("rim glow " + p.id + ": " + e); }
      })(p, i);
    }
    log("screens ok: " + F.panes.length);

    /* ---------- the real cards, lifted toward the camera ---------- */
    var cards = {};
    for (i = 0; i < F.cards.length; i++) {
      (function (c) {
        var cl = comp.layers.add(imp(c.file, fC)); cl.name = "Card — " + c.id; cl.threeDLayer = true; cards[c.id] = { layer: cl, c: c };
        cl.setParentWithJump(nulls[c.pane]);
        var cx0 = (c.x + c.w / 2) * K * S - 750, cy0 = (c.y + c.h / 2) * K * S - 468.75;
        track(cl.position, c.keys, function (k) { return V3(cx0 + k.dx * S, cy0 + k.dy * S, -k.dz * ZF); }, { geo: ["dx", "dy", "dz", "s"], spatial: 1 });
        track(cl.scale, c.keys, function (k) { return V3(CARDBASE * k.s, CARDBASE * k.s, 100); }, { geo: ["dx", "dy", "dz", "s"] });
        track(cl.property("Y Rotation"), c.keys, function (k) { return -k.ry; });
        track(cl.property("Z Rotation"), c.keys, function (k) { return k.rz; });
        maskRound(cl, c.w * 2, c.h * 2, c.r * 2);
        cl.opacity.expression = DEPTH;
        var rim = shapeLayer("Rim — card " + c.id), rg = addGroup(rim);
        rg.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(roundRect(c.w * 2, c.h * 2, c.r * 2, true));
        var rs = rg.addProperty("ADBE Vector Graphic - Stroke"); rs.property("ADBE Vector Stroke Color").setValue([0.82, 0.86, 1]); rs.property("ADBE Vector Stroke Width").setValue(7);
        rim.threeDLayer = true; rim.setParentWithJump(cl); rim.position.setValue([c.w, c.h, -3]); rim.opacity.setValue(85); rim.opacity.expression = DEPTH;
        try { var rgl = addFx(rim, "ADBE Glo2"); rgl.property(3).setValue(70); rgl.property(4).setValue(1.2); rgl.property(7).setValue(2); rgl.property(12).setValue(VIOLET); rgl.property(13).setValue(CYAN); } catch (e) { log("card glow: " + e); }
      })(F.cards[i]);
    }
    log("cards ok: " + F.cards.length);

    /* ---------- the camera ---------- */
    var cam = comp.layers.addCamera("Camera — the flight", [CX, CY]);
    cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
    cam.property("Camera Options").property("Zoom").setValue(ZOOM);
    track(cam.position, F.camera, function (k) { return V3(CX + k.x * S, CY + k.y * S, -ZOOM - k.z * ZF); }, { spatial: 1 });
    track(cam.property("X Rotation"), F.camera, function (k) { return k.rx; });
    track(cam.property("Y Rotation"), F.camera, function (k) { return k.ry; });
    track(cam.property("Z Rotation"), F.camera, function (k) { return -k.rz; });
    cam.property("X Rotation").expression = "value + Math.sin(time*.9)*.25";      // a breath of handheld
    cam.property("Y Rotation").expression = "value + Math.sin(time*.7+1)*.35";
    cam.property("Z Rotation").expression = "value + Math.sin(time*.6+2)*.15";
    try {                                                                            // depth of field: focus rides to whichever screen is being read
      var co = cam.property("Camera Options"); co.property("Depth of Field").setValue(1);
      co.property("Aperture").setValue(90); co.property("Blur Level").setValue(100);
      var fk = [], pz = [];
      for (j = 0; j < F.panes.length; j++) pz.push(F.panes[j].z);
      for (i = 0; i < F.camera.length; i++) {
        var kc = F.camera[i], best = 0, bd = 1e9;
        if (kc.z > 500) best = (kc.t < 5) ? 0 : 2; else for (j = 0; j < pz.length; j++) { var dd = Math.abs(kc.z - pz[j] - F.hold); if (dd < bd) { bd = dd; best = j; } }
        fk.push({ t: kc.t, v: ZOOM + (kc.z - pz[best]) * ZF, e: kc.e });
      }
      track(co.property("Focus Distance"), fk, function (k) { return k.v; });
    } catch (e) { log("dof: " + e); }
    log("camera ok");

    /* ---------- HUD labels that follow their cards ---------- */
    var LEN = 138;
    for (i = 0; i < F.labels.length; i++) {
      (function (l) {
        var cd = cards[l.card]; if (!cd) return;
        var dir = l.side === "l" ? -1 : 1, ex = l.side === "l" ? 0 : cd.c.w * 2, ey = Math.min(cd.c.h, 110);
        var tl = comp.layers.addText(l.n + "   " + l.text.toUpperCase()); tl.name = "Label — " + l.text;
        var td = tl.property("Source Text").value; td.resetCharStyle(); td.font = MONO; td.fontSize = 17; td.fillColor = [0.81, 0.84, 1]; td.tracking = 160;
        td.justification = dir < 0 ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY; tl.property("Source Text").setValue(td);
        tl.position.expression = 'var L=thisComp.layer("Card — ' + l.card + '"); var p=L.toComp([' + ex + ',' + ey + ']); [p[0]+' + (dir * (LEN + 18)) + ', p[1]-13]';
        var life = l.t1 - l.t0;
        key(tl.opacity, [[l.t0 - 0.01, 0], [l.t0 + 0.5, 100, "out"], [l.t1 - 0.4, 100], [l.t1, 0]]);
        var ln = shapeLayer("Label line — " + l.text), lg = addGroup(ln);
        var lp = new Shape(); lp.vertices = [[0, 0], [dir * LEN, 0]]; lp.inTangents = [[0, 0], [0, 0]]; lp.outTangents = [[0, 0], [0, 0]]; lp.closed = false;
        lg.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(lp);
        lg.addProperty("ADBE Vector Filter - Trim"); lg.addProperty("ADBE Vector Graphic - Stroke");
        var trim = lg.property("ADBE Vector Filter - Trim"), st = lg.property("ADBE Vector Graphic - Stroke");
        st.property("ADBE Vector Stroke Color").setValue([0.6, 0.68, 1]); st.property("ADBE Vector Stroke Width").setValue(2);
        key(trim.property("ADBE Vector Trim End"), [[l.t0 - 0.01, 0], [l.t0 + 0.5, 100, "out"]]);
        ln.position.expression = 'var L=thisComp.layer("Card — ' + l.card + '"); L.toComp([' + ex + ',' + ey + '])';
        key(ln.opacity, [[l.t0 - 0.01, 0], [l.t0 + 0.3, 100], [l.t1 - 0.4, 100], [l.t1, 0]]);
      })(F.labels[i]);
    }
    log("labels ok");

    /* ---------- type ---------- */
    function parseBlock(lines) {                            // *stars* mark the iridescent words
      var text = "", em = [], n = 0, li, words, wi, on, w, isEm, a;
      for (li = 0; li < lines.length; li++) {
        words = lines[li].split(" "); on = false;
        if (li) text += "\r";
        for (wi = 0; wi < words.length; wi++) {
          w = words[wi]; isEm = on;
          if (w.charAt(0) === "*") { on = true; isEm = true; w = w.substr(1); }
          if (w.charAt(w.length - 1) === "*") { on = false; w = w.substr(0, w.length - 1); }
          if (wi) text += " ";
          a = text.length; text += w;
          if (isEm) em.push([a, text.length]);
        }
      }
      return { text: text, em: em };
    }
    function animator(layer, t0, n, size) {
      var an = layer.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator"); an.name = "Letters rise in";
      var ap = an.property("ADBE Text Animator Properties");
      ap.addProperty("ADBE Text Opacity").setValue(0); ap.addProperty("ADBE Text Position 3D").setValue([0, size * 0.9, 0]); ap.addProperty("ADBE Text Blur").setValue([16, 16]);
      var sel = an.property("ADBE Text Selectors").addProperty("ADBE Text Selector"), adv = sel.property("ADBE Text Range Advanced");
      adv.property("ADBE Text Range Units").setValue(1); adv.property("ADBE Text Range Type2").setValue(1); adv.property("ADBE Text Selector Smoothness").setValue(100);
      key(sel.property("ADBE Text Percent Start"), [[t0, 0], [t0 + Math.max(0.9, n * 0.028 + 0.8), 100, "out"]]);
    }
    for (i = 0; i < F.type.length; i++) {
      var tb = F.type[i], pb = parseBlock(tb.lines), fs = tb.size * S;
      var lead = fs * 1.02;
      var ty = comp.layers.addText(pb.text); ty.name = "Type — " + pb.text.replace(/\r/g, " / ");
      var d2 = ty.property("Source Text").value; d2.resetCharStyle(); d2.font = BOLD; d2.fontSize = fs; d2.fillColor = [1, 1, 1]; d2.applyFill = true;
      d2.justification = ParagraphJustification.CENTER_JUSTIFY; d2.tracking = -40; try { d2.autoLeading = false; d2.leading = lead; } catch (e) { }
      ty.property("Source Text").setValue(d2);
      try {
        var d3 = ty.property("Source Text").value, ci = 0;
        for (j = 0; j < pb.em.length; j++) for (k = pb.em[j][0]; k < pb.em[j][1]; k++) { d3.characterRange(k, k + 1).fillColor = hsl(262 + ci * 16, 0.92, 0.74); ci++; }
        ty.property("Source Text").setValue(d3);
      } catch (e) { log("type colour: " + e); }
      var base = [CX, (tb.y + tb.size * 0.86) * S]; ty.position.setValue(base);
      animator(ty, tb.start, pb.text.length, fs);
      var te = tb.end - 0.55;
      key(ty.opacity, [[te, 100], [tb.end, 0]]);
      var tblur = addFx(ty, "ADBE Gaussian Blur 2"); key(tblur.property(1), [[te, 0], [tb.end, 18]]);
      key(ty.position, [[te, base], [tb.end, [base[0], base[1] - 30 * S]]]);
      ty.inPoint = Math.max(0, tb.start - 0.1); ty.outPoint = tb.end + 0.05;
    }
    log("type ok: " + F.type.length);

    /* ---------- HUD frame: chapter, timecode, progress ---------- */
    var hudA = comp.layers.addText("OEDU / LEARNING YOU CAN TOUCH"); hudA.name = "HUD — chapter";
    var da = hudA.property("Source Text").value; da.resetCharStyle(); da.font = MONO; da.fontSize = 16; da.fillColor = [0.78, 0.82, 1]; da.tracking = 160; da.justification = ParagraphJustification.LEFT_JUSTIFY; hudA.property("Source Text").setValue(da);
    var chs = "", ci2; for (ci2 = 0; ci2 < F.chapters.length; ci2++) chs += (ci2 ? "," : "") + "[" + F.chapters[ci2][0] + ',"' + F.chapters[ci2][1].toUpperCase() + '"]';
    hudA.property("Source Text").expression = 'var C=[' + chs + ']; var s="OEDU / LEARNING YOU CAN TOUCH"; for(var i=0;i<C.length;i++){ if(time>=C[i][0]) s="OEDU / "+C[i][1]; } s;';
    hudA.position.setValue([51, 60]); key(hudA.opacity, [[1, 0], [2, 65], [F.outro.at - 2.6, 65], [F.outro.at - 1.6, 0]]);
    var hudB = comp.layers.addText("T+00.00"); hudB.name = "HUD — timecode";
    var db = hudB.property("Source Text").value; db.resetCharStyle(); db.font = MONO; db.fontSize = 16; db.fillColor = [0.78, 0.82, 1]; db.tracking = 160; db.justification = ParagraphJustification.RIGHT_JUSTIFY; hudB.property("Source Text").setValue(db);
    hudB.property("Source Text").expression = '"T+" + (time<10?"0":"") + time.toFixed(2)';
    hudB.position.setValue([W - 51, 60]); key(hudB.opacity, [[1, 0], [2, 65], [F.outro.at - 2.6, 65], [F.outro.at - 1.6, 0]]);
    var tlt = shapeLayer("HUD — progress track"), tg = addGroup(tlt);
    tg.addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([W - 102, 3]); tg.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);
    tlt.position.setValue([CX, H - 36]); tlt.opacity.setValue(12);
    var tlf = shapeLayer("HUD — progress"), tf = addGroup(tlf);
    tf.addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([W - 102, 3]); tf.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(BLUE);
    tlf.anchorPoint.setValue([-(W - 102) / 2, 0]); tlf.position.setValue([51, H - 36]);
    tlf.scale.expression = "[time/thisComp.duration*100,100]"; tlf.opacity.setValue(70);
    log("hud ok");

    /* ---------- the Touch ---------- */
    function orbLayer(name) {
      var o = shapeLayer(name), g = addGroup(o);
      var r = g.addProperty("ADBE Vector Shape - Ellipse"); r.property("ADBE Vector Ellipse Size").setValue([90, 90]);
      var rs = g.addProperty("ADBE Vector Graphic - Stroke"); rs.property("ADBE Vector Stroke Color").setValue([1, 1, 1]); rs.property("ADBE Vector Stroke Width").setValue(2.5);
      var g2 = addGroup(o); g2.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([27, 27]); g2.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);
      try { var gl = addFx(o, "ADBE Glo2"); gl.property(3).setValue(60); gl.property(4).setValue(2.2); gl.property(7).setValue(2); gl.property(12).setValue(BLUE); gl.property(13).setValue(CYAN); } catch (e) { log("orb glow: " + e); }
      return o;
    }
    function carry(keys, d) {                                // values a keyframe leaves out carry over from the one before
      var out = [], prev = copy(d), q, kk; for (q = 0; q < keys.length; q++) { kk = copy(prev); for (var pn in keys[q]) kk[pn] = keys[q][pn]; if (!kk.e) kk.e = "io"; prev = kk; out.push(copy(kk)); } return out;
    }
    var free = [], tied = [];
    for (i = 0; i < F.orb.length; i++) { if (F.orb[i].at) tied.push(F.orb[i]); else free.push(F.orb[i]); }
    free = carry(free, { x: 0, y: 0, s: 1, o: 0 }); tied = carry(tied, { o: 0 });
    var oa = orbLayer("Touch — arrival");
    track(oa.position, free, function (k) { return [k.x * S, k.y * S]; }, { spatial: 1 });
    track(oa.opacity, free, function (k) { return k.o * 100; });
    var ob = orbLayer("Touch — lesson");
    var tsw = F.taps[2] - 0.3;
    ob.position.expression = 'var A=thisComp.layer("Card — diagA"), B=thisComp.layer("Card — diagB"); var pa=A.toComp(A.anchorPoint), pb=B.toComp(B.anchorPoint); var m=ease(time,' + tsw + ',' + (tsw + 0.5) + ',0,1); pa+(pb-pa)*m';
    track(ob.opacity, tied, function (k) { return k.o * 100; });
    for (i = 0; i < F.taps.length; i++) {
      var tt = F.taps[i], rp = shapeLayer("Ripple " + (i + 1)), rg2 = addGroup(rp);
      rg2.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([300, 300]);
      var rs2 = rg2.addProperty("ADBE Vector Graphic - Stroke"); rs2.property("ADBE Vector Stroke Color").setValue([0.62, 0.7, 1]); rs2.property("ADBE Vector Stroke Width").setValue(3);
      if (i === 0) rp.position.setValue([905 * S, 372 * S]);
      else rp.position.expression = 'var L=thisComp.layer("Card — ' + (i === 1 ? "diagA" : "diagB") + '"); L.toComp(L.anchorPoint)';
      key(rp.scale, [[tt - 0.01, [0, 0]], [tt + 1.3, [220, 220], "out"]]);
      key(rp.opacity, [[tt - 0.01, 0], [tt, 100], [tt + 1.3, 0, "out"]]);
      rp.inPoint = tt - 0.05; rp.outPoint = tt + 1.4;
    }
    log("touch ok");

    /* ---------- the ending: collapse, flash, the mark, the name, the call ---------- */
    var fs2 = shapeLayer("Flash"), fg = addGroup(fs2);
    fg.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([2600, 2600]); fg.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([0.86, 0.84, 1]);
    fs2.position.setValue([CX, CY]); var fb = addFx(fs2, "ADBE Gaussian Blur 2"); fb.property(1).setValue(420);
    key(fs2.opacity, [[F.outro.flash, 0], [F.outro.flash + 0.7, 95], [F.outro.flash + 1.4, 0]]);
    fs2.blendingMode = BlendingMode.SCREEN;

    var O = F.outro.at;
    function parsePath(d) {
      var subs = [], cur = null, re = /([MLCZ])([^MLCZ]*)/g, m, n, p, q;
      while ((m = re.exec(d))) {
        n = m[2].replace(/^\s+|\s+$/g, "").split(/[\s,]+/); for (q = 0; q < n.length; q++) n[q] = parseFloat(n[q]);
        if (m[1] === "M") { cur = { v: [[n[0], n[1]]], i: [[0, 0]], o: [[0, 0]], closed: false }; subs.push(cur); }
        else if (m[1] === "L") { cur.v.push([n[0], n[1]]); cur.i.push([0, 0]); cur.o.push([0, 0]); }
        else if (m[1] === "C") { for (p = 0; p + 5 < n.length; p += 6) { var prev = cur.v[cur.v.length - 1]; cur.o[cur.o.length - 1] = [n[p] - prev[0], n[p + 1] - prev[1]]; cur.v.push([n[p + 4], n[p + 5]]); cur.i.push([n[p + 2] - n[p + 4], n[p + 3] - n[p + 5]]); cur.o.push([0, 0]); } }
        else if (m[1] === "Z" && cur) cur.closed = true;
      }
      return subs;
    }
    var TX = 73.919875 - 187.495, TY = 252.710833 - 205.255, subs = parsePath(F.markPath), mark = shapeLayer("Oplo mark (vector)"), mc = addGroup(mark);
    for (i = 0; i < subs.length; i++) {
      var sp = subs[i]; if (sp.v.length < 3) continue;
      var lv = sp.v[sp.v.length - 1], f0 = sp.v[0];
      if (sp.closed && Math.abs(lv[0] - f0[0]) < 0.01 && Math.abs(lv[1] - f0[1]) < 0.01) { sp.i[0] = sp.i[sp.i.length - 1]; sp.v.pop(); sp.i.pop(); sp.o.pop(); }
      var shp = new Shape(), vv = []; for (j = 0; j < sp.v.length; j++) vv.push([sp.v[j][0] + TX, sp.v[j][1] + TY]);
      shp.vertices = vv; shp.inTangents = sp.i; shp.outTangents = sp.o; shp.closed = true;
      var pp = mc.addProperty("ADBE Vector Shape - Group"); pp.name = "Mark path " + (i + 1); pp.property("ADBE Vector Shape").setValue(shp);
    }
    mc.addProperty("ADBE Vector Filter - Trim"); mc.addProperty("ADBE Vector Graphic - Stroke"); mc.addProperty("ADBE Vector Graphic - Fill");
    var trim2 = mc.property("ADBE Vector Filter - Trim"), stk = mc.property("ADBE Vector Graphic - Stroke"), fil = mc.property("ADBE Vector Graphic - Fill");
    stk.property("ADBE Vector Stroke Color").setValue([0.87, 0.9, 1]); stk.property("ADBE Vector Stroke Width").setValue(1.4); fil.property("ADBE Vector Fill Color").setValue([1, 1, 1]);
    var msc = 285 / 206.73 * 100; mark.position.setValue([CX, 360]);
    key(mark.opacity, [[O - 0.2, 0], [O + 0.3, 100]]);
    key(trim2.property("ADBE Vector Trim End"), [[O, 0], [O + 1.6, 100]]);
    key(fil.property("ADBE Vector Fill Opacity"), [[O + 1.1, 0], [O + 2.0, 100]]);
    track(mark.scale, [{ t: O, v: 0.9, e: "out" }, { t: O + 6, v: 1.04, e: "out" }], function (k) { return [msc * k.v, msc * k.v]; });
    try { var mgl = addFx(mark, "ADBE Glo2"); mgl.property(3).setValue(90); mgl.property(4).setValue(1.4); mgl.property(7).setValue(2); mgl.property(12).setValue(VIOLET); mgl.property(13).setValue(CYAN); } catch (e) { log("mark glow: " + e); }

    function endText(name, str, font, size, color, pos, tracking) {
      var t = comp.layers.addText(str); t.name = name; var d = t.property("Source Text").value; d.resetCharStyle(); d.font = font; d.fontSize = size; d.fillColor = color; d.applyFill = true;
      d.justification = ParagraphJustification.CENTER_JUSTIFY; d.tracking = tracking; t.property("Source Text").setValue(d); t.position.setValue(pos); return t;
    }
    var nm = endText("Name — OEdu", F.outro.name, BOLD, 180, [1, 1, 1], [CX, 640], -50);
    key(nm.opacity, [[O + 1.7, 0], [O + 2.6, 100, "out"]]);
    key(nm.position, [[O + 1.7, [CX, 680], "out"], [O + 2.6, [CX, 640], "out"]]);
    var nb = addFx(nm, "ADBE Gaussian Blur 2"); key(nb.property(1), [[O + 1.7, 20], [O + 2.6, 0, "out"]]);
    try { var ls = addFx(nm, "CC Light Sweep"); ls.property(1).setValue([-200, 300]); key(ls.property(1), [[O + 2.6, [-200, 300]], [O + 4.4, [2400, 300]]]); ls.property(4).setValue(140); ls.property(5).setValue(80); } catch (e) { log("light sweep: " + e); }
    var by = endText("Byline — by Oplo", F.outro.by.toUpperCase(), MONO, 21, [0.65, 0.69, 0.91], [CX, 730], 320);
    key(by.opacity, [[O + 2.7, 0], [O + 3.4, 100]]);

    var pill = shapeLayer("CTA — pill"), pg = addGroup(pill);
    pg.addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([360, 84]);
    pg.property(1).property("ADBE Vector Rect Roundness").setValue(42);
    pg.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([0.92, 0.94, 1]);
    pill.position.setValue([CX, 860]);
    try { var pgl = addFx(pill, "ADBE Glo2"); pgl.property(3).setValue(80); pgl.property(4).setValue(0.9); pgl.property(7).setValue(2); pgl.property(12).setValue(VIOLET); pgl.property(13).setValue(CYAN); } catch (e) { log("pill glow: " + e); }
    key(pill.opacity, [[O + 3.2, 0], [O + 4.0, 100, "out"]]);
    key(pill.scale, [[O + 3.2, [90, 90]], [O + 4.0, [100, 100], "out"]]);
    var ct = endText("CTA — text", F.outro.cta + "  →", MED, 32, [0.016, 0.02, 0.04], [CX, 872], -10);
    key(ct.opacity, [[O + 3.2, 0], [O + 4.0, 100, "out"]]);
    var ur = endText("CTA — url", F.outro.url.toUpperCase(), MONO, 18, [0.5, 0.55, 1], [CX, 940], 200);
    key(ur.opacity, [[O + 3.8, 0], [O + 4.4, 100]]);
    log("ending ok");

    /* ---------- the vignette, then done ---------- */
    var vg = comp.layers.addSolid([0, 0, 0], "Vignette", W, H, 1);
    var vm = vg.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), vs = new Shape(), vrx = 1250, vry = 800, vkx = 0.5523 * vrx, vky = 0.5523 * vry;
    vs.vertices = [[CX, CY - vry], [CX + vrx, CY], [CX, CY + vry], [CX - vrx, CY]];
    vs.inTangents = [[-vkx, 0], [0, -vky], [vkx, 0], [0, vky]]; vs.outTangents = [[vkx, 0], [0, vky], [-vkx, 0], [0, -vky]]; vs.closed = true;
    vm.property("ADBE Mask Shape").setValue(vs);
    vm.inverted = true; vm.property("ADBE Mask Feather").setValue([700, 700]); vg.opacity.setValue(55);

    comp.workAreaStart = 0; comp.workAreaDuration = END; comp.openInViewer();
    proj.save(File(here.fsName + "/OEdu-Film-v2.aep"));
    var sd = Folder(here.fsName + "/stills2"); if (!sd.exists) sd.create();
    var marks = [1.6, 3.6, 5.6, 7.4, 8.6, 9.2, 12.4, 13.0, 16.2, 17.0, 20.2, 21.6, 23.6, 24.8, 26.4, 28.4, 32.0, 34.8];
    for (i = 0; i < marks.length; i++) { try { comp.saveFrameToPng(marks[i], File(sd.fsName + "/v2-" + (i + 1) + "-" + marks[i] + "s.png")); } catch (e) { log("still " + marks[i] + ": " + e); } }
    log("saved: OEdu-Film-v2.aep + " + marks.length + " stills");
  } catch (e) { log("FAIL: " + e.toString() + " (line " + e.line + ")"); }
  app.endUndoGroup();
  var lf = File(here.fsName + "/build2.log"); lf.open("w"); lf.write(LOG.join("\n")); lf.close();
})();
