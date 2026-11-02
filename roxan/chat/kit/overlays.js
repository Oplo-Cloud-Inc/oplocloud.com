/* Everything that opens over the page: tooltips, popovers, menus and the context menu, the
   select and the combobox, dialogs and drawers, the command palette, and the notice card the
   toasts are drawn as. Panels live in #layers (see core.js) and leave with a motion. */
import { h } from "../dom.js";
import { icon } from "../icons.js";
import { cx, uid, layers, leave, place, float, trap, roving, hold } from "./core.js";
import { Button, CloseButton, Kbd, IconButton } from "./controls.js";

const changed = el => el.dispatchEvent(new Event("change", { bubbles: true }));
const valued = (el, get, set) => Object.defineProperty(el, "value", { get, set, configurable: true });
const FIRST = 'input:not([type="hidden"]):not(:disabled),textarea:not(:disabled),select:not(:disabled),button:not(:disabled),a[href],[tabindex="0"]';

/* ------------------------------------------------------------ Tooltip: any element with data-tip="..." (and data-tip-kbd) gets one */

let tip = null, tipFor = null, tipTimer = 0;
const hideTip = () => {
  clearTimeout(tipTimer);
  if (tip) { leave(tip, 140); tip = null; }
  if (tipFor) { tipFor.removeAttribute("aria-describedby"); tipFor = null; }
};
function showTip(t, now) {
  hideTip();
  if (!t.dataset.tip) return;
  const go = () => {
    const id = uid("tip");
    tip = h("div", { class: "k-tip", role: "tooltip", id }, t.dataset.tip, t.dataset.tipKbd ? Kbd(t.dataset.tipKbd) : null);
    layers().append(tip);
    place(tip, t, { side: t.dataset.tipSide || "top", align: "center", gap: 8 });
    tip.dataset.state = "open";
    tipFor = t;
    t.setAttribute("aria-describedby", id);
  };
  if (now) go(); else tipTimer = setTimeout(go, 320);
}
export function initTips() {
  if (initTips.done) return;
  initTips.done = true;
  const find = e => e.target.closest?.("[data-tip]");
  document.addEventListener("pointerover", e => { const t = find(e); if (t && t !== tipFor && e.pointerType !== "touch") showTip(t); });
  document.addEventListener("pointerout", e => { const t = find(e); if (t && !t.contains(e.relatedTarget)) hideTip(); });
  document.addEventListener("focusin", e => { const t = find(e); if (t && e.target.matches(":focus-visible")) showTip(t, true); });
  document.addEventListener("focusout", hideTip);
  document.addEventListener("pointerdown", hideTip, true);
  document.addEventListener("keydown", e => { if (e.key === "Escape") hideTip(); }, true);
  addEventListener("scroll", hideTip, true);
}
export const Tooltip = (el, text, { kbd, side } = {}) => { el.dataset.tip = text; if (kbd) el.dataset.tipKbd = kbd; if (side) el.dataset.tipSide = side; return el; };

/* ------------------------------------------------------------ Popover: a panel of your own beside a trigger */

// Popover(trigger, () => node, { side, align, width }): click the trigger to open or close it.
export function Popover(trigger, content, opts = {}) {
  let cur = null;
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.addEventListener("click", () => {
    if (cur) return cur.close(true);
    const panel = h("div", { class: cx("k-pop", opts.class), role: "dialog", tabindex: -1, "aria-label": opts.label || null }, typeof content === "function" ? content(() => cur?.close(true)) : content);
    if (opts.width) panel.style.width = typeof opts.width === "number" ? `${opts.width}px` : opts.width;
    cur = float(trigger, panel, { ...opts, onClose: () => { cur = null; opts.onClose?.(); } });
    (panel.querySelector(FIRST) || panel).focus({ preventScroll: true });
  });
  return trigger;
}

/* ------------------------------------------------------------ Menu (the dropdown) and the context menu */

