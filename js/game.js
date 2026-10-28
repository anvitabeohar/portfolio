// Bonus level: an original side-scrolling platformer starring Anvita's pixel character.
// Loaded on demand (only when someone presses Play). Exposes window.BonusLevel.open().
(() => {
  const ROOT = document.body.dataset.root || "";
  const A = ROOT + "assets/images/";
  const W = 960, H = 540, GROUND = 460;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  // ---------------------------------------------------------------- assets
  const SRC = {
    run1: A + "home/walk1.png", run2: A + "home/walk2.png",
    stand: A + "game/land.webp", jump: A + "game/jump.webp",
    climb1: A + "game/climb-1.webp", climb2: A + "game/climb-2.webp", climb3: A + "game/climb-3.webp", climb4: A + "game/climb-4.webp",
    sky: A + "game/bg-sky.webp", mountains: A + "game/bg-mountains.webp", bushes: A + "game/bg-bushes.webp",
    grass: A + "game/bg-grass.webp", dirt: A + "game/bg-dirt.webp",
    platform: A + "game/platform-1.webp", block: A + "game/block.webp", bulb: A + "game/bulb-block.webp",
    ladder: A + "game/ladder-tile.webp", flag: A + "game/flag.webp",
    ladybug: A + "game/ladybug.webp", caterpillar: A + "game/caterpillar.webp",
    wrench: A + "game/wrench.webp", screwdriver: A + "game/screwdriver.webp", hammer: A + "game/hammer.webp",
  };
  // visible part of each character sprite (the walk frames have padding)
  const CROP = {
    run1: [44, 15, 80, 138], run2: [36, 14, 86, 140], stand: [0, 0, 112, 152], jump: [0, 0, 128, 168],
    climb1: [0, 1, 110, 177], climb2: [0, 0, 110, 176], climb3: [0, 0, 114, 177], climb4: [0, 4, 112, 180],
  };
  const img = {};
  let loading = null;
  const load = () =>
    loading ||
    (loading = Promise.all(
      Object.entries(SRC).map(
        ([k, src]) =>
          new Promise((res) => {
            const i = new Image();
            i.onload = i.onerror = () => res();
            i.src = src;
            img[k] = i;
          })
      )
    ));

  // ----------------------------------------------------------------- level
  const ZONES = [
    [60, "2020 · Qubag"], [860, "2020 · Ittisa"], [1660, "2021 · Freelance"],
    [2560, "2023 · Blum"], [3460, "2024 · Trinity"], [4380, "2026 · IBM"],
  ];
  const GROUND_SEGS = [[0, 700], [810, 1500], [1610, 2400], [2510, 3300], [3420, 4220], [4330, 5500]];
  const WORLD = 5500, FLAG_X = 5280;
  const FACTS = [
    [1080, "Ittisa: 50+ banners and brand assets"],
    [1900, "Freelance: grew Fruik to 1,000+ followers in ~5 months"],
    [2760, "Blum: named Best Debut Performer"],
    [3080, "Blum: 140+ assets, 20% faster store launches"],
    [3900, "Trinity: MSc, awarded with Distinction"],
    [4560, "IBM: UX designer for enterprise AI tools"],
  ];
  const level = () => {
    const solids = GROUND_SEGS.map(([a, b]) => ({ x: a, y: GROUND, w: b - a, h: H - GROUND + 200, kind: "ground" }));
    const oneway = [
      { x: 360, y: GROUND - 120, w: 120 }, { x: 1240, y: GROUND - 140, w: 180 },
      { x: 2020, y: GROUND - 130, w: 120 }, { x: 2180, y: GROUND - 230, w: 120 },
      { x: 3600, y: GROUND - 270, w: 240 }, { x: 4780, y: GROUND - 140, w: 180 },
    ];
    const blocks = [{ x: 2900, y: GROUND - 44, w: 48, h: 44 }, { x: 4960, y: GROUND - 44, w: 48, h: 44 }, { x: 4960, y: GROUND - 88, w: 48, h: 44 }];
    blocks.forEach((b) => solids.push({ ...b, kind: "block" }));
    const bulbs = FACTS.map(([x, fact]) => ({ x, y: GROUND - 175, w: 44, h: 44, fact, hit: false, bump: 0 }));
    bulbs.forEach((b) => solids.push({ x: b.x, y: b.y, w: b.w, h: b.h, kind: "bulb", ref: b }));
    const ladders = [{ x: 3700, y: GROUND - 270, w: 40, h: 270 }];
    const tools = [
      [250, GROUND - 60, "wrench"], [400, GROUND - 165, "screwdriver"], [1000, GROUND - 60, "hammer"],
      [1300, GROUND - 185, "wrench"], [2060, GROUND - 175, "screwdriver"], [2220, GROUND - 275, "hammer"],
      [3150, GROUND - 60, "wrench"], [3740, GROUND - 315, "screwdriver"], [3800, GROUND - 315, "hammer"],
      [4850, GROUND - 185, "wrench"],
    ].map(([x, y, kind]) => ({ x, y, kind, taken: false }));
    const enemies = [
      [1050, 870, 1440, "ladybug"], [1800, 1660, 2380, "caterpillar"], [2700, 2560, 2880, "ladybug"],
      [3150, 2960, 3280, "caterpillar"], [4000, 3440, 4200, "ladybug"], [4600, 4380, 4940, "caterpillar"],
    ].map(([x, a, b, kind]) => {
      const [w, h] = kind === "ladybug" ? [42, 36] : [48, 38];
      return { x, y: GROUND - h, w, h, a, b: b - w, vx: kind === "ladybug" ? -70 : -50, kind, dead: 0 };
    });
    return { solids, oneway, bulbs, ladders, tools, enemies };
  };

  // ------------------------------------------------------------------ state
  let dlg, canvas, ctx, panel, toastEl, raf = 0, last = 0, acc = 0;
  let L, P, cam, state = "title", lives, toast = null, checkpoint;
  const keys = { left: false, right: false, up: false, down: false, jump: false };
  let jumpPressed = 0;

  const reset = () => {
    L = level();
    lives = 3;
    checkpoint = 80;
    spawn();
  };
  const spawn = () => {
    P = { x: checkpoint, y: GROUND - 72, w: 34, h: 72, vx: 0, vy: 0, ground: false, coyote: 0, climb: false, face: 1, inv: 1.2, anim: 0 };
    cam = Math.max(0, P.x - W * 0.4);
  };
  const score = () => ({
    tools: L.tools.filter((t) => t.taken).length, toolsTotal: L.tools.length,
    bugs: L.enemies.filter((e) => e.dead).length, bugsTotal: L.enemies.length,
    facts: L.bulbs.filter((b) => b.hit).length, factsTotal: L.bulbs.length,
  });

  // ---------------------------------------------------------------- physics
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const GRAV = 2200, RUN = 270, ACC = 2400, JUMP = 830; // jump apex ≈ 156px, so every platform is reachable

  const step = (dt) => {
    // input
    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (dir) P.face = dir;
    P.inv = Math.max(0, P.inv - dt);
    jumpPressed = Math.max(0, jumpPressed - dt);
    const ladder = L.ladders.find((l) => overlap({ x: P.x + 10, y: P.y, w: P.w - 20, h: P.h + 2 }, l));

    if (!P.climb && ladder && (keys.up || (keys.down && !P.ground) || (keys.down && P.y + P.h <= ladder.y + 4))) {
      P.climb = true;
      P.x = ladder.x + ladder.w / 2 - P.w / 2;
      P.vx = 0;
    }
    if (P.climb) {
      if (!ladder) P.climb = false;
      else if (jumpPressed && !keys.up) {
        P.climb = false;
        P.vy = -JUMP * 0.7;
        jumpPressed = 0;
      } else {
        P.vy = ((keys.down ? 1 : 0) - (keys.up ? 1 : 0)) * 170;
        P.vx = 0;
        if (P.vy) P.anim += dt;
        P.y += P.vy * dt;
        if (P.y + P.h < ladder.y) { // climbed out at the top: stand on the platform
          P.y = ladder.y - P.h;
          P.climb = false;
          P.vy = 0;
        }
        if (P.y + P.h > ladder.y + ladder.h) { // reached the bottom
          P.y = ladder.y + ladder.h - P.h;
          P.climb = false;
        }
        return afterMove(dt);
      }
    }

    // horizontal
    const target = dir * RUN;
    P.vx += Math.sign(target - P.vx) * Math.min(Math.abs(target - P.vx), ACC * dt * (P.ground ? 1 : 0.7));
    P.x += P.vx * dt;
    P.x = Math.max(0, Math.min(WORLD - P.w, P.x));
    for (const s of L.solids) {
      if (!overlap(P, s)) continue;
      if (P.vx > 0) P.x = s.x - P.w;
      else if (P.vx < 0) P.x = s.x + s.w;
      P.vx = 0;
    }
    if (P.ground && dir) P.anim += dt;

    // jump (with coyote time and a short input buffer)
    P.coyote = P.ground ? 0.1 : Math.max(0, P.coyote - dt);
    if (jumpPressed && (P.ground || P.coyote > 0)) {
      P.vy = -JUMP;
      P.ground = false;
      P.coyote = 0;
      jumpPressed = 0;
    }
    if (!keys.jump && !keys.up && P.vy < -260) P.vy *= 0.86; // short hop when the key is released early

    // vertical
    P.vy = Math.min(P.vy + GRAV * dt, 1100);
    const prevBottom = P.y + P.h;
    P.y += P.vy * dt;
    P.ground = false;
    for (const s of L.solids) {
      if (!overlap(P, s)) continue;
      if (P.vy > 0) {
        P.y = s.y - P.h;
        P.ground = true;
      } else if (P.vy < 0) {
        P.y = s.y + s.h;
        if (s.kind === "bulb" && !s.ref.hit) {
          s.ref.hit = true;
          s.ref.bump = 0.25;
          showToast(s.ref.fact);
        }
      }
      P.vy = 0;
    }
    for (const o of L.oneway) {
      if (P.vy >= 0 && prevBottom <= o.y + 1 && P.y + P.h >= o.y && P.x + P.w > o.x + 4 && P.x < o.x + o.w - 4 && !keys.down) {
        P.y = o.y - P.h;
        P.vy = 0;
        P.ground = true;
      }
    }
    afterMove(dt);
  };

  const afterMove = (dt) => {
    // tools
    for (const t of L.tools) {
      if (!t.taken && overlap(P, { x: t.x - 18, y: t.y - 18, w: 36, h: 36 })) t.taken = true;
    }
    // enemies
    for (const e of L.enemies) {
      if (e.dead) {
        e.dead += dt;
        continue;
      }
      e.x += e.vx * dt;
      if (e.x < e.a || e.x > e.b) {
        e.vx *= -1;
        e.x = Math.max(e.a, Math.min(e.b, e.x));
      }
      if (!overlap(P, e)) continue;
      if (P.vy > 0 && P.y + P.h - e.y < 26) { // landed on top: bug fixed
        e.dead = 0.001;
        P.vy = -480;
      } else if (!P.inv) hurt(Math.sign(P.x - e.x) || -1);
    }
    for (const b of L.bulbs) b.bump = Math.max(0, b.bump - dt);
    // checkpoints
    for (const [x] of ZONES) if (P.x > x + 20) checkpoint = Math.max(checkpoint, x + 40);
    // fell in a pit
    if (P.y > H + 80) {
      loseLife();
      if (state === "play") spawn();
    }
    // flag
    if (P.x + P.w > FLAG_X + 10) finish("win");
    // camera
    const want = Math.max(0, Math.min(WORLD - W, P.x - W * 0.4));
    cam += (want - cam) * Math.min(1, dt * 8);
    if (toast) {
      toast.t -= dt;
      if (toast.t <= 0) hideToast();
    }
  };

  const hurt = (dir) => {
    P.inv = 1.5;
    P.vx = dir * 300;
    P.vy = -420;
    loseLife();
  };
  const loseLife = () => {
    lives -= 1;
    if (lives <= 0) finish("over");
  };

  // ------------------------------------------------------------------- draw
  // trim: source pixels to skip at top/bottom (the strips have light edge rows)
  const tileX = (im, x0, y, w, h, trim = 0) => {
    if (!im.naturalWidth) return;
    const sh = im.naturalHeight - trim * 2;
    const tw = (im.naturalWidth * h) / sh;
    for (let x = x0; x < x0 + w; x += tw) {
      const dw = Math.min(tw, x0 + w - x);
      ctx.drawImage(im, 0, trim, (dw / tw) * im.naturalWidth, sh, x, y, dw, h);
    }
  };
  const parallax = (im, speed, y, h) => {
    if (!im.naturalWidth) return;
    const tw = (im.naturalWidth * h) / im.naturalHeight;
    let x = -((cam * speed) % tw);
    for (; x < W; x += tw) ctx.drawImage(im, x, y, tw, h);
  };
  const sprite = (key, cx, foot, h, flip) => {
    const im = img[key];
    if (!im || !im.naturalWidth) return;
    const [sx, sy, sw, sh] = CROP[key];
    const w = (sw * h) / sh;
    ctx.save();
    if (flip) {
      ctx.translate(cx, 0);
      ctx.scale(-1, 1);
      ctx.translate(-cx, 0);
    }
    ctx.drawImage(im, sx, sy, sw, sh, cx - w / 2, foot - h, w, h);
    ctx.restore();
  };
  const font = (px) => `700 ${px}px "Pixelify Sans", monospace`;

  const draw = () => {
    ctx.fillStyle = "#96bcd6";
    ctx.fillRect(0, 0, W, H);
    parallax(img.sky, 0.08, 40, 200);
    parallax(img.mountains, 0.2, 200, 190);
    parallax(img.bushes, 0.45, 340, 80);
    ctx.fillStyle = "rgba(207, 219, 230, .22)";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-Math.round(cam), 0);
    // zone signs
    ctx.textBaseline = "middle";
    for (const [x, label] of ZONES) {
      ctx.font = font(15);
      const tw = ctx.measureText(label).width + 20;
      ctx.fillStyle = "#6b4426";
      ctx.fillRect(x + tw / 2 - 4, GROUND - 70, 8, 70);
      ctx.fillStyle = "#8a5a33";
      ctx.fillRect(x, GROUND - 104, tw, 34);
      ctx.strokeStyle = "#3b2414";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, GROUND - 104, tw, 34);
      ctx.fillStyle = "#fdf6ea";
      ctx.fillText(label, x + 10, GROUND - 86);
    }
    // ground
    for (const [a, b] of GROUND_SEGS) {
      tileX(img.dirt, a, GROUND + 18, b - a, 56, 4);
      tileX(img.dirt, a, GROUND + 72, b - a, 56, 4);
      tileX(img.grass, a, GROUND - 4, b - a, 30);
    }
    // ladders
    for (const l of L.ladders) {
      if (!img.ladder.naturalWidth) continue;
      for (let y = l.y; y < l.y + l.h; y += 17.5) ctx.drawImage(img.ladder, l.x, y, 40, Math.min(17.5, l.y + l.h - y));
    }
    // one-way platforms
    for (const o of L.oneway) for (let x = o.x; x < o.x + o.w; x += 60) ctx.drawImage(img.platform, x, o.y - 4, Math.min(60, o.x + o.w - x), 56);
    for (const s of L.solids) if (s.kind === "block") ctx.drawImage(img.block, s.x, s.y, s.w, s.h);
    for (const b of L.bulbs) {
      const lift = b.bump ? Math.sin((b.bump / 0.25) * Math.PI) * 10 : 0;
      ctx.globalAlpha = b.hit ? 0.55 : 1;
      ctx.drawImage(img.bulb, b.x, b.y - lift, b.w, b.h);
      ctx.globalAlpha = 1;
    }
    // tools (gentle bob)
    const t = performance.now() / 1000;
    for (const tool of L.tools) if (!tool.taken) ctx.drawImage(img[tool.kind], tool.x - 17, tool.y - 17 + Math.sin(t * 3 + tool.x) * 3, 34, 34);
    // flag
    ctx.drawImage(img.flag, FLAG_X, GROUND - 120, 75, 120);
    ctx.font = font(15);
    ctx.fillStyle = "#1d1d1f";
    ctx.fillText("Next level: your team", FLAG_X - 40, GROUND - 140);
    // enemies (sprites face left)
    for (const e of L.enemies) {
      if (e.dead > 0.35) continue;
      const squash = e.dead ? 0.35 : 1;
      const bob = e.dead ? 0 : Math.abs(Math.sin(t * 8 + e.x / 30)) * 2;
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h);
      if (e.vx > 0) ctx.scale(-1, 1);
      ctx.drawImage(img[e.kind], -e.w / 2, -e.h * squash - bob, e.w, e.h * squash);
      ctx.restore();
    }
    // player
    if (!(P.inv && Math.floor(P.inv * 12) % 2)) {
      const cx = P.x + P.w / 2, foot = P.y + P.h;
      if (P.climb) sprite("climb" + (1 + (Math.floor(P.anim * 8) % 4)), cx, foot, 86);
      else if (!P.ground) sprite("jump", cx, foot, 84, P.face < 0);
      else if (Math.abs(P.vx) > 20) sprite(Math.floor(P.anim * 8) % 2 ? "run2" : "run1", cx, foot + 2, 82, P.face < 0);
      else sprite("stand", cx, foot, 78);
    }
    ctx.restore();

    // HUD
    const s = score();
    ctx.font = font(18);
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(253, 246, 234, .92)";
    ctx.fillRect(12, 12, 520, 36);
    ctx.strokeStyle = "#1d1d1f";
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, 520, 36);
    ctx.fillStyle = "#1d1d1f";
    ctx.fillText(`Lives ${"♥".repeat(Math.max(0, lives))}   Tools ${s.tools}/${s.toolsTotal}   Bugs squashed ${s.bugs}/${s.bugsTotal}`, 24, 21);
  };

  // ------------------------------------------------------------- game loop
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (state === "play") {
      acc += dt;
      while (acc >= 1 / 120) {
        step(1 / 120);
        acc -= 1 / 120;
        if (state !== "play") break;
      }
    }
    draw();
  };

  // ------------------------------------------------------------ UI / screens
  const showToast = (text) => {
    toast = { t: 3.2 };
    toastEl.textContent = "💡 " + text;
    toastEl.classList.add("is-on");
  };
  const hideToast = () => {
    toast = null;
    toastEl.classList.remove("is-on");
  };
  const showPanel = (html, focusSel) => {
    panel.innerHTML = html;
    panel.hidden = false;
    const f = panel.querySelector(focusSel || "button");
    if (f) f.focus();
  };
  const controlsHelp = coarse
    ? "Use the on-screen buttons: ◀ ▶ to run, ▲ to jump or climb, ▼ to climb down."
    : "<kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd> to run · <kbd>Space</kbd> or <kbd>↑</kbd> to jump · <kbd>↑</kbd> <kbd>↓</kbd> on ladders · <kbd>P</kbd> to pause · <kbd>Esc</kbd> to exit";
  const title = () => {
    state = "title";
    showPanel(`<p class="eyebrow">Bonus level</p><h2>Anvita's career run</h2>
      <p>Run from 2020 to today. Collect the tools, jump on bugs to squash them, and hit the lightbulb blocks for facts from the journey.</p>
      <p class="game__keys">${controlsHelp}</p>
      <div class="game__actions"><button class="btn btn--primary" data-act="start">Start</button></div>`);
  };
  const start = () => {
    reset();
    panel.hidden = true;
    hideToast();
    state = "play";
    canvas.focus();
  };
  const pause = () => {
    if (state !== "play") return;
    state = "paused";
    showPanel(`<h2>Paused</h2><div class="game__actions"><button class="btn btn--primary" data-act="resume">Resume</button><button class="btn btn--secondary" data-act="restart">Restart</button></div>`);
  };
  const resume = () => {
    panel.hidden = true;
    state = "play";
    last = performance.now();
    canvas.focus();
  };
  const finish = (how) => {
    if (state !== "play") return;
    state = how;
    hideToast();
    const s = score();
    const stats = `<ul class="game__stats"><li><b>${s.tools}/${s.toolsTotal}</b> tools</li><li><b>${s.bugs}/${s.bugsTotal}</b> bugs squashed</li><li><b>${s.facts}/${s.factsTotal}</b> facts found</li></ul>`;
    if (how === "win") {
      showPanel(`<p class="eyebrow">Level complete</p><h2>Next level: your team.</h2>${stats}
        <p>Thanks for playing. If you're hiring a product designer, let's talk.</p>
        <div class="game__actions"><a class="btn btn--primary" href="${ROOT}contact.html">Let's talk</a><button class="btn btn--secondary" data-act="restart">Play again</button></div>`, "a");
    } else {
      showPanel(`<p class="eyebrow">Game over</p><h2>Continue?</h2>${stats}
        <div class="game__actions"><button class="btn btn--primary" data-act="restart">Try again</button><button class="btn btn--secondary" data-act="close">Exit</button></div>`);
    }
  };

  const build = () => {
    dlg = document.createElement("dialog");
    dlg.className = "game";
    dlg.setAttribute("aria-label", "Bonus level game");
    dlg.innerHTML = `
      <div class="game__bar"><span class="eyebrow">Bonus level</span>
        <div><button class="game__icon" data-act="pause" aria-label="Pause">❚❚</button><button class="game__icon" data-act="close" aria-label="Close game">✕</button></div></div>
      <div class="game__stage">
        <canvas width="${W}" height="${H}" tabindex="0" aria-label="Platformer game. ${coarse ? "Use the on-screen buttons." : "Use the arrow keys to move and Space to jump."}"></canvas>
        <p class="game__toast" role="status" aria-live="polite"></p>
        <div class="game__panel" hidden></div>
      </div>
      <div class="game__pad" ${coarse ? "" : "hidden"}>
        <div><button data-key="left" aria-label="Run left">◀</button><button data-key="right" aria-label="Run right">▶</button></div>
        <div><button data-key="down" aria-label="Climb down">▼</button><button data-key="up" aria-label="Jump or climb up">▲</button></div>
      </div>`;
    document.body.append(dlg);
    canvas = dlg.querySelector("canvas");
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    panel = dlg.querySelector(".game__panel");
    toastEl = dlg.querySelector(".game__toast");

    dlg.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "start" || act === "restart") start();
      else if (act === "resume") resume();
      else if (act === "pause") (state === "paused" ? resume() : pause());
      else if (act === "close") dlg.close();
    });
    dlg.addEventListener("close", stop);

    // touch pad
    dlg.querySelectorAll("[data-key]").forEach((b) => {
      const k = b.dataset.key;
      const down = (e) => {
        e.preventDefault();
        keys[k] = true;
        if (k === "up") {
          keys.jump = true;
          jumpPressed = 0.12;
        }
      };
      const up = () => {
        keys[k] = false;
        if (k === "up") keys.jump = false;
      };
      b.addEventListener("pointerdown", down);
      ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => b.addEventListener(ev, up));
    });
  };

  // keyboard (capture, so the site's own letter shortcuts don't fire while playing)
  const KEYMAP = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", " ": "jump" };
  const onKey = (e) => {
    if (!dlg || !dlg.open) return;
    e.stopPropagation();
    const down = e.type === "keydown";
    if (e.key === "Escape") return;
    if (down && (e.key === "p" || e.key === "P")) return state === "paused" ? resume() : pause();
    if (down && e.key === "Enter" && state === "title" && document.activeElement === canvas) return start();
    const k = KEYMAP[e.key];
    if (!k) return;
    if (state === "play" || state === "paused") e.preventDefault();
    keys[k] = down;
    if ((k === "jump" || k === "up") && down && !e.repeat) jumpPressed = 0.12;
  };
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("keyup", onKey, true);
  document.addEventListener("visibilitychange", () => document.hidden && pause());
  window.addEventListener("blur", pause);

  const stop = () => {
    cancelAnimationFrame(raf);
    Object.keys(keys).forEach((k) => (keys[k] = false));
    document.documentElement.style.overflow = "";
    state = "title";
  };

  window.BonusLevel = {
    // read-only snapshot, used by automated checks
    _snapshot: () => ({ state, lives, P: { ...P }, score: L ? score() : null, enemies: L ? L.enemies.map(({ x, y, w, vx, dead }) => ({ x, y, w, vx, dead })) : [] }),
    _teleport: (x, y) => Object.assign(P, { x, y, vx: 0, vy: 0, climb: false }),
    async open() {
      if (!dlg) build();
      await load();
      reset();
      dlg.showModal();
      document.documentElement.style.overflow = "hidden";
      title();
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    },
  };
})();
