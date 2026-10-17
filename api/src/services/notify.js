/* ==========================================================================
   Telling somebody something.

   One function every route calls. A notice goes to each person's inbox unless
   they turned that kind off, and is queued as email for those who asked for it
   — the queue is flushed by a provider when the deployment has one
   (env.MAIL_ENDPOINT, env.MAIL_KEY), and is otherwise exactly what it says:
   mail waiting. Nothing here throws into the request that caused it: a school
   marking a register must not fail because an inbox could not be written.
   ========================================================================== */

export const NOTICE_KINDS = ["message", "announcement", "reminder", "alert", "report"];

/* to: account ids. Returns how many inboxes it reached. */
export async function notify(repo, o) {
  const to = Array.from(new Set((o.to || []).filter(Boolean)));
  let reached = 0;
  const thread = o.threadId || null;
  for (const accountId of to) {
    try {
      const prefs = await repo.noticePrefs(accountId);
      const pref = prefs.find((p) => p.kind === (o.kind || "message"));
      // A message from a person is always delivered; the rest honour what was chosen.
      const inApp = o.kind === "message" || !pref || pref.in_app;
      let nid = null;
      if (inApp) nid = await repo.insertNotice({ orgId: o.orgId, accountId, threadId: thread, kind: o.kind, fromId: o.from, title: o.title, body: o.body, link: o.link, dedupe: o.dedupe });
      if (inApp && nid) reached++;
      if (pref && pref.email && (nid || !inApp)) {
        const email = await repo.emailOf(accountId);
        if (email) await repo.queueEmail({ orgId: o.orgId, to: email, accountId, subject: o.title, body: o.body });
      }
    } catch { /* one person's inbox never stops another's */ }
  }
  return reached;
}

/* DEMO_ORGS (wrangler.toml, so a school's own administrator cannot change it): the schools that are made-up demos. No mail leaves one, and
   scripts/set-demo-passwords.sh will set a shared password only for one. */
export const isDemoOrg = (env, orgId) => !!orgId && String((env && env.DEMO_ORGS) || "").split(",").map((x) => x.trim()).includes(orgId);

/* Send what is queued through the deployment's mail endpoint, if it has one.
   ponytail: a generic JSON POST; swap for a provider's SDK when one is chosen. */
export async function flushOutbox(repo, env, orgId) {
  // A demo school's mail never leaves, whether or not a provider is connected: it is held as "suppressed" so the queue still tells the truth.
  if (isDemoOrg(env, orgId)) {
    const held = await repo.listOutbox(orgId, "queued");
    for (const m of held) await repo.markOutbox(m.id, "suppressed", "Demo school: mail is off.");
    return { sent: 0, suppressed: held.length, queued: 0, configured: !!(env.MAIL_ENDPOINT && env.MAIL_KEY), demo: true };
  }
  if (!env.MAIL_ENDPOINT || !env.MAIL_KEY) return { sent: 0, queued: (await repo.listOutbox(orgId, "queued")).length, configured: false };
  let sent = 0;
  for (const m of (await repo.listOutbox(orgId, "queued")).slice(0, 50)) {
    try {
      const r = await fetch(env.MAIL_ENDPOINT, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + env.MAIL_KEY },
        body: JSON.stringify({ to: m.to_email, subject: m.subject, text: m.body || "" }) });
      if (!r.ok) throw new Error("provider said " + r.status);
      await repo.markOutbox(m.id, "sent");
      sent++;
    } catch (e) { await repo.markOutbox(m.id, "failed", String(e.message || e).slice(0, 200)); }
  }
  return { sent, queued: (await repo.listOutbox(orgId, "queued")).length, configured: true };
}
