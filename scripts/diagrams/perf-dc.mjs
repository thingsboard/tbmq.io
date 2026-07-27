/**
 * BENCHMARKS — the three performance-test topology diagrams.
 *
 * Ported from the approved design components:
 *   17 Benchmark 500k persistent devices  → P2P, 1M msg/sec
 *   18 Benchmark single node fan-out      → single node, 3M msg/sec
 *   19 Benchmark 100M clients             → cluster, 100M connections
 *
 * The three components share one layout down to the pixel and differ only in
 * their numbers, so there is a single `benchmark(spec)` builder here and three
 * SPEC objects below. Anything positional belongs to the builder; anything a
 * reader could get wrong belongs to a spec. Palette and primitives come from
 * ./dc-kit.mjs.
 *
 * Geometry mirrors the designs 1:1 on a 1320 × 650 canvas. A card drawn with
 * `stack: true` gets the two offset layers the designs use to say "N of these";
 * `stack: false` is a single instance (one TBMQ node, one PostgreSQL).
 *
 * Regenerate with `pnpm diagrams:arch`.
 */

import { DC, makeDcKit } from './dc-kit.mjs';

const W = 1320;
const H = 650;

/** Line-box centre for CSS `top` + `font-size` + `line-height` factor. */
const cyOf = (top, size, lh = 1.2) => top + (size * lh) / 2;

function benchmark(kit, spec) {
	const T = DC[kit?.T?.name === 'dark' ? 'dark' : 'light'];
	const P = [];
	const { text, rr, tile, arrow, rowCard, groupLabel, legend, wrap, frame } = makeDcKit(T);

	/**
	 * The two offset layers behind a multi-instance card. Drawn before the card
	 * itself, from back to front, so the front card's fill hides their tops.
	 */
	const stackLayers = (x, y, w, h, border) =>
		[10, 5].map((d) => rr(x + d, y + d, w, h, 10, { fill: T.node, stroke: border, sw: 1 })).join('');

	/** Client card: icon tile, one big number, one wrapping caption. */
	function statCard(o) {
		const { x, y, w, h, ico, value, sub } = o;
		let s = o.stack ? stackLayers(x, y, w, h, T.violet) : '';
		s += rr(x, y, w, h, 10, { fill: T.node, stroke: T.violet, sw: 1 });
		s += tile(x + 16, y + 16, 34, 8, T.violetTile, ico, T.violetIco, 18);
		s += text(x + 16, cyOf(y + 56, 24, 1.05), value, { size: 24, weight: 500, fill: T.txt });
		wrap(sub, 12.5, w - 32).forEach((line, i) => {
			s += text(x + 16, cyOf(y + 87.2, 12.5) + i * 15, line, { size: 12.5, fill: T.muted });
		});
		return s;
	}

	/** Infrastructure card: icon tile above title and spec line. */
	function miniCard(o) {
		const { x, y, w, h, border, tileBg, ico, icoColor, title, sub } = o;
		let s = o.stack ? stackLayers(x, y, w, h, border) : '';
		s += rr(x, y, w, h, 10, { fill: T.node, stroke: border, sw: 1 });
		s += tile(x + 16, y + 16, 30, 8, tileBg, ico, icoColor, 14);
		s += text(x + 16, cyOf(y + 52, 15, 1.05), title, { size: 15, weight: 500, fill: T.txt });
		s += text(x + 16, cyOf(y + 73.75, 12.5), sub, { size: 12.5, fill: T.muted });
		return s;
	}

	/** Edge annotation: a bold label with a list of measurements under it. */
	function edgeLabel(x, labelTop, label, listTop, list) {
		let s = text(x, cyOf(labelTop, 13, 1.35), label, { size: 13, weight: 500, fill: T.txt });
		list.forEach((line, i) => {
			s += text(x, cyOf(listTop, 12.5) + i * 20, line, { size: 12.5, fill: T.muted });
		});
		return s;
	}

	// --- container + connectors ------------------------------------------------
	P.push(rr(480, 150, 360, 370, 14, { stroke: T.dashBlue, sw: 1, dash: '5 5' }));
	P.push(arrow('M332,240 H474', T.violetLine)); // publishers → cluster
	P.push(arrow('M1000,210 H846', T.violetLine)); // subscribers → cluster (subscribe)
	P.push(arrow('M846,290 H994', T.violetLine)); // cluster → subscribers (deliver)
	P.push(arrow('M574,308 V340', T.tealLine, { bidir: true })); // nodes ↔ Kafka
	P.push(arrow('M746,308 V340', T.slateLine, { bidir: true })); // nodes ↔ storage

	// --- headings -------------------------------------------------------------
	P.push(text(W / 2, cyOf(52, 22, 1.35), spec.title, { size: 22, weight: 500, fill: T.txt, anchor: 'middle' }));
	P.push(groupLabel(110, 166, 'Publishers'));
	P.push(groupLabel(1010, 166, 'Subscribers'));

	// --- clients --------------------------------------------------------------
	P.push(statCard({ x: 100, y: 180, w: 220, h: 130, ico: 'chip', stack: true, ...spec.publishers }));
	P.push(statCard({ x: 1000, y: 180, w: 220, h: 130, ico: 'apps', stack: true, ...spec.subscribers }));

	// --- the cluster ----------------------------------------------------------
	{
		const { title, sub, stack } = spec.nodes;
		// rowCard draws a single card, so the stack layers are prepended here rather
		// than hidden inside it — keeps one card helper for the hero and these.
		P.push(
			(stack ? stackLayers(498, 190, 324, 100, T.blue) : '') +
				rowCard({
					x: 498,
					y: 190,
					w: 324,
					h: 100,
					border: T.blue,
					tileBg: T.blueTile,
					tileIco: T.blueIco,
					ico: 'hub',
					titleSize: 17,
					pad: 16,
					title,
					sub,
				})
		);
	}
	P.push(
		miniCard({
			x: 498,
			y: 344,
			w: 152,
			h: 120,
			border: T.teal,
			tileBg: T.tealTile,
			ico: 'kafka',
			icoColor: T.tealIco,
			...spec.kafka,
		})
	);
	P.push(
		miniCard({
			x: 670,
			y: 344,
			w: 152,
			h: 120,
			border: T.slate,
			tileBg: T.slateTile,
			icoColor: T.slateIco,
			...spec.storage,
		})
	);

	// --- edge annotations -----------------------------------------------------
	P.push(edgeLabel(348, 210, 'Publish', 250, spec.publish));
	P.push(edgeLabel(860, 182, 'Subscribe', 222, spec.subscribe));
	P.push(edgeLabel(860, 262, 'Deliver', 302, spec.deliver));

	// --- legend + caption -----------------------------------------------------
	P.push(
		legend(W, 566, [
			[T.violet, 'MQTT clients'],
			[T.blue, 'TBMQ nodes'],
			[T.teal, 'Kafka'],
			[T.slateLine, 'Storage'],
		])
	);
	wrap(spec.caption, 14, 1020).forEach((line, i) => {
		P.push(text(W / 2, cyOf(602, 14, 1.35) + i * 19, line, { size: 14, fill: T.faint, anchor: 'middle' }));
	});

	return frame(W, H, P);
}

