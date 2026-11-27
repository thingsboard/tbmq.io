/* eslint-disable no-undef -- Node and browser globals: these scripts run outside the site code the lint config describes */
// node header.mjs [menu] [bar] [sheet] [dialog] — the site header: the desktop menu, the bar around it,
// the phone and tablet menu sheet, and the "Try for free" dialog.
// env SHOT=<dir> also saves the open Products and Learn panels, the sheet and the dialog.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { check, done, go, sleep, withPage } from './lib.mjs';

const parts = process.argv.slice(2);
const want = (name) => parts.length === 0 || parts.includes(name);

const LABELS = ['Products', 'Live Demo', 'Performance', 'Company', 'Learn', 'Docs', 'Blog', 'Pricing'];
const TRIGGER = (id) => `nav.sm [data-sm-trigger="${id}"]`;
const TRY = 'header.header .head-buttons .try';
const TOGGLE = 'header.header [data-sm-toggle]';
// The notice sits over the bottom of the page and would take the taps meant for the sheet's foot.
const quiet = (page) => page.addStyleTag({ content: 'astro-dev-toolbar,#cookie-banner{display:none!important}' });

async function shot(page, name) {
	if (!process.env.SHOT) return;
	mkdirSync(process.env.SHOT, { recursive: true });
	await sleep(400);
	await page.screenshot({ path: join(process.env.SHOT, `${name}.png`) });
}

/** The desktop panel: which section shows, and what the header says about it. */
const panelState = (page) =>
	page.evaluate(() => {
		const shown = (el) => !!el && !el.closest('[hidden]') && el.getClientRects().length > 0;
		const panel = document.querySelector('[data-sm-one]');
		const section = [...document.querySelectorAll('[data-sm-panel]')].find(shown);
		return {
			open: shown(panel),
			section: section?.dataset.smPanel ?? null,
			links: section ? [...section.querySelectorAll('a')].filter(shown).map((a) => a.getAttribute('href')) : [],
			expanded: [...document.querySelectorAll('[data-sm-trigger][aria-expanded="true"]')].map((t) => t.dataset.smTrigger),
			headerOpen: document.querySelector('header.header').hasAttribute('data-sm-desktop-open'),
			focus: document.activeElement?.getAttribute('data-sm-trigger') ?? document.activeElement?.getAttribute('href') ?? null,
		};
	});

const sheetState = (page) =>
	page.evaluate(() => {
		const shown = (el) => !!el && !el.closest('[hidden]') && el.getClientRects().length > 0;
		const sheet = document.querySelector('[data-sm-sheet]');
		const header = document.querySelector('header.header');
		return {
			open: shown(sheet),
			view: sheet.dataset.view,
			headerOpen: header.hasAttribute('data-sm-open'),
			rootMarked: document.documentElement.hasAttribute('data-sm-sheet-open'),
			expanded: header.querySelector('[data-sm-toggle]').getAttribute('aria-expanded'),
			locked: getComputedStyle(document.documentElement).overflow === 'hidden',
			top: Math.round(sheet.getBoundingClientRect().top),
			barBottom: Math.round(header.querySelector('.logo-burger').getBoundingClientRect().bottom),
		};
	});

const headerPaint = (page) =>
	page.evaluate(() => {
		const header = document.querySelector('header.header');
		const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(header).backgroundColor);
		const p = m ? m[1].split(/[,/\s]+/).filter(Boolean).map(Number) : [0, 0, 0, 0];
		return {
			alpha: p.length > 3 ? p[3] : 1,
			dark: p[0] + p[1] + p[2] < 150,
			ink: getComputedStyle(header.querySelector('.sm__top')).color,
			scrolled: header.hasAttribute('data-header-scrolled'),
			overHero: header.hasAttribute('data-header-over-hero'),
		};
	});

/** Nothing in the bar overlaps or leaves the window, and the page does not scroll sideways. */
const barFit = (page) =>
	page.evaluate(() => {
		const header = document.querySelector('header.header');
		const box = (el) => (el && el.getClientRects().length ? el.getBoundingClientRect() : null);
		const logo = box(header.querySelector('.logo'));
		const row = box(header.querySelector('.sm__row'));
		const buttons = box(header.querySelector('.head-buttons'));
		const tops = [...header.querySelectorAll('.sm__row > li')].map((li) => Math.round(li.getBoundingClientRect().top));
		return {
			sideways: document.documentElement.scrollWidth > innerWidth,
			inWindow: buttons.right <= innerWidth + 0.5 && logo.left >= 0,
			logoClear: logo.right <= (row ? row.left : buttons.left) + 0.5,
			rowClear: !row || row.right <= buttons.left + 0.5,
			oneLine: new Set(tops).size <= 1,
			rowShown: !!row,
		};
	});

