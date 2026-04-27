# Phase 2: Design New Decks — Context

**Phase:** 02-design-decks  
**Gathered:** 2026-04-28  
**Status:** Ready for planning

---

<domain>

## Phase Boundary

Design 2 new starter decks with **fresh themes, distinct Mosje archetypes, and balanced mechanics**. This is a **design-only phase** (no implementation yet). Output: detailed deck specifications that Phase 3 will implement.

**What Success Looks Like:**
- 2 new deck concepts with clear themes and identities
- 4 new Mosjes (2 per deck) with distinct ability archetypes
- Piecies distribution planned for each deck
- Snelle Piecies (quick cards) designed
- Personal Quests specific to each deck
- Places designed for each deck
- All designs documented in a way that Phase 3 can implement them

**Out of Scope (v1):**
- Implementation/coding (Phase 3 handles that)
- Simulation or balance testing (Phase 3 handles that)
- UI/UX for deck selection (Phase 5)

</domain>

<decisions>

## Implementation Decisions

### Design Philosophy
- **Decision:** Design for playstyle diversity and counter-play
- **Rationale:** 2 new decks should feel different from existing 10 Mosjes and from each other
- **Outcome:** Map existing archetypes, identify gaps, design new ones that fill those gaps

### New Mosje Count
- **Decision:** 2 new Mosjes per deck (4 total)
- **Rationale:** Matches existing deck structure (each deck has 2 Mosjes); adds content without overwhelming
- **Outcome:** 10 total Mosjes → 14 with new decks (expandable for future)

### Design-First Approach
- **Decision:** Detailed card-by-card design spec BEFORE any implementation
- **Rationale:** Ensures balance discussion happens before coding; design phase is cheaper to iterate
- **Outcome:** Phase 2 creates design spec; Phase 3 implements with high confidence

### Deck Themes
- **Decision:** Choose themes that resonate with playstyle, not just flavor
- **Rationale:** Themes guide mechanic design and feel authentic to the game
- **Outcome:** Consult existing Mosje themes (Healing, Tactical, Mastermind, etc.); choose 2 new complementary themes

### Cost Curves & Balance
- **Decision:** Design costs to compete with existing decks (no overpowered cards)
- **Rationale:** Ensures playtesting is fair and doesn't need balance in Phase 3
- **Outcome:** Reference existing card costs and effects; design within established bounds

### Claude's Discretion

- Exact cost values (will be refined in Phase 3 simulation)
- Fine details of effect expressions (Phase 3 will write actual code)
- Exact Personal Quest trigger conditions (Phase 3 will design quest pool)
- Specific MP gains/losses (Phase 3 will fine-tune for balance)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning.**

### Game Rules & Card Reference
- `/docs/phase0-rulings.md` — Canonical game rules (read for card cost/timing understanding)
- `/docs/card-reference.md` — What cards are and aren't implemented
- `CLAUDE.md` — Project structure and constraints (one function per file, pure functions)

### Existing Card Structure
- `/src/cards/mosjes/` — Existing 10 Mosje definitions (15 variants total) — study these for archetype patterns
- `/src/cards/piecies/` — Existing Piecies — study cost curves
- `/src/cards/personal-quests/` — Existing Personal Quests — study quest design patterns
- `/src/cards/places/` — Existing Places — study place mechanics

### Phase Context
- `.planning/ROADMAP.md` — Phase 2 is design-focused; Phase 3 implements
- `.planning/REQUIREMENTS.md` — DECKS-01 is the only requirement for Phase 2
- `.planning/PROJECT.md` — Project constraints and scope

### Player Testing Insight
- `/docs/phase10-report.md` — Simulation results from existing decks (gives balance baseline)

</canonical_refs>

<specifics>

## Specific Requirements for Phase 2

**Must Deliver (1 requirement):**

**DECKS-01: Deck design completed**
- 2 new starter deck concepts with unique themes
- New Mosjes (2 per deck) defined with ability concepts
- Piecies distribution planned for each deck
- Snelle Piecies designed (fast cards)
- Personal Quests designed for new decks
- Places designed for new decks

**Design Output Format:**

Create a design document (`.planning/phases/02-design-decks/DECK-DESIGNS.md`) with:

```markdown
# Deck Designs for Phase 3 Implementation

## Deck 1: [Name]
### Concept
[1-2 sentence deck theme and playstyle]

### Mosjes (2)
#### [Mosje 1 Name]
- Theme: [archetype]
- Ability: [description]
- Cost: [MP cost]
- Effect: [how it works]

#### [Mosje 2 Name]
- Theme: [archetype]
- Ability: [description]
- Cost: [MP cost]
- Effect: [how it works]

### Piecies Distribution
- [Count] Healing/Support cards
- [Count] Utility cards
- [Count] Offensive cards
- Cost curve: [min-max MP costs, distribution]

### Snelle Piecies (3-5)
- [Name]: [effect]
- [Name]: [effect]
...

### Personal Quests (3-5)
- [Name]: [trigger condition] → [reward]
...

### Places (2-3)
- [Name]: [effect while active]
...

## Deck 2: [Name]
[Same structure as Deck 1]

## Balance Notes
- [How new decks compare to existing 10 Mosjes]
- [What playstyles they enable]
- [Potential counter-play]
```

**Testing Strategy:**
- Compare costs to existing Mosjes (should be within ±10% of existing range)
- Ensure theme is distinct from existing 10
- Ensure abilities have counter-play (not overpowered)
- Consider simulation results from Phase 10 (balance baseline)

</specifics>

<deferred>

## Deferred (to Phase 3+)

- Card implementation (Phase 3)
- Balance testing via simulation (Phase 3)
- Deck selector UI (Phase 5)
- Additional card sets beyond Phase 2 (future)

</deferred>

---

*Phase: 02-design-decks*  
*Context gathered: 2026-04-28*
