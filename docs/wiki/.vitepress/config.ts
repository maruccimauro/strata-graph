import { defineConfig } from "vitepress";

// Strata wiki. Static site built to docs/wiki/.vitepress/dist and published to
// GitHub Pages. Information architecture matches the generar-wiki-strata skill.
export default defineConfig({
  title: "Strata",
  description:
    "Visual editor for dependency graphs, grouped into configurable sections and adaptable to any domain.",
  base: "/strata-graph/",
  lastUpdated: true,
  cleanUrls: true,
  head: [["meta", { name: "theme-color", content: "#0a7d7d" }]],
  themeConfig: {
    nav: [
      { text: "Getting started", link: "/getting-started/installation" },
      { text: "Modeling", link: "/modeling/sections" },
      { text: "Working with the graph", link: "/working/selecting-and-moving" },
      { text: "Models and data", link: "/models-data/strata-graph-model" },
      { text: "Reference", link: "/reference/keyboard-shortcuts" },
    ],
    sidebar: [
      {
        text: "Getting started",
        items: [
          { text: "Installation", link: "/getting-started/installation" },
          { text: "Quick start", link: "/getting-started/quick-start" },
          { text: "The interface", link: "/getting-started/the-interface" },
          { text: "Preferences", link: "/getting-started/preferences" },
        ],
      },
      {
        text: "Modeling",
        items: [
          { text: "Sections", link: "/modeling/sections" },
          { text: "Nodes", link: "/modeling/nodes" },
          { text: "Edges", link: "/modeling/edges" },
          { text: "Comments", link: "/modeling/comments" },
          { text: "Importing files", link: "/modeling/importing-files" },
        ],
      },
      {
        text: "Working with the graph",
        items: [
          { text: "Selecting and moving", link: "/working/selecting-and-moving" },
          { text: "Node metadata", link: "/working/node-metadata" },
          { text: "Multi-selection", link: "/working/multi-selection" },
          { text: "Overlays and actions", link: "/working/overlays-and-actions" },
          { text: "Context menus", link: "/working/context-menus" },
          { text: "Highlighting", link: "/working/highlighting" },
          { text: "Undo and redo", link: "/working/undo-redo" },
          { text: "Themes", link: "/working/themes" },
        ],
      },
      {
        text: "Models and data",
        items: [
          { text: "Strata Graph Model (.sgm)", link: "/models-data/strata-graph-model" },
          { text: "Static and Connected modes", link: "/models-data/modes" },
          { text: "The data folder", link: "/models-data/data-folder" },
          { text: "Built-in models", link: "/models-data/built-in-models" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Keyboard shortcuts", link: "/reference/keyboard-shortcuts" },
          { text: "The .sgm format", link: "/reference/sgm-format" },
          { text: "Exporting", link: "/reference/exporting" },
          { text: "Architecture", link: "/reference/architecture" },
          { text: "Troubleshooting", link: "/reference/troubleshooting" },
          { text: "Roadmap", link: "/reference/roadmap" },
        ],
      },
    ],
    outline: "deep",
    editLink: {
      pattern: "https://github.com/maruccimauro/strata-graph/edit/main/docs/wiki/:path",
      text: "Edit this page on GitHub",
    },
    socialLinks: [{ icon: "github", link: "https://github.com/maruccimauro/strata-graph" }],
    docFooter: { prev: "Previous", next: "Next" },
    footer: {
      message: "Domain-agnostic dependency-graph editor.",
      copyright: "Strata",
    },
    search: { provider: "local" },
  },
});
