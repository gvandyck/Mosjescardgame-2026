# 🃏 MOSJES — COMPLETE CARD DATABASE v3.0
### Reference document for VS Code AI — all cards, all types, all effects
### Source: MOSJES CARD LIST V3 — MOMENTUM EDITION

---

## 📖 HOW TO READ THIS DOCUMENT

Each card entry contains:
- **ID** — the unique JavaScript identifier used in all code files
- **Name** — the display name shown on the card
- **Type** — card category (MOSJE / PIECIE / SNELLE_PIECIE / PLACE / QUEST)
- **Stats** — MP costs, trait requirements, rarity
- **Effect** — the full mechanical description of what the card does
- **Tags** — metadata used by the engine for synergy detection
- **Synergies** — which other cards interact with this card
- **Flavor Text** — the italicized quote shown on the card

---
---

# 🧑 SECTION 1 — MOSJE CARDS

> Mosjes are the playable characters. Each player has 2 active Mosje slots.
> MP tracks from 0 → 100 per level. Reaching Level 3 wins the game.
> Starting MP values of 1–9 are automatically rounded up to 10 on game init.

---

## ⚔️ FIGHTING TYPE MOSJES

---

### [Gandoe] The Unpredictable Wizard
```
ID:         mosje_gandoe_wizard
Type:       MOSJE
Subtype:    FIGHTING
Start MP:   10
Traits:     Physical ★★, Resilient ★, Creative ★★
Rarity:     ◆
Tags:       [GANDOE]

ABILITY — Chaos Roll (Passive, automatic at turn start, no cost):
  Roll 1d6 at the start of every turn:
  - 1–2 = lose 10 MP
  - 3–4 = nothing happens
  - 5–6 = gain 20 MP AND draw 1 card

Flavor: "Is it a healing spell? A fireball? Not even he knows until it happens!"
```

---

### [Jeffrey] The Strongman
```
ID:         mosje_jeffrey
Type:       MOSJE
Subtype:    FIGHTING
Start MP:   20
Traits:     Physical ★★★, Resilient ★
Rarity:     ◆
Tags:       [JEFFREY]

ABILITY — Brute Force (Passive, permanent):
  All your Quests give +10 MP bonus on success.
  RESTRICTION: This Mosje cannot use any Piecies tagged [FOOD] or [RESTORE].
  Attempting to play a FOOD/RESTORE Piecie while Jeffrey is active is blocked.

Flavor: "Why heal when you can just hit harder?"
```

---

### [Alyssa] The Bulldozer
```
ID:         mosje_alyssa_bulldozer
Type:       MOSJE
Subtype:    FIGHTING
Start MP:   0
Traits:     Physical ★★★, Resilient ★★, Social ★★★
Rarity:     ◆◆
Tags:       [ALYSSA]

ABILITY — Unstoppable (Passive, automatic, no cost):
  At turn start: draw 2 cards, keep 1, discard the other.
  Whenever this Mosje attempts a Quest: instantly gain +10 MP (before result).
  Whenever this Mosje loses 30 MP or more in a single instance:
    → Immediately regain 25 MP (triggers once per damage instance).

Flavor: "She charges into battle with a laugh, getting stronger with every hit she takes."
```

---

### [Alyssa] Fissa Fissa!
```
ID:         mosje_alyssa_fissa
Type:       MOSJE
Subtype:    FIGHTING
Start MP:   10
Traits:     Physical ★★, Social ★★★, Resilient ★
Rarity:     ◆
Tags:       [ALYSSA]

ABILITY — Party Power (Passive, triggered, no cost):
  Whenever you OR an ally destroys a Place card:
    → Gain +15 MP.
  Maximum: once per turn.

Flavor: "Every victory deserves a party, every party needs a fighter!"
```

---

### [AZN Cless] The Wild Card
```
ID:         mosje_azn_cless
Type:       MOSJE
Subtype:    FIGHTING
Start MP:   10
Traits:     Physical ★★, Social ★★, Creative ★
Rarity:     ◆
Tags:       [CLESS]

ABILITY 1 — Risk & Reward (Passive, automatic at end of each turn, no cost):
  Roll 1d6 at the end of every turn:
  - 1      = discard 1 card from hand
  - 2–5    = nothing happens
  - 6      = draw 2 cards AND gain 10 MP

SYNERGY — West (Passive, while both active on field, no cost):
  Applies when [mosje_west] OR [mosje_martin_senor_west] is also on the field.
  Physical Quests give +15 bonus MP.
  Once per turn: may look at the top Quest card before attempting.

PET SYNERGY — ViannaPoes (Activated by [piecie_vianna_poes], costs 15 MP, lasts 2 turns):
  Reduce all MP loss for this Mosje by 50%.

Flavor: "Nobody knows what he'll do next... including him."
```

---

### [Michelle] Iron Tuk
```
ID:         mosje_michelle
Type:       MOSJE
Subtype:    FIGHTING
Start MP:   0
Traits:     Physical ★★, Social ★, Resilient ★★
Rarity:     ◆
Tags:       [MICHELLE, TUK]

ABILITY — Tough Gamble (Passive, automatic on every Quest completion, no cost):
  After each Quest resolves, roll 1d6:
  - 1–3 = receive only HALF the Quest's MP reward (rounded down)
  - 4–6 = receive DOUBLE the Quest's MP reward

SYNERGY — Gandoe (Activated by [piecie_bowie_stormey], costs 15 MP, lasts 2 turns):
  Requires both [mosje_michelle] AND any [GANDOE]-tagged Mosje active on field.
  Reduce ALL MP loss by 75% (instead of 50%).
  Both Mosjes gain +15 MP per turn while active.

Flavor: "Go big or go home... usually it's go home."
```

---

### [Parkour West] The Flow Fighter
```
ID:         mosje_parkour_west
Type:       MOSJE
Subtype:    FIGHTING
Start MP:   10
Traits:     Physical ★★★, Creative ★★, Resilient ★★
Rarity:     (no rarity listed — treat as ◆◆)
Tags:       [WEST]

ABILITY — Adaptive Combat Flow (Passive, automatic, no cost):
  When you complete a Physical Quest:
    → Gain +20 MP.
    → Your next Attack Piecie costs 10 less MP (this turn only).
  When you would take 30+ MP damage from any single source:
    → Reduce that damage by 20 (once per turn).
  Cannot be sent to the Welloe pile while this Mosje has 40+ MP.

Flavor: "Every wall is a weapon, every movement a counter-strike."
```

---

### [Gandoe] The Destroyer
```
ID:         mosje_gandoe_destroyer
Type:       MOSJE
Subtype:    FIGHTING
Start MP:   0
Traits:     Physical ★★★, Resilient ★★
Rarity:     ◆◆◆
Tags:       [GANDOE]

ABILITY — Elimination Strike (Activated, cost: 80 MP, once per game, instant):
  Send the opponent's lowest-level Mosje directly to the Graveyard (Welloe pile).
  This cannot be negated by MP protection effects.

Flavor: (none listed)
```

---

## 💻 DIGITAL TYPE MOSJES

---

### [Ronald] The Master Chef
```
ID:         mosje_ronald_chef
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   0
Traits:     Mental ★★★, Social ★★★, Physical ★
Rarity:     ◆◆
Tags:       [RONALD]

ABILITY — Strategic Insight (Activated, cost: 20 MP, once per turn, 3-turn cooldown):
  Pay 20 MP → look at the opponent's full hand.
  Choose 1 card from their hand → that card cannot be activated on the opponent's next turn.
  After use, this ability cannot be used again for 3 turns.

SYNERGY (passive) — RONALD KIP Piecie:
  When [piecie_ronald_kip] is played while this Mosje is on the field:
    → Gain 60 MP instead of 50 MP AND draw 1 card.

Flavor: "A perfect dish requires the perfect ingredients... and knowing what your opponent ordered."
```

---

### [Ming] The Natural
```
ID:         mosje_ming_natural
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   10
Traits:     Mental ★★★, Technical ★★, Creative ★★
Rarity:     ◆
Tags:       [MING]

ABILITY — Lucky Draw (Passive, triggered when drawing from deck):
  When you draw a card, reveal it to all players:
  - If it is a PIECIE card: activate it immediately for free OR add it to your hand (your choice).
  - If it is NOT a Piecie: add it to your hand AND gain 15 MP.

Flavor: "I literally just showed up and won. Is that weird?"
```

---

### [Ming] The Predictor
```
ID:         mosje_ming_predictor
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   20
Traits:     Mental ★★★, Technical ★★
Rarity:     ◆
Tags:       [MING]

ABILITY — Future Sight (Activated, cost: 10 MP, once per turn):
  Look at the top Quest card of the shared General Quest Deck.
  If you don't want to attempt it: pay 10 MP to move it to the bottom of the deck.

Flavor: "Seeing the future is easy when you control the deck."
```

---

### [Martin] The Historian
```
ID:         mosje_martin_historian
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   10
Traits:     Mental ★★★, Technical ★, Resilient ★★
Rarity:     ◆◆
Tags:       [MARTIN]

ABILITY — Time Control (Activated, cost: skip your Draw Phase, once per turn):
  Instead of drawing a card this turn:
    → Rearrange the top 5 cards of ANY deck in any order.
    → Gain 15 MP.
    → Draw 2 cards at the END of this turn (instead of the normal 1).

Flavor: "Why work hard when you can work smart? Or better yet, don't work at all."
```

---

### [Martin] Senor West
```
ID:         mosje_martin_senor_west
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   15
Traits:     Mental ★★★, Technical ★
Rarity:     ◆
Tags:       [MARTIN, WEST]

ABILITY — Calculated Guess (Activated, cost: Free, once per turn, instant):
  Name a card type (MOSJE / PIECIE / SNELLE_PIECIE / PLACE / QUEST).
  Reveal the top card of any chosen deck.
  - Correct guess = draw 2 cards AND gain 10 MP.
  - Wrong guess   = lose 10 MP.

SYNERGY — Cless (Passive, while both active on field, no cost):
  Applies when any [CLESS]-tagged Mosje is also on the field.
  Physical Quests give +15 bonus MP.
  Once per turn: may look at the top Quest card before attempting.

Flavor: "I've calculated every possibility... this should work... probably."
```

---

### [Coert] The Hawaiian Tech Savant
```
ID:         mosje_coert_tech
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   10
Traits:     Mental ★★, Technical ★★★, Social ★
Rarity:     ◆
Tags:       [COERT]

ABILITY — Extra Resources (Activated during Draw Phase, cost: 10 MP per use, no limit):
  Pay 10 MP → draw 1 additional card.
  Can be activated multiple times per turn as long as MP allows.

SYNERGY — Binti (Passive, while both active on field, no cost):
  Applies when any [BINTI]-tagged Mosje is also on the field.
  Gain DOUBLE MP from all Piecies tagged [FOOD].

Flavor: "Aloha spirit meets silicon efficiency."
```

---

### [The Hacker]
```
ID:         mosje_hacker
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   15
Traits:     Mental ★★★, Technical ★★
Rarity:     ◆
Tags:       [HACKER]
Note:       Placeholder — real name TBD

ABILITY — System Hack (Activated, cost: Free, once every 5 turns, instant):
  Look at the top 3 cards of any deck.
  Rearrange them in any order.
  Gain 10 MP.
  Cooldown: cannot be used again for 5 turns after activation.

Flavor: "Access granted. Reality.exe is now running under my parameters."
```

