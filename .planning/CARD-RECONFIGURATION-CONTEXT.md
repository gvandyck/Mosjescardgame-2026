# Card Reconfiguration Discussion Context

**Status:** DISCUSSION IN PROGRESS
**Last updated:** 2026-07-19
**Source:** Interactive card and starter-deck design discussion with the user
**Implementation state:** No implementation was authorized or performed from this discussion

## Resume Instructions

This document is the persistent source for the active five-starter-deck
reconfiguration discussion. Read it before asking further card-design questions
or creating implementation phases.

- Continue as a senior card-game and UX designer.
- Ask one material, context-rich question at a time.
- Do not reopen decisions marked locked unless the user explicitly corrects one.
- Inspect the current code and data before asking questions answerable from the repo.
- Keep design discussion separate from implementation. The user explicitly objected
  when planning language was treated as permission to edit.
- Current resume point: settle **Dubbele Temminks**, then finish the Chris/Youri
  Places and continue through Jisca/Alyssa and West/Cless.

The user values thematic real-life affinities, clear modal interactions, useful
starter cards, and exciting booster rewards. A card may be generally usable while
still giving a larger benefit to Mosjes who use or like that item.

## Locked Global Starter Rules

- Each player-facing starter contains exactly 24 listed cards:
  - 2 Mosjes
  - 14 regular Piecies
  - 4 Snelle Piecies
  - 2 Places
  - 2 Personal Quests, one signature Quest for each starter Mosje
- At game setup, one of the two Mosjes is selected randomly as the starting Mosje.
  The partner is shuffled into the deck.
- Prefer duplicates of lower-rarity consistency cards and one-off higher-rarity
  identity cards.
- Copy limits:
  - 1-star: 4
  - 2-star: 3
  - 3-star: 2
  - 4-star: 1
- Starter Personal Quests are 3-star and appear once each.
- Starter Personal Quests use `isBoosterOnly: false`, but may still appear in
  boosters.
- Custom-deck save is blocked when a Personal Quest's required Mosje is absent.

## Locked Personal Quest Framework

- Personal Quests are shuffled into the player's deck.
- They are placed face-down and use the normal wait before activation.
- The exact required Mosje must be active to attempt one.
- Every attempt has a universal, nonrefundable 20 MP cost paid by that Mosje.
- The Personal Quest is discarded after its attempt.
- Only Quest rewards can permanently level a Mosje.
- Piecie, Place, ability, turn-trickle, and other non-Quest gains cap at 100 MP
  and never level.
- Typical starter Quest outcomes are approximately +55 to +75 MP on success and
  -10 to -20 MP on failure.
- Existing 4-star spectacle Personal Quests remain booster chase cards.

## Locked Persistent Framework

- A Persistent Piecie remains face-up in its Piecie slot after activation.
- Its owner gets an Activate/Destroy control.
- It may be manually destroyed starting on the owner's next turn, after a full
  turn cycle.
- Destruction sends it to its owner's graveyard.
- A player may control only one active Persistent with the same card name.
- A duplicate may be set while the first is active, but cannot activate.
- Every legacy `Persistent N turns` card must be audited individually rather than
  receiving an automatic generic conversion.

## Locked MP, Draw, Target, and Place Rules

- Card, Place, and ability MP gains use the central capped-gain path.
- All losses use the central loss path.
- Cost payment remains distinct from effect-based MP loss.
- Every draw source uses one shared sequential draw pipeline.
- When a deck empties during a draw, recycle and shuffle the graveyard, then
  continue drawing.
- Any recycle arms one nonstacking `skip next turn` penalty.
- If deck and graveyard are both empty, drawing stops cleanly.
- Preserve source/context semantics, especially for Jammertje Gepakt.
- Show a visible deck-out/recycle event.
- A sole legal target is selected automatically.
- Multiple legal targets use the existing target selector.
- Cancelling before activation leaves the card and costs untouched.
- Places are global unless their text explicitly scopes an effect to an owner.
- Global Places can benefit either player when that player meets the condition.

