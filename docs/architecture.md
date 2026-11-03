# Architecture

```
src/
  core/        generic engine — GraphModel types + layout. Knows no domain.
  editor/      React Flow integration: canvas, nodes, edges, overlays, theme, UI.
  templates/   pluggable domains. sdlc/ = canon + model builder (first one).
  server/      Node/TS backend: filesystem scanner, open file/folder, state.
```

## The contract: `GraphModel`

Everything the editor renders is a `GraphModel` (`core/types.ts`):

- `sections` — the horizontal bands (`id`, `label`, `hue`, `order`).
- `nodes` — `{ id, label, kind: "section"|"doc"|"comment", sectionId?, origin:
  "auto"|"manual", status?: "generated"|"missing"|"unavailable", files?, note?,
  position? }`.
- `edges` — `{ id, source, target, kind: "dependency"|"comment", origin, via? }`.
  `source` is the prerequisite (upstream); `target` depends on it.

A **template** produces a `GraphModel`; the editor only knows this shape. Nothing
SDLC-specific lives in `core/` or `editor/`.

## Layers

1. **Template** (`templates/sdlc`) — declares sections + the canon (expected
   documents and type-level dependencies) and builds the base `GraphModel`.
2. **Scanner** (`server/scanner.ts`) — in connected mode, scans a project's
   `docs/` to mark docs generated/missing, find extras, and refine edges from
   real Markdown links.
3. **Editor state** (`editor/model.ts` + `api.ts`) — user layer merged on top:
   positions, manual nodes/edges, section overrides, removed edges, preferences.
   `buildRenderModel()` merges base graph + state into the model the canvas shows.
4. **Canvas** (`editor/StrataCanvas.tsx`) — maps the model to React Flow nodes
   and **floating edges** (border-attached), handles selection highlight,
   drag/connect, and hover activation.
5. **Orchestrator** (`editor/Editor.tsx`) — owns state + undo/redo, renders the
   top bar, overlays, dialogs, and wires every action.

## Rendering

- **Floating edges** (`editor/edges/`) attach to the node border nearest the
  other node and follow nodes as they move.
- **Theme**: flat tokens are CSS variables (instant light/dark); per-hue section
  colors are computed in JS and rebuilt on theme toggle.

## Persistence

- Connected: `docs/.strata-state.json` via the server API.
- Static: `localStorage` (keyed by project name).
