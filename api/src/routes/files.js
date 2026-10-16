/* /api/v1/files — a file attached to a record or to a person. Stored in the
   database with the same cap as the facilities files (ponytail: object
   storage when files outgrow 1.2 MB). Whoever may read the thing it is
   attached to may read the file; whoever may write it may add one. */
import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { readUpload } from "./facility-common.js";
import { KINDS } from "../services/items.js";
import { orgOf, isOffice, isSchoolStaff, guardsStudent } from "../services/who.js";

async function owner(ctx, actor, kind, ownerId, forWrite) {
  const org = orgOf(actor);
  if (kind === "account") {
    if (ownerId === actor.id || isOffice(actor, org)) return true;
    return !forWrite && (isSchoolStaff(actor, org) || await guardsStudent(ctx, actor, ownerId));
  }
  if (kind === "item") {
    const r = await ctx.repo.findItem(ownerId);
    if (!r || r.org_id !== org) throw ApiError.notFound("No such record.");
    const p = KINDS[r.kind].policy;
    const staff = isSchoolStaff(actor, org);
    if (forWrite) return p === "office" || p === "money" ? isOffice(actor, org) : p === "self" ? (r.subject_id === actor.id || isOffice(actor, org)) : staff;
    if (p === "org") return true;
    if (p === "office") return isOffice(actor, org);
    if (staff && p !== "self") return true;
    return isOffice(actor, org) || r.subject_id === actor.id || (!!r.subject_id && await guardsStudent(ctx, actor, r.subject_id));
  }
  throw ApiError.badRequest("ownerKind is item or account.", "ownerKind");
}

/* POST /files { ownerKind, ownerId, name, type, data } */
export async function put(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request, { limit: 1200 * 1024 });
  const kind = check.oneOf(body.ownerKind, "ownerKind", ["item", "account"]);
  const ownerId = check.string(body.ownerId, "ownerId", { max: 100 });
  if (!(await owner(ctx, actor, kind, ownerId, true))) throw ApiError.forbidden("You cannot attach a file here.");
  const f = readUpload(body);
  const fid = await ctx.repo.putFile({ orgId: orgOf(actor), ownerKind: kind, ownerId, ...f, actorId: actor.id });
  return json({ file: { id: fid, name: f.name, type: f.type, size: f.size } }, { status: 201 });
}

/* GET /files/:fileId */
export async function get(ctx, { fileId }) {
  const actor = requireActor(ctx);
  const f = await ctx.repo.getFile(fileId);
  if (!f || (f.org_id && f.org_id !== orgOf(actor))) throw ApiError.notFound("No such file.");
  if (!(await owner(ctx, actor, f.owner_kind, f.owner_id, false))) throw ApiError.forbidden("This file is not yours to read.");
  return json({ file: { id: f.id, name: f.name, type: f.type, size: f.size, data: f.data, uploadedAt: f.uploaded_at } });
}

/* DELETE /files/:fileId */
export async function remove(ctx, { fileId }) {
  const actor = requireActor(ctx);
  const f = await ctx.repo.getFile(fileId);
  if (!f || (f.org_id && f.org_id !== orgOf(actor))) throw ApiError.notFound("No such file.");
  if (f.uploaded_by !== actor.id && !(await owner(ctx, actor, f.owner_kind, f.owner_id, true))) throw ApiError.forbidden("You cannot remove this file.");
  await ctx.repo.deleteFile(fileId);
  return json({ ok: true });
}