// items: { label, icon, kbd, sub, onselect, href, danger, disabled, checked } | { divider: true } | { heading } | { node }
function menuRow(it, close, role) {
  if (it.divider) return h("div", { class: "k-sep", role: "separator" });
  if (it.heading) return h("div", { class: "k-head", role: "presentation", text: it.heading });
  if (it.node) return it.node;
  const el = h(it.href ? "a" : "div", { class: cx("k-item", it.danger && "k-danger", it.checked && "k-on"), role: it.role || role, tabindex: -1, href: it.href || null, "aria-disabled": it.disabled ? "true" : null, "aria-checked": it.checked == null ? null : String(!!it.checked) },
    it.icon && icon(it.icon), h("span", { class: "k-item-t" }, it.label, it.sub ? h("small", { text: it.sub }) : null), it.kbd && Kbd(it.kbd), it.checked && icon("check", "sm"));
  el.addEventListener("click", e => { if (it.disabled) return e.preventDefault(); close(true); it.onselect?.(e); });
  el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } });
  return el;
}

export function openMenu(anchor, items, { side = "bottom", align = "start", width, label, keyboard, onClose } = {}) {
  let f;
  const panel = h("div", { class: "k-pop k-menu", role: "menu", tabindex: -1, "aria-label": label || null }, items.filter(Boolean).map(it => menuRow(it, b => f.close(b), "menuitem")));
  if (width) panel.style.width = typeof width === "number" ? `${width}px` : width;
  roving(panel);
  f = float(anchor, panel, { side, align, onClose });
  (keyboard ? panel.querySelector('[role^="menuitem"]:not([aria-disabled])') || panel : panel).focus({ preventScroll: true });
  return f;
}

// Menu(trigger, items | () => items, opts): the trigger opens it by click, Enter or the down arrow.
export function Menu(trigger, items, opts = {}) {
  let cur = null;
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  const open = keyboard => {
    if (cur) return cur.close(true);
    cur = openMenu(trigger, typeof items === "function" ? items() : items, { ...opts, keyboard, onClose: () => { cur = null; } });
  };
  trigger.addEventListener("click", e => open(e.detail === 0));
  trigger.addEventListener("keydown", e => { if (e.key === "ArrowDown" && !cur) { e.preventDefault(); open(true); } });
  return trigger;
}

// ContextMenu(target, e => items): a right click (or the menu key) opens a menu at the pointer.
export function ContextMenu(target, items, opts = {}) {
  target.addEventListener("contextmenu", e => {
    const list = typeof items === "function" ? items(e) : items;
    if (!list?.length) return;
    e.preventDefault();
    const at = e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : (r => ({ x: r.left + 12, y: r.top + r.height / 2 }))(target.getBoundingClientRect());
    const ghost = { getBoundingClientRect: () => ({ left: at.x, right: at.x, top: at.y, bottom: at.y, width: 0, height: 0 }), setAttribute() {}, contains: () => false, focus: () => target.focus?.({ preventScroll: true }) };
    openMenu(ghost, list, { ...opts, keyboard: e.detail === 0 && !e.clientX });
  });
  return target;
}

/* ------------------------------------------------------------ Select: one value from a list, a drop-in for <select> (.value, "change") */

function optionRows(options, current, pick) {
  return options.map(o => {
    const on = String(o.value) === String(current);
    const r = h("div", { class: cx("k-item", on && "k-on"), role: "option", tabindex: -1, "aria-selected": String(on), "aria-disabled": o.disabled ? "true" : null, id: uid("o"), "data-v": o.value },
      o.icon && icon(o.icon), h("span", { class: "k-item-t" }, o.label, o.hint ? h("small", { text: o.hint }) : null), on && icon("check", "sm"));
    r.addEventListener("click", () => { if (!o.disabled) pick(o); });
    r.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); r.click(); } });
    return r;
  });
}

