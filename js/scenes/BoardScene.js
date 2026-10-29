// The high scores, arcade style: a top 10 with the day each player reached. The BACK button (or
// any tap or swipe) goes back. Scores stay on this phone: to get on its board, you play on it.
import * as store from "../storage.js";
import { listenForGestures } from "../gestures.js";
import { H, W, button, farmBackdrop, setupCamera, text, woodSign } from "../ui.js";

const MEDALS = ["#ffd700", "#e8eef5", "#e0995e"];

export class BoardScene extends Phaser.Scene {
  constructor() {
    super("Board");
  }

  create() {
    setupCamera(this);
    farmBackdrop(this);
    this.add.rectangle(0, 0, W, H, 0x000000, 0.3).setOrigin(0);
    woodSign(this, W / 2, 90, 420, 120);
    text(this, W / 2, 72, "HIGH SCORES", 46, { color: "#ffe066" });
    text(this, W / 2, 120, "ON THIS PHONE", 16, { color: "#fff3c4", strokeThickness: 3 });
    this.content = this.add.container(0, 0);
    button(this, { x: W / 2 - 100, y: 858, w: 200, h: 62 }, 0x7d5a3c, "BACK", 28);
    this.drawScores(store.board());

    listenForGestures(this, {
      onSwipe: () => this.scene.start("Title"),
      onTap: () => this.scene.start("Title"),
    });
  }

  drawScores(rows) {
    this.content.removeAll(true);
    const me = store.get("player");
    if (rows.length === 0) {
      this.content.add(text(this, W / 2, 440, "Nobody yet.\nGo feed those chickens!", 34));
      return;
    }
    this.content.add(text(this, 300, 186, "DAY", 14, { color: "#fff3c4", strokeThickness: 3 }));
    rows.slice(0, 10).forEach((r, i) => {
      const y = 230 + i * 64;
      const mine = r.initials === me.initials;
      const colour = MEDALS[i] || (mine ? "#7CFC9A" : "#ffffff");
      if (mine) {
        const g = this.add.graphics();
        g.fillStyle(0xffffff, 0.16).fillRoundedRect(36, y - 27, W - 72, 54, 12);
        this.content.add(g);
      }
      this.content.add(text(this, 92, y, `${i + 1}`, 32, { color: colour, originX: 1 }));
      this.content.add(text(this, 124, y, r.initials, 36, { color: colour, originX: 0 }));
      if (r.day) this.content.add(text(this, 300, y, String(r.day), 24, { color: "#fff3c4" }));
      this.content.add(text(this, W - 50, y, r.score.toLocaleString(), 34, { color: colour, originX: 1 }));
    });
  }
}
