/**
 * Lofi Beat Maker – Web Studio Pro
 * Expanded controls, presets, FX, tools
 */
const AC = window.AudioContext || window.webkitAudioContext;
let ctx=null, master, musicGain, filterNode, reverbSend, reverbReturn, echoNode, analyser;
let isPlaying=false, nextTime=0, timerID=null, barCount=0, animID=null;
let vizMode="spectrum", melState={deg:2,dir:1}, currentPresetName="chill";
let audioUnlocked=false, sleepEnd=0, tapTimes=[], rng=Math.random;

const NOTE={C:261.63,"C#":277.18,D:293.66,"D#":311.13,E:329.63,F:349.23,"F#":369.99,G:392, "G#":415.3,A:440,"A#":466.16,B:493.88};
const SCALES={
  minorPent:[0,3,5,7,10], majorPent:[0,2,4,7,9], dorian:[0,2,3,5,7,9,10],
  naturalMin:[0,2,3,5,7,8,10], major:[0,2,4,5,7,9,11], blues:[0,3,5,6,7,10], mixo:[0,2,4,5,7,9,10]
};
const PROG_LIST={
  "Study Session":[[0,[0,3,7,10]],[5,[0,3,7,10]],[10,[0,4,7,10]],[3,[0,4,7,11]]],
  "Rainy Jazz":[[2,[0,3,7,10]],[7,[0,4,7,10]],[0,[0,4,7,11]],[9,[0,3,7,10]]],
  "Dusty Boom Bap":[[0,[0,3,7,10]],[8,[0,4,7,11]],[3,[0,4,7,11]],[10,[0,4,7,10]]],
  "Late Night":[[0,[0,3,7,10,14]],[8,[0,4,7,11]],[5,[0,3,7,10]],[7,[0,4,7,10]]],
  "Neo Soul":[[0,[0,3,7,10,14]],[3,[0,4,7,11]],[10,[0,4,7,10]],[5,[0,3,7,10,14]]],
  "Dreamy Float":[[0,[0,3,7,10,14]],[3,[0,4,7,11]],[8,[0,4,7,11]],[10,[0,4,7,10]]],
  "Sad Piano":[[0,[0,3,7,10]],[8,[0,4,7,11]],[10,[0,4,7,10]],[7,[0,3,7,10]]],
  "Two Chord":[[2,[0,3,7,10]],[7,[0,4,7,10]]],
  "Jazz ii-V-I":[[2,[0,3,7,10]],[7,[0,4,7,10]],[0,[0,4,7,11]],[0,[0,4,7,11]]],
  "Hopeful":[[0,[0,4,7,11]],[7,[0,4,7,10]],[9,[0,3,7,10]],[5,[0,4,7,11]]],
  "Lofi Classic":[[0,[0,4,7,11]],[9,[0,3,7,10]],[2,[0,3,7,10]],[7,[0,4,7,10]]],
  "Minor Drift":[[0,[0,3,7,10]],[10,[0,4,7,10]],[8,[0,4,7,11]],[7,[0,4,7,10]]]
};
const PRESETS={
  chill:{bpm:76,key:"A",scale:"minorPent",swing:0.22,humanize:0.35,melody:0.4,filter:5800,reverb:0.36,pump:0.35,echo:0.18,width:0.45,drumsVol:0.78,masterVol:0.85,chordInst:"Rhodes",drums:"Mellow",prog:"Study Session",chordRhythm:"stabs",bassStyle:"root",vinylOn:true,rainOn:false,structureOn:true},
  rainy:{bpm:82,key:"F",scale:"majorPent",swing:0.3,humanize:0.4,melody:0.35,filter:6400,reverb:0.42,pump:0.25,echo:0.22,width:0.5,drumsVol:0.7,masterVol:0.85,chordInst:"Piano",drums:"Jazzy",prog:"Rainy Jazz",chordRhythm:"offbeat",bassStyle:"walk",vinylOn:true,rainOn:true,structureOn:true},
  dusty:{bpm:88,key:"D",scale:"minorPent",swing:0.28,humanize:0.45,melody:0.28,filter:4200,reverb:0.28,pump:0.5,echo:0.15,width:0.4,drumsVol:0.88,masterVol:0.85,chordInst:"Pluck",drums:"BoomBap",prog:"Dusty Boom Bap",chordRhythm:"stabs",bassStyle:"bounce",vinylOn:true,rainOn:false,structureOn:true},
  night:{bpm:78,key:"C#",scale:"dorian",swing:0.18,humanize:0.3,melody:0.45,filter:4800,reverb:0.5,pump:0.4,echo:0.25,width:0.55,drumsVol:0.72,masterVol:0.85,chordInst:"Pad",drums:"HeadNod",prog:"Late Night",chordRhythm:"whole",bassStyle:"fifth",vinylOn:true,rainOn:false,structureOn:true},
  dreamy:{bpm:64,key:"E",scale:"dorian",swing:0.12,humanize:0.25,melody:0.3,filter:3800,reverb:0.62,pump:0.2,echo:0.3,width:0.65,drumsVol:0.55,masterVol:0.8,chordInst:"Pad",drums:"Sparse",prog:"Dreamy Float",chordRhythm:"whole",bassStyle:"root",vinylOn:false,rainOn:false,structureOn:true},
  neo:{bpm:84,key:"A#",scale:"dorian",swing:0.28,humanize:0.4,melody:0.42,filter:5600,reverb:0.34,pump:0.38,echo:0.2,width:0.48,drumsVol:0.8,masterVol:0.85,chordInst:"Rhodes",drums:"HeadNod",prog:"Neo Soul",chordRhythm:"offbeat",bassStyle:"bounce",vinylOn:true,rainOn:false,structureOn:true},
  piano:{bpm:66,key:"D#",scale:"naturalMin",swing:0.14,humanize:0.3,melody:0.48,filter:5000,reverb:0.44,pump:0.22,echo:0.18,width:0.4,drumsVol:0.5,masterVol:0.85,chordInst:"Piano",drums:"Sparse",prog:"Sad Piano",chordRhythm:"half",bassStyle:"root",vinylOn:true,rainOn:false,structureOn:true},
  clean:{bpm:76,key:"A",scale:"majorPent",swing:0.16,humanize:0.2,melody:0.38,filter:7800,reverb:0.28,pump:0.2,echo:0.12,width:0.4,drumsVol:0.7,masterVol:0.85,chordInst:"Rhodes",drums:"Mellow",prog:"Lofi Classic",chordRhythm:"stabs",bassStyle:"fifth",vinylOn:false,rainOn:false,structureOn:false},
  dilla:{bpm:90,key:"G",scale:"minorPent",swing:0.34,humanize:0.55,melody:0.32,filter:4600,reverb:0.3,pump:0.45,echo:0.15,width:0.42,drumsVol:0.85,masterVol:0.85,chordInst:"EP",drums:"Dilla",prog:"Dusty Boom Bap",chordRhythm:"stabs",bassStyle:"bounce",vinylOn:true,rainOn:false,structureOn:true},
  cafe:{bpm:80,key:"G#",scale:"major",swing:0.26,humanize:0.35,melody:0.4,filter:6800,reverb:0.38,pump:0.3,echo:0.2,width:0.5,drumsVol:0.72,masterVol:0.85,chordInst:"Pluck",drums:"Jazzy",prog:"Hopeful",chordRhythm:"offbeat",bassStyle:"walk",vinylOn:true,rainOn:false,structureOn:true},
  focus:{bpm:78,key:"G",scale:"majorPent",swing:0.2,humanize:0.25,melody:0.35,filter:7000,reverb:0.3,pump:0.28,echo:0.15,width:0.4,drumsVol:0.68,masterVol:0.85,chordInst:"Piano",drums:"HeadNod",prog:"Study Session",chordRhythm:"arp",bassStyle:"fifth",vinylOn:false,rainOn:false,structureOn:true},
  midnight:{bpm:72,key:"D",scale:"dorian",swing:0.2,humanize:0.35,melody:0.4,filter:5200,reverb:0.48,pump:0.35,echo:0.28,width:0.55,drumsVol:0.7,masterVol:0.82,chordInst:"Bell",drums:"Mellow",prog:"Late Night",chordRhythm:"stabs",bassStyle:"fifth",vinylOn:true,rainOn:false,structureOn:true},
  triphop:{bpm:70,key:"F#",scale:"naturalMin",swing:0.18,humanize:0.4,melody:0.3,filter:4000,reverb:0.45,pump:0.4,echo:0.22,width:0.5,drumsVol:0.75,masterVol:0.85,chordInst:"Pad",drums:"TripHop",prog:"Minor Drift",chordRhythm:"half",bassStyle:"sparse",vinylOn:true,rainOn:false,structureOn:true},
  sunday:{bpm:70,key:"G",scale:"majorPent",swing:0.15,humanize:0.25,melody:0.5,filter:7500,reverb:0.35,pump:0.2,echo:0.15,width:0.45,drumsVol:0.55,masterVol:0.85,chordInst:"Pluck",drums:"Sparse",prog:"Hopeful",chordRhythm:"half",bassStyle:"sparse",vinylOn:true,rainOn:false,structureOn:true},
  velvet:{bpm:68,key:"C#",scale:"dorian",swing:0.3,humanize:0.4,melody:0.4,filter:5400,reverb:0.45,pump:0.42,echo:0.2,width:0.5,drumsVol:0.78,masterVol:0.85,chordInst:"Rhodes",drums:"BoomBap",prog:"Neo Soul",chordRhythm:"arp",bassStyle:"walk",vinylOn:true,rainOn:false,structureOn:true},
  jazzlounge:{bpm:86,key:"A#",scale:"mixo",swing:0.34,humanize:0.4,melody:0.45,filter:6800,reverb:0.4,pump:0.15,echo:0.18,width:0.55,drumsVol:0.7,masterVol:0.85,chordInst:"Piano",drums:"Jazzy",prog:"Jazz ii-V-I",chordRhythm:"offbeat",bassStyle:"walk",vinylOn:false,rainOn:false,structureOn:true}
};
const PRESET_LABELS={chill:"Chill Study",rainy:"Rainy Jazz",dusty:"Dusty Boom Bap",night:"Late Night",dreamy:"Dreamy",neo:"Neo Soul",piano:"Sleepy Piano",clean:"Clean Studio",dilla:"Dilla Swing",cafe:"Cozy Cafe",focus:"Focus Flow",midnight:"Midnight",triphop:"Trip Hop",sunday:"Sunday Morning",velvet:"Velvet Keys",jazzlounge:"Jazz Lounge"};
const MOODS={
  Any:[],
  Calm:["dreamy","piano","sunday","focus","clean"],
  Rainy:["rainy","piano","triphop","night"],
  Jazzy:["jazzlounge","cafe","rainy","neo"],
  Upbeat:["dusty","dilla","cafe","neo"],
  Dark:["triphop","night","velvet","piano"],
  Dreamy:["dreamy","midnight","night","sunday"]
};
const DRUM_PATS={
  Mellow:{k:[0,8],s:[4,12],h:[0,2,4,6,8,10,12,14],o:[]},
  BoomBap:{k:[0,7,10],s:[4,12],h:[0,2,4,6,8,10,12,14],o:[]},
  HeadNod:{k:[0,6,10],s:[4,12],h:[0,2,3,4,6,8,10,12,14],o:[]},
  Sparse:{k:[0,8],s:[12],h:[4,12],o:[]},
  Jazzy:{k:[0,7],s:[4,12],h:[0,2,3,4,6,7,8,10,12,14],o:[14]},
  Dilla:{k:[0,7,9],s:[4,12,13],h:[0,2,3,5,6,8,10,11,12,14],o:[]},
  TripHop:{k:[0,9],s:[8],h:[2,6,10,14],o:[]},
  FourFloor:{k:[0,4,8,12],s:[4,12],h:[2,6,10,14],o:[]},
  None:{k:[],s:[],h:[],o:[]}
};
const STRUCTURE=[
  {name:"Intro",bars:4,drum:0.5,mel:0.15,chord:0.7},
  {name:"Groove",bars:8,drum:1,mel:0.85,chord:1},
  {name:"Lift",bars:8,drum:1,mel:1,chord:1},
  {name:"Break",bars:4,drum:0.3,mel:0.45,chord:0.8}
];
const KEYS=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

