---
title: Built-in models
---

# Built-in models

A built-in model seeds a Strata Graph Model for a domain. SDLC is the first.

## What a built-in model is

The engine is domain agnostic. A **built-in model** supplies the sections and the initial nodes and edges for a specific domain, and builds the base [Strata Graph Model](/models-data/strata-graph-model) the editor then renders and edits. Built-in models live under `src/models/<domain>/` and are independent of the core.

A built-in model only seeds a graph; it is not the document. The portable document is always the `.sgm` file.

## Available built-in models

- **SDLC** (Software Delivery Lifecycle): ten lifecycle sections (Client, Discovery, Requirements, Planning, Design, Development, Testing / QA, Deployment, Operations, Closure) and a canon of expected documents with their type-level dependencies.
- **Task board**: a domain-neutral board with columns from Backlog to Done and a few example cards and dependencies. It exists to show the engine works outside any single domain.

## Start a new graph from a built-in

In **Static** mode, open the picker from **File ▸ New from built-in…**, the **⊕ New** button in the quick bar, or the canvas right-click menu. Pick a model and it starts a fresh graph:

- **SDLC** starts a clean project, every document not generated yet, ready to fill in.
- **Task board** starts with its example columns and cards.

::: warning
Starting a new graph replaces the one on screen. If the current graph has unsaved work (manual nodes or edges, moved nodes, overrides), Strata asks you to confirm first. Export it as `.sgm` from **File ▸ Export model (.sgm)…** if you want to keep it.
:::

::: info
In **Connected** mode the graph follows the scanned project, so the picker and **Load demo** are disabled there.
:::

## Load the demo

**File ▸ Load demo** loads the SDLC graph with a mix of generated and not-generated nodes, a quick way to see a populated graph. The same demo also loads on first run.

::: info
SDLC is one example, not the product. More built-in models will follow, and any `.sgm` you build and save is a model in its own right.
:::

## Next

- [Strata Graph Model](/models-data/strata-graph-model)
- [Architecture](/reference/architecture)
