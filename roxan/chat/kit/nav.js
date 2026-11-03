/* Moving about and showing things: tabs, the segmented control, breadcrumbs, the accordion,
   the tree, the table, stat cards, the file drop zone and the calendar. */
import { h, fill } from "../dom.js";
import { icon } from "../icons.js";
import { cx, uid, float, reduced } from "./core.js";
import { Badge, IconButton } from "./controls.js";

const changed = el => el.dispatchEvent(new Event("change", { bubbles: true }));
const valued = (el, get, set) => Object.defineProperty(el, "value", { get, set, configurable: true });
const px = n => `${Math.round(n * 10) / 10}px`;

// Arrow keys, Home and End over a row of buttons that take turns being the one in the tab order.
function rove(list, items, vertical, pick) {
  list.addEventListener("keydown", e => {
    const [prev, next] = vertical ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];
    const live = items().filter(b => !b.disabled), i = live.indexOf(document.activeElement);
    if (i < 0) return;
    const to = e.key === prev ? i - 1 : e.key === next ? i + 1 : e.key === "Home" ? 0 : e.key === "End" ? live.length - 1 : null;
    if (to == null) return;
    e.preventDefault();
    const b = live[(to + live.length) % live.length];
    b.focus();
    pick(b);
  });
}

/* ------------------------------------------------------------ Tabs: a line under the one you are on */

// Tabs({ tabs: [{ id, label, count, icon, panel }], value, onchange, label, vertical }). A panel is a node or () => node, built the first time it shows.
// vertical: the tabs are a column on the left, the arrow keys are up and down, and the row you are on is filled instead of underlined.
export function Tabs({ tabs, value, onchange, label, vertical, class: c } = {}) {
  const id = uid("tb");
  let cur = value ?? tabs[0]?.id;
  const bar = h("span", { class: "k-bar", "aria-hidden": "true" });
  const btns = tabs.map(t => h("button", { type: "button", class: "k-tab", role: "tab", id: `${id}-${t.id}`, "aria-controls": `${id}-p-${t.id}`, "data-id": t.id },
    t.icon && icon(t.icon), h("span", { text: t.label }), t.count != null ? Badge({ class: "k-count" }, t.count) : null));
  const list = h("div", { class: "k-tablist", role: "tablist", "aria-label": label || null, "aria-orientation": vertical ? "vertical" : null }, btns, bar);
  const panels = tabs.map(t => h("div", { class: "k-tabpanel", role: "tabpanel", id: `${id}-p-${t.id}`, "aria-labelledby": `${id}-${t.id}`, tabindex: 0, hidden: true }));
  const built = new Set();
  const el = h("div", { class: cx("k-tabs", vertical && "k-v", c) }, list, ...panels);
  const sync = (focus) => {
    btns.forEach((b, i) => {
      const on = b.dataset.id === String(cur);
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
      if (on) {
        if (!built.has(tabs[i].id) && tabs[i].panel) { built.add(tabs[i].id); const p = typeof tabs[i].panel === "function" ? tabs[i].panel() : tabs[i].panel; panels[i].append(p); }
        if (!vertical) { bar.style.width = px(b.offsetWidth - 20); bar.style.transform = `translateX(${px(b.offsetLeft + 10)})`; }
        if (focus) b.focus();
      }
    });
  };
  const set = (v, focus) => { if (String(v) === String(cur)) return; cur = v; sync(focus); changed(el); onchange?.(cur); };
  btns.forEach(b => b.addEventListener("click", () => set(b.dataset.id)));
  rove(list, () => btns, Boolean(vertical), b => set(b.dataset.id));
  valued(el, () => cur, v => { cur = v; sync(); });
  el.setCount = (tid, n) => { const b = btns[tabs.findIndex(t => t.id === tid)]; let k = b?.querySelector(".k-count"); if (b && !k) b.append(k = Badge({ class: "k-count" })); if (k) k.textContent = n; sync(); };
  el.panel = tid => panels[tabs.findIndex(t => t.id === tid)];
  // the underline needs sizes, so draw it once the element is on the page and again if fonts or width change
  requestAnimationFrame(function again() { if (!el.isConnected) return requestAnimationFrame(again); sync(); });
  if (typeof ResizeObserver === "function") new ResizeObserver(() => el.isConnected && sync()).observe(list);
  sync();
  return el;
}

