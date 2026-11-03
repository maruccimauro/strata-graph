---
layout: home
hero:
  name: Strata
  text: Dependency graphs, your way
  tagline: A visual editor for building, organizing and tracking dependency graphs. You model nodes, group them into configurable sections, and define how they depend on each other, in any domain.
  actions:
    - theme: brand
      text: Quick start
      link: /getting-started/quick-start
    - theme: alt
      text: Installation
      link: /getting-started/installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/maruccimauro/strata-graph
features:
  - title: Domain agnostic
    details: The engine knows no domain. You model sections, nodes and edges for anything; SDLC is just the first built-in model.
  - title: Floating, readable edges
    details: Edges attach to node borders and follow nodes as you move them. Click a node to see what it depends on and what it unblocks.
  - title: Static or connected
    details: Build one offline HTML file, or run the server to scan a real folder, open files and persist state.
  - title: Portable models
    details: Save and reopen any graph as a Strata Graph Model (.sgm) file, a self-contained JSON document.
---

## Key ideas

- **Strata Graph Model** is the document you edit: sections, nodes and edges. It is saved as a `.sgm` file (JSON) and reopens exactly as you left it.
- **Sections** are the horizontal bands that group nodes. Each has its own color, and a central node that counts what it contains.
- **Nodes** are the things you model (documents, tasks, anything). A node belongs to a section and carries a status, files, and metadata such as a due date.
- **Edges** are dependencies: the source is the prerequisite, the target depends on it.
- **Modes** decide where data comes from. **Static** runs anywhere from a single HTML file; **Connected** runs a local server that scans a real folder.

New here? Start with the [Quick start](/getting-started/quick-start), then learn [The interface](/getting-started/the-interface).
