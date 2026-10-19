# OEdu Admissions — the formal procedure

Admission to a school is a controlled procedure, not a data-entry screen. This is
what the admissions office runs in OEdu: nine steps, each with an owner, a record
and a time the school holds itself to; the paper that goes to a family at each
step; and the figures and registers a school is asked for at the end.

It builds on the workflow in `OEDU_ENROLLMENT_WORKFLOW.md` (the application, its
documents, review and decision). That document says how an application moves;
this one says what surrounds it and how a school runs it as a procedure.

The principle is the same: **every application has an owner and a next step,
every decision has a reason, and every change is on the record.** Nothing here
sends anything on its own, and nothing here is money.

---

## 1. The nine steps

| # | Step | What happens | Who | Kept as | Time |
| --- | --- | --- | --- | --- | --- |
| 1 | Enquiry | A family asks. The child, the class, how they heard of the school are written down; a call back is promised. | Admissions officer | Enquiry record and log | Call back within 2 days |
| 2 | Registration | The application is registered after checking the child is not already known. An application number is issued. | Admissions officer | Application number, history | Same day |
| 3 | Application form | Every particular is filled in, the parents' details taken, the family makes its declaration, the form is sent in. | Family or officer | The application form | At registration |
| 4 | Documents | Each document is received, then checked against the original and marked verified, returned with a reason, or waived with a reason. | Registrar | Status and who checked | Review begins within *dueDays* |
| 5 | Assessment | Where the school asks for a test or an interaction, it is scheduled, a call letter issued, the result recorded. | Admissions officer and panel | Session, result, remarks | As scheduled |
| 6 | Review | The checklist is completed, any possible duplicate settled, the application marked ready. | Registrar | Checklist, history | Before the decision |
| 7 | Decision | Admit, waitlist or decline. A full class, a younger child or an assessment not met takes a recorded reason to admit. | Admissions reviewer or administrator | Decision, reason, note | Within *decisionDays* |
| 8 | Offer | An offer letter is issued; where the school requires it, the family accepts within *offerDays*. | Admissions reviewer | Offer letter, acceptance | *offerDays* to accept |
| 9 | Enrolment and class | The registrar sets the start day, chooses the class and section, creates the student's sign-in and the family's; the child appears in the class register; a confirmation letter is issued. | Registrar | Enrolment, roster, confirmation | Before the first day |

The times in italics are the school's own settings. The **Procedure** tab draws
this table from them, with the school's calendar, documents, assessments and
priorities, and prints it as a document.

## 2. Who may do what

Separation of duties is built in: the people who check papers are not the people
who decide, and neither is the person who enrols.

| Action | Administrator | Registrar | Admissions |
| --- | :-: | :-: | :-: |
| Record an enquiry; register and edit an application; schedule and record an assessment | ✓ | ✓ | ✓ |
| Verify, return or waive a document; start a review; settle a possible duplicate | ✓ | ✓ | — |
| Admit, waitlist, decline; set aside a seat, age or assessment rule with a reason | ✓ | — | ✓ |
| Enrol; choose the class; create sign-ins | ✓ | ✓ | — |
| Letters: acknowledgement, call | ✓ | ✓ | ✓ |
| Letters: documents required, confirmation of admission | ✓ | ✓ | — |
| Letters: offer, waiting list, regret | ✓ | — | ✓ |
| Read restricted notes and health information | ✓ | — | — |
| Change what the school asks, the calendar, the letters | ✓ | — | — |

A family reads its own applications only: where things stand, what is asked of
it, the date and place of any assessment (never the result, the panel or the
remarks), and the letters written to it.

## 3. What was added

### 3.1 Enquiries (step 1)

A family that has asked, before it applies: the child, the class, the parent, a
phone or email, how they heard of the school, who referred them, when somebody is
to ring back. A callback is promised by default two days on. Calls, visits and
notes are lines in an insert-only log; closing an enquiry needs a reason and can be
undone. **Start the application** carries the enquiry's particulars into
registration, links the two, and keeps how the family heard of the school, so the
office can say where its applications come from. Recording a family twice is
noticed and warned about, never refused.

### 3.2 Registration and the application form (steps 2 and 3)

