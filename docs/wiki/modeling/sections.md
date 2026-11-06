---
title: Sections
---

# Sections

Sections are the horizontal bands that group your nodes. Every node belongs to one section (or none).

## What a section is

A **section** has an id, a label, a color (an HSL hue the editor turns into band and accent colors), and an order. Sections stack top to bottom as colored **bands** across the canvas.

Each section has a **central node**: a solid, labeled node that sits in the band and represents it.

## The central node is the band's representative

The central node is **pinned**: it sits just under the band label, indented from the start, in both the horizontal and vertical layouts, and it never moves. It is not dragged and the rubber band never selects it.

Instead, the central is the entry point to the band's options. **Click** it, or right-click it and choose **Band options…**, to open the **band panel**. The panel is a compact menu that keeps each area on its own screen, so it never grows past the viewport: pick **Appearance**, **Schedule**, **Grow & arrange**, **Band order** or **Nodes**, and a **‹ Back** link returns to the menu. Each entry shows a short status (the band's position, its node count, whether it grows). The sections below describe what lives in each.

The central shows two counts:

- **AUTO generated/total**: of the nodes produced by the built-in model or scan, how many exist. Unavailable nodes are excluded from this count.
- **MANUAL +n**: how many nodes you added yourself.

It also shows the same status indicators as documents: a **due-date** dot and a **lock** glyph when either is set on the band.

## Color and name

Open the band panel from the central and set the band's **name** and **color** there:

- **Name** renames the band. The band label and the central update live.
- **Color** is a hue slider; the band, its nodes, and the edges that point into it recolor live as you drag.

Both are display overrides over the built-in model. When either is customized, a **Reset** control restores the built-in value. They never change the underlying **Strata Graph Model**, so exporting to `.sgm` keeps the model's own name and colors.

## Bands grow to their content

A band is sized to the box that its nodes occupy. Drag a node past a band edge and the band grows to keep it inside, live, while you drag; drag the node back and the band shrinks again, reclaiming the empty space on either side.

Growth pushes only the side it needs. Along the stacking direction (top to bottom in a horizontal layout, left to right in a vertical one), a band that grows toward the end pushes the bands after it, and a band that grows toward the start pushes the bands before it, so nothing overlaps. Along the shared direction (the band width in a horizontal layout, the band height in a vertical one) every band shares one range, so a node dragged far out makes all the bands grow together, in either direction. The central node stays pinned under the band label through all of this.

Each orientation remembers its own arrangement, so growing a band in the horizontal layout does not affect the vertical one.

This is on by default. Toggle **Grow bands to dragged content** from the **View** menu, the quick bar (**⇲ Grow**), the background right-click menu, or **Preferences ▸ Display**. Turning it off **freezes** the bands exactly where they are: the layout is kept, nodes are confined to their band, and dragging no longer resizes or reflows anything. Turn it back on to let the bands follow their content again.

### Per-band grow

The band panel has its own **⇲ Grow** toggle that overrides the global setting for that band: a band can grow while the rest are frozen, or stay frozen while the rest grow. The global toggle is the default for bands you have not overridden; **Reset** returns a band to following it. A frozen band keeps its current size and confines its nodes; the bands around it still pack to make room when a growing neighbor changes size.

**Re-arrange** (also in the band panel) tidies that band's nodes back to the grid and sizes the band to its content, without touching the other bands.

## Reordering bands

The band panel lists every band, in order, under **Band order**, with the current one highlighted. Reorder them in three ways:

- The **↑** and **↓** buttons move a band one step at a time.
- The **grip** (**⠿**) in the list drags a band to a new position; the list previews the new order as you drag and commits it when you drop.
- On the canvas, each band label has its own **⠿** grip: drag it along the stacking direction and a line shows where the band will land; release to drop it there.

A right-click on a central also offers **Move band up** and **Move band down**. In the vertical layout, where bands stack left to right, these read **Move band left** and **Move band right** and the arrows point sideways. Every reorder is a single undo step, and the canvas re-packs the bands into the new order immediately. The order is a display override; it does not change the underlying **Strata Graph Model**.

The band panel lists every node in the band under **Nodes**. Not-generated nodes appear faded, and an unavailable one is struck through, the same as on the canvas. Each row has:

- The node **name**: click it to open the node's own details overlay, where you edit its due date, files and section.
- A **lock** toggle that locks or unlocks just that node.
- A **delete** button, shown only for nodes that actually exist (a not-generated node has nothing to delete).

Below the list, **Bulk actions** act on the whole band at once:

- **Lock all** / **Unlock all** set the lock on every node in the band.
- **Move all to** sends every node to another band, chosen from a filterable list. The band is left empty; it is not removed.
- **Delete all nodes** removes every existing node in the band after a confirmation. Nodes that others depended on raise a single rebuild alert, and the whole deletion is undone in one step. The band itself stays.

::: info
Moving a node to another section with the **Section** list places it in the target band's grid, rather than keeping its old spot.
:::

## Deleting a band

**Delete band…** removes a whole band. It is in the band panel menu and in a
central's right-click menu. What happens next depends on whether the band has
nodes:

- An **empty band** is removed after a single confirmation.
- A band **with nodes** opens a choice: **Move nodes first** or **Delete band and
  nodes…**.

**Move nodes first** puts the panel into a **migration view**. Every node still in
the band is listed as pending, marked in red, with a **Move to…** picker to send
it to another band (or **Move all to** for the whole list). As you reassign them,
they leave the list. When you are done, **Delete band and N node(s)** removes the
band together with whatever was not moved; if you moved them all, the button reads
**Delete empty band**.

Whenever nodes are actually deleted, Strata asks how to handle the connections
that break: **Delete and track broken links** records them as a single rebuild
alert (see [Deleting nodes](/working/deleting-nodes)), while **Delete without
tracking** removes them silently. The entire band deletion, including the removed
nodes, their edges and the alert, is a single step that **undo** reverts at once.

::: warning
Deleting a band removes its central and its nodes from the view. Nodes left
unmigrated are deleted with the band. Use **Move nodes first** to keep them.
:::

## Assigning a node to a section

Open a node's overlay and pick a section from the **Section** list (a filterable combobox). Choose `— none —` to make the node free-floating. See [Nodes](/modeling/nodes).

::: info
Sections come from the built-in model you start from. SDLC, the first built-in model, defines ten sections (Client, Discovery, Requirements, and so on). See [Built-in models](/models-data/built-in-models).
:::

## Next

- [Nodes](/modeling/nodes)
- [Edges](/modeling/edges)
