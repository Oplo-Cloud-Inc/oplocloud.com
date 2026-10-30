#!/usr/bin/env python3
"""Keeps the shared parts of Roxan's pages in step.

The pages in roxan/ are plain HTML. Between <!-- rx:bar --> ... <!-- /rx:bar -->
sits the header, between <!-- rx:foot --> ... <!-- /rx:foot --> the footer, and
this script rewrites both from one definition. It also restamps the ?v= on the
site's own CSS and JS so a deploy is never served from a stale cache.

    python3 tools/roxan_chrome.py          # rewrite what changed
    python3 tools/roxan_chrome.py --check  # exit 1 if anything is out of step
"""
import hashlib
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parent / "roxan"
APEX = "https://oplocloud.com"
MARK = (HERE / "oplo-mark.svg").read_text().strip()

GLOBAL = [("Products", "/products/"), ("Solutions", "/solutions/"), ("Resources", "/resources/"),
          ("Company", "/company/"), ("Support", "/support/")]
LOCAL = [("product", "Product", "/product/"), ("security", "Security", "/security/"),
         ("pricing", "Pricing", "/pricing/"), ("help", "Help", "/help/"), ("status", "Status", "/status/")]
FOOT = [
    ("Roxan", [("Open Roxan", "/chat/"), ("Product", "/product/"), ("Security", "/security/"),
               ("Pricing", "/pricing/"), ("Help", "/help/"), ("Status", "/status/")]),
    ("Oplo", [("Company", APEX + "/company/"), ("Contact", APEX + "/contact/"),
              ("Careers", APEX + "/careers/"), ("Support", APEX + "/support/")]),
    ("Legal", [("Privacy policy", APEX + "/legal/privacy-policy/"), ("Terms of use", APEX + "/legal/terms/"),
               ("Legal", APEX + "/legal/")]),
]


def bar(page):
    g = "".join('<li><a href="%s%s">%s</a></li>' % (APEX, h, t) for t, h in GLOBAL)
    l = "".join('<li><a href="%s"%s>%s</a></li>' % (h, ' aria-current="page"' if k == page else "", t)
                for k, t, h in LOCAL)
    return f"""<!-- rx:bar -->
<div class="gbar"><div class="wrap gbar-in">
  <a class="gbar-brand" href="{APEX}/" aria-label="Oplo">{MARK}</a>
  <nav aria-label="Oplo"><ul>{g}</ul></nav>
</div></div>
<header class="lbar" id="lbar"><div class="wrap lbar-in">
  <a class="lbar-brand" href="/" aria-label="Roxan home"><span class="mark"></span><span>Roxan</span></a>
  <nav class="lbar-nav" id="lnav" aria-label="Roxan"><ul>{l}</ul></nav>
  <a class="btn sm" href="/chat/">Open Roxan</a>
  <button class="lbar-toggle" id="ltoggle" type="button" aria-expanded="false" aria-controls="lnav"><span class="sr">Menu</span><i></i><i></i></button>
</div></header>
<!-- /rx:bar -->"""


def foot():
    cols = "".join(
        '<div><h2 class="label">%s</h2><ul>%s</ul></div>' %
        (name, "".join('<li><a href="%s">%s</a></li>' % (h, t) for t, h in links))
        for name, links in FOOT)
    return f"""<!-- rx:foot -->
<footer class="foot"><div class="wrap">
  <p class="foot-note">Roxan is in invited beta. What this site describes is marked Live or Next; availability and capability are not final.</p>
  <div class="foot-cols">{cols}</div>
  <p class="foot-bar">Copyright &copy; 2026 OploCloud, Inc. All rights reserved.</p>
</div></footer>
<!-- /rx:foot -->"""


STAMP = re.compile(r'((?:href|src)=")(/(?:fonts\.css|ui\.css|site\.css|site\.js|status\.js|chat/[a-z]+\.(?:css|js)))(?:\?v=[0-9a-z]+)?(")')


def stamp(m):
    f = SITE / m.group(2).lstrip("/")
    h = hashlib.sha1(f.read_bytes()).hexdigest()[:8] if f.exists() else "missing"
    return f"{m.group(1)}{m.group(2)}?v={h}{m.group(3)}"


def render(path):
    html = path.read_text()
    page = (re.search(r'<body[^>]*data-page="([^"]+)"', html) or [None, ""])[1]
    out = re.sub(r"<!-- rx:bar -->[\s\S]*?<!-- /rx:bar -->", lambda m: bar(page), html)
    out = re.sub(r"<!-- rx:foot -->[\s\S]*?<!-- /rx:foot -->", lambda m: foot(), out)
    return STAMP.sub(stamp, out)


def main():
    check = "--check" in sys.argv
    stale = []
    for p in sorted(SITE.rglob("*.html")):
        if "mof" in p.relative_to(SITE).parts:
            continue
        new = render(p)
        if new != p.read_text():
            stale.append(p.relative_to(SITE))
            if not check:
                p.write_text(new)
    for s in stale:
        print(("stale   " if check else "updated ") + str(s))
    if not stale:
        print("in step")
    sys.exit(1 if (check and stale) else 0)


if __name__ == "__main__":
    main()
