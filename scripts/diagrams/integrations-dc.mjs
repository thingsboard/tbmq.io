/**
 * INTEGRATIONS — the ten diagrams of the integrations guides.
 *
 * Ported from the approved design components:
 *   20 Integration Executor topics      → broker ↔ executor control plane
 *   21 Integration fan-out              → one publish → per-integration topics
 *   22 Integration validation success   ┐
 *   23 Integration validation failure   ├ one layout, three outcomes
 *   24 Integration validation timeout   ┘
 *   25 HTTP integration                 ┐
 *   26 MQTT integration                 ├ one layout, three targets
 *   27 Kafka integration                ┘
 *   28 Integration payload encoding     → how the outgoing HTTP body is built
 *   29 MQTT topic QoS retain            → how topic/QoS/retain are resolved
 *
 * Geometry mirrors the components 1:1 — the canvas sizes, the `left`/`top` of
 * every box and the `d` of every connector are the designs' own numbers. Two
 * families collapse into a builder + specs (validation, integration type),
 * because their members differ only in labels, colours and which steps are
 * crossed out. Palette and primitives come from ./dc-kit.mjs.
 *
 * Regenerate with `pnpm diagrams:arch`.
 */

import { DC, makeDcKit, mw, sw } from './dc-kit.mjs';

/** Line-box centre for CSS `top` + `font-size` + `line-height` factor. */
const cyOf = (top, size, lh = 1.2) => top + (size * lh) / 2;

const themeOf = (kit) => DC[kit?.T?.name === 'dark' ? 'dark' : 'light'];

/** A CSS `1px dashed` border, as an SVG dash pattern. */
const BORDER_DASH = '4 3';

/**
 * Horizontal card — icon tile on the left, a single vertically centred label to
 * its right. The designs build these with `display:flex; align-items:center`, so
 * both tile and label sit on the card's centre line.
 */
function iconRow(k, o) {
	const {
		x,
		y,
		w,
		h,
		border,
		dashed,
		tileBg,
		ico,
		icoColor,
		icoSize,
		label,
		size,
		mono = false,
		tileSize = 34,
		tileR = 8,
		gap = 13,
		pad = 16,
	} = o;
	const cy = y + h / 2;
	const tx = x + pad;
	return (
		k.rr(x, y, w, h, 10, { fill: k.T.node, stroke: border, sw: 1, dash: dashed ? BORDER_DASH : undefined }) +
		k.tile(tx, cy - tileSize / 2, tileSize, tileR, tileBg, ico, icoColor, icoSize) +
		k.text(tx + tileSize + gap, cy, label, { size, weight: mono ? 400 : 500, fill: k.T.txt, mono })
	);
}

/**
 * Vertical card — icon tile, title, optional sub, centred as a flex column.
 * `title` and `sub` are arrays of lines: the designs break these by hand with
 * `<br>` or let a narrow card wrap them, and an explicit list keeps the port
 * from depending on an estimated wrap.
 */
function iconStack(k, o) {
	const {
		x,
		y,
		w,
		h,
		border,
		dashed,
		tileSize,
		tileR,
		tileBg,
		ico,
		icoColor,
		icoSize,
		title,
		titleSize,
		titleLh = 1.2,
		titleFill,
		sub = [],
		subSize = 12.5,
		gap,
	} = o;
	const titleH = title.length * titleSize * titleLh;
	const subH = sub.length * subSize * 1.2;
	const blocks = sub.length ? [tileSize, titleH, subH] : [tileSize, titleH];
	const total = blocks.reduce((a, b) => a + b, 0) + (blocks.length - 1) * gap;
	const cx = x + w / 2;
	let cursor = y + (h - total) / 2;

	let s = k.rr(x, y, w, h, 10, { fill: k.T.node, stroke: border, sw: 1, dash: dashed ? BORDER_DASH : undefined });
	s += k.tile(cx - tileSize / 2, cursor, tileSize, tileR, tileBg, ico, icoColor, icoSize);
	cursor += tileSize + gap;
	title.forEach((line, i) => {
		s += k.text(cx, cursor + titleSize * titleLh * (i + 0.5), line, {
			size: titleSize,
			weight: 500,
			fill: titleFill ?? k.T.txt,
			anchor: 'middle',
		});
	});
	cursor += titleH + gap;
	sub.forEach((line, i) => {
		s += k.text(cx, cursor + subSize * 1.2 * (i + 0.5), line, { size: subSize, fill: k.T.muted, anchor: 'middle' });
	});
	return s;
}

/**
 * Horizontal card — icon tile on the left, a stack of lines to its right, the
 * group centred as the designs' `flex; align-items:center` around an inner
 * `flex-direction:column; gap:N`. Each line carries its own size and ink.
 */