if (want('menu')) {
	// ── structure ────────────────────────────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		await go(page, '/product/');
		const r = await page.evaluate(() => {
			const tops = [...document.querySelectorAll('nav.sm .sm__row > li > .sm__top')];
			const count = (sel) => document.querySelectorAll(sel).length;
			return {
				labels: tops.map((t) => t.textContent.trim()),
				buttons: tops.filter((t) => t.tagName === 'BUTTON').map((t) => t.getAttribute('aria-expanded')),
				controls: tops.filter((t) => t.tagName === 'BUTTON').every((t) => !!document.getElementById(t.getAttribute('aria-controls'))),
				ids: ['Menu_Pricing', 'blog-link', 'learn-link', 'Menu_TryItNow', 'Menu_SignIn'].map((id) => count(`[id="${id}"]`)),
				pricingGtm: count('#Menu_Pricing.gtm_button'),
				learnHref: document.getElementById('learn-link')?.getAttribute('href'),
				navLabel: document.querySelector('nav.sm').getAttribute('aria-label'),
			};
		});
		check('menu row: the eight items in order', JSON.stringify(r.labels) === JSON.stringify(LABELS), r.labels.join(', '));
		check('menu row: four sections, all closed', r.buttons.length === 4 && r.buttons.every((v) => v === 'false'));
		check('menu row: each section button names the panel it controls', r.controls);
		check('analytics ids: each is on exactly one element', r.ids.every((n) => n === 1), r.ids.join(','));
		check('analytics ids: Menu_Pricing keeps gtm_button', r.pricingGtm === 1);
		check('analytics ids: learn-link is the guides hub link', r.learnHref === '/mqtt/', r.learnHref);
		check('menu: the nav is labelled', r.navLabel === 'Site menu', r.navLabel);
	});

	// ── which section a page belongs to ──────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		for (const [path, id] of [
			['/product/lite/', 'nav-products'],
			['/installations/', 'nav-products'],
			['/docs/lite/', 'nav-docs'],
			['/docs/installation/', 'nav-docs'],
			['/mqtt/qos/', 'nav-learn'],
			['/contact-us/', 'nav-company'],
		]) {
			await go(page, path);
			const marked = await page.evaluate(() => [...document.querySelectorAll('nav.sm .sm__row [data-current]')].map((t) => t.dataset.smTrigger));
			check(`current section on ${path}: ${id} only`, marked.length === 1 && marked[0] === id, marked.join(','));
			// The underline is for the eye; assistive technology reads `aria-current`, in the row and in the sheet.
			const spoken = await page.evaluate(() =>
				[...document.querySelectorAll('nav.sm :is(.sm__row, .sm__list) button[aria-current="true"]')].map(
					(t) => t.dataset.smTrigger ?? t.dataset.smOpenView
				)
			);
			check(`current section on ${path}: announced on the row and the sheet`, spoken.join() === `${id},${id}`, spoken.join());
		}
		for (const [path, want] of [
			['/blog/', 'page'],
			['/blog/introducing-tbmq-professional-edition-the-mqtt-broker-for-enterprise-needs/', 'true'],
		]) {
			await go(page, path);
			const got = await page.evaluate(() => [...document.querySelectorAll('nav.sm .sm__row a[aria-current]')].map((a) => `${a.textContent.trim()}=${a.getAttribute('aria-current')}`));
			check(`Blog link on ${path}: aria-current="${want}"`, got.join() === `Blog=${want}`, got.join());
		}
		await go(page, '/pricing/');
		const page_ = await page.evaluate(() => [...document.querySelectorAll('nav.sm .sm__row [aria-current="page"]')].map((a) => a.textContent.trim()));
		check('current page on /pricing/: the Pricing link', page_.join() === 'Pricing', page_.join());
		await go(page, '/');
		const none = await page.evaluate(() => document.querySelectorAll('nav.sm .sm__row :is([data-current], [aria-current])').length);
		check('home: no item marked current', none === 0, String(none));
	});

	// ── click, keyboard, hover ───────────────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		await go(page, '/product/');
		await quiet(page);

		await page.click(TRIGGER('nav-products'));
		await sleep(350);
		let s = await panelState(page);
		check('click Products: its section opens', s.open && s.section === 'nav-products', JSON.stringify(s));
		check('click Products: the button says expanded, the header is marked', s.expanded.join() === 'nav-products' && s.headerOpen);
		check('Products: both products, then the three promo links', s.links.join() === '/product/,/product/lite/,/pricing/,/installations/,/live-demo/', s.links.join());
		const lite = await page.evaluate(() => {
			const a = document.querySelector('[data-sm-panel="nav-products"] a[href="/product/lite/"]');
			return { tag: a.querySelector('.sm__tag')?.textContent.trim(), tile: !!a.querySelector('.product-tile--tbmq-lite'), desc: a.querySelector('.sm__link-desc')?.textContent.trim() };
		});
		check('Products: TBMQ Lite has its tile, its line and the Beta label', lite.tag === 'Beta' && lite.tile && lite.desc === 'Single-container MQTT broker', JSON.stringify(lite));
		await shot(page, 'menu-products');

		await page.click(TRIGGER('nav-docs'));
		await sleep(450);
		s = await panelState(page);
		check('click Docs while Products is open: the panel switches', s.section === 'nav-docs' && s.expanded.join() === 'nav-docs', JSON.stringify(s));
		check('Docs: both docs sets', s.links.join() === '/docs/pe/,/docs/lite/', s.links.join());

		await page.click(TRIGGER('nav-docs'));
		await sleep(350);
		s = await panelState(page);
		check('click the open item again: the panel closes', !s.open && s.expanded.length === 0 && !s.headerOpen, JSON.stringify(s));

		await page.click(TRIGGER('nav-learn'));
		await sleep(350);
		s = await panelState(page);
		check('Learn: five guides and the hub link', s.links.length === 6 && s.links.at(-1) === '/mqtt/' && s.links.slice(0, 5).every((h) => h.startsWith('/mqtt/')), s.links.join());
		await shot(page, 'menu-learn');
		// A press on the page itself, not at fixed coordinates: those can land on a link and leave the page.
		await page.evaluate(() => document.querySelector('main').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
		await sleep(350);
		check('a press outside the menu: the panel closes', !(await panelState(page)).open);

		await page.click(TRIGGER('nav-company'));
		await sleep(350);
		const company = await page.evaluate(() => {
			const a = document.querySelector('[data-sm-panel="nav-company"] a[href^="https://thingsboard.io"]');
			return { target: a.target, rel: a.rel, label: a.getAttribute('aria-label'), arrow: !!a.querySelector('[data-icon="tabler:arrow-up-right"]') };
		});
		check('Company: the off-site link opens a new tab and says so', company.target === '_blank' && /noopener/.test(company.rel) && /opens thingsboard\.io in a new tab/.test(company.label ?? '') && company.arrow, JSON.stringify(company));
		await page.keyboard.press('Escape');
		await sleep(300);

		// Keyboard: Enter opens, Tab goes into the section, Escape closes and returns to the item.
		await page.focus(TRIGGER('nav-products'));
		await page.keyboard.press('Enter');
		await sleep(350);
		s = await panelState(page);
		check('keyboard: Enter opens the section, focus stays on the item', s.open && s.focus === 'nav-products', JSON.stringify(s));
		await page.keyboard.press('Tab');
		s = await panelState(page);
		check('keyboard: Tab moves into the open section', s.focus === '/product/', String(s.focus));
		await page.keyboard.press('Escape');
		await sleep(300);
		s = await panelState(page);
		check('keyboard: Escape closes and returns focus to the item', !s.open && s.focus === 'nav-products', JSON.stringify(s));

		// Mouse: resting on an item opens its section, moving along the row switches, leaving closes.
		const centre = (sel) => page.$eval(sel, (el) => {
			const b = el.getBoundingClientRect();
			return [b.left + b.width / 2, b.top + b.height / 2];
		});
		await page.mouse.move(700, 600);
		await page.mouse.move(...(await centre(TRIGGER('nav-products'))), { steps: 4 });
		await sleep(500);
		s = await panelState(page);
		check('hover: resting on Products opens it', s.open && s.section === 'nav-products', JSON.stringify(s));
		await page.mouse.move(...(await centre(TRIGGER('nav-learn'))), { steps: 6 });
		await sleep(500);
		s = await panelState(page);
		check('hover: moving to Learn switches the panel', s.open && s.section === 'nav-learn', JSON.stringify(s));
		await page.mouse.move(...(await centre('[data-sm-panel="nav-learn"] a')), { steps: 6 });
		await sleep(500);
		check('hover: the panel stays open while the pointer is in it', (await panelState(page)).open);
		await page.mouse.move(700, 800, { steps: 6 });
		await sleep(700);
		check('hover: leaving closes the panel', !(await panelState(page)).open);
	});
}

