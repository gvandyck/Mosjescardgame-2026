# Phase 47 Planning Ledger Reconciliation Manifest

**Captured:** 2026-07-19T23:35:23+02:00  
**Scope:** Planning metadata and routing only. Runtime source, card data, tests,
and game documentation are evidence inputs and are not Phase 47 mutation
targets.

This manifest is the durable interpretation layer for a legacy GSD ledger.
It does not manufacture historical execution records. Existing directories,
plans, summaries, reviews, verifications, and todos remain in place.

## Projection Baseline

| Projection | Observed value | Conflict | Canonical interpretation |
|---|---|---|---|
| `gsd-sdk query roadmap.analyze` | 38 roadmap phases; 85 plans; 78 summaries; 23 phases with matching plan/summary counts; 92% plan completion; calculated current Phase 6 and next Phase 2 | The calculated current/next values follow missing legacy summaries and ambiguous Phase 02 lookup, not the most recent verified delivery | Treat as a disk-derived anomaly inventory, not proof that Phase 6 should now execute |
| `gsd-sdk query state.json` | `current_phase: 46`, `status: milestone_complete`, 40 total phases, 86 plans, 78 completed plans, 57% | The milestone audit says `gaps_found`; Phase 47 is planned; Phases 42-45 remain empty; historical plans lack summaries | `milestone_complete` is unsafe routing and must be replaced through registered state handlers |
| `gsd-sdk query phases.list` | 49 directories for 38 roadmap phases | Duplicate Phase 02 and Phase 40 directories plus nine off-roadmap phase numbers prevent directory count from representing roadmap count | Preserve all directories and record explicit canonical routes instead of renaming or deleting |
| `gsd-sdk query validate.health` | `degraded`; nine historical plans without summaries, nine off-roadmap phase numbers, plus the active Phase 47 plan without a summary | Plan existence and implementation evidence do not satisfy the modern SUMMARY contract | Classify the nine historical plans honestly and create only Phase 47's real execution summary |
| `.planning/v1.0-v1.0-MILESTONE-AUDIT.md` | `gaps_found`; strict requirements score 0/64; phases score 9/37; three Phase 12 human checks | Live validation is strong, but traceability and historical closeout are incomplete | Do not archive; route evidence backfill and historical closure separately |
| Git/worktree baseline | Phase 46 runtime, test, card-reference, and planning changes already dirty before Phase 47; Phase 47 planning files and the milestone audit already untracked | A raw final `git diff` cannot attribute all dirty paths to Phase 47 | Preserve the baseline and attribute Phase 47 only to its manifest/summary, supported ROADMAP/STATE changes, config gate, and SDK-created Phase 48/49 directories |

Baseline queries were run on the command date above. The sorted
`.planning/phases` inventory excluded every `/_archive/` path. No ledger
mutation had occurred when these values were captured; the earlier
`gsd-sdk query config-set workflow.use_worktrees false` preflight changed only
`.planning/config.json` so Codex could execute sequentially without unsupported
worktree isolation.

## Duplicate Phase Directories

| Phase | Canonical directory | Preserved legacy directory | Evidence | Route |
|---|---|---|---|---|
| 02 | `.planning/phases/02-piecies/` | `.planning/phases/02-design-decks/` | ROADMAP calls Phase 02 "Implement Piecies"; `02-piecies/01-01-PLAN.md` targets that work. `gsd-sdk query find-phase 02` currently selects `02-design-decks`, demonstrating first-match ambiguity. Accepted decision D-06 resolves the semantic route. | Phase 48 verifies original IMPL traceability against the explicit canonical path; Phase 49 closes the legacy execution evidence. Neither directory is renamed or deleted. |
| 40 | `.planning/phases/40-9-mosje-ability-text-to-engine-reconciliation/` | `.planning/phases/40-9-mosje-ability-text-to-engine-reconciliation-resolve-the-9-/` | `gsd-sdk query find-phase 40` selects the short directory and reports `40-01-PLAN.md` plus `40-01-SUMMARY.md`; the long directory is an empty placeholder. Accepted decision D-07 confirms this route. | Continue using the short completed directory. Preserve the long placeholder and record it as legacy evidence in Phase 49. |

