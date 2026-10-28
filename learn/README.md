# learn/

The Oplo Learn front end. This file holds the reference for the lint codes; every line a lint
prints ends with a link here (`docs: learn/README.md#<CODE>`). It is not published
(`learn/.assetsignore`).

## The golden path

From a cold clone to a new page that passes every check. Run everything from the repository root; needs node 22.

### 1. See the components (seconds, no install, no API)

```bash
bash api/scripts/dev.sh gallery      # then open http://localhost:8123/learn/_ui.html
```

The gallery draws every component in every state, in light and dark, in both densities and in English and Hindi. The page
you will add is made of these; [Components, option by option](#components-option-by-option) below lists what each one takes.

### 2. Run the whole thing (about two minutes the first time)

```bash
cd api && npm ci && cd ..            # once
bash api/scripts/dev.sh              # a new local database, a demo school, the API, the sign-in page, this folder
```

It prints the address, the file that holds the demo people's password, and the commands that check your work. A second run
keeps the database and the passwords. `dev.sh full` fills the school (330 children, a month of registers), `dev.sh scale` makes
the 1,801-child school the Directory's budget is measured on, `dev.sh stop` stops the servers. The database lives in
`~/.oplo-learn-dev/`, outside the repository and outside any synced folder, because a synced SQLite file gets corrupted. The new
frame can be turned off for one browser with `?frame=off` (DESIGN.md, Switches). If a port is taken the script says which and how to
change it.

### 3. Add a page

A page is a script in a module folder, the words it shows, a place in the menu and a script tag. The smallest finished example is
Admin › Settings › Modules (`learn/settings/modules.js`, on template T7); a list is `learn/students/directory.js` (T2).

1. **A folder.** `learn/<module>/<page>.js`. Never call the folder `admin`, `teacher` or `student`: those are the console's
   addresses (`/admin/…`), the server strips them, and a script there is a 404 that looks like a missing page. A new folder is added
   to `MODULES` in `api/scripts/lib-lint.mjs`; from then on both lints and the syntax gate read it. Its stylesheet,
   `learn/<module>/<module>.css`, is optional; every class starts `ol-` (`ol-<module>-<name>`, BEM-light).
2. **The script.** Scripts share `window.OL`; there are no modules, no network calls (only `learn/api.js` talks to the server), no
   markup built from strings. Register the page under its key and name the template it is built on:

   ```js
   (function () {
     "use strict";
     var OL = window.OL, t = function (k, p) { return OL.i18n.t(k, p); };
     function draw(host, env) {
       var S = OL.templates.T7(host, {
         "class": "ol-notes",
         load: function () { return window.OPLO_API.school.profile(); },
         head: function () { return { title: t("notes.title"), subtitle: t("notes.subtitle") }; },
         cards: function (d) { return [OL.ui.card.render({ title: t("notes.card"), body: OL.h("p", { text: d.profile.stateCode || "—" }) })]; }
       });
       S.start();
     }
     OL.pages.register("notes", { template: "T7", draw: draw });
   })();
   ```

   The templates and their options are documented at the top of `learn/ui/templates.js`; the states every page has (loading, error
   with Try again, denied, empty) come with the template.
3. **The words.** Every sentence a person reads is a key, and the packs are nested objects: the key `notes.title` is
   `notes: { title: "…" }` inside the `OL.i18n.add("en-IN", { … })` of `learn/i18n/en-IN.js` (the base: every key lives there), and the
   same shape in Devanagari, with the same `{names}`, in `learn/i18n/hi-IN.js`:

   ```js
   notes: { title: "Notes", subtitle: "What the school wants staff to read.", card: "Notes" },          // en-IN.js
   notes: { title: "टिप्पणियाँ", subtitle: "स्कूल की ओर से स्टाफ़ के लिए बातें।", card: "टिप्पणियाँ" },      // hi-IN.js
   ```

   For a new family of keys (`notes.`) add its prefix to `HINDI_COMPLETE` in `api/scripts/check-i18n.mjs`, so a page that is half
   translated fails. Sentence case, second person, 20 words or fewer (DESIGN.md, Words).
4. **The menu.** In `learn/shell/routes.js` add `tab("notes", "notes")` to the module's tabs (a `sub(…)` inside `withSubs(…)` for a
   second row). The first argument is the tab's address, the second the key of the old console page it replaces; a page with no old
   page uses its own key. The old console also has to know the key: add `{ k: "notes", name: "Notes", group: "Settings", icon: "gear",
   hidden: true, frame: true }` to `ADMIN_SECTIONS` in `learn/app.js` (`frame: true` says the page exists only in the new frame).
   The menu shows the tab's name from the packs: `notes: "Notes"` under `tab: { admin: { … } }` in `en-IN.js`, its Devanagari at the
   same path in `hi-IN.js` (a sub-tab goes under `sub: { admin: { settings: { … } } }`). `bash tools/verify.sh routes` names the key it
   wants.
   A page that is not ready is hidden behind a flag: `{ flag: "notes" }` as the third argument and `notes: false` in `FLAGS`.
