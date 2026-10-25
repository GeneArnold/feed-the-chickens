// One day on the farm. Tap a chicken and Uncle Bob walks over and feeds it; tap the wolf and he
// runs over and punches it; tap the feed bin to refill the bucket; tap anywhere else to walk there.
// The day ends at sundown (on to the next day) or when the last heart is gone (game over).
import * as audio from "../audio.js";
import * as sayings from "../sayings.js";
import * as store from "../storage.js";
import { Chicken } from "../chicken.js";
import { Farmer } from "../farmer.js";
import { LEVELS, paintLevel } from "../levels.js";
import { CLOSE_CALL, EGGS_PER_BASKET, MAX_HEARTS, POINTS, START_HEARTS, dayRules, drainAt, feedPoints, sceneryIndex, sundown } from "../rules.js";
import { Wolf } from "../wolf.js";
import { DEPTH, H, W, bubble, fingerAt, floatText, setupCamera, text } from "../ui.js";

const NAMES = ["Henrietta", "Gertrude", "Nugget", "Dolly", "Peep", "Clucky", "Betty", "Drumstick", "Mabel", "Omelette", "Goldie", "Pecky", "Daisy", "Ruby", "Biscuit", "Pearl"];
const EGG_MS = 10000;          // an egg left lying around this long is gone
const EGG_PICKUP = 46;         // Uncle Bob picks up an egg he walks this close to
const FULL = 85;               // a chicken this well fed doesn't want more (no scoop wasted)
const DRAG = 18;               // a finger moving this far is steering Uncle Bob, not tapping
const DEBUG = new URLSearchParams(location.search).has("debug");

export class PlayScene extends Phaser.Scene {
  constructor() {
    super("Play");
  }

  create({ day = 1, score = 0, hearts = START_HEARTS, stats = null } = {}) {
    setupCamera(this);
    this.day = day;
    this.score = score;
    this.hearts = hearts;
    this.stats = stats ? { ...stats } : { fed: 0, punched: 0, eggs: 0, lost: 0, basket: 0 };
    this.rules = dayRules(day);
    this.level = LEVELS[sceneryIndex(day, LEVELS.length)];
    this.phase = "play"; // play | sundown | gameover
    this.t = 0;
    this.lostToday = 0;
    this.lastSaidAt = 0;
    this.lastBubble = null;

    paintLevel(this, this.level).back.setDepth(DEPTH.ground);
    const { bin } = this.level;
    this.bin = this.add.image(bin.x, bin.y, "feedbin").setOrigin(0.5, 0.95).setDepth(DEPTH.onGround + bin.y / 10);
    text(this, bin.x, bin.y - 26, "FEED", 15, { color: "#fff3c4", strokeThickness: 4 }).setDepth(DEPTH.onGround + bin.y / 10 + 0.1);
    this.binArrow = text(this, bin.x, bin.y - 100, "▼", 34, { color: "#ffe066" }).setDepth(DEPTH.bars).setVisible(false);
    this.tweens.add({ targets: this.binArrow, y: bin.y - 86, duration: 350, yoyo: true, repeat: -1 });

    const names = Phaser.Utils.Array.Shuffle([...NAMES]);
    const n = this.rules.chickens;
    this.chickens = this.level.spots.slice(0, n).map(([x, y], i) => new Chicken(this, x, y, names[i], {
      // staggered, so they don't all get hungry at once
      weight: 100 - (i * 45) / n + Phaser.Math.Between(-4, 4),
      appetite: Phaser.Math.FloatBetween(0.85, 1.15),
    }));
    this.farmer = new Farmer(this, bin.x, Math.min(bin.y + 70, 900), this.rules.bucket);
    this.wolves = [];
    this.eggs = [];
    this.nextWolfAt = this.rules.wolfEvery ? this.rules.firstWolf : Infinity;

    this.feathers = this.add.particles(0, 0, "feather", {
      emitting: false, speed: { min: 60, max: 180 }, lifespan: 800, gravityY: 220,
      rotate: { min: 0, max: 360 }, scale: { min: 0.6, max: 1.1 }, alpha: { start: 1, end: 0 },
    }).setDepth(DEPTH.effects);
    this.makeWeather();
    this.makeDark();
    this.makeHud();
    if (DEBUG) this.drawDebug();

    // A tap feeds, punches or refills. Dragging a finger just walks Uncle Bob along under it.
    this.input.on("pointerdown", (p) => {
      audio.unlock();
      this.touch = { id: p.id, start: fingerAt(this, p), dragging: false };
    });
    this.input.on("pointermove", (p) => {
      const t = this.touch;
      if (!t || t.id !== p.id || this.phase !== "play") return;
      const at = fingerAt(this, p);
      if (!t.dragging && Math.hypot(at.x - t.start.x, at.y - t.start.y) < DRAG) return;
      t.dragging = true;
      this.walkTo(at);
    });
    const up = (p) => {
      const t = this.touch;
      if (!t || t.id !== p.id) return;
      this.touch = null;
      if (!t.dragging) this.tap(t.start);
    };
    this.input.on("pointerup", up);
    this.input.on("pointerupoutside", up);
    audio.play("rooster");
    const go = text(this, W / 2, H / 2, "GO!", 90, { color: "#ffe066" }).setDepth(DEPTH.overlay);
    this.tweens.add({ targets: go, scale: 1.5, alpha: 0, duration: 800, delay: 300, onComplete: () => go.destroy() });
  }

