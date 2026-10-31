/* Things that should not be kept, or sent, without a second thought.

   SENSITIVE decides when a note may NOT be kept straight away (it waits for a
   yes instead). cardish() is for the composer: a card number typed into a
   message would travel to Roxan's model, and the vault exists so it never has to. */

export const SENSITIVE = /\b(pass(?:word|code|phrase)|pin(?: code| number)?|ssn|social security|credit card|debit card|card number|cvv|cvc|account number|routing number|iban|api key|secret key|private key|token|passport|driver'?s licen[cs]e|licen[cs]e number|medical|diagnos\w+|prescription|salary|tax id)\b/i;

// True when the text holds 13 to 19 digits (spaces and dashes allowed) that pass the Luhn check, as card numbers do.
export function cardish(text) {
  for (const m of String(text).matchAll(/(?:\d[ -]?){13,19}/g)) {
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
