# State tables for the screens the plan adds (D2)

Before a screen is built it has a table of its seven states with the exact en-IN words, in the brief's
voice (Part 7.1): second person, sentences of 20 words or fewer, no jargon, no vendor name, verbs from
the dictionary in `DESIGN.md`. The Hindi values are written with the screen, in `hi-IN.js`, never here.
Words in `{braces}` are filled by the screen. A state that cannot happen says so and why.

Shared patterns, from the brief's T9, used by every table below:

| State | Pattern |
|---|---|
| Loading | Nothing for 300 ms, then a skeleton in the shape of the screen. A button that is working keeps its width and shows a spinner. |
| Error, can retry | A banner inside the component: "Could not load {thing}. Try again." with a **Try again** button. |
| Error, our side | "Something went wrong at our end. Quote request id {id}." (the `common.server_error` string; the id is the one in the response) |
| Offline | A banner at the top: "You are offline. {n} changes will send when you are back." Reading what was loaded still works. |
| No permission | A card that says who to ask: "Only {role} can {verb}. Ask {name} ({role})." |
| Not built | Never in a menu. A deep link says: "This is not available for your school yet." |

Where each is exercised: a screen's states are shown by its UI smoke test when it is built. The first
table, **module switches**, is built in this wave (O8) and `api/scripts/test-shell.mjs` shows its states;
the others are exercised when their screens arrive (the family bundle and fees are wave 3 and later).

| # | Screen | Who | Built in |
|---|---|---|---|
| 1 | Module switches | school administrator | O8 (now) |
| 2 | Family sign-in | parent or guardian, on a phone | O9, family bundle |
| 3 | Printed invite sheet | school office | O9 |
| 4 | Outbox | school office | Communicate |
| 5 | Payment return | parent or guardian | fees slice |
| 6 | Unmatched payments | accounts office | fees slice |
| 7 | Receipt, partly paid and cancelled | parent, accounts office | fees slice |
| 8 | Consent status | parent or guardian | family bundle |

---

## 1. Module switches (Admin › Settings › Modules, template T7)

One card per module that a school may turn on: Family, Fees, Homework, Lesson plans, Messages. All start
off. A switch applies to the school only; the global route flags in `learn/shell/routes.js` stay the hard
off-switch, so a module that is not built cannot be turned on from here. The new navigation frame has no card
here (a school could switch off the page it would switch it back on from): it is `PUT /school/modules {"frame": false}`
or `?frame=off` for one browser, see "Switches" in `DESIGN.md`.

