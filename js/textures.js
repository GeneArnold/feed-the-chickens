// Placeholder art drawn in code at start-up: Uncle Bob, the chickens, the wolf, and the little
// things (corn, eggs, the skull and crossbones). When the artist's pictures exist, load them in
// BootScene under the same keys and delete the matching drawing here; nothing else needs to change.

function draw(scene, key, w, h, paint) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  paint(g);
  g.generateTexture(key, Math.ceil(w), Math.ceil(h));
  g.destroy();
}

// Uncle Bob on a 96 x 104 grid, times `s`: straw hat, grey beard, red shirt, blue overalls, a
// feed bucket in his left hand. Facing us; `punch` throws his right arm out to the side.
// He stands in the middle, feet at (48, 102), so he can turn round without jumping sideways.
export const BOB_SIZE = { w: 96, h: 104, footX: 48 };
function paintBob(g, s, punch, head = true) {
  const p = (v) => v * s;
  g.translateCanvas(p(12), 0); // drawn below with his feet at x 36
  // boots
  g.fillStyle(0x3b2a1e);
  g.fillRoundedRect(p(22), p(90), p(12), p(12), p(3));
  g.fillRoundedRect(p(38), p(90), p(12), p(12), p(3));
  // legs of the overalls
  g.fillStyle(0x2f5fa8);
  g.fillRoundedRect(p(20), p(58), p(32), p(36), p(6));
  g.fillStyle(0x24497f);
  g.fillRect(p(35), p(74), p(2), p(20));
  // left arm down, holding the bucket
  g.fillStyle(0xc0392b);
  g.fillRoundedRect(p(9), p(44), p(11), p(22), p(5));
  g.fillStyle(0xf1c27d);
  g.fillCircle(p(14), p(68), p(4.5));
  g.fillStyle(0x9aa3ad);
  g.fillPoints([{ x: p(4), y: p(70) }, { x: p(24), y: p(70) }, { x: p(21), y: p(86) }, { x: p(7), y: p(86) }], true);
  g.fillStyle(0xf2c94c);
  g.fillEllipse(p(14), p(71), p(19), p(5));
  g.lineStyle(p(1.5), 0x6b737c);
  g.strokeEllipse(p(14), p(70), p(20), p(5));
  // right arm: down, or punching out to the side
  g.fillStyle(0xc0392b);
  if (punch) {
    g.fillRoundedRect(p(50), p(44), p(24), p(11), p(5));
    g.fillStyle(0xf1c27d);
    g.fillCircle(p(77), p(49.5), p(7));
  } else {
    g.fillRoundedRect(p(52), p(44), p(11), p(22), p(5));
    g.fillStyle(0xf1c27d);
    g.fillCircle(p(57.5), p(68), p(4.5));
  }
  // shirt with plaid lines
  g.fillStyle(0xc0392b);
  g.fillRoundedRect(p(18), p(42), p(36), p(22), p(8));
  g.lineStyle(p(1.2), 0x8e2a20);
  for (const x of [24, 30, 42, 48]) g.lineBetween(p(x), p(44), p(x), p(62));
  // bib and straps
  g.fillStyle(0x2f5fa8);
  g.fillRect(p(26), p(50), p(20), p(14));
  g.fillRect(p(25), p(42), p(4), p(10));
  g.fillRect(p(43), p(42), p(4), p(10));
  g.fillStyle(0xf2c94c);
  g.fillCircle(p(27), p(51), p(1.6));
  g.fillCircle(p(45), p(51), p(1.6));
  if (!head) return; // his cartoon face goes on instead (makeBob)
  // head, ears
  g.fillStyle(0xf1c27d);
  g.fillCircle(p(23.5), p(30), p(3.5));
  g.fillCircle(p(48.5), p(30), p(3.5));
  g.fillCircle(p(36), p(29), p(13));
  // beard and moustache
  g.fillStyle(0xdedede);
  g.fillEllipse(p(36), p(38), p(26), p(16));
  g.fillStyle(0xcfcfcf);
  g.fillEllipse(p(31), p(33.5), p(10), p(4));
  g.fillEllipse(p(41), p(33.5), p(10), p(4));
  // smile, nose, eyes, cheeks
  g.fillStyle(0x7a3b2e);
  g.fillEllipse(p(36), p(38), p(7), p(3));
  g.fillStyle(0xe8a87c);
  g.fillCircle(p(36), p(30), p(3.2));
  g.fillStyle(0xf4a3a3, 0.6);
  g.fillCircle(p(28), p(31), p(2.5));
  g.fillCircle(p(44), p(31), p(2.5));
  g.fillStyle(0x222222);
  g.fillCircle(p(31), p(25.5), p(1.8));
  g.fillCircle(p(41), p(25.5), p(1.8));
  g.lineStyle(p(1.4), 0x8a8a8a);
  g.lineBetween(p(28), p(22), p(33), p(21.5));
  g.lineBetween(p(39), p(21.5), p(44), p(22));
  // straw hat
  g.fillStyle(0xe8c547);
  g.fillEllipse(p(36), p(17), p(44), p(9));
  g.fillRoundedRect(p(25), p(3), p(22), p(15), p(6));
  g.fillStyle(0xb5462f);
  g.fillRect(p(25), p(12), p(22), p(3.5));
  g.lineStyle(p(1), 0xc9a632);
  g.lineBetween(p(16), p(17), p(56), p(17));
}

