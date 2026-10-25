// One chicken: pecks around its spot, slowly gets skinnier, and dies (skull and crossbones) if
// nobody feeds it. A wolf can carry it off; a punch makes him drop it and it scurries home.
import * as audio from "./audio.js";
import { DEPTH, text } from "./ui.js";

export const HUNGRY = 35; // below this weight the chicken flashes and squawks
const WANDER = 26;        // how far from its spot it pecks about

export class Chicken {
  constructor(scene, x, y, name, { weight = 100, appetite = 1 } = {}) {
    this.scene = scene;
    this.home = { x, y };
    this.x = x;
    this.y = y;
    this.name = name;
    this.weight = weight;
    this.appetite = appetite; // some chickens are hungrier than others
    this.state = "ok";        // ok | carried | dead | stolen
    this.wolf = null;         // the wolf after this chicken, if any
    this.goal = { x, y };
    this.goalAt = 0;
    this.speed = 30;
    this.layAt = scene.time.now + Phaser.Math.Between(15000, 25000);
    this.squawkAt = 0;

    this.shadow = scene.add.ellipse(x, y, 40, 10, 0x000000, 0.18).setDepth(DEPTH.onGround);
    this.sprite = scene.add.image(x, y, "chicken").setOrigin(0.5, 0.97);
    this.bar = scene.add.graphics().setDepth(DEPTH.bars);
    this.tag = text(scene, x, y + 12, name, 12, { strokeThickness: 3, color: "#fff7d6" }).setDepth(DEPTH.bars);
    this.peck();
  }

  get alive() {
    return this.state === "ok" || this.state === "carried";
  }

  // A little head-bob now and then.
  peck() {
    this.scene.time.delayedCall(Phaser.Math.Between(900, 2600), () => {
      if (this.state !== "ok" || !this.sprite.active) return;
      this.scene.tweens.add({ targets: this.sprite, angle: this.sprite.flipX ? 18 : -18, duration: 120, yoyo: true, repeat: 1 });
      if (Math.random() < 0.25) audio.play("cluck");
      this.peck();
    });
  }

  update(dt, drain, now) {
    if (this.state === "ok") {
      this.weight -= drain * this.appetite * dt;
      if (this.weight <= 0) return this.die();
      if (now > this.goalAt) {
        this.goal = { x: this.home.x + Phaser.Math.Between(-WANDER, WANDER), y: this.home.y + Phaser.Math.Between(-WANDER / 2, WANDER / 2) };
        this.goalAt = now + Phaser.Math.Between(1500, 3500);
      }
      const dx = this.goal.x - this.x;
      const dy = this.goal.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > 2) {
        const step = Math.min(d, this.speed * dt);
        this.x += (dx / d) * step;
        this.y += (dy / d) * step;
        if (Math.abs(dx) > 1) this.sprite.setFlipX(dx > 0);
      } else {
        this.speed = 30; // home again after a scare
      }
      if (this.weight < HUNGRY && now > this.squawkAt) {
        this.squawkAt = now + 2200;
        audio.play("warn");
      }
    }
    this.draw(now);
  }

  draw(now) {
    const w = Math.max(0, this.weight) / 100;
    this.sprite.setPosition(this.x, this.y).setDepth(DEPTH.onGround + this.y / 10);
    if (this.state !== "dead") this.sprite.setScale(0.72 + 0.48 * w, 0.86 + 0.2 * w);
    this.shadow.setPosition(this.x, this.y).setVisible(this.state === "ok" || this.state === "dead");
    this.tag.setPosition(this.x, this.y + 12);

    const hungry = this.state === "ok" && this.weight < HUNGRY;
    if (this.state === "ok") this.sprite.setTint(hungry && Math.floor(now / 220) % 2 ? 0xff8080 : 0xffffff);

    this.bar.clear();
    if (!this.alive) return;
    const bw = 44;
    const bx = this.x - bw / 2;
    const by = this.y - 72;
    this.bar.fillStyle(0x2b1d14, 0.75);
    this.bar.fillRoundedRect(bx - 2, by - 2, bw + 4, 10, 4);
    this.bar.fillStyle(w > 0.6 ? 0x5fd35f : w > HUNGRY / 100 ? 0xf2c94c : 0xe63946);
    this.bar.fillRoundedRect(bx, by, Math.max(2, bw * w), 6, 3);
    if (hungry) this.bar.fillStyle(0xe63946).fillCircle(this.x + bw / 2 + 10, by + 3, 6);
  }

  feed() {
    this.weight = 100;
    this.scene.tweens.add({ targets: this.sprite, y: this.y - 18, duration: 140, yoyo: true, ease: "Quad.easeOut" });
    audio.play("cluck");
  }

  // Ready to lay? Only well-fed chickens do.
  readyToLay(now) {
    if (this.state !== "ok" || now < this.layAt) return false;
    this.layAt = now + Phaser.Math.Between(22000, 34000);
    return this.weight > 70;
  }

  grabbedBy(wolf) {
    this.state = "carried";
    this.wolf = wolf;
    this.sprite.setTint(0xffffff).setAngle(-25);
    audio.play("bawk");
  }

  // The wolf let go: run home, fast.
  dropped() {
    this.state = "ok";
    this.wolf = null;
    this.sprite.setAngle(0);
    this.speed = 110;
    this.goal = { ...this.home };
    this.goalAt = this.scene.time.now + 3000;
  }

  die() {
    this.state = "dead";
    this.weight = 0;
    this.wolf = null;
    this.bar.clear();
    this.sprite.setTint(0x9a9a9a);
    this.scene.tweens.add({ targets: this.sprite, angle: 180, y: this.y - 24, duration: 350, ease: "Back.easeOut" });
    this.skull = this.scene.add.image(this.x, this.y - 50, "skull").setDepth(DEPTH.bars).setScale(0);
    this.scene.tweens.add({ targets: this.skull, scale: 1, duration: 400, ease: "Back.easeOut" });
    this.scene.tweens.add({ targets: this.skull, y: this.y - 58, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: 400 });
    this.tag.setText(`RIP ${this.name}`).setColor("#cfcfcf");
    this.scene.onChickenLost(this, "starved");
  }

  stolen() {
    this.state = "stolen";
    this.wolf = null;
    this.bar.clear();
    this.sprite.setVisible(false);
    this.shadow.setVisible(false);
    this.tag.setVisible(false);
    this.scene.onChickenLost(this, "stolen");
  }
}
