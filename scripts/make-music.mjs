// Genera la música y los efectos del video (18 s, 120 BPM) sintetizados desde cero.
// Todo el audio es original y va con la misma licencia MIT del proyecto.
// Uso: node scripts/make-music.mjs  ->  assets/music.wav (luego se convierte a mp3 con ffmpeg)
import { writeFileSync, mkdirSync } from 'node:fs';

const SR = 44100, DUR = 18, N = SR * DUR, BEAT = 0.5;
const L = new Float32Array(N), R = new Float32Array(N);
const send = new Float32Array(N); // envío a la reverb
let seed = 1;
const noise = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const add = (i, v, pan = 0, rev = 0) => {
  if (i < 0 || i >= N) return;
  L[i] += v * (1 - Math.max(0, pan)); R[i] += v * (1 + Math.min(0, pan)); send[i] += v * rev;
};
const lpA = fc => 1 - Math.exp(-2 * Math.PI * fc / SR);

// Acordes: Am F C G (un compás = 2 s)
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const ROOTS = [45, 41, 48, 43];
const chordAt = t => Math.floor(t / 2) % 4;

// Ducking por bombo (sidechain)
const kicks = [];
for (let t = 1.5; t < 16.01; t += BEAT) if (!(t >= 8.3 && t < 9.8)) kicks.push(t);
const duck = t => { let d = 1; for (const k of kicks) { const x = t - k; if (x >= 0 && x < 0.4) d = Math.min(d, 1 - 0.55 * Math.exp(-x * 9)); } return d; };

// --- Pad: 3 notas × 2 sierras desafinadas, filtradas ------------------------
{
  const ph = new Float64Array(6); let y = 0; const a = lpA(1100);
  for (let i = 0; i < N; i++) {
    const t = i / SR, c = CHORDS[chordAt(t)];
    let s = 0;
    for (let k = 0; k < 6; k++) {
      const f = hz(c[k >> 1]) * (k & 1 ? 1.004 : 0.996);
      ph[k] = (ph[k] + f / SR) % 1; s += ph[k] * 2 - 1;
    }
    y += a * (s - y);
    const env = Math.min(1, t / 1.2) * (t > 16.5 ? Math.max(0, 1 - (t - 16.5) / 1.5) : 1);
    const v = y * 0.045 * env * duck(t);
    add(i, v, 0, 0.35);
  }
}

// --- Bombo -------------------------------------------------------------------
for (const k of kicks) {
  let ph = 0; const i0 = Math.round(k * SR);
  for (let n = 0; n < SR * 0.35; n++) {
    const t = n / SR, f = 45 + 110 * Math.exp(-t * 32);
    ph += 2 * Math.PI * f / SR;
    add(i0 + n, Math.sin(ph) * Math.exp(-t * 9) * 0.85);
  }
}

// --- Hi-hat en contratiempo --------------------------------------------------
for (let t = 3.2 + BEAT / 2; t < 16; t += BEAT) {
  if (t >= 8.3 && t < 9.8) continue;
  const i0 = Math.round(t * SR); let prev = 0;
  for (let n = 0; n < SR * 0.06; n++) { const x = noise(); add(i0 + n, (x - prev) * Math.exp(-n / SR * 70) * 0.09, 0.25); prev = x; }
}

// --- Palma en 2 y 4 ----------------------------------------------------------
for (let t = 4.9 + BEAT; t < 16; t += BEAT * 2) {
  if (t >= 8.3 && t < 9.8) continue;
  const i0 = Math.round(t * SR); let y = 0; const a = lpA(2500);
  for (let n = 0; n < SR * 0.2; n++) {
    const tt = n / SR, burst = tt < 0.03 ? (Math.floor(tt / 0.01) % 2 ? 0.6 : 1) : 1;
    y += a * (noise() - y);
    add(i0 + n, y * Math.exp(-tt * 20) * 0.35 * burst, -0.1, 0.4);
  }
}

// --- Bajo en corcheas --------------------------------------------------------
{
  let ph = 0, y = 0;
  for (let i = Math.round(1.5 * SR); i < Math.round(16.2 * SR); i++) {
    const t = i / SR;
    if (t >= 8.3 && t < 9.8) { y *= 0.999; continue; }
    const step = (t % 0.25) / 0.25, f = hz(ROOTS[chordAt(t)] - 12 + (Math.floor(t / 0.25) % 4 === 3 ? 12 : 0));
    ph = (ph + f / SR) % 1;
    const fc = 180 + 900 * Math.exp(-step * 5);
    y += lpA(fc) * ((ph * 2 - 1) - y);
    add(i, y * 0.28 * Math.min(1, step * 40) * (1 - step * 0.4) * duck(t));
  }
}

