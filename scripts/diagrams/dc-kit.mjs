/**
 * Shared drawing primitives for the diagrams ported from the approved Thingsboard
 * design components (the `*.dc.html` sources).
 *
 * Those components carry their OWN light/dark token set — violet = MQTT clients,
 * blue = broker process, teal = Kafka, slate = storage & management — which is
 * deliberately different from `kit.mjs` THEMES. Everything a `.dc` port needs
 * lives here so the port modules stay declarative: `hero-dc.mjs` (the
 * architecture hero) and `perf-dc.mjs` (the three benchmark diagrams).
 *
 * Two deliberate deviations from the HTML sources, both applying to every port:
 *   - brand logos (Kafka, Redis) and glyph-shaped Material icons (`http`, which
 *     is the literal lettering "http") become stroked line-icons, because a
 *     committed SVG may not reference a CDN and lettering does not survive the
 *     line-icon style;
 *   - CSS line boxes become explicit baselines — text is positioned with
 *     `dominant-baseline="middle"` at the centre of the box the browser would
 *     have produced, so the vertical rhythm survives the translation.
 *
 * All text stays real `<text>` so the source remains diffable and greppable.
 */

export const FONT = "Roboto, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
export const MONO = "'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

/** Design-component tokens, verbatim from the approved components. */
export const DC = {
	dark: {
		name: 'dark',
		bg: '#0b0b10',
		dot: 'rgba(255,255,255,0.10)',
		node: '#101017',
		txt: '#e9e9f2',
		muted: '#8e8ea3',
		faint: '#6a6a7d',
		violet: '#8b5cf6',
		violetTile: 'rgba(139,92,246,0.16)',
		violetIco: '#c4b5fd',
		violetLine: '#d946ef',
		blue: '#3b6ef6',
		blueTile: 'rgba(59,110,246,0.18)',
		blueIco: '#93b4ff',
		blueLine: '#3b82f6',
		blueFill: 'rgba(59,110,246,0.07)',
		teal: '#14b8a6',
		tealTile: 'rgba(20,184,166,0.14)',
		tealIco: '#5eead4',
		tealLine: '#14b8a6',
		slate: '#3a3a48',
		slateTile: 'rgba(255,255,255,0.07)',
		slateIco: '#a6a6bb',
		slateLine: '#6b6b80',
		err: '#ef5350',
		errTile: 'rgba(239,83,80,0.14)',
		errIco: '#ef9a9a',
		errLine: '#ef5350',
		chip: 'rgba(255,255,255,0.05)',
		chipBd: 'rgba(255,255,255,0.12)',
		dash: 'rgba(139,92,246,0.38)',
		dashBlue: 'rgba(59,110,246,0.45)',
		dashTeal: 'rgba(20,184,166,0.40)',
		dashSlate: 'rgba(255,255,255,0.18)',
	},
	light: {
		name: 'light',
		bg: '#ffffff',
		dot: 'rgba(0,0,0,0.10)',
		node: '#ffffff',
		txt: '#1b1f2a',
		muted: '#5f6675',
		faint: '#8a90a0',
		violet: '#bda9f9',
		violetTile: '#f3ecff',
		violetIco: '#7c3aed',
		violetLine: '#d946ef',
		blue: '#b6c2f7',
		blueTile: '#e6ecff',
		blueIco: '#2f4fd8',
		blueLine: '#2f4fe0',
		blueFill: 'rgba(59,110,246,0.045)',
		teal: '#96ded3',
		tealTile: '#e3f7f3',
		tealIco: '#0d8577',
		tealLine: '#0f9e8f',
		slate: '#d8dbe3',
		slateTile: '#eff1f6',
		slateIco: '#4c5568',
		slateLine: '#8b93a5',
		err: '#e57373',
		errTile: '#fdecea',
		errIco: '#c62828',
		errLine: '#d32f2f',
		chip: '#f5f6fa',
		chipBd: '#e2e5ec',
		dash: 'rgba(124,58,237,0.35)',
		dashBlue: 'rgba(47,79,224,0.35)',
		dashTeal: 'rgba(15,158,143,0.35)',
		dashSlate: 'rgba(0,0,0,0.18)',
	},
};

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * `rgba(r,g,b,a)` → `['#rrggbb', a]`, everything else → `[color, 1]`.
 * Presentation attributes take a hex + a separate `*-opacity`, which every
 * renderer honours (rgba() in an attribute is SVG2-only).
 */
export function col(c) {
	const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(c);
	if (!m) return [c, 1];
	const hex = '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
	return [hex, m[4] == null ? 1 : Number(m[4])];
}

export const fillAttr = (c) => {
	if (!c || c === 'none') return 'fill="none"';
	const [hex, a] = col(c);
	return `fill="${hex}"` + (a < 1 ? ` fill-opacity="${a}"` : '');
};

