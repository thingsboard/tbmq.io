/* eslint-disable no-undef -- Node and browser globals: these scripts run outside the site code the lint config describes */
// node header.mjs [menu] [shell] — the site header: the menu (part `menu`) and the bar around it (part `shell`).
// env SHOT=<dir> also saves the open Products and Learn panels and the open drawer.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { check, done, go, sleep, withPage } from './lib.mjs';

const parts = process.argv.slice(2);
const want = (name) => parts.length === 0 || parts.includes(name);

const TOP = (id) => `[data-sm-item="${id}"] > .sm__top`;
const LABELS = ['Products', 'Live Demo', 'Performance', 'Company', 'Learn', 'Docs', 'Blog', 'Pricing'];

/** Which panels are showing, and the header's open marker. */
const menuState = (page) =>
	page.evaluate(() => {
		const shown = (el) => !!el && !el.hidden && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
		const items = [...document.querySelectorAll('.sm__item[data-sm-item]')];
		return {
			open: items.filter((li) => shown(li.querySelector('.sm__panel'))).map((li) => li.dataset.smItem),
			expanded: items
				.filter((li) => li.querySelector('.sm__top')?.getAttribute('aria-expanded') === 'true')
				.map((li) => li.dataset.smItem),
			marked: items.filter((li) => li.hasAttribute('data-open')).map((li) => li.dataset.smItem),
			headerOpen: document.querySelector('header.header')?.hasAttribute('data-sm-open') ?? false,
			focusInHidden: !!document.activeElement?.closest('.sm__panel[hidden]'),
			focus: document.activeElement?.closest('[data-sm-item]')?.dataset.smItem ?? null,
			focusIsTop: document.activeElement?.classList.contains('sm__top') ?? false,
			focusText: document.activeElement?.textContent?.trim().slice(0, 30) ?? '',
		};
	});

const headerAlpha = (page) =>
	page.evaluate(() => {
		const c = getComputedStyle(document.querySelector('header.header')).backgroundColor;
		const m = /rgba?\(([^)]+)\)/.exec(c);
		if (!m) return c === 'transparent' ? 0 : 1;
		const p = m[1].split(/[,/\s]+/).filter(Boolean);
		return p.length > 3 ? Number(p[3]) : 1;
	});

