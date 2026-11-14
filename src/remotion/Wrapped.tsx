import React, { CSSProperties, useMemo } from 'react';
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { measureText } from '@remotion/layout-utils';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { fmt, strings } from './strings';

const WORDMARK = 'git wrapped';
import type { Props } from './types';

const inter = loadInter('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin', 'latin-ext'] }).fontFamily;
const mono = loadMono('normal', { weights: ['400', '500'], subsets: ['latin', 'latin-ext'] }).fontFamily;

// --- curvas: suaves, sin rebote -------------------------------------------
const cl = (x: number) => Math.max(0, Math.min(1, x));
const io = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const ei = (x: number) => x * x * x;
const up = (t: number, a: number, b: number, f = io) => f(cl((t - a) / (b - a)));
const lin = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const L = (a: number, b: number, k: number) => a + (b - a) * k;
const win = (t: number, a: number, b: number, c: number, d: number) => up(t, a, b) * (1 - up(t, c, d));

type Tr = { x?: number; y?: number; s?: number; o?: number; r?: number; blur?: number };
const S = ({ x = 0, y = 0, s = 1, o = 1, r = 0, blur = 0 }: Tr): CSSProperties => ({
  opacity: o,
  display: o <= 0.001 ? 'none' : undefined,
  transform: `translate(-50%,-50%) translate(${x}px,${y}px) scale(${s}) rotate(${r}deg)`,
  filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
});

export const LEVELS = ['#1c1c25', '#3B2F7A', '#5B47C9', '#8473F5', '#B9AEFF'];
const COVERS = ['cv1', 'cv2', 'cv3', 'cv4', 'cv5'];
const MOOD_COVERS = ['cv5', 'cv4', 'cv2', 'cv3', 'cv1'];

export function demoGraph() {
  let sd = 7;
  const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
  const g: number[] = [];
  for (let c = 0; c < 52; c++) for (let row = 0; row < 7; row++) {
    const wk = row === 0 || row === 6 ? 0.45 : 1, tr = 0.35 + c / 80;
    const x = rnd() * wk * tr * 1.4;
    let i = x < 0.25 ? 0 : x < 0.5 ? 1 : x < 0.75 ? 2 : x < 1 ? 3 : 4;
    if (c >= 16 && c <= 22 && row > 0 && row < 6) i = Math.max(i, 3);
    g.push(i);
  }
  return g;
}

const shortPath = (p: string) => {
  if (p.length <= 24) return p;
  const parts = p.split('/');
  const tail = parts.slice(-2).join('/');
  return tail.length <= 26 ? `…/${tail}` : `…/${parts[parts.length - 1]}`.slice(0, 27);
};
const fit = (text: string, width: number, max: number, k = 0.56) => Math.min(max, width / (Math.max(1, text.length) * k));

export const Wrapped: React.FC<Props> = ({ data, music, motionBlur }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: '#050507' }}>
      {/* desenfoque de movimiento: 4 subfotogramas, obturador de 180° */}
      {motionBlur ? <CameraMotionBlur samples={4} shutterAngle={180}><Scene data={data} /></CameraMotionBlur> : <Scene data={data} />}
      {music ? <Audio src={staticFile(music)} volume={f => interpolate(f, [fps * 16.8, fps * 18], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} /> : null}
    </AbsoluteFill>
  );
};

