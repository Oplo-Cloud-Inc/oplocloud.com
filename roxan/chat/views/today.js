/* Today: what needs you, what Roxan is working on, and what happened while you
   were away. The first time, it is where you give your Roxan a name and a look.

   Nothing here is a feed to scroll. It is the few things that matter now, and
   a box to say something to Roxan. */
import { h, fill, section } from "../dom.js";
import * as api from "../api.js";
import { S, MAIN, watch, waiting, name as who } from "../state.js";
import { mark, MARKS } from "../mark.js";
import { describe } from "../when.js";
import { cardish } from "../sensitive.js";
import { soon, busy, needCard, progress, stepsLine, tag, logRow, toast, when, make, edit, take, saveSettings, markSeen, TONES } from "../ui.js";
import { Button, Input, Field, RadioGroup, StatusDot } from "../kit/index.js";

const AWAY = new Set(["run", "notify", "held", "error", "approval", "question"]);
const TRY = [["Remind me", "Remind me tomorrow morning to "], ["Watch a page", "Watch this page and tell me when it changes: "], ["Start a goal", "I want to "], ["Remember", "Remember that "]];

const hello = () => { const h24 = new Date().getHours(); return h24 < 5 ? "Hello" : h24 < 12 ? "Good morning" : h24 < 18 ? "Good afternoon" : "Good evening"; };
const more = (href, text) => h("a", { class: "go sm", href }, text, " ", h("i", { "aria-hidden": "true" }));

