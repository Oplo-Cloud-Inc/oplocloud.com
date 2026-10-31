/* Handoff: tasks that need a web browser (buying, booking, filling in a form).

   Roxan cannot use a browser and no computer is connected yet, so a Handoff is a
   written task that waits here. Nothing on this page has been done by anyone but
   you: "done" means you did it yourself and said so. The page says this plainly
   and never shows progress it does not have. */
import { h, on, section, field, ago, when } from "../dom.js";
import * as db from "../db.js";
import * as store from "../store.js";
import { cardish } from "../sensitive.js";

const STATE = { waiting: "Waiting for a computer", done: "You did it", dropped: "Dropped" };
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

// The fields of a Handoff, as a form that checks what it is given. Resolves with the clean values or shows why not.
function handoffForm({ x = {}, submit, cancel, label }) {
  const title = h("input", { type: "text", maxlength: 140, value: x.title || "", autocomplete: "off", "aria-label": "What it is" });
  const task = h("textarea", { class: "field", rows: "4", maxlength: "600", "aria-label": "What needs doing" });
  task.value = x.task || "";
  const site = h("input", { type: "text", maxlength: 120, value: x.site || "", autocomplete: "off", placeholder: "Optional", "aria-label": "Website" });
  const err = h("p", { class: "err", role: "alert" });
  const form = h("form", { class: "pform" },
    field("What it is", title), field("What needs doing", task, "Write it so that someone else could do it. Leave out passwords and card numbers; keep those in the Vault."), field("Website", site), err,
    h("div", { class: "btns" }, h("button", { class: "btn sm", type: "submit", text: label }), cancel ? h("button", { class: "btn sm ghost", type: "button", text: "Cancel", onclick: cancel }) : null));
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const v = { title: clean(title.value, 140), task: clean(task.value, 600), site: clean(site.value, 120) };
    if (!v.title) { err.textContent = "Say what it is."; return; }
    if (!v.task) { err.textContent = "Write what needs doing."; return; }
    if (cardish(`${v.title} ${v.task} ${v.site}`)) { err.textContent = "That looks like a card number. Keep cards in the Vault and leave them out of a Handoff."; return; }
    err.textContent = "";
    await submit(v);
    form.reset();
  });
  return { form, focus: () => title.focus() };
}

const act = (text, fn) => h("button", { class: "act-btn", type: "button", text, onclick: fn });
const setState = (x, state, text) => store.setHandoff(x, { state }, text);

export async function mount(root, { params }) {
  const id = params[0];                                      // none: the list; "new": the list with the form open; else one Handoff
  return id && id !== "new" ? one(root, id) : list(root, id === "new");
}