---

### [Jeffrey] The Silent Gambler
```
ID:         mosje_jeffrey_gambler
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   0
Traits:     Physical ★★★, Technical ★★, Mental ★★
Rarity:     ◆◆
Tags:       [JEFFREY]

ABILITY — High Stakes (Activated, cost: X MP — player chooses amount, once per turn, instant):
  Declare any amount X of your own MP as the wager.
  Roll 1d6:
  - 1–2 = lose X MP (cannot wager more than current MP)
  - 3–4 = keep current MP (no change)
  - 5–6 = gain X MP AND draw 1 card
  If result is 5–6: your next Quest this turn gives +25 MP bonus.

Flavor: "Silent at the table, deadly with the dice."
```

---

### [Chris] The All-Rounder
```
ID:         mosje_chris
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   10
Traits:     Physical ★★★, Technical ★★, Social ★★
Rarity:     ◆
Tags:       [CHRIS]

ABILITY — Perfect Setup (Activated, cost: Free, once per turn):
  Requires 3 or more face-down Piecies on your side of the field.
  Activate 1 face-down Piecie for free (no MP cost) AND gain 15 MP.

SYNERGY — Youri (Passive, while both active on field, no cost):
  Applies when [mosje_youri] is also on the field.
  Both Mosjes may play Piecies directly to active state without placing face-down first
  (instant activation — normal MP costs still apply).

Flavor: "Why specialize when you can master everything?"
```

---

### [Youri] The Speedrunner
```
ID:         mosje_youri
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   0
Traits:     Technical ★★★, Mental ★★, Resilient ★
Rarity:     ◆
Tags:       [YOURI]

ABILITY — Speed Activate (Activated, cost: 20 MP, limit 3 times per game, instant):
  Activate a Piecie the same turn you play it face-down
  (bypasses the normal 1-turn waiting rule).
  Then draw 1 card.

SYNERGY — Chris (Passive, while both active on field, no cost):
  Applies when [mosje_chris] is also on the field.
  Both Mosjes may play Piecies directly to active state without placing face-down first.

Flavor: "Frame-perfect inputs, pixel-perfect movement... wait, is this real life?"
```

---

### [Placeholder 1] The Tactician
```
ID:         mosje_tactician
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   15
Traits:     Mental ★★★, Social ★★, Technical ★
Rarity:     ◆◆
Tags:       [PLACEHOLDER]
Note:       Real name/character TBD

ABILITY — MP Manipulation (Activated, cost: 15 MP, once per turn, instant):
  Set ANY Mosje's MP (yours or opponent's) to exactly 60.
  This bypasses all protection effects.

Flavor: (none listed)
```

---

### [Placeholder 4] The Drainer
```
ID:         mosje_drainer
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   20
Traits:     Mental ★★, Technical ★★★, Resilient ★
Rarity:     ◆◆
Tags:       [PLACEHOLDER]
Note:       Real name/character TBD

ABILITY — Continuous Drain (Passive, automatic at start of each opponent's turn, no cost):
  At the start of EACH opponent's turn: all opponents lose 5 MP.

Flavor: (none listed)
```

---

### [FPS Coert]
```
ID:         mosje_fps_coert
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   15
Traits:     Technical ★★★, Physical ★★, Mental ★★
Rarity:     ◆◆
Tags:       [COERT, FPS]

ABILITY — Headshot Precision (Passive, automatic when completing Physical or Technical Quest):
  After completing a Physical or Technical Quest, roll 1d6:
  - 6 = gain +30 bonus MP AND target opponent loses 15 MP.
  - 1–5 = nothing extra.

SYNERGY — FPS West (Passive, while both active on field, no cost):
  Applies when [mosje_fps_west] is also on the field.
  When EITHER Mosje completes a Quest: BOTH gain +10 MP.
  Once per turn: may force an opponent to reveal their full hand.

Flavor: "Quick scopes and clutch plays — every shot counts."
```

---

### [FPS West]
```
ID:         mosje_fps_west
Type:       MOSJE
Subtype:    DIGITAL
Start MP:   10
Traits:     Technical ★★★, Mental ★★★, Physical ★
Rarity:     ◆◆
Tags:       [WEST, FPS]

ABILITY — Tactical Analysis (Activated, cost: 10 MP, once per turn, instant):
  Look at the opponent's hand.
  Predict their next card type (MOSJE / PIECIE / SNELLE / PLACE / QUEST).
  - Correct = gain 20 MP.
  - Wrong   = lose 10 MP.

SYNERGY — FPS Coert (Passive, while both active on field, no cost):
  Same as FPS Coert's synergy — applies to both.

SYNERGY — Cless (Passive, while both active on field, no cost):
  Applies when any [CLESS]-tagged Mosje is also on the field.
  Physical Quests give +15 bonus MP.
  Once per turn: may look at the top Quest card before attempting.

Flavor: "Analyzing angles, predicting movements, always one step ahead."
```

---

## 🎨 ARTISTIC TYPE MOSJES

---

### [Ronald] The Mastermind
```
ID:         mosje_ronald_mastermind
Type:       MOSJE
Subtype:    ARTISTIC
Start MP:   0
Traits:     Creative ★★★, Mental ★★★
Rarity:     ◆◆
Tags:       [RONALD]

ABILITY — Master Plan (Activated, cost: Free, once per game):
  Activate any Piecie card directly from the discard pile without paying its MP cost.
  The Piecie's effect resolves immediately.

Flavor: "The greatest artist controls not just the canvas, but reality itself."
```

---

### [Jisca] The Maestro
```
ID:         mosje_jisca
Type:       MOSJE
Subtype:    ARTISTIC
Start MP:   0
Traits:     Creative ★★★, Social ★★, Mental ★★
Rarity:     ◆◆
Tags:       [JISCA]

ABILITY — Perfect Combo (Passive, triggered after each Piecie activation):
  After any Piecie resolves this turn, roll 1d6:
  - 4–6 = activate another Piecie from your hand immediately (as if it were a Snelle Piecie).
         On chain success: opponent loses 15 MP.
  - 1–3 = chain fails. This Mosje loses 10 MP.
           (If Mosje is at 0 MP, ignore the damage from chain fail.)

Flavor: "Every note is a weapon, every performance a battle."
```

---

### [Tuk] The Healing Spirit
```
ID:         mosje_tuk_healer
Type:       MOSJE
Subtype:    ARTISTIC
Start MP:   10
Traits:     Creative ★★, Social ★★, Resilient ★★★
Rarity:     ◆◆
Tags:       [TUK]

ABILITY — Healing Presence (Activated, cost: Free, once per turn):
  Choose ONE of:
  A) Gain 25 MP for yourself.
  B) Give 15 MP to an ally Mosje AND draw 1 card.

  PASSIVE BONUS: Whenever this Mosje gains MP from any source, gain +10 additional MP.

Flavor: "Gentle hands, fierce heart. She mends what others break."
```

---

### [DJ 80/20] The Lucky Mixer
```
ID:         mosje_dj_8020
Type:       MOSJE
Subtype:    ARTISTIC
Start MP:   20
Traits:     Creative ★★★, Resilient ★★
Rarity:     ◆
Tags:       [DJ, GANDOE]

ABILITY — Lucky Beats:
  PASSIVE (automatic at turn start, no cost):
    Gain 10 MP at the start of every turn.
  ACTIVE (once per turn, free):
    Reroll any 1 die result this turn.

Flavor: "The beat drops at exactly the right moment... every time."
```

---

### [Coert] KasteLuck
```
ID:         mosje_coert_kasteluck
Type:       MOSJE
Subtype:    ARTISTIC
Start MP:   20
Traits:     Creative ★★, Social ★★, Resilient ★
Rarity:     ◆
Tags:       [COERT]

ABILITY — Morning Luck (Passive, automatic at turn start, no cost):
  Roll 1d6 at the start of every turn:
  - 4–6 = play 1 additional Piecie this turn for free (no MP cost).
  - 1–3 = nothing happens.

SYNERGY — Binti (Passive, while both active on field, no cost):
  Applies when any [BINTI]-tagged Mosje is also on the field.
  Gain DOUBLE MP from all Piecies tagged [FOOD].

Flavor: "When fortune smiles, she takes full advantage."
```

---

### [Binti] The Sharp Tongue
```
ID:         mosje_binti
Type:       MOSJE
Subtype:    ARTISTIC
Start MP:   5
Traits:     Creative ★★, Social ★★★
Rarity:     ◆
Tags:       [BINTI]
Note:       Starting MP 5 rounds up to 10 at game init.

ABILITY — Cutting Words (Activated, cost: Discard 1 Piecie from hand, once per turn, instant):
  Discard 1 Piecie card from your hand as the cost.
  Target opponent discards 1 random card from their hand AND loses 10 MP.

SYNERGY — Coert (Passive, while both active on field, no cost):
  Applies when any [COERT]-tagged Mosje is also on the field.
  Gain DOUBLE MP from all Piecies tagged [FOOD].

Flavor: "Her words cut deeper than any blade."
```

---

### [Binti] The Creator
```
ID:         mosje_binti_creator
Type:       MOSJE
Subtype:    ARTISTIC
Start MP:   60
Traits:     Creative ★★★, Social ★★
Rarity:     (none listed)
Tags:       [BINTI]

ABILITY — Quick Sketch (Activated, cost: Discard 2 FOOD-tagged Piecies from hand):
  Discard 2 Piecies tagged [FOOD] from your hand.
  Search your deck for any 1 card.
  Place it directly on the field in active position (normal activation costs apply).

Flavor: (none listed)
```

---

### [Cless] The Teacher
```
ID:         mosje_cless_teacher
Type:       MOSJE
Subtype:    ARTISTIC
Start MP:   10
Traits:     Creative ★★★, Mental ★★
Rarity:     ◆
Tags:       [CLESS]

ABILITY — Teaching Moment (Passive, triggered on every Piecie activation, no cost):
  Whenever you activate any Piecie, roll 1d6:
  - 5–6 = draw 1 card AND gain 5 MP.
  - 1–4 = nothing happens.

SYNERGY — West (Passive, while both active on field, no cost):
  Applies when any [WEST]-tagged Mosje is also on the field.
  Physical Quests give +15 bonus MP.
  Once per turn: may look at top Quest card before attempting.

PET SYNERGY — ViannaPoes (Activated by [piecie_vianna_poes], costs 15 MP, lasts 2 turns):
  Reduce all MP loss for this Mosje by 50%.

WEAKNESS — Parkeren Delft (Passive, triggered):
  When the Quest [quest_parkeren_delft] is completed AND any [COERT]-tagged Mosje is on
  the field: this Mosje takes +20 additional MP damage (psychological fear).

Flavor: "When inspiration strikes, magic happens."
```

---

### [Martin] The Precision Driver
```
ID:         mosje_martin_driver
Type:       MOSJE
Subtype:    ARTISTIC
Start MP:   20
Traits:     Creative ★★★, Technical ★★, Mental ★★
Rarity:     ◆◆
Tags:       [MARTIN]

ABILITY 1 — Perfect Line (Passive, automatic on Quest completion, no cost):
  After completing any Quest: gain +15 MP.
  Once per game: Roll at turn start: 4–6 = complete 1 additional Quest this turn.

ABILITY 2 — Pit Stop Strategy (Activated, cost: Discard 2 cards, once per turn):
  Discard 2 cards from your hand.
  Draw 3 cards AND gain 20 MP.

Flavor: "Finding the racing line between chaos and control — every millisecond counts."
```