5. **The script tag.** In `learn/index.html`, after `shell/pages.js` and before `app.js`, add
   `<script src="<module>/<page>.js?v=0"></script>` (and the stylesheet's `<link>` beside `students.css`, if there is one). Then
   `python3 tools/stamp.py` writes the content hash after every `?v=` of the three pages. A file that is not stamped fails STAMP001.
6. **Check it.** `bash tools/verify.sh` runs the syntax check, the stamp check, both lints, the design check, the migration check,
   the audit check, the API and route tests, the lints' own fixtures and the gates' own fixtures, and ends with `RESULT: ok` or
   `RESULT: fail <n> gates`. One gate by name: `bash tools/verify.sh lints`. The browser suites
   (`API=… ORIGIN=… CRED=… node api/scripts/test-ui.mjs`, `test-shell.mjs`, `test-students.mjs`, `test-journeys.mjs`) need the stack of
   step 2; `dev.sh` prints the exact line.

### 4. Read an error by its code

Every problem is `<CODE> <file>:<line> <what>`, then `fix:` (the exact edit or command), then `docs:` (the section of this file
for the code). Look the code up below (`UI…` tokens and rules, `I18N…` words, `DES…` design law, `MIG…` migrations, `AUD…` audit
rows, `STAMP…` asset hashes); the section says why the rule exists and what to do. Fix the first problem and run the check again;
a rule that looks wrong is changed in `DESIGN.md` first, then in code.

### 5. A write route needs a proof

A route that writes data for a rebuilt module leaves an audit row, and a proof asserts it: `audited(who, "POST /path", { action },
() => who.post(…))` in `api/scripts/lib-prove.mjs` fails when the log did not grow. `api/scripts/audit-routes.mjs` lists the
routes (AUD001 to AUD003).

## Templates

A screen is a template plus a config. The template (`learn/ui/templates.js`) owns the order of the
parts and the states every page of its kind has: loading, error with Try again, denied, empty, the
address as the state. The page owns its words, its columns and what its buttons do. The options are
documented at the top of that file.

```js
// the registration names the template (UI013 fails a page that does not) …
OL.pages.register("guardians", { template: "T2", when: St.when, draw: function (host, env) { St.guardians.drawList(host, env); } });

// … and the page draws itself on it
var S = OL.templates.T2(host, { class: "ol-students-gd", keys: […], answer: function (q) { … }, head: …, kpis: …, tools: …, table: … });
S.start();
```

| Template | Parts | Used by |
|---|---|---|
| T2 Index | header · alert · numbers · toolbar · table [· bulk bar] | Directory, Admissions, Classes, Guardians |
| T3 Record | header with Back · tabs · panel [· side column] | a student's record, a section's record |

The other seven are written when a screen needs them.

## Components, option by option

Every component is one call to `OL.ui.<name>.render` (or `.open` / `.show` for the ones that float). The first line of each block
is its options, `|` between the allowed values; the call under it is one working example. Words always come from `t("…")`; the keys here exist in the base pack, so each example runs as written, and a page uses its own.
`learn/ui/<file>.js` has the full comment (states, keyboard, what the component enforces). Run any example in the gallery page's
console to see it: `document.body.appendChild(OL.ui.button.render({ label: "Save" }))`.

```js
// C-01 button: label variant(primary|secondary|ghost|danger|link) size(sm|md|lg) icon iconAfter iconOnly ariaLabel loading disabled disabledReason href type onClick tip
OL.ui.button.render({ label: t("common.save"), variant: "primary", size: "sm", onClick: function () {} });   // .setLoading(bool) · .setDisabled(bool, reason)

// C-02 input: label name type value placeholder helper error optional prefix suffix maxLength counter multiline rows disabled readOnly inputMode autocomplete onInput onChange onBlur
OL.ui.input.render({ label: t("students.col.name"), name: "name", optional: true, maxLength: 80, onInput: function (value) {} });   // .value · .setError(msg) · .setHelper(msg) · .focus()

// C-03 select: label name options[{ value label count hint sub avatar group disabled }] value|values multiple searchable placeholder optional helper error selectAllInGroup load(query) clearable disabled emptyText onChange
OL.ui.select.render({ label: t("common.all"), options: [{ value: "a", label: t("common.yes") }, { value: "b", label: t("common.no") }], value: "a", onChange: function (value) {} });   // .value · .values · .setOptions(list)

// C-04 classpicker: label classes[{ id label stage sections[{ id label count }] }] values multiple optional helper error placeholder onChange(sectionIds)
OL.ui.classpicker.render({ label: t("common.search"), classes: [{ id: "X", label: "Class X", sections: [{ id: "X-A", label: "X-A", count: 40 }] }], multiple: true, onChange: function (ids) {} });   // .values · .setClasses(list)

// C-05 people: label kind(student|staff|guardian) multiple search(query) resolve(tokens) values optional helper error placeholder onChange(people)
OL.ui.people.render({ label: t("students.col.name"), kind: "student", search: function (q) { return Promise.resolve([{ id: "s1", name: "Asha Verma", sub: "X-C" }]); }, onChange: function (people) {} });   // .people

// C-06 date: label value(ISO) min max optional helper error disabled onChange — also date.range({ label value:{ from to } presets onChange }), month.render, time.render({ step }), datetime.render
OL.ui.date.render({ label: t("students.col.admitted"), value: "2026-10-26", min: "2026-04-01", onChange: function (iso) {} });

// C-07 chips: items[{ value label count }] value|values multiple label onChange · segmented: items[{ value label }] value label onChange (two to four items)
OL.ui.chips.render({ label: t("common.all"), items: [{ value: "a", label: t("common.yes"), count: 12 }], values: [], multiple: true, onChange: function (values) {} });
OL.ui.segmented.render({ label: t("common.all"), items: [{ value: "a", label: t("common.yes") }, { value: "b", label: t("common.no") }], value: "a", onChange: function (value) {} });

// C-08 datenav: mode(day|week|month|term) value min max isOff(iso) terms label onChange(value, { from, to })
OL.ui.datenav.render({ mode: "day", value: "2026-10-26", onChange: function (value, range) {} });   // .value · .set(value)

// C-09 tabs: items[{ key label count href disabled }] active size(page|sub|card) label onSelect(key) panelPrefix controls reselect
OL.ui.tabs.render({ items: [{ key: "a", label: t("common.yes") }, { key: "b", label: t("common.no") }], active: "a", size: "sub", label: t("common.all"), onSelect: function (key) {} });   // .set(key) · .panelId(key)

// C-10 table: caption columns[{ key label align sort width sticky num hidden mobile(title|sub|status|hide) value(row) render(row) total(rows) }] rows rowKey selectable selected sort{ key dir } onSort page pageSize total onPage onOpen onSelect selectAllMatching rowActions(row) expand(row) totals columnChooser resizable prefsKey loading empty entity
OL.ui.table.render({ caption: t("students.col.name"), columns: [{ key: "name", label: t("students.col.name"), mobile: "title" }], rows: [{ id: "1", name: "Asha Verma" }], rowKey: "id", total: 1, pageSize: 50, onOpen: function (row) {} });   // .update({…}) · .selected() · .toCSV()

// C-11 grid: caption columns[{ key label type(code|number|text|toggle|readonly) header codes max min step maxLength width validate(value, row) render(row) }] rows rowKey onSave(changes) → Promise onSubmit autosaveMs advance shortcuts
OL.ui.grid.render({ caption: t("students.col.name"), columns: [{ key: "name", label: t("students.col.name"), type: "readonly", header: true }, { key: "mark", label: t("students.col.admitted"), type: "number", max: 20 }], rows: [{ id: "1", name: "Asha Verma", mark: 12 }], rowKey: "id", onSave: function (changes) { return Promise.resolve(); } });   // .flush() · .setStatus(kind, text)

// C-12 kpi: label value context delta{ dir(up|down) good text } href|onClick selected tone
OL.ui.kpi.render({ label: t("students.col.name"), value: 1801, context: "", onClick: function () {} });

// C-13 pill: status — or label + tone(neutral|info|success|warning|danger). A status key's label comes from the pack ("status.absent")
OL.ui.pill.render({ label: t("common.yes"), tone: "success" });

// C-14 card: title why level class actions body footer{ label href|onClick } collapsible collapsed span
OL.ui.card.render({ title: t("students.col.name"), why: t("common.save"), body: OL.h("p", { text: "—" }), footer: { label: t("common.save"), onClick: function () {} } });   // .body

// C-15 drawer: title subtitle width(560|720|960) tabs activeTab onTab body footer onClose guard url{ param value } onStep openFull
var drawer = OL.ui.drawer.open({ title: t("students.col.name"), width: 560, body: OL.h("p", { text: "—" }), onClose: function () {} });   // handle: close() · setBody(node) · setTitle(s) · setDirty(bool)
drawer.close();

// C-16 modal: confirm({ title text confirmLabel cancelLabel danger typeToConfirm body }) → Promise<boolean> · open({ title body actions[nodes] width blocking alert onClose }) → handle
OL.ui.modal.confirm({ title: t("students.col.name"), text: t("common.save"), confirmLabel: t("common.save") }).then(function (yes) {});

// C-17 toast: text tone(success|info|error) undo(function: shows Undo) ms
OL.ui.toast.show({ text: t("common.save"), tone: "success" });

// C-18 banner: tone(info|warning|danger|success|offline) title text actions dismissible blocking onDismiss class
OL.ui.banner.render({ tone: "info", text: t("common.save"), dismissible: true });

// C-19 empty: kind(first|filtered|denied|error) icon title text why primary{ label icon href onClick } secondary onClear class
OL.ui.empty.render({ kind: "filtered", title: t("students.col.name"), text: t("common.save"), onClear: function () {} });

// C-20 skeleton: type(rows|kpi|card|chart|lines) n — and skeleton.later(host, { type }, ms = 300) → remove(): drawn only if the answer takes longer than ms
OL.ui.skeleton.render({ type: "rows", n: 4 });

// C-21 avatar: name id src size(24|32|40…) — also avatar.group(people, max = 3) and avatar.initials(name)
OL.ui.avatar.render({ name: "Asha Verma", id: "s1", size: 32 });

// C-22 breadcrumb: items[{ label href onClick }] back{ label href onClick }
OL.ui.breadcrumb.render({ items: [{ label: t("students.col.name"), href: "#" }, { label: t("students.col.admitted") }] });

// checkbox, radio, switch: box({ label checked indeterminate disabled onChange }) · field({ label helper checked disabled onChange }) · radios({ label options[{ value label hint disabled }] value name inline onChange }) · toggle({ label helper checked disabled onChange })
OL.ui.check.toggle({ label: t("common.yes"), checked: true, onChange: function (on) {} });

// menu: anchor items[{ label icon href onClick count danger disabled sep head radio check checked }] align
OL.ui.menu.open({ anchor: document.body, items: [{ label: t("common.save"), onClick: function () {} }] }).close();
```

DESIGN.md has the rest: tokens, breakpoints, which surface for which job, the status dictionary, the verb dictionary.

## The lints

Run from the repository root. Each one reads `learn/`, changes nothing, and speaks the same way.

```bash
node api/scripts/check-ui.mjs        # tokens, network rule, markup rule, templates, class names (UI…)
node api/scripts/check-i18n.mjs      # the words: packs, keys, Hindi (I18N…)
python3 tools/stamp.py --check       # the ?v= hash on every asset of the three pages (STAMP…)
node api/scripts/check-migrations.mjs # api/migrations: numbers and additive changes (MIG…)
node api/scripts/check-design.mjs     # DESIGN.md names every token family, template, component file and phone answer; this file has an example of every component (DES…)
node api/scripts/test-lint.mjs       # each code is seen to fail on a fixture, with its fix line and exit code
```

A problem is three lines, a clean run is one:

```
I18N001 learn/ui/page.js:81 key "page.bulk" is not in the en-IN pack
fix: add "page.bulk" to learn/i18n/en-IN.js and a Devanagari value to learn/i18n/hi-IN.js
docs: learn/README.md#I18N001
RESULT: fail 1 problems
```

The last line is `RESULT: ok` or `RESULT: fail <n> problems`, and the exit code is 1 when there is a
problem. `--json` prints `{"result": "ok" | "fail", "problems": [{code, file, line, what, fix, docs}]}`
instead. `OL_LEARN_ROOT` points a lint at another copy of `learn/` (that is how the fixtures run).

A rebuilt module is a folder with its own scripts and one stylesheet, `learn/<module>/<module>.css`.
It is added to `MODULES` in `api/scripts/lib-lint.mjs`; from then on both lints read it.

## UI codes (check-ui.mjs)

<a id="UI001"></a>
### UI001 raw colour
A colour written as `#hex`, `rgb()`, `hsl()` or `oklch()` in a stylesheet. Only `tokens.css` holds raw
colours, so the light, dark and high-contrast themes change them in one place.
Fix: use a colour token, for example `var(--c-text)` or `var(--c-bg-subtle)`.

<a id="UI002"></a>
### UI002 type size not from a token
A `font-size` that is a number of pixels (or anything but a token, `100%`, `1em`, `1rem`).
Fix: set the type with a token: `font: var(--t-body)`, `--t-small`, `--t-caption`, `--t-h3`.

<a id="UI003"></a>
### UI003 weight not from a token
A `font-weight` that is a number. The weight comes with the type token.
Fix: use `font: var(--t-body-strong)` or another token that carries the weight.

<a id="UI004"></a>
### UI004 family not from a token
A `font-family` that names a font.
Fix: `font-family: var(--font-ui)` or `var(--font-mono)`, or a type token.

<a id="UI005"></a>
### UI005 stacking not from a token
A `z-index` that is a number above 4. Layers come from tokens so a drawer is always over the rail.
Fix: `var(--z-sticky)`, `var(--z-drawer)`, `var(--z-modal)`… (0 to 4 only orders things inside one component).

<a id="UI006"></a>
### UI006 radius not from a token
A `border-radius` in pixels.
Fix: `var(--r-sm)`, `var(--r-md)`, `var(--r-lg)` or `var(--r-full)`.

<a id="UI007"></a>
### UI007 !important
`!important` outside `base.css`, or more than six in it. It is for `[hidden]` and reduced motion.
Fix: remove it and win with a more specific selector.

<a id="UI008"></a>
### UI008 uses the network
`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon` or `importScripts` outside `learn/api.js`.
Fix: put the request in `learn/api.js` and call it from the page through the API object.

<a id="UI009"></a>
### UI009 builds markup from a string
`innerHTML`, `outerHTML`, `insertAdjacentHTML` or `document.write`. A name is text, never HTML.
Fix: build the nodes with `OL.h(…)` and put words in with `text:` or `textContent`.

<a id="UI010"></a>
### UI010 runs a string as code
`eval(` or `new Function(`.
Fix: call a function that is written out.

<a id="UI011"></a>
### UI011 leaves a console.log
A `console.log` or `console.debug` call in a shipped script.
Fix: delete it.

<a id="UI012"></a>
### UI012 modules are not used
`import` or `require` in a script. Scripts share `window.OL`.
Fix: remove it and read what you need from `window.OL`.

<a id="UI013"></a>
### UI013 page registered without a template
`OL.pages.register("id", { … })` without `template: "T1"` to `"T9"` (or a list of them).
Fix: add the template the page is built on, for example `template: "T2"`.

<a id="UI014"></a>
### UI014 developer file would be published
`_ui.html`, `ui/gallery.js`, `ui/gallery.css` or `README.md` is missing from `learn/.assetsignore`.
Fix: add the line to `learn/.assetsignore`.

<a id="UI015"></a>
### UI015 class name without the ol- prefix
A class in a rebuilt module's stylesheet or scripts that does not start with `ol-` (`is-` and `has-`
name a state and are allowed). A module's own classes are `ol-<module>-<name>`, in the BEM-light
style `ol-students-name__n` and `ol-students-f--wide`.
Fix: rename it in the stylesheet and in every script that uses it.

