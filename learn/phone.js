/* ==========================================================================
   OEdu on a phone — the shell.

   The pages are in phone-student.js and phone-staff.js; this is what they are
   drawn with: the layers that rise over a home screen, the glass bar, the
   sheet, the rings and rows, and the gestures that move them. It draws
   nothing of its own that a person could read.

   One idea: the home screen is the menu. A place opens as a layer over it,
   and what is under a layer stays where it was, smaller and dimmer. A layer's
   address is the console's address — /student/Courses/alg-1 — and the layers
   open are only a drawing of the browser's history: Back, a pull down and the
   close button are the same movement, and a link or a reload lands on the
   right layer with Home already underneath.

   Mounted by app.js with the console kit: OPLO_PHONE(kit) → { on, student,
   staff, leave }. Only used under 700px; a laptop never calls it.
   ========================================================================== */
window.OPLO_PHONE = function (K) {
  "use strict";

  var el = K.el, esc = K.esc;
  var P = { K: K, el: el, esc: esc, api: {} };
  var MQ = window.matchMedia("(max-width: 700px), (max-height: 520px) and (pointer: coarse)");   // a phone, upright or on its side
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)");
  var root = null, home = null, stack = [], sheets = [], toastT = null;

  P.on = function () { return MQ.matches; };
  P.reduced = function () { return RM.matches; };
  function later(fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); }
  function inert(node, on) { if (on) node.setAttribute("inert", ""); else node.removeAttribute("inert"); }

  /* ------------------------------------------------------------- Hue
     A place has a hue, and the same subject has the same hue everywhere: on
     the schedule, in the stack of courses, on a mark. A name we have not met
     gets one from its letters, so it is at least always the same. */
  var TONES = ["blue", "indigo", "purple", "pink", "orange", "green", "teal"];
  var AREAS = [
    [/math|algebra|geometry|calcul|statistic|sat\b/i, "blue"], [/scien|biolog|chemi|physic|earth|environment/i, "green"],
    [/english|language arts|\bela\b|literature|writing|reading/i, "purple"], [/history|social|civics|government|econom|geograph/i, "orange"],
    [/spanish|french|chinese|german|latin|world lang|languag/i, "pink"], [/art|music|drama|theat|design|band|choir/i, "pink"],
    [/health|physical|\bpe\b|gym|sport/i, "teal"], [/comput|tech|engineer|robot|coding/i, "teal"], [/test prep|elective|study/i, "indigo"]
  ];
  P.toneOf = function (s) {
    var k = String(s || "");
    for (var i = 0; i < AREAS.length; i++) if (AREAS[i][0].test(k)) return AREAS[i][1];
    var h = 0;
    for (i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
    return TONES[h % TONES.length];
  };

  /* ------------------------------------------------------------ Pieces */
  /* The few glyphs the console's set does not have. */
  var XI = {
    close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    dots: '<circle cx="5.5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18.5" cy="12" r="1.2"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2"/><circle cx="12" cy="7.8" r=".6"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2.4"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5"/>',
    left: '<path d="m14.5 6-6 6 6 6"/>', right: '<path d="m9.5 6 6 6-6 6"/>',
    pin: '<path d="M12 20.5s6-5.1 6-10.2a6 6 0 1 0-12 0c0 5.1 6 10.2 6 10.2z"/><circle cx="12" cy="10.2" r="2.2"/>',
    bolt: '<path d="M13 3.5 5.5 13.5H11l-1 7 7.5-10H12z"/>',
    send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    phone: '<path d="M6.8 4.5h3l1.4 4-2 1.3a10.5 10.5 0 0 0 4.9 4.9l1.3-2 4 1.4v3a2.3 2.3 0 0 1-2.5 2.3C10.4 18.9 5.1 13.6 4.5 7A2.3 2.3 0 0 1 6.8 4.5z"/>'
  };
  function icon(n) {
    return XI[n] ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + XI[n] + "</svg>" : K.icon(n);
  }
  var CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 6 6 6-6 6"/></svg>';
  P.chev = CHEV;
  P.icon = icon;
  function btn(cls, html, label, go) {
    var b = el("button", "ph-btn " + cls, html);
    b.type = "button";
    if (label) b.setAttribute("aria-label", label);
    if (go) b.addEventListener("click", go);
    return b;
  }
  P.btn = btn;
  P.closeBtn = function (go) { return btn("close", icon("close"), "Close", go || P.close); };

  /* A row of a grouped list: a glyph or a dot, a line and a smaller one, a
     value, and a chevron when it goes somewhere. */
  P.row = function (o) {
    var r = el(o.go ? "button" : "div", "ph-row" + (o.icon ? " has-ic" : o.dot ? " has-dot" : "") + (o.tone ? " t-" + o.tone : "") + (o.cls ? " " + o.cls : ""));
    if (o.go) { r.type = "button"; r.addEventListener("click", o.go); }
    var h = "";
    if (o.icon) h += '<span class="ic">' + icon(o.icon) + "</span>";
    else if (o.dot) h += '<span class="dotc"></span>';
    h += '<span class="t"><b>' + esc(o.title) + "</b>" + (o.sub ? "<small>" + esc(o.sub) + "</small>" : "") + "</span>";
    if (o.valueHtml != null) h += '<span class="v">' + o.valueHtml + "</span>";
    else if (o.value != null && o.value !== "") h += '<span class="v">' + esc(o.value) + "</span>";
    if (o.go && o.chev !== false) h += CHEV;
    r.innerHTML = h;
    return r;
  };
  P.group = function () { return el("div", "ph-group"); };
  P.sh = function (title, more) {
    var h = el("div", "ph-sh", "<h2>" + esc(title) + "</h2>");
    if (more && more.go) {
      var b = el("button", null, esc(more.label));
      b.type = "button";
      b.addEventListener("click", more.go);
      h.appendChild(b);
    } else if (more) h.appendChild(el("span", "ct", esc(more.label)));
    return h;
  };
  P.pill = function (text, tone) { return "<span class='ph-pill" + (tone ? " " + tone : "") + "'>" + esc(text) + "</span>"; };
  P.empty = function (title, text) { return el("div", "ph-empty", "<b>" + esc(title) + "</b>" + (text ? esc(text) : "")); };
  P.note = function (text) { return el("p", "ph-note", esc(text)); };
  P.meter = function (pct, tone) {
    var m = el("span", "ph-meter" + (tone ? " " + tone : ""), "<i></i>");
    later(function () { m.firstChild.style.width = Math.max(0, Math.min(100, pct || 0)) + "%"; });
    return m;
  };
  P.skel = function (n, h) {
    var d = el("div"), i;
    for (i = 0; i < (n || 3); i++) {
      var s = el("span", "ph-skel");
      s.style.cssText = "height:" + (h || 64) + "px;margin:10px 16px 0";
      d.appendChild(s);
    }
    return d;
  };
  P.fail = function (host, e, retry) {
    host.innerHTML = "";
    var offline = e && e.code === "offline";
    var f = el("div", "ph-fail", "<b>" + (offline ? "Can’t reach OEdu" : "That didn’t load") + "</b><p>" +
      esc(offline ? "Check your connection and try again." : (e && e.message) || "The server refused that.") + "</p>");
    if (retry) {
      var b = el("button", "ph-cta quiet", "Try again");
      b.type = "button";
      b.style.cssText = "width:100%;min-height:46px;flex:none";
      b.addEventListener("click", retry);
      f.appendChild(b);
    }
    host.appendChild(f);
  };
  /* The one saturated surface on a home screen: what is happening now. */
  P.hero = function (m) {
    var b = el("button", "ph-hero t-" + m.tone + (m.quiet ? " quiet" : ""));
    b.type = "button";
    b.innerHTML = '<div class="top"><div><p class="k">' + esc(m.k) + "</p><h2>" + esc(m.title) + '</h2><p class="s">' + esc(m.sub || "") + "</p></div>" + (m.ring ? '<span class="ringslot"></span>' : "") + "</div>" +
      (m.chip ? '<div class="next"><span>' + esc(m.chip.label) + "</span><b>" + esc(m.chip.text) + '</b><span class="tm">' + esc(m.chip.time) + "</span></div>" : "<span></span>");
    if (m.ring) {
      var r = P.ring(m.ring.pct, { size: 96, stroke: 8, dark: true, center: "<b>" + esc(m.ring.big) + "</b><small>" + esc(m.ring.small) + "</small>" });
      b.querySelector(".ringslot").replaceWith(r);
    }
    if (m.go) b.addEventListener("click", m.go);
    return b;
  };
  /* Numbers that arrive rather than appear. */
  P.count = function (node, to, o) {
    o = o || {};
    var dec = o.dec || 0, suffix = o.suffix || "";
    function say(v) { node.firstChild ? node.firstChild.nodeValue = v.toFixed(dec) : node.textContent = v.toFixed(dec); }
    if (RM.matches || to == null || isNaN(to)) { node.textContent = to == null ? "—" : Number(to).toFixed(dec); return; }
    var t0 = null, from = 0, dur = o.ms || 800;
    node.textContent = from.toFixed(dec);
    function step(t) {
      if (!node.isConnected) return;
      if (t0 == null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      node.textContent = (from + (to - from) * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step); else node.textContent = Number(to).toFixed(dec);
    }
    requestAnimationFrame(step);
  };
  /* A ring: how far, as a share of a circle. */
  P.ring = function (pct, o) {
    o = o || {};
    var size = o.size || 64, sw = o.stroke || 7, r = (size - sw) / 2, c = size / 2;
    var h = el("span", "ph-ring" + (o.dark ? " on-dark" : "") + (o.tone ? " t-" + o.tone : ""));
    h.style.width = h.style.height = size + "px";
    h.innerHTML = '<svg viewBox="0 0 ' + size + " " + size + '" aria-hidden="true"><circle class="tr" cx="' + c + '" cy="' + c + '" r="' + r + '" stroke-width="' + sw +
      '"/><circle class="fg" cx="' + c + '" cy="' + c + '" r="' + r + '" stroke-width="' + sw + '" pathLength="100" stroke-dasharray="0 100"/></svg><span class="c">' + (o.center || "") + "</span>";
    var fg = h.querySelector(".fg");
    h.set = function (p) {
      var v = p == null ? 0 : Math.max(0, Math.min(100, p));
      fg.style.opacity = v > 0 ? "1" : "0";
      fg.setAttribute("stroke-dasharray", v + " 100");
    };
    h.center = function (html) { h.querySelector(".c").innerHTML = html; };
    later(function () { h.set(pct); });
    return h;
  };
  /* A person's own hue behind their initials, with initials that can be read
     on it: dark ink on a light hue, white on a dark one. */
  P.hue = function (node, hue) {
    var h = String(hue || "").trim(), m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(h);
    if (!m) { node.style.background = "var(--ph-accent)"; node.style.color = "#fff"; return node; }
    var x = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
    var r = parseInt(x.slice(0, 2), 16) / 255, g = parseInt(x.slice(2, 4), 16) / 255, b = parseInt(x.slice(4, 6), 16) / 255;
    function lin(c) { return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }
    var L = .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
    node.style.background = h;
    node.style.color = L > .38 ? "#1d1d1f" : "#fff";
    return node;
  };
  /* A segmented control whose thumb slides. */
  P.seg = function (items, active, on) {
    var h = el("div", "ph-seg"), thumb = el("i"), bs = [];
    h.setAttribute("role", "tablist");
    h.appendChild(thumb);
    thumb.style.width = "calc((100% - 6px) / " + items.length + ")";
    items.forEach(function (it, i) {
      var b = el("button", null, esc(it.label) + (it.n != null && it.n !== "" ? ' <span class="n' + (it.hot ? " hot" : "") + '">' + esc(it.n) + "</span>" : ""));
      b.type = "button";
      b.setAttribute("role", "tab");
      b.dataset.k = it.k;
      b.addEventListener("click", function () { if (h.cur !== it.k) { h.set(it.k); on(it.k); } });
      bs.push(b);
      h.appendChild(b);
    });
    h.set = function (k) {
      h.cur = k;
      bs.forEach(function (b, i) {
        var yes = b.dataset.k === k;
        b.setAttribute("aria-selected", yes ? "true" : "false");
        if (yes) thumb.style.transform = "translateX(" + i * 100 + "%)";
      });
    };
    h.set(active);
    return h;
  };
  /* Make a row of staggered arrivals. */
  P.rise = function (nodes, from) {
    (nodes || []).forEach(function (n, i) {
      if (!n) return;
      n.classList.add("ph-rise");
      n.style.setProperty("--i", String((from || 0) + i));
    });
  };

  /* ------------------------------------------------------------- Chrome */
  function groundColour() {
    var a = document.body.dataset.appearance || "light";
    var dark = a === "dark" || (a === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    return dark ? "#000000" : "#f5f5f7";
  }
  function syncChrome() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", groundColour());
  }
  P.syncChrome = syncChrome;
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", syncChrome);

  /* ------------------------------------------------------------ Surfaces */
  function surface(cls) {
    var s = el("section", "ph-s " + cls);
    var amb = el("div", "ph-amb");
    var sc = el("div", "ph-scroll");
    s.appendChild(amb);
    s.appendChild(sc);
    return { el: s, scroll: sc, amb: amb };
  }
  function mount() {
    if (root && root.isConnected) return root;
    var v = document.getElementById("v-admin");
    // Whatever the console last drew there is not for a phone; the shell goes on <body>.
    giveBack();
    v.innerHTML = "";
    document.body.classList.add("is-phone");
    // The first time a phone opens OEdu it follows the phone's own light or dark.
    try { if (localStorage.getItem("oplo.console.appearance") == null) K.setAppearance("auto"); } catch (e) { /* private mode */ }
    root = el("div", "ph");
    document.body.appendChild(root);
    home = surface("ph-home t-blue");
    home.scroll.classList.add("ph-home-scroll");
    root.appendChild(home.el);
    stack = []; sheets = [];
    syncChrome();
    watchScroll(home);
    return root;
  }
  P.mount = mount;
  P.home = function () { mount(); return home; };
  P.root = function () { mount(); return root; };

  /* The bar's glass and title appear as the large title leaves. */
  function watchScroll(S) {
    var sc = S.scroll, tick = false;
    sc.addEventListener("scroll", function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        tick = false;
        var y = sc.scrollTop, t = S.titleEl;
        sc.classList.toggle("is-scrolled", y > 4);
        sc.classList.toggle("has-t", !!t && y > t.offsetTop + t.offsetHeight - 48);
      });
    }, { passive: true });
  }

  /* The console writes into #v-admin by name. So that its pages, and the
     pages inside them, land where a phone shows them, #v-admin lives in the
     layer that is showing one, and goes back to its place when that layer goes. */
  function giveBack() {
    var v = document.getElementById("v-admin"), wrap = document.getElementById("wrap");
    if (v && wrap && v.parentNode !== wrap) wrap.appendChild(v);
  }
  P.legacy = function (L, w, draw) {
    var v = document.getElementById("v-admin");
    function paint() {
      v.innerHTML = "";
      var body = el("div", "admin-body");
      v.appendChild(body);
      draw(body);
    }
    w.appendChild(v);
    v.classList.add("on");
    L.redraw = paint;
    L.onRetire = giveBack;
    paint();
  };

  function relayer() {
    var n = stack.length;
    home.el.classList.toggle("is-under", n > 0);
    home.el.classList.toggle("u2", n > 1);
    inert(home.el, n > 0);
    stack.forEach(function (L, i) {
      var under = n - 1 - i;
      L.el.classList.toggle("is-under", under > 0);
      L.el.classList.toggle("u2", under > 1);
      inert(L.el, under > 0);
    });
  }

  function makeLayer(key, depth, o) {
    var S = surface("ph-layer d" + depth + " t-" + (o.tone || "blue"));
    S.key = key; S.depth = depth; S.o = o;
    S.el.setAttribute("role", "dialog");
    S.el.setAttribute("aria-modal", "true");
    S.el.setAttribute("aria-label", o.label || "OEdu");
    var bar = el("header", "ph-bar");
    S.left = el("div", "l"); S.right = el("div", "r");
    S.barTitle = el("b", "t", esc(o.label || ""));
    bar.appendChild(S.left); bar.appendChild(S.barTitle); bar.appendChild(S.right);
    S.scroll.appendChild(bar);
    S.el.appendChild(el("span", "ph-grab"));
    S.body = el("div", "ph-body");
    S.scroll.appendChild(S.body);
    if (depth > 1 && o.back) S.left.appendChild(btn("back", icon("back") + "<span>" + esc(o.back.label) + "</span>", "Back to " + o.back.label, function () { P.up(o.back); }));
    else S.right.appendChild(P.closeBtn());
    /* The large title, as the page's first words. */
    S.head = function (h) {
      var t = el("div", "ph-title");
      t.innerHTML = (h.eyebrow ? '<p class="eb">' + esc(h.eyebrow) + "</p>" : "") + "<h1>" + esc(h.title) + "</h1>" + (h.sub ? "<p>" + esc(h.sub) + "</p>" : "");
      S.body.appendChild(t);
      S.titleEl = t;
      S.barTitle.textContent = h.title;
      S.el.setAttribute("aria-label", h.title);
      return t;
    };
    S.add = function (n) { if (n) S.body.appendChild(n); return n; };
    /* A bar of actions held at the bottom of a layer, over the content. */
    S.dock = function (n) {
      S.dockEl = n;
      n.classList.add("ph-dock");
      S.el.appendChild(n);
      S.scroll.classList.add("has-dock");
      return n;
    };
    S.tone = function (t) { S.el.className = S.el.className.replace(/\bt-\w+/g, "").trim() + " t-" + t; };
    watchScroll(S);
    gesture(S);
    return S;
  }

  /* --------------------------------------------------------------- Present
     Open a place. If it is already one of the layers, everything above it
     closes; if it is not, it goes on top — replacing anything at its own depth
     or deeper, so moving sideways never piles layers up. */
  P.present = function (key, depth, o, build) {
    mount();
    o = o || {};
    while (sheets.length) sheets[sheets.length - 1].close();   // a sheet never outlives the place it came from
    var i, L;
    for (i = 0; i < stack.length; i++) if (stack[i].key === key) break;
    if (i < stack.length) {
      popTo(i);
      L = stack[i];
      if (o.route) o.route(L);
      return L;
    }
    // Drop what the new layer replaces; the last one stays until it is covered.
    var gone = [];
    while (stack.length && stack[stack.length - 1].depth >= depth) gone.push(stack.pop());
    L = makeLayer(key, depth, o);
    root.appendChild(L.el);
    stack.push(L);
    build(L);
    relayer();
    gone.forEach(function (g, j) { retire(g, j === 0 && !RM.matches ? 520 : 0); });
    later(function () { L.el.classList.add("is-in"); });
    setTimeout(function () { try { L.scroll.focus({ preventScroll: true }); } catch (e) { /* old browsers */ } }, 60);
    return L;
  };
  function retire(L, ms) {
    if (L.onRetire) L.onRetire();
    L.el.classList.add("is-leaving");
    L.el.classList.remove("is-in");
    inert(L.el, true);
    if (!ms) { if (L.el.parentNode) L.el.parentNode.removeChild(L.el); return; }
    setTimeout(function () { if (L.el.parentNode) L.el.parentNode.removeChild(L.el); }, ms);
  }
  function popTo(i) {                      // i = -1 closes everything
    var gone = [];
    while (stack.length - 1 > i) gone.push(stack.pop());
    gone.forEach(function (g, j) { retire(g, j === 0 && !RM.matches ? 640 : 0); g.el.style.transform = ""; });
    relayer();
    var top = stack[stack.length - 1];
    if (top) inert(top.el, false); else inert(home.el, false);
    if (!stack.length && home.onShow) home.onShow();
  }
  P.popAll = function () { if (root) { while (sheets.length) sheets[sheets.length - 1].close(); popTo(-1); } };
  P.depth = function () { return stack.length; };
  P.top = function () { return stack[stack.length - 1] || null; };

  /* Closing is the browser's Back where there is one behind this page, and a
     step up to the home screen where there is not (a link, a reload). */
  P.close = function () {
    if (sheets.length) { sheets[sheets.length - 1].close(); return; }
    if (K.hasBack()) K.back(); else P.goHome();
  };
  P.up = function (to) { if (K.hasBack() && !to.force) K.back(); else to.go(); };
  P.goHome = function () { if (K.S.me && K.S.me.role === "student") K.open("today"); else K.openStaff("today"); };

  /* --------------------------------------------------------------- Gesture
     A pull down on a layer, from the top of its content, follows the finger;
     let go past a third of the way or quickly and it closes. The layer under
     grows back as it goes. */
  function drag(node, scroller, dismiss, o) {
    o = o || {};
    var x0 = 0, y0 = 0, t0 = 0, dy = 0, on = false;
    function horizontal(t) {
      while (t && t !== node) { if (t.scrollWidth > t.clientWidth + 2 && /(auto|scroll)/.test(getComputedStyle(t).overflowX)) return true; t = t.parentNode; }
      return false;
    }
    node.addEventListener("touchstart", function (e) {
      on = false;
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = e.timeStamp; dy = 0;
    }, { passive: true });
    node.addEventListener("touchmove", function (e) {
      if (e.touches.length !== 1) return;
      var y = e.touches[0].clientY - y0, x = e.touches[0].clientX - x0;
      if (!on) {
        if (y > 10 && y > Math.abs(x) * 1.3 && (!scroller || scroller.scrollTop <= 0) && !horizontal(e.target)) {
          on = true;
          node.classList.add("is-drag");
          if (o.start) o.start();
        } else return;
      }
      if (e.cancelable) e.preventDefault();
      dy = Math.max(0, y - 10);
      dy = dy > 40 ? 40 + (dy - 40) * .92 : dy;
      node.style.transform = "translateY(" + dy + "px)";
      if (o.move) o.move(Math.min(1, dy / Math.max(240, node.offsetHeight * .8)));
    }, { passive: false });
    function end(e) {
      if (!on) return;
      on = false;
      node.classList.remove("is-drag");
      var v = dy / Math.max(1, e.timeStamp - t0);
      if (dy > Math.min(160, node.offsetHeight * .3) || v > .65) {
        node.style.transform = "";
        if (o.end) o.end(true);
        dismiss();
      } else {
        node.style.transform = "";
        if (o.end) o.end(false);
      }
    }
    node.addEventListener("touchend", end);
    node.addEventListener("touchcancel", end);
  }
  function gesture(S) {
    drag(S.el, S.scroll, P.close, {
      start: function () { root.classList.add("is-dragging"); },
      move: function (p) { root.style.setProperty("--ph-drag", String(p)); },
      end: function () { root.classList.remove("is-dragging"); root.style.removeProperty("--ph-drag"); }
    });
  }

  /* A pull down on the home screen, from its top, asks for fresh numbers. */
  P.pull = function (S, run) {
    var sc = S.scroll, ind = el("div", "ph-ptr", "<i></i>"), y0 = null, dy = 0, on = false, busy = false;
    S.el.appendChild(ind);
    function show(d) {
      ind.style.opacity = String(Math.min(1, d / 46));
      ind.style.transform = "translate(-50%," + (d - 30) + "px) scale(" + (.6 + Math.min(1, d / 70) * .4) + ")";
      ind.firstChild.style.transform = "rotate(" + Math.round(d * 4) + "deg)";
    }
    function rest() { ind.classList.remove("spin"); ind.style.transition = "opacity .3s, transform .45s cubic-bezier(.32,.72,0,1)"; ind.style.opacity = "0"; ind.style.transform = "translate(-50%,-30px) scale(.6)"; setTimeout(function () { ind.style.transition = ""; busy = false; }, 460); }
    sc.addEventListener("touchstart", function (e) { y0 = (busy || sc.scrollTop > 0 || e.touches.length !== 1) ? null : e.touches[0].clientY; on = false; dy = 0; }, { passive: true });
    sc.addEventListener("touchmove", function (e) {
      if (y0 == null) return;
      var y = e.touches[0].clientY - y0;
      if (!on) { if (y > 8 && sc.scrollTop <= 0) on = true; else return; }
      dy = Math.min(110, (y - 8) * .55);
      show(dy);
    }, { passive: true });
    function end() {
      if (!on) return;
      on = false; y0 = null;
      if (dy >= 60) {
        busy = true;
        ind.classList.add("spin");
        ind.style.transition = "transform .3s cubic-bezier(.32,.72,0,1)";
        ind.style.transform = "translate(-50%, 34px) scale(1)";
        var done = function () { setTimeout(rest, 350); };
        Promise.resolve().then(run).then(done, done);
      } else rest();
    }
    sc.addEventListener("touchend", end);
    sc.addEventListener("touchcancel", end);
  };

  /* --------------------------------------------------------------- Sheet
     For one thing looked at, not a place: a piece of work, a day. It rises
     from the bottom, takes the pull down, and is not in the history. */
  P.sheet = function (o) {
    mount();
    var wrap = el("div", "ph-sheetwrap"), sh = el("div", "ph-sheet t-" + (o.tone || "blue"));
    sh.setAttribute("role", "dialog");
    sh.setAttribute("aria-modal", "true");
    sh.setAttribute("aria-label", o.title || "Details");
    var hd = el("div", "hd");
    hd.innerHTML = "<div><h2>" + esc(o.title || "") + "</h2>" + (o.sub ? "<p>" + esc(o.sub) + "</p>" : "") + "</div>";
    var bd = el("div", "bd");
    var closed = false;
    var ctl = {
      body: bd,
      close: function () {
        if (closed) return;
        closed = true;
        var i = sheets.indexOf(ctl);
        if (i > -1) sheets.splice(i, 1);
        wrap.classList.remove("on");
        sh.style.transform = "";
        setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, RM.matches ? 0 : 560);
        if (o.onClose) o.onClose();
      }
    };
    hd.appendChild(btn("close", icon("close"), "Close", function () { ctl.close(); }));
    sh.appendChild(el("span", "ph-grab"));
    sh.appendChild(hd);
    sh.appendChild(bd);
    wrap.appendChild(sh);
    wrap.addEventListener("click", function (e) { if (e.target === wrap) ctl.close(); });
    root.appendChild(wrap);
    sheets.push(ctl);
    // The keyboard takes the bottom of the screen; the sheet rides above it.
    var vv = window.visualViewport;
    function fit() {
      if (!vv) return;
      var kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      sh.style.bottom = kb + "px";
      sh.style.maxHeight = "calc(100% - var(--ph-top) - 24px - " + kb + "px)";
    }
    if (vv) { vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit); }
    var close0 = ctl.close;
    ctl.close = function () { if (vv) { vv.removeEventListener("resize", fit); vv.removeEventListener("scroll", fit); } close0(); };
    if (o.body) o.body(bd, ctl);
    drag(sh, bd, function () { ctl.close(); }, {});
    later(function () { wrap.classList.add("on"); });
    return ctl;
  };

  P.toast = function (msg) {
    mount();
    var t = root.querySelector(".ph-toast");
    if (!t) { t = el("div", "ph-toast"); t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); root.appendChild(t); }
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove("on"); }, 2600);
  };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root && root.isConnected) {
      if (sheets.length) { e.preventDefault(); sheets[sheets.length - 1].close(); }
      else if (stack.length) { e.preventDefault(); P.close(); }
    }
  });

  /* The home screen's own bar of three things: where it is, who you are. */
  P.leave = function () {
    giveBack();
    if (root && root.parentNode) root.parentNode.removeChild(root);
    document.body.classList.remove("is-phone");
    if (P.onLeave) P.onLeave();
    root = null; home = null; stack = []; sheets = [];
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", "#ffffff");
  };

  /* Signing out asks first, in the same voice as everything else. */
  P.signOut = function () {
    var ctl = P.sheet({ title: "Sign out of OEdu?", sub: "You’ll need to sign in again to see your school.", tone: "gray", body: function (b) {
      var row = el("div", "ph-btnrow");
      var no = el("button", "ph-cta quiet", "Stay signed in");
      no.type = "button";
      no.addEventListener("click", function () { ctl.close(); });
      var yes = el("button", "ph-cta danger", "Sign out");
      yes.type = "button";
      yes.addEventListener("click", function () { ctl.close(); K.signOutNow(); });
      row.appendChild(no); row.appendChild(yes);
      b.appendChild(row);
    } });
  };

  /* Appearance: three choices, kept on the phone. */
  P.look = function (mode) { K.setAppearance(mode); syncChrome(); };
  P.lookNow = function () { return (document.body.dataset.appearance) || "auto"; };

  /* A greeting that knows the hour. */
  P.greet = function (name) {
    var h = new Date().getHours();
    return (h < 5 ? "Good evening" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening") + (name ? ", " + name : "");
  };

  if (typeof window.OPLO_PHONE_SHARED === "function") window.OPLO_PHONE_SHARED(P);
  if (typeof window.OPLO_PHONE_STUDENT === "function") window.OPLO_PHONE_STUDENT(P);
  if (typeof window.OPLO_PHONE_STAFF === "function") window.OPLO_PHONE_STAFF(P);
  return P;
};