---

### [Placeholder 3] The Amplifier
```
ID:         mosje_amplifier
Type:       MOSJE
Subtype:    ARTISTIC
Start MP:   10
Traits:     Creative ★★★, Mental ★★, Social ★
Rarity:     ◆◆◆
Tags:       [PLACEHOLDER]
Note:       Real name/character TBD

ABILITY — Power Boost (Activated, cost: 30 MP, limit 2 times per game, lasts 1 turn):
  All your Mosjes' abilities trigger TWICE this turn.
  Duration: this turn only.

Flavor: (none listed)
```

---

### [Coert] Kast-elein
```
ID:         mosje_coert_kastelein
Type:       MOSJE
Subtype:    ARTISTIC
Start MP:   20
Traits:     Creative ★★, Resilient ★★★, Physical ★★
Rarity:     ◆◆◆
Tags:       [COERT]

ABILITY 1 — Immovable Object (Passive, permanent, no cost):
  Reduce ALL incoming MP loss by 20 (permanent, stacks with other reductions).
  When you would take 50+ MP damage from a single source: reduce it to 25 instead.
  Cannot be sent to Welloe pile while this Mosje has 30+ MP.

ABILITY 2 — Castle Builder (Activated, cost: Free, once per game, permanent until destroyed):
  Create a "Castle" token on the field.
  While Castle exists: gain +10 MP at turn start.
  Opponent must deal 70+ damage in ONE turn to destroy the Castle.

SYNERGY — Binti (Passive, while both active on field, no cost):
  Gain DOUBLE MP from all Piecies tagged [FOOD].

Flavor: "Built like a closet — unmovable, unshakeable, unstoppable."
```

---

### [Tuk "The Builder"] The Sims Architect
```
ID:         mosje_tuk_architect
Type:       MOSJE
Subtype:    ARTISTIC
Start MP:   10
Traits:     Technical ★★★, Creative ★★★, Mental ★★
Rarity:     ◆◆
Tags:       [TUK]

ABILITY 1 — Perfect Placement (Activated, cost: 15 MP, once per turn, instant):
  Look at the top 5 cards of your deck.
  Choose 2 and add them to your hand. Put the rest on the bottom.
  If both chosen cards are Piecies: immediately place 1 of them face-down for free.

ABILITY 2 — House Design (Passive, automatic at turn start, no cost):
  You may place 1 additional Piecie face-down this turn (max 2 total per turn).

SYNERGY — Gandoe (Activated by [piecie_bowie_stormey], costs 15 MP, lasts 2 turns):
  Requires both this Mosje AND any [GANDOE]-tagged Mosje on field.
  Reduce ALL MP loss by 75% (instead of 50%).
  Both Mosjes gain +15 MP per turn.

Flavor: "Every piece in its perfect place — just like her dream houses."
```

---

### [Dancing/DDR Chris]
```
ID:         mosje_chris_ddr
Type:       MOSJE
Subtype:    ARTISTIC
Start MP:   15
Traits:     Physical ★★★, Creative ★★★, Social ★★
Rarity:     ◆◆
Tags:       [CHRIS]

ABILITY — Perfect Combo Chain (Passive, triggered on Piecie activation):
  After any Piecie activates this turn, roll 1d6:
  - 5–6 = activate another Piecie from hand for free (no MP cost).
  Chain can repeat up to 3 times per turn maximum.

SYNERGY — Youri (Passive, while both active on field, no cost):
  Applies when [mosje_youri] is also on the field.
  Both may play Piecies directly to active state without face-down waiting.

Flavor: "Four arrows, perfect timing, infinite style."
```

---
---

# 🎴 SECTION 2 — PIECIE CARDS

> Piecies must be placed face-down and remain face-down for 1 full turn before activation.
> Exception: cards or abilities that specifically bypass this rule.

---

## 🍽️ MOMENTUM-GAINING PIECIES

---

### Kannetje Melk
```
ID:         piecie_kannetje_melk
Type:       PIECIE
Subtype:    MOMENTUM-GAINING
MP Cost:    Free
Req:        Any
Rarity:     ★★☆☆☆
Tags:       [FOOD, RESTORE]

EFFECT:
  Gain 25 MP to your active Mosje.
  If [COERT/BINTI FOOD SYNERGY] is active: gain 50 MP instead.

Flavor: (none listed)
```

---

### Broodje Döner
```
ID:         piecie_broodje_doner
Type:       PIECIE
Subtype:    MOMENTUM-GAINING
MP Cost:    Free
Req:        Level 1+
Rarity:     ★★★☆☆
Tags:       [FOOD, RESTORE]

EFFECT:
  Gain 35 MP to your active Mosje.
  If [COERT/BINTI FOOD SYNERGY] is active: gain 70 MP instead.

Flavor: (none listed)
```

---

### Ronald Kip
```
ID:         piecie_ronald_kip
Type:       PIECIE
Subtype:    MOMENTUM-GAINING
MP Cost:    Free
Req:        Level 2+
Rarity:     ★★★★☆
Tags:       [FOOD, RESTORE]

EFFECT:
  Gain 50 MP to your active Mosje.
  RONALD SYNERGY: If any [RONALD]-tagged Mosje is on the field:
    → Gain 60 MP instead of 50 MP AND draw 1 card.
  If [COERT/BINTI FOOD SYNERGY] is also active: double the base amount.

Flavor: (none listed)
```

---

### Chef's Special
```
ID:         piecie_chefs_special
Type:       PIECIE
Subtype:    MOMENTUM-GAINING
MP Cost:    10 MP
Req:        Level 1+
Rarity:     ★★★★☆
Tags:       [FOOD]

EFFECT:
  If any [RONALD]-tagged Mosje is on the field:
    → Look at the opponent's full hand.
    → Gain 30 MP for each Piecie card in their hand.
  If NO Ronald on field:
    → Gain 15 MP.

Flavor: (none listed)
```

---

### Momentum Boost
```
ID:         piecie_momentum_boost
Type:       PIECIE
Subtype:    MOMENTUM-GAINING
MP Cost:    Free
Req:        Level 1+
Rarity:     ★★★☆☆
Tags:       [RESTORE]

EFFECT:
  Restore 15 MP to your active Mosje.
  Your next Quest this turn gives +10 bonus MP on success.

Flavor: (none listed)
```

---

### Eendjes voeren
```
ID:         piecie_eendjes_voeren
Type:       PIECIE
Subtype:    MOMENTUM-GAINING
MP Cost:    Free
Req:        Any
Rarity:     ★★★☆☆
Tags:       [RESTORE]

EFFECT:
  Gain 30 MP to your active Mosje.
  If that Mosje has Resilient ★★ or higher: gain 40 MP instead.

Flavor: (none listed)
```

---

### Varkenspootjes
```
ID:         piecie_varkenspootjes
Type:       PIECIE
Subtype:    MOMENTUM-GAINING
MP Cost:    Free
Req:        Any
Rarity:     ★★★★☆
Tags:       [FOOD]

EFFECT:
  If [mosje_binti] or any [BINTI]-tagged Mosje is on the field:
    → Gain 60 MP.
  If ANY other Mosje (not Binti) is on the field:
    → Lose 30 MP instead.
  (Wendy's special dish — only Binti appreciates the unique flavor!)

Flavor: (none listed)
```

---

### Energy Surge
```
ID:         piecie_energy_surge
Type:       PIECIE
Subtype:    MOMENTUM-GAINING
MP Cost:    Free
Req:        Any
Rarity:     ★★☆☆☆
Tags:       [RESTORE]

EFFECT:
  Can only be played if your active Mosje has less than 30 MP.
  Gain 20 MP instantly.

Flavor: (none listed)
```

---

### Warm Kannetje Melk
```
ID:         piecie_warm_kannetje_melk
Type:       PIECIE
Subtype:    MOMENTUM-GAINING
MP Cost:    Free
Req:        Any
Rarity:     ★★☆☆☆
Tags:       [FOOD]

EFFECT:
  Lose 10 MP.
  Draw 2 cards.

Flavor: (none listed)
```

---

## ⚔️ MOMENTUM-DRAINING PIECIES (ATTACK)

---

### Super Saiyan Mos
```
ID:         piecie_super_saiyan_mos
Type:       PIECIE
Subtype:    ATTACK
MP Cost:    15 MP
Req:        Level 1+
Rarity:     ★★★☆☆
Tags:       [ATTACK]

EFFECT:
  Your next Quest drains 25 MP from a target opponent on success.

Flavor: (none listed)
```

---

### Te Hard Gaan
```
ID:         piecie_te_hard_gaan
Type:       PIECIE
Subtype:    ATTACK
MP Cost:    15 MP
Req:        Any
Rarity:     ★★★☆☆
Tags:       [ATTACK]

EFFECT:
  Target opponent loses 25 MP.

Flavor: (none listed)
```

---

### Momentum Diefje
```
ID:         piecie_momentum_diefje
Type:       PIECIE
Subtype:    ATTACK
MP Cost:    20 MP
Req:        Level 2+
Rarity:     ★★★★☆
Tags:       [ATTACK, STEAL]

EFFECT:
  Steal 20 MP from a target opponent.
  Add that stolen MP to your active Mosje.

Flavor: (none listed)
```

---

### Snoeiertje
```
ID:         piecie_snoeiertje
Type:       PIECIE
Subtype:    ATTACK
MP Cost:    Free
Req:        Any
Rarity:     ★★★☆☆
Tags:       [ATTACK]

EFFECT:
  Your next Quest drains 15 MP from the opponent on success.
  At the end of this turn: you lose 15 MP (self-damage).

Flavor: (none listed)
```

---

### Jantje Jantje...
```
ID:         piecie_jantje_jantje
Type:       PIECIE
Subtype:    ATTACK
MP Cost:    10 MP
Req:        Level 1+
Rarity:     ★★★★☆
Tags:       [ATTACK, REVEAL]

EFFECT:
  Name a specific card by name.
  Reveal the opponent's full hand.
  - If the named card is in their hand: opponent loses 50 MP.
  - If wrong: you lose 30 MP.

Flavor: (none listed)
```

---

### Dikke Taks
```
ID:         piecie_dikke_taks
Type:       PIECIE
Subtype:    ATTACK
MP Cost:    25 MP
Req:        Level 2+
Rarity:     ★★★★☆
Tags:       [ATTACK, AOE]

EFFECT:
  All opponents lose 35 MP.
  If there are 3 or more opponents: each loses 40 MP instead.
  You draw 2 cards.

Flavor: (none listed)
```

---

### Kleine Taks
```
ID:         piecie_kleine_taks
Type:       PIECIE
Subtype:    ATTACK
MP Cost:    15 MP
Req:        Level 1+
Rarity:     ★★★☆☆
Tags:       [ATTACK, DOT]

EFFECT:
  Target opponent loses 10 MP per turn for 4 turns (total 40 MP).
  This effect ticks at the end of the opponent's turn.
  If the opponent completes a Quest during this effect: they still lose the MP.
  Track remaining ticks as a status effect on the target Mosje.

Flavor: (none listed)
```

---

## 🔧 UTILITY PIECIES

