# Codex Session Start

This is the Codex-facing companion to `CLAUDE.md`. Read it at the start of every new session after `AGENTS.md`.

## First Moves

1. Check branch and dirty worktree:

```bash
git branch --show-current
git status --short
```

2. Read the live handoff state:

```bash
Get-Content -Raw .planning\STATE.md
Get-Content -Raw docs\codex-continuation-notes.md
```

3. If continuing the active five-starter-deck card reconfiguration discussion, read:

```bash
Get-Content -Raw .planning\CARD-RECONFIGURATION-CONTEXT.md
```

4. Before rule, card, effect, quest, MP, or multiplayer changes, read the required source-of-truth docs listed in `AGENTS.md`.

## GSD For Codex

Official GSD v1.42.3 is installed globally for Codex under `~/.codex`. It provides native Codex skills, workflows, agents, hooks, and the SDK.

- Codex syntax uses `$gsd-help`, `$gsd-discuss-phase 41`, `$gsd-plan-phase 41`, `$gsd-execute-phase 41`, and `$gsd-verify-work 41`. Claude's `/gsd:...` syntax is not the native Codex spelling.
- Skills are loaded when a new Codex session starts. Use `$gsd-help` to confirm the installation.
- `gsd-sdk` is installed globally. Verified command: `gsd-sdk --version` -> `gsd-sdk v1.42.3`.
- For every non-trivial feature or bugfix, invoke `$gsd-discuss-phase` before planning or coding, even when the user did not type it. Inspect `.planning/STATE.md`, `.planning/ROADMAP.md`, and the relevant phase/todo files first.
- The discussion must visibly ask phase-specific questions and wait for answers. When the rich question UI is unavailable, present numbered choices as plain text and stop. Never silently pick defaults.
- Do not use `--auto`, `--all`, or `--chain` unless the user explicitly requests a non-interactive run.
- Existing context or plans do not permit a silent skip: tell the user what exists and ask whether to accept, review, or update it.
- The Git rules in `AGENTS.md` override upstream GSD workflow steps. Never make GSD's automatic commits, create/switch branches, push, merge, rebase, delete branches, or open PRs without the user's explicit approval for that exact action.
- `.planning/config.json` sets `commit_docs: false` as an additional guard against GSD automatically committing planning artifacts.
- If a phase is already planned and the user accepts its context, execute from the latest plan file and keep phase summaries updated.
- If a bug is reported, reproduce it in the live browser with Playwright before fixing when the behavior has a browser surface.

## Current Resume Source

Use `.planning/STATE.md` as the freshest resume point. As of the last checked state on 2026-07-18:

- Branch: `plan/phase-40-deck-ability-reconciliation`
- Phase 40 is marked complete.
- Next interactive GSD action: `$gsd-discuss-phase 41`
- Phase 41 covers the diagnosed Coert's Caravan Binti-discount text/engine mismatch.

Treat those bullets as a snapshot only; always trust the current `.planning/STATE.md` over this file when it changes.

## Active Card Reconfiguration Discussion

The cross-phase five-starter-deck redesign is captured in
`.planning/CARD-RECONFIGURATION-CONTEXT.md`. It records accepted card mechanics,
deck counts, booster decisions, unresolved questions, and the exact discussion
resume point. Read it before continuing that discussion or planning its
implementation.

## Project Guardrails

- Do not work on `main` for feature/fix work.
- Do not commit, push, merge, rebase, delete branches, or open PRs unless the user explicitly asks.
- Never push or merge into `main` until Codex asks directly and the user replies `yes` in the current conversation.
- Never overwrite uncommitted user or previous-agent changes.
- Do not scan or use `/_archive/` unless explicitly requested.
- Prefer the live browser/JS path for user-facing gameplay behavior; be aware this repo still has documented TypeScript and browser data surfaces.
- When docs, card text, and code disagree, stop and surface the ambiguity instead of guessing.

## Validation

Preferred gate:

```bash
npm run validate
```

For browser/UI runtime edits, also syntax-check the relevant browser files with `node --check`. For MP, quest, level, or cost-payment changes, run focused regression tests plus the broader suite described in `AGENTS.md` and the active phase plan.
