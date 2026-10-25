// The sceneries. A scenery is a background, the spots where chickens live, where the feed bin
// stands, where wolves come from, and any weather. How hard a day is lives in js/rules.js; the
// sceneries just take turns. Adding a scenery is adding an entry here; once the artist draws a
// background, its `paint` can just place that picture.
//
// Coordinates are game pixels on the 540 x 960 portrait screen. The top 96 px is the score bar;
// the farm the chickens live on is roughly y 300 to 920.
//   spots   where chickens peck (8 each; a day with fewer chickens uses the first ones)
//   bin     the feed bin, where Uncle Bob refills his bucket
//   dens    where wolves come in from and run back to (just off the screen edge)
//   mud     ellipses { x, y, rx, ry } that slow Uncle Bob to half speed
//   weather "rain", "snow", "leaves", "fireflies" or none
//   dark    night: Uncle Bob carries a lantern and the rest of the farm is dark
//   line    id of Uncle Bob's line that opens the day (sayings/sayings.json)
import { W, H } from "./ui.js";

const SPOTS = [[110, 430], [430, 420], [270, 530], [96, 650], [444, 660], [270, 760], [130, 870], [420, 870]];

function layer(scene) {
  return scene.add.container(0, 0);
}

function sky(g, top, bottom, toY = 330) {
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, W, toY);
}

function ground(g, colour, fromY = 300) {
  g.fillStyle(colour);
  g.fillRect(0, fromY, W, H - fromY);
}

function tufts(g, colour, fromY = 320, n = 60) {
  g.fillStyle(colour);
  for (let i = 0; i < n; i++) {
    const x = (i * 97 + 31) % W;
    const y = fromY + ((i * 157) % (H - fromY));
    g.fillTriangle(x - 5, y, x - 1, y - 9, x + 2, y);
    g.fillTriangle(x, y, x + 4, y - 11, x + 7, y);
  }
}

function cloud(g, x, y, s = 1, colour = 0xffffff, alpha = 0.92) {
  g.fillStyle(colour, alpha);
  g.fillEllipse(x, y, 110 * s, 38 * s);
  g.fillEllipse(x + 28 * s, y - 15 * s, 66 * s, 40 * s);
  g.fillEllipse(x - 28 * s, y - 8 * s, 58 * s, 32 * s);
}

function hills(g, colour, y) {
  g.fillStyle(colour);
  g.fillEllipse(90, y, 400, 120);
  g.fillEllipse(420, y + 6, 460, 110);
}

// The big red barn, its door centred at x and its foot at y.
function barn(g, x, y, s = 1, colour = 0xb7322c) {
  const w = 200 * s;
  const h = 120 * s;
  g.fillStyle(0x7a2420);
  g.fillTriangle(x - w / 2 - 12 * s, y - h, x, y - h - 70 * s, x + w / 2 + 12 * s, y - h);
  g.fillStyle(colour);
  g.fillRect(x - w / 2, y - h, w, h);
  g.fillTriangle(x - w / 2, y - h, x, y - h - 60 * s, x + w / 2, y - h);
  g.fillStyle(0xf2efe6);
  g.fillRect(x - 40 * s, y - 80 * s, 80 * s, 80 * s);
  g.fillStyle(colour);
  g.fillRect(x - 34 * s, y - 74 * s, 32 * s, 74 * s);
  g.fillRect(x + 2 * s, y - 74 * s, 32 * s, 74 * s);
  g.lineStyle(5 * s, 0xf2efe6);
  g.lineBetween(x - 34 * s, y - 74 * s, x - 2 * s, y);
  g.lineBetween(x + 2 * s, y - 74 * s, x + 34 * s, y);
  g.fillStyle(0xf2efe6);
  g.fillRect(x - 18 * s, y - h - 40 * s, 36 * s, 26 * s);
  g.fillStyle(0x3b2a1e);
  g.fillRect(x - 14 * s, y - h - 36 * s, 28 * s, 18 * s);
}

