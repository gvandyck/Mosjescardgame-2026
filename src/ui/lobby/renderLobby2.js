// renderLobby2.js — draw the 2.0 lobby into `root` from the current choices (D-02, D-06 to D-09).
// Mode switch on top, the pickers of that mode, one Start button. A mode change re-renders everything; a deck pick or a
// typed name only reports through onChange (the radiogroup updates itself), so keyboard focus and the caret stay put.
// Text goes in through textContent / .value only, never innerHTML with user data (T-64-12). Nothing is hover-only (D-40).
import { DEFAULT_PLAYER_NAME, PLAYER_NAME_MAX } from '../../config/lobbyModes.js';
import { buildDeckTiles } from './buildDeckTiles.js';
import { buildSegmentedControl } from './buildSegmentedControl.js';

const SPEED_OPTIONS = [
	{ id: 'normal', label: 'Normal' },
	{ id: 'fast', label: 'Fast' },
];

function makeGroup(title, control) {
	const section = document.createElement('section');
	section.className = 'lobby2__group';
	const heading = document.createElement('h2');
	heading.textContent = title;
	section.append(heading, control);
	return section;
}

function makeNameField(value, onInput) {
	const label = document.createElement('label');
	label.className = 'lobby2__name';
	label.htmlFor = 'lobby2-name';
	const caption = document.createElement('span');
	caption.textContent = 'Your name (optional)';
	const input = document.createElement('input');
	input.id = 'lobby2-name';
	input.type = 'text';
	input.maxLength = PLAYER_NAME_MAX;
	input.autocomplete = 'off';
	input.placeholder = DEFAULT_PLAYER_NAME;
	input.value = value;
	input.addEventListener('input', () => onInput(input.value));
	label.append(caption, input);
	return label;
}

function botRow(decks, { title, picker, selectedId, onSelect }) {
	return makeGroup(title, buildDeckTiles(decks, { selectedId, label: title, picker, includeRandom: true, compact: true, onSelect }));
}

export function renderLobby2(root, { state, decks, modes, onChange, onStart }) {
	root.replaceChildren();
	const modeControl = buildSegmentedControl(modes, {
		selectedId: state.mode, label: 'Game mode', picker: 'mode', onSelect: id => onChange({ mode: id }),
	});
	modeControl.classList.add('lobby2__modes');
	root.append(modeControl);

	if (state.mode === 'vsBot') {
		root.append(
			makeGroup('Your deck', buildDeckTiles(decks, {
				selectedId: state.deckChoice, label: 'Your deck', picker: 'player-deck', onSelect: id => onChange({ deckChoice: id }),
			})),
			botRow(decks, {
				title: 'Bot plays',
				picker: 'bot-deck',
				selectedId: state.botChoice,
				onSelect: id => onChange({ botChoice: id }),
			}),
			makeNameField(state.name, value => onChange({ name: value })),
		);
	} else if (state.mode === 'watchBots') {
		root.append(
			botRow(decks, {
				title: 'Bot 1 plays',
				picker: 'bot1-deck',
				selectedId: state.bot1Choice,
				onSelect: id => onChange({ bot1Choice: id }),
			}),
			botRow(decks, {
				title: 'Bot 2 plays',
				picker: 'bot2-deck',
				selectedId: state.bot2Choice,
				onSelect: id => onChange({ bot2Choice: id }),
			}),
			makeGroup('Speed', buildSegmentedControl(SPEED_OPTIONS, {
				selectedId: state.fast ? 'fast' : 'normal', label: 'Speed', picker: 'speed', onSelect: id => onChange({ fast: id === 'fast' }),
			})),
		);
	}

	const start = document.createElement('button');
	start.id = 'lobby2-start';
	start.className = 'lobby2__start';
	start.type = 'button';
	start.textContent = 'Start';
	start.addEventListener('click', () => onStart());
	root.append(start);
}
