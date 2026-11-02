/* Activity: what Roxan did and why, newest first. A plain record so nothing
   happens out of sight: what ran, what it did, what it asked you, what it told
   you, and, so it is never a mystery, what it held back and the reason. It lists
   events, not the words in them. Entries about the vault are the exception to
   "kept by Roxan": they stay on this device, beside the vault. */
import { h, fill, on } from "../dom.js";
import * as local from "../local.js";
import { S, watch, events } from "../state.js";
import { soon, busy, empty, tag, stamp, KIND } from "../ui.js";
import { Button, Table, StatCard, SearchField, Select, Breadcrumb } from "../kit/index.js";

const PAGE = 60;
const word = e => KIND[e.kind] || e.kind;

export async function mount(root) {
  const older = [];                                  // pages fetched with "Show more"; the newest are kept up to date in S.events
  let device = [], end = S.events.length < 80;
  const more = Button({ variant: "secondary", size: "sm", icon: "down" }, "Show more");
  const note = h("p", { class: "fine", hidden: true, text: "Entries about the vault are kept on this device only." });
  const stats = h("div", { class: "k-stats" });
  const search = SearchField({ placeholder: "Search what happened", "aria-label": "Search what happened", oninput: () => table.setRows(shown()) });
  const kind = Select({ label: "Kind", options: [{ value: "", label: "Everything" }], value: "" });
  const table = Table({ label: "What has happened", size: "sm", empty: "Nothing here matches.", columns: [
    { key: "at", label: "When", sort: true, render: e => h("span", { class: "k-when", text: stamp(e.at) }) },
    { key: "kind", label: "About", render: e => tag(word(e)) },
    { key: "text", label: "What happened", render: e => h("span", { class: "k-what", text: e.text }) }] });
  const tools = h("div", { class: "k-tools" }, search, kind);
  const body = h("div");
  fill(root, h("section", { class: "page" },
    Breadcrumb([{ label: "Settings", href: "#/settings" }, { label: "Activity" }]),
    h("h1", { class: "page-title", text: "What has happened." }),
    h("p", { class: "page-lead", text: "A plain record of what Roxan did and why, so nothing happens out of sight. It lists what happened, never the words in it. When Roxan holds a message back, the reason is here." }),
    note, body));

  const merged = () => {
    const seen = new Set();
    return [...S.events, ...older, ...device].filter(e => !seen.has(e.id) && seen.add(e.id)).sort((a, b) => b.at - a.at);
  };
  const shown = () => {
    const q = search.input.value.trim().toLowerCase(), k = kind.value;
    return merged().filter(e => (!k || word(e) === k) && (!q || e.text.toLowerCase().includes(q)));
  };

  // What today holds. If the oldest entry loaded is from today there may be more before it, so the number says "or more".
  function paintStats(all) {
    const t0 = new Date().setHours(0, 0, 0, 0), today = all.filter(e => e.at >= t0);
    const partial = !end && all.length && Math.min(...all.map(e => e.at)) >= t0;
    const n = kinds => { const c = today.filter(e => kinds.includes(e.kind)).length; return partial ? `${c}+` : c; };
    fill(stats,
      StatCard({ icon: "checkc", label: "Done", value: n(["run", "step"]), note: "today" }),
      StatCard({ icon: "bell", label: "Told you", value: n(["notify"]), note: "today" }),
      StatCard({ icon: "pause", label: "Held back", value: n(["held"]), note: "today" }),
      StatCard({ icon: "alertc", label: "Problems", value: n(["error"]), note: "today" }));
  }

  function draw() {
    const all = merged();
    note.hidden = !device.length;
    more.hidden = end;
    const kinds = [...new Set(all.map(word))];
    const keep = kind.value;
    kind.setOptions([{ value: "", label: "Everything" }, ...kinds.map(k => ({ value: k, label: k }))]);
    kind.value = kinds.includes(keep) ? keep : "";
    paintStats(all);
    fill(body, all.length ? [stats, tools, table, h("div", { class: "page-act" }, more)] : empty("Nothing has happened yet.", "What Roxan does on its own, and why it holds something back, is recorded here."));
    table.setRows(shown());
  }

  kind.addEventListener("change", () => table.setRows(shown()));
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