| State | What the person sees | Exact copy |
|---|---|---|
| Loading | five skeleton cards | none |
| Empty | cannot happen: the five modules are always listed | |
| Ready | a card per module: name, one sentence, a switch, **Save** (enabled only when the switch changed) | **Family**: "Parents and guardians sign in to see attendance, circulars and results." **Fees**: "Fee heads, instalments, receipts and payments." **Homework**: "Teachers set homework and families see it." **Lesson plans**: "Teachers plan their lessons by class and week." **Messages**: "Staff and families talk in one place." Switch label: "On for this school". Footer: "Changes are recorded in the audit log." |
| Success | the card shows the new state; a toast | "Family is on for your school." / "Fees is off for your school." |
| Partial | a module that is not built: the switch is off and disabled with its reason; **Preview as family** is disabled until the family app exists | "This is not available for your school yet." / "The family app is not ready to preview." |
| Error | on load: a banner with **Try again**; on save: the card keeps the old state and says so | "Could not load the module switches. Try again." / "Could not save. Nothing was changed. Try again." / our-side string above |
| Offline | the banner; **Save** disabled | "You are offline. Changes cannot be saved until you are back." |
| No permission | the cards are read-only, switches disabled, no **Save**, one line under the heading | "Only a school administrator can change this. Ask your school administrator." (as built: the page is reached only from the administrator's console, so the name of who to ask is not looked up) |

## 2. Family sign-in (`/family/{school}/signin`, 360 px first)

A mobile number, a six-digit code by SMS or WhatsApp, or a printed code from the school. The screen never
says whether a number is known to the school.

| State | What the person sees | Exact copy |
|---|---|---|
| Loading | **Send code** keeps its width and shows a spinner; the code step shows the same while checking | spoken: "Sending the code." / "Checking the code." |
| Empty (first visit) | heading, one field with +91 in front, one primary, one link | "Sign in" · "Use the mobile number the school has for you." · field "Mobile number", helper "10 digits" · **Send code** · link "I have a printed code" |
| Code sent | the code step: six boxes, a resend countdown of 30 seconds | "If the school has this number, a code is on its way." · "Enter the 6-digit code" · "Send again in {seconds} seconds" · after the countdown: **Send the code again** |
| Error, code cannot be sent | a danger banner above the form; the number stays filled | "We could not send the code." with **Try SMS**, **Ask the office**, **Enter a printed code** |
| Error, wrong code | the boxes outlined, the message under them; after five tries the form closes for a while | "That code is not right. Check it and try again." / "Too many tries. Wait {minutes} minutes, or ask the office." |
| Expired session | the sign-in page with a warning banner; after signing in the person returns to where they were | "You were signed out. Sign in again to carry on." |
| Partial | a number on several schools shows a chooser first; a number with several children shows them on the next step | "Which school?" with one row per school · "Is this you?" (see the combined first sign-in in `docs/OEDU_INDIA_SCHOOL_OS_PLAN.md`, storyboard 2) |
| Success | Home, with the combined screen over it the first time | no toast; the person lands on Home |
| Offline | a banner; **Send code** disabled with its reason | "You are offline. Connect to the internet to sign in." |
| No permission | a staff account opens the family address | "This is the family app. Staff sign in on the school site." with a link |

## 3. Printed invite sheet (Students › Guardians › Invite sheets, template T2)

One A4 sheet per class, six invites to a page, each with a one-time code. Print layout is D12.

| State | What the person sees | Exact copy |
|---|---|---|
| Loading | skeleton rows | none |
| Empty | the empty state; the header primary is hidden (T2) | "No invite sheets yet" · "Print one sheet for a whole class. Each child's family gets its own code." · **Generate sheets** |
| Ready | one row per class: Class · Sheets · Used · Unused · Printed on · a ⋯ menu | counts read "Used 38 · Unused 7"; menu: **Reprint**, **Revoke** |
| Success | a toast with the way to print | "Sheets for Class VI-B are ready." with **Print** · "Reprinted for {child}." · "Code revoked." (no Undo: a revoked code must stay revoked) |
| Partial | a banner above the table, with the names | "Sheets are ready for 41 of 45 children. 4 have no guardian mobile number. See who." |
| Error | banner with **Try again**; nothing is changed on a failed generate | "Could not load the invite sheets. Try again." / "Could not make the sheets. Nothing was changed. Try again." |
| Offline | banner; **Generate sheets** and **Reprint** disabled | "You are offline. Printing needs the internet." |
| No permission | the card | "Only the school office can print invite sheets. Ask {name} (Office)." |
| Revoke | a confirm dialog naming the child | "Revoke the code for {child}?" · "The old code stops working at once. Print a new sheet to give the family another." · **Revoke code** |

## 4. Outbox (Communicate › Outbox, template T2)

Every message and circular the school sent, and where it got to. New status words for the dictionary:
**Queued** (info), **Delivered** (success), **Held** (neutral). **Sent**, **Failed** and **Retry** exist.

| State | What the person sees | Exact copy |
|---|---|---|
| Loading | skeleton rows | none |
| Empty | the empty state | "Nothing sent yet" · "Messages and circulars you send show here, with where each one got to." |
| Ready | Sent on · Title · To · Channel · Status; the row opens a drawer with each recipient | statuses: Queued, Sent, Delivered, Failed, Held |
| Failed row | the drawer lists each failure with the provider's own reason | "{channel} said: {provider message}" · **Retry** |
| Success | a toast after **Retry** | "Sending again. The outbox shows how it goes." |
| Partial | a line above the table | "1,795 delivered · 6 failed. See why." |
| Demo school | an info banner; every row is Held | "This is a demo school. Messages are held and nobody receives them." |
| Error | banner with **Try again** | "Could not load the outbox. Try again." |
| Offline | the banner; **Retry** disabled | "You are offline. Retrying needs the internet." |
| No permission | the card | "Only the school office can see sent messages. Ask {name} (Office)." |

## 5. Payment return (`/family/{school}/fees/payment/{payment}`)

Where the parent lands after the payment page. The screen asks the server, again every two seconds for up
to a minute, and never tells a parent to pay again unless the server says nothing was charged.

| State | What the person sees | Exact copy |
|---|---|---|
| Loading (Confirming) | a spinner and two lines | "Confirming your payment" · "This takes a few seconds. Please keep this page open." |
| Paid | a success mark, the amount, the receipt number | "Payment received" · "₹12,500 for {child}, Term 2 fees. Receipt no. {number}." · **View receipt** · **Back to fees** |
| Failed and not charged | a danger banner | "The payment did not go through" · "You have not been charged. Your fees are as they were." · **Try again** |
| Needs checking | a warning banner and the reference; no pay button | "We are checking your payment" · "Your bank has not told us yet. If money left your account, it is safe. We will message you within 2 working days. Do not pay again until we tell you." · "Reference {reference}" · **Ask the office** |
| Partial | the paid and the due amounts | "₹5,000 of ₹12,500 received. ₹7,500 is still due." · **Pay the rest** |
| Error | the polling fails; the screen keeps trying | "We could not check just now. Trying again." / after a minute: Needs checking |
| Offline | a banner; the payment is not lost | "You are offline. We will check again when you are back. Your payment is safe." |
| Empty | an unknown payment number | "We could not find this payment." · **Back to fees** |
| No permission | a guardian who is not the fee payer | "Only {name}, who pays the fees for {child}, can see this payment." |

## 6. Unmatched payments (Fees › Payments › Unmatched, template T2)

Money the payment provider reported that no child or invoice could be tied to.

| State | What the person sees | Exact copy |
|---|---|---|
| Loading | skeleton rows | none |
| Empty | the empty state (the good news) | "Every payment is matched" · "Payments that cannot be tied to a child show here." |
| Ready | Received on · Amount · Payer · Reference · Best match; the row opens a drawer with the people picker | **Match to a child** |
| Success | a toast naming the receipt | "Matched ₹12,500 to {child}. Receipt {number} issued." |
| Partial | in the drawer, when the amount is not what is due | "This is ₹500 less than what is due. It will be recorded as a part payment." |
| Error | banner with **Try again**; a conflict names the reason | "Could not load unmatched payments. Try again." / "Someone matched this payment a moment ago. Reload." |
| Offline | the banner; **Match to a child** disabled | "You are offline. Matching needs the internet." |
| No permission | the card | "Only the accounts office can match payments. Ask {name} (Accounts)." |

## 7. Receipt: partly paid and cancelled (record page and A5 print)

| State | What the person sees | Exact copy |
|---|---|---|
| Loading | skeleton of the receipt | none |
| Paid | the receipt, status **Paid** | "Receipt no. {number}" · "Paid ₹12,500 on {date}" |
| Partly paid | status **Partly paid**; the balance and its date | "Paid ₹5,000 · Due ₹7,500" · "The balance of ₹7,500 is due by {date}." |
| Cancelled | status **Cancelled**; a banner; the number stays and is never reused | "This receipt was cancelled on {date} by {name}." · "Reason: {reason}" · print: "Cancelled" in the header |
| Error | banner with **Try again** | "Could not load this receipt. Try again." |
| Offline | the last copy opened, with a line saying so | "Saved copy from {date}. You are offline." |
| Empty | an unknown receipt | "This receipt does not exist, or it is not for your child." |
| No permission | a parent opens another child's receipt | "You can see receipts for your own children only." |
| Success | after a payment | the Paid state, with **Print** and **Download** |

## 8. Consent status (family Account, and over Home the first time)

| State | What the person sees | Exact copy |
|---|---|---|
| Loading | skeleton of the card | none |
| Not given yet (empty) | the combined first-sign-in screen has the checkbox; later, a card with the choice | "The school may keep {child}'s records on this app." · link "What we keep and why" · **Agree and continue** |
| Given | a card | "You agreed on {date}." · link "What you agreed to" · **Withdraw consent** |
| Withdraw | a confirm dialog | "Withdraw your consent for {child}?" · "The app stops showing {child}'s records to you. The school keeps its own records. Ask the office if you want them removed." · **Withdraw consent** |
| Withdrawn | a card | "You withdrew your consent on {date}." · **Agree again** |
| Partial | open decision (O3): whether a second guardian's consent is needed | to be written with the decision |
| Success | a toast | "Your choice is saved." |
| Error | the choice is not applied | "Could not save your choice. Nothing was changed. Try again." |
| Offline | the controls are disabled; a consent change is recorded on the server or not at all | "Connect to the internet to change your consent." |
| No permission | a student opens the screen | "Consent is given by a parent or guardian." |
