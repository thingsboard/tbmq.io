/**
 * HERO — top-level TBMQ architecture map.
 *
 * Rendered from the approved design component
 * ("ASCII blueprints to Thingsboard diagrams / 01 TBMQ architecture"). The
 * palette and the drawing primitives it needs live in ./dc-kit.mjs, shared with
 * the other `.dc` ports; that token set is intentionally different from
 * `kit.mjs` THEMES, so nothing here can affect the toolkit diagrams.
 *
 * Geometry mirrors the design 1:1 (1320 × 990 canvas, same absolute positions),
 * with two deliberate deviations:
 *   - brand logos (Kafka, Redis) become stroked line-icons (see dc-kit header);
 *   - the "Broker core" interior is nudged 13px down so its padding reads even
 *     (the CSS original left 26px of unused space at the bottom).
 *
 * All text stays real `<text>` so the source remains diffable and greppable.
 * Regenerate with `pnpm diagrams:arch`.
 */

import { DC, makeDcKit, mw, sw } from './dc-kit.mjs';

export function heroDc(kit) {
	const T = DC[kit?.T?.name === 'dark' ? 'dark' : 'light'];
	const W = 1320;
	const H = 990;
	const P = [];
	const { text, rr, icon, tile, arrow, rowCard, colCard, monoChip, groupLabel, legend, frame } = makeDcKit(T);

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
	P.push(
		legend(W, 908, [
			[T.violet, 'MQTT clients'],
			[T.blue, 'Broker process'],
			[T.teal, 'Kafka & integrations'],
			[T.slateLine, 'Storage & management'],
		])
	);
	P.push(
		text(
			660,
			948,
			'One TBMQ node and the services around it: where a message enters, where it is made durable, and where it leaves.',
			{ size: 14, fill: T.faint, anchor: 'middle' }
		)
	);

	return frame(W, H, P);
}
