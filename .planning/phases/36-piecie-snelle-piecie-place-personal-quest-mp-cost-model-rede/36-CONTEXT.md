# Phase 36: Piecie/Snelle Piecie/Place/Personal Quest MP Cost Model Redesign - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Every Piecie, Snelle Piecie, Place, and Personal Quest has an `mpCost` data field
(0/5/10/15/20/25/40/50) that is displayed in the UI but never actually charged
anywhere in the engine (confirmed by Phase 35's research — see Critical Finding 1
in `35-RESEARCH.md`). This phase flips the model: **every card costs 0 MP by
default**, and only cards whose printed description text explicitly demands
payment ("tribute") actually deduct MP — from a Mosje the player chooses at
tribute time.

This requires (a) a full text audit of every Piecie/Snelle Piecie/Place/Personal
Quest to determine which ones genuinely need tribute per their own printed text
(not per the current, largely-unenforced `mpCost` data value), (b) building the
actual MP-charging mechanism, (c) wiring tribute payment into each ruled card,
and (d) correcting every card's `mpCost` data field to match the final ruling.

**In scope:** Piecies, Snelle Piecies, Places, Personal Quests — all 4 named
card types, full text audit + implementation in one phase.
**Out of scope:** Mosje ability costs (`abilityCost` — equally unenforced today,
per research, but a separate problem; deferred). Phase 35's own Places
reconciliation work (PLACE-01 through 05, 08 through 11) — untouched by this
phase, resumes independently once Phase 36 is planned.

</domain>

<decisions>
## Implementation Decisions

### Rule-determination method
- **D-01:** Source of truth is each card's printed description **text**, not the
  current `mpCost` data value. Read every card fresh — if the text explicitly
  states a cost/tribute, that's the ruling; if it says nothing about paying,
  the card is free, regardless of what `mpCost` currently says.
- **D-02:** When text and the current `mpCost` data value disagree, **text
  wins** — consistent with every other ruling in this project's reconciliation
  work (Places audit, Mosje ability audit). Code/data gets corrected to match
  the card's printed promise.
- **D-03:** Process shape: **full audit pass first**. Read every Piecie/Snelle
  Piecie/Place/Personal Quest's text and produce one complete ruling table
  (same format as `.planning/audits/2026-07-14-places-text-audit.md`) *before*
  any code is written. Then plan + implement from the finished ruling table.
- **D-04:** Mosje ability costs (`abilityCost`) are **out of scope** for this
  phase, even though research found the identical underlying bug (declared but
  never charged). Noted as a deferred idea for its own future phase.

### Tribute mechanics
- **D-05:** When a card's text says it costs MP but doesn't name which Mosje
  pays, **the player picks which of their on-field Mosjes pays** at the moment
  of tribute (not an automatic default like "the acting Mosje"). This needs a
  UI picker for every such card — reuse the existing generic selection-modal
  pattern (`SelectionModal` / `showOptionSelect`), per this project's "build
  reusable UI once" rule in CLAUDE.md.
- **D-06:** If the chosen payer can't afford the tribute (insufficient MP),
  **the card cannot be played/activated** — the action is blocked entirely,
  consistent with this project's "negative MP never persists" ruling. No
  partial payment, no MP flooring to 0.
- **D-07:** Cost display stays **purely visual** — reuse the paying Mosje's
  existing on-field MP number ticking down. No new cost-UI element beyond the
  existing UI cost-chip (which already shows "Free"/"N MP" and will now be
  accurate again per D-08).
- **D-08:** As part of the audit, **correct every card's `mpCost` data field**
  to match the final ruling (0 where text says nothing, the exact text-stated
  amount where it does) — keeps the UI cost-chip meaningful again instead of
  cosmetic/stale.

### Relationship to Phase 35
- **D-09:** Phase 35's already-locked PLACE-06 (Delluft) / PLACE-07
  (Dierenasiel) rulings included a narrow, scoped version of this same
  mechanism — self-charge for their specific named PET/SUBSTANCE Piecies, then
  waived while those Places are active. **That work folds into Phase 36**
  instead of being built twice. Phase 35 keeps PLACE-06/07's simpler pieces
  (Delluft's draw-1, Dierenasiel's typo/dead-code cleanup) but drops the
  mpCost self-charge-and-waiver part — Phase 36's full audit will cover those
  same Piecies naturally. Phase 35's remaining requirements (PLACE-01
  through 05, 08 through 11) are unaffected and untouched by this phase.
  **Action required before Phase 35 resumes:** update `35-CONTEXT.md` and
  ROADMAP.md's Phase 35 section to remove the mpCost self-charge clause from
  PLACE-06/07's requirements (tracked as a to-do, not yet done as of this
  writing).

### Rollout size
- **D-10:** Full scope in **one phase** — audit + implement all 4 card types
  together, not split into per-card-type sub-phases. Rationale (user-agreed):
  the engine mechanism (default-0 + tribute charging + payer-picker) only
  needs to be built once, and one sim/balance pass validates the whole game
  rather than 3-4 separate passes across staggered phases.

### Claude's Discretion
- Exact architecture of the charging mechanism (a shared engine-level hook
  vs. continuing the existing per-card self-charge idiom like Welloe Force) —
  research/planning should evaluate both against the ~35+ affected cards and
  recommend.
- Audit ruling-table format and per-card commit granularity — follow the
  Places audit's precedent (`2026-07-14-places-text-audit.md`) unless a better
  format emerges.
