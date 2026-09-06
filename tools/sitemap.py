#!/usr/bin/env python3
"""
Rebuild sitemap.xml from what is actually on disk.

Written after the hand-maintained sitemap went stale twice: a list of URLs
typed out by hand stops describing the site the moment a page is added.
"""
import io, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Pages from the previous site: still served, deliberately not advertised.
OLD_SITE = {"OLaws", "OShop", "ocanvas", "ocrd", "odocs", "oedu", "omails", "omaps",
            "ophotos", "oplo-accounts", "osheets", "osurf", "oteams", "productivity",
            "roxan", "soon", "docs"}
# The Learn app is noindex; it should not be in the sitemap either.
EXCLUDE = OLD_SITE | {"learn"}

PRIORITY = {"": "1.0", "hardware/": "0.9", "software/": "0.9", "intelligence/": "0.9",
            "edu/": "0.9", "edu/learn/": "0.9", "plus/": "0.9",
            "privacy/": "0.8", "investor/": "0.8"}

def slugs():
    out = []
    for r, _dirs, files in os.walk(ROOT):
        if "index.html" not in files or ".git" in r:
            continue
        rel = os.path.relpath(r, ROOT).replace(os.sep, "/")
        if rel == ".":
            out.append("")
            continue
        if rel.split("/")[0] in EXCLUDE:
            continue
        out.append(rel + "/")
    return sorted(out)

if __name__ == "__main__":
    today = datetime.date.today().isoformat()
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    pages = slugs()
    for s in pages:
        lines += ["  <url>",
                  f"    <loc>https://oplocloud.com/{s}</loc>",
                  f"    <lastmod>{today}</lastmod>",
                  f"    <priority>{PRIORITY.get(s, '0.6')}</priority>",
                  "  </url>"]
    lines.append("</urlset>")
    io.open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(f"sitemap.xml — {len(pages)} URLs")
    for s in pages:
        print("  /" + s)
