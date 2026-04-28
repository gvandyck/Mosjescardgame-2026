# Phase 2: Implement Piecies — Context

**Phase:** 02-piecies  
**Gathered:** 2026-04-28  
**Status:** Ready for planning

---

<domain>

## Phase Boundary

Implement all **26 unique Piecies** across Physical Force and Artistic Rhythm decks. Piecies are playable cards with diverse effects (MP gain, draws, buffs, damage, utility).

**What Success Looks Like:**
- All 26 Piecies have working code
- Each Piecie's effect resolves correctly
- All effects use existing primitives (no new code required)
- Full integration with game engine
- Tests pass, simulation runs

**Out of Scope:**
- New effect primitives (use existing ones only)
- Card balance or costs
- UI changes

</domain>

<decisions>

## Implementation Decisions

### Grouping Strategy
- **Decision:** Group Piecies by effect type (momentum-gaining, attack, utility, substance, pet, equipment)
- **Rationale:** Similar effects can share test patterns and validation logic
- **Outcome:** Implement in groups of 3-5 related cards per task

### Reuse from Phase 1
- **Decision:** Reuse Mosje ability patterns for Piecies (conditional effects, buffs, etc.)
- **Rationale:** Same primitives, similar composition patterns
- **Outcome:** Faster implementation, consistent code style

### Testing Strategy
- **Decision:** Unit test each Piecie + integration test per group
- **Rationale:** Catch bugs early, validate composition
- **Outcome:** 50+ unit tests total

### Code Organization
- **Decision:** One file per Piecie in `/src/cards/piecies/[type]/[piecie-name].ts`
- **Rationale:** Follows CLAUDE.md, easy to locate and modify
- **Outcome:** 26 files total, pure functions only

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning.**

### Card Specifications
- `card-spec.md` — All Piecie definitions with triggers, costs, effects
- `.planning/PROJECT.md` — Project scope and goals
- `.planning/REQUIREMENTS.md` — IMPL-PF-P1:12, IMPL-AR-P1:13

### Code Patterns
- `/src/cards/mosjes/` — Study Mosje ability structure (pure functions, exports)
- `/src/effects/` — Existing effect primitives (gainMP, drawCards, applyBuff, etc.)
- `/src/cards/piecies/` — Existing Piecie structure (study similar cards)
- `/src/engine/` — Game engine primitives

### Testing
- `tests/cards/mosje-abilities.test.ts` — Unit test patterns from Phase 1
- `npm test` — Run test suite

</canonical_refs>

<specifics>

## Physical Force Piecies (13 unique)

1. **kannetje-melk** — momentum-gaining, free, gain 25 MP
2. **te-hard-gaan** — attack, 15 MP, effect_ref (damage/drain)
3. **snoeiertje** — attack, free, lose opponent 15 MP, gain self 10 MP
4. **momentum-diefje** — attack, 20 MP, drain 20 MP (level2)
5. **dikke-taks** — attack, 25 MP, lose opponent 35 MP, draw 2
6. **grammetje-pieter** — substance, free, gain 30 MP, lose 15 MP
7. **varkenspootjes** — momentum-gaining, free, gain 60 MP (if no Binti, lose 30)
8. **tikker** — substance, free, gain 40 MP next turn
9. **nature-s-gift** — momentum-gaining, free, gain 30 MP
10. **shoettoe** — various decks, free, effect_ref
11. **gun-een-piece** — utility, free, draw 2
12. **quest_tough_it_out** — quest card (may be ref)

## Artistic Rhythm Piecies (13 unique)

1. **kannetje-melk** — momentum-gaining, free, gain 25 MP (reused)
2. **warm-kannetje-melk** — momentum-gaining, free, lose 10 MP, draw 2
3. **broodje-doner** — momentum-gaining, free, gain 35 MP (level1)
4. **nature-s-gift** — momentum-gaining, free, gain 30 MP (reused)
5. **gun-een-piece** — utility, free, draw 2 (reused)
6. **bowie-stormey** — pet, 15 MP, damage reduction buff (50-75%)
7. **gekke-vogels** — pet, 15 MP, effect_ref
8. **synergy-field** — utility, 15 MP, apply synergy buff
9. **dubbele-dosis** — utility, effect_ref
10. **dubbele-ding** — utility, 25 MP, effect_ref (level2)
11. **mosje-shield** — utility, 15 MP, defense buff
12. **laat-me-chillen** — utility, 10 MP, effect_ref
13. **shoettoe** — various decks, free (reused)

</specifics>

<deferred>

## Deferred (v2+)

- Advanced effect composition
- Pet synergy system (beyond basic buffs)
- Conditional deck-specific effects
- Dynamic cost calculations

</deferred>

---

*Phase: 02-piecies*  
*Context gathered: 2026-04-28*
