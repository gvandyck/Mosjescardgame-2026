# Phase 6: Integration & Launch — Context

**Phase:** 06-integration  
**Gathered:** 2026-04-28  
**Status:** Ready for execution (final phase)

---

## Phase Boundary

Connect all implemented cards into playable decks. Enable both Physical Force and Artistic Rhythm in lobby, verify full game loop works without crashes.

**What Success Looks Like:**
- Both Physical Force and Artistic Rhythm decks appear in lobby dropdown
- Player can select either deck and start a game
- Full game simulation completes without crashes
- All 582 tests still pass (zero regressions)
- Both decks are balanced and playable

**Out of Scope:**
- Card balance adjustments
- New UI components
- Firebase multiplayer (Phase 11+)

---

## Current State

### ✅ Already Complete
- All 26 Piecies implemented + tested
- All 6 Snelle Piecies implemented + tested
- All 5 Places implemented + tested
- All 14 Quests implemented + tested
- Deck configurations defined in starter-decks.ts
- Card registry fully populated
- 582 tests passing (zero failures)

### ⏳ Remaining Work
- Add Physical Force + Artistic Rhythm to lobby dropdown (index.html)
- Update main.js to handle new deck options
- Run full deck simulation (100 games per deck)
- Verify no crashes or regressions

---

## File Locations

### Lobby UI (needs update)
- `index.html` — Lines 24-27, deck-select dropdown
- `src/main.js` — Deck initialization logic

### Deck Configuration (already done)
- `src/simulation/starter-decks.ts` — PHYSICAL_FORCE, ARTISTIC_RHYTHM exports
- `src/cards/registry/` — Card registry (auto-populated)

### Simulation (for verification)
- `src/simulation/run-simulation.ts` — Simulation runner
- `npm test` — Full test suite

---

## Success Criteria

✅ Physical Force deck option appears in lobby  
✅ Artistic Rhythm deck option appears in lobby  
✅ Player can select either deck and enter game  
✅ Simulation runs 100 games without crashes  
✅ All 582 tests still pass  
✅ No MP calculation errors  
✅ No card registry conflicts  

---

*Context gathered: 2026-04-28*  
*Status: Ready for implementation*
