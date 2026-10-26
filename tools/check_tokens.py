#!/usr/bin/env python3
"""Check learn/tokens.css against WCAG 2.2 AA, in every theme.

Text needs 4.5:1 against the surface it sits on; the border of a control, the
focus ring and a chart colour need 3:1 (1.4.11). The pairs are the ones the
components actually draw: body, secondary and hint text on each surface, the
accent as text and as a fill with its own "on" colour, and each meaning
colour on the page and on its own soft fill.

Reads the same file the browser reads: the :root block is the light theme and
each :root[data-theme=...] block overrides it. "auto" is the dark block under
a media query and is checked as dark. Exits 1 on any miss, so it can sit in
the boundary check.
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS = io.open(os.path.join(ROOT, "learn", "tokens.css"), encoding="utf-8").read()


def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def lum(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def block(selector):
    m = re.search(re.escape(selector) + r"\s*\{(.*?)\n\s*\}", CSS, re.S)
    if not m:
        sys.exit("tokens.css has no block for " + selector)
    return dict(re.findall(r"(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\s*;", m.group(1)))


BASE = block(":root")
THEMES = {
    "light": BASE,
    "dark": {**BASE, **block(':root[data-theme="dark"]')},
    "hc": {**BASE, **block(':root[data-theme="hc"]')},
}
# The auto block repeats the dark one; it must not drift from it.
AUTO = block(':root[data-theme="auto"]')
DARK = block(':root[data-theme="dark"]')
drift = [k for k in AUTO if AUTO[k] != DARK.get(k)]

SURFACES = ["--c-bg", "--c-bg-subtle", "--c-surface", "--c-surface-raised"]
TEXT = ["--c-text", "--c-text-2", "--c-text-3"]
MEANING = ["success", "warning", "danger", "info"]


def pairs(t):
    out = []
    for s in SURFACES:
        for f in TEXT:
            out.append((f + " on " + s, t[f], t[s], 4.5))
        out.append(("--c-accent on " + s, t["--c-accent"], t[s], 4.5))
        for m in MEANING:
            out.append(("--c-%s on %s" % (m, s), t["--c-" + m], t[s], 4.5))
        out.append(("--c-line-input on " + s, t["--c-line-input"], t[s], 3.0))
    out.append(("--c-on-accent on --c-accent", t["--c-on-accent"], t["--c-accent"], 4.5))
    out.append(("--c-on-accent on --c-accent-hover", t["--c-on-accent"], t["--c-accent-hover"], 4.5))
    out.append(("--c-accent on --c-accent-soft", t["--c-accent"], t["--c-accent-soft"], 4.5))
    out.append(("--c-text on --c-accent-soft", t["--c-text"], t["--c-accent-soft"], 4.5))
    out.append(("--c-text-2 on --c-accent-soft", t["--c-text-2"], t["--c-accent-soft"], 4.5))   # a selected tile or row
    for m in MEANING:
        out.append(("--c-%s on --c-%s-soft" % (m, m), t["--c-" + m], t["--c-%s-soft" % m], 4.5))
        out.append(("--c-text on --c-%s-soft" % m, t["--c-text"], t["--c-%s-soft" % m], 4.5))
    out.append(("--c-focus-solid on --c-bg", t["--c-focus-solid"], t["--c-bg"], 3.0))
    for i in range(1, 9):
        out.append(("--c-chart-%d on --c-surface" % i, t["--c-chart-%d" % i], t["--c-surface"], 3.0))
    return out


bad = 0
for name, t in THEMES.items():
    rows = pairs(t)
    misses = [(n, f, b, need, ratio(f, b)) for n, f, b, need in rows if ratio(f, b) < need]
    print("%-6s %3d pairs, %d under" % (name, len(rows), len(misses)))
    for n, f, b, need, r in misses:
        print("   %-40s %s on %s  %.2f < %.1f" % (n, f, b, r, need))
    bad += len(misses)
if drift:
    print("auto block drifted from dark: " + ", ".join(drift))
    bad += len(drift)
print("tokens hold." if not bad else "tokens fail: %d" % bad)
sys.exit(1 if bad else 0)
