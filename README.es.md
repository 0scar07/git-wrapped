<div align="center">

# git wrapped

**Tu año en git, en un video de 18 segundos.**

Un solo comando lee tu historial de commits y genera un MP4 para compartir al estilo Wrapped: tus repos top, tus lenguajes, tus moods de programación, tu gráfica de contribuciones, tu racha más larga, tu hora pico y más. Con banda sonora propia.

[![npm](https://img.shields.io/npm/v/git-wrapped-video?color=9D8CFF&label=npm)](https://www.npmjs.com/package/git-wrapped-video)
[![CI](https://github.com/0scar07/git-wrapped/actions/workflows/ci.yml/badge.svg)](https://github.com/0scar07/git-wrapped/actions/workflows/ci.yml)
[![licencia](https://img.shields.io/badge/licencia-MIT-9D8CFF)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18.17-9D8CFF)](https://nodejs.org)

[English](README.md)

<img src="docs/demo-es.gif" alt="Demo de git wrapped: intro, repos top, lenguajes, moods, gráfica de contribuciones y cierre" width="720">

<sub>Datos de ejemplo. El video completo con sonido está en <a href="https://github.com/0scar07/git-wrapped/releases">Releases</a>.</sub>

</div>

## Empieza

```bash
npx git-wrapped-video
```

Ejecútalo dentro de cualquier repositorio de git. El video se guarda como `git-wrapped-<año>.mp4`.

¿Tienes varios proyectos? Apúntalo a la carpeta que los contiene:

```bash
npx git-wrapped-video --scan ~/code
```

O haz el Wrapped de cualquier perfil público de GitHub, sin clonar nada a mano:

```bash
npx git-wrapped-video --github torvalds
```

¿Lo usas seguido? Instálalo una vez con `npm i -g git-wrapped-video` y ejecuta `git-wrapped` desde cualquier carpeta.

**Tu código nunca sale de tu computadora.** Solo se lee `git log` en local. No se sube nada y no hace falta cuenta ni token. (Con `--github` se leen datos públicos de la API de GitHub y esos repos se clonan en una carpeta temporal que se borra al terminar).

## En tu perfil de GitHub

Muestra tu año arriba de tu perfil, actualizado solo. En el repo de tu perfil (el que se llama como tu usuario), crea `.github/workflows/git-wrapped.yml`:

```yaml
name: git wrapped
on:
  schedule:
    - cron: '0 12 20 12 *'   # cada 20 de diciembre
  workflow_dispatch:          # o ejecútalo a mano desde la pestaña Actions

permissions:
  contents: write

jobs:
  wrapped:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: 0scar07/git-wrapped@v1
        with:
          lang: es
          timezone: America/Bogota   # la tuya, para la hora pico
```

Genera tu video, el GIF y la tarjeta en `git-wrapped/` y pone el GIF en tu `README.md`, enlazado al video con sonido. Pon estas dos líneas donde lo quieras; si no, va al final:

```md
<!-- git-wrapped:start -->
<!-- git-wrapped:end -->
```

| Entrada | Por defecto | Qué hace |
|---|---|---|
| `user` | dueño del repo | A quién hacerle el Wrapped |
| `year` | el actual (en enero, el anterior) | Año |
| `lang` | `en` | `en` o `es` |
| `timezone` | `UTC` | Tu zona horaria, ej. `America/Bogota`, para que la hora pico sea la tuya (los runners usan UTC) |
| `token` | `github.token` | Solo ve repos públicos. Para incluir privados, pasa un token personal *fine-grained* con **Contents** y **Metadata** en solo lectura, guardado como secreto |
| `max-repos` | `15` | Cuántos de tus repos con push más reciente se analizan |
| `readme` | `README.md` | README a actualizar (vacío para omitirlo) |
| `output-dir` | `git-wrapped` | Dónde se guardan los archivos |
| `vertical` | `false` | Genera también el video 9:16 |
| `commit` | `true` | Hace commit y push de los resultados |

**Requisitos:** Node.js 18.17+ y git. La primera vez tarda un par de minutos: npx instala el renderizador y descarga un Chrome sin interfaz (solo una vez).

## Qué sale en el video

| Tiempo | Escena |
|---|---|
| 0–1.5 s | Intro: *Tu 2026 en código* |
| 1.5–3.2 s | Tus 3 repos más activos (o carpetas, si pasas un solo repo) |
| 3.2–4.9 s | Tus 4 lenguajes top y luego tus moods |
| 4.9–8.3 s | Tu repo estrella: commits, días activos y líneas añadidas |
| 8.3–9.8 s | Tu gráfica de contribuciones, con zoom |
| 9.8–11.2 s | *Este fue tu ritmo*, con tu racha más larga |
| 11.2–12.5 s | Commits por día de la semana |
| 12.5–14 s | Archivo más reescrito, hora pico, commit más grande y tu mejor día |
| 14–18 s | Cierre |

Los **moods** salen de tu historial: Nocturno, Madrugador, Fin de semana, Refactor, Cazabugs, Documentador, Tester, Maratonista y Constructor.

## Opciones

| Opción | Qué hace |
|---|---|
| `--scan <carpeta>` | Busca repos de git dentro de una carpeta (2 niveles) |
| `--github <usuario>` | Analiza los repos de un usuario de GitHub (se clonan en una carpeta temporal). Con `--token` o `GITHUB_TOKEN` incluye tus privados |
| `--max-repos <n>` | Máximo de repos con `--github` (15 por defecto) |
| `--tz <zona>` | Zona horaria para la hora pico, ej. `America/Bogota` (por defecto, la de tu sistema) |
| `--year <aaaa>` | Año a analizar (por defecto, el actual) |
| `--author <email>` | Tu email de git. Repítelo si usaste varios (por defecto, `git config user.email`) |
| `--name <texto>` | Nombre que se muestra en el video |
| `--lang es\|en` | Idioma del video (por defecto, el de tu sistema) |
| `--music <archivo>` | Tu propia música (mp3 o wav) en vez de la incluida |
| `--no-music` | Video sin audio |
| `--vertical` | Video vertical 9:16 para TikTok, Reels y Shorts |
| `--no-card` | No generar la imagen resumen PNG |
| `--gif` | Genera también un GIF (para READMEs) |
| `--readme <archivo>` | Pone el GIF en ese README, entre marcadores |
| `--fps 30\|60` | Fotogramas por segundo (30 por defecto; 60 es más fluido y tarda el doble) |
| `--blur` | Desenfoque de movimiento con 4 subfotogramas (unas 4 veces más lento) |
| `--hq` | Máxima calidad: 60 fps + desenfoque de movimiento |
| `--gl <modo>` | Renderizado de Chrome: `angle` (GPU, por defecto en Windows y macOS), `swangle`, `default` |
| `-o, --out <archivo>` | Archivo de salida |
| `--json` | Solo imprime los datos, sin renderizar |
| `--data <archivo>` | Renderiza desde un JSON guardado (puedes editarlo antes) |
| `--demo` | Renderiza con datos de ejemplo |

Junto a cada video también obtienes:

- **Una imagen resumen** (`.png`) lista para X o LinkedIn:

  <img src="docs/social-preview.png" alt="Imagen resumen con commits, días activos, racha más larga, lenguaje top, repo estrella, gráfica de contribuciones, moods y commits por día" width="560">

- **Los datos** (`.json`), para cambiar un nombre y volver a renderizar con `--data`.

### Para TikTok, Reels y Shorts

```bash
npx git-wrapped-video --vertical
```

Las mismas escenas, acomodadas para una pantalla de 1080×1920.

### ¿Cuánto tarda?

Unos 2 minutos con las opciones por defecto en una laptop modesta (Ryzen 3 de 4 hilos), menos en un equipo más rápido. `--hq` tarda unas 3 veces más.

## Compártelo

Publica tu video con **#GitWrapped**. Ver el año de los demás es la mitad de la gracia.

## Desarrollo

```bash
npm install
npm run studio   # preview en vivo en Remotion Studio con los datos de ejemplo
npm run demo     # renderiza el video de ejemplo
npm run music    # vuelve a generar la banda sonora (necesita ffmpeg)
npm test         # tests del analizador
```

Hecho con [Remotion](https://www.remotion.dev). Cada fotograma es una función pura del tiempo, así que los renders son deterministas.

La banda sonora es original: una pista de 120 BPM y sus efectos se sintetizan desde cero con [`scripts/make-music.mjs`](scripts/make-music.mjs), sincronizados con las escenas, y van con la misma licencia MIT.

Las contribuciones son bienvenidas: escenas nuevas, moods, lenguajes o traducciones. Mira [CONTRIBUTING.md](CONTRIBUTING.md).

## Créditos

La coreografía está inspirada en el prompt de motion graphics *wrapped* de **@itskeo5**.

Sin relación con Spotify ni con GitHub.

## Licencia

[MIT](LICENSE)
