# Rule: Wiki in the same batch (do not defer)

A feature's wiki page is written or updated **within the same batch/PR as the
feature**, never in a later session.

- If something new supersedes something old, the old content is **removed** from
  the wiki (obsolete content is not left alongside the new).
- A feature without its wiki page is **not finished** (see Tracking in
  `CLAUDE.md`).

## Where and how

- The public wiki lives in `docs/wiki/` as a **VitePress** site (rigby2d style,
  deployed to GitHub Pages).
- It is generated and maintained with the `generar-wiki-strata` skill, which
  defines the information architecture, the page template, the style and the
  deploy.
- Always verify with `npm run docs:build` (no errors, no dead links) before
  closing the batch.
