/* ============================================================
   OTeams API client — REST + realtime WebSocket.

   Loaded before app.js. Exposes window.OTeams.

   The app runs in one of two modes:
     • "live"  — a backend URL is configured and reachable
     • "demo"  — no backend; app.js keeps using its local seed data
   so the static demo on oplocloud.com never breaks.

   Configure once (persists to localStorage):
     OTeams.configure({ apiBase: "https://api.oteams.oplocloud.com" })
   Clear it with OTeams.configure({ apiBase: null }).
   ============================================================ */
(function () {
  "use strict";

  var LS_API = "oteams.apiBase";
  var LS_TOKEN = "oteams.token";

  var state = {
    apiBase: null,
    token: null,
    mode: "demo",
    me: null,
    workspace: null,
    ws: null,
    wsTries: 0,
    wsTimer: null,
    listeners: {},
  };

  try {
    state.apiBase = localStorage.getItem(LS_API) || null;
    state.token = localStorage.getItem(LS_TOKEN) || null;
  } catch (e) {}

  /* ---------------------------------------------- events */
  function on(type, fn) {
    (state.listeners[type] = state.listeners[type] || []).push(fn);
    return function off() { emitOff(type, fn); };
  }
  function emitOff(type, fn) {
    var list = state.listeners[type]; if (!list) return;
    var i = list.indexOf(fn); if (i > -1) list.splice(i, 1);
  }
  function emit(type, payload) {
    (state.listeners[type] || []).forEach(function (fn) {
      try { fn(payload); } catch (err) { console.error("[OTeams] listener error", type, err); }
    });
    (state.listeners["*"] || []).forEach(function (fn) {
      try { fn(type, payload); } catch (err) {}
    });
  }

  /* ---------------------------------------------- REST */
  function url(path) { return state.apiBase.replace(/\/+$/, "") + path; }

  async function request(method, path, body) {
    if (!state.apiBase) throw new Error("no_backend_configured");
    var headers = { "Content-Type": "application/json" };
    if (state.token) headers.Authorization = "Bearer " + state.token;
    var res = await fetch(url(path), {
      method: method,
      headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 401) { emit("unauthorized", {}); throw new Error("unauthorized"); }
    var data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw Object.assign(new Error((data && data.error) || res.statusText), { status: res.status, data: data });
    return data;
  }

  var api = {
    get: function (p) { return request("GET", p); },
    post: function (p, b) { return request("POST", p, b || {}); },
    patch: function (p, b) { return request("PATCH", p, b || {}); },
    del: function (p) { return request("DELETE", p); },
  };

  /* ---------------------------------------------- realtime */
  function wsUrl() {
    var base = state.apiBase.replace(/^http/, "ws").replace(/\/+$/, "");
    return base + "/ws" + (state.token ? "?token=" + encodeURIComponent(state.token) : "");
  }

  function connect() {
    if (!state.apiBase || !state.token) return;
    if (state.ws && (state.ws.readyState === 0 || state.ws.readyState === 1)) return;

    var ws;
    try { ws = new WebSocket(wsUrl()); } catch (e) { return scheduleReconnect(); }
    state.ws = ws;

    ws.onopen = function () { state.wsTries = 0; emit("connected", {}); };

    ws.onmessage = function (ev) {
      var msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.type) emit(msg.type, msg);
    };

    ws.onclose = function () { emit("disconnected", {}); scheduleReconnect(); };
    ws.onerror = function () { try { ws.close(); } catch (e) {} };
  }

  function scheduleReconnect() {
    if (state.wsTimer) return;
    state.wsTries = Math.min(state.wsTries + 1, 6);
    var delay = Math.min(1000 * Math.pow(2, state.wsTries), 30000);
    state.wsTimer = setTimeout(function () { state.wsTimer = null; connect(); }, delay);
  }

  function sendWs(type, payload) {
    if (!state.ws || state.ws.readyState !== 1) return false;
    try { state.ws.send(JSON.stringify(Object.assign({ type: type }, payload || {}))); return true; }
    catch (e) { return false; }
  }

  /* ---------------------------------------------- public surface */
  var OTeams = {
    /* ---- setup ---- */
    configure: function (opts) {
      opts = opts || {};
      if ("apiBase" in opts) {
        state.apiBase = opts.apiBase || null;
        try { opts.apiBase ? localStorage.setItem(LS_API, opts.apiBase) : localStorage.removeItem(LS_API); } catch (e) {}
      }
      if ("token" in opts) OTeams.setToken(opts.token);
      return OTeams;
    },
    setToken: function (token) {
      state.token = token || null;
      try { token ? localStorage.setItem(LS_TOKEN, token) : localStorage.removeItem(LS_TOKEN); } catch (e) {}
      if (state.ws) { try { state.ws.close(); } catch (e) {} state.ws = null; }
      if (token) connect();
    },
    get mode() { return state.mode; },
    get isLive() { return state.mode === "live"; },
    get me() { return state.me; },
    get workspace() { return state.workspace; },
    get apiBase() { return state.apiBase; },

    /**
     * Try to come up in live mode. Resolves to "live" or "demo" — it never
     * throws, so the UI can always render something.
     */
    start: async function () {
      if (!state.apiBase || !state.token) { state.mode = "demo"; return "demo"; }
      try {
        var me = await api.get("/api/me");
        state.me = me.user;
        state.workspace = (me.workspaces && me.workspaces[0]) || null;
        state.mode = "live";
        connect();
        emit("ready", { user: state.me, workspace: state.workspace });
        return "live";
      } catch (err) {
        console.warn("[OTeams] backend unreachable — staying in demo mode:", err.message);
        state.mode = "demo";
        return "demo";
      }
    },

    on: on,
    off: emitOff,

    /* ---- identity ---- */
    updateMe: function (patch) { return api.patch("/api/me", patch); },
    serverConfig: function () { return api.get("/api/config"); },

    /* ---- workspace ---- */
    members: function (wsId) { return api.get("/api/workspaces/" + (wsId || state.workspace.id) + "/members"); },
    channels: function (wsId) { return api.get("/api/workspaces/" + (wsId || state.workspace.id) + "/channels"); },
    createChannel: function (name, opts) {
      return api.post("/api/workspaces/" + state.workspace.id + "/channels", Object.assign({ name: name }, opts || {}));
    },
    openDM: function (userIds) {
      return api.post("/api/workspaces/" + state.workspace.id + "/dms", { userIds: [].concat(userIds) });
    },
    search: function (q) {
      return api.get("/api/workspaces/" + state.workspace.id + "/search?q=" + encodeURIComponent(q));
    },
    activity: function () { return api.get("/api/workspaces/" + state.workspace.id + "/activity"); },
    threads: function () { return api.get("/api/workspaces/" + state.workspace.id + "/threads"); },

    /* ---- channels & messages ---- */
    channel: function (id) { return api.get("/api/channels/" + id); },
    setTopic: function (id, topic) { return api.patch("/api/channels/" + id, { topic: topic }); },
    joinChannel: function (id) { return api.post("/api/channels/" + id + "/join"); },
    leaveChannel: function (id) { return api.post("/api/channels/" + id + "/leave"); },
    star: function (id, starred) { return api.post("/api/channels/" + id + "/star", { starred: !!starred }); },
    messages: function (channelId, opts) {
      opts = opts || {};
      var q = "?limit=" + (opts.limit || 50) + (opts.before ? "&before=" + encodeURIComponent(opts.before) : "");
      return api.get("/api/channels/" + channelId + "/messages" + q);
    },
    send: function (channelId, payload) {
      return api.post("/api/channels/" + channelId + "/messages",
        typeof payload === "string" ? { body: payload } : payload);
    },
    editMessage: function (id, body) { return api.patch("/api/messages/" + id, { body: body }); },
    deleteMessage: function (id) { return api.del("/api/messages/" + id); },
    thread: function (id) { return api.get("/api/messages/" + id + "/thread"); },
    react: function (id, emoji) { return api.post("/api/messages/" + id + "/reactions", { emoji: emoji }); },
    unreact: function (id, emoji) { return api.del("/api/messages/" + id + "/reactions/" + encodeURIComponent(emoji)); },
    pins: function (channelId) { return api.get("/api/channels/" + channelId + "/pins"); },
    pin: function (channelId, messageId) { return api.post("/api/channels/" + channelId + "/pins/" + messageId); },
    unpin: function (channelId, messageId) { return api.del("/api/channels/" + channelId + "/pins/" + messageId); },
    markRead: function (channelId, messageId) {
      return api.post("/api/channels/" + channelId + "/read", { messageId: messageId || null });
    },

    /* ---- files ---- */
    /** Presign, PUT the bytes straight to storage, return the attachment id. */
    upload: async function (file, onProgress) {
      var pre = await api.post("/api/workspaces/" + state.workspace.id + "/uploads", {
        filename: file.name, mime: file.type || "application/octet-stream", size: file.size,
      });
      await new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(pre.method || "PUT", pre.uploadUrl);
        Object.keys(pre.headers || {}).forEach(function (h) { xhr.setRequestHeader(h, pre.headers[h]); });
        if (onProgress) xhr.upload.onprogress = function (e) {
          if (e.lengthComputable) onProgress(e.loaded / e.total);
        };
        xhr.onload = function () { (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error("upload_failed_" + xhr.status)); };
        xhr.onerror = function () { reject(new Error("upload_failed")); };
        xhr.send(file);
      });
      return pre.attachmentId;
    },
    attachmentUrl: function (id) { return api.get("/api/attachments/" + id + "/url"); },

    /* ---- realtime signals ---- */
    typing: function (channelId) { return sendWs("typing", { channelId: channelId }); },
    setPresence: function (presence) { return sendWs("presence", { presence: presence }); },

    /* ---- huddles (WebRTC signaling) ---- */
    huddle: {
      current: function (channelId) { return api.get("/api/channels/" + channelId + "/huddle"); },
      join: function (channelId) { return sendWs("huddle:join", { channelId: channelId }); },
      leave: function (huddleId) { return sendWs("huddle:leave", { huddleId: huddleId }); },
      setState: function (huddleId, s) {
        return sendWs("huddle:state", Object.assign({ huddleId: huddleId }, s || {}));
      },
      signal: function (huddleId, to, data) {
        return sendWs("huddle:signal", { huddleId: huddleId, to: to, data: data });
      },
    },

    /* escape hatch */
    raw: api,
  };

  window.OTeams = OTeams;
})();
