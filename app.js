/**
 * Lofi Beat Maker – Web Studio
 * Richer procedural engine using Web Audio API
 */

const AC = window.AudioContext || window.webkitAudioContext;
let ctx = null;
let master, filterNode, reverbSend, reverbReturn, analyser;
let isPlaying = false;
let nextTime = 0;
let timerID = null;
let barCount = 0;
let animID = null;

const NOTE = {
  C: 261.63, "C#": 277.18, D: 293.66, "D#": 311.13,
  E: 329.63, F: 349.23, "F#": 369.99, G: 392.00,
  "G#": 415.30, A: 440.00, "A#": 466.16, B: 493.88
};

const SCALES = {
  minorPent: [0, 3, 5, 7, 10],
  majorPent: [0, 2, 4, 7, 9],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  naturalMin: [0, 2, 3, 5, 7, 8, 10]
};

// root offset + quality intervals (from root)
const PROGS = {
  chill:  [[0, [0,3,7,10]], [5, [0,3,7,10]], [10, [0,4,7,10]], [3, [0,4,7,11]]],
  rainy:  [[2, [0,3,7,10]], [7, [0,4,7,10]], [0, [0,4,7,11]], [9, [0,3,7,10]]],
  dusty:  [[0, [0,3,7,10]], [8, [0,4,7,11]], [3, [0,4,7,11]], [10, [0,4,7,10]]],
  night:  [[0, [0,3,7,10,14]], [8, [0,4,7,11]], [5, [0,3,7,10]], [7, [0,4,7,10]]],
  dreamy: [[0, [0,3,7,10,14]], [3, [0,4,7,11]], [8, [0,4,7,11]], [10, [0,4,7,10]]],
  neo:    [[0, [0,3,7,10,14]], [3, [0,4,7,11]], [10, [0,4,7,10]], [5, [0,3,7,10,14]]],
  piano:  [[0, [0,3,7,10]], [8, [0,4,7,11]], [10, [0,4,7,10]], [7, [0,3,7,10]]],
  clean:  [[0, [0,4,7,11]], [9, [0,3,7,10]], [2, [0,3,7,10]], [7, [0,4,7,10]]]
};

const PRESETS = {
  chill:  { bpm:76, key:"A", swing:0.22, melody:0.40, filter:5800, reverb:0.36, vinyl:0.12, drumsVol:0.78, chordInst:"Rhodes", drums:"Mellow", prog:"chill", scale:"minorPent" },
  rainy:  { bpm:82, key:"F", swing:0.30, melody:0.35, filter:6400, reverb:0.42, vinyl:0.28, drumsVol:0.70, chordInst:"Piano", drums:"Jazzy", prog:"rainy", scale:"majorPent" },
  dusty:  { bpm:88, key:"D", swing:0.28, melody:0.28, filter:4200, reverb:0.28, vinyl:0.55, drumsVol:0.88, chordInst:"Pluck", drums:"BoomBap", prog:"dusty", scale:"minorPent" },
  night:  { bpm:78, key:"C#", swing:0.18, melody:0.45, filter:4800, reverb:0.50, vinyl:0.18, drumsVol:0.72, chordInst:"Pad", drums:"HeadNod", prog:"night", scale:"dorian" },
  dreamy: { bpm:64, key:"E", swing:0.12, melody:0.30, filter:3800, reverb:0.62, vinyl:0.08, drumsVol:0.55, chordInst:"Pad", drums:"Sparse", prog:"dreamy", scale:"dorian" },
  neo:    { bpm:84, key:"A#", swing:0.28, melody:0.42, filter:5600, reverb:0.34, vinyl:0.15, drumsVol:0.80, chordInst:"Rhodes", drums:"HeadNod", prog:"neo", scale:"dorian" },
  piano:  { bpm:66, key:"D#", swing:0.14, melody:0.48, filter:5000, reverb:0.44, vinyl:0.35, drumsVol:0.50, chordInst:"Piano", drums:"Sparse", prog:"piano", scale:"naturalMin" },
  clean:  { bpm:76, key:"A", swing:0.16, melody:0.38, filter:7800, reverb:0.28, vinyl:0.00, drumsVol:0.70, chordInst:"Rhodes", drums:"Mellow", prog:"clean", scale:"majorPent" }
};