## I18N codes (check-i18n.mjs)

<a id="I18N001"></a>
### I18N001 key not in the en-IN pack
A component asks for a key (`t("…")`) that `learn/i18n/en-IN.js` does not hold.
Fix: add the key to `en-IN.js` and a Devanagari value to `hi-IN.js`.

<a id="I18N002"></a>
### I18N002 no key starts with the prefix
A key built as `t("prefix." + x)` or a list of choices `opt("prefix.", […])` where nothing in the base
pack starts with the prefix.
Fix: add the keys under the prefix to `en-IN.js`, or correct the prefix.

<a id="I18N003"></a>
### I18N003 no Hindi for a rebuilt module's word
A `students.` or `pages.` key that `hi-IN.js` does not hold. A rebuilt screen is not half translated.
Fix: add the key to `hi-IN.js` with a Devanagari value.

<a id="I18N004"></a>
### I18N004 a pack holds a key the base does not
`en-US.js` or `hi-IN.js` has a key `en-IN.js` lacks.
Fix: add it to `en-IN.js`, or delete it from the other pack.

<a id="I18N005"></a>
### I18N005 Hindi message not in Devanagari
A `hi-IN.js` value written in Latin letters.
Fix: write it in Devanagari.

<a id="I18N006"></a>
### I18N006 Hindi message is a copy of the English
A `hi-IN.js` value identical to the `en-IN.js` one.
Fix: translate it.

