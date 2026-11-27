/* eslint-disable no-undef -- Node and browser globals: these scripts run outside the site code the lint config describes */
// node pages.mjs [product-lite] [installations] — the marketing pages this work adds or rebuilds.
// env BANNED_TEXT=<regex> also asserts that neither page's text matches it (phrases that must stay off the site).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE, check, done, go, sleep, withPage } from './lib.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const sections = process.argv.slice(2);
const want = (name) => sections.length === 0 || sections.includes(name);
const banned = process.env.BANNED_TEXT ? new RegExp(process.env.BANNED_TEXT, 'i') : null;

const htmlCache = new Map();
async function fetchPage(pathname) {
	if (!htmlCache.has(pathname)) {
		const res = await fetch(BASE + pathname, { redirect: 'manual' });
		htmlCache.set(pathname, { status: res.status, html: res.status === 200 ? await res.text() : '' });
	}
	return htmlCache.get(pathname);
}

/**
 * Every internal link answers 200 (no redirect) and every #fragment exists as an id on its target.
 * `links` are raw href values; `self` is the page they were read from.
 */
async function checkInternalLinks(label, self, links) {
	const unique = [...new Set(links)].filter((h) => h.startsWith('/') || h.startsWith('#'));
	const bad = [];
	for (const href of unique) {
		const [beforeHash, fragment] = href.split('#');
		const pathname = (beforeHash || self).split('?')[0];
		const { status, html } = await fetchPage(pathname);
		if (status !== 200) {
			bad.push(`${href} → ${status}`);
			continue;
		}
		if (fragment && !new RegExp(`\\sid=["']${fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(html)) {
			bad.push(`${href} → no #${fragment}`);
		}
	}
	check(`${label} internal links (${unique.length}) answer 200 with their fragments`, bad.length === 0, bad.join('; '));
}

if (want('product-lite')) {
	const ver = /TBMQ_LITE_VER\s*=\s*'([^']+)'/.exec(readFileSync(join(ROOT, 'src/data/versions.ts'), 'utf8'))?.[1];
	const PATH = '/product/lite/';
	const IDS = ['lite-hero', 'lite-features', 'lite-build', 'lite-guarantees', 'lite-capacity', 'lite-compare', 'lite-cta'];

	await withPage({ width: 1440 }, async (page) => {
		const res = await go(page, PATH);
		check('product-lite answers 200', res.status() === 200, `status ${res.status()}`);
		const r = await page.evaluate((ids) => {
			const hero = document.getElementById('lite-hero');
			const copy = hero?.querySelector('[data-copy]');
			return {
				h1: document.querySelectorAll('h1').length,
				missing: ids.filter((id) => !document.getElementById(id)),
				order: ids.map((id) => document.getElementById(id)?.getBoundingClientRect().top ?? -1),
				capacityInside: !!document.querySelector('#lite-guarantees #lite-capacity'),
				heroText: hero?.innerText ?? '',
				copy: copy?.getAttribute('data-copy') ?? '',
				copyIsButton: copy?.tagName === 'BUTTON',
				heroInstall: !!hero?.querySelector('a[href="/docs/lite/installation/"]'),
				heroCompare: !!hero?.querySelector('a[href="#lite-compare"]'),
				text: document.body.innerText,
				htmlId: document.documentElement.id,
				title: document.title,
				description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
				links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
				scrollW: document.documentElement.scrollWidth,
				innerW: window.innerWidth,
			};
		}, IDS);
		check('product-lite has exactly one h1', r.h1 === 1, `${r.h1}`);
		check('product-lite has the seven sections', r.missing.length === 0, `missing ${r.missing.join(', ')}`);
		check('product-lite #lite-capacity sits inside #lite-guarantees', r.capacityInside);
		check(
			'product-lite hero shows the image tag from TBMQ_LITE_VER',
			!!ver && r.heroText.includes(`thingsboard/tbmq-lite:${ver}`),
			`ver=${ver}`
		);
		const command = `docker run -d --name tbmq-lite --restart unless-stopped \\\n  -p 1883:1883 -p 8083:8083 -p 8084:8084 \\\n  -v tbmq-lite:/data thingsboard/tbmq-lite:${ver}`;
		check('product-lite copy button holds the whole command', r.copyIsButton && r.copy === command, JSON.stringify(r.copy));
		check('product-lite hero links to the install guide', r.heroInstall);
		check('product-lite hero links to #lite-compare', r.heroCompare);
		check('product-lite states 7,500 and 3,750', r.text.includes('7,500') && r.text.includes('3,750'));
		if (banned) check('product-lite has no banned text', !banned.test(r.text));
		check('product-lite states its limits', /one node/i.test(r.text) && /DEVICE/.test(r.text) && /no integrations/i.test(r.text));
		check('product-lite <html id="product">', r.htmlId === 'product', r.htmlId);
		check('product-lite title starts with TBMQ Lite', r.title.startsWith('TBMQ Lite'), r.title);
		check(
			'product-lite description is at most 160 characters',
			r.description.length > 0 && r.description.length <= 160,
			`${r.description.length}`
		);
		check('product-lite no horizontal scroll at 1440', r.scrollW <= r.innerW, `${r.scrollW} > ${r.innerW}`);
		await checkInternalLinks('product-lite', PATH, r.links);
	});

	await withPage({ width: 390, height: 844 }, async (page) => {
		await go(page, PATH);
		await sleep(200);
		const r = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: window.innerWidth }));
		check('product-lite no horizontal scroll at 390', r.s <= r.w, `${r.s} > ${r.w}`);
	});
}

