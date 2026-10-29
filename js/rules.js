// How hard each day is, and how points are scored. Pure functions with no Phaser, so they can be
// tested on their own (node tools/test-rules.mjs).
//
// A game is a run of days. Each day is one scenery from js/levels.js; after the last scenery the
// sceneries come round again, a little harder every day, for as long as you last.
// Tuning the game is changing the numbers in DAYS.

export const START_HEARTS = 3;
export const MAX_HEARTS = 5;

// One row per day of the first trip round the farm, one per scenery.
//   chickens   how many to look after (each scenery has 8 spots)
//   drain      weight lost per second (a fed chicken is 100; at 0 it dies)
//   wolfEvery  [min, max] seconds between wolves; null means no wolf yet
//   firstWolf  seconds into the day before the first wolf
//   maxWolves  how many wolves can be on the farm at once
//   pack       how many wolves come in together each time
//   wolfSpeed  pixels per second while sneaking (dragging a chicken is slower)
//   bucket     scoops of feed the bucket holds; refill at the feed bin
//   dayLength  seconds from sunrise to sundown
export const DAYS = [
  { chickens: 3, drain: 3.0, wolfEvery: null, firstWolf: 0, maxWolves: 0, pack: 1, wolfSpeed: 0, bucket: 6, dayLength: 40 },
  { chickens: 4, drain: 3.4, wolfEvery: [16, 22], firstWolf: 10, maxWolves: 1, pack: 1, wolfSpeed: 55, bucket: 6, dayLength: 50 },
  { chickens: 5, drain: 3.7, wolfEvery: [12, 18], firstWolf: 8, maxWolves: 2, pack: 1, wolfSpeed: 62, bucket: 5, dayLength: 55 },
  { chickens: 5, drain: 4.0, wolfEvery: [10, 15], firstWolf: 7, maxWolves: 2, pack: 2, wolfSpeed: 66, bucket: 5, dayLength: 55 },
  { chickens: 6, drain: 4.2, wolfEvery: [10, 14], firstWolf: 6, maxWolves: 3, pack: 2, wolfSpeed: 70, bucket: 5, dayLength: 60 },
  { chickens: 7, drain: 4.4, wolfEvery: [9, 13], firstWolf: 6, maxWolves: 3, pack: 2, wolfSpeed: 74, bucket: 4, dayLength: 60 },
  { chickens: 7, drain: 4.5, wolfEvery: [9, 13], firstWolf: 6, maxWolves: 3, pack: 2, wolfSpeed: 75, bucket: 4, dayLength: 60 },
  { chickens: 8, drain: 4.5, wolfEvery: [9, 12], firstWolf: 6, maxWolves: 3, pack: 2, wolfSpeed: 76, bucket: 4, dayLength: 60 },
  { chickens: 8, drain: 4.6, wolfEvery: [8, 12], firstWolf: 6, maxWolves: 3, pack: 2, wolfSpeed: 78, bucket: 4, dayLength: 60 },
];

const MAX_CHICKENS = 8;
const MAX_WOLVES = 5;
const MAX_PACK = 3;

// The rules for day 1, 2, 3, ... Past the last row, every extra day is about 4% hungrier and
// wolfier, with another wolf every third day, and bigger packs every fourth.
export function dayRules(day) {
  const i = Math.max(0, day - 1);
  const base = DAYS[Math.min(i, DAYS.length - 1)];
  const extra = Math.max(0, i - (DAYS.length - 1));
  return {
    ...base,
    day: i + 1,
    extra,
    chickens: Math.min(MAX_CHICKENS, base.chickens + Math.floor((extra + 1) / 2)),
    drain: base.drain * (1 + 0.04 * extra),
    wolfEvery: base.wolfEvery && base.wolfEvery.map((s) => Math.max(4, s * 0.96 ** extra)),
    maxWolves: Math.min(MAX_WOLVES, base.maxWolves + Math.floor(extra / 3)),
    pack: Math.min(MAX_PACK, base.pack + Math.floor(extra / 4)),
    wolfSpeed: base.wolfSpeed * (1 + 0.02 * extra),
  };
}

// Which scenery a day uses: the sceneries in order, then round again.
export function sceneryIndex(day, count) {
  return (Math.max(1, day) - 1) % count;
}

// Chickens get hungrier as the day goes on: 30% faster by sundown than at sunrise.
export function drainAt(rules, seconds) {
  return rules.drain * (1 + (0.3 * Math.min(seconds, rules.dayLength)) / rules.dayLength);
}

// Feeding fills a chicken right up. The hungrier it was, the more it's worth, and saving one at
// the very last moment is a CLOSE CALL.
export const CLOSE_CALL = 15;
export function feedPoints(weight) {
  const w = Math.max(0, Math.min(100, weight));
  return 10 + Math.round((100 - w) / 2) + (w < CLOSE_CALL ? 50 : 0);
}

// Every few eggs fill the basket, and a full basket gives back a heart.
export const EGGS_PER_BASKET = 8;

export const POINTS = {
  punch: 75,     // a wolf sent running
  rescue: 50,    // more if he had a chicken in his mouth
  egg: 50,
  basket: 500,  // a full egg basket when your hearts are already full
  saved: 100,    // each chicken alive at sundown
  perfect: 250,  // no chicken lost all day; also gives back a heart
};

// What sundown is worth. → { points, perfect }
export function sundown(alive, lostToday) {
  const perfect = alive > 0 && lostToday === 0;
  return { points: alive * POINTS.saved + (perfect ? POINTS.perfect : 0), perfect };
}

// Power-ups: now and then one lies on the farm for a few seconds, and Uncle Bob has to walk over
// and pick it up. One at a time: picking one up ends the one going. None on day 1; more turn up on
// the harder days. All of them end at sundown.
//   seconds  how long it lasts (0: it happens at once)
//   weight   how likely it is to be the one that turns up
//   says     what pops up when he picks it up
export const POWERS = {
  superfeed: { seconds: 0, weight: 1, says: "SUPER FEED!" },        // every chicken fed full
  sneakers: { seconds: 8, weight: 3, says: "SPEEDY SNEAKERS!" },    // Uncle Bob runs faster
  dog: { seconds: 10, weight: 2, says: "GUARD DOG!" },              // a dog that chases off every wolf
  bucket: { seconds: 8, weight: 2, says: "BOTTOMLESS BUCKET!" },    // a full bucket that never runs out
};
export const SNEAKER_SPEED = 1.6; // how much faster Uncle Bob goes in sneakers
export const POWER_LIES = 9;      // seconds a power-up lies on the farm before it's gone

// How many power-ups turn up on a day.
export function powerUpsFor(day) {
  return day < 2 ? 0 : day < 4 ? 1 : day < 6 ? 2 : day < 8 ? 3 : 4;
}

// Which power-up turns up: by weight, never the one already going. `roll` is 0..1.
export function pickPower(active, roll) {
  const names = Object.keys(POWERS).filter((n) => n !== active);
  const total = names.reduce((s, n) => s + POWERS[n].weight, 0);
  let r = roll * total;
  for (const n of names) {
    r -= POWERS[n].weight;
    if (r < 0) return n;
  }
  return names.at(-1);
}
