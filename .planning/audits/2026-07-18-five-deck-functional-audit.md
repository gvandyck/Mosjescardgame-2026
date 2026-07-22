# Five Starter-Deck Functional Audit — 2026-07-18

Goal: for each of the 5 **player-facing duo decks**, determine whether every card is
functional — Piecies/Snelle/Quests wired, **Mosje synergies live**, and **Places
actually contributing**. The 3 archived originals (PHYSICAL_FORCE / DIGITAL_CONTROL /
ARTISTIC_RHYTHM) are out of scope.

## Method & confidence

- **Verified at code level (high confidence):** every unique card's effect *exists and
  is dispatched*; Mosje-synergy wiring; Place trigger→dispatcher wiring.
- **NOT verified here (the deep unknown):** whether each *wired* Piecie/Quest behaves as
  its card text says. That behavior-vs-text pass is the Phase-42-style audit and is the
  remaining unknown for a true "fully functional" claim.
- Known text≠engine divergences are carried from the tracked todos (Phases 39/40/41/43),
  not re-derived.

Dedupe: the 5 decks share many cards, reducing to **10 Mosjes, 32 Piecies, 11 Snelle,
9 Places, 4 Quests** unique.

## Wiring baseline (all green)

- **32/32 unique deck Piecies** map to a real `effect_*` function (no missing, no stubs).
- **11/11 unique deck Snelle Piecies** map to a real effect (incl. `snelle_jensen` —
  verified: Phase 21 deleted a *different* unreferenced `effect_jensen`, not this one).
- **4/4 deck Quests** exist with category + requirement.
- **9/9 deck Places** dispatch on their trigger phase — EXCEPT `place_dierenasiel`, whose
  effect is `return state` (confirmed no-op).

So nothing in the decks is *unwired*. The gaps are **dead-by-design** (no-op / flag never
read) or **text≠engine divergences**, both listed per-deck below.

## Per-deck findings

### DUO_COERT_BINTI — "Winston's Kitchen"  → mostly healthy, 2 flags
- Mosje synergy: **✅ FOOD-double wired** (`hasFoodDoubleSynergy`).
- Places: Caravan ✅ (end-of-turn drain, Coert-immune) · Bank Chilling ✅ (+15 Social 2+).
- ⚠ **Coert KasteLuck ability** — Morning Luck text (turn-start d6 4-6 → free Piecie)
  ≠ engine (manual, even roll → +15 MP). **Phase 40.**
- ⚠ **Coert's Caravan** — declared Binti MP-discount clause never implemented. **Phase 41.**
- ⚠ **redbull** — per-Mosje powerup rework pending (memory; Coert fix uncommitted).

### DUO_GANDOE_MICHELLE — "The Box"  → BROKEN headline synergy
- Mosje synergy: **❌ dead BOTH directions.** Michelle "Tough Gamble 5-6 → Gandoe +10"
  (engine actually rolls **4-6** — threshold mismatch too) AND Gandoe "Physical Quest +15
  with Michelle" (not in `PARTNER_QUEST_SYNERGIES`). **Phase 39 core.**
- Places: De Box ✅ · Boxing Ring ✅ (both dispatched).
- This is the only deck whose two-Mosje headline synergy is entirely non-functional.

### DUO_CHRIS_YOURI — "Instant Setup"  → synergy works, 1 dead ability
- Mosje synergy: **✅ instant-play wired** (`hasBothChrisAndYouri`). Waiver-awareness gap
  is irrelevant here (no Synergy Chamber in deck).
- Places: Arcade ✅ · Momentum Factory ✅.
- ❌ **Chris "Perfect Setup" ability does literally nothing** — sets `instantPiecieThisTurn`,
  a flag no engine code reads (the real synergy uses `hasBothChrisAndYouri` directly).
  **Phase 40.**

### DUO_JISCA_ALYSSA — "Encore Bulldozer"  → synergy just wired, 1 dead place + 1 divergent ability
- Mosje synergy: **⏳ just wired in Phase 38** (sim verifying at time of writing).
- Places: **❌ Dierenasiel = no-op** (Phase 43) · Bank Chilling ✅.
- ⚠ **Jisca "Perfect Combo" ability** — divergent stub (+20 MP if last card was a Piecie);
  Gandoe rejected both text and code, redesign pending. **Phase 40.**

### DUO_WEST_CLESS — "Calculated Chaos"  → CLEANEST deck
- Mosje synergy: **✅ Physical-Quest+15 wired** (`PARTNER_QUEST_SYNERGIES`). (The Cless
  *Teacher* gap is a different card, NOT in this deck; this deck uses AZN Cless, which is
  wired + already reconciled.)
- Places: The Gym ✅ · Obby 1 ✅.
- No known dead/divergent card among the deck's members (behavior-vs-text of its Piecies
  still unverified like all decks).

## The strategic insight

Phase 39's todo scope — Cless Teacher, FPS Coert/FPS West, Chris DDR + DJ 8020, Synergy
Chamber waiver reach — involves cards that appear in **NONE of the 5 player-facing decks.**
The only Phase-39 item touching a real deck is **Michelle ↔ Gandoe**.

The roadmap phases are organized **by mechanism** (synergies=39, abilities=40, Caravan=41,
Dierenasiel=43) — but the *deck-relevant* gaps are a small, specific subset spread across
those phases. If the goal is "make the 5 decks shippable," a **deck-oriented sweep** of
exactly these items is higher-leverage than executing the mechanism-phases in full order:

| Gap | Deck | Current phase |
|---|---|---|
| Gandoe+Michelle synergy (both sides + 4-6/5-6) | The Box | 39 (deck-relevant slice) |
| Chris "Perfect Setup" ability (dead) | Instant Setup | 40 |
| Jisca "Perfect Combo" ability (redesign) | Encore Bulldozer | 40 |
| Coert KasteLuck ability (divergent) | Winston's Kitchen | 40 |
| Dierenasiel place (no-op) | Encore Bulldozer | 43 |
| Caravan Binti-discount clause | Winston's Kitchen | 41 |
| Alyssa+Jisca synergy | Encore Bulldozer | 38 (in verification) |

**Deferrable (no player-facing deck):** Cless Teacher, FPS Coert/West, Chris DDR+DJ 8020,
Synergy Chamber waiver (Phase 39 remainder); Ming Natural, Jeffrey Gambler, Tuk Healer,
Coert Kastelein, FPS Coert (Phase 40 remainder).

## Remaining unknown

Behavior-vs-text correctness of the **32 wired deck Piecies + 4 Quests** was not checked
here. That per-card behavioral pass (candidate for deep/Fable reasoning) is what remains
before any deck can be called *fully* functional with confidence.