---

### Pot of Weed
```
ID:         piecie_pot_of_weed
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    Free
Req:        Any
Rarity:     ★★★☆☆
Tags:       [DRAW]

EFFECT:
  Draw 2 cards from your deck.

Flavor: (none listed)
```

---

### Zie je die Dingetjes
```
ID:         piecie_zie_je_die_dingetjes
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    Free
Req:        Level 1+
Rarity:     ★★★★☆
Tags:       [DRAW, SEARCH]

EFFECT:
  Look at the top 3 cards of your deck.
  Choose 1 and add it to your hand.
  Put the remaining 2 back in any order.

Flavor: (none listed)
```

---

### Slecht Gezet
```
ID:         piecie_slecht_gezet
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    Free
Req:        Any
Rarity:     ★★★☆☆
Tags:       [DESTROY]

EFFECT:
  Destroy the currently active Place card.
  Send it to the Place discard pile.

Flavor: (none listed)
```

---

### Bong Hit Demolition
```
ID:         piecie_bong_hit_demolition
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    10 MP
Req:        Any
Rarity:     ★★★★☆
Tags:       [DESTROY, DRAW, SUBSTANCE]

EFFECT:
  Destroy the currently active Place card.
  Draw 2 cards.

Flavor: (none listed)
```

---

### Redbull
```
ID:         piecie_redbull
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    20 MP
Req:        Level 1+
Rarity:     ★★★☆☆
Tags:       [ABILITY-BOOST]

EFFECT:
  Your active Mosje's unique ability triggers TWICE this turn.

Flavor: (none listed)
```

---

### TweedeKANs
```
ID:         piecie_tweede_kans
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    5 MP
Req:        Any
Rarity:     ★★☆☆☆
Tags:       [DICE]

EFFECT:
  Reroll any 1 die result this turn.

Flavor: (none listed)
```

---

### Bagga of Greed
```
ID:         piecie_bagga_of_greed
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    Free
Req:        Any
Rarity:     ★★★☆☆
Tags:       [DRAW]

EFFECT:
  Draw 2 cards from your deck.
  Then discard 1 card from your hand.

Flavor: (none listed)
```

---

### Dubbele Ding
```
ID:         piecie_dubbele_ding
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    25 MP
Req:        Level 2+
Rarity:     ★★★★☆
Tags:       [CHAIN]

EFFECT:
  Activate 2 Piecies from your hand immediately and in sequence.
  Both resolve this turn (bypassing face-down waiting rule for both).

Flavor: (none listed)
```

---

### TemPiecie
```
ID:         piecie_tempiecie
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    15 MP
Req:        Level 1+
Rarity:     ★★★★☆
Tags:       [RECOVERY]

EFFECT:
  Retrieve any 1 card from your discard pile and add it to your hand.
  You cannot play the retrieved card this turn.

Flavor: (none listed)
```

---

### Quest Prep
```
ID:         piecie_quest_prep
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    10 MP
Req:        Any
Rarity:     ★★★☆☆
Tags:       [QUEST-BOOST]

EFFECT:
  Your next Quest roll this turn gets +2 added to the dice result.

Flavor: (none listed)
```

---

### MP Amplifier
```
ID:         piecie_mp_amplifier
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    10 MP
Req:        Any
Rarity:     ★★★☆☆
Tags:       [MP-BOOST]

EFFECT:
  Your next MP gain this turn is increased by 50%.
  Apply as a status effect: MP_AMPLIFIER, value: 50, turnsLeft: 1.

Flavor: (none listed)
```

---

### Mosje Reborn
```
ID:         piecie_mosje_reborn
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    Free
Req:        Any
Rarity:     ★★★★☆
Tags:       [REVIVE]
Limit:      1 copy per deck

EFFECT:
  Target a Mosje that has previously been at the Level it is now being revived at.
  Revive that Mosje from the Welloe pile:
  - From Level 0 experience: revive with 60 MP
  - From Level 1 experience: revive with 40 MP
  - From Level 2 experience: revive with 20 MP

Flavor: (none listed)
```

---

### Afblijven!
```
ID:         piecie_afblijven
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    10 MP
Req:        Any
Rarity:     ★★☆☆☆
Tags:       [PROTECT]

EFFECT:
  Your active Mosje cannot lose MP from opponent effects until your next turn.
  Apply as status: OPPONENT_MP_IMMUNE, turnsLeft: 1.

Flavor: (none listed)
```

---

### Laat me chillen!
```
ID:         piecie_laat_me_chillen
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    10 MP
Req:        Any
Rarity:     ★★☆☆☆
Tags:       [PROTECT]

EFFECT:
  The next time your active Mosje would lose MP: reduce that loss by 20.
  One-time trigger — expires after it absorbs one instance of damage.

Flavor: (none listed)
```

---

### Synergy Field
```
ID:         piecie_synergy_field
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    15 MP
Req:        Any
Rarity:     ★★★★☆
Tags:       [FIELD-EFFECT]

EFFECT:
  Stays on field for 3 turns (persistent Piecie — does not go to discard immediately).
  While active: all Mosje abilities that restore MP restore +10 additional MP.
  When the 3 turns expire: send this card to discard.

Flavor: (none listed)
```

---

### Mosje Shield
```
ID:         piecie_mosje_shield
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    15 MP
Req:        Any
Rarity:     ★★★☆☆
Tags:       [PROTECT, FIELD-EFFECT]

EFFECT:
  Stays on field for 2 turns.
  While active: target Mosje cannot be sent to the Welloe pile.
  When the 2 turns expire: send this card to discard.

Flavor: (none listed)
```

---

### Emergency Swap
```
ID:         piecie_emergency_swap
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    30 MP
Req:        Level 1+
Rarity:     ★★★☆☆
Tags:       [COPY]

EFFECT:
  Choose any Mosje card from any player's deck or field.
  Your active Mosje copies and uses that Mosje's unique ability this turn.
  You must pay any activation costs required by the copied ability.
  The original Mosje can still use their own ability normally this turn.

Flavor: (none listed)
```

---

### Battle Concert
```
ID:         piecie_battle_concert
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    25 MP
Req:        Level 2+
Rarity:     ★★★★☆
Tags:       [REDIRECT, ALYSSA]

EFFECT:
  Lasts until end of turn or until triggered once (whichever comes first).
  The next time [mosje_alyssa_bulldozer] would take MP damage from a Quest failure:
    → Redirect that damage to a target opponent's Mosje instead.
      (If opponent has 2 Mosjes, choose 1.)
    → Alyssa still triggers her Unstoppable ability (gains +25 MP) as if she took the damage.

Flavor: (none listed)
```

---

### Stookerino
```
ID:         piecie_stookerino
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    10 MP
Req:        Level 1+
Rarity:     ★★★★☆
Tags:       [REVEAL, DISCARD]

EFFECT:
  Target opponent's Mosje: reveal their hand to all players.
  Opponent must discard 1 card of your choice from their hand.
  You gain MP equal to the discarded card's MP cost.
  If [mosje_binti] or any [BINTI]-tagged Mosje is on your field:
    → Binti gains +10 additional MP.

Flavor: (none listed)
```

---

### Dingetje toch?! (You Know, That Thing!!)
```
ID:         piecie_dingetje_toch
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    Free
Req:        Any
Rarity:     ★★★★★
Tags:       [WILDCARD]

EFFECT:
  Universal wildcard — counts as ANY named card for any requirement check.
  Can substitute for:
  - Any named Piecie requirement in a card effect.
  - Any Quest requirement that names a specific card.
  - Any trait level requirement (counts as any trait at any star level).
  Discard this card after use.

Flavor: (none listed)
```

---

### Shhh, popo komt!
```
ID:         piecie_popo_komt
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    Free
Req:        Any
Rarity:     ★★★☆☆
Tags:       [CONDITIONAL, DESTROY]

EFFECT:
  Can only activate if there are MORE than 2 Mosjes total on the playing field.
  Destroy the currently active Place card.

Flavor: (none listed)
```

---

### Huisbaas
```
ID:         piecie_huisbaas
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    Free
Req:        Any
Rarity:     ★★★★☆
Tags:       [CONDITIONAL, PLACE-SWAP]

EFFECT:
  Can only activate if any player used a [SUBSTANCE]-tagged Piecie on their last turn.
  Destroy the current active Place card.
  Search your deck for any Place card and play it as the new active Place.

Flavor: (none listed)
```

---

### Those Eyelashes Tho...
```
ID:         piecie_those_eyelashes
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    15 MP
Req:        Level 1+
Rarity:     ★★★★☆
Tags:       [MARTIN, WEST, AOE]

EFFECT:
  If any [MARTIN] or [WEST]-tagged Mosje is on your field:
    → All opponents must discard 1 card from their hand.
    → You gain 20 MP.
    → Look at the opponent's full hand.
    → Until end of turn: opponents cannot activate Snelle Piecies.
  If NO Martin/West Mosje on your field:
    → This card does nothing.

Flavor: (none listed)
```

---

### F1 Telemetry Data
```
ID:         piecie_f1_telemetry
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    10 MP
Req:        Any
Rarity:     ★★★☆☆
Tags:       [MARTIN, WEST, QUEST-BOOST]

EFFECT:
  If [mosje_martin_driver] or any [WEST]-tagged Mosje is on your field:
    → Gain 40 MP AND draw 2 cards.
    → Your next Quest this turn gives +20 bonus MP.
  If NO Martin/West Mosje on field:
    → Gain 15 MP AND draw 1 card.

Flavor: (none listed)
```

---

### Perfect Setup (Piecie)
```
ID:         piecie_perfect_setup
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    Free
Req:        Level 1+
Rarity:     ★★★☆☆
Tags:       [MP-SET, COMBO]

EFFECT:
  Set your active Mosje's MP to any exact value between 60–90 until end of your turn.
  After your turn ends: MP returns to its original value before this card was played.
  Use for precise Quest MP requirements or combo setups.

Flavor: (none listed)
```

---

### MP Adjuster
```
ID:         piecie_mp_adjuster
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    10 MP
Req:        Any
Rarity:     ★★★★☆
Tags:       [MP-SET]

EFFECT:
  Set your active Mosje's MP to any exact value between 30–100.
  This change is PERMANENT (does not reset at end of turn).
  Use for Quest requirements or strategic positioning.

Flavor: (none listed)
```

---

### Chain Reaction
```
ID:         piecie_chain_reaction
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    20 MP
Req:        Level 1+
Rarity:     ★★★★☆
Tags:       [CHAIN]

EFFECT:
  This turn: after you activate any Piecie, you may activate one more Piecie from hand for free.
  The free activation applies once per Chain Reaction card.

Flavor: (none listed)
```

---

### Double Trigger
```
ID:         piecie_double_trigger
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    25 MP
Req:        Level 2+
Rarity:     ★★★★☆
Tags:       [ABILITY-BOOST]

EFFECT:
  Target Mosje (yours) activates their unique ability TWICE this turn.

Flavor: (none listed)
```

---

### Call of the Welloes
```
ID:         piecie_call_of_welloes
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    Free
Req:        Any
Rarity:     ★★★☆☆
Tags:       [REVIVE, FIELD-EFFECT]

EFFECT:
  Target 1 Mosje in your Welloe (defeated) pile.
  Summon that Mosje to the field.
  This card stays on field as long as that Mosje is on field.
  When this card leaves the field: destroy the summoned Mosje.
  When the summoned Mosje is destroyed: destroy this card.

Flavor: (none listed)
```