## Plans Without Summaries

The three allowed labels are used literally. A later implementation or
verification may supersede the need to execute an old plan, but it does not
authorize creating a fictional historical SUMMARY.

| Plan path | Classification | Evidence | Recommended route |
|---|---|---|---|
| `.planning/phases/02-piecies/01-01-PLAN.md` | insufficient evidence | The 2026-04-28 plan itself marks several effects `[VERIFY]` or unknown and promises 50+ new tests and deck simulations. Current code and later phase evidence show a mature Piecie surface, but `.planning/REQUIREMENTS.md` still has the original IMPL Piecie requirements open and the milestone audit scores them untraced. Git only proves the plan artifact (`5bf7c26`), not this plan's completion. | Phase 48 verifies each original Piecie requirement; Phase 49 records whether this legacy plan is formally superseded. |
| `.planning/phases/06-integration/01-01-PLAN.md` | superseded by later verified work | `.planning/phases/06-integration/02-COMPLETION.md` records the lobby options, generic deck initialization, 582/582 tests, and manual checks. Later `tests/ui/active-deck-lobby.spec.js`, player-facing deck checks cited by the milestone audit, and Phase 46's 705/705 validation provide newer evidence. | Phase 49 converts the legacy completion report and later test evidence into an honest closure decision; do not execute the stale launch plan. |
| `.planning/phases/16-eendjes-voeren-place/16-01-PLAN.md` | superseded by later verified work | Git commits `211703a` and `1171b60` implement and correct the Place conversion. Live `place_eendjes_voeren` data/effect wiring and `tests/ui/simulation/chain-tests.spec.js` exercise play, activation, active-place state, and persistence. | Phase 49 records supersession without inventing `16-01-SUMMARY.md`. |
| `.planning/phases/28-visual-ui-tests/28-01-PLAN.md` | insufficient evidence | Commit `344ba69` says nine visual mechanics tests while the plan promises ten plus a headed all-green run. The current `tests/ui/mechanics.spec.js` has 11 `test(...)` declarations and later suites reuse `tests/ui/helpers.js`, but no matching summary or preserved Phase 28 verification proves the original acceptance gate. | Phase 49 maps current tests to the old ten-test contract and either closes or explicitly retires remaining differences. |
| `.planning/phases/29-card-test-library/29-01-PLAN.md` | genuinely unfinished | The plan promises a scalable registry covering every card and all 35 Mosje abilities. The live factory exists, but `CARD_REGISTRY` currently exposes 40 card entries and `ABILITY_REGISTRY` 8 entries; later specialized suites add coverage without satisfying this exact complete-registry promise. | Phase 49 decides whether to finish the registry or formally supersede its over-broad scope with the current test architecture. |
| `.planning/phases/30-defeat-at-zero-mp/30-01-PLAN.md` | superseded by later verified work | Commit `a284d68` implemented pending defeat routing. `src/engine/mpManager.js`, `src/engine/victoryChecker.js`, and `tests/engine/defeat-at-zero-mp.test.ts` contain the below-zero Level-0 behavior; Phase 37 verification later passed the relevant MP gate and full suite. | Phase 49 records the implementation and later verification chain; do not rerun the stale plan as new work. |
| `.planning/phases/31-mp-cap-invariant/31-01-PLAN.md` | superseded by later verified work | Commit `e23424c` implemented the cap. `gainMP(..., { allowLevelUp:false })`, `tests/engine/mp-cap.test.ts`, and later card-chain/Phase 46 validation evidence enforce non-Quest cap-at-100 and Quest-only permanent levels. | Phase 49 creates the explicit evidence closure without fabricating a historical summary. |
| `.planning/phases/32-onfield-mosje-info-dice-modal/32-02-PLAN.md` | insufficient evidence | The planned `renderDieFace`, staged `.dice-modal`, preserved `#modal-roll/#modal-done/#modal-reroll`, and `window.__forceDiceRoll` hooks exist in `src/ui/modalManager.js` and `styles/board.css`; later Playwright suites exercise them. The plan was `autonomous: false` and ended in a blocking human visual checkpoint, but no approval or matching summary is preserved. | Phase 49 must preserve the missing human-approval distinction and decide whether current visual verification is sufficient. |
| `.planning/phases/38-alyssa-jisca-synergy-design-and-implementation-design-wire-t/38-02-PLAN.md` | superseded by later verified work | Commit `d9a3eda` wired both directions; `53be62d` marked Phase 38 complete. The resolver/unit tests and `tests/ui/cards/alyssa-jisca-synergy.spec.js` cover both bonuses, and later Phase 39/46 validation ran on that engine state. | Phase 49 records the existing commit/test chain and formal supersession; do not execute the plan again. |

