/* ==========================================================================
   OC EFM's datasets.

   The names the API will serve, and the shape it hands the app. A dataset is
   loaded by an administrator as one JSON document; the only thing checked on
   the way out is that it still parses, because a row that was edited by hand
   into something that does not is better reported than sent.
   ========================================================================== */

import { ApiError } from "../lib/http.js";

export const DATASETS = ["claude-code-invoices"];

export function present(row) {
  let data;
  try { data = JSON.parse(row.body); }
  catch (e) { throw new ApiError(500, "bad_dataset", "That dataset is stored in a form that cannot be read."); }
  return { name: row.name, source: row.source, updatedAt: row.updated_at, data };
}
