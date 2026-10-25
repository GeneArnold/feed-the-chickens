// Before each day: the scenery, "DAY 3", Uncle Bob saying what's in store, and a tip.
// Tap (or swipe up) to start the day.
import * as audio from "../audio.js";
import * as sayings from "../sayings.js";
import { listenForGestures } from "../gestures.js";
import { LEVELS, paintLevel } from "../levels.js";
import { MAX_HEARTS, dayRules, sceneryIndex } from "../rules.js";
import { H, W, setupCamera, text, woodSign } from "../ui.js";

export class DayScene extends Phaser.Scene {
  constructor() {
    super("Day");
  }

  create(round) {
    setupCamera(this);
    this.round = round;
    const { day, hearts } = round;
    const level = LEVELS[sceneryIndex(day, LEVELS.length)];
    const rules = dayRules(day);
    const lap = Math.floor((day - 1) / LEVELS.length);

    paintLevel(this, level);
    this.add.rectangle(0, 0, W, H, 0x000000, 0.35).setOrigin(0);

    woodSign(this, W / 2, 170, 420, 160);
    text(this, W / 2, 136, `DAY ${day}`, 64, { color: "#ffe066", strokeThickness: 10 });
    text(this, W / 2, 200, lap ? `${level.name} ${"+".repeat(Math.min(lap, 5))}` : level.name, 28, { color: "#fff3c4" });

    // what today looks like
    const facts = [`${rules.chickens} chickens`, !rules.maxWolves ? "no wolves yet" : rules.maxWolves === 1 ? "a wolf" : rules.pack > 1 ? `wolves in packs of ${rules.pack}` : `up to ${rules.maxWolves} wolves`, `${rules.bucket} scoops a bucket`];
    text(this, W / 2, 290, facts.join("  ·  "), 19, { color: "#ffffff", strokeThickness: 4 });
    for (let i = 0; i < Math.max(3, hearts); i++) {
      this.add.image(W / 2 - ((Math.max(3, hearts) - 1) * 34) / 2 + i * 34, 332, i < hearts ? "heart" : "heart-empty");
    }
    if (hearts >= MAX_HEARTS) text(this, W / 2, 362, "hearts full!", 14, { color: "#7CFC9A", strokeThickness: 3 });

    const tip = lap ? "Same farm, hungrier chickens,\nfaster wolves. Good luck!" : level.tip;
    const tipBox = this.add.graphics();
    tipBox.fillStyle(0x000000, 0.45).fillRoundedRect(40, 400, W - 80, 110, 18);
    text(this, W / 2, 455, tip, 22, { color: "#ffffff", strokeThickness: 4, wrap: W - 110 });

    // Uncle Bob says his piece
    const bob = this.add.image(140, 900, "bob-big").setOrigin(0.5, 1).setScale(0.85);
    this.tweens.add({ targets: bob, y: 894, duration: 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    const line = lap ? sayings.byId("day-again") : sayings.byId(level.line);
    this.speech(330, 600, line.text);
    this.time.delayedCall(350, () => audio.playVoice(sayings.clip(line)));

    const go = text(this, 340, 900, "TAP TO START", 30, { color: "#ffe066", strokeThickness: 6 });
    this.tweens.add({ targets: go, scale: 1.08, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    listenForGestures(this, {
      lockMs: 700,
      onTap: () => this.start(),
      onSwipe: (dir) => dir === "up" && this.start(),
    });
  }

  speech(x, y, words) {
    const label = text(this, x, y, words, 23, { color: "#2b1d14", strokeThickness: 0, wrap: 300 });
    const w = label.width + 34;
    const h = label.height + 26;
    const g = this.add.graphics();
    g.fillStyle(0xffffff).lineStyle(4, 0x2b1d14);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 20);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 20);
    const bx = x - w / 2 + 40;
    g.fillTriangle(bx, y + h / 2 - 3, bx + 34, y + h / 2 - 3, bx - 40, y + h / 2 + 60);
    label.setDepth(1);
    g.setAlpha(0);
    label.setAlpha(0);
    this.tweens.add({ targets: [g, label], alpha: 1, duration: 250, delay: 200 });
  }

  start() {
    audio.unlock();
    this.scene.start("Play", this.round);
  }
}