---

### Welloe Force
```
ID:         piecie_welloe_force
Type:       PIECIE
Subtype:    UTILITY
MP Cost:    10 MP
Req:        Level 1+
Rarity:     ★★★★☆
Tags:       [REDIRECT]

EFFECT:
  Discard 1 card from your hand.
  Redirect the effect of any Piecie or Mosje ability currently resolving to a new target.

Flavor: (none listed)
```

---

## 🐾 PET PROTECTION PIECIES

---

### Bowie & Stormey
```
ID:         piecie_bowie_stormey
Type:       PIECIE
Subtype:    PET
MP Cost:    15 MP
Req:        Any
Rarity:     ★★★★☆
Tags:       [PET, PROTECT]

EFFECT:
  Lasts 2 turns (persistent Piecie).
  While active: any [GANDOE], [DJ], [TUK], or [MICHELLE]-tagged Mosje on your field
  reduces all MP loss by 50%.

  SYNERGY BONUS: If both any [GANDOE]-tagged Mosje AND any [TUK] or [MICHELLE]-tagged
  Mosje are BOTH on the field simultaneously:
    → Upgrade to 75% MP loss reduction (instead of 50%).
    → Both Mosjes gain +15 MP per turn.

Flavor: (none listed)
```

---

### Gekke Vogels
```
ID:         piecie_gekke_vogels
Type:       PIECIE
Subtype:    PET
MP Cost:    15 MP
Req:        Any
Rarity:     ★★★☆☆
Tags:       [PET, PROTECT, JISCA]

EFFECT:
  Lasts 2 turns.
  While active: [mosje_jisca] reduces all MP loss by 50%.

  SYNERGY BONUS: If both [mosje_jisca] AND any [ALYSSA]-tagged Mosje are on field
  AND both [piecie_gekke_vogels] AND [piecie_katjegang] are active:
    → Upgrade to 80% MP loss reduction.
    → Both Mosjes gain +25 MP per turn.

Flavor: (none listed)
```

---

### KatjeGang
```
ID:         piecie_katjegang
Type:       PIECIE
Subtype:    PET
MP Cost:    15 MP
Req:        Any
Rarity:     ★★★☆☆
Tags:       [PET, PROTECT, ALYSSA]

EFFECT:
  Lasts 2 turns.
  While active: any [ALYSSA]-tagged Mosje reduces all MP loss by 50%.

  SYNERGY BONUS: Same as Gekke Vogels — requires both pet Piecies + both Mosjes active.
    → Upgrade to 80% MP loss reduction.
    → Both Mosjes gain +25 MP per turn.

Flavor: (none listed)
```

---

### ViannaPoes
```
ID:         piecie_vianna_poes
Type:       PIECIE
Subtype:    PET
MP Cost:    15 MP
Req:        Any
Rarity:     ★★★☆☆
Tags:       [PET, PROTECT, CLESS]

EFFECT:
  Lasts 2 turns.
  While active: any [CLESS]-tagged Mosje reduces all MP loss by 50%.

Flavor: (none listed)
```

---

## 🌿 SUBSTANCE PIECIES (HIGH RISK / HIGH REWARD)

---

### Grammetje Pieter
```
ID:         piecie_grammetje_pieter
Type:       PIECIE
Subtype:    SUBSTANCE
MP Cost:    Free
Req:        Any
Rarity:     ★★☆☆☆
Tags:       [SUBSTANCE, GAMBLE]

EFFECT:
  Roll 1d6:
  - 1–3 = lose 15 MP
  - 4–6 = gain 30 MP

Flavor: (none listed)
```

---

### Dikke Jonko
```
ID:         piecie_dikke_jonko
Type:       PIECIE
Subtype:    SUBSTANCE
MP Cost:    Free
Req:        Level 1+
Rarity:     ★★★☆☆
Tags:       [SUBSTANCE]

EFFECT:
  You gain 25 MP.
  Each opponent gains 10 MP.
  All players (including you) draw 1 card.

Flavor: (none listed)
```

---

### Affoe
```
ID:         piecie_affoe
Type:       PIECIE
Subtype:    SUBSTANCE
MP Cost:    5 MP
Req:        Any
Rarity:     ★★☆☆☆
Tags:       [SUBSTANCE, ATTACK]

EFFECT:
  Target opponent loses 15 MP.
  You gain 10 MP.

Flavor: (none listed)
```

---

### Stripje Bennies
```
ID:         piecie_stripje_bennies
Type:       PIECIE
Subtype:    SUBSTANCE
MP Cost:    Free
Req:        Level 1+
Rarity:     ★★★☆☆
Tags:       [SUBSTANCE, DRAW]

EFFECT:
  Draw 3 cards.
  Lose 20 MP.

Flavor: (none listed)
```

---

### Tikker
```
ID:         piecie_tikker
Type:       PIECIE
Subtype:    SUBSTANCE
MP Cost:    Free
Req:        Any
Rarity:     ★★★☆☆
Tags:       [SUBSTANCE]

EFFECT:
  Gain 40 MP.
  You cannot complete any Quests on your next turn.
  Apply status: QUEST_BLOCKED, turnsLeft: 1.

Flavor: (none listed)
```

---

### Straffoe
```
ID:         piecie_straffoe
Type:       PIECIE
Subtype:    SUBSTANCE
MP Cost:    Free
Req:        Level 2+
Rarity:     ★★★★☆
Tags:       [SUBSTANCE, QUEST-FORCE]

EFFECT:
  All Mosjes (including yours) lose 20 MP.
  Immediately after: each player must attempt a Quest (draw from shared General Quest deck).

Flavor: (none listed)
```

---

### Larry / Zegeltje
```
ID:         piecie_larry_zegeltje
Type:       PIECIE
Subtype:    SUBSTANCE
MP Cost:    Free
Req:        Any
Rarity:     ★★★☆☆
Tags:       [SUBSTANCE, GAMBLE]

EFFECT:
  Roll 1d6:
  - 1–2 = lose 25 MP AND discard 1 card from hand
  - 3–4 = gain 20 MP
  - 5–6 = gain 40 MP AND draw 2 cards

  COMBO NOTE: Can be used as a requirement for Quest [quest_larry_temmen].

Flavor: (none listed)
```

---

## 💻 DIGITAL EQUIPMENT PIECIES

---

### Keyboard
```
ID:         piecie_keyboard
Type:       PIECIE
Subtype:    DIGITAL-EQUIPMENT
MP Cost:    Free
Req:        Any
Rarity:     ★★☆☆☆
Tags:       [DIGITAL-EQUIPMENT]

EFFECT:
  If you have any Digital-type Mosje on the field:
    → Gain 10 MP AND draw 1 card.
  Can be combined with Mouse and Controller for enhanced effects (see Digital Gaming Stop).

Flavor: (none listed)
```

---

### Mouse
```
ID:         piecie_mouse
Type:       PIECIE
Subtype:    DIGITAL-EQUIPMENT
MP Cost:    Free
Req:        Any
Rarity:     ★★☆☆☆
Tags:       [DIGITAL-EQUIPMENT]

EFFECT:
  If you have any Digital-type Mosje on the field:
    → Gain 10 MP AND look at the top 2 cards of any deck.
  Can be combined with Keyboard and Controller for enhanced effects.

Flavor: (none listed)
```

---

### Controller
```
ID:         piecie_controller
Type:       PIECIE
Subtype:    DIGITAL-EQUIPMENT
MP Cost:    Free
Req:        Any
Rarity:     ★★☆☆☆
Tags:       [DIGITAL-EQUIPMENT]

EFFECT:
  If you have any Digital-type Mosje on the field:
    → Gain 10 MP AND your next Quest roll gets +1.
  Can be combined with Keyboard and Mouse for enhanced effects.

Flavor: (none listed)
```

---

## ⚠️ ATTACK PIECIES (UNUSED / BOOSTER ONLY)

---

### Continuous Assault
```
ID:         piecie_continuous_assault
Type:       PIECIE
Subtype:    ATTACK
MP Cost:    20 MP
Req:        Level 2+
Rarity:     ★★★★☆
Tags:       [ATTACK, DOT, FIELD-EFFECT]
Note:       Unused — reserved for booster packs

EFFECT:
  Persistent Piecie — stays on field for 4 turns.
  While active: target opponent loses 10 MP per turn.
  When 4 turns expire: send to discard.

Flavor: (none listed)
```

---

### Harde Didde (Nullification Strike)
```
ID:         piecie_harde_didde
Type:       PIECIE
Subtype:    ATTACK
MP Cost:    40 MP
Req:        Level 2+
Rarity:     ★★★★★
Tags:       [ATTACK, ELIMINATION]
Limit:      1 copy per deck
Note:       Unused — reserved for booster packs

EFFECT:
  Send target Mosje to the Welloe pile.
  Can only target Mosjes with 0–40 MP.
  The target's Level and all MP progress is permanently lost.

Flavor: (none listed)
```

---

### MP Hemorrhage
```
ID:         piecie_mp_hemorrhage
Type:       PIECIE
Subtype:    ATTACK
MP Cost:    25 MP
Req:        Level 2+
Rarity:     ★★★★☆
Tags:       [ATTACK, DOT]
Note:       Unused — reserved for booster packs

EFFECT:
  Target opponent loses 15 MP immediately.
  Target opponent loses another 15 MP at the start of their next turn.
  Total damage: 30 MP over 2 turns.

Flavor: (none listed)
```

---

### Klaar Met Jou (Execution Order)
```
ID:         piecie_klaar_met_jou
Type:       PIECIE
Subtype:    ATTACK
MP Cost:    25 MP
Req:        Level 2+
Rarity:     ★★★★★
Tags:       [ATTACK, ELIMINATION]
Note:       Unused — reserved for booster packs

EFFECT:
  Send target Mosje to the Welloe pile.
  Can only target Mosjes with 0–30 MP.
  The target's Level and all MP progress is permanently lost.
  You draw 1 card.

Flavor: (none listed)
```

---
---

# ⚡ SECTION 3 — SNELLE PIECIE CARDS (INSTANT)

> Snelle Piecies are played directly from hand at ANY time — even during an opponent's turn.
> They do NOT need to be placed face-down first.

---

### FF Haaltje Nemen
```
ID:         snelle_ff_haaltje_nemen
Type:       SNELLE_PIECIE
MP Cost:    0 MP
Req:        Any
Rarity:     ★☆☆☆☆

EFFECT:
  Reduce incoming MP loss by 20.
  If the active Mosje has Resilient ★★ or higher: reduce by 30 instead.

Flavor: (none listed)
```

---

### Emergency Healings
```
ID:         snelle_emergency_healings
Type:       SNELLE_PIECIE
MP Cost:    10 MP
Req:        Any
Rarity:     ★★☆☆☆

EFFECT:
  Restore 25 MP to your active Mosje instantly.
  If the active Mosje has Resilient ★★ or higher: restore 35 MP instead.

Flavor: (none listed)
```

---

### Lucky Cóin
```
ID:         snelle_lucky_coin
Type:       SNELLE_PIECIE
MP Cost:    10 MP
Req:        Creative ★
Rarity:     ★☆☆☆☆

EFFECT:
  Reroll any 1 die result.
  If the active Mosje has Creative ★★★: choose the result instead of rerolling.

Flavor: (none listed)
```

