/* ==========================================================================
   C-23 Command palette — the top bar's search.

   Ctrl/⌘+K or a click on the field opens it. It finds records, not only pages:

       Students · Staff · Classes · Subjects · Circulars · Pages · Actions

   in that order. Records come from the server (/search, backed by the FTS5
   index) a moment after typing stops; pages and actions are matched here at
   once, so the palette is useful before the network answers and when it never
   does. With the field empty it shows the five records opened most recently.

   Keyboard: ↑ ↓ move through the results, Enter opens one, Tab and Shift+Tab
   move to the next and previous group, Esc closes. It is a combobox over a
   listbox, so a screen reader hears the group, the row and "3 of 12".

   States it draws: recent (empty field), loading (the server's answer is on
   its way; local results stay), results, no results, error (search is down),
   no permission (records are for staff; pages and actions still work).

   OL.shell.palette.open({ search, pages, actions, recent, onPick, trigger })
     search(q) → Promise<{ groups: [{ kind, items: [{ id, kind, title, meta }] }], class }>
     pages  → [{ label, path, crumbs }]   actions → [{ label, path }]
     recent → { list(), add(record) }     onPick(item)  item = { type, ... }
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  OL.shell = OL.shell || {};

  var ORDER = ["student", "staff", "class", "subject", "circular", "page", "action"];
  var current = null;

  /* The second line of a record's row, from the facts the index holds. */
  function metaLine(r) {
    var m = r.meta || {}, parts = [];
    if (r.kind === "student") {
      if (m.class) parts.push(m.class);
      if (m.roll != null) parts.push(t("search.roll", { n: OL.fmt.num(m.roll) }));
      if (m.admissionNo) parts.push(m.admissionNo);
      if (m.apaar4) parts.push(t("search.apaar", { n: m.apaar4 }));
    } else if (r.kind === "staff") {
      if (m.jobTitle) parts.push(m.jobTitle);
      else if (m.roles) parts.push(String(m.roles).split(",").map(function (x) { return OL.i18n.has("search.role." + x) ? t("search.role." + x) : x; }).join(", "));
    } else if (r.kind === "class") {
      if (m.teacher) parts.push(t("search.class_teacher", { name: m.teacher }));
      if (m.students != null) parts.push(t("search.n_students", { n: m.students }));
    } else if (r.kind === "subject") {
      if (m.number) parts.push(m.number);
    } else if (r.kind === "circular") {
      if (m.status) parts.push(m.status);
      if (m.classes) parts.push(m.classes);
      if (m.dueOn) parts.push(t("search.due", { date: OL.fmt.date(m.dueOn) }));
    } else if (r.crumbs) parts.push(r.crumbs);
    return parts.join(" · ");
  }

  function iconFor(kind) {
    return { class: "school", subject: "book", circular: "megaphone", page: "arrow-right", action: "bolt" }[kind] || "search";
  }

  function norm(s) { return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, ""); }

  function open(p) {
    if (current) { current.close("reopen"); }
    var id = OL.uid("pal"), listId = id + "-list", rows = [], active = -1, seq = 0, server = null, serverQ = "", state = "recent", q = "";
    var input = h("input", { class: "ol-palette__input", type: "text", role: "combobox", autocomplete: "off", spellcheck: "false", autocapitalize: "off",
      "aria-autocomplete": "list", "aria-expanded": "true", "aria-controls": listId, "aria-label": t("search.label"), placeholder: t("search.placeholder") });
    var list = h("div", { class: "ol-palette__list", role: "listbox", id: listId, "aria-label": t("search.results") });
    var live = h("div", { class: "ol-sr", role: "status", "aria-live": "polite" });
    var note = h("div", { class: "ol-palette__note", hidden: true });
    var el = h("div", { class: "ol-palette ol-app", role: "dialog", "aria-modal": "true", "aria-label": t("search.label") },
      h("div", { class: "ol-palette__bar" }, OL.icon("search", 20), input, h("kbd", { class: "ol-palette__esc", text: "Esc" })),
      note, list,
      h("div", { class: "ol-palette__foot", "aria-hidden": "true" },
        h("span", null, h("kbd", { text: "↑" }), h("kbd", { text: "↓" }), " " + t("search.hint_move")),
        h("span", null, h("kbd", { text: "Enter" }), " " + t("search.hint_open")),
        h("span", null, h("kbd", { text: "Tab" }), " " + t("search.hint_group"))),
      live);
    var back = h("div", { class: "ol-palette-back", "aria-hidden": "true" });
    var restore = null;

    var ov = OL.overlay.push({
      el: el, trap: true, trigger: p.trigger || document.activeElement,
      onClose: function () {
        current = null;
        back.classList.remove("is-open"); el.classList.remove("is-open");
        if (restore) restore();
        setTimeout(function () { el.remove(); back.remove(); }, 160);
      }
    });
    back.addEventListener("pointerdown", function () { ov.close("scrim"); });
    document.body.appendChild(back);
    document.body.appendChild(el);
    restore = OL.inertOthers([el, back]);
    input.focus();      // at once, so the first letters of a fast typist are not lost while the card fades in
    requestAnimationFrame(function () { el.classList.add("is-open"); back.classList.add("is-open"); input.focus(); });
    current = ov;

    /* ---- what to show for the text typed ---- */
    function localRows(text) {
      var n = norm(text), out = [];
      if (!n) return out;
      (p.pages || []).forEach(function (pg) { if (norm(pg.label + " " + pg.crumbs).indexOf(n) > -1) out.push({ type: "page", kind: "page", title: pg.label, crumbs: pg.crumbs, path: pg.path }); });
      (p.actions || []).forEach(function (a) { if (norm(a.label + " " + (a.words || "")).indexOf(n) > -1) out.push({ type: "action", kind: "action", title: a.label, crumbs: a.crumbs, path: a.path }); });
      return out;
    }
    function build() {
      var groups = {};
      ORDER.forEach(function (k) { groups[k] = []; });
      if (!q) {
        ((p.recent && p.recent.list()) || []).forEach(function (r) { groups.recent = (groups.recent || []).concat([r]); });
        if (!(groups.recent || []).length) (p.actions || []).slice(0, 5).forEach(function (a) { groups.action.push({ type: "action", kind: "action", title: a.label, crumbs: a.crumbs, path: a.path }); });
      } else {
        // an answer is for the text it was asked for: rows left from the last text are not offered for this one, and Enter cannot open them
        if (server && serverQ === q) server.groups.forEach(function (g) { g.items.forEach(function (it) { groups[g.kind].push({ type: "record", kind: g.kind, id: it.id, title: it.title, meta: it.meta }); }); });
        localRows(q).forEach(function (r) { groups[r.kind].push(r); });
      }
      return groups;
    }

    function draw() {
      var groups = build(), flat = [];
      OL.clear(list);
      var order = !q ? ["recent", "action"] : ORDER;
      order.forEach(function (k) {
        var items = groups[k] || [];
        if (!items.length) return;
        var hid = id + "-g-" + k;
        var g = h("div", { class: "ol-palette__group", role: "group", "aria-labelledby": hid },
          h("div", { class: "ol-palette__gh", id: hid, text: t(k === "recent" ? "search.recent" : "search.group." + k) }));
        items.forEach(function (it) {
          var i = flat.length, oid = id + "-o-" + i;
          it.index = i;
          flat.push(it);
          var lead = it.kind === "student" || it.kind === "staff"
            ? OL.ui.avatar.render({ name: it.title, id: it.id, size: 32 })
            : h("span", { class: "ol-palette__ico" }, OL.icon(iconFor(it.kind), 20));
          g.appendChild(h("div", { class: "ol-palette__opt", role: "option", id: oid, "aria-selected": "false", "data-i": i,
            on: { pointermove: function () { if (active !== i) setActive(i, true); }, click: function () { pick(it); } } },
            lead,
            h("span", { class: "ol-palette__txt" }, h("span", { class: "ol-palette__title", text: it.title }), h("span", { class: "ol-palette__meta", text: metaLine(it) })),
            h("span", { class: "ol-palette__go", "aria-hidden": "true" }, OL.icon("arrow-right", 16))));
        });
        list.appendChild(g);
      });
      rows = flat;
      // notes: loading / error / forbidden / none
      note.hidden = true; OL.clear(note);
      list.removeAttribute("aria-busy");
      if (q && state === "loading") { list.setAttribute("aria-busy", "true"); note.hidden = false; note.appendChild(h("span", { class: "ol-spin", "aria-hidden": "true" })); note.appendChild(h("span", { text: t("search.searching") })); }
      else if (q && state === "error") {
        note.hidden = false;
        note.appendChild(h("span", { text: t("search.error") }));
        note.appendChild(OL.ui.button.render({ label: t("common.retry"), variant: "link", onClick: function () { ask(); } }));
      }
      else if (q && state === "forbidden") { note.hidden = false; note.appendChild(h("span", { text: t("search.forbidden") })); }
      if (q && !flat.length && state === "done") {
        list.appendChild(h("div", { class: "ol-palette__none" }, h("strong", { text: t("search.no_results", { q: q }) }), h("span", { text: t("search.no_results_hint") })));
      }
      if (!q && !flat.length) list.appendChild(h("div", { class: "ol-palette__none" }, h("span", { text: t("search.start") })));
      setActive(flat.length ? 0 : -1);
      live.textContent = !q ? "" : state === "loading" ? t("search.searching") : t("search.n_results", { n: flat.length });
    }

    function setActive(i, noScroll) {
      active = i;
      [].forEach.call(list.querySelectorAll(".ol-palette__opt"), function (o) {
        var on = Number(o.getAttribute("data-i")) === i;
        o.setAttribute("aria-selected", on ? "true" : "false");
        o.classList.toggle("is-on", on);
        if (on && !noScroll) o.scrollIntoView({ block: "nearest" });
      });
      if (i > -1) input.setAttribute("aria-activedescendant", id + "-o-" + i); else input.removeAttribute("aria-activedescendant");
    }

    function pick(it) {
      if (!it) return;
      ov.close("pick");
      if (it.type === "record" && p.recent) p.recent.add({ type: "record", kind: it.kind, id: it.id, title: it.title, meta: it.meta });
      if (p.onPick) p.onPick(it);
    }

    /* ---- asking the server, newest answer wins ---- */
    var ask = OL.debounce(function () {
      var mine = ++seq;
      if (!q || !p.search || q.length < 2) { server = null; state = q.length < 2 && q ? "done" : "recent"; draw(); return; }
      state = "loading"; draw();
      p.search(q).then(function (r) {
        if (mine !== seq) return;
        server = r; serverQ = q; state = "done";
        // a class code ("X-C") puts the class first in its group, which the server already did
        draw();
      }, function (e) {
        if (mine !== seq) return;
        server = null;
        state = e && e.status === 403 ? "forbidden" : "error";
        draw();
      });
    }, 140);

    input.addEventListener("input", function () {
      q = input.value.trim();
      if (!q) { seq++; ask.cancel(); server = null; state = "recent"; draw(); return; }
      if (q.length >= 2) { state = "loading"; }
      draw();            // local results at once
      ask();
    });
    input.addEventListener("keydown", function (e) {
      var n = rows.length;
      if (e.key === "ArrowDown") { e.preventDefault(); if (n) setActive((active + 1) % n); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (n) setActive((active - 1 + n) % n); }
      else if (e.key === "Enter") { e.preventDefault(); if (active > -1) pick(rows[active]); }
      else if (e.key === "Tab" && n) {
        // Tab walks the groups: the first row of the next group, Shift+Tab the previous one
        e.preventDefault();
        var heads = rows.map(function (r, i) { return i === 0 || r.kind !== rows[i - 1].kind ? i : -1; }).filter(function (i) { return i > -1; });
        var gi = heads.reduce(function (acc, start, idx) { return active >= start ? idx : acc; }, 0);
        setActive(heads[(gi + (e.shiftKey ? -1 : 1) + heads.length) % heads.length]);
      }
    });
    draw();
    return ov;
  }

  OL.shell.palette = { open: open, isOpen: function () { return !!current; }, close: function () { if (current) current.close("api"); }, metaLine: metaLine };
})();
