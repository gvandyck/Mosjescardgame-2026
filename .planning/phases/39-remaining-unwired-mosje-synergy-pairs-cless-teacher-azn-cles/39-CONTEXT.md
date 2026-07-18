# Phase 39: Gandoe↔Michelle synergy (The Box deck) - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the **DUO_GANDOE_MICHELLE ("The Box") headline Mosje synergy**, currently dead in BOTH
directions, so it is fully live and sim-verified. Two independent directions:

1. **Gandoe → Michelle (settled mirror, no gray area):** while Michelle Iron Tuk is on your
   field, `[Gandoe] The Destroyer`'s **Physical Quests give +15 bonus MP**. This is a pure
   mirror of the already-wired West + AZN Cless synergy — implemented as one new row in
   `PARTNER_QUEST_SYNERGIES` (`src/abilities/questLogic.js`).
2. **Michelle → Gandoe (new mechanic, the real work):** while `[Gandoe] The Destroyer` is on
   your field, **Michelle's Tough Gamble rolls of 5-6 also grant Gandoe the Destroyer +10 MP.**
   Hooks into the existing Michelle Tough Gamble auto-ability block in `resolveQuestOutcome`
   (`src/abilities/questLogic.js`).

**In scope:** only the DUO_GANDOE_MICHELLE pair (both directions). Repro-first per CLAUDE.md
(failing browser spec → GREEN), then Ronald Kip stacking check + full sim (0 crashes, <25%
timeout) because this touches MP-gain and quest-reward logic.

**Out of scope:** every non-deck synergy from the original Phase 39 scope — Cless Teacher /
AZN Cless shared-effect, FPS Coert / FPS West stale synergy, Chris DDR + DJ 8020, Chris+Youri
Synergy-Chamber-waiver reach. Deferred to a later booster-card synergy-fidelity phase (see
ROADMAP Deck Completion Track).

</domain>

<decisions>
## Implementation Decisions

The single gray-area question ("which of these to decide?") was answered **"pick for me"** —
full delegation, consistent with this user's standing pattern on this track. All four rulings
below were made by Claude with rationale; none are open.

### Michelle → Gandoe bonus — roll threshold
- **D-01: The Gandoe +10 fires on a Tough Gamble roll of 5-6 (honor the printed card text).**
  Why: the bonus is being implemented *fresh* — there is no pre-existing engine behavior for
  it to diverge from, so the "text is canon unless it's a genuine bug" principle applies
  cleanly. It also reads as deliberate design: Tough Gamble already **doubles** the reward on
  4-6, so making the Gandoe kicker a *rarer* 5-6 premium adds a real "great roll" tier instead
  of being redundant with the double band. (Note: this is NOT the "5-6 vs 4-6 mismatch" some
  notes implied — the Tough Gamble double/half band stays 4-6 / 1-3 exactly as printed and as
  the engine already does; 5-6 is a separate, higher threshold scoped only to this new bonus.)

### Michelle → Gandoe bonus — frequency
- **D-02: The +10 fires once per qualifying roll (every Tough Gamble roll of 5-6), NOT capped
  once per turn.** Why: card text reads per-roll ("Tough Gamble rolls of 5-6 also grant…"),
  and the bonus should follow its host mechanic — Tough Gamble itself fires after *every* quest
  with no per-turn cap. Unlike the Phase 38 Jisca Piecie bonus (capped because Piecie plays are
  cheap and spammable), quest attempts are naturally scarce per turn, so there is no runaway
  risk that would justify a cap.

### Michelle → Gandoe bonus — level-up behavior
- **D-03: The +10 is MP-only — `allowLevelUp: false`, mirroring the Phase 38 Alyssa/Jisca
  trickle.** Why: keep automatic synergy MP from silently triggering a level-up; leveling
  should come from the player's deliberate quest/Piecie plays, not an incidental synergy kicker.
  Consistent precedent set in Phase 38. (The quest's own reward still levels via the normal
  path; this is a bonus stacked on top.)

### Michelle → Gandoe bonus — recipient slot
- **D-04: The +10 goes specifically to the `mosje_gandoe_destroyer` slot** (find it in
  `player.activeSlots` by `cardId === 'mosje_gandoe_destroyer' && !isDefeated`). The synergy is
  gated on the Destroyer being present. Guard explicitly so the bonus never leaks to a
  second Gandoe on field (`mosje_gandoe_wizard`). This is a cross-slot MP grant (rolled by
  Michelle, awarded to Gandoe) — same shape as the Phase 38 Piecie-bonus grant to Jisca's slot.

