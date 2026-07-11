# Deck Matrix Results — bot-vs-bot round-robin

Generated: 2026-07-11T22:29:40.419Z
Games: 100/100 completed | 10 per pairing, seat-mirrored

## Leaderboard (by overall win rate)

| # | Deck | W–L | Win rate | As 1st | As 2nd | Avg turns | Win reasons |
|---|------|-----|----------|--------|--------|-----------|-------------|
| 1 | CB Coert & Binti | 23–17 | 57.5% | 70% | 45% | 8.4 | LEVEL_3×20, KNOCKOUT×3 |
| 2 | GM Gandoe & Michelle | 22–18 | 55% | 70% | 40% | 6.9 | LEVEL_3×16, KNOCKOUT×6 |
| 3 | CY Chris & Youri | 19–21 | 47.5% | 55% | 40% | 7.8 | LEVEL_3×8, KNOCKOUT×9, QUEST_MASTER×2 |
| 4 | WC West & Cless | 19–21 | 47.5% | 65% | 30% | 8.1 | LEVEL_3×16, KNOCKOUT×3 |
| 5 | JA Jisca & Alyssa | 17–23 | 42.5% | 65% | 20% | 8.2 | LEVEL_3×13, KNOCKOUT×4 |

## Head-to-head (row wins – column wins)

| | CB | GM | CY | JA | WC |
|---|---|---|---|---|---|
| **CB** | — | 6–4 | 4–6 | 7–3 | 6–4 |
| **GM** | 4–6 | — | 6–4 | 6–4 | 6–4 |
| **CY** | 6–4 | 4–6 | — | 5–5 | 4–6 |
| **JA** | 3–7 | 4–6 | 5–5 | — | 5–5 |
| **WC** | 4–6 | 4–6 | 6–4 | 5–5 | — |

## Bot quality (per deck, quest decisions)

| Deck | Attempts | Skips | Attempt rate | Avg confidence | Avg MP at decision | Setup acts/decision | Roll success | 2nd Mosje/game | Top skip reason |
|------|----------|-------|--------------|----------------|--------------------|---------------------|--------------|-----------------|-----------------|
| CB Coert & Binti | 200 | 105 | 65.6% | 0.45 | 71.4 | 0.89 | 55.5% | 0.82 | too-risky×71 |
| GM Gandoe & Michelle | 163 | 101 | 61.7% | 0.5 | 74.5 | 0.59 | 52.1% | 0.68 | cannot-afford-cost×47 |
| CY Chris & Youri | 178 | 96 | 65% | 0.53 | 63.8 | 1.03 | 59% | 0.85 | too-risky×44 |
| JA Jisca & Alyssa | 171 | 125 | 57.8% | 0.5 | 62.3 | 0.51 | 58.5% | 0.75 | too-risky×50 |
| WC West & Cless | 191 | 106 | 64.3% | 0.45 | 63.8 | 0.49 | 53.9% | 0.8 | too-risky×72 |

- *Avg confidence* = mean estimated success chance at decision time; *roll success* = what the dice actually delivered. *2nd Mosje/game* = how often the bot plays its second Mosje onto the field per game (0 here would mean duo synergies structurally cannot trigger — see src/bot/botDriver.js Phase 0).

## Reading guide
- 10 games per pairing is a small sample (±~15% noise); trust the 40-game per-deck aggregate over any single pairing.
- ⚠️ over = aggregate win rate ≥ 60%, ⚠️ under = ≤ 40% — balance-review candidates.
- Stats measure decks *as piloted by the smart bot*; synergies the bot ignores will underrate.
