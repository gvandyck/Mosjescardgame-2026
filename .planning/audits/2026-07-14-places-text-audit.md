---
created: 2026-07-14
title: Places text-vs-engine divergence report (audit round 1 — Places)
branch: card/full-game-text-audit
scope: All 21 Place cards (src/data/places.js vs src/abilities/placeEffects.js)
sensitivity: everything incl. flavor/wording (per Gandoe 2026-07-14)
---

# Places audit — divergence report

Method: read every Place's `description` text and its `effectId` function, then
traced every flag/behavior to its actual consumer in the engine. "Inert" = the
effect sets a flag or returns a value that nothing in the live engine reads.

## Legend
- 🔴 **Material** — different numbers/targets, missing effect, or untexted extra behavior
- 🟡 **Wording/flavor** — mechanically works but text is imprecise/misleading
- ✅ **Clean** — text matches behavior

---

## 🔴 Flagged — material divergences (need a ruling)

| # | Place | Text says | Engine does | Divergence |
|---|-------|-----------|-------------|------------|
| 1 | **Dierenasiel** | PET Piecies cost 0 MP; PET protection +25% | **Nothing** — `effect_dierenasiel` sets `state.dienasielActive`, but every consumer reads `state.dierenasielActive` (spelling mismatch). Cost-0 has no consumer at all. | **TYPO BUG — card is entirely inert.** `placeEffects.js:413` vs `mpManager.js:198`/`turnManager.js:1154` |
| 2 | **Coert's Caravan** | Coert +15; **all Binti Piecies cost 5 less MP** | Coert +15 ✓. Binti discount **unimplemented** — instead sets `freePiecieActivationAvailable` (a free-activation flag, unrelated, and itself inert/Place-gated). | +15 ✓; Binti discount missing; code does an unrelated inert thing. `placeEffects.js:267-270` |
| 3 | **Synergy Chamber** | All synergy effects trigger **without the paired Mosje on field** | Headline **unimplemented** — `synergyResolver.js:39` still requires the partner. Instead grants cost −5 / dice +1 / duration +1 (none of which the card mentions). | Headline missing; code does 3 untexted things. |
| 4 | **The Void** | All Mosjes −15; **cannot play RESTORE or FOOD Piecies** | −15 ✓. RESTORE/FOOD restriction **unimplemented**. PLUS untexted: nullifies all direct Quest MP gain/loss (`questLogic.js:338`). | −15 ✓; restriction missing; untexted quest-MP-nullify present. |
| 5 | **Drain Zone** | Lowest-MP Mosje −10; **ATTACK Piecies deal +10 damage** | Lowest −10 ✓. ATTACK +10 **unimplemented**. PLUS untexted: +5 to **all** MP gains while active (`mpManager.js:38`). | −10 ✓; ATTACK bonus missing; untexted +5-all-gains present. |
| 6 | **Digital Gaming Stop** | Technical Quests **auto-succeed** for DIGITAL; DIGITAL-EQUIPMENT Piecies **+20 MP** | Auto-succeed **inert** (`questAutoSuccess` flag returned, never consumed). +20 **unimplemented**. Auto-succeed logic also loose (fires on any non-physical quest, not just Technical). | Both promises effectively dead. |
| 7 | **Delluft** | Draw 1; **SUBSTANCE Piecies cost 0 MP this turn** | Draw ✓. SUBSTANCE cost-0 **unimplemented** (no consumer). | Draw ✓; cost-0 missing. |
| 8 | **Skiffa** | **Discard 1 card OR lose 15 MP** (player choice); SUBSTANCE immune | No choice — always −15 to non-SUBSTANCE. Code comment admits the discard branch is a stub. | Choice branch missing. `placeEffects.js:117-118` |
| 9 | **De Box** | GANDOE +20; **MICHELLE/TUK** +15; both +10 bonus | GANDOE +20 ✓; only `michelle` matched — **TUK omitted**. (Also cosmetic: logs say "Toennoe".) | TUK gets nothing. `placeEffects.js:505` |

## 🟡 Flagged — first-slot-only bug (text implies all Mosjes)

These loop `findIndex(first active slot)` and only affect ONE Mosje, but the text
is plural. Real once a player has 2+ Mosjes on field (which the bot now does).

| # | Place | Issue |
|---|-------|-------|
| 10 | **Bank Chilling** | "Social ★★+ Mosjes gain +15" — only checks first active slot. `placeEffects.js:100` |
| 11 | **Obby #1** | "Physical/Resilient ★★+ Mosjes" success/fail — first active slot only. `placeEffects.js:145` |
| 12 | **Arcade** | "Technical ★★+ Mosjes gain +15" — first active slot only. `placeEffects.js:172` |

## ✅ Clean (text matches behavior)

- **The Gym** — physical ★★/★★★ tiers, CLESS +20, WEST neutral all match.
- **Quest Haven** — +10/quest, +25 for 2-in-a-turn. ✓
- **Zo is Natuur** — all +10, resilient +15. ✓
- **Momentum Factory** — first Piecie/turn +10. ✓
- **Momentum Stabilizer** — 30 MP loss cap works via `activePlace` check (the flag it sets is dead code, but behavior is correct). ✓
- **Boxing Ring** — FIGHTING +10, GANDOE +10 extra. ✓ ("Turn Start" = START_PHASE trigger.)
- **Welloe Graveyard** — +20 to swapped-in Mosje (swap selection is UI-driven). ✓ assumed
- **Eendjes Voeren** — MICHELLE +10 ✓; resilient★★★ aura via `getMosjeTrait` in questLogic (trusted, not re-verified end-to-end).
- **Tesla** — COERT/BINTI +20, +10 together, Coert-defeat destroys Tesla (`victoryChecker.js:201`). ✓

