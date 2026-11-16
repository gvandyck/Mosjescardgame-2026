// pickFromCandidates - ask for `count` different entries out of `candidates` ([{ id, label, metaLabel? }]), one modal each, and
// return the picked ids in order. Cancel anywhere -> null. Used by the Personal Quest flow for "which Piecie / card".
export async function pickFromCandidates({ modal, title, prompt, candidates, count = 1 }) {
	const left = [...candidates];
	const picked = [];
	for (let n = 0; n < count; n++) {
		const id = await modal.showOptionSelect({ title, prompt: count > 1 ? `${prompt} (${n + 1} of ${count})` : prompt, options: left, allowCancel: true });
		if (id == null) return null;
		picked.push(id);
		left.splice(left.findIndex(c => c.id === id), 1);
	}
	return picked;
}
