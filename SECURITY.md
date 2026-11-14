# Security

git-wrapped runs entirely on your machine. It reads `git log` from the folders you point it at and writes a video, a PNG and a JSON next to it. It makes no network calls of its own besides downloading fonts and, on first run, a headless Chrome used for rendering. With `--github` (and in the GitHub Action) it also calls the GitHub API and clones the selected repos into a temporary folder that is deleted afterwards; a token, if given, is only sent to github.com.

## Reporting a vulnerability

Please **don't open a public issue**. Use GitHub's private reporting instead: **Security → Report a vulnerability** in this repository. You'll get an answer within a few days.

---

**Español:** si encuentras una vulnerabilidad, no abras un issue público. Usa **Security → Report a vulnerability** en este repositorio.
