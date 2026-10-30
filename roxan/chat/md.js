/* Markdown to DOM. It builds elements and text nodes, never HTML, so nothing a
   model (or a document it read) writes can become markup. Links are kept only
   for http, https and mailto; images are shown as their link text.

   Enough Markdown for a conversation: paragraphs, headings, lists (nested),
   quotes, rules, tables, fenced and inline code, bold, italic, links. An open
   code fence at the end is drawn as code, so a reply that is still streaming
   does not flicker. */

const el = (tag, text) => { const e = document.createElement(tag); if (text != null) e.textContent = text; return e; };
const SAFE = /^(https?:|mailto:)/i;

const INLINE = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)|\*\*(?=\S)([\s\S]*?\S)\*\*|(?<![\w*])\*(?=[^\s*])([\s\S]*?[^\s*])\*(?![\w*])|(?<![\w])_(?=[^\s_])([\s\S]*?[^\s_])_(?![\w])|!?\[([^\]\n]+)\]\(([^)\s]+)\)/g;

function inline(text, into) {
  let last = 0, m;
  const re = new RegExp(INLINE);                                   // its own lastIndex: inline() calls itself
  const plain = s => {
    s.split("\n").forEach((part, i) => { if (i) into.append(el("br")); if (part) into.append(part); });
  };
  while ((m = re.exec(text))) {
    if (m.index > last) plain(text.slice(last, m.index));
    if (m[1]) into.append(el("code", m[2].trim()));
    else if (m[3] != null) { const b = el("strong"); inline(m[3], b); into.append(b); }
    else if (m[4] != null) { const i = el("em"); inline(m[4], i); into.append(i); }
    else if (m[5] != null) { const i = el("em"); inline(m[5], i); into.append(i); }
    else if (SAFE.test(m[7]) && !m[0].startsWith("!")) {
      const a = el("a");
      a.href = m[7];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      inline(m[6], a);
      into.append(a);
    } else plain(m[6]);
    last = re.lastIndex;
  }
  if (last < text.length) plain(text.slice(last));
}

const FENCE = /^\s*(```+|~~~+)\s*([\w+#.-]*)\s*$/;
const HEAD = /^(#{1,4})\s+(.+?)\s*#*\s*$/;
const HR = /^\s*([-*_])(\s*\1){2,}\s*$/;
const QUOTE = /^\s*>\s?/;
const LI = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

const cells = row => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());
const startsBlock = (line, next) => FENCE.test(line) || HEAD.test(line) || HR.test(line) || QUOTE.test(line) || LI.test(line) || (line.includes("|") && next != null && SEP.test(next) && next.includes("-"));

function codeBlock(lines, i) {
  const open = FENCE.exec(lines[i]);
  const body = [];
  i++;
  while (i < lines.length && !(FENCE.test(lines[i]) && lines[i].trim().startsWith(open[1][0]) && lines[i].trim().length >= open[1].length)) body.push(lines[i++]);
  const pre = el("pre"), code = el("code", body.join("\n"));
  if (open[2]) code.className = "lang-" + open[2].toLowerCase().replace(/[^\w+#.-]/g, "");
  const copy = el("button", "Copy");
  copy.type = "button";
  copy.className = "copy";
  copy.dataset.copy = "";
  pre.append(code, copy);
  return [pre, i + 1];
}

function list(lines, i) {
  const first = LI.exec(lines[i]);
  const base = first[1].replace(/\t/g, "    ").length;
  const ol = /\d/.test(first[2]);
  const root = el(ol ? "ol" : "ul");
  if (ol && parseInt(first[2], 10) !== 1) root.start = parseInt(first[2], 10);
  let item = null;
  while (i < lines.length) {
    const line = lines[i];
    const m = LI.exec(line);
    if (m) {
      const indent = m[1].replace(/\t/g, "    ").length;
      if (indent < base) break;
      if (indent >= base + 2 && item) {                           // a nested list inside the last item
        const [sub, next] = list(lines, i);
        item.append(sub);
        i = next;
        continue;
      }
      if (/\d/.test(m[2]) !== ol) break;
      item = el("li");
      inline(m[3], item);
      root.append(item);
      i++;
    } else if (!line.trim()) {
      let j = i;
      while (j < lines.length && !lines[j].trim()) j++;           // one blank line may sit between items
      const n = LI.exec(lines[j] || "");
      if (!n || n[1].replace(/\t/g, "    ").length < base || j - i > 1) break;
      i = j;
    } else if (item && /^\s+\S/.test(line) && !startsBlock(line.trim(), lines[i + 1])) {
      item.append(el("br"));                                       // a wrapped line of the same item
      inline(line.trim(), item);
      i++;
    } else break;
  }
  return [root, i];
}

function table(lines, i) {
  const head = cells(lines[i]);
  const align = cells(lines[i + 1]).map(c => (/^:-+:$/.test(c) ? "center" : /-:$/.test(c) ? "right" : ""));
  const t = el("table"), thead = el("thead"), tbody = el("tbody"), hr = el("tr");
  head.forEach((c, k) => { const th = el("th"); inline(c, th); if (align[k]) th.dataset.align = align[k]; hr.append(th); });
  thead.append(hr);
  i += 2;
  while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
    const tr = el("tr");
    cells(lines[i]).slice(0, head.length).forEach((c, k) => { const td = el("td"); inline(c, td); if (align[k]) td.dataset.align = align[k]; tr.append(td); });
    tbody.append(tr);
    i++;
  }
  t.append(thead, tbody);
  return [t, i];
}

export function render(src) {
  const root = document.createDocumentFragment();
  const lines = String(src).replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if (FENCE.test(line)) { const [node, next] = codeBlock(lines, i); root.append(node); i = next; continue; }
    if ((m = HEAD.exec(line))) { const hd = el("h" + Math.min(4, m[1].length + 1)); inline(m[2], hd); root.append(hd); i++; continue; }
    if (HR.test(line)) { root.append(el("hr")); i++; continue; }
    if (QUOTE.test(line)) {
      const body = [];
      while (i < lines.length && QUOTE.test(lines[i])) body.push(lines[i++].replace(QUOTE, ""));
      const q = el("blockquote");
      q.append(render(body.join("\n")));
      root.append(q);
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && SEP.test(lines[i + 1]) && lines[i + 1].includes("-")) { const [node, next] = table(lines, i); root.append(node); i = next; continue; }
    if (LI.test(line)) { const [node, next] = list(lines, i); root.append(node); i = next; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() && !(para.length && startsBlock(lines[i], lines[i + 1]))) para.push(lines[i++]);
    const p = el("p");
    inline(para.join("\n"), p);
    root.append(p);
  }
  return root;
}

// The text of a code block for the Copy button.
export const codeText = pre => pre.querySelector("code")?.textContent ?? "";
