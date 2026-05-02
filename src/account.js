// account.js — Auth page logic (account.html).

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
	if (user) window.location.href = './index.html';
});

// ── Mode switching (Sign In ↔ Register) ───────────────────────────────────────
const formSignin   = document.getElementById('form-signin');
const formRegister = document.getElementById('form-register');

function switchMode(mode) {
	const toSignin = mode === 'signin';
	formSignin.hidden   = !toSignin;
	formRegister.hidden = toSignin;
	clearErrors();
	// Auto-focus first visible input (Fitts's Law: user's eye is already there)
	const firstInput = (toSignin ? formSignin : formRegister).querySelector('input');
	firstInput?.focus();
}

document.querySelectorAll('.auth-mode-link').forEach(link => {
	link.addEventListener('click', e => {
		e.preventDefault();
		switchMode(link.dataset.switchTo);
	});
});

// Auto-focus email on page load
document.getElementById('signin-email')?.focus();

// ── Password show/hide toggles ────────────────────────────────────────────────
document.querySelectorAll('.btn-toggle-pw').forEach(btn => {
	btn.addEventListener('click', () => {
		const input = document.getElementById(btn.dataset.target);
		if (!input) return;
		const showing = input.type === 'text';
		input.type = showing ? 'password' : 'text';
		btn.querySelector('.icon-eye').hidden    = !showing;
		btn.querySelector('.icon-eye-off').hidden = showing;
		btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
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
	document.querySelectorAll('.field-group.has-error').forEach(g => g.classList.remove('has-error'));
}

function markFieldError(inputId) {
	document.getElementById(inputId)?.closest('.field-group')?.classList.add('has-error');
}

function setLoading(btn, loading) {
	btn.disabled = loading;
	btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
	btn.textContent = loading ? 'Please wait…' : btn.dataset.originalText;
}

async function afterAuth(user) {
	if (user && !user.isAnonymous) {
		saveUserProfile(user.uid, {
			displayName: user.displayName || user.email?.split('@')[0] || 'Player',
			isAnonymous: false,
		}).catch(() => {});
	}
	window.location.href = './index.html';
}

// ── Google — single button handles both modes ─────────────────────────────────
document.getElementById('btn-google').addEventListener('click', async () => {
	clearErrors();
	const btn = document.getElementById('btn-google');
	setLoading(btn, true);
	const result = await signInWithGoogle();
	setLoading(btn, false);
	if (result.error) {
		const activeErrorEl = formRegister.hidden ? 'signin-error' : 'register-error';
		showError(activeErrorEl, result.error);
		return;
	}
	if (result.success) await afterAuth(result.user);
});

// ── Sign In ───────────────────────────────────────────────────────────────────
formSignin.addEventListener('submit', async e => {
	e.preventDefault();
	clearErrors();
	const btn   = document.getElementById('btn-signin');
	const email = document.getElementById('signin-email').value.trim();
	const pass  = document.getElementById('signin-password').value;
	if (!email) { markFieldError('signin-email');    showError('signin-error', 'Please enter your email.'); return; }
	if (!pass)  { markFieldError('signin-password'); showError('signin-error', 'Please enter your password.'); return; }
	setLoading(btn, true);
	const result = await signInWithEmail(email, pass);
	if (!result.success) {
		showError('signin-error', result.error);
		setLoading(btn, false);
		return;
	}
	await afterAuth(result.user);
});

// ── Register ──────────────────────────────────────────────────────────────────
formRegister.addEventListener('submit', async e => {
	e.preventDefault();
	clearErrors();
	const btn   = document.getElementById('btn-register');
	const name  = document.getElementById('reg-name').value.trim();
	const email = document.getElementById('reg-email').value.trim();
	const pass  = document.getElementById('reg-password').value;
	if (!name)  { markFieldError('reg-name');     showError('register-error', 'Please enter a display name.'); return; }
	if (!email) { markFieldError('reg-email');    showError('register-error', 'Please enter your email.'); return; }
	if (!pass)  { markFieldError('reg-password'); showError('register-error', 'Please enter a password (min. 6 characters).'); return; }
	setLoading(btn, true);
	const result = await registerWithEmail(email, pass, name);
	if (!result.success) {
		showError('register-error', result.error);
		setLoading(btn, false);
		return;
	}
	await afterAuth(result.user);
});

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
