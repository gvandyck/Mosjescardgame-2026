// bindRadioGroup.js — radio semantics for a group of <button role="radio"> (D-07, D-40).
// One click and one keydown listener on the group. Roving tabindex: the checked radio has tabindex 0, the rest -1.
// Arrow keys / Home / End move focus AND select (WAI-ARIA radio group); Enter and Space work through the native button click.
// onSelect(choiceId) fires only when the checked radio actually changed.
const MOVE_KEYS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export function bindRadioGroup(group, { onSelect } = {}) {
	const radios = () => Array.from(group.querySelectorAll('[role="radio"]'));

	const select = button => {
		const changed = button.getAttribute('aria-checked') !== 'true';
		for (const radio of radios()) {
			const on = radio === button;
			radio.setAttribute('aria-checked', on ? 'true' : 'false');
			radio.tabIndex = on ? 0 : -1;
		}
		if (changed && onSelect) onSelect(button.dataset.choiceId);
	};

	group.addEventListener('click', event => {
		const button = event.target.closest('[role="radio"]');
		if (button && group.contains(button)) select(button);
	});

	group.addEventListener('keydown', event => {
		const all = radios();
		if (all.length === 0) return;
		const current = event.target.closest('[role="radio"]');
		const index = Math.max(0, all.indexOf(current));
		let next = null;
		if (event.key in MOVE_KEYS) next = all[(index + MOVE_KEYS[event.key] + all.length) % all.length];
		else if (event.key === 'Home') next = all[0];
		else if (event.key === 'End') next = all[all.length - 1];
		if (!next) return;
		event.preventDefault();
		next.focus();
		select(next);
	});
}