function $(id){return document.getElementById(id);}
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function setSeed(s){const n=parseInt(s,10)||1; rng=mulberry32(n); $("seed").value=String(n);}

function getP(){
  return {
    bpm:+$("bpm").value, key:$("key").value, scale:$("scale").value,
    swing:+$("swing").value, humanize:+$("humanize").value, melody:+$("melody").value,
    filter:+$("filter").value, reverb:+$("reverb").value, pump:+$("pump").value,
    echo:+$("echo").value, width:+$("width").value, drumsVol:+$("drumsVol").value,
    masterVol:+$("masterVol").value, chordInst:$("chordInst").value, drums:$("drums").value,
    prog:$("prog").value, chordRhythm:$("chordRhythm").value, bassStyle:$("bassStyle").value,
    vinylOn:$("vinylOn").checked, rainOn:$("rainOn").checked, structureOn:$("structureOn").checked,
    loopLive:$("loopLive").checked,
    muteDrums:$("muteDrums").checked, muteChords:$("muteChords").checked,
    muteBass:$("muteBass").checked, muteMel:$("muteMel").checked,
    seed:$("seed").value
  };
}
function updateLabels(){
  $("bpmVal").textContent=$("bpm").value;
  $("swingVal").textContent=(+$("swing").value).toFixed(2);
  $("humanVal").textContent=(+$("humanize").value).toFixed(2);
  $("melodyVal").textContent=(+$("melody").value).toFixed(2);
  $("filterVal").textContent=$("filter").value;
  $("reverbVal").textContent=(+$("reverb").value).toFixed(2);
  $("pumpVal").textContent=(+$("pump").value).toFixed(2);
  $("echoVal").textContent=(+$("echo").value).toFixed(2);
  $("widthVal").textContent=(+$("width").value).toFixed(2);
  $("drumsVal").textContent=(+$("drumsVol").value).toFixed(2);
  $("masterVal").textContent=(+$("masterVol").value).toFixed(2);
}
function sectionForBar(bar, on){
  if(!on) return {name:"Groove",drum:1,mel:1,chord:1};
  let t=0; const cycle=STRUCTURE.reduce((s,x)=>s+x.bars,0); const b=bar%cycle;
  for(const s of STRUCTURE){ if(b<t+s.bars) return s; t+=s.bars; }
  return STRUCTURE[1];
}
function humanOffset(hum, s16){ return (rng()-0.5)*hum*0.03*s16*4; }

