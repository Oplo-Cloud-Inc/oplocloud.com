/* ==========================================================================
   C-04 Class and section picker.

   One picker for every "which classes": the 80-chip grid in Circulars, the
   class filters, the exam plan, the timetable. A tree, because that is how a
   school thinks of itself:

       Stage         Pre-primary · Primary · Middle · Secondary · Senior secondary
       └ Class       Nursery … XII   (Grade 1 … 12 for a US school)
         └ Section   A · B · C · D

   Tick a section, a whole class ("all 4"), or a whole stage ("Select all
   secondary"). Type "X-" to narrow the tree to the sections that match. The
   summary reads the way a person would say it: "Class X (all 4), XI-A, XI-B".

   Keyboard — the tree pattern: ↑ ↓ move, → opens, ← closes (or goes to the
   parent), Space ticks, Home/End jump. A single picker (multiple:false) picks
   one section and closes.

   classes: [{ id: "X", label: "Class X", stage: "secondary", sections:
     [{ id: "X-A", label: "X-A", count: 45 }] }]. A class with no stage is placed
   by its position in the school: Nursery–UKG pre-primary, I–V primary, VI–VIII
   middle, IX–X secondary, XI–XII senior secondary.

   OL.ui.classpicker.render({ label, classes, values, multiple, optional,
     helper, error, placeholder, onChange(sectionIds) }) → field with .values,
   .setClasses(list), .setError, .focus()
   OL.ui.classpicker.summary(classes, ids) → "Class X (all 4), XI-A"
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };

  var STAGES = ["pre_primary", "primary", "middle", "secondary", "senior_secondary"];
  var ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
  function levelOf(label) {
    var s = String(label).replace(/^(class|grade)\s+/i, "").trim().toUpperCase();
    if (/^(NURSERY|LKG|UKG|KG|PRE|PLAY)/.test(s)) return 0;
    return ROMAN[s] || (/^\d+$/.test(s) ? +s : 0);
  }
  function stageOf(c) {
    if (c.stage) return c.stage;
    var n = levelOf(c.label || c.id);
    return n <= 0 ? "pre_primary" : n <= 5 ? "primary" : n <= 8 ? "middle" : n <= 10 ? "secondary" : "senior_secondary";
  }

  function summary(classes, ids) {
    var on = {}, parts = [];
    ids.forEach(function (i) { on[i] = true; });
    classes.forEach(function (c) {
      var n = c.sections.filter(function (s) { return on[s.id]; });
      if (!n.length) return;
      if (n.length === c.sections.length && c.sections.length > 1) parts.push(t("classpicker.all_of", { name: c.label, n: c.sections.length }));
      else n.forEach(function (s) { parts.push(s.label); });
    });
    return parts;
  }

  function render(p) {
    p = p || {};
    var multi = p.multiple !== false, classes = p.classes || [], sel = {}, open = {}, query = "", pop = null, ov = null, search = null, treeEl = null;
    (p.values || []).forEach(function (v) { sel[v] = true; });
    var id = OL.uid("cp"), helpId = id + "-h", errId = id + "-e";

    var valueEl = h("span", { class: "ol-select__value" });
    var trigger = h("button", { type: "button", id: id, class: "ol-select__ctl", "aria-haspopup": "tree", "aria-expanded": "false",
      on: { click: toggleOpen, keydown: function (e) { if (e.key === "ArrowDown") { e.preventDefault(); openPop(); } } } }, valueEl, OL.icon("chevron-down", 16));
    var label = p.label ? h("label", { class: "ol-label", for: id }, p.label, p.optional ? h("span", { class: "ol-label__opt", text: " " + t("common.optional") }) : null) : null;
    var helper = h("p", { class: "ol-help", id: helpId }), error = h("p", { class: "ol-error", id: errId, role: "alert", hidden: true });
    var el = h("div", { class: OL.cx("ol-field", "ol-select", "ol-classpicker", p.class) }, label, h("div", { class: "ol-select__box" }, trigger),
      h("div", { class: "ol-field__foot" }, h("div", { class: "ol-field__msgs" }, helper, error)));
    function describe() {
      var ids = []; if (!error.hidden) ids.push(errId); if (helper.textContent) ids.push(helpId);
      if (ids.length) trigger.setAttribute("aria-describedby", ids.join(" ")); else trigger.removeAttribute("aria-describedby");
    }
    el.setHelper = function (m) { helper.textContent = m || ""; helper.hidden = !m; describe(); };
    el.setError = function (m) {
      OL.clear(error); error.hidden = !m;
      if (m) { error.appendChild(OL.icon("alert-circle", 16)); error.appendChild(document.createTextNode(m)); }
      helper.hidden = !!m || !helper.textContent; el.classList.toggle("is-invalid", !!m);
      if (m) trigger.setAttribute("aria-invalid", "true"); else trigger.removeAttribute("aria-invalid");
      describe();
    };
    el.setHelper(p.helper); if (p.error) el.setError(p.error);

    function ids() { return Object.keys(sel).filter(function (k) { return sel[k]; }); }
    function syncTrigger() {
      var parts = summary(classes, ids());
      var text = !parts.length ? null : parts.length > 3 ? parts.slice(0, 3).join(", ") + " +" + (parts.length - 3) : parts.join(", ");
      valueEl.textContent = text || p.placeholder || t("classpicker.placeholder");
      valueEl.classList.toggle("is-placeholder", !text);
    }
    function emit() { if (p.onChange) p.onChange(ids()); }

    /* ---------------------------------------------------------------- the tree */
    function tree() {
      var by = {}; STAGES.forEach(function (s) { by[s] = []; });
      classes.forEach(function (c) { (by[stageOf(c)] || by.secondary).push(c); });
      return STAGES.filter(function (s) { return by[s].length; }).map(function (s) { return { id: "stage:" + s, label: t("classpicker.stage." + s), classes: by[s] }; });
    }
    function secsOf(node) { return node.classes ? [].concat.apply([], node.classes.map(function (c) { return c.sections; })) : node.sections; }
    function state(secs) {
      var n = secs.filter(function (s) { return sel[s.id]; }).length;
      return n === 0 ? "false" : n === secs.length ? "true" : "mixed";
    }
    function setAll(secs, on) { secs.forEach(function (s) { if (on) sel[s.id] = true; else delete sel[s.id]; }); }
    function matches(text) { return !query || text.toLowerCase().indexOf(query.toLowerCase()) > -1; }

    function drawTree() {
      var keepFocus = treeEl.contains(document.activeElement) ? document.activeElement.getAttribute("data-id") : null;
      OL.clear(treeEl);
      var any = false;
      tree().forEach(function (st) {
        var cls = st.classes.map(function (c) {
          var secs = c.sections.filter(function (s) { return matches(s.label) || matches(c.label) || matches(st.label); });
          return secs.length ? { c: c, secs: secs } : null;
        }).filter(Boolean);
        if (!cls.length) return;
        any = true;
        var stOpen = query ? true : isOpen(st.id);
        var stLi = item(st.id, 1, st.label, state(secsOf(st)), stOpen, secsOf(st).length, function (on) { setAll(secsOf(st), on); });
        var grp = h("ul", { role: "group" });
        if (stOpen) cls.forEach(function (x) {
          var cOpen = query ? true : isOpen(x.c.id);
          var cLi = item(x.c.id, 2, x.c.label, state(x.c.sections), cOpen, x.c.sections.length, function (on) { setAll(x.c.sections, on); });
          var g2 = h("ul", { role: "group" });
          if (cOpen) x.secs.forEach(function (s) {
            g2.appendChild(item(s.id, 3, s.label, sel[s.id] ? "true" : "false", null, s.count, function (on) {
              if (!multi) { sel = {}; sel[s.id] = true; syncTrigger(); emit(); close(); return; }
              if (on) sel[s.id] = true; else delete sel[s.id];
            }));
          });
          cLi.appendChild(g2); grp.appendChild(cLi);
        });
        stLi.appendChild(grp); treeEl.appendChild(stLi);
      });
      if (!any) treeEl.appendChild(h("li", { class: "ol-opt ol-opt--note", role: "none", text: t("classpicker.none") }));
      var rovers = OL.$$("[role=treeitem]", treeEl);
      var target = (keepFocus && treeEl.querySelector('[data-id="' + keepFocus + '"]')) || rovers[0];
      rovers.forEach(function (n) { n.setAttribute("tabindex", n === target ? "0" : "-1"); });
      if (keepFocus && target) target.focus();
    }

    function item(nid, level, text, st, expanded, count, onTick) {
      var leaf = expanded === null;
      var li = h("li", { role: "treeitem", class: OL.cx("ol-tree__item", "is-l" + level), "aria-level": level, "aria-checked": st, "aria-expanded": leaf ? null : (expanded ? "true" : "false"), "data-id": nid, tabindex: "-1" });
      var row = h("div", { class: "ol-tree__row" });
      if (!leaf) row.appendChild(h("button", { type: "button", class: "ol-iconbtn ol-tree__tw", tabindex: "-1", "aria-hidden": "true", on: { click: function (e) { e.stopPropagation(); toggleNode(nid); } } }, OL.icon(expanded ? "chevron-down" : "chevron-right", 16)));
      else row.appendChild(h("span", { class: "ol-tree__tw" }));
      if (multi || leaf) row.appendChild(h("span", { class: OL.cx("ol-check", st === "true" && "is-on", st === "mixed" && "is-mixed"), "aria-hidden": "true" }, st === "true" ? OL.icon("check", 16) : st === "mixed" ? OL.icon("minus", 16) : null));
      row.appendChild(h("span", { class: "ol-tree__label", text: text }));
      if (count != null && level === 3) row.appendChild(h("span", { class: "ol-opt__count", text: OL.fmt.num(count) }));
      else if (count != null && !leaf) row.appendChild(h("span", { class: "ol-opt__count", text: t("classpicker.n_sections", { n: count }) }));
      row.addEventListener("click", function () { tick(nid, st, onTick, leaf); });
      li.appendChild(row);
      li._tick = function () { tick(nid, st, onTick, leaf); };
      return li;
    }
    function tick(nid, st, onTick, leaf) {
      if (!multi && !leaf) { toggleNode(nid); return; }       // a single picker only picks sections
      onTick(st !== "true");
      if (multi) { syncTrigger(); emit(); }
      drawTree();
      var n = treeEl.querySelector('[data-id="' + nid + '"]'); if (n) n.focus();
      OL.announce(t("classpicker.n_selected", { n: ids().length }));
    }
    /* A stage starts open, a class closed; a search opens everything it matches. */
    function isOpen(nid) { return nid.indexOf("stage:") === 0 ? open[nid] !== false : !!open[nid]; }
    function toggleNode(nid) {
      open[nid] = !isOpen(nid);
      drawTree();
      var n = treeEl.querySelector('[data-id="' + nid + '"]'); if (n) n.focus();
    }

    function onKey(e) {
      var cur = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("role") === "treeitem" ? document.activeElement : null;
      var items = OL.$$("[role=treeitem]", treeEl);
      if (!cur) { if (e.key === "ArrowDown" && e.target === search) { e.preventDefault(); if (items[0]) items[0].focus(); } return; }
      var i = items.indexOf(cur), expanded = cur.getAttribute("aria-expanded");
      function go(n) { if (n) { items.forEach(function (x) { x.setAttribute("tabindex", "-1"); }); n.setAttribute("tabindex", "0"); n.focus(); } }
      if (e.key === "ArrowDown") { e.preventDefault(); go(items[i + 1]); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (i === 0 && search) search.focus(); else go(items[i - 1]); }
      else if (e.key === "Home") { e.preventDefault(); go(items[0]); }
      else if (e.key === "End") { e.preventDefault(); go(items[items.length - 1]); }
      else if (e.key === "ArrowRight") { e.preventDefault(); if (expanded === "false") toggleNode(cur.getAttribute("data-id")); else if (expanded === "true") go(items[i + 1]); }
      else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (expanded === "true" && !query) toggleNode(cur.getAttribute("data-id"));
        else { var par = cur.parentNode.closest("[role=treeitem]"); if (par) go(par); }
      }
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); cur._tick(); }
      else if (e.key === "Tab") close();
    }

    function openPop() {
      if (pop) return;
      query = "";
      search = h("input", { type: "search", class: "ol-select__search", "aria-label": t("classpicker.search"), placeholder: t("classpicker.search"), autocomplete: "off",
        on: { input: function () { query = search.value; drawTree(); } } });
      treeEl = h("ul", { class: "ol-tree", role: "tree", "aria-multiselectable": multi ? "true" : null, "aria-label": p.label || t("classpicker.placeholder") });
      pop = h("div", { class: "ol-pop ol-select__pop ol-classpop" }, h("div", { class: "ol-select__sb" }, OL.icon("search", 16), search), treeEl);
      if (multi) pop.appendChild(h("div", { class: "ol-select__foot" },
        h("span", { class: "ol-help", "aria-live": "polite", text: "" }),
        OL.ui.button.render({ label: t("common.clear"), variant: "ghost", size: "sm", onClick: function () { sel = {}; syncTrigger(); emit(); drawTree(); } }),
        OL.ui.button.render({ label: t("common.done"), variant: "secondary", size: "sm", onClick: function () { close(); } })));
      document.body.appendChild(pop);
      OL.place(pop, trigger, { matchWidth: true });
      trigger.setAttribute("aria-expanded", "true");
      ov = OL.overlay.push({ el: pop, trap: false, outside: true, trigger: trigger, onClose: function () { trigger.setAttribute("aria-expanded", "false"); pop.remove(); pop = null; ov = null; } });
      pop.addEventListener("keydown", onKey);
      // the stage that holds a ticked section starts open, so the person sees what they have
      classes.forEach(function (c) { if (c.sections.some(function (s) { return sel[s.id]; })) { open[c.id] = true; } });
      drawTree();
      search.focus();
    }
    function close() { if (ov) ov.close("pick"); }
    function toggleOpen() { if (pop) close(); else openPop(); }

    el.setClasses = function (list) { classes = list || []; syncTrigger(); if (pop) drawTree(); };
    el.focus = function () { trigger.focus(); };
    Object.defineProperty(el, "values", { get: ids, set: function (v) { sel = {}; (v || []).forEach(function (x) { sel[x] = true; }); syncTrigger(); if (pop) drawTree(); } });
    syncTrigger();
    return el;
  }

  OL.ui.classpicker = { render: render, summary: summary, stageOf: stageOf, states: ["multiple", "single", "searching", "all-of-class", "all-of-stage"] };
})();
