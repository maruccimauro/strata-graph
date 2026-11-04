---
title: Selecting and moving
---

# Selecting and moving

How to select nodes, move them, and pan the canvas.

## Select

Strata uses a primary-click model: a single click selects, a double-click opens the overlay.

- **Single-click** a node to select it and highlight its dependency chain (see [Highlighting](/working/highlighting)). A single click only selects; it does not open the overlay.
- **Single-click** an edge to select it; the selected edge glows. See [Edges](/modeling/edges).
- **Double-click** a node or edge to open its overlay, or hold <kbd>Alt</kbd> and hover for a transient overlay. See [Overlays and actions](/working/overlays-and-actions).
- **Box-select**: drag on empty space to draw a selection box over several nodes.
- **Deselect**: click the empty canvas, or press <kbd>Esc</kbd>. <kbd>Esc</kbd> is staged, so when an overlay is open the first press closes it and the next clears the selection.
- **Right-click** the background, a node, or an edge for its context menu. See [Context menus](/working/context-menus).

Your selection survives edits: locking, changing a date, or any action that redraws the canvas keeps the group selected.

## Move

- **Drag** a node to reposition it. Positions are saved automatically.
- **Section central nodes** move horizontally only; their band locks the vertical position.
- A **locked** node cannot be moved. See [Node metadata](/working/node-metadata).

## Pan and zoom

- **Pan**: hold the middle mouse button (the wheel) and drag anywhere on the canvas.
- **Zoom**: the mouse wheel, or the controls at the bottom left.
- **Fit**: **⤢ Fit** frames the whole graph. **⟳ Reset** clears saved positions back to the computed layout.

::: tip
Panning the canvas or pressing <kbd>Esc</kbd> dismisses any open overlay.
:::

## Next

- [Multi-selection](/working/multi-selection)
- [Node metadata](/working/node-metadata)
