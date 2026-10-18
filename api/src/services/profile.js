/* ==========================================================================
   A school's profile.

   `organizations.region` is the country. What a country decides for a school
   (its time zone, how it writes a date and money, the month its year starts,
   what a year-level is called) is in REGIONS; what the school itself chose
   (its boards, its state, the languages its families read) is on the row. A
   column left null means "what the country says", so a school nobody has
   touched is the school it always was.

   Pure: no database, no clock. api/scripts/test-profile.mjs checks it.
   ========================================================================== */

export const REGIONS = {
  US: { name: "United States", locale: "en-US", timezone: "America/New_York", currency: "USD", yearStartMonth: 8, phone: "+1", levelWord: "Grade", lakh: false },
  IN: { name: "India",         locale: "en-IN", timezone: "Asia/Kolkata",    currency: "INR", yearStartMonth: 4, phone: "+91", levelWord: "Class", lakh: true }
};

/* The boards an Indian school may follow. A campus can run several, so a school
   keeps a list. The board's own rules (its grading, its terms) are set under
   Grading, not here: this only says which a school answers to. */
export const BOARDS = [
  { code: "CBSE",  name: "CBSE" },
  { code: "CISCE", name: "CISCE" },
  { code: "STATE", name: "State board" },
  { code: "IB",    name: "IB" },
  { code: "CAIE",  name: "Cambridge" },
  { code: "NIOS",  name: "NIOS" }
];

/* The languages a family's screens come in. Hindi and Punjabi first because the
   first schools are in Chandigarh and Punjab; more arrive as translations do. */
export const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi",   native: "हिन्दी" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" }
];

/* States and union territories, by the letters ISO 3166-2:IN gives them. */
export const STATES_IN = {
  AN: "Andaman and Nicobar Islands", AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar",
  CH: "Chandigarh", CG: "Chhattisgarh", DH: "Dadra and Nagar Haveli and Daman and Diu", DL: "Delhi", GA: "Goa",
  GJ: "Gujarat", HR: "Haryana", HP: "Himachal Pradesh", JK: "Jammu and Kashmir", JH: "Jharkhand", KA: "Karnataka",
  KL: "Kerala", LA: "Ladakh", LD: "Lakshadweep", MP: "Madhya Pradesh", MH: "Maharashtra", MN: "Manipur",
  ML: "Meghalaya", MZ: "Mizoram", NL: "Nagaland", OD: "Odisha", PY: "Puducherry", PB: "Punjab", RJ: "Rajasthan",
  SK: "Sikkim", TN: "Tamil Nadu", TS: "Telangana", TR: "Tripura", UP: "Uttar Pradesh", UK: "Uttarakhand", WB: "West Bengal"
};

const list = (s) => { try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; } };

/* What a school's screens and rules read. `org` is the organizations row. */
export function profileOf(org) {
  const region = org && REGIONS[org.region] ? org.region : "US";
  const d = REGIONS[region];
  const boards = list(org && org.boards).filter((b) => BOARDS.some((x) => x.code === b));
  const languages = list(org && org.languages).filter((l) => LANGUAGES.some((x) => x.code === l));
  return {
    region, country: d.name, currency: d.currency, phone: d.phone, levelWord: d.levelWord, lakh: d.lakh,
    locale: (org && org.locale) || d.locale,
    timezone: (org && org.timezone) || d.timezone,
    yearStartMonth: (org && org.year_start_month) || d.yearStartMonth,
    boards, stateCode: (org && org.state_code) || null,
    languages: languages.length ? languages : ["en"],
    set: !!(org && org.profile_set_at)
  };
}

/* The profile a person typed, checked. `fail(message, field)` throws; only what
   was named is returned, so a request that names one thing changes one thing. */
export function cleanProfile(src, fail) {
  const out = {};
  if (src.region !== undefined) {
    if (!REGIONS[src.region]) fail("Choose the country from the list.", "region");
    out.region = src.region;
  }
  if (src.boards !== undefined) {
    if (!Array.isArray(src.boards)) fail("Boards must be a list.", "boards");
    const bad = src.boards.find((b) => !BOARDS.some((x) => x.code === b));
    if (bad !== undefined) fail("That is not a board OEdu knows: " + String(bad).slice(0, 20) + ".", "boards");
    out.boards = [...new Set(src.boards)];
  }
  if (src.stateCode !== undefined) {
    if (src.stateCode !== null && src.stateCode !== "" && !STATES_IN[src.stateCode]) fail("Choose the state from the list.", "stateCode");
    out.stateCode = src.stateCode || null;
  }
  if (src.languages !== undefined) {
    if (!Array.isArray(src.languages) || !src.languages.length) fail("Choose at least one language.", "languages");
    const bad = src.languages.find((l) => !LANGUAGES.some((x) => x.code === l));
    if (bad !== undefined) fail("That is not a language OEdu offers yet: " + String(bad).slice(0, 10) + ".", "languages");
    out.languages = [...new Set(src.languages)];
  }
  if (src.timezone !== undefined) {
    if (src.timezone !== null && src.timezone !== "") {
      try { new Intl.DateTimeFormat("en", { timeZone: String(src.timezone) }); } catch { fail("That is not a time zone.", "timezone"); }
    }
    out.timezone = src.timezone || null;
  }
  if (src.locale !== undefined) {
    if (src.locale !== null && src.locale !== "") {
      try { Intl.getCanonicalLocales(String(src.locale)); } catch { fail("That is not a locale.", "locale"); }
    }
    out.locale = src.locale || null;
  }
  if (src.yearStartMonth !== undefined) {
    const m = src.yearStartMonth === null || src.yearStartMonth === "" ? null : Number(src.yearStartMonth);
    if (m !== null && !(Number.isInteger(m) && m >= 1 && m <= 12)) fail("The year starts in a month from 1 to 12.", "yearStartMonth");
    out.yearStartMonth = m;
  }
  return out;
}

/* The school year a day falls in, written 2026-2027, for a year that starts in
   `startMonth`. */
export function yearFor(ymd, startMonth) {
  const y = +ymd.slice(0, 4), m = +ymd.slice(5, 7);
  const start = m >= startMonth ? y : y - 1;
  return `${start}-${start + 1}`;
}

/* The calendar day, YYYY-MM-DD, in a zone, whatever the server's clock says. */
export function dayIn(timezone, ms) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(ms == null ? Date.now() : ms));
}
