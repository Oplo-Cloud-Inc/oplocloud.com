/* What stands in for the composer when Roxan cannot be talked to: it says why,
   and when the reason is an invite code, takes one. */
import { h } from "./dom.js";
import * as api from "./api.js";
import * as store from "./store.js";
import { emit } from "./dom.js";

export async function saveCode(app, code) {
  const r = await api.health(code);
  if (r.state === "open" && r.access) {
    await store.setMeta("invite", code);
    app.invite = code;
    await app.refresh();
    return null;
  }
  if (r.state === "closed") return "Roxan is not open yet.";
  if (r.state === "busy") return "Too many tries. Wait a minute.";
  if (r.state === "offline") return "Roxan could not be reached.";
  return "That code was not recognised.";
}

export function gate(app) {
  const g = app.gateway;
  const wrap = h("section", { class: "gate", "aria-label": "Roxan is not available yet" });
  if (g.state === "checking") return wrap.append(h("p", { text: "Looking for Roxan…" })), wrap;
  if (g.state === "offline" || g.state === "busy") {
    wrap.append(h("p", { text: g.state === "busy" ? "Too many requests. Try again in a minute." : "Roxan could not be reached from here. Your history is still on this device." }),
      h("button", { class: "btn sm ghost", type: "button", text: "Try again", onclick: () => app.refresh() }));
    return wrap;
  }
  if (g.state === "closed") {
    wrap.append(h("p", { text: "Roxan is not taking messages yet. You can still keep notes, projects and reminders, which stay on this device." }),
      h("a", { class: "go", href: "/status/" }, "See status ", h("i", { "aria-hidden": "true" })));
    return wrap;
  }
  const input = h("input", { type: "text", autocomplete: "off", spellcheck: "false", "aria-label": "Invite code", placeholder: "Invite code" });
  const err = h("p", { class: "err", role: "alert" });
  const form = h("form", { class: "gate-form" }, input, h("button", { class: "btn sm", type: "submit", text: "Continue" }));
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const code = input.value.trim();
    if (!code) { err.textContent = "Enter your invite code."; return; }
    err.textContent = "";
    form.querySelector("button").disabled = true;
    const problem = await saveCode(app, code);
    form.querySelector("button").disabled = false;
    if (problem) err.textContent = problem;
  });
  wrap.append(h("p", { class: "gate-title", text: "Roxan is in invited beta." }),
    h("p", { class: "fine", text: app.invite ? "The code saved on this device was not accepted. Enter a new one. Your notes, projects and reminders work without one." : "Enter your invite code to talk to Roxan. Your notes, projects and reminders work without one." }), form, err,
    h("a", { class: "go", href: "https://oplocloud.com/contact/" }, "Ask for an invite ", h("i", { "aria-hidden": "true" })));
  return wrap;
}
