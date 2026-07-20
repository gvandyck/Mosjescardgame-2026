---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 48
status: ready_to_plan
last_updated: "2026-07-20T18:27:57.647Z"
progress:
  total_phases: 42
  completed_phases: 24
  total_plans: 92
  completed_plans: 79
  percent: 57
---

# Project State

**Last updated:** 2026-07-19
**Current phase:** 48
**Branch:** card/phase-46-thematic-piecies

## RESUME HERE (2026-07-19 handoff - Phase 46 COMPLETE, both plans)

**Next command:** `$gsd-verify-work 46` for conversational UAT, or select the
next pending roadmap phase.

**Phase 46 is COMPLETE (2/2 plans).** Plan 46-01 added Loaded Dice, Boosterpackkie,
Perfect Rhythm, and Dikke Plaat as free booster-only UTILITY Piecies. Plan 46-02
closed the 3 UAT-reported design-change gaps against those cards: Boosterpackkie's
5-6 bonus draw now requires a COERT-family Mosje on field (matching the existing
+10 MP gate — without COERT, only the single draw happens, no matter the roll);
Perfect Rhythm's later-Piecie draw is now repeating (draws 1 for EVERY later
Piecie activated this turn, not just the first — still never triggers off itself,
still clears at end of turn); Dikke Plaat's +2 DJ bonus now also matches exact
[Alyssa] Fissa Fissa! (`mosje_alyssa_fissa`, Alyssa Bulldozer excluded), with the
exception named on the card text per the user's explicit request.
`docs/card-reference.md` reflects all three reworked designs plus a new thematic
note on the Alyssa Fissa/DJ pairing.

**Verification (46-02):** `node --check` clean on the 3 touched runtime files;
focused Vitest **23/23** (20 baseline + 3 new); full `npm test` **701/701**, 0
regressions; focused browser card tests (Playwright) **4/4** for all Phase 46
cards; Ronald Kip +50 MP stacking check **1/1** passed. Full `npm run test:sim`
intentionally NOT run — none of the 3 changes touch MP math/costs/level
thresholds/Quest-completion logic (draw-gating + a quest-bonus condition
widening only), so the plan's escalation trigger to the full simulation was
never hit. Details in `46-02-SUMMARY.md`. No commit to `main` performed; work
stays on `card/phase-46-thematic-piecies`.

<details>
<summary>Prior resume note (superseded - Phase 46 Plan 01 only, before UAT gap closure)</summary>

**Phase 46 was COMPLETE (1/1 plan) at this point.** Added Loaded Dice, Boosterpackkie, Perfect
Rhythm, and Dikke Plaat as free booster-only UTILITY Piecies. Their generic
effects and JEFFREY/COERT/DJ family kickers are wired, Perfect Rhythm's exact
DDR Chris kicker and one-shot later-activation draw are turn-scoped, and all
four cards are covered by focused tests and the browser card registry.
`docs/card-reference.md` now reflects the live 74-card Piecie pool and records
the Keyboard pairing; Coert Kast-elein remains hidden and Chris All-Rounder
still has no dedicated item.

**Verification:** runtime syntax checks passed; focused Vitest **20/20**;
targeted browser cards **4/4**; `npm run validate` passed with **698/698** tests
and the existing lint-warning baseline. Full cards: **60 passed / 9 skipped /
3 failed** (two known failures plus one transient Ming Natural timeout that
passed alone); all four new cards and Ronald Kip +50 passed. Full simulation:
**153/160**, seven timeout-only reward-overlay failures (**4.4%**), **0
crashes**. Details are in `46-01-SUMMARY.md`. No commit or push performed.

</details>

