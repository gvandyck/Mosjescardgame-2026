# Phase 8 Questions

## Step 0

- No unresolved mapping questions identified during Step 0 infrastructure work.

## Step 1

- Jeffrey The Strongman has a separate passive Quest reward bonus in the prompt; the current Step 1 implementation covers the active ability and executor hooks, but QuestManager has not yet been wired to read a Mosje-level passive quest bonus from the active Mosje definition.

## Step 2

- Ronald The Master Chef currently reveals the opponent hand and applies a `buff:card_locked_in_hand` marker to the opponent active Mosje, but hand-play validation is not yet wired to enforce that chosen card lock globally.

## Step 3

- Martin Senor West "Calculated Guess" ability requires reading the category/type of the just-revealed card from state and comparing it to a player-declared guess. No `$lastRevealedCardType` placeholder or `checkGuess` primitive exists. Card is implemented with only the reveal step; the conditional MP gain/loss is deferred.
- The Hacker "cooldown_5_turns" is stored as a `usageLimit` label in the definition but the executor does not yet enforce a 5-turn cooldown window. The cooldown is logged here for future engine work; currently it fires as once-per-game (unlimited re-activation is blocked by `ability_used_this_turn` but not truly 5-turn gated).