function iconRowStack(k, o) {
	const {
		x,
		y,
		w,
		h,
		border,
		tileBg,
		ico,
		icoColor,
		icoSize,
		tileSize = 34,
		tileR = 8,
		gap = 13,
		pad = 16,
		lines,
		lineGap = 4,
	} = o;
	const cy = y + h / 2;
	const lineH = (l) => l.size * 1.2;
	const total = lines.reduce((a, l) => a + lineH(l), 0) + (lines.length - 1) * lineGap;
	let cursor = cy - total / 2;

	let s = k.rr(x, y, w, h, 10, { fill: k.T.node, stroke: border, sw: 1 });
	s += k.tile(x + pad, cy - tileSize / 2, tileSize, tileR, tileBg, ico, icoColor, icoSize);
	const lx = x + pad + tileSize + gap;
	for (const l of lines) {
		s += k.text(lx, cursor + lineH(l) / 2, l.text, {
			size: l.size,
			weight: l.weight ?? 400,
			fill: l.fill ?? k.T.txt,
			mono: l.mono ?? false,
		});
		cursor += lineH(l) + lineGap;
	}
	return s;
}

/**
 * `ON` / `OFF` state pill — the designs' 22px `inline-flex` mono chip. Filled
 * (a colour tint, no border) marks the branch that is taken, outlined (a
 * hairline with muted ink) the one that is not. Returns its width so the label
 * after it can be placed.
 */
function pill(k, x, cy, label, o = {}) {
	const { bg, ink = k.T.txt, border, size = 11.5, h = 22, padX = 8, r = 3, ls = 0 } = o;
	const w = mw(label, size) + ls * label.length + padX * 2;
	return {
		s:
			k.rr(x, cy - h / 2, w, h, r, { fill: bg ?? 'none', stroke: border, sw: 1 }) +
			k.text(x + w / 2, cy, label, { size, mono: true, fill: ink, anchor: 'middle', ls }),
		w,
	};
}

/** A state pill followed by its explanation — `flex; align-items:center; gap:N`. */
function pillRow(k, x, cy, chip, label, o = {}) {
	const { gap = 10, size = 13.5, fill = k.T.txt } = o;
	const p = pill(k, x, cy, chip, o.pill);
	return p.s + k.text(x + p.w + gap, cy, label, { size, fill });
}

/**
 * Uppercase band label centred on the canvas, with a background knockout — the
 * designs' full-width `text-align:center` row whose inner span paints
 * `var(--bg)` so the dot grid and the bus line behind it are cut away.
 */
function bandLabel(k, cx, top, label, o = {}) {
	const { size = 11, padX = 10, ls = 1.1, fill = k.T.muted } = o;
	const upper = label.toUpperCase();
	// 0.62em, not `sw()`'s mixed-case 0.52em: all-caps advances are wider, and a
	// knockout narrower than its own glyphs leaves the bus line touching them.
	const w = upper.length * size * 0.62 + ls * upper.length + padX * 2;
	const cy = cyOf(top, size, 1.3);
	return (
		k.rr(cx - w / 2, cy - 7.5, w, 15, 0, { fill: k.T.bg }) +
		k.text(cx, cy, upper, { size, weight: 500, fill, anchor: 'middle', ls })
	);
}

/** Several labels laid out in a centred row, the designs' `flex; gap:N`. */
function centeredRow(k, cx, cy, items, o) {
	const { gap, size, fill } = o;
	const widths = items.map((s) => sw(s, size));
	const total = widths.reduce((a, b) => a + b, 0) + (items.length - 1) * gap;
	let x = cx - total / 2;
	let s = '';
	items.forEach((item, i) => {
		s += k.text(x + widths[i] / 2, cy, item, { size, fill, anchor: 'middle' });
		x += widths[i] + gap;
	});
	return s;
}

/**
 * The designs' `•••` continuation marker. Drawn as circles rather than text: the
 * glyph is decorative, and three circles place identically in every renderer
 * while a letter-spaced `<text>` does not.
 */
const ellipsis = (T, cx, cy) =>
	[-10, 0, 10]
		.map(
			(dx) => `<rect x="${cx + dx - 2.1}" y="${cy - 2.1}" width="4.2" height="4.2" rx="2.1"` + ` fill="${T.faint}"/>`
		)
		.join('');

