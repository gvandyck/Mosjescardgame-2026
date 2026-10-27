# Deck Matrix Results — 2.0 bot-vs-bot (3 Example Decks)

Generated: 2026-10-27T16:14:03.503Z
Games: 90/90 recorded | 10 per ordered matchup | seed base 64000 (game seed = base + matchup x 100 + game) | headless

## Gate (D-26)

Verdict: **PASS** (only a crash, a lost game or a timeout rate of 25 % or more fails the run)

- Caps: a game that is not finished by round 80 or by 120 s is a timeout.
- Crashes: 0 (pageerror, console error, bot-driver throw, engine-refused, invalid win reason)
- Timeout rate: 0% (0 of 90; limit: under 25%)
- Games recorded: 90/90

## Decks (non-mirror games)

| Deck | Games | W-L | Win rate | As seat 1 | As seat 2 | Median rounds | Win reasons |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Taksen | 40 | 27-13 | 67.5% | 70% | 65% | 23 | LEVEL_3 x9, KNOCKOUT x18 |
| Regelaars | 40 | 16-24 | 40% | 40% | 40% | 24 | KNOCKOUT x8, LEVEL_3 x8 |
| Creatievelingen | 40 | 17-23 | 42.5% | 55% | 30% | 21.5 | LEVEL_3 x17 |

## Ordered matchups

Rows = seat 1 deck, columns = seat 2 deck, cell = seat-1 wins - seat-2 wins. The diagonal is the mirror matchup.

| Seat 1 \ Seat 2 | TK | RG | CV |
| --- | --- | --- | --- |
| **TK** | 6 - 4 | 5 - 5 | 9 - 1 |
| **RG** | 3 - 7 | 2 - 8 | 5 - 5 |
| **CV** | 4 - 6 | 7 - 3 | 4 - 6 |

## Game shape

| Games | Finished | Median rounds | p90 rounds | Seat 1 win rate | Attack share | Win reasons |
| --- | --- | --- | --- | --- | --- | --- |
| 90 | 90 | 22 | 40 | 50% | 75.4% | KNOCKOUT x35, LEVEL_3 x55 |

## Bot quality (per deck, mirrors included)

| Deck | Attacks | Quest rolls | Quest win rate | Attack share | 2nd Mosje/game | Reactions | Elim. strikes | Action skips (top reason) | Engine refused |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Taksen | 1324 | 328 | 60.1% | 80.1% | 2.15 | 191 | 0 | 793 (This Mosje cannot act x410) | 0 |
| Regelaars | 1250 | 301 | 68.4% | 80.6% | 2.17 | 71 | 0 | 757 (no-positive-swing x414) | 0 |
| Creatievelingen | 460 | 362 | 73.5% | 56% | 1.75 | 124 | 0 | 790 (no-positive-swing x685) | 0 |

## Sanity vs desk sim (report only)

Desk sim (handoff 6d): median about 15 rounds, about 74% attacks, seat 1 about 55%. A flag means "look at the rules", never a failed run (D-27, balancing parked).

| Metric | This run | Desk sim | Band | Verdict |
| --- | --- | --- | --- | --- |
| median rounds | 22 | 15 | 10-20 | FLAGGED: check for a rules bug |
| attack share % | 75.4 | 74 | 64-84 | in line |
| seat 1 win rate % | 50 | 55 | 45-65 | in line |

## Reading guide
- 10 games per ordered matchup is a small sample (about +/-15% noise): trust the per-deck rows over any single matchup cell.
- Only the gate (crashes, lost games, timeout rate) can fail the run. Win rates, rounds, attack share and the sanity rows are report only.
- Stats measure decks as piloted by the bot; Taksen, Regelaars and Creatievelingen differ in how well the bot can use them.
