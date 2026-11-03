/* Goals: what you want to get done, and the plan toward it. Roxan keeps the plan
   and ticks steps off as they happen; you can do the same, change it, or drop
   the goal. A goal can have routines that work on it. */
import { h, fill, section } from "../dom.js";
import { S, watch, find } from "../state.js";
import { describe } from "../when.js";
import { cardish } from "../sensitive.js";
import { soon, busy, sure, tag, progress, ring, stepsLine, empty, make, edit, drop, ago } from "../ui.js";
import { Button, IconButton, Drawer, Field, Tabs, Breadcrumb, Checkbox, Accordion } from "../kit/index.js";

const STATE = { active: "Active", paused: "Paused", done: "Done", dropped: "Dropped" };
const lines = text => text.split("\n").map(s => s.trim()).filter(Boolean);

const goalRow = g => h("a", { class: "row", href: "#/goals/" + g.id },
  h("div", { class: "row-main" }, h("span", { class: "row-title", text: g.title }), h("span", { class: "row-sub", text: stepsLine(g) })),
  g.steps?.length ? ring(g.steps.filter(s => s.done).length, g.steps.length, `${g.title}: ${stepsLine(g)}`) : null, tag(STATE[g.state] || g.state));

export const mount = (root, ctx) => (ctx.params[0] ? detail(root, ctx) : index(root, ctx));

// The form for a new goal, in a drawer.
function newGoal(app) {
  const title = h("input", { type: "text", maxlength: "140", "aria-label": "Goal", placeholder: "What do you want to get done?" });
  const why = h("input", { type: "text", maxlength: "300", "aria-label": "Why it matters", placeholder: "Why it matters (optional)" });
  const steps = h("textarea", { class: "field", rows: "4", "aria-label": "Steps", placeholder: "Steps, one to a line (optional)" });
  const err = h("p", { class: "err", role: "alert" });
  const add = Button({ type: "submit" }, "Save goal");
  let drawer;
  const form = h("form", { class: "pform" }, Field({ label: "Goal" }, title), Field({ label: "Why it matters" }, why), Field({ label: "Steps", hint: "Leave this empty and ask Roxan to plan it with you." }, steps), err,
    h("div", { class: "btns" }, add, Button({ variant: "secondary", type: "button", onclick: () => drawer.close() }, "Cancel")));
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!title.value.trim()) { err.textContent = "Say what the goal is."; return; }
    if (cardish(title.value + why.value + steps.value)) { err.textContent = "That looks like a card number. Keep those in the vault."; return; }
    busy(add, async () => {
      err.textContent = "";
      try { const g = await make("goal", { title: title.value.trim(), why: why.value.trim(), steps: lines(steps.value) }); drawer.close(); app.go("/goals/" + g.id); }
      catch (x) { err.textContent = x.message; }
    });
  });
  drawer = Drawer({ title: "New goal", description: "Something you want to get done.", body: form, focus: () => title });
}

function index(root, { app }) {
  const openList = h("div"), shutList = h("div");
  const tabs = Tabs({ label: "Goals", tabs: [{ id: "open", label: "In progress", count: 0, panel: openList }, { id: "shut", label: "Finished", count: 0, panel: shutList }] });
  const draw = () => {
    const open = S.goals.filter(g => g.state === "active" || g.state === "paused"), shut = S.goals.filter(g => g.state === "done" || g.state === "dropped");
    fill(openList, open.length ? open.map(goalRow) : empty("No goals yet.", "A goal is something you want to get done. Add one, or tell Roxan and it will start one with a plan."));
    fill(shutList, shut.length ? shut.map(goalRow) : empty("Nothing finished yet.", "A goal you finish or drop is kept here."));
    tabs.setCount("open", open.length); tabs.setCount("shut", shut.length);
  };
  draw();
  fill(root, h("section", { class: "page" },
    h("h1", { class: "page-title", text: "Goals." }),
    h("p", { class: "page-lead", text: "What you want to get done, and the plan toward it. Roxan keeps each plan and ticks steps off as they happen. You can change any of it." }),
    h("div", { class: "page-act" }, Button({ icon: "plus", onclick: () => newGoal(app) }, "New goal")), tabs));
  return watch("goals", soon(draw));
}