// =============================================================================
// 20 — Broker ↔ Integration Executor over Kafka (the control plane)
// =============================================================================
export function ieTopics(kit) {
	const T = themeOf(kit);
	const k = makeDcKit(T);
	const { text, rr, arrow, groupLabel, legend, wrap, frame } = k;
	const W = 1320;
	const H = 720;
	const P = [];

	P.push(rr(430, 130, 460, 360, 14, { stroke: T.dashTeal, sw: 1, dash: '5 5' }));

	// Broker → Kafka (blue, left) and Kafka → executor (teal, right). Dashed
	// connectors are the halves of a request/response pair.
	P.push(arrow('M194,204 H428', T.blueLine));
	P.push(arrow('M194,240 H428', T.blueLine, { dash: '6 5' }));
	P.push(arrow('M892,204 H1138', T.tealLine));
	P.push(arrow('M892,240 H1138', T.tealLine, { dash: '6 5' }));
	P.push(arrow('M1138,326 H892', T.tealLine));
	P.push(arrow('M428,326 H194', T.blueLine));
	P.push(arrow('M1138,436 H892', T.tealLine, { dash: '6 5' }));
	P.push(arrow('M428,436 H194', T.blueLine, { dash: '6 5' }));

	P.push(
		text(W / 2, cyOf(52, 22, 1.35), 'Broker ↔ Integration Executor over Kafka', {
			size: 22,
			weight: 500,
			fill: T.txt,
			anchor: 'middle',
		})
	);
	P.push(groupLabel(450, 142, 'Kafka cluster'));

	P.push(
		iconStack(k, {
			x: 36,
			y: 206,
			w: 150,
			h: 240,
			border: T.blue,
			tileSize: 52,
			tileR: 10,
			tileBg: T.blueTile,
			ico: 'hub',
			icoColor: T.blueIco,
			icoSize: 28,
			title: ['TBMQ'],
			titleSize: 18,
			titleLh: 1.15,
			sub: ['broker nodes'],
			gap: 14,
		})
	);
	P.push(
		iconStack(k, {
			x: 1146,
			y: 206,
			w: 150,
			h: 240,
			border: T.teal,
			tileSize: 52,
			tileR: 10,
			tileBg: T.tealTile,
			ico: 'gear',
			icoColor: T.tealIco,
			icoSize: 28,
			title: ['Integration', 'Executor'],
			titleSize: 18,
			titleLh: 1.15,
			// The design's single line "separate JVM · port 8082" is too wide for a
			// 150px card; broken here rather than left to an estimated wrap.
			sub: ['separate JVM', 'port 8082'],
			gap: 14,
		})
	);

	const topicRow = (y, topic) =>
		iconRow(k, {
			x: 450,
			y,
			w: 420,
			h: 66,
			border: T.teal,
			tileBg: T.tealTile,
			ico: 'kafka',
			icoColor: T.tealIco,
			icoSize: 17,
			tileSize: 30,
			tileR: 6,
			label: topic,
			size: 13.5,
			mono: true,
		});
	P.push(topicRow(190, 'tbmq.ie.downlink.$integrationType'));
	P.push(topicRow(300, 'tbmq.ie.uplink'));
	P.push(topicRow(410, 'tbmq.ie.uplink.notifications.$serviceId'));

	// Edge labels, one pair per topic row — plain text, as the design has no
	// background knockout on these.
	const edge = (cx, top, label) => text(cx, cyOf(top, 12.5), label, { size: 12.5, fill: T.muted, anchor: 'middle' });
	for (const [cx, xs] of [
		[311, ['Configurations', 'Validation requests', 'Events', 'Validation responses']],
		[1015, ['Configurations', 'Validation requests', 'Events', 'Validation responses']],
	]) {
		P.push(edge(cx, 182, xs[0]));
		P.push(edge(cx, 218, xs[1]));
		P.push(edge(cx, 304, xs[2]));
		P.push(edge(cx, 414, xs[3]));
	}

	P.push(
		centeredRow(
			k,
			W / 2,
			cyOf(530, 12.5),
			['Row 1 — broker writes, executor reads', 'Rows 2 and 3 — executor writes, broker reads'],
			{ gap: 32, size: 12.5, fill: T.faint }
		)
	);

	P.push(
		legend(W, 636, [
			[T.blue, 'Broker side'],
			[T.teal, 'Executor side & Kafka'],
			[T.slateLine, 'request / response pair', 'dash'],
		])
	);
	wrap(
		'Every exchange between the broker and the Integration Executor is a Kafka topic — configuration and ' +
			'validation go out on the downlink, events and validation responses come back on the uplink.',
		14,
		1020
	).forEach((line, i) => {
		P.push(text(W / 2, cyOf(672, 14, 1.35) + i * 19, line, { size: 14, fill: T.faint, anchor: 'middle' }));
	});

	return frame(W, H, P);
}

