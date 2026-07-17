// ============================================================
// UI helpers: DOM, tints, avatars, charts, toasts
// ============================================================
import { icon } from "./icons.js";
import { tintHex, subjects } from "./data.js";

// tiny html → element
export function h(html){
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
export const esc = (s="") => String(s).replace(/[&<>"']/g, c => (
  {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// theme-aware: point --tint / --tint-ink at named CSS variables so dark mode adapts
const TINTS = new Set(["violet","sky","blush","peach","mint","butter","teal","lilac"]);
const T = (tint)=> TINTS.has(tint) ? tint : "violet";
export function tintStyle(tint){ const t=T(tint); return `--tint:var(--${t});--tint-ink:var(--${t}-ink)`; }
export function tintInk(tint){ return `var(--${T(tint)}-ink)`; }
export function tintBg(tint){ return `var(--${T(tint)})`; }

// subject helpers
export function subjIcon(subjectKey, cls){
  const s = subjects[subjectKey];
  return `<span class="subj-ic ${cls||''}" style="${tintStyle(s?.tint)}">${icon(s?.icon||'book')}</span>`;
}
export function subjTag(subjectKey){
  const s = subjects[subjectKey];
  if (!s) return "";
  return `<span class="tag" style="${tintStyle(s.tint)}"><i class="swatch"></i>${esc(s.short)}</span>`;
}

// avatar (initials, colored by tint name)
export function avatar(name, initials, tint, size=36, sq=false){
  const t = T(tint);
  return `<span class="avatar ${sq?'sq':''}" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.36)}px;background:var(--${t});color:var(--${t}-ink)" title="${esc(name)}">${esc(initials)}</span>`;
}

export function icBtn(name, cls=""){ return `<button class="icon-btn ${cls}">${icon(name)}</button>`; }

// ---------- charts ----------

// smooth line/area sparkline
export function sparkline(values, {w=520,h=150,tint="violet",pad=8,fill=true}={}){
  const ink = tintInk(tint);
  const bg = tintBg(tint);
  const min = Math.min(...values), max = Math.max(...values);
  const span = (max-min)||1;
  const step = (w-pad*2)/(values.length-1);
  const pts = values.map((v,i)=>[pad+i*step, pad+(h-pad*2)*(1-(v-min)/span)]);
  // catmull-rom → bezier
  const d = smoothPath(pts);
  const area = `${d} L ${pts[pts.length-1][0]} ${h-pad} L ${pts[0][0]} ${h-pad} Z`;
  const id = "g"+Math.random().toString(36).slice(2,7);
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="none" style="display:block">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${ink}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${ink}" stop-opacity="0"/></linearGradient></defs>
    ${fill?`<path d="${area}" fill="url(#${id})"/>`:""}
    <path d="${d}" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    ${pts.map((p,i)=>i===pts.length-1?`<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="#fff" stroke="${ink}" stroke-width="2.6"/>`:"").join("")}
  </svg>`;
}
function smoothPath(pts){
  if (pts.length<2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i=0;i<pts.length-1;i++){
    const p0 = pts[i-1]||pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2]||p2;
    const c1x = p1[0]+(p2[0]-p0[0])/6, c1y = p1[1]+(p2[1]-p0[1])/6;
    const c2x = p2[0]-(p3[0]-p1[0])/6, c2y = p2[1]-(p3[1]-p1[1])/6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

// donut from segments [{value, tint}]
export function donut(segments, centerTop, centerSub, size=150){
  const total = segments.reduce((a,s)=>a+s.value,0)||1;
  const sw = Math.round(size*0.085);           // proportional stroke → bigger hole
  const r=(size/2)-sw-2, c=2*Math.PI*r, cx=size/2, cy=size/2;
  let offset=0;
  const arcs = segments.map(s=>{
    const len = (s.value/total)*c;
    const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${tintInk(s.tint)}" stroke-width="${sw}"
      stroke-dasharray="${len} ${c-len}" stroke-dashoffset="${-offset}" stroke-linecap="round"
      transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += len;
    return el;
  }).join("");
  return `<div class="donut" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${sw}"/>
      ${arcs}
    </svg>
    <div class="d-center"><b>${centerTop}</b>${centerSub?`<span>${centerSub}</span>`:""}</div>
  </div>`;
}

// vertical bars [{label, value, tint}]
export function bars(items, {max=null}={}){
  const m = max || Math.max(...items.map(i=>i.value))*1.1;
  return `<div class="bars">${items.map(it=>`
    <div class="bar-col">
      <div class="bar" style="height:${(it.value/m*100).toFixed(1)}%;background:${tintInk(it.tint||'violet')}" title="${it.label}: ${it.value}"></div>
      <span class="bar-lbl">${esc(it.label)}</span>
    </div>`).join("")}</div>`;
}

// ---------- download (real file export from the running app) ----------
export function download(filename, content, mime="text/plain"){
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}
export function toCSV(rows){
  return rows.map(r=>r.map(c=>{
    const s = String(c ?? "");
    return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
  }).join(",")).join("\n");
}

// ---------- toast ----------
export function toast(msg, ic="check"){
  const layer = document.getElementById("toast-layer");
  const el = h(`<div class="toast">${icon(ic)}<span>${esc(msg)}</span></div>`);
  layer.appendChild(el);
  setTimeout(()=>{ el.classList.add("out"); setTimeout(()=>el.remove(),300); }, 2600);
}

// segmented control state helper
export function segmented(container){
  container.addEventListener("click", e=>{
    const b = e.target.closest("button"); if (!b) return;
    container.querySelectorAll("button").forEach(x=>x.classList.remove("on"));
    b.classList.add("on");
  });
}