// ── Audio ──
function ensureCtx(){
  if(ctx) return;
  ctx=new AC({latencyHint:"interactive"});
  master=ctx.createGain(); master.gain.value=0.85;
  musicGain=ctx.createGain(); musicGain.gain.value=1;
  filterNode=ctx.createBiquadFilter(); filterNode.type="lowpass"; filterNode.frequency.value=5600; filterNode.Q.value=0.7;
  reverbSend=ctx.createGain(); reverbReturn=ctx.createGain(); reverbReturn.gain.value=0.35;
  const d1=ctx.createDelay(1); d1.delayTime.value=0.27;
  const d2=ctx.createDelay(1); d2.delayTime.value=0.39;
  const d3=ctx.createDelay(1); d3.delayTime.value=0.53;
  const fb=ctx.createGain(); fb.gain.value=0.38;
  const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=4500;
  reverbSend.connect(d1); d1.connect(d2); d2.connect(d3); d3.connect(fb); fb.connect(d1);
  d1.connect(lp); d2.connect(lp); d3.connect(lp); lp.connect(reverbReturn); reverbReturn.connect(master);
  // echo
  echoNode=ctx.createDelay(1.0); echoNode.delayTime.value=0.35;
  const echoFb=ctx.createGain(); echoFb.gain.value=0.25;
  const echoWet=ctx.createGain(); echoWet.gain.value=0.2;
  musicGain.connect(echoNode); echoNode.connect(echoFb); echoFb.connect(echoNode); echoNode.connect(echoWet); echoWet.connect(master);
  window._echoWet=echoWet; window._echoFb=echoFb;

  analyser=ctx.createAnalyser(); analyser.fftSize=512; analyser.smoothingTimeConstant=0.72;
  musicGain.connect(filterNode); filterNode.connect(master);
  master.connect(analyser); analyser.connect(ctx.destination);
}
function unlockAudio(){
  ensureCtx();
  if(audioUnlocked && ctx.state==="running") return Promise.resolve();
  const silent=ctx.createBuffer(1,1,ctx.sampleRate);
  const src=ctx.createBufferSource(); src.buffer=silent; src.connect(ctx.destination);
  try{src.start(0);}catch(e){}
  return ctx.resume().then(()=>{audioUnlocked=true;}).catch(()=>{audioUnlocked=true;});
}
function noiseBuf(dur){
  const n=Math.floor(ctx.sampleRate*dur), b=ctx.createBuffer(1,n,ctx.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=rng()*2-1; return b;
}
function kick(t,g=0.9){
  const o=ctx.createOscillator(), gn=ctx.createGain();
  o.frequency.setValueAtTime(175,t); o.frequency.exponentialRampToValueAtTime(38,t+0.09);
  gn.gain.setValueAtTime(g,t); gn.gain.exponentialRampToValueAtTime(0.001,t+0.42);
  o.connect(gn); gn.connect(master);
  const s=ctx.createOscillator(), sg=ctx.createGain();
  s.frequency.setValueAtTime(70,t); s.frequency.exponentialRampToValueAtTime(35,t+0.12);
  sg.gain.setValueAtTime(g*0.55,t); sg.gain.exponentialRampToValueAtTime(0.001,t+0.35);
  s.connect(sg); sg.connect(master);
  const c=ctx.createOscillator(), cg=ctx.createGain();
  c.type="square"; c.frequency.value=1400; cg.gain.setValueAtTime(g*0.28,t); cg.gain.exponentialRampToValueAtTime(0.001,t+0.02);
  c.connect(cg); cg.connect(master);
  o.start(t);o.stop(t+0.45); s.start(t);s.stop(t+0.4); c.start(t);c.stop(t+0.03);
}
function snare(t,g=0.52){
  const n=ctx.createBufferSource(); n.buffer=noiseBuf(0.3);
  const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=2400; bp.Q.value=0.85;
  const hp=ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=800;
  const gn=ctx.createGain(); gn.gain.setValueAtTime(g,t); gn.gain.exponentialRampToValueAtTime(0.001,t+0.22);
  n.connect(bp); bp.connect(hp); hp.connect(gn); gn.connect(master);
  const o=ctx.createOscillator(), og=ctx.createGain();
  o.frequency.setValueAtTime(200,t); o.frequency.exponentialRampToValueAtTime(140,t+0.08);
  og.gain.setValueAtTime(g*0.55,t); og.gain.exponentialRampToValueAtTime(0.001,t+0.14);
  o.connect(og); og.connect(master);
  n.start(t);n.stop(t+0.28); o.start(t);o.stop(t+0.16);
}
function hat(t,g=0.2,open=false){
  const n=ctx.createBufferSource(); n.buffer=noiseBuf(open?0.35:0.06);
  const hp=ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=7800;
  const gn=ctx.createGain(); gn.gain.setValueAtTime(g,t); gn.gain.exponentialRampToValueAtTime(0.001,t+(open?0.3:0.05));
  n.connect(hp); hp.connect(gn); gn.connect(master);
  n.start(t); n.stop(t+(open?0.35:0.07));
}
function chordTone(t,freq,type,gain,dur,pan=0){
  const dest=musicGain;
  const merge=(node)=>{
    if(Math.abs(pan)>0.01){
      const p=ctx.createStereoPanner(); p.pan.value=pan; node.connect(p); p.connect(dest); p.connect(reverbSend);
    } else { node.connect(dest); node.connect(reverbSend); }
  };
  if(type==="Rhodes"||type==="EP"){
    const car=ctx.createOscillator(), mod=ctx.createOscillator(), mg=ctx.createGain(), gn=ctx.createGain();
    const f=ctx.createBiquadFilter(); f.type="lowpass"; f.frequency.value=type==="EP"?3600:3000;
    car.type="sine"; car.frequency.value=freq; mod.type="sine"; mod.frequency.value=freq*(type==="EP"?2:1.5);
    mg.gain.setValueAtTime(freq*(type==="EP"?0.8:1.1),t); mg.gain.exponentialRampToValueAtTime(freq*0.15,t+dur*0.6);
    mod.connect(mg); mg.connect(car.frequency);
    gn.gain.setValueAtTime(0,t); gn.gain.linearRampToValueAtTime(gain,t+0.015); gn.gain.exponentialRampToValueAtTime(0.001,t+dur*0.9);
    car.connect(f); f.connect(gn); merge(gn);
    car.start(t);car.stop(t+dur+0.2); mod.start(t);mod.stop(t+dur+0.2);
  } else if(type==="Piano"){
    for(let i=0;i<4;i++){
      const o=ctx.createOscillator(), gn=ctx.createGain(), f=ctx.createBiquadFilter();
      o.type="triangle"; o.frequency.value=freq*(i===0?1:i===1?2:i===2?3:4.02);
      f.type="lowpass"; f.frequency.value=4800-i*600;
      const g0=gain*(i===0?0.55:i===1?0.28:i===2?0.12:0.06);
      gn.gain.setValueAtTime(0,t); gn.gain.linearRampToValueAtTime(g0,t+0.006); gn.gain.exponentialRampToValueAtTime(0.001,t+dur*(0.55+i*0.08));
      o.connect(f); f.connect(gn); merge(gn); o.start(t); o.stop(t+dur+0.2);
    }
  } else if(type==="Pad"){
    for(let i=0;i<4;i++){
      const o=ctx.createOscillator(), gn=ctx.createGain(), f=ctx.createBiquadFilter();
      o.type="sawtooth"; o.frequency.value=freq; o.detune.value=(i-1.5)*7;
      f.type="lowpass"; f.frequency.value=1300;
      gn.gain.setValueAtTime(0,t); gn.gain.linearRampToValueAtTime(gain/4,t+0.4); gn.gain.setTargetAtTime(0.001,t+dur*0.65,0.5);
      o.connect(f); f.connect(gn); merge(gn); o.start(t); o.stop(t+dur+0.6);
    }
  } else if(type==="Bell"){
    [1,2.76,5.4].forEach((r,i)=>{
      const o=ctx.createOscillator(), gn=ctx.createGain();
      o.type="sine"; o.frequency.value=freq*r;
      gn.gain.setValueAtTime(0,t); gn.gain.linearRampToValueAtTime(gain*(0.5/(i+1)),t+0.005); gn.gain.exponentialRampToValueAtTime(0.001,t+0.8/(i+1));
      o.connect(gn); merge(gn); o.start(t); o.stop(t+1.2);
    });
  } else {
    for(let i=0;i<3;i++){
      const o=ctx.createOscillator(), gn=ctx.createGain(), f=ctx.createBiquadFilter();
      o.type="triangle"; o.frequency.value=freq*(i+1);
      f.type="lowpass"; f.frequency.value=3600-i*800;
      gn.gain.setValueAtTime(0,t); gn.gain.linearRampToValueAtTime(gain/(i+1.5),t+0.003); gn.gain.exponentialRampToValueAtTime(0.001,t+0.32);
      o.connect(f); f.connect(gn); merge(gn); o.start(t); o.stop(t+0.4);
    }
  }
}
function playChord(t,rootHz,intervals,type,gain,width,rhythm,s16){
  const dur=type==="Pad"?3.4:1.7;
  const hits = rhythm==="half"?[0,8]:rhythm==="stabs"?[0,6,10]:rhythm==="offbeat"?[2,6,10,14]:rhythm==="arp"?null:[0];
  if(hits===null){
    intervals.forEach((semi,idx)=>{
      const f=rootHz*Math.pow(2,semi/12);
      const pan=(idx/Math.max(1,intervals.length-1)-0.5)*width;
      chordTone(t+idx*(s16*0.9), f, type, gain*0.85, s16*1.5, pan);
    });
  } else {
    hits.forEach(h=>{
      intervals.forEach((semi,idx)=>{
        const f=rootHz*Math.pow(2,semi/12);
        const pan=(idx/Math.max(1,intervals.length-1)-0.5)*width;
        chordTone(t+h*s16+idx*0.005, f, type, gain, dur, pan);
      });
    });
  }
}
function bass(t,freq,g=0.4,style="root",s16=0.2){
  if(style==="off") return;
  const play=(tt,f,gg)=>{
    const o=ctx.createOscillator(), o2=ctx.createOscillator(), gn=ctx.createGain();
    o.type="sine"; o.frequency.value=f; o2.type="triangle"; o2.frequency.value=f; o2.detune.value=4;
    gn.gain.setValueAtTime(0,tt); gn.gain.linearRampToValueAtTime(gg,tt+0.01); gn.gain.exponentialRampToValueAtTime(0.001,tt+0.4);
    o.connect(gn); o2.connect(gn); gn.connect(master); o.start(tt);o.stop(tt+0.45); o2.start(tt);o2.stop(tt+0.45);
  };
  if(style==="root") play(t,freq,g);
  else if(style==="fifth"){ play(t,freq,g); play(t+s16*8,freq*1.5,g*0.7); }
  else if(style==="bounce"){ [0,3,6,10].forEach((i,n)=>play(t+i*s16, n%2?freq*2:freq, g*0.85)); }
  else if(style==="sparse"){ play(t,freq,g); if(rng()>0.5) play(t+s16*12,freq,g*0.6); }
  else if(style==="walk"){ [0,4,8,12].forEach((i,n)=>play(t+i*s16, freq*Math.pow(2,[0,0.25,0.5,0.25][n]/12), g*0.8)); }
}
function melodyNote(t,freq,g=0.13){
  const o=ctx.createOscillator(), gn=ctx.createGain(), f=ctx.createBiquadFilter();
  o.type="sine"; o.frequency.value=freq; f.type="lowpass"; f.frequency.value=3400;
  gn.gain.setValueAtTime(0,t); gn.gain.linearRampToValueAtTime(g,t+0.012); gn.gain.exponentialRampToValueAtTime(0.001,t+0.5);
  o.connect(f); f.connect(gn); gn.connect(musicGain); gn.connect(reverbSend);
  o.start(t); o.stop(t+0.55);
}
function vinylCrackle(t,on){ if(!on||rng()>0.45) return; const n=ctx.createBufferSource(); n.buffer=noiseBuf(0.04); const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=1800+rng()*3500; const gn=ctx.createGain(); gn.gain.value=0.04*(0.5+rng()); n.connect(bp);bp.connect(gn);gn.connect(master); n.start(t+rng()*1.6); }
function rainLayer(t,on){ if(!on) return; const n=ctx.createBufferSource(); n.buffer=noiseBuf(2); const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=4000; const gn=ctx.createGain(); gn.gain.value=0.028; n.connect(bp);bp.connect(gn);gn.connect(master); n.start(t);n.stop(t+2); }
function schedulePump(t,amount){ if(amount<0.05) return; const now=Math.max(t,ctx.currentTime); const depth=1-amount*0.75; musicGain.gain.cancelScheduledValues(now); musicGain.gain.setValueAtTime(musicGain.gain.value,now); musicGain.gain.linearRampToValueAtTime(depth,now+0.02); musicGain.gain.setTargetAtTime(1,now+0.05,0.12); }

function scheduleBar(p,t0){
  const spb=60/p.bpm, s16=spb/4, swing=p.swing, hum=p.humanize;
  const sec=sectionForBar(barCount,p.structureOn);
  const pat=DRUM_PATS[p.drums]||DRUM_PATS.Mellow;
  const dv=p.drumsVol*sec.drum*(p.muteDrums?0:1);
  const when=(i)=> t0+i*s16+((i%2)?swing*s16:0)+humanOffset(hum,s16);

  if(!p.muteDrums){
    pat.k.forEach(i=>{kick(when(i),0.88*dv); schedulePump(when(i),p.pump);});
    pat.s.forEach(i=>snare(when(i),0.5*dv));
    pat.h.forEach(i=>hat(when(i),0.18*dv,false));
    pat.o.forEach(i=>hat(when(i),0.26*dv,true));
  }

  const prog=PROG_LIST[p.prog]||PROG_LIST["Study Session"];
  const [deg,iv]=prog[barCount%prog.length];
  const rootHz=(NOTE[p.key]||440)*Math.pow(2,deg/12);
  const chordRoot=rootHz*(rootHz<200?2:rootHz>420?0.5:1);
  const chordName = (KEYS[(KEYS.indexOf(p.key)+deg+120)%12])+(iv.includes(3)?"m":"");
  $("chordInfo").textContent=chordName;

  if(!p.muteChords) playChord(t0+0.01,chordRoot,iv,p.chordInst,0.16*sec.chord,p.width,p.chordRhythm,s16);
  if(!p.muteBass) bass(t0+0.01,chordRoot/2,0.38,p.bassStyle,s16);

  if(!p.muteMel && p.melody>0.05 && sec.mel>0.15){
    const scale=SCALES[p.scale]||SCALES.minorPent;
    const slots=[0,2,4,6,8,10,12,14];
    slots.forEach(st=>{
      if(rng()>0.28+p.melody*0.5*sec.mel) return;
      if(rng()<0.7){ melState.deg+=melState.dir*(rng()<0.7?1:2); if(melState.deg>=scale.length){melState.deg=scale.length-1;melState.dir=-1;} if(melState.deg<0){melState.deg=0;melState.dir=1;} }
      else melState.deg=Math.floor(rng()*scale.length);
      const oct=rng()>0.75?12:0;
      melodyNote(when(st), chordRoot*Math.pow(2,(scale[melState.deg]+oct)/12), 0.12*p.melody*sec.mel);
    });
  }
  vinylCrackle(t0,p.vinylOn);
  if(barCount%2===0) rainLayer(t0,p.rainOn);
  $("sectionInfo").textContent=sec.name;
}

function scheduler(){
  const p=getP();
  if(master) master.gain.setTargetAtTime(p.masterVol, ctx.currentTime, 0.05);
  filterNode.frequency.setTargetAtTime(p.filter, ctx.currentTime, 0.05);
  reverbReturn.gain.setTargetAtTime(p.reverb*0.55, ctx.currentTime, 0.08);
  if(window._echoWet) window._echoWet.gain.setTargetAtTime(p.echo*0.45, ctx.currentTime, 0.08);
  if(window._echoFb) window._echoFb.gain.setTargetAtTime(0.15+p.echo*0.25, ctx.currentTime, 0.08);
  const barDur=(60/p.bpm)*4;
  while(nextTime<ctx.currentTime+0.18){
    scheduleBar(p,nextTime); nextTime+=barDur; barCount++;
    $("barInfo").textContent=`Bar ${barCount}`;
  }
  if(sleepEnd && Date.now()>sleepEnd){ stop(); $("status").textContent="Sleep timer ended"; sleepEnd=0; return; }
  timerID=setTimeout(scheduler,30);
}

function drawViz(){
  if(!analyser) return;
  const canvas=$("viz"), w=canvas.clientWidth, h=canvas.clientHeight;
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  const g=canvas.getContext("2d");
  const accent=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()||"#7c9cff";
  if(vizMode==="spectrum"||vizMode==="bars"){
    const buf=new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(buf);
    g.clearRect(0,0,w,h);
    const bars=vizMode==="bars"?32:48, step=Math.floor(buf.length/bars), bw=w/bars-2;
    for(let i=0;i<bars;i++){
      let sum=0; for(let j=0;j<step;j++) sum+=buf[i*step+j];
      const v=sum/step/255, bh=Math.max(2,v*h*0.9);
      const grad=g.createLinearGradient(0,h-bh,0,h); grad.addColorStop(0,accent); grad.addColorStop(1,"rgba(167,139,250,0.3)");
      g.fillStyle=grad; g.beginPath(); g.roundRect(i*(bw+2),h-bh,bw,bh,3); g.fill();
    }
  } else {
    const buf=new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(buf);
    g.clearRect(0,0,w,h); g.strokeStyle=accent; g.lineWidth=2; g.beginPath();
    for(let i=0;i<buf.length;i++){ const x=i/buf.length*w, y=((buf[i]-128)/128)*h*0.45+h/2; i===0?g.moveTo(x,y):g.lineTo(x,y); }
    g.stroke();
  }
  const td=new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(td);
  let peak=0; for(let i=0;i<td.length;i++) peak=Math.max(peak,Math.abs(td[i]-128)/128);
  const pct=Math.min(100,peak*140);
  $("meterL").style.width=pct+"%"; $("meterR").style.width=(pct*(0.92+rng()*0.08))+"%";
  animID=requestAnimationFrame(drawViz);
}

function start(){
  unlockAudio().then(()=>{
    if(!ctx) return;
    setSeed($("seed").value);
    nextTime=ctx.currentTime+0.12; barCount=0; melState={deg:2,dir:1};
    isPlaying=true;
    $("playBtn").classList.add("playing");
    $("playBtn").querySelector(".icon").textContent="■";
    $("playBtn").querySelector(".label").textContent="Stop";
    $("status").textContent="Playing";
    const sl=+($("sleep").value||0); sleepEnd=sl?Date.now()+sl*60000:0;
    $("sleepVal").textContent=sl?sl+" min":"Off";
    scheduler(); if(!animID) drawViz();
  });
}
function stop(){
  isPlaying=false; clearTimeout(timerID); sleepEnd=0;
  $("playBtn").classList.remove("playing");
  $("playBtn").querySelector(".icon").textContent="▶";
  $("playBtn").querySelector(".label").textContent="Play";
  $("status").textContent="Stopped"; $("barInfo").textContent="—"; $("sectionInfo").textContent="—"; $("chordInfo").textContent="—";
}

function floatTo16(input){ const buf=new ArrayBuffer(input.length*2), view=new DataView(buf); for(let i=0;i<input.length;i++){ const s=Math.max(-1,Math.min(1,input[i])); view.setInt16(i*2,s<0?s*0x8000:s*0x7FFF,true);} return buf; }
function encodeWav(left,right,sr){
  const len=left.length, ab=new ArrayBuffer(44+len*4), v=new DataView(ab);
  const w=(o,s)=>{for(let i=0;i<s.length;i++) v.setUint8(o+i,s.charCodeAt(i));};
  w(0,"RIFF"); v.setUint32(4,36+len*4,true); w(8,"WAVE"); w(12,"fmt ");
  v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,2,true);
  v.setUint32(24,sr,true); v.setUint32(28,sr*4,true); v.setUint16(32,4,true); v.setUint16(34,16,true);
  w(36,"data"); v.setUint32(40,len*4,true);
  const u8=new Uint8Array(ab), l8=new Uint8Array(floatTo16(left)), r8=new Uint8Array(floatTo16(right));
  for(let i=0,o=44;i<len;i++,o+=4){u8[o]=l8[i*2];u8[o+1]=l8[i*2+1];u8[o+2]=r8[i*2];u8[o+3]=r8[i*2+1];}
  return ab;
}
async function renderAndDownload(){
  const btn=$("downloadBtn"), prog=$("exportProgress"), fill=$("exportBarFill"), pctEl=$("exportPct");
  btn.disabled=true; btn.classList.add("loading"); btn.textContent="Rendering…";
  prog.classList.remove("hidden"); fill.style.width="0%"; pctEl.textContent="0%";
  try{
    const secs=+$("exportLen").value, p=getP(), sr=44100, fade=$("exportFade").checked;
    let fake=0; const tick=setInterval(()=>{fake=Math.min(92,fake+(secs>120?0.6:2)); fill.style.width=fake+"%"; pctEl.textContent=Math.floor(fake)+"%";},200);
    const offline=new OfflineAudioContext(2,sr*secs,sr);
    const oMaster=offline.createGain(); oMaster.gain.value=p.masterVol;
    const oMusic=offline.createGain(); oMusic.gain.value=1;
    const oFilter=offline.createBiquadFilter(); oFilter.type="lowpass"; oFilter.frequency.value=p.filter;
    oMusic.connect(oFilter); oFilter.connect(oMaster); oMaster.connect(offline.destination);
    const old={ctx,master,musicGain,reverbSend}; ctx=offline; master=oMaster; musicGain=oMusic; reverbSend=offline.createGain();
    let t=0.05; const barDur=(60/p.bpm)*4; const saved=barCount; barCount=0; melState={deg:2,dir:1}; setSeed(p.seed);
    while(t<secs-0.4){ scheduleBar(p,t); t+=barDur; barCount++; }
    barCount=saved;
    const rendered=await offline.startRendering();
    ctx=old.ctx; master=old.master; musicGain=old.musicGain; reverbSend=old.reverbSend;
    clearInterval(tick); fill.style.width="100%"; pctEl.textContent="100%";
    let L=rendered.getChannelData(0), R=rendered.getChannelData(1);
    if(fade){
      const fs=Math.min(sr*3, L.length/4);
      for(let i=0;i<fs;i++){ const g=i/fs; L[i]*=g; R[i]*=g; L[L.length-1-i]*=g; R[R.length-1-i]*=g; }
    }
    const wav=encodeWav(L,R,sr);
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([wav],{type:"audio/wav"}));
    a.download=`lofi_${currentPresetName}_${p.key}_${p.bpm}bpm_${secs}s.wav`; a.click();
    $("status").textContent="Downloaded";
  }catch(e){ console.error(e); alert("Export failed: "+e.message); }
  finally{ btn.disabled=false; btn.classList.remove("loading"); btn.textContent="Download WAV"; setTimeout(()=>prog.classList.add("hidden"),800); }
}

