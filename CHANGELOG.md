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

- Bands grow to their content: dragging a node past a band grows the band live to
  keep it inside, sized to the box its nodes occupy so empty space is reclaimed on
  either side. Growth pushes only the neighboring bands on the side it needs, and
  the shared direction (band width when horizontal, height when vertical) grows for
  every band at once, in either direction, so nothing overlaps. The central node
  follows the start of the shared direction as a band extends.
- Preference "Grow bands to dragged content" (default on) in the View menu, the
  quick bar, the background context menu, and Preferences. Turning it off freezes
  the bands where they are and confines nodes to them, so dragging no longer resizes
  or reflows the layout; turning it back on lets the bands follow their content.
- Dragging a multi-selection moves the group confined to the bands: it slides freely
  along the shared direction (growing the bands with auto-grow on) and stops on the
  stacking direction as soon as a selected node reaches its band edge, so a selection
  spanning several bands cannot overlap them.

### Changed

- The `.sgm` format version is now 3; version 1 and 2 files still open and have
  their node positions migrated on import.
- A section central node now moves only across its band (up-down in a horizontal
  layout, left-right in a vertical one) and stays anchored on the other axis, with
  its travel clamped to the band so it cannot drift into a neighboring section.
- Switching the band orientation now re-arranges every node into its section for
  the new layout instead of leaving nodes at their previous coordinates.
- Node positions are now stored per orientation, so horizontal and vertical each
  keep their own arrangement and a node without a saved position in the active
  orientation falls back to the default layout.

## [0.7.0] - 2026-11-04

### Added

- GitHub Release workflow: pushing a version tag builds the offline single-file
  app, takes the release notes from the matching changelog section, and attaches
  the build as a downloadable `strata-vX.Y.Z.html` asset.
- Manual workflow trigger to backfill a release for an existing tag.
- Built-in model picker (File ▸ New from built-in, the ⊕ New quick-bar button,
  and the canvas context menu) to start a fresh graph from a registered built-in.
- Second built-in model, a domain-neutral task board, alongside SDLC.
- Discard confirmation before replacing a graph that has unsaved work.
- File ▸ Load demo, and a first-run prompt offering the demo over a clean start;
  the chosen startup model is remembered across reloads.
- `CHANGELOG.md` with the release history reconstructed from the git log into six
  themed versions.
- Six retroactive annotated tags, `v0.1.0` through `v0.6.0`, on their closing
  commits.
- Versioning policy and process in the wiki (`reference/versioning`), linking this
  changelog as the single source of truth.

### Changed

- Clarified the versioning rule: update the changelog under `[Unreleased]` every
  batch, but cut a version (bump plus tag) at a milestone, not once per batch.
- Moved the hard process rules (versioning, wiki, configurability, i18n) into
  `.claude/rules/`, one file each, imported from `CLAUDE.md` as a one-line index.
- Extended `.claude/rules/` with git-and-commits and cross-impact rules, and made
  the rule files the source of truth for each process rule.

## [0.6.0] - 2026-11-04

### Added

- Select a dependency edge and delete it with Delete or Backspace (undoable;
  section-to-central branch edges are protected).
- Right-click context menus for the canvas, a node and an edge, each with the
  actions relevant to the target.
- Hover a node to light its full upstream and downstream dependency chains; hover
  an edge to glow it in its own color.
- Four-place toggle for hover highlighting: quick bar, View menu, Preferences and
  the canvas context menu.
- Retarget an edge from the overlay in two modes: a sticky pointer mode and a list
  locked to one end; an endpoint anchor can be double-clicked to start.
- Node connection manager: lists every dependency and comment edge touching a node
  with its direction and other end, and removes any in place (undoable).
- Internationalization layer (`t(key, vars)` with an English dictionary and a
  fallback chain) and a language selector in Preferences; the editor UI routes
  through it.

### Changed

- Replaced the timed hover overlay with a primary-click model: single click
  selects, double click opens a sticky overlay, Alt with hover shows a transient
  one, Escape is staged.
- A selected edge is marked with a glow in its own color instead of a thick
  stroke.

### Fixed

- Hover highlighting affects edges only, removing a node select and deselect
  flicker.
- The whole edge endpoint anchor is clickable, not just its outline, and clears
  the origin dot and arrowhead.

## [0.5.0] - 2026-11-03

### Added

- Two-pane categorized preferences panel.
- Per-section color configuration with live recolor and reset to the built-in hue.
- Vertical band layout toggle alongside the horizontal layout, with the viewport
  re-fitting on switch.
- Eight connection points per document node (four sides and four corners),
  revealed on hover.
- Origin dot marking the source end of every dependency edge.

## [0.4.0] - 2026-11-03

### Added

- Public wiki rebuilt as a VitePress site in rigby2d style, with sidebar, local
  search and per-page table of contents.
- `generar-wiki-strata` skill to generate and maintain the wiki.
- GitHub Pages deploy workflow that publishes the wiki on every push to `main`.

### Changed

- Replaced the flat `docs/*.md` pages with the VitePress wiki.

### Fixed

- Patched dev-tooling security advisories (esbuild, vite).

## [0.3.0] - 2026-11-03

### Added

- `.sgm` serialization: a versioned JSON envelope around a `GraphModel`.
- Export the current graph to a `.sgm` file, and import a `.sgm` file as a fresh
  graph, with validation that rejects malformed or future-version files.
- Configurable data folder for connected mode (`--data <dir>`), kept separate from
  the repository `docs/`.

### Changed

- Renamed the "template" concept to built-in model; the portable `.sgm` is the
  document of record and SDLC is the first built-in model.

## [0.2.0] - 2026-11-03

### Added

- Per-node metadata: creation date, due date, and lock flag.
- Live due-date countdown that turns red when overdue, with an urgency dot on the
  node.
- Node lock that prevents dragging, toggled from the overlay and persisted.
- Overlay action bar with icon buttons (lock, connect, comment, delete).
- Multi-selection shared action bar to lock or unlock the whole selection.

### Changed

- Suppress the overlay over a node border so it does not block edge creation.
- Preserve selection across canvas rebuilds.
- Adopted a trunk-based feature-branch workflow with self-contained commits.

## [0.1.0] - 2026-11-03

### Added

- Generic `GraphModel` core (sections, nodes, edges) with a domain-agnostic banded
  layout engine.
- Built-in SDLC model as the first starting point.
- Connected-mode Node server: scans a real project folder and exposes a
  cross-platform API (scan, state, open file or folder, native picker).
- Static and Connected run modes, with state in `localStorage` or next to the
  scanned data.
- React Flow canvas with custom node and edge types, border-attached floating
  edges, and light, dark and system themes.
- UI shell: top menu bar, quick toolbar, reusable panels, node and edge overlays,
  and undo/redo.
- Initial project wiki and backlog.

[Unreleased]: https://github.com/maruccimauro/strata-graph/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/maruccimauro/strata-graph/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/maruccimauro/strata-graph/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/maruccimauro/strata-graph/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/maruccimauro/strata-graph/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/maruccimauro/strata-graph/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/maruccimauro/strata-graph/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/maruccimauro/strata-graph/releases/tag/v0.1.0
