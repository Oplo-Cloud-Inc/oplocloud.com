/* ==========================================================================
   Introduction to Business — Unit 5, Business Writing.
   Sections 5.1–5.6.

   Written from the Boundless Textbook the same way as Media Arts Units 5 and 6:
   curated rather than copied. Every definition a section tests on is here,
   every idea the checks need is here, and the padding around them is not.

   ----------------------------------------------------------------- Images
   Diagrams are drawn for OEdu as SVG. Photographs, where used, are from Wikimedia
   Commons, each credited beside the figure.
   ========================================================================== */
window.OPLO_BIZ5 = (function () {
  "use strict";

  var P = function (t) { return { k: "p", t: t }; };
  var H = function (t) { return { k: "h", t: t }; };
  var D = function (t, d) { return { k: "def", t: t, d: d }; };
  var Q = function (t, s) { return { k: "quote", t: t, s: s }; };
  var N = function (t) { return { k: "note", t: t }; };
  var L = function (t, items) { return { k: "list", t: t, items: items }; };
  var S = function (n, d) { return { k: "stat", n: n, d: d }; };
  var F = function (o) {
    return { k: "fig", imgs: o.imgs, cap: o.cap, credits: o.credits,
             cols: o.cols || null, natural: !!o.natural,
             diagram: !!o.diagram, size: o.size || null };
  };

  var M = "media/biz1/";
  var OEDU = [{ what: "Diagram", by: "OEdu" }];

  return [{
    n: "5.1", t: "Business Communication", kicker: "How we share",
    stand: "Communication is not sending a message. It is the " +
           "message being understood.",
    mins: 8,
    objectives: ["Explain the communication process",
                 "Identify communication channels and their uses",
                 "Recognise barriers to effective communication"],
    body: [
      H("The communication process"),
      P("Communication is a loop, not a one-way trip. A " +
        "<b>sender</b> encodes a message, sends it through a " +
        "<b>channel</b>, and the <b>receiver</b> decodes it. " +
        "<b>Feedback</b> closes the loop. <b>Noise</b> — anything " +
        "that distorts the message — disrupts it at any point."),
      F({ imgs: [{ src: M + "5-1-comm-process.svg", w: 640, h: 280,
                   alt: "A flow diagram: Sender -> Message (via channel) -> " +
                        "Receiver. A feedback loop returns from Receiver " +
                        "to Sender. An arrow labelled 'noise' enters the " +
                        "channel." }],
         cap: "Communication is a loop, not a broadcast. " +
              "Feedback tells the sender whether the message was " +
              "received as intended.",
         credits: OEDU, diagram: true }),
      D("Encoding", "The sender translating ideas into words or " +
        "symbols."),
      D("Decoding", "The receiver interpreting the message."),
      D("Feedback", "The receiver's response, which lets the " +
        "sender know whether the message was understood."),
      D("Noise", "Anything that interferes with understanding: " +
        "physical noise, jargon, assumptions, emotional state."),
      H("Channels and medium"),
      D("Communication channel", "The medium through which a message " +
        "travels: email, meeting, report, phone call, face-to-face."),
      P("The right channel depends on the message. Simple updates " +
        "work by email. Difficult conversations — feedback, conflict, " +
        "layoffs — need face-to-face or at least a phone call. " +
        "Rich media (video, in-person) carry more cues; lean media " +
        "(email, text) carry fewer."),
      H("Barriers to communication"),
      L("Common barriers", [
        ["Language and jargon", "Technical words the receiver " +
         "does not understand."],
        ["Assumptions", "Presuming you know what the other " +
         "person thinks or feels."],
        ["Emotional state", "Anger, fear, or stress distorting " +
         "both sending and receiving."],
        ["Cultural differences", "Norms for directness, " +
         "hierarchy, and silence vary widely."]
      ]),
      Q("The section in one line.", "Effective communication " +
         "means the meaning sent equals the meaning received.")
    ],
    check: { q: "Feedback in the communication process",
             opts: ["Is only needed for negative messages",
                    "Closes the loop by letting the sender know " +
                    "the message was understood",
                    "Should always be written, never verbal"],
             right: 1,
             why: "Feedback completes the communication loop. " +
                  "Without it, the sender cannot verify that the " +
                  "message was received and understood as intended." }
  }, {
    n: "5.2", t: "Written Communication in Business", kicker: "Writing right",
    stand: "Business writing is not about showing you can write. " +
           "It is about getting the reader to do what you need.",
    mins: 9,
    objectives: ["Apply principles of clear business writing",
                 "Distinguish email, memo, and report formats",
                 "Revise for clarity and conciseness"],
    body: [
      H("Principles of clear writing"),
      P("Business writing is read for a reason — usually to " +
        "decide, act, or inform. Every sentence should serve that " +
        "purpose. The best business writing is clear, concise, " +
        "and correct."),
      L("The three Cs", [
        ["Clear", "Say exactly what you mean in plain language. " +
         "Avoid jargon unless your reader shares it."],
        ["Concise", "Use the fewest words necessary. Cut " +
         "filler, redundancy, and throat-clearing openers."],
        ["Correct", "Grammar, spelling, facts, and figures must " +
         "be right. Errors erode credibility instantly."]
      ]),
      P("One rule that changes everything: write the " +
        "<b>conclusion first</b>. Readers often scan the beginning " +
        "and the end. If the conclusion is buried, they miss it."),
      H("Email writing"),
      D("Business email", "A short written message sent electronically, " +
        "usually for internal or quick external communication."),
      L("Anatomy of an effective email", [
        ["Subject line", "A clear, specific subject. 'Meeting " +
         "rescheduled to Thursday 2pm' beats 'Update'."],
        ["Greeting", "Appropriate to the relationship: 'Dear', " +
         "'Hi', or first name."],
        ["Body", "Front-load the key point. Short paragraphs."],
        ["Action required", "State what you need from the reader " +
         "and by when."],
        ["Signature", "Name, title, contact details."]
      ]),
      H("Memos and reports"),
      D("Memo", "A short internal communication, usually on a " +
        "specific topic with a clear directive."),
      D("Report", "A structured document presenting findings, " +
        "analysis, and recommendations."),
      F({ imgs: [{ src: M + "5-4-report-types.svg", w: 420, h: 300,
                   alt: "Five horizontal bars showing report types: " +
                        "Informational, Analytical, Research, Proposal, " +
                        "Progress — each with a brief description." }],
         cap: "Reports come in different types. An informational " +
              "report gives facts; a proposal recommends action; " +
              "a progress report tracks status against plan.",
         credits: OEDU, diagram: true }),
      P("Choosing the right type matters. A request for a budget " +
        "needs a proposal. A status update needs a progress report. " +
        "A factual survey needs an informational report."),
      Q("The section in one line.", "Put what the reader needs " +
         "to do first — everything else is secondary.")
    ],
    check: { q: "The principle of 'conclusion first' in business " +
                 "writing works because",
             opts: ["Readers prefer creative writing",
                    "Readers often scan the beginning and end for " +
                    "the key point",
                    "Managers require it by policy"],
             right: 1,
             why: "Busy readers scan, especially at the beginning " +
                  "and end. Placing the conclusion first ensures " +
                  "they get the key point even if they read " +
                  "nothing else." }
  }, {
    n: "5.3", t: "Electronic Communication", kicker: "Digital tools",
    stand: "Electronic communication works when you choose the " +
           "right tool for the message — not just the fastest one.",
    mins: 8,
    objectives: ["Identify electronic communication tools",
                 "Apply netiquette and professional standards",
                 "Evaluate virtual collaboration strategies"],
    body: [
      H("Electronic communication tools"),
      D("Email", "Asynchronous, documentable, suited for " +
        "non-urgent messages that need a record."),
      D("Instant messaging", "Synchronous, informal, suited for " +
        "quick questions and team chat."),
      D("Video conferencing", "Synchronous, richest in cues, " +
        "suited for meetings, complex discussions, and relationship-building."),
      D("Project management tools", "Asynchronous, structured, " +
        "suited for task tracking, deadlines, and shared documents."),
      P("Each tool has a richness spectrum. Email is lean " +
        "(text only). Video is rich (face, voice, gestures). " +
        "Choose based on what the message needs."),
      H("Netiquette"),
      D("Netiquette", "Etiquette for electronic communication: " +
        "the norms of respectful, professional online behaviour."),
      L("Netiquette rules", [
        ["Be concise and clear", "Long, rambling messages get " +
         "skimmed or ignored."],
        ["Avoid ALL CAPS", "It reads as shouting."],
        ["Use subject lines", "Empty subjects get archived unseen."],
        ["Proofread before sending", "Recall is not always " +
         "possible; what is sent cannot be unsent."],
        ["Reply in a timely manner", "Acknowledgement within " +
         "24 hours is professional."],
        ["Separate reply from reply-all", "Not everyone needs " +
         "every update."]
      ]),
      H("Virtual teams"),
      P("Virtual teams work across locations and time zones. " +
        "They succeed with clear norms, regular check-ins, shared " +
        "documents, and deliberate relationship-building."),
      L("Virtual team practices", [
        ["Over-communicate", "Assume less context; say more, not less."],
        ["Document decisions", "Write things down so absent " +
         "members are not excluded."],
        ["Respect time zones", "Rotate meeting times, share " +
         "asynchronous updates."],
        ["Build trust", " occasional video socials matter more " +
         "than you think."]
      ]),
      Q("The section in one line.", "Choose the tool, then " +
         "communicate like a human.")
    ],
    check: { q: "The best channel for a sensitive conversation " +
                 "(like giving critical feedback) is",
             opts: ["Email",
                    "Instant message",
                    "Face-to-face or video call"],
             right: 2,
             why: "Sensitive conversations need tone, facial " +
                  "expression, and the ability to read reactions. " +
                  "These cues are only available in synchronous " +
                  "channels with video or in person." }
  }, {
    n: "5.4", t: "Business Reports and Proposals", kicker: "Tell them",
    stand: "Reports tell. Proposals persuade. " +
           "Both need structure, evidence, and a clear ask.",
    mins: 9,
    objectives: ["Structure business reports and proposals",
                 "Use evidence and analysis to support conclusions",
                 "Tailor writing to the audience and purpose"],
    body: [
      H("Reports"),
      P("A report presents information and analysis to help " +
        "decisions. The structure is standard across " +
        "organisations because it matches how readers process " +
        "information."),
      L("Report structure", [
        ["Title page", "Report title, author, date, organisation."],
        ["Executive summary", "The whole report in a paragraph. " +
         "Write it last."],
        ["Introduction", "Purpose, scope, background."],
        ["Method", "How information was gathered."],
        ["Findings", "Results, data, evidence."],
        ["Discussion", "What the findings mean."],
        ["Conclusion", "What it all means for the decision."],
        ["Recommendations", "What should be done, and why."],
        ["References / appendices", "Sources and supporting data."]
      ]),
      H("Proposals"),
      D("Proposal", "A document that persuades a client or " +
        "stakeholder to approve a course of action — a project, " +
        "a purchase, a partnership."),
      P("Proposals answer: what do you propose, why is it " +
        "worth doing, what will it cost, and what happens next?"),
      F({ imgs: [{ src: M + "5-4-report-types.svg", w: 420, h: 300,
                   alt: "A chart showing different report types: " +
                        "Informational, Analytical, Research, " +
                        "Proposal, Progress — with brief " +
                        "descriptions of each." }],
         cap: "Report types serve different purposes. " +
              "Know which one the situation requires before " +
              "writing a single word.",
         credits: OEDU, diagram: true }),
      H("Evidence and persuasion"),
      P("Good reports use evidence: data, quotes, sources, " +
        "examples. Good proposals use evidence to build a case, " +
        "then address objections before they arise."),
      L("Persuasion principles", [
        ["Lead with the reader's problem", "Frame your " +
         "proposal as the solution to their need."],
        ["Anticipate objections", "Address cost, risk, " +
         "alternatives proactively."],
        ["Be specific", "Vague proposals are not credible. " +
         "Names, numbers, dates."]
      ]),
      Q("The section in one line.", "Structure tells them what " +
         "you found; persuasion gets them to agree with it.")
    ],
    check: { q: "The executive summary in a report should",
             opts: ["Be written first, before the rest",
                    "Summarise the entire report and be written " +
                    "last",
                    "Appear after the conclusion and recommendations"],
             right: 1,
             why: "The executive summary is written last because " +
                  "it summarises the entire report — including " +
                  "findings, conclusions, and recommendations. " +
                  "It is often the only part decision-makers read." }
  }, {
    n: "5.5", t: "Presentation Skills", kicker: "Show and tell",
    stand: "A presentation is a conversation you " +
           "direct, not a document you read.",
    mins: 8,
    objectives: ["Design effective presentation slides",
                 "Deliver with confidence and audience awareness",
                 "Handle questions and unexpected situations"],
    body: [
      H("Slide design"),
      P("Slides support the speaker; they are not the speech. " +
        "A slide full of text invites the audience to read instead " +
        "of listening. Keep it visual, keep it sparse."),
      F({ imgs: [{ src: M + "5-5-presentation.svg", w: 420, h: 340,
                   alt: "A diagram of three principles: Visual (6-8 " +
                        "words per line, large font, 20% text, 80% " +
                        "visual), Oral (slides are cues not scripts, " +
                        "speak to the audience), and Structure " +
                        "(Tell-Show-Tell again, opening hook, close " +
                        "WIFM)." }],
         cap: "Three principles for every slide: visual (keep it " +
              "simple), oral (you are the presentation), and structure " +
              "(tell them what you'll tell them, tell them, tell " +
              "them what you told them).",
         credits: OEDU, diagram: true }),
      L("Slide rules", [
        ["One idea per slide", "If you need a heading to explain " +
         "the slide, split it."],
        ["Six to eight words per line", "More than that and " +
         "people read instead of listen."],
        ["20% text, 80% visual", "Charts, images, and diagrams " +
         "over paragraphs."],
        ["Large font", "Small text is unreadable from the back."]
      ]),
      H("Delivery"),
      P("Delivery matters as much as content. The same " +
        "information, spoken with energy and eye contact, lands " +
        "differently than read from a screen."),
      L("Delivery tips", [
        ["Practise out loud", "You hear timing and awkward " +
         "phrases you miss when reading silently."],
        ["Open with a hook", "A question, a surprising fact, or " +
         "a short story."],
        ["Eye contact", "Speak to individuals, not the wall."],
        ["Pause", "A pause after a key point gives it weight."],
        ["Close with WIFM", "'What's in it for me?' — tell the " +
         "audience what they take away."]
      ]),
      H("Handling questions"),
      P("Questions are not interruptions — they are engagement. " +
        "If you do not know, say so: 'I'll find that out and follow " +
        "up.' Never fake an answer."),
      L("Q&A strategies", [
        ["Repeat the question", "So everyone hears it and you " +
         "have time to think."],
        ["Answer briefly", "Long answers lose the room."],
        ["Bridge back", "After a question, connect to your next " +
         "point: 'That ties into my next slide...'"]
      ]),
      Q("The section in one line.", "You are the presentation; " +
         "slides are your cue cards.")
    ],
    check: { q: "The 'WIFM' in presentation closing stands for",
             opts: ["What I Felt Meeting",
                    "What's In It For Me (the audience)",
                    "When I Finish My Presentation"],
             right: 1,
             why: "WIFM means 'What's in it for me?' — the " +
                  "audience's key question. Ending with the answer " +
                  "ensures they remember what they take away." }
  }, {
    n: "5.6", t: "Digital Communication and Social Media", kicker: "Online presence",
    stand: "Social media is not a megaphone — it is a " +
           "conversation you join, not one you shout into.",
    mins: 8,
    objectives: ["Develop a social media strategy",
                 "Manage professional online presence",
                 "Identify risks and responsibilities in digital communication"],
    body: [
      H("Social media for business"),
      D("Social media strategy", "A plan for how a business uses " +
        "social platforms to achieve goals — brand awareness, " +
        "leads, customer service, or community."),
      P("Posting for the sake of posting is not a strategy. " +
        "Start with the goal, then choose the platform and content " +
        "type that serves it."),
      L("Platform characteristics", [
        ["LinkedIn", "Professional networking, B2B, recruiting, " +
         "thought leadership."],
        ["Instagram", "Visual brands, lifestyle, younger demographics."],
        ["X (Twitter)", "Real-time updates, news, public " +
         "conversation."],
        ["TikTok", "Short-form video, younger audiences, " +
         "trend-driven."]
      ]),
      H("Professional online presence"),
      P("Your online presence is your resume that never sleeps. " +
        "Employers, clients, and partners check it. Managing it " +
        "means being intentional about what is public."),
      D("Digital footprint", "The trail of data you leave " +
        "online — posts, comments, photos, searches."),
      L("Managing your presence", [
        ["Consistency", "A coherent professional identity across " +
         "platforms."],
        ["Active curation", "Remove or hide content that " +
         "undermines your professional image."],
        ["Engagement", "Respond to comments, contribute to " +
         "discussions — presence is not just having a profile."]
      ]),
      H("Risks and responsibilities"),
      L("Digital risks", [
        ["Misinformation", "Sharing unverified information damages " +
         "credibility."],
        ["Data privacy", "Respecting customer and user data " +
         "obligations."],
        ["Cybersecurity", "Phishing, weak passwords, " +
         "unsecured Wi-Fi."],
        ["Reputation", "One post can go viral — for good or bad."]
      ]),
      N("<b>A reality check.</b> The internet is forever. " +
        "Screenshots, archives, and reposts mean that " +
        "anything you write digitally may outlast its context. " +
        "Before posting, ask: would I be comfortable if this was " +
        "read by a client, a reporter, or a future employer?"),
      Q("The section in one line.", "Build presence with purpose, " +
         "not just volume.")
    ],
    check: { q: "A business social media strategy should begin with",
             opts: ["Choosing the platform with the most users",
                    "Defining the goals the platform will serve",
                    "Posting daily to build an audience"],
             right: 1,
             why: "A strategy begins with goals: what does the " +
                  "business want from social media? Brand awareness, " +
                  "leads, customer service? The goal determines the " +
                  "platform, content type, and how success is measured." }
  }];
})();
