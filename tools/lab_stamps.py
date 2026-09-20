#!/usr/bin/env python3
"""
Stamp the files the math lab loads on demand.

learn/lab/core.js keeps a map of the files it loads only when a student opens
a lab course — the manipulatives and each unit's lessons — with a stamp that
changes whenever a file does, so a browser never runs yesterday's copy. This
rewrites that map from the files on disk: every learn/lab/widgets.js and
learn/<course>/uNN.js that exists, stamped with the first eight characters of
its SHA-1. A unit whose file does not exist yet is left out, and its page
says it is still being written.

    python3 tools/lab_stamps.py            # rewrite learn/lab/core.js
    python3 tools/lab_stamps.py --check    # exit 1 if it is out of date

learn/index.html's own ?v= stamps (for core.js and lab.css) are separate and
are set when index.html is.
"""
import glob
import hashlib
import os
import re
import sys

LEARN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "learn")
CORE = os.path.join(LEARN, "lab", "core.js")
COURSES = ["alg", "g8", "geo"]


def stamp(path):
    with open(path, "rb") as f:
        return hashlib.sha1(f.read()).hexdigest()[:8]


def build():
    files = [("lab/widgets.js", os.path.join(LEARN, "lab", "widgets.js"))]
    for c in COURSES:
        for p in sorted(glob.glob(os.path.join(LEARN, c, "u[0-9][0-9].js"))):
            files.append((c + "/" + os.path.basename(p), p))
    entries = ['    "%s": "%s"' % (rel, stamp(p)) for rel, p in files if os.path.exists(p)]
    return "  var FILES = {\n" + ",\n".join(entries) + "\n  };"


def main():
    src = open(CORE, encoding="utf-8").read()
    new = re.sub(r"  var FILES = \{.*?\n  \};", lambda m: build(), src, count=1, flags=re.S)
    if "--check" in sys.argv:
        sys.exit(0 if new == src else 1)
    if new != src:
        open(CORE, "w", encoding="utf-8").write(new)
    print(build())


if __name__ == "__main__":
    main()
