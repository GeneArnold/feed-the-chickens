// The high scores, arcade style: a top 10 with the day each player reached. Swipe or tap to go
// back. With the family board online it shows the whole family; otherwise this phone.
import * as online from "../online.js";
import * as store from "../storage.js";
import { listenForGestures } from "../gestures.js";
import { H, W, farmBackdrop, setupCamera, text, woodSign } from "../ui.js";

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
    this.whose = text(this, W / 2, 120, "THIS PHONE", 16, { color: "#fff3c4", strokeThickness: 3 });
    this.content = this.add.container(0, 0);
    text(this, W / 2, H - 34, "tap or swipe to go back", 17, { color: "#ffffff", strokeThickness: 4 });
    this.drawScores(store.board());
    this.showFamily();

    listenForGestures(this, {
      onSwipe: () => this.scene.start("Title"),
      onTap: () => this.scene.start("Title"),
    });
  }

  async showFamily() {
    const family = await online.topScores();
    // Until anyone has posted, the phone's own board is more fun than an empty one.
    if (family?.length && this.scene.isActive()) {
      this.whose.setText("THE WHOLE FAMILY");
      this.drawScores(family);
    }
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
      const mine = r.player ? r.player === me.id : r.initials === me.initials;
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