## Locked Fast-Activation UX

- Optional activation charges must be visible to the owner.
- Playing a regular Piecie with an available charge offers a clear choice between
  setting it normally and `Set & Activate`.
- A charge is spent only when the immediate activation successfully commits.
- Cancelling a required target or choice leaves the card set face-down and
  preserves the charge.
- Charges expire at the end of the owner's turn unless a card explicitly says
  otherwise.

## Starter 1: Coert and Binti

### Locked Composition

Mosjes:

- Coert KasteLuck
- Binti

Regular Piecies, exactly 14:

- Kannetje x4
- Broodje Doner x3
- Warm Kannetje x2
- Bagga x2
- Pot x1
- Redbull x1
- Dubbele Dosis x1

Snelle Piecies, one each:

- Jensen
- FF Haaltje Nemen
- Momentum Rush
- Sleutelpuntje

Places:

- Coert's Caravan
- Tesla

Personal Quests:

- Coert signature Quest described below
- Binti signature Quest described below

### Locked Identity and Pool Decisions

- Varkenspootjes is removed from this starter.
- Tijd voor Winston Jaaa and Varkenspootjes are booster rewards.
- Locked replacement: Bank Chilling is removed from the Coert/Binti starter and
  Tesla occupies its former Place slot.
- Tesla was initially considered a booster reward, then explicitly restored as
  this starter's second Place alongside Coert's Caravan.
- The user accepted that Tesla can be a dead card during a Binti-only opening
  until Coert arrives.
- Bank Chilling remains outside this starter because it does not feel thematic
  for Coert/Binti.
- Update the eventual starter description so it names Tesla and does not claim
  Varkenspootjes is included.

### Locked Mosje and Card Mechanics

Coert Morning Luck:

- Passive at turn start.
- Roll 1d6.
- On 4-6, the next regular Piecie played that turn may activate immediately.
- This grants one optional charge.

Binti Cutting Words:

- Once per turn.
- Discard one regular Piecie from the owner's hand.
- Reveal a random card from the opponent's hand.
- The opponent loses 10 MP through the central loss path.

Kannetje:

- Choose an active friendly Mosje.
- Gain 25 MP, or 50 MP under the Coert/Binti FOOD synergy.

Broodje Doner:

- Choose a friendly Level 1+ Mosje.
- Gain 35 MP, or 70 MP under the Coert/Binti FOOD synergy.

Warm Kannetje:

- Choose a friendly Mosje.
- That Mosje loses 10 MP through the central loss path, then the player draws 2.
- It may target a Mosje at 10 MP or less and can defeat it.
- Show a confirmation when the selected target would be defeated.

Redbull, approved replacement effect:

> Choose a Level 1+ friendly Mosje and roll 1d6. If you chose Coert KasteLuck,
> roll 2d6 instead. Each 4-6 lets one Piecie you play this turn activate
> immediately.

- Any Mosje may use it.
- Exact Coert KasteLuck rolls two independent dice; other Coerts and other Mosjes
  roll one.
- It can create 0, 1, or 2 charges.
- It stacks additively with Morning Luck and other Redbulls.
- Each immediate activation optionally consumes one charge.
- ViannaPoes and Tweede Kans style rerolls can affect its dice.
- Free, 2-star, Level 1+.
- It remains face-up until end of turn for charge visibility, then goes to the
  graveyard.

Bagga:

- Free, 2-star.
- Draw 2, then mandatorily discard exactly one card from the full hand.
- Any card type can be discarded.
- The discarded card uses a typed graveyard entry.
- The player cannot cancel after activation.

Pot:

- Free, 2-star.
- Draw 2 through the shared draw pipeline.

FF Haaltje Nemen:

- Free, 2-star Snelle.
- Draw 1 through the shared draw pipeline.
- Usable during any legal Snelle window.

Momentum Rush:

- Free, 2-star Snelle.
- Choose a friendly Mosje; it immediately gains 15 MP.
- Sole legal target auto-selects.
- No friendly target blocks play.

