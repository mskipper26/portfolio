// templates/blog-post.js — a single blog post / series part. Returns <main>.
// See CLAUDE.md §6 (Blog post — NEW template) and §7 (series modal).

const { escapeHtml, formatLongDate } = require("../build/util");
const thumb = require("./partials/thumb");

/**
 * @param {object} o
 * @param {object} o.entry     collected blog entry
 * @param {object} o.part      current part {title, date, order, html, image}
 * @param {boolean} o.isSeries
 * @param {number} o.total     parts in series
 * @param {Array}  o.parts     [{url, title, order, isCurrent}] (series only)
 * @param {?string} o.prevUrl
 * @param {?string} o.nextUrl
 * @param {string} o.modalHtml series modal markup ("" if not applicable)
 */
module.exports = function blogPost(o) {
  const p = o.part;
  const imgUrl = p.image ? `${o.entry.url}${p.image.base}` : null;

  const seriesNav =
    o.isSeries && o.total > 1
      ? `<nav class="series-nav" aria-label="Series navigation">
          <p class="series-nav__meta">
            <span class="series-nav__name">${escapeHtml(o.entry.series)}</span>
            <span class="series-nav__count">Part ${p.order} of ${o.total}</span>
          </p>
          <ol class="series-nav__parts">
            ${o.parts
              .map(
                (it) => `<li${it.isCurrent ? ' class="is-current" aria-current="true"' : ""}>
              ${
                it.isCurrent
                  ? `<span>Part ${it.order} · ${escapeHtml(it.title)}</span>`
                  : `<a href="${escapeHtml(it.url)}">Part ${it.order} · ${escapeHtml(it.title)}</a>`
              }
            </li>`
              )
              .join("\n")}
          </ol>
          <div class="series-nav__prevnext">
            ${o.prevUrl ? `<a class="btn btn--outline" href="${escapeHtml(o.prevUrl)}">← Previous part</a>` : "<span></span>"}
            ${o.nextUrl ? `<a class="btn btn--outline" href="${escapeHtml(o.nextUrl)}">Next part →</a>` : "<span></span>"}
          </div>
        </nav>`
      : "";

  return `<main class="page-blog-post">
      <div class="wrap wrap--narrow">
        <p class="back-link"><a href="/blog/">← Blog</a></p>
        <header class="detail-head">
          <p class="eyebrow">${escapeHtml(formatLongDate(p.date))}${
    o.isSeries ? ` · ${escapeHtml(o.entry.series)}` : ""
  }</p>
          <h1 class="detail-title">${escapeHtml(p.title)}</h1>
        </header>
        ${imgUrl ? `<div class="detail-media">${thumb(imgUrl, `${p.title}`, "thumb--hero")}</div>` : ""}
        <article class="prose article-body">
          ${p.html}
        </article>
        ${seriesNav}
      </div>
      ${o.modalHtml || ""}
    </main>`;
};
