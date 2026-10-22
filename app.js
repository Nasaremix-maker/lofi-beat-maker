/**
 * Lofi Beat Maker – Web Studio (enhanced)
 * Better synthesis, pump, structure, share, localStorage, meters, longer export
 */
const AC = window.AudioContext || window.webkitAudioContext;
let ctx = null;
let master, musicGain, filterNode, reverbSend, reverbReturn, analyser;
let isPlaying = false, nextTime = 0, timerID = null, barCount = 0, animID = null;
let vizMode = "spectrum";
let melState = { deg: 2, dir: 1 };
let currentPresetName = "chill";

const NOTE = {
  C:261.63,"C#":277.18,D:293.66,"D#":311.13,E:329.63,F:349.23,
  "F#":369.99,G:392.00,"G#":415.30,A:440.00,"A#":466.16,B:493.88
};
const SCALES = {
  minorPent:[0,3,5,7,10], majorPent:[0,2,4,7,9],
  dorian:[0,2,3,5,7,9,10], naturalMin:[0,2,3,5,7,8,10]
};
// Multiple progressions per mood
const PROGS = {
  chill: [
    [[0,[0,3,7,10]],[5,[0,3,7,10]],[10,[0,4,7,10]],[3,[0,4,7,11]]],
    [[0,[0,3,7,10,14]],[7,[0,4,7,10]],[5,[0,3,7,10]],[10,[0,4,7,10]]]
  ],
  rainy: [
    [[2,[0,3,7,10]],[7,[0,4,7,10]],[0,[0,4,7,11]],[9,[0,3,7,10]]],
    [[0,[0,4,7,11]],[5,[0,3,7,10]],[7,[0,4,7,10]],[0,[0,4,7,11]]]
  ],
  dusty: [
    [[0,[0,3,7,10]],[8,[0,4,7,11]],[3,[0,4,7,11]],[10,[0,4,7,10]]],
    [[0,[0,3,7,10]],[5,[0,3,7,10]],[7,[0,4,7,10]],[10,[0,4,7,10]]]
  ],
  night: [
    [[0,[0,3,7,10,14]],[8,[0,4,7,11]],[5,[0,3,7,10]],[7,[0,4,7,10]]],
    [[0,[0,3,7,10]],[3,[0,4,7,11]],[8,[0,4,7,11]],[10,[0,4,7,10]]]
  ],
  dreamy: [
    [[0,[0,3,7,10,14]],[3,[0,4,7,11]],[8,[0,4,7,11]],[10,[0,4,7,10]]],
    [[0,[0,3,7,10]],[5,[0,3,7,10]],[7,[0,4,7,10]],[0,[0,3,7,10]]]
  ],
  neo: [
    [[0,[0,3,7,10,14]],[3,[0,4,7,11]],[10,[0,4,7,10]],[5,[0,3,7,10,14]]],
    [[0,[0,3,7,10]],[7,[0,4,7,10]],[3,[0,4,7,11]],[10,[0,4,7,10]]]
  ],
  piano: [
    [[0,[0,3,7,10]],[8,[0,4,7,11]],[10,[0,4,7,10]],[7,[0,3,7,10]]],
    [[0,[0,3,7,10]],[5,[0,3,7,10]],[8,[0,4,7,11]],[7,[0,4,7,10]]]
  ],
  clean: [
    [[0,[0,4,7,11]],[9,[0,3,7,10]],[2,[0,3,7,10]],[7,[0,4,7,10]]],
    [[0,[0,4,7,11]],[5,[0,3,7,10]],[7,[0,4,7,10]],[0,[0,4,7,11]]]
  ]
};
const PRESETS = {
  chill:  {bpm:76,key:"A",swing:0.22,melody:0.40,filter:5800,reverb:0.36,pump:0.35,drumsVol:0.78,chordInst:"Rhodes",drums:"Mellow",prog:"chill",scale:"minorPent",vinylOn:true,rainOn:false,structureOn:true},
  rainy:  {bpm:82,key:"F",swing:0.30,melody:0.35,filter:6400,reverb:0.42,pump:0.25,drumsVol:0.70,chordInst:"Piano",drums:"Jazzy",prog:"rainy",scale:"majorPent",vinylOn:true,rainOn:true,structureOn:true},
  dusty:  {bpm:88,key:"D",swing:0.28,melody:0.28,filter:4200,reverb:0.28,pump:0.50,drumsVol:0.88,chordInst:"Pluck",drums:"BoomBap",prog:"dusty",scale:"minorPent",vinylOn:true,rainOn:false,structureOn:true},
  night:  {bpm:78,key:"C#",swing:0.18,melody:0.45,filter:4800,reverb:0.50,pump:0.40,drumsVol:0.72,chordInst:"Pad",drums:"HeadNod",prog:"night",scale:"dorian",vinylOn:true,rainOn:false,structureOn:true},
  dreamy: {bpm:64,key:"E",swing:0.12,melody:0.30,filter:3800,reverb:0.62,pump:0.20,drumsVol:0.55,chordInst:"Pad",drums:"Sparse",prog:"dreamy",scale:"dorian",vinylOn:false,rainOn:false,structureOn:true},
  neo:    {bpm:84,key:"A#",swing:0.28,melody:0.42,filter:5600,reverb:0.34,pump:0.38,drumsVol:0.80,chordInst:"Rhodes",drums:"HeadNod",prog:"neo",scale:"dorian",vinylOn:true,rainOn:false,structureOn:true},
  piano:  {bpm:66,key:"D#",swing:0.14,melody:0.48,filter:5000,reverb:0.44,pump:0.22,drumsVol:0.50,chordInst:"Piano",drums:"Sparse",prog:"piano",scale:"naturalMin",vinylOn:true,rainOn:false,structureOn:true},
  clean:  {bpm:76,key:"A",swing:0.16,melody:0.38,filter:7800,reverb:0.28,pump:0.20,drumsVol:0.70,chordInst:"Rhodes",drums:"Mellow",prog:"clean",scale:"majorPent",vinylOn:false,rainOn:false,structureOn:false}
};
const DRUM_PATS = {
  Mellow:  {k:[0,8],s:[4,12],h:[0,2,4,6,8,10,12,14],o:[]},
  BoomBap: {k:[0,7,10],s:[4,12],h:[0,2,4,6,8,10,12,14],o:[]},
  HeadNod: {k:[0,6,10],s:[4,12],h:[0,2,3,4,6,8,10,12,14],o:[]},
  Sparse:  {k:[0,8],s:[12],h:[4,12],o:[]},
  Jazzy:   {k:[0,7],s:[4,12],h:[0,2,3,4,6,7,8,10,12,14],o:[14]},
  None:    {k:[],s:[],h:[],o:[]}
};
// Intro / Groove / Lift / Break cycle (bars)
const STRUCTURE = [
  {name:"Intro", bars:4, drum:0.55, mel:0.2, chord:0.75},
  {name:"Groove", bars:8, drum:1.0, mel:0.85, chord:1.0},
  {name:"Lift", bars:8, drum:1.0, mel:1.0, chord:1.0},
  {name:"Break", bars:4, drum:0.35, mel:0.5, chord:0.85}
];

