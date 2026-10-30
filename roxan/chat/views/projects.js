/* Projects: a separate thread with its own notes to Roxan, so one piece of work
   does not leak into another. Each is a room, like the main conversation. */
import { h, section, field, ago } from "../dom.js";
import * as db from "../db.js";
import * as store from "../store.js";

const NAME = 80, NOTES = 4000;

// Create (room = null) or edit a project. onSave(room) runs after it is kept; onDelete() after it is removed.
export function projectForm(room, { onSave, onDelete } = {}) {
  const name = h("input", { type: "text", maxlength: NAME, required: true, value: room?.name ?? "", autocomplete: "off" });
  const notes = h("textarea", { class: "field", rows: "5", maxlength: NOTES }, room?.instructions ?? "");
  const err = h("p", { class: "err", role: "alert" });
  const form = h("form", { class: "pform" },
    field("Name", name),
    field("What Roxan should know here", notes, "Sent with every message in this project: the goal, how you like things done, anything to keep in mind."),
    h("div", { class: "btns" }, h("button", { class: "btn sm", type: "submit", text: room ? "Save" : "Create project" })), err);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const n = name.value.trim().replace(/\s+/g, " ");
    if (!n) { err.textContent = "Give the project a name."; name.focus(); return; }
    err.textContent = "";
    const r = room ? Object.assign(room, { name: n, instructions: notes.value.trim() })
      : { id: db.uid("p"), kind: "project", name: n, instructions: notes.value.trim(), createdAt: Date.now(), updatedAt: Date.now() };
    await db.put("rooms", r);
    await store.log("project", `${room ? "Updated" : "Created"} the project “${n}”.`, r.id);
    if (!room) form.reset();
    else err.textContent = "Saved.";
    onSave?.(r);
  });

  if (room) {
    const ask = h("button", { class: "btn sm ghost", type: "button", text: "Delete project…" });
    const yes = h("button", { class: "btn sm", type: "button", text: "Delete it" });
    const no = h("button", { class: "btn sm ghost", type: "button", text: "Keep it" });
    const sure = h("div", { class: "sure", hidden: true }, h("p", { class: "fine", text: "This deletes the project, its conversation and its attachments from this device. It cannot be undone." }), h("div", { class: "btns" }, yes, no));
    ask.addEventListener("click", () => { ask.hidden = true; sure.hidden = false; no.focus(); });
    no.addEventListener("click", () => { sure.hidden = true; ask.hidden = false; ask.focus(); });
    yes.addEventListener("click", async () => {
      await db.deleteRoom(room.id);
      await store.log("project", `Deleted the project “${room.name}”.`);
      onDelete?.();
    });
    form.append(h("div", { class: "danger" }, ask, sure));
  }
  return form;
}

export async function mount(root, { app }) {
  const list = h("ul", { class: "rows" });
  const make = h("details", { class: "create" }, h("summary", { class: "btn sm", text: "New project" }), projectForm(null, { onSave: r => app.go("/p/" + r.id) }));
  root.append(h("section", { class: "page" },
    h("p", { class: "label", text: "Projects" }),
    h("h1", { class: "page-title", text: "A room for each thing you work on." }),
    h("p", { class: "page-lead", text: "A project is its own conversation with its own notes to Roxan. What you say in one stays out of the others. Notes you ask Roxan to keep are shared by all of them." }),
    h("div", { class: "page-act" }, make),
    section("Your projects", null, list)));

  const rooms = (await db.all("rooms")).filter(r => r.kind === "project").sort((a, b) => b.updatedAt - a.updatedAt);
  list.append(...(rooms.length ? rooms.map(r => h("li", { class: "row" },
    h("a", { class: "row-main", href: "#/p/" + r.id }, h("span", { class: "row-title", text: r.name }), r.instructions ? h("span", { class: "row-sub", text: r.instructions }) : null),
    h("span", { class: "row-when", text: ago(r.updatedAt) }))) : [h("li", { class: "row none", text: "No projects yet. Create one to give a piece of work its own thread." })]));
  if (!rooms.length) make.open = true;
}
