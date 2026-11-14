#!/usr/bin/env node
// git-wrapped: tu año en git, en un video de 18 segundos.
import { parseArgs } from 'node:util';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    github: { type: 'string' },
    token: { type: 'string' },
    'max-repos': { type: 'string' },
    year: { type: 'string' },
    author: { type: 'string', multiple: true },
    name: { type: 'string' },
    lang: { type: 'string' },
    out: { type: 'string', short: 'o' },
    fps: { type: 'string' },
    gl: { type: 'string' },
    music: { type: 'string' },
    'no-music': { type: 'boolean' },
    blur: { type: 'boolean' },
    vertical: { type: 'boolean' },
    'no-card': { type: 'boolean' },
    gif: { type: 'boolean' },
    readme: { type: 'string' },
    hq: { type: 'boolean' },
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
const fail = (e, n) => { say(e, n); process.exit(1); };

if (o.version) { console.log(pkg.version); process.exit(0); }
if (o.help) {
  console.log(`
  git-wrapped ${pkg.version}

  ${es ? 'Uso' : 'Usage'}:  npx git-wrapped-video [${es ? 'rutas' : 'paths'}...] [opciones]

  --scan <dir>        ${es ? 'Busca repos de git dentro de una carpeta (2 niveles)' : 'Find git repos inside a folder (2 levels deep)'}
  --github <usuario>  ${es ? 'Analiza los repos de un usuario de GitHub (los clona en una carpeta temporal)' : 'Analyze a GitHub user\'s repos (cloned to a temp folder)'}
  --token <token>     ${es ? 'Token de GitHub (o GITHUB_TOKEN); con tu token personal incluye repos privados' : 'GitHub token (or GITHUB_TOKEN); your personal token adds private repos'}
  --max-repos <n>     ${es ? 'Máximo de repos con --github (15 por defecto)' : 'Max repos with --github (default 15)'}
  --year <aaaa>       ${es ? 'Año a analizar (por defecto el actual; en enero, el anterior)' : 'Year to analyze (default: current; in January, the previous one)'}
  --author <email>    ${es ? 'Tu email de git; se puede repetir (por defecto, user.email)' : 'Your git email, repeatable (default: user.email)'}
  --name <texto>      ${es ? 'Nombre que se muestra en el video' : 'Name shown in the video'}
  --lang es|en        ${es ? 'Idioma del video' : 'Video language'}
  --music <archivo>   ${es ? 'Tu propia música (mp3/wav) en vez de la incluida' : 'Your own music (mp3/wav) instead of the bundled track'}
  --no-music          ${es ? 'Video sin audio' : 'Silent video'}
  --vertical          ${es ? 'Formato vertical 9:16 para TikTok, Reels y Shorts' : 'Vertical 9:16 for TikTok, Reels and Shorts'}
  --no-card           ${es ? 'No generar la imagen resumen PNG' : "Don't make the PNG summary card"}
  --gif               ${es ? 'Genera también un GIF (para READMEs)' : 'Also make a GIF (for READMEs)'}
  --readme <archivo>  ${es ? 'Pone el GIF (o la tarjeta) en ese README, entre marcadores' : 'Put the GIF (or card) into that README, between markers'}
  --fps 30|60         ${es ? 'Fotogramas por segundo (30 por defecto; 60 = más fluido y el doble de lento)' : 'Frames per second (default 30; 60 = smoother, twice as slow)'}
  --blur              ${es ? 'Desenfoque de movimiento (4 subfotogramas; unas 4 veces más lento)' : 'Motion blur (4 subframes; about 4x slower)'}
  --hq                ${es ? 'Máxima calidad: 60 fps + desenfoque de movimiento' : 'Best quality: 60 fps + motion blur'}
  --gl <modo>         ${es ? 'Renderizado de Chrome: angle (GPU), swangle, default…' : 'Chrome rendering: angle (GPU), swangle, default…'}
  -o, --out <archivo> ${es ? 'Archivo de salida' : 'Output file'}
  --json              ${es ? 'Solo imprime los datos, sin renderizar' : 'Print the data only, no render'}
  --data <json>       ${es ? 'Renderiza desde un JSON ya generado' : 'Render from a saved JSON'}
  --demo              ${es ? 'Renderiza con datos de ejemplo' : 'Render with sample data'}
`);
  process.exit(0);
}

const now = new Date();
const year = +(o.year || (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()));
const log = o.json ? () => {} : say; // con --json, la salida es solo el JSON
let data;