### Gandoe → Michelle direction (carried forward, settled)
- **D-05:** Add `{ pair: ['mosje_gandoe_destroyer', 'mosje_michelle'], category: 'Physical',
  bonus: 15 }` to `PARTNER_QUEST_SYNERGIES` — exact mirror of the wired West + AZN Cless row.
  No new code path; the existing `getPartnerSynergyQuestBonus` / `getActivePartnerSynergyBonuses`
  consumers pick it up automatically (both directions of the table's `every`/`waived` logic).

### Claude's Discretion
- Exact repro-spec scenario shaping (deck/board seeding via `window.__testHooks`,
  `mockDiceRoll` to force 5-6 vs 4 vs ≤3), log strings, and `_autoAbilityLog` phrasing for the
  new Gandoe kicker — planner/executor's call, mirroring Phase 38's spec + the existing Michelle
  Tough Gamble log format.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & prior precedent
- `.planning/ROADMAP.md` §"Phase 39" (line ~949) — narrowed goal + the 4-6/5-6 note.
- `.planning/audits/2026-07-18-five-deck-functional-audit.md` §DUO_GANDOE_MICHELLE — the
  "dead both directions" finding this phase closes.
- `.planning/phases/38-.../38-CONTEXT.md` + `38-DISCUSSION-LOG.md` — the Alyssa/Jisca synergy
  precedent this phase mirrors (`allowLevelUp:false`, cross-slot `gainMP`, repro-first spec).
- `.planning/todos/pending/2026-07-15-remaining-mosje-synergies-and-cless-teacher-fix.md` —
  source inventory; the DEFERRED non-deck remainder lives here (do NOT pull it into this phase).

### Engine + data touchpoints
- `src/abilities/questLogic.js` §`PARTNER_QUEST_SYNERGIES` (line ~51) + `getPartnerSynergyQuestBonus`
  (line ~55) — Gandoe→Michelle direction (D-05).
- `src/abilities/questLogic.js` §Michelle Tough Gamble block (line ~508-539, inside
  `resolveQuestOutcome`) — Michelle→Gandoe direction (D-01..D-04) hooks here, in the `roll >= 4`
  success branch, adding a `roll >= 5` + Destroyer-present sub-branch.
- `src/data/mosjes.js` — `mosje_michelle` (line ~103, `synergyEffect` line 113) and
  `mosje_gandoe_destroyer` (line ~140, `synergyEffect` line 150). Data already declares both
  synergyEffect texts; only the engine consumers are missing.

### Process (mandatory)
- `CLAUDE.md` §"Reproduce every reported bug… BEFORE fixing" + §"full verification sequence"
  (node --check → npm test → Ronald Kip stacking → full sim) — required because this touches
  MP-gain / quest-reward.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`PARTNER_QUEST_SYNERGIES` table + `getPartnerSynergyQuestBonus`/`getActivePartnerSynergyBonuses`**:
  data-driven — the entire Gandoe→Michelle direction (D-05) is one table row, both the after-the-fact
  bonus and the pre-attempt UI pill light up automatically.
- **`gainMP(state, playerId, slotIndex, amount, 'GAIN', { allowLevelUp: false })`**: the Phase 38
  cross-slot grant signature — reuse verbatim for the Gandoe +10 (D-04).
- **`_autoAbilityLog`** on state: the Michelle Tough Gamble block already populates it; extend/append
  the Gandoe kicker into the same entry (see the Jeffrey Brute Force append pattern at ~line 551).

### Established Patterns
- **Synergy detection**: the quest-bonus direction uses the `PARTNER_QUEST_SYNERGIES` `every(id ∈ activeIds)`
  presence check (+ Synergy-Chamber waiver). The Tough-Gamble direction needs a simple ad-hoc
  "Destroyer present" scan of `activeSlots` (no partner-quest table involved) — cheaper and local
  to the block. Do NOT overload `PARTNER_QUEST_SYNERGIES` with the roll-kicker; it's a different mechanic.
- **MP five-grid rule**: +10 and +15 are already multiples of 5 — no `roundToFive` needed.
- **Repro-first**: mirror `tests/ui/cards/alyssa-jisca-synergy.spec.js` — force the dice with a
  `mockDiceRoll` hook so 5, 4, and ≤3 rolls are deterministic; assert Gandoe's MP delta is +10 only
  on 5-6 and 0 on 4, with the quest double/half unaffected.

### Integration Points
- Michelle→Gandoe: inside `resolveQuestOutcome`'s existing `mosje.cardId === 'mosje_michelle'` /
  `roll >= 4` success branch in `src/abilities/questLogic.js`.
- Gandoe→Michelle: `PARTNER_QUEST_SYNERGIES` array literal; picked up by the already-wired stack
  step 4 in `resolveQuestOutcome` (`getPartnerSynergyQuestBonus` call ~line 399).

</code_context>

<specifics>
## Specific Ideas

- The card texts are already authored and test-guarded for the "While <partner> is also on your
  field:" convention — do not reword them; wire the engine to match.
- Strongest repro proof (per CLAUDE.md): spec RED on current code, GREEN after wiring; optionally
  confirm by reverting the wiring and watching it break.

</specifics>

<deferred>
## Deferred Ideas

- **Non-deck synergy remainder** (original Phase 39 scope): Cless Teacher / AZN Cless shared-effect,
  FPS Coert / FPS West stale synergy, Chris DDR + DJ 8020, Chris+Youri Synergy-Chamber-waiver reach.
  → later booster-card synergy-fidelity phase; none appear in any of the 5 player-facing decks.

</deferred>

---

*Phase: 39-remaining-unwired-mosje-synergy-pairs-cless-teacher-azn-cles*
*Context gathered: 2026-07-18*
