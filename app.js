/** Lofi Beat Maker Pro — expanded engine + studio tools */
const AC=window.AudioContext||window.webkitAudioContext;
let ctx,master,musicGain,filterNode,reverbSend,reverbReturn,echoNode,eqLow,eqMid,eqHigh,analyser;
let isPlaying=false,nextTime=0,timerID=null,barCount=0,animID=null,vizMode="spectrum";
let melState={deg:2,dir:1,motif:[]},currentPresetName="chill",audioUnlocked=false;
let sleepEnd=0,pomEnd=0,pomBreak=false,tapTimes=[],rng=Math.random;
let undoStack=[],redoStack=[],slotA=null,slotB=null,abSide="A";
let customSamples={k:null,s:null,h:null},recChunks=[],recNode=null,recording=false;
let playlist=[],plIndex=-1,journeyTimer=null,deferredInstall=null;
let midiEvents=[],chapterMarks=[],lastPeak=0;

const NOTE={C:261.63,"C#":277.18,D:293.66,"D#":311.13,E:329.63,F:349.23,"F#":369.99,G:392,"G#":415.3,A:440,"A#":466.16,B:493.88};
const KEYS=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const SCALES={minorPent:[0,3,5,7,10],majorPent:[0,2,4,7,9],dorian:[0,2,3,5,7,9,10],naturalMin:[0,2,3,5,7,8,10],major:[0,2,4,5,7,9,11],blues:[0,3,5,6,7,10],mixo:[0,2,4,5,7,9,10]};
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
"Minor Drift":[[0,[0,3,7,10]],[10,[0,4,7,10]],[8,[0,4,7,11]],[7,[0,4,7,10]]],
"Borrowed Dark":[[0,[0,3,7,10]],[8,[0,3,7,10]],[5,[0,4,7,11]],[7,[0,4,7,10]]]
};
const PRESETS={
chill:{bpm:76,key:"A",scale:"minorPent",swing:0.22,humanize:0.35,melody:0.4,filter:5800,reverb:0.36,pump:0.35,echo:0.18,width:0.45,drumsVol:0.78,masterVol:0.85,chordInst:"Rhodes",drums:"Mellow",prog:"Study Session",chordRhythm:"stabs",bassStyle:"root",vinylOn:true,structureOn:true,ambient:0.12,crackle:0.2,hiss:0.1},
rainy:{bpm:82,key:"F",scale:"majorPent",swing:0.3,humanize:0.4,melody:0.35,filter:6400,reverb:0.42,pump:0.25,echo:0.22,width:0.5,drumsVol:0.7,masterVol:0.85,chordInst:"Piano",drums:"Jazzy",prog:"Rainy Jazz",chordRhythm:"offbeat",bassStyle:"walk",vinylOn:true,structureOn:true,rainAmt:0.55,ambient:0.2},
dusty:{bpm:88,key:"D",scale:"minorPent",swing:0.28,humanize:0.45,melody:0.28,filter:4200,reverb:0.28,pump:0.5,echo:0.15,width:0.4,drumsVol:0.88,masterVol:0.85,chordInst:"Pluck",drums:"BoomBap",prog:"Dusty Boom Bap",chordRhythm:"stabs",bassStyle:"bounce",vinylOn:true,structureOn:true,crackle:0.55},
night:{bpm:78,key:"C#",scale:"dorian",swing:0.18,humanize:0.3,melody:0.45,filter:4800,reverb:0.5,pump:0.4,echo:0.25,width:0.55,drumsVol:0.72,masterVol:0.85,chordInst:"Pad",drums:"HeadNod",prog:"Late Night",chordRhythm:"whole",bassStyle:"fifth",vinylOn:true,structureOn:true},
dreamy:{bpm:64,key:"E",scale:"dorian",swing:0.12,humanize:0.25,melody:0.3,filter:3800,reverb:0.62,pump:0.2,echo:0.3,width:0.65,drumsVol:0.55,masterVol:0.8,chordInst:"Pad",drums:"Sparse",prog:"Dreamy Float",chordRhythm:"whole",bassStyle:"root",structureOn:true,ambient:0.35},
neo:{bpm:84,key:"A#",scale:"dorian",swing:0.28,humanize:0.4,melody:0.42,filter:5600,reverb:0.34,pump:0.38,echo:0.2,width:0.48,drumsVol:0.8,masterVol:0.85,chordInst:"Rhodes",drums:"HeadNod",prog:"Neo Soul",chordRhythm:"offbeat",bassStyle:"bounce",vinylOn:true,structureOn:true},
piano:{bpm:66,key:"D#",scale:"naturalMin",swing:0.14,humanize:0.3,melody:0.48,filter:5000,reverb:0.44,pump:0.22,echo:0.18,width:0.4,drumsVol:0.5,masterVol:0.85,chordInst:"Piano",drums:"Sparse",prog:"Sad Piano",chordRhythm:"half",bassStyle:"root",vinylOn:true,structureOn:true},
clean:{bpm:76,key:"A",scale:"majorPent",swing:0.16,humanize:0.2,melody:0.38,filter:7800,reverb:0.28,pump:0.2,echo:0.12,width:0.4,drumsVol:0.7,masterVol:0.85,chordInst:"Rhodes",drums:"Mellow",prog:"Lofi Classic",chordRhythm:"stabs",bassStyle:"fifth",structureOn:false},
dilla:{bpm:90,key:"G",scale:"minorPent",swing:0.34,humanize:0.55,melody:0.32,filter:4600,reverb:0.3,pump:0.45,echo:0.15,width:0.42,drumsVol:0.85,masterVol:0.85,chordInst:"EP",drums:"Dilla",prog:"Dusty Boom Bap",chordRhythm:"stabs",bassStyle:"bounce",vinylOn:true,structureOn:true},
cafe:{bpm:80,key:"G#",scale:"major",swing:0.26,humanize:0.35,melody:0.4,filter:6800,reverb:0.38,pump:0.3,echo:0.2,width:0.5,drumsVol:0.72,masterVol:0.85,chordInst:"Pluck",drums:"Jazzy",prog:"Hopeful",chordRhythm:"offbeat",bassStyle:"walk",vinylOn:true,structureOn:true},
focus:{bpm:78,key:"G",scale:"majorPent",swing:0.2,humanize:0.25,melody:0.35,filter:7000,reverb:0.3,pump:0.28,echo:0.15,width:0.4,drumsVol:0.68,masterVol:0.85,chordInst:"Piano",drums:"HeadNod",prog:"Study Session",chordRhythm:"arp",bassStyle:"fifth",structureOn:true},
midnight:{bpm:72,key:"D",scale:"dorian",swing:0.2,humanize:0.35,melody:0.4,filter:5200,reverb:0.48,pump:0.35,echo:0.28,width:0.55,drumsVol:0.7,masterVol:0.82,chordInst:"Bell",drums:"Mellow",prog:"Late Night",chordRhythm:"stabs",bassStyle:"fifth",vinylOn:true,structureOn:true},
triphop:{bpm:70,key:"F#",scale:"naturalMin",swing:0.18,humanize:0.4,melody:0.3,filter:4000,reverb:0.45,pump:0.4,echo:0.22,width:0.5,drumsVol:0.75,masterVol:0.85,chordInst:"Pad",drums:"TripHop",prog:"Minor Drift",chordRhythm:"half",bassStyle:"sparse",vinylOn:true,structureOn:true},
sunday:{bpm:70,key:"G",scale:"majorPent",swing:0.15,humanize:0.25,melody:0.5,filter:7500,reverb:0.35,pump:0.2,echo:0.15,width:0.45,drumsVol:0.55,masterVol:0.85,chordInst:"Pluck",drums:"Sparse",prog:"Hopeful",chordRhythm:"half",bassStyle:"sparse",vinylOn:true,structureOn:true},
velvet:{bpm:68,key:"C#",scale:"dorian",swing:0.3,humanize:0.4,melody:0.4,filter:5400,reverb:0.45,pump:0.42,echo:0.2,width:0.5,drumsVol:0.78,masterVol:0.85,chordInst:"Rhodes",drums:"BoomBap",prog:"Neo Soul",chordRhythm:"arp",bassStyle:"walk",vinylOn:true,structureOn:true},
jazzlounge:{bpm:86,key:"A#",scale:"mixo",swing:0.34,humanize:0.4,melody:0.45,filter:6800,reverb:0.4,pump:0.15,echo:0.18,width:0.55,drumsVol:0.7,masterVol:0.85,chordInst:"Piano",drums:"Jazzy",prog:"Jazz ii-V-I",chordRhythm:"offbeat",bassStyle:"walk",structureOn:true}
};
const PRESET_LABELS={chill:"Chill Study",rainy:"Rainy Jazz",dusty:"Dusty Boom Bap",night:"Late Night",dreamy:"Dreamy",neo:"Neo Soul",piano:"Sleepy Piano",clean:"Clean Studio",dilla:"Dilla Swing",cafe:"Cozy Cafe",focus:"Focus Flow",midnight:"Midnight",triphop:"Trip Hop",sunday:"Sunday Morning",velvet:"Velvet Keys",jazzlounge:"Jazz Lounge"};
const MOODS={Any:[],Calm:["dreamy","piano","sunday","focus","clean"],Rainy:["rainy","piano","triphop","night"],Jazzy:["jazzlounge","cafe","rainy","neo"],Upbeat:["dusty","dilla","cafe","neo"],Dark:["triphop","night","velvet","piano"],Dreamy:["dreamy","midnight","night","sunday"]};
const COMMUNITY=[{name:"Rain Study Pack",preset:"rainy",note:"Community"},{name:"Night Drive Soft",preset:"night",note:"Community"},{name:"Focus Clean",preset:"focus",note:"Community"},{name:"Velvet Evening",preset:"velvet",note:"Community"}];
const DRUM_PATS={Mellow:{k:[0,8],s:[4,12],h:[0,2,4,6,8,10,12,14],o:[]},BoomBap:{k:[0,7,10],s:[4,12],h:[0,2,4,6,8,10,12,14],o:[]},HeadNod:{k:[0,6,10],s:[4,12],h:[0,2,3,4,6,8,10,12,14],o:[]},Sparse:{k:[0,8],s:[12],h:[4,12],o:[]},Jazzy:{k:[0,7],s:[4,12],h:[0,2,3,4,6,7,8,10,12,14],o:[14]},Dilla:{k:[0,7,9],s:[4,12,13],h:[0,2,3,5,6,8,10,11,12,14],o:[]},TripHop:{k:[0,9],s:[8],h:[2,6,10,14],o:[]},FourFloor:{k:[0,4,8,12],s:[4,12],h:[2,6,10,14],o:[]},None:{k:[],s:[],h:[],o:[]}};
const SCENE_NAMES=["Rainy Intro","Soft Build","Focus Peak","Side Quest","Deep Groove","Cloud Break","Warm Middle","Night Drift","Gentle Lift","Wind Down"];

