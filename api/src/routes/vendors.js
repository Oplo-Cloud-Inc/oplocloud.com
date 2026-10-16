/* ==========================================================================
   /api/v1/facilities/vendors and /documents — the outside people, and papers

   A vendor is a contact until the school says which papers it must hold: an
   insurance certificate, a licence. From then on the vendor is only as
   current as the newest paper on file for each, and the page says which are
   missing or have run out. Nothing is blocked automatically — a school may
   have a good reason to use a contractor whose certificate lapsed last week —
   but it is never a surprise.

   A document is a paper with a date it runs out. It belongs to a room, an
   asset, a vendor, an order, or the school itself (a fire certificate). A
   file is kept in the database under the same limit enrollment scans have;
   anything larger goes in as a link.

   No quote, invoice or purchase order lives here: OEdu does not do finance.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";
import * as F from "../services/facilities.js";
import { orgOf, text, day, todayOf, parseJson, note, readUpload } from "./facility-common.js";

const URL_OK = /^https:\/\/[^\s]+$/i;

function docShape(d, today, names) {
  return {
    id: d.id, ownerKind: d.owner_kind, ownerId: d.owner_id || null, ownerName: names ? names(d.owner_kind, d.owner_id) : null,
    kind: d.kind, title: d.title, issuedOn: d.issued_on || null, expiresOn: d.expires_on || null,
    state: F.expiryState(d.expires_on, today), url: d.url || null, note: d.note || null,
    file: d.file_id ? { id: d.file_id, name: d.file_name, type: d.file_type, size: d.file_size } : null,
    archived: !!d.archived_at, createdAt: d.created_at
  };
}

function vendorShape(v, docs, today) {
  const requires = parseJson(v.requires_json, []);
  return {
    id: v.id, name: v.name, trade: v.trade || null, contactName: v.contact_name || null, phone: v.phone || null,
    email: v.email || null, notes: v.notes || null, contractEndsOn: v.contract_ends_on || null,
    contract: F.expiryState(v.contract_ends_on, today), requires, active: !!v.active, openOrders: v.open_count || 0,
    standing: F.vendorStanding(requires, docs, today)
  };
}

function requiresOf(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > 20) throw ApiError.badRequest("Required papers are a short list of names.", "requires");
  const out = [...new Set(raw.map((x) => String(x || "").trim()).filter(Boolean))];
  if (out.some((x) => x.length > 80)) throw ApiError.badRequest("A paper's name is at most 80 characters.", "requires");
  return out;
}

/* ---------------------------------------------------------------- Vendors */

/* GET /api/v1/facilities/vendors */
export async function listVendors(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.read", { orgId });
  const today = todayOf(ctx);
  const [vs, docs] = await Promise.all([ctx.repo.listVendors(orgId), ctx.repo.listFacilityDocuments({ orgId, ownerKind: "vendor" })]);
  return json({ vendors: vs.map((v) => vendorShape(v, docs.filter((d) => d.owner_id === v.id), today)), today });
}

/* GET /api/v1/facilities/vendors/:vendorId */
export async function getVendor(ctx, { vendorId }) {
  requireActor(ctx);
  const v = await ctx.repo.findVendor(vendorId);
  if (!v) throw ApiError.notFound("No such vendor.");
  await must(ctx, "facility.read", { orgId: v.org_id });
  const today = todayOf(ctx);
  const [docs, orders, events] = await Promise.all([
    ctx.repo.listFacilityDocuments({ orgId: v.org_id, ownerKind: "vendor", ownerId: vendorId }),
    ctx.repo.listOrders({ orgId: v.org_id, vendorId, limit: 40 }),
    ctx.repo.listFacilityEvents("vendor", vendorId)
  ]);
  return json({
    vendor: vendorShape(v, docs, today), documents: docs.map((d) => docShape(d, today)),
    orders: orders.map((o) => ({ id: o.id, number: o.seq, title: o.title, status: o.status, dueOn: o.due_on, spaceName: o.space_name })),
    events: events.map((e) => ({ id: e.id, at: e.at, byName: e.actor_name, kind: e.kind, note: e.note }))
  });
}

/* POST /api/v1/facilities/vendors */
export async function createVendor(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.manage", { orgId });
  const body = await readJson(ctx.request);
  const v = await ctx.repo.createVendor({
    orgId, name: text(body.name, "name", 160, true), trade: text(body.trade, "trade", 80), contactName: text(body.contactName, "contactName", 120),
    phone: text(body.phone, "phone", 40), email: text(body.email, "email", 200), notes: text(body.notes, "notes", 1000),
    contractEndsOn: day(body.contractEndsOn, "contractEndsOn"), requires: requiresOf(body.requires)
  });
  await note(ctx, orgId, "vendor", v.id)("created", v.name);
  return json({ vendor: vendorShape(v, [], todayOf(ctx, body.today)) }, { status: 201 });
}

