/* ==========================================================================
   The developer site's Worker.

   It exists for one reason: to answer `oplocloud.com/dev` somewhere that is
   not the developer site itself.

   `dev/` is the directory this Worker publishes, so a page in it saying "go to
   dev.oplocloud.com" would be served *by* dev.oplocloud.com — a loop, and the
   site gone. And it could not be a file on GitHub Pages either: Pages
   publishes the whole repository, so `dev/index.html` is reachable at
   oplocloud.com/dev/ whatever we put at the front door. A route in front of
   Pages is the only place that catches it.

   Assets are matched before this code runs, so the only requests that arrive
   here are the ones no file answered.
   ========================================================================== */

const DEV = "https://dev.oplocloud.com/";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /* The path on the apex. 301 rather than 302: the developer site has its
       own hostname now, and a bookmark or a search result should learn that
       once rather than ask again forever.

       Everything under it goes to the front door rather than to the matching
       path, because there is no matching path — /dev/dev.css was never a page
       anybody meant to visit. */
    if (url.hostname !== "dev.oplocloud.com" &&
        (url.pathname === "/dev" || url.pathname.startsWith("/dev/"))) {
      return Response.redirect(DEV, 301);
    }

    // Anything else that reached the Worker matched no file. Asking the asset
    // server keeps one answer for "not found" rather than inventing a second.
    return env.ASSETS.fetch(request);
  }
};
