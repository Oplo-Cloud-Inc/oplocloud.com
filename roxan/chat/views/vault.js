/* Vault, "Secured by OploCloud": logins, cards and notes you would not want
   anyone to read.

   Every item is sealed in this browser, with a key made from a passphrase that is
   never saved or sent, before it is stored (see vaultcrypto.js). Nothing here is
   part of a message to Roxan, and the model never receives any of it. The vault
   locks by itself after five idle minutes and when you leave this page.

   What it does not do yet: nothing fills a login or a card into a website, because
   no computer is connected. Changing a passphrase is not built; deleting the vault
   and making a new one is. */
import { h, section, field, ago } from "../dom.js";
import * as db from "../db.js";
import * as store from "../store.js";
import * as vc from "../vaultcrypto.js";

const IDLE = 5 * 60 * 1000;
const DOTS = "••••••••";                                     // always the same length, so the mask does not give the length away
const KINDS = {
  login: { label: "Login", fields: [{ key: "site", label: "Website" }, { key: "username", label: "Username" }, { key: "password", label: "Password", mask: true, type: "password" }] },
  card: { label: "Card", fields: [{ key: "holder", label: "Name on card" }, { key: "number", label: "Card number", mask: true }, { key: "expiry", label: "Expires" }, { key: "cvc", label: "Security code", mask: true, type: "password" }] },
  note: { label: "Note", fields: [{ key: "text", label: "Note", mask: true, area: true }] },
};

