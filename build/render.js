// build/render.js — content model + templates → page HTML strings.
// See CLAUDE.md §6 and §8 (step 5).

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { renderPart, renderSimple } = require("./parse");
const { byDateDesc } = require("./util");

const layout = require("../templates/layout");
const navbar = require("../templates/navbar");
const footer = require("../templates/footer");
const homeTpl = require("../templates/home");
const projectsListTpl = require("../templates/projects-list");
const blogListTpl = require("../templates/blog-list");
const aboutTpl = require("../templates/about");
const projectDetailTpl = require("../templates/project-detail");
const blogPostTpl = require("../templates/blog-post");
const seriesModalTpl = require("../templates/partials/series-modal");

/** Root-relative URL for the site portrait, or null if the file is absent. */
function portraitUrl(root, site) {
  if (!site.portrait) return null;
  const abs = path.join(root, "assets", site.portrait);
  return fs.existsSync(abs) ? `/assets/${site.portrait}` : null;
}

/** Wrap a page's <main> in nav + footer + layout shell. */
function page(site, { title, description, url, bodyClass, main, scripts }) {
  const content = `${navbar({
    name: site.name,
    nav: site.nav,
    activeHref: activeNavHref(url),
  })}
    ${main}
    ${footer({ site })}`;
  return layout({
    site,
    title,
    description,
    canonical: url ? site.domain + url : site.domain + "/",
    bodyClass,
    content,
    scripts,
  });
}

/** Map a page URL to the nav item that should be marked active. */
function activeNavHref(url) {
  if (!url || url === "/") return "/";
  if (url.startsWith("/projects")) return "/projects/";
  if (url.startsWith("/blog")) return "/blog/";
  if (url.startsWith("/about")) return "/about/";
  return "/";
}

/**
 * Render everything.
 * @returns {{ pages: Array<{outPath,html}>, assets: Array<{abs,destRel}> }}
 */
