# Phase 57: Piecies, Snelle, Places and Reaction Windows - Context

**Gathered:** 2026-10-12 · **Source:** handoff express path (Gandalf: mostly autonomous)

<domain>
2.0 table rules for Piecies (3 slots, face-down, ready, Stays), Snelle (any turn, free slot, saved Energy), Places (from hand, no slot, one in play), the Welloe pile, and the reaction-window framework that offers Snelle. Individual Snelle/Place effects are Phase 60, Piecie effects Phase 59 — this phase gives them the lifecycle and the hooks.
</domain>

<decisions>
## Locked (handoff §2f, §3c; Core Numbers §1, §1a; Card List section intros)
- **Piecie:** max 3 slots per player (Phase 55 `PIECIE_SLOT_COUNT`). Placed face-down for free; ready from the owner's next turn; activating pays its `cost` in Energy (Phase 54). Then discard, unless it **Stays** (`stays` field from Phase 53): face-up in its slot, still occupying it, until its end time (`endOfNextTurn` / `startOfNextTurn` / as long as its Mosje stays, etc.), then to the discard pile. No 4th Piecie.
- **Snelle:** played from hand at any time, also on the opponent's turn, with saved Energy. Needs a free Piecie slot: goes into the slot, resolves, then discard (Blensen! stays until end of turn). Not on a cooldown turn.
- **Reaction windows (TABLE-04):** the engine pauses at 7 moments — an opponent card targets a Mosje; a Mosje would lose MP; a Mosje is attacked; a Mosje is about to go to the Welloe pile; right after a Quest roll; right after a Piecie is activated; when a Jensen! is played — and offers the defending player (or bot) the Snelle in hand that fit that moment, only if they have a free slot and enough Energy. Snelle eligibility per moment comes from data (each Snelle's trigger moment), so Phase 60 only fills in effects. Human: prompt (reuse existing modal). Bot: simple policy (play if it prevents a getemt / Welloe; full strategy Phase 61). Must not deadlock bot-vs-bot or offline play.
- **Place:** from hand on your turn, only when no Place is in play; pay `cost`; works at once; no slot; stays until destroyed; belongs to its player; destroyed → that player's discard pile. Not on a cooldown turn. Remove V4 `activatePlace(slotIndex)` / face-down Places (Phase 54 interim charging moves to play-from-hand).
- **Welloe pile:** separate from discard, never shuffled back (Phase 54 built it); only Mosje Reborn and Call of the Welloes take Mosjes out, not while Welloe Graveyard is the Place.
- **SHELL-04:** this is the last phase replacing a V4 rule: at the end no test in `tests/` encodes a V4 rule; `npm test` green. Specs left as `test.fixme` must point at a later card phase (58–60) with a reason, never at a V4 rule.
- Phase 56 known gaps to close here: Piecie Activate button missing in headless Playwright runs (VIS-01/02/08 fixme — reproduce in a headless spec first, then fix), the `stays` slot flag (Endure Pain condition), Piecie readiness flag (replace `playedOnTurn+1` fallback), chain-tests chain-1/chain-6 (`questPrepBonus` → 2.0 +1 die).
- One engine, no switch; `npm test` green after every plan; never weaken tests; no `npm run test:sim`; Playwright headless only (Gandalf plays on the main screen); test helpers in `tests/helpers/*.js`; syntax-check each UI file separately (`for f in …; do node --check "$f"; done`).

## Claude's Discretion
- Reaction-window architecture (pending-reaction state on the game state + resolve step is preferred over callbacks, so it works for human UI, bot and later online play); module layout (one exported function per file).
</decisions>

<canonical_refs>
- `docs/obby-2.0/Obby Card Game 2.0 - Claude Code Handoff.md` §2f, §3c, §6a (E22–E25), §6c (U6, U7)
- `docs/obby-2.0/Obby Card Game 2.0 - Card List.md` — Piecies/Snelle/Places intros, Snelle table ("Play when …" texts define each trigger moment), Rulings section
- `docs/obby-2.0/Obby Card Game 2.0 - Core Numbers.md` §1, §1a
- Phase 53–56 SUMMARYs (fields `stays`/`cost`, slot constant, Energy, Welloe pile, attack/Quest actions, test hooks)
</canonical_refs>