function detail(root, { app, params }) {
  const id = params[0];
  const page = h("section", { class: "page" });
  root.append(page);
  const top = h("div"), plan = h("div"), links = h("div");

  const again = h("input", { type: "text", maxlength: "200", "aria-label": "Add a step", placeholder: "Add a step" });
  const addGo = Button({ size: "sm", type: "submit", icon: "plus" }, "Add");
  const addStep = h("form", { class: "inline" }, again, addGo);
  addStep.addEventListener("submit", e => {
    e.preventDefault();
    const g = find(id), text = again.value.trim();
    if (!g || !text) return;
    busy(addGo, async () => { await edit(id, { steps: [...g.steps, { text, done: false }] }); again.value = ""; });
  });

  const title = h("input", { type: "text", maxlength: "140", "aria-label": "Goal" }), why = h("input", { type: "text", maxlength: "300", "aria-label": "Why it matters" });
  const save = Button({ size: "sm", type: "submit" }, "Save");
  const editor = h("form", { class: "pform" }, Field({ label: "Goal" }, title), Field({ label: "Why it matters" }, why), h("div", { class: "btns" }, save));
  editor.addEventListener("submit", e => { e.preventDefault(); busy(save, () => edit(id, { title: title.value.trim(), why: why.value.trim() })); });
  let filled = false;

  function draw() {
    const g = find(id);
    if (!g) { fill(page, h("h1", { class: "page-title", text: "That goal is gone." }), h("a", { class: "go", href: "#/goals" }, "All goals ", h("i", { "aria-hidden": "true" }))); return; }
    if (!filled) { title.value = g.title; why.value = g.body || ""; filled = true; }
    const setState = (state, label, variant = "secondary") => { const b = Button({ variant, size: "sm", onclick: () => busy(b, () => edit(id, { state })) }, label); return b; };
    const open = g.state === "active" || g.state === "paused";
    const plan0 = Button({ variant: "secondary", size: "sm", icon: "sparkle", onclick: () => { app.prefill = `Help me plan my goal “${g.title}”. Break it into steps and update the goal.`; app.go("/chat"); } }, "Plan this with Roxan");
    fill(top, Breadcrumb([{ label: "Goals", href: "#/goals" }, { label: g.title }]),
      h("h1", { class: "page-title", text: g.title }),
      g.body ? h("p", { class: "page-lead", text: g.body }) : null,
      h("p", { class: "fine", text: `${STATE[g.state]}. ${stepsLine(g)}. Updated ${ago(g.updated)}.` }),
      g.steps.length ? progress(g.steps.filter(s => s.done).length, g.steps.length, stepsLine(g)) : null,
      h("div", { class: "btns" },
        open ? setState("done", "Mark as done", "primary") : setState("active", "Reopen", "primary"),
        open ? (g.state === "active" ? setState("paused", "Pause") : setState("active", "Resume")) : null,
        open ? setState("dropped", "Drop it") : null, plan0));
    fill(plan, section("Plan", null, g.steps.length ? h("ul", { class: "checks" }, g.steps.map((s, i) => h("li", { class: "step", data: { done: String(s.done) } },
      Checkbox({ label: s.text, checked: s.done, onchange: (on, box) => busy(box, () => edit(id, { steps: g.steps.map((x, k) => (k === i ? { ...x, done: on } : x)) })) }),
      IconButton({ size: "sm", "aria-label": `Remove step: ${s.text}`, "data-tip": "Remove step", onclick: e => busy(e.currentTarget, () => edit(id, { steps: g.steps.filter((_, k) => k !== i) })) }, "x")))) : h("p", { class: "none", text: "No steps yet. Add one below, or ask Roxan to plan it." })));
    const mine = S.routines.filter(r => r.goal === id && r.state !== "done");
    fill(links, mine.length ? section("Routines working on this", h("a", { class: "go sm", href: "#/routines" }, "Routines ", h("i", { "aria-hidden": "true" })), mine.map(r => h("div", { class: "row" }, h("div", { class: "row-main" }, h("span", { class: "row-title", text: r.title }), h("span", { class: "row-sub", text: describe(r.schedule, S.settings.tz) })), tag(STATE[r.state] || r.state)))) : null);
  }
  fill(page, top, plan, addStep, links, Accordion({ class: "k-edit", items: [{ id: "edit", title: "Edit the goal", body: editor }] }),
    h("div", { class: "danger" }, sure("Delete this goal", async b => { await busy(b, async () => { await drop(id); app.go("/goals"); }); }, { what: "The goal and its plan are deleted." })));
  draw();
  return watch(["goals", "routines"], soon(draw));
}
