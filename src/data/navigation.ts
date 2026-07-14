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
	{ label: 'Live Demo', href: 'https://demo.tbmq.io/signup', target: '_blank' },
	{ label: 'Docs', href: '/docs/mqtt-broker/pe/' },
	{ label: 'Performance', href: '/performance/' },
	{ label: 'Company', submenuId: 'nav-company' },
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

// All submenus
export const allSubmenus: SubMenu[] = [companySubmenu];
