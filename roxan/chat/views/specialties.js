/* Specialties: procedures Roxan follows the same way each time a request fits.

   A specialty is words and nothing else: a name, when to use it, and the steps in
   order. Roxan is shown the ones that fit what you wrote and follows them in its
   reply; it cannot act on its own and is never shown anything from the Vault.
   You write them here, or Roxan sets one up when it sees you do the same task the
   same way (learning is on), shown in the chat with an Undo. */
import { h, on, emit, section, field, ago } from "../dom.js";
import * as db from "../db.js";
import * as store from "../store.js";
import * as memory from "../memory.js";
import { stepsOf } from "../proposals.js";
import { cardish } from "../sensitive.js";

const clean = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

export async function mount(root) {
  let all = [];
  const list = h("div", { class: "specs" });
  const made = h("p", { class: "fine", role: "status" });

  // name, when and steps (one to a line), checked. `submit` gets the clean values; the message says why not.
  function specForm({ s = {}, label, cancel, submit }) {
    const name = h("input", { type: "text", maxlength: 60, value: s.name || "", autocomplete: "off", "aria-label": "Name" });
    const use = h("input", { type: "text", maxlength: 200, value: s.when || "", autocomplete: "off", "aria-label": "Use when" });
    const lines = h("textarea", { class: "field", rows: "6", maxlength: "2400", "aria-label": "Steps, one to a line" });
    lines.value = (s.steps || []).join("\n");
    const err = h("p", { class: "err", role: "alert" });
    const form = h("form", { class: "pform" },
      field("Name", name), field("Use when", use, "One sentence: what you would say to ask for it."), field("Steps", lines, "One to a line, in order. Write each as an instruction. Leave out passwords and card numbers."), err,
      h("div", { class: "btns" }, h("button", { class: "btn sm", type: "submit", text: label }), cancel ? h("button", { class: "btn sm ghost", type: "button", text: "Cancel", onclick: cancel }) : null));
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const v = { name: clean(name.value, 60), when: clean(use.value, 200), steps: stepsOf(lines.value) };
      if (!v.name) { err.textContent = "Name the specialty."; return; }
      if (!v.when) { err.textContent = "Say when to use it."; return; }
      if (v.steps.length < 2) { err.textContent = "Write at least two steps, one to a line."; return; }
      if (cardish([v.name, v.when, ...v.steps].join(" "))) { err.textContent = "That looks like a card number. Keep cards in the Vault."; return; }
      if (all.some(x => !x.deleted && x.id !== s.id && memory.similar(x.name, v.name))) { err.textContent = "You already have a specialty with a name like that."; return; }
      err.textContent = "";
      await submit(v);
      if (!s.id) form.reset();                                    // a new one starts blank next time; an edited one is redrawn
    });
    return form;
  }

  const create = h("details", { class: "create" }, h("summary", { class: "btn sm", text: "New specialty" }),
    specForm({ label: "Save specialty", submit: async v => {
      const now = Date.now();
      await db.put("specialties", { id: db.uid("sp"), ...v, on: true, createdAt: now, updatedAt: now });
      await store.log("specialty", `Saved the specialty “${v.name}”.`);
      emit("specialties");
      made.textContent = `Saved “${v.name}”.`;
      create.open = false;
    } }));
  root.append(h("section", { class: "page" },
    h("h1", { class: "page-title", text: "The way you want it done." }),
    h("p", { class: "page-lead", text: "A specialty is a procedure Roxan follows the same way each time a request fits it: how a return is negotiated, how a weekly report is put together. Write one here, or ask Roxan to make one. If learning is on, Roxan also sets one up when it sees you do the same task the same way, and shows you with an Undo." }),
    h("p", { class: "fine", text: "A specialty is only instructions in words. It does not act on its own, it is shown to Roxan with your message when it fits, and nothing from the Vault is ever part of one. One you delete is not suggested again." }),
    h("div", { class: "page-act" }, create, made), list));

  const change = (s, patch, text) => db.put("specialties", { ...s, ...patch, updatedAt: Date.now() }).then(async () => { if (text) await store.log("specialty", text); emit("specialties"); });

  function card(s) {
    let armed = 0;
    const toggle = h("button", { class: "act-btn", type: "button", "aria-pressed": String(s.on !== false), text: s.on !== false ? "On" : "Off", title: "A specialty that is off is not shown to Roxan", onclick: () => change(s, { on: s.on === false }, `Turned the specialty “${s.name}” ${s.on === false ? "on" : "off"}.`) });
    const del = h("button", { class: "act-btn", type: "button", text: "Delete" });
    del.addEventListener("click", () => {
      if (!armed) { del.textContent = "Confirm delete"; armed = setTimeout(() => { armed = 0; del.textContent = "Delete"; }, 4000); return; }
      clearTimeout(armed);
      change(s, { deleted: true, deletedAt: Date.now(), reason: "deleted" }, `Deleted the specialty “${s.name}”.`);
    });
    const edit = h("button", { class: "act-btn", type: "button", text: "Edit" });
    const el = h("article", { class: "spec", "aria-label": s.name, data: { id: s.id, on: String(s.on !== false) } },
      h("header", null, h("h2", { class: "spec-name", text: s.name }), s.auto ? h("span", { class: "tag", title: "Roxan set this up because learning is on", text: "Learned" }) : null, toggle),
      h("p", { class: "fine", text: `Use when: ${s.when}` }),
      h("ol", { class: "steps" }, s.steps.map(x => h("li", { text: x }))),
      h("div", { class: "btns" }, edit, del, h("span", { class: "fine", text: `Updated ${ago(s.updatedAt)}` })));
    edit.addEventListener("click", () => {
      el.replaceChildren(specForm({ s, label: "Save changes", cancel: draw, submit: async v => { await change(s, v, `Changed the specialty “${v.name}”.`); } }));
      el.querySelector("input")?.focus();
    });
    return el;
  }

  async function draw() {
    all = await db.all("specialties");
    const mine = all.filter(s => !s.deleted).sort((a, b) => b.updatedAt - a.updatedAt);
    list.replaceChildren(...(mine.length ? [section(`Yours (${mine.length})`, null, ...mine.map(card))] : [h("p", { class: "none", text: "No specialties yet. Write one above, or tell Roxan: “Make a specialty for negotiating a return.”" })]));
  }
  await draw();
  return on("specialties", draw);
}
