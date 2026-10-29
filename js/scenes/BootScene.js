// Loads Uncle Bob's lines and the cartoon characters, draws the rest of the art, then opens the game.
import * as sayings from "../sayings.js";
import * as store from "../storage.js";
import { readChallenge } from "../share.js";
import { LEVELS } from "../levels.js";
import { makeTextures } from "../textures.js";
import { H, W, setupCamera, text } from "../ui.js";

// The characters (img/, made with tools/swarm.py and tools/cutout.py): texture key → picture.
// Every one faces right. A missing picture falls back to the drawing in js/textures.js.
export const SPRITES = {
  "bob": "bob-walk", "bob-punch": "bob-punch", "bob-pour": "bob-pour",
  "chicken": "hen", "chicken-peck": "hen-peck", "chicken-flap": "hen-flap",
  "wolf": "wolf-sneak", "wolf-run": "wolf-run", "wolf-dizzy": "wolf-dizzy",
  "mud-1": "mud-1", "mud-2": "mud-2", "water": "water",
  "pumpkins-1": "pumpkins-1", "pumpkins-2": "pumpkins-2", "chick": "chick", "ribbon": "ribbon",
  // the power-ups, as they lie on the farm (and in the score bar), and what they put on Uncle Bob
  "power-superfeed": "feedsack", "power-sneakers": "sneakers", "power-dog": "dog", "power-bucket": "magicbucket",
  "dog": "dog", "sneaker": "sneaker",
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    setupCamera(this);
    const status = text(this, W / 2, H / 2, "Filling the feed bucket...", 28);
    this.load.json("sayings", "sayings/sayings.json");
    this.load.image("bob-head", "img/bob-head.png"); // Uncle Bob's face, for the drawn stand-in
    for (const [key, file] of Object.entries(SPRITES)) this.load.image(key, `img/${file}.png`);
    for (const level of LEVELS) this.load.image(`bg-${level.id}`, `img/bg-${level.id}.jpg`); // the sceneries
    this.load.on("progress", (v) => status.setText(`Filling the feed bucket... ${Math.round(v * 100)}%`));
    this.load.on("loaderror", (file) => console.warn("Could not load", file.src));
  }

  create() {
    sayings.setData(this.cache.json.get("sayings") || {});
    makeTextures(this);
    readChallenge();
    this.scene.start(store.get("player") ? "Title" : "Name");
  }
}
