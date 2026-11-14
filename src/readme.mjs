// Inserta (o actualiza) el bloque de git wrapped en un README, entre marcadores.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const START = '<!-- git-wrapped:start -->';
export const END = '<!-- git-wrapped:end -->';

const rel = (from, to) => path.relative(path.dirname(from), to).split(path.sep).join('/');

export function readmeBlock({ readme, image, video, year, lang }) {
  const es = lang === 'es';
  const alt = es ? `Mi ${year} en código` : `My ${year} in code`;
  const watch = es ? 'ver con sonido' : 'watch with sound';
  const made = es ? 'Hecho con' : 'Made with';
  return [
    START,
    `<a href="${rel(readme, video)}"><img src="${rel(readme, image)}" alt="${alt}" width="640"></a>`,
    '',
    `<sub>${made} <a href="https://github.com/0scar07/git-wrapped">git wrapped</a> · <a href="${rel(readme, video)}">${watch}</a></sub>`,
    END,
  ].join('\n');
}

export function updateReadme(opts) {
  const block = readmeBlock(opts);
  const text = existsSync(opts.readme) ? readFileSync(opts.readme, 'utf8') : '';
  const s = text.indexOf(START), e = text.indexOf(END);
  const next = s !== -1 && e > s
    ? text.slice(0, s) + block + text.slice(e + END.length)
    : (text.trimEnd() ? text.trimEnd() + '\n\n' : '') + block + '\n';
  if (next !== text) writeFileSync(opts.readme, next);
  return next !== text;
}
