# Feed the Chickens

Uncle Bob's chickens are getting skinny. Walk around the farm feeding them before they starve
(skull and crossbones), and punch the wolf when he sneaks in to carry one off. A Fun Shed game, made
for Uncle Bob, who loves chickens.

Plain HTML and JavaScript with [Phaser 3.90](https://phaser.io) saved in `vendor/`. There is no
build step, it installs on phones as an app, and it plays offline. Built the same way as Fruitcake
Flingers (`../family-holiday-game`).

## Run it on a computer

```
python3 tools/serve.py
```

Open http://127.0.0.1:8795 (or `http://<this computer's address>:8795` on a phone on the home
network) and click where you'd tap. Extras in the address:

- `?debug` outlines every chicken spot, the feed bin's tap area, the wolf dens and the mud.
- `?day=5` starts on day 5, for trying the later days.

On localhost and plain http the offline cache is switched off, so edits show up on a plain reload.

## How to play

- **First time:** your three initials, arcade style: tap the arrows to change a letter, tap a
  letter to pick it, then DONE (swiping works too).
- **Title:** Uncle Bob says "Hey, let's go feed those chickens!" Big PLAY and HIGH SCORES buttons (or swipe up
  and down). Tap your initials to change them.
- **Each day** opens with a card: the day, the scenery, what's in store, and a line from Uncle Bob.
  It starts the day by itself after a few seconds (longer on day 1); TAP TO FEED skips the wait.
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
- **II** (top left) pauses: KEEP PLAYING, QUIT (ends the game with the score saved), or SOUND ON/OFF. The
  phone's back gesture pauses too, and so does switching to another app.
- A starved or stolen chicken costs a heart. You start with 3. Lose them all and it's game over.
- At **sundown** each chicken still alive is worth 100. A day without losing any is a PERFECT DAY:
  250 more and a heart back (up to 5).
- **After a game:** big buttons (the Fun Shed's standard results screen): PLAY AGAIN (or swipe
  up), TRASH TALK to text your score with a dare link, HIGH SCORES and MENU. A dare link like `…/?beat=GEN-4250` puts
  "GEN DARES YOU: BEAT 4,250" on the title screen.

## How it gets harder

Each day is one of nine sceneries, in order, and each brings something new:

| Day | Scenery | What's new |
|---|---|---|
| 1 | Sunny Barnyard | 3 chickens, no wolf: learn to feed and refill |
| 2 | The Big Red Barn | the wolf arrives |
| 3 | Corn Country | 5 chickens, two wolves can be out at once, eggs to grab |
| 4 | Muddy Monday | rain, mud that slows Uncle Bob to half speed, wolves come in pairs |
| 5 | Harvest Moon | night: only Uncle Bob's lantern lights the farm; wolves' eyes glow; up to 3 wolves |
| 6 | Frosty Fields | snow slows him a little, 7 chickens, a smaller bucket |
| 7 | Spring Chicks | every hen has two chicks trotting after her (just for looks) |
| 8 | Pumpkin Patch | 8 chickens; pumpkin vines that slow Uncle Bob like mud, somewhere new each time |
| 9 | County Fair | one prize hen with a blue ribbon, worth double to feed |
| 10+ | round again | the same sceneries, about 4% hungrier every day, another wolf every third day (up to 5), packs of 3 from day 13 |

Days 6 to 9 only creep up, so a new scenery never comes with a big jump in how hard it is.

Within a day the chickens get hungrier as the sun goes down. All the numbers are in `DAYS` in
`js/rules.js`; `node tools/test-rules.mjs` checks the game only ever gets harder, and from day 7
on never by much in one day.

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

## High scores stay on the phone

Each phone is its own arcade cabinet: its top 10 and its farm totals live on that phone, and to get
on its board you play on it (the Fun Shed house kit, v1.2). The game talks to no server; the only
request besides its own files is the `version.json` check for updates, which adds `&app=1` when
the game runs from the home screen so the Fun Shed can count plays. Trash talk is the social part.

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
| `img/` | The cartoon art: Uncle Bob, the hens, the wolf, chicks, the prize ribbon, mud, puddles, pumpkin vines, and one background per scenery (`bg-<id>.jpg`) |
| `js/textures.js` | Art drawn in code: the feed bin, skull, eggs, corn, weather; and stand-ins for any missing picture |
| `js/audio.js` | Placeholder sound effects (clucks, howls, punches), and the voice clips |
| `js/storage.js` | What the phone remembers: initials, its top 10, totals, unsent games |
| `js/share.js` | Trash talk: the share sheet (or a text message), the score picture, dare links |
| `js/update.js`, `js/version.js` | The version on the title screen, the check for a newer release, the update button |
| `js/install.js` | The title screen's "install me" hint for phones playing in a browser tab: a one-tap install on Chrome for Android, otherwise a "how to install" link to https://thefunshed.com/install |
| `js/config.js` | Where the game lives (for dare links) |
| `sw.js`, `manifest.webmanifest` | Offline play and installing as an app |
| `amplify.yml` | How Amplify publishes a push |
| `tools/` | Serves the game for testing, makes the art, records the voices, draws the icons, tests the rules |

## Changing things

- **How hard it is:** change the numbers in `DAYS` in `js/rules.js`, then
  `node tools/test-rules.mjs`.
- **A scenery:** make its background, `img/bg-<id>.jpg`, then add an entry to `LEVELS` in
  `js/levels.js` with 8 chicken spots, a feed bin on the grass, and wolf dens just off the screen
  edge, and a row to `DAYS` in `js/rules.js`. Add the picture to `sw.js`. Check the spots with
  `?debug`.
- **The art:** made on cerebro's SwarmUI (Z-Image Turbo) with `python3 tools/swarm.py <name>
  "<prompt>"`, which saves 4 tries to `art/source/gen/` (git ignores `art/source/`). Then
  `python3 tools/cutout.py art/source/gen/<pick>.png <sprite name>` turns the white background
  transparent and saves `img/<sprite name>.png`. Every character faces right. A background is saved
  straight to `img/bg-<scenery id>.jpg` (768 x 1344, with `--raw --w 768 --h 1344`);
  `tools/nofence.py` paints a fence along the bottom out of a background. `BootScene` lists the
  sprites (`SPRITES`) and loads every scenery's background.
- **Uncle Bob's face:** made from a family photo with SwarmUI (Flux, image-to-image) and put on
  his cartoon body. The photo and the working files stay on Gene's computer in `art/source/`,
  which git ignores: only the cartoon is ever published.
- **A line for Uncle Bob:** add it to `sayings/sayings.json` with a short `id`, then
  `node tools/make-voices.mjs` records just the new lines. Chatterbox runs on cerebro
  (http://192.168.40.110:8004). His voice is set at the top of that script (now Jeremiah, slowed
  a touch). `node tools/make-voices.mjs --samples` records the opening line in six voices into
  `sayings/voice-samples/` to pick from; change `VOICE`, then `--force` re-records everything.
- **The icons:** `python3 tools/make-icons.py`.
