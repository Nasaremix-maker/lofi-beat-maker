// Lofi Beat Maker – Web Edition
// Simplified procedural engine using Web Audio API

const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;
let isPlaying = false;
let nextNoteTime = 0;
let timerID = null;
let currentBar = 0;

// Simple note frequencies (A4 = 440)
const NOTE_FREQ = {
  C: 261.63, "C#": 277.18, D: 293.66, "D#": 311.13,
  E: 329.63, F: 349.23, "F#": 369.99, G: 392.00,
  "G#": 415.30, A: 440.00, "A#": 466.16, B: 493.88
};

const PRESETS = {
  chill:  { bpm: 76, key: "A", swing: 0.20, reverb: 0.35, vinyl: 0.00, filter: 6200, chordInst: "Rhodes", drums: "Mellow Lofi" },
  rainy:  { bpm: 82, key: "F", swing: 0.32, reverb: 0.40, vinyl: 0.25, filter: 6500, chordInst: "Piano", drums: "Jazzy Shuffle" },
  dusty:  { bpm: 88, key: "D", swing: 0.30, reverb: 0.25, vinyl: 0.55, filter: 4200, chordInst: "Pluck", drums: "Boom Bap" },
  night:  { bpm: 78, key: "C#", swing: 0.18, reverb: 0.50, vinyl: 0.15, filter: 4800, chordInst: "Pad", drums: "Head Nod" },
  dreamy: { bpm: 64, key: "E", swing: 0.12, reverb: 0.60, vinyl: 0.00, filter: 4000, chordInst: "Pad", drums: "Sparse" },
  neo:    { bpm: 84, key: "A#", swing: 0.30, reverb: 0.30, vinyl: 0.10, filter: 5800, chordInst: "Rhodes", drums: "Head Nod" },
  piano:  { bpm: 66, key: "D#", swing: 0.15, reverb: 0.45, vinyl: 0.30, filter: 5000, chordInst: "Piano", drums: "Sparse" },
  clean:  { bpm: 76, key: "A", swing: 0.18, reverb: 0.28, vinyl: 0.00, filter: 7800, chordInst: "Rhodes", drums: "Mellow Lofi" }
};

// Simple chord progressions (intervals from root)
const PROGS = {
  chill:  [0, 5, 10, 3],
  rainy:  [2, 7, 0, 9],
  dusty:  [0, 8, 3, 10],
  night:  [0, 8, 5, 7],
  dreamy: [0, 3, 8, 10],
  neo:    [0, 3, 10, 5],
  piano:  [0, 8, 10, 7],
  clean:  [0, 5, 10, 3]
};

function getParams() {
  return {
    bpm: +document.getElementById("bpm").value,
    key: document.getElementById("key").value,
    swing: +document.getElementById("swing").value,
    reverb: +document.getElementById("reverb").value,
    vinyl: +document.getElementById("vinyl").value,
    filter: +document.getElementById("filter").value,
    chordInst: document.getElementById("chordInst").value,
    drums: document.getElementById("drums").value
  };
}

function updateLabels() {
  document.getElementById("bpmVal").textContent = document.getElementById("bpm").value;
  document.getElementById("swingVal").textContent = (+document.getElementById("swing").value).toFixed(2);
  document.getElementById("reverbVal").textContent = (+document.getElementById("reverb").value).toFixed(2);
  document.getElementById("vinylVal").textContent = (+document.getElementById("vinyl").value).toFixed(2);
  document.getElementById("filterVal").textContent = document.getElementById("filter").value;
}

// ── Audio helpers ──
function createNoiseBuffer(duration) {
  const len = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function playKick(time, gain = 0.7) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
  g.gain.setValueAtTime(gain, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(time);
  osc.stop(time + 0.4);
}

function playSnare(time, gain = 0.45) {
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(0.3);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
  noise.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  noise.start(time);
  noise.stop(time + 0.25);
}

function playHat(time, gain = 0.25, open = false) {
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(open ? 0.35 : 0.08);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 7000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + (open ? 0.3 : 0.06));
  noise.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  noise.start(time);
  noise.stop(time + (open ? 0.35 : 0.1));
}

function playChord(time, rootFreq, type = "Rhodes", gain = 0.18) {
  // simple major/minor 7th style
  const intervals = [0, 4, 7, 11]; // maj7-ish
  intervals.forEach((semi, i) => {
    const freq = rootFreq * Math.pow(2, semi / 12);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type === "Pad" ? "sawtooth" : type === "Pluck" ? "triangle" : "sine";
    osc.frequency.value = freq;
    // slight detune for richness
    if (i > 0) osc.detune.value = (Math.random() - 0.5) * 8;

    const attack = type === "Pad" ? 0.25 : 0.01;
    const decay = type === "Pad" ? 1.8 : 0.9;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(gain / intervals.length, time + attack);
    g.gain.exponentialRampToValueAtTime(0.001, time + decay);

    // simple lowpass for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = type === "Pad" ? 1200 : 2800;

    osc.connect(filter);
    filter.connect(g);
    g.connect(reverbInput || masterGain);
    osc.start(time);
    osc.stop(time + decay + 0.1);
  });
}

function playBass(time, freq, gain = 0.35) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq / 2; // one octave down
  g.gain.setValueAtTime(gain, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(time);
  osc.stop(time + 0.4);
}

// Master + effects
let masterGain, reverbInput, reverbNode, filterNode, vinylGain;

