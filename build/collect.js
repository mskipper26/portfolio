// build/collect.js — walk blog/ and projects/, build the content model.
// See CLAUDE.md §5 and §8.

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { parseDate, byDateDesc } = require("./util");

/** Throw a build error that names the offending file. */
function fail(msg, file) {
  throw new Error(`[content] ${msg}${file ? `\n  → ${file}` : ""}`);
}

/** List immediate subdirectories of `dir` (entry dirs). Returns [] if absent. */
function listEntryDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/** Read + parse every .md file in an entry dir into raw part objects. */
function readParts(entryDir, kind) {
  const files = fs
    .readdirSync(entryDir)
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .sort();

  if (files.length === 0) {
    fail(`entry has no markdown files`, entryDir);
  }

  return files.map((file) => {
    const full = path.join(entryDir, file);
    const { data, content } = matter(fs.readFileSync(full, "utf8"));

    // YAML auto-parses an unquoted `2026-03-18` into a Date; normalize it back
    // to a YYYY-MM-DD string (UTC, so no timezone drift).
    if (data.date instanceof Date && !isNaN(data.date)) {
      data.date = data.date.toISOString().slice(0, 10);
    }

    // Required fields (both kinds).
    for (const key of ["title", "description", "date"]) {
      if (data[key] == null || String(data[key]).trim() === "") {
        fail(`missing required frontmatter field "${key}"`, full);
      }
    }
    if (!parseDate(data.date)) {
      fail(`"date" must be YYYY-MM-DD (got "${data.date}")`, full);
    }

    // Series consistency.
    if (data.series != null && data.order == null) {
      fail(`"series" is set but "order" is missing`, full);
    }
    if (data.order != null && !Number.isInteger(data.order)) {
      fail(`"order" must be an integer (got "${data.order}")`, full);
    }

    // Visibility: optional boolean. Absent → visible; only explicit `false`
    // hides the entry (see filterVisible in collect()).
    if (data.visible != null && typeof data.visible !== "boolean") {
      fail(`"visible" must be a boolean true/false (got "${data.visible}")`, full);
    }

    // Resolve the preview/header image path relative to the entry dir.
    let image = null;
    if (data.image != null && String(data.image).trim() !== "") {
      const rel = String(data.image).trim();
      const abs = path.join(entryDir, rel);
      if (!fs.existsSync(abs)) {
        fail(`"image" file does not exist: ${rel}`, full);
      }
      image = { rel, abs, base: path.basename(rel) };
    }

    return {
      kind,
      file,
      sourcePath: full,
      body: content, // raw markdown; rendered later in parse.js
      title: String(data.title),
      description: String(data.description),
      date: String(data.date).trim(),
      series: data.series != null ? String(data.series) : null,
      order: data.order != null ? Number(data.order) : null,
      image,
      // Absent → visible; only explicit `false` hides the entry.
      visible: data.visible !== false,
      // project-level (only meaningful on projects; canonical on order-1 part)
      featured: data.featured === true,
      tag: data.tag != null ? String(data.tag) : null,
      demo: data.demo != null ? String(data.demo) : null,
      source: data.source != null ? String(data.source) : null,
    };
  });
}

/** Turn one entry dir into a normalized entry object. */
function buildEntry(baseUrl, dirName, entryDir, kind) {
  const parts = readParts(entryDir, kind);
  const isSeries = parts.length > 1;

  if (isSeries) {
    // Every part must declare order; orders must be unique.
    const seen = new Map();
    for (const p of parts) {
      if (p.order == null) {
        fail(`series entry requires "order" on every part`, p.sourcePath);
      }
      if (seen.has(p.order)) {
        fail(
          `duplicate "order: ${p.order}" (also in ${path.basename(
            seen.get(p.order)
          )})`,
          p.sourcePath
        );
      }
      seen.set(p.order, p.sourcePath);
    }
    parts.sort((a, b) => a.order - b.order);
  } else {
    // Standalone: normalize order to 1 for uniform handling.
    parts[0].order = parts[0].order == null ? 1 : parts[0].order;
  }

  const seriesName = parts.find((p) => p.series)?.series || null;
  if (isSeries && !seriesName) {
    fail(
      `multi-file entry is a series but no part declares a "series" name`,
      entryDir
    );
  }

  // Canonical project-level metadata comes from the order-1 part.
  const first = parts[0];
  const updated = parts.map((p) => p.date).sort(byDateDesc)[0];
  // A series' display title is the series name; a standalone entry's is its
  // single part's title. (Part titles become devlog/section subheadings.)
  const displayTitle = isSeries ? seriesName : first.title;

  const slug = dirName;
  const url = `${baseUrl}/${slug}/`;

  return {
    kind,
    slug,
    url,
    dir: entryDir,
    isSeries,
    series: seriesName,
    parts,
    updated,
    // canonical preview data
    title: displayTitle,
    description: first.description,
    image: first.image,
    // Entry-level visibility (canonical from part 1, like the fields below).
    visible: first.visible,
    // project-only card metadata (from part 1)
    featured: first.featured,
    tag: first.tag,
    demo: first.demo,
    source: first.source,
  };
}

/**
 * Drop entries with `visible: false` so they never reach the rendered site.
 * If such an entry is also `featured`, the two fields conflict — warn (naming
 * the file) and let `visible` win.
 */
function filterVisible(entries) {
  return entries.filter((e) => {
    if (e.visible) return true;
    if (e.featured) {
      console.warn(
        `⚠ [content] "${e.slug}" sets visible:false and featured:true — ` +
          `these conflict; visible wins, so the entry is hidden.\n  → ${e.parts[0].sourcePath}`
      );
    }
    return false;
  });
}

/**
 * Drop `example-*` template entries unless SHOW_EXAMPLES is enabled. These are
 * the demo posts/projects that ship with the template; they behave like
 * `visible: false` when examples are turned off (see build.js / .env).
 */
function filterExamples(entries, showExamples) {
  if (showExamples) return entries;
  return entries.filter((e) => !e.slug.startsWith("example-"));
}

/**
 * Collect the full content model: { projects, blog }.
 * @param {string} root
 * @param {{ showExamples?: boolean }} [opts]
 */
function collect(root, opts = {}) {
  const showExamples = opts.showExamples !== false;
  const projectsDir = path.join(root, "projects");
  const blogDir = path.join(root, "blog");

  const projects = filterExamples(
    filterVisible(
      listEntryDirs(projectsDir).map((name) =>
        buildEntry("/projects", name, path.join(projectsDir, name), "project")
      )
    ),
    showExamples
  );
  const blog = filterExamples(
    filterVisible(
      listEntryDirs(blogDir).map((name) =>
        buildEntry("/blog", name, path.join(blogDir, name), "blog")
      )
    ),
    showExamples
  );

  // Sort entries newest-updated first.
  projects.sort((a, b) => byDateDesc(a.updated, b.updated));
  blog.sort((a, b) => byDateDesc(a.updated, b.updated));

  return { projects, blog };
}

module.exports = { collect };
