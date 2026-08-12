import { getCollection } from 'astro:content';
import { getLanguageFromSlug } from '@util/path-utils';

export const allPages = await getCollection('docs');

export const englishPages = allPages.filter((page) => getLanguageFromSlug(page.id) === 'en');
