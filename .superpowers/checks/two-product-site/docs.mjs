/* eslint-disable no-undef -- Node and browser globals: these scripts run outside the site code the lint config describes */
// node docs.mjs — the docs picker (edition pills + product row), sidebars and pagination.
// env SHOT=<dir> also saves the open popover in the dark theme.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { check, done, go, sleep, swipe, withPage } from './lib.mjs';

const SELF = Symbol('self');
// [page, Community pill, Professional pill, TBMQ option, TBMQ Lite option]
const MATRIX = [
	['/docs/lite/', '/docs/', '/docs/pe/', '/docs/', '/docs/lite/'],
	['/docs/lite/getting-started/', '/docs/getting-started/', '/docs/pe/getting-started/', '/docs/getting-started/', SELF],
	['/docs/lite/guarantees-and-limits/', '/docs/', '/docs/pe/', '/docs/', SELF],
	['/docs/lite/lite-vs-tbmq/', '/docs/', '/docs/pe/', '/docs/', SELF],
	['/docs/lite/installation/', '/docs/installation/', '/docs/pe/installation/', '/docs/installation/', SELF],
	[
		'/docs/lite/installation/config/',
		'/docs/installation/config/',
		'/docs/pe/installation/config/',
		'/docs/installation/config/',
		SELF,
	],
	['/docs/lite/installation/backup-and-restore/', '/docs/', '/docs/pe/', '/docs/', SELF],
	['/docs/getting-started/', SELF, '/docs/pe/getting-started/', SELF, '/docs/lite/getting-started/'],
	['/docs/installation/', SELF, '/docs/pe/installation/', SELF, '/docs/lite/installation/'],
	['/docs/installation/config/', SELF, '/docs/pe/installation/config/', SELF, '/docs/lite/installation/config/'],
	['/docs/user-guide/qos/', SELF, '/docs/pe/user-guide/qos/', SELF, '/docs/lite/'],
];

/** Everything the assertions need, read in one evaluate. The popover may have been moved to <body>. */
const readPicker = () => {
	const pill = (label) =>
		[...document.querySelectorAll('.ps-pill')].find((a) => a.textContent.trim() === label) ?? null;
	const option = (label) =>
		[...document.querySelectorAll('#ps-variants [role="option"]')].find(
			(a) => a.querySelector('.ps-item-name')?.firstChild?.textContent.trim() === label
		) ?? null;
	const attr = (el, name) => (el ? el.getAttribute(name) : null);
	const region = document.querySelector('button.ps-region');
	return {
		community: attr(pill('Community'), 'href'),
		communityActive: pill('Community')?.classList.contains('is-active') ?? false,
		communityCurrent: attr(pill('Community'), 'aria-current'),
		professional: attr(pill('Professional'), 'href'),
		tbmq: attr(option('TBMQ'), 'href'),
		lite: attr(option('TBMQ Lite'), 'href'),
		hasRegion: !!region,
		regionLabel: region?.querySelector('.ps-region-label')?.textContent.trim() ?? null,
		tabs: [...document.querySelectorAll('.tab-item a')].map((a) => a.textContent.trim()),
		// The picker sits inside the sidebar and links to the other products by design: not navigation.
		sidebarDocs: [...document.querySelectorAll('#starlight__sidebar a[href^="/docs/"]')]
			.filter((a) => !a.closest('product-selector'))
			.map((a) => a.getAttribute('href')),
		pagination: [...document.querySelectorAll('.pagination-links a')].map((a) => a.getAttribute('href')),
	};
};

