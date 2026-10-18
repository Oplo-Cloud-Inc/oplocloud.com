/* ==========================================================================
   The school's smaller records, as a registry.

   An event, a referral, a detention, a plan, a leave request, an invoice: each
   is a title, a status, perhaps a person it is about and a course it is in,
   a date, and a few fields of its own. They live in one table
   (learn_items); what makes each its own thing is its entry here — who may
   read it, who may write it, which fields it has, and what it tells people.

   A new kind is an entry, not a migration. The client builds its forms and
   tables from this registry (GET /item-kinds), so the API and the screens
   cannot disagree about what a referral is.

   Field: [key, label, type, required?, options?]
     type: text · longtext · number · date · time · select · student · person · course · check
   Policy (who reads / who writes):
     org      everyone in the school / staff
     staff    staff and teachers / staff and teachers
     office   the office (admin, principal, registrar) / the office
     subject  staff and teachers, the person it is about, their family / staff and teachers
     self     the person it is about and the office / the person, then the office decides
     money    the office, the person it is about and their family / the office
   ========================================================================== */

const S = (...o) => o;   // select options

export const KINDS = {
  event: {
    label: "Event", plural: "Events", policy: "org", about: "none", dated: true,
    statuses: ["scheduled", "canceled"],
    fields: [["place", "Place", "text"], ["audience", "For", "select", false, S("everyone", "students", "staff", "families")],
             ["start", "Starts", "time"], ["end", "Ends", "time"], ["rsvp", "Ask for a reply", "check"], ["about", "Details", "longtext"]],
    notify: "audience"
  },
  rsvp: {
    label: "Reply", plural: "Replies", policy: "self", about: "student", dated: false,
    statuses: ["yes", "no", "maybe"],
    fields: [["eventId", "Event", "text", true], ["guests", "How many", "number"]]
  },
  referral: {
    label: "Referral", plural: "Referrals", policy: "subject", about: "student", dated: true,
    statuses: ["new", "open", "closed"],
    fields: [["reason", "Reason", "select", true, S("Classroom behaviour", "Attendance", "Academic concern", "Wellbeing", "Safety", "Other")],
             ["assignedTo", "Referred to", "person"], ["details", "What happened", "longtext"], ["action", "Action taken", "longtext"],
             ["parentContacted", "Family contacted", "check"]],
    notify: "none"
  },
  detention: {
    label: "Detention", plural: "Detentions", policy: "subject", about: "student", dated: true,
    statuses: ["assigned", "served", "excused", "skipped"],
    fields: [["minutes", "Minutes", "number", true], ["servedMinutes", "Minutes served", "number"], ["reason", "Reason", "text"],
             ["referralId", "From referral", "text"]],
    notify: "subject"
  },
  senplan: {
    label: "Support plan", plural: "Support plans", policy: "subject", about: "student", dated: true,
    statuses: ["draft", "active", "in review", "ended"],
    fields: [["type", "Kind", "select", true, S("IEP", "504 plan", "Language support", "Health plan", "Other")],
             ["goals", "Goals", "longtext"], ["services", "Services", "longtext"], ["minutesPerWeek", "Service minutes a week", "number"],
             ["reviewOn", "Next review", "date"], ["casemanager", "Case manager", "person"]],
    notify: "subject"
  },
  accommodation: {
    label: "Accommodation", plural: "Accommodations", policy: "subject", about: "student", dated: false,
    statuses: ["active", "ended"],
    fields: [["extraTime", "Extra time (%)", "number"], ["tools", "Tools allowed", "text"], ["setting", "Setting", "select", false, S("Same room", "Separate room", "Small group")],
             ["appliesTo", "Applies to", "select", false, S("All tests", "Standardised tests", "Class work")], ["note", "Note", "longtext"]]
  },
  leave: {
    label: "Leave request", plural: "Leave requests", policy: "self", about: "staff", dated: true,
    statuses: ["pending", "approved", "declined", "withdrawn"],
    fields: [["type", "Kind", "select", true, S("Personal", "Sick", "Professional", "Family", "Other")], ["until", "Until", "date"], ["note", "Note", "longtext"]],
    notify: "none"
  },
  substitute: {
    label: "Cover", plural: "Cover", policy: "staff", about: "staff", dated: true,
    statuses: ["needed", "covered"],
    fields: [["periods", "Periods", "text"], ["coveredBy", "Covered by", "person"], ["plan", "Plan for the class", "longtext"], ["reason", "Reason", "text"]]
  },
  certification: {
    label: "Certification", plural: "Certifications", policy: "office", about: "staff", dated: true,
    statuses: ["valid", "expired"],
    fields: [["issuer", "Issued by", "text"], ["number", "Number", "text"], ["expires", "Expires", "date"]]
  },
  menu: {
    label: "Menu", plural: "Menus", policy: "org", about: "none", dated: true,
    statuses: ["published"],
    fields: [["meal", "Meal", "select", true, S("Breakfast", "Lunch", "Snack")], ["items", "Served", "longtext"], ["allergens", "Allergens", "text"]]
  },
  eligibility: {
    label: "Meal eligibility", plural: "Meal eligibility", policy: "office", about: "student", dated: false,
    statuses: ["paid", "reduced", "free"],
    fields: [["note", "Note", "text"], ["until", "Until", "date"]]
  },
  locker: {
    label: "Locker", plural: "Lockers", policy: "subject", about: "student", dated: false,
    statuses: ["assigned", "cleared"],
    fields: [["number", "Number", "text", true], ["building", "Building or floor", "text"], ["note", "Note", "text"]]
  },
  checkout: {
    label: "Checkout", plural: "Checkouts", policy: "staff", about: "none", dated: true,
    statuses: ["out", "returned", "overdue"],
    fields: [["item", "Equipment", "text", true], ["borrower", "Borrower", "person"], ["returnBy", "Return by", "date"], ["condition", "Condition", "text"]]
  },
  curriculum: {
    label: "Curriculum map entry", plural: "Curriculum map", policy: "staff", about: "none", dated: false, course: true,
    statuses: ["planned", "taught"],
    fields: [["unit", "Unit", "text", true], ["weeks", "Weeks", "text"], ["standards", "Standards", "text"], ["assessment", "Assessment", "text"], ["notes", "Notes", "longtext"]]
  },
  form: {
    label: "Form", plural: "Forms", policy: "org", about: "none", dated: true,
    statuses: ["open", "closed"],
    fields: [["body", "Text", "longtext", true], ["audience", "For", "select", false, S("families", "students", "staff")]],
    notify: "audience"
  },
  signature: {
    label: "Signature", plural: "Signatures", policy: "self", about: "student", dated: false,
    statuses: ["signed", "declined"],
    fields: [["formId", "Form", "text", true], ["typedName", "Typed name", "text", true]]
  },
  prereq: {
    label: "Prerequisite", plural: "Prerequisites", policy: "org", about: "none", dated: false,
    statuses: ["required", "recommended"],
    fields: [["subjectId", "Course", "text", true], ["requires", "Requires course", "text", true]]
  },
  report: {
    label: "Saved report", plural: "Saved reports", policy: "staff", about: "none", dated: false,
    statuses: ["saved"],
    fields: [["dataset", "Dataset", "text", true], ["columns", "Columns", "text"], ["filter", "Filter", "text"]]
  },
  webhook: {
    label: "Webhook", plural: "Webhooks", policy: "office", about: "none", dated: false,
    statuses: ["active", "paused"],
    fields: [["url", "Address", "text", true], ["secret", "Signing secret", "text"], ["events", "Events", "text"]]
  },
  ewscase: {
    label: "Early-warning case", plural: "Early-warning cases", policy: "staff", about: "student", dated: true,
    statuses: ["open", "mentoring", "closed"],
    fields: [["mentor", "Mentor", "person"], ["concern", "What worries us", "longtext"], ["homeVisits", "Home visits: date and what was said", "longtext"],
             ["plan", "What we will do", "longtext"], ["outcome", "How it ended", "longtext"]],
    notify: "none"
  },
  condonation: {
    label: "Attendance condonation", plural: "Condonation cases", policy: "office", about: "student", dated: true,
    statuses: ["requested", "recommended", "declined", "submitted"],
    fields: [["percent", "Attendance now (%)", "number"], ["days", "Days to condone", "number"],
             ["reason", "Why the child was away", "select", true, S("Illness (medical certificate)", "Hospitalisation", "Family bereavement", "Played for the state or the country", "Other")],
             ["documents", "Documents held", "longtext"], ["boardRef", "Board reference", "text"], ["decision", "Decision note", "longtext"]],
    notify: "none"
  },
  certificate: {
    label: "Certificate", plural: "Certificates", policy: "office", about: "student", dated: true,
    statuses: ["requested", "awaiting signature", "issued", "declined"],
    fields: [["type", "Kind", "select", true, S("Transfer certificate", "Bonafide certificate", "Character certificate", "Migration certificate", "Other")],
             ["purpose", "What it is for", "text"], ["number", "Certificate number", "text"], ["issuedOn", "Issued on", "date"],
             ["leftOn", "Date of leaving", "date"], ["lastClass", "Class last studied", "text"], ["reason", "Reason for leaving", "text"],
             ["conduct", "Conduct", "select", false, S("Excellent", "Very good", "Good", "Satisfactory")], ["promotion", "Eligible for promotion to", "text"],
             ["web", "Show on the school's website", "check"], ["note", "Note", "longtext"]],
    notify: "none"
  },
  fee: {
    label: "Fee", plural: "Fees", policy: "org", about: "none", dated: false,
    statuses: ["active", "retired"],
    fields: [["amount", "Amount", "number", true], ["per", "Charged", "select", false, S("once", "term", "year", "month")], ["note", "Note", "text"]]
  },
  invoice: {
    label: "Invoice", plural: "Invoices", policy: "money", about: "student", dated: true,
    statuses: ["draft", "issued", "paid", "void"],
    fields: [["lines", "Lines (one per row: description, amount)", "longtext", true], ["total", "Total", "number", true], ["dueOn", "Due", "date"]],
    notify: "subject"
  },
  payment: {
    label: "Payment", plural: "Payments", policy: "money", about: "student", dated: true,
    statuses: ["received", "refunded"],
    fields: [["invoiceId", "Invoice", "text", true], ["amount", "Amount", "number", true],
             ["method", "Method", "select", true, S("cash", "cheque", "bank transfer", "card (recorded)")], ["reference", "Reference", "text"]]
  }
};

