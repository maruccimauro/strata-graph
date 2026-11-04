# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the project is in its `0.x` phase a new feature bumps the minor version and
a fix bumps the patch version; a public `1.0.0` is reserved for the first stable
release. Each batch merged to `main` records its changes under `[Unreleased]`; a
version is cut at a milestone, not once per batch. The `.sgm` file format carries
its own independent integer version (`SGM_VERSION`), which only changes on an
incompatible data change.

Versions `0.1.0` through `0.6.0` were reconstructed retroactively from the git
history; the project carried no tagged releases before this file was introduced.

## [Unreleased]

### Added

- `CHANGELOG.md` and six retroactive annotated tags (`v0.1.0` through `v0.6.0`),
  reconstructing the release history from the git log and grouping it into themed
  versions.
- Versioning policy and process in the wiki (`reference/versioning`), which links
  this changelog as the single source of truth for the history.

### Changed

- Clarified the versioning rule: the changelog is updated under `[Unreleased]` in
  every batch, while a version is cut (bump plus tag) at a milestone rather than
  once per batch, so version numbers track releases and not individual commits.

## [0.6.0] - 2026-11-04

The largest batch so far: edges became fully editable, the whole interaction
model was rebuilt around primary clicks, and the editor gained context menus,
hover insight, internationalization and edge retargeting.

### Added

- Edge selection and deletion: click a dependency edge to select it and remove it
  with Delete or Backspace. The removal is undoable, and the section-to-central
  branch edges are protected so the structure cannot be broken by accident.
- Context menus on right click for the canvas, a node and an edge, each offering
  only the actions relevant to what is under the cursor: add node, fit, reset
  layout, the highlight and visibility toggles, theme and preferences on the
  canvas; open, lock, connect, comment and delete on a node; open and delete on an
  edge.
- Hover path highlighting: hovering a node lights its full upstream and downstream
  dependency chains end to end, transiently and without selecting the node, so you
  can trace what it depends on and what depends on it at a glance; hovering an edge
  glows it in its own color. The behavior is toggleable from the quick bar, the
  View menu, Preferences and the canvas context menu.
- Edge retargeting from the Dependency overlay, in two ways: a sticky pointer mode
  where a line follows the cursor from the fixed end and clicking a node commits
  the new endpoint, and a list mode that reuses the connect panel locked to one
  end so you can pick the new node by section and name. Endpoint anchors can also
  be double-clicked to start the retarget, and the edge blinks while it moves.
- Node connection manager: a panel that lists every dependency and comment edge
  touching a node, showing its direction (Depends on, Required by or Comment) and
  the node at the other end with its section, and removes any of them in place
  (undoable). It opens from the overlay action bar and the node context menu.
- Internationalization layer: `t(key, vars)` with an English dictionary, variable
  interpolation and a fallback chain, plus a language selector in Preferences. The
  top bar, context menus, overlays, connect and retarget panels and native prompts
  all route through it, so further languages can be added without a refactor.

### Changed

- Replaced the timed hover overlay with a primary-click interaction model: a
  single click selects a node or edge, a double click opens its sticky overlay,
  Alt with hover shows a transient overlay without selecting, and Escape is staged
  so the first press closes the overlay and the second clears the selection.
- A selected edge is now marked with a glow in its own color instead of a thicker
  stroke, so the line weight stays stable and the selection reads as a halo.

### Fixed

- Kept hover highlighting to edges only, removing a flicker where hovering a node
  could select or deselect it.
- Made the whole edge endpoint anchor clickable, not just its outline, and pulled
  the anchors back along the edge so they no longer cover the origin dot or the
  arrowhead.

## [0.5.0] - 2026-11-03

Configuration and canvas flexibility: preferences got a real home, sections
became recolorable, and nodes gained more ways to connect.

### Added

- Two-pane categorized preferences panel (a category list beside a content pane,
  rigby2d style) with per-section color configuration that recolors the graph live
  and resets to the built-in hue.
- Vertical band layout toggle alongside the horizontal layout: the central node
  locks the stacking axis and the viewport re-fits when you switch, from the View
  menu and Preferences.
- Eight connection points per document node (four side centers and four corners),
  revealed on hover, so an edge can attach where it reads best instead of only at
  the center.
