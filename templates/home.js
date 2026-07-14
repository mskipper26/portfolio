// templates/home.js — the landing page. Returns the <main> block.
// See CLAUDE.md §6 (Home).

const { escapeHtml, formatEyebrowDate } = require("../build/util");
const hero = require("./partials/hero");
const thumb = require("./partials/thumb");

/** Numbered "Selected Projects" row: 01 / title+desc / thumb. */
function projectRow(entry, i) {
  const num = String(i + 1).padStart(2, "0");
  const imgUrl = entry.image ? `${entry.url}${entry.image.base}` : null;
  return `<li class="proj-row">
          <a class="proj-row__link" href="${escapeHtml(entry.url)}">
            <span class="proj-row__num">${num}</span>
            <span class="proj-row__text">
              <span class="proj-row__title">${escapeHtml(entry.title)}</span>
              <span class="proj-row__desc">${escapeHtml(entry.description)}</span>
            </span>
            ${thumb(imgUrl, `${entry.title} preview`, "thumb--row")}
          </a>
        </li>`;
}

/** Small blog card for "From the Blog": date + title. */
function blogCard(entry) {
  // series → link to first part; standalone → entry page
  const url = entry.blogUrl;
  return `<a class="blog-card" href="${escapeHtml(url)}">
          <p class="eyebrow">${escapeHtml(formatEyebrowDate(entry.updated))}</p>
          <h3 class="blog-card__title">${escapeHtml(entry.title)}</h3>
        </a>`;
}

/**
 * @param {object} o
 * @param {object} o.site
 * @param {Array}  o.projects  selected (featured) project entries
 * @param {Array}  o.blog      recent blog entries (with .blogUrl)
 * @param {string} [o.avatarSrc]
 */
module.exports = function home(o) {
  const h = o.site.heroes.home;

  const projectsSection = o.projects.length
    ? `<section class="section">
        <div class="wrap">
          <div class="section-head">
            <h2 class="section-title">Selected Projects</h2>
            <a class="section-more" href="/projects/">View all →</a>
          </div>
          <ol class="proj-list">
            ${o.projects.map(projectRow).join("\n")}
          </ol>
        </div>
      </section>`
    : "";

  const blogSection = o.blog.length
    ? `<section class="section section--alt">
        <div class="wrap">
          <div class="section-head">
            <h2 class="section-title">From the Blog</h2>
            <a class="section-more" href="/blog/">View all →</a>
          </div>
          <div class="blog-cards">
            ${o.blog.map(blogCard).join("\n")}
          </div>
        </div>
      </section>`
    : "";

  return `<main class="page-home">
      <div class="wrap">
        ${hero({
          eyebrow: h.eyebrow,
          title: h.title || o.site.name,
          intro: h.intro,
          showAvatar: true,
          avatarSrc: o.avatarSrc,
          site: o.site,
        })}
      </div>
      ${projectsSection}
      ${blogSection}
    </main>`;
};
