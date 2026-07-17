// ============================================================
// OEdu · AI service — "zero tools, infinite actions"
//
// There is deliberately NO tool directory. AI is exposed as actions
// attached to what the teacher is already looking at, and the context
// (class, subject, who was absent, the scores) is passed in — never asked.
//
// ── INTEGRATION SEAM ─────────────────────────────────────────
// Everything routes through callModel(). To connect a real LLM later,
// replace ONLY that function with a POST to your inference endpoint.
// PROMPTS below are the *production* system+user prompts, ready to send.
// LOCAL_DRAFTS are deterministic stand-ins used until the model is wired.
// ============================================================

export const AI = {
  connected: false,               // flip true once callModel hits a real model
  endpoint: "/api/ai/generate",   // your own backend, not a vendor SDK
  model: "oedu-draft-stub-v1",
};

const SYSTEM = [
  "You are OEdu's teaching assistant, embedded in a K–12 teacher's workspace.",
  "You already have the full classroom context: the class, subject, roster,",
  "attendance, scores, and what happened in the session. Never ask the teacher",
  "for information the app already knows. Write in the teacher's voice: warm,",
  "concrete, and brief. The teacher always reviews and approves before anything sends.",
].join(" ");

// ---- Production prompts (the exact instructions that will be sent) ----
export const PROMPTS = {
  parentNote: (c)=>({ system: SYSTEM, user:
    `Draft a short note home to ${c.studentName}'s guardians from ${c.teacher}. `+
    `Situation: ${c.studentName} has missed ${c.count} of the last 5 sessions of ${c.className}. `+
    `Goal: express care, avoid blame, propose a specific next step (a quick call this week). `+
    `Tone: ${c.tone||"warm"}. ${c.language&&c.language!=="English"?`Write it in ${c.language}.`:""} `+
    `Keep under 130 words. Sign as ${c.teacher}.` }),

  reportComment: (c)=>({ system: SYSTEM, user:
    `Write a report-card comment for ${c.studentName} in ${c.className}. `+
    `Evidence: term average ${c.gpa} GPA, ${c.attendance}% attendance`+
    `${c.recentScore!=null?`, most recent assessment ${c.recentScore}%`:""}. `+
    `Structure: one strength, one growth area, one concrete next-term focus. `+
    `Tone: ${c.tone||"warm"}. 2–3 sentences, specific, no clichés.` }),

  catchUpPack: (c)=>({ system: SYSTEM, user:
    `${c.names.length} students missed ${c.className} on ${c.date}: ${c.names.join(", ")}. `+
    `The session covered "${c.topic}" (${c.subject}). Build a catch-up pack: `+
    `a 3-line summary of what they missed, the 2 worked examples to review, `+
    `and 3 short tasks to close the gap before the next session. Address it to those students.` }),

  levelText: (c)=>({ system: SYSTEM, user:
    `Re-level this ${c.subject} passage titled "${c.title}" for ${c.names.length} students reading below `+
    `grade level (${c.names.join(", ")}): simplify vocabulary and sentence length to roughly `+
    `${c.targetLevel}, keep every key idea, and add 3 comprehension checks. Preserve meaning exactly.` }),

  planNext: (c)=>({ system: SYSTEM, user:
    `Plan the next ${c.subject} session for ${c.className}. Last session covered "${c.lastTopic}"`+
    `${c.unfinished?` but did not finish: ${c.unfinished}.`:"."} `+
    `Produce a 4-part lesson (recap, teach, guided practice, exit ticket) with timings, `+
    `plus one extension task and one scaffold for students who need support.` }),

  summarizeStudent: (c)=>({ system: SYSTEM, user:
    `Summarize ${c.studentName}'s term so far in ${c.className} for a parent-teacher conference: `+
    `${c.attendance}% attendance, ${c.gpa} GPA, risk flag "${c.risk}". `+
    `3–4 sentences, balanced, actionable.` }),

  iep: (c)=>({ system: SYSTEM, user:
    `Suggest classroom accommodations for ${c.studentName} in ${c.className} based on need: "${c.need}". `+
    `Return 4–6 concrete, implementable accommodations grounded in what this class actually does. `+
    `This is a teacher aid, not a legal IEP document — note that.` }),

  retone: (c)=>({ system: SYSTEM, user:
    `Rewrite the following in a ${c.tone} tone. Keep the facts and length. Return only the rewrite.\n\n${c.text}` }),

  translate: (c)=>({ system: SYSTEM, user:
    `Translate the following into ${c.language}, preserving tone and meaning. Return only the translation.\n\n${c.text}` }),
};

