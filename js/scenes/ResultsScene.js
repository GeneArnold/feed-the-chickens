// After a game: the score, how far you got, where it landed on the board, and a dare's outcome.
// Scores stay on this phone. Big buttons: PLAY AGAIN, TRASH TALK, HIGH SCORES,
// MENU (the Fun Shed's standard results screen); swiping up plays again too.
import * as audio from "../audio.js";
import { shareGame, snapshot } from "../share.js";
import { listenForGestures } from "../gestures.js";
import { START_HEARTS } from "../rules.js";
import * as store from "../storage.js";
import { W, button, farmBackdrop, fit, inside, setupCamera, text, woodSign } from "../ui.js";

const AGAIN = { x: W / 2 - 170, y: 600, w: 340, h: 84 };
const SHARE = { x: W / 2 - 170, y: 706, w: 340, h: 70 };
const BOARD = { x: W / 2 - 170, y: 800, w: 160, h: 60 };
const MENU = { x: W / 2 + 10, y: 800, w: 160, h: 60 };

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
    box.fillStyle(0x000000, 0.35).fillRoundedRect(70, 356, W - 140, 214, 20);
    rows.forEach(([icon, label, n], i) => {
      const y = 386 + i * 51;
      fit(this.add.image(116, y, icon), 38);
      text(this, 150, y, label, 25, { originX: 0, strokeThickness: 5 });
      text(this, W - 100, y, String(n), 30, { originX: 1, color: "#ffe066", strokeThickness: 5 });
    });

    const buttons = [
      [AGAIN, 0x2a9d3a, "PLAY AGAIN", 38],
      [SHARE, 0xe63946, "📣 TRASH TALK", 30],
      [BOARD, 0x2a6f9d, "HIGH SCORES", 20],
      [MENU, 0x7d5a3c, "MENU", 24],
    ];
    this.shareText = buttons.map(([r, c, words, size]) => button(this, r, c, words, size))[1].label;

    // The share picture is this screen, taken once the score has finished counting up.
    this.time.delayedCall(countUp + 150, () => snapshot(this.game).then((png) => (this.picture = png)));

    listenForGestures(this, {
      lockMs: 900,
      onTap: (x, y) => {
        if (inside(x, y, AGAIN)) this.again();
        else if (inside(x, y, SHARE)) this.share();
        else if (inside(x, y, BOARD)) this.scene.start("Board");
        else if (inside(x, y, MENU)) this.scene.start("Title");
      },
      onSwipe: (dir) => dir === "up" && this.again(),
    });
  }

  again() {
    this.scene.start("Day", { day: 1, score: 0, hearts: START_HEARTS, stats: null });
  }

  async share() {
    audio.play("pop");
    const outcome = await shareGame({ ...this.game_, picture: this.picture || null });
    if (outcome !== "cancelled") this.shareText.setText("📣 SENT! AGAIN?");
  }
}
