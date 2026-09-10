/* ==========================================================================
   /api/v1/accounts/*

   Creating people, editing profiles, granting roles. Every one of these is an
   administrative act and every one goes through `must`.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must, can } from "../core/guard.js";
import { hashPassword } from "../lib/crypto.js";
import { publicAccount } from "./auth.js";

const PRODUCTS = ["learn", "maps", "shopping", "roxan", "platform"];
const ROLES = ["student", "teacher", "author", "admin", "user", "seller"];

function shape(row) {
  return {
    id: row.id, email: row.email, name: row.name,
    firstName: row.first_name, initials: row.initials,
    hue: row.avatar_hue, title: row.title, status: row.status
  };
}

export async function list(ctx) {
  const actor = requireActor(ctx);
  const orgId = ctx.url.searchParams.get("orgId") ||
    (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
  await must(ctx, "account.read", { orgId, accountId: null });

  const rows = await ctx.repo.listAccounts({ orgId });
  // Filtered again per row. A list endpoint that authorizes the query but not
  // the results is how a roster leaks.
  const visible = [];
  for (const row of rows) {
    if (await can(ctx, "account.read", { accountId: row.id, orgId })) visible.push(shape(row));
  }
  return json({ accounts: visible });
}

export async function get(ctx, { accountId }) {
  requireActor(ctx);
  await must(ctx, "account.read", { accountId });
  const row = await ctx.repo.findAccountById(accountId);
  if (!row) throw ApiError.notFound("No such account.");
  const roles = await ctx.repo.rolesFor(accountId);
  return json({ account: { ...shape(row),
    roles: roles.map((r) => ({ product: r.product, role: r.role, orgId: r.org_id })) } });
}

export async function create(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const orgId = body.orgId || (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
  await must(ctx, "account.create", { orgId });

  const email = check.email(body.email);
  const name = check.string(body.name, "name", { max: 120 });
  const password = check.password(body.password);
  const role = check.oneOf(body.role || "student", "role", ROLES);

  if (await ctx.repo.findAccountByEmail(email)) {
    throw ApiError.conflict("An account already uses that email address.", "email");
  }

  const pw = await hashPassword(password);
  const first = name.split(/\s+/)[0];
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const account = await ctx.repo.createAccount({
    email, hash: pw.hash, salt: pw.salt, iterations: pw.iterations,
    name, firstName: first, initials,
    hue: body.hue || "#0071e3", title: body.title || null
  });

  await ctx.repo.grantRole(account.id, "learn", role, orgId);
  if (orgId) await ctx.repo.addMember(orgId, account.id, role === "admin" ? "admin" : "member");

  return json({ account: shape(account) }, { status: 201 });
}

export async function update(ctx, { accountId }) {
  requireActor(ctx);
  await must(ctx, "account.write", { accountId });
  const body = await readJson(ctx.request);

  const patch = {};
  if (body.name !== undefined) {
    patch.name = check.string(body.name, "name", { max: 120 });
    patch.firstName = patch.name.split(/\s+/)[0];
    patch.initials = patch.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }
  if (body.title !== undefined) patch.title = check.string(body.title, "title", { min: 0, max: 160 });
  if (body.hue !== undefined) patch.hue = check.string(body.hue, "hue", { max: 24 });

  const row = await ctx.repo.updateProfile(accountId, patch);
  return json({ account: shape(row) });
}

/* Roles are granted separately from account creation, because "who is this
   person" and "what may they do" are different decisions that a school makes
   at different times and often by different people. */
export async function grantRole(ctx, { accountId }) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const orgId = body.orgId || (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
  await must(ctx, "role.grant", { orgId });

  const product = check.oneOf(body.product || "learn", "product", PRODUCTS);
  const role = check.oneOf(body.role, "role", ROLES);

  // Only a platform admin can mint another platform admin. Otherwise a school
  // administrator could escalate themselves out of their own organization.
  if (product === "platform" && !(actor.roles || [])
      .some((r) => r.product === "platform" && r.role === "admin")) {
    throw ApiError.forbidden("Only a platform administrator can grant platform roles.");
  }

  if (body.revoke) await ctx.repo.revokeRole(accountId, product, role, orgId);
  else await ctx.repo.grantRole(accountId, product, role, orgId);

  const roles = await ctx.repo.rolesFor(accountId);
  return json({ roles: roles.map((r) => ({ product: r.product, role: r.role, orgId: r.org_id })) });
}
