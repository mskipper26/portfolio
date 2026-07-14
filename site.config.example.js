// site.config.example.js — the public template config.
//
// Copy this to site.config.js and fill in your own details:
//     cp site.config.example.js site.config.js
//
// site.config.js is gitignored, so your personal info never gets committed.
// The build uses site.config.js if present, otherwise it falls back to this
// file. See CLAUDE.md §4 for the full field reference.

module.exports = {
  name: "Your Name",
  domain: "https://example.com",
  email: "you@example.com",

  // Your profile URLs. Any social left empty/removed simply hides its icon in
  // the hero and its link in the footer.
  socials: {
    github: "https://github.com/your-username",
    linkedin: "https://www.linkedin.com/in/your-handle/",
    // Optional. eBay store/seller profile. Leave empty to hide the eBay icon
    // (hero) and the eBay footer link; fill in to enable both.
    ebay: "",
  },

  // Portrait/avatar for the Home hero and About page. Path is relative to
  // assets/ (copied to dist/assets/). The file is gitignored — drop your own
  // assets/portrait.jpg in place. If it's missing, templates fall back to the
  // striped `--placeholder` gradient, so the site still builds without it.
  portrait: "portrait.jpg",

  nav: [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects/" },
    { label: "Blog", href: "/blog/" },
    { label: "About", href: "/about/" },
  ],

  // Page hero copy — edit freely.
  heroes: {
    home: {
      eyebrow: "Lorem Ipsum · Dolor '26",
      // title falls back to `name` if omitted
      intro:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. I build things, break things, and occasionally write about it.",
    },
    projects: {
      eyebrow: "Projects",
      title: "Things I've built",
      intro:
        "A collection of apps and experiments. Some personal, some for school, some just for fun.",
    },
    blog: {
      eyebrow: "Blog",
      title: "Notes along the way",
      intro: "Lorem ipsum dolor sit amet — thoughts on what I'm working on.",
    },
  },

  homepage: { maxProjects: 3, maxBlog: 3 },

  // Reader comments on project detail + individual blog pages. Requires the
  // comment backend (Postgres + Node API) from docker-compose.yml — see
  // README.md "Comments". Kept OFF in this template so a fresh clone builds and
  // serves with zero backend; flip `enabled: true` in your own site.config.js
  // once the containers are up and your reverse proxy routes `apiBase` to them.
  comments: {
    enabled: false,
    apiBase: "/api", // same-origin path your proxy forwards to 127.0.0.1:8138
  },
};