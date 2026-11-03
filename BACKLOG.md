# Strata — backlog / roadmap

Captured requirements for the editor. Grouped by theme. Many canvas items come
**near-free with React Flow** (marked `[RF]`); others are our domain logic
(`[domain]`) or custom UI on shared primitives (`[ui]`).

## 0. Done
- [x] Project skeleton: Vite + React + TS + React Flow, single-file build (~114 KB gzip).
- [x] Generic core contract (`GraphModel`) + SDLC template (canon ported from Python).
- [x] Banded layout, section central nodes with `AUTO x/x`, generated vs not-generated (red dashed), edges colored by target section.
- [x] **Connected-mode server (Node/TS, tsx)**: real `docs/` scan, extras, link-refined edges, mode detection (connected/static).
- [x] **Position persistence**: drag → `docs/.strata-state.json` (connected) + localStorage (static), reapplied on load.
- [x] Stronger band colors (both themes).
- [x] Box-selection (drag on pane) + right-click pan.
- [x] **Cross-platform native file picker** (Windows / macOS / Linux zenity|kdialog, with fallback).
- [x] **Reusable UI primitives** (`Button`, `Panel`, `Field`) + **top menu bar** (File/Edit/View) + **quick toolbar**.
- [x] **Node overlay** (hover + double-click): flags (Auto/Manual, Generated/Not-generated), files with **open file / open folder** (connected), **section reassignment**, delete, add comment.
- [x] **Live theme toggle** (light/dark/system), persisted.
- [x] **Undo/redo** (Ctrl+Z / Ctrl+Y) over structural changes.
- [x] **Manual nodes** (pick file / prompt) and **manual edges** with a **direction dialog** (A→B / B→A / comment link).
- [x] **Comments / flags** as a distinct node type with distinct connector style.
- [x] **Preferences panel** (reusable): hide not-generated, edge color by section, show dependency edges.
- [x] **Export PNG** of the whole diagram.
- [x] Dependency highlight on select (depends-on / unblocks) + dimming.
- [x] **Floating edges**: attach to the node border at the nearest point (draw.io-style), follow nodes live.
- [x] **Multi-side connection points** (4 per node) + **subtle handles** (show on hover).
- [x] **Section central node moves horizontally only** (locked Y).
- [x] **Drag a file from the OS onto the canvas** -> manual node at drop point.
- [x] **Edge hover panel** (depends-on / dependent, with sections) + **delete connector** (non-branch).
- [x] **"Unavailable" nodes** (was generated, now gone): crossed out, excluded from AUTO counts.
- [x] UI is **English** (primary requirement met; multi-language still optional).

## Remaining (needs visual QA — do with the app open)
- [ ] **Bands auto-grow to content**: dragging a node past a band expands that band instead of overlapping the next. (high value, deferred: needs on-screen tuning)
- [ ] i18n multi-language (English done; add a language switch + es dict).
- [x] Subtle action bar on hover overlays (icon buttons: lock / connect / comment / delete, with tooltips).
- [x] Per-node metadata: lock (prevent dragging), creation date, due date with a live countdown and urgency indicator.
- [x] Multi-select shared action bar (lock / unlock the whole selection) and selection that survives canvas rebuilds.
- [x] Hover overlay is suppressed over a node border so it does not block edge creation from the handles.
- [ ] Direction icon at the edge origin; edge color already follows target section.
- [ ] Advanced export: pick sections / include-or-exclude comments.

## 1. Data & template `[domain]`
- [ ] **i18n**: English as default UI language; multi-language support (few labels).
- [ ] **Connected scanner** (Node/TS server): real generated/missing status from `docs/`.
- [ ] Section central shows `AUTO x/x · MANUAL +y` (manual nodes counted separately).
- [ ] **Unavailable** node (existed, now removed): crossed out, **excluded** from `AUTO x/x`.
- [ ] A node can have **0..N associated files**; select a file row → **open file / open folder**.
- [ ] Change a node's **section membership** via a dropdown in the node panel.

## 2. Canvas & layout
- [ ] Central node **horizontally centered** in its band (free up drag area). `[ui]`
- [ ] Central node moves **left–right only**. `[RF]`
- [ ] **Bands auto-grow to content**: dragging a node past the band height expands that
      band instead of letting the node float over another section. `[domain]`
- [ ] Stronger **section background colors** in both themes (currently too faint). `[ui]`
- [ ] **Box-select** multiple nodes and move together. `[RF]`
- [ ] **Pan with right-click** on background (grab-hand cursor); a toolbar "pan" toggle that
      syncs with the right-click state. `[RF]`
- [ ] **Multi-anchor** connection points (draw.io style): multiple points per side + corners;
      edges attach to the **border**, not the center. `[RF]`
- [ ] Drag-and-drop **files from the OS** onto the canvas (connected mode), beside Import. `[RF]`
- [ ] **Undo/redo (Ctrl-Z)** via history store. `[ui]`
- [ ] **Context-aware keyboard shortcuts** (general vs section node / doc node / edge). `[ui]`

## 3. Edges & dependency semantics `[domain]`
- [ ] On creating an edge: panel to pick **direction** — depends from→to | to→from |
      free (ask the type when the drag finishes). Quick options.
- [ ] Subtle **direction icon** at the edge origin (depends-on vs depended-by).
- [ ] Edge color = **target node's section color** (already partly done; keep as rule).
- [ ] **Manage/delete** connectors (except the main section-central branch).
- [ ] Hover an edge → overlay: *section/node it depends on* and *section/node dependent*.
- [ ] Quick toggles: **show dependency lines / show dependents lines**.
- [ ] Connection drag handles should be **subtler**.

## 4. Comments / flags `[ui]` `[domain]`
- [ ] Drag a **flag icon** from the top bar onto the canvas → prompts title, description,
      optional file/web reference.
- [ ] **Delete** flags.
- [ ] Comments can connect to a node but carry **no dependency semantics**; their connector
      lines look **different** from dependency edges.

## 5. UI framework & reusable building blocks `[ui]`
- [ ] **Top dropdown menu bar** (Photoshop-style) + the current quick toolbar
      (node / export / import / rearrange / fit / theme).
- [ ] **One reusable configuration Panel** used by ALL settings (consistent shape).
- [ ] **Preferences** system like [rigby2d](https://rigby2d.com/editor/) (Edit → Preferences…).
      Reference repo: `jaisurya-dev-art/rigby2d`.
- [ ] Every overlay (node/edge) has a **subtle top action bar**: icon buttons with
      descriptive tooltip + shortcut (delete / add connected comment / delete connectors /
      change section / …).
- [ ] **Double-click** opens the hover panel too.
- [ ] Section central **color config** (menu → panel; color first, more later).
- [ ] Shared primitives: `Panel`, `Overlay`, `Menu`, `Toolbar` — a mini design system so
      every feature reuses the same blocks.

## 6. Export `[ui]` `[RF]`
- [ ] **Export to image**; choose specific sections or all; include/exclude comment flags.
