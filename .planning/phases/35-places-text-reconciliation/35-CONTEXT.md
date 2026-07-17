---
phase: 35
name: Places Text-vs-Engine Reconciliation (Round 1)
status: context-captured
date: 2026-07-14
branch: card/full-game-text-audit
---

# Phase 35 — Places Text-vs-Engine Reconciliation (Round 1): Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Reconcile all 21 Place cards so each card's `description` text matches what the
engine actually does. Round 1 of the full-game ability-text audit (Places first;
Piecies / Snelle Piecies / remaining Mosjes are later rounds — out of scope here).

Audit is done: 9 Places are clean, **12 are flagged and ruled** (5 straight bug
fixes + 7 design reworks/new-designs). This phase implements the 12 rulings.

**In scope:** the 12 flagged Places only.
**Out of scope:** the 9 clean Places; all Piecies/Snelle/Mosjes; the Alyssa↔Jisca
synergy design (separate todo).
</domain>

<decisions>
## Implementation Decisions

**Full ruling detail (per-card, with file:line targets and reuse notes) lives in
the canonical ref `.planning/audits/2026-07-14-places-text-audit.md` — the
RULINGS section. Planner/executor MUST read it.** Summary:

### Straight bug fixes (align code to existing text)
- **D-01 Bank Chilling** — loop ALL active slots; every Social ★★+ Mosje +15 (was first-slot only).
- **D-02 Obby #1** — loop ALL active slots; every Physical/Resilient ★★+ Mosje +20 success / −10 fail.
- **D-03 Arcade** — loop ALL active slots; every Technical ★★+ Mosje +15 on success.
- **D-04 De Box** — extend +15 to any `id.includes('michelle')||id.includes('tuk')` (`mosje_michelle`/Iron Tuk, `mosje_tuk_healer`, `mosje_tuk_architect`); extend the both-together +10 bonus accordingly; fix cosmetic "Toennoe" logs.

### Text-wins implementations
- **D-05 Drain Zone** — keep lowest −10; implement "ATTACK Piecies deal +10 damage"; REMOVE the untexted +5-to-all-gains (`mpManager.js:38`).
- **D-06 Delluft** — keep draw-1; implement "SUBSTANCE Piecies cost 0 MP this turn" (hook `mpCost`).
- **D-07 Dierenasiel** — implement "PET Piecies cost 0 MP" (hook `mpCost`); DROP the +25% protection clause AND its typo'd inert code (`dienasielActive` vs `dierenasielActive`, `mpManager.js:198`).

### Reworks / new designs
- **D-08 Coert's Caravan** — REPLACE. Trigger `TURN_START`→`END_PHASE`. New: "End of turn, all Mosjes lose 10 MP except Coert variants" (immune = `id.includes('coert')`). Drop the +15 buff and the inert `freePiecieActivationAvailable` write.
- **D-09 Digital Gaming Stop** — REWORK (booster-only). New: "DIGITAL-EQUIPMENT Piecies give +10 MP while active." Drop auto-succeed + dead `questAutoSuccess`.
- **D-10 Skiffa** — NEW DESIGN. Trigger `END_PHASE`→`ON_QUEST`. New: "Social quests: all players get +2 to the dice roll." Drop the SUBSTANCE/discard/-15 theme.
- **D-11 Synergy Chamber** — REWORK. New: "Once per turn, activate a Mosje's synergy ability without its partner on field." Drop the 3 undocumented bonuses (cost−5/dice+1/duration+1) + their consumers.
- **D-12 The Void** — NEW MECHANIC. New: "While active, each player may activate only ONE card per turn (Snelle/Piecie/Personal Quest/Place/Mosje)." Remove the −15 drain + the untexted quest-MP-nullify (`questLogic.js:338`). **Highest risk — implement LAST.**

### Claude's Discretion
- Exact test shapes; per-card commit granularity; internal helper naming — follow existing effect-file idioms.
- Whether a shared "affect all qualifying Mosjes" helper is worth extracting for D-01/02/03 (they share the loop-all pattern).

