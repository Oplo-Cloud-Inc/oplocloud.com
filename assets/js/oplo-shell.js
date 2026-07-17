/* ==========================================================================
   Oplo — ecosystem shell
   One script, dropped on every page, that renders the connective tissue that
   makes Oplo feel like a single place: the waffle app-launcher and the
   account chip. Edit OPLO_APPS below to change what's in the ecosystem — it's
   the single source of truth every surface reads from.
   Dependency-free, framework-free, self-styling (pulls in oplo-shell.css).
   ========================================================================== */
(function () {
  "use strict";
  if (window.__oploShell) return;         // guard against double-inject
  window.__oploShell = true;

  /* -------------------------------------------------- App registry */
  // glyph = inner SVG markup drawn in a 24×24 box (matches the suite icons).
  var OPLO_APPS = [
    { id: "odocs",   name: "ODocs",   href: "/odocs/",   c1: "#5A93FF", c2: "#2E6FE6", ready: false,
      glyph: '<path d="M7 3.5h7L18 8v12.5H7z"/><path d="M13.5 3.5V8H18"/><path d="M9.5 12.5h6M9.5 15.5h6"/>' },
    { id: "osheets", name: "OSheets", href: "/osheets/", c1: "#33CE92", c2: "#12A06E", ready: false,
      glyph: '<rect x="4.5" y="4.5" width="15" height="15" rx="2"/><path d="M4.5 10h15M4.5 14.5h15M11 4.5v15"/>' },
    { id: "omails",  name: "OMails",  href: "/omails/",  c1: "#FF7A6D", c2: "#EF4A3C", ready: false,
      glyph: '<rect x="4" y="6" width="16" height="12" rx="2.2"/><path d="M5 8l7 5 7-5"/>' },
    { id: "omaps",   name: "OMaps",   href: "/omaps/",   c1: "#1CC3D0", c2: "#0E96A8", ready: false,
      glyph: '<path d="M12 21s-6-5.1-6-10a6 6 0 1 1 12 0c0 4.9-6 10-6 10z"/><circle cx="12" cy="11" r="2.3"/>' },
    { id: "osurf",   name: "OSurf",   href: "/osurf/",   opal: true, dark: true, ready: false,
      glyph: '<circle cx="12" cy="12" r="8"/><path d="M15.2 8.8l-2 4.4-4.4 2 2-4.4z"/>' },
    { id: "ophotos", name: "OPhotos", href: "/ophotos/", c1: "#FFBE4D", c2: "#F59300", ready: false,
      glyph: '<rect x="4" y="5" width="16" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M5 17l4.5-4 3 2.6L16.5 11l2.5 2.4"/>' },
    { id: "ocanvas", name: "OCanvas", href: "/ocanvas/", c1: "#B57BFF", c2: "#8B45F0", ready: false,
      glyph: '<path d="M4.5 19.5l3.2-1L17 9.2l-2.2-2.2L5.5 16.3z"/><path d="M14.2 7l2.8 2.8"/>' },
    { id: "roxan",   name: "Roxan",   href: "/roxan/",   opal: true, dark: true, ready: true,
      glyph: '<path d="M12 3.4c.7 3.9 1.9 5.1 5.8 5.8-3.9.7-5.1 1.9-5.8 5.8-.7-3.9-1.9-5.1-5.8-5.8 3.9-.7 5.1-1.9 5.8-5.8z"/><path d="M18 15.2c.3 1.6.8 2.1 2.4 2.4-1.6.3-2.1.8-2.4 2.4-.3-1.6-.8-2.1-2.4-2.4 1.6-.3 2.1-.8 2.4-2.4z"/>' },
    { id: "oedu",    name: "OEdu",    href: "/oedu/teacher/", c1: "#7EE3C6", c2: "#28B894", ready: true,
      glyph: '<path d="M12 5l9 4-9 4-9-4z"/><path d="M6 11v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4"/>' }
  ];

  // Convenience so pages/console can inspect the ecosystem.
  window.OPLO_APPS = OPLO_APPS;

  var ACCOUNTS_URL = "/oplo-accounts/demo/";
  var HOME_URL = "/";

  /* -------------------------------------------------- Small helpers */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function svg(box, inner, cls) {
    return '<svg class="' + (cls || "") + '" viewBox="0 0 ' + box + '" aria-hidden="true">' + inner + "</svg>";
  }
  function appIcon(app) {
    var style = app.opal
      ? 'background:conic-gradient(from 210deg,#9BE8CE,#9CC3FF,#D4B3FF,#FFD2B3,#9BE8CE)'
      : '--c1:' + app.c1 + ';--c2:' + app.c2;
    return '<span class="oplo-app-ic" style="' + style + '">' + svg("24 24", app.glyph) + "</span>";
  }

  /* -------------------------------------------------- Account state
     Reads oidc-client-ts storage written by Oplo Accounts (the demo signs in
     the exact same way every real app will). No server call — just reflects
     whatever session is already on this device. */
  function readSession() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf("oidc.user:") === 0) {
          var u = JSON.parse(localStorage.getItem(k));
          if (u && u.profile && (!u.expires_at || u.expires_at * 1000 > Date.now())) {
            return {
              name: u.profile.name || u.profile.preferred_username || "Oplo user",
              email: u.profile.email || u.profile.preferred_username || "",
              picture: u.profile.picture || ""
            };
          }
        }
      }
    } catch (e) { /* storage blocked — treat as signed out */ }
    return null;
  }
  function initials(s) { return (s || "O").trim().charAt(0).toUpperCase(); }
  // Escape anything derived from the identity provider before it touches innerHTML.
  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeAvatar(session) {
    if (session && session.picture) return '<img src="' + escHtml(session.picture) + '" alt="">';
    if (session) return escHtml(initials(session.name));
    return '<span aria-hidden="true"></span>';
  }

  /* -------------------------------------------------- Build DOM */
  function injectCSS() {
    if (document.querySelector('link[data-oplo-shell]')) return;
    var l = el("link");
    l.rel = "stylesheet";
    l.href = "/assets/css/oplo-shell.css";
    l.setAttribute("data-oplo-shell", "");
    document.head.appendChild(l);
  }

  var WAFFLE = svg("24 24",
    [4, 12, 20].map(function (y) {
      return [4, 12, 20].map(function (x) {
        return '<circle cx="' + x + '" cy="' + y + '" r="2"/>';
      }).join("");
    }).join(""),
    "oplo-waffle-glyph");

  function buildLauncher() {
    var pop = el("div", "oplo-pop oplo-scope");
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Oplo apps");
    var wrap = el("div", "oplo-launcher");

    var head = el("div", "oplo-launcher-head",
      '<span class="oplo-eyebrow">Oplo apps</span>' +
      '<a href="/productivity/">All apps →</a>');
    wrap.appendChild(head);

    var grid = el("div", "oplo-grid");
    OPLO_APPS.forEach(function (app) {
      var tile = el("a", "oplo-tile" + (app.dark ? " oplo-dark-glyph" : ""));
      tile.href = app.href;
      tile.innerHTML = appIcon(app) +
        '<span class="oplo-app-name">' + app.name + "</span>" +
        (app.ready ? "" : '<span class="oplo-soon">Soon</span>');
      grid.appendChild(tile);
    });
    wrap.appendChild(grid);

    wrap.appendChild(el("div", "oplo-launcher-foot",
      '<span class="oplo-dot" aria-hidden="true"></span>' +
      '<a href="' + HOME_URL + '">One account · one ecosystem</a>'));

    pop.appendChild(wrap);
    document.body.appendChild(pop);
    return pop;
  }

  function buildAccount(session) {
    var pop = el("div", "oplo-pop oplo-scope");
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Oplo account");
    var wrap = el("div", "oplo-acct");

    var avatarInner = safeAvatar(session);

    if (session) {
      wrap.appendChild(el("div", "oplo-acct-head",
        '<span class="oplo-avatar">' + avatarInner + "</span>" +
        '<div><div class="oplo-name">' + escHtml(session.name) + "</div>" +
        '<div class="oplo-mail">' + escHtml(session.email) + "</div></div>"));
      var acts = el("div", "oplo-acct-actions",
        '<a href="' + ACCOUNTS_URL + '">' +
          svg("24 24", '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 19a6.5 6.5 0 0 1 13 0"/>') +
          'Manage your Oplo account</a>' +
        '<a href="/productivity/">' +
          svg("24 24", '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>') +
          'Explore the suite</a>');
      wrap.appendChild(acts);
      var out = el("a", "oplo-acct-primary");
      out.href = ACCOUNTS_URL;
      out.innerHTML = svg("24 24", '<path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3"/><path d="M10 8l-4 4 4 4M6 12h9"/>') + "Sign out";
      wrap.appendChild(out);
    } else {
      wrap.appendChild(el("div", "oplo-acct-head",
        '<span class="oplo-avatar"><span aria-hidden="true"></span></span>' +
        '<div><div class="oplo-name">Welcome to Oplo</div>' +
        '<div class="oplo-mail" style="font-family:var(--oplo-font-body)">One account for every Oplo app.</div></div>'));
      var signin = el("a", "oplo-acct-primary");
      signin.href = ACCOUNTS_URL;
      signin.innerHTML = '<span class="oplo-dot" aria-hidden="true"></span>Sign in with Oplo';
      wrap.appendChild(signin);
      wrap.appendChild(el("div", "oplo-acct-actions",
        '<a href="/productivity/">' +
          svg("24 24", '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>') +
          'Explore the suite</a>'));
    }

    wrap.appendChild(el("div", "oplo-acct-foot",
      '<a href="/soon/">Privacy</a><a href="/soon/">Terms</a><a href="/soon/">Help</a>'));

    pop.appendChild(wrap);
    document.body.appendChild(pop);
    return pop;
  }

  /* -------------------------------------------------- Popover mechanics */
  function makeController(trigger, pop, scrim) {
    var open = false;
    function place() {
      var r = trigger.getBoundingClientRect();
      pop.style.top = (r.bottom + 10) + "px";
      // right-align the popover to the trigger, clamped to viewport
      var right = Math.max(12, window.innerWidth - r.right);
      pop.style.right = right + "px";
      pop.style.left = "auto";
    }
    function set(v) {
      open = v;
      trigger.setAttribute("aria-expanded", String(v));
      if (v) { place(); pop.classList.add("oplo-open"); scrim.classList.add("oplo-open"); }
      else { pop.classList.remove("oplo-open"); scrim.classList.remove("oplo-open"); }
    }
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      closeAll(pop);
      set(!open);
    });
    document.addEventListener("click", function (e) {
      if (open && !pop.contains(e.target) && e.target !== trigger) set(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { set(false); trigger.focus(); } });
    scrim.addEventListener("click", function () { set(false); });
    var raf = null;
    function reflow() { if (!open) return; if (raf) return; raf = requestAnimationFrame(function () { place(); raf = null; }); }
    window.addEventListener("resize", reflow, { passive: true });
    window.addEventListener("scroll", reflow, { passive: true });
    return { close: function () { set(false); }, owns: pop };
  }

  var controllers = [];
  function closeAll(except) {
    controllers.forEach(function (c) { if (c.owns !== except) c.close(); });
  }

  /* -------------------------------------------------- Mount
     The cluster is built once and kept homed into the best available host:
       1. an explicit  #oplo-actions  slot (marketing bars, the OEdu app bar)
       2. a known page bar (.nav-inner / .soon-nav .inner)
       3. floating, top-right, as a last resort
     A MutationObserver re-homes it if the host is replaced — which is how it
     survives the OEdu Teacher single-page app re-rendering its whole shell. */
  var cluster;

  function findHost() {
    return document.getElementById("oplo-actions")
      || document.querySelector(".nav-inner")
      || document.querySelector(".soon-nav .inner");
  }

  function ensureMounted() {
    var host = findHost();
    if (host) {
      if (cluster.parentNode !== host) {
        cluster.classList.remove("oplo-floating");
        host.appendChild(cluster);
      }
    } else if (cluster.parentNode !== document.body || !cluster.classList.contains("oplo-floating")) {
      cluster.classList.add("oplo-floating");
      document.body.appendChild(cluster);
    }
  }

  function mount() {
    injectCSS();
    var session = readSession();

    cluster = el("div", "oplo-cluster oplo-scope");

    var waffleBtn = el("button", "oplo-iconbtn");
    waffleBtn.type = "button";
    waffleBtn.setAttribute("aria-label", "Oplo apps");
    waffleBtn.setAttribute("aria-haspopup", "dialog");
    waffleBtn.setAttribute("aria-expanded", "false");
    waffleBtn.innerHTML = WAFFLE;

    var chip = el("button", "oplo-chip");
    chip.type = "button";
    chip.setAttribute("aria-label", session ? ("Oplo account — " + session.name) : "Sign in to Oplo");
    chip.setAttribute("aria-haspopup", "dialog");
    chip.setAttribute("aria-expanded", "false");
    chip.innerHTML = '<span class="oplo-avatar">' + safeAvatar(session) + "</span>";

    cluster.appendChild(waffleBtn);
    cluster.appendChild(chip);

    var scrim = el("div", "oplo-scrim oplo-scope");
    document.body.appendChild(scrim);

    var launcher = buildLauncher();
    var account = buildAccount(session);
    controllers.push(makeController(waffleBtn, launcher, scrim));
    controllers.push(makeController(chip, account, scrim));

    ensureMounted();

    // Keep the cluster attached to the right host as apps re-render the page.
    var pending = false;
    var mo = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; ensureMounted(); });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
