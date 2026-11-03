/* tools/roxan-key.mjs, the way a person adds an API key to the live Roxan: against a stand-in for the browser service
   and a stand-in for wrangler. What matters is that the key reaches wrangler on its standard input and nowhere else, never
   shows in what the tool prints, and that nothing is changed unless the service accepts it and the person types yes. */
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("../../tools/roxan-key.mjs", import.meta.url));
const ROOT = path.dirname(path.dirname(SCRIPT));
const GOOD = "bb_test_0123456789abcdef";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "roxan-key-"));
const record = path.join(dir, "wrangler.json");
const fake = path.join(dir, "wrangler.mjs");
fs.writeFileSync(fake, `import fs from "node:fs";
let stdin = ""; for await (const c of process.stdin) stdin += c;
fs.writeFileSync(${JSON.stringify(record)}, JSON.stringify({ args: process.argv.slice(2), stdin }));
process.exit(Number(process.env.FAKE_EXIT || 0));
`);
after(() => fs.rmSync(dir, { recursive: true, force: true }));

function service() {
  const seen = [];
  const server = http.createServer((req, res) => {
    seen.push({ method: req.method, path: req.url, key: req.headers["x-bb-api-key"] });
    if (req.headers["x-bb-api-key"] !== GOOD) return res.writeHead(401).end("{}");
    res.setHeader("content-type", "application/json");
    if (req.url === "/v1/search") return res.end(JSON.stringify({ results: [{ id: "1", url: "https://a.example/x", title: "A" }] }));
    if (req.url === "/v1/fetch") return res.end(JSON.stringify({ statusCode: 200, content: "# Example\n\nText.", contentType: "text/html", headers: {}, encoding: "utf-8" }));
    res.end("[]");
  });
  return new Promise(ok => server.listen(0, "127.0.0.1", () => ok({ seen, url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })));
}

// Runs the tool with `lines` on its standard input (the key, then the answer). Resolves with what it printed and what wrangler got.
function run(args, lines, env = {}) {
  fs.rmSync(record, { force: true });
  return new Promise(done => {
    const p = spawn(process.execPath, [SCRIPT, ...args], { env: { ...process.env, ROXAN_KEY_WRANGLER: `${process.execPath} ${fake}`, ...env }, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    p.stdout.on("data", d => (out += d));
    p.stderr.on("data", d => (out += d));
    p.stdin.end(lines.join("\n") + "\n");
    p.on("close", code => done({ code, out, wrangler: fs.existsSync(record) ? JSON.parse(fs.readFileSync(record, "utf8")) : null }));
  });
}

test("roxan-key: a key the service accepts goes to wrangler on its standard input and is never printed", async () => {
  const svc = await service();
  try {
    const r = await run([], [GOOD, "yes"], { BROWSERBASE_URL: svc.url });
    assert.equal(r.code, 0, r.out);
    assert.deepEqual(r.wrangler.args, ["secret", "put", "BROWSERBASE_API_KEY", "-c", path.join(ROOT, "wrangler.roxan.toml"), "--env", "production"]);
    assert.equal(r.wrangler.stdin, GOOD, "exactly the key, no newline");
    assert.ok(!r.out.includes(GOOD), "the key is not in anything the tool prints");
    assert.match(r.out, /Got a 24-character key ending …cdef/);
    assert.match(r.out, /Browserbase accepted the key\./);
    assert.match(r.out, /Search works: 1 results, the first from a\.example\./);
    assert.match(r.out, /Pages work: \d+ characters of text/);
    assert.match(r.out, /Done: BROWSERBASE_API_KEY is set on the live Roxan/);
    assert.deepEqual(svc.seen.map(s => `${s.method} ${s.path}`), ["GET /v1/sessions", "POST /v1/search", "POST /v1/fetch"]);
    assert.ok(svc.seen.every(s => s.key === GOOD), "the key travels only in the header");
  } finally { svc.close(); }
});

test("roxan-key: a key the service turns down changes nothing, and neither does anything but yes", async () => {
  const svc = await service();
  try {
    const bad = "bb_test_WRONGWRONGWRONG";
    const r = await run([], [bad, "yes"], { BROWSERBASE_URL: svc.url });
    assert.equal(r.code, 1);
    assert.equal(r.wrangler, null, "wrangler was not run");
    assert.match(r.out, /did not accept that key\. Nothing was changed\./);
    assert.ok(!r.out.includes(bad));

    for (const answer of ["no", "y", ""]) {
      const n = await run([], [GOOD, answer], { BROWSERBASE_URL: svc.url });
      assert.equal(n.code, 1, `"${answer}"`);
      assert.equal(n.wrangler, null);
      assert.match(n.out, /Stopped\. Nothing was changed\./);
    }
  } finally { svc.close(); }
});

test("roxan-key: something that is not a key is turned away before the service is asked", async () => {
  const svc = await service();
  try {
    for (const junk of ["short", "has spaces in it which is not a key", "", "bb_test_a;rm -rf ~;aaaaaaaa"]) {
      const r = await run([], [junk, "yes"], { BROWSERBASE_URL: svc.url });
      assert.equal(r.code, 1, junk);
      assert.equal(r.wrangler, null);
      assert.match(r.out, /does not look like an API key/);
    }
    assert.equal(svc.seen.length, 0);
  } finally { svc.close(); }
});

test("roxan-key: a line copied from an .env snippet works, and the other keys are stored without being tried", async () => {
  const svc = await service();
  try {
    const r = await run([], [`BROWSERBASE_API_KEY="${GOOD}"`, "yes"], { BROWSERBASE_URL: svc.url });
    assert.equal(r.code, 0, r.out);
    assert.equal(r.wrangler.stdin, GOOD);

    svc.seen.length = 0;
    const e = await run(["E2B_API_KEY"], ["e2b_0123456789abcdef", "yes"], { BROWSERBASE_URL: svc.url });
    assert.equal(e.code, 0, e.out);
    assert.deepEqual(e.wrangler.args.slice(0, 3), ["secret", "put", "E2B_API_KEY"]);
    assert.equal(e.wrangler.stdin, "e2b_0123456789abcdef");
    assert.match(e.out, /not tried first/);
    assert.equal(svc.seen.length, 0);
  } finally { svc.close(); }
});

test("roxan-key: an unknown name, a service that cannot be reached and a wrangler that fails are each said plainly", async () => {
  const u = await run(["SOMETHING_ELSE"], [GOOD, "yes"]);
  assert.equal(u.code, 1);
  assert.match(u.out, /Usage: node tools\/roxan-key\.mjs/);
  assert.equal(u.wrangler, null);

  const down = await run([], [GOOD, "yes"], { BROWSERBASE_URL: "http://127.0.0.1:9" });
  assert.equal(down.code, 0, "an unreachable service is a warning; the person still decides");
  assert.match(down.out, /Could not check the key \(unreachable\)/);
  assert.equal(down.wrangler.stdin, GOOD);

  const svc = await service();
  try {
    const f = await run([], [GOOD, "yes"], { BROWSERBASE_URL: svc.url, FAKE_EXIT: "1" });
    assert.equal(f.code, 1);
    assert.match(f.out, /wrangler did not take it \(exit 1\)/);
    assert.ok(!f.out.includes(GOOD));
  } finally { svc.close(); }
});
