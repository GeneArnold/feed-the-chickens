// Loads Uncle Bob's lines and his cartoon face, draws the rest of the art, then opens the game.
import * as online from "../online.js";
import * as sayings from "../sayings.js";
import * as store from "../storage.js";
import { readChallenge } from "../share.js";
import { makeTextures } from "../textures.js";
import { H, W, setupCamera, text } from "../ui.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    setupCamera(this);
    const status = text(this, W / 2, H / 2, "Filling the feed bucket...", 28);
    this.load.json("sayings", "sayings/sayings.json");
    this.load.image("bob-head", "img/bob-head.png"); // Uncle Bob's cartoon face
    this.load.on("progress", (v) => status.setText(`Filling the feed bucket... ${Math.round(v * 100)}%`));
    this.load.on("loaderror", (file) => console.warn("Could not load", file.src));
  }

  create() {
    sayings.setData(this.cache.json.get("sayings") || {});
    makeTextures(this);
    readChallenge();
    online.flush(); // games played offline last time
    this.scene.start(store.get("player") ? "Title" : "Name");
  }
}