if (want('menu')) {
	// ── structure ────────────────────────────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		await go(page, '/product/');
		const r = await page.evaluate(() => {
			const items = [...document.querySelectorAll('nav.sm .sm__row > li')];
			const tops = items.map((li) => li.querySelector(':scope > .sm__top'));
			return {
				labels: tops.map((t) => t?.textContent.trim() ?? ''),
				buttons: tops.filter((t) => t?.tagName === 'BUTTON').map((t) => t.getAttribute('aria-expanded')),
				controlsExist: tops
					.filter((t) => t?.tagName === 'BUTTON')
					.every((t) => !!document.getElementById(t.getAttribute('aria-controls') ?? '')),
				pricing: document.querySelectorAll('#Menu_Pricing').length,
				pricingGtm: document.querySelectorAll('#Menu_Pricing.gtm_button').length,
				blog: document.querySelectorAll('#blog-link').length,
				learn: document.querySelectorAll('#learn-link').length,
				learnHref: document.getElementById('learn-link')?.getAttribute('href'),
				navLabel: document.querySelector('nav.sm')?.getAttribute('aria-label'),
				oldMenu: document.querySelectorAll('.head-menu, .main-menu-link').length,
			};
		});
		check('structure: 8 items in order', r.labels.join() === LABELS.join(), r.labels.join());
		check(
			'structure: four dropdown buttons, all collapsed, each with its panel',
			r.buttons.length === 4 && r.buttons.every((v) => v === 'false') && r.controlsExist,
			JSON.stringify(r.buttons)
		);
		check('structure: #Menu_Pricing.gtm_button once', r.pricing === 1 && r.pricingGtm === 1, `${r.pricing}/${r.pricingGtm}`);
		check('structure: #blog-link once', r.blog === 1, `${r.blog}`);
		check('structure: #learn-link once, on the hub link', r.learn === 1 && r.learnHref === '/mqtt/', `${r.learn} ${r.learnHref}`);
		check('structure: nav is labelled', r.navLabel === 'Site menu', `${r.navLabel}`);
		check('structure: the old menu is gone', r.oldMenu === 0, `${r.oldMenu}`);
	});

	// ── hover ────────────────────────────────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		await go(page, '/product/');
		await page.hover(TOP('nav-products'));
		await sleep(400);
		let s = await menuState(page);
		check('hover: Products opens', s.open.join() === 'nav-products' && s.expanded.join() === 'nav-products' && s.headerOpen, JSON.stringify(s));
		const box = await page.evaluate(() => {
			const panel = document.getElementById('sm-panel-nav-products');
			const r = panel.getBoundingClientRect();
			const header = document.querySelector('header.header').getBoundingClientRect();
			const hrefs = [...panel.querySelectorAll('a')].map((a) => a.getAttribute('href'));
			const firstLink = panel.querySelector('.sm__link').getBoundingClientRect();
			const rowFirst = document.querySelector('.sm__row > li > .sm__top').getBoundingClientRect();
			return {
				left: r.left,
				width: r.width,
				top: r.top,
				headerBottom: header.bottom,
				inner: window.innerWidth,
				hrefs,
				text: panel.innerText,
				linkLeft: firstLink.left,
				rowLeft: rowFirst.left,
				tiles: panel.querySelectorAll('.product-tile').length,
			};
		});
		check(
			'hover: the panel is a full-width band under the bar',
			Math.abs(box.left) <= 1 && Math.abs(box.width - box.inner) <= 1 && Math.abs(box.top - box.headerBottom) <= 1,
			JSON.stringify({ left: box.left, width: box.width, top: box.top, headerBottom: box.headerBottom })
		);
		const need = ['/product/', '/product/lite/', '/pricing/', '/installations/', '/live-demo/'];
		check(
			'hover: the Products panel has its links, tiles and the Beta badge',
			need.every((h) => box.hrefs.includes(h)) && /Beta/i.test(box.text) && box.tiles === 2,
			`${box.hrefs.join(' ')} tiles=${box.tiles}`
		);
		check('hover: panel content lines up with the menu row', Math.abs(box.linkLeft - box.rowLeft) <= 14, `${box.linkLeft} vs ${box.rowLeft}`);
		await page.hover(TOP('nav-docs'));
		await sleep(400);
		s = await menuState(page);
		check('hover: moving to Docs shows only Docs', s.open.join() === 'nav-docs' && s.expanded.join() === 'nav-docs', JSON.stringify(s));
		await page.mouse.move(700, 760);
		await sleep(600);
		s = await menuState(page);
		check('hover: leaving closes everything', s.open.length === 0 && !s.headerOpen && s.marked.length === 0, JSON.stringify(s));

		// Staying on the panel keeps it open.
		await page.hover(TOP('nav-products'));
		await sleep(400);
		await page.hover('#sm-panel-nav-products .sm__link');
		await sleep(600);
		s = await menuState(page);
		check('hover: the panel stays open while the pointer is on it', s.open.join() === 'nav-products', JSON.stringify(s));
	});

	// ── hover: aiming at the panel ───────────────────────────────────────────────
	// Every panel's content starts at the row's left edge, so the straight line from Learn,
	// Docs or Company to their own links crosses other items. That must not switch or close.
	for (const width of [1440, 1920]) {
		await withPage({ width }, async (page) => {
			await go(page, '/product/');
			const centre = (sel) =>
				page.evaluate((s) => {
					const r = document.querySelector(s).getBoundingClientRect();
					return [r.left + r.width / 2, r.top + r.height / 2];
				}, sel);
			for (const id of ['nav-learn', 'nav-docs', 'nav-company', 'nav-products']) {
				for (const ms of [120, 350, 700]) {
					await page.mouse.move(700, 760);
					await sleep(350);
					await page.hover(TOP(id));
					await sleep(400);
					const [x0, y0] = await centre(TOP(id));
					const [x1, y1] = await centre(`#sm-panel-${id} .sm__link`);
					const steps = Math.max(6, Math.round(ms / 16));
					for (let i = 1; i <= steps; i++) {
						await page.mouse.move(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps);
						await sleep(ms / steps);
					}
					await sleep(450);
					const s = await menuState(page);
					check(`aim @${width}: ${id} keeps its panel on a ${ms} ms straight move to its first link`, s.open.join() === id, JSON.stringify(s.open));
				}
			}
			// Moving along the row still switches.
			await page.mouse.move(700, 760);
			await sleep(350);
			await page.hover(TOP('nav-docs'));
			await sleep(400);
			const [dx, dy] = await centre(TOP('nav-docs'));
			const [lx] = await centre(TOP('nav-learn'));
			for (let i = 1; i <= 10; i++) {
				await page.mouse.move(dx + ((lx - dx) * i) / 10, dy);
				await sleep(20);
			}
			await sleep(500);
			const s = await menuState(page);
			check(`aim @${width}: moving along the row from Docs to Learn switches`, s.open.join() === 'nav-learn', JSON.stringify(s.open));
		});
	}

	// ── keyboard ─────────────────────────────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		await go(page, '/product/');
		await page.focus(TOP('nav-products'));
		await page.keyboard.press('Enter');
		await sleep(150);
		let s = await menuState(page);
		check('keyboard: Enter opens', s.open.join() === 'nav-products', JSON.stringify(s));
		await page.keyboard.press('Tab');
		const first = await page.evaluate(() => {
			const panel = document.getElementById('sm-panel-nav-products');
			return document.activeElement === panel.querySelector('a');
		});
		check('keyboard: Tab goes to the first link of the open panel', first);
		await page.keyboard.press('Escape');
		await sleep(150);
		s = await menuState(page);
		check('keyboard: Escape closes and returns focus', s.open.length === 0 && s.focus === 'nav-products' && s.focusIsTop, JSON.stringify(s));
		await page.keyboard.press('Space');
		await sleep(150);
		s = await menuState(page);
		check('keyboard: Space opens', s.open.join() === 'nav-products', JSON.stringify(s));
		await page.keyboard.press('Space');
		await sleep(150);
		s = await menuState(page);
		check('keyboard: Space again closes', s.open.length === 0 && !s.headerOpen, JSON.stringify(s));

		// Closed panels are out of the tab order.
		await page.focus('.sm__row > li:first-child > .sm__top');
		const seen = [];
		let inHidden = false;
		for (let i = 0; i < 7; i++) {
			await page.keyboard.press('Tab');
			s = await menuState(page);
			seen.push(s.focusText);
			inHidden ||= s.focusInHidden;
		}
		check(
			'keyboard: tabbing the closed row visits only the top items',
			!inHidden && seen.join() === LABELS.slice(1).join(),
			seen.join()
		);

		// Focus leaving an open panel closes it.
		await page.focus(TOP('nav-company'));
		await page.keyboard.press('Enter');
		await sleep(150);
		await page.focus(TOP('nav-docs'));
		await sleep(150);
		s = await menuState(page);
		check('keyboard: focus leaving a section closes it', s.open.length === 0, JSON.stringify(s));
	});

	// ── outside click, no shift ──────────────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		await go(page, '/product/');
		const before = await page.evaluate(() => ({
			h: document.documentElement.scrollHeight,
			top: document.querySelector('main').getBoundingClientRect().top,
		}));
		await page.focus(TOP('nav-products'));
		await page.keyboard.press('Enter');
		await sleep(300);
		const after = await page.evaluate(() => ({
			h: document.documentElement.scrollHeight,
			top: document.querySelector('main').getBoundingClientRect().top,
		}));
		check('no shift: an open panel moves nothing', before.h === after.h && before.top === after.top, JSON.stringify({ before, after }));
		await page.keyboard.press('Escape');
		await sleep(150);

		await page.click(TOP('nav-products'));
		await sleep(300);
		let s = await menuState(page);
		check('outside click: a click opens', s.open.join() === 'nav-products', JSON.stringify(s));
		await page.mouse.click(700, 760);
		await sleep(300);
		s = await menuState(page);
		check('outside click: a click on the page closes', s.open.length === 0 && !s.headerOpen, JSON.stringify(s));
	});

	// ── touch on a wide screen ───────────────────────────────────────────────────
	await withPage({ width: 1366, height: 1024, touch: true }, async (page) => {
		await go(page, '/product/');
		await page.tap(TOP('nav-products'));
		await sleep(300);
		let s = await menuState(page);
		check('touch: a tap opens', s.open.join() === 'nav-products', JSON.stringify(s));
		await page.tap(TOP('nav-products'));
		await sleep(300);
		s = await menuState(page);
		check('touch: a second tap closes', s.open.length === 0, JSON.stringify(s));
		await page.tap(TOP('nav-products'));
		await sleep(300);
		await page.tap(TOP('nav-docs'));
		await sleep(300);
		s = await menuState(page);
		check('touch: tapping another item switches', s.open.join() === 'nav-docs', JSON.stringify(s));
	});

	// ── current ──────────────────────────────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		const current = () =>
			page.evaluate(() => ({
				// The styling hook and the assistive-tech state go together: aria-current on the item.
				sections: [...document.querySelectorAll('.sm__top[data-current][aria-current="true"]')].map((b) => b.textContent.trim()),
				unannounced: document.querySelectorAll('.sm__top[data-current]:not([aria-current="true"])').length,
				links: [...document.querySelectorAll('.sm__row > li > a.sm__top[aria-current="page"]')].map((a) => a.textContent.trim()),
			}));
		await go(page, '/product/lite/');
		let c = await current();
		check('current: Products on /product/lite/', c.sections.join() === 'Products' && c.links.length === 0, JSON.stringify(c));
		await go(page, '/docs/lite/');
		c = await current();
		check('current: Docs on /docs/lite/', c.sections.join() === 'Docs' && c.links.length === 0, JSON.stringify(c));
		await go(page, '/pricing/');
		c = await current();
		check('current: Pricing on /pricing/', c.links.join() === 'Pricing' && c.sections.length === 0, JSON.stringify(c));
		await go(page, '/installations/');
		c = await current();
		check('current: Products on /installations/', c.sections.join() === 'Products', JSON.stringify(c));
	});

	// ── transparent bar ──────────────────────────────────────────────────────────
	for (const path of ['/', '/pricing/']) {
		await withPage({ width: 1440 }, async (page) => {
			await go(page, path);
			await sleep(300);
			const a0 = await headerAlpha(page);
			await page.focus(TOP('nav-products'));
			await page.keyboard.press('Enter');
			await sleep(400);
			const a1 = await headerAlpha(page);
			const ink = await page.evaluate(() => {
				const lum = (c) => {
					const [r, g, b] = /rgba?\(([^)]+)\)/.exec(c)[1].split(/[,/\s]+/).filter(Boolean).map(Number);
					const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
					return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
				};
				const top = document.querySelector('.sm__row > li:nth-child(2) > .sm__top');
				const header = document.querySelector('header.header');
				const a = lum(getComputedStyle(top).color);
				const b = lum(getComputedStyle(header).backgroundColor);
				return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
			});
			await page.keyboard.press('Escape');
			await page.evaluate(() => document.activeElement?.blur());
			await sleep(400);
			const a2 = await headerAlpha(page);
			check(`transparent bar ${path}: clear, solid while open, clear again`, a0 === 0 && a1 === 1 && a2 === 0, `${a0} → ${a1} → ${a2}`);
			check(`transparent bar ${path}: the row is readable on the solid bar`, ink >= 4.5, ink.toFixed(2));
		});
	}

	// ── dark panel contrast ──────────────────────────────────────────────────────
	await withPage({ width: 1440, dark: true }, async (page) => {
		await go(page, '/docs/getting-started/');
		await page.focus(TOP('nav-products'));
		await page.keyboard.press('Enter');
		await sleep(400);
		const r = await page.evaluate(() => {
			// Resolve any CSS colour to sRGB bytes through a canvas.
			const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
			const rgb = (c) => {
				ctx.clearRect(0, 0, 1, 1);
				ctx.fillStyle = '#000';
				ctx.fillStyle = c;
				ctx.fillRect(0, 0, 1, 1);
				return [...ctx.getImageData(0, 0, 1, 1).data];
			};
			const lum = ([r, g, b]) => {
				const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
				return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
			};
			const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
			const panel = document.getElementById('sm-panel-nav-products');
			const bg = rgb(getComputedStyle(panel).backgroundColor);
			const of = (sel) => ratio(lum(rgb(getComputedStyle(panel.querySelector(sel)).color)), lum(bg));
			return {
				theme: document.documentElement.dataset.theme,
				alpha: bg[3],
				bgLum: lum(bg),
				heading: of('.sm__link-heading'),
				desc: of('.sm__link-desc'),
				group: of('.sm__group-name'),
				promo: of('.sm__promo'),
			};
		});
		check('dark panel contrast: the page is dark', r.theme === 'dark', `${r.theme}`);
		check('dark panel contrast: the panel is opaque and dark', r.alpha === 255 && r.bgLum < 0.2, JSON.stringify(r));
		check('dark panel contrast: link headings ≥ 4.5', r.heading >= 4.5, r.heading.toFixed(2));
		check(
			'dark panel contrast: descriptions, group names and promos ≥ 4.5',
			r.desc >= 4.5 && r.group >= 4.5 && r.promo >= 4.5,
			`${r.desc.toFixed(2)} ${r.group.toFixed(2)} ${r.promo.toFixed(2)}`
		);
	});

	// ── drawer ───────────────────────────────────────────────────────────────────
	await withPage({ width: 390, height: 844 }, async (page) => {
		await go(page, '/product/');
		const sheet = () =>
			page.evaluate(() => ({
				opened: document.querySelector('header.header').classList.contains('opened-burger'),
				attr: document.documentElement.hasAttribute('data-sm-sheet-open'),
			}));
		const visible = (sel) =>
			page.evaluate((s) => {
				const els = [...document.querySelectorAll(s)];
				return els.length > 0 && els.every((el) => el.getClientRects().length > 0 && el.getBoundingClientRect().height > 0);
			}, sel);
		let s0 = await sheet();
		check('drawer: closed at first', !s0.opened && !s0.attr && !(await visible('.sm__row > li > .sm__top')), JSON.stringify(s0));
		await page.click('.burger');
		await sleep(400);
		s0 = await sheet();
		check('drawer: the burger opens it and marks <html>', s0.opened && s0.attr, JSON.stringify(s0));
		const tops = await page.evaluate(() =>
			[...document.querySelectorAll('.sm__row > li > .sm__top')].map((t) => {
				const r = t.getBoundingClientRect();
				return r.height > 0 && r.left >= 0 && r.right <= window.innerWidth;
			})
		);
		check('drawer: all 8 items are visible', tops.length === 8 && tops.every(Boolean), JSON.stringify(tops));
		await page.click(TOP('nav-products'));
		await sleep(300);
		check(
			'drawer: Products expands in place',
			(await visible('#sm-panel-nav-products a[href="/product/"]')) && (await visible('#sm-panel-nav-products a[href="/product/lite/"]'))
		);
		const inFlow = await page.evaluate(() => {
			const panel = document.getElementById('sm-panel-nav-products').getBoundingClientRect();
			const next = document.querySelector('.sm__row > li:nth-child(2) > .sm__top').getBoundingClientRect();
			return next.top >= panel.bottom - 1;
		});
		check('drawer: the next item moves below the expanded section', inFlow);
		await page.click(TOP('nav-learn'));
		await sleep(300);
		let s = await menuState(page);
		check('drawer: several sections may be open', s.open.join() === 'nav-products,nav-learn', JSON.stringify(s));
		await page.click(TOP('nav-products'));
		await sleep(300);
		s = await menuState(page);
		check('drawer: a second tap collapses', s.open.join() === 'nav-learn', JSON.stringify(s));
		await page.click('.burger');
		await sleep(400);
		s0 = await sheet();
		check('drawer: the burger closes it and clears <html>', !s0.opened && !s0.attr, JSON.stringify(s0));
		await page.click('.burger');
		await sleep(400);
		s = await menuState(page);
		check('drawer: reopened with every section collapsed', s.open.length === 0 && s.expanded.length === 0 && s.marked.length === 0, JSON.stringify(s));
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
		check('drawer: no horizontal overflow', overflow);
	});

	// ── swipe ────────────────────────────────────────────────────────────────────
	await withPage({ width: 390, height: 844, touch: true }, async (page) => {
		await go(page, '/product/');
		const sheet = () =>
			page.evaluate(() => ({
				opened: document.querySelector('header.header').classList.contains('opened-burger'),
				attr: document.documentElement.hasAttribute('data-sm-sheet-open'),
			}));
		const swipe = async (fromX, toX) => {
			await page.touchscreen.touchStart(fromX, 420);
			await page.touchscreen.touchMove((fromX + toX) / 2, 420);
			await page.touchscreen.touchMove(toX, 420);
			await page.touchscreen.touchEnd();
			await sleep(400);
		};
		await swipe(380, 280);
		let s = await sheet();
		check('swipe: left from the right edge opens the drawer', s.opened && s.attr, JSON.stringify(s));
		await page.tap(TOP('nav-products'));
		await sleep(300);
		await swipe(150, 250);
		s = await sheet();
		const m = await menuState(page);
		check('swipe: right closes it, collapsed', !s.opened && !s.attr && m.marked.length === 0 && m.expanded.length === 0, JSON.stringify({ s, m }));
	});

	// ── crossing the breakpoint ──────────────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		await go(page, '/product/');
		await page.focus(TOP('nav-products'));
		await page.keyboard.press('Enter');
		await sleep(200);
		await page.setViewport({ width: 1000, height: 900 });
		await sleep(400);
		const s = await menuState(page);
		check('breakpoint: crossing it closes everything', s.expanded.length === 0 && s.marked.length === 0 && !s.headerOpen, JSON.stringify(s));
	});

	// ── no js ────────────────────────────────────────────────────────────────────
	await withPage({ width: 1440, js: false }, async (page) => {
		await go(page, '/product/');
		await page.hover(TOP('nav-products'));
		await sleep(300);
		const shown = await page.evaluate(() => {
			const p = document.getElementById('sm-panel-nav-products');
			return getComputedStyle(p).display !== 'none' && p.getBoundingClientRect().height > 0;
		});
		check('no js: hovering Products shows its panel', shown);
	});

	if (process.env.SHOT) {
		mkdirSync(process.env.SHOT, { recursive: true });
		const HIDE = 'astro-dev-toolbar,#cookie-banner{display:none!important}';
		for (const [id, path, dark] of [
			['nav-products', '/product/', false],
			['nav-learn', '/product/', false],
			['nav-docs', '/', false],
			['nav-products', '/docs/getting-started/', true],
		]) {
			await withPage({ width: 1440, dark }, async (page) => {
				await go(page, path, 'networkidle2');
				await page.addStyleTag({ content: HIDE });
				await page.focus(TOP(id));
				await page.keyboard.press('Enter');
				await sleep(500);
				const file = join(process.env.SHOT, `panel-${id}${path === '/' ? '-home' : ''}${dark ? '+dark' : ''}@1440.png`);
				await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1440, height: 620 }, captureBeyondViewport: false });
				console.log(file);
			});
		}
		await withPage({ width: 390, height: 844 }, async (page) => {
			await go(page, '/product/', 'networkidle2');
			await page.addStyleTag({ content: HIDE });
			await page.click('.burger');
			await sleep(300);
			await page.click(TOP('nav-products'));
			await sleep(400);
			const file = join(process.env.SHOT, 'drawer-products@390.png');
			await page.screenshot({ path: file, captureBeyondViewport: false });
			console.log(file);
		});
	}
}

