// piecieRerollGrant - a Piecie lets its owner reroll Quest dice at the after-roll pause. Grants live on the player
// (player.rerollGrants): { scope: 'ownQuest' | 'anyQuest', uses, turnKey } - expire with the turn (expireThisTurnEffects).
// scope ownQuest = only the owner's own Quest roll (and only the Quest that follows); anyQuest = either player's roll.
// Finding / using a grant: findRerollGrant.js, useRerollGrant.js.
export function addRerollGrant(player, { scope, uses = 1, turnKey }) {
	player.rerollGrants = [...(player.rerollGrants || []), { scope, uses, turnKey }];
	return player;
}