export async function mount(root, { app }) {
  const page = h("section", { class: "page today" });
  root.append(page);
  const off = [], inner = [];                       // what lasts as long as the page, and what lasts as long as one drawing of it
  let met = S.settings.onboarded;

  const status = h("p", { class: "today-status", role: "status" });
  const paintStatus = () => { fill(status, StatusDot({ state: S.status.state }), S.status.text || "Ready"); status.dataset.state = S.status.state; };
  paintStatus();
  off.push(watch("status", paintStatus));

  /* ------------------------------------------------ the first time */
  function meet() {
    let chosen = S.settings.mark, tone = S.settings.tone;
    const nameIn = h("input", { id: "meet-name", type: "text", maxlength: "24", value: S.settings.name, "aria-label": "Name" });
    const goal = h("input", { id: "meet-goal", type: "text", maxlength: "140", placeholder: "For example: learn to swim by summer", "aria-label": "One thing you want to get done" });
    const preview = h("span", { class: "meet-glyph" }, mark(chosen, "glyph big"));
    const marks = h("div", { class: "marks", role: "group", "aria-label": "Mark" }, MARKS.map(([id, label]) => {
      const b = h("button", { class: "mark-opt", type: "button", "aria-pressed": String(id === chosen), "aria-label": label, title: label, data: { mark: id } }, mark(id, "glyph"));
      b.addEventListener("click", () => { chosen = id; marks.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.mark === id))); fill(preview, mark(id, "glyph big")); });
      return b;
    }));
    const tones = RadioGroup({ label: "Tone", card: true, value: tone, options: TONES.map(([value, label, hint]) => ({ value, label, hint })), onchange: v => { tone = v; } });
    const err = h("p", { class: "err", role: "alert" });
    const go = Button({ type: "submit" }, "Start");
    const form = h("form", { class: "meet", "aria-label": "Meet your Roxan" },
      h("div", { class: "meet-id" }, preview, Field({ label: "Name" }, nameIn)),
      h("div", { class: "fld" }, h("span", { class: "label", text: "Mark" }), marks),
      h("div", { class: "fld" }, h("span", { class: "label", text: "Tone" }), tones),
      Field({ label: "One thing you want to get done (optional)", hint: "It becomes your first goal. Roxan helps you plan it." }, goal),
      h("div", { class: "btns" }, go), err);
    form.addEventListener("submit", e => {
      e.preventDefault();
      busy(go, async () => {
        err.textContent = "";
        if (cardish(goal.value)) { err.textContent = "That looks like a card number. Keep those in the vault."; return; }
        try {
          await saveSettings({ name: nameIn.value.trim() || "Roxan", mark: chosen, tone, onboarded: true });
          if (goal.value.trim()) await make("goal", { title: goal.value.trim() });
        } catch (x) { err.textContent = x.message; }
      });
    });
    return [
      h("p", { class: "page-lead", text: "Roxan is one assistant that keeps working between your messages: it can remind you, watch a page, follow a goal and tell you when something matters. Give yours a name and a look. You can change all of it later." }),
      h("p", { class: "fine", text: "Roxan keeps what you tell it on its servers, in your account. The vault is the one exception: it stays on this device." }),
      form,
    ];
  }

  /* ------------------------------------------------ every day after */
  function home() {
    const go = Button({ type: "submit", size: "sm", icon: "send" }, "Send");
    const box = Input({ id: "say", type: "text", maxlength: "20000", "aria-label": `Tell ${who()} something`, placeholder: `Tell ${who()} something, or ask for something`, trailing: go });
    const input = box.input;
    const err = h("p", { class: "err", role: "alert" });
    const ask = h("form", { class: "ask" }, box);
    ask.addEventListener("submit", e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      if (cardish(text)) { err.textContent = "That looks like a card number. Keep those in the vault; Roxan never needs them."; return; }
      if (!S.open) { err.textContent = `${who()} is not open for chatting yet.`; return; }
      busy(go, async () => {
        err.textContent = "";
        try { await api.post(`/threads/${MAIN}/messages`, { text }); app.go("/chat"); }
        catch (x) { err.textContent = x.message; }
      });
    });
    const body = h("div", { class: "today-body" });
    const draw = () => {
      const now = waiting(), goals = S.goals.filter(g => g.state === "active"), next = S.routines.filter(r => r.state === "active" && r.due).sort((a, b) => a.due - b.due);
      const away = S.events.filter(e => e.at > S.seen && AWAY.has(e.kind)).slice(0, 8), ideas = S.ideas.filter(i => i.state === "open");
      const parts = [];
      if (now.length) parts.push(section("Needs you", more("#/needs", now.length > 3 ? `All ${now.length}` : "Open"), now.slice(0, 3).map(needCard)));
      if (goals.length || next.length) parts.push(section("In progress", more("#/goals", "Goals"),
        goals.slice(0, 4).map(g => h("a", { class: "row", href: "#/goals/" + g.id }, h("div", { class: "row-main" }, h("span", { class: "row-title", text: g.title }), h("span", { class: "row-sub", text: stepsLine(g) })), g.steps?.length ? progress(g.steps.filter(s => s.done).length, g.steps.length, `${g.title}: ${stepsLine(g)}`) : null)),
        next.slice(0, 3).map(r => h("a", { class: "row", href: "#/routines" }, h("div", { class: "row-main" }, h("span", { class: "row-title", text: r.title }), h("span", { class: "row-sub", text: `${describe(r.schedule, S.settings.tz)}. Next: ${when(r.due)}` })), tag(r.mode === "remind" ? "Reminder" : r.mode === "watch" ? "Watching" : "Routine")))));
      if (away.length) parts.push(section("While you were away", Button({ variant: "secondary", size: "sm", icon: "check", onclick: e => busy(e.currentTarget, markSeen) }, "Mark as seen"), away.map(logRow)));
      if (ideas.length) parts.push(section("Ideas", null, ideas.slice(0, 4).map(i => h("div", { class: "row" }, h("div", { class: "row-main" }, h("span", { class: "row-title", text: i.title }), i.body ? h("span", { class: "row-sub about", text: i.body }) : null),
        h("div", { class: "row-acts" },
          Button({ variant: "secondary", size: "sm", icon: "plus", onclick: e => busy(e.currentTarget, async () => { await take(i.id); toast("Added to your goals."); }) }, "Take it on"),
          Button({ variant: "ghost", size: "sm", onclick: e => busy(e.currentTarget, () => edit(i.id, { state: "dismissed" })) }, "Not now"))))));
      if (!parts.length) parts.push(h("div", { class: "none-box" }, h("p", { class: "none-title", text: "Nothing is waiting." }),
        h("p", { class: "fine", text: `Tell ${who()} what you are working on, or ask it to look after something for you. Anything it does on its own shows up here.` }),
        h("div", { class: "ideas" }, TRY.map(([label, text]) => Button({ variant: "secondary", size: "sm", onclick: () => { input.value = text; input.focus(); input.setSelectionRange(text.length, text.length); } }, label)))));
      fill(body, parts);
    };
    draw();
    inner.push(watch(["approvals", "questions", "goals", "routines", "ideas", "events", "seen"], soon(draw)));
    return [ask, err, body];
  }

  const draw = () => { inner.splice(0).forEach(f => f()); fill(page, h("h1", { class: "page-title", text: met ? `${hello()}.` : `Meet ${who()}.` }), met ? status : null, ...(met ? home() : meet())); };
  draw();
  off.push(watch("settings", () => { if (S.settings.onboarded !== met) { met = S.settings.onboarded; draw(); } }));
  return () => { off.forEach(f => f()); inner.forEach(f => f()); };
}