export const strokeAttr = (c, w = 1) => {
	if (!c || c === 'none') return 'stroke="none"';
	const [hex, a] = col(c);
	return `stroke="${hex}" stroke-width="${w}"` + (a < 1 ? ` stroke-opacity="${a}"` : '');
};

// Advance-width estimates (Roboto ≈ 0.52em mixed case, Roboto Mono = 0.60em).
export const sw = (s, size) => s.length * size * 0.52;
export const mw = (s, size) => s.length * size * 0.6;

/** 24×24 line-icon geometry, shared by every `.dc` port. */
const ICONS = {
	chip: `<rect x="6" y="6" width="12" height="12" rx="2.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 6V3.5M15 6V3.5M9 20.5V18M15 20.5V18M6 9H3.5M6 15H3.5M20.5 9H18M20.5 15H18"/>`,
	apps: `<rect x="3.5" y="5" width="17" height="4.5" rx="1.5"/><rect x="3.5" y="14.5" width="17" height="4.5" rx="1.5"/><circle cx="7" cy="7.25" r="0.9" fill="currentColor" stroke="none"/><circle cx="7" cy="16.75" r="0.9" fill="currentColor" stroke="none"/>`,
	lan: `<rect x="9" y="2.5" width="6" height="6" rx="1.3"/><rect x="2.5" y="15.5" width="6" height="6" rx="1.3"/><rect x="9" y="15.5" width="6" height="6" rx="1.3"/><rect x="15.5" y="15.5" width="6" height="6" rx="1.3"/><path d="M12 8.5v3.5M5.5 15.5V12h13v3.5M12 12v3.5"/>`,
	hub: `<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="3.6" r="1.7"/><circle cx="12" cy="20.4" r="1.7"/><circle cx="3.6" cy="12" r="1.7"/><circle cx="20.4" cy="12" r="1.7"/><path d="M12 5.3v3.5M12 15.2v3.5M5.3 12h3.5M15.2 12h3.5"/>`,
	split: `<circle cx="5" cy="12" r="2.2"/><circle cx="19" cy="5.5" r="2.2"/><circle cx="19" cy="12" r="2.2"/><circle cx="19" cy="18.5" r="2.2"/><path d="M7.1 11.1 16.9 6.2M7.2 12H16.8M7.1 12.9 16.9 17.8"/>`,
	tree: `<circle cx="12" cy="4.5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="19.5" r="2"/><circle cx="18" cy="19.5" r="2"/><path d="M10.7 6.1 7.1 10.4M13.3 6.1l3.6 4.3M6 14v3.5M18 14v3.5"/>`,
	dashboard: `<rect x="3.5" y="3.5" width="7" height="9" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5.5" rx="1.5"/><rect x="13.5" y="12" width="7" height="8.5" rx="1.5"/><rect x="3.5" y="15" width="7" height="5.5" rx="1.5"/>`,
	db: `<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>`,
	// `settings` — the Integration Executor process
	gear: `<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7"/>`,
	// `settings_suggest` — the broker-side integration service (gear + sparkle)
	gearSparkle: `<circle cx="10.5" cy="13" r="2.6"/><circle cx="10.5" cy="13" r="6"/><path d="M10.5 4.8v2.2M10.5 19v2.2M2.3 13h2.2M16.5 13h2.2M4.7 7.2 6.2 8.7M14.8 17.3l1.5 1.5M16.3 7.2l-1.5 1.5M6.2 17.3l-1.5 1.5"/><path d="M18.8 2.6l.85 1.95 1.95.85-1.95.85-.85 1.95-.85-1.95-1.95-.85 1.95-.85z"/>`,
	// `login` — an integration, i.e. the executor's outbound connector
	login: `<path d="M10.5 3.5H19a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-8.5"/><path d="M3.5 12h10M10 8.5l3.5 3.5-3.5 3.5"/>`,
	// `desktop_windows` — an external system
	monitor: `<rect x="2.5" y="4" width="19" height="12.5" rx="1.8"/><path d="M9 20.5h6M12 16.5v4"/>`,
	// `manage_accounts` — the administrator acting through the UI or REST API
	adminUser: `<circle cx="9.5" cy="8" r="3.6"/><path d="M3 19.8c0-3.4 2.9-5.6 6.5-5.6.95 0 1.9.15 2.75.45"/><circle cx="17.6" cy="17" r="2"/><path d="M17.6 13.3v1.4M17.6 19.3v1.4M13.9 17h1.4M19.9 17h1.4"/>`,
	// stand-ins for the designs' CDN brand logos (see module header)
	kafka: `<circle cx="6" cy="12" r="2.3"/><circle cx="17.5" cy="6" r="2.3"/><circle cx="17.5" cy="18" r="2.3"/><path d="M8 10.9 15.6 6.9M8 13.1l7.6 4"/>`,
	redis: `<ellipse cx="12" cy="6" rx="7.5" ry="2.6"/><path d="M4.5 6v5c0 1.4 3.4 2.6 7.5 2.6s7.5-1.2 7.5-2.6V6M4.5 11v5c0 1.4 3.4 2.6 7.5 2.6s7.5-1.2 7.5-2.6v-5"/>`,
	plug: `<path d="M4 12h6M14 12h6"/><rect x="9.5" y="7.5" width="5" height="9" rx="1.6"/><path d="M4 9.5v5M20 9.5v5"/>`,
	globe: `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17M5 6.5c4 2.5 10 2.5 14 0M5 17.5c4-2.5 10-2.5 14 0"/>`,
	chevron: `<path d="M9.5 5.5 16 12l-6.5 6.5"/>`,
};

