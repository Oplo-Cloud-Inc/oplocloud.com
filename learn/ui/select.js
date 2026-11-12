/* ==========================================================================
   C-03 Select (searchable).

   One control for every "pick from a list": single, multi, grouped, async.
   The native <select> is not used — it cannot search, cannot show a count
   ("Biology · 12"), cannot select a whole group, and looks different on every
   system. The popup is a listbox; on a phone it becomes a bottom sheet (CSS).

   Pattern: the trigger is a button (combobox, aria-haspopup=listbox). When the
   list is long enough to search, focus moves to a search field inside the
   popup, which owns aria-activedescendant — the listbox itself is never
   focused. Esc closes it and hands focus back to the trigger; Tab closes it and
   moves on.

   A multi-select summarises as "X-A, X-B +6" and offers "Select all" per group.
   An async select calls `load(query)` 250 ms after the last keystroke and shows
   what came back; it keeps the labels of what is already chosen, so closing and
   reopening never loses a name.

   Options: { value, label, count, hint, sub, avatar, group, disabled }. `sub` is a
   second muted line (a student's class), `avatar` { name, id, src } draws the
   initials disc (the people picker uses both). `summary(list)` replaces the
   "X-A, X-B +6" text. More than 200 rows
   draw the first 200 and say so ("Keep typing to narrow") — a list that long is
   searched, not scrolled.

   OL.ui.select.render({ label, name, options, value | values, multiple,
     searchable, placeholder, optional, helper, error, selectAllInGroup, load,
     clearable, disabled, emptyText, onChange }) → the field element, with
   .value (single) / .values (multi), .setOptions(list), .setError, .setHelper,
   .focus().
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var CAP = 200;

  function render(p) {
    p = p || {};
    var id = p.id || OL.uid("s"), listId = id + "-l", helpId = id + "-h", errId = id + "-e";
    var multi = !!p.multiple, options = (p.options || []).slice();
    var chosen = {};                       // value → label, kept even when the option list changes
    var sel = multi ? (p.values || []).slice() : (p.value != null && p.value !== "" ? [p.value] : []);
    sel.forEach(function (v) { chosen[v] = labelOf(v); });
    var searchable = p.searchable != null ? p.searchable : (!!p.load || options.length > 7);
    var query = "", activeIdx = -1, shown = [], pop = null, search = null, listEl = null, ov = null, token = 0;

    function labelOf(v) {
      for (var i = 0; i < options.length; i++) if (options[i].value === v) return options[i].label;
      return chosen[v] != null ? chosen[v] : String(v);
    }

    var valueEl = h("span", { class: "ol-select__value" });
    var clearBtn = h("button", { type: "button", class: "ol-select__clear", "aria-label": t("select.clear"), hidden: true,
      on: { click: function (e) { e.stopPropagation(); sel = []; sync(); emit(); trigger.focus(); } } }, OL.icon("x", 16));
    var trigger = h("button", {
      type: "button", id: id, class: "ol-select__ctl", role: "combobox", "aria-haspopup": "listbox", "aria-expanded": "false", "aria-controls": listId,
      disabled: p.disabled, "aria-required": p.optional ? null : "true",
      on: { click: toggle, keydown: function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
        else if (!searchable && !multi && e.key.length === 1) typeAhead(e.key);
      } }
    }, valueEl, OL.icon("chevron-down", 16));
    var label = p.label ? h("label", { class: "ol-label", for: id }, p.label, p.optional ? h("span", { class: "ol-label__opt", text: " " + t("common.optional") }) : null) : null;
    var helper = h("p", { class: "ol-help", id: helpId });
    var error = h("p", { class: "ol-error", id: errId, role: "alert", hidden: true });
    var el = h("div", { class: OL.cx("ol-field", "ol-select", p.class) }, label,
      h("div", { class: "ol-select__box" }, trigger, clearBtn), h("div", { class: "ol-field__foot" }, h("div", { class: "ol-field__msgs" }, helper, error)));

    function describe() {
      var ids = [];
      if (!error.hidden) ids.push(errId);
      if (helper.textContent) ids.push(helpId);
      if (ids.length) trigger.setAttribute("aria-describedby", ids.join(" ")); else trigger.removeAttribute("aria-describedby");
    }
    el.setHelper = function (m) { helper.textContent = m || ""; helper.hidden = !m; describe(); };
    el.setError = function (m) {
      OL.clear(error); error.hidden = !m;
      if (m) { error.appendChild(OL.icon("alert-circle", 16)); error.appendChild(document.createTextNode(m)); }
      helper.hidden = !!m || !helper.textContent;
      el.classList.toggle("is-invalid", !!m);
      if (m) trigger.setAttribute("aria-invalid", "true"); else trigger.removeAttribute("aria-invalid");
      describe();
    };
    el.setHelper(p.helper); if (p.error) el.setError(p.error);

    /* "X-A, X-B +6" — two names, then how many more. */
    function summary() {
      if (!sel.length) return null;
      if (p.summary) return p.summary(sel.map(function (v) { return { value: v, label: labelOf(v) }; }));
      if (!multi) return labelOf(sel[0]);
      var names = sel.slice(0, 2).map(labelOf).join(", ");
      return sel.length > 2 ? names + " +" + (sel.length - 2) : names;
    }
    function sync() {
      var s = summary();
      valueEl.textContent = s || p.placeholder || t("select.placeholder");
      valueEl.classList.toggle("is-placeholder", !s);
      clearBtn.hidden = !(p.clearable !== false && sel.length && !p.disabled && (multi || p.clearable));
      el.classList.toggle("has-value", !!sel.length);
    }
    function emit() { if (p.onChange) p.onChange(multi ? sel.slice() : (sel[0] != null ? sel[0] : null)); }

    function typeAhead(ch) {
      var n = options.filter(function (o) { return !o.disabled && o.label.toLowerCase().indexOf(ch.toLowerCase()) === 0; })[0];
      if (n) { sel = [n.value]; chosen[n.value] = n.label; sync(); emit(); }
    }

    /* ---------------------------------------------------------------- popup */
    function filtered() {
      var q = query.trim().toLowerCase();
      return q ? options.filter(function (o) { return (o.label + " " + (o.hint || "")).toLowerCase().indexOf(q) > -1; }) : options;
    }
    function drawList(loading) {
      OL.clear(listEl);
      var rows = filtered(), groupSeen = {}, n = 0;
      shown = [];
      if (loading) listEl.appendChild(h("li", { class: "ol-opt ol-opt--note", role: "presentation" }, h("span", { class: "ol-spin", "aria-hidden": "true" }), t("common.loading")));
      rows.slice(0, CAP).forEach(function (o) {
        if (o.group && !groupSeen[o.group]) {
          groupSeen[o.group] = true;
          listEl.appendChild(h("li", { class: "ol-opt-group", role: "presentation", text: o.group }));
          if (multi && p.selectAllInGroup) {      // a row of its own, so the keyboard reaches it the way it reaches any option
            var vals = groupValues(o.group), all = vals.length && vals.every(function (v) { return sel.indexOf(v) > -1; });
            var go = { value: "\u0000all:" + o.group, label: all ? t("select.clear_group", { group: o.group }) : t("select.all_group", { group: o.group }), groupAll: o.group };
            var ga = h("li", { class: "ol-opt ol-opt--all", role: "option", id: id + "-o" + n, "aria-selected": "false", "data-i": n,
              on: { mousedown: function (e) { e.preventDefault(); }, click: function () { activate(go); }, mousemove: function () { setActive(+ga.getAttribute("data-i")); } } },
              h("span", { class: "ol-opt__label" }, h("span", { text: go.label })));
            shown.push(go); listEl.appendChild(ga); n++;
          }
        }
        var on = sel.indexOf(o.value) > -1, oid = id + "-o" + n;
        var li = h("li", { class: OL.cx("ol-opt", on && "is-sel", o.disabled && "is-disabled"), role: "option", id: oid, "aria-selected": on ? "true" : "false", "aria-disabled": o.disabled ? "true" : null, "data-i": n,
          on: { mousedown: function (e) { e.preventDefault(); }, click: function () { activate(o); }, mousemove: function () { setActive(+li.getAttribute("data-i")); } } },
          multi ? h("span", { class: OL.cx("ol-check", on && "is-on"), "aria-hidden": "true" }, on ? OL.icon("check", 16) : null) : null,
          o.avatar ? OL.ui.avatar.render({ name: o.avatar.name || o.label, id: o.avatar.id || o.value, src: o.avatar.src, size: 24 }) : null,
          h("span", { class: "ol-opt__label" }, h("span", { text: o.label }), o.sub ? h("span", { class: "ol-opt__sub", text: o.sub }) : null),
          o.count != null ? h("span", { class: "ol-opt__count", text: OL.fmt.num(o.count) }) : null,
          !multi && on ? OL.icon("check", 16) : null);
        shown.push(o); listEl.appendChild(li); n++;
      });
      if (rows.length > CAP) listEl.appendChild(h("li", { class: "ol-opt ol-opt--note", role: "presentation", text: t("select.keep_typing", { n: rows.length - CAP }) }));
      if (!rows.length && !loading) listEl.appendChild(h("li", { class: "ol-opt ol-opt--note", role: "presentation", text: p.emptyText || t("select.none") }));
      activeIdx = Math.min(activeIdx, shown.length - 1);
      if (activeIdx < 0 && shown.length) activeIdx = Math.max(0, shown.findIndex ? shown.findIndex(function (o) { return sel.indexOf(o.value) > -1; }) : 0);
      setActive(activeIdx, true);
    }
    function setActive(i, scroll) {
      activeIdx = i;
      OL.$$(".ol-opt.is-active", listEl).forEach(function (n) { n.classList.remove("is-active"); });
      var n = i > -1 ? listEl.querySelector('[data-i="' + i + '"]') : null;
      if (n) { n.classList.add("is-active"); if (scroll) n.scrollIntoView({ block: "nearest" }); }
      var driver = search || listEl;
      if (n) driver.setAttribute("aria-activedescendant", n.id); else driver.removeAttribute("aria-activedescendant");
    }

    function groupValues(g) { return filtered().filter(function (x) { return x.group === g && !x.disabled; }).map(function (x) { return x.value; }); }
    function activate(o) {
      if (!o || o.disabled) return;
      if (o.groupAll != null) { var vals = groupValues(o.groupAll); pick(vals, !vals.every(function (v) { return sel.indexOf(v) > -1; })); }
      else pick([o.value], null);
    }
    function pick(values, force) {
      if (!multi) {
        sel = [values[0]]; chosen[values[0]] = labelOf(values[0]);
        sync(); emit(); close(); return;
      }
      values.forEach(function (v) {
        var i = sel.indexOf(v), want = force == null ? i < 0 : force;
        if (want && i < 0) { sel.push(v); chosen[v] = labelOf(v); }
        else if (!want && i > -1) sel.splice(i, 1);
      });
      sync(); emit(); drawList(); OL.announce(t("select.n_selected", { n: sel.length }));
    }

    function open() {
      if (pop || p.disabled) return;
      query = ""; activeIdx = -1;
      listEl = h("ul", { class: "ol-listbox", role: "listbox", id: listId, "aria-multiselectable": multi ? "true" : null, "aria-label": p.label || null, tabindex: searchable ? null : "0" });
      pop = h("div", { class: "ol-pop ol-select__pop" });
      if (searchable) {
        search = h("input", { type: "search", class: "ol-select__search", role: "combobox", "aria-expanded": "true", "aria-controls": listId, "aria-autocomplete": "list",
          "aria-label": t("select.search"), placeholder: t("select.search"), autocomplete: "off",
          on: { input: onSearch } });
        pop.appendChild(h("div", { class: "ol-select__sb" }, OL.icon("search", 16), search));
      }
      pop.appendChild(listEl);
      if (multi) pop.appendChild(h("div", { class: "ol-select__foot" }, h("span", { class: "ol-help", "aria-hidden": "true", text: t("select.n_selected", { n: sel.length }) }),
        OL.ui.button.render({ label: t("common.done"), variant: "secondary", size: "sm", onClick: function () { close(); } })));
      document.body.appendChild(pop);
      var wasModal = trigger.closest("[aria-modal='true']");
      if (wasModal) pop.classList.add("in-layer");
      OL.place(pop, trigger, { matchWidth: true });
      trigger.setAttribute("aria-expanded", "true");
      ov = OL.overlay.push({ el: pop, trap: false, outside: true, trigger: trigger, onClose: function () {
        window.removeEventListener("resize", reposition);
        trigger.setAttribute("aria-expanded", "false"); pop.remove(); pop = null; search = null; ov = null; token++;
      } });
      pop.addEventListener("keydown", onKey);
      if (!searchable) listEl.addEventListener("keydown", onKey);
      drawList(false);
      (search || listEl).focus();
      if (p.load) runLoad("");
      window.addEventListener("resize", reposition);
    }
    function reposition() { if (pop) OL.place(pop, trigger, { matchWidth: true }); }
    function close() { if (ov) ov.close("select"); }
    function toggle() { if (pop) close(); else open(); }

    var runLoad = function (q) {
      var mine = ++token;
      drawList(true);
      Promise.resolve(p.load(q)).then(function (rows) {
        if (mine !== token || !pop) return;
        options = rows || []; drawList(false);
      }, function () {
        if (mine !== token || !pop) return;
        OL.clear(listEl); listEl.appendChild(h("li", { class: "ol-opt ol-opt--note", role: "presentation", text: t("common.load_failed") }));
      });
    };
    var asyncSearch = p.load ? OL.debounce(function (q) { runLoad(q); }, 250) : null;
    function onSearch() {
      query = search.value; activeIdx = 0;
      if (p.load) asyncSearch(query); else drawList(false);
    }
    function onKey(e) {
      var d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
      if (d) { e.preventDefault(); if (shown.length) setActive((activeIdx + d + shown.length) % shown.length, true); }
      else if (e.key === "Home" && !search) { e.preventDefault(); setActive(0, true); }
      else if (e.key === "End" && !search) { e.preventDefault(); setActive(shown.length - 1, true); }
      else if (e.key === "Enter" || (e.key === " " && !search)) { e.preventDefault(); activate(shown[activeIdx]); }
      else if (e.key === "Tab") close();
    }

    el.setOptions = function (list) { options = (list || []).slice(); sel.forEach(function (v) { if (chosen[v] == null) chosen[v] = labelOf(v); }); sync(); if (pop) drawList(false); };
    el.focus = function () { trigger.focus(); };
    el.trigger = trigger;
    Object.defineProperty(el, "value", { get: function () { return sel[0] != null ? sel[0] : null; }, set: function (v) { sel = v == null || v === "" ? [] : [v]; sel.forEach(function (x) { chosen[x] = labelOf(x); }); sync(); } });
    Object.defineProperty(el, "values", { get: function () { return sel.slice(); }, set: function (v) { sel = (v || []).slice(); sel.forEach(function (x) { chosen[x] = labelOf(x); }); sync(); } });
    sync();
    return el;
  }

  OL.ui.select = { render: render, states: ["single", "multi", "grouped", "async", "searchable", "error", "disabled"] };
})();
