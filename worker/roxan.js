/* ==========================================================================
   Roxan's Worker — roxan.oplocloud.com.

   The site is the `roxan/` directory, served as static assets. This code only
   runs for requests no file answered, and it has one job: send the old
   address home.

   Roxan used to live at oplocloud.com/roxan/, and GitHub Pages still
   publishes that directory there, because Pages publishes the whole
   repository. Two routes on the apex put this Worker in front of that path,
   the way the developer site does for /dev (worker/dev.js). Unlike /dev, the
   path is kept: oplocloud.com/roxan/mof/ is a real page, and it lands on
   roxan.oplocloud.com/mof/ rather than on the front door.

   The same rule covers /roxan/… on this hostname, which is what an old
   root-relative link inside the site would ask for.
   ========================================================================== */

const HOST = "roxan.oplocloud.com";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p === "/roxan" || p.startsWith("/roxan/")) {
      // 301: the move is permanent, so bookmarks and search results learn it once.
      return Response.redirect("https://" + HOST + (p.slice(6) || "/") + url.search, 301);
    }

    // Anything else matched no file; the asset server's 404 page answers it.
    return env.ASSETS.fetch(request);
  }
};
