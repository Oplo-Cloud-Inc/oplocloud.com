/* ==========================================================================
   C-06 Date and time.

   A date is typed or picked, shown the way the school writes it
   (dd/mm/yyyy — mm/dd/yyyy for a US school), and stored as ISO. The
   placeholder shows the format; the browser's own locale guess is never used,
   and <input type="date"> is not either, because it follows the device.

     date       typed field + calendar. Types 26/10/2026, 26-10-26, 26.10.2026.
     range      two date fields and presets (Today, This week, This term)
     month      a year and twelve months (value "2026-10")
     time       typed or chosen from a list (value "08:55")
     datetime   a date and a time

   The calendar is a grid: arrows move a day or a week, Home/End the start and
   end of the week, PageUp/PageDown a month (with Shift, a year), Enter picks,
   Esc closes. Today is marked; a day outside min/max is dimmed and unreachable.

   OL.ui.date.render({ label, value, min, max, optional, helper, error, disabled,
     onChange })                     → field with .value (ISO or ""), .setError…
   OL.ui.date.popover({ anchor, value, min, max, onPick })   the bare calendar
   OL.ui.date.range({ label, value: { from, to }, presets, onChange })
   OL.ui.month.render({ label, value, onChange })
   OL.ui.time.render({ label, value, step, onChange })
   OL.ui.datetime.render({ label, value: "2026-10-26T09:30", onChange })
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); }, F = OL.fmt, C = F.cal;

  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function inRange(iso, min, max) { return (!min || iso >= min) && (!max || iso <= max); }
  function weekdayHeads() {
    var first = F.current().weekStart === 0 ? 6 : 0, long = C.names("weekday"), out = [];
    for (var i = 0; i < 7; i++) { var n = long[(first + i) % 7]; out.push({ short: n.slice(0, 2), long: n }); }
    return out;
  }

  /* ------------------------------------------------------------ the calendar */
  function calendar(opts) {
    var sel = opts.value || "", min = opts.min, max = opts.max, todayIso = F.today();
    var focusIso = sel || (inRange(todayIso, min, max) ? todayIso : (min || max || todayIso));
    var view = C.parse(focusIso);
    var titleId = OL.uid("cal");
    var el = h("div", { class: "ol-cal" });

    function draw(keepFocus) {
      OL.clear(el);
      var head = h("div", { class: "ol-cal__head" },
        OL.ui.button.render({ iconOnly: true, icon: "chevron-left", ariaLabel: t("date.prev_month"), variant: "ghost", size: "sm", onClick: function () { shift(-1); } }),
        h("div", { class: "ol-cal__title", id: titleId, "aria-live": "polite", text: C.names("month")[view.m - 1] + " " + view.y }),
        OL.ui.button.render({ iconOnly: true, icon: "chevron-right", ariaLabel: t("date.next_month"), variant: "ghost", size: "sm", onClick: function () { shift(1); } }));
      var grid = h("table", { class: "ol-cal__grid", role: "grid", "aria-labelledby": titleId });
      var tr = h("tr");
      weekdayHeads().forEach(function (d) { tr.appendChild(h("th", { scope: "col", abbr: d.long }, h("span", { "aria-hidden": "true", text: d.short }), h("span", { class: "ol-sr", text: d.long }))); });
      grid.appendChild(h("thead", null, tr));
      var body = h("tbody");
      C.monthGrid(view.y, view.m).forEach(function (row) {
        var r = h("tr");
        row.forEach(function (iso) {
          var p = C.parse(iso), out = p.m !== view.m, ok = inRange(iso, min, max);
          var btn = h("button", { type: "button", class: OL.cx("ol-day", out && "is-out", iso === todayIso && "is-today", iso === sel && "is-sel", !ok && "is-off"),
            tabindex: iso === focusIso ? "0" : "-1", "data-iso": iso, "aria-pressed": iso === sel ? "true" : "false", "aria-current": iso === todayIso ? "date" : null, "aria-disabled": ok ? null : "true",
            "aria-label": F.dateLong(iso), text: String(p.d), on: { click: function () { if (ok) pick(iso); } } });
          r.appendChild(h("td", { role: "gridcell", "aria-selected": iso === sel ? "true" : "false" }, btn));
        });
        body.appendChild(r);
      });
      grid.appendChild(body);
      var foot = h("div", { class: "ol-cal__foot" },
        OL.ui.button.render({ label: t("date.today"), variant: "ghost", size: "sm", disabled: !inRange(todayIso, min, max), onClick: function () { pick(todayIso); } }),
        opts.clearable ? OL.ui.button.render({ label: t("common.clear"), variant: "ghost", size: "sm", onClick: function () { pick(""); } }) : null);
      el.appendChild(head); el.appendChild(grid); el.appendChild(foot);
      if (keepFocus) { var b = el.querySelector('[data-iso="' + focusIso + '"]'); if (b) b.focus(); }
    }
    function shift(n) { var d = C.addMonths(view.y + "-" + pad(view.m) + "-01", n); view = C.parse(d); focusIso = C.addMonths(focusIso, n); draw(false); }
    function pick(iso) { sel = iso; if (opts.onPick) opts.onPick(iso); }
    function moveTo(iso, move) {
      if (min && iso < min) iso = min; if (max && iso > max) iso = max;
      focusIso = iso; var p = C.parse(iso);
      if (p.m !== view.m || p.y !== view.y) view = p;
      draw(true);
    }
    el.addEventListener("keydown", function (e) {
      var b = e.target.closest ? e.target.closest(".ol-day") : null;
      if (!b) return;
      var d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (d) { e.preventDefault(); moveTo(C.addDays(focusIso, d)); return; }
      var first = F.current().weekStart === 0 ? 6 : 0, off = (C.dow(focusIso) - first + 7) % 7;
      if (e.key === "Home") { e.preventDefault(); moveTo(C.addDays(focusIso, -off)); }
      else if (e.key === "End") { e.preventDefault(); moveTo(C.addDays(focusIso, 6 - off)); }
      else if (e.key === "PageUp") { e.preventDefault(); moveTo(C.addMonths(focusIso, e.shiftKey ? -12 : -1)); }
      else if (e.key === "PageDown") { e.preventDefault(); moveTo(C.addMonths(focusIso, e.shiftKey ? 12 : 1)); }
    });
    draw(false);
    el.focusDay = function () { var b = el.querySelector(".ol-day[tabindex='0']"); if (b) b.focus(); };
    return el;
  }

  function popover(o) {
    var pop = h("div", { class: "ol-pop ol-datepop", role: "dialog", "aria-label": t("date.choose") }), ov;
    var cal = calendar({ value: o.value, min: o.min, max: o.max, clearable: o.clearable, onPick: function (iso) { ov.close(); if (o.onPick) o.onPick(iso); } });
    pop.appendChild(cal);
    document.body.appendChild(pop);
    OL.place(pop, o.anchor);
    ov = OL.overlay.push({ el: pop, trap: true, outside: true, trigger: o.trigger || o.anchor, onClose: function () { pop.remove(); } });
    cal.focusDay();
    return ov;
  }

  /* ------------------------------------------------------------------- date */
  function date(p) {
    p = p || {};
    var iso = p.value || "";
    var field = OL.ui.input.render({ label: p.label, name: p.name, value: iso ? F.date(iso) : "", placeholder: F.datePlaceholder(), helper: p.helper, error: p.error,
      optional: p.optional, disabled: p.disabled, inputMode: "numeric", suffix: null, class: p.class, clearErrorOnInput: true,
      onBlur: function (v) { commit(v); } });
    var btn = OL.ui.button.render({ iconOnly: true, icon: "calendar", ariaLabel: t("date.choose"), variant: "ghost", size: "sm", disabled: p.disabled,
      onClick: function () { popover({ anchor: field.querySelector(".ol-input__box"), trigger: btn, value: iso, min: p.min, max: p.max, clearable: p.optional, onPick: function (v) { set(v, true); } }); } });
    field.querySelector(".ol-input__box").appendChild(btn);
    field.input.addEventListener("keydown", function (e) { if (e.key === "Enter") commit(field.input.value); });

    function commit(text) {
      text = (text || "").trim();
      if (!text) { if (iso) { iso = ""; if (p.onChange) p.onChange(""); } return; }
      var v = F.parseDate(text);
      if (!v) { field.setError(t("date.invalid", { format: F.datePlaceholder() })); return; }
      if (!inRange(v, p.min, p.max)) { field.setError(t("date.out_of_range", { min: p.min ? F.date(p.min) : "…", max: p.max ? F.date(p.max) : "…" })); return; }
      set(v, false);
    }
    function set(v, reflect) {
      iso = v; field.setError("");
      field.input.value = v ? F.date(v) : "";                // normalises 26-10-26 to 26/10/2026
      if (p.onChange) p.onChange(v);
    }
    Object.defineProperty(field, "value", { get: function () { return iso; }, set: function (v) { iso = v || ""; field.input.value = iso ? F.date(iso) : ""; field.setError(""); } });
    return field;
  }

  /* ----------------------------------------------------------------- range */
  function range(p) {
    var v = { from: (p.value && p.value.from) || "", to: (p.value && p.value.to) || "" };
    var from, to, presets = p.presets || defaultPresets();
    function emit() {
      if (v.from && v.to && v.from > v.to) { to.setError(t("date.range_order")); return; }
      to.setError(""); if (p.onChange) p.onChange({ from: v.from, to: v.to });
    }
    from = date({ label: t("date.from"), value: v.from, max: v.to || p.max, min: p.min, optional: p.optional, onChange: function (x) { v.from = x; emit(); } });
    to = date({ label: t("date.to"), value: v.to, min: v.from || p.min, max: p.max, optional: p.optional, onChange: function (x) { v.to = x; emit(); } });
    var chips = OL.ui.chips.render({ label: t("date.presets"), items: presets.map(function (x) { return { value: x.key, label: x.label }; }), value: null,
      onChange: function (k) {
        var pr = presets.filter(function (x) { return x.key === k; })[0];
        if (!pr) return;
        var r = pr.range(); v.from = r.from; v.to = r.to; from.value = r.from; to.value = r.to; emit();
      } });
    var el = h("fieldset", { class: OL.cx("ol-daterange", p.class) }, p.label ? h("legend", { class: "ol-label", text: p.label }) : null, h("div", { class: "ol-daterange__pair" }, from, to), chips);
    Object.defineProperty(el, "value", { get: function () { return { from: v.from, to: v.to }; } });
    return el;
  }
  function defaultPresets() {
    return [
      { key: "today", label: t("date.today"), range: function () { var d = F.today(); return { from: d, to: d }; } },
      { key: "week", label: t("date.this_week"), range: function () { var s = C.weekStart(F.today()); return { from: s, to: C.addDays(s, 6) }; } },
      { key: "month", label: t("date.this_month"), range: function () { var q = C.parse(F.today()); return { from: q.y + "-" + pad(q.m) + "-01", to: q.y + "-" + pad(q.m) + "-" + pad(C.daysIn(q.y, q.m)) }; } }
    ];
  }

  /* ----------------------------------------------------------------- month */
  /* The twelve-month grid with a year stepper; value is "2026-10". */
  function monthPopover(o) {
    var val = o.value || "", yr = val ? +val.slice(0, 4) : C.parse(F.today()).y;
    var pop = h("div", { class: "ol-pop ol-datepop", role: "dialog", "aria-label": t("date.choose_month") }), ov;
    function draw() {
      OL.clear(pop);
      pop.appendChild(h("div", { class: "ol-cal__head" },
        OL.ui.button.render({ iconOnly: true, icon: "chevron-left", ariaLabel: t("date.prev_year"), variant: "ghost", size: "sm", onClick: function () { yr--; draw(); } }),
        h("div", { class: "ol-cal__title", text: String(yr) }),
        OL.ui.button.render({ iconOnly: true, icon: "chevron-right", ariaLabel: t("date.next_year"), variant: "ghost", size: "sm", onClick: function () { yr++; draw(); } })));
      var g = h("div", { class: "ol-monthgrid" });
      C.names("month").forEach(function (n, i) {
        var key = yr + "-" + pad(i + 1);
        g.appendChild(h("button", { type: "button", class: OL.cx("ol-day ol-day--month", key === val && "is-sel"), "aria-pressed": key === val ? "true" : "false", text: n.slice(0, 3),
          "aria-label": n + " " + yr, on: { click: function () { ov.close(); if (o.onPick) o.onPick(key); } } }));
      });
      pop.appendChild(g);
    }
    draw(); document.body.appendChild(pop); OL.place(pop, o.anchor);
    ov = OL.overlay.push({ el: pop, trap: true, outside: true, trigger: o.trigger || o.anchor, onClose: function () { pop.remove(); } });
    (pop.querySelector(".is-sel") || pop.querySelector(".ol-day--month")).focus();
    return ov;
  }
  function month(p) {
    p = p || {};
    var val = p.value || "";
    var field = OL.ui.input.render({ label: p.label, value: val ? F.monthYear(val + "-01") : "", placeholder: t("date.month_placeholder"), optional: p.optional, helper: p.helper, error: p.error, readOnly: true });
    var box = field.querySelector(".ol-input__box");
    function open() { monthPopover({ anchor: box, trigger: field.input, value: val, onPick: function (key) { val = key; field.input.value = F.monthYear(key + "-01"); if (p.onChange) p.onChange(key); } }); }
    field.input.addEventListener("click", open);
    field.input.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); open(); } });
    Object.defineProperty(field, "value", { get: function () { return val; }, set: function (v) { val = v || ""; field.input.value = val ? F.monthYear(val + "-01") : ""; } });
    return field;
  }

  /* ------------------------------------------------------------------ time */
  function parseTime(s) {
    var m = /^\s*(\d{1,2})(?:[:.h]?(\d{2}))?\s*([ap])?\.?m?\.?\s*$/i.exec(String(s || ""));
    if (!m) return null;
    var hh = +m[1], mm = m[2] ? +m[2] : 0, ap = m[3] && m[3].toLowerCase();
    if (mm > 59) return null;
    if (ap) { if (hh < 1 || hh > 12) return null; hh = hh % 12 + (ap === "p" ? 12 : 0); }
    else if (hh > 23) return null;
    return pad(hh) + ":" + pad(mm);
  }
  function time(p) {
    p = p || {};
    var val = p.value || "", step = p.step || 15;
    var field = OL.ui.input.render({ label: p.label, value: val ? F.time(val) : "", placeholder: F.current().hour12 ? "9:30 am" : "09:30", optional: p.optional, helper: p.helper, error: p.error, disabled: p.disabled, inputMode: "numeric",
      onBlur: function (v) { commit(v); } });
    var btn = OL.ui.button.render({ iconOnly: true, icon: "clock", ariaLabel: t("date.choose_time"), variant: "ghost", size: "sm", disabled: p.disabled, onClick: function () { openList(); } });
    field.querySelector(".ol-input__box").appendChild(btn);
    field.input.addEventListener("keydown", function (e) { if (e.key === "Enter") commit(field.input.value); });
    function commit(text) {
      text = (text || "").trim();
      if (!text) { val = ""; if (p.onChange) p.onChange(""); return; }
      var v = parseTime(text);
      if (!v) { field.setError(t("date.invalid_time")); return; }
      set(v);
    }
    function set(v) { val = v; field.setError(""); field.input.value = F.time(v); if (p.onChange) p.onChange(v); }
    function openList() {
      var pop = h("div", { class: "ol-pop ol-menu ol-timelist", role: "listbox", "aria-label": t("date.choose_time") }), ov;
      for (var m = (p.from || 0); m < (p.to || 24 * 60); m += step) {
        (function (v) {
          pop.appendChild(h("button", { type: "button", class: OL.cx("ol-menu__item", v === val && "is-on"), role: "option", "aria-selected": v === val ? "true" : "false", tabindex: "-1", text: F.time(v),
            on: { click: function () { ov.close(); set(v); } } }));
        })(pad(Math.floor(m / 60)) + ":" + pad(m % 60));
      }
      document.body.appendChild(pop); OL.place(pop, field.querySelector(".ol-input__box"));
      ov = OL.overlay.push({ el: pop, trap: false, outside: true, trigger: btn, onClose: function () { pop.remove(); } });
      var cur = pop.querySelector(".is-on") || pop.querySelector(".ol-menu__item"); cur.focus(); cur.scrollIntoView({ block: "center" });
      pop.addEventListener("keydown", function (e) {
        var its = OL.$$(".ol-menu__item", pop), i = its.indexOf(document.activeElement);
        if (e.key === "ArrowDown") { e.preventDefault(); its[Math.min(its.length - 1, i + 1)].focus(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); its[Math.max(0, i - 1)].focus(); }
        else if (e.key === "Tab") ov.close();
      });
    }
    Object.defineProperty(field, "value", { get: function () { return val; }, set: function (v) { val = v || ""; field.input.value = val ? F.time(val) : ""; } });
    return field;
  }

  /* -------------------------------------------------------------- datetime */
  function datetime(p) {
    p = p || {};
    var d = (p.value || "").slice(0, 10), tm = (p.value || "").slice(11, 16);
    function emit() { if (p.onChange) p.onChange(d && tm ? d + "T" + tm : d ? d : ""); }
    var df = date({ label: p.label, value: d, min: p.min, max: p.max, optional: p.optional, onChange: function (v) { d = v; emit(); } });
    var tf = time({ label: t("date.time"), value: tm, step: p.step, optional: p.optional, onChange: function (v) { tm = v; emit(); } });
    var el = h("div", { class: OL.cx("ol-datetime", p.class) }, df, tf);
    Object.defineProperty(el, "value", { get: function () { return d && tm ? d + "T" + tm : d; } });
    return el;
  }

  date.render = date; date.popover = popover; date.range = range;
  OL.ui.date = date;
  OL.ui.month = { render: month, popover: monthPopover, states: ["default", "readonly", "error"] };
  OL.ui.time = { render: time, parse: parseTime, states: ["default", "error"] };
  OL.ui.datetime = { render: datetime, states: ["default"] };
  date.states = ["default", "error", "min-max", "range"];
})();
