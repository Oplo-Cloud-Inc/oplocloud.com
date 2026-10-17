# OEdu for an Indian school's administrator: are we ready?

Written 2026-10-17, from the code in this repository and the SFHS demo school (1,801 children, 74 staff, 68 classes). Scope is the administrator's console only. No other company's name appears here; the comparison is against "the incumbent ERPs" a school already runs.

## Verdict

**Not ready to launch. Ready to pilot, with conditions.**

An Indian school's office buys on five things: fees and receipts, WhatsApp to parents, the board and state lists, certificates, and a class register that matches how it works. OEdu had none of the five on 2026-10-16. As of this change it has the foundation under the third (identity numbers, consent, classes, checks, lists) and a place for the fourth. The first two are the ones a premium school decides on, and the first is held by a ruling of yours.

**What we can honestly say to an SFHS-sized school today:** one record for a child across classes; a consent and identity register with checks before anything is sent to a board; a configurable gradebook and a strong audit trail for marks; an admissions workflow that already counts age on 1 April.

**What we cannot say:** that it collects fees, messages parents on WhatsApp, prints a transfer certificate, produces a report card in ICSE bands, or loads a school's whole staff and roll in one go without hand work.

## Built in this change

| What | Where |
|---|---|
| A school has a region; `IN` turns on the India places in the console | migration `0024`, `organizations.region`, `/me` |
| Classes (X-C: class teacher, room, capacity, strength) | `learn_classes`, **India › Classes** |
| One typed row per child: admission number, roll, house, category, APAAR (12 digits, REFUSED, NOGEN), PEN (11 digits), Aadhaar (never kept past the last four), consent (verified / pending / withdrawn, by DigiLocker or form), both parents with +91 mobiles, WhatsApp opt-in, language | `learn_student_india`, `services/india.js` |
| Compliance page: what is on file, what blocks a list, by class; four lists as downloads; a fix opens the child | **India › Compliance** |
| Load a whole school from one CSV, checked before anything is written | **Load from a file** (1,801 rows in about a second locally) |
| Certificate requests as a register (transfer, bonafide, character, migration) | registry kind `certificate`, **India › Certificates** |
| Office-only access (administrator, principal reads; registrar writes) | `india.read`, `india.write` in `guard.js` |

Proof: `node api/scripts/test-india.mjs` (18 rule checks), `api/scripts/prove-india.mjs` (12 steps over HTTP, ending with the refusals). Counts on the demo school match the workbook exactly: 892 + 111 APAAR answers, 976 + 448 verified consents, 324 of 462 board-class children answered.

**Order of deploy matters.** `/me` now reads `organizations.region`, so apply migration `0024` *before* the API goes out. The new migration alone is harmless to the old API. CI already runs migrations before the API.

## What is still missing, in the order it blocks a sale

### Blocks any pilot

1. **Onboarding a whole school.** *Built 2026-10-17, local proof only; not deployed.* The people import (**Data Center › Imports › People**) now takes students, teachers and the office roles (an office role only from someone who may grant roles), makes every new account `invited` with no password and returns nothing secret, loads a file of any size in 200-row chunks, skips and names bad rows by line instead of refusing the file, links a parent's invited account to the child (`guardian_email`, `guardian_name`, `relationship`, `primary`), and matches people who already exist so a file can be run again. The SFHS roster (1,875 rows, 15 administrators) loads whole; the India details file then finds all 1,801 children. Proof: `api/scripts/prove-people-import.mjs`. **Still by hand:** each person sets their own password with `api/scripts/set-password.sh`, because there is no mail provider to send an invitation link; at 1,875 people that is the next thing to build (a one-time set-password link, which needs mail or a printed sheet).
2. **Fees and payments.** Instalments, concessions with approval, late fines, UPI and card, receipts, defaulter list, an accounting export. Every incumbent leads with this. **Held by your ruling of 2026-10-07; nothing built. Say "finance in" to plan it.** Also needs a payment provider account only you can open.
3. **WhatsApp, DLT SMS and push.** Circulars with read receipts are how a school talks to parents. Needs a WhatsApp Business account and an SMS sender registration (about ₹5,900); neither can be made from here.
4. **The boards' and the state's own file layouts.** We hold the data and check it; we do not yet write a board's upload file. The CISCE CAREERS layout and the UDISE+ student format were not found in any public source and need the specifications from the school or the board. The exports today are OEdu's own column order, and say so.

### Blocks a paid launch

5. **Locale everywhere.** Only the India screens write dates DD/MM/YYYY. Reminders still run on New York time; number grouping, rupee and the school's time zone are not settings. Hindi and Punjabi (Punjabi is compulsory to Class 10 in Punjab) are not offered.
6. **Report cards in Indian grading.** A course can bring its own scale, so A1 to E or 1 to 7 can be entered by hand, but there is no reusable named scale, no theory/internal split, no Term 1 / Term 2 / periodic tests / best-of-three, and marking periods are quarter, semester or year only.
7. **A class register.** Indian attendance is the class teacher's morning register, with a below-75% flag. OEdu's attendance is by section and period. RFID and biometric import are absent.
8. **Certificates that print.** The register exists; the printed certificate with a serial number does not, and a transfer certificate's no-dues check needs fees.
9. **Admissions as Indian schools run them.** Age cut-off exists and is configurable. Missing: priority categories (siblings, feeder school, EWS 25% allotment import), an audited digital draw of lots, admission fee online.
10. **Transport.** Routes, stops, buses, riders, pickup. The child's transport is a line of text today.
11. **Data-protection depth.** The consent state is a field. Missing: consent history (who, when, which wording), export and erasure requests, an audit trail of who read or changed personal data (only marks have one), and Indian hosting. The law's core rules apply from 13 May 2027.

### Later

House points, parent-teacher meeting booking, an Android app that works on a cheap phone and low data, two-factor sign-in, idle sign-out.

## Facts checked, and facts not

Checked against public sources today: an APAAR ID is 12 digits; REFUSED and NOGEN are the accepted answers on a CBSE candidate list when a parent declines or none could be made; a PEN is 11 digits. **Not verified:** how an APAAR number is built inside (a site that is not official gives a year / state / district / serial layout; it is not used here), CISCE's CAREERS file layout, UDISE+'s student fields and their rules. Nothing in the code depends on them.

## If we pilot

One school, one campus, running beside the school's existing ERP: the loaded roll, the compliance picture and the lists, plus the gradebook and the audit trail. Not fees, not parents' messages. That is a story we can keep every word of. Selling more than that today would be selling the roadmap.
