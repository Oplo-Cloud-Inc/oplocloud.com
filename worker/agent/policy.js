/* What Roxan may do without asking.

   Every tool belongs to a capability. A capability is allowed, asked about, or
   blocked. The person's rules override the defaults, and the strictest rule
   that applies wins: a block beats an ask, an ask beats an allow. A rule can be
   narrowed to a website (reading pages only).

   Two things the rules cannot loosen:
   - A run that has read something it did not write (a web page, an attachment)
     may not start anything that lasts or keep anything: those four capabilities
     are asked about, whatever the rules say. Text in a page is data; it must not
     be able to talk Roxan into an action.
   - A run nobody is watching cannot keep notes about the person (it has nothing
     the person said to rest them on), so it asks. */

// effect: what happens when no rule applies. `learning` means "allow if learning is on, otherwise ask".
export const CAPS = [
  { id: "web.read", label: "Read web pages", hint: "Fetch a public page you point it at, the way a browser would.", effect: "allow", site: true },
  { id: "web.search", label: "Search the web", hint: "Look something up with a web search. It gets back titles and addresses; reading a page is its own permission.", effect: "allow" },
  { id: "shell.run", label: "Use a cloud computer", hint: "Run commands on a private cloud computer with internet access, to look things up and work them out. Nothing of yours is on it.", effect: "allow" },
  { id: "goal.write", label: "Keep goals", hint: "Create goals and update their plans.", effect: "allow" },
  { id: "panel.write", label: "Write panels", hint: "Documents, checklists and tables it keeps for you.", effect: "allow" },
  { id: "idea.add", label: "Suggest ideas", hint: "Put an idea in your list. It never acts on one.", effect: "allow" },
  { id: "routine.remind", label: "Set reminders", hint: "Tell you something at a time you chose.", effect: "allow" },
  { id: "routine.manage", label: "Pause or remove routines", hint: "Change a routine that already exists.", effect: "allow" },
  { id: "routine.create", label: "Start routines", hint: "Work that runs on its own, on a schedule or when a page changes.", effect: "ask" },
  { id: "memory.write", label: "Keep notes about you", hint: "Short notes it is shown with your messages.", effect: "learning" },
  { id: "memory.forget", label: "Forget notes", hint: "Remove a note.", effect: "ask" },
  { id: "specialty.write", label: "Save specialties", hint: "A way you like something done.", effect: "learning" },
  { id: "handoff.create", label: "Save tasks for a browser", hint: "A Handoff waits in a list. Nothing runs.", effect: "ask" },
  { id: "notify.send", label: "Message you on its own", hint: "Only when it is new and worth your attention.", effect: "allow" },
];
export const CAP = Object.fromEntries(CAPS.map(c => [c.id, c]));

const STRICT = new Set(["routine.create", "routine.manage", "memory.write", "specialty.write", "handoff.create"]);
const RANK = { allow: 0, ask: 1, block: 2 };

// The capability a tool call falls under.
export function capOf(tool, input = {}) {
  switch (tool) {
    case "read_page": case "browse": return "web.read";
    case "search": return "web.search";
    case "shell": return "shell.run";
    case "goal": return "goal.write";
    case "panel": return "panel.write";
    case "idea": return "idea.add";
    case "remember": return "memory.write";
    case "forget": return "memory.forget";
    case "specialty": return "specialty.write";
    case "handoff": return "handoff.create";
    case "notify": return "notify.send";
    case "routine": return "routine.manage";
    case "schedule": return input.mode === "remind" ? "routine.remind" : "routine.create";
    default: return null;                 // ask, and anything unknown: no capability, no permission
  }
}

const hostOf = u => { try { return new URL(u).hostname.toLowerCase(); } catch { return ""; } };
const covers = (rule, input) => {
  const d = String(rule.domain || "").toLowerCase().replace(/^\*?\.?/, "");
  if (!d) return true;
  const host = hostOf(input.url);
  return host === d || host.endsWith("." + d);
};

// { effect: "allow" | "ask" | "block", cap, why } for one call.
export function decide(tool, input, { rules = [], learning = true, tainted = false, background = false } = {}) {
  if (tool === "ask") return { effect: "allow", cap: null, why: "Asking costs nothing." };
  const cap = capOf(tool, input);
  if (!cap) return { effect: "block", cap: null, why: "Roxan has no such tool." };
  let effect = CAP[cap].effect === "learning" ? (learning && !background ? "allow" : "ask") : CAP[cap].effect, why = "Roxan's default.";
  for (const r of rules) {
    if (r.capability !== cap || r.state === "removed" || !covers(r, input)) continue;
    if (RANK[r.effect] > RANK[effect] || why === "Roxan's default.") { effect = r.effect; why = "Your rule."; }
  }
  // Loosening a default is what a rule is for; tightening one that was already asked about never goes below ask.
  if (tainted && STRICT.has(cap) && effect === "allow") return { effect: "ask", cap, why: "It read something you did not write, so it asks first." };
  return { effect, cap, why };
}
