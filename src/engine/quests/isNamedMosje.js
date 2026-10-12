// isNamedMosje — word match on the slot name ("FPS Coert" and "Coert, KasteLuck" are Coerts).
export function isNamedMosje(slot, name) {
	return new RegExp('\\b' + name + '\\b', 'i').test(slot?.name || '');
}
