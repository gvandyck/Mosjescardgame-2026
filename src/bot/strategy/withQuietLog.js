// withQuietLog - runs one bot dry-run without the engine's console lines, so the console only shows what really happened
// (a hypothetical "[ATTACK] ... taksed ..." line would read like a real attack in a bug report).
export function withQuietLog(run) {
	const original = console.log;
	console.log = () => {};
	try {
		return run();
	} finally {
		console.log = original;
	}
}