if (want('bar')) {
	// ── over the home hero, and past it ──────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		await go(page, '/');
		await quiet(page);
		await sleep(300);
		let p = await headerPaint(page);
		check('home, top: the bar is see-through with white text', p.alpha === 0 && p.ink === 'rgb(255, 255, 255)', JSON.stringify(p));
		await page.click(TRIGGER('nav-products'));
		await sleep(350);
		p = await headerPaint(page);
		check('home, top, panel open: the bar turns dark with the panel', p.alpha === 1 && p.dark, JSON.stringify(p));
		await page.keyboard.press('Escape');
		await page.evaluate(() => window.scrollTo(0, 300));
		await sleep(500);
		p = await headerPaint(page);
		check('home, scrolled inside the hero: a dark bar, still white text', p.scrolled && p.overHero && p.alpha === 1 && p.dark && p.ink === 'rgb(255, 255, 255)', JSON.stringify(p));
		await page.evaluate(() => window.scrollTo(0, document.getElementById('hero').offsetHeight + 300));
		await sleep(500);
		p = await headerPaint(page);
		check('home, past the hero: a light bar with dark text', p.scrolled && !p.overHero && p.alpha === 1 && !p.dark && p.ink !== 'rgb(255, 255, 255)', JSON.stringify(p));

		await go(page, '/pricing/');
		await sleep(300);
		p = await headerPaint(page);
		check('pricing, top: the bar is see-through over the page', p.alpha === 0, JSON.stringify(p));
		await page.evaluate(() => window.scrollTo(0, 400));
		await sleep(500);
		p = await headerPaint(page);
		check('pricing, scrolled: the bar is solid', p.scrolled && p.alpha === 1, JSON.stringify(p));

		await go(page, '/product/');
		await sleep(300);
		p = await headerPaint(page);
		check('product: the bar is solid from the top', p.alpha === 1 && !p.dark, JSON.stringify(p));
	});

	// ── which buttons each kind of page has ──────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		const has = () =>
			page.evaluate(() => {
				const h = document.querySelector('header.header');
				const shown = (sel) => !!h.querySelector(sel) && h.querySelector(sel).getClientRects().length > 0;
				return { search: shown('search-button button'), theme: shown('theme-toggle button'), github: shown('.gh-button'), signin: shown('.signin'), try: shown('.try'), look: h.querySelector('.logo-burger').dataset.headerLook };
			});
		for (const [path, look, search, theme] of [
			['/docs/pe/getting-started/', 'docs', true, true],
			['/docs/lite/', 'docs', true, true],
			['/blog/', 'marketing', true, true],
			['/pricing/', 'marketing', false, true],
			['/404.html', 'marketing', false, true],
			['/product/', 'marketing', false, false],
			['/', 'marketing', false, false],
			['/mqtt/qos/', 'marketing', false, false],
		]) {
			await go(page, path);
			const h = await has();
			check(`${path}: ${look} look, search ${search ? 'on' : 'off'}, theme switch ${theme ? 'on' : 'off'}`, h.look === look && h.search === search && h.theme === theme && h.github && h.signin && h.try, JSON.stringify(h));
		}
		await go(page, '/docs/search/');
		check('/docs/search/: no search button beside the page’s own search box', !(await has()).search);

		await go(page, '/product/');
		const links = await page.evaluate(() => {
			const s = document.querySelector('header.header .signin');
			const t = document.querySelector('header.header .try');
			return {
				signin: [s.getAttribute('href'), s.target, s.rel, s.hasAttribute('data-demo-dialog')],
				try: [t.getAttribute('href'), t.target, t.rel, t.hasAttribute('data-demo-dialog'), t.getAttribute('aria-haspopup'), t.classList.contains('gtm_button')],
			};
		});
		check('Sign in: straight to the demo, in a new tab', JSON.stringify(links.signin) === JSON.stringify(['https://demo.tbmq.io/', '_blank', 'noopener noreferrer', false]), JSON.stringify(links.signin));
		check('Try for free: opens the dialog, with the demo sign-up as its own link', JSON.stringify(links.try) === JSON.stringify(['https://demo.tbmq.io/signup', '_blank', 'noopener noreferrer', true, 'dialog', true]), JSON.stringify(links.try));
	});

	// ── the bar fits at every width, on its fullest pages ────────────────────────
	for (const width of [320, 360, 390, 414, 599, 600, 719, 720, 900, 1024, 1279, 1280, 1300, 1366, 1439, 1440, 1600, 1920]) {
		await withPage({ width, height: 800 }, async (page) => {
			for (const path of ['/docs/pe/getting-started/', '/blog/', '/']) {
				await go(page, path);
				const f = await barFit(page);
				const fits = !f.sideways && f.inWindow && f.logoClear && f.rowClear && f.oneLine;
				check(`${width}px ${path}: the bar fits`, fits, JSON.stringify(f));
				if (path === '/') check(`${width}px: the menu row shows from 1280px only`, f.rowShown === width >= 1280, String(f.rowShown));
			}
		});
	}

	// ── search and the theme switch ──────────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		// Google's script is not needed to check that the dialog opens and closes.
		await page.setRequestInterception(true);
		page.on('request', (r) => (/cse\.google\.com/.test(r.url()) ? r.abort() : r.continue()));
		await go(page, '/docs/pe/getting-started/');
		await quiet(page);
		const searchOpen = () => page.evaluate(() => !!document.querySelector('#tb-search-modal.open'));
		await page.click('search-button button');
		await sleep(300);
		check('search: the button opens the dialog', await searchOpen());
		const locked = () => page.evaluate(() => document.documentElement.classList.contains('tb-scroll-locked'));
		const onButton = () => page.evaluate(() => document.activeElement === document.querySelector('search-button button'));
		check('search: the open dialog holds the page’s scroll lock', await locked());
		// Google's script is blocked here, so stand in for the input it mounts: the dialog moves focus to it.
		const mountInput = () =>
			page.evaluate(() => {
				if (document.querySelector('#tb-search-modal input.gsc-input')) return;
				const input = document.createElement('input');
				input.className = 'gsc-input';
				document.querySelector('#tb-search-modal .gcse-search').append(input);
			});
		const inInput = () => page.evaluate(() => document.activeElement?.matches('#tb-search-modal input.gsc-input') ?? false);
		await mountInput();
		await sleep(200);
		check('search: focus moves into the dialog', await inInput());
		await page.keyboard.press('Escape');
		await sleep(200);
		check('search: Escape closes it', !(await searchOpen()));
		check('search: closing unlocks the page and returns focus to the button', !(await locked()) && (await onButton()));
		await page.evaluate(() => document.activeElement.blur());
		await page.keyboard.down('Control');
		await page.keyboard.press('KeyK');
		await page.keyboard.up('Control');
		await sleep(300);
		check('search: Ctrl K opens it', await searchOpen());
		const prevented = await page.evaluate(() => {
			const e = new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', ctrlKey: true, bubbles: true, cancelable: true });
			document.dispatchEvent(e);
			return e.defaultPrevented;
		});
		check('search: Ctrl K in the open dialog is kept from the browser', prevented && (await searchOpen()));
		await page.keyboard.press('Escape');
		await sleep(200);
		check('search: after Ctrl K, Escape returns focus to the button', !(await searchOpen()) && (await onButton()));
		await page.click('search-button button');
		await sleep(300);
		await page.mouse.click(20, 700);
		await sleep(200);
		check('search: a click on the backdrop closes it and returns focus', !(await searchOpen()) && (await onButton()));

		const theme = () => page.evaluate(() => document.documentElement.dataset.theme);
		const before = await theme();
		await page.click('theme-toggle button');
		const after = await theme();
		check('theme switch: one click changes the theme', before !== after, `${before} → ${after}`);
		const stored = await page.evaluate(() => localStorage.getItem('starlight-theme'));
		check('theme switch: the choice is stored', stored === after, String(stored));
	});

	// ── phone: edge swipes leave an open search dialog alone ─────────────────────
	await withPage({ width: 390, height: 844, touch: true }, async (page) => {
		await page.setRequestInterception(true);
		page.on('request', (r) => (/cse\.google\.com/.test(r.url()) ? r.abort() : r.continue()));
		await go(page, '/docs/pe/getting-started/');
		await quiet(page);
		// Synthetic touch events on the document: a real drag would also tap whatever lies under its end.
		const swipe = async (fromX, toX) => {
			await page.evaluate(
				(fromX, toX) => {
					const touch = (x) => new Touch({ identifier: 1, target: document.body, clientX: x, clientY: 500 });
					const fire = (type, x, down) =>
						document.dispatchEvent(
							new TouchEvent(type, { bubbles: true, touches: down ? [touch(x)] : [], changedTouches: [touch(x)] })
						);
					fire('touchstart', fromX, true);
					fire('touchmove', (fromX + toX) / 2, true);
					fire('touchend', toX, false);
				},
				fromX,
				toX
			);
			await sleep(450);
		};
		const state = () =>
			page.evaluate(() => ({
				search: !!document.querySelector('#tb-search-modal.open'),
				sheet: document.querySelector('header.header').hasAttribute('data-sm-open'),
				sidebar: document.getElementById('starlight__sidebar').matches(':popover-open'),
			}));
		// The gestures work on their own, or the checks below would pass for the wrong reason.
		await swipe(385, 200);
		let s = await state();
		check('phone: a swipe from the right edge opens the menu sheet', s.sheet, JSON.stringify(s));
		await swipe(100, 300);
		s = await state();
		check('phone: a swipe back closes it', !s.sheet, JSON.stringify(s));

		await page.click('search-button button');
		await sleep(300);
		await swipe(385, 200);
		s = await state();
		check('phone, search open: a swipe from the right edge does not open the sheet under it', s.search && !s.sheet, JSON.stringify(s));
		await swipe(5, 200);
		s = await state();
		check('phone, search open: a swipe from the left edge does not open the sidebar over it', s.search && !s.sidebar, JSON.stringify(s));
		await page.keyboard.press('Escape');
		await sleep(200);

		// Search opened over the menu sheet: a swipe back must not rewind the sheet behind the dialog.
		await page.click(TOGGLE);
		await sleep(450);
		await page.click('search-button button');
		await sleep(300);
		await swipe(100, 300);
		s = await state();
		check('phone, search over the sheet: a swipe back leaves the sheet open', s.search && s.sheet, JSON.stringify(s));
		await page.keyboard.press('Escape');
		await sleep(200);
		s = await state();
		check('phone, search over the sheet: Escape closes search only', !s.search && s.sheet, JSON.stringify(s));
	});
}