// =============================================================================
// 21 — One publish fans out to the matched integrations' own Kafka topics
// =============================================================================
export function integrationFanOut(kit) {
	const T = themeOf(kit);
	const k = makeDcKit(T);
	const { text, rr, arrow, groupLabel, chipLabel, legend, wrap, frame } = k;
	const W = 1320;
	const H = 620;
	const P = [];

	P.push(rr(260, 150, 250, 310, 14, { stroke: T.dashBlue, sw: 1, dash: '5 5' }));
	P.push(rr(570, 150, 300, 310, 14, { stroke: T.dashTeal, sw: 1, dash: '5 5' }));
	P.push(rr(910, 150, 200, 310, 14, { stroke: T.dashTeal, sw: 1, dash: '5 5' }));

	P.push(arrow('M206,266 H276', T.violetLine));
	P.push(arrow('M385,300 V372', T.slateLine, { bidir: true }));
	// The fork: one stub out of the dispatcher, then a head into each topic.
	P.push(arrow('M494,266 H528', T.blueLine, { plain: true }));
	P.push(arrow('M528,266 H586', T.blueLine));
	P.push(arrow('M528,266 V406 H586', T.blueLine));
	P.push(arrow('M854,266 H922', T.tealLine));
	P.push(arrow('M854,406 H922', T.tealLine));
	P.push(arrow('M1098,266 H1136', T.tealLine));
	P.push(arrow('M1098,406 H1136', T.tealLine));

	P.push(
		text(W / 2, cyOf(58, 22, 1.35), 'Integrations — from a device publish to an external system', {
			size: 22,
			weight: 500,
			fill: T.txt,
			anchor: 'middle',
		})
	);
	P.push(groupLabel(276, 162, 'TBMQ'));
	P.push(groupLabel(586, 162, 'Kafka cluster'));
	P.push(groupLabel(922, 162, 'Integration Executor'));

	/** Every card on this canvas is 60px tall with a 28px tile. */
	const card = (o) => iconRow(k, { h: 60, tileSize: 28, tileR: 6, icoSize: 17, gap: 11, pad: 14, size: 14.5, ...o });

	P.push(
		card({
			x: 40,
			y: 236,
			w: 166,
			border: T.violet,
			tileBg: T.violetTile,
			ico: 'chip',
			icoColor: T.violetIco,
			label: 'Devices',
		})
	);
	P.push(
		card({
			x: 276,
			y: 236,
			w: 218,
			border: T.blue,
			tileBg: T.blueTile,
			ico: 'split',
			icoColor: T.blueIco,
			label: 'Message dispatcher',
		})
	);
	P.push(
		card({
			x: 276,
			y: 376,
			w: 218,
			border: T.blue,
			tileBg: T.blueTile,
			ico: 'tree',
			icoColor: T.blueIco,
			label: 'Subscription trie',
		})
	);

	const topic = (y, label) =>
		card({
			x: 586,
			y,
			w: 268,
			border: T.teal,
			tileBg: T.tealTile,
			ico: 'kafka',
			icoColor: T.tealIco,
			icoSize: 16,
			label,
			size: 13.5,
			mono: true,
		});
	P.push(topic(236, 'tbmq.msg.ie.$id_A'));
	P.push(topic(376, 'tbmq.msg.ie.$id_Z'));

	const integration = (y, label) =>
		card({ x: 922, y, w: 176, border: T.teal, tileBg: T.tealTile, ico: 'login', icoColor: T.tealIco, label });
	P.push(integration(236, 'Integration A'));
	P.push(integration(376, 'Integration Z'));

	const external = (y, label) =>
		card({
			x: 1140,
			y,
			w: 148,
			border: T.slate,
			tileBg: T.slateTile,
			ico: 'monitor',
			icoColor: T.slateIco,
			label,
			size: 13.5,
		});
	P.push(external(236, 'External A'));
	P.push(external(376, 'External Z'));

	// "…and the ones in between" markers, between each pair of rows.
	P.push(ellipsis(T, 720, 333.5));
	P.push(ellipsis(T, 1010, 333.5));
	P.push(ellipsis(T, 1214, 333.5));

	P.push(chipLabel(241, cyOf(242, 12.5), 'Publish', { padX: 5 }));
	P.push(chipLabel(444, cyOf(326, 12), 'topic match', { size: 12, padX: 5 }));
	P.push(chipLabel(532, cyOf(244, 12), 'produce', { size: 12, padX: 5 }));
	P.push(chipLabel(550, cyOf(384, 12), 'produce', { size: 12, padX: 5 }));
	P.push(chipLabel(888, cyOf(244, 12), 'consume', { size: 12, padX: 5 }));
	P.push(chipLabel(888, cyOf(384, 12), 'consume', { size: 12, padX: 5 }));
	P.push(chipLabel(1117, cyOf(244, 12), 'push', { size: 12, padX: 5 }));
	P.push(chipLabel(1117, cyOf(384, 12), 'push', { size: 12, padX: 5 }));

	P.push(
		legend(W, 536, [
			[T.violet, 'MQTT clients'],
			[T.blue, 'Broker'],
			[T.teal, 'Kafka & integrations'],
			[T.slateLine, 'External systems'],
		])
	);
	wrap(
		"A matched publish is written to the integration's own Kafka topic; the executor consumes it and pushes to " +
			'the external system.',
		14,
		1020
	).forEach((line, i) => {
		P.push(text(W / 2, cyOf(572, 14, 1.35) + i * 19, line, { size: 14, fill: T.faint, anchor: 'middle' }));
	});

	return frame(W, H, P);
}

