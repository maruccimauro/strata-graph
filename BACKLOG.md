# Strata — Product Backlog

This document is the single source of truth for **pending** work on Strata:
planned features, improvements, bugs and technical debt. Completed work is not
recorded here; it lives in [`CHANGELOG.md`](CHANGELOG.md) and the Git history.
Product direction and milestones live in [`ROADMAP.md`](ROADMAP.md).

Each requirement has one canonical entry. When an item ships, remove it from this
file and record it in the changelog.

## Status

| Status | Meaning |
|---|---|
| `planned` | Approved for a future batch. |
| `in-progress` | Being implemented now. |
| `blocked` | Waiting on an unresolved dependency or decision. |
| `deferred` | Intentionally postponed. |

## Priority

| Priority | Meaning |
|---|---|
| `high` | Significant product value or unblocks other work. |
| `medium` | Useful improvement with moderate impact. |
| `low` | Polish or optional enhancement. |

## Canvas and layout

- **Bands auto-grow to content** — `high` · `planned`
  Expand a section band when a node is dragged past its height, instead of
  letting the node overlap the next section. Needs on-screen tuning.
- **Band management and reordering** — `high` · `planned`
  Move and reorder sections from the UI. Design still under discussion.
- **Layout orientation toggle (horizontal/vertical)** — `medium` · `planned`
  Quick action to rotate the whole banded layout between orientations.
- **Zoom percentage indicator with numeric input** — `low` · `planned`
  Show the current zoom level and allow typing an exact value.

## Nodes

- **Central node status bar** — `medium` · `planned`
  Show the section central counts as `AUTO x/x` and `MANUAL +y`, counting manual
  nodes separately.
- **Delete in the node context menu** — `medium` · `planned`
  Delete is available from the overlay action bar; add it to the node right click
  menu for parity across placements.

## Edges and dependencies

- **Readable routing for overlapping edges** — `medium` · `planned`
  When several edges stack on the same path they become illegible; route or
  offset them so each stays distinguishable.
- **Remove all edges of a given type** — `medium` · `planned`
  One action to clear every edge of a selected kind.
- **Direction icon at the edge origin** — `low` · `planned`
  A subtle marker at the origin showing depends-on versus depended-by. Edge color
  already follows the target section.
- **Highlight the section-central branch connection** — `low` · `deferred`
  Branch edges (central to root) are excluded from adjacency, so no interaction
  lights or marks the link to the section central. When revisited: light the
  branch edges of a highlighted chain and mark the central node, behind its own
  toggle across the four placements. Deferred by the user.

## UI

- **Top toolbar menus open on hover after the first click** — `low` · `planned`
  Once a top menu is opened by click, sibling menus open on hover, as in common
  desktop menu bars.

## Export

- **Advanced export** — `medium` · `planned`
  Choose which sections to export and include or exclude comment flags.

## Internationalization

- **Multi-language support** — `low` · `planned`
  Add a language switch and a Spanish dictionary. English remains the default and
  the source language; new strings already go through the `t()` layer.

## Persistence

- **Optional real-time versus manual save** — `low` · `planned`
  Let the user choose automatic persistence or manual save, with an ask-on-close
  prompt to prevent data loss.

## Technical debt

- **Finish the keyboard-notation migration** — `low` · `planned`
  Migrate any remaining shortcut references in the UI and the wiki to the
  `<kbd>` keycap form, per `.claude/rules/keyboard-notation.md`.
