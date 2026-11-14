# Changelog

## 0.2.0 · 2026-11-14

- **GitHub Action** (`uses: 0scar07/git-wrapped@v1`): puts your Wrapped GIF on your profile README every December, linked to the video with sound.
- `--github <user>`: wrap any GitHub profile. Finds the repos pushed that year, clones them to a temp folder and analyzes them. A personal token adds private repos.
- `--gif` and `--readme <file>` (GIF between `<!-- git-wrapped:start -->` markers).
- January defaults to the previous year.
- The analyzer skips generated files: Unity/Godot assets, hashed bundles and single-file changes over 10,000 lines.
- GitHub noreply emails (with `+`) now match as plain text, case-insensitive.
- Fix: in the closing card the logo could overlap the name, because the text was measured before the Inter font finished loading.
- The npm package is now called `git-wrapped-video`. Installed globally, it also gives you the `git-wrapped` command.

## 0.1.0 · 2026-11-14

First release.

- `npx git-wrapped-video`: your year in git as an 18-second video, in English or Spanish.
- Stats: commits, active days, top repos or folders, top languages, coding moods, 52-week contribution graph, commits per weekday, longest streak, most rewritten file, peak hour, biggest commit and best day.
- Original synthesized soundtrack at 120 BPM, with sound effects synced to the scenes.
- `--vertical` for TikTok, Reels and Shorts.
- PNG summary card next to every video.
- `--hq` (60 fps + motion blur), `--scan`, `--author`, `--year`, `--music`, `--json` and `--data`.
- GPU rendering by default on Windows and macOS, with automatic fallback.