function $(id){ return document.getElementById(id); }

function getP(){
  return {
    bpm:+$("bpm").value, key:$("key").value, swing:+$("swing").value,
    melody:+$("melody").value, filter:+$("filter").value, reverb:+$("reverb").value,
    pump:+$("pump").value, drumsVol:+$("drumsVol").value,
    chordInst:$("chordInst").value, drums:$("drums").value,
    prog: window._prog || "chill", scale: window._scale || "minorPent",
    vinylOn: $("vinylOn").checked, rainOn: $("rainOn").checked,
    structureOn: $("structureOn").checked
  };
}

function updateLabels(){
  $("bpmVal").textContent=$("bpm").value;
  $("swingVal").textContent=(+$("swing").value).toFixed(2);
  $("melodyVal").textContent=(+$("melody").value).toFixed(2);
  $("filterVal").textContent=$("filter").value;
  $("reverbVal").textContent=(+$("reverb").value).toFixed(2);
  $("pumpVal").textContent=(+$("pump").value).toFixed(2);
  $("drumsVal").textContent=(+$("drumsVol").value).toFixed(2);
}

function sectionForBar(bar, enabled){
  if(!enabled) return {name:"Groove", drum:1, mel:1, chord:1};
  let t=0;
  const cycle = STRUCTURE.reduce((s,x)=>s+x.bars,0);
  const b = bar % cycle;
  for(const s of STRUCTURE){
    if(b < t+s.bars) return s;
    t+=s.bars;
  }
  return STRUCTURE[1];
}

