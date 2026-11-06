---
title: The interface
---

# The interface

A tour of the menu bar, the quick toolbar, the canvas and the overlays.

## Menu bar

At the top are three dropdown menus:

- **File**: Add node, New from built-in, Load demo, Import model (.sgm), Export model (.sgm), Export PNG.
- **Edit**: Undo, Redo, Preferences.
- **View**: Fit to screen, Reset layout, the preference toggles, Toggle theme.

Once any menu is open, hovering another menu label opens it; a click is only needed to open the first menu, or to reopen after clicking away or picking an item.

On the right, a badge shows the active mode (**● Connected** or **○ Static**) and a summary: project name, generated/total documents, and section count.

## Quick toolbar

Below the menu bar, a toolbar repeats the most used actions:

**＋ Node** · **⊕ New** · undo · redo · **⇩ PNG** · **⤢ Fit** · **⟳ Reset** · **⇄ Rotate** · the zoom control · **✦ Paths** · **⇲ Grow** · **Dim ∅** · **⿻ Layers** · **⚙ Preferences** · **◐ theme**.

**✦ Paths**, **⇲ Grow** and **Dim ∅** are toggles: they stay highlighted while on. **⿻ Layers** cycles the stacking order (nodes on top, edges on top, free). **⇄ Rotate** switches the layout between horizontal rows and vertical columns. The zoom control (**−**, a percentage field, **＋**) shows the current zoom and sets it to an exact value; type a percentage and press <kbd>Enter</kbd>.

## Canvas

The canvas is where the graph lives:

- **Pan**: hold the middle mouse button (the wheel) and drag anywhere.
- **Zoom**: the mouse wheel, the controls at the bottom left, or the zoom field in the quick toolbar (type an exact percentage).
- **Box-select**: drag on empty space to select several nodes.
- **Minimap**: bottom right, pannable and zoomable.
- **Layout**: switch between horizontal rows and vertical columns from **View ▸ Layout** or **Preferences ▸ General**.

## Overlays

**Double-click** a node to open its **overlay**: an action bar (lock, connect, comment, delete), its flags, files, section, and dates. **Double-click** an edge for the **edge overlay** with its dependency direction and a delete action. A single click selects without opening an overlay; hold <kbd>Alt</kbd> and hover for a transient overlay. See [Overlays and actions](/working/overlays-and-actions).

## Context menus

**Right-click** anywhere for a menu scoped to what is under the pointer: the background, a node, or an edge. See [Context menus](/working/context-menus).

## Next

- [Preferences](/getting-started/preferences)
- [Selecting and moving](/working/selecting-and-moving)