function $(id){return document.getElementById(id)}
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function setSeed(s){const n=parseInt(s,10)||1;rng=mulberry32(n);if($("seed"))$("seed").value=String(n)}
function humanOffset(hum,s16){return(rng()-0.5)*hum*0.03*s16*4}

function getP(){
  const g=id=>$ (id)?($(id).type==="checkbox"?$(id).checked:+$(id).value||$(id).value):null;
  return{
    bpm:+$("bpm").value,key:$("key").value,scale:$("scale").value,transpose:+$("transpose").value,
    swing:+$("swing").value,humanize:+$("humanize").value,melody:+$("melody").value,
    filter:+$("filter").value,reverb:+$("reverb").value,room:+$("room").value,damp:+$("damp").value,
    pump:+$("pump").value,pumpShape:$("pumpShape").value,echo:+$("echo").value,echoSync:$("echoSync").value,
    width:+$("width").value,drumsVol:+$("drumsVol").value,masterVol:+$("masterVol").value,
    eqLow:+$("eqLow").value,eqMid:+$("eqMid").value,eqHigh:+$("eqHigh").value,
    ambient:+$("ambient").value,crackle:+$("crackle").value,hiss:+$("hiss").value,
    rainAmt:+$("rainAmt").value,rainWidth:+$("rainWidth").value,
    kickDecay:+$("kickDecay").value,kickClick:+$("kickClick").value,snareTone:+$("snareTone").value,ghost:+$("ghost").value,
    chordInst:$("chordInst").value,drums:$("drums").value,prog:$("prog").value,
    chordRhythm:$("chordRhythm").value,arpPat:$("arpPat").value,inversion:+$("inversion").value,bassStyle:$("bassStyle").value,
    vinylOn:$("vinylOn").checked,structureOn:$("structureOn").checked,tremolo:$("tremolo").checked,
    polyHat:$("polyHat").checked,keyLock:$("keyLock").checked,callResp:$("callResp").checked,borrowed:$("borrowed").checked,
    muteDrums:$("muteDrums").checked,muteChords:$("muteChords").checked,muteBass:$("muteBass").checked,muteMel:$("muteMel").checked,
    soloDrums:$("soloDrums").checked,soloChords:$("soloChords").checked,soloBass:$("soloBass").checked,soloMel:$("soloMel").checked,
    introBars:+$("introBars").value,grooveBars:+$("grooveBars").value,seed:$("seed").value
  };
}
function updateLabels(){
  const map=[["bpm","bpmVal",v=>v],["swing","swingVal",v=>(+v).toFixed(2)],["humanize","humanVal",v=>(+v).toFixed(2)],["melody","melodyVal",v=>(+v).toFixed(2)],
    ["filter","filterVal",v=>v],["reverb","reverbVal",v=>(+v).toFixed(2)],["room","roomVal",v=>(+v).toFixed(2)],["damp","dampVal",v=>(+v).toFixed(2)],
    ["pump","pumpVal",v=>(+v).toFixed(2)],["echo","echoVal",v=>(+v).toFixed(2)],["width","widthVal",v=>(+v).toFixed(2)],
    ["drumsVol","drumsVal",v=>(+v).toFixed(2)],["masterVol","masterVal",v=>(+v).toFixed(2)],
    ["eqLow","eqLVal",v=>(+v).toFixed(1)],["eqMid","eqMVal",v=>(+v).toFixed(1)],["eqHigh","eqHVal",v=>(+v).toFixed(1)],
    ["ambient","ambVal",v=>(+v).toFixed(2)],["crackle","crackleVal",v=>(+v).toFixed(2)],["hiss","hissVal",v=>(+v).toFixed(2)],
    ["rainAmt","rainVal",v=>(+v).toFixed(2)],["rainWidth","rainWVal",v=>(+v).toFixed(2)],
    ["kickDecay","kickDecVal",v=>(+v).toFixed(2)],["kickClick","kickClkVal",v=>(+v).toFixed(2)],["snareTone","snToneVal",v=>(+v).toFixed(2)],["ghost","ghostVal",v=>(+v).toFixed(2)],
    ["transpose","transposeVal",v=>v],["inversion","invVal",v=>v],["introBars","introBarsVal",v=>v],["grooveBars","grooveBarsVal",v=>v]];
  map.forEach(([id,lab,fmt])=>{if($(lab)&&$(id))$(lab).textContent=fmt($(id).value)});
}
function sectionForBar(bar,p){
  if(!p.structureOn)return{name:"Groove",drum:1,mel:1,chord:1,scene:0};
  const intro=p.introBars||4,groove=p.grooveBars||8,lift=groove,brk=Math.max(2,Math.floor(intro/1));
  const parts=[{name:"Intro",bars:intro,drum:0.5,mel:0.15,chord:0.7},{name:"Groove",bars:groove,drum:1,mel:0.85,chord:1},{name:"Lift",bars:lift,drum:1,mel:1,chord:1},{name:"Break",bars:brk,drum:0.3,mel:0.45,chord:0.8}];
  const cycle=parts.reduce((s,x)=>s+x.bars,0);let t=0,b=bar%cycle;
  for(let i=0;i<parts.length;i++){if(b<t+parts[i].bars)return{...parts[i],scene:i};t+=parts[i].bars}
  return{...parts[1],scene:1};
}
function audible(part,p){
  const solo=p.soloDrums||p.soloChords||p.soloBass||p.soloMel;
  if(solo){if(part==="drums")return p.soloDrums;if(part==="chords")return p.soloChords;if(part==="bass")return p.soloBass;if(part==="mel")return p.soloMel}
  if(part==="drums")return!p.muteDrums;if(part==="chords")return!p.muteChords;if(part==="bass")return!p.muteBass;if(part==="mel")return!p.muteMel;
  return true;
}

function ensureCtx(){
  if(ctx)return;
  ctx=new AC({latencyHint:"interactive", sampleRate: 44100});
  master=ctx.createGain();master.gain.value=0.8;
  musicGain=ctx.createGain();musicGain.gain.value=1;
  // soft limiter / dynamics
  try {
    window._limiter = ctx.createDynamicsCompressor();
    window._limiter.threshold.value = -8;
    window._limiter.knee.value = 12;
    window._limiter.ratio.value = 4;
    window._limiter.attack.value = 0.003;
    window._limiter.release.value = 0.15;
  } catch(e) { window._limiter = null; }
  filterNode=ctx.createBiquadFilter();filterNode.type="lowpass";filterNode.frequency.value=5600;filterNode.Q.value=0.65;
  eqLow=ctx.createBiquadFilter();eqLow.type="lowshelf";eqLow.frequency.value=180;
  eqMid=ctx.createBiquadFilter();eqMid.type="peaking";eqMid.frequency.value=1100;eqMid.Q.value=0.7;
  eqHigh=ctx.createBiquadFilter();eqHigh.type="highshelf";eqHigh.frequency.value=4200;
  reverbSend=ctx.createGain();reverbReturn=ctx.createGain();reverbReturn.gain.value=0.35;
  const d1=ctx.createDelay(1);d1.delayTime.value=0.27;const d2=ctx.createDelay(1);d2.delayTime.value=0.39;const d3=ctx.createDelay(1);d3.delayTime.value=0.53;
  const fb=ctx.createGain();fb.gain.value=0.38;const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=4500;
  reverbSend.connect(d1);d1.connect(d2);d2.connect(d3);d3.connect(fb);fb.connect(d1);d1.connect(lp);d2.connect(lp);d3.connect(lp);lp.connect(reverbReturn);reverbReturn.connect(master);
  echoNode=ctx.createDelay(1);echoNode.delayTime.value=0.35;const echoFb=ctx.createGain();echoFb.gain.value=0.25;const echoWet=ctx.createGain();echoWet.gain.value=0.2;
  musicGain.connect(echoNode);echoNode.connect(echoFb);echoFb.connect(echoNode);echoNode.connect(echoWet);echoWet.connect(master);
  window._echoWet=echoWet;window._echoFb=echoFb;window._echoNode=echoNode;window._revFb=fb;window._revLp=lp;
  analyser=ctx.createAnalyser();analyser.fftSize=512;analyser.smoothingTimeConstant=0.72;
  musicGain.connect(filterNode);filterNode.connect(eqLow);eqLow.connect(eqMid);eqMid.connect(eqHigh);eqHigh.connect(master);
  if(window._limiter){master.connect(window._limiter);window._limiter.connect(analyser);}else{master.connect(analyser);}
  analyser.connect(ctx.destination);
}
function unlockAudio(){
  ensureCtx();
  if(audioUnlocked&&ctx.state==="running")return Promise.resolve();
  // multiple unlock strategies for iOS
  const silent=ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate*0.05)), ctx.sampleRate);
  const src=ctx.createBufferSource();src.buffer=silent;src.connect(ctx.destination);
  try{src.start(0)}catch(e){}
  const o=ctx.createOscillator();const g=ctx.createGain();g.gain.value=0.0001;o.connect(g);g.connect(ctx.destination);
  try{o.start(0);o.stop(ctx.currentTime+0.05)}catch(e){}
  return ctx.resume().then(()=>{audioUnlocked=true; if(ctx.state!=="running") return ctx.resume();}).catch(()=>{audioUnlocked=true});
}
function noiseBuf(dur){const n=Math.floor(ctx.sampleRate*dur),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=rng()*2-1;return b}

