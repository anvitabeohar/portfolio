document.documentElement.classList.add("js");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = window.matchMedia("(hover: hover)").matches;
const root = document.body.dataset.root || "";

// Footer year
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// ---------------------------------------------------------------------------
// Navigation: mobile menu, frosted background once scrolled, hide on scroll down
// ---------------------------------------------------------------------------
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav__toggle");
const setMenu = (open) => {
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
};
if (nav && toggle) {
  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
}
if (nav) {
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 8);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (goingDown && y > 240 && !nav.classList.contains("is-open") && !nav.contains(document.activeElement)) {
      nav.classList.add("is-hidden");
    } else if (goingUp || y < 240) {
      nav.classList.remove("is-hidden");
    }
    if (goingDown || goingUp) lastY = y;
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  nav.addEventListener("focusin", () => nav.classList.remove("is-hidden"));
  onScroll();
}

// ---------------------------------------------------------------------------
// Scroll reveal with a 60ms stagger inside [data-stagger] groups
// ---------------------------------------------------------------------------
document.querySelectorAll("[data-stagger]").forEach((group) => {
  [...group.children].forEach((child, i) => child.style.setProperty("--i", i));
});
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reducedMotion) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }),
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

// ---------------------------------------------------------------------------
// Image fallbacks for files that haven't been uploaded yet
// ---------------------------------------------------------------------------
const onMissing = (img, fn) => {
  if (img.complete && img.naturalWidth === 0) fn();
  else img.addEventListener("error", fn, { once: true });
};
// Striped placeholder
document.querySelectorAll("img[data-ph]").forEach((img) =>
  onMissing(img, () => {
    const div = document.createElement("div");
    div.className = ("ph " + img.className).trim();
    div.style.width = "100%";
    div.style.height = "100%";
    div.setAttribute("role", "img");
    div.setAttribute("aria-label", img.alt + " (image coming soon)");
    img.replaceWith(div);
  })
);
// Tool name instead of a logo
document.querySelectorAll("img[data-logo]").forEach((img) =>
  onMissing(img, () => {
    const span = document.createElement("span");
    span.className = "tool__name";
    span.textContent = img.alt;
    img.replaceWith(span);
  })
);
// Another image (e.g. pixel character instead of a photo)
document.querySelectorAll("img[data-fallback]").forEach((img) =>
  onMissing(img, () => {
    img.src = img.dataset.fallback;
    img.classList.add("is-fallback");
  })
);

// ---------------------------------------------------------------------------
// Pointer effects (desktop only): reveal light and cursor-following labels
// ---------------------------------------------------------------------------
if (canHover && !reducedMotion) {
  document.querySelectorAll(".has-light").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}
const tipTargets = document.querySelectorAll("[data-tip]");
if (tipTargets.length && canHover) {
  const tip = document.createElement("div");
  tip.className = "cursor-tip";
  tip.setAttribute("aria-hidden", "true");
  document.body.appendChild(tip);
  tipTargets.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      tip.textContent = el.dataset.tip;
      tip.classList.add("is-on");
    });
    el.addEventListener("mouseleave", () => tip.classList.remove("is-on"));
    el.addEventListener("mousemove", (e) => {
      tip.style.left = e.clientX + "px";
      tip.style.top = e.clientY + "px";
    });
  });
}

// ---------------------------------------------------------------------------
// FAQ accordion
// ---------------------------------------------------------------------------
document.querySelectorAll(".faq__item").forEach((item) => {
  const btn = item.querySelector(".faq__q");
  const icon = btn.querySelector("i");
  const sync = () => {
    const open = item.classList.contains("is-open");
    btn.setAttribute("aria-expanded", String(open));
    icon.textContent = open ? "−" : "+";
  };
  btn.addEventListener("click", () => {
    item.classList.toggle("is-open");
    sync();
  });
  sync();
});

// ---------------------------------------------------------------------------
// Case study: image carousel
// ---------------------------------------------------------------------------
document.querySelectorAll(".carousel").forEach((carousel) => {
  const slides = [...carousel.querySelectorAll("img")];
  const prev = carousel.querySelector(".prev");
  const next = carousel.querySelector(".next");
  let i = 0;
  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("is-active", k === i));
  };
  if (slides.length < 2) prev.hidden = next.hidden = true;
  prev.addEventListener("click", () => show(i - 1));
  next.addEventListener("click", () => show(i + 1));
  show(0);
});

