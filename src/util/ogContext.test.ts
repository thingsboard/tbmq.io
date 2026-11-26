import test from 'node:test';
import assert from 'node:assert/strict';
import { getSectionLabel } from './ogContext.ts';

test('a Lite docs slug takes its section from the segment after lite/', () => {
	assert.equal(getSectionLabel('docs/lite/installation/config'), 'Installation');
	assert.equal(getSectionLabel('docs/lite/getting-started'), 'Getting Started');
	assert.equal(getSectionLabel('docs/pe/installation/docker'), 'Installation');
});
