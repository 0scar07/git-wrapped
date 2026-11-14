#!/usr/bin/env node
// git-wrapped: tu año en git, en un video de 18 segundos.
import { parseArgs } from 'node:util';
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze, findRepos, gitIdentity, isRepo } from '../src/analyze.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    scan: { type: 'string' },
    year: { type: 'string' },
    author: { type: 'string', multiple: true },
    name: { type: 'string' },
    lang: { type: 'string' },
    out: { type: 'string', short: 'o' },
    fps: { type: 'string' },
    gl: { type: 'string' },
    music: { type: 'string' },
    json: { type: 'boolean' },
    data: { type: 'string' },
    demo: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
  },
});

const sysLang = (Intl.DateTimeFormat().resolvedOptions().locale || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
const lang = o.lang === 'es' || o.lang === 'en' ? o.lang : sysLang;
const es = lang === 'es';
const say = (e, n) => console.log(es ? e : n);

if (o.version) { console.log(pkg.version); process.exit(0); }
if (o.help) {
  console.log(`
  git-wrapped ${pkg.version}

  ${es ? 'Uso' : 'Usage'}:  npx git-wrapped [${es ? 'rutas' : 'paths'}...] [opciones]

  --scan <dir>        ${es ? 'Busca repos de git dentro de una carpeta (2 niveles)' : 'Find git repos inside a folder (2 levels deep)'}
  --year <aaaa>       ${es ? 'Año a analizar (por defecto, el actual)' : 'Year to analyze (default: current)'}
  --author <email>    ${es ? 'Tu email de git; se puede repetir (por defecto, user.email)' : 'Your git email, repeatable (default: user.email)'}
  --name <texto>      ${es ? 'Nombre que se muestra en el video' : 'Name shown in the video'}
  --lang es|en        ${es ? 'Idioma del video' : 'Video language'}
  --music <archivo>   ${es ? 'Música de fondo (mp3/wav)' : 'Background music (mp3/wav)'}
  --fps 30|60         ${es ? 'Fotogramas por segundo (30 por defecto; 60 = más fluido y el doble de lento)' : 'Frames per second (default 30; 60 = smoother, twice as slow)'}
  --gl <modo>         ${es ? 'Renderizado de Chrome: angle (GPU), swangle, default…' : 'Chrome rendering: angle (GPU), swangle, default…'}
  -o, --out <archivo> ${es ? 'Archivo de salida' : 'Output file'}
  --json              ${es ? 'Solo imprime los datos, sin renderizar' : 'Print the data only, no render'}
  --data <json>       ${es ? 'Renderiza desde un JSON ya generado' : 'Render from a saved JSON'}
  --demo              ${es ? 'Renderiza con datos de ejemplo' : 'Render with sample data'}
`);
  process.exit(0);
}

const year = +(o.year || new Date().getFullYear());
let data;

if (o.demo) {
  data = { ...JSON.parse(readFileSync(path.join(root, 'src/demo.json'), 'utf8')), lang };
} else if (o.data) {
  data = { ...JSON.parse(readFileSync(path.resolve(o.data), 'utf8')), ...(o.lang ? { lang } : {}) };
} else {
  let repos = positionals.length ? positionals.map(p => path.resolve(p)) : [];
  if (o.scan) repos.push(...findRepos(o.scan));
  if (!repos.length) repos = [process.cwd()];
  repos = [...new Set(repos)].filter(isRepo);
  if (!repos.length) { say('No encontré ningún repo de git. Pasa una ruta o usa --scan <carpeta>.', 'No git repo found. Pass a path or use --scan <folder>.'); process.exit(1); }
  const id = gitIdentity(repos[0]);
  const authors = o.author?.length ? o.author : id.email ? [id.email] : [];
  if (!authors.length) say('Aviso: no hay user.email en git; cuento los commits de todos los autores.', 'Warning: no git user.email; counting commits from every author.');
  say(`Analizando ${repos.length} repo(s) de ${year}…`, `Analyzing ${repos.length} repo(s) for ${year}…`);
  data = analyze({ repos, year, authors, lang, name: o.name || id.name || 'dev' });
  if (!data) { say(`No hay commits tuyos en ${year}.`, `No commits of yours in ${year}.`); process.exit(1); }
}

if (o.json) { console.log(JSON.stringify(data, null, 2)); process.exit(0); }

say(`${data.totals.commits} commits · ${data.totals.activeDays} días activos · racha de ${data.streak.days} días`,
  `${data.totals.commits} commits · ${data.totals.activeDays} active days · ${data.streak.days}-day streak`);

const fps = o.fps === '60' ? 60 : 30;
const out = path.resolve(o.out || `git-wrapped-${data.year}.mp4`);
const publicDir = mkdtempSync(path.join(tmpdir(), 'git-wrapped-'));
let music = null;
if (o.music) { music = 'music' + path.extname(o.music); copyFileSync(path.resolve(o.music), path.join(publicDir, music)); }

const { bundle } = await import('@remotion/bundler');
const { renderMedia, selectComposition } = await import('@remotion/renderer');

say('Preparando el video…', 'Preparing the video…');
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/remotion/index.ts'), publicDir });
const inputProps = { data, fps, music };
const composition = await selectComposition({ serveUrl, id: 'Wrapped', inputProps });
// La GPU (ANGLE) duplica la velocidad en Windows y macOS; en Linux sin GPU se usa el modo por defecto.
const gl = o.gl ?? (process.platform === 'linux' ? null : 'angle');
const t0 = Date.now();
const render = glMode => {
  let last = -1;
  return renderMedia({
    composition, serveUrl, inputProps, codec: 'h264', outputLocation: out, crf: 18,
    chromiumOptions: glMode && glMode !== 'default' ? { gl: glMode } : {},
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 100);
      if (p !== last && p % 5 === 0) { last = p; process.stdout.write(`\r${es ? 'Renderizando' : 'Rendering'} ${p}%   `); }
    },
  });
};
try {
  await render(gl);
} catch (err) {
  if (!gl || gl === 'default') throw err;
  say('\nLa aceleración por GPU falló; reintento sin ella…', '\nGPU acceleration failed; retrying without it…');
  await render(null);
}
writeFileSync(out.replace(/\.mp4$/i, '') + '.json', JSON.stringify(data, null, 2));
console.log('');
const secs = Math.round((Date.now() - t0) / 1000);
say(`Listo en ${secs} s: ${out}\nCompártelo con #GitWrapped`, `Done in ${secs}s: ${out}\nShare it with #GitWrapped`);
