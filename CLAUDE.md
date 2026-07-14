# CLAUDE.md — Portfolio Site Architecture

This file is the source of truth for how this **static portfolio template** is
built. Read it fully before implementing anything. It is written for future
development sessions. The build is implemented — see `README.md` for setup and
`PROGRESS.md` (gitignored; a `PROGRESS.md.example` ships as a starting point) for
your own status log.

> **This is a public template.** Your personal details (site config, About page,
> posts, projects, portrait) are kept out of version control via `.gitignore`;
> the committed tree holds `*.example` files and `example-*` demo content. See §11.

> **Working convention:** keep this file (`CLAUDE.md`) in sync when a change
> affects the architecture, frontmatter schema, or build behavior, and log
> what/when in your own `PROGRESS.md`. Docs are part of the change, not an
> afterthought.

---

## 1. What this site is

A **static, multi-page personal portfolio**. Content — blog posts and projects —
is authored as **Markdown with YAML frontmatter** and compiled to plain static
HTML by a **custom Node.js build script**. There is no server-side runtime and no
client-side framework. The output is a folder of static files.

**Pages:** Home, Projects, Blog, About.

### Hosting / deploy target

- Designed to be served from **any static host** — a home server behind a
  reverse proxy or tunnel (nginx/Caddy/Cloudflare Tunnel), object storage, or a
  static-site host. A minimal zero-dependency `server.js` and an example systemd
  user unit (`deploy/portfolio.service`) are included for the self-hosted case.
- The site is built for the **domain root**, so it uses **root-relative URLs**
  (`/blog/...`, `/assets/...`, `/projects/...`). No base-path prefixing.
- **Deploy model:** run the build → the web server serves the generated `dist/`
  directory. The build is **manual**, run when new content is added. No CI
  pipeline is assumed.

---

## 2. Design system (extracted from the Claude Design source)

The five files at repo root (`home.html`, `blog.html`, `projects.html`,
`about.html`, `navbar.html`) are **bundled Claude Design exports** — the real
markup is base64/JSON-encoded inside a `<script type="__bundler/template">` tag
and uses a proprietary `dc` element vocabulary (`<x-dc>`, `<dc-import>`,
`<sc-if>`, `<x-import>`). **These files are reference-only and will NOT ship.**
Decoded copies were saved to the session scratchpad during planning; if you need
to re-derive them, extract and `JSON.parse` the `__bundler/template` script tag.

Distill them into a real design system. The visual language is a **warm,
editorial, cream-and-terracotta** aesthetic with system fonts and pill buttons.

### Design tokens (define as CSS custom properties on `:root`)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#f5efe6` | Page background (warm cream) |
| `--bg-alt` | `#ece3d6` | Alternating section background ("From the Blog") |
| `--ink` | `#23201b` | Primary text / dark buttons |
| `--ink-68` | `rgba(35,32,27,0.68)` | Body copy |
| `--ink-65` | `rgba(35,32,27,0.65)` | Secondary copy |
| `--ink-45` | `rgba(35,32,27,0.45)` | Footer / muted |
| `--rule` | `rgba(35,32,27,0.12)` | Hairline dividers between list items |
| `--accent` | `#c1613f` | Terracotta accent (eyebrows, links, active nav) |
| `--accent-hover` | `#a24d31` | Link hover |
| `--tag-bg` | `#f0d9c8` | Category/tag pill background |
| `--placeholder` | `repeating-linear-gradient(45deg,#e8ded0,#e8ded0 10px,#ded2c0 10px,#ded2c0 20px)` | Image placeholder fallback |
| `--font` | `-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif` | Everything |
| `--radius-card` | `8–12px` | Cards / images |
| `--radius-pill` | `999px` | Buttons |

### Layout constants

- Content max-width **1000px**; centered text blocks **760px**; About column **680px**.
- Standard horizontal padding **40px**.
- Eyebrow label: 13px, uppercase, `letter-spacing:.14em`, `--accent`, weight 600.
- H1 hero: 44–72px, weight 700, `letter-spacing:-0.02em/-0.03em`.
- Section H2: 26px, weight 700.
- Buttons: dark filled (`--ink` bg, `--bg` text) = primary; outlined
  (`1px solid rgba(35,32,27,0.2)`) = secondary. Both pill-shaped.

