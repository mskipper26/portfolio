// templates/about.js — the About page. Returns the <main> block.
// Rendered from about.md. See CLAUDE.md §6 (About).

const { escapeHtml } = require("../build/util");
const { avatar, socialButtons } = require("./partials/hero");

/**
 * @param {object} o
 * @param {object} o.site
 * @param {string} o.bodyHtml   rendered about.md body
 * @param {string} [o.eyebrow]  small label above the name
 * @param {Array}  o.stats      [{label, value}] for the stat strip
 * @param {string} [o.avatarSrc]
 */
module.exports = function about(o) {
  const stats = o.stats.length
    ? `<dl class="stat-strip">
            ${o.stats
              .map(
                (s) => `<div class="stat">
              <dt class="stat__label">${escapeHtml(s.label)}</dt>
              <dd class="stat__value">${escapeHtml(s.value)}</dd>
            </div>`
              )
              .join("\n")}
          </dl>`
    : "";

  return `<main class="page-about">
      <div class="wrap wrap--narrow">
        <div class="about-head">
          ${avatar(o.avatarSrc, o.site.name)}
          ${o.eyebrow ? `<p class="eyebrow">${escapeHtml(o.eyebrow)}</p>` : ""}
          <h1 class="hero-title">${escapeHtml(o.site.name)}</h1>
        </div>
        <div class="prose about-body">
          ${o.bodyHtml}
        </div>
        ${stats}
        ${socialButtons(o.site)}
      </div>
    </main>`;
};
