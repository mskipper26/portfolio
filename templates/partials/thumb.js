// templates/partials/thumb.js — preview image or striped placeholder.

const { escapeHtml } = require("../../build/util");

/**
 * @param {string|null} src  root-relative image URL, or null for placeholder
 * @param {string} alt
 * @param {string} [cls]     extra class(es)
 */
module.exports = function thumb(src, alt, cls = "") {
  const klass = `thumb${cls ? " " + cls : ""}`;
  if (src) {
    return `<img class="${klass}" src="${escapeHtml(src)}" alt="${escapeHtml(
      alt
    )}" loading="lazy" />`;
  }
  return `<span class="${klass} thumb--placeholder" role="img" aria-label="${escapeHtml(
    alt
  )}"></span>`;
};