// ── Audio graph ──
function ensureCtx(){
  if(ctx) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.7;
  musicGain = ctx.createGain(); musicGain.gain.value = 1; // for pump

  filterNode = ctx.createBiquadFilter();
  filterNode.type="lowpass"; filterNode.frequency.value=5600; filterNode.Q.value=0.7;

  reverbSend = ctx.createGain();
  reverbReturn = ctx.createGain(); reverbReturn.gain.value=0.35;
  const d1=ctx.createDelay(1); d1.delayTime.value=0.27;
  const d2=ctx.createDelay(1); d2.delayTime.value=0.39;
  const d3=ctx.createDelay(1); d3.delayTime.value=0.53;
  const fb=ctx.createGain(); fb.gain.value=0.38;
  const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=4500;
  reverbSend.connect(d1); d1.connect(d2); d2.connect(d3); d3.connect(fb); fb.connect(d1);
  d1.connect(lp); d2.connect(lp); d3.connect(lp); lp.connect(reverbReturn);
  reverbReturn.connect(master);

  analyser = ctx.createAnalyser();
  analyser.fftSize=512; analyser.smoothingTimeConstant=0.72;

  musicGain.connect(filterNode);
  filterNode.connect(master);
  master.connect(analyser);
  analyser.connect(ctx.destination);
}

function noiseBuf(dur){
  const n=Math.floor(ctx.sampleRate*dur);
  const b=ctx.createBuffer(1,n,ctx.sampleRate);
  const d=b.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
  return b;
}

// ── Stronger drums ──
function kick(t, g=0.9){
  const o=ctx.createOscillator(), gn=ctx.createGain();
  o.frequency.setValueAtTime(175,t);
  o.frequency.exponentialRampToValueAtTime(38,t+0.09);
  gn.gain.setValueAtTime(g,t);
  gn.gain.exponentialRampToValueAtTime(0.001,t+0.42);
  o.connect(gn); gn.connect(master);
  // layered sub
  const s=ctx.createOscillator(), sg=ctx.createGain();
  s.frequency.setValueAtTime(70,t);
  s.frequency.exponentialRampToValueAtTime(35,t+0.12);
  sg.gain.setValueAtTime(g*0.55,t);
  sg.gain.exponentialRampToValueAtTime(0.001,t+0.35);
  s.connect(sg); sg.connect(master);
  // click
  const c=ctx.createOscillator(), cg=ctx.createGain();
  c.type="square"; c.frequency.value=1400;
  cg.gain.setValueAtTime(g*0.28,t);
  cg.gain.exponentialRampToValueAtTime(0.001,t+0.02);
  c.connect(cg); cg.connect(master);
  o.start(t); o.stop(t+0.45);
  s.start(t); s.stop(t+0.4);
  c.start(t); c.stop(t+0.03);
}

function snare(t, g=0.52){
  const n=ctx.createBufferSource(); n.buffer=noiseBuf(0.3);
  const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=2400; bp.Q.value=0.85;
  const hp=ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=800;
  const gn=ctx.createGain();
  gn.gain.setValueAtTime(g,t); gn.gain.exponentialRampToValueAtTime(0.001,t+0.22);
  n.connect(bp); bp.connect(hp); hp.connect(gn); gn.connect(master);
  // tonal body
  const o=ctx.createOscillator(), og=ctx.createGain();
  o.frequency.setValueAtTime(200,t); o.frequency.exponentialRampToValueAtTime(140,t+0.08);
  og.gain.setValueAtTime(g*0.55,t); og.gain.exponentialRampToValueAtTime(0.001,t+0.14);
  o.connect(og); og.connect(master);
  // snap
  const sn=ctx.createBufferSource(); sn.buffer=noiseBuf(0.05);
  const snh=ctx.createBiquadFilter(); snh.type="highpass"; snh.frequency.value=5000;
  const sng=ctx.createGain(); sng.gain.setValueAtTime(g*0.4,t); sng.gain.exponentialRampToValueAtTime(0.001,t+0.04);
  sn.connect(snh); snh.connect(sng); sng.connect(master);
  n.start(t); n.stop(t+0.28);
  o.start(t); o.stop(t+0.16);
  sn.start(t); sn.stop(t+0.05);
}

