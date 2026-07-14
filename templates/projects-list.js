// templates/projects-list.js — the Projects index. Returns the <main> block.
// One card per project. See CLAUDE.md §6 (Projects index).

const hero = require("./partials/hero");
const projectCard = require("./partials/project-card");

module.exports = function projectsList(o) {
  const h = o.site.heroes.projects;
  const cards = o.projects.length
    ? o.projects.map((e, i) => projectCard(e, i)).join("\n")
    : `<p class="empty">No projects yet — check back soon.</p>`;

  return `<main class="page-projects">
      <div class="wrap">
        ${hero({ eyebrow: h.eyebrow, title: h.title, intro: h.intro })}
        <div class="project-cards">
          ${cards}
        </div>
      </div>
    </main>`;
};
