#!/usr/bin/env node
/**
 * phone-device-check.mjs - Phase 72.1-12 (D-11): look at the game on Gandalf's real Pixel 8 Pro (Android Chrome). Not run in CI.
 *
 * What it does: (1) finds the SDK adb and the Pixel; if no device is listed it prints DEVICE NOT CONNECTED and exits 0. (2) exports
 * `git archive HEAD` (committed files only) to C:/tmp/72.1-device/ and serves it with http-server on port 5712. (3) adb reverse
 * tcp:5712. (4) opens http://localhost:5712/index.html with an `am start` VIEW intent. (5) adb forward tcp:9333 to Chrome's devtools
 * socket and attaches raw CDP to the ONE tab whose URL starts with the snapshot URL; other tabs are private: only their COUNT is
 * printed, never a URL or title. (6) takes `adb exec-out screencap -p` shots (lobby, then after Show cards) into the phase shots
 * folder, with Input.dispatchTouchEvent taps. (7) cleans up in a finally block: removes reverse and forward, stops the server, deletes
 * the snapshot. It never pushes and never deploys; it writes to the phone only the intent and the touches.
 */
import { spawnSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const PORT = 5712;
const CDP_PORT = 9333;
const SNAP = 'C:/tmp/72.1-device';
const URL_BASE = `http://localhost:${PORT}/`;
const SHOTS = '.planning/phases/72.1-mobile-play-on-the-new-design/shots';
const ADB = path.join(process.env.LOCALAPPDATA || '', 'Android/Sdk/platform-tools/adb.exe');

const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opts });
const adb = (...args) => run(ADB, args);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJson(url) {
	return new Promise((resolve, reject) => {
		http.get(url, (res) => { let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { reject(e); } }); }).on('error', reject);
	});
}

function screencap(name) {
	mkdirSync(SHOTS, { recursive: true });
	const r = spawnSync(ADB, ['exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 });
	writeFileSync(`${SHOTS}/72.1-12-device-${name}.png`, r.stdout);
	console.log(`screenshot: ${SHOTS}/72.1-12-device-${name}.png`);
}

async function main() {
	if (!existsSync(ADB)) { console.log(`DEVICE NOT CONNECTED (no SDK adb at ${ADB})`); return; }
	const devices = adb('devices').stdout.split('\n').slice(1).filter((l) => /\tdevice$/.test(l.trim() ? l : ''));
	if (!devices.length) { console.log('DEVICE NOT CONNECTED'); return; }
	console.log(`device: ${devices.length} connected`);

	let server = null;
	try {
		const head = run('git', ['rev-parse', '--short', 'HEAD']).stdout.trim();
		console.log(`serving commit ${head} (git archive HEAD: committed files only)`);
		mkdirSync(SNAP, { recursive: true });
		const archive = spawnSync('git archive HEAD | tar -x --force-local -C ' + JSON.stringify(SNAP), { shell: true });
		if (archive.status !== 0) throw new Error('git archive failed');
		server = spawn('npx', ['http-server', SNAP, '-p', String(PORT), '--cors', '-c-1'], { shell: true, stdio: 'ignore' });
		await sleep(3000);
		adb('reverse', `tcp:${PORT}`, `tcp:${PORT}`);
		adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `${URL_BASE}index.html`);
		await sleep(5000);
		adb('forward', `tcp:${CDP_PORT}`, 'localabstract:chrome_devtools_remote');
		const tabs = await getJson(`http://127.0.0.1:${CDP_PORT}/json`);
		const mine = tabs.filter((t) => typeof t.url === 'string' && t.url.startsWith(URL_BASE));
		console.log(`game tab: ${mine.length}; other tabs (not touched, not read): ${tabs.length - mine.length}`);
		if (mine.length !== 1) throw new Error('could not find exactly one game tab');
		screencap('lobby');
		const { WebSocket } = globalThis; // Node 22+
		const ws = new WebSocket(mine[0].webSocketDebuggerUrl);
		await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
		let id = 0;
		const send = (method, params) => new Promise((resolve) => {
			const n = ++id;
			const on = (m) => { const d = JSON.parse(m.data); if (d.id === n) { ws.removeEventListener('message', on); resolve(d.result); } };
			ws.addEventListener('message', on);
			ws.send(JSON.stringify({ id: n, method, params }));
		});
		const tapEl = async (selector) => {
			const r = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()` });
			const p = r?.result?.value;
			if (!p) return false;
			for (const type of ['touchStart', 'touchEnd']) await send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchStart' ? [{ x: p.x, y: p.y }] : [] });
			return true;
		};
		await tapEl('[data-picker="player-deck"] ~ .deck-tiles__toggle');
		await sleep(800);
		screencap('lobby-cards-open');
		ws.close();
	} finally {
		adb('reverse', '--remove', `tcp:${PORT}`);
		adb('forward', '--remove', `tcp:${CDP_PORT}`);
		if (server) spawnSync('taskkill', ['/pid', String(server.pid), '/t', '/f']);
		rmSync(SNAP, { recursive: true, force: true });
	}
}

main().catch((e) => { console.error(`device check failed: ${e.message}`); process.exit(1); });