### Component inventory (recurring UI to build as CSS classes / template partials)

- **NavBar** — name at left, `Home / Projects / Blog / About` at right; active
  link is `--accent` + weight 700, inactive is `--ink-65` + weight 400.
- **Hero header** — eyebrow + H1 + optional avatar + intro paragraph + optional
  social buttons. Reused with different copy per page (copy lives in config).
- **Project list row (home)** — `01 / title+desc / thumbnail` grid, hairline rules.
- **Project card (projects page)** — alternating image/text two-column grid,
  category pill, title, description, Demo/Source buttons.
- **Blog list item** — date eyebrow + title + description, hairline rules.
- **Blog card (home "From the Blog")** — small: date + title, 3 across.
- **Footer** — email · GitHub · LinkedIn, muted, centered.
- **Series modal** — see §7. (New; not in the source designs.)
- **Article / detail body** — see §6. (New; not in the source designs.)

> **IMPORTANT:** The source designs only include **listing/index pages**. There
> is **no design for a rendered article or a project detail page** yet. Design
> these from the tokens above (see §6). Keep prose readable: ~680–720px measure,
> generous line-height (~1.7), styled headings/code/blockquotes/lists.

### CSS strategy

The source uses inline styles everywhere. **Do not carry that forward.** Extract
into a single shared stylesheet `assets/styles.css` built on the tokens above,
with semantic component classes. Templates reference classes, not inline styles.
This is the main "more dynamic and extensible" improvement the user asked for.

---

## 3. Directory layout

Content dirs `blog/` and `projects/` live at the **repo root** (per the user's
spec). Build code and templates are kept separate. Generated output goes to
`dist/`.

Files marked **[private]** are gitignored (your data); their committed template
counterpart is shown in parentheses. See §11.

```
portfolio/
  README.md               # setup & usage (public entry point)
  CLAUDE.md               # this file
  PROGRESS.md             # [private] status log (ships PROGRESS.md.example)
  package.json            # deps: markdown-it (+plugins), gray-matter, js-yaml
  build.js                # orchestrator entry point: `node build.js`

  .env                    # [private] SHOW_EXAMPLES etc. (ships .env.example)
  site.config.js          # [private] site-wide config (ships site.config.example.js, §4)

  build/                  # build logic (pure Node, no framework)
    collect.js            #   traverse blog/ & projects/ -> content model
    parse.js              #   frontmatter + markdown -> HTML (markdown-it)
    render.js             #   content model + templates -> HTML strings
    assets.js             #   copy per-entry images + static assets to dist/
    util.js               #   slugify, date fmt, sort helpers

  templates/              # each exports a function (data) => htmlString
    layout.js             #   <html> shell: head, fonts, styles.css, meta
    navbar.js
    footer.js
    home.js
    projects-list.js
    blog-list.js
    about.js
    project-detail.js     #   NEW template (devlog)
    blog-post.js          #   NEW template (article + series nav)
    partials/
      project-card.js
      blog-item.js
      hero.js
      series-modal.js     #   NEW

  assets/                 # static, copied verbatim to dist/assets/
    styles.css            #   tokens + component classes
    modal.js              #   client-side series-modal behavior (vanilla JS)
    (fonts/, favicon, etc.)

  blog/                   # CONTENT (authored by you)
    <entry-slug>/         #   [private] dir name == URL slug
      *.md                #   1 file = single post; N files = a series
      cover.png           #   optional preview/header image
    example-*/            #   committed demo entries (gated by SHOW_EXAMPLES, §11)

  projects/               # CONTENT (authored by you)
    <entry-slug>/         #   [private]
      *.md
      cover.png
    example-*/            #   committed demo entries

  about.md                # [private] About page (ships about.example.md)

  dist/                   # BUILD OUTPUT (served by web server)
    index.html
    projects/index.html   ·  projects/<slug>/index.html
    blog/index.html       ·  blog/<slug>/[<part-slug>/]index.html
    about/index.html
    assets/...
```

