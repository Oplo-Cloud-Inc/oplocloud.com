#!/usr/bin/env python3
"""Fingerprint the Learn app's assets into their URLs.

A static host has no build step, so a browser will happily serve yesterday's
app.js for as long as its cache says it may. Stamping the content hash into
the query string means a changed file is a changed URL, and a deploy is never
half old and half new. Run it after editing anything under learn/.

Two pages load assets: the app at learn/index.html, and the family view at
learn/parent/index.html, which shares api.js with it by a relative path. The
disclosure page loads its own.

    python3 tools/stamp.py           stamp the pages
    python3 tools/stamp.py --check   change nothing; STAMP001 for each asset whose ?v= is missing,
                                     a placeholder (?v=0) or no longer the hash of the file
    --json                           with --check, the problems as one JSON object

--check speaks the way the lints do (learn/README.md#STAMP001): three lines per problem, a last
RESULT: line, a non-zero exit when there is a problem. OL_LEARN_ROOT points at another copy of
learn/ (the fixtures of api/scripts/test-lint.mjs).
"""
import hashlib, io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEARN = os.path.abspath(os.environ["OL_LEARN_ROOT"]) if os.environ.get("OL_LEARN_ROOT") else os.path.join(ROOT, "learn")
PAGES = [os.path.join(LEARN, p) for p in ("index.html", os.path.join("parent", "index.html"), os.path.join("disclosure", "index.html"))]
# A file the page loads, and whatever ?v= it carries now: a hash, a 0, or anything a person typed.
ASSET = re.compile(r'(?:src|href)="((?:\.\./)?(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9_.-]+\.(?:js|css))(?:\?v=[^"\']*)?"')


def quoted(name):
    """Every place the page spells the asset's name inside quotes, with the ?v= it has there."""
    return re.compile(r'(["\'])' + re.escape(name) + r'(\?v=[^"\']*)?\1')


def hash_of(here, name):
    path = os.path.normpath(os.path.join(here, name))
    if not os.path.exists(path):
        return None
    return hashlib.sha1(io.open(path, "rb").read()).hexdigest()[:8]


def stamp():
    for page in PAGES:
        if not os.path.exists(page):
            continue
        here = os.path.dirname(page)
        html = io.open(page, encoding="utf-8").read()
        # Every file the page loads. A file missing from this list is a file a
        # browser may keep serving from yesterday after it changes — which is how
        # a deploy ends up half old and half new, and why the list is derived from
        # the page rather than remembered by hand.
        for name in ASSET.findall(html):
            v = hash_of(here, name)
            if v is None:
                continue
            html = quoted(name).sub(lambda m, n=name, v=v: m.group(1) + n + "?v=" + v + m.group(1), html)
            print(f"  {name:14s} {v}")
        io.open(page, "w", encoding="utf-8").write(html)
        print("stamped learn/" + os.path.relpath(page, LEARN).replace(os.sep, "/"))


def check(as_json):
    problems = []
    for page in PAGES:
        if not os.path.exists(page):
            continue
        here = os.path.dirname(page)
        html = io.open(page, encoding="utf-8").read()
        shown = "learn/" + os.path.relpath(page, LEARN).replace(os.sep, "/")
        found = []
        for name in dict.fromkeys(ASSET.findall(html)):
            v = hash_of(here, name)
            if v is None:
                continue
            for m in quoted(name).finditer(html):
                have = m.group(2) or ""
                if have == "?v=" + v:
                    continue
                what = f"{name}{have} is a placeholder or stale (the file hashes to {v})" if have else f"{name} has no ?v= hash (the file hashes to {v})"
                found.append({"code": "STAMP001", "file": shown, "line": html.count("\n", 0, m.start()) + 1, "what": what,
                              "fix": "run python3 tools/stamp.py", "docs": "learn/README.md#STAMP001"})
        problems += sorted(found, key=lambda p: p["line"])
    if as_json:
        print(json.dumps({"result": "fail" if problems else "ok", "problems": problems}, indent=2))
    else:
        for p in problems:
            print(f"{p['code']} {p['file']}:{p['line']} {p['what']}\nfix: {p['fix']}\ndocs: {p['docs']}")
        print(f"RESULT: fail {len(problems)} problems" if problems else "RESULT: ok")
    return 1 if problems else 0


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and (set(args) - {"--check", "--json"} or ("--json" in args and "--check" not in args)):
        sys.exit(__doc__)
    sys.exit(check("--json" in args) if "--check" in args else stamp() or 0)
