/* The small parts: buttons, badges, avatars, dots, fields, switches, checkboxes, radios,
   chips, progress and meters. Each is a function that returns an element; the ones that
   hold a choice give it a .value and fire a bubbling "change", like the native control they
   stand in for, so a view can read them the way it read the old one. */
import { h, s } from "../dom.js";
import { icon } from "../icons.js";
import { cx, uid } from "./core.js";

const kids = a => a.flat(Infinity).filter(k => k != null && k !== false);
const valued = (el, get, set) => Object.defineProperty(el, "value", { get, set, configurable: true });
const changed = el => el.dispatchEvent(new Event("change", { bubbles: true }));
export const mod = () => (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl");

/* ------------------------------------------------------------ Buttons */

export const Spinner = () => s("svg", { class: "k-spin", viewBox: "0 0 20 20", "aria-hidden": "true" }, s("circle", { class: "k-spin-track", cx: 10, cy: 10, r: 7.5 }), s("circle", { class: "k-spin-arc", cx: 10, cy: 10, r: 7.5, pathLength: 100 }));

// Button({ variant: "primary" | "secondary" | "ghost" | "danger", size: "md" | "sm" | "xs", icon, trailing, loading, ...attrs }, ...label)
export function Button({ variant = "primary", size = "md", icon: lead, trailing, loading, class: c, ...rest } = {}, ...label) {
  const text = kids(label), glyph = n => icon(n, size === "md" ? "lg" : size === "xs" ? "sm" : undefined);
  return h("button", { type: "button", ...rest, class: cx("k-btn", `k-${variant}`, `k-${size}`, !text.length && "k-only", loading && "k-loading", c), "aria-busy": loading ? "true" : null },
    loading ? Spinner() : lead && glyph(lead), text.length ? h("span", { class: "k-lab" }, ...text) : null, trailing && glyph(trailing));
}
export const IconButton = (props, name) => Button({ variant: "ghost", ...props, icon: name });
export const CloseButton = ({ label = "Close", ...rest } = {}) => IconButton({ size: "xs", "aria-label": label, ...rest }, "x");
export function LinkButton({ href, ...rest } = {}, ...label) {
  const b = Button(rest, ...label), a = h("a", { href, class: b.className });
  a.append(...b.childNodes);
  return a;
}
export const ButtonGroup = (props, ...buttons) => h("div", { role: "group", ...props, class: cx("k-bgroup", props?.class) }, ...buttons);

/* ------------------------------------------------------------ Marks: badge, kbd, avatar, dot, divider */

// Badge({ tone: "neutral" | "solid" | "outline" | "dashed" }, ...)
export const Badge = ({ tone = "neutral", class: c, ...rest } = {}, ...body) => h("span", { ...rest, class: cx("k-badge", `k-${tone}`, c) }, ...body);
export const Kbd = (...keys) => h("kbd", { class: "k-kbd" }, ...keys);
export const Avatar = ({ size = "md", initials, src, alt = "", glyph, class: c, ...rest } = {}) => h("span", { ...rest, class: cx("k-avatar", `k-${size}`, c) }, src ? h("img", { src, alt, loading: "lazy" }) : glyph || (initials || "").slice(0, 2));
// A state in a shape: hollow = idle, filled = working or done, dashed = paused or waiting.
export const StatusDot = ({ state = "idle", ...rest } = {}) => h("span", { ...rest, class: cx("k-dot", rest.class), data: { state }, "aria-hidden": "true" });
export const Divider = ({ label, vertical } = {}) => h("div", { class: cx("k-divider", vertical && "k-v"), role: "separator", "aria-orientation": vertical ? "vertical" : null }, label ? h("span", { text: label }) : null);

/* ------------------------------------------------------------ Skeleton */

export const Skeleton = ({ w, h: hgt, shape = "rect", class: c } = {}) => {
  const el = h("span", { class: cx("k-skel", shape === "circle" && "k-circle", c), "aria-hidden": "true" });
  if (w) el.style.width = typeof w === "number" ? `${w}px` : w;
  if (hgt) el.style.height = typeof hgt === "number" ? `${hgt}px` : hgt;
  return el;
};
export const SkeletonText = (lines = 3) => h("div", { class: "k-skel-text", "aria-hidden": "true" }, Array.from({ length: lines }, (_, i) => Skeleton({ w: i === lines - 1 && lines > 1 ? "62%" : "100%", h: 12 })));

/* ------------------------------------------------------------ Progress and meter */

// How far a task is: Progress({ value: 3, max: 5 }); with no value it sweeps. el.set(v) moves it. quiet: the label is only spoken, not drawn.
export function Progress({ value, max = 100, label, valueLabel, size, quiet, class: c } = {}) {
  const fill = h("span", { class: "k-fill" });
  const el = h("div", { class: cx("k-progress", size && `k-${size}`, c), role: "progressbar", "aria-valuemin": 0, "aria-valuemax": max, "aria-label": label || null },
    !quiet && (label || valueLabel) ? h("div", { class: "k-prog-head" }, h("span", { text: label || "" }), h("span", { class: "k-num" })) : null, h("span", { class: "k-track" }, fill));
  const num = el.querySelector(".k-num");
  el.set = (v, text) => {
    const pct = v == null ? null : Math.max(0, Math.min(100, (v / max) * 100));
    el.toggleAttribute("data-indeterminate", pct == null);
    if (pct == null) el.removeAttribute("aria-valuenow"); else el.setAttribute("aria-valuenow", v);
    fill.style.transform = pct == null ? "" : `translateX(${pct - 100}%)`;
    if (num) num.textContent = text ?? valueLabel ?? (pct == null ? "" : `${Math.round(pct)}%`);
  };
  el.set(value, valueLabel);
  return el;
}

// A level within a known range, not a task going to done: Meter({ label: "Chat", value: 12, max: 300, valueLabel: "12 of 300" }).
export function Meter({ value = 0, max = 100, label, valueLabel, class: c } = {}) {
  const el = Progress({ value, max, label, valueLabel, class: cx("k-meter", c) });
  el.setAttribute("role", "meter");
  el.dataset.level = value >= max ? "full" : value >= max * 0.8 ? "high" : "ok";
  return el;
}

/* ------------------------------------------------------------ Fields */

// A label over a control with a hint or an error under it: Field({ label, hint, error }, control).
export function Field({ label, hint, error, class: c } = {}, control) {
  const id = uid("f"), note = h("span", { class: cx("k-hint", error && "k-bad"), id: `${id}-n`, text: error || hint || "" });
  const input = control.matches?.("input,textarea,select,button") ? control : (control.querySelector?.("input:not(.k-native),textarea,select") || control.querySelector?.("button"));
  if (input) { input.id ||= id; if (note.textContent) input.setAttribute("aria-describedby", note.id); if (error) input.setAttribute("aria-invalid", "true"); }
  return h("div", { class: cx("k-field", c) }, label ? h("label", { class: "k-label", for: input?.id || id, text: label }) : null, control, note.textContent ? note : null);
}

// An input with room for a leading icon and a trailing control: Input({ icon: "search", trailing: node, ...attrs }). el.input is the real <input>.
export function Input({ icon: lead, trailing, size, class: c, ...attrs } = {}) {
  const input = h("input", { type: "text", autocomplete: "off", spellcheck: "false", ...attrs, class: "k-in" });
  const el = h("span", { class: cx("k-input", size && `k-${size}`, c) }, lead && icon(lead), input, trailing);
  el.input = input;
  el.addEventListener("pointerdown", e => { if (e.target === el) { e.preventDefault(); input.focus(); } });
  return el;
}

// A search box that can be cleared: SearchField({ placeholder, oninput, hint: Kbd(...) }).
export function SearchField({ placeholder = "Search", oninput, onclear, hint, ...attrs } = {}) {
  const clear = IconButton({ size: "xs", "aria-label": "Clear", hidden: true, onclick: () => { el.input.value = ""; sync(); el.input.focus(); onclear?.(); el.input.dispatchEvent(new Event("input", { bubbles: true })); } }, "x");
  const el = Input({ icon: "search", type: "search", placeholder, "aria-label": attrs["aria-label"] || placeholder, ...attrs, trailing: [clear, hint] });
  const sync = () => { clear.hidden = !el.input.value; };
  el.input.addEventListener("input", e => { sync(); oninput?.(e); });
  el.classList.add("k-search");
  return el;
}

// A whole number with - and + : NumberField({ value, min, max, step, onchange }). el.value is a number.
export function NumberField({ value = 0, min = -Infinity, max = Infinity, step = 1, onchange, ...attrs } = {}) {
  const clamp = n => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min === -Infinity ? 0 : min));
  const input = h("input", { class: "k-in", inputmode: "numeric", autocomplete: "off", "aria-label": attrs["aria-label"] || null, value });
  const set = n => { input.value = clamp(n); changed(el); onchange?.(+input.value); };
  const el = h("span", { class: "k-input k-number" }, IconButton({ size: "xs", "aria-label": "Less", onclick: () => set(+input.value - step) }, "minus"), input, IconButton({ size: "xs", "aria-label": "More", onclick: () => set(+input.value + step) }, "plus"));
  input.addEventListener("change", e => { e.stopPropagation(); set(parseInt(input.value, 10)); });
  input.addEventListener("keydown", e => { if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); set(+input.value + (e.key === "ArrowUp" ? step : -step)); } });
  valued(el, () => +input.value, n => { input.value = clamp(n); });
  el.input = input;
  return el;
}

