export type Lang = 'es' | 'en';

const S = {
  es: {
    intro1: (y: number) => `Tu ${y}`, intro2: 'en código',
    madeForYou: 'Hecho para ti',
    reposTitle: (y: number) => `Tus repos de ${y}`, foldersTitle: (y: number) => `Tus carpetas de ${y}`,
    commits: 'commits', langs: 'Tus lenguajes', moodsTitle: 'Todos tus moods',
    moods: { night: 'Nocturno', early: 'Madrugador', weekend: 'Fin de semana', refactor: 'Refactor', bugs: 'Cazabugs', docs: 'Documentador', tests: 'Tester', marathon: 'Maratonista', feature: 'Constructor' } as Record<string, string>,
    repo: 'Repositorio', starLabel: 'REPO ESTRELLA', activeDays: 'días activos', lines: 'líneas', seeYear: 'Ver tu año',
    rhythm1: 'Este fue', rhythm2: 'tu ritmo',
    streak: (n: number) => `Racha más larga · ${n} ${n === 1 ? 'día' : 'días'}`,
    weekTitle: 'Hecho en tu día a día', days: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
    fileK: 'Archivo más reescrito', changes: (n: number) => `${n} cambios`,
    peakK: 'Hora pico', hour: (h: number) => `${String(h % 12 || 12).padStart(2, '0')}:00 ${h < 12 ? 'a. m.' : 'p. m.'}`,
    peakMood: (h: number) => (h >= 22 || h < 5 ? 'Modo nocturno' : h < 12 ? 'Modo mañana' : h < 18 ? 'Modo tarde' : 'Modo noche'),
    biggestK: 'Commit más grande', bestDayK: 'Tu mejor día',
    date: (iso: string) => { const [, m, d] = iso.split('-').map(Number); return `${d} ${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][m - 1]}`; },
    tag1: (y: number) => `Tu ${y} en código`, tag2: 'ya está aquí',
    streakK: 'racha más larga', topLangK: 'lenguaje top', days_: (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`,
    cardTitle1: (y: number) => `Mi ${y}`, cardTitle2: 'en código', topRepoK: 'Repo estrella', makeYours: 'Haz el tuyo',
  },
  en: {
    intro1: (y: number) => `Your ${y}`, intro2: 'in code',
    madeForYou: 'Made for you',
    reposTitle: (y: number) => `Your ${y} repos`, foldersTitle: (y: number) => `Your ${y} folders`,
    commits: 'commits', langs: 'Your languages', moodsTitle: 'All your moods',
    moods: { night: 'Night owl', early: 'Early bird', weekend: 'Weekender', refactor: 'Refactorer', bugs: 'Bug hunter', docs: 'Documenter', tests: 'Tester', marathon: 'Marathoner', feature: 'Builder' } as Record<string, string>,
    repo: 'Repository', starLabel: 'TOP REPO', activeDays: 'active days', lines: 'lines', seeYear: 'See your year',
    rhythm1: 'This was', rhythm2: 'your rhythm',
    streak: (n: number) => `Longest streak · ${n} ${n === 1 ? 'day' : 'days'}`,
    weekTitle: 'Made day by day', days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    fileK: 'Most rewritten file', changes: (n: number) => `${n} changes`,
    peakK: 'Peak hour', hour: (h: number) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`,
    peakMood: (h: number) => (h >= 22 || h < 5 ? 'Night owl mode' : h < 12 ? 'Morning mode' : h < 18 ? 'Afternoon mode' : 'Evening mode'),
    biggestK: 'Biggest commit', bestDayK: 'Your best day',
    date: (iso: string) => { const [, m, d] = iso.split('-').map(Number); return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${d}`; },
    tag1: (y: number) => `Your ${y} in code`, tag2: 'is here',
    streakK: 'longest streak', topLangK: 'top language', days_: (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`,
    cardTitle1: (y: number) => `My ${y}`, cardTitle2: 'in code', topRepoK: 'Top repo', makeYours: 'Make yours',
  },
};

export const strings = (l: Lang) => S[l] ?? S.en;

export const fmt = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n));
