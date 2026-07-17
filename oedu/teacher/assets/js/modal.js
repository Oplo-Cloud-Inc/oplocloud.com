// ============================================================
// Modal / form / confirm system
// ============================================================
import { icon } from "./icons.js";
import { h, esc } from "./ui.js";
import { subjects } from "./data.js";
import { classes } from "./store.js";
import { generate, ACTION_META, TONES, LANGUAGES } from "./ai.js";

let openCount = 0;

export function modal({ title, subtitle, bodyHTML, wide=false, onMount, footerHTML }){
  const layer = h(`<div class="modal-layer">
    <div class="modal-scrim"></div>
    <div class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${esc(title||'')}">
      <header class="modal-head">
        <div><div class="modal-title">${esc(title||"")}</div>
          ${subtitle?`<div class="modal-sub">${esc(subtitle)}</div>`:""}</div>
        <button class="icon-btn modal-x" aria-label="Close">${icon("x")}</button>
      </header>
      <div class="modal-body">${bodyHTML||""}</div>
      ${footerHTML?`<footer class="modal-foot">${footerHTML}</footer>`:""}
    </div>
  </div>`);
  document.body.appendChild(layer);
  openCount++;
  requestAnimationFrame(()=>layer.classList.add("in"));
  const close = ()=>{
    layer.classList.remove("in");
    setTimeout(()=>{ layer.remove(); openCount=Math.max(0,openCount-1); }, 220);
  };
  layer.querySelector(".modal-x").onclick = close;
  layer.querySelector(".modal-scrim").onclick = close;
  const onKey = (e)=>{ if(e.key==="Escape"){ close(); document.removeEventListener("keydown",onKey);} };
  document.addEventListener("keydown", onKey);
  if (onMount) onMount(layer, close);
  return { el:layer, close };
}

// ---- field builder ----
function field(f){
  const id = "f_"+f.name;
  const req = f.required ? "required" : "";
  const label = `<label class="fld-label" for="${id}">${esc(f.label)}${f.required?' <span class="req">*</span>':''}</label>`;
  let control="";
  if (f.type==="select" || f.type==="class" || f.type==="subject"){
    let opts = f.options;
    if (f.type==="class") opts = classes.map(c=>({value:c,label:"Class "+c}));
    if (f.type==="subject") opts = Object.keys(subjects).map(k=>({value:k,label:subjects[k].name}));
    control = `<select id="${id}" name="${f.name}" class="fld-input" ${req}>
      ${f.placeholder?`<option value="" disabled ${f.value?'':'selected'}>${esc(f.placeholder)}</option>`:""}
      ${opts.map(o=>{const v=typeof o==="string"?o:o.value;const l=typeof o==="string"?o:o.label;
        return `<option value="${esc(v)}" ${String(f.value)===String(v)?'selected':''}>${esc(l)}</option>`;}).join("")}
    </select>`;
  } else if (f.type==="textarea"){
    control = `<textarea id="${id}" name="${f.name}" class="fld-input" rows="3" placeholder="${esc(f.placeholder||'')}" ${req}>${esc(f.value||"")}</textarea>`;
  } else {
    const t = f.type==="number"?"number":f.type==="date"?"date":f.type==="time"?"time":f.type==="email"?"email":"text";
    const extra = f.type==="number"?`min="${f.min??0}" max="${f.max??''}"`:"";
    control = `<input id="${id}" name="${f.name}" type="${t}" class="fld-input" value="${esc(f.value??"")}" placeholder="${esc(f.placeholder||'')}" ${extra} ${req}>`;
  }
  return `<div class="fld ${f.half?'half':''}">${label}${control}${f.hint?`<div class="fld-hint">${esc(f.hint)}</div>`:""}</div>`;
}

export function formModal({ title, subtitle, fields, submitLabel="Save", onSubmit, wide=false }){
  const bodyHTML = `<form id="modal-form" class="fld-grid">${fields.map(field).join("")}</form>`;
  const footerHTML = `<button class="btn btn-ghost" data-cancel>Cancel</button>
    <button class="btn btn-primary" data-submit>${icon("check")}${esc(submitLabel)}</button>`;
  const m = modal({ title, subtitle, bodyHTML, footerHTML, wide, onMount:(layer, close)=>{
    const form = layer.querySelector("#modal-form");
    const submit = ()=>{
      if (!form.reportValidity()) return;
      const data = {};
      fields.forEach(f=>{ const el=form.elements[f.name]; if(!el) return;
        let v=el.value; if(f.type==="number") v = v===""?null:+v; data[f.name]=v; });
      onSubmit(data, close);
    };
    layer.querySelector("[data-submit]").onclick = submit;
    layer.querySelector("[data-cancel]").onclick = close;
    form.addEventListener("submit", e=>{ e.preventDefault(); submit(); });
    const first = form.querySelector("input,select,textarea"); if(first) setTimeout(()=>first.focus(),120);
  }});
  return m;
}

