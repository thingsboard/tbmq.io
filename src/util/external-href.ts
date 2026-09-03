import { PROD_ORIGIN } from '../consts';

const siteHost = new URL(PROD_ORIGIN).hostname;

/** `www.` is an alias of the bare host, not a different site. */
function canonicalHost(hostname: string): string {
	return hostname.replace(/^www\./, '');
}

/**
 * True for absolute (`http(s)://`) and protocol-relative (`//host/…`) URLs
 * whose host is not the production host or its `www.` alias. Relative paths,
 * in-page anchors and `mailto:` are treated as internal.
 */
export function isExternalHref(href: string): boolean {
	if (!/^(https?:)?\/\//i.test(href)) return false;
	try {
		return canonicalHost(new URL(href, PROD_ORIGIN).hostname) !== canonicalHost(siteHost);
	} catch {
		return false;
	}
}