/* ------------------------------------------------------------ Segmented control: a few choices side by side */

// SegmentedControl({ options: [{ value, label, icon }], value, onchange, label, size }). el.value; "change".
export function SegmentedControl({ options, value, onchange, label, size, class: c } = {}) {
  let cur = value ?? options[0]?.value;
  const thumb = h("span", { class: "k-thumb", "aria-hidden": "true" });
  const btns = options.map(o => h("button", { type: "button", class: "k-seg", role: "radio", "data-v": o.value, disabled: o.disabled }, o.icon && icon(o.icon, "sm"), o.label ? h("span", { text: o.label }) : null, o.title ? h("span", { class: "sr", text: o.title }) : null));
  const el = h("div", { class: cx("k-segmented", size && `k-${size}`, c), role: "radiogroup", "aria-label": label || null }, thumb, btns);
  const sync = () => btns.forEach(b => {
    const on = b.dataset.v === String(cur);
    b.setAttribute("aria-checked", String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && b.offsetWidth) { thumb.style.width = px(b.offsetWidth); thumb.style.transform = `translateX(${px(b.offsetLeft)})`; thumb.hidden = false; }
  });
  const set = v => { if (String(v) === String(cur)) return; cur = v; sync(); changed(el); onchange?.(cur); };
  btns.forEach(b => b.addEventListener("click", () => set(b.dataset.v)));
  rove(el, () => btns, false, b => set(b.dataset.v));
  valued(el, () => cur, v => { cur = v; sync(); });
  requestAnimationFrame(function again() { if (!el.isConnected) return requestAnimationFrame(again); sync(); });
  if (typeof ResizeObserver === "function") new ResizeObserver(() => el.isConnected && sync()).observe(el);
  sync();
  return el;
}

/* ------------------------------------------------------------ Breadcrumb */

// Breadcrumb([{ label, href }, ..., { label }]): the last one is where you are.
export function Breadcrumb(trail, { label = "Breadcrumb" } = {}) {
  const items = trail.filter(Boolean);
  return h("nav", { class: "k-crumbs", "aria-label": label }, h("ol", {}, items.map((t, i) => {
    const last = i === items.length - 1;
    return h("li", {}, last || !t.href ? h("span", { class: "k-cr", "aria-current": last ? "page" : null, text: t.label }) : h("a", { class: "k-cr", href: t.href, text: t.label }), last ? null : icon("right", "sm"));
  })));
}

/* ------------------------------------------------------------ Accordion */

// Accordion({ items: [{ id, title, body, open, aside }], multiple, variant: "divided" | "separated" }).
export function Accordion({ items, multiple, variant = "divided", class: c } = {}) {
  const id = uid("ac");
  const rows = items.map(it => {
    const head = h("button", { type: "button", class: "k-ac-h", id: `${id}-h-${it.id}`, "aria-expanded": String(!!it.open), "aria-controls": `${id}-p-${it.id}` }, h("span", { class: "k-ac-t", text: it.title }), it.aside ? h("span", { class: "k-ac-a" }, it.aside) : null, icon("down", "sm"));
    const inner = h("div", { class: "k-ac-i" }, it.body);
    const panel = h("div", { class: "k-ac-p", id: `${id}-p-${it.id}`, role: "region", "aria-labelledby": head.id, inert: it.open ? null : true }, inner);
    const row = h("div", { class: "k-ac-r", "data-open": String(!!it.open) }, h("h3", { class: "k-ac-hd" }, head), panel);
    head.addEventListener("click", () => {
      const open = head.getAttribute("aria-expanded") !== "true";
      if (open && !multiple) rows.forEach(r => r.close());
      toggle(open);
    });
    const toggle = open => { head.setAttribute("aria-expanded", String(open)); row.dataset.open = String(open); panel.inert = !open; };
    row.close = () => toggle(false);
    row.toggle = toggle;
    row.head = head;
    return row;
  });
  const el = h("div", { class: cx("k-accordion", `k-${variant}`, c) }, rows);
  rove(el, () => rows.map(r => r.head), true, () => {});
  el.rows = rows;
  return el;
}

