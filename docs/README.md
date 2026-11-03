# Strata — Wiki

**Strata** is a template-driven, sectioned dependency-graph editor. You define
*sections* (horizontal bands), *node types* and *dependency rules* in a
**template**, point it at a data source, and Strata renders an editable graph
with a central node per section, documents branching off, dependency edges, and
placeholders for expected-but-missing nodes.

The **SDLC** template is the first one, but the engine is domain-agnostic.

## Contents

- [Architecture](architecture.md) — engine, templates, editor, server.
- [Usage](usage.md) — dev, build, connected mode, cross-platform notes.
- [Features & interactions](features.md) — what the editor does and how.
- [Templates](templates.md) — how to define a domain (sections + canon).
- [Roadmap](roadmap.md) — status and what's next.

## At a glance

| | |
|---|---|
| Stack | Vite + React 18 + TypeScript + React Flow (MIT) |
| Output | one self-contained HTML (`vite-plugin-singlefile`), ~126 KB gzip |
| Server | Node/TS (`tsx`) for connected mode (real scan, file open, state) |
| Platforms | Windows · Linux · macOS |
