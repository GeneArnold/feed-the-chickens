// The title: Uncle Bob on the farm, "Hey, let's go feed those chickens!" Swipe up (or tap) to
// play, swipe down for the high scores. Tap your initials to change them, or SOUND to mute.
// At the bottom: the version, and an update button when a newer release is out (js/update.js).
import * as audio from "../audio.js";
import * as store from "../storage.js";
import { install, installHint, onHintChange } from "../install.js";
import { listenForGestures } from "../gestures.js";
import { checkForUpdate, update, versionLabel } from "../update.js";
import { START_HEARTS } from "../rules.js";
import { W, farmBackdrop, inside, setupCamera, text, woodSign } from "../ui.js";

const INSTALL = { x: 40, y: 906, w: W - 80, h: 34 }; // the install hint, or the update button
const VERSION_AREA = { x: 60, y: 940, w: W - 120, h: 20 };
// ?day=4 starts on day 4, for trying out the later days.
const START_DAY = Math.max(1, parseInt(new URLSearchParams(location.search).get("day"), 10) || 1);

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    setupCamera(this);
    farmBackdrop(this);

    woodSign(this, W / 2, 200, 470, 170);
    text(this, W / 2, 160, "FEED THE", 52, { color: "#fff3c4" });
    text(this, W / 2, 228, "CHICKENS", 70, { color: "#ffe066", strokeThickness: 10 });

    // Uncle Bob and a few of his girls
    const bob = this.add.image(150, 760, "bob-big").setOrigin(0.5, 1).setScale(0.9);
    this.tweens.add({ targets: bob, scaleY: 0.92, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    for (const [x, y, flip, s] of [[330, 720, false, 1.3], [430, 760, true, 1.1], [370, 830, false, 1.2], [480, 690, true, 0.9]]) {
      const c = this.add.image(x, y, "chicken").setOrigin(0.5, 0.97).setFlipX(flip).setScale(s);
      const peck = () => this.tweens.add({
        targets: c, angle: flip ? 20 : -20, duration: 130, yoyo: true, repeat: 1,
        delay: Phaser.Math.Between(600, 2400), onComplete: peck,
      });
      peck();
    }
    this.speech(250, 400, "Hey, let's go\nfeed those chickens!");

    // Who is playing (tap to change initials), and sound on or off (tap to change).
    const badge = this.add.graphics();
    badge.fillStyle(0x000000, 0.3).fillRoundedRect(W - 128, 18, 110, 62, 14);
    text(this, W - 73, 46, store.get("player").initials, 34, { color: "#ffe066" });
    text(this, W - 73, 96, "CHANGE", 13, { color: "#ffffff", strokeThickness: 3 });
    this.meArea = { x: W - 140, y: 0, w: 140, h: 120 };
    this.soundText = text(this, 22, 40, "", 18, { originX: 0, color: "#ffffff" });
    this.soundArea = { x: 0, y: 0, w: 150, h: 90 };
    this.showSound();

    const best = store.topScore();
    const challenge = store.get("challenge");
    if (challenge) {
      const banner = text(this, W / 2, 316, `${challenge.initials} DARES YOU: BEAT ${challenge.score.toLocaleString()}!`, 24, { color: "#7CFC9A" });
      this.tweens.add({ targets: banner, scale: 1.06, duration: 400, yoyo: true, repeat: -1 });
    } else if (best) {
      text(this, W / 2, 316, `YOUR BEST  ${best.toLocaleString()}`, 20, { color: "#ffffff", strokeThickness: 4 });
    }

    const go = text(this, W / 2, 852, "SWIPE UP TO PLAY", 36, { color: "#ffe066", strokeThickness: 7 });
    this.tweens.add({ targets: go, scale: 1.08, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    text(this, W / 2, 884, "swipe down for the high scores", 18, { color: "#ffffff", strokeThickness: 4 });
    this.installBox = this.add.graphics();
    this.installText = text(this, W / 2, INSTALL.y + INSTALL.h / 2, "", 17, { color: "#ffffff", strokeThickness: 3 });
    this.versionText = text(this, W / 2, 951, versionLabel(), 12, { color: "#e8f5d0", strokeThickness: 2 });
    this.showInstall();
    onHintChange(() => this.scene.isActive() && this.showInstall());
    this.lookForUpdate(false);
    // Coming back to the game from another app checks again: a phone often keeps the game open for days.
    const back = () => !document.hidden && this.lookForUpdate(false);
    document.addEventListener("visibilitychange", back);
    this.events.once("shutdown", () => document.removeEventListener("visibilitychange", back));

    listenForGestures(this, {
      onSwipe: (dir) => {
        if (dir === "up") this.play();
        else if (dir === "down") this.scene.start("Board");
      },
      onTap: (x, y) => {
        if (inside(x, y, this.meArea)) this.scene.start("Name");
        else if (this.hint?.update && inside(x, y, INSTALL)) this.runUpdate();
        else if (this.hint?.tap && inside(x, y, INSTALL)) install();
        else if (inside(x, y, VERSION_AREA)) this.lookForUpdate(true);
        else if (inside(x, y, this.soundArea)) this.toggleSound();
        else if (y > 120 && y < INSTALL.y - 10) this.play();
      },
    });
  }

  speech(x, y, words) {
    const label = text(this, x, y, words, 26, { color: "#2b1d14", strokeThickness: 0 });
    const w = label.width + 36;
    const h = label.height + 26;
    const g = this.add.graphics();
    g.fillStyle(0xffffff).lineStyle(4, 0x2b1d14);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 20);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 20);
    g.fillTriangle(x - 90, y + h / 2 - 3, x - 50, y + h / 2 - 3, x - 110, y + h / 2 + 50);
    g.lineBetween(x - 90, y + h / 2, x - 110, y + h / 2 + 50);
    g.lineBetween(x - 50, y + h / 2, x - 110, y + h / 2 + 50);
    label.setDepth(1);
    const all = [g, label];
    this.tweens.add({ targets: all, y: "-=6", duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  play() {
    audio.unlock();
    audio.play("rooster");
    this.scene.start("Day", { day: START_DAY, score: 0, hearts: START_HEARTS, stats: null });
  }

  // Asks the site whether a newer release is out. `asked` is a tap on the version, which gets an answer.
  async lookForUpdate(asked) {
    if (asked) this.versionText.setText("checking for an update…");
    const newer = await checkForUpdate();
    if (!this.scene.isActive()) return;
    this.updateReady = newer === true;
    this.showInstall();
    if (!asked) return;
    const answer = newer === null ? "couldn't check (no signal?)" : newer ? "an update is ready" : "you have the latest version ✓";
    this.versionText.setText(answer);
    this.time.delayedCall(2500, () => this.versionText.setText(versionLabel()));
  }

  runUpdate() {
    this.installText.setText("⏳ UPDATING…");
    this.hint = null;
    update();
  }

  // "Install me", while the game is playing in a browser tab on a phone (js/install.js), or the
  // update button when a newer release is out.
  showInstall() {
    this.hint = this.updateReady ? { words: "⬆ NEW VERSION! TAP TO UPDATE", tap: true, update: true } : installHint();
    this.installBox.clear();
    this.installText.setText(this.hint?.words ?? "");
    if (!this.hint) return;
    this.installBox.fillStyle(this.hint.update ? 0xe07a1f : this.hint.tap ? 0x2a9d8f : 0x000000, this.hint.tap ? 1 : 0.3);
    this.installBox.fillRoundedRect(INSTALL.x, INSTALL.y, INSTALL.w, INSTALL.h, 17);
  }

  toggleSound() {
    const on = !store.get("sound");
    store.set("sound", on);
    audio.setEnabled(on);
    this.showSound();
    audio.play("cluck");
  }

  showSound() {
    this.soundText.setText(store.get("sound") ? "SOUND ON" : "SOUND OFF");
  }
}

