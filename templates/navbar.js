// templates/navbar.js — top navigation. See CLAUDE.md §2 component inventory.

const { escapeHtml } = require("../build/util");

/**
 * @param {object} o
 * @param {string} o.name        site name (left)
 * @param {Array}  o.nav         [{label, href}]
 * @param {string} o.activeHref  href of the current page
 */
module.exports = function navbar(o) {
  const links = o.nav
    .map((item) => {
      const active = item.href === o.activeHref;
      return `<a class="nav-link${active ? " is-active" : ""}" href="${escapeHtml(
        item.href
      )}"${active ? ' aria-current="page"' : ""}>${escapeHtml(item.label)}</a>`;
    })
    .join("");

  return `<header class="site-nav">
      <div class="wrap nav-inner">
        <a class="nav-name" href="/">${escapeHtml(o.name)}</a>
        <nav class="nav-links" aria-label="Primary">${links}</nav>
      </div>
    </header>`;
};