  // ---- input -------------------------------------------------------------------------------

  tap(p) {
    if (this.phase !== "play") return;
    this.tapMarker(p);
    const near = (list, r, lift) => {
      let best = null;
      let bestD = r;
      for (const o of list) {
        const d = Math.hypot(o.x - p.x, o.y - lift - p.y);
        if (d < bestD) {
          best = o;
          bestD = d;
        }
      }
      return best;
    };
    const wolf = near(this.wolves.filter((w) => w.punchable), 80, 30);
    if (wolf) return this.farmer.goTo({ kind: "wolf", ref: wolf });
    // An egg wins over the chicken beside it when the tap is nearer the egg.
    const egg = near(this.eggs, 50, 10);
    const chicken = near(this.chickens.filter((c) => c.alive), 60, 24);
    const dist = (o, lift) => Math.hypot(o.x - p.x, o.y - lift - p.y);
    if (egg && (!chicken || dist(egg, 10) <= dist(chicken, 24))) return this.farmer.goTo({ kind: "egg", ref: egg });
    if (chicken) {
      if (chicken.state === "carried" && chicken.wolf) return this.farmer.goTo({ kind: "wolf", ref: chicken.wolf });
      return this.farmer.goTo({ kind: "chicken", ref: chicken });
    }
    const { bin } = this.level;
    if (Math.hypot(bin.x - p.x, bin.y - 30 - p.y) < 66) return this.farmer.goTo({ kind: "bin", x: bin.x, y: bin.y + 20 });
    this.walkTo(p);
  }

  walkTo(p) {
    this.farmer.goTo({ kind: "ground", x: Phaser.Math.Clamp(p.x, 24, W - 24), y: Phaser.Math.Clamp(p.y + 10, 330, 930) });
  }

  tapMarker(p) {
    const ring = this.add.image(p.x, p.y, "ring").setDepth(DEPTH.effects).setScale(0.3).setAlpha(0.9);
    this.tweens.add({ targets: ring, scale: 0.8, alpha: 0, duration: 350, onComplete: () => ring.destroy() });
  }

  // ---- the day going by ----------------------------------------------------------------------

  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    const playing = this.phase === "play";
    if (playing) this.t += dt;
    const drain = playing ? drainAt(this.rules, this.t) : 0;

    for (const c of this.chickens) {
      c.update(dt, drain, time);
      if (playing && c.readyToLay(time)) this.layEgg(c, time);
    }

    if (playing && this.t >= this.nextWolfAt) {
      const [lo, hi] = this.rules.wolfEvery;
      this.nextWolfAt = this.t + Phaser.Math.FloatBetween(lo, hi);
      const active = this.wolves.filter((w) => w.punchable).length;
      const room = this.rules.maxWolves - active;
      if (room > 0 && this.t < this.rules.dayLength - 6) this.spawnWolves(Math.min(room, this.rules.pack));
    }
    for (const w of this.wolves) w.update(dt, time, this.chickens);
    this.wolves = this.wolves.filter((w) => w.state !== "gone");

