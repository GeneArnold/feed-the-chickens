// How hard each day is, and how points are scored. Pure functions with no Phaser, so they can be
// tested on their own (node tools/test-rules.mjs).
//
// A game is a run of days. Each day is one scenery from js/levels.js; after the last scenery the
// sceneries come round again, a little harder every day, for as long as you last.
// Tuning the game is changing the numbers in DAYS.

export const START_HEARTS = 3;
export const MAX_HEARTS = 5;

// One row per day of the first trip round the farm.
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
];

const MAX_CHICKENS = 8;
const MAX_WOLVES = 5;
const MAX_PACK = 3;

// The rules for day 1, 2, 3, ... Past the last row, every extra day is about 8% hungrier and
// wolfier, with another chicken and another wolf every other day, and bigger packs every third.
export function dayRules(day) {
  const i = Math.max(0, day - 1);
  const base = DAYS[Math.min(i, DAYS.length - 1)];
  const extra = Math.max(0, i - (DAYS.length - 1));
  return {
    ...base,
    day: i + 1,
    extra,
    chickens: Math.min(MAX_CHICKENS, base.chickens + Math.floor((extra + 1) / 2)),
    drain: base.drain * (1 + 0.08 * extra),
    wolfEvery: base.wolfEvery && base.wolfEvery.map((s) => Math.max(4, s * 0.92 ** extra)),
    maxWolves: Math.min(MAX_WOLVES, base.maxWolves + Math.floor((extra + 1) / 2)),
    pack: Math.min(MAX_PACK, base.pack + Math.floor(extra / 3)),
    wolfSpeed: base.wolfSpeed * (1 + 0.04 * extra),
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
