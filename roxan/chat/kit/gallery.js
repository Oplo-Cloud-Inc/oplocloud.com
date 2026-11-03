/* Every part of the kit, live, with sample content. Not part of the product: nothing here is your data. */
import { h, $ } from "../dom.js";
import * as K from "./index.js";

const { Button, IconButton, ButtonGroup, Badge, Kbd, Avatar, StatusDot, Divider, Spinner, Skeleton, SkeletonText, Progress, ProgressCircle, Meter, Field, Input, SearchField, NumberField,
  Switch, SwitchCard, Checkbox, CheckboxCard, RadioGroup, Chip, TagGroup, Select, Combobox, DatePicker, Calendar, FileUpload, Tabs, SegmentedControl, Breadcrumb, Accordion,
  TreeView, Table, StatCard, Menu, ContextMenu, Popover, Modal, Drawer, confirm, openPalette, Notice, Announcement, AgentThinking, AgentLog, ComposerLoader, NotificationCenter, Tooltip, initTips } = K;

initTips();
const root = $("#main");
const sec = (title, ...kids) => root.append(h("section", {}, h("h2", { text: title }), ...kids));
const cap = t => h("p", { class: "cap", text: t });
const row = (...k) => h("div", { class: "row-w" }, ...k);
const grid = (...k) => h("div", { class: "grid-2" }, ...k);
const log = (...a) => console.info("[kit]", ...a);

root.append(h("header", {}, h("p", { class: "label", text: "Roxan · interface kit" }), h("h1", { text: "Every part, on one page." }), h("p", { class: "fine", text: "Sample content only. This page is how each part is checked; the app uses the same functions." })));

/* ---------------------------------------------------------------- Buttons and marks */
sec("Buttons and marks",
  cap("Variants and sizes"),
  row(...["primary", "secondary", "ghost", "danger"].map(v => Button({ variant: v }, v[0].toUpperCase() + v.slice(1)))),
  row(...["md", "sm", "xs"].map(z => Button({ variant: "secondary", size: z, icon: "plus" }, `Size ${z}`)), Button({ trailing: "right" }, "Trailing"), Button({ loading: true, variant: "secondary" }, "Saving"), Button({ disabled: true }, "Disabled")),
  cap("Icon only (hover for a tooltip)"),
  row(...["copy", "edit", "trash", "search", "bell", "more"].map(i => Tooltip(IconButton({ "aria-label": i }, i), `${i[0].toUpperCase()}${i.slice(1)}`, { kbd: i === "search" ? "⌘K" : null })), IconButton({ size: "sm", "aria-label": "Close" }, "x"), IconButton({ size: "xs", "aria-label": "Close" }, "x")),
  cap("Group, badge, kbd, avatar, status dot, spinner"),
  row(ButtonGroup({ "aria-label": "View" }, Button({ variant: "secondary", size: "sm" }, "Day"), Button({ variant: "secondary", size: "sm" }, "Week"), Button({ variant: "secondary", size: "sm" }, "Month")),
    Badge({}, "12"), Badge({ tone: "solid" }, "New"), Badge({ tone: "outline" }, "Live"), Badge({ tone: "dashed" }, "Next"), Kbd("⌘", "K"), Kbd("esc"),
    Avatar({ size: "xs", initials: "R" }), Avatar({ size: "sm", initials: "SJ" }), Avatar({ size: "md", initials: "SJ" }), Avatar({ size: "lg", initials: "SJ" }),
    ...["idle", "working", "paused", "ok", "error"].map(s => h("span", { class: "row-w g-gap6" }, StatusDot({ state: s }), h("span", { class: "fine", text: s }))), Spinner()),
  Divider({ label: "or" }));

