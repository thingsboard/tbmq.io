import { learnNavTopics, topicHref } from './mqttLearn';

export interface NavItem {
	label: string;
	href?: string;
	submenuId?: string;
	items?: SubMenuItem[];
	target?: string;
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
	{ label: 'Learn', href: '/mqtt/', submenuId: 'nav-learn' },
	{ label: 'Docs', href: '/docs/pe/' },
	{ label: 'Blog', href: '/blog/' },
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
