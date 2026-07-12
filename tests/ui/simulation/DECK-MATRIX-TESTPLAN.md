# Deck Matrix Testplan — round-robin bot-vs-bot deck balance stats

**Status: BUILT & RUNNING — spec, aggregation and reports are committed**
**Date: 2026-07-06 (built 2026-07-06, bot strategy layer added 2026-07-08)**

> Since 2026-07-08 both bots run the strategy layer in `src/bot/strategy/`
> (deck profiles, quest risk model, real dice thresholds, 20 MP quest cost,
> combo-tag activation ordering). The results file also carries a
> **Bot quality** section aggregated from `[BOT] METRIC` console lines
> (quest attempts vs skips, confidence, setup activations, roll outcomes).
> Results from before/after that date are not directly comparable.

## Goal
Measure which player-facing decks over/underperform by letting the game's own
smart bot play every deck against every other deck, 10 games per pairing, in
the real browser engine (visual tester), and produce a win-rate leaderboard.

## Why bot-vs-bot (not human-scripted turns)
The existing full-game specs drive a passive/scripted human vs the bot — that
measures the bot's deck, not a fair matchup. `?botvsbot=true` has the same
smart bot (`driveBotTurnSteps`) pilot BOTH sides, so deck strength is the only
variable. This mode + the game-collector already exist and are proven by
`sim-botvsbot.spec.js`.

## Scope: which decks
The 5 player-facing synergy duo decks (from `playerFacingDecks.js`) — these are
what players actually pick, so they are the balance target:

| Key | Deck ID            | Name                              |
|-----|--------------------|-----------------------------------|
| CB  | DUO_COERT_BINTI    | Coert & Binti — Winston's Kitchen |
| GM  | DUO_GANDOE_MICHELLE| Gandoe & Michelle — The Box       |
| CY  | DUO_CHRIS_YOURI    | Chris & Youri — Instant Setup     |
| JA  | DUO_JISCA_ALYSSA   | Jisca & Alyssa — Encore Bulldozer |
| WC  | DUO_WEST_CLESS     | West & Cless — Calculated Chaos   |

The 3 legacy decks (PHYSICAL_FORCE, DIGITAL_CONTROL, ARTISTIC_RHYTHM) are
bot/test fixtures, not player-facing — excluded by default. (Open question for
review: include them for an 8-deck, 28-pairing matrix?)

## Matchup matrix — 10 unordered pairings × 10 games = 100 games

To cancel first-player advantage, each pairing's 10 games are seat-mirrored:
5 games with the row deck as player_1 (goes first), 5 with the column deck as
player_1.

|        | CB        | GM        | CY        | JA        | WC        |
|--------|-----------|-----------|-----------|-----------|-----------|
| **CB** | —         | 10 (5+5)  | 10 (5+5)  | 10 (5+5)  | 10 (5+5)  |
| **GM** |           | —         | 10 (5+5)  | 10 (5+5)  | 10 (5+5)  |
| **CY** |           |           | —         | 10 (5+5)  | 10 (5+5)  |
| **JA** |           |           |           | —         | 10 (5+5)  |
| **WC** |           |           |           |           | —         |

- No mirror matches (CB vs CB) — self-play tells us nothing about relative strength.
- Each deck plays 40 games total (4 opponents × 10).

## Implementation

### New file: `tests/ui/simulation/sim-deck-matrix.spec.js`
Modeled on `sim-botvsbot.spec.js`:
1. Generate the 10 unordered pairings from the 5 duo deck IDs in code (no
   hand-written list — adding a 6th deck later means editing one array).
2. For each pairing, run `GAMES_PER_PAIRING` (default 10) tests: games 1–5
   seat order (A,B), games 6–10 seat order (B,A).
3. Each test: `gotoBotVsBot(page, deckP1, deckP2)` (Firebase blocked, LOCAL
   mode, `fast=true`), wait for `#reward-overlay` (90s), build a GameRecord
   via the existing collector, screenshot the end screen.
4. Env override `GAMES_PER_PAIRING` (e.g. `=1`) for a quick 10-game smoke run
   before committing to the full 100.

### Aggregation (new, in game-collector.js or a sibling one-function file)
The existing `aggregateRecords` is player_1-centric. Add deck-centric stats:
- Normalize each record's winner from player_1/player_2 to a **deck ID**
  (we know which deck sat in which seat per game).
- Per deck: games, wins, losses, win rate, avg game length (turns), win-reason
  breakdown (LEVEL_3 / KNOCKOUT / QUEST_MASTER / MOMENTUM_DOMINATION),
  win rate when going first vs second.
- Per pairing: 10-game head-to-head score (e.g. CB 7–3 GM).

### Outputs
- `tests/ui/simulation/sim-deck-matrix-report.json` — full records + summaries
  (written in `test.afterAll`, so partial runs still produce a report).
- `tests/ui/simulation/sim-deck-matrix-results.md` — human-readable results:
  leaderboard table sorted by win rate + head-to-head matrix + win-reason mix.
- Console leaderboard at the end of the run.

### Config change
Add `**/sim-deck-matrix.spec.js` to the `sim` project's `testMatch` in
`playwright.config.js` (headless, fast, timeout 180s, workers=1 — sim tests
share port 5500 and are not parallel-safe).

## Pass/fail criteria (per game)
- No page errors (collector `getErrors()` empty).
- Win reason is one of the 4 valid conditions.
- Game completes within the 180s test timeout.
A failed/hung game is a finding in itself (engine bug with that matchup); it
fails that test but the suite continues, and the report counts completed games
only, with a `failedGames` count.

## Runtime estimate
Existing 30-game sim runs games in roughly 30–90s each in fast mode, serial.
100 games ≈ **1–2.5 hours** unattended. Mitigations: run overnight or start
with `GAMES_PER_PAIRING=2` (20 games, ~20–40 min) for a first signal.

## What "outperforms/underperforms" means (interpretation guide)
- 10 games per pairing is a small sample: a 7–3 result is suggestive, not
  proof (±~15% noise on win rates). The 40-games-per-deck aggregate is the
  more trustworthy number.
- Flag any deck with aggregate win rate ≥ 60% (overperformer) or ≤ 40%
  (underperformer) as a balance-review candidate.
- Also watch win-reason mix (e.g. a deck that only wins by KNOCKOUT) and avg
  game length outliers.
- Caveat: this measures decks *as piloted by the bot*. A deck whose synergy
  the bot doesn't use well will underrate.

## Execution steps (after plan approval)
1. Branch: `test/deck-matrix-simulation`.
2. Write the spec + deck-level aggregation + config change.
3. Verify per CLAUDE.md: `node --check` the touched JS, `npm test` (unit suite
   unaffected but must stay green).
4. Smoke: `GAMES_PER_PAIRING=1 npx playwright test --project=sim tests/ui/simulation/sim-deck-matrix.spec.js` (10 games).
5. Full run: same command without the env var (100 games).
6. Deliver `sim-deck-matrix-results.md` + a summary of over/underperformers.
