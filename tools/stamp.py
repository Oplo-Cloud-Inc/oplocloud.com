#!/usr/bin/env python3
"""Fingerprint the Learn app's assets into their URLs.

A static host has no build step, so a browser will happily serve yesterday's
app.js for as long as its cache says it may. Stamping the content hash into
the query string means a changed file is a changed URL, and a deploy is never
half old and half new. Run it after editing anything under learn/.
"""
import hashlib, io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, "learn", "index.html")
# Every file index.html loads. A file missing from this list is a file a
# browser may keep serving from yesterday after it changes — which is how a
# deploy ends up half old and half new, and why the list is derived from the
# page rather than remembered by hand.
ASSETS = re.findall(r'(?:src|href)="([A-Za-z0-9_.-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?"',
                    io.open(PAGE, encoding="utf-8").read())

html = io.open(PAGE, encoding="utf-8").read()
for name in ASSETS:
    path = os.path.join(ROOT, "learn", name)
    if not os.path.exists(path):
        continue
    v = hashlib.sha1(io.open(path, "rb").read()).hexdigest()[:8]
    html = re.sub(r'(["\'])' + re.escape(name) + r'(\?v=[0-9a-f]+)?\1',
                  lambda m, n=name, v=v: m.group(1) + n + "?v=" + v + m.group(1), html)
    print(f"  {name:12s} {v}")
io.open(PAGE, "w", encoding="utf-8").write(html)
print("stamped learn/index.html")
