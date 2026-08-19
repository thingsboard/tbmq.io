/** Slug words whose display form is not a plainly capitalized word (acronyms, brand casing). */
const ACRONYMS = new Map([
	['mqtt', 'MQTT'],
	['tbmq', 'TBMQ'],
	['api', 'API'],
	['ui', 'UI'],
	['tls', 'TLS'],
	['qos', 'QoS'],
	['http', 'HTTP'],
	['amqp', 'AMQP'],
	['coap', 'CoAP'],
	['rest', 'REST'],
	['websocket', 'WebSocket'],
	['id', 'ID'],
]);

/** Service words kept lowercase in every position but the first: 'what-is-mqtt' → 'What is MQTT'. */
const LOWERCASE_PARTICLES = new Set(['a', 'an', 'and', 'for', 'is', 'of', 'the', 'to', 'vs']);

/**
 * Prettify a URL segment for display: 'mqtt-5' → 'MQTT 5',
 * 'getting-started' → 'Getting Started', 'mqtt-vs-amqp' → 'MQTT vs AMQP'.
 */
export function prettifySegment(seg: string): string {
	return seg
		.split('-')
		.map((w, i) => {
			const acronym = ACRONYMS.get(w);
			if (acronym) return acronym;
			if (i > 0 && LOWERCASE_PARTICLES.has(w)) return w;
			return w ? w[0]!.toUpperCase() + w.slice(1) : w;
		})
		.join(' ');
}

/**
 * First path segment after the docs/edition prefix, prettified.
 * 'docs/pe/getting-started/quickstart' → 'Getting Started'
 * 'docs/getting-started'               → 'Getting Started'
 * Returns empty string for product-root pages.
 */
export function getSectionLabel(slug: string): string {
	let path = slug;
	if (path.startsWith('uk/')) path = path.slice(3);
	if (path.startsWith('docs/')) path = path.slice(5);
	if (path.startsWith('pe/')) path = path.slice(3);
	const firstSegment = path.split('/')[0] ?? '';
	if (!firstSegment) return '';
	return prettifySegment(firstSegment);
}

/**
 * Word-boundary truncate. Returns the original if shorter than max.
 * Adds an ellipsis character when cutting.
 */
export function truncate(text: string, max: number): string {
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	const lastSpace = cut.lastIndexOf(' ');
	const stem = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
	return stem + '…';
}

/**
 * Marketing pages we generate cards for.
 * Anything outside this list falls through to the global fallback PNG.
 * Curated from the spec's "Risks and open questions" section.
 *
 * Wildcard suffix `/*` means "this page and all of its descendants".
 */
export const MARKETING_ALLOWLIST: ReadonlyArray<string> = [
	'/',
	'/pricing/',
	'/products/*',
	'/community/*',
	'/contact-us/',
	'/installations/*',
	'/performance/',
	'/product/',
	'/live-demo/',
	'/cookie-policy/',
	'/company/*',
	'/mqtt/*',
];

/** Test whether a marketing pathname is in the allowlist. */
export function isAllowlistedMarketingPath(pathname: string): boolean {
	const normalized = pathname.endsWith('/') ? pathname : pathname + '/';
	for (const pattern of MARKETING_ALLOWLIST) {
		if (pattern.endsWith('/*')) {
			const prefix = pattern.slice(0, -1);
			if (normalized.startsWith(prefix)) return true;
		} else if (normalized === pattern) {
			return true;
		}
	}
	return false;
}
