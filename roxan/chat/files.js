/* Attachments: what a person may add to a message. Roxan's model reads text, so a
   file is read as text here; a picture or a PDF is turned away with the reason.
   Everything stays in this browser until it is part of a reply. */

export const MAX_FILES = 4;
const TEXT_EXT = /\.(txt|md|markdown|csv|tsv|json|xml|html?|css|js|mjs|ts|py|rb|go|rs|java|c|h|cpp|sh|sql|ya?ml|toml|ini|log|tex)$/i;
const TEXT_CHARS = 60_000, TEXT_BYTES = 400 * 1024;
export const ACCEPT = "text/*,.md,.csv,.json,.xml,.js,.ts,.py,.yml,.yaml,.log,.sql,.sh";

export class FileError extends Error {}

// Returns { kind: "text", name, type, size, text, truncated } or throws a FileError that says why not.
export async function prepare(file) {
  const name = file.name || "pasted";
  if (file.type.startsWith("text/") || TEXT_EXT.test(name) || file.type === "application/json") {
    if (file.size > TEXT_BYTES) throw new FileError(`${name} is larger than 400 KB. Paste the part that matters instead.`);
    const text = await file.text();
    if (text.includes("\u0000")) throw new FileError(`${name} does not look like a text file.`);
    return { kind: "text", name, type: file.type || "text/plain", size: file.size, text: text.slice(0, TEXT_CHARS), truncated: text.length > TEXT_CHARS };
  }
  if (/^image\//.test(file.type) || file.type === "application/pdf" || /\.pdf$/i.test(name)) throw new FileError(`${name} is a picture or a PDF, and Roxan's model reads text only for now. Paste the part that matters, or attach a text file.`);
  throw new FileError(`${name} is not a kind of file Roxan reads. It reads text files.`);
}

// What the server takes: the text, with the file's name. It reads it for the message and keeps only the name.
export const wire = list => list.map(f => ({ type: "text", name: f.name, text: f.text }));
