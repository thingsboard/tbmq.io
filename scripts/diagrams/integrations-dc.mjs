/**
 * INTEGRATIONS — the eight diagrams of the integrations guides.
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
 *
 * Geometry mirrors the components 1:1 — the canvas sizes, the `left`/`top` of
 * every box and the `d` of every connector are the designs' own numbers. Two
 * families collapse into a builder + specs (validation, integration type),
 * because their members differ only in labels, colours and which steps are
 * crossed out. Palette and primitives come from ./dc-kit.mjs.
 *
 * Regenerate with `pnpm diagrams:arch`.
 */

import { DC, makeDcKit, sw } from './dc-kit.mjs';

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
