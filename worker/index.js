/* ==========================================================================
   OEdu's Worker.

   It serves the app, and it sends the old address to the new one.

   The redirect could not be a page. `learn/` is the directory this Worker
   publishes, so an index.html in it saying "go to edu.oplocloud.com" would be
   served *by* edu.oplocloud.com — a loop, and the product gone. The old
   address has to be answered somewhere that is not the app, and a route in
   front of it is the only such place.

   It could not be a file on GitHub Pages either. Pages publishes the whole
   repository, so every path in it is reachable at oplocloud.com whatever we
   put at the front door; a redirect at `/learn/index.html` would move the
   door and leave the windows open. A route catches `/learn` and everything
   under it, before the request ever reaches Pages.

   Assets are matched first and this code does not run for them, so the only
   requests that arrive here are the ones no file answered.
   ========================================================================== */

const OEDU = "https://edu.oplocloud.com/";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /* The old home. 301 rather than 302 because it is not coming back: a
       bookmark, a link in an email sent last term, and a search result should
       all end up learning the new address rather than asking again forever.

       Everything under it goes to the front door rather than to the matching
       path, because there is no matching path — /learn/app.js was never a
       page somebody meant to visit. */
    if (url.hostname !== "edu.oplocloud.com" &&
        (url.pathname === "/learn" || url.pathname.startsWith("/learn/"))) {
      return Response.redirect(OEDU, 301);
    }

    // Anything else that reached the Worker matched no file. Asking the asset
    // server keeps one answer for "not found" rather than inventing a second.
    return env.ASSETS.fetch(request);
  }
};