> The five original `*.html` bundles at root are reference material. Once the
> build is working, move them into a `_reference/` folder (do not delete without
> asking — they are the only record of the intended visuals).

### Templating approach

Use **plain JS template functions** (each returns an HTML string via template
literals). No template language / no Handlebars — full control, zero magic,
matches the "custom script" decision. If nesting gets painful later, a tiny lib
like `eta` is an acceptable upgrade, but start with functions. **Always
HTML-escape interpolated frontmatter text** (titles, descriptions) except the
markdown body. The body is trusted author-authored content: `markdown-it` runs
with `html: true`, so raw HTML (including inline `<script>` for small
interactive elements) passes through verbatim and is injected unescaped. There
is no user-generated content in this static build, so this is intentional — do
not re-enable HTML escaping on the body.

---

## 4. `site.config.js`

Central place for everything not derived from content. **This file is gitignored**
(it holds your personal details); the committed `site.config.example.js` is the
template, and the build loads `site.config.js` if present and falls back to
`site.config.example.js` otherwise (see §11). Example shape:

```js
module.exports = {
  name: "Your Name",
  domain: "https://example.com",
  email: "you@example.com",
  socials: { github: "https://github.com/...", linkedin: "https://linkedin.com/in/...", ebay: "" },
  // Portrait/avatar shown in the Home hero and About page. Path is relative to
  // assets/ (copied to dist/assets/). If unset/missing, templates fall back to
  // the striped `--placeholder` gradient.
  portrait: "portrait.jpg",
  nav: [ {label:"Home",href:"/"}, {label:"Projects",href:"/projects/"},
         {label:"Blog",href:"/blog/"}, {label:"About",href:"/about/"} ],
  // Page hero copy per page:
  heroes: {
    home:     { eyebrow:"Lorem Ipsum · Dolor '26", intro:"..." },
    projects: { eyebrow:"Projects", title:"Things I've built", intro:"..." },
    blog:     { eyebrow:"Blog", title:"Notes along the way", intro:"..." },
  },
  homepage: { maxProjects: 3, maxBlog: 3 },
};
```

`socials` supports `github`, `linkedin`, and an optional `ebay` — each renders a
hero icon button and a footer link only when its URL is non-empty.

The **portrait/avatar is a single site-wide image** (not per-entry content), so
it lives in `site.config.js` → `portrait` rather than in frontmatter. Both the
Home hero (§6) and the About template (§6) read this one value; the striped
`--placeholder` gradient is the fallback when it is absent.

---

## 5. Content model, frontmatter & URL scheme

### Entry = a directory

- An **entry** is a subdirectory of `blog/` or `projects/`.
- The **entry slug is the directory name** (used verbatim in the URL).
- **1 markdown file** → a standalone entry. **≥2 markdown files** → a **series**
  (the parts of that one entry). **Filenames are irrelevant** to routing/order —
  order comes from frontmatter.

### Frontmatter schema (YAML, per markdown file)

| Field | Type | Applies | Meaning |
|---|---|---|---|
| `title` | string | both | Part/post title (required) |
| `description` | string | both | Preview/summary text (required) |
| `date` | `YYYY-MM-DD` | both | This part's own date (required) |
| `image` | string | both | Preview/header image, **path relative to entry dir** (optional; falls back to striped placeholder) |
| `series` | string | both | Display name of the series (optional; set on every part of a series) |
| `order` | number | both | 1-based position within the series (required iff `series`) |
| `visible` | boolean | both | Entry-level (read from part 1). Optional; **absent → visible**. `false` excludes the whole entry from the build — no page, no listing/card, no link. See below. |
| `featured` | boolean | projects | Show in homepage "Selected Projects" (optional) |
| `tag` | string | projects | Category pill text, e.g. `"Social · Prototype"` (optional) |
| `demo` | URL | projects | "Live Demo" button target; button hidden if absent |
| `source` | URL | projects | "Source" button target; button hidden if absent |

