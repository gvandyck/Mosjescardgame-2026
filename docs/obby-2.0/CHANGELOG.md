# Obby Card Game 2.0 — Changelog

One entry per version, newest first, in plain words. The version is shown in the lobby and on the game page; use it when you report a bug. Every version that goes live on https://eightytwenty.nl/obbycardgame2/ also gets a git tag with the same name.

## Unreleased — 2.0-A.14
The 15 Nov design update. Filled in as the phases land; nothing here is live yet.

**For the player**
- Three new 40-card starter decks: Physical, Digital, Creative. The lobby offers these three; in Play vs Bot you pick which Mosje starts
- You win by completing a Personal Quest with a Level 3 Mosje. The card shows Needs / Pay / Roll; tap it to play it on a Level 3 Mosje, and it says why when it can't be played
- Gear, pets and The Protector attach to a Mosje (max 2) and show on its tile
- The attack preview shows the type bonus (+10) and the Resilient reduction before you confirm
- Card faces are all text, with the new names; effects that last a turn show as tags on the Mosje
- Card choices show the cards themselves, with a "leave it" button where the card allows a no
- The game-over screen names the winning Personal Quest, the Mosje and the dice
- Phone layout (made for a phone in Android Chrome): board, hand, card sheet, attack preview and game over fit the screen; long press opens a card; Back asks before leaving a game
- The bot plays towards a Personal Quest: it grows one Mosje, keeps the cards the quest names and attempts it when it can. It also plays Punto Banco now. In 90 bot-vs-bot games 6 ended by Personal Quest, the rest by knockout
- (fix) A game against the bot no longer freezes on "Bot's turn" when the bot wins the opening die. The live `2.0-A.3` has the same code (the opening die came in Phase 55), so there about half of the bot games freeze at the start
- (fix) Card texts with a bold lead ("Attach:", "Combo:", "Discarded:", "Needs:") no longer show the two stars around it on the card face and in the detail view
- (fix) End Turn came back up to 1.5 seconds before your turn had really started (right after the bot's last move). A click in that gap ended a turn that had not begun and started two bot turns at once. Your turn now starts in the same instant. The live `2.0-A.3` has this too
- (fix) The bot no longer spends 2 Energy on Rebouleh when none of its Mosjes used an ability. It did that every turn it could, so in a long game it never had the Energy to summon another Mosje. When it does play Rebouleh it now uses the ability a second time
- (fix) The hand viewer row shows "Varkenspootjes · Piecie" (was "VarkenspootjesPIECIE")

**Rules / cards:** the 15 Nov design for the rules and the three starter decks (`docs/obby-2.0/handover/rules.md`, `card-list.md`). Booster cards are unchanged and not final.
- Win: a Level 3 Mosje completes a Personal Quest (type-locked; the Mosje must have started your turn at Level 3). "Hold Level 3 until your next turn" is gone. A failed attempt discards the Piecies under Needs and the cards under Pay; the quest goes back into the deck
- Types are Physical / Digital / Creative; attacking the type you beat gives +10 Power; Resilient takes 5 off per star (minimum 5)
- Level-up resets MP to 10 (was 0)
- Attachments: max 2 per Mosje (Jeffrey 3); attached gear counts as ready gear
- 26 Mosjes with the new kits; all starter card texts are the 14 Nov wording
- Calls Claude made where the design left a gap are in `rules.md` §15, for Gandalf to review
**Phase:** 68–74 (milestone v2.1)

## 2.0-A.4 to 2.0-A.13 — never live
Phone-layout builds (Phase 65, Mobile Play) that existed only on Gandalf's computer. The work is parked on the branch `ui/mobile-play-65` and will be picked up after the design update. These numbers are skipped on the live site.

## 2.0-A.3 — 2026-10-28
**For the player**
- When you raise or drag a Snelle, the Piecie slot it will fill is marked with the gold "Place here" frame

**Rules / cards:** no changes.
**Phase:** 64.1 (plan 03)

## 2.0-A.2 — 2026-10-28
**For the player**
- A gold "Place here" marker shows the slot a raised or dragged Mosje or Piecie will fill
- Empty slots are easier to see, and the next free slot is marked
- Board tiles, piles, count badges and shadows are no longer cut off at the edges; End Turn no longer touches the edge

**Rules / cards:** no changes.
**Phase:** 64.1 (plans 01–02)

## 2.0-A.1 — 2026-10-27
**For the player**
- First online build of Obby Card Game 2.0, on its own address
- Lobby with two modes: Play vs Bot and Watch Bots, each with the 3 Example Decks
- A full game on the 10 Oct rules: Energy, Levels 1–3, attacks, the three Quest stacks, Piecies, Snelle and Places
- The new card faces, the tap-first board and the game-over screen

**Rules / cards:** the 10 Oct design, all 183 cards; win by holding Level 3 until your next turn.
**Phase:** 53–64 (milestone v2.0, slice A)
