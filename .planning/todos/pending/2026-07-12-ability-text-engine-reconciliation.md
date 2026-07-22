> **Phase 49 — DELIVERED SUBSET recorded (todo stays OPEN).** The deck-slice subset
> was verified in **Phase 40** (3 deck Mosjes: Chris All-Rounder, Jisca, Coert
> KasteLuck). The remainder (the rest of the 9-ability text↔engine reconciliation) is
> NOT closed — it stays as backlog input for **OPEN Phase 42** (full-game ability-text
> audit). Full record:
> `.planning/phases/49-legacy-execution-evidence-closure-for-plans-without-summarie/49-VERIFICATION.md`
> (Stale Todos table).

---
created: 2026-07-12
title: Reconcile 9 Mosje ability texts with engine behavior, one card at a time
area: general
files:
  - src/data/mosjes.js (abilityDescription fields)
  - src/abilities/mosjeAbilities.js (implementations)
  - src/abilities/questLogic.js (auto-abilities)
---

## Problem

The 2026-07-12 synergy-text audit found 9 Mosjes whose card text describes a DIFFERENT effect than the engine performs. Precedent for resolving: AZN Cless (2026-07-11) was ruled "code, not text, is the intended design" — each card below needs its own ruling from Gandoe (code wins / text wins / third design), with lots of questions per card. Do NOT batch-fix.

The divergences (text says → engine does):

1. **Ming Natural — Lucky Draw**: reveal drawn card, Piecie→free activate or keep, else +15 MP → engine just draws 1 card (ability_ming_natural_lucky_draw).
2. **Jeffrey Gambler — High Stakes**: wager X, d6: 1-2 lose X / 3-4 nothing / 5-6 gain X + draw 1; next Quest +25 MP → engine: fixed 30 MP bet, 4+ → +60 MP (net +30), no draw, no quest bonus.
3. **Chris All-Rounder — Perfect Setup**: needs 3+ face-down Piecies, activate 1 free + 15 MP → engine: just arms instantPiecieThisTurn, no gate, no MP.
4. **Jisca — Perfect Combo**: after each Piecie roll d6, 4-6 chain + opponent -15, 1-3 self -10 → engine: flat +20 MP if last card played was a Piecie, no roll, no chain.
5. **Tuk Healer — Healing Presence**: choose self +25 OR ally +15 + draw; self-gains +10 extra → engine: ALL own Mosjes +15, no choice, no draw, no +10 hook.
6. **Coert KasteLuck — Morning Luck**: turn-start d6, 4-6 → one extra free Piecie → engine: manual activation, even roll → +15 MP.
7. **Coert Kastelein — Immovable Object**: passive -20 on all MP loss, cap 50+ hits at 25, no Welloe at 30+ MP → engine: manual activation → self immune to MP loss this turn only.
8. **Drainer (placeholder)**: at start of each opponent turn all opponents -5 MP → engine: one-shot DRAIN status (-5/turn, 3 turns) on opponent's first Mosje.
9. **FPS Coert — Headshot Precision**: after Physical/Technical Quest success roll d6, on 6: +30 MP and target opponent -15 → engine: manual activation, flat -25 MP to opponent's first Mosje.

Also engine-only, no ruling yet: Chris DDR's Perfect Combo Chain text (roll-per-Piecie chain) vs engine (+5 MP per Piecie played this turn) — and the DJ 80/20 synergy text references Chris's "chain rolls" which don't exist in the engine.

## Solution

One interactive session per card (or small batches): Gandoe rules text-vs-code, then align the loser, update docs/card-reference.md notes (AZN Cless row is the format precedent), add/adjust card tests, and re-run sim for MP-touching changes.

## STATUS 2026-07-18: Rulings made; implementation status corrected

The original "none started yet" line became stale. Git history shows the ruled
implementations landed on 2026-07-13. Phase 40's player-facing deck slice
(Chris All-Rounder, Jisca, and Coert KasteLuck) is being independently verified
and closed through
`.planning/phases/40-9-mosje-ability-text-to-engine-reconciliation/40-01-PLAN.md`.
The remaining non-deck items stay deferred by the Deck Completion Track and are
not being re-scoped into that closeout.

Every card below was ruled on interactively with Gandoe via AskUserQuestion (screenshare of exact text vs. exact code shown first). Implement one card at a time, TDD (failing test → implement → `node --check` + `npm test` → commit), per CLAUDE.md. Re-run sim after any MP-touching change (all of these touch MP except the two hidden cards).

### Final rulings