---

### Counter Strikka
```
ID:         snelle_counter_strikka
Type:       SNELLE_PIECIE
MP Cost:    15 MP
Req:        Mental ★★
Rarity:     ★★☆☆☆

EFFECT:
  Redirect a Piecie that is currently resolving to a different target.
  If the active Mosje has Mental ★★★: also draw 1 card.

Flavor: (none listed)
```

---

### Perfect Dodge
```
ID:         snelle_perfect_dodge
Type:       SNELLE_PIECIE
MP Cost:    20 MP
Req:        Physical ★★
Rarity:     ★★★☆☆

EFFECT:
  Reduce incoming MP loss of 30 or more to only 10.
  If the active Mosje has Physical ★★★: reduce to 0 instead.

Flavor: (none listed)
```

---

### Jammertje Gepakt
```
ID:         snelle_jammertje_gepakt
Type:       SNELLE_PIECIE
MP Cost:    20 MP
Req:        Mental ★★★
Rarity:     ★★★☆☆

EFFECT:
  Cancel a Piecie activation currently being attempted.
  Send that Piecie to the bottom of its owner's deck (not discard).
  If the active Mosje has Mental ★★★: also draw 1 card.

Flavor: (none listed)
```

---

### Momentum Rush
```
ID:         snelle_momentum_rush
Type:       SNELLE_PIECIE
MP Cost:    Free
Req:        Any
Rarity:     ★★☆☆☆

EFFECT:
  Gain 15 MP instantly.
  Draw 1 card.

Flavor: (none listed)
```

---

### Negate Elimination
```
ID:         snelle_negate_elimination
Type:       SNELLE_PIECIE
MP Cost:    20 MP
Req:        Any
Rarity:     ★★★★☆

EFFECT:
  Negate any effect that would send a Mosje to the Welloe pile.
  The Mosje stays on the field.

Flavor: (none listed)
```

---

### Drain Reversal
```
ID:         snelle_drain_reversal
Type:       SNELLE_PIECIE
MP Cost:    15 MP
Req:        Any
Rarity:     ★★★★☆

EFFECT:
  Negate all MP loss your active Mosje would take from the triggering effect.
  Gain that same amount as MP instead (reversal).

Flavor: (none listed)
```

---

### The Protector
```
ID:         snelle_the_protector
Type:       SNELLE_PIECIE
MP Cost:    Free
Req:        Any
Rarity:     ★★★★★
Limit:      1 copy per deck

EFFECT:
  Your active Mosje is immune to all MP loss for 2 turns.
  Apply status: FULL_MP_IMMUNE, turnsLeft: 2.

Flavor: (none listed)
```

---

### Jeweetniet wie Ikben
```
ID:         snelle_jeweetniet
Type:       SNELLE_PIECIE
MP Cost:    10 MP
Req:        Any
Rarity:     ★★★★☆

EFFECT:
  Negate all MP loss for your active Mosje this turn AND the next player's turn.
  Apply status: OPPONENT_MP_IMMUNE, turnsLeft: 2.

Flavor: (none listed)
```

---

### Bijna Welloe
```
ID:         snelle_bijna_welloe
Type:       SNELLE_PIECIE
MP Cost:    0 MP
Req:        Any
Rarity:     ★★★★☆

EFFECT:
  Play when an effect would send your Mosje to the Welloe pile.
  Negate that effect.
  Set your Mosje's MP to 5.
  If the Mosje has Resilient ★★★: set MP to 15 instead.
  This Mosje cannot be sent to the Welloe pile until end of next turn.

Flavor: (none listed)
```

---

### Jantje Jantje Jantje…
```
ID:         snelle_jantje_jantje_jantje
Type:       SNELLE_PIECIE
MP Cost:    Free
Req:        Any
Rarity:     ★★★☆☆

EFFECT:
  Can only be played when [place_bank_chilling] (Bank) is the active Place.
  Discard 1 card from your hand.
  Target 1 card currently resolving — ignore its effect and/or resolution entirely.

Flavor: (none listed)
```

---

### Sleutelpuntje
```
ID:         snelle_sleutelpuntje
Type:       SNELLE_PIECIE
MP Cost:    5 MP
Req:        Any
Rarity:     ★★★☆☆

EFFECT:
  Instantly adjust your active Mosje's MP by +15 or -15 (your choice).
  Play before a Quest roll or ability activation for precise positioning.

Flavor: (none listed)
```

---

### Dubbele Temminks (Ability Amplifier)
```
ID:         snelle_dubbele_temminks
Type:       SNELLE_PIECIE
MP Cost:    20 MP
Req:        Level 1+
Rarity:     ★★★★☆

EFFECT:
  Play when a Mosje uses their unique ability.
  That ability triggers TWICE this turn.

Flavor: (none listed)
```

---

### Gevalletje Klakkeloos
```
ID:         snelle_gevalletje_klakkeloos
Type:       SNELLE_PIECIE
MP Cost:    0 MP
Req:        Any
Rarity:     (none listed)

EFFECT:
  When an opponent gains MP from any source:
  Select one of your Mosjes — that Mosje gains the same amount of MP.

Flavor: (none listed)
```

---

## 🔗 COUNTER CHAIN SNELLE PIECIES

---

### Jensen
```
ID:         snelle_jensen
Type:       SNELLE_PIECIE
Subtype:    COUNTER-CHAIN
MP Cost:    10 MP
Req:        Any
Rarity:     ★★★☆☆

EFFECT:
  Ignore/negate a Piecie that specifically targets your Mosje.
  The Piecie is sent to its owner's discard pile.

Flavor: (none listed)
```

---

### Frenssen
```
ID:         snelle_frenssen
Type:       SNELLE_PIECIE
Subtype:    COUNTER-CHAIN
MP Cost:    15 MP
Req:        Any
Rarity:     ★★★★☆

EFFECT:
  Negate all cards named "Jensen" currently resolving.
  Deal 10 MP damage to the player who played "Jensen".

Flavor: (none listed)
```

---

### Blensen
```
ID:         snelle_blensen
Type:       SNELLE_PIECIE
Subtype:    COUNTER-CHAIN
MP Cost:    50 MP (or Free — see below)
Req:        Any
Rarity:     ★★★★★

EFFECT:
  If any player played Jensen OR Frenssen this turn:
    → Play this card for FREE.
    → Ignore all effects targeting you or your Mosje this turn.
  If no Jensen/Frenssen was played this turn:
    → Must pay 50 MP.
    → Ignore all effects targeting you or your Mosje this turn.

Flavor: (none listed)
```

---
---

# 🏠 SECTION 4 — PLACE CARDS

> Only 1 Place can be active at a time (shared between all players).
> Places cannot be overwritten — only destroyed by card effects.
> When destroyed, the Place slot is empty until another is played.

---

### The Gym
```
ID:         place_the_gym
Type:       PLACE
Trigger:    END of each turn
Good For:   Fighting-type Mosjes, Physical trait Mosjes
Bad For:    Others
Rarity:     ★★★

EFFECT:
  At the end of each turn:
  - ALL Mosjes lose 10 MP.
  - EXCEPTION: Mosjes with Physical ★★ or higher gain 25 MP INSTEAD of losing 10.
  - EXCEPTION: Mosjes with Physical ★★★ gain 35 MP INSTEAD of losing 10.

Flavor: (none listed)
```

---

### Skiffa
```
ID:         place_skiffa
Type:       PLACE
Trigger:    ON action
Good For:   Artistic-type Mosjes
Bad For:    Digital-type Mosjes
Rarity:     ★★★

EFFECT:
  Artistic-type Mosjes: may reroll 1 die per turn.
  Mosjes with Creative ★★★: may reroll 2 dice per turn instead.
  Digital-type Mosjes: lose 10 MP whenever they activate a Piecie.

Flavor: (none listed)
```

---

### Obby 1
```
ID:         place_obby_1
Type:       PLACE
Trigger:    END of each turn + Quest resolution
Good For:   Quest-focused strategies
Bad For:    Passive strategies
Rarity:     ★★★

EFFECT:
  At the end of each turn: every Mosje loses 10 MP.
  Quest rewards give +15 additional MP on success.

Flavor: (none listed)
```

---

### Arcade
```
ID:         place_arcade
Type:       PLACE
Trigger:    ON Piecie activation
Good For:   Physical trait Mosjes
Bad For:    Mental trait Mosjes
Rarity:     ★★★

EFFECT:
  Whenever a Mosje with the Physical trait activates a Piecie:
    → That Mosje gains +10 MP.

Flavor: (none listed)
```

---

### Bank Chilling
```
ID:         place_bank_chilling
Type:       PLACE
Trigger:    ON draw
Good For:   Mental trait Mosjes
Bad For:    Physical strategies
Rarity:     ★★★

EFFECT:
  Whenever a Mosje with Mental ★★ or higher draws 2 or more cards in a single turn:
    → Gain +15 MP.

Flavor: (none listed)
```

---

### Zo is Natuur
```
ID:         place_zo_is_natuur
Type:       PLACE
Trigger:    ON damage
Good For:   Resilient trait Mosjes
Bad For:    Aggressive strategies
Rarity:     ★★★

EFFECT:
  Mosjes with Resilient ★★ or higher cannot lose more than 25 MP per turn
  from any single source.

Flavor: (none listed)
```

---

### Quest Haven
```
ID:         place_quest_haven
Type:       PLACE
Trigger:    ON Quest resolution
Good For:   All (universal)
Bad For:    None
Rarity:     ★★★★

EFFECT:
  All Quest success MP rewards receive +10 bonus MP.
  If a player completes 2 Quests in the same turn:
    → They receive an additional +25 MP bonus on top of the Quest rewards.

Flavor: (none listed)
```

---

### The Void
```
ID:         place_the_void
Type:       PLACE
Trigger:    Permanent override while active
Good For:   Stalling strategies
Bad For:    Leading players
Rarity:     ★★★★

EFFECT:
  While The Void is the active Place:
  No MP is gained or lost from ANY source.
  Quests can still be attempted and succeed or fail — but give 0 MP regardless.

Flavor: (none listed)
```

---

### Momentum Factory
```
ID:         place_momentum_factory
Type:       PLACE
Trigger:    START of each turn
Good For:   Defensive strategies
Bad For:    Aggressive strategies
Rarity:     ★★★★

EFFECT:
  At the start of each turn: all Mosjes gain 5 MP.
  While this Place is active: no player can attack or drain another player's MP.

Flavor: (none listed)
```

---

### Coert's Explosive Caravan
```
ID:         place_coerts_caravan
Type:       PLACE
Trigger:    START of each turn + ON Piecie activation
Good For:   [COERT]-tagged Mosjes only
Bad For:    All others
Rarity:     ★★★★

EFFECT:
  Mosjes tagged [COERT]: gain +20 MP at the start of each turn.
  Mosjes tagged [COERT]: may activate 1 Piecie per turn for free (no MP cost).

Flavor: (none listed)
```

---

### The Synergy Chamber
```
ID:         place_synergy_chamber
Type:       PLACE
Trigger:    Passive enhancement while active
Good For:   Ability-focused decks
Bad For:    Passive / Quest-only decks
Rarity:     ★★★★

EFFECT:
  All Mosje abilities: dice rolls get +1 added to results.
  All Mosje ability MP costs: reduced by 5.
  All Mosje ability durations: last 1 additional turn.

Flavor: (none listed)
```

