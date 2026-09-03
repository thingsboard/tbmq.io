import { PROD_ORIGIN } from '../consts';

const siteHost = new URL(PROD_ORIGIN).hostname;

/**
 * True for absolute `http(s)://` URLs that point off-site. Relative paths,
 * in-page anchors, `mailto:` and absolute URLs on the production host are all
 * treated as internal.
 */
export function isExternalHref(href: string): boolean {
	if (!/^https?:\/\//i.test(href)) return false;
	try {
		return new URL(href).hostname !== siteHost;
	} catch {
		return false;
	}
}