Coert's Caravan:

> While this Place is active, Coert Mosjes are immune to up to 40 MP of Quest
> damage per turn.

- Applies to each Coert Mosje.
- Does not reduce the universal 20 MP Quest cost.
- Does not reduce non-Quest losses.
- The 40 MP allowance resets per turn and does not stack with itself.

Tesla:

- Remains the existing Coert-dependent Place concept unless changed in a later
  explicit audit.
- It is present in this starter.

### Locked Personal Quests

Coert signature:

- Requires exact Coert.
- Select a regular Piecie set this turn.
- Roll 1d6.
- On 4-6, gain 55 Quest MP and activate the selected Piecie.
- On 1-3, lose 10 MP and leave the selected Piecie set.

Binti signature:

- Requires exact Binti.
- Discard one friendly regular Piecie from the field.
- Reveal a random opponent hand card.
- If it is a regular Piecie: discard it, opponent loses 10 MP, and Binti gains
  55 Quest MP.
- Otherwise return the revealed card and Binti loses 10 MP.

## Starter 2: Gandoe and Michelle

### Locked Composition

Mosjes:

- Gandoe the Destroyer
- Michelle Iron Tuk

Regular Piecies, exactly 14:

- Boxing Gloves x2
- Protein Shake x2
- Dumbbells x2
- Laat me chillen x2
- Bowie & Stormey x1
- Kannetje x1
- Dubbele Dosis x1
- Tikker x1
- Dikke Jonko x1
- Skipping Rope x1

Snelle Piecies, one each:

- Jensen
- Emergency Healings
- Not Today
- Sleutelpuntje

Places:

- Boxing Ring
- De Box

Personal Quests:

- Gandoe signature Quest described below
- Michelle signature Quest described below

### Locked Mosje and Card Mechanics

Gandoe and Michelle partner synergy:

- Gandoe's successful Physical Quests gain an additional 15 Quest MP while
  Michelle is active.
- Michelle Tough Gamble rolls of 5-6 also grant exact Gandoe the Destroyer
  10 MP.
- The 10 MP kicker caps at 100 and cannot level Gandoe.

Boxing Gloves:

> Choose a friendly Mosje with Physical 2-star or better. It gains 25 MP. If it
> is GANDOE-tagged, it gains 40 MP instead and halves all non-cost MP loss until
> your next turn.

- The selected Gandoe alone receives the protection.
- Costs are never reduced.
- The protection lasts through the full opposing turn until the owner's next
  turn.
- Duplicate stacking/refresh behavior still needs a final ruling.

Protein Shake:

- Choose a friendly FIGHTING Mosje.
- It gains 25 MP, or 35 MP while Boxing Ring is active.
- Cap at 100; no leveling.
- Sole legal target auto-selects.
- No legal target blocks activation.

Laat me chillen:

- Choose one friendly Mosje.
- Reduce its next non-cost MP-loss event by 20.
- Expires at the start of the owner's next turn if unused.
- The Piecie itself resolves to the graveyard immediately.
- Show a visible one-use status on the chosen Mosje.

Skipping Rope:

- Draw 1 through the shared draw pipeline.
- Choose a friendly FIGHTING Mosje.
- Only that Mosje gets +1 to its next Quest roll this turn.
- If there is no friendly fighter, the draw still resolves.
- The bonus stacks additively with Dubbele Dosis and expires at end of turn.

Tikker:

- Choose a friendly Mosje; it gains 40 MP, capped without leveling.
- During the owner's next turn, only that chosen Mosje cannot attempt General or
  Personal Quests.
- Other friendly Mosjes may still attempt Quests.
- It does not block the current activation turn.
- It expires at the end of the following owner turn.

Dikke Jonko:

- Free regular Piecie with a Level 1 requirement.
- Its chosen friendly recipient must be Level 1+.
- No legal friendly recipient blocks activation.
- The chosen friendly Mosje gains 25 MP.
- The opponent chooses one of their own active Mosjes to gain 10 MP.
- All players draw 1 through the shared draw pipeline.
- If the opponent has no active Mosje, skip their MP choice but still perform
  all draws.