For a **project series**, put the project-level fields (`visible`, `featured`,
`tag`, `demo`, `source`, `image`) on the **first part** (order 1); the build
treats part 1's project-level frontmatter as canonical for the card.

### Visibility (`visible`)

`visible` is an **entry-level** switch, read from part 1 like the other
project-level fields. It is optional and defaults to visible — only an explicit
`visible: false` hides an entry. A hidden entry is dropped in `collect()` before
rendering, so it produces no detail page, never appears in any index/card/home
listing, and is not linked (author-written prose links in *other* entries'
markdown are not rewritten — that's on the author). A non-boolean `visible`
fails the build. If a hidden entry is also `featured: true`, the two fields
conflict; the build prints a warning naming the file and **`visible` wins**
(the entry stays hidden).

### Derived: entry "updated" timestamp

Each entry's **updated** time = **max `date` across its markdown files**. This
is what "most recently updated markdown in the directory" resolves to.
Rationale: frontmatter dates are deterministic and authoring-controlled, unlike
filesystem mtime (unreliable across git checkouts) or git history (couples build
to VCS). **Alternative if desired:** use `git log -1 --format=%cI <file>` mtime;
document the switch here if adopted.

### URL scheme (root-relative, trailing-slash dirs with `index.html`)

| Content | URL |
|---|---|
| Home | `/` |
| Projects index | `/projects/` |
| Project detail | `/projects/<entry-slug>/` |
| Blog index | `/blog/` |
| Standalone blog post | `/blog/<entry-slug>/` |
| Blog series part | `/blog/<entry-slug>/part-<order>/` |
| About | `/about/` |

- **Part slug** = `part-<order>` (e.g. `part-1`, `part-2`). **Chosen for URL
  stability** — the URL never changes when a part's title is edited, so links
  and bookmarks don't rot. (Alternative considered: `slugify(title)` for more
  readable URLs, rejected because titles are expected to change during drafting.)
- Blog series: **each part is its own page.**
- Project series: **one detail page** renders the whole devlog (see §6) — parts
  are sections/anchors within `/projects/<entry-slug>/`, not separate pages.

---

## 6. Page behaviors & the two NEW detail templates

### Home (`/`)

- Hero (eyebrow + name + avatar + intro + LinkedIn/GitHub).
- **Selected Projects:** projects with `featured: true`, ordered by *updated*
  desc, capped at `homepage.maxProjects`. Rendered as the numbered list rows.
- **From the Blog:** blog **entries** (series collapse to one item, dated by
  their latest part) ordered by *updated* desc, capped at `homepage.maxBlog`.
  Each links to the entry (series → its first part).
- Footer.

### Projects index (`/projects/`)

- Hero.
- **One card per project** (a series is a single card — the "one card, series is
  a devlog" decision). Ordered by *updated* desc (featured need not float here;
  featured only governs the homepage). Card shows tag pill, title, description,
  image (or placeholder), and Demo/Source buttons (each shown only if its URL
  exists). Card links to `/projects/<slug>/`.

### Project detail (`/projects/<slug>/`) — NEW TEMPLATE

- Header: back link, tag pill, title, description, image, Demo/Source buttons.
- Body: the entry's markdown parts rendered **in `order` ascending**, stacked as
  a **build-log/devlog** on one page. If it's a series, show a **parts timeline
  / index** (e.g., "Part 1 · Part 2 · Part 3" jump links, each with its date) at
  the top of the body, and render each part with its own subheading + anchor.
- Because the reader always lands at the top (part 1), **no ordering modal is
  needed for projects.**

### Blog index (`/blog/`)

- Hero.
- **Each part listed individually** (a 3-part series contributes 3 rows),
  **interleaved and ordered by each part's own `date` desc** — the "ordering is
  slightly different, each part ordered individually" behavior. A series part
  shows its series name as a small marker (e.g., "Example Series · Part 2") so the
  relationship is visible even when interleaved. Each row links to that part's
  page.

### Blog post (`/blog/<slug>/[<part-slug>/]`) — NEW TEMPLATE

