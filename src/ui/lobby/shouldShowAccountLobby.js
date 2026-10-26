// shouldShowAccountLobby.js — true when the hidden V4 account lobby should run instead of the 2.0 lobby (D-13).
// The three test params are the existing V4 test hooks; the accounts flag is how Phase 67 turns it on for real.
import { FEATURES } from '../../config/features.js';

const ACCOUNT_LOBBY_TEST_PARAMS = ['testOnboarding', 'testActiveDeck', 'testGuestDeck'];

export function shouldShowAccountLobby(params, features = FEATURES) {
	if (features.accounts === true) return true;
	return ACCOUNT_LOBBY_TEST_PARAMS.some(name => params.get(name) === '1');
}
