# Feed the Chickens

Uncle Bob's chickens are getting skinny. Walk around the farm feeding them before they starve
(skull and crossbones), and punch the wolf when he sneaks in to carry one off. A Fun Shed game, made
for Uncle Bob, who loves chickens.

Plain HTML and JavaScript with [Phaser 3.90](https://phaser.io) saved in `vendor/`. There is no
build step, it installs on phones as an app, and it plays offline. Built the same way as Fruitcake
Flingers (`../family-holiday-game`).

## Run it on a computer

```
python3 -m http.server 8794 --bind 0.0.0.0
```

Open http://127.0.0.1:8794 (or `http://<this computer's address>:8794` on a phone on the home
network) and click where you'd tap. Extras in the address:

- `?debug` outlines every chicken spot, the feed bin's tap area, the wolf dens and the mud.
- `?day=5` starts on day 5, for trying the later days.

On localhost and plain http the offline cache is switched off, so edits show up on a plain reload.

## How to play

- **First time:** swipe in your three initials, arcade style (↑ ↓ change a letter, → next).
- **Title:** Uncle Bob says "Hey, let's go feed those chickens!" Swipe up (or tap) to play, down
  for the high scores. Tap your initials to change them.
- **Each day** opens with a card: the day, the scenery, what's in store, and a line from Uncle Bob.
- **On the farm**, drag your finger and Uncle Bob just walks along under it. Tap and he walks over
  and does something:
  - tap a **chicken** and he feeds it (one scoop from the bucket). The bar over it is how fat it is;
    it flashes red when it's hungry. The hungrier it was, the more points; a last-second save is a
    CLOSE CALL. A chicken that's still full says so, and no scoop is wasted.
  - tap the **feed bin** to fill the bucket back up when it's empty.
  - tap the **wolf** and he runs over and punches him. If the wolf had a chicken in his mouth, he
    drops it: a RESCUE.
  - well-fed chickens lay **eggs**, rolled out to one side. Tap one (or walk over it) to pick it
    up: 50 points, and every 8 eggs fill the basket (top right) for a heart back, or 500 points
    when your hearts are full.
- **II** (top left) pauses: KEEP PLAYING, or QUIT, which ends the game with the score saved. The
  phone's back gesture pauses too, and so does switching to another app.
- A starved or stolen chicken costs a heart. You start with 3. Lose them all and it's game over.
- At **sundown** each chicken still alive is worth 100. A day without losing any is a PERFECT DAY:
  250 more and a heart back (up to 5).
- **After a game:** swipe up to play again, down for the high scores, left (or tap TRASH TALK) to
  text your score with a dare link, right for the menu. A dare link like `…/?beat=GEN-4250` puts
  "GEN DARES YOU: BEAT 4,250" on the title screen.

## How it gets harder

Each day is one of six sceneries, in order, and each brings something new:

| Day | Scenery | What's new |
|---|---|---|
| 1 | Sunny Barnyard | 3 chickens, no wolf: learn to feed and refill |
| 2 | The Big Red Barn | the wolf arrives |
| 3 | Corn Country | 5 chickens, two wolves can be out at once, eggs to grab |
| 4 | Muddy Monday | rain, mud that slows Uncle Bob to half speed, wolves come in pairs |
| 5 | Harvest Moon | night: only Uncle Bob's lantern lights the farm; wolves' eyes glow; up to 3 wolves |
| 6 | Frosty Fields | snow slows him a little, 7 chickens, a smaller bucket |
| 7+ | round again | the same sceneries, about 8% hungrier every day, up to 8 chickens, up to 5 wolves in packs of 3 |

Within a day the chickens get hungrier as the sun goes down. All the numbers are in `DAYS` in
`js/rules.js`; `node tools/test-rules.mjs` checks the game only ever gets harder.

## Releasing

Same as Fruitcake:

- A private GitHub repo, `GeneArnold/feed-the-chickens`. **Every push to `main` is a release.**
- Its own Amplify Hosting app in the **Entertainment** AWS account (us-east-2), connected to the
  repo in the Amplify console. `amplify.yml` copies the game's files and stamps the commit into
  `sw.js`, and writes the commit and release time into `js/version.js` and `version.json`.
