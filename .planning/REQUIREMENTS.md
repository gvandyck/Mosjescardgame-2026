# Requirements — Milestone v2.0: Obby Card Game 2.0, slice A (offline vs bot)

Source of truth: `docs/obby-2.0/Obby Card Game 2.0 - Claude Code Handoff.md` (§ refs below), Card List, Core Numbers, Example Decks, Phase 7 Card Frames and Art. Branch: `obby-2.0`. The previous milestone's requirements are archived at `.planning/milestones/v1.0-REQUIREMENTS.md`.

## v2.0 Requirements

### Branch, deploy and app shell (SHELL)
- [ ] **SHELL-01**: Pushing to `obby-2.0` deploys the game to eightytwenty.nl/obbycardgame2 through its own workflow (same FTP secrets); pushes to `main` still deploy V4 only (§1).
- [ ] **SHELL-02**: The 2.0 site shows an `APP_VERSION` starting with `2.0-`, bumped per shipped change.
- [ ] **SHELL-03**: The 2.0 lobby offers only "Play vs bot" with a picker of the 3 Example Decks (free for everyone); online play, login, collection, store and deck builder are hidden (code kept).
- [x] **SHELL-04**: V4-rule tests are rewritten or deleted on `obby-2.0`, never left failing (§6).

### Card data (DATA)
- [x] **DATA-01**: Every Card List card (32 Mosjes, 38 Quests, 73 Piecies, 20 Snelle, 20 Places) exists in `src/data/*.js` with its Card List name, text, Energy cost and rarity; existing ids kept, renames applied (§3a).
- [x] **DATA-02**: Mosjes carry `startMP`, `levels[3]` (Power + traits per level), ability text, synergy label/holder text and `limitPerDeck` (§3b).
- [x] **DATA-03**: Piecies/Snelle carry `tag` (food 7, pet 5, substance 9, gear 6, max one), `stays`, `levelGate`, `limitPerDeck`, `givesMP` (§2g, §3b).
- [x] **DATA-04**: Quests carry `stack`, `band`, `rollTrait`, cost, win/lose and extras; new `quest_dutch_courage` and `quest_cheat_code` exist (§3a–b).
- [x] **DATA-05**: Places carry `cost`, `goodFor`, `badFor`, `limitPerDeck`; Drain Zone and The Void are unhidden (§3a).
- [x] **DATA-06**: Parked/cut cards, Personal Quests, duo decks and old starter decks are hidden (data kept) and never reach decks, boosters or the bot (§3a).
- [x] **DATA-07**: The 3 Example Decks ship as 30-card decks (max 2 copies, ★★★★★ max 1, starting Mosje inside).

### Core rules: Energy, levels, turns (RULE)
- [x] **RULE-01**: Each player has an Energy pool: start 2, +1 at the start of own turn, max 6, carries over; it pays for summons, Piecie activations, Snelle, Places and activated abilities; MP is never spent (§2a).
- [x] **RULE-02**: Mosjes start at Level 1 with their starting MP; reaching 100 MP raises the level and resets MP to 0 from any MP gain; a Level 3 Mosje's MP stops at 95 (§2b).
- [x] **RULE-03**: A loss that leaves a Mosje at 0 MP or less getemts it: Level 2–3 → level −1 at 50 MP; Level 1 → MP 0, sideways, skips its owner's next turn; getemt while sideways → Welloe pile. A loss reduced to 0 is no loss (§2b).
- [x] **RULE-04**: A player wins when one of their Mosjes is still at Level 3 at the start of their next turn, and loses when no Mosje is left outside their Welloe pile (§2b).
- [x] **RULE-05**: Setup and turn flow follow §2c: starting Mosje free and fresh, draw 3, 3 face-up Quests, highest die first, player 1 skips the first draw (R5), start-/end-of-turn triggers, "this turn" boosts expire.
- [x] **RULE-06**: Empty field at turn start → the cheapest Mosje from hand or deck is placed free and fresh (R1); deck shuffled after a search.
- [x] **RULE-07**: Deck-out: the discard pile (never the Welloe pile) is shuffled into a new deck and that turn is a cooldown turn (only face-down placing) (§2c).
- [x] **RULE-08**: Fresh Mosjes can't attack, can't be chosen or hit by any opponent card, ability or jab, and ignore Places until their owner's next turn; a just-levelled Mosje can't be taksed until its owner's next turn (R2) (§2b, §2f).
- [x] **RULE-09**: MP stays a multiple of 5 and never persists below 0; Power is a multiple of 10 and never below 0; one loss resolves in the §2g order (base → reductions → Stabilizer cap → round/floor → no-loss check).
- [x] **RULE-10**: V4 leftovers are removed: Level 0, MP costs, first-turn Quest lock, 4th Piecie slot, 6-card opening hand, the "active Mosje" concept (§2c).