*New application* is a registration: the child (name, date of birth, gender), what
the family is asking for (year, class, kind, joining date, priority category),
how they came, and the parent or guardian. Beside it is the procedure, with this
step marked, and **what this school will ask a family applying for this class**:
the documents and assessments, worked out live from the class chosen. If the
school has published a calendar, it says whether registration is open.

The application is then a lettered form, as a school's paper form is:

| | Section | Notable particulars |
| --- | --- | --- |
| A | The student | nationality, mother tongue, blood group, category |
| B | Admission sought | priority claimed, transport, a brother or sister at the school, how the family heard of the school |
| C | Parents and guardians | occupation, qualification, employer |
| D | Address and contact | PIN code, district, state, WhatsApp opt-in (asked, never assumed) |
| E | Emergency contact | |
| F | Previous school | result, medium, transfer certificate |
| G | Health and support | allergies, conditions, special needs — restricted |
| H | Declaration | the policy version and the moment are recorded |

An index beside the form says which sections are complete and how many particulars
each still needs; a section that is blank and not required reads **Optional**, not
complete. **Print the application form** produces the paper form with letterhead,
a box for the photograph, the documents enclosed, the declaration with a line to
sign, and a panel *for office use*; **Print a blank form** gives one for a family
to write on.

What a school insists on beyond the nine particulars every application needs is
its own setting (*Required particulars*). An Indian school's default is gender and
a PIN code. The family's own editor asks for exactly what the school requires, and
a save of a few particulars changes only those: what a smaller form never showed
is not blanked.

### 3.3 Assessment (step 5)

What a school may ask of a child before it decides — an entrance test, an
interaction, an interview — is configured per class and per kind of application,
required or optional. A **session** has a date, time, venue and panel and ends in a
result (qualified, did not qualify, left open) with optional marks and remarks. A
required assessment must have a result before an application can be decided; a
missed or called-off session is not a result. Not qualifying is not a silent
refusal: it is a soft stop that the person deciding may set aside with a reason,
exactly as a full class or a younger child can. The **Assessments** tab is the
desk for a day: who is coming, where, how each went, and a printable day sheet.

### 3.4 Letters

