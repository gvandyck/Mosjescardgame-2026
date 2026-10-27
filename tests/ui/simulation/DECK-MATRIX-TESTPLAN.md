# Deck Matrix Testplan (2.0) - bot-vs-bot simulation

Status: built in Phase 64-06 (D-23, D-25, D-26, D-27). Replaces the V4 duo-deck matrix.

## What runs
`npm run test:sim` = the headless `sim` project (workers 1) = ONE spec, `sim-deck-matrix.spec.js`.
The 3 Example Decks (Taksen TK, Regelaars RG, Creatievelingen CV) play all 9 ordered matchups
(3 pairings in both seat orders + 3 mirrors), 10 games each = 90 games, plus 1 gate test (91 tests).
The game's own bot drives both seats (`?botvsbot=true&fast=true&testMode=true`); seat 1 = the first deck named.
Harness: `tests/helpers/playBotGame.js` (shared with U11 `tests/ui/full-game-2.0.spec.js`).

## Gate (the only thing that fails the run, D-26)
- any crash: page error, console error, bot-driver throw, `engine-refused` metric, win reason other than LEVEL_3 / KNOCKOUT
- a lost record (fewer than 90 games recorded), or a timeout rate of 25 % or more
- Timeout = not finished by round 80 or 120 s (`tests/helpers/simCaps.js`). The engine has no turn cap; 80 is far above the
  measured median 22 / p95 48, so only a real stall reaches it. Never raise the caps to make a run pass.

## Report only (D-27)
`sim-deck-matrix-results.md` (tracked) and `sim-deck-matrix-report.json` (gitignored, all games + stats):
per-deck and per-seat win rate, median / p90 rounds, attack share, win-reason split, bot quality, and a
"Sanity vs desk sim" section (median about 15 rounds, about 74 % attacks, seat 1 about 55 %). A flagged row means
"check for a rules bug", never a failure. Balancing is parked.

## Seeds and smoke
Game seed = base + matchupIndex x 100 + game number (base 64000). `SIM_SEED=<n>` changes the base,
`SIM_SEED=random` leaves Math.random unseeded. `GAMES_PER_MATCHUP=1 npm run test:sim` is a 9-game smoke.
Seeding is best effort (UI code also draws random numbers), so a crash is replayed by its seed plus the matchup.

## Reading the report
10 games per ordered matchup is a small sample (about +/-15 % noise): read the per-deck rows, not one matchup cell.
The report math (aggregation, gate, sanity rows, markdown) is unit tested in `tests/sim/deck-matrix-report.test.ts`.