<a id="I18N007"></a>
### I18N007 Hindi message takes different values
A `hi-IN.js` message uses other `{names}` than the English does, so the page would show a blank or a brace.
Fix: use the same `{names}` as `en-IN.js`.

<a id="I18N008"></a>
### I18N008 a component writes its own words
A sentence typed straight into a component (`text:`, `label:`, `title:`, `placeholder:`, `aria-label`,
`textContent`). Words a person reads come from a pack.
Fix: move it into `en-IN.js` (and `hi-IN.js`) and read it with `t("…")`.

## MIG codes (check-migrations.mjs)

<a id="MIG001"></a>
### MIG001 two migrations share a number
Two files in `api/migrations/` start with the same four digits. Parallel branches each took the next free
number; the migrations are applied in the order of their names, so the second to merge has to move.
Fix: rename it to the next free number (the lint prints it), or merge the two files.

<a id="MIG002"></a>
### MIG002 a migration drops or renames something
`DROP TABLE`, `DROP COLUMN` or `RENAME` in a migration numbered 0071 or later. The API is deployed after the
migration (migrate first, deploy second), so for a while the previous API runs on the new schema: a migration
only adds.
Fix: add the new column or table in this migration and remove the old one in a later migration, once no deployed
API uses it. If the removal really is meant, put `-- allow-destructive: <why>` in the file.