---

### Welloe Graveyard
```
ID:         place_welloe_graveyard
Type:       PLACE
Trigger:    Passive while active
Good For:   Aggressive elimination decks
Bad For:    Revive strategies
Rarity:     ★★★★

EFFECT:
  Cards that send Mosjes to the Welloe pile cost 10 less MP to activate.
  While this Place is active: Mosjes in the Welloe pile CANNOT be revived by any effect.

Flavor: (none listed)
```

---

### The Drain Zone
```
ID:         place_drain_zone
Type:       PLACE
Trigger:    Passive while active
Good For:   Everyone (universal buffs)
Bad For:    None
Rarity:     ★★★★

EFFECT:
  All MP drain effects deal +10 additional MP damage.
  All MP gain effects give +5 additional MP.

Flavor: (none listed)
```

---

### Momentum Stabilizer
```
ID:         place_momentum_stabilizer
Type:       PLACE
Trigger:    Passive while active
Good For:   Quest-focused decks
Bad For:    MP manipulation decks
Rarity:     ★★★★

EFFECT:
  MP cannot be adjusted by ±X effects (MP Adjuster, Sleutelpuntje, etc. do nothing).
  Quests that require a specific MP value auto-succeed their MP check.

Flavor: (none listed)
```

---

### Delluft
```
ID:         place_delluft
Type:       PLACE
Trigger:    START of each turn + ON Quest completion
Good For:   [COERT] and [BINTI]-tagged Mosjes
Bad For:    [CLESS] and [HAYABUSA]-tagged Mosjes
Rarity:     ★★★★★

EFFECT:
  At the start of each turn: all players pay 10 MP (parking fee).
  EXEMPT: Mosjes tagged [COERT] or [BINTI] — they pay nothing.
  PENALTY: Mosjes tagged [CLESS] pay 20 MP instead (parking anxiety).

  QUEST BONUS: When [quest_parkeren_delft] is completed while this Place is active:
    → Gain +30 additional MP after the Quest resolves.

Flavor: (none listed)
```

---

### Dierenasiel (Animal Shelter)
```
ID:         place_dierenasiel
Type:       PLACE
Trigger:    START of each turn
Good For:   [CLESS] + Pet Piecie decks
Bad For:    Non-pet players
Rarity:     ★★★★

EFFECT:
  Mosjes tagged [CLESS]: gain +30 MP at turn start.
  Mosjes tagged [CLESS]: Physical Quests auto-succeed.
  All other players: if you do NOT have any Pet Piecie active on field
  ([piecie_bowie_stormey], [piecie_gekke_vogels], [piecie_katjegang], [piecie_vianna_poes]):
    → Lose 15 MP at turn start.

Flavor: (none listed)
```

---

### Digital Gaming Stop
```
ID:         place_digital_gaming_stop
Type:       PLACE
Trigger:    ON Digital Equipment Piecie activation
Good For:   Digital-type Mosjes
Bad For:    Non-digital decks
Rarity:     ★★★★

EFFECT:
  When you activate a Digital Equipment Piecie ([DIGITAL-EQUIPMENT] tag):
    → Gain +5 additional MP.

  COMBO BONUS (once per game while this Place is active):
  If you activate ALL THREE equipment Piecies (Keyboard + Mouse + Controller) in the same turn:
    → Draw 3 cards.
    → Gain 30 MP.
    → Your Digital-type Mosje may complete 2 Quests this turn.

Flavor: (none listed)
```

---
---

# 🎯 SECTION 5 — QUEST CARDS

> **GENERAL QUESTS** are drawn from the shared center deck — any Mosje can attempt them.
> **PERSONAL QUESTS** live in a player's personal deck — require the named Mosje on field.
> Only 1 Quest may be attempted per turn (General OR Personal — not both).

---

## 💪 PHYSICAL QUESTS (General)

---

### Arm Wrestling
```
ID:             quest_arm_wrestling
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     MEDIUM
Rarity:         ★★
Is Booster Only: false

REQUIREMENT:
  Roll 1d6. Required result based on Physical trait:
  - Physical ★   = roll 5 or higher
  - Physical ★★  = roll 3 or higher
  - Physical ★★★ = roll 2 or higher

SUCCESS: +40 MP
FAILURE: -60 MP

Flavor: (none listed)
```

---

### Parkour Challenge
```
ID:             quest_parkour_challenge
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     HARD
Rarity:         ★★★
Is Booster Only: false

REQUIREMENT:
  Pay 10 MP AND roll 4 or higher on 1d6.
  Both conditions must be met.

SUCCESS: +50 MP
FAILURE: -70 MP

Flavor: (none listed)
```

---

### Endurance Test
```
ID:             quest_endurance_test
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     HARD
Rarity:         ★★★
Is Booster Only: false

REQUIREMENT:
  Your active Mosje must have 60 MP or more OR have Physical ★★★.
  Either condition satisfies the requirement.

SUCCESS: +60 MP
FAILURE: -70 MP

Flavor: (none listed)
```

---

### Sprint Race
```
ID:             quest_sprint_race
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     EASY (with right Mosje)
Rarity:         ★★
Is Booster Only: false

REQUIREMENT:
  Mosje with Physical ★★ or higher = auto-success (no roll needed).

SUCCESS: +70 MP
FAILURE: -80 MP

Flavor: (none listed)
```

---

## 🧠 MENTAL QUESTS (General)

---

### Strategy Puzzle
```
ID:             quest_strategy_puzzle
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     MEDIUM
Rarity:         ★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje must have Mental ★★.
  Discard 1 card from hand.

SUCCESS: +25 MP
FAILURE: -20 MP

Flavor: (none listed)
```

---

### Calculate Odds
```
ID:             quest_calculate_odds
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     MEDIUM
Rarity:         ★★★
Is Booster Only: false

REQUIREMENT:
  Reveal the top 3 cards of your deck.
  If 2 or more of those cards share the same type: succeed.
  Otherwise: fail. Return cards to deck in same order.

SUCCESS: +20 MP
FAILURE: -10 MP

Flavor: (none listed)
```

---

### Master Plan
```
ID:             quest_master_plan
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     VERY HARD
Rarity:         ★★★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje must have Mental ★★★ AND you must have 3 or more face-down Piecies.

SUCCESS: +35 MP
FAILURE: -15 MP

Flavor: (none listed)
```

---

### Quick Thinking
```
ID:             quest_quick_thinking
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     MEDIUM
Rarity:         ★★
Is Booster Only: false

REQUIREMENT:
  Roll 1d6. Required result based on Mental trait:
  - Mental ★   = roll 5 or higher
  - Mental ★★  = roll 4 or higher
  - Mental ★★★ = roll 3 or higher

SUCCESS: +20 MP
FAILURE: -20 MP

Flavor: (none listed)
```

---

## 💬 SOCIAL QUESTS (General)

---

### Inspire Crowd
```
ID:             quest_inspire_crowd
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     MEDIUM
Rarity:         ★★★
Is Booster Only: false

REQUIREMENT:
  Roll 1d6. Required result based on Social trait:
  - Social ★   = roll 5 or higher
  - Social ★★  = roll 4 or higher
  - Social ★★★ = roll 3 or higher

SUCCESS: +25 MP
FAILURE: -20 MP

Flavor: (none listed)
```

---

### Form Alliance
```
ID:             quest_form_alliance
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     MEDIUM
Rarity:         ★★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje must have Social ★★.
  Give 10 MP from your Mosje to an opponent's Mosje.

SUCCESS: +30 MP
FAILURE: -20 MP

Flavor: (none listed)
```

---

### Negotiation
```
ID:             quest_negotiation
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     EASY
Rarity:         ★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje has Social ★★★ = auto-success.
  OR discard 1 Piecie from hand = attempt.

SUCCESS: +25 MP
FAILURE: -10 MP

Flavor: (none listed)
```

---

### Team Building
```
ID:             quest_team_building
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     EASY (with right Mosje)
Rarity:         ★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje with Social ★★ or higher = auto-success.

SUCCESS: +22 MP
FAILURE: -40 MP

Flavor: (none listed)
```

---

## 🎨 CREATIVE QUESTS (General)

---

### Artistic Expression
```
ID:             quest_artistic_expression
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     EASY
Rarity:         ★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje has Creative ★★ OR you have drawn 2 cards this turn.
  Either condition satisfies the requirement.

SUCCESS: +40 MP
FAILURE: -10 MP

Flavor: (none listed)
```

---

### Improvise!
```
ID:             quest_improvise
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     HARD
Rarity:         ★★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje has Creative ★★★ = auto-success.
  OR pay 15 MP = attempt with roll.

SUCCESS: +50 MP
FAILURE: -20 MP

Flavor: (none listed)
```

---

### Create Masterpiece
```
ID:             quest_create_masterpiece
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     VERY HARD
Rarity:         ★★★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje must have Creative ★★ AND you must have 3 or more Piecies in play.

SUCCESS: +60 MP
FAILURE: -20 MP

Flavor: (none listed)
```

---

### Lucky Break
```
ID:             quest_lucky_break
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     MEDIUM
Rarity:         ★★★
Is Booster Only: false

REQUIREMENT:
  Roll 1d6. Required result based on Creative trait:
  - Creative ★   = roll 5 or higher
  - Creative ★★  = roll 4 or higher
  - Creative ★★★ = roll 2 or higher

SUCCESS: +70 MP
FAILURE: -40 MP

Flavor: (none listed)
```

---

## 🔧 TECHNICAL QUESTS (General)

---

### Debug System
```
ID:             quest_debug_system
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     MEDIUM
Rarity:         ★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje must have Technical ★★.
  Look at the top 5 cards of any deck (reveals before attempt).

SUCCESS: +40 MP
FAILURE: -60 MP

Flavor: (none listed)
```

---

### Hack Mainframe
```
ID:             quest_hack_mainframe
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     VERY HARD
Rarity:         ★★★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje has Technical ★★★ = auto-success.
  OR pay 20 MP = attempt with roll.

SUCCESS: +30 MP
FAILURE: -50 MP

Flavor: (none listed)
```

---

### Build Gadget
```
ID:             quest_build_gadget
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     MEDIUM
Rarity:         ★★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje must have Technical ★★ AND you must have activated a Piecie this turn.

SUCCESS: +20 MP
FAILURE: -30 MP

Flavor: (none listed)
```

---

### Precision Work
```
ID:             quest_precision_work
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     MEDIUM
Rarity:         ★★
Is Booster Only: false

REQUIREMENT:
  Roll 1d6. Required result based on Technical trait:
  - Technical ★   = roll 5 or higher
  - Technical ★★  = roll 4 or higher
  - Technical ★★★ = roll 3 or higher

SUCCESS: +70 MP
FAILURE: -70 MP

Flavor: (none listed)
```

---

## 🛡️ RESILIENT QUESTS (General)

---

### Survive Storm
```
ID:             quest_survive_storm
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     MEDIUM
Rarity:         ★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje has Resilient ★★ OR has less than 30 MP.
  Either condition satisfies the requirement.

SUCCESS: +30 MP
FAILURE: -50 MP

Flavor: (none listed)
```

---