// A hen facing left on a 64 x 60 grid; feet at (32, 58).
function paintChicken(g) {
  g.lineStyle(3, 0xe08a1e);
  g.lineBetween(28, 46, 26, 58);
  g.lineBetween(38, 46, 40, 58);
  g.lineBetween(21, 58, 30, 58);
  g.lineBetween(35, 58, 44, 58);
  // tail
  g.fillStyle(0xf3f0e8);
  g.fillTriangle(46, 30, 62, 10, 58, 34);
  g.fillTriangle(46, 34, 63, 22, 58, 40);
  // body, wing
  g.fillStyle(0xffffff);
  g.fillEllipse(35, 36, 46, 32);
  g.fillStyle(0xe6e1d6);
  g.fillEllipse(39, 36, 24, 14);
  g.lineStyle(1.5, 0xc9c2b3);
  g.strokeEllipse(39, 36, 24, 14);
  // head
  g.fillStyle(0xffffff);
  g.fillCircle(17, 20, 10);
  g.fillStyle(0xe03131);
  g.fillCircle(12, 9, 4);
  g.fillCircle(17, 7.5, 4.5);
  g.fillCircle(22, 9.5, 3.5);
  g.fillEllipse(11, 29, 5, 8);
  g.fillStyle(0xf5b82e);
  g.fillTriangle(8, 17, 8, 24, 1, 20.5);
  g.fillStyle(0x222222);
  g.fillCircle(14, 18, 2);
}

// The wolf facing left on a 112 x 72 grid; feet at (60, 70).
function paintWolf(g, dizzy) {
  // tail
  g.fillStyle(0x6a6a78);
  g.fillEllipse(98, 32, 30, 13);
  g.fillStyle(0xd8d8e0);
  g.fillEllipse(108, 30, 8, 8);
  // legs
  g.fillStyle(0x4f4f5c);
  for (const x of [40, 52, 74, 86]) g.fillRoundedRect(x, 50, 8, 20, 3);
  // body, belly
  g.fillStyle(0x7d7d8a);
  g.fillEllipse(64, 40, 66, 32);
  g.fillStyle(0xb8b8c4);
  g.fillEllipse(60, 49, 40, 12);
  g.fillStyle(0x6a6a78);
  g.fillTriangle(48, 26, 80, 22, 66, 34);
  // ears
  g.fillStyle(0x6a6a78);
  g.fillTriangle(18, 20, 24, 2, 32, 18);
  g.fillTriangle(30, 18, 38, 3, 43, 20);
  g.fillStyle(0xd99aa0);
  g.fillTriangle(22, 18, 25, 8, 29, 18);
  // head, snout
  g.fillStyle(0x7d7d8a);
  g.fillCircle(30, 30, 16);
  g.fillStyle(0xb8b8c4);
  g.fillEllipse(13, 37, 28, 14);
  g.fillStyle(0x222222);
  g.fillCircle(4, 34, 4);
  // teeth
  g.fillStyle(0xffffff);
  g.fillTriangle(8, 42, 12, 42, 10, 47);
  g.fillTriangle(15, 42, 19, 42, 17, 47);
  // eye: mean, or dizzy
  if (dizzy) {
    g.lineStyle(2.5, 0x222222);
    g.lineBetween(21, 22, 29, 30);
    g.lineBetween(29, 22, 21, 30);
  } else {
    g.fillStyle(0xffd23f);
    g.fillCircle(25, 26, 4.5);
    g.fillStyle(0x222222);
    g.fillCircle(24, 26.5, 2.2);
    g.lineStyle(2.5, 0x3a3a44);
    g.lineBetween(18, 19, 31, 23);
  }
}