function playSample(buf,t,g,dest){if(!buf)return;const s=ctx.createBufferSource();s.buffer=buf;const gn=ctx.createGain();gn.gain.setValueAtTime(g,t);gn.gain.exponentialRampToValueAtTime(0.001,t+Math.min(1.2,buf.duration));s.connect(gn);gn.connect(dest||master);s.start(t)}
function kick(t,g,p){
  if(customSamples.k){playSample(customSamples.k,t,g);return}
  const dec=0.25+p.kickDecay*0.35,clk=p.kickClick;
  const o=ctx.createOscillator(),gn=ctx.createGain();o.frequency.setValueAtTime(175,t);o.frequency.exponentialRampToValueAtTime(38,t+0.09);
  gn.gain.setValueAtTime(g,t);gn.gain.exponentialRampToValueAtTime(0.001,t+dec+0.15);o.connect(gn);gn.connect(master);
  const s=ctx.createOscillator(),sg=ctx.createGain();s.frequency.setValueAtTime(70,t);s.frequency.exponentialRampToValueAtTime(35,t+0.12);
  sg.gain.setValueAtTime(g*0.55,t);sg.gain.exponentialRampToValueAtTime(0.001,t+dec);s.connect(sg);sg.connect(master);
  const c=ctx.createOscillator(),cg=ctx.createGain();c.type="square";c.frequency.value=1400;cg.gain.setValueAtTime(g*0.35*clk,t);cg.gain.exponentialRampToValueAtTime(0.001,t+0.02);
  c.connect(cg);cg.connect(master);o.start(t);o.stop(t+0.5);s.start(t);s.stop(t+0.45);c.start(t);c.stop(t+0.03);
}
function snare(t,g,p){
  if(customSamples.s){playSample(customSamples.s,t,g);return}
  const tone=p.snareTone;
  const n=ctx.createBufferSource();n.buffer=noiseBuf(0.3);const bp=ctx.createBiquadFilter();bp.type="bandpass";bp.frequency.value=2400;
  const gn=ctx.createGain();gn.gain.setValueAtTime(g*(1-tone*0.4),t);gn.gain.exponentialRampToValueAtTime(0.001,t+0.22);n.connect(bp);bp.connect(gn);gn.connect(master);
  const o=ctx.createOscillator(),og=ctx.createGain();o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(140,t+0.08);
  og.gain.setValueAtTime(g*0.7*tone,t);og.gain.exponentialRampToValueAtTime(0.001,t+0.14);o.connect(og);og.connect(master);
  n.start(t);n.stop(t+0.28);o.start(t);o.stop(t+0.16);
}
function hat(t,g,open,vel=1){
  if(customSamples.h&&!open){playSample(customSamples.h,t,g*vel);return}
  const n=ctx.createBufferSource();n.buffer=noiseBuf(open?0.35:0.06);const hp=ctx.createBiquadFilter();hp.type="highpass";hp.frequency.value=7800;
  const gn=ctx.createGain();gn.gain.setValueAtTime(g*vel,t);gn.gain.exponentialRampToValueAtTime(0.001,t+(open?0.3:0.05));n.connect(hp);hp.connect(gn);gn.connect(master);n.start(t);n.stop(t+(open?0.35:0.07));
}
function chordTone(t,freq,type,gain,dur,pan,p){
  const dest=musicGain;const merge=node=>{const pn=ctx.createStereoPanner();pn.pan.value=pan||0;node.connect(pn);pn.connect(dest);pn.connect(reverbSend)};
  if(type==="Rhodes"||type==="EP"){
    const car=ctx.createOscillator(),mod=ctx.createOscillator(),mg=ctx.createGain(),gn=ctx.createGain();
    const f=ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=type==="EP"?3600:3000;
    car.type="sine";car.frequency.value=freq;mod.type="sine";mod.frequency.value=freq*(type==="EP"?2:1.5);
    mg.gain.setValueAtTime(freq*(type==="EP"?0.8:1.15),t);mg.gain.exponentialRampToValueAtTime(freq*0.15,t+dur*0.6);mod.connect(mg);mg.connect(car.frequency);
    gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(gain,t+0.015);
    if(p&&p.tremolo){const tr=ctx.createGain();tr.gain.value=1;const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=4.5;lg.gain.value=0.35;lfo.connect(lg);lg.connect(tr.gain);lfo.start(t);lfo.stop(t+dur+0.2);gn.connect(tr);merge(tr)}
    else merge(gn);
    gn.gain.exponentialRampToValueAtTime(0.001,t+dur*0.9);car.connect(f);f.connect(gn);car.start(t);car.stop(t+dur+0.2);mod.start(t);mod.stop(t+dur+0.2);
  }else if(type==="Piano"){
    for(let i=0;i<4;i++){const o=ctx.createOscillator(),gn=ctx.createGain(),f=ctx.createBiquadFilter();o.type="triangle";o.frequency.value=freq*[1,2,3,4.02][i];f.type="lowpass";f.frequency.value=4800-i*600;
      const g0=gain*[0.55,0.28,0.12,0.06][i];gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(g0,t+0.006);gn.gain.exponentialRampToValueAtTime(0.001,t+dur*(0.7+i*0.05));o.connect(f);f.connect(gn);merge(gn);o.start(t);o.stop(t+dur+0.3)}
  }else if(type==="Pad"){
    for(let i=0;i<4;i++){const o=ctx.createOscillator(),gn=ctx.createGain(),f=ctx.createBiquadFilter();o.type="sawtooth";o.frequency.value=freq;o.detune.value=(i-1.5)*7;f.type="lowpass";f.frequency.setValueAtTime(900,t);f.frequency.linearRampToValueAtTime(1600,t+dur*0.5);f.frequency.linearRampToValueAtTime(1000,t+dur);
      gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(gain/4,t+0.4);gn.gain.setTargetAtTime(0.001,t+dur*0.65,0.5);o.connect(f);f.connect(gn);merge(gn);o.start(t);o.stop(t+dur+0.6)}
  }else if(type==="Bell"){[1,2.76,5.4].forEach((r,i)=>{const o=ctx.createOscillator(),gn=ctx.createGain();o.type="sine";o.frequency.value=freq*r;gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(gain*(0.5/(i+1)),t+0.005);gn.gain.exponentialRampToValueAtTime(0.001,t+0.8/(i+1));o.connect(gn);merge(gn);o.start(t);o.stop(t+1.2)})}
  else{for(let i=0;i<3;i++){const o=ctx.createOscillator(),gn=ctx.createGain(),f=ctx.createBiquadFilter();o.type="triangle";o.frequency.value=freq*(i+1);f.type="lowpass";f.frequency.value=3600-i*800;gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(gain/(i+1.5),t+0.003);gn.gain.exponentialRampToValueAtTime(0.001,t+0.32);o.connect(f);f.connect(gn);merge(gn);o.start(t);o.stop(t+0.4)}}
}
function invertIntervals(iv,inv){const x=[...iv];for(let i=0;i<Math.abs(inv);i++){if(inv>0){const n=x.shift();x.push(n+12)}else{const n=x.pop();x.unshift(n-12)}}return x}
function playChord(t,rootHz,intervals,type,gain,width,rhythm,s16,arp,p){
  let iv=invertIntervals(intervals,p.inversion|0);const dur=type==="Pad"?3.4:1.7;
  if(rhythm==="arp"){
    const order=arp==="down"?[...iv].reverse():arp==="updown"?[...iv,...[...iv].reverse().slice(1)]:arp==="random"?[...iv].sort(()=>rng()-0.5):arp==="bach"?[iv[0],iv[2]||iv[1],iv[1],iv[0]]:iv;
    order.forEach((semi,idx)=>{const f=rootHz*Math.pow(2,semi/12);const pan=(idx/Math.max(1,order.length-1)-0.5)*width;chordTone(t+idx*(s16*0.85),f,type,gain*0.85,s16*1.4,pan,p)});
  }else{
    const hits=rhythm==="half"?[0,8]:rhythm==="stabs"?[0,6,10]:rhythm==="offbeat"?[2,6,10,14]:[0];
    hits.forEach(h=>iv.forEach((semi,idx)=>{const f=rootHz*Math.pow(2,semi/12);const pan=(idx/Math.max(1,iv.length-1)-0.5)*width;chordTone(t+h*s16+idx*0.005,f,type,gain,dur,pan,p)}));
  }
}
function bass(t,freq,g,style,s16){
  if(style==="off")return;
  const play=(tt,f,gg,glideFrom)=>{
    const o=ctx.createOscillator(),o2=ctx.createOscillator(),gn=ctx.createGain();
    o.type="sine";o2.type="triangle";o2.detune.value=4;
    if(glideFrom&&style==="glide"){o.frequency.setValueAtTime(glideFrom,tt);o.frequency.exponentialRampToValueAtTime(Math.max(30,f),tt+0.08);o2.frequency.setValueAtTime(glideFrom,tt);o2.frequency.exponentialRampToValueAtTime(Math.max(30,f),tt+0.08)}
    else{o.frequency.value=f;o2.frequency.value=f}
    gn.gain.setValueAtTime(0,tt);gn.gain.linearRampToValueAtTime(gg,tt+0.01);gn.gain.exponentialRampToValueAtTime(0.001,tt+0.4);
    o.connect(gn);o2.connect(gn);gn.connect(master);o.start(tt);o.stop(tt+0.45);o2.start(tt);o2.stop(tt+0.45);
  };
  if(style==="root"||style==="glide")play(t,freq,g,freq*0.75);
  else if(style==="fifth"){play(t,freq,g);play(t+s16*8,freq*1.5,g*0.7)}
  else if(style==="bounce")[0,3,6,10].forEach((i,n)=>play(t+i*s16,n%2?freq*2:freq,g*0.85));
  else if(style==="sparse"){play(t,freq,g);if(rng()>0.5)play(t+s16*12,freq,g*0.6)}
  else if(style==="walk")[0,4,8,12].forEach((i,n)=>play(t+i*s16,freq*Math.pow(2,[0,0.25,0.5,0.25][n]/12),g*0.8));
}
function melodyNote(t,freq,g){const o=ctx.createOscillator(),gn=ctx.createGain(),f=ctx.createBiquadFilter();o.type="sine";o.frequency.value=freq;f.type="lowpass";f.frequency.value=3400;gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(g,t+0.012);gn.gain.exponentialRampToValueAtTime(0.001,t+0.5);o.connect(f);f.connect(gn);gn.connect(musicGain);gn.connect(reverbSend);o.start(t);o.stop(t+0.55)}
function ambientBed(t,amt){if(amt<0.02)return;const n=ctx.createBufferSource();n.buffer=noiseBuf(2.2);const bp=ctx.createBiquadFilter();bp.type="bandpass";bp.frequency.value=600;bp.Q.value=0.3;const gn=ctx.createGain();gn.gain.value=amt*0.08;n.connect(bp);bp.connect(gn);gn.connect(master);n.start(t);n.stop(t+2.2)}
function vinylFX(t,p){if(!p.vinylOn)return;if(p.crackle>0.05&&rng()<p.crackle*0.5){const n=ctx.createBufferSource();n.buffer=noiseBuf(0.04);const bp=ctx.createBiquadFilter();bp.type="bandpass";bp.frequency.value=1800+rng()*3500;const gn=ctx.createGain();gn.gain.value=0.05*p.crackle;n.connect(bp);bp.connect(gn);gn.connect(master);n.start(t+rng()*1.5)}
  if(p.hiss>0.05){const n=ctx.createBufferSource();n.buffer=noiseBuf(0.5);const hp=ctx.createBiquadFilter();hp.type="highpass";hp.frequency.value=6000;const gn=ctx.createGain();gn.gain.value=0.012*p.hiss;n.connect(hp);hp.connect(gn);gn.connect(master);n.start(t);n.stop(t+0.5)}}
