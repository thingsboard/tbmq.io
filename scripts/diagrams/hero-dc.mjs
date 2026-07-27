/**
 * HERO — top-level TBMQ architecture map.
 *
 * Rendered from the approved design component
 * ("ASCII blueprints to Thingsboard diagrams / 01 TBMQ architecture"), which
 * carries its OWN light/dark token set — violet = MQTT clients, blue = broker
 * process, teal = Kafka & integrations, slate = storage & management. That
 * palette is intentionally different from `kit.mjs` THEMES, so this module is
 * self-contained: nothing here can affect the other diagrams on the page.
 *
 * Geometry mirrors the design 1:1 (1320 × 990 canvas, same absolute positions),
 * with two deliberate deviations, both noted inline:
 *   - brand logos (Kafka, Redis) become stroked line-icons, because a committed
 *     SVG may not reference a CDN;
 *   - the "Broker core" interior is nudged 13px down so its padding reads even
 *     (the CSS original left 26px of unused space at the bottom).
 *
 * All text stays real `<text>` so the source remains diffable and greppable.
 * Regenerate with `pnpm diagrams:arch`.
 */

const FONT = "Roboto, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

/** Design-component tokens, verbatim from the approved component. */
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
		chip: 'rgba(255,255,255,0.05)',
		chipBd: 'rgba(255,255,255,0.12)',
		dash: 'rgba(139,92,246,0.38)',
		dashBlue: 'rgba(59,110,246,0.45)',
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
		chip: '#f5f6fa',
		chipBd: '#e2e5ec',
		dash: 'rgba(124,58,237,0.35)',
		dashBlue: 'rgba(47,79,224,0.35)',
		dashSlate: 'rgba(0,0,0,0.18)',
	},
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * `rgba(r,g,b,a)` → `['#rrggbb', a]`, everything else → `[color, 1]`.
 * Presentation attributes take a hex + a separate `*-opacity`, which every
 * renderer honours (rgba() in an attribute is SVG2-only).
 */
function col(c) {
	const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(c);
	if (!m) return [c, 1];
	const hex = '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
	return [hex, m[4] == null ? 1 : Number(m[4])];
}

const fillAttr = (c) => {
	if (!c || c === 'none') return 'fill="none"';
	const [hex, a] = col(c);
	return `fill="${hex}"` + (a < 1 ? ` fill-opacity="${a}"` : '');
};
const strokeAttr = (c, w = 1) => {
	if (!c || c === 'none') return 'stroke="none"';
	const [hex, a] = col(c);
	return `stroke="${hex}" stroke-width="${w}"` + (a < 1 ? ` stroke-opacity="${a}"` : '');
};

// Advance-width estimates (Roboto ≈ 0.52em mixed case, Roboto Mono = 0.60em).
const sw = (s, size) => s.length * size * 0.52;
const mw = (s, size) => s.length * size * 0.6;

