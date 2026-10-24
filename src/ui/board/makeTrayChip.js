// makeTrayChip.js — one action-tray chip as plain data (63-UI-SPEC "Action tray"): a chip with a reason is disabled but stays
// tappable (the tap shows the reason in a toast), so the reason is data here, never a hover title.
export function makeTrayChip(action, label, reason = '') {
	return { action, label, disabled: !!reason, reason: reason || '' };
}
