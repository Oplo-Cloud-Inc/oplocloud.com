/* The rail's small drawings: one line weight, one grid (16 by 16), drawn in the
   colour of the text beside them. They name nothing the words do not; they are
   there to be found at a glance. */
import { s } from "./dom.js";

const PATHS = {
  home: ["M2.5 7.2 8 2.8l5.5 4.4V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V7.2Z", "M6.5 13.5v-3.5h3v3.5"],
  chat: ["M4 3h8a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1H8.2L5.5 13v-2.5H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"],
  projects: ["M2.5 4.5a1 1 0 0 1 1-1h2.6l1.4 1.6h5a1 1 0 0 1 1 1v6.4a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V4.5Z"],
  handoff: ["M9.5 2.5h4v4", "M13.5 2.5 7.5 8.5", "M12 9.5V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2.5"],
  actions: ["M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z", "M5.6 8.2 7.3 9.9l3.2-3.4"],
  specialties: ["M2.8 4.5 3.8 5.5 5.4 3.4", "M8 4.5h5.2", "M2.8 10.5 3.8 11.5 5.4 9.4", "M8 10.5h5.2"],
  schedule: ["M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z", "M8 5.2V8l1.9 1.2"],
  panels: [
    "M4 3h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z", "M10 3h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z",
    "M4 9h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z", "M10 9h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z",
  ],
  memory: [
    "M8 6.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z", "M3.5 3.3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z", "M12.5 3.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z", "M11 11.3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z",
    "M6.8 7.1 4.5 5.4", "M9.5 7.2 11.5 5.8", "M8.9 9.4 10.2 11.2",
  ],
  vault: ["M4.5 7h7a1 1 0 0 1 1 1v4.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z", "M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7", "M8 9.4v1.5"],
  integrations: ["M6 2.5v3", "M10 2.5v3", "M4.5 5.5h7v2a3.5 3.5 0 0 1-7 0v-2Z", "M8 10.8v2.7"],
  activity: ["M2 8h2.6l1.6-4.2 3 8.4 1.6-4.2H14"],
};

export const icon = name => s("svg", { class: "ic", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false" }, (PATHS[name] || []).map(d => s("path", { d })));