// A little chicken coop on legs.
function coop(g, x, y) {
  g.fillStyle(0x6e4520);
  g.fillRect(x - 40, y - 20, 6, 20);
  g.fillRect(x + 34, y - 20, 6, 20);
  g.fillStyle(0xd9a05b);
  g.fillRect(x - 44, y - 70, 88, 52);
  g.fillStyle(0x8a3a2a);
  g.fillTriangle(x - 54, y - 68, x, y - 104, x + 54, y - 68);
  g.fillStyle(0x3b2a1e);
  g.fillRoundedRect(x - 12, y - 52, 24, 34, { tl: 12, tr: 12, bl: 0, br: 0 });
  g.lineStyle(4, 0x8a5a2b);
  g.lineBetween(x + 6, y - 18, x + 30, y + 10);
}

function fence(g, y, colour = 0xf2efe6, from = 0, to = W) {
  g.fillStyle(colour);
  for (let x = from + 8; x < to; x += 44) g.fillRect(x, y - 44, 9, 50);
  g.fillRect(from, y - 34, to - from, 8);
  g.fillRect(from, y - 16, to - from, 8);
}

function tree(g, x, y, s = 1, leaves = 0x3f8f35) {
  g.fillStyle(0x6e4520);
  g.fillRect(x - 8 * s, y - 50 * s, 16 * s, 50 * s);
  g.fillStyle(leaves);
  g.fillCircle(x, y - 80 * s, 38 * s);
  g.fillCircle(x - 30 * s, y - 60 * s, 28 * s);
  g.fillCircle(x + 30 * s, y - 60 * s, 28 * s);
}

function pine(g, x, y, s = 1, colour = 0x2f6b3a, snow = false) {
  g.fillStyle(0x5a3a1e);
  g.fillRect(x - 6 * s, y - 20 * s, 12 * s, 20 * s);
  for (let i = 0; i < 3; i++) {
    const top = y - 20 * s - (i + 1) * 30 * s;
    const half = (44 - i * 10) * s;
    g.fillStyle(colour);
    g.fillTriangle(x - half, top + 40 * s, x, top - 10 * s, x + half, top + 40 * s);
    if (snow) {
      g.fillStyle(0xffffff);
      g.fillTriangle(x - half * 0.45, top + 8 * s, x, top - 10 * s, x + half * 0.45, top + 8 * s);
    }
  }
}

function hay(g, x, y) {
  g.fillStyle(0xd9b44a);
  g.fillRoundedRect(x - 30, y - 34, 60, 36, 8);
  g.lineStyle(2, 0xb08d2e);
  g.lineBetween(x - 30, y - 22, x + 30, y - 22);
  g.lineBetween(x - 30, y - 10, x + 30, y - 10);
}

function pond(g, x, y, rx, ry) {
  g.fillStyle(0x6fa84f);
  g.fillEllipse(x, y, rx * 2 + 16, ry * 2 + 10);
  g.fillStyle(0x4a90c8);
  g.fillEllipse(x, y, rx * 2, ry * 2);
  g.fillStyle(0x8cc4ea, 0.7);
  g.fillEllipse(x - rx * 0.3, y - ry * 0.3, rx * 0.7, ry * 0.4);
}

function mudPuddles(g, mud) {
  for (const m of mud) {
    g.fillStyle(0x5a3a1e);
    g.fillEllipse(m.x, m.y, m.rx * 2, m.ry * 2);
    g.fillStyle(0x6e4a2a);
    g.fillEllipse(m.x - m.rx * 0.2, m.y - m.ry * 0.15, m.rx * 1.3, m.ry * 1.1);
    g.fillStyle(0x8a6440, 0.6);
    g.fillEllipse(m.x - m.rx * 0.35, m.y - m.ry * 0.35, m.rx * 0.5, m.ry * 0.35);
  }
}