/* ------------------------------------------------------------ Tree view */

// TreeView({ label, nodes, render(node) -> content, onselect(node), current, open: Set }) where a node is { id, children?, href? }.
// Rows are 32px; arrows walk the visible rows, right opens, left closes (or goes to the parent), Enter opens the row.
export function TreeView({ label, nodes, render, onselect, current, open = new Set(), onopen, class: c } = {}) {
  const el = h("ul", { class: cx("k-tree", c), role: "tree", "aria-label": label || null });
  const build = (list, level) => list.map(n => {
    const kids = n.children?.length ? n.children : null, isOpen = !!kids && open.has(n.id);
    const row = h(n.href ? "a" : "div", { class: "k-tr-row", role: "treeitem", href: n.href || null, tabindex: -1, "aria-level": level, "aria-expanded": kids ? String(isOpen) : null, "aria-current": n.id === current ? "page" : null, "data-id": n.id });
    row.style.setProperty("--lv", level - 1);
    const twisty = kids ? h("button", { type: "button", class: "k-tw", tabindex: -1, "aria-label": isOpen ? "Collapse" : "Expand", onclick: e => { e.preventDefault(); e.stopPropagation(); flip(li, n); } }, icon("right", "sm")) : h("span", { class: "k-tw k-none", "aria-hidden": "true" });
    row.append(twisty, render(n));
    row.addEventListener("click", e => { if (!e.defaultPrevented) onselect?.(n); });
    const li = h("li", { class: "k-tr-item", role: "none", "data-open": String(isOpen) }, row, kids ? h("div", { class: "k-tr-kids" }, h("ul", { role: "group" }, build(kids, level + 1))) : null);
    if (kids) li.querySelector(".k-tr-kids").inert = !isOpen;
    return li;
  });
  const flip = (li, n, to) => {
    const isOpen = to ?? li.dataset.open !== "true";
    li.dataset.open = String(isOpen);
    li.querySelector(":scope > .k-tr-kids").inert = !isOpen;
    const row = li.querySelector(":scope > .k-tr-row");
    row.setAttribute("aria-expanded", String(isOpen));
    row.querySelector(".k-tw").setAttribute("aria-label", isOpen ? "Collapse" : "Expand");
    if (isOpen) open.add(n.id); else open.delete(n.id);
    onopen?.(n, isOpen);
  };
  el.append(...build(nodes, 1));
  const visible = () => [...el.querySelectorAll(".k-tr-row")].filter(r => !r.closest(".k-tr-kids[inert]"));
  const first = visible().find(r => r.getAttribute("aria-current")) || visible()[0];
  if (first) first.tabIndex = 0;
  el.addEventListener("focusin", e => { const r = e.target.closest(".k-tr-row"); if (r) { el.querySelectorAll('.k-tr-row[tabindex="0"]').forEach(x => { x.tabIndex = -1; }); r.tabIndex = 0; } });
  el.addEventListener("keydown", e => {
    const row = e.target.closest?.(".k-tr-row");
    if (!row || e.target.closest("input,textarea,select,.k-menu")) return;
    const rows = visible(), i = rows.indexOf(row), li = row.parentElement, n = { id: row.dataset.id };
    const expandable = row.hasAttribute("aria-expanded"), isOpen = row.getAttribute("aria-expanded") === "true";
    if (e.key === "ArrowDown") { e.preventDefault(); rows[i + 1]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); rows[i - 1]?.focus(); }
    else if (e.key === "Home") { e.preventDefault(); rows[0]?.focus(); }
    else if (e.key === "End") { e.preventDefault(); rows.at(-1)?.focus(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); if (expandable && !isOpen) flip(li, n, true); else if (isOpen) li.querySelector(".k-tr-kids .k-tr-row")?.focus(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); if (expandable && isOpen) flip(li, n, false); else row.closest(".k-tr-kids")?.parentElement.querySelector(":scope > .k-tr-row")?.focus(); }
    else if (e.key === "Enter" && e.target === row) { e.preventDefault(); row.click(); }
  });
  return el;
}

/* ------------------------------------------------------------ Table */

