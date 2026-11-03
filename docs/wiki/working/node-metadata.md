---
title: Node metadata
---

# Node metadata

Beyond its label and section, a node carries metadata: a lock, a creation date and a due date with a live countdown.

## Lock

A **locked** node cannot be dragged on the canvas, so you can pin a layout you like. Toggle the lock from the node overlay's action bar (🔒 / 🔓). A locked node shows a 🔒 glyph and a **Locked** flag. The lock is saved with the model.

To lock or unlock several nodes at once, select them and use the [multi-selection](/working/multi-selection) action bar.

## Creation date

Manual nodes record a **creation date** when you create them. It is shown, read only, at the bottom of the overlay.

## Due date and live countdown

Set a **Due date** in the node overlay (a date and time picker). Once set:

- A **live countdown** ticks every second in the overlay, in the form `2mo 3d 4h 12m 30s`.
- When the due date passes, the countdown turns **red** and goes **negative** (overdue).
- The node shows a small urgency **dot**: red when overdue, amber within 24 hours, muted otherwise.

Clear the due date with the ✕ next to the picker.

::: info
Metadata applies to any node, automatic or manual. It is stored per node and travels with the [Strata Graph Model](/models-data/strata-graph-model).
:::

## Next

- [Multi-selection](/working/multi-selection)
- [Overlays and actions](/working/overlays-and-actions)
