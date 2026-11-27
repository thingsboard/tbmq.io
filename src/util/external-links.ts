import { isExternalHref } from './external-href';

/**
 * Off-site link policy for anchors rendered from data-driven hrefs (the header's menu): a link that
 * leaves the site (`isExternalHref`) opens in a new tab with rel="noopener noreferrer"; local paths
 * get neither attribute.
 */
export { isExternalHref };

/**
 * target/rel pair for the off-site link policy. This spread is the *only*
 * source of target/rel at a call site — never pass either explicitly
 * alongside it, in any position. Astro merges duplicate attributes
 * last-one-wins for components, but on a native element it appends the spread
 * verbatim, emitting the attribute twice; the HTML parser then keeps the
 * *first* copy, so an explicit target would silently beat the derived one.
 * Spread last by convention, so every call site reads the same way.
 */
export const externalLinkAttrs = (href: string | undefined): { target?: '_blank'; rel?: string } =>
	href !== undefined && isExternalHref(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};

/**
 * Accessible name for a link that opens in a new tab — screen readers don't
 * announce target="_blank". Names the destination host when the href is
 * off-site; internal hrefs get the plain suffix.
 */
export const newTabLinkLabel = (name: string, href?: string): string =>
	href !== undefined && isExternalHref(href)
		? `${name} (opens ${new URL(href).host} in a new tab)`
		: `${name} (opens in a new tab)`;