- The opponent-owned choice requires a synchronized remote pending interaction.

Dumbbells:

- This card was ruled earlier and should not be casually reopened.
- Known intended direction: it must target rather than silently use the first
  slot, and its benefit is based on Physical trait affinity rather than confusing
  permanent Level with Physical stars.
- The compacted discussion did not preserve the exact non-Physical fallback
  amount. Verify this one wording detail before implementation if it is not
  recoverable from another planning artifact.

### Locked Pets

Tony:

- Affinity tags are Coert and Binti.
- Booster-only.
- Removed from every starter.

Bowie & Stormey:

- One combined Persistent card.
- Bowie affinity is Michelle.
- Stormey affinity is DJ/Gandoe.
- The combined card's enhanced reduction applies to Michelle-, DJ-, or
  Gandoe-tagged targets.

Shared Tony and Bowie & Stormey structure:

- Free, 3-star Persistent.
- On activation, choose any friendly Mosje as the linked target.
- Show two visible shield charges.
- Each qualifying non-cost MP-loss event consumes one charge.
- Reduce the event by 50% normally.
- Reduce it by 75% when the linked target matches the card's affinity.
- Destroy the Persistent after the second charge.
- Destroy it if the linked target leaves the field.
- Normal Persistent manual-destroy and same-name limits apply.
- Exact rounding to the game's 5-MP grid remains unresolved.

### Locked Places

Boxing Ring:

- Global Place.
- At the start of each player's turn, that player's GANDOE-tagged Mosje gains
  20 MP.
- Protein Shake retains its 35-MP Boxing Ring tier.

De Box:

- Global Place.
- At the end of each player's own turn, that player's MICHELLE/TUK-tagged Mosje
  gains 20 MP.
- If that player also controls a GANDOE-tagged Mosje, both matching Mosjes gain
  20 MP.
- All gains cap at 100 without leveling.

### Locked Snelles

Emergency Healings:

- Free, proactive targeted heal.
- Choose a friendly Mosje.
- It gains 25 MP, or 35 MP if it has Resilient 2-star or better.
- Cap at 100; no leveling.
- It is not a defeat interrupt.

Not Today:

- Free, 4-star true interrupt.
- Triggers only when a friendly Mosje would actually leave play due to an effect.
- Covers opponent damage, the owner's Quest failure, Place damage, and explicit
  `defeat` or `send to Welloe` effects.
- Does not answer cost payment or voluntary sacrifice.
- Does not trigger for ordinary Level regression when the Mosje remains in play.
- Prevent the removal, preserve the current Level, and leave the Mosje at 5 MP.
- Uses a synchronized pending-response state.
- The affected owner sees `Play Not Today` or `Pass`.
- Local, bot, and online resolution must wait for the response.
- Once passed, that same pending defeat cannot be reopened.
- Multiplayer timeout/disconnect behavior remains to be specified.

### Locked Personal Quests

Gandoe signature:

- Roll 1d6.
- On 3+, gain 55 Quest MP.
- Success also reduces Gandoe's next unused Elimination Strike from 80 MP to
  60 MP.
- Failure loses 20 MP.
- The discount is consumed only by a later successful use of the once-per-game
  ability.

Michelle signature:

- Automatically succeeds for a base 50 Quest MP.
- Michelle's Tough Gamble then changes the reward to 25 or 100 MP.
- Preserve the established Gandoe synergy kicker.

## Starter 3: Chris and Youri

### Locked Composition

Mosjes:

- Chris the All-Rounder
- Youri the Speedrunner

Regular Piecies, exactly 14:

- Keyboard x2
- Mouse x2
- Controller x2
- Dubbele Dosis x2
- Kannetje x2
- Pot x1
- Bagga x1
- Zie je die Dingetjes x1
- Te Hard Gaan x1

Intended Snelle package, one each:

- Jensen
- Dubbele Temminks
- Counter Strikka
- Sleutelpuntje