<a id="MIG003"></a>
### MIG003 a migration file without a number
A `.sql` file in `api/migrations/` not named `NNNN_name.sql`, so the order it is applied in is not the order it
was meant for.
Fix: rename it with the next free number.

## AUD codes (check-audit.mjs)

`api/scripts/audit-routes.mjs` lists the write routes of the modules that have moved to the new frame and the audit row each one
writes (O17). `audited()` in `api/scripts/lib-prove.mjs` is what makes a proof fail when a route leaves no row.

<a id="AUD001"></a>
### AUD001 a write route nobody decided about
A route that writes (POST, PUT, PATCH, DELETE) under a path a migrated module writes to is in neither `AUDITED` nor
`NOT_YET`. A new route in `directory`, `india` or the school's settings has to say whether it leaves an audit row.
Fix: add it to `AUDITED` with the action it writes, make the route write that row in the same batch as the change (E2), and
wrap the proof's call in `audited(admin, "METHOD /path", { action }, () => …)`. If no migrated page calls it yet, put it in
`NOT_YET` with the reason.

<a id="AUD002"></a>
### AUD002 the registry names a route or an action that is not there
An entry in `audit-routes.mjs` names a route that is not in `src/index.js` (renamed or removed), or an audit action that no code
in `src/` writes.
Fix: correct the entry, or remove it when the route is gone; or make the route write the action it is listed with.

