# `/_archive/` — parked code, not part of the live project

This folder holds the **retired declarative TypeScript engine** — the old *second*
definition of every card. The project is consolidating to a **single source of
truth: the imperative JavaScript engine** that runs the live game (see CLAUDE.md →
"Architecture: ONE engine").

## Rules
- **Nothing here runs.** It is excluded from the build, the test runner, and typecheck.
- **Do not read, scan, grep, edit, or reason about this folder** during normal work.
  It is dead reference code; treating it as live wastes effort and risks confusion.
- It is **kept, not deleted** — fully recoverable from git history and the
  `backup-pre-ssot-2026-06-12` tag. Parked here so nothing is thrown away and bits
  can be copied out if ever useful.
- Only touch it if explicitly asked to restore or reference something from it.

## What lives (or will live) here
- The TS card definitions (`cards/`), effect primitives (`effects/`), declarative
  reducers (`engine/reducers/` + TS-only engine files), TS types/schema, and the
  TS-engine unit tests.

The migration that moves files here is tracked as a planned GSD milestone.