function rainLayer(t,p){if(p.rainAmt<0.05)return;const n=ctx.createBufferSource();n.buffer=noiseBuf(2);const bp=ctx.createBiquadFilter();bp.type="bandpass";bp.frequency.value=4000;const gn=ctx.createGain();const pan=ctx.createStereoPanner();pan.pan.value=(rng()-0.5)*p.rainWidth;gn.gain.value=0.04*p.rainAmt;n.connect(bp);bp.connect(gn);gn.connect(pan);pan.connect(master);n.start(t);n.stop(t+2)}
function schedulePump(t,amount,shape){if(amount<0.05)return;const now=Math.max(t,ctx.currentTime);const depth=1-amount*0.75;const atk=shape==="fast"?0.01:shape==="slow"?0.06:0.02;const rel=shape==="fast"?0.08:shape==="slow"?0.22:0.12;musicGain.gain.cancelScheduledValues(now);musicGain.gain.setValueAtTime(musicGain.gain.value,now);musicGain.gain.linearRampToValueAtTime(depth,now+atk);musicGain.gain.setTargetAtTime(1,now+atk+0.02,rel)}

function scheduleBar(p,t0){
  const spb=60/p.bpm,s16=spb/4,swing=p.swing,hum=p.humanize;
  const sec=sectionForBar(barCount,p);const pat=(typeof getActiveDrumPat==="function"?getActiveDrumPat():null)||DRUM_PATS[p.drums]||DRUM_PATS.Mellow;
  const dv=p.drumsVol*sec.drum;const when=i=>t0+i*s16+((i%2)?swing*s16:0)+humanOffset(hum,s16);
  if(audible("drums",p)){
    pat.k.forEach(i=>{kick(when(i),0.88*dv,p);schedulePump(when(i),p.pump,p.pumpShape)});
    pat.s.forEach(i=>snare(when(i),0.5*dv,p));
    if(p.polyHat){for(let i=0;i<12;i++)hat(t0+(i*(spb*4/3)/4),0.14*dv,false,0.7+rng()*0.3)}
    else{pat.h.forEach(i=>{const ghost=p.ghost>0.05&&i%4!==0&&rng()<p.ghost;hat(when(i),0.18*dv,false,ghost?0.35:1)});pat.o.forEach(i=>hat(when(i),0.26*dv,true))}
    // ghost snares
    if(p.ghost>0.2&&rng()<p.ghost)snare(when(10)+s16*0.5,0.15*dv,p);
    // Extra voices from sequencer (clap, rim, tom, perc)
    if(typeof getActiveDrumPat==="function" && $("useSeqPattern")?.checked){
      const full = seqPatterns[currentPat] || {};
      (full.c||[]).forEach(i=>clap(when(i),0.55*dv));
      (full.r||[]).forEach(i=>rim(when(i),0.5*dv));
      (full.t||[]).forEach(i=>tom(when(i),0.55*dv,false));
      (full.p||[]).forEach(i=>perc(when(i),0.4*dv));
    }
  }
  let progName=p.prog;if(p.borrowed&&rng()>0.7)progName="Borrowed Dark";
  const prog=PROG_LIST[progName]||PROG_LIST["Study Session"];
  let [deg,iv]=prog[barCount%prog.length];
  const tr=p.keyLock?0:(p.transpose|0);deg+=tr;
  const rootKey=KEYS[(KEYS.indexOf(p.key)+((deg%12)+12)%12)%12];
  const rootHz=(NOTE[p.key]||440)*Math.pow(2,deg/12);const chordRoot=rootHz*(rootHz<200?2:rootHz>420?0.5:1);
  $("chordInfo").textContent=rootKey+(iv.includes(3)?"m":"");
  if(audible("chords",p))playChord(t0+0.01,chordRoot,iv,p.chordInst,0.16*sec.chord,p.width,p.chordRhythm,s16,p.arpPat,p);
  if(audible("bass",p))bass(t0+0.01,chordRoot/2,0.38,p.bassStyle,s16);
  if(audible("mel",p)&&p.melody>0.05&&sec.mel>0.15){
    const scale=SCALES[p.scale]||SCALES.minorPent;const slots=[0,2,4,6,8,10,12,14];
    // motif memory
    if(melState.motif.length>=4&&rng()<0.45){melState.motif.forEach((semi,idx)=>{if(idx>3)return;melodyNote(when(slots[idx]||idx*2),chordRoot*Math.pow(2,semi/12),0.11*p.melody*sec.mel)});if(p.callResp)setTimeout(()=>{},0);melState.motif.forEach((semi,idx)=>{if(idx>2)return;const ans=semi+((rng()>0.5)?2:-1);melodyNote(when((slots[idx]||idx*2)+4),chordRoot*Math.pow(2,ans/12),0.09*p.melody*sec.mel)})}
    else{const phrase=[];slots.forEach(st=>{if(rng()>0.28+p.melody*0.5*sec.mel)return;if(rng()<0.7){melState.deg+=melState.dir*(rng()<0.7?1:2);if(melState.deg>=scale.length){melState.deg=scale.length-1;melState.dir=-1}if(melState.deg<0){melState.deg=0;melState.dir=1}}else melState.deg=Math.floor(rng()*scale.length);const oct=rng()>0.75?12:0;const semi=scale[melState.deg]+oct;phrase.push(semi);melodyNote(when(st),chordRoot*Math.pow(2,semi/12),0.12*p.melody*sec.mel)});if(phrase.length)melState.motif=phrase}
  }
  ambientBed(t0,p.ambient);vinylFX(t0,p);if(barCount%2===0)rainLayer(t0,p);
  $("sectionInfo").textContent=sec.name;
  // chapters
  if(barCount%8===0){const scene=SCENE_NAMES[sec.scene%SCENE_NAMES.length];const secTime=(barCount*(60/p.bpm)*4);chapterMarks.push({t:secTime,name:scene})}
  // midi rough log
  midiEvents.push({bar:barCount,deg,key:p.key,bpm:p.bpm});
}

function scheduler(){
  const p=getP();
  if(master)master.gain.setTargetAtTime(p.masterVol*(pomBreak?0.25:1),ctx.currentTime,0.08);
  filterNode.frequency.setTargetAtTime(p.filter,ctx.currentTime,0.05);
  reverbReturn.gain.setTargetAtTime(p.reverb*0.55,ctx.currentTime,0.08);
  if(window._echoWet)window._echoWet.gain.setTargetAtTime(p.echo*0.45,ctx.currentTime,0.08);
  if(window._echoNode){const beat=60/p.bpm;const mul=p.echoSync==="dot"?1.5:p.echoSync==="trip"?2/3:1;window._echoNode.delayTime.setTargetAtTime(beat*mul,ctx.currentTime,0.05)}
  if(window._revFb)window._revFb.gain.setTargetAtTime(0.25+p.room*0.35,ctx.currentTime,0.08);
  if(window._revLp)window._revLp.frequency.setTargetAtTime(6000-p.damp*4000,ctx.currentTime,0.08);
  if(eqLow)eqLow.gain.setTargetAtTime(p.eqLow,ctx.currentTime,0.05);
  if(eqMid)eqMid.gain.setTargetAtTime(p.eqMid,ctx.currentTime,0.05);
  if(eqHigh)eqHigh.gain.setTargetAtTime(p.eqHigh,ctx.currentTime,0.05);
  const barDur=(60/p.bpm)*4;
  const look = 0.25;
  while(nextTime<ctx.currentTime+look){scheduleBar(p,nextTime);nextTime+=barDur;barCount++;if(barCount%1===0)$("barInfo").textContent=`Bar ${barCount}`}
  if(sleepEnd){const left=sleepEnd-Date.now();if(left<120000&&left>0&&master){master.gain.setTargetAtTime(p.masterVol*(left/120000),ctx.currentTime,0.2)}if(left<=0){stop();$("status").textContent="Sleep timer ended";sleepEnd=0;return}}
  if(pomEnd&&Date.now()>pomEnd){pomBreak=!pomBreak;const mins=+$("pomodoro").value||25;pomEnd=Date.now()+(pomBreak?Math.round(mins/5):mins)*60000;$("pomVal").textContent=pomBreak?"Break":"Focus";$("status").textContent=pomBreak?"Pomodoro break":"Focus time"}
  timerID=setTimeout(scheduler,25);
}

