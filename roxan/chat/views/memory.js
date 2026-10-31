/* Memory: the short notes Roxan is shown with your messages, and how they
   connect. Roxan adds a note when you tell it something lasting (turn that off in
   Settings) and always shows you what it kept, with an Undo. You can add, edit,
   pin and forget notes yourself. Anything you remove stays removed: Roxan is
   not shown it and does not suggest it again.

   Two views of the same notes. The web shows who and what they are about and
   which names share a note; the list is the plain version of it. */
import { h, on, emit, section, ago } from "../dom.js";
import * as db from "../db.js";
import * as store from "../store.js";
import * as memory from "../memory.js";
import { draw as drawWeb } from "../webgraph.js";

const MAX = 300;
const newest = (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt;

export async function mount(root) {
  let notes = [];
  let query = "";
  let tab = (await store.getMeta("memory:tab")) === "list" ? "list" : "web";
  let selected = null;
  const add = h("input", { type: "text", maxlength: MAX, autocomplete: "off", "aria-label": "Something for Roxan to remember", placeholder: "Something for Roxan to remember" });
  const err = h("p", { class: "err", role: "alert" });
  const form = h("form", { class: "ask" }, add, h("button", { class: "btn", type: "submit", text: "Remember" }));
  const find = h("input", { type: "text", "aria-label": "Search notes", placeholder: "Search", autocomplete: "off", hidden: true, oninput: e => { query = e.target.value.trim().toLowerCase(); draw(); } });
  const pick = name => h("button", { class: "act-btn", type: "button", "aria-pressed": "false", text: name === "web" ? "Web" : "List", onclick: () => { tab = name; store.setMeta("memory:tab", name); draw(); } });
  const tabs = { web: pick("web"), list: pick("list") };
  const body = h("div");
  const gone = h("ul", { class: "rows" });
  const goneBox = h("details", { class: "removed" }, h("summary", { class: "go" }), gone);
  root.append(h("section", { class: "page" },
    h("h1", { class: "page-title", text: "What Roxan knows about you." }),
    h("p", { class: "page-lead", text: "Short notes about you and the people, places and projects in your life. Roxan adds one when you tell it something lasting, and shows you each, with an Undo. With every message it is shown up to 20: pinned first, then notes about the names you mention and what those are linked to. Your notes are kept on this device, and only the ones it is shown leave it." }),
    form, err,
    section("Your notes", h("div", { class: "tabs", role: "group", "aria-label": "View" }, tabs.web, tabs.list), find, body),
    goneBox));

  async function change(m, patch, why) {
    await db.put("memories", { ...m, ...patch, updatedAt: Date.now() });
    if (why) await store.log("memory", why(m));
    emit("memories");
  }

  function noteRow(m) {
    const names = m.about?.length ? h("span", { class: "row-sub about", text: "About " + m.about.join(", ") }) : null;
    const text = h("span", { class: "row-main" }, h("span", { class: "row-title", text: m.text }), names);
    const row = h("li", { class: "row", data: { id: m.id } }, text, m.auto ? h("span", { class: "tag", title: "Roxan kept this because learning is on", text: "Learned" }) : null, h("span", { class: "row-when", text: ago(m.updatedAt) }));
    const edit = h("button", { class: "act-btn", type: "button", text: "Edit" });
    const pin = h("button", { class: "act-btn", type: "button", "aria-pressed": String(Boolean(m.pinned)), text: m.pinned ? "Pinned" : "Pin" });
    const forget = h("button", { class: "act-btn", type: "button", text: "Forget" });
    pin.addEventListener("click", () => change(m, { pinned: !m.pinned }));
    forget.addEventListener("click", () => change(m, { deleted: true, deletedAt: Date.now(), reason: "forgotten" }, x => `Forgot “${x.text}”.`));
    edit.addEventListener("click", () => {
      const box = h("input", { type: "text", maxlength: MAX, value: m.text, "aria-label": "Edit note" });
      const who = h("input", { type: "text", maxlength: 200, value: (m.about || []).join(", "), placeholder: "About: names, separated by commas", "aria-label": "Who or what the note is about, separated by commas" });
      const save = h("button", { class: "act-btn", type: "button", text: "Save" });
      const cancel = h("button", { class: "act-btn", type: "button", text: "Cancel", onclick: draw });
      const done = async () => {
        const t = box.value.trim().replace(/\s+/g, " ");
        if (!t) return;
        const about = memory.aboutNames(who.value.split(","), notes);
        if (t !== m.text || about.join("|") !== (m.about || []).join("|")) await change(m, { text: t, about }, () => `Changed a note to “${t}”.`); else draw();
      };
      save.addEventListener("click", done);
      for (const i of [box, who]) i.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); done(); } else if (e.key === "Escape") draw(); });
      row.replaceChildren(h("span", { class: "row-main edit" }, box, who), h("span", { class: "row-acts" }, save, cancel));
      box.focus();
    });
    row.append(h("span", { class: "row-acts" }, edit, pin, forget));
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
    const w = memory.web(notes);
    if (selected && !w.nodes.some(n => n.key === selected)) selected = null;
    const out = [];
    if (w.nodes.length) {
      out.push(h("figure", { class: "web" }, drawWeb(w, { selected, onSelect: key => { selected = selected === key ? null : key; draw().then(() => body.querySelector(`.web-node[data-key="${CSS.escape(key)}"]`)?.focus()); } }),
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
    if (w.loose.length) out.push(h("details", { class: "loose", open: !w.nodes.length }, h("summary", { class: "go", text: `Not linked to anyone yet (${w.loose.length})` }), rows([...w.loose].sort(newest))));
    return h("div", null, out);
  }

  async function draw() {
    notes = await db.all("memories");
    const live = memory.live(notes).sort(newest);
    for (const [name, b] of Object.entries(tabs)) b.setAttribute("aria-pressed", String(name === tab));
    body.replaceChildren(tab === "web" ? webPane(live) : listPane(live));
    const out = notes.filter(m => m.deleted).sort((a, b) => b.deletedAt - a.deletedAt);
    goneBox.hidden = !out.length;
    goneBox.querySelector("summary").textContent = `Removed (${out.length})`;
    const why = { dismissed: "Suggested, and you said no", undone: "Learned, then you undid it", forgotten: "Forgotten" };
    gone.replaceChildren(...out.map(m => h("li", { class: "row" },
      h("span", { class: "row-main" }, h("span", { class: "row-title", text: m.text }), h("span", { class: "row-sub", text: `${why[m.reason] || "Forgotten"}, ${ago(m.deletedAt)}. Roxan is not shown this and will not suggest it again.` })),
      h("span", { class: "row-acts" }, h("button", { class: "act-btn", type: "button", text: "Restore", onclick: () => change(m, { deleted: false, deletedAt: null, reason: null }, x => `Restored “${x.text}”.`) })))));
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const text = add.value.trim().replace(/\s+/g, " ");
    if (!text) return;
    const known = memory.status(text, notes);
    if (known === "known") { err.textContent = "Roxan already has that."; return; }
    const m = known === "refused" && notes.find(x => x.deleted && memory.similar(x.text, text));
    err.textContent = "";
    add.value = "";                                              // before the writes, so a quick second note starts clean
    if (m) await change(m, { text, deleted: false, deletedAt: null, reason: null }, () => `Added “${text}”.`);
    else await change({ id: db.uid("m"), createdAt: Date.now(), pinned: false, expiresAt: null, about: [] }, { text }, () => `Added “${text}”.`);
    add.focus();
  });

  await draw();
  const off = on("memories", draw);
  return off;
}
