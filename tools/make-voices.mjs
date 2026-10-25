// Records Uncle Bob's lines with Chatterbox on cerebro.
// Run from the project folder:  node tools/make-voices.mjs [--force] [--samples]
// Writes sayings/voices/<saying id>.mp3 and marks each recorded line "voiced": true in
// sayings/sayings.json. Lines already recorded are skipped unless --force is given.
// --samples records just the opening line in a handful of voices into sayings/voice-samples/,
// for picking the one that sounds most like Uncle Bob; then set VOICE below and run --force.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CHATTERBOX = process.env.CHATTERBOX_URL || "http://192.168.40.110:8004";
const SAMPLE_RATE = 24000;

// Uncle Bob's voice, and how much it is slowed (below 1 = deeper and slower, a bit older).
const VOICE = { voice: "Jeremiah.wav", pitch: 0.94 };
const SAMPLE_VOICES = ["Jeremiah.wav", "Everett.wav", "Thomas.wav", "Henry.wav", "Michael.wav", "Alexander.wav"];
const SPOKEN = ["day", "feed", "close", "punch", "wolf", "empty", "egg", "lost", "stolen", "sundown", "gameover"];

const args = process.argv.slice(2);
const force = args.includes("--force");
const sayingsPath = "sayings/sayings.json";
const sayings = JSON.parse(readFileSync(sayingsPath, "utf8"));
const tmp = "sayings/.raw.wav";

async function record(text, { voice, pitch }, out) {
  const res = await fetch(`${CHATTERBOX}/v1/audio/speech`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: "chatterbox", input: text, voice, response_format: "wav", speed: 1.0 }),
  });
  if (!res.ok) throw new Error(`Chatterbox said HTTP ${res.status} for "${text}" (${voice})`);
  writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  // change the pitch, trim the silence at the start, and even out the loudness between clips
  const filters = [
    `asetrate=${SAMPLE_RATE}*${pitch}`, `aresample=${SAMPLE_RATE}`,
    "silenceremove=start_periods=1:start_threshold=-45dB", "loudnorm=I=-16:TP=-1.5",
  ].join(",");
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", tmp, "-af", filters, "-ac", "1", "-c:a", "libmp3lame", "-q:a", "5", out]);
}

if (args.includes("--samples")) {
  mkdirSync("sayings/voice-samples", { recursive: true });
  const line = sayings.day[0].text;
  for (const voice of SAMPLE_VOICES) {
    const out = `sayings/voice-samples/${voice.replace(".wav", "")}.mp3`;
    await record(line, { voice, pitch: VOICE.pitch }, out);
    console.log(out);
  }
} else {
  mkdirSync("sayings/voices", { recursive: true });
  let made = 0;
  for (const kind of SPOKEN) {
    for (const line of sayings[kind] || []) {
      const out = `sayings/voices/${line.id}.mp3`;
      if (!force && existsSync(out)) continue;
      await record(line.text, VOICE, out);
      made++;
      console.log(line.text);
    }
  }
  // Mark which lines have a clip, so the game (and the offline cache) know what to load.
  for (const kind of SPOKEN) {
    for (const line of sayings[kind] || []) {
      if (existsSync(`sayings/voices/${line.id}.mp3`)) line.voiced = true;
      else delete line.voiced;
    }
  }
  let json = JSON.stringify(sayings, null, 2);
  // one line per saying, as the file is written by hand
  json = json.replace(/\{\s*\n\s*("id": [^\n]+)\n\s*("text": [^\n]+?),?\n\s*("voiced": true)\s*\n\s*\}/g, "{ $1 $2, $3 }");
  json = json.replace(/\{\s*\n\s*("id": [^\n]+)\n\s*("text": [^\n]+?)\n\s*\}/g, "{ $1 $2 }");
  json = json.replace(/\{\s*\n\s*("text": [^\n]+?)\n\s*\}/g, "{ $1 }");
  writeFileSync(sayingsPath, json + "\n");
  console.log(`Recorded ${made} clips.`);
}
execFileSync("rm", ["-f", tmp]);
