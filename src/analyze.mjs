// Lee el historial de git y calcula los datos del Wrapped.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const LANGS = {
  ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript', cts: 'TypeScript',
  js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript',
  py: 'Python', rs: 'Rust', go: 'Go', java: 'Java', kt: 'Kotlin', kts: 'Kotlin',
  swift: 'Swift', c: 'C', h: 'C', cpp: 'C++', cc: 'C++', cxx: 'C++', hpp: 'C++',
  cs: 'C#', rb: 'Ruby', php: 'PHP', vue: 'Vue', svelte: 'Svelte', astro: 'Astro',
  css: 'CSS', scss: 'CSS', sass: 'CSS', less: 'CSS', html: 'HTML', md: 'Markdown', mdx: 'Markdown',
  sh: 'Shell', bash: 'Shell', zsh: 'Shell', ps1: 'PowerShell', dart: 'Dart', lua: 'Lua',
  gd: 'GDScript', sql: 'SQL', ex: 'Elixir', exs: 'Elixir', zig: 'Zig', scala: 'Scala', r: 'R',
};
export const LANG_COLORS = {
  TypeScript: '#9D8CFF', JavaScript: '#FFD98A', Python: '#5EE6D0', Rust: '#FF9F6E', Go: '#6FD3FF',
  Java: '#FF8F7A', Kotlin: '#C59BFF', Swift: '#FF8A5C', C: '#A9B4C8', 'C++': '#FF7AB6', 'C#': '#8BE38B',
  Ruby: '#FF6B81', PHP: '#9AA8FF', Vue: '#5EE6A0', Svelte: '#FF8A5C', Astro: '#FF9DE2', CSS: '#7AB8FF',
  HTML: '#FF9F6E', Markdown: '#C8C8D4', Shell: '#8BE38B', PowerShell: '#6FA8FF', Dart: '#5EC8F0',
  Lua: '#8C9CFF', GDScript: '#7FB8E0', SQL: '#FFC97A', Elixir: '#B58BFF', Zig: '#FFB45E', Scala: '#FF7A7A', R: '#7AA8FF',
};
const IGNORE = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|Cargo\.lock|poetry\.lock|composer\.lock|Gemfile\.lock|go\.sum)$|(^|\/)(node_modules|dist|build|vendor|\.next|coverage)\/|\.min\.(js|css)$|\.map$/;

