/* Small helpers every part of the agent shares. */

// What the person or the model sent cannot be used; the message says why, the status says how to answer.
export class Invalid extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export const newId = prefix => prefix + "_" + Array.from(crypto.getRandomValues(new Uint8Array(10)), b => (b % 36).toString(36)).join("");

// One line of text, trimmed to a length. `text` keeps the line breaks.
export const line = (s, max) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
export const text = (s, max) => String(s ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim().slice(0, max);

export const parse = s => { try { return JSON.parse(s); } catch { return null; } };

export async function sha256(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, "0")).join("");
}

// Thirteen to nineteen digits that pass the Luhn check are a card number. None is kept, proposed or put in a note.
export function cardish(s) {
  for (const m of String(s).matchAll(/(?:\d[ -]?){13,19}/g)) {
    const d = m[0].replace(/\D/g, "");
    if (d.length < 13 || d.length > 19) continue;
    let sum = 0;
    for (let i = 0; i < d.length; i++) {
      let n = Number(d[d.length - 1 - i]);
      if (i % 2) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
    }
    if (sum % 10 === 0) return true;
  }
  return false;
}

export const DAY = 86_400_000, HOUR = 3_600_000, MIN = 60_000;