function cornRow(g, y, colour = 0x6a9a2a, tassel = 0xe8c547) {
  for (let x = -10; x < W + 20; x += 22) {
    const h = 80 + ((x * 7) % 30);
    g.fillStyle(colour);
    g.fillRect(x, y - h, 5, h);
    g.fillTriangle(x + 2, y - h * 0.6, x - 16, y - h * 0.75, x + 2, y - h * 0.5);
    g.fillTriangle(x + 3, y - h * 0.4, x + 20, y - h * 0.55, x + 3, y - h * 0.3);
    g.fillStyle(tassel);
    g.fillTriangle(x - 2, y - h, x + 2.5, y - h - 12, x + 7, y - h);
  }
}

function pumpkin(g, x, y, s = 1) {
  g.fillStyle(0xe8771e);
  g.fillEllipse(x - 8 * s, y, 18 * s, 22 * s);
  g.fillEllipse(x + 8 * s, y, 18 * s, 22 * s);
  g.fillStyle(0xf28c2b);
  g.fillEllipse(x, y, 20 * s, 24 * s);
  g.fillStyle(0x4a7a2a);
  g.fillRect(x - 2 * s, y - 16 * s, 4 * s, 7 * s);
}

function farmhouse(g, x, y, lit = false) {
  g.fillStyle(0xf2e6c9);
  g.fillRect(x - 70, y - 90, 140, 90);
  g.fillStyle(0x4a5a7a);
  g.fillTriangle(x - 84, y - 88, x, y - 150, x + 84, y - 88);
  g.fillStyle(lit ? 0xffd36b : 0x8cc4ea);
  g.fillRect(x - 52, y - 70, 30, 28);
  g.fillRect(x + 22, y - 70, 30, 28);
  g.fillStyle(0x6e4520);
  g.fillRect(x - 14, y - 50, 28, 50);
}

// ---------------------------------------------------------------------------------------------

function paintBarnyard(scene, level) {
  const back = layer(scene);
  const g = scene.add.graphics();
  back.add(g);
  sky(g, 0x7ec8f0, 0xd4f0ff);
  g.fillStyle(0xfff3a0);
  g.fillCircle(80, 150, 34);
  cloud(g, 330, 140, 0.9);
  cloud(g, 470, 200, 0.6);
  hills(g, 0x8fd16a, 300);
  ground(g, 0x6cbf4e, 300);
  tufts(g, 0x58a83c);
  farmhouse(g, 430, 300);
  barn(g, 200, 300, 0.95);
  fence(g, 312, 0xf2efe6, 290, 380);
  coop(g, 470, 560);
  hay(g, 40, 320);
  hay(g, 76, 326);
  g.fillStyle(0xffe066);
  for (const [x, y] of [[60, 760], [500, 780], [220, 900], [360, 620], [30, 540]]) {
    g.fillCircle(x, y, 4);
    g.fillCircle(x + 9, y + 3, 4);
  }
  mudPuddles(g, level.mud);
  return { back };
}

function paintBigBarn(scene, level) {
  const back = layer(scene);
  const g = scene.add.graphics();
  back.add(g);
  sky(g, 0x5fb0e8, 0xffe2b0);
  g.fillStyle(0xffe680);
  g.fillCircle(460, 120, 30);
  cloud(g, 140, 130, 0.8);
  hills(g, 0x7cbf58, 292);
  for (const x of [20, 90, 500]) tree(g, x, 300, 0.8, 0x2f7a2a);
  ground(g, 0x62b246, 300);
  tufts(g, 0x4f9a36);
  barn(g, 300, 312, 1.15, 0xc0392b);
  pond(g, 110, 760, 80, 42);
  hay(g, 470, 380);
  hay(g, 440, 372);
  fence(g, 940, 0xe8e2d0);
  mudPuddles(g, level.mud);
  return { back };
}

