/* ==========================================================================
   Music engine
   --------------------------------------------------------------------------
   A gentle music-box arrangement of "Happy Birthday to You" (the melody is in
   the public domain) plus a small set of soft sound effects, synthesised live
   with the Web Audio API.

   Why synthesise instead of shipping an MP3?
   - No copyrighted recordings are redistributed.
   - No network requests, no missing-asset failures, no load time.
   - The loop is seamless by construction.
   Every call is wrapped in try/catch: if a browser cannot create an
   AudioContext the rest of the website keeps working silently.
   ========================================================================== */

const BPM = 94;
const BEAT = 60 / BPM;

export const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/* --- Score -----------------------------------------------------------------
   Melody lives in F major. Each entry is [midi, beats]; null is a rest.
   -------------------------------------------------------------------------- */
const MELODY = [
  [
    [72, 0.5],
    [72, 0.5],
    [74, 1],
    [72, 1],
    [77, 1],
    [76, 1.5],
    [null, 0.5],
  ],
  [
    [72, 0.5],
    [72, 0.5],
    [74, 1],
    [72, 1],
    [79, 1],
    [77, 1.5],
    [null, 0.5],
  ],
  [
    [72, 0.5],
    [72, 0.5],
    [84, 1],
    [81, 1],
    [77, 1],
    [76, 1],
    [74, 1.5],
    [null, 0.5],
  ],
  [
    [70, 0.5],
    [70, 0.5],
    [69, 1],
    [65, 1],
    [67, 1],
    [65, 2],
    [null, 1],
  ],
];

/* Harmony bed: [startBeat, lengthInBeats, chordName] */
const CHORDS = [
  [0, 4, 'F'],
  [4, 3, 'C7'],
  [7, 3, 'F'],
  [10, 3, 'C7'],
  [13, 3, 'F'],
  [16, 3, 'Dm7'],
  [19, 3, 'Bb'],
  [22, 2, 'C7'],
  [24, 4, 'F'],
];

const VOICINGS = {
  F: [53, 57, 60, 65],
  C7: [52, 55, 58, 60],
  Dm7: [50, 53, 57, 60],
  Bb: [46, 50, 53, 58],
};

const LOOP_BEATS = 28;

/** Build a flat, time-sorted event list once at module load. */
function buildEvents() {
  const events = [];
  let beat = 0;

  MELODY.forEach((line, lineIndex) => {
    line.forEach(([midi, len]) => {
      if (midi !== null) {
        events.push({
          kind: 'bell',
          beat,
          midi,
          dur: Math.max(0.75, len * BEAT * 1.6),
          gain: lineIndex === 2 ? 0.2 : 0.17,
        });
      }
      beat += len;
    });
  });

  CHORDS.forEach(([start, len, name]) => {
    const notes = VOICINGS[name];
    // gentle pad
    events.push({ kind: 'pad', beat: start, midis: notes, dur: len * BEAT });
    // music-box arpeggio, one note per beat
    for (let b = 0; b < len; b += 1) {
      const note = notes[b % notes.length] + 12;
      events.push({
        kind: 'arp',
        beat: start + b,
        midi: note,
        dur: 1.1,
        gain: 0.055,
      });
    }
  });

  return events.sort((a, b) => a.beat - b.beat);
}

const EVENTS = buildEvents();

class MusicEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.noiseBuffer = null;
    this.timer = null;
    this.loopStart = 0;
    this.index = 0;
    this.intent = false;
    this.volume = 0.6;
    this.muted = false;
    this.unlocked = false;
  }

  get supported() {
    if (typeof window === 'undefined') return false;
    return Boolean(window.AudioContext || window.webkitAudioContext);
  }

  /* --- graph ------------------------------------------------------------- */

  ensureGraph() {
    if (!this.supported) return false;
    if (this.ctx) return true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx({ latencyHint: 'interactive' });
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 1;

      const musicBus = ctx.createGain();
      musicBus.gain.value = this.volume * 0.5;

      const sfxBus = ctx.createGain();
      sfxBus.gain.value = 0.85;

      // keep the mix soft and warm on tiny phone speakers
      const tone = ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = 6200;
      tone.Q.value = 0.4;

      musicBus.connect(tone);
      tone.connect(master);
      sfxBus.connect(master);
      master.connect(ctx.destination);

      this.master = master;
      this.musicBus = musicBus;
      this.sfxBus = sfxBus;

      // 1 second of white noise, reused by every noise-based effect
      const length = Math.floor(ctx.sampleRate * 1);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
      return true;
    } catch (error) {
      this.ctx = null;
      return false;
    }
  }

  /** Must be called from (or shortly after) a user gesture on iOS/Android. */
  async unlock() {
    if (!this.ensureGraph()) return false;
    try {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.unlocked = this.ctx.state === 'running';
      return this.unlocked;
    } catch (error) {
      return false;
    }
  }

  /* --- voices ------------------------------------------------------------ */

  bell(time, freq, dur, gain) {
    const ctx = this.ctx;
    if (!ctx) return;
    const out = this.musicBus;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(gain, time + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    env.connect(out);

    const partials = [
      { type: 'triangle', ratio: 1, level: 1 },
      { type: 'sine', ratio: 2.002, level: 0.34 },
      { type: 'sine', ratio: 3.01, level: 0.1 },
    ];

    partials.forEach((p) => {
      const osc = ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.value = freq * p.ratio;
      osc.detune.value = (Math.random() - 0.5) * 4;
      const g = ctx.createGain();
      g.gain.value = p.level;
      osc.connect(g);
      g.connect(env);
      osc.start(time);
      osc.stop(time + dur + 0.05);
    });
  }

  pad(time, midis, dur) {
    const ctx = this.ctx;
    if (!ctx) return;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1500;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(0.05, time + Math.min(0.9, dur * 0.4));
    env.gain.linearRampToValueAtTime(0.0001, time + dur + 0.6);
    filter.connect(env);
    env.connect(this.musicBus);

    midis.forEach((midi) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = midiToFreq(midi);
      osc.detune.value = -4;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      osc.connect(g);
      g.connect(filter);
      osc.start(time);
      osc.stop(time + dur + 0.7);
    });
  }

  scheduleEvent(ev, time) {
    try {
      if (ev.kind === 'bell' || ev.kind === 'arp') {
        this.bell(time, midiToFreq(ev.midi), ev.dur, ev.gain);
      } else if (ev.kind === 'pad') {
        this.pad(time, ev.midis, ev.dur);
      }
    } catch (error) {
      /* a single failed voice must never stop the loop */
    }
  }

  /* --- transport --------------------------------------------------------- */

  tick() {
    const ctx = this.ctx;
    if (!ctx) return;
    const lookahead = 0.4;
    const loopDur = LOOP_BEATS * BEAT;

    let guard = 0;
    while (guard < 400) {
      guard += 1;
      const ev = EVENTS[this.index];
      if (!ev) break;
      const when = this.loopStart + ev.beat * BEAT;
      if (when > ctx.currentTime + lookahead) break;
      this.scheduleEvent(ev, Math.max(when, ctx.currentTime + 0.01));
      this.index += 1;
    }

    if (this.index >= EVENTS.length && ctx.currentTime + lookahead > this.loopStart + loopDur) {
      this.loopStart += loopDur;
      this.index = 0;
    }
  }

  startLoop(fromBeat = 0) {
    if (!this.ctx) return;
    this.loopStart = this.ctx.currentTime - fromBeat * BEAT + 0.08;
    this.index = EVENTS.findIndex((ev) => ev.beat >= fromBeat);
    if (this.index < 0) {
      this.index = 0;
      this.loopStart += LOOP_BEATS * BEAT;
    }
    if (this.timer) clearInterval(this.timer);
    this.tick();
    this.timer = setInterval(() => this.tick(), 60);
  }

  async play() {
    this.intent = true;
    const ok = await this.unlock();
    if (!ok) {
      this.intent = false;
      return false;
    }
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setTargetAtTime(this.volume * 0.5, now, 0.25);
      const resumeAt = this.pausedBeat || 0;
      this.pausedBeat = 0;
      this.startLoop(resumeAt);
      return true;
    } catch (error) {
      this.intent = false;
      return false;
    }
  }

  pause() {
    this.intent = false;
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.pausedBeat = Math.max(0, (now - this.loopStart) / BEAT) % LOOP_BEATS;
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setTargetAtTime(0.0001, now, 0.08);
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    } catch (error) {
      /* noop */
    }
  }

  /** Used when the page is hidden; keeps the "playing" intent for later. */
  suspend() {
    if (!this.ctx || !this.timer) return;
    try {
      this.pausedBeat = Math.max(0, (this.ctx.currentTime - this.loopStart) / BEAT) % LOOP_BEATS;
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.ctx.suspend();
    } catch (error) {
      /* noop */
    }
  }

  async resumeIfNeeded() {
    if (!this.ctx || !this.intent) return;
    try {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      if (!this.timer) {
        const resumeAt = this.pausedBeat || 0;
        this.pausedBeat = 0;
        this.startLoop(resumeAt);
      }
    } catch (error) {
      /* noop */
    }
  }

  setVolume(value) {
    this.volume = Math.min(1, Math.max(0, value));
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setTargetAtTime(this.intent ? this.volume * 0.5 : 0.0001, now, 0.06);
    } catch (error) {
      /* noop */
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(muted ? 0 : 1, now, 0.05);
    } catch (error) {
      /* noop */
    }
  }

  /* --- sound effects ----------------------------------------------------- */

  noiseSource() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    return src;
  }

  sfx(name) {
    if (!this.ctx || this.muted) return;
    try {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') return;
      const t = ctx.currentTime + 0.005;

      if (name === 'pop') {
        const src = this.noiseSource();
        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.Q.value = 1.1;
        band.frequency.setValueAtTime(1500, t);
        band.frequency.exponentialRampToValueAtTime(420, t + 0.12);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.5, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        src.connect(band);
        band.connect(env);
        env.connect(this.sfxBus);
        src.start(t);
        src.stop(t + 0.2);

        const body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(760, t);
        body.frequency.exponentialRampToValueAtTime(190, t + 0.13);
        const bg = ctx.createGain();
        bg.gain.setValueAtTime(0.22, t);
        bg.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        body.connect(bg);
        bg.connect(this.sfxBus);
        body.start(t);
        body.stop(t + 0.18);
      }

      if (name === 'blow') {
        const src = this.noiseSource();
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 320;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(1600, t);
        lp.frequency.exponentialRampToValueAtTime(500, t + 0.3);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(0.3, t + 0.05);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        src.connect(hp);
        hp.connect(lp);
        lp.connect(env);
        env.connect(this.sfxBus);
        src.start(t);
        src.stop(t + 0.36);
      }

      if (name === 'chime') {
        [84, 88, 91, 96].forEach((midi, i) => {
          const when = t + i * 0.075;
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = midiToFreq(midi);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, when);
          g.gain.exponentialRampToValueAtTime(0.15, when + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
          osc.connect(g);
          g.connect(this.sfxBus);
          osc.start(when);
          osc.stop(when + 1.5);
        });
      }

      if (name === 'whoosh') {
        const src = this.noiseSource();
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(260, t);
        lp.frequency.exponentialRampToValueAtTime(3400, t + 0.45);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(0.16, t + 0.18);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        src.connect(lp);
        lp.connect(env);
        env.connect(this.sfxBus);
        src.start(t);
        src.stop(t + 0.62);
      }
    } catch (error) {
      /* sound is a bonus, never a requirement */
    }
  }
}

export const musicEngine = new MusicEngine();
