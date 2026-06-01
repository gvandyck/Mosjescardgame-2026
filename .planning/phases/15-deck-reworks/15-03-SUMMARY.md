---
phase: 15-deck-reworks
plan: 03
status: COMPLETE
tests_added: 17
tests_total: 793
simulation: 0 crashes, 0 timeouts (100 games)
---

## What was done

- **starterDecks.js**: ARTISTIC_RHYTHM reworked — Mosjes: [mosje_youri, mosje_chris_ddr], 10 piecies (kannetje_melk×2, affoe×2, pot_of_weed, quest_prep×2, controller, synergy_field, grammetje_pieter), snelle: [lucky_coin×2, jensen, ff_haaltje_nemen], places: [quest_haven, bank_chilling], quest: [quest_improvise]
- **mosjes.js**: 4 synergyWith patches — gandoe_destroyer↔michelle (bidirectional), dj_8020→chris_ddr, youri→[chris, chris_ddr] (preserved existing chris entry)
- **quests.js**: No changes — iron_will, perfect_sync, lucky_crescendo correctly retain isBoosterOnly: true (required Mosjes no longer in starter decks)
- **simulation/starter-decks.ts**: Updated all 3 Mosje tuples — Physical Force: gandoe-the-destroyer (0 MP) + michelle-iron-tuk (0 MP); Digital Control: coert-the-tech-savant (10 MP) + binti-the-sharp-tongue (5 MP); Artistic Rhythm: youri-the-speedrunner (0 MP) + chris-ddr (15 MP)
- **deck-balance.test.ts**: 17 new tests (Artistic Rhythm composition, synergyWith verifications, isBoosterOnly retention checks)

## Simulation results

- 0 crashes, 0 timeouts across 100 games
- Physical Force vs Digital Control: 18-15 (P1 wins)
- Digital Control vs Artistic Rhythm: 11-22 (P2 wins)
- Artistic Rhythm vs Physical Force: 21-13 (P1 wins)
