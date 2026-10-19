// A circular reaches the people it is for, and the office can see who has opened it. Local only: needs the demo
// school (seed-demo-school.mjs, then seed-sfhs-full.mjs), its administrator in CRED, and the guardian of a child in
// X-C in GUARDIAN (both JSON { email, password }).
//   API=http://127.0.0.1:8787/api/v1 ORIGIN=http://127.0.0.1:8123 CRED=admin.json GUARDIAN=family.json node scripts/prove-circulars.mjs
import fs from "node:fs";
import { person, step, assert, refused, cred, RUN } from "./lib-prove.mjs";

const admin = person("admin"), family = person("family"), X = {};
const g = JSON.parse(fs.readFileSync(process.env.GUARDIAN));
const inbox = async (who) => (await who.get("/inbox?box=inbox")).notices || (await who.get("/inbox?box=inbox")).items || [];

try {
  await step("a circular for one class, to families: it reaches that class's families and no others", async () => {
    await admin.login(cred().email, cred().password); await family.login(g.email, g.password);
    const r = await admin.post("/items", { kind: "form", title: "Class X-C picnic " + RUN, status: "open", data: { body: "Bring a packed lunch.", audience: "families", classes: "X-C", category: "Event" } });
    X.item = r.item;
    const reach = await admin.get(`/items/${X.item.id}/reach`);
    assert.ok(reach.sent > 0 && reach.sent <= 26, "only X-C's families, not the school's: " + reach.sent);
    assert.equal(reach.read, 0); assert.equal(reach.groups.families.sent, reach.sent); assert.equal(reach.groups.staff.sent, 0);
    X.sent = reach.sent;
  });

  await step("the family sees it, opens it, and the office sees it was opened", async () => {
    const list = await inbox(family);
    const mine = list.find((n) => (n.title || "").includes("picnic " + RUN));
    assert.ok(mine, "the family's inbox has the circular");
    await family.post("/inbox/read", { ids: [mine.id] });
    const reach = await admin.get(`/items/${X.item.id}/reach`);
    assert.equal(reach.read, 1); assert.equal(reach.sent, X.sent); assert.equal(reach.groups.families.read, 1);
  });

  await step("a circular for staff does not reach a family", async () => {
    const r = (await admin.post("/items", { kind: "form", title: "Staff only " + RUN, status: "open", data: { body: "Marks by Friday.", audience: "staff" } })).item;
    X.staff = r;
    const reach = await admin.get(`/items/${r.id}/reach`);
    assert.ok(reach.sent > 0); assert.equal(reach.groups.families.sent, 0); assert.equal(reach.groups.students.sent, 0);
    assert.ok(!(await inbox(family)).some((n) => (n.title || "").includes("Staff only " + RUN)));
  });

  await step("a whole-school circular reaches more than one class; a family cannot ask who has read what", async () => {
    const r = (await admin.post("/items", { kind: "form", title: "Whole school " + RUN, status: "open", data: { body: "Winter timings.", audience: "everyone" } })).item;
    X.all = r;
    assert.ok((await admin.get(`/items/${r.id}/reach`)).sent > X.sent * 2, "the whole school is more than one class");
    refused(await family.try("GET", `/items/${r.id}/reach`), 403);
  });
} finally {
  for (const k of ["item", "staff", "all"]) if (X[k]) await admin.del(`/items/${X[k].id}`).catch(() => {});
}