### Endure Pain
```
ID:             quest_endure_pain
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     HARD
Rarity:         ★★★
Is Booster Only: false

REQUIREMENT:
  Your active Mosje must have lost 25 or more MP this turn before attempting.

SUCCESS: +30 MP
FAILURE: -50 MP

Flavor: (none listed)
```

---

### Never Give Up
```
ID:             quest_never_give_up
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     VERY HARD
Rarity:         ★★★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje must have Resilient ★★★ AND be at Level 1.

SUCCESS: +40 MP
FAILURE: -60 MP

Flavor: (none listed)
```

---

### Tough It Out
```
ID:             quest_tough_it_out
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     MEDIUM
Rarity:         ★★
Is Booster Only: false

REQUIREMENT:
  Roll 1d6. Required result based on Resilient trait:
  - Resilient ★   = roll 5 or higher
  - Resilient ★★  = roll 4 or higher
  - Resilient ★★★ = roll 3 or higher

SUCCESS: +80 MP
FAILURE: -80 MP

Flavor: (none listed)
```

---

## 🌀 MIXED / SPECIAL QUESTS (General)

---

### Leap of Faith
```
ID:             quest_leap_of_faith
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     MEDIUM
Rarity:         ★★★★
Is Booster Only: false

REQUIREMENT:
  Roll 1d6:
  - 1–3 = Failure
  - 4–6 = Success

SUCCESS: +60 MP
FAILURE: -20 MP

Flavor: (none listed)
```

---

### Momentum Master
```
ID:             quest_momentum_master
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     VERY HARD
Rarity:         ★★★★★
Is Booster Only: false

REQUIREMENT:
  Your active Mosje must have between 80 and 100 MP when you attempt this Quest.

SUCCESS: +60 MP
FAILURE: -40 MP

Flavor: (none listed)
```

---

### The Gauntlet
```
ID:             quest_the_gauntlet
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     HARD
Rarity:         ★★★★
Is Booster Only: false

REQUIREMENT:
  You must have completed 3 different actions this turn before attempting.
  Actions: activate a Piecie, use a Mosje ability, play a Place card.

SUCCESS: +50 MP
FAILURE: -15 MP

Flavor: (none listed)
```

---

### Ultimate Challenge
```
ID:             quest_ultimate_challenge
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     EXTREME
Rarity:         ★★★★★
Is Booster Only: false

REQUIREMENT:
  Active Mosje must have any trait at ★★★ AND you must pay 30 MP.

SUCCESS: +100 MP
FAILURE: -50 MP

Flavor: (none listed)
```

---

### Speed Run
```
ID:             quest_speed_run
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     HARD
Rarity:         ★★★
Is Booster Only: false

REQUIREMENT:
  You must have activated 2 or more Piecies this turn.

SUCCESS: +60 MP
FAILURE: -50 MP

Flavor: (none listed)
```

---

### Sustained Assault
```
ID:             quest_sustained_assault
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     HARD
Rarity:         ★★★★
Is Booster Only: false

REQUIREMENT:
  You must have dealt 30 or more MP damage to opponents this turn.

SUCCESS: +50 MP
FAILURE: -30 MP

Flavor: (none listed)
```

---

### Perfect Timing
```
ID:             quest_perfect_timing
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     VERY HARD
Rarity:         ★★★★
Is Booster Only: false

REQUIREMENT:
  Your active Mosje must have EXACTLY 75 MP when attempting this Quest.

SUCCESS: +60 MP
FAILURE: -40 MP

Flavor: (none listed)
```

---

### Elimination Challenge
```
ID:             quest_elimination_challenge
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     EXTREME
Rarity:         ★★★★★
Is Booster Only: false

REQUIREMENT:
  Send an opponent's Mosje to the Welloe pile this turn OR pay 40 MP.

SUCCESS: +80 MP
FAILURE: -50 MP

Flavor: (none listed)
```

---

### Chain Master
```
ID:             quest_chain_master
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     HARD
Rarity:         ★★★★
Is Booster Only: false

REQUIREMENT:
  You must have activated 3 or more Piecies in this turn.

SUCCESS: +55 MP
FAILURE: -25 MP

Flavor: (none listed)
```

---

### Synergy Mastery
```
ID:             quest_synergy_mastery
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     VERY HARD
Rarity:         ★★★★★
Is Booster Only: false

REQUIREMENT:
  You must have used your Mosje's unique ability AND completed at least 1 Quest
  in the same turn as this attempt.

SUCCESS: +70 MP
FAILURE: -35 MP

Flavor: (none listed)
```

---

### Regelaar
```
ID:             quest_regelaar
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     HARD
Rarity:         ★★★★
Is Booster Only: false

REQUIREMENT:
  No roll. Count Piecies in play for all players.

RESOLUTION:
  Target one opponent.
  - If they have MORE Piecies in play than you: they discard half their Piecies (rounded down).
  - If they have EQUAL or FEWER: you gain 30 MP.
  - If you have the MOST Piecies in play among all players: gain 50 MP instead.

SUCCESS: +30 MP or +50 MP
FAILURE: -25 MP (if attempt fails the comparison)

Flavor: (none listed)
```

---

### Late Night Questing
```
ID:             quest_late_night_questing
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     HARD
Rarity:         ★★★★
Is Booster Only: false

REQUIREMENT:
  You must have activated at least 2 of the following Piecies at any point this game:
  [piecie_keyboard], [piecie_mouse], [piecie_controller].
  Track activations in game state.

BONUS ON SUCCESS:
  All opponents who do NOT have a Digital-type Mosje must discard 1 card.

SUCCESS: +50 MP
FAILURE: -30 MP

Flavor: (none listed)
```

---

### Larry Temmen Niemand Zeggen
```
ID:             quest_larry_temmen
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     EXTREME
Rarity:         ★★★★★
Is Booster Only: false

REQUIREMENT:
  You must have [piecie_larry_zegeltje] on field OR in hand.

RESOLUTION:
  Target one opponent. They must guess: "Hand" or "Field" (where the Larry card is).
  - Correct guess = you take 60 MP damage.
  - Wrong guess   = you gain 70 MP AND the opponent loses 30 MP.

SUCCESS: +70 MP (if opponent guesses wrong)
FAILURE: -60 MP (if opponent guesses correctly)

Flavor: (none listed)
```

---

### Geen Raad? Vraag Aad!
```
ID:             quest_geen_raad_vraag_aad
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     SPECIAL
Rarity:         ★★★★
Is Booster Only: false

REQUIREMENT:
  No standard requirement — resolves on draw.

RESOLUTION:
  After resolving: each player who took MP damage from Quest effects this turn
  may discard 1 card to regain 40 MP.
  If the player who drew this Quest took 40+ MP damage this turn:
    → They gain 100 MP bonus.
  Mosjes tagged [GANDOE] or [DJ]: gain +10 additional MP.

SUCCESS: Special (see above)
FAILURE: Special (see above)

Flavor: (Aad = Gandalf Van Dyck)
```

---

### Parkeren Delft
```
ID:             quest_parkeren_delft
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     EXTREME
Rarity:         ★★★★★
Is Booster Only: false

REQUIREMENT:
  No roll — attempting this Quest always resolves.

RESOLUTION:
  Base effect: Take 60 MP self-damage.
  Remove up to 5 cards from any discard piles permanently (banish from game).

  COERT PARKING MASTERY: If any [COERT]-tagged Mosje is on your field:
    → Reduce self-damage to 40 MP.

  PSYCHOLOGICAL WARFARE: If any opponent has a [CLESS]-tagged Mosje on their field:
    → Deal +20 MP damage to that Mosje.

  PLACE SYNERGY: If [place_delluft] is the active Place:
    → Gain +30 additional MP after Quest resolves.

SUCCESS: Variable (see above)
FAILURE: -60 MP (if triggered against you without Coert)

Flavor: (none listed)
```

---

### Shotje Obby
```
ID:             quest_shotje_obby
Type:           QUEST
Quest Type:     GENERAL
Required Mosje: null
Difficulty:     SPECIAL
Rarity:         ★★★
Is Booster Only: false

REQUIREMENT:
  No roll — resolves immediately on draw.

RESOLUTION:
  All players add up their Mosjes' MP totals.
  - Player with HIGHEST total MP: loses 20 MP to 1 of their Mosjes.
  - Player with HIGHEST total MP: also gains +60 MP to 1 of their Mosjes.
  - Players in BETWEEN first and last: gain +20 MP to 1 of their Mosjes.

Note: First and last place receive different results — middle players always gain.

Flavor: (none listed)
```

---
---

# 📦 APPENDIX — TAGS REFERENCE

> Tags are used by the engine to detect synergies, restrictions, and conditional effects.

| Tag | Used By |
|---|---|
| `[FOOD]` | Kannetje Melk, Broodje Döner, Ronald Kip, Chef's Special, Varkenspootjes, Warm Kannetje Melk |
| `[RESTORE]` | Kannetje Melk, Broodje Döner, Momentum Boost, Eendjes voeren, Energy Surge |
| `[ATTACK]` | Te Hard Gaan, Super Saiyan Mos, Dikke Taks, Kleine Taks, Snoeiertje, Jantje Jantje, Momentum Diefje |
| `[SUBSTANCE]` | Grammetje Pieter, Dikke Jonko, Affoe, Stripje Bennies, Tikker, Straffoe, Larry/Zegeltje, Bong Hit Demolition |
| `[DIGITAL-EQUIPMENT]` | Keyboard, Mouse, Controller |
| `[PET]` | Bowie & Stormey, Gekke Vogels, KatjeGang, ViannaPoes |
| `[ELIMINATION]` | Harde Didde, Klaar Met Jou, Gandoe Destroyer ability |
| `[DOT]` | Kleine Taks, Continuous Assault, MP Hemorrhage |
| `[DRAW]` | Pot of Weed, Bagga of Greed, Stripje Bennies, Warm Kannetje Melk |
| `[DESTROY]` | Slecht Gezet, Bong Hit Demolition, Shhh popo komt |
| `[PROTECT]` | Afblijven, Laat me chillen, Mosje Shield |
| `[GANDOE]` | Gandoe Wizard, Gandoe Destroyer, DJ 80/20 |
| `[RONALD]` | Ronald Master Chef, Ronald Mastermind |
| `[COERT]` | Coert Tech Savant, Coert KasteLuck, Coert Kastelein, FPS Coert |
| `[BINTI]` | Binti Sharp Tongue, Binti Creator |
| `[CLESS]` | AZN Cless, Cless Teacher |
| `[WEST]` | Martin Senor West, Parkour West, FPS West |
| `[MARTIN]` | Martin Historian, Martin Senor West, Martin Precision Driver |
| `[ALYSSA]` | Alyssa Bulldozer, Alyssa Fissa Fissa |
| `[TUK]` | Tuk Healer, Tuk Architect |
| `[MICHELLE]` | Michelle Iron Tuk |
| `[JEFFREY]` | Jeffrey Strongman, Jeffrey Silent Gambler |
| `[JISCA]` | Jisca Maestro |
| `[CHRIS]` | Chris All-Rounder, DDR Chris |
| `[YOURI]` | Youri Speedrunner |
| `[MING]` | Ming Natural, Ming Predictor |
| `[DJ]` | DJ 80/20 |
| `[FPS]` | FPS Coert, FPS West |
| `[HAYABUSA]` | (referenced in Place effects — character TBD) |
