# Simulation Report

## Summary

- Total games: 100
- Crashes: 0
- Timeouts: 1 (1.0% of games)

### Timeout Seeds

Seeds: 35

## Win Rates by Matchup

| Matchup | P1 Wins | P2 Wins | Timeouts | Avg Turns |
|---------|---------|---------|----------|-----------|
| Physical Force vs Digital Control | 18 (54.5%) | 15 (45.5%) | 0 | 9.9 |
| Digital Control vs Artistic Rhythm | 10 (30.3%) | 22 (66.7%) ⚠️ | 1 | 12.3 |
| Artistic Rhythm vs Physical Force | 20 (58.8%) | 14 (41.2%) | 0 | 8.6 |

## Win Conditions

| Condition | Count | % |
|-----------|-------|---|
| level_3 | 50 | 50.0% |
| knockout | 49 | 49.0% |
| timeout | 1 | 1.0% |

## Card Play Frequency

### Most Played (top 10)

| Card | Play Count |
|------|-----------|
| `kannetje-melk` | 254 |
| `bagga-of-greed` | 197 |
| `dubbele-dosis` | 174 |
| `eendjes-voeren` | 158 |
| `bowie-stormey` | 95 |
| `dubbele-ding` | 95 |
| `broodje-doner` | 80 |
| `grammetje-pieter` | 79 |
| `afblijven` | 64 |
| `pot-of-weed` | 59 |

### Never Played (0 plays across 100 games)

Cards never played may be too expensive, require impossible conditions, or have bugs.

- `te-hard-gaan`
- `quest_tough_it_out`
- `snelle_lucky_coin`
- `quest_endurance_test`
- `quest_sustained_assault`
- `quest_shotje_obby`
- `quest_leap_of_faith`
- `quest_survive_storm`
- `quest_never_give_up`
- `redbull`
- `snelle_counter_strikka`
- `quest_debug_system`
- `quest_hack_mainframe`
- `quest_precision_work`
- `quest_strategy_puzzle`
- `quest_master_plan`
- `quest_perfect_timing`
- `quest_speed_run`
- `quest_synergy_mastery`
- `snelle_dubbele_temminks`
- `quest_artistic_expression`
- `quest_improvise`
- `quest_create_masterpiece`
- `quest_lucky_break`

## Balance Flags

- ⚠️ **Artistic Rhythm** wins 66.7% vs Digital Control — potential imbalance
- ⚠️ Card `snelle_negate_elimination` played in only 1 games (1.0%)
- ⚠️ Card `place_bank_chilling` played in only 3 games (3.0%)
- ⚠️ Card `place_coerts_caravan` played in only 2 games (2.0%)
- ⚠️ Card `laat-me-chillen` played in only 2 games (2.0%)
- ⚠️ Card `varkenspootjes` played in only 1 games (1.0%)
- ⚠️ Card `momentum-diefje` played in only 3 games (3.0%)

## Aggregate Stats

| Metric | Value |
|--------|-------|
| Avg game length (turns) | 10.2 |
| Avg MP gained / turn | 30.8 |
| Avg quests per game | 2.1 |
| Avg piecies per game | 14.9 |
| Most played card | `kannetje-melk` |
| Most common win condition | level_3 |

## Recommended Follow-up

Based on simulation results:

- Investigate 24 never-played card(s): check cost gating, requirement conditions, and whether they belong in starter decks.
- Review deck balance for matchups flagged as one-sided (>65% win rate).
- Review cards played in very few games — they may need cost reductions or requirement relaxation.
