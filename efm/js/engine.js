/* ==========================================================================
   OC EFM — the accounting engine.

   Everything on every screen is read from here, and every change anybody makes
   goes through exec(). The screens never add up numbers of their own: a
   statement, an aging, a budget line and a KPI tile are all queries over the
   same posted ledger, so they cannot disagree.

   The rules it keeps, whatever a screen asks for:

     · Money is an integer number of minor units (cents, pence, yen). Never a
       float — 0.1 + 0.2 has no place in a ledger.
     · A journal posts only if it balances (debits = credits, both > 0), every
       account exists and takes postings, and its period is open.
     · Posted journals are never edited. A mistake is corrected by a reversing
       journal that points back at it, so the history stays whole.
     · Who may do what is decided here (can()), including separation of duties:
       whoever prepared a document may not also approve it.
     · Every command appends to the audit trail, which is hash-chained so a
       changed or deleted event is detectable (verifyAudit()).

   Nothing here touches the DOM, so the same file can run in a Worker later,
   behind an API, unchanged.
   ========================================================================== */
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ Constants */

  var CUR = {
    USD: { dp: 2, sym: "$", name: "US dollar" },
    GBP: { dp: 2, sym: "£", name: "Pound sterling" },
    JPY: { dp: 0, sym: "¥", name: "Japanese yen" }
  };

  /* The group chart of accounts. One chart for every entity, so a line in
     London and a line in Tokyo land on the same account and consolidate
     without a mapping table. */
  var COA = [
    ["1010", "Operating account", "asset", "cash", { bank: true }],
    ["1020", "Payroll account", "asset", "cash", { bank: true }],
    ["1030", "Treasury reserve", "asset", "cash", { bank: true }],
    ["1100", "Accounts receivable", "asset", "ar", { control: "ar" }],
    ["1150", "Due from affiliates", "asset", "ic", { ic: true }],
    ["1200", "Prepaid expenses", "asset", "prepaid"],
    ["1510", "Computer equipment", "asset", "ppe", { control: "fa" }],
    ["1520", "Servers & network", "asset", "ppe", { control: "fa" }],
    ["1530", "Furniture & leaseholds", "asset", "ppe", { control: "fa" }],
    ["1590", "Accumulated depreciation", "asset", "accdep", { contra: true, control: "fa" }],
    ["2000", "Accounts payable", "liability", "ap", { control: "ap" }],
    ["2100", "Accrued liabilities", "liability", "accrued"],
    ["2150", "Due to affiliates", "liability", "ic", { ic: true }],
    ["2200", "Deferred revenue", "liability", "deferred"],
    ["2300", "Sales tax & VAT payable", "liability", "tax"],
    ["2400", "Payroll liabilities", "liability", "payroll"],
    ["2500", "Corporate cards payable", "liability", "cards"],
    ["2600", "Income tax payable", "liability", "inctax"],
    ["2700", "Term loan", "liability", "debt"],
    ["3000", "Common stock & APIC", "equity", "capital"],
    ["3100", "Retained earnings", "equity", "re"],
    ["4000", "Subscription revenue", "revenue", "rev"],
    ["4100", "Enterprise & services revenue", "revenue", "rev"],
    ["4200", "Usage revenue", "revenue", "rev"],
    ["4900", "Intercompany revenue", "revenue", "icrev", { ic: true }],
    ["5000", "Cloud infrastructure", "expense", "cogs"],
    ["5100", "Payment processing", "expense", "cogs"],
    ["5200", "Customer support tools", "expense", "cogs"],
    ["6000", "Salaries & wages", "expense", "people"],
    ["6050", "Payroll taxes & benefits", "expense", "people"],
    ["6800", "Contractors", "expense", "people"],
    ["6100", "Software & subscriptions", "expense", "opex"],
    ["6200", "Advertising & marketing", "expense", "opex"],
    ["6250", "Events & sponsorships", "expense", "opex"],
    ["6300", "Rent & facilities", "expense", "opex"],
    ["6400", "Legal & professional", "expense", "opex"],
    ["6500", "Insurance", "expense", "opex"],
    ["6600", "Travel & meals", "expense", "opex"],
    ["6650", "Bank & card fees", "expense", "opex"],
    ["6700", "Depreciation", "expense", "opex"],
    ["6900", "Intercompany service fees", "expense", "icexp", { ic: true }],
    ["7000", "Interest income", "revenue", "other"],
    ["7100", "Interest expense", "expense", "other"],
    ["7200", "Foreign exchange (gain) loss", "expense", "other"],
    ["8000", "Income tax expense", "expense", "tax"]
  ];

  /* How the chart is grouped in the tree, top to bottom. */
  var HEADERS = [
    ["1000", "Cash & equivalents", ["1010", "1020", "1030"]],
    ["1100", "Receivables", ["1100", "1150"]],
    ["1200", "Other current assets", ["1200"]],
    ["1500", "Property & equipment", ["1510", "1520", "1530", "1590"]],
    ["2000", "Current liabilities", ["2000", "2100", "2150", "2200", "2300", "2400", "2500", "2600"]],
    ["2700", "Long-term liabilities", ["2700"]],
    ["3000", "Equity", ["3000", "3100"]],
    ["4000", "Revenue", ["4000", "4100", "4200", "4900"]],
    ["5000", "Cost of revenue", ["5000", "5100", "5200"]],
    ["6000", "Operating expenses", ["6000", "6050", "6800", "6100", "6200", "6250", "6300", "6400", "6500", "6600", "6650", "6700", "6900"]],
    ["7000", "Other income & expense", ["7000", "7100", "7200"]],
    ["8000", "Income taxes", ["8000"]]
  ];

  var DIMS = {
    dept: [
      ["ENG", "Engineering"], ["PRD", "Product & Design"], ["SAL", "Sales"],
      ["MKT", "Marketing"], ["CS", "Customer Success"], ["GA", "General & Administrative"]
    ],
    product: [
      ["EDU", "OEdu"], ["RXN", "Roxan"], ["WKS", "Oplo Workspace"],
      ["MAP", "OMaps"], ["PLS", "Oplo+"]
    ],
    project: [
      ["R3", "Roxan 3 launch"], ["OM2", "OMaps 2.0"],
      ["EUR", "EU data residency"], ["DST", "OEdu district rollout"]
    ]
  };

  /* The people the sandbox's documents were prepared and approved by. The
     signed-in person is "me" and plays whichever role they choose. */
  var PEOPLE = {
    dana:   { id: "dana",   name: "Dana Whitfield",  role: "cfo",        title: "Chief Financial Officer" },
    marcus: { id: "marcus", name: "Marcus Oyelaran", role: "controller", title: "Controller" },
    priya:  { id: "priya",  name: "Priya Nair",      role: "ap",         title: "AP Specialist" },
    tomas:  { id: "tomas",  name: "Tomás Reyes",     role: "treasury",   title: "Treasury Manager" },
    hannah: { id: "hannah", name: "Hannah Kim",      role: "controller", title: "Senior Accountant" },
    leo:    { id: "leo",    name: "Leo Brandt",      role: "cfo",        title: "Head of FP&A" },
    oliver: { id: "oliver", name: "Oliver Hughes",   role: "controller", title: "Finance Manager, UK" },
    aiko:   { id: "aiko",   name: "Aiko Tanaka",     role: "controller", title: "Finance Lead, Japan" },
    grace:  { id: "grace",  name: "Grace Adeyemi",   role: "auditor",    title: "Internal Auditor" },
    system: { id: "system", name: "OC EFM",          role: "system",     title: "Automation" }
  };

  var ROLES = {
    cfo:        { name: "CFO",           blurb: "Performance, cash, risk and approvals above every limit." },
    controller: { name: "Controller",    blurb: "The ledger, journals, reconciliations and the close." },
    ap:         { name: "AP Specialist", blurb: "Vendor invoices: capture, coding, exceptions." },
    treasury:   { name: "Treasury",      blurb: "Cash, banks, payment runs and liquidity." },
    auditor:    { name: "Auditor",       blurb: "Read-only. The trail, the controls and what broke them." }
  };

  /* Approval limits, in USD. Above the limit the next role up must approve. */
  var LIMITS = { journal: { controller: 250000 }, ap: { controller: 100000 } };

  /* Every permission, with the rule it comes from, so a refusal can say why. */
  var PERMS = {
    "journal.create":   { roles: ["cfo", "controller"], rule: "Only accountants and the CFO prepare journals." },
    "journal.approve":  { roles: ["cfo", "controller"], rule: "Journals are approved by a controller (up to $250,000) or the CFO." },
    "journal.reverse":  { roles: ["cfo", "controller"], rule: "Only accountants and the CFO reverse journals." },
    "ap.code":          { roles: ["ap", "controller"], rule: "Invoices are coded by Accounts Payable." },
    "ap.approve":       { roles: ["cfo", "controller"], rule: "SOD-01 · Whoever captures invoices may not approve them. Controllers approve up to $100,000; the CFO above." },
    "ap.hold":          { roles: ["ap", "controller", "cfo"], rule: "Holds are placed by Accounts Payable or a controller." },
    "ap.pay":           { roles: ["treasury", "cfo"], rule: "SOD-02 · Payments are released by Treasury, never by whoever approved the invoice." },
    "vendor.verify":    { roles: ["treasury", "cfo"], rule: "SOD-03 · Bank-detail changes are verified by Treasury, by call-back to a number already on file." },
    "ar.apply":         { roles: ["treasury", "controller"], rule: "Cash is applied by Treasury or a controller." },
    "ar.collect":       { roles: ["controller", "treasury", "cfo"], rule: "Collections are worked by finance." },
    "bank.match":       { roles: ["treasury", "controller"], rule: "Bank reconciliations are prepared by Treasury or a controller." },
    "asset.depreciate": { roles: ["controller"], rule: "Depreciation is run by a controller." },
    "close.task":       { roles: ["controller", "cfo", "treasury", "ap"], rule: "Close tasks are completed by finance." },
    "period.close":     { roles: ["controller", "cfo"], rule: "A controller closes a period; only the CFO locks one." },
    "period.lock":      { roles: ["cfo"], rule: "Only the CFO locks a period." },
    "budget.approve":   { roles: ["cfo"], rule: "Spending over budget is approved by the CFO." },
    "anomaly.resolve":  { roles: ["controller", "cfo", "auditor"], rule: "Flags are resolved by a controller, the CFO or Internal Audit." },
    "vendor.create":    { roles: ["ap", "controller", "cfo"], rule: "Vendors are added by Accounts Payable or a controller." },
    "customer.create":  { roles: ["controller", "treasury", "cfo"], rule: "Customers are added by finance." },
    "txn.post":         { roles: ["ap", "controller", "treasury", "cfo"], rule: "Transactions are recorded by finance." },
    "ap.capture":       { roles: ["ap", "controller"], rule: "Vendor bills are captured by Accounts Payable." },
    "ar.issue":         { roles: ["controller", "treasury", "cfo"], rule: "Customer invoices are issued by finance." },
    "asset.acquire":    { roles: ["controller", "cfo"], rule: "Fixed assets are added by a controller." },
    "card.record":      { roles: ["ap", "controller", "cfo"], rule: "Card charges are recorded by Accounts Payable or a controller." },
    "audit.verify":     { roles: ["cfo", "controller", "treasury", "ap", "auditor"], rule: "" }
  };

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July",
                     "August", "September", "October", "November", "December"];

  /* ------------------------------------------------------------- Helpers */

  function pad(n, w) { n = String(n); while (n.length < (w || 2)) n = "0" + n; return n; }
  function periodOf(date) { return date.slice(0, 7); }
  function periodLabel(p, long) {
    var m = +p.slice(5, 7) - 1;
    return (long ? MONTHS_LONG[m] : MONTHS[m]) + " " + p.slice(0, 4);
  }
  function addMonths(p, n) {
    var y = +p.slice(0, 4), m = +p.slice(5, 7) - 1 + n;
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    return y + "-" + pad(m + 1);
  }
  function periodsBetween(from, to) {
    var out = [], p = from;
    while (p <= to) { out.push(p); p = addMonths(p, 1); }
    return out;
  }
  function lastDay(p) {
    var y = +p.slice(0, 4), m = +p.slice(5, 7);
    return p + "-" + pad(new Date(Date.UTC(y, m, 0)).getUTCDate());
  }
  function addDays(date, n) {
    var d = new Date(date + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function daysBetween(a, b) {
    return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5);
  }
  function weekday(date) { return new Date(date + "T00:00:00Z").getUTCDay(); }
  function quarterStart(p) {
    var m = +p.slice(5, 7);
    return p.slice(0, 5) + pad(m - ((m - 1) % 3));
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  /* The calendar day in New York at an instant: the books' "today". */
  var nyFmt = null;
  function nyDate(iso) {
    if (!nyFmt) nyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });
    return nyFmt.format(new Date(iso));
  }
  /* Bumped whenever a change alters what a command does to the books, so a
     browser running older code than the server can be told to reload rather
     than quietly compute something different. */
  var ENGINE_VERSION = "2";
  function shortDate(d) { return MONTHS[+d.slice(5, 7) - 1] + " " + (+d.slice(8, 10)); }

  /* SHA-256, synchronous, for the audit chain. Small and dependency-free so
     the chain can be verified anywhere, including in a Worker. */
  var sha256 = (function () {
    var K = [], H0 = [];
    (function () {
      function frac(x) { return ((x - Math.floor(x)) * 4294967296) | 0; }
      var n = 2, found = 0;
      while (found < 64) {
        var prime = true;
        for (var f = 2; f * f <= n; f++) if (n % f === 0) { prime = false; break; }
        if (prime) {
          if (found < 8) H0[found] = frac(Math.pow(n, 1 / 2));
          K[found] = frac(Math.pow(n, 1 / 3));
          found++;
        }
        n++;
      }
    })();
    function utf8(s) {
      var out = [];
      for (var i = 0; i < s.length; i++) {
        var c = s.charCodeAt(i);
        if (c < 128) out.push(c);
        else if (c < 2048) out.push(192 | (c >> 6), 128 | (c & 63));
        else if (c >= 0xd800 && c < 0xdc00 && i + 1 < s.length) {
          var c2 = s.charCodeAt(++i);
          var cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
          out.push(240 | (cp >> 18), 128 | ((cp >> 12) & 63), 128 | ((cp >> 6) & 63), 128 | (cp & 63));
        } else out.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
      }
      return out;
    }
    return function (str) {
      var bytes = utf8(str), l = bytes.length, H = H0.slice(), W = new Array(64);
      bytes.push(128);
      while (bytes.length % 64 !== 56) bytes.push(0);
      var bits = l * 8;
      bytes.push(0, 0, 0, 0, (bits >>> 24) & 255, (bits >>> 16) & 255, (bits >>> 8) & 255, bits & 255);
      for (var o = 0; o < bytes.length; o += 64) {
        for (var i = 0; i < 16; i++)
          W[i] = (bytes[o + i * 4] << 24) | (bytes[o + i * 4 + 1] << 16) | (bytes[o + i * 4 + 2] << 8) | bytes[o + i * 4 + 3];
        for (i = 16; i < 64; i++) {
          var a = W[i - 15], b = W[i - 2];
          var s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
          var s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
          W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
        }
        var A = H[0], B = H[1], C = H[2], D = H[3], E = H[4], F = H[5], G = H[6], Hh = H[7];
        for (i = 0; i < 64; i++) {
          var S1 = ((E >>> 6) | (E << 26)) ^ ((E >>> 11) | (E << 21)) ^ ((E >>> 25) | (E << 7));
          var ch = (E & F) ^ (~E & G);
          var t1 = (Hh + S1 + ch + K[i] + W[i]) | 0;
          var S0 = ((A >>> 2) | (A << 30)) ^ ((A >>> 13) | (A << 19)) ^ ((A >>> 22) | (A << 10));
          var mj = (A & B) ^ (A & C) ^ (B & C);
          var t2 = (S0 + mj) | 0;
          Hh = G; G = F; F = E; E = (D + t1) | 0; D = C; C = B; B = A; A = (t1 + t2) | 0;
        }
        H[0] = (H[0] + A) | 0; H[1] = (H[1] + B) | 0; H[2] = (H[2] + C) | 0; H[3] = (H[3] + D) | 0;
        H[4] = (H[4] + E) | 0; H[5] = (H[5] + F) | 0; H[6] = (H[6] + G) | 0; H[7] = (H[7] + Hh) | 0;
      }
      return H.map(function (x) { return ("00000000" + (x >>> 0).toString(16)).slice(-8); }).join("");
    };
  })();

  /* A refusal the screen can show as it is: what, and the rule that says so. */
  function Refusal(code, message, rule) {
    this.code = code; this.message = message; this.rule = rule || "";
  }

  /* ============================================================== Engine */

  function Engine(opts) {
    opts = opts || {};
    this.asOf = opts.asOf || "2026-09-28";
    this.fy = opts.fy || this.asOf.slice(0, 4);
    // Live books: "today" is whatever day the latest command was made on, so
    // replaying a log gives the same books whenever it is replayed, and the
    // people are whoever really acted — nobody is made up.
    this.live = !!opts.live;
    this.reporting = "USD";
    this.entities = [];
    this.entity = {};
    this.accounts = {};
    this.accountList = [];
    COA.forEach(function (a) {
      var extra = a[4] || {};
      var acct = {
        id: a[0], name: a[1], type: a[2], group: a[3],
        normal: (a[2] === "asset" || a[2] === "expense") ? (extra.contra ? "C" : "D") : "C",
        bank: !!extra.bank, ic: !!extra.ic, contra: !!extra.contra, control: extra.control || null,
        bs: a[2] === "asset" || a[2] === "liability" || a[2] === "equity"
      };
      this.accounts[acct.id] = acct;
      this.accountList.push(acct);
    }, this);
    this.headers = HEADERS.map(function (h) { return { id: h[0], name: h[1], accounts: h[2] }; });
    this.dims = {};
    Object.keys(DIMS).forEach(function (k) {
      this.dims[k] = DIMS[k].map(function (d) { return { id: d[0], name: d[1] }; });
    }, this);
    this.people = this.live ? { system: PEOPLE.system } : PEOPLE;
    this.roles = ROLES;
    this.limits = LIMITS;
    this.perms = PERMS;

    this.rates = {};          // cur → period → {avg, close}; plus .hist and .open
    this.periods = {};        // "US:2026-09" → {status, closedAt, closedBy}
    this.journals = {};       // id → journal
    this.journalOrder = [];
    this.lines = [];          // posted lines, flattened
    this.agg = {};            // "e|acct|period" → net (debit +)
    this.aggDim = {};         // "e|acct|period|dim:val" → net
    this.seq = {};            // id counters

    this.vendors = {}; this.customers = {};
    this.apInvoices = {}; this.arInvoices = {}; this.pos = {};
    this.bankAccounts = {}; this.bankLines = {}; this.recon = {};   // lineKey → bankLineId
    this.assets = {}; this.budgets = {}; this.contracts = {};
    this.cards = [];
    this.cardCharges = {};    // id → a charge on the company card (see seed.js)
    this.cardOrder = [];
    this.closeTasks = {}; this.closeHistory = [];
    this.anomalies = {};
    this.exceptions = {};     // budget exceptions etc.
    this.audit = [];
    this.log = [];            // commands run on these books, in order
    this.listeners = [];
    // Everyone signed in works in the same system with the same access
    // ("member"). Roles below belong to the colleagues whose work is in the
    // books, and to the reviewers a sandbox can simulate.
    this.me = { id: "me", name: "You", role: "member" };
  }

  var P = Engine.prototype;

  /* ----------------------------------------------------------- Utilities */
  P.pad = pad; P.periodOf = periodOf; P.periodLabel = periodLabel; P.addMonths = addMonths;
  P.periodsBetween = periodsBetween; P.lastDay = lastDay; P.addDays = addDays;
  P.daysBetween = daysBetween; P.weekday = weekday; P.quarterStart = quarterStart;
  P.sha256 = sha256; P.CUR = CUR; P.MONTHS = MONTHS; P.nyDate = nyDate;

  P.nextId = function (kind, width) {
    this.seq[kind] = (this.seq[kind] || 0) + 1;
    return kind + "-" + pad(this.seq[kind], width || 6);
  };
  P.on = function (fn) { this.listeners.push(fn); };
  P.emit = function (ev) { this.listeners.forEach(function (fn) { try { fn(ev); } catch (e) { console.error(e); } }); };

  P.currentPeriod = function () { return periodOf(this.asOf); };
  P.lastClosedPeriod = function (entity) {
    var p = this.currentPeriod();
    for (var i = 0; i < 24; i++) {
      p = addMonths(p, -1);
      var st = this.periodStatus(entity || "US", p);
      if (st === "closed" || st === "locked") return p;
    }
    return addMonths(this.currentPeriod(), -1);
  };
  P.fyPeriods = function () { return periodsBetween(this.fy + "-01", this.fy + "-12"); };

  /* -------------------------------------------------------------- Money */
  P.dp = function (cur) { return CUR[cur].dp; };
  /* Minor units of `cur` → minor units of USD at `rate` (USD per unit). */
  P.toUSD = function (minor, cur, rate) {
    if (cur === "USD") return minor;
    return Math.round(minor / Math.pow(10, CUR[cur].dp) * rate * 100);
  };
  P.fromUSD = function (usdMinor, cur, rate) {
    if (cur === "USD") return usdMinor;
    return Math.round(usdMinor / 100 / rate * Math.pow(10, CUR[cur].dp));
  };
  P.rate = function (cur, period, kind) {
    if (cur === "USD") return 1;
    var r = this.rates[cur];
    if (!r) throw new Error("No rates for " + cur);
    if (kind === "hist") return r.hist;
    if (kind === "open") return r.open;
    var pr = r[period];
    if (!pr) {
      // Beyond the last published rate, use the latest one we have.
      var keys = Object.keys(r).filter(function (k) { return /^\d{4}-\d{2}$/.test(k); }).sort();
      pr = r[keys[keys.length - 1]];
    }
    return kind === "close" ? pr.close : pr.avg;
  };
  P.usdOf = function (entity, minor, period, kind) {
    var cur = this.entity[entity].currency;
    return this.toUSD(minor, cur, this.rate(cur, period, kind || "avg"));
  };

  /* ------------------------------------------------------------ Entities */
  P.addEntity = function (e) {
    this.entities.push(e);
    this.entity[e.id] = e;
  };

  /* ------------------------------------------------------------- Periods */
  P.periodStatus = function (entity, p) {
    var rec = this.periods[entity + ":" + p];
    return rec ? rec.status : (p > this.fy + "-12" || p < this.fy + "-01" ? "none" : "open");
  };
  P.setPeriod = function (entity, p, status, by, at) {
    this.periods[entity + ":" + p] = { status: status, by: by || null, at: at || null };
  };

  /* ============================================================ Postings */

  /* Checks a journal against every rule except who is asking. Returns a
     Refusal, or null when it may post. */
  P.validateJournal = function (j, opts) {
    opts = opts || {};
    if (!this.entity[j.entity]) return new Refusal("entity", "Choose a legal entity.");
    if (!isDate(j.date)) return new Refusal("date", "Give the journal a date.");
    if (!j.lines || j.lines.length < 2) return new Refusal("lines", "A journal needs at least two lines.");
    var dr = 0, cr = 0;
    for (var i = 0; i < j.lines.length; i++) {
      var l = j.lines[i];
      var a = this.accounts[l.account];
      if (!a) return new Refusal("account", "Line " + (i + 1) + ": account " + (l.account || "(none)") + " does not exist.");
      if ((l.dr != null && !Number.isSafeInteger(l.dr)) || (l.cr != null && !Number.isSafeInteger(l.cr))) return new Refusal("amount", "Line " + (i + 1) + ": amounts must be whole numbers of the smallest unit.");
      if ((l.dr || 0) < 0 || (l.cr || 0) < 0) return new Refusal("amount", "Line " + (i + 1) + ": amounts are never negative — use the other column.");
      if ((l.dr || 0) && (l.cr || 0)) return new Refusal("amount", "Line " + (i + 1) + " has both a debit and a credit.");
      if (!(l.dr || 0) && !(l.cr || 0)) return new Refusal("amount", "Line " + (i + 1) + " has no amount.");
      if (l.dr % 1 || l.cr % 1) return new Refusal("amount", "Amounts must be whole minor units.");
      if (a.type === "expense" && !a.ic && a.group !== "other" && a.group !== "tax" && !(l.dims && l.dims.dept) && !opts.system)
        return new Refusal("dims", "Line " + (i + 1) + ": expenses need a department.", "Every expense is charged to a department so budgets can be controlled.");
      dr += l.dr || 0; cr += l.cr || 0;
    }
    if (dr !== cr) {
      return new Refusal("balance", "Debits and credits differ by " +
        this.fmt(Math.abs(dr - cr), this.entity[j.entity].currency) + ".",
        "Double entry: every journal's debits must equal its credits.");
    }
    if (dr <= 0) return new Refusal("balance", "The journal has no value.");
    var p = periodOf(j.date), st = this.periodStatus(j.entity, p);
    if (st === "none") return new Refusal("period", periodLabel(p, true) + " is outside fiscal " + this.fy + ".");
    if (st === "locked") return new Refusal("period", periodLabel(p, true) + " is locked for " + this.entity[j.entity].short + ".",
      "Locked periods cannot change. Post the correction in the current open period.");
    if (st === "closed" && !opts.system) return new Refusal("period", periodLabel(p, true) + " is closed for " + this.entity[j.entity].short + ".",
      "Closed periods take no new postings. Post the correction in the current open period, or ask the CFO to reopen.");
    return null;
  };

  /* The only function that writes to the ledger. Everything else — invoices,
     payments, depreciation, the close — builds a journal and calls this. */
  P.post = function (j, opts) {
    opts = opts || {};
    var bad = this.validateJournal(j, opts);
    if (bad) throw bad;
    if (!j.id) j.id = this.nextId("JE-" + j.entity, 6);
    j.period = periodOf(j.date);
    j.status = "posted";
    j.postedAt = j.postedAt || j.createdAt || (j.date + "T18:00:00Z");
    j.total = j.lines.reduce(function (s, l) { return s + (l.dr || 0); }, 0);
    if (!this.journals[j.id]) this.journalOrder.push(j.id);
    this.journals[j.id] = j;
    for (var i = 0; i < j.lines.length; i++) {
      var l = j.lines[i];
      var amt = (l.dr || 0) - (l.cr || 0);
      var line = { key: j.id + "#" + i, j: j.id, i: i, entity: j.entity, date: j.date, period: j.period,
                   account: l.account, amt: amt, dims: l.dims || {}, memo: l.memo || j.memo, source: j.source,
                   fx: l.fx || null };
      this.lines.push(line);
      var k = j.entity + "|" + l.account + "|" + j.period;
      this.agg[k] = (this.agg[k] || 0) + amt;
      var d = line.dims;
      for (var dk in d) if (d[dk]) {
        var kk = k + "|" + dk + ":" + d[dk];
        this.aggDim[kk] = (this.aggDim[kk] || 0) + amt;
      }
    }
    this.dirty = true;
    return j;
  };

  /* A draft or a journal waiting for approval: kept, but not in the ledger. */
  P.stage = function (j) {
    if (!j.id) j.id = this.nextId("JE-" + j.entity, 6);
    j.period = periodOf(j.date);
    j.total = j.lines.reduce(function (s, l) { return s + (l.dr || 0); }, 0);
    if (!this.journals[j.id]) this.journalOrder.push(j.id);
    this.journals[j.id] = j;
    return j;
  };

  /* ============================================================= Queries */

  /* Net activity (debit positive) on an account for an entity over periods. */
  P.net = function (entity, account, from, to, dim) {
    var sum = 0, ps = periodsBetween(from, to);
    for (var i = 0; i < ps.length; i++) {
      var k = entity + "|" + account + "|" + ps[i];
      if (dim) k += "|" + dim;
      var v = dim ? this.aggDim[k] : this.agg[k];
      if (v) sum += v;
    }
    return sum;
  };
  /* Balance at the end of a period: everything posted from the start of the
     fiscal year (the opening journal carries the prior years). */
  P.balance = function (entity, account, asOfPeriod, dim) {
    return this.net(entity, account, this.fy + "-01", asOfPeriod, dim);
  };
  /* The same, in the account's natural sign — what a person expects to read:
     an asset with money in it is positive, and so is a liability that is owed. */
  P.natural = function (account, amt) {
    return this.accounts[account].normal === "D" ? amt : -amt;
  };

  P.linesWhere = function (f) {
    f = f || {};
    var accts = f.accounts ? {} : null;
    if (f.accounts) f.accounts.forEach(function (a) { accts[a] = 1; });
    var out = [];
    for (var i = 0; i < this.lines.length; i++) {
      var l = this.lines[i];
      if (f.entity && f.entity !== "GROUP" && l.entity !== f.entity) continue;
      if (accts && !accts[l.account]) continue;
      if (f.from && l.period < f.from) continue;
      if (f.to && l.period > f.to) continue;
      if (f.dateFrom && l.date < f.dateFrom) continue;
      if (f.dateTo && l.date > f.dateTo) continue;
      if (f.dept && l.dims.dept !== f.dept) continue;
      if (f.product && l.dims.product !== f.product) continue;
      if (f.project && l.dims.project !== f.project) continue;
      if (f.vendor && l.dims.vendor !== f.vendor) continue;
      if (f.customer && l.dims.customer !== f.customer) continue;
      if (f.source && (!l.source || l.source.type !== f.source)) continue;
      out.push(l);
    }
    return out;
  };

  P.trialBalance = function (entity, asOf) {
    var rows = [], dr = 0, cr = 0, self = this;
    this.accountList.forEach(function (a) {
      var b = a.bs ? self.balance(entity, a.id, asOf) : self.net(entity, a.id, self.fy + "-01", asOf);
      if (!b) return;
      rows.push({ account: a.id, name: a.name, type: a.type, dr: b > 0 ? b : 0, cr: b < 0 ? -b : 0 });
      if (b > 0) dr += b; else cr -= b;
    });
    return { rows: rows, dr: dr, cr: cr, balanced: dr === cr, currency: this.entity[entity].currency };
  };

  /* ------------------------------------------------------- Consolidation

     measure(scope, from, to) returns every account's amount (debit positive)
     in the scope's currency: an entity's own currency, or USD for the group.
     For the group it translates by the current-rate method — income and
     expense at each month's average rate, assets and liabilities at the
     closing rate, equity at historical — puts the difference in the
     translation reserve (CTA), and eliminates intercompany balances. It
     returns the pieces as well, so the consolidation screen can show its
     working. */
  P.measure = function (scope, from, to, opts) {
    opts = opts || {};
    var self = this;
    if (scope !== "GROUP") {
      var out = {}, ytd = 0;
      this.accountList.forEach(function (a) {
        var v = a.bs ? self.balance(scope, a.id, to) : self.net(scope, a.id, from, to);
        if (v) out[a.id] = v;
        if (!a.bs) ytd += self.net(scope, a.id, self.fy + "-01", to);
      });
      out._ytdPL = ytd;
      out.CTA = 0;
      if (opts.usd) {
        var cur = this.entity[scope].currency, conv = {}, sum = 0;
        this.accountList.forEach(function (a) {
          var v;
          if (a.bs) {
            var kind = (a.id === "3000" || a.id === "3100") ? "hist" : "close";
            v = self.toUSD(self.balance(scope, a.id, to), cur, self.rate(cur, to, kind));
            sum += v;
          } else {
            v = self.translatedPL(scope, a.id, from, to);
            sum += self.translatedPL(scope, a.id, self.fy + "-01", to);
          }
          if (v) conv[a.id] = v;
        });
        var ytdUSD = 0;
        this.accountList.forEach(function (a) { if (!a.bs) ytdUSD += self.translatedPL(scope, a.id, self.fy + "-01", to); });
        conv._ytdPL = ytdUSD;
        conv.CTA = -sum;
        return conv;
      }
      return out;
    }
    return this.consolidate(from, to).group;
  };

  P.translatedPL = function (entity, account, from, to) {
    var cur = this.entity[entity].currency, sum = 0, self = this;
    periodsBetween(from, to).forEach(function (p) {
      var v = self.net(entity, account, p, p);
      if (v) sum += self.toUSD(v, cur, self.rate(cur, p, "avg"));
    });
    return sum;
  };

  P.consolidate = function (from, to) {
    var cacheKey = from + ":" + to + ":" + this.lines.length;
    if (this._cons && this._cons.key === cacheKey) return this._cons.val;
    var self = this, by = {}, group = {}, elim = {};
    this.entities.forEach(function (e) {
      var cur = e.currency, m = {}, sum = 0;
      self.accountList.forEach(function (a) {
        var v;
        if (a.bs) {
          var bal = self.balance(e.id, a.id, to);
          if (!bal) return;
          var kind = (a.id === "3000" || a.id === "3100") ? "hist" : "close";
          v = self.toUSD(bal, cur, self.rate(cur, to, kind));
        } else {
          v = self.translatedPL(e.id, a.id, self.fy + "-01", to);
          // P&L accounts: the balance-sheet side needs the full year to date,
          // the income statement only [from, to]; both are kept.
        }
        if (v) { m[a.id] = v; sum += v; }
      });
      // Whatever does not balance after translation is the translation
      // difference; it sits in equity as CTA (debit positive, like the rest).
      m.CTA = -sum;
      // The income statement for [from, to] only.
      var pl = {};
      self.accountList.forEach(function (a) {
        if (a.bs) return;
        var v = self.translatedPL(e.id, a.id, from, to);
        if (v) pl[a.id] = v;
      });
      by[e.id] = { bs: m, pl: pl };
    });

    // Intercompany eliminations: every IC account nets to nothing at group level.
    var icAccts = this.accountList.filter(function (a) { return a.ic; }).map(function (a) { return a.id; });
    var elimBS = {}, elimPL = {}, residual = 0;
    icAccts.forEach(function (id) {
      var totBS = 0, totPL = 0;
      self.entities.forEach(function (e) {
        totBS += by[e.id].bs[id] || 0;
        totPL += by[e.id].pl[id] || 0;
      });
      if (totBS) { elimBS[id] = -totBS; residual += -totBS; }
      if (totPL) elimPL[id] = -totPL;
    });
    // Differences left by eliminating at different rates are translation
    // differences too.
    if (residual) elimBS.CTA = -residual;

    var gBS = {}, gPL = {};
    this.entities.forEach(function (e) {
      Object.keys(by[e.id].bs).forEach(function (k) { gBS[k] = (gBS[k] || 0) + by[e.id].bs[k]; });
      Object.keys(by[e.id].pl).forEach(function (k) { gPL[k] = (gPL[k] || 0) + by[e.id].pl[k]; });
    });
    Object.keys(elimBS).forEach(function (k) { gBS[k] = (gBS[k] || 0) + elimBS[k]; });
    Object.keys(elimPL).forEach(function (k) { gPL[k] = (gPL[k] || 0) + elimPL[k]; });

    // `group` in the shape measure() promises: balance-sheet accounts at `to`,
    // income and expense for [from, to].
    var groupOut = {};
    this.accountList.forEach(function (a) {
      var v = a.bs ? gBS[a.id] : gPL[a.id];
      if (v) groupOut[a.id] = v;
    });
    // Year-to-date P&L at group level, which the balance sheet's equity needs.
    var ytdPL = 0;
    this.accountList.forEach(function (a) { if (!a.bs && gBS[a.id]) ytdPL += gBS[a.id]; });
    groupOut.CTA = gBS.CTA || 0;
    groupOut._ytdPL = ytdPL;

    var val = { by: by, elimBS: elimBS, elimPL: elimPL, group: groupOut };
    this._cons = { key: cacheKey, val: val };
    return val;
  };

  /* Intercompany positions, pair by pair, in USD: what each side says is owed. */
  P.intercompany = function (asOf) {
    var self = this, out = [];
    this.entities.forEach(function (e) {
      if (e.id === "US") return;
      var cur = e.currency;
      var usRecv = self.balance("US", "1150", asOf, "counterparty:" + e.id);
      var theirPay = self.balance(e.id, "2150", asOf, "counterparty:US");
      var usRev = self.net("US", "4900", self.fy + "-01", asOf, "counterparty:" + e.id);
      var theirExp = self.net(e.id, "6900", self.fy + "-01", asOf, "counterparty:US");
      // Compared in the currency the recharge is billed in: what each side
      // says is owed, in dollars.
      var payUSD = -self.icUSDOwn(e.id, asOf);
      var expUSD = self.translatedPL(e.id, "6900", self.fy + "-01", asOf);
      // translatedPL is all counterparties; there is only one here.
      out.push({
        pair: "US ↔ " + e.id, entity: e.id,
        receivable: usRecv, payable: payUSD, payableLocal: -theirPay, currency: cur,
        revenue: -usRev, expense: expUSD, expenseLocal: theirExp,
        difference: usRecv - payUSD
      });
    });
    return out;
  };

  /* ------------------------------------------------------ Statement layout */

  var IS_LAYOUT = [
    { id: "rev", label: "Revenue", kind: "head" },
    { id: "4000", acct: ["4000"] }, { id: "4100", acct: ["4100"] }, { id: "4200", acct: ["4200"] },
    { id: "4900", acct: ["4900"], ic: true },
    { id: "revT", label: "Total revenue", kind: "total", sum: ["4000", "4100", "4200", "4900"], sign: -1 },
    { id: "cor", label: "Cost of revenue", kind: "head" },
    { id: "5000", acct: ["5000"] }, { id: "5100", acct: ["5100"] }, { id: "5200", acct: ["5200"] },
    { id: "corT", label: "Total cost of revenue", kind: "total", sum: ["5000", "5100", "5200"], sign: 1 },
    { id: "gp", label: "Gross profit", kind: "grand", sum: ["4000", "4100", "4200", "4900", "5000", "5100", "5200"], sign: -1 },
    { id: "gm", label: "Gross margin", kind: "ratio", num: "gp", den: "revT" },
    { id: "opx", label: "Operating expenses", kind: "head" },
    { id: "6000", acct: ["6000"] }, { id: "6050", acct: ["6050"] }, { id: "6800", acct: ["6800"] },
    { id: "6100", acct: ["6100"] }, { id: "6200", acct: ["6200"] }, { id: "6250", acct: ["6250"] },
    { id: "6300", acct: ["6300"] }, { id: "6400", acct: ["6400"] }, { id: "6500", acct: ["6500"] },
    { id: "6600", acct: ["6600"] }, { id: "6650", acct: ["6650"] }, { id: "6700", acct: ["6700"] },
    { id: "6900", acct: ["6900"], ic: true },
    { id: "opxT", label: "Total operating expenses", kind: "total",
      sum: ["6000", "6050", "6800", "6100", "6200", "6250", "6300", "6400", "6500", "6600", "6650", "6700", "6900"], sign: 1 },
    { id: "oi", label: "Operating income", kind: "grand",
      sum: ["4000", "4100", "4200", "4900", "5000", "5100", "5200", "6000", "6050", "6800", "6100", "6200", "6250", "6300", "6400", "6500", "6600", "6650", "6700", "6900"], sign: -1 },
    { id: "om", label: "Operating margin", kind: "ratio", num: "oi", den: "revT" },
    { id: "oth", label: "Other income (expense)", kind: "head" },
    { id: "7000", acct: ["7000"], sign: -1 }, { id: "7100", acct: ["7100"], sign: -1 }, { id: "7200", acct: ["7200"], sign: -1 },
    { id: "pti", label: "Income before taxes", kind: "total", all: "pl", exclude: ["8000"], sign: -1 },
    { id: "8000", acct: ["8000"] },
    { id: "ni", label: "Net income", kind: "grand", all: "pl", sign: -1 }
  ];

  var BS_LAYOUT = [
    { id: "a", label: "Assets", kind: "head" },
    { id: "cash", label: "Cash & cash equivalents", acct: ["1010", "1020", "1030"] },
    { id: "ar", label: "Accounts receivable", acct: ["1100"] },
    { id: "1150", acct: ["1150"], ic: true },
    { id: "1200", acct: ["1200"] },
    { id: "ca", label: "Total current assets", kind: "total", sum: ["1010", "1020", "1030", "1100", "1150", "1200"], sign: 1 },
    { id: "ppe", label: "Property & equipment, net", acct: ["1510", "1520", "1530", "1590"] },
    { id: "ta", label: "Total assets", kind: "grand", sum: ["1010", "1020", "1030", "1100", "1150", "1200", "1510", "1520", "1530", "1590"], sign: 1 },
    { id: "l", label: "Liabilities", kind: "head" },
    { id: "2000", acct: ["2000"] }, { id: "2100", acct: ["2100"] }, { id: "2150", acct: ["2150"], ic: true },
    { id: "2200", acct: ["2200"] }, { id: "2300", acct: ["2300"] }, { id: "2400", acct: ["2400"] },
    { id: "2500", acct: ["2500"] }, { id: "2600", acct: ["2600"] },
    { id: "cl", label: "Total current liabilities", kind: "total", sum: ["2000", "2100", "2150", "2200", "2300", "2400", "2500", "2600"], sign: -1 },
    { id: "2700", acct: ["2700"] },
    { id: "tl", label: "Total liabilities", kind: "total", sum: ["2000", "2100", "2150", "2200", "2300", "2400", "2500", "2600", "2700"], sign: -1 },
    { id: "eq", label: "Equity", kind: "head" },
    { id: "3000", acct: ["3000"] }, { id: "3100", acct: ["3100"] },
    { id: "cye", label: "Current-year earnings", acct: ["_ytdPL"], sign: -1 },
    { id: "cta", label: "Foreign currency translation (CTA)", acct: ["CTA"], sign: -1, groupOnly: true },
    { id: "te", label: "Total equity", kind: "total", sum: ["3000", "3100", "_ytdPL", "CTA"], sign: -1 },
    { id: "tle", label: "Total liabilities & equity", kind: "grand",
      sum: ["2000", "2100", "2150", "2200", "2300", "2400", "2500", "2600", "2700", "3000", "3100", "_ytdPL", "CTA"], sign: -1 }
  ];

  /* Lays a statement out from an account → amount map. Values come back in
     the sign a reader expects: revenue and profit positive, expenses positive
     inside their section. */
  P.layout = function (kind, m, opts) {
    opts = opts || {};
    var self = this, spec = kind === "is" ? IS_LAYOUT : BS_LAYOUT, out = [], byId = {};
    var plAccts = this.accountList.filter(function (a) { return !a.bs; }).map(function (a) { return a.id; });
    spec.forEach(function (r) {
      if (r.groupOnly && !opts.group) return;
      if (r.ic && opts.hideIC) return;
      var row = { id: r.id, kind: r.kind || "line", accounts: r.acct || r.sum || null };
      if (r.kind === "head") { row.label = r.label; out.push(row); byId[r.id] = row; return; }
      if (r.kind === "ratio") {
        var n = byId[r.num] && byId[r.num].value, d = byId[r.den] && byId[r.den].value;
        row.label = r.label; row.value = d ? n / d : null; row.format = "pct";
        out.push(row); byId[r.id] = row; return;
      }
      var accts = r.acct || r.sum;
      if (r.all === "pl") {
        accts = plAccts.filter(function (a) { return !(r.exclude || []).includes(a); });
        row.accounts = accts;
      }
      var v = 0;
      accts.forEach(function (a) { v += m[a] || 0; });
      var sign = r.sign != null ? r.sign : (kind === "bs"
        ? (self.accounts[accts[0]] && self.accounts[accts[0]].type === "asset" ? 1 : -1)
        : (self.accounts[accts[0]] && self.accounts[accts[0]].type === "revenue" ? -1 : 1));
      row.value = v * sign;
      row.sign = sign;
      row.label = r.label || (self.accounts[accts[0]] ? self.accounts[accts[0]].name : accts[0]);
      if (!r.kind) row.account = accts.length === 1 ? accts[0] : null;
      out.push(row); byId[r.id] = row;
    });
    return out;
  };

  /* Cash flow, indirect method, from two balance sheets and the P&L between. */
  P.cashFlow = function (scope, from, to) {
    var self = this;
    var endM, startM, pl;
    var prior = addMonths(from, -1);
    if (scope === "GROUP") {
      var c = this.consolidate(from, to);
      endM = c.group;
      pl = c.group;
      startM = from <= this.fy + "-01" ? this.openingGroup() : this.consolidate(this.fy + "-01", prior).group;
    } else {
      endM = this.measure(scope, from, to);
      pl = endM;
      startM = {};
      if (from > this.fy + "-01") startM = this.measure(scope, this.fy + "-01", prior);
      else {
        // The opening balance sheet: the opening journal alone.
        this.accountList.forEach(function (a) {
          if (!a.bs) return;
          var v = self.openingBalance(scope, a.id);
          if (v) startM[a.id] = v;
        });
      }
    }
    function d(ids) {
      var s = 0;
      ids.forEach(function (id) { s += (endM[id] || 0) - (startM[id] || 0); });
      return s;
    }
    var ni = 0;
    this.accountList.forEach(function (a) { if (!a.bs) ni -= pl[a.id] || 0; });
    var rows = [];
    function row(id, label, v, kind) { rows.push({ id: id, label: label, value: v, kind: kind || "line" }); return v; }
    rows.push({ id: "op", label: "Operating activities", kind: "head" });
    row("ni", "Net income", ni);
    var dep = row("dep", "Depreciation", pl["6700"] || 0);
    var wc = 0;
    wc += row("dar", "Accounts receivable", -d(["1100"]));
    wc += row("dpre", "Prepaid expenses", -d(["1200"]));
    if (scope !== "GROUP") wc += row("dic", "Intercompany balances", -d(["1150", "2150"]));
    wc += row("dap", "Accounts payable", -d(["2000"]));
    wc += row("dacc", "Accrued liabilities", -d(["2100"]));
    wc += row("ddef", "Deferred revenue", -d(["2200"]));
    wc += row("dtax", "Taxes, payroll & cards", -d(["2300", "2400", "2500", "2600"]));
    var cfo = row("cfo", "Net cash from operating activities", ni + dep + wc, "total");
    rows.push({ id: "inv", label: "Investing activities", kind: "head" });
    var capex = row("capex", "Purchases of property & equipment", -d(["1510", "1520", "1530"]));
    // Accumulated depreciation moves with depreciation (added back above).
    var accdepOther = -d(["1590"]) - dep;
    var cfi = row("cfi", "Net cash used in investing activities", capex + accdepOther, "total");
    rows.push({ id: "fin", label: "Financing activities", kind: "head" });
    var debt = row("debt", "Term loan drawn (repaid)", -d(["2700"]));
    var eq = row("equity", "Equity issued", -d(["3000", "3100"]));
    var cff = row("cff", "Net cash from financing activities", debt + eq, "total");
    var dCash = d(["1010", "1020", "1030"]);
    var fx = dCash - (cfo + cfi + cff);
    if (scope === "GROUP") row("fx", "Effect of exchange rates on cash", fx);
    row("net", "Net change in cash", dCash, "grand");
    row("open", "Cash, beginning of period", (startM["1010"] || 0) + (startM["1020"] || 0) + (startM["1030"] || 0));
    row("close", "Cash, end of period", (endM["1010"] || 0) + (endM["1020"] || 0) + (endM["1030"] || 0), "total");
    return { rows: rows, reconciles: scope === "GROUP" ? true : fx === 0, unexplained: scope === "GROUP" ? 0 : fx };
  };

  P.openingBalance = function (entity, account) {
    var s = 0;
    for (var i = 0; i < this.lines.length; i++) {
      var l = this.lines[i];
      if (l.entity === entity && l.account === account && l.source && l.source.type === "open") s += l.amt;
    }
    return s;
  };
  P.openingGroup = function () {
    var self = this, g = {}, sum = 0;
    this.entities.forEach(function (e) {
      var cur = e.currency;
      self.accountList.forEach(function (a) {
        if (!a.bs) return;
        var v = self.openingBalance(e.id, a.id);
        if (!v) return;
        var r = (a.id === "3000" || a.id === "3100") ? self.rate(cur, null, "hist") : self.rate(cur, null, "open");
        var u = self.toUSD(v, cur, r);
        g[a.id] = (g[a.id] || 0) + u; sum += u;
      });
    });
    ["1150", "2150"].forEach(function (id) { if (g[id]) { sum -= g[id]; delete g[id]; } });
    g.CTA = -sum;
    return g;
  };

  /* ---------------------------------------------------------- Subledgers */

  P.apOpen = function (entity) {
    var self = this;
    return Object.values(this.apInvoices).filter(function (v) {
      return (!entity || entity === "GROUP" || v.entity === entity) &&
        ["approved", "scheduled"].includes(v.status);
    });
  };
  P.arOpen = function (entity) {
    return Object.values(this.arInvoices).filter(function (v) {
      return (!entity || entity === "GROUP" || v.entity === entity) && v.status !== "paid" && v.status !== "void" && v.balance > 0;
    });
  };

  P.aging = function (kind, entity, asOf) {
    asOf = asOf || this.asOf;
    var self = this;
    var buckets = [
      { id: "current", label: "Current", min: -99999, max: 0 },
      { id: "1-30", label: "1–30 days", min: 1, max: 30 },
      { id: "31-60", label: "31–60 days", min: 31, max: 60 },
      { id: "61-90", label: "61–90 days", min: 61, max: 90 },
      { id: "90+", label: "90+ days", min: 91, max: 99999 }
    ];
    buckets.forEach(function (b) { b.amount = 0; b.count = 0; b.items = []; });
    var docs = kind === "ar" ? this.arOpen(entity) : this.apOpen(entity);
    var total = 0;
    docs.forEach(function (d) {
      var late = daysBetween(d.due, asOf);
      var amt = kind === "ar" ? d.balance : d.amount;
      var usd = entity === "GROUP" ? self.usdOf(d.entity, amt, periodOf(asOf), "close") : amt;
      for (var i = 0; i < buckets.length; i++) {
        if (late >= buckets[i].min && late <= buckets[i].max) {
          buckets[i].amount += usd; buckets[i].count++; buckets[i].items.push(d); break;
        }
      }
      total += usd;
    });
    return { buckets: buckets, total: total, currency: entity === "GROUP" ? "USD" : this.entity[entity].currency };
  };

  /* Days sales outstanding, the count-back way over the last three months. */
  P.dso = function (entity) {
    var self = this, ents = entity === "GROUP" ? this.entities.map(function (e) { return e.id; }) : [entity];
    var p = this.lastClosedPeriod(), ar = 0, rev = 0;
    ents.forEach(function (e) {
      ar += self.usdOf(e, self.balance(e, "1100", p), p, "close");
      ["4000", "4100", "4200"].forEach(function (a) {
        rev += -self.translatedPL(e, a, addMonths(p, -2), p);
      });
    });
    return rev ? Math.round(ar / (rev / 91)) : 0;
  };

  /* --------------------------------------------------------------- Cash */

  P.bankBalance = function (bankId, asOfDate) {
    var b = this.bankAccounts[bankId], s = b.opening || 0;
    asOfDate = asOfDate || this.asOf;
    Object.values(this.bankLines).forEach(function (l) {
      if (l.bank === bankId && l.date <= asOfDate) s += l.amount;
    });
    return s;
  };
  P.bookBalance = function (bankId, asOfDate) {
    var b = this.bankAccounts[bankId], s = 0;
    asOfDate = asOfDate || this.asOf;
    for (var i = 0; i < this.lines.length; i++) {
      var l = this.lines[i];
      if (l.entity === b.entity && l.account === b.account && l.date <= asOfDate) s += l.amt;
    }
    return s;
  };
  /* Everything needed to reconcile a bank account: both sides, what is
     matched, and what explains the difference. */
  P.reconciliation = function (bankId, asOfDate) {
    asOfDate = asOfDate || this.asOf;
    var self = this, b = this.bankAccounts[bankId];
    var bankLines = Object.values(this.bankLines).filter(function (l) { return l.bank === bankId && l.date <= asOfDate; })
      .sort(function (x, y) { return x.date < y.date ? 1 : x.date > y.date ? -1 : 0; });
    var matchedKeys = {};
    bankLines.forEach(function (l) { (l.matches || []).forEach(function (k) { matchedKeys[k] = l.id; }); });
    var book = this.lines.filter(function (l) {
      return l.entity === b.entity && l.account === b.account && l.date <= asOfDate && l.source && l.source.type !== "open";
    });
    var bookOpen = book.filter(function (l) { return !matchedKeys[l.key]; });
    var bankOpen = bankLines.filter(function (l) { return l.status === "unmatched"; });
    var bankBal = this.bankBalance(bankId, asOfDate), bookBal = this.bookBalance(bankId, asOfDate);
    var outstanding = bookOpen.reduce(function (s, l) { return s + l.amt; }, 0);
    var unrecorded = bankOpen.reduce(function (s, l) { return s + l.amount; }, 0);
    // bank + book items not yet at the bank − bank items not yet in the books = book
    var diff = bankBal + outstanding - unrecorded - bookBal;
    bankOpen.forEach(function (l) { l.suggestion = self.suggestMatch(l, bookOpen); });
    return {
      bank: b, bankBalance: bankBal, bookBalance: bookBal, bankOpen: bankOpen, bookOpen: bookOpen,
      outstanding: outstanding, unrecorded: unrecorded, difference: diff,
      matchedCount: bankLines.length - bankOpen.length, lines: bankLines
    };
  };
  /* Working days between two dates: a Friday posting that clears on Monday
     is one day late, not three. */
  function bizDays(a, b) {
    if (a > b) { var t = a; a = b; b = t; }
    var n = 0, d = a;
    while (d < b) { d = addDays(d, 1); var w = weekday(d); if (w !== 0 && w !== 6) n++; }
    return n;
  }
  P.bizDays = bizDays;
  P.suggestMatch = function (bl, bookOpen) {
    var best = null;
    for (var i = 0; i < bookOpen.length; i++) {
      var l = bookOpen[i];
      if (l.amt !== bl.amount) continue;
      var gap = bizDays(l.date, bl.date);
      if (gap > 6) continue;
      if (!best || gap < best.gap) best = { kind: "book", key: l.key, gap: gap, confidence: gap <= 2 ? "high" : "medium" };
    }
    if (best) return best;
    // Money in that no book line explains: is it a customer paying an invoice?
    if (bl.amount > 0) {
      var self = this, b = this.bankAccounts[bl.bank];
      var inv = this.arOpen(b.entity).filter(function (v) { return v.balance === bl.amount; })[0];
      if (inv) return { kind: "ar", invoice: inv.id, confidence: bl.desc.toUpperCase().indexOf(self.customers[inv.customer].name.split(" ")[0].toUpperCase()) >= 0 ? "high" : "medium" };
    }
    if (bl.kind === "fee") return { kind: "create", account: "6650", confidence: "high", memo: "Bank service charge" };
    if (bl.kind === "chargeback") return { kind: "create", account: "4000", confidence: "medium", memo: "Card chargeback", dims: { product: "PLS" } };
    return null;
  };

  /* Cash, every bank, in USD at today's rate. */
  P.cashPosition = function () {
    var self = this, p = this.currentPeriod();
    var rows = Object.values(this.bankAccounts).map(function (b) {
      var cur = self.entity[b.entity].currency;
      var bal = self.bankBalance(b.id), book = self.bookBalance(b.id);
      return { bank: b, currency: cur, balance: bal, book: book, usd: self.toUSD(bal, cur, self.rate(cur, p, "close")),
               unmatched: Object.values(self.bankLines).filter(function (l) { return l.bank === b.id && l.status === "unmatched"; }).length };
    });
    return { rows: rows, total: rows.reduce(function (s, r) { return s + r.usd; }, 0) };
  };

  /* Thirteen weeks of cash, built from what is actually known: receivables
     by due date adjusted for how late each customer usually pays, payables by
     due date or scheduled run, payroll and rent on their calendars, debt
     service, and self-serve settlements at their recent weekly run rate. */
  P.cashForecast = function (weeks) {
    weeks = weeks || 13;
    var self = this, p = this.currentPeriod();
    var start = this.asOf;
    // Weeks begin on the Monday on or before today.
    while (weekday(start) !== 1) start = addDays(start, -1);
    var W = [];
    for (var i = 0; i < weeks; i++) W.push({ start: addDays(start, i * 7), end: addDays(start, i * 7 + 6), inflow: 0, outflow: 0, items: {} });
    function put(date, usd, label) {
      for (var i = 0; i < W.length; i++) {
        if (date >= W[i].start && date <= W[i].end) {
          if (usd > 0) W[i].inflow += usd; else W[i].outflow -= usd;
          W[i].items[label] = (W[i].items[label] || 0) + usd;
          return;
        }
      }
    }
    function usd(e, amt) { return self.usdOf(e, amt, p, "close"); }
    this.arOpen("GROUP").forEach(function (inv) {
      var c = self.customers[inv.customer];
      var when = addDays(inv.due, Math.max(0, c.lateness || 0));
      if (when < self.asOf) when = addDays(self.asOf, 3 + (c.lateness > 30 ? 21 : 0));
      put(when, usd(inv.entity, inv.balance), "Customer receipts");
    });
    this.apOpen("GROUP").forEach(function (inv) {
      var when = inv.scheduledFor || inv.due;
      if (when < self.asOf) when = addDays(self.asOf, 1);
      put(when, -usd(inv.entity, inv.amount), "Vendor payments");
    });
    Object.values(this.apInvoices).forEach(function (inv) {
      if (inv.status === "review" || inv.status === "captured" || inv.status === "hold")
        put(inv.due < self.asOf ? addDays(self.asOf, 7) : inv.due, -usd(inv.entity, inv.amount), "Vendor payments");
    });
    // Recurring flows, projected from the calendar the seed runs on.
    (this.recurring || []).forEach(function (r) {
      for (var i = 0; i < W.length; i++) {
        var d = W[i].start;
        for (var k = 0; k < 7; k++) {
          var day = addDays(d, k);
          if (day <= self.asOf) continue;
          if (r.when(day, self)) put(day, usd(r.entity, r.amount(day, self)), r.label);
        }
      }
    });
    var cash = this.cashPosition().total;
    W.forEach(function (w) { w.open = cash; cash += w.inflow - w.outflow; w.close = cash; });
    return W;
  };

  /* Actual cash, week by week, looking back — for the forecast's left half. */
  P.cashHistory = function (weeks) {
    var self = this, p = this.currentPeriod(), out = [];
    var end = this.asOf;
    while (weekday(end) !== 0) end = addDays(end, 1);   // the coming Sunday
    for (var i = weeks - 1; i >= 0; i--) {
      var d = addDays(end, -7 * (i + 1));
      var tot = 0;
      Object.values(this.bankAccounts).forEach(function (b) {
        var cur = self.entity[b.entity].currency;
        tot += self.toUSD(self.bankBalance(b.id, d), cur, self.rate(cur, periodOf(d) <= p ? periodOf(d) : p, "close"));
      });
      out.push({ date: d, cash: tot });
    }
    return out;
  };

  /* ------------------------------------------------------------- Budgets */

  /* budgets["e|dept|acct"] = [12 monthly amounts, debit positive, minor]. */
  P.budgetFor = function (entity, dept, account, from, to) {
    var self = this, ents = entity === "GROUP" ? this.entities.map(function (e) { return e.id; }) : [entity];
    var s = 0;
    ents.forEach(function (e) {
      Object.keys(self.budgets).forEach(function (k) {
        var parts = k.split("|");
        if (parts[0] !== e) return;
        if (dept && parts[1] !== dept) return;
        if (account && (Array.isArray(account) ? account.indexOf(parts[2]) < 0 : parts[2] !== account)) return;
        var arr = self.budgets[k];
        periodsBetween(from, to).forEach(function (p) {
          var v = arr[+p.slice(5, 7) - 1] || 0;
          s += entity === "GROUP" ? self.usdOf(e, v, p, "avg") : v;
        });
      });
    });
    return s;
  };
  P.actualFor = function (entity, dept, account, from, to) {
    var self = this, ents = entity === "GROUP" ? this.entities.map(function (e) { return e.id; }) : [entity];
    var accts = Array.isArray(account) ? account : account ? [account] :
      this.accountList.filter(function (a) { return !a.bs; }).map(function (a) { return a.id; });
    var s = 0;
    ents.forEach(function (e) {
      accts.forEach(function (a) {
        periodsBetween(from, to).forEach(function (p) {
          var v = self.net(e, a, p, p, dept ? "dept:" + dept : null);
          if (v) s += entity === "GROUP" ? self.usdOf(e, v, p, "avg") : v;
        });
      });
    });
    return s;
  };
  /* Budget against actual for every department, over [from, to]. Expense
     accounts only; revenue has its own plan line. */
  P.budgetVsActual = function (entity, from, to) {
    var self = this;
    var exp = this.accountList.filter(function (a) { return a.type === "expense" && !a.ic && a.group !== "other" && a.group !== "tax"; }).map(function (a) { return a.id; });
    return this.dims.dept.map(function (d) {
      var budget = self.budgetFor(entity, d.id, exp, from, to);
      var actual = self.actualFor(entity, d.id, exp, from, to);
      var fy = self.budgetFor(entity, d.id, exp, self.fy + "-01", self.fy + "-12");
      return { dept: d, budget: budget, actual: actual, fullYear: fy, variance: actual - budget,
               used: budget ? actual / budget : 0, byAccount: exp.map(function (a) {
                 return { account: a, budget: self.budgetFor(entity, d.id, a, from, to), actual: self.actualFor(entity, d.id, a, from, to) };
               }).filter(function (r) { return r.budget || r.actual; }) };
    });
  };
  /* Budget control: what spending `amount` more would do to a department. */
  P.budgetCheck = function (entity, dept, usdAmount) {
    var p = this.currentPeriod(), from = this.fy + "-01";
    var row = this.budgetVsActual("GROUP", from, p).filter(function (r) { return r.dept.id === dept; })[0];
    if (!row) return { level: "ok" };
    var after = (row.actual + usdAmount) / (row.budget || 1);
    var level = after < 0.8 ? "ok" : after <= 1 ? "warn" : after <= 1.1 ? "manager" : "cfo";
    return { level: level, before: row.used, after: after, row: row,
             rule: "Under 80% of budget: approved. 80–100%: warning. 100–110%: manager approval. Over 110%: CFO." };
  };

  /* Where a variance came from: the vendors (or customers) behind the change
     in an account group between two ranges, largest first. */
  P.drivers = function (entity, accounts, dept, fromA, toA, fromB, toB) {
    var self = this, a = {}, b = {};
    function collect(from, to, into) {
      self.linesWhere({ entity: entity, accounts: accounts, from: from, to: to, dept: dept }).forEach(function (l) {
        var who = l.dims.vendor ? self.vendors[l.dims.vendor].name
                : l.dims.customer ? self.customers[l.dims.customer].name
                : (l.source && l.source.label) || "Other";
        var v = entity === "GROUP" ? self.usdOf(l.entity, l.amt, l.period, "avg") : l.amt;
        into[who] = (into[who] || 0) + v;
      });
    }
    collect(fromA, toA, a); collect(fromB, toB, b);
    var names = {};
    Object.keys(a).concat(Object.keys(b)).forEach(function (n) { names[n] = 1; });
    return Object.keys(names).map(function (n) {
      return { name: n, before: a[n] || 0, after: b[n] || 0, change: (b[n] || 0) - (a[n] || 0) };
    }).sort(function (x, y) { return Math.abs(y.change) - Math.abs(x.change); });
  };

  /* ------------------------------------------------------------- Assets */
  P.assetBook = function (a, asOfPeriod) {
    var monthly = Math.round((a.cost - (a.salvage || 0)) / a.life);
    // Depreciation starts the month after the asset goes into service; what
    // ran before this fiscal year is carried in priorDep.
    var start = addMonths(periodOf(a.inService), 1);
    var from = start > this.fy + "-01" ? start : this.fy + "-01";
    var through = a.depThrough && a.depThrough < asOfPeriod ? a.depThrough : a.depThrough ? asOfPeriod : null;
    var months = through && through >= from ? periodsBetween(from, through).length : 0;
    var dep = Math.min(a.cost - (a.salvage || 0), (a.priorDep || 0) + months * monthly);
    return { monthly: monthly, accumulated: dep, nbv: a.cost - dep };
  };
  P.depreciationDue = function (entity, period) {
    var self = this;
    return Object.values(this.assets).filter(function (a) {
      if (a.entity !== entity || a.status !== "active") return false;
      var start = addMonths(periodOf(a.inService), 1);
      if (period < start) return false;
      if (a.depThrough && a.depThrough >= period) return false;
      var bk = self.assetBook(a, addMonths(period, -1));
      return bk.nbv > (a.salvage || 0);
    }).map(function (a) {
      var bk = self.assetBook(a, addMonths(period, -1));
      return { asset: a, amount: Math.min(bk.monthly, bk.nbv - (a.salvage || 0)) };
    });
  };

  /* ====================================================== Formatting */

  /* Accounting format: thousands separators, negatives in parentheses
     (o.minus for a minus sign instead), o.compact for 4.2M, o.plus for +. */
  function group3(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  P.fmt = function (minor, cur, o) {
    o = o || {};
    cur = cur || "USD";
    var c = CUR[cur], dp = o.dp != null ? o.dp : c.dp;
    var neg = minor < 0, v = Math.abs(minor) / Math.pow(10, c.dp);
    var s;
    if (o.compact) {
      var units = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
      for (var i = 0; i < units.length; i++) {
        if (v >= units[i][0]) {
          var n = v / units[i][0];
          s = n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1") + units[i][1];
          break;
        }
      }
      if (!s) s = group3(v.toFixed(0));
    } else {
      var parts = v.toFixed(dp).split(".");
      s = group3(parts[0]) + (parts[1] ? "." + parts[1] : "");
    }
    var sym = o.sym === false ? "" : c.sym;
    if (neg && s.replace(/[^1-9]/g, "")) return o.minus ? "−" + sym + s : "(" + sym + s + ")";
    return (o.plus && minor > 0 ? "+" : "") + sym + s;
  };

  /* ============================================================ Commands */

  P.can = function (action, actor, ctx) {
    actor = actor || this.me;
    var perm = PERMS[action];
    if (!perm) return { ok: false, reason: "Unknown action " + action };
    if (actor.role === "system") return { ok: true };
    if (actor.role !== "member" && perm.roles.indexOf(actor.role) < 0) {
      var who = perm.roles.map(function (r) { return ROLES[r].name; }).join(" or ");
      return { ok: false, reason: "Needs " + who + ".", rule: perm.rule };
    }
    ctx = ctx || {};
    if (ctx.createdBy && ctx.createdBy === actor.id && (action === "journal.approve" || action === "ap.approve")) {
      return { ok: false, reason: "You prepared this, so someone else must approve it.", rule: "SOD-04 · The preparer of a document may not approve it." };
    }
    if (ctx.approvedBy && ctx.approvedBy === actor.id && action === "ap.pay") {
      return { ok: false, reason: "You approved this invoice, so someone else must release the payment.", rule: PERMS["ap.pay"].rule };
    }
    if (ctx.usd != null && actor.role === "controller") {
      var lim = action === "journal.approve" ? LIMITS.journal.controller : action === "ap.approve" ? LIMITS.ap.controller : null;
      if (lim != null && ctx.usd > lim * 100) {
        return { ok: false, reason: "Above the controller limit of " + this.fmt(lim * 100, "USD", { dp: 0 }) + " — needs the CFO.", rule: perm.rule };
      }
    }
    return { ok: true };
  };

  /* Runs a command as `actor`. Throws a Refusal the screen can show, or
     returns whatever the command made. Every success is audited and, unless
     it is being replayed, remembered so the sandbox survives a reload. */
  P.exec = function (type, payload, actor, meta) {
    actor = actor || this.me;
    meta = meta || {};
    var fn = COMMANDS[type];
    if (!fn) throw new Refusal("unknown", "Unknown command " + type);
    var at = meta.at || new Date().toISOString();
    if (this.live) {
      this.asOf = nyDate(at);
      if (actor.id && !this.people[actor.id]) this.people[actor.id] = { id: actor.id, name: actor.name || actor.id, role: actor.role, title: "" };
    }
    this._now = at;
    this._actor = actor;
    var result = fn.call(this, payload || {}, actor, at);
    var entry = { type: type, payload: payload, actor: { id: actor.id, name: actor.name, role: actor.role }, at: at };
    if (!meta.replay || this.live) this.log.push(entry);
    this._cons = null;
    this.emit({ type: type, payload: payload, result: result, actor: entry.actor, at: at, replay: !!meta.replay });
    return result;
  };

  P.record = function (action, obj, summary, extra, actor, at) {
    actor = actor || this._actor || this.people.system;
    var ev = {
      seq: this.audit.length + 1,
      at: at || this._now || (this.asOf + "T12:00:00Z"),
      actor: actor.id, actorName: actor.name, role: actor.role,
      action: action, obj: obj, summary: summary
    };
    if (extra) for (var k in extra) ev[k] = extra[k];
    this.audit.push(ev);
    this._chainValid = null;
    return ev;
  };

  /* Hash-chains the trail: each event's hash covers its content and the hash
     before it, so an edit anywhere breaks every hash after it. */
  P.chain = function () {
    if (this._chainAt === this.audit.length && this._chain) return this._chain;
    var prev = "0".repeat(64), out = [];
    for (var i = 0; i < this.audit.length; i++) {
      var ev = this.audit[i];
      var body = JSON.stringify([ev.seq, ev.at, ev.actor, ev.action, ev.obj, ev.summary, ev.before || null, ev.after || null, ev.reason || null]);
      var h = sha256(prev + body);
      out.push({ hash: h, prev: prev });
      prev = h;
    }
    this._chain = out; this._chainAt = this.audit.length;
    return out;
  };
  P.verifyAudit = function () {
    var c = this.chain();
    // Recompute from scratch and compare, as an auditor would.
    this._chain = null; this._chainAt = -1;
    var fresh = this.chain();
    for (var i = 0; i < c.length; i++) if (c[i].hash !== fresh[i].hash) return { ok: false, at: i + 1 };
    return { ok: true, count: fresh.length, head: fresh.length ? fresh[fresh.length - 1].hash : null };
  };

  function need(engine, action, actor, ctx) {
    var r = engine.can(action, actor, ctx);
    if (!r.ok) throw new Refusal("forbidden", r.reason, r.rule);
  }
  /* Control accounts belong to their subledgers: a manual journal to
     receivables would leave the customer ledger disagreeing with the GL. */
  function controlCheck(engine, j) {
    for (var i = 0; i < j.lines.length; i++) {
      var a = engine.accounts[j.lines[i].account];
      if (a && a.control) {
        var where = { ar: "Receivables", ap: "Payables", fa: "Fixed assets" }[a.control];
        return new Refusal("control", a.id + " " + a.name + " is a control account. Post it through " + where + " so the subledger stays in step with the ledger.",
          "Control accounts take postings only from their subledger.");
      }
    }
    return null;
  }
  function submitJournal(engine, j, at) {
    j.status = "pending";
    j.submittedAt = at;
    j.needs = usdOfJournal(engine, j) > LIMITS.journal.controller * 100 ? "cfo" : "controller";
  }
  function usdOfJournal(engine, j) {
    var tot = j.lines.reduce(function (s, l) { return s + (l.dr || 0); }, 0);
    return engine.usdOf(j.entity, tot, periodOf(j.date), "avg");
  }

  /* ---------------------------------------- Recorded transactions

     Most of what a business does is not a journal somebody argues for but an
     ordinary event: an expense, a payroll, a loan payment, money moved between
     accounts. Each kind is a shape the double entry can take — which accounts
     may be debited, which credited, how many lines — and nothing else. The
     screen builds the lines from plain questions; the engine, in the browser
     and again on the server, refuses any entry that isn't its kind's shape.
     That is what lets these post at once, where a free-form manual journal
     waits for a second person (SOD-04). */
  var CASH = ["1010", "1020", "1030"];
  var REVENUE = ["4000", "4100", "4200"];
  var TXN = {
    expense:       { group: "out", title: "Expense",                  dr: { expense: true }, cr: { ids: CASH.concat(["2500", "2100"]) }, cr1: true },
    payroll:       { group: "out", title: "Payroll",                  dr: { ids: ["6000", "6050", "6800"] }, cr: { ids: CASH.concat(["2400", "2100"]) } },
    "tax-pay":     { group: "out", title: "Tax payment",              dr: { ids: ["2300", "2400", "2600"] }, cr: { ids: CASH }, cr1: true },
    "loan-pay":    { group: "out", title: "Loan payment",             dr: { ids: ["2700", "7100"] }, cr: { ids: CASH }, cr1: true },
    distribution:  { group: "out", title: "Owner distribution",       dr: { ids: ["3100"] }, cr: { ids: CASH }, dr1: true, cr1: true },
    prepaid:       { group: "out", title: "Prepaid expense",          dr: { ids: ["1200"] }, cr: { ids: CASH.concat(["2500"]) }, dr1: true, cr1: true },
    "refund-in":   { group: "out", title: "Refund received",          dr: { ids: CASH }, cr: { expense: true }, dr1: true },
    sale:          { group: "in",  title: "Cash sale",                dr: { ids: CASH }, cr: { ids: REVENUE.concat(["2300"]) }, dr1: true },
    deferred:      { group: "in",  title: "Advance payment",          dr: { ids: CASH }, cr: { ids: ["2200"] }, dr1: true, cr1: true },
    investment:    { group: "in",  title: "Owner investment",         dr: { ids: CASH }, cr: { ids: ["3000"] }, dr1: true, cr1: true },
    "loan-in":     { group: "in",  title: "Loan received",            dr: { ids: CASH }, cr: { ids: ["2700"] }, dr1: true, cr1: true },
    interest:      { group: "in",  title: "Interest received",        dr: { ids: CASH }, cr: { ids: ["7000"] }, dr1: true, cr1: true },
    "refund-out":  { group: "in",  title: "Refund given",             dr: { ids: REVENUE }, cr: { ids: CASH }, cr1: true },
    accrual:       { group: "adj", title: "Accrual",                  dr: { expense: true }, cr: { ids: ["2100"] }, cr1: true, canReverse: true },
    amort:         { group: "adj", title: "Prepaid amortization",     dr: { expense: true }, cr: { ids: ["1200"] }, cr1: true },
    recognize:     { group: "adj", title: "Deferred revenue earned",  dr: { ids: ["2200"] }, cr: { ids: REVENUE }, dr1: true },
    transfer:      { group: "adj", title: "Transfer",                 dr: { ids: CASH }, cr: { ids: CASH }, dr1: true, cr1: true, differ: true }
  };
  function sideOk(engine, spec, id) {
    var a = engine.accounts[id];
    if (!a) return false;
    if (spec.ids) return spec.ids.indexOf(id) >= 0;
    if (spec.expense) return a.type === "expense" && !a.ic && a.group !== "tax";
    return false;
  }
  /* Does this journal have the shape its kind allows? Null if so. */
  function checkKind(engine, k, j) {
    var drs = [], crs = [];
    for (var i = 0; i < j.lines.length; i++) {
      var l = j.lines[i];
      if (l.dr) {
        if (!sideOk(engine, k.dr, l.account)) return new Refusal("shape", "Line " + (i + 1) + ": " + (engine.accounts[l.account] ? engine.accounts[l.account].name : l.account) + " can't be debited in a " + k.title.toLowerCase() + ".", "A " + k.title.toLowerCase() + " has a fixed shape; anything else is a manual journal, which a second person approves.");
        drs.push(l);
      } else {
        if (!sideOk(engine, k.cr, l.account)) return new Refusal("shape", "Line " + (i + 1) + ": " + (engine.accounts[l.account] ? engine.accounts[l.account].name : l.account) + " can't be credited in a " + k.title.toLowerCase() + ".", "A " + k.title.toLowerCase() + " has a fixed shape; anything else is a manual journal, which a second person approves.");
        crs.push(l);
      }
    }
    if (!drs.length || !crs.length) return new Refusal("shape", "A " + k.title.toLowerCase() + " needs a debit and a credit.");
    if ((k.dr1 && drs.length !== 1) || (k.cr1 && crs.length !== 1)) return new Refusal("shape", "A " + k.title.toLowerCase() + " has one line on each side that is fixed.");
    if (k.differ && drs[0].account === crs[0].account) return new Refusal("shape", "Choose two different accounts.");
    return null;
  }
  function cleanDims(d) {
    var out = {};
    ["dept", "product", "project", "vendor", "customer"].forEach(function (k) { if (d && typeof d[k] === "string" && d[k]) out[k] = d[k]; });
    return out;
  }
  function cleanLines(lines) {
    if (!Array.isArray(lines) || lines.length > 40) throw new Refusal("lines", "An entry has between two and forty lines.");
    return lines.map(function (l) {
      return { account: String(l.account || ""), dr: l.dr || 0, cr: l.cr || 0, dims: cleanDims(l.dims), memo: l.memo ? String(l.memo).slice(0, 120) : undefined };
    });
  }
  /* The mirror image of an entry, dated `date`, must itself be postable. */
  function reversalCheck(engine, j, date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || date <= j.date) return new Refusal("date", "The reversal has to be dated after the entry.");
    var st = engine.periodStatus(j.entity, periodOf(date));
    if (st === "none") return new Refusal("date", "The reversal has to fall in fiscal " + engine.fy + ".");
    var d = (st === "open" || st === "soft") ? date : engine.firstOpenDate(j.entity);
    return engine.validateJournal({ entity: j.entity, date: d, lines: j.lines.map(function (l) { return { account: l.account, dr: l.cr || 0, cr: l.dr || 0, dims: l.dims }; }) });
  }
  function isDate(x) {
    if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
    var t = new Date(x + "T00:00:00Z");
    return !isNaN(t) && t.toISOString().slice(0, 10) === x;       // 2026-02-30 is not a day
  }
  function isMoney(x) { return typeof x === "number" && x > 0 && x % 1 === 0 && x <= 1e13; }
  function trimmed(x, max) { return typeof x === "string" ? x.trim().slice(0, max) : ""; }

  var COMMANDS = {
    /* ---- Journals */
    "journal.create": function (p, actor, at) {
      need(this, "journal.create", actor);
      var j = {
        entity: p.entity, date: p.date, memo: p.memo || "", lines: clone(p.lines),
        source: { type: "manual", label: "Manual journal" }, status: "draft",
        createdBy: actor.id, createdAt: at, reverseOn: p.reverseOn || null, attachments: p.attachments || []
      };
      var bad = this.validateJournal(j) || controlCheck(this, j) || (j.reverseOn ? reversalCheck(this, j, j.reverseOn) : null);
      if (bad) throw bad;
      this.stage(j);
      // A manual journal never posts on its preparer's say-so: it waits for
      // somebody else (SOD-04), and for the CFO above the controller limit.
      if (p.submit) submitJournal(this, j, at);
      this.record("journal.create", j.id, "Prepared " + j.id + " · " + (j.memo || "manual journal") + " · " + this.fmt(j.total, this.entity[j.entity].currency),
        { after: { status: j.status, total: j.total } }, actor, at);
      return j;
    },
    "journal.submit": function (p, actor, at) {
      var j = this.journals[p.id];
      if (!j || j.status !== "draft") throw new Refusal("state", "Only a draft can be submitted.");
      need(this, "journal.create", actor);
      var bad = this.validateJournal(j);
      if (bad) throw bad;
      submitJournal(this, j, at);
      this.record("journal.submit", j.id, "Submitted " + j.id + " for approval", { before: { status: "draft" }, after: { status: "pending" } }, actor, at);
      return j;
    },
    "journal.discard": function (p, actor, at) {
      var j = this.journals[p.id];
      if (!j || (j.status !== "draft" && j.status !== "rejected")) throw new Refusal("state", "Only drafts and rejected journals can be discarded — posted ones are reversed.");
      need(this, "journal.create", actor);
      j.status = "discarded";
      this.record("journal.discard", j.id, "Discarded draft " + j.id, {}, actor, at);
      return j;
    },
    "journal.approve": function (p, actor, at) {
      var j = this.journals[p.id];
      if (!j || j.status !== "pending") throw new Refusal("state", "That journal is not waiting for approval.");
      need(this, "journal.approve", actor, { createdBy: j.createdBy, usd: usdOfJournal(this, j) });
      j.approvedBy = actor.id; j.approvedAt = at;
      this.post(j);
      this.record("journal.approve", j.id, "Approved and posted " + j.id + " to " + periodLabel(j.period) + (p.simulated ? " (simulated reviewer)" : ""),
        { before: { status: "pending" }, after: { status: "posted" } }, actor, at);
      if (j.reverseOn) {
        var r = this.reverseJournal(j, j.reverseOn, "Auto-reversal of " + j.id, actor, at);
        r.autoReversal = true;
      }
      return j;
    },
    "journal.reject": function (p, actor, at) {
      var j = this.journals[p.id];
      if (!j || j.status !== "pending") throw new Refusal("state", "That journal is not waiting for approval.");
      need(this, "journal.approve", actor, { usd: 0 });
      j.status = "rejected"; j.rejectedBy = actor.id; j.rejectedAt = at; j.rejectReason = p.reason || "";
      this.record("journal.reject", j.id, "Rejected " + j.id, { reason: p.reason || "", before: { status: "pending" }, after: { status: "rejected" } }, actor, at);
      return j;
    },
    "journal.reverse": function (p, actor, at) {
      var j = this.journals[p.id];
      if (!j || j.status !== "posted") throw new Refusal("state", "Only a posted journal can be reversed.");
      if (j.reversedBy) throw new Refusal("state", j.id + " was already reversed by " + j.reversedBy + ".");
      need(this, "journal.reverse", actor);
      if (!p.reason) throw new Refusal("reason", "Say why it is being reversed — the reason stays with both journals.");
      var date = p.date || this.asOf;
      return this.reverseJournal(j, date, p.reason, actor, at);
    },

    /* ---- Payables */
    "ap.approve": function (p, actor, at) {
      var inv = this.apInvoices[p.id];
      if (!inv || (inv.status !== "review" && inv.status !== "captured")) throw new Refusal("state", "That invoice is not waiting for approval.");
      var usd = this.usdOf(inv.entity, inv.amount, this.currentPeriod(), "close");
      need(this, "ap.approve", actor, { createdBy: inv.createdBy, usd: usd });
      var blocking = (inv.flags || []).filter(function (f) { return f.blocking && !f.resolved; });
      if (blocking.length) throw new Refusal("flags", "Resolve “" + blocking[0].title + "” first.", blocking[0].rule || "");
      if (p.budgetOverride) inv.budgetApprovedBy = actor.id;
      var over = (inv.flags || []).filter(function (f) { return f.code === "budget" && !f.resolved; })[0];
      if (over && actor.role !== "cfo" && actor.role !== "member") throw new Refusal("budget", "This invoice takes Marketing past its budget — the CFO approves budget exceptions.", PERMS["budget.approve"].rule);
      if (over) over.resolved = { by: actor.id, at: at, how: "Budget exception approved" };
      this.approveAP(inv, actor, at);
      return inv;
    },
    "ap.hold": function (p, actor, at) {
      var inv = this.apInvoices[p.id];
      need(this, "ap.hold", actor);
      var before = inv.status;
      inv.status = "hold"; inv.holdReason = p.reason || "On hold";
      this.record("ap.hold", inv.id, "Put " + inv.number + " (" + this.vendors[inv.vendor].name + ") on hold", { reason: p.reason || "", before: { status: before }, after: { status: "hold" } }, actor, at);
      return inv;
    },
    "ap.release": function (p, actor, at) {
      var inv = this.apInvoices[p.id];
      need(this, "ap.hold", actor);
      inv.status = inv.journal ? "approved" : "review"; inv.holdReason = null;
      this.record("ap.release", inv.id, "Released the hold on " + inv.number, { before: { status: "hold" }, after: { status: inv.status } }, actor, at);
      return inv;
    },
    "ap.reject": function (p, actor, at) {
      var inv = this.apInvoices[p.id];
      need(this, "ap.hold", actor);
      if (inv.journal) throw new Refusal("state", "That invoice is already in the ledger — reverse its journal instead.");
      var before = inv.status;
      inv.status = "rejected"; inv.rejectReason = p.reason || "";
      (inv.flags || []).forEach(function (f) { if (!f.resolved) f.resolved = { by: actor.id, at: at, how: p.reason || "Rejected" }; });
      this.record("ap.reject", inv.id, "Rejected " + inv.number + " from " + this.vendors[inv.vendor].name, { reason: p.reason || "", before: { status: before }, after: { status: "rejected" } }, actor, at);
      return inv;
    },
    "ap.clearFlag": function (p, actor, at) {
      var inv = this.apInvoices[p.id];
      need(this, "ap.hold", actor);
      var f = (inv.flags || []).filter(function (x) { return x.code === p.code; })[0];
      if (!f) throw new Refusal("state", "No such flag.");
      if (f.code === "match" && p.how === "received") {
        // Pay for what arrived; ask the vendor to credit the rest.
        var line = inv.lines[0], po = this.pos[inv.po];
        var got = po.lines[0].received;
        var old = inv.amount;
        line.qty = got; line.amt = got * line.unit;
        inv.amount = inv.lines.reduce(function (s, l) { return s + l.amt; }, 0);
        inv.creditRequested = old - inv.amount;
        f.resolved = { by: actor.id, at: at, how: "Approved for " + got + " received; credit memo requested for " + this.fmt(old - inv.amount, this.entity[inv.entity].currency) };
      } else {
        f.resolved = { by: actor.id, at: at, how: p.how || "Cleared" };
      }
      this.record("ap.flag", inv.id, "Cleared “" + f.title + "” on " + inv.number + " — " + f.resolved.how, { reason: p.how || "" }, actor, at);
      return inv;
    },
    "ap.schedule": function (p, actor, at) {
      var inv = this.apInvoices[p.id];
      need(this, "ap.pay", actor, { approvedBy: inv.approvedBy });
      if (inv.status !== "approved") throw new Refusal("state", "Only approved invoices can be scheduled.");
      if (this.vendors[inv.vendor].bankPending) throw new Refusal("bank", "Payments to " + this.vendors[inv.vendor].name + " are held until their new bank details are verified.", PERMS["vendor.verify"].rule);
      inv.status = "scheduled"; inv.scheduledFor = p.date || this.nextPaymentRun();
      this.record("ap.schedule", inv.id, "Scheduled " + inv.number + " for the " + inv.scheduledFor + " payment run", { after: { status: "scheduled" } }, actor, at);
      return inv;
    },
    "ap.payRun": function (p, actor, at) {
      need(this, "ap.pay", actor);
      var self = this, date = p.date || this.nextPaymentRun();
      var due = Object.values(this.apInvoices).filter(function (v) { return v.status === "scheduled" && v.scheduledFor <= date && (!p.ids || p.ids.indexOf(v.id) >= 0); });
      var blocked = due.filter(function (v) { return v.approvedBy === actor.id; });
      if (blocked.length) throw new Refusal("forbidden", "You approved " + blocked.length + " of these invoices, so someone else must release them.", PERMS["ap.pay"].rule);
      var paid = [];
      due.forEach(function (inv) {
        if (self.vendors[inv.vendor].bankPending) return;
        self.payAP(inv, self.asOf < date ? self.asOf : date, actor, at, true);
        paid.push(inv);
      });
      this.record("ap.payRun", "RUN-" + date, "Released a payment run of " + paid.length + " invoices", {}, actor, at);
      return paid;
    },
    "vendor.verifyBank": function (p, actor, at) {
      var v = this.vendors[p.id];
      need(this, "vendor.verify", actor);
      if (!v.bankPending) throw new Refusal("state", "Nothing is waiting to be verified for " + v.name + ".");
      if (p.approve === false) {
        this.record("vendor.bankReject", v.id, "Rejected the bank-detail change for " + v.name + " — " + (p.reason || "not confirmed by call-back"),
          { before: { bank: v.bankPending.mask }, after: { bank: v.bank.mask }, reason: p.reason || "" }, actor, at);
        this.raiseAnomalyResolved(v.id, actor, at, "Change rejected");
        v.bankPending = null;
      } else {
        var old = v.bank.mask;
        v.bank = { mask: v.bankPending.mask, bank: v.bankPending.bank, verified: true, verifiedBy: actor.id, verifiedAt: at };
        this.record("vendor.bankVerify", v.id, "Verified new bank details for " + v.name + " by call-back (" + (p.contact || "number on file") + ")",
          { before: { bank: old }, after: { bank: v.bank.mask } }, actor, at);
        this.raiseAnomalyResolved(v.id, actor, at, "Verified by call-back");
        v.bankPending = null;
      }
      var self = this;
      Object.values(this.apInvoices).forEach(function (inv) {
        if (inv.vendor === v.id) (inv.flags || []).forEach(function (f) {
          if (f.code === "bank" && !f.resolved) f.resolved = { by: actor.id, at: at, how: p.approve === false ? "Change rejected; paying the account on file" : "Verified by call-back" };
        });
      });
      return v;
    },

    /* ---- Receivables */
    "ar.apply": function (p, actor, at) {
      need(this, "ar.apply", actor);
      var inv = this.arInvoices[p.invoice];
      if (!inv || inv.balance <= 0) throw new Refusal("state", "That invoice has nothing left to pay.");
      var amt = p.amount || inv.balance;
      if (amt > inv.balance) throw new Refusal("amount", "That is more than the " + this.fmt(inv.balance, this.entity[inv.entity].currency) + " still owed.");
      var bl = p.bankLine ? this.bankLines[p.bankLine] : null;
      var date = bl ? bl.date : (p.date || this.asOf);
      var j = this.post({
        entity: inv.entity, date: date, memo: "Payment — " + this.customers[inv.customer].name + " " + inv.number,
        source: { type: "ar-pay", id: inv.id, label: "Customer payment" },
        lines: [
          { account: "1010", dr: amt, dims: { customer: inv.customer } },
          { account: "1100", cr: amt, dims: { customer: inv.customer } }
        ], createdBy: actor.id, createdAt: at
      });
      inv.balance -= amt;
      inv.payments.push({ date: date, amount: amt, journal: j.id, bankLine: bl ? bl.id : null });
      inv.status = inv.balance === 0 ? "paid" : "partial";
      if (bl) { bl.status = "matched"; bl.matches = [j.id + "#0"]; bl.matchedBy = actor.id; bl.matchedAt = at; }
      this.record("ar.apply", inv.id, "Applied " + this.fmt(amt, this.entity[inv.entity].currency) + " from " + this.customers[inv.customer].name + " to " + inv.number,
        { after: { balance: inv.balance, status: inv.status } }, actor, at);
      return { invoice: inv, journal: j };
    },
    "ar.remind": function (p, actor, at) {
      need(this, "ar.collect", actor);
      var inv = this.arInvoices[p.invoice];
      var step = p.step || "Reminder sent";
      inv.collections.push({ date: this.asOf, action: step, by: actor.id, at: at, note: p.note || "" });
      this.record("ar.collect", inv.id, step + " — " + this.customers[inv.customer].name + " " + inv.number, { reason: p.note || "" }, actor, at);
      return inv;
    },

    /* ---- Bank */
    "bank.match": function (p, actor, at) {
      need(this, "bank.match", actor);
      var bl = this.bankLines[p.bankLine];
      if (!bl || bl.status !== "unmatched") throw new Refusal("state", "That bank line is already reconciled.");
      var self = this, keys = p.keys || [];
      var sum = keys.reduce(function (s, k) {
        var l = self.lineByKey(k);
        if (!l) throw new Refusal("state", "Ledger line " + k + " not found.");
        return s + l.amt;
      }, 0);
      if (sum !== bl.amount) throw new Refusal("amount", "The ledger side totals " + this.fmt(sum, this.entity[this.bankAccounts[bl.bank].entity].currency) +
        ", the bank line " + this.fmt(bl.amount, this.entity[this.bankAccounts[bl.bank].entity].currency) + ".", "A match must agree to the cent.");
      bl.status = "matched"; bl.matches = keys; bl.matchedBy = actor.id; bl.matchedAt = at;
      this.record("bank.match", bl.id, "Matched bank line “" + bl.desc + "” " + this.fmt(bl.amount, this.entity[this.bankAccounts[bl.bank].entity].currency), {}, actor, at);
      return bl;
    },
    "bank.autoMatch": function (p, actor, at) {
      need(this, "bank.match", actor);
      var rec = this.reconciliation(p.bank), n = 0, self = this, used = {};
      rec.bankOpen.forEach(function (bl) {
        var s = bl.suggestion;
        if (s && s.kind === "book" && s.confidence === "high" && !used[s.key]) {
          used[s.key] = 1;
          bl.status = "matched"; bl.matches = [s.key]; bl.matchedBy = actor.id; bl.matchedAt = at; bl.auto = true; n++;
        }
      });
      this.record("bank.autoMatch", p.bank, "Auto-matched " + n + " bank lines on exact amount and date", {}, actor, at);
      return n;
    },
    "bank.create": function (p, actor, at) {
      need(this, "bank.match", actor);
      var bl = this.bankLines[p.bankLine];
      if (!bl || bl.status !== "unmatched") throw new Refusal("state", "That bank line is already reconciled.");
      var b = this.bankAccounts[bl.bank];
      var amt = Math.abs(bl.amount);
      var dims = p.dims || {};
      var acct = this.accounts[p.account];
      if (acct && acct.type === "expense" && !dims.dept) dims.dept = "GA";
      var lines = bl.amount < 0
        ? [{ account: p.account, dr: amt, dims: dims }, { account: b.account, cr: amt }]
        : [{ account: b.account, dr: amt }, { account: p.account, cr: amt, dims: dims }];
      var j = this.post({ entity: b.entity, date: bl.date, memo: p.memo || bl.desc, source: { type: "bank", id: bl.id, label: "Bank entry" },
                          lines: lines, createdBy: actor.id, createdAt: at });
      bl.status = "matched"; bl.matches = [j.id + "#" + (bl.amount < 0 ? 1 : 0)]; bl.matchedBy = actor.id; bl.matchedAt = at; bl.created = j.id;
      this.record("bank.create", bl.id, "Booked " + j.id + " from bank line “" + bl.desc + "” to " + p.account + " " + (acct ? acct.name : ""), {}, actor, at);
      return j;
    },
    "bank.unmatch": function (p, actor, at) {
      need(this, "bank.match", actor);
      var bl = this.bankLines[p.bankLine];
      if (bl.created) throw new Refusal("state", "This line created " + bl.created + ". Reverse that journal instead.");
      bl.status = "unmatched"; bl.matches = []; bl.auto = false;
      this.record("bank.unmatch", bl.id, "Unmatched bank line “" + bl.desc + "”", {}, actor, at);
      return bl;
    },

    /* ---- Assets & the close */
    "asset.depreciate": function (p, actor, at) {
      need(this, "asset.depreciate", actor);
      return this.runDepreciation(p.entity, p.period || this.currentPeriod(), actor, at);
    },
    "close.run": function (p, actor, at) {
      var t = this.closeTasks[p.id];
      if (!t) throw new Refusal("state", "No such task.");
      need(this, "close.task", actor);
      if (t.status === "done") throw new Refusal("state", "That task is already done.");
      var blockers = (t.deps || []).filter(function (d) { return this.closeTasks[d] && this.closeTasks[d].status !== "done"; }, this);
      if (blockers.length && !p.force) throw new Refusal("deps", "Waiting on “" + this.closeTasks[blockers[0]].title + "”.", "Close tasks run in order: a task starts when the tasks it depends on are done.");
      var made = null;
      if (t.run && CLOSE_RUNS[t.run]) made = CLOSE_RUNS[t.run].call(this, t, actor, at);
      t.status = "done"; t.completedBy = actor.id; t.completedAt = at; t.note = p.note || (made && made.note) || "";
      t.journals = (made && made.journals) || [];
      this.record("close.task", t.id, "Completed “" + t.title + "”" + (t.journals.length ? " · posted " + t.journals.join(", ") : ""), { reason: p.note || "" }, actor, at);
      return { task: t, made: made };
    },
    "close.reopen": function (p, actor, at) {
      var t = this.closeTasks[p.id];
      need(this, "close.task", actor);
      if (t.journals && t.journals.length) throw new Refusal("state", "This task posted journals. Reverse them first, then reopen it.");
      t.status = "todo"; t.completedBy = null; t.completedAt = null;
      this.record("close.reopen", t.id, "Reopened “" + t.title + "”", { reason: p.reason || "" }, actor, at);
      return t;
    },
    "period.set": function (p, actor, at) {
      var cur = this.periodStatus(p.entity, p.period);
      var order = ["open", "soft", "closed", "locked"];
      if (p.status === "locked" || (cur === "locked")) need(this, "period.lock", actor);
      else need(this, "period.close", actor);
      if (this.live && (p.status === "closed" || p.status === "locked") && p.period >= this.currentPeriod())
        throw new Refusal("period", periodLabel(p.period, true) + " hasn't ended yet.", "A month is closed once it is over, so nothing dated in it can be left out.");
      if ((p.status === "closed" || p.status === "locked") && p.period === this.currentPeriod()) {
        var open = Object.values(this.closeTasks).filter(function (t) { return t.period === p.period && t.status !== "done" && (t.entity === p.entity || t.entity === "ALL"); });
        if (open.length) throw new Refusal("tasks", open.length + " close task" + (open.length === 1 ? " is" : "s are") + " still open for " + periodLabel(p.period, true) + ".", "A period closes when its checklist is complete.");
        var pend = Object.values(this.journals).filter(function (j) { return j.entity === p.entity && j.period === p.period && j.status === "pending"; });
        if (pend.length) throw new Refusal("journals", pend.length + " journal" + (pend.length === 1 ? " is" : "s are") + " still waiting for approval in " + periodLabel(p.period) + ".");
      }
      if (order.indexOf(p.status) < 0) throw new Refusal("state", "Unknown status.");
      this.setPeriod(p.entity, p.period, p.status, actor.id, at);
      this.record("period.set", p.entity + ":" + p.period, periodLabel(p.period, true) + " for " + this.entity[p.entity].short + ": " + cur + " → " + p.status,
        { before: { status: cur }, after: { status: p.status }, reason: p.reason || "" }, actor, at);
      return p;
    },
    "budget.decide": function (p, actor, at) {
      need(this, "budget.approve", actor);
      var x = this.exceptions[p.id];
      if (!x || x.status !== "open") throw new Refusal("state", "That exception has already been decided.");
      x.status = p.approve ? "approved" : "declined"; x.decidedBy = actor.id; x.decidedAt = at; x.note = p.note || "";
      // The invoice that raised it follows the decision.
      var inv = x.ap ? this.apInvoices[x.ap] : null;
      if (inv) {
        (inv.flags || []).forEach(function (f) { if (f.code === "budget" && !f.resolved) f.resolved = { by: actor.id, at: at, how: p.approve ? "Budget exception approved" : "Budget exception declined" }; });
        if (!p.approve && (inv.status === "review" || inv.status === "captured")) { inv.status = "hold"; inv.holdReason = "Budget exception declined" + (p.note ? " — " + p.note : ""); }
      }
      this.record("budget.exception", x.id, (p.approve ? "Approved" : "Declined") + " budget exception: " + x.title, { reason: p.note || "" }, actor, at);
      return x;
    },
    "anomaly.resolve": function (p, actor, at) {
      need(this, "anomaly.resolve", actor);
      var a = this.anomalies[p.id];
      a.status = p.outcome || "dismissed"; a.resolvedBy = actor.id; a.resolvedAt = at; a.note = p.note || "";
      this.record("anomaly." + a.status, a.id, (a.status === "escalated" ? "Escalated to Internal Audit: " : "Dismissed: ") + a.title, { reason: p.note || "" }, actor, at);
      return a;
    },
    /* ---- Vendors and the company card */
    "vendor.create": function (p, actor, at) {
      need(this, "vendor.create", actor);
      if (!/^[a-z][a-z0-9-]{1,30}$/.test(p.id || "")) throw new Refusal("vendor", "A vendor's reference is lower-case letters, digits and hyphens.");
      if (this.vendors[p.id]) throw new Refusal("state", p.id + " already exists.");
      if (!p.name || !this.entity[p.entity]) throw new Refusal("vendor", "A vendor needs a name and an entity.");
      if (!this.accounts[p.account]) throw new Refusal("account", "Account " + p.account + " does not exist.");
      this.vendors[p.id] = { id: p.id, entity: p.entity, name: p.name, account: p.account, dept: p.dept || "GA", base: 0, growth: 0, terms: p.terms || 0, opts: { card: !!p.card },
        accrue: false, category: p.category || "Services", email: null, created: p.created || at.slice(0, 10), card: !!p.card, tin: null, w9: false,
        bank: p.card ? { mask: "", bank: "Company card", verified: true } : { mask: "", bank: "", verified: false } };
      this.record("vendor.create", p.id, "Added vendor " + p.name + (p.card ? " (paid by company card)" : ""), {}, actor, at);
      return this.vendors[p.id];
    },
    /* A charge on the company card: an expense on its date against the card
       payable. A refunded charge is booked and reversed. A charge from before
       the fiscal year, or for nothing, is on the record with nothing to post.
       Both journals are checked before anything is written, so a refusal
       leaves the books as they were. */
    "card.record": function (p, actor, at) {
      need(this, "card.record", actor);
      var v = this.vendors[p.vendor];
      if (!v || !v.card) throw new Refusal("state", "That vendor isn't paid by company card.");
      if (!p.id) {
        var top = 0;
        this.cardOrder.forEach(function (x) { top = Math.max(top, +x.slice(4)); });
        p = Object.assign({}, p, { id: "CHG-" + pad(top + 1, 4) });
      }
      if (!/^CHG-\d{4,}$/.test(p.id || "")) throw new Refusal("state", "Card charges are referred to as CHG-0001.");
      if (this.cardCharges[p.id]) throw new Refusal("state", p.id + " is already recorded.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date || "") || !(p.amount >= 0) || p.amount % 1) throw new Refusal("amount", "A card charge needs a date and a whole number of cents.");
      var status = p.status === "refunded" ? "refunded" : "paid";
      var rec = { id: p.id, vendor: p.vendor, date: p.date, due: p.due || null, amount: p.amount, status: status, fy: +p.date.slice(0, 4), journal: null, refundJournal: null, source: p.source || "" };
      var jn = "JE-" + v.entity + "-C" + p.id.slice(4), dims = { dept: v.dept, vendor: v.id }, sys = actor.role === "system", made = [];
      if (p.amount && p.date >= this.fy + "-01-01") {
        var charge = { id: jn, entity: v.entity, date: p.date, memo: v.name + " \u2014 charge " + p.id, source: { type: "card", id: p.id, label: "Card charge" },
          lines: [{ account: v.account, dr: p.amount, dims: dims }, { account: "2500", cr: p.amount, dims: { vendor: v.id } }], createdBy: actor.id, createdAt: at };
        made.push(charge);
        if (status === "refunded") made.push({ id: jn + "R", entity: v.entity, date: p.date, memo: v.name + " \u2014 refund of " + p.id + " (the billing history shows no refund date, so it is booked on the charge date)",
          source: { type: "card-refund", id: p.id, label: "Card refund" }, lines: [{ account: "2500", dr: p.amount, dims: { vendor: v.id } }, { account: v.account, cr: p.amount, dims: dims }], createdBy: actor.id, createdAt: at });
        for (var i = 0; i < made.length; i++) { var bad = this.validateJournal(made[i], { system: sys }); if (bad) throw bad; }
      }
      this.cardCharges[p.id] = rec; this.cardOrder.push(p.id);
      if (made[0]) rec.journal = this.post(made[0], { system: sys }).id;
      if (made[1]) rec.refundJournal = this.post(made[1], { system: sys }).id;
      this.record("card.record", p.id, "Recorded card charge " + p.id + " from " + v.name + " \u00b7 " + this.fmt(p.amount, "USD") + (status === "refunded" ? " \u00b7 refunded" : "") + (rec.journal ? " \u00b7 posted " + rec.journal : ""), {}, actor, at);
      return rec;
    },
    /* ---- Recorded transactions, customers, bills, invoices, assets */
    "txn.post": function (p, actor, at) {
      need(this, "txn.post", actor);
      var k = TXN[p.kind];
      if (!k) throw new Refusal("kind", "That isn't a kind of entry the books know.");
      var memo = trimmed(p.memo, 200);
      if (!memo) throw new Refusal("memo", "Say what this was — the memo is what anyone reading the books sees first.");
      var j = { entity: p.entity, date: p.date, memo: memo, lines: cleanLines(p.lines), source: { type: p.kind, label: k.title },
                status: "draft", createdBy: actor.id, createdAt: at, approvedBy: actor.id, approvedAt: at, attachments: Array.isArray(p.attachments) ? p.attachments.slice(0, 10) : [] };
      var bad = this.validateJournal(j) || checkKind(this, k, j);
      if (!bad && p.reverseOn) bad = !k.canReverse ? new Refusal("date", "Only an accrual reverses itself.") : reversalCheck(this, j, p.reverseOn);
      if (bad) throw bad;
      this.post(j);
      this.record("txn.post", j.id, "Recorded " + k.title.toLowerCase() + " \u00b7 " + memo + " \u00b7 " + this.fmt(j.total, this.entity[j.entity].currency) + " \u00b7 posted " + j.id,
        { after: { status: "posted", total: j.total } }, actor, at);
      if (p.reverseOn) { var r = this.reverseJournal(j, p.reverseOn, "Auto-reversal of " + j.id, actor, at); r.autoReversal = true; }
      return j;
    },
    "customer.create": function (p, actor, at) {
      need(this, "customer.create", actor);
      if (!/^[a-z][a-z0-9-]{1,30}$/.test(p.id || "")) throw new Refusal("customer", "A customer's reference is lower-case letters, digits and hyphens.");
      if (this.customers[p.id]) throw new Refusal("state", p.id + " already exists.");
      var name = trimmed(p.name, 80);
      if (!name || !this.entity[p.entity]) throw new Refusal("customer", "A customer needs a name and an entity.");
      var terms = p.terms == null ? 30 : p.terms;
      if (!(terms >= 0 && terms <= 180) || terms % 1) throw new Refusal("customer", "Payment terms are a whole number of days, up to 180.");
      this.customers[p.id] = { id: p.id, entity: p.entity, name: name, product: "", mrr: 0, billing: "invoice", anniversary: null, lateness: 0, usage: null,
        creditLimit: 0, terms: terms, segment: "Customer", since: +at.slice(0, 4), contact: trimmed(p.contact, 80), email: trimmed(p.email, 120) || null };
      this.record("customer.create", p.id, "Added customer " + name, {}, actor, at);
      return this.customers[p.id];
    },
    "ar.issue": function (p, actor, at) {
      need(this, "ar.issue", actor);
      var c = this.customers[p.customer];
      if (!c) throw new Refusal("customer", "Choose a customer.");
      if (!isDate(p.date)) throw new Refusal("date", "Give the invoice a date.");
      if (!Array.isArray(p.lines) || !p.lines.length || p.lines.length > 30) throw new Refusal("lines", "An invoice has between one and thirty lines.");
      var sub = 0, items = p.lines.map(function (l, i) {
        if (REVENUE.indexOf(l.account) < 0) throw new Refusal("account", "Line " + (i + 1) + ": choose a revenue account.");
        if (!isMoney(l.amt)) throw new Refusal("amount", "Line " + (i + 1) + ": give the line an amount.");
        sub += l.amt;
        return { account: l.account, amt: l.amt, desc: trimmed(l.desc, 120), product: typeof l.product === "string" && l.product ? l.product : null };
      });
      var tax = p.tax == null ? 0 : p.tax;
      if (!(tax >= 0) || tax % 1) throw new Refusal("amount", "Tax is a whole number of the smallest unit.");
      var terms = p.terms == null ? c.terms : p.terms;
      if (!(terms >= 0 && terms <= 180) || terms % 1) throw new Refusal("date", "Payment terms are a whole number of days, up to 180.");
      var total = sub + tax, key = "INV-" + c.entity, n = (this.seq[key] || 0) + 1, id = "INV-" + c.entity + "-" + (10000 + n);
      var jl = [{ account: "1100", dr: total, dims: { customer: c.id } }];
      items.forEach(function (l) { jl.push({ account: l.account, cr: l.amt, dims: l.product ? { customer: c.id, product: l.product } : { customer: c.id }, memo: l.desc || undefined }); });
      if (tax) jl.push({ account: "2300", cr: tax, memo: "Sales tax" });
      var j = { entity: c.entity, date: p.date, memo: "Invoice " + id + " \u2014 " + c.name, source: { type: "ar", id: id, label: "Customer invoice" }, lines: jl,
                createdBy: actor.id, createdAt: at, approvedBy: actor.id, approvedAt: at };
      var bad = this.validateJournal(j);
      if (bad) throw bad;
      this.seq[key] = n;
      this.post(j);
      var inv = { id: id, number: id, entity: c.entity, customer: c.id, date: p.date, due: addDays(p.date, terms), subtotal: sub, tax: tax, amount: total, balance: total,
                  status: "open", lines: items, payments: [], collections: [], kind: "invoice", journal: j.id, ref: trimmed(p.ref, 60), createdBy: actor.id };
      this.arInvoices[id] = inv;
      this.record("ar.issue", id, "Issued " + id + " to " + c.name + " \u00b7 " + this.fmt(total, this.entity[c.entity].currency) + " \u00b7 posted " + j.id, {}, actor, at);
      return inv;
    },
    "ap.capture": function (p, actor, at) {
      need(this, "ap.capture", actor);
      var v = this.vendors[p.vendor];
      if (!v || v.card) throw new Refusal("vendor", "Choose a vendor that is paid by invoice.");
      var number = trimmed(p.number, 40);
      if (!number) throw new Refusal("number", "Enter the vendor's invoice number.");
      if (!isDate(p.date) || !isDate(p.due)) throw new Refusal("date", "Give the bill's date and when it is due.");
      if (p.due < p.date) throw new Refusal("date", "A bill can't fall due before its own date.");
      if (!Array.isArray(p.lines) || !p.lines.length || p.lines.length > 30) throw new Refusal("lines", "A bill has between one and thirty lines.");
      var self = this;
      Object.values(this.apInvoices).forEach(function (x) {
        if (x.vendor === v.id && x.number.toLowerCase() === number.toLowerCase() && x.status !== "rejected") throw new Refusal("duplicate", v.name + " invoice " + number + " is already in Payables (" + x.id + ").");
      });
      var amount = 0, lines = p.lines.map(function (l, i) {
        var a = self.accounts[l.account];
        var ok = a && ((a.type === "expense" && !a.ic && a.group !== "tax") || l.account === "1200" || a.group === "ppe" && !a.contra);
        if (!ok) throw new Refusal("account", "Line " + (i + 1) + ": a bill can be coded to an expense, prepaid expense or fixed-asset account.");
        if (!isMoney(l.amt)) throw new Refusal("amount", "Line " + (i + 1) + ": give the line an amount.");
        if (a.type === "expense" && !(typeof l.dept === "string" && self.dims.dept.some(function (d) { return d.id === l.dept; }))) throw new Refusal("dims", "Line " + (i + 1) + ": expenses need a department.", "Every expense is charged to a department so budgets can be controlled.");
        amount += l.amt;
        return { account: l.account, amt: l.amt, dept: a.bs ? undefined : l.dept, desc: trimmed(l.desc, 120) };
      });
      var inv = { id: "AP-" + pad(+(this.seq.APO || 0) + 1, 4), entity: v.entity, vendor: v.id, number: number, date: p.date, due: p.due, amount: amount,
                  currency: this.entity[v.entity].currency, status: "review", lines: lines, flags: [], createdBy: actor.id, capturedAt: at, capture: { method: "manual", confidence: 1 } };
      // Approval moves a bill in a closed month to the first open day, so check it where it will land.
      var st = this.periodStatus(v.entity, periodOf(p.date)), gl = (st === "open" || st === "soft" || st === "none") ? p.date : this.firstOpenDate(v.entity);
      var bad = this.validateJournal(this.apJournal(inv, gl));
      if (bad) throw bad;
      this.seq.APO = (this.seq.APO || 0) + 1;
      this.apInvoices[inv.id] = inv;
      this.record("ap.capture", inv.id, "Captured " + number + " from " + v.name + " \u00b7 " + this.fmt(amount, inv.currency) + " (entered by hand)", {}, actor, at);
      return inv;
    },
    "asset.acquire": function (p, actor, at) {
      need(this, "asset.acquire", actor);
      if (!this.entity[p.entity]) throw new Refusal("entity", "Choose a legal entity.");
      var cls = this.accounts[p.cls];
      if (!cls || cls.group !== "ppe" || cls.contra) throw new Refusal("account", "Choose what kind of asset it is.");
      var name = trimmed(p.name, 80);
      if (!name) throw new Refusal("name", "Name the asset.");
      if (!isMoney(p.cost)) throw new Refusal("amount", "Give the asset's cost.");
      if (!isDate(p.date)) throw new Refusal("date", "Give the date it was bought and put to use.");
      var life = p.life == null ? (p.cls === "1530" ? 84 : p.cls === "1520" ? 60 : 36) : p.life;
      if (!(life >= 1 && life <= 600) || life % 1) throw new Refusal("life", "Useful life is a whole number of months.");
      if (CASH.concat(["2500"]).indexOf(p.paidFrom) < 0) throw new Refusal("account", "Say what it was paid from.");
      var dept = this.dims.dept.some(function (d) { return d.id === p.dept; }) ? p.dept : "GA";
      var id = "AST-" + pad(+(this.seq.AST || 0) + 1, 5);
      var j = { entity: p.entity, date: p.date, memo: "Bought " + name, source: { type: "asset", id: id, label: "Asset purchase" },
                lines: [{ account: p.cls, dr: p.cost, dims: { dept: dept } }, { account: p.paidFrom, cr: p.cost }], createdBy: actor.id, createdAt: at, approvedBy: actor.id, approvedAt: at };
      var bad = this.validateJournal(j);
      if (bad) throw bad;
      this.seq.AST = (this.seq.AST || 0) + 1;
      this.post(j);
      this.assets[id] = { id: id, entity: p.entity, name: name, cls: p.cls, dept: dept, cost: p.cost, qty: 1, inService: p.date, life: life, salvage: 0,
        location: trimmed(p.location, 60) || this.entity[p.entity].city || "", status: "active", priorDep: 0, depThrough: null, source: j.id };
      this.record("asset.acquire", id, "Bought " + name + " \u00b7 " + this.fmt(p.cost, this.entity[p.entity].currency) + " \u00b7 posted " + j.id, {}, actor, at);
      return this.assets[id];
    },
    "ic.book": function (p, actor, at) {
      need(this, "journal.create", actor);
      return this.bookIntercompany(p.entity, p.period || this.currentPeriod(), actor, at);
    }
  };
  P.commands = COMMANDS;

  /* ------------------------------------------------ Command internals */

  /* Card charges, oldest first. Each is {id, vendor, date, due, amount,
     status: "paid" | "refunded", fy, journal, refundJournal}; one that
     belongs to an earlier fiscal year, or is for nothing, has no journal. */
  P.cardChargeList = function (o) {
    o = o || {};
    var self = this;
    return this.cardOrder.map(function (id) { return self.cardCharges[id]; }).filter(function (c) {
      return (!o.vendor || c.vendor === o.vendor) && (!o.from || c.date >= o.from) && (!o.to || c.date <= o.to);
    });
  };
  /* What the card was really charged, net of refunds, from the ledger. */
  P.cardSpend = function (vendor, from, to) {
    return this.linesWhere({ entity: "US", accounts: ["6100"], vendor: vendor, from: from, to: to })
      .filter(function (l) { return l.source && (l.source.type === "card" || l.source.type === "card-refund"); })
      .reduce(function (sum, l) { return sum + l.amt; }, 0);
  };

  P.lineByKey = function (key) {
    if (!this._lineIdx || this._lineIdxN !== this.lines.length) {
      this._lineIdx = {};
      for (var i = 0; i < this.lines.length; i++) this._lineIdx[this.lines[i].key] = this.lines[i];
      this._lineIdxN = this.lines.length;
    }
    return this._lineIdx[key];
  };

  P.reverseJournal = function (j, date, reason, actor, at) {
    var st = this.periodStatus(j.entity, periodOf(date));
    if (st === "closed" || st === "locked") date = this.firstOpenDate(j.entity);
    var r = {
      entity: j.entity, date: date, memo: "Reversal of " + j.id + (reason ? " — " + reason : ""),
      source: { type: "reversal", id: j.id, label: "Reversal" }, reverses: j.id,
      lines: j.lines.map(function (l) { return { account: l.account, dr: l.cr || 0, cr: l.dr || 0, dims: clone(l.dims || {}), memo: l.memo }; }),
      createdBy: actor.id, createdAt: at, approvedBy: actor.id, approvedAt: at
    };
    this.post(r);
    j.reversedBy = r.id;
    this.record("journal.reverse", j.id, "Reversed " + j.id + " with " + r.id + " dated " + date, { reason: reason }, actor, at);
    return r;
  };
  P.firstOpenDate = function (entity) {
    var p = this.fy + "-01";
    while (this.periodStatus(entity, p) !== "open" && this.periodStatus(entity, p) !== "soft" && p <= this.fy + "-12") p = addMonths(p, 1);
    return p === this.currentPeriod() ? this.asOf : p + "-01";
  };

  P.nextPaymentRun = function () {
    var d = addDays(this.asOf, 1);
    while (weekday(d) !== 4) d = addDays(d, 1);    // Thursdays
    return d;
  };

  P.apJournal = function (inv, date) {
    var self = this, v = this.vendors[inv.vendor];
    var lines = inv.lines.map(function (l) {
      var a = l.account || v.account;
      var dims = { dept: l.dept || v.dept, vendor: v.id };
      if (l.project) dims.project = l.project;
      if (self.accounts[a].bs) dims = { vendor: v.id };
      return { account: a, dr: l.amt, dims: dims, memo: l.desc };
    });
    lines.push({ account: "2000", cr: inv.amount, dims: { vendor: v.id } });
    return {
      entity: inv.entity, date: date, memo: v.name + " " + inv.number,
      source: { type: "ap", id: inv.id, label: "Vendor invoice" }, lines: lines
    };
  };
  P.approveAP = function (inv, actor, at, seeding) {
    var date = inv.date;
    var st = this.periodStatus(inv.entity, periodOf(date));
    if (st !== "open" && st !== "soft") date = this.firstOpenDate(inv.entity);
    var j = this.apJournal(inv, date);
    j.createdBy = inv.createdBy; j.createdAt = inv.capturedAt; j.approvedBy = actor.id; j.approvedAt = at;
    this.post(j, { system: !!seeding });
    inv.journal = j.id; inv.glDate = date;
    inv.status = "approved"; inv.approvedBy = actor.id; inv.approvedAt = at;
    // Capital purchases go on the asset register when they are approved.
    var self = this;
    inv.lines.forEach(function (l, i) {
      var a = l.account || self.vendors[inv.vendor].account;
      if (self.accounts[a].group === "ppe" && !l.asset) {
        var id = self.nextId("AST", 5);
        self.assets[id] = {
          id: id, entity: inv.entity, name: l.desc, cls: a, cost: l.amt, qty: l.qty || 1, inService: date,
          life: a === "1530" ? 84 : a === "1520" ? 60 : 36, salvage: 0, dept: l.dept || "ENG",
          location: self.entity[inv.entity].city, status: "active", source: inv.id, depThrough: null, priorDep: 0
        };
        l.asset = id;
      }
    });
    if (!seeding) {
      this.record("ap.approve", inv.id, "Approved " + inv.number + " from " + this.vendors[inv.vendor].name + " · " +
        this.fmt(inv.amount, this.entity[inv.entity].currency) + " · posted " + j.id, { before: { status: "review" }, after: { status: "approved" } }, actor, at);
    }
    return j;
  };
  P.payAP = function (inv, date, actor, at, record) {
    var j = this.post({
      entity: inv.entity, date: date, memo: "Payment — " + this.vendors[inv.vendor].name + " " + inv.number,
      source: { type: "ap-pay", id: inv.id, label: "Vendor payment" },
      lines: [{ account: "2000", dr: inv.amount, dims: { vendor: inv.vendor } }, { account: "1010", cr: inv.amount, dims: { vendor: inv.vendor } }],
      createdBy: actor.id, createdAt: at
    }, { system: !record });
    inv.status = "paid"; inv.paidAt = date; inv.payJournal = j.id; inv.paidBy = actor.id;
    if (record) this.record("ap.pay", inv.id, "Paid " + inv.number + " to " + this.vendors[inv.vendor].name + " · " + this.fmt(inv.amount, this.entity[inv.entity].currency), {}, actor, at);
    return j;
  };

  P.runDepreciation = function (entity, period, actor, at) {
    var due = this.depreciationDue(entity, period), self = this;
    if (!due.length) throw new Refusal("state", "Nothing to depreciate for " + this.entity[entity].short + " in " + periodLabel(period) + ".");
    var byClass = {};
    due.forEach(function (d) {
      var k = d.asset.cls + "|" + d.asset.dept;
      byClass[k] = (byClass[k] || 0) + d.amount;
    });
    var lines = [], total = 0;
    Object.keys(byClass).sort().forEach(function (k) {
      var parts = k.split("|");
      lines.push({ account: "6700", dr: byClass[k], dims: { dept: parts[1] }, memo: self.accounts[parts[0]].name });
      total += byClass[k];
    });
    lines.push({ account: "1590", cr: total, memo: "Accumulated depreciation" });
    var j = this.post({ entity: entity, date: lastDay(period), memo: "Depreciation — " + periodLabel(period, true),
                        source: { type: "dep", id: entity + ":" + period, label: "Depreciation run" }, lines: lines,
                        createdBy: actor.id, createdAt: at });
    due.forEach(function (d) { d.asset.depThrough = period; });
    this.record("asset.depreciate", entity + ":" + period, "Ran depreciation for " + this.entity[entity].short + " · " + periodLabel(period) + " · " + due.length + " assets · " + this.fmt(total, this.entity[entity].currency) + " · " + j.id, {}, actor, at);
    return j;
  };

  P.bookIntercompany = function (entity, period, actor, at) {
    var e = this.entity[entity], self = this;
    var usRecv = this.linesWhere({ entity: "US", accounts: ["4900"], from: period, to: period })
      .filter(function (l) { return l.dims.counterparty === entity; })
      .reduce(function (s, l) { return s - l.amt; }, 0);
    var theirs = this.linesWhere({ entity: entity, accounts: ["6900"], from: period, to: period })
      .reduce(function (s, l) { return s + l.amt; }, 0);
    if (!usRecv) throw new Refusal("state", "OploCloud, Inc. has not billed " + e.short + " for " + periodLabel(period) + ".");
    if (theirs) throw new Refusal("state", e.short + " has already booked the " + periodLabel(period) + " recharge.");
    var local = this.fromUSD(usRecv, e.currency, this.rate(e.currency, period, "avg"));
    var j = this.post({
      entity: entity, date: this.asOf < lastDay(period) ? this.asOf : lastDay(period),
      memo: "Intercompany recharge from OploCloud, Inc. — " + periodLabel(period, true) + " (" + this.fmt(usRecv, "USD") + ")",
      source: { type: "ic", id: "IC-" + entity + "-" + period, label: "Intercompany" },
      lines: [{ account: "6900", dr: local, dims: { counterparty: "US", dept: "ENG" } },
              { account: "2150", cr: local, dims: { counterparty: "US" }, fx: { cur: "USD", amt: -usRecv } }],
      createdBy: actor.id, createdAt: at
    });
    this.record("ic.book", j.id, "Booked the " + periodLabel(period) + " intercompany recharge in " + e.short + " · " + this.fmt(local, e.currency) + " · " + j.id, {}, actor, at);
    return j;
  };

  P.raiseAnomalyResolved = function (ref, actor, at, how) {
    Object.values(this.anomalies).forEach(function (a) {
      if (a.status === "open" && (a.refs || []).indexOf(ref) >= 0) {
        a.status = "resolved"; a.resolvedBy = actor.id; a.resolvedAt = at; a.note = how;
      }
    });
  };

  /* What each automated close task does when it runs. Every one of them
     builds journals and posts them through post(), like anything else. */
  var CLOSE_RUNS = {
    depreciation: function (t, actor, at) {
      var self = this, js = [];
      this.entities.forEach(function (e) {
        if (t.entity !== "ALL" && t.entity !== e.id) return;
        if (self.depreciationDue(e.id, t.period).length) js.push(self.runDepreciation(e.id, t.period, actor, at).id);
      });
      return { journals: js };
    },
    revrec: function (t, actor, at) {
      var self = this, js = [];
      this.entities.forEach(function (e) {
        if (t.entity && t.entity !== "ALL" && t.entity !== e.id) return;
        var lines = [], total = 0, byProd = {};
        Object.values(self.contracts).forEach(function (c) {
          if (c.entity !== e.id || c.billing !== "annual") return;
          if (!self.serviceMonth(c, t.period)) return;
          byProd[c.product] = (byProd[c.product] || 0) + c.mrr;
        });
        Object.keys(byProd).sort().forEach(function (p) {
          lines.push({ account: "4100", cr: byProd[p], dims: { product: p } });
          total += byProd[p];
        });
        if (!total) return;
        lines.unshift({ account: "2200", dr: total, memo: "Deferred revenue released" });
        js.push(self.post({ entity: e.id, date: lastDay(t.period), memo: "Revenue recognition — " + periodLabel(t.period, true),
          source: { type: "revrec", id: e.id + ":" + t.period, label: "Revenue recognition" }, lines: lines, createdBy: actor.id, createdAt: at }).id);
      });
      return { journals: js };
    },
    usage: function (t, actor, at) {
      var self = this, js = [], n = 0;
      Object.values(this.customers).forEach(function (c) {
        if (!c.usage) return;
        var amt = self.meter(c, t.period);
        var inv = self.issueAR(c, lastDay(t.period), [{ account: "4200", amt: amt, product: c.usage, desc: self.dimName("product", c.usage) + " API usage — " + periodLabel(t.period) }], actor, at);
        js.push(inv.journal); n++;
      });
      return { journals: js, note: n + " usage invoices issued" };
    },
    cloudAccrual: function (t, actor, at) {
      var self = this, js = [];
      this.entities.forEach(function (e) {
        var lines = [], total = 0;
        Object.values(self.vendors).forEach(function (v) {
          if (v.entity !== e.id || !v.accrue) return;
          var est = self.estimateVendor(v, t.period);
          lines.push({ account: v.account, dr: est, dims: { dept: v.dept, vendor: v.id }, memo: v.name + " — " + periodLabel(t.period) + " usage (estimate)" });
          total += est;
        });
        if (!total) return;
        lines.push({ account: "2100", cr: total, memo: "Accrued cloud usage" });
        var j = self.post({ entity: e.id, date: lastDay(t.period), memo: "Accrual — cloud usage " + periodLabel(t.period, true),
          source: { type: "accrual", id: e.id + ":" + t.period + ":cloud", label: "Accrual" }, lines: lines, createdBy: actor.id, createdAt: at });
        js.push(j.id);
        js.push(self.reverseJournal(j, addMonths(t.period, 1) + "-01", "Auto-reversal of the " + periodLabel(t.period) + " cloud accrual", actor, at).id);
      });
      return { journals: js, note: "Auto-reverses on " + addMonths(t.period, 1) + "-01" };
    },
    payrollAccrual: function (t, actor, at) {
      var self = this, js = [];
      this.entities.forEach(function (e) {
        if (e.id !== "US") return;   // UK and Japan pay monthly, on the 25th
        var half = self.payrollHalf("US", t.period);
        var lines = [], total = 0;
        Object.keys(half).forEach(function (d) {
          lines.push({ account: "6000", dr: half[d].sal, dims: { dept: d } });
          lines.push({ account: "6050", dr: half[d].tax, dims: { dept: d } });
          total += half[d].sal + half[d].tax;
        });
        lines.push({ account: "2400", cr: total, memo: "Accrued payroll, 16–30 " + MONTHS[+t.period.slice(5) - 1] });
        var j = self.post({ entity: "US", date: lastDay(t.period), memo: "Accrual — payroll 16–" + lastDay(t.period).slice(8) + " " + periodLabel(t.period),
          source: { type: "accrual", id: "US:" + t.period + ":payroll", label: "Accrual" }, lines: lines, createdBy: actor.id, createdAt: at });
        js.push(j.id);
      });
      return { journals: js };
    },
    prepaid: function (t, actor, at) {
      var self = this, js = [];
      (this.prepaids || []).forEach(function (pp) {
        var j = self.post({ entity: pp.entity, date: lastDay(t.period), memo: "Amortization — " + pp.name + " " + periodLabel(t.period),
          source: { type: "amort", id: pp.id + ":" + t.period, label: "Prepaid amortization" },
          lines: [{ account: pp.account, dr: pp.monthly, dims: { dept: pp.dept } }, { account: "1200", cr: pp.monthly }],
          createdBy: actor.id, createdAt: at });
        js.push(j.id);
      });
      return { journals: js };
    },
    intercompany: function (t, actor, at) {
      var self = this, js = [];
      this.entities.forEach(function (e) {
        if (e.id === "US") return;
        try { js.push(self.bookIntercompany(e.id, t.period, actor, at).id); } catch (err) { if (!(err instanceof Refusal)) throw err; }
      });
      return { journals: js };
    },
    fxreval: function (t, actor, at) {
      var self = this, js = [];
      this.entities.forEach(function (e) {
        if (e.id === "US") return;
        var j = self.revalueIC(e.id, t.period, actor, at);
        if (j) js.push(j.id);
      });
      return { journals: js };
    },
    treasury: function (t, actor, at) {
      var js = this.monthEndTreasury(t.period, actor, at);
      return { journals: js };
    },
    tax: function (t, actor, at) {
      var self = this, js = [];
      this.entities.forEach(function (e) {
        var j = self.taxProvision(e.id, t.period, actor, at);
        if (j) js.push(j.id);
      });
      return { journals: js };
    }
  };
  P.closeRuns = CLOSE_RUNS;

  P.dimName = function (kind, id) {
    var d = (this.dims[kind] || []).filter(function (x) { return x.id === id; })[0];
    return d ? d.name : id;
  };

  /* Revalues a subsidiary's USD intercompany payable to the month-end rate.
     The target is the subsidiary's own USD balance — what its lines say it
     owes in dollars — not the parent's figure, so an unbooked recharge stays
     a reconciling difference rather than being swallowed as FX. */
  P.revalueIC = function (entity, period, actor, at) {
    var e = this.entity[entity];
    var usd = this.icUSDOwn(entity, period);
    if (!usd) return null;
    var target = this.fromUSD(usd, e.currency, this.rate(e.currency, period, "close"));
    var cur = this.balance(entity, "2150", period);
    var adj = target - cur;   // the debit-positive change 2150 needs
    if (!adj) return null;
    var lines = adj > 0
      ? [{ account: "2150", dr: adj, dims: { counterparty: "US" } }, { account: "7200", cr: adj }]
      : [{ account: "7200", dr: -adj }, { account: "2150", cr: -adj, dims: { counterparty: "US" } }];
    return this.post({ entity: entity, date: lastDay(period), memo: "FX revaluation — USD intercompany payable at " + this.rate(e.currency, period, "close") + " USD/" + e.currency,
      source: { type: "fx", id: entity + ":" + period, label: "FX revaluation" }, lines: lines, createdBy: actor.id, createdAt: at }, { system: actor.role === "system" });
  };
  /* A subsidiary's intercompany balance in the currency it is denominated in
     (USD), debit positive, from the dollar amounts its own lines carry. */
  P.icUSDOwn = function (entity, period) {
    var s = 0;
    for (var i = 0; i < this.lines.length; i++) {
      var l = this.lines[i];
      if (l.entity === entity && l.account === "2150" && l.period <= period && l.fx) s += l.fx.amt;
    }
    return s;
  };

  /* ================================================== Work & attention */

  /* Everything that needs a person, for one role, most urgent first. */
  P.attention = function (role) {
    var self = this, items = [];
    function add(x) { items.push(x); }
    var cp = this.currentPeriod();

    Object.values(this.vendors).forEach(function (v) {
      if (!v.bankPending) return;
      var held = Object.values(self.apInvoices).filter(function (i) { return i.vendor === v.id && ["review", "approved", "scheduled", "hold"].includes(i.status); });
      var amt = held.reduce(function (s, i) { return s + self.usdOf(i.entity, i.amount, cp, "close"); }, 0);
      add({ id: "bank:" + v.id, sev: "critical", area: "Payables", roles: ["treasury", "cfo", "ap", "controller", "auditor"],
            title: "Bank details changed — " + v.name, detail: "Requested " + shortDate(v.bankPending.requestedAt) + " by " + v.bankPending.via + ". " + self.fmt(amt, "USD", { dp: 0 }) + " of payments held until verified.",
            action: { label: "Verify", perm: "vendor.verify", go: "/payables?vendor=" + v.id }, amount: amt, ref: { type: "vendor", id: v.id } });
    });
    Object.values(this.apInvoices).forEach(function (inv) {
      (inv.flags || []).forEach(function (f) {
        if (f.resolved || f.code === "bank" || f.code === "budget" || inv.status === "rejected") return;
        add({ id: "flag:" + inv.id + ":" + f.code, sev: f.sev || "serious", area: "Payables", roles: ["ap", "controller", "cfo", "auditor"],
              title: f.title + " — " + self.vendors[inv.vendor].name, detail: f.detail, amount: self.usdOf(inv.entity, inv.amount, cp, "close"),
              action: { label: "Review", perm: "ap.hold", go: "/payables/" + inv.id }, ref: { type: "ap", id: inv.id } });
      });
    });
    var waiting = Object.values(this.apInvoices).filter(function (i) { return i.status === "review"; });
    var big = waiting.filter(function (i) { return self.usdOf(i.entity, i.amount, cp, "close") > LIMITS.ap.controller * 100; });
    if (waiting.length) {
      var sum = waiting.reduce(function (s, i) { return s + self.usdOf(i.entity, i.amount, cp, "close"); }, 0);
      add({ id: "ap:approve", sev: "attention", area: "Payables", roles: ["controller", "cfo"],
            title: waiting.length + " vendor invoices waiting for approval", detail: self.fmt(sum, "USD") + " in total" + (big.length ? " · " + big.length + " above the controller limit" : ""),
            action: { label: "Approve", perm: "ap.approve", go: "/payables?status=review" }, amount: sum });
    }
    Object.values(this.exceptions).forEach(function (x) {
      if (x.status !== "open") return;
      add({ id: "bx:" + x.id, sev: "serious", area: "Budgets", roles: ["cfo", "controller"], title: x.title, detail: x.detail,
            action: { label: "Decide", perm: "budget.approve", go: "/budgets?dept=" + x.dept }, amount: x.amount });
    });
    var pend = Object.values(this.journals).filter(function (j) { return j.status === "pending"; });
    if (pend.length) add({ id: "je:pending", sev: "attention", area: "Journals", roles: ["controller", "cfo"],
      title: pend.length + " journal" + (pend.length > 1 ? "s" : "") + " waiting for approval", detail: pend.map(function (j) { return j.id; }).slice(0, 3).join(", "),
      action: { label: "Review", perm: "journal.approve", go: "/journals?status=pending" } });
    Object.values(this.bankAccounts).forEach(function (b) {
      var n = Object.values(self.bankLines).filter(function (l) { return l.bank === b.id && l.status === "unmatched"; }).length;
      if (!n) return;
      add({ id: "rec:" + b.id, sev: n > 10 ? "attention" : "info", area: "Cash", roles: ["treasury", "controller"],
            title: n + " unreconciled bank line" + (n > 1 ? "s" : "") + " — " + b.bankName + " " + b.name, detail: self.entity[b.entity].short + " · " + b.mask,
            action: { label: "Reconcile", perm: "bank.match", go: "/cash/" + b.id } });
    });
    this.intercompany(cp).forEach(function (ic) {
      if (Math.abs(ic.difference) < 100 * 100) return;
      add({ id: "ic:" + ic.entity, sev: "serious", area: "Intercompany", roles: ["controller", "cfo"],
            title: "Intercompany out of balance — US ↔ " + ic.entity, detail: "US shows " + self.fmt(ic.receivable, "USD") + " due; " + self.entity[ic.entity].short + " shows " + self.fmt(ic.payable, "USD") + ".",
            action: { label: "Reconcile", perm: "journal.create", go: "/consolidation" }, amount: Math.abs(ic.difference) });
    });
    var ag = this.aging("ar", "GROUP");
    var late = ag.buckets[3].amount + ag.buckets[4].amount;
    if (late) add({ id: "ar:late", sev: "attention", area: "Receivables", roles: ["cfo", "controller", "treasury"],
      title: ag.buckets[4].count + ag.buckets[3].count + " customer invoices over 60 days late", detail: self.fmt(late, "USD") + " outstanding",
      action: { label: "Collect", perm: "ar.collect", go: "/receivables?aging=61" }, amount: late });
    Object.values(this.anomalies).forEach(function (a) {
      if (a.status !== "open") return;
      // A bank-detail change already leads the list as its own item.
      if (a.kind === "bank-change" && (a.refs || []).some(function (r) { return self.vendors[r] && self.vendors[r].bankPending; })) return;
      add({ id: "an:" + a.id, sev: a.sev, area: "Controls", roles: ["auditor", "controller", "cfo"], title: a.title, detail: a.detail,
            action: { label: "Investigate", perm: "anomaly.resolve", go: "/audit?anomaly=" + a.id }, amount: a.amount, rule: a.rule });
    });
    var sched = Object.values(this.apInvoices).filter(function (i) { return i.status === "scheduled"; });
    var appr = Object.values(this.apInvoices).filter(function (i) { return i.status === "approved"; });
    if (sched.length || appr.length) {
      var run = this.nextPaymentRun();
      var ssum = sched.reduce(function (s, i) { return s + self.usdOf(i.entity, i.amount, cp, "close"); }, 0);
      add({ id: "ap:run", sev: "attention", area: "Payables", roles: ["treasury"], title: "Payment run " + run + " · " + sched.length + " scheduled",
            detail: self.fmt(ssum, "USD") + " scheduled · " + appr.length + " approved and not yet scheduled", action: { label: "Open run", perm: "ap.pay", go: "/payables?status=scheduled" }, amount: ssum });
    }
    var todo = Object.values(this.closeTasks).filter(function (t) { return t.period === cp && t.status !== "done"; });
    if (todo.length) add({ id: "close", sev: "info", area: "Close", roles: ["controller", "cfo"],
      title: periodLabel(cp, true) + " close — " + todo.length + " tasks open", detail: "Next: " + todo.sort(function (a, b) { return a.due < b.due ? -1 : 1; })[0].title,
      action: { label: "Open close", perm: "close.task", go: "/close" } });

    var rank = { critical: 0, serious: 1, attention: 2, info: 3 };
    return items.filter(function (x) { return !role || x.roles.indexOf(role) >= 0; })
      .sort(function (a, b) { return (rank[a.sev] - rank[b.sev]) || ((b.amount || 0) - (a.amount || 0)); });
  };

  /* ============================================================ Persist

     The sandbox is the deterministic seed plus the commands somebody ran on
     top of it. Only the commands are stored; loading replays them through
     exec(), which is the same path they took the first time. */
  P.replay = function (log) {
    var ok = 0, failed = [];
    for (var i = 0; i < log.length; i++) {
      var c = log[i];
      try {
        this.exec(c.type, c.payload, c.actor, { at: c.at, replay: true });
        this.log.push(c);
        ok++;
      } catch (e) {
        failed.push({ cmd: c, error: e.message || String(e) });
      }
    }
    return { ok: ok, failed: failed };
  };

  P.Refusal = Refusal;
  Engine.Refusal = Refusal;
  Engine.COA = COA;
  Engine.TXN = TXN;

  root.EFM = root.EFM || {};
  root.EFM.data = root.EFM.data || {};     // datasets loaded after sign-in (see app.js), never shipped with the app
  root.EFM.Engine = Engine;
  root.EFM.Refusal = Refusal;
  root.EFM.ENGINE_VERSION = ENGINE_VERSION;
  if (typeof module !== "undefined" && module.exports) module.exports = { Engine: Engine, Refusal: Refusal };
})(typeof window !== "undefined" ? window : globalThis);
