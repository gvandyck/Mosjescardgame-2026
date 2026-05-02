// firebase.js — Initializes Firebase from CDN and exports RTDB + auth.
// The real config lives in firebase-config.js (gitignored).
// If firebase-config.js is missing, all multiplayer features degrade
// gracefully to "LOCAL" mode — single-player still works.
//
// NOTE: does NOT sign in automatically — auth is handled by authManager.js.

console.log('[SYNC] firebase.js loading...');

let rtdb = null;
let _auth = null;
let firebaseAvailable = false;

async function initFirebase() {
	try {
		const { firebaseConfig } = await import('../firebase-config.js');

		if (!firebaseConfig?.projectId || firebaseConfig.projectId === 'YOUR_PROJECT_ID') {
			console.warn('[SYNC] firebase-config.js contains placeholder values — running in LOCAL mode.');
			return;
		}

		const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
		const { getDatabase } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
		const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');

		const app = initializeApp(firebaseConfig);
		if (firebaseConfig.databaseURL) {
			rtdb = getDatabase(app, firebaseConfig.databaseURL);
		} else {
			rtdb = getDatabase(app);
			console.warn('[SYNC] No databaseURL in firebase-config.js. Add it from Firebase Console for reliable RTDB connection.');
		}
		_auth = getAuth(app);
		firebaseAvailable = true;
		console.log('[SYNC] Firebase app ready.');
	} catch (err) {
		console.warn('[SYNC] Firebase unavailable — running in LOCAL mode.', err?.message ?? err);
		rtdb = null;
		_auth = null;
		firebaseAvailable = false;
	}
}

const _readyPromise = initFirebase();

export async function isFirebaseReady() {
	await _readyPromise;
	return firebaseAvailable;
}

export function getRtdb() { return rtdb; }
export function getAuth() { return _auth; }
export { firebaseAvailable };