/* PATCH /api/v1/facilities/vendors/:vendorId */
export async function updateVendor(ctx, { vendorId }) {
  const actor = requireActor(ctx);
  const v0 = await ctx.repo.findVendor(vendorId);
  if (!v0) throw ApiError.notFound("No such vendor.");
  await must(ctx, "facility.manage", { orgId: v0.org_id });
  const body = await readJson(ctx.request);
  const patch = {};
  const set = (k, v) => { if (v !== undefined) patch[k] = v; };
  if (body.name !== undefined) set("name", text(body.name, "name", 160, true));
  if (body.trade !== undefined) set("trade", text(body.trade, "trade", 80));
  if (body.contactName !== undefined) set("contactName", text(body.contactName, "contactName", 120));
  if (body.phone !== undefined) set("phone", text(body.phone, "phone", 40));
  if (body.email !== undefined) set("email", text(body.email, "email", 200));
  if (body.notes !== undefined) set("notes", text(body.notes, "notes", 1000));
  if (body.contractEndsOn !== undefined) set("contractEndsOn", day(body.contractEndsOn, "contractEndsOn"));
  if (body.requires !== undefined) set("requires", requiresOf(body.requires));
  if (body.active !== undefined) set("active", body.active === true);
  if (!Object.keys(patch).length) return json({ vendor: vendorShape(v0, [], todayOf(ctx)) });
  const u = await ctx.repo.updateVendor(vendorId, patch);
  await note(ctx, v0.org_id, "vendor", vendorId)("updated", Object.keys(patch).join(", "));
  const docs = await ctx.repo.listFacilityDocuments({ orgId: v0.org_id, ownerKind: "vendor", ownerId: vendorId });
  return json({ vendor: vendorShape(u, docs, todayOf(ctx, body.today)) });
}

/* ------------------------------------------------------------- Documents */

async function ownerNames(ctx, orgId) {
  const [spaces, assets, vendors] = await Promise.all([ctx.repo.listSpaces(orgId), ctx.repo.listAssets({ orgId }), ctx.repo.listVendors(orgId)]);
  const map = { space: new Map(spaces.map((x) => [x.id, x.name])), asset: new Map(assets.map((x) => [x.id, x.name])),
                vendor: new Map(vendors.map((x) => [x.id, x.name])) };
  return (kind, id) => (kind === "school" ? "The school" : (map[kind] && map[kind].get(id)) || null);
}

async function ownerMustExist(ctx, orgId, kind, ownerId) {
  if (kind === "school") return null;
  if (!ownerId) throw ApiError.badRequest("Say what this paper belongs to.", "ownerId");
  const row = kind === "space" ? await ctx.repo.findSpace(ownerId) : kind === "asset" ? await ctx.repo.findAsset(ownerId)
            : kind === "vendor" ? await ctx.repo.findVendor(ownerId) : await ctx.repo.findOrder(ownerId);
  if (!row || row.org_id !== orgId) throw ApiError.notFound("That does not exist.");
  return ownerId;
}

/* GET /api/v1/facilities/documents?ownerKind&ownerId&state=expiring|expired|all&archived=1 */
export async function listDocuments(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.read", { orgId });
  const q = ctx.url.searchParams;
  const today = todayOf(ctx);
  const rows = await ctx.repo.listFacilityDocuments({
    orgId, ownerKind: F.DOC_OWNERS.includes(q.get("ownerKind")) ? q.get("ownerKind") : null,
    ownerId: q.get("ownerId") || null, includeArchived: q.get("archived") === "1"
  });
  const names = await ownerNames(ctx, orgId);
  let out = rows.map((d) => docShape(d, today, names));
  const state = q.get("state");
  if (state === "expiring") out = out.filter((d) => d.state === "soon" || d.state === "expired");
  else if (state === "expired") out = out.filter((d) => d.state === "expired");
  const order = { expired: 0, soon: 1, ok: 2, none: 3 };
  out.sort((a, b) => order[a.state] - order[b.state] || String(a.expiresOn || "").localeCompare(String(b.expiresOn || "")));
  return json({ documents: out, today });
}

