/* A static file server for previewing the site locally. Nothing here ships. */
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = "/Users/saswatjimac/Library/CloudStorage/Dropbox/oplocloud.com";
// 8123 unless a port is given, so a second session can preview beside a first.
const PORT = Number(process.env.PORT || process.argv[2] || 8123);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".ico": "image/x-icon", ".webp": "image/webp" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  // The app's role addresses, answered from the app's own files the way the
  // production Worker answers them (worker/index.js).
  if (/^\/learn\/(admin|teacher|student)$/.test(p)) {
    res.writeHead(308, { Location: p + "/" + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "") }).end();
    return;
  }
  const place = /^\/learn\/(admin|teacher|student)\//.test(p);
  p = p.replace(/^\/learn\/(admin|teacher|student)(?=\/)/, "/learn");
  if (p.endsWith("/")) p += "index.html";
  // A place inside the app (/learn/student/Science/Biology) is the app, as the
  // production Worker answers it; a missing file with an extension stays 404.
  if (place && !/\.[A-Za-z0-9]{1,8}$/.test(p) && !fs.existsSync(path.join(ROOT, p))) p = "/learn/index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found: " + p); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
                         "Cache-Control": "no-store" });
    res.end(buf);
  });
}).listen(PORT, () => console.log("serving " + ROOT + " on http://localhost:" + PORT));