if (o.demo) {
  data = { ...JSON.parse(readFileSync(path.join(root, 'src/demo.json'), 'utf8')), lang };
} else if (o.data) {
  data = { ...JSON.parse(readFileSync(path.resolve(o.data), 'utf8')), ...(o.lang ? { lang } : {}) };
} else if (o.github) {
  const { findGithubRepos, findAuthorEmails, cloneRepos } = await import('../src/github.mjs');
  const token = o.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  log(`Buscando los repos de ${o.github} con actividad en ${year}…`, `Looking up ${o.github}'s repos with activity in ${year}…`);
  let found;
  try {
    found = await findGithubRepos({ user: o.github, token, year, max: +(o['max-repos'] || 15) });
  } catch (err) {
    fail(err.status === 404 ? `No existe el usuario ${o.github} en GitHub.` : `Error con la API de GitHub: ${err.message}`,
      err.status === 404 ? `GitHub user ${o.github} not found.` : `GitHub API error: ${err.message}`);
  }
  if (!found.repos.length) fail(`${o.github} no tiene repos con actividad en ${year}.`, `${o.github} has no repos with activity in ${year}.`);
  const authors = o.author?.length ? o.author : await findAuthorEmails({ ...found, token, year });
  const dir = mkdtempSync(path.join(tmpdir(), 'git-wrapped-repos-'));
  log(`Clonando ${found.repos.length} repos…`, `Cloning ${found.repos.length} repos…`);
  const repos = cloneRepos({ repos: found.repos, dir, year, token, log: r => log(`  · ${r}`, `  · ${r}`) });
  data = repos.length ? analyze({ repos, year, authors, lang, name: o.name || found.profile.name }) : null;
  rmSync(dir, { recursive: true, force: true });
  if (!data) fail(`No encontré commits de ${o.github} en ${year}.`, `No commits by ${o.github} found in ${year}.`);
} else {
  let repos = positionals.length ? positionals.map(p => path.resolve(p)) : [];
  if (o.scan) repos.push(...findRepos(o.scan));
  if (!repos.length) repos = [process.cwd()];
  repos = [...new Set(repos)].filter(isRepo);
  if (!repos.length) fail('No encontré ningún repo de git. Pasa una ruta, usa --scan <carpeta> o --github <usuario>.', 'No git repo found. Pass a path, or use --scan <folder> or --github <user>.');
  const id = gitIdentity(repos[0]);
  const authors = o.author?.length ? o.author : id.email ? [id.email] : [];
  if (!authors.length) log('Aviso: no hay user.email en git; cuento los commits de todos los autores.', 'Warning: no git user.email; counting commits from every author.');
  log(`Analizando ${repos.length} repo(s) de ${year}…`, `Analyzing ${repos.length} repo(s) for ${year}…`);
  data = analyze({ repos, year, authors, lang, name: o.name || id.name || 'dev' });
  if (!data) fail(`No hay commits tuyos en ${year}.`, `No commits of yours in ${year}.`);
}

if (o.json) { console.log(JSON.stringify(data, null, 2)); process.exit(0); }

say(`${data.totals.commits} commits · ${data.totals.activeDays} días activos · racha de ${data.streak.days} días`,
  `${data.totals.commits} commits · ${data.totals.activeDays} active days · ${data.streak.days}-day streak`);

const fps = o.hq || o.fps === '60' ? 60 : 30;
const motionBlur = Boolean(o.hq || o.blur);
const out = path.resolve(o.out || `git-wrapped-${data.year}${o.vertical ? '-vertical' : ''}.mp4`);
mkdirSync(path.dirname(out), { recursive: true });
const publicDir = mkdtempSync(path.join(tmpdir(), 'git-wrapped-'));
let music = null;
if (!o['no-music']) {
  const src = o.music ? path.resolve(o.music) : path.join(root, 'assets/music.mp3');
  music = 'music' + path.extname(src);
  copyFileSync(src, path.join(publicDir, music));
}

const { bundle } = await import('@remotion/bundler');
const { renderMedia, renderStill, selectComposition } = await import('@remotion/renderer');

say('Preparando el video…', 'Preparing the video…');
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/remotion/index.ts'), publicDir });
const inputProps = { data, fps, music, motionBlur, vertical: Boolean(o.vertical) };
const composition = await selectComposition({ serveUrl, id: 'Wrapped', inputProps });
// La GPU (ANGLE) duplica la velocidad en Windows y macOS; en Linux sin GPU se usa el modo por defecto.
let gl = o.gl ?? (process.platform === 'linux' ? null : 'angle');
const chromium = () => (gl && gl !== 'default' ? { gl } : {});
const t0 = Date.now();
const media = (opts, label) => {
  let last = -1;
  return renderMedia({
    composition, serveUrl, inputProps, chromiumOptions: chromium(), ...opts,
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 100);
      if (p !== last && p % 5 === 0) { last = p; process.stdout.write(`\r${label} ${p}%   `); }
    },
  });
};
const withFallback = async fn => {
  try { return await fn(); } catch (err) {
    if (!gl || gl === 'default') throw err;
    say('\nLa aceleración por GPU falló; reintento sin ella…', '\nGPU acceleration failed; retrying without it…');
    gl = null;
    return fn();
  }
};

await withFallback(() => media({ codec: 'h264', outputLocation: out, crf: 18 }, es ? 'Renderizando' : 'Rendering'));
const base = out.replace(/\.mp4$/i, '');
writeFileSync(base + '.json', JSON.stringify(data, null, 2));
console.log('');

if (o.gif || o.readme) {
  // GIF a 15 fps y 720 px de ancho: liviano para un README
  await withFallback(() => media({ codec: 'gif', outputLocation: base + '.gif', everyNthFrame: fps / 15, scale: o.vertical ? 0.5 : 0.375, muted: true }, 'GIF'));
  console.log('');
  say(`GIF: ${base}.gif`, `GIF: ${base}.gif`);
}

if (!o['no-card']) {
  const cardProps = { data };
  const card = await selectComposition({ serveUrl, id: 'Card', inputProps: cardProps });
  await withFallback(() => renderStill({ composition: card, serveUrl, inputProps: cardProps, output: base + '.png', chromiumOptions: chromium() }));
  say(`Imagen resumen: ${base}.png`, `Summary card: ${base}.png`);
}

if (o.readme) {
  const { updateReadme } = await import('../src/readme.mjs');
  const readme = path.resolve(o.readme);
  const image = existsSync(base + '.gif') ? base + '.gif' : base + '.png';
  updateReadme({ readme, image, video: out, year: data.year, lang });
  say(`README actualizado: ${readme}`, `README updated: ${readme}`);
}

const secs = Math.round((Date.now() - t0) / 1000);
say(`Listo en ${secs} s: ${out}\nCompártelo con #GitWrapped`, `Done in ${secs}s: ${out}\nShare it with #GitWrapped`);
