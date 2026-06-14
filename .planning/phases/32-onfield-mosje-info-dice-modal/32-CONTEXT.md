# Phase 32: On-field Mosje Info + Quest Dice Modal Redesign - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning
**Source:** Direct user feedback + AskUserQuestion design decisions

<domain>
## Phase Boundary

Four UI/UX fixes to the live `.js` engine's board + modal layer. **Pure UI/UX — no engine, MP, quest-logic, or card-data changes.**

In scope:
1. Own on-field Mosje cards show meta info at a glance (Level, traits, ability, active-only synergy).
2. Synergy shown on a Mosje only when currently active.
3. Remove the useless "Active on field" description text from on-field Mosje cards.
4. Full visual redesign of the Quest dice-roll/result modal.

Out of scope: opponent Mosje enrichment, hover-detail system (separate deferred branch), any engine/MP/quest changes, the dead `buildMosjeCardHTML`/`buildPlaceCardHTML` renderers.
</domain>

<decisions>
## Implementation Decisions (LOCKED — from user)

### On-field Mosje display (ONFIELD-01)
- **Compact on card + full on click.** Own on-field Mosje cards show a compact info layer directly on the board card: Level badge + trait star-pips + a short ability snippet. Clicking the card still opens the full detail modal (existing behavior).
- The card must stay readable — info is compact (pips, truncated ability), not full prose.

### Own only (ONFIELD-04)
- Only the local player's own on-field Mosjes get the enriched layer. Opponent Mosjes stay minimal (current look), still clickable for the detail modal.
- Signal already exists: in `boardRenderer.js`, bottom (own) Mosjes are rendered via `renderCard(mosje, { compact, gameState, viewingPlayerId })`; top (opponent) Mosjes via `renderCard(mosje, { compact: true })` only. Add an explicit `owned: true` option on the bottom render call and thread options into `buildUnifiedCardHTML`.

### Synergy active-only (ONFIELD-02)
- Synergy is rendered on the on-field card **only when the synergy partner is currently active** (on field, owned, not defeated). Hidden otherwise.
- `cardRenderer.js` already has `getOwnedActiveMosjeIds(gameState, viewingPlayerId)` — reuse it.

### Remove "Active on field" text (ONFIELD-03)
- `src/main.js` `toMosjeCards` sets `description: slot.isDefeated ? 'Defeated' : 'Active on field'`. Change the active branch to `''`. Keep `'Defeated'`.

### Level in detail modal (ONFIELD-05)
- `showCardPreview` (modalManager.js) MOSJE branch currently shows Ability / Synergy / pet chip / Traits but NOT Level. Add a Level chip (and MP if present) for Mosjes that carry a runtime `level`.

### Level numbering
- Internal level is 0-based (0/1/2 → displayed Level 1/2/3, race to Level 3). The detail modal already displays `level + 1`. Align the on-field badge to display `level + 1` (currently shows raw `Lv ${card.level}` → "Lv 0"). Consistent 1-based display everywhere.

### Dice modal — FULL redesign (DICE-01)
- New visual: animated die **face with pips** (not a bare number), staged **requirement → rolling → result** flow, themed colors, prominent success/fail reveal with MP delta.
- **Preserve ALL existing logic unchanged:** `diceBonus`, `forceReroll` (Je Weet Niet), `skiffaRerolls` (Skiffa rerolls), `window.__forceDiceRoll` test override, the `onResolved(didSucceed, { roll, threshold })` contract, and the threshold>=7 "cannot succeed" case.
</decisions>

<canonical_refs>
## Canonical References

Downstream agents MUST read these before implementing.

### Live render path (source of truth)
- `src/ui/cardRenderer.js` — `renderCard` + `buildUnifiedCardHTML` (on-field/hand card template). `getOwnedActiveMosjeIds` helper at bottom. **`buildMosjeCardHTML`/`buildPlaceCardHTML` are DEAD — do not touch.**
- `src/ui/boardRenderer.js` — board render; own=bottom (lines ~81-136), opponent=top (lines ~66-79).
- `src/main.js` — `toMosjeCards` (~line 2771) builds the on-field Mosje viewModel; `description` set at line 2790.
- `src/ui/modalManager.js` — `showDiceRoll` (lines ~71-160), `showCardPreview` (lines ~308-403, MOSJE branch ~334-343).

### Styles
- `styles/cards.css` — `uc-*` card template classes (on-field card).
- `styles/board.css` — `.dice-display`, `.modal-*`, `@keyframes dice-roll` (dice modal).
- `game.html` loads: main.css, board.css, cards.css.

### Project rules
- `CLAUDE.md` — one-function-per-file, small files, generic reusable UI; run `node --check` on UI files + `npm test` before commit.
</canonical_refs>

<specifics>
## Specific Ideas
- Trait pips compact form: e.g. `Phys ★★☆ · Ment ★★★` (reuse star fill/empty logic already in cardRenderer).
- Ability snippet: single-line truncation of `card.abilityDescription` (CSS clamp), full text on click.
- Dice face: CSS pip layout (1–6) is fine; the ticking animation can cycle random faces, then settle on the final face, then reveal result.
- Keep the dice modal as a single reusable function — do not fork into success/fail variants.
</specifics>

<deferred>
## Deferred Ideas
- Generic hover-detail view for all card types (separate `feature/card-hover-detail` branch).
- Enriching opponent Mosjes (explicitly own-only this phase).
</deferred>

---

*Phase: 32-onfield-mosje-info-dice-modal*
*Context gathered: 2026-06-14 via direct feedback + AskUserQuestion*