Current Place candidates, not yet audited:

- Arcade
- Momentum Factory

Personal Quests:

- Chris signature Quest described below
- Youri signature Quest described below

### Locked Duo Synergy

- While both Chris and Youri are active, the player receives two optional
  fast-activation charges each owner turn.
- Each charge lets one regular Piecie played that turn use `Set & Activate`.
- This replaces the current unlimited same-turn activation.
- Charges are available only while both partners are active.
- The two-charge limit keeps Chris and Youri's individual abilities relevant.

### Locked Digital Equipment Package

Shared targeting and MP rule:

- Choose any friendly Mosje.
- A DIGITAL target gains 15/25/40 MP at visible Levels 1/2/3.
- A non-Digital target gains 5 MP.
- Cap at 100; no leveling.

Keyboard:

- Apply the shared MP gain.
- Draw 1 through the shared draw pipeline.

Mouse:

- Apply the shared MP gain.
- Look at the top 2 cards of the owner's deck.
- Put one into hand and the other on the bottom.
- Edge behavior when recycling supplies fewer than two cards must use the shared
  draw/recycle rules and never duplicate a card.

Controller:

- Apply the shared MP gain.
- Only the chosen target gets +1 on that target's next Quest roll this turn.
- The bonus stacks additively with other Quest-roll bonuses.

### Locked Booster Combo Rewards

Chain Reaction:

- Removed from every starter.
- Repaired as a 3-star booster reward.
- Grants one additional optional same-turn regular-Piecie activation charge for
  the current turn.

Dubbele Ding:

- Removed from every starter.
- Repaired as a 3-star, Level 2+ booster reward.
- Choose up to two legal regular Piecies from hand.
- Sequentially set and activate them, resolving all targets and choices one at a
  time.
- Requirements and legal-target gates still apply.

### Locked Personal Quests

Chris signature:

- Requires at least three face-down regular Piecies.
- Choose one of those Piecies and activate it.
- Automatic success grants 55 Quest MP.

Youri signature:

- Reveal the top 3 cards.
- Choose a Keyboard, Mouse, or Controller among them.
- Activate the chosen equipment directly from the deck.
- Put the other two cards on the bottom.
- Success grants 50 Quest MP.
- If no named equipment is present, restore the revealed cards in their original
  order and lose 10 MP.
- Resolution ordering with Mouse's own top-two selection should put the
  unchosen Quest cards on the bottom before Mouse inspects the newly exposed top
  cards.

### Current Unanswered Question

Dubbele Temminks was presented but not ruled because the user paused for bed.

Recommended, not locked:

> Play before activation. The next regular Piecie you activate this turn resolves
> its effect twice but counts as one activation.

Recommended copy semantics:

- One activation and one cost payment.
- Activation triggers fire once.
- The locked target remains the same for both resolutions.
- Random rolls and follow-up choices are performed again for the second
  resolution.

Do not treat this recommendation as accepted until the user answers.

## Starter 4: Jisca and Alyssa

The full 14-card regular composition and Places are not yet finalized.

Locked support-copy decisions:

- Tweede Kans x2
- Affoe x2
- Pot x2

Locked Jisca ability:

- Perfect Combo, once per turn.
- Roll 1d6.
- On 1-4, no effect and the use is spent.
- On 5-6, choose one of the owner's regular field Piecies.
- A face-down Piecie activates.
- An already-active Persistent Piecie retriggers its effect.

Locked Alyssa ability:

- Track opponent-caused actual MP damage since the end of Alyssa's previous turn,
  plus damage during the current owner turn.
- Once per turn, recover 5 MP for each full 10 MP actually lost.
- Use the exact Alyssa slot, not a generic first-slot shortcut.
- Battle Concert remains an explicit exception so redirected Quest failure can
  still support the intended interaction.

Locked Jisca signature Quest:

- Choose a friendly regular field Piecie.
- Roll 2d6.
- If either die is 5-6, gain 55 Quest MP and activate or retrigger the chosen
  Piecie.
