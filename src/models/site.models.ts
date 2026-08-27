export enum Products {
	TBMQ = 'TBMQ',
	TBMQ_PE = 'TBMQ_PE',
}

/** Maps each product to its docs URL prefix (the segment after /docs/). */
export const productDocsPrefix: Record<Products, string> = {
	[Products.TBMQ]: '',
	[Products.TBMQ_PE]: 'pe/',
};

/** Returns the docs prefix for the given product (e.g. 'pe/' for PE, '' for CE). */
export function getDocsPrefix(product: Products): string {
	return productDocsPrefix[product];
}

/** Builds a full docs link: /docs/{prefix}{path}/ */
export function docsLink(product: Products, path: string): string {
	const normalizedPath = path === '' ? '' : (path.endsWith('/') ? path : path + '/');
	return `/docs/${productDocsPrefix[product]}${normalizedPath}`;
}