<details>
<summary>Prior resume note (superseded - Phase 41 Coert's Caravan COMPLETE)</summary>

**Phase 41 is COMPLETE (1/1 plan).** Discussion corrected the original stale Binti-discount prompt:
the discount should not return, Tesla / Winston Jaaa / Varkenspootjes combo space stays booster-side,
and Coert's Caravan should become a Coert-flavored defensive Place. Implemented final user ruling:
while active, each Coert-family Mosje ignores up to 40 MP of Quest damage per turn. Quest attempt
costs and non-Quest MP loss remain unshielded, and the old end-phase drain is removed.

**Verification:** runtime syntax checks clean for `places.js`, `placeEffects.js`, and `mpManager.js`;
focused `npm test -- place-coerts-caravan` **5/5 GREEN**; full `npm test` **678/678 GREEN**;
`npm run validate` clean with the existing lint warning baseline only. `41-CONTEXT.md`,
`41-01-PLAN.md`, and `41-01-SUMMARY.md` written. No commit, push, merge, or main update performed.

</details>

<details>
<summary>Prior resume note (superseded - Phase 40 deck slice COMPLETE; plan Phase 41 next)</summary>

**Phase 40 deck slice is COMPLETE (1/1 plan).** The roadmap entry came from a stale todo status:
the live implementations had already landed in commits `56fc3b4` (Chris All-Rounder Perfect Setup),
`1de1ee5` (Jisca Perfect Combo), and `a28edce` (Coert KasteLuck Morning Luck). Plan 40-01 audited
those commits against the settled rulings, confirmed all three are ancestors of the current branch,
ran their existing engine and real-browser regression coverage, and replaced generic card-reference
rows with the actual mechanics. No duplicate gameplay implementation was added.

**Verification:** runtime syntax checks clean; focused Vitest **50/50 GREEN**; focused Playwright
card chains **3/3 GREEN**; `npm run validate` clean with **676/676** tests and the existing lint
warning baseline; `npm run test:cards` matched baseline at **57 passed / 9 skipped / 2 known unrelated
failures** (`mosje_amplifier`, `mosje_binti_creator`), with Ronald Kip +50 MP passing. A fresh
`npm run test:sim` attempt was terminated by the command's 15-minute ceiling after 15 scenarios
(11 pass, 4 existing timeout-style failures, 0 crashes). The completed Phase 39 sim remains valid
for the same runtime source state: **154/160, 0 crashes, 3.75% failures**. Deck matrix: CY 50%,
JA 65% (balance-review flag), CB 40% (balance-review flag). `40-01-SUMMARY.md` written. No commit,
push, merge, or main update performed.

</details>

<details>
<summary>Prior resume note (superseded - Phase 39 COMPLETE; plan Phase 40 deck slice next)</summary>

**Phase 39 (Gandoe/Michelle "The Box" synergy) is COMPLETE (2/2 plans).** Plan 39-01 added the
RED browser + engine repro specs. Plan 39-02 wired both directions in `src/abilities/questLogic.js`:
Michelle Tough Gamble rolls 5-6 grant `mosje_gandoe_destroyer` +10 MP with `allowLevelUp:false`,
and successful Physical Quests by `mosje_gandoe_destroyer` gain +15 MP while Michelle is on field.
The partner quest synergy helper now accepts the questing Mosje card id and supports an optional
`appliesTo` scope so the Gandoe/Michelle Physical Quest bonus does not accidentally apply to
Michelle. Bot quest-risk prediction now passes the Mosje card id into the same helper.

**Verification:** node --check clean on touched runtime files; `npm test -- gandoe-michelle-synergy`
**6/6 GREEN**; `npx playwright test tests/ui/cards/gandoe-michelle-synergy.spec.js` **4/4 GREEN**;
full `npm test` **676/676**; `npm run lint` clean exit with existing warnings only; `npm run
test:cards` completed with the 2 known unrelated card-test failures (`mosje_amplifier`, `mosje_binti_creator`);
`npm run test:sim` completed **154/160**, 0 crashes observed, 3.75% timeout/click-overlay failures.
Deck matrix regenerated: GM Gandoe & Michelle finished 23-17 / 57.5%, below the 60% UAT balance
flag threshold. `39-02-SUMMARY.md` written. No commit or push performed.

</details>

<details>
<summary>Prior resume note (superseded - Phase 38 COMPLETE; roadmap reprioritized into a Deck Completion Track)</summary>

## ▶ RESUME HERE (2026-07-18 handoff — Phase 38 COMPLETE; roadmap reprioritized into a Deck Completion Track)

**Next command:** `/gsd:plan-phase 39` (Gandoe↔Michelle synergy — the next deck-completion item).

**Phase 38 (Alyssa↔Jisca synergy) is COMPLETE (2/2 plans).** Plan 38-02's engine wiring — which
had been left uncommitted mid-flight when the prior session hit its chat limit — was verified and
committed this session (`d9a3eda`). `applyAlyssaJiscaPiecieBonus` + the start-of-turn Alyssa +10
loop in `src/engine/turnManager.js` consume `hasAlyssaJiscaSynergy`: each Alyssa gains +10 MP at
turn start while Jisca is on field (D-02), and the first Piecie played each turn grants Jisca +10 MP
once-per-turn while an Alyssa is present (D-03, hooked in playPiecie + activatePiecie, per-turn flag
re-armed in startTurn). The repro spec `tests/ui/cards/alyssa-jisca-synergy.spec.js` flipped
RED→GREEN and was retitled/cleaned as the permanent regression guard.
**Verification:** node --check clean; `npm test` **670/670**; repro spec **2/2 GREEN**; Ronald Kip
stacking pass (ownΔ=50); full `npm run test:sim` **153/160, 0 crashes, 4.4% timeout** (the 7 failures
are pre-existing #reward-overlay/click timeouts on the archived original decks, unrelated).

**MAJOR REPRIORITIZATION (2026-07-18):** Gandoe pivoted to "which of the 5 duo decks are actually
fully functional?" A code-level audit (`.planning/audits/2026-07-18-five-deck-functional-audit.md`)
found every deck card is *wired*; the real gaps are 6 dead/divergent cards, and most of Phase 39's
original scope touches cards in NO player-facing deck. Roadmap re-sequenced into a **Deck Completion
Track** (banner atop ROADMAP.md's 38–45 block): **38 → 39 → 40-deck-slice → 41 → 43.** Phase 39
narrowed to Gandoe↔Michelle only; Phase 40 tagged to do its 3 deck Mosjes (Chris, Jisca, Coert
KasteLuck) first; non-deck cards deferred. Deep behavior-vs-text pass on the 32 wired deck Piecies
deferred until the known gaps close. See memory [[deck-completion-track]]. Commits this session:
`d9a3eda` (38-02 wiring), `070d3f7` (roadmap + audit).

</details>

<details>
<summary>Prior resume note (superseded — Phase 38 Plan 01 COMPLETE, Plan 02 next)</summary>

**Next command:** `/gsd:execute-phase 38` (resumes with Plan 38-02 — engine wiring — once planned)
or `/gsd:plan-phase 38` if 38-02 isn't broken out yet.

**Plan 38-01 (repro-first foundation) is COMPLETE (3/3 tasks).** Executed sequentially on
`plan/phase-38-alyssa-jisca-synergy` (no worktree). Per CLAUDE.md's reproduce-first rule:
`tests/ui/cards/alyssa-jisca-synergy.spec.js` was written and confirmed RED on current code
(Scenario A — Alyssa's +10/turn while Jisca is on field, D-02 — delta measured 10 instead of the
expected 20; Scenario B — Jisca's +10 on the first Piecie played each turn while an Alyssa is on
field, D-03 — deltaFirst measured 0 instead of the expected 10), proving both halves of the
`DUO_JISCA_ALYSSA` starter deck's headline synergy are still live no-ops. `synergyEffect` text was
then set on all 3 duo cards (`mosje_alyssa_bulldozer`, `mosje_alyssa_fissa`, `mosje_jisca`,
convention-compliant, no cost-discount language per D-04) and `hasAlyssaJiscaSynergy(gameState,
playerId)` was added to `src/engine/synergyResolver.js`, modeled on `hasFoodDoubleSynergy` — pure
detection reuse via `hasSynergy`, no new slot-iteration logic. The browser repro spec is
**intentionally still RED** — engine wiring (consuming the new helper to actually apply the MP) is
deferred to Plan 38-02, not part of this plan.

**Verification:** `node --check` clean on all touched runtime files; `npm test` **670/670** (664
baseline + 6 new `hasAlyssaJiscaSynergy` unit tests, 0 regressions); `npm test -- synergy-text-clarity`
3/3 green; `npx playwright test --project=cards tests/ui/cards/alyssa-jisca-synergy.spec.js` 2/2
**RED as expected** (this is the plan's success criterion, not a bug — see
`.planning/phases/38-alyssa-jisca-synergy-design-and-implementation-design-wire-t/38-01-SUMMARY.md`).

</details>

<details>
<summary>Prior resume note (superseded — Phase 37 COMPLETE, both plans done)</summary>

**Next command (superseded):** `/gsd:verify-work 37` (optional UAT), or pick the next phase. Phase 37 is fully
closed out.

**Phase 37 (General Quest attempt affordability gate) is COMPLETE (2/2 plans).** Both executed
sequentially on the branch. The General-Quest single-Mosje self-destruct is closed: the
`if (gqSlots.length > 1)` branch at `src/main.js:1525-1528` was collapsed so the single-Mosje path
also routes through `showMosjeSelect`, which always shows and already disables `mp < 20` quest
options (green/red label). `src/abilities/questLogic.js` left byte-for-byte unchanged, preserving
the multi-Mosje picker (D-04) and Personal-Quest path (D-05). The 20 MP fee + its canonical
lethality (phase0-rulings.md:126) are unchanged — this phase added only the pre-attempt gate.

**Verification (full MP-gate sequence, final committed tree):** `node --check` clean; `npm test`
**664/664**; `npm run test:cards` clean (2 pre-existing unrelated `mosje_amplifier`/`mosje_binti_creator`
failures, Ronald Kip stacking passes); `tests/ui/general-quest-affordability.spec.js` **3/3**
(repro proven RED on pre-fix code — single Michelle @10 MP driven to 0/defeated — then GREEN after
the fix); `npm run test:sim` **149/160, 0 crashes across all 160 games**, 6.9% timeout (the 11
failures are `#reward-overlay` timeouts on slow seeds, identical to Phase 36's baseline).

**Phase 36 UAT tests 2–6 (cost chips, Welloe Force picker, affordability block, Delluft/Dierenasiel
text) remain pending** — resume anytime with `/gsd:verify-work 36`.

<details>
<summary>Prior resume note (superseded — Plan 37-01 complete, 37-02 next)</summary>

**Next command (superseded):** `/gsd:execute-phase 37` (resumes with Plan 37-02, wave 2, depends on 37-01 — MP-gate phase verification).

**Plan 37-01 (wave 1 — repro-first fix, GATE-01/02/03) is COMPLETE.** Executed sequentially
on the branch (no worktree). Per CLAUDE.md's reproduce-first rule: `tests/ui/general-quest-affordability.spec.js`
was written and confirmed FAILING on pre-fix code (Test A: single Mosje at 10 MP attempting
`quest_leap_of_faith` was driven to 0 MP instead of staying at 10 — the live Michelle
Phase-36-UAT self-destruct repro), committed (`1c647b9`), THEN the fix was applied
(`0701c79`): collapsed the `gqSlots.length>1`/`else` branch at `src/main.js:1525-1528` so
the single-Mosje General-Quest path also routes through the existing `showMosjeSelect`
picker, which already disables `mp < 20` options (D-02/D-03) — closing the gap without
any new gate code. `getGeneralQuestBlockReason`/`canAttemptGeneralQuest`
(`src/abilities/questLogic.js`) confirmed byte-for-byte unchanged (D-04 preserved — the
multi-Mosje picker is untouched). Test C (Personal-Quest single-Mosje regression, D-05)
was already green pre-fix — no `src/` change needed there, confirming the Personal path
was already correctly gated. Full spec now 3/3 passing; `npm test` 664/664, 0 regressions.
`.planning/phases/37-.../37-01-SUMMARY.md` written; `ROADMAP.md` updated (Phase 37 now
"In Progress", 1/2 plans).

**Plan 37-01 unblocks Plan 37-02** (MP-gate phase verification — Ronald Kip stacking test,
full `npm run test:sim`, node --check, docs sync), which depends only on 37-01's fix having
landed.

</details>

<details>
<summary>Prior resume note (superseded — Phase 37 was 'ready to execute', 0 plans done)</summary>

**Next command (superseded):** `/gsd:execute-phase 37`.

**Phase 37 (General Quest attempt affordability gate) is fully planned — 2 plans, 2 waves,
plan-checker PASSED, coverage gates green (D-01..D-06 6/6, GATE-01..04 all covered).** Skipped
research (small well-scoped bugfix, code paths already verified in CONTEXT.md). UI-SPEC generated +
approved 6/6 (reuses the existing showMosjeSelect green/red affordability-disable convention — no
new visual surface). Pattern mapper confirmed everything needed exists in-repo.

**Chosen fix mechanism (planner's D-06 discretion call):** collapse the `if (gqSlots.length > 1)`
branch at `src/main.js:1525-1528` so the single-Mosje General-Quest path ALSO routes through
`showMosjeSelect` — which always shows regardless of Mosje count and already disables `mp < 20`
quest options (green/red label). The planner deliberately did NOT add an affordability reason to
`getGeneralQuestBlockReason`/the upstream `main.js:1245` gate, because that gate evaluates
`getFirstActiveMosje` BEFORE slot selection — an mp<20 check there would wrongly block the whole
quest when the first Mosje is poor but another could afford it (a D-04 regression). 37-01 asserts
`questLogic.js` stays byte-for-byte unchanged. 20 MP fee + its canonical lethality
(phase0-rulings.md:126) are preserved — this phase adds ONLY the pre-attempt gate.

**Plan waves:** 37-01 (wave 1, GATE-01/02/03) — Task 1: failing-first Playwright repro spec
(`tests/ui/general-quest-affordability.spec.js`, single Michelle @10 MP attempting a 20-MP quest
must fail/knockout on current code); Task 2: collapse the single-Mosje branch onto showMosjeSelect
(make spec pass); Task 3: Personal-Quest regression test (already gated via unconditional
showMosjeSelect at main.js:2701 — verify, no code change). 37-02 (wave 2, GATE-04, depends 37-01) —
MP-gate phase verification: node --check, npm test, Ronald Kip stacking test, repro spec, full
`npm run test:sim` (0 crashes / <25% timeout; redirect to file, don't tail), docs sync.

**Phase 36 UAT tests 2–6 (cost chips, Welloe Force picker, affordability block, Delluft/Dierenasiel
text) remain pending** — resume anytime with `/gsd:verify-work 36`.

<details>
<summary>Prior resume note (superseded — Phase 37 was 'ready to plan')</summary>

**Next command (superseded):** `/gsd:plan-phase 37` (General Quest attempt affordability gate —
context locked in `37-CONTEXT.md`).

**Phase 36 UAT (partial):** cold-start test passed; a live-play finding spun off **Phase 37**.
During the Phase 36 UAT smoke test, Michelle (10 MP, sole Mosje) attempted a 20-MP General Quest
and self-destructed. Investigation confirmed this is PRE-EXISTING (not a Phase 36 regression): the
20 MP quest-attempt fee + its lethality are canonical (`phase0-rulings.md:126`). The gap is that
the human UI has no affordability gate on the **General Quest single-Mosje path**
(`main.js:1525-1528` bypasses the picker → `showQuestPreviewThenRoll` charges 20 with no check).
The multi-Mosje picker (`showMosjeSelect`) and Personal Quests already disable unaffordable Mosjes.
A second UAT observation (Sleutelpuntje "+2 didn't work / dice showed 1+1") was investigated and is
NOT a bug — Sleutelpuntje is +1; "1+1" = base d6 1 + bonus 1 = 2; the "6" in console was Michelle's
separate Tough Gamble ability roll. Phase 36 UAT tests 2–6 (cost chips, Welloe Force picker,
affordability block, Delluft/Dierenasiel text) remain pending — resume with `/gsd:verify-work 36`.

**Phase 37 context locked (`37-CONTEXT.md`, commit `010346c`):** gate BOTH General + Personal
Quests (D-01); grey/disable the attempt control rather than a post-click dialog (D-02); threshold
`mp >= 20` (D-03); the multi-Mosje picker (D-04) and Personal-Quest picker (D-05) already gate
correctly — the real fix is the General-Quest single-Mosje path (D-06). Reproduce-in-browser-first
per CLAUDE.md. Resume with `/gsd:plan-phase 37`.

</details>

<details>
<summary>Phase 36 closeout (superseded resume note)</summary>

**Phase 36 is fully closed out — no remaining work in this phase.**

</details>

**Plan 36-04 (wave 3 — docs sync + full phase-gate verification) is COMPLETE. Phase 36 is
COMPLETE (4/4 plans).** Executed sequentially on the branch (no worktree). Applied Plan 36-03's
recorded `trim-and-defer-todo` decision: `src/data/places.js` — `place_delluft`'s vacuous
"SUBSTANCE Piecies cost 0 MP this turn" clause dropped (real draw-1 function untouched);
`place_dierenasiel`'s text replaced with an honest `"Passive: currently no mechanical effect."`
New pending todo `.planning/todos/pending/2026-07-16-dierenasiel-real-mechanic-needed.md` flags a
future phase to design Dierenasiel a real passive mechanic. `docs/card-reference.md` brought fully
current: Cost column corrected to `free`/`free, lvl N+` for all Piecie/Snelle Piecie rows this
phase touched, `welloe-force`'s Summary rewritten to describe the tribute-payer picker +
affordability gate, Delluft/Dierenasiel rows + 3 cross-referencing summary lines updated — `grep
-c "deferred to Phase 36"` now returns 0.

**Full phase-gate verification (all of 36-01+36-02+this plan's changes, combined):** `node
--check` clean on all 6 touched runtime files; `npm test` 664/664 passing (0 regressions);
`npm run test:cards` 51 passed / 2 failed (pre-existing, unrelated — same 2 `mosje-abilities.spec.js`
failures documented in Phase 35's `deferred-items.md`, confirmed unrelated to any Phase 36 file) /
9 skipped, Ronald Kip stacking entry passing; `npx playwright test
tests/ui/welloe-force-tribute.spec.js` 2/2 passing; `npm run test:sim` (backgrounded ~39 min per
this project's tail-buffering caution) — **149/160 passing, 0 crashes across all 160 logged
games, 6.9% timeout rate** (well under the 25% threshold; the 11 failures are all
`#reward-overlay` wait-selector timeouts on slower-resolving seeds, not crashes).
`.planning/phases/36-.../36-04-SUMMARY.md` written; `ROADMAP.md` updated (Phase 36 marked
Complete, 4/4 plans).

**Phase 36 summary (all 4 plans):** 45 of 46 previously-nonzero-`mpCost` Piecies/Snelle Piecies
corrected to `mpCost: 0` per the "text wins" convention (36-01); `piecie_welloe_force` — the sole
tribute-charging card — reworked with a player-choice-driven, affordability-gated payment
mechanism via a new reusable `showTributePayerSelect` (36-02); Delluft/Dierenasiel's now-vacuous
cost-0 text trimmed to stay honest, with Dierenasiel's real-mechanic redesign deferred to a future
phase via a tracked todo (36-03 decision + 36-04 implementation); `docs/card-reference.md` fully
synced (36-04). Zero regressions across the combined change set.

<details>
<summary>Prior handoff (2026-07-16, superseded — Plan 36-02 complete, 36-03 next)</summary>

**Next command (superseded):** `/gsd:execute-phase 36` (resumes with Plan 36-03, the
`checkpoint:decision` on Delluft/Dierenasiel text fate — wave 2, depends on 36-01, independent of
36-02).

**Plan 36-02 (wave 2 — tribute-payer picker + Welloe Force rework) is COMPLETE.** Executed
sequentially on the branch (no worktree). Added a new reusable `showTributePayerSelect` to
`src/ui/modalManager.js` (generalizes `showMosjeSelect`'s green/red MP-affordability coloring,
delegates to `showOptionSelect`, `allowCancel:false` per D-06). Reworked `effect_welloe_force`
(`src/abilities/piecieEffects.js`, TDD RED→GREEN, commits `fbb5c36`→`ec13770`) to read
`state._pendingTargets.welloeForcePayerSlot` instead of hardcoding the first active slot (D-05),
with a safe no-op guard for missing/null/defeated slots (D-06). Wired a new
`effect_welloe_force` pre-activation branch into `src/main.js`'s `handleActivatePiecie` — blocks
activation entirely (no charge, "Cannot Activate" dialog) when zero on-field Mosjes can afford
the 40 MP tribute, otherwise opens the picker and stashes the chosen payer before falling through
to `activatePiecie`. The pre-existing post-hoc redirect-target branch was left completely
untouched (diff-reviewed: 0 removed lines in `main.js`). New engine unit test
(`tests/abilities/welloe-force-tribute.test.ts`, 3/3 passing) + new Playwright spec
(`tests/ui/welloe-force-tribute.spec.js`, 2/2 passing — affordable-payer path and blocked path,
both proven live in a real browser session). Full verification: `node --check` clean on all 3
touched runtime files, `npm test` 664/664 passing (0 regressions, +3 new). Closes
36-RESEARCH.md's Critical Finding 4. `.planning/phases/36-.../36-02-SUMMARY.md` written;
`ROADMAP.md` updated (Phase 36 now 2/4 plans).

**Plan 36-02 unblocks Plan 36-04** (docs + full phase-gate verification), which now depends only
on 36-03 (Delluft/Dierenasiel decision) to complete wave 2 before its wave-3 run.

<details>
<summary>Prior handoff (2026-07-16, superseded — Plan 36-01 complete, 36-02/36-03 next)</summary>

**Next command (superseded):** `/gsd:execute-phase 36` (resumes with Plan 36-02, the
tribute-payer picker + Welloe Force rework — wave 2, depends on 36-01) and/or Plan 36-03
(`checkpoint:decision` on Delluft/Dierenasiel text fate — also wave 2, depends on 36-01, can run
in parallel with 36-02).

**Plan 36-01 (wave 1 — full audit + mpCost data corrections) is COMPLETE.** Executed
sequentially on the branch (no worktree). Full ruling audit at
`.planning/audits/2026-07-16-piecie-snelle-cost-audit.md`: 45 of 46 currently-nonzero-`mpCost`
Piecies/Snelle Piecies corrected to `mpCost: 0` (35 Piecies + 10 Snelle Piecies); only
`piecie_welloe_force` keeps its `mpCost: 40` (the sole card whose text explicitly says "Pay 40
MP..."). `snelle_blensen`'s "Free if countering a Frenssen" text was ruled `0` (no stated base
cost) but flagged explicitly for Gandoe as a judgment call, not silently resolved. Personal Quest
audit (COST-03) closed as a no-op — zero tribute language found across all 6 Personal Quests.
New regression test `tests/data/mp-cost-tribute-audit.test.ts` (TDD RED→GREEN, commits `2c0c1f3`
→ `341c0c7`) guards against future drift back to a large uncharged-cost surface. Full
verification: `node --check` clean, `npm test` 661/661 passing, diff-reviewed confirming only
`mpCost` numeric literals changed (no other field touched on any of the 45 corrected cards).
`.planning/phases/36-.../36-01-SUMMARY.md` written; `ROADMAP.md` updated (Phase 36 now "In
Progress", 1/4 plans).

**Plan 36-01 unblocks both remaining wave-2 plans:** 36-02 (Welloe Force rework + generalized
tribute-payer picker, COST-05/06) now knows for certain it's the only tribute card in scope.
36-03 (Delluft/Dierenasiel `checkpoint:decision`) can now proceed with the actual finished Piecie
ruling in hand (all 7 SUBSTANCE/PET Piecies referenced by those 2 Places confirmed `mpCost: 0`),
rather than a prediction — their "cost 0" text promises are about to become unconditionally true
regardless of the Place being active, which is exactly the question 36-03 surfaces to Gandoe.
36-04 (docs + full phase-gate verification, including the Ronald Kip stacking test + `test:sim`)
depends on all three and is deliberately last, since this plan's mpCost correction alone has zero
runtime behavior change (nothing in the engine charges `mpCost` generically today — confirmed by
36-RESEARCH.md — so the full sim re-run belongs to 36-04 once Welloe Force's actual tribute
mechanism lands in 36-02).

<details>
<summary>Prior handoff (2026-07-16, superseded — Phase 36 planned, 0 plans executed)</summary>

**Next command (superseded):** `/gsd:execute-phase 36`.

**Phase 36 fully planned this session.** Research (`36-RESEARCH.md`) substantially corrected the phase's original premise: Places (0/21) and Personal Quests (0/6) have no `mpCost` field at all, and of the 46 nonzero-cost Piecies/Snelle Piecies, only 1 (`piecie_welloe_force`, "Pay 40 MP...") states self-payment in its text — the other 44 correct to `mpCost: 0` under this project's "text wins" convention. UI-SPEC.md (approved 6/6, one non-blocking typography flag on pre-existing values) confirmed the only UI surface is a generalized `showTributePayerSelect` reusing the existing `showMosjeSelect` pattern — no new screens. 4 plans created (COST-01 through COST-09), plan-checker verification passed (3 non-blocking warnings, all fixed: a missed docs/card-reference.md line, a missing Playwright verify command, a stale VALIDATION.md sim-command reference). Decision-coverage gate initially reported 0/10 D-NN decisions covered — the gate parses `must_haves.truths` specifically, not plan body prose, so explicit `D-01`..`D-10` citations were added to plans 36-01/36-02's truths lists; gate now passes 10/10. Requirements-coverage confirmed COST-01 through COST-09 all present across the 4 plans' `requirements` frontmatter.

**Plan wave structure:** 36-01 (wave 1, no deps) — full audit + `mpCost` data corrections (35 Piecies + 10 Snelle Piecies → 0) + regression test. 36-02 (wave 2, depends on 36-01) — tribute-payer picker + Welloe Force rework (fixes hardcoded-payer and missing-affordability bugs). 36-03 (wave 2, depends on 36-01) — `checkpoint:decision` surfacing the Delluft/Dierenasiel vacuous-text question to Gandoe (not silently resolved). 36-04 (wave 3, depends on all) — applies 36-03's decision, updates `docs/card-reference.md`, runs full verification (node --check, npm test, test:cards incl. Ronald Kip, the dedicated `welloe-force-tribute.spec.js` Playwright spec, test:sim).

**Phase 35 is fully complete.** Wave 8 Task 2 (full-suite phase-gate verification) finished this session: `test:sim` was re-run fresh (the prior session's run had been cancelled mid-flight, so it wasn't trusted as a result) — **152/160 passing, 8 failures (5%), 0 crashes** across all 52 logged games, well under the 25% timeout-rate target and numerically identical to wave 7's own solo run. All other Task 2 checks (node --check, npm test 657/657, test:cards, the `skiffaDiceBonus`/`placeDiceBonus` composition assertion) were already confirmed green in the prior session. `.planning/phases/35-places-text-reconciliation/35-08-SUMMARY.md` written; `ROADMAP.md` updated (Phase 35 marked COMPLETE, 8/8 plans, 35-08 checked off).

**Nothing else changed since commits `8e18352`/`e64d5af`/`38b9f7e`** — the working tree is clean aside from pre-existing unrelated files (`.claude/settings.json`, `CLAUDE.md`, `get-shit-done` submodule pointer, `sim-deck-matrix-results.md` — all untouched by this session, leave them alone).

**Wave 7 (Drain Zone + The Void, commit `8e18352`) is done.** Removed Drain Zone's untexted +5-all-gains bonus (`mpManager.js`) and The Void's redundant `baseQuestMpBlocked` gate (`questLogic.js`); hid both cards from deck-building/boosters via new `getPlayerFacingPlaces()` (mirrors `getPlayerFacingDecks()`'s pattern) — card data/effects stay intact for any pre-existing instance. Full verification: 657/657 unit tests, `test:cards` clean (2 pre-existing unrelated failures), `test:sim` 152/160 (8 failures/5%, 0 crashes).

**Design detour, live with Gandoe:** while verifying Task 2's "zero observable change" claim, found removing `baseQuestMpBlocked` lets 2 quest-arming charges (Snoeiertje-family's `questBonusMP`, Battle Concert's redirect flag) get silently consumed during a Void-active quest, even though the MP itself is still blocked deeper. Flagged it instead of assuming; Gandoe used it to give a **full design ruling for The Void's real mechanic**: it should NOT block Quests/abilities/other Piecies at all — ONLY the *activation* (not placement) of FOOD-tagged Piecies that actually gain/restore MP (e.g. Varkenspootjes, Kannetje Melk — NOT Controller/Keyboard, and NOT Warm Kannetje Melk since that one *loses* MP). This is a full reversal of the current blanket mpManager.js block. Deferred to a future phase (safe since Void is hidden from players this same wave regardless) — captured with a starting per-card MP-direction classification table in `.planning/todos/pending/2026-07-15-the-void-real-implementation-ruling.md`.

**Wave plan:** 35-01 (PLACE-01,02) ✅ → 35-02 (03,04) ✅ → 35-03 (06,07) ✅ → 35-04 (08,09) ✅ → 35-05 (10) ✅ → 35-06 (11, Synergy Chamber) ✅ → 35-07 (05,12, Drain Zone/Void) ✅ → 35-08 (docs + full phase-gate verification — LAST WAVE). 35-VALIDATION.md sign-off is `approved`.

**Note for future sessions:** merging an execute-phase worktree branch back into the feature branch requires explicit per-request user authorization (auto-mode blocks it otherwise, even outside `main`) — ask before merging each wave. Direct commits to the feature branch (no worktree) do not hit this gate and are the simpler default when not parallelizing across subagents.

**`test:cards` + `test:sim` are not parallel-safe** — running both at once, OR leaving manual scratch Playwright browser windows open on the same dev server while running either, causes spurious failures/slowdowns unrelated to any real regression (confirmed multiple times this session). Always run them in isolation — close any manual browser windows first — or re-run solo before trusting a failure/hang.

**When running a long background command (e.g. `test:sim`, ~25-40 min this session), do NOT pipe through `tail -N`** — it buffers all output until the process exits, so the output file looks empty/stuck the entire run even though it's progressing normally. Redirect straight to a file (or let the harness capture full output) so progress is checkable mid-run.

<details>
<summary>Prior handoff (4th update, superseded — wave 6 full detail)</summary>

**Wave 6 (Synergy Chamber, commits `412ab30` + `0faacdd`) — the phase's highest-complexity card, with a `checkpoint:human-verify` gate — is done and APPROVED.** Tasks 1+2 (remove 3 dead bonuses, add the once-per-turn partner waiver) went in clean via TDD. The human-verify checkpoint then turned into an extended live session with Gandoe testing 3 seeded browser scenarios (Binti FOOD-double, Señor West + AZN Cless Physical-quest+15 from both sides of the pair), which produced real UX feedback beyond the original plan:

- Waiver button moved from a top-bar control onto the Synergy Chamber card itself (reusing the existing Activate-button pattern).
- Confusing "(50/70 MP with Coert/Binti synergy)" text removed from all 3 FOOD Piecies (Kannetje Melk, Broodje Döner, Ronald Kip).
- New gold/purple pill system added (`buildActiveModifiers`) so a live synergy bonus is visible proactively, not just inferable from an MP delta.
- Battle log now explicitly breaks out a partner-synergy quest bonus as its own line via a new transient `_questSynergyBonus` marker.
- Fixed a real pre-existing test-hook bug (`cardTypeFor` never mapped `mosje_`-prefixed ids → type `MOSJE`) and added `setActivePlace`/`setTurnNumber` test hooks for scenario seeding.
- Deeper investigation found the waiver only covers the 2 mechanisms using the shared `getActiveSynergies`/`hasSynergy` utility — Chris+Youri and Chris DDR+DJ 8020 use separate ad-hoc checks the waiver doesn't reach. Deferred to `.planning/todos/pending/2026-07-15-remaining-mosje-synergies-and-cless-teacher-fix.md`.
- Full detail in `.planning/phases/35-places-text-reconciliation/35-06-SUMMARY.md`.

</details>

<details>
<summary>Prior handoff (3rd update, superseded — waves 3-5 detail)</summary>

**Waves 3, 4, and 5 executed this session directly on the branch (no worktree isolation)** — since the auto-mode permission gate treats worktree *merges* as requiring per-request authorization even on a non-main branch, later waves this session skipped the worktree step and implemented+committed straight onto `card/full-game-text-audit`, matching how the earlier planning-phase commits were already done. TDD RED→GREEN followed for every task; full verification suite green each wave.

- **35-03 (Delluft + Dierenasiel, commit `8fabd5d`):** dropped Dierenasiel's permanently-dead +25% PET-protection clause (setter/reader typo — `dienasielActive` vs `dierenasielActive` — never matched) from all 3 files; added Delluft's first-ever regression test (behavior already correct, no code change). Had to update one pre-existing test (`stub-engine-wiring.test.ts`) that source-asserted the now-deleted `dierenasielWaiver` string existed — an expected consequence of the removal, not a regression.
- **35-04 (Coert's Caravan + Digital Gaming Stop, commit `3497d0e`):** Coert's Caravan replaced entirely (same dead `TURN_START` trigger bug as Bank Chilling — never fired live) with an end-of-turn 10 MP drain, Coert-family immune; orphaned `freePiecieActivationAvailable` consumer removed. Digital Gaming Stop's dead `questAutoSuccess` flag replaced with its real "+10 MP for an active DIGITAL-EQUIPMENT Piecie" text. Caught and fixed a self-introduced bug during implementation (clone-graph mutation-after-clone issue).
- **35-05 (Skiffa, commit `2439582`):** old "discard 1 OR lose 15 MP" text replaced with a flat +2 dice-roll bonus for Social-category quests; undocumented `getSkiffaRerolls` removed. Caught and fixed a near-miss with Tweede Kans's reroll grant sharing the same modal parameter.

</details>

**Phase 36 confirmed still unplanned (context-locked only) as of this session** — re-verified by reading `36-CONTEXT.md` directly (not from memory) mid-session per user request. Game-wide MP cost model redesign: every Piecie/Snelle Piecie/Place/Personal Quest defaults to 0 MP; tribute only where text explicitly demands it, payer chosen by the player. 0 plans executed. Phase 35's own "cost 0 MP" clauses (Dierenasiel, Delluft) are correctly deferred to Phase 36, not implemented here — confirmed consistent in 35-03's card-reference.md updates.

**Phase 36 status (unchanged, still ready):** context locked (`36-CONTEXT.md`, commit `f24e7ed`) — game-wide MP cost model redesign (every Piecie/Snelle Piecie/Place/Personal Quest defaults to 0 MP; tribute only where card text explicitly demands it). ROADMAP has Phase 36 formally `Depends on: Phase 35`, so Phase 35 executing first is the natural sequencing. Resume with `/gsd:plan-phase 36` after Phase 35 ships. Mosje ability costs (`abilityCost`) remain explicitly out of scope for Phase 36.

</details>

</details>

<details>
<summary>Prior handoff (2nd update, superseded)</summary>

**Next command:** `/gsd:discuss-phase 36`.

**Why Phase 35 is paused:** mid-research-followup on Phase 35, Gandoe proposed a bigger idea — flip the whole game's cost model so every Piecie/Snelle Piecie/Place/Personal Quest costs 0 MP by default, and only cards whose text explicitly demands "tribute" (from one named Mosje or all Mosjes, decided per-card) actually deduct MP. Cost display stays purely visual (reuse the Mosje's existing on-field MP number — no new cost-UI element). Explicitly chose to PAUSE Phase 35 (10 locked cards, not yet planned) and discuss/design this new phase FIRST, since it's a game-wide redesign, not a Places-only fix.

**Phase 35 status when paused:** research done (`35-RESEARCH.md`, commit `bc218b1`) + 3 post-research scoping decisions locked (commit `6b97aec`): PLACE-06/07 build a scoped self-charge-then-waive for the specific named Piecies (not a game-wide charge); PLACE-05 (Drain Zone) and PLACE-12 (The Void) are DESCOPED — hidden from all player-facing pools instead of implemented, with their untexted dead-code bugs still cleaned up. Nothing planned/executed yet. Resume with `/gsd:plan-phase 35` once Phase 36 is designed (Phase 36 now formally depends on Phase 35 in ROADMAP.md, so finish 35 first, or re-sequence if that dependency direction turns out to be backwards after discussion).

**Phase 36 (NEW, added this session):** ROADMAP entry added (`.planning/ROADMAP.md`), goal/requirements TBD — needs `/gsd:discuss-phase 36` before planning. Core idea: mpCost fields already exist as data (`src/data/piecies.js` etc.) but are never charged anywhere in the engine (confirmed by Phase 35's research — see `35-RESEARCH.md` Critical Finding 1); this phase would build the actual charging mechanism, default it to 0, then go card-by-card to decide which ones require tribute and from whom.

</details>

<details>
<summary>Prior handoff (superseded, kept for history)</summary>

**Next command:** `/gsd:plan-phase 35` (was at the research gate — user deferred the research decision to a fresh chat).

**What shipped to main earlier today:** the 10-ruling ability-text/engine reconciliation (Ming, Jeffrey, Chris ×2, Jisca, Tuk, Coert KasteLuck, FPS Coert, + Kastelein/Drainer hidden). Merged (`0618941`), version bumped to `ability-text-reconciled` (`c80683c`), pushed + deployed live (verified). 613 unit tests green.

**Phase 35 state (on branch `card/full-game-text-audit`):**

- Round 1 = **Places** audit DONE. All 21 audited: 9 clean, **12 flagged and RULED** interactively with Gandoe.
- Ruling record: `.planning/audits/2026-07-14-places-text-audit.md` (per-card divergence + ruling + file:line reuse targets). **Read this first.**
- Context: `.planning/phases/35-places-text-reconciliation/35-CONTEXT.md` (D-01..D-12).
- ROADMAP Phase 35 added (PLACE-01..12).
- Nothing implemented yet — plan-phase → execute-phase next.
- ⚠ 2 novel mechanics need care: **The Void** (only 1 card-activation per turn — new cross-cutting cap, do LAST) and **Synergy Chamber** (once/turn use a synergy ability without its partner).
- Corrected a stale assumption this session: **gsd-sdk IS installed** (v1.42.3) and a Piecie **mpCost system exists** — the Coert's Caravan todo's "no MP-cost concept" claim was false and has been fixed.

**Deferred (not Phase 35):** audit rounds 2+ (Piecies/Snelle/remaining Mosjes), Alyssa↔Jisca synergy design.

</details>

</details>

</details>

---

**(prior)** Phase 34 COMPLETE — Account Starter-Deck Onboarding & Active Deck — branch feature/phase-34-starter-deck-onboarding (merged to main).

> Note: STATE.md was not maintained during Phases 15–17 (tracked in their phase dirs / ROADMAP only). This header jumps from Phase 14 to Phase 18. Phase 33 (deckout recycle notice + deck-pile/board polish, merged via PR #2/#3) and the 5-duo-starter-deck data commit also landed on main without a STATE.md entry — tracked only in ROADMAP.md and their own commit history.

## Accumulated Context

### Pending Todos

- 2026-07-12-alyssa-jisca-synergy-design.md — DUO_JISCA_ALYSSA's headline synergy is declared but has no effect text and no implementation; needs full design session.
- 2026-07-12-ability-text-engine-reconciliation.md — 9 Mosje ability texts diverge from engine behavior; rule text-vs-code per card (AZN Cless precedent). READY TO IMPLEMENT 2026-07-13: all 10 rulings finalized (9 original + Chris DDR), full reuse-pattern map written into the todo file itself, suggested implementation order included. Nothing coded yet — start fresh session with Ming Natural.
- 2026-07-13-coerts-caravan-binti-discount-mismatch.md — Coert's Caravan (Place) text promises a Binti Piecie MP-cost discount the code never implemented; found incidentally during the 9-Mosje reconciliation.
- 2026-07-13-full-game-ability-text-audit.md — systematic text-vs-code pass needed across ALL Piecies/Places/remaining Mosjes, not just the 9 already flagged; triggered by the Caravan find above.
- 2026-06-11-ts-bulldozer-comeback-reconcile.md (pre-existing)
- 2026-07-16-dierenasiel-real-mechanic-needed.md — Dierenasiel's `effect_dierenasiel` is a confirmed full no-op (both its prior clauses removed as dead/vacuous across Phase 35 + Phase 36); needs a real passive mechanic designed in a future phase.

### Roadmap Evolution

- Phase 32 added (2026-06-14): On-field Mosje Info + Quest Dice Modal Redesign — own on-field Mosjes show Level/traits/ability + active-only synergy on card, remove "Active on field" text, full dice-modal redesign. UI-only.
- Phase 32 extended (2026-06-20): win-clarity UX added on the same branch — instant Level-3 win (engine), plain-language win/defeat reason + battle-log recap in the end screen, "How to Win" panel, dice-modal Mosje stats.
- Phase 34 added (2026-07-03): Account Starter-Deck Onboarding & Active Deck — turns the 5 duo starter decks into the backbone of account onboarding: blocking first-login deck picker, exact-multiset card grant, active-deck concept + lobby switcher, duo-only guest dropdown, duo-only bot pool.
- Phase 37 added (2026-07-16): General Quest attempt affordability gate — block attempting a General Quest when the chosen Mosje can't afford the 20 MP attempt fee (mirror Phase 36's Welloe Force affordability gate). Surfaced during Phase 36's UAT: a Mosje at 10 MP could attempt a 20-MP quest and self-destruct. The 20 MP fee + lethality are canonical (phase0-rulings.md:126); this phase adds only the *attempt gate* the ruling permits. NOT yet discussed/planned.
- Phase 46 completed (2026-07-19): Thematic Piecie Cards for Specific Mosjes — added Loaded Dice, Boosterpackkie, Perfect Rhythm, and Dikke Plaat as booster-only UTILITY Piecies; documented Coert Hawaiian Tech Savant's existing Keyboard fit; kept Coert Kast-elein hidden and Chris All-Rounder without a dedicated item. Focused/full validation passed; browser and simulation baseline caveats are recorded in `46-01-SUMMARY.md`.
- Phases 38–45 added (2026-07-18): **backlog-review sweep** — promoted the 8 pending `.planning/todos/pending/` items into sequenced ROADMAP phases (card-fidelity theme). All independent except Phase 42. NONE discussed/planned yet.
  - **38** — Alyssa↔Jisca synergy design + implement (DUO starter deck's null headline mechanic). Source: `2026-07-12-alyssa-jisca-synergy-design.md`.
  - **39** — Remaining unwired Mosje synergy pairs + Cless Teacher/AZN Cless fix. Source: `2026-07-15-remaining-mosje-synergies-and-cless-teacher-fix.md`.
  - **40** — 9-Mosje ability-text↔engine reconciliation (per-card rulings, no batch-fixing). Source: `2026-07-12-ability-text-engine-reconciliation.md`.
  - **41** — Coert's Caravan Binti-discount fix (standalone quick fix, already diagnosed). Source: `2026-07-13-coerts-caravan-binti-discount-mismatch.md`.
  - **42** — Full-game ability-text-vs-engine audit (all card types). **Depends on Phase 40.** Source: `2026-07-13-full-game-ability-text-audit.md`.
  - **43** — Dierenasiel real mechanic ruling (confirmed no-op). Source: `2026-07-16-dierenasiel-real-mechanic-needed.md`.
  - **44** — The Void real implementation ruling. Source: `2026-07-15-the-void-real-implementation-ruling.md`.
  - **45** — TS Bulldozer Comeback reconciliation. Source: `2026-06-11-ts-bulldozer-comeback-reconcile.md`.

## Phase 34 Progress — Account Starter-Deck Onboarding & Active Deck (COMPLETE)

Branch: `feature/phase-34-starter-deck-onboarding` — 3 plans executed sequentially (data → onboarding modal → lobby rewiring), checker-verified before execution, all green after.

### 34-01: Data + storage foundation (COMPLETE)

- `src/data/playerFacingDecks.js` — `getPlayerFacingDecks()`, an explicit whitelist of the 5 duo decks (DUO_COERT_BINTI, DUO_GANDOE_MICHELLE, DUO_CHRIS_YOURI, DUO_JISCA_ALYSSA, DUO_WEST_CLESS). Single shared accessor so onboarding modal, guest dropdown, and bot pool can never drift out of sync; the 3 original decks (PHYSICAL_FORCE/DIGITAL_CONTROL/ARTISTIC_RHYTHM) stay in `STARTER_DECKS` untouched as bot/test fixtures, just never shown to players.
- `src/multiplayer/expandDeckToCardIds.js` — pure multiset expander (mosjes+piecies+snellePiecies+places+quests, duplicates preserved).
- `src/multiplayer/resolveActiveDeck.js` — pure resolver: activeDeckId → matching deck, else first deck, else null (migration-safe default).
- `src/multiplayer/claimStarterDeck.js` — saveDeck + setActiveDeckId + `addCardsToCollection` with the deck's EXACT multiset (never `seedCollection`, which only grants 1-of-each) — a claimed starter deck is fully rebuildable in the deck builder.
- `userStore.js` — added `getActiveDeckId(uid)` / `setActiveDeckId(uid, deckId)` at `users/{uid}/profile/activeDeckId`.
- `accountSetup.js` — removed the stale `DIGITAL_CONTROL_STARTER_CARDS` auto-seed (had drifted to nonexistent card IDs); new accounts get no cards until they pick a starter deck.

### 34-02: Blocking onboarding modal (COMPLETE)

- `src/ui/onboardingDeckPicker.js` — built on the existing generic `modalManager.showOptionSelect` (`allowCancel:false`), not a bespoke modal, per the project's reusable-selection-modal rule.
- Wired into the lobby's auth-gate handler (extracted to `handleLobbyAuthChange`): a signed-in, non-anonymous user with 0 saved decks blocks on the picker before reaching the lobby; picking calls `claimStarterDeck`.
- `?testOnboarding=1` param-gated test hook drives the real modal DOM with a stubbed claim (no Firebase) — the committed Playwright-testing path, not a fallback.

### 34-03: Lobby rewiring (COMPLETE)

- `src/bot/pickBotDeck.js` — pure true-random pick from `getPlayerFacingDecks()` (mirror allowed), extracted to its own file so it's unit-testable (main.js has import side effects).
- `src/ui/activeDeckPanel.js` + lobby wiring — signed-in users: `#deck-select` hidden, active-deck panel shown (deck name + Mosjes) with a "Change deck" button opening a switcher modal (same `showOptionSelect` pattern) that persists via `setActiveDeckId` and re-renders the panel.
- Guest (anonymous) users: `#deck-select` now populated dynamically from `getPlayerFacingDecks()` — exactly 5 duo options, no originals.
- All hardcoded `'DIGITAL_CONTROL'` player-facing fallback defaults removed (main.js ~124, ~397) → default to `getPlayerFacingDecks()[0].id`.
- `?testActiveDeck=1` / `?testGuestDeck=1` param-gated hooks give the switcher and guest dropdown live Playwright coverage (mandatory, not optional — closes the "setActiveDeckId → reflected in UI" proof that a Firebase-mocked unit test can't provide).

### Verification (final, all green)

- `node --check` clean on every touched runtime/UI file.
- `npm test`: 469/469 (up from 464 baseline; +5 new: duo-deck validity, player-facing-list, expander, resolver, claim helper).
- Playwright: 7/7 — `onboarding-starter-deck.spec.js` (3) + `active-deck-lobby.spec.js` (4).
- `tests/ui/cinema/starter-deck-onboarding-cinema.spec.js` — narrated 5s-beat walkthrough of all 4 new screens (regression/demo, not part of the pass/fail gate above but kept in the suite).
- Bot-vs-bot sim (30 games, run for the *separate* bot-safety-margin change but exercising this branch's `pickBotDeck` too): 0 crashes.

### Decisions

- Deck onboarding is one-time: pick exactly one duo deck; more decks only via the deck builder + booster packs. No shop, no claiming multiple starters (explicit user decision).
- Originals (PHYSICAL_FORCE/DIGITAL_CONTROL/ARTISTIC_RHYTHM) are never deleted from data — only filtered out of player-facing surfaces — so the pre-existing test suite (8+ files hardcoding those IDs) needed zero changes.
- Bot deck selection is true-random over the duo pool, mirror matches allowed (explicit user decision, differs from the old "never mirror the human's deck" behavior).
- Phase 38-01: opponent-field "harmless" test scenarios use a zero-piecie custom bot deck plus `mockDiceRoll(page, 0)` instead of nulling both opponent Mosje slots — nulling both would trip `victoryChecker.js`'s KNOCKOUT check (`activeSlots.every(slot => slot === null || slot.isDefeated)` is vacuously true for an all-null array) and end the game before the turn-boundary MP comparison could run.

## Phase 32 Progress — On-field Mosje Info + Quest Dice Modal + Win Clarity

### 32-WIN: Instant Level-3 win + legible end screen + win conditions (COMPLETE — commit a3fe3b3)

- resolveQuest now calls checkVictory → reaching Level 3 declares the win in the SAME action (was deferred to end-of-turn, which let Mosjes overshoot to Level 4)
- checkLevelUp caps level at 3 (`while mp>=100 && level<3`): leftover MP is kept and shown (Lv2/90 + 80 → Lv3/70); level can never reach 4
- describeWin(): raw win enum → plain-language sentence with context (e.g. "Knockout — all of Bot's Mosjes were defeated (last to fall: Binti)"); surfaced in the battle log + reward overlay; `data-win-reason` attribute added for tooling/sims
- Reward overlay embeds the colour-coded battle log + Copy Log button (review the match before returning to lobby)
- Deduped the 13 inline raw-enum "Match Finished" popups into one idempotent handleGameOver (gameOverHandled guard)
- "How to Win" top-bar panel listing the 4 win conditions (Reach Level 3, Knockout, Quest Master, Momentum Domination)
- Dice-roll modal shows the attempting Mosje's stats (level, MP, trait stars; the rolled trait highlighted)
- New tests/engine/instant-win-level3.test.ts (failing-first repro); rewrote the mislabeled full-game LEVEL_3 spec into a real instant-win + battle-log guard
- Verification: node --check clean; 430 unit tests; full-game + chain UI specs green

### Decisions

- Only quests can reach Level 3 (non-quest gains pass `allowLevelUp:false`, capped at 100) — so resolveQuest + the Perfect Sync UI gain are the only level-up surfaces to guard
- Leftover MP is kept on a Level-3 win per user ruling; the win modal fires instantly so the value never lingers on the board
- handleGameOver made idempotent (gameOverHandled) so multiple FINISHED-detection paths can't stack two overlays
- Battle log reuses the global `.log-row` styling inside the overlay; Copy Log exports chronological order (oldest→newest)
- Scratch prototypes (_play32.html, _dice-anim-demo.html, _dice-modal-demo.html) deleted after the dice-modal work landed in the real game

## Phase 23 Progress — Graveyard System

### 23-02: UI rename — showGraveyardModal + board label + card descriptions + docs (COMPLETE)

- showGraveyardModal (was showDiscardViewerModal): reads player.graveyard, header "Graveyard"
- boardRenderer: label.textContent='Graveyard'; reads player.graveyard
- main.js toBoardViewModel: graveyard: player.graveyard; calls showGraveyardModal
- piecies.js, snellePiecies.js: "discard pile" -> "Graveyard" in card descriptions
- developer-handoff.md: Graveyard System section added
- 912 tests passing (0 failures)

### 23-01: Graveyard data layer — graveyardUtils + eliminate welloe + fix revival cards (COMPLETE)

- Created graveyardUtils.js: toGraveyardEntry, addToGraveyard, getGraveyardByType (pure functions)
- markMosjeDefeated: single push to player.graveyard with type:MOSJE, source:defeated (no welloe)
- effect_mosje_reborn: reads from getGraveyardByType(player, 'MOSJE') — no player.welloe
- effect_call_of_welloes: reads mosjeEntries from getGraveyardByType — no player.welloe
- confirmCallOfWelloes: splices from player.graveyard by cardId+type='MOSJE'
- effect_klaar_met_jou: fixed silent hand.pop() → splice + addToGraveyard
- effect_those_eyelashes: fixed silent hand.shift() → splice + addToGraveyard per opponent
- player.discard → player.graveyard renamed across all engine/abilities JS files
- TDD RED-then-GREEN: a6cb720 RED → ed7dfc5 GREEN
- 912 tests passing (0 failures)

### Decisions

- player.graveyard is the single destination for all defeated/discarded/destroyed cards
- addToGraveyard returns new state via spread — no mutation (immutable reducer pattern enforced)
- TS declarative registry files (src/engine/reducers/) left unchanged — separate system

## Phase 22 Progress — Call of the Welloes

### 22-05: Bidirectional destroy — gap closure (COMPLETE)

- Replaced D-17 block: piecieSlots[pIdx] nulled + discard.push(slot.cardId) in same markMosjeDefeated call
- Tightened findIndex: match both cardId === 'piecie_call_of_welloes' AND linkedMosjeCardId === mosje.cardId
- Updated test K: accept null slot (slot gone = link cleared)
- Added test L: confirms piecieStillOnField false + piecieInDiscard true
- TDD RED-then-GREEN: eced576 RED → 33bf6eb GREEN
- 896 tests passing (0 failures)

### 22-04: Mechanic revision — gap closure (COMPLETE)

- Removed returnMosjeToWelloe (wrong silent-return function from Wave 1)
- confirmCallOfWelloes: summons at Level 1, 50 MP unconditionally (NOT restored stats)
- endTurn Piecie persistence guard: piecie_call_of_welloes NOT swept while linkedMosjeCardId is live
- endTurn defeat-on-sweep: markMosjeDefeated replaces returnMosjeToWelloe call (isDefeated=true, discard entry, victory check)
- markMosjeDefeated: clears linkedMosjeCardId on Piecie slot after defeat (D-17)
- piecies.js description corrected: "Level 1, 50 MP ... summoned Mosje is also defeated"
- TDD RED-then-GREEN: f091ee6 RED → b872ce1 GREEN
- 895 tests passing (0 failures)

### 22-02: effect_call_of_welloes + confirmCallOfWelloes + description fix (COMPLETE)

- Cancel-guard + pending-flag activation: effect_call_of_welloes (empty-welloe / no-free-slot guards + _callOfWelloesPending)
- Stat-restoring summon executor: confirmCallOfWelloes (mp/level/traits/statusEffects restored from welloe record)
- Dual tracking: summonedByPiecie on activeSlot + linkedMosjeCardId on piecieSlot
- Description fix in piecies.js: "restoring its MP and Level" replaces "Level 1, 0 MP" stub text
- TDD RED-then-GREEN: 5 new tests (778ad4f RED → cab6ac3 GREEN)
- 896 tests passing (5 new); simulation 100 games 0 crashes

### 22-01: returnMosjeToWelloe + endTurn sweep (COMPLETE)

- Engine return-path primitive: `returnMosjeToWelloe` exported from turnManager.js
- Deep-clone helper: pushes archived mosjeSlot (minus summonedByPiecie) to welloe[], nulls activeSlot
- No defeat side-effects: no isDefeated, no discard entry, no checkVictory
- endTurn sweep: after piecieSlots sweep, iterates activeSlots for summonedByPiecie === 'piecie_call_of_welloes'; returns Mosje when anchor Piecie absent, leaves in place when present
- TDD RED-then-GREEN: 5 new tests (e77caf7 RED → ba07463 GREEN)
- 891 tests passing (5 new); simulation 100 games 0 crashes

### Decisions

- Sweep reassigns `state` via `let` (endTurn already declares let state) — no inline mutation needed
- returnMosjeToWelloe uses `delete archived.summonedByPiecie` before push — clean archive
- confirmCallOfWelloes reads stats directly from welloe record (no savedState wrapper) — consistent with Wave 1 archive design
- No checkVictory in confirmCallOfWelloes — summon is not a victory-affecting event
- Replaced old effect_call_of_welloes stub (Mosje Reborn passthrough) with real implementation

## Phase 21 Progress — Quest Behaviors + Cleanup

### 21-01: Quest behaviors (C) + dead-code/doc cleanup (A) (COMPLETE)

- Bucket C — data-driven quest behaviors via static quest-def fields read by `resolveQuest`:
  - `drawOnSuccess: 2` on quest_artistic_expression + quest_late_night_questing → resolveQuest draws N deck→hand on success (FRESH state, placed after the MP block)
  - `opponentLoseMP: 30` on quest_elimination_challenge → loseMP on opponent's first active Mosje on success, gated on `!baseQuestMpBlocked` (The Void skips it)
  - quest_req_hack_mainframe id fix: Hacker/FPS −1 threshold now checks `cardId` (was the always-undefined `mosjeId`)
- Bucket A — deleted dead `effect_jensen` + `effect_lucky_coin` from snelleEffects.js (no card referenced them); removed their blocks from the unrun `tests/cards/test-snelleEffects.js` (kept the file — it has live-effect tests); refreshed stale card-reference.md rows (Geen Raad + Huisbaas now implemented; dropped DEFERRED notes on the 4 wired quests)
- 11 new tests; 867 total; sim 100 games 0 crashes

### Decisions

- resolveQuest draw/elimination reference the FRESH `state.players[playerId]`, not the stale `player` from the top of the function (gainMP/loseMP reassign `state`)
- Kept test-snelleEffects.js (a `.js` file vitest doesn't run) rather than delete — it holds meaningful live-effect tests; only removed the two dead-stub blocks
- Left FPS West / Ronald Chef (STUB-16) doc status unchanged — their blockers are genuine UI primitives, out of this engine phase's scope

## Phase 20 Progress - Leipe Swap

### 20-01: Leipe Swap temporary MP double-swap (COMPLETE)

- Reworked the old unused swap Piecie into `piecie_leipe_swap`: free, level 1+, booster-only, rarest tier `★★★★` (not a new 5-star category), persists until end of turn.
- Browser/imperative path: activation modal picks one own Mosje and one opponent Mosje; `effect_leipe_swap` swaps only `mp` by direct assignment and stores `_leipeSwap`.
- End-turn path: `endTurn` swaps the two recorded slots' current MP back on the swapper's turn and clears `_leipeSwap`; levels banked mid-turn stay.
- Rarity cap: `RARITY_COPY_LIMITS["★★★★"] === 1` (★★★★ already caps at 1 per deck).
- Declarative registry twin renamed to `leipe-swap.ts` with new identity and no-op effects because the TS executor has no interactive double-swap primitive.
- Old Emergency Swap references removed from `src/`, `tests/`, and `docs`.
- Verification: 856 tests passing; simulation 100 games, 0 crashes / 0 timeouts.

## Phase 19 Progress — UI-Modal Card Completions

### 19-01: FPS West Tactical Analysis — guess game (COMPLETE)

- Reworked into a Geen Raad-style guess: pick an opponent hand card, guess its type; correct +70 MP / wrong −20 MP, routed through gainMP/loseMP (visible/logged)
- Removed the dead `opponentHandPeeked` flag + the old draw; old abilityDescription archived as a comment
- main.js FPS_WEST_TACTICAL_IDS block reuses showOpponentHandCardSelect → showCardTypeSelect → showRevealedCard, stores fpsWestGuessCorrect in _pendingTargets
- 5 new tests; 842 total; sim 100 games 0 crashes; Ronald Kip stacking test passed

### 19-02: Ronald Chef Strategic Insight — hand-card lock (COMPLETE)

- 20 MP (via loseMP) to pick an opponent hand card and lock it (unplayable) until your next turn; 3-turn cooldown (`strategicInsightCooldown`); removed the dead `_ronaldPeek`
- New mechanic: `isHandCardLocked` guard in all 4 play-from-hand functions (playPiecie/playSnellie/playMosje/playPlace); startTurn ticks the cooldown + expires the lock when the locker's turn returns
- main.js RONALD_CHEF_INSIGHT_IDS pick-and-lock block; old abilityDescription archived
- 8 new tests; 850 total; sim 100 games 0 crashes

### Decisions

- FPS West test starting MP set to 25 (not the plan's illustrative 50) so the +70 correct case (→95) stays clear of the auto-level-at-100 edge — gainMP always runs checkLevelUp
- Lock guards return each play function's real failure shape (`{ state: <local clone>, success:false, error }`); lock matched by cardId (duplicates: first copy blocked) — documented v1 limitation
- `isHandCardLocked` is a shared helper (1 def + 4 call sites) per CLAUDE.md "build once, reuse"

## Phase 18 Progress — Dead-Flag Card Fixes

### 18-01: Dead-flag Piecie fixes + persistence (COMPLETE)

- Those Eyelashes: `_snelleBlocked` now stores the blocked opponent's playerId; playSnellie rejects that player's Snelle plays for the turn
- Battle Concert: `_battleConcertActive` redirects Alyssa's quest-failure MP to an opponent's first active Mosje (once), Alyssa untouched; guarded both onFailure and legacy failMP paths with a `failRedirected` local + gated on `!baseQuestMpBlocked` (The Void still nullifies)
- Tweede Kans: `_rerollGranted` consumed into both quest dice flows as +1 skiffaRerolls
- All three cards gained `persistUntilEndOfTurn: true`; startTurn clears all three flags
- 8 new tests; 829 total passing; simulation 100 games 0 crashes/0 timeouts

### 18-02: Dead-flag Mosje ability rewrites (COMPLETE)

- Ronald Master Plan: play a Piecie free from own discard (once per game, `masterPlanUsed`), resolve its effect; persists on field if persistent, else to discard. Added `import * as piecieEffects` + `import { PIECIES }`
- Ming Future Sight: 10 MP, reveal top General Quest, optional send-to-bottom via `_pendingTargets.mingSendToBottom`
- Tuk Perfect Placement: 15 MP, peek top 5, take 2 to hand, bottom 3; abilityDescription face-down clause removed
- All three consume real UI selections via `_pendingTargets` (West/Binti modal pattern in main.js handleUseAbility)
- 8 new tests; 837 total passing; simulation 100 games 0 crashes/0 timeouts; no `_masterPlanPeek`/`_mingPredictorPeek`/`_architectPeek` flags remain

### Decisions

- showCardChoice supports only single picks, so Tuk uses two sequential picks (filter first from second list) — plan's documented fallback
- useMosjeAbility try/catch means UI-gated abilities (Ronald/Ming/Tuk) cleanly return {success:false} for the bot/sim path (no `_pendingTargets`), same as Binti — no crashes
- Ronald rewrite required `import * as piecieEffects` in mosjeAbilities.js; verified one-way (piecieEffects.js does not import mosjeAbilities.js) — no circular import

## Phase 11 Progress

### 11-01: Bot Driver — driveBotTurn (COMPLETE)

- Created src/bot/botDriver.js — pure 7-step heuristic bot turn driver
- Imports only engine and data — zero multiplayer imports
- 8 unit tests in tests/bot/botDriver.test.ts; 661 total tests passing

### 11-02: Offline Lobby Entry Point (COMPLETE)

- Added "Play Offline vs Bot" checkbox to lobby form (index.html)
- Wired offline submit branch in initLobbyPage() — writes mosjes:offline to sessionStorage, navigates to game.html?offline=true&player=player_1
- Bot deck: random STARTER_DECKS element with id != human's deckId
- Online create/join path completely unaffected

### 11-03: Offline Game Init Branch (COMPLETE)

- isOffline flag declared from urlParams.get('offline') in initGamePage() scope
- readOfflineData() module-level helper reads sessionStorage 'mosjes:offline'
- player_1 else branch: when isOffline=true, calls startGame(human, humanDeck, 'Bot', botDeck)
- syncManager and Firebase listeners never called in offline mode
- 661 tests passing, online path completely unaffected

### 11-04: Bot Turn Trigger in End Turn Handler (COMPLETE)

- import { driveBotTurn } from './bot/botDriver.js' added to src/main.js
- btn-end-turn handler: isOffline && activePlayerId==='player_2' triggers 600ms setTimeout
- setTimeout calls driveBotTurn, re-renders board, calls startTurn for human's next turn
- End Turn button disabled during bot's 600ms window, re-enabled after
- Online End Turn path completely unchanged; 661 tests passing

### 11-05: Offline Game Over + Smoke Test (COMPLETE)

- Added renderAndCheckWin() helper inside initGamePage() — renders then checks isOffline && FINISHED
- Replaced renderFromState(gameState) with renderAndCheckWin() in all 7 human action handlers (17 total occurrences: 1 def + 16 calls)
- Offline game now shows result overlay when any human action triggers FINISHED
- Created tests/bot/offlineGame.smoke.test.ts — 3 smoke tests drive full games to FINISHED, 0 crashes
- Fixed useMosjeAbility in turnManager.js: try/catch around ability dispatch prevents Binti throw when bot calls without pending targets
- 664 tests passing

### Decisions

- Offline mode entry: checkbox short-circuits Firebase, stores sessionStorage 'mosjes:offline' with name/deckId/botDeckId/playerId='player_1'
- Bot deck selection filters STARTER_DECKS, fallback to STARTER_DECKS[0]
- driveBotTurn is a pure function: follows 7 priority steps, calls same turnManager.js functions as human
- Test file uses .ts extension (vitest only picks up tests/**/*.ts per vitest.config.js)
- isOffline declared at urlParams scope (not inside startGame) so Plan 04 btn-end-turn listener can read it for bot turn trigger
- Bot turn trigger: triple guard (isOffline && player_2 active && not FINISHED) ensures online path is untouched
- startTurn called after driveBotTurn returns because driveBotTurn already calls endTurn internally
- renderAndCheckWin: single wrapper function handles FINISHED detection for all human action handlers, avoiding scattered if-checks
- Smoke test file uses .ts extension (vitest only picks up tests/**/*.ts)
- useMosjeAbility try/catch: abilities requiring UI input (Binti discard) gracefully return {success:false} rather than throwing

## Phase 12 Progress

### 12-01: Stub Engine Wiring — MP_LOSS_HALVED, MP_LOSS_REDUCTION, WELLOE_SHIELD (COMPLETE)

- Wired three status effects into loseMP() and markMosjeDefeated()
- Fixed effect_ff_haaltje_nemen ReferenceError; corrected 6 zero-value push sites
- 17 new tests added; 681 tests passing

### 12-02: negateNextSearch + STUB-05/07/08 Cleanup (COMPLETE)

- Wired negateNextSearch guard in phaseDrawCard() with isOpponentTriggered parameter
- STUB-05 confirmed implemented (doubleNextPiecie) — comment added
- STUB-07 documented with explicit UI consumption point in main.js handleActivatePiecie()
- STUB-08: dead SNOEIERTJE_COST push removed from effect_snoeiertje
- 3 new tests added; 684 tests passing

### 12-03: Dierenasiel 0-MP Guard + Synergy Chamber Cost Reduction (COMPLETE)

- dierenasielWaiver constant documented at useMosjeAbility engine call site (STUB-09)
- Synergy Chamber cost reduction pre-adjustment wired before fn() dispatch (STUB-10)
- placeEffects.getSynergyChambercostReduction() call established in turnManager.js
- 7 new tests added (Tests 17–23); 691 tests passing

### 12-05: Deferred Comments + card-reference.md Full Update (COMPLETE)

- DEFERRED comment in effect_emergency_swap with full implementation path (ability registry dispatch + showOptionSelect modal)
- Huisbaas PARTIAL/DEFERRED comments: Place destruction intact; deck-search-modal named as blocking primitive
- DEFERRED (STUB-16) comments at FPS West opponentHandPeeked and Ronald Chef _ronaldPeek set sites
- docs/card-reference.md: deferred status added to legend; all 16 STUB entries updated; Phase 12 notes section added
- 691 tests passing (no change — comments only)

### 12-04: UI-Gated Piecie Interactions — Bagga of Greed, Welloe Force, MP Adjuster (COMPLETE)

- Bagga of Greed: full-hand discard picker via showCardChoice modal after activation (STUB-11)
- Welloe Force: 3-turn engine-level damage redirect wired in loseMP(); target picker via showOptionSelect; auto-select when 1 target; cancel when 0 targets (STUB-14)
- MP Adjuster: temporary value picker (20/40/60/80/100 MP) via showOptionSelect; reverts at next turn start; _mpAdjusterPending replaces hardcoded mp=50 (STUB-15)
- Post-approval reworks per user: Bagga shows full hand, MP Adjuster is temporary, Welloe Force is engine-level 3-turn redirect with ★★★★ / 40 MP cost
- 691 tests passing (no new tests; browser-DOM interactions verified via Task 3 checkpoint)

### Decisions

- negateNextSearch guard placed inside if (isOpponentTriggered) — natural turn draws never negated
- STUB-05 needed no code change — doubleNextPiecie block already exists and works
- STUB-07 is entirely UI-side — engine comment enhancement is the complete deliverable for this wave
- SNOEIERTJE_COST push removal confirmed safe (no test relied on it)
- Dierenasiel guard is documentation-only — engine has no cost gate; dierenasielWaiver logs and documents UI responsibility
- Synergy Chamber reduction applied as pre-MP-adjustment (stateForAbility clone with s.mp += 5) rather than changing every individual ability function
- stateForAbility clone only created when synergyDiscount > 0 AND mosjeDef.abilityCost > 0
- Bagga of Greed shows full hand (not just 2 drawn cards) — user-requested; more strategic discard choice
- MP Adjuster is temporary: delta reverted at next turn start via startTurn() cleanup — one-turn boost not permanent override
- Welloe Force is engine-level 3-turn redirect in loseMP(); mpCost 40 / ★★★★ rarity; auto-selects single target, cancels if no targets
- main.js flag-check paths (Bagga/Welloe/MP Adjuster) are NOT unit-tested; browser-DOM modal awaits cannot be mocked; Task 3 checkpoint is accepted functional verification substitute
- Emergency Swap DEFERRED: ability registry already exists; blocking primitive is UI modal for opponent Mosje selection
- Huisbaas PARTIAL: Place destruction implemented; deck-search-for-Place requires new searchDeck primitive
- FPS West + Ronald Chef DEFERRED: engine flags set correctly; blocking primitive is opponent hand reveal UI in boardRenderer.js
- card-reference.md deferred status added to legend; Phase 12 Wave 5 is the final audit wave — all stubs now either wired or tagged

## Phase 14 Progress

### 14-01: Physical Equipment Piecies — Dumbbells, Boxing Gloves, Skipping Rope (COMPLETE)

- Created tests/effects/physical-equipment-scaling.test.ts (17 tests, TDD RED-then-GREEN)
- Added PHYSICAL-EQUIPMENT block to src/data/piecies.js (3 card definitions)
- Added effect_dumbbells, effect_boxing_gloves, effect_skipping_rope to src/abilities/piecieEffects.js
- Dumbbells: flat 20 MP to FIGHTING Mosje; 5 MP base to others; draw 1 at FIGHTING level 3 only
- Boxing Gloves: requires physical >= 2 trait; 25 MP standard; GANDOE tag → 40 MP + MP_LOSS_HALVED turnsLeft:1
- Skipping Rope: questPrepBonus +1 if FIGHTING Mosje + draw 1; draw 1 only for non-FIGHTING
- 708 tests passing (17 new tests; no regressions)

### 14-02: Protein Shake + Boxing Ring (COMPLETE)

- Added piecie_protein_shake to src/data/piecies.js (PHYSICAL-EQUIPMENT, FOOD tags, rarity ★★)
- Added effect_protein_shake to src/abilities/piecieEffects.js (+25 MP to FIGHTING; +35 MP when Boxing Ring active)
- Added place_boxing_ring to src/data/places.js (trigger ON_QUEST, goodFor FIGHTING, badFor DIGITAL/ARTISTIC)
- Added effect_boxing_ring to src/abilities/placeEffects.js (ON_QUEST: +15 MP / GANDOE +25; END_PHASE: FIGHTING +10 / non-FIGHTING -5)
- Boxing Ring bypass added to resolvePlaceEffect before trigger guard (handles both triggers via questCard discriminator)
- 718 tests passing (10 new tests; no regressions)

### 14-03: The Gym CLESS Patch + Card Reference Docs (COMPLETE)

- Patched effect_the_gym with isCless branch: CLESS Mosjes (physical < 2) gain +20 MP instead of -10
- Priority chain: physical >= 3 > physical >= 2 > isCless > default applyDamage(-10)
- Updated The Gym description in places.js to mention CLESS-tagged Mosjes bonus
- Documented all 6 Phase 14 cards in docs/card-reference.md (counts: Piecie 64→68, Place 16→17)
- 721 tests passing (3 new CLESS tests; no regressions)

### Decisions

- Dumbbells flat 20 MP (not level-scaled) — PLAN.md truths take precedence over PATTERNS.md getPhysicalMP helper
- GANDOE check: cardId.toLowerCase().includes('gandoe') — matches existing Coert's Caravan pattern
- MP_LOSS_HALVED turnsLeft:1 for Boxing Gloves (not 2 like Bowie & Stormey) — 1-turn only per plan spec
- Boxing Ring bypass before trigger guard: handles dual ON_QUEST/END_PHASE triggers without switch case
- effect_boxing_ring questCard discriminator: questCard !== undefined = ON_QUEST path; else END_PHASE path
- CLESS branch placed as else-if after physical >= 2 — physical trait bonus takes priority for CLESS Mosjes with physical >= 2
- isCless uses cardId.includes('cless') — consistent with effect_coerts_caravan id.includes('coert') pattern

## Phase 10 Complete (prior)

All 5 balance plans executed and verified (BAL-01 through BAL-05):

- BAL-01: Digital Equipment MP scaling (Keyboard/Mouse/Controller — 15/25/40 MP by Mosje level + DIGITAL subtype)
- BAL-02: Physical Force SUBSTANCE fallback (Grammetje Pieter + Tikker; Tikker fixed flat +40 MP + QUEST_BLOCKED)
- BAL-03: Artistic Rhythm SUBSTANCE fallback (Larry Zegeltje + Grammetje Pieter)
- BAL-04: Quest economy (all successMP +20, all failMP capped at -20 max)
- BAL-05: Deck-out reshuffle rule (empty deck → reshuffle discard, draw 1, skip next turn)

653 tests passing. 0 simulation crashes. 0 timeouts.

</details>
