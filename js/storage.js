// Everything the game remembers, in localStorage on this phone only.
// The browser may clear it (clearing site data, or uninstalling the app); that only costs scores.
const KEY = "chickens.v1";
const BOARD_SIZE = 10;

const DEFAULTS = {
  player: null,    // { initials }: who plays on this phone
  sound: true,
  board: [],       // this phone's top 10, [{ initials, score, day, at }], best first
  totals: { fed: 0, punched: 0, eggs: 0, lost: 0, games: 0, bestDay: 0 },
  challenge: null, // { initials, score } from a dare link, until it is played
};

let cache = null;

function load() {
  if (cache) return cache;
  try {
    cache = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked (private window): keep playing, just without saving.
  }
}

export function get(name) {
  return load()[name];
}

export function set(name, value) {
  load()[name] = value;
  persist();
}

export function setInitials(initials) {
  const data = load();
  data.player = { initials };
  persist();
}

export function board() {
  return load().board;
}

export function topScore() {
  return Math.max(0, ...load().board.map((r) => r.score));
}

// Saves a finished game. stats: { fed, punched, eggs, lost }.
// → { rank (1-10, or 0 if it missed the board), previousTop }
export function recordGame(score, day, stats) {
  const data = load();
  const previousTop = topScore();
  const entry = { initials: data.player.initials, score, day, at: Date.now() };
  if (score > 0) {
    data.board = [...data.board, entry].sort((a, b) => b.score - a.score || a.at - b.at).slice(0, BOARD_SIZE);
  }
  const t = { ...DEFAULTS.totals, ...data.totals };
  for (const k of ["fed", "punched", "eggs", "lost"]) t[k] += stats[k] || 0;
  t.games++;
  t.bestDay = Math.max(t.bestDay, day);
  data.totals = t;
  persist();
  return { rank: score > 0 ? data.board.indexOf(entry) + 1 : 0, previousTop };
}