// =============================================================================
// 22 / 23 / 24 — Integration validation: success, failure, executor unreachable
// =============================================================================
function validation(kit, spec) {
	const T = themeOf(kit);
	const k = makeDcKit(T);
	const { text, rr, arrow, cross, groupLabel, chipLabel, legend, wrap, frame } = k;
	const W = 1320;
	const H = 640;
	const P = [];

	P.push(rr(430, 190, 340, 286, 14, { stroke: T.dashBlue, sw: 1, dash: '5 5' }));

	// Out to the executor is always the same; what comes back is the outcome.
	P.push(arrow('M274,256 H426', T.slateLine));
	P.push(arrow('M774,256 H1026', T.blueLine));
	P.push(arrow('M426,316 H278', spec.back.color, spec.back.dashed ? { dash: '6 5' } : {}));
	P.push(arrow('M1026,316 H774', spec.back.color, spec.back.dashed ? { dash: '6 5' } : {}));
	P.push(arrow('M600,322 V372', spec.save.color, spec.save.dashed ? { dash: '6 5' } : {}));
	// ✕ marks the steps that did not happen.
	if (spec.save.crossed) P.push(cross(600, 340, 12, spec.save.crossColor));
	spec.crossedEdges.forEach((cx) => P.push(cross(cx, 316, 12, T.slateLine)));

	P.push(text(W / 2, cyOf(58, 22, 1.35), spec.title, { size: 22, weight: 500, fill: T.txt, anchor: 'middle' }));
	P.push(groupLabel(448, 202, 'TBMQ'));

	P.push(
		iconRow(k, {
			x: 60,
			y: 246,
			w: 210,
			h: 80,
			border: T.slate,
			tileBg: T.slateTile,
			ico: 'adminUser',
			icoColor: T.slateIco,
			icoSize: 18,
			tileSize: 30,
			tileR: 7,
			gap: 12,
			label: 'Admin',
			size: 15,
		})
	);
	const brokerCard = (y, ico, label) =>
		iconRow(k, {
			x: 450,
			y,
			w: 300,
			h: 60,
			border: T.blue,
			tileBg: T.blueTile,
			ico,
			icoColor: T.blueIco,
			icoSize: 18,
			tileSize: 30,
			tileR: 7,
			gap: 12,
			label,
			size: 15,
		});
	P.push(brokerCard(236, 'gearSparkle', 'Integration service'));
	P.push(brokerCard(376, 'tree', 'Subscription trie'));
	P.push(
		iconStack(k, {
			x: 1030,
			y: 226,
			w: 210,
			h: 120,
			border: spec.executor.border,
			dashed: spec.executor.dashed,
			tileSize: 44,
			tileR: 7,
			tileBg: spec.executor.tileBg,
			ico: 'gear',
			icoColor: spec.executor.ico,
			icoSize: 32,
			title: ['Integration', 'Executor'],
			titleSize: 16,
			titleFill: spec.executor.titleFill,
			gap: 10,
		})
	);

	P.push(chipLabel(360, cyOf(230, 12.5), 'Create/update integration'));
	P.push(chipLabel(901, cyOf(230, 12.5), 'Validation request'));
	P.push(chipLabel(392, cyOf(292, 12.5), spec.back.nearLabel, { weight: 500, fill: spec.back.ink }));
	P.push(chipLabel(901, cyOf(292, 12.5), spec.back.farLabel, { weight: 500, fill: spec.back.ink }));
	P.push(chipLabel(901, cyOf(344, 12.5), 'Validation response'));
	P.push(chipLabel(600, cyOf(300, 12.5), 'Save subscriptions'));

	// The design centres this note on its own 1180px box, not on the canvas.
	wrap(spec.note, 12.5, 1180).forEach((line, i) => {
		P.push(text(650, cyOf(spec.noteTop, 12.5) + i * 17, line, { size: 12.5, fill: T.faint, anchor: 'middle' }));
	});

	P.push(legend(W, 556, spec.legend(T)));
	wrap(spec.caption, 14, 1020).forEach((line, i) => {
		P.push(text(W / 2, cyOf(592, 14, 1.35) + i * 19, line, { size: 14, fill: T.faint, anchor: 'middle' }));
	});

	return frame(W, H, P);
}

/** The executor as a live, reachable service — 22 and 23. */
const executorUp = (T) => ({ border: T.teal, tileBg: T.tealTile, ico: T.tealIco });

export const validationSuccess = (kit) => {
	const T = themeOf(kit);
	return validation(kit, {
		title: 'Integration validation — success',
		executor: executorUp(T),
		back: { color: T.tealLine, ink: T.tealIco, nearLabel: 'OK', farLabel: 'OK' },
		save: { color: T.tealLine },
		crossedEdges: [],
		note: 'The subscriptions are saved only after the executor confirms the configuration.',
		noteTop: 496,
		legend: (T) => [
			[T.slateLine, 'Admin'],
			[T.blue, 'Broker'],
			[T.teal, 'Integration Executor'],
			[T.teal, 'Successful response'],
		],
		caption:
			'The executor validates the configuration and answers OK, so the integration is stored and its ' +
			'subscriptions enter the trie.',
	});
};

export const validationFailure = (kit) => {
	const T = themeOf(kit);
	return validation(kit, {
		title: 'Integration validation — validation failure',
		executor: executorUp(T),
		back: { color: T.errLine, ink: T.errIco, nearLabel: 'Failure', farLabel: 'Failure' },
		save: { color: T.slateLine, dashed: true, crossed: true, crossColor: T.errLine },
		crossedEdges: [],
		note: 'Nothing is saved — the subscription trie is left untouched and the admin sees the reason.',
		noteTop: 500,
		legend: (T) => [
			[T.slateLine, 'Admin'],
			[T.blue, 'Broker'],
			[T.teal, 'Integration Executor'],
			[T.err, 'Failure response'],
		],
		caption: 'The executor rejects the configuration, so the integration is not stored and no subscriptions are added.',
	});
};

