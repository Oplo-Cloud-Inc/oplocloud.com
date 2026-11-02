/* What every part of the kit shares: joining classes, ids, the layer overlays live in,
   placing a panel by its trigger, keeping focus where it belongs, and leaving with a motion.
   Nothing here draws anything; kit.css does that. */
import { h } from "../dom.js";

export const cx = (...a) => a.flat(Infinity).filter(Boolean).join(" ");
let seq = 0;
export const uid = (p = "k") => `${p}-${++seq}`;
export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// One fixed root above the shell: menus, tooltips, dialogs and the toast stack all go here.
export const layers = () => document.getElementById("layers") || document.body.appendChild(h("div", { id: "layers" }));

// Take a layer away after its leave motion (kit.css keys it off data-state="closed"); at once when motion is reduced.
export const leave = (el, ms = 240) => new Promise(done => {
  if (!el.isConnected) return done();
  el.dataset.state = "closed";
  const end = () => { el.remove(); done(); };
  if (reduced()) return end();
  el.addEventListener("animationend", e => { if (e.target === el) end(); });
  setTimeout(end, ms);
});

/* ------------------------------------------------------------ Placing a panel beside its trigger */

// Fixed position next to `anchor`: on the preferred side, flipped when there is no room, nudged to stay on screen.
export function place(panel, anchor, { side = "bottom", align = "start", gap = 6, match = false } = {}) {
  const a = anchor.getBoundingClientRect(), pad = 8;
  panel.style.minWidth = match ? `${a.width}px` : "";
  const w = panel.offsetWidth, hgt = panel.offsetHeight;      // layout size: a scale-in motion must not skew it
  const room = { bottom: innerHeight - a.bottom, top: a.top, right: innerWidth - a.right, left: a.left };
  const need = { bottom: hgt, top: hgt, right: w, left: w };
  const flip = { bottom: "top", top: "bottom", right: "left", left: "right" };
  let s = side;
  if (room[s] - gap < need[s] + pad && room[flip[s]] > room[s]) s = flip[s];
  let x, y;
  if (s === "bottom" || s === "top") {
    y = s === "bottom" ? a.bottom + gap : a.top - gap - hgt;
    x = align === "end" ? a.right - w : align === "center" ? a.left + (a.width - w) / 2 : a.left;
  } else {
    x = s === "right" ? a.right + gap : a.left - gap - w;
    y = align === "end" ? a.bottom - hgt : align === "center" ? a.top + (a.height - hgt) / 2 : a.top;
  }
  panel.style.left = `${Math.round(Math.max(pad, Math.min(x, innerWidth - w - pad)))}px`;
  panel.style.top = `${Math.round(Math.max(pad, Math.min(y, innerHeight - hgt - pad)))}px`;
  panel.dataset.side = s;
  panel.dataset.align = align;
}

// Open `panel` in the layer, by `anchor`. Closes on Escape (focus goes back), on a press outside, and on `close()`.
export function float(anchor, panel, { onClose, ...where } = {}) {
  let shut = false;
  const spot = () => place(panel, anchor, where);
  const out = e => { if (!panel.contains(e.target) && !anchor.contains(e.target)) close(); };
  const esc = e => { if (e.key === "Escape" && !e.defaultPrevented) { e.preventDefault(); close(true); } };
  function close(back) {
    if (shut) return;
    shut = true;
    document.removeEventListener("pointerdown", out, true);
    document.removeEventListener("keydown", esc);
    removeEventListener("resize", spot);
    removeEventListener("scroll", spot, true);
    anchor.setAttribute("aria-expanded", "false");
    leave(panel);
    if (back) anchor.focus({ preventScroll: true });
    onClose?.();
  }
  panel.classList.add("k-float");
  layers().append(panel);
  spot();
  panel.dataset.state = "open";
  anchor.setAttribute("aria-expanded", "true");
  document.addEventListener("pointerdown", out, true);
  document.addEventListener("keydown", esc);
  addEventListener("resize", spot);
  addEventListener("scroll", spot, true);
  return { el: panel, close, spot };
}

/* ------------------------------------------------------------ Keyboard */

const FOCUSABLE = 'a[href],button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';

// Tab and Shift+Tab stay inside `root`. Call it from root's keydown.
export function trap(root, e) {
  if (e.key !== "Tab") return;
  const els = [...root.querySelectorAll(FOCUSABLE)].filter(el => el.getClientRects().length);
  if (!els.length) return e.preventDefault();
  const [first, last] = [els[0], els.at(-1)];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// Arrows, Home and End move through the rows that can be chosen; a letter jumps to the next row that starts with it.
export function roving(root, sel = '[role^="menuitem"],[role="option"]') {
  root.addEventListener("keydown", e => {
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    const rows = [...root.querySelectorAll(sel)].filter(r => !r.hidden && r.getAttribute("aria-disabled") !== "true");
    if (!rows.length) return;
    const i = rows.indexOf(document.activeElement);
    const go = n => { e.preventDefault(); rows[(n + rows.length) % rows.length].focus(); };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i < 0 ? -1 : i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(-1);
    else if (e.key.length === 1 && e.key !== " ") {
      const k = e.key.toLowerCase(), from = i + 1;
      const hit = [...rows.slice(from), ...rows.slice(0, from)].find(r => r.textContent.trim().toLowerCase().startsWith(k));
      if (hit) { e.preventDefault(); hit.focus(); }
    }
  });
}

// While a dialog is open the page behind it can be neither reached nor focused.
let held = 0;
export function hold(on) {
  held = Math.max(0, held + (on ? 1 : -1));
  const shell = document.getElementById("shell");
  if (shell) shell.inert = held > 0;
}
