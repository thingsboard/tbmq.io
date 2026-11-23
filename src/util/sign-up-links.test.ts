import test from 'node:test';
import assert from 'node:assert/strict';
import { isSignUpLink } from './sign-up-links.ts';

const link = (href: string) => new URL(href);

test('License Portal sign-up and login pages are sign-up links', () => {
	for (const path of ['/', '/signup', '/signup/', '/login']) {
		assert.equal(isSignUpLink(link(`https://license.thingsboard.io${path}`)), true, path);
	}
});

test('other License Portal paths are not sign-up links', () => {
	assert.equal(isSignUpLink(link('https://license.thingsboard.io/api/v1/x')), false);
});

test('ThingsBoard Cloud and tbmq.io links are not sign-up links', () => {
	assert.equal(isSignUpLink(link('https://thingsboard.cloud/signup')), false);
	assert.equal(isSignUpLink(link('https://tbmq.io/')), false);
});
