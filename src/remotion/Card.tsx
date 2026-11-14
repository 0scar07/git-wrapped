// Tarjeta resumen (PNG) para compartir en X, LinkedIn, etc. Diseñada en 1200×630 y escalada al tamaño pedido.
import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { fmt, strings } from './strings';
import { demoGraph, LEVELS, Mark } from './Wrapped';
import type { Props } from './types';

const inter = loadInter('normal', { weights: ['500', '600', '700', '800'], subsets: ['latin', 'latin-ext'] }).fontFamily;
const mono = loadMono('normal', { weights: ['400'], subsets: ['latin', 'latin-ext'] }).fontFamily;

export const Card: React.FC<Props> = ({ data }) => {
  const { width, height } = useVideoConfig();
  const s = strings(data.lang);
  const k = Math.min(width / 1200, height / 630);
  const graph = data.graph?.length === 364 ? data.graph : demoGraph();
  const top = data.languages[0];
  const stats: [string, string, string?][] = [
    [fmt(data.totals.commits), s.commits],
    [fmt(data.totals.activeDays), s.activeDays],
    [s.days_(data.streak.days), s.streakK],
    [top?.name ?? '—', s.topLangK, top?.color],
  ];

  return (
    <AbsoluteFill style={{ fontFamily: inter, color: '#fff', background: 'radial-gradient(900px 600px at 10% 0%, #5B47C9 0%, transparent 60%), linear-gradient(160deg,#1E1745 0%,#09080F 75%)' }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 1200, height: 630, transform: `translate(-50%,-50%) scale(${k})` }}>
        <div style={{ position: 'absolute', inset: 26, borderRadius: 30, background: '#0B0B10', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)', padding: '46px 54px', display: 'flex', gap: 48 }}>
          {/* izquierda */}
          <div style={{ width: 470, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 54, height: 54, borderRadius: 15, background: 'linear-gradient(140deg,#B3A6FF,#7B63FF 55%,#5B3FE0)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(123,99,255,.35)' }}><Mark size={32} /></div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>git wrapped</div>
            </div>
            <div style={{ fontSize: 66, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.02, marginTop: 30 }}>
              {s.cardTitle1(data.year)}<br /><span style={{ color: '#9D8CFF' }}>{s.cardTitle2}</span>
            </div>
            <div style={{ fontSize: 22, color: '#8A8A99', marginTop: 12, fontWeight: 500 }}>{data.user.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 30px', marginTop: 'auto' }}>
              {stats.map(([v, l, col]) => (
                <div key={l}>
                  <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, color: col ?? '#fff', whiteSpace: 'nowrap' }}>{v}</div>
                  <div style={{ fontSize: 17, color: '#8A8A99', fontWeight: 500 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          {/* derecha */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 16, color: '#8A8A99', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>{s.topRepoK}</div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.star.name}</div>
            <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 8px)', gridAutoFlow: 'column', gridAutoColumns: '8px', gap: 2.7, marginTop: 34 }}>
              {graph.map((lv, i) => <i key={i} style={{ borderRadius: 2, background: LEVELS[lv] ?? LEVELS[0] }} />)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 30 }}>
              {data.moods.slice(0, 3).map(m => (
                <span key={m} style={{ fontSize: 18, fontWeight: 600, color: '#9D8CFF', background: '#1d1830', padding: '9px 16px', borderRadius: 999 }}>{s.moods[m] ?? m}</span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 34, height: 92 }}>
              {data.weekdays.map((v, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 13, color: '#8A8A99', fontWeight: 600 }}>
                  <div style={{ width: 34, height: Math.max(4, (v / Math.max(1, ...data.weekdays)) * 66), borderRadius: 8, background: 'linear-gradient(180deg,#B3A6FF,#5B3FE0)' }} />
                  {s.days[i]}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 17, color: '#8A8A99', fontWeight: 500 }}>{s.makeYours}</span>
              <span style={{ fontFamily: mono, fontSize: 22, padding: '10px 18px', borderRadius: 12, background: '#14141c', border: '1px solid #24242F' }}>
                <span style={{ color: '#8A8A99' }}>$ </span>npx <span style={{ color: '#9D8CFF' }}>git-wrapped</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
