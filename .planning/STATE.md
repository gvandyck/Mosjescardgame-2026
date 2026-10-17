---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Obby Card Game 2.0 — slice A (offline vs bot)
status: executing
stopped_at: Phase 60 plan 07 complete; handoff written (RESUME HERE)
last_updated: 2026-10-16T20:27:16.012Z
last_activity: 2026-10-11
progress:
  total_phases: 54
  completed_phases: 29
  total_plans: 130
  completed_plans: 170
  percent: 54
---

# Project State

**Last updated:** 2026-10-10
**Milestone:** v2.0 — Obby Card Game 2.0, slice A (offline vs bot)
**Branch:** `obby-2.0` (long-lived; never merge into `main` without Gandalf)

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-10-10)

**Core value:** On branch `obby-2.0`, the web game plays by the full 2.0 rules on one table against the bot, with the 3 Example Decks, deployed separately to eightytwenty.nl/obbycardgame2. V4 on `main` stays untouched.

**Current focus:** Phase 60 — snelle, places and hidden information (60-08 left)

**Sources of truth:** `docs/obby-2.0/` — Claude Code Handoff (spec), Card List (card texts; wins over phase docs), Core Numbers (rules), Example Decks, Phase 7 Card Frames and Art.

## Current Position

Phase: 60 of 64 (snelle, places and hidden information)
Plan: 60-07 complete — next: 60-08 (last plan of Phase 60)
Status: Executing
Last activity: 2026-10-17

## RESUME HERE (handoff 2026-10-17, chat rotated for context size)

**Done and verified:** Phases 53–59 (card data, Energy/levels/getemt, turn flow, attacks + Quests, table rules + reaction windows, all 32 Mosje abilities, all 73 Piecie effects). `npm test` green (154 files, 1666 tests). Everything pushed to `origin/obby-2.0`.

**Phase 60 status:** plans 60-01..60-07 done (all 20 Snelle, all 20 Places, Place Power, hidden-info reveals per player). Left: **60-08** — 183-card coverage guard (TEST-02 excludes the 38 Quests, Gandalf 2026-10-16), close remaining Phase-60 fixmes, one full headless card run, tick EFX-03 / EFX-04 / EFX-07 / TEST-02. Then verify Phase 60 (gsd-verifier) and mark it complete.

**Next command:** `/gsd:execute-phase 60` (picks up at 60-08), then `/gsd:plan-phase 61`.

**After 60:** 61 Bot 2.0 → 62 2.0 Card Faces (Phase 7 spec) → 63 Board + player actions → 64 Lobby / full games / sim (re-point sim specs to Example Decks) / deploy to /obbycardgame2. Known gaps for those phases are written in each ROADMAP phase entry ("Known gap …" lines).

**Rules decided during the build:** Card List "Rulings" section (Phases 56–60) — the Card List wins over everything.

**How we work (Gandalf's calls):**
- Cheapest process: no research agent / plan-checker; planner writes short research; sonnet executors one plan at a time on the main tree; one-line updates; phase verifier at the end of each phase; AskUserQuestion only for real card-rule ambiguities.
- Executor prompt must say: branch obby-2.0, no push by the agent (orchestrator pushes), no /_archive/, never `npm run test:sim` (old deck ids until Phase 64), Playwright HEADLESS ONLY via a temporary config (never the default "visual" project; Gandalf plays on his main screen), run only specs for touched cards (full card suite only in a phase's last plan), no probe files in tests/ (vitest runs tests/**/*.ts), helpers in tests/helpers/*.js, never weaken tests (KNOWN GAP + later phase instead), `node --check` each UI file separately (multi-arg only checks the first), SUMMARY ≤15 lines, commits end with the Co-Authored-By line.
- Card effects may live in one file per Card List section (Gandalf, Phase 59).
- Rate limits interrupt agents often: resume with SendMessage; check `git status` first.

## Phase Sequence (v2.0)

53 Card Data → 54 Energy/Levels/Getemt → 55 Turn Flow/Setup/Protection → 56 Attacking + Quests → 57 Piecies/Snelle/Places + Reaction Windows → 58 Mosje Abilities + Synergies → 59 Piecie Effects → 60 Snelle/Places/Hidden Info → 61 Bot 2.0 → 62 Card Faces → 63 Board + Player Actions → 64 Lobby/Full Games/Sim/Deploy

## Performance Metrics

**Velocity:**

- Total plans completed (v2.0): 0
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 53 | 7 | - | - |
| 54 | 16 | - | - |
| 55 | 7 | - | - |
| 56 | 9 | - | - |
| 57 | 7 | - | - |
| 58 | 12 | - | - |
| 59 | 8 | - | - |

## Accumulated Context

| Phase 53 P05 | 25min | 2 tasks | 14 files |

### Decisions

Milestone decisions (Gandalf, 2026-10-10, from PROJECT.md):

- Slice A only: offline vs bot. Online rooms = slice B, accounts/collections = slice C (later milestones).
- Hide unsupported V4 menus (online, login, collection, store, deck builder); keep their code.
- Adapt the existing strategy bot in `src/bot/strategy/`, using `docs/obby-2.0/tools/obby_desk_sim.py` as a reference (ideas, not code).
- Mostly autonomous execution: ask only on genuine rule/card ambiguity.
- No research step: the 2.0 docs are the research.
- Balancing stays parked: don't tune numbers away from the Card List / Core Numbers.
- One `.js` engine, no V4/2.0 switch: 2.0 replaces V4 rules in place on `obby-2.0`. Keep every existing card id.
- Level 3 MP stops at 95 (handoff §2b, decided 2026-10-10). The Tactician sets MP to 10–75 until end of turn.
- Mosjes always full art; foil on ★★★★★ or `foil` flag; rules `rarity` separate from frame tier (Phase 7 §A1).

Roadmap decisions (2026-10-10):

- Engine first (data → core rules → actions → table/reactions → effects by card type → bot), then UI (faces → board), then lobby/sim/deploy.
- Within each effect phase (58–60) the Example Deck cards go first.
- V4-rule tests are rewritten or deleted in the phase that replaces the rule; SHELL-04 closes in Phase 57 (last V4-replacing phase).
- TEST-01 (E1–E30) closes in Phase 58 (E26 Tactician is the last engine test); TEST-02 in Phase 60; TEST-04 in Phase 62; TEST-03 and TEST-05 in Phase 64.

### Pending Todos

None for v2.0 yet.

### Blockers/Concerns

- Open spec items (handoff §8): the modifier order for one loss is a proposal (flag any card that disagrees); Quest stack reshuffle-when-empty is a proposal; names owed for The Hacker, The Tactician, The Drainer.
- Unmerged UI branches (`ui/arena-hover-spotlight`, `ui/card-frame-v1`, `ui/rarity-tiers`): decide per branch before Phase 62 whether to bring it into `obby-2.0`.
- Deploy (Phase 64): FTP folder is created by the first deploy; Firebase (`FIREBASE_CONFIG_2`) is not needed for slice A.
- v1.0 history: Phases 1–52 live in `ROADMAP.md` under "Milestone v1.0 (previous)"; v1.0 requirements archived at `.planning/milestones/v1.0-REQUIREMENTS.md`. V4-rule memories (defeat-at-zero, MP cost model, first-turn Quest lock, entry protection U8) are V4-only on this branch.

## Session Continuity

Last session: 2026-10-11T02:06:17.039Z
Stopped at: v2.0 roadmap written (ROADMAP.md v2.0 section, REQUIREMENTS.md traceability, this file)
Resume file: None