const DRUM_PATS = {
  Mellow:  { k:[0,8], s:[4,12], h:[0,2,4,6,8,10,12,14], o:[] },
  BoomBap: { k:[0,7,10], s:[4,12], h:[0,2,4,6,8,10,12,14], o:[] },
  HeadNod: { k:[0,6,10], s:[4,12], h:[0,2,3,4,6,8,10,12,14], o:[] },
  Sparse:  { k:[0,8], s:[12], h:[4,12], o:[] },
  Jazzy:   { k:[0,7], s:[4,12], h:[0,2,3,4,6,7,8,10,12,14], o:[14] },
  None:    { k:[], s:[], h:[], o:[] }
};

function $(id) { return document.getElementById(id); }

function getP() {
  return {
    bpm: +$("bpm").value,
    key: $("key").value,
    swing: +$("swing").value,
    melody: +$("melody").value,
    filter: +$("filter").value,
    reverb: +$("reverb").value,
    vinyl: +$("vinyl").value,
    drumsVol: +$("drumsVol").value,
    chordInst: $("chordInst").value,
    drums: $("drums").value,
    prog: window._prog || "chill",
    scale: window._scale || "minorPent"
  };
}

function updateLabels() {
  $("bpmVal").textContent = $("bpm").value;
  $("swingVal").textContent = (+$("swing").value).toFixed(2);
  $("melodyVal").textContent = (+$("melody").value).toFixed(2);
  $("filterVal").textContent = $("filter").value;
  $("reverbVal").textContent = (+$("reverb").value).toFixed(2);
  $("vinylVal").textContent = (+$("vinyl").value).toFixed(2);
  $("drumsVal").textContent = (+$("drumsVol").value).toFixed(2);
}

// ─── Audio graph ───────────────────────────────────────────
function ensureCtx() {
  if (ctx) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.72;

  filterNode = ctx.createBiquadFilter();
  filterNode.type = "lowpass";
  filterNode.frequency.value = 5600;
  filterNode.Q.value = 0.7;

  // lightweight reverb (parallel delays)
  reverbSend = ctx.createGain();
  reverbReturn = ctx.createGain();
  reverbReturn.gain.value = 0.35;
  const d1 = ctx.createDelay(1.0); d1.delayTime.value = 0.27;
  const d2 = ctx.createDelay(1.0); d2.delayTime.value = 0.39;
  const d3 = ctx.createDelay(1.0); d3.delayTime.value = 0.53;
  const fb = ctx.createGain(); fb.gain.value = 0.38;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4500;

  reverbSend.connect(d1);
  d1.connect(d2); d2.connect(d3); d3.connect(fb); fb.connect(d1);
  d1.connect(lp); d2.connect(lp); d3.connect(lp);
  lp.connect(reverbReturn);
  reverbReturn.connect(master);

  analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.75;

  master.connect(filterNode);
  filterNode.connect(analyser);
  analyser.connect(ctx.destination);
}

function noiseBuf(dur) {
  const n = Math.floor(ctx.sampleRate * dur);
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

// ─── Voices ────────────────────────────────────────────────
function kick(t, g = 0.85) {
  const o = ctx.createOscillator();
  const gn = ctx.createGain();
  o.frequency.setValueAtTime(160, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.08);
  gn.gain.setValueAtTime(g, t);
  gn.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
  o.connect(gn); gn.connect(master);
  // click
  const c = ctx.createOscillator();
  const cg = ctx.createGain();
  c.frequency.value = 1200;
  cg.gain.setValueAtTime(g * 0.35, t);
  cg.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  c.connect(cg); cg.connect(master);
  o.start(t); o.stop(t + 0.4);
  c.start(t); c.stop(t + 0.03);
}

function snare(t, g = 0.48) {
  const n = ctx.createBufferSource();
  n.buffer = noiseBuf(0.28);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass"; bp.frequency.value = 2200; bp.Q.value = 0.9;
  const gn = ctx.createGain();
  gn.gain.setValueAtTime(g, t);
  gn.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  n.connect(bp); bp.connect(gn); gn.connect(master);
  // body tone
  const o = ctx.createOscillator();
  const og = ctx.createGain();
  o.frequency.value = 180;
  og.gain.setValueAtTime(g * 0.5, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  o.connect(og); og.connect(master);
  n.start(t); n.stop(t + 0.25);
  o.start(t); o.stop(t + 0.15);
}

function hat(t, g = 0.22, open = false) {
  const n = ctx.createBufferSource();
  n.buffer = noiseBuf(open ? 0.32 : 0.07);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.value = 7500;
  const gn = ctx.createGain();
  gn.gain.setValueAtTime(g, t);
  gn.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.28 : 0.055));
  n.connect(hp); hp.connect(gn); gn.connect(master);
  n.start(t); n.stop(t + (open ? 0.32 : 0.08));
}

