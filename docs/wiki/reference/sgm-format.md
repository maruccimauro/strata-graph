---
title: The .sgm format
---

# The .sgm format

A `.sgm` file is a versioned JSON envelope around a [Strata Graph Model](/models-data/strata-graph-model).

## Envelope

```json
{
  "format": "strata-graph-model",
  "version": 1,
  "model": { "meta": {}, "sections": [], "nodes": [], "edges": [] }
}
```

- **`format`** must be `"strata-graph-model"`. A file without it is rejected.
- **`version`** is the format version (currently `1`). A newer version than the build understands is rejected rather than misread.
- **`model`** is the graph itself.

## The model

```ts
meta:     { name: string; base: string }   // base: id of the built-in it derives from, or "custom"
sections: { id, label, hue, order }[]
nodes:    { id, label, kind, sectionId?, origin, status?, files?, note?,
            createdAt?, dueAt?, locked?, position? }[]
edges:    { id, source, target, kind, origin, via? }[]
```

- `kind` is `"section" | "doc" | "comment"` for nodes, `"dependency" | "comment"` for edges.
- `origin` is `"auto"` (from the built-in model or scan) or `"manual"` (added by you).
- `status` is `"generated" | "missing" | "unavailable"`.
- `source` is the prerequisite; `target` depends on it.
- `createdAt` and `dueAt` are epoch milliseconds; `locked` prevents dragging.

## Validation

On import, Strata parses the JSON, checks the `format` and `version`, and verifies the model has `meta`, `sections`, `nodes` and `edges`. Any failure raises a clear error and the current graph is kept.

## Next

- [Strata Graph Model](/models-data/strata-graph-model)
- [Exporting](/reference/exporting)
