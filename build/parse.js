// build/parse.js — render a part's markdown body to sanitized HTML.
// See CLAUDE.md §6 (prose) and §8 (step 3, step 6 image rewriting).

const path = require("path");
const fs = require("fs");
const MarkdownIt = require("markdown-it");
const anchor = require("markdown-it-anchor");
const highlightjs = require("markdown-it-highlightjs");
const { slugify } = require("./util");

const md = new MarkdownIt({
  html: true, // allow raw HTML in authored markdown (content is author-trusted)
  linkify: true,
  typographer: true,
})
  .use(highlightjs, { inline: true, auto: true })
  .use(anchor, {
    slugify: (s) => slugify(s),
    permalink: anchor.permalink.headerLink({ safariReaderFix: true }),
    level: [2, 3],
  });

/**
 * Render a part's markdown body.
 * @param {object} part   collected part (has .body, .sourcePath)
 * @param {string} baseUrl root-relative dir the entry's assets live under,
 *                          e.g. "/blog/relay" or "/projects/gui-toolkit"
 * @returns {{ html:string, images: Array<{rel,abs,base}> }}
 */
function renderPart(part, baseUrl) {
  const entryDir = path.dirname(part.sourcePath);
  const images = [];
  const env = {};

  // Custom image renderer: rewrite relative srcs to their dist location and
  // record which files must be copied.
  const defaultImage = md.renderer.rules.image;
  md.renderer.rules.image = function (tokens, idx, options, e, self) {
    const token = tokens[idx];
    const srcIdx = token.attrIndex("src");
    if (srcIdx >= 0) {
      const src = token.attrs[srcIdx][1];
      if (src && !/^([a-z]+:)?\/\//i.test(src) && !src.startsWith("/") && !src.startsWith("#")) {
        const abs = path.join(entryDir, src);
        if (!fs.existsSync(abs)) {
          throw new Error(
            `[content] markdown image not found: ${src}\n  → ${part.sourcePath}`
          );
        }
        const base = path.basename(src);
        images.push({ rel: src, abs, base });
        token.attrs[srcIdx][1] = `${baseUrl}${base}`;
      }
    }
    // ensure lazy loading on prose images
    if (token.attrIndex("loading") < 0) token.attrPush(["loading", "lazy"]);
    return defaultImage
      ? defaultImage(tokens, idx, options, e, self)
      : self.renderToken(tokens, idx, options);
  };

  const html = md.render(part.body, env);

  // restore default renderer to avoid cross-entry state leakage
  md.renderer.rules.image = defaultImage;

  return { html, images };
}

/** Render standalone markdown (e.g. about.md) with no image rewriting. */
function renderSimple(markdown) {
  return md.render(String(markdown || ""));
}

module.exports = { renderPart, renderSimple };
