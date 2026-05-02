// authManager.js — Handles all Firebase Auth operations.
// Supports: Email/Password, Google Sign-In, Anonymous (guest) play.
// Auth state persists across page loads via Firebase's localStorage cache.

import { isFirebaseReady, getAuth } from '../firebase.js';

console.log('[AUTH] authManager.js loaded');

async function getAuthAPI() {
	const {
		signInWithEmailAndPassword,
		createUserWithEmailAndPassword,
		signInWithPopup,
		GoogleAuthProvider,
		signInAnonymously,
		signOut: _signOut,
		onAuthStateChanged: _onAuthStateChanged,
		updateProfile,
	} = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
	return {
		signInWithEmailAndPassword,
		createUserWithEmailAndPassword,
		signInWithPopup,
		GoogleAuthProvider,
		signInAnonymously,
		signOut: _signOut,
		onAuthStateChanged: _onAuthStateChanged,
		updateProfile,
	};
}

// Sign in with email + password.
export async function signInWithEmail(email, password) {
	const ready = await isFirebaseReady();
	if (!ready) return { success: false, error: 'Firebase not available.' };
	const auth = getAuth();
	try {
		const { signInWithEmailAndPassword } = await getAuthAPI();
		await signInWithEmailAndPassword(auth, email, password);
		console.log('[AUTH] Signed in:', auth.currentUser?.email);
		return { success: true, user: auth.currentUser };
	} catch (err) {
		return { success: false, error: friendlyAuthError(err.code) };
	}
}

// Create a new account with email, password, and display name.
export async function registerWithEmail(email, password, displayName) {
	const ready = await isFirebaseReady();
	if (!ready) return { success: false, error: 'Firebase not available.' };
	const auth = getAuth();
	try {
		const { createUserWithEmailAndPassword, updateProfile } = await getAuthAPI();
		const cred = await createUserWithEmailAndPassword(auth, email, password);
		await updateProfile(cred.user, { displayName: displayName.trim() });
		console.log('[AUTH] Registered:', cred.user.email);
		return { success: true, user: cred.user };
	} catch (err) {
		return { success: false, error: friendlyAuthError(err.code) };
	}
}

// Sign in with Google popup.
export async function signInWithGoogle() {
	const ready = await isFirebaseReady();
	if (!ready) return { success: false, error: 'Firebase not available.' };
	const auth = getAuth();
	try {
		const { signInWithPopup, GoogleAuthProvider } = await getAuthAPI();
		const provider = new GoogleAuthProvider();
		await signInWithPopup(auth, provider);
		console.log('[AUTH] Google sign-in:', auth.currentUser?.displayName);
		return { success: true };
	} catch (err) {
		if (err.code === 'auth/popup-closed-by-user') return { success: false, error: null };
		return { success: false, error: friendlyAuthError(err.code) };
	}
}

// Sign in anonymously (guest play — no account needed).
export async function playAsGuest() {
	const ready = await isFirebaseReady();
	if (!ready) return { success: false, error: 'Firebase not available.' };
	const auth = getAuth();
	try {
		const { signInAnonymously } = await getAuthAPI();
		await signInAnonymously(auth);
		console.log('[AUTH] Signed in as guest, UID:', auth.currentUser?.uid);
		return { success: true };
	} catch (err) {
		return { success: false, error: friendlyAuthError(err.code) };
	}
}

// Sign out the current user.
export async function signOut() {
	const ready = await isFirebaseReady();
	if (!ready) return;
	const auth = getAuth();
	const { signOut: _signOut } = await getAuthAPI();
	await _signOut(auth);
	console.log('[AUTH] Signed out');
}

// Returns the current Firebase user synchronously (may be null before auth resolves).
export function getCurrentUser() {
	return getAuth()?.currentUser ?? null;
}

// Calls callback(user) when auth state changes (or is first resolved).
// Returns an unsubscribe function.
export async function onAuthStateChanged(callback) {
	const ready = await isFirebaseReady();
	if (!ready) {
		callback(null);
		return () => {};
	}
	const auth = getAuth();
	const { onAuthStateChanged: _onAuthStateChanged } = await getAuthAPI();
	return _onAuthStateChanged(auth, callback);
}

function friendlyAuthError(code) {
	switch (code) {
		case 'auth/invalid-email': return 'Invalid email address.';
		case 'auth/user-not-found': return 'No account found with this email.';
		case 'auth/wrong-password': return 'Incorrect password.';
		case 'auth/email-already-in-use': return 'An account with this email already exists.';
		case 'auth/weak-password': return 'Password must be at least 6 characters.';
		case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
		case 'auth/network-request-failed': return 'Network error. Check your connection.';
		default: return 'Something went wrong. Please try again.';
	}
}
