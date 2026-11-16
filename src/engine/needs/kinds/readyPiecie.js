// readyPiecie { tag?, name?, count? } - at least count ready Piecies (ready slots + attached gear, via getReadyPiecies).
// picks.readyPiecies = the ones that satisfy it: ctx.choice.readyPiecies when named (each must qualify), else the first ones.
import { getReadyPiecies } from '../../attachments/getReadyPiecies.js';

const same = (a, b) => a.zone === b.zone && a.cardId === b.cardId
	&& (a.zone === 'slot' ? a.slotIndex === b.slotIndex : a.mosjeSlotIndex === b.mosjeSlotIndex && a.attachIndex === b.attachIndex);

export const readyPiecie = {
	check(ctx, need) {
		const filter = {};
		if (need.tag !== undefined) filter.tag = need.tag;
		if (need.name !== undefined) filter.name = need.name;
		const count = need.count ?? 1;
		const all = getReadyPiecies(ctx.state, ctx.playerId, filter);
		const label = need.tag ? `${need.tag} ` : '';
		if (all.length < count) return { ok: false, reason: `Needs: ${count} ready ${label}Piecie${need.name ? ' (' + need.name.replace(/^piecie_/, '').replace(/_/g, ' ') + ')' : ''}` };
		const wanted = ctx.choice?.readyPiecies;
		if (!Array.isArray(wanted)) return { ok: true, picks: { readyPiecies: all.slice(0, count) } };
		const out = [];
		for (const w of wanted) {
			const hit = all.find(a => same(a, w) && !out.includes(a));
			if (hit) out.push(hit);
		}
		if (wanted.length !== count || out.length !== count) return { ok: false, reason: 'Needs: choose ready Piecies that qualify' };
		return { ok: true, picks: { readyPiecies: out } };
	},
};
