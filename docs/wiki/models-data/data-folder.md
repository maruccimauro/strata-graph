---
title: The data folder
---

# The data folder

In Connected mode, Strata scans a configurable **data folder**. It is separate from the repository's own wiki.

## Set the folder

The server takes two paths:

```bash
npm run serve -- --root <project> --data <dir>
```

- **`--root`**: the project, used for the model name and for open file / open folder.
- **`--data`**: the folder scanned for the model's documents, and where state is saved. It defaults to `<root>/docs`.

## What the scan does

Inside the data folder, the scanner:

- matches the built-in model's expected documents and marks them **generated** or **missing**,
- finds **extra** Markdown files inside per-section subfolders and adds them as nodes,
- refines edges from real Markdown links between files.

## State file

Connected state (positions, manual nodes and edges, preferences) is saved to `<data>/.strata-state.json`. It is written as JSON and ignored by the scan.

::: tip
Point `--data` somewhere other than the repository's `docs/` so the engine's data and the project documentation do not share a folder.
:::

## Next

- [Static and Connected modes](/models-data/modes)
- [Built-in models](/models-data/built-in-models)
