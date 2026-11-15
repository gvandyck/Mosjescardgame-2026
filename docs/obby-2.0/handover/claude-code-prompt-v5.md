# Prompt for Claude Code: Obby Card Game V5

Written 15 Nov 2026. Open Claude Code in the repo `gvandyck/mosjescardgame-2026` on branch `card/mosje-roster-7nov` and paste everything below the line.

---

We're starting **Obby Card Game V5**. This is the official name from now on. Read this whole message before you do anything.

## Where you are
You've been building "Obby Card Game 2.0" on the branch `obby-2.0` (GSD milestone v2.0, slice A). Phases 53 to 64.1 are done and live at https://eightytwenty.nl/obbycardgame2/ as `2.0-A.3`: the 2.0 engine, all 183 cards of the 10 Oct design, the bot, the 2.0 card faces, the tap-first board, the lobby and game-over screens, the deck-matrix simulation, the FTP deploy, and the slot markers of 64.1.

That build follows the **10 Oct design** (`Obby Card Game 2.0 - Card List.md` and the 10 Oct Claude Code Handoff). Between 30 Oct and 15 Nov, Gandalf and Claude reworked the design in design chats. **That reworked design is V5.** Your job is to bring the live game to V5, starting with the rules and the three starter decks, so Gandalf can playtest it online.

This branch, `card/mosje-roster-7nov`, already contains everything on `obby-2.0`, plus PR #12 (the Physical / Creative rename), the 7 Nov roster in code, and all the V5 design docs.

## What changed in the design (V5)
- **Win condition:** a Level 3 Mosje completes a **Personal Quest card** from its owner's deck. 26 Personal Quests, type-locked, with Needs / Pay / Roll lines and a pacing rule. "Hold Level 3" is gone.
- **Roster and types:** Physical / Digital / Creative. 26 Mosjes, each with a kit (Personal Quest, signature Piecie or pet, Place), standard and specialist trait curves, and a Power curve per type.
- **Rules:** level-up resets MP to 10; type triangle (+10 Power against the type you beat); Resilient as defence (−5 per Res ★); attachments (max 2 per Mosje); a 6-dice cap; one pile per player; costs paid on play; no MP cost can take a Mosje to 0; "Target" as a defined word; a new duration, Upkeep.
- **Cards:** 217 final texts after a wording pass and a balance round. 67 new cards, 98 changed, 17 renamed, 17 archived. Card text is all text, no glyphs.
- **Decks:** three 40-card starter decks (Physical, Digital, Creative) replace the 3 Example Decks.

## What carries over from your work
Keep and adapt; don't rewrite what works: the engine structure, the effect handlers (most V5 cards map onto them, see the template tags in `cards.json`), the bot, card faces and frames, the tap-first board, lobby and game-over, the sim harness, the deploy workflow, the mobile canary, and the version shown in the game.

## Read first, in this order
1. `CLAUDE.md` (repo rules).
2. `docs/obby-2.0/handover/README.md`: scope, data work, engine work, tests, what is still open.
3. `docs/obby-2.0/handover/rules.md`: the V5 rules.
4. `docs/obby-2.0/handover/cards.json` and `card-list.md`: every V5 card with its text, cost, rarity, template tags, and the name it has in `src/data` today.
5. `docs/obby-2.0/starter-decks-draft.md`: the three starter decks.
6. `.planning/STATE.md` and `.planning/ROADMAP.md`. **Note:** STATE.md still says "next: Phase 63", but Phases 63, 64 and 64.1 are on the branch. Reconcile the planning files first.

The 10 Oct Card List, the 10 Oct Claude Code Handoff and the phase docs carry a "Superseded" banner. Don't follow them.

## Scope
- **Now:** the V5 rules and the three starter decks (`"set": "starter"` / `"starter": true` in `cards.json`), playable online.
- **Not now:** booster cards (not FINAL until Gandalf has played), the 38 general Quests (keep them as they are, apart from the type and trait renames; their own pass comes later, see `docs/obby-2.0/names-round-todo.md`), and Ultimate Mosjes (no card designed).
- **Done means:** Gandalf opens the site, sees the V5 version number, picks each of the three starter decks, and plays a full game against the bot to a Personal Quest win.

