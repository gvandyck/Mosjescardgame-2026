# Obby Card Game 2.0 — Personal Quest Rework (prompt for a new chat)

Paste the block below into a new chat in the "Mosjes card game" project.

```
Rework all Personal Quest (PQ) cards for Obby Card Game 2.0 (MOSJES).

Read first (project docs): "Rules and Decisions", "Card Design Spec", "Card Design Lock". Card data: GitHub repo gvandyck/mosjescardgame-2026, branch obby-2.0, src/data (Mosjes, Piecies, Snelle, Places, Quests; old personal Quests like Kickboxing Bootcamp are candidates). Visual reference: canvas "Obby Card Game 2.0 · Final Card Designs", board 03.

Current rules (ruled 30–31 Oct 2026):
- One Mosje card per Mosje with a level strip (LV1–3 Power + traits); level is a marker; level up automatic at 100 MP.
- Win = a Level 3 Mosje completes a Personal Quest card. PQs are their own cards in the deck (gold line), played from hand as that Mosje's action.
- PQs are type-locked: left side label FIGHTING / DIGITAL / ARTISTIC ONLY.
- Fail: the cards it required are discarded; the PQ goes back into the deck, deck reshuffled. Every deck has at least 1 PQ.
- PQ rarity is spread ★ to ★★★★★ (easy = common, hard/flashy = rare).
- Keywords, bold, one per line, in this order: Needs: (condition) → Pay: (cost) → Roll: (dice). Top-left shows "3 LEVEL"; footer WIN THE GAME / FAIL · SHUFFLE IN.
- Current drafts: Title Fight (Fighting: Needs De Box or Boxing Ring in play + Boxing Gloves ready; no roll), Cat Sanctuary (Fighting: Needs Bowie & Stormey ready; Pay discard 2 FOOD Piecies; Roll 1 die 4+), LAN Legend (Digital: Needs 2 GEAR Piecies ready; Roll 1 die per Technical ★, two 5+).

Goal:
1. Every Mosje gets its own PQ, themed on that Mosje (its story, type and strongest traits). Because PQs are type-locked, any Mosje of that type can still use it, but it is designed around one Mosje and works best for them (e.g. the Roll uses that Mosje's top trait).
2. Make all PQs consistent with each other: same keyword order, similar length (max ~3 short lines), comparable difficulty per rarity, every requirement meaningful and matching the PQ name (no flavour-only steps).
3. Balance: each PQ should take setup over a few turns, be disruptable by the opponent, and not be winnable on turn 1–3. Give a difficulty/rarity per PQ and a short why.
4. Where a PQ needs a card that doesn't exist yet, propose new Places / Piecies (name, type/tag, cost, rarity, short effect that is also useful outside the PQ) based on our friend group's places, pets and items. Mark them NEW.

Output: a table of all PQs (Mosje, type, name, rarity, Needs / Pay / Roll, why) + the list of NEW cards, then save it as the project doc "Obby Card Game 2.0 - Personal Quest List.md". Ask me all your questions as AskUserQuestion prompts, before writing the full list.
```
