/* ==========================================================================
   C-08 Date navigator.

   ‹  label  ›  Today        one component for the register, the calendar, the
   cover desk and "by subject" — the audit found four, each with its own idea of
   what Next meant.

   mode   day    "Mon 26 Oct 2026"           steps one day (or to the next working day)
          week   "26 Oct – 1 Nov 2026"       steps seven days; value is the week's first day
          month  "October 2026"              steps a month; value is its first day
          term   "Term 2"                    steps through the `terms` given
   The label is a button: it opens the calendar (day) or month picker, so the
   far end of a term is two clicks away, not forty.

   ← and → move the navigator while it has focus. Today is shown only when the
   view is not already on it. A day the school is closed (`isOff`) is skipped
   by Previous/Next, up to two weeks, so a register never opens on a Sunday.

   OL.ui.datenav.render({ mode, value, min, max, isOff, terms, label,
     onChange(value, range) }) → element with .value, .set(value)
   range is { from, to } in ISO — what the screen asks the server for.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); }, F = OL.fmt, C = F.cal;

  function render(p) {
    var mode = p.mode || "day", value = p.value || (mode === "term" ? (p.terms && p.terms[0] && p.terms[0].id) : F.today());
    if (mode === "week") value = C.weekStart(value);
    if (mode === "month") value = value.slice(0, 7) + "-01";

    function rangeOf(v) {
      if (mode === "day") return { from: v, to: v };
      if (mode === "week") return { from: v, to: C.addDays(v, 6) };
      if (mode === "month") { var q = C.parse(v); return { from: v, to: v.slice(0, 8) + C.daysIn(q.y, q.m) }; }
      var term = (p.terms || []).filter(function (x) { return x.id === v; })[0];
      return term ? { from: term.from, to: term.to } : { from: "", to: "" };
    }
    function labelOf(v) {
      if (mode === "day") return C.names("weekday")[C.dow(v)].slice(0, 3) + " " + F.dateMed(v);
      if (mode === "week") { var r = rangeOf(v), a = C.parse(r.from), b = C.parse(r.to); return a.y === b.y ? F.dateShort(r.from) + " – " + F.dateMed(r.to) : F.dateMed(r.from) + " – " + F.dateMed(r.to); }
      if (mode === "month") return F.monthYear(v);
      var term = (p.terms || []).filter(function (x) { return x.id === v; })[0];
      return term ? term.label : "";
    }
    function isCurrent(v) {
      var td = F.today();
      if (mode === "term") { var r = rangeOf(v); return r.from <= td && td <= r.to; }
      var rr = rangeOf(v); return rr.from <= td && td <= rr.to;
    }
    function stepped(v, dir) {
      if (mode === "day") {
        var n = C.addDays(v, dir), guard = 0;
        while (p.isOff && p.isOff(n) && guard++ < 14) n = C.addDays(n, dir);
        return p.isOff && p.isOff(n) ? C.addDays(v, dir) : n;
      }
      if (mode === "week") return C.addDays(v, 7 * dir);
      if (mode === "month") return C.addMonths(v, dir);
      var ids = (p.terms || []).map(function (x) { return x.id; }), i = ids.indexOf(v) + dir;
      return i >= 0 && i < ids.length ? ids[i] : v;
    }
    function allowed(v) {
      if (mode === "term") return true;
      var r = rangeOf(v);
      return (!p.min || r.to >= p.min) && (!p.max || r.from <= p.max);
    }

    var labelBtn = h("button", { type: "button", class: "ol-datenav__label", "aria-haspopup": mode === "term" ? "menu" : "dialog", on: { click: openPicker } });
    var prev = OL.ui.button.render({ iconOnly: true, icon: "chevron-left", ariaLabel: t("datenav.prev_" + mode), variant: "secondary", onClick: function () { go(stepped(value, -1)); } });
    var next = OL.ui.button.render({ iconOnly: true, icon: "chevron-right", ariaLabel: t("datenav.next_" + mode), variant: "secondary", onClick: function () { go(stepped(value, 1)); } });
    var todayBtn = OL.ui.button.render({ label: mode === "term" ? t("datenav.this_term") : t("date.today"), variant: "ghost", size: "sm", onClick: function () { go(currentValue()); } });
    var el = h("div", { class: OL.cx("ol-datenav", p.class), role: "group", "aria-label": p.label || t("datenav.label") }, prev, labelBtn, next, todayBtn);
    var status = h("span", { class: "ol-sr", role: "status" });
    el.appendChild(status);

    function currentValue() {
      if (mode === "term") { var cur = (p.terms || []).filter(function (x) { return isCurrent(x.id); })[0]; return cur ? cur.id : value; }
      var td = F.today();
      return mode === "week" ? C.weekStart(td) : mode === "month" ? td.slice(0, 7) + "-01" : td;
    }
    function draw() {
      labelBtn.textContent = labelOf(value);
      var at = isCurrent(value);
      todayBtn.hidden = at;
      prev.setDisabled(!allowed(stepped(value, -1)) || stepped(value, -1) === value);
      next.setDisabled(!allowed(stepped(value, 1)) || stepped(value, 1) === value);
    }
    function go(v, silent) {
      if (!allowed(v) || v === value) return;
      value = v; draw();
      status.textContent = labelOf(v);
      if (!silent && p.onChange) p.onChange(value, rangeOf(value));
    }
    function openPicker() {
      if (mode === "day" || mode === "week") {
        OL.ui.date.popover({ anchor: labelBtn, value: value, min: p.min, max: p.max, onPick: function (iso) { go(mode === "week" ? C.weekStart(iso) : iso); labelBtn.focus(); } });
      } else if (mode === "month") {
        OL.ui.month.popover({ anchor: labelBtn, value: value.slice(0, 7), onPick: function (m) { go(m + "-01"); labelBtn.focus(); } });
      } else {
        OL.ui.menu.open({ anchor: labelBtn, items: (p.terms || []).map(function (x) { return { label: x.label, onClick: function () { go(x.id); labelBtn.focus(); } }; }) });
      }
    }
    el.addEventListener("keydown", function (e) {
      if (e.target.closest && e.target.closest(".ol-pop")) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); go(stepped(value, -1)); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(stepped(value, 1)); }
    });
    el.set = function (v, silent) { if (mode === "week") v = C.weekStart(v); if (mode === "month") v = v.slice(0, 7) + "-01"; value = v; draw(); if (!silent && p.onChange) p.onChange(value, rangeOf(value)); };
    el.range = function () { return rangeOf(value); };
    Object.defineProperty(el, "value", { get: function () { return value; } });
    draw();
    return el;
  }

  OL.ui.datenav = { render: render, states: ["day", "week", "month", "term"] };
})();