export function Select({ options = [], value, placeholder = "Select", label, size, onchange, disabled, class: c, ...rest } = {}) {
  let cur = value ?? "", open = null;
  const text = h("span", { class: "k-sel-v" });
  const btn = h("button", { type: "button", class: "k-sel-t", role: "combobox", "aria-haspopup": "listbox", "aria-expanded": "false", "aria-label": label || null, disabled }, text, icon("updown", "sm"));
  const el = h("div", { ...rest, class: cx("k-select", size && `k-${size}`, c) }, btn);
  const draw = () => { const o = options.find(x => String(x.value) === String(cur)); text.textContent = o ? o.label : placeholder; text.dataset.empty = o ? "" : "1"; };
  valued(el, () => cur, v => { cur = v; draw(); });
  Object.defineProperty(el, "disabled", { get: () => btn.disabled, set: v => { btn.disabled = !!v; } });
  el.setOptions = list => { options = list; draw(); };
  el.button = btn;
  el.focus = o => btn.focus(o);
  const show = () => {
    if (open) return open.close(true);
    const panel = h("div", { class: "k-pop k-list", role: "listbox", tabindex: -1, "aria-label": label || null });
    const rows = optionRows(options, cur, o => { cur = o.value; draw(); open.close(true); changed(el); onchange?.(cur); });
    panel.append(...rows);
    roving(panel);
    open = float(btn, panel, { match: true, onClose: () => { open = null; } });
    const on = panel.querySelector(".k-on") || rows[0];
    on?.focus({ preventScroll: true });
    on?.scrollIntoView({ block: "nearest" });
  };
  btn.addEventListener("click", show);
  btn.addEventListener("keydown", e => { if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) { e.preventDefault(); show(); } });
  draw();
  return el;
}

/* ------------------------------------------------------------ Combobox: type to filter a long list (time zones, projects) */

export function Combobox({ options = [], value = "", placeholder = "Search", label, onchange, class: c } = {}) {
  let cur = value, open = null, act = -1, shown = [];
  const name = v => options.find(o => String(o.value) === String(v))?.label ?? "";
  const input = h("input", { type: "text", class: "k-in", role: "combobox", "aria-autocomplete": "list", "aria-expanded": "false", "aria-label": label || placeholder, autocomplete: "off", spellcheck: "false", placeholder, value: name(value) });
  const el = h("span", { class: cx("k-input k-combo", c) }, input, icon("updown", "sm"));
  valued(el, () => cur, v => { cur = v; input.value = name(v); });
  el.input = input;
  const list = () => { const q = input.value.trim().toLowerCase(); shown = options.filter(o => !q || o.label.toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q)).slice(0, 80); return shown; };
  const pick = o => { cur = o.value; input.value = o.label; close(); changed(el); onchange?.(cur); };
  const mark = n => {
    act = n;
    const rows = [...(open?.el.children || [])];
    rows.forEach((r, i) => r.classList.toggle("k-act", i === n));
    const r = rows[n];
    if (r) { input.setAttribute("aria-activedescendant", r.id); r.scrollIntoView({ block: "nearest" }); } else input.removeAttribute("aria-activedescendant");
  };
  function draw() {
    const rows = list();
    const panel = open?.el || h("div", { class: "k-pop k-list", role: "listbox", id: uid("lb") });
    panel.replaceChildren(...(rows.length ? optionRows(rows, cur, pick) : [h("div", { class: "k-empty", text: "No match" })]));
    panel.querySelectorAll(".k-item").forEach(r => r.addEventListener("pointerdown", e => e.preventDefault()));   // clicking a row keeps focus in the field
    if (!open) { open = float(el, panel, { match: true, onClose: () => { open = null; input.setAttribute("aria-expanded", "false"); } }); input.setAttribute("aria-expanded", "true"); input.setAttribute("aria-controls", panel.id); } else open.spot();
    mark(rows.length ? Math.max(0, rows.findIndex(o => String(o.value) === String(cur))) : -1);
  }
  function close() { open?.close(); input.value = name(cur) || (options.length ? "" : input.value); }
  input.addEventListener("focus", () => { input.select(); });
  input.addEventListener("input", draw);
  input.addEventListener("click", () => { if (!open) draw(); });
  input.addEventListener("blur", () => setTimeout(close, 120));
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (!open) draw(); else mark((act + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % Math.max(1, shown.length)); }
    else if (e.key === "Enter" && open && shown[act]) { e.preventDefault(); pick(shown[act]); }
    else if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); close(); }
  });
  return el;
}

/* ------------------------------------------------------------ Modal, alert dialog, drawer */

