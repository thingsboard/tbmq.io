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

/**
 * Builds a full docs link: /docs/{prefix}{path}/, keeping any ?query and #anchor after the
 * trailing slash (e.g. 'installation/docker#upgrading' → '/docs/pe/installation/docker/#upgrading').
 */
export function docsLink(product: Products, path: string): string {
	const [pathWithQuery, anchor] = path.split('#');
	const [pathPart, query] = pathWithQuery.split('?');
	const normalizedPath = pathPart === '' ? '' : pathPart.endsWith('/') ? pathPart : pathPart + '/';
	return `/docs/${productDocsPrefix[product]}${normalizedPath}${query ? '?' + query : ''}${anchor ? '#' + anchor : ''}`;
}
