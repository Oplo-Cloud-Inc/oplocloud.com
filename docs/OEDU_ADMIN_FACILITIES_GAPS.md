# OEdu Admin — facilities: what a school office expects, and where OEdu stands

Checked 2026-10-12 against the deployed build; built the same day (see *Built since*). About two dozen products that
buyers shortlist for school and general facilities management were read from
public pages by five independent researchers and written up in one report; three
claims that drive the recommendations were then re-fetched and held (one detail
was corrected). Evidence is mostly vendor-authored and district-scaled — no
review from a school of one to three buildings was found — so the module below
is an inference to test with two or three real offices before it hardens.

No finance (OEdu does not do fees, billing, payments, purchasing, payroll). Cost
and purchasing features are listed so the exclusion is explicit.

## Built since

All five slices, as the smallest module that still does a small school's job.
Migration `0019`; 24 rule tests and a 32-step HTTP proof; the QR encoder was
checked by decoding every version at both levels with a real reader.

| Need | Where | State |
| --- | --- | --- |
| Request a repair, watch it move; accept or decline with a reason; assign, hold, finish with time and photos; a failed inspection line raises its own order, once | Facilities → Work orders; a teacher's School → Facilities; the phone page | one table, seven statuses, insert-only history |
| Rooms by range, a label with a QR code per room, what is in each room, count a room (found / missing / in the wrong room / unknown) | Facilities → Spaces, Assets | the register has dates, no cost |
| Preventive jobs, inspections and required checks that write their own order when due — lead days, wait-for-the-last, count-from-completion, move out of a break | Facilities → Routines | no timer: written when somebody looks, never a pile |
| Starter checks for the United States, the United Kingdom and India, each with its source and how firm it was | Routines → Starter checks | offered, never applied |
| Hold a room under its own rules; conflicts and every reason say why; a series decided as one; the approver, or the office, decides | Facilities → Bookings; School → Facilities | |
| Vendors with the papers they must hold; documents with an expiry; what is running out surfaces on the Overview | Facilities → Vendors, Documents; Overview | file ≤ 700 KB or a link |
| Created vs finished by week, overdue, days to finish, preventive on time; download and print | Facilities → Reports | computed now, never stored |
| A phone's page: report with the room chosen, and work the jobs given to you | `/jobs/` | its own page, staff only |

New roles: `facilities`, `office`, `it` (alongside `principal`, `dean`). A person
who holds only those gets the console with the facilities places and nothing else.

## Decisions taken

The owner asked for the best call on each and said to go with the defaults.

1. **A phone view** — built as its own page at `/jobs/`, not the console squeezed. Everything else stays desktop-first.
2. **File storage** — links, and files up to 700 KB; a phone photo is made smaller in the browser. No object storage was created.
3. **Email** — none. Status is always on the page: the requester's list, the phone page, and the Overview for the team.
4. **A cost field** — none, under the standing rule. Warranty end, install date, expected life and condition are kept.
5. **A public request form** — none. A label on a door opens sign-in and then the form with the room chosen.
6. **Country templates** — United States, United Kingdom (England) and India, plus a few that apply anywhere; every interval is confirmed by the school.

Still open: object storage for larger files, email, and the school calendar that
would let blocked days come from one place instead of room by room.

## What the market sells

One feature set, sold at different depths. Reviewers rarely say a product lacks
an essential feature; they say it takes too long to set up, is rigid, sends noisy
email, and hides the useful tier behind per-seat gates or quote-only pricing.

| Area | Table stakes | Gated or rare |
| --- | --- | --- |
| Asset tracking | record with custom fields, location tree, attachments, scannable label, history | check-out with due date; scan-based count with a missing report; custody confirmed by the holder |
| Document management | files on assets, work orders, vendors, rooms | expiry as a real field (nearly absent); versioning |
| Facility scheduling | none across the whole set; in the school-built tools: request form, live conflict check, optional approval, recurring series | per-room rules (hours, notice, buffers, who may book); outside-group rentals |
| Inspection management | reusable checklist of typed items with photo and notes, on a schedule | failed item raises a work order (configurable, not default); weighted scoring |
| Maintenance scheduling | four-status work order; request with no login; approve or decline; email back | custom statuses; escalation; auto-assignment |
| Mobile access | phone view with photo, status, QR scan | offline (gated or capped) |
| Preventive maintenance | calendar recurrence with a checklist | lead time, "next from completion", "skip if last one still open", term-break window |
| Task management | checklist inside a work order; a schedule spawns ordinary orders | none treats a recurring to-do as its own object |
| Vendor management | directory, contacts, linked orders, hand-off by emailed link | required-document checklist with expiry (one product); portals |

## Where OEdu stood

Verified in the code of the deployed build before this was built, not from memory.

