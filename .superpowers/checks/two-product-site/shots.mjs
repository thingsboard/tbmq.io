/* eslint-disable no-undef -- Node and browser globals: these scripts run outside the site code the lint config describes */
// node shots.mjs <outDir> <width,width,…> <path> [<path>…]   (env DARK=1 for the dark theme, SCROLL=<px> to scroll first)
// Full-page PNGs named <slug>@<width>.png.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { go, sleep, withPage } from './lib.mjs';

const [outDir, widthsArg, ...paths] = process.argv.slice(2);
if (!outDir || !widthsArg || paths.length === 0) {
	console.error('usage: node shots.mjs <outDir> <width,width,…> <path> [<path>…]');
	process.exit(2);
}
const widths = widthsArg.split(',').map(Number);
const dark = process.env.DARK === '1';
const scroll = Number(process.env.SCROLL ?? 0);
mkdirSync(outDir, { recursive: true });

const slug = (p) => p.replace(/^\/|\/$/g, '').replace(/[/#?=&]/g, '_') || 'home';

for (const width of widths) {
	await withPage({ width, height: width < 600 ? 844 : 900, dark }, async (page) => {
		for (const path of paths) {
			await go(page, path, 'networkidle2');
			// Reveal-on-scroll sections stay invisible in a full-page capture unless forced.
			await page.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important}astro-dev-toolbar,#cookie-banner{display:none!important}' });
			if (scroll) await page.evaluate((y) => window.scrollTo(0, y), scroll);
			await sleep(300);
			const file = join(outDir, `${slug(path)}${scroll ? `+${scroll}` : ''}${dark ? '+dark' : ''}@${width}.png`);
			await page.screenshot({ path: file, fullPage: !scroll });
			console.log(file);
		}
	});
}
