# Rule: Versioning (HARD)

The project uses [SemVer](https://semver.org) and keeps a `CHANGELOG.md` at the
repository root (Keep a Changelog format). There are **two distinct rhythms**; do
not conflate them.

## Changelog in the same batch (MANDATORY, do not defer)

Every batch merged to `main` adds its changes under `## [Unreleased]` in
`CHANGELOG.md`, in the Added / Changed / Fixed / Removed sections, in English.
Entries are **concise bullets, one per change**: each item states clearly what
was done (professional register, no terse telegram style and no long prose
paragraphs). A batch without its changelog entry is **not finished**.

## Version cut by milestone (not per batch)

`[Unreleased]` accumulates several batches. A version is **cut** when what has
accumulated is a publishable milestone (a coherent block of features or a point
worth referencing), **not mechanically on every batch**, so the numbers track
releases rather than commits. When cutting:

1. Move the `[Unreleased]` block to `## [X.Y.Z] - YYYY-MM-DD`.
2. Update `version` in `package.json`.
3. Create the **annotated tag** on the closing commit.

```sh
git tag -a vX.Y.Z -m "..."
git push origin vX.Y.Z
```

Pushing a `vX.Y.Z` tag triggers the release workflow, which publishes a GitHub
Release with notes taken from the matching changelog section and the offline
build attached as an asset.

## Numbering rules

- Stage **`0.x`**: a feature bumps the **minor** version (`0.X.0`), a fix bumps
  the **patch** version (`0.x.X`); `1.0.0` is reserved for the first stable
  release.
- The **`.sgm`** format version (`SGM_VERSION` in `src/core/sgm.ts`) is
  **independent** of the application version and only increases on an
  incompatible data change (or one that requires migration), never because of a
  UI feature.

## Documentation

The policy and process are documented in the wiki (`reference/versioning`); that
page is kept up to date like any other (see the Wiki rule).
