// The school profile's rules, with no database: node scripts/test-profile.mjs
import assert from "node:assert/strict";
import * as P from "../src/services/profile.js";

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("  ok  " + name); };
const fail = (m, f) => { const e = new Error(m); e.field = f; throw e; };

t("a school nobody touched is the US school it always was", () => {
  const p = P.profileOf({ region: "US" });
  assert.equal(p.timezone, "America/New_York"); assert.equal(p.locale, "en-US"); assert.equal(p.currency, "USD");
  assert.equal(p.yearStartMonth, 8); assert.equal(p.levelWord, "Grade"); assert.deepEqual(p.boards, []); assert.deepEqual(p.languages, ["en"]);
  assert.equal(P.profileOf(null).region, "US"); assert.equal(P.profileOf({ region: "ZZ" }).region, "US");
});
t("setting the country once makes the school speak it", () => {
  const p = P.profileOf({ region: "IN", boards: '["CISCE","CBSE","BOGUS"]', state_code: "CH", languages: '["en","pa"]', profile_set_at: 5 });
  assert.equal(p.timezone, "Asia/Kolkata"); assert.equal(p.locale, "en-IN"); assert.equal(p.currency, "INR"); assert.equal(p.phone, "+91");
  assert.equal(p.yearStartMonth, 4); assert.equal(p.levelWord, "Class"); assert.equal(p.lakh, true);
  assert.deepEqual(p.boards, ["CISCE", "CBSE"], "an unknown board is dropped, not trusted"); assert.equal(p.stateCode, "CH"); assert.deepEqual(p.languages, ["en", "pa"]); assert.equal(p.set, true);
});
t("a column the school set beats the country", () => {
  const p = P.profileOf({ region: "IN", timezone: "Asia/Dubai", year_start_month: 6, locale: "hi-IN" });
  assert.equal(p.timezone, "Asia/Dubai"); assert.equal(p.yearStartMonth, 6); assert.equal(p.locale, "hi-IN");
});
t("garbage JSON in a list column is an empty list", () => {
  assert.deepEqual(P.profileOf({ region: "IN", boards: "not json" }).boards, []);
  assert.deepEqual(P.profileOf({ region: "IN", languages: "{}" }).languages, ["en"]);
});
t("only what is named is cleaned, and mistakes are named", () => {
  assert.deepEqual(P.cleanProfile({ region: "IN" }, fail), { region: "IN" });
  assert.deepEqual(P.cleanProfile({ boards: ["CBSE", "CBSE", "IB"] }, fail), { boards: ["CBSE", "IB"] });
  assert.deepEqual(P.cleanProfile({ stateCode: "" }, fail), { stateCode: null });
  assert.deepEqual(P.cleanProfile({ timezone: null, yearStartMonth: null }, fail), { timezone: null, yearStartMonth: null });
  for (const [bad, field] of [[{ region: "XX" }, "region"], [{ boards: ["FOO"] }, "boards"], [{ boards: "CBSE" }, "boards"], [{ stateCode: "ZZ" }, "stateCode"],
    [{ languages: [] }, "languages"], [{ languages: ["xx"] }, "languages"], [{ timezone: "Mars/Olympus" }, "timezone"], [{ locale: "not a locale!" }, "locale"],
    [{ yearStartMonth: 13 }, "yearStartMonth"], [{ yearStartMonth: 4.5 }, "yearStartMonth"]]) {
    assert.throws(() => P.cleanProfile(bad, fail), (e) => e.field === field, JSON.stringify(bad));
  }
});
t("a school year starts in the school's month", () => {
  assert.equal(P.yearFor("2026-04-01", 4), "2026-2027"); assert.equal(P.yearFor("2027-03-31", 4), "2026-2027");
  assert.equal(P.yearFor("2026-07-15", 8), "2025-2026"); assert.equal(P.yearFor("2026-08-01", 8), "2026-2027");
});
t("the school's day is the school's, not the server's", () => {
  const at = Date.UTC(2026, 0, 1, 20, 0);   // 20:00 UTC on 1 Jan = 01:30 on 2 Jan in Kolkata, 15:00 on 1 Jan in New York
  assert.equal(P.dayIn("Asia/Kolkata", at), "2026-01-02"); assert.equal(P.dayIn("America/New_York", at), "2026-01-01");
});
t("every state has a name and the list is the full 36", () => { assert.equal(Object.keys(P.STATES_IN).length, 36); });
console.log(n + " checks");