- Whether "explicitly states payment" requires an exact keyword match or a
  holistic read of the card's described effect (e.g., "loses 40 MP to..." vs.
  "costs 40 MP") — use judgment consistent with prior reconciliation rulings.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior research this phase builds on
- `.planning/phases/35-places-text-reconciliation/35-RESEARCH.md` — Critical
  Finding 1 is the direct origin of this phase: exhaustive grep-verified proof
  that `mpCost` is never charged anywhere in the engine today, plus the one
  existing self-charge precedent (`effect_welloe_force`, `piecieEffects.js:811`).
- `.planning/phases/35-places-text-reconciliation/35-CONTEXT.md` — Plan-Phase
  Scope Amendments section documents the PLACE-06/07 decision this phase
  absorbs (D-09 above).
- `.planning/audits/2026-07-14-places-text-audit.md` — ruling-table format
  precedent to reuse for this phase's full card audit.

### Project conventions
- `CLAUDE.md` — "text wins" reconciliation precedent (D-02); reusable
  selection-modal rule (D-05); MP always a multiple of 5 (`roundToFive`) —
  applies to any new tribute amounts this audit derives.
- `.planning/STATE.md` — negative-MP-never-persists ruling (D-06); confirms
  gsd-sdk v1.42.3 is installed and this project's mpCost field genuinely
  exists as data (self-charging IS an established, if inconsistently-used,
  pattern — see Welloe Force).

### Data/code files the audit will need to read
- `src/data/piecies.js`, `src/data/snellePiecies.js`, `src/data/places.js`,
  and the Personal Quest data file (locate during research — not yet
  identified in this discussion) — every card's `description` text + current
  `mpCost` value.
- `src/abilities/piecieEffects.js`, `src/abilities/placeEffects.js` — current
  effect functions; Welloe Force's self-charge pattern is the reuse template.
- `src/engine/turnManager.js` — `playPiecie`, `activatePiecie`,
  `useMosjeAbility` (has the code comment confirming no generic cost
  enforcement exists, `turnManager.js:1133-1135`).

No external specs/ADRs — requirements captured entirely in the decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Welloe Force's self-charge pattern** (`piecieEffects.js:804-816`) — the
  only existing example of a card actually paying its own `mpCost` via
  `applyDamage(mosje, amount)` inside its own effect function. Template for
  every newly-ruled tribute card, unless research recommends a shared
  engine-level hook instead (Claude's discretion).
- **Generic selection modal** (`SelectionModal` / `modalManager.showOptionSelect`)
  — already used for deck pickers, target selection, etc. Reuse for the
  payer-picker UI (D-05) rather than building a bespoke tribute-payment modal.
- **`roundToFive` helper** — ensures any new/corrected tribute amounts land on
  the project's MP-five-grid convention.

### Established Patterns
- **"Text wins" reconciliation** — this project has run this exact process
  twice already (Mosje ability audit, Places audit); the audit-then-rule-then-
  implement cadence is proven and should be reused, not reinvented.
- **`resolvePlaceEffect` dispatcher pattern** — Places already gate effects
  through a central dispatcher; Piecies/Snelle Piecies/Personal Quests may
  need an equivalent central charging point, or may continue the decentralized
  self-charge idiom — a research question, not decided here.

### Integration Points
- Wherever tribute charging is added, it must NOT retroactively break Phase
  35's independent work (PLACE-01 through 05, 08 through 11) — those still
  ship as their own scoped fixes, unrelated to this phase's mechanism.

</code_context>

<specifics>
## Specific Ideas

- User's own framing (verbatim intent): "let's set the Piecie to cost 0 mp by
  default, and we will visit each card that explicitly states that it needs
  to be paid... default 0 mp, some cards require tribute (of a certain mosje,
  or all mosjes - we'll figure that out)." The "certain Mosje vs. all Mosjes"
  distinction is a per-card ruling to make during the audit (D-01), not a
  single global rule — some tribute cards may charge one chosen Mosje, others
  may charge every Mosje the player controls; the audit table should capture
  which, per card.

</specifics>

<deferred>
## Deferred Ideas

- **Mosje ability costs (`abilityCost`)** — equally unenforced today (same
  root bug), explicitly deferred to its own future phase (D-04).
- **Per-card-type sub-phase splitting** — considered and explicitly rejected
  in favor of one full-scope phase (D-10); noting the rejection so a future
  session doesn't re-propose splitting without reason.

### Reviewed Todos (not folded)
- `2026-07-13-coerts-caravan-binti-discount-mismatch.md` — scored highest
  todo-match (0.6) for this phase, but is now **moot**: Phase 35's locked D-08
  ruling replaces Coert's Caravan's text entirely ("all Mosjes lose 10 MP
  except Coert variants") and drops the Binti-discount line altogether, so
  there's no remaining text promise for this phase's audit to reconcile.
- `2026-06-11-ts-bulldozer-comeback-reconcile.md` — low relevance (0.2,
  keyword-only match on "cards"); concerns the archived declarative TS engine,
  out of scope per CLAUDE.md's `/_archive/` rule.
- `2026-07-13-full-game-ability-text-audit.md` — low relevance (0.2); this is
  the parent umbrella todo for Rounds 2+ of the full-game audit (Piecies,
  Snelle, remaining Mosjes) that Phase 35 already tracks as deferred. Phase 36
  effectively executes the Piecie/Snelle/Place portion of that round early,
  scoped specifically to MP cost text (not full ability-text reconciliation).

</deferred>

---

*Phase: 36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede*
*Context gathered: 2026-07-14*
