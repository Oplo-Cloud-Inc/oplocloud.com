/* ==========================================================================
   OC EFM — the sandbox's books.

   Nine months of fiscal 2026 for OploCloud Group — OploCloud, Inc. (New
   York, USD), OploCloud UK Ltd (London, GBP) and OploCloud Japan K.K.
   (Tokyo, JPY) — generated, not typed: contracts bill and defer, payroll
   runs on its calendar, vendors invoice and get paid on Thursday runs,
   cloud usage is accrued and reversed, assets depreciate, the parent
   recharges its subsidiaries, balances are revalued, taxes are provided.
   Every one of those becomes a journal through the engine's post(), so the
   books obey the same rules as anything a person does in the sandbox.

   The figures are illustrative. Customers, most vendors and every person
   are fictional; the numbers are not OploCloud's.

   Deterministic: the same code always makes the same books, which is what
   lets a sandbox keep only the commands somebody ran and replay them.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM;
  var Engine = EFM.Engine, P = Engine.prototype;

  /* A number in [0, 1) for a key — the same key, the same number, whatever
     order things are generated in. */
  function h01(key) {
    var h1 = 0xdeadbeef ^ 7, h2 = 0x41c6ce57 ^ 7;
    for (var i = 0; i < key.length; i++) {
      var ch = key.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return ((h2 >>> 0) * 4294967296 + (h1 >>> 0)) / 18446744073709551616;
  }
  function jitter(key, spread) { return 1 + (h01(key) * 2 - 1) * spread; }
  function pick(key, arr) { return arr[Math.floor(h01(key) * arr.length)]; }

  var MINOR = { USD: 100, GBP: 100, JPY: 1 };
  function m(e, major) { return Math.round(major * MINOR[e.currency]); }
  /* A round major amount (whole dollars/pounds; yen to the hundred). */
  function r(e, major) { return e.currency === "JPY" ? Math.round(major / 100) * 100 : Math.round(major); }
  function mm(e, major) { return m(e, r(e, major)); }

  var FY = "2026";
  var AS_OF = "2026-09-28";
  var TODAY_P = "2026-09";

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function md(d) { return MON[+d.slice(5, 7) - 1] + " " + (+d.slice(8, 10)); }
  function ym(i) { return FY + "-" + pad(i); }                // 1 → 2026-01
  function mi(p) { return +p.slice(5, 7); }                    // 2026-03 → 3

  /* ------------------------------------------------------------ Entities */
  var ENTITIES = [
    { id: "US", name: "OploCloud, Inc.", short: "US", country: "United States", city: "New York", currency: "USD", legal: "Delaware corporation · EIN ••-•••4417", taxRate: 0.23, vat: 0 },
    { id: "UK", name: "OploCloud UK Ltd", short: "UK", country: "United Kingdom", city: "London", currency: "GBP", legal: "Private limited company · Co. No. •••82214", taxRate: 0.25, vat: 0.20 },
    { id: "JP", name: "OploCloud Japan K.K.", short: "Japan", country: "Japan", city: "Tokyo", currency: "JPY", legal: "Kabushiki kaisha · Corp. No. ••••6603", taxRate: 0.30, vat: 0.10 }
  ];

  /* USD per unit. Average for income and expense, close for balances. */
  var RATES = {
    GBP: { hist: 1.2100, open: 1.2530,
      avg:   [1.2684, 1.2621, 1.2812, 1.2743, 1.2915, 1.3052, 1.3181, 1.3094, 1.3221, 1.3240, 1.3240, 1.3240],
      close: [1.2592, 1.2703, 1.2851, 1.2790, 1.2984, 1.3120, 1.3144, 1.3162, 1.3274, 1.3274, 1.3274, 1.3274] },
    JPY: { hist: 0.00790, open: 0.00636,
      avg:   [0.006681, 0.006712, 0.006594, 0.006523, 0.006614, 0.006722, 0.006841, 0.006793, 0.006912, 0.006920, 0.006920, 0.006920],
      close: [0.006702, 0.006655, 0.006571, 0.006590, 0.006688, 0.006781, 0.006833, 0.006862, 0.006951, 0.006951, 0.006951, 0.006951] }
  };

  var BANKS = [
    { id: "us-op",  entity: "US", account: "1010", bankName: "JPMorgan Chase", name: "Operating", mask: "•••• 4821", recThrough: "2026-09-11" },
    { id: "us-pay", entity: "US", account: "1020", bankName: "JPMorgan Chase", name: "Payroll",   mask: "•••• 7730", recThrough: "2026-09-26" },
    { id: "us-res", entity: "US", account: "1030", bankName: "JPMorgan Chase", name: "Treasury reserve", mask: "•••• 2290", recThrough: "2026-09-26" },
    { id: "uk-op",  entity: "UK", account: "1010", bankName: "Barclays",       name: "Operating", mask: "•••• 3317", recThrough: "2026-09-24" },
    { id: "jp-op",  entity: "JP", account: "1010", bankName: "MUFG Bank",      name: "Operating", mask: "•••• 6604", recThrough: "2026-09-26" }
  ];

  /* ----------------------------------------------------------- Customers
     [id, entity, name, product, monthly (major), billing, anniversary month,
      days late on average, usage product or null, credit limit (major)] */
  var CUSTOMERS = [
    ["juniper",   "US", "Juniper Ridge School District",   "EDU", 79800, "annual", 7, 12, null, 1200000],
    ["pinecrest", "US", "Pinecrest Unified School District","EDU", 53200, "monthly", 0, 80, null, 150000],
    ["lakeshore", "US", "Lakeshore Public Schools",        "EDU", 35150, "annual", 9, 5, null, 500000],
    ["cedar",     "US", "Cedar Hollow Schools",            "EDU", 18620, "monthly", 0, 20, null, 60000],
    ["riverbend", "US", "Riverbend Charter Network",       "EDU", 23560, "annual", 3, 8, null, 350000],
    ["northfield","US", "Northfield University",           "EDU", 68400, "annual", 8, 25, null, 900000],
    ["bayview",   "US", "Bayview Community College",       "EDU", 15580, "monthly", 0, 15, null, 50000],
    ["mesa",      "US", "Mesa Verde Unified",              "EDU", 41800, "annual", 10, 10, null, 600000],
    ["granite",   "US", "Granite Falls ISD",               "EDU", 27740, "annual", 1, 6, null, 400000],
    ["halcyon",   "US", "Halcyon Health Partners",         "WKS", 58900, "annual", 4, 3, null, 800000],
    ["arborline", "US", "Arborline Freight",               "WKS", 31920, "monthly", 0, 2, null, 90000],
    ["veridian",  "US", "Veridian Media Group",            "WKS", 22800, "monthly", 0, 104, null, 60000],
    ["kestrel",   "US", "Kestrel Mutual Insurance",        "WKS", 52250, "annual", 6, 0, null, 700000],
    ["larkspur",  "US", "Larkspur Retail Co.",             "WKS", 36480, "monthly", 0, 38, null, 90000],
    ["cinder",    "US", "Cinder & Oak Hospitality",        "WKS", 14060, "monthly", 0, 10, null, 40000],
    ["meridian",  "US", "Meridian Grid Energy",            "WKS", 45600, "annual", 11, 4, null, 600000],
    ["solace",    "US", "Solace Behavioral Health",        "WKS", 18810, "monthly", 0, 18, null, 60000],
    ["tidewater", "US", "Tidewater Capital Partners",      "WKS", 39900, "annual", 2, 1, null, 550000],
    ["quillon",   "US", "Quillon Legal Group",             "WKS", 11970, "monthly", 0, 7, null, 40000],
    ["brightwater","US","Brightwater Analytics",           "WKS", 21850, "monthly", 0, 4, "RXN", 120000],
    ["fennec",    "US", "Fennec Robotics",                 "RXN", 0, "usage", 0, 8, "RXN", 250000],
    ["oriel",     "US", "Oriel Search",                    "RXN", 0, "usage", 0, 3, "RXN", 300000],
    ["palisade",  "US", "Palisade Security",               "RXN", 0, "usage", 0, 14, "RXN", 120000],
    ["wren",      "US", "Wren Health AI",                  "RXN", 0, "usage", 0, 6, "RXN", 100000],
    ["atlas",     "US", "Atlas Last Mile",                 "MAP", 0, "usage", 0, 9, "MAP", 150000],
    ["harbor",    "US", "Harbor Ride Co.",                 "MAP", 0, "usage", 0, 21, "MAP", 100000],
    ["summit",    "US", "Summit Outdoor Co.",              "MAP", 16720, "monthly", 0, 5, null, 50000],
    ["thames",    "UK", "Thames Valley Academy Trust",     "EDU", 16000, "annual", 9, 12, null, 250000],
    ["albion",    "UK", "Albion Mutual Assurance",         "WKS", 14500, "monthly", 0, 4, null, 60000],
    ["northgate", "UK", "Northgate Rail Services",         "WKS", 11200, "annual", 5, 6, null, 180000],
    ["pennine",   "UK", "Pennine Schools Partnership",     "EDU", 7800, "monthly", 0, 30, null, 30000],
    ["cavendish", "UK", "Cavendish & Reed LLP",            "WKS", 5600, "monthly", 0, 2, null, 20000],
    ["lantern",   "UK", "Lantern Logistics UK",            "MAP", 0, "usage", 0, 10, "MAP", 40000],
    ["hollins",   "UK", "Hollins Digital",                 "RXN", 0, "usage", 0, 5, "RXN", 50000],
    ["brackenridge","UK","Brackenridge University",        "EDU", 21000, "annual", 2, 20, null, 300000],
    ["sakuragawa","JP", "Sakuragawa Gakuen",               "EDU", 2400000, "annual", 4, 3, null, 36000000],
    ["hoshimi",   "JP", "Hoshimi Logistics",               "MAP", 0, "usage", 0, 6, "MAP", 12000000],
    ["kaede",     "JP", "Kaede Financial Group",           "WKS", 4200000, "monthly", 0, 1, null, 15000000],
    ["tsubame",   "JP", "Tsubame Retail",                  "WKS", 1650000, "monthly", 0, 9, null, 6000000],
    ["minato",    "JP", "Minato Robotics",                 "RXN", 0, "usage", 0, 4, "RXN", 10000000],
    ["asahigaoka","JP", "Asahigaoka University",           "EDU", 3000000, "annual", 10, 12, null, 40000000]
  ];
  /* Monthly usage in the first month of the year (major), and monthly growth. */
  var USAGE = {
    brightwater: [9800, 0.03], fennec: [61000, 0.045], oriel: [88000, 0.05], palisade: [36000, 0.02],
    wren: [29000, 0.06], atlas: [49000, 0.025], harbor: [31000, 0.015],
    lantern: [8200, 0.02], hollins: [11400, 0.04], hoshimi: [3100000, 0.02], minato: [2750000, 0.05]
  };
  /* Self-serve (Oplo+ and Workspace seats), monthly gross in January, and growth. */
  var SELF = { US: [2080000, 0.031], UK: [138000, 0.026], JP: [13800000, 0.03] };
  var SELF_PLAN = { US: 0.033, UK: 0.027, JP: 0.031 };

  /* ------------------------------------------------------------- Vendors
     [id, entity, name, account, dept, monthly base (major), growth, terms,
      options] */
  var VENDORS = [
    ["aws",       "US", "Amazon Web Services", "5000", "ENG", 0, 0, 30, { accrue: true, pctOf: 0.082, email: "aws-receivables@amazon.com", category: "Cloud" }],
    ["gcp",       "US", "Google Cloud",        "5000", "ENG", 61000, 0.016, 30, { accrue: true, category: "Cloud" }],
    ["cloudflare","US", "Cloudflare",          "5000", "ENG", 34200, 0.012, 30, { category: "Cloud" }],
    ["zendesk",   "US", "Zendesk",             "5200", "CS", 24500, 0.005, 30, { category: "Software" }],
    ["github",    "US", "GitHub",              "6100", "ENG", 16800, 0.01, 30, { category: "Software" }],
    ["slack",     "US", "Slack",               "6100", "GA", 12400, 0.008, 30, { category: "Software" }],
    ["figma",     "US", "Figma",               "6100", "PRD", 8900, 0.006, 30, { category: "Software" }],
    ["atlassian", "US", "Atlassian",           "6100", "ENG", 11600, 0.006, 30, { category: "Software" }],
    ["datadog",   "US", "Datadog",             "6100", "ENG", 38000, 0.02, 30, { category: "Software" }],
    ["gws",       "US", "Google Workspace",    "6100", "GA", 7900, 0.01, 30, { category: "Software" }],
    ["zoom",      "US", "Zoom",                "6100", "SAL", 4600, 0.005, 30, { category: "Software" }],
    ["gads",      "US", "Google Ads",          "6200", "MKT", 0, 0, 15, { series: [112000, 104000, 126000, 118000, 123000, 131000, 178000, 298000, 312000], plan: 116000, threshold: true, category: "Advertising" }],
    ["meta",      "US", "Meta Ads",            "6200", "MKT", 0, 0, 15, { series: [61000, 58000, 71000, 66000, 69000, 74000, 96000, 176000, 184000], plan: 64000, threshold: true, category: "Advertising" }],
    ["linkedin",  "US", "LinkedIn Ads",        "6200", "MKT", 29500, 0.01, 30, { category: "Advertising" }],
    ["northbeam", "US", "Northbeam Studio",    "6200", "MKT", 18400, 0, 30, { flat: true, category: "Agency", email: "billing@northbeam.studio" }],
    ["summitev",  "US", "Summit Events Co.",   "6250", "MKT", 0, 0, 30, { oneoff: { 3: 186000, 6: 142000 }, plan: { 3: 190000, 6: 150000, 9: 120000 }, category: "Events" }],
    ["hudson",    "US", "Hudson Commons LLC",  "6300", "GA", 185000, 0, 0, { flat: true, rent: true, email: "ar@hudsoncommons.com", category: "Facilities" }],
    ["whitman",   "US", "Whitman & Park LLP",  "6400", "GA", 42000, 0, 30, { vary: 0.35, category: "Legal" }],
    ["calder",    "US", "Calder & Finch LLP",  "6400", "GA", 0, 0, 30, { oneoff: { 1: 28000, 3: 95000, 4: 28000, 7: 28000 }, plan: { 1: 30000, 3: 90000, 4: 30000, 7: 30000, 10: 30000 }, category: "Audit & tax" }],
    ["harborline","US", "Harborline Insurance","1200", "GA", 0, 0, 30, { category: "Insurance" }],
    ["keystone",  "US", "Keystone Talent",     "6800", "ENG", 58000, 0.01, 30, { vary: 0.08, category: "Contractors" }],
    ["dell",      "US", "Dell Technologies",   "1510", "ENG", 0, 0, 30, { category: "Equipment" }],
    ["apple",     "US", "Apple",               "1510", "PRD", 0, 0, 30, { category: "Equipment" }],
    ["crescent",  "US", "Crescent Advisory Group", "6400", "GA", 0, 0, 15, { category: "Consulting", created: "2026-08-10" }],
    ["aws-uk",    "UK", "Amazon Web Services EMEA", "5000", "ENG", 0, 0, 30, { accrue: true, pctOf: 0.075, category: "Cloud" }],
    ["brightspace","UK","Brightspace Offices Ltd", "6300", "GA", 42000, 0, 0, { flat: true, rent: true, category: "Facilities" }],
    ["hartwell",  "UK", "Hartwell & Sons Solicitors", "6400", "GA", 9200, 0, 30, { vary: 0.3, category: "Legal" }],
    ["linkedin-uk","UK","LinkedIn Ireland",    "6200", "MKT", 11200, 0.01, 30, { category: "Advertising" }],
    ["kinetic",   "UK", "Kinetic Recruiting Ltd", "6800", "SAL", 14000, 0.005, 30, { vary: 0.1, category: "Contractors" }],
    ["aws-jp",    "JP", "Amazon Web Services Japan", "5000", "ENG", 0, 0, 30, { accrue: true, pctOf: 0.07, category: "Cloud" }],
    ["marunouchi","JP", "Marunouchi Office Properties", "6300", "GA", 6200000, 0, 0, { flat: true, rent: true, category: "Facilities" }],
    ["tanakamori","JP", "Tanaka & Mori Law Office", "6400", "GA", 1100000, 0, 30, { vary: 0.3, category: "Legal" }],
    ["kumo",      "JP", "Kumo Creative",       "6200", "MKT", 1800000, 0.01, 30, { category: "Agency" }],
    ["nsp",       "JP", "Nippon Staffing Partners", "6800", "ENG", 2400000, 0.005, 30, { vary: 0.06, category: "Contractors" }]
  ];

  /* Monthly payroll by department (major), January, and monthly growth from hiring. */
  var PAYROLL = {
    US: { g: 0.011, tax: 0.21, d: { ENG: 568000, PRD: 138000, SAL: 186000, MKT: 94000, CS: 116000, GA: 151000 } },
    UK: { g: 0.01, tax: 0.16, d: { ENG: 118000, SAL: 42000, CS: 26000, GA: 22000 } },
    JP: { g: 0.008, tax: 0.155, d: { ENG: 14200000, SAL: 5100000, CS: 3300000, GA: 2900000 } }
  };

  var PEOPLE_BY_ENTITY = { US: "priya", UK: "oliver", JP: "aiko" };

  /* ================================================ The business calendar
     Functions the engine's close tasks call, so a task run in the sandbox
     computes exactly what the generator would have. */

  P.serviceMonth = function (c, period) {
    return c.billing === "annual" && period >= FY + "-01";
  };
  P.meter = function (c, period) {
    var u = USAGE[c.id], e = this.entity[c.entity];
    var n = mi(period) - 1;
    return mm(e, u[0] * Math.pow(1 + u[1], n) * jitter("use:" + c.id + ":" + period, 0.07));
  };
  P.estimateVendor = function (v, period) {
    var e = this.entity[v.entity];
    var actual = vendorActual(this, v, period) / MINOR[e.currency];
    var step = e.currency === "JPY" ? 100000 : 1000;
    return m(e, Math.round(actual * jitter("est:" + v.id + ":" + period, 0.05) / step) * step);
  };
  P.payrollHalf = function (entity, period) {
    var pr = PAYROLL[entity], e = this.entity[entity], out = {};
    Object.keys(pr.d).forEach(function (d) {
      var sal = pr.d[d] * Math.pow(1 + pr.g, mi(period) - 1) / 2;
      out[d] = { sal: mm(e, sal), tax: mm(e, sal * pr.tax) };
    });
    return out;
  };
  P.issueAR = function (c, date, lines, actor, at, opts) {
    opts = opts || {};
    var e = this.entity[c.entity];
    var sub = lines.reduce(function (s, l) { return s + l.amt; }, 0);
    var tax = e.vat ? Math.round(sub * e.vat) : 0;
    var total = sub + tax;
    var id = "INV-" + c.entity + "-" + (10000 + (this.seq["INV-" + c.entity] = (this.seq["INV-" + c.entity] || 0) + 1));
    var inv = {
      id: id, number: id, entity: c.entity, customer: c.id, date: date, due: this.addDays(date, c.terms),
      subtotal: sub, tax: tax, amount: total, balance: total, status: "open", lines: lines,
      payments: [], collections: [], kind: opts.kind || (lines[0].account === "4200" ? "usage" : c.billing)
    };
    var jl = [{ account: "1100", dr: total, dims: { customer: c.id } }];
    lines.forEach(function (l) {
      jl.push({ account: l.account, cr: l.amt, dims: { customer: c.id, product: l.product }, memo: l.desc });
    });
    if (tax) jl.push({ account: "2300", cr: tax, memo: (c.entity === "UK" ? "VAT 20%" : "Consumption tax 10%") });
    var j = this.post({ entity: c.entity, date: date, memo: "Invoice " + id + " — " + c.name,
      source: { type: "ar", id: id, label: "Customer invoice" }, lines: jl,
      createdBy: actor.id, createdAt: at }, { system: true });
    inv.journal = j.id;
    this.arInvoices[id] = inv;
    if (!opts.quiet) this.record("ar.issue", id, "Issued " + id + " to " + c.name + " · " + this.fmt(total, e.currency) + " · " + j.id, {}, actor, at);
    return inv;
  };
  P.monthEndTreasury = function (period, actor, at) {
    var self = this, js = [], d = lastBusinessDay(period);
    // Term loan: interest on the balance, and from April $100,000 of principal.
    var loan = -this.balance("US", "2700", this.addMonths(period, -1) < FY + "-01" ? FY + "-01" : period);
    var interest = Math.round(loan * 0.075 / 12);
    var lines = [{ account: "7100", dr: interest }, { account: "1010", cr: interest }];
    var principal = period >= FY + "-04" ? 10000000 : 0;
    if (principal) { lines.push({ account: "2700", dr: principal }); lines[1].cr += principal; }
    js.push(this.post({ entity: "US", date: d, memo: "Term loan — " + this.periodLabel(period) + " interest" + (principal ? " and principal" : ""),
      source: { type: "treasury", id: "LOAN:" + period, label: "Debt service" }, lines: lines, createdBy: actor.id, createdAt: at }, { system: true }).id);
    // Interest on the treasury reserve.
    var res = this.balance("US", "1030", this.addMonths(period, -1) < FY + "-01" ? FY + "-01" : this.addMonths(period, -1));
    var inc = Math.round(res * 0.042 / 12);
    js.push(this.post({ entity: "US", date: d, memo: "Interest — treasury reserve " + this.periodLabel(period),
      source: { type: "treasury", id: "INT:" + period, label: "Interest income" },
      lines: [{ account: "1030", dr: inc }, { account: "7000", cr: inc }], createdBy: actor.id, createdAt: at }, { system: true }).id);
    return js;
  };
  P.taxProvision = function (entity, period, actor, at) {
    var e = this.entity[entity], self = this, pti = 0;
    this.accountList.forEach(function (a) {
      if (!a.bs && a.id !== "8000") pti -= self.net(entity, a.id, FY + "-01", period);
    });
    var target = Math.max(0, Math.round(pti * e.taxRate));
    var booked = this.net(entity, "8000", FY + "-01", period);
    var adj = target - booked;
    if (!adj) return null;
    var lines = adj > 0 ? [{ account: "8000", dr: adj }, { account: "2600", cr: adj }]
                        : [{ account: "2600", dr: -adj }, { account: "8000", cr: -adj }];
    return this.post({ entity: entity, date: this.lastDay(period), memo: "Income tax provision — " + this.periodLabel(period) + " (" + Math.round(e.taxRate * 100) + "% of year-to-date pre-tax income)",
      source: { type: "tax", id: entity + ":" + period, label: "Tax provision" }, lines: lines, createdBy: actor.id, createdAt: at }, { system: true });
  };

  function lastBusinessDay(period) {
    var d = P.lastDay(period);
    while (P.weekday(d) === 0 || P.weekday(d) === 6) d = P.addDays(d, -1);
    return d;
  }
  function businessDayOnOrBefore(d) {
    while (P.weekday(d) === 0 || P.weekday(d) === 6) d = P.addDays(d, -1);
    return d;
  }
  function businessDayOnOrAfter(d) {
    while (P.weekday(d) === 0 || P.weekday(d) === 6) d = P.addDays(d, 1);
    return d;
  }
  function thursdayOnOrAfter(d) { while (P.weekday(d) !== 4) d = P.addDays(d, 1); return d; }
  function thursdayOnOrBefore(d) { while (P.weekday(d) !== 4) d = P.addDays(d, -1); return d; }
  /* A time of day in working hours, the same for the same key. */
  function stamp(date, key, lateOk) {
    var mins = 13 * 60 + Math.floor(h01("t:" + key) * (lateOk ? 11 * 60 : 9 * 60));   // 09:00–18:00 New York
    return date + "T" + pad(Math.floor(mins / 60) % 24) + ":" + pad(mins % 60) + ":" + pad(Math.floor(h01("s:" + key) * 60)) + "Z";
  }

  /* What a vendor bills for a month (minor units of its entity's currency). */
  function vendorActual(E, v, period) {
    var e = E.entity[v.entity], n = mi(period) - 1, o = v.opts;
    if (o.pctOf) {
      var rev = E._revPlan[v.entity][n] || 0;
      return mm(e, rev * o.pctOf * jitter("v:" + v.id + ":" + period, 0.04));
    }
    if (o.series) return o.series[n] != null ? mm(e, o.series[n] * jitter("v:" + v.id + ":" + period, 0.01)) : 0;
    if (o.oneoff) return o.oneoff[n + 1] ? mm(e, o.oneoff[n + 1]) : 0;
    if (!v.base) return 0;
    if (o.flat) return mm(e, v.base);
    return mm(e, v.base * Math.pow(1 + v.growth, n) * jitter("v:" + v.id + ":" + period, o.vary || 0.02));
  }
  function vendorPlan(E, v, n) {                 // n = 0..11, minor units
    var e = E.entity[v.entity], o = v.opts;
    if (o.pctOf) return mm(e, E._revPlan[v.entity][n] * o.pctOf * 0.97 / 1000) * 1000;
    if (o.series) {
      if (typeof o.plan === "number") return mm(e, o.plan * Math.pow(1.01, n));
      return 0;
    }
    if (o.plan) return o.plan[n + 1] ? mm(e, o.plan[n + 1]) : 0;
    if (!v.base) return 0;
    if (o.flat) return mm(e, v.base);
    return mm(e, Math.round(v.base * Math.pow(1 + v.growth, n) * 1.03 / 100) * 100);
  }

  /* ============================================================== Seed */

  EFM.seed = function (E) {
    var sys = E.people.system;
    E.asOf = AS_OF;
    ENTITIES.forEach(function (e) { E.addEntity(Object.assign({}, e)); });
    Object.keys(RATES).forEach(function (cur) {
      var R = RATES[cur], out = { hist: R.hist, open: R.open };
      for (var i = 0; i < 12; i++) out[ym(i + 1)] = { avg: R.avg[i], close: R.close[i] };
      E.rates[cur] = out;
    });
    BANKS.forEach(function (b) { E.bankAccounts[b.id] = Object.assign({ opening: 0, feed: "Connected · daily" }, b); });

    /* Events run in date order. An event may schedule more (an invoice
       schedules its payment), so they wait in a heap rather than a list. */
    var heap = [], nth = 0;
    function before(a, b) {
      return a.date !== b.date ? a.date < b.date : a.order !== b.order ? a.order < b.order : a.key !== b.key ? a.key < b.key : a.n < b.n;
    }
    function at(date, order, fn, key) {
      var ev = { date: date, order: order, fn: fn, key: key || "", n: nth++ };
      heap.push(ev);
      var i = heap.length - 1;
      while (i > 0) { var up = (i - 1) >> 1; if (!before(heap[i], heap[up])) break; var t = heap[i]; heap[i] = heap[up]; heap[up] = t; i = up; }
    }
    function next() {
      var top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        var i = 0;
        for (;;) {
          var l = 2 * i + 1, rr = l + 1, s = i;
          if (l < heap.length && before(heap[l], heap[s])) s = l;
          if (rr < heap.length && before(heap[rr], heap[s])) s = rr;
          if (s === i) break;
          var t = heap[i]; heap[i] = heap[s]; heap[s] = t; i = s;
        }
      }
      return top;
    }

    /* ---- Customers and contracts */
    CUSTOMERS.forEach(function (c) {
      var e = E.entity[c[1]];
      var cust = {
        id: c[0], entity: c[1], name: c[2], product: c[3], mrr: c[4] ? mm(e, c[4]) : 0,
        billing: c[5], anniversary: c[6], lateness: c[7], usage: c[8], creditLimit: mm(e, c[9]),
        terms: c[1] === "JP" ? 30 : c[3] === "EDU" ? 45 : 30,
        segment: c[3] === "EDU" ? "Education" : c[5] === "usage" ? "Developer platform" : "Enterprise",
        since: 2021 + Math.floor(h01("since:" + c[0]) * 5),
        contact: pick("ct:" + c[0], ["Accounts payable", "Finance office", "Procurement", "Business office"])
      };
      E.customers[cust.id] = cust;
      if (cust.mrr) E.contracts["K-" + cust.id] = { id: "K-" + cust.id, customer: cust.id, entity: cust.entity, product: cust.product,
        mrr: cust.mrr, billing: cust.billing === "annual" ? "annual" : "monthly", anniversary: cust.anniversary };
    });

    /* ---- Revenue plan, which the budget and the cloud bills both follow */
    E._revPlan = {};
    E.entities.forEach(function (e) {
      var arr = [];
      for (var n = 0; n < 12; n++) {
        var s = SELF[e.id][0] * Math.pow(1 + SELF[e.id][1], n);
        Object.values(E.customers).forEach(function (c) {
          if (c.entity !== e.id) return;
          if (c.mrr) s += c.mrr / MINOR[e.currency];
          if (c.usage) s += USAGE[c.id][0] * Math.pow(1 + USAGE[c.id][1], n);
        });
        arr.push(s);
      }
      E._revPlan[e.id] = arr;
    });

    /* ---- Vendors */
    VENDORS.forEach(function (v) {
      var e = E.entity[v[1]];
      var o = v[8] || {};
      E.vendors[v[0]] = {
        id: v[0], entity: v[1], name: v[2], account: v[3], dept: v[4], base: v[5], growth: v[6], terms: v[7], opts: o,
        accrue: !!o.accrue, category: o.category || "Services", email: o.email || null, created: o.created || "2022-0" + (1 + Math.floor(h01("vc:" + v[0]) * 9)) + "-1" + Math.floor(h01("vd:" + v[0]) * 9),
        bank: { mask: "•••• " + (1000 + Math.floor(h01("bank:" + v[0]) * 8999)), bank: pick("bk:" + v[0], e.id === "US" ? ["Bank of America", "Wells Fargo", "Citibank", "JPMorgan Chase", "Silicon Valley Bank"] : e.id === "UK" ? ["HSBC UK", "Lloyds Bank", "NatWest"] : ["Mizuho Bank", "SMBC", "MUFG Bank"]), verified: true },
        tin: e.id === "US" ? "••-•••" + (1000 + Math.floor(h01("tin:" + v[0]) * 8999)) : null,
        w9: e.id === "US"
      };
    });
    E.vendors.hudson.bankPending = { mask: "•••• 0417", bank: "Coastal Federal Credit Union", requestedAt: "2026-09-24T19:42:11Z",
      via: "email from billing@hudson-commons.co", note: "Sender's domain differs from the vendor's hudsoncommons.com on file." };

    /* ---- Fixed assets: the register going into the year */
    var OPENING_ASSETS = [
      ["US", "Hudson Yards office build-out", "1530", "GA", 980000, "2023-01-12", 84],
      ["US", "Office furniture — 5th floor", "1530", "GA", 168000, "2023-02-03", 84],
      ["US", "Core switches & firewalls — NYC", "1520", "ENG", 146000, "2023-06-20", 60],
      ["US", "Edge compute cluster — NYC colo", "1520", "ENG", 312000, "2024-03-11", 60],
      ["US", "GPU inference nodes (4×)", "1520", "ENG", 486000, "2025-05-19", 60],
      ["US", "Conference room AV — 6 rooms", "1530", "GA", 94000, "2024-09-02", 60],
      ["UK", "London office fit-out", "1530", "GA", 240000, "2024-06-14", 84],
      ["JP", "Tokyo office fit-out", "1530", "GA", 28000000, "2025-01-20", 84]
    ];
    [["US", "2023-02-14", 58, 2299], ["US", "2023-10-16", 64, 2299], ["US", "2024-05-06", 41, 2399], ["US", "2024-11-12", 52, 2399],
     ["US", "2025-06-02", 46, 2499], ["US", "2025-11-17", 38, 2499], ["UK", "2024-02-05", 22, 1999], ["UK", "2025-04-22", 17, 2099],
     ["JP", "2024-08-01", 14, 329000], ["JP", "2025-07-15", 12, 349000]].forEach(function (b) {
      OPENING_ASSETS.push([b[0], "Laptops — batch of " + b[2] + " (" + b[1].slice(0, 7) + ")", "1510", b[0] === "US" ? pick("ld:" + b[1], ["ENG", "ENG", "PRD", "SAL"]) : "ENG", b[2] * b[3], b[1], 36]);
    });
    OPENING_ASSETS.forEach(function (a) {
      var e = E.entity[a[0]];
      var id = E.nextId("AST", 5);
      var cost = mm(e, a[4]);
      var monthly = Math.round(cost / a[6]);
      var start = E.addMonths(a[5].slice(0, 7), 1);
      var months = start <= "2025-12" ? E.periodsBetween(start, "2025-12").length : 0;
      E.assets[id] = { id: id, entity: a[0], name: a[1], cls: a[2], dept: a[3], cost: cost, qty: 1, inService: a[5], life: a[6], salvage: 0,
        location: e.city, status: "active", priorDep: Math.min(cost, monthly * months), depThrough: "2025-12", source: "Opening register" };
    });

    /* ---- Opening balances, 1 January 2026, from the subledgers */
    var opening = { US: {}, UK: {}, JP: {} };
    function ob(e, acct, v, dims) { opening[e][acct] = opening[e][acct] || []; opening[e][acct].push({ v: v, dims: dims || {} }); }

    // Receivables open at year end: December invoices not yet paid.
    Object.values(E.customers).forEach(function (c) {
      var e = E.entity[c.entity];
      var dec = c.mrr && c.billing === "monthly" ? c.mrr : c.usage ? mm(e, USAGE[c.id][0] / (1 + USAGE[c.id][1])) : 0;
      if (!dec) return;
      if (h01("open-ar:" + c.id) < 0.35 && c.lateness < 20) return;    // some had already paid
      var tax = e.vat ? Math.round(dec * e.vat) : 0;
      var id = "INV-" + c.entity + "-" + (9000 + Math.floor(h01("oi:" + c.id) * 999));
      var date = c.billing === "usage" || c.usage && !c.mrr ? "2025-12-31" : "2025-12-01";
      E.arInvoices[id] = { id: id, number: id, entity: c.entity, customer: c.id, date: date, due: E.addDays(date, c.terms),
        subtotal: dec, tax: tax, amount: dec + tax, balance: dec + tax, status: "open", opening: true,
        lines: [{ account: c.mrr ? "4100" : "4200", amt: dec, product: c.usage || c.product, desc: "December 2025" }], payments: [], collections: [], kind: c.billing };
      ob(c.entity, "1100", dec + tax, { customer: c.id });
    });
    // Deferred revenue on annual contracts invoiced in 2025.
    Object.values(E.contracts).forEach(function (k) {
      if (k.billing !== "annual") return;
      var remaining = k.anniversary - 1;           // months of 2026 already paid for
      if (remaining > 0) { k.openingDeferred = k.mrr * remaining; ob(k.entity, "2200", -k.mrr * remaining, { customer: k.customer }); }
    });
    // Payables open at year end, and the December cloud accrual.
    var openingAP = [];
    VENDORS.forEach(function (row) {
      var v = E.vendors[row[0]], e = E.entity[v.entity];
      if (v.opts.accrue) {
        var est = mm(e, E._revPlan[v.entity][0] * v.opts.pctOf * 0.97);
        ob(v.entity, "2100", -est, {});
        v.decAccrual = est;
        return;
      }
      if (!v.base || v.opts.rent) return;
      var amt = mm(e, v.base / (1 + v.growth));
      var id = "AP-" + String(E.nextId("APO", 4)).slice(4);
      var date = "2025-12-" + (15 + Math.floor(h01("apd:" + v.id) * 12));
      E.apInvoices[id] = { id: id, entity: v.entity, vendor: v.id, number: "INV-" + (20000 + Math.floor(h01("apn:" + v.id) * 70000)),
        date: date, due: E.addDays(date, v.terms || 30), amount: amt, currency: e.currency, status: "approved", opening: true,
        lines: [{ account: v.account, amt: amt, dept: v.dept, desc: "December 2025 services" }], flags: [],
        createdBy: PEOPLE_BY_ENTITY[v.entity], capturedAt: date + "T15:00:00Z", approvedBy: "marcus", approvedAt: date + "T20:00:00Z", capture: { method: "email", confidence: 0.99 } };
      ob(v.entity, "2000", -amt, { vendor: v.id });
      openingAP.push(E.apInvoices[id]);
    });
    // Intercompany owed to the parent at year end, in USD.
    var IC_OPEN = { UK: 21000000, JP: 15000000 };   // cents
    Object.keys(IC_OPEN).forEach(function (id) {
      var e = E.entity[id], usd = IC_OPEN[id];
      ob("US", "1150", usd, { counterparty: id });
      ob(id, "2150", -E.fromUSD(usd, e.currency, RATES[e.currency].open), { counterparty: "US" });
      opening[id]["2150"][opening[id]["2150"].length - 1].fx = { cur: "USD", amt: -usd };
    });
    // Everything else, as the 2025 books closed.
    var OPEN = {
      US: { "1010": 14200000, "1020": 1850000, "1030": 18500000, "2500": -64000, "2600": -310000, "2700": -6000000, "3000": -48000000, "2400": 0 },
      UK: { "1010": 3200000, "2300": -48200, "3000": -2500000, "2600": -41000 },
      JP: { "1010": 420000000, "2300": -3100000, "3000": -300000000, "2600": -6200000 }
    };
    Object.keys(OPEN).forEach(function (id) {
      var e = E.entity[id];
      Object.keys(OPEN[id]).forEach(function (a) { if (OPEN[id][a]) ob(id, a, m(e, OPEN[id][a])); });
    });
    Object.values(E.assets).forEach(function (a) {
      ob(a.entity, a.cls, a.cost);
      if (a.priorDep) ob(a.entity, "1590", -a.priorDep);
    });
    E.entities.forEach(function (e) {
      var lines = [], sum = 0;
      Object.keys(opening[e.id]).sort().forEach(function (acct) {
        // One line per account; subledger detail stays on the documents.
        var byDim = {};
        opening[e.id][acct].forEach(function (x) {
          var k = JSON.stringify(x.dims);
          if (!byDim[k]) byDim[k] = { v: 0, dims: x.dims, fx: null };
          byDim[k].v += x.v;
          if (x.fx) byDim[k].fx = { cur: "USD", amt: (byDim[k].fx ? byDim[k].fx.amt : 0) + x.fx.amt };
        });
        Object.values(byDim).forEach(function (b) {
          if (!b.v) return;
          var ln = b.v > 0 ? { account: acct, dr: b.v } : { account: acct, cr: -b.v };
          if (Object.keys(b.dims).length) ln.dims = b.dims;
          if (b.fx) ln.fx = b.fx;
          lines.push(ln);
          sum += b.v;
        });
      });
      // Retained earnings is what makes the opening balance sheet balance.
      if (sum) lines.push(sum > 0 ? { account: "3100", cr: sum } : { account: "3100", dr: -sum });
      E.post({ entity: e.id, date: FY + "-01-01", memo: "Opening balances — fiscal " + FY + " (carried forward from FY2025 closing trial balance)",
        source: { type: "open", id: e.id + ":" + FY, label: "Opening balances" }, lines: lines,
        createdBy: "marcus", createdAt: "2026-01-02T15:12:00Z", approvedBy: "dana", approvedAt: "2026-01-02T16:40:00Z" }, { system: true });
    });
    Object.values(E.bankAccounts).forEach(function (b) { b.opening = E.openingBalance(b.entity, b.account); });

    /* ---- The year, as events */
    var marcus = E.people.marcus, dana = E.people.dana, tomas = E.people.tomas, hannah = E.people.hannah;
    function approverFor(e, usdMinor) { return usdMinor > 10000000 ? dana : marcus; }

    // Customers pay: an invoice issued at `date` is paid `lateness ± jitter` days after it is due.
    function schedulePayment(inv, key) {
      var c = E.customers[inv.customer];
      var late = Math.round(c.lateness * jitter("late:" + key, c.lateness > 30 ? 0.15 : 0.5) + (h01("lat2:" + key) * 6 - 3));
      var when = businessDayOnOrAfter(E.addDays(inv.due, late));
      // A few invoices are simply still open.
      if (when <= AS_OF) {
        at(when, 2, function () {
          if (inv.balance <= 0) return;
          E.post({ entity: inv.entity, date: when, memo: "Payment — " + c.name + " " + inv.number,
            source: { type: "ar-pay", id: inv.id, label: "Customer payment" },
            lines: [{ account: "1010", dr: inv.balance, dims: { customer: c.id } }, { account: "1100", cr: inv.balance, dims: { customer: c.id } }],
            createdBy: "tomas", createdAt: stamp(when, "arp" + inv.id) }, { system: true });
          inv.payments.push({ date: when, amount: inv.balance, journal: E.journalOrder[E.journalOrder.length - 1] });
          inv.balance = 0; inv.status = "paid";
        }, "pay" + inv.id);
      }
    }
    Object.values(E.arInvoices).forEach(function (inv) { schedulePayment(inv, inv.id); });
    openingAP.forEach(function (inv) {
      var run = thursdayOnOrBefore(E.addDays(inv.due, -1));
      if (run < "2026-01-02") run = "2026-01-08";
      at(run, 2, function () {
        E.payAP(inv, run, tomas, stamp(run, "op" + inv.id), false);
      }, "opay" + inv.id);
    });
    Object.values(E.vendors).forEach(function (v) {
      if (!v.decAccrual) return;
      at("2026-01-01", 0, function () {
        E.post({ entity: v.entity, date: "2026-01-01", memo: "Reversal of the December 2025 accrual — " + v.name,
          source: { type: "reversal", id: "DEC-ACC-" + v.id, label: "Reversal" },
          lines: [{ account: "2100", dr: v.decAccrual }, { account: v.account, cr: v.decAccrual, dims: { dept: v.dept, vendor: v.id } }],
          createdBy: "hannah", createdAt: "2026-01-02T15:00:00Z" }, { system: true });
      }, "decacc" + v.id);
    });

    for (var n = 1; n <= 9; n++) (function (n) {
      var p = ym(n), first = p + "-01", end = E.lastDay(p);
      var inSep = p === TODAY_P;

      E.entities.forEach(function (e) {
        // Contracts: monthly bills on the 1st; annual renewals on the anniversary.
        Object.values(E.contracts).forEach(function (k) {
          if (k.entity !== e.id) return;
          var c = E.customers[k.customer];
          if (k.billing === "monthly" || (k.billing === "annual" && k.anniversary === n)) {
            var d = first;
            at(d, 1, function () {
              var annual = k.billing === "annual";
              var lines = annual
                ? [{ account: "2200", amt: k.mrr * 12, product: k.product, desc: E.dimName("product", k.product) + " — annual subscription " + E.periodLabel(p) + "–" + E.periodLabel(E.addMonths(p, 11)) }]
                : [{ account: "4100", amt: k.mrr, product: k.product, desc: E.dimName("product", k.product) + " — " + E.periodLabel(p, true) }];
              var inv = E.issueAR(c, d, lines, sys, stamp(d, "ar" + k.id + p), { quiet: true, kind: annual ? "annual" : "monthly" });
              schedulePayment(inv, inv.id);
            }, "ar" + k.id);
          }
        });
        // Usage in arrears, billed on the last day of the month.
        if (!inSep) Object.values(E.customers).forEach(function (c) {
          if (c.entity !== e.id || !c.usage) return;
          at(end, 1, function () {
            var amt = E.meter(c, p);
            var inv = E.issueAR(c, end, [{ account: "4200", amt: amt, product: c.usage, desc: E.dimName("product", c.usage) + " API usage — " + E.periodLabel(p) }], sys, stamp(end, "u" + c.id + p), { quiet: true });
            schedulePayment(inv, inv.id);
          }, "use" + c.id);
        });
        // Self-serve settlements, every Friday.
        for (var d = first; d <= end; d = E.addDays(d, 1)) {
          if (E.weekday(d) !== 5 || d > "2026-09-25") continue;
          (function (d) {
            at(d, 2, function () {
              var mon = SELF[e.id][0] * Math.pow(1 + SELF[e.id][1], n - 1);
              var fridays = 0;
              for (var x = first; x <= end; x = E.addDays(x, 1)) if (E.weekday(x) === 5) fridays++;
              var gross = mm(e, mon / fridays * jitter("ss:" + e.id + d, 0.03));
              var fee = Math.round(gross * 0.029);
              var pls = Math.round(gross * 0.56);
              E.post({ entity: e.id, date: d, memo: "Oplo Pay settlement — week ending " + md(d),
                source: { type: "settlement", id: "SET-" + e.id + "-" + d, label: "Card settlement" },
                lines: [{ account: "1010", dr: gross - fee }, { account: "5100", dr: fee, dims: { dept: "GA", vendor: null } },
                        { account: "4000", cr: pls, dims: { product: "PLS" } }, { account: "4000", cr: gross - pls, dims: { product: "WKS" } }],
                createdBy: "system", createdAt: stamp(d, "ss" + e.id) }, { system: true });
            }, "ss" + e.id + d);
          })(d);
        }
        // Revenue recognition for annual contracts, at month end (September's is a close task).
        if (!inSep) at(end, 5, function () { E.closeRuns.revrec.call(E, { period: p, entity: e.id }, sys, stamp(end, "rr" + e.id)); }, "rr" + e.id);

        // Payroll.
        var pr = PAYROLL[e.id];
        var paydays = e.id === "US" ? [businessDayOnOrBefore(p + "-15"), lastBusinessDay(p)] : [businessDayOnOrBefore(p + "-25")];
        paydays.forEach(function (pd, k) {
          if (pd > AS_OF) return;
          var fund = businessDayOnOrBefore(E.addDays(pd, -1));
          var lines = [], total = 0;
          Object.keys(pr.d).forEach(function (dept) {
            var sal = pr.d[dept] * Math.pow(1 + pr.g, n - 1) / paydays.length * jitter("pay:" + e.id + dept + pd, 0.004);
            var s = mm(e, sal), t = mm(e, sal * pr.tax);
            lines.push({ account: "6000", dr: s, dims: { dept: dept } });
            lines.push({ account: "6050", dr: t, dims: { dept: dept } });
            total += s + t;
          });
          var cash = e.id === "US" ? "1020" : "1010";
          lines.push({ account: cash, cr: total });
          if (e.id === "US") at(fund, 1, function () {
            E.post({ entity: "US", date: fund, memo: "Fund payroll account for the " + md(pd) + " payroll", source: { type: "transfer", id: "FUND-" + pd, label: "Transfer" },
              lines: [{ account: "1020", dr: total }, { account: "1010", cr: total }], createdBy: "tomas", createdAt: stamp(fund, "fund" + pd) }, { system: true });
          }, "fund" + pd);
          at(pd, 3, function () {
            E.post({ entity: e.id, date: pd, memo: "Payroll — " + (e.id === "US" ? (k === 0 ? "1–15 " : "16–" + end.slice(8) + " ") + E.periodLabel(p) : E.periodLabel(p, true)),
              source: { type: "payroll", id: "PR-" + e.id + "-" + pd, label: "Payroll" }, lines: lines,
              createdBy: "system", createdAt: stamp(pd, "pr" + e.id + pd) }, { system: true });
          }, "pr" + e.id + pd);
        });

        // Vendors.
        Object.values(E.vendors).forEach(function (v) {
          if (v.entity !== e.id) return;
          if (v.opts.accrue) {
            // Usage accrued at month end, reversed on the 1st, invoiced on the 3rd.
            var actual = vendorActual(E, v, p);
            if (!inSep) at(end, 6, function () {
              var est = E.estimateVendor(v, p);
              var j = E.post({ entity: e.id, date: end, memo: "Accrual — " + v.name + " " + E.periodLabel(p) + " usage (estimate)",
                source: { type: "accrual", id: v.id + ":" + p, label: "Accrual" },
                lines: [{ account: v.account, dr: est, dims: { dept: v.dept, vendor: v.id } }, { account: "2100", cr: est }],
                createdBy: "hannah", createdAt: stamp(E.addDays(end, 2), "acc" + v.id + p) }, { system: true });
              E.reverseJournal(j, E.addMonths(p, 1) + "-01", "Auto-reversal", hannah, stamp(E.addDays(end, 2), "accr" + v.id + p));
            }, "acc" + v.id);
            // The invoice for last month's usage arrives on the 3rd.
            var prevP = E.addMonths(p, -1);
            var billAmt = n === 1 ? Math.round(v.decAccrual * jitter("dec:" + v.id, 0.03)) : vendorActual(E, v, prevP);
            makeAP(v, businessDayOnOrAfter(p + "-03"), billAmt, (n === 1 ? "December 2025" : E.periodLabel(prevP, true)) + " usage");
            v._last = actual;
            return;
          }
          if (v.opts.rent) { makeAP(v, first, vendorActual(E, v, p), E.periodLabel(p, true) + " rent", true); return; }
          if (v.id === "harborline" || v.id === "dell" || v.id === "apple" || v.id === "crescent" || v.id === "northbeam" && inSep) return;
          if (v.id === "summitev" && inSep) return;
          var amt = vendorActual(E, v, p);
          if (!amt) return;
          if (inSep && v.opts.threshold) {
            // Ad platforms bill each time spend reaches a threshold; two bills so far.
            ["2026-09-10", "2026-09-21"].forEach(function (d, i) {
              makeAP(v, d, Math.round(amt * 0.425 / MINOR[e.currency]) * MINOR[e.currency], "September campaigns — threshold billing " + (i + 1));
            });
            return;
          }
          var dday = v.opts.series ? end : p + "-" + pad(3 + Math.floor(h01("apday:" + v.id + p) * 24));
          if (dday > end) dday = end;
          makeAP(v, dday, amt, E.periodLabel(p, true) + " — " + v.category.toLowerCase());
        });

        // Depreciation, prepaid amortization and the parent's recharge.
        if (!inSep) {
          at(end, 6, function () { if (E.depreciationDue(e.id, p).length) E.runDepreciation(e.id, p, hannah, stamp(E.addDays(end, 2), "dep" + e.id + p)); }, "dep" + e.id);
          if (e.id === "US") at(end, 6, function () {
            (E.prepaids || []).forEach(function (pp) {
              E.post({ entity: pp.entity, date: end, memo: "Amortization — " + pp.name + " " + E.periodLabel(p),
                source: { type: "amort", id: pp.id + ":" + p, label: "Prepaid amortization" },
                lines: [{ account: pp.account, dr: pp.monthly, dims: { dept: pp.dept } }, { account: "1200", cr: pp.monthly }],
                createdBy: "hannah", createdAt: stamp(E.addDays(end, 2), "am" + p) }, { system: true });
            });
          }, "amort");
          if (e.id !== "US") {
            at(end, 4, function () { icCharge(e, p, end, true); }, "ic" + e.id);
            at(end, 7, function () { E.revalueIC(e.id, p, E.people[e.id === "UK" ? "oliver" : "aiko"], stamp(E.addDays(end, 2), "fx" + e.id + p)); }, "fx" + e.id);
          }
          at(end, 9, function () { E.taxProvision(e.id, p, E.people.marcus, stamp(E.addDays(end, 4), "tax" + e.id + p)); }, "tax" + e.id);
        } else if (e.id !== "US") {
          // September: the parent billed early; the subsidiaries have not booked it yet.
          at("2026-09-25", 4, function () { icCharge(e, p, "2026-09-25", false); }, "ic" + e.id);
        }
        if (e.id === "US" && !inSep) at(lastBusinessDay(p), 8, function () { E.monthEndTreasury(p, tomas, stamp(lastBusinessDay(p), "tr" + p)); }, "tr");
      });

      // US corporate cards: the month's statement at month end, paid on the 20th after.
      if (!inSep) {
        at(end, 6, function () {
          var us = E.entity.US, lines = [], total = 0;
          [["ENG", 9800], ["PRD", 3100], ["SAL", 14200], ["MKT", 5200], ["CS", 2100], ["GA", 4700]].forEach(function (x) {
            var te = mm(us, x[1] * jitter("card:" + x[0] + p, 0.25));
            var sw = mm(us, x[1] * 0.18 * jitter("cardsw:" + x[0] + p, 0.3));
            lines.push({ account: "6600", dr: te, dims: { dept: x[0] } });
            lines.push({ account: "6100", dr: sw, dims: { dept: x[0] } });
            total += te + sw;
          });
          lines.push({ account: "2500", cr: total });
          E.post({ entity: "US", date: end, memo: "Corporate cards — " + E.periodLabel(p, true) + " statement", source: { type: "cards", id: "CARD-" + p, label: "Card statement" },
            lines: lines, createdBy: "hannah", createdAt: stamp(E.addDays(end, 3), "card" + p) }, { system: true });
        }, "card");
      }
      var cardPay = businessDayOnOrAfter(p + "-20");
      if (cardPay <= AS_OF) at(cardPay, 3, function () {
        var bal = -E.balance("US", "2500", E.addMonths(p, -1) < FY + "-01" ? FY + "-01" : E.addMonths(p, -1));
        if (n === 1) bal = m(E.entity.US, 64000);
        if (bal <= 0) return;
        E.post({ entity: "US", date: cardPay, memo: "Corporate card payment — Amex", source: { type: "cards-pay", id: "CARDPAY-" + p, label: "Card payment" },
          lines: [{ account: "2500", dr: bal }, { account: "1010", cr: bal }], createdBy: "tomas", createdAt: stamp(cardPay, "cp" + p) }, { system: true });
      }, "cardpay");
    })(n);

    /* Parent recharges a subsidiary for engineering and platform services. */
    var IC_FEE = { UK: 12000000, JP: 9000000 };   // cents a month
    function icCharge(e, p, date, bothSides) {
      var usd = Math.round(IC_FEE[e.id] * (1 + (mi(p) - 1) * 0.01));
      E.post({ entity: "US", date: date, memo: "Intercompany recharge to " + e.name + " — " + E.periodLabel(p, true),
        source: { type: "ic", id: "IC-US-" + e.id + "-" + p, label: "Intercompany" },
        lines: [{ account: "1150", dr: usd, dims: { counterparty: e.id } }, { account: "4900", cr: usd, dims: { counterparty: e.id } }],
        createdBy: "hannah", createdAt: stamp(date, "icus" + e.id + p) }, { system: true });
      if (bothSides) {
        var local = E.fromUSD(usd, e.currency, E.rate(e.currency, p, "avg"));
        E.post({ entity: e.id, date: date, memo: "Intercompany recharge from OploCloud, Inc. — " + E.periodLabel(p, true) + " (" + E.fmt(usd, "USD") + ")",
          source: { type: "ic", id: "IC-" + e.id + "-" + p, label: "Intercompany" },
          lines: [{ account: "6900", dr: local, dims: { counterparty: "US", dept: "ENG" } },
                  { account: "2150", cr: local, dims: { counterparty: "US" }, fx: { cur: "USD", amt: -usd } }],
          createdBy: e.id === "UK" ? "oliver" : "aiko", createdAt: stamp(E.addDays(date, 2), "ic" + e.id + p) }, { system: true });
      }
    }
    // Quarterly settlement of the intercompany balance, in dollars.
    ["2026-04-15", "2026-07-15"].forEach(function (d) {
      ["UK", "JP"].forEach(function (id) {
        at(d, 2, function () {
          var e = E.entity[id], qEnd = E.addMonths(d.slice(0, 7), -1);
          var usd = E.icUSDOwn(id, qEnd);               // negative: owed
          if (!usd) return;
          var carry = E.fromUSD(-usd, e.currency, E.rate(e.currency, qEnd, "close"));
          var paid = E.fromUSD(-usd, e.currency, E.rate(e.currency, d.slice(0, 7), "avg"));
          var lines = [{ account: "2150", dr: carry, dims: { counterparty: "US" }, fx: { cur: "USD", amt: -usd } }, { account: "1010", cr: paid }];
          if (paid > carry) lines.push({ account: "7200", dr: paid - carry }); else if (carry > paid) lines.push({ account: "7200", cr: carry - paid });
          E.post({ entity: id, date: d, memo: "Settle intercompany balance with OploCloud, Inc. (" + E.fmt(-usd, "USD") + ")", source: { type: "ic-settle", id: "ICS-" + id + "-" + d, label: "Intercompany settlement" },
            lines: lines, createdBy: id === "UK" ? "oliver" : "aiko", createdAt: stamp(d, "ics" + id + d) }, { system: true });
          E.post({ entity: "US", date: d, memo: "Intercompany settlement received from " + e.name, source: { type: "ic-settle", id: "ICS-US-" + id + "-" + d, label: "Intercompany settlement" },
            lines: [{ account: "1010", dr: -usd }, { account: "1150", cr: -usd, dims: { counterparty: id } }], createdBy: "tomas", createdAt: stamp(d, "icsu" + id + d) }, { system: true });
        }, "ics" + id);
      });
    });
    // Taxes paid: US estimates, UK VAT, Japan consumption tax.
    [["2026-01-15", null], ["2026-04-15", "2026-03"], ["2026-06-15", "2026-05"], ["2026-09-15", "2026-08"]].forEach(function (x) {
      at(x[0], 3, function () {
        var bal = x[1] ? -E.balance("US", "2600", x[1]) : m(E.entity.US, 310000);
        if (bal <= 0) return;
        E.post({ entity: "US", date: x[0], memo: x[1] ? "Federal and state estimated income tax" : "FY2025 income tax balance due", source: { type: "tax-pay", id: "TAX-US-" + x[0], label: "Tax payment" },
          lines: [{ account: "2600", dr: bal }, { account: "1010", cr: bal }], createdBy: "tomas", createdAt: stamp(x[0], "tx" + x[0]) }, { system: true });
      }, "taxpay");
    });
    [["UK", "2026-02-06", null, 48200], ["UK", "2026-05-07", "2026-03"], ["UK", "2026-08-07", "2026-06"], ["JP", "2026-02-27", null, 3100000], ["JP", "2026-08-31", "2026-06"]].forEach(function (x) {
      at(x[1], 3, function () {
        var e = E.entity[x[0]];
        var bal = x[2] ? -E.balance(x[0], "2300", x[2]) : m(e, x[3]);
        if (bal <= 0) return;
        E.post({ entity: x[0], date: x[1], memo: x[0] === "UK" ? "VAT return — HMRC" : "Consumption tax — National Tax Agency", source: { type: "tax-pay", id: "VAT-" + x[0] + "-" + x[1], label: "Tax payment" },
          lines: [{ account: "2300", dr: bal }, { account: "1010", cr: bal }], createdBy: x[0] === "UK" ? "oliver" : "aiko", createdAt: stamp(x[1], "vat" + x[1]) }, { system: true });
      }, "vat");
    });
    // UK and Japan pay last year's corporation tax.
    at("2026-09-01", 3, function () {
      var e = E.entity.UK, bal = m(e, 41000);
      E.post({ entity: "UK", date: "2026-09-01", memo: "Corporation tax FY2025 — HMRC", source: { type: "tax-pay", id: "CT-UK-2025", label: "Tax payment" },
        lines: [{ account: "2600", dr: bal }, { account: "1010", cr: bal }], createdBy: "oliver", createdAt: stamp("2026-09-01", "ctuk") }, { system: true });
    }, "ct");
    at("2026-02-27", 3, function () {
      var e = E.entity.JP, bal = m(e, 6200000);
      E.post({ entity: "JP", date: "2026-02-27", memo: "Corporate tax FY2025 — National Tax Agency", source: { type: "tax-pay", id: "CT-JP-2025", label: "Tax payment" },
        lines: [{ account: "2600", dr: bal }, { account: "1010", cr: bal }], createdBy: "aiko", createdAt: stamp("2026-02-27", "ctjp") }, { system: true });
    }, "ct");

    /* ---- One-off purchases */
    // Insurance, paid for the year in January, amortized monthly.
    E.prepaids = [{ id: "PP-INS-2026", entity: "US", name: "Harborline Insurance — 2026 policy", account: "6500", dept: "GA", total: m(E.entity.US, 420000), monthly: m(E.entity.US, 35000), start: "2026-01" }];
    makeAP(E.vendors.harborline, "2026-01-05", m(E.entity.US, 420000), "2026 commercial package policy (Jan–Dec)");
    makeAP(E.vendors.dell, "2026-02-17", m(E.entity.US, 70 * 1240), "Latitude 7450 laptops ×70", false, { qty: 70, unit: m(E.entity.US, 1240) });
    makeAP(E.vendors.apple, "2026-06-09", m(E.entity.US, 50 * 2499), "MacBook Pro 14 ×50", false, { qty: 50, unit: m(E.entity.US, 2499), dept: "PRD" });
    ["2026-08-14", "2026-08-28", "2026-09-11"].forEach(function (d, i) {
      makeAP(E.vendors.crescent, d, m(E.entity.US, 9900), "Advisory services — " + ["strategy workshop", "market sizing", "pricing review"][i]);
    });

    /* Makes a vendor invoice that goes through capture, approval and payment
       on the dates the calendar gives it — and stops wherever today falls. */
    function makeAP(v, date, amount, desc, rent, extra) {
      if (!amount) return;
      extra = extra || {};
      var e = E.entity[v.entity];
      var key = v.id + date;
      var captured = rent ? E.addDays(date, -9) : businessDayOnOrAfter(E.addDays(date, 1 + Math.floor(h01("cap:" + key) * 3)));
      if (captured > AS_OF) return;
      var usd = E.usdOf(v.entity, amount, date.slice(0, 7), "avg");
      var approver = approverFor(e, usd);
      var approved = businessDayOnOrAfter(E.addDays(captured, 1 + Math.floor(h01("apr:" + key) * 4)));
      // What came in during the last week of September is still in the queue.
      if (captured >= "2026-09-21" && captured <= AS_OF) approved = "2026-10-0" + (1 + Math.floor(h01("q:" + key) * 5));
      var due = rent ? date : E.addDays(date, v.terms || 30);
      var id = "AP-" + String(E.nextId("APO", 4)).slice(4);
      var inv = {
        id: id, entity: v.entity, vendor: v.id, number: rent ? "RENT-" + date.slice(0, 7).replace("-", "") : pick("fmt:" + v.id, ["INV-", "", "No. ", "BILL-"]) + (10000 + Math.floor(h01("num:" + key) * 89999)),
        date: date, due: due, amount: amount, currency: e.currency, status: "captured",
        lines: [{ account: v.account, amt: amount, dept: extra.dept || v.dept, desc: desc, qty: extra.qty, unit: extra.unit }],
        flags: [], createdBy: PEOPLE_BY_ENTITY[v.entity], capturedAt: stamp(captured, "c" + key),
        capture: { method: pick("cm:" + v.id, ["email", "email", "email", "portal", "EDI"]), confidence: 0.94 + h01("cf:" + key) * 0.059 }
      };
      E.apInvoices[id] = inv;
      at(captured, 0, function () {
        inv.status = "review";
        E.record("ap.capture", id, "Captured " + inv.number + " from " + v.name + " · " + E.fmt(amount, e.currency) + " (" + inv.capture.method + ", " + Math.round(inv.capture.confidence * 100) + "% confidence)", {}, E.people[inv.createdBy], inv.capturedAt);
      }, "cap" + key);
      if (approved > AS_OF) return;
      at(approved, 1, function () {
        var j = E.approveAP(inv, approver, stamp(approved, "a" + key), true);
        E.record("ap.approve", id, "Approved " + inv.number + " from " + v.name + " · " + E.fmt(amount, e.currency) + " · posted " + j.id, {}, approver, inv.approvedAt);
      }, "apr" + key);
      // Paid on the last Thursday run before it is due (rent on the 1st).
      var run = rent ? date : thursdayOnOrBefore(E.addDays(due, -1));
      if (run < approved) run = thursdayOnOrAfter(approved);
      if (run > AS_OF) {
        at(approved, 2, function () {
          if (inv.status === "approved") { inv.status = "scheduled"; inv.scheduledFor = run; inv.scheduledBy = "tomas"; }
        }, "sch" + key);
        return;
      }
      at(run, 2, function () {
        E.payAP(inv, run, tomas, stamp(run, "p" + key), false);
        E.record("ap.pay", id, "Paid " + inv.number + " to " + v.name + " · " + E.fmt(amount, e.currency) + " · " + inv.payJournal, {}, tomas, stamp(run, "p" + key));
      }, "pay" + key);
    }

    /* ---- Run the year */
    while (heap.length) next().fn();

    /* ================================================ September, as it is */
    var US = E.entity.US;

    // The Aug invoice from Northbeam was paid; the "same" invoice came in again.
    var nb1 = makeFixedAP("northbeam", "2026-09-02", m(US, 18400), "2291", "Brand refresh — September retainer", { approvedBy: "marcus", paid: "2026-09-17" });
    var nb2 = makeFixedAP("northbeam", "2026-09-04", m(US, 18400), "2291A", "Brand refresh — September retainer", { captured: "2026-09-23" });
    nb2.flags.push({ code: "duplicate", sev: "serious", blocking: true, title: "Possible duplicate",
      detail: "Same vendor, amount and description as " + nb1.number + " (paid Sep 17, " + nb1.payJournal + "). Invoice numbers differ by one character.",
      rule: "Duplicate check: same vendor and amount within 30 days, invoice numbers alike.", other: nb1.id });

    // Three-way match: 100 laptops ordered and invoiced, 98 received.
    E.pos["PO-100238"] = { id: "PO-100238", entity: "US", vendor: "dell", date: "2026-09-02", status: "partially received", dept: "ENG", project: null,
      requester: "Engineering IT", approvedBy: "dana", total: m(US, 124000),
      lines: [{ desc: "Latitude 7450 laptops (32GB, 1TB)", qty: 100, unit: m(US, 1240), received: 98, receivedOn: "2026-09-22" }],
      budget: "Engineering · Equipment" };
    var dellInv = makeFixedAP("dell", "2026-09-23", m(US, 124000), "775120", "Latitude 7450 laptops ×100", { captured: "2026-09-24", qty: 100, unit: m(US, 1240) });
    dellInv.po = "PO-100238";
    dellInv.flags.push({ code: "match", sev: "serious", blocking: true, title: "Three-way match: quantity",
      detail: "Invoiced 100 × $1,240.00. Purchase order PO-100238: 100. Received: 98 (Sep 22). Difference $2,480.00.",
      rule: "Three-way match: invoice quantity must not exceed quantity received." });

    // The launch event: over budget, and above the controller's limit.
    var evInv = makeFixedAP("summitev", "2026-09-22", m(US, 310000), "SE-0934", "Roxan 3 launch event — venue, production, AV", { captured: "2026-09-23", project: "R3" });
    evInv.flags.push({ code: "budget", sev: "serious", blocking: false, title: "Over budget",
      detail: "Takes Marketing to 118% of its year-to-date budget.", rule: "Budget control: over 110% of budget needs the CFO." });
    E.exceptions["BX-0019"] = { id: "BX-0019", dept: "MKT", status: "open", ap: evInv.id, amount: E.usdOf("US", m(US, 310000), TODAY_P, "avg"),
      title: "Marketing over budget — Roxan 3 launch event", requestedBy: "leo",
      detail: "Summit Events Co. " + evInv.number + " for $310,000 would take Marketing to 118% of its year-to-date budget ($120,000 was planned for September events)." };

    // October rent — and a bank-detail change requested by email.
    var rent = makeFixedAP("hudson", "2026-10-01", m(US, 185000), "RENT-202610", "October 2026 rent — Hudson Yards, floors 5–6", { captured: "2026-09-22", rent: true });
    rent.flags.push({ code: "bank", sev: "critical", blocking: false, title: "Vendor bank details changed",
      detail: "New account at Coastal Federal Credit Union requested Sep 24 by email from billing@hudson-commons.co — not the domain on file.",
      rule: "SOD-03 · Payments are held until Treasury verifies new bank details by call-back." });

    // A few ordinary invoices still waiting for approval.
    [["whitman", "2026-09-21", 46350, "August–September legal services — commercial contracts"], ["keystone", "2026-09-24", 61240, "Contract engineering — September"],
     ["linkedin", "2026-09-25", 31800, "September campaigns"], ["datadog", "2026-09-24", 44120, "September observability"],
     ["zendesk", "2026-09-25", 24620, "September seats"], ["cloudflare", "2026-09-25", 38910, "September — Workers, R2, Zero Trust"]].forEach(function (x) {
      var already = Object.values(E.apInvoices).filter(function (i) { return i.vendor === x[0] && i.date.slice(0, 7) === "2026-09"; });
      if (already.length) return;
      makeFixedAP(x[0], x[1], m(US, x[2]), String(40000 + Math.floor(h01("sep:" + x[0]) * 50000)), x[3], { captured: businessDayOnOrAfter(E.addDays(x[1], 1)) });
    });

    function makeFixedAP(vid, date, amount, number, desc, o) {
      var v = E.vendors[vid], e = E.entity[v.entity];
      var id = "AP-" + String(E.nextId("APO", 4)).slice(4);
      var captured = o.captured || businessDayOnOrAfter(E.addDays(date, 1));
      var inv = { id: id, entity: v.entity, vendor: v.id, number: "INV-" + number, date: date, due: o.rent ? date : E.addDays(date, v.terms || 30), amount: amount, currency: e.currency,
        status: "review", lines: [{ account: v.account, amt: amount, dept: v.dept, desc: desc, qty: o.qty, unit: o.unit, project: o.project }],
        flags: [], createdBy: PEOPLE_BY_ENTITY[v.entity], capturedAt: stamp(captured, "fc" + id), capture: { method: "email", confidence: 0.97 } };
      if (o.rent) inv.number = number;
      E.apInvoices[id] = inv;
      E.record("ap.capture", id, "Captured " + inv.number + " from " + v.name + " · " + E.fmt(amount, e.currency), {}, E.people[inv.createdBy], inv.capturedAt);
      if (o.approvedBy) {
        var j = E.approveAP(inv, E.people[o.approvedBy], stamp(E.addDays(captured, 1), "fa" + id), true);
        E.record("ap.approve", id, "Approved " + inv.number + " from " + v.name + " · posted " + j.id, {}, E.people[o.approvedBy], inv.approvedAt);
      }
      if (o.paid) {
        E.payAP(inv, o.paid, tomas, stamp(o.paid, "fp" + id), false);
        E.record("ap.pay", id, "Paid " + inv.number + " to " + v.name + " · " + inv.payJournal, {}, tomas, stamp(o.paid, "fp" + id));
      }
      return inv;
    }

    // Manual journals waiting for approval, and one posted at an odd hour.
    var je1 = E.stage({ entity: "US", date: "2026-09-25", memo: "Reclass Q3 contractor costs to the OMaps 2.0 project",
      source: { type: "manual", label: "Manual journal" }, status: "pending", createdBy: "hannah", createdAt: "2026-09-25T20:14:00Z", submittedAt: "2026-09-25T20:15:00Z", needs: "controller",
      lines: [{ account: "6800", dr: m(US, 62000), dims: { dept: "ENG", project: "OM2" }, memo: "Keystone Talent — OMaps 2.0 engineers, Jul–Sep" },
              { account: "6800", cr: m(US, 62000), dims: { dept: "ENG" }, memo: "Out of unallocated contractors" }],
      attachments: [{ name: "OMaps-2.0-timesheets-Q3.xlsx", size: "84 KB" }] });
    var je2 = E.stage({ entity: "US", date: "2026-09-28", memo: "Accrue September legal fees — Whitman & Park (estimate)",
      source: { type: "manual", label: "Manual journal" }, status: "pending", createdBy: "marcus", createdAt: "2026-09-28T14:02:00Z", submittedAt: "2026-09-28T14:03:00Z", needs: "controller",
      lines: [{ account: "6400", dr: m(US, 38000), dims: { dept: "GA", vendor: "whitman" }, memo: "September matters, per engagement partner" },
              { account: "2100", cr: m(US, 38000), memo: "Accrued legal" }], reverseOn: "2026-10-01",
      attachments: [{ name: "Whitman-Park-Sept-estimate.pdf", size: "122 KB" }] });
    var je3 = E.stage({ entity: "UK", date: "2026-09-24", memo: "Accrue September recruiting fees — Kinetic Recruiting (estimate)",
      source: { type: "manual", label: "Manual journal" }, status: "pending", createdBy: "oliver", createdAt: "2026-09-24T10:31:00Z", submittedAt: "2026-09-24T10:33:00Z", needs: "controller",
      lines: [{ account: "6800", dr: m(E.entity.UK, 4200), dims: { dept: "SAL", vendor: "kinetic" }, memo: "Two senior AE placements" },
              { account: "2100", cr: m(E.entity.UK, 4200), memo: "Accrued recruiting fees" }], reverseOn: "2026-10-01",
      attachments: [{ name: "Kinetic-placements-Sep.pdf", size: "58 KB" }] });
    [je1, je2, je3].forEach(function (j) {
      E.record("journal.create", j.id, "Prepared " + j.id + " · " + j.memo + " · " + E.fmt(j.total, E.entity[j.entity].currency), {}, E.people[j.createdBy], j.createdAt);
      E.record("journal.submit", j.id, "Submitted " + j.id + " for approval", {}, E.people[j.createdBy], j.submittedAt);
    });
    var odd = E.post({ entity: "US", date: "2026-09-13", memo: "Reclass prepaid software — Datadog annual commit",
      source: { type: "manual", label: "Manual journal" }, createdBy: "hannah", createdAt: "2026-09-14T03:48:00Z", approvedBy: "marcus", approvedAt: "2026-09-14T03:52:00Z",
      lines: [{ account: "1200", dr: m(US, 48500), memo: "Datadog commit Oct–Dec" }, { account: "6100", cr: m(US, 48500), dims: { dept: "ENG", vendor: "datadog" } }] }, { system: true });
    E.record("journal.approve", odd.id, "Approved and posted " + odd.id + " · Reclass prepaid software · " + E.fmt(odd.total, "USD"), {}, E.people.marcus, odd.approvedAt);

    // Cards: somebody split a purchase to stay under the $500 limit.
    E.cards = [];
    var CARDHOLDERS = ["Jordan Blake", "Sam Okafor", "Riley Chen", "Morgan Patel", "Avery Lindqvist", "Casey Romero"];
    for (var d = "2026-09-01"; d <= "2026-09-27"; d = E.addDays(d, 1)) {
      var k = Math.floor(h01("cardn:" + d) * 4);
      for (var i = 0; i < k; i++) {
        var who = pick("cw:" + d + i, CARDHOLDERS);
        var merch = pick("cm:" + d + i, ["Delta Air Lines", "Marriott", "Uber", "Lyft", "Blue Bottle Coffee", "Figma", "Notion", "Hilton", "Sweetgreen", "Amtrak"]);
        E.cards.push({ id: "CRD-" + d.replace(/-/g, "") + i, date: d, holder: who, merchant: merch, amount: m(US, Math.round(18 + h01("ca:" + d + i) * 420)),
          account: /Figma|Notion/.test(merch) ? "6100" : "6600", status: h01("cs:" + d + i) < 0.8 ? "receipt" : "missing receipt" });
      }
    }
    for (i = 0; i < 4; i++) E.cards.push({ id: "CRD-20260919S" + i, date: "2026-09-19", holder: "Jordan Blake", merchant: "Apple Store Fifth Avenue", amount: m(US, 499), account: "6100", status: "receipt", split: true });

    /* ---- Anomalies the rules raised */
    E.anomalies["AN-0071"] = { id: "AN-0071", kind: "bank-change", sev: "critical", status: "open", refs: ["hudson"], amount: E.usdOf("US", m(US, 185000), TODAY_P, "close"),
      title: "Vendor bank details changed by email", detail: "Hudson Commons LLC — new account requested from a look-alike domain (hudson-commons.co). $185,000 October rent due Oct 1.",
      rule: "R-12 · A change to a vendor's bank details holds payments until verified by call-back.", raisedAt: "2026-09-24T19:42:30Z" };
    E.anomalies["AN-0072"] = { id: "AN-0072", kind: "split", sev: "serious", status: "open", refs: ["CRD-20260919S0"], amount: m(US, 1996),
      title: "Possible split purchase — 4 × $499.00", detail: "Jordan Blake, Apple Store Fifth Avenue, Sep 19: four charges of $499.00 within 11 minutes. Single-purchase limit is $500.",
      rule: "R-07 · Several charges at one merchant, same day, each just under a limit.", raisedAt: "2026-09-20T06:00:00Z" };
    E.anomalies["AN-0073"] = { id: "AN-0073", kind: "threshold", sev: "serious", status: "open", refs: ["crescent"], amount: m(US, 29700),
      title: "Payments just under the approval threshold", detail: "Crescent Advisory Group (new vendor, created Aug 10): three invoices of $9,900.00 in 29 days. Invoices of $10,000 and more need a second approver.",
      rule: "R-03 · Repeated amounts within 2% below an approval threshold to one vendor in 30 days.", raisedAt: "2026-09-12T06:00:00Z" };
    E.anomalies["AN-0074"] = { id: "AN-0074", kind: "off-hours", sev: "attention", status: "open", refs: [odd.id], amount: odd.total,
      title: "Manual journal posted outside business hours", detail: odd.id + " (" + E.fmt(odd.total, "USD") + ") was prepared at 11:48 pm and approved at 11:52 pm on Sunday, Sep 13.",
      rule: "R-15 · Manual journals prepared or approved between 10 pm and 6 am, or at weekends.", raisedAt: "2026-09-14T06:00:00Z" };

    // A customer's wire that reached the bank before anyone applied it.
    var jr = Object.values(E.arInvoices).filter(function (i) { return i.customer === "northfield" && i.balance > 0; })[0] ||
             Object.values(E.arInvoices).filter(function (i) { return i.entity === "US" && i.balance > m(US, 50000) && i.due < AS_OF; })[0];

    /* ---- Bank feeds: every cash line in the books reaches the bank a
       little later, and a few things reach the bank the books do not know. */
    var lag = { "ap-pay": 1, "ar-pay": 0, settlement: 1, payroll: 0, transfer: 0, treasury: 0, "tax-pay": 1, "cards-pay": 1, "ic-settle": 1, "manual": 0, bank: 0 };
    var DESC = {
      "ap-pay": function (l) { return "ACH DEBIT " + (E.vendors[l.dims.vendor] ? E.vendors[l.dims.vendor].name.toUpperCase() : "VENDOR"); },
      "ar-pay": function (l) { return (h01("w:" + l.key) < 0.5 ? "WIRE IN " : "ACH CREDIT ") + (E.customers[l.dims.customer] ? E.customers[l.dims.customer].name.toUpperCase().slice(0, 28) : "CUSTOMER"); },
      settlement: function () { return "OPLO PAY SETTLEMENT"; },
      payroll: function () { return "PAYROLL — OPLO PEOPLE"; },
      transfer: function (l) { return l.amt > 0 ? "BOOK TRANSFER FROM ••4821" : "BOOK TRANSFER TO ••7730"; },
      treasury: function (l) { return l.amt > 0 ? "INTEREST CREDIT" : "LOAN PAYMENT — TERM LOAN"; },
      "tax-pay": function (l) { return l.entity === "US" ? "EFTPS USA TAX PYMT" : l.entity === "UK" ? "HMRC VAT" : "NTA TAX PAYMENT"; },
      "cards-pay": function () { return "AMEX EPAYMENT"; },
      "ic-settle": function (l) { return l.amt > 0 ? "WIRE IN OPLOCLOUD" : "WIRE OUT OPLOCLOUD INC"; }
    };
    var outstanding = {};
    // Two vendors paid by check on Sep 24 have not cleared.
    E.lines.filter(function (l) { return l.entity === "US" && l.account === "1010" && l.date === "2026-09-24" && l.source.type === "ap-pay"; })
      .slice(0, 2).forEach(function (l) { outstanding[l.key] = 1; });
    var bn = 0;
    E.lines.forEach(function (l) {
      var acct = E.accounts[l.account];
      if (!acct.bank || l.source.type === "open" || outstanding[l.key]) return;
      var b = Object.values(E.bankAccounts).filter(function (x) { return x.entity === l.entity && x.account === l.account; })[0];
      if (!b) return;
      var d = businessDayOnOrAfter(E.addDays(l.date, lag[l.source.type] || 0));
      if (d > "2026-09-26") return;       // not at the bank yet: an outstanding item
      var id = "BL-" + (++bn);
      E.bankLines[id] = { id: id, bank: b.id, date: d, amount: l.amt, desc: (DESC[l.source.type] || function () { return "TRANSFER"; })(l),
        ref: "REF" + (100000000 + Math.floor(h01("ref:" + l.key) * 899999999)), status: d <= b.recThrough ? "matched" : "unmatched",
        matches: d <= b.recThrough ? [l.key] : [], matchedBy: d <= b.recThrough ? "tomas" : null };
    });
    function bankOnly(bankId, date, amount, desc, kind) {
      var id = "BL-" + (++bn);
      E.bankLines[id] = { id: id, bank: bankId, date: date, amount: amount, desc: desc, kind: kind, ref: "REF" + (100000000 + Math.floor(h01("bo:" + id) * 899999999)), status: "unmatched", matches: [] };
      return E.bankLines[id];
    }
    // Monthly bank fees, booked for the closed months, not yet for September.
    for (n = 1; n <= 9; n++) {
      var feeDate = businessDayOnOrAfter(ym(n) + "-25"), fee = m(US, 170 + Math.round(h01("fee" + n) * 60));
      if (feeDate > "2026-09-26") continue;
      var fl = bankOnly("us-op", feeDate, -fee, "ACCOUNT ANALYSIS FEE", "fee");
      if (n < 9) {
        var fj = E.post({ entity: "US", date: feeDate, memo: "Bank service charge — JPMorgan", source: { type: "bank", id: fl.id, label: "Bank entry" },
          lines: [{ account: "6650", dr: fee, dims: { dept: "GA" } }, { account: "1010", cr: fee }], createdBy: "tomas", createdAt: stamp(feeDate, "fee" + n) }, { system: true });
        fl.status = "matched"; fl.matches = [fj.id + "#1"]; fl.created = fj.id; fl.matchedBy = "tomas";
      }
    }
    bankOnly("us-op", "2026-09-23", -m(US, 1240.5), "OPLO PAY CHARGEBACK — DISPUTE 88213", "chargeback");
    if (jr) bankOnly("us-op", "2026-09-24", jr.balance, "WIRE IN " + E.customers[jr.customer].name.toUpperCase().replace("UNIVERSITY", "UNIV").slice(0, 30), "wire");
    bankOnly("uk-op", "2026-09-25", -m(E.entity.UK, 18), "BARCLAYS COMMERCIAL CHARGES", "fee");

    /* ---- Budgets: the plan for 2026, set in December */
    E.budgets = {};
    function bud(e, dept, acct, n, v) {
      var k = e + "|" + dept + "|" + acct;
      if (!E.budgets[k]) E.budgets[k] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      E.budgets[k][n] += v;
    }
    E.entities.forEach(function (e) {
      var roundTo = e.currency === "JPY" ? 100000 : 100000;   // $1,000 / ¥100,000 in minor units
      function rnd(v) { return Math.round(v / roundTo) * roundTo; }
      for (var n = 0; n < 12; n++) {
        // Revenue: self-serve at plan growth; contracts and usage as sold.
        var selfPlan = SELF[e.id][0] * Math.pow(1 + SELF_PLAN[e.id], n);
        bud(e.id, "REV", "4000", n, -rnd(m(e, selfPlan)));
        var ent = 0, use = 0;
        Object.values(E.customers).forEach(function (c) {
          if (c.entity !== e.id) return;
          if (c.mrr) ent += c.mrr;
          if (c.usage) use += m(e, USAGE[c.id][0] * Math.pow(1 + USAGE[c.id][1] * 1.08, n));
        });
        bud(e.id, "REV", "4100", n, -rnd(ent));
        bud(e.id, "REV", "4200", n, -rnd(use));
        bud(e.id, "GA", "5100", n, rnd(m(e, selfPlan * 0.029)));
        // Payroll at plan hiring.
        var pr = PAYROLL[e.id];
        Object.keys(pr.d).forEach(function (d) {
          var sal = pr.d[d] * Math.pow(1 + pr.g * 1.1, n);
          bud(e.id, d, "6000", n, rnd(m(e, sal)));
          bud(e.id, d, "6050", n, rnd(m(e, sal * pr.tax)));
        });
        // Vendors.
        Object.values(E.vendors).forEach(function (v) {
          if (v.entity !== e.id) return;
          var acct = v.account;
          if (E.accounts[acct].bs) return;
          var plan = vendorPlan(E, v, n);
          if (plan) bud(e.id, v.dept, acct, n, rnd(plan));
        });
        if (e.id === "US") {
          bud("US", "GA", "6500", n, m(e, 35000));
          [["ENG", 11500], ["PRD", 3600], ["SAL", 16500], ["MKT", 6000], ["CS", 2500], ["GA", 5500]].forEach(function (x) {
            bud("US", x[0], "6600", n, rnd(m(e, x[1])));
            bud("US", x[0], "6100", n, rnd(m(e, x[1] * 0.2)));
          });
          bud("US", "ENG", "6700", n, m(e, 42000)); bud("US", "GA", "6700", n, m(e, 17000)); bud("US", "PRD", "6700", n, m(e, 4000)); bud("US", "SAL", "6700", n, m(e, 2000));
          bud("US", "GA", "6650", n, m(e, 250));
        } else {
          bud(e.id, "ENG", "6700", n, rnd(m(e, e.id === "UK" ? 2200 : 700000)));
          bud(e.id, "GA", "6700", n, rnd(m(e, e.id === "UK" ? 2900 : 340000)));
        }
      }
    });

    /* ---- Periods: January to June locked, July and August closed. */
    var CLOSED = [["2026-01", 9, "2026-02-11"], ["2026-02", 8, "2026-03-11"], ["2026-03", 9, "2026-04-10"], ["2026-04", 7, "2026-05-11"],
                  ["2026-05", 7, "2026-06-09"], ["2026-06", 8, "2026-07-10"], ["2026-07", 6, "2026-08-10"], ["2026-08", 6, "2026-09-09"]];
    CLOSED.forEach(function (c) {
      E.entities.forEach(function (e) {
        E.setPeriod(e.id, c[0], c[0] <= "2026-06" ? "locked" : "closed", "dana", c[2] + "T21:00:00Z");
      });
      E.closeHistory.push({ period: c[0], days: c[1], closedAt: c[2], by: "dana" });
      E.record("period.set", "ALL:" + c[0], E.periodLabel(c[0], true) + " closed for all entities after " + c[1] + " working days", { after: { status: "closed" } }, E.people.dana, c[2] + "T21:00:00Z");
      if (c[0] <= "2026-06") E.record("period.set", "ALL:" + c[0], E.periodLabel(c[0], true) + " locked", { after: { status: "locked" } }, E.people.dana, E.addDays(c[2], 20) + "T21:00:00Z");
    });

    /* ---- The September close checklist */
    var T = [
      ["C-01", "Publish the September close calendar", "Planning", "marcus", "2026-09-21", "WD−7", null, [], "done", "2026-09-21T14:10:00Z"],
      ["C-02", "Review open purchase orders for receipt", "Payables", "priya", "2026-09-25", "WD−3", null, [], "done", "2026-09-25T19:30:00Z"],
      ["C-03", "Confirm September customer invoicing is complete", "Receivables", "hannah", "2026-09-25", "WD−3", null, [], "done", "2026-09-25T21:05:00Z"],
      ["C-04", "Approve open vendor invoices (AP cut-off)", "Payables", "marcus", "2026-09-29", "WD−1", null, [], "in-progress"],
      ["C-05", "Confirm intercompany recharges with UK and Japan", "Intercompany", "hannah", "2026-09-29", "WD−1", "intercompany", [], "todo"],
      ["C-06", "Reconcile JPMorgan operating account", "Cash", "tomas", "2026-09-29", "WD−1", null, [], "in-progress"],
      ["C-07", "Bill September usage (Roxan API, OMaps API)", "Revenue", "hannah", "2026-10-01", "WD+1", "usage", [], "todo"],
      ["C-08", "Run September revenue recognition", "Revenue", "hannah", "2026-10-01", "WD+1", "revrec", [], "todo"],
      ["C-09", "Accrue September cloud usage", "Accruals", "marcus", "2026-10-01", "WD+1", "cloudAccrual", [], "todo"],
      ["C-10", "Accrue payroll for September 16–30", "Accruals", "marcus", "2026-10-01", "WD+1", "payrollAccrual", [], "todo"],
      ["C-11", "Amortize prepaid insurance", "Accruals", "hannah", "2026-10-01", "WD+1", "prepaid", [], "todo"],
      ["C-12", "Month-end treasury entries (interest, debt service)", "Cash", "tomas", "2026-10-01", "WD+1", "treasury", [], "todo"],
      ["C-13", "Run September depreciation", "Fixed assets", "hannah", "2026-10-02", "WD+2", "depreciation", ["C-04"], "todo"],
      ["C-14", "Revalue foreign-currency balances", "FX", "oliver", "2026-10-02", "WD+2", "fxreval", ["C-05"], "todo"],
      ["C-15", "Reconcile every bank account", "Cash", "tomas", "2026-10-02", "WD+2", null, ["C-06", "C-12"], "todo"],
      ["C-16", "Reconcile AR and AP subledgers to the ledger", "Reconciliation", "hannah", "2026-10-02", "WD+2", null, ["C-04", "C-07"], "todo"],
      ["C-17", "Income tax provision", "Tax", "marcus", "2026-10-05", "WD+3", "tax", ["C-07", "C-08", "C-09", "C-10", "C-11", "C-12", "C-13", "C-14"], "todo"],
      ["C-18", "Flux review: actual against budget and August", "Review", "leo", "2026-10-05", "WD+3", null, ["C-17"], "todo"],
      ["C-19", "Controller review and sign-off", "Review", "marcus", "2026-10-06", "WD+4", null, ["C-15", "C-16", "C-18"], "todo"],
      ["C-20", "CFO approval — close September", "Review", "dana", "2026-10-07", "WD+5", null, ["C-19"], "todo"]
    ];
    T.forEach(function (t) {
      E.closeTasks[t[0]] = { id: t[0], period: TODAY_P, entity: "ALL", title: t[1], area: t[2], owner: t[3], due: t[4], wd: t[5], run: t[6], deps: t[7],
        status: t[8], completedAt: t[9] || null, completedBy: t[9] ? t[3] : null, journals: [] };
      if (t[9]) E.record("close.task", t[0], "Completed “" + t[1] + "”", {}, E.people[t[3]], t[9]);
    });

    /* ---- Recurring flows the cash forecast projects */
    var usPayHalf = function () {
      var s = 0, half = E.payrollHalf("US", TODAY_P);
      Object.keys(half).forEach(function (d) { s += half[d].sal + half[d].tax; });
      return s;
    };
    E.recurring = [
      { entity: "US", label: "Payroll", when: function (d) { return d === businessDayOnOrBefore(d.slice(0, 7) + "-15") || d === lastBusinessDay(d.slice(0, 7)); }, amount: function () { return -usPayHalf(); } },
      { entity: "UK", label: "Payroll", when: function (d) { return d === businessDayOnOrBefore(d.slice(0, 7) + "-25"); }, amount: function () { return -mm(E.entity.UK, 208000 * 1.16 * 1.09); } },
      { entity: "JP", label: "Payroll", when: function (d) { return d === businessDayOnOrBefore(d.slice(0, 7) + "-25"); }, amount: function () { return -mm(E.entity.JP, 25500000 * 1.155 * 1.07); } },
      { entity: "US", label: "Customer receipts", when: function (d) { return E.weekday(d) === 5; }, amount: function (d) { return mm(E.entity.US, SELF.US[0] * Math.pow(1 + SELF.US[1], mi(d.slice(0, 7)) - 1) * 12 / 52 * 0.971); } },
      { entity: "UK", label: "Customer receipts", when: function (d) { return E.weekday(d) === 5; }, amount: function (d) { return mm(E.entity.UK, SELF.UK[0] * Math.pow(1 + SELF.UK[1], mi(d.slice(0, 7)) - 1) * 12 / 52 * 0.971); } },
      { entity: "JP", label: "Customer receipts", when: function (d) { return E.weekday(d) === 5; }, amount: function (d) { return mm(E.entity.JP, SELF.JP[0] * Math.pow(1 + SELF.JP[1], mi(d.slice(0, 7)) - 1) * 12 / 52 * 0.971); } },
      { entity: "US", label: "Customer receipts", when: function (d) { return d.slice(8) === "15" && d >= "2026-10-15"; }, amount: function () {
          var s = 0; Object.values(E.contracts).forEach(function (k) { if (k.entity === "US" && k.billing === "monthly") s += k.mrr; });
          Object.values(E.customers).forEach(function (c) { if (c.entity === "US" && c.usage) s += E.meter(c, TODAY_P); });
          return Math.round(s * 0.9); } },
      { entity: "US", label: "Rent", when: function (d) { return d.slice(8) === "01" && d >= "2026-11-01"; }, amount: function () { return -m(E.entity.US, 185000); } },
      { entity: "US", label: "Vendor payments", when: function (d) { return E.weekday(d) === 4 && d >= "2026-10-29"; }, amount: function () { return -m(E.entity.US, 205000); } },
      { entity: "US", label: "Debt service", when: function (d) { return d === lastBusinessDay(d.slice(0, 7)); }, amount: function () { return -m(E.entity.US, 100000 + 34000); } },
      { entity: "US", label: "Taxes", when: function (d) { return d === "2026-12-15"; }, amount: function () { return -m(E.entity.US, 640000); } }
    ];

    // What the launch event would do to Marketing, in the engine's own words.
    var chk = E.budgetCheck("US", "MKT", E.usdOf("US", evInv.amount, TODAY_P, "avg"));
    var pct = Math.round(chk.after * 100), now = Math.round(chk.before * 100);
    evInv.flags[0].detail = "Takes Marketing from " + now + "% to " + pct + "% of its year-to-date budget.";
    E.exceptions["BX-0019"].detail = "Summit Events Co. " + evInv.number + " for $310,000 would take Marketing from " + now + "% to " + pct +
      "% of its year-to-date budget. $120,000 was planned for September events.";

    // Sort the trail by time and number it; the seed wrote it out of order.
    E.audit.sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : 0; });
    E.audit.forEach(function (ev, i) { ev.seq = i + 1; });
    E.seeded = true;
    return E;
  };

  EFM.create = function () {
    var E = new Engine({ asOf: AS_OF });
    EFM.seed(E);
    return E;
  };
})(typeof window !== "undefined" ? window : globalThis);
