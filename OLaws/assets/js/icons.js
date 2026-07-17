// Inline SVG icons. Stroke inherits currentColor; 1.6px hairline weight.
const S = (p) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;

export const icons = {
  // the lodestar mark — a four-point guiding star
  star: S(`<path d="M12 2.5c.7 4.4 2.4 6.1 6.8 6.8v.4c-4.4.7-6.1 2.4-6.8 6.8h-.4c-.7-4.4-2.4-6.1-6.8-6.8v-.4c4.4-.7 6.1-2.4 6.8-6.8Z" fill="currentColor" stroke="none"/><circle cx="19" cy="4.5" r="1" fill="currentColor" stroke="none"/>`),
  find: S(`<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>`),
  think: S(`<path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M18.4 5.6 17 7M21 12h-2"/><circle cx="12" cy="14" r="5.5"/><path d="M9.5 14a2.5 2.5 0 0 1 5 0"/>`),
  connect: S(`<circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="10" r="2.4"/><circle cx="8" cy="18" r="2.4"/><path d="M8 7.4 15.7 9M8.6 15.9 16 11.6M7.2 8 8 15.6"/>`),
  expand: S(`<path d="M12 20V8M8 12l4-4 4 4"/><path d="M5 20h14" opacity=".5"/>`),
  learn: S(`<path d="M3 7.5 12 4l9 3.5-9 3.5-9-3.5Z"/><path d="M7 9.5V15c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V9.5"/>`),
  make: S(`<path d="M6 3.5h7.5L18 8v12.5H6Z"/><path d="M13 3.5V8h5" opacity=".55"/><path d="M9 13h6M9 16.5h4"/>`),
  verified: S(`<path d="m4 12 2.4 2.4L4 12Z"/><path d="M9 12.5 11 14.5 15.5 9"/><circle cx="12" cy="12" r="8.4"/>`),
  shield: S(`<path d="M12 3 5 5.5v5.2c0 4.3 3 7.7 7 9.3 4-1.6 7-5 7-9.3V5.5L12 3Z"/><path d="m9 12 2 2 4-4"/>`),
  clock: S(`<circle cx="12" cy="12" r="8.2"/><path d="M12 8v4.2l2.8 1.8"/>`),
  scale: S(`<path d="M12 4v16M7 20h10"/><path d="M12 6 5 8m7-2 7 2"/><path d="M5 8 2.8 13a2.2 2.2 0 0 0 4.4 0L5 8Z"/><path d="M19 8l-2.2 5a2.2 2.2 0 0 0 4.4 0L19 8Z"/>`),
  gavel: S(`<path d="m14.5 4.5 5 5-3 3-5-5 3-3Z"/><path d="m11 8-6.5 6.5a1.8 1.8 0 0 0 2.5 2.5L13.5 10.5"/><path d="M13 18h7"/>`),
  spark: S(`<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m6.5 6.5 2 2m7-2-2 2m0 7 2 2m-9 0 2-2"/>`),
  search: S(`<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>`),
  bell: S(`<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>`),
  chevron: S(`<path d="m6 9 6 6 6-6"/>`),
  arrow: S(`<path d="M5 12h14M13 6l6 6-6 6"/>`),
  doc: S(`<path d="M6 3.5h7.5L18 8v12.5H6Z"/><path d="M13 3.5V8h5" opacity=".55"/>`),
  plus: S(`<path d="M12 5v14M5 12h14"/>`),
  rail: S(`<path d="M4 6h16M4 12h16M4 18h16"/>`),
  redteam: S(`<path d="M12 3 5 5.5v5.2c0 4.3 3 7.7 7 9.3 4-1.6 7-5 7-9.3V5.5L12 3Z"/><path d="m9.5 9.5 5 5m0-5-5 5"/>`),
  pin: S(`<path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10Z"/><circle cx="12" cy="11" r="2.2"/>`),
  close: S(`<path d="m6 6 12 12M18 6 6 18"/>`),
};

export function icon(name, cls = "") {
  const svg = icons[name] || icons.doc;
  return cls ? svg.replace("<svg ", `<svg class="${cls}" `) : svg;
}
