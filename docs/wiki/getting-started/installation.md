---
title: Installation
---

# Installation

Get Strata running locally, in static or connected mode.

## Requirements

- Node.js 18 or newer.
- A package manager (`npm` ships with Node).

## Install

```bash
git clone https://github.com/maruccimauro/strata-graph
cd strata-graph
npm install
```

## Run in development

```bash
npm run dev
```

This starts the Vite dev server with the demo graph in **Static** mode. Open the printed URL (usually `http://localhost:5173`).

## Build the offline app

```bash
npm run build
```

`npm run build` type-checks and produces **one self-contained HTML file** at `dist/index.html`. It has no external dependencies, so you can open it in any browser or share it as a single file.

::: tip
The static build keeps your work in the browser's `localStorage`. To move a graph between machines, export it as a [Strata Graph Model](/models-data/strata-graph-model).
:::

## Run connected mode

Connected mode adds real file access and folder scanning. See [Static and Connected modes](/models-data/modes).

```bash
npm run build
npm run serve -- --root <path-to-a-project>
```

## Next

- [Quick start](/getting-started/quick-start): build your first graph in a few minutes.
- [The interface](/getting-started/the-interface): the menus, toolbar and canvas.
