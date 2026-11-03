# Usage

## Develop

```bash
npm install
npm run dev        # Vite dev server (demo graph, static mode)
npm run build      # typecheck + single self-contained HTML in dist/
npm run preview    # serve the production build
```

`npm run build` produces **one offline HTML file** (`dist/index.html`) you can
open in any browser — no CDN, no extra files.

## Connected mode (scan a real project)

```bash
npm run build
npm run serve -- --root <path-to-a-project-with-docs>   # http://127.0.0.1:8777
```

Options: `--root <dir>` (project to scan, must contain `docs/`), `--port <n>`.

The Node/TS server (`src/server`, run with `tsx`) scans `docs/`, serves the app,
and adds:

- real file paths and **open file / open folder** from a node's overlay,
- a native **file picker** (＋ Node),
- state persistence to `docs/.strata-state.json`.

## Cross-platform

| Action | Windows | Linux | macOS |
|---|---|---|---|
| open file/folder | `explorer` | `xdg-open` | `open` |
| native file picker | PowerShell | `zenity` / `kdialog` | `osascript` |

If no Linux picker is installed, ＋ Node falls back to a name prompt.

## Modes

- **Static** — the built HTML opened directly. Demo graph, positions in
  `localStorage`, no real paths.
- **Connected** — served by `npm run serve`. Real scan, real paths, file
  open/folder, shared state file.

The header badge shows which mode is active (`● Connected` / `○ Static`).
