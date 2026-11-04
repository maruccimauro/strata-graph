# Rule: Evaluate cross-impact before reusing or changing (HARD)

Evaluate each case; do not apply a rigid rule. Reusing or extending existing
behavior when it helps is fine; but if reusing or changing it would make
**another** behavior work differently, **ask first** in the chat among the
options, with the recommended one and its pros/cons, instead of deciding alone.

It is not "never touch what was not asked": it is **detect the cross-impact and
agree on the scope before coding**.

## Options to present when there is cross-impact

- **Extend** the shared behavior.
- **Modify** the shared behavior (with the effect on the other case).
- **Duplicate / create a new one** so the existing one is not touched.
- **Leave as is**.

List them as text in the chat (do not use option dialogs), mark the recommended
one, explain pros/cons, and wait for the decision.

## How to apply

Before coding, re-read the request and map which states share code (selection vs
hover, node vs edge, central vs dependencies). If the change touches only one,
scope it there. If it touches or reuses another, present how to resolve it and
wait.
