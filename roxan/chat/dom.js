/* Small DOM helpers, so the app builds elements and never HTML strings. */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// h("button", { class: "btn", onclick: fn, "aria-label": "Send" }, "Send")
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "data") Object.assign(el.dataset, v);
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  el.append(...kids.flat(Infinity).filter(k => k != null && k !== false));
  return el;
}

// A titled block of a page: a hairline, a small label (and something on its right), then the content.
export const section = (label, aside, ...kids) => h("section", { class: "sec" }, h("div", { class: "sec-head" }, h("h2", { class: "label", text: label }), aside), ...kids);

// A label above a form control.
export const field = (label, control, hint) => h("label", { class: "fld" }, h("span", { class: "label", text: label }), control, hint ? h("span", { class: "fine", text: hint }) : null);

const dateFmt =new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });
const clockFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
export const when = ms => dateFmt.format(new Date(ms));
export const day = ms => dayFmt.format(new Date(ms));
export const clock = ms => clockFmt.format(new Date(ms));

export function ago(ms) {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return Math.round(s / 60) + " min ago";
  if (s < 86400) return Math.round(s / 3600) + " h ago";
  if (s < 86400 * 7) return Math.round(s / 86400) + " d ago";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(ms));
}

export const bytes = n => (n < 1024 ? n + " B" : n < 1048576 ? Math.round(n / 1024) + " KB" : n < 1073741824 ? (n / 1048576).toFixed(1) + " MB" : (n / 1073741824).toFixed(1) + " GB");

// datetime-local wants "YYYY-MM-DDTHH:MM" in local time.
const pad = n => String(n).padStart(2, "0");
export const toLocalInput = ms => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };

export const bus = new EventTarget();
export const emit = (name, detail) => bus.dispatchEvent(new CustomEvent(name, { detail }));
export const on = (name, fn) => { bus.addEventListener(name, fn); return () => bus.removeEventListener(name, fn); };