function hat(t, g=0.2, open=false){
  const n=ctx.createBufferSource(); n.buffer=noiseBuf(open?0.35:0.06);
  const hp=ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=7800;
  const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=9000; bp.Q.value=0.6;
  const gn=ctx.createGain();
  gn.gain.setValueAtTime(g,t);
  gn.gain.exponentialRampToValueAtTime(0.001,t+(open?0.3:0.05));
  n.connect(hp); hp.connect(bp); bp.connect(gn); gn.connect(master);
  n.start(t); n.stop(t+(open?0.35:0.07));
}

// ── Rhodes FM / Piano / Pad / Pluck ──
function chordTone(t, freq, type, gain, dur){
  const dest = musicGain;
  if(type==="Rhodes"){
    // carrier + modulator (simple FM)
    const car=ctx.createOscillator(), mod=ctx.createOscillator(), mg=ctx.createGain(), gn=ctx.createGain();
    const f=ctx.createBiquadFilter(); f.type="lowpass"; f.frequency.value=3200;
    car.type="sine"; car.frequency.value=freq;
    mod.type="sine"; mod.frequency.value=freq*1.5;
    mg.gain.setValueAtTime(freq*1.1,t);
    mg.gain.exponentialRampToValueAtTime(freq*0.2,t+dur*0.6);
    mod.connect(mg); mg.connect(car.frequency);
    gn.gain.setValueAtTime(0,t);
    gn.gain.linearRampToValueAtTime(gain,t+0.015);
    gn.gain.exponentialRampToValueAtTime(0.001,t+dur*0.9);
    car.connect(f); f.connect(gn); gn.connect(dest); gn.connect(reverbSend);
    // detuned second partial
    const car2=ctx.createOscillator(), g2=ctx.createGain();
    car2.type="sine"; car2.frequency.value=freq*2.003;
    g2.gain.setValueAtTime(0,t); g2.gain.linearRampToValueAtTime(gain*0.25,t+0.02);
    g2.gain.exponentialRampToValueAtTime(0.001,t+dur*0.5);
    car2.connect(g2); g2.connect(dest);
    car.start(t); car.stop(t+dur+0.2);
    mod.start(t); mod.stop(t+dur+0.2);
    car2.start(t); car2.stop(t+dur+0.15);
  } else if(type==="Piano"){
    for(let i=0;i<4;i++){
      const o=ctx.createOscillator(), gn=ctx.createGain(), f=ctx.createBiquadFilter();
      o.type="triangle";
      o.frequency.value=freq*(i===0?1:i===1?2:i===2?3:4.02);
      o.detune.value=(Math.random()-0.5)*4;
      f.type="lowpass"; f.frequency.value=4800-i*600;
      const g0=gain*(i===0?0.55:i===1?0.28:i===2?0.12:0.06);
      gn.gain.setValueAtTime(0,t);
      gn.gain.linearRampToValueAtTime(g0,t+0.006);
      gn.gain.exponentialRampToValueAtTime(0.001,t+dur*(0.55+i*0.08));
      o.connect(f); f.connect(gn); gn.connect(dest); if(i<2) gn.connect(reverbSend);
      o.start(t); o.stop(t+dur+0.2);
    }
  } else if(type==="Pad"){
    for(let i=0;i<4;i++){
      const o=ctx.createOscillator(), gn=ctx.createGain(), f=ctx.createBiquadFilter();
      o.type="sawtooth"; o.frequency.value=freq; o.detune.value=(i-1.5)*7;
      f.type="lowpass"; f.frequency.value=1300;
      gn.gain.setValueAtTime(0,t);
      gn.gain.linearRampToValueAtTime(gain/4,t+0.4);
      gn.gain.setTargetAtTime(0.001,t+dur*0.65,0.5);
      o.connect(f); f.connect(gn); gn.connect(dest); gn.connect(reverbSend);
      o.start(t); o.stop(t+dur+0.6);
    }
  } else { // Pluck
    for(let i=0;i<3;i++){
      const o=ctx.createOscillator(), gn=ctx.createGain(), f=ctx.createBiquadFilter();
      o.type="triangle"; o.frequency.value=freq*(i+1);
      f.type="lowpass"; f.frequency.value=3600-i*800;
      gn.gain.setValueAtTime(0,t);
      gn.gain.linearRampToValueAtTime(gain/(i+1.5),t+0.003);
      gn.gain.exponentialRampToValueAtTime(0.001,t+0.32);
      o.connect(f); f.connect(gn); gn.connect(dest);
      o.start(t); o.stop(t+0.4);
    }
  }
}

