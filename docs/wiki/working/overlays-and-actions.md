---
title: Overlays and actions
---

# Overlays and actions

Overlays are the floating panels that let you inspect and act on a node or an edge.

## The node overlay

Open it by hovering a node (after a short delay) or double-clicking it. From top to bottom:

- An **action bar** of icon buttons, below the title: **🔒 lock/unlock**, **🔗 connect**, **🏷️ comment**, and **🗑 delete** (manual nodes only). Each button has a tooltip.
- **Flags**: Automatic/Manual, Generated/Not-generated, Locked.
- The node's **files**, with open file / open folder in Connected mode.
- The **Section** list (filterable) to reassign the node.
- The **Due date** picker with its live countdown, and the read-only creation date.

See [Node metadata](/working/node-metadata).

## Auto-dismiss

The overlay gets out of your way:

- If the pointer never enters the panel and drifts more than a short distance away, it closes.
- Once the pointer has entered and then left, it closes.
- Panning the canvas or pressing <kbd>Esc</kbd> also closes it.

## Border-safe

The overlay does **not** open while the pointer is over a node's border, where the connection handles sit. That keeps the overlay from blocking you when you start an edge from a handle.

## The edge overlay

Hover an edge to open its overlay. It names the **depends-on** and **dependent** nodes with their sections, and offers a delete action for non-branch edges. See [Edges](/modeling/edges).

## Next

- [Highlighting](/working/highlighting)
- [Undo and redo](/working/undo-redo)
