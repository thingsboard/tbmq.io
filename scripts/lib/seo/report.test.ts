import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatText, resolveDistDir, toJson } from './report.ts';
import type { AuditReport, Finding } from './types.ts';

function report(findings: Finding[]): AuditReport {
	return { generatedFor: './dist', pageCount: 3, sectionCounts: { docs: 1, mqtt: 1, other: 1 }, findings };
}

const low = (pathname: string): Finding => ({ check: 'thin-content', severity: 'low', pathname, detail: '10 words' });

test('formatText reports the page census', () => {
	const text = formatText(report([]));
	assert.match(text, /3 pages/);
	assert.match(text, /docs=1/);
	assert.match(text, /mqtt=1/);
});

test('formatText says so explicitly when there are no findings', () => {
	assert.match(formatText(report([])), /no issues found/i);
});

test('formatText groups findings by check with a count', () => {
	const text = formatText(report([low('/a/'), low('/b/')]));
	assert.match(text, /thin-content.*\b2\b/);
});

test('formatText orders high severity before low', () => {
	const text = formatText(
		report([low('/a/'), { check: 'canonical-missing', severity: 'high', pathname: '/b/', detail: 'none' }])
	);
	assert.ok(text.indexOf('canonical-missing') < text.indexOf('thin-content'));
});

test('formatText caps examples at ten and says how many were withheld', () => {
	const text = formatText(report(Array.from({ length: 14 }, (_, i) => low(`/p${i}/`))));
	assert.match(text, /and 4 more/);
	assert.ok(!text.includes('/p12/'), 'the 13th example must not be listed');
});

test('toJson is stable across calls and carries no timestamp', () => {
	const one = toJson(report([low('/a/')]));
	const two = toJson(report([low('/a/')]));
	assert.equal(one, two);
	assert.ok(!/\d{4}-\d{2}-\d{2}T/.test(one), 'an ISO timestamp would break week-over-week diffing');
	assert.deepEqual(JSON.parse(one).findings, [low('/a/')]);
});

test('resolveDistDir defaults to ./dist when the flag is absent', () => {
	assert.equal(resolveDistDir([]), './dist');
	assert.equal(resolveDistDir(['--json']), './dist');
});

test('resolveDistDir uses the given value', () => {
	assert.equal(resolveDistDir(['--dist=./other']), './other');
});

test('resolveDistDir treats an empty value as absent', () => {
	assert.equal(resolveDistDir(['--dist=']), './dist');
});

test('resolveDistDir rejects a bare --dist with no value', () => {
	assert.throws(() => resolveDistDir(['--dist']), /--dist requires a value/);
});
