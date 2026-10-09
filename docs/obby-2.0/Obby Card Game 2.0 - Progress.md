# Obby Card Game 2.0 — Progress

Source docs: `Obby Card Game 2.0 - Rules and Decisions`, `Obby Card Game 2.0 - Rework Plan` (in Downloads), Card List V4 (Google Drive: "Mosjes Card List Momentum Edition V4", id 1E1ZYPim6x4oWVrhplapufDeetP5gzsTJAzP8EcRHZnc).
Docs for this rework live in `docs/obby-2.0/` (design only, no engine code touched).

## Status
- **Current phase:** Phase 0 DONE → next is Phase 1 (Mosjes, Fighting first)
- **Done:** Phase 0 — `Obby Card Game 2.0 - Core Numbers.md`
- **Next:** Phase 1 (Mosjes), Fighting first. Start a fresh chat and say "start on phase 1"; `README.md` in this folder tells it what to read.

## Decisions made
- Summoning costs the printed Energy; the first Mosje at setup is free.
- "Getemt" keeps its name (rename to "Getakst" reverted).
- 100 MP levels you up and MP resets to 0 (L1→L2 at 0, L2→L3 at 0, hold L3 to win). Dropping a level (getemt) lands on 50 MP.
- Highest die goes first; no compensation, both start with 2 Energy and +1 per turn.
- MP → Energy is the gentle rounded table: 0 / 5–10→1 / 15–20→2 / 25–30→3 / 35+→4.
- Deck: minimum 30 cards. Empty deck = shuffle discard into deck, then a cooldown turn: that player may only place cards (no Quests, attacks, summons or activations).
- Quests: one main trait per Mosje type (Fighting=Physical, Digital=Technical, Artistic=Creative). Mental/Social/Resilient are optional side requirements; Phase 2 reworks/adds Quests to cover them.

## Small things I decided myself (check these)
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
- Card List V4 has 8 Fighting, 15 Digital, 14 Artistic Mosjes (some are placeholders), ~100 Piecies/Snelle, 16 Places, ~50 Quests in 7 trait groups (regroup into 3 stacks in Phase 2).
- The web game (engine) is untouched; handoff comes in Phase 6.