await withPage({ width: 1440 }, async (page) => {
	for (const [path, community, professional, tbmq, lite] of MATRIX) {
		await go(page, path);
		const r = await page.evaluate(readPicker);
		const want = (v) => (v === SELF ? path : v);
		const isLite = path.startsWith('/docs/lite/');
		check(`picker ${path} Community pill`, r.community === want(community), `got ${r.community}`);
		check(`picker ${path} Professional pill`, r.professional === want(professional), `got ${r.professional}`);
		check(`picker ${path} TBMQ option`, r.tbmq === want(tbmq), `got ${r.tbmq}`);
		check(`picker ${path} TBMQ Lite option`, r.lite === want(lite), `got ${r.lite}`);
		check(`picker ${path} Community pill is active`, r.communityActive);
		check(
			`picker ${path} product row`,
			r.hasRegion && r.regionLabel === (isLite ? 'TBMQ Lite' : 'TBMQ'),
			`row=${r.hasRegion} label=${r.regionLabel}`
		);
		check(
			`picker ${path} aria-current`,
			r.communityCurrent === (isLite ? 'true' : 'page'),
			`got ${r.communityCurrent}`
		);
		if (isLite) {
			check(`sidebar ${path} tabs`, r.tabs.join(', ') === 'Getting Started, Installation', r.tabs.join(', '));
			const foreign = r.sidebarDocs.filter((h) => !h.startsWith('/docs/lite/'));
			check(`sidebar ${path} only Lite links`, r.sidebarDocs.length > 0 && foreign.length === 0, foreign.join(' '));
			if (path !== '/docs/lite/') {
				const out = r.pagination.filter((h) => !h.startsWith('/docs/lite/'));
				check(`pagination ${path} stays in Lite`, r.pagination.length > 0 && out.length === 0, r.pagination.join(' '));
			}
		}
	}

	// Professional: no product row, and its pills still switch edition.
	await go(page, '/docs/pe/getting-started/');
	const pe = await page.evaluate(readPicker);
	check('picker PE has no product row', !pe.hasRegion);
	check('picker PE Community pill', pe.community === '/docs/getting-started/', `got ${pe.community}`);

	// Community and PE sidebars carry no Lite entry.
	for (const path of ['/docs/installation/', '/docs/pe/installation/']) {
		await go(page, path);
		const n = await page.evaluate(
			() =>
				[...document.querySelectorAll('#starlight__sidebar a[href^="/docs/lite/"]')].filter(
					(a) => !a.closest('product-selector')
				).length
		);
		check(`sidebar ${path} has no Lite link`, n === 0, `${n} found`);
	}

	// Keyboard.
	await go(page, '/docs/lite/installation/');
	const state = () =>
		page.evaluate(() => {
			const pop = document.getElementById('ps-variants');
			const options = pop ? [...pop.querySelectorAll('[role="option"]')] : [];
			return {
				open: !!pop && !pop.hidden,
				focusedOption: options.indexOf(document.activeElement),
				onButton: document.activeElement === document.querySelector('button.ps-region'),
				expanded: document.querySelector('button.ps-region')?.getAttribute('aria-expanded'),
			};
		});
	const hasRow = await page.$('button.ps-region');
	if (!hasRow) {
		check('keyboard', false, 'no button.ps-region');
	} else {
		await page.focus('button.ps-region');
		await page.keyboard.press('Enter');
		let s = await state();
		check('keyboard Enter opens and focuses the first option', s.open && s.focusedOption === 0, JSON.stringify(s));
		await page.keyboard.press('ArrowDown');
		s = await state();
		check('keyboard ArrowDown moves to the second option', s.focusedOption === 1, JSON.stringify(s));
		await page.keyboard.press('Escape');
		s = await state();
		check('keyboard Escape closes and returns focus', !s.open && s.onButton && s.expanded === 'false', JSON.stringify(s));

		await page.click('button.ps-region');
		s = await state();
		check('click opens', s.open && s.expanded === 'true', JSON.stringify(s));
		await page.mouse.click(900, 500);
		s = await state();
		check('click outside closes', !s.open, JSON.stringify(s));
	}
});

// On a phone the sidebar is a popover in the browser's top layer; the product list has to open over it.
await withPage({ width: 390, height: 844, touch: true }, async (page) => {
	await go(page, '/docs/getting-started/');
	await page.evaluate(() => document.getElementById('starlight__sidebar').showPopover());
	await sleep(300);
	const state = () =>
		page.evaluate(() => {
			const pop = document.getElementById('ps-variants');
			const r = pop.getBoundingClientRect();
			const hit = r.width ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
			return {
				open: !pop.hidden,
				onTop: !!hit && pop.contains(hit),
				sidebarOpen: document.getElementById('starlight__sidebar').matches(':popover-open'),
				onButton: document.activeElement === document.querySelector('button.ps-region'),
			};
		});
	await page.click('button.ps-region');
	await sleep(200);
	let s = await state();
	check('phone: the product list opens over the open sidebar', s.open && s.onTop && s.sidebarOpen, JSON.stringify(s));
	await page.focus('#ps-variants [role="option"]');
	await page.keyboard.press('Escape');
	await sleep(200);
	s = await state();
	check('phone: Escape closes the list and leaves the sidebar open', !s.open && s.sidebarOpen && s.onButton, JSON.stringify(s));
	await page.click('button.ps-region');
	await sleep(200);
	await Promise.all([
		page.waitForNavigation(),
		page.evaluate(() => document.querySelector('#ps-variants [role="option"]:not(.is-active)').click()),
	]);
	check('phone: choosing TBMQ Lite opens its docs', new URL(page.url()).pathname.startsWith('/docs/lite/'), page.url());
});

