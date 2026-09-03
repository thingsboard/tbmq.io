export const BLOG_CATEGORIES = [
	'guides',
	'tech',
	'updates',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<BlogCategory, string> = {
	guides: 'Guides',
	tech: 'Tech',
	updates: 'Updates',
};