if (want('installations')) {
	const PATH = '/installations/';
	const PE = '/docs/pe/installation';
	// The chips of each section, in order.
	const TBMQ_CHIPS = [
		`${PE}/docker/`,
		`${PE}/docker-windows/`,
		'/docs/installation/building-from-source/',
		`${PE}/cluster/docker-compose-setup/`,
		`${PE}/cluster/minikube-cluster-setup/`,
		`${PE}/cluster/aws-cluster-setup/`,
		`${PE}/cluster/azure-cluster-setup/`,
		`${PE}/cluster/gcp-cluster-setup/`,
		`${PE}/cluster/helm-cluster-setup-minikube/`,
		`${PE}/cluster/helm-cluster-setup-aws/`,
		`${PE}/cluster/helm-cluster-setup-azure/`,
		`${PE}/cluster/helm-cluster-setup-gcp/`,
	];
	const LITE_CHIPS = ['/docs/lite/installation/#install', '/docs/lite/installation/#docker-compose'];

	await withPage({ width: 1440 }, async (page) => {
		const res = await go(page, PATH);
		check('installations answers 200', res.status() === 200, `status ${res.status()}`);
		const r = await page.evaluate(() => {
			const attrs = (el) =>
				el
					? {
							href: el.getAttribute('href'),
							cls: el.className,
							target: el.getAttribute('target'),
							rel: el.getAttribute('rel') ?? '',
						}
					: null;
			const chips = (id) => [...document.querySelectorAll(`#${id} .install__chip`)].map((a) => a.getAttribute('href'));
			return {
				h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
				sections: [...document.querySelectorAll('section.install__product')].map((s) => s.id),
				nav: [...document.querySelectorAll('nav.install-nav a')].map((a) => a.getAttribute('href')),
				pe: attrs(document.getElementById('TryItNow_TBMQ_Install_PE')),
				ce: attrs(document.getElementById('TryItNow_TBMQ_Install_CE')),
				signup: attrs(document.querySelector('#live-demo a[href="https://demo.tbmq.io/signup"]')),
				tbmqChips: chips('tbmq'),
				liteChips: chips('tbmq-lite'),
				chipLogos: [...document.querySelectorAll('.install__chip img')].map((i) => i.getAttribute('src') ?? ''),
				tiles: document.querySelectorAll('section.install__product .product-tile').length,
				liteTag: document.querySelector('#tbmq-lite .install__tag')?.textContent.trim() ?? null,
				externals: [...document.querySelectorAll('.install a[href^="http"]')].map(attrs),
				links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
				htmlId: document.documentElement.id,
				title: document.title,
				text: document.body.innerText,
			};
		});
		check('installations h1', r.h1.length === 1 && r.h1[0] === 'Get TBMQ running', r.h1.join(' | '));
		check('installations sections in order', r.sections.join() === 'live-demo,tbmq,tbmq-lite', r.sections.join());
		check('installations nav links to the three sections', r.nav.join() === '#live-demo,#tbmq,#tbmq-lite', r.nav.join());
		check(
			'installations PE guide button keeps its id, href and class',
			r.pe?.href === '/docs/pe/installation/' && / ?gtm_button/.test(r.pe.cls),
			JSON.stringify(r.pe)
		);
		check(
			'installations CE guide link keeps its id, href and class',
			r.ce?.href === '/docs/installation/' && / ?gtm_button/.test(r.ce.cls),
			JSON.stringify(r.ce)
		);
		check(
			'installations live demo signs up in a new tab',
			r.signup?.target === '_blank' && r.signup.rel.includes('noopener'),
			JSON.stringify(r.signup)
		);
		check('installations TBMQ has its 12 chips', r.tbmqChips.join() === TBMQ_CHIPS.join(), r.tbmqChips.join(' '));
		check('installations TBMQ Lite has its 2 chips', r.liteChips.join() === LITE_CHIPS.join(), r.liteChips.join(' '));
		check(
			'installations every chip has a local logo',
			r.chipLogos.length === 14 && r.chipLogos.every((s) => s && !s.includes('img.thingsboard.io')),
			r.chipLogos.filter((s) => !s || s.includes('img.thingsboard.io')).join(' ') || `${r.chipLogos.length} logos`
		);
		check('installations each section has a product tile', r.tiles === 3, `${r.tiles}`);
		check('installations TBMQ Lite is tagged Beta', r.liteTag === 'Beta', `${r.liteTag}`);
		const badExternal = r.externals.filter((a) => a.target !== '_blank' || !a.rel.includes('noopener'));
		check('installations external links open in a new tab', badExternal.length === 0, JSON.stringify(badExternal));
		check('installations <html id="installations">', r.htmlId === 'installations', r.htmlId);
		check('installations title', r.title.startsWith('Install TBMQ and TBMQ Lite'), r.title);
		if (banned) check('installations has no banned text', !banned.test(r.text));
		await checkInternalLinks('installations', PATH, r.links);

		// The tab of the section being read is lit.
		await page.evaluate(() => document.getElementById('tbmq-lite').scrollIntoView({ behavior: 'instant' }));
		await sleep(400);
		const current = await page.evaluate(() =>
			[...document.querySelectorAll('nav.install-nav a[aria-current="location"]')].map((a) => a.getAttribute('href'))
		);
		check('installations lights the TBMQ Lite tab when scrolled to it', current.join() === '#tbmq-lite', current.join());
		const stuck = await page.evaluate(() => {
			const nav = document.querySelector('nav.install-nav');
			const header = document.querySelector('header.header');
			return { navTop: nav.getBoundingClientRect().top, headerBottom: header.getBoundingClientRect().bottom };
		});
		check(
			'installations tabs stick right under the header',
			Math.abs(stuck.navTop - stuck.headerBottom) <= 1,
			JSON.stringify(stuck)
		);
	});

	await withPage({ width: 390, height: 844 }, async (page) => {
		await go(page, PATH);
		await sleep(200);
		const r = await page.evaluate(() => {
			const list = document.querySelector('nav.install-nav ul');
			return {
				s: document.documentElement.scrollWidth,
				w: window.innerWidth,
				overflowX: list ? getComputedStyle(list).overflowX : null,
				listFits: list ? list.getBoundingClientRect().right <= window.innerWidth + 1 : false,
			};
		});
		check('installations no horizontal scroll at 390', r.s <= r.w, `${r.s} > ${r.w}`);
		check(
			'installations tab row scrolls inside itself at 390',
			r.overflowX === 'auto' && r.listFits,
			JSON.stringify(r)
		);
	});
}

done();
