// The wolf: comes in from a den at the edge of the farm, sneaks up on a chicken, grabs it, and
// drags it back home. One punch from Uncle Bob and he drops it and runs off yelping.
import * as audio from "./audio.js";
import { DEPTH, SIZE, W, fit } from "./ui.js";

const GRAB_MS = 600;  // how long he wrestles the chicken before dragging it off
const DRAG = 0.6;     // dragging a chicken is slower than sneaking
const FLEE = 2.6;     // running away is much faster

export class Wolf {
  constructor(scene, den, target, speed) {
    this.scene = scene;
    this.den = den;
    this.x = den.x;
    this.y = den.y;
    this.speed = speed;
    this.state = "sneak"; // sneak | grab | drag | flee | gone
    this.target = null;
    this.setTarget(target);
    this.grabUntil = 0;

    this.shadow = scene.add.ellipse(this.x, this.y, 70, 14, 0x000000, 0.2).setDepth(DEPTH.onGround);
    this.sprite = fit(scene.add.image(this.x, this.y, "wolf").setOrigin(0.5, 0.97).setAlpha(0), SIZE.wolf);
    scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 400 });
    this.eyes = scene.add.image(this.x, this.y, "wolf-eyes").setDepth(DEPTH.bars).setVisible(Boolean(scene.level.dark));
    this.trot = 0;
  }

  get punchable() {
    return this.state === "sneak" || this.state === "grab" || this.state === "drag";
  }

  setTarget(chicken) {
    if (this.target?.wolf === this) this.target.wolf = null;
    this.target = chicken;
    if (chicken) chicken.wolf = this;
  }

  update(dt, now, chickens) {
    if (this.state === "gone") return;
    if (now < (this.waitUntil || 0)) return; // the rest of the pack follows a moment later
    if (this.state === "sneak") {
      if (!this.target || this.target.state !== "ok") {
        const free = chickens.filter((c) => c.state === "ok" && !c.wolf);
        if (free.length) this.setTarget(Phaser.Utils.Array.GetRandom(free));
        else return this.runOff();
      }
      if (this.moveTo(this.target.x + 8, this.target.y, this.speed, dt)) {
        this.state = "grab";
        this.grabUntil = now + GRAB_MS;
        this.target.grabbedBy(this);
      }
    } else if (this.state === "grab") {
      this.carry(now);
      if (now > this.grabUntil) {
        this.state = "drag";
        this.sprite.setTexture("wolf-run");
      }
    } else if (this.state === "drag") {
      const home = this.moveTo(this.den.x, this.den.y, this.speed * DRAG, dt);
      this.carry(now);
      if (home) {
        const chicken = this.target;
        this.target = null;
        chicken.stolen();
        this.remove();
      }
    } else if (this.state === "flee") {
      if (this.moveTo(this.den.x, this.den.y, this.speed * FLEE, dt)) this.remove();
    }
    this.draw(dt);
  }

  // Walks toward a point; true once there.
  moveTo(x, y, speed, dt) {
    const dx = x - this.x;
    const dy = y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 4) return true;
    const step = Math.min(d, speed * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    if (Math.abs(dx) > 1) this.facing = dx > 0 ? 1 : -1;
    this.trot += step;
    return false;
  }

  // The chicken flaps in his mouth.
  carry(now) {
    const c = this.target;
    if (!c) return;
    const dir = this.facing || -1;
    c.x = this.x + dir * 44;
    c.y = this.y - 10 + Math.sin(now / 60) * 4;
    c.draw(now);
  }

  draw() {
    const flip = this.facing === -1; // the pictures face right
    this.sprite.setFlipX(flip);
    if (this.state !== "flee") this.sprite.setAngle(0);
    const hop = Math.abs(Math.sin(this.trot / 9)) * 4;
    this.sprite.setPosition(this.x, this.y - hop).setDepth(DEPTH.onGround + this.y / 10);
    this.shadow.setPosition(this.x, this.y);
    this.eyes.setPosition(this.x + (flip ? -18 : 18), this.y - 56 - hop);
  }

  // Uncle Bob's punch. → the chicken he dropped, or null. false when he can't be punched.
  punch() {
    if (!this.punchable) return false;
    const dropped = this.state === "grab" || this.state === "drag" ? this.target : null;
    if (dropped) dropped.dropped();
    this.setTarget(null);
    this.state = "flee";
    this.sprite.setTexture("wolf-dizzy");
    this.den = this.nearestExit();
    audio.play("yelp");
    this.scene.tweens.add({ targets: this.sprite, angle: this.den.x > this.x ? 360 : -360, duration: 500 });
    return dropped;
  }

  // Leaves without a chicken: nothing left to catch, or the sun went down.
  runOff() {
    if (!this.punchable) return;
    if (this.target?.state === "carried") this.target.dropped();
    this.setTarget(null);
    this.state = "flee";
    this.sprite.setTexture("wolf-run");
    this.den = this.nearestExit();
  }

  nearestExit() {
    return { x: this.x < W / 2 ? -80 : W + 80, y: this.y };
  }

  remove() {
    this.state = "gone";
    this.setTarget(null);
    this.sprite.destroy();
    this.shadow.destroy();
    this.eyes.destroy();
  }
}
