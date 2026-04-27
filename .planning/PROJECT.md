# Physical Force & Artistic Rhythm — Card Implementation

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

*Last updated: 2026-04-28 after project initialization*
