# Changelog

All notable changes to this project are documented in this file. Format based
on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/); this project does
not yet follow strict semantic versioning guarantees, but version numbers are
tagged for reference.

## [1.1.0] - 2026-07-14

### Added
- **Reader comments** on project detail pages and individual blog pages
  (standalone posts and each series part), each thread keyed by the page's URL
  path. The feature is **config-gated off by default** (`site.config.js` →
  `comments.enabled`), so the static template still builds and serves with zero
  backend.
- **Containerized backend** for comments: a Postgres database and a
  zero-framework Node comment API (`api/`), orchestrated with `docker-compose.yml`
  and published on loopback only. Length limits, the empty-name → `"Anonymous"`
  default, and timing-safe delete-key authorization are enforced server-side; all
  queries are parameterized and comment text is rendered client-side via
  `textContent` (never `innerHTML`).
- **Comment UI**: name (≤ 25 chars) + comment (≤ 200 chars) form styled as a
  panel, initial avatars, a live comment count in the heading, a live character
  counter, and a graceful "unavailable" fallback when the API is down.
- **Styled delete dialog**: deleting a comment now opens a custom modal (matching
  the mid-series dialog) that collects the delete key and shows an inline error on
  a wrong key — replacing the browser `prompt()`/`alert()`. The delete control is
  a trash-can icon revealed on hover.
- **Server-side profanity filter**: comment submissions are screened against a
  blocklist (`api/banned-words.txt`, override with `BANNED_WORDS_FILE`). Matching
  is whole-word only after lowercasing, undoing common leet substitutions, and
  collapsing repeated letters, so clean words are not falsely flagged.
- **Asset cache-busting**: `styles.css` and per-page scripts are referenced with a
  content-hash query (`?v=<hash>`), so a rebuilt asset is served under a new URL
  and can never be served stale by a browser or CDN.
- New `.env` keys for the comments backend (`POSTGRES_*`, `COMMENT_DELETE_KEY`,
  `API_PORT`, `ALLOW_ORIGIN`, optional `BANNED_WORDS_FILE`) and expanded
  `README.md` / `CLAUDE.md` (§12) documentation covering setup, thread identity,
  and same-origin vs dedicated-subdomain deployment.

### Changed
- The series "start from the beginning?" modal was refactored onto a shared
  `.modal` CSS base so it and the comment delete dialog share one visual
  treatment.

## [1.0.1] - 2026-07-14

### Changed
- Markdown rendering now allows raw HTML (`markdown-it` `html: true`), so
  entries can embed HTML and inline `<script>` for small interactive elements.

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