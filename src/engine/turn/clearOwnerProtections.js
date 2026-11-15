// clearOwnerProtections — U8: a player's fresh flag ends when their
// own turn starts. Slots in skipSlotIndexes (the R1 Mosje) stay fresh.
export function clearOwnerProtections(player, skipSlotIndexes = []) {
	(player.activeSlots || []).forEach((slot, i) => {
		if (!slot || skipSlotIndexes.includes(i)) return;
		if (slot.entryProtected) {
			delete slot.entryProtected;
			console.log(`[ENGINE] 🛡️ Protection ended for ${slot.name} (owner's turn started)`);
		}
	});
}
