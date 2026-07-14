# Changelog

All notable changes to this project are documented in this file. Format based
on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/); this project does
not yet follow strict semantic versioning guarantees, but version numbers are
tagged for reference.

## [1.0.0] - 2026-07-14

Initial public release of the portfolio template.

### Added
- Custom Node.js static site build (`node build.js`) — no framework, no
  client-side runtime aside from a small series-navigation modal.
- Markdown + YAML frontmatter content model: entries are directories under
  `blog/` and `projects/`; a single markdown file is a standalone post/project,
  multiple files form a series.
- Pages: Home, Projects index, Blog index, About, plus project devlog and blog
  post/series detail templates.
- Build pipeline: collect → parse (markdown-it, anchors, build-time syntax
  highlighting) → render → copy assets → write `dist/`.
- Token-based design system in `assets/styles.css` (warm cream + terracotta
  editorial palette).
- Series navigation modal for readers landing mid-series.
- Minimal zero-dependency `server.js` and an example systemd user unit for
  self-hosting behind a reverse proxy or tunnel.
- Public-template plumbing: gitignored real `site.config.js` / `about.md` /
  `.env` with committed `.example` fallbacks, and a `SHOW_EXAMPLES` flag that
  gates the shipped `example-*` demo content the same way as the `visible`
  frontmatter field.
- `README.md` as the public entry point; `CLAUDE.md` as the full architecture
  reference.
- MIT License.