| Area | OEdu then |
| --- | --- |
| Asset tracking | **None.** Inventory is a page that says what it will do. No rooms, no assets, no custodian |
| Document management | **Partial.** Enrollment has per-application documents with scans (700 KB cap, kept in the database); the Documents page lists what a student's family view says is on file. No file storage, no facility documents, no expiry |
| Facility scheduling | **None.** Scheduling is a page that says what it will do. There is no room, no bell schedule, no calendar, no booking |
| Inspection management | **None** |
| Maintenance scheduling | **None.** No request, no work order, no queue, no facilities role |
| Mobile access | **None, by decision.** Desktop only until the owner says otherwise |
| Preventive maintenance | **None.** Marking periods carry start and end dates, which is what a term-break window needs |
| Task management | **None** |
| Vendor management | **None** |

## What the benchmark assumed that OEdu does not have

(Still true after the build, except where noted in *Decisions taken*.)

- **Rooms.** A school information system is expected to already own them. OEdu has courses, not places, so the building–floor–room tree starts empty. That is the "empty system" start reviewers name as their biggest hurdle, so adding rooms has to be a one-minute job (type a range, get rooms).
- **A school calendar.** Not there. Marking periods are (start, end, state), so the gaps between them can serve as breaks until a calendar exists.
- **File storage.** Manuals, certificates and floor plans are bigger than the 700 KB the enrollment scans are held to. A bucket is a production resource that has to be created by the owner.
- **Anything that sends.** OEdu sends no email. The research found that requests stop when nothing visible happens after submitting, so the requester needs a "my requests" view that always shows status.
- **A timetable.** There is no class or section concept, and courses carry no meeting times, so room use by timetable is not available and no booking should pretend otherwise. Booking is by event, meeting and use.

## What OEdu already has that the products have to build

Sign-on and roles (a teacher is already an account, so requests need no public form); the insert-only event history, restricted-role rules, optimistic updates and idempotent create from enrollment, conduct and health; lazy generation on read (no timer service needed); marking-period dates; the family view; the console shell, tables and sheets.

## The smallest module

One work-order table, fed from the teacher console and the admin console, with eight tables in all.

| Part | What it does | Stays out |
| --- | --- | --- |
| Spaces | building → floor → room, type, capacity, bookable flag; add by range | parent/child trees, CAD, sensors |
| Assets | pinned to a room: name, code, custodian (staff, student, room, cart), warranty end, install date, expected life, condition, photo; count per room with found / missing / moved | meters, RFID, depreciation |
| Work orders | kinds: request, repair, preventive, inspection, task; statuses open, in progress, on hold, done (cancelled and declined kept); assignee, due, photos, checklist, minutes; pending queue with approve or decline and a reason; the requester sees every status | custom statuses, escalation engine |
| Schedules | calendar recurrence, lead days, next-from-completion, skip-if-open, term-break window; one shape also carries compliance items (frequency, last done, next due, evidence) | meter and condition triggers |
| Bookings | per-room hours, days ahead, notice, maximum length, buffer, who may book, approver or none; a recurring series approved as a unit; blocked dates | fees, conference calls, hoteling |
| Documents | file or link, kind, issue and expiry date, owner (room, asset, vendor, order), reminder on the Overview | check-out locking |
| Vendors | trade, buildings, contacts, required documents with expiry, contract end, linked orders, completion by link | portal logins, quotes |
| Reports | created vs completed, open by status and priority, overdue, preventive compliance, minutes to finish, by category; print and CSV | dashboards |

Two real differences from the incumbents, both cheap here: a request lookup by
room (choosing the room shows the open work, which prevents duplicates), and
expiry as a first-class field on documents and vendor requirements.

## Recurring checks a school keeps evidence of

One tracking shape fits the United States, the United Kingdom and India: type,
authority, frequency rule (fixed interval, per term, set by a risk assessment, or
certificate expiry), last done, next due, evidence, responsible person. Many
frequencies are risk-based or set locally, so templates ship as editable and
labelled by country with their source, never as a hard-coded number. Event-type
checks such as drills need a log of occurrences with a count per term or year.
Premises checks belong here; staff vetting, student health and incident reports
about children belong with records and are linked by reference only.

## Out of scope (money)

Depreciation and valuation, purchase orders, quotes and invoices, labour and
parts costing, rental fees and payments, capital-planning scenarios. Boundary:
warranty end, install date, expected life and condition are plain data and stay;
purchase cost, replacement value and funding source are money and stay out unless
the owner decides otherwise.

## The order it was built in

1. **Spaces and work orders** — rooms by range, request form, queue, four statuses, the requester's own list. A role `facilities` for the people who do the work.
2. **Assets, documents with expiry, vendors** — the register, counts, expiring documents on the Overview.
3. **Schedules and inspections** — preventive and compliance items generated lazily, term-break window from marking periods; a checklist run that can raise an order.
4. **Booking** — rules, approval, series, blocked dates.
5. **Reports.**

## Not verified

No evidence from one-to-three-building schools; no usage data on which features
go unused (inference: schedules, full register, parts, dashboards); two vendors'
help centres were unreadable and are known from search excerpts; regulatory
frequencies were not confirmed against a school's own authority and are not
legal advice; privacy law for visitor and drill logs was not researched.