function applyPreset(name, data){
  const pr=data||PRESETS[name]; if(!pr) return;
  if(name) currentPresetName=name;
  const set=(id,v)=>{ if($(id)){ if($(id).type==="checkbox") $(id).checked=!!v; else $(id).value=v; }};
  set("bpm",pr.bpm); set("key",pr.key); set("scale",pr.scale||"minorPent");
  set("swing",pr.swing); set("humanize",pr.humanize??0.35); set("melody",pr.melody);
  set("filter",pr.filter); set("reverb",pr.reverb); set("pump",pr.pump??0.35); set("echo",pr.echo??0.2);
  set("width",pr.width??0.45); set("drumsVol",pr.drumsVol); set("masterVol",pr.masterVol??0.85);
  set("chordInst",pr.chordInst); set("drums",pr.drums); set("prog",pr.prog||"Study Session");
  set("chordRhythm",pr.chordRhythm||"stabs"); set("bassStyle",pr.bassStyle||"root");
  set("vinylOn",pr.vinylOn); set("rainOn",pr.rainOn); set("structureOn",pr.structureOn!==false);
  if(pr.seed) setSeed(pr.seed);
  updateLabels();
  document.querySelectorAll("#presetGrid .chip").forEach(c=>c.classList.toggle("active", c.dataset.p===name));
  saveSettings();
}
function collectSettings(){ return {...getP(), preset:currentPresetName}; }
function saveSettings(){ try{ localStorage.setItem("lofi_web_settings", JSON.stringify(collectSettings())); }catch(e){} }
function loadSettings(){
  try{ const s=JSON.parse(localStorage.getItem("lofi_web_settings")||"null"); if(!s) return false;
    applyPreset(s.preset||"chill", {...(PRESETS[s.preset]||{}), ...s}); return true; }catch(e){ return false; }
}
function shareLink(){
  const hash=btoa(unescape(encodeURIComponent(JSON.stringify(collectSettings())))).replace(/=+$/,"");
  const url=location.origin+location.pathname+"#"+hash;
  navigator.clipboard.writeText(url).then(()=>{ $("status").textContent="Link copied"; }).catch(()=>prompt("Copy link:",url));
}
function loadFromHash(){
  if(!location.hash||location.hash.length<8) return false;
  try{ const s=JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1))))); applyPreset(s.preset||"chill",{...(PRESETS[s.preset]||{}),...s}); return true; }catch(e){ return false; }
}
function randomize(){
  const mood=[...document.querySelectorAll(".mood.active")].map(c=>c.dataset.mood)[0]||"Any";
  const pool=MOODS[mood]?.length?MOODS[mood]:Object.keys(PRESETS);
  const name=pool[Math.floor(Math.random()*pool.length)];
  applyPreset(name);
  $("bpm").value=Math.min(110,Math.max(55,+$("bpm").value+Math.floor(Math.random()*9)-4));
  $("swing").value=Math.min(0.42,Math.max(0,+$("swing").value+(Math.random()-0.5)*0.1));
  $("filter").value=Math.min(12000,Math.max(1800,+$("filter").value+Math.floor(Math.random()*1000)-500));
  setSeed(String(Math.floor(Math.random()*999999)+1));
  updateLabels(); saveSettings();
}
function tapTempo(){
  const now=performance.now(); tapTimes.push(now); tapTimes=tapTimes.filter(t=>now-t<3000);
  if(tapTimes.length>=2){
    let sum=0; for(let i=1;i<tapTimes.length;i++) sum+=tapTimes[i]-tapTimes[i-1];
    const bpm=Math.round(60000/(sum/(tapTimes.length-1)));
    if(bpm>=55&&bpm<=110){ $("bpm").value=bpm; updateLabels(); saveSettings(); $("status").textContent="BPM "+bpm; }
  }
}

