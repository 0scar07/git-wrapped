// Modo --github: busca los repos de un usuario en GitHub, los clona solo con la historia necesaria
// y devuelve las rutas y los emails de autor para el analizador.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const API = 'https://api.github.com';

async function gh(url, token) {
  const res = await fetch(url.startsWith('http') ? url : API + url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'git-wrapped-video',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = new Error(`GitHub API ${res.status} en ${url.replace(API, '')}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Busca los repos donde el usuario hizo push durante el año.
 * Con un token personal del mismo usuario incluye también los privados.
 */
export async function findGithubRepos({ user, token, year, max = 15, includeForks = false }) {
  const profile = await gh(`/users/${encodeURIComponent(user)}`, token);
  let own = false;
  if (token) {
    try { own = (await gh('/user', token)).login.toLowerCase() === profile.login.toLowerCase(); } catch { /* token de Actions: sin /user */ }
  }
  const start = new Date(Date.UTC(year, 0, 1));
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const list = own
      ? await gh(`/user/repos?affiliation=owner,collaborator&sort=pushed&per_page=100&page=${page}`, token)
      : await gh(`/users/${encodeURIComponent(profile.login)}/repos?type=owner&sort=pushed&per_page=100&page=${page}`, token);
    repos.push(...list);
    if (list.length < 100 || new Date(list[list.length - 1].pushed_at) < start) break;
  }
  const picked = repos
    .filter(r => new Date(r.pushed_at) >= start && !r.archived && (includeForks || !r.fork) && r.size > 0)
    .slice(0, max)
    .map(r => ({ name: r.name, fullName: r.full_name, url: r.clone_url, private: r.private, branch: r.default_branch }));
  return { profile: { login: profile.login, id: profile.id, name: profile.name?.trim() || profile.login }, repos: picked };
}

/** Emails con los que el usuario firmó commits en esos repos, más sus direcciones noreply de GitHub. */
export async function findAuthorEmails({ profile, repos, token, year }) {
  const emails = new Set([
    `${profile.id}+${profile.login}@users.noreply.github.com`.toLowerCase(),
    `${profile.login}@users.noreply.github.com`.toLowerCase(),
  ]);
  const since = `${year}-01-01T00:00:00Z`, until = `${year + 1}-01-01T00:00:00Z`;
  for (const r of repos) {
    try {
      const commits = await gh(`/repos/${r.fullName}/commits?author=${encodeURIComponent(profile.login)}&since=${since}&until=${until}&per_page=100`, token);
      for (const c of commits) if (c.commit?.author?.email) emails.add(c.commit.author.email.toLowerCase());
    } catch { /* repo vacío o sin acceso: se ignora */ }
  }
  return [...emails];
}

/** Clona cada repo con la historia desde diciembre del año anterior (el margen evita contar el commit frontera). */
export function cloneRepos({ repos, dir, year, token, log = () => {} }) {
  mkdirSync(dir, { recursive: true });
  const auth = token ? ['-c', `http.https://github.com/.extraheader=AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`] : [];
  const out = [];
  for (const r of repos) {
    const dest = path.join(dir, r.name);
    try {
      execFileSync('git', [...auth, 'clone', '--quiet', '--no-checkout', '--single-branch', `--shallow-since=${year - 1}-12-01`, r.url, dest],
        { stdio: 'pipe', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
      out.push(dest);
      log(r.fullName);
    } catch {
      log(`${r.fullName} (omitido)`);
    }
  }
  return out;
}
