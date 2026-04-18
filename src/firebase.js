// firebase.js — Initializes Firebase from CDN and exports db + auth.
// The real config lives in firebase-config.js (gitignored).
// If firebase-config.js is missing, all multiplayer features degrade
// gracefully to "LOCAL" mode — single-player still works.

console.log('[SYNC] firebase.js loading...');

let db = null;
let auth = null;
let firebaseAvailable = false;

async function initFirebase() {
	try {
		// Dynamic import so missing config.js doesn't hard-crash the whole app
		const { firebaseConfig } = await import('../firebase-config.js');

		if (!firebaseConfig?.projectId || firebaseConfig.projectId === 'YOUR_PROJECT_ID') {
			console.warn('[SYNC] firebase-config.js contains placeholder values — running in LOCAL mode.');
			return;
		}

		const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
		const { getFirestore, connectFirestoreEmulator } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
		const { getAuth, signInAnonymously } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');

		const app = initializeApp(firebaseConfig);
		db = getFirestore(app);
		auth = getAuth(app);

		// Sign in anonymously so Firestore security rules can identify users
		await signInAnonymously(auth);
		firebaseAvailable = true;
		console.log('[SYNC] Firebase initialized. UID:', auth.currentUser?.uid);
	} catch (err) {
		console.warn('[SYNC] Firebase unavailable — running in LOCAL mode.', err?.message ?? err);
		db = null;
		auth = null;
		firebaseAvailable = false;
	}
}

// Start initialization immediately; callers await isReady()
const _readyPromise = initFirebase();

export async function isFirebaseReady() {
	await _readyPromise;
	return firebaseAvailable;
}

export function getDb() { return db; }
export function getAuth() { return auth; }
export { firebaseAvailable };
