// The site header's menu: the row of items and the section each one opens. The shape is the
// upstream ThingsBoard site's, so `SiteMenu` stays the same code on both sites.
//
// Relative specifiers ending in `.ts`, not the `@`/`~` aliases: `menu-model.test.ts`
// loads this chain under `node --test`, which resolves no tsconfig paths.
import { learnNavTopics, topicHref } from './mqttLearn.ts';
import { BADGE_TILE, type MenuBadgeKey } from './product-badges.ts';

export interface NavItem {
	label: string;
	/** Absent on an item that only opens a section. */
	href?: string;
	submenuId?: string;
	// DOM id for analytics (`Menu_Pricing`). Only the GTM container hooks on these, nothing in this
	// repo does, so check GTM before removing one. `SiteMenu` keeps the id on whichever copy of the
	// link shows.
	id?: string;
	/** Extra class on the rendered link, e.g. `gtm_button` for GTM tracking. */
	linkClass?: string;
}

export interface SubMenuItem {
	href: string;
	/** Path under /src/assets/images/landings/nav/, drawn by `NavIcon`. */
	icon?: string;
	/** A product tile (`ProductTile`), shown instead of `icon`. */
	badge?: MenuBadgeKey;
	heading: string;
	description?: string;
	/** A short label after the heading, e.g. `Beta`. */
	tag?: string;
	/** DOM id for analytics; a section's content is in the page once, so the id is too. */
	id?: string;
	linkClass?: string;
}

export interface SubMenuGroup {
	/** Column heading, shown above the first column only. Omit for an unlabelled group. */
	name?: string;
	/** Items per column (a list takes at most 3 columns). Omit for one column. */
	perColumn?: number;
	items: SubMenuItem[];
	/** A link under the list, such as "Browse all guides". */
	more?: { label: string; href: string; id?: string };
}

export interface SubMenu {
	id: string;
	groups: SubMenuGroup[];
	/**
	 * Path prefixes that belong to this section whatever its links say: the section's item is
	 * marked current on them, and no other section is (see `inSection`).
	 */
	owns?: string[];
}

/** A section's icon size in px: the product tile's where it has tiles, as tall as a link's two lines. */
export const submenuIconSize = (submenu: SubMenu) =>
	submenu.groups.some((group) => group.items.some((item) => item.badge)) ? BADGE_TILE : 24;

export const mainNavItems: NavItem[] = [
	{ label: 'Products', submenuId: 'nav-products' },
	{ label: 'Live Demo', href: '/live-demo/' },
	{ label: 'Performance', href: '/performance/' },
	{ label: 'Company', submenuId: 'nav-company' },
	{ label: 'Learn', submenuId: 'nav-learn' },
	{ label: 'Docs', submenuId: 'nav-docs' },
	{ label: 'Blog', href: '/blog/', id: 'blog-link' },
	{ label: 'Pricing', href: '/pricing/', id: 'Menu_Pricing', linkClass: 'gtm_button' },
];

const productsSubmenu: SubMenu = {
	id: 'nav-products',
	// The installations hub is linked from the section's promo row, and the legal pages sit under /product/.
	owns: ['/product/', '/installations/'],
	groups: [
		{
			name: 'MQTT broker',
			perColumn: 1,
			items: [
				{ href: '/product/', heading: 'TBMQ', description: 'Scalable MQTT broker', badge: 'tbmq' },
				{
					href: '/product/lite/',
					heading: 'TBMQ Lite',
					description: 'Single-container MQTT broker',
					badge: 'tbmq-lite',
					tag: 'Beta',
				},
			],
		},
	],
};

const companySubmenu: SubMenu = {
	id: 'nav-company',
	groups: [
		{
			items: [
				{
					href: 'https://thingsboard.io/company/',
					icon: '/src/assets/images/landings/nav/about-s-icon.svg',
					heading: 'Our company',
				},
				{
					href: '/contact-us/',
					icon: '/src/assets/images/landings/nav/contact-s-icon.svg',
					heading: 'Contact us',
				},
			],
		},
	],
};

const learnSubmenu: SubMenu = {
	id: 'nav-learn',
	// Every guide, including the ones the section does not list.
	owns: ['/mqtt/'],
	groups: [
		{
			name: 'MQTT guides',
			perColumn: 3,
			items: learnNavTopics.map((t) => ({
				href: topicHref(t.slug),
				icon: t.icon,
				heading: t.navLabel,
			})),
			// The hub link: "Learn" itself only opens the section.
			more: { label: 'Browse all guides', href: '/mqtt/', id: 'learn-link' },
		},
	],
};

const docsSubmenu: SubMenu = {
	id: 'nav-docs',
	// Every docs page, including the Community tree that neither tile links to.
	owns: ['/docs/'],
	groups: [
		{
			name: 'MQTT broker',
			perColumn: 1,
			items: [
				{ href: '/docs/pe/', heading: 'TBMQ', description: 'Scalable MQTT broker', badge: 'tbmq' },
				{
					href: '/docs/lite/',
					heading: 'TBMQ Lite',
					description: 'Single-container MQTT broker',
					badge: 'tbmq-lite',
					tag: 'Beta',
				},
			],
		},
	],
};

export const allSubmenus: SubMenu[] = [productsSubmenu, companySubmenu, learnSubmenu, docsSubmenu];
