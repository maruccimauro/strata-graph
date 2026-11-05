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

- **Drag** a node to reposition it. Positions are saved automatically, and kept separately for each band orientation (horizontal and vertical each remember their own arrangement).
- **Section central nodes** move only across their band (up-down in a horizontal layout, left-right in a vertical one) and are anchored on the other axis; their travel is clamped so they stay inside the band.
- **Drag a node past its band** and the band grows to keep it inside while you drag; the neighboring bands on the side it grows shift to make room, and the shared direction grows every band together. See [Sections](/modeling/sections) for details and the toggle that turns this off.
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
