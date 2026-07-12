# Deck Matrix Results — bot-vs-bot round-robin

Generated: 2026-07-12T01:17:40.084Z
Games: 10/10 completed | 1 per pairing, seat-mirrored

## Leaderboard (by overall win rate)

| # | Deck | W–L | Win rate | As 1st | As 2nd | Avg turns | Win reasons |
|---|------|-----|----------|--------|--------|-----------|-------------|
| 1 | CY Chris & Youri ⚠️ over | 3–1 | 75% | 100% | 50% | 8.3 | LEVEL_3×3 |
| 2 | CB Coert & Binti | 2–2 | 50% | 50% | null% | 11.5 | LEVEL_3×2 |
| 3 | JA Jisca & Alyssa | 2–2 | 50% | 0% | 66.7% | 5.8 | LEVEL_3×2 |
| 4 | WC West & Cless | 2–2 | 50% | null% | 50% | 7 | LEVEL_3×1, KNOCKOUT×1 |
| 5 | GM Gandoe & Michelle ⚠️ under | 1–3 | 25% | 33.3% | 0% | 6.5 | LEVEL_3×1 |

## Head-to-head (row wins – column wins)

| | CB | GM | CY | JA | WC |
|---|---|---|---|---|---|
| **CB** | — | 1–0 | 0–1 | 0–1 | 1–0 |
| **GM** | 0–1 | — | 1–0 | 0–1 | 0–1 |
| **CY** | 1–0 | 0–1 | — | 1–0 | 1–0 |
| **JA** | 1–0 | 1–0 | 0–1 | — | 0–1 |
| **WC** | 0–1 | 1–0 | 0–1 | 1–0 | — |

## Bot quality (per deck, quest decisions)

| Deck | Attempts | Skips | Attempt rate | Avg confidence | Avg MP at decision | Setup acts/decision | Roll success | 2nd Mosje/game | Top skip reason |
|------|----------|-------|--------------|----------------|--------------------|---------------------|--------------|-----------------|-----------------|
| CB Coert & Binti | 31 | 13 | 70.5% | 0.49 | 78.5 | 0.97 | 48.4% | 1 | requirement-not-met×9 |
| GM Gandoe & Michelle | 15 | 10 | 60% | 0.51 | 63.4 | 0.75 | 53.3% | 0.75 | cannot-afford-cost×5 |
| CY Chris & Youri | 25 | 6 | 80.6% | 0.6 | 65.5 | 1.18 | 80% | 1 | requirement-not-met×3 |
| JA Jisca & Alyssa | 15 | 7 | 68.2% | 0.66 | 53.1 | 0.44 | 73.3% | 0.75 | cannot-afford-cost×4 |
| WC West & Cless | 12 | 12 | 50% | 0.46 | 60.7 | 0.48 | 66.7% | 0.5 | too-risky×10 |

- *Avg confidence* = mean estimated success chance at decision time; *roll success* = what the dice actually delivered. *2nd Mosje/game* = how often the bot plays its second Mosje onto the field per game (0 here would mean duo synergies structurally cannot trigger — see src/bot/botDriver.js Phase 0).

## Reading guide
- 10 games per pairing is a small sample (±~15% noise); trust the 4-game per-deck aggregate over any single pairing.
- ⚠️ over = aggregate win rate ≥ 60%, ⚠️ under = ≤ 40% — balance-review candidates.
- Stats measure decks *as piloted by the smart bot*; synergies the bot ignores will underrate.
