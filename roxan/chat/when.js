/* How a schedule reads to a person. The page and the Worker share this, so the
   words on a routine's row and on an approval card are always the same ones. */

export const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const list = a => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a.at(-1));

export function describe(s, tz = "UTC") {
  if (s.kind === "every") return s.hours === 1 ? "Every hour" : `Every ${s.hours} hours`;
  if (s.kind === "once") {
    const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    return "Once, " + f.format(new Date(s.at)).replace(",", " at").replace(/\s+/g, " ");
  }
  const days = s.days || [];
  const who = !days.length ? "Every day" : days.join() === "1,2,3,4,5" ? "Weekdays" : days.join() === "0,6" ? "Weekends" : list(days.map(d => WD[d]));
  return `${who} at ${s.time}`;
}
