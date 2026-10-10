---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Obby Card Game 2.0 — slice A (offline vs bot)
status: executing
stopped_at: v2.0 roadmap written (ROADMAP.md v2.0 section, REQUIREMENTS.md traceability, this file)
last_updated: "2026-10-10T21:11:48.746Z"
last_activity: 2026-10-10
progress:
  total_phases: 54
  completed_phases: 27
  total_plans: 107
  completed_plans: 97
  percent: 50
---

# Project State

**Last updated:** 2026-10-10
**Milestone:** v2.0 — Obby Card Game 2.0, slice A (offline vs bot)
**Branch:** `obby-2.0` (long-lived; never merge into `main` without Gandalf)

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-10-10)

**Core value:** On branch `obby-2.0`, the web game plays by the full 2.0 rules on one table against the bot, with the 3 Example Decks, deployed separately to eightytwenty.nl/obbycardgame2. V4 on `main` stays untouched.

**Current focus:** Phase 53 — 2.0 Card Data and Example Decks

**Sources of truth:** `docs/obby-2.0/` — Claude Code Handoff (spec), Card List (card texts; wins over phase docs), Core Numbers (rules), Example Decks, Phase 7 Card Frames and Art.

## Current Position

Phase: 53 of 64 (2.0 Card Data and Example Decks) — first of 12 phases in v2.0 (53–64)
Plan: 5 of 7 complete (53-01 done)
Status: Ready to execute
Last activity: 2026-10-10

Progress: [█████████░] 91%

**Next command:** `/gsd:plan-phase 53`

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
| - | - | - | - |

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

Last session: 2026-10-10T21:11:43.208Z
Stopped at: v2.0 roadmap written (ROADMAP.md v2.0 section, REQUIREMENTS.md traceability, this file)
Resume file: None
