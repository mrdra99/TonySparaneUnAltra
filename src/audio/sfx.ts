// OWNER: UI/UX
/**
 * Effetti sonori ORIGINALI sintetizzati con WebAudio: nessun file esterno, nessuna licenza da gestire.
 *  - sicura in jsdom / senza AudioContext (tutto no-op, nessuna eccezione)
 *  - l'AudioContext nasce al primo gesto utente (autoplay policy), mai prima
 *  - rispetta volume e mute impostati con applyAudioSettings
 * Lo store chiama `playSfx` (eventi di gioco) e `applyAudioSettings` (a ogni cambio impostazioni);
 * la UI chiama `playSfx('menuSelect')` sui pulsanti e `playSfx('blip')` nel typewriter.
 */
export type SfxName =
  | 'menuSelect'
  | 'dialogueStart'
  | 'missionComplete'
  | 'achievement'
  | 'cazzateUp'
  | 'finale'
  | 'blip';

export interface AudioSettings {
  /** 0..1 */
  volume: number;
  muted: boolean;
}

interface WebkitGlobal {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

type OscType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface ToneOptions {
  type?: OscType;
  /** Guadagno di picco (0..1) prima del master. */
  gain?: number;
  /** Frequenza finale (glissando). */
  slideTo?: number;
  /** Attacco in secondi. */
  attack?: number;
  /** Vibrato: profondita' in Hz e velocita' in Hz. */
  vibrato?: { depth: number; rate: number };
  /** Frequenza di taglio di un passa-basso (timbro "ottone"). */
  lowpass?: number;
}

const BLIP_MIN_INTERVAL_MS = 38;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let settings: AudioSettings = { volume: 0.7, muted: false };
let gestureSeen = false;
let unlockAttached = false;
let lastBlipAt = -Infinity;

function effectiveGain(): number {
  if (settings.muted) return 0;
  const v = Math.min(1, Math.max(0, Number.isFinite(settings.volume) ? settings.volume : 0));
  // curva quadratica: il volume percepito scende in modo piu' naturale
  return v * v * 0.9;
}

function audioConstructor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as WebkitGlobal;
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function applyMasterGain(): void {
  if (!ctx || !master) return;
  try {
    master.gain.setTargetAtTime(effectiveGain(), ctx.currentTime, 0.015);
  } catch {
    /* contesto chiuso: ignora */
  }
}

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = audioConstructor();
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = effectiveGain();
    master.connect(ctx.destination);
  } catch {
    ctx = null;
    master = null;
  }
  return ctx;
}

function onGesture(): void {
  gestureSeen = true;
  const c = ensureContext();
  if (c && c.state === 'suspended') void c.resume().catch(() => undefined);
}

function attachUnlock(): void {
  if (unlockAttached || typeof window === 'undefined') return;
  unlockAttached = true;
  for (const type of ['pointerdown', 'keydown', 'touchend'] as const) {
    window.addEventListener(type, onGesture, { capture: true, passive: true });
  }
}

function getNoise(c: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === c.sampleRate) return noiseBuffer;
  const length = Math.floor(c.sampleRate * 0.5);
  const buf = c.createBuffer(1, length, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buf;
  return buf;
}

/** Una nota con inviluppo percussivo. `t0` e' in secondi sul clock del contesto. */
function tone(
  c: AudioContext,
  out: AudioNode,
  t0: number,
  freq: number,
  dur: number,
  o: ToneOptions = {},
): void {
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = o.type ?? 'square';
  osc.frequency.setValueAtTime(freq, t0);
  if (o.slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.slideTo), t0 + dur);
  }
  const peak = o.gain ?? 0.2;
  const attack = Math.min(o.attack ?? 0.006, dur / 2);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.linearRampToValueAtTime(peak, t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  let node: AudioNode = osc;
  if (o.lowpass) {
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(o.lowpass, t0);
    node.connect(lp);
    node = lp;
  }
  node.connect(env);
  env.connect(out);

  if (o.vibrato) {
    const lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = o.vibrato.rate;
    depth.gain.value = o.vibrato.depth;
    lfo.connect(depth);
    depth.connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.05);
  }
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(
  c: AudioContext,
  out: AudioNode,
  t0: number,
  dur: number,
  gain: number,
  freq: number,
): void {
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(freq, t0);
  bp.Q.value = 0.9;
  const env = c.createGain();
  env.gain.setValueAtTime(gain, t0);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp);
  bp.connect(env);
  env.connect(out);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

// Frequenze (Hz) di comodo.
const N = {
  g3: 196,
  g4: 392,
  c5: 523.25,
  e5: 659.25,
  g5: 783.99,
  c6: 1046.5,
  e6: 1318.5,
} as const;

type Recipe = (c: AudioContext, out: AudioNode, t: number) => void;

