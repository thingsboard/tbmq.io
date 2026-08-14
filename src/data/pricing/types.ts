// ============================================
// Pricing Page — TypeScript Interfaces
// ============================================

// ─── Plan cards ─────────────────────────────

export interface PlanFeature {
	text: string;
	highlight?: boolean;
	/** Adds a "+" icon instead of checkmark */
	plusIcon?: boolean;
	/** Hides the icon entirely (used for empty spacer rows) */
	noIcon?: boolean;
	/** FAQ tooltip content (HTML) */
	faqTooltip?: string;
	/** FAQ section ID for deep-link */
	faqId?: string;
}

export interface PlanCard {
	name: string;
	description: string;
	/** Price in display currency; null = "Custom" */
	price: number | null;
	/** Currency symbol: '$', '€', etc. */
	currency: string;
	/** Billing period label: '/month', '/one-time', etc. */
	period: string;
	/** CTA button text */
	ctaText: string;
	/** CTA button URL */
	ctaHref: string;
	/** Use primary/filled button style (vs secondary/outlined) */
	ctaPrimary?: boolean;
	/** Show "POPULAR" badge */
	popular?: boolean;
	/** Feature rows */
	features: PlanFeature[];
	/** License server product ID (for getLicense links) */
	productId?: string;
	/** License server plan ID */
	planId?: string;
	/** Annual price (when billing toggle is set to Annual) */
	annualPrice?: number | null;
	/** FAQ id for the price info icon (shown when price is null / "Custom") */
	priceFaqId?: string;
	/** Tooltip text for the price info icon */
	priceFaqTooltip?: string;
	/** GTM element ID for the CTA button (e.g., "Pricing_PE_Cloud_Maker") */
	gtmId?: string;
}

// ─── Community Edition ──────────────────────

export interface CommunityEditionData {
	title: string;
	/** Optional subtitle (rendered bolder, before main description) */
	subtitle?: string;
	description: string;
	features: string[];
	ctaText: string;
	ctaHref: string;
	/** Optional onclick for the main CTA (overrides href navigation) */
	ctaOnclick?: string;
	/** Optional secondary button */
	secondaryCtaText?: string;
	/** Navigation target for the secondary button (preferred — keeps middle-click / new-tab working) */
	secondaryCtaHref?: string;
	/** Onclick handler for the secondary button — only use for non-navigation actions (e.g. opening a modal) */
	secondaryCtaOnclick?: string;
	/** Optional price display (e.g., "Starting from $4,999") */
	priceLabel?: string;
}

// ─── Private Cloud ──────────────────────────

export interface PrivateCloudData {
	sectionTitle: string;
	sectionSubtitle: string;
	billingOptions: { monthly: string; annual: string; discount?: string };
	plans: PlanCard[];
	/** Annual-discounted plans (same structure, different prices) */
	annualPlans?: PlanCard[];
}

// ─── Self-managed ───────────────────────────

export interface SelfManagedData {
	payg: {
		sectionTitle: string;
		sectionSubtitle: string;
		plans: PlanCard[];
	};
	perpetual: {
		sectionTitle: string;
		sectionSubtitle: string;
		plans: PlanCard[];
		benefits?: PerpetualBenefit[];
	};
}

export interface PerpetualBenefit {
	icon: string;
	title: string;
	description: string;
}

// ─── FAQ ────────────────────────────────────

export interface FaqItem {
	id: string;
	question: string;
	/** Answer as HTML string */
	answer: string;
}

export interface FaqCategory {
	id: string;
	label: string;
	items: FaqItem[];
}

export interface FaqSection {
	/** Matches product sub-tab context */
	contextId: string;
	categories: FaqCategory[];
}

// ─── Comparison table (Private Cloud) ───────

export interface ComparisonRow {
	feature: string;
	values: (string | boolean)[];
	faqId?: string;
	faqTooltip?: string;
	/** Set by enrichRows() when tooltip was auto-generated from FAQ answer */
	autoTooltip?: boolean;
}

export interface ComparisonTable {
	headers: string[];
	rows: ComparisonRow[];
}