- Otherwise lose 10 MP.
- Tweede Kans may reroll one of the two dice.

Locked Alyssa signature Quest:

- Choose to suffer 10, 20, or 30 Quest damage.
- Roll 1d6 and require a 6.
- Add +1 to the result for every full 10 MP actually lost.
- Success grants 70 Quest MP.
- Failure loses 10 MP in addition to the chosen attempt damage only if that is
  the final accepted wording; verify sequencing during the deck audit.

Known upcoming work:

- Audit the current pets Gekke Vogels and KatjeGang under the new Persistent and
  shield-charge model.
- Replace or design a real effect for Dierenasiel; current code/text says it has
  no mechanical effect.
- Reassess the current Bank Chilling slot against the pair's identity.
- Finalize all 14 regular cards and four Snelles.

## Starter 5: West and Cless

The full 14-card regular composition is not yet finalized.

Locked support-copy decisions:

- Keyboard x2
- Dumbbells x2
- Grammetje Pieter x2

Locked West signature Quest:

- Predict the next two deck card types in exact order.
- Reveal those two cards.
- One correct position grants 55 Quest MP.
- Both correct positions grant 75 Quest MP.
- No correct positions loses 15 MP.
- Return the cards in the same order.

Locked Cless signature Quest:

- Choose Odd or Even.
- Choose a Safe or Wild stake.
- Safe: success +55, failure -10.
- Wild: success +80, failure -25.
- ViannaPoes can provide the accepted reroll interaction.

Locked specific card rulings:

Jantje Jantje:

- Pick one face-down card in the opponent's hand.
- Guess its type using the existing simple modal selector.
- Choices are regular Piecie, Snelle Piecie, Mosje, or Personal Quest.
- Use the previously accepted correct/wrong payoff rather than the old
  impossible `name a card` interaction.

Stookerino:

- The opponent chooses one card from their own hand.
- Reveal it.
- If it is a regular Piecie, activate it directly on the Stookerino player's side
  of the field.
- All useful/applicable effects belong to the Stookerino player.
- Non-Piecie outcome behavior still needs its final concise card text if not
  already captured elsewhere.
- Requires a synchronized remote opponent choice.

Those Eyelashes:

- While active, the opponent cannot play Snelle Piecies.
- It uses the new Persistent model.
- The owner can destroy it and send it to the graveyard after one full turn.
- Do not retain an automatic end-of-turn disappearance.

F1 Telemetry Data:

- Remove the `otherwise` fallback entirely.
- It is useful only with an active Martin-family Mosje.
- With a legal Martin, preserve the intended package: gain 40 MP, draw 2, and
  arm +20 MP for the next successful Quest.
- Activation must be blocked when there is no legal Martin rather than resolving
  a weaker fallback.

Current Places:

- The Gym
- Obby #1

Their broad decisions were settled earlier and should be audited against current
code without reopening them casually.

## Ten Locked Starter Personal Quest Mechanics

For quick reference, all ten mechanics are:

1. West: predict two ordered card types; +55 one, +75 both, -15 none.
2. Cless: odd/even plus Safe (+55/-10) or Wild (+80/-25), Vianna reroll.
3. Coert: selected set Piecie; 4-6 activates and +55, 1-3 leaves set and -10.
4. Binti: sacrifice friendly regular Piecie, random opponent reveal; regular
   Piecie discards/drains 10/+55, otherwise return/-10.
5. Gandoe: 3+ gives +55 and next unused Elimination Strike costs 60; fail -20.
6. Michelle: automatic base +50, Tough Gamble modifies to +25/+100, Gandoe
   kicker applies.
7. Chris: requires three face-down regular Piecies, choose/activate one, +55.
8. Youri: top three equipment search/activate/bottom, +50; miss restores/-10.
9. Jisca: chosen friendly regular field Piecie, 2d6, any 5-6 activates and +55,
   otherwise -10; Tweede Kans rerolls one.
10. Alyssa: choose 10/20/30 Quest damage, need 6 with +1 per full 10 actually
    lost, +70/-10.