function paintCorn(scene, level) {
  const back = layer(scene);
  const g = scene.add.graphics();
  back.add(g);
  sky(g, 0x8ccdf0, 0xf4e9c8);
  cloud(g, 120, 110, 0.7);
  cloud(g, 420, 160, 1);
  ground(g, 0x9bbf4a, 280);
  g.fillStyle(0x8aad3c);
  for (let y = 360; y < H; y += 70) g.fillRect(0, y, W, 4);
  cornRow(g, 300);
  cornRow(g, 330, 0x5f8f24);
  tufts(g, 0x7f9f34, 360, 40);
  // a scarecrow keeping watch
  g.fillStyle(0x6e4520);
  g.fillRect(266, 380, 8, 100);
  g.fillRect(230, 404, 80, 7);
  g.fillStyle(0x3a6ab0);
  g.fillRect(250, 400, 40, 44);
  g.fillStyle(0xe8c547);
  g.fillCircle(270, 386, 16);
  g.fillStyle(0x5a3a1e);
  g.fillEllipse(270, 372, 44, 9);
  g.fillRect(258, 356, 24, 16);
  for (const [x, y] of [[60, 900], [480, 900], [500, 560]]) pumpkin(g, x, y);
  g.fillStyle(0x222222);
  g.fillCircle(256, 302, 5);
  g.fillTriangle(250, 300, 262, 300, 266, 296);
  mudPuddles(g, level.mud);
  return { back };
}

function paintMud(scene, level) {
  const back = layer(scene);
  const g = scene.add.graphics();
  back.add(g);
  sky(g, 0x7a8796, 0xa9b3bd);
  cloud(g, 100, 120, 1.3, 0x5f6a78, 1);
  cloud(g, 330, 100, 1.5, 0x6a7584, 1);
  cloud(g, 500, 150, 1, 0x5f6a78, 1);
  hills(g, 0x5e8a4a, 300);
  ground(g, 0x557f3e, 300);
  tufts(g, 0x47703a);
  barn(g, 120, 300, 0.85, 0x9a2c26);
  coop(g, 450, 330);
  mudPuddles(g, level.mud);
  fence(g, 940, 0xbab4a2);
  return { back };
}

function paintNight(scene, level) {
  const back = layer(scene);
  const g = scene.add.graphics();
  back.add(g);
  sky(g, 0x0b1430, 0x2a3a6a);
  g.fillStyle(0xffffff, 0.8);
  for (const [x, y] of [[40, 130], [120, 200], [200, 110], [300, 170], [380, 120], [520, 200], [250, 240], [160, 270], [470, 260]]) g.fillCircle(x, y, 1.6);
  g.fillStyle(0xffd98a);
  g.fillCircle(430, 170, 46);
  g.fillStyle(0xf0c070, 0.6);
  g.fillCircle(416, 158, 9);
  g.fillCircle(446, 186, 6);
  hills(g, 0x1f3a2a, 300);
  ground(g, 0x2e5a2e, 300);
  tufts(g, 0x254a26);
  farmhouse(g, 120, 300, true);
  barn(g, 360, 304, 0.85, 0x7a2420);
  hay(g, 500, 400);
  for (const [x, y] of [[70, 560], [480, 760], [300, 900], [180, 700]]) pumpkin(g, x, y, 1.1);
  mudPuddles(g, level.mud);
  return { back };
}

function paintSnow(scene, level) {
  const back = layer(scene);
  const g = scene.add.graphics();
  back.add(g);
  sky(g, 0xa9c8e8, 0xe8f2fb);
  cloud(g, 400, 120, 1.1, 0xf4f8fc, 0.95);
  hills(g, 0xf4f8fc, 300);
  for (const x of [30, 500]) pine(g, x, 320, 0.9, 0x2f6b3a, true);
  ground(g, 0xeef4fa, 300);
  g.fillStyle(0xd8e4f0);
  for (let i = 0; i < 30; i++) g.fillEllipse((i * 131) % W, 340 + ((i * 71) % 600), 60, 12);
  barn(g, 270, 304, 0.9, 0xa8302a);
  g.fillStyle(0xffffff);
  g.fillTriangle(270 - 102, 304 - 108 - 6, 270, 304 - 108 - 64, 270 + 102, 304 - 108 - 6);
  // snowman
  g.fillStyle(0xffffff);
  g.fillCircle(470, 900, 34);
  g.fillCircle(470, 852, 25);
  g.fillCircle(470, 816, 18);
  g.fillStyle(0x222222);
  g.fillCircle(464, 812, 2.5);
  g.fillCircle(476, 812, 2.5);
  g.fillStyle(0xf28c2b);
  g.fillTriangle(470, 817, 470, 822, 486, 819);
  g.fillStyle(0xc0392b);
  g.fillRect(452, 830, 36, 7);
  mudPuddles(g, level.mud);
  return { back };
}

