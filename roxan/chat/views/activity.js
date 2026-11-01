/* Activity: what Roxan did and why, newest first. A plain record so nothing
   happens out of sight: what ran, what it did, what it asked you, what it told
   you, and, so it is never a mystery, what it held back and the reason. It lists
   events, not the words in them. Entries about the vault are the exception to
   "kept by Roxan": they stay on this device, beside the vault. */
import { h, fill, section, day, on, crumb } from "../dom.js";
import * as local from "../local.js";
import { S, watch, events } from "../state.js";
import { soon, busy, logRow, empty } from "../ui.js";

const PAGE = 60;

export async function mount(root) {
  const older = [];                                  // pages fetched with "Show more"; the newest are kept up to date in S.events
  let device = [], end = S.events.length < 80;
  const list = h("div");
  const more = h("button", { class: "btn sm ghost", type: "button", text: "Show more" });
  const note = h("p", { class: "fine", hidden: true, text: "Entries about the vault are kept on this device only." });
  fill(root, h("section", { class: "page" },
    crumb("Settings", "#/settings"),
    h("h1", { class: "page-title", text: "What has happened." }),
    h("p", { class: "page-lead", text: "A plain record of what Roxan did and why, so nothing happens out of sight. It lists what happened, never the words in it. When Roxan holds a message back, the reason is here." }),
    note, list, h("div", { class: "page-act" }, more)));

  const merged = () => {
    const seen = new Set();
    return [...S.events, ...older, ...device].filter(e => !seen.has(e.id) && seen.add(e.id)).sort((a, b) => b.at - a.at);
  };

  function draw() {
    const days = [];
    for (const r of merged()) {
      const d = day(r.at);
      if (days.at(-1)?.d !== d) days.push({ d, rows: [] });
      days.at(-1).rows.push(r);
    }
    note.hidden = !device.length;
    more.hidden = end;
    fill(list, days.length ? days.map(g => section(g.d, null, g.rows.map(logRow))) : empty("Nothing has happened yet.", "What Roxan does on its own, and why it holds something back, is recorded here."));
  }

  more.addEventListener("click", () => busy(more, async () => {
    const ids = [...S.events, ...older].map(e => e.id);
    const got = await events(Math.min(...ids));
    older.push(...got);
    if (got.length < PAGE) end = true;
    draw();
  }));

  async function reload() { device = (await local.vaultLog()).map(r => ({ id: r.id, at: r.at, kind: r.kind, text: r.text })); draw(); }
  await reload();
  const off = [watch("events", soon(draw)), on("activity", reload)];
  return () => off.forEach(f => f());
}
