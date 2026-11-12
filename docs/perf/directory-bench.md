# The Directory at the size of a real school (O17, E7)

`GET /directory/students` reads every student of the school, counts the term's attendance for each, and filters and pages
in memory. That is cheap at 330 children and is the thing most likely to be slow at 1,801. This page says how it was
measured, what came out, and what to do if a later run says otherwise.

## The school

`bash api/scripts/dev.sh scale` builds it on a new local database, through the API the way a school's own loading does
(`api/scripts/seed-scale.mjs`). It takes about nine minutes and prints the sign-in file. A fixed seed, so two runs make the
same school; every name is made up and every email is on a domain that cannot receive mail.

| | |
|---|---|
| Sections | 68 (classes I to XII, five to seven sections each), 26 or 27 children in each |
| Children | 1,801 (the demo school's Tanvi Jindal and 1,800 more), each with a family and an India record (APAAR, PEN, consent, address, two guardian numbers) |
| Class teachers | 59 (nine have two sections) |
| Registers | 110 school days × 68 sections = 7,480 taken through `PUT /register` |
| Whole-day marks | 198,110 (`learn_attendance`); the last 120 calendar days hold 87 school days of them |
| Accounts | 3,663; audit rows 1,809; the database file is 144 MB |

The seed ends by counting what it made (sections, children seated, class teachers, marks, the Directory's own total) and
fails if any of them is not the number above.

## The result

`API=… ORIGIN=… CRED=… node api/scripts/bench-directory.mjs` signs in as the school's administrator, asks for each page
the console asks for (20 requests after 3 that are dropped) and for the export (5), and compares the 95th percentile with
the budget: **a page of the list ≤ 600 ms, the export of every row ≤ 5 s.** It refuses to run on a school smaller than
1,801 children or with fewer than 60 school days of marks. Run on 2026-10-27, a laptop with other work running (load
average 4 to 6), the API on `wrangler dev`, one client at a time:

```
Directory bench: 1801 children, 87 school days of marks in the last 120 (156687 whole-day marks), http://localhost:8818/api/v1
  request                          runs       min    median       p95   slowest
  the list as it opens               20   397 ms   408 ms   418 ms   422 ms
  one section                        20   376 ms   383 ms   388 ms   390 ms
  a name searched                    20   378 ms   387 ms   407 ms   420 ms
  attendance under 75%               20   377 ms   383 ms   397 ms   399 ms
  sorted by attendance, page 3       20   399 ms   406 ms   411 ms   411 ms
  export of all 1801 rows             5   396 ms   400 ms   405 ms   405 ms
RESULT: ok the slowest page's 95th percentile is 418 ms (budget 600 ms) and the export's 0.41 s (budget 5 s)
```

The budget is met, so the per-student summary table and the 30-second cache that E7 holds in reserve are **not built**. The
margin is 30%, on a local database.

## Where the 400 ms goes

Every request pays the same price whatever it filters, because `load()` in `api/src/routes/directory.js` always reads the
whole school: the list of students, the term's counts (`watchOf`, which runs `watchCounts` in `api/src/repo/d1.js`, one grouped
count over the marks) and the early-warning pass. Next to it, on the same data (a first build of the school, one child larger):
one student's record 19 ms, the guardians list 59 ms, the register's pulse 174 ms, a section's register 10 ms. The grouped count is the part that grows with the term: it walks the
`idx_attendance_wholeday` index for each of 1,801 children (198,110 entries over the year) and returns about 6,200 rows.

## What this does not say

- **It is a local database.** D1 in production adds a network hop to every statement and bills rows read; this page view
  reads about 200,000 index entries. Run the bench again with `API=` pointing at the deployed API before calling the
  Directory school-ready, and attach that output to the pull request that says so. The command is the same.
- **One client at a time.** A school has several people on the Directory at 08:30. If the deployed run is near the budget,
  run the bench in two terminals before trusting it.
- **A fresh API.** After the 7,000 requests of the seed, `wrangler dev`'s own process had a full heap, and every tenth answer
  waited a second or more for a collection (the bench read p95 1.2 s with a median of 0.4 s, then the process died with
  "JavaScript heap out of memory"). That is the dev server, not the Directory. `dev.sh scale` restarts the API after
  seeding for that reason; a bench run on a server that has just taken the seed's requests is not a measurement.

## If a later run misses the budget

In this order, and measure after each:

1. A per-student attendance summary, kept up to date when a register is submitted (`upsertAttendance`), read in place of
   `watchCounts`. The Directory, the watch list and the early-warning pass all read the same counts, so they change together.
2. Cache the list's rows for 30 seconds or fewer per (school, scope, data version), the version being the last register or
   student change. Never cache across schools or across a class teacher's scope.
3. Work out the early-warning pass for the 50 rows shown, if a profile says it is the second cost.

`bench-directory.mjs` exits 1 with a `fix:` line that points here when either number is missed.
