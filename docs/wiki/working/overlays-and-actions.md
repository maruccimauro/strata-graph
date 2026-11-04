---
title: Overlays and actions
---

# Overlays and actions

Overlays are the floating panels that let you inspect and act on a node or an edge.

## The node overlay

A single click **selects** a node; it does not open the overlay. Open the overlay in one of two ways:

- **Double-click** the node. The overlay is **sticky**: it stays open until you dismiss it.
- Hold <kbd>Alt</kbd> and **hover** the node (no click). This opens a **transient** overlay that closes the moment you leave the node or release <kbd>Alt</kbd>.

From top to bottom:

- An **action bar** of icon buttons, below the title: **🔒 lock/unlock**, **🔗 connect**, **🏷️ comment**, and **🗑 delete** (manual nodes only). Each button has a tooltip.
- **Flags**: Automatic/Manual, Generated/Not-generated, Locked.
- The node's **files**, with open file / open folder in Connected mode.
- The **Section** list (filterable) to reassign the node.
- The **Due date** picker with its live countdown, and the read-only creation date.

See [Node metadata](/working/node-metadata).

## Dismiss the overlay

- A **sticky** overlay closes when you press <kbd>Esc</kbd>, click empty space, click another node or edge, pan the canvas, or deselect.
- A **transient** (<kbd>Alt</kbd> + hover) overlay closes when the pointer leaves the node or you release <kbd>Alt</kbd>.

::: info
<kbd>Esc</kbd> is **staged**: the first press closes the open overlay or dialog; a second press clears the current selection.
:::

## The edge overlay

A single click **selects** an edge. **Double-click** it to open the edge overlay (sticky), or hold <kbd>Alt</kbd> and hover it for a transient one. It names the **depends-on** and **dependent** nodes with their sections, offers a delete action for non-branch edges, and shows two retarget buttons next to each end: **⌖** moves that end by pointer (the overlay hides, a line follows the cursor, and clicking a node sets the new endpoint; <kbd>Esc</kbd> cancels and reopens the overlay), and **☰** moves it by picking the new node from a list. See [Edges](/modeling/edges).

## Next

- [Highlighting](/working/highlighting)
- [Undo and redo](/working/undo-redo)