// ---------------------------------------------------------------------------
// Case study: XP (reading progress) bar, table of contents, level complete
// ---------------------------------------------------------------------------
const xp = document.querySelector(".xp__fill");
const article = document.querySelector(".prose");
if (xp && article) {
  let queued = false;
  const update = () => {
    const r = article.getBoundingClientRect();
    const total = r.height - window.innerHeight * 0.6;
    const p = Math.min(1, Math.max(0, (window.innerHeight * 0.4 - r.top) / total));
    xp.style.transform = `scaleX(${p})`;
    queued = false;
  };
  window.addEventListener("scroll", () => {
    if (!queued) {
      requestAnimationFrame(update);
      queued = true;
    }
  }, { passive: true });
  update();
}

const tocLinks = [...document.querySelectorAll(".toc a")];
if (tocLinks.length && "IntersectionObserver" in window) {
  const byId = new Map(tocLinks.map((a) => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((a) => {
          a.classList.remove("is-active");
          a.removeAttribute("aria-current");
        });
        const link = byId.get(entry.target.id);
        if (link) {
          link.classList.add("is-active");
          link.setAttribute("aria-current", "true");
        }
      }),
    { rootMargin: "-35% 0px -60% 0px" }
  );
  byId.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) io.observe(section);
  });
}

// ---------------------------------------------------------------------------
// Numbers that count up once when they come into view
// ---------------------------------------------------------------------------
const counters = document.querySelectorAll("[data-count]");
if (counters.length && "IntersectionObserver" in window && !reducedMotion) {
  const fmt = new Intl.NumberFormat("en-US");
  const run = (el) => {
    const end = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 800);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt.format(Math.round(end * eased)) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      }),
    { threshold: 0.6 }
  );
  counters.forEach((el) => io.observe(el));
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts (press ? to see them)
// ---------------------------------------------------------------------------
const shortcuts = document.getElementById("shortcuts");
const routes = {
  h: "index.html",
  w: "projects.html",
  a: "about.html",
  c: "contact.html",
  s: "speedrun.html",
  r: "assets/docs/resume.pdf",
};
document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
  const t = e.target;
  if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
  if (shortcuts && shortcuts.open) return;
  if (e.key === "?" && shortcuts) {
    e.preventDefault();
    shortcuts.showModal();
    return;
  }
  const route = routes[e.key.toLowerCase()];
  if (route) window.location.href = root + route;
});

// ---------------------------------------------------------------------------
// About: skill chips that fall and can be dragged around (Matter.js)
// ---------------------------------------------------------------------------
const skillsBox = document.querySelector(".r-skills");
if (skillsBox) {
  const world = skillsBox.querySelector(".r-skills__world");
  const chips = [...world.querySelectorAll(".skill")];

  if (!window.Matter || reducedMotion) {
    skillsBox.classList.add("is-static");
  } else {
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      const { Engine, Bodies, Composite, Mouse, MouseConstraint, Body } = Matter;
      const engine = Engine.create();
      const w = world.clientWidth;
      const h = world.clientHeight;
      const wall = 200;
      Composite.add(engine.world, [
        Bodies.rectangle(w / 2, h + wall / 2, w * 3, wall, { isStatic: true }),
        Bodies.rectangle(-wall / 2, h / 2, wall, h * 4, { isStatic: true }),
        Bodies.rectangle(w + wall / 2, h / 2, wall, h * 4, { isStatic: true }),
      ]);

      const bodies = chips.map((chip, k) => {
        const cw = chip.offsetWidth;
        const ch = chip.offsetHeight;
        const x = cw / 2 + Math.random() * Math.max(1, w - cw);
        const body = Bodies.rectangle(x, -60 - k * 55, cw, ch, {
          chamfer: { radius: ch / 2 },
          restitution: 0.25,
          friction: 0.4,
          angle: (Math.random() - 0.5) * 0.6,
        });
        body.chip = chip;
        return body;
      });
      Composite.add(engine.world, bodies);

      const mouse = Mouse.create(world);
      // Let the page scroll when the wheel is used over the box
      mouse.element.removeEventListener("wheel", mouse.mousewheel);
      mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
      mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
      Composite.add(engine.world, MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2 } }));

      let last = performance.now();
      const draw = (now = last) => {
        // Fixed-size steps keep the simulation stable if a frame is slow
        Engine.update(engine, Math.min(now - last, 32) || 16);
        last = now;
        bodies.forEach((b) => {
          if (b.position.y > h + 100) Body.setPosition(b, { x: w / 2, y: -40 });
          const { x, y } = b.position;
          b.chip.style.transform = `translate(${x - b.chip.offsetWidth / 2}px, ${y - b.chip.offsetHeight / 2}px) rotate(${b.angle}rad)`;
        });
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    };

    chips.forEach((c) => (c.style.transform = "translate(-9999px, 0)"));
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start();
          io.disconnect();
        }
      }, { threshold: 0.3 });
      io.observe(skillsBox);
    } else {
      start();
    }
  }
}
