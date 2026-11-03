---
name: generar-wiki-strata
description: Generates and maintains the Strata wiki as a VitePress site in the style of the rigby2d documentation (docs/wiki). Use when creating, rewriting or updating any wiki page, when documenting a new feature or way of working, or when touching the information architecture, the style or the deploy of the wiki.
---

# Generate and maintain the Strata wiki (rigby2d style, VitePress)

The public Strata wiki is a **VitePress** site in `docs/wiki/`, built to static
HTML and published on **GitHub Pages**. The content is Markdown; no server is
needed to read it (the `.md` files read as-is, or you visit the published site).
The style reference model is `https://rigby2d.com/docs/`.

Public content in **English** (like all public content in the repo). Internal
work and chat, in Spanish.

## 1. Information architecture (sidebar) — authoritative

Order: first use → working → models/data → reference. Keep this structure; when
adding pages, place them in the correct section.

- **Getting started**: `index` (home), `installation`, `quick-start`,
  `the-interface`, `preferences`.
- **Modeling**: `sections`, `nodes`, `edges`, `comments`, `importing-files`.
- **Working with the graph**: `selecting-and-moving`, `node-metadata`
  (lock, creation/due dates), `multi-selection`, `overlays-and-actions`,
  `highlighting`, `undo-redo`, `themes`.
- **Models and data**: `strata-graph-model` (.sgm), `modes` (static vs
  connected), `data-folder`, `built-in-models` (SDLC).
- **Reference**: `keyboard-shortcuts`, `sgm-format`, `exporting`,
  `architecture`, `troubleshooting`, `roadmap`.

Each entry is a `.md` in `docs/wiki/<section-folder>/<page>.md`. The sidebar and
the nav live in `docs/wiki/.vitepress/config.ts` and must mirror this exact IA.

## 2. Page template

Every page (except the home) follows this shape, modeled on the rigby2d style:

```md
---
title: <Title of 2 to 4 words>
---

# <Title>

<A single sentence summarizing what the page is about.>

<Body: `##`/`###` headings, short paragraphs, lists, screenshots with a caption,
callouts, code blocks. Define each term the first time it appears.>
```

- The **home** (`index.md`) uses the VitePress `home` layout (hero + features)
  plus a "Key ideas" section with bold guiding sentences that define the core
  terms (Strata Graph Model, section, node, edge, mode).
- Screenshots: store them in `docs/wiki/public/img/` and reference them with
  `/img/<file>.png`, always with a one-line caption below.

## 3. Style rules (derived from rigby2d)

- **Tone**: direct, second person ("you"), short sentences, little marketing,
  focused on what the person can do.
- **UI paths** in compact notation with `▸`: **File ▸ Export model (.sgm)**.
- **Mode, menu and panel names in bold**: **Connected**, **Static**,
  **Preferences**.
- **Explicit keys** with `<kbd>`: `<kbd>N</kbd>`, `<kbd>Ctrl</kbd>+<kbd>Z</kbd>`.
- **Define each term** the first time it appears on the page.
- No double hyphen (`--`) in any text. Professional register, no childish or
  colloquial phrasing.
- Correct terminology: the engine document is a **Strata Graph Model** (a `.sgm`
  file); what used to be a "template" is a **built-in model**. Never use
  "template" or "starter" for that concept.

## 4. Callouts (VitePress syntax)

Use containers to highlight, in the style of the rigby2d Tip/Note:

```md
::: tip
Shortcut or best practice.
:::
::: warning
Something that can cause data loss or confusion.
:::
::: info
Context or clarification.
:::
```

## 5. VitePress conventions

- Config: `docs/wiki/.vitepress/config.ts` (title, description, `base`, `nav`,
  `sidebar`, `editLink`, `socialLinks`, `outline`, footer).
- `base` must be `/strata-graph/` for the repo's GitHub Pages.
- Internal links relative without extension: `[nodes](./nodes)`.
- Code groups when there are per-OS or per-mode variants.
- `editLink` pointing to the repo for "Edit this page on GitHub".
- `outline: "deep"` for the side TOC; `docFooter` for prev/next.

## 6. Build and deploy

Scripts in `package.json` (do not break the existing ones):

- `docs:dev` → `vitepress dev docs/wiki`
- `docs:build` → `vitepress build docs/wiki`
- `docs:preview` → `vitepress preview docs/wiki`

Deploy: workflow `.github/workflows/deploy-wiki.yml` that runs `docs:build` and
publishes `docs/wiki/.vitepress/dist` to GitHub Pages on every push to `main`.

VitePress is a `devDependency`. The wiki lives in `docs/wiki/` so it does not mix
with the engine data folder (connected mode uses `--data`, default `<root>/docs`,
configurable).

## 7. Coverage (leave nothing loose)

The wiki must document **features and ways of working**. Before calling a page
complete, verify it covers, where applicable:

- Reading the graph: bands/sections, central node with `AUTO x/x · MANUAL +n`,
  states (generated / not-generated / unavailable), edges by section.
- Modeling: create nodes (＋ Node, file drop), connect (border drag → direction
  dialog, Connect panel), comments, reassign section.
- Node metadata: **lock** (does not move), creation date, **due date** with a
  live countdown and urgency indicator.
- Selection: click (highlights dependencies), box-select, **multi-selection** with
  a shared action bar (lock/unlock all); selection survives rebuilds.
- Overlays: node overlay with an **action bar** (lock/connect/comment/delete),
  auto-dismiss, and that **does not appear over the node border**.
- Undo/redo, themes, Preferences, PNG export.
- Models and data: **Strata Graph Model**, the **`.sgm`** format (export/import),
  **Static**/**Connected** modes, configurable **data folder** (`--data`),
  built-in models (SDLC).

## 8. Maintenance (permanent rule)

When a feature lands or a way of working changes, **update the wiki in the same
batch** (the affected page and, if applicable, the IA). Keep it in sync with the
backlog. A feature without its wiki page is not finished.

## 9. Checklist when adding or updating a page

1. Place it in the correct IA section (§1) and register it in the sidebar.
2. Follow the template (§2) and the style rules (§3).
3. Define terms on first use; use `▸` paths, bold mode names, `<kbd>`.
4. Add callouts where there are shortcuts or risks.
5. Verify coverage (§7) of the feature it documents.
6. `npm run docs:build` with no errors; check internal links.
7. Incremental commit in English, without internal tracker codes.