function playChord(t, rootHz, intervals, type, gain){
  const dur = type==="Pad"?3.4:1.7;
  intervals.forEach((semi,idx)=>{
    const f=rootHz*Math.pow(2,semi/12);
    chordTone(t+idx*0.006, f, type, gain*(0.92+Math.random()*0.1), dur);
  });
}

function bass(t, freq, g=0.4){
  const o=ctx.createOscillator(), o2=ctx.createOscillator(), gn=ctx.createGain();
  o.type="sine"; o.frequency.value=freq;
  o2.type="triangle"; o2.frequency.value=freq; o2.detune.value=4;
  gn.gain.setValueAtTime(0,t); gn.gain.linearRampToValueAtTime(g,t+0.01);
  gn.gain.exponentialRampToValueAtTime(0.001,t+0.45);
  o.connect(gn); o2.connect(gn); gn.connect(master);
  o.start(t); o.stop(t+0.5); o2.start(t); o2.stop(t+0.5);
}

function melodyNote(t, freq, g=0.13){
  const o=ctx.createOscillator(), gn=ctx.createGain(), f=ctx.createBiquadFilter();
  o.type="sine"; o.frequency.value=freq;
  f.type="lowpass"; f.frequency.value=3400;
  gn.gain.setValueAtTime(0,t); gn.gain.linearRampToValueAtTime(g,t+0.012);
  gn.gain.exponentialRampToValueAtTime(0.001,t+0.5);
  o.connect(f); f.connect(gn); gn.connect(musicGain); gn.connect(reverbSend);
  o.start(t); o.stop(t+0.55);
}

function vinylCrackle(t, on){
  if(!on || Math.random()>0.45) return;
  const n=ctx.createBufferSource(); n.buffer=noiseBuf(0.035+Math.random()*0.05);
  const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=1800+Math.random()*3500;
  const gn=ctx.createGain(); gn.gain.value=0.04*(0.5+Math.random());
  n.connect(bp); bp.connect(gn); gn.connect(master);
  n.start(t+Math.random()*1.6);
}

function rainLayer(t, on){
  if(!on) return;
  const n=ctx.createBufferSource(); n.buffer=noiseBuf(2.0);
  const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=4000; bp.Q.value=0.4;
  const gn=ctx.createGain(); gn.gain.value=0.028;
  n.connect(bp); bp.connect(gn); gn.connect(master);
  n.start(t); n.stop(t+2.0);
}

// Sidechain pump on musicGain when kick hits
function schedulePump(t, amount){
  if(amount<0.05) return;
  const now = Math.max(t, ctx.currentTime);
  const depth = 1 - amount*0.75;
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setValueAtTime(musicGain.gain.value, now);
  musicGain.gain.linearRampToValueAtTime(depth, now+0.02);
  musicGain.gain.setTargetAtTime(1, now+0.05, 0.12);
}

function scheduleBar(p, t0){
  const spb=60/p.bpm, s16=spb/4, swing=p.swing;
  const sec = sectionForBar(barCount, p.structureOn);
  const pat = DRUM_PATS[p.drums]||DRUM_PATS.Mellow;
  const dv = p.drumsVol * sec.drum;
  const when = (i)=> t0 + i*s16 + ((i%2)?swing*s16:0);

  pat.k.forEach(i=>{ kick(when(i), 0.88*dv); schedulePump(when(i), p.pump); });
  pat.s.forEach(i=> snare(when(i), 0.5*dv));
  pat.h.forEach(i=> hat(when(i), 0.18*dv, false));
  pat.o.forEach(i=> hat(when(i), 0.26*dv, true));

  const bank = PROGS[p.prog]||PROGS.chill;
  const prog = bank[Math.floor(barCount/16)%bank.length];
  const [deg, iv] = prog[barCount%prog.length];
  const rootHz = (NOTE[p.key]||440)*Math.pow(2,deg/12);
  const chordRoot = rootHz*(rootHz<200?2:rootHz>420?0.5:1);

  playChord(t0+0.01, chordRoot, iv, p.chordInst, 0.16*sec.chord);
  bass(t0+0.01, chordRoot/2, 0.38);

  // scale-aware melody with memory
  if(p.melody>0.05 && sec.mel>0.15){
    const scale = SCALES[p.scale]||SCALES.minorPent;
    const slots = [0,2,4,6,8,10,12,14];
    slots.forEach(st=>{
      if(Math.random() > 0.28 + p.melody*0.5*sec.mel) return;
      // stepwise motion
      if(Math.random()<0.7){
        melState.deg += melState.dir * (Math.random()<0.7?1:2);
        if(melState.deg>=scale.length){ melState.deg=scale.length-1; melState.dir=-1; }
        if(melState.deg<0){ melState.deg=0; melState.dir=1; }
      } else {
        melState.deg = Math.floor(Math.random()*scale.length);
      }
      const oct = (Math.random()>0.75)?12:0;
      const freq = chordRoot * Math.pow(2, (scale[melState.deg]+oct)/12);
      melodyNote(when(st), freq, 0.12*p.melody*sec.mel);
    });
  }

  vinylCrackle(t0, p.vinylOn);
  if(barCount%2===0) rainLayer(t0, p.rainOn);

  $("sectionInfo").textContent = sec.name;
}

