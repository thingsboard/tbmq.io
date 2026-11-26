/* eslint-disable no-undef -- Node and browser globals: these scripts run outside the site code the lint config describes */
// Shared harness for the browser checks: one headless Chrome per withPage() call.
import puppeteer from 'puppeteer-core';

export const BASE = process.env.BASE ?? 'http://localhost:4331';

let failed = 0;
let total = 0;

/**
 * @param {{ width?: number; height?: number; touch?: boolean; js?: boolean; dark?: boolean }} opts
 * @param {(page: import('puppeteer-core').Page) => Promise<void>} fn
 */
export async function withPage(opts, fn) {
	const { width = 1440, height = 900, touch = false, js = true, dark = false } = opts ?? {};
	const browser = await puppeteer.launch({
		executablePath: '/usr/bin/google-chrome',
		headless: true,
		args: ['--no-sandbox', '--hide-scrollbars', '--disable-gpu'],
	});
	try {
		const page = await browser.newPage();
		await page.setViewport({ width, height, hasTouch: touch, isMobile: false, deviceScaleFactor: 1 });
		if (!js) await page.setJavaScriptEnabled(false);
		if (dark) {
			await page.evaluateOnNewDocument(() => {
				try {
					localStorage.setItem('starlight-theme', 'dark');
				} catch {
					/* storage unavailable */
				}
			});
		}
		page.setDefaultTimeout(60_000);
		page.setDefaultNavigationTimeout(120_000);
		await fn(page);
	} finally {
		await browser.close();
	}
}

/** Navigate and wait for the page to settle (the dev server compiles on first hit). */
export async function go(page, path, waitUntil = 'load') {
	const res = await page.goto(BASE + path, { waitUntil });
	// The dev server's toolbar floats over the page bottom and swallows hit-tests there; production has none.
	try {
		await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
	} catch {
		/* JavaScript disabled: nothing to inject with, and no toolbar either */
	}
	return res;
}

export function check(name, ok, detail = '') {
	total += 1;
	if (ok) {
		console.log(`ok ${name}`);
	} else {
		failed += 1;
		console.log(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
	}
}

export function done() {
	console.log(`\n${total - failed}/${total} checks passed`);
	process.exit(failed ? 1 : 0);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
