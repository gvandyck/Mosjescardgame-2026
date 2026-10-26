// servePlaceholderFirebase.js — give a page the same Firebase setup the live 2.0 site has (D-33).
// The deploy writes the placeholder firebase-config.js (projectId YOUR_PROJECT_ID) so src/firebase.js drops to LOCAL mode with
// one console.warn and no network. Serving that same file here lets a spec require ZERO console errors, instead of filtering
// the "Failed to load resource" that Chromium logs when firebase-config.js is aborted.
// Only the Firebase SDK on www.gstatic.com is aborted: fonts.gstatic.com serves the UI fonts and must stay reachable.
import { PLACEHOLDER_FIREBASE_CONFIG_JS } from './placeholderFirebaseConfig.js';

export async function servePlaceholderFirebase(page) {
	await page.route('**/firebase-config.js', route => route.fulfill({
		status: 200,
		contentType: 'application/javascript',
		body: PLACEHOLDER_FIREBASE_CONFIG_JS,
	}));
	await page.route('https://www.gstatic.com/firebasejs/**', route => route.abort());
}
