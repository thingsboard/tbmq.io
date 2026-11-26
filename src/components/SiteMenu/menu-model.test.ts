import test from 'node:test';
import assert from 'node:assert/strict';
import { MENU_ENTRIES, MENU_SECTIONS, inSection, isHere } from './menu-model.ts';

const section = (id: string) => MENU_SECTIONS.find((s) => s.sub.id === id)!.sub;
const hrefs = (id: string) => section(id).groups.flatMap((g) => g.items.map((i) => i.href));

test('the menu row, in order', () => {
	assert.deepEqual(
		MENU_ENTRIES.map((e) => e.item.label),
		['Products', 'Live Demo', 'Performance', 'Company', 'Learn', 'Docs', 'Blog', 'Pricing']
	);
	assert.deepEqual(
		MENU_SECTIONS.map((s) => s.sub.id),
		['nav-products', 'nav-company', 'nav-learn', 'nav-docs']
	);
});

test('Products and Docs list both products, Lite marked Beta', () => {
	assert.deepEqual(hrefs('nav-products'), ['/product/', '/product/lite/']);
	assert.deepEqual(hrefs('nav-docs'), ['/docs/pe/', '/docs/lite/']);
	for (const id of ['nav-products', 'nav-docs']) {
		const [tbmq, lite] = section(id).groups[0]!.items;
		assert.deepEqual([tbmq!.tile, tbmq!.badge, lite!.tile, lite!.badge], ['tbmq', undefined, 'tbmq-lite', 'Beta']);
	}
	assert.deepEqual(
		section('nav-products').promos!.map((p) => [p.href, !!p.featured]),
		[
			['/pricing/', false],
			['/installations/', false],
			['/live-demo/', true],
		]
	);
	assert.equal(section('nav-docs').promos, undefined);
});

test('Products is current on the product pages and the installations hub', () => {
	for (const p of ['/product/', '/product/lite/', '/product/privacy-policy/', '/installations/'])
		assert.equal(inSection(p, section('nav-products')), true, p);
	for (const p of ['/pricing/', '/live-demo/', '/docs/lite/', '/'])
		assert.equal(inSection(p, section('nav-products')), false, p);
});

test('Docs is current on every docs page, Lite included', () => {
	for (const p of ['/docs/', '/docs/pe/security/overview/', '/docs/lite/installation/config/', '/docs/search/'])
		assert.equal(inSection(p, section('nav-docs')), true, p);
});

test('Learn and Company are current below their own links only', () => {
	assert.equal(inSection('/mqtt/', section('nav-learn')), true);
	assert.equal(inSection('/mqtt/qos/', section('nav-learn')), true);
	assert.equal(inSection('/contact-us/', section('nav-company')), true);
	assert.equal(inSection('/contact-us-thanks/', section('nav-company')), false);
});

test('no page marks two sections', () => {
	for (const p of [
		'/',
		'/product/lite/',
		'/installations/',
		'/docs/lite/',
		'/mqtt/qos/',
		'/contact-us/',
		'/pricing/',
		'/blog/x/',
	])
		assert.ok(MENU_SECTIONS.filter((s) => inSection(p, s.sub)).length <= 1, p);
});

test('plain links and their analytics ids', () => {
	const byLabel = Object.fromEntries(MENU_ENTRIES.map((e) => [e.item.label, e.item]));
	assert.deepEqual(
		[byLabel['Pricing']!.href, byLabel['Pricing']!.id, byLabel['Pricing']!.linkClass],
		['/pricing/', 'Menu_Pricing', 'gtm_button']
	);
	assert.deepEqual([byLabel['Blog']!.href, byLabel['Blog']!.id], ['/blog/', 'blog-link']);
	assert.equal(byLabel['Learn']!.href, undefined);
	assert.equal(
		section('nav-learn')
			.groups.flatMap((g) => g.items)
			.find((i) => i.href === '/mqtt/')!.id,
		'learn-link'
	);
	assert.equal(isHere('/pricing/', '/pricing/'), true);
	assert.equal(isHere('/pricing/', '/'), false);
});