/* POST /api/v1/facilities/documents { ownerKind, ownerId, kind, title, issuedOn, expiresOn, url, note } */
export async function createDocument(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.work", { orgId });
  const body = await readJson(ctx.request);
  const ownerKind = check.oneOf(body.ownerKind || "school", "ownerKind", F.DOC_OWNERS);
  const url = text(body.url, "url", 500);
  if (url && !URL_OK.test(url)) throw ApiError.badRequest("A link has to start with https://.", "url");
  const issuedOn = day(body.issuedOn, "issuedOn"), expiresOn = day(body.expiresOn, "expiresOn");
  if (issuedOn && expiresOn && expiresOn < issuedOn) throw ApiError.badRequest("It cannot expire before it was issued.", "expiresOn");
  const d = await ctx.repo.createFacilityDocument({
    orgId, ownerKind, ownerId: await ownerMustExist(ctx, orgId, ownerKind, body.ownerId), kind: text(body.kind, "kind", 80, true),
    title: text(body.title, "title", 160, true), issuedOn, expiresOn, url, note: text(body.note, "note", 500), createdBy: actor.id
  });
  await note(ctx, orgId, "document", d.id)("created", `${d.kind}: ${d.title}`);
  return json({ document: docShape(d, todayOf(ctx, body.today), await ownerNames(ctx, orgId)) }, { status: 201 });
}

/* PATCH /api/v1/facilities/documents/:documentId — renew it: a new date, a new link; or archive it. */
export async function updateDocument(ctx, { documentId }) {
  const actor = requireActor(ctx);
  const d0 = await ctx.repo.findFacilityDocument(documentId);
  if (!d0) throw ApiError.notFound("No such document.");
  await must(ctx, "facility.work", { orgId: d0.org_id });
  const body = await readJson(ctx.request);
  const patch = {};
  if (body.kind !== undefined) patch.kind = text(body.kind, "kind", 80, true);
  if (body.title !== undefined) patch.title = text(body.title, "title", 160, true);
  if (body.issuedOn !== undefined) patch.issuedOn = day(body.issuedOn, "issuedOn");
  if (body.expiresOn !== undefined) patch.expiresOn = day(body.expiresOn, "expiresOn");
  if (body.url !== undefined) {
    const url = text(body.url, "url", 500);
    if (url && !URL_OK.test(url)) throw ApiError.badRequest("A link has to start with https://.", "url");
    patch.url = url;
  }
  if (body.note !== undefined) patch.note = text(body.note, "note", 500);
  if (body.archived !== undefined) patch.archivedAt = body.archived === true ? Date.now() : null;
  if (!Object.keys(patch).length) return json({ document: docShape(d0, todayOf(ctx), await ownerNames(ctx, d0.org_id)) });
  const u = await ctx.repo.updateFacilityDocument(documentId, patch);
  await note(ctx, d0.org_id, "document", documentId)(patch.archivedAt ? "archived" : "updated", Object.keys(patch).join(", "));
  return json({ document: docShape(u, todayOf(ctx, body.today), await ownerNames(ctx, d0.org_id)) });
}

/* POST /api/v1/facilities/documents/:documentId/file { name, type, data } — replaces any earlier file. */
export async function putDocumentFile(ctx, { documentId }) {
  const actor = requireActor(ctx);
  const d = await ctx.repo.findFacilityDocument(documentId);
  if (!d) throw ApiError.notFound("No such document.");
  await must(ctx, "facility.work", { orgId: d.org_id });
  const body = await readJson(ctx.request, { limit: 1200 * 1024 });
  const f = readUpload(body);
  const fid = await ctx.repo.putFacilityFile({ orgId: d.org_id, ownerKind: "document", ownerId: documentId, ...f, actorId: actor.id });
  const u = await ctx.repo.updateFacilityDocument(documentId, { fileId: fid });
  if (d.file_id) await ctx.repo.deleteFacilityFile(d.file_id);
  await note(ctx, d.org_id, "document", documentId)("file", f.name);
  return json({ document: docShape(u, todayOf(ctx), await ownerNames(ctx, d.org_id)) }, { status: 201 });
}

/* GET /api/v1/facilities/documents/:documentId/file */
export async function getDocumentFile(ctx, { documentId }) {
  requireActor(ctx);
  const d = await ctx.repo.findFacilityDocument(documentId);
  if (!d || !d.file_id) throw ApiError.notFound("There is no file for that document.");
  await must(ctx, "facility.read", { orgId: d.org_id });
  const f = await ctx.repo.getFacilityFile(d.file_id);
  if (!f) throw ApiError.notFound("There is no file for that document.");
  return json({ file: { id: f.id, name: f.name, type: f.type, size: f.size, data: f.data, uploadedAt: f.uploaded_at } });
}
