// buildSegmentedControl.js — a row of big radio buttons for a short list of options (the mode switch, Normal / Fast).
// Same radio semantics as the deck tiles (bindRadioGroup). Every string goes in through textContent, never innerHTML.
import { bindRadioGroup } from './bindRadioGroup.js';

export function buildSegmentedControl(options, { selectedId, onSelect, label, picker } = {}) {
	const group = document.createElement('div');
	group.className = 'segmented';
	group.setAttribute('role', 'radiogroup');
	group.setAttribute('aria-label', label ?? '');
	group.dataset.picker = picker;
	const focusIndex = Math.max(0, options.findIndex(option => option.id === selectedId));

	options.forEach((option, index) => {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'segmented__option';
		button.setAttribute('role', 'radio');
		button.setAttribute('aria-checked', option.id === selectedId ? 'true' : 'false');
		button.tabIndex = index === focusIndex ? 0 : -1;
		button.dataset.choiceId = option.id;
		const text = document.createElement('span');
		text.className = 'segmented__label';
		text.textContent = option.label;
		button.append(text);
		if (option.hint) {
			const hint = document.createElement('span');
			hint.className = 'segmented__hint';
			hint.textContent = option.hint;
			button.append(hint);
		}
		group.append(button);
	});

	bindRadioGroup(group, { onSelect });
	return group;
}
