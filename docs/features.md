# Features & interactions

## Reading the graph

- **Bands** = sections (stages), each with its own color.
- **Central node** per section shows `AUTO generated/total` and `MANUAL +n`.
- **Document nodes** branch off their section; if a doc depends on another, the
  edge comes from that other doc.
- **Status**: generated (solid), not-generated (red dashed), unavailable (was
  generated, now gone — crossed out, excluded from the AUTO count).
- **Edges** colour by the target node's section; edges touching a missing node
  are red dashed. They attach to the node border and follow nodes when moved.

## Selecting & navigating

- **Click** a node → highlights what it depends on and what it unblocks; the
  rest dims.
- **Drag on empty space** → box-select; move several nodes together.
- **Right-drag** → pan. Zoom with the wheel / controls. Minimap bottom-right.

## Editing

- **Drag a node** to reposition (saved). Central nodes move horizontally only.
- **Drag from a node's edge** onto another node → a **direction dialog** asks
  how they relate (A→B, B→A, or a comment link).
- **＋ Node** → pick a file (connected) or name it (static). **Drop a file** on
  the canvas → a manual node there.
- **Node overlay** (hover or double-click): flags (Automatic/Manual,
  Generated/Not-generated), files with open file/folder, change section, add a
  comment, delete (manual).
- **Edge overlay** (hover): depends-on / dependent (with sections), delete.
- **Comments / flags**: a distinct node type with a distinct connector; carry a
  title, description and optional reference.
- **Undo / redo**: Ctrl+Z / Ctrl+Y.

## Top bar

- **Menus** File / Edit / View (dropdowns) + a **quick toolbar**
  (＋Node · undo/redo · PNG · Fit · Reset · Hide∅ · ⚙ Preferences · ◐ theme).
- **Preferences**: hide not-generated, colour edges by section, show dependency
  edges. Persisted across projects.
- **Export PNG** of the whole diagram.
