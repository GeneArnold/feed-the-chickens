// The service worker: on the first visit it stores every file of the game on the phone, and from
// then on it answers from that copy, so the game starts with no internet at all. Uncle Bob's voice
// clips are read from sayings.json, so recording a new line needs no change here.
// VERSION must change whenever any file changes; the next online visit then fetches the new copy.
// Amplify does that on every release (amplify.yml stamps in the commit); "dev" is for local runs.
const VERSION = "chickens-dev";
const FILES = [
  "./",
  "index.html",
  "style.css",
  "manifest.webmanifest",
  "vendor/phaser.min.js",
  "js/main.js",
  "js/audio.js",
  "js/chicken.js",
  "js/config.js",
  "js/farmer.js",
  "js/gestures.js",
  "js/install.js",
  "js/levels.js",
  "js/online.js",
  "js/rules.js",
  "js/sayings.js",
  "js/share.js",
  "js/storage.js",
  "js/textures.js",
  "js/ui.js",
  "js/update.js",
  "js/version.js",
  "js/wolf.js",
  "js/scenes/BoardScene.js",
  "js/scenes/BootScene.js",
  "js/scenes/DayScene.js",
  "js/scenes/NameScene.js",
  "js/scenes/PauseScene.js",
  "js/scenes/PlayScene.js",
  "js/scenes/ResultsScene.js",
  "js/scenes/TitleScene.js",
  "sayings/sayings.json",
  "img/bob-head.png",
  "img/bob-walk.png",
  "img/bob-punch.png",
  "img/bob-pour.png",
  "img/hen.png",
  "img/hen-peck.png",
  "img/hen-flap.png",
  "img/wolf-sneak.png",
  "img/wolf-run.png",
  "img/wolf-dizzy.png",
  "img/mud-1.png",
  "img/mud-2.png",
  "img/water.png",
  "img/pumpkins-1.png",
  "img/pumpkins-2.png",
  "img/chick.png",
  "img/ribbon.png",
  "img/bg-barnyard.jpg",
  "img/bg-bigbarn.jpg",
  "img/bg-corn.jpg",
  "img/bg-mud.jpg",
  "img/bg-night.jpg",
  "img/bg-snow.jpg",
  "img/bg-chicks.jpg",
  "img/bg-pumpkin.jpg",
  "img/bg-fair.jpg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
];

async function voiceFiles() {
  const sayings = await (await fetch("sayings/sayings.json", { cache: "no-store" })).json();
  return Object.values(sayings)
    .filter(Array.isArray)
    .flat()
    .filter((s) => s.id && s.voiced)
    .map((s) => `sayings/voices/${s.id}.mp3`);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await cache.addAll([...FILES, ...(await voiceFiles())]);
    })(),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Cache first: the stored copy answers at once, online or not.
self.addEventListener("fetch", (event) => {
  // Only the game's own files; the family score service must always be asked fresh.
  // version.json, which says whether a newer release is out, is never answered from the stored copy.
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin || url.pathname.endsWith("/version.json")) return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || fetch(event.request)),
  );
});
