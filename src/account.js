// account.js — Auth page logic (account.html).
// Handles sign-in, register, Google login, and guest play.
// On success: redirects to ./index.html

import {
	signInWithEmail,
	registerWithEmail,
	signInWithGoogle,
	playAsGuest,
	onAuthStateChanged,
} from './multiplayer/authManager.js';
import { saveUserProfile } from './multiplayer/userStore.js';

// If already signed in, go straight to lobby.
onAuthStateChanged(user => {
	if (user) {
		window.location.href = './index.html';
	}
});

// ── Tab switching ──────────────────────────────────────────────────────────────
const tabs = document.querySelectorAll('.auth-tab');
const forms = document.querySelectorAll('[data-tab-content]');

tabs.forEach(tab => {
	tab.addEventListener('click', () => {
		const target = tab.dataset.tab;
		tabs.forEach(t => { t.classList.toggle('active', t.dataset.tab === target); t.setAttribute('aria-selected', t.dataset.tab === target); });
		forms.forEach(f => { f.hidden = f.dataset.tabContent !== target; });
		clearErrors();
	});
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function showError(elId, message) {
	const el = document.getElementById(elId);
	if (!el) return;
	el.textContent = message;
	el.hidden = !message;
}

function clearErrors() {
	['signin-error', 'register-error', 'guest-error'].forEach(id => showError(id, ''));
}

function setLoading(btn, loading) {
	btn.disabled = loading;
	btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
	btn.textContent = loading ? 'Please wait...' : btn.dataset.originalText;
}

async function afterAuth(user) {
	// Persist a lightweight profile (non-blocking).
	if (user && !user.isAnonymous) {
		saveUserProfile(user.uid, {
			displayName: user.displayName || user.email?.split('@')[0] || 'Player',
			isAnonymous: false,
		}).catch(() => {});
	}
	window.location.href = './index.html';
}

// ── Sign In ───────────────────────────────────────────────────────────────────
document.getElementById('form-signin').addEventListener('submit', async e => {
	e.preventDefault();
	clearErrors();
	const btn = document.getElementById('btn-signin');
	const email = document.getElementById('signin-email').value.trim();
	const password = document.getElementById('signin-password').value;
	setLoading(btn, true);
	const result = await signInWithEmail(email, password);
	if (!result.success) {
		showError('signin-error', result.error);
		setLoading(btn, false);
		return;
	}
	await afterAuth(result.user);
});

// ── Register ──────────────────────────────────────────────────────────────────
document.getElementById('form-register').addEventListener('submit', async e => {
	e.preventDefault();
	clearErrors();
	const btn = document.getElementById('btn-register');
	const name = document.getElementById('reg-name').value.trim();
	const email = document.getElementById('reg-email').value.trim();
	const password = document.getElementById('reg-password').value;
	if (!name) { showError('register-error', 'Please enter a display name.'); return; }
	setLoading(btn, true);
	const result = await registerWithEmail(email, password, name);
	if (!result.success) {
		showError('register-error', result.error);
		setLoading(btn, false);
		return;
	}
	await afterAuth(result.user);
});

// ── Google ────────────────────────────────────────────────────────────────────
async function handleGoogle(errorElId) {
	clearErrors();
	const result = await signInWithGoogle();
	if (result.error) { showError(errorElId, result.error); return; }
	if (result.success) await afterAuth(result.user);
}

document.getElementById('btn-google-signin').addEventListener('click', () => handleGoogle('signin-error'));
document.getElementById('btn-google-register').addEventListener('click', () => handleGoogle('register-error'));

// ── Guest ─────────────────────────────────────────────────────────────────────
document.getElementById('btn-guest').addEventListener('click', async () => {
	clearErrors();
	const btn = document.getElementById('btn-guest');
	setLoading(btn, true);
	const result = await playAsGuest();
	if (!result.success) {
		showError('guest-error', result.error || 'Could not start guest session.');
		setLoading(btn, false);
		return;
	}
	window.location.href = './index.html';
});