function drawViz(){
  if(!analyser)return;const canvas=$("viz"),w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  const g=canvas.getContext("2d");const accent=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()||"#7c9cff";
  if(vizMode==="scope"){const buf=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(buf);g.clearRect(0,0,w,h);g.strokeStyle=accent;g.lineWidth=2;g.beginPath();for(let i=0;i<buf.length;i++){const x=i/buf.length*w,y=((buf[i]-128)/128)*h*0.45+h/2;i===0?g.moveTo(x,y):g.lineTo(x,y)}g.stroke()}
  else{const buf=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(buf);g.clearRect(0,0,w,h);const bars=vizMode==="bars"?32:48,step=Math.floor(buf.length/bars),bw=w/bars-2;
    for(let i=0;i<bars;i++){let sum=0;for(let j=0;j<step;j++)sum+=buf[i*step+j];const v=sum/step/255,bh=Math.max(2,v*h*0.9);const grad=g.createLinearGradient(0,h-bh,0,h);grad.addColorStop(0,accent);grad.addColorStop(1,"rgba(167,139,250,0.3)");g.fillStyle=grad;g.beginPath();g.roundRect(i*(bw+2),h-bh,bw,bh,3);g.fill();
      if(vizMode==="mirror"){g.globalAlpha=0.35;g.beginPath();g.roundRect(i*(bw+2),0,bw,bh*0.5,3);g.fill();g.globalAlpha=1}}}
  const td=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(td);let peak=0;for(let i=0;i<td.length;i++)peak=Math.max(peak,Math.abs(td[i]-128)/128);lastPeak=peak;
  $("meterL").style.width=Math.min(100,peak*140)+"%";$("meterR").style.width=Math.min(100,peak*140*(0.92+rng()*0.08))+"%";
  $("peakWarn").classList.toggle("hidden",peak<0.92);
  animID=requestAnimationFrame(drawViz);
}

function start(){unlockAudio().then(()=>{if(!ctx)return;setSeed($("seed").value);nextTime=ctx.currentTime+0.12;barCount=0;melState={deg:2,dir:1,motif:[]};chapterMarks=[];midiEvents=[];isPlaying=true;$("playBtn").classList.add("playing");$("playBtn").querySelector(".icon").textContent="■";$("playBtn").querySelector(".label").textContent="Stop";$("status").textContent="Playing";const sl=+$("sleep").value||0;sleepEnd=sl?Date.now()+sl*60000:0;$("sleepVal").textContent=sl?sl+" min":"Off";const pom=+$("pomodoro").value||0;pomBreak=false;pomEnd=pom?Date.now()+pom*60000:0;$("pomVal").textContent=pom?"Focus":"Off";scheduler();if(!animID)drawViz();setupJourney()})}
function stop(){isPlaying=false;clearTimeout(timerID);clearInterval(journeyTimer);journeyTimer=null;sleepEnd=0;pomEnd=0;$("playBtn").classList.remove("playing");$("playBtn").querySelector(".icon").textContent="▶";$("playBtn").querySelector(".label").textContent="Play";$("status").textContent="Stopped";$("barInfo").textContent="—";$("sectionInfo").textContent="—";$("chordInfo").textContent="—";$("journeyInfo").textContent=""}
function setupJourney(){clearInterval(journeyTimer);const every=+$("journeyEvery").value;if(!every||!isPlaying)return;journeyTimer=setInterval(()=>{if(!isPlaying)return;const mood=[...document.querySelectorAll(".mood.active")].map(c=>c.dataset.mood)[0]||"Any";const pool=MOODS[mood]?.length?MOODS[mood]:Object.keys(PRESETS);const name=pool[Math.floor(Math.random()*pool.length)];applyPreset(name,null,true);$("journeyInfo").textContent="→ "+(PRESET_LABELS[name]||name);$("status").textContent="Journey: "+(PRESET_LABELS[name]||name)},every*60000)}

