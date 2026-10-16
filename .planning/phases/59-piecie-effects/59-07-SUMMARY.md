---
phase: 59-piecie-effects
plan: 07
requirements: [EFX-02]
completed: 2026-10-16
---
# Phase 59 Plan 07: Redbull, Double Trigger, Dubbele Ding, Leipe Swap Summary

Commits: b1606e5 (engine + unit tests), 6d833ee (specs, registry, helper).

- Redbull / Double Trigger: `slot.extraAbilityUses` raises the per-turn limit in `useMosjeAbility`; each use pays the ability's Energy again; cleared at turn start and in `expireThisTurnEffects`. V4 echo, `abilityDoubleTrigger`, reprompt sets and the main.js re-fire are deleted. Amplifier (hidden Mosje) now grants the same extra use.
- Dubbele Ding: up to 2 pauses over hand Piecies (gate, TemPiecie lock, Energy, free slot); a queue (`continueDubbeleDing`, resumed from `resumePiecieChoice`) activates each as a normal paid activation. Nested activations open no reaction window of their own.
- Leipe Swap: permanent (mp-direct-ok swap), end-of-turn revert and the bespoke main.js picker deleted; generic target picker used.
- Specs live: all Redbull specs, both cinemas, chain-5, VIS-02, 4 registry cases (headless, touched specs only). The Controller "Phase 59" gap in chain-6 now asserts exactly +10.

## Deviations / rulings to confirm
- Redbull is not offered on draw-step or reaction abilities (Coert, Martin Historian, DJ 80/20): they have no button to press again. So the Coert Redbull specs became "no target / goes to Tuk" tests; V4 MP payments, use counters, +6 Quest bonus and QUEST_BLOCKED assertions were replaced by Energy/MP/use-count equivalents (Youri/Gambler/Binti/West/Architect tests use two real uses).
- Youri only makes the Piecie ready; the player activates it (cost paid then) - the spec does both.
- Extra uses are a limit, not a decremented counter (uses count only on paid success).
- Old tests rewritten: leipe-swap.test.ts replaced, phase48 Dubbele test, amplifier tests.

Verification: npm test 148 files green; node --check clean; temp headless config deleted. No sim run. No unbuildable texts.

## Self-Check: PASSED