## How to work: GSD
Use the GSD workflow this repo already uses (`.planning/`, the `/gsd-*` commands; if a command name differs from the ones below, use the matching one).

1. **New milestone:** "v5.0 — Obby Card Game V5: starter decks online". Propose the phases, then ask Gandalf to confirm them before you plan any phase.
2. **Every phase:** discuss (`/gsd-discuss-phase`) → for UI phases, a UI spec (`/gsd-ui-phase`) → plan (`/gsd-plan-phase`) → execute (`/gsd-execute-phase`) → verify (`/gsd-verify-work`). Never skip the discuss step.
3. **A phase order to start from** (a proposal; adjust it with Gandalf):
   1. Planning reconcile, the V5 versioning, and the branch plan (how PR #12 and this branch reach `obby-2.0`).
   2. Card data: V5 Mosjes, starter Personal Quests and starter cards into `src/data`; archive and renames; the starter decks; rewrite the 35 tests that pin the old roster.
   3. Rules engine: Personal Quest card type and win, level-up to 10, triangle, Resilient, attachments, Target, durations, costs, dice cap, one pile.
   4. Card effects for the starter cards.
   5. UI: Personal Quest card face, attachments on Mosje tiles, attack preview (+10 triangle, shield −N), all-text card faces, starter decks in the lobby.
   6. Bot and sim on the V5 starter decks.
   7. Release: deploy, live smoke check, Gandalf plays.

## Ask Gandalf when you're unsure
Gandalf is a UX designer, not a coder. Explain choices in plain words.
- **Ask with AskUserQuestion:** 2–4 options per question, your recommendation first and marked "(Recommended)", one line per option on what it leads to. Group up to 4 questions per round.
- **Ask, don't guess,** when a card text is unclear, a rule has a gap, the docs and the code disagree, or a choice changes what the player sees. Write each answer back into the docs (`handover/rules.md`, or a "Rulings" section), not only into code.
- **For UI choices,** show him options (screens or card mockups) before you build.

## Versioning (V5)
Proposal; confirm it with Gandalf in the first discuss.
- **Name:** the product is **V5**. V4 stays on `main` at eightytwenty.nl/cardgame2026, untouched.
- **Version number:** `APP_VERSION` in `src/version.js` becomes `5.<minor>.<patch>`, shown as "V5.2.1" in the lobby and on the game page. Minor = each phase release that changes what Gandalf can play; patch = each fix deploy. The first V5 deploy is `5.0.0`. Update `tests/shell/app-version.test.ts`, which asserts the `2.0-` prefix today.
- **Git tags:** tag every deploy on `obby-2.0` as `v5.<minor>.<patch>`.
- **Changelog:** keep `docs/obby-2.0/CHANGELOG-V5.md`. One entry per version, in plain words for Gandalf: what changed for the player, which rules and cards, and the GSD phase it came from. He refers to builds by this number when he reports a bug.
- **Keep** the branch name `obby-2.0`, the URL `/obbycardgame2` and the deploy workflow: renaming them breaks the deploy and his links. Ask him whether he wants a `/v5` URL later.

## Rules that stay
Everything in `CLAUDE.md` applies: work on a branch; open a PR into `obby-2.0` and merge only when tests are green (the deploy has no test gate, so whatever lands on `obby-2.0` goes live); never merge `obby-2.0` into `main`; reproduce every bug in the browser before fixing it; run the 3-step verification before every commit; one `.js` engine; never read `/_archive/`; bump the version for every shipped change.

## Your first reply
1. In at most 10 lines: what you read, and where the docs and the code disagree.
2. The questions you need answered before you plan (AskUserQuestion, with recommendations).
3. Then start the milestone with the discuss step of the first phase.
