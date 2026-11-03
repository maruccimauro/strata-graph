---
title: Quick start
---

# Quick start

From the demo graph to your own nodes, edges and a saved `.sgm` file in a few minutes.

## 1. Open the app

Run `npm run dev` and open the printed URL. You land on a demo graph in **Static** mode: horizontal **bands** (sections) with nodes inside them.

## 2. Read what you see

- Each **band** is a section, with its own color and a **central node** that counts its contents (`AUTO generated/total · MANUAL +n`).
- A **node** branches off its section. A solid node is generated; a red dashed node is not generated yet.
- An **edge** runs from a prerequisite to the node that depends on it.

Click any node to highlight what it depends on and what it unblocks; the rest dims. Click the empty canvas to clear it.

## 3. Add a node

Press <kbd>N</kbd> or use **＋ Node** in the toolbar. In Static mode you are asked for a name; in [Connected mode](/models-data/modes) you pick a file. You can also drag a file from your OS onto the canvas to drop a node there.

## 4. Connect two nodes

Drag from the border of one node onto another. A direction dialog asks how they relate: A depends on B, B depends on A, or a comment link. See [Edges](/modeling/edges).

## 5. Give a node a due date

Double-click a node to open its overlay, set a **Due date**, and watch the live countdown. See [Node metadata](/working/node-metadata).

## 6. Save your model

Use **File ▸ Export model (.sgm)** to download the whole graph as a [Strata Graph Model](/models-data/strata-graph-model). Reopen it anytime with **File ▸ Import model (.sgm)**.

::: tip
Made a mistake? <kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes, <kbd>Ctrl</kbd>+<kbd>Y</kbd> redoes.
:::

## Next

- [The interface](/getting-started/the-interface)
- [Nodes](/modeling/nodes) and [Edges](/modeling/edges)