The active `.planning/phases/47-.../47-01-PLAN.md` also lacked a summary at
baseline because it was being executed. It is intentionally not one of the
nine historical classifications above; its real SUMMARY is created only after
this plan completes.

## Off-Roadmap Phase Directories

| Phase | Evidence | Route |
|---|---|---|
| 16 | `phases.list` and `validate.health`; implementation commits and current Eendjes Voeren tests exist | Preserve; Phase 49 records supersession evidence. |
| 17 | `phases.list` and `validate.health`; directory exists without an active ROADMAP entry | Preserve; Phase 49 determines its historical disposition. |
| 18 | `phases.list` and `validate.health`; directory exists without an active ROADMAP entry | Preserve; Phase 49 determines its historical disposition. |
| 19 | `phases.list` and `validate.health`; directory exists without an active ROADMAP entry | Preserve; Phase 49 determines its historical disposition. |
| 20 | `phases.list` and `validate.health`; directory exists without an active ROADMAP entry | Preserve; Phase 49 determines its historical disposition. |
| 21 | `phases.list` and `validate.health`; directory exists without an active ROADMAP entry | Preserve; Phase 49 determines its historical disposition. |
| 29 | `phases.list`, `validate.health`, and the incomplete full-registry promise in `29-01-PLAN.md` | Preserve; Phase 49 decides finish-versus-supersede. |
| 33 | `phases.list` and `validate.health`; directory exists without an active ROADMAP entry | Preserve; Phase 49 determines its historical disposition. |
| 34 | `phases.list` and `validate.health`; directory exists without an active ROADMAP entry | Preserve; Phase 49 determines its historical disposition. |

None of these directories is silently added back to the active roadmap.

## Pending Todos

| Todo path | Evidence | Route |
|---|---|---|
| `.planning/todos/pending/2026-06-11-ts-bulldozer-comeback-reconcile.md` | Todo explicitly describes the declarative TypeScript/live-JS divergence | Existing Phase 45. |
| `.planning/todos/pending/2026-07-12-ability-text-engine-reconciliation.md` | Todo says the deck slice was verified in Phase 40 and the non-deck remainder remains deferred | Existing Phase 42 systematic audit, with Phase 49 retaining historical closure evidence. |
| `.planning/todos/pending/2026-07-12-alyssa-jisca-synergy-design.md` | Phase 38 commits and tests now implement the accepted design | Phase 49 evidence closure; do not reopen the mechanic. |
| `.planning/todos/pending/2026-07-13-coerts-caravan-binti-discount-mismatch.md` | Phase 41 replaced the stale discount with the accepted shield design and has a summary | Phase 49 stale-todo evidence closure. |
| `.planning/todos/pending/2026-07-13-full-game-ability-text-audit.md` | Todo calls for the systematic cross-card pass | Existing Phase 42. |
| `.planning/todos/pending/2026-07-15-remaining-mosje-synergies-and-cless-teacher-fix.md` | Parts were delivered in Phases 38-39, while FPS West/Coert, waiver behavior, and Cless Teacher remain separate questions | Preserve as backlog input for Phase 42; Phase 49 records delivered subsets. |
| `.planning/todos/pending/2026-07-15-the-void-real-implementation-ruling.md` | Todo contains the accepted future mechanic and says The Void stays hidden until implemented | Existing Phase 44. |
| `.planning/todos/pending/2026-07-16-dierenasiel-real-mechanic-needed.md` | The todo is a Place-design task and matched Phase 47 only through generic metadata words | Existing Phase 43, per accepted false-positive ruling D-11. |

