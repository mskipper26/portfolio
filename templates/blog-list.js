// templates/blog-list.js — the Blog index. Returns the <main> block.
// Each part listed individually, interleaved by date desc.
// See CLAUDE.md §6 (Blog index).

const hero = require("./partials/hero");
const blogItem = require("./partials/blog-item");

/**
 * @param {object} o
 * @param {object} o.site
 * @param {Array}  o.rows  flattened part rows, pre-sorted by date desc
 */
module.exports = function blogList(o) {
  const h = o.site.heroes.blog;
  const items = o.rows.length
    ? o.rows.map(blogItem).join("\n")
    : `<p class="empty">No posts yet — check back soon.</p>`;

  return `<main class="page-blog">
      <div class="wrap wrap--narrow">
        ${hero({ eyebrow: h.eyebrow, title: h.title, intro: h.intro })}
        <div class="blog-list">
          ${items}
        </div>
      </div>
    </main>`;
};
