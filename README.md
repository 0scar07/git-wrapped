<div align="center">

# git wrapped

**Your year in git, as an 18-second video.**

One command reads your commit history and renders a shareable Wrapped-style MP4: your top repos, languages, coding moods, contribution graph, longest streak, peak hour and more.

[Español](README.es.md)

<!-- demo video goes here -->

</div>

## Quick start

```bash
npx git-wrapped
```

Run it inside any git repository. The video is saved as `git-wrapped-<year>.mp4`.

Got several projects? Point it at the folder that holds them:

```bash
npx git-wrapped --scan ~/code
```

Everything runs locally. Your code never leaves your machine: it only reads `git log`.

## What's in the video

| Time | Scene |
|---|---|
| 0–1.5 s | Intro: *Your 2026 in code* |
| 1.5–3.2 s | Your 3 most active repos (or folders, if you pass a single repo) |
| 3.2–4.9 s | Top 4 languages, then your coding moods |
| 4.9–8.3 s | Your top repo: commits, active days, lines added |
| 8.3–9.8 s | Your contribution graph, with a deep zoom |
| 9.8–11.2 s | *This was your rhythm*, with your longest streak |
| 11.2–12.5 s | Commits per day of the week |
| 12.5–14 s | Most rewritten file, peak hour, biggest commit, best day |
| 14–18 s | Closing card |

**Moods** are picked from your history: Night owl, Early bird, Weekender, Refactorer, Bug hunter, Documenter, Tester, Marathoner and Builder.

## Options

| Flag | What it does |
|---|---|
| `--scan <dir>` | Find git repos inside a folder (2 levels deep) |
| `--year <yyyy>` | Year to analyze (default: current year) |
| `--author <email>` | Your git email. Repeat it if you used several (default: `git config user.email`) |
| `--name <text>` | Name shown in the video |
| `--lang es\|en` | Video language (default: your system language) |
| `--music <file>` | Background music (mp3 or wav), with a fade in and out |
| `--fps 30\|60` | Frame rate (default 30; 60 is smoother and takes twice as long) |
| `--gl <mode>` | Chrome rendering: `angle` (GPU, default on Windows and macOS), `swangle`, `default` |
| `-o, --out <file>` | Output file |
| `--json` | Print the computed data and skip rendering |
| `--data <file>` | Render from a saved JSON (edit it first if you want) |
| `--demo` | Render with sample data |

A JSON with the data is saved next to every video, so you can tweak a name and render again with `--data`.

## Development

```bash
npm install
npm run studio   # live preview in Remotion Studio with the sample data
npm run demo     # render the sample video
```

Built with [Remotion](https://www.remotion.dev). Every frame is a pure function of time, so renders are deterministic.

## Credits

The choreography is inspired by the *wrapped* motion-graphics prompt by **@itskeo5**.

Not affiliated with Spotify or GitHub.

## License

MIT
