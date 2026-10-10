# Obby Card Game 2.0 — Progress

Source docs: `Obby Card Game 2.0 - Rules and Decisions`, `Obby Card Game 2.0 - Rework Plan` (in Downloads), Card List V4 (Google Drive: "Mosjes Card List Momentum Edition V4", id 1E1ZYPim6x4oWVrhplapufDeetP5gzsTJAzP8EcRHZnc).
Docs for this rework live in `docs/obby-2.0/` (design only, no engine code touched).

## Status
- **Current phase:** Phase 6 DONE (Card List 2.0, Example Decks 2.0, Claude Code handoff). Phase 7 (visual production) next. Balancing still parked.
- **Done:** Phase 0 — `Obby Card Game 2.0 - Core Numbers.md`; Phase 1 — `... Phase 1 Fighting / Digital / Artistic Mosjes.md`; Phase 2 — `... Phase 2 Quests.md`; Phase 3 — `... Phase 3 Piecies and Snelle.md`; Phase 4 — `... Phase 4 Places.md`; Phase 5 — `... Phase 5 Starter Decks.md`; Phase 6 — `... Card List.md`, `... Example Decks.md`, `... Claude Code Handoff.md`
- **Next:** Phase 7 in a fresh chat ("start on phase 7"), or the engine milestone when you want the web game built: tell Claude Code "build Obby 2.0 from the handoff" and it starts from `Obby Card Game 2.0 - Claude Code Handoff.md`. Before online play works you need to make the second Firebase project (handoff §1).

## Phase 6 outcome (2026-10-10)
- **Card List 2.0** (`Obby Card Game 2.0 - Card List.md`): all 183 cards, table text only: 32 Mosjes with full level rows (Power + traits per level), 38 Quests, 73 Piecies, 20 Snelle, 20 Places. It wins over the phase docs where they differ.
- **Example Decks 2.0** (`Obby Card Game 2.0 - Example Decks.md`): the 3 Phase 5 decks in final form with setup steps and a short "playing it" tip each.
- **Claude Code handoff** (`Obby Card Game 2.0 - Claude Code Handoff.md`): where 2.0 lives, every rule change web → 2.0, card data changes (ids, renames, hidden cards, new fields), board layout, bot, **30 engine tests + card tests + 12 Playwright specs**, docs to update, open items.

### Phase 6 decisions (your calls)
- **V4 stays online as it is.** 2.0 is built on its own long-lived branch `obby-2.0` and goes online at **eightytwenty.nl/obbycardgame2** (its own deploy). It replaces V4 only when you say so. ("I'm not a coder, you decide": I picked the branch + second URL setup.)
- **A second Firebase project** for 2.0, so 2.0 accounts, collections and leaderboard never touch V4's data (your idea). Suggested order: bot table → online rooms → accounts/collections/boosters.
- **Leftover web content is hidden, data kept:** the 5 duo decks, the 6 Personal Quests, the parked and cut cards.
- **"Discard 1 substance/food Piecie"** on Endurance Test, Dutch courage and Larry Temmen = **from your hand or a ready one** (Phase 3 flag 10 closed). Phase 2 doc updated.
- **Tactician:** sets MP to **10–75** (was "under 80"), for every Mosje. A Mosje set to 10 can still be getemt by a 10+ hit. Phase 1 Digital doc updated.
- **Level 3 MP stops at 95** (no Level 4). Added to Core Numbers §1 and the handoff.
- **Placeholder names stay** (The Hacker, The Tactician, The Drainer), marked "name owed".

