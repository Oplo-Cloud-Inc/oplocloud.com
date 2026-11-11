/* Homepage behaviour. Material Web is loaded before any code that depends on
   the upgraded controls. Nav, reveal and the carousel do not wait on it, so a
   slow or blocked CDN still leaves the page usable. */

window.__ocHome = true;

// esm.run (and esm.sh's default build) ships each component as its own bundle.
// Every bundle calls customElements.define("md-focus-ring"), so the second
// import throws and the rest of the controls never register. The unbundled
// graph shares one module for that element. esm.run has no unbundled build;
// esm.sh serves the same @material/web@2.2.0 package with ?bundle=false.
const MATERIAL = "https://esm.sh/@material/web@2.2.0";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function prefersReduced() {
  return reducedMotion.matches;
}

const mobileQuery = window.matchMedia("(max-width: 734px)");

function isMobile() {
  return mobileQuery.matches;
}

document.addEventListener("click", (event) => {
  const host = event.target.closest("md-filled-button, md-outlined-button, md-text-button");
  if (!host || !host.hasAttribute("href")) return;
  if (customElements.get(host.localName)) return;
  event.preventDefault();
  window.location.href = host.getAttribute("href");
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const host = event.target.closest?.("md-filled-button, md-outlined-button, md-text-button");
  if (!host || !host.hasAttribute("href")) return;
  if (customElements.get(host.localName)) return;
  event.preventDefault();
  window.location.href = host.getAttribute("href");
});

function initNav() {
  const mast = document.getElementById("mast");
  const flyout = document.getElementById("flyout");
  const scrim = document.getElementById("scrim");
  const triggers = [...document.querySelectorAll("[data-flyout]")];
  const panels = [...flyout.querySelectorAll("[data-panel]")];
  let openId = null;
  let closeTimer = 0;

  function open(id) {
    clearTimeout(closeTimer);
    openId = id;
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== id;
    });
    triggers.forEach((trigger) => {
      trigger.setAttribute("aria-expanded", trigger.dataset.flyout === id ? "true" : "false");
    });
    scrim.hidden = false;
    flyout.hidden = false;
    flyout.getBoundingClientRect();
    flyout.classList.add("open");
    scrim.classList.add("open");
  }

  function close() {
    if (!openId && flyout.hidden) return;
    const was = openId;
    openId = null;
    triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
    flyout.classList.remove("open");
    scrim.classList.remove("open");
    const finish = () => {
      if (flyout.classList.contains("open")) return;
      flyout.hidden = true;
      scrim.hidden = true;
      panels.forEach((panel) => { panel.hidden = true; });
    };
    if (prefersReduced()) finish();
    else window.setTimeout(finish, 260);
    return was;
  }

  function armClose() {
    clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (mast.matches(":hover") || mast.contains(document.activeElement)) return;
      close();
    }, 180);
  }

  triggers.forEach((trigger, index) => {
    trigger.addEventListener("mouseenter", () => { if (!isMobile()) open(trigger.dataset.flyout); });
    trigger.addEventListener("focus", () => { if (!isMobile()) open(trigger.dataset.flyout); });
    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      triggers[(index + step + triggers.length) % triggers.length].focus();
    });
  });

  flyout.addEventListener("mouseenter", () => clearTimeout(closeTimer));
  document.getElementById("nav").addEventListener("mouseleave", armClose);
  flyout.addEventListener("mouseleave", armClose);
  scrim.addEventListener("click", () => close());

  mast.addEventListener("focusout", (event) => {
    const next = event.relatedTarget;
    if (next && mast.contains(next)) return;
    close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !openId || document.body.classList.contains("menu-open")) return;
    const current = document.querySelector(`[data-flyout="${openId}"]`);
    close();
    current?.focus();
  });
}

