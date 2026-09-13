#!/usr/bin/env python3
"""Fingerprint the Learn app's assets into their URLs.

A static host has no build step, so a browser will happily serve yesterday's
app.js for as long as its cache says it may. Stamping the content hash into
the query string means a changed file is a changed URL, and a deploy is never
half old and half new. Run it after editing anything under learn/.

Two pages load assets: the app at learn/index.html, and the family view at
learn/parent/index.html, which shares api.js with it by a relative path.
"""
import hashlib, io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = [os.path.join(ROOT, "learn", "index.html"),
         os.path.join(ROOT, "learn", "parent", "index.html")]

for page in PAGES:
    if not os.path.exists(page):
        continue
    here = os.path.dirname(page)
    html = io.open(page, encoding="utf-8").read()
    # Every file the page loads. A file missing from this list is a file a
    # browser may keep serving from yesterday after it changes — which is how
    # a deploy ends up half old and half new, and why the list is derived from
    # the page rather than remembered by hand.
    assets = re.findall(r'(?:src|href)="((?:\.\./)?[A-Za-z0-9_.-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?"', html)
    for name in assets:
        path = os.path.normpath(os.path.join(here, name))
        if not os.path.exists(path):
            continue
        v = hashlib.sha1(io.open(path, "rb").read()).hexdigest()[:8]
        html = re.sub(r'(["\'])' + re.escape(name) + r'(\?v=[0-9a-f]+)?\1',
                      lambda m, n=name, v=v: m.group(1) + n + "?v=" + v + m.group(1), html)
        print(f"  {name:14s} {v}")
    io.open(page, "w", encoding="utf-8").write(html)
    print("stamped " + os.path.relpath(page, ROOT))
