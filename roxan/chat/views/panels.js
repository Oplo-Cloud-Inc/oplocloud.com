/* Panels: things Roxan writes for you to keep open and come back to, such as a
   document, a checklist or a table. Roxan writes and updates them while it
   works; you can read, change and delete them. A panel is text and data only:
   nothing in one runs. */
import { h, fill, section, ago } from "../dom.js";
import * as api from "../api.js";
import { S, watch, find } from "../state.js";
import { render } from "../md.js";
import { cardish } from "../sensitive.js";
import { soon, busy, sure, tag, empty, copy, make, edit, drop } from "../ui.js";
import { Button, IconButton, Drawer, Field, SegmentedControl, Checkbox, Table, Breadcrumb, Skeleton, SkeletonText } from "../kit/index.js";

const TYPE = { document: "Document", checklist: "Checklist", table: "Table" };
const size = p => (p.type === "document" ? `${p.size.toLocaleString()} characters` : p.type === "checklist" ? `${p.size} item${p.size === 1 ? "" : "s"}` : `${p.size} row${p.size === 1 ? "" : "s"}`);

export const mount = (root, ctx) => (ctx.params[0] ? detail(root, ctx) : index(root, ctx));

// The form for a new panel, in a drawer.
function newPanel(app) {
  const type = SegmentedControl({ label: "Type", value: "document", options: [{ value: "document", label: "Document" }, { value: "checklist", label: "Checklist" }] });
  const title = h("input", { type: "text", maxlength: "100", "aria-label": "Title", placeholder: "Title" });
  const body = h("textarea", { class: "field", rows: "6", "aria-label": "Contents", placeholder: "Write here. For a checklist, one item to a line." });
  const err = h("p", { class: "err", role: "alert" });
  const add = Button({ type: "submit" }, "Save panel");
  let drawer;
  const form = h("form", { class: "pform" }, Field({ label: "Type" }, h("div", null, type)), Field({ label: "Title" }, title), Field({ label: "Contents" }, body), err,
    h("div", { class: "btns" }, add, Button({ variant: "secondary", type: "button", onclick: () => drawer.close() }, "Cancel")));
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (cardish(title.value + body.value)) { err.textContent = "That looks like a card number. Keep those in the vault."; return; }
    busy(add, async () => {
      err.textContent = "";
      const text = body.value.trim();
      try {
        const p = await make("panel", type.value === "document" ? { type: "document", title: title.value.trim(), text } : { type: "checklist", title: title.value.trim(), items: text.split("\n").map(s => s.trim()).filter(Boolean) });
        drawer.close(); app.go("/panels/" + p.id);
      } catch (x) { err.textContent = x.message; }
    });
  });
  drawer = Drawer({ title: "New panel", description: "A document or a checklist to keep.", body: form, focus: () => title });
}

function index(root, { app }) {
  const list = h("div");
  const draw = () => fill(list, S.panels.length ? section(`Yours (${S.panels.length})`, null, S.panels.map(p => h("a", { class: "row", href: "#/panels/" + p.id },
    h("div", { class: "row-main" }, h("span", { class: "row-title", text: p.title }), h("span", { class: "row-sub", text: `${size(p)}. Updated ${ago(p.updated)}.` })), tag(TYPE[p.type] || p.type))))
    : empty("No panels yet.", "Ask Roxan to write something you can keep: “Make me a packing checklist for the trip.”"));
  draw();
  fill(root, h("section", { class: "page" },
    h("h1", { class: "page-title", text: "Panels." }),
    h("p", { class: "page-lead", text: "Documents, checklists and tables Roxan writes for you while it works. Open one to read it, tick it off or change it." }),
    h("div", { class: "page-act" }, Button({ icon: "plus", onclick: () => newPanel(app) }, "New panel")), list));
  return watch("panels", soon(draw));
}

function detail(root, { app, params }) {
  const id = params[0];
  const page = h("section", { class: "page" });
  root.append(page);
  fill(page, h("p", { class: "sr", role: "status", text: "Opening the panel." }), Skeleton({ w: "38%", h: 34 }), SkeletonText(7));
  let panel = null, editing = false, gone = false;

  async function load() {
    try { panel = (await api.get(`/items/${id}`)).item; }
    catch (e) { if (e.status === 404) gone = true; else { fill(page, h("h1", { class: "page-title", text: "That panel could not be opened." }), h("p", { class: "err", text: e.message })); return; } }
    draw();
  }

  function draw() {
    if (gone || !panel) { fill(page, h("h1", { class: "page-title", text: "That panel is gone." }), h("a", { class: "go", href: "#/panels" }, "All panels ", h("i", { "aria-hidden": "true" }))); return; }
    const p = panel;
    const head = [Breadcrumb([{ label: "Panels", href: "#/panels" }, { label: p.title }]), h("h1", { class: "page-title", text: p.title }), h("p", { class: "fine", text: `${TYPE[p.type]}. Updated ${ago(p.updated)}.` })];
    let content;
    if (p.type === "document") {
      if (editing) {
        const box = h("textarea", { class: "field", rows: "16", maxlength: "20000", "aria-label": "Contents" });
        box.value = p.body;
        const save = Button({ size: "sm" }, "Save");
        save.addEventListener("click", () => busy(save, async () => { await edit(id, { title: p.title, text: box.value }); editing = false; await load(); }));
        content = [box, h("div", { class: "btns" }, save, Button({ variant: "secondary", size: "sm", onclick: () => { editing = false; draw(); } }, "Cancel"))];
      } else {
        content = [h("div", { class: "doc md" }, render(p.body || "")), h("div", { class: "btns" }, Button({ variant: "secondary", size: "sm", icon: "edit", onclick: () => { editing = true; draw(); } }, "Edit"), Button({ variant: "secondary", size: "sm", icon: "copy", onclick: e => copy(e.currentTarget, p.body) }, "Copy"))];
      }
    } else if (p.type === "checklist") {
      const set = items => busy(null, async () => { await edit(id, { title: p.title, items }); await load(); });
      const again = h("input", { type: "text", maxlength: "200", "aria-label": "Add an item", placeholder: "Add an item" });
      const form = h("form", { class: "inline" }, again, Button({ size: "sm", type: "submit", icon: "plus" }, "Add"));
      form.addEventListener("submit", e => { e.preventDefault(); if (again.value.trim()) set([...p.items, { text: again.value.trim(), done: false }]); });
      content = [p.items.length ? h("ul", { class: "checks" }, p.items.map((s, i) => h("li", { class: "step", data: { done: String(s.done) } },
        Checkbox({ label: s.text, checked: s.done, onchange: on => set(p.items.map((x, k) => (k === i ? { ...x, done: on } : x))) }),
        IconButton({ size: "sm", "aria-label": `Remove: ${s.text}`, "data-tip": "Remove", onclick: () => set(p.items.filter((_, k) => k !== i)) }, "x")))) : h("p", { class: "none", text: "Nothing on this list yet." }), form];
    } else {
      content = [Table({ label: p.title, size: "sm", empty: "No rows yet.", rows: p.rows, columns: p.columns.map((c, i) => ({ key: i, label: c, sort: true, render: r => r[i] })) }), h("p", { class: "fine", text: "Roxan keeps tables up to date. Ask it in a chat to change one." })];
    }
    fill(page, head, h("div", { class: "panel-body" }, content), h("div", { class: "danger" }, sure("Delete this panel", async b => { await busy(b, async () => { await drop(id); app.go("/panels"); }); }, { what: "The panel is deleted." })));
  }

  load();
  return watch("panels", d => { if (d.id === id && !editing) { if (d.removed) { gone = true; draw(); } else load(); } });
}