<a id="AUD003"></a>
### AUD003 no proof asserts the audit row
An `AUDITED` route has no `audited(who, "METHOD /path", { action }, …)` call in any `prove-*.mjs`, or the proofs assert another
action than the registry lists. A row nobody checks is a row that stops being written without anyone noticing.
Fix: wrap the proof's call to the route in `audited()` with the registry's action, or make the two agree.

## DES codes (check-design.mjs)

`DESIGN.md` at the repository root is the design law the code depends on. These fail when it falls behind.

<a id="DES001"></a>
### DES001 token family not in DESIGN.md
`learn/tokens.css` defines custom properties whose family (the first word: `--c-`, `--t-`, `--ctl-`…) DESIGN.md never names.
Fix: add a row to the token table in DESIGN.md that names `--<family>-*` and says what it holds.

<a id="DES002"></a>
### DES002 template without a row
One of T1 to T9 has no row in the template table of DESIGN.md.
Fix: add `| Tn | name | use it for | built |`.

<a id="DES003"></a>
### DES003 component not in DESIGN.md
A script in `learn/ui/` is not named in DESIGN.md, or a C-number of the catalogue (`learn/ui/index.js`) is not in its component table.
Fix: add the file or the C-number to the component table (plumbing files go in the paragraph under it).

<a id="DES004"></a>
### DES004 browser surface left to the browser
`learn/base.css` has no rule for `::selection`, `caret-color`, `accent-color` or `scrollbar-color`, so the browser paints it in its own colours.
Fix: add the rule to base.css from the tokens (see "Browser surfaces" there).

<a id="DES005"></a>
### DES005 phone answer differs
A module's `phone` in `learn/shell/routes.js` is missing from, or not the same as, its row in the phone table of DESIGN.md.
Fix: make the two agree.

<a id="DES006"></a>
### DES006 component without an example
A component in the catalogue (`learn/ui/index.js`) has no `OL.ui.<name>.` call in the "Components, option by option" section of this file, so a person writing a page cannot see what it takes.
Fix: add the options and one working example under that heading (the examples run as written in the gallery's console).

## STAMP codes (tools/stamp.py --check)

<a id="STAMP001"></a>
### STAMP001 asset hash missing, a placeholder or stale
A script or stylesheet of `learn/index.html`, `learn/parent/index.html` or `learn/disclosure/index.html`
has no `?v=` hash, has `?v=0`, or has a hash that is no longer the file's. A browser could keep
serving the old file.
Fix: run `python3 tools/stamp.py`.