---

## Cross-cutting theme
Many of these are **"requires UI validation" promises that were never wired** — cost
reductions and play-restrictions (Coert's Caravan, Delluft, Dierenasiel, The Void)
and stub flags returned but never consumed (Digital Gaming Stop's `questAutoSuccess`,
Synergy Chamber's headline). The cost-reduction ones can now hook the existing
`mpCost` field (this was the false-premise correction from 2026-07-14).

## Ruling status: ALL 12 RULED (2026-07-14, interactive with Gandoe). Ready to implement.

---

# RULINGS (2026-07-14)

Implementation follows the reconciliation-todo precedent: one card at a time, TDD
(failing test → implement → `node --check` + `npm test` → commit), re-run sim for
MP-touching changes. `id.includes('coert'|'tuk'|'michelle')` string checks match
the existing effect-file idiom.

### Reworks / new designs

1. **Coert's Caravan** — REPLACE. Trigger `TURN_START` → `END_PHASE`. New effect: *"End of turn: all Mosjes lose 10 MP, except Coert variants."* Immune = `id.includes('coert')` (FPS Coert `mosje_fps_coert`, Hawaiian Tech Savant `mosje_coert_tech`, KasteLuck `mosje_coert_kasteluck`; hidden Kast-elein also matches, harmless). DROP the old +15-Coert buff AND the inert `freePiecieActivationAvailable` write. MP-touching → sim.

2. **Synergy Chamber** — REWORK. New effect: *"Once per turn, you may activate a Mosje's synergy ability without its partner Mosje on your field."* DROP the 3 undocumented bonuses (cost −5 / dice +1 / duration +1) — remove `getSynergyChambercostReduction` consumption at `turnManager.js:1179` + the getters. ⚠ Research: identify which abilities are partner-gated + how to grant a one-per-turn waiver.

3. **Skiffa** — NEW DESIGN. Trigger `END_PHASE` → `ON_QUEST`. New effect: *"Social quests: all players get +2 to the dice roll."* DROP the SUBSTANCE/discard/-15 theme entirely. Reuse the existing quest dice-bonus mechanism.

4. **Digital Gaming Stop** — NEW DESIGN (dialed down; booster-only). New effect: *"DIGITAL-EQUIPMENT Piecies give +10 MP while active."* DROP the auto-succeed clause + the dead `questAutoSuccess` flag. MP-touching → sim.

5. **The Void** — NEW DESIGN (new mechanic). New effect: *"While active, each player may activate only ONE card per turn (Snelle / Piecie / Personal Quest / Place / Mosje)."* REMOVE the -15 drain and the untexted quest-MP-nullify (`questLogic.js:338`). ⚠ Research: brand-new cross-cutting per-turn activation cap — needs a counter + enforcement across every play/activate path. Highest risk; implement LAST.

6. **Drain Zone** — TEXT WINS. Keep lowest-MP −10; IMPLEMENT *"ATTACK Piecies deal +10 MP damage"*; REMOVE the untexted +5-to-all-gains at `mpManager.js:38`. MP-touching → sim.

7. **Delluft** — TEXT WINS. Keep draw-1; IMPLEMENT *"SUBSTANCE Piecies cost 0 MP this turn"* (hook `mpCost`).

8. **Dierenasiel** — PARTIAL. IMPLEMENT *"PET Piecies cost 0 MP"* (hook `mpCost`). DROP the +25% PET-protection clause AND its typo'd inert code (`dienasielActive`/`dierenasielActive` mismatch + the `mpManager.js:198` consumer). New text: *"All PET Piecies cost 0 MP."*

### Straight bug fixes (align code to existing text)

9. **De Box** — Extend +15 to any Mosje with `id.includes('michelle') || id.includes('tuk')` (`mosje_michelle`/Iron Tuk, `mosje_tuk_healer`, `mosje_tuk_architect`). Extend the "both together +10 bonus" to gandoe + any michelle/tuk. Fix the cosmetic "Toennoe" logs → "De Box". MP-touching → sim.

10. **Bank Chilling** — Loop ALL active slots; every Social ★★+ Mosje gets +15 (not just first). MP-touching → sim.

11. **Obby #1** — Loop ALL active slots; every Physical/Resilient ★★+ Mosje gets +20 success / −10 fail. MP-touching → sim.

12. **Arcade** — Loop ALL active slots; every Technical ★★+ Mosje gets +15 on success. MP-touching → sim.

### Suggested implementation order
Bugs first (lowest risk): Bank Chilling → Obby #1 → Arcade → De Box. Then text-wins: Drain Zone → Delluft → Dierenasiel. Then reworks: Coert's Caravan → Digital Gaming Stop → Skiffa → Synergy Chamber. **The Void LAST** (new cross-cutting mechanic, highest risk).