// Modal({ title, description, body, footer, size: "sm" | "md" | "lg", side: "end" for a drawer, scrim: false to keep a press outside from closing }).
export function Modal({ title, description, body, footer, size = "md", side, role = "dialog", dismissable = true, scrim = true, onclose, focus, class: c } = {}) {
  const prev = document.activeElement, id = uid("m");
  let gone = false;
  const head = h("header", { class: "k-m-head" }, h("div", { class: "k-m-ti" }, h("h2", { id: `${id}-t`, class: "k-m-title", text: title }), description ? h("p", { id: `${id}-d`, class: "k-m-desc", text: description }) : null), dismissable ? CloseButton({ onclick: () => close() }) : null);
  const box = h("div", { class: cx(side ? "k-drawer" : "k-modal", `k-${size}`, c), role, "aria-modal": "true", "aria-labelledby": `${id}-t`, "aria-describedby": description ? `${id}-d` : null, tabindex: -1 },
    head, body ? h("div", { class: "k-m-body" }, body) : null, footer ? h("footer", { class: "k-m-foot" }, footer) : null);
  const back = h("div", { class: cx("k-scrim", side && "k-side"), "data-side": side || null }, box);
  function close(result) {
    if (gone) return;
    gone = true;
    back.dataset.state = "closed";
    box.dataset.state = "closed";
    leave(back, 320);
    hold(false);
    prev?.focus?.({ preventScroll: true });
    onclose?.(result);
  }
  back.addEventListener("pointerdown", e => { if (e.target === back && dismissable && scrim) close(); });
  back.addEventListener("keydown", e => { if (e.key === "Escape" && dismissable) { e.preventDefault(); e.stopPropagation(); close(); } else trap(box, e); });
  layers().append(back);
  back.dataset.state = box.dataset.state = "open";
  hold(true);
  requestAnimationFrame(() => (focus?.() || box.querySelector("[autofocus]") || box.querySelector(".k-m-body " + FIRST.split(",").join(", .k-m-body ")) || box).focus({ preventScroll: true }));
  return { el: box, close };
}
export const Drawer = o => Modal({ side: "end", size: "md", ...o });

// confirm({ title, description, yes: "Delete", no: "Keep", danger }) -> Promise<boolean>. Focus starts on the safe choice.
export const confirm = ({ title, description, body, yes = "Confirm", no = "Cancel", danger } = {}) => new Promise(done => {
  let m;
  const answer = v => { m.close(v); done(v); };
  const cancel = Button({ variant: "secondary", autofocus: true, onclick: () => answer(false) }, no);
  const ok = Button({ variant: danger ? "danger" : "primary", onclick: () => answer(true) }, yes);
  m = Modal({ title, description, body, size: "sm", role: "alertdialog", scrim: false, footer: [cancel, ok], onclose: v => done(v === true), focus: () => cancel });
});

/* ------------------------------------------------------------ Command palette */

