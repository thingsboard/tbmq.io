import { getPageCategory } from './getPageCategory';

/**
 * Map of category names to the parent page for the category.
 * Pages in these categories are not visible in the sidebar, so we highlight the
 * parent instead. Empty today — every TBMQ page that has a category is also a
 * sidebar link — but the hook stays for the next category that isn't.
 */
const categoryParents: Partial<Record<ReturnType<typeof getPageCategory>, string>> = {};

/**
 * Test if `currentPage` is considered a sub-page of `parentSlug`.
 * @param currentPage The full slug for the current page, e.g. `'docs/pe/security/mqtt-over-ssl'`
 * @param parentSlug The language-less slug for the parent to test against e.g. `'docs/pe/security'`
 */
export function isSubPage(currentPage: string, parentSlug: string): boolean {
	// Test: is there a known parent page for this page category?
	const category = getPageCategory({ pathname: '/' + currentPage + '/' });
	if (categoryParents[category] === parentSlug) return true;

	return false;
}