Phase 47 does not move or auto-close any todo.

## Verification Debt

| Debt | Evidence | Canonical interpretation | Route |
|---|---|---|---|
| Original implementation requirements | `.planning/REQUIREMENTS.md` keeps 59 `IMPL-*` entries open; no modern verification artifact maps them; milestone audit strict score is 0/64 | This is traceability debt, not proof that the live mechanics are broken. Current runtime validation and later phase evidence remain useful inputs but do not automatically close IDs. | Phase 48 verifies IMPL requirements for Phases 01-06 against live code, tests, and honest evidence. |
| Phase 09 bug requirements | `BUG-01` through `BUG-05` are checked in REQUIREMENTS.md and have Phase 09 plans/summaries, but no Phase 09 VERIFICATION or modern `requirements-completed` chain | Implementation evidence exists, but the independent verification link is missing. | Phase 48 backfills explicit BUG-01 through BUG-05 evidence without changing game behavior. |

The milestone stays non-archivable until these routes and the remaining audit
gaps are resolved and a later milestone audit passes.

## Human UAT and Remaining Product Work

`gsd-sdk query audit-uat` reports exactly three Phase 12 human checks:

1. Bagga of Greed discard/keep-both modal.
2. Welloe Force redirect target modal and damage routing.
3. MP Adjuster selection and next-turn reversion.

They remain a separate `$gsd-verify-work 12` activity. Phase 47 neither
performs nor auto-approves them.

Phases 42-45 remain separate roadmap work:

- Phase 42: systematic ability-text versus engine audit.
- Phase 43: Dierenasiel real mechanic.
- Phase 44: The Void implementation ruling.
- Phase 45: TypeScript Bulldozer comeback reconciliation.

Phase 47 does not discuss, plan, execute, verify, or close those phases.

## Follow-up Order

1. Phase 48 — original requirement verification backfill.
2. Phase 49 — legacy execution evidence closure for plans, stale todos, and
   off-roadmap artifacts.
3. Phase 12 — complete the three human UAT checks.
4. Phases 42-45 — discuss, plan, execute, and verify as independent work.
5. Re-run `$gsd-audit-milestone`; archive only if the new audit passes.

## Mutation Log

| Time/order | Command or action | Result | Diff/integrity inspection |
|---|---|---|---|
| Preflight | `gsd-sdk query config-set workflow.use_worktrees false` | Registered config handler returned `updated: true`, key `workflow.use_worktrees`, value `false` | Only `.planning/config.json` gained `workflow.use_worktrees: false`; no ROADMAP, STATE, runtime, test, card-data, or game-doc mutation |
| Baseline | Registered read queries plus sorted non-archive phase inventory | Captured the projections and classifications above | No ROADMAP/STATE mutation had yet occurred in Phase 47 |
| Task 2 #1 (2026-07-20) | `gsd-sdk query phase.add "Original requirement verification backfill for Phases 01-06 and 09 using live code, tests, and honest traceability evidence"` | Returned `phase_number: 48`, `naming_mode: sequential`, directory `.planning/phases/48-original-requirement-verification-backfill-for-phases-01-06-` | ROADMAP.md gained one appended `### Phase 48` section (Goal TBD, Depends on Phase 47, 0 plans); new dir created with only `.gitkeep`; no runtime/test/card-data/game-doc path touched |
| Task 2 #2 (2026-07-20) | `gsd-sdk query phase.add "Legacy execution evidence closure for plans without summaries and off-roadmap phase artifacts"` | Returned `phase_number: 49`, `naming_mode: sequential`, directory `.planning/phases/49-legacy-execution-evidence-closure-for-plans-without-summarie` | ROADMAP.md gained one appended `### Phase 49` section; new dir created with only `.gitkeep`; `roadmap.get-phase 48`/`49` both `found: true`; `git diff --check` clean |

