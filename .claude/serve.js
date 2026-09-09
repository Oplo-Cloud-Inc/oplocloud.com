/* A static file server for previewing the site locally. Nothing here ships. */
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = "/Users/saswatjimac/Library/CloudStorage/Dropbox/oplocloud.com";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".ico": "image/x-icon", ".webp": "image/webp" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found: " + p); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
                         "Cache-Control": "no-store" });
    res.end(buf);
  });
}).listen(8123, () => console.log("serving " + ROOT + " on http://localhost:8123"));
