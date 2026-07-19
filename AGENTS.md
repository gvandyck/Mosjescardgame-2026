# Codex Working Instructions

These instructions are for Codex and other coding agents working in this repo.

## Safety First

- Do not work directly on `main` for feature or fix work.
- Before making code changes, check the current branch and dirty worktree.
- At session start, read `CODEX.md` after this file. Treat it as the Codex-specific continuation guide.
- Treat uncommitted changes as user/previous-agent work. Do not revert or overwrite them unless the user explicitly asks.
- Never push, merge, rebase, or delete branches without explicit user approval.
- Never push or merge into `main` unless you first ask for confirmation and the user replies `yes` in the current conversation.
- Do not run destructive commands such as `git reset --hard`, `git clean`, or recursive deletes unless the user explicitly requests them and the target is verified.

## Project Source Of Truth

Read these before changing game rules, cards, effects, quests, or MP behavior:

- `docs/developer-handoff.md`
- `docs/codex-continuation-notes.md`
- `docs/card-reference.md`
- `docs/card-data-surfaces.md`
- `docs/phase0-rulings.md`
- `docs/phase10-report.md`

If a rule conflicts with code, `docs/phase0-rulings.md` wins. Fix code, not the ruling document. If card text conflicts with rulings, record the ambiguity and ask before guessing.

## GSD Planning Habit

- Official GSD for Codex is installed globally. Invoke its skills with `$gsd-discuss-phase`, `$gsd-plan-phase`, `$gsd-execute-phase`, `$gsd-verify-work`, and the other `$gsd-*` names.
- For every non-trivial feature or bugfix, invoke `$gsd-discuss-phase` before planning or coding. Present phase-specific choices and wait for the user's answers; never silently choose defaults or skip the discussion checkpoint.
- Do not add `--auto`, `--all`, `--chain`, or another non-interactive GSD flag unless the user explicitly requests that mode.
- If Codex's rich question tool is unavailable, show concise numbered choices in plain text and stop for the user's reply.
- If context or plans already exist, tell the user and ask whether to accept, review, or update them before continuing. Do not reopen settled decisions after the user accepts them.
- This repository's Git rules override GSD's built-in commit, branch, merge, and push steps. Skip those steps unless the user explicitly asks for that exact Git action. In particular, do not make GSD's normal atomic commits automatically.
- The local GSD SDK is expected to be available as `gsd-sdk`; verify with `gsd-sdk --version` before relying on it.
- Do not scan, read, edit, or reason from `/_archive/` unless the user explicitly asks.

## Current Architecture

- The tested TypeScript engine lives under `src/engine`, `src/effects`, `src/cards`, `src/types`, and `src/simulation`.
- The browser UI/game flow is plain JavaScript and HTML, mainly `src/main.js`, `src/ui`, `src/data`, `src/multiplayer`, and root HTML files.
- Be careful: there are two card data surfaces:
  - Engine registry cards in `src/cards/**/*.ts`.
  - Browser/UI card data in `src/data/*.js`.
- Keep engine/effect changes pure and immutable.
- Card definition files should stay declarative. Put behavior in effects, primitives, executors, or engine helpers.

## Branch And Git Rules

- Use clear branch names, for example:
  - `fix/mp-floor-zero`
  - `feature/selection-modal`
  - `card/new-card-name`
  - `ui/card-preview`
- Do not commit unless the user asks for a commit.
- Do not push unless the user asks for a push.
- Do not open or merge PRs unless the user asks.
- Before any commit, summarize changed files and test results.

## Validation Baseline

- Preferred validation gate: `npm run validate`.
- `npm run validate` runs lint, source typecheck, and tests.
- `npm run lint` is configured for ESLint v9. It exits cleanly but still reports `any` usage as warnings.
- `npm run typecheck:source` typechecks production TypeScript source with the current practical baseline.
- Known caveat: full `npx tsc --noEmit` still includes test fixtures and strict-mode cleanup work that is not yet a clean baseline.
- If touching MP gain/loss, quest completion, level thresholds, or cost payment, run the relevant focused tests plus the full `npm test`.
- If touching simulation, prefer the handoff guidance in `docs/developer-handoff.md`.

## Coding Style

- Prefer small, focused files and existing local patterns.
- Avoid broad refactors while fixing a specific issue.
- Use existing primitives/helpers before adding new abstractions.
- Add or update tests for new card behavior, rule changes, primitives, and regressions.
- Keep UI components reusable when a pattern appears in more than one place.

## Communication

- Explain what you are checking before editing.
- Ask when a rule, card behavior, or product decision is ambiguous.
- Be explicit about what was verified and what could not be verified.
