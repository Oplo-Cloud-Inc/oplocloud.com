/* ==========================================================================
   The shell — rail, top bar and module tabs around whatever page is open.

       ┌───────────────────────────────────────────────────────────┐
       │ top bar: school · view  ·  search  ·  year · bell · language · you │
       ├────────┬──────────────────────────────────────────────────┤
       │ rail   │ the page's path back up, then its tabs             │
       │ 240 /  │ the page                                           │
       │ 64 px  │                                                    │
       │ items  │                                                    │
       └────────┴──────────────────────────────────────────────────┘

   The top bar is fixed across the whole window on every staff screen: who the school is and
   which view this is (Admin, Teacher, Family — one click each, so there is always a way back),
   the search, and the bell, the language and the account. It also runs on its own over an old
   console that has no frame (the teacher's), with OL.shell.openBar.

   It does not know what a student or a register is. It is told, by the console
   that hosts it (app.js hands it a context), who is signed in, which old pages
   they may open, and how to open one; it draws the menu from the route table
   (routes.js), keeps the address and the breadcrumb in step with the page, and
   hosts the search palette. A rebuilt screen is drawn into the same host an old
   one is, so a screen can be replaced without the frame moving.

   The rail is an accordion: the module you are in is open and shows its tabs, the
   rest are closed. Items a person cannot use are not drawn (hidden, not greyed);
   a module that is not built is behind a flag in routes.js. The rail's width,
   the theme and the year are remembered on this device.

   OL.shell.open(ctx) → the element the page is drawn into
   OL.shell.go(path) · .path(k) · .keyFor(rest) · .route() · .setRecord({ label, … })
   OL.shell.openBar(ctx) · .unmount() · .mounted() · .barOnly() · .year() · .onYear(fn)
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var S = OL.shell = OL.shell || {};

  var st = { mounted: false, barOnly: false, ctx: null, rail: null, top: null, head: null, host: null, pending: null, route: null, record: null,
             visible: [], timer: null, unread: null, years: [], yearListeners: [], bound: false };
  var KEYS = { rail: "oplo.shell.rail", year: "oplo.shell.year", theme: "oplo.shell.theme", lang: "oplo.shell.lang", recent: "oplo.shell.recent" };

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(KEYS[k]); if (v === null) localStorage.removeItem(KEYS[k]); else localStorage.setItem(KEYS[k], v); }
    catch (e) { /* private mode: the choice lasts until the page closes */ }
    return null;
  }

  /* ------------------------------------------------------------- Labels */
  var label = {
    module: function (m) { return t("nav." + m); },
    tab: function (m, k) { return t("tab." + m + "." + k); },
    sub: function (m, k, s) { return t("sub." + m + "." + k + "." + s); }
  };

  /* ------------------------------------------------------------- Routing */
  function allowed(k) { return st.ctx ? st.ctx.allowed(k) : false; }
  function href(path) { return (st.ctx ? st.ctx.base : "") + String(path).split("/").filter(Boolean).map(encodeURIComponent).join("/"); }

  /* Open the page an address names. `path` is "students/directory/stu_123?x=1" (no base). */
  function go(path, opts) {
    var p = OL.routes.parse(path, allowed);
    if (!p.module) return false;
    if (!p.tab) {
      var fr = OL.routes.front(p.module, allowed, st.ctx && st.ctx.prefer ? st.ctx.prefer(p.module) : null);
      if (!fr) return false;
      p.tab = fr.tab; p.sub = p.sub || fr.sub; p.legacy = OL.routes.legacyOf(p.module, p.tab, p.sub, allowed);
    }
    if (!p.legacy) return false;
    st.pending = p;
    st.ctx.open(p.legacy, p, opts || {});
    return true;
  }

  /* app.js asks these two when it builds and reads addresses, so the old and new schemes meet in one place. */
  function pathFor(k) {
    if (st.pending && st.pending.legacy === k) {
      var base = OL.routes.pathOf(st.pending, allowed);
      return base + (st.pending.query ? "?" + st.pending.query : "");
    }
    return OL.routes.pathForLegacy(k, allowed);
  }
  function keyFor(rest) {
    if (!st.ctx) return null;
    var p = OL.routes.parse(rest, allowed);
    if (!p.module) return null;
    if (!p.tab) {
      var fr = OL.routes.front(p.module, allowed);
      if (!fr) return null;
      p.tab = fr.tab; p.sub = fr.sub; p.legacy = OL.routes.legacyOf(p.module, p.tab, p.sub, allowed);
    }
    if (!p.legacy) return null;
    st.pending = p;
    return p.legacy;
  }

  function routeFor(k) {
    var p = st.pending && st.pending.legacy === k ? st.pending : null;
    if (p) return p;
    // Back, Forward and a refresh arrive with the address already set: it names the record and the filters
    if (st.ctx.rest) { var a = OL.routes.parse(st.ctx.rest() + location.search, allowed); if (a.legacy === k) return a; }
    var at = OL.routes.locate(k);
    return at ? { module: at.module, tab: at.tab, sub: at.sub, record: null, recordTab: null, query: "", legacy: k } : null;
  }

  /* ---------------------------------------------------------- Appearance */
  function theme() { return store("theme") || (st.ctx && st.ctx.appearance ? st.ctx.appearance() : "light"); }
  function applyTheme(v) {
    document.documentElement.setAttribute("data-theme", v);
    if (st.ctx && st.ctx.setAppearance) st.ctx.setAppearance(v === "hc" ? "light" : v);
  }

  /* ---------------------------------------------------------------- Rail */
  function narrow() { return window.matchMedia && window.matchMedia("(max-width: 1023px)").matches; }
  function isMin() { return store("rail") === "min" || (narrow() && store("rail") !== "open"); }

  /* The rail folds to icons and back. The button that does it is in the top bar, at its left end. */
  function toggleRail() { store("rail", isMin() ? "open" : "min"); drawRail(); drawTop(); }

  function drawRail() {
    var rail = st.rail, min = isMin(), c = st.ctx, here = st.route;
    document.body.classList.toggle("ol-rail-min", min);
    rail.className = OL.cx("ol-rail ol-app", min && "is-min");
    rail.setAttribute("aria-label", t("shell.menu"));
    OL.clear(rail);

    function item(m) {
      var on = !!here && here.module === m.key, front = OL.routes.front(m.key, allowed, c.prefer ? c.prefer(m.key) : null);
      var path = front ? OL.routes.pathOf(front, allowed) : m.key;
      var a = h("a", { class: OL.cx("ol-rail__item", on && "is-on"), href: href(path), "data-module": m.key, "aria-current": on && (m.solo || m.tabs.length < 2 || !here.tab) ? "page" : null,
        "aria-expanded": !m.solo && m.tabs.length > 1 && !min ? (on ? "true" : "false") : null, "data-tip": min ? label.module(m.key) : null, "aria-label": min ? label.module(m.key) : null,
        on: { click: function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); go(path); } } },
        OL.icon(m.icon, 20), h("span", { class: "ol-rail__label", text: label.module(m.key) }),
        !m.solo && m.tabs.length > 1 && !min ? OL.icon(on ? "chevron-down" : "chevron-right", 16) : null);
      var li = h("li", { class: "ol-rail__li" }, a);
      if (on && !min && !m.solo && m.tabs.length > 1) {
        var ul = h("ul", { class: "ol-rail__tabs", "aria-label": label.module(m.key) });
        m.tabs.forEach(function (tb) {
          var path2 = OL.routes.pathOf({ module: m.key, tab: tb.key, sub: tb.subs.length ? tb.subs[0].key : null }, allowed), here2 = here.tab === tb.key;
          ul.appendChild(h("li", null, h("a", { class: OL.cx("ol-rail__tab", here2 && "is-on"), href: href(path2), "aria-current": here2 ? "page" : null,
            on: { click: function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); go(path2); } } }, label.tab(m.key, tb.key))));
        });
        li.appendChild(ul);
      }
      return li;
    }

    var nav = h("nav", { class: "ol-rail__nav", "aria-label": t("shell.menu") });
    var list = h("ul", { class: "ol-rail__list" });
    st.visible.filter(function (m) { return !m.foot; }).forEach(function (m) { list.appendChild(item(m)); });
    nav.appendChild(list);
    rail.appendChild(nav);
    var foot = st.visible.filter(function (m) { return m.foot; });
    if (foot.length) rail.appendChild(h("div", { class: "ol-rail__foot" }, h("ul", { class: "ol-rail__list" }, foot.map(item))));
  }

  /* ------------------------------------------------------------- Top bar */
  function crumbs() {
    var r = st.route, c = st.ctx;
    if (!r) return [{ label: c.sectionName() }];
    var m = OL.routes.module(r.module), out = [], solo = m.solo;
    var mod = OL.routes.front(r.module, allowed, c.prefer ? c.prefer(r.module) : null);
    out.push({ label: label.module(r.module), href: href(OL.routes.pathOf(mod || { module: r.module }, allowed)), onClick: function () { go(OL.routes.pathOf(mod || { module: r.module }, allowed)); } });
    if (!solo && !m.flat) {
      var tp = OL.routes.pathOf({ module: r.module, tab: r.tab }, allowed);
      out.push({ label: label.tab(r.module, r.tab), href: href(tp), onClick: function () { go(tp); } });
    } else if (m.flat) { out.length = 0; out.push({ label: label.module(r.module), href: href(OL.routes.pathOf({ module: r.module, tab: r.tab }, allowed)), onClick: function () { go(OL.routes.pathOf({ module: r.module, tab: r.tab }, allowed)); } }, { label: label.tab(r.module, r.tab) }); }
    var tabDef = m.tabs.filter(function (x) { return x.key === r.tab; })[0];
    if (r.sub && tabDef && tabDef.subs) {
      var live = tabDef.subs.filter(function (s) { return allowed(s.legacy[0]) || s.legacy.some(allowed); });
      if (live.length > 1) out.push({ label: label.sub(r.module, r.tab, r.sub) });
    }
    if (st.record) out.push({ label: st.record.label });
    return out;
  }

  function yearText(v) { var m = /^(\d{4})\D+(\d{2,4})$/.exec(String(v || "")); return m ? m[1] + "–" + m[2].slice(-2) : String(v || ""); }

  /* The left end: the button that folds the rail, who the school is, and which view this is. */
  function drawLeft() {
    var c = st.ctx, left = h("div", { class: "ol-top__left" });
    if (!st.barOnly) {
      var min = isMin();
      var tg = OL.ui.button.render({ iconOnly: true, icon: "panel-left", variant: "ghost", ariaLabel: min ? t("shell.expand_menu") : t("shell.collapse_menu"), onClick: toggleRail });
      tg.setAttribute("aria-expanded", min ? "false" : "true");
      left.appendChild(tg);
    }
    left.appendChild(h("span", { class: "ol-top__school", title: c.schoolName },
      h("span", { class: "ol-top__mark", "aria-hidden": "true" }, OL.icon("school", 18)), h("b", { text: c.schoolName })));
    var vs = viewSwitch();
    if (vs) left.appendChild(vs);
    return left;
  }

  /* Admin, Teacher, Family: one click each, on every staff screen, so there is always a way back. A person who has only one view
     is not shown a switch. Beside the open rail it is three buttons; where there is no room it is one that opens the list. */
  function viewSwitch() {
    var c = st.ctx, views = c.views ? c.views() : [], cur = c.view ? c.view() : null;
    if (views.length < 2) return null;
    var wide = h("nav", { class: "ol-views", "aria-label": t("shell.views") }, views.map(function (v) {
      var on = v.mode === cur;
      return h("a", { class: OL.cx("ol-views__item", on && "is-on"), href: v.href, "aria-current": on ? "page" : null,
        on: { click: function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); if (!on) c.openView(v.mode); } } }, t("shell.view." + v.mode));
    }));
    var now = views.filter(function (v) { return v.mode === cur; })[0];
    var narrow = h("button", { type: "button", class: "ol-views-menu", "aria-haspopup": "menu", "aria-expanded": "false", "aria-label": t("shell.view_switch") },
      h("span", { text: t("shell.view." + (now ? now.mode : views[0].mode)) }), OL.icon("chevron-down", 16));
    narrow.addEventListener("click", function () {
      OL.ui.menu.open({ anchor: narrow, items: views.map(function (v) {
        return { label: t("shell.view." + v.mode), radio: true, checked: v.mode === cur, onClick: function () { if (v.mode !== cur) c.openView(v.mode); } };
      }) });
    });
    return h("div", { class: "ol-top__views" }, wide, narrow);
  }

  /* English and Hindi, both always on show: choosing is one click and nothing is in a menu. */
  function langToggle() {
    var cur = OL.i18n.locale();
    return h("div", { class: "ol-lang", role: "group", "aria-label": t("shell.language") }, OL.i18n.languages.map(function (l) {
      var on = l.code === cur;
      return h("button", { type: "button", class: OL.cx("ol-lang__item", on && "is-on"), "aria-pressed": on ? "true" : "false", lang: l.code.slice(0, 2),
        on: { click: function () { if (!on) setLang(l.code); } } }, l.short || l.name);
    }));
  }

  function drawTop() {
    var c = st.ctx, bar = st.top;
    bar.setAttribute("aria-label", t("shell.top"));
    OL.clear(bar);

    bar.appendChild(drawLeft());

    var mac = /Mac|iP(hone|ad)/.test(navigator.platform);
    var search = h("button", { type: "button", class: "ol-search", "aria-haspopup": "dialog", "aria-keyshortcuts": "Control+K Meta+K", "aria-label": t("search.label"), on: { click: function (e) { openPalette(e.currentTarget); } } },
      OL.icon("search", 16), h("span", { class: "ol-search__text", text: t("search.placeholder_short") }), h("kbd", { class: "ol-search__kbd", "aria-hidden": "true", text: mac ? "⌘K" : "Ctrl K" }));
    bar.appendChild(h("div", { class: "ol-top__search" }, search));

    var tools = h("div", { class: "ol-top__tools" });
    if (st.years.length) {
      var cur = S.year();
      var yb = h("button", { type: "button", class: "ol-top__year", "aria-haspopup": "menu", "aria-expanded": "false", "aria-label": t("shell.year_label", { year: yearText(cur) }) },
        h("span", { text: yearText(cur) }), OL.icon("chevron-down", 16));
      yb.addEventListener("click", function () {
        OL.ui.menu.open({ anchor: yb, align: "end", items: st.years.map(function (y) {
          return { label: yearText(y), icon: y === cur ? "check" : null, onClick: function () { setYear(y); } };
        }) });
      });
      tools.appendChild(yb);
    }
    var label = t(st.unread ? "shell.notifications_n" : "shell.notifications", { n: st.unread || 0 }), badge = st.unread ? h("span", { class: "ol-top__badge", "aria-hidden": "true", text: st.unread > 99 ? "99+" : String(st.unread) }) : null;
    var bell = c.inboxPath
      ? h("a", { class: "ol-top__icon", href: href(c.inboxPath), "aria-label": label, "data-tip": t("shell.notifications", {}),
          on: { click: function (e) { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); go(c.inboxPath); } } }, OL.icon("bell", 20), badge)
      : h("button", { type: "button", class: "ol-top__icon", "aria-label": label, "data-tip": t("shell.notifications", {}), on: { click: function () { if (c.openInbox) c.openInbox(); } } }, OL.icon("bell", 20), badge);
    tools.appendChild(bell);
    tools.appendChild(langToggle());

    var me = c.me, ab = h("button", { type: "button", class: "ol-top__me", "aria-haspopup": "menu", "aria-expanded": "false", "aria-label": t("shell.account_menu", { name: me.name }) },
      OL.ui.avatar.render({ name: me.name, id: me.id, size: 32 }));
    ab.addEventListener("click", function () { openAccountMenu(ab); });
    tools.appendChild(ab);
    bar.appendChild(tools);
  }

  /* My account, where you are signed in, help, sign out — and how the page looks, which is how a person likes it and not the school's. */
  function openAccountMenu(anchor) {
    var th = theme(), c = st.ctx;
    var themes = ["light", "dark", "auto", "hc"].map(function (v) {
      return { label: t("shell.theme." + v), radio: true, checked: v === th, onClick: function () { store("theme", v); applyTheme(v); redraw(); } };
    });
    OL.ui.menu.open({ anchor: anchor, align: "end", items: [
      { label: t("shell.my_account"), icon: "user", onClick: function () { c.openAccount(); } },
      { label: t("shell.sessions"), icon: "shield", onClick: function () { if (c.openSessions) c.openSessions(); else c.openAccount(); } },
      { label: t("shell.help"), icon: "help", onClick: openHelp },
      { sep: true },
      { head: t("shell.appearance") }
    ].concat(themes, [
      { sep: true },
      { label: t("shell.sign_out"), icon: "log-out", onClick: signOut }
    ]) });
  }

  function setLang(code) {
    store("lang", code);
    OL.i18n.use(code, function () { OL.announce(t("shell.language_changed")); });
  }

  function setYear(y) {
    store("year", y);
    drawTop();
    st.yearListeners.forEach(function (fn) { fn(y); });
    OL.announce(t("shell.year_changed", { year: yearText(y) }));
  }

  /* Sign out has to work. The console saves what it holds, tells the server without waiting for the answer, and shows the
     welcome page at once, so it cannot hang on a slow network; it used to ask first with a browser dialog. */
  function signOut() {
    var btn = document.querySelector(".ol-top__me");
    if (btn) btn.disabled = true;
    OL.announce(t("shell.signing_out"));
    st.ctx.signOut();
  }

  /* Help and shortcuts. A shortcut of one key ("/") has to be possible to turn off (WCAG 2.2 SC 2.1.4); Ctrl or Cmd + K is not one of them. */
  function openHelp() {
    var mac = /Mac|iP(hone|ad)/.test(navigator.platform), mod = mac ? "⌘" : "Ctrl";
    var rows = [[mod + " K", "shell.k.search"], ["/", "shell.k.slash"], ["↑ ↓", "shell.k.move"], ["Enter", "shell.k.open"], ["Tab", "shell.k.group"], ["Esc", "shell.k.close"]];
    var dl = h("dl", { class: "ol-keys" });
    rows.forEach(function (r) { dl.appendChild(h("div", null, h("dt", null, h("kbd", { text: r[0] })), h("dd", { text: t(r[1]) }))); });
    var one = OL.ui.check.toggle({ label: t("shell.shortcuts"), checked: OL.shortcuts.single(), onChange: function (on) {
      OL.shortcuts.setSingle(on);
      OL.announce(on ? t("shell.shortcuts_on") : t("shell.shortcuts_off"));
    } });
    var m = OL.ui.modal.open({ title: t("shell.help_title"), body: h("div", { class: "ol-help" }, dl, one), width: 520, actions: [OL.ui.button.render({ label: t("common.close"), variant: "secondary", onClick: function () { m.close(); } })] });
  }

  /* ------------------------------------------------------------- Palette */
  var recent = {
    list: function () { try { return (JSON.parse(store("recent") || "[]") || []).slice(0, 5); } catch (e) { return []; } },
    add: function (r) {
      var l = recent.list().filter(function (x) { return !(x.kind === r.kind && x.id === r.id); });
      l.unshift(r);
      store("recent", JSON.stringify(l.slice(0, 5)));
    }
  };

  function pagesList() {
    var out = [];
    st.visible.forEach(function (m) {
      var mod = label.module(m.key);
      m.tabs.forEach(function (tb) {
        var base = { module: m.key, tab: tb.key };
        if (m.solo) { out.push({ label: mod, crumbs: "", path: OL.routes.pathOf(base, allowed) }); return; }
        out.push({ label: label.tab(m.key, tb.key), crumbs: mod, path: OL.routes.pathOf(Object.assign({ sub: tb.subs.length ? tb.subs[0].key : null }, base), allowed) });
        if (tb.subs.length > 1) tb.subs.forEach(function (s) {
          out.push({ label: label.sub(m.key, tb.key, s.key), crumbs: mod + " › " + label.tab(m.key, tb.key), path: OL.routes.pathOf(Object.assign({}, base, { sub: s.key }), allowed) });
        });
      });
    });
    return out;
  }
  var ACTIONS = [
    { key: "take_register", path: "attendance/registers", words: "attendance roll call mark absent present" },
    { key: "new_circular", path: "communicate/circulars", words: "notice announcement send" },
    { key: "issue_certificate", path: "students/certificates", words: "tc transfer bonafide character" },
    { key: "arrange_cover", path: "staff/cover", words: "substitution absent teacher" },
    { key: "admit_student", path: "students/admissions", words: "admission enrol application enquiry" },
    { key: "raise_work_order", path: "campus/facilities/orders", words: "repair maintenance fix" }
  ];
  function actionsList() {
    return ACTIONS.map(function (a) {
      var p = OL.routes.parse(a.path, allowed);
      if (!p.legacy) return null;
      var m = p.module;
      return { label: t("action." + a.key), crumbs: label.module(m), path: a.path, words: a.words };
    }).filter(Boolean);
  }

  function openPalette(trigger) {
    if (st.ctx.openSearch) { st.ctx.openSearch(trigger || document.activeElement); return; }   // an old console's own search keeps working
    OL.shell.palette.open({
      trigger: trigger || document.activeElement,
      search: function (q) { return st.ctx.search(q); },
      pages: pagesList(), actions: actionsList(), recent: recent,
      onPick: function (it) {
        if (it.type === "record") st.ctx.openRecord(it);
        else go(it.path);
      }
    });
  }

  /* ----------------------------------------------------------- Tab rows */
  /* The path back up, above the page's tabs: Students › Classes › Sections. Every step but the last is a link to that place. */
  function drawCrumbs() {
    if (!st.head) return;
    var old = st.head.querySelector(".ol-breadcrumb"), items = st.route ? crumbs() : [];
    var node = items.length > 1 ? OL.ui.breadcrumb.render({ items: items }) : null;
    if (old && node) old.replaceWith(node);
    else if (old) old.remove();
    else if (node) st.head.insertBefore(node, st.head.firstChild);
  }

  function drawHead() {
    var r = st.route, head = st.head;
    OL.clear(head);
    if (!r) return;
    drawCrumbs();
    var m = st.visible.filter(function (x) { return x.key === r.module; })[0];
    if (!m || m.solo || m.tabs.length < 2) return;
    var items = m.tabs.map(function (tb) {
      var path = OL.routes.pathOf({ module: m.key, tab: tb.key, sub: tb.subs.length ? tb.subs[0].key : null }, allowed);
      return { key: tb.key, label: label.tab(m.key, tb.key), href: href(path) };
    });
    // a click on the tab you are in, from a record of that tab (a student, a section, the old admissions workspace), goes back to the tab's own page
    var tabs = OL.ui.tabs.render({ items: items, active: r.tab, size: "page", label: label.module(m.key), panelPrefix: "olpage", reselect: true, onSelect: function (k) {
      if (k === r.tab && !r.record) return;
      var tb = m.tabs.filter(function (x) { return x.key === k; })[0];
      go(OL.routes.pathOf({ module: m.key, tab: k, sub: tb.subs.length ? tb.subs[0].key : null }, allowed));
    } });
    head.appendChild(tabs);
    // the page the old console draws is the tabs' panel
    if (st.host) { st.host.id = tabs.panelId(r.tab); st.host.setAttribute("role", "tabpanel"); st.host.setAttribute("aria-labelledby", tabs.tabId(r.tab)); }
    var tb = m.tabs.filter(function (x) { return x.key === r.tab; })[0];
    if (tb && tb.subs.length > 1) {
      var subs = OL.ui.tabs.render({ size: "sub", label: label.tab(m.key, tb.key), active: r.sub || tb.subs[0].key, controls: false,
        items: tb.subs.map(function (s) { return { key: s.key, label: label.sub(m.key, tb.key, s.key), href: href(OL.routes.pathOf({ module: m.key, tab: tb.key, sub: s.key }, allowed)) }; }),
        onSelect: function (k) { go(OL.routes.pathOf({ module: m.key, tab: tb.key, sub: k }, allowed)); } });
      head.appendChild(subs);
    }
  }

  /* --------------------------------------------------------------- Mount */
  function onKey(e) {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === "k" || e.key === "K")) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (OL.shell.palette.isOpen()) OL.shell.palette.close(); else openPalette(document.activeElement);
    }
  }
  function poll() {
    if (!st.ctx || !st.ctx.unread) return;
    st.ctx.unread().then(function (n) { if (n !== st.unread) { st.unread = n || 0; if (st.top) drawTop(); } }, function () { /* the bell simply has no number */ });
  }

  /* barOnly: the bar over an old console, with no rail of the frame's, no tab rows, and the old console's own page and rail as they were. */
  function mount(barOnly) {
    if (st.mounted) return;
    var body = document.body;
    st.barOnly = !!barOnly;
    body.classList.add(barOnly ? "ol-bar" : "ol-shell");
    if (!barOnly) {
      st.rail = document.getElementById("rail");
      st.rail.dataset.built = "ol";          // the old rail's builder rebuilds it if the old console comes back
    }
    st.top = h("header", { class: "ol-top ol-app", id: "olTop" });
    body.appendChild(st.top);
    document.addEventListener("keydown", onKey, true);
    if (!st.bound && window.matchMedia) { st.bound = true; window.matchMedia("(max-width: 1023px)").addEventListener("change", function () { if (st.mounted && !st.barOnly) { drawRail(); drawTop(); } }); }
    OL.i18n.onChange(function () { if (st.mounted) redraw(); });
    st.mounted = true;
    var saved = store("lang");
    if (saved && saved !== OL.i18n.locale()) OL.i18n.use(saved);
    var th = store("theme");
    if (th) document.documentElement.setAttribute("data-theme", th); else document.documentElement.setAttribute("data-theme", st.ctx.appearance ? st.ctx.appearance() : "light");
    poll();
    st.timer = setInterval(poll, 90000);
    if (st.ctx.years) st.ctx.years().then(function (ys) {
      st.years = ys || [];
      if (st.years.length && st.years.indexOf(store("year")) < 0) store("year", st.years[0]);
      if (st.top) drawTop();
    }, function () { /* no year switcher without a list of years */ });
  }

  function unmount() {
    if (!st.mounted) return;
    st.mounted = false;
    clearInterval(st.timer);
    document.removeEventListener("keydown", onKey, true);
    document.body.classList.remove("ol-shell", "ol-bar", "ol-rail-min");
    if (st.top) st.top.remove();
    if (st.head) { st.head.remove(); st.head = null; }
    if (st.watch) { st.watch.disconnect(); st.watch = null; }
    if (st.rail) { st.rail.className = "cn-rail"; OL.clear(st.rail); delete st.rail.dataset.built; st.rail = null; }
    st.barOnly = false;
    st.record = null; st.route = null; st.pending = null;
  }

  function redraw() {
    if (!st.mounted) return;
    if (st.barOnly) { drawTop(); return; }
    drawRail(); drawTop(); drawHead();
    if (st.ctx.setTitle && S.title() && !st.record) st.ctx.setTitle(S.title());      // the tab's title follows the language
  }

  /* Called by the console at every navigation. Returns the element the page is drawn into. */
  function open(ctx) {
    st.ctx = ctx;
    if (st.mounted && st.barOnly) unmount();
    if (!st.mounted) mount(false);
    st.visible = OL.routes.visible(allowed);
    st.route = routeFor(ctx.current);
    st.record = null;
    st.pending = null;
    var wrap = ctx.container;
    OL.clear(wrap);
    /* The tab strip sits beside the old view, not in it: an old page that opens a record clears its whole view, and the tabs it sits under stay. */
    if (st.head) st.head.remove();
    st.head = h("div", { class: "ol-pagehead ol-app" });
    wrap.parentNode.insertBefore(st.head, wrap);
    if (st.watch) st.watch.disconnect();
    if (window.MutationObserver) {
      st.watch = new MutationObserver(function () { st.head.hidden = !wrap.classList.contains("on"); });
      st.watch.observe(wrap, { attributes: true, attributeFilter: ["class"] });
    }
    var host = h("div", { class: "admin-body ol-host" });
    wrap.appendChild(host);
    st.host = host;
    drawRail(); drawTop(); drawHead();
    return host;
  }

  /* The rail and tabs again, for a change in what this person may open (a module switched on or off from Admin › Settings › Modules). */
  S.refresh = function () { if (st.mounted) { st.visible = OL.routes.visible(allowed); redraw(); } };
  S.bind = function (ctx) { st.ctx = ctx; };
  S.open = open;
  /* The bar alone, over an old console. Called at every navigation, like open(), and draws the bar again. */
  S.openBar = function (ctx) {
    st.ctx = ctx;
    if (st.mounted && !st.barOnly) return;
    if (!st.mounted) mount(true);
    drawTop();
  };
  S.unmount = unmount;
  S.mounted = function () { return st.mounted; };
  S.barOnly = function () { return st.mounted && st.barOnly; };
  S.go = go;
  S.path = pathFor;
  S.keyFor = keyFor;
  S.route = function () { return st.route; };
  S.pending = function () { return st.pending; };
  S.title = function () {
    var r = st.route;
    if (!r) return null;
    var m = OL.routes.module(r.module);
    return m.solo ? label.module(r.module) : label.tab(r.module, r.tab);
  };
  S.setRecord = function (r) { st.record = r; drawCrumbs(); if (r && st.ctx && st.ctx.setTitle) st.ctx.setTitle(r.label); };
  S.year = function () { return store("year") || (st.years[0] || null); };
  S.onYear = function (fn) { st.yearListeners.push(fn); };
  S.openPalette = openPalette;
  S.signOut = signOut;
  S.recent = recent;
})();