- Header: back link, date eyebrow, title, optional image.
- Article body: rendered markdown (§ prose styling below).
- **Series navigation** (when the post is part of a series): a "Part N of M"
  indicator, prev/next-part links, and a compact list of all parts.
- **Series modal** (see §7) fires on load **iff `order > 1`**.

### Prose / article styling (both detail templates)

Measure ~680–720px, line-height ~1.7, `--ink-68` body. Style `h2/h3`, `ul/ol`,
`blockquote` (accent left-border), inline `code` and fenced blocks. **Syntax
highlighting is done at build time** (the user posts code) via a markdown-it
highlighter plugin (e.g. `markdown-it-highlightjs` or Shiki) — no client-side
highlighter. Bundle the highlight theme into `styles.css`, tuned to the palette.

### About (`/about/`)

- Rendered from `about.md`. Minimal template: avatar + eyebrow + name + bio
  paragraphs + the School/Major/Class stat strip + social buttons. The user
  **edits `about.md` manually**; keep the template stable. Stat-strip values can
  live in `about.md` frontmatter (`school`, `major`, `class`) or `site.config.js`.

---

## 7. Series modal (NEW component)

**Trigger:** a reader lands **directly** on a blog series part with `order > 1`.

**Behavior:**
- A **custom-styled modal** (NOT `window.alert`) — a centered card matching the
  design: cream card on a dimmed overlay, rounded corners, accent heading.
- Copy: e.g. *"You're jumping into the middle of a series. Start from the
  beginning?"*
