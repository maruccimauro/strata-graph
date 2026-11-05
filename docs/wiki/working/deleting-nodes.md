---
title: Deleting nodes
---

# Deleting nodes

Deleting a node that others depend on leaves them without a prerequisite; Strata
offers to reconnect each one and flags the ones you leave disconnected.

## Delete a node

You can delete any **document** or **comment** node, whether it is **manual**
(added by you) or **automatic** (produced by a built-in model). Open the delete
from either place:

- the node **overlay** action bar (🗑),
- the node **context menu** (right click) ▸ **Delete**, or
- the `[DELETE]` key with the node selected.

::: info
Automatic nodes can now be deleted too. A deleted automatic node is kept out of
the graph across reloads; only **Undo** brings it back (see below).
:::

## The delete dialog

A **dependency** is a directed link where the source is a prerequisite and the
target depends on it. Deleting a node only breaks the nodes that **depended on
it** (its dependents); its own prerequisites are left alone.

So the dialog is organized around the dependents. If nothing depends on the node,
it is deleted with no dialog and no alert. Otherwise, under **Required by**, each
dependent is listed with the option to **reconnect** it to one of the deleted
node's prerequisites (so it keeps an upstream link):

- Every option is checked by default, so one click preserves the chain.
- Use the filter box to narrow by name, and **Select all** / **Deselect all** to
  toggle the options in view.
- A dependent that has no valid prerequisite to reconnect to is shown as such and
  will be left in alert.

A preview names the dependents that will be left under a **broken-link alert** if
you do not reconnect them, each tagged by severity:

- **orphaned**: the node is left with no dependency links at all.
- **partial**: it lost this link but keeps others.

Press **Delete** to apply: chosen reconnections are created as manual edges, and
the dependents you left are flagged.

::: tip
Leave every option checked and the chain is fully rebuilt, so no alert is raised.
:::

## The broken-link alert

Each flagged dependent gets red waves that expand from its border and a ⛓️‍💥
badge on the canvas; orphaned nodes ring stronger than partial ones. The moment
of the break is carried by a flashing badge in the status bar. A flagged node
stays fully opaque even when **Dim not-generated** or a selection would otherwise
fade it, so the mark is never hidden. Click a node's badge to unlink it from the
alert (after a confirmation).

A banner over the viewer states what broke: the removed node and how many
dependents are affected. The alert is always on; there is no global switch to
turn it off. You can **Hide** a banner per deletion event (the nodes stay
marked), and the alert survives reloads until you resolve or dismiss it.

## Rebuild relations

Open the focused panel from the banner's **Rebuild relations**, the status-bar
badge, the quick bar, **View ▸ Rebuild relations**, or a node or canvas context
menu. While it is open, dotted **ghost arrows** preview the reconnection options
on the canvas. The affected dependents are split into **Orphaned** and **Partial**
sections. Click a node's name to center it on the canvas with a bounced arrow, or
use `[ALT + Mouse Hover]` on an option to see what it replaces (**prerequisite →
removed → dependent**).

For each dependent you can:

- **Reconnect** it to one of the removed node's prerequisites (its buttons).
  Reconnecting a dependent clears only that one; the others stay.
- **Unlink** it: clear it from the alert, marking it resolved on purpose.

Per event you can also **Reconnect all** (reconnect every pending dependent) or
**Dismiss** (clear the whole event without reconnecting); both confirm first. An
event disappears once no dependent is left to resolve.

::: info
Comment links are never alerted. Deleting a node simply removes its comment
links, since they are notes rather than dependencies.
:::

## Undo

Deletion is a single step: **Undo** (`[CTRL + Z]`) reverts the node, its edges,
any reconnections created, and the alert together. Undo is available for the
current session; a reload keeps the result (and any pending alert) but clears the
undo history. See [Undo and redo](/working/undo-redo).

## Next

- [Undo and redo](/working/undo-redo)
- [Edges](/modeling/edges)