// ---- Local deterministic drafts (stand-in until the model is connected) ----
const LOCAL_DRAFTS = {
  parentNote: (c)=>{
    const first = c.studentName.split(" ")[0];
    const last = c.studentName.split(" ").slice(-1)[0];
    const t = (c.tone||"warm");
    const open = t==="formal" ? `Dear ${last} family,` : t==="concerned" ? `Dear ${last} family,` : `Hi ${last} family,`;
    let body = `I wanted to reach out because ${first} has now missed ${c.count} of the last 5 sessions of ${c.className}. `+
      `${first} is a valued part of the class and I'd like to help before the absences affect their progress. `+
      `Could we find ten minutes this week for a quick call to make a plan together? I'm happy to work around your schedule.`;
    if (t==="concerned") body = `I'm reaching out with some concern: ${first} has missed ${c.count} of the last 5 ${c.className} sessions. `+
      `I want to understand what's going on and make sure ${first} doesn't fall behind. Could we speak this week?`;
    let text = `${open}\n\n${body}\n\nWarm regards,\n${c.teacher}\nWestbrook Academy`;
    if (c.language && c.language!=="English") text = `〔${c.language} translation〕\n${text}`;
    return text;
  },
  reportComment: (c)=>{
    const first = c.studentName.split(" ")[0];
    const strength = c.gpa>=3.4 ? "consistently strong, well-organized work" : c.gpa>=2.9 ? "steady, capable work with real flashes of insight" : "genuine effort and a willingness to keep trying";
    const growth = c.attendance<85 ? "more consistent attendance would let that work compound" : "pushing into the harder extension tasks is the next step";
    return `${first} has shown ${strength} in ${c.className} this term (${c.attendance}% attendance). `+
      `The main growth area: ${growth}. Next term we'll focus on building independence and confidence in core skills.`;
  },
  catchUpPack: (c)=>{
    return `Catch-up pack — ${c.topic}  (${c.subject} · ${c.className})\nFor: ${c.names.join(", ")}\n\n`+
      `What you missed on ${c.date}:\n`+
      `• The core idea of ${c.topic}, and why it matters.\n`+
      `• Two worked examples we did together in class.\n\n`+
      `Before next session, please:\n`+
      `1. Watch the 6-minute recap (attached) and read the two examples.\n`+
      `2. Try practice problems 1–5 — check your answers against the key.\n`+
      `3. Write down one question to bring to office hours.\n\n`+
      `I've attached the slides. Come find me if anything's unclear — you've got this.`;
  },
  levelText: (c)=>{
    return `Leveled version — "${c.title}"  (target: ${c.targetLevel})\nFor: ${c.names.join(", ")}\n\n`+
      `[The passage, rewritten with shorter sentences and simpler words — every key idea kept intact.]\n\n`+
      `Check your understanding:\n1. In your own words, what is the main idea?\n`+
      `2. Find one word that was new to you. What does it mean here?\n3. What happens because of the main event?`;
  },
  planNext: (c)=>{
    return `Next session — ${c.subject} · ${c.className}\n`+
      `${c.unfinished?`Carries over: ${c.unfinished}\n`:""}\n`+
      `1. Recap ${c.lastTopic} — quick retrieval questions (8 min)\n`+
      `2. Teach${c.unfinished?`: finish ${c.unfinished}`:" the next idea"} (18 min)\n`+
      `3. Guided practice in pairs (16 min)\n`+
      `4. Exit ticket — 2 questions to check understanding (5 min)\n\n`+
      `Extension: a challenge problem for early finishers.\nScaffold: a worked-example sheet for students who need support.`;
  },
  summarizeStudent: (c)=>{
    const first = c.studentName.split(" ")[0];
    return `${first} is at ${c.gpa} GPA with ${c.attendance}% attendance in ${c.className} this term`+
      `${c.risk!=="ok"?`, and is currently flagged for follow-up`:""}. `+
      `${c.gpa>=3.2?`They engage well and produce reliable work.`:`They're capable but inconsistent — attendance is the biggest lever.`} `+
      `For the conference: celebrate the effort, agree one specific habit to build, and set a check-in date.`;
  },
  iep: (c)=>{
    const first = c.studentName.split(" ")[0];
    return `Classroom accommodations for ${first} — need: ${c.need}\n(Teacher aid, not a legal IEP document.)\n\n`+
      `• Seat ${first} near the front, away from high-traffic areas.\n`+
      `• Break multi-step tasks into a short checklist ${first} can tick off.\n`+
      `• Offer the leveled version of readings by default, no need to ask.\n`+
      `• Allow extra processing time before calling on ${first}; pre-warn questions.\n`+
      `• Provide a printed copy of key slides to reduce copying load.\n`+
      `• Quick daily check-in (30 seconds) to confirm ${first} knows the first step.`;
  },
  retone: (c)=> c.text,      // stub: model would rewrite; local keeps text, tag added by caller
  translate: (c)=> `〔${c.language}〕 ${c.text}`,
};

// ---- the single seam ----
async function callModel(prompt, meta){
  // TODO(model): wire the real LLM here — this is the ONLY function to change.
  //   const r = await fetch(AI.endpoint, { method:"POST", headers:{ "Content-Type":"application/json" },
  //     body: JSON.stringify({ prompt, action: meta.action, model: AI.model }) });
  //   return (await r.json()).text;
  await new Promise(res=>setTimeout(res, 420 + Math.random()*260)); // simulate "drafting…" latency
  const fn = LOCAL_DRAFTS[meta.action];
  return fn ? fn(meta.context) : "";
}

// ---- public API ----
export async function generate(action, context={}){
  const build = PROMPTS[action];
  const prompt = build ? build(context) : { system: SYSTEM, user: "" };
  const text = await callModel(prompt, { action, context });
  return { text, prompt, action, model: AI.model, connected: AI.connected };
}

export const ACTION_META = {
  parentNote:      { label:"Draft note home",        icon:"mail",   verb:"Send",   tone:true,  translate:true },
  reportComment:   { label:"Draft report comment",   icon:"report", verb:"Save",   tone:true,  translate:false },
  catchUpPack:     { label:"Build catch-up pack",     icon:"sparkle",verb:"Send to students", tone:false, translate:false },
  levelText:       { label:"Level for below-grade",   icon:"layers", verb:"Save to Library",   tone:false, translate:false },
  planNext:        { label:"Plan next session",       icon:"calendar",verb:"Save to Library",  tone:false, translate:false },
  summarizeStudent:{ label:"Summarize the term",      icon:"users",  verb:"Copy",   tone:false, translate:false },
  iep:             { label:"Accommodation ideas",     icon:"heart",  verb:"Save",   tone:false, translate:false },
};

export const TONES = ["warm","formal","concerned"];
export const LANGUAGES = ["English","Spanish","Arabic","Mandarin","Portuguese","French"];
