import { learnNavTopics, topicHref } from './mqttLearn';

export interface NavItem {
	label: string;
	href?: string;
	// id of the rendered <a>. Only external analytics (the GTM container) hooks on
	// these — nothing in this repo consumes them, so check GTM before removing one.
	id?: string;
	submenuId?: string;
	items?: SubMenuItem[];
	target?: string;
	// Path prefixes that mark this item current. Overrides the href/submenu-based
	// default entirely; trailing slash optional.
	matchPrefixes?: string[];
}

export interface SubMenuItem {
	href: string;
	icon?: string;
	heading: string;
	description?: string;
	linkClass?: string;
}

export interface SubMenuGroup {
	name?: string;
	items: SubMenuItem[];
}

export interface SubMenu {
	id: string;
	className: string;
	groups: SubMenuGroup[];
}

// Main navigation items
export const mainNavItems: NavItem[] = [
	{ label: 'Product', href: '/product/' },
	{ label: 'Live Demo', href: '/live-demo/' },
	{ label: 'Performance', href: '/performance/' },
	{ label: 'Company', submenuId: 'nav-company' },
	{ label: 'Learn', href: '/mqtt/', id: 'learn-link', submenuId: 'nav-learn' },
	// matchPrefixes: href '/docs/pe/' alone would miss the CE docs tree.
	{ label: 'Docs', href: '/docs/pe/', matchPrefixes: ['/docs/'] },
	{ label: 'Blog', href: 'https://thingsboard.io/blog/', id: 'blog-link', target: '_blank' },
];

// Company submenu
export const companySubmenu: SubMenu = {
	id: 'nav-company',
	className: 'about',
	groups: [
		{
			items: [
				{
					href: '/company/',
					icon: '/src/assets/images/landings/nav/about-s-icon.svg',
					heading: 'Our company',
					linkClass: 'small-link',
				},
				{
					href: '/contact-us/',
					icon: '/src/assets/images/landings/nav/contact-s-icon.svg',
					heading: 'Contact us',
					linkClass: 'small-link',
				},
			],
		},
	],
};

// Learn submenu
export const learnSubmenu: SubMenu = {
	id: 'nav-learn',
	className: 'learn',
	groups: [
		{
			items: [
				...learnNavTopics.map((t) => ({
					href: topicHref(t.slug),
					icon: t.icon,
					heading: t.navLabel,
					linkClass: 'small-link',
				})),
				{
					href: '/mqtt/',
					icon: '/src/assets/images/landings/nav/learn-all.svg',
					heading: 'Browse all guides →',
					linkClass: 'small-link',
				},
			],
		},
	],
};

// All submenus
export const allSubmenus: SubMenu[] = [companySubmenu, learnSubmenu];
