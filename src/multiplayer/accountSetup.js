// accountSetup.js — One-time initialisation for new accounts.
// Called after every sign-in; the setupComplete flag prevents it running twice.
//
// On first login a player receives:
//   - A wallet seeded at 0 Munten
//   - The Digital Control starter deck cards added to their collection

import { isFirebaseReady, getRtdb } from '../firebase.js';
import { seedCollection } from './collectionStore.js';

console.log('[SETUP] accountSetup.js loaded');

// Browser-side card IDs for the Digital Control starter deck (unique cards only).
// Derived from starter-decks.ts mapped to src/data/* id fields.
const DIGITAL_CONTROL_STARTER_CARDS = [
	// Mosjes
	'mosje_martin_historian',
	'mosje_ronald_chef',
	// Piecies
	'piecie_kannetje_melk',
	'piecie_pot_of_weed',
	'piecie_bagga_of_greed',
	'piecie_keyboard',
	'piecie_mouse',
	'piecie_controller',
	'piecie_afblijven',
	'piecie_quest_prep',      // Dubbele Dosis
	'piecie_mp_amplifier',
	'piecie_f1_telemetry',
	'piecie_redbull',
	'piecie_energy_surge',    // Shoettoe
	'piecie_warm_kannetje_melk',
	// Snelle Piecies
	'snelle_counter_strikka',
	'snelle_lucky_coin',
	'snelle_sleutelpuntje',
	// Places
	'place_quest_haven',
	'place_bank_chilling',
	// Quests
	'quest_debug_system',
	'quest_hack_mainframe',
	'quest_precision_work',
	'quest_strategy_puzzle',
	'quest_master_plan',
	'quest_perfect_timing',
	'quest_speed_run',
	'quest_synergy_mastery',
];

async function getRtdbAPI() {
	const { ref, get, set } =
		await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
	return { ref, get, set };
}

// Call this after every successful sign-in.
// Resolves immediately if setup has already been completed for this account.
export async function initNewAccount(uid) {
	if (!uid) return;
	const ready = await isFirebaseReady();
	if (!ready) return;
	const db = getRtdb();
	const { ref, get, set } = await getRtdbAPI();

	// Check if already set up
	const flagRef = ref(db, `users/${uid}/setup/complete`);
	try {
		const snap = await get(flagRef);
		if (snap.val() === true) return;
	} catch (err) {
		console.warn('[SETUP] Could not check setup flag:', err?.code);
		return;
	}

	// Seed wallet (only if it doesn't exist yet)
	try {
		const walletSnap = await get(ref(db, `users/${uid}/wallet`));
		if (!walletSnap.exists()) {
			await set(ref(db, `users/${uid}/wallet`), {
				munten: 0,
				lifetimeEarned: 0,
				lastUpdated: Date.now(),
			});
		}
	} catch (err) {
		console.warn('[SETUP] Could not seed wallet:', err?.code);
	}

	// Seed collection with Digital Control starter cards
	await seedCollection(uid, DIGITAL_CONTROL_STARTER_CARDS);

	// Mark setup complete
	try {
		await set(flagRef, true);
		console.log('[SETUP] New account initialised for:', uid);
	} catch (err) {
		console.warn('[SETUP] Could not set setup flag:', err?.code);
	}
}
