/* The conversation: one continuing thread per room (the main one, or a
   conversation inside a project). Messages stream in as they are written,
   proposals appear as cards, and what is older loads as you scroll back. */
import { h, on, emit, clock, when, bytes } from "../dom.js";
import * as db from "../db.js";
import * as store from "../store.js";
import * as turn from "../turn.js";
import { render, codeText } from "../md.js";
import { card } from "../cards.js";
import * as files from "../files.js";
import { gate } from "../gate.js";
import { cardish } from "../sensitive.js";
import { sessionForm } from "./project.js";

const PAGE = 40;
const IDEAS = [
  ["Remind me", "Remind me tomorrow morning to "],
  ["Remember", "Remember that I "],
  ["Handoff", "I need this done on a website: "],
  ["Specialty", "Make a specialty for "],
  ["Think it through", "Help me think through "],
];
const PREFIX = { stopped: "Stopped · ", cutoff: "Cut off · ", error: "Not finished · " };
const sameDay =(a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const stamp = ms => (sameDay(ms, Date.now()) ? clock(ms) : when(ms));
const settle = (ms, ok) => new Promise(r => { const t = setInterval(() => { if (ok()) { clearInterval(t); r(true); } }, 50); setTimeout(() => { clearInterval(t); r(false); }, ms); });

export async function mount(root, { app, params }) {
  const room = await store.getRoom(params[0] || store.MAIN);
  if (room?.kind === "project") { app.go("/p/" + room.id); return; }          // a project holds conversations; it is not one
  if (!room) {
    root.append(h("section", { class: "page" }, h("p", { class: "label", text: "Not found" }), h("h1", { class: "page-title", text: "That conversation is not here." }), h("a", { class: "go", href: "#/projects" }, "Projects ", h("i", { text: "→" }))));
    return;
  }
  const project = room.kind === "session" ? await store.getRoom(room.projectId) : null;
  if (room.kind === "session") document.title = `${room.name} — Roxan`;
  let notes = await db.all("memories");
  const byId = new Map();
  let oldest = Infinity, stick = true, ctl = null, busy = false, raf = 0, dirty = null, shown = 0;
  const attachments = [];
  const urls = [];

  /* ---------------------------------------------------------- the page */
  const list = h("div", { class: "list" });
  const more = h("div", { class: "more", hidden: true }, h("button", { class: "go", type: "button", text: "Earlier messages" }));
  const empty = h("div", { class: "empty" },
    h("p", { class: "label", text: project ? project.name : "Roxan" }),
    h("p", { class: "empty-title", text: project ? "A new conversation." : "Say what is on your mind." }),
    h("p", { class: "fine", text: project?.instructions ? "Roxan keeps this conversation on your device, and reads this project's notes with every message. Try one of these, or just write." : "Roxan keeps this conversation on your device. Try one of these, or just write." }),
    h("div", { class: "ideas" }, IDEAS.map(([label, text]) => h("button", { class: "btn sm ghost", type: "button", text: label, onclick: () => { input.value = text; autosize(); input.focus(); input.setSelectionRange(text.length, text.length); } }))));
  const tl = h("div", { class: "tl", role: "log", "aria-label": "Conversation", "aria-live": "off", tabindex: "0" }, h("div", { class: "tl-in" }, more, list, empty));
  const jump = h("button", { class: "jump", type: "button", hidden: true, text: "Latest ↓", onclick: () => { stick = true; toBottom(); } });
  const live = h("p", { class: "sr", role: "status", "aria-live": "polite" });
  const chips = h("div", { class: "chips" });
  const input = h("textarea", { id: "composer-input", rows: "1", maxlength: "20000", "aria-label": "Message", placeholder: project ? `Message in ${project.name}` : "Message Roxan" });
  const attach = h("button", { class: "icon", type: "button", "aria-label": "Attach a file or image", title: "Attach a file or image", text: "+" });
  const picker = h("input", { type: "file", multiple: true, accept: files.ACCEPT, hidden: true, "aria-hidden": "true", tabindex: "-1" });
  const send = h("button", { class: "btn sm", type: "submit", text: "Send" });
  const stop = h("button", { class: "btn sm ghost", type: "button", hidden: true, text: "Stop" });
  const err = h("p", { class: "err", role: "alert" });
  const form = h("form", { class: "composer", "aria-label": "Message Roxan" }, chips,
    h("div", { class: "composer-row" }, attach, input, stop, send),
    h("p", { class: "hint", text: "Enter to send · Shift+Enter for a new line · Esc to stop" }), err, picker);
  const gateSlot = h("div", { class: "gate-slot" });
  const dock = h("div", { class: "dock" }, gateSlot, form);

  const title = h("h1", { class: "chat-title", text: room.name });
  const crumb = project ? h("p", { class: "label crumb" }, h("a", { href: "#/projects", text: "Projects" }), " / ", h("a", { href: "#/p/" + project.id, text: project.name })) : h("p", { class: "label", text: "Conversation" });
  const head = h("header", { class: "chat-head" }, h("div", null, crumb, title));
  let nameInput = null;                                          // the rename field, kept in step when the first message names the conversation
  if (project) {
    const settingsForm = sessionForm(room, { onSave: r => { title.textContent = r.name; document.title = `${r.name} — Roxan`; }, onDelete: () => app.go("/p/" + project.id) });
    nameInput = settingsForm.querySelector("input");
    settingsForm.append(h("a", { class: "go sm", href: "#/p/" + project.id }, "Project settings ", h("i", { text: "→" })));
    head.append(h("details", { class: "proj-settings" }, h("summary", { text: "Conversation settings" }), settingsForm));
  }
  root.append(h("section", { class: "chat" }, head, tl, jump, dock, live));

  /* ----------------------------------------------------------- scrolling */
  const gap = () => tl.scrollHeight - tl.scrollTop - tl.clientHeight;
  const toBottom = () => { tl.scrollTop = tl.scrollHeight; };
  tl.addEventListener("scroll", () => { stick = gap() < 140; jump.hidden = gap() < 400; });

  /* ------------------------------------------------------------ messages */
  const userEl = ev => h("div", { class: "msg user", data: { id: ev.id } }, h("div", { class: "col" },
    ev.text ? h("div", { class: "bubble", text: ev.text }) : null,
    ev.files?.length ? h("div", { class: "chips" }, ev.files.map(f => h("span", { class: "chip static" }, h("span", { text: f.name }), h("span", { class: "dim", text: ` · ${f.kind === "image" ? "image" : f.kind === "pdf" ? "PDF" : bytes(f.size)}` })))) : null,
    h("div", { class: "meta", text: stamp(ev.at) })));

  // "3 notes shown": which of your notes went along with the message this reply answers. Shown is all we can say; Roxan decides what to use.
  const usedEl = ev => {
    if (!ev.used?.length) return null;
    const list = h("ul", { class: "used-list" });
    const box = h("details", { class: "used" }, h("summary", { text: `${ev.used.length} note${ev.used.length === 1 ? "" : "s"} shown` }), list);
    box.addEventListener("toggle", () => {
      if (!box.open) return;
      const kept = ev.used.map(id => notes.find(m => m.id === id)).filter(m => m && !m.deleted);
      const gone = ev.used.length - kept.length;
      list.replaceChildren(...[...kept.map(m => h("li", { text: m.text })), gone ? h("li", { class: "fine", text: `${gone} since removed` }) : null].filter(Boolean));
    });
    return box;
  };

  const botEl = ev => {
    const copy = h("button", { class: "act-btn", type: "button", "data-copy-msg": "", text: "Copy" });
    return h("div", { class: "msg bot", data: { id: ev.id } }, h("span", { class: "mark", "aria-hidden": "true" }),
      h("div", { class: "col" }, h("div", { class: "body md" }), h("div", { class: "meta" }), usedEl(ev), h("div", { class: "row-actions" }, copy)));
  };

  const noteEl = ev => {
    const el = h("p", { class: "note", role: ev.tone === "error" ? "alert" : null, data: { tone: ev.tone || "notice", id: ev.id } }, h("span", { text: ev.text }));
    if (ev.retry) el.append(h("button", { class: "act-btn", type: "button", "data-retry": "", text: "Try again", onclick: retry }));
    return el;
  };

  const elFor = ev => (ev.kind === "user" ? userEl(ev) : ev.kind === "assistant" ? botEl(ev) : ev.kind === "proposal" ? card(ev, notes) : noteEl(ev));

  function paint(ev) {
    const el = byId.get(ev.id);
    if (!el) return;
    const body = el.querySelector(".body"), mark = el.querySelector(".mark"), meta = el.querySelector(".meta");
    const waiting = !ev.text && ev.status === "streaming";
    body.replaceChildren(waiting ? h("span", { class: "label", text: "Thinking" }) : render(ev.text));
    mark.classList.toggle("think", ev.status === "streaming");
    meta.textContent = ev.status === "streaming" ? "" : (PREFIX[ev.status] || "") + stamp(ev.at);
    el.dataset.status = ev.status;
    el._text = ev.text;
    if (stick) toBottom();
  }
  const schedule = ev => { dirty = ev; if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint(dirty); }); };

  function add(ev) {
    const el = elFor(ev);
    byId.set(ev.id, el);
    list.append(el);
    shown++;
    empty.hidden = true;
    if (ev.kind === "assistant") paint(ev);
    if (stick) toBottom();
  }

  const hooks = {
    onUser: ev => { stick = true; add(ev); },
    onAssistant: ev => add(ev),
    onDelta: ev => schedule(ev),
    onSettled: ev => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!ev.text.trim()) { byId.get(ev.id)?.remove(); byId.delete(ev.id); } else paint(ev);
    },
    onProposal: ev => add(ev),
    onNote: ev => add(ev),
  };

  async function loadEarlier() {
    if (more.hidden) return;
    const rows = await db.eventsIn(room.id, { before: oldest, limit: PAGE });
    if (!rows.length) { more.hidden = true; return; }
    const before = tl.scrollHeight;
    const frag = document.createDocumentFragment();
    for (const ev of rows) { const el = elFor(ev); byId.set(ev.id, el); frag.append(el); if (ev.kind === "assistant") queueMicrotask(() => paint(ev)); }
    list.prepend(frag);
    tl.scrollTop += tl.scrollHeight - before;
    oldest = rows[0].at;
    shown += rows.length;
    more.hidden = rows.length < PAGE;
  }

  /* ---------------------------------------------------------- composer */
  const autosize = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 200) + "px"; };
  let saveTimer = 0;
  input.addEventListener("input", () => {
    autosize();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => (input.value && !cardish(input.value) ? store.setMeta("draft:" + room.id, input.value) : store.delMeta("draft:" + room.id)), 500);   // a draft that holds a card number is not kept on the device
  });

  const shake = text => { err.textContent = text; if (text) setTimeout(() => { if (err.textContent === text) err.textContent = ""; }, 7000); };

  function drawChips() {
    urls.splice(0).forEach(u => URL.revokeObjectURL(u));
    chips.replaceChildren(...attachments.map((a, i) => {
      const thumb = a.kind === "image" ? (() => { const u = URL.createObjectURL(a.blob); urls.push(u); return h("img", { class: "thumb", src: u, alt: "" }); })() : null;
      return h("span", { class: "chip" }, thumb, h("span", { text: a.name }), h("span", { class: "dim", text: ` · ${a.kind === "image" ? "image" : a.kind === "pdf" ? "PDF" : bytes(a.size)}${a.truncated ? " (start only)" : ""}` }),
        h("button", { type: "button", "aria-label": `Remove ${a.name}`, text: "×", onclick: () => { attachments.splice(i, 1); drawChips(); } }));
    }));
  }

  async function addFiles(list_) {
    shake("");
    for (const f of list_) {
      if (attachments.length >= files.MAX_FILES) { shake(`Roxan reads up to ${files.MAX_FILES} attachments at a time.`); break; }
      try {
        const p = await files.prepare(f);
        if (p.kind === "pdf" && attachments.some(a => a.kind === "pdf")) throw new files.FileError("Roxan reads one PDF at a time.");
        attachments.push(p);
      } catch (e) { shake(e.message); }
    }
    drawChips();
  }
  attach.addEventListener("click", () => picker.click());
  picker.addEventListener("change", () => { addFiles([...picker.files]); picker.value = ""; });
  input.addEventListener("paste", e => { const fs = [...(e.clipboardData?.files || [])]; if (fs.length) { e.preventDefault(); addFiles(fs); } });
  for (const t of ["dragover", "drop"]) dock.addEventListener(t, e => { if (!e.dataTransfer?.types?.includes("Files")) return; e.preventDefault(); if (t === "drop") addFiles([...e.dataTransfer.files]); });

  function ui() {
    stop.hidden = !busy;
    send.hidden = busy;
    attach.disabled = busy;
  }

  async function begin(run) {
    busy = true;
    ctl = new AbortController();
    ui();
    shake("");
    live.textContent = "Roxan is replying.";
    try {
      const out = await run(ctl.signal);
      if (out?.failure?.code === "invite") { app.gateway.access = false; emit("gateway"); }
      live.textContent = out?.failure ? "The reply did not finish." : out?.assistant?.status === "stopped" ? "Stopped." : "Roxan replied.";
    } catch (e) {
      shake(e.message || "Something went wrong.");
    } finally {
      busy = false;
      ctl = null;
      ui();
      if (!form.hidden) input.focus({ preventScroll: true });
    }
  }

  function dropFailedTurn() {
    while (list.lastElementChild && !list.lastElementChild.classList.contains("user")) { byId.delete(list.lastElementChild.dataset.id); list.lastElementChild.remove(); }
  }
  function retry() {
    if (busy) return;
    if (!app.canChat()) { drawGate(); return; }
    dropFailedTurn();
    begin(signal => turn.retry(room, app.invite, signal, hooks));
  }

  let warned = "";                                               // the text we already warned about; a second press with it unchanged sends it
  async function submit() {
    const text = input.value.trim();
    if ((!text && !attachments.length) || busy) return;
    if (!app.canChat()) { drawGate(); return; }
    if (cardish(text) && warned !== text) {
      warned = text;
      shake("That looks like a card number. Everything you send here goes to Roxan's model, so keep cards in the Vault. Press Send again to send it anyway.");
      return;
    }
    warned = "";
    const prepared = attachments.splice(0);
    input.value = "";
    autosize();
    drawChips();
    clearTimeout(saveTimer);
    store.delMeta("draft:" + room.id);
    await begin(signal => turn.send(room, app.invite, text, prepared, signal, hooks));
  }

  form.addEventListener("submit", e => { e.preventDefault(); submit(); });
  stop.addEventListener("click", () => ctl?.abort());
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); }
  });
  const onKey = e => {
    if (e.key === "Escape" && busy) { ctl?.abort(); return; }
    const panel = head.querySelector(".proj-settings[open]");
    if (e.key === "Escape" && panel) { panel.open = false; panel.querySelector("summary").focus(); return; }
    if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) && !document.activeElement?.isContentEditable && !form.hidden) { e.preventDefault(); input.focus(); }
  };
  document.addEventListener("keydown", onKey);

  list.addEventListener("click", async e => {
    const code = e.target.closest("[data-copy]");
    const msg = e.target.closest("[data-copy-msg]");
    const el = code || msg;
    if (!el) return;
    const text = code ? codeText(code.closest("pre")) : msg.closest(".msg")._text || "";
    try { await navigator.clipboard.writeText(text); el.textContent = "Copied"; } catch { el.textContent = "Not copied"; }
    setTimeout(() => { el.textContent = "Copy"; }, 1600);
  });

  /* ---------------------------------------------------- gate and updates */
  let shownGate = null;                                          // redraw only when the answer changes, so a half-typed code survives the status checks
  function drawGate() {
    const g = app.gateway;
    const ok = g.state === "checking" || app.canChat();
    const key = ok ? "ok" : `${g.state}:${g.access}`;
    send.disabled = g.state === "checking";
    if (key === shownGate) return;
    const hadGate = shownGate && shownGate !== "ok";
    shownGate = key;
    form.hidden = !ok;
    gateSlot.replaceChildren(...(ok ? [] : [gate(app)]));
    if (ok && hadGate) input.focus({ preventScroll: true });
  }
  const off = [
    on("gateway", drawGate),
    on("proposal", e => {
      const ev = e.detail;
      const old = byId.get(ev.id);
      if (ev.roomId !== room.id || !old) return;
      const fresh = card(ev, notes), held = old.contains(document.activeElement);
      old.replaceWith(fresh);
      byId.set(ev.id, fresh);
      if (ev.state !== "awaiting") live.textContent = ev.state === "done" ? ev.result?.message || "Done." : ev.state === "declined" ? "Declined." : "";
      if (held && !form.hidden) input.focus({ preventScroll: true });          // the button that was pressed is gone; carry on in the composer
    }),
    on("memories", async () => { notes = await db.all("memories"); }),
    on("rooms", () => {                                          // the first message gives a new conversation its title
      if (title.textContent === room.name) return;
      title.textContent = room.name;
      document.title = `${room.name} — Roxan`;
      if (nameInput) nameInput.value = room.name;
    }),
  ];
  const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) loadEarlier(); }, { root: tl });
  io.observe(more);
  more.querySelector("button").addEventListener("click", loadEarlier);

  /* -------------------------------------------------------------- first paint */
  const first = await db.eventsIn(room.id, { limit: PAGE });
  for (const ev of first) { const el = elFor(ev); byId.set(ev.id, el); list.append(el); if (ev.kind === "assistant") paint(ev); }
  shown = first.length;
  oldest = first[0]?.at ?? Infinity;
  more.hidden = first.length < PAGE;
  empty.hidden = shown > 0;
  toBottom();
  const draft = await store.getMeta("draft:" + room.id);
  if (draft) { input.value = draft; autosize(); }
  drawGate();
  ui();

  // A question typed on Home arrives here to be sent.
  if (app.pendingSend && room.kind === "main") {
    const text = app.pendingSend;
    app.pendingSend = null;
    input.value = text;
    autosize();
    await settle(3000, () => app.gateway.state !== "checking");
    drawGate();
    if (app.canChat()) submit(); else input.focus({ preventScroll: true });
  } else if (!form.hidden) input.focus({ preventScroll: true });

  return () => {
    off.forEach(f => f());
    document.removeEventListener("keydown", onKey);
    io.disconnect();
    if (raf) cancelAnimationFrame(raf);
    ctl?.abort();
    urls.forEach(u => URL.revokeObjectURL(u));
    clearTimeout(saveTimer);
  };
}
