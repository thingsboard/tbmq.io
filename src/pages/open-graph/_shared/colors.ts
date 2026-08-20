// src/pages/open-graph/_shared/colors.ts
//
// The OG palette. Three-stop slab gradient (top → middle → bottom, vertical)
// plus the backdrop network colours used by Background.tsx. Every card — docs
// pages and all logo-card slabs (marketing, collection indexes) — uses the
// single `tbmq` slab.

export type SlabClass = 'tbmq';

export const SLAB_GRADIENTS: Record<SlabClass, [string, string, string]> = {
	// Top stop is $color-brand (keep in sync with src/styles/_variables.scss).
	tbmq: ['#1a7f46', '#166e3c', '#0c4525'],
};

// Backdrop network (Background.tsx): node dots/lines are the dark-theme mint
// ($color-brand-dark — keep in sync with src/styles/_variables.scss), the
// sparse accents are orange, and the glow is a deep translucent green.
export const NETWORK_COLORS = {
	node: '#7ee0a0',
	accent: '#ff5722',
	glow: 'rgba(22,110,60,0.55)',
} as const;

/** Build the CSS background string for a slab class. */
export function slabBackground(cls: SlabClass): string {
	const [a, b, c] = SLAB_GRADIENTS[cls];
	return `linear-gradient(180deg, ${a} 0%, ${b} 50%, ${c} 100%)`;
}