function star(g, cx, cy, outer, inner, points = 5) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  g.fillPoints(pts, true);
}

function heart(g, cx, cy, r, colour) {
  g.fillStyle(colour);
  g.fillCircle(cx - r * 0.5, cy - r * 0.2, r * 0.55);
  g.fillCircle(cx + r * 0.5, cy - r * 0.2, r * 0.55);
  g.fillTriangle(cx - r * 1.03, cy, cx + r * 1.03, cy, cx, cy + r);
}

// Uncle Bob with his own cartoon face (img/bob-head.png, made from a family photo) on the drawn
// body. Without that picture he keeps the drawn face and straw hat.
// `s` is the scale; the small walking Bob is made at 2x and shown at half size, so he stays sharp.
export const BOB_RES = 2;
const HEAD = { w: 42, chinY: 50 }; // the face picture's width, and where his chin sits, in grid units

function makeBob(scene, key, s, punch) {
  if (scene.textures.exists(key)) return;
  const w = BOB_SIZE.w * s;
  const h = BOB_SIZE.h * s;
  if (!scene.textures.exists("bob-head")) return draw(scene, key, w, h, (g) => paintBob(g, s, punch));
  const g = scene.make.graphics({}, false);
  paintBob(g, s, punch, false);
  const face = scene.make.image({ key: "bob-head", add: false });
  const fw = HEAD.w * s;
  const fh = fw * (face.height / face.width);
  face.setOrigin(0.5, 1).setDisplaySize(fw, fh).setPosition(BOB_SIZE.footX * s, HEAD.chinY * s);
  const tex = scene.textures.addDynamicTexture(key, w, h);
  tex.draw(g).draw(face);
  g.destroy();
  face.destroy();
}

