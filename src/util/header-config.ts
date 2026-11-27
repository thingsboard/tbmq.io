// The site header's settings, built from `BaseLayout`'s props and read by `Landing/Header.astro`; docs
// pages, which Starlight renders, take the defaults in `starlight/Header.astro`.
// Two looks: `docs` for documentation pages, `marketing` for every other page.

export type HeaderLook = 'marketing' | 'docs';

export type HeaderHero = 'dark' | 'light';

export interface HeaderConfig {
	look: HeaderLook;
	hero?: HeaderHero;
	search: boolean;
	/** The theme switch. Off on pages pinned to the light theme, where it would do nothing. */
	themeToggle: boolean;
}

export interface HeaderConfigInput {
	look?: HeaderLook;
	hero?: HeaderHero;
	search?: boolean;
	themeToggle?: boolean;
}

export function resolveHeaderConfig(input: HeaderConfigInput = {}): HeaderConfig {
	const look = input.look ?? 'docs';
	return {
		look,
		hero: look === 'marketing' ? input.hero : undefined,
		// Docs pages search by default; a marketing page asks for it (the blog does).
		search: input.search ?? look === 'docs',
		themeToggle: input.themeToggle ?? true,
	};
}
