# Rule: Configurability policy (HARD)

Every action or option is evaluated for placement in **all four locations** and
created wherever it applies, **in the same batch** as the feature:

1. **Top dropdown menu** (File / Edit / View / ...).
2. **Context menu (secondary click)** on the relevant element.
3. **Quick-access bar** (quick bar).
4. **Preferences**.

## Context menu: mandatory like the others

The right-click context menu is mandatory just like the other locations. Each
action relevant to the element under the cursor is added to its context menu
according to context:

- **General** (over the canvas background).
- **Node**.
- **Edge**.

## Verification when closing the feature

When closing a feature, verify **explicitly** in which locations each new option
ended up, or why one does not apply. This is not deferred to a later batch. The
**quick-access bar** is the placement most often missed, so review it in
particular when closing each feature.

## Where in the code

- **Quick-access bar**: `src/editor/ui/TopBar.tsx`, "quick toolbar" block, with
  the toggle pattern `<Button active=… onClick=…>` (for example "Hide ∅").
- **Context menu**: triggered by `onPaneContextMenu` / `onNodeContextMenu` /
  `onEdgeContextMenu` from React Flow (the browser default is already suppressed).
