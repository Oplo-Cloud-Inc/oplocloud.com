/* Home: what needs you, what is coming up, and a place to start. */
import { h, on, section, ago, when } from "../dom.js";
import * as db from "../db.js";
import * as proposals from "../proposals.js";
import * as store from "../store.js";
import { card } from "../cards.js";

const hello = () => { const n = new Date().getHours(); return n < 5 ? "Still up." : n < 12 ? "Good morning." : n < 18 ? "Good afternoon." : "Good evening."; };

export async function mount(root, { app }) {
  const input = h("input", { type: "text", maxlength: "20000", autocomplete: "off", "aria-label": "Ask Roxan", placeholder: "What is on your mind?" });
  const ask = h("form", { class: "ask" }, input, h("button", { class: "btn", type: "submit", text: "Ask" }));
  ask.addEventListener("submit", e => { e.preventDefault(); app.pendingSend = input.value.trim() || null; app.go("/chat"); });
  const body = h("div");
  root.append(h("section", { class: "page home" }, h("h1", { class: "page-title", text: hello() }), ask, body));

  async function draw() {
    const [waiting, notes, reminders, rooms] = await Promise.all([proposals.pending(), db.all("memories"), db.all("reminders"), db.all("rooms")]);
    const name = new Map(rooms.map(r => [r.id, store.roomLabel(r, rooms)]));
    const soon = reminders.filter(r => r.state === "scheduled").sort((a, b) => a.at - b.at).slice(0, 3);
    const recent = rooms.filter(r => r.kind === "main" || (r.kind === "session" && r.updatedAt > r.createdAt)).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
    const project = r => rooms.find(x => x.id === r.projectId)?.name;
    body.replaceChildren(
      section("Waiting for you", h("a", { class: "go sm", href: "#/actions" }, "Action Center ", h("i", { "aria-hidden": "true" })),
        ...(waiting.length ? waiting.map(ev => h("div", { class: "wait" }, h("p", { class: "fine", text: `In ${name.get(ev.roomId) ?? "a conversation"}, ${ago(ev.at)}` }), card(ev, notes)))
          : [h("p", { class: "none", text: "Nothing needs your approval. Roxan proposes; you decide." })])),
      section("Coming up", h("a", { class: "go sm", href: "#/schedule" }, "Scheduled Tasks ", h("i", { "aria-hidden": "true" })),
        ...(soon.length ? [h("ul", { class: "rows" }, soon.map(r => h("li", { class: "row" }, h("span", { class: "row-main" }, h("span", { class: "row-title", text: r.title })), h("span", { class: "row-when", text: when(r.at) }))))]
          : [h("p", { class: "none", text: "No reminders set." })])),
      section("Pick up", null, h("ul", { class: "rows" }, recent.map(r => h("li", { class: "row" },
        h("a", { class: "row-main", href: store.roomHref(r) }, h("span", { class: "row-title", text: r.kind === "main" ? "Conversation" : r.name }), h("span", { class: "row-sub", text: r.kind === "main" ? "Your main conversation" : project(r) ?? "Project" })),
        h("span", { class: "row-when", text: r.updatedAt > r.createdAt ? ago(r.updatedAt) : "" }))))));
  }
  await draw();
  const off = ["proposal", "reminders", "memories"].map(e => on(e, draw));
  input.focus({ preventScroll: true });
  return () => off.forEach(f => f());
}
