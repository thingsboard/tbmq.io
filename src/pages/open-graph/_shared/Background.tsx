// src/pages/open-graph/_shared/Background.tsx
//
// Full-canvas decoration painted under every card: a 1200×630 dark base with
// scattered nodes (mostly brand-green, two accent-orange) connected by faint
// lines and a soft deep-green glow. Coordinates are in % of canvas so the SVG
// scales to whatever the parent gives it.

import { html } from 'satori-html';

const DOTS: Array<[number, number, number, 'green' | 'orange']> = [
	// [xPct, yPct, radiusUnits, colorKey]   radiusUnits scaled to 1.6/1.8 px at 1200 wide
	[6, 12, 1.8, 'green'], [14, 28, 1.6, 'green'], [22, 56, 1.8, 'green'],
	[30, 18, 1.6, 'green'], [36, 44, 1.8, 'green'], [44, 70, 1.6, 'green'],
	[52, 22, 2.0, 'orange'],
	[56, 50, 1.8, 'green'], [64, 36, 1.6, 'green'], [68, 76, 1.8, 'green'],
	[74, 14, 1.6, 'green'], [78, 56, 1.8, 'green'],
	[82, 32, 1.8, 'orange'],
	[86, 78, 1.8, 'green'], [92, 22, 1.6, 'green'], [94, 60, 1.8, 'green'],
	[50, 88, 1.6, 'green'], [60, 64, 1.6, 'green'],
];

const LINES: Array<[number, number, number, number, 'green' | 'orange']> = [
	[6, 12, 14, 28, 'green'],   [14, 28, 22, 56, 'green'],  [14, 28, 30, 18, 'green'],
	[22, 56, 36, 44, 'green'],  [30, 18, 36, 44, 'green'],  [36, 44, 44, 70, 'green'],
	[36, 44, 56, 50, 'green'],  [52, 22, 64, 36, 'orange'],
	[56, 50, 64, 36, 'green'],  [56, 50, 68, 76, 'green'],  [64, 36, 74, 14, 'green'],
	[64, 36, 78, 56, 'green'],  [74, 14, 82, 32, 'green'],  [78, 56, 82, 32, 'orange'],
	[78, 56, 86, 78, 'green'],  [82, 32, 92, 22, 'green'],  [82, 32, 94, 60, 'green'],
	[44, 70, 50, 88, 'green'],  [50, 88, 68, 76, 'green'],  [50, 88, 86, 78, 'green'],
	[60, 64, 78, 56, 'green'],  [60, 64, 50, 88, 'green'],
];

const W = 1200;
const H = 630;

const COLOR = { green: '#7ee0a0', orange: '#ff5722' } as const;

/** Build the SVG markup for the network. Inlined as a string and parsed into a Satori-compatible VNode tree by `satori-html` at render time. */
function networkSvg(): string {
	const lineEls = LINES.map(
		([x1, y1, x2, y2, key]) =>
			`<line x1="${(x1 * W) / 100}" y1="${(y1 * H) / 100}" x2="${(x2 * W) / 100}" y2="${(y2 * H) / 100}" stroke="${COLOR[key]}" stroke-width="${key === 'orange' ? 0.6 : 0.5}" opacity="${key === 'orange' ? 0.55 : 0.42}"/>`,
	).join('');
	const dotEls = DOTS.map(
		([x, y, r, key]) =>
			`<circle cx="${(x * W) / 100}" cy="${(y * H) / 100}" r="${r}" fill="${COLOR[key]}" opacity="${key === 'orange' ? 0.95 : 0.78}"/>`,
	).join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0">${lineEls}${dotEls}</svg>`;
}

/**
 * Render the background. The network SVG is parsed into a Satori-compatible
 * VNode tree by satori-html (Satori does not support dangerouslySetInnerHTML).
 * Caller is responsible for wrapping in a relative container (the Card root).
 */
export function Background() {
	return (
		<>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'radial-gradient(70% 70% at 70% 50%, rgba(22,110,60,0.55), transparent 60%)',
				}}
			/>
			<div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
				{html(networkSvg())}
			</div>
		</>
	);
}