function chordTone(t, freq, type, gain, dur) {
  const voices = type === "Pad" ? 4 : 3;
  for (let i = 0; i < voices; i++) {
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";

    if (type === "Pad") {
      o.type = "sawtooth";
      o.detune.value = (i - 1.5) * 6;
      f.frequency.value = 1400;
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(gain / voices, t + 0.35);
      gn.gain.setTargetAtTime(0.001, t + dur * 0.7, 0.4);
    } else if (type === "Piano") {
      o.type = "triangle";
      o.detune.value = (i - 1) * 3;
      f.frequency.value = 4200 - i * 400;
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(gain / voices * (i === 0 ? 1.2 : 0.7), t + 0.008);
      gn.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.9);
    } else if (type === "Pluck") {
      o.type = "triangle";
      f.frequency.value = 3200;
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(gain / voices, t + 0.004);
      gn.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    } else { // Rhodes
      o.type = "sine";
      o.detune.value = (i - 1) * 4;
      // soft FM-ish via second osc
      if (i === 0) {
        const mod = ctx.createOscillator();
        const mg = ctx.createGain();
        mod.frequency.value = freq * 1.4;
        mg.gain.value = freq * 0.6;
        mod.connect(mg); mg.connect(o.frequency);
        mod.start(t); mod.stop(t + dur + 0.2);
      }
      f.frequency.value = 2800;
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(gain / voices, t + 0.012);
      gn.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.85);
    }

    o.frequency.value = freq * (i === 2 && type !== "Pad" ? 2 : 1); // light octave for richness on some
    if (type === "Pad" || i < 2) o.frequency.value = freq;

    o.connect(f); f.connect(gn);
    gn.connect(master);
    gn.connect(reverbSend);
    o.start(t);
    o.stop(t + dur + 0.3);
  }
}

function playChord(t, rootHz, intervals, type, gain) {
  const dur = type === "Pad" ? 3.2 : 1.6;
  intervals.forEach((semi, idx) => {
    const f = rootHz * Math.pow(2, semi / 12);
    chordTone(t + idx * 0.008, f, type, gain * (0.9 + Math.random() * 0.15), dur);
  });
}

function bass(t, freq, g = 0.38) {
  const o = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const gn = ctx.createGain();
  o.type = "sine"; o.frequency.value = freq;
  o2.type = "triangle"; o2.frequency.value = freq; o2.detune.value = 3;
  gn.gain.setValueAtTime(0, t);
  gn.gain.linearRampToValueAtTime(g, t + 0.01);
  gn.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
  o.connect(gn); o2.connect(gn); gn.connect(master);
  o.start(t); o.stop(t + 0.45);
  o2.start(t); o2.stop(t + 0.45);
}

function melodyNote(t, freq, g = 0.14) {
  const o = ctx.createOscillator();
  const gn = ctx.createGain();
  const f = ctx.createBiquadFilter();
  o.type = "sine";
  o.frequency.value = freq;
  f.type = "lowpass"; f.frequency.value = 3200;
  gn.gain.setValueAtTime(0, t);
  gn.gain.linearRampToValueAtTime(g, t + 0.01);
  gn.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
  o.connect(f); f.connect(gn); gn.connect(master); gn.connect(reverbSend);
  o.start(t); o.stop(t + 0.6);
}

function vinylCrackle(t, amount) {
  if (amount < 0.05 || Math.random() > amount * 0.55) return;
  const n = ctx.createBufferSource();
  n.buffer = noiseBuf(0.04 + Math.random() * 0.06);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass"; bp.frequency.value = 2000 + Math.random() * 3000;
  const gn = ctx.createGain();
  gn.gain.value = amount * 0.07 * (0.5 + Math.random());
  n.connect(bp); bp.connect(gn); gn.connect(master);
  n.start(t + Math.random() * 1.8);
}

