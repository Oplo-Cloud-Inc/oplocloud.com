/* Memory: the notes Roxan is shown with your messages. You add them, or approve
   them when Roxan suggests one. Nothing is kept without a yes, and anything you
   remove stays removed: Roxan is not shown it and does not suggest it again. */
import { h, on, emit, section, ago } from "../dom.js";
import * as db from "../db.js";
import * as store from "../store.js";
import * as memory from "../memory.js";

const MAX = 300;

export async function mount(root) {
  let notes = [];
  let query = "";
  const add = h("input", { type: "text", maxlength: MAX, autocomplete: "off", "aria-label": "Something for Roxan to remember", placeholder: "Something for Roxan to remember" });
  const err = h("p", { class: "err", role: "alert" });
  const form = h("form", { class: "ask" }, add, h("button", { class: "btn", type: "submit", text: "Remember" }));
  const find = h("input", { type: "text", "aria-label": "Search notes", placeholder: "Search", autocomplete: "off", hidden: true, oninput: e => { query = e.target.value.trim().toLowerCase(); draw(); } });
  const list = h("ul", { class: "rows" });
  const gone = h("ul", { class: "rows" });
  const goneBox = h("details", { class: "removed" }, h("summary", { class: "go" }), gone);
  root.append(h("section", { class: "page" },
    h("p", { class: "label", text: "Memory" }),
    h("h1", { class: "page-title", text: "What Roxan knows about you." }),
    h("p", { class: "page-lead", text: "Short notes, written by you or approved by you. With each message Roxan is shown up to 20 of them, the pinned and the most relevant first. Everything stays on this device." }),
    form, err,
    section("Your notes", find, list),
    goneBox));

  async function change(m, patch, why) {
    await db.put("memories", { ...m, ...patch, updatedAt: Date.now() });
    if (why) await store.log("memory", why(m));
    emit("memories");
  }

  function noteRow(m) {
    const text = h("span", { class: "row-title", text: m.text });
    const row = h("li", { class: "row", data: { id: m.id } }, h("span", { class: "row-main" }, text), h("span", { class: "row-when", text: ago(m.updatedAt) }));
    const edit = h("button", { class: "act-btn", type: "button", text: "Edit" });
    const pin = h("button", { class: "act-btn", type: "button", "aria-pressed": String(Boolean(m.pinned)), text: m.pinned ? "Pinned" : "Pin" });
    const forget = h("button", { class: "act-btn", type: "button", text: "Forget" });
    pin.addEventListener("click", () => change(m, { pinned: !m.pinned }));
    forget.addEventListener("click", () => change(m, { deleted: true, deletedAt: Date.now(), reason: "forgotten" }, x => `Forgot “${x.text}”.`));
    edit.addEventListener("click", () => {
      const box = h("input", { type: "text", maxlength: MAX, value: m.text, "aria-label": "Edit note" });
      const save = h("button", { class: "act-btn", type: "button", text: "Save" });
      const cancel = h("button", { class: "act-btn", type: "button", text: "Cancel", onclick: draw });
      const done = async () => {
        const t = box.value.trim().replace(/\s+/g, " ");
        if (!t) return;
        if (t !== m.text) await change(m, { text: t }, () => `Changed a note to “${t}”.`); else draw();
      };
      save.addEventListener("click", done);
      box.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); done(); } else if (e.key === "Escape") draw(); });
      row.replaceChildren(h("span", { class: "row-main" }, box), h("span", { class: "row-acts" }, save, cancel));
      box.focus();
    });
    row.append(h("span", { class: "row-acts" }, edit, pin, forget));
    return row;
  }

  async function draw() {
    notes = await db.all("memories");
    const live = memory.live(notes).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);
    const shown = query ? live.filter(m => m.text.toLowerCase().includes(query)) : live;
    find.hidden = live.length < 8;
    list.replaceChildren(...(shown.length ? shown.map(noteRow) : [h("li", { class: "row none", text: live.length ? "No note matches that." : "Nothing yet. Add a note above, or tell Roxan something worth remembering and approve it." })]));
    const out = notes.filter(m => m.deleted).sort((a, b) => b.deletedAt - a.deletedAt);
    goneBox.hidden = !out.length;
    goneBox.querySelector("summary").replaceChildren(`Removed (${out.length}) `, h("i", { text: "→" }));
    gone.replaceChildren(...out.map(m => h("li", { class: "row" },
      h("span", { class: "row-main" }, h("span", { class: "row-title", text: m.text }), h("span", { class: "row-sub", text: `${m.reason === "dismissed" ? "Suggested, and you said no" : "Forgotten"} · ${ago(m.deletedAt)}. Roxan is not shown this and will not suggest it again.` })),
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
    else await change({ id: db.uid("m"), createdAt: Date.now(), pinned: false, expiresAt: null }, { text }, () => `Added “${text}”.`);
    add.focus();
  });

  await draw();
  const off = on("memories", draw);
  return off;
}