function scheduler(){
  const p=getP();
  filterNode.frequency.setTargetAtTime(p.filter, ctx.currentTime, 0.05);
  reverbReturn.gain.setTargetAtTime(p.reverb*0.55, ctx.currentTime, 0.08);
  const barDur=(60/p.bpm)*4;
  while(nextTime < ctx.currentTime+0.18){
    scheduleBar(p, nextTime);
    nextTime += barDur;
    barCount++;
    $("barInfo").textContent = `Bar ${barCount}`;
  }
  timerID = setTimeout(scheduler, 30);
}

// ── Visualizer + meters ──
function drawViz(){
  if(!analyser) return;
  const canvas=$("viz");
  const w=canvas.clientWidth, h=canvas.clientHeight;
  if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
  const g=canvas.getContext("2d");
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()||"#7c9cff";

  if(vizMode==="spectrum"){
    const buf=new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buf);
    g.clearRect(0,0,w,h);
    const bars=48, step=Math.floor(buf.length/bars), bw=w/bars-2;
    for(let i=0;i<bars;i++){
      let sum=0; for(let j=0;j<step;j++) sum+=buf[i*step+j];
      const v=sum/step/255;
      const bh=Math.max(2,v*h*0.9);
      const grad=g.createLinearGradient(0,h-bh,0,h);
      grad.addColorStop(0, accent);
      grad.addColorStop(1,"rgba(167,139,250,0.3)");
      g.fillStyle=grad;
      g.beginPath(); g.roundRect(i*(bw+2), h-bh, bw, bh, 3); g.fill();
    }
  } else {
    const buf=new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buf);
    g.clearRect(0,0,w,h);
    g.strokeStyle=accent; g.lineWidth=2; g.beginPath();
    for(let i=0;i<buf.length;i++){
      const x=i/buf.length*w;
      const y=((buf[i]-128)/128)*h*0.45 + h/2;
      i===0?g.moveTo(x,y):g.lineTo(x,y);
    }
    g.stroke();
  }

  // simple peak meters from time domain
  const td=new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(td);
  let peak=0;
  for(let i=0;i<td.length;i++) peak=Math.max(peak, Math.abs(td[i]-128)/128);
  const pct = Math.min(100, peak*140);
  $("meterL").style.width = pct+"%";
  $("meterR").style.width = (pct*(0.92+Math.random()*0.08))+"%";

  animID = requestAnimationFrame(drawViz);
}

function start(){
  ensureCtx();
  if(ctx.state==="suspended") ctx.resume();
  nextTime=ctx.currentTime+0.08; barCount=0; melState={deg:2,dir:1};
  isPlaying=true;
  $("playBtn").classList.add("playing");
  $("playBtn").querySelector(".icon").textContent="■";
  $("playBtn").querySelector(".label").textContent="Stop";
  $("status").textContent="Playing";
  scheduler();
  if(!animID) drawViz();
}
function stop(){
  isPlaying=false; clearTimeout(timerID);
  $("playBtn").classList.remove("playing");
  $("playBtn").querySelector(".icon").textContent="▶";
  $("playBtn").querySelector(".label").textContent="Play";
  $("status").textContent="Stopped";
  $("barInfo").textContent="—";
  $("sectionInfo").textContent="—";
}