/* ----------------------------------------------------------------- the list */
async function list(root, opening) {
  const body = h("div");
  const made = h("p", { class: "fine", role: "status" });
  const { form, focus } = handoffForm({
    label: "Save Handoff",
    submit: async v => { const x = await store.addHandoff(v); made.textContent = `Saved “${x.title}”. Nothing has run.`; create.open = false; },
  });
  const create = h("details", { class: "create", open: opening }, h("summary", { class: "btn sm", text: "New Handoff" }), form);
  root.append(h("section", { class: "page" },
    h("h1", { class: "page-title", text: "Tasks that need a computer." }),
    h("p", { class: "page-lead", text: "A Handoff is a task that needs a web browser: buying something, booking, filling in a form. Roxan cannot use a browser yet, so a Handoff is saved here as a written task. None has run, and none will until a computer is connected." }),
    h("p", { class: "fine" }, "Logins and cards belong in the ", h("a", { class: "link", href: "#/vault", text: "Vault" }), ", never in a Handoff or a message."),
    h("div", { class: "page-act" }, create, made),
    body));
  if (opening) focus();

  async function draw() {
    const all = (await db.all("handoffs")).sort((a, b) => b.updatedAt - a.updatedAt);
    const item = x => {
      const acts = x.state === "waiting" ? [act("I did it", () => setState(x, "done", `Marked the Handoff “${x.title}” as done by you.`)), act("Drop", () => setState(x, "dropped", `Dropped the Handoff “${x.title}”.`))]
        : x.state === "done" ? [act("Reopen", () => setState(x, "waiting", `Reopened the Handoff “${x.title}”.`))] : [act("Restore", () => setState(x, "waiting", `Restored the Handoff “${x.title}”.`))];
      return h("li", { class: "row", data: { id: x.id, state: x.state } },
        h("a", { class: "row-main", href: "#/handoff/" + x.id }, h("span", { class: "row-title", text: x.title }), h("span", { class: "row-sub", text: [x.site, x.task].filter(Boolean).join(", ") })),
        h("span", { class: "row-when", text: ago(x.updatedAt) }), h("span", { class: "row-acts" }, acts));
    };
    const waiting = all.filter(x => x.state === "waiting"), done = all.filter(x => x.state === "done"), dropped = all.filter(x => x.state === "dropped");
    body.replaceChildren(...[                                  // an empty group is null, and replaceChildren would write it out as the word "null"
      section("Waiting for a computer", waiting.length ? h("span", { class: "label", text: String(waiting.length) }) : null,
        waiting.length ? h("ul", { class: "rows" }, waiting.map(item)) : h("p", { class: "none", text: "Nothing is waiting. Ask Roxan for something that needs a website, or write a Handoff above." })),
      done.length ? section("Done by you", null, h("ul", { class: "rows" }, done.map(item))) : null,
      dropped.length ? h("details", { class: "removed" }, h("summary", { class: "go", text: `Dropped (${dropped.length})` }), h("ul", { class: "rows" }, dropped.map(item))) : null].filter(Boolean));
  }
  await draw();
  return on("handoffs", draw);
}

/* ------------------------------------------------------------------ one Handoff */
async function one(root, id) {
  const page = h("section", { class: "page" });
  root.append(page);
  let editing = false;

  async function draw() {
    const x = await db.get("handoffs", id);
    if (!x) {
      page.replaceChildren(h("h1", { class: "page-title", text: "That Handoff is not here." }), h("a", { class: "go", href: "#/handoff" }, "Handoff ", h("i", { "aria-hidden": "true" })));
      return;
    }
    const room = x.roomId ? await store.getRoom(x.roomId) : null;
    document.title = `${x.title} — Roxan`;
    const row = (dt, dd) => [h("dt", { text: dt }), h("dd", null, dd)];
    if (editing) {
      const { form } = handoffForm({ x, label: "Save changes", cancel: () => { editing = false; draw(); }, submit: async v => { await store.setHandoff(x, v, `Changed the Handoff “${v.title}”.`); editing = false; } });
      page.replaceChildren(h("p", { class: "label crumb" }, h("a", { href: "#/handoff", text: "Handoff" })), h("h1", { class: "page-title", text: "Change this Handoff." }), form);
      return;
    }
    const acts = x.state === "waiting" ? [act("I did it", () => setState(x, "done", `Marked the Handoff “${x.title}” as done by you.`)), act("Drop", () => setState(x, "dropped", `Dropped the Handoff “${x.title}”.`))]
      : x.state === "done" ? [act("Reopen", () => setState(x, "waiting", `Reopened the Handoff “${x.title}”.`))] : [act("Restore", () => setState(x, "waiting", `Restored the Handoff “${x.title}”.`))];
    page.replaceChildren(...[
      h("p", { class: "label crumb" }, h("a", { href: "#/handoff", text: "Handoff" }), " / ", STATE[x.state]),
      h("h1", { class: "page-title", text: x.title }),
      x.state === "waiting" ? h("p", { class: "page-lead", text: "No computer is connected, so nothing has been done for this. Do it yourself and mark it done, or leave it here." }) : null,
      h("dl", { class: "facts" }, row("Task", x.task), x.site ? row("Website", siteEl(x.site)) : null, row("Saved", when(x.createdAt)),
        room ? row("From", h("a", { class: "go sm", href: store.roomHref(room) }, room.kind === "main" ? "The main conversation" : room.name, " ", h("i", { "aria-hidden": "true" }))) : x.roomId ? row("From", "A conversation that is gone") : null),
      h("div", { class: "btns" }, act("Edit", () => { editing = true; draw(); }), acts)].filter(Boolean));
  }
  await draw();
  return on("handoffs", draw);
}
