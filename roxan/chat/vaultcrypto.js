/* The vault's cryptography, and nothing else, so it can be read in one sitting and
   tested without a browser. It touches no storage and no network.

   A passphrase is stretched into a key with PBKDF2 (SHA-256, 600,000 rounds, a
   random salt kept beside the vault). The key is an AES-GCM key the browser will
   not let anyone export. Every item is sealed with its own random 96-bit nonce,
   and its id is bound in as associated data, so a sealed item cannot be moved
   under another id or altered without opening failing. A fixed phrase is sealed
   too; that is how a passphrase is checked, since only the right one opens it.

   The passphrase and the key exist only in memory while the vault is unlocked.
   Nothing here is imported by the code that talks to Roxan's model, and a test
   keeps it that way. */

export const ITERATIONS = 600_000;
export const MIN_PASSPHRASE = 12;
const CHECK = "roxan-vault-v1";
const enc = new TextEncoder(), dec = new TextDecoder();

export const toB64 = buf => {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
};
export const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export class WrongPassphrase extends Error {}

async function derive(passphrase, salt, iterations) {
  const base = await crypto.subtle.importKey("raw", enc.encode(String(passphrase).normalize("NFKC")), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

// Seals any JSON value under a key, bound to an id. Returns { iv, data } as text, safe to store.
export async function seal(key, id, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: enc.encode(id) }, key, enc.encode(JSON.stringify(value)));
  return { iv: toB64(iv), data: toB64(data) };
}

// Opens what seal() made. Throws if the key, the id or a single bit of the data is wrong.
export async function unseal(key, id, sealed) {
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(sealed.iv), additionalData: enc.encode(id) }, key, fromB64(sealed.data));
  return JSON.parse(dec.decode(plain));
}

// A new vault: { key, header }. The header is safe to store: the salt, the round count and the sealed check phrase.
export async function create(passphrase, iterations = ITERATIONS) {
  if (String(passphrase).length < MIN_PASSPHRASE) throw new RangeError(`Use at least ${MIN_PASSPHRASE} characters.`);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await derive(passphrase, salt, iterations);
  return { key, header: { v: 1, kdf: "PBKDF2-SHA256", iterations, salt: toB64(salt), check: await seal(key, "check", CHECK) } };
}

// The key for a vault, or WrongPassphrase.
export async function unlock(passphrase, header) {
  const key = await derive(passphrase, fromB64(header.salt), header.iterations);
  try {
    if ((await unseal(key, "check", header.check)) === CHECK) return key;
  } catch { /* the wrong passphrase makes the check fail to open */ }
  throw new WrongPassphrase("That passphrase did not open the vault.");
}
