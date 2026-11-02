/* Specialties: procedures Roxan follows the same way each time a request fits.

   A specialty is words and nothing else: a name, when to use it, and the steps
   in order. Roxan is shown the ones that fit what you wrote and follows them in
   its reply; a specialty cannot act on its own. You write them here, or Roxan
   sets one up when it sees you do the same task the same way (learning is on),
   and tells you in the chat. */
import { h, fill, section } from "../dom.js";
import { S, watch } from "../state.js";
import * as memory from "../memory.js";
import { cardish } from "../sensitive.js";
import { soon, busy, sure, empty, make, edit, drop, ago } from "../ui.js";
import { Button, Drawer, Field, Breadcrumb } from "../kit/index.js";

const clean = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const stepsOf = text => String(text).split("\n").map(s => clean(s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, ""), 200)).filter(Boolean);

export async function mount(root) {
  const list = h("div", { class: "specs" });
  const made = h("p", { class: "fine", role: "status" });

  // name, when and steps (one to a line), checked. `submit` gets the clean values; the message says why not.
  function specForm({ s = {}, label, cancel, submit }) {
    const name = h("input", { type: "text", maxlength: 60, value: s.title || "", autocomplete: "off", "aria-label": "Name" });
    const use = h("input", { type: "text", maxlength: 200, value: s.when || "", autocomplete: "off", "aria-label": "Use when" });
    const lines = h("textarea", { class: "field", rows: "6", maxlength: "2400", "aria-label": "Steps, one to a line" });
    lines.value = (s.steps || []).join("\n");
    const err = h("p", { class: "err", role: "alert" });
    const go = Button({ size: "sm", type: "submit" }, label);
    const form = h("form", { class: "pform" },
      Field({ label: "Name" }, name), Field({ label: "Use when", hint: "One sentence: what you would say to ask for it." }, use), Field({ label: "Steps", hint: "One to a line, in order. Write each as an instruction. Leave out passwords and card numbers." }, lines), err,
      h("div", { class: "btns" }, go, cancel ? Button({ variant: "secondary", size: "sm", type: "button", onclick: cancel }, "Cancel") : null));
    form.addEventListener("submit", e => {
      e.preventDefault();
      const v = { name: clean(name.value, 60), when: clean(use.value, 200), steps: stepsOf(lines.value) };
      if (!v.name) { err.textContent = "Name the specialty."; return; }
      if (!v.when) { err.textContent = "Say when to use it."; return; }
      if (v.steps.length < 2) { err.textContent = "Write at least two steps, one to a line."; return; }
      if (cardish([v.name, v.when, ...v.steps].join(" "))) { err.textContent = "That looks like a card number. Keep cards in the vault."; return; }
      if (S.specialties.some(x => x.id !== s.id && memory.similar(x.title, v.name))) { err.textContent = "You already have a specialty with a name like that."; return; }
      busy(go, async () => {
        err.textContent = "";
        try { await submit(v); if (!s.id) form.reset(); } catch (x) { err.textContent = x.message; }
      });
    });
    return form;
  }

  const create = Button({ icon: "plus", onclick: () => {
    let drawer;
    const form = specForm({ label: "Save specialty", cancel: () => drawer.close(), submit: async v => { await make("specialty", v); made.textContent = `Saved “${v.name}”.`; drawer.close(); } });
    drawer = Drawer({ title: "New specialty", description: "A procedure Roxan follows the same way each time.", body: form, focus: () => form.querySelector("input") });
  } }, "New specialty");
  fill(root, h("section", { class: "page" },
    Breadcrumb([{ label: "Settings", href: "#/settings" }, { label: "Specialties" }]),
    h("h1", { class: "page-title", text: "The way you want it done." }),
    h("p", { class: "page-lead", text: "A specialty is a procedure Roxan follows the same way each time a request fits it: how a return is negotiated, how a weekly report is put together. Write one here, or ask Roxan to make one. With learning on, one you ask Roxan to make is saved at once; with it off, Roxan asks you first." }),
    h("p", { class: "fine", text: "A specialty is only instructions in words. It does not act on its own, it is shown to Roxan with your message when it fits, and nothing from the vault is ever part of one." }),
    h("div", { class: "page-act" }, create, made), list));

  function card(s) {
    const editBtn = Button({ variant: "secondary", size: "sm", icon: "edit" }, "Edit");
    const el = h("article", { class: "spec", "aria-label": s.title, data: { id: s.id } },
      h("header", null, h("h2", { class: "spec-name", text: s.title })),
      h("p", { class: "fine", text: `Use when: ${s.when}` }),
      h("ol", { class: "steps" }, s.steps.map(x => h("li", { text: x }))),
      h("div", { class: "btns" }, editBtn, sure("Delete", b => busy(b, () => drop(s.id))), h("span", { class: "fine", text: `Updated ${ago(s.updated)}` })));
    editBtn.addEventListener("click", () => {
      fill(el, specForm({ s, label: "Save changes", cancel: draw, submit: async v => { await edit(s.id, v); } }));
      el.querySelector("input")?.focus();
    });
    return el;
  }

  function draw() {
    fill(list, S.specialties.length ? section(`Yours (${S.specialties.length})`, null, S.specialties.map(card)) : empty("No specialties yet.", "Write one above, or tell Roxan: “Make a specialty for negotiating a return.”"));
  }
  draw();
  return watch("specialties", soon(draw));
}
