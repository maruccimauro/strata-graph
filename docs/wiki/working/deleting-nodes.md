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

- the node **overlay** action bar (🗑), or
- the node **context menu** (right click) ▸ **Delete**.

::: info
Automatic nodes can now be deleted too. A deleted automatic node is kept out of
the graph across reloads; only **Undo** brings it back (see below).
:::

## The delete dialog

When the node has dependency neighbors, a confirmation opens before anything is
removed. A **dependency** is a directed link where the source is a prerequisite
and the target depends on it.

The dialog lists every **bridge** that would keep a path intact: for each
prerequisite that pointed into the node and each dependent that pointed out of
it, a prerequisite to dependent link (**A → B**) that skips the deleted node.
Every bridge is checked by default, so one click preserves the chain. Uncheck the
ones you do not want.

Below the list, a preview names the neighbors that will be left under a
**broken-link alert** if their bridge is not rebuilt, each tagged by severity:

- **orphaned**: the neighbor has no dependency links left at all.
- **partial**: it lost the link through the deleted node but keeps others.

Press **Delete** to apply. Accepted bridges are created as manual edges; the rest
of the affected neighbors are marked.

::: tip
If you leave every bridge checked, the chain is fully rebuilt and no alert is
raised.
:::

## The broken-link alert

Each affected neighbor gets a red pulsing ring and a ⛓️‍💥 badge on the canvas.
The pulse is steady and gentle so it does not tire; the moment of the break is
carried by a flashing badge in the status bar. An alerted node stays fully opaque
even when **Dim not-generated** or a selection would otherwise fade it, so the
mark is never hidden.

A banner over the viewer states what broke: the removed node and how many
neighbors are affected. The alert is always on; there is no global switch to turn
it off. You can **Hide** a banner per deletion event (the nodes stay marked), and
the alert survives reloads until you resolve or dismiss it.

## Rebuild relations

Open the focused panel from the banner's **Rebuild relations**, the status-bar
badge, the quick bar, **View ▸ Rebuild relations**, or a node or canvas context
menu. While it is open, dotted **ghost arrows** preview each rebuildable bridge on
the canvas.

For each deletion event you can:

- **Reconnect** a bridge: create that prerequisite to dependent link.
- **Discard** a bridge: drop it without creating it.
- **Reconnect all**: create every remaining bridge for that event at once.
- **Unlink** a neighbor: clear it from the alert, marking it resolved on purpose.
- **Dismiss**: clear the whole event without reconnecting anything.

A node clears from the alert once it is rebridged or unlinked; an event
disappears once nothing is left to resolve.

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
