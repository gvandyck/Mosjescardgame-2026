// captureBotMetrics.js - run fn() with console.log replaced and collect every '[BOT] METRIC {json}' line (test helper, not a test).
// captureBotMetrics(fn) -> { result, metrics }: fn's return value and every parsed metric ({ ev, ...fields }) in order.
// All other console output is swallowed while fn runs; console.log is restored in a finally block, also when fn throws.
const METRIC_PREFIX = '[BOT] METRIC ';

export function captureBotMetrics(fn) {
	const realLog = console.log;
	const metrics = [];
	console.log = (...args) => {
		if (typeof args[0] === 'string' && args[0].startsWith(METRIC_PREFIX)) metrics.push(JSON.parse(args[0].slice(METRIC_PREFIX.length)));
	};
	try {
		const result = fn();
		return { result, metrics };
	} finally {
		console.log = realLog;
	}
}
