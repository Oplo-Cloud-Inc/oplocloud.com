/* Needs you: everything Roxan is waiting on you for. A request is something it
   wants to do and will not do without your yes. A question is something it
   cannot go on without. Nothing here happens until you answer, and a request
   you ignore expires and does not happen. */
import { h, fill, section } from "../dom.js";
import { S, waiting, watch } from "../state.js";
import { soon, needCard, empty } from "../ui.js";

export async function mount(root) {
  const body = h("div");
  const draw = () => {
    const now = waiting();
    const past = [...S.approvals, ...S.questions].filter(x => x.state !== "awaiting").sort((a, b) => b.updated - a.updated).slice(0, 12);
    fill(body, now.length ? now.map(needCard) : empty("Nothing needs you.", "When Roxan wants to do something that asks first, or needs an answer, it shows up here and in the rail."),
      past.length ? section("Recently answered", null, past.map(needCard)) : null);
  };
  draw();
  fill(root, h("section", { class: "page" },
    h("h1", { class: "page-title", text: "Needs you." }),
    h("p", { class: "page-lead", text: "What Roxan is waiting on you for. Which things it asks about first is up to you, in Access." }),
    body));
  return watch(["approvals", "questions"], soon(draw));
}