const THEMES=[{accent:"#7c9cff",accent2:"#a78bfa"},{accent:"#5eead4",accent2:"#2dd4bf"},{accent:"#f472b6",accent2:"#e879f9"},{accent:"#fbbf24",accent2:"#f59e0b"},{accent:"#a3e635",accent2:"#84cc16"}];
let themeIdx=0;
function cycleTheme(){ themeIdx=(themeIdx+1)%THEMES.length; const t=THEMES[themeIdx]; document.documentElement.style.setProperty("--accent",t.accent); document.documentElement.style.setProperty("--accent-2",t.accent2); try{localStorage.setItem("lofi_theme",themeIdx);}catch(e){} }

function buildPresetChips(){
  const grid=$("presetGrid"); grid.innerHTML="";
  Object.keys(PRESETS).forEach(k=>{
    const b=document.createElement("button"); b.className="chip"+(k===currentPresetName?" active":""); b.dataset.p=k; b.textContent=PRESET_LABELS[k]||k;
    b.addEventListener("click",()=>applyPreset(k)); grid.appendChild(b);
  });
}
function buildProgSelect(){
  const sel=$("prog"); sel.innerHTML="";
  Object.keys(PROG_LIST).forEach(n=>{ const o=document.createElement("option"); o.value=n; o.textContent=n; sel.appendChild(o); });
}

