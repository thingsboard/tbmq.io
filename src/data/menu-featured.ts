/** Promo links at the bottom of a menu section. A link under one list goes in `SubMenuGroup.more`. */
interface MenuPromo {
	/** A Tabler icon name. */
	icon: string;
	title: string;
	href: string;
	/** Set apart at the end of the row. */
	featured?: boolean;
}

/** Keyed by section id (`SubMenu.id`). */
export const MENU_SECTION_PROMOS: Record<string, MenuPromo[]> = {
	'nav-products': [
		{ icon: 'tabler:tag', title: 'Pricing', href: '/pricing/' },
		// Keep: this is the main menu's only link to `/installations/`.
		{ icon: 'tabler:download', title: 'Installation options', href: '/installations/' },
		{ icon: 'tabler:player-play', title: 'Try the live demo', href: '/live-demo/', featured: true },
	],
};
