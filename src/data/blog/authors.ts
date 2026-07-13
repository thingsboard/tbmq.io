export interface BlogAuthor {
	slug: string;
	name: string;
	role?: string;
	avatar: string;
	bio?: string;
}

export const BLOG_AUTHORS: BlogAuthor[] = [
	{
		slug: 'dlandiak',
		name: 'Dima Landiak',
		avatar: 'https://secure.gravatar.com/avatar/b79cef1565d16ade3779b0cf9495e7ec?s=96&d=mm&r=g',
	},
	{
		slug: 'dmytro-shvaika',
		name: 'Dmytro Shvaika',
		avatar: 'https://secure.gravatar.com/avatar/3cf9c662bfe484e5d580ba302e42640d?s=96&d=mm&r=g',
	},
	{
		slug: 'yevheniia-havrysh',
		name: 'Yevheniia Havrysh',
		avatar: 'https://secure.gravatar.com/avatar/c58a7f724eb8aa3a3295035a341cfdb2?s=96&d=mm&r=g',
	},
];

export function getAuthor(slug: string): BlogAuthor | undefined {
	return BLOG_AUTHORS.find((a) => a.slug === slug);
}
