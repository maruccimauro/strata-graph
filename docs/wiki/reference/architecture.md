---
title: Architecture
---

# Architecture

How the code is organized, for contributors.

```
src/
  core/     generic engine: GraphModel types, .sgm serialization, layout. Knows no domain.
  editor/   React Flow integration: canvas, nodes, edges, overlays, theme, UI.
  models/   built-in models. sdlc/ = canon + model builder (the first one).
  server/   Node/TS backend: filesystem scanner, open file/folder, state.
```

## The contract: GraphModel

Everything the editor renders is a `GraphModel` (`core/types.ts`): `meta`, `sections`, `nodes`, `edges`. See [The .sgm format](/reference/sgm-format) for the exact shape. Nothing domain-specific lives in `core/` or `editor/`; a built-in model produces a `GraphModel` and the editor only knows that shape.

## Layers

1. **Built-in model** (`models/sdlc`): declares sections and the canon, and builds the base `GraphModel`.
2. **Scanner** (`server/scanner.ts`): in Connected mode, scans the [data folder](/models-data/data-folder) to mark nodes generated/missing, find extras, and refine edges from real Markdown links.
3. **Editor state** (`editor/model.ts` + `api.ts`): the user layer merged on top: positions, manual nodes and edges, section overrides, removed edges, node metadata, preferences. `buildRenderModel()` merges base graph and state into the model the canvas shows.
4. **Canvas** (`editor/StrataCanvas.tsx`): maps the model to React Flow nodes and floating edges, handles selection, drag, connect and hover.
5. **Orchestrator** (`editor/Editor.tsx`): owns state and undo/redo, renders the top bar, overlays and dialogs, and wires every action.

## Rendering

- **Floating edges** attach to the node border nearest the other node and follow nodes as they move.
- **Theme**: flat tokens are CSS variables (instant light/dark); per-hue section colors are computed in JS and rebuilt on theme toggle.

## Persistence

- **Connected**: `<data>/.strata-state.json` via the server API.
- **Static**: `localStorage`, keyed by project name.

## Next

- [Built-in models](/models-data/built-in-models)
- [Roadmap](/reference/roadmap)
