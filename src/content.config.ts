import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { Products } from './models/site.models';

export const baseSchema = z.object({
	type: z.literal('base').optional().default('base'),
	description: z.string().optional(),
	selfCanonical: z.boolean().optional(),
	canonicalUrl: z.string().optional(),
	customDocsTitle: z.string().optional(),
	githubURL: z.url().optional(),
	hasREADME: z.boolean().optional(),
	// Opt in to breaking long inline-code tokens mid-identifier inside this
	// page's markdown tables (Prometheus selectors, env var names, consumer
	// group ids). Off by default: without it a long token widens its column
	// and the table scrolls horizontally, which is the better default for
	// most pages. Set it only where a table's code column is unreadable
	// otherwise. See DocMarkdownContent.astro for the rule.
	wrapTableCode: z.boolean().optional(),
	hero: z
		.object({
			gridVariant: z.enum(['lines', 'dots']).optional().default('lines'),
			variant: z.enum(['default', 'simple']).optional().default('default'),
			activity: z
				.object({
					type: z.literal('dashboard'),
					product: z.enum(Products),
				})
				.optional(),
		})
		.optional(),
});

export const blogSchema = z.object({
	title: z.string(),
	description: z.string(),
	date: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
	author: z.string(),
	categories: z
		.array(z.string())
		.or(z.string())
		.transform((v) => (Array.isArray(v) ? v : [v])),
	featuredImage: z.string(),
	featuredImageAlt: z.string().default(''),
	draft: z.boolean().default(false),
	excludeFromCarousel: z.boolean().default(false),
});

export const docsCollectionSchema = baseSchema;

export type DocsEntryData = z.infer<typeof docsCollectionSchema>;

export const collections = {
	blog: defineCollection({
		loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
		schema: blogSchema,
	}),
	docs: defineCollection({
		// Default Astro slug derivation runs each path segment through `github-slugger`,
		// which strips dots (only `[a-z0-9-]` survives). Override to preserve dotted
		// filenames like `…-before-v1.7.mdx` so the URL keeps the version separator.
		// Mirrors the default behaviour for `slug:` frontmatter overrides.
		loader: docsLoader({
			generateId: ({ entry, data }) => {
				if (typeof data.slug === 'string') return data.slug;
				return entry.replace(/\.(md|mdx|mdoc)$/, '').replace(/(?:^|\/)index$/, '');
			},
		}),
		schema: docsSchema({ extend: docsCollectionSchema }),
	}),
	i18n: defineCollection({
		loader: i18nLoader(),
		schema: i18nSchema({
			extend: z.object({
				'footer.translatePage': z.string().default('Translate this page'),
			}),
		}),
	}),
};
