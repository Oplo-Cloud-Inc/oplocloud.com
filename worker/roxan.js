/* ==========================================================================
   Roxan's Worker — roxan.oplocloud.com.

   The site is the `roxan/` directory, served as static assets. This code only
   runs for requests no file answered, and it is two things: the edge that
   decides who may come in and where each request goes (worker/agent/gateway.js,
   kept apart so it can be tested), and the Durable Object class that is each
   person's Roxan (worker/agent/do.js). Wrangler needs both exported from here.
   ========================================================================== */

import { gateway } from "./agent/gateway.js";

export { Agent } from "./agent/do.js";

export default { fetch: gateway };
