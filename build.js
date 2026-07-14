#!/usr/bin/env node
// build.js — orchestrator. `node build.js`. See CLAUDE.md §8.

const fs = require("fs");
const path = require("path");

const { collect } = require("./build/collect");
const { render } = require("./build/render");
const { copyAssets } = require("./build/assets");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

/**
 * Minimal .env loader (no dependency). Reads `.env` if present, otherwise falls
 * back to `.env.example`, so a fresh clone builds out of the box. Returns a
 * plain object of KEY=value pairs; existing process.env values win.
 */
function loadEnv() {
  const file = [".env", ".env.example"]
    .map((f) => path.join(ROOT, f))
    .find((f) => fs.existsSync(f));
  const env = {};
  if (file) {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return { ...env, ...process.env };
}

/** Resolve site config: prefer the private site.config.js, else the example. */
function loadSiteConfig() {
  const real = path.join(ROOT, "site.config.js");
  const example = path.join(ROOT, "site.config.example.js");
  return require(fs.existsSync(real) ? real : example);
}

function cleanDist() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function writePage(outPath, html) {
  const dest = path.join(DIST, outPath.replace(/^\//, ""));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
}

function main() {
  const t0 = Date.now();
  const site = loadSiteConfig();
  const env = loadEnv();
  const showExamples = String(env.SHOW_EXAMPLES).toLowerCase() !== "false";

  console.log(`→ Collecting content…${showExamples ? " (examples shown)" : ""}`);
  const model = collect(ROOT, { showExamples });

  console.log("→ Rendering pages…");
  const { pages, assets } = render(model, site, ROOT);

  console.log("→ Cleaning dist/…");
  cleanDist();

  for (const p of pages) writePage(p.outPath, p.html);

  console.log("→ Copying assets…");
  const imgCount = copyAssets(ROOT, DIST, assets);

  const blogParts = model.blog.reduce((n, e) => n + e.parts.length, 0);
  const ms = Date.now() - t0;
  console.log(
    `\n✓ Built ${pages.length} pages in ${ms}ms` +
      `\n  ${model.projects.length} projects · ` +
      `${model.blog.length} blog entries (${blogParts} parts) · ` +
      `${imgCount} images copied` +
      `\n  Output: ${path.relative(process.cwd(), DIST)}/`
  );
}

try {
  main();
} catch (err) {
  console.error("\n✗ Build failed:\n" + (err && err.message ? err.message : err));
  process.exitCode = 1;
}
