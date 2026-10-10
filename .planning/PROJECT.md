# Mosjes / Obby Card Game — Project

## Current Milestone: v2.0 Obby Card Game 2.0 — slice A (offline vs bot)

**Goal:** On branch `obby-2.0`, the web game plays by the full 2.0 rules on one table against the bot, with the 3 Example Decks, deployed separately to eightytwenty.nl/obbycardgame2. V4 on `main` stays untouched.

**Target features:**
- 2.0 card data: all 183 Card List cards (texts, Energy costs, Power/level rows, tags, Quest stacks); V4-only cards hidden, data kept
- 2.0 rules engine: Energy pool, Level 1–3 with reset-to-0 level-ups, getemt/sideways/Welloe pile, hold-Level-3 win, cooldown turn, R1–R6
- Attacking (taksen) and the new Quest system (3 typed stacks, dice per star, bands, fail tokens, jabs)
- Piecies (3 slots, Stays), Snelle with reaction windows, Places 2.0 — every effect rewritten to the Card List
- Bot adapted to 2.0 (attack-or-Quest, Energy, reactions, no hidden-info cheating)
- 2.0 board and card faces (Phase 7 spec); V4 menu items (online, login, collection, store, deck builder) hidden
- Tests: handoff §6 (30 engine tests, card tests, 12 Playwright specs, sim) + Phase 7 §A10; separate deploy workflow, APP_VERSION `2.0-*`

**Sources of truth:** `docs/obby-2.0/` — Claude Code Handoff (spec), Card List (card texts, wins over phase docs), Core Numbers (rules), Example Decks, Phase 7 Card Frames and Art.

**Decisions (Gandalf, 2026-10-10):** slice A only (online rooms = slice B, accounts/collections = slice C, later milestones); hide unsupported V4 menus; adapt the existing strategy bot using `docs/obby-2.0/tools/obby_desk_sim.py` as reference; mostly autonomous execution (ask only on genuine rule/card ambiguity); no research step (the 2.0 docs are the research); balancing stays parked.

**Constraints:** one `.js` engine, no V4/2.0 switch in code (2.0 replaces V4 rules in place on `obby-2.0`); keep existing card ids; never merge `obby-2.0` into `main` without Gandalf; repo CLAUDE.md rules (Playwright tests against the real game, reproduce bugs first, 3-step verification before commits, judge UI at 1920×1080).

---

## Previous milestone (v1.0): Physical Force & Artistic Rhythm — Card Implementation

## What This Is

Implement complete game functionality for all cards in 2 starter decks: **Physical Force** and **Artistic Rhythm**. Cards are designed but non-functional. This project makes them playable.

**Core Value:** Enable full gameplay with 2 complete decks so playtesting can validate card balance and fun.

## Current State

- ✅ Card descriptions documented (card-spec.md)
- ❌ Card code non-functional (effects don't execute)
- ❌ Decks hidden from lobby (players can't select them)
- ✅ Mosje files exist but abilities not implemented
- ✅ Piecie/Snelle/Quest/Place files exist but effects not implemented

## Scope

**Implement:**
- 2 Mosje abilities (Physical Force: Alyssa, Jeffrey)
- 2 Mosje abilities (Artistic Rhythm: DJ 80/20, Jisca)
- ~40 unique Piecies/Snelle/Places/Quests across both decks
- Full effect resolution (MP gains, draws, buffs, conditions, etc.)

**Do NOT:**
- Change card costs or balance (use as-is from spec)
- Refactor existing effect system
- Add new effect primitives (use existing ones only)
- Change UI (cards should "just work" when code is ready)

## Success Criteria

- [ ] All Physical Force cards have working code
- [ ] All Artistic Rhythm cards have working code
- [ ] Both decks can be selected in lobby
- [ ] Full game playable with either deck
- [ ] Tests pass (536+ existing tests still green)
- [ ] Simulation runs without crashes

## Card Count

| Category | Physical Force | Artistic Rhythm | Total |
|----------|---|---|---|
| Mosjes | 2 | 2 | 4 |
| Piecies | 20 (13 unique) | 20 (13 unique) | 40 (18 unique) |
| Snelle Piecies | 5 (4 unique) | 5 (4 unique) | 10 (6 unique) |
| Places | 3 (3 unique) | 3 (2 unique) | 6 (5 unique) |
| Quests | 10 (7 unique) | 10 (8 unique) | 20 (14 unique) |
| **Total** | **40** | **40** | **80 card slots** |
| **Unique** | **32** | **29** | **43 unique cards** |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

*Last updated: 2026-10-10 — milestone v2.0 (Obby 2.0 slice A) started*
