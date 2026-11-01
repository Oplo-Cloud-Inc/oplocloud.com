/* Roxan's mark, and the five others a person can give their Roxan. Each is a few
   lines on one 24 by 24 grid, drawn in the colour of the text beside it: line
   only, apart from small points. No gradient, no glow, no file to load. */
import { s } from "./dom.js";

export const MARKS = [["roxan", "Ring"], ["bloom", "Bloom"], ["orbit", "Orbit"], ["tilt", "Tilt"], ["arcs", "Arcs"], ["lattice", "Lattice"]];

const ring = (cx, cy, r) => s("circle", { cx, cy, r });
const dot = (cx, cy, r) => s("circle", { class: "solid", cx, cy, r });
const at = (r, deg) => [12 + r * Math.cos(deg * Math.PI / 180), 12 + r * Math.sin(deg * Math.PI / 180)].map(n => +n.toFixed(2));
const arc = (r, a, b) => { const [x1, y1] = at(r, a), [x2, y2] = at(r, b); return s("path", { d: `M${x1} ${y1}A${r} ${r} 0 ${(b - a + 360) % 360 > 180 ? 1 : 0} 1 ${x2} ${y2}` }); };

const DRAW = {
  roxan: () => [ring(12, 12, 9.25), dot(15.7, 8.3, 2.3)],                         // a ring and a point of attention
  bloom: () => [[8.6, 12], [15.4, 12], [12, 8.6], [12, 15.4]].map(([x, y]) => ring(x, y, 5.4)),
  orbit: () => [ring(12, 12, 9.25), ring(12, 12, 3), dot(...at(9.25, -38), 1.9)],
  tilt: () => [s("rect", { x: 5.5, y: 5.5, width: 13, height: 13, rx: 1.5 }), s("rect", { x: 5.5, y: 5.5, width: 13, height: 13, rx: 1.5, transform: "rotate(45 12 12)" })],
  arcs: () => [arc(9.25, -60, 200), arc(5.9, 120, 380), arc(2.6, -30, 240)],
  lattice: () => [0, 1, 2].flatMap(i => [0, 1, 2].map(j => dot(6 + 6 * i, 6 + 6 * j, i === 1 && j === 1 ? 2.2 : 1.35))),
};

export const mark = (id = "roxan", cls = "glyph") =>
  s("svg", { class: cls, viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" }, (DRAW[id] || DRAW.roxan)());