1. **Ming Natural — Lucky Draw**: TEXT WINS, as a manual-trigger ability (not an auto-hook on every draw event — would break with multi-draw cards like Pot of Weed). Activate: draw 1 card, reveal it. If it's a Piecie → player choice: free-activate it now, or keep in hand. If not a Piecie → add to hand, Ming gains 15 MP.
   - Reuse: `showRevealedCard` → `showOptionSelect` UI shape from Ming Predictor's Future Sight (`main.js:2023-2067`, engine at `mosjeAbilities.js:343-368`). For the "free-activate now" branch, reuse Ronald Master Plan's direct-call trick (`mosjeAbilities.js:603-635`): look up the Piecie def, call `piecieEffects[def.effectId](state, playerId)` directly — no slot, no MP cost.
   - Current stub to replace: `mosjeAbilities.js:329-338` (`ability_ming_natural_lucky_draw`).

2. **Jeffrey Gambler — High Stakes**: NEW DESIGN (old wager mechanic dropped entirely — Gandoe: "too OP", wanted a real gamble). Activate: roll 1d6. Roll 1-5 → apply `QUEST_BLOCKED` status to Jeffrey (no Quest attempts this turn). Roll 6 → `questPrepBonus += 3` (next Quest roll bonus). No MP cost, no MP gain/loss either way.
   - Reuse: `QUEST_BLOCKED` status push — copy Tikker's exact shape, `piecieEffects.js:963`: `player.activeSlots[si].statusEffects.push({ type: 'QUEST_BLOCKED', value: 0, turnsLeft: 1 })`. `questPrepBonus` — copy Cless Teacher exactly, `mosjeAbilities.js:716-723`: `player.questPrepBonus = (player.questPrepBonus || 0) + 3;`.
   - Current code to replace: `mosjeAbilities.js:442-461` (`ability_jeffrey_gambler_high_stakes`). Update `abilityDescription` at `mosjes.js:301`.

