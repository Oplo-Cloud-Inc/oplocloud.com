/* ==========================================================================
   Average daily attendance, from the periods a student was in.

   A student's day is worth a whole day, half a day or nothing, by how many
   minutes of it they were present for. The school sets the minutes for a
   whole day and, if it counts half days at all, for a half. A minimum day
   needs no rule of its own: there are not enough minutes in it for a whole
   day, so the most it can be worth is a half, and a student who was there for
   all of it is given that.

   What counts as present follows the generic rate: present, tardy and excused
   marks are in; absent is out. A day nobody took roll for is a day nobody was
   marked present, which is like an absence, and the teachers are told that
   plainly in Settings.

   Where a school has set no minutes, or its periods have no times, the day is
   a whole day if the student was marked in at all in any course, and nothing
   otherwise.
   ========================================================================== */

const IN = new Set(["present", "tardy", "excused"]);
const r1 = (n) => Math.round(n * 10) / 10;

/* days:        [{ day, minutes: Map(label -> minutes), minimum: boolean }]  school days only
   sectionOf:   Map(courseId -> [period labels])
   enrolled:    Map(accountId -> [{ courseId, joined }])  joined is a time in ms
   marks:       Map("account|course|day" -> status)
   kindOf:      status -> kind */
export function adaFor({ days, sectionOf, enrolled, marks, kindOf, full, half }) {
  const out = [];
  let sumEnrolled = 0, sumPresent = 0;
  for (const d of days) {
    const end = Date.parse(d.day + "T00:00:00Z") + 86400000;
    let enrol = 0, present = 0;
    for (const [acct, memberships] of enrolled) {
      const mine = memberships.filter((m) => !m.joined || m.joined < end);
      if (!mine.length) continue;
      enrol++;
      let possible = 0, got = 0, any = false, anyMeeting = false;
      for (const m of mine) {
        const labels = sectionOf.get(m.courseId) || [];
        let minutes = 0, meets = true;
        if (labels.length) {
          const on = labels.filter((l) => d.minutes.has(l));
          meets = on.length > 0;
          minutes = on.reduce((n, l) => n + (d.minutes.get(l) || 0), 0);
        }
        if (!meets) continue;
        anyMeeting = true;
        const status = marks.get(acct + "|" + m.courseId + "|" + d.day);
        const inRoom = status != null && IN.has(kindOf(status));
        possible += minutes;
        if (inRoom) { any = true; got += minutes; }
      }
      if (!anyMeeting) { enrol--; continue; }          // nothing of theirs meets today: not part of today's count
      let value;
      if (full == null || possible === 0) value = any ? 1 : 0;
      else if (got >= full) value = 1;
      else if (half != null && got >= half) value = 0.5;
      else if (d.minimum && got >= possible - 0.5 && got > 0) value = 0.5;
      else value = 0;
      present += value;
    }
    out.push({ day: d.day, enrolled: enrol, present: r1(present), ada: enrol ? r1(present / enrol * 100) : null, minimum: !!d.minimum });
    sumEnrolled += enrol; sumPresent += present;
  }
  return { days: out, total: { enrolled: sumEnrolled, present: r1(sumPresent), ada: sumEnrolled ? r1(sumPresent / sumEnrolled * 100) : null, schoolDays: out.length } };
}
