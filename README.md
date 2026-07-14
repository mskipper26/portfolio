# Portfolio

A static, multi-page personal portfolio you author in **Markdown with YAML
frontmatter** and compile to plain HTML with a small **custom Node.js build
script** — no framework, no client runtime (except a tiny series modal). Warm,
editorial cream-and-terracotta design system, fully token-based.

Use it as a template for your own site: clone, personalize the private files,
add content, build, and serve the generated `dist/` directory anywhere.

## Quick start

```bash
npm install
npm run build      # writes dist/  (shows the example content out of the box)
npm run serve      # build + serve at http://localhost:8080
```

A fresh clone builds immediately using the committed `*.example` files and the
`example-*` demo posts/projects, so you can see the design before changing
anything.

## Make it yours

Your personal data is kept **out of version control** by `.gitignore`. Copy each
committed template to its real (gitignored) name and edit:

```bash
cp .env.example            .env
cp site.config.example.js  site.config.js
cp about.example.md        about.md
```

- **`site.config.js`** — name, domain, email, socials (GitHub / LinkedIn /
  optional eBay), portrait, nav, and per-page hero copy.
- **`about.md`** — your bio (frontmatter carries the School/Major/Class strip).
- **`assets/portrait.jpg`** — optional avatar (also gitignored). Missing → the
  design falls back to a striped placeholder.
- **`.env`** — set `SHOW_EXAMPLES=false` once you've added your own content, to
  hide the shipped demo entries from your live site.

The build always prefers your real file and falls back to the `.example` one, so
nothing breaks if you haven't copied a file yet.

## Adding content

An **entry is a directory** under `blog/` or `projects/`; the directory name is
the URL slug.

- **One** `.md` file → a standalone post/project.
- **Two or more** `.md` files → a **series** (set `series` + `order` on each).

```bash
mkdir blog/my-first-post
$EDITOR blog/my-first-post/index.md
```

```yaml
---
title: "My first post"
description: "A one-line summary used in listings and meta tags."
date: 2026-07-01
# series: "My Series"   # only for multi-part entries
# order: 1              # required when series is set
# image: cover.png      # optional; path relative to this directory
# visible: false        # optional; hides the entry
# --- projects only ---
# tag: "Web · Prototype"
# featured: true        # promote to the homepage
# demo: "https://…"
# source: "https://…"
---

Your **Markdown** here. Code blocks are syntax-highlighted at build time.
```

Everything you add under `blog/` and `projects/` is gitignored automatically
(only the shipped `example-*` entries are committed), so your content stays
private. Rebuild after any change: `npm run build`.

See **`CLAUDE.md`** for the full architecture, frontmatter schema, URL scheme,
and the public-template mechanics (§11).

## Deploying

Build, then serve the static `dist/` directory with any web server. A minimal
zero-dependency `server.js` is included (default `127.0.0.1:8137`, override with
`PORT`/`HOST`) for the self-hosted case behind a reverse proxy or tunnel, along
with an example systemd user unit at `deploy/portfolio.service`.

```bash
node build.js && node server.js
```

## Comments (optional)

Project detail pages and individual blog pages can host a reader comment section
(name ≤ 25 chars, comment ≤ 200 chars, per-page threads, hover-to-delete with a
key). It's **off by default** so the template builds with zero backend. Enabling
it adds a small backend: a **Postgres** database and a **Node comment API**, both
run via **Docker Compose**. The static site stays static — comments load
client-side and degrade gracefully to "unavailable" if the API is down.

**1. Configure secrets** (in your gitignored `.env`):

```bash
cp .env.example .env    # then set POSTGRES_PASSWORD and COMMENT_DELETE_KEY
```

`COMMENT_DELETE_KEY` is the key a visitor must type to delete a comment.

**2. Start the backend:**

```bash
docker compose up -d          # brings up Postgres + the API
docker compose ps             # both services should be healthy
curl http://127.0.0.1:8138/api/health   # -> {"ok":true}
```

The API is published on **loopback only** (`127.0.0.1:8138`); Postgres has no
published port. Data persists in the `pgdata` Docker volume.

**3. Turn comments on** in your `site.config.js`:

```js
comments: { enabled: true, apiBase: "/api" },
```

Then rebuild (`npm run build`).

**4. Expose the API through your proxy/tunnel.** The static server (`:8137`) and
the comment API (`:8138`) are two loopback services. The API accepts its routes
with **or without** a leading `/api`, so no path rewrite is ever needed. Pick one:

- **Same-origin path** (`apiBase: "/api"`, no CORS) — route `/api/` to the API:

  ```nginx
  location /api/ { proxy_pass http://127.0.0.1:8138; }
  location /     { proxy_pass http://127.0.0.1:8137; }
  ```

- **Dedicated subdomain** (e.g. Cloudflare Tunnel) — add a public hostname
  `api.<your-domain>` → `http://localhost:8138` with **Path left blank**, then:
  1. set `ALLOW_ORIGIN=https://<your-domain>` in `.env` and re-run
     `docker compose up -d` (cross-origin needs CORS), and
  2. set `apiBase: "https://api.<your-domain>"` in `site.config.js` and rebuild.

Verify: `curl https://<your-domain>/api/health` (or
`curl https://api.<your-domain>/health`) → `{"ok":true}`.

## Project layout

```
build/            build logic (collect, parse, render, assets, util)
templates/        plain JS template functions (one HTML string each)
assets/           styles.css, modal.js, comments.js, favicon — copied to dist/
blog/             blog entries (yours are gitignored; example-* ship)
projects/         project entries (same)
build.js          orchestrator:  node build.js
server.js         minimal static server for dist/
api/              comment API (Node + Postgres) — optional, see Comments
docker-compose.yml  Postgres + comment API for the optional comments feature
CLAUDE.md         architecture & conventions (source of truth)
```

## License

[MIT](LICENSE)