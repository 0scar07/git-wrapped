import type { Lang } from './strings';

export type WrappedData = {
  lang: Lang;
  year: number;
  user: { name: string };
  totals: { commits: number; activeDays: number; insertions: number; deletions: number };
  reposLabel: 'repos' | 'folders';
  repos: { name: string; commits: number; cover: number }[];
  languages: { name: string; pct: number; color: string }[];
  moods: string[];
  star: { name: string; commits: number; activeDays: number; insertions: number };
  graph: number[];
  weekdays: number[];
  streak: { days: number; start: string; end: string };
  cards: {
    file: { path: string; count: number };
    peak: { hour: number };
    biggest: { add: number; del: number; subject: string };
    bestDay: { date: string; count: number };
  };
  log: { hash: string; msg: string }[];
};

export type Props = { data: WrappedData; fps?: number; music?: string | null; motionBlur?: boolean; vertical?: boolean; size?: [number, number] };
