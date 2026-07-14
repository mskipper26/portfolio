// templates/project-detail.js — single-page project devlog. Returns <main>.
// See CLAUDE.md §6 (Project detail — NEW template).

const { escapeHtml, formatLongDate } = require("../build/util");
const thumb = require("./partials/thumb");
const { projectButtons } = require("./partials/project-card");

/**
 * @param {object} o
 * @param {object} o.entry   collected project entry; parts have {html, anchor, ...}
 */
module.exports = function projectDetail(o) {
  const e = o.entry;
  const imgUrl = e.image ? `${e.url}${e.image.base}` : null;

  // Parts timeline (only for series).
  const timeline =
    e.isSeries && e.parts.length > 1
      ? `<nav class="devlog-timeline" aria-label="Parts">
          <ol>
            ${e.parts
              .map(
                (p) => `<li>
              <a href="#${escapeHtml(p.anchor)}">
                <span class="devlog-timeline__part">Part ${p.order}</span>
                <span class="devlog-timeline__title">${escapeHtml(p.title)}</span>
                <span class="devlog-timeline__date">${escapeHtml(formatLongDate(p.date))}</span>
              </a>
            </li>`
              )
              .join("\n")}
          </ol>
        </nav>`
      : "";

  // Body: parts in ascending order, each with subheading + anchor (if series).
  const body = e.parts
    .map((p) => {
      const head = e.isSeries
        ? `<header class="devlog-part__head" id="${escapeHtml(p.anchor)}">
            <p class="eyebrow">Part ${p.order} · ${escapeHtml(formatLongDate(p.date))}</p>
            <h2 class="devlog-part__title">${escapeHtml(p.title)}</h2>
          </header>`
        : "";
      return `<section class="devlog-part">
          ${head}
          <div class="prose">${p.html}</div>
        </section>`;
    })
    .join("\n");

  return `<main class="page-project-detail">
      <div class="wrap wrap--narrow">
        <p class="back-link"><a href="/projects/">← Projects</a></p>
        <header class="detail-head">
          ${e.tag ? `<span class="tag">${escapeHtml(e.tag)}</span>` : ""}
          <h1 class="detail-title">${escapeHtml(e.title)}</h1>
          <p class="detail-desc">${escapeHtml(e.description)}</p>
          ${projectButtons(e)}
        </header>
        ${imgUrl ? `<div class="detail-media">${thumb(imgUrl, `${e.title} preview`, "thumb--hero")}</div>` : ""}
        ${timeline}
        <div class="devlog-body">
          ${body}
        </div>
      </div>
    </main>`;
};
