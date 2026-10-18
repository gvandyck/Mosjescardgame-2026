// asBotView - the first statement of every state-taking chooser (BOT-04): project onto the table view of `botId`,
// unless the state already IS that seat's view (nested chooser calls, engine dry-runs that clone a view).
import { getBotView } from './getBotView.js';

export function asBotView(state, botId) {
	return state?.__botView === botId ? state : getBotView(state, botId);
}
