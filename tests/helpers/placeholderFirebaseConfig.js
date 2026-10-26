// The 2.0 deploy (.github/workflows/deploy-obby2.yml) writes exactly this text to firebase-config.js (D-33),
// and the Playwright helper servePlaceholderFirebase (plan 64-03) serves it, so the specs see what the live site sees.
// src/firebase.js treats projectId 'YOUR_PROJECT_ID' as LOCAL mode (one console.warn, no network).
export const PLACEHOLDER_FIREBASE_CONFIG_JS = "export const firebaseConfig = { projectId: 'YOUR_PROJECT_ID' };";