// Table({ columns: [{ key, label, align, sort, render(row) -> node | text }], rows, rowKey, empty, size, onrow, label }).
export function Table({ columns, rows = [], empty = "Nothing here yet.", size = "md", onrow, label, class: c } = {}) {
  let sortBy = null, dir = 1, data = rows;
  const head = h("tr", {}, columns.map(col => {
    const th = h("th", { scope: "col", class: col.align ? `k-${col.align}` : null, "aria-sort": col.sort ? "none" : null }, col.sort ? h("button", { type: "button", class: "k-sort", onclick: () => { dir = sortBy === col.key ? -dir : 1; sortBy = col.key; draw(); } }, col.label, icon("updown", "sm")) : col.label);
    th.col = col;
    return th;
  }));
  const body = h("tbody");
  const table = h("table", { class: cx("k-table", `k-${size}`), "aria-label": label || null }, h("thead", {}, head), body);
  const el = h("div", { class: cx("k-tablewrap", c) }, table);
  function draw() {
    const list = sortBy ? [...data].sort((a, b) => (a[sortBy] > b[sortBy] ? 1 : a[sortBy] < b[sortBy] ? -1 : 0) * dir) : data;
    head.querySelectorAll("th").forEach(th => th.col.sort && th.setAttribute("aria-sort", sortBy === th.col.key ? (dir > 0 ? "ascending" : "descending") : "none"));
    fill(body, list.length ? list.map(r => {
      const tr = h("tr", { class: onrow ? "k-clickable" : null, tabindex: onrow ? 0 : null }, columns.map(col => h("td", { class: col.align ? `k-${col.align}` : null }, col.render ? col.render(r) : r[col.key] ?? "")));
      if (onrow) { tr.addEventListener("click", e => { if (!e.target.closest("button,a,input,select")) onrow(r); }); tr.addEventListener("keydown", e => { if (e.key === "Enter" && e.target === tr) onrow(r); }); }
      return tr;
    }) : h("tr", {}, h("td", { colspan: columns.length, class: "k-empty", text: empty })));
  }
  el.setRows = r => { data = r; draw(); };
  draw();
  return el;
}

/* ------------------------------------------------------------ Stat card */

// StatCard({ icon, label, value, note, href }): a number you can act on. The value is text, never styled as a trend.
export function StatCard({ icon: ic, label, value, note, href, class: c } = {}) {
  const body = [h("span", { class: "k-st-ic" }, ic ? icon(ic, "lg") : null), h("span", { class: "k-st-l", text: label }), h("span", { class: "k-st-v", text: String(value) }), note ? h("span", { class: "k-st-n", text: note }) : null];
  return h(href ? "a" : "div", { class: cx("k-stat", c), href: href || null }, ...body);
}

/* ------------------------------------------------------------ File drop zone */

// FileUpload({ accept, multiple, onfiles, label, hint }): click, press Enter, or drop files on it.
export function FileUpload({ accept, multiple = true, onfiles, label = "Drop files here or choose", hint, disabled } = {}) {
  const input = h("input", { type: "file", class: "k-native", accept: accept || null, multiple, disabled });
  const el = h("label", { class: "k-drop", "aria-disabled": disabled ? "true" : null }, input, icon("upload", "lg"), h("span", { class: "k-drop-t", text: label }), hint ? h("span", { class: "k-hint", text: hint }) : null);
  const take = files => { const list = [...files]; if (list.length) onfiles?.(list); };
  input.addEventListener("change", () => { take(input.files); input.value = ""; });
  el.addEventListener("dragover", e => { if (disabled) return; e.preventDefault(); el.dataset.over = "true"; });
  el.addEventListener("dragleave", () => { delete el.dataset.over; });
  el.addEventListener("drop", e => { e.preventDefault(); delete el.dataset.over; if (!disabled) take(e.dataTransfer.files); });
  el.input = input;
  return el;
}

