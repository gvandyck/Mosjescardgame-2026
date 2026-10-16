---
phase: 60-snelle-places-and-hidden-information
plan: 01
requirements: [EFX-03]
commits: [d88d517, e459760]
---
# Phase 60 Plan 01: Snelle framework + five Snelle

- Framework: Snelle effects get `(state, pid, ctx = { reaction, resume })`; `resolveReaction` hands the open window (moments, preview, held action, actor) to the Snelle. `src/rules/snelleConditions.js` (`snelleConditionMet`) gates Needs / Only-if before Energy, both when offering in a window and when playing; a refusal pays nothing and keeps the card.
- Pick pause: `src/engine/snelle/{runSnelleEffect,resumeSnelleChoice,finishSnelle}.js`, pendingChoice hook `'snelle'`; card stays in its slot, finishes once on resume; inside a window the other windows and the held action continue after the pick (`continueReaction`). Bot answers via the existing `settleMosjePauses` (first option); both `settleReactions` (UI + bot) now settle a snelle pause.
- Bodies in `src/abilities/snelle/snelleMpEffects.js` (+ `pickMosje.js`): Momentum Rush, Bijna Welloe, Ff Haaltje Nemen (draw via drawFromEffect), Chillingsvoorbij! (newest Place), Jantje (-15 / +15, V4 30-steal gone; fresh opponents excluded). Protector/Blensen! limit 1 already in data (asserted).
- Tests: `snelle-framework.test.ts` (8), `snelle-simple.test.ts` (6); registry `snelle-registry-2-0.js` + spec: 11 headless cases green. Hooks `botPlaySnelle` / `botQuest` and trigger kinds `playSnelle` / `botPlaySnelle` / `botQuest` added; `injectGraveyardCard` now types the card correctly; setup option `deckSize`.
- Deviations: (1) `reaction-windows.test.ts` and `piecies-ed-mp-substance-gear.test.ts` fixtures now give the defender Mental 2 stars, because Jammertje / Counter Strikka really need it (assertions unchanged). (2) V4 `effect_ff_haaltje_nemen` kept (legacy test imports it). (3) `defaultAbilityInputs.js` untouched: the bot default for the pause already lives in `chooseTriggerChoice`.
- Unbuildable texts: none. Not yet done (later plans): Needs checks for Perfect Dodge / Lucky Cóin / Counter Strikka / Jammertje are in place but their effects are still V4 bodies (60-02 / 60-03).
- Final: npm test 1614 pass; node --check clean; temp Playwright config deleted.

## Self-Check: PASSED
