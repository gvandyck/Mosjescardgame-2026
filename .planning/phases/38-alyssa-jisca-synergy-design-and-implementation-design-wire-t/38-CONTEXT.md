# Phase 38: Alyssa↔Jisca Synergy — Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Design AND implement the Alyssa↔Jisca duo synergy — the headline mechanic of the
`DUO_JISCA_ALYSSA` starter deck, which is currently **declared but empty**
(`synergyEffect: null` on `mosje_alyssa_bulldozer`, `mosje_alyssa_fissa`, and
`mosje_jisca`; no consuming engine code). This phase gives the pair a real,
on-card, engine-wired effect.

**In scope:** the three cards' `synergyEffect` text + engine wiring + card-text
convention compliance + bot awareness + tests + sim run.

**Out of scope:** reworking the Alyssas' or Jisca's *base abilities* (that's
separate — Jisca's ability text↔engine divergence is Phase 40); any other
synergy pair (Phase 39).

</domain>

<decisions>
## Implementation Decisions

### Core fantasy
- **D-01:** "Party amplifier" — Jisca's performance hypes Alyssa's fight; Alyssa's
  aggression fuels Jisca's crowd energy. Asymmetric (role-based), NOT a mirrored
  effect.

### Alyssa side (shared by BOTH Alyssa variants: bulldozer + fissa)
- **D-02:** While `[Jisca] The Maestro` is also on your field, this Alyssa gains a
  flat **+10 MP at the start of each of your turns**. Chosen over amplifying her
  own ability (too coupled) or doubling her scaling (too swingy). Simple,
  predictable, easy to sim/balance.

### Jisca side
- **D-03:** While an `[Alyssa]` (either variant) is also on your field, the **FIRST
  Piecie you play each turn gives +10 MP**. Once-per-turn cap.
- **D-04 (IMPORTANT — supersedes original todo idea):** The original brainstorm was
  a "Piecies cost 10 less" discount. **REJECTED as a near-total no-op:** Phase 36's
  MP-cost model set 69 of 70 Piecies to `mpCost: 0` (only one Piecie costs >0, at
  `src/data/piecies.js:725` = 40). A cost discount would change exactly one card in
  the game. The fantasy (reward Jisca's Piecie-combo identity board-wide) is
  preserved by flipping it from a cost-DISCOUNT to a play-REWARD, which works
  regardless of cost. Do NOT implement a Piecie discount.

### Power level
- **D-05:** In-line with existing synergies (~+15 tier — cf. West+Cless +15 on
  Physical Quests, Binti+Coert double-FOOD). All MP values are multiples of 5 per
  the MP five-grid rule. Sim after implementation to confirm the duo's win rate
  doesn't warp the leaderboard.

### Claude's Discretion (defaults — planner may confirm at UAT)
- **Stacking:** If BOTH Alyssas + Jisca are on field, each Alyssa independently
  gets its own +10/turn (so +20 total from the two Alyssas). Consistent with
  per-Mosje synergy application; acceptable at the in-line power target. Flag for
  UAT if it over-performs.
- **Jisca's "first Piecie" is board-wide** — any Piecie the controlling player
  plays, first one per turn, regardless of which Mosje's slot; a single +10 per
  turn no matter how many Alyssas are present.
- **Timing/trigger:** passive-while-both-present, detected via the existing
  `getActiveSynergies` (already handles the `synergyWaiverActive` / Synergy Chamber
  waiver — no special-casing needed).

### Folded Todos
- **`2026-07-12-alyssa-jisca-synergy-design.md`** — this phase IS that todo.
  Original problem: the duo's declared synergy is null on all three cards and the
  DUO starter deck's headline mechanic doesn't exist. Fully addressed here.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Synergy convention + audit
- `.planning/todos/pending/2026-07-12-alyssa-jisca-synergy-design.md` — the source todo (folded).
- `.planning/todos/pending/2026-07-15-remaining-mosje-synergies-and-cless-teacher-fix.md` — full synergy-pair inventory + which engine sites consume synergies (Phase 39, but useful pattern reference).
- Synergy text convention: every `synergyEffect` text MUST start with `"While <partner name> is also on your field: <effect>."` — test-enforced by `tests/data/synergy-text-clarity.test.ts` (add this pair to its `REQUIRED_PARTNER_MENTIONS` table).

### Game rules
- `docs/phase0-rulings.md` — canonical rules (MP five-grid: all MP values multiples of 5).

### Cost-model constraint (why D-04 matters)
- `src/data/piecies.js` — 69/70 Piecies now `mpCost: 0` post-Phase-36 (only line 725 = 40). Confirms a Piecie discount is inert.

</canonical_refs>

<code_context>
## Existing Code Insights

### Card data (edit `synergyEffect` on all three)
- `src/data/mosjes.js:56` — `mosje_alyssa_bulldozer` (`synergyWith: ["mosje_jisca"]`, `synergyEffect: null`).
- `src/data/mosjes.js:74` — `mosje_alyssa_fissa` (`synergyWith: ["mosje_jisca"]`, `synergyEffect: null`).
- `src/data/mosjes.js:452` — `mosje_jisca` (`synergyWith: ["mosje_alyssa_bulldozer","mosje_alyssa_fissa"]`, `synergyEffect: null`).

### Established synergy-wiring patterns (synergies live in MULTIPLE places — check all)
- `src/engine/synergyResolver.js` — `getActiveSynergies()` / `hasSynergy()` detect a pair when both are on-field (or waiver active). Detection for this pair ALREADY works; only the EFFECT is missing. `hasFoodDoubleSynergy` is the closest "specific-helper" analog to copy for a new `hasAlyssaJiscaSynergy`.
- `src/engine/turnManager.js` — `hasBothChrisAndYouri` (ad-hoc pair presence check); **start-of-turn MP hooks live here** — natural home for the Alyssa +10/turn.
- `src/abilities/questLogic.js` — `PARTNER_QUEST_SYNERGIES` table (quest-bonus synergies).
- `src/abilities/piecieEffects.js` — `hasRonald` pattern; **Piecie-play hooks live here** — natural home for Jisca's "first Piecie each turn +10" (needs a once-per-turn flag on the player, e.g. `alyssaJiscaPiecieBonusUsedThisTurn`, reset in turnManager).

### Bot awareness
- `src/bot/strategy/` — bot should value assembling this pair. Wire after the engine effect exists.

</code_context>

<specifics>
## Specific Ideas

- Card text must read (convention-compliant), e.g.:
  - Alyssas: `"While [Jisca] The Maestro is also on your field: gain +10 MP at the start of each of your turns."`
  - Jisca: `"While an [Alyssa] is also on your field: the first Piecie you play each turn gives +10 MP."`
- Reproduce-in-browser per project rules: the MP-touching change wants a Playwright card-test (`tests/ui/cards/`) proving the +10/turn and first-Piecie +10 actually register on-screen, plus a unit test for the resolver helper. Re-run Ronald Kip stacking test + full sim (MP-touching).

</specifics>

<deferred>
## Deferred Ideas

- **Jisca base-ability dice-vs-flat divergence** → Phase 40 (ability-text↔engine reconciliation). Phase 38 deliberately does NOT depend on Jisca's dice mechanic — the Jisca-side synergy triggers on Piecie *play*, not on her ability's dice roll, so the two phases stay decoupled.
- **Other unwired synergy pairs + Cless Teacher fix** → Phase 39.

### Reviewed Todos (not folded)
None beyond the one folded above — discussion stayed within phase scope.

</deferred>

---

*Phase: 38-alyssa-jisca-synergy*
*Context gathered: 2026-07-18*
