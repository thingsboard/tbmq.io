// src/pages/open-graph/_shared/product-meta.ts
//
// Maps a docs slug to the slab class and edition label.
// Driven by the existing `getVersionFromSlug` + `Products` enum in path-utils.ts —
// same source of truth as the docs URL routing.

import { Products } from '@models/site.models';
import { getVersionFromSlug } from '@util/path-utils';
import type { SlabClass } from '@root/pages/open-graph/_shared/colors';

export interface DocsProductMeta {
	slabClass: SlabClass;
	/** Edition label rendered under the brand lockup ("Professional" for /docs/pe/**). */
	secondaryLabel?: string;
}

const META_BY_PRODUCT: Record<Products, DocsProductMeta> = {
	[Products.TBMQ]:    { slabClass: 'tbmq' },
	[Products.TBMQ_PE]: { slabClass: 'tbmq', secondaryLabel: 'Professional' },
};

/** Resolve docs slug (e.g. 'docs/pe/getting-started/quickstart') to product meta. */
export function getDocsProductMeta(slug: string): DocsProductMeta {
	return META_BY_PRODUCT[getVersionFromSlug(slug)];
}