export async function mount(root, { app }) {
  const page = h("section", { class: "page vault" });
  root.append(page);
  let key = null, items = [], unreadable = 0, timer = 0, header = await store.getMeta("vault:header");
  let editing = null, adding = false;                          // the item being changed, and whether the add form is open
  const sealed = () => db.all("vault");

  const lock = why => {
    key = null; items = []; unreadable = 0;
    clearTimeout(timer); timer = 0;
    if (why) store.log("vault", why);
    draw();
  };
  const touch = () => { if (!key) return; clearTimeout(timer); timer = setTimeout(() => lock("Locked the vault after five idle minutes."), IDLE); };
  page.addEventListener("pointerdown", touch);
  page.addEventListener("keydown", touch);

  async function load() {
    items = []; unreadable = 0;
    for (const r of await sealed()) {
      try { items.push({ id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt, ...(await vc.unseal(key, r.id, r)) }); } catch { unreadable++; }
    }
    items.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /* ---------------------------------------------------------------- set up */
  function setup() {
    const pass = h("input", { type: "password", autocomplete: "new-password", "aria-label": "Passphrase" });
    const again = h("input", { type: "password", autocomplete: "new-password", "aria-label": "Passphrase again" });
    const ack = h("input", { type: "checkbox", "aria-label": "I understand" });
    const err = h("p", { class: "err", role: "alert" });
    const go = h("button", { class: "btn sm", type: "submit", text: "Make the vault" });
    const form = h("form", { class: "pform" },
      field("Passphrase", pass, `At least ${vc.MIN_PASSPHRASE} characters; four or more random words is best. Anyone who gets a copy of this browser's data can try guesses offline, so a short one falls quickly.`),
      field("Passphrase again", again),
      h("label", { class: "check" }, ack, h("span", { text: "I understand that if I forget this passphrase, nothing can recover what is in the vault. OploCloud does not have it and cannot reset it." })),
      err, h("div", { class: "btns" }, go));
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (pass.value.length < vc.MIN_PASSPHRASE) { err.textContent = `Use at least ${vc.MIN_PASSPHRASE} characters.`; return; }
      if (pass.value !== again.value) { err.textContent = "The two passphrases are different."; return; }
      if (!ack.checked) { err.textContent = "Tick the box to say you understand."; return; }
      go.disabled = true; go.textContent = "Making the vault…"; err.textContent = "";
      const made = await vc.create(pass.value);
      key = made.key; header = made.header;
      await store.setMeta("vault:header", header);
      await store.log("vault", "Made the vault.");
      await load(); touch(); draw();
    });
    return section("Make your vault", null, h("p", { text: "Choose a passphrase. It is turned into the key that seals everything you put here." }), form);
  }

  /* ---------------------------------------------------------------- locked */
  function locked(count) {
    const pass = h("input", { type: "password", autocomplete: "current-password", "aria-label": "Passphrase", placeholder: "Passphrase" });
    const err = h("p", { class: "err", role: "alert" });
    const go = h("button", { class: "btn sm", type: "submit", text: "Unlock" });
    const form = h("form", { class: "inline" }, field("Passphrase", pass), go);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (!pass.value) { err.textContent = "Enter your passphrase."; return; }
      go.disabled = true; go.textContent = "Unlocking…"; err.textContent = "";
      try {
        key = await vc.unlock(pass.value, header);
      } catch (x) {
        go.disabled = false; go.textContent = "Unlock";
        err.textContent = x instanceof vc.WrongPassphrase ? x.message : "The vault could not be opened.";
        return;
      }
      pass.value = "";
      await load();
      await store.log("vault", "Unlocked the vault.");
      touch(); draw();
    });
    return h("div", null, section("Locked", null, h("p", { text: `${count} item${count === 1 ? "" : "s"} sealed on this device.` }), form, err), danger());
  }

  /* ------------------------------------------------------------ an item */
  function itemForm({ item, onSave, onCancel }) {
    let kind = item?.kind || "login";
    const label = h("input", { type: "text", maxlength: 80, value: item?.label || "", autocomplete: "off", "aria-label": "Name" });
    const inputs = {};
    const fields = h("div", { class: "pform" });
    const draw_ = () => {
      for (const k of Object.keys(inputs)) delete inputs[k];
      fields.replaceChildren(...KINDS[kind].fields.map(f => {
        const el = f.area ? h("textarea", { class: "field", rows: "5", maxlength: "4000" }) : h("input", { type: f.type || "text", maxlength: 200, autocomplete: "off", spellcheck: "false" });
        el.value = item?.fields?.[f.key] ?? "";
        el.setAttribute("aria-label", f.label);
        inputs[f.key] = el;
        return field(f.label, el);
      }));
    };
    const pick = item ? null : h("select", { "aria-label": "Kind", onchange: e => { kind = e.target.value; draw_(); } }, Object.entries(KINDS).map(([k, v]) => h("option", { value: k, text: v.label })));
    draw_();
    const err = h("p", { class: "err", role: "alert" });
    const form = h("form", { class: "pform" }, pick ? field("Kind", pick) : null, field("Name", label, "Only you see this. It is sealed with the rest."), fields, err,
      h("div", { class: "btns" }, h("button", { class: "btn sm", type: "submit", text: item ? "Save changes" : "Seal it in the vault" }), onCancel ? h("button", { class: "btn sm ghost", type: "button", text: "Cancel", onclick: onCancel }) : null));
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const values = Object.fromEntries(Object.entries(inputs).map(([k, el]) => [k, el.value.trim()]));
      if (!label.value.trim()) { err.textContent = "Give it a name."; return; }
      if (!Object.values(values).some(Boolean)) { err.textContent = "Fill in at least one field."; return; }
      err.textContent = "";
      await onSave({ kind, label: label.value.trim(), fields: values });
    });
    return form;
  }

  async function saveItem(prev, v) {
    const id = prev?.id || db.uid("v"), now = Date.now();
    const box = await vc.seal(key, id, v);
    await db.put("vault", { id, ...box, createdAt: prev?.createdAt || now, updatedAt: now });
    await store.log("vault", prev ? "Changed an item in the vault." : "Sealed a new item in the vault.");
    await load();
    editing = null; adding = false;
    draw();
  }

  function itemCard(it) {
    const shown = new Set();
    const dl = h("dl");
    const paint = () => dl.replaceChildren(...KINDS[it.kind].fields.flatMap(f => {
      const v = it.fields?.[f.key];
      if (!v) return [];
      const masked = f.mask && !shown.has(f.key);
      const copy = h("button", { class: "act-btn", type: "button", text: "Copy" });
      copy.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(v); copy.textContent = "Copied"; } catch { copy.textContent = "Not copied"; }
        setTimeout(() => { copy.textContent = "Copy"; }, 1600);
      });
      const reveal = f.mask ? h("button", { class: "act-btn", type: "button", "aria-pressed": String(!masked), text: masked ? "Show" : "Hide", onclick: () => { if (!shown.delete(f.key)) shown.add(f.key); paint(); } }) : null;
      return [h("dt", { text: f.label }), h("dd", null, h("span", { class: f.area ? "secret block" : "secret", text: masked ? DOTS : v }), h("span", { class: "row-acts" }, reveal, copy))];
    }));
    paint();
    let armed = 0;
    const del = h("button", { class: "act-btn", type: "button", text: "Delete" });
    del.addEventListener("click", async () => {
      if (!armed) { del.textContent = "Confirm delete"; armed = setTimeout(() => { armed = 0; del.textContent = "Delete"; }, 4000); return; }
      clearTimeout(armed);
      await db.del("vault", it.id);
      await store.log("vault", "Removed an item from the vault.");
      await load(); draw();
    });
    return h("article", { class: "act", "aria-label": it.label, data: { id: it.id } },
      h("header", null, h("span", { class: "label", text: KINDS[it.kind].label }), h("span", { class: "state", text: `Changed ${ago(it.updatedAt)}` })),
      h("p", { class: "title", text: it.label }), dl,
      h("div", { class: "btns" }, h("button", { class: "act-btn", type: "button", text: "Edit", onclick: () => { editing = it.id; draw(); } }), del));
  }

  /* ---------------------------------------------------------------- open */
  function open() {
    const mine = editing && items.find(i => i.id === editing);
    const add = h("details", { class: "create", open: adding, ontoggle: e => { adding = e.target.open; } }, h("summary", { class: "go", text: "Add an item" }), itemForm({ onSave: v => saveItem(null, v) }));
    return h("div", null,
      h("div", { class: "btns" }, h("button", { class: "btn sm ghost", type: "button", text: "Lock now", onclick: () => lock("Locked the vault.") }), h("span", { class: "fine", text: "It also locks after five idle minutes, and when you leave this page." })),
      section(`Sealed items (${items.length})`, null, add,
        ...(items.length ? items.map(it => (mine && it.id === mine.id ? h("div", { class: "act" }, itemForm({ item: mine, onSave: v => saveItem(mine, v), onCancel: () => { editing = null; draw(); } })) : itemCard(it)))
          : [h("p", { class: "none", text: "Nothing in the vault yet." })]),
        unreadable ? h("p", { class: "fine", text: `${unreadable} sealed item${unreadable === 1 ? "" : "s"} could not be opened and ${unreadable === 1 ? "was" : "were"} left as they are.` }) : null),
      danger());
  }

  function danger() {
    const sure = h("input", { type: "text", autocomplete: "off", spellcheck: "false", "aria-label": "Type DELETE to confirm" });
    const wipe = h("button", { class: "btn sm", type: "button", text: "Delete the vault", disabled: true });
    sure.addEventListener("input", () => { wipe.disabled = sure.value.trim().toUpperCase() !== "DELETE"; });
    wipe.addEventListener("click", async () => {
      wipe.disabled = true;
      for (const r of await sealed()) await db.del("vault", r.id);
      await store.delMeta("vault:header");
      header = null; key = null; items = []; unreadable = 0;
      await store.log("vault", "Deleted the vault and everything sealed in it.");
      draw();
    });
    return h("details", { class: "danger" }, h("summary", { class: "go", text: "Forgot the passphrase, or done with the vault?" }),
      h("p", { class: "fine", text: "A passphrase cannot be reset, because nobody but you ever has it. Deleting the vault removes every sealed item for good, so you can make a new one." }),
      h("div", { class: "inline" }, sure, wipe));
  }

  /* ---------------------------------------------------------------- page */
  async function draw() {
    const count = (await sealed()).length;
    const body = !app.persistent ? section("Not available here", null, h("p", { text: "This browser is not letting Roxan keep anything on this device, so a vault made here would be lost when you close the tab. Open Roxan in a normal window to use the vault." }))
      : !header ? setup() : !key ? locked(count) : open();
    page.replaceChildren(
      h("p", { class: "label", text: "Vault" }),
      h("h1", { class: "page-title", text: "Secured by OploCloud." }),
      h("p", { class: "page-lead", text: "Logins, cards and notes you would not want anyone to read. Each item is sealed in this browser, with a key made from your passphrase, before it is saved. The passphrase and the key never leave this browser, so neither Roxan, its model nor OploCloud can open the vault, and nothing in it is sent with a message." }),
      h("ul", { class: "facts-list" },
        h("li", { text: "A card number you type into a message is not in the vault, and it does go to Roxan's model. Keep cards here instead." }),
        h("li", { text: "There is no reset. If you forget the passphrase, the items cannot be recovered." }),
        h("li", null, h("span", { class: "tag", text: "Next" }), " When a computer is connected, it will fill a login or card into the page that needs it without the model seeing the value. No computer is connected, so nothing is filled anywhere today.")),
      body);
  }
  await draw();
  return () => { clearTimeout(timer); key = null; items = []; };         // leaving the page locks the vault
}
