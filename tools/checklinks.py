#!/usr/bin/env python3
"""Verify every link on the new site resolves: file exists, anchor exists."""
import io, os, re, sys
from urllib.parse import urldefrag

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ["index.html", "hardware/index.html", "software/index.html", "intelligence/index.html",
         "privacy/index.html", "developers/index.html", "company/index.html", "newsroom/index.html",
         "careers/index.html", "contact/index.html", "support/index.html", "sign-in/index.html",
         "legal/index.html", "legal/privacy-policy/index.html", "legal/terms/index.html"]

ids = {}
for p in PAGES:
    src = io.open(os.path.join(ROOT, p), encoding="utf-8").read()
    ids[p] = set(re.findall(r'\bid="([^"]+)"', src))

def resolve(page, href):
    """Return the repo-relative file a href points at, or None if external."""
    if href.startswith(("http://", "https://", "mailto:", "data:", "tel:")):
        return None
    base = os.path.dirname(page)
    path, frag = urldefrag(href)
    if path == "":
        return page, frag
    target = os.path.normpath(os.path.join(base, path))
    if target.endswith("/") or os.path.isdir(os.path.join(ROOT, target)):
        target = os.path.join(target, "index.html")
    elif not os.path.splitext(target)[1]:
        target = os.path.join(target, "index.html")
    return target.replace(os.sep, "/"), frag

bad, checked, ext = [], 0, 0
for p in PAGES:
    src = io.open(os.path.join(ROOT, p), encoding="utf-8").read()
    for href in re.findall(r'href="([^"]+)"', src):
        r = resolve(p, href)
        if r is None:
            ext += 1
            continue
        target, frag = r
        checked += 1
        full = os.path.join(ROOT, target)
        if not os.path.exists(full):
            bad.append((p, href, "target missing: " + target)); continue
        if frag:
            if target not in ids:
                tsrc = io.open(full, encoding="utf-8").read()
                ids[target] = set(re.findall(r'\bid="([^"]+)"', tsrc))
            if frag not in ids[target]:
                bad.append((p, href, f"no id=\"{frag}\" on {target}"))

print(f"internal links checked : {checked}")
print(f"external / mailto      : {ext}")
print(f"broken                 : {len(bad)}")
if bad:
    print("\nBROKEN:")
    for page, href, why in bad:
        print(f"  {page:34s} {href:34s} {why}")
    sys.exit(1)
print("\nEvery internal link resolves to a real file, and every anchor to a real element.")

leftovers = []
for p in PAGES:
    src = io.open(os.path.join(ROOT, p), encoding="utf-8").read()
    for h in re.findall(r'href="([^"]+)"', src):
        if re.search(r'/(soon|roxan|odocs|osheets|omails|omaps|osurf|ophotos|ocanvas|oteams|oedu|ocrd|OLaws|OShop|productivity|oplo-accounts)/', h):
            leftovers.append((p, h))
print(f"links into the old site: {len(leftovers)}")
for p, h in leftovers:
    print("  ", p, h)
