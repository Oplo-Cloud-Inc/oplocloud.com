/* OploCloud — homepage v3 behaviour.
   Loaded by index.html (deferred). No imports and no dependencies: Material
   Web is loaded separately, so everything here still works if it is not. */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------------------------ Buttons without the library
     <md-filled-button> and <md-outlined-button> are only links and buttons
     once Material Web has upgraded them. Until then, or for good if it never
     loads (blocked, offline), they get the role, the tab stop and the keys by
     hand. The attributes come off once the element is defined and has rendered
     (focus is handed to its inner control then, so a late upgrade does not drop
     it), so there is never a second tab stop on an upgraded button. */
  const LINKS = 'md-filled-button[href], md-outlined-button[href]';
  const CONTROLS = `${LINKS}, md-outlined-button:not([href])`;
  const upgraded = (el) => Boolean(customElements.get(el.localName));

  $$(CONTROLS).forEach((el) => {
    if (upgraded(el)) return;
    el.setAttribute('role', el.hasAttribute('href') ? 'link' : 'button');
    el.tabIndex = 0;
    customElements.whenDefined(el.localName).then(() => el.updateComplete).then(() => {
      const had = document.activeElement === el;
      el.removeAttribute('role');
      el.removeAttribute('tabindex');
      if (had) el.focus();
    });
  });
  document.addEventListener('click', (e) => {
    const el = e.target.closest(LINKS);
    if (!el || upgraded(el)) return;
    const href = el.getAttribute('href');
    if (e.metaKey || e.ctrlKey) window.open(href); else location.href = href;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest && e.target.closest(CONTROLS);
    if (!el || upgraded(el)) return;
    if (e.key === ' ' && el.hasAttribute('href')) return;   // links answer Enter only
    e.preventDefault();
    el.click();
  });

  /* ------------------------------------------------------------- Nav flyouts
     Hover opens (with a short grace period so the pointer can cross to the
     panel), focus opens, Escape closes. One flyout at a time; the page dims
     behind it through html.fly-open. */
  const items = $$('.nav__item--link');      // the seven links; the logo and icons share the list but have no flyout
  let current = null;
  let closeTimer = 0;
  let escaping = false;

  const syncPanels = () => items.forEach((it) => {
    const panel = $('.flyout', it);
    if (panel) panel.inert = it !== current;     // inert: no Tab into a panel that is closing or closed
  });
  const setOpen = (item) => {
    if (item === current) return;
    if (current) {
      current.classList.remove('is-open');
      $('.nav__link', current).setAttribute('aria-expanded', 'false');
    }
    current = item;
    if (item) {
      item.classList.add('is-open');
      $('.nav__link', item).setAttribute('aria-expanded', 'true');
    }
    root.classList.toggle('fly-open', Boolean(item));
    syncPanels();
  };
  syncPanels();

  const closeSoon = (item, ms) => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (current === item && !item.matches(':hover') && !item.contains(document.activeElement)) setOpen(null);
    }, ms);
  };

  items.forEach((item) => {
    item.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      clearTimeout(closeTimer);
      setOpen(item);
    });
    item.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return;
      closeSoon(item, 160);
    });
    item.addEventListener('focusin', () => {
      if (escaping) return;
      clearTimeout(closeTimer);
      setOpen(item);
    });
    item.addEventListener('focusout', (e) => {
      if (!item.contains(e.relatedTarget)) closeSoon(item, 0);
    });
  });

  const scrim = $('#scrim');
  if (scrim) scrim.addEventListener('click', () => setOpen(null));

  /* -------------------------------------------------------------- Menu sheet
     Below 735px the bar's menu button opens a full-screen <dialog>. As a modal
     dialog it keeps focus inside, closes on Escape and hands focus back to the
     menu button. The page under it does not scroll (html.menu-open). It closes
     when a link is followed, and if the window grows past the mobile layout. */
  const menu = $('#menu');
  const menuOpen = $('#menu-open');
  const menuClose = $('#menu-close');
  if (menu && menuOpen) {
    const wide = window.matchMedia('(min-width: 735px)');
    const modal = typeof menu.showModal === 'function';

    const settle = (open) => {
      menuOpen.setAttribute('aria-expanded', String(open));
      root.classList.toggle('menu-open', open);
    };
    const openMenu = () => {
      if (menu.hasAttribute('open') || wide.matches) return;
      if (current) setOpen(null);
      if (modal) menu.showModal(); else menu.setAttribute('open', '');
      settle(true);
      if (!modal && menuClose) menuClose.focus();
    };
    const closeMenu = () => {
      if (!menu.hasAttribute('open')) return;
      if (modal) menu.close();
      else { menu.removeAttribute('open'); onClosed(); }
    };
    const onClosed = () => {
      settle(false);
      // The dialog returns focus itself; this covers the cases where it cannot.
      const lost = !document.activeElement || document.activeElement === document.body;
      if (lost && !wide.matches) menuOpen.focus();
    };

    menu.addEventListener('close', onClosed);
    menuOpen.addEventListener('click', openMenu);
    if (menuClose) menuClose.addEventListener('click', closeMenu);
    menu.addEventListener('click', (e) => { if (e.target.closest('a[href]')) closeMenu(); });
    if (!modal) menu.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    wide.addEventListener('change', (e) => { if (e.matches) closeMenu(); });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !current) return;
    const link = $('.nav__link', current);
    const focusInside = current.contains(document.activeElement);
    setOpen(null);
    if (focusInside) {                       // put focus back on the link without reopening
      escaping = true;
      link.focus();
      escaping = false;
    }
  });

  /* ------------------------------------------------------------ Scroll reveal
     Fade up 24px, 600ms (CSS). Off under reduced motion: everything shows. */
  const revealTargets = $$('.reveal');
  const showAll = () => revealTargets.forEach((el) => el.classList.add('is-in'));

  if (mq.matches || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach((el) => io.observe(el));
  }
  mq.addEventListener('change', () => { if (mq.matches) showAll(); });
  document.addEventListener('focusin', (e) => {
    const r = e.target.closest && e.target.closest('.reveal');
    if (r) r.classList.add('is-in');
  });
  window.__hv3 = true;                       // the reveal is armed: tells the fail-safe in <head> to stand down

  /* ---------------------------------------------------------------- Carousel
     Five slides, auto-advance every 6s, 900ms slide, loops. The track is moved
     by transform; three clones at each end keep both neighbours in view and
     make the loop seamless, then the track snaps back to the real slide. */
  const car = $('[data-carousel]');
  if (!car) return;

  const viewport = $('.carousel__viewport', car);
  const track = $('.carousel__track', car);
  const slides = $$('.slide', track);
  const dots = $$('.dot', car);
  const toggle = $('.carousel__toggle', car);
  const status = $('#carousel-status', car);   // spoken only when the visitor moves the carousel, never on auto-advance
  const N = slides.length;
  const CLONES = 3;
  const SLIDE_MS = 900;
  const EVERY_MS = 6000;

  const clone = (slide) => {
    const c = slide.cloneNode(true);
    c.classList.add('is-clone');
    c.setAttribute('aria-hidden', 'true');
    c.setAttribute('inert', '');
    return c;
  };
  track.prepend(...slides.slice(-CLONES).map(clone));
  track.append(...slides.slice(0, CLONES).map(clone));

  let pos = 0;                               // index of the centred slide; <0 or >=N while on a clone
  let step = 0;                              // one slide plus one gap, in px
  let timer = 0;
  let settleTimer = 0;
  let pending = null;                        // a dot clicked while the track is still on a clone
  let playing = !mq.matches;                 // reduced motion starts paused

  const real = (p) => ((p % N) + N) % N;
  const onClone = () => pos < 0 || pos > N - 1;

  const measure = () => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    step = slides[0].getBoundingClientRect().width + gap;   // fractional: 70vw is not always whole px
  };
  const place = (animate) => {
    track.style.transition = animate ? '' : 'none';
    track.style.transform = `translate3d(${-(pos + CLONES) * step}px, 0, 0)`;
    if (!animate) {
      void track.offsetWidth;                // commit the jump before transitions come back
      track.style.transition = '';
    }
  };
  const mark = () => {
    dots.forEach((d, i) => {
      if (i === real(pos)) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
  };

  const settle = () => {
    clearTimeout(settleTimer);
    if (onClone()) {
      pos = real(pos);
      place(false);
    }
    if (pending !== null) {
      const target = pending;
      pending = null;
      goTo(target, true);
    }
  };

  const move = (delta) => {
    pos += delta;
    mark();
    clearTimeout(settleTimer);
    if (mq.matches) {
      place(false);
      settle();
    } else {
      place(true);
      settleTimer = setTimeout(settle, SLIDE_MS + 80);   // backstop if transitionend never fires
    }
  };

  const disarm = () => { clearTimeout(timer); timer = 0; };
  const arm = () => {
    disarm();
    if (playing && !document.hidden) timer = setTimeout(next, EVERY_MS);
  };

  const next = () => {
    if (!onClone()) move(1);
    arm();
  };

  const goTo = (target, user) => {
    if (onClone()) {                         // mid-loop: run it once the track has landed
      pending = target;
      return;
    }
    let d = target - pos;
    if (d > N / 2) d -= N;                   // take the short way round
    else if (d < -N / 2) d += N;
    if (d !== 0) move(d);
    if (user) {
      arm();
      if (status && d !== 0) status.textContent = `Slide ${real(pos) + 1} of ${N}`;
    }
  };

  const setPlaying = (value) => {
    playing = value;
    toggle.classList.toggle('is-paused', !value);
    toggle.setAttribute('aria-label', value ? 'Pause slideshow' : 'Play slideshow');
    if (value) arm(); else disarm();
  };

  track.addEventListener('transitionend', (e) => {
    if (e.target === track && e.propertyName === 'transform') settle();
  });
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i, true)));
  toggle.addEventListener('click', () => setPlaying(!playing));

  // Rotation stops while keyboard focus is inside the carousel, and only the toggle
  // starts it again: a focused control must not slide out from under the visitor.
  // (A mouse click on the toggle focuses it too; its own handler decides there.)
  const byKeyboard = (el) => { try { return el.matches(':focus-visible'); } catch (_) { return true; } };   // browsers before :focus-visible: treat any focus as keyboard
  car.addEventListener('focusin', (e) => {
    const t = e.composedPath()[0] || e.target;
    if (playing && !toggle.contains(t) && byKeyboard(t)) setPlaying(false);
  });
  // Keyboard focus landing on a neighbouring slide brings that slide to the centre.
  track.addEventListener('focusin', (e) => {
    const slide = e.target.closest('.slide');
    if (!slide || slide.classList.contains('is-clone')) return;
    const i = slides.indexOf(slide);
    if (i !== real(pos)) goTo(i, true);
  });
  // The viewport is never a scroll container once script runs; keep it at 0.
  viewport.addEventListener('scroll', () => { viewport.scrollLeft = 0; });

  // Swipe, for touch and pen (a mouse has the dots): a mostly horizontal drag of
  // 40px or more moves one slide. touch-action: pan-y pinch-zoom in the CSS leaves
  // up, down and zoom to the page (a pinch ends the drag as a cancel, not a swipe).
  // Autoplay waits while a finger is down.
  let drag = null;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || !e.isPrimary) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    disarm();
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag = null;
    if (e.type === 'pointerup' && Math.abs(dx) >= 40 && Math.abs(dx) > 1.5 * Math.abs(dy)) goTo(real(pos) + (dx < 0 ? 1 : -1), true);
    else arm();
  };
  // On the document, so a pen that is lifted outside the viewport still ends the drag.
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  new ResizeObserver(() => { measure(); place(false); }).observe(viewport);
  document.addEventListener('visibilitychange', () => { if (document.hidden) disarm(); else arm(); });
  mq.addEventListener('change', () => { if (mq.matches) setPlaying(false); });

  measure();
  place(false);
  mark();
  setPlaying(playing);
})();
