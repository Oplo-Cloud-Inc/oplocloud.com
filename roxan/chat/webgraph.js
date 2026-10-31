/* Draws the web of notes (see memory.js) as a line drawing: a ring for each name
   notes are about, a hairline where two names share a note. Select a name with
   the mouse, or Tab to it and press Enter. It is only a picture of the same
   facts the page lists in words, so nothing here is the only way to a note. */
import { s } from "./dom.js";
import { layout } from "./memory.js";

const W = 720, H = 520;
const short = (t, n = 20) => (t.length <= n ? t : t.slice(0, n - 1) + "…");

// web: from memory.web(); selected: a node key or null; onSelect(key).
export function draw(web, { selected: wanted = null, onSelect = () => {} } = {}) {
  const at = layout(web, W, H);
  const by = new Map(web.nodes.map(n => [n.key, n]));
  const selected = by.has(wanted) ? wanted : null;                       // a name whose notes were all removed is simply not selected
  const near = selected ? new Set([selected, ...by.get(selected).links]) : null;
  const svg = s("svg", { class: "web-svg", viewBox: `0 0 ${W} ${H}`, role: "group", "aria-label": "Web of notes. Each name is a button; its notes are listed below." });

  for (const e of web.edges) {
    const a = at.get(e.a), b = at.get(e.b);
    if (!a || !b) continue;
    const here = selected && (e.a === selected || e.b === selected);
    svg.append(s("line", { class: "web-edge" + (here ? " on" : near ? " off" : ""), x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1) }));
  }
  for (const n of web.nodes) {
    const p = at.get(n.key);
    const r = 5 + Math.min(10, n.notes.length * 2);
    const right = p.x >= W / 2 + 4, mid = Math.abs(p.x - W / 2) < 4, up = p.y < H / 2 - 4;   // a name on the centre line puts its label on the side away from the middle, so no line runs through it
    const label = s("text", { class: "web-label", x: (mid ? p.x : p.x + (right ? r + 8 : -r - 8)).toFixed(1), y: (mid ? (up ? p.y - r - 9 : p.y + r + 17) : p.y + 4).toFixed(1), "text-anchor": mid ? "middle" : right ? "start" : "end", text: short(n.name) });
    const g = s("g", {
      class: "web-node" + (n.key === selected ? " on" : near && !near.has(n.key) ? " off" : ""),
      tabindex: "0", role: "button", "aria-pressed": String(n.key === selected),
      "aria-label": `${n.name}, ${n.notes.length} note${n.notes.length === 1 ? "" : "s"}${n.links.size ? ", linked to " + [...n.links].map(k => by.get(k).name).join(", ") : ""}`,
      "data-key": n.key,
    }, s("circle", { class: "web-hit", cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: r + 10 }), s("circle", { class: "web-dot", cx: p.x.toFixed(1), cy: p.y.toFixed(1), r }), label);
    g.addEventListener("click", () => onSelect(n.key));
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(n.key); } });
    svg.append(g);
  }
  return svg;
}