export const validationTimeout = (kit) => {
	const T = themeOf(kit);
	return validation(kit, {
		title: 'Integration validation — executor unreachable',
		// Nothing is running to answer, so the card itself is drawn as absent.
		executor: { border: T.slate, dashed: true, tileBg: T.slateTile, ico: T.slateIco, titleFill: T.faint },
		back: { color: T.slateLine, dashed: true, ink: T.muted, nearLabel: 'Timeout', farLabel: 'No response' },
		save: { color: T.slateLine, dashed: true, crossed: true, crossColor: T.slateLine },
		crossedEdges: [352, 900],
		note: 'The broker keeps serving MQTT traffic unaffected.',
		noteTop: 500,
		legend: (T) => [
			[T.slateLine, 'Admin'],
			[T.blue, 'Broker'],
			[T.slateIco, 'did not happen', 'cross'],
			[T.slateLine, 'no response', 'dash'],
		],
		caption:
			'No Integration Executor is reachable, so the validation request times out and the integration is never ' +
			'stored.',
	});
};

// =============================================================================
// 25 / 26 / 27 — One integration type end to end: HTTP, MQTT, Kafka
// =============================================================================
function integrationType(kit, spec) {
	const T = themeOf(kit);
	const k = makeDcKit(T);
	const { text, rr, arrow, groupLabel, chipLabel, legend, wrap, frame } = k;
	const W = 1320;
	const H = 480;
	const P = [];

	P.push(rr(700, 170, 280, 140, 14, { stroke: T.dashTeal, sw: 1, dash: '5 5' }));
	P.push(arrow('M254,240 H398', T.violetLine, { bidir: true }));
	P.push(arrow('M584,240 H696', T.blueLine, { bidir: true }));
	P.push(arrow('M984,240 H1056', T.tealLine));

	P.push(text(W / 2, cyOf(64, 22, 1.35), spec.title, { size: 22, weight: 500, fill: T.txt, anchor: 'middle' }));
	P.push(groupLabel(718, 182, 'TBMQ Integration Executor'));

	P.push(
		iconRow(k, {
			x: 60,
			y: 200,
			w: 190,
			h: 80,
			border: T.violet,
			tileBg: T.violetTile,
			ico: 'chip',
			icoColor: T.violetIco,
			icoSize: 20,
			label: 'Devices',
			size: 16,
		})
	);
	P.push(
		iconRow(k, {
			x: 402,
			y: 200,
			w: 178,
			h: 80,
			border: T.blue,
			tileBg: T.blueTile,
			ico: 'hub',
			icoColor: T.blueIco,
			icoSize: 20,
			label: 'TBMQ',
			size: 16,
		})
	);
	P.push(
		iconRow(k, {
			x: 720,
			y: 208,
			w: 240,
			h: 64,
			border: T.teal,
			tileBg: T.tealTile,
			ico: 'login',
			icoColor: T.tealIco,
			icoSize: 20,
			label: spec.integration,
			size: 15,
		})
	);
	P.push(
		iconRow(k, {
			x: 1060,
			y: 200,
			w: 210,
			h: 80,
			border: T.slate,
			tileBg: T.slateTile,
			ico: spec.targetIco,
			icoColor: T.slateIco,
			icoSize: 20,
			label: spec.target,
			size: 15,
		})
	);

	P.push(chipLabel(326, cyOf(206, 12.5), 'MQTT(S)'));
	P.push(chipLabel(640, cyOf(206, 12.5), 'TCP(TLS)'));
	P.push(chipLabel(1020, cyOf(206, 12.5), spec.protocol));

	P.push(
		legend(W, 396, [
			[T.violet, 'Devices'],
			[T.blue, 'Broker'],
			[T.teal, 'Integration Executor'],
			[T.slateLine, spec.legendTarget],
		])
	);
	wrap(spec.caption, 14, 1020).forEach((line, i) => {
		P.push(text(W / 2, cyOf(432, 14, 1.35) + i * 19, line, { size: 14, fill: T.faint, anchor: 'middle' }));
	});

	return frame(W, H, P);
}

export const httpIntegration = (kit) =>
	integrationType(kit, {
		title: 'HTTP integration',
		integration: 'HTTP integration',
		// The design's Material `http` icon is lettering; `globe` is the line-icon
		// stand-in, as on the architecture hero's "External systems" card.
		targetIco: 'globe',
		target: 'HTTP endpoint',
		protocol: 'HTTP(S)',
		legendTarget: 'HTTP endpoint',
		caption:
			'Device messages matched by the integration are pushed to an external HTTP endpoint by the executor, ' +
			'never by the broker itself.',
	});

