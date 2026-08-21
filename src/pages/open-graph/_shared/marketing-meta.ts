// Marketing pages share the brand-blue logo slab. The slab's section word
// is derived from the URL prefix.

export interface MarketingSection {
	/** Word to render under the TB logo on the slab (omit for homepage). */
	sectionName: string | null;
	/** Use the smaller "tight" font for two-word labels. */
	tight?: boolean;
}

/**
 * Per-pathname eyebrow + title override for marketing pages whose URL
 * fragments don't carry a usable display name (the legal pages would get a
 * "Product" eyebrow from their /product/ parent segment).
 * Pathnames are stored with a trailing slash so they match the normaliser
 * inside `getMarketingSection` / `isAllowlistedMarketingPath`.
 */
export interface MarketingOverride {
	eyebrow: string;
	title: string;
}

const PRODUCT_OVERRIDES: Record<string, MarketingOverride> = {
	'/product/privacy-policy/': { eyebrow: 'TBMQ', title: 'Privacy Policy' },
	'/product/terms-of-use/': { eyebrow: 'TBMQ', title: 'Terms of Use' },
};

export function getMarketingOverride(pathname: string): MarketingOverride | null {
	const normalized = pathname.endsWith('/') ? pathname : pathname + '/';
	return PRODUCT_OVERRIDES[normalized] ?? null;
}

interface PrefixRule {
	prefix: string;
	section: MarketingSection;
}

/** Order matters — first match wins. */
const PREFIX_RULES: PrefixRule[] = [
	{ prefix: '/pricing/', section: { sectionName: 'Pricing' } },
	{ prefix: '/community/', section: { sectionName: 'Community' } },
	{ prefix: '/company/', section: { sectionName: 'Company' } },
	{ prefix: '/contact-us/', section: { sectionName: 'Contact' } },
	{ prefix: '/cookie-policy/', section: { sectionName: 'Legal' } },
	{ prefix: '/installations/', section: { sectionName: 'Installations' } },
	{ prefix: '/mqtt/', section: { sectionName: 'Learn' } },
	{ prefix: '/performance/', section: { sectionName: 'Benchmark', tight: true } },
	{ prefix: '/product/', section: { sectionName: 'Product' } },
	{ prefix: '/live-demo/', section: { sectionName: 'Live Demo', tight: true } },
];

/**
 * Resolve a marketing pathname to its slab section.
 * - '/' → no section name (logo alone).
 * - Known prefixes → matching section word.
 *
 * Only called on MARKETING_ALLOWLIST pathnames; a miss means the allowlist
 * gained an entry without a matching PREFIX_RULES rule, so fail the build
 * loudly instead of stamping a stale section word onto the card.
 */
export function getMarketingSection(pathname: string): MarketingSection {
	const normalized = pathname.endsWith('/') ? pathname : pathname + '/';
	if (normalized === '/') return { sectionName: null };
	for (const rule of PREFIX_RULES) {
		if (normalized.startsWith(rule.prefix)) return rule.section;
	}
	throw new Error(`No PREFIX_RULES entry for allowlisted marketing pathname: ${pathname}`);
}
