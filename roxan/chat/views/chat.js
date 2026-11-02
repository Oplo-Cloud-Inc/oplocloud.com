/* The conversation. Main is the one that keeps going; side chats are for a
   subject of their own. A reply is written on Roxan's side, so it keeps being
   written if this page closes: the page draws what the server says as it says
   it. Under a reply you can see what Roxan did to write it, what it kept, and
   anything it is waiting on you for. */
import { h, fill, field, bytes } from "../dom.js";
import * as api from "../api.js";
import * as local from "../local.js";
import * as files from "../files.js";
import { S, MAIN, watch, ensure, older, find, apply, name as who } from "../state.js";
import { mark } from "../mark.js";
import { render, codeText } from "../md.js";
import { cardish } from "../sensitive.js";
import { soon, busy, sure, copy, stamp, approvalCard, questionCard, markSeen, edit, drop, pick } from "../ui.js";

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
  const more = h("div", { class: "more", hidden: true }, h("button", { class: "go", type: "button", text: "Earlier messages" }));
  const empty = h("div", { class: "empty", hidden: true },
    h("p", { class: "empty-title", text: isMain ? "Say what is on your mind." : "A new chat." }),
    h("p", { class: "fine", text: isMain ? `${who()} keeps this one conversation going, and carries on with your routines and goals between your messages. Try one of these, or just write.` : `A side chat is for one subject. ${who()} still knows your notes, goals and routines.` }),
    h("div", { class: "ideas" }, IDEAS.map(([label, text]) => h("button", { class: "btn sm ghost", type: "button", text: label, onclick: () => { input.value = text; autosize(); input.focus(); input.setSelectionRange(text.length, text.length); } }))));
  const tl = h("div", { class: "tl", role: "log", "aria-label": "Conversation", "aria-live": "off", tabindex: "0" }, h("div", { class: "tl-in" }, more, list, empty));
  const jump = h("button", { class: "jump", type: "button", hidden: true, text: "Jump to latest", onclick: () => { stick = true; toBottom(); } });
  const live = h("p", { class: "sr", role: "status", "aria-live": "polite" });
  const chips = h("div", { class: "chips" });
  const input = h("textarea", { id: "composer-input", rows: "1", maxlength: "20000", "aria-label": "Message", placeholder: `Message ${who()}` });
  const attach = h("button", { class: "icon", type: "button", "aria-label": "Attach a text file", title: "Attach a text file", text: "+" });
  const picker = h("input", { type: "file", multiple: true, accept: files.ACCEPT, hidden: true, "aria-hidden": "true", tabindex: "-1" });
  const send = h("button", { class: "btn sm", type: "submit", text: "Send" });
  const stop = h("button", { class: "btn sm ghost", type: "button", hidden: true, text: "Stop" });
  const err = h("p", { class: "err", role: "alert" });
  const form = h("form", { class: "composer", "aria-label": `Message ${who()}` }, chips,
    h("div", { class: "composer-row" }, attach, input, stop, send),
    h("p", { class: "hint", text: "Enter sends, Shift+Enter adds a line, Esc stops a reply." }), err, picker);
  const closed = h("p", { class: "note", role: "status", "data-tone": "error", hidden: true }, h("span", { text: `${who()} cannot answer yet: the service behind it is not switched on.` }));
  const dock = h("div", { class: "dock" }, closed, form);

  const heading = h("h1", { class: "chat-title", text: title() });
  const head = h("header", { class: "chat-head" }, h("div", null, isMain ? h("p", { class: "label crumb" }, "One conversation, kept going") : h("p", { class: "label crumb" }, h("a", { href: "#/projects", text: "Chats" })), heading), settingsPanel());
  root.append(h("section", { class: "chat" }, head, tl, jump, dock, live));

  /* ----------------------------------------------- header: rename, move, clear */
  function settingsPanel() {
    if (isMain) {
      const box = h("details", { class: "proj-settings" }, h("summary", { text: "Conversation" }), h("div", { class: "pform" },
        h("p", { class: "fine", text: "Clearing removes the messages here. What Roxan has kept (notes, goals, routines) stays." }),
        h("div", { class: "btns" }, sure("Clear this conversation", async b => { await busy(b, async () => { await api.del(`/threads/${MAIN}/messages`); apply({ t: "cleared", thread: MAIN }); box.open = false; }); }, { cls: "btn sm ghost", confirm: "Press again to clear" }))));
      return box;
    }
    const name = h("input", { type: "text", maxlength: "80", value: S.threads.find(t => t.id === id)?.title || "", "aria-label": "Name" });
    const where = pick([["", "No project"], ...S.projects.filter(p => p.state === "open").map(p => [p.id, p.title])], thread.parent || "", { "aria-label": "Project" });
    const save = h("button", { class: "btn sm", type: "submit", text: "Save" });
    const form = h("form", { class: "pform" }, field("Name", name), field("Project", where), h("div", { class: "btns" }, save,
      sure("Archive", async b => { await busy(b, async () => { await edit(id, { state: "archived" }); app.go("/projects"); }); }, { cls: "btn sm ghost", confirm: "Press again to archive" }),
      sure("Delete", async b => { await busy(b, async () => { await drop(id); app.go("/projects"); }); }, { cls: "btn sm ghost", confirm: "Press again to delete" })));
    form.addEventListener("submit", e => { e.preventDefault(); busy(save, () => edit(id, { title: name.value.trim(), parent: where.value || null })); });
    return h("details", { class: "proj-settings" }, h("summary", { text: "Chat settings" }), form);
  }

  /* ---------------------------------------------------------- scrolling */
  const gap = () => tl.scrollHeight - tl.scrollTop - tl.clientHeight;
  const toBottom = () => { tl.scrollTop = tl.scrollHeight; };
  tl.addEventListener("scroll", () => { stick = gap() < 140; jump.hidden = gap() < 400; });

  /* ---------------------------------------------------------- messages */
  const userEl = m => h("div", { class: "msg user", data: { id: m.id } }, h("div", { class: "col" },
    m.text ? h("div", { class: "bubble", text: m.text }) : null,
    m.files?.length ? h("div", { class: "chips" }, m.files.map(f => h("span", { class: "chip static" }, h("span", { text: f.name }), h("span", { class: "dim", text: "text" })))) : null,
    h("div", { class: "meta", text: stamp(m.at) })));

  const noteEl = m => {
    const ap = m.approval && find(m.approval);
    return h("p", { class: "note", data: { id: m.id } }, h("span", { text: ap ? `${ap.title}. ${ENDED[ap.state] || "Answered"}.` : m.text }));
  };

  const botEl = m => h("div", { class: "msg bot", data: { id: m.id } }, h("span", { class: "gl" }, mark(S.settings.mark)),
    h("div", { class: "col" },
      h("p", { class: "from" }), h("div", { class: "body md" }), h("ul", { class: "trace" }), h("div", { class: "learned" }), h("div", { class: "issue", role: "alert" }), h("div", { class: "cards" }),
      h("div", { class: "foot" }, h("span", { class: "meta" }), h("button", { class: "act-btn", type: "button", "data-copy-msg": "", text: "Copy" }))));

  const label = m => {
    if (m.reminder) return "Reminder";
    if (m.question) return "A question";
    if (m.from === "roxan") return "On its own";
    return m.from ? `From the routine “${find(m.from)?.title || "a routine"}”` : "";
  };
  const wait = () => (S.status.state === "working" && S.status.thread === id && S.status.text) || "Thinking";

  function paintBody(el, m) {
    const body = el.querySelector(".body");
    fill(body, !m.text && m.streaming ? h("span", { class: "label", text: wait() }) : render(m.text));
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
      n.state === "removed" ? null : h("button", { class: "act-btn", type: "button", text: "Undo", onclick: e => busy(e.currentTarget, () => edit(n.id, { state: "removed" })) }))));
  }

  function paint(el, m) {
    const last = list_().at(-1) === m;
    paintBody(el, m);
    const from = label(m), f = el.querySelector(".from");
    f.textContent = from;
    f.hidden = !from;
    fill(el.querySelector(".trace"), (m.steps || []).map(s => h("li", { data: { state: s.approval ? "wait" : s.ok ? "ok" : "no" } }, h("span", { text: s.label }), h("small", { text: s.approval ? "waiting for you" : s.ok ? "done" : s.held ? "not allowed" : "did not work" }))));
    paintLearned(el, m);
    const issue = el.querySelector(".issue");
    const said = m.error ? m.error.message : m.stopped ? "Stopped." : m.cut ? "This reply was cut short." : "";
    fill(issue, said ? [h("span", { text: said }), last && (m.error || m.stopped) ? h("button", { class: "act-btn", type: "button", text: "Try again", onclick: e => busy(e.currentTarget, retry) }) : null] : null);
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
    form.hidden = !S.open;
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
    fill(chips, attachments.map((a, i) => {
      return h("span", { class: "chip" }, h("span", { text: a.name }), h("span", { class: "dim", text: `${bytes(a.size)}${a.truncated ? " (start only)" : ""}` }),
        h("button", { type: "button", "aria-label": `Remove ${a.name}`, text: "×", onclick: () => { attachments.splice(i, 1); drawChips(); } }));
    }));
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
  for (const t of ["dragover", "drop"]) dock.addEventListener(t, e => { if (!e.dataTransfer?.types?.includes("Files")) return; e.preventDefault(); if (t === "drop") addFiles([...e.dataTransfer.files]); });

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
    const open = head.querySelector(".proj-settings[open]");
    if (e.key === "Escape" && open) { open.open = false; open.querySelector("summary").focus(); return; }
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
    watch("threads", () => { heading.textContent = title(); document.title = `${title()} — ${who()}`; }),
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
    io.disconnect();
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(saveTimer);
  };
}
