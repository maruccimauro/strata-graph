---
title: Context menus
---

# Context menus

**Right-click** anywhere on the canvas for a menu scoped to what is under the pointer. Context menus mirror actions that are also reachable from the menu bar, the quick toolbar and the overlays, following Strata's rule that every action lives in more than one place.

## Background menu

Right-click empty space (or a section band) for graph-wide actions:

- **Add node**, **Fit to screen**, **Reset layout**.
- Toggles: **Highlight paths on hover**, **Show dependency edges**, **Dim not-generated**.
- **Toggle theme** and **Preferences**.

## Node menu

Right-click a node:

- **Open details** opens the node overlay.
- **Lock / Unlock** the node so it cannot be moved. See [Node metadata](/working/node-metadata).
- **Connect** to another node, and **Add comment**.
- **Manage connections** opens the node's connection manager, which lists every edge on the node with a per-row remove. See [Edges](/modeling/edges).
- **Delete** (manual nodes only).

A section's central node shows only **Open details** and **Lock / Unlock**, since it cannot be connected, commented or deleted by hand.

## Edge menu

Right-click a dependency or comment edge:

- **Open details** opens the edge overlay.
- **Retarget prerequisite end** and **Retarget dependent end** start a retarget of that end: a line follows the cursor and the next node you click becomes the new endpoint (<kbd>Esc</kbd> cancels). See [Edges](/modeling/edges).
- **Delete** (non-branch edges only).

Right-clicking a **branch** edge, which links a root node to its section's central node, falls back to the background menu: branch edges are structural, so they have no actions of their own. See [Edges](/modeling/edges).

::: info
A context menu closes when you pick an item, click elsewhere, or press <kbd>Esc</kbd>. Pressing <kbd>Esc</kbd> to close a context menu does not also clear your selection.
:::

## Next

- [Overlays and actions](/working/overlays-and-actions)
- [Highlighting](/working/highlighting)