// ── Export WAV with progress ──
function floatTo16(input){
  const buf=new ArrayBuffer(input.length*2), view=new DataView(buf);
  for(let i=0;i<input.length;i++){
    const s=Math.max(-1,Math.min(1,input[i]));
    view.setInt16(i*2, s<0?s*0x8000:s*0x7FFF, true);
  }
  return buf;
}
function encodeWav(left,right,sr){
  const len=left.length, ab=new ArrayBuffer(44+len*4), v=new DataView(ab);
  const w=(o,s)=>{ for(let i=0;i<s.length;i++) v.setUint8(o+i,s.charCodeAt(i)); };
  w(0,"RIFF"); v.setUint32(4,36+len*4,true); w(8,"WAVE"); w(12,"fmt ");
  v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,2,true);
  v.setUint32(24,sr,true); v.setUint32(28,sr*4,true); v.setUint16(32,4,true);
  v.setUint16(34,16,true); w(36,"data"); v.setUint32(40,len*4,true);
  const u8=new Uint8Array(ab), l8=new Uint8Array(floatTo16(left)), r8=new Uint8Array(floatTo16(right));
  for(let i=0,o=44;i<len;i++,o+=4){ u8[o]=l8[i*2]; u8[o+1]=l8[i*2+1]; u8[o+2]=r8[i*2]; u8[o+3]=r8[i*2+1]; }
  return ab;
}

