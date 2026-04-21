# Simulation Report

## Summary

- Total games: 100
- Crashes: 0
- Timeouts: 28 (28.0% of games)

### Timeout Seeds

Seeds: 7, 10, 11, 12, 13, 14, 15, 18, 19, 21, 24, 25, 27, 28, 29, 33, 35, 39, 46, 49, 51, 54, 56, 60, 72, 86, 87, 90

## Win Rates by Matchup

| Matchup | P1 Wins | P2 Wins | Timeouts | Avg Turns |
|---------|---------|---------|----------|-----------|
| Physical Force vs Digital Control | 14 (42.4%) | 3 (9.1%) | 16 | 36.8 |
| Digital Control vs Artistic Rhythm | 2 (6.1%) | 23 (69.7%) ⚠️ | 8 | 26.6 |
| Artistic Rhythm vs Physical Force | 15 (44.1%) | 15 (44.1%) | 4 | 19.7 |

## Win Conditions

| Condition | Count | % |
|-----------|-------|---|
| level_3 | 72 | 72.0% ⚠️ dominant |
| timeout | 28 | 28.0% |

## Card Play Frequency

### Most Played (top 10)

| Card | Play Count |
|------|-----------|
| `bagga-of-greed` | 1161 |
| `grammetje-pieter` | 1090 |
| `dubbele-dosis` | 513 |
| `bowie-stormey` | 349 |
| `kannetje-melk` | 320 |
| `broodje-doner` | 320 |
| `gun-een-piece` | 236 |
| `dubbele-ding` | 198 |
| `controller` | 156 |
| `afblijven` | 116 |

### Never Played (0 plays across 100 games)

Cards never played may be too expensive, require impossible conditions, or have bugs.

- `quest_tough_it_out`
- `snelle_lucky_coin`
- `quest_endurance_test`
- `quest_sustained_assault`
- `quest_shotje_obby`
- `quest_leap_of_faith`
- `quest_survive_storm`
- `quest_never_give_up`
- `snelle_counter_strikka`
- `quest_debug_system`
- `quest_hack_mainframe`
- `quest_precision_work`
- `quest_strategy_puzzle`
- `quest_master_plan`
- `quest_perfect_timing`
- `quest_speed_run`
- `quest_synergy_mastery`
- `quest_artistic_expression`
- `quest_improvise`
- `quest_create_masterpiece`
- `quest_lucky_break`

## Balance Flags

- ⚠️ **Artistic Rhythm** wins 69.7% vs Digital Control — potential imbalance
- ⚠️ Win condition **level_3** dominates (72.0% of all decisive games)
- ⚠️ Card `redbull` played in only 2 games (2.0%)
- ⚠️ Card `snelle_negate_elimination` played in only 2 games (2.0%)
- ⚠️ Card `snelle_dubbele_temminks` played in only 4 games (4.0%)
- ⚠️ Card `place_coerts_caravan` played in only 2 games (2.0%)
- ⚠️ Card `place_bank_chilling` played in only 1 games (1.0%)

## Aggregate Stats

| Metric | Value |
|--------|-------|
| Avg game length (turns) | 27.6 |
| Avg MP gained / turn | 29.4 |
| Avg quests per game | 3.2 |
| Avg piecies per game | 48.6 |
| Most played card | `bagga-of-greed` |
| Most common win condition | level_3 |

## Recommended Follow-up

Based on simulation results:

- High timeout rate (28.0%): consider adding more aggressive win conditions or reducing card costs to speed up games.
- Investigate 21 never-played card(s): check cost gating, requirement conditions, and whether they belong in starter decks.
- Review deck balance for matchups flagged as one-sided (>65% win rate).
- The dominant win condition suggests that strategy is too powerful relative to alternatives.
- Review cards played in very few games — they may need cost reductions or requirement relaxation.