// Wire
$("playBtn").addEventListener("click",()=>isPlaying?stop():start());
$("downloadBtn").addEventListener("click",renderAndDownload);
$("randomBtn").addEventListener("click",randomize);
$("shareBtn").addEventListener("click",shareLink);
$("themeBtn").addEventListener("click",cycleTheme);
$("tapBtn").addEventListener("click",tapTempo);
$("newSeedBtn").addEventListener("click",()=>{ setSeed(String(Math.floor(Math.random()*999999)+1)); saveSettings(); });
$("resetBtn").addEventListener("click",()=>applyPreset("chill"));
$("favBtn").addEventListener("click",()=>{ try{ localStorage.setItem("lofi_fav",JSON.stringify(collectSettings())); $("status").textContent="Favorite saved"; }catch(e){} });
$("loadFavBtn").addEventListener("click",()=>{ try{ const s=JSON.parse(localStorage.getItem("lofi_fav")||"null"); if(s) applyPreset(s.preset||"chill",s); else $("status").textContent="No favorite"; }catch(e){} });
$("copyJsonBtn").addEventListener("click",()=>{ navigator.clipboard.writeText(JSON.stringify(collectSettings(),null,2)).then(()=>$("status").textContent="JSON copied"); });
$("helpBtn").addEventListener("click",()=>$("helpModal").classList.remove("hidden"));
$("closeHelp").addEventListener("click",()=>$("helpModal").classList.add("hidden"));
$("helpModal").addEventListener("click",e=>{ if(e.target.id==="helpModal") $("helpModal").classList.add("hidden"); });
$("sleep").addEventListener("change",()=>{ $("sleepVal").textContent=+$("sleep").value?$("sleep").value+" min":"Off"; });