// --- Arpegio en semicorcheas (parte central) ---------------------------------
{
  let k = 0;
  for (let t = 6.6; t < 14; t += 0.125, k++) {
    if (t >= 8.3 && t < 9.8) continue;
    const c = CHORDS[chordAt(t)], m = c[k % 3] + 12 * (1 + (k % 6 >= 3 ? 1 : 0));
    const f = hz(m), i0 = Math.round(t * SR);
    for (let n = 0; n < SR * 0.25; n++) {
      const tt = n / SR, p = 2 * Math.PI * f * tt;
      add(i0 + n, (Math.sin(p) + 0.3 * Math.sin(2 * p)) * Math.exp(-tt * 14) * 0.055, k % 2 ? 0.4 : -0.4, 0.5);
    }
  }
}

// --- Subida (riser) durante el zoom 8.3–9.8 s --------------------------------
{
  let y = 0, ph = 0;
  for (let i = Math.round(8.3 * SR); i < Math.round(9.8 * SR); i++) {
    const t = i / SR, k = (t - 8.3) / 1.5;
    y += lpA(300 + 7000 * k * k) * (noise() - y);
    ph += 2 * Math.PI * (220 + 660 * k * k) / SR;
    add(i, (y * 0.35 + Math.sin(ph) * 0.06) * k * k, 0, 0.3);
  }
}

// --- Impacto en 9.8 s ("Este fue tu ritmo") ----------------------------------
{
  const i0 = Math.round(9.8 * SR); let ph = 0, y = 0; const a = lpA(1800);
  for (let n = 0; n < SR * 1.6; n++) {
    const t = n / SR; ph += 2 * Math.PI * (40 + 80 * Math.exp(-t * 20)) / SR;
    y += a * (noise() - y);
    add(i0 + n, Math.sin(ph) * Math.exp(-t * 4) * 0.8 + y * Math.exp(-t * 3) * 0.25, 0, 0.6);
  }
}

// --- Whooshes en los cambios de escena ---------------------------------------
for (const tc of [1.5, 3.2, 4.9, 6.6, 11.2, 12.5, 14.0]) {
  const i0 = Math.round((tc - 0.22) * SR); let y = 0, y2 = 0;
  for (let n = 0; n < SR * 0.45; n++) {
    const t = n / SR, k = t / 0.45, env = Math.sin(Math.PI * k) ** 2;
    const fc = 600 + 3500 * Math.sin(Math.PI * k);
    y += lpA(fc) * (noise() - y); y2 += lpA(fc * 0.4) * (y - y2);
    add(i0 + n, (y - y2) * env * 0.22, (k - 0.5) * 0.8);
  }
}

// --- Teclas en la búsqueda (5.05–5.75 s) -------------------------------------
for (let j = 0; j < 10; j++) {
  const i0 = Math.round((5.05 + j * 0.07 + (j % 3) * 0.006) * SR); let prev = 0;
  for (let n = 0; n < SR * 0.012; n++) { const x = noise(); add(i0 + n, (x - prev) * Math.exp(-n / SR * 400) * 0.18, 0.15); prev = x; }
}

// --- Brillo final en 15.2 s --------------------------------------------------
for (const [m, g] of [[76, 1], [81, 0.8], [84, 0.6], [88, 0.4]]) {
  const f = hz(m), i0 = Math.round(15.2 * SR);
  for (let n = 0; n < SR * 2.6; n++) { const t = n / SR; add(i0 + n, Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 1.6) * 0.035 * g * Math.min(1, t * 60), 0, 0.7); }
}

// --- Reverb sencilla (combs + allpass) ---------------------------------------
{
  const combs = [0.0297, 0.0371, 0.0411, 0.0437].map(d => ({ buf: new Float32Array(Math.round(d * SR)), i: 0 }));
  const ap = { buf: new Float32Array(Math.round(0.005 * SR)), i: 0 };
  for (let n = 0; n < N; n++) {
    let s = 0;
    for (const c of combs) { const o = c.buf[c.i]; c.buf[c.i] = send[n] + o * 0.82; c.i = (c.i + 1) % c.buf.length; s += o; }
    const o = ap.buf[ap.i], v = -s * 0.5 + o; ap.buf[ap.i] = s + o * 0.5; ap.i = (ap.i + 1) % ap.buf.length;
    L[n] += v * 0.18; R[n] += (n > 300 ? v : 0) * 0.18;
  }
}

// --- Master: salida suave, normalizado ---------------------------------------
let peak = 0;
for (let n = 0; n < N; n++) {
  const t = n / SR, fade = t > 16.8 ? Math.max(0, 1 - (t - 16.8) / 1.2) : 1;
  L[n] = Math.tanh(L[n] * 1.2) * fade; R[n] = Math.tanh(R[n] * 1.2) * fade;
  peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
}
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
const g = 0.89 / peak;
for (let n = 0; n < N; n++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[n] * g)) * 32767), 46 + n * 4);
}
mkdirSync(new URL('../assets/', import.meta.url), { recursive: true });
writeFileSync(new URL('../assets/music.wav', import.meta.url), buf);
console.log('assets/music.wav listo');
