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

- `ROADMAP.md` stating the product direction and milestones, kept separate from
  the task backlog.
- Development rule `verify-before-documenting`: statements about the current
  state of the system must be verifiable in code, tests or configuration.
- Band panel opened from a section's central node, the band's representative: a
  click on the central, or its "Band options…" context-menu entry, opens the
  panel. It carries the band's own lock and due date, with further band
  management to follow.
- Status indicators on the section central node (lock glyph and due-date dot),
  the same ones documents already show.
- Band name and color controls in the band panel: rename a band and set its hue
  from the central, each with a reset to the built-in value.
- Per-band grow toggle in the band panel: a band can grow or stay frozen
  regardless of the global setting, which remains its default, with a reset to
  follow the global toggle again.
- Re-arrange action in the band panel that tidies a single band's nodes back to
  the grid and sizes it to its content, leaving the other bands untouched.
- Node list in the band panel: every node in the band, with a per-node lock
  toggle, a delete action for existing nodes, and a click on the name to open the
  node's details overlay.
- Bulk actions in the band panel: lock or unlock every node in the band, move all
  of them to another band, and delete all existing nodes at once with one
  confirmation and a single, undoable rebuild alert.
- Band reordering: a "Band order" list in the band panel reorders bands with
  per-row up and down buttons or by dragging a grip, and a central's context menu
  offers Move band up and Move band down. Each reorder is a single undo step and
  the canvas re-packs immediately.
- Drag a band directly on the canvas: each band label carries a grip, and
  dragging it along the stacking direction shows a drop indicator and commits the
  new order on release, as a single undo step.

### Changed

- Band reorder controls follow the layout orientation: the Move band actions and
  the panel arrows read up/down in the horizontal layout and left/right in the
  vertical one. The Band order menu entry shows the band's position framed between
  its neighbors instead of a plain count.
- Section central nodes are now pinned under their band label in both layouts and
  no longer move: they are not draggable and the rubber band does not select them.
  A central is the band's representative rather than a positionable node.
- Section color moved out of Preferences into the band panel, alongside the new
  rename control; the Preferences "Sections" category was removed.
- Band panel reorganized as a compact menu: Appearance, Schedule, Grow & arrange,
  Band order and Nodes each open on their own screen with a Back link, so the
  panel no longer stacks every control into one list that overflows the viewport.

- `BACKLOG.md` restructured to track only pending work, with one canonical entry
  per requirement and explicit status and priority. Completed items are no longer
  duplicated here; they live in this changelog and the Git history.

## [0.9.0] - 2026-11-06

### Changed

- Not-generated nodes are now dimmed instead of hidden: the former "Hide
  not-generated" toggle became "Dim not-generated", which fades those nodes, their
  edges and any highlight on them while keeping them in the layout, so bands no
  longer collapse when placeholders are set aside. Faded nodes stay interactive.
- Automatic (built-in) nodes can now be deleted, not only manual ones. A deleted
  automatic node is kept out of the graph across reloads; undo restores the node,
  its edges, any rebuilt links and the alert together.

### Added

- Preference "Not-generated opacity" (default 10 percent) to set how faded
  not-generated nodes are while dimming is on.
- Layer order control (default nodes on top): choose whether nodes or edges draw on
  top, or let each compete freely, so a crossed edge is no longer trapped under
  another. The hovered or selected node or edge rises within its layer either way.
  Available in Preferences, the View menu, the background context menu and a
  "⿻ Layers" quick-bar button.
- Relational-integrity alert when a node is deleted: only the nodes that depended
  on it are affected (its own prerequisites are left alone). The delete
  confirmation lists those dependents under Required by, each with a checkbox per
  prerequisite to reconnect to, a filter by dependent name, a global select or
  deselect all, and a per-dependent all or none. Deleting a node that nothing
  depends on raises no alert and shows no dialog. Dependents with an undecided
  option are flagged with expanding red waves, a broken-link badge and an
  orphaned or partial severity.
- Rebuild relations panel with actions by scope: Connect or Remove one
  prerequisite option (connecting one leaves the others to decide), Reconnect node
  or Unlink node for one dependent, Reconnect or Dismiss one event, and Reconnect
  all or Dismiss all across events (event and global confirm first). Dependents
  split into Orphaned and Partial sections, each deletion collapses to its title,
  and a quick bar tunes the alert waves and ghost arrows. Clicking a dependent
  section focuses it: it centers the node, highlights the section, and shows only
  that node's ghost arrows flowing from its prerequisites, with a hovered option
  lit up. Reachable from the alert banner, the status-bar badge, the quick bar,
  the View menu and the node and canvas context menus.
- Preferences for the broken-link alert (Relational integrity): wave on or off,
  intensity and speed, and ghost arrows on or off.
- Delete the selected node with the <kbd>Delete</kbd> key, in addition to the node
  overlay and context menu.
- Keyboard shortcuts in the UI now render as `<kbd>` keycaps through shared `Kbd`
  and `Shortcut` primitives (for example the Edit menu's undo and redo), matching
  the wiki.
- Convention for keyboard shortcuts in user-facing text: render each key as a
  `<kbd>` keycap in its natural capitalization, joined with a plus (for example
  `<kbd>Ctrl</kbd>+<kbd>Z</kbd>`), in both the UI and the wiki.

## [0.8.0] - 2026-11-05

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

[Unreleased]: https://github.com/maruccimauro/strata-graph/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/maruccimauro/strata-graph/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/maruccimauro/strata-graph/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/maruccimauro/strata-graph/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/maruccimauro/strata-graph/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/maruccimauro/strata-graph/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/maruccimauro/strata-graph/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/maruccimauro/strata-graph/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/maruccimauro/strata-graph/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/maruccimauro/strata-graph/releases/tag/v0.1.0
