/* Action Center: everything Roxan has proposed, waiting or decided. Nothing
   here happens until it is approved, and what was decided stays as a record. */
import { h, on, section, ago } from "../dom.js";
import * as db from "../db.js";
import * as proposals from "../proposals.js";
import * as store from "../store.js";
import { card } from "../cards.js";

const WORD = { done: "Approved", declined: "Declined", superseded: "Not approved", expired: "Expired", failed: "Did not work" };
const SHOWN = 30;

export async function mount(root) {
  const body = h("div");
  root.append(h("section", { class: "page" },
    h("p", { class: "label", text: "Action Center" }),
    h("h1", { class: "page-title", text: "What needs a decision." }),
    h("p", { class: "page-lead", text: "Roxan proposes; you decide. Nothing waiting here happens until you approve it, and what you decided stays below as a record." }),
    body));

  async function draw() {
    const [events, notes, rooms] = await Promise.all([db.all("events"), db.all("memories"), db.all("rooms")]);
    const mine = events.filter(e => e.kind === "proposal");
    const waiting = mine.filter(e => e.state === "awaiting").sort((a, b) => b.at - a.at);
    const decided = mine.filter(e => e.state !== "awaiting").sort((a, b) => (b.resolvedAt || b.at) - (a.resolvedAt || a.at)).slice(0, SHOWN);
    const where = id => { const r = rooms.find(x => x.id === id); return r ? { text: store.roomLabel(r, rooms), href: store.roomHref(r) } : { text: "a conversation that is gone", href: null }; };
    body.replaceChildren(
      section("Waiting for you", waiting.length ? h("span", { class: "label", text: String(waiting.length) }) : null,
        ...(waiting.length ? waiting.map(ev => h("div", { class: "wait" }, h("p", { class: "fine", text: `In ${where(ev.roomId).text} · ${ago(ev.at)}` }), card(ev, notes)))
          : [h("p", { class: "none", text: "Nothing needs your approval." })])),
      section("Decided", null, h("ul", { class: "rows" }, decided.length ? decided.map(ev => {
        const w = where(ev.roomId);
        const main = [h("span", { class: "row-title", text: `${WORD[ev.state]}: ${proposals.describe(ev, notes)}` }), h("span", { class: "row-sub", text: w.text })];
        return h("li", { class: "row" }, w.href ? h("a", { class: "row-main", href: w.href }, main) : h("span", { class: "row-main" }, main), h("span", { class: "row-when", text: ago(ev.resolvedAt || ev.at) }));
      }) : [h("li", { class: "row none", text: "Nothing decided yet." })])));
  }
  await draw();
  const off = ["proposal", "memories", "rooms"].map(e => on(e, draw));
  return () => off.forEach(f => f());
}