document.querySelectorAll(".mood").forEach(chip=>{
  chip.addEventListener("click",()=>{
    document.querySelectorAll(".mood").forEach(c=>c.classList.remove("active"));
    chip.classList.add("active");
  });
});
document.querySelectorAll(".viz-tab").forEach(tab=>{
  tab.addEventListener("click",()=>{ document.querySelectorAll(".viz-tab").forEach(t=>t.classList.remove("active")); tab.classList.add("active"); vizMode=tab.dataset.mode; });
});
["bpm","swing","humanize","melody","filter","reverb","pump","echo","width","drumsVol","masterVol"].forEach(id=>{
  $(id).addEventListener("input",()=>{ updateLabels(); saveSettings(); });
});
["key","scale","chordInst","drums","prog","chordRhythm","bassStyle","vinylOn","rainOn","structureOn","loopLive","muteDrums","muteChords","muteBass","muteMel","seed"].forEach(id=>{
  if($(id)) $(id).addEventListener("change",saveSettings);
});

document.addEventListener("keydown",e=>{
  if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if(e.code==="Space"){ e.preventDefault(); isPlaying?stop():start(); }
  if(e.key==="t"||e.key==="T") tapTempo();
  if(e.key==="r"||e.key==="R") randomize();
  if(e.key==="s"||e.key==="S") shareLink();
});

buildProgSelect(); buildPresetChips();
if(!loadFromHash()) loadSettings()||applyPreset("chill");
try{ themeIdx=+(localStorage.getItem("lofi_theme")||0)%THEMES.length; const t=THEMES[themeIdx]; document.documentElement.style.setProperty("--accent",t.accent); document.documentElement.style.setProperty("--accent-2",t.accent2); }catch(e){}
updateLabels(); setSeed($("seed").value||"1");
$("status").textContent="Ready · Space to play";
