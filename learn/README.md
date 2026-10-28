# learn/

The Oplo Learn front end. This file holds the reference for the lint codes; every line a lint
prints ends with a link here (`docs: learn/README.md#<CODE>`). It is not published
(`learn/.assetsignore`).

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

## The lints

Run from the repository root. Each one reads `learn/`, changes nothing, and speaks the same way.

```bash
node api/scripts/check-ui.mjs        # tokens, network rule, markup rule, templates, class names (UI…)
node api/scripts/check-i18n.mjs      # the words: packs, keys, Hindi (I18N…)
python3 tools/stamp.py --check       # the ?v= hash on every asset of the three pages (STAMP…)
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

## STAMP codes (tools/stamp.py --check)

<a id="STAMP001"></a>
### STAMP001 asset hash missing, a placeholder or stale
A script or stylesheet of `learn/index.html`, `learn/parent/index.html` or `learn/disclosure/index.html`
has no `?v=` hash, has `?v=0`, or has a hash that is no longer the file's. A browser could keep
serving the old file.
Fix: run `python3 tools/stamp.py`.
