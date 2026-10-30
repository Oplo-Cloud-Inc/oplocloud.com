/* Roxan site: the menu on narrow screens, entrances, the thread, and the example on the front page. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The Roxan bar's menu, when there is no room for it. */
  const toggle = $('#ltoggle'), nav = $('#lnav');
  if (toggle && nav) {
    const set = open => { toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); };
    toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); toggle.focus(); } });
  }

  /* Entrances: a section announces itself once, when it comes on screen. */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
  const group = '.hero, .sec, .band, .page-hero';
  $$(group).forEach(el => io.observe(el));
  $$('.rv').filter(el => !el.closest(group)).forEach(el => io.observe(el));

  /* The thread down the page fills as you read. */
  const main = $('main');
  if (main) {
    let queued = false;
    const draw = () => {
      queued = false;
      const r = main.getBoundingClientRect();
      main.style.setProperty('--p', Math.min(1, Math.max(0, (innerHeight * .55 - r.top) / r.height)).toFixed(4));
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(draw); } }, { passive: true });
    addEventListener('resize', draw);
    draw();
  }

  /* The example conversation. The markup holds its final state; this plays it
     from the start. Without script, or with reduced motion, that is what you see. */
  const body = $('#demoBody');
  if (!body) return;
  const when = $('[data-when]', body);
  if (when) {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
    when.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(d);
  }
  if (reduced) return;

  const scenes = $$('.scene', body);
  let run = 0, playing = false;
  const wait = (ms, id) => new Promise(r => setTimeout(() => r(id === run), ms));
  const type = async (p, id) => {
    const full = p.textContent;
    p.textContent = ''; p.classList.add('caret');
    for (let i = 2; i <= full.length + 1; i += 2) {
      p.textContent = full.slice(0, i);
      if (!(await wait(24, id))) return false;
    }
    p.classList.remove('caret');
    return true;
  };
  /* An action or a memory starts out waiting, is pressed, and settles. */
  const settle = async (s, id, pressSel, waitingLabel, waitingState) => {
    const state = $('.state', s), label = $('.label', s), btns = $('.btns', s);
    const finalState = state && state.textContent, finalLabel = label.textContent;
    s.dataset.state = waitingState; btns.hidden = false;
    if (state) state.textContent = 'Waiting for you';
    if (waitingLabel) label.textContent = waitingLabel;
    if (!(await wait(2300, id))) return false;
    $(pressSel, s).classList.add('pressed');
    if (!(await wait(450, id))) return false;
    $(pressSel, s).classList.remove('pressed');
    btns.hidden = true; s.dataset.state = s.matches('.mem') ? 'kept' : 'done';
    if (state) state.textContent = finalState;
    label.textContent = finalLabel;
    return wait(1000, id);
  };
  async function play() {
    const id = ++run;
    scenes.forEach(sc => { sc.hidden = true; });
    body.classList.add('ready');
    for (const sc of scenes) {
      const steps = [...sc.children];
      steps.forEach(s => { s.hidden = true; });
      sc.classList.remove('out'); sc.hidden = false;
      if (!(await wait(500, id))) return;
      for (const s of steps) {
        s.hidden = false;
        let ok = true;
        if (s.matches('.msg.bot')) ok = (await type($('p', s), id)) && (await wait(700, id));
        else if (s.matches('.act')) ok = await settle(s, id, '[data-approve]', null, 'awaiting');
        else if (s.matches('.mem')) ok = await settle(s, id, '[data-keep]', 'Remember this?', 'proposed');
        else ok = await wait(1200, id);
        if (!ok) return;
      }
      if (!(await wait(3200, id))) return;
      sc.classList.add('out');
      if (!(await wait(700, id))) return;
      sc.hidden = true;
    }
    play();
  }
  const start = () => { if (!playing) { playing = true; play(); } };
  const stop = () => { run++; playing = false; };
  new IntersectionObserver(es => es.forEach(e => (e.isIntersecting && !document.hidden ? start : stop)()), { threshold: .25 }).observe(body);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
})();