// ============================================================
// aiModal — the "zero tools" AI surface. The draft is already written
// by the time the teacher sees it; they review, tweak, and approve.
// ============================================================
export function aiModal({ action, context={}, title, subtitle, acceptLabel, onAccept }){
  const meta = ACTION_META[action] || { label:"Draft", verb:"Use", tone:false, translate:false, icon:"sparkle" };
  const controls = `
    <div class="ai-controls">
      ${meta.tone ? `<label class="ai-ctl"><span>Tone</span>
        <select class="fld-input" data-tone>${TONES.map(t=>`<option value="${t}">${t[0].toUpperCase()+t.slice(1)}</option>`).join("")}</select></label>`:""}
      ${meta.translate ? `<label class="ai-ctl"><span>Language</span>
        <select class="fld-input" data-lang>${LANGUAGES.map(l=>`<option value="${l}">${l}</option>`).join("")}</select></label>`:""}
      <span class="grow"></span>
      <button class="btn btn-sm btn-soft" data-regen>${icon("refresh")}Regenerate</button>
    </div>`;
  const bodyHTML = `
    <div class="ai-draft">
      <div class="ai-provenance">${icon("sparkle")}<span data-prov>Drafting from this class's context…</span></div>
      ${controls}
      <div class="ai-stage" data-stage>
        <div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span></div>
      </div>
    </div>`;
  const footerHTML = `<button class="btn btn-ghost" data-cancel>Discard</button>
    <button class="btn btn-primary" data-accept disabled>${icon("check")}${esc(acceptLabel||meta.verb)}</button>`;

  return modal({ title: title||meta.label, subtitle, bodyHTML, footerHTML, wide:true, onMount:(layer, close)=>{
    const stage = layer.querySelector("[data-stage]");
    const prov  = layer.querySelector("[data-prov]");
    const accept= layer.querySelector("[data-accept]");
    const toneEl= layer.querySelector("[data-tone]");
    const langEl= layer.querySelector("[data-lang]");
    let text = "";
    const run = async ()=>{
      stage.innerHTML = `<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span></div>`;
      accept.disabled = true; prov.textContent = "Drafting from this class's context…";
      const ctx = { ...context, tone: toneEl?.value, language: langEl?.value };
      const r = await generate(action, ctx);
      text = r.text;
      stage.innerHTML = `<textarea class="fld-input ai-text" rows="12">${esc(text)}</textarea>`;
      prov.textContent = r.connected ? `Drafted by ${r.model}` : "Draft ready — review before you send. (Local draft; connect a model for live generation.)";
      accept.disabled = false;
      const ta = stage.querySelector("textarea");
      ta.addEventListener("input", ()=>{ text = ta.value; });
    };
    layer.querySelector("[data-regen]").onclick = run;
    toneEl?.addEventListener("change", run);
    langEl?.addEventListener("change", run);
    layer.querySelector("[data-cancel]").onclick = close;
    accept.onclick = ()=>{ onAccept && onAccept(text, close, { tone: toneEl?.value, language: langEl?.value }); };
    run();
  }});
}

export function confirmModal({ title, message, confirmLabel="Confirm", danger=false, onConfirm }){
  const footerHTML = `<button class="btn btn-ghost" data-cancel>Cancel</button>
    <button class="btn ${danger?'btn-danger':'btn-primary'}" data-ok>${esc(confirmLabel)}</button>`;
  return modal({ title, bodyHTML:`<p class="modal-msg">${esc(message)}</p>`, footerHTML, onMount:(layer,close)=>{
    layer.querySelector("[data-cancel]").onclick = close;
    layer.querySelector("[data-ok]").onclick = ()=>{ onConfirm(); close(); };
    setTimeout(()=>layer.querySelector("[data-ok]").focus(),120);
  }});
}
