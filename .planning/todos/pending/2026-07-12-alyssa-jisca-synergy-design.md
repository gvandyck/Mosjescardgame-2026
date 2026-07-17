---
created: 2026-07-12
title: Design + implement the Alyssa↔Jisca synergy (currently declared but empty)
area: general
files:
  - src/data/mosjes.js:57 (alyssa_bulldozer synergyWith jisca, effect null)
  - src/data/mosjes.js:75 (alyssa_fissa synergyWith jisca, effect null)
  - src/data/mosjes.js:453 (jisca synergyWith both alyssas, effect null)
  - src/engine/synergyResolver.js (pair detection works; no effect consumes this pair)
---

## Problem

`mosje_alyssa_bulldozer` and `mosje_alyssa_fissa` both declare `synergyWith: ["mosje_jisca"]`, and Jisca declares both Alyssas back — but `synergyEffect` is `null` on all three and nothing is implemented in the engine. The pair currently does nothing and shows nothing on the cards, even though DUO_JISCA_ALYSSA is one of the 5 player-facing starter decks (so this duo's *headline mechanic doesn't exist*). Found during the 2026-07-12 synergy-text-clarity audit.

## Solution

Full interactive design session with Gandoe (lots of UX/design questions — run through /gsd-discuss-phase or similar before any code):
- What should the duo actually DO? (Gandoe decides — nothing to reverse-engineer, there is no legacy text or code.)
- Write both directions' card texts following the convention "While <partner> is also on your field: <effect>." — guarded by tests/data/synergy-text-clarity.test.ts (add the pair to its REQUIRED_PARTNER_MENTIONS table).
- Implement in the engine (see existing patterns: hasBothChrisAndYouri in turnManager.js, PARTNER_QUEST_SYNERGIES in questLogic.js, hasFoodDoubleSynergy in synergyResolver.js).
- Bot awareness (src/bot/strategy/) + card/engine tests + sim run (MP-touching change).
