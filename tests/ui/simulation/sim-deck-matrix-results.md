# Deck Matrix Results — bot-vs-bot round-robin

Generated: 2026-07-11T22:22:12.986Z
Games: 10/10 completed | 1 per pairing, seat-mirrored

## Leaderboard (by overall win rate)

| # | Deck | W–L | Win rate | As 1st | As 2nd | Avg turns | Win reasons |
|---|------|-----|----------|--------|--------|-----------|-------------|
| 1 | CB Coert & Binti ⚠️ over | 3–1 | 75% | 75% | null% | 9.8 | LEVEL_3×3 |
| 2 | GM Gandoe & Michelle | 2–2 | 50% | 66.7% | 0% | 7.8 | LEVEL_3×2 |
| 3 | CY Chris & Youri | 2–2 | 50% | 100% | 0% | 6.3 | LEVEL_3×1, KNOCKOUT×1 |
| 4 | JA Jisca & Alyssa | 2–2 | 50% | 100% | 33.3% | 12.3 | LEVEL_3×2 |
| 5 | WC West & Cless ⚠️ under | 1–3 | 25% | null% | 25% | 8.5 | LEVEL_3×1 |

## Head-to-head (row wins – column wins)

| | CB | GM | CY | JA | WC |
|---|---|---|---|---|---|
| **CB** | — | 1–0 | 1–0 | 0–1 | 1–0 |
| **GM** | 0–1 | — | 1–0 | 1–0 | 0–1 |
| **CY** | 0–1 | 0–1 | — | 1–0 | 1–0 |
| **JA** | 1–0 | 0–1 | 0–1 | — | 1–0 |
| **WC** | 0–1 | 1–0 | 0–1 | 0–1 | — |

## Bot quality (per deck, quest decisions)

| Deck | Attempts | Skips | Attempt rate | Avg confidence | Avg MP at decision | Setup acts/decision | Roll success | 2nd Mosje/game | Top skip reason |
|------|----------|-------|--------------|----------------|--------------------|---------------------|--------------|-----------------|-----------------|
| CB Coert & Binti | 30 | 6 | 83.3% | 0.53 | 72.4 | 0.94 | 56.7% | 1 | too-risky×4 |
| GM Gandoe & Michelle | 15 | 16 | 48.4% | 0.44 | 63.3 | 0.57 | 40% | 1 | cannot-afford-cost×5 |
| CY Chris & Youri | 12 | 9 | 57.1% | 0.5 | 64.4 | 1.17 | 66.7% | 0.75 | requirement-not-met×4 |
| JA Jisca & Alyssa | 27 | 18 | 60% | 0.44 | 71.5 | 0.49 | 51.9% | 1 | too-risky×10 |
| WC West & Cless | 19 | 11 | 63.3% | 0.47 | 66.7 | 0.48 | 52.6% | 0.75 | too-risky×7 |

- *Avg confidence* = mean estimated success chance at decision time; *roll success* = what the dice actually delivered. *2nd Mosje/game* = how often the bot plays its second Mosje onto the field per game (0 here would mean duo synergies structurally cannot trigger — see src/bot/botDriver.js Phase 0).

## Reading guide
- 10 games per pairing is a small sample (±~15% noise); trust the 4-game per-deck aggregate over any single pairing.
- ⚠️ over = aggregate win rate ≥ 60%, ⚠️ under = ≤ 40% — balance-review candidates.
- Stats measure decks *as piloted by the smart bot*; synergies the bot ignores will underrate.
