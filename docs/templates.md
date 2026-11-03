# Templates

A **template** defines a domain: its sections and how to turn a data source into
a `GraphModel`. The SDLC template lives in `src/templates/sdlc/`.

## Anatomy (SDLC)

- `canon.ts` — the declarative data:
  - `SECTIONS` — bands (`id`, `label`, `hue`, `order`).
  - `DOCUMENTS` — expected docs per section (`id`, `label`, `section`, and
    candidate `files` globs under `docs/`).
  - `EDGES` — `[prerequisite, dependent]` pairs (type-level dependencies derived
    from the methodology's traceability chain).
- `index.ts` — `buildSdlcModel({ name?, scan? })` turns the canon (+ an optional
  scan result) into a `GraphModel`.

## Hybrid relationships

1. The canon defines expected documents and type-level edges.
2. The scanner marks each doc generated/missing and finds extra files on disk.
3. Real Markdown links between existing docs add/confirm edges.
4. The user's manual nodes/edges layer on top.

## Adding a new template

1. Create `src/templates/<name>/` with its `SECTIONS`, nodes and `EDGES`.
2. Write a `build<Name>Model()` returning a `GraphModel`.
3. (Optional) add a scanner in `src/server` if it reads from disk.
4. Wire it where the app picks a template (today the app loads `sdlc`).

Keep templates **domain-neutral** where possible — they describe structure, not
any single project's content.
