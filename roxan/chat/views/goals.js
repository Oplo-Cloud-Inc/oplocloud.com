/* Goals: what you want to get done, and the plan toward it. Roxan keeps the plan
   and ticks steps off as they happen; you can do the same, change it, or drop
   the goal. A goal can have routines that work on it. */
import { h, fill, section, field } from "../dom.js";
import { S, watch, find } from "../state.js";
import { describe } from "../when.js";
import { cardish } from "../sensitive.js";
import { soon, busy, sure, tag, progress, stepsLine, empty, make, edit, drop, ago } from "../ui.js";

const STATE = { active: "Active", paused: "Paused", done: "Done", dropped: "Dropped" };
const lines = text => text.split("\n").map(s => s.trim()).filter(Boolean);

const goalRow = g => h("a", { class: "row", href: "#/goals/" + g.id },
  h("div", { class: "row-main" }, h("span", { class: "row-title", text: g.title }), h("span", { class: "row-sub", text: stepsLine(g) })),
  g.steps?.length ? progress(g.steps.filter(s => s.done).length, g.steps.length, `${g.title}: ${stepsLine(g)}`) : null, tag(STATE[g.state] || g.state));

export const mount = (root, ctx) => (ctx.params[0] ? detail(root, ctx) : index(root, ctx));

function index(root, { app }) {
  const title = h("input", { type: "text", maxlength: "140", "aria-label": "Goal", placeholder: "What do you want to get done?" });
  const why = h("input", { type: "text", maxlength: "300", "aria-label": "Why it matters", placeholder: "Why it matters (optional)" });
  const steps = h("textarea", { class: "field", rows: "4", "aria-label": "Steps", placeholder: "Steps, one to a line (optional)" });
  const err = h("p", { class: "err", role: "alert" });
  const add = h("button", { class: "btn sm", type: "submit", text: "Save goal" });
  const form = h("form", { class: "pform" }, field("Goal", title), field("Why it matters", why), field("Steps", steps, "Leave this empty and ask Roxan to plan it with you."), err, h("div", { class: "btns" }, add));
  const create = h("details", { class: "create" }, h("summary", { class: "btn sm", text: "New goal" }), form);
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!title.value.trim()) { err.textContent = "Say what the goal is."; return; }
    if (cardish(title.value + why.value + steps.value)) { err.textContent = "That looks like a card number. Keep those in the vault."; return; }
    busy(add, async () => {
      err.textContent = "";
      try { const g = await make("goal", { title: title.value.trim(), why: why.value.trim(), steps: lines(steps.value) }); form.reset(); create.open = false; app.go("/goals/" + g.id); }
      catch (x) { err.textContent = x.message; }
    });
  });

  const list = h("div");
  const draw = () => {
    const open = S.goals.filter(g => g.state === "active" || g.state === "paused"), shut = S.goals.filter(g => g.state === "done" || g.state === "dropped");
    fill(list, open.length ? section(`In progress (${open.length})`, null, open.map(goalRow)) : empty("No goals yet.", "A goal is something you want to get done. Add one, or tell Roxan and it will start one with a plan."),
      shut.length ? h("details", { class: "removed" }, h("summary", { class: "go", text: `Finished (${shut.length})` }), shut.map(goalRow)) : null);
  };
  draw();
  fill(root, h("section", { class: "page" },
    h("h1", { class: "page-title", text: "Goals." }),
    h("p", { class: "page-lead", text: "What you want to get done, and the plan toward it. Roxan keeps each plan and ticks steps off as they happen. You can change any of it." }),
    h("div", { class: "page-act" }, create), list));
  return watch("goals", soon(draw));
}

