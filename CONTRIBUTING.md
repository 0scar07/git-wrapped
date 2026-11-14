# Contributing

Thanks for wanting to help! *Español más abajo.*

## Setup

```bash
git clone https://github.com/0scar07/git-wrapped
cd git-wrapped
npm install
npm run studio   # live preview with sample data
```

## Project map

| Path | What lives there |
|---|---|
| `src/analyze.mjs` | Reads `git log` and computes every stat |
| `src/remotion/Wrapped.tsx` | The 18-second video. Every scene is a pure function of time `t` |
| `src/remotion/Card.tsx` | The PNG summary card |
| `src/remotion/strings.ts` | All texts, per language |
| `bin/cli.mjs` | The command line |
| `scripts/make-music.mjs` | Synthesizes the soundtrack |
| `tests/` | Analyzer tests (temporary git repos with known commits) |

## Before opening a PR

```bash
npm run typecheck
npm test
npm run demo     # renders out the sample video, check it looks right
```

- Keep animations deterministic: no `Math.random()` or `Date.now()` inside scenes.
- Motion: smooth ease in/out, no bounces, no shakes.
- New texts go in `strings.ts` for **every** language.

## Good first contributions

- **A new language:** copy the `en` block in `src/remotion/strings.ts`, translate it, and add the code to `Lang` and to the `--lang` check in `bin/cli.mjs`.
- **A new mood:** add a score in `src/analyze.mjs` and its name in `strings.ts`.
- **A new language color** in `LANG_COLORS`.

---

# Contribuir

¡Gracias por querer ayudar!

1. Instala con `npm install` y abre el preview con `npm run studio`.
2. Antes del PR corre `npm run typecheck`, `npm test` y `npm run demo`.
3. Las animaciones deben ser deterministas: nada de `Math.random()` ni `Date.now()` dentro de las escenas.
4. Los textos nuevos van en `src/remotion/strings.ts`, en **todos** los idiomas.

Contribuciones fáciles para empezar: un idioma nuevo, un mood nuevo o el color de un lenguaje.
