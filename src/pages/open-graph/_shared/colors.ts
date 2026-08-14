// src/pages/open-graph/_shared/colors.ts
//
// Three-stop gradient per slab class. Top → middle → bottom (vertical).
// Every card — docs pages and all logo-card slabs (blog, marketing, collection
// indexes) — uses the single `tbmq` slab.

export type SlabClass = 'tbmq';

export const SLAB_GRADIENTS: Record<SlabClass, [string, string, string]> = {
	tbmq: ['#1F8B4D', '#166e3c', '#0c4525'],
};

/** Build the CSS background string for a slab class. */
export function slabBackground(cls: SlabClass): string {
	const [a, b, c] = SLAB_GRADIENTS[cls];
	return `linear-gradient(180deg, ${a} 0%, ${b} 50%, ${c} 100%)`;
}
