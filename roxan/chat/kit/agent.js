/* The parts that belong to a conversation with an agent: the thinking line, the log of what
   it did, the busy state of the composer, and the bell that gathers what waits for you. */
import { h, s, fill } from "../dom.js";
import { icon } from "../icons.js";
import { cx } from "./core.js";
import { Badge, IconButton, Spinner } from "./controls.js";
import { Popover, Notice } from "./overlays.js";

// AgentThinking({ label }): a small mark that breathes, a shimmering label, and the seconds since it began.
export function AgentThinking({ label = "Thinking", class: c } = {}) {
  const t = h("span", { class: "k-think-s" }), started = Date.now();
  const el = h("div", { class: cx("k-think", c), role: "status", "aria-live": "polite" }, h("span", { class: "k-think-dots", "aria-hidden": "true" }, h("i"), h("i"), h("i")), h("span", { class: "k-think-l", text: label }), t);
  el.label = text => { el.querySelector(".k-think-l").textContent = text; };
  const tick = () => {
    if (!el.isConnected && Date.now() - started > 1500) return;                       // taken off the page: stop counting
    const n = Math.floor((Date.now() - started) / 1000);
    t.textContent = n >= 2 ? `${n}s` : "";
    setTimeout(tick, 1000);
  };
  setTimeout(tick, 1000);
  return el;
}

// AgentLog({ steps: [{ text, sub, state }] }): what it did on the way. state is "ok" (done), "no" (did not work), "wait" (waiting for you) or "run" (going on).
export function AgentLog({ steps = [], label = "What it did", class: c } = {}) {
  const el = h("ol", { class: cx("k-log", c), "aria-label": label });
  el.set = list => fill(el, (list || []).map(st => h("li", { class: "k-log-i", data: { state: st.state || "ok" } },
    h("span", { class: "k-log-m", "aria-hidden": "true" }, st.state === "run" ? Spinner() : null),
    h("span", { class: "k-log-t" }, h("span", { text: st.text }), st.sub ? h("small", { text: st.sub }) : null))));
  el.set(steps);
  return el;
}

// ComposerLoader(composerEl): wraps it; el.active = true runs a thin line round its edge while a reply is on the way.
export function ComposerLoader(inner) {
  const ring = s("svg", { class: "k-ring", "aria-hidden": "true", preserveAspectRatio: "none" }, s("rect", { class: "k-ring-r", x: 0.5, y: 0.5, rx: 22, pathLength: 100 }));
  const el = h("div", { class: "k-loader" }, inner, ring);
  const rect = ring.firstChild;
  const fit = () => { const { width, height } = el.getBoundingClientRect(); ring.setAttribute("viewBox", `0 0 ${width} ${height}`); rect.setAttribute("width", Math.max(0, width - 1)); rect.setAttribute("height", Math.max(0, height - 1)); rect.setAttribute("rx", Math.max(0, Math.min(22, (height - 1) / 2))); };
  if (typeof ResizeObserver === "function") new ResizeObserver(fit).observe(el);
  Object.defineProperty(el, "active", { get: () => el.dataset.active === "true", set: v => { el.dataset.active = String(!!v); if (v) fit(); } });
  return el;
}

// NotificationCenter({ title }): a bell with a count. el.set(items, unread) where an item is { title, text, time, href, tone }.
export function NotificationCenter({ title = "Notifications", empty = "Nothing needs you.", onopen, footer, side = "bottom", align = "end" } = {}) {
  let items = [], unread = 0;
  const count = Badge({ tone: "solid", class: "k-bell-n", hidden: true });
  const bell = IconButton({ "aria-label": title, class: "k-bell", "data-tip": title }, "bell");
  bell.append(count);
  const list = close => {
    const box = h("div", { class: "k-nc" }, h("header", { class: "k-nc-h" }, h("h2", { text: title }), unread ? Badge({}, `${unread} new`) : null),
      items.length ? h("div", { class: "k-nc-l" }, items.map(it => Notice({ ...it, class: "k-flat" }))) : h("p", { class: "k-empty", text: empty }), footer ? h("footer", { class: "k-nc-f" }, footer) : null);
    box.addEventListener("click", e => { if (e.target.closest(".k-n-acts .k-btn, .k-nc-f .k-btn")) close(); });   // acting on something is leaving the list
    return box;
  };
  Popover(bell, close => { onopen?.(); return list(close); }, { side, align, width: 380, class: "k-nc-pop", label: title });
  bell.set = (list2, n) => { items = list2 || []; unread = n ?? items.length; count.hidden = !unread; count.textContent = unread > 99 ? "99+" : unread; bell.setAttribute("aria-label", unread ? `${title}, ${unread} new` : title); };
  return bell;
}
