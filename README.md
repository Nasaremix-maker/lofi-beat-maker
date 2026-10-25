# Beat Maker Pro — NasaRemix Studios Edition

A free, browser-based **multi-genre** beat studio. Switch between Lofi, Hip Hop, Trap, Reggae, Drum & Bass, Jazz, Classical, House, R&B, Ambient, and Afrobeat. Procedural synthesis, live beat pad, 16-step sequencer, and full stem export — no account, no install required (optional PWA).

---

## Features

### Multi-Genre Engine (NEW)
- One-click genre switcher: **Lofi · Hip Hop · Trap · Reggae · DnB · Jazz · Classical · House · R&B · Ambient · Afrobeat**
- Genre-specific presets, drum patterns, BPM ranges, instruments and FX bias
- Title and status update to match the selected style
- Randomize respects the current genre

### Sound engine
- Procedural drums (kick, snare, hats) with velocity, ghost notes, and optional **custom samples**
- **New voices:** Clap, Rim, Tom, Perc, Shaker, FX hit
- Chord instruments: Rhodes (FM), Electric Piano, Piano, Pad, Pluck, Bell
- Bass styles: root, fifth, bounce, walking, sparse, glide
- Scale-aware melody with motif memory and optional call-and-response
- Sidechain-style **pump**, reverb (room + damp), tempo-synced echo, stereo width
- Vinyl crackle / hiss, rain layer, ambient bed
- Live 3-band EQ and master gain

### Beat Pad & Sequencer (NEW — major upgrade)
1. **16-pad velocity-sensitive Beat Pad** (mouse / touch / keyboard)
2. Multiple kits selector (Lofi Classic, Boom Bap, Trap, Jazz, Electronic, Custom)
3. Live Trigger / Sequencer / Both modes
4. **16-step visual step sequencer** for 8 voices
5. Pattern A / Pattern B with instant switch + swap
6. Record live pad hits straight into the sequencer
7. Quantize live input
8. Per-pad velocity, pitch (±12 st), filter, and humanize
9. One-click Randomize / Fill / Clear per voice
10. Export current pattern as **Standard MIDI file**
11. Full QWERTY + number-row keyboard mapping
12. Visual hit feedback + playing step highlight
13. Sequencer can completely override the preset drum pattern
14. Extra voices (clap/rim/tom/perc) scheduled with the main engine
15. Touch-optimized pads for mobile

### Arrangement
- 16+ presets across moods (Calm, Rainy, Jazzy, Upbeat, Dark, Dreamy)
- Named progressions (Study Session, Neo Soul, Jazz ii-V-I, …)
- Chord rhythms: whole, half, stabs, offbeat, arpeggio patterns
- Structure: Intro → Groove → Lift → Break (editable lengths)
- Auto **Journey** mode morphs presets over time
- Playlist queue (Shift+click presets)

### Studio tools
- Play / stop with visualizer (spectrum, scope, bars, mirror)
- A/B compare slots, undo / redo
- Tap tempo, seed control, daily challenge seed
- Share link restores full settings
- Favorites + JSON backup
- Focus (Pomodoro) and sleep timers
- On-screen piano for the current scale

### Export
- WAV up to 10 minutes (44.1 / 48 kHz)
- Optional fade, loop crossfade, loudness-style normalize
- **Stems**: drums, bass, chords, melody
- Chapter / scene timestamps file
- Now-playing text for OBS
- Note map export for external MIDI work
- **New:** Sequencer pattern → MIDI download

---

## How it works

Everything runs **in your browser** with the Web Audio API.

1. **Scheduler** — each bar, the engine looks at BPM, swing, humanize, and the current structure section, then schedules drum hits, a chord, bass, and optional melody notes slightly ahead of the audio clock.
2. **Beat Pad** — live hits are triggered instantly with velocity from click/touch position. When “Record to seq” is on, hits are quantized into the 16-step grid.
3. **Synthesis** — oscillators and filtered noise create drums and instruments. Optional WAV samples override kick / snare / hat if you drop files in.
4. **FX bus** — chords and melody go through filter → EQ → master, with sends for reverb and echo. Kick triggers a quick gain duck (pump) on the music bus.
5. **Export** — an `OfflineAudioContext` re-renders the same schedule into a buffer, then encodes WAV. Stems mute the other buses and render again.
6. **Persistence** — settings auto-save to `localStorage`. Share links encode settings in the URL hash. The service worker caches the app for offline use after the first visit.

No server, no tracking, no audio upload. Your beats stay on your device.

---

## Controls (cheat sheet)

| Action | Shortcut / UI |
|--------|----------------|
| Play / stop | **Space** or Play button |
| Tap tempo | **T** or Tap |
| Randomize | **R** or 🎲 |
| Share link | **S** or Share |
| Undo / redo | **Z** / **Y** |
| A/B flip | **B** or A/B |
| Queue preset | **Shift+click** a preset chip |
| Trigger pads | **1 2 3 4 Q W E R A S D F Z X C V** |

- **Moods** bias the randomizer toward a feel.
- **Journey** (Presets panel) auto-switches presets every N minutes while playing.
- **Drop zone** accepts files named like `kick.wav`, `snare.wav`, `hat.wav`.
- Enable **Use sequencer pattern** to let your 16-step grid drive the drums instead of the preset pattern.
- Collapsible cards keep the mobile layout usable.

---

## Install as an app

- **iPhone:** Safari → Share → Add to Home Screen  
- **Android:** Chrome → menu → Install app / Add to Home screen  

On iPhone, turn **off the Silent switch** or web audio may stay muted.

---

## Project files

| File | Role |
|------|------|
| `index.html` | UI structure + Beat Pad section |
| `style.css` | Layout, theme, pad & sequencer styles |
| `app.js` | Engine, UI logic, export, beat pad & sequencer |
| `sw.js` | Offline cache (PWA) |
| `manifest.json` | Install metadata |
| `icon-*.png` | App icons |

---

## License

Free to use and modify. If you publish beats made with it, a mention is appreciated :) but not required.

**Made by NasaRemix Studios**

---

Made for studying, sleeping, late-night sessions, and now live beat making.