const Scene: React.FC<{ data: Props['data'] }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const s = strings(data.lang);
  // Vertical (9:16): mismo guion, con tamaños y posiciones adaptados al escenario alto
  const V = height > width;
  const HW = (width - 128) / 2, HH = (height - 128) / 2;
  const gs = V ? 0.62 : 1; // escala de la gráfica
  const big = V ? 124 : 150;
  const graph = useMemo(() => (data.graph?.length === 364 ? data.graph : demoGraph()), [data.graph]);
  const maxDay = Math.max(1, ...data.weekdays);
  const langMax = Math.max(1, ...data.languages.map(l => l.pct));

  // A · intro --------------------------------------------------------------
  const kL = up(t, 0.55, 0.95);
  const logo = S({ x: L(0, -HW + 80, kL), y: L(0, -HH + 80, kL), s: t < 0.55 ? L(0, 1, up(t, 0, 0.5)) : L(1, 0.42, kL), o: (t < 0.02 ? 0 : 1) * (1 - up(t, 13.7, 14)) });
  // B · ventana
  const bIn = up(t, 1.5, 2.05), bZ = up(t, 2.45, 3.1), bOut = up(t, 3.15, 3.45);
  // D · búsqueda
  const q = data.star.name, nTyped = Math.floor(lin(t, 5.05, 5.75) * q.length + 1e-4);
  const sOut = up(t, 6.1, 6.3);
  // E · portada
  const rs = V ? 0.9 : 1; // escala de búsqueda y resultado
  let hx = L(-395 * rs, 0, up(t, 6.1, 6.6)), hy = L(10, 0, up(t, 6.1, 6.6)), hs = L((80 * rs) / 420, 1, up(t, 6.1, 6.6));
  const kS = up(t, 6.6, 7.1); hx = L(hx, V ? 0 : -500, kS); hy = L(hy, V ? -330 : -40, kS);
  const kM = up(t, 7.8, 8.3); hx = L(hx, 14 * gs, kM); hy = L(hy, 0, kM); hs = L(hs, (22 * gs) / 420, kM);
  const ho = up(t, 5.85, 6.05) * (1 - up(t, 8.15, 8.3));
  // F · zoom
  const kZ = up(t, 8.4, 9.75, ei);
  // H
  const hOut = up(t, 12.25, 12.45);
  // I/J
  const kC = up(t, 14, 14.6, ei);
  // K
  const kG = up(t, 14.45, 15), kK = up(t, 15.2, 15.7);
  // cierre: logo + nombre centrados como un solo bloque, mida lo que mida el texto
  const wordW = measureText({ text: WORDMARK, fontFamily: inter, fontSize: 116, fontWeight: '800', letterSpacing: '-4px' }).width;
  const blockW = 150 + 40 + wordW;
  const logoEndX = -blockW / 2 + 75, wordX = -blockW / 2 + 190 + wordW / 2;
  // terminal
  const tp = lin(t, 1.9, 12.5);
  const li = Math.min(data.log.length - 1, Math.floor(lin(t, 2, 12.2) * data.log.length));
  const line = data.log[Math.max(0, li)] ?? { hash: '0000000', msg: '' };
  const total = data.totals.commits;

  const c = data.cards;
  const pos = V ? [[-170, -540, -4], [170, -200, 3], [-170, 140, -2], [170, 480, 4]] : [[-430, -175, -4], [400, -205, 3], [-380, 195, -2], [430, 175, 4]];
  const cs = V ? 0.85 : 1;
  const cards: [number, number, number, React.ReactNode][] = [
    [-430, -175, -4, <><div className="k">{s.fileK}</div><div className="m" style={{ fontSize: 30, color: '#fff' }}>{shortPath(c.file.path)}</div><span className="chip">{s.changes(c.file.count)}</span></>],
    [400, -205, 3, <><div className="k">{s.peakK}</div><div className="v">{s.hour(c.peak.hour)}</div><span className="chip">{s.peakMood(c.peak.hour)}</span></>],
    [-380, 195, -2, <><div className="k">{s.biggestK}</div><div className="v"><span style={{ color: 'var(--acc2)' }}>+{c.biggest.add.toLocaleString('en-US')}</span> <span style={{ color: '#FF7A9A' }}>−{c.biggest.del.toLocaleString('en-US')}</span></div><div className="m">{c.biggest.subject.length > 34 ? c.biggest.subject.slice(0, 33) + '…' : c.biggest.subject}</div></>],
    [430, 175, 4, <><div className="k">{s.bestDayK}</div><div className="v">{s.date(c.bestDay.date)}</div><span className="chip">{c.bestDay.count} {s.commits}</span></>],
  ];

  const ttl = data.reposLabel === 'folders' ? s.foldersTitle(data.year) : s.reposTitle(data.year);

  return (
    <AbsoluteFill style={{ fontFamily: inter, color: '#fff', background: '#050507' }}>
      <style>{css(mono)}</style>
      <div className="bg" />
      <div className="stage">
        {/* A */}
        <div className="el" style={S({ y: L(-50, -80, up(t, 0.7, 1.05)), o: win(t, 0.7, 1, 1.25, 1.45) })}><h1 className="big" style={{ fontSize: big }}>{s.intro1(data.year)}</h1></div>
        <div className="el" style={S({ y: L(110, 80, up(t, 0.85, 1.2)), o: win(t, 0.85, 1.15, 1.3, 1.5) })}><h1 className="big acc" style={{ fontSize: big }}>{s.intro2}</h1></div>

        {/* B */}
        <div className="el" style={S({ y: L(V ? 1150 : 720, 0, bIn) - L(0, V ? 0 : 55, bZ), s: (V ? 0.7 : 1) * L(1, 1.12, bZ) * L(1, 0.88, bOut), o: bIn * (1 - bOut) })}>
          <div className="win">
            <div className="bar"><i /><i /><i /></div>
            <div className="ttl"><span style={{ opacity: 1 - up(t, 2.3, 2.5) }}>{s.madeForYou}</span><span style={{ opacity: up(t, 2.4, 2.6) }}>{ttl}</span></div>
            <div className="repos">
              {data.repos.map((r, i) => (
                <div className="repo" key={i}><div className={`cv ${COVERS[r.cover % 5]}`} /><b>{r.name.length > 20 ? r.name.slice(0, 19) + '…' : r.name}</b><span>{r.commits} {s.commits}</span></div>
              ))}
            </div>
          </div>
        </div>

        {/* C */}
        <div className="el" style={S({ y: L(40, 0, up(t, 3.25, 3.6)), s: V ? 0.86 : 1, o: win(t, 3.25, 3.55, 3.95, 4.15) })}>
          <div className="langs">
            <h1 style={{ fontSize: 64, letterSpacing: -2, marginBottom: 20 }}>{s.langs}</h1>
            {data.languages.map((l, i) => (
              <div className="row" key={l.name}><span className="n">{l.name}</span>
                <div className="tr"><div className="f" style={{ background: l.color, width: `${(l.pct / langMax) * 100 * up(t, 3.4 + i * 0.07, 3.85 + i * 0.07)}%` }} /></div>
                <span className="pc">{l.pct}%</span></div>
            ))}
          </div>
        </div>
        {(() => { const mIn = up(t, 4.05, 4.5), mOut = up(t, 4.72, 4.92); return (<>
          <div className="el" style={S({ y: V ? -200 : -250, o: mIn * (1 - mOut) })}><h1 style={{ fontSize: 64, letterSpacing: -2 }}>{s.moodsTitle}</h1></div>
          <div className="el" style={S({ x: L(380, 0, mIn) - lin(t, 4.5, 4.92) * 60, y: V ? 20 : 40, s: V ? 0.68 : 1, o: mIn * (1 - mOut) })}>
            <div className="moods">{data.moods.slice(0, 5).map((m, i) => <div key={m} className={`mood cv ${MOOD_COVERS[i]}`}><span>{s.moods[m] ?? m}</span></div>)}</div>
          </div></>); })()}

        {/* D */}
        <div className="el" style={S({ y: L(-90, -120, up(t, 4.9, 5.2)), s: rs, o: up(t, 4.9, 5.15) * (1 - sOut) })}>
          <div className="search">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#8A8A99" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
            <span>{q.slice(0, nTyped)}</span><span className="caret" style={{ opacity: t > 5.8 ? Math.floor(t * 3) % 2 : 1 }} />
          </div>
        </div>
        <div className="el" style={S({ y: L(30, 10, up(t, 5.85, 6.05)), s: rs, o: up(t, 5.85, 6.05) * (1 - sOut) })}>
          <div className="result"><div className="ph" /><div><b>{q}</b><span>{s.repo} · {data.user.name}</span></div></div>
        </div>

        {/* E */}
        <div className="el" style={S({ x: V ? 0 : L(380, 330, up(t, 6.8, 7.2)), y: V ? L(330, 290, up(t, 6.8, 7.2)) : -30, o: win(t, 6.8, 7.15, 7.65, 7.85) })}>
          <div style={{ width: 720 }}>
            <div className="sub" style={{ fontSize: 24, fontWeight: 600, letterSpacing: 3 }}>{s.starLabel}</div>
            <h1 style={{ fontSize: fit(q, 720, 104), marginTop: 10 }}>{q}</h1>
            <div className="sub" style={{ fontSize: 30, marginTop: 6 }}>{data.user.name}</div>
            <div className="stat">
              <div><b>{fmt(data.star.commits)}</b><span>{s.commits}</span></div>
              <div><b>{fmt(data.star.activeDays)}</b><span>{s.activeDays}</span></div>
              <div><b className="acc">+{fmt(data.star.insertions)}</b><span>{s.lines}</span></div>
            </div>
            <div className="btn"><svg width="18" height="18" viewBox="0 0 10 10"><path d="M2 1 L9 5 L2 9Z" fill="#0B0B10" /></svg>{s.seeYear}</div>
          </div>
        </div>
        <div className="flash" style={{ opacity: up(t, 7.5, 7.65) * 0.9 * (1 - up(t, 7.68, 7.98)) }} />
        <div className="el" style={S({ s: gs * L(1, 7, kZ), o: (t > 7.8 ? 1 : 0) * (1 - up(t, 9.5, 9.8)), blur: L(0, 16, up(t, 8.8, 9.75, ei)) })}>
          <div className="graph">
            {graph.map((lv, i) => { const col = Math.floor(i / 7), row = i % 7, d = Math.abs(col - 26) * 0.012 + row * 0.005;
              return <i key={i} style={{ background: LEVELS[lv] ?? LEVELS[0], opacity: up(t, 7.85 + d, 8.05 + d) }} />; })}
          </div>
        </div>
        <div className="el" style={S({ x: hx, y: hy, s: hs, o: ho })}><div className="cv cv1" style={{ width: 420, height: 420, borderRadius: 30 }} /></div>

        {/* G */}
        <div className="el" style={S({ y: L(-70, -110, up(t, 9.8, 10.15)), o: win(t, 9.8, 10.1, 10.95, 11.1) })}><h1 className="big" style={{ fontSize: big }}>{s.rhythm1}</h1></div>
        <div className="el" style={S({ y: L(80, 40, up(t, 9.95, 10.3)), o: win(t, 9.95, 10.25, 11, 11.15) })}><h1 className="big acc" style={{ fontSize: big }}>{s.rhythm2}</h1></div>
        <div className="el" style={S({ y: L(220, 190, up(t, 10.25, 10.55)), o: win(t, 10.25, 10.5, 10.95, 11.1) })}><span className="chip">{s.streak(data.streak.days)}</span></div>

        {/* H */}
        <div className="el" style={S({ y: V ? -340 : -300, o: up(t, 11.2, 11.45) * (1 - hOut) })}><h1 style={{ fontSize: 64, letterSpacing: -2 }}>{s.weekTitle}</h1></div>
        <div className="el" style={S({ y: L(80, 40, up(t, 11.2, 11.5)), o: up(t, 11.2, 11.4) * (1 - hOut), s: (V ? 0.84 : 1) * L(0.94, 1, up(t, 11.2, 12)) })}>
          <div className="week">{data.weekdays.map((v, i) => { const d = Math.abs(i - 3) * 0.09;
            return <div className="wb" key={i}><div className="b" style={{ height: (v / maxDay) * 300 * up(t, 11.35 + d, 11.85 + d) }} />{s.days[i]}</div>; })}</div>
        </div>

        {/* I/J */}
        {cards.map(([, , , body], i) => { const [x, y, r] = pos[i]; const a = up(t, 12.5 + i * 0.1, 12.95 + i * 0.1), fl = Math.sin(t * 2.2 + i * 1.7) * 10;
          return <div key={i} className="el" style={S({ x: L(x, 0, kC), y: L(y + L(60, 0, a) + fl, 0, kC), r: L(r, 0, kC), s: cs * L(0.85, 1, a) * L(1, 0.12, kC), o: a * (1 - up(t, 14.35, 14.6)) })}><div className="fcard">{body}</div></div>; })}

        {/* K */}
        <div className="el" style={S({ x: wordX + L(-60, 0, kK), y: -100, o: up(t, 15.35, 15.8) })}><h1 style={{ fontSize: 116, letterSpacing: -4 }}>{WORDMARK}</h1></div>
        <div className="el" style={S({ y: L(60, 40, up(t, 15.6, 16)), o: up(t, 15.6, 16) })}><div style={{ fontSize: V ? 44 : 54, fontWeight: 700, letterSpacing: -1, whiteSpace: 'nowrap' }}>{s.tag1(data.year)} <span className="acc">{s.tag2}</span></div></div>
        <div className="el" style={S({ y: L(180, 160, up(t, 15.85, 16.25)), o: up(t, 15.85, 16.25) })}><div className="cmd"><span className="sub">$ </span>npx <span className="acc">git-wrapped-video</span></div></div>

        {/* terminal */}
        <div className="el" style={S({ y: L(HH + 60, HH - 80, up(t, 1.9, 2.3)), s: V ? 0.76 : 1, o: up(t, 1.9, 2.3) * (1 - up(t, 12.15, 12.45)) })}>
          <div className="term"><span className="dots"><i /><i /><i /></span><span className="hash">{line.hash}</span><span className="msg">{line.msg}</span>
            <span className="prog"><div style={{ width: `${tp * 100}%` }} /></span><span className="count">{Math.round(tp * total)} / {total}</span></div>
        </div>
        <div className="el" style={logo}><Logo /></div>
        <div className="el" style={S({ x: L(0, logoEndX, kK), y: L(0, -100, kK), s: L(0, 1, kG), o: t > 14.45 ? 1 : 0 })}><Logo /></div>
      </div>
    </AbsoluteFill>
  );
};

