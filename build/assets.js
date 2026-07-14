// build/assets.js — copy static assets + per-entry images into dist/.
// See CLAUDE.md §8 (step 6).

const fs = require("fs");
const path = require("path");

/** Recursively copy a directory tree. */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

/** Copy one file, creating parent dirs. */
function copyFile(abs, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(abs, dest);
}

/**
 * @param {string} root  repo root
 * @param {string} dist  output dir
 * @param {Array<{abs,destRel}>} contentImages  per-entry images to copy
 * @returns {number} count of content images copied
 */
function copyAssets(root, dist, contentImages) {
  // 1. Static assets: assets/ → dist/assets/ (verbatim).
  const assetsSrc = path.join(root, "assets");
  if (fs.existsSync(assetsSrc)) {
    copyDir(assetsSrc, path.join(dist, "assets"));
  }

  // 2. Per-entry images → alongside their output pages. De-dupe by dest.
  const seen = new Set();
  let count = 0;
  for (const img of contentImages) {
    const dest = path.join(dist, img.destRel.replace(/^\//, ""));
    if (seen.has(dest)) continue;
    seen.add(dest);
    copyFile(img.abs, dest);
    count++;
  }
  return count;
}

module.exports = { copyAssets, copyDir };
