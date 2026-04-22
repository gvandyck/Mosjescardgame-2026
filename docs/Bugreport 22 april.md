1. **A General bug:** When attempting a Quest (Personal and General) a Player should CHOOSE which Mosje (on their side of the field) will be Attempting the Quest. This way, its easier for the System to resolve the Quest’s effects to the correct Mosje. Picking a Mosje to attempt a Quest adds tension since the Player does not know if their Mosje will succeed or fail.  
2. **Quest Haven**: ''Description: On Quest: All Quest rewards \+10 MP. Complete 2 Quests in one turn for \+25 bonus MP.'' a player can only do 1 quest per turn, so the ''+25 MP Bonus is impossible to obtain. Change effect+description: WHILE this Place is active, players can attempt TWO Quests per turn (giving them \+25 bonus when they SOLVE/Succeed their 2nd Quest).  
   1. Check if other cards also have a ‘during your turn’-effect so we can implement a function for this type of card mechanic.  
3. **Momentum master General Quest**: it seems the Quest uses 2 different effects (A & b), please validate.  
   1.    requirementDescription: "Must have used 2+ Piecies this turn. Roll 3+"  
   2. // "Active Mosje must have between 80 and 100 MP." Both bounds enforced.’  
4. **Lucky Coin**: does not do anything while being registered as resolved effect, see battle log:  
   1. Battle log: 🎯 Opponent acted — now first player's turn.  
      ℹ️ \- You: cards in discard \+1 (now 1).  
      ℹ️ \- You: cards in hand \-1 (now 4).  
      ℹ️ Lucky Coin instant activation:  
      ℹ️ Effect: Play as interrupt. Flip a coin: heads \= reroll your last die; tails \= nothing.  
      💥 Played Lucky Coin (instant).  
   2. FIX: We should rewrite Lucky Coin to not be an ‘’after effect (re rolling)’’ since this seems to be tricky to implement in code. Switch effect to ‘Flip a coin: heads \= reroll any dice THIS TURN (so keep Lucky Coin’’s effect active during the Players’ turn- this effect affects General and Personal Quests \- whenever a Die is rolled, add Button ‘’reroll dice’’ per new card’s effect); tails \= select a Mosje on YOUR side of the field: deal 10 MP damage to that Mosje:’  
   3. This fix means Lucky Coin is now a ‘’one turn effect’’ for your own Mosjes, making it a good card to prepare yourself when attempting Quests (since you get a ‘’lucky’’ second go when the dice don't roll in your favor), this also means after the first dice roll, the system should allow/enable a second dice roll before resolving the Quest’s effects.  
5. **Kannetje Melk**: When activating, the player should be able to select which Active Mosje gets the \+MP added instead of the system automatically adding the MP to a mosje (just copy/clone the mechanic from Jensen Snelle Piecie: Choose your Mosje to receive Kannetje Melk MP) \- use the same kind of modal setup as ‘Jensen’.  
   1. Battlelog when activating Kannetje Melk Piecie:  
      1. ℹ️ Kannetje Melk activation:  
         ℹ️ Gain 25 MP to your active Mosje. (50 MP with Coert/Binti synergy)  
         💥 Activated Kannetje Melk.  
         ℹ️ \- You: cards in discard \+1 (now 1).  
         ℹ️ \- You \[West\] Sr.Tactical: \+25 MP (now 110).  
6. **Perfect Sync (personal Quest)**: Should be able to select WHICH mosje receives the MP (same problem as Kannetje melk?) \- use the same kind of modal setup as ‘Jensen’.  
   1. Battle log: 🎯 Opponent acted — now first player's turn.  
      💥 Perfect Sync: Success → \+70 MP  
      🎯 Opponent acted — now first player's turn.  
      🎯 first player is attempting Personal Quest: Perfect Sync  
      🎯 Opponent acted — now first player's turn.  
7. **Affoe**:Should be able to select WHICH mosje receives the MP (same problem as Kannetje melk and perfect Sync \- not being able to select a Mosje to receive  card-effect) \- use the same kind of modal setup as ‘Jensen’.  
   1. Battle log: 🎯 Opponent acted — now first player's turn.  
      ℹ️ \- second player \[Coert\] The Hawaiian Tech Savant: \-15 MP (now 15).  
      ℹ️ \- You: cards in discard \+1 (now 7).  
      ℹ️ \- You \[West\] Sr.Tactical: \+10 MP (now 40).  
      ℹ️ Affoe activation:  
      ℹ️ Target opponent loses 15 MP. You gain 10 MP.  
      💥 Activated Affoe.  
8. **Place Bank Chilling**: Drawing 2 cards (example; Gun een Piece lets player draw 2 cards in one action) while Senor West (Mental ★★+) is active with should add \+15 MP to Senor Martin, as per ‘’Place Bank Chilling’’ card effect (On Draw: Mental ★★+ Mosjes gain \+15 MP when drawing 2 or more cards in one action).  
   1. Battle log: 🎯 Opponent acted — now first player's turn.  
      ℹ️ \- You: cards in discard \+1 (now 5).  
      ℹ️ \- You: cards in deck \-2 (now 1).  
      ℹ️ \- You: cards in hand \+2 (now 7).  
      ℹ️ Gun een Piece activation:  
      ℹ️ Draw 2 cards from your deck.  
      💥 Activated Gun een Piece.  
   2. As you can see in Battle log, the Place’s effect is not activated and no Mosje with sufficient Mental level received the \+15 MP Bonus.  
   3. I do see the cards effect being displayed on the UI (turn-label i think displays it for a few seconds), so it seems the system interprets the card as draw phase for a player, instead of ANY draw action: On Draw: Mental ★★+ Mosjes gain \+15 MP when drawing 2 or more cards in one action.  
9. **\[West\] Sr.Tactical ability**: it seems a player gets \+20 MP instead of the described \+10 MP (correct draw 2 and gain 10 MP).   
   1. Also; Explain why the Player can't Name the Card-type and reveal the top of their deck (Oh btw; you can ONLY apply this effect to your own card-stack, not your opponents Deck \- that would be too strong of an effect)? The effect clearly states ‘’(Calculated Guess: Name a card type and reveal top of chosen(\> this should be YOUR OWN\<) deck) \- has this mechanic been implemented or not?  
   2. Battle log: 🎯 Opponent acted — now first player's turn.  
      ℹ️ \- You \[West\] Sr.Tactical: \+20 MP (now 80).  
      ℹ️ \[West\] Sr.Tactical ability:  
      ℹ️ Effect: Calculated Guess: Name a card type and reveal top of chosen  
      deck; correct draw 2 and gain 10 MP, wrong lose 10 MP.  
      💥 Used ability: \[West\] Sr.Tactical.  
10. **\[Coert\] The Hawaiian Tech Savant:** Extra Resources: During Draw Phase pay 10 MP per use to draw 1 additional card with no per-turn limit.  
    1. Remove requirement ‘’During draw phase’ , Players should be able to activate Ability during their entire turn.  
    2. When Mosjes have insufficient MP, disable the ‘’use ability’’ button until Mosje has sufficient MP to pay the Ability activation cost.  
    3. It seems there is a hard limit to only draw 1 card per turn \- this Mosjes ability should ignore those limits (explicably stated ‘draw 1 additional card with no per-turn limit.’)  
11. **Dubbele Dosis \+ Build a Gadget Quest**: Dubbele Dosis Piecie does not add \+2 to dice roll result when attempting Build a Gadget Quest. It also does not check current mosje-traits for potential bonuses. Make sure selecting a Mosje to attempt Quests proceeds the Quest activation/resolve so the system knows which Mosje to check for traits/bonuses.  
    1. Battle log: 🎯 Opponent acted — now first player's turn.  
       ℹ️ \- You \[West\] Sr.Tactical: level 2 \-\> 3\.  
       ℹ️ \- You \[West\] Sr.Tactical: \-55 MP (now 50).  
       ℹ️ Build a Gadget resolution:  
       💥 Build a Gadget: Success → \+45 MP  
       🎯 Opponent acted — now first player's turn.  
       ℹ️ Effect: Success: \+45 MP. Failure: \-15 MP.  
       🎯 first player is attempting General Quest: Build a Gadget  
       🎯 Opponent acted — now first player's turn.  
       ℹ️ \- You: cards in discard \+1 (now 10).  
       ℹ️ Dubbele Dosis activation:  
       ℹ️ Your next Quest roll this turn gets \+2 added to the dice result.  
       💥 Activated Dubbele Dosis.  
12. **General Quest Geen raad? Vraag Aad\!**: What are the win/fail conditions for this Quest?   
    1. First off; change “name a card’” to “Name a Card-TYPE (Piecie, Snelle Piecie, Place, Personal Quest or Mosje” to make the Quest a bit easier for the System to handle.  
    2. Then the player attempting the Quest has to select one card in the opponent's hand (do not reveal WHAT card it is, just have them select one).   
    3. Then display a modal where the Player has to pick a Card-TYPE and click a ‘’guess’ Button to start the Quest resolving effect.The system has to check whether the Card-TYPE matches the Selected Card in the opponent's hand.  
    4. If the Player guessed Correct: \+50 MP. Wrong: \-25 MP.   
    5. Remove the Roll needed: 4+ to succeed. \- guessing the card is hard enough  
    6. Hide the duplicate (the UI displays the following: Name a card in opponent's hand. Correct: \+50 MP. Wrong: \-25 MP Name a card in opponent's hand. Correct: \+50 MP. Wrong: \-25 MP.) text from the UI.  
    7. Also, does the effect work in multiplayer ‘After resolving: each player who took MP damage this turn may discard 1 card to regain 40 MP.’? Explain how this could be implemented. It requires a check AFTER a Quest has been resolved and an modal/selector for ALL players Who took MP Damage. Is this already functional?   
13. 