const RECIPES: Readonly<Record<Exclude<SfxName, 'blip'>, Recipe>> = {
  // click "a fumetto": due colpetti saliti
  menuSelect: (c, out, t) => {
    tone(c, out, t, 520, 0.07, { type: 'triangle', gain: 0.22, slideTo: 640 });
    tone(c, out, t + 0.055, 780, 0.09, { type: 'triangle', gain: 0.2 });
  },
  // "pop" di balloon che si apre
  dialogueStart: (c, out, t) => {
    tone(c, out, t, 280, 0.11, { type: 'sine', gain: 0.3, slideTo: 620 });
    tone(c, out, t + 0.09, 500, 0.12, { type: 'triangle', gain: 0.14, slideTo: 760 });
    noise(c, out, t, 0.04, 0.05, 2400);
  },
  // jingle breve in Do maggiore
  missionComplete: (c, out, t) => {
    const seq: readonly (readonly [number, number])[] = [
      [N.c5, 0.09],
      [N.e5, 0.09],
      [N.g5, 0.09],
      [N.c6, 0.34],
    ];
    let at = t;
    for (const [f, d] of seq) {
      tone(c, out, at, f, d + 0.04, { type: 'square', gain: 0.13 });
      tone(c, out, at, f / 2, d + 0.04, { type: 'triangle', gain: 0.18 });
      at += d;
    }
    tone(c, out, at - 0.1, N.e6, 0.3, { type: 'sine', gain: 0.1 });
  },
  // campanellina con scintilla
  achievement: (c, out, t) => {
    tone(c, out, t, 988, 0.5, { type: 'sine', gain: 0.22 });
    tone(c, out, t + 0.08, 1319, 0.6, { type: 'sine', gain: 0.2 });
    tone(c, out, t + 0.16, 1760, 0.7, { type: 'triangle', gain: 0.1 });
    noise(c, out, t + 0.16, 0.1, 0.04, 7000);
  },
  // fischio a scivolo + "boing" (l'assurdita' sale)
  cazzateUp: (c, out, t) => {
    tone(c, out, t, 380, 0.22, { type: 'sawtooth', gain: 0.08, slideTo: 980, lowpass: 2200 });
    tone(c, out, t + 0.2, 300, 0.14, { type: 'sine', gain: 0.2, slideTo: 150 });
  },
  // "ta-daaa" + trombetta comica che scivola giu'
  finale: (c, out, t) => {
    const brass = { type: 'sawtooth', lowpass: 1800 } as const;
    tone(c, out, t, N.g4, 0.12, { ...brass, gain: 0.14 });
    tone(c, out, t + 0.12, N.c5, 0.12, { ...brass, gain: 0.14 });
    tone(c, out, t + 0.24, N.e5, 0.12, { ...brass, gain: 0.14 });
    tone(c, out, t + 0.36, N.g5, 0.7, { ...brass, gain: 0.17, vibrato: { depth: 7, rate: 6 } });
    tone(c, out, t + 0.36, N.c5, 0.7, { type: 'triangle', gain: 0.14 });
    noise(c, out, t + 0.36, 0.25, 0.08, 5000);
    // wah-wah-waaah
    const wah: readonly (readonly [number, number, number])[] = [
      [1.15, N.g3 * 1.5, 0.16],
      [1.33, N.g3 * 1.3, 0.16],
      [1.51, N.g3, 0.6],
    ];
    for (const [at, f, d] of wah) {
      tone(c, out, t + at, f, d, {
        ...brass,
        gain: 0.16,
        slideTo: f * (d > 0.3 ? 0.62 : 0.9),
        lowpass: 1100,
      });
    }
  },
};

/** Riproduce uno sfx. No-op senza WebAudio, in muto, o prima del primo gesto utente. */
export function playSfx(name: SfxName): void {
  try {
    if (settings.muted || settings.volume <= 0) return;
    attachUnlock();
    if (name === 'blip') {
      const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (nowMs - lastBlipAt < BLIP_MIN_INTERVAL_MS) return;
      lastBlipAt = nowMs;
    }
    if (!gestureSeen) return;
    const c = ensureContext();
    if (!c || !master) return;
    const out = master;
    const run = (): void => {
      const t = c.currentTime + 0.01;
      if (name === 'blip') {
        // molto basso e leggermente casuale: voce da "balloon"
        const f = 560 + Math.random() * 220;
        tone(c, out, t, f, 0.028, { type: 'triangle', gain: 0.035, attack: 0.002 });
        return;
      }
      RECIPES[name](c, out, t);
    };
    if (c.state === 'running') run();
    else if (c.state === 'suspended') void c.resume().then(run, () => undefined);
  } catch {
    /* l'audio non deve mai rompere il gioco */
  }
}

/** Volume (0..1) e mute. Chiamata dallo store a ogni cambio impostazioni (e alla creazione). */
export function applyAudioSettings(next: AudioSettings): void {
  settings = { volume: next.volume, muted: next.muted };
  attachUnlock();
  applyMasterGain();
}

/** Solo per i test: riporta il modulo allo stato iniziale. */
export function resetAudioForTests(): void {
  if (ctx && typeof ctx.close === 'function') void ctx.close().catch(() => undefined);
  ctx = null;
  master = null;
  noiseBuffer = null;
  gestureSeen = false;
  lastBlipAt = -Infinity;
  settings = { volume: 0.7, muted: false };
}
