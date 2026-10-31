/* Activity: what happened, newest first: messages sent, replies, what you
   approved or declined, reminders. It records that things happened, never what
   was said. */
import { h, on, section, day, clock } from "../dom.js";
import * as db from "../db.js";

const PAGE = 100;
const KIND = { message: "You", reply: "Roxan", memory: "Memory", proposal: "Proposed", decision: "Decision", reminder: "Reminder", project: "Project", specialty: "Specialty", handoff: "Handoff", vault: "Vault", settings: "Settings" };

export async function mount(root) {
  let shown = PAGE;
  const list = h("div");
  const more = h("button", { class: "btn sm ghost", type: "button", text: "Show more", onclick: () => { shown += PAGE; draw(); } });
  root.append(h("section", { class: "page" },
    h("h1", { class: "page-title", text: "What has happened." }),
    h("p", { class: "page-lead", text: "A plain record of what you and Roxan did, so nothing happens out of sight. It lists events, not the words in them, and it lives on this device." }),
    list, h("div", { class: "page-act" }, more)));

  async function draw() {
    const rows = (await db.all("activity")).sort((a, b) => b.at - a.at);
    more.hidden = rows.length <= shown;
    const days = [];
    for (const r of rows.slice(0, shown)) {
      const d = day(r.at);
      if (days.at(-1)?.d !== d) days.push({ d, rows: [] });
      days.at(-1).rows.push(r);
    }
    list.replaceChildren(...(days.length ? days.map(g => section(g.d, null, h("ul", { class: "rows" }, g.rows.map(r =>
      h("li", { class: "row log" }, h("span", { class: "row-when", text: clock(r.at) }), h("span", { class: "tag", text: KIND[r.kind] || r.kind }), h("span", { class: "row-main", text: r.text })))))) : [h("p", { class: "none", text: "Nothing has happened yet." })]));
  }
  await draw();
  return on("activity", draw);
}