export function makeTextures(scene) {
  makeBob(scene, "bob", BOB_RES, false);
  makeBob(scene, "bob-punch", BOB_RES, true);
  makeBob(scene, "bob-big", 3, false);
  draw(scene, "chicken", 64, 60, paintChicken);
  draw(scene, "wolf", 112, 72, (g) => paintWolf(g, false));
  draw(scene, "wolf-dizzy", 112, 72, (g) => paintWolf(g, true));

  // Glowing wolf eyes, drawn above the dark on night levels.
  draw(scene, "wolf-eyes", 16, 8, (g) => {
    g.fillStyle(0xffe14d);
    g.fillCircle(4, 4, 3);
    g.fillCircle(12, 4, 3);
  });

  draw(scene, "skull", 48, 48, (g) => {
    g.lineStyle(7, 0xf4f1e6);
    g.lineBetween(8, 30, 40, 46);
    g.lineBetween(40, 30, 8, 46);
    g.fillStyle(0xf4f1e6);
    for (const [x, y] of [[6, 28], [10, 32], [42, 28], [38, 32], [6, 48], [10, 44], [42, 48], [38, 44]]) g.fillCircle(x, y, 3.5);
    g.fillCircle(24, 17, 14);
    g.fillRoundedRect(16, 24, 16, 12, 3);
    g.fillStyle(0x222222);
    g.fillCircle(18.5, 16, 4.5);
    g.fillCircle(29.5, 16, 4.5);
    g.fillTriangle(24, 21, 21.5, 26, 26.5, 26);
    g.fillRect(19, 31, 2, 5);
    g.fillRect(23, 31, 2, 5);
    g.fillRect(27, 31, 2, 5);
  });

  draw(scene, "egg", 18, 22, (g) => {
    g.fillStyle(0xfff3d6);
    g.fillEllipse(9, 12, 16, 20);
    g.lineStyle(1.5, 0xa07a48);
    g.strokeEllipse(9, 12, 16, 20);
    g.fillStyle(0xffffff, 0.8);
    g.fillEllipse(6, 8, 4, 6);
  });

  draw(scene, "corn", 8, 8, (g) => {
    g.fillStyle(0xf5c518);
    g.fillCircle(4, 4, 3.5);
  });

  // The feed bin: a wooden crate heaped with corn, 84 x 76, standing on its bottom edge.
  draw(scene, "feedbin", 84, 76, (g) => {
    g.fillStyle(0xf5c518);
    g.fillEllipse(42, 22, 74, 26);
    g.fillStyle(0xe0a800);
    for (let i = 0; i < 14; i++) g.fillCircle(14 + ((i * 37) % 56), 16 + ((i * 13) % 12), 3);
    g.fillStyle(0x8a5a2b);
    g.fillRect(4, 24, 76, 50);
    g.fillStyle(0x6e4520);
    g.fillRect(4, 24, 76, 6);
    g.fillRect(4, 46, 76, 4);
    g.fillRect(4, 68, 76, 6);
    g.fillRect(4, 24, 6, 50);
    g.fillRect(74, 24, 6, 50);
  });

  draw(scene, "pow", 96, 96, (g) => {
    g.fillStyle(0xff8c1a);
    star(g, 48, 48, 46, 24, 10);
    g.fillStyle(0xffe14d);
    star(g, 48, 48, 32, 18, 10);
  });

  draw(scene, "heart", 30, 28, (g) => heart(g, 15, 11, 13, 0xe63946));
  draw(scene, "heart-empty", 30, 28, (g) => heart(g, 15, 11, 13, 0x5a3b2e));

  draw(scene, "bucket", 28, 28, (g) => {
    g.fillStyle(0x9aa3ad);
    g.fillPoints([{ x: 3, y: 8 }, { x: 25, y: 8 }, { x: 22, y: 26 }, { x: 6, y: 26 }], true);
    g.fillStyle(0xf5c518);
    g.fillEllipse(14, 9, 21, 6);
    g.lineStyle(2, 0x6b737c);
    g.beginPath();
    g.arc(14, 9, 11, Math.PI, 0);
    g.strokePath();
  });

  draw(scene, "sun", 30, 30, (g) => {
    g.fillStyle(0xffd23f);
    star(g, 15, 15, 15, 10, 10);
    g.fillStyle(0xffe680);
    g.fillCircle(15, 15, 9);
  });

  draw(scene, "ring", 60, 60, (g) => {
    g.lineStyle(4, 0xffffff, 0.9);
    g.strokeCircle(30, 30, 26);
  });

  draw(scene, "raindrop", 4, 16, (g) => {
    g.fillStyle(0xbfd9ff, 0.8);
    g.fillRect(1, 0, 2, 16);
  });
  draw(scene, "snow", 8, 8, (g) => {
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 4);
  });
  draw(scene, "leaf", 12, 8, (g) => {
    g.fillStyle(0xe07b24);
    g.fillEllipse(6, 4, 12, 7);
  });
  draw(scene, "feather", 12, 6, (g) => {
    g.fillStyle(0xffffff);
    g.fillEllipse(6, 3, 12, 5);
  });
  draw(scene, "firefly", 6, 6, (g) => {
    g.fillStyle(0xf6ff8a);
    g.fillCircle(3, 3, 3);
  });

  // A soft round light, used to cut holes in the dark on night levels.
  if (!scene.textures.exists("light")) {
    const size = 320;
    const tex = scene.textures.createCanvas("light", size, size);
    const c = tex.getContext();
    const grad = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.55, "rgba(255,255,255,0.85)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = grad;
    c.fillRect(0, 0, size, size);
    tex.refresh();
  }
}
