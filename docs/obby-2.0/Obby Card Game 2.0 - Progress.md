# Obby Card Game 2.0 — Progress

Source docs: `Obby Card Game 2.0 - Rules and Decisions`, `Obby Card Game 2.0 - Rework Plan` (in Downloads), Card List V4 (Google Drive: "Mosjes Card List Momentum Edition V4", id 1E1ZYPim6x4oWVrhplapufDeetP5gzsTJAzP8EcRHZnc).
Docs for this rework live in `docs/obby-2.0/` (design only, no engine code touched).

## Status
- **Current phase:** Phase 2 DONE (Quests). Phase 3 next.
- **Done:** Phase 0 — `Obby Card Game 2.0 - Core Numbers.md`; Phase 1 Fighting — `Obby Card Game 2.0 - Phase 1 Fighting Mosjes.md`; Phase 1 Digital — `Obby Card Game 2.0 - Phase 1 Digital Mosjes.md`; Phase 1 Artistic — `Obby Card Game 2.0 - Phase 1 Artistic Mosjes.md`; Phase 2 — `Obby Card Game 2.0 - Phase 2 Quests.md`
- **Next:** Phase 3 Piecies & Snelle (MP → Energy, Power-based attacks, tags food/gear/substance/pet, reword "active Mosje" cards). Start a fresh chat and say "start on phase 3".

## ⚠ Must not forget (carried into Phase 3)
- **Piecie tags are a hard dependency of Phase 2.** Phase 3 must tag every Piecie (food / pet / substance / gear) and reach the proposed minimum of **6 Piecies per hard tag**, or Endurance Test (food), Endure Pain (pet) and Larry Temmen (substance) are dead Quests. Gear (Late Night Questing) is soft. Full table with candidate cards: `Obby Card Game 2.0 - Phase 2 Quests.md`, "Flags for later phases". Pet is shortest (4 real cards). If a tag can't reach 6, loosen that Quest's cost to "any ready Piecie".

## Open: names for two new Quests (Fighting and Digital)
Artistic ended up slightly richer (3 Prepared, EV about +15 at ★★ vs +12), so Fighting and Digital each got one new **Prepared** Quest. Both are in the Phase 2 doc as placeholders and **still need a Dutch fun name from Gandalf**:
- **Fighting 13:** "Dutch courage": discard 1 substance Piecie, Physical, +50 / −30, win: jab.
- **Digital 13:** "Cheat code": discard 1 Snelle from hand, Mental, +50 / −30, win: also draw 1 card (an exception to 'Quests give MP only', your pick).
Stacks are now 13 / 13 / 12 = 38 Quests. Update the Phase 2 doc table when the names come in.

## Decisions made
- Summoning costs the printed Energy; the first Mosje at setup is free.
- "Getemt" keeps its name (rename to "Getakst" reverted).
- 100 MP levels you up and MP resets to 0 (L1→L2 at 0, L2→L3 at 0, hold L3 to win). Dropping a level (getemt) lands on 50 MP.
- Highest die goes first; no compensation, both start with 2 Energy and +1 per turn.
- MP → Energy is the gentle rounded table: 0 / 5–10→1 / 15–20→2 / 25–30→3 / 35+→4.
- Deck: minimum 30 cards. Empty deck = shuffle discard into deck, then a cooldown turn: that player may only place cards (no Quests, attacks, summons or activations).
- Quests: one main trait per Mosje type (Fighting=Physical, Digital=Technical, Artistic=Creative). Mental/Social/Resilient are optional side requirements; Phase 2 reworks/adds Quests to cover them.

- **Synergies are labels:** a Mosje prints only `Synergy: <card name>`; the named card explains the effect while both are on the field (Phase 1).
- **Getemt trigger:** any MP loss at 0 MP counts (failed Quests and own ability costs too), not only opponent attacks (Phase 1).

- **Tactician (Digital):** 2 Energy, once per turn, set any Mosje's MP to any value under 80 until end of turn; gains and losses are kept.
- **West synergy (Digital):** only Senor West pairs with Cless; FPS West keeps FPS Coert only.

- **Binti hub (Artistic):** Binti, The Sharp Tongue ↔ Coert Savant only (KasteLuck and Kast-elein dropped); bonus is a flat +10 MP per Food Piecie, not double.
- **Parked Artistic cards:** Binti, The Creator (cut), Placeholder 3 The Amplifier (no name yet), Coert Kast-elein (you refine it first). Artistic roster = 10.
- **Pairings:** Cless Teacher ↔ Martin, The Historian (holder: Historian); Youri ↔ Dancing/DDR Chris only (Chris, The All-Rounder lost its Youri label); Senor West ↔ AZN Cless and FPS West ↔ FPS Coert unchanged.
- **Chains:** a Piecie activated for free by Jisca, DDR Chris, Ming Natural or Master Plan never starts another chain roll or Teaching Moment roll.
- **Master Plan** (Ronald Mastermind): once per turn, 2 Energy, replay a discard Piecie, it returns to the discard pile.
- **Tuk Healing, DJ 80/20, KasteLuck:** your calls to simplify (heal 20 once per turn / reroll only / draw 1 + 5 MP).
- **Parkeren Delft weakness** moves to the Quest (Phase 2).