async function renderAndDownload(){
  const btn=$("downloadBtn"), prog=$("exportProgress"), fill=$("exportBarFill"), pct=$("exportPct");
  btn.disabled=true; btn.classList.add("loading"); btn.textContent="Rendering…";
  prog.classList.remove("hidden"); fill.style.width="0%"; pct.textContent="0%";
  $("status").textContent="Rendering…";
  try{
    const secs=+$("exportLen").value;
    const p=getP();
    const sr=44100;
    // Simulate progress while offline render runs
    let fake=0;
    const tick=setInterval(()=>{
      fake=Math.min(92, fake+ (secs>120?0.8:secs>60?1.5:3));
      fill.style.width=fake+"%"; pct.textContent=Math.floor(fake)+"%";
    }, 200);

    const offline=new OfflineAudioContext(2, sr*secs, sr);
    const oMaster=offline.createGain(); oMaster.gain.value=0.7;
    const oMusic=offline.createGain(); oMusic.gain.value=1;
    const oFilter=offline.createBiquadFilter(); oFilter.type="lowpass"; oFilter.frequency.value=p.filter;
    oMusic.connect(oFilter); oFilter.connect(oMaster); oMaster.connect(offline.destination);

    const old={ctx,master,musicGain,reverbSend};
    ctx=offline; master=oMaster; musicGain=oMusic; reverbSend=offline.createGain();
    let t=0.05; const barDur=(60/p.bpm)*4;
    const saved=barCount; barCount=0; melState={deg:2,dir:1};
    while(t<secs-0.4){ scheduleBar(p,t); t+=barDur; barCount++; }
    barCount=saved;
    const rendered=await offline.startRendering();
    Object.assign(window, {}); // no-op
    ctx=old.ctx; master=old.master; musicGain=old.musicGain; reverbSend=old.reverbSend;
    clearInterval(tick); fill.style.width="100%"; pct.textContent="100%";

    const wav=encodeWav(rendered.getChannelData(0), rendered.getChannelData(1), sr);
    const blob=new Blob([wav],{type:"audio/wav"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`lofi_${currentPresetName}_${p.key}_${p.bpm}bpm_${secs}s.wav`;
    a.click(); URL.revokeObjectURL(url);
    $("status").textContent="Downloaded";
  }catch(e){
    console.error(e); $("status").textContent="Render failed"; alert("Export failed: "+e.message);
  }finally{
    btn.disabled=false; btn.classList.remove("loading"); btn.textContent="Download WAV";
    setTimeout(()=>prog.classList.add("hidden"), 800);
  }
}

// ── Presets / share / storage ──
function applyPreset(name, data){
  const pr = data || PRESETS[name];
  if(!pr) return;
  if(name) currentPresetName=name;
  $("bpm").value=pr.bpm; $("key").value=pr.key; $("swing").value=pr.swing;
  $("melody").value=pr.melody; $("filter").value=pr.filter; $("reverb").value=pr.reverb;
  $("pump").value=pr.pump??0.35; $("drumsVol").value=pr.drumsVol;
  $("chordInst").value=pr.chordInst; $("drums").value=pr.drums;
  $("vinylOn").checked=!!pr.vinylOn; $("rainOn").checked=!!pr.rainOn;
  $("structureOn").checked=pr.structureOn!==false;
  window._prog=pr.prog; window._scale=pr.scale;
  updateLabels();
  document.querySelectorAll(".chip").forEach(c=>c.classList.toggle("active", c.dataset.p===name));
  saveSettings();
}

function collectSettings(){
  const p=getP();
  return {...p, preset: currentPresetName};
}

function saveSettings(){
  try{ localStorage.setItem("lofi_web_settings", JSON.stringify(collectSettings())); }catch(e){}
}

function loadSettings(){
  try{
    const raw=localStorage.getItem("lofi_web_settings");
    if(!raw) return false;
    const s=JSON.parse(raw);
    if(s.preset && PRESETS[s.preset]) applyPreset(s.preset, {...PRESETS[s.preset], ...s});
    else applyPreset("chill", s);
    return true;
  }catch(e){ return false; }
}

function shareLink(){
  const s=collectSettings();
  const hash=btoa(unescape(encodeURIComponent(JSON.stringify(s)))).replace(/=+$/,"'");
  const url=location.origin+location.pathname+"#"+hash;
  navigator.clipboard.writeText(url).then(()=>{
    $("status").textContent="Link copied";
    setTimeout(()=>{ if(!isPlaying) $("status").textContent="Ready"; }, 2000);
  }).catch(()=> prompt("Copy this share link:", url));
}

function loadFromHash(){
  if(!location.hash||location.hash.length<8) return false;
  try{
    const json=decodeURIComponent(escape(atob(location.hash.slice(1).replace(/'/g,""))));
    const s=JSON.parse(json);
    applyPreset(s.preset||"chill", {...(PRESETS[s.preset]||{}), ...s});
    return true;
  }catch(e){ return false; }
}

function randomize(){
  const keys=Object.keys(PRESETS);
  applyPreset(keys[Math.floor(Math.random()*keys.length)]);
  $("bpm").value=Math.min(98,Math.max(58,+$("bpm").value+Math.floor(Math.random()*7)-3));
  $("swing").value=Math.min(0.4,Math.max(0,+$("swing").value+(Math.random()-0.5)*0.08));
  $("filter").value=Math.min(10000,Math.max(2000,+$("filter").value+Math.floor(Math.random()*800)-400));
  updateLabels(); saveSettings();
}

// Theme accents
const THEMES = [
  {accent:"#7c9cff", accent2:"#a78bfa"},
  {accent:"#5eead4", accent2:"#2dd4bf"},
  {accent:"#f472b6", accent2:"#e879f9"},
  {accent:"#fbbf24", accent2:"#f59e0b"},
  {accent:"#a3e635", accent2:"#84cc16"}
];
let themeIdx=0;
function cycleTheme(){
  themeIdx=(themeIdx+1)%THEMES.length;
  const t=THEMES[themeIdx];
  document.documentElement.style.setProperty("--accent", t.accent);
  document.documentElement.style.setProperty("--accent-2", t.accent2);
  try{ localStorage.setItem("lofi_theme", themeIdx); }catch(e){}
}

// Wire UI
$("playBtn").addEventListener("click", ()=> isPlaying?stop():start());
$("downloadBtn").addEventListener("click", renderAndDownload);
$("randomBtn").addEventListener("click", randomize);
$("shareBtn").addEventListener("click", shareLink);
$("themeBtn").addEventListener("click", cycleTheme);

document.querySelectorAll(".chip").forEach(chip=>{
  chip.addEventListener("click", ()=> applyPreset(chip.dataset.p));
});
document.querySelectorAll(".viz-tab").forEach(tab=>{
  tab.addEventListener("click", ()=>{
    document.querySelectorAll(".viz-tab").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    vizMode=tab.dataset.mode;
  });
});

["bpm","swing","melody","filter","reverb","pump","drumsVol"].forEach(id=>{
  $(id).addEventListener("input", ()=>{ updateLabels(); saveSettings(); });
});
["key","chordInst","drums","vinylOn","rainOn","structureOn"].forEach(id=>{
  $(id).addEventListener("change", saveSettings);
});

// Spacebar
document.addEventListener("keydown", e=>{
  if(e.code==="Space" && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)){
    e.preventDefault();
    isPlaying?stop():start();
  }
});

// Init
window._prog="chill"; window._scale="minorPent";
if(!loadFromHash()) loadSettings() || applyPreset("chill");
try{ themeIdx=+(localStorage.getItem("lofi_theme")||0); cycleTheme(); themeIdx=(themeIdx-1+THEMES.length)%THEMES.length; cycleTheme(); }catch(e){}
updateLabels();
$("status").textContent="Ready · Space to play";
