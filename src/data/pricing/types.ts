// ============================================
// Pricing Page — TypeScript Interfaces
// ============================================

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
// Plan-card data was removed with its renderer; the live pricing numbers live
// in the calculators (`src/scripts/pricing/calc-tbmq-*.ts`).

export interface PrivateCloudData {
	sectionTitle: string;
	sectionSubtitle: string;
}

// ─── Self-managed ───────────────────────────

export interface SelfManagedData {
	perpetual: {
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
