// The site header's menu: the row of items and the section each dropdown opens.
//
// Relative specifiers ending in `.ts`, not the `@`/`~` aliases: `menu-model.test.ts`
// loads this chain under `node --test`, which resolves no tsconfig paths.
import { learnNavTopics, topicHref } from './mqttLearn.ts';

export interface NavItem {
	label: string;
	/** Absent on an item that only opens a section. */
	href?: string;
	// id of the rendered link. Only external analytics (the GTM container) hooks on
	// these — nothing in this repo consumes them, so check GTM before removing one.
	id?: string;
	linkClass?: string;
	submenuId?: string;
}

export interface SubMenuItem {
	href: string;
	heading: string;
	description?: string;
	/** Path under /src/assets/images/landings/nav/, drawn by `NavIcon`. */
	icon?: string;
	/** A product tile instead of an icon. */
	tile?: 'tbmq' | 'tbmq-lite';
	badge?: string;
	id?: string;
	linkClass?: string;
	target?: '_blank';
}

export interface SubMenuGroup {
	name?: string;
	items: SubMenuItem[];
}

/** A link in the row under a section's groups. `icon` is a Tabler icon name. */
export interface MenuPromo {
	label: string;
	href: string;
	icon: string;
	/** Set apart at the end of the row. */
	featured?: boolean;
}

export interface SubMenu {
	id: string;
	groups: SubMenuGroup[];
	promos?: MenuPromo[];
	/**
	 * Path prefixes that belong to this section whatever its links say: the section's item is
	 * marked current on them, and no other section is.
	 */
	owns?: string[];
}

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
	// The installations hub has no link among the tiles, and the legal pages sit under /product/.
	owns: ['/product/', '/installations/'],
	groups: [
		{
			name: 'MQTT broker',
			items: [
				{ href: '/product/', heading: 'TBMQ', description: 'Scalable MQTT broker', tile: 'tbmq' },
				{
					href: '/product/lite/',
					heading: 'TBMQ Lite',
					description: 'Single-container MQTT broker',
					tile: 'tbmq-lite',
					badge: 'Beta',
				},
			],
		},
	],
	promos: [
		{ label: 'Pricing', href: '/pricing/', icon: 'tabler:tag' },
		{ label: 'Installation options', href: '/installations/', icon: 'tabler:download' },
		{ label: 'Try the live demo', href: '/live-demo/', icon: 'tabler:player-play', featured: true },
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
					target: '_blank',
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
	groups: [
		{
			items: [
				...learnNavTopics.map((t) => ({
					href: topicHref(t.slug),
					icon: t.icon,
					heading: t.navLabel,
				})),
				{
					href: '/mqtt/',
					icon: '/src/assets/images/landings/nav/learn-all.svg',
					heading: 'Browse all guides →',
					// The hub link: "Learn" itself only opens the section.
					id: 'learn-link',
				},
			],
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
			items: [
				{ href: '/docs/pe/', heading: 'TBMQ', description: 'Scalable MQTT broker', tile: 'tbmq' },
				{
					href: '/docs/lite/',
					heading: 'TBMQ Lite',
					description: 'Single-container MQTT broker',
					tile: 'tbmq-lite',
					badge: 'Beta',
				},
			],
		},
	],
};

export const allSubmenus: SubMenu[] = [productsSubmenu, companySubmenu, learnSubmenu, docsSubmenu];