### Phase 2 decisions (Quests)
- **38 Quests in 3 stacks (Fighting 13, Digital 13, Artistic 12)**; Fighting = Physical (side Resilient), Digital = Technical (side Mental), Artistic = Creative (side Social). About 1/3 of each stack rolls the side trait.
- **Failed Quests:** a Quest is replaced when won or after **2 failed attempts by anyone** (token/die on the card).
- **Jabs:** a few Quests may make one opponent Mosje lose 10 MP on a win. It counts as MP loss, so it can getemt a 0-MP Mosje (your ruling). 6 Quests have one.
- **Trained Quests:** one per stack, ★★ needed, no roll, +25, can't fail (Sprint Race, Debug System, Team Building).
- **Special Quests reworked into bands**, no unique-text cards. Named bonuses: Gandoe (Geen Raad), Youri (Speed Run), Coert / Cless (Parkeren Delft), Larry/Zegeltje (Larry Temmen).
- **Form Alliance** (confirmed by you): success gives an opponent Mosje +10 MP. Quests may be a bit crazy; attacks remain the main damage source.
- **MP-state Quests** stay as Gated with round thresholds (Momentum Master 80+, Perfect Timing 70–80).
- **Two new Quests** (Fighting: Dutch courage, Digital: Cheat code), names TBD. Cheat code draws a card on a win.
- **Removed (4):** Elimination Challenge, The Gauntlet, Chain Master (merged into Speed Run), Precision Work.

## Small things I decided myself (check these)
- Phase 2 Quests: which Quest got which band; Geen Raad's discard safety net; DJ 80/20's bonus dropped from Geen Raad; Parkeren Delft cost 'discard a ready Piecie' and 'remove up to 3 cards'; Parkour Challenge pays a Piecie instead of 10 MP; Sustained Assault became Steady with +1 die; Perfect Timing is a Coin flip with an MP window; Core Numbers EV typos fixed (Heroic ★★ −16, Gated ★★ +21).
- Phase 1 Artistic: level paths (Creative first, then side trait), rarity proposals, start-MP/cost for all 10 cards, Tuk Healing's 20 MP and Power 10, Teacher+Historian text (Teaching Moment on 4–6, take 1 of the 5 into hand), Sims Architect cut of "place free" because placing is already free, Binti's opponent-chooses discard, Jisca keeps V4's "ignore damage at 0 MP".
- Phase 1 Digital: Technical climbs first in level paths; activated abilities pay Energy not MP; "once every 5 turns / 3 per game" limits became once per turn + Energy; one holder card per synergy pair (Senor West, Youri, FPS West); Ming Natural cost 3;  Drainer never hits 0 MP Mosjes; Coert extra draws capped at 2; Digital roster is 14 cards, not 15.
- Phase 1 Fighting: level paths (one trait +1 star per level, V4 traits = LVL 1), rarity proposals, start-MP changes for Cless (30), Michelle (10), Jeffrey/Fissa costs, Destroyer's Strike limited to "lowest-level Mosje", on your turn only, cost 4 Energy.
- Docs are stored in the repo at `docs/obby-2.0/`; Card List V4 on Drive is read-only source.
- Minimum 1 die on a Quest even with 0 stars in the trait; max 4 dice.
- Power is +10 per level (L1 10–30, L3 up to 50); Power in multiples of 10; MP always multiples of 5.
- Mosje summon cost 2–4 with a Power/start-MP trade-off table.
- Effect budget rule `25 + 12 × Energy` MP.
- Quest bands (Steady, Skilled, Heroic, Prepared, Gated, Coin flip) and success/fail values.
- Side-trait suggestions per stack (Resilient / Mental / Social) are suggestions only, to confirm in Phase 2.
- Cooldown turn detail: it is the turn the deck runs out (you still get +1 Energy and the draw); "only place cards" means free face-down Piecies, so no attacking, summoning (costs Energy) or Snelle that turn.
- 5th rarity tier (★★★★★) included in the Energy curve because the web game now has 5 tiers.

## Balance flags carried forward
See §7 of the Core Numbers (level-up at 0 MP; no-star Quests; Prepared band strength; player 1 advantage with no compensation; cooldown turn strength).

## Notes
- Card List V4 has 8 Fighting, 14 Digital, 13 Artistic Mosjes (some are placeholders); 2.0 roster: 8 / 14 / 10, ~100 Piecies/Snelle, 16 Places, 38 Quests in 3 typed stacks of 13 / 13 / 12 (Phase 2).
- The web game (engine) is untouched; handoff comes in Phase 6.
