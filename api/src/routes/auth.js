/* ==========================================================================
   /api/v1/auth/*  and  /api/v1/me

   The session is established here and nowhere else.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { sessionCookie, clearCookie } from "../lib/cookies.js";
import { signIn, signOut, requireActor, rateLimit, rateLimitClear,
         SESSION_LIFETIME } from "../core/auth.js";
import { hashPassword, verifyPassword } from "../lib/crypto.js";

/* The account as the client is allowed to see it. Password material and
   internal columns never appear — a serialiser that starts from the row and
   deletes fields will one day forget one, so this one starts from nothing and
   adds. */
export function publicAccount(actor) {
  return {
    id: actor.id,
    email: actor.email,
    name: actor.name,
    firstName: actor.firstName,
    initials: actor.initials,
    hue: actor.hue,
    title: actor.title,
    emailVerified: actor.emailVerified,
    roles: (actor.roles || []).map((r) => ({
      product: r.product, role: r.role, orgId: r.org_id
    })),
    organizations: (actor.orgs || []).map((o) => ({
      id: o.org_id, slug: o.slug, name: o.name, role: o.role
    }))
  };
}

export async function login(ctx) {
  const body = await readJson(ctx.request);
  const email = check.email(body.email);
  const password = check.string(body.password, "password", { max: 512, trim: false });

  // Limited per address and per client, so neither a targeted attack nor a
  // spray across many accounts is cheap.
  const ip = ctx.request.headers.get("cf-connecting-ip") || "unknown";
  rateLimit(`pw:${email.toLowerCase()}`);
  rateLimit(`ip:${ip}`);

  const { token, expiresAt, account } = await signIn(ctx, {
    email, password,
    userAgent: ctx.request.headers.get("user-agent")
  });
  rateLimitClear(`pw:${email.toLowerCase()}`);

  const [roles, orgs] = await Promise.all([
    ctx.repo.rolesFor(account.id),
    ctx.repo.membershipsFor(account.id)
  ]);

  return json(
    { account: publicAccount({
        id: account.id, email: account.email, name: account.name,
        firstName: account.first_name, initials: account.initials,
        hue: account.avatar_hue, title: account.title,
        emailVerified: !!account.email_verified, roles, orgs
      }) },
    { headers: { "set-cookie": sessionCookie(token, { maxAge: SESSION_LIFETIME, env: ctx.env }) } }
  );
}

export async function logout(ctx) {
  await signOut(ctx);
  return json({ ok: true },
    { headers: { "set-cookie": clearCookie(ctx.env) } });
}

export async function me(ctx) {
  const actor = requireActor(ctx);
  return json({ account: publicAccount(actor) });
}

export async function changePassword(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const current = check.string(body.currentPassword, "currentPassword",
    { max: 512, trim: false });
  const next = check.password(body.newPassword, "newPassword");

  const account = await ctx.repo.findAccountById(actor.id);
  const { ok } = await verifyPassword(current, account);
  if (!ok) throw ApiError.badRequest("That is not your current password.", "currentPassword");

  await ctx.repo.updatePassword(actor.id, await hashPassword(next));
  // Every other session dies. A password change that leaves an attacker's
  // session alive has not achieved anything.
  await ctx.repo.revokeAllSessions(actor.id);
  const { token } = await (await import("../core/auth.js"))
    .issueSession(ctx, account, ctx.request.headers.get("user-agent"));

  return json({ ok: true },
    { headers: { "set-cookie": sessionCookie(token, { maxAge: SESSION_LIFETIME, env: ctx.env }) } });
}