/* ------------------------------------------------------------ Calendar and date picker (a day is "YYYY-MM-DD", in the person's own zone) */

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = v => (/^\d{4}-\d{2}-\d{2}$/.test(v || "") ? new Date(+v.slice(0, 4), +v.slice(5, 7) - 1, +v.slice(8, 10)) : null);
const monthFmt = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export function Calendar({ value, min, max, onchange, class: c } = {}) {
  let cur = value || "", view = parse(value) || new Date(), focus = parse(value) || new Date();
  view = new Date(view.getFullYear(), view.getMonth(), 1);
  const title = h("p", { class: "k-cal-t", "aria-live": "polite" }), grid = h("div", { class: "k-cal-g", role: "grid" });
  const el = h("div", { class: cx("k-cal", c) }, h("div", { class: "k-cal-h" }, IconButton({ size: "sm", "aria-label": "Previous month", onclick: () => go(-1) }, "left"), title, IconButton({ size: "sm", "aria-label": "Next month", onclick: () => go(1) }, "right")), grid);
  const go = n => { view = new Date(view.getFullYear(), view.getMonth() + n, 1); focus = new Date(view.getFullYear(), view.getMonth(), Math.min(focus.getDate(), 28)); draw(); };
  const off = d => (min && iso(d) < min) || (max && iso(d) > max);
  function draw(keep) {
    title.textContent = monthFmt.format(view);
    const start = new Date(view.getFullYear(), view.getMonth(), 1 - ((view.getDay() + 6) % 7));       // weeks begin on Monday
    const head = Array.from({ length: 7 }, (_, i) => h("span", { class: "k-cal-d", role: "columnheader", text: new Intl.DateTimeFormat(undefined, { weekday: "narrow" }).format(new Date(2024, 0, 1 + i)) }));
    const days = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), key = iso(d), here = d.getMonth() === view.getMonth();
      const b = h("button", { type: "button", class: cx("k-day", !here && "k-out", key === iso(new Date()) && "k-today", key === cur && "k-sel"), role: "gridcell", tabindex: key === iso(focus) && here ? 0 : -1, "aria-selected": String(key === cur), "aria-label": dayFmt.format(d), disabled: off(d), "data-d": key, text: String(d.getDate()) });
      b.addEventListener("click", () => { cur = key; focus = d; if (!here) view = new Date(d.getFullYear(), d.getMonth(), 1); draw(); changed(el); onchange?.(cur); });
      return b;
    });
    fill(grid, head, days);
    if (keep) grid.querySelector('[tabindex="0"]')?.focus();
  }
  grid.addEventListener("keydown", e => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (step == null && e.key !== "PageUp" && e.key !== "PageDown") return;
    e.preventDefault();
    focus = step != null ? new Date(focus.getFullYear(), focus.getMonth(), focus.getDate() + step) : new Date(focus.getFullYear(), focus.getMonth() + (e.key === "PageUp" ? -1 : 1), focus.getDate());
    view = new Date(focus.getFullYear(), focus.getMonth(), 1);
    draw(true);
  });
  valued(el, () => cur, v => { cur = v || ""; const d = parse(cur); if (d) { focus = d; view = new Date(d.getFullYear(), d.getMonth(), 1); } draw(); });
  draw();
  return el;
}

// DatePicker({ value, min, max, placeholder, onchange }): a field that opens a calendar. el.value is "YYYY-MM-DD" or "".
export function DatePicker({ value = "", min, max, placeholder = "Pick a day", label, onchange, class: c } = {}) {
  let cur = value, pop = null;
  const text = h("span", { class: "k-sel-v" });
  const btn = h("button", { type: "button", class: "k-sel-t", "aria-haspopup": "dialog", "aria-expanded": "false", "aria-label": label || placeholder }, icon("calendar"), text);
  const el = h("div", { class: cx("k-select k-date", c) }, btn);
  const draw = () => { const d = parse(cur); text.textContent = d ? shortFmt.format(d) : placeholder; text.dataset.empty = d ? "" : "1"; };
  valued(el, () => cur, v => { cur = v || ""; draw(); });
  btn.addEventListener("click", () => {
    if (pop) return pop.close(true);
    const cal = Calendar({ value: cur, min, max, onchange: v => { cur = v; draw(); pop?.close(true); changed(el); onchange?.(cur); } });
    pop = float(btn, h("div", { class: "k-pop k-calpop", role: "dialog", "aria-label": "Calendar" }, cal), { onClose: () => { pop = null; } });
    (cal.querySelector('[tabindex="0"]') || cal).focus({ preventScroll: true });
  });
  draw();
  return el;
}