function render(model, site, root) {
  const pages = [];
  const assets = [];
  const avatarSrc = portraitUrl(root, site);

  /** Queue an image file for copying to `<entryUrl><base>`. */
  function queueImage(entryUrl, img) {
    if (!img) return;
    assets.push({ abs: img.abs, destRel: `${entryUrl}${img.base}` });
  }

  // --- Render markdown bodies + collect per-entry images -------------------
  for (const e of [...model.projects, ...model.blog]) {
    // canonical preview image (card / hero)
    queueImage(e.url, e.image);
    for (const p of e.parts) {
      const { html, images } = renderPart(p, e.url);
      p.html = html;
      p.anchor = `part-${p.order}`;
      for (const img of images) queueImage(e.url, img);
      // per-part header image (blog parts may each have their own)
      queueImage(e.url, p.image);
    }
  }

  // --- Project detail pages ------------------------------------------------
  for (const e of model.projects) {
    pages.push({
      outPath: `${e.url}index.html`,
      html: page(site, {
        title: e.title,
        description: e.description,
        url: e.url,
        bodyClass: "project-detail",
        main: projectDetailTpl({ entry: e }),
      }),
    });
  }

  // --- Blog post / series-part pages --------------------------------------
  for (const e of model.blog) {
    const total = e.parts.length;
    const partsIndex = e.parts.map((p) => ({
      order: p.order,
      title: p.title,
      url: e.isSeries ? `${e.url}part-${p.order}/` : e.url,
    }));

    e.parts.forEach((p, i) => {
      const outUrl = e.isSeries ? `${e.url}part-${p.order}/` : e.url;
      const prev = i > 0 ? partsIndex[i - 1].url : null;
      const next = i < total - 1 ? partsIndex[i + 1].url : null;

      // Series modal fires only when landing mid-series (order > 1).
      const showModal = e.isSeries && p.order > 1;
      const modalHtml = showModal
        ? seriesModalTpl({
            seriesName: e.series,
            firstUrl: partsIndex[0].url,
            seriesKey: `series:${e.slug}`,
          })
        : "";

      pages.push({
        outPath: `${outUrl}index.html`,
        html: page(site, {
          title: p.title,
          description: p.description,
          url: outUrl,
          bodyClass: "blog-post",
          scripts: showModal ? ["/assets/modal.js"] : [],
          main: blogPostTpl({
            entry: e,
            part: p,
            isSeries: e.isSeries,
            total,
            parts: partsIndex.map((it) => ({
              ...it,
              isCurrent: it.order === p.order,
            })),
            prevUrl: prev,
            nextUrl: next,
            modalHtml,
          }),
        }),
      });
    });
  }

  // --- Projects index ------------------------------------------------------
  pages.push({
    outPath: `/projects/index.html`,
    html: page(site, {
      title: site.heroes.projects.title,
      description: site.heroes.projects.intro,
      url: "/projects/",
      bodyClass: "projects-index",
      main: projectsListTpl({ site, projects: model.projects }),
    }),
  });

  // --- Blog index (each part individually, interleaved by date desc) -------
  const blogRows = [];
  for (const e of model.blog) {
    e.parts.forEach((p) => {
      blogRows.push({
        url: e.isSeries ? `${e.url}part-${p.order}/` : e.url,
        title: p.title,
        description: p.description,
        date: p.date,
        series: e.series,
        order: p.order,
        total: e.parts.length,
      });
    });
  }
  blogRows.sort((a, b) => byDateDesc(a.date, b.date));
  pages.push({
    outPath: `/blog/index.html`,
    html: page(site, {
      title: site.heroes.blog.title,
      description: site.heroes.blog.intro,
      url: "/blog/",
      bodyClass: "blog-index",
      main: blogListTpl({ site, rows: blogRows }),
    }),
  });

  // --- Home ----------------------------------------------------------------
  const featured = model.projects
    .filter((e) => e.featured)
    .sort((a, b) => byDateDesc(a.updated, b.updated))
    .slice(0, site.homepage.maxProjects);

  const recentBlog = [...model.blog]
    .sort((a, b) => byDateDesc(a.updated, b.updated))
    .slice(0, site.homepage.maxBlog)
    .map((e) => ({
      ...e,
      // series → first part; standalone → entry page
      blogUrl: e.isSeries ? `${e.url}part-${e.parts[0].order}/` : e.url,
    }));

  pages.push({
    outPath: `/index.html`,
    html: page(site, {
      title: site.name,
      description: site.heroes.home.intro,
      url: "/",
      bodyClass: "home",
      main: homeTpl({ site, projects: featured, blog: recentBlog, avatarSrc }),
    }),
  });

  // --- About ---------------------------------------------------------------
  // Prefer the private about.md; fall back to the shipped about.example.md so a
  // fresh clone still renders an About page.
  const aboutPath = [path.join(root, "about.md"), path.join(root, "about.example.md")].find(
    (p) => fs.existsSync(p)
  );
  if (aboutPath) {
    const { data, content } = matter(fs.readFileSync(aboutPath, "utf8"));
    const bodyHtml = renderSimple(content);
    const statSrc = { ...data };
    const stats = [];
    if (statSrc.school) stats.push({ label: "School", value: statSrc.school });
    if (statSrc.major) stats.push({ label: "Major", value: statSrc.major });
    if (statSrc.class) stats.push({ label: "Class", value: String(statSrc.class) });
    pages.push({
      outPath: `/about/index.html`,
      html: page(site, {
        title: "About",
        description: (site.heroes.home && site.heroes.home.intro) || "",
        url: "/about/",
        bodyClass: "about",
        main: aboutTpl({
          site,
          bodyHtml,
          eyebrow: data.eyebrow || "About",
          stats,
          avatarSrc,
        }),
      }),
    });
  }

  return { pages, assets };
}

module.exports = { render };
