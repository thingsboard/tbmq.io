import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

/**
 * Published blog posts sorted newest-first. `getCollection` returns entries in
 * load order, so every consumer would otherwise repeat the same date sort — this
 * is the one place that ordering lives. Drafts are dropped here too, so a
 * `draft: true` post disappears from every surface at once (index, post route,
 * author page, related posts, RSS, OG cards) rather than from whichever
 * consumers remembered to filter. Pass `filter` to narrow the set further
 * (e.g. by author).
 */
export async function getSortedBlogPosts(
	filter?: (post: BlogPost) => boolean,
): Promise<BlogPost[]> {
	const posts = await getCollection('blog', (post) => !post.data.draft && (filter?.(post) ?? true));
	return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