/* ---------------------------------------------------------------- Fields */
const zones = (Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : ["UTC"]).map(z => ({ value: z, label: z.replace(/_/g, " ") }));
sec("Fields",
  grid(
    h("div", { class: "box g-s14" },
      Field({ label: "Name", hint: "What Roxan calls itself." }, Input({ placeholder: "Roxan" })),
      Field({ label: "Search" }, SearchField({ placeholder: "Search chats", hint: Kbd("⌘", "K") })),
      Field({ label: "Email", error: "That does not look like an address." }, Input({ placeholder: "you@example.com", value: "nope" })),
      Field({ label: "Notes" }, h("textarea", { class: "field", rows: 3, placeholder: "Anything else" })),
      Field({ label: "Times a day" }, NumberField({ value: 3, min: 1, max: 12 })),
      Field({ label: "At" }, h("input", { type: "time", value: "09:30" }))),
    h("div", { class: "box g-s14" },
      Field({ label: "Frequency" }, Select({ value: "daily", label: "Frequency", options: [{ value: "once", label: "Once" }, { value: "daily", label: "Every day", hint: "At the time you pick" }, { value: "weekly", label: "Every week" }, { value: "off", label: "Off", disabled: true }] })),
      Field({ label: "Time zone" }, Combobox({ options: zones, value: "UTC", placeholder: "Search time zones", label: "Time zone" })),
      Field({ label: "Day" }, DatePicker({ placeholder: "Pick a day" })),
      cap("Calendar"), Calendar({}))),
  cap("Switch, checkbox, radio"),
  row(Switch({ label: "Learn from chats", checked: true }), Switch({ label: "Paused" }), Checkbox({ label: "Remember me", checked: true }), Checkbox({ label: "Disabled", disabled: true })),
  grid(
    h("div", { class: "g-s8" }, SwitchCard({ label: "Quiet hours", hint: "No notifications overnight.", checked: true }), CheckboxCard({ label: "Email me a summary", hint: "Once a day." })),
    RadioGroup({ value: "balanced", label: "How much it learns", card: true, options: [{ value: "light", label: "Light", hint: "Only what you tell it" }, { value: "balanced", label: "Balanced", hint: "What comes up often" }, { value: "eager", label: "Eager", hint: "Everything useful" }] })),
  cap("Chip, tag group, drop zone"),
  row(Chip({ label: "notes.txt", icon: "file", onremove: () => log("removed") }), Chip({ label: "Projects" })),
  TagGroup({ items: ["travel", "work", "family"], onremove: t => log("remove", t) }),
  FileUpload({ hint: "Text files only", onfiles: f => log("files", f.map(x => x.name)) }));

/* ---------------------------------------------------------------- Feedback */
const ongoing = Progress({ label: "Goal: plan the move", value: 3, max: 5, valueLabel: "3 of 5 steps" });
sec("Feedback",
  grid(h("div", { class: "g-s18" }, ongoing, Progress({ label: "Working", valueLabel: "" }), Meter({ label: "Chats today", value: 120, max: 300, valueLabel: "120 of 300" }), Meter({ label: "Runs today", value: 27, max: 30, valueLabel: "27 of 30" })),
    h("div", { class: "g-s10" }, Skeleton({ w: 160, h: 16 }), SkeletonText(3), row(Skeleton({ shape: "circle" }), Skeleton({ w: 120, h: 12 })))),
  cap("Notice"),
  h("div", { class: "g-s10 g-w520" }, ...["info", "ok", "warn", "error"].map(t => Notice({ tone: t, title: `${t[0].toUpperCase()}${t.slice(1)} notice`, text: "A line of what happened.", href: "#/", onclose: () => log("dismiss", t) }))),
  cap("Announcement"),
  Announcement({ text: "You are offline. Roxan will catch up when you are back.", action: { label: "Retry", onclick: () => log("retry") }, onclose: () => {} }),
  cap("Progress: three bar sizes, a line of help, and the ring (16, 24 and 32px; with no value it turns)"),
  grid(h("div", { class: "g-s18" }, Progress({ size: "sm", label: "Small", value: 30 }), Progress({ label: "Medium, the default", value: 55 }), Progress({ size: "lg", label: "Large", value: 80 }),
      Progress({ label: "Onboarding", value: 3, max: 5, valueLabel: "3 of 5 steps", description: "Two more and it is done." })),
    row(...["sm", "md", "lg"].map(z => ProgressCircle({ size: z, value: 64, label: `Ring ${z}` })), ProgressCircle({ size: "lg", label: "Syncing" }), ProgressCircle({ value: 0, label: "Nothing yet" }), ProgressCircle({ size: "lg", value: 100, label: "Done" }))),
  cap("Thinking: the four marks (wave, spin, stars, infinity), then a tone, and the label with and without its light"),
  row(...["wave", "spin", "stars", "infinity"].map(v => AgentThinking({ variant: v, label: v[0].toUpperCase() + v.slice(1) })),
    AgentThinking({ variant: "spin", tone: "primary", label: "Searching your notes" }), AgentThinking({ variant: "wave", shimmer: false, timer: false, label: "Plain label, no seconds" })),
  cap("Thinking and log"),
  grid(AgentThinking({ label: "Reading your notes", variant: "infinity" }), AgentLog({ steps: [{ text: "Looked up your calendar", state: "ok" }, { text: "Tried to open the shared file", sub: "It is not shared with this account.", state: "no" }, { text: "Waiting for you to approve the email", state: "wait" }, { text: "Drafting the reply", state: "run" }] })));

