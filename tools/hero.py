#!/usr/bin/env python3
"""Flatten the front page's opening picture into files a page can afford.

The artwork is a design export, OploWebsite.svg: a 1440x810 white sheet with a
photograph of the Earth at night laid on it, and the word "Hello" placed over
that as a second picture seen through a mask. Six megabytes of it is embedded
image data, which is right for a design file and wrong for a web page.

This draws the three layers the way the SVG says to — the same scale, the same
offsets, the mask read as brightness — and writes the result twice, for a
1440-wide screen and for a 2x one:

    assets/img/hero-earth-1440.webp
    assets/img/hero-earth-2880.webp

The SVG is not kept in the repository (it would add six megabytes to every
clone); keep the master where the design lives and point this at it:

    python3 tools/hero.py ~/Downloads/OploWebsite.svg && python3 tools/build.py
"""
import base64, io, os, re, sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets/img")

if len(sys.argv) != 2:
    sys.exit(__doc__)
svg = io.open(os.path.expanduser(sys.argv[1]), encoding="utf-8").read()

# The three pictures, in the order they appear in the file: the mask, the
# photograph, and the lettering that the mask is applied to.
found = re.findall(r'xlink:href="data:image/(?:png|jpeg);base64,([A-Za-z0-9+/=]+)"', svg)
assert len(found) == 3, f"expected 3 embedded pictures, found {len(found)}"
mask, photo, lettering = (Image.open(io.BytesIO(base64.b64decode(b))) for b in found)


def place(im, scale_x, scale_y, x, y, k):
    """Resize an image the way the SVG's transform matrix does, at k times the
    1440-wide view box, and return it with its top-left corner in pixels."""
    size = (round(im.width * scale_x * k), round(im.height * scale_y * k))
    return im.resize(size, Image.LANCZOS), (round(x * k), round(y * k))


K = 2                                              # render at 2x, then derive the 1x
canvas = Image.new("RGB", (1440 * K, 810 * K), "white")

# <g transform="matrix(0.288, 0, 0, 0.287804, 0, -74.699976)"> the photograph
im, at = place(photo.convert("RGB"), 0.288, 0.287804, 0.0, -74.699976, K)
canvas.paste(im, at)

# <g mask=...><g transform="matrix(0.24, 0, 0, 0.24, 96.96, -0.24)"> the lettering,
# where the mask (its brightness) says how much of it shows
im, at = place(lettering.convert("RGB"), 0.24, 0.24, 96.960001, -0.23998, K)
m, _ = place(mask.convert("L"), 0.24, 0.24, 96.960001, -0.23998, K)
canvas.paste(im, at, m)

for w, q in ((2880, 80), (1440, 78)):
    out = canvas if w == canvas.width else canvas.resize((w, round(w * 9 / 16)), Image.LANCZOS)
    path = os.path.join(OUT, f"hero-earth-{w}.webp")
    out.save(path, "WEBP", quality=q, method=6)
    print(f"{os.path.relpath(path, ROOT):34s} {out.width}x{out.height}  {os.path.getsize(path) // 1024} KB")
