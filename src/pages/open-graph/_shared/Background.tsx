// src/pages/open-graph/_shared/Background.tsx
//
// Full-canvas decoration painted under every card: a 1200×630 dark base with
// scattered network nodes (plus two sparse accents) connected by faint lines
// and a soft deep-green glow. Coordinates are in % of canvas so the SVG scales
// to whatever the parent gives it. Dots and lines are keyed by *role*
// ('node' | 'accent'), so a palette change is one edit in colors.ts and the
// geometry stays untouched.

import { html } from 'satori-html';
import { NETWORK_COLORS } from '@root/pages/open-graph/_shared/colors';

type NetworkRole = 'node' | 'accent';

const DOTS: Array<[number, number, number, NetworkRole]> = [
	// [xPct, yPct, radiusUnits, role]   radiusUnits scaled to 1.6/1.8 px at 1200 wide
	[6, 12, 1.8, 'node'], [14, 28, 1.6, 'node'], [22, 56, 1.8, 'node'],
	[30, 18, 1.6, 'node'], [36, 44, 1.8, 'node'], [44, 70, 1.6, 'node'],
	[52, 22, 2.0, 'accent'],
	[56, 50, 1.8, 'node'], [64, 36, 1.6, 'node'], [68, 76, 1.8, 'node'],
	[74, 14, 1.6, 'node'], [78, 56, 1.8, 'node'],
	[82, 32, 1.8, 'accent'],
	[86, 78, 1.8, 'node'], [92, 22, 1.6, 'node'], [94, 60, 1.8, 'node'],
	[50, 88, 1.6, 'node'], [60, 64, 1.6, 'node'],
];

const LINES: Array<[number, number, number, number, NetworkRole]> = [
	[6, 12, 14, 28, 'node'],   [14, 28, 22, 56, 'node'],  [14, 28, 30, 18, 'node'],
	[22, 56, 36, 44, 'node'],  [30, 18, 36, 44, 'node'],  [36, 44, 44, 70, 'node'],
	[36, 44, 56, 50, 'node'],  [52, 22, 64, 36, 'accent'],
	[56, 50, 64, 36, 'node'],  [56, 50, 68, 76, 'node'],  [64, 36, 74, 14, 'node'],
	[64, 36, 78, 56, 'node'],  [74, 14, 82, 32, 'node'],  [78, 56, 82, 32, 'accent'],
	[78, 56, 86, 78, 'node'],  [82, 32, 92, 22, 'node'],  [82, 32, 94, 60, 'node'],
	[44, 70, 50, 88, 'node'],  [50, 88, 68, 76, 'node'],  [50, 88, 86, 78, 'node'],
	[60, 64, 78, 56, 'node'],  [60, 64, 50, 88, 'node'],
];

const W = 1200;
const H = 630;

/** Build the SVG markup for the network. Inlined as a string and parsed into a Satori-compatible VNode tree by `satori-html` at render time. */
function networkSvg(): string {
	const lineEls = LINES.map(
		([x1, y1, x2, y2, role]) =>
			`<line x1="${(x1 * W) / 100}" y1="${(y1 * H) / 100}" x2="${(x2 * W) / 100}" y2="${(y2 * H) / 100}" stroke="${NETWORK_COLORS[role]}" stroke-width="${role === 'accent' ? 0.6 : 0.5}" opacity="${role === 'accent' ? 0.55 : 0.42}"/>`,
	).join('');
	const dotEls = DOTS.map(
		([x, y, r, role]) =>
			`<circle cx="${(x * W) / 100}" cy="${(y * H) / 100}" r="${r}" fill="${NETWORK_COLORS[role]}" opacity="${role === 'accent' ? 0.95 : 0.78}"/>`,
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
					background: `radial-gradient(70% 70% at 70% 50%, ${NETWORK_COLORS.glow}, transparent 60%)`,
				}}
			/>
			<div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
				{html(networkSvg())}
			</div>
		</>
	);
}