export const KIND_KEYS = Object.keys(KINDS);

/* What the client needs to draw a kind, with no policy functions in it. */
export function publicKinds() {
  const out = {};
  for (const [k, v] of Object.entries(KINDS)) {
    out[k] = {
      key: k, label: v.label, plural: v.plural, policy: v.policy, about: v.about, dated: !!v.dated, course: !!v.course, statuses: v.statuses,
      fields: v.fields.map((f) => ({ k: f[0], label: f[1], type: f[2], required: !!f[3], options: f[4] || null }))
    };
  }
  return out;
}

/* A field value checked against its declaration; what is not declared is dropped. */
export function cleanData(kind, data, fail) {
  const out = {};
  const src = data && typeof data === "object" ? data : {};
  for (const [k, label, type, required, options] of KINDS[kind].fields) {
    let v = src[k];
    if (v === undefined || v === null || v === "") {
      if (required) fail(`${label} is required.`, k);
      continue;
    }
    if (type === "number") { v = Number(v); if (!Number.isFinite(v) || v < -1e9 || v > 1e9) fail(`${label} must be a number.`, k); }
    else if (type === "check") v = v === true || v === "true" || v === 1;
    else {
      v = String(v);
      if (v.length > (type === "longtext" ? 4000 : 400)) fail(`${label} is too long.`, k);
      if (type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(v)) fail(`${label} is a date, written YYYY-MM-DD.`, k);
      if (type === "time" && !/^\d{2}:\d{2}$/.test(v)) fail(`${label} is a time, written HH:MM.`, k);
      if (type === "select" && options && !options.includes(v)) fail(`${label} must be one of: ${options.join(", ")}.`, k);
    }
    out[k] = v;
  }
  return out;
}
