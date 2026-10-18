/* ==========================================================================
   OEdu — what a school's country does to its screens.

   A school says its country once (Settings, School). From then on the
   ordinary screens speak it: dates as 17/10/2026, numbers as 12,34,567,
   money as ₹, the time in the school's zone, and a few words that differ
   (Class for Grade). There is no menu "for" a country.

   How it reaches every screen without editing each one: a screen that asks
   the browser to format a date or a number without naming a locale gets the
   school's. `use(profile)` is called once with the profile /me carries; for a
   US school it does nothing at all, so what a US school saw is what it sees.

   A time of day is shown in the school's zone, whatever the device says. A
   date alone is left in the device's own: a "day" built at local midnight
   would slip by one if it were moved to another zone's calendar.
   ========================================================================== */
window.OPLO_LOCALE = (function () {
  "use strict";

  var cur = null;                       // the profile in force; null = leave the browser alone
  var D = Date.prototype, N = Number.prototype;
  var tls = D.toLocaleString, tds = D.toLocaleDateString, tts = D.toLocaleTimeString, nls = N.toLocaleString;
  var patched = false;

  var TIME_KEYS = ["hour", "minute", "second", "timeStyle", "dayPeriod", "timeZoneName"];
  function hasTime(o) { return !!o && TIME_KEYS.some(function (k) { return o[k] !== undefined; }); }
  function withZone(o) {
    if (!cur || (o && o.timeZone)) return o;
    var out = {}, k;
    if (o) for (k in o) out[k] = o[k];
    out.timeZone = cur.timezone;
    return out;
  }

  function patch() {
    if (patched) return;
    patched = true;
    D.toLocaleDateString = function (l, o) {
      if (!cur) return tds.call(this, l, o);
      return tds.call(this, l == null ? cur.locale : l, hasTime(o) ? withZone(o) : o);
    };
    D.toLocaleTimeString = function (l, o) {
      if (!cur) return tts.call(this, l, o);
      return tts.call(this, l == null ? cur.locale : l, withZone(o));
    };
    D.toLocaleString = function (l, o) {
      if (!cur) return tls.call(this, l, o);
      // No fields named is date and time together; named fields with no time in them is a date.
      var dateOnly = o && Object.keys(o).length && !hasTime(o);
      return tls.call(this, l == null ? cur.locale : l, dateOnly ? o : withZone(o));
    };
    N.toLocaleString = function (l, o) {
      return nls.call(this, !cur || l != null ? l : cur.locale, o);
    };
  }

  /* The few words that differ. Whatever is not here is left as it is. */
  var WORDS = {
    IN: {
      "Grade": "Class", "Grades": "Classes", "grade": "class", "grades": "classes",
      "Courses": "Subjects", "Course": "Subject", "courses": "subjects", "course": "subject",
      "Sections": "Timetable", "Student 360": "Student profile"
    }
  };

  function use(profile) {
    cur = profile && profile.region && profile.region !== "US" ? profile : null;
    if (cur) patch();
    return cur;
  }

  function word(s) { var m = cur && WORDS[cur.region]; return m && m[s] ? m[s] : s; }

  function parts(v) {                    // YYYY-MM-DD, or a time in ms, to [y, m, d]
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return [v.slice(0, 4), v.slice(5, 7), v.slice(8, 10)];
    var d = new Date(v);
    if (isNaN(d.getTime())) return null;
    var f = new Intl.DateTimeFormat("en-CA", { timeZone: cur ? cur.timezone : undefined, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    return f.split("-");
  }
  /* 17/10/2026 for an Indian school, 10/17/2026 for a US one. */
  function dmy(v) {
    var p = parts(v);
    if (!p) return "";
    return cur && cur.region === "IN" ? p[2] + "/" + p[1] + "/" + p[0] : p[1] + "/" + p[2] + "/" + p[0];
  }
  var SYMBOL = { INR: "₹", USD: "$" };
  /* ₹12,34,567 / $1,234,567; whole numbers drop the paise. */
  function money(n, opts) {
    var p = cur || { currency: "USD", locale: "en-US" };
    var v = Number(n) || 0, whole = Math.round(v) === v && !(opts && opts.paise);
    return (SYMBOL[p.currency] || p.currency + " ") + nls.call(v, p.locale, { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
  }

  return { use: use, word: word, dmy: dmy, money: money, active: function () { return cur; } };
})();
