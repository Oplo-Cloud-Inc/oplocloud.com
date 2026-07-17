// ============================================================================
// Lodestar — the matter.
// One personal-injury case, held as a connected structure (the Case Graph).
// Everything is fictional and for demonstration. Citations are illustrative:
// real black-letter statutes are used generally; case authority is shown with
// the verification UI but never asserts a specific holding — because the whole
// point of Lodestar is that it never surfaces an unverified cite.
// ============================================================================

export const matter = {
  id: "reyes-brightline",
  short: "Reyes v. Brightline",
  caption: "Reyes v. Brightline Logistics, Inc.",
  plaintiff: "Marisol Reyes",
  defendant: "Brightline Logistics, Inc.",
  court: "Superior Court of California — County of Alameda",
  caseNo: "RG-24-118842",
  stage: "Discovery",
  filed: "2024-11-04",
  trial: "2026-03-16",
  practice: "Personal Injury — Motor Vehicle",
  lead: "You (Reyes & Okonkwo LLP)",
  strength: 71, // overall, 0–100
  // One-line theory of the case — the lodestar the whole file points toward.
  theory:
    "A fatigued Brightline driver, pushed past federal hours-of-service limits by dispatch, rear-ended Ms. Reyes at a full stop and caused a surgical cervical injury.",
};

// The legal elements that must hold for the claim to win. Not a sequence —
// a set that all has to be true at once. Strength is how well each is supported.
export const elements = [
  {
    id: "duty",
    name: "Duty",
    claim: "Brightline's driver owed Ms. Reyes a duty of ordinary care on the roadway.",
    strength: 96,
    note: "Effectively conceded — a driver's duty to those ahead is settled.",
  },
  {
    id: "breach",
    name: "Breach",
    claim: "The driver breached that duty by operating while fatigued and failing to stop.",
    strength: 84,
    note: "Strong. Hours-of-service violation and telematics put it near-conclusive.",
  },
  {
    id: "causation",
    name: "Causation",
    claim: "The collision caused the C5–C6 herniation, not pre-existing degeneration.",
    strength: 52,
    note: "The soft point. Defense will argue prior degeneration — needs the treating surgeon.",
  },
  {
    id: "damages",
    name: "Damages",
    claim: "Ms. Reyes suffered surgical injury, wage loss, and ongoing pain.",
    strength: 78,
    note: "Specials are documented; future-care projection still thin.",
  },
  {
    id: "vicarious",
    name: "Vicarious liability",
    claim: "Brightline is liable for its driver acting within the scope of employment.",
    strength: 88,
    note: "Driver was on-dispatch. Scope is not seriously contested.",
  },
];

// Evidence — the facts in the file, each tied to what it proves. `verified`
// means the underlying record is in the file and traceable to a page.
export const evidence = [
  {
    id: "police",
    name: "Traffic collision report",
    kind: "Record",
    date: "2024-06-18",
    source: "CHP Report #24-3391, p.3",
    verified: true,
    supports: ["breach", "duty"],
    weight: "strong",
    excerpt:
      "Party 2 (Brightline unit) struck Party 1 from the rear while Party 1 was stopped for a signal. No skid marks noted.",
  },
  {
    id: "ecm",
    name: "Tractor ECM / telematics",
    kind: "Data",
    date: "2024-06-18",
    source: "Brightline unit 4471 — event download",
    verified: true,
    supports: ["breach"],
    weight: "strong",
    excerpt:
      "No brake application in the 4.0s before impact. Vehicle speed 31 mph. Throttle released 0.6s pre-impact.",
  },
  {
    id: "hos",
    name: "Driver hours-of-service logs",
    kind: "Record",
    date: "2024-06-18",
    source: "ELD export — 14-day window",
    verified: true,
    supports: ["breach"],
    weight: "strong",
    excerpt:
      "Driver on duty 13h47m at time of collision — 47 minutes past the 14-hour federal limit (49 C.F.R. § 395.3).",
  },
  {
    id: "dispatch",
    name: "Dispatch messages",
    kind: "Record",
    date: "2024-06-17",
    source: "Brightline dispatch log, produced 2025-02",
    verified: true,
    supports: ["breach", "vicarious"],
    weight: "medium",
    excerpt:
      "“Route has to clear tonight — don't stop the clock.” Sent 6h before the collision.",
  },
  {
    id: "er",
    name: "ER admission records",
    kind: "Medical",
    date: "2024-06-18",
    source: "Alta Bates ED, 142 pp.",
    verified: true,
    supports: ["damages", "causation"],
    weight: "strong",
    excerpt:
      "Acute neck pain, radiculopathy right arm. Same-day presentation. Mechanism: rear-impact MVC.",
  },
  {
    id: "mri",
    name: "Cervical MRI",
    kind: "Medical",
    date: "2024-06-27",
    source: "Bay Imaging, read by Dr. Advani",
    verified: true,
    supports: ["causation", "damages"],
    weight: "medium",
    excerpt:
      "C5–C6 disc herniation with right neural foraminal narrowing. Mild multilevel degenerative change noted.",
  },
  {
    id: "op",
    name: "Operative report — ACDF",
    kind: "Medical",
    date: "2024-09-12",
    source: "Dr. Lindqvist, operative note",
    verified: true,
    supports: ["damages"],
    weight: "strong",
    excerpt:
      "Anterior cervical discectomy and fusion at C5–C6. Hardware placed. Tolerated well.",
  },
  {
    id: "wage",
    name: "Wage-loss documentation",
    kind: "Record",
    date: "2025-01-20",
    source: "Employer records + 2023 W-2",
    verified: true,
    supports: ["damages"],
    weight: "medium",
    excerpt:
      "19 weeks off work. Base $1,640/wk. Return on modified duty 2024-11.",
  },
  {
    id: "surgeon-depo",
    name: "Treating surgeon — deposition",
    kind: "Testimony",
    date: null,
    source: "Not yet taken",
    verified: false,
    supports: ["causation"],
    weight: "missing",
    excerpt:
      "Open item. Dr. Lindqvist's causation testimony is the hinge on the herniation-vs-degeneration fight.",
  },
];

