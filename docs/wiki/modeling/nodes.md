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

**Double-click** a node to open its overlay (or hold <kbd>Alt</kbd> and hover it for a transient one); a single click selects the node. From the overlay you can connect it, add a comment, change its section, set a due date, lock it, and (for manual nodes) delete it. See [Overlays and actions](/working/overlays-and-actions) and [Node metadata](/working/node-metadata).

## Delete a node

Only **manual** nodes can be deleted, from the overlay action bar (🗑). Automatic nodes come from the model and cannot be removed by hand.

## Next

- [Edges](/modeling/edges)
- [Node metadata](/working/node-metadata)
