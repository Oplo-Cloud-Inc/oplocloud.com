/* Handoff: tasks that need a web browser (buying, booking, filling in a form).

   Roxan's cloud browser only reads and no computer is connected yet, so a Handoff is a
   written task that waits here. Nothing on this page has been done by anyone but
   you: "done" means you did it yourself and said so. The page says this plainly
   and never shows progress it does not have. Roxan can queue one when you ask
   (it asks you first, unless you changed that in Access). */
import { h, fill, section } from "../dom.js";
import { S, watch } from "../state.js";
import { cardish } from "../sensitive.js";
import { soon, busy, sure, soonTag, make, edit, drop, ago } from "../ui.js";
import { Button, Drawer, Field, Accordion, Breadcrumb } from "../kit/index.js";

const clean = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

// A link only for something that is plainly a web address; anything else stays as text.
function siteHref(site) {
  const t = String(site || "").trim();
  if (!t || /\s/.test(t)) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : "https://" + t);
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname) ? u.href : null;
  } catch { return null; }
}
const siteEl = site => { const href = siteHref(site); return href ? h("a", { class: "go sm", href, target: "_blank", rel: "noopener noreferrer" }, site, " ", h("i", { text: "↗" })) : site; };

export async function mount(root) {
  const body = h("div");
  const made = h("p", { class: "fine", role: "status" });

  // The fields of a Handoff, as a form that checks what it is given and says why not.
  function handoffForm({ x = {}, label, cancel, submit }) {
    const title = h("input", { type: "text", maxlength: 140, value: x.title || "", autocomplete: "off", "aria-label": "What it is" });
    const task = h("textarea", { class: "field", rows: "4", maxlength: "600", "aria-label": "What needs doing" });
    task.value = x.body || "";
    const site = h("input", { type: "text", maxlength: 120, value: x.site || "", autocomplete: "off", placeholder: "Optional", "aria-label": "Website" });
    const err = h("p", { class: "err", role: "alert" });
    const go = Button({ size: "sm", type: "submit" }, label);
    const form = h("form", { class: "pform" },
      Field({ label: "What it is" }, title), Field({ label: "What needs doing", hint: "Write it so that someone else could do it. Leave out passwords and card numbers; keep those in the Vault." }, task), Field({ label: "Website" }, site), err,
      h("div", { class: "btns" }, go, cancel ? Button({ variant: "secondary", size: "sm", type: "button", onclick: cancel }, "Cancel") : null));
    form.addEventListener("submit", e => {
      e.preventDefault();
      const v = { title: clean(title.value, 140), task: clean(task.value, 600), site: clean(site.value, 120) };
      if (!v.title) { err.textContent = "Say what it is."; return; }
      if (!v.task) { err.textContent = "Write what needs doing."; return; }
      if (cardish(`${v.title} ${v.task} ${v.site}`)) { err.textContent = "That looks like a card number. Keep cards in the Vault and leave them out of a Handoff."; return; }
      busy(go, async () => {
        err.textContent = "";
        try { await submit(v); if (!x.id) form.reset(); } catch (z) { err.textContent = z.message; }
      });
    });
    return { form, focus: () => title.focus() };
  }

  const create = Button({ icon: "plus", onclick: () => {
    let drawer;
    const { form, focus } = handoffForm({ label: "Save Handoff", cancel: () => drawer.close(), submit: async v => { const x = await make("handoff", v); made.textContent = `Saved “${x.title}”. Nothing has run.`; drawer.close(); } });
    drawer = Drawer({ title: "New Handoff", description: "A task that needs a web browser, written down.", body: form, focus: () => form.querySelector("input") });
  } }, "New Handoff");
  fill(root, h("section", { class: "page" },
    Breadcrumb([{ label: "Settings", href: "#/settings" }, { label: "Handoff" }]),
    h("h1", { class: "page-title", text: "Tasks that need a computer." }),
    h("p", { class: "page-lead", text: "A Handoff is a task that needs a web browser: buying something, booking, filling in a form. The cloud browser only reads, so a Handoff is saved here as a written task. None has run, and none will until a computer is connected." }),
    h("p", { class: "fine" }, soonTag(), " A computer of its own for Roxan to work on these is not built yet."),
    h("p", { class: "fine" }, "Logins and cards belong in the ", h("a", { class: "link", href: "#/vault", text: "Vault" }), ", never in a Handoff or a message."),
    h("div", { class: "page-act" }, create, made),
    body));

  const btn = (text, fn, variant = "secondary") => Button({ variant, size: "sm", onclick: e => busy(e.currentTarget, fn) }, text);

  function item(x) {
    const move = state => () => edit(x.id, { state });
    const acts = x.state === "queued" ? [btn("I did it", move("done")), btn("Drop", move("cancelled"))] : [btn(x.state === "done" ? "Reopen" : "Restore", move("queued"))];
    const li = h("li", { class: "row", data: { id: x.id, state: x.state } },
      h("span", { class: "row-main" }, h("span", { class: "row-title", text: x.title }), h("span", { class: "row-sub" }, x.site ? [siteEl(x.site), ". "] : null, x.body)),
      h("span", { class: "row-when", text: ago(x.updated) }));
    const change = Button({ variant: "secondary", size: "sm", icon: "edit" }, "Edit");
    change.addEventListener("click", () => {
      const { form, focus } = handoffForm({ x, label: "Save changes", cancel: draw, submit: v => edit(x.id, v) });
      li.classList.add("editing");
      fill(li, form);
      focus();
    });
    li.append(h("span", { class: "row-acts" }, acts, change, sure("Delete", b => busy(b, () => drop(x.id)))));
    return li;
  }

  function draw() {
    const by = state => S.handoffs.filter(x => x.state === state);
    const waiting = by("queued"), done = by("done"), dropped = by("cancelled");
    fill(body,
      section("Waiting for a computer", waiting.length ? h("span", { class: "label", text: String(waiting.length) }) : null,
        waiting.length ? h("ul", { class: "rows" }, waiting.map(item)) : h("p", { class: "none", text: "Nothing is waiting. Ask Roxan for something that needs a website, or write a Handoff above." })),
      done.length ? section("Done by you", null, h("ul", { class: "rows" }, done.map(item))) : null,
      dropped.length ? Accordion({ class: "k-removed", items: [{ id: "dropped", title: `Dropped (${dropped.length})`, body: h("ul", { class: "rows" }, dropped.map(item)) }] }) : null);
  }
  draw();
  return watch("handoffs", soon(draw));
}