if (want('shell')) {
	const visibleCount = (page, sel) =>
		page.evaluate(
			(s) =>
				[...document.querySelectorAll(s)].filter((el) => {
					const r = el.getBoundingClientRect();
					return el.getClientRects().length > 0 && r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
				}).length,
			sel
		);

	// ── no flag ──────────────────────────────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		const requests = [];
		page.on('request', (req) => requests.push(req.url()));
		let flags = 0;
		for (const path of ['/', '/product/', '/docs/getting-started/']) {
			await go(page, path, 'networkidle2');
			flags += await page.evaluate(() => document.querySelectorAll('.support-ukraine, a[href*="u24.gov.ua"]').length);
		}
		const hits = requests.filter((u) => u.includes('support-ukraine'));
		check('no flag: no flag link on the three pages', flags === 0, `${flags}`);
		check('no flag: nothing requests the flag image', hits.length === 0, hits.join(' '));
	});

	// ── buttons ──────────────────────────────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		await go(page, '/product/');
		const r = await page.evaluate(() => {
			const a = (id) => {
				const el = document.getElementById(id);
				return el
					? {
							n: document.querySelectorAll(`#${id}`).length,
							href: el.getAttribute('href'),
							target: el.getAttribute('target'),
							rel: el.getAttribute('rel') ?? '',
							cls: el.className,
							text: el.textContent.trim(),
							box: el.getBoundingClientRect().toJSON(),
							border: getComputedStyle(el).borderTopWidth,
							bg: getComputedStyle(el).backgroundColor,
						}
					: null;
			};
			return {
				signin: a('Menu_SignIn'),
				tryIt: a('Menu_TryItNow'),
				stray: [...document.querySelectorAll('.head-buttons a')]
					.map((el) => el.getAttribute('href'))
					.filter((h) => h === '/pricing/' || h === '/installations/'),
				dividers: document.querySelectorAll('.head-buttons .divider').length,
			};
		});
		check(
			'buttons: Sign in',
			r.signin?.n === 1 &&
				r.signin.href === 'https://demo.tbmq.io/' &&
				r.signin.target === '_blank' &&
				r.signin.rel.includes('noopener') &&
				r.signin.text === 'Sign in',
			JSON.stringify(r.signin)
		);
		check(
			'buttons: Try for free',
			r.tryIt?.n === 1 &&
				r.tryIt.href === 'https://demo.tbmq.io/signup' &&
				r.tryIt.target === '_blank' &&
				r.tryIt.rel.includes('noopener') &&
				/\bgtm_button\b/.test(r.tryIt.cls) &&
				r.tryIt.text === 'Try for free',
			JSON.stringify(r.tryIt)
		);
		check('buttons: no Pricing or installations button left in the bar', r.stray.length === 0, r.stray.join(' '));
		check('buttons: the divider inside the button group is gone', r.dividers === 0, `${r.dividers}`);
		check(
			'buttons: Sign in sits left of Try for free, on one line, neither clipped',
			!!r.signin &&
				!!r.tryIt &&
				r.signin.box.right <= r.tryIt.box.left &&
				Math.abs(r.signin.box.top - r.tryIt.box.top) <= 1 &&
				r.signin.box.width >= 90 &&
				r.tryIt.box.width >= 90,
			JSON.stringify([r.signin?.box, r.tryIt?.box])
		);
		check('buttons: Sign in is outlined', r.signin?.border === '1px' && /rgba\(0, 0, 0, 0\)|transparent/.test(r.signin.bg), JSON.stringify([r.signin?.border, r.signin?.bg]));
	});

	// ── github ───────────────────────────────────────────────────────────────────
	for (const [width, where] of [
		[1440, '.head-buttons'],
		[1200, '.logo-burger'],
		[390, null],
	]) {
		await withPage({ width, height: width < 600 ? 844 : 900 }, async (page) => {
			await go(page, '/product/');
			const r = await page.evaluate(() => {
				const vis = [...document.querySelectorAll('.gh-button')].filter((el) => el.getClientRects().length > 0);
				const signin = document.getElementById('Menu_SignIn');
				return {
					n: vis.length,
					inHead: vis.filter((el) => el.closest('.head-buttons')).length,
					inLogo: vis.filter((el) => el.closest('.logo-burger')).length,
					leftOfSignin: vis[0] && signin ? vis[0].getBoundingClientRect().right <= signin.getBoundingClientRect().left : null,
				};
			});
			const ok =
				where === null
					? r.n === 0
					: where === '.head-buttons'
						? r.n === 1 && r.inHead === 1 && r.leftOfSignin === true
						: r.n === 1 && r.inLogo === 1;
			check(`github @${width}: ${where ? `one visible, in ${where}` : 'none visible'}`, ok, JSON.stringify(r));
		});
	}

	// ── bar fits ─────────────────────────────────────────────────────────────────
	for (const width of [1281, 1366, 1440, 1920]) {
		await withPage({ width, height: 900 }, async (page) => {
			// The blog has the fullest bar: marketing type plus search, theme and the star button.
			for (const path of ['/', '/product/', '/docs/getting-started/', '/blog/', '/pricing/']) {
				await go(page, path);
				// The star count widens the GitHub button once it loads: measure with it showing.
				// Headless Chrome draws no scrollbar; a classic one takes 15px off the bar while the
				// media queries still see the full window, so measure the bar that much narrower.
				await page.evaluate(() => {
					document.querySelectorAll('.gh-button').forEach((b) => {
						b.querySelector('.gh-count').textContent = '12,345';
						b.classList.add('is-loaded');
					});
					document.querySelector('header.header').style.width = 'calc(100% - 15px)';
				});
				await sleep(350);
				const r = await page.evaluate(() => {
					const box = (el) => el.getBoundingClientRect();
					const items = [...document.querySelectorAll('.sm__row > li')];
					const logo = box(document.querySelector('header.header .logo'));
					const first = box(items[0]);
					const last = box(items.at(-1));
					const head = box(document.querySelector('.head-buttons'));
					const tryIt = box(document.getElementById('Menu_TryItNow'));
					const header = box(document.querySelector('header.header'));
					const kids = [...document.querySelectorAll('.head-buttons > *')].filter((el) => el.getClientRects().length > 0).map(box);
					return {
						scrollW: document.documentElement.scrollWidth,
						inner: window.innerWidth,
						tops: [...new Set(items.map((li) => li.offsetTop))],
						rowHeights: [...new Set(items.map((li) => li.querySelector('.sm__top').getBoundingClientRect().height))],
						logoRight: logo.right,
						firstLeft: first.left,
						lastRight: last.right,
						headLeft: head.left,
						headRight: head.right,
						tryRight: tryIt.right,
						tryLeft: tryIt.left,
						headerBottom: header.bottom,
						kidsOverlap: kids.some((k, i) => i > 0 && k.left < kids[i - 1].right - 0.5),
						kidsOneLine: kids.every((k) => k.bottom <= header.bottom + 0.5 && k.top >= header.top - 0.5),
						gap: head.left - last.right,
					};
				});
				const label = `bar fits @${width} ${path}`;
				check(`${label}: no horizontal scrollbar`, r.scrollW <= r.inner, `${r.scrollW} > ${r.inner}`);
				check(`${label}: the row is one line`, r.tops.length === 1 && r.rowHeights.length === 1, JSON.stringify([r.tops, r.rowHeights]));
				check(
					`${label}: logo, menu and buttons do not overlap`,
					r.logoRight <= r.firstLeft && r.lastRight <= r.headLeft && !r.kidsOverlap && r.kidsOneLine,
					JSON.stringify({ logoRight: r.logoRight, firstLeft: r.firstLeft, lastRight: r.lastRight, headLeft: r.headLeft, kidsOverlap: r.kidsOverlap, kidsOneLine: r.kidsOneLine })
				);
				// Other machines set the row in other fonts: leave room for a few percent of drift.
				check(`${label}: at least 24px between the menu and the buttons`, r.gap >= 24, `${Math.round(r.gap)}px`);
				check(`${label}: Try for free is inside the viewport`, r.tryLeft >= 0 && r.tryRight <= r.inner, `${r.tryLeft}–${r.tryRight}`);
			}
		});
	}

	// ── hero buttons ─────────────────────────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		await go(page, '/');
		await sleep(300);
		const colour = () =>
			page.evaluate(() => {
				const s = getComputedStyle(document.getElementById('Menu_SignIn'));
				return { color: s.color, border: s.borderTopColor };
			});
		const c0 = await colour();
		await page.evaluate(() => window.scrollTo(0, 200));
		await sleep(500);
		const c1 = await colour();
		const rgb = (c) => /rgba?\(([^)]+)\)/.exec(c)[1].split(/[,\s/]+/).filter(Boolean).slice(0, 3).map(Number);
		const lum = (c) => rgb(c).reduce((a, v) => a + v, 0) / 3;
		check('hero buttons: Sign in is white over the hero', c0.color === 'rgb(255, 255, 255)', JSON.stringify(c0));
		check('hero buttons: Sign in is dark once the bar is solid', lum(c1.color) < 80, JSON.stringify(c1));
	});

	// ── drawer buttons, short drawer ─────────────────────────────────────────────
	for (const height of [844, 500]) {
		await withPage({ width: 390, height }, async (page) => {
			await go(page, '/product/');
			await page.click('.burger');
			await sleep(400);
			if (height === 500) {
				await page.click(TOP('nav-products'));
				await page.click(TOP('nav-learn'));
				await sleep(300);
			}
			const inView = (sel) =>
				page.evaluate((s) => {
					const el = document.querySelector(s);
					el.scrollIntoView({ block: 'nearest', behavior: 'instant' });
					const r = el.getBoundingClientRect();
					const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
					return {
						ok: r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth && (hit === el || el.contains(hit)),
						top: r.top,
						bottom: r.bottom,
					};
				}, sel);
			const signin = await inView('#Menu_SignIn');
			const tryIt = await inView('#Menu_TryItNow');
			const name = height === 500 ? 'short drawer' : 'drawer buttons';
			check(`${name}: Sign in and Try for free are reachable`, signin.ok && tryIt.ok, JSON.stringify({ signin, tryIt }));
			if (height === 844) {
				const below = await page.evaluate(() => {
					const last = [...document.querySelectorAll('.sm__row > li > .sm__top')].at(-1).getBoundingClientRect();
					const b = document.getElementById('Menu_SignIn').getBoundingClientRect();
					return { ok: b.top >= last.bottom, fromBottom: window.innerHeight - b.bottom };
				});
				check('drawer buttons: they sit below the last item, at the bottom', below.ok && below.fromBottom < 60, JSON.stringify(below));
				const others = await visibleCount(page, '.head-buttons .gh-button, .head-buttons search-button, .head-buttons theme-toggle');
				check('drawer buttons: the button group shows only its two buttons', others === 0, `${others}`);
			} else {
				const firstItem = await inView('.sm__row > li:first-child > .sm__top');
				const lastItem = await inView('.sm__row > li:last-child > .sm__top');
				check('short drawer: the first and the last menu item can be scrolled to', firstItem.ok && lastItem.ok, JSON.stringify({ firstItem, lastItem }));
			}
		});
	}

	// ── search and theme unchanged ───────────────────────────────────────────────
	await withPage({ width: 1440 }, async (page) => {
		const count = async (path) => {
			await go(page, path);
			return { search: await visibleCount(page, 'search-button'), theme: await visibleCount(page, 'theme-toggle') };
		};
		const docs = await count('/docs/getting-started/');
		const home = await count('/');
		const product = await count('/product/');
		check('search and theme: shown on docs', docs.search === 1 && docs.theme === 1, JSON.stringify(docs));
		check('search and theme: hidden on the landing and the product page', home.search + home.theme + product.search + product.theme === 0, JSON.stringify({ home, product }));
	});

	if (process.env.SHOT) {
		mkdirSync(process.env.SHOT, { recursive: true });
		await withPage({ width: 390, height: 844 }, async (page) => {
			await go(page, '/product/', 'networkidle2');
			await page.addStyleTag({ content: 'astro-dev-toolbar,#cookie-banner{display:none!important}' });
			await page.click('.burger');
			await sleep(400);
			const file = join(process.env.SHOT, 'drawer@390.png');
			await page.screenshot({ path: file, captureBeyondViewport: false });
			console.log(file);
		});
	}
}

done();
