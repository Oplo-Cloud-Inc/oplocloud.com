# Time to hello (X1, X8)

How long a new developer waits before the first useful thing is on the screen. Two clocks, both started at `git clone`:

- **Clock G, the gallery:** until the component gallery (`learn/_ui.html`) is open in a browser. No API, no database, no install.
  Target: 2 minutes.
- **Clock S, signed in:** until the demo school's administrator is signed in, from one command. Target: 10 minutes.

One row per release, newest first. The numbers are machine time: what the commands take. The browser opening and the person
typing the password from the sign-in file are not in them. No telemetry; X8 is to script the run, and until it does each row is
read off `time` by hand, and says so.

| Release | Clock G | Clock S | How it was timed |
|---|---|---|---|
| 2026-10-27, wave 2, before merge | 2 s | 28 s, then the password | by hand, one run each, below |

## 2026-10-27, wave 2 (X1)

A clone of `5d49bb2` with this wave's files laid over it, because `dev.sh` was not yet committed. A laptop with other work
running; the npm cache warm; the clone made from a local path, so no network in it.

| Step | Command | Time | Size |
|---|---|---|---|
| Clone | `git clone <repo>` | 1 s | `.git` 116 MB |
| Gallery up (Clock G ends here) | `bash api/scripts/dev.sh gallery` | 1.1 s | |
| Install | `cd api && npm ci` | 2 to 3 s (npm says 3 s) | 193 MB of `node_modules` |
| Demo school up (Clock S ends here) | `bash api/scripts/dev.sh` | 24 s | |

Clock G is the clone and the gallery: **2 s**. Clock S is the clone, the install and the demo: **28 s**. The demo's 24 s is the
migrations (all of them, on a new database), the platform administrator, the demo school and its four people, the API
(`wrangler dev`) answering its health check, and the static server. It ends by printing the address, the sign-in file and the
commands that check your work. The sign-in itself was checked by API: the printed administrator and the password in the sign-in
file open a session and read the Directory.

## What these numbers do not say

- **No network.** Over the network the clone is the 116 MB of history, so it is the connection's speed; and a cold npm cache
  makes the install longer. Neither was measured. The README says "about two minutes the first time" for `dev.sh`, which is a
  guess for that case and not a measurement.
- **One run each.** There is no spread.
- **macOS only.** `dev.sh` needs node 22 (it checks that node is there, not which version) and `lsof` for `stop`; it exits with a
  `fix:` line when node, `lsof` or the API's packages are missing. Linux and Windows were not tried.
- **The password typed by a person** at the sign-in page, in a clone made from scratch, was not done. Clicking Sign in opens the
  sign-in page on `http://localhost:8788`, which is where the app sends a local browser.
- **The bigger schools.** `dev.sh full` takes a few minutes and `dev.sh scale` about nine (`docs/perf/directory-bench.md`);
  neither is on a clock.

## To add a row

On a clean clone of the commit being released, with `OPLO_DEV_STATE` pointing at an empty folder and nothing on ports 8787,
8123 and 8788:

```bash
time git clone <repo> oplo && cd oplo
time bash api/scripts/dev.sh gallery
bash api/scripts/dev.sh stop
time (cd api && npm ci)
time bash api/scripts/dev.sh
bash api/scripts/dev.sh stop
```

Clock G is the clone plus the gallery line, Clock S the clone plus the install plus the last line. Put the date or the tag in
the first column.
