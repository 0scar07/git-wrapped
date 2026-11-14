// Tests del analizador: crea repos de git temporales con commits en fechas conocidas.
process.env.TZ = 'UTC';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const { analyze, findRepos, isRepo } = await import('../src/analyze.mjs');

const ME = 'dev@example.com', OTHER = 'otra@example.com';
let root, repoA, repoB;

function makeRepo(dir) {
  mkdirSync(dir, { recursive: true });
  const g = (...a) => execFileSync('git', ['-C', dir, ...a], { stdio: 'pipe' });
  g('init', '-q', '-b', 'main');
  g('config', 'user.name', 'Dev');
  g('config', 'user.email', ME);
  g('config', 'commit.gpgsign', 'false');
  return (file, content, msg, date, email = ME) => {
    const p = path.join(dir, file);
    mkdirSync(path.dirname(p), { recursive: true });
    appendFileSync(p, content);
    g('add', '-A');
    execFileSync('git', ['-C', dir, 'commit', '-q', '-m', msg, `--author=Dev <${email}>`], {
      stdio: 'pipe', env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
    });
  };
}

before(() => {
  root = mkdtempSync(path.join(tmpdir(), 'gw-test-'));
  repoA = path.join(root, 'alpha');
  repoB = path.join(root, 'nested', 'beta');
  const a = makeRepo(repoA);
  // Racha de 3 días (10, 11 y 12 de marzo), con el 11 como mejor día
  a('src/app.ts', 'a\n', 'feat: inicio', '2026-03-10T23:30:00+00:00');
  a('src/app.ts', 'b\n', 'fix: bug del login', '2026-03-11T23:10:00+00:00');
  a('src/app.ts', 'c\n', 'fix: otro bug', '2026-03-11T23:20:00+00:00');
  a('src/util.py', 'x = 1\n', 'fix: bug en util', '2026-03-11T23:40:00+00:00');
  a('docs/README.md', '# hola\n', 'docs: readme', '2026-03-12T10:00:00+00:00');
  // Commit grande (con lockfile que se ignora)
  a('src/big.ts', 'line\n'.repeat(500), 'refactor: archivo grande', '2026-05-02T23:00:00+00:00');
  a('package-lock.json', '{}\n'.repeat(5000), 'chore: lockfile', '2026-05-03T23:00:00+00:00');
  // Generados que no deben contar: escena de Unity, bundle con hash y un archivo gigante
  a('Assets/Scenes/nivel.unity', 'x\n'.repeat(300), 'feat: escena', '2026-05-04T10:00:00+00:00');
  a('web/static/AppEntry-3f8b8a662770.js', 'y\n'.repeat(300), 'build: bundle', '2026-05-04T11:00:00+00:00');
  a('data/huge.ts', 'z\n'.repeat(12000), 'chore: datos generados', '2026-05-04T12:00:00+00:00');
  // De otro autor y de otro año: no cuentan
  a('src/app.ts', 'd\n', 'feat: ajeno', '2026-06-01T12:00:00+00:00', OTHER);
  a('src/app.ts', 'e\n', 'feat: año pasado', '2025-12-31T12:00:00+00:00');
  const b = makeRepo(repoB);
  b('main.go', 'package main\n', 'feat: go', '2026-07-01T09:00:00+00:00');
  writeFileSync(path.join(root, 'no-es-repo.txt'), 'hola');
});

after(() => rmSync(root, { recursive: true, force: true }));

const run = (repos, authors = [ME]) => analyze({ repos, year: 2026, authors, lang: 'es', name: 'Dev' });

test('cuenta solo los commits del autor en ese año', () => {
  const d = run([repoA]);
  assert.equal(d.totals.commits, 10);
  assert.equal(d.year, 2026);
  assert.equal(d.user.name, 'Dev');
});

test('sin autores cuenta a todos', () => {
  assert.equal(run([repoA], []).totals.commits, 11);
});

test('racha más larga y mejor día', () => {
  const d = run([repoA]);
  assert.deepEqual(d.streak, { days: 3, start: '2026-03-10', end: '2026-03-12' });
  assert.deepEqual(d.cards.bestDay, { date: '2026-03-11', count: 3 });
});

test('hora pico y moods', () => {
  const d = run([repoA]);
  assert.equal(d.cards.peak.hour, 23);
  assert.equal(d.moods.length, 5);
  assert.ok(d.moods.includes('night'));
  assert.ok(d.moods.includes('bugs'));
});

test('archivo más reescrito y commit más grande ignoran lockfiles', () => {
  const d = run([repoA]);
  assert.deepEqual(d.cards.file, { path: 'src/app.ts', count: 3 });
  assert.equal(d.cards.biggest.add, 500);
  assert.equal(d.cards.biggest.subject, 'refactor: archivo grande');
});

test('lenguajes ordenados con porcentajes', () => {
  const d = run([repoA]);
  assert.equal(d.languages[0].name, 'TypeScript');
  assert.ok(d.languages.some(l => l.name === 'Python'));
  assert.ok(d.languages.every(l => l.pct >= 1 && l.pct <= 100 && /^#/.test(l.color)));
});

test('con un solo repo muestra carpetas', () => {
  const d = run([repoA]);
  assert.equal(d.reposLabel, 'folders');
  assert.equal(d.repos[0].name, 'src');
  assert.equal(d.star.name, 'alpha');
});

test('con varios repos muestra repos y suma todo', () => {
  const d = run([repoA, repoB]);
  assert.equal(d.totals.commits, 11);
  assert.ok(d.repos.some(r => r.name === 'beta'));
  assert.ok(d.languages.some(l => l.name === 'Go'));
});

test('gráfica de 52 semanas y días de la semana', () => {
  const d = run([repoA]);
  assert.equal(d.graph.length, 364);
  assert.ok(d.graph.every(v => v >= 0 && v <= 4));
  assert.equal(d.weekdays.length, 7);
  assert.equal(d.weekdays.reduce((a, b) => a + b, 0), 10);
  assert.equal(d.log.length > 0, true);
});

test('año sin commits devuelve null', () => {
  assert.equal(analyze({ repos: [repoA], year: 2019, authors: [ME], lang: 'es', name: 'Dev' }), null);
});

test('findRepos encuentra repos anidados y isRepo descarta carpetas sueltas', () => {
  const found = findRepos(root).map(p => path.basename(p)).sort();
  assert.deepEqual(found, ['alpha', 'beta']);
  assert.equal(isRepo(root), false);
});

test('ignora archivos generados: Unity, bundles con hash y cambios gigantes', () => {
  const d = run([repoA]);
  assert.equal(d.cards.biggest.add, 500);
  assert.equal(d.totals.insertions < 1000, true);
  assert.ok(!d.languages.some(l => l.name === 'Unknown'));
});

test('emails con "+" de GitHub se comparan literalmente', () => {
  const d = analyze({ repos: [repoA], year: 2026, authors: ['DEV@EXAMPLE.COM', '123+dev@users.noreply.github.com'], lang: 'es', name: 'Dev' });
  assert.equal(d.totals.commits, 10);
});
