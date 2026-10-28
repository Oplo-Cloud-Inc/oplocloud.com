// A static file server for the Learn app against a local API: node api/scripts/serve-learn.mjs [port]
//   ROOT      the repository to serve (default: this one)
//   API_PORT  where the API listens; learn/api.js is told, because it names :8787 and another process may hold that
// It answers the app's role addresses (/learn/admin/…) the way the production Worker does, with the app's own page.
// The browser suites (test-shell, test-students) and tools/ci-browser.sh use it. Nothing here is published.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const ROOT = path.resolve(process.env.ROOT || new URL("../..", import.meta.url).pathname);
const PORT = Number(process.argv[2] || process.env.PORT || 8153);
const API_PORT = process.env.API_PORT || "8787";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".webp": "image/webp", ".webmanifest": "application/manifest+json" };

const isFile = (f) => { try { return fs.statSync(f).isFile(); } catch { return false; } };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (/^\/learn\/(admin|teacher|student)$/.test(p)) { res.writeHead(308, { Location: p + "/" + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "") }).end(); return; }
  const place = /^\/learn\/(admin|teacher|student)\//.test(p);
  p = p.replace(/^\/learn\/(admin|teacher|student)(?=\/)/, "/learn");
  if (p.endsWith("/")) p += "index.html";
  if (place && !/\.[A-Za-z0-9]{1,8}$/.test(p) && !isFile(path.join(ROOT, p))) p = "/learn/index.html";   // a folder (learn/settings/) is not a page
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found: " + p); return; }
    if (p === "/learn/api.js") buf = Buffer.from(String(buf).replace('":8787/api/v1"', '":' + API_PORT + '/api/v1"'));
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  });
}).listen(PORT, () => console.log("serving " + ROOT + " on http://localhost:" + PORT + " (api " + API_PORT + ")"));
