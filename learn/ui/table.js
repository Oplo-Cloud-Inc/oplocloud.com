/* ==========================================================================
   C-10 Data table.

   Built for 1,801 students, not one: a page of 50 comes from the server
   ("1–50 of 1,801"), and a client-side list longer than 200 rows is windowed so
   the page never holds more than a screenful of them. Never 1,800 rows in the
   DOM — the Compliance page does today.

   Rules the component keeps so a screen cannot get them wrong:
     · an empty cell is "—", everywhere; a boolean is "Yes"/"No"; a status is
       a pill (the column's render makes it)
     · numbers are right-aligned and tabular; names are left and bold
     · <th scope>, a visually hidden <caption>, aria-sort on the sorted column
     · the header and the first column are sticky inside the scroll area
     · ↑ ↓ move between rows, Space selects, Enter opens; a click anywhere on a
       row opens it unless the click was on something interactive in it
     · a selected page offers "Select all 1,801" — the whole filter, not the page
     · on a phone each row is a card: the title column, two secondary fields, the
       status, a chevron (CSS reads data-m on the cells)

   Column: { key, label, align, sort, width, sticky, num, hidden, mobile:
     "title"|"sub"|"status"|"hide", value(row) → comparable / CSV text,
     render(row) → node|string, total(rows) → string }

   OL.ui.table.render({ caption, columns, rows, rowKey, selectable, selected,
     sort: { key, dir }, onSort, page, pageSize, total, onPage, onOpen,
     onSelect, selectAllMatching: { label, onSelectAll }, rowActions(row),
     expand(row), totals, columnChooser, resizable, prefsKey, loading, empty,
     entity }) → the element, with .update({...}), .selected(), .toCSV()
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var WINDOW_AT = 200, BUFFER = 8;

  function prefs(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem("ol.table." + key) || "null");
      localStorage.setItem("ol.table." + key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  function cellValue(col, row) { return col.value ? col.value(row) : row[col.key]; }
  function isEmpty(v) { return v == null || v === ""; }

  function render(p) {
    var s = {
      columns: p.columns, rows: p.rows || [], rowKey: p.rowKey || "id", sort: p.sort || null,
      page: p.page || 1, pageSize: p.pageSize || 50, total: p.total, loading: !!p.loading,
      sel: {}, allMatching: false, expanded: {}, widths: {}, hidden: {}, frozen: false, first: 0, last: 0, rowH: 0
    };
    (p.selected || []).forEach(function (k) { s.sel[k] = true; });
    s.columns.forEach(function (c) { if (c.hidden) s.hidden[c.key] = true; });
    var saved = p.prefsKey ? prefs(p.prefsKey) : null;
    if (saved) { if (saved.hidden) s.hidden = saved.hidden; if (saved.widths) { s.widths = saved.widths; s.frozen = true; } }

    var paged = p.total != null || !!p.onPage;
    var collator = window.Intl && Intl.Collator ? new Intl.Collator(OL.i18n.locale(), { numeric: true, sensitivity: "base" }) : null;

    var caption = h("caption", { class: "ol-sr", text: p.caption || "" });
    var colgroup = h("colgroup"), thead = h("thead"), tbody = h("tbody"), tfoot = h("tfoot");
    var table = h("table", { class: OL.cx("ol-table", p.selectable && "has-sel", p.resizable && "is-resizable") }, caption, colgroup, thead, tbody, tfoot);
    var headCb = null;
    var scroll = h("div", { class: "ol-table__scroll", tabindex: "-1" }, table);
    var bar = h("div", { class: "ol-table__bar", hidden: true });
    var selbar = h("div", { class: "ol-table__selbar", role: "status", hidden: true });
    var foot = h("nav", { class: "ol-pager", "aria-label": t("table.pagination"), hidden: true });
    var emptyHost = h("div", { class: "ol-table__empty", hidden: true });
    var el = h("div", { class: OL.cx("ol-tablewrap", p.class) }, bar, selbar, scroll, emptyHost, foot);

    function visible() { return s.columns.filter(function (c) { return !s.hidden[c.key]; }); }

    /* ------------------------------------------------------------ the rows */
    function sortedRows() {
      if (!s.sort || p.onSort) return s.rows;
      var col = s.columns.filter(function (c) { return c.key === s.sort.key; })[0];
      if (!col) return s.rows;
      var dir = s.sort.dir === "desc" ? -1 : 1;
      return s.rows.slice().sort(function (a, b) {
        var x = cellValue(col, a), y = cellValue(col, b);
        if (isEmpty(x)) return isEmpty(y) ? 0 : 1;           // blanks last, either direction
        if (isEmpty(y)) return -1;
        if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
        return (collator ? collator.compare(String(x), String(y)) : String(x).localeCompare(String(y))) * dir;
      });
    }
    var view = [];                                           // the rows as currently ordered

    function windowed() { return !paged && view.length > WINDOW_AT && !p.expand; }

    function drawCols() {
      var cols = visible();
      OL.clear(colgroup);
      if (p.selectable) colgroup.appendChild(h("col", { class: "ol-col-sel" }));
      if (p.expand) colgroup.appendChild(h("col", { class: "ol-col-exp" }));
      cols.forEach(function (c) { colgroup.appendChild(h("col", { style: (s.widths[c.key] || c.width) ? { width: (s.widths[c.key] || c.width) + "px" } : null, "data-key": c.key })); });
      if (p.rowActions) colgroup.appendChild(h("col", { class: "ol-col-act" }));
      table.classList.toggle("is-fixed", s.frozen);
    }

    function drawHead() {
      var cols = visible();
      OL.clear(thead);
      var tr = h("tr");
      if (p.selectable) {
        headCb = OL.ui.check.box({ label: t("table.select_page"),
          onChange: function (on) { pageKeys().forEach(function (k) { if (on) s.sel[k] = true; else delete s.sel[k]; }); s.allMatching = false; syncSel(); } });
        tr.appendChild(h("th", { scope: "col", class: "ol-th ol-th--sel" }, headCb));
        syncHeadCb();
      }
      if (p.expand) tr.appendChild(h("th", { scope: "col", class: "ol-th ol-th--exp" }, h("span", { class: "ol-sr", text: t("table.expand") })));
      cols.forEach(function (c, i) {
        var sorted = s.sort && s.sort.key === c.key ? s.sort.dir : null;
        var th = h("th", { scope: "col", class: OL.cx("ol-th", c.num && "is-num", c.align === "end" && "is-num", c.align === "center" && "is-center", c.sticky !== false && i === 0 && "is-sticky"),
          "aria-sort": c.sort ? (sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none") : null });
        if (c.sort) {
          th.appendChild(h("button", { type: "button", class: "ol-th__btn", "data-sk": c.key, on: { click: function () { sortBy(c.key); } } },
            h("span", { text: c.label }), OL.icon(sorted === "asc" ? "arrow-up" : sorted === "desc" ? "arrow-down" : "sort", 16)));
        } else th.appendChild(h("span", { class: "ol-th__txt", text: c.label }));
        if (p.resizable) th.appendChild(h("span", { class: "ol-th__rs", role: "separator", "aria-orientation": "vertical", tabindex: "0", "aria-label": t("table.resize", { name: c.label }), "data-rs": c.key,
          "aria-valuemin": "64", "aria-valuemax": "640", "aria-valuenow": String(s.widths[c.key] || c.width || 160),
          on: { pointerdown: function (e) { startResize(e, c, th); }, keydown: function (e) { keyResize(e, c, th); },
            focus: function (e) { e.target.setAttribute("aria-valuenow", String(Math.round(th.getBoundingClientRect().width))); } } }));
        tr.appendChild(th);
      });
      if (p.rowActions) tr.appendChild(h("th", { scope: "col", class: "ol-th ol-th--act" }, h("span", { class: "ol-sr", text: t("table.actions") })));
      thead.appendChild(tr);
    }

    function pageKeys() { return view.map(function (r) { return r[s.rowKey]; }); }

    function mobileRole(c, i) {
      if (c.mobile) return c.mobile;
      return i === 0 ? "title" : i < 3 ? "sub" : "hide";
    }

    function cell(c, row, i) {
      var v = c.render ? c.render(row) : cellValue(c, row);
      var td = h("td", { class: OL.cx("ol-td", c.num && "is-num", c.align === "end" && "is-num", c.align === "center" && "is-center", i === 0 && c.sticky !== false && "is-sticky", i === 0 && "is-name"),
        "data-m": mobileRole(c, i), "data-label": c.label });
      if (typeof v === "boolean") v = v ? t("common.yes") : t("common.no");
      if (isEmpty(v)) td.appendChild(h("span", { class: "ol-dash", "aria-label": t("common.none"), text: "—" }));
      else OL.append(td, v);
      return td;
    }

    function rowNode(row, idx, isFirst) {
      var key = row[s.rowKey], cols = visible();
      var tr = h("tr", { class: OL.cx("ol-tr", s.sel[key] && "is-sel"), tabindex: isFirst ? "0" : "-1", "data-k": key, "data-i": idx,
        "aria-rowindex": paged || windowed() ? (paged ? (s.page - 1) * s.pageSize : 0) + idx + 2 : null });
      if (p.selectable) tr.appendChild(h("td", { class: "ol-td ol-td--sel", "data-m": "sel" }, OL.ui.check.box({ label: t("table.select_row"), checked: !!s.sel[key],
        onChange: function (on) { toggle(key, on, idx); } })));
      if (p.expand) {
        var open = !!s.expanded[key];
        tr.appendChild(h("td", { class: "ol-td ol-td--exp", "data-m": "hide" }, h("button", { type: "button", class: "ol-iconbtn", "aria-expanded": open ? "true" : "false", "aria-label": t("table.expand"),
          on: { click: function (e) { e.stopPropagation(); s.expanded[key] = !s.expanded[key]; drawBody(); } } }, OL.icon(open ? "chevron-down" : "chevron-right", 16))));
      }
      cols.forEach(function (c, i) { tr.appendChild(cell(c, row, i)); });
      if (p.rowActions) tr.appendChild(h("td", { class: "ol-td ol-td--act", "data-m": "chev" },
        h("button", { type: "button", class: "ol-iconbtn ol-rowmenu", "aria-haspopup": "menu", "aria-expanded": "false", "aria-label": t("table.row_actions"), "data-tip": t("table.row_actions"),
          on: { click: function (e) { e.stopPropagation(); OL.ui.menu.open({ anchor: e.currentTarget, align: "end", items: p.rowActions(row) }); } } }, OL.icon("more", 16)),
        OL.icon("chevron-right", 16)));
      return tr;
    }

    var lastClicked = -1, shiftDown = false;
    tbody.addEventListener("click", function (e) { if (e.target.classList && e.target.classList.contains("ol-cb")) shiftDown = e.shiftKey; }, true);
    function toggle(key, on, idx) {
      if (shiftDown && lastClicked > -1) {                   // shift-click selects the range between the two
        var a = Math.min(lastClicked, idx), b = Math.max(lastClicked, idx);
        for (var i = a; i <= b; i++) { var k = view[i][s.rowKey]; if (on) s.sel[k] = true; else delete s.sel[k]; }
      } else if (on) s.sel[key] = true; else delete s.sel[key];
      shiftDown = false; lastClicked = idx; s.allMatching = false;
      syncSel();
    }
    function syncHeadCb() {
      if (!headCb) return;
      var keys = pageKeys(), n = keys.filter(function (k) { return s.sel[k]; }).length;
      headCb.checked = !!keys.length && n === keys.length;
      headCb.indeterminate = n > 0 && n < keys.length;
    }
    /* Selection changes repaint in place: a redraw would take focus off the checkbox just pressed. */
    function syncSel() {
      OL.$$("tr.ol-tr", tbody).forEach(function (tr) {
        var on = !!s.sel[tr.getAttribute("data-k")];
        tr.classList.toggle("is-sel", on);
        var cb = tr.querySelector(".ol-cb"); if (cb) cb.checked = on;
      });
      syncHeadCb(); drawSelbar(); emitSelect();
    }

    function drawBody() {
      var focusKey = tbody.contains(document.activeElement) && document.activeElement.closest("tr") ? document.activeElement.closest("tr").getAttribute("data-k") : null;
      view = sortedRows();
      OL.clear(tbody);
      var colspan = visible().length + (p.selectable ? 1 : 0) + (p.expand ? 1 : 0) + (p.rowActions ? 1 : 0);
      var from = 0, to = view.length;
      if (windowed()) {
        var rh = s.rowH || (parseFloat(getComputedStyle(table).getPropertyValue("--ol-row-h")) || 44);
        var top = scroll.scrollTop, vh = scroll.clientHeight || 600;
        from = Math.max(0, Math.floor(top / rh) - BUFFER);
        to = Math.min(view.length, from + Math.ceil(vh / rh) + BUFFER * 2);
        s.first = from; s.last = to;
        if (from > 0) tbody.appendChild(h("tr", { class: "ol-spacer", "aria-hidden": "true", style: { "--h": from * rh + "px" } }, h("td", { colspan: colspan })));
      }
      if (paged || windowed()) table.setAttribute("aria-rowcount", (paged ? s.total : view.length) + 1); else table.removeAttribute("aria-rowcount");
      for (var i = from; i < to; i++) {
        var tr = rowNode(view[i], i, i === from);
        tbody.appendChild(tr);
        if (p.expand && s.expanded[view[i][s.rowKey]]) tbody.appendChild(h("tr", { class: "ol-tr-detail" }, h("td", { colspan: colspan }, p.expand(view[i]))));
      }
      if (windowed()) {
        if (to < view.length) tbody.appendChild(h("tr", { class: "ol-spacer", "aria-hidden": "true", style: { "--h": (view.length - to) * (s.rowH || 44) + "px" } }, h("td", { colspan: colspan })));
        if (!s.rowH) { var first = tbody.querySelector(".ol-tr"); if (first && first.offsetHeight) s.rowH = first.offsetHeight; }
      }
      if (focusKey != null) { var f = tbody.querySelector('[data-k="' + CSS.escape(String(focusKey)) + '"]'); if (f) f.focus({ preventScroll: true }); }
      drawFoot(); syncHeadCb();
      var none = !view.length && !s.loading;
      table.hidden = none; emptyHost.hidden = !none;
      if (none) { OL.clear(emptyHost); emptyHost.appendChild(OL.ui.empty.render(p.empty || { kind: "first", title: t("table.empty") })); }
    }

    function drawFoot() {
      OL.clear(tfoot);
      if (p.totals) {
        var tr = h("tr", { class: "ol-tr-total" });
        if (p.selectable) tr.appendChild(h("td"));
        if (p.expand) tr.appendChild(h("td"));
        visible().forEach(function (c, i) {
          tr.appendChild(h("td", { class: OL.cx("ol-td", (c.num || c.align === "end") && "is-num", i === 0 && "is-sticky"), text: c.total ? String(c.total(s.rows)) : (i === 0 ? t("table.total") : "") }));
        });
        if (p.rowActions) tr.appendChild(h("td"));
        tfoot.appendChild(tr);
      }
      OL.clear(foot);
      if (!paged || !s.total) { foot.hidden = true; return; }
      foot.hidden = false;
      var pages = Math.max(1, Math.ceil(s.total / s.pageSize)), cur = s.page;
      var from = (cur - 1) * s.pageSize + 1, to = Math.min(s.total, cur * s.pageSize);
      foot.appendChild(h("span", { class: "ol-pager__range", text: t("table.range", { from: OL.fmt.num(from), to: OL.fmt.num(to), total: OL.fmt.num(s.total) }) }));
      var nav = h("div", { class: "ol-pager__nav" });
      nav.appendChild(OL.ui.button.render({ label: t("common.previous"), icon: "chevron-left", variant: "secondary", size: "sm", disabled: cur <= 1, onClick: function () { go(cur - 1); } }));
      var shownPages = [1, cur - 1, cur, cur + 1, pages].filter(function (n, i, a) { return n >= 1 && n <= pages && a.indexOf(n) === i; }).sort(function (a, b) { return a - b; });
      var numbers = h("span", { class: "ol-pager__nums" });
      var prev = 0;
      shownPages.forEach(function (n) {
        if (n - prev > 1) numbers.appendChild(h("span", { class: "ol-pager__gap", "aria-hidden": "true", text: "…" }));
        numbers.appendChild(h("button", { type: "button", class: OL.cx("ol-pager__n", n === cur && "is-on"), "aria-current": n === cur ? "page" : null, "aria-label": t("table.page_n", { n: n }), text: OL.fmt.num(n), on: { click: function () { go(n); } } }));
        prev = n;
      });
      nav.appendChild(numbers);
      nav.appendChild(h("span", { class: "ol-pager__of", text: t("table.page_of", { n: OL.fmt.num(cur), total: OL.fmt.num(pages) }) }));
      nav.appendChild(OL.ui.button.render({ label: t("common.next"), iconAfter: "chevron-right", variant: "secondary", size: "sm", disabled: cur >= pages, onClick: function () { go(cur + 1); } }));
      foot.appendChild(nav);
    }
    function go(n) { s.page = n; if (p.onPage) p.onPage(n); scroll.scrollTop = 0; }

    function drawSelbar() {
      var n = Object.keys(s.sel).length;
      OL.clear(selbar);
      selbar.hidden = !n && !s.allMatching;
      if (selbar.hidden) return;
      var total = p.selectAllMatching && p.selectAllMatching.total != null ? p.selectAllMatching.total : s.total;
      if (s.allMatching) {
        selbar.appendChild(h("span", { text: t("table.all_selected", { n: OL.fmt.num(total) }) }));
        selbar.appendChild(h("button", { type: "button", class: "ol-link", on: { click: function () { s.allMatching = false; s.sel = {}; syncSel(); } } }, t("table.clear_selection")));
      } else {
        selbar.appendChild(h("span", { text: t("table.n_selected", { n: OL.fmt.num(n) }) }));
        var pageAll = pageKeys().every(function (k) { return s.sel[k]; });
        if (p.selectAllMatching && pageAll && total > view.length)
          selbar.appendChild(h("button", { type: "button", class: "ol-link", on: { click: function () { s.allMatching = true; drawSelbar(); emitSelect(); } } }, t("table.select_all_matching", { n: OL.fmt.num(total) })));
        selbar.appendChild(h("button", { type: "button", class: "ol-link", on: { click: function () { s.sel = {}; syncSel(); } } }, t("table.clear_selection")));
      }
      OL.announce(selbar.textContent);
    }
    function emitSelect() { if (p.onSelect) p.onSelect(Object.keys(s.sel), { allMatching: s.allMatching }); }

    function sortBy(key) {
      var dir = s.sort && s.sort.key === key && s.sort.dir === "asc" ? "desc" : "asc";
      s.sort = { key: key, dir: dir };
      if (p.onSort) p.onSort(key, dir);
      drawHead(); drawBody();
      var again = thead.querySelector('[data-sk="' + key + '"]'); if (again) again.focus();   // the redraw replaced the button that was pressed
      var col = s.columns.filter(function (c) { return c.key === key; })[0];
      OL.announce(t("table.sorted", { name: col ? col.label : key, dir: t(dir === "asc" ? "table.ascending" : "table.descending") }));
    }

    /* ----------------------------------------------------- resize, chooser */
    function freeze() {
      if (s.frozen) return;
      visible().forEach(function (c, i) {
        var th = thead.querySelectorAll("th")[i + (p.selectable ? 1 : 0) + (p.expand ? 1 : 0)];
        if (th) s.widths[c.key] = Math.round(th.getBoundingClientRect().width);
      });
      s.frozen = true; drawCols();
    }
    function setWidth(c, w) {
      s.widths[c.key] = Math.min(640, Math.max(64, Math.round(w)));
      var col = colgroup.querySelector('[data-key="' + c.key + '"]');
      if (col) col.style.width = s.widths[c.key] + "px";
      var rs = thead.querySelector('[data-rs="' + c.key + '"]'); if (rs) rs.setAttribute("aria-valuenow", String(s.widths[c.key]));
      if (p.prefsKey) prefs(p.prefsKey, { hidden: s.hidden, widths: s.widths });
    }
    function startResize(e, c, th) {
      e.preventDefault(); freeze();
      var x0 = e.clientX, w0 = th.getBoundingClientRect().width;
      function move(ev) { setWidth(c, w0 + (ev.clientX - x0) * (document.dir === "rtl" ? -1 : 1)); }
      function up() { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); }
      document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
    }
    function keyResize(e, c, th) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault(); freeze(); setWidth(c, th.getBoundingClientRect().width + d * 16);
    }
    function drawBar() {
      OL.clear(bar);
      bar.hidden = !p.columnChooser;
      if (!p.columnChooser) return;
      bar.appendChild(OL.ui.button.render({ label: t("table.columns"), icon: "columns", variant: "ghost", size: "sm", onClick: function (e, btn) { chooser(btn); } }));
    }
    function chooser(anchor) {
      var pop = h("div", { class: "ol-pop ol-chooser", role: "dialog", "aria-label": t("table.columns") });
      s.columns.forEach(function (c, i) {
        pop.appendChild(OL.ui.check.field({ label: c.label, checked: !s.hidden[c.key], disabled: i === 0,
          onChange: function (on) { if (on) delete s.hidden[c.key]; else s.hidden[c.key] = true; if (p.prefsKey) prefs(p.prefsKey, { hidden: s.hidden, widths: s.widths }); drawCols(); drawHead(); drawBody(); } }));
      });
      document.body.appendChild(pop);
      OL.place(pop, anchor, { align: "end" });
      var ov = OL.overlay.push({ el: pop, trap: false, outside: true, trigger: anchor, onClose: function () { pop.remove(); } });
      OL.focusables(pop)[0].focus();
      return ov;
    }

    /* ------------------------------------------------------------ keyboard */
    tbody.addEventListener("keydown", function (e) {
      var tr = e.target.closest ? e.target.closest("tr.ol-tr") : null;
      if (!tr || e.target !== tr) return;
      var i = +tr.getAttribute("data-i"), d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
      if (d) { e.preventDefault(); focusRow(Math.max(0, Math.min(view.length - 1, i + d))); }
      else if (e.key === "Home" && e.ctrlKey) { e.preventDefault(); focusRow(0); }
      else if (e.key === "End" && e.ctrlKey) { e.preventDefault(); focusRow(view.length - 1); }
      else if (e.key === " " && p.selectable) { e.preventDefault(); toggle(view[i][s.rowKey], !s.sel[view[i][s.rowKey]], i); }
      else if (e.key === "Enter" && p.onOpen) { e.preventDefault(); p.onOpen(view[i], tr); }
    });
    function focusRow(i) {
      var tr = tbody.querySelector('[data-i="' + i + '"]');
      if (!tr && windowed()) {                                  // scrolled out of the window: scroll it in, redraw, find it again
        scroll.scrollTop = Math.max(0, i * (s.rowH || 44) - scroll.clientHeight / 2);
        drawBody(); tr = tbody.querySelector('[data-i="' + i + '"]');
      }
      if (!tr) return;
      OL.$$('.ol-tr[tabindex="0"]', tbody).forEach(function (n) { n.setAttribute("tabindex", "-1"); });
      tr.setAttribute("tabindex", "0"); tr.focus();
    }
    tbody.addEventListener("click", function (e) {
      var tr = e.target.closest ? e.target.closest("tr.ol-tr") : null;
      if (!tr) return;
      if (e.target.closest("a, button, input, label")) return;
      if (p.onOpen) p.onOpen(view[+tr.getAttribute("data-i")], tr);
    });
    scroll.addEventListener("scroll", function () {
      if (!windowed()) return;
      var rh = s.rowH || 44, from = Math.max(0, Math.floor(scroll.scrollTop / rh) - BUFFER);
      if (Math.abs(from - s.first) >= BUFFER / 2) requestAnimationFrame(drawBody);
    }, { passive: true });

    /* --------------------------------------------------------------- public */
    function loadingState() {
      if (s.stopSkeleton) { s.stopSkeleton(); s.stopSkeleton = null; }
      scroll.classList.toggle("is-loading", s.loading);
      if (s.loading) s.stopSkeleton = OL.ui.skeleton.later(scroll, { type: "rows", n: Math.min(s.pageSize, 8) });
    }
    el.update = function (u) {
      if (u.columns) s.columns = u.columns;
      if (u.rows) { s.rows = u.rows; }
      if (u.sort !== undefined) s.sort = u.sort;
      if (u.page) s.page = u.page;
      if (u.total != null) { s.total = u.total; table.setAttribute("aria-rowcount", s.total); }
      if (u.selected) { s.sel = {}; s.allMatching = false; u.selected.forEach(function (k) { s.sel[k] = true; }); }
      if (u.loading != null) { s.loading = !!u.loading; loadingState(); }
      if (u.empty) p.empty = u.empty;
      drawCols(); drawHead(); drawBody(); drawSelbar();
    };
    el.selected = function () { return { keys: Object.keys(s.sel), allMatching: s.allMatching }; };
    el.toCSV = function () {
      var cols = visible();
      var esc = function (v) { v = isEmpty(v) ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      // A cell that starts with = + - @ is read as a formula by a spreadsheet; a leading apostrophe stops it.
      var safe = function (v) { v = isEmpty(v) ? "" : String(v); return /^[=+\-@\t\r]/.test(v) ? "'" + v : v; };
      return [cols.map(function (c) { return esc(c.label); }).join(",")].concat(view.map(function (r) {
        return cols.map(function (c) { return esc(safe(cellValue(c, r))); }).join(",");
      })).join("\r\n");
    };
    el.table = table;

    drawBar(); drawCols(); drawHead(); drawBody(); drawSelbar(); loadingState();
    return el;
  }

  OL.ui.table = { render: render, states: ["default", "selectable", "sortable", "paged", "windowed", "expandable", "totals", "loading", "empty", "card-mode"] };
})();
