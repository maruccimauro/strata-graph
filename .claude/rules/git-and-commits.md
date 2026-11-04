# Rule: Commits and branch flow (HARD)

## Commits

- **Incremental, by logical part**; never one giant final commit.
- The message **describes the change on its own**, in **English** (like all
  public content; see the general convention in `CLAUDE.md`).
- **Never** reference internal tracker codes or ephemeral local files in public
  commit messages: a reader of the repo would see cryptic references to something
  that is not in the repo. Keep any mapping to an internal tracker inside that
  tracker.
- No double hyphen (`--`) in messages (project style).
- **Commit or push only when the user asks for it.**

## Branch flow (trunk-based)

- One **branch per batch** (`feat/…`, `fix/…`, `docs/…`, `chore/…`), with
  incremental commits there.
- Merge to `main` **only when it is green** (typecheck + build + QA + wiki +
  changelog), preferably `--ff-only`.
- `main` is **always stable**: never rewrite or force history on `main` (no
  `commit --amend` or `push --force` over already published commits). If a commit
  is already on `origin/main`, fix it with a new commit, not by amending.
- No permanent `develop` branch (overengineering without releases).
