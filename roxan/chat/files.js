/* Attachments: what a person may add to a message, and how each kind is made
   ready. Text is read as text; an image is shrunk so it is quick to send; a PDF
   goes as it is. Everything stays in this browser until it is part of a reply. */

export const MAX_FILES = 4;
const TEXT_EXT = /\.(txt|md|markdown|csv|tsv|json|xml|html?|css|js|mjs|ts|py|rb|go|rs|java|c|h|cpp|sh|sql|ya?ml|toml|ini|log|tex)$/i;
const TEXT_CHARS = 60_000, TEXT_BYTES = 400 * 1024, PDF_BYTES = 4 * 1024 * 1024, EDGE = 1568;
export const ACCEPT = "image/png,image/jpeg,image/gif,image/webp,application/pdf,text/*," + ".md,.csv,.json,.xml,.js,.ts,.py,.yml,.yaml,.log,.sql,.sh";

const base64 = blob => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = () => no(r.error); r.readAsDataURL(blob); });
export const blobToBase64 = base64;

export class FileError extends Error {}

// Returns { kind, name, type, size, text?, blob?, truncated?, width?, height? } or throws a FileError that says why not.
export async function prepare(file) {
  const name = file.name || "pasted";
  if (/^image\/(png|jpeg|gif|webp)$/.test(file.type)) {
    let bmp;
    try { bmp = await createImageBitmap(file); } catch { throw new FileError(`${name} could not be opened as an image.`); }
    const k = Math.min(1, EDGE / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const g = canvas.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
    g.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) throw new FileError(`${name} could not be prepared.`);
    return { kind: "image", name, type: "image/jpeg", size: blob.size, blob, width: w, height: h };
  }
  if (file.type === "application/pdf" || /\.pdf$/i.test(name)) {
    if (file.size > PDF_BYTES) throw new FileError(`${name} is larger than 4 MB. Roxan reads PDFs up to 4 MB.`);
    return { kind: "pdf", name, type: "application/pdf", size: file.size, blob: file };
  }
  if (file.type.startsWith("text/") || TEXT_EXT.test(name) || file.type === "application/json") {
    if (file.size > TEXT_BYTES) throw new FileError(`${name} is larger than 400 KB. Paste the part that matters instead.`);
    const text = await file.text();
    if (text.includes("\u0000")) throw new FileError(`${name} does not look like a text file.`);
    return { kind: "text", name, type: file.type || "text/plain", size: file.size, text: text.slice(0, TEXT_CHARS), truncated: text.length > TEXT_CHARS };
  }
  throw new FileError(`${name} is not a kind of file Roxan reads. It reads images (PNG, JPEG, GIF, WebP), PDFs up to 4 MB, and text files.`);
}