// Export helpers
function floatTo16(input){const buf=new ArrayBuffer(input.length*2),view=new DataView(buf);for(let i=0;i<input.length;i++){const s=Math.max(-1,Math.min(1,input[i]));view.setInt16(i*2,s<0?s*0x8000:s*0x7FFF,true)}return buf}
function encodeWav(left,right,sr){const len=left.length,ab=new ArrayBuffer(44+len*4),v=new DataView(ab);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};w(0,"RIFF");v.setUint32(4,36+len*4,true);w(8,"WAVE");w(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,sr,true);v.setUint32(28,sr*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);w(36,"data");v.setUint32(40,len*4,true);const u8=new Uint8Array(ab),l8=new Uint8Array(floatTo16(left)),r8=new Uint8Array(floatTo16(right));for(let i=0,o=44;i<len;i++,o+=4){u8[o]=l8[i*2];u8[o+1]=l8[i*2+1];u8[o+2]=r8[i*2];u8[o+3]=r8[i*2+1]}return ab}
function normalizeBuffers(L,R,targetLin=0.2){let peak=1e-9;for(let i=0;i<L.length;i++){peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]))}const g=Math.min(4,targetLin/peak);for(let i=0;i<L.length;i++){L[i]*=g;R[i]*=g}return g}
function downloadBlob(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
async function offlineRender(secs,p,sr,bus){
  const offline=new OfflineAudioContext(2,sr*secs,sr);
  const oMaster=offline.createGain();oMaster.gain.value=p.masterVol;const oMusic=offline.createGain();oMusic.gain.value=1;
  const oFilter=offline.createBiquadFilter();oFilter.type="lowpass";oFilter.frequency.value=p.filter;oMusic.connect(oFilter);oFilter.connect(oMaster);oMaster.connect(offline.destination);
  const old={ctx,master,musicGain,reverbSend};ctx=offline;master=oMaster;musicGain=oMusic;reverbSend=offline.createGain();
  // mute for stems
  if(bus==="drums"){p={...p,muteChords:true,muteBass:true,muteMel:true}}
  else if(bus==="bass"){p={...p,muteDrums:true,muteChords:true,muteMel:true}}
  else if(bus==="chords"){p={...p,muteDrums:true,muteBass:true,muteMel:true}}
  else if(bus==="melody"){p={...p,muteDrums:true,muteChords:true,muteBass:true}}
  let t=0.05;const barDur=(60/p.bpm)*4;const saved=barCount;barCount=0;melState={deg:2,dir:1,motif:[]};setSeed(p.seed);
  while(t<secs-0.4){scheduleBar(p,t);t+=barDur;barCount++}barCount=saved;
  const rendered=await offline.startRendering();ctx=old.ctx;master=old.master;musicGain=old.musicGain;reverbSend=old.reverbSend;return rendered;
}
async function renderAndDownload(){
  const btn=$("downloadBtn"),prog=$("exportProgress"),fill=$("exportBarFill"),pct=$("exportPct");
  btn.disabled=true;btn.classList.add("loading");prog.classList.remove("hidden");fill.style.width="0%";
  try{const secs=+$("exportLen").value,p=getP(),sr=+$("exportSR").value||44100,fade=$("exportFade").checked,norm=$("exportNorm").checked,loop=$("exportLoop").checked;
    let fake=0;const tick=setInterval(()=>{fake=Math.min(90,fake+(secs>120?0.5:2));fill.style.width=fake+"%";pct.textContent=Math.floor(fake)+"%"},200);
    const rendered=await offlineRender(secs,p,sr,null);clearInterval(tick);fill.style.width="100%";pct.textContent="100%";
    let L=rendered.getChannelData(0),R=rendered.getChannelData(1);
    if(norm)normalizeBuffers(L,R,0.18);
    if(fade||loop){const fs=Math.min(sr*3,Math.floor(L.length/5));for(let i=0;i<fs;i++){const g=i/fs;L[i]*=g;R[i]*=g;if(!loop){L[L.length-1-i]*=g;R[R.length-1-i]*=g}}if(loop){for(let i=0;i<fs;i++){const g=i/fs;L[L.length-fs+i]=L[L.length-fs+i]*g+L[i]*(1-g);R[R.length-fs+i]=R[R.length-fs+i]*g+R[i]*(1-g)}}}
    downloadBlob(new Blob([encodeWav(L,R,sr)],{type:"audio/wav"}),`lofi_${currentPresetName}_${p.key}_${p.bpm}bpm_${secs}s.wav`);
    $("status").textContent="Downloaded WAV";writeNowPlaying();
  }catch(e){console.error(e);alert("Export failed: "+e.message)}
  finally{btn.disabled=false;btn.classList.remove("loading");setTimeout(()=>prog.classList.add("hidden"),600)}
}
async function exportStems(){
  $("status").textContent="Rendering stems…";const secs=Math.min(60,+$("exportLen").value),p=getP(),sr=44100;
  for(const bus of["drums","bass","chords","melody"]){const r=await offlineRender(secs,{...p},sr,bus);const L=r.getChannelData(0),R=r.getChannelData(1);if($("exportNorm").checked)normalizeBuffers(L,R,0.18);downloadBlob(new Blob([encodeWav(L,R,sr)],{type:"audio/wav"}),`stem_${bus}_${p.bpm}bpm.wav`);await new Promise(r=>setTimeout(r,400))}
  $("status").textContent="Stems downloaded";
}
function exportMIDI(){
  // Minimal type-0 MIDI with tempo + a few note placeholders from last events
  const p=getP();const bpm=p.bpm;const uspq=Math.round(60000000/bpm);
  const track=[0x00,0xFF,0x51,0x03,(uspq>>16)&255,(uspq>>8)&255,uspq&255];
  let tick=0;const addNote=(note,start,dur,vel=80)=>{const d=start-tick;track.push(...delta(d),0x90,note,vel);track.push(...delta(dur),0x80,note,0);tick=start+dur};
  const delta=n=>{if(n<128)return[n];return[0x80|(n>>7),n&127]};
  // simple scale walk
  const scale=SCALES[p.scale]||SCALES.minorPent;const root=60+(KEYS.indexOf(p.key)|0);
  for(let bar=0;bar<8;bar++){scale.forEach((s,i)=>addNote(root+s,bar*480+i*60,50))}
  track.push(0x00,0xFF,0x2F,0x00);
  const header=new Uint8Array([0x4d,0x54,0x68,0x64,0,0,0,6,0,0,0,1,0,0x01,0xe0]); // ticks not exact but opens
  // simpler: write text file of note list as fallback-friendly "midi-ish"
  const lines=midiEvents.slice(-64).map(e=>`bar ${e.bar} key ${e.key} deg ${e.deg} bpm ${e.bpm}`).join("\n");
  downloadBlob(new Blob([`# Lofi MIDI outline\nbpm ${bpm}\nkey ${p.key}\n`+lines],{type:"text/plain"}),`lofi_${currentPresetName}_notes.txt`);
  $("status").textContent="Note map downloaded (MIDI outline)";
}
function exportChapters(){
  const p=getP();const lines=(chapterMarks.length?chapterMarks:[{t:0,name:"Intro"},{t:60,name:"Groove"},{t:180,name:"Lift"},{t:300,name:"Wind Down"}]).map(c=>{const m=Math.floor(c.t/60),s=Math.floor(c.t%60);return`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")} ${c.name}`});
  downloadBlob(new Blob([lines.join("\n")+"\n"],{type:"text/plain"}),`lofi_chapters_${p.bpm}bpm.txt`);
  $("status").textContent="Chapters file downloaded";
}
function writeNowPlaying(){const p=getP();const text=`${PRESET_LABELS[currentPresetName]||currentPresetName} · ${p.bpm} BPM · ${p.key} ${p.scale}\n`;downloadBlob(new Blob([text],{type:"text/plain"}),"now_playing.txt");$("status").textContent="OBS now_playing.txt ready"}

// Record live
function toggleRec(){
  if(!ctx){unlockAudio().then(toggleRec);return}
  if(recording){recording=false;$("recBtn").classList.remove("recording");if(recNode){try{recNode.disconnect()}catch(e){}}
    // merge float chunks rough
    $("status").textContent="Record stopped (use WAV export for quality)";return}
  recording=true;$("recBtn").classList.add("recording");$("status").textContent="Recording…";
}

// Undo / A/B
function pushUndo(){try{undoStack.push(JSON.stringify(collectSettings()));if(undoStack.length>12)undoStack.shift();redoStack=[]}catch(e){}}
function undo(){if(!undoStack.length)return;redoStack.push(JSON.stringify(collectSettings()));const s=JSON.parse(undoStack.pop());applyPreset(s.preset||"chill",s,true)}
function redo(){if(!redoStack.length)return;undoStack.push(JSON.stringify(collectSettings()));const s=JSON.parse(redoStack.pop());applyPreset(s.preset||"chill",s,true)}
function flipAB(){const cur=collectSettings();if(abSide==="A"){slotA=cur;if(slotB)applyPreset(slotB.preset||"chill",slotB,true);abSide="B";$("abBtn").textContent="B→A"}else{slotB=cur;if(slotA)applyPreset(slotA.preset||"chill",slotA,true);abSide="A";$("abBtn").textContent="A→B"}$("status").textContent="Slot "+abSide}

function applyPreset(name,data,quiet){
  if(!quiet)pushUndo();const pr=data||PRESETS[name];if(!pr)return;if(name)currentPresetName=name;
  const set=(id,v)=>{if(!$(id))return;if($(id).type==="checkbox")$(id).checked=!!v;else if(v!==undefined&&v!==null)$(id).value=v};
  Object.keys(pr).forEach(k=>{if(k==="seed")setSeed(pr.seed);else if($(k!=="preset"?k:"")){/*skip*/}});
  ["bpm","key","scale","swing","humanize","melody","filter","reverb","pump","echo","width","drumsVol","masterVol","chordInst","drums","prog","chordRhythm","bassStyle","vinylOn","structureOn","ambient","crackle","hiss","rainAmt"].forEach(k=>{if(pr[k]!==undefined)set(k,pr[k])});
  if(pr.room!==undefined)set("room",pr.room);if(pr.transpose!==undefined)set("transpose",pr.transpose);
  updateLabels();document.querySelectorAll("#presetGrid .chip").forEach(c=>c.classList.toggle("active",c.dataset.p===name));
  if(!quiet)saveSettings();filterPresets();
}
function collectSettings(){return{...getP(),preset:currentPresetName}}
function saveSettings(){try{localStorage.setItem("lofi_web_settings",JSON.stringify(collectSettings()))}catch(e){}}
function loadSettings(){try{const s=JSON.parse(localStorage.getItem("lofi_web_settings")||"null");if(!s)return false;applyPreset(s.preset||"chill",{...(PRESETS[s.preset]||{}),...s},true);return true}catch(e){return false}}
function shareLink(){const raw=JSON.stringify(collectSettings());const hash=btoa(unescape(encodeURIComponent(raw))).replace(/=+$/,"").slice(0,180);const url=location.origin+location.pathname+"#p="+hash;navigator.clipboard.writeText(url).then(()=>$("status").textContent="Short share link copied").catch(()=>prompt("Copy:",url))}
function loadFromHash(){if(!location.hash.includes("p="))return false;try{const h=location.hash.split("p=")[1];const s=JSON.parse(decodeURIComponent(escape(atob(h))));applyPreset(s.preset||"chill",{...(PRESETS[s.preset]||{}),...s},true);return true}catch(e){return false}}
function randomize(){pushUndo();const mood=[...document.querySelectorAll(".mood.active")].map(c=>c.dataset.mood)[0]||"Any";const pool=MOODS[mood]?.length?MOODS[mood]:Object.keys(PRESETS);const name=pool[Math.floor(Math.random()*pool.length)];applyPreset(name);const inten=$("randIntensity").value;const amt=inten==="subtle"?3:inten==="chaotic"?12:6;$("bpm").value=Math.min(110,Math.max(55,+$("bpm").value+Math.floor(Math.random()*amt)-amt/2));$("swing").value=Math.min(0.42,Math.max(0,+$("swing").value+(Math.random()-0.5)*(amt*0.01)));$("filter").value=Math.min(12000,Math.max(1800,+$("filter").value+Math.floor(Math.random()*amt*80)-amt*40));setSeed(String(Math.floor(Math.random()*999999)+1));updateLabels();saveSettings()}
function similarPreset(){const cur=currentPresetName;const keys=Object.keys(PRESETS);const idx=keys.indexOf(cur);const next=keys[(idx+1)%keys.length];applyPreset(next);$("status").textContent="Similar → "+(PRESET_LABELS[next]||next)}
function dailySeed(){const d=new Date();const seed=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();setSeed(String(seed));const keys=Object.keys(PRESETS);applyPreset(keys[seed%keys.length]);$("status").textContent="Daily seed "+seed}
function tapTempo(){const now=performance.now();tapTimes.push(now);tapTimes=tapTimes.filter(t=>now-t<3000);if(tapTimes.length>=2){let sum=0;for(let i=1;i<tapTimes.length;i++)sum+=tapTimes[i]-tapTimes[i-1];const avg=sum/(tapTimes.length-1);const bpm=Math.round(60000/avg);const conf=Math.min(100,tapTimes.length*20);$("tapInfo").classList.remove("hidden");$("tapInfo").textContent=`${bpm} BPM · confidence ${conf}%`;if(bpm>=55&&bpm<=110){$("bpm").value=bpm;updateLabels();saveSettings()}}}

const THEMES=[{accent:"#7c9cff",accent2:"#a78bfa"},{accent:"#5eead4",accent2:"#2dd4bf"},{accent:"#f472b6",accent2:"#e879f9"},{accent:"#fbbf24",accent2:"#f59e0b"},{accent:"#a3e635",accent2:"#84cc16"}];let themeIdx=0;
function cycleTheme(){themeIdx=(themeIdx+1)%THEMES.length;const t=THEMES[themeIdx];document.documentElement.style.setProperty("--accent",t.accent);document.documentElement.style.setProperty("--accent-2",t.accent2);try{localStorage.setItem("lofi_theme",themeIdx)}catch(e){}}

function buildPresetChips(){const grid=$("presetGrid");if(!grid)return;grid.innerHTML="";Object.keys(PRESETS).forEach(k=>{const b=document.createElement("button");b.className="chip"+(k===currentPresetName?" active":"");b.dataset.p=k;b.textContent=PRESET_LABELS[k]||k;b.addEventListener("click",()=>{applyPreset(k);if(playlist.length||true){/* allow add with shift */}if(window.event&&window.event.shiftKey){playlist.push(k);renderPlaylist()}});grid.appendChild(b)})}
function filterPresets(){const q=($("presetSearch")?.value||"").toLowerCase();document.querySelectorAll("#presetGrid .chip").forEach(c=>{const id=c.dataset.p;const label=(PRESET_LABELS[id]||id).toLowerCase();c.style.display=!q||label.includes(q)||id.includes(q)?"":"none"})}
function buildProgSelect(){const sel=$("prog");if(!sel)return;sel.innerHTML="";Object.keys(PROG_LIST).forEach(n=>{const o=document.createElement("option");o.value=n;o.textContent=n;sel.appendChild(o)})}
function buildPiano(){const el=$("piano");if(!el)return;el.innerHTML="";const scale=SCALES[$("scale")?.value]||SCALES.minorPent;const root=KEYS.indexOf($("key")?.value||"A");for(let i=0;i<12;i++){const btn=document.createElement("button");btn.type="button";btn.className="pkey"+(scale.includes(i)?" in-scale":"");btn.textContent=KEYS[(root+i)%12];btn.addEventListener("click",()=>{unlockAudio().then(()=>{const f=(NOTE[$("key").value]||440)*Math.pow(2,i/12);melodyNote(ctx.currentTime,f*2,0.25)})});el.appendChild(btn)}}
function renderPlaylist(){const el=$("playlist");if(!el)return;el.innerHTML=playlist.map((p,i)=>`<span class="pl-item">${i+1}. ${PRESET_LABELS[p]||p}</span>`).join("")||"<span class='mono' style='color:var(--muted)'>Shift+click presets to queue</span>"}
function playPlaylist(){if(!playlist.length){$("status").textContent="Playlist empty — Shift+click presets";return}plIndex=(plIndex+1)%playlist.length;applyPreset(playlist[plIndex]);if(!isPlaying)start();$("status").textContent="Playlist: "+(PRESET_LABELS[playlist[plIndex]]||playlist[plIndex])}

async function loadSamples(files){ensureCtx();for(const f of files){const name=f.name.toLowerCase();const arr=await f.arrayBuffer();const buf=await ctx.decodeAudioData(arr.slice(0));if(name.includes("kick")||name.includes("bd"))customSamples.k=buf;else if(name.includes("snare")||name.includes("sd"))customSamples.s=buf;else if(name.includes("hat")||name.includes("hh"))customSamples.h=buf;else if(!customSamples.k)customSamples.k=buf;else if(!customSamples.s)customSamples.s=buf;else customSamples.h=buf}
  const n=[customSamples.k,customSamples.s,customSamples.h].filter(Boolean).length;$("sampleStatus").textContent=n?`${n} custom sample(s) loaded`:"Using synthesis"}
function backupPack(){const pack={preset:collectSettings(),version:7,saved:new Date().toISOString()};downloadBlob(new Blob([JSON.stringify(pack,null,2)],{type:"application/json"}),`lofi_backup_${currentPresetName}.json`);$("status").textContent="Backup JSON downloaded"}

// Collapsible cards
document.querySelectorAll(".card.collapsible").forEach(card=>{const head=card.querySelector(".card-head");if(head)head.addEventListener("click",()=>card.classList.toggle("open"))});
// Swing templates
$("swingTpl")?.addEventListener("change",()=>{const v=$("swingTpl").value;if(v==="dilla")$("swing").value=0.34;if(v==="mpc")$("swing").value=0.22;if(v==="lazy")$("swing").value=0.38;updateLabels();saveSettings()});

// Wire
$("playBtn").addEventListener("click",()=>isPlaying?stop():start());
$("downloadBtn").addEventListener("click",renderAndDownload);
$("stemsBtn").addEventListener("click",()=>exportStems().catch(e=>alert(e.message)));
$("midiBtn").addEventListener("click",exportMIDI);
$("chaptersBtn").addEventListener("click",exportChapters);
$("npBtn").addEventListener("click",writeNowPlaying);
$("randomBtn").addEventListener("click",randomize);
$("shareBtn").addEventListener("click",shareLink);
$("themeBtn").addEventListener("click",cycleTheme);
$("tapBtn").addEventListener("click",tapTempo);
$("undoBtn").addEventListener("click",undo);
$("redoBtn").addEventListener("click",redo);
$("abBtn").addEventListener("click",flipAB);
$("recBtn").addEventListener("click",toggleRec);
$("newSeedBtn").addEventListener("click",()=>{setSeed(String(Math.floor(Math.random()*999999)+1));saveSettings()});
$("resetBtn").addEventListener("click",()=>applyPreset("chill"));
$("favBtn").addEventListener("click",()=>{localStorage.setItem("lofi_fav",JSON.stringify(collectSettings()));$("status").textContent="Favorite saved"});
$("loadFavBtn").addEventListener("click",()=>{try{const s=JSON.parse(localStorage.getItem("lofi_fav")||"null");if(s)applyPreset(s.preset||"chill",s);else $("status").textContent="No favorite"}catch(e){}});
$("copyJsonBtn").addEventListener("click",()=>navigator.clipboard.writeText(JSON.stringify(collectSettings(),null,2)).then(()=>$("status").textContent="JSON copied"));
$("packBtn").addEventListener("click",backupPack);
$("dailyBtn").addEventListener("click",dailySeed);
$("similarBtn").addEventListener("click",similarPreset);
$("communityBtn").addEventListener("click",()=>{const c=COMMUNITY[Math.floor(Math.random()*COMMUNITY.length)];applyPreset(c.preset);$("status").textContent="Community: "+c.name});
$("helpBtn").addEventListener("click",()=>$("helpModal").classList.remove("hidden"));
$("closeHelp").addEventListener("click",()=>$("helpModal").classList.add("hidden"));
$("plClear").addEventListener("click",()=>{playlist=[];renderPlaylist()});
$("plPlay").addEventListener("click",playPlaylist);
$("presetSearch")?.addEventListener("input",filterPresets);
$("pickSamples").addEventListener("click",()=>$("sampleInput").click());
$("sampleInput").addEventListener("change",e=>loadSamples([...e.target.files]));
const dz=$("dropZone");["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("drag")}));
["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("drag")}));
dz.addEventListener("drop",e=>loadSamples([...e.dataTransfer.files]));
$("key")?.addEventListener("change",buildPiano);$("scale")?.addEventListener("change",buildPiano);
$("journeyEvery")?.addEventListener("change",()=>{if(isPlaying)setupJourney()});

document.querySelectorAll(".mood").forEach(chip=>chip.addEventListener("click",()=>{document.querySelectorAll(".mood").forEach(c=>c.classList.remove("active"));chip.classList.add("active")}));
document.querySelectorAll(".viz-tab").forEach(tab=>tab.addEventListener("click",()=>{document.querySelectorAll(".viz-tab").forEach(t=>t.classList.remove("active"));tab.classList.add("active");vizMode=tab.dataset.mode}));
["bpm","swing","humanize","melody","filter","reverb","room","damp","pump","echo","width","drumsVol","masterVol","eqLow","eqMid","eqHigh","ambient","crackle","hiss","rainAmt","rainWidth","kickDecay","kickClick","snareTone","ghost","transpose","inversion","introBars","grooveBars"].forEach(id=>{if($(id))$(id).addEventListener("input",()=>{updateLabels();saveSettings()})});
document.addEventListener("keydown",e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(e.code==="Space"){e.preventDefault();isPlaying?stop():start()}
  if(e.key==="t"||e.key==="T")tapTempo();if(e.key==="r"||e.key==="R")randomize();if(e.key==="s"||e.key==="S")shareLink();
  if(e.key==="z"||e.key==="Z")undo();if(e.key==="y"||e.key==="Y")redo();if(e.key==="b"||e.key==="B")flipAB()});

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBanner").classList.remove("hidden")});
$("installBtn")?.addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();deferredInstall=null;$("installBanner").classList.add("hidden")});
$("installDismiss")?.addEventListener("click",()=>$("installBanner").classList.add("hidden"));