/* ---------------------------------------------------------------- Overlays */
const menuItems = () => [{ heading: "Chat" }, { label: "Rename", icon: "edit", kbd: "R", onselect: () => log("rename") }, { label: "Move to project", icon: "projects", onselect: () => log("move") }, { label: "Copy link", icon: "link", checked: false }, { divider: true }, { label: "Delete", icon: "trash", danger: true, onselect: () => log("delete") }];
const menuBtn = Button({ variant: "secondary", icon: "more" }, "Menu");
Menu(menuBtn, menuItems);
const popBtn = Popover(Button({ variant: "secondary", icon: "info" }, "Popover"), close => h("div", { class: "g-s10 g-w260" }, h("p", { class: "k-t-body-m", text: "Anchored panel" }), h("p", { class: "fine", text: "Any content goes here. Escape closes it and puts focus back." }), Button({ size: "sm", onclick: close }, "Got it")), {});
sec("Overlays",
  row(menuBtn, popBtn,
    Button({ variant: "secondary", onclick: () => Modal({ title: "Invite someone", description: "They get an email with a link.", body: Field({ label: "Email" }, Input({ placeholder: "name@example.com", autofocus: true })), footer: [Button({ variant: "secondary" }, "Cancel"), Button({}, "Send")] }) }, "Open dialog"),
    Button({ variant: "secondary", onclick: async () => log("confirmed:", await confirm({ title: "Delete this project?", description: "Its chats stay, but they leave the project.", yes: "Delete project", no: "Keep it", danger: true })) }, "Confirm"),
    Button({ variant: "secondary", onclick: () => Drawer({ title: "Details", description: "A panel from the edge.", body: h("p", { class: "fine", text: "Use it for the thing you opened from a row." }), footer: [Button({ variant: "secondary" }, "Close")] }) }, "Open drawer"),
    Button({ variant: "secondary", icon: "search", onclick: () => openPalette(() => [{ title: "Go to", items: [{ label: "Today", icon: "home", kbd: "G T" }, { label: "Goals", icon: "goals" }, { label: "Memory", icon: "memory" }] }, { title: "Do", items: [{ label: "New chat", icon: "plus", onselect: () => log("new chat") }, { label: "Pause Roxan", icon: "pause" }] }]) }, "Command palette")),
  cap("Right-click here"),
  ContextMenu(h("div", { class: "ctx", tabindex: 0, text: "Right-click, or press the menu key" }), menuItems),
  cap("Notification centre"),
  row(((b) => { b.set([{ title: "Approve the email to Dana", text: "It is waiting for you.", time: "5 min ago", href: "#/", tone: "warn" }, { title: "Routine ran", text: "Morning summary", time: "2 h ago", tone: "ok" }], 2); return b; })(NotificationCenter({}))));

