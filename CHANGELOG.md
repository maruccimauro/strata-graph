# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the project is in its `0.x` phase a new feature bumps the minor version and
a fix bumps the patch version; a public `1.0.0` is reserved for the first stable
release. The `.sgm` file format carries its own independent integer version
(`SGM_VERSION`), which only changes on an incompatible data change.

Versions `0.1.0` through `0.6.0` were reconstructed retroactively from the git
history; the project carried no tagged releases before this file was introduced.

## [Unreleased]

### Added

- `CHANGELOG.md` and retroactive annotated tags (`v0.1.0` through `v0.6.0`).
- Versioning policy and process documented in the wiki (`reference/versioning`).

## [0.6.0] - 2026-11-04

Edge management and interaction overhaul.

### Added

- Select a dependency edge and remove it with Delete or Backspace (undoable,
  branch edges excluded).
- Right-click context menus for the canvas, nodes and edges, with context-aware
  item sets.
- Hover path highlighting: hovering a node lights its upstream and downstream
  edge chains end to end, and hovering an edge glows it in its own color.
- Edge retarget from the Dependency overlay: a sticky pointer mode and a list
  mode that reuses the connect panel locked to one end; endpoint anchors can be
  double-clicked to start the retarget.
- Node connection manager that lists every dependency and comment edge touching a
  node and removes them in place.
- Internationalization layer (`t(key, vars)` with an English dictionary and a
  fallback chain) and a language selector in Preferences; the editor UI is routed
  through it.

### Changed

- Replace the timed hover overlay with a primary-click interaction model: single
  click selects, double click opens a sticky overlay, Alt with hover shows a
  transient overlay, and Escape is staged (close overlay, then clear selection).
- Mark a selected edge with a glow instead of a thick stroke.

### Fixed

- Keep hover highlighting to edges only and remove the related selection flicker.
- Make the whole edge anchor clickable, not just its outline.

## [0.5.0] - 2026-11-03

### Added

- Two-pane categorized preferences panel with per-section color configuration and
  live recolor.
- Vertical band layout toggle alongside the horizontal layout.
- Eight connection points per document node (four side centers and four corners),
  revealed on hover.
- Origin dot marking the source (prerequisite) end of every dependency edge.

## [0.4.0] - 2026-11-03

### Added

- Public wiki rebuilt as a VitePress site in rigby2d style, with a GitHub Pages
  deploy workflow.
- `generar-wiki-strata` skill to generate and maintain the wiki.

### Changed

- Replace the flat `docs/` pages with the VitePress wiki.

### Fixed

- Patch dev-tooling advisories (esbuild, vite).

## [0.3.0] - 2026-11-03

### Added

- Strata Graph Model (`.sgm`) serialization: a versioned JSON envelope around a
  `GraphModel`.
- Export the current graph to a `.sgm` file and import a `.sgm` file as a fresh
  graph.
- Configurable data folder for connected mode, decoupled from the repository
  `docs/`.

### Changed

- Rename the "template" concept to built-in model; the portable document is the
  Strata Graph Model.

## [0.2.0] - 2026-11-03

### Added

- Per-node metadata: creation date, due date with a live countdown and urgency
  indicator, and a lock that prevents dragging.
- Overlay action bar with icon buttons (lock, connect, comment, delete).
- Multi-selection shared action bar to lock or unlock the whole selection.

### Changed

- Suppress the overlay over a node border so it does not block edge creation.
- Preserve selection across canvas rebuilds.
- Adopt a trunk-based feature-branch workflow with self-contained commits.

## [0.1.0] - 2026-11-03

### Added

- Generic `GraphModel` core (sections, nodes, edges) with a banded layout engine,
  domain agnostic.
- Built-in SDLC model as the first starting point.
- Connected-mode Node server with a cross-platform scanner and API (scan, state,
  open file or folder, native picker).
- React Flow canvas with node and edge types, border-attached floating edges, and
  light, dark and system themes.
- UI framework: top menu bar, quick toolbar, reusable panels, node and edge
  overlays, and undo/redo.
- Initial project wiki and backlog.

[Unreleased]: https://github.com/maruccimauro/strata-graph/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/maruccimauro/strata-graph/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/maruccimauro/strata-graph/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/maruccimauro/strata-graph/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/maruccimauro/strata-graph/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/maruccimauro/strata-graph/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/maruccimauro/strata-graph/releases/tag/v0.1.0
