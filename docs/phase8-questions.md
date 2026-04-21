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

## Step 4

- Chris The All-Rounder "activate face-down Piecie for free" requires an `activatePiecie` primitive targeting a slot by index. No such primitive exists. The card is defined with the effect call; actual slot-activation is deferred.
- Ronald The Mastermind "activate Piecie from discard" requires an `activateFromDiscard` primitive. No such primitive exists. Effect call is defined; actual discard-activation is deferred.
- Tuk The Healing Spirit "ally-heal" branch requires targeting a bench Mosje (`$bench`) and a `checkPlayerChoice` condition primitive. Neither exists. Card is simplified to self-heal only (gain 25 MP); ally-heal and passive +10 bonus are deferred.

## Step 5

- Binti The Sharp Tongue "Cutting Words" — full effect is: discard 1 card from hand + opponent discards 1 random card + opponent loses 10 MP. The `discardRandom` primitive (force opponent to discard a random hand card) does not exist. Simplified to: discard 1 from own hand (cost) + opponent loses 10 MP only. `discardRandom` is deferred.
- Binti The Creator — intended effect: pay 20 MP + discard 2 food Piecies to search deck for any Mosje card and put it into hand. The `searchDeck` primitive does not exist. Card definition retains the cost and logs a `mosje_ability_used` event; actual deck search is deferred.
- Cless The Teacher synergy — West/Physical Quest bonus (+15 MP on Physical Quest completion, look-at-top once-per-turn before attempting) requires hook integration with the Quest manager. Registered as a synergy label only; runtime enforcement is deferred.

## Step 6

- FPS West "Tactical Analysis" — predict opponent's next card type: correct=gain 20 MP, wrong=lose 10 MP. `checkGuess`/conditional prediction logic does not exist. Simplified to always gain 20 MP (optimistic path). Prediction logic deferred.
- FPS Coert/FPS West synergy "force opponent to reveal full hand" — no `revealHand` primitive exists. Synergy label registered; hand-reveal enforcement deferred.
- Martin The Precision Driver "Pit Stop Strategy" — intended to require discarding 2 cards as a cost. Discard-cost enforcement by executor is not reliably implemented; ability simplified to free (draw 3 + gain 20 MP). Discard cost and "once-per-game extra Quest completion" from Perfect Line passive are deferred.
- The Drainer `$opponent` placeholder — changed to `$target` to correctly resolve the opponent active Mosje for loseMP. The `$opponent` placeholder resolves a playerId string, not a MosjeRef.

## Step 7

- Placeholder 3 Amplifier "Power Boost" — "all Mosje abilities trigger twice this turn" requires a double-trigger dispatch loop in the executor. No such primitive exists. Simplified to apply a `double_trigger_this_turn` buff label on self; actual double-trigger enforcement is deferred.
- Coert Kastelein "Immovable Object" — 20 MP damage reduction, 50+ cap-to-25, and Welloe-prevention all require engine-level interception hooks that do not exist. Simplified to apply a `damage_reduction_20` buff label only; all enforcement is deferred.
- Coert Kastelein "Castle Builder" — Castle token system (persistent field object, per-turn +10 MP gain while active, 70+ single-turn damage to destroy) does not exist. Simplified to gain 10 MP when the triggered ability fires; Castle object system is deferred.
- Tuk The Sims Architect "Perfect Placement" — top-5 look + choose-2-to-hand + conditional immediate face-down place. `lookAtTop` fires correctly; choose-2 and conditional placement are deferred.
- Tuk The Sims Architect "House Design" — extra Piecie slot per turn requires turn-tracking in the Piecie placement engine. Deferred (empty effects array, label only).
- Dancing/DDR Chris "Perfect Combo Chain" — free Piecie activation on 5-6 roll requires `activatePiecie` primitive. Simplified to gain 10 MP on 5-6 roll instead; chain cap of 3 per turn is also deferred.
- Dancing/DDR Chris + Youri synergy — "direct-to-active Piecie play" requires engine hook. Registered as label only; enforcement deferred.
