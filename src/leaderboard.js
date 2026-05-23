// leaderboard.js — Leaderboard page controller.
// Auth-required. Anonymous/guest users are redirected to lobby.

import { onAuthStateChanged } from './multiplayer/authManager.js';
import { fetchLeaderboard } from './multiplayer/leaderboardStore.js';

console.log('[LEADERBOARD] leaderboard.js loaded');

onAuthStateChanged(async user => {
    if (!user) { window.location.href = './account.html'; return; }
    if (user.isAnonymous) { window.location.href = './index.html'; return; }
    await loadLeaderboard();
});

async function loadLeaderboard() {
    const statusEl = document.getElementById('leaderboard-status');
    const containerEl = document.getElementById('leaderboard-container');
    const bodyEl = document.getElementById('leaderboard-body');

    if (statusEl) statusEl.textContent = 'Loading...';

    let players;
    try {
        players = await fetchLeaderboard();
    } catch (err) {
        console.warn('[LEADERBOARD] fetchLeaderboard failed:', err);
        if (statusEl) statusEl.textContent = 'Could not load leaderboard. Try again later.';
        return;
    }

    if (!players || players.length === 0) {
        if (statusEl) statusEl.textContent = 'No ranked players yet. Play a match to appear here!';
        return;
    }

    if (statusEl) statusEl.hidden = true;
    if (containerEl) containerEl.hidden = false;

    if (bodyEl) {
        bodyEl.innerHTML = players.map((p, i) => {
            const rank = i + 1;
            const rankClass = rank <= 3 ? ' is-top3' : '';
            return `
                <tr>
                    <td class="lb-col lb-col--rank${rankClass}">${rank}</td>
                    <td class="lb-col lb-col--name">${escapeHtml(p.displayName)}</td>
                    <td class="lb-col lb-col--wins">${p.wins}</td>
                    <td class="lb-col lb-col--losses">${p.losses}</td>
                    <td class="lb-col lb-col--winrate">${p.winRate}%</td>
                    <td class="lb-col lb-col--streak">${p.currentStreak}</td>
                </tr>
            `;
        }).join('');
    }
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