Seven letters, written from the record by pure rules (`services/letters.js`):
acknowledgement, documents and corrections required, call for assessment, offer
of admission, waiting list (with the child's position), regret, confirmation of
admission. Each is shown as the page it will be, **numbered when issued**
(`SFHS/ADM/2026-27/0012/OFR`: the school, the year, the application, the kind; a
second copy takes `-2`), kept exactly as written, and cannot be changed afterwards
— only another written. Which letter applies depends on where the application
stands; who may issue it follows §2. A letter never mentions money and the regret
letter names a ground, never a judgment of the child.

How a letter reaches the family is recorded when it is issued: printed, handed
over, **sent in the app** (to the family's inbox, when they have an account),
sent on WhatsApp or by email (copied as text), or posted. OEdu does not send
WhatsApp or email itself.

### 3.5 Waiting list

Children waitlisted for a class are ordered by the school's *priority categories*
(an ordered list the school sets), then by the day they joined. The application and
the waiting-list letter say the position.

### 3.6 Class allocation (step 9)

Enrolling used to put a child in courses only; they did not appear in any class
register and their record stayed blank. Now the registrar chooses the class and
section when enrolling (or afterwards, from *Enrolled → Seat in a class*). The
choice is checked before anything is made: it must be one of the school's classes
for that year and grade, and a full class takes a reason that is kept. The child
is seated in the register, and **what the application already said is written onto
the school's own roster row** — gender, category, blood group, mother tongue, PIN
code, parents, the primary contact, transport, WhatsApp opt-in, special-needs
information, previous school, admission number and date — so the office does not
type it a second time. What the office already wrote is never overwritten. An
Indian school's enrolment with no class is shown as unfinished until one is chosen.

### 3.7 Reports and the register

*The cycle in numbers*: enquiries → applications → assessed → offered → seat taken
up → enrolled, each a count of children, with how many applications began as an
enquiry; how long the school took against its own promise (*decisionDays*); by
class (seats, applied, offered, joined, waiting, declined); where families came
from; priority and category counts (counts only). *The admission register* is one
line per enrolled child in the order of their admission numbers, with date of
admission, parents, address, previous school and transfer certificate, class and
section, and leaving date and reason; printed landscape for the Principal's
signature. A category appears only to an administrator.

## 4. What the school controls (Requirements)

Assessments (what, required or optional, for which classes and kinds); priority
categories in order; required particulars; the admission calendar per year
(registration opens and closes, assessments, results, offers, classes begin);
letters (code, address, contact, place, signatory, designation); and the existing
years, classes and seats, documents, review checklist, offers, consent and
admission numbers. A new school starts with defaults and nothing to configure.

## 5. Rules that cannot be switched off

- A possible duplicate is settled by a person before a decision.
- A file attached is only *received*; a person verifies a document.
- Approving and enrolling are separate acts by separate people.
- One live enrolment per student per school year.
- Every change leaves a line (who, when, from, to, why); nothing is rewritten.
- Restricted notes and health information are read by administrators and by the
  family that wrote them.
- No identity number is required unless the school adds it; Aadhaar is never stored.
- A rule about age, seats or assessment is set aside only with a reason, by the
  person who decides.

## 6. API

All under `/api/v1/` and refused to anyone without the matching power.

| | |
| --- | --- |
| `enquiries` GET, POST · `enquiries/:id` GET, PATCH · `enquiries/:id/actions/:action` | `note · contacted · visit_booked · visited · close · reopen · assign` |
| `applications/:id/sessions` POST · `…/sessions/:sid` PATCH | schedule; move, call off, mark absent, record the result |
| `applications/:id/letters/preview?kind=` GET · `…/letters` POST · `…/letters/:lid` GET | write, issue, read |
| `enrollment/sessions?from=&to=` | the assessment desk |
| `enrollment/reports?year=` · `enrollment/register?year=` | figures; the register |
| `enrollment/classes?year=&grade=` | classes a child can be seated in |
| `applications/:id/actions/activate` takes `classId`, `classReason` · `enrollments/:id/actions/seat` | class allocation |

Migration `0033_admissions_office.sql` adds `learn_enquiries`, `learn_enquiry_log`,
`learn_application_sessions` and `learn_application_letters` (letters are
insert-only, the reference unique per school). Settings gain `assessments`,
`priorities`, `requiredFields`, `calendar`, `letters` and `decisionDays`.

## 7. Proof

- `api/scripts/test-enrollment.mjs` — 41 rules, no server (settings, the assessment
  gate, the waiting-list order, every letter's wording and numbering, the funnel and
  the register, the roster mapping).
- `api/scripts/prove-admissions.mjs` — 30 steps over HTTP as an administrator, a
  registrar, an admissions officer, a teacher and a family: enquiry to enrolment and
  class, ending with what each is refused. It puts the school's settings back.
- `api/scripts/prove-enrollment.mjs` — the original 48 steps, still passing.

## 8. Not here — said plainly

- **No WhatsApp or SMS sending.** A letter is delivered in the app, printed, or
  copied as text; the office says how it was delivered. Sending belongs to a
  messaging account the school has not connected.
- **No fees, registration fee or free-quota ledger.** OEdu holds no money. A seat
  reserved by law for a group is a *priority category* and a document, not a ledger
  or a lottery.
- **No interview slot planner.** A session has a date and time chosen by a person;
  there is no calendar of panel members or automatic booking.
- **Scans are held in the database, up to 700 KB each.**
- **No bulk import of enquiries or applications.**
- **Desktop only.** The new pages have no phone layout yet.
- **A new school's letters are headed with its name only** until the address,
  contact and signatory are set under Requirements.

## 9. Where it lives

`api/migrations/0033_admissions_office.sql` · `api/src/services/{enrollment,letters,admissions,india}.js` ·
`api/src/routes/{enrollment,admissions}.js` · `api/src/repo/d1.js` (the admissions
block) · `learn/enroll.js` (workspace, registration, form, assessment, letters,
class allocation, requirements) · `learn/admit.js` (enquiries, the assessment desk,
reports and register, the procedure) · `learn/letter.js` (a letter as a page, shared
with the family's page) · `learn/parent/apply.js` (the family's dates and letters).