3. **Chris All-Rounder — Perfect Setup**: TEXT WINS but drop the 15 MP gain (Gandoe: "free activation is strong enough"). Gate: 3+ face-down Piecies on field required. Effect: player picks ONE of those existing face-down Piecies and activates it for free (not "next Piecie played is instant" — that reads the current WRONG behavior and needs full removal, see note below).
   - Reuse: Youri Speedrunner's two-step mechanism (`mosjeAbilities.js:475-522` for the ability, `main.js:2116-2160` for the multi-choice UI via `_pendingYouriActivation`): (1) set `piecieSlots[i].canActivateOnTurn = state.turnNumber` on the chosen face-down slot, (2) call the shared engine function `activatePiecie(state, playerId, slotIndex)` (`turnManager.js:672-839`) — that function itself flips `faceDown`/`activated` and runs the Piecie's effect. No MP cost step needed (Chris's version has no cost).
   - **Important side-finding**: Chris's CURRENT code (`mosjeAbilities.js:464-472`) sets `player.instantPiecieThisTurn = true` — this flag is **never read anywhere in the engine** (confirmed via full-repo grep, only 3 hits: the reset in `turnManager.js:145`, this write, and one write in `piecieEffects.js:480`). The real Chris+Youri synergy checks `hasBothChrisAndYouri(player)` directly in `playPiecie` (`turnManager.js:518-528`), not this flag. So Chris's ability currently does **literally nothing** today — confirms the whole premise of this todo for this card.
   - Add a once-per-turn guard (no existing in-function check currently — follow Ronald's per-slot `masterPlanUsed`-style flag pattern, `mosjeAbilities.js:609`).

4. **Jisca — Perfect Combo**: NEW DESIGN (roll-based chain, replacing both the old text AND the old code — Gandoe explicitly rejected both). Roll 1d6. Roll 1-4 → ability costs only, no effect. Roll 5-6 → pick ANY Piecie on your field (face-down OR already-active/just-placed) and activate it for free.
   - Reuse for the face-down case: same Youri two-step as Chris (#3) above.
   - **No existing path for the "already-active" case** — `activatePiecie` hard-blocks with `if (slot.activated) return {success:false, error:'Piecie already activated'}` (`turnManager.js:695`), and there's no re-trigger mechanism anywhere in the codebase. For already-active Piecies, use Ronald Master Plan's direct-call pattern instead (`piecieEffects[def.effectId](state, playerId)` called directly, bypassing `activatePiecie`'s slot-state checks).
   - Current code to fully replace: `mosjeAbilities.js:638-651` (`ability_jisca_perfect_combo`, the "+20 MP if last card was a Piecie" stub). Update `abilityDescription` at `mosjes.js:452`.

5. **Tuk Healer — Healing Presence**: NEW DESIGN. Once per turn, player chooses: this Mosje +10 MP, OR another own Mosje +10 MP. No draw, no extra passive hook. (Note: Tuk's self-pick +10 stacks with the existing global "turn trickle" — EVERY active Mosje already gains a flat +10 MP at the start of its owner's turn regardless of card, see `turnManager.js:219-227` — so Tuk's own total that turn ends up 20 MP if self is picked. That trickle is unrelated to this ability and needs no new code; just don't be confused if sim/test numbers show 20 instead of 10.)
   - Reuse: `getPlayerMosjes(gameState, playerId)` (`gameState.js:270-280ff`, returns own non-defeated slots) + `modal.showTargetSelector(options, prompt)` (`modalManager.js:391`) + `_pendingTargets.own_slot_index` (same key Tikker/Kannetje Melk already use, consumed pattern at `piecieEffects.js:958-961`). Full UI wiring example at `main.js:2492-2505`.
   - Current code to replace: `mosjeAbilities.js:653-663` (heals ALL own Mosjes flat 15 — wrong on every axis). Update `abilityDescription` at `mosjes.js:470`.

6. **Coert KasteLuck — Morning Luck**: TEXT WINS almost exactly, with one mechanical correction (see below). Auto-trigger at turn start (NOT manual activation): roll 1d6, on 4-6 → one Piecie played this turn may skip the "wait until next turn to activate" rule (same-turn activation).
   - **Do NOT use `freePiecieActivationAvailable`** — traced its full lifecycle and it's entangled with the Place card "Coert's Caravan" (gated on `state.activePlace === 'place_coerts_caravan'` at both consumption points, `turnManager.js:711-718` and `handRenderer.js:103-110`) and is actually inert even when it does fire (only skips a console.log). Confirmed with Gandoe this Place-gating is intentional design for Place cards (shared board, one active at a time) — just wrong to reuse for a Mosje ability.
   - Instead: mirror the ACTUALLY-working Chris+Youri same-turn-activation mechanic (`turnManager.js:518-528`, sets `canActivateOnTurn = state.turnNumber` at play-time when the synergy condition is met). KasteLuck's turn-start roll should set an equivalent flag/condition that `playPiecie` checks for this player, granting same-turn activation to the next Piecie they play.
   - Insertion point for the turn-start roll: `turnManager.js`, in `startTurn()`, right after the turn-trickle block (~line 230-235, before `return state;` at `:237`). This is genuinely fresh wiring — no existing "roll d6 at turn start" call site to copy. **Correction from initial research**: DJ 80/20's "Lucky Beats" (+10 MP turn start) is NOT live anywhere despite looking like a precedent — `ability_dj_8020_lucky_beats` (`mosjeAbilities.js:56-70`) is dead code, never called. Don't model on it.
   - Add `autoAbility: true` to `mosje_coert_kasteluck` in `mosjes.js` (mirrors Jeffrey/Michelle's pattern) so `boardRenderer.js:109` hides its manual-activate button and `botDriver.js:278` skips it for bot manual-ability attempts.
   - Current code to fully replace: `mosjeAbilities.js:666-680` (`ability_coert_kasteluck_morning_luck`, manual d6-even-→-+15MP stub).

7. **Coert Kastelein — Immovable Object**: HIDE FROM THE GAME ENTIRELY (Gandoe: "too conceptual still," doesn't remember this card). Full removal from all pools — data stays in `mosjes.js` marked `disabled: true`, unobtainable/unplayable anywhere, recoverable later by flipping the flag.
   - 3 real filter points to add `!card.disabled` at: `src/data/boosterEngine.js:22-28` (POOL array — the actual acquisition source, most important one), `src/deck-builder.js:27-37` (ALL_CARDS — deck-builder UI pool, should filter out entirely not just grey out), `src/data/cardIndex.js:54-58` (`getStarterEligible()` — currently dead/unused but should mirror the pattern for consistency). No change needed in `expandDeckToCardIds.js`, `pickBotDeck.js`, or `playerFacingDecks.js` (all deck-id-driven, not MOSJES-array-driven) — confirmed neither hidden card appears in any `STARTER_DECKS` entry already.
   - Add `disabled: true` to `mosje_coert_kastelein` at `mosjes.js:607`.
   - Leave the stale `mosje_coert_kastelein` reference in `synergyResolver.js:78-82` (`FOOD_SYNERGY_COERTS`) alone — harmless dead reference once the card can never be on a field.

8. **Drainer (placeholder)**: HIDE FROM THE GAME ENTIRELY, same as #7 (Gandoe grouped both together as "too conceptual").
   - Same 3 filter points as #7. Add `disabled: true` to `mosje_drainer` at `mosjes.js:366`.

9. **FPS Coert — Headshot Precision**: TEXT WINS. Auto-trigger after a Physical or Technical Quest SUCCESS (not manual activation): roll 1d6, on 6 → FPS Coert +30 MP, opponent's first active Mosje -15 MP.
   - Reuse: `applyMosjeFieldEffectsOnQuest` in `questLogic.js:471-540` (called from `resolveQuest` at `:438`) — same hook Michelle and Jeffrey already use for their own quest-success triggers. Add a `mosje.cardId === 'mosje_fps_coert'` branch there. Needs `questCard` threaded into that function's params (currently only receives `questMpGained`, not the quest card itself) so the Physical/Technical category gate can be checked (`questCard.category`, values include `"Physical"`/`"Technical"`/etc., confirmed via `quests.js`).
   - For the opponent -15 MP part, mirror the `opponentLoseMP` pattern (`questLogic.js:424-434`, `quests.js:654`): find opponent's first active non-defeated slot via `findIndex`, apply `loseMP`.
   - Add `autoAbility: true` to `mosje_fps_coert` in `mosjes.js` (currently absent — needed so the manual-activate button hides, same as item #6).
   - Current code to become a no-op passthrough (mirror `ability_jeffrey_brute_force`, `mosjeAbilities.js:168-171`): `mosjeAbilities.js:560-576` (`ability_fps_coert_headshot_precision`, old manual flat -25 MP version).
   - Note: `mosjes.js:391` abilityDescription is ALREADY correct (matches this ruling) — only the implementation is stale.
   - Separate/unimplemented, NOT part of this ruling but discovered alongside it: the FPS Coert + FPS West "+10 MP both on quest complete" synergy text (`mosjes.js:393` and `:413`) is pure unconsumed flavor text — confirmed zero implementation anywhere. Out of scope here; flag if Gandoe wants it done later.

10. **Chris DDR — Perfect Combo Chain** (the open question, not one of the original 9 but resolved in the same session): TEXT WINS — Gandoe loved this one once the DJ 80/20 synergy interaction was explained. Roll 1d6 after each Piecie activated this turn, on 5-6 → activate another Piecie from hand for free, chain up to 3 times per turn. DJ 80/20's synergy text (`mosjes.js:490`, "+2 Quest roll bonus also applies to Chris's Perfect Combo Chain rolls") stays as-is and becomes accurate once this is implemented — no separate change needed there.
    - No direct precedent exists for "roll after every Piecie activation, capped N times per turn" — closest analogues: Youri's `youriAbilityUses` cap (`mosjeAbilities.js:481-483`, `:506`) is per-GAME not per-turn (wrong lifecycle, don't copy directly) — instead follow the per-turn-counter idiom like `pieciesActivatedThisTurn` (reset in `startTurn()` at `turnManager.js:149`, incremented in `activatePiecie` at `:805`): add a new `player.chrisDdrChainUsesThisTurn` reset in the same `startTurn()` block.
    - Trigger hook: right after the activation-counter bump in `activatePiecie` (`turnManager.js:805-811`), check for `mosje.cardId === 'mosje_chris_ddr'` on the acting player's field — closest existing "fire an auto-effect right after a Piecie activates" insertion point is the Momentum Factory place-effect hook immediately below it (`:817-820`).
    - "Activate another Piecie from hand for free": since it's from hand (not a field slot), use Ronald Master Plan's direct-call pattern again (`mosjeAbilities.js:616-621`) — but guard the recursive re-trigger-of-self with the new per-turn counter BEFORE recursing, to cap the chain at 3 and avoid infinite loop.
    - Current code to fully replace: `mosjeAbilities.js:798-810` (`ability_chris_ddr_perfect_combo_chain`, flat "+5 MP per Piecie played" stub — matches neither old text, old code intent, nor this ruling).

### Related backlog items spun off this session (separate todos, do not fold in here)
- `2026-07-13-coerts-caravan-binti-discount-mismatch.md` — Coert's Caravan (Place card) text promises a Binti Piecie MP-cost discount the code never implemented. Found incidentally.
- `2026-07-13-full-game-ability-text-audit.md` — once these 9 (+1) ship, run a systematic text-vs-code pass across ALL Piecies/Places/remaining Mosjes, not just these.

### Suggested implementation order
Ming Natural first (cleanest existing pattern to copy, lowest risk) → Jeffrey Gambler (also clean, two well-established reuse targets) → Tuk Healer → Chris All-Rounder → Jisca (touches the same face-down/active-Piecie mechanics as Chris, do right after) → Coert KasteLuck (fresh turn-start wiring) → hide Kastelein + Drainer together (pure data/filter change, no gameplay logic) → FPS Coert (needs `questLogic.js` signature change, more invasive) → Chris DDR last (most novel mechanic, no direct precedent, highest risk).