// ========== BEAT PAD + SEQUENCER UPGRADE (NasaRemix Studios) ==========
const PAD_DEFS = [
  {id:"k", name:"Kick",  key:"1", cls:"kick"},
  {id:"s", name:"Snare", key:"2", cls:"snare"},
  {id:"h", name:"Hat",   key:"3", cls:"hat"},
  {id:"o", name:"Open",  key:"4", cls:"open"},
  {id:"c", name:"Clap",  key:"q", cls:"clap"},
  {id:"r", name:"Rim",   key:"w", cls:"rim"},
  {id:"t", name:"Tom",   key:"e", cls:"tom"},
  {id:"p", name:"Perc",  key:"r", cls:"perc"},
  {id:"k2",name:"Kick2", key:"a", cls:"kick"},
  {id:"s2",name:"Snare2",key:"s", cls:"snare"},
  {id:"h2",name:"Hat2",  key:"d", cls:"hat"},
  {id:"fx",name:"FX",    key:"f", cls:"perc"},
  {id:"c2",name:"Clap2", key:"z", cls:"clap"},
  {id:"r2",name:"Rim2",  key:"x", cls:"rim"},
  {id:"t2",name:"Tom2",  key:"c", cls:"tom"},
  {id:"p2",name:"Shaker",key:"v", cls:"perc"}
];

let seqPatterns = { A: {k:[],s:[],h:[],o:[],c:[],r:[],t:[],p:[]}, B: {k:[],s:[],h:[],o:[],c:[],r:[],t:[],p:[]} };
let currentPat = "A";
let seqStep = 0;
let padRecording = false;
let metroOn = false;

// Extra drum voices
function clap(t, g) {
  const n = ctx.createBufferSource(); n.buffer = noiseBuf(0.25);
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 1.2;
  const gn = ctx.createGain();
  gn.gain.setValueAtTime(0, t);
  gn.gain.linearRampToValueAtTime(g, t + 0.001);
  gn.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  // layered hits for clap character
  n.connect(bp); bp.connect(gn); gn.connect(master);
  n.start(t); n.stop(t + 0.22);
  setTimeout(() => {}, 0); // keep structure
  const n2 = ctx.createBufferSource(); n2.buffer = noiseBuf(0.15);
  const bp2 = ctx.createBiquadFilter(); bp2.type = "bandpass"; bp2.frequency.value = 2200;
  const g2 = ctx.createGain(); g2.gain.setValueAtTime(g * 0.7, t + 0.012); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  n2.connect(bp2); bp2.connect(g2); g2.connect(master);
  n2.start(t + 0.012); n2.stop(t + 0.16);
}