// ─── Scheduler ─────────────────────────────────────────────
function scheduleBar(p, t0) {
  const spb = 60 / p.bpm;
  const s16 = spb / 4;
  const swing = p.swing;
  const pat = DRUM_PATS[p.drums] || DRUM_PATS.Mellow;
  const dv = p.drumsVol;

  const when = (i) => t0 + i * s16 + ((i % 2) ? swing * s16 : 0);

  pat.k.forEach(i => kick(when(i), 0.82 * dv));
  pat.s.forEach(i => snare(when(i), 0.48 * dv));
  pat.h.forEach(i => hat(when(i), 0.20 * dv, false));
  pat.o.forEach(i => hat(when(i), 0.28 * dv, true));

  // progression
  const prog = PROGS[p.prog] || PROGS.chill;
  const [deg, iv] = prog[barCount % prog.length];
  const rootName = p.key;
  const rootHz = (NOTE[rootName] || 440) * Math.pow(2, deg / 12);
  // place chord in a comfortable octave
  const chordRoot = rootHz * (rootHz < 200 ? 2 : rootHz > 400 ? 0.5 : 1);

  playChord(t0 + 0.01, chordRoot, iv, p.chordInst, 0.17);
  bass(t0 + 0.01, chordRoot / 2, 0.36);

  // simple melody on scale
  if (p.melody > 0.05) {
    const scale = SCALES[p.scale] || SCALES.minorPent;
    const steps = [0, 2, 4, 7, 8, 10, 12, 14];
    steps.forEach((st, idx) => {
      if (Math.random() > 0.35 + p.melody * 0.45) return;
      const degree = scale[Math.floor(Math.random() * scale.length)];
      const oct = Math.random() > 0.7 ? 1 : 0;
      const freq = chordRoot * Math.pow(2, (degree + 12 * oct) / 12);
      melodyNote(when(st), freq, 0.11 * p.melody);
    });
  }

  vinylCrackle(t0, p.vinyl);
}

function scheduler() {
  const p = getP();
  filterNode.frequency.setTargetAtTime(p.filter, ctx.currentTime, 0.05);
  reverbReturn.gain.setTargetAtTime(p.reverb * 0.55, ctx.currentTime, 0.08);

  const barDur = (60 / p.bpm) * 4;
  while (nextTime < ctx.currentTime + 0.18) {
    scheduleBar(p, nextTime);
    nextTime += barDur;
    barCount++;
    $("barInfo").textContent = `Bar ${barCount}`;
  }
  timerID = setTimeout(scheduler, 35);
}

// ─── Visualizer ────────────────────────────────────────────
function drawViz() {
  if (!analyser) return;
  const canvas = $("viz");
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const g = canvas.getContext("2d");
  const buf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(buf);

  g.clearRect(0, 0, w, h);
  const bars = 48;
  const step = Math.floor(buf.length / bars);
  const bw = w / bars - 2;

  for (let i = 0; i < bars; i++) {
    let sum = 0;
    for (let j = 0; j < step; j++) sum += buf[i * step + j];
    const v = sum / step / 255;
    const bh = Math.max(2, v * h * 0.92);
    const x = i * (bw + 2);
    const y = h - bh;
    const grad = g.createLinearGradient(0, y, 0, h);
    grad.addColorStop(0, "rgba(124,156,255,0.95)");
    grad.addColorStop(1, "rgba(167,139,250,0.35)");
    g.fillStyle = grad;
    g.beginPath();
    g.roundRect(x, y, bw, bh, 3);
    g.fill();
  }
  animID = requestAnimationFrame(drawViz);
}

// ─── Transport ─────────────────────────────────────────────
function start() {
  ensureCtx();
  if (ctx.state === "suspended") ctx.resume();
  nextTime = ctx.currentTime + 0.1;
  barCount = 0;
  isPlaying = true;
  $("playBtn").classList.add("playing");
  $("playBtn").querySelector(".icon").textContent = "■";
  $("playBtn").querySelector(".label").textContent = "Stop";
  $("status").textContent = "Playing";
  scheduler();
  if (!animID) drawViz();
}

function stop() {
  isPlaying = false;
  clearTimeout(timerID);
  $("playBtn").classList.remove("playing");
  $("playBtn").querySelector(".icon").textContent = "▶";
  $("playBtn").querySelector(".label").textContent = "Play";
  $("status").textContent = "Stopped";
  $("barInfo").textContent = "—";
}

// ─── Offline WAV export ────────────────────────────────────
function floatTo16BitPCM(input) {
  const buf = new ArrayBuffer(input.length * 2);
  const view = new DataView(buf);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buf;
}

