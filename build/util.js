// build/util.js — small helpers shared across the build.

/** Convert an arbitrary string into a URL-safe slug. */
function slugify(str) {
  return String(str)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Escape text for safe interpolation into HTML (attributes and text). */
function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Parse a `YYYY-MM-DD` string into a Date at UTC midnight (no TZ drift). */
function parseDate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str).trim());
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

/** "MAY 2026" — the eyebrow date format used in listings. */
function formatEyebrowDate(str) {
  const d = parseDate(str);
  if (!d) return String(str);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "May 9, 2026" — the long date format used on detail pages. */
function formatLongDate(str) {
  const d = parseDate(str);
  if (!d) return String(str);
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** Descending compare by date string (newest first). */
function byDateDesc(a, b) {
  return String(b).localeCompare(String(a));
}

module.exports = {
  slugify,
  escapeHtml,
  parseDate,
  formatEyebrowDate,
  formatLongDate,
  byDateDesc,
  MONTHS,
  MONTHS_LONG,
};
