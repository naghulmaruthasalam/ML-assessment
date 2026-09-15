'use client';

/**
 * Tiny synthesized SFX for the gateway.
 *
 * No audio files — every sound here is built from Web Audio oscillators and
 * noise buffers, so it ships as code rather than an asset and stays true to
 * the page's own claim that nothing is fetched from anywhere. The
 * AudioContext is created lazily, because browsers refuse to start one
 * before a user gesture; clicking EXECUTE SEQUENCE is that gesture.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;

  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;

  ctx = new Ctor();
  return ctx;
}

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  /** If set, the pitch slides linearly to this frequency over the duration. */
  slideTo?: number;
  /** Delay, in seconds, before this tone starts — for stacking layers/notes. */
  delay?: number;
}

function tone(freq: number, duration: number, opts: ToneOpts = {}) {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === 'suspended') audio.resume().catch(() => {});

  const start = audio.currentTime + (opts.delay ?? 0);
  const osc = audio.createOscillator();
  const gainNode = audio.createGain();

  osc.type = opts.type ?? 'square';
  osc.frequency.setValueAtTime(freq, start);
  if (opts.slideTo !== undefined) {
    osc.frequency.linearRampToValueAtTime(opts.slideTo, start + duration);
  }

  // A hard-edged attack with an exponential tail reads as a blip rather
  // than a click, and avoids a pop at the very start of the ramp.
  const peak = opts.gain ?? 0.1;
  gainNode.gain.setValueAtTime(0, start);
  gainNode.gain.linearRampToValueAtTime(peak, start + 0.008);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gainNode);
  gainNode.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

interface NoiseOpts {
  /** Bandpass centre frequency — where in the spectrum the "grit" sits. */
  freq?: number;
  q?: number;
  gain?: number;
  delay?: number;
}

/**
 * A short burst of decaying, filtered white noise — the mechanical rattle
 * an oscillator alone can't produce. Layered under a tone, this is what
 * turns a clean beep into something with an engine's texture.
 */
function noiseBurst(duration: number, opts: NoiseOpts = {}) {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === 'suspended') audio.resume().catch(() => {});

  const start = audio.currentTime + (opts.delay ?? 0);
  const length = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    // Linear decay envelope baked into the samples themselves, so the burst
    // reads as a single "pop" rather than a sustained hiss.
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }

  const src = audio.createBufferSource();
  src.buffer = buffer;

  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = opts.freq ?? 900;
  filter.Q.value = opts.q ?? 1.1;

  const gainNode = audio.createGain();
  gainNode.gain.setValueAtTime(opts.gain ?? 0.09, start);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  src.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audio.destination);
  src.start(start);
}

/**
 * One step of forward motion — a two-stroke "put".
 *
 * A real scooter's stroke is a low thump plus a gritty mechanical pop, not
 * a clean sine sweep. The low square oscillator gives the thump; the
 * filtered noise burst on top gives the grit. Together they read as an
 * engine rather than a game blip.
 */
export function playMove() {
  tone(135, 0.1, { type: 'square', gain: 0.1, slideTo: 85 });
  noiseBurst(0.05, { freq: 1300, q: 0.9, gain: 0.055 });
}

/** Off the road — a descending buzz, distinct from every other sound here. */
export function playCrash() {
  tone(180, 0.32, { type: 'sawtooth', gain: 0.16, slideTo: 55 });
  // A second, slightly delayed layer thickens the buzz into something that
  // reads as "failure" rather than just another blip.
  tone(90, 0.28, { type: 'sawtooth', gain: 0.12, slideTo: 40, delay: 0.07 });
}

/**
 * The flag, reached — a short four-note major fanfare.
 *
 * Rising pitch and a brighter triangle wave read as triumphant without
 * needing anything more elaborate; the pass only asks for one of these.
 */
export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    tone(freq, 0.26, { type: 'triangle', gain: 0.12, delay: i * 0.1 });
  });
}
