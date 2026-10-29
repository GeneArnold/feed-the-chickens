// Checks the difficulty climbs and the scoring adds up. Run:  node tools/test-rules.mjs
import assert from "node:assert/strict";
import { DAYS, POWERS, dayRules, drainAt, feedPoints, pickPower, powerUpsFor, sceneryIndex, sundown } from "../js/rules.js";

let prev = null;
for (let day = 1; day <= 30; day++) {
  const r = dayRules(day);
  assert.equal(r.day, day);
  assert.ok(r.chickens >= 3 && r.chickens <= 8, `day ${day}: ${r.chickens} chickens`);
  assert.ok(r.bucket >= 1);
  assert.ok(r.pack >= 1 && (r.maxWolves === 0 || r.pack <= r.maxWolves), `day ${day}: pack bigger than the wolves allowed`);
  if (prev) {
    assert.ok(r.drain >= prev.drain, `day ${day}: drain went down`);
    assert.ok(r.chickens >= prev.chickens, `day ${day}: fewer chickens`);
    assert.ok(r.maxWolves >= prev.maxWolves, `day ${day}: fewer wolves`);
    assert.ok(r.pack >= prev.pack, `day ${day}: smaller packs`);
    if (prev.wolfEvery) assert.ok(r.wolfEvery[1] <= prev.wolfEvery[1], `day ${day}: wolves came slower`);
  }
  prev = r;
}
assert.equal(dayRules(1).wolfEvery, null, "day 1 has no wolf");
assert.ok(dayRules(2).wolfEvery, "the wolf arrives on day 2");
assert.ok(dayRules(4).pack >= 2, "wolves come in pairs by day 4");
assert.ok(dayRules(15).maxWolves > dayRules(9).maxWolves, "more wolves on the later days");
assert.ok(dayRules(40).wolfEvery[0] >= 4, "wolves never come more than every 4 seconds");

assert.equal(sceneryIndex(1, 9), 0);
assert.equal(sceneryIndex(9, 9), 8);
assert.equal(sceneryIndex(10, 9), 0);

const r = dayRules(1);
assert.equal(drainAt(r, 0), r.drain);
assert.ok(Math.abs(drainAt(r, r.dayLength) - r.drain * 1.3) < 1e-9);
assert.ok(Math.abs(drainAt(r, 999) - r.drain * 1.3) < 1e-9);

assert.equal(feedPoints(100), 10);
assert.equal(feedPoints(50), 35);
assert.equal(feedPoints(10), 105, "close call bonus");
assert.ok(feedPoints(1) > feedPoints(20));

assert.deepEqual(sundown(4, 0), { points: 650, perfect: true });
assert.deepEqual(sundown(3, 1), { points: 300, perfect: false });
assert.deepEqual(sundown(0, 0), { points: 0, perfect: false });

// A fresh chicken must last a good while on every day of the first trip round.
for (let i = 0; i < DAYS.length; i++) {
  const rules = dayRules(i + 1);
  assert.ok(100 / drainAt(rules, rules.dayLength) > 15, `day ${i + 1}: chickens starve too fast`);
}
// From the last new scenery on, no day is a big jump: at most one more chicken, one more wolf, 10% hungrier.
for (let day = 7; day <= 30; day++) {
  const [a, b] = [dayRules(day - 1), dayRules(day)];
  assert.ok(b.chickens - a.chickens <= 1 && b.maxWolves - a.maxWolves <= 1, `day ${day}: too big a jump`);
  assert.ok(b.drain <= a.drain * 1.1, `day ${day}: too much hungrier`);
}
// Power-ups: none on day 1, more on the harder days; never the one already going; all can turn up.
assert.equal(powerUpsFor(1), 0);
for (let day = 2; day < 30; day++) assert.ok(powerUpsFor(day + 1) >= powerUpsFor(day), `day ${day}: fewer power-ups`);
assert.ok(powerUpsFor(8) >= 2, "help on the hard days");
for (let r = 0; r < 1; r += 0.01) assert.notEqual(pickPower("dog", r), "dog");
assert.deepEqual(new Set(Array.from({ length: 100 }, (_, i) => pickPower(null, i / 100))), new Set(Object.keys(POWERS)));
console.log("rules ok");
