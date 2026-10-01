/* ==========================================================================
   Roxan — roxan.oplocloud.com
   Behaviour for the page under the system's menu: the phone drawer and the
   chapter bar's marker, the hero's wireframe sphere and the line that types
   what people ask, the reel of what's new (five scenes, drawn in white lines
   only), the galleries' arrows, the plan tabs and the Ultra toggle.
   Everything is white on black; nothing here draws a gradient or a glow.
   Every animation stops when it is off screen or the tab is hidden, and
   reduced motion gets still frames.
   ========================================================================== */
(function () {
  "use strict";
  window.ROXAN_READY = true;

  var d = document;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var smooth = reduce ? "auto" : "smooth";
  var TAU = Math.PI * 2;

  function white(a) { return "rgba(255,255,255," + Math.max(0, Math.min(1, a)).toFixed(3) + ")"; }

  /* Run `frame` every animation frame while `el` is on screen and the tab is visible. */
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

  /* A canvas that keeps its backing store at the element's size. */
  function Surface(canvas, draw) {
    var self = this;
    this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.draw = draw;
    this.w = 0; this.h = 0; this.dpr = 0; this.t = 0;
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
  Surface.prototype.render = function () {
    if (!this.w) return;
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.draw(this.ctx, this.w, this.h, this.t);
  };
  Surface.prototype.advance = function (dt) { this.t += dt; this.render(); };

  /* Lines are sorted into a few buckets of brightness by depth and each bucket
     is stroked once, which is what keeps a wireframe cheap to draw. */
  function Buckets(n) { this.n = n; this.segs = []; for (var i = 0; i < n; i++) this.segs.push([]); }
  Buckets.prototype.add = function (x1, y1, x2, y2, k) {
    var b = Math.max(0, Math.min(this.n - 1, Math.floor(k * this.n)));
    this.segs[b].push(x1, y1, x2, y2);
  };
  Buckets.prototype.stroke = function (ctx, alpha, width) {
    ctx.lineWidth = width || 1;
    for (var b = 0; b < this.n; b++) {
      var s = this.segs[b];
      if (!s.length) continue;
      ctx.strokeStyle = white(alpha((b + 0.5) / this.n));
      ctx.beginPath();
      for (var i = 0; i < s.length; i += 4) { ctx.moveTo(s[i], s[i + 1]); ctx.lineTo(s[i + 2], s[i + 3]); }
      ctx.stroke();
    }
  };

  /* ------------------------------------------------------------ Glide
     In-page links travel to where they point on one long, soft curve instead
     of the browser's jump or its brisk smooth-scroll. A wheel, a touch or a
     key hands the page straight back to the reader. */
  var glideRaf = 0;
  function stopGlide() { if (glideRaf) { window.cancelAnimationFrame(glideRaf); glideRaf = 0; } }
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
    window.addEventListener(ev, stopGlide, { passive: true });
  });
  function glideTo(y) {
    stopGlide();
    var max = d.documentElement.scrollHeight - window.innerHeight;
    y = Math.max(0, Math.min(max, y));
    var from = window.scrollY, dist = y - from;
    if (reduce || Math.abs(dist) < 2) { window.scrollTo(0, y); return; }
    var dur = Math.min(1500, 650 + Math.sqrt(Math.abs(dist)) * 11), t0 = 0;
    function ease(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      window.scrollTo(0, from + dist * ease(p));
      glideRaf = p < 1 ? window.requestAnimationFrame(step) : 0;
    }
    glideRaf = window.requestAnimationFrame(step);
  }
  function glideToEl(el) {
    var pad = parseFloat(window.getComputedStyle(d.documentElement).scrollPaddingTop) || 84;
    var margin = parseFloat(window.getComputedStyle(el).scrollMarginTop) || 0;
    glideTo(el.getBoundingClientRect().top + window.scrollY - Math.max(pad, margin));
    // A card inside a gallery is also brought into view sideways.
    var card = el.closest(".gcard"), gal = card && card.closest(".gal");
    if (gal) {
      var padL = parseFloat(window.getComputedStyle(gal).paddingLeft) || 0;
      gal.scrollTo({ left: card.offsetLeft - padL, behavior: smooth });
    }
  }
  d.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    if (id.length < 2 || id === "#students") return;
    var el = d.getElementById(decodeURIComponent(id.slice(1)));
    if (!el) return;
    e.preventDefault();
    if (window.location.hash !== id) window.history.pushState(null, "", id);
    glideToEl(el);
  });

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
    var on = null;
    marks.forEach(function (m) {
      var el = $(m[0]);
      if (el && el.getBoundingClientRect().top <= 120) on = m[1];
    });
    chapterLinks.forEach(function (a) { a.classList.toggle("on", !!on && a.getAttribute("href") === on); });
  });
  if (chapterLinks.length) {
    window.addEventListener("scroll", markSection, { passive: true });
    markSection();
  }

  /* ------------------------------------------------------------ Drawings
     The first time a line drawing comes into view, its strokes trace
     themselves in and its filled shapes and words fade up after them. It
     happens once; afterwards the drawing is simply there. */
  var SHAPES = "path, line, polyline, polygon, rect, circle, ellipse";
  function prepDraw(svg) {
    var parts = [];
    $$(SHAPES, svg).forEach(function (el) {
      var still = el.classList.contains("f") || el.classList.contains("dash") || el.classList.contains("spin");
      var len = 0;
      if (!still && el.getTotalLength) { try { len = el.getTotalLength(); } catch (err) { len = 0; } }
      if (!len) { el.style.opacity = "0"; parts.push({ el: el, fade: true }); return; }
      len = Math.ceil(len) + 2;
      el.style.strokeDasharray = len + " " + len;
      el.style.strokeDashoffset = String(len);
      parts.push({ el: el, len: len });
    });
    $$("text", svg).forEach(function (el) { el.style.opacity = "0"; parts.push({ el: el, fade: true }); });
    svg._draw = parts;
  }
  function playDraw(svg, delay) {
    var parts = svg._draw;
    if (!parts) return;
    svg._draw = null;
    var n = 0, last = 0;
    parts.forEach(function (p) {
      if (p.fade) {
        p.el.style.transition = "opacity 1s cubic-bezier(.16,1,.3,1) " + (delay + 650) + "ms";
        p.el.style.opacity = "1";
      } else {
        var dl = delay + Math.min(n++ * 16, 480);
        last = Math.max(last, dl);
        p.el.style.transition = "stroke-dashoffset 1.6s cubic-bezier(.65,0,.35,1) " + dl + "ms";
        p.el.style.strokeDashoffset = "0";
      }
    });
    window.setTimeout(function () {
      parts.forEach(function (p) {
        p.el.style.transition = "";
        if (!p.fade) { p.el.style.strokeDasharray = ""; p.el.style.strokeDashoffset = ""; }
      });
    }, Math.max(last + 1700, delay + 1800));
  }
  var drawable = !reduce && "IntersectionObserver" in window;
  if (drawable) $$(".gal .ill, svg.draw").forEach(prepDraw);
  function playIn(el) {
    if (!drawable) return;
    if (el.classList.contains("gal")) {
      $$(".gcard", el).forEach(function (c, i) { var s = $(".ill", c); if (s) playDraw(s, 250 + i * 110); });
    } else {
      $$("svg.draw", el).forEach(function (s) { playDraw(s, 200); });
    }
  }

  /* ------------------------------------------------------------ Reveal */
  $$(".gal").forEach(function (g) { $$(".gcard", g).forEach(function (c, i) { c.style.setProperty("--i", i); }); });
  $$(".also-grid .mi").forEach(function (m, i) { m.style.setProperty("--i", i % 3); });
  var revealables = $$(".reveal, .gal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("in"); });
  } else {
    var rio = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); playIn(e.target); rio.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    revealables.forEach(function (el) { rio.observe(el); });
  }

  /* ------------------------------------------------------------ Hero
     A wireframe sphere — twelve meridians, eight parallels — turning once in
     about eighty seconds, with one ring around it and a point travelling on
     the ring. The near side is bright and the far side faint. */
  function coreScene(ctx, w, h, t) {
    var cx = w / 2, cy = h / 2, R = w * 0.34;
    var a = coreSpin, tilt = 0.4;
    var ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), st = Math.sin(tilt);
    var B = new Buckets(8);
    function proj(x, y, z) {
      var x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      var y1 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      return [cx + x1 * R, cy + y1 * R, z2];
    }
    function curve(fn, n) {
      var p = fn(0);
      for (var s = 1; s <= n; s++) {
        var q = fn(s / n);
        B.add(p[0], p[1], q[0], q[1], ((p[2] + q[2]) / 2 + 1) / 2);
        p = q;
      }
    }
    var k, j;
    for (k = 0; k < 12; k++) {
      (function (phi) {
        curve(function (u) { var th = u * TAU; return proj(Math.sin(th) * Math.cos(phi), Math.cos(th), Math.sin(th) * Math.sin(phi)); }, 72);
      })(k / 12 * Math.PI);
    }
    for (j = 1; j < 9; j++) {
      (function (lat) {
        var y = Math.sin(lat), r = Math.cos(lat);
        curve(function (u) { var g = u * TAU; return proj(r * Math.cos(g), y, r * Math.sin(g)); }, 72);
      })(-Math.PI / 2 + j / 9 * Math.PI);
    }
    B.stroke(ctx, function (k2) { return 0.05 + 0.62 * k2 * k2; });

    // The ring: its own tilt, turning half as fast the other way.
    var rt = 1.1, rc = Math.cos(rt), rs = Math.sin(rt), rr = 1.36, ra = -a * 0.5;
    function ring(u) {
      var g = u * TAU + ra, x = rr * Math.cos(g), z = rr * Math.sin(g);
      var y1 = -z * rs, z1 = z * rc;
      return proj(x, y1, z1);
    }
    var RB = new Buckets(6);
    var p = ring(0);
    for (var s = 1; s <= 160; s++) {
      var q = ring(s / 160);
      RB.add(p[0], p[1], q[0], q[1], ((p[2] + q[2]) / 2 + 1.4) / 2.8);
      p = q;
    }
    RB.stroke(ctx, function (k2) { return 0.06 + 0.4 * k2; });
    var dot = ring(((t * 0.035) % 1 + 1) % 1);
    ctx.fillStyle = white(0.35 + 0.65 * (dot[2] + 1.4) / 2.8);
    ctx.beginPath(); ctx.arc(dot[0], dot[1], 2.4, 0, TAU); ctx.fill();
  }

  var coreSpin = 0.6;
  var coreCanvas = $("#core");
  var core = coreCanvas ? new Surface(coreCanvas, coreScene) : null;

  /* The line under the sphere types what people ask Roxan. */
  var typed = $("#typed");
  var PROMPTS = [
    "Plan a quiet dinner for six on Friday, near the river.",
    "Summarize this week’s mail and draft the two urgent replies.",
    "Turn my run log into a sixteen-week half-marathon plan.",
    "Explain black holes like I’m twelve."
  ];
  var typer = null;
  if (typed && !reduce) {
    typer = { i: 0, c: PROMPTS[0].length, phase: "hold", next: 0 };
    typer.step = function (now) {
      if (!typer.next || now < typer.next) return;
      switch (typer.phase) {
        case "hold":
          typed.style.opacity = "0";
          typer.phase = "clear"; typer.next = now + 420; break;
        case "clear":
          typer.i = (typer.i + 1) % PROMPTS.length; typer.c = 0; typed.textContent = ""; typed.style.opacity = "1";
          typer.phase = "type"; typer.next = now + 300; break;
        case "type":
          typer.c += 1; typed.textContent = PROMPTS[typer.i].slice(0, typer.c);
          if (typer.c >= PROMPTS[typer.i].length) { typer.phase = "hold"; typer.next = now + 3600; }
          else typer.next = now + 26 + Math.random() * 44;
          break;
      }
    };
  }

  /* The hero arrives in order (roxan.css), once the fonts are in so the
     headline never rises in one face and lands in another. The typing starts
     after the line under the sphere has drawn itself. */
  var hero = $("#top");
  if (hero) {
    var goHero = function () {
      window.requestAnimationFrame(function () {
        hero.classList.add("arrived");
        if (typer) typer.next = window.performance.now() + 5200;
      });
    };
    if (reduce) hero.classList.add("arrived");
    else if (d.fonts && d.fonts.ready) {
      var went = false, once = function () { if (!went) { went = true; goHero(); } };
      d.fonts.ready.then(once);
      window.setTimeout(once, 900);
    } else goHero();
  }
  /* The sphere turns once in about eighty seconds, and a little faster while
     the page is scrolling — then settles back, never snapping. */
  if (hero && !reduce) {
    var lastHero = 0, lastY = window.scrollY, boost = 0;
    loop(hero, function (t) {
      var dt = lastHero ? Math.min(64, t - lastHero) : 16; lastHero = t;
      var y = window.scrollY, v = Math.abs(y - lastY) / dt; lastY = y;
      boost += (Math.min(v * 0.5, 1.4) - boost) * 0.05;
      coreSpin += (0.08 + boost * 0.55) * dt / 1000;
      if (core) core.advance(dt / 1000);
      if (typer) typer.step(t);
    });
  }

  /* ------------------------------------------------------------ The reel's scenes
     Five scenes, white lines on black. */

  // Roxan Motion — strands of light braided through one another.
  function sceneRibbon(ctx, w, h, t) {
    var cx = w / 2, cy = h * 0.62, span = Math.min(w * 0.64, 820), amp = Math.min(h * 0.14, 84);
    var N = 18, S = 96, CH = 24;
    for (var i = 0; i < N; i++) {
      var f = i / (N - 1), pts = [];
      for (var s = 0; s <= S; s++) {
        var u = s / S, env = Math.pow(Math.sin(Math.PI * u), 1.8);
        pts.push([cx + (u - 0.5) * span,
                  cy + env * amp * (0.55 * Math.sin(u * 5.2 + t * 0.55 + f * 2.4) + 0.35 * Math.sin(u * 9.1 - t * 0.8 + f * 5.1) + 0.2 * Math.sin(t * 0.4 + f * 7)),
                  env]);
      }
      for (var c = 0; c < S; c += S / CH) {
        var mid = pts[Math.min(S, Math.round(c + S / CH / 2))][2];
        ctx.strokeStyle = white(0.34 * mid);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pts[c][0], pts[c][1]);
        for (var e = c + 1; e <= Math.min(S, c + S / CH); e++) ctx.lineTo(pts[e][0], pts[e][1]);
        ctx.stroke();
      }
    }
  }

  // Neural Expressive — a lattice of points that breathes.
  var LATTICE = (function () {
    var pts = [], n = 700, g = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = g * i;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
    return pts;
  })();
  function sceneSphere(ctx, w, h, t) {
    var cx = w / 2, cy = h * 0.62, R = Math.min(w, h) * 0.3;
    var a = t * 0.22, b = 0.38 + Math.sin(t * 0.2) * 0.14;
    var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    for (var i = 0; i < LATTICE.length; i++) {
      var p = LATTICE[i], x = p[0], y = p[1], z = p[2];
      var k = 1 + 0.12 * Math.sin(3 * Math.atan2(z, x) + t * 0.8) * Math.cos(2.2 * y + t * 0.5);
      x *= k; y *= k; z *= k;
      var x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      var y1 = y * cb - z1 * sb, z2 = y * sb + z1 * cb;
      var sc = 1.7 / (2.7 - z2), depth = (z2 + 1.15) / 2.3, sz = 0.8 + 1.4 * depth;
      ctx.fillStyle = white(0.08 + 0.72 * depth * depth);
      ctx.fillRect(cx + x1 * R * sc - sz / 2, cy + y1 * R * sc - sz / 2, sz, sz);
    }
  }

  // Roxan Spark — the agent at the centre, the apps in orbit, work moving along the lines.
  var ORBIT = ["ODocs", "OMails", "OSheets", "OTeams", "OMaps", "OPhotos", "OSurf"];
  function sceneNodes(ctx, w, h, t) {
    var cx = w / 2, cy = h * 0.63, rx = Math.min(w * 0.34, 380), ry = Math.min(h * 0.19, 108);
    ctx.lineWidth = 1;
    ctx.strokeStyle = white(0.12);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke();
    var P = ORBIT.map(function (name, i) {
      var ang = i / ORBIT.length * TAU + t * 0.07;
      return { x: cx + Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry, z: Math.sin(ang), i: i };
    });
    P.forEach(function (n) {
      ctx.strokeStyle = white(0.1 + 0.18 * (n.z + 1) / 2);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(n.x, n.y); ctx.stroke();
      var q = (t * 0.28 + n.i * 0.29) % 1, out = n.i % 2 ? q : 1 - q;
      ctx.fillStyle = white(0.85);
      ctx.beginPath(); ctx.arc(cx + (n.x - cx) * out, cy + (n.y - cy) * out, 1.8, 0, TAU); ctx.fill();
    });
    P.slice().sort(function (a2, b2) { return a2.z - b2.z; }).forEach(function (n) {
      var dz = (n.z + 1) / 2;
      ctx.fillStyle = "#070707"; ctx.strokeStyle = white(0.35 + 0.6 * dz);
      ctx.beginPath(); ctx.arc(n.x, n.y, 5 + 2 * dz, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.font = "400 10.5px 'Geist Mono', ui-monospace, monospace";
      ctx.textAlign = "center"; ctx.fillStyle = white(0.3 + 0.5 * dz);
      ctx.fillText(ORBIT[n.i].toUpperCase(), n.x, n.y + 26);
    });
    ctx.strokeStyle = white(0.9);
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, TAU); ctx.stroke();
    ctx.fillStyle = white(1);
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, TAU); ctx.fill();
  }

  // Daily Brief — a sun coming up over a horizon, in outline.
  function sceneSunrise(ctx, w, h, t) {
    var hz = h * 0.74, cx = w / 2, R = Math.min(w * 0.16, h * 0.26);
    ctx.lineWidth = 1;
    ctx.strokeStyle = white(0.7);
    ctx.beginPath(); ctx.moveTo(w * 0.08, hz); ctx.lineTo(w * 0.92, hz); ctx.stroke();
    var rise = (Math.sin(t * 0.25) + 1) / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, hz); ctx.clip();
    ctx.strokeStyle = white(0.95);
    ctx.beginPath(); ctx.arc(cx, hz + R * (0.35 - 0.2 * rise), R, 0, TAU); ctx.stroke();
    for (var k = 1; k <= 5; k++) {
      var p = ((k + t * 0.12) % 5) / 5;
      ctx.strokeStyle = white(0.22 * (1 - p));
      ctx.beginPath(); ctx.arc(cx, hz, R * (1.25 + p * 1.6), Math.PI, TAU); ctx.stroke();
    }
    ctx.restore();
    for (var v = -10; v <= 10; v++) {
      ctx.strokeStyle = white(0.14 - Math.abs(v) * 0.009);
      ctx.beginPath(); ctx.moveTo(cx + v * 14, hz); ctx.lineTo(cx + v * w * 0.08, h); ctx.stroke();
    }
    for (var j = 0; j < 7; j++) {
      var z = (j + (t * 0.3) % 1) / 7, yy = hz + (h - hz) * z * z;
      ctx.strokeStyle = white(z * 0.18);
      ctx.beginPath(); ctx.moveTo(w * 0.08, yy); ctx.lineTo(w * 0.92, yy); ctx.stroke();
    }
  }

  // Roxan Live — a voice, drawn as rings that move when it speaks.
  function sceneVoice(ctx, w, h, t) {
    var cx = w / 2, cy = h * 0.62, R = Math.min(w, h) * 0.18;
    var amp = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.6) * Math.sin(t * 0.6 + 1.3));
    ctx.lineWidth = 1;
    for (var j = 0; j < 3; j++) {
      var q = (t * 0.22 + j / 3) % 1;
      ctx.strokeStyle = white((1 - q) * 0.16);
      ctx.beginPath(); ctx.arc(cx, cy, R * (1.3 + q * 1.0), 0, TAU); ctx.stroke();
    }
    for (var k = 0; k < 6; k++) {
      ctx.strokeStyle = white(0.65 - k * 0.09);
      ctx.beginPath();
      for (var s = 0; s <= 128; s++) {
        var th = s / 128 * TAU;
        var r = R * (1 + k * 0.035) + amp * R * 0.18 * (Math.sin(3 * th + t * 1.1 + k) * 0.6 + Math.sin(5 * th - t * 1.5 + k * 2.1) * 0.4);
        var x = cx + Math.cos(th) * r, y = cy + Math.sin(th) * r;
        if (s) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    }
  }

  var SCENES = { ribbon: sceneRibbon, sphere: sceneSphere, nodes: sceneNodes, sunrise: sceneSunrise, voice: sceneVoice };

  /* ------------------------------------------------------------ Reel */
  var reel = $("#reel");
  if (reel) {
    var slides = $$(".slide", reel), dots = $$("#reelDots button"), pp = $("#reelPP");
    var DUR = 8000, cur = 0, playing = !reduce, elapsed = 0, last = 0, lockUntil = 0;
    var scenes = slides.map(function (s, i) {
      var sf = new Surface($("canvas", s), SCENES[s.getAttribute("data-scene")] || sceneRibbon);
      sf.t = 3 + i * 1.7;
      sf.render();
      return sf;
    });
    var setCur = function (i) {
      cur = i;
      slides.forEach(function (s, k) { s.classList.toggle("is-current", k === i); });
      dots.forEach(function (b, k) {
        if (k === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
        $("i", b).style.setProperty("--p", "0");
      });
    };
    var goTo = function (i, animate) {
      i = (i + slides.length) % slides.length;
      var padL = parseFloat(window.getComputedStyle(reel).paddingLeft) || 0;
      lockUntil = window.performance.now() + 900;
      reel.scrollTo({ left: slides[i].offsetLeft - padL, behavior: animate ? smooth : "auto" });
      setCur(i); elapsed = 0;
    };
    var setPlaying = function (on) {
      playing = on;
      pp.classList.toggle("paused", !on);
      pp.setAttribute("aria-label", on ? "Pause" : "Play");
    };
    dots.forEach(function (b, k) { b.addEventListener("click", function () { goTo(k, true); }); });
    pp.addEventListener("click", function () { setPlaying(!playing); });
    reel.addEventListener("scroll", throttled(function () {
      if (window.performance.now() < lockUntil) return;
      var padL = parseFloat(window.getComputedStyle(reel).paddingLeft) || 0, best = cur, bd = Infinity;
      slides.forEach(function (s, k) { var dd = Math.abs(s.offsetLeft - padL - reel.scrollLeft); if (dd < bd) { bd = dd; best = k; } });
      if (best !== cur) { setCur(best); elapsed = 0; }
    }), { passive: true });
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
    var bar = g.nextElementSibling, prev = $("[data-prev]", bar), next = $("[data-next]", bar);
    function step() {
      var c = $(".gcard", g), cs = window.getComputedStyle(g);
      var cw = c.getBoundingClientRect().width + (parseFloat(cs.columnGap) || 24);
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
  });

  /* ------------------------------------------------------------ Plans */
  var tablist = $("#planTabs");
  if (tablist) {
    var tabs = $$("[role=tab]", tablist), ind = $(".tab-ind", tablist);
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
      if (animate) glideToEl($("#plans")); else $("#plans").scrollIntoView();
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