- Installed phones: the bottom of the title screen shows the version (the release's date and time).
  The game asks the site for `version.json` when the title screen opens and whenever the game comes
  back to the front; if a newer release is out, an orange **NEW VERSION! TAP TO UPDATE** button
  appears, which throws away the stored copy and reloads. Tapping the version checks on demand.
  A copy installed before this button existed needs one uninstall and reinstall.
- At **https://chickens.thefunshed.com**:
  `aws amplify create-domain-association --profile entertainment --region us-east-2 --app-id <id> --domain-name thefunshed.com --sub-domain-settings prefix=chickens,branchName=main`
- Then the card on the Fun Shed home page (`shed/site/index.html`) flips to "Play now".

## The family score board

Online high scores go through the shared **Shed service** at `https://api.thefunshed.com` (the
`shed` repo), where this game is the `chickens` app (`scoresUrl` in `js/config.js`; set it to
`null` to keep the board on the phone). A finished game posts its score and its `farm` counters
(chickens fed, wolves punched, eggs found) in one request (`POST /v1/chickens/scores`). Games
played with no signal wait on the phone and post the next time the game opens.

## Files

| File | What it does |
|---|---|
| `js/rules.js` | How hard each day is, and the points. Tune the game here (tested by `node tools/test-rules.mjs`) |
| `js/levels.js` | The sceneries: background, chicken spots, feed bin, wolf dens, mud, weather. Add a scenery here |
| `js/chicken.js` | One chicken: pecks about, gets skinny, flashes when hungry, dies, gets carried off |
| `js/wolf.js` | The wolf: sneaks in, grabs a chicken, drags it home, runs off when punched |
| `js/farmer.js` | Uncle Bob: walks where you tap, carries the bucket, punches |
| `js/scenes/` | Boot, Name (initials), Title, Day (the card before each day), Play, Pause, Results, Board |
| `sayings/sayings.json` | Uncle Bob's lines, by when he says them; `trash` lines are for texting a score |
| `sayings/voices/` | Uncle Bob's recorded lines, one mp3 per line |
| `js/sayings.js` | Picks a line and finds its recording |
| `js/textures.js` | Art drawn in code: Uncle Bob's body (with his cartoon face), chickens, the wolf, skull, eggs, corn |
| `img/bob-head.png` | Uncle Bob's cartoon face |
| `js/audio.js` | Placeholder sound effects (clucks, howls, punches), and the voice clips |
| `js/storage.js` | What the phone remembers: initials, its top 10, totals, unsent games |
| `js/online.js` | Talks to the Shed service; queues games while offline |
| `js/share.js` | Trash talk: the share sheet (or a text message), the score picture, dare links |
| `js/update.js`, `js/version.js` | The version on the title screen, the check for a newer release, the update button |
| `js/install.js` | The title screen's "install me" hint, for phones playing in a browser tab |
| `js/config.js` | Where the game lives (for dare links) and the Shed service's address |
| `sw.js`, `manifest.webmanifest` | Offline play and installing as an app |
| `amplify.yml` | How Amplify publishes a push |
| `tools/` | Records the voices, draws the icons, tests the rules |

## Changing things

- **How hard it is:** change the numbers in `DAYS` in `js/rules.js`, then
  `node tools/test-rules.mjs`.
- **A scenery:** add an entry to `LEVELS` in `js/levels.js` with a `paint` function, 8 chicken
  spots, a feed bin, and wolf dens just off the screen edge. Check the spots with `?debug`.
  For the artist's art, replace `paint` with one that places the picture.
- **Real art:** load the artist's pictures in `BootScene` under the same names (`bob`,
  `bob-punch`, `bob-big`, `chicken`, `wolf`, `wolf-dizzy`, `skull`, …) and delete the drawing in
  `js/textures.js`.
- **Uncle Bob's face:** `img/bob-head.png`, a cartoon made from a family photo with SwarmUI on
  cerebro (Flux, image-to-image), cut out and put on the drawn body (`makeBob` in
  `js/textures.js`). The photo and the working files stay on Gene's computer in `art/source/`,
  which git ignores: only the cartoon is ever published.
- **A line for Uncle Bob:** add it to `sayings/sayings.json` with a short `id`, then
  `node tools/make-voices.mjs` records just the new lines. Chatterbox runs on cerebro
  (http://192.168.40.110:8004). His voice is set at the top of that script (now Jeremiah, slowed
  a touch). `node tools/make-voices.mjs --samples` records the opening line in six voices into
  `sayings/voice-samples/` to pick from; change `VOICE`, then `--force` re-records everything.
- **The icons:** `python3 tools/make-icons.py`.
