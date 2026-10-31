/* Schedule: reminders, set by you or by Roxan with your approval. They fire only
   while Roxan is open in a browser tab; one that came due while it was closed
   is shown as missed, never as delivered. */
import { h, on, emit, section, field, when, toLocalInput } from "../dom.js";
import * as db from "../db.js";
import * as store from "../store.js";
import * as remind from "../remind.js";

const STATE = { fired: "Reminded", missed: "Missed", cancelled: "Cancelled" };

export async function mount(root) {
  const title = h("input", { type: "text", maxlength: "140", required: true, autocomplete: "off" });
  const at = h("input", { type: "datetime-local", required: true, min: toLocalInput(Date.now()) });
  const err = h("p", { class: "err", role: "alert" });
  const alerts = h("p", { class: "fine" });
  const upcoming = h("ul", { class: "rows" });
  const past = h("ul", { class: "rows" });
  const clear = h("button", { class: "act-btn", type: "button", text: "Clear" });
  const earlier = section("Earlier", clear, past);
  const form = h("form", { class: "sched" }, field("What", title), field("When", at), h("button", { class: "btn", type: "submit", text: "Set reminder" }));
  root.append(h("section", { class: "page" },
    h("h1", { class: "page-title", text: "Reminders, when you want them." }),
    h("p", { class: "page-lead", text: "For now, a scheduled task is a reminder. Roxan can propose one, and you approve it. Reminders are kept on this device and appear only while Roxan is open in a browser tab. If one comes due while it is closed, it is marked missed when you next open it." }),
    form, err, alerts,
    section("Coming up", null, upcoming), earlier));

  function paintAlerts() {
    const p = remind.permission();
    alerts.replaceChildren(p === "granted" ? "Browser alerts are on, so a reminder also appears as a notification." : p === "denied" ? "Browser alerts are blocked for this site, so reminders appear only inside Roxan." :
      p === "unsupported" ? "This browser cannot show alerts, so reminders appear only inside Roxan." : "Reminders appear inside Roxan. ");
    if (p === "default") alerts.append(h("button", { class: "act-btn", type: "button", text: "Allow alerts", onclick: async () => { await remind.askPermission(); paintAlerts(); } }));
  }

  const row = (r, open) => {
    const li = h("li", { class: "row", data: { id: r.id } },
      h("span", { class: "row-main" }, h("span", { class: "row-title", text: r.title }), h("span", { class: "row-sub", text: `${when(r.at)}. ${r.eventId ? "Proposed by Roxan, approved by you" : "Set by you"}` })),
      open ? h("span", { class: "row-acts" }, h("button", { class: "act-btn", type: "button", text: "Cancel", onclick: async () => {
        await db.put("reminders", { ...r, state: "cancelled", resolvedAt: Date.now() });
        await store.log("reminder", `Cancelled the reminder “${r.title}”.`);
        emit("reminders");
      } })) : h("span", { class: "row-when", text: STATE[r.state] }));
    return li;
  };

  async function draw() {
    const all = await db.all("reminders");
    const up = all.filter(r => r.state === "scheduled").sort((a, b) => a.at - b.at);
    const old = all.filter(r => r.state !== "scheduled").sort((a, b) => b.at - a.at);
    upcoming.replaceChildren(...(up.length ? up.map(r => row(r, true)) : [h("li", { class: "row none", text: "Nothing scheduled." })]));
    past.replaceChildren(...old.slice(0, 40).map(r => row(r, false)));
    earlier.hidden = !old.length;
    at.min = toLocalInput(Date.now());
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const t = title.value.trim().replace(/\s+/g, " "), ms = Date.parse(at.value);
    if (!t) { err.textContent = "Say what the reminder is for."; return; }
    if (Number.isNaN(ms) || ms < Date.now() + 30_000) { err.textContent = "Choose a time in the future."; return; }
    err.textContent = "";
    remind.askPermission().then(paintAlerts);                   // asked from this click, or the browser ignores it
    await db.put("reminders", { id: db.uid("r"), title: t, at: ms, createdAt: Date.now(), state: "scheduled", roomId: null });
    await store.log("reminder", `Set a reminder “${t}” for ${when(ms)}.`);
    emit("reminders");
    form.reset();
  });
  clear.addEventListener("click", async () => {
    for (const r of (await db.all("reminders")).filter(x => x.state !== "scheduled")) await db.del("reminders", r.id);
    emit("reminders");
  });

  paintAlerts();
  await draw();
  return on("reminders", draw);
}
