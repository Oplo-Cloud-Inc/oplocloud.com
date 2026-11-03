/* Access: what Roxan may do without asking.

   Every tool Roxan has belongs to one capability below, and each capability is
   allowed, asked about first, or off. These are the defaults; a choice here is a
   rule that overrides one, and the strictest rule that applies wins. Reading web
   pages can also be set for one website. Two things no rule loosens: after Roxan
   reads a page or a file you attached it asks before it starts anything that
   lasts or keeps a note, because text in a page is data and must not be able to
   talk it into an action. */
import { h, fill, section } from "../dom.js";
import * as api from "../api.js";
import { S, watch } from "../state.js";
import { soon, busy, sure, pick, make, edit, drop } from "../ui.js";
import { Button, Table, Meter, Breadcrumb } from "../kit/index.js";

const WORD = { allow: "Allow", ask: "Ask first", block: "Do not allow" };
const OPTIONS = Object.entries(WORD);
const base = c => (c.effect === "learning" ? (S.settings.learning ? "allow" : "ask") : c.effect);
const generalRule = id => S.rules.find(r => r.capability === id && !r.domain);

export async function mount(root) {
  function setting(c) {
    const rule = generalRule(c.id);
    const sel = pick([["", `Default: ${WORD[base(c)].toLowerCase()}`], ...OPTIONS], rule?.effect || "", { "aria-label": c.label });
    sel.addEventListener("change", () => busy(sel, async () => {
      const v = sel.value;
      try {
        if (!v) { if (rule) await drop(rule.id); }
        else if (rule) await edit(rule.id, { effect: v });
        else await make("rule", { capability: c.id, effect: v });
      } catch (e) { sel.value = rule?.effect || ""; throw e; }
    }));
    return sel;
  }
  const caps = Table({ label: "What Roxan may do", columns: [
    { key: "label", label: "Tool", render: c => h("div", { data: { cap: c.id } }, h("p", { class: "k-t1", text: c.label }), h("p", { class: "k-t2", text: c.effect === "learning" ? `${c.hint} Allowed while learning is on.` : c.hint })) },
    { key: "setting", label: "Setting", align: "right", render: setting }] });
  const sites = Table({ label: "Websites with a rule of their own", empty: "No website has a rule of its own.", columns: [
    { key: "domain", label: "Website", render: r => h("div", { data: { id: r.id } }, h("p", { class: "k-t1", text: r.domain }), h("p", { class: "k-t2", text: `${WORD[r.effect]} reading pages from this website` })) },
    { key: "remove", label: "", align: "right", render: r => sure("Remove", b => busy(b, () => drop(r.id))) }] });

  // One website, one answer: for example never read example.com, or always ask before it.
  const domain = h("input", { type: "text", maxlength: "80", autocomplete: "off", spellcheck: "false", placeholder: "example.com", "aria-label": "Website" });
  const effect = pick(OPTIONS, "block", { "aria-label": "What to do with that website" });
  const err = h("p", { class: "err", role: "alert" });
  const add = Button({ size: "sm", type: "submit", icon: "plus" }, "Add rule");
  const form = h("form", { class: "inline" }, domain, effect, add);
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!domain.value.trim()) return;
    busy(add, async () => {
      err.textContent = "";
      try { await make("rule", { capability: "web.read", effect: effect.value, domain: domain.value.trim() }); domain.value = ""; }
      catch (x) { err.textContent = x.message; }
    });
  });

  // Today's use is read when this page opens: the page's own copy is from when Roxan was loaded.
  const limits = h("div", { class: "meters" });
  const paintLimits = () => {
    const one = (label, key) => { const n = S.usage[key] || 0, max = S.limits[key]; return max ? Meter({ label, value: n, max, valueLabel: `${n} of ${max}` }) : null; };
    fill(limits, one("Messages", "chat"), one("Background runs", "runs"), one("Cloud computer sessions", "box"), one("Cloud browser lookups", "look"));
  };
  paintLimits();
  api.get("/state").then(st => { S.usage = st.usage; S.limits = st.limits; paintLimits(); }, () => {});

  fill(root, h("section", { class: "page" },
    Breadcrumb([{ label: "Settings", href: "#/settings" }, { label: "Access" }]),
    h("h1", { class: "page-title", text: "What Roxan may do on its own." }),
    h("p", { class: "page-lead", text: "Every tool Roxan has is in this list. None of them buys, sends email or signs in, and the cloud browser only reads. For each one you decide: allow it, have Roxan ask you first, or turn it off." }),
    h("p", { class: "fine", text: "After Roxan reads a web page, searches the web, uses its cloud computer or browser, or reads a file you attached, it asks before it starts or changes a routine, keeps a note, saves a specialty or a Handoff, whatever you choose here. Text in a page is data; it cannot talk Roxan into an action." }),
    section("What it may do", null, caps),
    section("Websites", null, h("p", { class: "fine", text: "Where more than one rule applies to a page, the strictest wins. A rule for a website covers its subdomains too." }), sites, form, err),
    section("Limits", null, limits, h("p", { class: "fine", text: "The limits start again at midnight. They stop a mistake, or a page that tries to keep Roxan busy, from running up a cost." }))));

  function draw() {
    caps.setRows(S.caps);
    sites.setRows(S.rules.filter(r => r.capability === "web.read" && r.domain));
  }
  draw();
  return watch("rules", soon(draw));
}
