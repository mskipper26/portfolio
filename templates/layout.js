// templates/layout.js — the <html> shell wrapping every page.
// See CLAUDE.md §3, §10 (meta/OpenGraph hooks).

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { escapeHtml } = require("../build/util");

// Cache-busting: append a short content hash to each asset URL so a rebuilt
// file is served under a brand-new URL. Browsers/CDNs key their cache on the
// full URL (query included), so a changed file can never be served stale, and
// an unchanged file keeps its hash (stays cached). Hash is computed from the
// source file under assets/ and memoized per build. Unknown/missing files pass
// through unversioned.
const ASSETS_DIR = path.join(__dirname, "..", "assets");
const hashCache = new Map();

function assetUrl(url) {
  if (!url.startsWith("/assets/")) return url;
  if (hashCache.has(url)) return hashCache.get(url);
  let out = url;
  try {
    const file = path.join(ASSETS_DIR, url.slice("/assets/".length));
    const hash = crypto
      .createHash("md5")
      .update(fs.readFileSync(file))
      .digest("hex")
      .slice(0, 8);
    out = `${url}?v=${hash}`;
  } catch {
    /* missing file — leave URL unversioned */
  }
  hashCache.set(url, out);
  return out;
}

/**
 * @param {object} o
 * @param {string} o.title        <title> + og:title
 * @param {string} o.description  meta description + og:description
 * @param {string} o.canonical    absolute canonical URL
 * @param {string} o.bodyClass    class on <body> (e.g. page name)
 * @param {string} o.content      inner HTML (nav + main + footer)
 * @param {string} [o.head]       extra head markup (e.g. data attrs unused)
 * @param {string[]} [o.scripts]  root-relative script srcs to include (deferred)
 * @param {object} o.site         site.config
 */
module.exports = function layout(o) {
  const site = o.site;
  const fullTitle =
    o.title && o.title !== site.name
      ? `${o.title} · ${site.name}`
      : site.name;
  const desc = o.description || "";
  const scripts = (o.scripts || [])
    .map((s) => `<script src="${escapeHtml(assetUrl(s))}" defer></script>`)
    .join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(fullTitle)}</title>
    <meta name="description" content="${escapeHtml(desc)}" />
    ${o.canonical ? `<link rel="canonical" href="${escapeHtml(o.canonical)}" />` : ""}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(site.name)}" />
    <meta property="og:title" content="${escapeHtml(o.title || site.name)}" />
    <meta property="og:description" content="${escapeHtml(desc)}" />
    ${o.canonical ? `<meta property="og:url" content="${escapeHtml(o.canonical)}" />` : ""}
    <meta name="twitter:card" content="summary" />
    <link rel="stylesheet" href="${escapeHtml(assetUrl("/assets/styles.css"))}" />
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
    ${o.head || ""}
  </head>
  <body class="${escapeHtml(o.bodyClass || "")}">
    ${o.content}
    ${scripts}
  </body>
</html>
`;
};
