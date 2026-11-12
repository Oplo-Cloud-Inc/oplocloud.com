/* ==========================================================================
   Audit — one place a change is written down.

   record(ctx, orgId, actor, event) / recordMany(...) append to learn_audit
   (migration 0070). A route calls it after the change has been made, with the
   verb it would use in a sentence: "Ritika Sood exported the student list".

     event = { module, action, verb, recordKind?, recordId?, recordLabel?,
               field?, before?, after?, detail? }
     changes(before, after, labels) → one { field, before, after } per field that
       differs, for a record saved from a form
     rows(orgId, actor, events) → the rows an event list makes, not yet written

   A write that changes a record hands its rows to the repo method that makes
   the change, so the change and its audit rows are one batch: the record never
   changes without its row, and a row never describes a change that did not
   happen (E2). record/recordMany are for the events that change nothing
   (an export, a number shown) and are written before the data is given out.

   A change to several fields is one row per field sharing a `request`, so the
   log can say "Date of birth: 14/03/2011 → 15/03/2011" and not "something
   changed". Sensitive values (a phone, an Aadhaar number) are written masked:
   the log is for finding out who touched a record, not a second copy of it.
   Which fields are sensitive is decided in one place, services/india.js (E8).
   ========================================================================== */

import { id } from "../lib/crypto.js";
import { isSensitive, maskValue } from "./india.js";

export const show = (field, v) => (v == null || v === "" ? null : isSensitive(field) ? maskValue(v) : String(v).slice(0, 300));

export function changes(before, after, fields) {
  const out = [];
  for (const k of fields) {
    if (!(k in after)) continue;
    const a = before ? before[k] ?? null : null, b = after[k] ?? null;
    if (String(a ?? "") === String(b ?? "")) continue;
    out.push({ field: k, before: show(k, a), after: show(k, b) });
  }
  return out;
}

export function rows(orgId, actor, events) {
  if (!events.length) return [];
  const at = Date.now(), request = events.length > 1 ? id("req") : null;
  return events.map((e) => ({ ...e, orgId, at, actorId: actor.id, actorName: actor.name || actor.email || null, request }));
}

export async function recordMany(ctx, orgId, actor, events) {
  if (events.length) await ctx.repo.addAudit(rows(orgId, actor, events));
}

export const record = (ctx, orgId, actor, event) => recordMany(ctx, orgId, actor, [event]);
