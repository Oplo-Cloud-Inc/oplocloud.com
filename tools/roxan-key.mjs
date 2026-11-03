#!/usr/bin/env node
/* Puts one of Roxan's API keys into the live Worker without the key ever being on a command line, in a file, in your
   shell history or on the screen.

       node tools/roxan-key.mjs [NAME]       NAME is BROWSERBASE_API_KEY, or E2B_API_KEY or ROXAN_MODEL_KEY

   You paste the key at a prompt that shows nothing. A Browserbase key is tried first with the calls Roxan itself will make
   (a read-only list of sessions, one search, one page), and nothing changes if the service turns it down. Then you type
   yes, and the key goes to `wrangler secret put` on its standard input, which stores it encrypted on Cloudflare. No copy is
   kept here: this folder is synced by Dropbox, which uploads dot-files too.

   A key that has been pasted into a chat is not secret any more. Make a new one in the service's dashboard and put that one in here.
   For trying it without a service: BROWSERBASE_URL points the checks elsewhere, ROXAN_KEY_WRANGLER replaces `npx --yes wrangler`. */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import * as browser from "../worker/agent/browser.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NAMES = ["BROWSERBASE_API_KEY", "E2B_API_KEY", "ROXAN_MODEL_KEY"];
const name = process.argv[2] || "BROWSERBASE_API_KEY";
const die = m => { console.error(m); process.exit(1); };
if (process.argv.length > 3 || !NAMES.includes(name)) die(`Usage: node tools/roxan-key.mjs [${NAMES.join(" | ")}]`);

// Not a terminal (the tests, or a pipe): the first line is the key and the second the answer.
const piped = process.stdin.isTTY ? null : (() => { try { return fs.readFileSync(0, "utf8").split("\n"); } catch { return []; } })();
const next = q => { process.stdout.write(`${q}\n`); return Promise.resolve((piped.shift() ?? "").trim()); };

const ask = q => piped ? next(q) : new Promise(ok => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, a => { rl.close(); ok(a.trim()); });
});

// Read a line with nothing echoed. Ctrl-C quits.
const secret = q => piped ? next(q) : new Promise((ok, no) => {
  const { stdin } = process;
  let s = "";
  stdin.setRawMode(true);                  // before the prompt is shown, so a fast paste can never be echoed
  stdin.setEncoding("utf8");
  stdin.resume();
  process.stdout.write(q);
  const end = () => { stdin.off("data", on); stdin.setRawMode(false); stdin.pause(); process.stdout.write("\n"); };
  const on = chunk => {
    for (const c of chunk) {
      if (c === "\u0003") { end(); return no(new Error("Stopped. Nothing was changed.")); }
      if (c === "\r" || c === "\n") { end(); return ok(s.trim()); }
      if (c === "\u007f" || c === "\b") s = s.slice(0, -1);
      else if (c >= " ") s += c;
    }
  };
  stdin.on("data", on);
});

// The same calls Roxan makes, so a key that passes here works there. Only the auth check stops the run.
async function tryBrowserbase(key) {
  const env = { BROWSERBASE_API_KEY: key, BROWSERBASE_URL: process.env.BROWSERBASE_URL };
  let status;
  try {
    const res = await fetch(`${(env.BROWSERBASE_URL || "https://api.browserbase.com").replace(/\/$/, "")}/v1/sessions`, { headers: { "x-bb-api-key": key }, signal: AbortSignal.timeout(15_000) });
    await res.body?.cancel();
    status = res.status;
  } catch { status = "unreachable"; }
  if (status === 401 || status === 403) die("Browserbase did not accept that key. Nothing was changed.");
  console.log(status === 200 ? "Browserbase accepted the key." : `Could not check the key (${status}).`);
  try { const r = await browser.search(env, "Browserbase"); console.log(r.length ? `Search works: ${r.length} results, the first from ${new URL(r[0].url).hostname}.` : "Search answered, with no results."); }
  catch (e) { console.log(`Search did not work: ${e.message}`); }
  try { const p = await browser.page(env, "https://example.com/"); console.log(`Pages work: ${p.text.length} characters of text from example.com.`); }
  catch (e) { console.log(`Pages did not work: ${e.message}`); }
}

const key = (await secret(`Paste the ${name} (nothing shows as you paste), then press Return: `).catch(e => die(e.message)))
  .replace(new RegExp(`^${name}=`), "").replace(/^["']|["']$/g, "");        // a line copied from an .env snippet works too
if (!/^[A-Za-z0-9._~+/=-]{16,300}$/.test(key)) die("That does not look like an API key (16 or more letters, digits and _ - . characters). Nothing was changed.");
console.log(`Got a ${key.length}-character key ending …${key.slice(-4)}.`);

if (name === "BROWSERBASE_API_KEY") await tryBrowserbase(key);
else console.log("This key has no safe read-only check here, so it is not tried first.");

if ((await ask(`Add ${name} to the live Roxan (Worker oplo-roxan, production)? Type yes to do it, anything else to stop: `)).toLowerCase() !== "yes") die("Stopped. Nothing was changed.");

const [cmd, ...pre] = (process.env.ROXAN_KEY_WRANGLER || "npx --yes wrangler").split(" ");
const code = await new Promise(done => {
  const p = spawn(cmd, [...pre, "secret", "put", name, "-c", path.join(ROOT, "wrangler.roxan.toml"), "--env", "production"], { cwd: ROOT, stdio: ["pipe", "inherit", "inherit"] });
  p.on("error", () => done(-1));
  p.stdin.on("error", () => {});
  p.stdin.end(key);                       // on its standard input: the arguments of a program can be listed by anyone on this computer
  p.on("close", done);
});
if (code !== 0) die(`wrangler did not take it (exit ${code}). Read the lines above; nothing else was changed.`);
console.log(`Done: ${name} is set on the live Roxan, stored encrypted on Cloudflare. No copy was kept here.`);