function initMenu() {
  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mobile-menu");
  const locked = [document.querySelector(".skip"), document.querySelector("main"), document.querySelector(".foot")];
  let open = false;

  function focusable() {
    return [...document.querySelectorAll("#nav a, #nav button, #nav md-icon-button, #mobile-menu a, #mobile-menu button")]
      .filter((el) => el.getClientRects().length > 0);
  }

  function setOpen(next) {
    if (next === open) return;
    open = next;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Menu");
    document.body.classList.toggle("menu-open", open);
    locked.forEach((el) => { if (el) el.inert = open; });
    if (open) {
      menu.hidden = false;
      menu.getBoundingClientRect();
      menu.classList.add("open");
      const first = menu.querySelector("a, button");
      first?.focus();
    } else {
      menu.classList.remove("open");
      const finish = () => {
        if (menu.classList.contains("open")) return;
        menu.hidden = true;
      };
      if (prefersReduced()) finish();
      else window.setTimeout(finish, 200);
      toggle.focus();
    }
  }

  toggle.addEventListener("click", () => setOpen(!open));

  document.addEventListener("keydown", (event) => {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !menu.contains(active) && !document.getElementById("nav").contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  mobileQuery.addEventListener("change", () => { if (!isMobile()) setOpen(false); });
}

function initFooter() {
  const groups = [...document.querySelectorAll(".foot-group")];
  function apply() {
    const mobile = isMobile();
    groups.forEach((group) => {
      const summary = group.querySelector("summary");
      if (!mobile) {
        group.open = true;
        summary.tabIndex = -1;
      } else {
        summary.tabIndex = 0;
        if (group.dataset.mode !== "mobile") group.open = false;
      }
      group.dataset.mode = mobile ? "mobile" : "desktop";
    });
  }
  groups.forEach((group) => {
    group.querySelector("summary").addEventListener("click", (event) => {
      if (!isMobile()) event.preventDefault();
    });
  });
  apply();
  mobileQuery.addEventListener("change", apply);
}

function initCarousel() {
  const root = document.getElementById("featured");
  const viewport = root.querySelector(".carousel-viewport");
  const track = root.querySelector(".carousel-track");
  const real = [...track.children];
  const count = real.length;
  const dots = [...root.querySelectorAll(".dot")];
  const pause = root.querySelector(".carousel-pause");

  const lastClone = real[count - 1].cloneNode(true);
  const firstClone = real[0].cloneNode(true);
  [lastClone, firstClone].forEach((clone) => {
    clone.classList.add("is-clone");
    clone.setAttribute("aria-hidden", "true");
    clone.inert = true;
    clone.removeAttribute("id");
  });
  track.insertBefore(lastClone, real[0]);
  track.append(firstClone);

  let pos = 1;
  let timer = 0;
  let paused = prefersReduced();

  function gap() {
    const styles = getComputedStyle(track);
    return parseFloat(styles.columnGap || styles.gap) || 24;
  }

  function place(animate) {
    if (isMobile()) {
      track.style.transition = "none";
      track.style.transform = "none";
      real.forEach((slideEl) => {
        slideEl.inert = false;
        slideEl.removeAttribute("aria-hidden");
      });
      return;
    }
    const slide = track.children[1];
    const slideW = slide.getBoundingClientRect().width;
    const vp = viewport.getBoundingClientRect().width;
    const x = (vp - slideW) / 2 - pos * (slideW + gap());
    track.style.transition = animate && !prefersReduced()
      ? "transform 900ms cubic-bezier(.25,.1,.25,1)"
      : "none";
    track.style.transform = `translate3d(${x}px,0,0)`;
    const index = ((pos - 1) % count + count) % count;
    dots.forEach((dot, i) => {
      const on = i === index;
      dot.setAttribute("aria-selected", on ? "true" : "false");
      dot.tabIndex = on ? 0 : -1;
    });
    real.forEach((slideEl, i) => {
      const on = i === index;
      slideEl.inert = !on;
      slideEl.setAttribute("aria-hidden", on ? "false" : "true");
    });
  }

  function go(next, animate) {
    pos = next;
    place(animate);
  }

  function settle() {
    if (pos === 0) go(count, false);
    else if (pos === count + 1) go(1, false);
  }

  track.addEventListener("transitionend", (event) => {
    if (event.target !== track || event.propertyName !== "transform") return;
    settle();
  });

  function next() { go(pos + 1, true); }
  function prev() { go(pos - 1, true); }

  function stop() {
    if (timer) window.clearTimeout(timer);
    timer = 0;
  }

  function mark(index) {
    dots.forEach((dot, i) => {
      const on = i === index;
      dot.setAttribute("aria-selected", on ? "true" : "false");
      dot.tabIndex = on ? 0 : -1;
    });
  }

  function scrollToSlide(index) {
    const behavior = prefersReduced() ? "auto" : "smooth";
    const pad = parseFloat(getComputedStyle(viewport).scrollPaddingLeft) || 0;
    const delta = real[index].getBoundingClientRect().left - viewport.getBoundingClientRect().left - pad;
    viewport.scrollBy({ left: delta, behavior });
    mark(index);
  }

  function schedule() {
    stop();
    if (paused || prefersReduced() || isMobile()) return;
    timer = window.setTimeout(() => {
      next();
      schedule();
    }, 6000);
  }

  function setPaused(nextPaused) {
    paused = nextPaused;
    pause.classList.toggle("is-paused", paused);
    pause.setAttribute("aria-pressed", paused ? "true" : "false");
    pause.setAttribute("aria-label", paused ? "Play" : "Pause");
    if (paused) stop();
    else schedule();
  }

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      if (isMobile()) {
        scrollToSlide(i);
        return;
      }
      go(i + 1, true);
      schedule();
    });
  });

  viewport.addEventListener("scroll", () => {
    if (!isMobile()) return;
    const origin = viewport.getBoundingClientRect().left;
    let best = 0;
    let bestDist = Infinity;
    real.forEach((slideEl, i) => {
      const dist = Math.abs(slideEl.getBoundingClientRect().left - origin);
      if (dist < bestDist) { best = i; bestDist = dist; }
    });
    mark(best);
  }, { passive: true });

  root.querySelector(".carousel-controls").addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const current = dots.findIndex((dot) => dot.getAttribute("aria-selected") === "true");
    if (current < 0) return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const i = (current + step + count) % count;
    if (isMobile()) scrollToSlide(i);
    else { go(i + 1, true); schedule(); }
    dots[i].focus();
  });

  root.addEventListener("keydown", (event) => {
    if (event.target.closest(".carousel-controls") || isMobile()) return;
    if (event.key === "ArrowRight") { event.preventDefault(); next(); schedule(); }
    if (event.key === "ArrowLeft") { event.preventDefault(); prev(); schedule(); }
  });

  pause.addEventListener("click", () => setPaused(!paused));

  window.addEventListener("resize", () => place(false));
  mobileQuery.addEventListener("change", () => {
    place(false);
    if (isMobile()) stop();
    else schedule();
  });
  reducedMotion.addEventListener("change", () => {
    if (prefersReduced()) setPaused(true);
    place(false);
  });

  place(false);
  setPaused(paused);
}

function initReveal() {
  const nodes = [...document.querySelectorAll(".reveal")];
  if (prefersReduced() || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("in"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -6% 0px" });
  nodes.forEach((node) => observer.observe(node));
}

async function loadMaterial() {
  // Sequential on purpose: a parallel import of the bundled builds races the
  // shared element definitions. The unbundled graph is safe either way.
  const files = [
    "button/filled-button.js?bundle=false",
    "button/outlined-button.js?bundle=false",
    "button/text-button.js?bundle=false",
    "iconbutton/icon-button.js?bundle=false",
  ];
  for (const file of files) await import(`${MATERIAL}/${file}`);
  await Promise.all([
    customElements.whenDefined("md-filled-button"),
    customElements.whenDefined("md-outlined-button"),
    customElements.whenDefined("md-text-button"),
    customElements.whenDefined("md-icon-button"),
  ]);
  document.querySelectorAll("md-filled-button, md-outlined-button, md-text-button, md-icon-button")
    .forEach((host) => host.removeAttribute("tabindex"));
}

initNav();
initMenu();
initFooter();
initCarousel();
initReveal();

loadMaterial().catch((error) => {
  console.error("Material Web failed to load; pill styles stay on the fallback.", error);
});