export const Mark = ({ size = 86 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M34 18 V82" stroke="#fff" strokeWidth="9" strokeLinecap="round" fill="none" />
    <path d="M34 62 C34 44 66 50 66 32" stroke="#fff" strokeWidth="9" strokeLinecap="round" fill="none" />
    <circle cx="34" cy="80" r="10" fill="#fff" />
    <circle cx="66" cy="26" r="12" fill="#0B0B10" stroke="#fff" strokeWidth="8" />
  </svg>
);

const Logo = () => <div className="logo"><Mark /></div>;

const css = (mono: string) => `
  :root{--acc:#9D8CFF;--acc2:#5EE6D0;--sub:#8A8A99;--card:#15151D;--line:#24242F}
  *{box-sizing:border-box;margin:0;padding:0}
  .bg{position:absolute;inset:0;background:radial-gradient(1100px 800px at 12% 4%,#5B47C9 0%,transparent 60%),radial-gradient(900px 700px at 90% 20%,#2A1F6B 0%,transparent 65%),linear-gradient(160deg,#1E1745 0%,#09080F 75%)}
  .stage{position:absolute;inset:64px;border-radius:44px;background:#0B0B10;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.05)}
  .el{position:absolute;left:50%;top:50%}
  .logo{width:150px;height:150px;border-radius:40px;background:linear-gradient(140deg,#B3A6FF,#7B63FF 55%,#5B3FE0);display:flex;align-items:center;justify-content:center;box-shadow:0 20px 60px rgba(123,99,255,.35)}
  h1{font-weight:800;letter-spacing:-3px;line-height:1.02;white-space:nowrap}
  .big{font-size:150px}.acc{color:var(--acc)}.sub{color:var(--sub)}
  .cv{border-radius:24px;position:relative;overflow:hidden}
  .cv::after{content:"";position:absolute;inset:-40%;background:conic-gradient(from 210deg at 50% 50%,transparent 0 40%,rgba(255,255,255,.35) 47%,transparent 55% 100%);filter:blur(30px)}
  .cv1{background:radial-gradient(60% 50% at 25% 30%,#C9B8FF,transparent 70%),radial-gradient(55% 60% at 80% 25%,#6EF0DA,transparent 70%),radial-gradient(70% 55% at 70% 85%,#FF8FC8,transparent 70%),radial-gradient(50% 50% at 20% 85%,#FFD98A,transparent 70%),#7A6CF0}
  .cv2{background:radial-gradient(60% 60% at 30% 30%,#FFB48A,transparent 70%),radial-gradient(60% 60% at 80% 70%,#FF5E9C,transparent 70%),#B4387A}
  .cv3{background:radial-gradient(60% 60% at 25% 70%,#7CF5C4,transparent 70%),radial-gradient(60% 60% at 80% 25%,#43B8FF,transparent 70%),#1F6E8C}
  .cv4{background:radial-gradient(60% 60% at 30% 30%,#FFE68A,transparent 70%),radial-gradient(60% 60% at 80% 80%,#FF9F4A,transparent 70%),#C77A1E}
  .cv5{background:radial-gradient(60% 60% at 30% 30%,#8AB8FF,transparent 70%),radial-gradient(60% 60% at 75% 80%,#7B63FF,transparent 70%),#2C3E9E}
  .win{width:1240px;height:640px;border-radius:30px;background:#111118;border:1px solid var(--line);padding:34px 44px}
  .win .bar{display:flex;gap:9px;margin-bottom:34px}.win .bar i{width:13px;height:13px;border-radius:50%;background:#2c2c38;display:inline-block}
  .win .ttl{position:relative;height:56px;margin-bottom:26px}
  .win .ttl span{position:absolute;left:0;top:0;font-size:48px;font-weight:800;letter-spacing:-1.5px;white-space:nowrap}
  .repos{display:flex;gap:36px}.repo .cv{width:356px;height:356px}
  .repo b{display:block;font-size:28px;margin-top:18px}.repo span{font-size:21px;color:var(--sub)}
  .langs{width:1000px}
  .row{display:flex;align-items:center;gap:28px;margin-top:30px;font-size:34px;font-weight:600}
  .row .n{width:220px}.row .tr{flex:1;height:22px;border-radius:11px;background:#1c1c25;overflow:hidden}
  .row .f{height:100%;border-radius:11px}.row .pc{width:90px;text-align:right;color:var(--sub);font-weight:500}
  .moods{display:flex;gap:24px}
  .mood{width:240px;height:300px;padding:22px;display:flex;align-items:flex-end;font-size:28px;font-weight:700}
  .mood span{position:relative;z-index:1}
  .search{width:960px;height:96px;border-radius:48px;background:#16161f;border:1px solid var(--line);display:flex;align-items:center;gap:22px;padding:0 36px;font-size:40px;font-weight:600}
  .caret{display:inline-block;width:3px;height:44px;background:var(--acc);margin-left:-18px}
  .result{width:960px;display:flex;align-items:center;gap:26px;padding:20px 26px;border-radius:24px;background:#13131a}
  .result .ph{width:80px;height:80px;border-radius:14px}
  .result b{font-size:32px;display:block}.result span{font-size:22px;color:var(--sub)}
  .stat{display:flex;gap:46px;margin-top:30px}
  .stat b{display:block;font-size:50px;font-weight:700;letter-spacing:-1px}.stat span{font-size:21px;color:var(--sub)}
  .btn{display:inline-flex;align-items:center;gap:12px;margin-top:36px;background:var(--acc);color:#0B0B10;font-weight:700;font-size:24px;padding:16px 32px;border-radius:999px}
  .flash{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,#9D8CFF,#5B3FE0)}
  .graph{display:grid;grid-template-rows:repeat(7,22px);grid-auto-flow:column;grid-auto-columns:22px;gap:5px}
  .graph i{border-radius:5px}
  .chip{display:inline-block;font-size:30px;font-weight:600;color:var(--acc);background:#1d1830;padding:14px 26px;border-radius:999px;white-space:nowrap}
  .week{display:flex;align-items:flex-end;gap:34px;height:380px}
  .wb{width:110px;display:flex;flex-direction:column;align-items:center;gap:16px;font-size:26px;font-weight:600;color:var(--sub)}
  .wb .b{width:110px;border-radius:18px;background:linear-gradient(180deg,#B3A6FF,#5B3FE0)}
  .fcard{width:460px;padding:36px 40px;border-radius:30px;background:var(--card);border:1px solid var(--line);box-shadow:0 30px 80px rgba(0,0,0,.5)}
  .fcard .k{font-size:22px;color:var(--sub);font-weight:500}
  .fcard .v{font-size:50px;font-weight:700;letter-spacing:-1px;margin-top:14px;line-height:1.1;white-space:nowrap}
  .fcard .m{font-family:${mono};font-size:22px;color:#cfcfe0;margin-top:14px;white-space:nowrap}
  .fcard .chip{font-size:19px;padding:8px 16px;margin-top:18px}
  .cmd{font-family:${mono};font-size:42px;padding:24px 42px;border-radius:22px;background:#14141c;border:1px solid var(--line);white-space:nowrap}
  .term{width:1180px;height:74px;border-radius:18px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:22px;padding:0 26px;font-family:${mono};font-size:19px}
  .term .dots i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:7px;background:#34343f}
  .term .hash{color:var(--acc)}.term .msg{color:#d6d6e0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .term .prog{width:220px;height:6px;border-radius:3px;background:#2a2a35;overflow:hidden}.term .prog div{height:100%;background:var(--acc);border-radius:3px}
  .term .count{color:var(--sub);font-size:17px;width:130px;text-align:right;white-space:nowrap}
`;
