# Codex Handoff — Execute Phase 20 (Leipe Swap)

You are **Codex**, temporarily continuing GSD ("Get Shit Done") work on the **Mosjes Card Game** (a TypeScript/JS card engine) that Claude was driving. The plan is already fully written. Your job is to **execute it** with TDD discipline. This file is self-contained — you do **not** have Claude's skill files.

---

## 1. The task

Execute **`.planning/phases/20-leipe-swap/20-01-PLAN.md`** end to end.

It reworks the unused **"Emergency Swap"** Piecie into **"Leipe Swap"** — a temporary MP *double-swap*. The plan contains the exact code (`<interfaces>`), the TDD tasks (`<tasks>`), the verification greps, and the success criteria. **Follow it exactly.**

⚠️ The plan's `<execution_context>` block points at `@C:\Users\Gandoe\.claude\get-shit-done\...` files — those are Claude-internal and **do not exist for you. Ignore them.** Everything you need is in: this handoff + the plan's `<interfaces>`/`<tasks>` + `CLAUDE.md` at the repo root.

---

## 2. Environment & hard rules

- **Platform:** Windows (PowerShell or bash both fine).
- **Branch:** you are already on **`card/leipe-swap`** (created off the freshly-merged `main`). **Stay on it. Never commit to `main`** (project rule in `CLAUDE.md`).
- **Tests:** `npm test` (runs `vitest run`). vitest only picks up `tests/**/*.ts` — `.js` test files are ignored. Baseline is **850 passing**.
- **Simulation:** `npx tsx src/simulation/run-once.ts`. **Do NOT** use `node --loader ts-node/esm …` — it crashes with an opaque error. Target: **0 crashes** over 100 games.
- **`gsd-sdk` is NOT installed** — ignore any GSD CLI tooling; just use plain `git` + `npm`.
- **Do NOT touch `get-shit-done`** — it is a git submodule (mode 160000) with a pre-existing uncommitted pointer change unrelated to this work. **Never run `git add .` or `git add -A`** — stage only the specific files you changed.
- **Read `CLAUDE.md` first.** Key conventions: one exported function per file, small files, card-data files are *data only* (logic lives in `src/effects`/`src/abilities`), run tests after every change. Any MP-touching change must re-run the **Ronald Kip stacking test** + the full simulation.

---

## 3. Two parallel card systems (matters for the rename — plan Task 3)

The engine has **two** card systems; reconcile **both** when renaming:
1. **Imperative = LIVE + what the sim runs:** `src/data/*.js` (card data) + `src/abilities/piecieEffects.js` / `mosjeAbilities.js` (logic) + `src/engine/turnManager.js`. **Implement the Leipe Swap mechanic here.**
2. **Declarative registry (parallel):** `src/cards/**/*.ts` + executor + `bootstrap-registry.ts`. The old card also exists at `src/cards/piecies/utility/emergency-swap.ts` — rename/reconcile it.
3. **Docs to update on rename:** `docs/card-reference.md`, `docs/phase0-rulings.md`, `src/rules/card-specific-rulings.md`. (Note: card-reference statuses have gone stale before — trust the code, not the doc.)

When done, `grep -rn "emergency_swap\|Emergency Swap" src/ tests/ docs/` should return **0**.

---

## 4. TDD execution protocol (per task)

For each `<task type="tdd">` in the plan:
1. **RED** — write the failing tests exactly as `<behavior>`/`<action>` specify. Run the `<verify>` command and **confirm they FAIL** while the existing 850 tests still pass. Commit: `git commit -m "test(20-01): <desc>"`.
2. **GREEN** — apply the `<interfaces>` code. Run `npm test` (all green) **and** `npx tsx src/simulation/run-once.ts` (0 crashes). Commit: `git commit -m "feat(20-01): <desc>"`.

For the non-TDD **Task 3** (rename + docs + rarity cap): apply changes, run the verification grep (`emergency_swap` → 0) + the sim, commit `chore(20-01): …` / `docs(20-01): …`.

Commit **each task atomically**. (Optional commit trailer: `Co-Authored-By: …` — match your tool's convention or omit.)

---

## 5. Locked design facts (agreed with the user — do not re-litigate)

- **Card:** name `Leipe Swap`, id `piecie_leipe_swap`, effectId `effect_leipe_swap`, `mpCost: 0`, `rarity: "★★★★★"` (= 1 per deck via `RARITY_COPY_LIMITS["★★★★★"]` in `src/deck-builder.js`), `persistUntilEndOfTurn: true`, `requirement: "level1"`, `tags: ["SWAP"]`.
- **Mechanic (double-swap):** On activation (your turn) the player picks **one of their Mosjes + an opponent Mosje** (via `showTargetSelector`, mirroring the `effect_affoe` branch in `main.js` `handleActivatePiecie`); store the slots in `_pendingTargets.leipeYourSlot / leipeOppId / leipeOppSlot`. The effect **swaps their MP with direct assignment** (NOT `gainMP`/`loseMP` — those auto-level at 100 and would corrupt a progress swap; a Mosje's `mp` is 0–99 progress toward the next level). It records `state._leipeSwap = {byPlayerId, yourSlotIndex, oppId, oppSlotIndex}`.
- **Revert:** at the **end of the swapper's turn**, `endTurn` swaps the two slots' **current** MP back, then clears `_leipeSwap`. Levels banked mid-turn **stick** (only mp moves); leftover mp is handed to the other Mosje. Worked example is in the plan's `<objective>`.
- Must be a **graceful no-op** when no targets are set (the bot/sim path never sets `_pendingTargets` for it) — so the sim stays at 0 crashes.

---

## 6. When you finish

1. Create **`.planning/phases/20-leipe-swap/20-01-SUMMARY.md`** (what changed, final test count, sim result, any deviations) and commit it.
2. Update the tracking files yourself (no orchestrator here):
   - `.planning/ROADMAP.md` — mark Phase 20 done: add `✅` to the name and a `DONE — N tests pass, 0 sim crashes …` note in the Success Criteria cell (match the Phase 19 row's style).
   - `.planning/STATE.md` — add a `## Phase 20 Progress — Leipe Swap` section and update the header `Current phase:` line.
3. **Do NOT merge or push.** Leave everything committed on `card/leipe-swap`; the user (gvandyck) handles merge/push.
4. Report back: commit hashes, final `npm test` count, simulation result, and any deviations from the plan.

---

## 7. State at handoff (for context)

- `main` is up to date and pushed (through Phase 19, commit `195e03f`): 850 tests passing, sim clean.
- Phases 18 (dead-flag fixes) and 19 (FPS West guess game + Ronald Chef hand-lock) are complete and merged.
- This is the **last** of the "UI-modal / redefined" card batch the user scoped. After Phase 20, deferred future work (not in scope now) includes: engine-doable quest behaviors (drawExtra, Elimination −30 MP), dead-code cleanup (`effect_jensen`/`effect_lucky_coin`), and quest 3-way/gate reworks.