// Controlling / persuasive authority. `verified` = checked against a real
// reporter before it is ever shown. Descriptors are general and safe.
export const authorities = [
  {
    id: "civ1714",
    cite: "Cal. Civ. Code § 1714(a)",
    kind: "Statute",
    court: "California",
    verified: true,
    applies: ["duty", "breach"],
    descriptor: "General duty of ordinary care for one's own conduct.",
  },
  {
    id: "veh22350",
    cite: "Cal. Veh. Code § 21703",
    kind: "Statute",
    court: "California",
    verified: true,
    applies: ["breach"],
    descriptor: "Following too closely — basis for the rear-impact breach.",
  },
  {
    id: "respondeat",
    cite: "Respondeat superior (Ct. App.)",
    kind: "Case",
    court: "Cal. Ct. App.",
    verified: true,
    applies: ["vicarious"],
    descriptor: "Employer liability for employee acts within scope of employment.",
  },
  {
    id: "hos-fed",
    cite: "49 C.F.R. § 395.3",
    kind: "Regulation",
    court: "Federal",
    verified: true,
    applies: ["breach"],
    descriptor: "Federal hours-of-service limits for commercial drivers.",
  },
  {
    id: "eggshell",
    cite: "Eggshell-plaintiff rule (Cal.)",
    kind: "Doctrine",
    court: "California",
    verified: true,
    applies: ["causation", "damages"],
    descriptor: "Defendant takes the plaintiff as found — answers the degeneration defense.",
  },
];

// The auto-timeline Lodestar builds by reading the file.
export const timeline = [
  { date: "2024-06-17", label: "Dispatch: “don't stop the clock”", tag: "liability", node: "dispatch" },
  { date: "2024-06-18", label: "Rear-impact collision, I-880 at signal", tag: "liability", node: "police" },
  { date: "2024-06-18", label: "ER — acute cervical injury", tag: "medical", node: "er" },
  { date: "2024-06-27", label: "MRI: C5–C6 herniation", tag: "medical", node: "mri" },
  { date: "2024-09-12", label: "ACDF surgery", tag: "medical", node: "op" },
  { date: "2024-11-04", label: "Complaint filed", tag: "procedure", node: null },
  { date: "2025-02-10", label: "Brightline produces dispatch logs", tag: "discovery", node: "dispatch" },
  { date: "2026-03-16", label: "Trial date", tag: "procedure", node: null, future: true },
];

// Damages model — grounds the settlement conversation in numbers.
export const damages = {
  specials: 214800, // documented medical + wage
  future: 165000, // projected future care (still thin)
  general: 450000, // pain & suffering, working figure
  get total() {
    return this.specials + this.future + this.general;
  },
  demandLow: 675000,
  demandHigh: 950000,
  breakdown: [
    { label: "Medical specials", amount: 148300, firm: true },
    { label: "Wage loss", amount: 66500, firm: true },
    { label: "Future care (projected)", amount: 165000, firm: false },
    { label: "Pain & suffering", amount: 450000, firm: false },
  ],
};

// What needs the lawyer now — derived from the graph, litigation-specific.
export const needsYou = [
  {
    id: "ny-causation",
    kind: "soft",
    title: "Causation is the soft link",
    body: "Only 52% supported. The herniation-vs-degeneration fight turns on one witness you haven't locked.",
    action: "Set Dr. Lindqvist's deposition",
    to: { view: "constellation", node: "causation" },
  },
  {
    id: "ny-future",
    kind: "gap",
    title: "Future-care number is unsupported",
    body: "$165k is a working figure with no life-care plan behind it. It's a third of the demand.",
    action: "Draft the life-care request",
    to: { view: "damages" },
  },
  {
    id: "ny-deadline",
    kind: "deadline",
    title: "Expert disclosure in 34 days",
    body: "Aug 19 — designate the treating surgeon and any life-care planner before the cutoff.",
    action: "Open deadlines",
    to: { view: "home" },
  },
];

// The six verbs — the product's actual frame. A set, not a sequence.
export const verbs = [
  { id: "find", label: "Find", view: "home", tag: "Records, research, the fact you need" },
  { id: "think", label: "Think", view: "constellation", tag: "Reason about the theory" },
  { id: "connect", label: "Connect", view: "timeline", tag: "Tie every fact to what it proves" },
  { id: "expand", label: "Expand", view: "damages", tag: "Strengthen a thin point" },
  { id: "learn", label: "Learn", view: "learn", tag: "The judge, the opponent, the law" },
  { id: "make", label: "Make the case", view: "make", tag: "Produce the work product" },
];

// Small helper: map a 0–100 strength to a named band + the ramp color token.
export function band(strength) {
  if (strength == null) return { name: "unsupported", token: "--ember", label: "Unsupported" };
  if (strength >= 75) return { name: "strong", token: "--teal", label: "Strong" };
  if (strength >= 55) return { name: "holding", token: "--amber", label: "Holding" };
  return { name: "soft", token: "--ember", label: "Soft" };
}

export function fmtUSD(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntil(iso) {
  const now = new Date("2026-07-16T00:00:00");
  const d = new Date(iso + "T00:00:00");
  return Math.round((d - now) / 86400000);
}
