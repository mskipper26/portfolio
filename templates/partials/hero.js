// templates/partials/hero.js — reusable page hero.
// See CLAUDE.md §2 (Hero header) and §6.

const { escapeHtml } = require("../../build/util");

/** Render an avatar element, or the striped placeholder if no image. */
function avatar(src, alt) {
  if (src) {
    return `<img class="avatar" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`;
  }
  return `<span class="avatar avatar--placeholder" role="img" aria-label="${escapeHtml(alt)}"></span>`;
}

// Monochrome icon glyphs (24×24, fill via `currentColor`). Brand marks are the
// official Simple Icons paths; the envelope is a generic solid glyph.
const ICONS = {
  linkedin:
    '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
  github:
    '<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>',
  email:
    '<path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z"/><path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z"/>',
  ebay:
    '<path d="M6.056 12.132v-4.92h1.2v3.026c.59-.703 1.402-.906 2.202-.906 1.34 0 2.828.904 2.828 2.855 0 .233-.015.457-.06.668.24-.953 1.274-1.305 2.896-1.344.51-.018 1.095-.018 1.56-.018v-.135c0-.885-.556-1.244-1.53-1.244-.72 0-1.245.3-1.305.81h-1.275c.136-1.29 1.5-1.62 2.686-1.62 1.064 0 1.995.27 2.415 1.02l-.436-.84h1.41l2.055 4.125 2.055-4.126H24l-3.72 7.305h-1.346l1.07-2.04-2.33-4.38c.13.255.2.555.2.93v2.46c0 .346.01.69.04 1.005H16.8a6.543 6.543 0 01-.046-.765c-.603.734-1.32.96-2.32.96-1.48 0-2.272-.78-2.272-1.695 0-.15.015-.284.037-.405-.3 1.246-1.36 2.086-2.767 2.086-.87 0-1.694-.315-2.2-.93 0 .24-.015.494-.04.734h-1.18c.02-.39.04-.855.04-1.245v-1.05h-4.83c.065 1.095.818 1.74 1.853 1.74.718 0 1.355-.3 1.568-.93h1.24c-.24 1.29-1.61 1.725-2.79 1.725C.95 15.009 0 13.822 0 12.232c0-1.754.982-2.91 3.116-2.91 1.688 0 2.93.886 2.94 2.806v.005zm9.137.183c-1.095.034-1.77.233-1.77.95 0 .465.36.97 1.305.97 1.26 0 1.935-.69 1.935-1.814v-.13c-.45 0-.99.006-1.484.022h.012zm-6.06 1.875c1.11 0 1.876-.806 1.876-2.02s-.768-2.02-1.893-2.02c-1.11 0-1.89.806-1.89 2.02s.765 2.02 1.875 2.02h.03zm-4.35-2.514c-.044-1.125-.854-1.546-1.725-1.546-.944 0-1.694.474-1.815 1.546z"/>',
};

function iconLink(href, label, glyph, external) {
  const rel = external ? ' target="_blank" rel="noopener"' : "";
  return `<a class="social-icon" href="${escapeHtml(href)}" aria-label="${escapeHtml(label)}"${rel}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${glyph}</svg></a>`;
}

/**
 * Social icon buttons (LinkedIn / GitHub / Email / eBay). Each is rendered only
 * when its URL exists. Accepts the full `site` config (needs email + socials).
 */
function socialButtons(site) {
  if (!site) return "";
  const s = site.socials || {};
  const links = [];
  if (s.linkedin) links.push(iconLink(s.linkedin, "LinkedIn", ICONS.linkedin, true));
  if (s.github) links.push(iconLink(s.github, "GitHub", ICONS.github, true));
  if (site.email) links.push(iconLink(`mailto:${site.email}`, "Email", ICONS.email, false));
  if (s.ebay) links.push(iconLink(s.ebay, "eBay", ICONS.ebay, true));
  if (!links.length) return "";
  return `<div class="hero-actions social-icons">${links.join("")}</div>`;
}

/**
 * @param {object} o
 * @param {string} o.eyebrow
 * @param {string} o.title
 * @param {string} [o.intro]
 * @param {boolean} [o.showAvatar]
 * @param {string} [o.avatarSrc]
 * @param {object} [o.site]       include (the site config) to show social icons
 * @param {string} [o.align]     "center" for centered heroes (default left)
 */
module.exports = function hero(o) {
  const centered = o.align === "center";
  return `<header class="hero${centered ? " hero--center" : ""}">
        <p class="eyebrow">${escapeHtml(o.eyebrow || "")}</p>
        ${o.showAvatar ? avatar(o.avatarSrc, o.title) : ""}
        <h1 class="hero-title">${escapeHtml(o.title)}</h1>
        ${o.intro ? `<p class="hero-intro">${escapeHtml(o.intro)}</p>` : ""}
        ${o.site ? socialButtons(o.site) : ""}
      </header>`;
};

module.exports.avatar = avatar;
module.exports.socialButtons = socialButtons;
