// The pause screen, over a frozen day on the farm: KEEP PLAYING, or QUIT (the score is saved and
// the results come up, as if the game had ended).
import * as audio from "../audio.js";
import { listenForGestures } from "../gestures.js";
import { H, W, inside, setupCamera, text, woodSign } from "../ui.js";

const RESUME = { x: W / 2 - 150, y: 430, w: 300, h: 84 };
const QUIT = { x: W / 2 - 150, y: 560, w: 300, h: 84 };

export class PauseScene extends Phaser.Scene {
  constructor() {
    super("Pause");
  }

  create() {
    setupCamera(this);
    this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0);
    woodSign(this, W / 2, 300, 360, 110);
    text(this, W / 2, 300, "PAUSED", 56, { color: "#ffe066" });
    this.button(RESUME, 0x2a9d3a, "KEEP PLAYING");
    this.button(QUIT, 0xc0392b, "QUIT");
    text(this, W / 2, 680, "Quitting ends the game.\nYour score is still saved.", 20, { color: "#ffffff", strokeThickness: 4 });

    listenForGestures(this, {
      lockMs: 250,
      onTap: (x, y) => {
        if (inside(x, y, RESUME)) this.resume();
        else if (inside(x, y, QUIT)) this.quit();
      },
    });
  }

  button(r, colour, words) {
    const g = this.add.graphics();
    g.fillStyle(0x2b1d14).fillRoundedRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 24);
    g.fillStyle(colour).fillRoundedRect(r.x, r.y, r.w, r.h, 20);
    text(this, r.x + r.w / 2, r.y + r.h / 2, words, 34);
  }

  resume() {
    audio.play("pop");
    this.scene.stop();
    this.scene.resume("Play");
  }

  quit() {
    audio.play("groan");
    const play = this.scene.get("Play");
    this.scene.stop();
    play.quit();
  }
}
