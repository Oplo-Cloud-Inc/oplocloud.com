/* One project: its conversations, and the notes Roxan reads in every one of them. */
import { h, on, emit, section, field, ago } from "../dom.js";
import * as db from "../db.js";
import * as store from "../store.js";
import { projectForm } from "./projects.js";

const TITLE = 80;

// Rename or delete a conversation. onSave(room) runs after a rename; onDelete() after it is removed.
export function sessionForm(room, { onSave, onDelete } = {}) {
  const name = h("input", { type: "text", maxlength: TITLE, required: true, value: room.name, autocomplete: "off" });
  const err = h("p", { class: "err", role: "alert" });
  const form = h("form", { class: "pform" }, field("Title", name), h("div", { class: "btns" }, h("button", { class: "btn sm", type: "submit", text: "Save" })), err);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const n = name.value.trim().replace(/\s+/g, " ");
    if (!n) { err.textContent = "Give the conversation a title."; name.focus(); return; }
    Object.assign(room, { name: n, auto: false });
    await db.put("rooms", room);
    emit("rooms");
    err.textContent = "Saved.";
    onSave?.(room);
  });

  const ask = h("button", { class: "btn sm ghost", type: "button", text: "Delete conversation…" });
  const yes = h("button", { class: "btn sm", type: "button", text: "Delete it" });
  const no = h("button", { class: "btn sm ghost", type: "button", text: "Keep it" });
  const sure = h("div", { class: "sure", hidden: true }, h("p", { class: "fine", text: "This deletes the conversation and its attachments from this device. It cannot be undone." }), h("div", { class: "btns" }, yes, no));
  ask.addEventListener("click", () => { ask.hidden = true; sure.hidden = false; no.focus(); });
  no.addEventListener("click", () => { sure.hidden = true; ask.hidden = false; ask.focus(); });
  yes.addEventListener("click", async () => { await store.deleteSession(room); onDelete?.(); });
  form.append(h("div", { class: "danger" }, ask, sure));
  return form;
}

const lead = p => p.instructions || "No notes yet. Open Project settings to tell Roxan what this project is for.";

export async function mount(root, { app, params }) {
  const project = await store.getRoom(params[0]);
  if (!project || project.kind !== "project") {
    root.append(h("section", { class: "page" }, h("p", { class: "label", text: "Not found" }), h("h1", { class: "page-title", text: "That project is not here." }), h("a", { class: "go", href: "#/projects" }, "Projects ", h("i", { text: "→" }))));
    return;
  }
  document.title = `${project.name} — Roxan`;
  const title = h("h1", { class: "page-title", text: project.name });
  const notes = h("p", { class: "page-lead", text: lead(project) });
  const list = h("ul", { class: "rows" });
  const fresh = h("button", { class: "btn", type: "button", text: "New conversation" });
  const settings = h("details", { class: "create" }, h("summary", { class: "btn sm ghost", text: "Project settings" }),
    projectForm(project, { onSave: r => { title.textContent = r.name; notes.textContent = lead(r); document.title = `${r.name} — Roxan`; }, onDelete: () => app.go("/projects") }));
  const total = h("span", { class: "label" });
  root.append(h("section", { class: "page" },
    h("p", { class: "label" }, h("a", { href: "#/projects", text: "Projects" }), " / Project"),
    title, notes,
    h("div", { class: "page-act" }, h("div", { class: "btns act-row" }, fresh), settings),
    section("Conversations", total, list)));

  async function draw() {
    const sessions = await store.sessionsOf(project.id);
    total.textContent = sessions.length ? String(sessions.length) : "";
    list.replaceChildren(...(sessions.length ? sessions.map(s => h("li", { class: "row" },
      h("a", { class: "row-main", href: "#/c/" + s.id }, h("span", { class: "row-title", text: s.name })),
      h("span", { class: "row-when", text: s.updatedAt > s.createdAt ? ago(s.updatedAt) : "Empty" }))) : [h("li", { class: "row none", text: "No conversations yet. Start one." })]));
  }
  fresh.addEventListener("click", async () => { fresh.disabled = true; app.go("/c/" + (await store.newSession(project.id)).id); });
  await draw();
  const off = on("rooms", draw);
  return off;
}
