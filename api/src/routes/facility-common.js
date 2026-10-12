/* ==========================================================================
   What every facilities route needs: reading a field the way the API reads
   fields, knowing the school's own day and clock, and holding the one limit
   on what a file may be.

   The school's day comes from the page (`today`, `nowAt`), not from the
   server: the server's clock is UTC, which is yesterday evening for a school
   in New York and tomorrow morning for one in Delhi. A wrong day here would
   mean an order "overdue" a day early, or a room that cannot be held for a
   period that is still ahead.
   ========================================================================== */

import { ApiError, check } from "../lib/http.js";
import * as F from "../services/facilities.js";

export const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);

export function text(v, field, max, req) {
  if (v == null || v === "") { if (req) throw ApiError.badRequest(`${field} is required.`, field); return null; }
  if (typeof v !== "string") throw ApiError.badRequest(`${field} must be text.`, field);
  const s = v.trim();
  if (!s) { if (req) throw ApiError.badRequest(`${field} is required.`, field); return null; }
  if (s.length > max) throw ApiError.badRequest(`${field} is longer than ${max} characters.`, field);
  return s;
}

export function day(v, field, req) {
  if (v == null || v === "") { if (req) throw ApiError.badRequest(`${field} is required.`, field); return null; }
  if (!F.isDate(String(v))) throw ApiError.badRequest(`${field} must be a date like 2026-09-29.`, field);
  return String(v);
}

export function time(v, field, req) {
  if (v == null || v === "") { if (req) throw ApiError.badRequest(`${field} is required.`, field); return null; }
  if (!F.isTime(String(v))) throw ApiError.badRequest(`${field} must be a time like 09:30.`, field);
  return String(v);
}

export function whole(v, field, { min = 0, max = 100000, req = false } = {}) {
  if (v == null || v === "") { if (req) throw ApiError.badRequest(`${field} is required.`, field); return null; }
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw ApiError.badRequest(`${field} must be a whole number from ${min} to ${max}.`, field);
  return n;
}

/* The school's day, as the page says it; the server's if the page did not. */
export function todayOf(ctx, supplied) {
  const q = supplied !== undefined ? supplied : ctx.url.searchParams.get("today");
  return F.isDate(String(q || "")) ? String(q) : new Date().toISOString().slice(0, 10);
}

/* The school's day and clock together: "2026-10-12T09:30". */
export function nowOf(ctx, supplied) {
  const q = String((supplied !== undefined ? supplied : ctx.url.searchParams.get("nowAt")) || "");
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(q);
  if (m && F.isDate(m[1]) && F.isTime(m[2])) return { day: m[1], time: m[2] };
  const iso = new Date().toISOString();
  return { day: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/* Whoever is given work must be able to do it. */
export async function mustBeTeam(ctx, orgId, accountId, field = "assigneeId") {
  if (!accountId) return;
  const team = await ctx.repo.listFacilityTeam(orgId);
  if (!team.some((m) => m.id === accountId)) {
    throw ApiError.badRequest("That person is not on the facilities team, so they cannot be given work.", field);
  }
}

export function refuse(message, extra) {
  const e = ApiError.conflict(message);
  e.extra = extra || {};
  return e;
}

export const parseJson = (s, fallback) => { try { return s ? JSON.parse(s) : fallback; } catch { return fallback; } };

export const note = (ctx, orgId, ownerKind, ownerId) => (kind, text2) =>
  ctx.repo.addFacilityEvent(orgId, ownerKind, ownerId, { actorId: ctx.actor.id, actorName: ctx.actor.name, kind, note: text2 || null });

/* ---- files: the same limit enrollment holds scans to */

export const FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
export const FILE_LIMIT = 700 * 1024;

/* A file sent as { name, type, data } with the bytes in base64. */
export function readUpload(body) {
  const name = check.string(body.name, "name", { max: 160 });
  const type = check.oneOf(String(body.type || "").toLowerCase(), "type", FILE_TYPES);
  const data = check.string(body.data, "data", { max: 1100 * 1024, trim: false });
  if (!/^[A-Za-z0-9+/]+=*$/.test(data)) throw ApiError.badRequest("The file was not sent as base64.", "data");
  const size = Math.floor(data.length * 3 / 4) - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
  if (size > FILE_LIMIT) {
    throw ApiError.badRequest(`That file is ${Math.round(size / 1024)} KB. The limit is ${FILE_LIMIT / 1024} KB — send a smaller photo, or add a link to it instead.`, "data");
  }
  return { name, type, data, size };
}
