---
title: Static and Connected modes
---

# Static and Connected modes

Strata runs in one of two modes, which decide where data comes from. The header badge shows the active one: **● Connected** or **○ Static**.

## Static

Static mode is the single built HTML file, opened directly or served by `npm run dev`.

- Data comes from the bundled [built-in model](/models-data/built-in-models) (no scanning).
- Positions and state live in the browser's `localStorage`.
- No real file paths; **＋ Node** asks for a name.

This is the zero-setup mode: `npm run build` gives you one offline file that works in any browser.

## Connected

Connected mode runs a local Node server that serves the app and a small API.

```bash
npm run build
npm run serve -- --root <path-to-a-project> [--data <dir>] [--port 8777]
```

It adds, on top of Static:

- a real scan of the [data folder](/models-data/data-folder) to mark nodes generated, missing or extra, and to refine edges from real Markdown links,
- real file paths with **open file / open folder**,
- a native **file picker** for **＋ Node**,
- shared state persisted to a file instead of `localStorage`.

The server is localhost only.

## Which to use

- **Static** for a quick model, a shareable file, or offline use.
- **Connected** to track a real folder on disk and open its files.

## Next

- [The data folder](/models-data/data-folder)
- [Importing files](/modeling/importing-files)