// CommandPalette(() => [{ title, items: [{ label, sub, icon, kbd, keywords, onselect, href }] }]): open it with the shortcut.
let palette = null;
export function openPalette(provider, { placeholder = "Search or jump to…" } = {}) {
  if (palette) return palette.close();
  const prev = document.activeElement, id = uid("cp");
  let sections = provider(), flat = [], act = 0;
  const input = h("input", { type: "text", class: "k-in", role: "combobox", "aria-expanded": "true", "aria-controls": `${id}-l`, "aria-autocomplete": "list", "aria-label": "Search commands", placeholder, autocomplete: "off", spellcheck: "false" });
  const list = h("div", { class: "k-cp-list", role: "listbox", id: `${id}-l` });
  const box = h("div", { class: "k-palette", role: "dialog", "aria-modal": "true", "aria-label": "Command palette" },
    h("div", { class: "k-cp-in" }, icon("search", "lg"), input, Kbd("esc")), list,
    h("footer", { class: "k-cp-foot" }, h("span", {}, Kbd("↑"), Kbd("↓"), " move"), h("span", {}, Kbd("↵"), " open"), h("span", {}, Kbd("esc"), " close")));
  const back = h("div", { class: "k-scrim k-top" }, box);
  const run = it => { close(); setTimeout(() => (it.href ? (location.hash = it.href.replace(/^#/, "")) : it.onselect?.()), 0); };
  const mark = n => {
    act = Math.max(0, Math.min(n, flat.length - 1));
    flat.forEach((x, i) => { x.el.classList.toggle("k-act", i === act); x.el.setAttribute("aria-selected", String(i === act)); });
    const cur = flat[act];
    if (cur) { input.setAttribute("aria-activedescendant", cur.el.id); cur.el.scrollIntoView({ block: "nearest" }); } else input.removeAttribute("aria-activedescendant");
  };
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    flat = [];
    const groups = sections.map(sec => {
      const items = sec.items.filter(it => !q || `${it.label} ${it.sub || ""} ${it.keywords || ""}`.toLowerCase().includes(q));
      if (!items.length) return null;
      return h("div", { class: "k-cp-sec", role: "group", "aria-label": sec.title }, h("div", { class: "k-head", text: sec.title }), items.map(it => {
        const el = h("div", { class: "k-item", role: "option", id: uid("co"), tabindex: -1, "aria-selected": "false" }, it.icon && icon(it.icon), h("span", { class: "k-item-t" }, it.label, it.sub ? h("small", { text: it.sub }) : null), it.kbd && Kbd(it.kbd));
        el.addEventListener("click", () => run(it));
        el.addEventListener("pointermove", () => { const i = flat.findIndex(x => x.el === el); if (i !== act) mark(i); });
        flat.push({ it, el });
        return el;
      }));
    }).filter(Boolean);
    list.replaceChildren(...(groups.length ? groups : [h("div", { class: "k-empty", text: q ? `Nothing matches “${input.value.trim()}”.` : "Nothing to show yet." })]));
    mark(0);
  };
  function close() {
    if (!palette) return;
    palette = null;
    box.dataset.state = "closed";
    leave(back, 330);
    hold(false);
    prev?.focus?.({ preventScroll: true });
  }
  input.addEventListener("input", draw);
  back.addEventListener("pointerdown", e => { if (e.target === back) close(); });
  back.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); mark(act + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); mark(act - 1); }
    else if (e.key === "Enter" && flat[act]) { e.preventDefault(); run(flat[act].it); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); if (input.value) { input.value = ""; draw(); } else close(); }
    else trap(box, e);
  });
  layers().append(back);
  back.dataset.state = box.dataset.state = "open";
  hold(true);
  draw();
  input.focus({ preventScroll: true });
  palette = { close };
  return palette;
}

/* ------------------------------------------------------------ The notice card: a toast and a row of the notification list are the same thing */

// Notice({ title, text, tone: "info" | "ok" | "warn" | "error", href, action: { label, onclick }, onclose }).
export function Notice({ title, text, tone = "info", href, action, onclose, time, class: c } = {}) {
  const glyph = { info: "info", ok: "checkc", warn: "alert", error: "alertc" }[tone] || "info";
  const body = h("div", { class: "k-n-body" }, title ? h("p", { class: "k-n-title", text: title }) : null, text ? h("p", { class: "k-n-text", text }) : null, time ? h("p", { class: "k-n-time", text: time }) : null,
    href || action ? h("div", { class: "k-n-acts" }, href ? Button({ variant: "secondary", size: "xs", onclick: e => { location.hash = href.replace(/^#/, ""); onclose?.(e); } }, "Open") : null, action ? Button({ variant: "secondary", size: "xs", onclick: action.onclick }, action.label) : null) : null);
  return h("div", { class: cx("k-notice", c), data: { tone } }, h("span", { class: "k-n-ic" }, icon(glyph, "lg")), body, onclose ? CloseButton({ label: "Dismiss", onclick: onclose }) : null);
}

// A bar across the top of the page: Announcement({ tone, text, action, onclose }).
export const Announcement = ({ text, action, tone = "info", onclose } = {}) => h("div", { class: "k-announce", role: "status", data: { tone } }, icon(tone === "error" ? "alertc" : "info"), h("span", { class: "k-a-t", text }), action ? Button({ variant: "secondary", size: "xs", onclick: action.onclick }, action.label) : null, onclose ? CloseButton({ label: "Dismiss", onclick: onclose }) : null);
