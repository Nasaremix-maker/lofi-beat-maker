# Lofi Beat Maker Pro

A free, browser-based lofi beat studio. Generate chill beats with procedural synthesis, tweak dozens of controls, and export WAV stems — no account, no install required (optional PWA).

---

## Features

### Sound engine
- Procedural drums (kick, snare, hats) with velocity, ghost notes, and optional **custom samples**
- Chord instruments: Rhodes (FM), Electric Piano, Piano, Pad, Pluck, Bell
- Bass styles: root, fifth, bounce, walking, sparse, glide
- Scale-aware melody with motif memory and optional call-and-response
- Sidechain-style **pump**, reverb (room + damp), tempo-synced echo, stereo width
- Vinyl crackle / hiss, rain layer, ambient bed
- Live 3-band EQ and master gain

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

---

## How it works

Everything runs **in your browser** with the Web Audio API.

1. **Scheduler** — each bar, the engine looks at BPM, swing, humanize, and the current structure section, then schedules drum hits, a chord, bass, and optional melody notes slightly ahead of the audio clock.
2. **Synthesis** — oscillators and filtered noise create drums and instruments. Optional WAV samples override kick / snare / hat if you drop files in.
3. **FX bus** — chords and melody go through filter → EQ → master, with sends for reverb and echo. Kick triggers a quick gain duck (pump) on the music bus.
4. **Export** — an `OfflineAudioContext` re-renders the same schedule into a buffer, then encodes WAV. Stems mute the other buses and render again.
5. **Persistence** — settings auto-save to `localStorage`. Share links encode settings in the URL hash. The service worker caches the app for offline use after the first visit.

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

- **Moods** bias the randomizer toward a feel.
- **Journey** (Presets panel) auto-switches presets every N minutes while playing.
- **Drop zone** accepts files named like `kick.wav`, `snare.wav`, `hat.wav`.
- Collapsible cards keep the mobile layout usable; open **Tone, FX & EQ** for depth.


---

## Install as an app

- **iPhone:** Safari → Share → Add to Home Screen  
- **Android:** Chrome → menu → Install app / Add to Home screen  

On iPhone, turn **off the Silent switch** or web audio may stay muted.

---

## Project files

| File | Role |
|------|------|
| `index.html` | UI structure |
| `style.css` | Layout and theme |
| `app.js` | Engine, UI logic, export |
| `sw.js` | Offline cache (PWA) |
| `manifest.json` | Install metadata |
| `icon-*.png` | App icons |

---

## License

Free to use and modify. If you publish beats made with it, a mention is appreciated :) but not required

Mention NasaRemixStudios

---

Made for studying, sleeping, and late-night sessions.
