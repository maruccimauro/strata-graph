---
title: Strata Graph Model
---

# Strata Graph Model (.sgm)

A Strata Graph Model is the document you edit. You can save and reopen it as a `.sgm` file.

## What it is

A **Strata Graph Model** is the whole graph: its `meta`, `sections`, `nodes` and `edges`. It is domain agnostic; what used to be called a "template" is just a built-in model that produces one. See [Built-in models](/models-data/built-in-models).

A **`.sgm`** file is that model serialized as JSON, with positions and metadata baked in, so it reopens exactly as you exported it. The file format is covered in [The .sgm format](/reference/sgm-format).

## Export

Use **File ▸ Export model (.sgm)**. The current graph downloads as `<name>.sgm`.

## Import

Use **File ▸ Import model (.sgm)** and choose a file. Strata validates it and loads it as the current graph with a fresh editor state. An invalid file is rejected with a clear message rather than loading a broken graph.

::: warning
Importing replaces the current graph in view. Export your work first if you want to keep it.
:::

## Why use .sgm

- **Portability**: move a graph between machines or share it as a single file.
- **Versioning**: commit `.sgm` files to a repository and diff them as JSON.
- **Back-up**: a snapshot independent of the browser's `localStorage`.

## Next

- [Static and Connected modes](/models-data/modes)
- [The .sgm format](/reference/sgm-format)