/* ---------------------------------------------------------------- Navigation and data */
const rows = [{ name: "Morning summary", when: "Every day, 08:00", state: "On" }, { name: "Weekly review", when: "Fridays, 16:00", state: "On" }, { name: "Check the lease", when: "Once, 3 Dec", state: "Off" }];
const tree = TreeView({ label: "Projects", open: new Set(["p1"]), current: "c2", render: n => h("span", { class: "t", text: n.label }), nodes: [{ id: "p1", label: "Moving house", children: [{ id: "c1", label: "Boxes and labels" }, { id: "c2", label: "Utilities" }] }, { id: "p2", label: "Taxes", children: [{ id: "c3", label: "Receipts" }] }, { id: "c4", label: "A chat with no project" }] });
const loaderInner = h("div", { class: "composer" }, h("div", { class: "composer-row" }, h("textarea", { rows: 1, placeholder: "Ask Roxan" }), Button({ size: "sm" }, "Send")));
const loader = ComposerLoader(loaderInner);
const tunedInner = h("div", { class: "composer" }, h("div", { class: "composer-row" }, h("textarea", { rows: 1, placeholder: "Ask Roxan" }), Button({ size: "sm" }, "Send")));
const tuned = ComposerLoader(tunedInner, { speed: 1.6, arc: 90, reverse: true, intensity: 0.7, line: 2, radius: 12 });
sec("Navigation and data",
  cap("Tabs, vertical (how Settings opens over a page)"),
  Tabs({ label: "Sections, down the side", vertical: true, tabs: [{ id: "a", label: "General", icon: "settings", panel: () => h("p", { class: "fine", text: "The first section, built when it first shows." }) }, { id: "b", label: "Notifications", icon: "bell", panel: () => h("p", { class: "fine", text: "The second. Up and down move between sections." }) }, { id: "c", label: "Your data", icon: "download", panel: () => h("p", { class: "fine", text: "The third." }) }] }),
  cap("Tabs"),
  Tabs({ label: "Sections", tabs: [{ id: "a", label: "Overview", panel: () => h("p", { class: "fine", text: "The first tab, built when it first shows." }) }, { id: "b", label: "Activity", count: 4, panel: () => h("p", { class: "fine", text: "The second." }) }, { id: "c", label: "Settings", icon: "settings", panel: () => h("p", { class: "fine", text: "The third." }) }] }),
  row(SegmentedControl({ label: "View", options: [{ value: "list", label: "List" }, { value: "web", label: "Web" }], value: "list" }), SegmentedControl({ label: "Range", size: "sm", options: [{ value: "d", label: "Day" }, { value: "w", label: "Week" }, { value: "m", label: "Month" }], value: "w" })),
  Breadcrumb([{ label: "Projects", href: "#/projects" }, { label: "Moving house", href: "#/projects" }, { label: "Utilities" }]),
  grid(Accordion({ items: [{ id: "1", title: "What does Roxan keep?", body: h("p", { class: "fine", text: "What you tell it to, in your account." }), open: true }, { id: "2", title: "Can I turn learning off?", body: h("p", { class: "fine", text: "Yes, in Settings." }) }, { id: "3", title: "Who can see my vault?", body: h("p", { class: "fine", text: "Only this device." }) }] }), tree),
  Table({ label: "Routines", columns: [{ key: "name", label: "Name", sort: true }, { key: "when", label: "When" }, { key: "state", label: "State", sort: true, render: r => Badge({ tone: r.state === "On" ? "solid" : "dashed" }, r.state) }], rows, onrow: r => log("row", r.name) }),
  h("div", { class: "grid-2" }, StatCard({ icon: "goals", label: "Open goals", value: 4, note: "1 due this week", href: "#/goals" }), StatCard({ icon: "needs", label: "Needs you", value: 2 }), StatCard({ icon: "schedule", label: "Routines on", value: 3 })),
  cap("Composer loader (a thin line runs round the edge while a reply is on the way)"),
  loader, row(Button({ variant: "secondary", size: "sm", onclick: () => { loader.active = !loader.active; } }, "Toggle")),
  cap("Tuned: speed 1.6s, arc 90°, reversed, intensity 0.7, line 2px, radius 12px (one white line; Roxan has no colour or glow here)"),
  tuned, row(Button({ variant: "secondary", size: "sm", onclick: () => { tuned.active = !tuned.active; } }, "Toggle")));

document.documentElement.dataset.kit = "ready";
