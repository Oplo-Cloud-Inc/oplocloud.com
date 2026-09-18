/* ==========================================================================
   Oplo Identity — client-side auth logic.

   This script powers the sign-in page at auth.oplocloud.com. It talks
   to the platform API (proxied through this Worker) for:

     · Signing in with email + password
     · Starting a passkey authentication (WebAuthn)
     · Starting registration
     · Password recovery
     · Checking the current session

   It follows the Oplo Identity design: email first, then the
   authentication method, not a password field by default.
   ========================================================================== */

(function () {
  "use strict";

  const API = "/api/v1";
  const MAIN_DOMAIN = "https://oplocloud.com";

  /* ------------------------------------------------------------- Helpers */

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function setStatus(el, message, type) {
    if (!el) return;
    el.textContent = "";
    el.className = "authStatus " + (type || "info");
    const span = document.createElement("span");
    span.textContent = message;
    el.appendChild(span);
  }

  function clearStatus(el) {
    if (!el) return;
    el.textContent = "";
    el.className = "authStatus";
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.label = btn.textContent;
      btn.textContent = "…";
    } else {
      btn.textContent = btn.dataset.label || btn.textContent;
    }
  }

  function getRedirect() {
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect") || null;
  }

  /* ------------------------------------------------------------- Pages
     The single HTML document switches views by path.
     This function renders the correct view into #authMain. */

  function renderSignIn() {
    return `
      <div class="authCard authCardCentered">
        <div class="brandRow">
          <svg viewBox="84.13 107.80 206.73 194.91" aria-hidden="true" focusable="false" width="32" height="30"><g transform="translate(73.919875, 252.710833)"><path fill="currentColor" d="M 77.929688 -144.414062 C 39.890625 -144.414062 10.710938 -112.648438 10.710938 -76.824219 C 10.710938 -43.953125 34.71875 -14.40625 71.652344 -10.339844 C 69.066406 -19.207031 68.699219 -23.269531 68.699219 -30.285156 C 68.699219 -66.851562 98.246094 -98.246094 135.179688 -98.246094 C 137.027344 -98.246094 139.613281 -98.246094 142.199219 -97.875 C 131.855469 -127.421875 106.371094 -144.414062 77.929688 -144.414062 Z M 130.378906 -138.132812 C 149.214844 -120.777344 158.449219 -101.199219 158.449219 -77.5625 C 158.449219 -32.503906 121.515625 3.324219 78.671875 3.324219 C 61.3125 3.324219 45.058594 -2.214844 29.917969 -12.558594 L 88.273438 33.609375 C 98.246094 41.367188 119.296875 49.492188 135.917969 49.492188 C 180.980469 49.492188 216.4375 12.925781 216.4375 -31.023438 C 216.4375 -56.140625 205.355469 -78.671875 185.78125 -94.183594 Z M 130.378906 -138.132812"/></g></svg>
          <span>Oplo</span>
        </div>
        <h1>What's your Oplo account?</h1>
        <p class="sub">Enter your email to continue.</p>
        <div id="authStatus" class="authStatus" style="display:none"></div>
        <form id="signinForm" class="form" style="width:100%; margin-top:24px" novalidate autocomplete="off">
          <div class="field">
            <input id="oploid" name="oploid" type="email" placeholder=" "
                   autocomplete="email" autocapitalize="none" spellcheck="false"
                   aria-describedby="said">
            <label for="oploid">Email</label>
            <button class="go" type="submit" aria-label="Continue">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 2.5 10.5 8 5 13.5"/>
              </svg>
            </button>
          </div>
        </form>
        <p class="after" style="margin-top:24px; padding-top:20px; border-top:1px solid var(--rule); width:100%; max-width:400px; font-size:14px; line-height:1.5; color:var(--ink-2); text-align:center">
          <a href="/recovery">Forgot your password?</a>
          <span style="margin:0 8px">·</span>
          <a href="/register">Create an account</a>
        </p>
      </div>`;
  }

  function renderAfterSignin() {
    return `
      <div class="authCard authCardCentered contextPanel">
        <div class="brandRow">
          <svg viewBox="84.13 107.80 206.73 194.91" aria-hidden="true" focusable="false" width="32" height="30"><g transform="translate(73.919875, 252.710833)"><path fill="currentColor" d="M 77.929688 -144.414062 C 39.890625 -144.414062 10.710938 -112.648438 10.710938 -76.824219 C 10.710938 -43.953125 34.71875 -14.40625 71.652344 -10.339844 C 69.066406 -19.207031 68.699219 -23.269531 68.699219 -30.285156 C 68.699219 -66.851562 98.246094 -98.246094 135.179688 -98.246094 C 137.027344 -98.246094 139.613281 -98.246094 142.199219 -97.875 C 131.855469 -127.421875 106.371094 -144.414062 77.929688 -144.414062 Z M 130.378906 -138.132812 C 149.214844 -120.777344 158.449219 -101.199219 158.449219 -77.5625 C 158.449219 -32.503906 121.515625 3.324219 78.671875 3.324219 C 61.3125 3.324219 45.058594 -2.214844 29.917969 -12.558594 L 88.273438 33.609375 C 98.246094 41.367188 119.296875 49.492188 135.917969 49.492188 C 180.980469 49.492188 216.4375 12.925781 216.4375 -31.023438 C 216.4375 -56.140625 205.355469 -78.671875 185.78125 -94.183594 Z M 130.378906 -138.132812"/></g></svg>
          <span>Oplo</span>
        </div>
        <div id="authStatus" class="authStatus" style="display:none; width:100%"></div>
        <p class="orgName" id="welcomeName">Welcome back</p>
        <p class="orgRole" id="welcomeEmail"></p>
        <div class="apps" id="appList"></div>
        <button class="btn btnSecondary" id="switchContext">Switch account</button>
        <button class="btn btnSecondary" style="margin-top:8px" id="signOut">Sign out</button>
      </div>`;
  }

  /* ------------------------------------------------------------- Auth checks */

  async function checkSession() {
    try {
      const res = await fetch(API + "/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        return data.account;
      }
    } catch { /* not signed in */ }
    return null;
  }

  /* ------------------------------------------------------------- Sign in flow */

  async function startSignIn(email) {
    const res = await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password: "" })
    });
    if (res.ok) return await res.json();
    const data = await res.json().catch(() => ({}));
    throw new Error((data && data.error && data.error.message) || "That email and password do not match an account.");
  }

  /* ------------------------------------------------------------- Passkey */

  async function startPasskey(email) {
    /* In production this calls the API to initiate WebAuthn.
       For now it alerts — the endpoint is planned. */
    alert("Passkey authentication will be available soon.\n\nEmail: " + email);
  }

  /* ------------------------------------------------------------- Render logic */

  async function init() {
    const main = $("#authMain");
    if (!main) return;

    const pathname = window.location.pathname;

    /* /callback — handle the OAuth redirect */
    if (pathname === "/callback") {
      main.innerHTML = `<div class="authCard authCardCentered"><p class="sub" style="text-align:center">Signing you in…</p><div id="authStatus" class="authStatus" style="display:none"></div></div>`;
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      if (code) {
        try {
          const res = await fetch(API + "/auth/token", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ code, state })
          });
          if (res.ok) {
            const data = await res.json();
            const redirect = getRedirect() || MAIN_DOMAIN + "/";
            window.location.href = redirect;
            return;
          }
          setStatus($("#authStatus"), "Could not complete sign in. Try again.", "error");
        } catch {
          setStatus($("#authStatus"), "Could not connect. Try again.", "error");
        }
      } else {
        setStatus($("#authStatus"), "No authorization code received.", "error");
      }
      return;
    }

    /* Check if already signed in — for every page */
    const account = await checkSession();
    if (account && pathname === "/") {
      main.innerHTML = renderAfterSignin();
      $("#welcomeName").textContent = "Welcome back, " + (account.name || account.firstName || account.email);
      $("#welcomeEmail").textContent = account.email;
      const redirect = getRedirect();
      if (redirect) {
        setTimeout(function () { window.location.href = redirect; }, 800);
        return;
      }
      populateApps(account);
      wireAfterSignin(account);
      return;
    }

    /* Signed in but on a sub-page — redirect to home */
    if (account && pathname !== "/sign-in") {
      window.location.href = MAIN_DOMAIN + "/";
      return;
    }

    /* Not signed in — show the sign-in page */
    if (pathname === "/" || pathname === "/sign-in" || pathname === "/sign-in/") {
      main.innerHTML = renderSignIn();
      wireSignIn();
    } else if (pathname === "/register" || pathname === "/register/") {
      main.innerHTML = renderRegister();
      wireRegister();
    } else if (pathname === "/recovery" || pathname === "/recovery/") {
      main.innerHTML = renderRecovery();
      wireRecovery();
    } else {
      main.innerHTML = renderSignIn();
      wireSignIn();
    }
  }

  function populateApps(account) {
    const list = $("#appList");
    if (!list) return;
    const apps = [
      { icon: "🎓", name: "OEdu", url: MAIN_DOMAIN + "/" },
      { icon: "☁", name: "OploCloud", url: MAIN_DOMAIN + "/" },
      { icon: "📁", name: "Oplo Drive", url: MAIN_DOMAIN + "/" }
    ];
    if (account.organizations && account.organizations.length) {
      const org = account.organizations[0];
      apps.unshift({ icon: "🏫", name: org.name, url: MAIN_DOMAIN + "/" });
    }
    list.innerHTML = apps.map(function (a) {
      return '<a class="app" href="' + a.url + '">' +
        '<span class="appIcon">' + a.icon + '</span>' +
        '<span class="appMeta"><b>' + a.name + '</b></span>' +
        '</a>';
    }).join("");
  }

  function wireAfterSignin(account) {
    $("#switchContext") && $("#switchContext").addEventListener("click", function () {
      window.location.href = "/";
    });
    $("#signOut") && $("#signOut").addEventListener("click", async function () {
      try {
        await fetch(API + "/auth/logout", { method: "POST", credentials: "include" });
      } catch { /* ignore */ }
      window.location.href = "/";
    });
  }

  /* ------------------------------------------------------------- Sign in form */

  function wireSignIn() {
    const form = $("#signinForm");
    if (!form) return;
    const input = $("#oploid");
    const status = $("#authStatus") || $("#said");

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!input || !input.value.trim()) {
        setStatus(status, "Enter your email to continue.", "error");
        input.focus();
        return;
      }
      setLoading(form.querySelector(".go"), true);
      setStatus(status, "", "");
      try {
        const result = await startSignIn(input.value.trim());
        if (result && result.account) {
          window.location.href = "/";
        } else {
          /* The API will redirect or set a cookie — if we get here,
             prompt for password or passkey. */
          showPasswordStep(input.value.trim());
        }
      } catch (err) {
        setStatus(status, err.message || "That email and password do not match an account.", "error");
      } finally {
        setLoading(form.querySelector(".go"), false);
      }
    });

    /* If a passkey is available, offer it as the primary action. */
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(function (available) {
          if (!available) return;
          const form = $("#signinForm");
          if (!form) return;
          const banner = document.createElement("div");
          banner.className = "passkeyBanner";
          banner.innerHTML =
            '<span class="pkIcon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 0-5 5v3"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M12 12v10"/><rect x="7" y="10" width="10" height="12" rx="2"/></svg></span>' +
            '<span class="pkText"><b>Use a passkey</b> — faster and more secure. Available on this device.</span>';
          form.insertBefore(banner, form.firstChild);
        })
        .catch(function () { /* WebAuthn unsupported, skip */ });
    }
  }

  function showPasswordStep(email) {
    const main = $("#authMain");
    if (!main) return;
    main.innerHTML = `
      <div class="authCard authCardCentered">
        <a href="/" style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:26px;text-decoration:none">
          <svg viewBox="84.13 107.80 206.73 194.91" width="28" height="26" aria-hidden="true" focusable="false"><g transform="translate(73.919875, 252.710833)"><path fill="currentColor" d="M 77.929688 -144.414062 C 39.890625 -144.414062 10.710938 -112.648438 10.710938 -76.824219 C 10.710938 -43.953125 34.71875 -14.40625 71.652344 -10.339844 C 69.066406 -19.207031 68.699219 -23.269531 68.699219 -30.285156 C 68.699219 -66.851562 98.246094 -98.246094 135.179688 -98.246094 C 137.027344 -98.246094 139.613281 -98.246094 142.199219 -97.875 C 131.855469 -127.421875 106.371094 -144.414062 77.929688 -144.414062 Z M 130.378906 -138.132812 C 149.214844 -120.777344 158.449219 -101.199219 158.449219 -77.5625 C 158.449219 -32.503906 121.515625 3.324219 78.671875 3.324219 C 61.3125 3.324219 45.058594 -2.214844 29.917969 -12.558594 L 88.273438 33.609375 C 98.246094 41.367188 119.296875 49.492188 135.917969 49.492188 C 180.980469 49.492188 216.4375 12.925781 216.4375 -31.023438 C 216.4375 -56.140625 205.355469 -78.671875 185.78125 -94.183594 Z M 130.378906 -138.132812"/></g></svg>
          <span style="font-size:15px;font-weight:600;color:var(--ink-2)">Oplo</span>
        </a>
        <h1 style="text-align:center;width:100%">Confirm your identity</h1>
        <p class="sub" style="text-align:center">${email}</p>
        <div id="authStatus" class="authStatus" style="display:none;width:100%"></div>
        <form id="passwordForm" style="width:100%;margin-top:24px">
          <div class="field">
            <input id="password" name="password" type="password" placeholder=" "
                   autocomplete="current-password" spellcheck="false"
                   aria-describedby="said">
            <label for="password">Password</label>
          </div>
          <button class="btn btnPrimary" type="submit" style="width:100%">Continue</button>
        </form>
        <div class="divider">or</div>
        <button class="btn btnPasskey" id="passkeyBtn" style="width:100%">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 0-5 5v3"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M12 12v10"/><rect x="7" y="10" width="10" height="12" rx="2"/></svg>
          Continue with passkey
        </button>
        <p style="text-align:center;margin-top:20px;font-size:14px"><a href="/" style="color:var(--blue)">Use a different account</a></p>
      </div>`;

    const form = $("#passwordForm");
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const pw = $("#password");
      setLoading(form.querySelector("button"), true);
      setStatus($("#authStatus"), "", "");
      try {
        const res = await fetch(API + "/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password: pw.value })
        });
        if (res.ok) {
          window.location.href = "/";
          return;
        }
        const data = await res.json().catch(() => ({}));
        setStatus($("#authStatus"), (data && data.error && data.error.message) || "That email and password do not match an account.", "error");
      } catch {
        setStatus($("#authStatus"), "Could not connect. Try again.", "error");
      } finally {
        setLoading(form.querySelector("button"), false);
      }
    });

    $("#passkeyBtn") && $("#passkeyBtn").addEventListener("click", function () {
      startPasskey(email);
    });
  }

  /* ------------------------------------------------------------- Register */

  function renderRegister() {
    return `
      <div class="authCard authCardCentered">
        <h1>Create your account</h1>
        <p class="sub">One account for every Oplo product.</p>
        <div id="authStatus" class="authStatus" style="display:none;width:100%"></div>
        <form id="registerForm" style="width:100%;margin-top:24px">
          <div class="field">
            <input id="name" name="name" type="text" placeholder=" " autocomplete="name">
            <label for="name">Full name</label>
          </div>
          <div class="field">
            <input id="email" name="email" type="email" placeholder=" " autocomplete="email">
            <label for="email">Email</label>
          </div>
          <div class="field">
            <input id="password" name="password" type="password" placeholder=" " autocomplete="new-password">
            <label for="password">Password</label>
          </div>
          <button class="btn btnPrimary" type="submit" style="width:100%">Create account</button>
        </form>
        <p style="text-align:center;margin-top:20px;font-size:14px"><a href="/" style="color:var(--blue)">Already have an account? Sign in</a></p>
      </div>`;
  }

  function wireRegister() {
    const form = $("#registerForm");
    if (!form) return;
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = $("#name").value.trim();
      const email = $("#email").value.trim();
      const password = $("#password").value;
      if (!name || !email || !password) {
        setStatus($("#authStatus"), "Fill in all fields.", "error");
        return;
      }
      setLoading(form.querySelector("button"), true);
      setStatus($("#authStatus"), "", "");
      try {
        /* Registration endpoint planned for the platform API. */
        setStatus($("#authStatus"), "Account creation is coming soon.", "info");
      } finally {
        setLoading(form.querySelector("button"), false);
      }
    });
  }

  /* ------------------------------------------------------------- Recovery */

  function renderRecovery() {
    return `
      <div class="authCard authCardCentered">
        <h1>Can't sign in?</h1>
        <p class="sub">We'll help you get back in.</p>
        <div id="authStatus" class="authStatus" style="display:none;width:100%"></div>
        <form id="recoveryForm" style="width:100%;margin-top:24px">
          <div class="field">
            <input id="email" name="email" type="email" placeholder=" " autocomplete="email">
            <label for="email">Email</label>
          </div>
          <button class="btn btnPrimary" type="submit" style="width:100%">Send recovery link</button>
        </form>
        <p style="text-align:center;margin-top:20px;font-size:14px"><a href="/" style="color:var(--blue)">Back to sign in</a></p>
      </div>`;
  }

  function wireRecovery() {
    const form = $("#recoveryForm");
    if (!form) return;
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = $("#email").value.trim();
      if (!email) {
        setStatus($("#authStatus"), "Enter your email.", "error");
        return;
      }
      setLoading(form.querySelector("button"), true);
      setStatus($("#authStatus"), "", "");
      try {
        /* Recovery endpoint planned for the platform API. */
        setStatus($("#authStatus"), "If that email has an Oplo account, a recovery link is on its way.", "success");
      } finally {
        setLoading(form.querySelector("button"), false);
      }
    });
  }

  /* ------------------------------------------------------------- Go */
  init();
})();
