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
 * fragments don't carry a usable display name (e.g. /products/mobile/ → "Mobile"
 * is too thin for a hero card; /products/paas/ → "Paas" is plain wrong).
 * Pathnames are stored with a trailing slash so they match the normaliser
 * inside `getMarketingSection` / `isAllowlistedMarketingPath`.
 */
export interface MarketingOverride {
	eyebrow: string;
	title: string;
}

const PRODUCT_OVERRIDES: Record<string, MarketingOverride> = {
	'/products/mqtt-broker/': { eyebrow: 'TBMQ', title: 'Scalable, fault-tolerant open-source MQTT broker' },
	'/products/mqtt-broker/privacy-policy/': { eyebrow: 'TBMQ', title: 'Privacy Policy' },
	'/products/mqtt-broker/terms-of-use/': { eyebrow: 'TBMQ', title: 'Terms of Use' },
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
	{ prefix: '/products/', section: { sectionName: 'Products' } },
	{ prefix: '/industries/', section: { sectionName: 'Industries' } },
	{ prefix: '/services/', section: { sectionName: 'Services' } },
	{ prefix: '/community/', section: { sectionName: 'Community' } },
	{ prefix: '/company/', section: { sectionName: 'Company' } },
	{ prefix: '/clients-feedback/', section: { sectionName: 'Customers' } },
	{ prefix: '/contact-us/', section: { sectionName: 'Contact' } },
	{ prefix: '/cookie-policy/', section: { sectionName: 'Legal' } },
	{ prefix: '/installations/', section: { sectionName: 'Installations' } },
];

const STANDALONE_SECTION: MarketingSection = { sectionName: 'Solutions' };

/**
 * Resolve a marketing pathname to its slab section.
 * - '/' → no section name (logo alone).
 * - Known prefixes → matching section word.
 * - Standalone allowlisted pages (asset-management/, device-management/, etc.) → 'Solutions'.
 */
export function getMarketingSection(pathname: string): MarketingSection {
	const normalized = pathname.endsWith('/') ? pathname : pathname + '/';
	if (normalized === '/') return { sectionName: null };
	for (const rule of PREFIX_RULES) {
		if (normalized.startsWith(rule.prefix)) return rule.section;
	}
	return STANDALONE_SECTION;
}
