<div align="center">

# git wrapped

**Tu año en git, en un video de 18 segundos.**

Un solo comando lee tu historial de commits y genera un MP4 para compartir al estilo Wrapped: tus repos top, tus lenguajes, tus moods de programación, tu gráfica de contribuciones, tu racha más larga, tu hora pico y más.

[English](README.md)

<!-- aquí va el video de demo -->

</div>

## Empieza

```bash
npx git-wrapped
```

Ejecútalo dentro de cualquier repositorio de git. El video se guarda como `git-wrapped-<año>.mp4`.

¿Tienes varios proyectos? Apúntalo a la carpeta que los contiene:

```bash
npx git-wrapped --scan ~/code
```

Todo corre en tu computadora. Tu código nunca sale de ella: solo se lee `git log`.

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
| `--year <aaaa>` | Año a analizar (por defecto, el actual) |
| `--author <email>` | Tu email de git. Repítelo si usaste varios (por defecto, `git config user.email`) |
| `--name <texto>` | Nombre que se muestra en el video |
| `--lang es\|en` | Idioma del video (por defecto, el de tu sistema) |
| `--music <archivo>` | Música de fondo (mp3 o wav), con entrada y salida suaves |
| `--fps 30\|60` | Fotogramas por segundo (30 por defecto; 60 es más fluido y tarda el doble) |
| `--gl <modo>` | Renderizado de Chrome: `angle` (GPU, por defecto en Windows y macOS), `swangle`, `default` |
| `-o, --out <archivo>` | Archivo de salida |
| `--json` | Solo imprime los datos, sin renderizar |
| `--data <archivo>` | Renderiza desde un JSON guardado (puedes editarlo antes) |
| `--demo` | Renderiza con datos de ejemplo |

Junto a cada video se guarda un JSON con los datos, así puedes cambiar un nombre y volver a renderizar con `--data`.

## Desarrollo

```bash
npm install
npm run studio   # preview en vivo en Remotion Studio con los datos de ejemplo
npm run demo     # renderiza el video de ejemplo
```

Hecho con [Remotion](https://www.remotion.dev). Cada fotograma es una función pura del tiempo, así que los renders son deterministas.

## Créditos

La coreografía está inspirada en el prompt de motion graphics *wrapped* de **@itskeo5**.

Sin relación con Spotify ni con GitHub.

## Licencia

MIT
