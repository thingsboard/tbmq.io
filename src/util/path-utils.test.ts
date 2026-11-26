import test from 'node:test';
import assert from 'node:assert/strict';
import { Products, docsLink } from '../models/site.models.ts';
import {
	getPageSlugFromURL,
	getProductTitleName,
	getVersionBaseURL,
	getVersionFromSlug,
	getVersionFromURL,
	linkMatchesVersion,
	switchVersionWithFallback,
} from './path-utils.ts';

const IDS = new Set([
	'docs',
	'docs/getting-started',
	'docs/installation',
	'docs/installation/config',
	'docs/user-guide/qos',
	'docs/pe',
	'docs/pe/getting-started',
	'docs/pe/installation',
	'docs/pe/installation/config',
	'docs/lite',
	'docs/lite/getting-started',
	'docs/lite/installation',
	'docs/lite/installation/config',
	'docs/lite/guarantees-and-limits',
]);

test('a /docs/lite/ URL belongs to TBMQ Lite', () => {
	assert.equal(getVersionFromURL('/docs/lite/'), Products.TBMQ_LITE);
	assert.equal(getVersionFromURL('/docs/lite'), Products.TBMQ_LITE);
	assert.equal(getVersionFromURL('/docs/lite/installation/config/'), Products.TBMQ_LITE);
	assert.equal(getVersionFromSlug('docs/lite'), Products.TBMQ_LITE);
	assert.equal(getVersionFromSlug('docs/lite/getting-started'), Products.TBMQ_LITE);
});

test('other docs URLs keep their product', () => {
	assert.equal(getVersionFromURL('/docs/'), Products.TBMQ);
	assert.equal(getVersionFromURL('/docs/literal/'), Products.TBMQ);
	assert.equal(getVersionFromURL('/docs/pe/installation/'), Products.TBMQ_PE);
	assert.equal(getVersionFromSlug('docs/getting-started'), Products.TBMQ);
	assert.equal(getVersionFromSlug('docs/pe'), Products.TBMQ_PE);
});

test('the page slug drops the product prefix', () => {
	assert.equal(getPageSlugFromURL('/docs/lite/installation/config/'), 'installation/config');
	assert.equal(getPageSlugFromURL('/docs/lite/'), '');
	assert.equal(getPageSlugFromURL('/docs/pe/installation/'), 'installation');
	assert.equal(getPageSlugFromURL('/docs/installation/'), 'installation');
});

test('switching product keeps the page when the target has it', () => {
	assert.equal(
		switchVersionWithFallback('/docs/getting-started/', Products.TBMQ_LITE, IDS),
		'/docs/lite/getting-started/'
	);
	assert.equal(
		switchVersionWithFallback('/docs/lite/installation/config/', Products.TBMQ, IDS),
		'/docs/installation/config/'
	);
	assert.equal(
		switchVersionWithFallback('/docs/lite/installation/', Products.TBMQ_PE, IDS),
		'/docs/pe/installation/'
	);
});

test('switching product falls back to the docs home', () => {
	assert.equal(switchVersionWithFallback('/docs/lite/guarantees-and-limits/', Products.TBMQ, IDS), '/docs/');
	assert.equal(switchVersionWithFallback('/docs/lite/guarantees-and-limits/', Products.TBMQ_PE, IDS), '/docs/pe/');
	assert.equal(switchVersionWithFallback('/docs/user-guide/qos/', Products.TBMQ_LITE, IDS), '/docs/lite/');
	assert.equal(switchVersionWithFallback('/docs/lite/', Products.TBMQ, IDS), '/docs/');
});

test('sidebar links are split by product', () => {
	assert.equal(linkMatchesVersion('/docs/lite/installation/', Products.TBMQ_LITE), true);
	assert.equal(linkMatchesVersion('/docs/lite/installation/', Products.TBMQ), false);
	assert.equal(linkMatchesVersion('/docs/lite/installation/', Products.TBMQ_PE), false);
	assert.equal(linkMatchesVersion('/docs/installation/', Products.TBMQ), true);
	assert.equal(linkMatchesVersion('/docs/installation/', Products.TBMQ_LITE), false);
	assert.equal(linkMatchesVersion('/docs/pe/installation/', Products.TBMQ_PE), true);
	assert.equal(linkMatchesVersion('/docs/pe/installation/', Products.TBMQ_LITE), false);
});

test('Lite docs links, base URL and title name', () => {
	assert.equal(
		docsLink(Products.TBMQ_LITE, 'installation/config#metrics'),
		'/docs/lite/installation/config/#metrics'
	);
	assert.equal(getVersionBaseURL(Products.TBMQ_LITE), '/docs/lite/');
	assert.equal(getProductTitleName(Products.TBMQ_LITE), 'TBMQ Lite');
});
