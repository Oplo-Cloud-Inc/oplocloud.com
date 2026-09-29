/* ==========================================================================
   OC EFM — the application shell.

   Signs the person in through auth.oplocloud.com (never a password field
   here), builds the sandbox — the seeded books plus whatever this person
   has done to them — and routes between the screens. Screens register with
   EFM.view(); each one is a function of the engine's state and re-renders
   when a command changes it.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;

  var LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var API = LOCAL ? "http://" + location.hostname + ":8787" : "https://api.oplocloud.com";
  var STORE = "efm.sandbox.v1";

  var VIEWS = {}, ORDER = [];
  EFM.view = function (id, def) { def.id = id; VIEWS[id] = def; if (ORDER.indexOf(id) < 0) ORDER.push(id); };

  /* The rail, in the order a finance team works: what needs me, the books,
     money out, money in, cash, what we own, the plan, the close and the
     controls around all of it. */
  var NAV = [
    { label: null, items: [["home", "Home", "home"], ["inbox", "Inbox", "inbox"]] },
    { label: "Record", items: [["ledger", "General ledger", "book"], ["journals", "Journals", "journal"], ["reports", "Reports", "report"]] },
    { label: "Operate", items: [["payables", "Payables", "payables"], ["receivables", "Receivables", "receivables"], ["cash", "Cash & banking", "bank"], ["assets", "Fixed assets", "box"]] },
    { label: "Plan", items: [["budgets", "Budgets", "target"], ["planning", "Forecast & scenarios", "trend"]] },
    { label: "Close & control", items: [["close", "Close", "close"], ["consolidation", "Consolidation", "layers"], ["audit", "Audit & controls", "shield"]] }
  ];

  var app = EFM.app = {
    E: null, me: null, account: null, scope: "GROUP", role: "member",
    actor: function () { return { id: "me", name: app.me.name, role: app.role }; },
    views: VIEWS
  };

  /* ------------------------------------------------------------- Store */
  function key() { return STORE + ":" + (app.account ? app.account.id : "anon"); }
  function load() { try { return JSON.parse(localStorage.getItem(key()) || "null"); } catch (e) { return null; } }
  function save() {
    try { localStorage.setItem(key(), JSON.stringify({ log: app.E.log, scope: app.scope, v: 1 })); } catch (e) { /* private mode: the session still works */ }
  }
  app.reset = function () {
    ui.confirm({ title: "Reset the sandbox?", text: "Everything you have done — approvals, journals, reconciliations, the close — is undone and the books go back to how they were seeded. Nothing outside this browser is affected.", confirmLabel: "Reset", danger: true })
      .then(function (yes) {
        if (!yes) return;
        try { localStorage.removeItem(key()); localStorage.removeItem("efm.traced"); localStorage.removeItem("efm.tour.hidden"); } catch (e) { /* ignore */ }
        location.href = "/home";
      });
  };

  /* -------------------------------------------------------- Scope & role */
  app.scopeCurrency = function (scope) {
    scope = scope || app.scope;
    return scope === "GROUP" ? "USD" : app.E.entity[scope].currency;
  };
  app.scopeLabel = function (scope) {
    scope = scope || app.scope;
    return scope === "GROUP" ? "OploCloud Group" : app.E.entity[scope].name;
  };
  app.inScope = function (entity) { return app.scope === "GROUP" || app.scope === entity; };
  /* An amount from `entity` in the scope's currency (USD for the group). */
  app.inScopeCur = function (entity, minor, period, kind) {
    if (app.scope !== "GROUP") return minor;
    return app.E.usdOf(entity, minor, period || app.E.currentPeriod(), kind || "close");
  };
  app.setScope = function (s) { app.scope = s; save(); render(); };

  /* --------------------------------------------------------- Commands */
  app.run = function (type, payload, o) {
    o = o || {};
    var r = ui.attempt(function () { return app.E.exec(type, payload, o.actor || app.actor()); }, o.ok);
    if (r != null) { save(); render(); if (o.then) o.then(r); }
    return r;
  };

  /* After a screen runs several commands itself (a bulk approval), this
     saves the sandbox and redraws once. */
  app.commit = function () { save(); render(); };

  /* ------------------------------------------------------------ Router */
  var state = { path: "/home", id: null, view: null };
  app.navigate = function (path, o) {
    o = o || {};
    if (path === location.pathname + location.search && !location.hash) { render(); return; }
    history[o.replace ? "replaceState" : "pushState"]({}, "", path);
    drawer.closeAll(true);
    render(true);
  };
  app.query = function () { return new URLSearchParams(location.search); };
  app.setQuery = function (patch) {
    var q = app.query();
    Object.keys(patch).forEach(function (k) { if (patch[k] == null || patch[k] === "") q.delete(k); else q.set(k, patch[k]); });
    var s = q.toString();
    history.replaceState({}, "", location.pathname + (s ? "?" + s : "") + location.hash);
    render();
  };
  function route() {
    var parts = location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    var id = parts[0] || "home";
    if (!VIEWS[id]) id = VIEWS[parts[0]] ? parts[0] : null;
    return { view: id, id: parts[1] ? decodeURIComponent(parts[1]) : null };
  }
  window.addEventListener("popstate", function () { drawer.fromHash(); render(true); });
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a[data-go]");
    if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
    ev.preventDefault();
    app.navigate(a.getAttribute("href"));
  });
  app.link = function (path, text, cls) {
    return h("a", { href: path, "data-go": "", class: cls || null }, text);
  };

  /* ============================================================ Drawer
     The drill-down: every number and document opens here, and whatever it
     points at opens on top, with a trail back. The top of the stack lives in
     the address (#ap/AP-0123), so a link to it can be shared and Back works. */
  var drawer = app.drawer = (function () {
    var stack = [], scrim = null, box = null;
    function hash(ref) { return "#" + ref.kind + "/" + encodeURIComponent(ref.id || "") + (ref.q ? "?" + encodeURIComponent(JSON.stringify(ref.q)) : ""); }
    function parse(hs) {
      var m = /^#([a-z-]+)\/([^?]*)(?:\?(.*))?$/.exec(hs || "");
      if (!m) return null;
      var ref = { kind: m[1], id: decodeURIComponent(m[2]) };
      if (m[3]) try { ref.q = JSON.parse(decodeURIComponent(m[3])); } catch (e) { /* ignore */ }
      return ref;
    }
    function mount() {
      if (box) return;
      scrim = h("div", { class: "scrim", on: { click: function () { closeAll(); } } });
      box = h("aside", { class: "drawer", role: "dialog", "aria-modal": "true", "aria-label": "Details", tabindex: "-1" });
      document.body.appendChild(scrim);
      document.body.appendChild(box);
      requestAnimationFrame(function () { scrim.classList.add("on"); box.classList.add("on"); });
      document.addEventListener("keydown", esc, true);
    }
    function esc(ev) {
      if (ev.key !== "Escape" || document.querySelector(".modal-scrim, .menu")) return;
      ev.stopPropagation();
      if (stack.length > 1) back(); else closeAll();
    }
    function open(ref, o) {
      o = o || {};
      if (o.replace) stack.pop();
      if (o.root) stack = [];
      stack.push(ref);
      history.pushState({ drawer: true }, "", location.pathname + location.search + hash(ref));
      draw();
    }
    function back() { history.back(); }
    function closeAll(silent) {
      if (!box) return;
      stack = [];
      var s = scrim, b = box;
      scrim = box = null;
      document.removeEventListener("keydown", esc, true);
      s.classList.remove("on"); b.classList.remove("on");
      setTimeout(function () { s.remove(); b.remove(); }, 260);
      if (!silent && location.hash) history.pushState({}, "", location.pathname + location.search);
    }
    function fromHash() {
      var ref = parse(location.hash);
      if (!ref) { if (box) closeAll(true); return; }
      var i = stack.findIndex(function (r) { return hash(r) === hash(ref); });
      if (i >= 0) stack = stack.slice(0, i + 1); else stack = [ref];
      draw();
    }
    function draw() {
      if (!stack.length) return closeAll(true);
      mount();
      var ref = stack[stack.length - 1];
      var R = EFM.drill && EFM.drill[ref.kind];
      ui.clear(box);
      var body = h("div", { class: "dr-b" }), foot = h("div", { class: "dr-f" });
      var crumbs = h("nav", { class: "dr-crumbs", "aria-label": "Trail" });
      stack.forEach(function (r, i) {
        var t = (EFM.drill[r.kind] && EFM.drill[r.kind].title) ? EFM.drill[r.kind].title(r) : r.id;
        if (i) crumbs.appendChild(ui.icon("chev", "sm"));
        if (i === stack.length - 1) crumbs.appendChild(h("b", null, t));
        else crumbs.appendChild(h("button", { type: "button", on: { click: function () { history.go(i - (stack.length - 1)); } } }, t));
      });
      box.className = "drawer on" + (R && R.wide ? " wide" : "");
      box.appendChild(h("div", { class: "dr-h" },
        stack.length > 1 ? ui.btn(null, { kind: "ghost", size: "sm", icon: "back", label: "Back", onClick: back }) : null,
        crumbs, h("span", { class: "sp", style: { flex: "1" } }),
        ui.btn(null, { kind: "ghost", size: "sm", icon: "x", label: "Close", onClick: function () { closeAll(); } })));
      box.appendChild(body);
      if (!R) body.appendChild(ui.empty("Not found", "Nothing called " + ref.kind + " " + ref.id + " exists in these books.", "alert"));
      else {
        try { R.render(ref, body, foot); }
        catch (e) { console.error(e); body.appendChild(ui.empty("Could not open this", String(e.message || e), "alert")); }
      }
      if (foot.childNodes.length) box.appendChild(foot);
      box.focus({ preventScroll: true });
    }
    return { open: open, back: back, closeAll: closeAll, fromHash: fromHash, redraw: function () { if (box) draw(); }, isOpen: function () { return !!box; } };
  })();
  app.open = function (ref, o) {
    // Remembered for Home's "Start here": somebody traced a figure to its lines.
    if (ref && ref.kind === "lines") try { localStorage.setItem("efm.traced", "1"); } catch (e) { /* ignore */ }
    drawer.open(ref, o);
  };

  /* ============================================================= Shell */
  var shell = null, mainEl = null, crumbEl = null, railEl = null, bellEl = null, meEl = null;

  function buildShell() {
    document.body.innerHTML = "";
    railEl = h("nav", { class: "rail", "aria-label": "OC EFM" });
    crumbEl = h("div", { class: "crumbs" });
    mainEl = h("main", { class: "page", id: "main", tabindex: "-1" });
    var search = h("button", { type: "button", class: "search", on: { click: function () { palette(); } }, "aria-label": "Search or ask (⌘K)" },
      ui.icon("search"), h("span", null, "Search or ask a question"), h("span", { class: "kbd" }, "⌘K"));
    bellEl = h("button", { type: "button", class: "iconbtn", "aria-label": "Notifications", on: { click: function () { notifications(bellEl); } } }, ui.icon("bell", "lg"));
    meEl = h("button", { type: "button", class: "me", "aria-label": "Your account", on: { click: function () { accountMenu(meEl); } } });
    var top = h("header", { class: "top" }, crumbEl, search,
      h("div", { class: "top-tools" },
        h("span", { class: "sandbox", title: "Sample books for OploCloud Group, as of " + ui.date(app.E.asOf, "full") + ". What you do here stays in this browser." }, h("i"), "Sandbox · " + ui.date(app.E.asOf, "year")),
        bellEl, meEl));
    shell = h("div", { class: "app" }, railEl, h("div", { class: "main" }, top, mainEl));
    document.body.appendChild(h("a", { href: "#main", class: "sr" }, "Skip to content"));
    document.body.appendChild(shell);
  }

  function rail(active) {
    ui.clear(railEl);
    var E = app.E;
    railEl.appendChild(h("a", { href: "/home", "data-go": "", class: "brand" },
      h("span", { class: "brand-mark" }, ui.logo()), h("span", null, h("b", null, "OC EFM"), h("small", null, "Enterprise Financial Management"))));
    var ws = h("button", { type: "button", class: "ws", "aria-label": "Change entity" },
      h("span", { class: "ws-dot" }, app.scope === "GROUP" ? "GR" : app.scope),
      h("span", { class: "grow" }, h("b", { class: "ell" }, app.scopeLabel()), h("small", null, app.scope === "GROUP" ? "Consolidated · USD" : E.entity[app.scope].city + " · " + E.entity[app.scope].currency)),
      ui.icon("updown", "sm"));
    ws.addEventListener("click", function () { scopeMenu(ws); });
    railEl.appendChild(ws);
    var counts = {
      inbox: E.attention().filter(function (a) { return a.sev !== "info"; }).length,
      payables: Object.values(E.apInvoices).filter(function (i) { return i.status === "review" && app.inScope(i.entity); }).length,
      journals: Object.values(E.journals).filter(function (j) { return j.status === "pending" && app.inScope(j.entity); }).length,
      cash: Object.values(E.bankLines).filter(function (l) { return l.status === "unmatched" && app.inScope(E.bankAccounts[l.bank].entity); }).length
    };
    NAV.forEach(function (g) {
      var grp = h("div", { class: "nav-group nav" });
      if (g.label) grp.appendChild(h("div", { class: "nav-label" }, g.label));
      g.items.forEach(function (it) {
        if (!VIEWS[it[0]]) return;
        var a = h("a", { href: "/" + it[0], "data-go": "", "aria-current": active === it[0] ? "page" : null }, ui.icon(it[2]), h("span", { class: "grow ell" }, it[1]));
        if (counts[it[0]]) a.appendChild(h("span", { class: "badge" + (it[0] === "inbox" ? " hot" : "") }, String(counts[it[0]])));
        grp.appendChild(a);
      });
      railEl.appendChild(grp);
    });
    railEl.appendChild(h("div", { class: "rail-foot" },
      h("div", null, "Sample books for OploCloud Group, FY2026, as of " + ui.date(E.asOf, "full") + ". Figures are illustrative, except the Claude Code card charges, which are actual."),
      h("div", { style: { marginTop: "6px" } }, E.log.length ? E.log.length + " change" + (E.log.length === 1 ? "" : "s") + " in this sandbox · " : "",
        h("a", { href: "#", on: { click: function (ev) { ev.preventDefault(); app.reset(); } } }, "Reset"))));
  }

  function topbar(def) {
    ui.clear(crumbEl);
    crumbEl.appendChild(h("span", null, app.scopeLabel()));
    crumbEl.appendChild(h("span", { class: "sep" }, "/"));
    crumbEl.appendChild(h("b", null, def ? def.title : "Not found"));
    var n = app.E.attention().filter(function (a) { return a.sev === "critical" || a.sev === "serious"; }).length;
    ui.clear(bellEl);
    bellEl.appendChild(ui.icon("bell", "lg"));
    if (n) bellEl.appendChild(h("span", { class: "dot" }));
    bellEl.setAttribute("aria-label", "Notifications" + (n ? ", " + n + " need attention" : ""));
    ui.clear(meEl);
    meEl.appendChild(h("span", { class: "avatar", style: { background: app.me.color } }, app.me.initials));
    meEl.appendChild(h("div", null, h("b", null, app.me.firstName || app.me.name), h("small", null, "OploCloud Group")));
    meEl.appendChild(ui.icon("chevd", "sm"));
  }

  function render(fresh) {
    if (!shell) return;
    var r = route();
    var def = r.view && VIEWS[r.view];
    var scrollY = window.scrollY;
    rail(r.view);
    topbar(def);
    ui.clear(mainEl);
    mainEl.className = "page" + (def && def.wide ? " wide" : "") + (fresh ? " arrive" : "");
    if (!def) {
      mainEl.appendChild(ui.empty("There's no page here", "Try the menu on the left, or search with ⌘K.", "search"));
    } else {
      document.title = def.title + " · OC EFM";
      try {
        var out = def.render({ E: app.E, app: app, ui: ui, id: r.id, query: app.query(), scope: app.scope, role: app.role });
        if (out) mainEl.appendChild(out);
      } catch (e) {
        console.error(e);
        mainEl.appendChild(ui.empty("This screen hit an error", String(e.message || e), "alert"));
      }
    }
    if (fresh) { window.scrollTo(0, 0); } else window.scrollTo(0, scrollY);
    drawer.redraw();
    if (fresh && r.id && def && def.openId) def.openId(r.id);
  }
  app.refresh = render;

  /* ------------------------------------------------------------ Menus */
  function scopeMenu(anchor) {
    var E = app.E;
    var items = [{ heading: true, label: "Report on" },
      { label: "OploCloud Group", sub: "Consolidated in USD · eliminations applied", icon: "layers", checked: app.scope === "GROUP", fn: function () { app.setScope("GROUP"); } }, "-",
      { heading: true, label: "Legal entities" }];
    E.entities.forEach(function (e) {
      items.push({ label: e.name, sub: e.city + " · " + e.currency + " · " + E.periodLabel(E.lastClosedPeriod(e.id)) + " closed", icon: "globe", checked: app.scope === e.id, fn: function () { app.setScope(e.id); } });
    });
    ui.menu(anchor, items, { width: 300, alignLeft: true });
  }
  function accountMenu(anchor) {
    ui.menu(anchor, [
      { heading: true, label: app.me.name },
      { label: app.me.email || app.me.name, sub: "Signed in with your Oplo Account", icon: "user", fn: function () { window.open("https://auth.oplocloud.com/", "_blank", "noopener"); } },
      "-",
      { label: "Reset sandbox", sub: "Undo everything you've done here", icon: "refresh", fn: app.reset },
      { label: "Sign out", icon: "back", fn: signOut }
    ], { width: 300 });
  }
  function notifications(anchor) {
    var list = app.E.attention().slice(0, 8);
    var items = [{ heading: true, label: list.length ? "Needs attention" : "Nothing needs attention right now" }];
    list.forEach(function (a) {
      items.push({ label: a.title, sub: a.detail, avatar: ui.sev(a.sev), fn: function () { app.navigate(a.action.go); } });
    });
    items.push("-");
    items.push({ label: "Open Inbox", icon: "inbox", fn: function () { app.navigate("/inbox"); } });
    ui.menu(anchor, items, { width: 400 });
  }

  /* ========================================================= Palette
     Search everything, go anywhere, or ask. Answers are computed from the
     posted ledger by the same queries the screens use — nothing here is
     generated, and each answer says where it came from. */
  function palette() {
    if (document.querySelector(".pal")) return;
    var E = app.E;
    var input = h("input", { type: "text", placeholder: "Search accounts, vendors, invoices, journals — or ask “why did marketing go up?”", "aria-label": "Search or ask", autocomplete: "off", spellcheck: "false" });
    var res = h("div", { class: "pal-res", role: "listbox" });
    var body = h("div", null, h("div", { class: "pal-in" }, ui.icon("search", "lg"), input), res,
      h("div", { class: "pal-foot" }, h("span", null, "↑↓ to move"), h("span", null, "↵ to open"), h("span", null, "esc to close"), h("span", { class: "sp" }), h("span", null, "Answers are computed from posted ledger lines")));
    var m = ui.modal({ body: body, cls: "pal", title: null });
    m.box.classList.add("pal");
    m.box.querySelector(".modal-b").style.padding = "0";
    var items = [], sel = 0;

    function pages() {
      return ORDER.filter(function (id) { return VIEWS[id].title; }).map(function (id) {
        return { g: "Go to", label: VIEWS[id].title, icon: VIEWS[id].icon || "arrow", fn: function () { app.navigate("/" + id); } };
      });
    }
    function actions() {
      return [
        { g: "Do", label: "New journal", icon: "plus", fn: function () { app.navigate("/journals?new=1"); } },
        { g: "Do", label: "Reconcile JPMorgan operating account", icon: "bank", fn: function () { app.navigate("/cash/us-op"); } },
        { g: "Do", label: "Review invoices awaiting approval", icon: "payables", fn: function () { app.navigate("/payables?status=review"); } },
        { g: "Do", label: "Open the September close", icon: "close", fn: function () { app.navigate("/close"); } },
        { g: "Do", label: "Income statement", icon: "report", fn: function () { app.navigate("/reports?r=is"); } },
        { g: "Do", label: "Balance sheet", icon: "report", fn: function () { app.navigate("/reports?r=bs"); } },
        { g: "Do", label: "Verify the audit trail", icon: "shield", fn: function () { app.navigate("/audit"); } }
      ];
    }
    function search(q) {
      var out = [], ql = q.toLowerCase();
      function hit(s) { return s && String(s).toLowerCase().indexOf(ql) >= 0; }
      E.accountList.forEach(function (a) { if (hit(a.id) || hit(a.name)) out.push({ g: "Accounts", label: a.id + " " + a.name, sub: a.type, icon: "book", fn: function () { app.open({ kind: "account", id: a.id }); } }); });
      Object.values(E.vendors).forEach(function (v) { if (hit(v.name)) out.push({ g: "Vendors", label: v.name, sub: E.entity[v.entity].short + " · " + v.category, icon: "payables", fn: function () { app.open({ kind: "vendor", id: v.id }); } }); });
      Object.values(E.customers).forEach(function (c) { if (hit(c.name)) out.push({ g: "Customers", label: c.name, sub: E.entity[c.entity].short + " · " + c.segment, icon: "receivables", fn: function () { app.open({ kind: "customer", id: c.id }); } }); });
      Object.values(E.apInvoices).forEach(function (i) { if (hit(i.number) || hit(i.id)) out.push({ g: "Vendor invoices", label: i.number + " · " + E.vendors[i.vendor].name, sub: E.fmt(i.amount, i.currency), icon: "doc", fn: function () { app.open({ kind: "ap", id: i.id }); } }); });
      Object.values(E.arInvoices).forEach(function (i) { if (hit(i.number)) out.push({ g: "Customer invoices", label: i.number + " · " + E.customers[i.customer].name, sub: E.fmt(i.amount, E.entity[i.entity].currency), icon: "doc", fn: function () { app.open({ kind: "ar", id: i.id }); } }); });
      if (/^je/i.test(q) || /\d{3,}/.test(q)) E.journalOrder.forEach(function (id) { if (hit(id)) out.push({ g: "Journals", label: id + " · " + E.journals[id].memo, sub: E.journals[id].status, icon: "journal", fn: function () { app.open({ kind: "journal", id: id }); } }); });
      if (/^chg/i.test(q)) E.cardChargeList().forEach(function (x) { if (hit(x.id)) out.push({ g: "Card charges", label: x.id + " · " + E.vendors[x.vendor].name, sub: ui.date(x.date, "year") + " · " + E.fmt(x.amount, "USD"), icon: "card", fn: function () { app.open({ kind: "card", id: x.id }); } }); });
      Object.values(E.assets).forEach(function (a) { if (hit(a.name) || hit(a.id)) out.push({ g: "Assets", label: a.id + " · " + a.name, icon: "box", fn: function () { app.open({ kind: "asset", id: a.id }); } }); });
      return out.slice(0, 40);
    }
    function draw() {
      var q = input.value.trim();
      ui.clear(res);
      items = [];
      var ans = q ? EFM.answer(q) : null;
      if (ans) {
        res.appendChild(ans.node);
        if (ans.go) items.push({ g: "Answer", label: ans.goLabel || "Show the transactions", icon: "arrow", fn: ans.go });
      }
      if (!q) items = items.concat(actions(), pages());
      else {
        items = items.concat(search(q));
        pages().concat(actions()).forEach(function (p) { if (p.label.toLowerCase().indexOf(q.toLowerCase()) >= 0) items.push(p); });
      }
      var lastG = null;
      items.forEach(function (it, i) {
        if (it.g !== lastG) { res.appendChild(h("div", { class: "pal-g" }, it.g)); lastG = it.g; }
        var b = h("button", { type: "button", class: "pal-i", role: "option", "aria-selected": String(i === sel), on: { click: function () { go(i); }, mousemove: function () { if (sel !== i) { sel = i; mark(); } } } },
          ui.icon(it.icon), h("span", { class: "ell" }, it.label), it.sub ? h("small", null, it.sub) : null);
        it.el = b;
        res.appendChild(b);
      });
      if (!items.length && !ans) res.appendChild(h("div", { class: "empty" }, h("b", null, "Nothing matches “" + q + "”"), "Try a vendor, an invoice number, an account, or a question like “cash runway”."));
    }
    function mark() { items.forEach(function (it, i) { it.el.setAttribute("aria-selected", String(i === sel)); }); if (items[sel]) items[sel].el.scrollIntoView({ block: "nearest" }); }
    function go(i) { var it = items[i]; if (!it) return; m.close(); it.fn(); }
    input.addEventListener("input", function () { sel = 0; draw(); });
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowDown") { ev.preventDefault(); sel = Math.min(items.length - 1, sel + 1); mark(); }
      if (ev.key === "ArrowUp") { ev.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
      if (ev.key === "Enter") { ev.preventDefault(); go(sel); }
    });
    draw();
    setTimeout(function () { input.focus(); }, 20);
  }
  app.palette = palette;
  document.addEventListener("keydown", function (ev) {
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") { ev.preventDefault(); if (shell) palette(); }
    if (ev.key === "/" && shell && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.querySelector(".modal-scrim")) { ev.preventDefault(); palette(); }
  });

  /* Questions the ledger can answer. Each is a query, not a guess. */
  EFM.answer = function (q) {
    var E = app.E, ql = q.toLowerCase(), L = E.lastClosedPeriod(), prev = E.addMonths(L, -1);
    var scope = app.scope, cur = app.scopeCurrency();
    function card(title, lines, src, extra) {
      return h("div", { class: "answer" }, h("h4", null, ui.icon("sparkle", "sm"), title), extra || null,
        lines.length ? h("ul", null, lines.map(function (l) { return h("li", null, h("span", null, l[0]), h("b", null, l[1])); })) : null,
        h("div", { class: "src" }, src));
    }
    var dept = E.dims.dept.filter(function (d) { return ql.indexOf(d.name.toLowerCase().split(" ")[0]) >= 0 || ql.indexOf(d.id.toLowerCase() + " ") >= 0; })[0];
    if (dept && /why|increase|up|rise|change|spend|over/.test(ql)) {
      var exp = E.accountList.filter(function (a) { return a.type === "expense" && !a.ic && a.group !== "other" && a.group !== "tax"; }).map(function (a) { return a.id; });
      var a = E.actualFor(scope, dept.id, exp, prev, prev), b = E.actualFor(scope, dept.id, exp, L, L);
      var d = E.drivers(scope, exp, dept.id, prev, prev, L, L).slice(0, 5);
      return { node: card(dept.name + " spend, " + E.periodLabel(prev) + " → " + E.periodLabel(L) + ": " + E.fmt(a, cur, { compact: true }) + " → " + E.fmt(b, cur, { compact: true }) + " (" + (a ? ((b - a) / Math.abs(a) * 100).toFixed(1) : "—") + "%)",
        d.map(function (x) { return [x.name, (x.change > 0 ? "+" : "") + E.fmt(x.change, cur, { compact: true, minus: true })]; }),
        "Posted lines on expense accounts charged to " + dept.name + ", " + app.scopeLabel() + ". Largest changes by vendor."),
        go: function () { app.navigate("/budgets?dept=" + dept.id); }, goLabel: "Open " + dept.name + " in Budgets" };
    }
    if (/cash|runway|liquid/.test(ql)) {
      var pos = E.cashPosition(), fc = E.cashForecast(13);
      var low = fc.reduce(function (m, w) { return w.close < m.close ? w : m; }, fc[0]);
      return { node: card("Cash today: " + E.fmt(pos.total, "USD", { compact: true }) + " across " + pos.rows.length + " accounts",
        [["Lowest point in the next 13 weeks", E.fmt(low.close, "USD", { compact: true }) + " · week of " + ui.date(low.start)],
         ["In 13 weeks", E.fmt(fc[fc.length - 1].close, "USD", { compact: true })]].concat(pos.rows.map(function (r) { return [r.bank.bankName + " " + r.bank.name + " (" + r.bank.entity + ")", E.fmt(r.usd, "USD", { compact: true })]; })),
        "Bank balances as of today at month-end rates; forecast from open receivables, payables, payroll and recurring flows."),
        go: function () { app.navigate("/cash"); }, goLabel: "Open Cash & banking" };
    }
    if (/owe|overdue|late|collect|receivable|dso/.test(ql)) {
      var open = E.arOpen(scope).filter(function (i) { return i.due < E.asOf; }).sort(function (x, y) { return E.usdOf(y.entity, y.balance, L) - E.usdOf(x.entity, x.balance, L); }).slice(0, 6);
      return { node: card("Past due: " + E.arOpen(scope).filter(function (i) { return i.due < E.asOf; }).length + " invoices · DSO " + E.dso(scope === "GROUP" ? "GROUP" : scope) + " days",
        open.map(function (i) { return [E.customers[i.customer].name + " · " + i.number + " · " + E.daysBetween(i.due, E.asOf) + " days late", E.fmt(i.balance, E.entity[i.entity].currency)]; }),
        "Open customer invoices past their due date, largest first."), go: function () { app.navigate("/receivables"); }, goLabel: "Open Receivables" };
    }
    if (/vendor|supplier|spend|biggest|top/.test(ql)) {
      var by = {};
      E.linesWhere({ entity: scope, from: E.fy + "-01", to: E.currentPeriod(), accounts: E.accountList.filter(function (a) { return a.type === "expense"; }).map(function (a) { return a.id; }) })
        .forEach(function (l) { if (l.dims.vendor) by[l.dims.vendor] = (by[l.dims.vendor] || 0) + (scope === "GROUP" ? E.usdOf(l.entity, l.amt, l.period) : l.amt); });
      var top = Object.keys(by).sort(function (x, y) { return by[y] - by[x]; }).slice(0, 6);
      return { node: card("Largest vendors this year, " + app.scopeLabel(), top.map(function (v) { return [E.vendors[v].name, E.fmt(by[v], cur, { compact: true })]; }), "Expense lines tagged with a vendor, January to date."),
        go: function () { app.navigate("/payables"); }, goLabel: "Open Payables" };
    }
    if (/revenue|sales|income|profit|margin/.test(ql)) {
      var is1 = E.layout("is", E.measure(scope, L, L, { usd: scope === "GROUP" }), { group: scope === "GROUP", hideIC: scope === "GROUP" });
      var is0 = E.layout("is", E.measure(scope, prev, prev, { usd: scope === "GROUP" }), { group: scope === "GROUP", hideIC: scope === "GROUP" });
      function v(rows, id) { return rows.filter(function (r) { return r.id === id; })[0].value; }
      return { node: card(E.periodLabel(L, true) + " (closed), " + app.scopeLabel(),
        [["Revenue", E.fmt(v(is1, "revT"), cur, { compact: true }) + " (" + E.periodLabel(prev) + " " + E.fmt(v(is0, "revT"), cur, { compact: true }) + ")"],
         ["Gross margin", ui.pct(v(is1, "gm"), 1)], ["Operating income", E.fmt(v(is1, "oi"), cur, { compact: true }) + " · " + ui.pct(v(is1, "om"), 1)],
         ["Net income", E.fmt(v(is1, "ni"), cur, { compact: true })]], "The income statement for the last closed month."),
        go: function () { app.navigate("/reports?r=is"); }, goLabel: "Open the income statement" };
    }
    return null;
  };

  /* ============================================================= Auth */
  function devAccount() {
    // Development only: a stand-in account so the shell can be exercised
    // without the API. Never used on a real host.
    if (!LOCAL) return null;
    var q = new URLSearchParams(location.search);
    if (q.get("dev") === "1") try { localStorage.setItem("efm.dev", "1"); } catch (e) { /* ignore */ }
    var on = false;
    try { on = localStorage.getItem("efm.dev") === "1"; } catch (e) { /* ignore */ }
    return on ? { id: "dev", dev: true, email: "dev@localhost", name: "Dev Tester", firstName: "Dev", initials: "DT", hue: 210 } : null;
  }
  function me() {
    var dev = devAccount();
    if (dev) return Promise.resolve(dev);
    return fetch(API + "/api/v1/me", { credentials: "include", headers: { accept: "application/json" } })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) { var e = new Error("signed out"); e.code = "signed-out"; throw e; }
        if (!r.ok) { var e2 = new Error("HTTP " + r.status); e2.code = "error"; throw e2; }
        return r.json();
      }, function () { var e = new Error("offline"); e.code = "offline"; throw e; })
      .then(function (b) { return b.account; });
  }
  function signOut() {
    try { localStorage.removeItem("efm.dev"); } catch (e) { /* ignore */ }
    fetch(API + "/api/v1/auth/logout", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: "{}" })
      .catch(function () {}).then(function () { location.href = "/home"; });
  }
  function signIn(errEl) {
    var S = window.OploSignIn;
    if (!S) { errEl.textContent = "Can't reach auth.oplocloud.com. Check your connection and reload."; return; }
    S.open({ verify: function () { return me().then(function () { return true; }, function () { return false; }); } });
  }

  /* Who may use OC EFM: an account it has been assigned to (the `efm` product),
     or a platform administrator. This is the courtesy half — the API enforces
     it again on the data (efm.read), which is the half that is a control. */
  function hasAccess(account) {
    return (account.roles || []).some(function (r) { return r.product === "efm" || (r.product === "platform" && r.role === "admin"); });
  }

  /* The actual data, from the API. Absent is fine (the books are then the
     sample alone); refused is not, and neither is not being able to ask. */
  function loadData(account) {
    var name = "claude-code-invoices";
    EFM.data.claudeCode = null;
    if (account.dev) {          // local development only: a test supplies the dataset
      var d = window.__EFM_DATASETS && window.__EFM_DATASETS[name];
      EFM.data.claudeCode = d || null;
      return Promise.resolve();
    }
    function fail(code, msg) { var e = new Error(msg); e.code = code; return e; }
    return fetch(API + "/api/v1/efm/datasets/" + name, { credentials: "include", headers: { accept: "application/json" } })
      .then(function (r) {
        if (r.status === 401) throw fail("signed-out", "signed out");
        if (r.status === 403) throw fail("forbidden", "no access");
        if (r.status === 404) return null;
        if (!r.ok) throw fail("error", "HTTP " + r.status);
        return r.json();
      }, function () { throw fail("offline", "offline"); })
      .then(function (b) {
        var d = b && b.dataset && b.dataset.data;
        if (d && !(d.vendor && d.vendor.id && Array.isArray(d.invoices))) throw fail("error", "unreadable dataset");
        EFM.data.claudeCode = d || null;
      });
  }

  function plain(title, lede, extra, actions) {
    document.title = "OC EFM";
    document.body.innerHTML = "";
    document.body.appendChild(h("div", { class: "gate", style: { gridTemplateColumns: "1fr" } },
      h("main", { class: "gate-l", style: { maxWidth: "640px", margin: "0 auto" } },
        h("span", { class: "brand" }, h("span", { class: "brand-mark" }, ui.logo()), h("span", null, h("b", null, "OC EFM"), h("small", null, "OploCloud Enterprise Financial Management"))),
        h("h1", null, title), h("p", { class: "lede" }, lede), extra || null, h("div", { class: "go" }, actions))));
  }
  function noAccess(account) {
    if (window.OploSignIn) window.OploSignIn.done();
    plain("OC EFM isn't assigned to you.", "You're signed in as " + (account.email || account.name) + ". OC EFM is given to people by an administrator, so ask one to assign it to you — or sign out and use an account that has it.", null,
      [ui.btn("Sign out", { kind: "primary", size: "lg", onClick: signOut })]);
  }
  function dataError(e) {
    if (window.OploSignIn) window.OploSignIn.done();
    plain("OC EFM can't load its data.", e && e.code === "offline" ? "Check your connection, then try again." : "Something went wrong on our side. Try again in a moment.", null,
      [ui.btn("Try again", { kind: "primary", size: "lg", onClick: function () { location.reload(); } })]);
  }

  function gate(err) {
    document.title = "OC EFM · OploCloud Enterprise Financial Management";
    document.body.innerHTML = "";
    var errEl = h("div", { class: "err", role: "alert" }, err || "");
    var go = ui.btn("Sign in with Oplo Account", { kind: "primary", size: "lg", onClick: function () { signIn(errEl); } });
    var layers = [
      ["What happened?", "Orders, invoices, payments, purchases, payroll and assets — captured once, at the source."],
      ["How is it accounted for?", "Rules turn every event into balanced journals in one ledger. Posted means permanent; corrections reverse."],
      ["Is it right?", "Approvals with separation of duties, reconciliations, a close checklist, and a hash-chained audit trail."],
      ["What should we know?", "Statements, budgets, forecasts and consolidation — every number clickable back to the document behind it."]
    ];
    document.body.appendChild(h("div", { class: "gate" },
      h("main", { class: "gate-l" },
        h("span", { class: "brand" }, h("span", { class: "brand-mark" }, ui.logo()), h("span", null, h("b", null, "OC EFM"), h("small", null, "OploCloud Enterprise Financial Management"))),
        h("h1", null, "The financial operating system ", h("span", null, "for OploCloud.")),
        h("p", { class: "lede" }, "One double-entry ledger under everything. Payables, receivables, cash, assets, budgets, the close and consolidation on top of it — and every figure traceable to the transaction that made it."),
        h("div", { class: "go" }, go, h("span", { class: "muted", style: { fontSize: "13px" } }, "Opens auth.oplocloud.com in a new tab.")),
        errEl,
        h("p", { class: "fine" }, "After you sign in you'll be working in a sandbox: nine months of sample books for OploCloud Group — three entities, three currencies — with a September close waiting. Figures are illustrative — apart from OploCloud's actual Claude Code card charges — and what you do stays in this browser.")),
      h("aside", { class: "gate-r", "aria-label": "How OC EFM is built" },
        layers.map(function (l, i) { return h("div", { class: "layer" }, h("span", { class: "n" }, String(i + 1)), h("div", null, h("b", null, l[0]), h("p", null, l[1]))); }),
        h("div", { class: "flow" }, h("b", null, "transaction"), " → approval → ", h("b", null, "journal"), " → ledger → reconciliation → ", h("b", null, "statement"), " → audit trail"))));
    setTimeout(function () { go.focus(); }, 60);
  }

  /* ============================================================= Boot */
  function start(account) {
    app.account = account;
    var name = account.name || account.email || "You";
    var hue = account.hue != null ? account.hue : 215;
    app.me = { id: "me", name: name, firstName: account.firstName || name.split(" ")[0], email: account.email, initials: account.initials || name.split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase(),
      color: "hsl(" + hue + " 55% 45%)" };
    var E = app.E = EFM.create();
    var skipped = 0;
    var saved = load();
    if (saved) {
      if (saved.scope && (saved.scope === "GROUP" || E.entity[saved.scope])) app.scope = saved.scope;
      if (saved.log && saved.log.length) {
        var r = E.replay(saved.log);
        if (r.failed.length) { skipped = r.failed.length; console.warn("Sandbox replay skipped", r.failed.length, "commands", r.failed); }
      }
    }
    E.me = app.actor();
    E.on(function () { E.me = app.actor(); });
    buildShell();
    if (location.pathname === "/" || location.pathname === "") history.replaceState({}, "", "/home" + location.search + location.hash);
    render(true);
    if (location.hash) drawer.fromHash();
    // The books can be updated under a saved sandbox; say so if that cost it anything.
    if (skipped) ui.toast(skipped + " of your earlier changes no longer apply", { sub: "The sample books were updated since you made them. Reset the sandbox from the account menu to start clean.", err: true });
    if (window.OploSignIn) window.OploSignIn.done();
    var boot = document.getElementById("boot");
    if (boot) { boot.style.opacity = "0"; setTimeout(function () { boot.remove(); }, 320); }
  }

  EFM.boot = function () {
    me().then(function (account) {
      if (!account.dev && !hasAccess(account)) return noAccess(account);
      return loadData(account).then(function () { start(account); }, function (e) {
        if (e.code === "forbidden") noAccess(account);
        else if (e.code === "signed-out") { if (window.OploSignIn) window.OploSignIn.done(); gate(); }
        else dataError(e);
      });
    }, function (e) {
      if (window.OploSignIn) window.OploSignIn.done();
      if (e.code === "offline") gate("Can't reach the Oplo Account service right now. Check your connection, then sign in.");
      else gate();
    });
  };
})(window);