export const mqttIntegration = (kit) =>
	integrationType(kit, {
		title: 'MQTT integration',
		integration: 'MQTT integration',
		targetIco: 'lan',
		target: 'MQTT broker',
		protocol: 'MQTT(S)',
		legendTarget: 'External MQTT broker',
		caption: 'The executor acts as an MQTT client against an external broker, bridging matched messages out of TBMQ.',
	});

export const kafkaIntegration = (kit) =>
	integrationType(kit, {
		title: 'Kafka integration',
		integration: 'Kafka integration',
		targetIco: 'kafka',
		target: 'Kafka cluster',
		protocol: 'TCP(TLS)',
		legendTarget: 'External Kafka cluster',
		caption:
			'Matched messages are produced to an external Kafka cluster — separate from the cluster TBMQ uses ' +
			'internally.',
	});

// =============================================================================
// 28 — Two settings decide the outgoing body: content type, then envelope
// =============================================================================
export function payloadEncoding(kit) {
	const T = themeOf(kit);
	const k = makeDcKit(T);
	const { text, rr, icon, arrow, legend, wrap, frame } = k;
	const W = 1320;
	const H = 940;
	const P = [];

	// Teal bus fans the raw payload out to the three encodings, blue bus gathers
	// them back into the two body shapes. Split into the design's own segments —
	// each drop is a plain stub plus a headed final leg.
	P.push(arrow('M660,222 V286', T.tealLine, { plain: true }));
	P.push(arrow('M300,286 H1020', T.tealLine, { plain: true }));
	for (const x of [300, 660, 1020]) {
		P.push(arrow(`M${x},286 V318`, T.tealLine, { plain: true }));
		P.push(arrow(`M${x},318 V346`, T.tealLine));
		P.push(arrow(`M${x},442 V474`, T.blueLine, { plain: true }));
	}
	P.push(arrow('M300,474 H1020', T.blueLine, { plain: true }));
	P.push(arrow('M400,474 V536', T.blueLine));
	P.push(arrow('M920,474 V536', T.blueLine));

	P.push(
		text(W / 2, cyOf(56, 22, 1.35), 'How an outgoing integration payload is built', {
			size: 22,
			weight: 500,
			fill: T.txt,
			anchor: 'middle',
		})
	);

	P.push(
		iconRowStack(k, {
			x: 400,
			y: 126,
			w: 520,
			h: 96,
			border: T.violet,
			tileBg: T.violetTile,
			ico: 'northEast',
			icoColor: T.violetIco,
			icoSize: 20,
			lines: [
				{ text: 'Raw payload', size: 15, weight: 500 },
				{ text: '{"temperature":25}', size: 12.5, mono: true, fill: T.muted },
			],
		})
	);

	P.push(bandLabel(k, W / 2, 312, 'Encoded per — Payload content type'));

	/** 320px encoding card: icon + name on the first row, the result beneath it. */
	const encoding = (x, name, value) =>
		rr(x, 346, 320, 96, 10, { fill: T.node, stroke: T.teal, sw: 1 }) +
		icon('dataObject', x + 24.5, 368.5, 17, T.tealIco) +
		text(x + 42, 368.5, name, { size: 14.5, weight: 500, fill: T.txt }) +
		text(x + 16, 393.5, value, { size: 12.5, mono: true, fill: T.muted });
	P.push(encoding(140, 'JSON', '{"temperature":25}'));
	P.push(encoding(500, 'Text', '"{\\"temperature\\":25}"'));
	P.push(encoding(860, 'Binary', '"eyJ0ZW1wZXJhdHVyZSI6MjV9"'));

	P.push(bandLabel(k, W / 2, 468, 'Placed per — Send only message payload'));

	/**
	 * 520px body card. `lines` are mono and top-aligned under the pill; the
	 * second line of the envelope is indented by two mono characters, as the
	 * design does with `&nbsp;&nbsp;`.
	 */
	const body = (x, state, lines) => {
		let s = rr(x, 536, 520, 96, 10, { fill: T.node, stroke: T.blue, sw: 1 });
		const p = pill(k, x + 16, 561, state, { bg: T.blueTile, ls: 0.69 });
		s += p.s;
		s += text(x + 16 + p.w + 10, 561, 'body =', { size: 13.5, fill: T.muted });
		lines.forEach(([line, indent = 0], i) => {
			s += text(x + 16 + indent, 589.5 + i * 19, line, { size: 12.5, mono: true, fill: T.txt });
		});
		return s;
	};
	P.push(body(140, 'ON', [['the encoded payload']]));
	P.push(
		body(700, 'OFF', [
			['{ "payload": <encoded>, "topicName": …,'],
			['"clientId": …, "eventType": "PUBLISH_MSG", … }', 15],
		])
	);

	// The failure branch, common to all three encodings.
	P.push(rr(140, 672, 1080, 136, 12, { fill: T.node, stroke: T.slate, sw: 1 }));
	P.push(text(158, 697, 'If encoding fails', { size: 15, weight: 500, fill: T.txt }));
	// The design baseline-aligns this against the heading; at these sizes the
	// difference from a shared centre line is under a pixel.
	P.push(
		text(
			158 + sw('If encoding fails', 15) + 10,
			697,
			'the payload is not valid JSON, or not text — per Send as binary on parsing error',
			{ size: 13, fill: T.muted }
		)
	);
	const failRow = (cy, state, label) =>
		pillRow(k, 158, cy, state, label, { gap: 12, fill: T.muted, pill: { bg: T.slateTile, ls: 0.69 } });
	P.push(failRow(731, 'ON', 'fall back to Base64 binary'));
	P.push(failRow(763, 'OFF', 'not sent, counted as failed'));

	P.push(
		legend(W, 856, [
			[T.teal, 'Payload content type'],
			[T.blue, 'Send only message payload'],
			[T.slateLine, 'Failure handling'],
		])
	);
	wrap(
		'Two independent settings decide what the outgoing body looks like — the content type that encodes the ' +
			'payload, and whether anything is wrapped around it.',
		14,
		1020
	).forEach((line, i) => {
		P.push(text(W / 2, cyOf(892, 14, 1.35) + i * 19, line, { size: 14, fill: T.faint, anchor: 'middle' }));
	});

	return frame(W, H, P);
}

