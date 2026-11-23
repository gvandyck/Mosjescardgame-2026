// pqHoldLists - what the held Personal Quests (the ones matching the keeper) ask the bot to hold back (CC-5). Pure, data in/out.
import { PIECIES } from '../../data/piecies.js';

const TAG_BY_ID = Object.fromEntries(PIECIES.map(p => [p.id, p.tag]));
const ATTACHES = new Set(['gear', 'pet']); // gear and pets attach and stay "ready" when used: nothing to hold back

export function pqHoldLists(defs) {
	const keepPiecies = [];
	const keepHand = [];
	const needPlaceIds = [];
	let handFloor = 0;
	let energyReserve = 0;
	let minMp = 0;
	for (const def of defs) {
		for (const n of def.needs || []) {
			if (n.kind === 'readyPiecie' && !ATTACHES.has(n.tag) && !ATTACHES.has(TAG_BY_ID[n.name])) keepPiecies.push(n.name ? { name: n.name, count: n.count ?? 1 } : { tag: n.tag, count: n.count ?? 1 });
			if (n.kind === 'handSizeOther') handFloor = Math.max(handFloor, n.count);
			if (n.kind === 'placeInPlay' && !needPlaceIds.includes(n.placeId)) needPlaceIds.push(n.placeId);
			if (n.kind === 'mosjeMinMP') minMp = Math.max(minMp, n.amount);
		}
		for (const p of def.pay || []) {
			if (p.kind === 'discardReadyPiecie' && !ATTACHES.has(p.tag)) keepPiecies.push({ tag: p.tag, count: p.count ?? 1 });
			if (p.kind === 'discardFromHand') keepHand.push(p.tag ? { tag: p.tag, count: p.count ?? 1 } : { type: p.type, count: p.count ?? 1 });
			if (p.kind === 'energy') energyReserve = Math.max(energyReserve, p.amount);
			if (p.kind === 'mpLoss') minMp = Math.max(minMp, p.amount + 5);
		}
	}
	return { keepPiecies, keepHand, needPlaceIds, handFloor, energyReserve, minMp };
}
