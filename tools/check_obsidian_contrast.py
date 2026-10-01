#!/usr/bin/env python3
"""
Check the student dark look, rather than trusting that it is fine.

tools/obsidian.py translates a few hundred literals from the light stylesheets
into the dark ones, and the dark palette above it is hand-picked. Both are easy
to break by changing one colour and not the colour that was calibrated against
it, which is exactly what happened when the page moved from black to #353535:
the surfaces were a ramp rising from black, so every one of them turned out to
be darker than the new page, and the quietest text dropped below AA.

So the two properties that actually matter are checked here:

  1. The surface ramp climbs. Each surface must be at least as light as the one
     below it, or a "card" renders as a hole in the page and every shadow in
     the system points the wrong way.
  2. The text clears 4.5:1 against what it is painted on. Checked against the
     page, a card, and the fill inside a card, because the last is the one
     that was quietly failing and the hardest to notice.

Run it after changing the palette in tools/obsidian.py or the tokens in
learn/obsidian.css:

    python3 tools/check_obsidian_contrast.py

Exit code is non-zero if anything fails, so it can sit in a pre-commit or a
build step.
"""
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "learn")
CSS = os.path.join(ROOT, "obsidian.css")

# The surfaces, page first, in the order they must climb.
SURFACES = ["--obsidian", "--paper", "--sunk", "--press"]
# Text, with the surface it is actually painted on. --ink-3 is the quiet step
# and is used on the page and on cards; anything painted on a *fill* carries
# --ink-3-fill in its place, which tools/obsidian.py substitutes automatically
# (QUIET_ON_FILL). So the pairs below are the real contract: --ink-3 is held to
# the page and a card, and --ink-3-fill is held to the fill.
TEXT_ON = {
    "--ink": ["--obsidian", "--paper", "--sunk"],
    "--prose": ["--obsidian", "--paper", "--sunk"],
    "--ink-2": ["--obsidian", "--paper", "--sunk"],
    "--ink-3": ["--obsidian", "--paper"],
    "--ink-3-fill": ["--sunk", "--paper"],
}
AA = 4.5


def luminance(colour):
    """WCAG relative luminance of an #rrggbb string."""
    h = colour.lstrip("#")
    chans = []
    for i in (0, 2, 4):
        v = int(h[i:i + 2], 16) / 255
        chans.append(v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4)
    r, g, b = chans
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def read_tokens():
    """The hand-written token block, which the generator leaves alone."""
    with open(CSS) as fh:
        css = fh.read()
    block = re.search(r"html\[data-look=\"obsidian\"\]\s*\{(.*?)\n\}", css, re.S)
    if not block:
        sys.exit("could not find the token block in %s" % CSS)
    tokens = {}
    for name, val in re.findall(r"(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;", block.group(1)):
        tokens.setdefault(name, val)
    return tokens


def main():
    tokens = read_tokens()
    bad = []

    print("surface ramp (must climb, lightest-on-top reads as raised)")
    prev = None
    prev_name = None
    for name in SURFACES:
        if name not in tokens:
            bad.append("%s is not defined" % name)
            continue
        c = tokens[name]
        mark = ""
        if prev is not None:
            if luminance(c) < luminance(prev):
                mark = "  *** DARKER THAN %s — elevation is inverted ***" % prev_name
                bad.append("%s (#%s) is darker than %s (#%s)" % (name, c, prev_name, prev))
        print("  %-12s %s%s" % (name, c, mark))
        prev, prev_name = c, name

    print("\ntext contrast (WCAG AA needs %.1f:1, against what it is painted on)" % AA)
    all_surfaces = [n for n in ("--obsidian", "--paper", "--sunk") if n in tokens]
    for tname, surfaces in TEXT_ON.items():
        if tname not in tokens:
            bad.append("%s is not defined" % tname)
            continue
        tc = tokens[tname]
        print("  %-13s %s" % (tname, tc))
        for sname in surfaces:
            if sname not in tokens:
                continue
            r = ratio(tc, tokens[sname])
            ok = r >= AA
            print("      on %-10s %5.2f:1%s" % (sname, r, "" if ok else "   FAIL"))
            if not ok:
                bad.append("%s (%s) is %.2f:1 on %s (%s), below %.1f:1"
                           % (tname, tc, r, sname, tokens[sname], AA))
    for sname in all_surfaces:
        if sname not in tokens:
            bad.append("%s is not defined" % sname)

    print()
    if bad:
        print("FAILED — %d problem(s):" % len(bad))
        for b in bad:
            print("  · " + b)
        return 1
    print("OK — the ramp climbs and every text colour clears AA on every surface.")
    return 0


if __name__ == "__main__":
    sys.exit(main())