/* ------------------------------------------------------------ Choosing: switch, checkbox, radio */

// All three are a real input (so keys, labels and forms work) drawn by the span after it.
function choice(kind, { label, hint, checked, disabled, name, value, onchange, class: c, glyph }) {
  const input = h("input", { type: kind === "radio" ? "radio" : "checkbox", role: kind === "switch" ? "switch" : null, class: "k-native", checked, disabled, name, value });
  const draw = kind === "switch" ? h("span", { class: "k-track", "aria-hidden": "true" }, h("span", { class: "k-thumb" })) : h("span", { class: "k-box", "aria-hidden": "true" }, glyph || icon("check", "sm"));
  const el = h("label", { class: cx(`k-${kind}`, c), "aria-disabled": disabled ? "true" : null }, input, draw, label || hint ? h("span", { class: "k-text" }, label ? h("span", { class: "k-name", text: label }) : null, hint ? h("span", { class: "k-hint", text: hint }) : null) : null);
  if (onchange) input.addEventListener("change", () => onchange(input.checked, input));
  el.input = input;
  valued(el, () => input.checked, v => { input.checked = !!v; });
  return el;
}
export const Switch = o => choice("switch", o || {});
export const Checkbox = o => choice("checkbox", o || {});
export const Radio = o => choice("radio", o || {});

