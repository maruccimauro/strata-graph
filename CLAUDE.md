# Strata

## What it is (and what it is NOT)
Strata is a generic **visual editor for dependency graphs**. The user models
nodes, groups them into **configurable sections**, and defines dependencies
between them, in any domain.

The core is **domain-agnostic**. It is not an SDLC tool or a software life-cycle
tool. The engine document is the **Strata Graph Model** (what used to be called a
"template"); SDLC is only **one built-in Strata Graph Model** to start from, and
there will be many others. When describing the project (README, package.json,
commits, GitHub) always talk about the generic engine, never present it as tied
to a specific domain.

A **Strata Graph Model** is serialized as a **`.sgm`** file (versioned JSON:
`format` + `version` + `model`). Built-ins (such as SDLC) only produce an initial
GraphModel; the portable document is the `.sgm`.

## Architecture
- **Generic engine**: `src/core/` — `GraphModel` (meta, sections, nodes, edges),
  `.sgm` serialization (`sgm.ts`), layout and types. It knows no domain.
- **Built-in models (pluggable)**: `src/models/<domain>/` — contribute initial
  sections, nodes and edges. `sdlc/` is the first; each built-in model is
  independent of the core.
- **Editor**: `src/editor/` — React + React Flow (`@xyflow/react`). Floating
  edges, overlays, undo/redo, persistence, themes.
- **Optional server**: `src/server/` — Node/TS via `tsx`. Gives access to real
  file paths and project scanning (connected mode). Without the server, the app
  runs as a self-contained static HTML.

## Two modes
- **Static**: `npm run build` produces a single offline HTML (opens in any
  browser). State in `localStorage`.
- **Connected**: `npm run serve` starts the Node server; enables opening
  files/folders and scanning a **configurable data folder** (`--data <dir>`,
  default `<root>/docs`). State is persisted in `<data>/.strata-state.json`. The
  data folder is independent of the repo wiki (`docs/`): point `--data` to a
  different path to keep them separate.

## Commands
- `npm run dev` — Vite in development.
- `npm run build` — typecheck + single-file build.
- `npm run serve` — Node server (connected mode).
- `npm run typecheck` — `tsc --noEmit`.

## Conventions
- **Cross-platform required**: must work on Windows and Linux. The native picker
  and file opening use per-OS branches (PowerShell/osascript/zenity/kdialog;
  explorer/open/xdg-open).
- **Public content in English** (README, UI, descriptions, commits). Internal
  work and chat, in Spanish.
- **Professional register**: no childish or colloquial phrasing in deliverables.
- **No double hyphen (`--`)** in any text.

Hard rules with a body live one per file in `.claude/rules/` and are imported
below (one-line index + full detail in the file, which is the **source of
truth**). When working on the topic, follow the imported file, not just the
summary.

- **Commits and branch flow (HARD)**: incremental, self-describing commits in
  English, without internal tracker codes; trunk-based, one branch per batch,
  `--ff-only` merge to `main` when green; `main` stable, never rewrite history.
  Detail: @.claude/rules/git-and-commits.md
- **Configurability policy (HARD)**: every action/option is placed in the top
  menu / **context menu (right click)** / quick bar / preferences, in the same
  batch, and on closing you verify where each one ended up. Detail:
  @.claude/rules/configurability.md
- **i18n-ready (mandatory)**: every **new** UI string goes through the `t()` layer
  (`src/editor/i18n.ts`), never hardcoded; existing ones are migrated
  incrementally; default language English. Detail: @.claude/rules/i18n.md
- **Keyboard and pointer notation (HARD)**: keys in user-facing text render each
  as a `<kbd>` keycap in natural capitalization, joined with `+` (for example
  `<kbd>Ctrl</kbd>+<kbd>Z</kbd>`, `<kbd>Delete</kbd>`); the program uses the `Kbd`
  and `Shortcut` primitives, and plain-text-only contexts (native tooltips) fall
  back to `Ctrl+Z`. Applies to UI and wiki; migrate existing ones incrementally.
  Detail: @.claude/rules/keyboard-notation.md
- **Wiki in the same batch (do not defer)**: a feature's wiki page is
  written/updated in the **same batch**; superseded old content is removed; a
  feature without its wiki is not finished. Detail: @.claude/rules/wiki.md
- **Versioning (HARD)**: **SemVer** + **`CHANGELOG.md`** (Keep a Changelog). Two
  rhythms: changelog under `[Unreleased]` **in every batch** (concise bullets, one
  per change); version cut (bump + tag) **by milestone, not per batch**. In `0.x`
  feature = minor, fix = patch. The `.sgm` `SGM_VERSION` is independent. Detail:
  @.claude/rules/versioning.md
- **Cross-impact before reusing/changing (HARD)**: if reusing or changing a
  behavior would make **another** behave differently, ask first in the chat among
  options (extend / modify / duplicate / leave) with the recommended one, instead
  of deciding alone. Detail: @.claude/rules/cross-impact.md
- **Verify before documenting (HARD)**: every statement about the current state
  of the system must be verifiable in code, tests or configuration; the changelog
  records implemented changes, the backlog records planned ones. Detail:
  @.claude/rules/verify-before-documenting.md

## Tracking
- `BACKLOG.md`: **pending** work only (planned / in-progress / blocked / deferred),
  one canonical entry per requirement. Completed work lives in the changelog and
  Git history, not here.
- `ROADMAP.md`: product direction and milestones (no task list, no dates).
- `CHANGELOG.md`: version history (Keep a Changelog). Updated in the same batch as
  the feature; see Conventions ▸ Versioning. A batch without its changelog entry
  is not finished.
- `docs/wiki/`: public wiki in **VitePress** (rigby2d style, deployed to GitHub
  Pages). Generated and maintained with the `generar-wiki-strata` skill. A feature
  without its wiki page is not finished.
