---
created: 2026-07-15
title: Remaining unwired Mosje synergy pairs + Cless Teacher/AZN Cless shared-effect fix
area: general
files:
  - src/data/mosjes.js (synergyWith/synergyEffect declarations)
  - src/abilities/questLogic.js:52-66 (PARTNER_QUEST_SYNERGIES table, getPartnerSynergyQuestBonus)
  - src/abilities/questLogic.js:489-520 (Michelle Tough Gamble)
  - src/abilities/questLogic.js:544-578 (FPS Coert Headshot Precision)
  - src/engine/turnManager.js:22-30 (hasBothChrisAndYouri)
  - src/engine/turnManager.js:39-70 (maybeChainChrisDdrCombo / DJ 8020 bonus)
  - src/engine/synergyResolver.js (getActiveSynergies, synergyWaiverActive gate)
---

## Problem

Found 2026-07-15 while manually verifying Phase 35-06 (Synergy Chamber rework) in a live browser session with Gandoe. Enumerated every `synergyWith`/`synergyEffect` pair declared in `src/data/mosjes.js` and cross-checked which ones actually have consuming code (not just the shared `hasSynergy()`/`getActiveSynergies()` utility — also checked for separate ad-hoc presence checks elsewhere in the engine).

**Full pair inventory (as of 2026-07-15):**

| Pair | Status | Notes |
|---|---|---|
| Binti + any Coert variant | ✅ wired | `hasFoodDoubleSynergy` (synergyResolver.js) — FOOD Piecies double MP |
| Señor West + AZN Cless | ✅ wired | `getPartnerSynergyQuestBonus` (questLogic.js) — Physical Quest +15 MP |
| Chris + Youri | ✅ wired, but NOT waiver-aware | `hasBothChrisAndYouri` (turnManager.js:22-30) — instant Piecie placement. Uses its own ad-hoc id-presence check, not `getActiveSynergies`, so Phase 35-06's `synergyWaiverActive` flag does not bypass it. |
| Chris DDR + DJ 8020 | ✅ wired, but NOT waiver-aware | `maybeChainChrisDdrCombo`'s `dj8020Alive` check (turnManager.js:39-70) — +2 to the Perfect Combo Chain roll. Same issue: separate ad-hoc check, waiver doesn't reach it. |
| Michelle + Gandoe Destroyer | ❌ dead | Card text promises "Tough Gamble rolls of 5-6 also grant Gandoe +10 MP" but the actual implementation (questLogic.js:489-520) only rolls a d6 to double/halve Michelle's own reward — never checks for Gandoe's presence or grants him anything. |
| FPS Coert + FPS West | ❌ dead (stale) | `mosje_fps_coert`'s declared synergyEffect ("when either completes a Quest, BOTH gain +10 MP") predates the 2026-07-13 ability-text reconciliation, which replaced FPS Coert's real ability entirely with "Headshot Precision" (questLogic.js:544-578, roll-1d6-on-6-gain-30-drain-opponent-15) — a mechanic with zero reference to FPS West. The synergyWith/synergyEffect data fields were never updated to match. |
| Alyssa Bulldozer/Fissa + Jisca | ❌ never designed | `synergyEffect: null` on all 3 cards — already tracked separately in `2026-07-12-alyssa-jisca-synergy-design.md`. Not duplicated here. |
| Cless Teacher + Señor West | ❌ dead, even with real partner present | `mosje_cless_teacher` declares the identical text to AZN Cless ("Physical Quests give +15 bonus MP" with Señor West) but `PARTNER_QUEST_SYNERGIES` (questLogic.js:52-66) only hardcodes `mosje_azn_cless` — Cless Teacher's copy of the same promise is unreachable regardless of Synergy Chamber/waiver, since the table entry itself excludes her id. |

## Solution

Two separable pieces of work for a future phase (Gandoe: "37? 38? we'll see" — not yet numbered/scheduled):

**1. Cless Teacher/AZN Cless shared-effect fix (simple, per Gandoe's explicit direction 2026-07-15):**
Treat them as sharing the one Physical-Quest-+15-with-Señor-West effect. Minimal fix: widen `PARTNER_QUEST_SYNERGIES`'s pair-matching so `mosje_cless_teacher` is treated as interchangeable with `mosje_azn_cless` for this one entry (e.g. an "either Cless variant" pair-membership check, mirroring the `FOOD_SYNERGY_COERTS`-array pattern already used for Binti's 3 Coert variants in `synergyResolver.js`).

**2. Remaining unwired/stale synergy pairs — full pass:**
- Michelle + Gandoe Destroyer: implement the Gandoe +10 MP grant on Tough Gamble rolls of 5-6 (currently text-only).
- FPS Coert + FPS West: reconcile the stale `synergyWith`/`synergyEffect` data against FPS Coert's actual 2026-07-13-reconciled ability (Headshot Precision has no FPS West dependency) — likely drop the stale declaration rather than build a new mechanic, per this project's established "text vs code, decide per-card" precedent, unless FPS West's own side of the text implies a mechanic worth keeping.
- Chris+Youri and Chris DDR+DJ 8020: decide whether to extend Synergy Chamber's `synergyWaiverActive` flag into `hasBothChrisAndYouri` and the DJ 8020 roll-bonus check (both in `turnManager.js`) so the waiver matches the card's literal "**All** Mosje synergy effects" text — deferred from Phase 35-06 by explicit choice (2026-07-15) to keep that wave's scope matching its locked plan (which only enumerated the 2 shared-utility consumers, missing these ad-hoc ones during its own research pass).
- Alyssa/Jisca: out of scope here, already owned by `2026-07-12-alyssa-jisca-synergy-design.md`.

**Process:** follow the established "text audit → rule per-card → implement" cadence already used for Places (Phase 35) and the Mosje ability-text reconciliation — this is effectively "Round 2" of synergy-specific reconciliation, narrower than the full ability-text audit.