function encodeWav(left, right, sr) {
  const len = left.length;
  const ab = new ArrayBuffer(44 + len * 4);
  const v = new DataView(ab);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + len * 4, true); w(8, "WAVE"); w(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true);
  v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, len * 4, true);
  const pcmL = floatTo16BitPCM(left);
  const pcmR = floatTo16BitPCM(right);
  const u8 = new Uint8Array(ab);
  const l8 = new Uint8Array(pcmL);
  const r8 = new Uint8Array(pcmR);
  for (let i = 0, o = 44; i < len; i++, o += 4) {
    u8[o] = l8[i * 2]; u8[o + 1] = l8[i * 2 + 1];
    u8[o + 2] = r8[i * 2]; u8[o + 3] = r8[i * 2 + 1];
  }
  return ab;
}

async function renderAndDownload() {
  const btn = $("downloadBtn");
  btn.disabled = true;
  btn.textContent = "Rendering…";
  $("status").textContent = "Rendering…";

  try {
    const secs = +$("exportLen").value;
    const p = getP();
    const sr = 44100;
    const offline = new OfflineAudioContext(2, sr * secs, sr);

    // rebuild a minimal graph inside offline context
    const oMaster = offline.createGain(); oMaster.gain.value = 0.7;
    const oFilter = offline.createBiquadFilter();
    oFilter.type = "lowpass"; oFilter.frequency.value = p.filter;
    oMaster.connect(oFilter); oFilter.connect(offline.destination);

    // temporary swap globals so schedule helpers work (hacky but effective)
    const oldCtx = ctx, oldMaster = master, oldSend = reverbSend;
    ctx = offline; master = oMaster; reverbSend = offline.createGain(); // dry only for offline simplicity

    let t = 0.05;
    const barDur = (60 / p.bpm) * 4;
    let bar = 0;
    const savedBar = barCount;
    barCount = 0;
    while (t < secs - 0.5) {
      scheduleBar(p, t);
      t += barDur;
      barCount++;
    }
    barCount = savedBar;

    const rendered = await offline.startRendering();
    ctx = oldCtx; master = oldMaster; reverbSend = oldSend;

    const left = rendered.getChannelData(0);
    const right = rendered.getChannelData(1);
    const wav = encodeWav(left, right, sr);
    const blob = new Blob([wav], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lofi_${p.key}_${p.bpm}bpm_${secs}s.wav`;
    a.click();
    URL.revokeObjectURL(url);
    $("status").textContent = "Downloaded";
  } catch (e) {
    console.error(e);
    $("status").textContent = "Render failed";
    alert("Export failed: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Download WAV";
  }
}

// ─── UI wiring ─────────────────────────────────────────────
function applyPreset(name) {
  const pr = PRESETS[name];
  if (!pr) return;
  $("bpm").value = pr.bpm;
  $("key").value = pr.key;
  $("swing").value = pr.swing;
  $("melody").value = pr.melody;
  $("filter").value = pr.filter;
  $("reverb").value = pr.reverb;
  $("vinyl").value = pr.vinyl;
  $("drumsVol").value = pr.drumsVol;
  $("chordInst").value = pr.chordInst;
  $("drums").value = pr.drums;
  window._prog = pr.prog;
  window._scale = pr.scale;
  updateLabels();
  document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c.dataset.p === name));
}

function randomize() {
  const keys = Object.keys(PRESETS);
  const name = keys[Math.floor(Math.random() * keys.length)];
  applyPreset(name);
  // small random drift
  $("bpm").value = Math.min(98, Math.max(58, +$("bpm").value + Math.floor(Math.random() * 7) - 3));
  $("swing").value = Math.min(0.4, Math.max(0, +$("swing").value + (Math.random() - 0.5) * 0.08));
  $("filter").value = Math.min(10000, Math.max(2000, +$("filter").value + Math.floor(Math.random() * 800) - 400));
  updateLabels();
}

$("playBtn").addEventListener("click", () => isPlaying ? stop() : start());
$("downloadBtn").addEventListener("click", renderAndDownload);
$("randomBtn").addEventListener("click", randomize);

document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => applyPreset(chip.dataset.p));
});

["bpm", "swing", "melody", "filter", "reverb", "vinyl", "drumsVol"].forEach(id => {
  $(id).addEventListener("input", updateLabels);
});

// init
window._prog = "chill";
window._scale = "minorPent";
updateLabels();
$("status").textContent = "Ready";