const git = (cwd, args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', maxBuffer: 1 << 29 });

export function isRepo(dir) {
  try { return git(dir, ['rev-parse', '--is-inside-work-tree']).trim() === 'true'; } catch { return false; }
}

export function findRepos(root, depth = 2) {
  const out = [];
  const walk = (dir, d) => {
    if (existsSync(path.join(dir, '.git'))) { out.push(dir); return; }
    if (d === 0) return;
    let entries = [];
    try { entries = readdirSync(dir); } catch { return; }
    for (const e of entries) {
      if (e.startsWith('.') || e === 'node_modules') continue;
      const p = path.join(dir, e);
      try { if (statSync(p).isDirectory()) walk(p, d - 1); } catch { /* sin acceso */ }
    }
  };
  walk(path.resolve(root), depth);
  return out;
}

export function gitIdentity(dir) {
  const get = k => { try { return git(dir, ['config', k]).trim(); } catch { return ''; } };
  return { name: get('user.name'), email: get('user.email') };
}

function readCommits(repo, year, authors) {
  // Sin --since/--until: git deja de recorrer el historial en cuanto ve un commit más antiguo,
  // y con fechas desordenadas (rebase, cherry-pick) se perderían commits. Se filtra por fecha de autor abajo.
  const args = ['log', '--branches', '--remotes', '--tags', '--no-merges', '--format=%x1e%H%x1f%at%x1f%s', '--numstat'];
  for (const a of authors) args.push(`--author=${a}`);
  let raw = '';
  try { raw = git(repo, args); } catch { return []; }
  return raw.split('\x1e').filter(Boolean).map(chunk => {
    const [head, ...lines] = chunk.split('\n');
    const [hash, at, subject] = head.split('\x1f');
    const files = [];
    for (const l of lines) {
      const m = l.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
      if (!m || m[1] === '-') continue;
      let p = m[3];
      const ren = p.match(/^(.*)\{.* => (.*)\}(.*)$/); if (ren) p = (ren[1] + ren[2] + ren[3]).replace(/\/\//g, '/');
      else if (p.includes(' => ')) p = p.split(' => ')[1];
      if (IGNORE.test(p)) continue;
      files.push({ add: +m[1], del: +m[2], path: p });
    }
    return { repo, hash, at: +at * 1000, subject: subject || '', files };
  }).filter(c => new Date(c.at).getFullYear() === year);
}

const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function analyze({ repos, year, authors, lang, name }) {
  const commits = repos.flatMap(r => readCommits(r, year, authors)).sort((a, b) => a.at - b.at);
  if (!commits.length) return null;

  const hours = Array(24).fill(0), weekdays = Array(7).fill(0);
  const perDay = new Map(), perFile = new Map(), perLang = new Map(), perRepo = new Map(), perFolder = new Map();
  let insertions = 0, deletions = 0, biggest = null;
  for (const c of commits) {
    const d = new Date(c.at);
    hours[d.getHours()]++;
    weekdays[(d.getDay() + 6) % 7]++;
    perDay.set(dayKey(d), (perDay.get(dayKey(d)) || 0) + 1);
    perRepo.set(c.repo, (perRepo.get(c.repo) || 0) + 1);
    let size = 0, add = 0, del = 0;
    const folders = new Set();
    for (const f of c.files) {
      add += f.add; del += f.del; size += f.add + f.del;
      perFile.set(f.path, (perFile.get(f.path) || 0) + 1);
      const l = LANGS[(f.path.split('.').pop() || '').toLowerCase()];
      if (l) perLang.set(l, (perLang.get(l) || 0) + f.add + f.del);
      folders.add(f.path.includes('/') ? f.path.split('/')[0] : '/');
    }
    for (const fo of folders) perFolder.set(fo, (perFolder.get(fo) || 0) + 1);
    insertions += add; deletions += del;
    if (!biggest || size > biggest.size) biggest = { size, add, del, subject: c.subject };
  }

  // racha más larga y mejor día
  const days = [...perDay.keys()].sort();
  let best = { days: 1, start: days[0], end: days[0] }, run = 1, runStart = days[0];
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i]) - new Date(days[i - 1])) / 864e5;
    if (Math.round(diff) === 1) run++; else { run = 1; runStart = days[i]; }
    if (run > best.days) best = { days: run, start: runStart, end: days[i] };
  }
  const bestDay = [...perDay.entries()].sort((a, b) => b[1] - a[1])[0];

  // repos (o carpetas si solo hay uno)
  const repoName = r => path.basename(path.resolve(r));
  let reposLabel = 'repos';
  let top = [...perRepo.entries()].sort((a, b) => b[1] - a[1]).map(([r, n]) => ({ name: repoName(r), commits: n }));
  const folders = [...perFolder.entries()].filter(([f]) => f !== '/').sort((a, b) => b[1] - a[1]);
  if (top.length === 1) {
    // un solo repo: se muestran sus carpetas más activas
    reposLabel = 'folders';
    top = folders.map(([f, n]) => ({ name: f, commits: n }));
    if (top.length < 3) { const [only, n] = [...perRepo.entries()][0]; top.push({ name: repoName(only), commits: n }); }
  } else if (top.length === 2 && folders.length) {
    // dos repos: el tercer hueco es la carpeta más activa
    top.push({ name: folders[0][0], commits: folders[0][1] });
  }
  top = top.slice(0, 3).map((r, i) => ({ ...r, cover: i }));

  const starRepo = [...perRepo.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const starCommits = commits.filter(c => c.repo === starRepo);
  const star = {
    name: repoName(starRepo), commits: starCommits.length,
    activeDays: new Set(starCommits.map(c => dayKey(new Date(c.at)))).size,
    insertions: starCommits.reduce((s, c) => s + c.files.reduce((a, f) => a + f.add, 0), 0),
  };

  // lenguajes
  const langTotal = [...perLang.values()].reduce((a, b) => a + b, 0) || 1;
  const languages = [...perLang.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([n, v]) => ({ name: n, pct: Math.max(1, Math.round(v / langTotal * 100)), color: LANG_COLORS[n] || '#9D8CFF' }));

  // gráfica: 52 semanas × 7 días que terminan en la semana de la última fecha del año (o hoy)
  const now = new Date();
  const endRef = year === now.getFullYear() ? now : new Date(year, 11, 31);
  const end = new Date(endRef.getFullYear(), endRef.getMonth(), endRef.getDate());
  end.setDate(end.getDate() + (6 - (end.getDay() + 6) % 7)); // domingo de esa semana
  const startG = new Date(end); startG.setDate(startG.getDate() - 52 * 7 + 1);
  const raw = [];
  for (let i = 0; i < 364; i++) { const d = new Date(startG); d.setDate(d.getDate() + i); raw.push(perDay.get(dayKey(d)) || 0); }
  const nz = raw.filter(Boolean).sort((a, b) => a - b);
  const q = p => nz[Math.min(nz.length - 1, Math.floor(nz.length * p))] || 1;
  const [q1, q2, q3] = [q(.25), q(.5), q(.75)];
  const graph = raw.map(v => v === 0 ? 0 : v <= q1 ? 1 : v <= q2 ? 2 : v <= q3 ? 3 : 4); // índice = semana*7 + día

  // moods
  const n = commits.length;
  const share = f => commits.filter(f).length / n;
  const h = c => new Date(c.at).getHours();
  const scores = {
    night: share(c => h(c) >= 22 || h(c) < 5),
    early: share(c => h(c) >= 5 && h(c) < 9),
    weekend: share(c => [0, 6].includes(new Date(c.at).getDay())),
    refactor: share(c => /refactor|clean ?up|limpi|reorgan/i.test(c.subject)) + (deletions / Math.max(1, insertions)) * .2,
    bugs: share(c => /\bfix|bug|arregl|hotfix|corrig/i.test(c.subject)),
    docs: share(c => /\bdocs?\b|readme|documenta/i.test(c.subject)),
    tests: share(c => /\btests?\b|spec|prueba/i.test(c.subject)),
    marathon: Math.min(1, (bestDay?.[1] || 0) / 30),
    feature: share(c => /\bfeat|add|nuev|añad|agreg/i.test(c.subject)),
  };
  const moods = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

  const peak = hours.indexOf(Math.max(...hours));
  const topFile = [...perFile.entries()].sort((a, b) => b[1] - a[1])[0] || ['—', 0];

  // líneas del terminal: 10 commits reales repartidos en el año
  const step = Math.max(1, Math.floor(n / 10));
  const log = commits.filter((_, i) => i % step === 0).slice(0, 10)
    .map(c => ({ hash: c.hash.slice(0, 7), msg: c.subject.length > 64 ? c.subject.slice(0, 61) + '…' : c.subject }));

  return {
    lang, year,
    user: { name },
    totals: { commits: n, activeDays: perDay.size, insertions, deletions },
    reposLabel, repos: top, languages, moods, star, graph, weekdays,
    streak: best,
    cards: {
      file: { path: topFile[0], count: topFile[1] },
      peak: { hour: peak },
      biggest: { add: biggest.add, del: biggest.del, subject: biggest.subject },
      bestDay: { date: bestDay[0], count: bestDay[1] },
    },
    log,
  };
}
