// Footer year
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// Mobile menu
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav__toggle");
if (nav && toggle) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

// Fade-in on scroll
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }),
    { threshold: 0.1 }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

// Swap missing images for a striped placeholder
document.querySelectorAll("img[data-ph]").forEach((img) => {
  const swap = () => {
    const div = document.createElement("div");
    div.className = ("ph " + img.className).trim();
    div.style.width = "100%";
    div.style.height = "100%";
    img.replaceWith(div);
  };
  if (img.complete && img.naturalWidth === 0) swap();
  else img.addEventListener("error", swap);
});

// Stack logos: show the tool name until a logo is uploaded
document.querySelectorAll("img[data-logo]").forEach((img) => {
  const swap = () => {
    const span = document.createElement("span");
    span.className = "tool__name";
    span.textContent = img.alt;
    img.replaceWith(span);
  };
  if (img.complete && img.naturalWidth === 0) swap();
  else img.addEventListener("error", swap);
});

// Cursor-following tooltip for elements with data-tip (desktop only)
const tipTargets = document.querySelectorAll("[data-tip]");
if (tipTargets.length && window.matchMedia("(hover: hover)").matches) {
  const tip = document.createElement("div");
  tip.className = "cursor-tip";
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

// FAQ accordion
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

// Case study image carousel
document.querySelectorAll(".carousel").forEach((carousel) => {
  const slides = [...carousel.querySelectorAll("img")];
  const prev = carousel.querySelector(".prev");
  const next = carousel.querySelector(".next");
  let i = 0;
  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("is-active", k === i));
  };
  if (slides.length < 2) {
    prev.hidden = next.hidden = true;
  }
  prev.addEventListener("click", () => show(i - 1));
  next.addEventListener("click", () => show(i + 1));
  show(0);
});

// Resume: skill chips that fall and can be dragged around (Matter.js)
const skillsBox = document.querySelector(".r-skills");
if (skillsBox) {
  const world = skillsBox.querySelector(".r-skills__world");
  const chips = [...world.querySelectorAll(".skill")];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!window.Matter || reduced) {
    skillsBox.classList.add("is-static");
  } else {
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      const { Engine, Bodies, Composite, Mouse, MouseConstraint, Body } = Matter;
      const engine = Engine.create();
      engine.gravity.y = 1;
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
        const y = -60 - k * 55;
        const body = Bodies.rectangle(x, y, cw, ch, {
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
      // Let the page scroll when using the mouse wheel over the box
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
          // Keep bodies inside the box if something flings them out
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
