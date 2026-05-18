// packOpeningOverlay.js — One-card-at-a-time booster pack reveal.
// Flow: card appears face-down → click to flip → Next/Done button → next card.

console.log('[UI] packOpeningOverlay.js loaded');

const TYPE_COLOUR = {
	MOSJE:         'var(--mosje-gold)',
	PIECIE:        'var(--piecie-blue)',
	SNELLE_PIECIE: 'var(--snelle-red)',
	PLACE:         'var(--place-green)',
	QUEST:         'var(--quest-purple)',
};
const TYPE_LABEL = {
	MOSJE: 'Mosje', PIECIE: 'Piecie', SNELLE_PIECIE: 'Snelle', PLACE: 'Place', QUEST: 'Quest',
};

function cssUrl(path) {
	return path.split('/').map(s => encodeURIComponent(s)).join('/');
}

export function showPackOpeningOverlay({ drawnCards, ownedBefore, newBalance, onClose }) {
	document.getElementById('pack-opening-overlay')?.remove();

	let index   = 0;
	let flipped = false;

	// ── Build overlay shell ───────────────────────────────────────────────────
	const overlay = document.createElement('div');
	overlay.id        = 'pack-opening-overlay';
	overlay.className = 'pack-opening-overlay';

	overlay.innerHTML = `
		<div class="pack-reveal-shell">
			<div class="pack-reveal-progress" id="pack-progress">1 / ${drawnCards.length}</div>

			<div class="pack-stage" id="pack-stage">
				<div class="pack-flipper" id="pack-flipper">
					<div class="pack-face pack-face--back">
						<div class="pfb-pattern"></div>
						<div class="pfb-logo">MOSJES</div>
					</div>
					<div class="pack-face pack-face--front" id="pack-front"></div>
				</div>
			</div>

			<p class="pack-hint" id="pack-hint">Click the card to reveal</p>

			<button class="pack-next-btn" id="pack-next-btn" hidden></button>

			<div class="pack-summary" id="pack-summary" hidden>
				<p class="pack-summary-label" id="pack-summary-label"></p>
				<p class="pack-opening-balance">Balance: <strong id="pack-balance-val"></strong></p>
				<div class="pack-opening-actions">
					<button class="reward-btn" id="pack-done-btn">Back to Store</button>
					<button class="reward-btn pack-btn--secondary" id="pack-to-builder">Deck Builder</button>
				</div>
			</div>
		</div>
	`;

	document.body.appendChild(overlay);
	requestAnimationFrame(() => overlay.classList.add('pack-opening-overlay--visible'));

	// ── Element refs ──────────────────────────────────────────────────────────
	const progress = overlay.querySelector('#pack-progress');
	const stage    = overlay.querySelector('#pack-stage');
	const flipper  = overlay.querySelector('#pack-flipper');
	const front    = overlay.querySelector('#pack-front');
	const hint     = overlay.querySelector('#pack-hint');
	const nextBtn  = overlay.querySelector('#pack-next-btn');
	const summary  = overlay.querySelector('#pack-summary');

	// ── Render one card's front face ──────────────────────────────────────────
	function renderFront(card, isNew) {
		const colour   = TYPE_COLOUR[card.cardType] || '#aaa';
		const label    = TYPE_LABEL[card.cardType]  || card.cardType;
		const hasArt   = card.artPath && !card.artPath.includes('placeholder');
		const artStyle = hasArt ? `style="background-image:url('${cssUrl(card.artPath)}')"` : '';
		const badge    = isNew
			? '<span class="pff-new">NEW</span>'
			: '<span class="pff-dupe">+1 copy</span>';

		// Small badge shown in the art zone top-left alongside the type label
		let subtypeBadge = '';
		if (card.cardType === 'SNELLE_PIECIE') {
			subtypeBadge = '<span class="pff-subtype-badge pff-subtype-badge--instant">⚡ INSTANT</span>';
		} else if (card.subtype) {
			subtypeBadge = `<span class="pff-subtype-badge">${card.subtype}</span>`;
		} else if (card.trigger) {
			subtypeBadge = `<span class="pff-subtype-badge">${card.trigger.replace(/_/g, ' ')}</span>`;
		} else if (card.category) {
			subtypeBadge = `<span class="pff-subtype-badge">${card.category}</span>`;
		}

		let bodyHTML = '';

		if (card.cardType === 'MOSJE') {
			const traits = card.traits
				? Object.entries(card.traits)
					.map(([k, v]) => `<span class="pff-trait">${k} ${'★'.repeat(v)}</span>`)
					.join('')
				: '';
			bodyHTML = `
				<div class="pff-name-row">
					<p class="pff-name">${card.name}</p>
					${card.rarity ? `<span class="pff-rarity">${card.rarity}</span>` : ''}
				</div>
				<p class="pff-meta">${card.subtype ? card.subtype + ' · ' : ''}Start MP: ${card.startMP ?? 0}</p>
				${traits ? `<div class="pff-traits">${traits}</div>` : ''}
				${card.abilityDescription ? `<p class="pff-ability">${card.abilityDescription}</p>` : ''}
				${card.flavourText ? `<p class="pff-flavour">"${card.flavourText}"</p>` : ''}
			`;
		} else if (card.cardType === 'PIECIE' || card.cardType === 'SNELLE_PIECIE') {
			const tags = card.tags?.map(t => `<span class="pff-tag">${t}</span>`).join('') || '';
			const req  = card.requirement && card.requirement !== 'any' ? card.requirement : null;
			bodyHTML = `
				<div class="pff-name-row">
					<p class="pff-name">${card.name}</p>
					${card.rarity ? `<span class="pff-rarity">${card.rarity}</span>` : ''}
				</div>
				${card.cardType === 'SNELLE_PIECIE'
					? '<p class="pff-meta pff-meta--instant">⚡ Instant Interrupt — play from hand at any time</p>'
					: ''}
				<div class="pff-cost-row">
					<span class="pff-cost-chip">${card.mpCost > 0 ? card.mpCost + ' MP' : 'Free'}</span>
					${req ? `<span class="pff-req-chip">Req: ${req}</span>` : ''}
				</div>
				${tags ? `<div class="pff-tags">${tags}</div>` : ''}
				${card.description ? `<p class="pff-ability">${card.description}</p>` : ''}
				${card.flavourText ? `<p class="pff-flavour">"${card.flavourText}"</p>` : ''}
			`;
		} else if (card.cardType === 'PLACE') {
			const good = card.goodFor?.length ? card.goodFor.join(', ') : null;
			const bad  = card.badFor?.length  ? card.badFor.join(', ')  : null;
			bodyHTML = `
				<div class="pff-name-row">
					<p class="pff-name">${card.name}</p>
					${card.rarity ? `<span class="pff-rarity">${card.rarity}</span>` : ''}
				</div>
				${card.trigger ? `<p class="pff-meta">Trigger: ${card.trigger.replace(/_/g, ' ')}</p>` : ''}
				${card.description ? `<p class="pff-ability">${card.description}</p>` : ''}
				${good ? `<p class="pff-place-good">▲ Good for: ${good}</p>` : ''}
				${bad  ? `<p class="pff-place-bad">▼ Bad for: ${bad}</p>`   : ''}
				${card.flavourText ? `<p class="pff-flavour">"${card.flavourText}"</p>` : ''}
			`;
		} else if (card.cardType === 'QUEST') {
			bodyHTML = `
				<div class="pff-name-row">
					<p class="pff-name">${card.name}</p>
					${card.rarity ? `<span class="pff-rarity">${card.rarity}</span>` : ''}
				</div>
				<p class="pff-meta">${card.category ? card.category + ' · ' : ''}${card.difficulty || ''}</p>
				${card.requirementDescription ? `<p class="pff-ability">${card.requirementDescription}</p>` : ''}
				<div class="pff-quest-outcomes">
					${card.successMP != null ? `<span class="pff-outcome pff-outcome--win">✓ +${card.successMP} MP</span>` : ''}
					${card.failMP    != null ? `<span class="pff-outcome pff-outcome--lose">✗ ${card.failMP} MP</span>` : ''}
				</div>
				${card.description ? `<p class="pff-ability">${card.description}</p>` : ''}
				${card.flavourText ? `<p class="pff-flavour">"${card.flavourText}"</p>` : ''}
			`;
		}

		front.style.borderColor = colour;
		front.innerHTML = `
			<div class="pff-art" ${artStyle}>
				<div class="pff-art-overlay"></div>
				<div class="pff-art-header">
					<div class="pff-art-header-left">
						<span class="pff-type" style="color:${colour}">${label}</span>
						${subtypeBadge}
					</div>
					${badge}
				</div>
			</div>
			<div class="pff-body">
				${bodyHTML}
			</div>
		`;
	}

	// ── Show card at current index, face-down ─────────────────────────────────
	function showCard(i, animate) {
		flipped = false;
		const card  = drawnCards[i];
		const isNew = !ownedBefore.has(card.id);

		progress.textContent = `${i + 1} / ${drawnCards.length}`;
		renderFront(card, isNew);

		// Reset instantly — suppress the CSS flip-back transition so the
		// new card's front face is never visible before the player clicks.
		flipper.style.transition = 'none';
		flipper.classList.remove('is-flipped');
		void flipper.offsetWidth; // force reflow before restoring transition
		flipper.style.transition = '';

		nextBtn.hidden = true;
		hint.hidden    = false;

		if (animate) {
			// Slide in from right
			stage.classList.remove('stage-exit');
			stage.classList.add('stage-enter');
			setTimeout(() => stage.classList.remove('stage-enter'), 350);
		}
	}

	// ── Flip click ────────────────────────────────────────────────────────────
	flipper.addEventListener('click', () => {
		if (flipped) return;
		flipped = true;
		flipper.classList.add('is-flipped');
		hint.hidden = true;

		const isLast = index === drawnCards.length - 1;
		nextBtn.textContent = isLast ? 'Done ✓' : 'Next Card →';
		nextBtn.hidden = false;
	});

	// ── Next / Done ───────────────────────────────────────────────────────────
	nextBtn.addEventListener('click', () => {
		if (index === drawnCards.length - 1) {
			showSummary();
			return;
		}

		// Exit current card
		stage.classList.add('stage-exit');
		setTimeout(() => {
			index++;
			showCard(index, true);
		}, 250);
	});

	// ── Summary screen ────────────────────────────────────────────────────────
	function showSummary() {
		stage.hidden    = true;
		progress.hidden = true;
		hint.hidden     = true;
		nextBtn.hidden  = true;
		summary.hidden  = false;

		const newCount = drawnCards.filter(c => !ownedBefore.has(c.id)).length;
		const label = newCount === drawnCards.length ? 'All new cards!'
			: newCount > 0 ? `${newCount} new card${newCount > 1 ? 's' : ''}!`
			: 'All duplicates — keep collecting!';

		overlay.querySelector('#pack-summary-label').textContent = label;
		overlay.querySelector('#pack-balance-val').textContent =
			Number(newBalance).toLocaleString('nl-NL') + ' Munten';
	}

	// ── Action buttons ────────────────────────────────────────────────────────
	overlay.querySelector('#pack-done-btn').addEventListener('click', () => {
		overlay.remove();
		if (onClose) onClose();
	});
	overlay.querySelector('#pack-to-builder').addEventListener('click', () => {
		window.location.href = './deck-builder.html';
	});

	// ── Start with card 0 ─────────────────────────────────────────────────────
	showCard(0, false);
}
