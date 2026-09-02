import rss from '@astrojs/rss';
import { getSortedBlogPosts } from '@data/blog/posts';
import { getAuthor } from '~/data/blog/authors';
import type { APIContext } from 'astro';
import { BLOG_DESCRIPTION, BLOG_NAME } from '~/consts';
export async function GET(context: APIContext) {
	const sorted = await getSortedBlogPosts();

	return rss({
		title: BLOG_NAME,
		description: BLOG_DESCRIPTION,
		site: context.site!,
		items: sorted.map((post) => {
			const author = getAuthor(post.data.author);
			return {
				title: post.data.title,
				pubDate: post.data.date,
				description: post.data.description,
				link: `/blog/${post.id}/`,
				author: author?.name,
			};
		}),
		customData: '<language>en-us</language>',
	});
}