- Actions: **primary** pill "Go to Part 1" (→ the series' first part) and
  **secondary** "Continue here" (dismiss).
- Once dismissed, set a `sessionStorage` flag keyed by series so it doesn't nag
  on subsequent parts in the same visit.
- Implementation: build emits the modal markup on qualifying pages plus a
  `data-series-first="/blog/<slug>/<part-1-slug>/"` attribute; `assets/modal.js`
  (tiny vanilla JS) reads it and wires the buttons. Keyboard-dismissable (Esc),
  focus-trapped, `aria-modal`.

---

## 8. Build pipeline (`node build.js`)

1. Load `site.config.js`.
2. **Collect** (`build/collect.js`): walk `blog/` and `projects/`; for each entry
   dir read every `.md`, parse frontmatter+body with `gray-matter`, validate
   required fields (fail loudly with the offending file path), sort parts by
   `order`, compute the entry `updated` date, resolve the preview `image` path.
3. **Render markdown** (`build/parse.js`): `markdown-it` (+ anchor + highlighter,
   `html: true`) → HTML body per part. Raw HTML in the source (including
   `<script>`) passes through verbatim; content is author-trusted (§3).
4. **Build content model**: `{ projects: [...], blog: [...] }` with everything the
   templates need (slugs, urls, sorted parts, updated, preview data).
5. **Render pages** (`build/render.js` + `templates/`): home, projects index +
   each project detail, blog index + each blog post/part, about. Wrap each in
   `templates/layout.js`.
6. **Assets** (`build/assets.js`): copy `assets/*` → `dist/assets/`; copy each
   entry's referenced images → alongside its output page. Rewrite relative image
   URLs in rendered markdown to their `dist` locations.
7. **Write** all HTML to `dist/`. Clean/rebuild `dist/` each run (idempotent).
8. Console summary: counts + any skipped/invalid entries.

### Dependencies (keep minimal)

`markdown-it`, `markdown-it-anchor`, a highlighter plugin, `gray-matter`
(bundles `js-yaml`). Node's built-in `fs`/`path` for everything else. No bundler,
no framework.

### Validation / failure behavior

Missing required frontmatter, a `series` without `order`, duplicate `order` in a
series, or an `image` path that doesn't exist → **print a clear error naming the
file and stop** (don't emit a half-broken site).

---

## 9. Decisions log & alternatives considered

- **Custom Node script over Astro/11ty** — user wants control, extensibility, and
  a "basic build script"; the hand-authored design maps cleanly to plain
  templates. (SSGs were offered; declined.)
- **Build-time rendering over client-side markdown** — SEO, no-JS baseline,
  speed. Only the series modal needs client JS.
- **Projects collapse to one card; blog parts list individually** — user's choice.
  Consequence: the ordering modal is a **blog-only** feature; project devlogs are
  single-page and always start at the top.
- **`updated` = max frontmatter date** — deterministic; alternatives (fs mtime,
  git log) documented in §5.
- **Preview imagery = image file in entry dir**, placeholder fallback — user's
  choice (emoji-only and hybrid were offered).
- **Inline styles → shared token-based stylesheet** — the core extensibility win.
- **Served at domain root** (behind any static host / reverse proxy / tunnel) →
  root-relative URLs; no base
  path.

## 10. Deferred / nice-to-have (not in scope now, but design shouldn't preclude)

- RSS/Atom feed for the blog; `sitemap.xml`; `<meta>`/OpenGraph tags per page
  (layout.js should already take title/description).
- Tag/topic filtering on the blog index.
- Client-side search.
- Dark mode (tokens are already central, so this is a stylesheet addition).
- A `--watch` / dev-server convenience mode for local authoring.

---

## 11. Public template & private content

This repo is a **public template**: it must build and demo for anyone who clones
it, while a maintainer's own personal content never enters version control. Two
mechanisms cooperate.

### A. `.example` fallback for the singular site files

The site has exactly one config, one About page, one env file. For each, the
**real file is gitignored** and a committed **`.example` sibling** ships the
public template. The build prefers the real file and falls back to the example:

| Real (gitignored) | Committed template | Loader |
|---|---|---|
| `site.config.js` | `site.config.example.js` | `loadSiteConfig()` in `build.js` |
| `about.md` | `about.example.md` | About block in `build/render.js` |
| `.env` | `.env.example` | `loadEnv()` in `build.js` |
| `PROGRESS.md` | `PROGRESS.md.example` | (docs only, not read by the build) |

A fresh clone therefore builds with zero setup. To personalize, copy each
`.example` to its real name and edit (see `README.md`).

### B. `SHOW_EXAMPLES` flag for content entries

Blog/project **content entries** coexist: your real ones and the shipped demos
live side by side under `blog/` and `projects/`. `.gitignore` ignores *all*
entries except those whose directory is named **`example-*`**, so only the demo
entries are committed; your authored entries stay private.

The `SHOW_EXAMPLES` env var (from `.env`, falling back to `.env.example`) governs
whether the `example-*` entries render — they behave exactly like `visible:false`
when it's off:

- `.env.example` ships **`SHOW_EXAMPLES=true`** → a fresh clone shows a working
  demo (the `example-*` posts/projects).
- Your own `.env` sets **`SHOW_EXAMPLES=false`** → the demos are dropped in
  `collect()` (via `filterExamples`), so your live site shows only your content.

Anything unset defaults to showing examples. Identification is purely by the
`example-` slug prefix, which is also what the `.gitignore` negation keys on —
keep the two in sync if you rename the convention.

---

## 12. Comments (optional backend)

Reader comments live at the **bottom of every project detail page and every
individual blog page** (standalone posts *and* each series part — one thread per
page). The static build stays static; comments are the **only stateful feature**
and are **config-gated off by default** so the public template still builds and
serves with zero infrastructure.

### Thread identity

A comment thread is keyed by the **page's URL path** — `entry.url` for projects
(`/projects/<slug>/`) and the per-part `outUrl` for blog
(`/blog/<slug>/` or `/blog/<slug>/part-<order>/`). These are already computed in
`build/render.js`, are unique and stable, and mean series parts each get their
own thread with no schema knowledge of series/parts. Any future page type gets
comments for free by passing its URL path as `threadId`.

### Architecture

- **Database:** Postgres in a container. One table `comments(id, thread, author
  VARCHAR(25), body VARCHAR(200), created_at)` — `api/schema.sql`.
- **API:** `api/server.js` — Node built-in `http` + one dep (`pg`), matching the
  zero-framework aesthetic of the root `server.js`. Routes `comments`
  (`GET ?thread=`, `POST`, `DELETE /:id`) + `health`, served with an **optional
  leading `/api`** — so it works fronted at a same-origin path (`/api/…`) or at
  the root of a subdomain (`api.example.com/…`) with no proxy path rewrite.
  **Length limits and
  the empty-name → `"Anonymous"` default are enforced server-side**; the client
  `maxlength` attrs are UX only. Delete authorization compares the supplied key
  to `COMMENT_DELETE_KEY` with `crypto.timingSafeEqual`. All queries are
  parameterized. **Profanity filter:** a blocklist loaded once at startup from
  `api/banned-words.txt` (override with `BANNED_WORDS_FILE`) — `POST` rejects
  (`400`) a comment whose author **or** body contains a banned word.
  `containsBannedWord` matches **whole words only** after lowercasing, undoing
  common leet substitutions, and collapsing repeated letters, so clean words
  containing a banned substring (Scunthorpe problem) are not flagged. A missing
  file disables the filter (logged), so the API still runs.
- **Orchestration:** `docker-compose.yml` runs `db` (no published port) + `api`
  (published on `127.0.0.1:8138`, loopback only). `pgdata` named volume persists
  data. Both read secrets from `.env` (see the table below).
- **Front-end:** `templates/partials/comments.js` emits the section (gated on
  `site.comments.enabled`) with `data-thread` + `data-api`; `assets/comments.js`
  (vanilla, same IIFE style as `modal.js`) fetches/renders/posts/deletes.
  Comment text is rendered with `textContent` (never `innerHTML`), so stored text
  cannot inject markup — the API stores it raw. On fetch failure the section
  shows a muted "unavailable" note (graceful degradation when the API is down).
  Each comment renders with an **initial avatar** and a live comment **count** in
  the heading. **Deleting uses a styled dialog, not `window.prompt`:** the
  partial emits a `#comment-delete-modal` reusing the shared `.modal*` classes
  (the same visual treatment as the series modal — see §7); `comments.js` opens
  it, collects the key, shows an inline error on a wrong key (dialog stays open),
  and is Esc/overlay-dismissable and focus-trapped. The series modal and the
  delete modal share one `.modal` base in `styles.css`; `series-modal` keeps only
  its id/data hooks.
- **Wiring:** `build/render.js` passes `site` + `threadId` into
  `project-detail.js` / `blog-post.js` and adds `/assets/comments.js` to the page
  `scripts` when `site.comments.enabled`.

### Config & deploy

`site.config.js` → `comments: { enabled, apiBase }` (example ships
`enabled:false`, `apiBase:"/api"`). The static server and the API are **two
loopback services**. Two front-door options (both need no path rewrite because
the API accepts an optional `/api` prefix):

- **Same-origin path** (template default): proxy `/api/` → `127.0.0.1:8138`,
  everything else → static server (`127.0.0.1:8137`). No CORS.
- **Dedicated subdomain** (this deploy, `api.m-skipper.com` via Cloudflare
  Tunnel): a public hostname → `127.0.0.1:8138`, **Path blank**. Cross-origin, so
  set `ALLOW_ORIGIN` to the site origin and `apiBase` to the subdomain URL.

See `README.md` "Comments" for the enable steps and proxy/tunnel snippets.

New `.env` keys (docker-compose reads these; the static build does not):

| Key | Purpose |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | DB credentials |
| `COMMENT_DELETE_KEY` | key a visitor must enter to delete a comment |
| `API_PORT` | loopback port the API publishes on (default 8138) |
| `ALLOW_ORIGIN` | optional CORS origin for cross-origin dev; empty in prod |
| `BANNED_WORDS_FILE` | optional path to the profanity blocklist (default `api/banned-words.txt`, baked into the image) |

### Deferred (not built)

Rate-limiting (a honeypot field is a cheap add) beyond the length caps and the
profanity blocklist, comment editing, threaded replies, moderation UI,
pagination. The single-table schema and one-file API leave room for all of these
without touching the static build.
