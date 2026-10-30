/* Reminders fire while Roxan is open. There is no server holding them, so a
   reminder that comes due while the page is closed is reported as missed the
   next time it opens, never silently dropped and never claimed as delivered. */
import * as db from "./db.js";
import { emit, when } from "./dom.js";
import { log } from "./store.js";

const LATE = 15 * 60 * 1000;            // opened this soon after the time: still worth saying

export const canNotify = () => "Notification" in window;
export const permission = () => (canNotify() ? Notification.permission : "unsupported");
export async function askPermission() {
  if (!canNotify() || Notification.permission !== "default") return permission();
  try { return await Notification.requestPermission(); } catch { return permission(); }
}

async function check() {
  const now = Date.now();
  const due = (await db.all("reminders")).filter(r => r.state === "scheduled" && r.at <= now);
  for (const r of due) {
    const late = now - r.at;
    if (late > LATE) {
      await db.put("reminders", { ...r, state: "missed", resolvedAt: now });
      await log("reminder", `Missed: “${r.title}” was due ${when(r.at)}, and Roxan was not open.`, r.roomId);
      emit("reminders");
      emit("toast", { text: `${r.title} (due ${when(r.at)}, while Roxan was closed)`, sub: "Missed", tone: "missed" });
      continue;
    }
    await db.put("reminders", { ...r, state: "fired", resolvedAt: now });
    await log("reminder", `Reminded you: “${r.title}”.`, r.roomId);
    emit("reminders");
    emit("toast", { text: r.title, tone: "reminder", sub: late > 60_000 ? `Due ${when(r.at)}` : "Reminder" });
    if (permission() === "granted") { try { new Notification(r.title, { body: "Reminder from Roxan", tag: r.id }); } catch { /* the page toast still showed */ } }
  }
}

export function start() {
  check();
  setInterval(check, 15_000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
}