/**
 * Primitives bound to one theme. `frame()` closes over the arrowhead markers
 * collected by `arrow()`, so draw first and frame last.
 */
export function makeDcKit(T) {
	const markers = new Map();

	function text(x, y, str, o = {}) {
		const { size = 13, weight = 400, fill = T.txt, anchor = 'start', mono = false, ls } = o;
		const [hex, a] = col(fill);
		return (
			`<text x="${x}" y="${y}" font-family="${mono ? MONO : FONT}" font-size="${size}" font-weight="${weight}"` +
			` fill="${hex}"${a < 1 ? ` fill-opacity="${a}"` : ''} text-anchor="${anchor}"` +
			`${ls ? ` letter-spacing="${ls}"` : ''} dominant-baseline="middle">${esc(str)}</text>`
		);
	}

	const rr = (x, y, w, h, r, o = {}) =>
		`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${fillAttr(o.fill ?? 'none')} ` +
		`${strokeAttr(o.stroke, o.sw ?? 1)}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;

	/** 24×24 stroked line-icons, scaled and centred on (cx, cy). */
	function icon(name, cx, cy, size, color) {
		const paths = ICONS[name];
		const s = size / 24;
		const [hex, a] = col(color);
		return (
			`<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${s})" fill="none" stroke="${hex}"` +
			`${a < 1 ? ` stroke-opacity="${a}"` : ''} stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`
		);
	}

	/** Rounded icon tile (the small coloured square that leads every card). */
	const tile = (x, y, size, r, bg, ico, icoColor, icoSize) =>
		rr(x, y, size, size, r, { fill: bg }) + icon(ico, x + size / 2, y + size / 2, icoSize, icoColor);

	function marker(color) {
		const [hex] = col(color);
		const id = `ah-${hex.slice(1)}`;
		if (!markers.has(id)) markers.set(id, hex);
		return id;
	}

	/**
	 * `o.bidir` adds a head at the start, `o.dash` renders a dashed line (with butt
	 * caps, as the designs do — round caps would swell every dash), and `o.plain`
	 * drops the end head for the leading segment of a forked connector.
	 */
	const arrow = (d, color, o = {}) =>
		`<path d="${d}" fill="none" ${strokeAttr(color, 1.8)}` +
		`${o.dash ? ` stroke-dasharray="${o.dash}"` : ' stroke-linecap="round"'} stroke-linejoin="round"` +
		`${o.bidir ? ` marker-start="url(#${marker(color)})"` : ''}` +
		`${o.plain ? '' : ` marker-end="url(#${marker(color)})"`}/>`;

	/** tile + title/sub stacked to its right. */
	function rowCard(o) {
		const { x, y, w, h, border, tileBg, tileIco, ico, title, sub, titleSize = 18, gap = 14, pad = 18 } = o;
		const cy = y + h / 2;
		const tx = x + pad;
		let s = rr(x, y, w, h, 10, { fill: T.node, stroke: border, sw: 1 });
		s += tile(tx, cy - 20, 40, 8, tileBg, ico, tileIco, 22);
		const lx = tx + 40 + gap;
		s += text(lx, cy - 10, title, { size: titleSize, weight: 500, fill: T.txt });
		s += text(lx, cy + 10, sub, { size: 13, fill: T.muted });
		return s;
	}

	/** inline 20px icon + title on one row, sub indented beneath it. */
	function colCard(o) {
		const { x, y, w, h, border, ico, icoColor, title, sub } = o;
		const cy = y + h / 2;
		let s = rr(x, y, w, h, 10, { fill: T.node, stroke: border, sw: 1 });
		s += icon(ico, x + 26, cy - 10, 20, icoColor);
		s += text(x + 46, cy - 10, title, { size: 16, weight: 500, fill: T.txt });
		s += text(x + 46, cy + 10, sub, { size: 13, fill: T.muted });
		return s;
	}

	/** Mono pill used for ports and Kafka topic names. */
	function monoChip(x, cy, h, label, o = {}) {
		const { size = 12, dashed = false, fill = T.chip, ink = T.txt, pad = 12, r = 4 } = o;
		const w = mw(label, size) + pad * 2;
		let s = rr(x, cy - h / 2, w, h, r, {
			fill: dashed ? 'none' : fill,
			stroke: T.chipBd,
			sw: 1,
			dash: dashed ? '4 3' : undefined,
		});
		s += text(x + w / 2, cy, label, { size, mono: true, fill: ink, anchor: 'middle' });
		return { s, w };
	}

	/** Uppercase container label that straddles a dashed border (bg knockout). */
	function groupLabel(x, topY, label) {
		const w = label.length * 11 * 0.55 + 1.1 * label.length + 16;
		return (
			rr(x - 8, topY - 1, w, 15, 0, { fill: T.bg }) +
			text(x, topY + 6.5, label.toUpperCase(), { size: 11, weight: 500, fill: T.muted, ls: 1.1 })
		);
	}

	/**
	 * Swatch + label row, centred on the canvas — identical in every component.
	 * An item is `[color, label]` for the default colour chip, or
	 * `[color, label, 'dash' | 'cross']` for the dashed-line and ✕ keys the
	 * validation and topic components use.
	 */
	function legend(W, cy, items) {
		const lead = (kind) => (kind === 'dash' ? 34 : kind === 'cross' ? 23 : 18);
		const total = items.reduce((a, [, l, k]) => a + lead(k) + sw(l, 13), 0) + (items.length - 1) * 24;
		let lx = (W - total) / 2;
		let s = '';
		for (const [c, label, kind] of items) {
			if (kind === 'dash') {
				s += `<path d="M${lx},${cy} H${lx + 26}" fill="none" ${strokeAttr(c, 1.8)} stroke-dasharray="6 5"/>`;
			} else if (kind === 'cross') {
				s += cross(lx + 7.5, cy, 12, c);
			} else {
				s += rr(lx, cy - 5, 10, 10, 2, { fill: c });
			}
			s += text(lx + lead(kind), cy, label, { size: 13, fill: T.muted });
			lx += lead(kind) + sw(label, 13) + 24;
		}
		return s;
	}

	/** The ✕ that marks a step which did not happen. */
	function cross(cx, cy, size, color) {
		const k = size / 2;
		return (
			`<path d="M${cx - k},${cy - k} L${cx + k},${cy + k}M${cx + k},${cy - k} L${cx - k},${cy + k}"` +
			` fill="none" ${strokeAttr(color, 2)} stroke-linecap="round"/>`
		);
	}

	/**
	 * Edge annotation with a background knockout, the SVG equivalent of the
	 * designs' `<span style="padding:0 6px; background:var(--bg)">` — it hides the
	 * dot grid (and any line it crosses) behind the text.
	 */
	function chipLabel(cx, cy, label, o = {}) {
		const { size = 12.5, fill = T.muted, weight = 400, padX = 6 } = o;
		const w = sw(label, size) + padX * 2;
		const h = size * 1.35;
		return (
			rr(cx - w / 2, cy - h / 2, w, h, 0, { fill: T.bg }) +
			text(cx, cy, label, { size, weight, fill, anchor: 'middle' })
		);
	}

	/** Greedy word wrap against the estimated advance width. */
	function wrap(str, size, maxW) {
		const words = String(str).split(/\s+/);
		const lines = [];
		let line = '';
		for (const word of words) {
			const next = line ? `${line} ${word}` : word;
			if (line && sw(next, size) > maxW) {
				lines.push(line);
				line = word;
			} else {
				line = next;
			}
		}
		if (line) lines.push(line);
		return lines;
	}

	/** Dotted background + collected arrowheads, wrapped around the drawn parts. */
	function frame(W, H, parts) {
		let defs = '';
		for (const [id, hex] of markers) {
			defs += `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${hex}"/></marker>`;
		}
		const [dotHex, dotOp] = col(T.dot);
		defs += `<pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="1" fill="${dotHex}" fill-opacity="${dotOp}"/></pattern>`;

		const bg =
			`<rect x="0" y="0" width="${W}" height="${H}" rx="12" ${fillAttr(T.bg)}/>` +
			`<rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="url(#dots)"/>`;

		return (
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">` +
			`<defs>${defs}</defs>${bg}${parts.join('\n')}</svg>\n`
		);
	}

	return {
		T,
		text,
		rr,
		icon,
		tile,
		marker,
		arrow,
		rowCard,
		colCard,
		monoChip,
		groupLabel,
		legend,
		cross,
		chipLabel,
		wrap,
		frame,
	};
}