### Attacking and Quests (PLAY)
- [x] **PLAY-01**: Each Mosje takes at most one action per turn: attack OR Quest (§2c).
- [x] **PLAY-02**: A non-fresh, upright Mosje can attack one valid opponent Mosje, which loses MP equal to the attacker's current Power (Power 0 = nothing); attack triggers fire (§2d).
- [x] **PLAY-03**: Three typed Quest stacks (Fighting 13 / Digital 13 / Artistic 12) each show one face-up Quest; any Mosje may attempt any of them (§2e).
- [x] **PLAY-04**: A Quest rolls 1 d6 per ★ of its trait (min 1, max 4) and resolves by its band's need and win/lose MP; Trained needs ★★ and doesn't roll (§2e).
- [x] **PLAY-05**: Quest costs are paid before the roll and never refunded; "hand or a ready one" discards accept both (§2e).
- [x] **PLAY-06**: Failed attempts add a fail token; a won Quest or one with 2 tokens is replaced from its stack, which reshuffles its own discards when empty (§2e).
- [x] **PLAY-07**: Quest extras work: jab (10 MP, non-fresh, can getemt), named bonuses, +1 die rules, Vraag Aad, Cheat code draw, Debug System, Parkeren Delft (§2e).

### Cards on the table (TABLE)
- [x] **TABLE-01**: Max 2 Mosjes per field; summoning from hand on your turn pays the cost and makes the Mosje fresh (§2f).
- [x] **TABLE-02**: Piecies use 3 slots, are placed face-down for free, become ready on the owner's next turn and are activated by paying their cost; Stays cards remain face-up in their slot until their end time (§2f).
- [x] **TABLE-03**: Snelle are played from hand at any time with saved Energy, need a free slot, resolve and are discarded (Blensen! stays until end of turn); not on a cooldown turn (§2f).
- [x] **TABLE-04**: The engine opens reaction windows (targeted, would lose MP, attacked, to the Welloe pile, after a Quest roll, after a Piecie activation, Jensen! played) and offers eligible Snelle to the defending player or bot (§3c).
- [x] **TABLE-05**: A Place is played from hand on your turn only when none is in play, works at once without a slot, stays until destroyed and goes to its owner's discard pile (§2f).
- [x] **TABLE-06**: The Welloe pile is separate from the discard pile and never shuffled back; only Mosje Reborn and Call of the Welloes take Mosjes out (not under Welloe Graveyard) (§2f).