    const goal = this.farmer.goal;
    if (goal?.kind === "wolf" && !goal.ref.punchable) this.farmer.goal = null;
    if (goal?.kind === "chicken" && !goal.ref.alive) this.farmer.goal = null;
    if (goal?.kind === "egg" && !this.eggs.includes(goal.ref)) this.farmer.goal = null;
    if (goal?.kind === "chicken" && goal.ref.state === "carried") this.farmer.goTo({ kind: "wolf", ref: goal.ref.wolf });
    const reached = this.farmer.update(dt, time, this.groundSpeed(this.farmer.x, this.farmer.y));
    if (reached && playing) this.arrive(reached);

    this.updateEggs(time);
    this.updateDark();
    this.updateHud();

    if (playing && (this.t >= this.rules.dayLength || !this.chickens.some((c) => c.alive))) this.endDay();
  }

  // Mud halves Uncle Bob's speed; some sceneries (snow) slow him a little everywhere.
  groundSpeed(x, y) {
    const inMud = this.level.mud.some((m) => ((x - m.x) / m.rx) ** 2 + ((y - m.y) / m.ry) ** 2 < 1);
    return (this.level.speed ?? 1) * (inMud ? 0.5 : 1);
  }

  arrive(goal) {
    if (goal.kind === "chicken") this.feed(goal.ref);
    else if (goal.kind === "wolf") this.punch(goal.ref);
    else if (goal.kind === "bin") this.refill();
  }

  feed(c) {
    if (c.state !== "ok") return;
    if (c.weight > FULL) {
      audio.play("cluck");
      floatText(this, c.x, c.y - 70, "I'M FULL!", "#ffffff", 20);
      return;
    }
    if (this.farmer.scoops <= 0) return this.bucketEmpty();
    this.farmer.scoops--;
    const close = c.weight < CLOSE_CALL;
    const points = feedPoints(c.weight);
    this.farmer.toss(c.x);
    this.tossCorn(c);
    c.feed();
    audio.play("feed");
    this.stats.fed++;
    this.addScore(points, c.x, c.y - 70, close ? `CLOSE CALL! +${points}` : `+${points}`, close ? "#7CFC9A" : "#ffe066");
    if (close) this.say("close");
    else if (Math.random() < 0.3) this.say("feed", { quiet: true });
    if (this.farmer.scoops === 0) this.binArrow.setVisible(true);
  }

  tossCorn(c) {
    for (let i = 0; i < 8; i++) {
      const k = this.add.image(this.farmer.x, this.farmer.y - 40, "corn").setDepth(DEPTH.effects);
      this.tweens.add({
        targets: k, x: c.x + Phaser.Math.Between(-20, 20), y: c.y + Phaser.Math.Between(-6, 8),
        duration: 220 + i * 20, ease: "Quad.easeOut",
        onComplete: () => this.tweens.add({ targets: k, alpha: 0, delay: 400, duration: 300, onComplete: () => k.destroy() }),
      });
    }
  }

  bucketEmpty() {
    audio.play("empty");
    this.binArrow.setVisible(true);
    this.tweens.add({ targets: this.bucketIcon, scale: 1.4, duration: 120, yoyo: true, repeat: 2 });
    this.say("empty", { quiet: true });
  }

  refill() {
    this.farmer.scoops = this.rules.bucket;
    this.binArrow.setVisible(false);
    audio.play("refill");
    floatText(this, this.level.bin.x, this.level.bin.y - 80, "FULL BUCKET!", "#fff3c4", 24);
  }

  punch(wolf) {
    if (!wolf.punchable) return;
    this.farmer.punch(wolf.x);
    const dropped = wolf.punch();
    audio.play("punch");
    this.cameras.main.shake(120, 0.004);
    const pow = this.add.image((wolf.x + this.farmer.x) / 2, wolf.y - 40, "pow").setDepth(DEPTH.effects).setScale(0.2);
    const powText = text(this, pow.x, pow.y, "POW!", 26, { color: "#c0392b", stroke: "#ffffff", strokeThickness: 5 }).setDepth(DEPTH.effects);
    this.tweens.add({ targets: [pow, powText], scale: 1.1, duration: 140, ease: "Back.easeOut" });
    this.tweens.add({ targets: [pow, powText], alpha: 0, delay: 450, duration: 250, onComplete: () => { pow.destroy(); powText.destroy(); } });
    this.feathers.explode(dropped ? 10 : 0, wolf.x, wolf.y - 30);
    this.stats.punched++;
    const points = POINTS.punch + (dropped ? POINTS.rescue : 0);
    this.addScore(points, wolf.x, wolf.y - 90, dropped ? `RESCUE! +${points}` : `+${points}`, "#ff9e5e");
    this.say("punch");
  }

  // A wolf, or on later days a pack of them, each from a different den and after a different chicken.
  spawnWolves(count) {
    const dens = Phaser.Utils.Array.Shuffle([...this.level.dens]);
    for (let i = 0; i < count; i++) this.spawnWolf(dens[i % dens.length], i * 0.6);
    audio.play("howl");
    if (Math.random() < 0.5) this.say("wolf", { quiet: true });
  }

  spawnWolf(den, delaySeconds) {
    const free = this.chickens.filter((c) => c.state === "ok" && !c.wolf);
    if (!free.length) return;
    const target = Phaser.Utils.Array.GetRandom(free);
    const wolf = new Wolf(this, den, target, this.rules.wolfSpeed * Phaser.Math.FloatBetween(0.9, 1.1));
    wolf.waitUntil = this.time.now + delaySeconds * 1000;
    this.wolves.push(wolf);
    const x = Phaser.Math.Clamp(den.x, 70, W - 70);
    const warn = text(this, x, Phaser.Math.Clamp(den.y - 60, 140, H - 60), "WOLF!", 34, { color: "#ff6b6b" }).setDepth(DEPTH.effects);
    this.tweens.add({ targets: warn, scale: 1.25, duration: 220, yoyo: true, repeat: 2, onComplete: () => warn.destroy() });
  }

  // The egg rolls out to one side, clear of the chicken, so it's easy to tap and pick up.
  layEgg(c, now) {
    const side = c.x < 60 ? 1 : c.x > W - 60 ? -1 : Phaser.Math.RND.sign();
    const x = Phaser.Math.Clamp(c.x + side * Phaser.Math.Between(46, 58), 20, W - 20);
    const y = Phaser.Math.Clamp(c.y + Phaser.Math.Between(4, 18), 340, 930);
    const sprite = this.add.image(c.x, c.y, "egg").setOrigin(0.5, 1).setScale(0.4).setDepth(DEPTH.onGround + y / 10);
    this.tweens.add({ targets: sprite, x, y, scale: 1.25, angle: side * 360, duration: 450, ease: "Quad.easeOut" });
    audio.play("pop");
    this.eggs.push({ sprite, x, y, until: now + EGG_MS });
  }

  // Into the basket. A full basket gives back a heart, or 500 points when the hearts are full.
  collectEgg(e) {
    this.stats.eggs++;
    this.stats.basket = (this.stats.basket || 0) + 1;
    this.addScore(POINTS.egg, e.x, e.y - 40, `EGG! +${POINTS.egg}`, "#fff3c4");
    this.tweens.add({ targets: this.basketIcon, scale: 1.5, duration: 120, yoyo: true });
    if (this.stats.basket < EGGS_PER_BASKET) return;
    this.stats.basket = 0;
    audio.play("cheer");
    if (this.hearts < MAX_HEARTS) {
      this.hearts++;
      floatText(this, W / 2, H / 2, "FULL BASKET! +1 ❤", "#7CFC9A", 38);
      const h = this.heartIcons[this.hearts - 1];
      this.tweens.add({ targets: h, scale: 1.7, duration: 200, yoyo: true, repeat: 1 });
    } else {
      this.addScore(POINTS.basket, W / 2, H / 2, `FULL BASKET! +${POINTS.basket}`, "#7CFC9A");
    }
  }

  updateEggs(now) {
    this.eggs = this.eggs.filter((e) => {
      if (this.phase === "play" && Math.hypot(e.x - this.farmer.x, e.y - this.farmer.y) < EGG_PICKUP) {
        audio.play("egg");
        this.collectEgg(e);
        if (Math.random() < 0.3) this.say("egg", { quiet: true });
        e.sprite.destroy();
        return false;
      }
      if (now > e.until) {
        e.sprite.destroy();
        return false;
      }
      if (now > e.until - 3000) e.sprite.setVisible(Math.floor(now / 150) % 2 === 0);
      return true;
    });
  }

  // Called by a chicken that starved or was carried off.
  onChickenLost(chicken, how) {
    if (this.phase !== "play") return;
    this.hearts--;
    this.lostToday++;
    this.stats.lost++;
    if (how === "stolen") {
      audio.play("stolen");
      this.say("stolen");
    } else {
      audio.play("dead");
      this.feathers.explode(8, chicken.x, chicken.y - 20);
      this.say("lost");
    }
    const lost = this.heartIcons[this.hearts];
    if (lost) this.tweens.add({ targets: lost, scale: 1.6, duration: 150, yoyo: true });
    this.cameras.main.flash(200, 120, 0, 0);
    if (this.hearts <= 0) this.gameOver();
  }

  // ---- Uncle Bob talks -------------------------------------------------------------------------

  // A line in a speech bubble over Uncle Bob, and his recorded voice if there is one.
  // `quiet` lines give way when he spoke a moment ago.
  say(kind, { quiet = false } = {}) {
    const now = this.time.now;
    if (quiet && now - this.lastSaidAt < 2500) return;
    const line = sayings.random(kind);
    if (!line.text) return;
    this.lastSaidAt = now;
    bubble(this, this.farmer.x, this.farmer.y - 100, line.text, 1600, { follow: this.farmer });
    audio.playVoice(sayings.clip(line));
  }

  addScore(points, x, y, label, colour) {
    this.score += points;
    floatText(this, x, y, label, colour, 26);
    this.tweens.add({ targets: this.scoreText, scale: 1.2, duration: 90, yoyo: true });
  }

  // ---- the end of a day ------------------------------------------------------------------------

  endDay() {
    this.phase = "sundown";
    this.farmer.goal = null;
    this.binArrow.setVisible(false);
    for (const w of this.wolves) w.runOff();
    const alive = this.chickens.filter((c) => c.alive).length;
    const { points, perfect } = sundown(alive, this.lostToday);
    this.score += points;
    if (perfect) this.hearts = Math.min(MAX_HEARTS, this.hearts + 1);
    audio.play(alive ? "cheer" : "groan");
    if (alive) this.say("sundown");

    const dusk = this.add.rectangle(0, 0, W, H, 0xff7a2a, 0).setOrigin(0).setDepth(DEPTH.top);
    this.tweens.add({ targets: dusk, fillAlpha: 0.3, duration: 1200 });
    const lines = [
      [`Chickens saved: ${alive} × ${POINTS.saved}`, "#ffffff"],
      perfect ? [`PERFECT DAY! +${POINTS.perfect} and a ❤`, "#7CFC9A"] : [this.lostToday ? `Lost today: ${this.lostToday}` : "", "#ff9e9e"],
      [`SCORE ${this.score.toLocaleString()}`, "#ffe066"],
    ];
    this.panel("SUNDOWN!", `Day ${this.day} done`, lines, "TAP FOR THE NEXT DAY", () => {
      this.scene.start("Day", { day: this.day + 1, score: this.score, hearts: this.hearts, stats: this.stats });
    });
  }

  gameOver() {
    this.phase = "gameover";
    this.farmer.goal = null;
    this.binArrow.setVisible(false);
    for (const w of this.wolves) w.runOff();
    const { rank, previousTop } = store.recordGame(this.score, this.day, this.stats);
    const challenge = store.get("challenge");
    this.time.delayedCall(900, () => {
      audio.play("groan");
      this.say("gameover");
      this.showGameOver(rank, previousTop, challenge);
    });
  }

  showGameOver(rank, previousTop, challenge) {
    this.panel("GAME OVER", `You made it to day ${this.day}`, [
      [`Chickens fed: ${this.stats.fed}`, "#ffffff"],
      [`Wolves punched: ${this.stats.punched}`, "#ffffff"],
      [`SCORE ${this.score.toLocaleString()}`, "#ffe066"],
    ], "TAP TO GO ON", () => {
      this.scene.start("Results", { score: this.score, day: this.day, stats: this.stats, rank, previousTop, challenge });
    });
  }

  panel(title, sub, lines, hint, next) {
    const shade = this.add.rectangle(0, 0, W, H, 0x000000, 0).setOrigin(0).setDepth(DEPTH.overlay);
    this.tweens.add({ targets: shade, fillAlpha: 0.45, duration: 500 });
    const box = this.add.container(W / 2, H / 2).setDepth(DEPTH.overlay + 1).setScale(0.5).setAlpha(0);
    const g = this.add.graphics();
    g.fillStyle(0x5a3a1e).fillRoundedRect(-230, -200, 460, 400, 24);
    g.fillStyle(0x9a6434).fillRoundedRect(-220, -190, 440, 380, 18);
    box.add(g);
    box.add(text(this, 0, -140, title, 52, { color: "#ffe066" }));
    box.add(text(this, 0, -86, sub, 24, { color: "#fff3c4", strokeThickness: 4 }));
    lines.forEach(([words, colour], i) => box.add(text(this, 0, -24 + i * 52, words, 26, { color: colour, strokeThickness: 4 })));
    const tapHint = text(this, 0, 156, hint, 22, { color: "#ffffff", strokeThickness: 4 }).setAlpha(0);
    box.add(tapHint);
    this.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 350, delay: 300, ease: "Back.easeOut" });
    this.time.delayedCall(1400, () => {
      tapHint.setAlpha(1);
      this.tweens.add({ targets: tapHint, scale: 1.08, duration: 500, yoyo: true, repeat: -1 });
      this.input.once("pointerdown", next);
    });
  }

  // ---- weather, the dark, the score bar --------------------------------------------------------

  makeWeather() {
    const w = this.level.weather;
    const depth = DEPTH.top;
    if (w === "rain") {
      this.add.particles(0, 0, "raindrop", {
        x: { min: -100, max: W + 100 }, y: -20, lifespan: 1400, speedY: { min: 650, max: 800 }, speedX: -140,
        rotate: 11, alpha: { min: 0.4, max: 0.8 }, frequency: 12, advance: 1400,
      }).setDepth(depth);
    } else if (w === "snow") {
      this.add.particles(0, 0, "snow", {
        x: { min: -60, max: W + 60 }, y: -10, lifespan: 10000, speedY: { min: 40, max: 90 }, speedX: { min: -20, max: 10 },
        scale: { min: 0.3, max: 0.9 }, alpha: { min: 0.6, max: 1 }, frequency: 90, advance: 10000,
      }).setDepth(depth);
    } else if (w === "leaves") {
      this.add.particles(0, 0, "leaf", {
        x: { min: 0, max: W + 100 }, y: -10, lifespan: 9000, speedY: { min: 40, max: 70 }, speedX: { min: -60, max: -20 },
        rotate: { start: 0, end: 540 }, frequency: 700, advance: 9000,
      }).setDepth(depth);
    } else if (w === "fireflies") {
      this.add.particles(0, 0, "firefly", {
        emitZone: { type: "random", source: new Phaser.Geom.Rectangle(0, 300, W, H - 300) },
        lifespan: 2400, speed: { min: 5, max: 20 }, alpha: { start: 1, end: 0 },
        scale: { min: 0.6, max: 1 }, frequency: 220, advance: 2400,
      }).setDepth(DEPTH.bars);
    }
  }

  makeDark() {
    this.dark = null; // the scene object is reused from day to day
    if (!this.level.dark) return;
    this.dark = this.add.renderTexture(0, 0, W, H).setOrigin(0).setDepth(DEPTH.dark);
    this.lantern = this.make.image({ key: "light", add: false });
    this.binLight = this.make.image({ key: "light", add: false }).setScale(0.5);
  }

  updateDark() {
    if (!this.dark) return;
    const flicker = 1 + Math.sin(this.time.now / 90) * 0.02;
    this.lantern.setPosition(this.farmer.x, this.farmer.y - 40).setScale(1.05 * flicker);
    this.binLight.setPosition(this.level.bin.x, this.level.bin.y - 30);
    this.dark.clear().fill(0x050a1c, 0.82).erase([this.lantern, this.binLight]);
  }

  makeHud() {
    const d = DEPTH.hud;
    const g = this.add.graphics().setDepth(d);
    g.fillStyle(0x3b2a1e, 0.88).fillRect(0, 0, W, 96);
    g.fillStyle(0x2b1d14).fillRect(0, 94, W, 4);
    text(this, 20, 18, "SCORE", 13, { originX: 0, color: "#e8c98f", strokeThickness: 0 }).setDepth(d);
    this.scoreText = text(this, 20, 46, "0", 32, { originX: 0, color: "#ffe066" }).setDepth(d);
    text(this, W / 2, 26, `DAY ${this.day}`, 28, { color: "#ffffff" }).setDepth(d);
    text(this, W / 2, 50, this.level.name, 13, { color: "#e8c98f", strokeThickness: 0 }).setDepth(d);
    // the sun crossing the sky: how long until sundown
    this.sunTrack = { x1: W / 2 - 90, x2: W / 2 + 90, y: 76 };
    g.fillStyle(0x2b1d14).fillRoundedRect(this.sunTrack.x1 - 6, 70, 192, 12, 6);
    g.fillStyle(0xff9e3d).fillCircle(this.sunTrack.x2 + 2, 76, 5);
    this.sun = this.add.image(this.sunTrack.x1, 76, "sun").setDepth(d).setScale(0.8);
    this.heartIcons = [];
    for (let i = 0; i < MAX_HEARTS; i++) this.heartIcons.push(this.add.image(W - 26 - i * 32, 30, "heart").setDepth(d));
    this.bucketIcon = this.add.image(26, 76, "bucket").setDepth(d).setScale(0.8);
    // the egg basket: every EGGS_PER_BASKET eggs give back a heart
    this.basketIcon = this.add.image(W - 96, 74, "egg").setDepth(d);
    this.basketText = text(this, W - 82, 76, "", 18, { originX: 0, color: "#fff3c4", strokeThickness: 4 }).setDepth(d);
    this.pips = this.add.graphics().setDepth(d);
    this.shown = {};
  }

  updateHud() {
    if (this.shown.score !== this.score) this.scoreText.setText(this.score.toLocaleString());
    const k = Math.min(1, this.t / this.rules.dayLength);
    this.sun.setX(this.sunTrack.x1 + (this.sunTrack.x2 - this.sunTrack.x1) * k);
    if (this.shown.hearts !== this.hearts) {
      this.heartIcons.forEach((h, i) => {
        h.setTexture(i < this.hearts ? "heart" : "heart-empty");
        h.setVisible(i < Math.max(START_HEARTS, this.hearts));
      });
    }
    if (this.shown.scoops !== this.farmer.scoops) {
      this.pips.clear();
      for (let i = 0; i < this.rules.bucket; i++) {
        this.pips.fillStyle(i < this.farmer.scoops ? 0xf5c518 : 0x5a3b2e);
        this.pips.fillCircle(52 + i * 15, 76, 5.5);
      }
    }
    if (this.shown.basket !== this.stats.basket) this.basketText.setText(`${this.stats.basket || 0}/${EGGS_PER_BASKET}`);
    this.shown = { score: this.score, hearts: this.hearts, scoops: this.farmer.scoops, basket: this.stats.basket };
  }

  drawDebug() {
    const g = this.add.graphics().setDepth(DEPTH.overlay);
    g.lineStyle(2, 0xff00ff);
    this.level.spots.forEach(([x, y], i) => {
      g.strokeCircle(x, y, 26);
      text(this, x, y, String(i + 1), 14, { color: "#ff00ff" }).setDepth(DEPTH.overlay);
    });
    g.lineStyle(2, 0x00ffff);
    g.strokeCircle(this.level.bin.x, this.level.bin.y - 30, 66);
    g.lineStyle(2, 0xff4444);
    for (const den of this.level.dens) g.strokeCircle(Phaser.Math.Clamp(den.x, 10, W - 10), den.y, 14);
    g.lineStyle(2, 0xffaa00);
    for (const m of this.level.mud) g.strokeEllipse(m.x, m.y, m.rx * 2, m.ry * 2);
  }
}
