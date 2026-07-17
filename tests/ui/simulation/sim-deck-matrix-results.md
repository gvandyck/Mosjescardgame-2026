# Deck Matrix Results — bot-vs-bot round-robin

Generated: 2026-07-16T21:12:57.113Z
Games: 100/100 completed | 10 per pairing, seat-mirrored

## Leaderboard (by overall win rate)

| # | Deck | W–L | Win rate | As 1st | As 2nd | Avg turns | Win reasons |
|---|------|-----|----------|--------|--------|-----------|-------------|
| 1 | JA Jisca & Alyssa | 22–18 | 55% | 65% | 45% | 7.2 | LEVEL_3×12, KNOCKOUT×8, QUEST_MASTER×2 |
| 2 | CY Chris & Youri | 21–19 | 52.5% | 55% | 50% | 7.4 | LEVEL_3×17, KNOCKOUT×4 |
| 3 | CB Coert & Binti | 20–20 | 50% | 45% | 55% | 8.8 | LEVEL_3×15, KNOCKOUT×5 |
| 4 | GM Gandoe & Michelle | 19–21 | 47.5% | 40% | 55% | 6.9 | LEVEL_3×12, KNOCKOUT×6, QUEST_MASTER×1 |
| 5 | WC West & Cless | 18–22 | 45% | 40% | 50% | 7.9 | QUEST_MASTER×1, LEVEL_3×12, KNOCKOUT×5 |

## Head-to-head (row wins – column wins)

| | CB | GM | CY | JA | WC |
|---|---|---|---|---|---|
| **CB** | — | 5–5 | 4–6 | 5–5 | 6–4 |
| **GM** | 5–5 | — | 4–6 | 3–7 | 7–3 |
| **CY** | 6–4 | 6–4 | — | 4–6 | 5–5 |
| **JA** | 5–5 | 7–3 | 6–4 | — | 4–6 |
| **WC** | 4–6 | 3–7 | 5–5 | 6–4 | — |

## Bot quality (per deck, quest decisions)

| Deck | Attempts | Skips | Attempt rate | Avg confidence | Avg MP at decision | Setup acts/decision | Roll success | 2nd Mosje/game | Top skip reason |
|------|----------|-------|--------------|----------------|--------------------|---------------------|--------------|-----------------|-----------------|
| CB Coert & Binti | 222 | 98 | 69.4% | 0.48 | 78.1 | 0.98 | 53.2% | 0.9 | too-risky×46 |
| GM Gandoe & Michelle | 145 | 122 | 54.3% | 0.46 | 65.9 | 0.69 | 54.5% | 0.75 | cannot-afford-cost×46 |
| CY Chris & Youri | 184 | 78 | 70.2% | 0.55 | 65 | 1.03 | 61.4% | 0.8 | too-risky×27 |
| JA Jisca & Alyssa | 166 | 95 | 63.6% | 0.52 | 65.4 | 0.49 | 59.6% | 0.78 | cannot-afford-cost×48 |
| WC West & Cless | 180 | 110 | 62.1% | 0.46 | 67.7 | 0.56 | 55.6% | 0.75 | too-risky×51 |

- *Avg confidence* = mean estimated success chance at decision time; *roll success* = what the dice actually delivered. *2nd Mosje/game* = how often the bot plays its second Mosje onto the field per game (0 here would mean duo synergies structurally cannot trigger — see src/bot/botDriver.js Phase 0).

## Reading guide
- 10 games per pairing is a small sample (±~15% noise); trust the 40-game per-deck aggregate over any single pairing.
- ⚠️ over = aggregate win rate ≥ 60%, ⚠️ under = ≤ 40% — balance-review candidates.
- Stats measure decks *as piloted by the smart bot*; synergies the bot ignores will underrate.
