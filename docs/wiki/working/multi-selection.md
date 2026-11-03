---
title: Multi-selection
---

# Multi-selection

Select several nodes to act on them together.

## Select several

- **Box-select**: drag on empty space to draw a box over the nodes.
- Hold the multi-select key (<kbd>Shift</kbd>, <kbd>Ctrl</kbd> or <kbd>Cmd</kbd>) and click to add or remove nodes.

## The shared action bar

When two or more nodes are selected, a **shared action bar** appears at the bottom center of the canvas. It shows the count and offers:

- **🔒 Lock all**: lock every selected node so none of them can move.
- **🔓 Unlock all**: unlock the whole selection.

See [Node metadata](/working/node-metadata) for what locking does.

## Selection persists

The selection survives canvas redraws. After you lock the group, change a date, or perform any action that rebuilds the canvas, the same nodes stay selected until you explicitly clear them.

::: tip
The shared action bar is built to grow: lock and unlock are the first shared actions, with more to come.
:::

## Next

- [Overlays and actions](/working/overlays-and-actions)
- [Node metadata](/working/node-metadata)