- An origin dot in the edge color marking the source (prerequisite) end of every
  dependency edge, complementing the arrowhead that marks the target.

## [0.4.0] - 2026-11-03

Documentation became a real product: a published site with its own authoring
skill and an automated deploy.

### Added

- Public wiki rebuilt as a VitePress site in `docs/wiki/`, styled after the
  rigby2d docs, covering the features and workflows with a sidebar, local search
  and a per-page table of contents.
- `generar-wiki-strata` skill that captures the information architecture, page
  template, style rules and deploy, so the wiki stays consistent as it grows.
- GitHub Pages deploy workflow that builds the wiki and publishes it on every push
  to `main`.

### Changed

- Replaced the flat `docs/*.md` pages with the structured VitePress wiki; the
  README and project docs were updated to match.

### Fixed

- Patched dev-tooling security advisories (esbuild, vite).

## [0.3.0] - 2026-11-03

The graph became a portable, versioned document, and the core concept was renamed
to reflect the generic engine rather than any single domain.

### Added

- `.sgm` serialization: a versioned JSON envelope (`format` plus `version` plus
  `model`) around a `GraphModel`, so a graph reopens exactly as it was exported,
  independent of any domain.
- Export the current graph to a `.sgm` file and import a `.sgm` file as a fresh
  graph, both from the File menu, with validation that rejects a malformed or
  future-version file rather than misreading it.
- Configurable data folder for connected mode (`--data <dir>`, default
  `<root>/docs`), with state stored in `<data>/.strata-state.json` and kept
  separate from the repository `docs/`, so the engine data and the wiki never mix.

### Changed

- Renamed the "template" concept to built-in model and made the portable `.sgm`
  the document of record. SDLC became the first built-in model under
  `src/models/`, with `meta.base` recording which built-in a graph derives from.

## [0.2.0] - 2026-11-03

Nodes gained lifecycle metadata, every overlay gained a consistent action bar, and
selections became durable.

### Added

- Per-node metadata stored in the model: a creation date, a due date, and a lock
  flag. The due date shows a live countdown from years down to seconds that turns
  red once overdue, with an urgency dot on the node.
- A lock that prevents a node from being dragged, toggled from the overlay and
  persisted, with a lock glyph shown on the node.
- Overlay action bar: a subtle row of icon buttons (lock, connect, comment,
  delete) with tooltips, sharing one shape across overlays.
- Multi-selection shared action bar: selecting two or more nodes shows a floating
  bar that locks or unlocks the whole selection at once.

### Changed

- The node overlay is suppressed while the pointer is over a node border, so it
  does not block edge creation from the handles.
- Selection now survives canvas rebuilds, so a group stays selected after an edit
  or a file drop.
- Adopted a trunk-based feature-branch workflow with self-contained commits.

## [0.1.0] - 2026-11-03

The first working editor: a domain-agnostic engine, the first built-in model, both
run modes, and the UI shell they live in.

### Added

- Generic `GraphModel` core (meta, sections, nodes, edges) with a banded layout
  engine that knows nothing about any domain: it arranges sections as bands, each
  with a central node, and draws dependency edges between nodes.
- Built-in SDLC model as the first starting point, ported from the original Python
  canon (sections, documents and type-level dependency edges).
- Connected-mode Node server that scans a real project folder for generated versus
  missing files and refines edges from actual links, with a cross-platform API
  (scan, persisted state, open file or folder, and a native file picker on Windows,
  macOS and Linux).
- Static and Connected modes: the static build opens as a single offline HTML file
  with state in `localStorage`, while connected mode persists state next to the
  scanned data.
- React Flow canvas with custom node and edge types, border-attached floating
  edges that follow nodes live (draw.io style), and light, dark and system themes.
- UI shell: a top menu bar (File, Edit, View), a quick toolbar, reusable panels,
  node and edge overlays, and undo/redo over structural changes.
- Initial project wiki and backlog.

[Unreleased]: https://github.com/maruccimauro/strata-graph/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/maruccimauro/strata-graph/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/maruccimauro/strata-graph/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/maruccimauro/strata-graph/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/maruccimauro/strata-graph/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/maruccimauro/strata-graph/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/maruccimauro/strata-graph/releases/tag/v0.1.0
