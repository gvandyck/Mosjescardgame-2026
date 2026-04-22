# \## Current phase

# Phase 11 complete. Engine is feature-complete.

# Next work: UI layer, Firebase multiplayer, or additional cards.

# See /docs/phase10-report.md for latest simulation results.



# \# MOSJES Card Game — Agent Instructions

# 

# \## Project state

# TypeScript engine, 497 tests, immutable reducer architecture.

# All cards implemented across Phases 1-11. See /docs/developer-handoff.md.

# 

# \## Before making any change

# 1\. Read /docs/developer-handoff.md (architecture overview)

# 2\. Read /docs/card-reference.md (what is and isn't implemented)

# 3\. Check /docs/phase0-rulings.md for game rules before touching card logic

# 

# \## Rules you must follow

# \- One function per file

# \- Run npm test after every change — never move forward on red

# \- Pure functions only in /src/engine/ and /src/effects/

# \- Card definitions are data — no logic inside card files

# \- If a change touches MP calculations, re-run the Ronald Kip stacking test

# 

# \## When adding a new card

# Follow the pattern in /src/cards/proof/proof-simple-gain.ts

# 

# \## When running the simulation

# node --loader ts-node/esm src/simulation/run-once.ts

# Target: 0 crashes, timeout rate < 25%

