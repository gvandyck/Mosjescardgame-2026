// guardBackNavigation.js — the Back guard of a running phone game (72.1-10, D-04). arm() pushes ONE history state { obbyGame: true },
// so the first Back (Android edge swipe, Back button, history.back) only pops that state. While isActive() is true a popstate puts the
// guard state back and asks onBack(): 'leave' releases the guard and leaves the page (go(-2): past the re-pushed guard and the game entry), anything else keeps the player in the game.
// Only a boolean is stored in history; release() never touches history. `win` is injected so the logic runs without a DOM.
export function guardBackNavigation({ win, isActive, onBack }) {
	let armed = false;
	let asking = false;

	async function onPop() {
		if (!armed || !isActive()) return;
		win.history.pushState({ obbyGame: true }, '');
		if (asking) return;
		asking = true;
		let choice;
		try { choice = await onBack(); } finally { asking = false; }
		if (choice === 'leave') {
			release();
			win.history.go(-2); // the popped game entry plus our re-pushed guard: one traversal lands on the page before the game
		}
	}

	function arm() {
		if (armed) return;
		armed = true;
		win.history.pushState({ obbyGame: true }, '');
		win.addEventListener('popstate', onPop);
	}

	function release() {
		armed = false;
		win.removeEventListener('popstate', onPop);
	}

	// After game over: stop asking, but our guard entry is still on top of the game entry, so the first Back would only land on the
	// same page. Pass that one Back straight through so it leaves like on a desktop.
	function finish() {
		const wasArmed = armed;
		release();
		if (!wasArmed) return;
		const pass = () => { win.removeEventListener('popstate', pass); win.history.back(); };
		win.addEventListener('popstate', pass);
	}

	return { arm, release, finish };
}
