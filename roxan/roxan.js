/* ==========================================================================
   Roxan — roxan.oplocloud.com
   Behaviour for the page under the system's menu: the phone drawer and the
   chapter bar's marker, the hero (stars, parallax,
   a prompt that types itself), the reel of what's new (five canvas scenes,
   autoplay with a progress dot), the galleries' arrows, the plan tabs and the
   Ultra toggle. Nothing here fetches anything; every animation stops when it
   is off screen or the tab is hidden, and reduced motion gets still frames.
   ========================================================================== */
(function () {
  "use strict";
  window.ROXAN_READY = true;

  var d = document, root = d.documentElement;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var smooth = reduce ? "auto" : "smooth";

  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  /* The spectrum every scene draws with — the same five stops as --holo. */
  var PAL = [[143, 245, 216], [134, 169, 255], [181, 140, 255], [255, 143, 214], [255, 207, 163]];
  function pal(f) {
    f = ((f % 1) + 1) % 1 * (PAL.length - 1);
    var i = Math.floor(f), k = f - i, a = PAL[i], b = PAL[Math.min(i + 1, PAL.length - 1)];
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  }
  function rgba(c, a) { return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a + ")"; }
  var TAU = Math.PI * 2;

  /* Run `frame` on every animation frame while `el` is on screen and the tab
     is visible. Returns nothing to manage: it stops and starts on its own. */
  function loop(el, frame) {
    var on = false, raf = 0, vis = true;
    function tick(t) { raf = 0; if (!on) return; frame(t); raf = window.requestAnimationFrame(tick); }
    function update() {
      var want = vis && !d.hidden;
      if (want && !on) { on = true; raf = window.requestAnimationFrame(tick); }
      else if (!want && on) { on = false; if (raf) window.cancelAnimationFrame(raf); raf = 0; }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { vis = en[en.length - 1].isIntersecting; update(); }).observe(el);
    }
    d.addEventListener("visibilitychange", update);
    update();
  }

  function throttled(fn) {
    var q = false;
    return function () { if (q) return; q = true; window.requestAnimationFrame(function () { q = false; fn(); }); };
  }

  /* ------------------------------------------------------------ Ribbon */
  var rib = $("#ribbon");
  if (rib) {
    if (store.get("roxan.ribbon") === "closed") rib.hidden = true;
    $(".x", rib).addEventListener("click", function () { rib.hidden = true; store.set("roxan.ribbon", "closed"); });
  }

  /* ------------------------------------------------------------ The menu
     The bar and the chapter bar are oplocloud.com's (tools/build.py writes
     them in); oplo-menu.js and oplo-search.js drive the bar's menus and
     search. Two things the site does elsewhere are done here: the phone
     drawer, which on the site is a script after its footer, and marking
     which of Roxan's sections you are in. */
  var nav = $("#nav"), links = $("#navLinks"), toggle = $("#navToggle");
  if (nav && links && toggle) {
    var held = 0;
    var setDrawer = function (open) {
      if (open === links.classList.contains("open")) return;
      if (open && window.OploSearch) window.OploSearch.close();
      if (open) {
        held = window.scrollY;
        d.body.style.top = (-held) + "px";
        d.body.classList.add("locked");
      } else {
        d.body.classList.remove("locked");
        d.body.style.top = "";
        window.scrollTo(0, held);
      }
      links.classList.toggle("open", open);
      nav.classList.toggle("open", open);
      toggle.classList.toggle("on", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", function () { setDrawer(!links.classList.contains("open")); });
    links.addEventListener("click", function (e) { if (e.target.closest("a")) setDrawer(false); });
    window.addEventListener("resize", function () { if (links.classList.contains("open")) setDrawer(false); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  }

  var chapterLinks = $$(".chapter-links a");
  var marks = [["#new", "#new"], ["#assistant", "#assistant"], ["#privacy", null], ["#plans", "#plans"],
               ["#devices", null], ["#discover", "#discover"], [".notes", null]];
  var markSection = throttled(function () {
    var line = 120, on = null;
    marks.forEach(function (m) {
      var el = $(m[0]);
      if (el && el.getBoundingClientRect().top <= line) on = m[1];
    });
    chapterLinks.forEach(function (a) { a.classList.toggle("on", !!on && a.getAttribute("href") === on); });
  });
  if (chapterLinks.length) {
    window.addEventListener("scroll", markSection, { passive: true });
    markSection();
  }

  /* ------------------------------------------------------------ Reveal */
  $$(".gal").forEach(function (g) { $$(".gcard", g).forEach(function (c, i) { c.style.setProperty("--i", i); }); });
  $$(".more-grid .mi, .disc-grid .dcard").forEach(function (m, i) { m.style.setProperty("--i", i % 3); });
  var revealables = $$(".reveal, .gal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("in"); });
  } else {
    var rio = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealables.forEach(function (el) { rio.observe(el); });
  }

  /* ------------------------------------------------------------ Hero */
  var hero = $("#top"), rig = $("#fanRig"), starCanvas = $("#stars");
  var pointer = { x: 0, y: 0 };

  function Stars(canvas) {
    var ctx = canvas.getContext("2d"), w = 0, h = 0, stars = [];
    function size() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(260, Math.round(w * h / 5200));
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h * 0.72, z: Math.random(), p: Math.random() * TAU, c: PAL[i % PAL.length] });
      }
    }
    var ox = 0, oy = 0;
    function draw(t) {
      if (!w) return;
      ctx.clearRect(0, 0, w, h);
      ox += (pointer.x - ox) * 0.05; oy += (pointer.y - oy) * 0.05;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var tw = 0.55 + 0.45 * Math.sin(t * 0.0011 * (0.4 + s.z) + s.p);
        var fade = 1 - Math.max(0, (s.y / h - 0.45) / 0.3);          // thin out toward the horizon
        var a = (0.18 + 0.62 * s.z) * tw * fade;
        if (a <= 0.01) continue;
        ctx.fillStyle = rgba(s.z > 0.86 ? s.c : [226, 232, 255], a.toFixed(3));
        ctx.beginPath();
        ctx.arc(s.x - ox * s.z * 18, s.y - oy * s.z * 12, 0.35 + s.z * 1.05, 0, TAU);
        ctx.fill();
      }
    }
    if ("ResizeObserver" in window) new ResizeObserver(function () { size(); draw(0); }).observe(canvas);
    else window.addEventListener("resize", function () { size(); draw(0); });
    size();
    return { draw: draw };
  }
  var stars = starCanvas ? Stars(starCanvas) : null;

  /* The fan leans toward the pointer. */
  var lean = { rx: 0, ry: 0, tx: 0, ty: 0 };
  if (hero && rig && !reduce && window.matchMedia("(hover: hover)").matches) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      lean.ty = nx * 12; lean.tx = -ny * 7; pointer.x = nx; pointer.y = ny;
    });
    hero.addEventListener("pointerleave", function () { lean.tx = lean.ty = 0; pointer.x = pointer.y = 0; });
  }
  function leanStep() {
    if (!rig) return;
    lean.rx += (lean.tx - lean.rx) * 0.06; lean.ry += (lean.ty - lean.ry) * 0.06;
    if (Math.abs(lean.rx) < 0.001 && Math.abs(lean.ry) < 0.001 && !lean.tx && !lean.ty) return;
    rig.style.transform = "rotateX(" + lean.rx.toFixed(3) + "deg) rotateY(" + lean.ry.toFixed(3) + "deg)";
  }

  /* The prompt on the device types itself, one request after another. */
  var typed = $("#typed"), shown = $("#showRes");
  var PROMPTS = [
    ["Draft a note to Elena with the Saturdays I'm free in November, noon to 3, plus gluten-free snack ideas.", "✦ Show results"],
    ["Plan three days in Lisbon — trams, tiles, and the best pastel de nata.", "✦ Open itinerary"],
    ["Summarize this week's OMails and draft replies to the two urgent ones.", "✦ 2 drafts ready"],
    ["Turn my run log into a 16-week half-marathon plan.", "✦ Plan created"]
  ];
  var typer = null;
  if (typed && shown) {
    shown.classList.add("on");
    if (!reduce) {
      typer = { i: 0, c: PROMPTS[0][0].length, phase: "hold", next: 0 };
      typer.step = function (now) {
        if (!typer.next) typer.next = now + 2600;
        if (now < typer.next) return;
        var p = PROMPTS[typer.i];
        switch (typer.phase) {
          case "hold":
            shown.classList.remove("on"); typed.style.transition = "opacity .35s"; typed.style.opacity = "0";
            typer.phase = "clear"; typer.next = now + 380; break;
          case "clear":
            typer.i = (typer.i + 1) % PROMPTS.length; typer.c = 0; typed.textContent = ""; typed.style.opacity = "1";
            typer.phase = "type"; typer.next = now + 260; break;
          case "type":
            typer.c += 1; typed.textContent = p[0].slice(0, typer.c);
            if (typer.c >= p[0].length) { typer.phase = "show"; typer.next = now + 480; }
            else typer.next = now + 18 + Math.random() * 38;
            break;
          case "show":
            shown.textContent = p[1]; shown.classList.add("on");
            typer.phase = "hold"; typer.next = now + 3400; break;
        }
      };
    }
  }

  if (hero) {
    if (reduce) { if (stars) stars.draw(0); }
    else loop(hero, function (t) {
      if (stars) stars.draw(t);
      leanStep();
      if (typer) typer.step(t);
    });
  }

  /* ------------------------------------------------------------ Scenes */
  function glow(ctx, x, y, r, stops) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Roxan Motion — a lens of light, the strands of the spectrum braided through it.
  function sceneRibbon(ctx, w, h, t) {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
    var cx = w / 2, cy = h * 0.62, span = Math.min(w * 0.66, 840), amp = Math.min(h * 0.15, 86);
    glow(ctx, cx, cy, span * 0.6, [[0, "rgba(120,150,255,0.20)"], [0.5, "rgba(140,100,255,0.06)"], [1, "rgba(0,0,0,0)"]]);
    ctx.globalCompositeOperation = "lighter";
    var N = 34, S = 96;
    for (var i = 0; i < N; i++) {
      var f = i / (N - 1), c = pal(f * 0.999);
      var sg = ctx.createLinearGradient(cx - span / 2, 0, cx + span / 2, 0);
      sg.addColorStop(0, rgba(c, 0)); sg.addColorStop(0.2, rgba(c, 0.2)); sg.addColorStop(0.8, rgba(c, 0.2)); sg.addColorStop(1, rgba(c, 0));
      ctx.strokeStyle = sg; ctx.lineWidth = 1.25;
      ctx.beginPath();
      for (var s = 0; s <= S; s++) {
        var u = s / S, x = cx + (u - 0.5) * span;
        var env = Math.pow(Math.sin(Math.PI * u), 1.8);
        var y = cy + env * amp * (0.55 * Math.sin(u * 5.2 + t * 0.8 + f * 2.4) + 0.35 * Math.sin(u * 9.1 - t * 1.1 + f * 5.1) + 0.22 * Math.sin(t * 0.6 + f * 7));
        if (s) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.32);
    glow(ctx, 0, 0, span * 0.22, [[0, "rgba(255,255,255,0.42)"], [0.4, "rgba(220,230,255,0.12)"], [1, "rgba(255,255,255,0)"]]);
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
  }

  // Neural Expressive — a lattice sphere that breathes.
  var SPHERE = (function () {
    var pts = [], n = 700, g = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = g * i;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
    return pts;
  })();
  function sceneSphere(ctx, w, h, t) {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
    var cx = w / 2, cy = h * 0.62, R = Math.min(w, h) * 0.31;
    glow(ctx, cx, cy, R * 1.9, [[0, "rgba(134,169,255,0.16)"], [0.6, "rgba(181,140,255,0.05)"], [1, "rgba(0,0,0,0)"]]);
    var a = t * 0.32, b = 0.38 + Math.sin(t * 0.27) * 0.16;
    var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < SPHERE.length; i++) {
      var p = SPHERE[i], x = p[0], y = p[1], z = p[2];
      var k = 1 + 0.13 * Math.sin(3 * Math.atan2(z, x) + t * 1.15) * Math.cos(2.2 * y + t * 0.75);
      x *= k; y *= k; z *= k;
      var x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      var y1 = y * cb - z1 * sb, z2 = y * sb + z1 * cb;
      var sc = 1.7 / (2.7 - z2);
      var depth = (z2 + 1.15) / 2.3;
      var sz = 0.7 + 1.9 * depth;
      ctx.fillStyle = rgba(pal((p[1] + 1) / 2 * 0.98 + t * 0.015), (0.12 + 0.8 * depth).toFixed(3));
      ctx.fillRect(cx + x1 * R * sc - sz / 2, cy + y1 * R * sc - sz / 2, sz, sz);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  // Roxan Spark — the agent at the centre, the apps in orbit, work moving along the lines.
  var ORBIT = ["ODocs", "OMails", "OSheets", "OTeams", "OMaps", "OPhotos", "OSurf"];
  function sceneNodes(ctx, w, h, t) {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
    var cx = w / 2, cy = h * 0.63, rx = Math.min(w * 0.36, 380), ry = Math.min(h * 0.2, 110);
    glow(ctx, cx, cy, rx * 1.1, [[0, "rgba(111,243,255,0.12)"], [1, "rgba(0,0,0,0)"]]);
    ctx.strokeStyle = "rgba(160,190,255,0.14)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.62, ry * 0.62, 0, 0, TAU); ctx.stroke();
    var P = [];
    for (var i = 0; i < ORBIT.length; i++) {
      var ang = i / ORBIT.length * TAU + t * 0.11;
      P.push({ x: cx + Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry, z: Math.sin(ang), i: i });
    }
    P.forEach(function (n) {
      var g = ctx.createLinearGradient(cx, cy, n.x, n.y);
      g.addColorStop(0, "rgba(255,255,255,0.05)"); g.addColorStop(1, rgba(pal(n.i / ORBIT.length), 0.5));
      ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(n.x, n.y); ctx.stroke();
    });
    ctx.globalCompositeOperation = "lighter";
    P.forEach(function (n) {
      var q = (t * 0.42 + n.i * 0.29) % 1, out = n.i % 2 ? q : 1 - q;
      var x = cx + (n.x - cx) * out, y = cy + (n.y - cy) * out;
      glow(ctx, x, y, 12, [[0, "rgba(220,250,255,0.9)"], [0.25, rgba(pal(n.i / ORBIT.length), 0.5)], [1, "rgba(0,0,0,0)"]]);
    });
    ctx.globalCompositeOperation = "source-over";
    function node(n) {
      var dz = (n.z + 1) / 2, r = 15 + 6 * dz, c = pal(n.i / ORBIT.length);
      ctx.fillStyle = "rgba(14,17,36,0.95)"; ctx.strokeStyle = rgba(c, 0.5 + 0.5 * dz); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = rgba(c, 0.95); ctx.beginPath(); ctx.arc(n.x, n.y, r * 0.34, 0, TAU); ctx.fill();
      ctx.font = "500 " + (11 + 2 * dz).toFixed(1) + "px Geist, system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.fillStyle = "rgba(230,236,255," + (0.45 + 0.5 * dz).toFixed(2) + ")";
      ctx.fillText(ORBIT[n.i], n.x, n.y + r + 17);
    }
    P.filter(function (n) { return n.z < 0; }).sort(function (a, b) { return a.z - b.z; }).forEach(node);
    var cr = Math.min(w, h) * 0.07;
    ctx.globalCompositeOperation = "lighter";
    for (var k = 0; k < 5; k++) {
      var ang2 = t * 0.9 + k / 5 * TAU;
      glow(ctx, cx + Math.cos(ang2) * cr * 0.28, cy + Math.sin(ang2) * cr * 0.28, cr, [[0, rgba(PAL[k], 0.55)], [1, "rgba(0,0,0,0)"]]);
    }
    glow(ctx, cx, cy, cr * 0.6, [[0, "rgba(255,255,255,0.8)"], [1, "rgba(255,255,255,0)"]]);
    ctx.globalCompositeOperation = "source-over";
    P.filter(function (n) { return n.z >= 0; }).sort(function (a, b) { return a.z - b.z; }).forEach(node);
  }

  // Daily Brief — a sun coming up over a grid.
  function sceneSunrise(ctx, w, h, t) {
    ctx.globalCompositeOperation = "source-over";
    var hz = h * 0.72, cx = w / 2, R = Math.min(w * 0.2, h * 0.33);
    var sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, "#010107"); sky.addColorStop(0.62, "#10071d"); sky.addColorStop(1, "#3c1233");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, hz);
    ctx.fillStyle = "#030208"; ctx.fillRect(0, hz, w, h - hz);
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, cx, hz, R * 2.4, [[0, "rgba(255,120,190,0.22)"], [0.5, "rgba(181,140,255,0.07)"], [1, "rgba(0,0,0,0)"]]);
    ctx.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, hz); ctx.clip();
    var rise = Math.sin(t * 0.18) * R * 0.04;
    var sg = ctx.createLinearGradient(0, hz - R, 0, hz);
    sg.addColorStop(0, "#ffe7b8"); sg.addColorStop(0.5, "#ff9ec8"); sg.addColorStop(1, "#b58cff");
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, hz + R * 0.12 - rise, R, 0, TAU); ctx.fill();
    ctx.fillStyle = sky;
    for (var k = 0; k < 9; k++) {
      var p = (k + (t * 0.22) % 1) / 9, y = hz - p * R * 1.05, th = 0.8 + (1 - p) * 7;
      ctx.fillRect(cx - R - 2, y, 2 * R + 4, th);
    }
    ctx.restore();
    var hl = ctx.createLinearGradient(0, 0, w, 0);
    hl.addColorStop(0, "rgba(255,160,210,0)"); hl.addColorStop(0.5, "rgba(255,200,230,0.95)"); hl.addColorStop(1, "rgba(255,160,210,0)");
    ctx.fillStyle = hl; ctx.fillRect(0, hz - 0.5, w, 1.5);
    ctx.lineWidth = 1;
    for (var v = -14; v <= 14; v++) {
      ctx.strokeStyle = "rgba(255,143,214," + (0.32 - Math.abs(v) * 0.016).toFixed(3) + ")";
      ctx.beginPath(); ctx.moveTo(cx + v * 16, hz); ctx.lineTo(cx + v * w * 0.1, h); ctx.stroke();
    }
    for (var j = 0; j < 10; j++) {
      var z = (j + (t * 0.5) % 1) / 10, yy = hz + (h - hz) * z * z;
      ctx.strokeStyle = "rgba(255,143,214," + (z * 0.5).toFixed(3) + ")";
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
    }
  }

  // Roxan Live — a voice, drawn as rings that move when it speaks.
  function sceneVoice(ctx, w, h, t) {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
    var cx = w / 2, cy = h * 0.62, R = Math.min(w, h) * 0.19;
    var amp = 0.3 + 0.7 * Math.abs(Math.sin(t * 2.1) * Math.sin(t * 0.73 + 1.3));
    glow(ctx, cx, cy, R * 2.6, [[0, "rgba(255,143,214,0.14)"], [0.5, "rgba(181,140,255,0.06)"], [1, "rgba(0,0,0,0)"]]);
    ctx.globalCompositeOperation = "lighter";
    for (var j = 0; j < 3; j++) {
      var q = (t * 0.32 + j / 3) % 1;
      ctx.strokeStyle = rgba([255, 143, 214], ((1 - q) * 0.3).toFixed(3)); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R * (1.25 + q * 1.1), 0, TAU); ctx.stroke();
    }
    for (var k = 0; k < 6; k++) {
      ctx.strokeStyle = rgba(pal(k / 6), 0.55); ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (var s = 0; s <= 128; s++) {
        var th = s / 128 * TAU;
        var r = R * (1 + k * 0.035) + amp * R * 0.2 * (Math.sin(3 * th + t * 1.4 + k) * 0.6 + Math.sin(5 * th - t * 1.9 + k * 2.1) * 0.4);
        var x = cx + Math.cos(th) * r, y = cy + Math.sin(th) * r;
        if (s) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    }
    glow(ctx, cx, cy, R, [[0, "rgba(255,255,255," + (0.16 + amp * 0.14).toFixed(3) + ")"], [0.6, "rgba(181,140,255,0.1)"], [1, "rgba(0,0,0,0)"]]);
    ctx.globalCompositeOperation = "source-over";
  }

  var SCENES = { ribbon: sceneRibbon, sphere: sceneSphere, nodes: sceneNodes, sunrise: sceneSunrise, voice: sceneVoice };

  function Scene(canvas, draw, t0) {
    var self = this;
    this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.draw = draw;
    this.w = 0; this.h = 0; this.dpr = 0; this.t = t0;
    this.resize = function () {
      var dpr = Math.min(2, window.devicePixelRatio || 1), w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h || (w === self.w && h === self.h && dpr === self.dpr)) return;
      self.w = w; self.h = h; self.dpr = dpr;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      self.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      self.render();
    };
    if ("ResizeObserver" in window) new ResizeObserver(this.resize).observe(canvas);
    else window.addEventListener("resize", this.resize);
    this.resize();
  }
  Scene.prototype.render = function () { if (this.w) this.draw(this.ctx, this.w, this.h, this.t); };
  Scene.prototype.advance = function (dt) { this.t += dt; this.render(); };

  /* ------------------------------------------------------------ Reel */
  var reel = $("#reel");
  if (reel) {
    var slides = $$(".slide", reel), dots = $$("#reelDots button"), pp = $("#reelPP");
    var DUR = 7000, cur = 0, playing = !reduce, elapsed = 0, last = 0, lockUntil = 0;
    var scenes = slides.map(function (s, i) {
      var fn = SCENES[s.getAttribute("data-scene")] || sceneRibbon;
      return new Scene($("canvas", s), fn, 3 + i * 1.7);
    });
    function setCur(i) {
      cur = i;
      dots.forEach(function (b, k) {
        if (k === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
        $("i", b).style.setProperty("--p", "0");
      });
    }
    function goTo(i, animate) {
      i = (i + slides.length) % slides.length;
      var padL = parseFloat(window.getComputedStyle(reel).paddingLeft) || 0;
      lockUntil = window.performance.now() + 900;
      reel.scrollTo({ left: slides[i].offsetLeft - padL, behavior: animate ? smooth : "auto" });
      setCur(i); elapsed = 0;
    }
    function setPlaying(on) {
      playing = on;
      pp.classList.toggle("paused", !on);
      pp.setAttribute("aria-label", on ? "Pause" : "Play");
    }
    dots.forEach(function (b, k) { b.addEventListener("click", function () { goTo(k, true); }); });
    pp.addEventListener("click", function () { setPlaying(!playing); });
    reel.addEventListener("scroll", throttled(function () {
      if (window.performance.now() < lockUntil) return;
      var padL = parseFloat(window.getComputedStyle(reel).paddingLeft) || 0, best = cur, bd = Infinity;
      slides.forEach(function (s, k) { var dd = Math.abs(s.offsetLeft - padL - reel.scrollLeft); if (dd < bd) { bd = dd; best = k; } });
      if (best !== cur) { setCur(best); elapsed = 0; }
    }), { passive: true });
    // Keyboard: arrows move between slides when focus is in the reel.
    reel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(cur + 1, true); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(cur - 1, true); }
    });
    setCur(0);
    setPlaying(playing);
    if (!reduce) {
      loop(reel, function (t) {
        var dt = last ? Math.min(64, t - last) : 16; last = t;
        if (playing) {
          elapsed += dt;
          scenes[cur].advance(dt / 1000);
          if (elapsed >= DUR) goTo(cur + 1, true);
        }
        $("i", dots[cur]).style.setProperty("--p", Math.min(1, elapsed / DUR).toFixed(4));
      });
    }
  }

  /* ------------------------------------------------------------ Galleries */
  $$("[data-gal]").forEach(function (g) {
    var nav2 = g.nextElementSibling, prev = $("[data-prev]", nav2), next = $("[data-next]", nav2);
    function step() {
      var c = $(".gcard", g), cs = window.getComputedStyle(g);
      var cw = c.getBoundingClientRect().width + (parseFloat(cs.columnGap) || 20);
      var fit = Math.floor((g.clientWidth - (parseFloat(cs.paddingLeft) || 0)) / cw);
      return cw * Math.max(1, fit - 1);
    }
    function update() {
      var max = g.scrollWidth - g.clientWidth;
      prev.disabled = g.scrollLeft <= 4;
      next.disabled = g.scrollLeft >= max - 4;
    }
    prev.addEventListener("click", function () { g.scrollBy({ left: -step(), behavior: smooth }); });
    next.addEventListener("click", function () { g.scrollBy({ left: step(), behavior: smooth }); });
    g.addEventListener("scroll", throttled(update), { passive: true });
    window.addEventListener("resize", throttled(update));
    update();
    g.addEventListener("pointermove", function (e) {
      var m = e.target.closest ? e.target.closest(".gm") : null;
      if (!m) return;
      var r = m.getBoundingClientRect();
      m.style.setProperty("--mx", (e.clientX - r.left).toFixed(0) + "px");
      m.style.setProperty("--my", (e.clientY - r.top).toFixed(0) + "px");
    });
  });

  /* ------------------------------------------------------------ Plans */
  var tablist = $("#planTabs");
  if (tablist) {
    var tabs = $$("[role=tab]", tablist), ind = $(".seg-ind", tablist);
    var place = function () {
      var on = tabs.filter(function (x) { return x.getAttribute("aria-selected") === "true"; })[0];
      if (!on) return;
      ind.style.setProperty("--ix", on.offsetLeft + "px");
      ind.style.setProperty("--iw", on.offsetWidth + "px");
    };
    var select = function (tab, focus) {
      tabs.forEach(function (x) {
        var on = x === tab;
        x.setAttribute("aria-selected", on ? "true" : "false");
        x.tabIndex = on ? 0 : -1;
        d.getElementById(x.getAttribute("aria-controls")).hidden = !on;
      });
      place();
      if (focus) tab.focus();
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var j = null;
        if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j], true); }
      });
    });
    window.addEventListener("resize", throttled(place));
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(place);
    place();
    $$("[data-show-tab]").forEach(function (b) {
      b.addEventListener("click", function () { select(d.getElementById(b.getAttribute("data-show-tab")), true); });
    });

    /* #students is a place on the page, not an element: it opens the Students tab. */
    var toStudents = function (animate) {
      select($("#tab-stu"));
      $("#plans").scrollIntoView({ behavior: animate ? smooth : "auto" });
    };
    $$('a[href="#students"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        if (window.location.hash !== "#students") window.history.pushState(null, "", "#students");
        toStudents(true);
      });
    });
    window.addEventListener("hashchange", function () { if (window.location.hash === "#students") toStudents(true); });
    if (window.location.hash === "#students") window.setTimeout(function () { toStudents(false); }, 60);
  }

  var ut = $(".utoggle");
  if (ut) {
    var ub = $$("button", ut);
    var setU = function (v, focus) {
      ub.forEach(function (b) {
        var on = b.getAttribute("data-u") === v;
        b.setAttribute("aria-checked", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      $$("[data-u5]").forEach(function (el) { el.hidden = v !== "5"; });
      $$("[data-u20]").forEach(function (el) { el.hidden = v !== "20"; });
    };
    ub.forEach(function (b, i) {
      b.addEventListener("click", function () { setU(b.getAttribute("data-u")); });
      b.addEventListener("keydown", function (e) {
        if (/^Arrow/.test(e.key)) { e.preventDefault(); setU(ub[1 - i].getAttribute("data-u"), true); }
      });
    });
  }
})();
