/* Memory: the short notes Roxan is shown with your messages, and how they
   connect. Roxan adds a note when you tell it something lasting (turn that off
   in Settings) and always shows you what it kept, with an Undo. You can add,
   edit, pin and forget notes yourself. Anything you remove stays removed: Roxan
   is not shown it and does not suggest it again.

   Two views of the same notes. The web shows who and what they are about and
   which names share a note; the list is the plain version of it. */
import { h, fill, section } from "../dom.js";
import * as local from "../local.js";
import * as memory from "../memory.js";
import { draw as drawWeb } from "../webgraph.js";
import { S, watch } from "../state.js";
import { soon, busy, make, edit, ago } from "../ui.js";
import { Button, Input, SearchField, SegmentedControl, Accordion, Breadcrumb } from "../kit/index.js";

const MAX = 300;
const newest = (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt;
// The notes as memory.js knows them, from what Roxan keeps.
const notes = () => S.memories.map(m => ({ id: m.id, text: m.body, about: m.about || [], pinned: Boolean(m.pinned), deleted: m.state === "removed", updatedAt: m.updated, createdAt: m.created, deletedAt: m.updated }));

export async function mount(root) {
  let query = "", selected = null;
  let tab = (await local.getMeta("memory:tab")) === "list" ? "list" : "web";
  const go = Button({ type: "submit", size: "sm", icon: "plus" }, "Remember");
  const box = Input({ type: "text", maxlength: MAX, "aria-label": "Something for Roxan to remember", placeholder: "Something for Roxan to remember", trailing: go });
  const add = box.input;
  const err = h("p", { class: "err", role: "alert" });
  const form = h("form", { class: "ask" }, box);
  const find = SearchField({ placeholder: "Search", "aria-label": "Search notes", oninput: e => { query = e.target.value.trim().toLowerCase(); draw(); } });
  find.hidden = true;
  const view = SegmentedControl({ label: "View", value: tab, options: [{ value: "web", label: "Web" }, { value: "list", label: "List" }], onchange: v => { tab = v; local.setMeta("memory:tab", v); draw(); } });
  const body = h("div");
  const gone = h("ul", { class: "rows" });
  const goneBox = Accordion({ class: "k-removed", items: [{ id: "gone", title: "Removed", body: gone }] });
  fill(root, h("section", { class: "page" },
    Breadcrumb([{ label: "Settings", href: "#/settings" }, { label: "Memory" }]),
    h("h1", { class: "page-title", text: "What Roxan knows about you." }),
    h("p", { class: "page-lead", text: "Short notes about you and the people, places and projects in your life. Roxan adds one when you tell it something lasting, and shows you each, with an Undo. With every message it is shown up to 40: pinned first, then notes about the names you mention and what those are linked to." }),
    h("p", { class: "fine", text: "Notes are kept in your account on Roxan's servers. The ones it is shown go to its model with your message; the rest stay put." }),
    form, err,
    section("Your notes", view, find, body),
    goneBox));

  function noteRow(m) {
    const names = m.about?.length ? h("span", { class: "row-sub about", text: "About " + m.about.join(", ") }) : null;
    const row = h("li", { class: "row", data: { id: m.id } }, h("span", { class: "row-main" }, h("span", { class: "row-title", text: m.text }), names), h("span", { class: "row-when", text: ago(m.updatedAt) }));
    const editBtn = Button({ variant: "ghost", size: "sm" }, "Edit");
    const pin = Button({ variant: m.pinned ? "secondary" : "ghost", size: "sm", "aria-pressed": String(m.pinned), onclick: e => busy(e.currentTarget, () => edit(m.id, { pinned: !m.pinned })) }, m.pinned ? "Pinned" : "Pin");
    const forget = Button({ variant: "ghost", size: "sm", onclick: e => busy(e.currentTarget, () => edit(m.id, { state: "removed" })) }, "Forget");
    editBtn.addEventListener("click", () => {
      const box = h("input", { type: "text", maxlength: MAX, value: m.text, "aria-label": "Edit note" });
      const who = h("input", { type: "text", maxlength: 200, value: m.about.join(", "), placeholder: "About: names, separated by commas", "aria-label": "Who or what the note is about, separated by commas" });
      const save = Button({ variant: "secondary", size: "sm" }, "Save");
      const done = () => {
        const t = box.value.trim().replace(/\s+/g, " ");
        if (!t) return;
        const about = memory.aboutNames(who.value.split(","), notes());
        if (t === m.text && about.join("|") === m.about.join("|")) return draw();
        busy(save, () => edit(m.id, { text: t, about }));
      };
      save.addEventListener("click", done);
      for (const i of [box, who]) i.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); done(); } else if (e.key === "Escape") draw(); });
      fill(row, h("span", { class: "row-main edit" }, box, who), h("span", { class: "row-acts" }, save, Button({ variant: "ghost", size: "sm", onclick: draw }, "Cancel")));
      box.focus();
    });
    row.append(h("span", { class: "row-acts" }, editBtn, pin, forget));
    return row;
  }

  const none = text => h("p", { class: "none", text });
  const rows = list => h("ul", { class: "rows" }, list.map(noteRow));

  function listPane(live) {
    const shown = query ? live.filter(m => m.text.toLowerCase().includes(query)) : live;
    find.hidden = live.length < 8;
    return shown.length ? rows(shown) : none(live.length ? "No note matches that." : "Nothing yet. Add a note above, or tell Roxan something worth remembering.");
  }

  function webPane(live) {
    find.hidden = true;
    if (!live.length) return none("Nothing yet. Add a note above, or tell Roxan something worth remembering.");
    const w = memory.web(notes());
    if (selected && !w.nodes.some(n => n.key === selected)) selected = null;
    const out = [];
    if (w.nodes.length) {
      out.push(h("figure", { class: "web" }, drawWeb(w, { selected, onSelect: key => { selected = selected === key ? null : key; draw(); body.querySelector(`.web-node[data-key="${CSS.escape(key)}"]`)?.focus(); } }),
        h("figcaption", { class: "fine", text: "Each ring is a person, place, organization or project your notes are about; a bigger ring has more notes. A line joins two that share a note. Select one to read its notes." })));
    } else {
      out.push(none("No names yet. A note Roxan keeps from now on is linked to who and what it is about. You can add names to an older note with Edit."));
    }
    const node = w.nodes.find(n => n.key === selected);
    if (node) {
      out.push(h("div", { class: "web-panel" },
        h("h3", { class: "web-name", text: node.name }),
        node.links.size ? h("p", { class: "fine" }, "Linked to ", [...node.links].map(k => w.nodes.find(n => n.key === k)).flatMap((n, i) => [i ? ", " : "", h("button", { class: "link", type: "button", text: n.name, onclick: () => { selected = n.key; draw(); } })])) : null,
        rows([...node.notes].sort(newest))));
    } else if (w.nodes.length) {
      out.push(h("p", { class: "fine", text: "Select a name to see its notes." }));
    }
    if (w.loose.length) out.push(Accordion({ class: "k-loose", items: [{ id: "loose", title: `Not linked to anyone yet (${w.loose.length})`, open: !w.nodes.length, body: rows([...w.loose].sort(newest)) }] }));
    return h("div", null, out);
  }

  function draw() {
    const all = notes(), live = memory.live(all).sort(newest);
    if (view.value !== tab) view.value = tab;
    fill(body, tab === "web" ? webPane(live) : listPane(live));
    const out = all.filter(m => m.deleted).sort((a, b) => b.deletedAt - a.deletedAt);
    goneBox.hidden = !out.length;
    goneBox.querySelector(".k-ac-t").textContent = `Removed (${out.length})`;
    fill(gone, out.map(m => h("li", { class: "row" },
      h("span", { class: "row-main" }, h("span", { class: "row-title", text: m.text }), h("span", { class: "row-sub", text: `Forgotten ${ago(m.deletedAt)}. Roxan is not shown this and will not suggest it again.` })),
      h("span", { class: "row-acts" }, Button({ variant: "secondary", size: "sm", onclick: e => busy(e.currentTarget, () => edit(m.id, { state: "active" })) }, "Restore")))));
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const text = add.value.trim().replace(/\s+/g, " ");
    if (!text) return;
    const known = memory.status(text, notes());
    if (known === "known") { err.textContent = "Roxan already has that."; return; }
    const back = known === "refused" && notes().find(x => x.deleted && memory.similar(x.text, text));
    busy(go, async () => {
      err.textContent = "";
      try { await (back ? edit(back.id, { text, state: "active" }) : make("memory", { text })); add.value = ""; add.focus(); }
      catch (x) { err.textContent = x.message; }
    });
  });

  draw();
  return watch("memories", soon(draw));
}
