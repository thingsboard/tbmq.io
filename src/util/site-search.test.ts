import test from 'node:test';
import assert from 'node:assert/strict';
import { googleSiteSearchUrl } from './site-search.ts';

test('Google fallback searches tbmq.io for the query', () => {
	assert.equal(googleSiteSearchUrl('mqtt qos'), 'https://www.google.com/search?q=site%3Atbmq.io%20mqtt%20qos');
});

test('Google fallback without a query searches the whole site', () => {
	assert.equal(googleSiteSearchUrl(''), 'https://www.google.com/search?q=site%3Atbmq.io');
});
