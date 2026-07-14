// templates/partials/project-card.js — one project on the Projects index.
// Alternating image/text two-column card. See CLAUDE.md §2, §6.

const { escapeHtml } = require("../../build/util");
const thumb = require("./thumb");

/** Demo/Source pill buttons — each shown only if its URL exists. */
function projectButtons(entry) {
  const btns = [];
  if (entry.demo)
    btns.push(`<a class="btn btn--primary" href="${escapeHtml(entry.demo)}" target="_blank" rel="noopener">Live Demo</a>`);
  if (entry.source)
    btns.push(`<a class="btn btn--outline" href="${escapeHtml(entry.source)}" target="_blank" rel="noopener">Source</a>`);
  if (!btns.length) return "";
  return `<div class="card-actions">${btns.join("")}</div>`;
}

/**
 * @param {object} entry  collected project entry
 * @param {number} index  0-based position (drives image/text alternation)
 */
module.exports = function projectCard(entry, index) {
  const imgUrl = entry.image ? `${entry.url}${entry.image.base}` : null;
  const reversed = index % 2 === 1;

  return `<article class="project-card${reversed ? " is-reversed" : ""}">
        <a class="project-card__media" href="${escapeHtml(entry.url)}" aria-hidden="true" tabindex="-1">
          ${thumb(imgUrl, `${entry.title} preview`, "thumb--card")}
        </a>
        <div class="project-card__body">
          ${entry.tag ? `<span class="tag">${escapeHtml(entry.tag)}</span>` : ""}
          <h2 class="project-card__title">
            <a href="${escapeHtml(entry.url)}">${escapeHtml(entry.title)}</a>
          </h2>
          <p class="project-card__desc">${escapeHtml(entry.description)}</p>
          ${projectButtons(entry)}
        </div>
      </article>`;
};

module.exports.projectButtons = projectButtons;
