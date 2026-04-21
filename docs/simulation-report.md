# Simulation Report

## Summary

- Total games: 100
- Crashes: 0
- Timeouts: 31 (31.0% of games)

### Timeout Seeds

Seeds: 7, 8, 9, 11, 12, 14, 15, 18, 19, 21, 23, 24, 27, 29, 32, 33, 35, 39, 46, 49, 51, 54, 55, 60, 66, 72, 86, 87, 90, 93, 96

## Win Rates by Matchup

| Matchup | P1 Wins | P2 Wins | Timeouts | Avg Turns |
|---------|---------|---------|----------|-----------|
| Physical Force vs Digital Control | 14 (42.4%) | 3 (9.1%) | 16 | 35.7 |
| Digital Control vs Artistic Rhythm | 4 (12.1%) | 20 (60.6%) | 9 | 27.7 |
| Artistic Rhythm vs Physical Force | 13 (38.2%) | 15 (44.1%) | 6 | 22.0 |

## Win Conditions

| Condition | Count | % |
|-----------|-------|---|
| level_3 | 69 | 69.0% |
| timeout | 31 | 31.0% |

## Card Play Frequency

### Most Played (top 10)

| Card | Play Count |
|------|-----------|
| `energy-surge` | 772 |
| `bowie-stormey` | 534 |
| `grammetje-pieter` | 420 |
| `broodje-doner` | 335 |
| `kannetje-melk` | 228 |
| `gun-een-piece` | 218 |
| `controller` | 201 |
| `dubbele-ding` | 186 |
| `afblijven` | 145 |
| `quest-prep` | 133 |

### Never Played (0 plays across 100 games)

Cards never played may be too expensive, require impossible conditions, or have bugs.

- `momentum-diefje`
- `harde-didde`
- `place_the_gym`
- `place_zo_is_natuur`
- `place_obby_1`
- `quest_endurance_test`
- `quest_sustained_assault`
- `quest_shotje_obby`
- `quest_leap_of_faith`
- `quest_survive_storm`
- `quest_never_give_up`
- `quest_tough_it_out`
- `quest_elimination_challenge`
- `bagga-of-greed`
- `snelle_counter_strikka`
- `snelle_lucky_coin`
- `place_quest_haven`
- `place_bank_chilling`
- `place_momentum_factory`
- `quest_debug_system`
- `quest_hack_mainframe`
- `quest_precision_work`
- `quest_strategy_puzzle`
- `quest_master_plan`
- `quest_perfect_timing`
- `quest_speed_run`
- `quest_synergy_mastery`
- `emergency-swap`
- `place_arcade`
- `place_coerts_caravan`
- `quest_artistic_expression`
- `quest_improvise`
- `quest_create_masterpiece`
- `quest_lucky_break`
- `quest_inspire_crowd`
- `quest_negotiation`

## Balance Flags

- ⚠️ Card `mp-amplifier` played in only 4 games (4.0%)
- ⚠️ Card `redbull` played in only 1 games (1.0%)
- ⚠️ Card `snelle_negate_elimination` played in only 2 games (2.0%)
- ⚠️ Card `mosje-shield` played in only 4 games (4.0%)
- ⚠️ Card `klaar-met-jou` played in only 3 games (3.0%)

## Aggregate Stats

| Metric | Value |
|--------|-------|
| Avg game length (turns) | 28.4 |
| Avg MP gained / turn | 26.6 |
| Avg quests per game | 3.2 |
| Avg piecies per game | 0.0 |
| Most played card | `energy-surge` |
| Most common win condition | level_3 |

## Recommended Follow-up

Based on simulation results:

- High timeout rate (31.0%): consider adding more aggressive win conditions or reducing card costs to speed up games.
- Investigate 36 never-played card(s): check cost gating, requirement conditions, and whether they belong in starter decks.
- Review cards played in very few games — they may need cost reductions or requirement relaxation.
