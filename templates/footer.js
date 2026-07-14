// templates/footer.js — muted, centered footer. See CLAUDE.md §2.

const { escapeHtml } = require("../build/util");

module.exports = function footer(o) {
  const site = o.site;
  const parts = [
    `<a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a>`,
  ];
  if (site.socials?.github)
    parts.push(`<a href="${escapeHtml(site.socials.github)}" rel="me noopener" target="_blank">GitHub</a>`);
  if (site.socials?.linkedin)
    parts.push(`<a href="${escapeHtml(site.socials.linkedin)}" rel="me noopener" target="_blank">LinkedIn</a>`);
  if (site.socials?.ebay)
    parts.push(`<a href="${escapeHtml(site.socials.ebay)}" rel="me noopener" target="_blank">eBay</a>`);

  return `<footer class="site-footer">
      <div class="wrap footer-inner">
        ${parts.join('<span class="dot">·</span>')}
      </div>
    </footer>`;
};