### Process (locked)
- One card at a time, TDD: failing test → implement → `node --check` + `npm test` → commit per card (reconciliation-todo precedent).
- MP-touching cards (D-01,02,03,04,05,08,09) → re-run Ronald Kip stacking test + full sim.
- Suggested order: bugs (D-01→04) → text-wins (D-05→07) → reworks (D-08→11) → The Void (D-12) last.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/audits/2026-07-14-places-text-audit.md` — **THE ruling record.** Per-card divergence + ruling + file:line targets + reuse notes. Read first.
- `src/data/places.js` — the 21 Place definitions (`description`, `trigger`, `tags` fields to edit)
- `src/abilities/placeEffects.js` — every Place effect function + `resolvePlaceEffect` dispatcher
- `src/engine/mpManager.js` — `gainMP`/`loseMP`; Drain Zone +5 (`:38`) and Dierenasiel (`:198`) live here; Momentum Stabilizer cap pattern (`:122`)
- `src/engine/turnManager.js` — turn lifecycle; Synergy Chamber cost consumer (`:1179`); Chris+Youri same-turn-activation pattern; per-turn counters (reset in `startTurn`)
- `src/abilities/questLogic.js` — quest resolution; The Void quest-MP-nullify (`:338`); dice-bonus / `questPrepBonus` mechanism (for Skiffa/Digital dice bonuses); `applyMosjeFieldEffectsOnQuest`
- `src/engine/synergyResolver.js` — partner-gating logic (`:39`) for Synergy Chamber rework
- `docs/phase0-rulings.md` — canonical rules; check before MP/quest changes
- `docs/card-reference.md` — implementation-status doc; AZN Cless row is the ruling-record format precedent
- `tests/ui/cards/` — card-test-library (data-driven card-effect tests); `tests/engine/` unit tests

## Code Context (reusable assets)

- **Loop-all-slots** pattern: `effect_the_gym`/`effect_zo_is_natuur` already iterate every slot — copy for D-01/02/03.
- **`id.includes(...)`** string matching for Mosje families is the existing idiom (`effect_de_box`, `effect_coerts_caravan`).
- **Place self-destruct** (if needed): `victoryChecker.js:201` Tesla destroy-on-Coert-defeat.
- **mpCost hook**: every Piecie has `mpCost` (`src/data/piecies.js`); engine supports self-charging costs (`turnManager.js:97`,`:1134`) — the anchor for D-06/D-07 cost-0 and any discount.
- **Quest dice bonus**: `getSynergyChamberDiceBonus`, `questPrepBonus` (Cless Teacher), `skiffaRerolls` — precedents for D-10 Social +2 roll and D-09.
- **Per-turn counters**: `pieciesActivatedThisTurn` (reset in `startTurn`, bumped in `activatePiecie`) — pattern for D-12's activation cap.

## Deferred Ideas (future phases, not this one)
- Full audit rounds 2+: Piecies, Snelle Piecies, remaining Mosjes (`2026-07-13-full-game-ability-text-audit.md`).
- Alyssa↔Jisca synergy design (`2026-07-12-alyssa-jisca-synergy-design.md`).
- **Drain Zone (D-05) full rework** — deferred until a phase that touches Piecies (needs ~11 ATTACK effect function edits, see below).
- **The Void (D-12) full rework** — deferred until the play-vs-activate cap question is resolved via a dedicated design pass.
</canonical_refs>

<plan_phase_amendments>
## Plan-Phase Scope Amendments (2026-07-14, post-research)

Research (`35-RESEARCH.md`) surfaced 3 ambiguities in the original rulings that required
Gandoe's explicit decision before planning. All three are now resolved and locked:

### D-06/D-07 mpCost clarification — SUPERSEDED, folded into Phase 36 (2026-07-14, later same session)
Research initially found no generic Piecie MP-cost charging in the engine and flagged
"hook mpCost" as infeasible as literally stated. Gandoe clarified: `mpCost` is a real field
with an established self-charging pattern (Welloe Force pays its own 40 MP via `applyDamage`,
`piecieEffects.js:811`) — the engine supports this by design. What research correctly found,
though, is that the *specific* PET Piecies (Bowie & Stormey, Tony, Gekke Vogels, KatjeGang,
ViannaPoes) and relevant SUBSTANCE Piecies never invoke that self-charge today — confirmed by
reading their effect functions (`piecieEffects.js:839,854,866` — no `applyDamage` call).

**Original decision (now superseded):** PLACE-06/07 add the missing self-charge to just these
2 cards' named Piecies, then waive it.

**Superseded by:** immediately after this was locked, Gandoe proposed a game-wide redesign
(every Piecie/Snelle Piecie/Place/Personal Quest defaults to 0 MP cost; tribute only where a
card's text explicitly demands it) — scoped as **Phase 36**
(`.planning/phases/36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede/36-CONTEXT.md`).
Building PLACE-06/07's self-charge narrowly now would duplicate work Phase 36's full audit
covers anyway. **Current ruling:** PLACE-06 keeps only its draw-1 (already correct); PLACE-07
keeps only its +25%-clause removal + typo/dead-code cleanup. The "cost 0 MP" text/mechanism
for both cards ships as part of Phase 36, not Phase 35.

### D-05 Drain Zone — DESCOPED, hidden from play
The "ATTACK Piecies deal +10 damage" rework requires editing ~11 separate ATTACK-tagged Piecie
effect functions outside `placeEffects.js` (Drain Zone has no generic damage-interception point).
**Locked:** not implemented this phase. Drain Zone is hidden from all player-facing pools
(deck-building, boosters, starter decks — same filtering pattern as `getPlayerFacingDecks()`)
until a future phase that touches Piecies can do the full rework. Card data and effect code
stay in the codebase untouched/unreachable. The untexted +5-to-all-gains bug (`mpManager.js:38`)
is still removed this phase — independent dead-code cleanup, not tied to the hide decision.

### D-12 The Void — DESCOPED, hidden from play
The "one card activation per turn" cap's exact gating scope (which of 9 play/activate functions,
play-vs-activate split) is not resolvable without a dedicated design pass — genuinely ambiguous,
not a research gap. **Locked:** not implemented this phase. The Void is hidden from all
player-facing pools, same treatment as Drain Zone. The untexted quest-MP-nullify
(`questLogic.js:338`) is still removed this phase — independent dead-code cleanup.

### Hide mechanism (applies to both Drain Zone and The Void)
Filter both cards out of deck-building, booster packs, and starter decks — same pattern as the
existing `getPlayerFacingDecks()` filtering (`src/data/playerFacingDecks.js`). Card definitions
and effect functions are NOT deleted, just made unreachable from any player-facing surface.

**Effective requirement count this phase: 10 implemented (PLACE-01,02,03,04,06,07,08,09,10,11)
+ 2 hidden (PLACE-05, PLACE-12, dead-code-only).**
</plan_phase_amendments>
