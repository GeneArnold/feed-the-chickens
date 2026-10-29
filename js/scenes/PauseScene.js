// The pause screen, over a frozen day on the farm: KEEP PLAYING, QUIT (the score is saved and
// the results come up, as if the game had ended), and SOUND ON/OFF.
import * as audio from "../audio.js";
import { listenForGestures } from "../gestures.js";
import * as store from "../storage.js";
import { H, W, button, inside, setupCamera, text, woodSign } from "../ui.js";

const RESUME = { x: W / 2 - 150, y: 430, w: 300, h: 84 };
const QUIT = { x: W / 2 - 150, y: 560, w: 300, h: 84 };
const SOUND = { x: W / 2 - 110, y: 690, w: 220, h: 64 };

export class PauseScene extends Phaser.Scene {
  constructor() {
    super("Pause");
  }

  create() {
    setupCamera(this);
    this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0);
    woodSign(this, W / 2, 300, 360, 110);
    text(this, W / 2, 300, "PAUSED", 56, { color: "#ffe066" });
    button(this, RESUME, 0x2a9d3a, "KEEP PLAYING", 34);
    button(this, QUIT, 0xc0392b, "QUIT", 34);
    this.soundText = button(this, SOUND, 0x2a6f9d, "", 26).label;
    this.showSound();
    text(this, W / 2, 820, "Quitting ends the game.\nYour score is still saved.", 20, { color: "#ffffff", strokeThickness: 4 });

    listenForGestures(this, {
      lockMs: 250,
      onTap: (x, y) => {
        if (inside(x, y, RESUME)) this.resume();
        else if (inside(x, y, QUIT)) this.quit();
        else if (inside(x, y, SOUND)) this.toggleSound();
      },
    });
  }

  toggleSound() {
    const on = !store.get("sound");
    store.set("sound", on);
    audio.setEnabled(on);
    this.showSound();
    audio.play("cluck");
  }

  showSound() {
    this.soundText.setText(store.get("sound") ? "🔊 SOUND ON" : "🔇 SOUND OFF");
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