| Task 3 #1 (2026-07-20) | `gsd-sdk query state.patch --status in_progress --current_phase 47` | Returned `updated: []`, `failed: ["status","current_phase"]`; only `last_updated` was refreshed | **Legacy-format mismatch:** the SDK strips frontmatter before the modifier and re-derives it from the body. This STATE.md body is a freeform "RESUME HERE" narrative with only `**Current phase:**` and no `**Status:**`/`## Current Position` fields, so the narrow handler cannot set the derived frontmatter `status`. No unsafe change made. |
| Task 3 #1b (2026-07-20) | `gsd-sdk query phase.complete 46` (official lifecycle handler chosen after operator approval to use supported tooling rather than direct-edit STATE.md, per D-03) | Returned `next_phase: 47`, `is_last_phase: false`, `plans_executed: 3/3`, `roadmap_updated/state_updated/requirements_updated: true`, `warnings: []` | STATE.md frontmatter `status: milestone_complete`→`ready_to_plan`, `current_phase: 46`→`47`, `completed_plans`→90, added `stopped_at`; body `**Current phase:**`→47. ROADMAP.md and REQUIREMENTS.md diffs were **empty** (Phase 46 already Complete there — idempotent). No runtime/test/card-data/game-doc path touched. |
| Task 3 #2 (2026-07-20) | `gsd-sdk query state.update-progress` | `updated: false`, reason `Progress field not found in STATE.md` | Harmless no-op on the legacy freeform body; frontmatter counts already set by `phase.complete`. No change written. |
| Task 3 #3 (2026-07-20) | `gsd-sdk query roadmap.update-plan-progress 47` | `updated: true`, `plan_count: 1`, `summary_count: 0`, `status: Planned`, `complete: false` | ROADMAP diff empty — Phase 47 already showed `0/1 plans executed`. Idempotent. |
| Task 3 #4 (2026-07-20) | `gsd-sdk query state.record-session --stopped-at "Phase 47 planned for metadata reconciliation; execute 47-01 next" --resume-file "…/47-01-PLAN.md"` | `recorded: false`, reason `No session fields found in STATE.md` | Harmless no-op on the legacy freeform body; routing already carried by `stopped_at` from `phase.complete`. No change written. |
| Task 3 verify (2026-07-20) | `state.json`, `state.validate`, `roadmap.analyze`, `audit-uat`, `git diff --check` | `status: ready_to_plan` (≠ `milestone_complete`), `current_phase: 47`; `state.validate` `valid: true`, no drift; roadmap.analyze includes phases 46/47/48/49; `audit-uat.total_items: 3` (Phase 12 checks preserved); `git diff --check` clean | Sorted `.planning/phases` inventory: only new paths are the Phase 47 manifest, the two SDK-created `48-…`/`49-…` directories (each `.gitkeep` only), and `47-01-SUMMARY.md`. No pre-existing planning artifact deleted, moved, renamed, or archived; pre-existing dirty Phase 46 runtime/test/doc paths preserved untouched. |

### Handler-limitation note (D-03)

The prescribed narrow state handlers (`state.patch`, `state.update-progress`,
`state.record-session`) cannot write this milestone's legacy freeform STATE.md
body, which lacks the structured `**Status:**` / `## Current Position` /
`Progress` / session fields those handlers target. The false `milestone_complete`
routing was cleared instead via the supported `phase.complete` lifecycle handler
(operator-approved), which writes frontmatter directly and re-derived the correct
non-archival routing now that Phases 47–49 exist. No STATE.md or ROADMAP.md line
was hand-edited.
