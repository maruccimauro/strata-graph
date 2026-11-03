---
title: Built-in models
---

# Built-in models

A built-in model seeds a Strata Graph Model for a domain. SDLC is the first.

## What a built-in model is

The engine is domain agnostic. A **built-in model** supplies the sections and the initial nodes and edges for a specific domain, and builds the base [Strata Graph Model](/models-data/strata-graph-model) the editor then renders and edits. Built-in models live under `src/models/<domain>/` and are independent of the core.

A built-in model only seeds a graph; it is not the document. The portable document is always the `.sgm` file.

## SDLC

**SDLC** (Software Delivery Lifecycle) is the first built-in model. It declares ten sections (Client, Discovery, Requirements, Planning, Design, Development, Testing / QA, Deployment, Operations, Closure) and a canon of expected documents with their type-level dependencies.

In Static mode it renders a demo with a mix of generated and not-generated nodes. In Connected mode it reflects the real [data folder](/models-data/data-folder).

::: info
SDLC is one example, not the product. More built-in models will follow, and any `.sgm` you build and save is a model in its own right.
:::

## Next

- [Strata Graph Model](/models-data/strata-graph-model)
- [Architecture](/reference/architecture)