// A switch or checkbox on a card with a title and a line under it: SwitchCard({ label, hint, checked, onchange }).
export const SwitchCard = o => { const el = choice("switch", o || {}); el.classList.add("k-card"); return el; };
export const CheckboxCard = o => { const el = choice("checkbox", o || {}); el.classList.add("k-card"); return el; };

// One of a few: RadioGroup({ name, value, options: [{ value, label, hint }], card, onchange }). el.value is the chosen value.
export function RadioGroup({ name = uid("rg"), value, options, card, label, onchange, class: c } = {}) {
  const items = options.map(o => Radio({ name, value: o.value, label: o.label, hint: o.hint, checked: o.value === value, disabled: o.disabled, class: card ? "k-card" : null }));
  const el = h("div", { class: cx("k-radios", card && "k-cards", c), role: "radiogroup", "aria-label": label || null }, items);
  el.addEventListener("change", e => { if (e.target.type === "radio") onchange?.(e.target.value); });
  valued(el, () => items.find(r => r.input.checked)?.input.value ?? "", v => items.forEach(r => { r.input.checked = r.input.value === v; }));
  return el;
}

/* ------------------------------------------------------------ Chips and tag groups */

// A small removable thing: a file, a filter, a context. Chip({ label, icon, onremove }).
export const Chip = ({ label, icon: lead, onremove, title, class: c } = {}) => h("span", { class: cx("k-chip", c), title: title || null }, lead && icon(lead, "sm"), h("span", { class: "k-chip-t", text: label }), onremove ? CloseButton({ label: `Remove ${label}`, onclick: onremove }) : null);
// A list of chips: TagGroup({ label, items: ["a", { label: "b", icon: "file" }], onremove(label, index) }).
export const TagGroup = ({ items = [], onremove, label } = {}) => h("div", { class: "k-tags", role: "list", "aria-label": label || null }, items.map((t, i) => { const o = typeof t === "string" ? { label: t } : t; return h("span", { role: "listitem", class: "k-tag-i" }, Chip({ ...o, onremove: onremove ? () => onremove(o.label, i) : null })); }));
