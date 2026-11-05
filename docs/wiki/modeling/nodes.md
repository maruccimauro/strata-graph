---
title: Nodes
---

# Nodes

Nodes are the things you model. A node belongs to a section and carries a status, files and metadata.

## Kinds of node

- **Section** node: the central node of a band (see [Sections](/modeling/sections)).
- **Document** node: a regular node, the kind you create and connect.
- **Comment** node: a sticky note, visually distinct and non-structural (see [Comments](/modeling/comments)).

## Status

A document node shows one status:

- **Generated**: it exists. Drawn solid.
- **Not generated**: expected by the built-in model but not created yet. Drawn with a red dashed border.
- **Unavailable**: it existed and was removed. Crossed out and excluded from the AUTO count.

## Origin

- **Automatic**: produced by the built-in model or the scanner.
- **Manual**: added by you.

## Create a node

- **＋ Node** or <kbd>N</kbd>: in Static mode you name it; in Connected mode you pick a file.
- **Drop a file**: drag a file from your OS onto the canvas to create a node at that spot.

See [Importing files](/modeling/importing-files).

## The node overlay

**Double-click** a node to open its overlay (or hold <kbd>Alt</kbd> and hover it for a transient one); a single click selects the node. From the overlay you can connect it, add a comment, change its section, set a due date, lock it, and delete it. See [Overlays and actions](/working/overlays-and-actions) and [Node metadata](/working/node-metadata).

## Delete a node

You can delete any document or comment node, manual or automatic, from the overlay action bar (🗑) or the node context menu. When the node bridges others, Strata offers to rebuild the broken links and flags the neighbors left disconnected. See [Deleting nodes](/working/deleting-nodes).

## Next

- [Edges](/modeling/edges)
- [Node metadata](/working/node-metadata)