// =============================================================================
// 29 — MQTT: which of topic, QoS and retain the incoming message can decide
// =============================================================================
export function mqttPublishResolution(kit) {
	const T = themeOf(kit);
	const k = makeDcKit(T);
	const { text, rr, groupLabel, legend, wrap, frame } = k;
	const W = 1320;
	const H = 716;
	const P = [];

	P.push(rr(250, 168, 620, 424, 14, { stroke: T.dashBlue, sw: 1, dash: '5 5' }));
	P.push(rr(890, 168, 390, 424, 14, { stroke: T.dashTeal, sw: 1, dash: '5 5' }));

	P.push(
		text(W / 2, cyOf(56, 22, 1.35), 'MQTT integration — how topic, QoS and retain are resolved', {
			size: 22,
			weight: 500,
			fill: T.txt,
			anchor: 'middle',
		})
	);
	P.push(groupLabel(278, 180, 'Forwarded message'));
	P.push(groupLabel(918, 180, 'Lifecycle event'));

	const ROWS = [
		{
			y: 232,
			field: 'topic',
			toggle: 'Dynamic topic name',
			on: 'take the topic from the message',
			off: 'use the configured Topic name',
			fixed: 'Events topic name',
		},
		{
			y: 352,
			field: 'qos',
			toggle: 'Dynamic QoS',
			on: 'take the QoS from the message',
			off: 'use the configured QoS',
			fixed: '1',
		},
		{
			y: 472,
			field: 'retain',
			toggle: 'Dynamic retain',
			on: 'take the retain flag from the message',
			off: 'use the configured Retain',
			fixed: 'false',
		},
	];

	for (const r of ROWS) {
		// The MQTT field, right-aligned against the card's inner edge.
		P.push(rr(60, r.y, 150, 96, 10, { fill: T.node, stroke: T.slate, sw: 1 }));
		P.push(text(194, r.y + 48, r.field, { size: 14, mono: true, fill: T.txt, anchor: 'end' }));

		// Forwarded message — the branch the Dynamic toggle picks.
		P.push(rr(270, r.y, 580, 96, 10, { fill: T.node, stroke: T.blue, sw: 1 }));
		P.push(text(834, cyOf(r.y + 13, 11.5), r.toggle, { size: 11.5, mono: true, fill: T.faint, anchor: 'end' }));
		P.push(pillRow(k, 286, r.y + 24, 'ON', r.on, { pill: { bg: T.blueTile } }));
		P.push(pillRow(k, 286, r.y + 56, 'OFF', r.off, { fill: T.muted, pill: { border: T.chipBd, ink: T.muted } }));

		// Lifecycle event — the same three fields, none of them negotiable.
		P.push(
			iconRowStack(k, {
				x: 910,
				y: r.y,
				w: 350,
				h: 96,
				border: T.teal,
				tileBg: T.tealTile,
				ico: 'lock',
				icoColor: T.tealIco,
				icoSize: 17,
				tileSize: 30,
				tileR: 6,
				lineGap: 3,
				lines: [
					{ text: r.fixed, size: 13.5, mono: true },
					{ text: 'always, not configurable', size: 12, fill: T.muted },
				],
			})
		);
	}

	P.push(
		legend(W, 632, [
			[T.slateLine, 'MQTT field'],
			[T.blue, 'Forwarded message'],
			[T.teal, 'Lifecycle event'],
		])
	);
	wrap(
		'Forwarded messages can inherit topic, QoS and retain from the incoming message when the matching Dynamic ' +
			'toggle is on; lifecycle events never do.',
		14,
		1020
	).forEach((line, i) => {
		P.push(text(W / 2, cyOf(668, 14, 1.35) + i * 19, line, { size: 14, fill: T.faint, anchor: 'middle' }));
	});

	return frame(W, H, P);
}
