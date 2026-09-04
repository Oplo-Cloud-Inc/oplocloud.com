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
      glyph: '<path d="M12 5l9 4-9 4-9-4z"/><path d="M6 11v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4"/>' },
    { id: "oteams",  name: "OTeams",  href: "/oteams/",  c1: "#8FB4FF", c2: "#C79FF0", ready: true,
      glyph: '<circle cx="8.5" cy="14" r="3"/><circle cx="16" cy="9.5" r="2.6"/><path d="M11 12.7l2.7-1.6"/>' }
  ];

  // Convenience so pages/console can inspect the ecosystem.
  window.OPLO_APPS = OPLO_APPS;

  var ACCOUNTS_URL = "/oplo-accounts/demo/";
  var HOME_URL = "/";

  /* -------------------------------------------------- Nav taxonomy
     The one nav, shown identically on every Oplo marketing view:
       Logo · Products · Solutions · Industries · Sign in
     Products/Solutions use a two-pane panel (category rail + detail list);
     Industries is a flat grid. Editing this array is the ONLY thing needed to
     change the menu — the renderer derives everything else from it. */
  var OPAL_COVER = "conic-gradient(from 210deg,#9BE8CE,#9CC3FF 90deg,#D4B3FF 180deg,#FFD2B3 270deg,#9BE8CE)";

  var NAV_MENUS = [
    {
      id: "products", label: "Products", panel: "rail",
      groups: [
        { name: "Artificial intelligence", blurb: "Roxan — the model family at the center of Oplo", items: [
          { name: "Roxan",        href: "/roxan/",             desc: "The flagship model" },
          { name: "Roxan Flash",  href: "/roxan/#models",      desc: "Fastest and most efficient" },
          { name: "Roxan Vision", href: "/roxan/#models",      desc: "See and reason over anything" },
          { name: "Roxan Voice",  href: "/roxan/#models",      desc: "Real-time speech and translation" },
          { name: "Roxan Code",   href: "/roxan/#models",      desc: "Built to build with" },
          { name: "Roxan Nano",   href: "/roxan/#models",      desc: "On-device, private by default" },
          { name: "Roxan API",    href: "/roxan/#developers",  desc: "One SDK, every model" },
          { name: "Plans and pricing", href: "/roxan/#plans",  desc: "Free through Ultra" }
        ]},
        { name: "Productivity", blurb: "The O apps — one workspace, one account", items: [
          { name: "Oplo Hub", href: "/productivity/", desc: "All seven apps together" },
          { name: "ODocs",    href: "/odocs/",    desc: "Documents",       soon: true },
          { name: "OSheets",  href: "/osheets/",  desc: "Spreadsheets",    soon: true },
          { name: "OMails",   href: "/omails/",   desc: "Email",           soon: true },
          { name: "OMaps",    href: "/omaps/",    desc: "Maps",            soon: true },
          { name: "OSurf",    href: "/osurf/",    desc: "Browser",         soon: true },
          { name: "OPhotos",  href: "/ophotos/",  desc: "Photos",          soon: true },
          { name: "OCanvas",  href: "/ocanvas/",  desc: "Creative canvas", soon: true }
        ]},
        { name: "Communication", blurb: "Where a team thinks together", items: [
          { name: "OTeams",           href: "/oteams/",     desc: "Channels, huddles, and canvas" },
          { name: "Open the workspace", href: "/oteams/app/", desc: "Step into the live app" }
        ]},
        { name: "Education", blurb: "Elevating educators, empowering learners", items: [
          { name: "OEdu",              href: "/oedu/",         desc: "Tools for the classroom" },
          { name: "OEdu for teachers", href: "/oedu/teacher/", desc: "The teacher platform" }
        ]},
        { name: "Platforms", blurb: "One stack, cut to three scales", items: [
          { name: "Halo",     href: "/soon/", desc: "For people",   soon: true },
          { name: "Slate",    href: "/soon/", desc: "For business", soon: true },
          { name: "Meridian", href: "/soon/", desc: "Sovereign cloud for government", soon: true }
        ]},
        { name: "Store and accounts", blurb: "Buy it, and sign in to it", items: [
          { name: "OShop",         href: "/OShop/",              desc: "The Oplo storefront" },
          { name: "Oplo Accounts", href: "/oplo-accounts/demo/", desc: "One sign-in for the ecosystem" }
        ]}
      ],
      feature: { tag: "Featured", title: "Roxan", desc: "The intelligence already inside every Oplo product.", href: "/roxan/", cover: OPAL_COVER },
      foot: { lead: { label: "Explore the full ecosystem", href: "/" },
              quick: [ { label: "Roxan", href: "/roxan/" }, { label: "Oplo Hub", href: "/productivity/" },
                       { label: "OTeams", href: "/oteams/" }, { label: "Research", href: "/ocrd/" } ] }
    },

    {
      id: "solutions", label: "Solutions", panel: "rail",
      groups: [
        { name: "Artificial intelligence", blurb: "Put Roxan to work", items: [
          { name: "Overview",           href: "/roxan/",             desc: "What Roxan can do" },
          { name: "Agentic AI",         href: "/roxan/#capabilities",desc: "Agents that reason, plan, and act" },
          { name: "Conversational AI",  href: "/roxan/#capabilities",desc: "Natural speech, in real time" },
          { name: "Vision AI",          href: "/roxan/#experience",  desc: "Understand images, documents, screens" },
          { name: "On-device AI",       href: "/roxan/#safety",      desc: "Private by default" },
          { name: "Developer platform", href: "/roxan/#developers",  desc: "Build on the Roxan API" }
        ]},
        { name: "Work and collaboration", blurb: "The everyday workday", items: [
          { name: "Overview",            href: "/productivity/", desc: "Seven apps, one workspace" },
          { name: "Documents and data",  href: "/odocs/",        desc: "Write, edit, and cite" },
          { name: "Team communication",  href: "/oteams/",       desc: "Channels and huddles" },
          { name: "Email and scheduling",href: "/omails/",       desc: "An inbox that triages" },
          { name: "Creative work",       href: "/ocanvas/",      desc: "Design on the canvas" }
        ]},
        { name: "Data and analytics", blurb: "Turn data into an answer", items: [
          { name: "Overview",              href: "/osheets/",           desc: "Spreadsheets, rebuilt" },
          { name: "Modeling and forecasts",href: "/roxan/mof/",         desc: "Simulate before you decide" },
          { name: "Reporting and insight", href: "/roxan/#capabilities",desc: "Ask, and get the read" }
        ]},
        { name: "Security and identity", blurb: "Who gets in, and what they see", items: [
          { name: "Overview",            href: "/oplo-accounts/demo/", desc: "Oplo Accounts" },
          { name: "Single sign-on",      href: "/oplo-accounts/demo/", desc: "One identity, every app" },
          { name: "Privacy and safety",  href: "/roxan/#safety",       desc: "On-device, opt-in, reversible" }
        ]},
        { name: "Sovereign cloud", blurb: "Infrastructure that stays home", items: [
          { name: "Overview",         href: "/soon/",      desc: "Meridian", soon: true },
          { name: "Data residency",   href: "/soon/",      desc: "Inside your own borders", soon: true },
          { name: "Public-sector compliance", href: "/roxan/mof/", desc: "Built for ministries" }
        ]},
        { name: "Research", blurb: "The work behind the products", items: [
          { name: "Overview",     href: "/ocrd/",           desc: "Oplo Center for Research & Discovery" },
          { name: "Publications", href: "/ocrd/",           desc: "What we've learned, published" },
          { name: "Roxan lab",    href: "/roxan/#research", desc: "Model and safety research" }
        ]}
      ],
      feature: { tag: "Solution spotlight", title: "Agentic AI", desc: "Agents that finish the task, not just the sentence.", href: "/roxan/#capabilities", cover: "linear-gradient(140deg,#9CC3FF,#D4B3FF)" },
      foot: { lead: { label: "Talk to our team", href: "/soon/" },
              quick: [ { label: "For developers", href: "/roxan/#developers" }, { label: "For business", href: "/oteams/" },
                       { label: "For government", href: "/roxan/mof/" }, { label: "For education", href: "/oedu/" } ] }
    },

    {
      id: "industries", label: "Industries", panel: "grid",
      groups: [
        { name: "Industries", blurb: "Who we build for", items: [
          { name: "Government and public sector", href: "/roxan/mof/",  desc: "Roxan for Ministry of Finance" },
          { name: "Financial services",           href: "/roxan/mof/",  desc: "Analysis, policy, and forecasting" },
          { name: "Education",                    href: "/oedu/",       desc: "Classrooms and campuses" },
          { name: "Higher education and research",href: "/ocrd/",       desc: "Labs and research computing" },
          { name: "Legal",                        href: "/OLaws/",      desc: "Lodestar litigation platform" },
          { name: "Retail and commerce",          href: "/OShop/",      desc: "Storefronts and marketplaces" },
          { name: "Media and creative",           href: "/ocanvas/",    desc: "Design and production" },
          { name: "Healthcare and life sciences", href: "/soon/",       desc: "Care and discovery", soon: true },
          { name: "Manufacturing and industrial", href: "/soon/",       desc: "The factory floor",  soon: true },
          { name: "Telecommunications",           href: "/soon/",       desc: "Networks at scale",  soon: true },
          { name: "Energy",                       href: "/soon/",       desc: "Grid and generation", soon: true },
          { name: "Small business",               href: "/soon/",       desc: "Everything in one place", soon: true }
        ]}
      ],
      feature: { tag: "Industry spotlight", title: "Ministry of Finance", desc: "An AI advisor that reads the economy and drafts the memo.", href: "/roxan/mof/", cover: "linear-gradient(140deg,#9BE8CE,#9CC3FF)" },
      foot: { lead: { label: "See all customer stories", href: "/soon/" },
              quick: [ { label: "Public sector", href: "/roxan/mof/" }, { label: "Education", href: "/oedu/" },
                       { label: "Legal", href: "/OLaws/" }, { label: "Research", href: "/ocrd/" } ] }
    }
  ];

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

  function accountChip(session) {
    var chip = el("button", "oplo-chip");
    chip.type = "button";
    chip.setAttribute("aria-label", session ? ("Oplo account — " + session.name) : "Sign in to Oplo");
    chip.setAttribute("aria-haspopup", "dialog");
    chip.setAttribute("aria-expanded", "false");
    chip.innerHTML = '<span class="oplo-avatar">' + safeAvatar(session) + "</span>";
    return chip;
  }

  /* -------------------------------------------------- Mega-menu panel */
  function itemHTML(it) {
    return '<a class="omega-item" href="' + escHtml(it.href) + '">' +
      '<span class="oi-name">' + escHtml(it.name) +
        (it.soon ? '<span class="oi-soon">Soon</span>' : "") + "</span>" +
      '<span class="oi-desc">' + escHtml(it.desc || "") + "</span></a>";
  }

  function buildPanel(menu) {
    var panel = el("div", "omega");
    panel.id = "omega-" + menu.id;
    panel.setAttribute("data-panel", menu.panel);
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", menu.label);

    var inner = el("div", "omega-in");
    var rail = null;

    // Two-pane menus get a category rail; flat ones render every item at once.
    if (menu.panel === "rail") {
      rail = el("div", "omega-rail");
      rail.setAttribute("role", "tablist");
      rail.setAttribute("aria-orientation", "vertical");
      rail.setAttribute("aria-label", menu.label + " categories");
      inner.appendChild(rail);
    }

    var panes = el("div", "omega-panes");
    menu.groups.forEach(function (g, i) {
      if (rail) {
        var tab = el("button", "omega-tab" + (i === 0 ? " is-on" : ""),
          "<span>" + escHtml(g.name) + '</span><span class="ot-chev" aria-hidden="true"></span>');
        tab.type = "button";
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-selected", i === 0 ? "true" : "false");
        tab.setAttribute("aria-controls", "omega-" + menu.id + "-" + i);
        tab.tabIndex = i === 0 ? 0 : -1;
        rail.appendChild(tab);
      }
      var pane = el("div", "omega-pane" + (i === 0 ? " is-on" : ""));
      pane.id = "omega-" + menu.id + "-" + i;
      if (rail) pane.setAttribute("role", "tabpanel");
      pane.innerHTML =
        '<p class="omega-blurb">' + escHtml(g.blurb || g.name) + "</p>" +
        '<div class="' + (menu.panel === "grid" ? "omega-grid" : "omega-items") + '">' +
        g.items.map(itemHTML).join("") + "</div>";
      panes.appendChild(pane);
    });
    inner.appendChild(panes);

    if (menu.feature) {
      var f = menu.feature;
      inner.appendChild(el("a", "omega-feature",
        '<span class="of-cover" style="background:' + f.cover + '"></span>' +
        '<span class="of-body"><span class="of-tag">' + escHtml(f.tag) + "</span>" +
        '<span class="of-title">' + escHtml(f.title) + "</span>" +
        '<span class="of-desc">' + escHtml(f.desc) + "</span></span>")).href = f.href;
    }

    if (menu.foot) {
      var foot = el("div", "omega-foot",
        '<a class="of-lead" href="' + escHtml(menu.foot.lead.href) + '">' +
          escHtml(menu.foot.lead.label) + " &rarr;</a>" +
        '<span class="of-quick">' + menu.foot.quick.map(function (q) {
          return '<a href="' + escHtml(q.href) + '">' + escHtml(q.label) + "</a>";
        }).join("") + "</span>");
      inner.appendChild(foot);
    }

    panel.appendChild(inner);

    // Rail behaviour: switch the visible pane, with roving focus + arrow keys.
    if (rail) {
      var tabs = [].slice.call(rail.children);
      var paneEls = [].slice.call(panes.children);
      function select(i, focus) {
        tabs.forEach(function (t, n) {
          var on = n === i;
          t.classList.toggle("is-on", on);
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          paneEls[n].classList.toggle("is-on", on);
        });
        if (focus) tabs[i].focus();
      }
      tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { select(i); });
        t.addEventListener("mouseenter", function () { select(i); });
        t.addEventListener("keydown", function (e) {
          if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); select((i + 1) % tabs.length, true); }
          else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
          else if (e.key === "Home") { e.preventDefault(); select(0, true); }
          else if (e.key === "End") { e.preventDefault(); select(tabs.length - 1, true); }
        });
      });
      panel.__reset = function () { select(0); };
    }
    return panel;
  }

  // The unified top nav — one source, rendered on every marketing view.
  function buildNav(session, accountPop, scrim) {
    var nav = el("nav", "onav oplo-scope");
    nav.setAttribute("aria-label", "Oplo");

    var inner = el("div", "onav-in");

    var brand = el("a", "onav-brand");
    brand.href = HOME_URL;
    brand.innerHTML = '<span class="onav-dot" aria-hidden="true"></span>Oplo';

    // Products / Solutions / Industries — each a trigger + its panel.
    var menuScrim = el("div", "onav-scrim oplo-scope");
    document.body.appendChild(menuScrim);

    var links = el("ul", "onav-links");
    var openItem = null, hoverTimer = null;
    var isSmall = function () { return window.matchMedia("(max-width: 720px)").matches; };

    function closeMenus() {
      if (!openItem) return;
      openItem.classList.remove("is-open");
      openItem.__trigger.setAttribute("aria-expanded", "false");
      openItem = null;
      nav.classList.remove("menu-open");
      menuScrim.classList.remove("is-on");
    }
    function openMenu(li) {
      clearTimeout(hoverTimer);
      if (openItem === li) return;
      if (openItem) {
        openItem.classList.remove("is-open");
        openItem.__trigger.setAttribute("aria-expanded", "false");
      }
      li.classList.add("is-open");
      li.__trigger.setAttribute("aria-expanded", "true");
      if (li.__panel.__reset) li.__panel.__reset();
      openItem = li;
      if (!isSmall()) { nav.classList.add("menu-open"); menuScrim.classList.add("is-on"); }
    }

    NAV_MENUS.forEach(function (menu) {
      var li = el("li", "onav-item");
      var trigger = el("button", "onav-trigger",
        "<span>" + escHtml(menu.label) + '</span><span class="onav-caret" aria-hidden="true"></span>');
      trigger.type = "button";
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-haspopup", "true");
      trigger.setAttribute("aria-controls", "omega-" + menu.id);

      var panel = buildPanel(menu);
      li.__trigger = trigger;
      li.__panel = panel;

      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        li.classList.contains("is-open") ? closeMenus() : openMenu(li);
      });
      li.addEventListener("mouseenter", function () { if (!isSmall()) openMenu(li); });
      li.addEventListener("mouseleave", function () {
        if (!isSmall()) hoverTimer = setTimeout(closeMenus, 160);
      });

      li.appendChild(trigger);
      li.appendChild(panel);
      links.appendChild(li);
    });

    menuScrim.addEventListener("click", closeMenus);
    document.addEventListener("click", function (e) {
      if (openItem && !openItem.contains(e.target)) closeMenus();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && openItem) { var t = openItem.__trigger; closeMenus(); t.focus(); }
    });

    var actions = el("div", "onav-actions");
    if (!session) {
      var signin = el("a", "onav-signin");
      signin.href = ACCOUNTS_URL;
      signin.textContent = "Sign in";
      actions.appendChild(signin);
    }
    var chip = accountChip(session);
    actions.appendChild(chip);

    var toggle = el("button", "onav-toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = "<span></span><span></span><span></span>";

    inner.appendChild(brand);
    inner.appendChild(links);
    inner.appendChild(actions);
    inner.appendChild(toggle);
    nav.appendChild(inner);
    document.body.insertBefore(nav, document.body.firstChild);

    controllers.push(makeController(chip, accountPop, scrim));

    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // The bar's backdrop-filter makes it the containing block for anything
    // position:fixed inside it, which would collapse the drawer to bar height.
    // `drawer-open` drops the filter for as long as the drawer is down.
    function closeDrawer() {
      links.classList.remove("onav-open");
      nav.classList.remove("drawer-open");
      toggle.classList.remove("on");
      toggle.setAttribute("aria-expanded", "false");
      closeMenus();
    }
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("onav-open");
      nav.classList.toggle("drawer-open", open);
      toggle.classList.toggle("on", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (!open) closeMenus();
    });
    // Following any link closes both the drawer and the open menu.
    links.addEventListener("click", function (e) { if (e.target.closest("a")) closeDrawer(); });
    window.addEventListener("resize", closeDrawer, { passive: true });
  }

  // Legacy cluster (waffle + chip) for the OEdu app, which carries its own bar.
  function mountCluster(session, accountPop, scrim) {
    cluster = el("div", "oplo-cluster oplo-scope");
    var waffleBtn = el("button", "oplo-iconbtn");
    waffleBtn.type = "button";
    waffleBtn.setAttribute("aria-label", "Oplo apps");
    waffleBtn.setAttribute("aria-haspopup", "dialog");
    waffleBtn.setAttribute("aria-expanded", "false");
    waffleBtn.innerHTML = WAFFLE;
    var chip = accountChip(session);
    cluster.appendChild(waffleBtn);
    cluster.appendChild(chip);

    var launcher = buildLauncher();
    controllers.push(makeController(waffleBtn, launcher, scrim));
    controllers.push(makeController(chip, accountPop, scrim));

    ensureMounted();
    var pending = false;
    var mo = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; ensureMounted(); });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function mount() {
    injectCSS();
    var session = readSession();

    var scrim = el("div", "oplo-scrim oplo-scope");
    document.body.appendChild(scrim);
    var account = buildAccount(session);

    if (document.documentElement.getAttribute("data-oplo-nav") === "off") {
      mountCluster(session, account, scrim);
    } else {
      document.documentElement.classList.add("oplo-navmode");
      buildNav(session, account, scrim);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
