# Roxan's component kit

`roxan/chat/kit/` is the set of interface parts every screen of `/chat` is built from, drawn by `roxan/chat/kit.css`. It is plain ES modules and CSS: no framework, no build step, nothing to install. The policy on `/chat/*` still holds (scripts from `self` only, no eval), and so does the project's own check in `worker/test/client.test.js`: pages are built from elements, never from HTML strings, and no `style:` props, `cssText` or `setAttribute("style")` in the chat code. Sizes that have to be set from code go through the CSSOM (`el.style.width`); everything else is a class in `kit.css`.

The set, the part names, their variants and sizes, and the token scale follow BoardUI (boardui.com), see [Credit](#credit). BoardUI is React and Tailwind; Roxan has neither, so each part is written again in vanilla JS rather than ported.

## Using it

```js
import { Button, Field, Select, Drawer, confirm } from "../kit/index.js";
```

- A part is a function that returns a DOM node, built with `h()`, `s()` and `fill()` from `chat/dom.js`.
- A control that holds a value (Input, Select, Switch, Checkbox, RadioGroup, SegmentedControl, DatePicker, …) exposes `.value` and fires a bubbling `change`, so a form can read it the same way whatever it is.
- Dialogs, drawers, menus, tooltips and the palette are drawn into `#layers` and placed by `place()`. While a dialog is open `#shell` is `inert`, focus is trapped, Escape closes it and focus goes back to what opened it.
- `[hidden]` hides every element, kit parts included (`roxan/ui.css`).
- Tokens are `--k-*`, defined on `body[data-page="chat"], #layers` at the top of `kit.css`. The look is the Roxan one: black, white, hairlines. Dark only.
- After any change to a CSS or JS file under `roxan/`, run `python3 tools/roxan_chrome.py` (and `--check`) so the pages carry fresh `?v=` hashes.

## The parts

| File | Parts |
|---|---|
| `core.js` | `cx`, `uid`, `reduced`, `layers`, `leave`, `place`, `float`, `trap`, `roving`, `hold` (helpers the others stand on) |
| `controls.js` | Button, IconButton, CloseButton, LinkButton, ButtonGroup, Badge, Kbd, Avatar, StatusDot, Divider, Spinner, Skeleton, SkeletonText, Progress, Meter, Field, Input, SearchField, NumberField, Switch, Checkbox, Radio, SwitchCard, CheckboxCard, RadioGroup, Chip, TagGroup |
| `overlays.js` | Tooltip (`data-tip` on any element, after `initTips()`), Popover, Menu, ContextMenu, Select, Combobox, Modal, Drawer, `confirm()`, `openPalette()`, Notice, Announcement |
| `nav.js` | Tabs, SegmentedControl, Breadcrumb, Accordion, TreeView, Table, StatCard, FileUpload, Calendar, DatePicker |
| `agent.js` | AgentThinking, AgentLog, ComposerLoader, NotificationCenter |

`chat/ui.js` keeps the small helpers pages share, now on the kit: `sure()` (a button that asks first, via `confirm`), `pick()` (a Select), `check()`, `progress()`, `copy()`, `busy()` (runs an action with its button off and turns a failure into a toast), `toast()`.

The gallery at `/chat/kit/` shows every part with its states. It is not linked from anywhere and carries `noindex`. It is a reference for whoever builds the next screen.

## Where each part is used

| Part | Where |
|---|---|
| Button, IconButton, LinkButton | every page; the gates (Try again, Status, Sign in) |
| Field, Input, SearchField, NumberField | drawers and forms on Goals, Routines, Specialties, Projects, Handoff, Panels; Today's quick box; the invite gate; Memory and Activity search |
| Select, Combobox | Activity filters, Vault item kind, rename-or-move, Settings time zone |
| Switch, SwitchCard, Checkbox, RadioGroup | Settings; the Routines drawer (kind, days); checklists in Panels; the vault's "I understand" |
| Tabs, SegmentedControl | Tabs: Settings, Goals, Projects. SegmentedControl: Memory's web/list switch, the new-panel type |
| Accordion | the "delete everything" and "forgot the passphrase" blocks; Handoff, Goals, Projects and Memory |
| Breadcrumb | the pages under Settings (Access, Activity, Handoff, Memory, Vault, Specialties), goal, project and panel detail, every side chat |
| Table, StatCard, Meter | Activity, Access (limits), table panels |
| Modal, Drawer, `confirm()` | rename-or-move; new/edit forms; every "are you sure" |
| Menu | the conversation's options, the account menu |
| `openPalette()` | ⌘K |
| Notice, Announcement | Notice: issues under a reply (stopped, cut short, failed) and toasts. Announcement: the bar that says live updates are not reaching the page |
| NotificationCenter, StatusDot, Avatar, Kbd | the bell, the rail's "what Roxan is doing" dot, the account row, the composer hint |
| TreeView | the rail's chats and projects |
| FileUpload | the drop sheet over a conversation |
| Chip, TagGroup | attached files in the composer and in a sent message |
| DatePicker (with Calendar) | the Routines drawer |
| AgentThinking, AgentLog, ComposerLoader | a reply in progress, the steps it took, the ring round the composer |
| Skeleton, SkeletonText | the Panels page while a panel is fetched |
| Progress | goal and step progress |
| Tooltip | icon-only buttons (`data-tip`) |

Built, in the gallery, and not placed yet because no screen has a job for them: **ButtonGroup**, **Divider**, **CheckboxCard**, **ContextMenu** (nothing in Roxan has a right-click menu worth having). Badge is used as the look of the small `.tag` labels (CSS) rather than as a node. Spinner is inside Button's loading state, Radio inside RadioGroup, Calendar inside DatePicker, Popover inside Menu and the bell.

## What was not built, and why

BoardUI's free set has 56 components. These were left out because nothing in Roxan would use them honestly, and an unused part is clutter:

- carousel, color-picker, slider, input-otp, pagination, date-range-picker, meeting-scheduler: no screen has an image strip, a colour, a range, a one-time code, pages of results, a date range or a booking.
- social-button, auth-card: sign-in happens in the Oplo Account tab. Roxan has no password form and no list of other companies to sign in with.
- theme-toggle: Roxan is dark only.
- orders, revenue and patient cards, and the chart blocks: there is no such data.
- textarea and time field: the browser's own elements, dressed in the kit's field look by `chat.css`.
- Pro components and templates: they need a paid licence. None was used.

## Credit

BoardUI (boardui.com). Its licence page says the free source is published on GitHub under the MIT licence. Only free components were looked at. Nothing is copied verbatim: the parts are written in vanilla JS, and the component set, names, variants, sizes and token scale follow BoardUI's. Their MIT notice asks that the copyright notice travel with copies or substantial portions of the software, and none is copied; this page is where the credit lives. Roxan's own pages carry no third-party name (the site rule), so the credit is deliberately not in `kit.css` or on the live site. If that is to change, it is a decision for the owner, not a default.

## Adding a part

1. Write it in the file that fits (controls, overlays, nav, agent) and `export` it; `index.js` re-exports the lot.
2. Style it in `kit.css` with a `k-` prefix, on `--k-*` tokens, with a visible focus ring and text at 4.5:1 or better (3:1 for large text).
3. Give it a name for assistive technology and keyboard use like its neighbours (arrow keys in lists, Escape on overlays).
4. Show it in `kit/gallery.js`.
5. Restamp: `python3 tools/roxan_chrome.py`.
