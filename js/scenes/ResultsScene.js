// After a game: the score, how far you got, where it landed on the board, and a dare's outcome.
// Swipe up to play again, down for the high scores, right for the menu; swipe left or tap
// TRASH TALK to text the score to someone. With the family board online, the first swipe up
// posts the score there instead (swipe down skips).
import * as audio from "../audio.js";
import * as online from "../online.js";
import { shareGame, snapshot } from "../share.js";
import { listenForGestures } from "../gestures.js";
import { START_HEARTS } from "../rules.js";
import * as store from "../storage.js";
import { W, farmBackdrop, setupCamera, text, woodSign } from "../ui.js";

const SHARE = { x: W / 2 - 130, y: 770, w: 260, h: 64 };

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("Results");
  }

  create({ score, day, stats, rank, previousTop, challenge }) {
    setupCamera(this);
    farmBackdrop(this);
    this.game_ = { score, day, stats };
    const me = store.get("player");

    woodSign(this, W / 2, 190, 460, 290);
    text(this, W / 2, 80, "GAME OVER", 46, { color: "#ffe066" });
    text(this, W / 2, 124, `${me.initials} · made it to day ${day}`, 22, { color: "#fff3c4", strokeThickness: 4 });
    const scoreText = text(this, W / 2, 200, "0", 90, { color: "#ffffff", strokeThickness: 10 });
    const countUp = Math.min(1200, 200 + score / 4);
    this.tweens.addCounter({
      from: 0, to: score, duration: countUp, ease: "Cubic.easeOut",
      onUpdate: (t) => scoreText.setText(Math.round(t.getValue()).toLocaleString()),
    });

    // The headline: a dare's outcome first, then a new high score, then the board.
    let headline;
    let colour = "#ffe066";
    let cheer = score > 0;
    if (challenge) {
      const won = score > challenge.score;
      headline = won ? `YOU BEAT ${challenge.initials}!` : `${challenge.initials} STILL RULES (${challenge.score.toLocaleString()})`;
      colour = won ? "#7CFC9A" : "#ff9e9e";
      cheer = won;
      store.set("challenge", null);
    } else if (score > previousTop && score > 0) {
      headline = "NEW HIGH SCORE!";
      colour = "#7CFC9A";
    } else if (rank) {
      headline = `#${rank} ON THIS PHONE`;
    } else {
      headline = `YOUR BEST ${previousTop.toLocaleString()}`;
      cheer = false;
    }
    const head = text(this, W / 2, 284, headline, 32, { color: colour, strokeThickness: 6 });
    if (colour === "#7CFC9A") this.tweens.add({ targets: head, scale: 1.1, duration: 450, yoyo: true, repeat: -1 });
    audio.play(cheer ? "cheer" : "groan");

    const rows = [
      ["chicken", "Chickens fed", stats.fed],
      ["pow", "Wolves punched", stats.punched],
      ["egg", "Eggs found", stats.eggs],
      ["skull", "Chickens lost", stats.lost],
    ];
    const box = this.add.graphics();
    box.fillStyle(0x000000, 0.35).fillRoundedRect(60, 370, W - 120, 300, 20);
    rows.forEach(([icon, label, n], i) => {
      const y = 410 + i * 72;
      this.add.image(110, y, icon).setDisplaySize(44, icon === "chicken" ? 41 : 44);
      text(this, 150, y, label, 26, { originX: 0, strokeThickness: 5 });
      text(this, W - 90, y, String(n), 32, { originX: 1, color: "#ffe066", strokeThickness: 5 });
    });

    const pill = this.add.graphics();
    pill.fillStyle(0x2b1d14).fillRoundedRect(SHARE.x - 4, SHARE.y - 4, SHARE.w + 8, SHARE.h + 8, 36);
    pill.fillStyle(0xe63946).fillRoundedRect(SHARE.x, SHARE.y, SHARE.w, SHARE.h, 32);
    this.shareText = text(this, W / 2, SHARE.y + SHARE.h / 2, "📣 TRASH TALK", 28);
    this.hintBig = text(this, W / 2, 870, "", 30, { color: "#ffe066", strokeThickness: 6 });
    this.hintSmall = text(this, W / 2, 914, "", 17, { color: "#ffffff", strokeThickness: 4 });
    this.asking = online.enabled() && score > 0; // offer to post to the family board first
    this.showHints();

    // The share picture is this screen, taken once the score has finished counting up.
    this.time.delayedCall(countUp + 150, () => {
      this.hintBig.setVisible(false);
      this.hintSmall.setVisible(false);
      snapshot(this.game).then((png) => {
        this.picture = png;
        this.hintBig.setVisible(true);
        this.hintSmall.setVisible(true);
      });
    });

    listenForGestures(this, {
      lockMs: 900,
      onSwipe: (dir) => {
        if (this.asking) {
          if (dir === "up") this.post();
          else if (dir === "down") this.skipPost();
          return;
        }
        if (dir === "up") this.scene.start("Day", { day: 1, score: 0, hearts: START_HEARTS, stats: null });
        else if (dir === "down") this.scene.start("Board");
        else if (dir === "left") this.share();
        else this.scene.start("Title");
      },
      onTap: (x, y) => {
        if (x > SHARE.x && x < SHARE.x + SHARE.w && y > SHARE.y && y < SHARE.y + SHARE.h) this.share();
      },
    });
  }

  showHints() {
    if (this.asking) {
      this.hintBig.setText("SWIPE UP: POST TO THE FAMILY BOARD").setFontSize(24);
      this.hintSmall.setText("swipe down to skip");
    } else {
      this.hintBig.setText("SWIPE UP TO PLAY AGAIN").setFontSize(30);
      this.hintSmall.setText("↓ high scores   ← trash talk   → menu");
    }
  }

  async post() {
    this.asking = false;
    this.hintBig.setText("Posting...");
    const { score, day, stats } = this.game_;
    await online.postGame(score, day, stats);
    const waiting = store.get("outbox").length > 0;
    audio.play(waiting ? "pop" : "cheer");
    this.showHints();
    this.hintSmall.setText(waiting ? "no signal: it'll post next time you play" : "posted to the family board!");
    this.time.delayedCall(2200, () => this.scene.isActive() && this.showHints());
  }

  skipPost() {
    this.asking = false;
    this.showHints();
  }

  async share() {
    audio.play("pop");
    const outcome = await shareGame({ ...this.game_, picture: this.picture || null });
    if (outcome !== "cancelled") this.shareText.setText("📣 SENT! AGAIN?");
  }
}
