/* ==========================================================================
   C-11 Grid editor — the engine under the attendance register (T4) and marks
   entry.

   A spreadsheet's keyboard on a real grid (role=grid, one tab stop, roving
   focus), because a teacher taking a register of 45 must never reach for the
   mouse and a marks sheet of 45 × 6 must not need a click per cell.

     arrows, Tab, Shift+Tab   move (Tab wraps to the next row)
     Enter                    commit and move down
     F2, double-click         edit the cell in place
     Esc                      cancel the edit
     a letter in `codes`      sets that code at once and moves down
                              (A → AB, M → ML, X → clear)
     Shift + arrows           extend a selection; a code or Delete fills it
     Ctrl+D                   fill down from the cell above / the top of the selection
     Ctrl+Z, Ctrl+Shift+Z     undo, redo — one step is one keystroke's worth
     Ctrl+S                   save now
     Ctrl+Enter               submit the sheet
     ?                        the shortcut sheet

   Autosave: changes are kept and sent as one batch five seconds after the first,
   on leaving the grid, and on Ctrl+S. The status line says Saving… / Saved 10:42
   am / Not saved — will retry; a failed batch is kept and goes again.

   An invalid cell (a mark over the maximum, a letter where a number goes) stays
   open and focused, outlined in the danger colour with its message beside it; it
   does not lose what was typed.

   Column: { key, label, type: code|number|text|toggle|readonly, header (row
   header), codes: { A: "AB" }, max, min, step, maxLength, width, validate(value,
   row) → message|null, render(row) → text }

   OL.ui.grid.render({ caption, columns, rows, rowKey, onSave(changes) →
     Promise, onSubmit, autosaveMs, advance, shortcuts }) → element with
   .flush(), .setStatus(kind, text), .focus(), .rows
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var MOD = /Mac|iPhone|iPad/.test(navigator.platform || "") ? "⌘" : "Ctrl";

  function render(p) {
    var cols = p.columns, rows = p.rows, rk = p.rowKey || "id", ms = p.autosaveMs == null ? 5000 : p.autosaveMs;
    var cur = { r: 0, c: firstEditable() }, anchor = null, editing = null;
    var undo = [], redo = [], pending = {}, timer = null, saving = false;
    var invalid = {};                                         // "r|c" → message

    function firstEditable() { for (var i = 0; i < cols.length; i++) if (cols[i].type && cols[i].type !== "readonly") return i; return 0; }
    function editable(c) { return cols[c].type && cols[c].type !== "readonly"; }
    function isHeader(c) { return !!cols[c].header; }

    var status = h("span", { class: "ol-grid__status", role: "status", "aria-live": "polite" });
    var msg = h("span", { class: "ol-grid__msg", role: "alert" });
    var table = h("table", { class: "ol-grid", role: "grid", "aria-label": p.caption, "aria-rowcount": rows.length + 1, "aria-colcount": cols.length });
    var thead = h("thead"), tbody = h("tbody");
    table.appendChild(thead); table.appendChild(tbody);
    var help = OL.ui.button.render({ iconOnly: true, icon: "keyboard", ariaLabel: t("grid.shortcuts"), variant: "ghost", size: "sm", onClick: showShortcuts });
    var el = h("div", { class: OL.cx("ol-gridwrap", p.class) },
      h("div", { class: "ol-grid__bar" }, status, msg, help), h("div", { class: "ol-grid__scroll", tabindex: "-1" }, table));

    /* ----------------------------------------------------------------- draw */
    function display(c, row) {
      var col = cols[c], v = row[col.key];
      if (col.render) return col.render(row);
      if (col.type === "toggle") return v ? t("common.yes") : t("common.no");
      return v == null || v === "" ? "" : String(v);
    }
    function drawHead() {
      var tr = h("tr", { role: "row", "aria-rowindex": 1 });
      cols.forEach(function (c, i) { tr.appendChild(h("th", { scope: "col", role: "columnheader", "aria-colindex": i + 1, class: OL.cx("ol-th", i === 0 && "is-sticky", c.type === "number" && "is-num"), text: c.label })); });
      thead.appendChild(tr);
    }
    function cellEl(r, c) { return tbody.querySelector('[data-r="' + r + '"][data-c="' + c + '"]'); }
    function draw() {
      OL.clear(tbody);
      rows.forEach(function (row, r) {
        var tr = h("tr", { role: "row", "aria-rowindex": r + 2 });
        cols.forEach(function (col, c) {
          var hdr = isHeader(c);
          var td = h(hdr ? "th" : "td", { scope: hdr ? "row" : null, role: hdr ? "rowheader" : "gridcell", "aria-colindex": c + 1, "data-r": r, "data-c": c,
            class: OL.cx("ol-cell", hdr && "is-sticky ol-cell--head", col.type === "number" && "is-num", !editable(c) && "is-ro", "ol-cell--" + (col.type || "readonly")),
            tabindex: r === cur.r && c === cur.c ? "0" : "-1", "aria-readonly": editable(c) ? null : "true" });
          paint(td, r, c);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      paintSelection();
    }
    function paint(td, r, c) {
      var row = rows[r], v = row[cols[c].key];
      td.textContent = display(c, row);
      td.setAttribute("data-v", v == null ? "" : String(v));
      var bad = invalid[r + "|" + c];
      td.classList.toggle("is-invalid", !!bad);
      if (bad) { td.setAttribute("aria-invalid", "true"); td.setAttribute("title", bad); } else { td.removeAttribute("aria-invalid"); td.removeAttribute("title"); }
    }
    function paintSelection() {
      var s = rect();
      OL.$$(".ol-cell", tbody).forEach(function (td) {
        var r = +td.getAttribute("data-r"), c = +td.getAttribute("data-c");
        var on = !!s && r >= s.r1 && r <= s.r2 && c >= s.c1 && c <= s.c2 && (s.r1 !== s.r2 || s.c1 !== s.c2);
        td.classList.toggle("is-range", on);
        if (on) td.setAttribute("aria-selected", "true"); else td.removeAttribute("aria-selected");
      });
    }
    function rect() {
      if (!anchor) return null;
      return { r1: Math.min(anchor.r, cur.r), r2: Math.max(anchor.r, cur.r), c1: Math.min(anchor.c, cur.c), c2: Math.max(anchor.c, cur.c) };
    }

    /* ---------------------------------------------------------------- focus */
    function focusCell(r, c, extend) {
      r = Math.max(0, Math.min(rows.length - 1, r)); c = Math.max(0, Math.min(cols.length - 1, c));
      var old = cellEl(cur.r, cur.c); if (old) old.setAttribute("tabindex", "-1");
      if (extend) { if (!anchor) anchor = { r: cur.r, c: cur.c }; } else anchor = null;
      cur = { r: r, c: c };
      var td = cellEl(r, c);
      if (td) { td.setAttribute("tabindex", "0"); td.focus(); td.scrollIntoView({ block: "nearest", inline: "nearest" }); }
      paintSelection();
    }

    /* --------------------------------------------------------------- values */
    function check(col, raw, row) {
      if (col.type === "number") {
        if (col.codes && Object.keys(col.codes).some(function (k) { return col.codes[k] === raw; })) return { v: raw };
        var s = String(raw).trim();
        if (s === "") return { v: "" };
        if (!/^\d+(\.\d+)?$/.test(s)) return { err: t("grid.not_a_number") };
        var n = Number(s);
        if (col.max != null && n > col.max) return { err: t("grid.over_max", { max: OL.fmt.num(col.max) }) };
        if (col.min != null && n < col.min) return { err: t("grid.under_min", { min: OL.fmt.num(col.min) }) };
        return { v: n };
      }
      if (col.type === "text") {
        var tx = String(raw);
        if (col.maxLength && tx.length > col.maxLength) return { err: t("grid.too_long", { max: col.maxLength }) };
        return { v: tx };
      }
      return { v: raw };
    }
    function setValue(batch, r, c, val) {
      var col = cols[c], row = rows[r], from = row[col.key];
      if (from === val || (from == null && val === "")) return;
      row[col.key] = val;
      batch.push({ r: r, c: c, from: from, to: val });
      pending[row[rk] + "|" + col.key] = { rowKey: row[rk], colKey: col.key, value: val };
      var td = cellEl(r, c); if (td) paint(td, r, c);
    }
    function commit(batch) {
      if (!batch.length) return;
      undo.push(batch); redo = [];
      schedule();
    }
    function apply(val, advance) {
      var s = rect() || { r1: cur.r, r2: cur.r, c1: cur.c, c2: cur.c }, batch = [];
      for (var r = s.r1; r <= s.r2; r++) for (var c = s.c1; c <= s.c2; c++) if (editable(c)) {
        var res = check(cols[c], val, rows[r]);
        if (res.err) { flag(r, c, res.err); continue; }
        delete invalid[r + "|" + c]; setValue(batch, r, c, res.v);
      }
      commit(batch);
      if (advance && p.advance !== false) focusCell(Math.min(rows.length - 1, s.r2 + 1), cur.c);
      else paintSelection();
    }
    function flag(r, c, m, keepOpen) {
      invalid[r + "|" + c] = m; var td = cellEl(r, c); if (td && !keepOpen) paint(td, r, c);
      msg.textContent = rows[r] && cols[0].header ? display(0, rows[r]) + ": " + m : m;
    }

    /* ----------------------------------------------------------------- edit */
    function startEdit(r, c, seed) {
      var col = cols[c];
      if (!editable(c) || col.type === "code" || col.type === "toggle") return;
      var td = cellEl(r, c), row = rows[r];
      var input = h("input", { class: "ol-cell__in", type: "text", "aria-label": col.label + ", " + (cols[0].header ? display(0, row) : ""), inputmode: col.type === "number" ? "decimal" : null, maxlength: col.maxLength || null });
      input.value = seed != null ? seed : (row[col.key] == null ? "" : String(row[col.key]));
      OL.clear(td); td.appendChild(input);
      editing = { r: r, c: c, input: input };
      input.focus(); if (seed == null) input.select();
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); endEdit(true, 1, 0); }
        else if (e.key === "Tab") { e.preventDefault(); e.stopPropagation(); endEdit(true, 0, e.shiftKey ? -1 : 1); }
        else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); endEdit(false); }
        else e.stopPropagation();
      });
      input.addEventListener("input", function () { td.classList.remove("is-invalid"); msg.textContent = ""; });
      input.addEventListener("blur", function () { if (editing && editing.input === input) endEdit(true, 0, 0, true); });
    }
    function endEdit(ok, dr, dc, fromBlur) {
      if (!editing) return;
      var e = editing, col = cols[e.c], td = cellEl(e.r, e.c), raw = e.input.value;
      if (ok) {
        var res = check(col, raw, rows[e.r]), extra = !res.err && col.validate ? col.validate(res.v, rows[e.r]) : null;
        if (res.err || extra) {                              // stays open and focused, with what was typed
          flag(e.r, e.c, res.err || extra, true); td.classList.add("is-invalid"); e.input.setAttribute("aria-invalid", "true");
          if (!fromBlur) e.input.focus();
          OL.announce(res.err || extra, true);
          return;
        }
        editing = null; delete invalid[e.r + "|" + e.c]; msg.textContent = "";
        var batch = []; setValue(batch, e.r, e.c, res.v); commit(batch);
      } else { editing = null; delete invalid[e.r + "|" + e.c]; msg.textContent = ""; }
      paint(td, e.r, e.c);
      if (!fromBlur) focusCell(e.r + (dr || 0), e.c + (dc || 0));
    }

    /* ----------------------------------------------------------- keyboard */
    table.addEventListener("keydown", function (e) {
      if (editing) return;
      var td = e.target.closest ? e.target.closest(".ol-cell") : null;
      if (!td) return;
      var r = cur.r, c = cur.c, mod = e.ctrlKey || e.metaKey, k = e.key;
      var col = cols[c];
      if (mod && !e.altKey) {
        if (k === "d" || k === "D") { e.preventDefault(); fillDown(); }
        else if (k === "z" || k === "Z") { e.preventDefault(); e.shiftKey ? redoStep() : undoStep(); }
        else if (k === "y" || k === "Y") { e.preventDefault(); redoStep(); }
        else if (k === "s" || k === "S") { e.preventDefault(); flush(); }
        else if (k === "Enter") { e.preventDefault(); flush().then(function () { if (p.onSubmit) p.onSubmit(); }); }
        else if (k === "Home") { e.preventDefault(); focusCell(0, 0); }
        else if (k === "End") { e.preventDefault(); focusCell(rows.length - 1, cols.length - 1); }
        return;
      }
      var mv = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
      if (mv) { e.preventDefault(); focusCell(r + mv[0], c + mv[1], e.shiftKey); return; }
      if (k === "Tab") {
        var nc = c + (e.shiftKey ? -1 : 1), nr = r;
        if (nc >= cols.length) { nc = 0; nr = r + 1; } else if (nc < 0) { nc = cols.length - 1; nr = r - 1; }
        if (nr < 0 || nr >= rows.length) return;                // leave the grid at its ends
        e.preventDefault(); focusCell(nr, nc); return;
      }
      if (k === "Home") { e.preventDefault(); focusCell(r, 0); }
      else if (k === "End") { e.preventDefault(); focusCell(r, cols.length - 1); }
      else if (k === "PageDown") { e.preventDefault(); focusCell(r + 10, c); }
      else if (k === "PageUp") { e.preventDefault(); focusCell(r - 10, c); }
      else if (k === "Enter") { e.preventDefault(); if (editable(c) && col.type !== "code") startEdit(r, c); else focusCell(r + 1, c); }
      else if (k === "F2") { e.preventDefault(); startEdit(r, c); }
      else if (k === "Delete" || k === "Backspace") { e.preventDefault(); apply("", false); }
      else if (k === "?" ) { e.preventDefault(); showShortcuts(); }
      else if (k === " " && col.type === "toggle") { e.preventDefault(); toggleCell(); }
      else if (k.length === 1 && !e.altKey && editable(c)) {
        var code = col.codes && col.codes[k.toUpperCase()];
        if (code != null) { e.preventDefault(); apply(code, true); }
        else if (col.type === "number" && /[\d.]/.test(k)) { e.preventDefault(); startEdit(r, c, k); }
        else if (col.type === "text") { e.preventDefault(); startEdit(r, c, k); }
      }
    });
    function toggleCell() {
      var s = rect() || { r1: cur.r, r2: cur.r, c1: cur.c, c2: cur.c }, batch = [], key = cols[cur.c].key;
      var to = !rows[cur.r][key];
      for (var r = s.r1; r <= s.r2; r++) setValue(batch, r, cur.c, to);
      commit(batch);
    }
    table.addEventListener("mousedown", function (e) {
      var td = e.target.closest ? e.target.closest(".ol-cell") : null;
      if (!td || e.target.classList.contains("ol-cell__in")) return;
      if (editing) endEdit(true, 0, 0, true);
      focusCell(+td.getAttribute("data-r"), +td.getAttribute("data-c"), e.shiftKey);
      e.preventDefault();
    });
    // focus that arrives any other way (Tab into the grid, a screen reader's cursor) moves the cursor too
    table.addEventListener("focusin", function (e) {
      var td = !editing && e.target.closest ? e.target.closest(".ol-cell") : null;
      if (!td) return;
      var r = +td.getAttribute("data-r"), c = +td.getAttribute("data-c");
      if (r === cur.r && c === cur.c) return;
      var old = cellEl(cur.r, cur.c); if (old) old.setAttribute("tabindex", "-1");
      cur = { r: r, c: c }; td.setAttribute("tabindex", "0");
    });
    table.addEventListener("dblclick", function (e) {
      var td = e.target.closest ? e.target.closest(".ol-cell") : null;
      if (td) startEdit(+td.getAttribute("data-r"), +td.getAttribute("data-c"));
    });
    table.addEventListener("click", function (e) {
      var td = e.target.closest ? e.target.closest(".ol-cell--toggle") : null;
      if (td && !e.shiftKey) toggleCell();
    });
    el.addEventListener("focusout", function (e) { if (!el.contains(e.relatedTarget)) flush(); });

    function fillDown() {
      var s = rect() || { r1: cur.r - 1, r2: cur.r, c1: cur.c, c2: cur.c };
      if (s.r1 < 0) return;
      var batch = [];
      for (var c = s.c1; c <= s.c2; c++) if (editable(c)) for (var r = s.r1 + 1; r <= s.r2; r++) setValue(batch, r, c, rows[s.r1][cols[c].key]);
      commit(batch);
    }
    function undoStep() {
      var b = undo.pop(); if (!b) return;
      b.slice().reverse().forEach(function (x) { rows[x.r][cols[x.c].key] = x.from; pending[rows[x.r][rk] + "|" + cols[x.c].key] = { rowKey: rows[x.r][rk], colKey: cols[x.c].key, value: x.from == null ? "" : x.from }; var td = cellEl(x.r, x.c); if (td) paint(td, x.r, x.c); });
      redo.push(b); schedule(); OL.announce(t("grid.undone"));
    }
    function redoStep() {
      var b = redo.pop(); if (!b) return;
      b.forEach(function (x) { rows[x.r][cols[x.c].key] = x.to; pending[rows[x.r][rk] + "|" + cols[x.c].key] = { rowKey: rows[x.r][rk], colKey: cols[x.c].key, value: x.to }; var td = cellEl(x.r, x.c); if (td) paint(td, x.r, x.c); });
      undo.push(b); schedule(); OL.announce(t("grid.redone"));
    }

    /* ------------------------------------------------------------- autosave */
    function setStatus(kind, text) {
      status.textContent = text || ""; status.setAttribute("data-kind", kind || "");
    }
    function schedule() {
      setStatus("dirty", t("grid.unsaved"));
      if (!timer && p.onSave && ms) timer = setTimeout(function () { timer = null; flush(); }, ms);
    }
    function flush() {
      if (timer) { clearTimeout(timer); timer = null; }
      var keys = Object.keys(pending);
      if (!keys.length || !p.onSave) return Promise.resolve();
      if (saving) { timer = setTimeout(function () { timer = null; flush(); }, 500); return Promise.resolve(); }
      var changes = keys.map(function (k) { return pending[k]; }); pending = {}; saving = true;
      setStatus("saving", t("grid.saving"));
      return Promise.resolve(p.onSave(changes)).then(function () {
        saving = false; setStatus("saved", t("grid.saved", { time: OL.fmt.time(new Date()) }));
        if (Object.keys(pending).length) schedule();
      }, function () {
        saving = false;
        changes.forEach(function (ch) { var k = ch.rowKey + "|" + ch.colKey; if (!pending[k]) pending[k] = ch; });   // a newer edit to the same cell wins
        setStatus("error", t("grid.not_saved"));
        OL.announce(t("grid.not_saved"), true);
        timer = setTimeout(function () { timer = null; flush(); }, Math.max(ms, 5000));
      });
    }

    function showShortcuts() {
      var list = [
        ["←  ↑  →  ↓", t("grid.k.move")], ["Tab", t("grid.k.tab")], ["Enter", t("grid.k.enter")], ["F2", t("grid.k.edit")], ["Esc", t("grid.k.esc")],
        ["Shift + " + t("grid.k.arrows"), t("grid.k.select")], [MOD + " + D", t("grid.k.fill")], ["Delete", t("grid.k.clear")],
        [MOD + " + Z", t("grid.k.undo")], [MOD + " + Shift + Z", t("grid.k.redo")], [MOD + " + S", t("grid.k.save")], [MOD + " + Enter", t("grid.k.submit")], ["?", t("grid.k.help")]
      ];
      cols.forEach(function (c) { if (c.codes) Object.keys(c.codes).forEach(function (k) { list.push([k, t("grid.k.code", { code: c.codes[k] || t("grid.k.clear_word") })]); }); });
      (p.shortcuts || []).forEach(function (x) { list.push(x); });
      var dl = h("dl", { class: "ol-keys" });
      list.filter(function (x, i, a) { return a.findIndex(function (y) { return y[0] === x[0] && y[1] === x[1]; }) === i; }).forEach(function (x) {
        dl.appendChild(h("dt", null, h("kbd", { text: x[0] }))); dl.appendChild(h("dd", { text: x[1] }));
      });
      var m = OL.ui.modal.open({ title: t("grid.shortcuts"), width: 520, body: dl, actions: [OL.ui.button.render({ label: t("common.close"), variant: "secondary", onClick: function () { m.close(); } })] });
    }

    drawHead(); draw();
    el.flush = flush; el.setStatus = setStatus; el.rows = rows; el.focus = function () { focusCell(cur.r, cur.c); };
    el.refresh = function (nextRows) { if (nextRows) { rows = nextRows; el.rows = rows; table.setAttribute("aria-rowcount", rows.length + 1); } draw(); };
    return el;
  }

  OL.ui.grid = { render: render, states: ["default", "editing", "invalid", "range", "saving", "saved", "not-saved"] };
})();
