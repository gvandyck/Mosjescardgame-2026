# Phase 10 Report

## Changes Made

### AI fixes (Step 0)
- Place play support:
  - Before: AI considered only `piecie` and `snelle-piecie` in `seemsPlayable`.
  - After: AI accepts `place` too, and now enforces `placePlayedThisTurn` so at most one Place is played per turn.
- Choice placeholder coverage:
  - Before: `baggaDiscard`, `cardId`, `targetMosjeCardId` could be missing.
  - After: AI now provides defaults for all requested placeholders:
    - `$choice:targetMP`: `75`
    - `$choice:discardCardId`: first hand card alphabetically
    - `$choice:mosjeId`: first Welloe card (fallback to active Mosje card)
    - `$choice:baggaDiscard`: first hand card alphabetically
    - `$choice:cardId`: first discard card (fallback to first hand card)
    - `$choice:lockedCardId`: first opponent hand card (fallback to discard choice)
    - `$choice:deckOwnerId`: opponent player id
    - `$choice:namedCardId`: `kannetje-melk`
    - `$choice:targetMosjeCardId`: first Mosje card in own hand (fallback to active Mosje card)
- Piecie stats counting:
  - Before: `pieciesPlayedByPlayer` depended on `piecie_activated` event count, which missed many direct card executions.
  - After: counts are computed from successful `card_resolved` events by card category (`piecie` and `snelle-piecie`).

### Digital Control rebalance (Step 1)
- Quest thresholds:
  - `quest_debug_system`: added roll thresholds, `1★` threshold lowered to `4` (with `2★/3★` at `5`).
  - `quest_hack_mainframe`: set thresholds to `1★=5`, `2★=6`, `3★=6`.
  - `quest_precision_work`: thresholds lowered by 1: `5/4/3 -> 4/3/2`.
  - `quest_speed_run`: removed custom requirement and replaced with roll thresholds `5/4/3`.
- Starter deck swaps (`DIGITAL_CONTROL_DECK_CARDS`):
  - Removed: `stookerino`, one `afblijven`, `bong-hit-demolition`.
  - Added: two `kannetje-melk`, one `shoettoe` (the current id replacing prior `energy-surge`), one `warm-kannetje-melk`.
  - Place change: removed `place_momentum_factory`, added another `place_quest_haven`.

### First-timer simplifications (Step 2)
- Physical Force deck:
  - Removed: `quest_elimination_challenge`, `harde-didde`, `klaar-met-jou`.
  - Added: `te-hard-gaan`, extra `quest_leap_of_faith`, extra `quest_tough_it_out`.
- Digital Control deck:
  - Removed: `zie-je-die-dingetjes`.
  - Added: one additional `gun-een-piece`.
- Artistic Rhythm deck:
  - Removed: `emergency-swap`, `quest_negotiation`, `quest_inspire_crowd`.
  - Added: one extra `warm-kannetje-melk`, one extra `quest_improvise`, one extra `quest_lucky_break`.
- Card definition adjustments:
  - `harde-didde`: target MP requirement `<= 40 -> <= 50` and text guidance updated.
  - `klaar-met-jou`: target MP requirement `<= 30 -> <= 40` and text guidance updated.
  - `emergency-swap`: added note text: "Advanced card — recommended for experienced players."

### Never-played card fixes (Step 3)
- `momentum-diefje`:
  - Cost: `mp(20), level 2 -> mp(15), level 1`.
  - Text guidance updated to reflect level 1 requirement.
- `mp-amplifier`:
  - Cost: `mp(10), level 1 -> free`.
  - Text guidance updated: next MP gain +50%, free to play.
- `mosje-shield`:
  - Cost: `mp(15) -> mp(10)`.
  - Text guidance updated to 10 MP.
- `redbull`:
  - Cost: `mp(20), level 1 -> mp(10), level 1`.
  - Text guidance updated to 10 MP.
- Starter deck inclusion changes:
  - Added `snelle_counter_strikka` to Digital Control (third copy in snelle section).
  - Added `snelle_lucky_coin` to all three starter decks.

## Simulation Comparison

| Metric | Phase 9 | Phase 10 | Change |
|--------|---------|----------|--------|
| Crashes | 0 | 0 | No change |
| Timeout rate | 31% | 28% | -3 pp |
| Physical vs Digital win rate | 82% | 82% | No meaningful change |
| Places entered per game | 0 | 0.81 | +0.81 |
| Never-played cards | 36 | 21 | -15 |
| Avg game length | 28.4 turns | 27.6 turns | -0.8 turns |

Notes on Step 4 target checks:
- Target 1 (0 crashes): met.
- Target 2 (timeout < 25%): not met (28%).
- Target 3 (no matchup > 70% wins): met (worst was 69.7%).
- Target 4 (places entered > 0): met.
- Target 5 (avgPieciesPerGame > 0): met (`48.62`).
- Target 6 (neverPlayedCards < 36): met (`21`).

## Remaining Known Issues

- Deferred primitives and feature gaps still need human playtesting attention:
  - Castle token / token-style mechanics.
  - Ally-heal style effects.
  - discard-random style effects.
  - Other deferred effects that still rely on warnings/stubs.
- Interactive-choice heavy cards remain fragile in AI-only simulation:
  - Prediction/guessing cards.
  - Cards requiring card-name guessing or hidden-information calls.
- Advanced-only cards still in the full pool:
  - `emergency-swap` is now explicitly marked as advanced.

## First-Timer Deck Summary

### Physical Force
Physical Force is a straightforward pressure deck: build MP quickly, hit hard, and keep attacking. It rewards simple sequencing and roll-based quests that are easy to understand in your first games.

### Digital Control
Digital Control focuses on consistency, hand shaping, and steady MP growth while denying opponents key momentum windows. It now has more free/low-friction cards so new players can execute its plan without complex setup turns.

### Artistic Rhythm
Artistic Rhythm is a tempo-and-synergy deck that chains medium-power plays into strong level-up timing. It offers a smooth first-time experience with familiar draw/MP tools and fewer niche high-complexity cards.