// =============================================================================
// 17 — P2P, 500k persistent devices (1M msg/sec total throughput)
// =============================================================================
export const benchmarkP2P = (kit) =>
	benchmark(kit, {
		title: 'TBMQ cluster',
		publishers: { value: '500k', sub: 'MQTT clients · devices' },
		publish: ['500k msg/s', 'QoS 1', '1 msg/s per publisher', '62 bytes/msg'],
		nodes: { title: '5× TBMQ nodes', sub: '16 vCPU · 32 GiB RAM', stack: true },
		kafka: { title: '5× Kafka', sub: '2 vCPU · 4 GiB RAM', stack: true },
		storage: { title: '11× Redis', sub: '2 vCPU · 4 GiB RAM', ico: 'redis', stack: true },
		subscribe: ['QoS 1'],
		deliver: ['500k msg/s', '1 msg/s per subscriber'],
		subscribers: { value: '500k', sub: 'MQTT clients · persistent devices' },
		caption:
			'Persistent devices at QoS 1: every message is written to Redis before delivery, and 500k subscribers each receive one message per second.',
	});

// =============================================================================
// 18 — single-node fan-out (3M msg/sec out of one node)
// =============================================================================
export const benchmarkFanOut = (kit) =>
	benchmark(kit, {
		title: 'TBMQ',
		publishers: { value: '100', sub: 'MQTT clients · devices' },
		publish: ['1k msg/s', 'QoS 0', '66 bytes/msg'],
		nodes: { title: 'TBMQ node', sub: '32 vCPU · 128 GiB RAM' },
		kafka: { title: '3× Kafka', sub: '2 vCPU · 8 GiB RAM', stack: true },
		storage: { title: 'PostgreSQL', sub: '2 vCPU · 8 GiB RAM', ico: 'db' },
		subscribe: ['QoS 0'],
		deliver: ['3M msg/s', '1k msg/s per subscriber'],
		subscribers: { value: '3000', sub: 'MQTT clients · devices' },
		caption:
			'Fan-out on a single node: 1k msg/s in at QoS 0 becomes 3M msg/s out across 3000 non-persistent subscribers, with nothing stored per message.',
	});

// =============================================================================
// 19 — 100M concurrent connections (fan-in to APPLICATION clients)
// =============================================================================
export const benchmarkFanIn = (kit) =>
	benchmark(kit, {
		title: 'TBMQ cluster',
		publishers: { value: '100M', sub: 'MQTT clients · devices' },
		publish: ['3M msg/s', 'QoS 1', '114 bytes/msg'],
		nodes: { title: '25× TBMQ nodes', sub: '64 vCPU · 256 GiB RAM', stack: true },
		kafka: { title: '9× Kafka', sub: '8 vCPU · 32 GiB RAM', stack: true },
		storage: { title: 'PostgreSQL', sub: '2 vCPU · 8 GiB RAM', ico: 'db' },
		subscribe: ['QoS 1'],
		deliver: ['3M msg/s', '6k msg/s per subscriber'],
		subscribers: { value: '500', sub: 'persistent MQTT clients · applications' },
		caption:
			'100M connected devices publishing 3M msg/s at QoS 1, consumed by 500 persistent application clients reading their own Kafka topics.',
	});
