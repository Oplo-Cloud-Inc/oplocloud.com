/* ============================================================
   OTeams workspace app — front-end demo, fully interactive.
   Seeded "Northwind" enterprise. State persists to localStorage.
   ============================================================ */
(function () {
  "use strict";
  /* Auth gate — the app lives behind the sign-in portal. */
  try { if (!localStorage.getItem("oteams.session")) { location.replace("/oteams/signin/"); return; } } catch(e){ location.replace("/oteams/signin/"); return; }
  var LSKEY = "oteams.northwind.v2";
  var now = Date.now();
  var MIN = 60000, HOUR = 3600000, DAY = 86400000;

  /* -------------------------------------------------- People */
  var U = {
    me:      { id:"me",      name:"You",           initials:"YS", av:"av-you", title:"Product Lead",     presence:"active" },
    ada:     { id:"ada",     name:"Ada Kessler",   initials:"AK", av:"av-2",   title:"Design Lead",      presence:"active" },
    jonah:   { id:"jonah",   name:"Jonah Mercer",  initials:"JM", av:"av-1",   title:"Eng Manager",      presence:"active" },
    rhea:    { id:"rhea",    name:"Rhea Patel",    initials:"RP", av:"av-3",   title:"Product Manager",  presence:"active" },
    deshawn: { id:"deshawn", name:"DeShawn Lewis", initials:"DL", av:"av-4",   title:"Sales Director",   presence:"away" },
    mara:    { id:"mara",    name:"Mara Ostrom",   initials:"MO", av:"av-5",   title:"CFO",              presence:"dnd" },
    tomas:   { id:"tomas",   name:"Tomas Ruiz",    initials:"TR", av:"av-6",   title:"Data Science",     presence:"active" },
    lin:     { id:"lin",     name:"Lin Zhao",      initials:"LZ", av:"av-7",   title:"Customer Success", presence:"active" },
    wren:    { id:"wren",    name:"Wren Salter",   initials:"WS", av:"av-8",   title:"CIO",              presence:"away" },
    roxan:   { id:"roxan",   name:"Roxan",         initials:"R",  av:"av-bot", title:"AI",  bot:true,    presence:"active" }
  };
  function user(id){ return U[id] || U.me; }

  /* roles (Discord), rich presence (Teams), voice channels (Discord) */
  var ROLE = {
    me:{n:"Product",c:"#5B8DEF"}, ada:{n:"Design",c:"#8A6DF0"}, jonah:{n:"Engineering",c:"#2FB77E"},
    rhea:{n:"Product",c:"#5B8DEF"}, deshawn:{n:"Sales",c:"#E9A23B"}, mara:{n:"Exec",c:"#E5544B"},
    tomas:{n:"Data",c:"#3FB2BD"}, lin:{n:"Success",c:"#F072A8"}, wren:{n:"Exec",c:"#E5544B"}, roxan:{n:"AI",c:"#9C7BF0"}
  };
  function roleColor(id){ return (ROLE[id]||ROLE.me).c; }
  var STATUS = {
    ada:"🎨 In Figma", jonah:"🚀 Shipping 2026.7.3", rhea:"📋 Planning Q3 launch", deshawn:"📞 On a call",
    mara:"⛔ In back-to-backs", tomas:"🧪 Running load tests", lin:"💬 With a customer", wren:"🌙 Out of office", me:"", roxan:"Always on"
  };
  function statusOf(id){ if (huddle.active && huddle.parts.indexOf(id)>-1) return "🎧 In a huddle"; return STATUS[id]||""; }
  var VOICE = [ { id:"v-war", name:"War Room" }, { id:"v-lounge", name:"Lounge" } ];
  var voiceMembers = { "v-war":["jonah","tomas"], "v-lounge":[] };
  var huddle = { active:false, parts:[] };

  /* -------------------------------------------------- Workspaces (rail) */
  var WORKSPACES = [
    { id:"northwind", name:"Northwind",       short:"N", grad:"var(--signal)", active:true },
    { id:"acme",      name:"Acme Robotics",   short:"A", grad:"linear-gradient(135deg,#5B8DEF,#3D6FD6)", badge:3 },
    { id:"globex",    name:"Globex",          short:"G", grad:"linear-gradient(135deg,#2FB77E,#1c8f60)" }
  ];

  /* -------------------------------------------------- Conversations */
  var CHANNELS = [
    { id:"general",     name:"general",     topic:"Company-wide announcements and general chatter", section:"channels" },
    { id:"launch-q3",   name:"launch-q3",   topic:"Coordinating the Q3 product launch — go-live Aug 14", section:"channels", unread:4, mention:true },
    { id:"design",      name:"design",      topic:"Design crits, specs, and the OTeams system", section:"channels" },
    { id:"engineering", name:"engineering", topic:"Shipping, incidents, and code review", section:"channels", unread:2 },
    { id:"sales",       name:"sales",       topic:"Pipeline, deals, and revenue", section:"channels" },
    { id:"customers",   name:"customers",   topic:"Voice of the customer", section:"channels" },
    { id:"random",      name:"random",      topic:"Non-work banter ☕️", section:"channels" },
    { id:"exec-staff",  name:"exec-staff",  topic:"Leadership only", section:"channels", private:true }
  ];
  var DMS = [
    { id:"dm-ada",    users:["ada"],                       section:"dms" },
    { id:"dm-jonah",  users:["jonah"],                     section:"dms" },
    { id:"dm-mara",   users:["mara"],                      section:"dms", unread:1 },
    { id:"dm-grp",    users:["jonah","rhea","deshawn"],    section:"dms" },
    { id:"dm-roxan",  users:["roxan"],                     section:"apps" }
  ];
  function allConvos(){ return CHANNELS.concat(DMS); }
  function convo(id){ return allConvos().filter(function(c){return c.id===id;})[0]; }
  function convoName(c){
    if (c.section === "channels") return "#" + c.name;
    if (c.users.length === 1) return user(c.users[0]).name;
    return c.users.map(function(u){return user(u).name.split(" ")[0];}).join(", ");
  }

  /* -------------------------------------------------- Seed messages */
  function m(u, minAgo, text, extra){
    var o = { id:"m"+(m._i=(m._i||0)+1), user:u, ts:now-minAgo*MIN, text:text, reactions:{}, replies:[] };
    if (extra) for (var k in extra) o[k]=extra[k];
    return o;
  }
  function seedMessages(){
    return {
      "launch-q3": [
        { id:"s1", system:true, text:"<b>Rhea Patel</b> created this channel · July 28" },
        m("rhea", 1450, "Kicking off **#launch-q3** 🚀 Everything for the Q3 launch lives here. Timeline, owners, and open decisions.", { reactions:{ "🚀":["ada","jonah","tomas","me"], "🙌":["deshawn"] } }),
        m("jonah", 1440, "Eng is on track. Staging is green and the migration ran clean last night.", { reactions:{ "✅":["rhea","ada"] } }),
        m("ada", 240, "Updated the launch page hero + the pricing table. Specs attached — pixel-checked in light and dark.", {
          file:{ name:"OTeams-Launch-Hero.fig", ext:"FIG", size:"4.2 MB", color:"#8A6DF0" },
          reactions:{ "🔥":["rhea","jonah","me","tomas"], "👀":["deshawn"] },
          replies:[
            { id:"r1", user:"jonah", ts:now-232*MIN, text:"These are great. The dark variant especially." },
            { id:"r2", user:"rhea", ts:now-228*MIN, text:"Shipping the hero copy to marketing now." },
            { id:"r3", user:"ada", ts:now-221*MIN, text:"Perfect — I'll keep the Figma in sync with any edits." }
          ]
        }),
        { id:"s2", system:true, text:"<b>Lin Zhao</b> joined #launch-q3" },
        m("roxan", 46, "Catch-up since you were away: **3 decisions**, **2 open items**.\n> • Launch date locked for **Aug 14**\n> • Pricing table approved\n> • Open: press embargo, final QA sign-off", {
          bot:true, reactions:{ "🙏":["rhea","me"], "🧠":["jonah"] }
        }),
        m("rhea", 12, "Thanks @Roxan. @You can you own the final QA sign-off? Need it by Aug 12.", { reactions:{} }),
        m("deshawn", 4, "Sales deck is ready for the launch — will drop it in #sales for review.", {})
      ],
      "general": [
        { id:"g0", system:true, text:"This is the very beginning of <b>#general</b>" },
        m("wren", 1600, "Welcome to Northwind on OTeams, everyone 👋 This is where company-wide news lands.", { reactions:{ "👋":["ada","jonah","rhea","lin","tomas","me","deshawn"] } }),
        m("mara", 300, "Q2 numbers are in and we beat plan by 8%. Full deck in the board channel. Nice work, team.", { reactions:{ "🎉":["ada","jonah","rhea","lin","tomas","me"], "📈":["wren"] } }),
        m("lin", 30, "Reminder: all-hands is Thursday 10:00. Bring questions for the AMA.", {})
      ],
      "engineering": [
        { id:"e0", system:true, text:"This is the very beginning of <b>#engineering</b>" },
        m("jonah", 180, "Deploy 2026.7.3 is out. Changelog in the thread.", { reactions:{ "🚢":["tomas","me"] } }),
        m("tomas", 26, "Heads up: bumped the rate limiter to 5k rps in staging for the launch load test.", { reactions:{ "👍":["jonah"] } }),
        m("jonah", 8, "Incident review from last week is scheduled Friday. No action needed unless you were on-call.", {})
      ],
      "design": [
        { id:"d0", system:true, text:"This is the very beginning of <b>#design</b>" },
        m("ada", 90, "Posted the updated OTeams component library — new message bubbles + the ink sidebar tokens.", { reactions:{ "🎨":["rhea","me","jonah"] } }),
        m("rhea", 20, "The new empty states are so much clearer. Ship it.", {})
      ],
      "sales": [
        { id:"sl0", system:true, text:"This is the very beginning of <b>#sales</b>" },
        m("deshawn", 55, "Closed the Meridian Foods expansion — 400 seats. 🥂", { reactions:{ "🎉":["mara","wren","rhea","me","lin"], "💰":["jonah"] } }),
        m("mara", 15, "Fantastic. That puts us over the Q3 target with weeks to spare.", {})
      ],
      "customers": [
        { id:"c0", system:true, text:"This is the very beginning of <b>#customers</b>" },
        m("lin", 70, "Top request this month: scheduled channel recaps. Roxan already does this — going to make sure customers know.", { reactions:{ "💡":["rhea","ada"] } }),
        m("roxan", 40, "I can auto-summarize any channel on a schedule. Want me to draft a help article for the customers team?", { bot:true, reactions:{ "🙌":["lin"] } })
      ],
      "random": [
        { id:"rn0", system:true, text:"This is the very beginning of <b>#random</b>" },
        m("tomas", 120, "Coffee order for the office run? ☕️", { reactions:{ "☕️":["ada","jonah","me","rhea"] } }),
        m("ada", 100, "Oat flat white 🙏", {})
      ],
      "exec-staff": [
        { id:"x0", system:true, text:"This is the very beginning of <b>🔒 exec-staff</b>" },
        m("wren", 200, "Board prep sync moved to Monday. Agenda in the canvas.", {})
      ],
      "dm-ada": [
        m("ada", 200, "Hey! Did you get a chance to look at the launch hero?", {}),
        m("me", 196, "Just did — looks fantastic. Approving now.", {}),
        m("ada", 12, "🙌 thank you! Let me know if marketing needs anything else.", { reactions:{} })
      ],
      "dm-jonah": [
        m("jonah", 60, "Staging is green for the load test whenever you're ready.", {}),
        m("me", 55, "Perfect, let's run it at 2pm.", {})
      ],
      "dm-mara": [
        m("mara", 18, "Can you send the final launch budget before EOD? Board wants the number.", {})
      ],
      "dm-grp": [
        m("rhea", 40, "Grouping us three for the launch war-room. 🫡", {}),
        m("deshawn", 35, "Standing by with the sales side.", {}),
        m("jonah", 30, "Eng ready. War-room huddle at go-live.", {})
      ],
      "dm-roxan": [
        m("roxan", 30, "Hi — I'm Roxan, your assistant in OTeams. Ask me to catch you up on a channel, summarize a thread, or draft a message.", { bot:true }),
        m("me", 25, "Catch me up on #launch-q3", {}),
        m("roxan", 24, "Since this morning: launch date locked for **Aug 14**, pricing approved, and Ada shipped the hero specs. Two open items: press embargo and final QA sign-off (Rhea asked you to own it).", { bot:true, reactions:{ "🙏":["me"] } })
      ]
    };
  }

  /* -------------------------------------------------- Mutable state */
  var messages, read, starred, collapsed, pinned, current, history = [], hIndex = -1;
  var memberOpen = false, theme = "light", replyingTo = null, typingTimer = null, typingHideTimer = null;
  var viewMode = null, editingId = null;
  function freshState(){
    messages = seedMessages();
    read = {}; starred = {}; collapsed = {}; pinned = {};
    var lq = messages["launch-q3"] || [], rox = lq.filter(function(x){ return x.user==="roxan"; })[0];
    if (rox) pinned["launch-q3"] = [rox.id];
  }
  function loadState(){
    freshState();
    try {
      var raw = localStorage.getItem(LSKEY);
      if (raw){
        var d = JSON.parse(raw);
        if (d.messages) messages = d.messages;
        if (d.read) read = d.read;
        if (d.starred) starred = d.starred;
        if (d.collapsed) collapsed = d.collapsed;
        if (d.presence) U.me.presence = d.presence;
        if (d.pinned) pinned = d.pinned;
        if (d.status != null) STATUS.me = d.status;
        if (d.channels) d.channels.forEach(function(c){ if (!convo(c.id)) CHANNELS.push(c); });
      }
    } catch(e){}
  }
  function save(){
    try { localStorage.setItem(LSKEY, JSON.stringify({
      messages:messages, read:read, starred:starred, collapsed:collapsed, presence:U.me.presence,
      pinned:pinned, status:STATUS.me, channels:CHANNELS.filter(function(c){ return c.custom; })
    })); } catch(e){}
  }

  /* -------------------------------------------------- Helpers */
  var $ = function(s,r){ return (r||document).querySelector(s); };
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function avatar(u, cls){ u = typeof u==="string"?user(u):u; return '<span class="av '+u.av+' '+(cls||"")+'">'+esc(u.initials)+'</span>'; }
  function pres(u){ u = typeof u==="string"?user(u):u; return '<i class="pres '+u.presence+'"></i>'; }
  function fmtTime(ts){
    var d = new Date(ts), h = d.getHours(), mm = d.getMinutes();
    var ap = h>=12?"PM":"AM"; h = h%12; if(h===0) h=12;
    return h+":"+(mm<10?"0":"")+mm+" "+ap;
  }
  function dayLabel(ts){
    var d = new Date(ts); d.setHours(0,0,0,0);
    var t = new Date(); t.setHours(0,0,0,0);
    var diff = Math.round((t-d)/DAY);
    if (diff===0) return "Today";
    if (diff===1) return "Yesterday";
    return d.toLocaleDateString(undefined,{ weekday:"long", month:"long", day:"numeric" });
  }
  function unreadOf(c){ return (c.unread && !read[c.id]) ? c.unread : 0; }

  /* markdown (safe subset) */
  function mdInline(t){
    t = esc(t);
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[\s(])_([^_]+)_(?=[\s).,!?]|$)/g, "$1<em>$2</em>");
    t = t.replace(/\bhttps?:\/\/[^\s<]+/g, function(u){ return '<a href="'+u+'" target="_blank" rel="noopener">'+u.replace(/^https?:\/\//,"")+"</a>"; });
    t = t.replace(/(^|\s)@([A-Za-z][\w]*)/g, '$1<span class="mention">@$2</span>');
    t = t.replace(/(^|\s)#([a-z0-9][\w-]*)/g, '$1<a class="mention" data-act="goto-name" data-name="$2">#$2</a>');
    return t;
  }
  function md(text){
    var lines = String(text).split("\n"), html = "", inList = false;
    for (var i=0;i<lines.length;i++){
      var ln = lines[i];
      if (/^\s*[-*]\s+/.test(ln)){ if(!inList){html+="<ul>";inList=true;} html+="<li>"+mdInline(ln.replace(/^\s*[-*]\s+/,""))+"</li>"; continue; }
      if (inList){ html+="</ul>"; inList=false; }
      if (/^\s*>\s?/.test(ln)){ html+="<blockquote>"+mdInline(ln.replace(/^\s*>\s?/,""))+"</blockquote>"; continue; }
      if (ln.trim()==="") continue;
      html += "<p>"+mdInline(ln)+"</p>";
    }
    if (inList) html+="</ul>";
    return html;
  }

  /* ==================================================================
     RENDER — Rail
     ================================================================== */
  function renderRail(){
    $("#railWs").innerHTML = WORKSPACES.map(function(w){
      return '<button class="rail-sq'+(w.active?" active":"")+'" data-act="ws" data-id="'+w.id+'" title="'+esc(w.name)+'" style="background:'+w.grad+'">'+
        esc(w.short) + (w.badge?'<span class="rail-badge">'+w.badge+'</span>':"") + '</button>';
    }).join("");
    $("#railMe").innerHTML = avatar(U.me) + pres(U.me);
    $("#tbAvatar").innerHTML = avatar(U.me);
  }

  /* ==================================================================
     RENDER — Sidebar
     ================================================================== */
  var SECTIONS = [
    { id:"channels", label:"Channels", items:function(){ return CHANNELS; } },
    { id:"dms",      label:"Direct messages", items:function(){ return DMS.filter(function(d){return d.section==="dms";}); } },
    { id:"apps",     label:"Apps", items:function(){ return DMS.filter(function(d){return d.section==="apps";}); } }
  ];
  function chItem(c){
    var active = c.id===current, un = unreadOf(c);
    var cls = "ch" + (active?" active":"") + (un?" unread":"");
    if (c.section==="channels"){
      var glyph = c.private
        ? '<span class="glyph"><svg class="lock" viewBox="0 0 24 24" style="stroke:currentColor;fill:none;stroke-width:2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>'
        : '<span class="glyph">#</span>';
      return '<button class="'+cls+'" data-act="open" data-id="'+c.id+'">'+glyph+'<span class="nm">'+esc(c.name)+'</span>'+(un?'<span class="badge">'+un+'</span>':"")+'</button>';
    }
    // dm
    var single = c.users.length===1 ? user(c.users[0]) : null;
    var avh = single
      ? '<span class="avwrap">'+avatar(single,"")+pres(single)+'</span>'
      : '<span class="avwrap">'+avatar(user(c.users[0]),"")+'</span>';
    return '<button class="'+cls+'" data-act="open" data-id="'+c.id+'">'+avh+'<span class="nm">'+esc(convoName(c))+'</span>'+(un?'<span class="badge">'+un+'</span>':"")+'</button>';
  }
  function sectionHTML(sec){
    var isCol = !!collapsed[sec.id];
    var items = sec.items().map(chItem).join("");
    return '<div class="sb-sec'+(isCol?" collapsed":"")+'" data-sec="'+sec.id+'">'+
      '<button class="sb-sec-head" data-act="toggle-sec" data-sec="'+sec.id+'">'+
        '<svg class="tw" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg><b>'+sec.label+'</b>'+
        '<span class="plus" data-act="add-'+sec.id+'"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>'+
      '</button><div class="sb-items">'+items+'</div></div>';
  }
  function voiceSectionHTML(){
    var isCol = !!collapsed.voice;
    var speakerG = '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/></svg>';
    var micG = '<svg class="mi" viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4"/></svg>';
    var items = VOICE.map(function(v){
      var joined = voiceMembers[v.id] || [];
      var head = '<button class="vc'+(huddle.active && huddle.source===v.id?" joined":"")+'" data-act="voice" data-id="'+v.id+'"><span class="glyph">'+speakerG+'</span><span class="nm">'+esc(v.name)+'</span></button>';
      var mems = joined.map(function(uid){
        return '<div class="vc-mem'+(huddle.active && huddle.speaking===uid?" speaking":"")+'" data-uid="'+uid+'">'+avatar(user(uid))+'<span class="nm" style="color:'+roleColor(uid)+'">'+esc(user(uid).name.split(" ")[0])+'</span>'+micG+'</div>';
      }).join("");
      return head + (joined.length?'<div class="vc-members">'+mems+'</div>':"");
    }).join("");
    return '<div class="sb-sec'+(isCol?" collapsed":"")+'" data-sec="voice">'+
      '<button class="sb-sec-head" data-act="toggle-sec" data-sec="voice"><svg class="tw" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg><b>Voice channels</b><span class="plus" data-act="add-voice"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></button>'+
      '<div class="sb-items">'+items+'</div></div>';
  }
  function renderSidebar(){
    var html = "";
    SECTIONS.forEach(function(sec){ html += sectionHTML(sec); if (sec.id==="channels") html += voiceSectionHTML(); });
    $("#channelNav").innerHTML = html;
  }

  /* ==================================================================
     RENDER — Channel header
     ================================================================== */
  function memberCount(c){
    if (c.section!=="channels") return c.users.length+1;
    var base = { "general":9,"launch-q3":6,"engineering":5,"design":4,"sales":4,"customers":3,"random":7,"exec-staff":3 };
    return base[c.id] || 4;
  }
  function headFaces(c){
    var ids = c.section==="channels" ? ["ada","jonah","rhea","tomas"] : (c.users.length>1?c.users:[c.users[0]]);
    return ids.slice(0,4).map(function(id){ return avatar(user(id)); }).join("");
  }
  function renderHeader(){
    if (viewMode){
      var vt = { threads:["Threads",'<path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.8-5.8A8.5 8.5 0 1 1 21 11.5z"/>'],
        mentions:["Mentions & reactions",'<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"/>'],
        pinned:["Pinned · "+convoName(convo(current)),'<path d="M9 3h6l-1 7 3 3v2h-4v6l-1 1-1-1v-6H6v-2l3-3z"/>'],
        activity:["Activity",'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'] }[viewMode];
      $("#chanHead").innerHTML = '<div class="view-title"><svg viewBox="0 0 24 24">'+vt[1]+'</svg>'+esc(vt[0])+'</div>'+
        '<div class="chan-actions"><button class="ch-btn" data-act="close-view"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>Close</button></div>';
      document.title = "OTeams · " + vt[0];
      return;
    }
    var c = convo(current);
    var title = c.section==="channels"
      ? '<span class="chan-title">'+(c.private?'<svg class="lock" viewBox="0 0 24 24" style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>':'<span class="h">#</span>')+esc(c.name)+
        '<button class="star'+(starred[c.id]?" on":"")+'" data-act="star" title="Star"><svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 23l-5.5-2.9 1-6.1L3 9.5l6.1-.9z"/></svg></button></span>'
      : '<span class="chan-title">'+(c.users.length===1?pres_inline(c.users[0]):"")+esc(convoName(c))+'</span>';
    var topic = c.section==="channels" ? '<div class="chan-topic" data-act="topic">'+esc(c.topic)+'</div>' : '<div class="chan-topic">'+(c.users.length===1?esc(user(c.users[0]).title):"Group message")+'</div>';
    var catchup = '<button class="ch-btn roxan-mini" data-act="catchup" title="Catch me up with Roxan"><svg viewBox="0 0 24 24"><path d="M12 3.4c.7 3.9 1.9 5.1 5.8 5.8-3.9.7-5.1 1.9-5.8 5.8-.7-3.9-1.9-5.1-5.8-5.8 3.9-.7 5.1-1.9 5.8-5.8z"/></svg>Catch me up</button>';
    var hud = '<button class="ch-btn hud" data-act="huddle"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/></svg>Huddle</button>';
    var pins = (pinned[c.id]||[]).length;
    var pinBtn = pins ? '<button class="ch-btn" data-act="open-pinned" title="Pinned messages"><svg viewBox="0 0 24 24"><path d="M9 3h6l-1 7 3 3v2h-4v6l-1 1-1-1v-6H6v-2l3-3z"/></svg>'+pins+'</button>' : "";
    var actions = c.section==="channels"
      ? catchup +
        '<div class="chan-faces" data-act="members" title="Show members">'+headFaces(c)+'<span class="cnt">'+memberCount(c)+'</span></div>'+
        hud + pinBtn +
        '<button class="ch-btn'+(memberOpen?" on":"")+'" data-act="members" title="Members"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.6c2 .4 3.5 1.8 3.5 4.4"/></svg></button>'
      : catchup + hud;
    $("#chanHead").innerHTML = title + topic + '<div class="chan-actions">'+actions+'</div>';
    document.title = "OTeams · " + convoName(c);
  }
  function pres_inline(uid){ var u=user(uid); return '<i class="pres on-light '+u.presence+'" style="position:static;display:inline-block;margin-right:2px"></i>'; }

  /* ==================================================================
     RENDER — Messages
     ================================================================== */
  function reactionsHTML(msg){
    var keys = Object.keys(msg.reactions||{}).filter(function(k){return msg.reactions[k].length;});
    var chips = keys.map(function(em){
      var arr = msg.reactions[em], mine = arr.indexOf("me")>-1;
      return '<button class="react'+(mine?" mine":"")+'" data-act="react-toggle" data-msg="'+msg.id+'" data-em="'+esc(em)+'"><span class="em">'+em+'</span><span class="n">'+arr.length+'</span></button>';
    }).join("");
    return '<div class="reacts">'+chips+'<button class="react-add" data-act="react-open" data-msg="'+msg.id+'"><svg viewBox="0 0 24 24"><path d="M9 3H4v5M15 3h5v5M15 21h5v-5M9 21H4v-5"/><circle cx="12" cy="12" r="3.2"/></svg></button></div>';
  }
  function fileHTML(f){
    return '<div class="filecard" data-act="file"><div class="fi" style="background:'+f.color+'">'+esc(f.ext)+'</div><div class="fmeta"><b>'+esc(f.name)+'</b><span>'+esc(f.ext)+' · '+esc(f.size)+'</span></div></div>';
  }
  function threadLinkHTML(msg){
    if (!msg.replies || !msg.replies.length) return "";
    var faces = {}, order = [];
    msg.replies.forEach(function(r){ if(!faces[r.user]){faces[r.user]=1;order.push(r.user);} });
    var last = msg.replies[msg.replies.length-1];
    return '<button class="thread-link" data-act="thread" data-msg="'+msg.id+'"><span class="faces">'+
      order.slice(0,3).map(function(u){return avatar(user(u));}).join("")+'</span>'+
      '<span class="rc">'+msg.replies.length+' repl'+(msg.replies.length>1?"ies":"y")+'</span>'+
      '<span class="last">Last reply '+fmtTime(last.ts)+'</span>'+
      '<svg class="arw" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>';
  }
  function receiptHTML(msg){
    if (msg.user!=="me") return "";
    var st = msg.receipt || "read";
    return '<span class="receipt'+(st==="read"?" read":"")+'" id="rcpt-'+msg.id+'">'+(st==="sent"?"✓":"✓✓")+'</span>';
  }
  function quoteHTML(msg){
    if (!msg.replyTo) return "";
    var ref = (messages[current]||[]).filter(function(x){return x.id===msg.replyTo;})[0];
    if (!ref) return "";
    var snip = (ref.voice?"🎤 Voice message":(ref.text||"")).replace(/\n/g," ").slice(0,90);
    return '<div class="quote" data-act="scrollto" data-msg="'+ref.id+'"><div><div class="qwho" style="color:'+roleColor(ref.user)+'">'+esc(user(ref.user).name)+'</div><div class="qtext">'+esc(snip)+'</div></div></div>';
  }
  function voiceHTML(msg){
    var bars = msg.voice.wave.map(function(h){ return '<i style="height:'+h+'%"></i>'; }).join("");
    return '<div class="vnote" data-act="vplay" data-msg="'+msg.id+'"><button class="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button><div class="wave">'+bars+'</div><span class="dur">'+msg.voice.dur+'</span></div>';
  }
  function messageGroupHTML(msg, compact){
    var u = user(msg.user), nameColor = roleColor(msg.user);
    var head = compact ? '' :
      '<div class="head"><span class="who" style="color:'+nameColor+'">'+esc(u.name)+'</span>'+
        (u.bot?'<span class="bot">APP</span>':(u.title?'<span class="role">'+esc(u.title)+'</span>':""))+
        '<time>'+fmtTime(msg.ts)+receiptHTML(msg)+'</time></div>';
    var gutter = compact
      ? '<div class="stamp-mini">'+fmtTime(msg.ts).replace(/ (AM|PM)/,"")+'</div>'
      : '<div class="gutter">'+avatar(u)+'</div>';
    var isPinned = pinned[current] && pinned[current].indexOf(msg.id)>-1;
    var pinFlag = isPinned ? '<div class="pin-flag"><svg viewBox="0 0 24 24"><path d="M9 3h6l-1 7 3 3v2h-4v6l-1 1-1-1v-6H6v-2l3-3z"/></svg>Pinned</div>' : "";
    var content;
    if (editingId===msg.id && msg.user==="me" && !msg.voice) content = editBoxHTML(msg);
    else content = msg.voice ? voiceHTML(msg) : ('<div class="text">'+md(msg.text)+(msg.edited?'<span class="edited">(edited)</span>':"")+'</div>');
    var body = '<div class="content">'+head+ pinFlag + quoteHTML(msg) + content +
      (msg.file?fileHTML(msg.file):"")+ reactionsHTML(msg) + threadLinkHTML(msg) + '</div>';
    var tools = '<div class="msg-tools">'+
      '<button data-act="react-quick" data-msg="'+msg.id+'" data-em="👍" title="React"><span class="em">👍</span></button>'+
      '<button data-act="react-quick" data-msg="'+msg.id+'" data-em="✅" title="React"><span class="em">✅</span></button>'+
      '<button data-act="react-open" data-msg="'+msg.id+'" title="Add reaction"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 14s1 1.5 3 1.5S15 14 15 14M9 9h.01M15 9h.01"/></svg></button>'+
      '<button data-act="quote" data-msg="'+msg.id+'" title="Reply"><svg viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4c5 0 8 1.5 10 5 0-7-3-11-10-11z"/></svg></button>'+
      '<button data-act="thread" data-msg="'+msg.id+'" title="Reply in thread"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.8-5.8A8.5 8.5 0 1 1 21 11.5z"/></svg></button>'+
      '<button data-act="msg-more" data-msg="'+msg.id+'" title="More"><svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/></svg></button>'+
    '</div>';
    return '<div class="grp'+(compact?"":" first")+'" data-msg="'+msg.id+'"><div class="grp-row">'+gutter+body+'</div>'+tools+'</div>';
  }
  function introHTML(c){
    if (c.section!=="channels") {
      if (c.users.length===1){
        var u = user(c.users[0]);
        return '<div class="chan-intro"><div class="gutter" style="margin-bottom:12px">'+avatar(u)+'</div>'+
          '<h2>'+esc(u.name)+'</h2><p>'+(u.bot?"This is your direct line to Roxan. Ask for a recap, a summary, or a draft.":"This is the start of your direct message history with "+esc(u.name)+" · "+esc(u.title)+".")+'</p></div>';
      }
      return '<div class="chan-intro"><h2>'+esc(convoName(c))+'</h2><p>This is the start of your group conversation.</p></div>';
    }
    return '<div class="chan-intro"><div class="big"><svg viewBox="0 0 24 24"><path d="M5 9h14M5 15h14M9 4l-2 16M17 4l-2 16"/></svg></div>'+
      '<h2>'+(c.private?"🔒 ":"#")+esc(c.name)+'</h2><p>This is the very beginning of the <b>'+(c.private?"":"#")+esc(c.name)+'</b> channel. '+esc(c.topic)+'.</p>'+
      '<div class="meta"><span class="chip">'+memberCount(c)+' members</span><span class="chip">Created by Rhea Patel</span></div></div>';
  }
  function renderMessages(){
    if (viewMode){ renderView(); return; }
    var c = convo(current), list = messages[current] || [];
    var html = introHTML(c), lastDay = null, prev = null;
    for (var i=0;i<list.length;i++){
      var msg = list[i];
      if (msg.system){
        var dl = dayLabel(msg.ts||now);
        html += '<div class="sys">'+msg.text+'</div>'; prev=null; continue;
      }
      var thisDay = dayLabel(msg.ts);
      if (thisDay!==lastDay){ html += '<div class="day-div"><span>'+thisDay+'</span></div>'; lastDay=thisDay; prev=null; }
      var compact = prev && prev.user===msg.user && !prev.file && (msg.ts-prev.ts) < 5*MIN && (!prev.replies||!prev.replies.length);
      html += messageGroupHTML(msg, compact);
      prev = msg;
    }
    var box = $("#msgs"); box.innerHTML = html; box.scrollTop = box.scrollHeight;
    if (editingId){
      var eta = box.querySelector(".edit-ta");
      if (eta){ eta.style.height="auto"; eta.style.height=eta.scrollHeight+"px"; eta.focus(); eta.selectionStart = eta.value.length;
        eta.addEventListener("input", function(){ this.style.height="auto"; this.style.height=this.scrollHeight+"px"; });
        eta.addEventListener("keydown", function(e){
          if (e.key==="Enter" && !e.shiftKey){ e.preventDefault(); saveEdit(editingId, eta.value); }
          else if (e.key==="Escape"){ e.preventDefault(); editingId=null; renderMessages(); }
        });
      }
    }
  }

  /* ==================================================================
     Composer
     ================================================================== */
  function composerHTML(placeholder, kind){
    var typing = kind==="main" ? '<div class="typing" id="typingBar" hidden></div>' : "";
    return typing + '<div class="cx" data-kind="'+kind+'">'+
      '<div class="reply-slot" data-kind="'+kind+'"></div>'+
      '<div class="cx-toolbar">'+
        tbtn("bold","<path d=\'M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z\'/>")+
        tbtn("italic","<path d=\'M11 5h6M7 19h6M14 5l-4 14\'/>")+
        tbtn("strike","<path d=\'M5 12h14M8 7a4 3 0 0 1 8 0M8 17a4 3 0 0 0 8 0\'/>")+
        tbtn("code","<path d=\'M9 8l-4 4 4 4M15 8l4 4-4 4\'/>")+
        '<span class="sep"></span>'+
        tbtn("link","<path d=\'M9 15l6-6M10 6l1-1a3.5 3.5 0 0 1 5 5l-1 1M14 18l-1 1a3.5 3.5 0 0 1-5-5l1-1\'/>")+
        tbtn("list","<path d=\'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01\'/>")+
      '</div>'+
      '<textarea class="cx-input" data-kind="'+kind+'" rows="1" placeholder="'+esc(placeholder)+'"></textarea>'+
      '<div class="cx-bottom">'+
        cbtn("attach","<path d=\'M21 12l-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8\'/>")+
        cbtn("emoji","<circle cx=\'12\' cy=\'12\' r=\'9\'/><path d=\'M9 14s1 1.5 3 1.5 3-1.5 3-1.5M9 9h.01M15 9h.01\'/>")+
        cbtn("mention","<circle cx=\'12\' cy=\'12\' r=\'4\'/><path d=\'M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1\'/>")+
        cbtn("voice","<path d=\'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4\'/>")+
        '<button class="cbtn" data-cbtn="roxan" title="Draft with Roxan"><svg viewBox="0 0 24 24" style="fill:var(--accent-2);stroke:none"><path d="M12 3.4c.7 3.9 1.9 5.1 5.8 5.8-3.9.7-5.1 1.9-5.8 5.8-.7-3.9-1.9-5.1-5.8-5.8 3.9-.7 5.1-1.9 5.8-5.8z"/></svg></button>'+
        '<button class="cx-send" data-act="send" data-kind="'+kind+'"><span>Send</span><svg viewBox="0 0 24 24"><path d="M4 12l16-7-7 16-2-7z"/></svg></button>'+
      '</div>'+
    '</div>'+ (kind==="main"?'<div class="cx-hint"><kbd>↵</kbd> to send · <kbd>⇧↵</kbd> for a new line</div>':"");
  }
  function tbtn(act,path){ return '<button class="tbtn" data-fmt="'+act+'" title="'+act+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg></button>'; }
  function cbtn(act,path){ return '<button class="cbtn" data-cbtn="'+act+'" title="'+act+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg></button>'; }

  function renderComposer(){
    var c = convo(current);
    $("#composerWrap").innerHTML = composerHTML("Message "+convoName(c), "main");
    wireComposer($("#composerWrap"), "main");
  }
  function wireComposer(root, kind){
    var cx = $(".cx", root), ta = $(".cx-input", root), send = $(".cx-send", root);
    function sync(){
      ta.style.height="auto"; ta.style.height=Math.min(ta.scrollHeight,220)+"px";
      var has = ta.value.trim().length>0; send.classList.toggle("ready", has);
    }
    ta.addEventListener("input", function(){ sync(); mentionWatch(ta); if (kind==="main") slashWatch(ta); });
    ta.addEventListener("focus", function(){ cx.classList.add("focus"); });
    ta.addEventListener("blur", function(){ cx.classList.remove("focus"); });
    ta.addEventListener("keydown", function(e){
      if (mentionKeydown(e, ta)) return;
      if (kind==="main" && slashKeydown(e, ta)) return;
      if (e.key==="Enter" && !e.shiftKey){ e.preventDefault(); doSend(kind, ta); }
    });
    $(".cx-toolbar", root).addEventListener("click", function(e){
      var b = e.target.closest("[data-fmt]"); if(!b) return; e.preventDefault();
      applyFmt(ta, b.getAttribute("data-fmt")); sync();
    });
    $(".cx-bottom", root).addEventListener("click", function(e){
      var b = e.target.closest("[data-cbtn]"); if(!b) return;
      var a = b.getAttribute("data-cbtn");
      if (a==="emoji") openEmojiPop(b, function(em){ insertAt(ta, em+" "); sync(); ta.focus(); });
      else if (a==="mention") { insertAt(ta, "@"); sync(); ta.focus(); mentionWatch(ta); }
      else if (a==="voice") startRecording(kind, root);
      else if (a==="roxan") openAssist(b, ta, sync);
      else if (a==="attach") toast("File attachments are disabled in this demo","📎");
    });
    if (kind==="main") window.__mainTA = ta;
  }
  function applyFmt(ta, fmt){
    var s=ta.selectionStart, e=ta.selectionEnd, v=ta.value, sel=v.slice(s,e);
    var wrap={bold:["**","**"],italic:["_","_"],strike:["~~","~~"],code:["`","`"],quote:["> ",""],list:["- ",""],link:["[","](https://)"]}[fmt];
    if(!wrap) return;
    var out = wrap[0]+(sel||{bold:"bold",italic:"italic",strike:"strike",code:"code",quote:"quote",list:"item",link:"link"}[fmt])+wrap[1];
    ta.value = v.slice(0,s)+out+v.slice(e);
    ta.focus(); ta.selectionStart=s+wrap[0].length; ta.selectionEnd=s+out.length-wrap[1].length;
  }
  function insertAt(ta, str){
    var s=ta.selectionStart, v=ta.value;
    ta.value=v.slice(0,s)+str+v.slice(ta.selectionEnd);
    ta.selectionStart=ta.selectionEnd=s+str.length;
  }
  function doSend(kind, ta){
    var text = ta.value.trim(); if(!text) return;
    if (kind==="main" && text.charAt(0)==="/"){
      ta.value=""; ta.style.height="auto"; closeSlash();
      var sb=$(".cx-send", ta.closest(".composer")); if(sb) sb.classList.remove("ready");
      runSlash(text); return;
    }
    if (kind==="thread"){
      var pm = messages[current] && messages[current].filter(function(x){return x.id===threadMsgId;})[0];
      if (pm){ pm.replies.push({ id:"r"+Date.now(), user:"me", ts:Date.now(), text:text }); save(); renderThread(); renderMessages(); }
    } else {
      var id = "u"+Date.now();
      var msg = { id:id, user:"me", ts:Date.now(), text:text, reactions:{}, replies:[], receipt:"sent" };
      if (replyingTo){ msg.replyTo = replyingTo; clearReply(); }
      (messages[current] = messages[current]||[]).push(msg);
      save(); renderMessages(); progressReceipt(id);
      maybeAutoReply(text);
    }
    ta.value=""; ta.style.height="auto"; $(".cx-send",ta.closest(".composer")).classList.remove("ready");
  }
  function progressReceipt(id){
    setTimeout(function(){ setReceipt(id,"delivered"); }, 750);
    setTimeout(function(){ setReceipt(id,"read"); }, 2200);
  }
  function setReceipt(id, st){
    var msg = findMsg(id); if (msg) { msg.receipt = st; save(); }
    var el = document.getElementById("rcpt-"+id);
    if (el){ el.textContent = st==="sent"?"✓":"✓✓"; el.classList.toggle("read", st==="read"); }
  }
  function maybeAutoReply(text){
    if (current!=="dm-roxan") return;
    setTimeout(function(){
      messages["dm-roxan"].push({ id:"b"+Date.now(), user:"roxan", ts:Date.now(), bot:true, reactions:{}, replies:[],
        text:"On it. Here's a quick take:\n> "+(text.length>60?text.slice(0,60)+"…":text)+"\nI've noted it and can turn this into a summary, a draft, or a reminder — just say the word." });
      save(); if(current==="dm-roxan") renderMessages();
    }, 650);
  }

  /* ==================================================================
     Thread pane
     ================================================================== */
  var threadMsgId = null;
  function openThread(id){
    threadMsgId = id; $("#threadPane").hidden = false;
    document.getElementById("app").classList.add("thread-open");
    renderThread();
  }
  function closeThread(){ threadMsgId=null; $("#threadPane").hidden = true; }
  function renderThread(){
    var pm = (messages[current]||[]).filter(function(x){return x.id===threadMsgId;})[0];
    if(!pm){ closeThread(); return; }
    $("#threadSub").textContent = convoName(convo(current));
    var parent = messageGroupHTML(pm, false).replace('class="grp first"','class="grp"');
    var count = pm.replies.length;
    var replies = pm.replies.map(function(r,i){
      var prev = pm.replies[i-1];
      var compact = prev && prev.user===r.user && (r.ts-prev.ts)<5*MIN;
      return messageGroupHTML({ id:r.id, user:r.user, ts:r.ts, text:r.text, voice:r.voice, reactions:r.reactions||{}, replies:[], bot:user(r.user).bot }, compact);
    }).join("");
    $("#threadBody").innerHTML = '<div class="thread-parent">'+parent+'</div>'+
      (count?'<div class="thread-count">'+count+' repl'+(count>1?"ies":"y")+'</div>':"")+ replies;
    $("#threadComposerWrap").innerHTML = composerHTML("Reply…","thread");
    wireComposer($("#threadComposerWrap"),"thread");
  }

  /* ==================================================================
     Navigation
     ================================================================== */
  function openConvo(id, fromHistory){
    if (!convo(id)) return;
    current = id; read[id]=true; replyingTo = null;
    viewMode = null; editingId = null; $(".main").classList.remove("viewing");
    if (!fromHistory){ history = history.slice(0,hIndex+1); history.push(id); hIndex=history.length-1; }
    closeThread();
    renderSidebar(); renderHeader(); renderMessages(); renderComposer();
    if (memberOpen) renderMembers();
    scheduleTyping();
    save(); closeMobileNav();
    updateNavButtons();
  }
  function updateNavButtons(){
    $("#navBack").style.opacity = hIndex>0?"1":".4";
    $("#navFwd").style.opacity = hIndex<history.length-1?"1":".4";
  }
  function navBack(){ if(hIndex>0){ hIndex--; openConvo(history[hIndex], true); } }
  function navFwd(){ if(hIndex<history.length-1){ hIndex++; openConvo(history[hIndex], true); } }

  /* ==================================================================
     Reactions
     ================================================================== */
  function toggleReaction(msgId, em){
    var msg = findMsg(msgId); if(!msg) return;
    var arr = msg.reactions[em] = msg.reactions[em]||[];
    var i = arr.indexOf("me");
    if (i>-1) arr.splice(i,1); else arr.push("me");
    if (!arr.length) delete msg.reactions[em];
    save(); renderMessages(); if(threadMsgId) renderThread();
  }
  function findMsg(id){
    var list = messages[current]||[];
    for (var i=0;i<list.length;i++){ if(list[i].id===id) return list[i]; }
    return null;
  }

  /* ==================================================================
     Emoji popover
     ================================================================== */
  var EMOJI = ["👍","🎉","🚀","🔥","✅","🙌","👀","🙏","❤️","😄","😅","🤔","💡","🧠","💯","👏","☕️","📈","🥂","😍","🫡","⚡️","✨","🎨"];
  var emojiPop = null;
  function openEmojiPop(anchor, cb){
    closePops();
    var p = document.createElement("div"); p.className="emoji-pop";
    p.innerHTML = EMOJI.map(function(e){return '<button>'+e+'</button>';}).join("");
    document.body.appendChild(p);
    var r = anchor.getBoundingClientRect();
    var top = r.bottom+6, left = Math.min(r.left, window.innerWidth-p.offsetWidth-12);
    if (top+p.offsetHeight > window.innerHeight-10) top = r.top-p.offsetHeight-6;
    p.style.top=top+"px"; p.style.left=Math.max(12,left)+"px";
    p.addEventListener("click", function(e){ var b=e.target.closest("button"); if(b){ cb(b.textContent); closePops(); } });
    emojiPop = p;
  }
  function closePops(){ if(emojiPop){emojiPop.remove();emojiPop=null;} if(mentionPop){mentionPop.remove();mentionPop=null;mentionState=null;} }

  /* ==================================================================
     Mention autocomplete
     ================================================================== */
  var mentionPop=null, mentionState=null;
  var MEMBERS = ["ada","jonah","rhea","deshawn","mara","tomas","lin","wren","roxan"];
  function mentionWatch(ta){
    var v = ta.value.slice(0,ta.selectionStart);
    var mtch = /@([A-Za-z]*)$/.exec(v);
    if (!mtch){ if(mentionPop){mentionPop.remove();mentionPop=null;mentionState=null;} return; }
    var q = mtch[1].toLowerCase();
    var hits = MEMBERS.map(user).filter(function(u){ return u.name.toLowerCase().indexOf(q)>-1 || u.name.toLowerCase().split(" ").some(function(p){return p.indexOf(q)===0;}); });
    if (!hits.length){ if(mentionPop){mentionPop.remove();mentionPop=null;} return; }
    if (!mentionPop){ mentionPop=document.createElement("div"); mentionPop.className="mention-pop"; document.body.appendChild(mentionPop); }
    mentionState = { ta:ta, start:mtch.index, sel:0, hits:hits };
    drawMention();
    var r = ta.getBoundingClientRect();
    mentionPop.style.left = (r.left+12)+"px";
    mentionPop.style.top = (r.top - mentionPop.offsetHeight - 6)+"px";
  }
  function drawMention(){
    if(!mentionPop||!mentionState) return;
    mentionPop.innerHTML = mentionState.hits.map(function(u,i){
      return '<button class="'+(i===mentionState.sel?"sel":"")+'" data-uid="'+u.id+'">'+avatar(u)+'<span>'+esc(u.name)+'</span><span class="mt">'+esc(u.title)+'</span></button>';
    }).join("");
    Array.prototype.forEach.call(mentionPop.children, function(b){
      b.addEventListener("mousedown", function(e){ e.preventDefault(); pickMention(user(b.getAttribute("data-uid"))); });
    });
  }
  function mentionKeydown(e, ta){
    if(!mentionState) return false;
    if (e.key==="ArrowDown"){ e.preventDefault(); mentionState.sel=(mentionState.sel+1)%mentionState.hits.length; drawMention(); return true; }
    if (e.key==="ArrowUp"){ e.preventDefault(); mentionState.sel=(mentionState.sel-1+mentionState.hits.length)%mentionState.hits.length; drawMention(); return true; }
    if (e.key==="Enter" || e.key==="Tab"){ e.preventDefault(); pickMention(mentionState.hits[mentionState.sel]); return true; }
    if (e.key==="Escape"){ if(mentionPop){mentionPop.remove();mentionPop=null;mentionState=null;} return true; }
    return false;
  }
  function pickMention(u){
    var st=mentionState; if(!st) return;
    var ta=st.ta, v=ta.value, name=u.name.split(" ")[0];
    ta.value = v.slice(0,st.start)+"@"+name+" "+v.slice(ta.selectionStart);
    ta.selectionStart=ta.selectionEnd=st.start+name.length+2;
    if(mentionPop){mentionPop.remove();mentionPop=null;} mentionState=null; ta.focus();
  }

  /* ==================================================================
     Command palette
     ================================================================== */
  var pal = { open:false, sel:0, items:[] };
  function paletteIndex(q){
    q = q.toLowerCase().trim();
    var groups = [];
    var chans = CHANNELS.filter(function(c){ return !q || c.name.indexOf(q)>-1; })
      .map(function(c){ return { type:"channel", id:c.id, label:"#"+c.name, sub:c.topic, icon:"#" }; });
    var people = DMS.concat().filter(function(d){ return !q || convoName(d).toLowerCase().indexOf(q)>-1; })
      .map(function(d){ return { type:"dm", id:d.id, label:convoName(d), sub: d.users.length===1?user(d.users[0]).title:"Group", av: d.users.length===1?user(d.users[0]):null }; });
    var actions = [
      { type:"act", id:"a-threads", label:"Open all threads", icon:"th" },
      { type:"act", id:"a-away", label:"Set yourself "+(U.me.presence==="active"?"away":"active"), icon:"pr" },
      { type:"act", id:"a-shortcuts", label:"Keyboard shortcuts", icon:"kb", k:"⌘/" },
      { type:"act", id:"a-site", label:"Back to OTeams.com", icon:"ex" },
      { type:"act", id:"a-reset", label:"Reset demo data", icon:"rs" }
    ].filter(function(a){ return !q || a.label.toLowerCase().indexOf(q)>-1; });
    if (chans.length) groups.push({ label:"Channels", items:chans });
    if (people.length) groups.push({ label:"People & DMs", items:people });
    if (q.length>=2){
      var msgs = [];
      eachMessage(function(mm,c){
        if (mm.voice) return; var t = mm.text||""; var i = t.toLowerCase().indexOf(q);
        if (i>-1) msgs.push({ type:"msg", conv:c.id, msgid:mm.id, label:user(mm.user).name+" · "+convoName(c), av:user(mm.user), subHTML:excerpt(t,i,q.length) });
      });
      if (msgs.length) groups.push({ label:"Messages", items:msgs.slice(0,6) });
    }
    if (actions.length) groups.push({ label:"Actions", items:actions });
    return groups;
  }
  function excerpt(t, i, len){
    var start = Math.max(0, i-22);
    var pre = (start>0?"…":"") + t.slice(start, i), mid = t.slice(i, i+len), post = t.slice(i+len, i+len+42) + (i+len+42<t.length?"…":"");
    return esc(pre.replace(/\n/g," ")) + "<em>" + esc(mid) + "</em>" + esc(post.replace(/\n/g," "));
  }
  function openPalette(){
    pal.open=true; pal.sel=0; $("#paletteScrim").hidden=false;
    var inp=$("#palInput"); inp.value=""; drawPalette(); setTimeout(function(){inp.focus();},20);
  }
  function closePalette(){ pal.open=false; $("#paletteScrim").hidden=true; }
  function drawPalette(){
    var q=$("#palInput").value, groups=paletteIndex(q), flat=[], html="";
    groups.forEach(function(g){
      html += '<div class="pal-group">'+g.label+'</div>';
      g.items.forEach(function(it){
        var idx=flat.length; flat.push(it);
        var pic = it.av ? '<span class="pic av '+it.av.av+'">'+esc(it.av.initials)+'</span>'
          : '<span class="pic">'+palIcon(it.icon)+'</span>';
        var subhtml = it.subHTML ? it.subHTML : (it.sub ? esc(it.sub) : "");
        html += '<div class="pal-item'+(idx===pal.sel?" sel":"")+'" data-i="'+idx+'">'+pic+
          '<span class="pt"><b>'+esc(it.label)+'</b>'+(subhtml?'<span>'+subhtml+'</span>':"")+'</span>'+
          (it.k?'<kbd>'+it.k+'</kbd>':"")+'</div>';
      });
    });
    if(!flat.length) html='<div class="pal-empty">No matches for "'+esc(q)+'"</div>';
    pal.items=flat; $("#palResults").innerHTML=html;
    var selEl=$(".pal-item.sel"); if(selEl) selEl.scrollIntoView({block:"nearest"});
  }
  function palIcon(t){
    var p={ "#":'<svg viewBox="0 0 24 24"><path d="M5 9h14M5 15h14M9 4l-2 16M17 4l-2 16"/></svg>',
      th:'<svg viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.8-5.8A8.5 8.5 0 1 1 21 11.5z"/></svg>',
      pr:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
      kb:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/></svg>',
      ex:'<svg viewBox="0 0 24 24"><path d="M10 5H5v14h14v-5M14 4h6v6M20 4l-9 9"/></svg>',
      rs:'<svg viewBox="0 0 24 24"><path d="M4 4v6h6M20 20v-6h-6M20 9A8 8 0 0 0 6 5M4 15a8 8 0 0 0 14 4"/></svg>' };
    return p[t]||p["#"];
  }
  function palActivate(it){
    if(!it) return;
    if (it.type==="channel"||it.type==="dm"){ closePalette(); if(viewMode) closeView(); openConvo(it.id); return; }
    if (it.type==="msg"){ closePalette(); if(viewMode) closeView(); openConvo(it.conv); setTimeout(function(){ scrollToMsg(it.msgid); }, 70); return; }
    closePalette();
    if (it.id==="a-threads") openView("threads");
    else if (it.id==="a-away"){ U.me.presence=U.me.presence==="active"?"away":"active"; save(); renderRail(); toast("You're now "+U.me.presence, U.me.presence==="active"?"🟢":"🌙"); }
    else if (it.id==="a-shortcuts") openShortcuts();
    else if (it.id==="a-site") location.href="/oteams/";
    else if (it.id==="a-reset"){ localStorage.removeItem(LSKEY); location.reload(); }
  }

  /* ==================================================================
     Menus, modals, toasts
     ================================================================== */
  function toast(text, em){
    var t=document.createElement("div"); t.className="toast";
    t.innerHTML=(em?'<span class="em">'+em+'</span>':"")+esc(text);
    $("#toasts").appendChild(t);
    setTimeout(function(){ t.style.opacity="0"; t.style.transform="translateY(8px)"; t.style.transition="all .3s"; setTimeout(function(){t.remove();},300); }, 2600);
  }
  function openShortcuts(){
    var rows=[["Open search / jump to","⌘","K"],["Keyboard shortcuts","⌘","/"],["Close / cancel","esc"],["Next / previous result","↑","↓"],["Send message","↵"],["New line in message","⇧","↵"],["Bold / italic in composer","⌘","B"]];
    $("#shortcutsBody").innerHTML = rows.map(function(r){
      return '<div class="sc-row"><span>'+r[0]+'</span><span class="keys">'+r.slice(1).map(function(k){return "<kbd>"+k+"</kbd>";}).join("")+'</span></div>';
    }).join("");
    $("#shortcutsScrim").hidden=false;
  }
  function openWsPop(){
    closeMenus();
    var w=WORKSPACES[0], p=$("#wsPop");
    p.innerHTML='<div class="pop-head"><span class="av" style="background:var(--signal);color:#fff">N</span><div><b>Northwind</b><span>northwind.oteams.com · 9 members</span></div></div>'+
      popItem("invite","Invite people to Northwind","<circle cx='9' cy='8' r='3.2'/><path d='M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5'/><path d='M18 9v6M21 12h-6'/>")+
      popItem("prefs","Preferences","<circle cx='12' cy='12' r='3'/><path d='M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.3-1.3L14 2h-4l-.3 2.5A7 7 0 0 0 7.4 5.8l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.3 1.3L10 22h4l.3-2.5a7 7 0 0 0 2.3-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z'/>")+
      popItem("admin","Administration","<rect x='4' y='11' width='16' height='9' rx='2'/><path d='M8 11V8a4 4 0 0 1 8 0v3'/>")+
      '<div class="pop-sep"></div>'+
      '<button class="pop-item danger" data-act="signout"><svg viewBox="0 0 24 24"><path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 8l-4 4 4 4M6 12h9"/></svg>Sign out of OTeams</button>';
    positionPop(p, $("#wsMenu"), "left");
  }
  function openMePop(anchor){
    closeMenus();
    var p=$("#mePop");
    p.innerHTML='<div class="pop-head">'+avatar(U.me)+'<div><b>You</b><span>'+esc(U.me.title)+' · Northwind</span></div></div>'+
      presItem("active","Active","var(--green)")+ presItem("away","Away","transparent")+ presItem("dnd","Do not disturb","var(--red)")+
      '<div class="pop-sep"></div>'+
      popItem("status","Set a status","<circle cx='12' cy='12' r='9'/><path d='M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01'/>")+
      popItem("profile","View profile","<circle cx='12' cy='8' r='4'/><path d='M4 21c0-4 4-6 8-6s8 2 8 6'/>")+
      '<div class="pop-sep"></div>'+
      '<button class="pop-item danger" data-act="signout"><svg viewBox="0 0 24 24"><path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 8l-4 4 4 4M6 12h9"/></svg>Sign out</button>';
    positionPop(p, anchor, "right");
  }
  function presItem(id,label,color){
    var on=U.me.presence===id;
    return '<button class="pop-item" data-act="pres" data-p="'+id+'"><span class="dot" style="background:'+color+';'+(color==="transparent"?"box-shadow:inset 0 0 0 2px var(--slate-2)":"")+'"></span>'+label+(on?' <svg style="margin-left:auto;width:16px;height:16px;stroke:var(--accent)" viewBox="0 0 24 24" fill="none" stroke-width="2.4"><path d="M5 12l5 5L20 6"/></svg>':"")+'</button>';
  }
  function popItem(act,label,path){ return '<button class="pop-item" data-act="menu-'+act+'"><svg viewBox="0 0 24 24">'+path+'</svg>'+esc(label)+'</button>'; }
  function positionPop(p, anchor, align){
    p.hidden=false; var r=anchor.getBoundingClientRect();
    if (align==="left"){ p.style.left=r.left+"px"; p.style.top=(r.bottom+8)+"px"; p.style.right="auto"; }
    else { p.style.right=(window.innerWidth-r.right)+"px"; p.style.left="auto"; p.style.top=(r.bottom+8)+"px"; }
  }
  function closeMenus(){ $("#wsPop").hidden=true; $("#mePop").hidden=true; }

  /* mobile */
  function closeMobileNav(){ document.getElementById("app").classList.remove("nav-open"); }

  /* ==================================================================
     Events
     ================================================================== */
  function onDocClick(e){
    var hr = e.target.closest("[data-hreact]"); if (hr){ floatReaction(hr.getAttribute("data-hreact")); return; }
    var mm = e.target.closest("[data-mm]"); if (mm){ msgAction(mm.getAttribute("data-mm"), mm.getAttribute("data-msg")); return; }
    var a = e.target.closest("[data-act]");
    // close transient popovers when clicking outside them
    if (!e.target.closest(".emoji-pop") && !e.target.closest(".mention-pop") && !(a&&/react-open|react-quick|emoji/.test(a.getAttribute("data-act")||""))) closePops();
    if (!e.target.closest(".pop") && !e.target.closest("#wsMenu") && !e.target.closest("#railMe") && !e.target.closest("#tbAvatar")) closeMenus();
    if (!e.target.closest(".assist-pop") && !e.target.closest('[data-cbtn="roxan"]')) closeAssist();
    if (!e.target.closest(".msg-menu") && !(a&&a.getAttribute("data-act")==="msg-more")) closeMsgMenu();
    if (!e.target.closest(".slash-pop") && !e.target.closest(".cx-input")) closeSlash();
    if (!a) return;
    var act = a.getAttribute("data-act");
    switch(act){
      case "open": openConvo(a.getAttribute("data-id")); break;
      case "goto-name": {
        var nm=a.getAttribute("data-name"); var c=CHANNELS.filter(function(x){return x.name===nm;})[0]; if(c) openConvo(c.id); else toast("No channel #"+nm,"🔍"); break;
      }
      case "toggle-sec": { var s=a.getAttribute("data-sec"); collapsed[s]=!collapsed[s]; save(); renderSidebar(); break; }
      case "ws": { var id=a.getAttribute("data-id"); if(id==="northwind"){/*current*/} else toast(user2ws(id)+" is view-only in this demo","🏢"); break; }
      case "react-toggle": toggleReaction(a.getAttribute("data-msg"), a.getAttribute("data-em")); break;
      case "react-quick": { var msg=findMsg(a.getAttribute("data-msg")); if(msg){ toggleReaction(msg.id, a.getAttribute("data-em")); } break; }
      case "react-open": { var mid=a.getAttribute("data-msg"); openEmojiPop(a, function(em){ toggleReaction(mid, em); }); break; }
      case "thread": openThread(a.getAttribute("data-msg")); break;
      case "msg-more": openMsgMenu(a, a.getAttribute("data-msg")); break;
      case "open-pinned": openView("pinned"); break;
      case "close-view": closeView(); break;
      case "view-open": {
        var conv=a.getAttribute("data-conv"), mid=a.getAttribute("data-msg"), knd=a.getAttribute("data-kind");
        closeView(); openConvo(conv);
        if (knd==="thread") setTimeout(function(){ openThread(mid); }, 60); else setTimeout(function(){ scrollToMsg(mid); }, 70);
        break;
      }
      case "edit-save": { var box=a.closest(".edit-box"); saveEdit(a.getAttribute("data-msg"), box?box.querySelector(".edit-ta").value:""); break; }
      case "edit-cancel": editingId=null; renderMessages(); break;
      case "close-mini": closeMini(); break;
      case "save-status": saveStatus(); break;
      case "status-preset": applyStatusPreset(a.getAttribute("data-preset")); break;
      case "create-channel": createChannel(); break;
      case "star": { var cc=convo(current); starred[cc.id]=!starred[cc.id]; save(); renderHeader(); toast(starred[cc.id]?"Added to starred":"Removed from starred", starred[cc.id]?"⭐":"☆"); break; }
      case "huddle": huddleFromChannel(); break;
      case "voice": joinVoice(a.getAttribute("data-id")); break;
      case "members": toggleMembers(); break;
      case "details": toast("Channel details — demo stub","ℹ️"); break;
      case "catchup": catchUp(); break;
      case "dismiss-catchup": { var cu=a.closest(".catchup"); if(cu) cu.remove(); break; }
      case "quote": startReply(a.getAttribute("data-msg")); break;
      case "cancel-reply": clearReply(); break;
      case "scrollto": scrollToMsg(a.getAttribute("data-msg")); break;
      case "vplay": playVoice(a.getAttribute("data-msg")); break;
      case "open-dm": openDM(a.getAttribute("data-uid")); break;
      case "topic": toast("Editing the topic — demo stub","✏️"); break;
      case "file": toast("Opening file preview — demo stub","📄"); break;
      case "send": { var kind=a.getAttribute("data-kind"); var ta = kind==="thread"?$("#threadComposerWrap .cx-input"):$("#composerWrap .cx-input"); doSend(kind, ta); break; }
      case "pres": { U.me.presence=a.getAttribute("data-p"); save(); renderRail(); closeMenus(); toast("Status set to "+U.me.presence, U.me.presence==="active"?"🟢":U.me.presence==="dnd"?"⛔":"🌙"); break; }
      case "signout": try { localStorage.removeItem("oteams.session"); } catch(e){} location.href="/oteams/signin/"; break;
      case "menu-invite": toast("Invite flow — demo stub","✉️"); closeMenus(); break;
      case "menu-prefs": openShortcuts(); closeMenus(); break;
      case "menu-admin": toast("Admin console — demo stub","🛡️"); closeMenus(); break;
      case "menu-status": openStatus(); break;
      case "menu-profile": toast("Your profile — demo stub","👤"); closeMenus(); break;
      default:
        if (/^huddle-/.test(act)) huddleControl(act);
        else if (act==="add-channels") openCreateChannel();
        else if (/^add-/.test(act)) toast("Create "+(act==="add-dms"?"a direct message":act==="add-voice"?"a voice channel":"an app")+" — demo stub","＋");
    }
  }
  function user2ws(id){ var w=WORKSPACES.filter(function(x){return x.id===id;})[0]; return w?w.name:"That workspace"; }

  function onKey(e){
    var meta = e.metaKey||e.ctrlKey;
    if (meta && e.key.toLowerCase()==="k"){ e.preventDefault(); pal.open?closePalette():openPalette(); return; }
    if (meta && e.key==="/"){ e.preventDefault(); openShortcuts(); return; }
    if (e.key==="Escape"){
      if (assistPop){ closeAssist(); return; }
      if (msgMenu){ closeMsgMenu(); return; }
      if (slashState){ closeSlash(); return; }
      if (emojiPop||mentionPop){ closePops(); return; }
      if (miniEl){ closeMini(); return; }
      if (!$("#wsPop").hidden||!$("#mePop").hidden){ closeMenus(); return; }
      if (!$("#shortcutsScrim").hidden){ $("#shortcutsScrim").hidden=true; return; }
      if (pal.open){ closePalette(); return; }
      if (!$("#huddleStage").hidden){ minimizeHuddle(); return; }
      if (editingId){ editingId=null; renderMessages(); return; }
      if (replyingTo){ clearReply(); return; }
      if (!$("#threadPane").hidden){ closeThread(); return; }
      if (viewMode){ closeView(); return; }
      closeMobileNav();
      return;
    }
    if (pal.open){
      if (e.key==="ArrowDown"){ e.preventDefault(); pal.sel=Math.min(pal.sel+1,pal.items.length-1); drawPalette(); }
      else if (e.key==="ArrowUp"){ e.preventDefault(); pal.sel=Math.max(pal.sel-1,0); drawPalette(); }
      else if (e.key==="Enter"){ e.preventDefault(); palActivate(pal.items[pal.sel]); }
    }
  }

  function wireStatic(){
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    $("#openPalette").addEventListener("click", openPalette);
    $("#palInput").addEventListener("input", function(){ pal.sel=0; drawPalette(); });
    $("#palResults").addEventListener("mousemove", function(e){ var it=e.target.closest(".pal-item"); if(it){ pal.sel=+it.getAttribute("data-i"); drawPalette(); } });
    $("#palResults").addEventListener("click", function(e){ var it=e.target.closest(".pal-item"); if(it){ palActivate(pal.items[+it.getAttribute("data-i")]); } });
    $("#paletteScrim").addEventListener("click", function(e){ if(e.target===this) closePalette(); });
    $("#shortcutsScrim").addEventListener("click", function(e){ if(e.target===this) this.hidden=true; });
    $("#shortcutsClose").addEventListener("click", function(){ $("#shortcutsScrim").hidden=true; });
    $("#threadClose").addEventListener("click", closeThread);
    $("#wsMenu").addEventListener("click", function(e){ e.stopPropagation(); $("#wsPop").hidden?openWsPop():closeMenus(); });
    $("#railMe").addEventListener("click", function(e){ e.stopPropagation(); $("#mePop").hidden?openMePop(this):closeMenus(); });
    $("#tbAvatar").addEventListener("click", function(e){ e.stopPropagation(); $("#mePop").hidden?openMePop(this):closeMenus(); });
    $("#railHelp").addEventListener("click", openShortcuts);
    $("#tbHelp").addEventListener("click", openShortcuts);
    $("#themeToggle").addEventListener("click", toggleTheme);
    $("#threadSummarize").addEventListener("click", summarizeThread);
    $("#tbNotif").addEventListener("click", function(){ openView("activity"); });
    $("#railAdd").addEventListener("click", function(){ toast("Add a workspace — demo stub","＋"); });
    $("#composeNew").addEventListener("click", function(){ openPalette(); });
    $("#navBack").addEventListener("click", navBack);
    $("#navFwd").addEventListener("click", navFwd);
    $("#menuBtn").addEventListener("click", function(){ document.getElementById("app").classList.toggle("nav-open"); });
    $("#mobileScrim").addEventListener("click", closeMobileNav);
    $("#sbFoot").addEventListener("click", function(){ toast("Enterprise Key Management · SOC 2 · GDPR · HIPAA-ready","🔒"); });
    document.querySelector(".sb-quick").addEventListener("click", function(e){ var b=e.target.closest(".q-item"); if(!b) return; var v=b.getAttribute("data-view"); if(v==="threads") openView("threads"); else if(v==="mentions") openView("mentions"); else toast("Drafts — nothing saved yet","📝"); });
    window.addEventListener("resize", function(){ closePops(); });
  }

  /* ==================================================================
     Theme (Apple light/dark)
     ================================================================== */
  function saveUI(){ try { localStorage.setItem("oteams.ui", JSON.stringify({ theme:theme, memberOpen:memberOpen })); } catch(e){} }
  function loadUI(){ try { var d = JSON.parse(localStorage.getItem("oteams.ui")||"{}"); if(d.theme) theme=d.theme; if(typeof d.memberOpen==="boolean") memberOpen=d.memberOpen; } catch(e){} }
  function applyTheme(){
    document.documentElement.setAttribute("data-theme", theme);
    var btn = $("#themeToggle");
    if (btn) btn.innerHTML = theme==="dark"
      ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
    var meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.setAttribute("content", theme==="dark"?"#0E1116":"#0C0E13");
  }
  function toggleTheme(){ theme = theme==="dark"?"light":"dark"; applyTheme(); saveUI(); toast(theme==="dark"?"Dark theme":"Light theme", theme==="dark"?"🌙":"☀️"); }

  /* ==================================================================
     Member list (Discord)
     ================================================================== */
  function channelMembers(c){
    var base = { general:["wren","mara","ada","jonah","rhea","deshawn","tomas","lin","me"],
      "launch-q3":["rhea","ada","jonah","deshawn","lin","me"], engineering:["jonah","tomas","rhea","me"],
      design:["ada","rhea","me"], sales:["deshawn","mara","lin","me"], customers:["lin","rhea","me"],
      random:["ada","jonah","tomas","deshawn","lin","me"], "exec-staff":["wren","mara","me"] };
    return base[c.id] || ["me"];
  }
  function renderMembers(){
    var host = $("#members");
    if (!memberOpen){ host.hidden = true; return; }
    host.hidden = false;
    var c = convo(current);
    var ids = c.section==="channels" ? channelMembers(c) : (c.users||[]).concat(["me"]);
    var g = { huddle:[], online:[], away:[], offline:[] };
    ids.forEach(function(id){
      var u = user(id);
      if (huddle.active && huddle.parts.indexOf(id)>-1) g.huddle.push(id);
      else if (u.presence==="active") g.online.push(id);
      else if (u.presence==="away"||u.presence==="dnd") g.away.push(id);
      else g.offline.push(id);
    });
    var html = '<div class="mem-hd">Members <span class="cnt" style="color:var(--slate-2);font-family:var(--mono);font-weight:500">'+ids.length+'</span></div>';
    html += memGroup("In a huddle", g.huddle) + memGroup("Online", g.online) + memGroup("Away", g.away) + memGroup("Offline", g.offline);
    host.innerHTML = html;
  }
  function memGroup(label, ids){
    if (!ids.length) return "";
    var items = ids.map(function(id){
      var u = user(id), st = statusOf(id);
      return '<button class="mem'+(u.presence==="offline"?" offline":"")+'" data-act="open-dm" data-uid="'+id+'">'+
        '<span class="avwrap">'+avatar(u)+'<i class="pres '+u.presence+'"></i></span>'+
        '<div class="mt"><div class="mn" style="color:'+roleColor(id)+'">'+esc(u.name)+(id==="me"?" (you)":"")+'</div>'+(st?'<div class="ms">'+esc(st)+'</div>':"")+'</div></button>';
    }).join("");
    return '<div class="mem-group">'+label+' <span class="cnt">— '+ids.length+'</span></div>'+items;
  }
  function toggleMembers(){ memberOpen = !memberOpen; renderMembers(); renderHeader(); saveUI(); }
  function openDM(uid){
    if (uid==="me") return;
    var dm = DMS.filter(function(d){ return d.users.length===1 && d.users[0]===uid; })[0];
    if (dm) openConvo(dm.id); else toast("No direct message with "+user(uid).name+" yet","💬");
  }

  /* ==================================================================
     Reply-to-quote (WhatsApp)
     ================================================================== */
  function startReply(msgId){
    var mm = findMsg(msgId); if (!mm) return;
    replyingTo = msgId;
    var slot = document.querySelector('.reply-slot[data-kind="main"]'); if (!slot) return;
    var snip = (mm.voice?"🎤 Voice message":(mm.text||"")).replace(/\n/g," ").slice(0,80);
    slot.innerHTML = '<div class="reply-chip"><div class="rc-bar"></div><div class="rc-t"><b>Replying to '+esc(user(mm.user).name)+'</b><span>'+esc(snip)+'</span></div><button class="rc-x" data-act="cancel-reply" aria-label="Cancel"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>';
    var ta = $("#composerWrap .cx-input"); if (ta) ta.focus();
  }
  function clearReply(){ replyingTo = null; var slot = document.querySelector('.reply-slot[data-kind="main"]'); if (slot) slot.innerHTML = ""; }
  function scrollToMsg(id){
    var el = document.querySelector('#msgs .grp[data-msg="'+id+'"]'); if (!el) return;
    el.scrollIntoView({ block:"center", behavior:"smooth" });
    el.style.transition = "background .6s"; el.style.background = "rgba(91,141,239,.14)";
    setTimeout(function(){ el.style.background = ""; }, 900);
  }

  /* ==================================================================
     Typing indicator (WhatsApp/Discord)
     ================================================================== */
  function scheduleTyping(){
    clearTimeout(typingTimer); clearTimeout(typingHideTimer); hideTyping();
    var c = convo(current); if (!c) return;
    var pool = (c.section==="channels" ? channelMembers(c) : (c.users||[])).filter(function(id){ return id!=="me" && !user(id).bot && user(id).presence==="active"; });
    if (!pool.length) return;
    typingTimer = setTimeout(function tick(){
      showTyping(pool[Math.floor(Math.random()*pool.length)]);
      typingHideTimer = setTimeout(function(){ hideTyping(); typingTimer = setTimeout(tick, 12000+Math.random()*14000); }, 2600);
    }, 3500+Math.random()*4000);
  }
  function showTyping(id){ var el = $("#typingBar"); if (!el) return; el.hidden = false; el.innerHTML = '<span class="who" style="color:'+roleColor(id)+'">'+esc(user(id).name.split(" ")[0])+'</span> is typing<span class="dots"><i></i><i></i><i></i></span>'; }
  function hideTyping(){ var el = $("#typingBar"); if (el){ el.hidden = true; el.innerHTML = ""; } }

  /* ==================================================================
     Voice notes (WhatsApp)
     ================================================================== */
  var recState = null, playing = null;
  function startRecording(kind, root){
    if (recState) return;
    var cx = root.querySelector(".cx"), input = root.querySelector(".cx-input"), bottom = root.querySelector(".cx-bottom"), toolbar = root.querySelector(".cx-toolbar");
    input.style.display = "none"; if (toolbar) toolbar.style.display = "none"; bottom.style.display = "none";
    var rec = document.createElement("div"); rec.className = "recording";
    rec.innerHTML = '<span class="rdot"></span><span class="rtime">0:00</span><div class="rwave" id="recWave"></div>'+
      '<button class="rcancel" data-rec="cancel" title="Cancel"><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>'+
      '<button class="rsend" data-rec="send" title="Send"><svg viewBox="0 0 24 24"><path d="M4 12l16-7-7 16-2-7z"/></svg></button>';
    cx.appendChild(rec);
    var t0 = Date.now();
    var timer = setInterval(function(){
      var s = Math.floor((Date.now()-t0)/1000); rec.querySelector(".rtime").textContent = Math.floor(s/60)+":"+(s%60<10?"0":"")+(s%60);
      var w = $("#recWave"); if (w){ var bar = document.createElement("i"); bar.style.height = (25+Math.random()*70)+"%"; w.appendChild(bar); if (w.children.length>34) w.removeChild(w.firstChild); }
    }, 170);
    recState = { kind:kind, t0:t0, restore:function(){ clearInterval(timer); rec.remove(); input.style.display=""; if(toolbar) toolbar.style.display=""; bottom.style.display=""; recState=null; } };
    rec.addEventListener("click", function(e){ var b = e.target.closest("[data-rec]"); if (!b) return; if (b.getAttribute("data-rec")==="cancel") recState.restore(); else finishRecording(); });
  }
  function finishRecording(){
    if (!recState) return;
    var s = Math.max(1, Math.floor((Date.now()-recState.t0)/1000));
    var dur = Math.floor(s/60)+":"+(s%60<10?"0":"")+(s%60), wave = [];
    for (var i=0;i<28;i++) wave.push(20+Math.round(Math.random()*80));
    var kind = recState.kind; recState.restore();
    if (kind==="thread"){ var pm = findThreadParent(); if (pm){ pm.replies.push({ id:"r"+Date.now(), user:"me", ts:Date.now(), voice:{dur:dur,wave:wave} }); save(); renderThread(); renderMessages(); } }
    else { var id = "v"+Date.now(); (messages[current]=messages[current]||[]).push({ id:id, user:"me", ts:Date.now(), reactions:{}, replies:[], receipt:"sent", voice:{dur:dur,wave:wave} }); save(); renderMessages(); progressReceipt(id); }
    toast("Voice message sent","🎤");
  }
  function findThreadParent(){ return (messages[current]||[]).filter(function(x){ return x.id===threadMsgId; })[0]; }
  function playVoice(msgId){
    var el = document.querySelector('.vnote[data-msg="'+msgId+'"]'); if (!el) return;
    var bars = [].slice.call(el.querySelectorAll(".wave i"));
    if (el.classList.contains("playing")){ stopVoice(el, bars); return; }
    document.querySelectorAll(".vnote.playing").forEach(function(o){ stopVoice(o, [].slice.call(o.querySelectorAll(".wave i"))); });
    el.classList.add("playing"); setPlayIcon(el, true);
    var i = 0; playing = setInterval(function(){ if (i<bars.length){ bars[i].classList.add("on"); i++; } else stopVoice(el, bars); }, 85);
  }
  function stopVoice(el, bars){ if (playing){ clearInterval(playing); playing=null; } el.classList.remove("playing"); bars.forEach(function(b){ b.classList.remove("on"); }); setPlayIcon(el, false); }
  function setPlayIcon(el, on){ var p = el.querySelector(".play svg path"); if (p) p.setAttribute("d", on?"M8 5h3v14H8zM14 5h3v14h-3z":"M8 5v14l11-7z"); }

  /* ==================================================================
     Roxan AI (catch-up, thread summary, compose assist)
     ================================================================== */
  function catchUp(){
    var c = convo(current), list = (messages[current]||[]).filter(function(m){ return !m.system; });
    if (!list.length){ toast("Nothing to catch up on here yet","✨"); return; }
    var authors = {}; list.forEach(function(m){ if (m.user!=="me" && !user(m.user).bot) authors[m.user] = (authors[m.user]||0)+1; });
    var people = Object.keys(authors), names = people.slice(0,3).map(function(id){ return user(id).name.split(" ")[0]; });
    var items = [], key = list.filter(function(m){ return /aug 14|locked|approved|decision|sign-off|shipping|closed/i.test(m.text||""); }).slice(-3);
    key.forEach(function(m){ items.push({ k:user(m.user).name.split(" ")[0], t:(m.text||"").replace(/[*>\n]/g," ").replace(/\s+/g," ").trim().slice(0,72) }); });
    if (!items.length){ var last = list[list.length-1]; items.push({ k:user(last.user).name.split(" ")[0], t:(last.text||"Voice message").replace(/\n/g," ").slice(0,72) }); }
    var summary = list.length+" messages from "+people.length+" "+(people.length===1?"person":"people")+(names.length?" ("+names.join(", ")+(people.length>names.length?" +"+(people.length-names.length):"")+")":"")+" since this channel began. Here's what matters:";
    var html = '<div class="catchup"><div class="catchup-in"><div class="cu-top"><span class="spark"><svg viewBox="0 0 24 24"><path d="M12 3.4c.7 3.9 1.9 5.1 5.8 5.8-3.9.7-5.1 1.9-5.8 5.8-.7-3.9-1.9-5.1-5.8-5.8 3.9-.7 5.1-1.9 5.8-5.8z"/></svg></span><b>Roxan · Catch-up</b><span class="tag">'+esc(convoName(c))+'</span><button class="cu-x" data-act="dismiss-catchup" aria-label="Dismiss"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><p>'+esc(summary)+'</p><div class="cu-list">'+
      items.map(function(it){ return '<div class="cu-item"><span class="k">'+esc(it.k)+'</span><span>'+esc(it.t)+'</span></div>'; }).join("")+'</div></div></div>';
    var box = $("#msgs"); var ex = box.querySelector(".catchup"); if (ex) ex.remove();
    box.insertAdjacentHTML("afterbegin", html); box.scrollTop = 0;
  }
  function summarizeThread(){
    var pm = findThreadParent(); if (!pm || !pm.replies.length){ toast("No replies to summarize yet","✨"); return; }
    var who = pm.replies.map(function(r){ return user(r.user).name.split(" ")[0]; }); var uniq = who.filter(function(v,i){ return who.indexOf(v)===i; });
    var last = pm.replies[pm.replies.length-1];
    var summary = pm.replies.length+" repl"+(pm.replies.length>1?"ies":"y")+" from "+uniq.join(", ")+'. Latest — “'+(last.text||"Voice message").replace(/\n/g," ").slice(0,64)+'”.';
    var body = $("#threadBody"); var ex = body.querySelector(".catchup"); if (ex) ex.remove();
    body.insertAdjacentHTML("afterbegin", '<div class="catchup" style="margin:8px 12px"><div class="catchup-in"><div class="cu-top"><span class="spark"><svg viewBox="0 0 24 24"><path d="M12 3.4c.7 3.9 1.9 5.1 5.8 5.8-3.9.7-5.1 1.9-5.8 5.8-.7-3.9-1.9-5.1-5.8-5.8 3.9-.7 5.1-1.9 5.8-5.8z"/></svg></span><b>Roxan · Thread summary</b><button class="cu-x" data-act="dismiss-catchup" aria-label="Dismiss"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><p>'+esc(summary)+'</p></div></div>');
  }
  var assistPop = null;
  function openAssist(anchor, ta, sync){
    closeAssist();
    var draft = ta.value.trim();
    var opts = draft ? [
      { t:"Make it more professional", s:"Polish tone for an exec audience", f:function(x){ return polish(x); } },
      { t:"Make it friendlier", s:"Warmer, more casual", f:function(x){ return "Hey team — "+x.charAt(0).toLowerCase()+x.slice(1)+" 🙌"; } },
      { t:"Shorten it", s:"Tighten to the essentials", f:function(x){ return x.split(/[.!?]\s/)[0].trim().replace(/[.!?]*$/,"")+"."; } }
    ] : [
      { t:"Draft a status update", s:"For "+convoName(convo(current)), f:function(){ return "Quick update: we're on track for the Q3 launch (Aug 14). QA sign-off is in progress, pricing is approved, no blockers. I'll flag here if anything changes."; } },
      { t:"Summarize this channel", s:"Post the highlights", f:function(){ return channelDigest(); } },
      { t:"Suggest a reply", s:"Based on the latest message", f:function(){ return "Thanks for the update — looks good on my end. 👍 Ping me if you need anything."; } }
    ];
    var p = document.createElement("div"); p.className = "assist-pop";
    p.innerHTML = '<div class="ah"><svg viewBox="0 0 24 24"><path d="M12 3.4c.7 3.9 1.9 5.1 5.8 5.8-3.9.7-5.1 1.9-5.8 5.8-.7-3.9-1.9-5.1-5.8-5.8 3.9-.7 5.1-1.9 5.8-5.8z"/></svg>Roxan can help</div>'+
      opts.map(function(o,i){ return '<button class="opt" data-i="'+i+'">'+esc(o.t)+'<span>'+esc(o.s)+'</span></button>'; }).join("");
    document.body.appendChild(p);
    var r = anchor.getBoundingClientRect();
    p.style.left = Math.max(12, Math.min(r.left, window.innerWidth-p.offsetWidth-12))+"px";
    p.style.top = Math.max(12, r.top-p.offsetHeight-8)+"px";
    p.addEventListener("click", function(e){ var b = e.target.closest(".opt"); if (!b) return; var o = opts[+b.getAttribute("data-i")]; ta.value = o.f(draft); sync(); closeAssist(); ta.focus(); toast("Roxan drafted that for you","✨"); });
    assistPop = p;
  }
  function closeAssist(){ if (assistPop){ assistPop.remove(); assistPop = null; } }
  function polish(x){ return x.replace(/\bgonna\b/gi,"going to").replace(/\bwanna\b/gi,"want to").replace(/\byeah\b/gi,"yes").replace(/\bthx\b/gi,"thanks").replace(/!+/g,"."); }
  function channelDigest(){ var list=(messages[current]||[]).filter(function(m){return !m.system;}), names={}; list.forEach(function(m){ if(m.user!=="me"&&!user(m.user).bot) names[m.user]=1; }); return "Recap of "+convoName(convo(current))+": "+list.length+" messages from "+Object.keys(names).length+" people. Key items — launch date Aug 14, pricing approved, final QA sign-off still open."; }

  /* ==================================================================
     Voice channels + Huddles (Discord + Zoom)
     ================================================================== */
  function joinVoice(vid){
    var v = VOICE.filter(function(x){ return x.id===vid; })[0]; if (!v) return;
    if (huddle.active && huddle.source===vid){ openHuddleStage(); return; }
    leaveHuddle(true);
    voiceMembers[vid] = voiceMembers[vid] || [];
    if (voiceMembers[vid].indexOf("me")<0) voiceMembers[vid].push("me");
    startHuddle(vid, "🔊 "+v.name, voiceMembers[vid].slice());
    renderSidebar();
  }
  function huddleFromChannel(){
    var c = convo(current);
    var parts = (c.section==="channels" ? channelMembers(c).filter(function(id){ return id==="me"||user(id).presence==="active"; }) : (c.users||[]).concat(["me"])).slice(0,6);
    if (parts.indexOf("me")<0) parts.push("me");
    startHuddle("h-"+c.id, (c.section==="channels"?"#"+c.name:convoName(c))+" huddle", parts);
  }
  function startHuddle(source, name, parts){
    if (huddle.timerInt) clearInterval(huddle.timerInt);
    if (huddle.speakInt) clearInterval(huddle.speakInt);
    huddle = { active:true, source:source, name:name, parts:parts.slice(), me:{ mic:true, cam:false, share:false }, minimized:false, t0:Date.now(), speaking:null };
    huddle.timerInt = setInterval(updateHuddleTimer, 1000);
    huddle.speakInt = setInterval(simSpeaking, 1600);
    openHuddleStage(); if (memberOpen) renderMembers();
  }
  function openHuddleStage(){ huddle.minimized = false; renderHuddleStage(); $("#huddleStage").hidden = false; $("#huddleBar").hidden = true; }
  function minimizeHuddle(){ huddle.minimized = true; $("#huddleStage").hidden = true; renderHuddleBar(); $("#huddleBar").hidden = false; }
  function leaveHuddle(silent){
    if (!huddle.active) return;
    if (huddle.timerInt) clearInterval(huddle.timerInt);
    if (huddle.speakInt) clearInterval(huddle.speakInt);
    Object.keys(voiceMembers).forEach(function(k){ var i = voiceMembers[k].indexOf("me"); if (i>-1) voiceMembers[k].splice(i,1); });
    huddle = { active:false, parts:[] };
    $("#huddleStage").hidden = true; $("#huddleBar").hidden = true;
    renderSidebar(); if (memberOpen) renderMembers();
    if (!silent) toast("You left the huddle","👋");
  }
  function updateHuddleTimer(){ if (!huddle.active) return; var s = Math.floor((Date.now()-huddle.t0)/1000), str = Math.floor(s/60)+":"+(s%60<10?"0":"")+(s%60); var a = $("#hsTimer"); if (a) a.textContent = str; var b = $("#hbTimer"); if (b) b.textContent = str; }
  function simSpeaking(){
    if (!huddle.active) return;
    var cands = huddle.parts.filter(function(id){ return id!=="me" || huddle.me.mic; });
    huddle.speaking = (Math.random()<0.78 && cands.length) ? cands[Math.floor(Math.random()*cands.length)] : null;
    var tiles = document.querySelectorAll("#huddleStage .htile"), offset = huddle.me.share?1:0;
    huddle.parts.forEach(function(id,i){ var t = tiles[i+offset]; if (t) t.classList.toggle("speaking", huddle.speaking===id); });
    document.querySelectorAll(".vc-mem").forEach(function(mm){ mm.classList.toggle("speaking", mm.getAttribute("data-uid")===huddle.speaking); });
  }
  function micIcon(on){ return on?'<path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4"/>':'<path d="M12 3a3 3 0 0 1 3 3v3M9 9v2a3 3 0 0 0 4.5 2.6M6 11a6 6 0 0 0 9 5.2M12 17v4M3 3l18 18"/>'; }
  function hctrl(act, cls, lbl, path){ return '<button class="hctrl '+cls+'" data-act="huddle-'+act+'" title="'+lbl+'"><svg viewBox="0 0 24 24">'+path+'</svg><span class="lbl">'+lbl+'</span></button>'; }
  function renderHuddleStage(){
    var stage = $("#huddleStage"), parts = huddle.parts;
    var n = parts.length + (huddle.me.share?1:0), cols = n<=1?1:n<=4?2:3;
    var tiles = parts.map(function(id){
      var u = user(id), me = id==="me";
      var muted = me ? !huddle.me.mic : (id==="mara"||id==="wren");
      var cam = me && huddle.me.cam;
      return '<div class="htile'+(huddle.speaking===id?" speaking":"")+(me?" you":"")+(cam?" cam":"")+'">'+
        '<div class="hcam" style="background:linear-gradient(135deg,'+roleColor(id)+'44,'+roleColor(id)+'11)"></div>'+
        '<div class="hav av '+u.av+'">'+esc(u.initials)+'</div>'+
        '<div class="hname">'+esc(me?"You":u.name.split(" ")[0])+'<svg class="mi'+(muted?" muted":"")+'" viewBox="0 0 24 24">'+micIcon(!muted)+'</svg></div></div>';
    }).join("");
    var share = huddle.me.share ? '<div class="htile share"><span class="hshare-lbl">You are sharing your screen</span><div class="hshare-art"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg><span>Screen share preview</span></div></div>' : "";
    stage.innerHTML =
      '<div class="hs-top"><div class="hs-title">'+esc(huddle.name)+' <span class="live"><i></i> LIVE</span></div><span class="hs-timer" id="hsTimer">0:00</span>'+
        '<div class="hs-actions"><button class="hs-ico" data-act="huddle-min" title="Minimize"><svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button><button class="hs-ico" data-act="huddle-settings" title="Settings"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg></button></div></div>'+
      '<div class="hs-grid" style="grid-template-columns:repeat('+cols+',minmax(210px,340px))">'+share+tiles+'</div>'+
      '<div class="hs-controls">'+
        hctrl("mic", huddle.me.mic?"":"off", huddle.me.mic?"Mute":"Unmute", micIcon(huddle.me.mic))+
        hctrl("cam", huddle.me.cam?"on":"", huddle.me.cam?"Stop video":"Start video", huddle.me.cam?'<path d="M15 10l6-4v12l-6-4z"/><rect x="3" y="6" width="12" height="12" rx="2"/>':'<path d="M15 10l6-4v12l-6-4zM3 6h12v12H3zM3 3l18 18"/>')+
        hctrl("share", huddle.me.share?"on":"", "Share", '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 8v5M9.5 10.5L12 8l2.5 2.5"/>')+
        hctrl("react", "", "React", '<circle cx="12" cy="12" r="9"/><path d="M9 14s1 1.5 3 1.5 3-1.5 3-1.5M9 9h.01M15 9h.01"/>')+
        hctrl("people", "", "People", '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.2"/>')+
        '<button class="hctrl leave" data-act="huddle-leave" title="Leave"><svg viewBox="0 0 24 24"><path d="M16 17l5-5-5-5M21 12H9M12 3H5v18h7"/></svg><span class="lbl">Leave</span></button>'+
        '<div class="hs-reactbar" id="hsReactbar" hidden>'+["👍","❤️","😂","🎉","👏","🙌","🔥","💯"].map(function(e){ return '<button data-hreact="'+e+'">'+e+'</button>'; }).join("")+'</div>'+
      '</div>';
    updateHuddleTimer();
  }
  function renderHuddleBar(){
    var bar = $("#huddleBar");
    var faces = huddle.parts.slice(0,3).map(function(id){ return avatar(user(id)); }).join("");
    bar.innerHTML = '<div class="hb-live"><span class="dot"></span><div><div class="hb-name">'+esc(huddle.name)+'</div><div class="hb-sub" id="hbTimer">0:00</div></div></div>'+
      '<div class="hb-faces">'+faces+(huddle.parts.length>3?'<span class="av av-8" style="width:26px;height:26px;font-size:9px">+'+(huddle.parts.length-3)+'</span>':"")+'</div>'+
      '<button class="hb-ctrl'+(huddle.me.mic?"":" leave")+'" data-act="huddle-mic" title="'+(huddle.me.mic?"Mute":"Unmute")+'"><svg viewBox="0 0 24 24">'+micIcon(huddle.me.mic)+'</svg></button>'+
      '<button class="hb-ctrl" data-act="huddle-expand" title="Expand"><svg viewBox="0 0 24 24"><path d="M4 10V4h6M20 14v6h-6M4 4l6 6M20 20l-6-6"/></svg></button>'+
      '<button class="hb-ctrl leave" data-act="huddle-leave" title="Leave"><svg viewBox="0 0 24 24"><path d="M16 17l5-5-5-5M21 12H9M12 3H5v18h7"/></svg></button>';
    updateHuddleTimer();
  }
  function floatReaction(em){
    var f = document.createElement("div"); f.className = "hs-react-float"; f.textContent = em;
    f.style.left = (28+Math.random()*44)+"%"; f.style.bottom = "120px";
    document.body.appendChild(f); setTimeout(function(){ f.remove(); }, 2400);
  }
  function huddleControl(act){
    if (act==="huddle-mic"){ huddle.me.mic = !huddle.me.mic; if(!$("#huddleStage").hidden) renderHuddleStage(); else renderHuddleBar(); }
    else if (act==="huddle-cam"){ huddle.me.cam = !huddle.me.cam; renderHuddleStage(); }
    else if (act==="huddle-share"){ huddle.me.share = !huddle.me.share; renderHuddleStage(); toast(huddle.me.share?"You're sharing your screen":"Stopped sharing","🖥️"); }
    else if (act==="huddle-react"){ var rb=$("#hsReactbar"); if(rb) rb.hidden=!rb.hidden; }
    else if (act==="huddle-people"){ if(!memberOpen) toggleMembers(); minimizeHuddle(); }
    else if (act==="huddle-min"){ minimizeHuddle(); }
    else if (act==="huddle-expand"){ openHuddleStage(); }
    else if (act==="huddle-leave"){ leaveHuddle(); }
    else if (act==="huddle-settings"){ toast("Huddle settings — demo stub","⚙️"); }
  }

  /* ==================================================================
     Ship-ready: views, message actions, slash, status, create channel
     ================================================================== */
  function postMine(text){
    var id = "u"+Date.now();
    (messages[current] = messages[current]||[]).push({ id:id, user:"me", ts:Date.now(), text:text, reactions:{}, replies:[], receipt:"sent" });
    save(); if (!viewMode) renderMessages(); progressReceipt(id);
  }
  function eachMessage(cb){ allConvos().forEach(function(c){ (messages[c.id]||[]).forEach(function(mm){ if (!mm.system) cb(mm, c); }); }); }
  function lastTs(m){ return (m.replies && m.replies.length) ? m.replies[m.replies.length-1].ts : m.ts; }
  function byRecent(a,b){ return lastTs(b.msg) - lastTs(a.msg); }

  /* ---- Views (Threads / Mentions / Pinned / Activity) ---- */
  var VIEW_EMPTY = {
    threads:['<path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.8-5.8A8.5 8.5 0 1 1 21 11.5z"/>',"No threads yet","When you reply in a thread, it collects here so you can follow every conversation in one place."],
    mentions:['<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"/>',"No mentions yet","When someone @mentions you or reacts to your message, you'll see it here."],
    pinned:['<path d="M9 3h6l-1 7 3 3v2h-4v6l-1 1-1-1v-6H6v-2l3-3z"/>',"Nothing pinned here","Hover a message, open ⋯, and pin it to keep what matters one click away."],
    activity:['<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',"You're all caught up","Mentions, reactions, and replies to you will land here as they happen."]
  };
  function threadsData(){ var out=[]; eachMessage(function(mm,c){ if (mm.replies&&mm.replies.length) out.push({msg:mm,conv:c,kind:"thread"}); }); return out.sort(byRecent); }
  function mentionsData(){ var out=[]; eachMessage(function(mm,c){
    if (mm.user!=="me" && /@You\b/.test(mm.text||"")) out.push({msg:mm,conv:c,kind:"mention"});
    else if (mm.user==="me" && Object.keys(mm.reactions||{}).length) out.push({msg:mm,conv:c,kind:"reaction"});
  }); return out.sort(byRecent); }
  function activityData(){ var out=mentionsData(); eachMessage(function(mm,c){ if (mm.user==="me" && mm.replies && mm.replies.length) out.push({msg:mm,conv:c,kind:"reply"}); }); return out.sort(byRecent); }
  function pinnedData(){ var ids=pinned[current]||[], out=[]; (messages[current]||[]).forEach(function(mm){ if (ids.indexOf(mm.id)>-1) out.push({msg:mm,conv:convo(current),kind:"pinned"}); }); return out; }
  function viewData(){ return viewMode==="threads"?threadsData():viewMode==="mentions"?mentionsData():viewMode==="pinned"?pinnedData():activityData(); }
  function openView(mode){ viewMode=mode; editingId=null; closeThread(); $(".main").classList.add("viewing"); renderHeader(); renderMessages(); closeMobileNav(); }
  function closeView(){ viewMode=null; $(".main").classList.remove("viewing"); renderHeader(); renderMessages(); renderComposer(); }
  function renderView(){
    var box=$("#msgs"), data=viewData(), e=VIEW_EMPTY[viewMode];
    if (!data.length){ box.innerHTML='<div class="view-empty"><div class="mesh"><svg viewBox="0 0 24 24">'+e[0]+'</svg></div><h3>'+esc(e[1])+'</h3><p>'+esc(e[2])+'</p></div>'; return; }
    box.innerHTML='<div class="view-list">'+data.map(actRow).join("")+'</div>'; box.scrollTop=0;
  }
  function actRow(it){
    var m=it.msg, c=it.conv, u=user(m.user);
    var verb = it.kind==="thread" ? (m.replies.length+" repl"+(m.replies.length>1?"ies":"y")) :
      it.kind==="mention" ? "mentioned you" : it.kind==="reaction" ? "reacted to your message" :
      it.kind==="reply" ? "replied in your thread" : "pinned";
    var em = it.kind==="reaction" ? '<span class="ar-em">'+(Object.keys(m.reactions)[0]||"👍")+'</span>' : "";
    var t=lastTs(m), snip = m.voice ? "🎤 Voice message" : (m.text||"");
    return '<div class="act-row" data-act="view-open" data-conv="'+c.id+'" data-msg="'+m.id+'" data-kind="'+it.kind+'">'+avatar(u)+
      '<div class="ar-b"><div class="ar-top"><span class="ar-who" style="color:'+roleColor(m.user)+'">'+esc(u.name)+'</span><span class="ar-verb">'+verb+'</span><span class="ar-ch">'+esc(convoName(c))+'</span><span class="ar-time">'+fmtTime(t)+'</span></div>'+
      '<div class="ar-txt">'+em+mdInline(snip.replace(/\n/g," ").slice(0,150))+'</div></div></div>';
  }

  /* ---- Message action menu ---- */
  var msgMenu=null;
  function openMsgMenu(anchor, msgId){
    closeMsgMenu();
    var m=findMsg(msgId); if(!m) return;
    var mine=m.user==="me", isP=pinned[current]&&pinned[current].indexOf(msgId)>-1;
    var rows=[
      {a:"pin", ic:'<path d="M9 3h6l-1 7 3 3v2h-4v6l-1 1-1-1v-6H6v-2l3-3z"/>', label:isP?"Unpin from channel":"Pin to channel"},
      {a:"quote", ic:'<path d="M10 9V5l-7 7 7 7v-4c5 0 8 1.5 10 5 0-7-3-11-10-11z"/>', label:"Reply"},
      {a:"copylink", ic:'<path d="M9 15l6-6M10 6l1-1a3.5 3.5 0 0 1 5 5l-1 1M14 18l-1 1a3.5 3.5 0 0 1-5-5l1-1"/>', label:"Copy link", kk:"⌘L"},
      {a:"forward", ic:'<path d="M14 5l7 7-7 7M21 12H4"/>', label:"Forward"}
    ];
    if (mine && !m.voice) rows.push({a:"edit", ic:'<path d="M4 20l1.2-4.2L16 5a2 2 0 0 1 3 3L8.2 18.8z"/>', label:"Edit message"});
    if (mine){ rows.push({sep:1}); rows.push({a:"delete", ic:'<path d="M5 7h14M9 7V4h6v3M6 7l1 13h10l1-13"/>', label:"Delete message", danger:1}); }
    var p=document.createElement("div"); p.className="msg-menu";
    p.innerHTML=rows.map(function(r){ if(r.sep) return '<div class="sep"></div>'; return '<button class="'+(r.danger?"danger":"")+'" data-mm="'+r.a+'" data-msg="'+msgId+'"><svg viewBox="0 0 24 24">'+r.ic+'</svg>'+r.label+(r.kk?'<span class="kk">'+r.kk+'</span>':"")+'</button>'; }).join("");
    document.body.appendChild(p);
    var r=anchor.getBoundingClientRect(), top=r.bottom+6, left=Math.min(r.left-160, window.innerWidth-p.offsetWidth-12);
    if (top+p.offsetHeight>window.innerHeight-10) top=r.top-p.offsetHeight-6;
    p.style.top=top+"px"; p.style.left=Math.max(12,left)+"px"; msgMenu=p;
  }
  function closeMsgMenu(){ if(msgMenu){ msgMenu.remove(); msgMenu=null; } }
  function msgAction(a, msgId){
    closeMsgMenu();
    if (a==="pin") togglePin(msgId);
    else if (a==="quote") startReply(msgId);
    else if (a==="copylink"){ copyText(location.origin+"/oteams/app/#"+current+"/"+msgId); toast("Link copied to clipboard","🔗"); }
    else if (a==="forward") toast("Forwarding — pick a channel (demo)","↪️");
    else if (a==="edit"){ editingId=msgId; renderMessages(); }
    else if (a==="delete") deleteMsg(msgId);
  }
  function togglePin(msgId){
    pinned[current]=pinned[current]||[]; var i=pinned[current].indexOf(msgId);
    if (i>-1){ pinned[current].splice(i,1); toast("Unpinned","📌"); } else { pinned[current].push(msgId); toast("Pinned to channel","📌"); }
    if (!pinned[current].length) delete pinned[current];
    save(); renderHeader(); if (viewMode==="pinned") renderView(); else if (!viewMode) renderMessages();
  }
  function deleteMsg(msgId){
    var list=messages[current]||[]; for (var i=0;i<list.length;i++){ if(list[i].id===msgId){ list.splice(i,1); break; } }
    if (pinned[current]){ var pi=pinned[current].indexOf(msgId); if(pi>-1) pinned[current].splice(pi,1); if(!pinned[current].length) delete pinned[current]; }
    editingId=null; save(); renderMessages(); renderHeader(); toast("Message deleted","🗑️");
  }
  function saveEdit(msgId, text){
    text=(text||"").trim(); var m=findMsg(msgId); if(!m) return;
    if (!text){ deleteMsg(msgId); editingId=null; return; }
    m.text=text; m.edited=true; editingId=null; save(); renderMessages();
  }
  function editBoxHTML(m){ return '<div class="edit-box"><textarea class="edit-ta" rows="1">'+esc(m.text)+'</textarea><div class="edit-actions"><button class="save" data-act="edit-save" data-msg="'+m.id+'">Save changes</button><button class="cancel" data-act="edit-cancel">Cancel</button><span class="hint">esc to cancel · ↵ to save</span></div></div>'; }
  function copyText(t){ try { navigator.clipboard && navigator.clipboard.writeText(t); } catch(e){} }

  /* ---- Slash commands ---- */
  var SLASH=[
    {c:"/shrug",  d:"Append ¯\\_(ツ)_/¯"}, {c:"/me", d:"Display an action"},
    {c:"/status", d:"Set your status"},    {c:"/huddle", d:"Start a huddle"},
    {c:"/remind", d:"Set a reminder"},      {c:"/gif", d:"Post a GIF"},
    {c:"/away",   d:"Toggle away / active"},{c:"/pin", d:"Pin the last message"}
  ];
  var slashPop=null, slashState=null;
  function slashWatch(ta){
    var v=ta.value;
    if (v.charAt(0)!=="/" || /\s/.test(v)){ closeSlash(); return; }
    var q=v.toLowerCase(), hits=SLASH.filter(function(s){ return s.c.indexOf(q)===0; });
    if (!hits.length){ closeSlash(); return; }
    if (!slashPop){ slashPop=document.createElement("div"); slashPop.className="slash-pop"; document.body.appendChild(slashPop); }
    slashState={ ta:ta, sel:0, hits:hits }; drawSlash();
    var r=ta.getBoundingClientRect(); slashPop.style.left=(r.left+12)+"px"; slashPop.style.top=(r.top-slashPop.offsetHeight-6)+"px";
  }
  function drawSlash(){
    if (!slashPop||!slashState) return;
    slashPop.innerHTML='<div class="sc-h">Commands</div>'+slashState.hits.map(function(s,i){ return '<button class="'+(i===slashState.sel?"sel":"")+'" data-cmd="'+s.c+'"><span class="cmd">'+s.c+'</span><span class="desc">'+esc(s.d)+'</span></button>'; }).join("");
    Array.prototype.forEach.call(slashPop.querySelectorAll("[data-cmd]"), function(b){ b.addEventListener("mousedown", function(e){ e.preventDefault(); pickSlash(b.getAttribute("data-cmd")); }); });
  }
  function pickSlash(cmd){ var ta=slashState?slashState.ta:$("#composerWrap .cx-input"); closeSlash(); if(!ta) return; if(cmd==="/me"||cmd==="/remind"||cmd==="/gif"){ ta.value=cmd+" "; ta.focus(); } else { ta.value=""; runSlash(cmd); } }
  function slashKeydown(e, ta){
    if (!slashState) return false;
    if (e.key==="ArrowDown"){ e.preventDefault(); slashState.sel=(slashState.sel+1)%slashState.hits.length; drawSlash(); return true; }
    if (e.key==="ArrowUp"){ e.preventDefault(); slashState.sel=(slashState.sel-1+slashState.hits.length)%slashState.hits.length; drawSlash(); return true; }
    if (e.key==="Tab"){ e.preventDefault(); ta.value=slashState.hits[slashState.sel].c+" "; closeSlash(); return true; }
    if (e.key==="Escape"){ closeSlash(); return true; }
    return false;
  }
  function closeSlash(){ if(slashPop){ slashPop.remove(); slashPop=null; } slashState=null; }
  function runSlash(text){
    var sp=text.indexOf(" "), cmd=(sp>-1?text.slice(0,sp):text).toLowerCase(), rest=sp>-1?text.slice(sp+1).trim():"";
    switch(cmd){
      case "/shrug": postMine((rest?rest+" ":"")+"¯\\_(ツ)_/¯"); break;
      case "/me": if(rest) postMine("_"+rest+"_"); else toast("Add an action after /me","💬"); break;
      case "/status": openStatus(); break;
      case "/huddle": huddleFromChannel(); break;
      case "/remind": toast(rest?("Reminder set: “"+rest+"”"):"Reminder set (demo)","⏰"); break;
      case "/gif": postMine("🎞️ "+(rest||"gif")); break;
      case "/away": U.me.presence=U.me.presence==="active"?"away":"active"; save(); renderRail(); if(memberOpen)renderMembers(); toast("You're now "+U.me.presence, U.me.presence==="active"?"🟢":"🌙"); break;
      case "/pin": { var list=messages[current]||[]; for(var i=list.length-1;i>=0;i--){ if(!list[i].system){ togglePin(list[i].id); break; } } break; }
      default: toast("Unknown command: "+cmd,"❓");
    }
  }

  /* ---- Generic mini modal, custom status, create channel ---- */
  var miniEl=null;
  function openMini(title, bodyHTML){
    closeMini();
    var s=document.createElement("div"); s.className="modal-scrim"; s.id="miniScrim";
    s.innerHTML='<div class="modal mini"><header class="modal-head"><b>'+esc(title)+'</b><button class="tb-ico" data-act="close-mini" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header><div class="mm-body">'+bodyHTML+'</div></div>';
    document.body.appendChild(s);
    s.addEventListener("mousedown", function(e){ if(e.target===s) closeMini(); });
    miniEl=s;
  }
  function closeMini(){ if(miniEl){ miniEl.remove(); miniEl=null; } }
  function openStatus(){
    closeMenus();
    var cur=STATUS.me||"", mtc=cur.match(/^(\S+)\s+([\s\S]*)$/), em=mtc?mtc[1]:"💬", txt=mtc?mtc[2]:"";
    var presets=[["🏠","Working remotely"],["📅","In a meeting"],["🎯","Focusing — heads down"],["🌴","On vacation"],["🤒","Out sick"],["☕️","Coffee break"]];
    var body='<div class="mm-label">Your status</div><div class="status-row"><button class="semoji" id="semoji" type="button">'+em+'</button><input id="statusInput" maxlength="60" placeholder="What\'s your status?" value="'+esc(txt)+'" autocomplete="off"></div>'+
      '<div class="status-presets">'+presets.map(function(p){ return '<button data-act="status-preset" data-preset="'+p[0]+'|'+esc(p[1])+'"><span style="font-size:17px">'+p[0]+'</span>'+esc(p[1])+'</button>'; }).join("")+
      (cur?'<button class="clear" data-act="status-preset" data-preset="|"><span style="font-size:17px">✖️</span>Clear status</button>':"")+'</div>'+
      '<div class="mm-foot"><button class="ghost" data-act="close-mini">Cancel</button><button class="primary" data-act="save-status">Save</button></div>';
    openMini("Set a status", body);
    var si=$("#statusInput"); if(si){ si.focus(); si.selectionStart=si.value.length; si.addEventListener("keydown", function(e){ if(e.key==="Enter") saveStatus(); }); }
    var se=$("#semoji"); if(se) se.addEventListener("click", function(){ openEmojiPop(se, function(x){ se.textContent=x; }); });
  }
  function saveStatus(){
    var si=$("#statusInput"), se=$("#semoji"); if(!si) return;
    var txt=si.value.trim(); STATUS.me = txt ? (se.textContent+" "+txt) : "";
    save(); closeMini(); renderRail(); if(memberOpen) renderMembers();
    toast(STATUS.me?"Status updated":"Status cleared", STATUS.me?"💬":"✖️");
  }
  function applyStatusPreset(val){
    var parts=val.split("|"), em=parts[0], txt=parts[1]||"";
    var se=$("#semoji"), si=$("#statusInput");
    if (se && em) se.textContent=em; if (si) si.value=txt;
    if (!em && !txt) saveStatus();
  }
  function slugify(s){ return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,32); }
  function openCreateChannel(){
    closeMenus();
    var body='<div class="mm-label">Channel name</div><div class="mm-field"><span class="h">#</span><input id="chName" maxlength="40" placeholder="new-project" autocomplete="off" spellcheck="false"></div><div class="mm-hint">Channels organize conversations by topic, team, or project. Names are lowercase with dashes.</div><div class="mm-foot"><button class="ghost" data-act="close-mini">Cancel</button><button class="primary" data-act="create-channel">Create channel</button></div>';
    openMini("Create a channel", body);
    var i=$("#chName"); if(i){ i.focus(); i.addEventListener("keydown", function(e){ if(e.key==="Enter") createChannel(); }); }
  }
  function createChannel(){
    var i=$("#chName"); if(!i) return; var name=slugify(i.value);
    if (!name){ toast("Enter a channel name","＃"); return; }
    if (convo(name)){ closeMini(); openConvo(name); return; }
    CHANNELS.push({ id:name, name:name, topic:"", section:"channels", custom:true });
    messages[name]=[{ id:"cs"+Date.now(), system:true, text:"You created this channel · today" }];
    save(); closeMini(); openConvo(name); toast("Created #"+name,"🎉");
  }

  /* ==================================================================
     Boot
     ================================================================== */
  loadState(); loadUI(); applyTheme();
  current = "launch-q3"; read["launch-q3"]=true; history=["launch-q3"]; hIndex=0;
  renderRail(); renderSidebar();
  renderHeader(); renderMessages(); renderComposer(); updateNavButtons();
  renderMembers(); scheduleTyping();
  wireStatic();
  window.OTEAMS = { reset:function(){ localStorage.removeItem(LSKEY); localStorage.removeItem("oteams.ui"); location.reload(); } };
})();
