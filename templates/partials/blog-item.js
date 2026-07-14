// templates/partials/blog-item.js — one row on the Blog index.
// Each *part* is listed individually; series parts show a marker.
// See CLAUDE.md §6 (Blog index).

const { escapeHtml, formatEyebrowDate } = require("../../build/util");

/**
 * @param {object} row
 * @param {string} row.url          part page URL
 * @param {string} row.title        part title
 * @param {string} row.description  part description
 * @param {string} row.date         YYYY-MM-DD
 * @param {string} [row.series]     series name (if part of a series)
 * @param {number} [row.order]      1-based part index
 * @param {number} [row.total]      parts in the series
 */
module.exports = function blogItem(row) {
  const marker =
    row.series && row.total > 1
      ? `<span class="series-marker">${escapeHtml(row.series)} · Part ${row.order}</span>`
      : "";

  return `<article class="blog-item">
        <a class="blog-item__link" href="${escapeHtml(row.url)}">
          <p class="eyebrow blog-item__date">${escapeHtml(formatEyebrowDate(row.date))}</p>
          <h2 class="blog-item__title">${escapeHtml(row.title)}${marker}</h2>
          <p class="blog-item__desc">${escapeHtml(row.description)}</p>
        </a>
      </article>`;
};
