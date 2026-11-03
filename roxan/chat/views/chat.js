/* The conversation. Main is the one that keeps going; side chats are for a
   subject of their own. A reply is written on Roxan's side, so it keeps being
   written if this page closes: the page draws what the server says as it says
   it. Under a reply you can see what Roxan did to write it, what it kept, and
   anything it is waiting on you for. */
import { h, fill, bytes } from "../dom.js";
import * as api from "../api.js";
import * as local from "../local.js";
import * as files from "../files.js";
import { S, MAIN, watch, ensure, older, find, apply, name as who } from "../state.js";
import { mark } from "../mark.js";
import { render, codeText } from "../md.js";
import { cardish } from "../sensitive.js";
import { soon, busy, copy, stamp, approvalCard, questionCard, markSeen, edit, drop } from "../ui.js";
import { Button, IconButton, Breadcrumb, Menu, Modal, Field, Select, Kbd, TagGroup, Notice, AgentLog, AgentThinking, ComposerLoader, FileUpload, confirm } from "../kit/index.js";

const IDEAS = [
  ["Remind me", "Remind me tomorrow morning to "],
  ["Watch a page", "Check this page every morning and tell me if anything changes: "],
  ["Start a goal", "I want to "],
  ["Remember", "Remember that I "],
  ["Think it through", "Help me think through "],
];
const ENDED = { approved: "You approved this", declined: "You declined this", expired: "It expired, so it did not happen" };

