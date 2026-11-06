# Rule: Verify before documenting (HARD)

Every statement about the **current state** of the system (what exists, what is
implemented, how something behaves) must be verifiable in the source code, the
tests or the configuration. Do not document an idealized or assumed state.

This matters most with AI-assisted development: an agent that implements a
feature partially must not then describe it as complete.

## What this forbids

- Claiming a capability, guarantee or behavior that the code does not provide.
- Marking a backlog item, changelog entry or wiki page as done based only on a
  note, a plan or an intention, without checking the implementation.
- Writing a `CHANGELOG.md` entry for a change that was planned but not merged.

## Where each kind of statement belongs

- **`CHANGELOG.md`**: changes that are actually implemented and merged.
- **`BACKLOG.md`**: planned, in-progress, blocked or deferred work.
- **`ROADMAP.md`**: direction and milestones, not task status.
- **Wiki**: behavior that the shipped editor actually has.

## When closing a feature

Before stating that something works, confirm it against the code (and the tests
or a run of the app when the behavior is visual). If it cannot be verified, it is
not done: it stays in the backlog with an honest status.