function detail(root, { app, params }) {
  const id = params[0];
  const page = h("section", { class: "page" });
  root.append(page);
  const top = h("div"), plan = h("div"), links = h("div");

  const again = h("input", { type: "text", maxlength: "200", "aria-label": "Add a step", placeholder: "Add a step" });
  const addStep = h("form", { class: "inline" }, again, h("button", { class: "btn sm", type: "submit", text: "Add" }));
  addStep.addEventListener("submit", e => {
    e.preventDefault();
    const g = find(id), text = again.value.trim();
    if (!g || !text) return;
    busy(addStep.querySelector("button"), async () => { await edit(id, { steps: [...g.steps, { text, done: false }] }); again.value = ""; });
  });

  const title = h("input", { type: "text", maxlength: "140", "aria-label": "Goal" }), why = h("input", { type: "text", maxlength: "300", "aria-label": "Why it matters" });
  const save = h("button", { class: "btn sm", type: "submit", text: "Save" });
  const editor = h("form", { class: "pform" }, field("Goal", title), field("Why it matters", why), h("div", { class: "btns" }, save));
  editor.addEventListener("submit", e => { e.preventDefault(); busy(save, () => edit(id, { title: title.value.trim(), why: why.value.trim() })); });
  let filled = false;

  function draw() {
    const g = find(id);
    if (!g) { fill(page, h("h1", { class: "page-title", text: "That goal is gone." }), h("a", { class: "go", href: "#/goals" }, "All goals ", h("i", { "aria-hidden": "true" }))); return; }
    if (!filled) { title.value = g.title; why.value = g.body || ""; filled = true; }
    const setState = (state, label, ghost = true) => h("button", { class: `btn sm${ghost ? " ghost" : ""}`, type: "button", text: label, onclick: e => busy(e.currentTarget, () => edit(id, { state })) });
    const open = g.state === "active" || g.state === "paused";
    fill(top, h("p", { class: "label crumb" }, h("a", { href: "#/goals", text: "Goals" })),
      h("h1", { class: "page-title", text: g.title }),
      g.body ? h("p", { class: "page-lead", text: g.body }) : null,
      h("p", { class: "fine", text: `${STATE[g.state]}. ${stepsLine(g)}. Updated ${ago(g.updated)}.` }),
      g.steps.length ? progress(g.steps.filter(s => s.done).length, g.steps.length, stepsLine(g)) : null,
      h("div", { class: "btns" },
        open ? (g.state === "active" ? setState("paused", "Pause") : setState("active", "Resume", false)) : setState("active", "Reopen", false),
        open ? setState("done", "Mark as done", false) : null,
        open ? setState("dropped", "Drop it") : null,
        h("button", { class: "btn sm ghost", type: "button", text: "Plan this with Roxan", onclick: () => { app.prefill = `Help me plan my goal “${g.title}”. Break it into steps and update the goal.`; app.go("/chat"); } })));
    fill(plan, section("Plan", null, g.steps.length ? h("ul", { class: "checks" }, g.steps.map((s, i) => h("li", { class: "step", data: { done: String(s.done) } },
      h("label", { class: "check" }, h("input", { type: "checkbox", checked: s.done, onchange: e => busy(e.target, () => edit(id, { steps: g.steps.map((x, k) => (k === i ? { ...x, done: e.target.checked } : x)) })) }), h("span", { text: s.text })),
      h("button", { class: "x", type: "button", "aria-label": `Remove step: ${s.text}`, text: "×", onclick: e => busy(e.currentTarget, () => edit(id, { steps: g.steps.filter((_, k) => k !== i) })) })))) : h("p", { class: "none", text: "No steps yet. Add one below, or ask Roxan to plan it." })));
    const mine = S.routines.filter(r => r.goal === id && r.state !== "done");
    fill(links, mine.length ? section("Routines working on this", h("a", { class: "go sm", href: "#/routines" }, "Routines ", h("i", { "aria-hidden": "true" })), mine.map(r => h("div", { class: "row" }, h("div", { class: "row-main" }, h("span", { class: "row-title", text: r.title }), h("span", { class: "row-sub", text: describe(r.schedule, S.settings.tz) })), tag(STATE[r.state] || r.state)))) : null);
  }
  fill(page, top, plan, addStep, links, h("details", { class: "create" }, h("summary", { class: "go", text: "Edit the goal" }), editor),
    h("div", { class: "danger" }, sure("Delete this goal", async b => { await busy(b, async () => { await drop(id); app.go("/goals"); }); }, { confirm: "Press again to delete" })));
  draw();
  return watch(["goals", "routines"], soon(draw));
}
