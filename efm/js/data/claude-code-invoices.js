/* ==========================================================================
   OC EFM — actual data: OploCloud's Claude Code card charges.

   Anthropic's billing history for the OploCloud account, as it was pasted
   into the project on 2026-09-28: 67 invoices, newest first, each charged to
   the company card at the time of purchase. The billing page shows no
   invoice numbers, so a charge is identified by its date and the EFM
   reference the books give it (CHG-0001 is the oldest).

   To update: paste a fresh export over the rows below — [date, due date or
   null, total in US cents, "paid" | "refunded"] — keeping them newest first.
   The seed books each charge as a card expense on its date; a refunded
   charge is booked and reversed (the page doesn't show the refund's date, so
   it lands on the charge date).
   ========================================================================== */
(function (root) {
  "use strict";
  root.EFM = root.EFM || {};
  root.EFM.data = root.EFM.data || {};
  root.EFM.data.claudeCode = {
    vendor: { id: "anthropic", name: "Anthropic \u2014 Claude Code" },
    source: "Anthropic billing history, pasted 2026-09-28",
    invoices: [
    ["2026-09-28", null, 2178, "paid"],
    ["2026-09-28", null, 2178, "paid"],
    ["2026-09-28", null, 2178, "paid"],
    ["2026-09-28", null, 544, "paid"],
    ["2026-09-28", null, 2178, "paid"],
    ["2026-09-28", null, 2178, "paid"],
    ["2026-09-28", null, 2178, "paid"],
    ["2026-09-28", null, 2178, "paid"],
    ["2026-09-27", null, 2178, "paid"],
    ["2026-09-27", null, 2178, "paid"],
    ["2026-09-27", null, 2178, "paid"],
    ["2026-09-26", null, 2178, "paid"],
    ["2026-09-24", null, 2178, "paid"],
    ["2026-09-24", null, 2178, "paid"],
    ["2026-09-20", null, 4028, "paid"],
    ["2026-09-17", null, 2395, "paid"],
    ["2026-09-16", null, 2286, "paid"],
    ["2026-09-16", null, 1415, "paid"],
    ["2026-09-15", null, 2613, "paid"],
    ["2026-09-12", null, 1198, "paid"],
    ["2026-09-10", null, 2504, "paid"],
    ["2026-09-09", null, 2178, "paid"],
    ["2026-09-09", null, 1198, "paid"],
    ["2026-09-09", null, 2178, "paid"],
    ["2026-09-08", null, 2178, "paid"],
    ["2026-09-08", null, 1307, "paid"],
    ["2026-09-08", null, 1307, "paid"],
    ["2026-09-08", null, 2178, "paid"],
    ["2026-09-05", null, 1307, "paid"],
    ["2026-08-31", null, 1089, "paid"],
    ["2026-08-17", null, 1960, "paid"],
    ["2026-08-10", null, 2178, "paid"],
    ["2026-08-08", null, 2178, "paid"],
    ["2026-08-03", null, 2178, "refunded"],
    ["2026-07-12", null, 2178, "paid"],
    ["2026-07-10", null, 1960, "paid"],
    ["2026-07-09", null, 1415, "paid"],
    ["2026-07-07", null, 4997, "paid"],
    ["2026-07-05", null, 2178, "paid"],
    ["2026-07-03", null, 1524, "paid"],
    ["2026-07-03", null, 2178, "paid"],
    ["2026-06-23", null, 980, "paid"],
    ["2026-06-22", null, 1089, "paid"],
    ["2026-06-19", null, 2504, "paid"],
    ["2026-06-14", null, 2504, "paid"],
    ["2026-06-13", null, 1198, "paid"],
    ["2026-06-09", null, 1524, "paid"],
    ["2026-06-06", null, 2069, "paid"],
    ["2026-06-06", null, 1742, "paid"],
    ["2026-06-03", null, 2178, "paid"],
    ["2026-06-01", null, 1960, "paid"],
    ["2026-05-27", null, 1198, "paid"],
    ["2026-05-24", null, 1415, "paid"],
    ["2026-05-22", null, 1307, "paid"],
    ["2026-05-19", null, 2613, "paid"],
    ["2026-05-14", null, 1089, "paid"],
    ["2026-05-13", null, 1524, "paid"],
    ["2026-05-12", null, 2722, "paid"],
    ["2026-05-06", null, 2178, "paid"],
    ["2026-05-03", null, 2178, "paid"],
    ["2026-04-23", null, 2178, "refunded"],
    ["2026-04-19", null, 1089, "paid"],
    ["2026-04-14", null, 1524, "paid"],
    ["2026-04-04", null, 2069, "paid"],
    ["2026-03-23", null, 2178, "paid"],
    ["2026-01-01", "2026-01-15", 0, "paid"],
    ["2025-12-15", null, 544, "paid"]
    ]
  };
})(typeof window !== "undefined" ? window : globalThis);