// The list is a manual popover, which the browser does not close with the sidebar it sits in. A list
// left open would also read as a layer over the page and switch the edge swipes off.
await withPage({ width: 390, height: 844, touch: true }, async (page) => {
	await go(page, '/docs/getting-started/');
	const state = () =>
		page.evaluate(() => {
			const pop = document.getElementById('ps-variants');
			return {
				listOpen: !pop.hidden || pop.matches(':popover-open'),
				expanded: document.querySelector('button.ps-region').getAttribute('aria-expanded'),
				sidebar: document.getElementById('starlight__sidebar').matches(':popover-open'),
				sheet: document.querySelector('header.header').hasAttribute('data-sm-open'),
			};
		});
	// Opens the sidebar itself when a failed step left it closed, so each check below stands on its own.
	const openList = async () => {
		await page.evaluate(() => {
			const sidebar = document.getElementById('starlight__sidebar');
			if (!sidebar.matches(':popover-open')) sidebar.showPopover();
		});
		await sleep(300);
		// A list left open by a failed step stays as it is: a click would close it.
		const expanded = await page.evaluate(
			() => document.querySelector('button.ps-region').getAttribute('aria-expanded') === 'true'
		);
		if (!expanded) await page.click('button.ps-region');
		await page.focus('button.ps-region');
		await sleep(200);
	};
	await openList();
	let s = await state();
	check('phone: the list is open in the open sidebar', s.listOpen && s.sidebar, JSON.stringify(s));
	await swipe(page, 300, 100);
	s = await state();
	check(
		'phone: a swipe that closes the sidebar closes the list with it',
		!s.sidebar && !s.listOpen && s.expanded === 'false',
		JSON.stringify(s)
	);
	await swipe(page, 5, 200);
	s = await state();
	check('phone: a swipe from the left edge then opens the sidebar again', s.sidebar && !s.listOpen, JSON.stringify(s));

	// Escape with focus outside the list and its button goes to the browser, which closes the sidebar.
	await openList();
	await page.keyboard.press('Tab');
	await page.keyboard.press('Escape');
	await sleep(300);
	s = await state();
	check(
		'phone: Escape from elsewhere in the sidebar closes the list with it',
		!s.sidebar && !s.listOpen && s.expanded === 'false',
		JSON.stringify(s)
	);
	await swipe(page, 385, 200);
	s = await state();
	check('phone: a swipe from the right edge then opens the menu sheet', s.sheet, JSON.stringify(s));
});

// On desktop the open list is a dropdown beside its button, not a layer over the page: the search
// shortcut still works with it open.
await withPage({ width: 1440 }, async (page) => {
	await page.setRequestInterception(true);
	page.on('request', (r) => (/cse\.google\.com/.test(r.url()) ? r.abort() : r.continue()));
	await go(page, '/docs/getting-started/');
	await page.click('button.ps-region');
	await sleep(200);
	const listOpen = () => page.evaluate(() => !document.getElementById('ps-variants').hidden);
	check('desktop: the list is open', await listOpen());
	const prevented = await page.evaluate(() => {
		const e = new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', ctrlKey: true, bubbles: true, cancelable: true });
		document.activeElement.dispatchEvent(e);
		return e.defaultPrevented;
	});
	await sleep(300);
	const searchOpen = await page.evaluate(() => !!document.querySelector('#tb-search-modal.open'));
	check(
		'desktop: Ctrl K with the list open opens search and closes the list',
		prevented && searchOpen && !(await listOpen()),
		JSON.stringify({ prevented, searchOpen })
	);
});

if (process.env.SHOT) {
	mkdirSync(process.env.SHOT, { recursive: true });
	for (const dark of [true, false]) {
		await withPage({ width: 1440, dark }, async (page) => {
			await go(page, '/docs/lite/installation/', 'networkidle2');
			if (await page.$('button.ps-region')) await page.click('button.ps-region');
			await sleep(300);
			const file = join(process.env.SHOT, `picker-open${dark ? '+dark' : ''}@1440.png`);
			await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 760, height: 520 } });
			console.log(file);
		});
	}
}

done();
