// WebAudio synth SFX — no audio assets needed. iOS unlocks audio on the first
// user gesture, so the context is created lazily on demand.

let ctx = null;

function ensureCtx() {
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(fromHz, toHz, seconds, volume = 0.25, type = 'sine', delay = 0) {
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(fromHz, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(toHz, 1), t0 + seconds);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + seconds * 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.02);
}

export const audio = {
  correct() { tone(660, 880, 0.18); },
  wrong() { tone(220, 170, 0.28, 0.22, 'square'); },
  coin() { tone(990, 1320, 0.1, 0.2); tone(1320, 1320, 0.08, 0.15, 'sine', 0.09); },
  levelUp() { tone(523, 784, 0.18); tone(659, 988, 0.18, 0.25, 'sine', 0.15); tone(784, 1568, 0.3, 0.25, 'sine', 0.3); },
  click() { tone(440, 440, 0.05, 0.12); },
  beat() { tone(196, 196, 0.06, 0.08, 'triangle'); },
};
