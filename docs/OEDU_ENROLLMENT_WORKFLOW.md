# OEdu Enrollment — the admissions workflow

Students → Enrollment is not a form with a Save button. It is the school's
admissions office: a queue of applications, a record for each with its
documents, its review and its history, a decision that is separate from
enrolling, and a student who arrives in a course with the family linked and the
record written.

The principle: **enrollment is a controlled institutional process, not a
data-entry screen.** Every application has an owner and a next step; every
change is on its record; nothing is overwritten.

---

## 1. Four words, kept apart

| Word | Means | Where it lives |
| --- | --- | --- |
| Applicant | a person asking for a place | `learn_applications` (no account yet) |
| Admitted | the school has said yes | the application's status |
| Enrolled | a formal record of one school year, with dates | `learn_enrollments` |
| Active | enrolled, and today is inside its dates | derived from the dates, never typed |

Admitted is not enrolled: a decision can be made today for a student who starts
next term. A returning student has **one account and a row per year**. A
future-year enrollment exists without being active today.

Three records, not one enormous form:

| Record | Purpose | Tables |
| --- | --- | --- |
| The person | permanent identity, contacts, family | `accounts`, `profiles`, `account_contacts`, `learn_guardians` |
| The application | the workflow: one attempt, one year | `learn_applications`, `…_documents`, `…_files`, `…_events` |
| The enrollment | a school year, with effective dates | `learn_enrollments` |

## 2. The eight stages

| # | Stage | Done when |
| --- | --- | --- |
| 1 | Registration | the application exists, for a year and a grade |
| 2 | Identity check | no possible duplicate is left unsettled |
| 3 | Application | every required field is filled and it was submitted |
| 4 | Documents | every required document is **verified** (received is not verified) |
| 5 | Review | the checklist is done and the reviewer marked it ready |
| 6 | Admission | the decision is *admitted* (and accepted, if the school requires it) |
| 7 | Enrollment | the enrollment record exists |
| 8 | School systems | courses joined, family linked, record written — or the exception is resolved |

The application page draws these as a stepper, says in words what is stopping
the current one, and puts the button to fix it beside it.

### Statuses

Application: `draft · submitted · incomplete · under_review · changes_requested ·
awaiting_decision · waitlisted · admitted · rejected · withdrawn`.

Enrollment: stored `enrolled · suspended · transferred · withdrawn · completed`;
shown as `scheduled · active · …` from the dates.

The two sets of words are never mixed.

## 3. Who may do what

Each step is its own permission, so the people who check the papers are not the
people who decide, and neither is the person who creates the enrollment.

| Permission | Held by | Does |
| --- | --- | --- |
| `enrollment.read` / `write` | administrator, registrar, admissions | see the queue; start, edit, assign, note, mark a paper received |
| `enrollment.verify` | administrator, registrar | start review, verify/return/waive documents, tick the checklist, settle duplicates, request corrections |
| `enrollment.decide` | administrator, admissions | admit, waitlist, decline, reconsider, reopen; set a rule aside with a reason |
| `enrollment.activate` | administrator, registrar | enroll; suspend, transfer, withdraw, complete; re-enrol |
| `enrollment.sensitive` | administrator | read restricted notes and restricted documents |
| `enrollment.settings` | administrator | change what the school asks for |

A family reaches only the applications it made (or the school made for its
children) and sees where things stand and what was asked of it — never the
review checklist, the possible matches, internal notes or how a decision was
weighed. The API does not send them.

A registrar or admissions reviewer who is not an administrator signs in to the
school console and finds one place in it: Enrollment.

## 4. The administrator's workspace

**Applications** — saved views (*My queue, In progress, Needs documents, To
verify, Ready to decide, Ready to enroll, Offers out, Waitlist, Overdue,
Closed, All*), each with its count; search by name, ENR number, admission
number, guardian or previous school; filters for grade, type, owner and
status; sortable columns; paging; bulk assignment; CSV export. A row shows the
applicant, progress, the next step in words, the owner and when it last moved;
a possible duplicate is flagged on the row.

**The record** — the stepper; *What happens next*; four tabs:

- *Application* — the student, the place, parents and guardians, contact,
  emergency contact, educational background, restricted information, consent
  (with the policy version and the moment). Saved with a version check, so two
  people editing the same record do not overwrite each other.
- *Documents* — the checklist. Attach a scan, view it, verify it (after seeing
  it), return it with a reason, or waive it. A family sees the reason.
- *Review* — the checklist, eligibility (age on the cut-off day, seats), every
  possible duplicate to settle, brothers and sisters already here, the owner,
  the decision, corrections asked for, internal notes.
- *History* — who did what, from what to what, and why. Insert-only.

