# Strata — Roadmap

This document describes the **direction** of Strata: its objectives and the
milestones it moves through. It does not list individual tasks; pending work is
tracked in [`BACKLOG.md`](BACKLOG.md), and shipped changes in
[`CHANGELOG.md`](CHANGELOG.md). Milestones are not dated; they close when their
objective is met, not on a schedule.

## Objective

Strata is a domain-agnostic visual editor for dependency graphs: model nodes,
group them into configurable sections, and define dependencies, in any domain.
The portable document is the `.sgm` Strata Graph Model; built-in models (such as
SDLC) only provide a starting point.

## Milestones

### M1 — Editor refinement (current, toward 1.0.0)

Harden the core editing experience so the banded graph is comfortable to work
with on screen: layout that grows and reorders cleanly, consistent action
placement across menus, and readable edges. This milestone closes the gap between
a working editor and a stable 1.0.0 release.

### M2 — Reach: models and output

Broaden what Strata covers: additional built-in Strata Graph Models beyond SDLC
and the task board, richer and more selective export, and multi-language support.
The goal is to make Strata useful across more domains without touching the
generic core.

### M3 — Extensibility and automation

Open Strata to programmatic control: an MCP-style command interface so an AI
agent can drive the editor, and programmatic manipulation of `.sgm` documents.
The goal is to let Strata be operated and extended by tooling, not only by hand.