function setupEffects() {
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.7;

  // simple convolver-like reverb using delay network (lightweight)
  reverbInput = ctx.createGain();
  const delay1 = ctx.createDelay(1.0);
  const delay2 = ctx.createDelay(1.0);
  const feedback = ctx.createGain();
  const wet = ctx.createGain();
  delay1.delayTime.value = 0.29;
  delay2.delayTime.value = 0.37;
  feedback.gain.value = 0.35;
  wet.gain.value = 0.4;

  reverbInput.connect(delay1);
  delay1.connect(delay2);
  delay2.connect(feedback);
  feedback.connect(delay1);
  delay1.connect(wet);
  delay2.connect(wet);
  wet.connect(masterGain);
  reverbInput.connect(masterGain); // dry

  // master filter
  filterNode = ctx.createBiquadFilter();
  filterNode.type = "lowpass";
  filterNode.frequency.value = 5200;
  masterGain.connect(filterNode);
  filterNode.connect(ctx.destination);
}

function scheduleBar(params, barStartTime) {
  const secondsPerBeat = 60 / params.bpm;
  const secondsPer16th = secondsPerBeat / 4;
  const swing = params.swing;

  // drum patterns (very simplified)
  const patterns = {
    "Mellow Lofi": { kick: [0, 8], snare: [4, 12], hat: [0,2,4,6,8,10,12,14] },
    "Boom Bap":    { kick: [0, 7, 10], snare: [4, 12], hat: [0,2,4,6,8,10,12,14] },
    "Head Nod":    { kick: [0, 6, 10], snare: [4, 12], hat: [0,2,3,4,6,8,10,12,14] },
    "Sparse":      { kick: [0, 8], snare: [12], hat: [4, 12] },
    "Jazzy Shuffle":{ kick: [0, 7], snare: [4, 12], hat: [0,2,3,4,6,7,8,10,12,14] },
    "No Drums":    { kick: [], snare: [], hat: [] }
  };
  const pat = patterns[params.drums] || patterns["Mellow Lofi"];

  // drums
  pat.kick.forEach(i => {
    const t = barStartTime + i * secondsPer16th + (i % 2 ? swing * secondsPer16th : 0);
    playKick(t);
  });
  pat.snare.forEach(i => {
    const t = barStartTime + i * secondsPer16th + (i % 2 ? swing * secondsPer16th : 0);
    playSnare(t);
  });
  pat.hat.forEach(i => {
    const t = barStartTime + i * secondsPer16th + (i % 2 ? swing * secondsPer16th * 0.6 : 0);
    playHat(t, 0.18);
  });

  // chord + bass (every bar, simple)
  const rootName = params.key;
  const rootFreq = NOTE_FREQ[rootName] || 440;
  const prog = PROGS.chill; // simplified – always use one for now
  const degree = prog[currentBar % prog.length];
  const chordRoot = rootFreq * Math.pow(2, degree / 12);

  playChord(barStartTime + 0.01, chordRoot, params.chordInst, 0.16);
  playBass(barStartTime + 0.01, chordRoot, 0.32);

  // vinyl noise occasionally
  if (params.vinyl > 0.05 && Math.random() < params.vinyl * 0.4) {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(0.08);
    const g = ctx.createGain();
    g.gain.value = params.vinyl * 0.08;
    noise.connect(g);
    g.connect(masterGain);
    noise.start(barStartTime + Math.random() * 1.5);
  }
}

function scheduler() {
  const params = getParams();
  const secondsPerBar = (60 / params.bpm) * 4;

  while (nextNoteTime < ctx.currentTime + 0.15) {
    scheduleBar(params, nextNoteTime);
    nextNoteTime += secondsPerBar;
    currentBar++;
  }
  timerID = setTimeout(scheduler, 40);
}

function start() {
  if (!ctx) {
    ctx = new AudioContext();
    setupEffects();
  }
  if (ctx.state === "suspended") ctx.resume();

  const params = getParams();
  filterNode.frequency.value = params.filter;
  // update reverb wet roughly
  nextNoteTime = ctx.currentTime + 0.08;
  currentBar = 0;
  isPlaying = true;
  document.getElementById("playBtn").textContent = "■ Stop";
  document.getElementById("playBtn").classList.add("playing");
  document.getElementById("status").textContent = "Playing…";
  scheduler();
}

function stop() {
  isPlaying = false;
  clearTimeout(timerID);
  document.getElementById("playBtn").textContent = "▶ Play";
  document.getElementById("playBtn").classList.remove("playing");
  document.getElementById("status").textContent = "Stopped";
}

// ── UI wiring ──
document.getElementById("playBtn").addEventListener("click", () => {
  if (isPlaying) stop();
  else start();
});

document.getElementById("preset").addEventListener("change", (e) => {
  const p = PRESETS[e.target.value];
  if (!p) return;
  document.getElementById("bpm").value = p.bpm;
  document.getElementById("key").value = p.key;
  document.getElementById("swing").value = p.swing;
  document.getElementById("reverb").value = p.reverb;
  document.getElementById("vinyl").value = p.vinyl;
  document.getElementById("filter").value = p.filter;
  document.getElementById("chordInst").value = p.chordInst;
  document.getElementById("drums").value = p.drums;
  updateLabels();
});

["bpm", "swing", "reverb", "vinyl", "filter"].forEach(id => {
  document.getElementById(id).addEventListener("input", updateLabels);
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  alert("In this web version, use your browser’s or OS recorder, or we can add offline WAV rendering later.\n\nFor now the live engine is the main feature.");
});

// init
updateLabels();
document.getElementById("status").textContent = "Ready – tap Play";
