---
title: Deleting nodes
---

# Deleting nodes

Deleting a node that sits between others breaks the links that passed through it;
Strata offers to rebuild them and flags the neighbors that are left disconnected.

## Delete a node

You can delete any **document** or **comment** node, whether it is **manual**
(added by you) or **automatic** (produced by a built-in model). Open the delete
from either place:

- the node **overlay** action bar (🗑),
- the node **context menu** (right click) ▸ **Delete**, or
- the <kbd>Delete</kbd> key with the node selected.

::: info
Automatic nodes can now be deleted too. A deleted automatic node is kept out of
the graph across reloads; only **Undo** brings it back (see below).
:::

## The delete dialog

When the node has dependency neighbors, a confirmation opens before anything is
removed. A **dependency** is a directed link where the source is a prerequisite
and the target depends on it.

At the top the dialog shows the two sides that lose a link: **Depends on** (the
node's prerequisites) and **Required by** (the nodes that required it).

Below them it offers to rebuild each **bridge** that would keep a path intact:
for each prerequisite that pointed into the node and each dependent that pointed
out of it, a prerequisite to dependent link (**A → B**) that skips the deleted
node. Bridges are grouped by prerequisite; use the filter box to narrow them by
name, and **Select all** / **Deselect all** to toggle those in view. Every bridge
is checked by default, so one click preserves the chain.

A preview names the neighbors that will be left under a **broken-link alert** if
their bridge is not rebuilt, each tagged by severity:

- **orphaned**: the neighbor has no dependency links left at all.
- **partial**: it lost the link through the deleted node but keeps others.

A neighbor is marked only when no chosen bridge still reaches it. Press
**Delete** to apply: chosen bridges are created as manual edges, and the rest of
the affected neighbors are marked.

::: tip
If you leave every bridge checked, the chain is fully rebuilt and no alert is
raised.
:::

## The broken-link alert

Each affected neighbor gets red waves that expand from its border and a ⛓️‍💥
badge on the canvas; orphaned nodes ring stronger than partial ones. The moment
of the break is carried by a flashing badge in the status bar. An alerted node
stays fully opaque even when **Dim not-generated** or a selection would otherwise
fade it, so the mark is never hidden. Click a node's badge to unlink it from the
alert (after a confirmation).

A banner over the viewer states what broke: the removed node and how many
neighbors are affected. The alert is always on; there is no global switch to turn
it off. You can **Hide** a banner per deletion event (the nodes stay marked), and
the alert survives reloads until you resolve or dismiss it.

## Rebuild relations

Open the focused panel from the banner's **Rebuild relations**, the status-bar
badge, the quick bar, **View ▸ Rebuild relations**, or a node or canvas context
menu. While it is open, dotted **ghost arrows** preview each rebuildable bridge on
the canvas. Each event's broken links are split into **Orphaned** and **Partial**
sections. Click a node's name to center it on the canvas with a bounced arrow, or
hold <kbd>Alt</kbd> and hover a bridge to see what it replaces (**A → removed →
B**).

For each deletion event you can:

- **Reconnect** a bridge: create that prerequisite to dependent link.
- **Discard** a bridge: drop it without creating it.
- **Reconnect all**: create every remaining bridge for that event at once.
- **Unlink** a neighbor: clear it from the alert, marking it resolved on purpose.
- **Dismiss**: clear the whole event without reconnecting anything.

Reconnect all and Dismiss confirm first. A node clears from the alert once it is
rebridged or unlinked; an event disappears once nothing is left to resolve.

::: info
Comment links are never alerted. Deleting a node simply removes its comment
links, since they are notes rather than dependencies.
:::

## Undo

Deletion is a single step: **Undo** (<kbd>Ctrl</kbd>+<kbd>Z</kbd>) reverts the
node, its edges, any bridges created, and the alert together. Undo is available
for the current session; a reload keeps the result (and any pending alert) but
clears the undo history. See [Undo and redo](/working/undo-redo).

## Next

- [Undo and redo](/working/undo-redo)
- [Edges](/modeling/edges)
