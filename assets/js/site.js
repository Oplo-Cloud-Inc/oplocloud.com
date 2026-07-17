/* Oplo — shared site chrome behavior (nav, mega-menu, reveal). */
(function () {
  var nav = document.getElementById('nav');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav: translucent on scroll
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Products mega-menu
  var productsItem = document.getElementById('productsItem');
  var productsTrigger = document.getElementById('productsTrigger');
  var scrim = document.getElementById('navScrim');
  var isMobile = function () { return window.matchMedia('(max-width: 720px)').matches; };
  var hoverTimer = null;

  function openMenu() {
    clearTimeout(hoverTimer);
    productsItem.classList.add('open');
    productsTrigger.setAttribute('aria-expanded', 'true');
    if (!isMobile()) { nav && nav.classList.add('menu-open'); scrim && scrim.classList.add('show'); }
  }
  function closeMenu() {
    if (!productsItem) return;
    productsItem.classList.remove('open');
    productsTrigger.setAttribute('aria-expanded', 'false');
    nav && nav.classList.remove('menu-open');
    scrim && scrim.classList.remove('show');
  }

  if (productsItem && productsTrigger) {
    productsTrigger.addEventListener('click', function (e) {
      e.stopPropagation();
      productsItem.classList.contains('open') ? closeMenu() : openMenu();
    });
    productsItem.addEventListener('mouseenter', function () { if (!isMobile()) openMenu(); });
    productsItem.addEventListener('mouseleave', function () { if (!isMobile()) hoverTimer = setTimeout(closeMenu, 160); });
    scrim && scrim.addEventListener('click', closeMenu);
    document.addEventListener('click', function (e) { if (!productsItem.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  // Mobile hamburger
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      if (!open) closeMenu();
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        closeMenu();
      }
    });
    window.addEventListener('resize', closeMenu, { passive: true });
  }

  // Reveal on scroll
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var d = en.target.classList.contains('reveal-d2') ? 140
                : en.target.classList.contains('reveal-d1') ? 70 : 0;
          setTimeout(function () { en.target.classList.add('in'); }, d);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  // Opal pointer parallax (homepage hero only)
  var opal = document.getElementById('heroOpal');
  if (opal && !reduce && window.matchMedia('(pointer: fine)').matches) {
    var raf = null;
    window.addEventListener('pointermove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        var r = opal.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
        var dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
        opal.style.setProperty('--px', (dx * 14) + 'px');
        opal.style.setProperty('--py', (dy * 12) + 'px');
        raf = null;
      });
    }, { passive: true });
  }
})();
