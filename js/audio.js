// Sound: placeholder effects made with the Web Audio API, plus Uncle Bob's recorded lines.
// Browsers only allow sound after a tap, so unlock() runs on the first touch.
let ctx = null;
let enabled = true;
let noiseBuffer = null;
const voices = new Map(); // url → decoded AudioBuffer

export function setEnabled(on) {
  enabled = on;
}

export function unlock() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
}

function ready() {
  return enabled && ctx && ctx.state === "running";
}

function tone(freq, duration, { type = "square", volume = 0.06, slideTo = null, delay = 0 } = {}) {
  if (!ready()) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(duration, { volume = 0.15, filter = 1200, type = "lowpass", delay = 0 } = {}) {
  if (!ready()) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = filter;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(f).connect(gain).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

const SOUNDS = {
  cluck() {
    const base = 520 + Math.random() * 160;
    tone(base, 0.06, { type: "square", volume: 0.035, slideTo: base * 0.7 });
    tone(base * 1.1, 0.05, { type: "square", volume: 0.03, slideTo: base * 0.8, delay: 0.09 });
  },
  bawk() {
    tone(700, 0.08, { type: "sawtooth", volume: 0.05, slideTo: 1100 });
    tone(1000, 0.22, { type: "sawtooth", volume: 0.05, slideTo: 500, delay: 0.08 });
  },
  feed() {
    for (let i = 0; i < 6; i++) noise(0.05, { volume: 0.08, filter: 3000 + i * 300, type: "bandpass", delay: i * 0.035 });
  },
  refill() {
    noise(0.4, { volume: 0.12, filter: 1800, type: "bandpass" });
    tone(300, 0.1, { type: "triangle", volume: 0.06, slideTo: 500, delay: 0.3 });
  },
  empty() {
    tone(220, 0.12, { type: "square", volume: 0.05 });
    tone(165, 0.2, { type: "square", volume: 0.05, delay: 0.13 });
  },
  punch() {
    noise(0.15, { volume: 0.4, filter: 700 });
    tone(150, 0.18, { type: "sine", volume: 0.25, slideTo: 50 });
  },
  whiff() {
    noise(0.18, { volume: 0.08, filter: 1500, type: "bandpass" });
  },
  howl() {
    tone(330, 0.5, { type: "sine", volume: 0.08, slideTo: 660 });
    tone(660, 0.9, { type: "sine", volume: 0.08, slideTo: 380, delay: 0.5 });
    tone(335, 0.5, { type: "triangle", volume: 0.03, slideTo: 670 });
  },
  yelp() {
    tone(900, 0.12, { type: "sawtooth", volume: 0.05, slideTo: 1400 });
    tone(1200, 0.15, { type: "sawtooth", volume: 0.04, slideTo: 700, delay: 0.12 });
  },
  egg() {
    tone(600, 0.06, { type: "sine", volume: 0.08, slideTo: 900 });
    tone(900, 0.08, { type: "sine", volume: 0.07, slideTo: 1300, delay: 0.07 });
  },
  pop() {
    tone(500, 0.08, { type: "sine", volume: 0.06, slideTo: 900 });
  },
  boing() {
    tone(220, 0.35, { type: "sine", volume: 0.1, slideTo: 520 });
  },
  warn() {
    tone(880, 0.07, { type: "square", volume: 0.03 });
  },
  dead() {
    tone(392, 0.25, { type: "triangle", volume: 0.08 });
    tone(370, 0.25, { type: "triangle", volume: 0.08, delay: 0.25 });
    tone(349, 0.25, { type: "triangle", volume: 0.08, delay: 0.5 });
    tone(330, 0.7, { type: "triangle", volume: 0.08, slideTo: 300, delay: 0.75 });
  },
  stolen() {
    tone(600, 0.6, { type: "sawtooth", volume: 0.04, slideTo: 150 });
  },
  rooster() {
    tone(500, 0.12, { type: "sawtooth", volume: 0.05, slideTo: 700 });
    tone(700, 0.12, { type: "sawtooth", volume: 0.05, slideTo: 900, delay: 0.14 });
    tone(900, 0.5, { type: "sawtooth", volume: 0.05, slideTo: 600, delay: 0.28 });
  },
  cheer() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, { type: "triangle", volume: 0.07, delay: i * 0.12 }));
  },
  groan() {
    tone(300, 0.6, { type: "sawtooth", volume: 0.04, slideTo: 120 });
  },
};

export function play(name) {
  SOUNDS[name]?.();
}

// Plays a recorded voice line, fetched and decoded the first time it is needed.
// Uncle Bob says one thing at a time: a new line cuts off the last one.
let speaking = null;
let speakingUntil = 0;

export function busySpeaking() {
  return ctx && ctx.currentTime < speakingUntil;
}

export async function playVoice(url) {
  if (!url || !ready()) return false;
  try {
    let buffer = voices.get(url);
    if (!buffer) {
      const bytes = await (await fetch(url)).arrayBuffer();
      buffer = await ctx.decodeAudioData(bytes);
      voices.set(url, buffer);
    }
    try {
      speaking?.stop();
    } catch {
      // it had already finished
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start();
    speaking = src;
    speakingUntil = ctx.currentTime + buffer.duration;
    return true;
  } catch {
    return false;
  }
}