### Card effects (EFX)
- [x] **EFX-01**: All 32 Mosje abilities and synergy texts work as the Card List says, with activated abilities paying Energy (§3c).
- [x] **EFX-02**: All 73 Piecie effects work as the Card List says (Power boosts, reductions, dice boosts, tags, gates, Stays, limits) (§3c).
- [x] **EFX-03**: All 20 Snelle effects work as the Card List says, including the Jensen! / Frenssen! / Blensen! chain (§3c).
- [x] **EFX-04**: All 20 Place effects work as the Card List says, including fresh Mosjes ignoring them (§3c).
- [x] **EFX-05**: Synergies are re-wired to the 2.0 pairs; Synergy Chamber makes holder texts work without the partner; free activations never chain again (§2g).
- [x] **EFX-06**: The Tactician sets MP to 10–75 until end of turn and snaps back to real MP plus that turn's changes (§2g).
- [x] **EFX-07**: Hidden-info cards (Ronald, FPS West, Stookerino, Jantje, Chef's Special, Those Eyelashes) reveal only to the player entitled to see (§3c).

### Bot (BOT)
- [x] **BOT-01**: The bot chooses attack or Quest per Mosje (best expected MP swing, finish a getemt, protect a Level 3), adapted inside `src/bot/strategy/` (§5).
- [x] **BOT-02**: The bot pays Energy, plays Piecies/Snelle/Places/summons legally and respects fresh and level-up protection (§5).
- [x] **BOT-03**: The bot keeps a slot free when holding a reaction Snelle and answers reaction windows (§5).
- [x] **BOT-04**: The bot never uses hidden information it wouldn't have at a real table (§5).

### Board and card faces (UI)
- [ ] **UI-01**: The board shows per player one row of 3 Piecie slots + 2 Mosjes, the Place / 3 Quests with stacks and fail tokens / End Turn in the middle, and the hand at the bottom, judged at 1920×1080 (§4).
- [ ] **UI-02**: Each player shows 6 Energy crystals, filled = available.
- [ ] **UI-03**: Field Mosje tiles show Power, LVL chip and MP; sideways tiles rotate 90°; Fresh and Protected badges; "LVL 3 · HOLD"; Tactician temp MP (Phase 7 §A3).
- [x] **UI-04**: Card faces follow Phase 7 §A: Energy cost top-left, frosted text box, Mosjes always full art (foil on ★★★★★ or `foil` flag), 3 level rows with the current one lit, Piecie tag-first label, Place cost, Quests in stack colours with need / win / lose.
- [ ] **UI-05**: The player can attack (pick attacker → target, invalid targets disabled), attempt Quests, play Places and answer reaction prompts from the UI; a cooldown-turn banner blocks everything but placing.

### Verification (TEST)
- [x] **TEST-01**: Engine unit tests E1–E30 from handoff §6a pass in `npm test`.
- [x] **TEST-02**: Every Card List card except the 38 Quests (covered by engine tests — Gandalf 2026-10-16) has a card-test-library entry (Example Deck cards first), including the §6b must-have edge cases.
- [ ] **TEST-03**: Playwright specs U1–U12 from handoff §6c pass.
- [x] **TEST-04**: Phase 7 §A10 frame tests pass (unit + Playwright screenshots at 1920×1080).
- [ ] **TEST-05**: `npm run test:sim` runs the 2.0 rules with the 3 Example Decks: 0 crashes, timeout rate under 25%.

## Future Requirements (later milestones)
- Slice 2.0-B: online rooms (P2P) with the 3 decks on a second Firebase project (`FIREBASE_CONFIG_2`).
- Slice 2.0-C: accounts, collections, boosters, deck builder, leaderboard on the second Firebase project.
- New art from the Phase 7 missing-art list; names for The Hacker, The Tactician, The Drainer.
- Balancing (game length, attack share, type win rates) — parked by Gandalf.

## Out of Scope
- Changing V4 on `main` or merging `obby-2.0` into `main` (Gandalf's call, after 2.0 plays end to end).
- A V4/2.0 rules switch in code (one engine per branch).
- Tuning numbers away from the Card List / Core Numbers without Gandalf.
- Paper cards and print sheets.

## Traceability
| Requirement | Phase | Status |
|---|---|---|
| SHELL-01 | Phase 64 | Pending |
| SHELL-02 | Phase 64 | Pending |
| SHELL-03 | Phase 64 | Pending |
| SHELL-04 | Phase 57 | Complete |
| DATA-01 | Phase 53 | Complete |
| DATA-02 | Phase 53 | Complete |
| DATA-03 | Phase 53 | Complete |
| DATA-04 | Phase 53 | Complete |
| DATA-05 | Phase 53 | Complete |
| DATA-06 | Phase 53 | Complete |
| DATA-07 | Phase 53 | Complete |
| RULE-01 | Phase 54 | Complete |
| RULE-02 | Phase 54 | Complete |
| RULE-03 | Phase 54 | Complete |
| RULE-04 | Phase 54 | Complete |
| RULE-05 | Phase 55 | Complete |
| RULE-06 | Phase 55 | Complete |
| RULE-07 | Phase 55 | Complete |
| RULE-08 | Phase 55 | Complete (attack gates read these flags in Phase 56) |
| RULE-09 | Phase 54 | Complete |
| RULE-10 | Phase 55 | Complete |
| PLAY-01 | Phase 56 | Complete |
| PLAY-02 | Phase 56 | Complete |
| PLAY-03 | Phase 56 | Complete |
| PLAY-04 | Phase 56 | Complete |
| PLAY-05 | Phase 56 | Complete |
| PLAY-06 | Phase 56 | Complete |
| PLAY-07 | Phase 56 | Complete |
| TABLE-01 | Phase 55 | Complete |
| TABLE-02 | Phase 57 | Complete |
| TABLE-03 | Phase 57 | Complete |
| TABLE-04 | Phase 57 | Complete |
| TABLE-05 | Phase 57 | Complete |
| TABLE-06 | Phase 57 | Complete |
| EFX-01 | Phase 58 | Complete |
| EFX-02 | Phase 59 | Complete |
| EFX-03 | Phase 60 | Complete |
| EFX-04 | Phase 60 | Complete |
| EFX-05 | Phase 58 | Complete |
| EFX-06 | Phase 58 | Complete |
| EFX-07 | Phase 60 | Complete |
| BOT-01 | Phase 61 | Complete |
| BOT-02 | Phase 61 | Complete |
| BOT-03 | Phase 61 | Complete |
| BOT-04 | Phase 61 | Complete |
| UI-01 | Phase 63 | Pending |
| UI-02 | Phase 63 | Pending |
| UI-03 | Phase 63 | Pending |
| UI-04 | Phase 62 | Complete |
| UI-05 | Phase 63 | Pending |
| TEST-01 | Phase 58 | Complete |
| TEST-02 | Phase 60 | Complete |
| TEST-03 | Phase 64 | Pending |
| TEST-04 | Phase 62 | Complete |
| TEST-05 | Phase 64 | Pending |

**Coverage:** 55/55 v2.0 requirements mapped to exactly one phase (53–64). No orphans, no duplicates.
