/* Projects and chats. Main is the one conversation that keeps going. Side chats
   are for one subject each, and can be filed in a project. A project keeps
   notes that Roxan reads in every chat inside it, so you do not have to say it
   again. Deleting a project keeps its chats. */
import { h, fill, section } from "../dom.js";
import * as api from "../api.js";
import { S, MAIN, watch, find, chats } from "../state.js";
import { cardish } from "../sensitive.js";
import { soon, busy, sure, tag, empty, make, edit, drop, ago } from "../ui.js";
import { Button, Drawer, Field, Tabs, Accordion, Breadcrumb } from "../kit/index.js";

const chatRow = t => h("a", { class: "row", href: "#/c/" + t.id },
  h("div", { class: "row-main" }, h("span", { class: "row-title", text: t.title || "New chat" }), h("span", { class: "row-sub", text: t.last ? t.last.text : "Nothing said yet" })),
  t.last ? h("span", { class: "row-when", text: ago(t.last.at) }) : null);

async function fresh(app, parent) {
  try { const t = await make("thread", parent ? { parent } : {}); app.go("/c/" + t.id); } catch (e) { return e; }
}

export const mount = (root, ctx) => (ctx.params[0] ? detail(root, ctx) : index(root, ctx));

// The form for a new project, in a drawer.
function newProject(app) {
  const title = h("input", { type: "text", maxlength: "80", "aria-label": "Project name", placeholder: "Project name" });
  const notes = h("textarea", { class: "field", rows: "4", maxlength: "4000", "aria-label": "Notes Roxan reads in every chat of this project", placeholder: "What Roxan should know in every chat of this project (optional)" });
  const err = h("p", { class: "err", role: "alert" });
  const add = Button({ type: "submit" }, "Save project");
  let drawer;
  const form = h("form", { class: "pform" }, Field({ label: "Name" }, title), Field({ label: "Notes", hint: "Read with every message in this project's chats. Leave out passwords and card numbers." }, notes), err,
    h("div", { class: "btns" }, add, Button({ variant: "secondary", type: "button", onclick: () => drawer.close() }, "Cancel")));
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (cardish(title.value + notes.value)) { err.textContent = "That looks like a card number. Keep those in the vault."; return; }
    busy(add, async () => {
      err.textContent = "";
      try { const p = await make("project", { title: title.value.trim(), notes: notes.value.trim() }); drawer.close(); app.go("/p/" + p.id); }
      catch (x) { err.textContent = x.message; }
    });
  });
  drawer = Drawer({ title: "New project", description: "Chats that share notes.", body: form, focus: () => title });
}

function index(root, { app }) {
  const newChat = Button({ icon: "plus", onclick: e => busy(e.currentTarget, async () => { const bad = await fresh(app); if (bad) throw bad; }) }, "New chat");
  const mainRow = h("div", { class: "k-main" });
  const chatsBox = h("div"), projectsBox = h("div"), shutBox = h("div");
  const tabs = Tabs({ label: "Chats and projects", tabs: [
    { id: "chats", label: "Chats", count: 0, panel: chatsBox }, { id: "projects", label: "Projects", count: 0, panel: projectsBox }, { id: "shut", label: "Archived", count: 0, panel: shutBox }] });
  function draw() {
    const open = S.projects.filter(p => p.state === "open"), loose = chats().filter(t => !t.parent || !find(t.parent)), shut = S.threads.filter(t => t.state === "archived");
    const main = S.threads.find(t => t.id === MAIN);
    fill(mainRow, section("Main", null, h("a", { class: "row", href: "#/chat" }, h("div", { class: "row-main" }, h("span", { class: "row-title", text: "Main conversation" }), h("span", { class: "row-sub", text: main?.last ? main.last.text : "Nothing said yet" })), main?.last ? h("span", { class: "row-when", text: ago(main.last.at) }) : null)));
    fill(chatsBox, loose.length ? loose.map(chatRow) : empty("No side chats.", "Start one for a subject of its own."));
    fill(projectsBox, open.length ? open.map(p => {
      const n = S.threads.filter(t => t.parent === p.id && t.state !== "archived").length;
      return h("a", { class: "row", href: "#/p/" + p.id }, h("div", { class: "row-main" }, h("span", { class: "row-title", text: p.title }), h("span", { class: "row-sub", text: `${n} chat${n === 1 ? "" : "s"}${p.body ? ". Has notes." : ""}` })), tag("Project"));
    }) : empty("No projects yet.", "A project keeps notes Roxan reads in all of its chats."));
    fill(shutBox, shut.length ? shut.map(t => h("div", { class: "row" }, h("a", { class: "row-main", href: "#/c/" + t.id }, h("span", { class: "row-title", text: t.title || "New chat" })), Button({ variant: "secondary", size: "sm", onclick: e => busy(e.currentTarget, () => edit(t.id, { state: "open" })) }, "Restore"))) : empty("Nothing archived."));
    tabs.setCount("chats", loose.length); tabs.setCount("projects", open.length); tabs.setCount("shut", shut.length);
  }
  draw();
  fill(root, h("section", { class: "page" },
    h("h1", { class: "page-title", text: "Chats and projects." }),
    h("p", { class: "page-lead", text: "Main is the one conversation that keeps going. Open a side chat when a subject deserves its own, and file chats in a project when they share notes." }),
    h("div", { class: "page-act" }, newChat, Button({ variant: "secondary", icon: "folderplus", onclick: () => newProject(app) }, "New project")), mainRow, tabs));
  return watch(["threads", "projects"], soon(draw));
}

