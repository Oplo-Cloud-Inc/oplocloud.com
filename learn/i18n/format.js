/* ==========================================================================
   Oplo Learn — dates, numbers and money, in one place.

   The audit found four date navigators and three ways of writing a date. This
   is the only module that formats one. A screen never calls toLocaleString or
   builds "dd/mm/yyyy" by hand; it asks OL.fmt, which writes what the school's
   country writes:

     India   26/10/2026   Monday, 26 October 2026   8:55 am   ₹1,23,456.00   12,34,567
     US      10/26/2026   Monday, October 26, 2026  8:55 am   $123,456.00     1,234,567

   Two kinds of "date" are kept apart, because mixing them moves a birthday by
   a day. A calendar date is the text "2026-10-26": it has no time and no zone
   and is never shifted. An instant is a Date or milliseconds: it is turned into
   the school's calendar date, in the school's zone (Asia/Kolkata), whatever the
   device says. Stored values are always ISO; display and typing follow the
   school.

   Money is a number of rupees; moneyPaise() takes the integer paise the
   finance tables keep. Percentages carry no decimals on Today and one in
   analytics, which is the caller's choice (the second argument).
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL = window.OL || {};

  var cfg = { region: "IN", locale: "en-IN", timezone: "Asia/Kolkata", currency: "INR", hour12: true, weekStart: 1 };
  var MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  function pad(n, w) { n = String(n); while (n.length < (w || 2)) n = "0" + n; return n; }

  /* ------------------------------------------------------------ Calendar
     Pure arithmetic on "YYYY-MM-DD", through UTC so a daylight-saving change
     on the device can never add or lose an hour. */
  function parse(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  }
  function utc(p) { return Date.UTC(p.y, p.m - 1, p.d); }
  function fromUtc(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
  }
  function addDays(iso, n) { var p = parse(iso); return p ? fromUtc(utc(p) + n * 86400000) : ""; }
  function diffDays(a, b) { var pa = parse(a), pb = parse(b); return pa && pb ? Math.round((utc(pa) - utc(pb)) / 86400000) : 0; }
  /* 0 = Monday … 6 = Sunday, because the school's week starts on Monday. */
  function dow(iso) { var p = parse(iso); return p ? (new Date(utc(p)).getUTCDay() + 6) % 7 : 0; }
  function daysIn(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function addMonths(iso, n) {
    var p = parse(iso); if (!p) return "";
    var t = p.y * 12 + (p.m - 1) + n, y = Math.floor(t / 12), m = t % 12 + 1;
    return y + "-" + pad(m) + "-" + pad(Math.min(p.d, daysIn(y, m)));
  }
  function weekStart(iso, start) {                   // the Monday (or the configured first day) on or before iso
    var first = start == null ? cfg.weekStart - 1 : start;       // cfg.weekStart: 1 = Monday, 0 = Sunday → index 0 / 6
    if (first < 0) first = 6;
    return addDays(iso, -((dow(iso) - first + 7) % 7));
  }
  /* The six rows a month grid draws, as ISO strings, the first day of the week first. */
  function monthGrid(y, m) {
    var lead = (dow(y + "-" + pad(m) + "-01") - (cfg.weekStart === 0 ? 6 : 0) + 7) % 7;
    var start = addDays(y + "-" + pad(m) + "-01", -lead), rows = [];
    for (var r = 0; r < 6; r++) {
      var row = [];
      for (var c = 0; c < 7; c++) row.push(addDays(start, r * 7 + c));
      rows.push(row);
    }
    return rows;
  }

  /* ---------------------------------------------------------- To a calendar date */
  /* A time written with no zone ("2026-10-12T09:30", what the app sends for a
     booking) is the school's own wall clock already; it is read as written. */
  function wall(v) {
    var m = typeof v === "string" ? /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(v) : null;
    return m ? { iso: m[1], h: +m[2], m: +m[3] } : null;
  }
  /* Whatever the caller has — "2026-10-26", a Date, milliseconds — as "YYYY-MM-DD" in the school's zone. */
  function iso(v) {
    if (v == null || v === "") return "";
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    var w = wall(v);
    if (w) return w.iso;
    var d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", { timeZone: cfg.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  }
  function today() { return iso(new Date()); }

  function hm(v) {                                      // h and m of an instant in the school's zone
    var w = wall(v);
    if (w) return { h: w.h, m: w.m };
    var d = v instanceof Date ? v : new Date(v);
    var h = 0, m = 0;
    new Intl.DateTimeFormat("en-GB", { timeZone: cfg.timezone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d).forEach(function (p) {
      if (p.type === "hour") h = +p.value % 24;
      if (p.type === "minute") m = +p.value;
    });
    return { h: h, m: m };
  }

  /* -------------------------------------------------------------- Display */
  function names(kind) {
    // Intl for the month and weekday names so Hindi reads in Hindi; the English table is the fallback.
    var loc = OL.i18n && OL.i18n.locale ? OL.i18n.locale() : cfg.locale;
    var out = [];
    try {
      if (kind === "month") for (var i = 0; i < 12; i++) out.push(new Intl.DateTimeFormat(loc, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, i, 15))));
      else for (var j = 0; j < 7; j++) out.push(new Intl.DateTimeFormat(loc, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 9, 26 + j))));
    } catch (e) { out = kind === "month" ? MONTHS_EN : DAYS_EN; }
    return out;
  }
  function short(s) { return s.length > 4 && /^[A-Za-z]+$/.test(s) ? s.slice(0, 3) : s; }

  function date(v) {                                    // 26/10/2026 — or 10/26/2026 for a US school
    var p = parse(iso(v));
    if (!p) return "";
    return cfg.region === "US" ? pad(p.m) + "/" + pad(p.d) + "/" + p.y : pad(p.d) + "/" + pad(p.m) + "/" + p.y;
  }
  function dateLong(v) {                                // Monday, 26 October 2026
    var s = iso(v), p = parse(s);
    if (!p) return "";
    var wd = names("weekday")[dow(s)], mo = names("month")[p.m - 1];
    return cfg.region === "US" ? wd + ", " + mo + " " + p.d + ", " + p.y : wd + ", " + p.d + " " + mo + " " + p.y;
  }
  function dateMed(v) {                                 // 26 Oct 2026
    var p = parse(iso(v));
    if (!p) return "";
    var mo = short(names("month")[p.m - 1]);
    return cfg.region === "US" ? mo + " " + p.d + ", " + p.y : p.d + " " + mo + " " + p.y;
  }
  function dateShort(v) {                               // 26 Oct
    var p = parse(iso(v));
    if (!p) return "";
    var mo = short(names("month")[p.m - 1]);
    return cfg.region === "US" ? mo + " " + p.d : p.d + " " + mo;
  }
  function monthYear(v) {                               // October 2026
    var p = parse(iso(v) || v);
    return p ? names("month")[p.m - 1] + " " + p.y : "";
  }
  function time(v) {                                    // 8:55 am, or 08:55 when the school keeps 24 hours
    if (v == null || v === "") return "";
    var t = typeof v === "string" && /^\d{1,2}:\d{2}$/.test(v) ? { h: +v.split(":")[0], m: +v.split(":")[1] } : hm(v);
    if (!cfg.hour12) return pad(t.h) + ":" + pad(t.m);
    return (t.h % 12 || 12) + ":" + pad(t.m) + " " + (t.h < 12 ? "am" : "pm");
  }
  function dateTime(v) { return v == null || v === "" ? "" : date(v) + " " + time(v); }
  function dateTimeLong(v) { return v == null || v === "" ? "" : dateLong(v) + ", " + time(v); }
  /* "8:52 am" today, "Yesterday 4:10 pm", else 26/10/2026 — the way a notification is dated. */
  function smart(v, words) {
    if (v == null || v === "") return "";
    words = words || {};
    var d = iso(v), t = today();
    if (d === t) return time(v);
    if (d === addDays(t, -1)) return (words.yesterday || "Yesterday") + " " + time(v);
    return date(v);
  }
  /* 2026-04-01 → "2026–27". */
  function yearLabel(startIso) {
    var p = parse(startIso);
    return p ? p.y + "–" + pad((p.y + 1) % 100) : "";
  }

  /* --------------------------------------------------------------- Numbers */
  function num(n, dp) {
    n = Number(n);
    if (!isFinite(n)) return "";
    return new Intl.NumberFormat(cfg.locale, { minimumFractionDigits: dp || 0, maximumFractionDigits: dp == null ? 20 : dp }).format(n);
  }
  function pct(n, dp) {
    n = Number(n);
    return isFinite(n) ? num(n, dp || 0) + "%" : "";
  }
  function money(amount, o) {
    var n = Number(amount);
    if (!isFinite(n)) return "";
    var whole = o && o.whole;
    return new Intl.NumberFormat(cfg.locale, { style: "currency", currency: cfg.currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(n);
  }
  function moneyPaise(p, o) { return money(Number(p) / 100, o); }
  function bytes(n) {
    n = Number(n) || 0;
    return n < 1024 ? n + " B" : n < 1048576 ? num(n / 1024, 0) + " KB" : num(n / 1048576, 1) + " MB";
  }

  /* ---------------------------------------------------------------- Typing */
  /* What a person typed, as an ISO date; null when it is not a date. Accepts
     26/10/2026, 26-10-2026, 26.10.2026 and 26/10/26 (a school year is never
     two centuries). Order follows the school: a US school types month first. */
  function parseDate(s) {
    var m = /^\s*(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})\s*$/.exec(String(s || ""));
    if (!m) return /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) && parse(s) ? s : null;
    var a = +m[1], b = +m[2], y = +m[3];
    if (y < 100) y += 2000;
    var d = cfg.region === "US" ? b : a, mo = cfg.region === "US" ? a : b;
    if (mo < 1 || mo > 12 || d < 1 || d > daysIn(y, mo)) return null;
    return y + "-" + pad(mo) + "-" + pad(d);
  }
  function datePlaceholder() { return cfg.region === "US" ? "mm/dd/yyyy" : "dd/mm/yyyy"; }

  /* +91 98765 43210. Ten digits starting 6–9, with or without a leading 0, 91 or +91. */
  function digits(s) { return String(s || "").replace(/\D+/g, ""); }
  function isPhone(s) {
    var d = digits(s);
    if (d.length === 12 && d.slice(0, 2) === "91") d = d.slice(2);
    else if (d.length === 11 && d[0] === "0") d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d);
  }
  function phone(s) {
    var d = digits(s);
    if (d.length === 12 && d.slice(0, 2) === "91") d = d.slice(2);
    else if (d.length === 11 && d[0] === "0") d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? "+91 " + d.slice(0, 5) + " " + d.slice(5) : String(s || "");
  }
  /* An Aadhaar number is never shown whole. */
  function maskAadhaar(s) { var d = digits(s); return d.length >= 4 ? "XXXX XXXX " + d.slice(-4) : ""; }

  OL.fmt = {
    config: function (profile) {
      if (!profile) return cfg;
      var us = profile.region === "US";
      cfg = {
        region: us ? "US" : "IN",
        locale: profile.locale || (us ? "en-US" : "en-IN"),
        timezone: profile.timezone || (us ? "America/New_York" : "Asia/Kolkata"),
        currency: profile.currency || (us ? "USD" : "INR"),
        hour12: profile.hour12 !== false,
        weekStart: profile.weekStart != null ? profile.weekStart : (us ? 0 : 1)
      };
      if (OL.i18n && OL.i18n.setCountry) OL.i18n.setCountry(cfg.region);
      return cfg;
    },
    current: function () { return cfg; },
    iso: iso, today: today, date: date, dateLong: dateLong, dateMed: dateMed, dateShort: dateShort, monthYear: monthYear,
    time: time, dateTime: dateTime, dateTimeLong: dateTimeLong, smart: smart, yearLabel: yearLabel,
    num: num, pct: pct, money: money, moneyPaise: moneyPaise, bytes: bytes,
    parseDate: parseDate, datePlaceholder: datePlaceholder,
    phone: phone, isPhone: isPhone, maskAadhaar: maskAadhaar,
    cal: { parse: parse, addDays: addDays, addMonths: addMonths, diffDays: diffDays, dow: dow, daysIn: daysIn, weekStart: weekStart, monthGrid: monthGrid, names: names }
  };
})();