export function heroDc(kit) {
	const T = DC[kit?.T?.name === 'dark' ? 'dark' : 'light'];
	const W = 1320;
	const H = 990;
	const P = [];
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
		const paths = {
			chip: `<rect x="6" y="6" width="12" height="12" rx="2.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 6V3.5M15 6V3.5M9 20.5V18M15 20.5V18M6 9H3.5M6 15H3.5M20.5 9H18M20.5 15H18"/>`,
			apps: `<rect x="3.5" y="5" width="17" height="4.5" rx="1.5"/><rect x="3.5" y="14.5" width="17" height="4.5" rx="1.5"/><circle cx="7" cy="7.25" r="0.9" fill="currentColor" stroke="none"/><circle cx="7" cy="16.75" r="0.9" fill="currentColor" stroke="none"/>`,
			lan: `<rect x="9" y="2.5" width="6" height="6" rx="1.3"/><rect x="2.5" y="15.5" width="6" height="6" rx="1.3"/><rect x="9" y="15.5" width="6" height="6" rx="1.3"/><rect x="15.5" y="15.5" width="6" height="6" rx="1.3"/><path d="M12 8.5v3.5M5.5 15.5V12h13v3.5M12 12v3.5"/>`,
			hub: `<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="3.6" r="1.7"/><circle cx="12" cy="20.4" r="1.7"/><circle cx="3.6" cy="12" r="1.7"/><circle cx="20.4" cy="12" r="1.7"/><path d="M12 5.3v3.5M12 15.2v3.5M5.3 12h3.5M15.2 12h3.5"/>`,
			split: `<circle cx="5" cy="12" r="2.2"/><circle cx="19" cy="5.5" r="2.2"/><circle cx="19" cy="12" r="2.2"/><circle cx="19" cy="18.5" r="2.2"/><path d="M7.1 11.1 16.9 6.2M7.2 12H16.8M7.1 12.9 16.9 17.8"/>`,
			tree: `<circle cx="12" cy="4.5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="19.5" r="2"/><circle cx="18" cy="19.5" r="2"/><path d="M10.7 6.1 7.1 10.4M13.3 6.1l3.6 4.3M6 14v3.5M18 14v3.5"/>`,
			dashboard: `<rect x="3.5" y="3.5" width="7" height="9" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5.5" rx="1.5"/><rect x="13.5" y="12" width="7" height="8.5" rx="1.5"/><rect x="3.5" y="15" width="7" height="5.5" rx="1.5"/>`,
			db: `<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>`,
			// stand-ins for the design's CDN brand logos (see module header)
			kafka: `<circle cx="6" cy="12" r="2.3"/><circle cx="17.5" cy="6" r="2.3"/><circle cx="17.5" cy="18" r="2.3"/><path d="M8 10.9 15.6 6.9M8 13.1l7.6 4"/>`,
			redis: `<ellipse cx="12" cy="6" rx="7.5" ry="2.6"/><path d="M4.5 6v5c0 1.4 3.4 2.6 7.5 2.6s7.5-1.2 7.5-2.6V6M4.5 11v5c0 1.4 3.4 2.6 7.5 2.6s7.5-1.2 7.5-2.6v-5"/>`,
			plug: `<path d="M4 12h6M14 12h6"/><rect x="9.5" y="7.5" width="5" height="9" rx="1.6"/><path d="M4 9.5v5M20 9.5v5"/>`,
			globe: `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17M5 6.5c4 2.5 10 2.5 14 0M5 17.5c4-2.5 10-2.5 14 0"/>`,
			chevron: `<path d="M9.5 5.5 16 12l-6.5 6.5"/>`,
		}[name];
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

	const arrow = (d, color, o = {}) =>
		`<path d="${d}" fill="none" ${strokeAttr(color, 1.8)} stroke-linecap="round" stroke-linejoin="round"` +
		`${o.bidir ? ` marker-start="url(#${marker(color)})"` : ''} marker-end="url(#${marker(color)})"/>`;

	// ---------------------------------------------------------------- cards ---
	/** tile + title/sub stacked to its right. */
	function rowCard(o) {
		const { x, y, w, h, border, tileBg, tileIco, ico, title, sub, titleSize = 18, gap = 14 } = o;
		const cy = y + h / 2;
		const tx = x + 18;
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

	// ================================================================ layout ==
	// --- dashed containers ---
	P.push(rr(126, 14, 908, 126, 14, { stroke: T.dash, sw: 1, dash: '5 5' }));
	P.push(rr(126, 196, 908, 356, 14, { stroke: T.dashBlue, sw: 1, dash: '5 5' }));
	P.push(rr(1044, 366, 242, 266, 14, { stroke: T.dashSlate, sw: 1, dash: '5 5' }));

	// --- connectors -----------------------------------------------------------
	// Every endpoint is inset a uniform 10px from the card edge or dashed section
	// border it points at, so no arrow ever lands ON another element's outline.
	P.push(arrow('M360,150 V200', T.violetLine)); // clients → listeners
	P.push(arrow('M360,312 V354', T.violetLine)); // listeners → broker core
	P.push(arrow('M800,354 V312', T.blueLine)); // core → listeners
	P.push(arrow('M800,200 V150', T.blueLine)); // listeners → subscribers
	P.push(arrow('M360,544 V586', T.tealLine)); // core → Kafka
	P.push(arrow('M800,586 V544', T.tealLine)); // Kafka → core
	P.push(arrow('M350,718 V758', T.tealLine)); // Kafka → Redis
	P.push(arrow('M810,718 V758', T.tealLine)); // Kafka → Integration Executor
	P.push(arrow('M1020,814 H1050', T.slateLine)); // IE → external systems
	P.push(arrow('M1050,432 H1020', T.slateLine, { bidir: true })); // Web UI ↔ core
	P.push(arrow('M1020,500 H1030 Q1036,500 1036,506 V560 Q1036,566 1042,566 H1050', T.slateLine, { bidir: true }));

	// --- container labels (drawn after the borders they knock out) ---
	P.push(groupLabel(146, 4, 'MQTT clients'));
	P.push(groupLabel(146, 186, 'TBMQ node'));
	P.push(groupLabel(1064, 356, 'Management'));

	// --- MQTT clients row ---
	P.push(
		rowCard({
			x: 150,
			y: 34,
			w: 410,
			h: 88,
			border: T.violet,
			tileBg: T.violetTile,
			tileIco: T.violetIco,
			ico: 'chip',
			title: 'Devices',
			sub: 'MQTT publishers',
		})
	);
	P.push(
		rowCard({
			x: 600,
			y: 34,
			w: 410,
			h: 88,
			border: T.violet,
			tileBg: T.violetTile,
			tileIco: T.violetIco,
			ico: 'apps',
			title: 'Applications',
			sub: 'MQTT subscribers',
		})
	);

	// --- Netty listeners (ports on the right; dashed = disabled by default) ---
	{
		const x = 150,
			y = 210,
			w = 860,
			h = 92;
		const cy = y + h / 2;
		P.push(rr(x, y, w, h, 10, { fill: T.node, stroke: T.blue, sw: 1 }));
		P.push(tile(x + 18, cy - 20, 40, 8, T.blueTile, 'lan', T.blueIco, 22));
		P.push(text(x + 76, cy - 10, 'Netty listeners', { size: 18, weight: 500, fill: T.txt }));
		P.push(text(x + 76, cy + 10, 'TCP & WebSocket endpoints', { size: 13, fill: T.muted }));

		const ports = [
			['TCP 1883', false],
			['WS 8084', false],
			['SSL 8883', true],
			['WSS 8085', true],
		];
		const noteW = 56;
		const total = ports.reduce((a, [l]) => a + mw(l, 12) + 24 + 10, 0) + noteW;
		let px = x + w - 18 - total;
		for (const [label, dashed] of ports) {
			const c = monoChip(px, cy, 30, label, { dashed, ink: dashed ? T.faint : T.txt });
			P.push(c.s);
			px += c.w + 10;
		}
		for (const [i, line] of ['dashed =', 'off by', 'default'].entries()) {
			P.push(text(px, cy - 15 + i * 15, line, { size: 12, fill: T.faint }));
		}
	}

	// --- Broker core (interior shifted 13px down vs. the CSS original) ---
	{
		const x = 150,
			y = 364,
			w = 860,
			h = 170;
		P.push(rr(x, y, w, h, 10, { fill: T.blueFill, stroke: T.blue, sw: 1 }));
		P.push(tile(x + 18, y + 29, 40, 8, T.blueTile, 'hub', T.blueIco, 22));
		P.push(text(x + 72, y + 49, 'Broker core', { size: 18, weight: 500, fill: T.txt }));

		const parts = [
			['chip', 'Actor system', 'session state'],
			['split', 'Message dispatcher', 'persist / route'],
			['tree', 'Subscription trie', 'topic matching'],
		];
		const inner = x + 18;
		const cardW = (w - 36 - 2 * 20 - 4 * 10) / 3; // 2 chevrons + 4 gaps
		const rowY = y + 85;
		const rowH = 56;
		const rcy = rowY + rowH / 2;
		parts.forEach(([ico, title, sub], i) => {
			const cx = inner + i * (cardW + 40);
			P.push(rr(cx, rowY, cardW, rowH, 8, { fill: T.node, stroke: T.chipBd, sw: 1 }));
			P.push(icon(ico, cx + 24, rcy, 20, T.blueIco));
			P.push(text(cx + 44, rcy - 8, title, { size: 15, fill: T.txt }));
			P.push(text(cx + 44, rcy + 9, sub, { size: 12, fill: T.muted }));
			if (i < 2) P.push(icon('chevron', cx + cardW + 20, rcy, 20, T.faint));
		});
	}

	// --- management column ---
	P.push(
		colCard({
			x: 1060,
			y: 386,
			w: 210,
			h: 92,
			border: T.slate,
			ico: 'dashboard',
			icoColor: T.slateIco,
			title: 'Web UI / REST',
			sub: 'manage & monitor',
		})
	);
	P.push(
		colCard({
			x: 1060,
			y: 520,
			w: 210,
			h: 92,
			border: T.slate,
			ico: 'db',
			icoColor: T.slateIco,
			title: 'PostgreSQL',
			sub: 'metadata · statistics',
		})
	);

	// --- Kafka (durability backbone) + the topics it carries ---
	{
		const x = 150,
			y = 596,
			w = 860,
			h = 112;
		P.push(rr(x, y, w, h, 10, { fill: T.node, stroke: T.teal, sw: 1 }));
		P.push(tile(x + 18, y + 16, 32, 6, T.tealTile, 'kafka', T.tealIco, 20));
		const hcy = y + 32;
		P.push(text(x + 62, hcy, 'Apache Kafka', { size: 16, weight: 500, fill: T.txt }));
		P.push(
			text(
				x + 62 + sw('Apache Kafka', 16) + 12,
				hcy,
				'durability backbone — every message is appended before it is acknowledged',
				{
					size: 13,
					fill: T.muted,
				}
			)
		);
		// `$CLIENT_ID` (not `<clientId>`) to match how every other diagram and the
		// page prose spell the per-application topic.
		const topics = ['tbmq.msg.all', 'tbmq.msg.persisted', 'tbmq.msg.app.$CLIENT_ID', 'tbmq.msg.ie.$INTEGRATION_ID'];
		let tx = x + 18;
		for (const name of topics) {
			const c = monoChip(tx, y + 79, 34, name, { size: 13, fill: T.tealTile, ink: T.txt });
			P.push(c.s);
			tx += c.w + 12;
		}
	}

	// --- persistence + integration row ---
	P.push(
		rowCard({
			x: 150,
			y: 768,
			w: 400,
			h: 96,
			border: T.slate,
			tileBg: T.slateTile,
			tileIco: T.slateIco,
			ico: 'redis',
			title: 'Redis / Valkey',
			sub: 'persistent DEVICE messages',
			titleSize: 16,
		})
	);
	P.push(
		rowCard({
			x: 610,
			y: 768,
			w: 400,
			h: 96,
			border: T.teal,
			tileBg: T.tealTile,
			tileIco: T.tealIco,
			ico: 'plug',
			title: 'Integration Executor',
			sub: 'separate JVM · port 8082',
			titleSize: 16,
		})
	);
	P.push(
		colCard({
			x: 1060,
			y: 768,
			w: 210,
			h: 96,
			border: T.slate,
			ico: 'globe',
			icoColor: T.slateIco,
			title: 'External systems',
			sub: 'HTTP · MQTT · Kafka',
		})
	);

	// --- edge labels (on top of the cards, as in the design) ---
	const lbl = (x, cy, str, o = {}) => text(x, cy, str, { size: o.size ?? 14, fill: T.muted, anchor: o.anchor });
	P.push(lbl(376, 170, 'publish'));
	P.push(lbl(784, 170, 'deliver', { anchor: 'end' }));
	P.push(lbl(376, 326, 'decode → client actor'));
	P.push(lbl(816, 330, 'encode → write'));
	// 566, not the design's 556: clears the dashed "TBMQ node" border at y=552.
	P.push(lbl(376, 566, 'produce'));
	P.push(lbl(784, 566, 'consume', { anchor: 'end' }));
	P.push(lbl(1010, 566, 'query / response', { anchor: 'end' }));
	P.push(lbl(366, 730, 'persist DEVICE msgs'));
	P.push(lbl(826, 730, 'consume'));
	P.push(lbl(1032, 793, 'push', { size: 12, anchor: 'middle' }));
	// 1030, not 1036: keeps the chip clear of the "Management" border at x=1044.
	P.push(lbl(1030, 411, 'REST', { size: 12, anchor: 'middle' }));

	// --- legend + caption ---
	{
		const items = [
			[T.violet, 'MQTT clients'],
			[T.blue, 'Broker process'],
			[T.teal, 'Kafka & integrations'],
			[T.slateLine, 'Storage & management'],
		];
		const total = items.reduce((a, [, l]) => a + 18 + sw(l, 13), 0) + (items.length - 1) * 24;
		let lx = (W - total) / 2;
		const cy = 908;
		for (const [c, label] of items) {
			P.push(rr(lx, cy - 5, 10, 10, 2, { fill: c }));
			P.push(text(lx + 18, cy, label, { size: 13, fill: T.muted }));
			lx += 18 + sw(label, 13) + 24;
		}
		P.push(
			text(
				660,
				948,
				'One TBMQ node and the services around it: where a message enters, where it is made durable, and where it leaves.',
				{
					size: 14,
					fill: T.faint,
					anchor: 'middle',
				}
			)
		);
	}

	// ================================================================= frame ==
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
		`<defs>${defs}</defs>${bg}${P.join('\n')}</svg>\n`
	);
}
