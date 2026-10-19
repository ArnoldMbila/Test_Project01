// YIN-Tonhöhenerkennung (de Cheveigné & Kawahara 2002) – reine Funktion,
// läuft im Browser (Mikrofon, Song-Analyse) und in Node (Tests).

/**
 * @param {Float32Array} buf  Zeitsignal (mono)
 * @param {number} sr         Samplerate
 * @param {object} [o]        { fmin, fmax, threshold, minRms }
 * @returns {{hz:number, clarity:number, rms:number}}  hz = 0 → stimmlos/leise
 */
export function yin(buf, sr, o = {}) {
  const fmin = o.fmin || 60, fmax = o.fmax || 1100;
  const threshold = o.threshold || 0.15, minRms = o.minRms ?? 0.01;
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < minRms) return { hz: 0, clarity: 0, rms };

  const tauMin = Math.max(2, Math.floor(sr / fmax));
  const tauMax = Math.min(Math.floor(sr / fmin), Math.floor(buf.length / 2));
  const W = buf.length - tauMax;
  const d = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let s = 0;
    for (let i = 0; i < W; i++) {
      const x = buf[i] - buf[i + tau];
      s += x * x;
    }
    d[tau] = s;
  }
  // kumulative mittlere normierte Differenz
  d[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    run += d[tau];
    d[tau] = run ? (d[tau] * tau) / run : 1;
  }
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) {
    if (d[t] < threshold) {
      while (t + 1 <= tauMax && d[t + 1] < d[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) {
    // kein Wert unter der Schwelle → globales Minimum, aber nur bei guter Klarheit
    let best = tauMin;
    for (let t = tauMin; t <= tauMax; t++) if (d[t] < d[best]) best = t;
    if (d[best] > 0.3) return { hz: 0, clarity: 1 - d[best], rms };
    tau = best;
  }
  // parabolische Interpolation
  let better = tau;
  if (tau > 1 && tau < tauMax) {
    const a = d[tau - 1], b = d[tau], c = d[tau + 1];
    const den = a + c - 2 * b;
    if (den) better = tau + (a - c) / (2 * den);
  }
  return { hz: sr / better, clarity: 1 - d[tau], rms };
}
