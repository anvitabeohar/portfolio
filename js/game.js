// Bonus level: an original side-scrolling platformer starring Anvita's pixel character.
// Loaded on demand (only when someone presses Play). Exposes window.BonusLevel.open().
(() => {
  const ROOT = document.body.dataset.root || "";
  const A = ROOT + "assets/images/";
  const W = 960, H = 540, GROUND = 460;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  // ---------------------------------------------------------------- assets
  const SRC = {
    // Anvita's character: one sheet, one scale (see PSCALE)
    run1: A + "player/run-1.webp", run2: A + "player/run-2.webp", run3: A + "player/run-3.webp", run4: A + "player/run-4.webp", run5: A + "player/run-5.webp",
    stand: A + "player/front-1.webp", jump: A + "player/jump.webp",
    climb1: A + "player/climb-1.webp", climb2: A + "player/climb-2.webp", climb3: A + "player/climb-3.webp",
    sky: A + "game/bg-sky.webp", mountains: A + "game/bg-mountains.webp", bushes: A + "game/bg-bushes.webp",
    grass: A + "game/bg-grass.webp", dirt: A + "game/bg-dirt.webp",
    platform: A + "game/platform-1.webp", block: A + "game/block.webp", bulb: A + "game/bulb-block.webp",
    ladder: A + "game/ladder-tile.webp", flag: A + "game/flag.webp",
    ladybug: A + "game/ladybug.webp", caterpillar: A + "game/caterpillar.webp",
    wrench: A + "game/wrench.webp", screwdriver: A + "game/screwdriver.webp", hammer: A + "game/hammer.webp",
    clover: A + "game/clover.webp", hudScore: A + "game/hud-score.webp", hudDigits: A + "game/hud-digits.webp",
    hudHearts: A + "game/hud-hearts.webp", heartEmpty: A + "game/hud-heart-empty.webp",
    door: A + "game/door.webp",
    p2: A + "home/pov-recruiter.webp", p3: A + "home/pov-hiring-manager.webp", p4: A + "home/pov-designer.webp",
  };
  const POINTS = { clover: 10, tool: 50, bug: 100 };
  // visible part of each character sprite (the walk frames have padding)
  const PSCALE = 0.44; // player sheet pixels -> game pixels (run frames ≈ 84px tall)
  const CROP = {
    // player frames are already trimmed, so they use the whole image
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
  const GROUND_SEGS = [[0, 700], [810, 1500], [1610, 2400], [2510, 3300], [3420, 4220], [4330, 5800]];
  const WORLD = 5800, FLAG_X = 5280, DOOR_X = 5390, SIGN_X = 5060;
  // [x, fact, clovers that pop out]; bigger milestones give more clovers
  const FACTS = [
    [1080, "Ittisa: 50+ banners and brand assets", 2],
    [1900, "Freelance: grew Fruik to 1,000+ followers in ~5 months", 3],
    [2760, "Blum: named Best Debut Performer", 5],
    [3080, "Blum: 140+ assets, 20% faster store launches", 4],
    [3900, "Trinity: MSc, awarded with Distinction", 6],
    [4560, "IBM: UX designer for enterprise AI tools", 4],
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
    const bulbs = FACTS.map(([x, fact, clovers]) => ({ x, y: GROUND - 175, w: 44, h: 44, fact, clovers, hit: false, bump: 0 }));
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
    return { solids, oneway, bulbs, ladders, tools, enemies, pops: [], clovers: 0 };
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
  const score = () => {
    const s = {
      tools: L.tools.filter((t) => t.taken).length, toolsTotal: L.tools.length,
      bugs: L.enemies.filter((e) => e.dead).length, bugsTotal: L.enemies.length,
      facts: L.bulbs.filter((b) => b.hit).length, factsTotal: L.bulbs.length,
      clovers: L.clovers, cloversTotal: L.bulbs.reduce((n, b) => n + b.clovers, 0),
    };
    s.points = s.clovers * POINTS.clover + s.tools * POINTS.tool + s.bugs * POINTS.bug;
    return s;
  };

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
          popClovers(s.ref);
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

  // clovers fan out of the top of a bumped block, then count toward the score
  const popClovers = (b) => {
    const n = b.clovers;
    for (let i = 0; i < n; i++) {
      const spread = n > 1 ? i / (n - 1) - 0.5 : 0;
      L.pops.push({ x: b.x + b.w / 2, y: b.y, vx: spread * 260, vy: -560 - Math.random() * 90, t: 0, delay: i * 0.06 });
    }
    L.clovers += n;
  };

  const updatePops = (dt, life = 0.8) => {
    for (const c of L.pops) {
      if ((c.delay -= dt) > 0) continue;
      c.t += dt;
      c.vy += 1500 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
    }
    L.pops = L.pops.filter((c) => c.t < (c.life || life));
  };

  // Finale: controls lock, she hops twice, clovers burst from the door, and the team appears
  let cel = 0;
  const startCelebration = () => {
    if (state !== "play") return;
    state = "celebrate";
    cel = 0;
    P.inv = 0; // stop any damage blink so she's visible for the finale
    P.vx = 0;
    P.vy = -620;
    P.climb = false;
    hideToast();
    for (let i = 0; i < 18; i++) {
      L.pops.push({ x: DOOR_X + 52, y: GROUND - 90, vx: (Math.random() - 0.5) * 560, vy: -420 - Math.random() * 420, t: 0, delay: 0.15 + i * 0.035, life: 1.1 });
    }
  };
  const celebrate = (dt) => {
    cel += dt;
    // camera glides to centre the door so the whole party is in view
    const target = Math.min(WORLD - W, DOOR_X + 52 - W / 2);
    cam += (target - cam) * Math.min(1, dt * 4);
    P.vy += GRAV * dt;
    P.y += P.vy * dt;
    if (P.y + P.h >= GROUND) {
      P.y = GROUND - P.h;
      P.vy = cel < 0.9 ? -520 : 0;
      P.ground = true;
    } else P.ground = false;
    updatePops(dt);
    if (cel > 2.4) finish("win");
  };

  const afterMove = (dt) => {
    updatePops(dt);
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
    // flag: start the finale
    if (P.x + P.w > FLAG_X + 10) startCelebration();
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
    const [sx, sy, sw, sh] = CROP[key] || [0, 0, im.naturalWidth, im.naturalHeight];
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
    // finale: sign, flag, and the glowing next-level door
    drawFinale(t);
    // popping clovers
    for (const c of L.pops) {
      if (c.delay > 0) continue;
      ctx.globalAlpha = c.t > 0.55 ? Math.max(0, 1 - (c.t - 0.55) / 0.25) : 1;
      const s = 30 + Math.min(1, c.t * 6) * 4;
      ctx.drawImage(img.clover, c.x - s / 2, c.y - s, s, s * 1.15);
      ctx.globalAlpha = 1;
    }
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
      const ph = (k) => (img[k].naturalHeight || 190) * PSCALE; // same pixel scale for every pose
      const k = P.climb ? "climb" + (1 + (Math.floor(P.anim * 6) % 3))
        : !P.ground ? "jump"
        : Math.abs(P.vx) > 20 ? "run" + (1 + (Math.floor(P.anim * 10) % 5))
        : "stand";
      sprite(k, cx, foot + 1, ph(k), !P.climb && k !== "stand" && P.face < 0);
    }
    ctx.restore();

    // HUD: hearts plank (lives) and star plank (score in Anvita's pixel digits)
    drawHud(score());
  };

  const easeBack = (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
  const drawFinale = (t) => {
    // wooden sign on two posts (blank plank from the HUD art)
    const sk = 0.38, sw = 463 * sk, sh = 216 * sk, sy = GROUND - 190;
    ctx.fillStyle = "#6b4426";
    ctx.fillRect(SIGN_X + sw * 0.25, sy + sh - 6, 8, GROUND - sy - sh + 6);
    ctx.fillRect(SIGN_X + sw * 0.7, sy + sh - 6, 8, GROUND - sy - sh + 6);
    ctx.drawImage(img.hudScore, SIGN_X, sy, sw, sh);
    ctx.fillStyle = "#3b2414";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = font(13);
    ctx.fillText("NEXT LEVEL", SIGN_X + 292 * sk, sy + sh * 0.4);
    ctx.font = font(17);
    ctx.fillText("YOUR TEAM →", SIGN_X + 292 * sk, sy + sh * 0.62);
    ctx.textAlign = "start";
    // flag
    ctx.drawImage(img.flag, FLAG_X, GROUND - 120, 75, 120);
    // door glow pulses, and flares during the finale
    const ending = state === "celebrate" || state === "win";
    const glow = 0.32 + 0.12 * Math.sin(t * 3) + (ending ? 0.4 : 0);
    const gx = DOOR_X + 52, gy = GROUND - 58;
    const grad = ctx.createRadialGradient(gx, gy, 8, gx, gy, ending ? 170 : 120);
    grad.addColorStop(0, `rgba(255, 210, 110, ${glow})`);
    grad.addColorStop(1, "rgba(255, 210, 110, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(gx - 180, gy - 180, 360, 360);
    ctx.drawImage(img.door, DOOR_X, GROUND - 113, 104, 113);
    // the team appears above the door, one by one
    if (!ending) return;
    const team = [img.p2, img.p3, img.p4];
    team.forEach((pic, i) => {
      const k = Math.min(1, Math.max(0, (cel - 0.55 - i * 0.22) / 0.28));
      if (!k || !pic.naturalWidth) return;
      const s = easeBack(k), r = 28 * s;
      const x = gx + (i - 1) * 66, y = GROUND - 190 + Math.sin(t * 3 + i) * 4;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(pic, x - r * 0.95, y - r * 0.95, r * 1.9, r * 1.9);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#1d1d1f";
      ctx.stroke();
    });
    if (cel > 1.35) {
      ctx.font = font(18);
      ctx.textAlign = "center";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#fdf6ea";
      ctx.strokeText("Join the party?", gx, GROUND - 245);
      ctx.fillStyle = "#1d1d1f";
      ctx.fillText("Join the party?", gx, GROUND - 245);
      ctx.textAlign = "start";
    }
  };

  const HEARTS_X = [78, 180, 282]; // left edge of each heart inside the hearts plank (source pixels)
  const drawHud = (s) => {
    const hk = 56 / 202; // hearts plank: 452x202 source -> 56px tall
    ctx.drawImage(img.hudHearts, 12, 10, 452 * hk, 56);
    for (let i = Math.max(0, lives); i < 3; i++) ctx.drawImage(img.heartEmpty, 12 + HEARTS_X[i] * hk, 10 + 74 * hk, 82 * hk, 78 * hk);
    const sk = 60 / 216; // score plank: 463x216 source -> 60px tall
    const px = 12 + 452 * hk + 10;
    ctx.drawImage(img.hudScore, px, 8, 463 * sk, 60);
    const digits = String(Math.min(9999, s.points)).padStart(4, "0");
    const cw = 47, ch = img.hudDigits.naturalHeight || 67;
    [...digits].forEach((d, i) => ctx.drawImage(img.hudDigits, +d * cw, 0, cw, ch, px + (178 + i * cw) * sk, 8 + 76 * sk, cw * sk, ch * sk));
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
    } else if (state === "celebrate") celebrate(dt);
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
      <p>Run from 2020 to today. Collect tools, jump on bugs to squash them, and bump the lightbulb blocks for clovers and facts from the journey.</p>
      <p class="game__keys">${controlsHelp}</p>
      <p class="game__rotate">Tip: turn your phone sideways for a bigger view</p>
      <div class="game__actions"><button class="btn btn--primary" data-act="start">Start</button></div>`);
  };
  const start = () => {
    cel = 0;
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
  const PARTY = [["recruiter", "p2", "P2 · Recruiter"], ["hiring-manager", "p3", "P3 · Hiring manager"], ["designer", "p4", "P4 · Designer"]];
  const finish = (how) => {
    if (state !== "play" && state !== "celebrate") return;
    state = how;
    hideToast();
    const s = score();
    // badge, score and stats share one compact row; sizes are set in the HTML so the badge can't blow up
    const stats = `<div class="game__result">
        <img class="game__badge" src="${A}game/hud-star.webp" width="52" height="47" alt="" />
        <p class="game__points"><b>${s.points}</b><span>points</span></p>
        <ul class="game__stats"><li><b>${s.clovers}/${s.cloversTotal}</b> clovers</li><li><b>${s.tools}/${s.toolsTotal}</b> tools</li><li><b>${s.bugs}/${s.bugsTotal}</b> bugs</li></ul>
      </div>`;
    if (how === "win") {
      const party = PARTY.map(([id, pic, label]) => `<li><a href="${ROOT}speedrun.html#${id}"><img src="${img[pic].src}" width="44" height="44" alt="" /><span>${label}</span></a></li>`).join("");
      showPanel(`<p class="eyebrow">Level complete</p><h2>Ready for co-op mode?</h2>${stats}
        <p>That's my journey so far. The next level is one we build together.</p>
        <div class="game__actions"><a class="btn btn--primary" href="${ROOT}contact.html">Let's talk</a><button class="btn btn--secondary" data-act="restart">Play again</button></div>
        <p class="game__party-label">Pick your role for the 60-second recap</p>
        <ul class="game__party">${party}</ul>`, "a");
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