export async function mount(root, { app, params }) {
  const id = params[0] || MAIN;
  const thread = S.threads.find(t => t.id === id);
  if (!thread) {
    root.append(h("section", { class: "page" }, h("h1", { class: "page-title", text: "That chat is not here." }), h("a", { class: "go", href: "#/projects" }, "Chats and projects ", h("i", { "aria-hidden": "true" }))));
    return;
  }
  const isMain = id === MAIN;
  const byId = new Map(), attachments = [], off = [];
  let stick = true, raf = 0, sending = false, warned = "", saveTimer = 0;
  const dirty = new Set();
  const box = () => S.msgs.get(id);
  const list_ = () => box()?.list || [];
  const msg = n => list_().find(m => m.id === n);
  const running = () => { const m = list_().at(-1); return m?.role === "assistant" && m.streaming ? m : null; };
  const title = () => (isMain ? "Main" : S.threads.find(t => t.id === id)?.title || "New chat");
  document.title = `${title()} — ${who()}`;

  /* ---------------------------------------------------------- the page */
  const list = h("div", { class: "list" });
  const more = h("div", { class: "more", hidden: true }, Button({ variant: "ghost", size: "sm", icon: "up" }, "Earlier messages"));
  const empty = h("div", { class: "empty", hidden: true },
    h("p", { class: "empty-title", text: isMain ? "Say what is on your mind." : "A new chat." }),
    h("p", { class: "fine", text: isMain ? `${who()} keeps this one conversation going, and carries on with your routines and goals between your messages. Try one of these, or just write.` : `A side chat is for one subject. ${who()} still knows your notes, goals and routines.` }),
    h("div", { class: "ideas" }, IDEAS.map(([label, text]) => Button({ variant: "secondary", size: "sm", onclick: () => { input.value = text; autosize(); input.focus(); input.setSelectionRange(text.length, text.length); } }, label))));
  const tl = h("div", { class: "tl", role: "log", "aria-label": "Conversation", "aria-live": "off", tabindex: "0" }, h("div", { class: "tl-in" }, more, list, empty));
  const jump = Button({ variant: "secondary", size: "sm", icon: "down", class: "jump", hidden: true, onclick: () => { stick = true; toBottom(); } }, "Jump to latest");
  const live = h("p", { class: "sr", role: "status", "aria-live": "polite" });
  const chips = h("div", { class: "chips" });
  const input = h("textarea", { id: "composer-input", rows: "1", maxlength: "20000", "aria-label": "Message", placeholder: `Message ${who()}` });
  const attach = IconButton({ "aria-label": "Attach a text file", "data-tip": "Attach a text file" }, "clip");
  const picker = h("input", { type: "file", multiple: true, accept: files.ACCEPT, hidden: true, "aria-hidden": "true", tabindex: "-1" });
  const send = Button({ size: "sm", type: "submit", icon: "send" }, "Send");
  const stop = Button({ variant: "secondary", size: "sm", icon: "stop", hidden: true }, "Stop");
  const err = h("p", { class: "err", role: "alert" });
  const form = h("form", { class: "composer", "aria-label": `Message ${who()}` }, chips,
    h("div", { class: "composer-row" }, attach, input, stop, send),
    h("p", { class: "hint" }, Kbd("Enter"), " sends, ", Kbd("Shift"), " ", Kbd("Enter"), " adds a line, ", Kbd("Esc"), " stops a reply."), err, picker);
  const loader = ComposerLoader(form);                               // a thin line runs round the composer while a reply is on the way
  const closed = h("div", { class: "closed", role: "status", hidden: true }, Notice({ tone: "error", text: `${who()} cannot answer yet: the service behind it is not switched on.` }));
  const dock = h("div", { class: "dock" }, closed, loader);
  // Dropping a text file anywhere on the conversation attaches it. The sheet is only there while a file is being dragged over.
  const sheet = FileUpload({ accept: files.ACCEPT, label: "Drop to attach", hint: `Text files only, up to ${files.MAX_FILES} at a time.`, onfiles: fs => { lift(); addFiles(fs); } });
  sheet.classList.add("chat-drop"); sheet.hidden = true;

  const heading = h("h1", { class: isMain ? "chat-title" : "chat-title sr", text: title() });       // a side chat's name is the last crumb, so the heading is for screen readers only
  const project = thread.parent && S.projects.find(p => p.id === thread.parent);
  const trail = isMain ? h("p", { class: "label crumb" }, "One conversation, kept going") : Breadcrumb([{ label: "Chats", href: "#/projects" }, project ? { label: project.title, href: "#/p/" + project.id } : null, { label: title() }]);
  const head = h("header", { class: "chat-head" }, h("div", null, trail, heading), options());
  const page = h("section", { class: "chat" }, head, tl, jump, dock, live, sheet);
  root.append(page);

  /* ----------------------------------------------- header: rename, move, clear */
  function options() {
    const more_ = IconButton({ "aria-label": isMain ? "Conversation options" : "Chat options", "data-tip": "Options" }, "more");
    return Menu(more_, isMain
      ? [{ label: "Clear this conversation", icon: "trash", danger: true, onselect: clearMain }]
      : [{ label: "Rename or move", icon: "edit", onselect: editChat }, { label: "Archive", icon: "archive", onselect: archiveChat }, { divider: true }, { label: "Delete", icon: "trash", danger: true, onselect: deleteChat }],
      { align: "end", width: 224, label: isMain ? "Conversation" : "Chat" });
  }
  async function clearMain() {
    if (!(await confirm({ title: "Clear this conversation?", description: "The messages here are removed. What Roxan has kept (notes, goals, routines) stays.", yes: "Clear", danger: true }))) return;
    busy(null, async () => { await api.del(`/threads/${MAIN}/messages`); apply({ t: "cleared", thread: MAIN }); });
  }
  async function archiveChat() {
    if (!(await confirm({ title: "Archive this chat?", description: "It leaves your list. You can find it under Archived in Chats and projects.", yes: "Archive" }))) return;
    busy(null, async () => { await edit(id, { state: "archived" }); app.go("/projects"); });
  }
  async function deleteChat() {
    if (!(await confirm({ title: "Delete this chat?", description: "Its messages are deleted for good.", yes: "Delete", danger: true }))) return;
    busy(null, async () => { await drop(id); app.go("/projects"); });
  }
  function editChat() {
    const now = S.threads.find(t => t.id === id);
    const name = h("input", { type: "text", maxlength: "80", value: now?.title || "", "aria-label": "Name" });
    const where = Select({ label: "Project", value: now?.parent || "", options: [{ value: "", label: "No project" }, ...S.projects.filter(p => p.state === "open").map(p => ({ value: p.id, label: p.title }))] });
    const save = Button({ size: "sm", type: "submit" }, "Save");
    let dlg;
    const form = h("form", { class: "pform" }, Field({ label: "Name" }, name), Field({ label: "Project" }, where),
      h("div", { class: "btns" }, save, Button({ variant: "secondary", size: "sm", type: "button", onclick: () => dlg.close() }, "Cancel")));
    form.addEventListener("submit", e => { e.preventDefault(); busy(save, async () => { await edit(id, { title: name.value.trim(), parent: where.value || null }); dlg.close(); }); });
    dlg = Modal({ title: "Rename or move", description: "Give the chat a name, or put it in a project.", body: form, size: "sm", focus: () => name });
  }

  /* ---------------------------------------------------------- scrolling */
  const gap = () => tl.scrollHeight - tl.scrollTop - tl.clientHeight;
  const toBottom = () => { tl.scrollTop = tl.scrollHeight; };
  tl.addEventListener("scroll", () => { stick = gap() < 140; jump.hidden = gap() < 400; });

  /* ---------------------------------------------------------- messages */
  const userEl = m => h("div", { class: "msg user", data: { id: m.id } }, h("div", { class: "col" },
    m.text ? h("div", { class: "bubble", text: m.text }) : null,
    m.files?.length ? h("div", { class: "chips" }, TagGroup({ label: "Attached files", items: m.files.map(f => ({ label: f.name, icon: "file" })) })) : null,
    h("div", { class: "meta", text: stamp(m.at) })));

  const noteEl = m => {
    const ap = m.approval && find(m.approval);
    return h("p", { class: "note", data: { id: m.id } }, h("span", { text: ap ? `${ap.title}. ${ENDED[ap.state] || "Answered"}.` : m.text }));
  };

  const botEl = m => {
    const log = AgentLog({ class: "trace" });
    const el = h("div", { class: "msg bot", data: { id: m.id } }, h("span", { class: "gl" }, mark(S.settings.mark)),
      h("div", { class: "col" },
        h("p", { class: "from" }), h("div", { class: "body md" }), log, h("div", { class: "learned" }), h("div", { class: "issue", role: "alert" }), h("div", { class: "cards" }),
        h("div", { class: "foot" }, h("span", { class: "meta" }), Button({ variant: "ghost", size: "xs", icon: "copy", "data-copy-msg": "" }, "Copy"))));
    el._log = log;
    return el;
  };

  const label = m => {
    if (m.reminder) return "Reminder";
    if (m.question) return "A question";
    if (m.from === "roxan") return "On its own";
    return m.from ? `From the routine “${find(m.from)?.title || "a routine"}”` : "";
  };
  const wait = () => (S.status.state === "working" && S.status.thread === id && S.status.text) || "Thinking";

  function paintBody(el, m) {
    const body = el.querySelector(".body");
    if (!m.text && m.streaming) {
      if (el._think) el._think.label(wait());                        // the same line, so its seconds keep counting
      else fill(body, el._think = AgentThinking({ label: wait(), variant: "infinity" }));
    } else { el._think = null; fill(body, render(m.text)); }
    el.querySelector(".gl").firstChild?.classList.toggle("think", Boolean(m.streaming));
    el._text = m.text;
  }

  function paintCards(el, m) {
    const mine = new Set((m.steps || []).map(s => s.approval).filter(Boolean));
    fill(el.querySelector(".cards"), [...S.approvals.filter(a => a.msg === m.id || mine.has(a.id)).map(approvalCard), ...S.questions.filter(q => q.msg === m.id).map(questionCard)]);
  }

  function paintLearned(el, m) {
    fill(el.querySelector(".learned"), (m.learned || []).map(n => find(n)).filter(Boolean).map(n => h("div", { class: "mem", data: { state: n.state === "removed" ? "dismissed" : "kept" } },
      h("span", { class: "label", text: n.state === "removed" ? "Forgotten" : "Kept a note" }), h("span", { class: "what", text: n.body }),
      n.state === "removed" ? null : Button({ variant: "ghost", size: "xs", onclick: e => busy(e.currentTarget, () => edit(n.id, { state: "removed" })) }, "Undo"))));
  }

  function paint(el, m) {
    const last = list_().at(-1) === m;
    paintBody(el, m);
    const from = label(m), f = el.querySelector(".from");
    f.textContent = from;
    f.hidden = !from;
    el._log.set((m.steps || []).map(s => ({ text: s.label, state: s.approval ? "wait" : s.ok ? "ok" : "no", sub: s.approval ? "waiting for you" : s.ok ? "done" : s.held ? "not allowed" : "did not work" })));
    el._log.hidden = !m.steps?.length;
    paintLearned(el, m);
    const issue = el.querySelector(".issue");
    const said = m.error ? m.error.message : m.stopped ? "Stopped." : m.cut ? "This reply was cut short." : "";
    fill(issue, said ? Notice({ tone: m.error ? "error" : m.stopped ? "info" : "warn", text: said, action: last && (m.error || m.stopped) ? { label: "Try again", onclick: e => busy(e.currentTarget, retry) } : null }) : null);
    issue.hidden = !said;
    paintCards(el, m);
    el.querySelector(".meta").textContent = m.streaming ? "" : stamp(m.at);
    el.dataset.status = m.streaming ? "streaming" : m.error ? "error" : "done";
  }

  const make = m => (m.role === "user" ? userEl(m) : m.role === "assistant" ? botEl(m) : noteEl(m));
  function put(m, before) {
    const old = byId.get(m.id);
    const el = old && m.role === "assistant" ? old : make(m);
    if (old && el !== old) old.replaceWith(el);
    if (!old) (before ? list.prepend(el) : list.append(el));
    byId.set(m.id, el);
    if (m.role === "assistant") paint(el, m);
    return el;
  }

  function rebuild() {
    const top = tl.scrollTop;
    byId.clear();
    fill(list);
    for (const m of list_()) put(m);
    empty.hidden = list_().length > 0;
    more.hidden = !box()?.more;
    if (stick) toBottom(); else tl.scrollTop = top;
    ui();
  }

  const flushDeltas = () => {
    raf = 0;
    for (const n of dirty) { const m = msg(n), el = byId.get(n); if (m && el) paintBody(el, m); }
    dirty.clear();
    if (stick) toBottom();
  };

  function ui() {
    const r = running();
    stop.hidden = !r;
    attach.disabled = sending;
    send.disabled = sending || !S.open;
    closed.hidden = S.open;
    form.hidden = loader.hidden = !S.open;
    loader.active = Boolean(r) || sending;
    input.placeholder = `Message ${who()}`;
  }

  /* ---------------------------------------------------------- composer */
  const autosize = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 200) + "px"; input.style.overflowY = input.scrollHeight > 200 ? "auto" : "hidden"; };
  input.addEventListener("input", () => {
    autosize();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => (input.value && !cardish(input.value) ? local.setMeta("draft:" + id, input.value) : local.delMeta("draft:" + id)), 500);      // a draft that holds a card number is not kept
  });
  const shake = text => { err.textContent = text; if (text) setTimeout(() => { if (err.textContent === text) err.textContent = ""; }, 8000); };

  function drawChips() {
    fill(chips, attachments.length ? [TagGroup({ label: "Attached files", items: attachments.map(a => ({ label: `${a.name} (${bytes(a.size)}${a.truncated ? ", start only" : ""})`, icon: "file" })), onremove: (_, i) => { attachments.splice(i, 1); drawChips(); } })] : []);
  }
  async function addFiles(fs) {
    shake("");
    for (const f of fs) {
      if (attachments.length >= files.MAX_FILES) { shake(`${who()} reads up to ${files.MAX_FILES} attachments at a time.`); break; }
      try {
        const p = await files.prepare(f);
        attachments.push(p);
      } catch (e) { shake(e.message); }
    }
    drawChips();
  }
  attach.addEventListener("click", () => picker.click());
  picker.addEventListener("change", () => { addFiles([...picker.files]); picker.value = ""; });
  input.addEventListener("paste", e => { const fs = [...(e.clipboardData?.files || [])]; if (fs.length) { e.preventDefault(); addFiles(fs); } });
  let dragging = 0;
  const lift = () => { dragging = 0; sheet.hidden = true; };
  const carries = e => e.dataTransfer?.types?.includes("Files");
  page.addEventListener("dragenter", e => { if (carries(e) && S.open) { dragging++; sheet.hidden = false; } });
  page.addEventListener("dragleave", e => { if (carries(e) && --dragging <= 0) lift(); });
  for (const t of ["drop", "dragend"]) document.addEventListener(t, lift);

  async function submit() {
    const text = input.value.trim();
    if ((!text && !attachments.length) || sending) return;
    if (!S.open) return shake(`${who()} cannot answer yet.`);
    if (!text) return shake("Say something about what you attached.");
    if (cardish(text)) return shake("That looks like a card number. Keep those in the vault; Roxan never needs them.");
    sending = true;
    ui();
    shake("");
    try {
      const wire = await files.wire(attachments);
      const r = await api.post(`/threads/${id}/messages`, { text, files: wire });
      attachments.splice(0);
      input.value = "";
      autosize(); drawChips();
      clearTimeout(saveTimer);
      local.delMeta("draft:" + id);
      stick = true;
      apply({ t: "msg", message: r.message });
      apply({ t: "msg", message: r.reply });
      live.textContent = `${who()} is replying.`;
    } catch (e) { shake(e.message || "Something went wrong."); }
    finally { sending = false; ui(); if (!form.hidden) input.focus({ preventScroll: true }); }
  }
  async function retry() {
    const r = await api.post(`/threads/${id}/retry`);
    stick = true;
    apply({ t: "msg", message: r.reply });
  }
  const halt = () => { const m = running(); if (m?.runId) api.post(`/runs/${m.runId}/stop`).catch(e => shake(e.message)); };

  form.addEventListener("submit", e => { e.preventDefault(); submit(); });
  stop.addEventListener("click", halt);
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } });
  const onKey = e => {
    if (e.key === "Escape" && running()) { halt(); return; }
    if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) && !document.activeElement?.isContentEditable && !form.hidden) { e.preventDefault(); input.focus(); }
  };
  document.addEventListener("keydown", onKey);

  list.addEventListener("click", async e => {
    const code = e.target.closest("[data-copy]"), whole = e.target.closest("[data-copy-msg]"), btn = code || whole;
    if (btn) copy(btn, code ? codeText(code.closest("pre")) : whole.closest(".msg")._text || "");
  });

  /* ---------------------------------------------------------- staying current */
  const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting) && !more.hidden) loadEarlier(); }, { root: tl });
  io.observe(more);
  more.querySelector("button").addEventListener("click", () => loadEarlier());
  async function loadEarlier() {
    const b = box();
    if (!b?.more) return;
    const before = tl.scrollHeight, first = b.list[0]?.id;
    try { await older(id); } catch (e) { shake(e.message); return; }
    for (const m of b.list.filter(x => x.id < first).reverse()) put(m, true);
    tl.scrollTop += tl.scrollHeight - before;
    more.hidden = !b.more;
  }

  off.push(
    watch("messages", d => {
      if (d.thread !== id) return;
      if (d.id == null) return rebuild();
      if (d.removed) { byId.get(d.id)?.remove(); byId.delete(d.id); empty.hidden = list_().length > 0; return ui(); }
      const m = msg(d.id);
      if (!m) return;
      const fresh = !byId.has(m.id);
      const el = put(m);
      if (fresh) {
        empty.hidden = true;
        if (m.role === "user") stick = true;
        const before = el.previousElementSibling, prior = before?.classList.contains("bot") && msg(Number(before.dataset.id));
        if (prior) paint(before, prior);                          // "Try again" belongs to the newest reply only
      }
      if (stick) toBottom();
      ui();
    }),
    watch("delta", d => { if (d.thread === id) { dirty.add(d.id); if (!raf) raf = requestAnimationFrame(flushDeltas); } }),
    watch(["approvals", "questions"], soon(() => { for (const [n, el] of byId) { const m = el.classList.contains("bot") && msg(n); if (m) paintCards(el, m); } })),
    watch("memories", soon(() => { for (const [n, el] of byId) { const m = el.classList.contains("bot") && msg(n); if (m?.learned?.length) paintLearned(el, m); } })),
    watch("status", () => { const m = running(), el = m && byId.get(m.id); if (el && !m.text) paintBody(el, m); ui(); }),
    watch("settings", ui),
    watch("threads", () => { heading.textContent = title(); const here = trail.querySelector?.('[aria-current="page"]'); if (here) here.textContent = title(); document.title = `${title()} — ${who()}`; }),
  );

  /* ---------------------------------------------------------- first paint */
  try { await ensure(id); } catch (e) { empty.hidden = false; shake(e.message); }
  rebuild();
  toBottom();
  const draft = await local.getMeta("draft:" + id);
  if (app.prefill) { input.value = app.prefill; app.prefill = null; autosize(); } else if (draft) { input.value = draft; autosize(); }
  if (isMain && S.unread) markSeen().catch(() => {});
  if (!form.hidden) input.focus({ preventScroll: true });

  return () => {
    off.forEach(f => f());
    document.removeEventListener("keydown", onKey);
    for (const t of ["drop", "dragend"]) document.removeEventListener(t, lift);
    io.disconnect();
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(saveTimer);
  };
}
