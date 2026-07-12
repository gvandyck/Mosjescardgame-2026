# Deck Matrix Results — bot-vs-bot round-robin

Generated: 2026-07-12T02:15:03.337Z
Games: 100/100 completed | 10 per pairing, seat-mirrored

## Leaderboard (by overall win rate)

| # | Deck | W–L | Win rate | As 1st | As 2nd | Avg turns | Win reasons |
|---|------|-----|----------|--------|--------|-----------|-------------|
| 1 | GM Gandoe & Michelle | 22–18 | 55% | 70% | 40% | 6.4 | LEVEL_3×12, KNOCKOUT×10 |
| 2 | CB Coert & Binti | 20–20 | 50% | 55% | 45% | 8.2 | LEVEL_3×19, KNOCKOUT×1 |
| 3 | JA Jisca & Alyssa | 20–20 | 50% | 60% | 40% | 7.2 | LEVEL_3×11, KNOCKOUT×9 |
| 4 | CY Chris & Youri | 19–21 | 47.5% | 60% | 35% | 8.1 | LEVEL_3×14, KNOCKOUT×4, QUEST_MASTER×1 |
| 5 | WC West & Cless | 19–21 | 47.5% | 60% | 35% | 7.8 | LEVEL_3×16, KNOCKOUT×3 |

## Head-to-head (row wins – column wins)

| | CB | GM | CY | JA | WC |
|---|---|---|---|---|---|
| **CB** | — | 5–5 | 5–5 | 5–5 | 5–5 |
| **GM** | 5–5 | — | 5–5 | 5–5 | 7–3 |
| **CY** | 5–5 | 5–5 | — | 5–5 | 4–6 |
| **JA** | 5–5 | 5–5 | 5–5 | — | 5–5 |
| **WC** | 5–5 | 3–7 | 6–4 | 5–5 | — |

## Bot quality (per deck, quest decisions)

| Deck | Attempts | Skips | Attempt rate | Avg confidence | Avg MP at decision | Setup acts/decision | Roll success | 2nd Mosje/game | Top skip reason |
|------|----------|-------|--------------|----------------|--------------------|---------------------|--------------|-----------------|-----------------|
| CB Coert & Binti | 203 | 92 | 68.8% | 0.46 | 77.5 | 0.98 | 57.6% | 0.88 | too-risky×42 |
| GM Gandoe & Michelle | 118 | 127 | 48.2% | 0.43 | 69.6 | 0.63 | 52.5% | 0.63 | cannot-afford-cost×52 |
| CY Chris & Youri | 183 | 108 | 62.9% | 0.51 | 65.3 | 0.95 | 62.3% | 0.85 | too-risky×42 |
| JA Jisca & Alyssa | 155 | 104 | 59.8% | 0.5 | 61.6 | 0.47 | 56.8% | 0.72 | cannot-afford-cost×49 |
| WC West & Cless | 170 | 119 | 58.8% | 0.46 | 64.9 | 0.6 | 60% | 0.78 | too-risky×60 |

- *Avg confidence* = mean estimated success chance at decision time; *roll success* = what the dice actually delivered. *2nd Mosje/game* = how often the bot plays its second Mosje onto the field per game (0 here would mean duo synergies structurally cannot trigger — see src/bot/botDriver.js Phase 0).

## Reading guide
- 10 games per pairing is a small sample (±~15% noise); trust the 40-game per-deck aggregate over any single pairing.
- ⚠️ over = aggregate win rate ≥ 60%, ⚠️ under = ≤ 40% — balance-review candidates.
- Stats measure decks *as piloted by the smart bot*; synergies the bot ignores will underrate.