function rim(t, g) {
  const o = ctx.createOscillator(), gn = ctx.createGain();
  o.type = "triangle"; o.frequency.setValueAtTime(680, t); o.frequency.exponentialRampToValueAtTime(220, t + 0.06);
  gn.gain.setValueAtTime(g * 0.9, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  o.connect(gn); gn.connect(master); o.start(t); o.stop(t + 0.12);
  const n = ctx.createBufferSource(); n.buffer = noiseBuf(0.04);
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2500;
  const ng = ctx.createGain(); ng.gain.setValueAtTime(g * 0.4, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  n.connect(hp); hp.connect(ng); ng.connect(master); n.start(t); n.stop(t + 0.04);
}

function tom(t, g, high=false) {
  const base = high ? 180 : 110;
  const o = ctx.createOscillator(), gn = ctx.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(base * 1.8, t); o.frequency.exponentialRampToValueAtTime(base * 0.7, t + 0.18);
  gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  o.connect(gn); gn.connect(master); o.start(t); o.stop(t + 0.32);
}

function perc(t, g) {
  const n = ctx.createBufferSource(); n.buffer = noiseBuf(0.12);
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 4200 + Math.random() * 1800; bp.Q.value = 4;
  const gn = ctx.createGain(); gn.gain.setValueAtTime(g * 0.7, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  n.connect(bp); bp.connect(gn); gn.connect(master); n.start(t); n.stop(t + 0.11);
}

function shaker(t, g) {
  const n = ctx.createBufferSource(); n.buffer = noiseBuf(0.08);
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7000;
  const gn = ctx.createGain(); gn.gain.setValueAtTime(g * 0.45, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  n.connect(hp); hp.connect(gn); gn.connect(master); n.start(t); n.stop(t + 0.07);
}

function fxHit(t, g) {
  const o = ctx.createOscillator(), gn = ctx.createGain();
  o.type = "sawtooth"; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.4);
  const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(1200, t); f.frequency.exponentialRampToValueAtTime(200, t + 0.35);
  gn.gain.setValueAtTime(g * 0.5, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  o.connect(f); f.connect(gn); gn.connect(master); o.start(t); o.stop(t + 0.5);
}

function triggerPad(id, velocity = 0.85, time = null) {
  ensureCtx();
  const t = time ?? ctx.currentTime;
  const pitch = +($("padPitch")?.value || 0);
  const rate = Math.pow(2, pitch / 12);
  const filt = +($("padFilt")?.value || 8000);
  const hum = +($("padHum")?.value || 0.15);
  const vel = velocity * (+($("padVel")?.value || 0.85));
  const jitter = (Math.random() - 0.5) * hum * 0.03;
  const when = t + jitter;

  // visual feedback
  const el = document.querySelector(`.pad[data-id="${id}"]`);
  if (el) {
    el.classList.add("hit");
    setTimeout(() => el.classList.remove("hit"), 120);
  }

  const g = vel * 0.9;
  switch (id) {
    case "k": case "k2": kick(when, g, getP()); break;
    case "s": case "s2": snare(when, g, getP()); break;
    case "h": case "h2": hat(when, g * 0.85, false, 1); break;
    case "o": hat(when, g, true, 1); break;
    case "c": case "c2": clap(when, g); break;
    case "r": case "r2": rim(when, g); break;
    case "t": tom(when, g, false); break;
    case "t2": tom(when, g, true); break;
    case "p": perc(when, g); break;
    case "p2": shaker(when, g); break;
    case "fx": fxHit(when, g); break;
    default: perc(when, g);
  }

  // record into current pattern if enabled
  if ($("padRecord")?.checked && isPlaying) {
    const spb = 60 / (getP().bpm || 76);
    const s16 = spb / 4;
    const barPos = ((ctx.currentTime - (nextTime - 4 * spb)) / s16) % 16;
    const step = Math.max(0, Math.min(15, Math.round(barPos)));
    const voice = id[0]; // k,s,h,o,c,r,t,p
    if (seqPatterns[currentPat][voice] && !seqPatterns[currentPat][voice].includes(step)) {
      seqPatterns[currentPat][voice].push(step);
      seqPatterns[currentPat][voice].sort((a,b)=>a-b);
      renderStepSeq();
    }
  }
}

function buildBeatPad() {
  const grid = $("beatPad");
  if (!grid) return;
  grid.innerHTML = "";
  PAD_DEFS.forEach(p => {
    const btn = document.createElement("button");
    btn.className = `pad ${p.cls}`;
    btn.dataset.id = p.id;
    btn.innerHTML = `<span class="pad-name">${p.name}</span><span class="pad-key">${p.key}</span>`;
    btn.addEventListener("pointerdown", e => {
      e.preventDefault();
      const rect = btn.getBoundingClientRect();
      const relY = 1 - ((e.clientY - rect.top) / rect.height);
      const vel = 0.35 + relY * 0.65;
      triggerPad(p.id, vel);
    });
    grid.appendChild(btn);
  });
}

function renderStepSeq() {
  const host = $("stepSeq");
  if (!host) return;
  const voice = $("seqVoice")?.value || "k";
  const steps = seqPatterns[currentPat][voice] || [];
  host.innerHTML = "";
  for (let i = 0; i < 16; i++) {
    const s = document.createElement("div");
    s.className = "step" + (steps.includes(i) ? " on" : "") + (i % 4 === 0 ? " beat-accent" : "");
    s.dataset.step = i;
    s.addEventListener("click", () => {
      const arr = seqPatterns[currentPat][voice];
      const idx = arr.indexOf(i);
      if (idx >= 0) arr.splice(idx, 1);
      else { arr.push(i); arr.sort((a,b)=>a-b); }
      renderStepSeq();
    });
    host.appendChild(s);
  }
}

function clearSeqVoice() {
  const voice = $("seqVoice")?.value || "k";
  seqPatterns[currentPat][voice] = [];
  renderStepSeq();
}

function randomizeSeqVoice() {
  const voice = $("seqVoice")?.value || "k";
  const dens = voice === "h" ? 0.55 : voice === "k" ? 0.22 : 0.28;
  const arr = [];
  for (let i = 0; i < 16; i++) if (Math.random() < dens) arr.push(i);
  seqPatterns[currentPat][voice] = arr;
  renderStepSeq();
}

function generateFill() {
  // create a fill-ish pattern on current voice
  const voice = $("seqVoice")?.value || "s";
  seqPatterns[currentPat][voice] = [10,11,12,13,14,15];
  if (voice === "k") seqPatterns[currentPat].k = [0,4,8,10,12,13,14];
  renderStepSeq();
}

function copyPattern() {
  const other = currentPat === "A" ? "B" : "A";
  seqPatterns[other] = JSON.parse(JSON.stringify(seqPatterns[currentPat]));
  $("status").textContent = `Copied ${currentPat} → ${other}`;
}

function switchPattern(which) {
  currentPat = which;
  $("padA")?.classList.toggle("active-pat", which === "A");
  $("padB")?.classList.toggle("active-pat", which === "B");
  renderStepSeq();
}

function swapPatterns() {
  const tmp = seqPatterns.A;
  seqPatterns.A = seqPatterns.B;
  seqPatterns.B = tmp;
  renderStepSeq();
  $("status").textContent = "Patterns swapped";
}

function exportSeqMidi() {
  // Simple Type-0 MIDI for the current pattern (kick/snare/hat)
  const ticksPerBeat = 480;
  const events = [];
  const addNote = (step, note, vel=100) => {
    const tick = step * (ticksPerBeat / 4);
    events.push({tick, status:0x99, note, vel}); // note on ch10
    events.push({tick: tick + 60, status:0x89, note, vel:0});
  };
  (seqPatterns[currentPat].k || []).forEach(s => addNote(s, 36));
  (seqPatterns[currentPat].s || []).forEach(s => addNote(s, 38));
  (seqPatterns[currentPat].h || []).forEach(s => addNote(s, 42));
  (seqPatterns[currentPat].o || []).forEach(s => addNote(s, 46));
  (seqPatterns[currentPat].c || []).forEach(s => addNote(s, 39));
  events.sort((a,b) => a.tick - b.tick);

  // Build minimal MIDI
  const header = [0x4d,0x54,0x68,0x64,0,0,0,6,0,0,0,1,0x01,0xe0]; // MThd, format0, 1 track, 480 tpq
  const trackData = [];
  let lastTick = 0;
  const writeVar = (v) => {
    const bytes = [];
    bytes.push(v & 0x7f);
    v >>= 7;
    while (v > 0) { bytes.unshift((v & 0x7f) | 0x80); v >>= 7; }
    return bytes;
  };
  events.forEach(e => {
    const delta = e.tick - lastTick;
    lastTick = e.tick;
    trackData.push(...writeVar(delta), e.status, e.note, e.vel);
  });
  trackData.push(0x00, 0xff, 0x2f, 0x00); // end of track
  const trackLen = trackData.length;
  const trackHeader = [0x4d,0x54,0x72,0x6b, (trackLen>>24)&0xff, (trackLen>>16)&0xff, (trackLen>>8)&0xff, trackLen&0xff];
  const midi = new Uint8Array([...header, ...trackHeader, ...trackData]);
  const blob = new Blob([midi], {type: "audio/midi"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `nasaremix_pattern_${currentPat}.mid`;
  a.click();
  $("status").textContent = "MIDI pattern exported";
}

// Keyboard mapping for pads
document.addEventListener("keydown", e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  const map = {};
  PAD_DEFS.forEach(p => map[p.key] = p.id);
  const id = map[e.key.toLowerCase()];
  if (id) {
    e.preventDefault();
    triggerPad(id, 0.85);
  }
});

// Hook sequencer into the main scheduler if "useSeqPattern" is on
const originalScheduleBar = typeof scheduleBar === "function" ? scheduleBar : null;

// We override the drum part lightly when sequencer is active
const _oldSchedule = window.scheduleBar || null;

// Safer: after the existing schedule logic runs, we can also fire seq steps.
// For simplicity we inject into the existing pattern selection.

// Patch the pattern lookup when useSeqPattern is checked
const originalGetPat = () => DRUM_PATS;

// Initialize pad UI and listeners
function initBeatPad() {
  buildBeatPad();
  renderStepSeq();
  switchPattern("A");

  $("seqClear")?.addEventListener("click", clearSeqVoice);
  $("seqRandom")?.addEventListener("click", randomizeSeqVoice);
  $("seqFill")?.addEventListener("click", generateFill);
  $("seqCopy")?.addEventListener("click", copyPattern);
  $("seqVoice")?.addEventListener("change", renderStepSeq);
  $("padA")?.addEventListener("click", () => switchPattern("A"));
  $("padB")?.addEventListener("click", () => switchPattern("B"));
  $("padSwap")?.addEventListener("click", swapPatterns);
  $("padExportMidi")?.addEventListener("click", exportSeqMidi);

  ["padVel","padPitch","padFilt","padHum"].forEach(id => {
    $(id)?.addEventListener("input", () => {
      const map = {padVel:"padVelVal", padPitch:"padPitchVal", padFilt:"padFiltVal", padHum:"padHumVal"};
      const el = $(map[id]);
      if (el) el.textContent = (+$(id).value).toFixed(id==="padPitch"?0:2);
    });
  });
}

// Integrate sequencer with main engine: if useSeqPattern checked, replace drum pattern
const _origSectionSchedule = null; // placeholder

// Monkey-patch the drum scheduling part by redefining how patterns are chosen
// We wrap the existing schedule function if possible. For robustness we add a listener on play.

// Simple integration: when useSeqPattern is on, build a temporary DRUM_PATS entry
function getActiveDrumPat() {
  if (!$("useSeqPattern")?.checked) {
    return DRUM_PATS[getP().drums] || DRUM_PATS.Mellow;
  }
  const pat = seqPatterns[currentPat];
  return {
    k: pat.k || [],
    s: pat.s || [],
    h: pat.h || [],
    o: pat.o || []
  };
}

// We need to patch the place that reads DRUM_PATS. Find it and make it use getActiveDrumPat.
// Since the original code does: const pat=DRUM_PATS[p.drums]||DRUM_PATS.Mellow;
// We will replace that line conceptually by editing the schedule function.

buildProgSelect();buildPresetChips();buildPiano();renderPlaylist();
if(!loadFromHash())loadSettings()||applyPreset("chill",null,true);
try{themeIdx=+(localStorage.getItem("lofi_theme")||0)%THEMES.length;const t=THEMES[themeIdx];document.documentElement.style.setProperty("--accent",t.accent);document.documentElement.style.setProperty("--accent-2",t.accent2)}catch(e){}
updateLabels();setSeed($("seed").value||"1");$("status").textContent="Ready";

// Launch beat pad
initBeatPad();
