/* ==========================================================================
   /api/v1/efm/*

   The actual data behind OC EFM. The app is public code and generated sample
   books; what is real is held in the database and leaves only here, for an
   account that has been assigned OC EFM. There is no write route: a dataset
   is loaded by an administrator out of band, so a session cannot rewrite it.
   ========================================================================== */

import { json, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";
import { DATASETS, present } from "../services/efm.js";

/* GET /api/v1/efm/datasets/:name */
export async function dataset(ctx, { name }) {
  requireActor(ctx);
  await must(ctx, "efm.read");

  const which = check.oneOf(name, "dataset", DATASETS);
  const row = await ctx.repo.efmDataset(which);
  if (!row) throw ApiError.notFound("That dataset has not been loaded.");

  // Private and never stored: the same address serves different answers to
  // different people, and to the same person after their access changes.
  return json({ dataset: present(row) }, { headers: { "cache-control": "private, no-store" } });
}
