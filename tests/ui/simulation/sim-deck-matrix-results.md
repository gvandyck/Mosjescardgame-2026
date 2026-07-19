# Deck Matrix Results — bot-vs-bot round-robin

Generated: 2026-07-18T20:29:09.048Z
Games: 100/100 completed | 10 per pairing, seat-mirrored

## Leaderboard (by overall win rate)

| # | Deck | W–L | Win rate | As 1st | As 2nd | Avg turns | Win reasons |
|---|------|-----|----------|--------|--------|-----------|-------------|
| 1 | JA Jisca & Alyssa ⚠️ over | 26–14 | 65% | 75% | 55% | 7.7 | KNOCKOUT×6, LEVEL_3×20 |
| 2 | GM Gandoe & Michelle | 23–17 | 57.5% | 70% | 45% | 7.8 | LEVEL_3×15, KNOCKOUT×7, QUEST_MASTER×1 |
| 3 | CY Chris & Youri | 20–20 | 50% | 50% | 50% | 7.9 | LEVEL_3×12, QUEST_MASTER×1, KNOCKOUT×7 |
| 4 | CB Coert & Binti ⚠️ under | 16–24 | 40% | 35% | 45% | 10.5 | LEVEL_3×13, KNOCKOUT×3 |
| 5 | WC West & Cless ⚠️ under | 15–25 | 37.5% | 40% | 35% | 8.1 | LEVEL_3×8, KNOCKOUT×6, QUEST_MASTER×1 |

## Head-to-head (row wins – column wins)

| | CB | GM | CY | JA | WC |
|---|---|---|---|---|---|
| **CB** | — | 2–8 | 7–3 | 3–7 | 4–6 |
| **GM** | 8–2 | — | 5–5 | 3–7 | 7–3 |
| **CY** | 3–7 | 5–5 | — | 5–5 | 7–3 |
| **JA** | 7–3 | 7–3 | 5–5 | — | 7–3 |
| **WC** | 6–4 | 3–7 | 3–7 | 3–7 | — |

## Bot quality (per deck, quest decisions)

| Deck | Attempts | Skips | Attempt rate | Avg confidence | Avg MP at decision | Setup acts/decision | Roll success | 2nd Mosje/game | Top skip reason |
|------|----------|-------|--------------|----------------|--------------------|---------------------|--------------|-----------------|-----------------|
| CB Coert & Binti | 259 | 112 | 69.8% | 0.46 | 77.7 | 0.95 | 48.6% | 0.95 | too-risky×57 |
| GM Gandoe & Michelle | 169 | 127 | 57.1% | 0.45 | 69.2 | 0.61 | 52.7% | 0.63 | cannot-afford-cost×42 |
| CY Chris & Youri | 176 | 102 | 63.3% | 0.55 | 65.2 | 1.05 | 64.2% | 0.82 | too-risky×40 |
| JA Jisca & Alyssa | 198 | 82 | 70.7% | 0.54 | 70.8 | 0.54 | 60.6% | 0.75 | cannot-afford-cost×31 |
| WC West & Cless | 189 | 106 | 64.1% | 0.46 | 64.1 | 0.54 | 50.3% | 0.82 | too-risky×54 |

- *Avg confidence* = mean estimated success chance at decision time; *roll success* = what the dice actually delivered. *2nd Mosje/game* = how often the bot plays its second Mosje onto the field per game (0 here would mean duo synergies structurally cannot trigger — see src/bot/botDriver.js Phase 0).

## Reading guide
- 10 games per pairing is a small sample (±~15% noise); trust the 40-game per-deck aggregate over any single pairing.
- ⚠️ over = aggregate win rate ≥ 60%, ⚠️ under = ≤ 40% — balance-review candidates.
- Stats measure decks *as piloted by the smart bot*; synergies the bot ignores will underrate.
