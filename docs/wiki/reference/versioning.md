---
title: Versioning
---

# Versioning

Strata follows [Semantic Versioning](https://semver.org/) and records every
release in a [changelog](https://github.com/maruccimauro/strata-graph/blob/main/CHANGELOG.md).

## Version numbers

A version is `MAJOR.MINOR.PATCH`. The project is in its **`0.x`** phase, so the
rules are:

- A **feature** bumps the **minor** version (`0.X.0`).
- A **fix** bumps the **patch** version (`0.x.X`).
- `1.0.0` is reserved for the first stable release.

The number in `package.json` is the current version of the application.

::: info
The release history (`0.1.0` through the current version) was reconstructed
retroactively from the git log, grouped into themed versions. The project
carried no tagged releases before the changelog was introduced.
:::

## The `.sgm` format version is separate

The [`.sgm`](/reference/sgm-format) file format carries its own integer version
(`SGM_VERSION`), independent from the application version. It changes **only**
when the serialized data changes in an incompatible way or needs migration,
never because of a UI feature. A build refuses a `.sgm` whose version is newer
than it understands, rather than misreading it.

## Release process

Versioning runs at two different rhythms, and they are not the same thing.

**The changelog is updated in every batch.** When a batch of work is merged, its
changes are listed under `## [Unreleased]` in `CHANGELOG.md` (sections Added,
Changed, Fixed, Removed). An entry says what you can now do and why it matters,
not just the name of the feature.

**A version is cut at a milestone, not once per batch.** `[Unreleased]` collects
several batches. A version is cut when what has accumulated is worth releasing, a
coherent block of features or a point you want to be able to refer back to, so the
numbers track releases rather than individual commits. Cutting a version means:

1. Move the `[Unreleased]` block to `## [X.Y.Z] - YYYY-MM-DD`.
2. Bump `version` in `package.json`.
3. Create an annotated tag on the closing commit.

```sh
git tag -a v0.7.0 -m "Short summary of the release"
git push origin v0.7.0
```

::: tip
A batch without its changelog entry is not finished, the same way a feature
without its wiki page is not finished. Cutting the version itself is a separate,
milestone-driven step.
:::

## Publishing a GitHub Release

Pushing a version tag publishes a [GitHub Release](https://github.com/maruccimauro/strata-graph/releases)
automatically. The [`release` workflow](https://github.com/maruccimauro/strata-graph/blob/main/.github/workflows/release.yml)
runs on every `v*` tag and:

1. Builds the offline single-file application.
2. Reads the matching section from `CHANGELOG.md` as the release notes, so the
   release text and the changelog never diverge.
3. Attaches the build as a downloadable asset named `strata-vX.Y.Z.html`, a
   self-contained page that opens in any browser with no install step.

So a normal release needs no manual step beyond pushing the tag: the changelog
entry already written in the batch becomes the release notes.

::: info
The workflow also exposes a manual trigger (`workflow_dispatch`) that takes an
existing tag and runs the same build-and-publish steps. It was used once to
backfill releases for the tags created before the workflow existed.
:::

## The changelog

The full, authoritative history lives in the repository changelog. It is the
single source of truth for what changed in each version; this page documents the
policy, not the history.

- [CHANGELOG.md](https://github.com/maruccimauro/strata-graph/blob/main/CHANGELOG.md)

## Next

- [The .sgm format](/reference/sgm-format)
- [Roadmap](/reference/roadmap)
