// Postgres pool + small query helpers.
import pg from "pg";
import { config } from "./config.js";

// Return DATE/TIMESTAMPTZ as ISO strings so JSON responses are stable.
pg.types.setTypeParser(1114, v => new Date(v + "Z").toISOString()); // timestamp
pg.types.setTypeParser(1184, v => new Date(v).toISOString());       // timestamptz
pg.types.setTypeParser(20, v => parseInt(v, 10));                   // int8 -> number

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", err => console.error("[db] idle client error", err));

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

/** First row or null. */
export async function one(text, params) {
  const res = await pool.query(text, params);
  return res.rows[0] || null;
}

/** All rows. */
export async function many(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

/** Run fn inside a transaction; rolls back on throw. */
export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    throw err;
  } finally {
    client.release();
  }
}

export async function waitForDatabase(attempts = 30, delayMs = 2000) {
  for (let i = 1; i <= attempts; i++) {
    try { await pool.query("SELECT 1"); return; }
    catch (err) {
      if (i === attempts) throw err;
      console.log(`[db] not ready (${i}/${attempts}) — retrying in ${delayMs}ms`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}