### Small things I decided myself (Phase 6, check these)
- Card List: Mosje names without the web's `[Name]` brackets; level rows written out in full per level; chain rule wording now names every free-activation card and says Coert's Caravan's 0-Energy activation is a normal one (matches the Phase 4 note).
- Handoff: keep every existing card id (only names/texts change); new ids `quest_dutch_courage`, `quest_cheat_code`; Quest names follow the Phase 2 spelling; 4 gameplay tags in a single `tag` field; a `givesMP` flag for Jeffrey and The Void; a proposed MP-loss order (base → reductions → Momentum Stabilizer cap → round → no-loss check); a Quest stack that runs out reshuffles its own discards (proposal).
- Getemt written as "a loss that leaves the Mosje at 0 or less" (the desk sim's reading of rule 16 + the Phase 1 ruling).

## Phase 5 outcome (2026-10-10, no questions asked by request)
- **3 starter decks, 30 cards each:** Fighting "Taksen", Digital "Regelaars", Artistic "Creatievelingen". 6 Mosjes, 2 Places, 2 destroyers, 18 Piecies, 4 Snelle each; max 2 copies; the starting Mosje is one of the 30.
- **Desk test:** `tools/obby_desk_sim.py` (Python, bots, 2,700 games per rule set). As written: median 21 rounds, 20% stall at 30 rounds, 78% attacks, seat 1 wins 65%, Level 3 holds 45%, Digital 13% deck win rate. Deck-outs, Energy and Places look fine.
- **Adopted (your OK, "do all your suggestions"):** R1 empty field = free cheapest Mosje, lose with no Mosjes left; R2 level-up protection; R3 every Mosje −10 Power on every level, no floor (Power-10 Mosjes now 0 at Level 1); R4 Tuk's Healing Hands costs 1 Energy; R5 player 1 skips their first draw; R6 Digital deck: Mouse + Loaded Dice → 2nd Broodje Döner + Super Saiyan Mos. Written into Core Numbers §1/§4/§7 and the Phase 1 docs.
- **Desk test with R1–R6:** median 15 rounds, 17% stall, 74% attacks, seat 1 55%, Level 3 holds 86%, Fighting 63% / Artistic 46% / Digital 20%. Still too long and too attack-heavy: next levers for paper are Quest wins +10 or start MP +10.

## Carried into Phase 5
- **Places in decks:** 20 Places, only one in play at a time and it stays until destroyed. Give each starter deck 1–3 Places and 1–2 destroyers (Slecht Gezet, Bong Hit Demolition, Shhh, popo komt!, Huisbaas; Chillingsvoorbij! gets one back).
- **Phase 4 flags to test on paper:** The Gym's 10 MP drain can getemt a 0-MP Mosje (left as is, "ignore for now"); the first Place locking the table; The Void; Momentum Stabilizer vs Level 3 holds; Delluft vs Cless decks; Eendjes Voeren making Resilient Quests easy. Details in the Phase 4 doc, "Flags".
- **Digital decks** need a few Snelle for Cheat code (Phase 3 flag 11) and gear if they want Digital Gaming Stop.

## Phase 4 outcome: Place hooks — settled
Boxing Ring is in the pool and Protein Shake's Boxing Ring bonus is back. Bank Chilling still exists for Jantje Jantje... Jantje?. Dierenasiel makes pets cost 0. Digital Gaming Stop counts all 6 gear cards (sport gear too). Delluft gives Parkeren Delft +20. Coert's Caravan lets a Coert player activate 1 Piecie a turn for 0 Energy. Ultimate Challenge works with any of the 20 Places.

## Phase 3 outcome: tags (the Phase 2 dependency) — settled
food 7, substance 9, gear 6 cards. Pet has 5, so **Endure Pain now needs "a Piecie of yours that stays in play"** instead of a pet (your call). The Phase 2 doc is updated.

## Two new Quests (Fighting and Digital): settled
Artistic ended up slightly richer (3 Prepared, EV about +15 at ★★ vs +12), so Fighting and Digital each got one new **Prepared** Quest. Gandalf accepted the working names as they are (a Dutch name can still replace them later):
- **Fighting 13, "Dutch courage":** discard 1 substance Piecie, Physical, +50 / −30, win: jab.
- **Digital 13, "Cheat code":** discard 1 Snelle from hand, Mental, +50 / −30, win: also draw 1 card (an exception to 'Quests give MP only', your pick).
Stacks are 13 / 13 / 12 = 38 Quests.

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
- **Two new Quests** (Fighting: Dutch courage, Digital: Cheat code), names accepted as is. Cheat code draws a card on a win.
- **Removed (4):** Elimination Challenge, The Gauntlet, Chain Master (merged into Speed Run), Precision Work.

### Phase 3 decisions (Piecies & Snelle)
- **Card pool:** V4 + 9 web-only Piecies + Chillingsvoorbij! = **73 Piecies + 20 Snelle**. **Web names** for renamed cards (Shoettoe, Pot of Weed, Dubbele Dosis, Leipe Swap, Not Today!, Je Weet Niet…). Nature's Gift was also renamed ("Eendjes voeren") but got its V4 name back in Phase 4.
- **Text base:** web text, except V4 for Lucky Cóin, Jammertje Gepakt!, Perfect Dodge, the Jensen!/Frenssen!/Blensen! chain and Counter Strikka (redirect, so it isn't a twin of Jammertje).
- **Attacks are mostly Power boosts** ("+X Power this turn"); only a few small direct hits (10–15 MP) remain.
- **Shields reduce, never stop** ("loses X less"). **A loss reduced to 0 is no loss**: no getemt, also at 0 MP. Added to Core Numbers §1.
- **Fresh Mosje is off-limits to all opponent cards**, jabs and abilities, not only attacks. Added to Core Numbers §1 and the Phase 2 jab rule.
- **Level 2+ gate** only on finishers: Harde Didde, Klaar Met Jou, Dikke Taks.
- **Quest boosts = +1 die** (max 4); old "+2" cards give +1 die and a reroll.
- **Pets = base + named bonus**, flat numbers (10 less / named 20 less). **Endure Pain loosened** to any lasting Piecie (pet was 5 cards).
- **Tony** names **Coert, KasteLuck** (your call "pick an under-powered Mosje without synergy"; no Wendy Mosje exists). KasteLuck now prints "Synergy: Tony".
- **Twins got new jobs:** Double Trigger = both your Mosjes reuse their ability; Continuous Assault = lasting +10 Power; Huisbaas = V4 substance-triggered Place swap (Chillingsvoorbij! keeps "Place back to hand").
- **Kill cards stay kills:** Harde Didde and Klaar Met Jou, 4 Energy, Level 2+, limit 1 per deck each.
- **Perfect Setup** = "counts as 60–90 MP for Quest requirements". **MP Adjuster cut** (job covered by Tactician, Perfect Setup, Leipe Swap).
- **Leipe Swap** = a real, lasting MP swap, 4 Energy, limit 1 per deck; a swap is not a gain or a loss.
- **Varkenspootjes** Binti +40 / any other Mosje −15. **Jantje Jantje...** correct guess = they discard it + 20 Power. **Straffoe** = "a badly smoked joint": free, you lose 5, each opponent Mosje loses 10.
- **Blensen!** = no opponent cards can target your Mosjes this turn (attacks still can). **Welloe Force** = thorns (attackers lose 15). **Drain Reversal** = 20 less + one opponent Mosje loses 10.
- **Buurvrouw** left out (empty in V4, not in the web game).

### Phase 4 decisions (Places)
- **Card pool:** V4's 17 Places + the 4 web-only Places (Boxing Ring, Tesla, Eendjes Voeren, De Box) − Momentum Factory = **20 Places**.
- **Momentum Factory parked** ("remove the card for now, I don't like it").
- **Names stay**, Dutch included; shorter web spelling where V4 and web differ slightly (Coert's Caravan, Obby #1, Drain Zone, Synergy Chamber).
- **Eendjes Voeren is the Place**; the Piecie goes back to its V4 name **Nature's Gift** (Phase 3 doc updated).
- **V4 or web effect:** Claude picks per card, simpler effects preferred, several Places may share an effect ("you decide, I trust you"). The other version is in each change note.
- **Playing a Place:** from hand on your turn, pay, works at once, no slot. Not on a cooldown turn. Rule 9 kept: it stays until destroyed.
- **Fresh Mosjes ignore Places**, good and bad side, until the start of their owner's next turn. Added to Core Numbers §1.
- **Good for / bad for:** anything goes (type, trait, named Mosje or play style), no balance target.
- **MP drains:** no ruling this phase ("ignore for now"). Only The Gym keeps one (the Rules-doc sample); flagged for Phase 5.
- **Delluft:** the parking fee is Energy: the first time a player pays Energy on their own turn they pay 1 more; Coert or Binti on your field = no fee, Cless = 2 more. Parkeren Delft wins +20.
- **Protein Shake:** Boxing Ring bonus back (gains 35 with Physical ★★★ or while the Place is Boxing Ring).

## Small things I decided myself (check these)
- Phase 4 Places: every card's choice between the V4 and web effect (you delegated it); all costs (★★ 2, ★★★ 2–3, ★★★★ 3, ★★★★★ 4) and rarities; Power never below 0 (Core Numbers §1); Gym text unchanged from the Rules doc; De Box names Gandoe, Michelle and Tuk (web grouping) and dropped the pair bonus; Tesla gives +1 die instead of MP and keeps its Coert requirement and self-destroy; Coert's Caravan dropped "+20 MP a turn"; Dierenasiel dropped the Cless bonus; Delluft: Coert/Binti beats Cless when both are on a field, Hayabusa dropped; Quest Haven dropped "2 Quests in a turn +25"; Obby #1 is +10 / −10 more; Drain Zone is +10 Power for all; Momentum Stabilizer uses the web cap (30 at once); The Void blocks MP gains from Piecies and Snelle; Welloe Graveyard 1 Energy cheaper kills + no revives; Synergy Chamber uses the web idea; "Good for / Bad for" may be printed small on the card.
- Phase 3 Piecies & Snelle: all costs and rarities (from the table and budget; deviations noted per card: TweedeKANs 0, Pot of Weed 1, Bong Hit 2, Super Saiyan 3, Dubbele Ding 2, Ff Haaltje Nemen 2, Kleine Taks 1, pets 1); Power numbers on attack cards; default lasting time "until the end of your next turn"; Kleine Taks 2 ticks at the end of your turns; MP Hemorrhage bleed 10; pet synergy bonuses (+10 / +15) and Tony's "Morning Luck on 3–6"; Boxing Gloves gives Power instead of MP; Protein Shake's Boxing Ring bonus → Physical ★★★; Kan het?! 5–6 +40 / 1–4 −10; Shoettoe "20 or less: +30"; Chef's Special cap 45; Stookerino 10 MP per Energy; F1 Telemetry names only the Precision Driver; Battle Concert flat 15; Huisbaas checks the top of a discard pile; MP Amplifier doubles (max +40); Mosje Reborn +30 for 2 Energy; Call of the Welloes at starting MP; Jammertje's need lowered to Mental ★★; Emergency Healings uses V4's +25 because the web text was a full save; Dingetje toch?! meets requirements but adds no dice; Not Today! leaves at least 5 MP; one tag per card (Protein Shake = food); Lucky Cóin keeps its sample spelling.
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
Phase 3 adds (details in its "Flags" section): Ronald Kip without a Level 2 gate; shield stacking on a Level 3; Jensen! cancelling kill cards; full Piecie rows blocking Snelle; 28 zero-cost Piecies; Leipe Swap + attack; MP Amplifier + Ronald Kip.
Phase 4 adds (details in its "Flags" section): The Gym's drain can getemt a 0-MP Mosje; the first Place locks the table; The Void; Momentum Stabilizer vs Level 3; Delluft vs Cless; Eendjes Voeren and Resilient Quests; fresh Mosjes ignoring Places.

## Notes
- Card List V4 has 8 Fighting, 14 Digital, 13 Artistic Mosjes (some are placeholders); 2.0 roster: 8 / 14 / 10, 73 Piecies + 20 Snelle (Phase 3), 20 Places (Phase 4; V4 has 17, not 16), 38 Quests in 3 typed stacks of 13 / 13 / 12 (Phase 2).
- The web game (engine) is untouched; handoff comes in Phase 6.