**Deciding** — admit, waitlist or decline, from one dialog. A full grade or a
child younger than the grade asks for are *soft* stops: they can be set aside,
by someone who may decide, with a reason that is kept.

**Enrolling** — start day, grade, the student's sign-in (new student) or their
existing account (returning), family access, and courses. This creates the
enrollment and then sets things up around it.

**Enrolled** — every enrollment with its dates, courses and set-up state;
suspend, resume, transfer out, withdraw, complete the year (each ends the year
on a date and says whether to also take the student off their rosters).

**Capacity** — seats by grade: filled, left, applying, waitlisted.

**Requirements** — school years, grades with seats and minimum ages, the
age-counting day, documents by grade and kind of application (marked restricted
where they should be), the review checklist, whether an offer must be accepted
and for how long, the consent statement and version, admission number format.

**Student 360 → Enrollment** — a student's years and every application behind
them.

## 5. The family's side

Applications, in the family view: start an application for a child, save it and
come back, add documents, review, send. Four short steps. After sending, a plain
status: *with the school · waiting for documents · the school needs something ·
being reviewed · offered a place · enrolled* — with what is asked of the family
and a short list of updates. A returning child is re-enrolled in one press, and
the server picks the next grade.

## 6. What happens when a student is enrolled

Enrolling is one transaction (the enrollment exists and the application points
at it, or neither happened). Then, each step recorded and retryable:

1. the student's account is linked or made;
2. the contact card is filled — only where it was empty;
3. each guardian with an email is linked (an account is made when the school
   gives them a first password);
4. the family record is written — *Enrollment*, and *Student* and *Emergency
   contact* if the school had not already written them;
5. the student joins the chosen courses — on their start day, not before.

A step that cannot be done leaves a visible exception on the enrollment and
**never un-enrols anybody**. Running activation again returns the same
enrollment.

## 7. Rules the school cannot switch off

- A possible duplicate is settled by a person before a decision. Brothers and
  sisters (same family, different first name) are shown, not flagged.
- A file attached is *received*; only a person makes it *verified*.
- Approving and enrolling are separate acts, by separate permissions.
- One live enrollment per student per school year (a unique index).
- Every change leaves a line: actor, time, from, to, why. There is no route that
  changes or removes one.
- Restricted notes and documents are read by administrators, and by the family
  that wrote them.
- No identity number is required by default. Where a school or the law asks for
  one, it is added as a restricted document, with the reason beside it.

## 8. India, and any school that is not the default

School years, grades, boards and the documents asked for are configuration,
not code. A document can apply to some grades or kinds of
application only. Minimum age is counted on a day the school sets. A transfer
carries the previous school and the transfer-certificate number. Names are
stored as written, in any script. There is no billing in enrollment.

## 9. API

`/api/v1/` — `enrollment/settings` (GET, PUT) · `enrollment/summary` ·
`enrollment/team` · `enrollment/lookup` · `enrollment/reenrol` · `applications`
(GET, POST) · `applications/bulk` · `applications/:id` (GET, PATCH) ·
`applications/:id/actions/:action` · `applications/:id/documents/:key` (PUT) ·
`…/file` (GET, POST) · `family/applications` · `enrollments` ·
`enrollments/:id/actions/:action`.

Actions on an application: `submit · resubmit · start_review · request_changes ·
mark_ready · check · resolve_duplicate · override · approve · waitlist · reject ·
reconsider · withdraw · reopen · accept · decline · assign · note · activate`.
Actions on an enrollment: `suspend · resume · withdraw · transfer · complete ·
reschedule · place · resync`.

A refused step is a `409` carrying `blockers`. A create sent twice with the same
`clientKey` returns the same application.

## 10. Proof

- `api/scripts/test-enrollment.mjs` — 26 rules, no server.
- `api/scripts/prove-enrollment.mjs` — 48 steps over HTTP as an administrator, a
  registrar, an admissions reviewer, a teacher and a family, ending with the
  refusals.
- `api/scripts/check-boundaries.sh` — the layers hold.

## 11. Not here yet — said plainly

The formal procedure around this workflow (enquiries, assessments, letters,
class allocation, reports and the register) is in `OEDU_ADMISSIONS_PROCESS.md`,
and several things this section used to list are now built: interviews and
entrance assessments are scheduled and recorded, letters are written and can be
delivered in the app, and a child is seated in a class when enrolled. What
remains:

- **No WhatsApp or SMS sending.** The in-app inbox exists; sending outside the app
  belongs to a messaging account the school has not connected. Letters can be
  printed or copied as text.
- **Scans are held in the database, up to 700 KB each.** A larger scan needs
  object storage, which the platform does not have yet.
- **No clock.** Course placement that waits for a start day runs the first time
  the Enrollment page or list is opened after that day.
- **No bulk import** of applications or enquiries.
