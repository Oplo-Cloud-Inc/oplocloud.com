/* ==========================================================================
   Admission letters — what the school writes to a family at each step.

   Pure functions. Nothing here reads the database or the clock: the route
   hands over everything a letter says (the child, the class, the dates, what
   is outstanding) and gets back a document it can number and keep. That makes
   a letter reproducible from its inputs and testable without a server, and it
   is why a letter stored years ago still reads exactly as it did.

   A letter is { refNo, date, school, to, subject, salutation, blocks, closing }.
   `blocks` are paragraphs, lists and one table; nothing in them is markup, so
   a screen, a printer and a chat message can each draw the same letter their
   own way.

   Two rules the wording holds:
     · A letter says only what the school has decided. The offer letter exists
       only for an admitted application, the regret letter for a declined one.
       Which step may issue which letter is the route's, and is in guard.js.
     · A letter never mentions money. OEdu holds no fees; whatever the school
       asks of a family beyond this is said by the office, in its own words.
   ========================================================================== */

import { LETTER_KINDS } from "./enrollment.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* 2026-10-18 → 18 October 2026. Anything else is returned as it was written. */
export function longDay(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ""));
  return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : String(ymd || "");
}

/* 14:30 → 2:30 pm. */
export function clock(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ""));
  if (!m) return String(hhmm || "");
  const h = +m[1];
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? "am" : "pm"}`;
}

export const yearText = (y) => (/^\d{4}-\d{4}$/.test(String(y || "")) ? y.slice(0, 4) + "–" + y.slice(7) : String(y || ""));

// Short codes in a reference number: SFHS/ADM/2026-27/0012/OFR
export const KIND_CODE = { acknowledgement: "ACK", deficiency: "DEF", call: "CALL", offer: "OFR", waitlist: "WL", regret: "REG", confirmation: "CNF" };
export const KIND_NAME = {
  acknowledgement: "Acknowledgement of application", deficiency: "Documents and information required",
  call: "Call for assessment", offer: "Offer of admission", waitlist: "Waiting list", regret: "Regret",
  confirmation: "Confirmation of admission"
};

/* The reference a letter carries: school code, the admission year, the application, the kind, and which
   time it was issued when it is not the first. */
export function referenceNo({ code, year, seq, kind, n }) {
  return [code || "ADM", "ADM", String(year || "").replace(/^(\d{4})-\d{2}(\d{2})$/, "$1-$2"), String(seq).padStart(4, "0"),
          KIND_CODE[kind] + (n > 1 ? "-" + n : "")].join("/").replace(/^ADM\/ADM\//, "ADM/");
}

/* Which kinds an application can have right now, from where it stands. The route adds the permission. */
export function lettersAvailable({ status, enrolled, submitted, outstanding, scheduled }) {
  const out = [];
  if (submitted) out.push("acknowledgement");
  if (outstanding) out.push("deficiency");
  if (scheduled) out.push("call");
  if (status === "admitted" && !enrolled) out.push("offer");
  if (status === "waitlisted") out.push("waitlist");
  if (status === "rejected") out.push("regret");
  if (enrolled) out.push("confirmation");
  return out;
}

/* Which power issues which letter: the people who check papers write about papers, only those who decide write
   about a decision, and only the one who enrolled the student confirms the admission. */
export const LETTER_NEED = { acknowledgement: "write", call: "write", deficiency: "verify", offer: "decide", waitlist: "decide",
                             regret: "decide", confirmation: "activate" };

const REASON_LINE = {
  no_seat: "all the seats in the class are filled",
  ineligible: "the application does not meet the conditions of eligibility for the class",
  incomplete_file: "the application could not be completed",
  failed_assessment: "the child did not meet the requirement of the assessment for the class",
  duplicate: "the school already holds an application for the same child"
};

const p = (text) => ({ t: "p", text });
const list = (items) => ({ t: "list", items });

/* `d` is what the route gathered:
   school { name, address, contact, place }, refNo, date, addressee, address,
   student, grade, className, year, appNo, admissionNo, startsOn, offerUntil, acceptanceRequired, replyBy,
   outstanding [{ label, note }], corrections [text], sessions [{ label, onDate, atTime, venue }],
   bring [label], waitlist { position, of }, rejectReason, signatory, designation. */
export function renderLetter(kind, d) {
  if (!LETTER_KINDS.includes(kind)) throw new Error("No such letter: " + kind);
  const who = d.student || "the child";
  const place = d.className ? `${d.className}` : d.grade;
  const blocks = [];
  let subject;

  switch (kind) {
    case "acknowledgement": {
      subject = `Acknowledgement of application — ${who}, ${d.grade} (${yearText(d.year)})`;
      blocks.push(p(`We acknowledge, with thanks, the receipt of your application for the admission of ${who} to ${d.grade} for the academic session ${yearText(d.year)}. ` +
        `Your application number is ${d.appNo}; please quote it in every communication with the school.`));
      blocks.push(p("The application will now be taken through the verification of documents" +
        (d.assessmentsAsked ? ", the assessment" : "") + ", review by the admissions committee and a decision. The school will write to you at each stage."));
      if ((d.outstanding || []).length) {
        blocks.push(p("The following documents have not yet been received. Please send them to the admissions office:"));
        blocks.push(list(d.outstanding.map((o) => o.label)));
      }
      blocks.push(p("Receipt of this application does not assure admission. Admission is subject to the availability of seats and to the school's admission policy."));
      break;
    }
    case "deficiency": {
      subject = `Documents and information required — application ${d.appNo}`;
      blocks.push(p(`On scrutiny of the application for the admission of ${who} to ${d.grade} (${yearText(d.year)}), the following are required to complete the file:`));
      const items = [...(d.outstanding || []).map((o) => o.label + (o.note ? ` — ${o.note}` : "")), ...(d.corrections || [])];
      blocks.push(list(items));
      blocks.push(p(`Please let the admissions office have them${d.replyBy ? " on or before " + longDay(d.replyBy) : " at the earliest"}. ` +
        "The application cannot be taken forward until the file is complete."));
      break;
    }
    case "call": {
      subject = `Call for assessment — ${who}, ${d.grade}`;
      blocks.push(p(`With reference to application ${d.appNo} for the admission of ${who} to ${d.grade} (${yearText(d.year)}), you are requested to bring the child for the following at the time and place given:`));
      blocks.push({ t: "table", head: ["For", "Date", "Time", "Venue"],
        rows: (d.sessions || []).map((s) => [s.label, longDay(s.onDate), s.atTime ? clock(s.atTime) : "—", s.venue || "The school office"]) });
      blocks.push(p("Parents should accompany the child. Please arrive fifteen minutes early and carry this letter" +
        ((d.bring || []).length ? " and the originals of the following documents for verification:" : " and the original documents for verification.")));
      if ((d.bring || []).length) blocks.push(list(d.bring));
      blocks.push(p("If you cannot attend on the day, please tell the admissions office beforehand so that another time can be arranged."));
      break;
    }
    case "offer": {
      subject = `Offer of admission — ${who}, ${d.grade} (${yearText(d.year)})`;
      blocks.push(p(`We are pleased to inform you that, on the recommendation of the admissions committee, ${who} has been offered admission to ${place} for the academic session ${yearText(d.year)}.` +
        (d.admissionNo ? ` The admission number is ${d.admissionNo}.` : "")));
      if (d.acceptanceRequired) {
        blocks.push(p(`To hold the seat, please confirm your acceptance in writing at the school office on or before ${longDay(d.offerUntil)}. ` +
          "If we do not hear from you by then, the seat may be offered to another child."));
      } else {
        blocks.push(p("The seat is confirmed. Please complete the formalities with the school office before the date of joining."));
      }
      if (d.startsOn) blocks.push(p(`The date of joining is ${longDay(d.startsOn)}.`));
      if ((d.bring || []).length) {
        blocks.push(p("At the time of joining, please bring the originals of:"));
        blocks.push(list(d.bring));
      }
      blocks.push(p("This offer is made on the particulars given in the application. Admission may be withdrawn if any of them is found to be incorrect."));
      break;
    }
    case "waitlist": {
      subject = `Application on the waiting list — ${who}, ${d.grade}`;
      blocks.push(p(`Thank you for your application for the admission of ${who} to ${d.grade} for ${yearText(d.year)}. ` +
        "We regret that no seat is available in the class at present."));
      blocks.push(p("The application has been placed on the waiting list" +
        (d.waitlist ? `, at position ${d.waitlist.position} of ${d.waitlist.of}` : "") +
        ". If a seat becomes available, the school will contact you. A place on the waiting list is not an offer of admission, and the position may change as the school's priorities in its admission policy are applied. You need not apply again."));
      break;
    }
    case "regret": {
      subject = `Application for admission — ${who}, ${d.grade}`;
      const why = REASON_LINE[d.rejectReason];
      blocks.push(p(`Thank you for your application for the admission of ${who} to ${d.grade} for the academic session ${yearText(d.year)}, and for the interest you have shown in the school.`));
      blocks.push(p("After due consideration, the school regrets that it is unable to offer admission" + (why ? `, because ${why}` : "") + "."));
      blocks.push(p("If you believe that something has been overlooked, you may write to the Principal, quoting the application number " + d.appNo + ", and the application will be reconsidered."));
      break;
    }
    case "confirmation": {
      subject = `Confirmation of admission — ${who}`;
      blocks.push(p(`This is to confirm that ${who} has been admitted to ${place} of the school for the academic session ${yearText(d.year)}` +
        (d.admissionNo ? `, with admission number ${d.admissionNo}` : "") + (d.startsOn ? `, with effect from ${longDay(d.startsOn)}` : "") + "."));
      if (d.classTeacher) blocks.push(p(`The class teacher is ${d.classTeacher}.`));
      blocks.push(p("Regular attendance and observance of the school's rules are expected of every student. Please keep this letter for your records."));
      break;
    }
  }

  return {
    refNo: d.refNo, date: d.date, school: d.school || {},
    to: [d.addressee ? `${d.addressee}` : "The Parent / Guardian", d.relation ? d.relation : `Parent / Guardian of ${who}`, ...(d.address ? String(d.address).split(/\r?\n/).filter(Boolean) : [])],
    subject, salutation: `Dear ${d.addressee || "Parent / Guardian"},`, blocks,
    closing: ["Yours sincerely,", d.signatory || "Admissions Office", ...(d.designation ? [d.designation] : []), (d.school && d.school.name) || ""].filter(Boolean)
  };
}

/* A letter as plain text, for a chat message or an email draft. */
export function letterText(doc) {
  const out = [];
  if (doc.school && doc.school.name) out.push(doc.school.name);
  out.push(`Ref: ${doc.refNo}`, `Date: ${longDay(doc.date)}`, "", ...doc.to, "", `Subject: ${doc.subject}`, "", doc.salutation, "");
  for (const b of doc.blocks) {
    if (b.t === "p") out.push(b.text, "");
    else if (b.t === "list") out.push(...b.items.map((x) => "• " + x), "");
    else if (b.t === "table") out.push(...b.rows.map((r) => b.head.map((h, i) => `${h}: ${r[i]}`).join(" · ")), "");
  }
  out.push(...doc.closing);
  return out.join("\n");
}
