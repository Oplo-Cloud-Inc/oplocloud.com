// Oplo Accounts — demo OIDC client (browser).
// Uses oidc-client-ts (the standard browser OpenID Connect library).
// This is exactly how each real app (ODocs, OMails, …) will plug into Oplo Accounts.
import { UserManager, WebStorageStateStore } from "https://esm.sh/oidc-client-ts@3";

// You can set these two in the UI (they're saved to localStorage), or hard-code them here.
export const AUTHORITY = localStorage.getItem("oplo_authority") || "http://localhost:8080";
export const CLIENT_ID = localStorage.getItem("oplo_client_id") || "PASTE_CLIENT_ID_FROM_ZITADEL";

export const settings = {
  authority: AUTHORITY,                 // the Oplo Accounts (ZITADEL) server
  client_id: CLIENT_ID,                 // this app's ID, from the ZITADEL console
  redirect_uri: location.origin + "/oplo-accounts/demo/callback.html",
  post_logout_redirect_uri: location.origin + "/oplo-accounts/demo/",
  response_type: "code",                // Authorization Code flow (+ PKCE, on by default)
  scope: "openid profile email",        // what we ask to know about the user
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,           // keep the session fresh in the background
};

export const userManager = new UserManager(settings);
