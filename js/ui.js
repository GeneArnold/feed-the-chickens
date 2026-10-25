// Small pieces of screen shared by the scenes: text styles, speech bubbles, floating points.
export const W = 540;
export const H = 960;
export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

// Drawing order on the farm. Animals and Uncle Bob sit between GROUND and TOP, sorted by how far
// down the screen they stand, so whoever is lower is drawn in front.
export const DEPTH = { ground: 0, onGround: 5, top: 700, dark: 800, bars: 850, effects: 900, hud: 1000, bubble: 1100, overlay: 1200 };

// The game is laid out on a 540 x 960 screen but drawn at twice that, so it stays sharp on phones.
// Every scene calls this first; positions everywhere are in the 540 x 960 layout.
export const ZOOM = 2;
export function setupCamera(scene) {
  scene.cameras.main.setZoom(ZOOM).centerOn(W / 2, H / 2);
}

// Where a finger is, in the 540 x 960 layout.
export function fingerAt(scene, pointer) {
  const p = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  return { x: p.x, y: p.y, t: performance.now() };
}

export function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function text(scene, x, y, str, size = 28, opts = {}) {
  return scene.add
    .text(x, y, str, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      fontStyle: opts.bold === false ? "normal" : "bold",
      color: opts.color || "#ffffff",
      stroke: opts.stroke || "#2b1d14",
      strokeThickness: opts.strokeThickness ?? Math.round(size / 6),
      align: "center",
      resolution: ZOOM,
      wordWrap: opts.wrap ? { width: opts.wrap } : undefined,
    })
    .setOrigin(opts.originX ?? 0.5, opts.originY ?? 0.5);
}

// A speech bubble above a point, kept inside the screen, gone after `ms`. One at a time: a new
// bubble replaces the last one, so quick lines never stack up unreadable bubbles.
// `follow` (anything with x and y) makes the bubble ride along above it.
export function bubble(scene, x, y, words, ms = 1700, { follow = null, lift = 0 } = {}) {
  scene.lastBubble?.destroy();
  const label = scene.add.text(0, 0, words, {
    fontFamily: FONT, fontSize: "22px", fontStyle: "bold", color: "#2b1d14", align: "center",
    wordWrap: { width: 250 }, resolution: ZOOM,
  }).setOrigin(0.5);
  const w = label.width + 30;
  const h = label.height + 20;
  const g = scene.add.graphics();
  const c = scene.add.container(0, 0, [g, label]).setDepth(DEPTH.bubble).setScale(0.6);
  const place = (px, py) => {
    const cx = Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, px));
    const cy = Math.max(h / 2 + 100, py - h / 2 - 16 - lift);
    c.setPosition(cx, cy);
    g.clear();
    g.fillStyle(0xffffff, 0.97);
    g.lineStyle(3, 0x2b1d14);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    const tailX = Math.max(-w / 2 + 20, Math.min(w / 2 - 20, px - cx));
    g.fillTriangle(tailX - 10, h / 2 - 2, tailX + 10, h / 2 - 2, tailX, h / 2 + 14);
  };
  place(x, y);
  if (follow) {
    const tick = () => c.active && place(follow.x, follow.y - 100);
    scene.events.on("update", tick);
    c.once("destroy", () => scene.events.off("update", tick));
  }
  scene.lastBubble = c;
  scene.tweens.add({ targets: c, scale: 1, duration: 160, ease: "Back.easeOut" });
  scene.tweens.add({ targets: c, alpha: 0, delay: ms, duration: 250, onComplete: () => c.destroy() });
  return c;
}

export function floatText(scene, x, y, words, colour = "#ffe066", size = 30) {
  const t = text(scene, x, y, words, size, { color: colour }).setDepth(DEPTH.effects);
  scene.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 1100, ease: "Cubic.easeOut", onComplete: () => t.destroy() });
  return t;
}

// A plain farm backdrop for the menu screens: blue sky, green hills, a fence.
export function farmBackdrop(scene) {
  const g = scene.add.graphics();
  g.fillGradientStyle(0x7ec8f0, 0x7ec8f0, 0xc9ecff, 0xc9ecff, 1);
  g.fillRect(0, 0, W, 560);
  g.fillStyle(0x8fd16a);
  g.fillEllipse(110, 600, 520, 200);
  g.fillEllipse(460, 590, 480, 180);
  g.fillStyle(0x5fae45);
  g.fillRect(0, 600, W, H - 600);
  g.fillStyle(0x52a03b);
  for (let i = 0; i < 40; i++) g.fillEllipse((i * 97) % W, 640 + ((i * 53) % 300), 26, 8);
  // fence
  g.fillStyle(0xf2efe6);
  for (let x = 10; x < W; x += 46) g.fillRect(x, 560, 10, 62);
  g.fillRect(0, 574, W, 9);
  g.fillRect(0, 600, W, 9);
  // clouds
  g.fillStyle(0xffffff, 0.9);
  for (const [x, y, s] of [[90, 90, 1], [400, 150, 0.8], [260, 50, 0.6]]) {
    g.fillEllipse(x, y, 110 * s, 40 * s);
    g.fillEllipse(x + 30 * s, y - 16 * s, 70 * s, 40 * s);
    g.fillEllipse(x - 30 * s, y - 8 * s, 60 * s, 34 * s);
  }
  return g;
}

// A wooden sign with words on it, like the one over the barn door.
export function woodSign(scene, x, y, w, h) {
  const g = scene.add.graphics();
  g.fillStyle(0x5a3a1e);
  g.fillRoundedRect(x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12, 14);
  g.fillStyle(0x9a6434);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
  g.lineStyle(2, 0x7d4f27);
  for (let ly = y - h / 2 + h / 4; ly < y + h / 2; ly += h / 4) g.lineBetween(x - w / 2 + 6, ly, x + w / 2 - 6, ly);
  g.fillStyle(0x3b2a1e);
  for (const [nx, ny] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.fillCircle(x + nx * (w / 2 - 12), y + ny * (h / 2 - 12), 4);
  return g;
}