if (want('sheet')) {
	// ── phone ────────────────────────────────────────────────────────────────────
	for (const path of ['/', '/docs/pe/getting-started/']) {
		await withPage({ width: 390, height: 844, touch: true }, async (page) => {
			await go(page, path);
			await quiet(page);
			await page.click(TOGGLE);
			await sleep(450);
			let s = await sheetState(page);
			check(`phone ${path}: Menu opens the sheet and locks the page`, s.open && s.headerOpen && s.rootMarked && s.expanded === 'true' && s.locked, JSON.stringify(s));
			check(`phone ${path}: the sheet starts where the bar ends`, Math.abs(s.top - s.barBottom) <= 1, `${s.top} vs ${s.barBottom}`);
			const rows = await page.evaluate(() => [...document.querySelectorAll('.sm__view--root .sm__sheet-row')].map((r) => r.textContent.trim()));
			check(`phone ${path}: the same eight items as the desktop row`, JSON.stringify(rows) === JSON.stringify(LABELS), rows.join(', '));
			if (path === '/') await shot(page, 'sheet');

			await page.click('[data-sm-open-view="nav-products"]');
			await sleep(450);
			s = await sheetState(page);
			const links = await page.evaluate(() =>
				[...document.querySelectorAll('[data-sm-view="nav-products"] a')].filter((a) => a.getClientRects().length).map((a) => a.getAttribute('href'))
			);
			check(`phone ${path}: a row opens its section in place of the list`, s.view === 'nav-products' && links.join() === '/product/,/product/lite/,/pricing/,/installations/,/live-demo/', `${s.view}: ${links.join()}`);
			if (path === '/') await shot(page, 'sheet-products');
			await page.click('[data-sm-view="nav-products"] [data-sm-back]');
			await sleep(450);
			check(`phone ${path}: Back returns to the list`, (await sheetState(page)).view === 'root');

			await page.click('[data-sm-open-view="nav-docs"]');
			await sleep(450);
			await page.keyboard.press('Escape');
			await sleep(450);
			s = await sheetState(page);
			check(`phone ${path}: Escape goes back a level first`, s.open && s.view === 'root', JSON.stringify(s));
			await page.keyboard.press('Escape');
			await sleep(300);
			s = await sheetState(page);
			check(`phone ${path}: then closes the sheet and unlocks the page`, !s.open && !s.headerOpen && !s.rootMarked && s.expanded === 'false' && !s.locked, JSON.stringify(s));
		});
	}

	// ── the account buttons and their analytics ids move into the sheet ───────────
	await withPage({ width: 390, height: 844, touch: true }, async (page) => {
		await go(page, '/product/');
		await quiet(page);
		const where = () =>
			page.evaluate(() =>
				['Menu_SignIn', 'Menu_TryItNow', 'Menu_Pricing', 'blog-link'].map((id) => {
					const all = document.querySelectorAll(`[id="${id}"]`);
					return all.length === 1 && !!all[0].closest('[data-sm-sheet]');
				})
			);
		check('phone: the four ids sit on the sheet’s copies', (await where()).every(Boolean), (await where()).join(','));
		const barButtons = await page.evaluate(() => [...document.querySelectorAll('header.header .head-buttons :is(.signin, .try)')].filter((b) => b.getClientRects().length).length);
		check('phone: Sign in and Try for free are not in the bar', barButtons === 0, String(barButtons));
		await page.click(TOGGLE);
		await sleep(450);
		const foot = await page.evaluate(() => [...document.querySelectorAll('.sm__sheet-foot a')].filter((a) => a.getClientRects().length).map((a) => [a.textContent.trim(), a.getAttribute('href')]));
		check('phone: both are at the foot of the sheet', JSON.stringify(foot) === JSON.stringify([['Sign in', 'https://demo.tbmq.io/'], ['Try for free', 'https://demo.tbmq.io/signup']]), JSON.stringify(foot));
	});
	await withPage({ width: 1440 }, async (page) => {
		await go(page, '/product/');
		const inBar = await page.evaluate(() =>
			['Menu_SignIn', 'Menu_TryItNow', 'Menu_Pricing', 'blog-link'].map((id) => {
				const all = document.querySelectorAll(`[id="${id}"]`);
				return all.length === 1 && !all[0].closest('[data-sm-sheet]');
			})
		);
		check('desktop: the four ids sit on the bar’s copies', inBar.every(Boolean), inBar.join(','));
	});

	// ── the cookie notice stays on top of the sheet ──────────────────────────────
	await withPage({ width: 390, height: 844, touch: true }, async (page) => {
		await go(page, '/product/');
		await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
		await page.click(TOGGLE);
		await sleep(450);
		const top = await page.evaluate(() => {
			const banner = document.getElementById('cookie-banner');
			const b = banner.getBoundingClientRect();
			const el = document.elementFromPoint(b.left + b.width / 2, b.top + 8);
			return { visible: banner.classList.contains('is-visible'), onTop: banner.contains(el) };
		});
		check('phone: the cookie notice shows over the open sheet', top.visible && top.onTop, JSON.stringify(top));
	});

	// ── tablet: the list beside the open section ─────────────────────────────────
	await withPage({ width: 900, height: 1100, touch: true }, async (page) => {
		await go(page, '/docs/lite/');
		await quiet(page);
		await page.click(TOGGLE);
		await sleep(450);
		const split = await page.evaluate(() => {
			const shown = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility === 'visible';
			const sheet = document.querySelector('[data-sm-sheet]');
			return {
				view: sheet.dataset.view,
				list: shown(sheet.querySelector('.sm__view--root .sm__sheet-row')),
				section: shown(sheet.querySelector('[data-sm-view="nav-docs"] a')),
				expanded: sheet.querySelector('[data-sm-open-view="nav-docs"]').getAttribute('aria-expanded'),
			};
		});
		check('tablet: the sheet opens on the page’s own section, beside the list', split.view === 'nav-docs' && split.list && split.section && split.expanded === 'true', JSON.stringify(split));
		await shot(page, 'sheet-tablet');
	});

	// ── without JavaScript ───────────────────────────────────────────────────────
	await withPage({ width: 390, height: 844, js: false }, async (page) => {
		await go(page, '/product/');
		const r = await page.evaluate(() => {
			const shown = (el) => !!el && el.getClientRects().length > 0;
			const h = document.querySelector('header.header');
			return { jsButton: shown(h.querySelector('[data-sm-toggle]')), link: shown(h.querySelector('a.sm__nojs')), href: h.querySelector('a.sm__nojs').getAttribute('href') };
		});
		check('no JavaScript, phone: a plain Menu link replaces the button', !r.jsButton && r.link && r.href === '#sm-sheet', JSON.stringify(r));
		await go(page, '/product/#sm-sheet');
		const links = await page.evaluate(() => [...document.querySelectorAll('#sm-sheet a')].filter((a) => a.getClientRects().length).length);
		check('no JavaScript, phone: that link shows every menu link in one list', links >= 20, String(links));
	});
}