## Other Settled Cards Not To Reopen Casually

The earlier discussion also settled the broad direction of these cards:

- Grammetje Pieter
- Dubbele Dosis
- Sleutelpuntje
- The Gym
- Obby #1
- Arm Wrestling
- Counter Strikka
- Jammertje Gepakt
- Jensen
- Kannetje
- Te Hard Gaan

Before implementation, compare their current data, effect code, and existing
tests. Ask only when an actual mismatch remains; do not restart their design from
scratch.

## Engine and UX Findings That Must Enter the Plan

### Requirement Enforcement Gap

`PIECIES[].requirement` is displayed but there is no reliable central requirement
gate in `activatePiecie`.

- Level and trait requirements can currently be bypassed.
- Targeted cards should validate the chosen recipient.
- Non-targeted requirement cards need a clearly selected acting Mosje or a
  central `at least one eligible active Mosje` rule.
- Dikke Jonko establishes that its chosen recipient must meet Level 1+.
- Requirement validation must happen before costs, card movement, or activation
  counters are committed.

### Status Architecture Gap

The generic status processor currently mixes duration/charge metadata with
periodic MP effects.

- Positive-valued protection statuses can accidentally become end-phase MP gains.
- Separate duration-based statuses, charge-based shields, and periodic MP
  effects.
- `MP_LOSS_HALVED.turnsLeft` currently behaves like hits remaining rather than a
  real turn duration.
- Boxing Gloves, Laat me chillen, pets, and future reactions need explicit,
  typed lifecycle semantics.

### Snelle Lifecycle Gap

- Snelles currently occupy field slots until end of turn even though the ruling
  model says they resolve immediately.
- Opponent-turn cleanup can therefore be wrong.
- Non-Persistent Snelles should resolve from hand to graveyard atomically.
- Persistent Snelle-like effects must be explicit exceptions, not inferred from
  the card type.

### Multiplayer Reaction Gap

- Online play presently allows Snelles to be clicked out of turn but has no
  atomic priority or response window.
- A pending action must be frozen before a true reactive Snelle can answer it.
- Not Today is the first locked consumer.
- Counter Strikka and other reactive Snelles should reuse the same protocol after
  their individual timing is audited.
- Define owner, eligible responders, pass locking, timeout/disconnect behavior,
  bot policy, and deterministic resume data.

### Pending Remote Choice Gap

Stookerino and Dikke Jonko require a choice made by the opponent.

- Reuse one synchronized pending-choice structure.
- Only the designated remote player may answer.
- The activating player waits.
- Hide private hand information from the wrong client.
- Resume the original effect exactly once after the answer.

### Two Card Data Surfaces

Implementation must reconcile both relevant card surfaces:

- Browser/live data and behavior under `src/data`, `src/abilities`, `src/engine`,
  `src/main.js`, `src/ui`, and `src/multiplayer`.
- Declarative TypeScript registry cards under `src/cards` and associated effect
  infrastructure when a matching definition exists.

Card text, deck lists, builder pools, booster eligibility, bot logic, simulations,
and tests must remain synchronized.

## Remaining Discussion Checklist

Continue in this order unless the user redirects:

1. Rule Dubbele Temminks timing and copy semantics.
2. Audit Chris/Youri Snelles, then Arcade and Momentum Factory.
3. Confirm Chris/Youri final starter description and Quest names/text.
4. Fully design Jisca/Alyssa's 14 regulars, four Snelles, two Places, pets, and
   starter description.
5. Fully design West/Cless's 14 regulars, four Snelles, Places, and starter
   description.
6. Resolve pet percentage rounding on the 5-MP grid.
7. Resolve duplicate Boxing Gloves and other same-name protection stacking.
8. Specify the general requirement gate.
9. Specify the shared reaction and remote-choice state machines.
10. Audit every final 24-card list against rarity copy caps and booster flags.
11. Define tests, bot behavior, simulation acceptance thresholds, and rollout
    phases.
12. Only then produce the decision-complete implementation plan.