function detail(root, { app, params }) {
  const id = params[0];
  const page = h("section", { class: "page" });
  root.append(page);
  const title = h("input", { type: "text", maxlength: "80", "aria-label": "Name" });
  const notes = h("textarea", { class: "field", rows: "6", maxlength: "4000", "aria-label": "Notes" });
  const err = h("p", { class: "err", role: "alert" });
  const save = Button({ size: "sm", type: "submit" }, "Save");
  const form = h("form", { class: "pform" }, Field({ label: "Name" }, title), Field({ label: "Notes", hint: "Roxan reads these with every message in this project's chats." }, notes), err, h("div", { class: "btns" }, save));
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (cardish(title.value + notes.value)) { err.textContent = "That looks like a card number. Keep those in the vault."; return; }
    busy(save, async () => { err.textContent = ""; try { await edit(id, { title: title.value.trim(), notes: notes.value.trim() }); } catch (x) { err.textContent = x.message; } });
  });
  const top = h("div"), mine = h("div");
  let filled = false;

  function draw() {
    const p = find(id);
    if (!p) { fill(page, h("h1", { class: "page-title", text: "That project is gone." }), h("a", { class: "go", href: "#/projects" }, "Chats and projects ", h("i", { "aria-hidden": "true" }))); return; }
    if (!filled) { title.value = p.title; notes.value = p.body || ""; filled = true; }
    const inside = S.threads.filter(t => t.parent === id && t.state !== "archived");
    fill(top, Breadcrumb([{ label: "Chats and projects", href: "#/projects" }, { label: p.title }]), h("h1", { class: "page-title", text: p.title }),
      p.body ? h("p", { class: "page-lead", text: p.body }) : h("p", { class: "fine", text: "No notes yet. Add what Roxan should know in every chat here." }));
    fill(mine, section(`Chats (${inside.length})`, Button({ size: "sm", icon: "plus", onclick: e => busy(e.currentTarget, async () => { const bad = await fresh(app, id); if (bad) throw bad; }) }, "New chat here"),
      inside.length ? inside.map(chatRow) : h("p", { class: "none", text: "No chats in this project yet." })));
  }
  fill(page, top, mine, Accordion({ class: "k-edit", items: [{ id: "edit", title: "Edit the project", body: form }] }),
    h("div", { class: "danger" }, h("p", { class: "fine", text: "Deleting a project keeps its chats; they move out of it." }),
      sure("Delete this project", async b => { await busy(b, async () => { await drop(id); app.go("/projects"); }); }, { what: "The project is deleted. Its chats are kept and move out of it." })));
  draw();
  return watch(["projects", "threads"], soon(draw));
}