if (want('dialog')) {
	const dialog = (page) =>
		page.evaluate(() => {
			const d = document.querySelector('dialog[data-demo-dialog-root]');
			const option = d.querySelector('[data-demo-option]');
			const install = d.querySelector('.dd__alt a');
			return {
				open: d.open && !d.classList.contains('dd--closing'),
				title: d.querySelector('#demo-dialog-title').textContent.trim(),
				labelled: d.getAttribute('aria-labelledby'),
				option: [option.getAttribute('href'), option.target, option.rel, option.querySelector('.dd__option-name').textContent.trim()],
				install: [install.getAttribute('href'), install.textContent.trim()],
				focus: document.activeElement === option ? 'option' : document.activeElement?.className || document.activeElement?.tagName,
				locked: getComputedStyle(document.documentElement).overflow === 'hidden',
			};
		});

	await withPage({ width: 1440 }, async (page) => {
		await go(page, '/product/');
		await quiet(page);
		check('dialog: closed when the page loads', !(await dialog(page)).open);
		await page.click(TRY);
		await sleep(500);
		let d = await dialog(page);
		check('Try for free opens the dialog and locks the page', d.open && d.locked, JSON.stringify(d));
		check('dialog: titled, and labelled by its title', d.title === 'Try TBMQ in your browser' && d.labelled === 'demo-dialog-title', d.title);
		check('dialog: the one choice is the demo sign-up, in a new tab', JSON.stringify(d.option) === JSON.stringify(['https://demo.tbmq.io/signup', '_blank', 'noopener noreferrer', 'Live demo']), JSON.stringify(d.option));
		check('dialog: the other way is the Community installation docs', JSON.stringify(d.install) === JSON.stringify(['/docs/installation/', 'Install on your own servers']), JSON.stringify(d.install));
		check('dialog: focus lands on the choice, not on Close', d.focus === 'option', String(d.focus));
		await shot(page, 'dialog');

		await page.keyboard.press('Escape');
		await sleep(500);
		d = await dialog(page);
		const back = await page.evaluate((sel) => document.activeElement === document.querySelector(sel), TRY);
		check('dialog: Escape closes it, unlocks the page and returns focus', !d.open && !d.locked && back, JSON.stringify({ ...d, back }));

		await page.click(TRY);
		await sleep(500);
		await page.click('.dd__close');
		await sleep(500);
		check('dialog: the close button closes it', !(await dialog(page)).open);

		await page.click(TRY);
		await sleep(500);
		await page.mouse.click(60, 700);
		await sleep(500);
		check('dialog: a click on the backdrop closes it', !(await dialog(page)).open);

		// A modified click is the browser's: the link's own href, no dialog.
		const modified = await page.evaluate((sel) => {
			const a = document.querySelector(sel);
			a.addEventListener('click', (e) => e.preventDefault(), { once: true });
			const e = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
			a.dispatchEvent(e);
			return true;
		}, TRY);
		await sleep(400);
		check('dialog: Ctrl-click on Try for free does not open it', modified && !(await dialog(page)).open);

		// Opened from the menu panel: the panel closes behind it.
		await page.click(TRIGGER('nav-products'));
		await sleep(350);
		await page.click(TRY);
		await sleep(500);
		const both = await page.evaluate(() => ({ dialog: document.querySelector('dialog[data-demo-dialog-root]').open, panel: !document.querySelector('[data-sm-one]').hidden }));
		check('dialog: opening it closes an open menu panel', both.dialog && !both.panel, JSON.stringify(both));
	});

	await withPage({ width: 390, height: 844, touch: true }, async (page) => {
		await go(page, '/');
		await quiet(page);
		await page.click(TOGGLE);
		await sleep(450);
		await page.click('.sm__foot-try');
		await sleep(600);
		const r = await page.evaluate(() => {
			const d = document.querySelector('dialog[data-demo-dialog-root]');
			const panel = d.querySelector('.dd__panel').getBoundingClientRect();
			return { open: d.open, sheet: !document.querySelector('[data-sm-sheet]').hidden, atBottom: Math.round(panel.bottom) === innerHeight, fullWidth: Math.round(panel.width) === innerWidth };
		});
		check('phone: Try for free in the sheet opens the dialog and closes the sheet', r.open && !r.sheet, JSON.stringify(r));
		check('phone: the dialog is a sheet at the bottom of the screen', r.atBottom && r.fullWidth, JSON.stringify(r));
		await shot(page, 'dialog-phone');
	});

	await withPage({ width: 1440, js: false }, async (page) => {
		await go(page, '/product/');
		const r = await page.evaluate(() => ({ href: document.querySelector('header.header .try').getAttribute('href'), open: document.querySelector('dialog[data-demo-dialog-root]').open }));
		check('no JavaScript: Try for free is a plain link to the demo sign-up', r.href === 'https://demo.tbmq.io/signup' && !r.open, JSON.stringify(r));
	});
}

done();
