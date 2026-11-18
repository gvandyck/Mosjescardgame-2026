// cardSteps - data only: card id -> the list of steps the generic handler (engine/steps/runCardSteps.js) runs, in order.
// Step fields:
//   do          'gainMp' | 'drawCards' | 'power' | 'questDie'  (an unknown name throws)
//   amount      gainMp: MP; power: Power; questDie: dice (negative = fewer dice)
//   count       drawCards: cards to draw
//   duration    power: 'thisTurn' | 'untilEndOfYourNextTurn'
//   lasts       questDie: 'thisTurn' (default) | 'untilUsed'
//   on          questDie: 'picked' binds the die bonus to the picked Mosje (default: any Mosje)
//   comboAmount amount used instead of `amount` when the card is activated as a Combo
//   friendAmount { friends: [names], amount } amount used when the picked Mosje is one of those friends
//   onlyIf      { friendOnField: [names] } a Mosje of that friend is on the activator's field
//               { pickedFriend: [names] }  the picked Mosje is one of those friends
//               { combo: true }            the card is activated as a Combo
// The picked Mosje is ctx.costPaidBy, else ctx.attachedTo, else the own-Mosje pick of the card.
export const CARD_STEPS = {
	piecie_kannetje_melk: [{ do: 'gainMp', amount: 25 }],
	piecie_super_saiyan_mos: [{ do: 'power', amount: 30, duration: 'thisTurn' }],
};
