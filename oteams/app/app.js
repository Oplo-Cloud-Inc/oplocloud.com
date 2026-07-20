/* ============================================================
   OTeams workspace app — front-end demo, fully interactive.
   Seeded "Northwind" enterprise. State persists to localStorage.
   ============================================================ */
(function () {
  "use strict";
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
  var messages, read, starred, collapsed, current, history = [], hIndex = -1;
  function freshState(){
    messages = seedMessages();
    read = {}; starred = {}; collapsed = {};
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
      }
    } catch(e){}
  }
  function save(){
    try { localStorage.setItem(LSKEY, JSON.stringify({
      messages:messages, read:read, starred:starred, collapsed:collapsed, presence:U.me.presence
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
  function renderSidebar(){
    $("#channelNav").innerHTML = SECTIONS.map(function(sec){
      var isCol = !!collapsed[sec.id];
      var items = sec.items().map(chItem).join("");
      return '<div class="sb-sec'+(isCol?" collapsed":"")+'" data-sec="'+sec.id+'">'+
        '<button class="sb-sec-head" data-act="toggle-sec" data-sec="'+sec.id+'">'+
          '<svg class="tw" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg><b>'+sec.label+'</b>'+
          '<span class="plus" data-act="add-'+sec.id+'"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>'+
        '</button>'+
        '<div class="sb-items">'+items+'</div>'+
      '</div>';
    }).join("");
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
    var c = convo(current);
    var title = c.section==="channels"
      ? '<span class="chan-title">'+(c.private?'<svg class="lock" viewBox="0 0 24 24" style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>':'<span class="h">#</span>')+esc(c.name)+
        '<button class="star'+(starred[c.id]?" on":"")+'" data-act="star" title="Star"><svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 23l-5.5-2.9 1-6.1L3 9.5l6.1-.9z"/></svg></button></span>'
      : '<span class="chan-title">'+(c.users.length===1?pres_inline(c.users[0]):"")+esc(convoName(c))+'</span>';
    var topic = c.section==="channels" ? '<div class="chan-topic" data-act="topic">'+esc(c.topic)+'</div>' : '<div class="chan-topic">'+(c.users.length===1?esc(user(c.users[0]).title):"Group message")+'</div>';
    var actions = c.section==="channels"
      ? '<div class="chan-faces" data-act="members">'+headFaces(c)+'<span class="cnt">'+memberCount(c)+'</span></div>'+
        '<button class="ch-btn hud" data-act="huddle"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/></svg>Huddle</button>'+
        '<button class="ch-btn" data-act="details"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg></button>'
      : '<button class="ch-btn hud" data-act="huddle"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/></svg>Huddle</button>';
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
  function messageGroupHTML(msg, compact){
    var u = user(msg.user);
    var head = compact ? '' :
      '<div class="head"><span class="who">'+esc(u.name)+'</span>'+
        (u.bot?'<span class="bot">APP</span>':(u.title?'<span class="role">'+esc(u.title)+'</span>':""))+
        '<time>'+fmtTime(msg.ts)+'</time></div>';
    var gutter = compact
      ? '<div class="stamp-mini">'+fmtTime(msg.ts).replace(/ (AM|PM)/,"")+'</div>'
      : '<div class="gutter">'+avatar(u)+'</div>';
    var body = '<div class="content">'+head+'<div class="text">'+md(msg.text)+'</div>'+
      (msg.file?fileHTML(msg.file):"")+ reactionsHTML(msg) + threadLinkHTML(msg) + '</div>';
    var tools = '<div class="msg-tools">'+
      '<button data-act="react-quick" data-msg="'+msg.id+'" data-em="👍" title="React"><span class="em">👍</span></button>'+
      '<button data-act="react-quick" data-msg="'+msg.id+'" data-em="✅" title="React"><span class="em">✅</span></button>'+
      '<button data-act="react-open" data-msg="'+msg.id+'" title="Add reaction"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 14s1 1.5 3 1.5S15 14 15 14M9 9h.01M15 9h.01"/></svg></button>'+
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
  }

  /* ==================================================================
     Composer
     ================================================================== */
  function composerHTML(placeholder, kind){
    return '<div class="cx" data-kind="'+kind+'">'+
      '<div class="cx-toolbar">'+
        tbtn("bold","<path d=\'M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z\'/>")+
        tbtn("italic","<path d=\'M11 5h6M7 19h6M14 5l-4 14\'/>")+
        tbtn("strike","<path d=\'M5 12h14M8 7a4 3 0 0 1 8 0M8 17a4 3 0 0 0 8 0\'/>")+
        tbtn("code","<path d=\'M9 8l-4 4 4 4M15 8l4 4-4 4\'/>")+
        '<span class="sep"></span>'+
        tbtn("link","<path d=\'M9 15l6-6M10 6l1-1a3.5 3.5 0 0 1 5 5l-1 1M14 18l-1 1a3.5 3.5 0 0 1-5-5l1-1\'/>")+
        tbtn("list","<path d=\'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01\'/>")+
        tbtn("quote","<path d=\'M7 7h4v4H7zM13 7h4v4h-4z M7 11c0 3-1 4-3 5M13 11c0 3-1 4-3 5\'/>")+
      '</div>'+
      '<textarea class="cx-input" data-kind="'+kind+'" rows="1" placeholder="'+esc(placeholder)+'"></textarea>'+
      '<div class="cx-bottom">'+
        cbtn("attach","<path d=\'M21 12l-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8\'/>")+
        cbtn("emoji","<circle cx=\'12\' cy=\'12\' r=\'9\'/><path d=\'M9 14s1 1.5 3 1.5 3-1.5 3-1.5M9 9h.01M15 9h.01\'/>")+
        cbtn("mention","<circle cx=\'12\' cy=\'12\' r=\'4\'/><path d=\'M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1\'/>")+
        cbtn("slash","<path d=\'M14 5L9 19\'/><rect x=\'3\' y=\'4\' width=\'18\' height=\'16\' rx=\'3\'/>")+
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
    ta.addEventListener("input", function(){ sync(); mentionWatch(ta); });
    ta.addEventListener("focus", function(){ cx.classList.add("focus"); });
    ta.addEventListener("blur", function(){ cx.classList.remove("focus"); });
    ta.addEventListener("keydown", function(e){
      if (mentionKeydown(e, ta)) return;
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
      else if (a==="slash") toast("Slash commands are coming soon","⌘");
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
    if (kind==="thread"){
      var pm = messages[current] && messages[current].filter(function(x){return x.id===threadMsgId;})[0];
      if (pm){ pm.replies.push({ id:"r"+Date.now(), user:"me", ts:Date.now(), text:text }); save(); renderThread(); renderMessages(); }
    } else {
      (messages[current] = messages[current]||[]).push({ id:"u"+Date.now(), user:"me", ts:Date.now(), text:text, reactions:{}, replies:[] });
      save(); renderMessages();
      maybeAutoReply(text);
    }
    ta.value=""; ta.style.height="auto"; $(".cx-send",ta.closest(".composer")).classList.remove("ready");
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
      return messageGroupHTML({ id:r.id, user:r.user, ts:r.ts, text:r.text, reactions:r.reactions||{}, replies:[], bot:user(r.user).bot }, compact);
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
    current = id; read[id]=true;
    if (!fromHistory){ history = history.slice(0,hIndex+1); history.push(id); hIndex=history.length-1; }
    closeThread();
    renderSidebar(); renderHeader(); renderMessages(); renderComposer();
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
    if (actions.length) groups.push({ label:"Actions", items:actions });
    return groups;
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
        html += '<div class="pal-item'+(idx===pal.sel?" sel":"")+'" data-i="'+idx+'">'+pic+
          '<span class="pt"><b>'+esc(it.label)+'</b>'+(it.sub?'<span>'+esc(it.sub)+'</span>':"")+'</span>'+
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
    if (it.type==="channel"||it.type==="dm"){ closePalette(); openConvo(it.id); return; }
    closePalette();
    if (it.id==="a-threads") toast("Threads view is a demo stub","🧵");
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
    var a = e.target.closest("[data-act]");
    // close transient popovers when clicking outside them
    if (!e.target.closest(".emoji-pop") && !e.target.closest(".mention-pop") && !(a&&/react-open|react-quick|emoji/.test(a.getAttribute("data-act")||""))) closePops();
    if (!e.target.closest(".pop") && !e.target.closest("#wsMenu") && !e.target.closest("#railMe") && !e.target.closest("#tbAvatar")) closeMenus();
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
      case "msg-more": toast("Message actions: pin, copy link, forward…","•••"); break;
      case "star": { var cc=convo(current); starred[cc.id]=!starred[cc.id]; save(); renderHeader(); toast(starred[cc.id]?"Added to starred":"Removed from starred", starred[cc.id]?"⭐":"☆"); break; }
      case "huddle": toast("Huddles aren't part of this demo build","🎧"); break;
      case "details": case "members": toast("Channel details panel — demo stub","ℹ️"); break;
      case "topic": toast("Editing the topic — demo stub","✏️"); break;
      case "file": toast("Opening file preview — demo stub","📄"); break;
      case "send": { var kind=a.getAttribute("data-kind"); var ta = kind==="thread"?$("#threadComposerWrap .cx-input"):$("#composerWrap .cx-input"); doSend(kind, ta); break; }
      case "pres": { U.me.presence=a.getAttribute("data-p"); save(); renderRail(); closeMenus(); toast("Status set to "+U.me.presence, U.me.presence==="active"?"🟢":U.me.presence==="dnd"?"⛔":"🌙"); break; }
      case "signout": location.href="/oteams/"; break;
      case "menu-invite": toast("Invite flow — demo stub","✉️"); closeMenus(); break;
      case "menu-prefs": openShortcuts(); closeMenus(); break;
      case "menu-admin": toast("Admin console — demo stub","🛡️"); closeMenus(); break;
      case "menu-status": toast("Set a status — demo stub","💬"); closeMenus(); break;
      case "menu-profile": toast("Your profile — demo stub","👤"); closeMenus(); break;
      default:
        if (/^add-/.test(act)) toast("Create "+(act==="add-channels"?"a channel":act==="add-dms"?"a direct message":"an app")+" — demo stub","＋");
    }
  }
  function user2ws(id){ var w=WORKSPACES.filter(function(x){return x.id===id;})[0]; return w?w.name:"That workspace"; }

  function onKey(e){
    var meta = e.metaKey||e.ctrlKey;
    if (meta && e.key.toLowerCase()==="k"){ e.preventDefault(); pal.open?closePalette():openPalette(); return; }
    if (meta && e.key==="/"){ e.preventDefault(); openShortcuts(); return; }
    if (e.key==="Escape"){
      if (emojiPop||mentionPop){ closePops(); return; }
      if (!$("#wsPop").hidden||!$("#mePop").hidden){ closeMenus(); return; }
      if (!$("#shortcutsScrim").hidden){ $("#shortcutsScrim").hidden=true; return; }
      if (pal.open){ closePalette(); return; }
      if (!$("#threadPane").hidden){ closeThread(); return; }
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
    $("#tbNotif").addEventListener("click", function(){ toast("You're all caught up","🎉"); });
    $("#railAdd").addEventListener("click", function(){ toast("Add a workspace — demo stub","＋"); });
    $("#composeNew").addEventListener("click", function(){ openPalette(); });
    $("#navBack").addEventListener("click", navBack);
    $("#navFwd").addEventListener("click", navFwd);
    $("#menuBtn").addEventListener("click", function(){ document.getElementById("app").classList.toggle("nav-open"); });
    $("#mobileScrim").addEventListener("click", closeMobileNav);
    $("#sbFoot").addEventListener("click", function(){ toast("Enterprise Key Management · SOC 2 · GDPR · HIPAA-ready","🔒"); });
    document.querySelector(".sb-quick").addEventListener("click", function(e){ var b=e.target.closest(".q-item"); if(b) toast(b.textContent.trim()+" — demo stub","🔎"); });
    window.addEventListener("resize", function(){ closePops(); });
  }

  /* ==================================================================
     Boot
     ================================================================== */
  loadState();
  current = "launch-q3"; read["launch-q3"]=true; history=["launch-q3"]; hIndex=0;
  renderRail(); renderSidebar();
  renderHeader(); renderMessages(); renderComposer(); updateNavButtons();
  wireStatic();
  window.OTEAMS = { reset:function(){ localStorage.removeItem(LSKEY); location.reload(); } };
})();
