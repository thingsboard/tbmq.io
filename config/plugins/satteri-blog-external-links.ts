import type { HastPluginDefinition } from 'satteri';
import { isExternalHref } from '../../src/util/external-href';
import { isBlogPost } from './blog-scope';

/**
 * Sätteri hast plugin for blog-post body links (scoped to `src/content/blog/`):
 * off-site links open in a new tab, internal ones navigate in place. Links that
 * already declare a `target` are left as authored.
 *
 * Blog-only on purpose — the docs keep Starlight's default same-tab links, and
 * the marketing landings have their own, broader rule (`OpenContentLinksInNewTab`).
 */
export function satteriBlogExternalLinks(): HastPluginDefinition {
	return {
		name: 'blog-external-links',
		element: {
			filter: ['a'],
			visit: (node, ctx) => {
				if (!isBlogPost(ctx)) return;
				const props = node.properties ?? {};
				if (props.target != null) return;
				const href = typeof props.href === 'string' ? props.href : '';
				if (!isExternalHref(href)) return;
				ctx.setProperty(node, 'target', '_blank');
				ctx.setProperty(node, 'rel', 'noopener noreferrer');
			},
		},
	};
}
