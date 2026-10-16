---
phase: 59
plan: 08
requirements: [EFX-02]
completed: 2026-10-16
---
# Phase 59 Plan 08: Protect / Welloe / Dingetje, coverage guard, EFX-02 Summary

Commits: cd39943 + b26e0c8 (engine), ff262d1 (Dingetje), then registry/coverage/docs commit.

- Mosje Shield = bound Stays entry (`boundTo[].shield`); `markMosjeDefeated` keeps the bound Mosje out of the Welloe pile (5 MP, V4 outcome kept). Welloe Force: hand discard as a pause + activation gate (needs a hand card), Stays to next turn start, thorns read the staying entry; V4 redirect, counter and main.js picker deleted.
- Reborn (start MP + 30) / Call (start MP): player picks from the Welloe pile (pause), fresh, Call linked both ways; card leaving play sends the Mosje back (`callMosjeBackToWelloe`). `confirmCallOfWelloes`, `_callOfWelloesPending` deleted; V4-value tests rewritten.
- Dingetje: Quest costs (zones/ready rule kept), one trait condition (`dingetjeForTrait`, discarded in rollQuestAttempt), Gekke Vogels KatjeGang (asks yes/no). `_dingetjeTochActive` and STUB-07 deleted. The existing cost picker lists it automatically (no UI change).
- Coverage guard: 73 ids have registry cases (5 added), effectIds in section files, five-star + Reborn limit 1. New test hook `injectWelloeMosje`.

## Deviations / to confirm
- "Named card" requirements other than Gekke Vogels (Only-if Mosje-on-field gates) are not Dingetje-substitutable; The Protector is not a Piecie in the data (nothing to limit).
- Full headless set (piecie-cards-2-0, card-chains, mechanics, chain-tests, redbull specs): 128 pass; VIS-02 (Leipe Swap) and VIS-08 (Laat me chillen) fail, identically on the pre-plan commit bf1b0b1 (bot attacks change MP / consume the Stays loss reducer): pre-existing, bot-dependent, test left unweakened. chain-3 and redbull-youri failed once and passed on rerun (flaky).
- Verification: npm test 149 files green, node --check clean, temp config deleted, no sim run.

## Self-Check: PASSED
