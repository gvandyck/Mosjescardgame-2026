# CHANGELOG

All notable changes to MOSJES are recorded here.
Format: `[version] — date — what changed`

---

## [Unreleased] — 2026-04-19

### Added
- Phase 8 Rule 1: Affoe TARGETING tag + `resolveTargetingCard` flow — drain target opponent Mosje, boost selected own Mosje
- Phase 8 Rule 1: `showTargetSelector` modal with CSS styling (`.target-grid`, `.target-option`)
- Phase 8 Rule 1: Regression test — Affoe drains selected slot, boosts selected own slot via `_pendingTargets`
- Phase 8 Rule 3: `activeQuest` set on `gameState` before dice roll and cleared after resolution
- Phase 8 Rule 3: `syncPush()` on both set and clear so opponent sees active quest panel in real time
- Phase 8 Rule 3: Active quest panel displays quest name, type, attacker role, Mosje MP, and success/fail stakes
- Active quest panel CSS (`.active-quest-panel`, `.quest-badge`, `.quest-name`, `.quest-progress`, `.quest-dice`)

### Fixed
- Kannetje Melk and Snelle Jensen now show own-Mosje target selector when player has 2+ active Mosjes
- `playSnellie` no longer crashes when `discard` is undefined on a synced state
- Each player now sees their own hand (was always showing player_1's hand)
- Multiplayer transport migrated from Firestore to Firebase Realtime Database (fixes `ERR_BLOCKED_BY_CLIENT` from ad blockers)
- RTDB `update()` now uses nested object instead of dotted key paths
- `buildPlayerRecord` omits `uid` field when undefined (RTDB rejects `undefined` values)

---

## [0.3.0] — 2026-04

### Added
- Full starter deck implementation: all Piecie, Snelle Piecie, Place, Quest, and Mosje cards
- Quest system: General and Personal quest flows with dice roll modal
- Turn enforcement: `canPlayerActNow` guard, Snelle Piecies playable during opponent's turn
- Mosje abilities: DJ 80/20, Binti, Coert
- Reactive Snelle flags: Counter Strikka, Perfect Dodge, Not Today!, The Protector, Drain Reversal, Je Weet Niet, Dubbele Temminks, Frenssen, Blensen
- Win conditions: Level 3, Knockout, Quest Master (7 quests), Momentum Domination (250+ MP)
- 88 automated tests covering all card effects and engine rules

---

## [0.2.0] — 2026-03

### Added
- Firebase multiplayer: room create/join via Realtime Database
- Anonymous auth via Firebase Authentication
- Real-time state sync with `onValue` listener
- Lobby screen: enter name, pick deck, create or join room with room code

---

## [0.1.0] — 2026-03

### Added
- Initial project structure (HTML, CSS, JS — no frameworks)
- Game board layout with opponent/center/player zones
- Card renderer, hand renderer, board renderer
- Basic turn flow: draw → main → quest → end
- `.gitignore`, `README.md`, `firebase-config.EXAMPLE.js`
