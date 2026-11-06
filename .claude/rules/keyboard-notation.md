# Rule: Keyboard and pointer notation (HARD)

Every reference to a keyboard key in **user-facing text** (UI strings rendered
through `t()`, the wiki, and any other public copy) renders each key as a
`<kbd>` keycap, never as plain text or a bracketed token.

## Format

- Wrap **each** key in its own `<kbd>` element: `<kbd>Ctrl</kbd>`, `<kbd>N</kbd>`,
  `<kbd>Delete</kbd>`.
- Write key names in their **natural keycap capitalization**: `Ctrl`, `Shift`,
  `Alt`, `Esc`, `Enter`, `Delete`, `Backspace`, `Cmd`, `N`, `Z`, `Y`.
- Join a combination with a literal `+` between the keycaps, no surrounding
  spaces: `<kbd>Ctrl</kbd>+<kbd>Z</kbd>`.
- A key combined with a pointer action keeps the pointer action as a normal word
  after ` + ` (spaces): `<kbd>Alt</kbd> + hover`, `<kbd>Shift</kbd> + click`.
- Pointer-only actions (double-click, right-click, drag) are described in prose
  or bold, not inside `<kbd>`; `<kbd>` is for keyboard keys only.

## In the program (React / JSX)

Render keys with the shared `<kbd>` primitives, not a hand-written string:

- `Kbd` and `Shortcut` live in `src/editor/ui/primitives.tsx`. `Shortcut` takes a
  plain combination (for example `keys="Ctrl+Z"`) and renders each key as a
  `<kbd>` keycap joined by `+`.

### Plain-text-only contexts

Some places cannot render HTML: a native `title` tooltip, a serialized string, a
`window.prompt`/`alert`. There, write the keys plainly joined with `+` (for
example `Ctrl+Z`); never emit literal `<kbd>` tags into plain text.

## Examples

- `<kbd>Ctrl</kbd>+<kbd>Z</kbd>` (undo)
- `<kbd>Delete</kbd>`
- `<kbd>Esc</kbd>`
- `<kbd>N</kbd>`
- `<kbd>Alt</kbd> + hover`
- `[CTRL + Z]`, `Ctrl+Z` (as rendered copy), `Alt` are wrong in rendered text;
  use the `<kbd>` form.

## Scope

Applies to the editor UI and the public wiki. When closing a feature, verify that
no new shortcut reference was left in another form, and migrate existing ones
incrementally.
