# Deck Matrix Results — bot-vs-bot round-robin

Generated: 2026-07-12T01:24:32.781Z
Games: 100/100 completed | 10 per pairing, seat-mirrored

## Leaderboard (by overall win rate)

| # | Deck | W–L | Win rate | As 1st | As 2nd | Avg turns | Win reasons |
|---|------|-----|----------|--------|--------|-----------|-------------|
| 1 | WC West & Cless ⚠️ over | 25–15 | 62.5% | 80% | 45% | 6.3 | LEVEL_3×13, KNOCKOUT×12 |
| 2 | CB Coert & Binti | 21–19 | 52.5% | 55% | 50% | 8.8 | LEVEL_3×20, KNOCKOUT×1 |
| 3 | GM Gandoe & Michelle | 20–20 | 50% | 50% | 50% | 7 | LEVEL_3×10, KNOCKOUT×10 |
| 4 | JA Jisca & Alyssa | 19–21 | 47.5% | 70% | 25% | 7.8 | KNOCKOUT×6, LEVEL_3×13 |
| 5 | CY Chris & Youri ⚠️ under | 15–25 | 37.5% | 50% | 25% | 8.1 | LEVEL_3×11, KNOCKOUT×4 |

## Head-to-head (row wins – column wins)

| | CB | GM | CY | JA | WC |
|---|---|---|---|---|---|
| **CB** | — | 7–3 | 6–4 | 4–6 | 4–6 |
| **GM** | 3–7 | — | 8–2 | 5–5 | 4–6 |
| **CY** | 4–6 | 2–8 | — | 6–4 | 3–7 |
| **JA** | 6–4 | 5–5 | 4–6 | — | 4–6 |
| **WC** | 6–4 | 6–4 | 7–3 | 6–4 | — |

## Bot quality (per deck, quest decisions)

| Deck | Attempts | Skips | Attempt rate | Avg confidence | Avg MP at decision | Setup acts/decision | Roll success | 2nd Mosje/game | Top skip reason |
|------|----------|-------|--------------|----------------|--------------------|---------------------|--------------|-----------------|-----------------|
| CB Coert & Binti | 227 | 90 | 71.6% | 0.46 | 75.2 | 0.95 | 51.5% | 0.82 | requirement-not-met×48 |
| GM Gandoe & Michelle | 152 | 118 | 56.3% | 0.48 | 68.5 | 0.57 | 53.9% | 0.78 | cannot-afford-cost×46 |
| CY Chris & Youri | 172 | 115 | 59.9% | 0.51 | 65 | 1.04 | 55.2% | 0.82 | requirement-not-met×51 |
| JA Jisca & Alyssa | 167 | 110 | 60.3% | 0.52 | 61.9 | 0.48 | 60.5% | 0.65 | cannot-afford-cost×51 |
| WC West & Cless | 127 | 94 | 57.5% | 0.44 | 65.7 | 0.62 | 60.6% | 0.68 | too-risky×45 |

- *Avg confidence* = mean estimated success chance at decision time; *roll success* = what the dice actually delivered. *2nd Mosje/game* = how often the bot plays its second Mosje onto the field per game (0 here would mean duo synergies structurally cannot trigger — see src/bot/botDriver.js Phase 0).

## Reading guide
- 10 games per pairing is a small sample (±~15% noise); trust the 40-game per-deck aggregate over any single pairing.
- ⚠️ over = aggregate win rate ≥ 60%, ⚠️ under = ≤ 40% — balance-review candidates.
- Stats measure decks *as piloted by the smart bot*; synergies the bot ignores will underrate.
