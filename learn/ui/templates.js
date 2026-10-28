/* ==========================================================================
   Templates — the page shells (Volume 01 §9.1). A screen is a template plus a
   config: the template owns the order of the parts, the states every page of its
   kind has (loading, error, denied, empty) and the plumbing that is the same
   every time; the page owns its words, its columns and what its buttons do. The
   parts themselves are OL.ui.page and the library.

   T2 Index    header · alert · numbers · toolbar · table [· bulk bar]
   T3 Record   header with Back · tabs · panel [· side column]

   Each returns the page's state, S. The page adds what is its own to it (the
   search field it drew, the quick look it opened). The other seven templates are
   written when a screen needs them.

   var S = OL.templates.T2(host, {
     class      the page's own class on the root: the hook for its CSS and its tests
     keys       the address keys the page keeps. The address is the state, so a
                reload, a shared link and Back land where they should
     again      the keys whose change asks the server again; any other key repaints
                from the answer in hand. Default: every key (the server filters)
     answer(q)  → a promise of the server's answer for the address q
     announce(data)   → the sentence a screen reader hears after each answer
     onAddress()      the address was written (the list Back returns to is kept here)
     onQuery(patch)   a key is about to change (a selection ends with the list it was made in)
     onFirst()        once, after the first answer (a quick look named in the address opens)
     message(e)       → words for an error;  denied() → { title, text } for someone who may not read it
     head()     → { title, subtitle, primary, secondary, more } for OL.ui.page.header
     kpis()     → the number tiles for the answer in hand, with kpiLabel and kpiN (the skeleton's tiles)
     tools()    draws the toolbar with S.toolbar(). It is drawn once, when the first answer brings
                the facets, unless toolsEachTime is set; tokens() redraws the chips and filter tokens
     table()    → { key, state: { rows, total, page, sort, empty }, config }. config is OL.ui.table's
                options; the template adds the state and the loading flag, and makes a new table when key changes
     bulk()     → the actions of the bar that rises over a selection (built when the first answer says who may do what)
   })
   S.start()                  draws the page and asks for the first answer
   S.set(patch, tools)        change the address's keys; tools: the toolbar must be redrawn to show it
   S.load()                   ask again;  S.q the keys, S.data the answer, S.err the error, S.table the table
   S.toolbar({ fields, end, chips }) → { chips, tokens }: where the page puts its chips and tokens. A field the page
                              passes again as it was (its search) keeps the keyboard and the caret through the redraw

   var S = OL.templates.T3(host, {
     class      the page's own class on the root
     back       { label, href, onClick }: the header's Back
     loading    the title while the record comes
     side       { label } when the tabs have a column beside them (an aside with that name)
     tabs       the keys of the tabs;  tab  the one open
     tabLabel(k) · tabHref(k)   words and address of a tab;  label  names the tablist;  panelPrefix  keeps ids apart
     onTab(k)   the open tab changed (write it to the address)
     paint(tab) draws that tab into S.panel
   })
   S.head(props)  the header, Back included; no props: the loading title
   S.busy()       the panel as a skeleton until the record comes
   S.tabs()       draws the tabs;  S.show() draws the open tab into the panel
   S.fail(node)   the record cannot be shown: node stands where the tabs and the panel were
   S.card(title, body, why)  a card of the panel's kind;  S.panel · S.side  where the page puts its content
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, T = OL.templates, t = function (k, p) { return OL.i18n.t(k, p); };

  /* What stands where a page could not be drawn: an empty state for someone who may not read it, otherwise a banner
     with a Try again button. o: { retry, denied: { title, text }, message(e) } */
  T.failure = function (e, o) {
    if (e && e.status === 403 && o.denied) return OL.ui.empty.render({ kind: "denied", title: o.denied.title, text: o.denied.text });
    return OL.ui.banner.render({ tone: e && e.code === "offline" ? "offline" : "danger", text: o.message ? o.message(e) : (e && e.message) || t("common.load_failed"),
      actions: o.retry ? OL.ui.button.render({ label: t("common.retry"), variant: "secondary", size: "sm", onClick: o.retry }) : null });
  };

  /* ---------------------------------------------------------------- T2 */
  T.T2 = function (host, p) {
    var slot = { head: h("div"), alert: h("div", { class: "ol-t2__alert" }), kpi: h("div"), tool: h("div"), table: h("div"), bulk: p.bulk ? h("div") : null };
    OL.clear(host);
    host.appendChild(OL.append(h("div", { class: OL.cx("ol-t2", p["class"]) }), [slot.head, slot.alert, slot.kpi, slot.tool, slot.table, slot.bulk]));

    var S = { q: {}, data: null, err: null, seq: 0, table: null, bulk: null }, first = true, toolsDrawn = false, tableKey = null;
    var u = OL.url.all();
    p.keys.forEach(function (k) { if (u[k]) S.q[k] = u[k]; });

    function write() {
      var patch = {};
      p.keys.forEach(function (k) { patch[k] = S.q[k] || null; });
      OL.url.setMany(patch, { replace: true });
      if (p.onAddress) p.onAddress();
    }

    S.set = function (patch, tools) {
      var next = Object.assign({}, S.q);
      Object.keys(patch).forEach(function (k) { if (patch[k] == null || patch[k] === "") delete next[k]; else next[k] = patch[k]; });
      if (!("page" in patch)) delete next.page;       // a new filter or sort starts at the first page
      S.q = next; write();
      if (p.onQuery) p.onQuery(patch);
      if (tools) p.tools(); else if (p.tokens) p.tokens();
      kpis();
      if (!p.again || Object.keys(patch).some(function (k) { return p.again.indexOf(k) > -1; })) S.load(); else table();
    };

    /* Only the latest answer is drawn: a slow one that was asked for before a newer one is dropped. */
    S.load = function () {
      var n = ++S.seq;
      if (S.table) S.table.update({ loading: true });
      p.answer(S.q).then(function (r) {
        if (n !== S.seq) return;
        S.data = r; S.err = null;
        if (r.page && String(r.page) !== String(S.q.page || 1) && S.q.page) { S.q.page = String(r.page); write(); }   // the server clamped the page
        paint();
        if (p.announce) OL.announce(p.announce(r));
        if (first) { first = false; if (p.onFirst) p.onFirst(); }
      }, function (e) {
        if (n !== S.seq) return;
        S.err = e; if (S.table) S.table.update({ loading: false });
        paint();
      });
    };

    S.start = function () {
      if (p.onAddress) p.onAddress();
      head(); kpis(); p.tools(); table();
      S.load();
    };

    S.toolbar = function (o) {
      var kept = document.activeElement && slot.tool.contains(document.activeElement) ? { el: document.activeElement } : null;
      if (kept) try { kept.from = kept.el.selectionStart; kept.to = kept.el.selectionEnd; } catch (e) { /* a control with no caret */ }
      OL.clear(slot.tool);
      if (!o) return null;                            // nothing to filter yet (the answer did not come)
      var bar = h("div", { class: "ol-tb" }, h("div", { class: "ol-tb__group" }, o.fields), o.end ? h("div", { class: "ol-tb__end" }, o.end) : null);
      var chips = o.chips ? h("div", { class: "ol-t2__chips" }) : null, tokens = h("div", { class: "ol-tb__tokens ol-t2__tokens" });
      OL.append(slot.tool, [bar, chips, tokens]);
      // a field the page drew again as it was (a search it keeps) keeps the keyboard, and the caret, through the redraw: the person is still typing
      if (kept && kept.el.isConnected) { kept.el.focus({ preventScroll: true }); if (kept.from != null) try { kept.el.setSelectionRange(kept.from, kept.to); } catch (e) { /* not a text field */ } }
      return { chips: chips, tokens: tokens };
    };

    function paint() {
      head(); banner(); kpis();
      if (p.toolsEachTime || (S.data && !toolsDrawn)) { toolsDrawn = !!S.data; p.tools(); } else if (p.tokens) p.tokens();
      table();
      if (p.bulk && S.data && !S.bulk) { S.bulk = OL.ui.page.bulk({ actions: p.bulk() }); slot.bulk.appendChild(S.bulk); }
    }
    function head() { OL.clear(slot.head); slot.head.appendChild(OL.ui.page.header(p.head())); }
    /* a 403 is the table's denied state, not a failure; anything else is a banner above the numbers */
    function banner() { OL.clear(slot.alert); if (S.err && S.err.status !== 403) slot.alert.appendChild(T.failure(S.err, { retry: S.load, message: p.message })); }
    function kpis() {
      OL.clear(slot.kpi);
      if (S.err && !S.data) return;
      if (!S.data) { slot.kpi.appendChild(OL.ui.skeleton.render({ type: "kpi", n: p.kpiN })); return; }
      slot.kpi.appendChild(OL.ui.page.kpis(p.kpis(), p.kpiLabel));
    }
    function table() {
      if (S.err && !S.data) {
        OL.clear(slot.table); S.table = null;
        if (S.err.status === 403 && p.denied) slot.table.appendChild(OL.ui.empty.render(Object.assign({ kind: "denied" }, p.denied())));
        return;
      }
      var d = p.table(), loading = !S.data;
      if (S.table && tableKey !== d.key) S.table = null;
      if (S.table) { S.table.update(Object.assign({ loading: loading }, d.state)); return; }
      tableKey = d.key;
      S.table = OL.ui.table.render(Object.assign({ loading: loading }, d.config, d.state));
      OL.clear(slot.table); slot.table.appendChild(S.table);
    }
    return S;
  };

  /* ---------------------------------------------------------------- T3 */
  T.T3 = function (host, p) {
    var slot = { head: h("div"), tabs: h("div"), panel: h("div", { class: "ol-t3__panel" }) };
    var side = p.side ? h("aside", { class: "ol-t3__side", "aria-label": p.side.label }) : null;
    var cols = h("div", { class: OL.cx("ol-t3__cols", !side && "ol-t3__cols--one") }, h("div", { class: "ol-t3__main" }, slot.tabs, slot.panel), side);
    OL.clear(host);
    host.appendChild(h("div", { class: OL.cx("ol-t3", p["class"]) }, slot.head, cols));

    var S = { tab: p.tab, panel: slot.panel, side: side, tabbar: null };
    S.head = function (props) { OL.clear(slot.head); slot.head.appendChild(OL.ui.page.header(Object.assign({ back: p.back }, props || { title: p.loading }))); };
    S.busy = function () { OL.clear(slot.panel); slot.panel.appendChild(OL.ui.skeleton.render({ type: "lines", n: 8 })); };
    /* the panel is the open tab's, for a screen reader as well; linked as soon as the tabs are drawn, so a tab never points at a panel that is not there yet */
    function link() {
      slot.panel.id = S.tabbar.panelId(S.tab); slot.panel.setAttribute("role", "tabpanel"); slot.panel.setAttribute("aria-labelledby", S.tabbar.tabId(S.tab));
    }
    S.tabs = function () {
      OL.clear(slot.tabs);
      S.tabbar = OL.ui.tabs.render({ items: p.tabs.map(function (k) { return { key: k, label: p.tabLabel(k), href: p.tabHref(k) }; }), active: S.tab, size: "page", label: p.label, panelPrefix: p.panelPrefix,
        onSelect: function (k) { S.tab = k; p.onTab(k); S.show(); } });
      slot.tabs.appendChild(S.tabbar);
      link();
    };
    S.show = function () {
      if (!S.tabbar) return;
      OL.clear(slot.panel); link();
      p.paint(S.tab);
    };
    S.fail = function (node) {
      OL.clear(slot.tabs); OL.clear(slot.panel); if (side) OL.clear(side);
      S.tabbar = null;
      ["id", "role", "aria-labelledby"].forEach(function (a) { slot.panel.removeAttribute(a); });   // no tabs, so no tab panel
      slot.panel.appendChild(node);
    };
    S.card = function (title, body, why) { return OL.ui.card.render({ title: title, why: why, level: 2, body: body, class: "ol-t3__card" }); };
    return S;
  };
})();
