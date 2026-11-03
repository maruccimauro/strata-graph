# Strata

A **visual editor for dependency graphs**, grouped into configurable
**sections** and adaptable to any domain. You define the sections, node types
and dependency rules for your domain, point Strata at a data source, and it
renders an editable graph: a central node per section, nodes branching off,
dependency edges, and "not generated" placeholders for expected-but-missing
nodes.

The engine is **domain-agnostic**: it works for course prerequisites, content
pipelines, approval flows or any staged dependency graph. Domains plug in
through self-contained definitions; the bundled **SDLC** definition (software
project lifecycle, from the
[`sdlc-starter-kit`](https://github.com/maruccimauro/sdlc-starter-kit)) ships as
one worked example, not as the product's purpose.

## Architecture

```
src/
  core/        # generic engine: GraphModel types + layout. Knows no domain.
  editor/      # React Flow integration: canvas, node/edge components, theme.
  templates/   # pluggable domains. sdlc/ = canon + model builder (first one).
  server/      # (next) Node/TS backend: filesystem scanner, open file/folder, state.
```

- **Core contract** (`core/types.ts`): a `GraphModel` = sections + nodes + edges.
  A template produces one; the editor renders/edits it. Nothing SDLC-specific
  lives in the editor.
- **Rendering** is [React Flow](https://reactflow.dev) (MIT): pan/zoom, drag,
  multi-anchor handles, box selection, minimap — so we build domain logic, not a
  graph editor from scratch.

## Develop

```bash
npm install
npm run dev        # Vite dev server (demo graph, static mode)
npm run build      # typecheck + single self-contained HTML in dist/ (~125 KB gzip)
npm run preview    # serve the production build
```

The build is **one offline HTML file** (via `vite-plugin-singlefile`): opens in
any browser, no CDN, no extra files.

## Connected mode (real project)

```bash
npm run build
npm run serve -- --root <path-to-a-project-with-docs>   # http://127.0.0.1:8777
```

The Node/TS server (`src/server`, run with `tsx`) scans the project's `docs/`,
serves the app, and adds real file paths, **open file / open folder**, a native
**file picker**, and state persistence to `docs/.strata-state.json`.

**Cross-platform** (Windows + Linux + macOS): `open file/folder` uses
`explorer` / `xdg-open` / `open`; the native picker uses PowerShell on Windows,
`zenity` or `kdialog` on Linux, and `osascript` on macOS. If no picker is
available it falls back to a name prompt.

## Status

Working editor: connected scan, banded dependency graph, drag + persistence,
manual nodes/edges with a direction dialog, comments, node overlay (flags +
open file/folder + section), undo/redo, live theme, preferences, PNG export.
Remaining refinements in [`BACKLOG.md`](BACKLOG.md).

## License

MIT (planned). Built on React Flow (MIT).
