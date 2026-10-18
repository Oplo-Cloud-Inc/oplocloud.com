/* ==========================================================================
   Certificates and the public disclosure.

   A certificate's number is the school's, in a series per kind of certificate,
   per school year, never repeated and never skipped. What a school says about
   itself in public is what it typed (cleanDisclosure); everything else on the
   page is counted from what OEdu already holds.

   Pure: no database, no clock. api/scripts/test-certificates.mjs checks it.
   ========================================================================== */

export const SERIES = { "Transfer certificate": "TC", "Bonafide certificate": "BF", "Character certificate": "CH", "Migration certificate": "MG" };
export const TC = "Transfer certificate";

/* 2026-2027 -> 2026-27 */
export const yearShort = (y) => { const m = /^(\d{4})-(\d{4})$/.exec(String(y || "")); return m ? `${m[1]}-${m[2].slice(2)}` : String(y || ""); };

/* SFHS/TC/2026-27/0007 */
export function numberText(prefix, series, year, n) { return `${prefix}/${series}/${yearShort(year)}/${String(n).padStart(4, "0")}`; }
export const prefixOf = (slug) => String(slug || "SCHOOL").replace(/[^A-Za-z0-9]+/g, "").toUpperCase().slice(0, 12) || "SCHOOL";

const text = (v, max) => (v === undefined || v === null ? null : String(v).trim().slice(0, max) || null);

/* What the school says about itself, checked. `fail(message, field)` throws. */
export function cleanDisclosure(src, fail) {
  const g = (src && src.general) || {};
  const out = {
    general: {
      affiliationNo: text(g.affiliationNo, 40), schoolCode: text(g.schoolCode, 40), address: text(g.address, 300), phone: text(g.phone, 40),
      email: text(g.email, 120), website: text(g.website, 200), principal: text(g.principal, 120), principalQualification: text(g.principalQualification, 160),
      established: text(g.established, 20), affiliatedTo: text(g.affiliatedTo, 80)
    },
    facts: [],
    publishTc: !!(src && src.publishTc === true)
  };
  if (out.general.email && !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(out.general.email)) fail("That is not an email address.", "email");
  if (out.general.website && !/^https?:\/\//i.test(out.general.website)) fail("A website begins with http:// or https://.", "website");
  const facts = Array.isArray(src && src.facts) ? src.facts : [];
  if (facts.length > 60) fail("List at most 60 facts.", "facts");
  for (const f of facts) {
    const label = text(f && f.label, 120), value = text(f && f.value, 300);
    if (!label) continue;
    out.facts.push({ label, value: value || "" });
  }
  return out;
}

export function disclosureOf(json) {
  let d;
  try { d = JSON.parse(json || "null"); } catch { d = null; }
  return cleanDisclosure(d || {}, () => {});
}

/* Enrolment as a table a public page can show: sections and children per class. */
export function enrolmentTable(rows) {
  return rows.map((r) => ({ class: r.grade, sections: r.sections, students: r.students }));
}