export const LEVELS = [
  {
    id: "barnyard", name: "Sunny Barnyard", line: "lets-go-feed",
    tip: "Tap a chicken to feed it, the feed bin to refill.\nDrag your finger to just walk.",
    paint: paintBarnyard, spots: SPOTS,
    bin: { x: 200, y: 360 }, dens: [{ x: -60, y: 560 }, { x: 600, y: 760 }],
    mud: [], weather: null,
  },
  {
    id: "bigbarn", name: "The Big Red Barn", line: "day-barn",
    tip: "NEW: THE WOLF!\nTap him to give him a punch.",
    paint: paintBigBarn,
    spots: [[120, 450], [440, 470], [270, 560], [300, 690], [460, 640], [250, 840], [80, 880], [440, 860]],
    bin: { x: 300, y: 372 }, dens: [{ x: -60, y: 520 }, { x: 600, y: 760 }, { x: -60, y: 900 }],
    mud: [], weather: null,
  },
  {
    id: "corn", name: "Corn Country", line: "day-corn",
    tip: "Well-fed chickens lay eggs: tap them!\n8 eggs fill the basket: a heart back.",
    paint: paintCorn, spots: [[100, 470], [440, 450], [160, 600], [400, 590], [270, 680], [90, 790], [450, 800], [270, 880]],
    bin: { x: 470, y: 400 }, dens: [{ x: 80, y: 260 }, { x: 460, y: 260 }, { x: -60, y: 700 }, { x: 600, y: 680 }],
    mud: [], weather: "leaves",
  },
  {
    id: "mud", name: "Muddy Monday", line: "day-mud",
    tip: "Mud slows you down: walk around it.\nAnd now the wolves come in pairs!",
    paint: paintMud, spots: [[90, 430], [440, 460], [270, 450], [110, 640], [430, 660], [270, 820], [100, 880], [440, 880]],
    bin: { x: 270, y: 360 }, dens: [{ x: -60, y: 560 }, { x: 600, y: 560 }, { x: 600, y: 900 }],
    mud: [{ x: 270, y: 610, rx: 110, ry: 50 }, { x: 110, y: 760, rx: 70, ry: 32 }, { x: 420, y: 770, rx: 80, ry: 36 }, { x: 330, y: 470, rx: 40, ry: 20 }],
    weather: "rain",
  },
  {
    id: "night", name: "Harvest Moon", line: "day-night",
    tip: "It's dark! Your lantern lights the way.\nWatch for glowing eyes.",
    paint: paintNight, spots: SPOTS,
    bin: { x: 120, y: 360 }, dens: [{ x: -60, y: 460 }, { x: 600, y: 470 }, { x: -60, y: 860 }, { x: 600, y: 860 }],
    mud: [], weather: "fireflies", dark: true,
  },
  {
    id: "snow", name: "Frosty Fields", line: "day-snow",
    tip: "Cold chickens get hungry fast.\nSnow slows you down a little.",
    paint: paintSnow, spots: [[100, 440], [440, 440], [270, 520], [120, 650], [420, 640], [270, 760], [110, 880], [380, 890]],
    bin: { x: 270, y: 370 }, dens: [{ x: -60, y: 500 }, { x: 600, y: 520 }, { x: -60, y: 800 }, { x: 600, y: 780 }],
    mud: [], weather: "snow", speed: 0.85,
  },
];

export function paintLevel(scene, level) {
  return level.paint(scene, level);
}
