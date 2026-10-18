// The India playbook's school profile over HTTP, as the people who use it. Local only; needs the demo school's administrator.
//   API=http://127.0.0.1:8791/api/v1 ORIGIN=http://127.0.0.1:8130 CRED=/path/credentials.json node scripts/prove-school.mjs
import { person, step, steps, assert, refused, cred, RUN, PW } from "./lib-prove.mjs";

const admin = person("admin"), teacher = person("teacher"), anon = person("anon");
const ctx = {};

try {
  await step("an administrator and a teacher of the school", async () => {
    const c = cred();
    await admin.login(c.email, c.password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    const t = (await admin.post("/accounts", { email: `tia.sp${RUN}@s.test`, name: "Tia Teacher", password: PW, role: "teacher", orgId: ctx.org })).account;
    ctx.teacher = t;
    await teacher.login(t.email, PW);
  });

  await step("/me carries the school's profile, in the country's own terms", async () => {
    const o = (await admin.get("/me")).account.organizations[0];
    assert.equal(o.region, "IN"); assert.equal(o.profile.timezone, "Asia/Kolkata"); assert.equal(o.profile.currency, "INR");
    assert.equal(o.profile.yearStartMonth, 4); assert.equal(o.profile.levelWord, "Class");
  });

  await step("anyone in the school reads the profile and the choices; nobody outside does", async () => {
    const r = await teacher.get("/school/profile");
    assert.equal(r.profile.region, "IN"); assert.ok(r.options.boards.some((b) => b.code === "CBSE")); assert.equal(r.options.states.length, 36);
    refused(await anon.try("GET", "/school/profile"), 401);
  });

  await step("only an administrator changes it", async () => {
    refused(await teacher.try("PUT", "/school/profile", { boards: ["CBSE"] }), 403);
    refused(await anon.try("PUT", "/school/profile", { boards: ["CBSE"] }), 401);
  });

  await step("a campus may follow more than one board, and what is not named stays", async () => {
    const before = (await admin.get("/school/profile")).profile;
    const r = (await admin.put("/school/profile", { boards: ["CBSE", "CISCE", "CBSE"] })).profile;
    assert.deepEqual(r.boards, ["CBSE", "CISCE"]); assert.equal(r.region, "IN"); assert.equal(r.stateCode, before.stateCode); assert.equal(r.set, true);
    ctx.before = before;
  });

  await step("a mistake is named, and changes nothing", async () => {
    for (const [bad, field] of [[{ region: "XX" }, "region"], [{ boards: ["NOPE"] }, "boards"], [{ stateCode: "ZZ" }, "stateCode"], [{ languages: [] }, "languages"],
      [{ timezone: "Mars/Base" }, "timezone"], [{ yearStartMonth: 0 }, "yearStartMonth"]]) {
      const r = await admin.try("PUT", "/school/profile", bad);
      refused(r, 400); assert.equal(r.body.error.field, field);
    }
    assert.deepEqual((await admin.get("/school/profile")).profile.boards, ["CBSE", "CISCE"]);
  });

  await step("the country is changeable, and a clearing falls back to the country's own", async () => {
    const us = (await admin.put("/school/profile", { region: "US" })).profile;
    assert.equal(us.timezone, "America/New_York"); assert.equal(us.levelWord, "Grade");
    const back = (await admin.put("/school/profile", { region: "IN", timezone: "Asia/Dubai" })).profile;
    assert.equal(back.timezone, "Asia/Dubai");
    const cleared = (await admin.put("/school/profile", { timezone: null })).profile;
    assert.equal(cleared.timezone, "Asia/Kolkata");
  });

  await step("restored: the demo school is left as it was found", async () => {
    const b = ctx.before;
    const r = (await admin.put("/school/profile", { boards: b.boards, stateCode: b.stateCode, languages: b.languages })).profile;
    assert.deepEqual(r.boards, b.boards); assert.equal(r.region, "IN");
  });
} catch { process.exitCode = 1; }
console.log(`\n${steps()} steps passed.`);
