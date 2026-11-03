/* The parts that belong to a conversation with an agent: the thinking line, the log of what
   it did, the busy state of the composer, and the bell that gathers what waits for you. */
import { h, s, fill } from "../dom.js";
import { icon } from "../icons.js";
import { cx } from "./core.js";
import { Badge, IconButton, Spinner } from "./controls.js";
import { Popover, Notice } from "./overlays.js";

// The marks AgentThinking can wear. A grid of nine dots is lit by a front that goes across it (wave) or round it (spin): each dot
// runs the same fade, started a little later the further along the path it sits, so the delays are set here and the fade is in kit.css.
const DOTS = Array.from({ length: 9 }, (_, i) => [i % 3, Math.floor(i / 3)]);
const SEED = [.55, .3, .15, .85, .55, .3, 1, .85, .55];                               // how the dots rest when motion is reduced
const reach = (variant, c, r) => (variant === "wave" ? ((c + r) / 4) * 0.75 : (Math.atan2(r - 1, c - 1) / (2 * Math.PI) + 1) % 1);   // 0 to 1 along the path
const SPARK = "M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z";
const STARS = [[50, 46, 1], [18, 22, .55], [82, 26, .45], [78, 76, .55], [22, 78, .4]];   // across %, down %, size
const EIGHT = "M28 14C33 5 47 5 47 14C47 23 33 23 28 14C23 5 9 5 9 14C9 23 23 23 28 14Z";

function thinkMark(variant) {
  if (variant === "stars") {
    return h("span", { class: "k-think-m k-stars", "aria-hidden": "true" }, STARS.map(([x, y, k], i) => {
      const size = 14 * k, star = s("svg", { class: "k-star", viewBox: "0 0 24 24" }, s("path", { d: SPARK }));
      Object.assign(star.style, { width: `${size}px`, height: `${size}px`, left: `${x}%`, top: `${y}%`, margin: `${-size / 2}px 0 0 ${-size / 2}px`, animationDelay: `${(i * 0.196).toFixed(3)}s` });
      return star;
    }));
  }
  if (variant === "infinity") return s("svg", { class: "k-think-m k-eight", viewBox: "0 0 56 28", "aria-hidden": "true" }, s("path", { class: "k-eight-t", d: EIGHT }), s("path", { class: "k-eight-c", d: EIGHT, pathLength: 100 }));
  return h("span", { class: "k-think-m k-grid", "aria-hidden": "true" }, DOTS.map(([c, r], i) => {
    const dot = h("i");
    dot.style.opacity = SEED[i];
    dot.style.animationDelay = `${((reach(variant, c, r) - 1) * 0.64).toFixed(3)}s`;
    return dot;
  }));
}

// AgentThinking({ label, variant, tone, shimmer, timer }): the line that says a reply is on the way: a small mark, the label, and
// the seconds since it began. variant: "wave" or "spin" (dots with a light across or round them), "stars" (sparkles that come and
// go) or "infinity" (a line that draws a figure eight). tone: "subtle", "default" or "primary"; stars are subtle unless told.
// shimmer: a light passes along the letters. timer: false leaves the seconds out. el.label(text) changes the words.
export function AgentThinking({ label = "Thinking", variant = "wave", tone, shimmer = true, timer = true, class: c } = {}) {
  const word = h("span", { class: "k-think-l" }), t = timer ? h("span", { class: "k-think-s" }) : null, started = Date.now();
  const el = h("div", { class: cx("k-think", c), role: "status", "aria-live": "polite", data: { variant, tone: tone || (variant === "stars" ? "subtle" : "default") } }, thinkMark(variant), word, t);
  let last = null;
  // The letters are drawn one by one so a light can pass along them; a screen reader gets the plain words instead.
  el.label = text => {
    if (text === last) return;                                                         // the same words again must not restart the light
    last = text;
    fill(word, h("span", { class: "sr", text }), h("span", { class: shimmer ? "k-think-w" : null, "aria-hidden": "true" },
      shimmer ? [...text].map((ch, i) => { const g = h("span", { text: ch }); g.style.animationDelay = `${i * 70}ms`; return g; }) : text));
  };
  el.label(label);
  if (t) {
    const tick = () => {
      if (!el.isConnected && Date.now() - started > 1500) return;                       // taken off the page: stop counting
      const n = Math.floor((Date.now() - started) / 1000);
      t.textContent = n >= 2 ? `${n}s` : "";
      setTimeout(tick, 1000);
    };
    setTimeout(tick, 1000);
  }
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

// ComposerLoader(composerEl, { speed, arc, intensity, reverse, radius, line }): wraps it; el.active = true runs a thin line round its
// edge while a reply is on the way, and fades it out when it is false. speed: seconds for one lap (2.4). arc: how much of the edge
// the line covers, in degrees of 360 (57.6). intensity: 0 to 1 (1). reverse: goes the other way. radius and line: the corner
// radius and the line's width in px (22 and 1.5). It stays one white line: no colour and no glow, which Roxan's look does not have.
export function ComposerLoader(inner, { speed = 2.4, arc = 57.6, intensity = 1, reverse = false, radius = 22, line = 1.5 } = {}) {
  const ring = s("svg", { class: "k-ring", "aria-hidden": "true", preserveAspectRatio: "none" }, s("rect", { class: "k-ring-r", x: 0.5, y: 0.5, rx: radius, pathLength: 100 }));
  const el = h("div", { class: "k-loader" }, inner, ring);
  const rect = ring.firstChild;
  for (const [k, v] of [["speed", `${speed}s`], ["dash", Math.max(1, Math.min(99, (arc / 360) * 100)).toFixed(1)], ["alpha", intensity], ["line", line], ["dir", reverse ? "reverse" : "normal"]]) el.style.setProperty(`--k-orbit-${k}`, v);
  const fit = () => { const { width, height } = el.getBoundingClientRect(); ring.setAttribute("viewBox", `0 0 ${width} ${height}`); rect.setAttribute("width", Math.max(0, width - 1)); rect.setAttribute("height", Math.max(0, height - 1)); rect.setAttribute("rx", Math.max(0, Math.min(radius, (height - 1) / 2))); };
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
