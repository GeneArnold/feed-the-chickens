// Uncle Bob, as you steer him round the farm: walks to wherever you tap, carries the feed bucket,
// and throws a punch when he reaches a wolf.
import { DEPTH, SIZE, W, fit } from "./ui.js";

export const SPEED = 250; // pixels per second on dry grass
const BOUNDS = { x1: 24, x2: W - 24, y1: 330, y2: 930 };

// How close he has to get to do something, by what he was sent to.
export const REACH = { chicken: 46, wolf: 58, bin: 52, egg: 12, power: 12, ground: 3 };

export class Farmer {
  constructor(scene, x, y, scoops) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.scoops = scoops;
    this.goal = null; // { kind, x, y, ref }
    this.walked = 0;
    this.busyUntil = 0;
    this.shadow = scene.add.ellipse(x, y, 46, 12, 0x000000, 0.22).setDepth(DEPTH.onGround);
    this.sprite = fit(scene.add.image(x, y, "bob").setOrigin(0.5, 0.98), SIZE.bob);
  }

  goTo(goal) {
    this.goal = goal;
  }

  // Moves toward the goal. → the goal once reached (and clears it), otherwise null.
  // `slow` (0..1) is how much the ground under him slows him.
  update(dt, now, slow = 1) {
    let reached = null;
    if (this.goal && now >= this.busyUntil) {
      const g = this.goal;
      const tx = g.ref ? g.ref.x : g.x;
      const ty = g.ref ? g.ref.y : g.y;
      const dx = tx - this.x;
      const dy = ty - this.y;
      const d = Math.hypot(dx, dy);
      const reach = REACH[g.kind] ?? 3;
      if (d <= reach) {
        reached = g;
        this.goal = null;
      } else {
        const step = Math.min(d - reach * 0.8, SPEED * slow * dt);
        this.x = Phaser.Math.Clamp(this.x + (dx / d) * step, BOUNDS.x1, BOUNDS.x2);
        this.y = Phaser.Math.Clamp(this.y + (dy / d) * step, BOUNDS.y1, BOUNDS.y2);
        if (Math.abs(dx) > 2) this.sprite.setFlipX(dx < 0);
        this.walked += step;
        // A goal he can't get any closer to (off the edge of the farm) counts as reached.
        if (step <= 0.01) {
          reached = g;
          this.goal = null;
        }
      }
    }
    const moving = this.goal && now >= this.busyUntil;
    const hop = moving ? Math.abs(Math.sin(this.walked / 14)) * 6 : 0;
    this.sprite.setPosition(this.x, this.y - hop).setAngle(moving ? Math.sin(this.walked / 14) * 4 : 0);
    this.sprite.setDepth(DEPTH.onGround + this.y / 10 + 0.05);
    this.shadow.setPosition(this.x, this.y);
    return reached;
  }

  // The punch pose for a moment, facing the wolf.
  punch(towardX) {
    this.sprite.setFlipX(towardX < this.x).setTexture("bob-punch");
    this.busyUntil = this.scene.time.now + 260;
    this.scene.time.delayedCall(260, () => this.sprite.active && this.sprite.setTexture("bob"));
  }

  // A short pause while he tosses the feed.
  toss(towardX) {
    this.sprite.setFlipX(towardX < this.x).setTexture("bob-pour");
    this.busyUntil = this.scene.time.now + 180;
    this.scene.time.delayedCall(320, () => this.sprite.active && this.sprite.texture.key === "bob-pour" && this.sprite.setTexture("bob"));
  }
}
