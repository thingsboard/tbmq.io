/**
 * ALTERNATIVE diagram set — drawn from the clean-room ASCII blueprints in
 * `docs/superpowers/report/tbmq-architecture-diagram-blueprints.md`, as a
 * second take on each diagram to review side by side with the original.
 *
 * That review is DONE. Two of these won and are wired into the live `DIAGRAMS`
 * registry in ./build.mjs — `subscriptionTrie` and `standaloneVsCluster`, which
 * therefore render into `src/assets/images/docs/mqtt-broker/architecture/`. Edit
 * those two here, not in ./extras.mjs. The rest lost and no longer render
 * anywhere; they are kept only as a reference for the next redesign pass.
 */
import { rectC, top, bottom, left, right } from './kit.mjs';

const cap = (k, W, y, str, opts) => k.caption(W / 2, y, str, opts);

/** Plain connector line with no arrowhead (for elbow stubs). */
const stub = (k, x1, y1, x2, y2, type = 'flow') =>
	`<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="${type === 'ack' ? k.T.ack : k.T.flow}" stroke-width="1.9" stroke-dasharray="${type === 'ack' ? '6 5' : 'none'}" stroke-linecap="round"/>`;

/**
 * Muted qualifier for a group box, right-aligned on its top border so the
 * label tab (left) and the arrow lane (middle) both stay clear.
 */
function groupNote(k, xRight, y, str) {
	const tx = xRight - 18;
	const w = str.length * 6.3 + 20;
	// mask the dashed border behind the text so the two do not overprint
	return (
		`<rect x="${tx - w}" y="${y - 11}" width="${w}" height="22" fill="${k.T.canvas}"/>` +
		k.text(tx, y, str, { size: 11.5, weight: 600, fill: k.T.inkMuted, anchor: 'end' })
	);
}

/** Horizontal dashed "Kafka persistence gate" band. */
const gateH = (k, x, y, w, label, h = 42) =>
	`<rect x="${x}" y="${y - h / 2}" width="${w}" height="${h}" rx="10" fill="${k.T.kinds.core.fill}" stroke="${k.T.kinds.core.stroke}" stroke-width="1.3" stroke-dasharray="7 5" opacity="0.9"/>` +
	k.text(x + w / 2, y, label, { anchor: 'middle', size: 12.5, weight: 700, fill: k.T.kinds.core.ink });

/** Vertical dashed gate band with stacked label lines. */
function gateV(k, x, y, w, h, lines) {
	let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${k.T.kinds.core.fill}" stroke="${k.T.kinds.core.stroke}" stroke-width="1.3" stroke-dasharray="7 5" opacity="0.9"/>`;
	let ly = y + 30;
	for (const l of lines) {
		s += k.text(x + w / 2, ly, l.t, {
			anchor: 'middle',
			size: l.size ?? 12,
			weight: l.weight ?? 700,
			fill: l.fill ?? k.T.kinds.core.ink,
			mono: !!l.mono,
		});
		ly += l.gap ?? 20;
	}
	return s;
}

/** Soft annotation panel with an optional title and bullet/mono lines. */
function noteBox(k, P, x, y, w, title, items, kind = 'transport') {
	const rh = 22;
	const h = (title ? 36 : 14) + items.length * rh + 10;
	const kk = k.T.kinds[kind];
	let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${k.T.neutralSoft}" stroke="${kk.stroke}" stroke-width="1.3"/>`;
	let iy = y + 22;
	if (title) {
		s += k.text(x + 14, iy, title, { size: 12, weight: 700, fill: kk.ink });
		iy += 28;
	}
	for (const it of items) {
		const t = typeof it === 'string' ? it : it.t;
		const mono = typeof it === 'string' ? false : !!it.mono;
		s += k.text(x + 16, iy, t, {
			size: mono ? 11.5 : 11.5,
			weight: mono ? 600 : 500,
			mono,
			fill: mono ? kk.ink : k.T.inkSub,
		});
		iy += rh;
	}
	P.push(s);
	return rectC(x, y, w, h);
}

// =============================================================================
// A1 — Top-level layered map
// =============================================================================
export function archMap(k) {
	const W = 1360,
		H = 900;
	const P = [];

	const clients = rectC(360, 40, 640, 104);
	const devices = rectC(388, 62, 280, 60);
	const apps = rectC(692, 62, 280, 60);
	const netty = rectC(360, 196, 640, 84);
	const webui = rectC(1090, 196, 230, 84);
	const node = rectC(300, 330, 760, 150);
	const disp = rectC(330, 362, 360, 88);
	const trie = rectC(710, 362, 320, 88);
	const pg = rectC(1090, 346, 230, 88);
	const kafka = rectC(180, 540, 1000, 96);
	const redis = rectC(300, 700, 280, 96);
	const ie = rectC(620, 700, 280, 96);
	const ext = rectC(940, 700, 280, 96);

	// clients <-> netty
	P.push(
		k.connector({
			from: bottom(devices),
			to: [devices.cx, netty.y],
			type: 'flow',
			label: 'CONNECT · PUBLISH · SUBSCRIBE',
			labelSide: 'left',
		})
	);
	P.push(
		k.connector({ from: [apps.cx, netty.y], to: bottom(apps), type: 'flow', label: 'deliver', labelSide: 'right' })
	);
	// netty -> node
	P.push(
		k.connector({
			from: [netty.cx, netty.y + netty.h],
			to: [netty.cx, node.y],
			type: 'flow',
			label: 'decode → Client actor',
		})
	);
	// dispatcher -> trie (cards are adjacent; a label chip would not fit the gap)
	P.push(k.connector({ from: right(disp), to: left(trie), type: 'flow' }));
	// node <-> kafka
	P.push(
		k.connector({
			from: [disp.cx - 60, node.y + node.h],
			to: [disp.cx - 60, kafka.y],
			type: 'flow',
			label: 'produce',
			labelSide: 'left',
		})
	);
	P.push(
		k.connector({
			from: [trie.cx + 40, kafka.y],
			to: [trie.cx + 40, node.y + node.h],
			type: 'flow',
			label: 'consume',
			labelSide: 'right',
		})
	);
	// kafka -> redis / ie
	P.push(
		k.connector({
			from: [redis.cx, kafka.y + kafka.h],
			to: top(redis),
			type: 'flow',
			label: 'tbmq.msg.persisted',
			labelSide: 'left',
		})
	);
	P.push(
		k.connector({
			from: [ie.cx, kafka.y + kafka.h],
			to: top(ie),
			type: 'flow',
			label: 'tbmq.msg.ie',
			labelSide: 'right',
		})
	);
	P.push(k.connector({ from: right(ie), to: left(ext), type: 'flow' }));
	// management plane
	P.push(k.connector({ from: bottom(webui), to: top(pg), type: 'flow', label: 'metadata', labelSide: 'right' }));
	P.push(k.connector({ from: [node.x + node.w, node.cy - 30], to: [pg.x, pg.cy], type: 'ack' }));

	P.push(k.groupBox({ ...clients, label: 'MQTT clients', kind: 'client' }));
	P.push(k.groupBox({ ...node, label: 'TBMQ node', kind: 'core' }));

	P.push(k.card({ ...devices, kind: 'client', icon: 'clients', title: 'Devices', sub: 'publishers · millions' }));
	P.push(k.card({ ...apps, kind: 'client', icon: 'app', title: 'Applications', sub: 'backend consumers' }));
	P.push(
		k.card({
			...netty,
			kind: 'transport',
			icon: 'netty',
			title: 'Netty listeners',
			sub: 'TCP 1883 · WS 8084  [on]   ·   SSL 8883 · WSS 8085  [off]',
		})
	);
	P.push(k.card({ ...webui, kind: 'transport', icon: 'webui', title: 'Web UI / REST' }));
	P.push(k.card({ ...disp, kind: 'core', icon: 'dispatch', title: 'MsgDispatcherService', sub: 'persist · route' }));
	P.push(k.card({ ...trie, kind: 'core', icon: 'trie', title: 'Subscription Trie', sub: 'topic matching' }));
	P.push(k.card({ ...pg, kind: 'pg', icon: 'pg', title: 'PostgreSQL', sub: 'metadata · no payloads' }));
	P.push(
		k.card({
			...kafka,
			kind: 'kafka',
			icon: 'kafka',
			title: 'Apache Kafka — durability backbone',
			sub: 'tbmq.msg.all · tbmq.msg.persisted · tbmq.msg.app.$CLIENT_ID · tbmq.msg.ie',
		})
	);
	P.push(k.card({ ...redis, kind: 'redis', icon: 'redis', title: 'Redis / Valkey', sub: 'persistent DEVICE msgs' }));
	P.push(k.card({ ...ie, kind: 'ie', icon: 'ie', title: 'Integration Executor', sub: 'separate JVM · :8082' }));
	P.push(k.card({ ...ext, kind: 'transport', icon: 'lb', title: 'External systems', sub: 'HTTP · MQTT · Kafka' }));

	P.push(
		cap(
			k,
			W,
			838,
			'Every PUBLISH is persisted to Kafka before it is acknowledged; storage and integrations hang off the backbone, never off the hot path.'
		)
	);
	P.push(
		k.legend(300, 868, [
			{ type: 'flow', label: 'message flow' },
			{ type: 'ack', label: 'metadata / query' },
		])
	);
	return k.frame(W, H, P);
}

// =============================================================================
// A2 — PUBLISH lifecycle (two zones: synchronous vs asynchronous)
// =============================================================================
export function publishLifecycle(k) {
	const W = 1360,
		H = 762;
	const P = [];

	P.push(
		k.groupBox({
			x: 40,
			y: 60,
			w: 1280,
			h: 300,
			label: 'synchronous — this is what blocks the acknowledgement',
			kind: 'core',
		})
	);
	const pub = rectC(70, 140, 190, 84);
	const actor = rectC(360, 140, 200, 84);
	const disp = rectC(660, 140, 250, 84);
	const kTopic = rectC(1010, 140, 280, 84);

	P.push(k.connector({ from: right(pub), to: left(actor), type: 'flow', label: 'PUBLISH', labelSide: 'above' }));
	P.push(k.connector({ from: right(actor), to: left(disp), type: 'flow', label: 'persist', labelSide: 'above' }));
	P.push(k.connector({ from: right(disp), to: left(kTopic), type: 'flow', label: 'produce', labelSide: 'above' }));

	P.push(gateH(k, 70, 258, 1220, 'DURABILITY GATE — Kafka confirms the append (producer ack)'));
	// ack path back to the publisher, below the gate
	P.push(stub(k, kTopic.cx, 300, kTopic.cx, 326, 'ack'));
	P.push(
		k.connector({
			from: [kTopic.cx, 326],
			to: [pub.cx, 326],
			type: 'ack',
			label: 'PUBACK (QoS 1) / PUBREC (QoS 2)   —   QoS 0: none',
			labelSide: 'above',
		})
	);
	P.push(stub(k, pub.cx, 326, pub.cx, 224, 'ack'));

	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Publisher' }));
	P.push(k.card({ ...actor, kind: 'core', icon: 'actor', title: 'Client actor' }));
	P.push(k.card({ ...disp, kind: 'core', icon: 'dispatch', title: 'MsgDispatcherService', titleSize: 14 }));
	P.push(k.kafkaTopic({ ...kTopic, name: 'tbmq.msg.all', note: 'append + producer ack' }));

	P.push(
		k.groupBox({
			x: 40,
			y: 410,
			w: 1280,
			h: 212,
			label: 'asynchronous — fan-out, independent of the acknowledgement',
			kind: 'kafka',
		})
	);
	const kRef = rectC(70, 480, 260, 84);
	const cons = rectC(430, 480, 290, 84);
	const trie = rectC(820, 480, 230, 84);
	const deliv = rectC(1150, 480, 140, 84);
	P.push(k.connector({ from: right(kRef), to: left(cons), type: 'flow', label: 'consume', labelSide: 'above' }));
	P.push(k.connector({ from: right(cons), to: left(trie), type: 'flow', label: 'match', labelSide: 'above' }));
	P.push(k.connector({ from: right(trie), to: left(deliv), type: 'flow', label: 'route', labelSide: 'above' }));
	P.push(k.kafkaTopic({ ...kRef, name: 'tbmq.msg.all', note: 'read back' }));
	P.push(k.card({ ...cons, kind: 'core', icon: 'dispatch', title: 'PublishMsgConsumerService', titleSize: 12.5 }));
	P.push(k.card({ ...trie, kind: 'core', icon: 'trie', title: 'Subscription Trie' }));
	P.push(k.card({ ...deliv, kind: 'client', icon: 'device', title: 'Subscribers' }));

	P.push(
		cap(
			k,
			W,
			664,
			'The publisher is released at the gate; matching and delivery happen afterwards and never hold up the acknowledgement.'
		)
	);
	P.push(
		cap(
			k,
			W,
			692,
			'Routing splits per subscriber: non-persistent → deliver now · persistent DEVICE → Redis · persistent APPLICATION → dedicated Kafka topic.',
			{ size: 12 }
		)
	);
	P.push(
		k.legend(80, 730, [
			{ type: 'flow', label: 'message / command' },
			{ type: 'ack', label: 'acknowledgement' },
		])
	);
	return k.frame(W, H, P);
}

// =============================================================================
// A3 — QoS timeline against a vertical persistence gate
// =============================================================================
export function qosTimeline(k) {
	const W = 1300,
		H = 660;
	const P = [];
	const gx = 540,
		gw = 220,
		gy = 96,
		gh = 430;

	P.push(
		gateV(k, gx, gy, gw, gh, [
			{ t: 'Kafka' },
			{ t: 'persistence gate' },
			{ t: 'tbmq.msg.all', mono: true, size: 11.5 },
			{ t: 'append + ack', weight: 500, fill: k.T.inkSub, size: 11 },
		])
	);

	const rows = [
		{ y: 190, label: 'QoS 0 — at most once', acks: [] },
		{ y: 300, label: 'QoS 1 — at least once', acks: [{ t: 'PUBACK', dir: 'out' }] },
		{
			y: 400,
			label: 'QoS 2 — exactly once',
			acks: [
				{ t: 'PUBREC', dir: 'out' },
				{ t: 'PUBREL', dir: 'in' },
				{ t: 'PUBCOMP', dir: 'out' },
			],
		},
	];

	for (const r of rows) {
		P.push(k.text(60, r.y, r.label, { size: 13, weight: 700, fill: k.T.ink }));
		P.push(k.connector({ from: [300, r.y], to: [gx - 10, r.y], type: 'flow', label: 'PUBLISH', labelSide: 'above' }));
		if (!r.acks.length) {
			P.push(
				k.text(gx + gw + 40, r.y, 'no acknowledgement — nothing returned', {
					size: 12,
					weight: 600,
					fill: k.T.inkMuted,
				})
			);
			continue;
		}
		let ay = r.y;
		for (const a of r.acks) {
			const isOut = a.dir === 'out';
			P.push(
				k.connector({
					from: [isOut ? gx + gw + 20 : 1240, ay],
					to: [isOut ? 1240 : gx + gw + 20, ay],
					type: isOut ? 'ack' : 'flow',
					label: a.t,
					labelSide: 'above',
				})
			);
			ay += 60;
		}
	}

	P.push(
		cap(k, W, 578, 'Everything to the right of the gate happens only after the message is durable in tbmq.msg.all.')
	);
	P.push(
		cap(
			k,
			W,
			606,
			'Shipped defaults are acks=1 and replication.factor=1 — run a replicated Kafka cluster to also survive a Kafka-broker failure.',
			{ size: 12 }
		)
	);
	P.push(
		k.legend(60, 638, [
			{ type: 'ack', label: 'broker → client' },
			{ type: 'flow', label: 'client → broker' },
		])
	);
	return k.frame(W, H, P);
}

// =============================================================================
// A4 — Routing decision (the real predicate)
// =============================================================================
export function decisionTree(k) {
	const W = 1240,
		H = 700;
	const P = [];
	const src = rectC(450, 40, 340, 64);
	const test = rectC(400, 158, 440, 84);
	const basic = rectC(80, 330, 340, 130);
	const type = rectC(720, 330, 440, 84);
	const dev = rectC(680, 500, 240, 130);
	const app = rectC(960, 500, 240, 130);

	P.push(k.connector({ from: bottom(src), to: top(test), type: 'flow' }));
	P.push(
		k.connector({
			from: [test.x + 40, test.y + test.h],
			to: top(basic),
			route: [
				[test.x + 40, 296],
				[basic.cx, 296],
			],
			type: 'flow',
			label: 'no',
			labelSide: 'above',
		})
	);
	P.push(
		k.connector({
			from: [test.x + test.w - 40, test.y + test.h],
			to: top(type),
			route: [
				[test.x + test.w - 40, 296],
				[type.cx, 296],
			],
			type: 'flow',
			label: 'yes',
			labelSide: 'above',
		})
	);
	P.push(
		k.connector({
			from: [type.x + 60, type.y + type.h],
			to: top(dev),
			route: [
				[type.x + 60, 466],
				[dev.cx, 466],
			],
			type: 'flow',
			label: 'DEVICE',
			labelSide: 'above',
		})
	);
	P.push(
		k.connector({
			from: [type.x + type.w - 60, type.y + type.h],
			to: top(app),
			route: [
				[type.x + type.w - 60, 466],
				[app.cx, 466],
			],
			type: 'flow',
			label: 'APPLICATION',
			labelSide: 'above',
		})
	);

	P.push(k.card({ ...src, kind: 'client', title: 'PUBLISH matched to a subscriber', titleSize: 13.5 }));
	P.push(
		k.card({
			...test,
			kind: 'transport',
			title: 'session.isPersistent() AND subQoS > 0 ?',
			sub: 'evaluated per matched subscription',
			titleSize: 13.5,
		})
	);
	P.push(
		k.card({
			...basic,
			kind: 'client',
			icon: 'device',
			title: 'BASIC path',
			sub: 'deliver now · nothing stored',
			topic: 'DownLinkProxy.sendBasicMsg',
		})
	);
	P.push(
		k.card({
			...type,
			kind: 'transport',
			title: 'client type — from credentials',
			sub: 'not from the CONNECT packet',
			titleSize: 13.5,
		})
	);
	P.push(
		k.card({
			...dev,
			kind: 'redis',
			icon: 'redis',
			title: 'DEVICE',
			sub: 'Redis / Valkey ZSET',
			topic: 'tbmq.msg.persisted',
		})
	);
	P.push(
		k.card({
			...app,
			kind: 'kafka',
			icon: 'kafka',
			title: 'APPLICATION',
			sub: 'dedicated Kafka topic',
			topic: 'tbmq.msg.app.$CLIENT_ID',
		})
	);

	noteBox(
		k,
		P,
		80,
		500,
		340,
		'Also takes the BASIC path',
		[
			'a QoS-0 subscription on a persistent session',
			'any publish sent with QoS 0',
			'a clean-session (non-persistent) client',
		],
		'client'
	);

	P.push(
		cap(
			k,
			W,
			668,
			'The persistent path needs BOTH a persistent session AND a subscription QoS above 0 — either one alone is delivered in memory.'
		)
	);
	return k.frame(W, H, P);
}

// =============================================================================
// A5 — Non-persistent DEVICE, single node
// =============================================================================
export function nonPersistSingle(k) {
	const W = 1160,
		H = 900;
	const P = [];
	const x = 320,
		w = 380;
	const pub = rectC(x, 50, w, 74);
	const actor = rectC(x, 168, w, 74);
	const disp = rectC(x, 286, w, 74);
	const kTopic = rectC(x, 404, w, 84);
	const cons = rectC(x, 542, w, 84);
	const proxy = rectC(x, 664, w, 80);
	const sub = rectC(x, 782, w, 74);

	P.push(
		k.connector({
			from: bottom(pub),
			to: top(actor),
			type: 'flow',
			badge: 1,
			badgeShift: [-46, 0],
			label: 'PUBLISH',
			labelSide: 'right',
		})
	);
	P.push(k.connector({ from: bottom(actor), to: top(disp), type: 'flow' }));
	P.push(
		k.connector({
			from: bottom(disp),
			to: top(kTopic),
			type: 'flow',
			badge: 2,
			badgeShift: [-46, 0],
			label: 'produce',
			labelSide: 'right',
		})
	);
	P.push(
		k.connector({
			from: bottom(kTopic),
			to: top(cons),
			type: 'flow',
			badge: 3,
			badgeShift: [-46, 0],
			label: 'consume',
			labelSide: 'right',
		})
	);
	P.push(k.connector({ from: bottom(cons), to: top(proxy), type: 'flow' }));
	P.push(
		k.connector({
			from: bottom(proxy),
			to: top(sub),
			type: 'flow',
			badge: 4,
			badgeShift: [-46, 0],
			label: 'deliver',
			labelSide: 'right',
		})
	);

	// ack elbow on the right
	P.push(stub(k, kTopic.x + kTopic.w, kTopic.cy, 880, kTopic.cy, 'ack'));
	P.push(stub(k, 880, kTopic.cy, 880, pub.cy, 'ack'));
	P.push(
		k.connector({ from: [880, pub.cy], to: [pub.x + pub.w, pub.cy], type: 'ack', label: 'PUBACK', labelSide: 'above' })
	);

	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Device', sub: 'publisher' }));
	P.push(k.card({ ...actor, kind: 'core', icon: 'actor', title: 'Client actor' }));
	P.push(k.card({ ...disp, kind: 'core', icon: 'dispatch', title: 'MsgDispatcherService' }));
	P.push(k.kafkaTopic({ ...kTopic, name: 'tbmq.msg.all', note: 'durability gate — ack released here' }));
	P.push(
		k.card({
			...cons,
			kind: 'core',
			icon: 'trie',
			title: 'consume → Subscription Trie',
			sub: 'subscriber is non-persistent',
			titleSize: 13.5,
		})
	);
	P.push(
		k.card({
			...proxy,
			kind: 'core',
			icon: 'dispatch',
			title: 'DownLinkProxy — local',
			sub: 'same node ⇒ no Kafka hop',
			titleSize: 13.5,
		})
	);
	P.push(k.card({ ...sub, kind: 'client', icon: 'device', title: 'Subscriber', sub: 'non-persistent DEVICE' }));

	noteBox(
		k,
		P,
		40,
		560,
		240,
		'Storage',
		['none for the subscriber', 'never reaches the', 'persistence manager'],
		'client'
	);

	P.push(
		cap(
			k,
			W,
			878,
			'The fastest path: the message is durable in Kafka, but nothing is stored for the subscriber — it is handed straight to the open connection.'
		)
	);
	return k.frame(W, H, P);
}

// =============================================================================
// A6 — Non-persistent DEVICE, cluster (swimlanes)
// =============================================================================
export function nonPersistCluster(k) {
	const W = 1420,
		H = 820;
	const P = [];
	const kAll = rectC(520, 30, 380, 72);
	P.push(k.kafkaTopic({ ...kAll, name: 'tbmq.msg.all', note: 'shared consumer group' }));

	P.push(k.groupBox({ x: 40, y: 130, w: 1340, h: 200, label: 'NODE A', kind: 'core' }));
	P.push(groupNote(k, 1380, 130, 'consumed tbmq.msg.all — may be any node in the cluster'));
	const a1 = rectC(80, 182, 380, 110);
	const a2 = rectC(520, 182, 380, 110);
	const a3 = rectC(960, 182, 380, 110);
	P.push(k.card({ ...a1, kind: 'core', icon: 'dispatch', title: 'PublishMsgConsumerService', titleSize: 13 }));
	P.push(k.card({ ...a2, kind: 'core', icon: 'trie', title: 'Subscription Trie', sub: 'subscriber lives on node B' }));
	P.push(
		k.card({
			...a3,
			kind: 'core',
			icon: 'dispatch',
			title: 'DownLinkProxy — remote',
			sub: 'DownLinkQueuePublisher',
			titleSize: 13.5,
		})
	);
	P.push(k.connector({ from: right(a1), to: left(a2), type: 'flow' }));
	P.push(k.connector({ from: right(a2), to: left(a3), type: 'flow' }));
	P.push(
		k.connector({
			from: [kAll.cx, kAll.y + kAll.h],
			to: [a1.cx, a1.y],
			route: [
				[kAll.cx, 130],
				[a1.cx, 130],
			],
			type: 'flow',
			label: 'consume',
			labelSide: 'left',
		})
	);

	const kDown = rectC(430, 380, 560, 78);
	P.push(
		k.kafkaTopic({
			...kDown,
			name: 'tbmq.msg.downlink.basic.$SERVICE_ID',
			note: 'payload: ClientPublishMsgProto · keyed by clientId',
		})
	);
	P.push(
		k.connector({
			from: [a3.cx, a3.y + a3.h],
			to: [kDown.x + kDown.w - 60, kDown.y],
			route: [
				[a3.cx, 344],
				[kDown.x + kDown.w - 60, 344],
			],
			type: 'xnode',
			label: 'publishBasicMsg',
			labelSide: 'right',
		})
	);

	P.push(k.groupBox({ x: 40, y: 520, w: 1340, h: 200, label: 'NODE B', kind: 'core' }));
	P.push(groupNote(k, 1380, 520, 'owns the subscriber connection'));
	const b1 = rectC(80, 572, 380, 110);
	const b2 = rectC(520, 572, 380, 110);
	const b3 = rectC(960, 572, 380, 110);
	P.push(k.card({ ...b1, kind: 'core', icon: 'dispatch', title: 'BasicDownLinkConsumer', titleSize: 13.5 }));
	P.push(
		k.card({
			...b2,
			kind: 'core',
			icon: 'actor',
			title: 'BasicDownLinkProcessor',
			sub: 'looks up the local session',
			titleSize: 13.5,
		})
	);
	P.push(k.card({ ...b3, kind: 'client', icon: 'device', title: 'Subscriber', sub: 'non-persistent DEVICE' }));
	P.push(k.connector({ from: right(b1), to: left(b2), type: 'flow' }));
	P.push(k.connector({ from: right(b2), to: left(b3), type: 'flow', label: 'deliver', labelSide: 'above' }));
	P.push(
		k.connector({
			from: [kDown.x + 80, kDown.y + kDown.h],
			to: [b1.cx, b1.y],
			route: [
				[kDown.x + 80, 490],
				[b1.cx, 490],
			],
			type: 'xnode',
			label: 'consume',
			labelSide: 'left',
		})
	);

	P.push(
		cap(
			k,
			W,
			748,
			'Nothing is stored for the subscriber — the cross-node hop exists only to reach the node holding the open connection.'
		)
	);
	P.push(
		k.legend(60, 782, [
			{ type: 'flow', label: 'in-node flow' },
			{ type: 'xnode', label: 'cross-node Kafka hop' },
		])
	);
	return k.frame(W, H, P);
}

// =============================================================================
// A8 — Persistent DEVICE, single node (store then deliver)
// =============================================================================
export function persistDevSingle(k) {
	const W = 1200,
		H = 965;
	const P = [];
	const x = 330,
		w = 400;
	const pub = rectC(x, 40, w, 72);
	const kAll = rectC(x, 150, w, 80);
	const cons = rectC(x, 268, w, 80);
	const kPers = rectC(x, 386, w, 80);
	const store = rectC(x, 504, w, 92);
	const redis = rectC(x, 634, w, 82);
	const deliver = rectC(x, 754, w, 82);
	const sub = rectC(x, 866, w, 46);

	P.push(k.connector({ from: bottom(pub), to: top(kAll), type: 'flow', label: 'PUBLISH', labelSide: 'right' }));
	P.push(k.connector({ from: bottom(kAll), to: top(cons), type: 'flow', label: 'consume', labelSide: 'right' }));
	P.push(
		k.connector({
			from: bottom(cons),
			to: top(kPers),
			type: 'flow',
			label: 'DeviceMsgQueuePublisher',
			labelSide: 'right',
		})
	);
	P.push(k.connector({ from: bottom(kPers), to: top(store), type: 'flow', label: 'consume', labelSide: 'right' }));
	P.push(
		k.connector({ from: bottom(store), to: top(redis), type: 'flow', label: 'ZADD + SET (EX=TTL)', labelSide: 'right' })
	);
	P.push(
		k.connector({
			from: bottom(redis),
			to: top(deliver),
			type: 'flow',
			label: 'only after store succeeds',
			labelSide: 'right',
		})
	);
	P.push(k.connector({ from: bottom(deliver), to: top(sub), type: 'flow' }));

	P.push(stub(k, kAll.x + kAll.w, kAll.cy, 940, kAll.cy, 'ack'));
	P.push(stub(k, 940, kAll.cy, 940, pub.cy, 'ack'));
	P.push(
		k.connector({ from: [940, pub.cy], to: [pub.x + pub.w, pub.cy], type: 'ack', label: 'PUBACK', labelSide: 'above' })
	);

	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Device', sub: 'publisher' }));
	P.push(k.kafkaTopic({ ...kAll, name: 'tbmq.msg.all', note: 'durability gate' }));
	P.push(
		k.card({
			...cons,
			kind: 'core',
			icon: 'trie',
			title: 'Trie → persistent DEVICE',
			sub: 'isPersistent && subQoS > 0',
			titleSize: 13.5,
		})
	);
	P.push(k.kafkaTopic({ ...kPers, name: 'tbmq.msg.persisted', note: '12 partitions · keyed by clientId' }));
	P.push(
		k.card({
			...store,
			kind: 'redis',
			icon: 'dispatch',
			title: '① STORE — DeviceMsgProcessor',
			sub: 'DeviceMsgService (Lettuce + Lua)',
			titleSize: 13.5,
		})
	);
	P.push(
		k.card({
			...redis,
			kind: 'redis',
			icon: 'redis',
			title: 'Redis / Valkey',
			sub: 'sorted set {clientId}_messages · score = packet id',
		})
	);
	P.push(
		k.card({
			...deliver,
			kind: 'core',
			icon: 'actor',
			title: '② DELIVER — Persisted-DEVICE actor',
			sub: 'assigns packet ids · MqttMsgDeliveryService',
			titleSize: 13.5,
		})
	);
	P.push(k.card({ ...sub, kind: 'client', title: 'Subscriber — persistent DEVICE', titleSize: 13 }));

	noteBox(
		k,
		P,
		40,
		560,
		250,
		'Offline?',
		['messages stay in the ZSET', 'redelivered on reconnect', 'via ZRANGE (REV)', 'removed only on ack'],
		'redis'
	);

	P.push(
		cap(
			k,
			W,
			944,
			'Order matters: the message is written to Redis first, and only then delivered — so a crash between the two cannot lose it.',
			{ size: 12 }
		)
	);
	return k.frame(W, H, P);
}

// =============================================================================
// A9 — Persistent DEVICE, cluster (store-then-forward swimlanes)
// =============================================================================
export function persistDevCluster(k) {
	const W = 1440,
		H = 830;
	const P = [];
	const kAll = rectC(300, 26, 340, 68);
	const kPers = rectC(760, 26, 380, 68);
	P.push(k.kafkaTopic({ ...kAll, name: 'tbmq.msg.all' }));
	P.push(k.kafkaTopic({ ...kPers, name: 'tbmq.msg.persisted', note: 'keyed by clientId' }));
	P.push(k.connector({ from: right(kAll), to: left(kPers), type: 'flow', label: 'route', labelSide: 'above' }));

	P.push(k.groupBox({ x: 40, y: 132, w: 1360, h: 220, label: 'NODE A', kind: 'core' }));
	P.push(groupNote(k, 1400, 132, 'whichever node consumes tbmq.msg.persisted for this clientId'));
	const a1 = rectC(75, 188, 300, 120);
	const a2 = rectC(405, 188, 320, 120);
	const a3 = rectC(755, 188, 300, 120);
	const a4 = rectC(1085, 188, 280, 120);
	P.push(k.card({ ...a1, kind: 'core', icon: 'dispatch', title: 'DeviceMsgQueueConsumer', titleSize: 12.5 }));
	P.push(
		k.card({ ...a2, kind: 'redis', icon: 'dispatch', title: '① STORE', sub: 'DeviceMsgProcessor', titleSize: 13.5 })
	);
	P.push(k.card({ ...a3, kind: 'redis', icon: 'redis', title: 'Redis / Valkey', sub: '{clientId}_messages' }));
	P.push(
		k.card({
			...a4,
			kind: 'core',
			icon: 'dispatch',
			title: '② route by',
			sub: 'session.serviceId = B',
			titleSize: 13.5,
		})
	);
	P.push(k.connector({ from: right(a1), to: left(a2), type: 'flow' }));
	P.push(k.connector({ from: right(a2), to: left(a3), type: 'flow' }));
	P.push(k.connector({ from: right(a3), to: left(a4), type: 'flow' }));
	P.push(
		k.connector({
			from: [kPers.cx, kPers.y + kPers.h],
			to: [a1.cx, a1.y],
			route: [
				[kPers.cx, 132],
				[a1.cx, 132],
			],
			type: 'flow',
			label: 'consume',
			labelSide: 'left',
		})
	);

	const kDown = rectC(400, 400, 620, 78);
	P.push(
		k.kafkaTopic({ ...kDown, name: 'tbmq.msg.downlink.persisted.$SERVICE_ID', note: 'payload: DevicePublishMsgProto' })
	);
	P.push(
		k.connector({
			from: [a4.cx, a4.y + a4.h],
			to: [kDown.x + kDown.w - 70, kDown.y],
			route: [
				[a4.cx, 366],
				[kDown.x + kDown.w - 70, 366],
			],
			type: 'xnode',
			label: 'publishPersistentMsg',
			labelSide: 'right',
		})
	);

	P.push(k.groupBox({ x: 40, y: 540, w: 1360, h: 200, label: 'NODE B', kind: 'core' }));
	P.push(groupNote(k, 1400, 540, 'the device is connected here — never re-stores to Redis'));
	const b1 = rectC(75, 592, 380, 110);
	const b2 = rectC(495, 592, 380, 110);
	const b3 = rectC(915, 592, 450, 110);
	P.push(k.card({ ...b1, kind: 'core', icon: 'dispatch', title: 'PersistentDownLinkConsumer', titleSize: 13 }));
	P.push(
		k.card({
			...b2,
			kind: 'core',
			icon: 'actor',
			title: 'Persisted-DEVICE actor',
			sub: 'tracks in-flight packet ids',
			titleSize: 13.5,
		})
	);
	P.push(
		k.card({
			...b3,
			kind: 'client',
			icon: 'device',
			title: 'Device — persistent DEVICE',
			sub: 'MqttMsgDeliveryService',
			titleSize: 13.5,
		})
	);
	P.push(k.connector({ from: right(b1), to: left(b2), type: 'flow' }));
	P.push(k.connector({ from: right(b2), to: left(b3), type: 'flow', label: 'deliver', labelSide: 'above' }));
	P.push(
		k.connector({
			from: [kDown.x + 90, kDown.y + kDown.h],
			to: [b1.cx, b1.y],
			route: [
				[kDown.x + 90, 510],
				[b1.cx, 510],
			],
			type: 'xnode',
			label: 'consume',
			labelSide: 'left',
		})
	);

	P.push(
		cap(
			k,
			W,
			764,
			'Store-then-forward: node A persists to Redis, then routes delivery to node B using the connected session’s serviceId. Node B only delivers.'
		)
	);
	P.push(
		k.legend(60, 798, [
			{ type: 'flow', label: 'in-node flow' },
			{ type: 'xnode', label: 'cross-node Kafka hop' },
		])
	);
	return k.frame(W, H, P);
}

// =============================================================================
// A10 — Persistent APPLICATION, single node
// =============================================================================
export function appSingle(k) {
	const W = 1200,
		H = 830;
	const P = [];
	const x = 330,
		w = 420;
	const pub = rectC(x, 40, w, 72);
	const kAll = rectC(x, 150, w, 80);
	const cons = rectC(x, 268, w, 84);
	const kApp = rectC(x, 390, w, 88);
	const appCons = rectC(x, 516, w, 92);
	const client = rectC(x, 646, w, 84);

	P.push(k.connector({ from: bottom(pub), to: top(kAll), type: 'flow', label: 'PUBLISH', labelSide: 'right' }));
	P.push(k.connector({ from: bottom(kAll), to: top(cons), type: 'flow', label: 'consume', labelSide: 'right' }));
	P.push(
		k.connector({
			from: bottom(cons),
			to: top(kApp),
			type: 'flow',
			label: 'ApplicationMsgQueuePublisher',
			labelSide: 'right',
		})
	);
	P.push(
		k.connector({ from: bottom(kApp), to: top(appCons), type: 'flow', label: 'dedicated consumer', labelSide: 'right' })
	);
	P.push(k.connector({ from: bottom(appCons), to: top(client), type: 'flow', label: 'deliver', labelSide: 'right' }));
	P.push(
		k.connector({
			from: [client.x + 60, client.y],
			to: [appCons.x + 60, appCons.y + appCons.h],
			type: 'ack',
			label: 'ack ⇒ commit offset',
			labelSide: 'left',
		})
	);

	P.push(stub(k, kAll.x + kAll.w, kAll.cy, 960, kAll.cy, 'ack'));
	P.push(stub(k, 960, kAll.cy, 960, pub.cy, 'ack'));
	P.push(
		k.connector({ from: [960, pub.cy], to: [pub.x + pub.w, pub.cy], type: 'ack', label: 'PUBACK', labelSide: 'above' })
	);

	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Device', sub: 'publisher' }));
	P.push(k.kafkaTopic({ ...kAll, name: 'tbmq.msg.all', note: 'durability gate' }));
	P.push(k.card({ ...cons, kind: 'core', icon: 'trie', title: 'Trie → persistent APPLICATION', titleSize: 13.5 }));
	P.push(k.kafkaTopic({ ...kApp, name: 'tbmq.msg.app.$CLIENT_ID', note: 'dedicated topic · written to partition 0' }));
	P.push(
		k.card({
			...appCons,
			kind: 'kafka',
			icon: 'dispatch',
			title: 'ApplicationPersistenceProcessor',
			sub: 'one consumer for this client',
			titleSize: 13,
		})
	);
	P.push(k.card({ ...client, kind: 'client', icon: 'app', title: 'APPLICATION client', sub: 'persistent session' }));

	noteBox(
		k,
		P,
		40,
		470,
		250,
		'The topic is the inbox',
		['no per-message delete', 'ack = Kafka offset commit', 'offline ⇒ messages wait', 'in the topic until connect'],
		'kafka'
	);

	P.push(
		cap(
			k,
			W,
			782,
			'Each APPLICATION client owns a Kafka topic, so its backlog is a durable, replayable log rather than a queue the broker has to manage.'
		)
	);
	return k.frame(W, H, P);
}

// =============================================================================
// A11 — Persistent APPLICATION, cluster (no internode hop)
// =============================================================================
export function appCluster(k) {
	const W = 1360,
		H = 750;
	const P = [];

	P.push(
		k.groupBox({ x: 40, y: 40, w: 560, h: 170, label: 'any node — consumed tbmq.msg.all', kind: 'core', dash: '5 5' })
	);
	const anyNode = rectC(80, 86, 480, 96);
	P.push(
		k.card({
			...anyNode,
			kind: 'core',
			icon: 'trie',
			title: 'Trie → APPLICATION subscriber',
			sub: 'ApplicationMsgQueuePublisher',
			titleSize: 13.5,
		})
	);

	const kApp = rectC(700, 74, 600, 108);
	P.push(
		k.kafkaTopic({ ...kApp, name: 'tbmq.msg.app.$CLIENT_ID', note: 'dedicated topic — reachable from every node' })
	);
	P.push(k.connector({ from: right(anyNode), to: left(kApp), type: 'flow', label: 'produce', labelSide: 'above' }));

	P.push(k.groupBox({ x: 300, y: 300, w: 1000, h: 270, label: 'NODE', kind: 'core' }));
	P.push(groupNote(k, 1300, 300, 'the node where the APPLICATION client is connected'));
	const proc = rectC(350, 368, 420, 150);
	const cli = rectC(840, 368, 410, 150);
	P.push(
		k.card({
			...proc,
			kind: 'kafka',
			icon: 'dispatch',
			title: 'ApplicationPersistenceProcessor',
			sub: 'dedicated consumer · reads locally',
			titleSize: 13,
		})
	);
	P.push(k.card({ ...cli, kind: 'client', icon: 'app', title: 'APPLICATION client', sub: 'persistent session' }));
	P.push(k.connector({ from: right(proc), to: left(cli), type: 'flow', label: 'deliver', labelSide: 'above' }));
	P.push(
		k.connector({
			from: [cli.cx, cli.y + cli.h],
			to: [proc.cx, proc.y + proc.h],
			route: [
				[cli.cx, 545],
				[proc.cx, 545],
			],
			type: 'ack',
			label: 'commit offset',
			labelSide: 'below',
		})
	);
	P.push(
		k.connector({
			from: [kApp.cx, kApp.y + kApp.h],
			to: [proc.cx, proc.y],
			route: [
				[kApp.cx, 250],
				[proc.cx, 250],
			],
			type: 'flow',
			label: 'consume (local)',
			labelSide: 'left',
		})
	);

	noteBox(
		k,
		P,
		40,
		340,
		220,
		'Consumer lifecycle',
		['CONNECT  → start', 'DISCONNECT → stop', 'not connected ⇒ no', 'consumer; msgs accrue'],
		'ie'
	);

	P.push(
		cap(
			k,
			W,
			606,
			'No DownLinkProxy and no downlink topic on the APPLICATION path — the consumer is created on the node the client connects to, so the read is always local.'
		)
	);
	P.push(
		cap(
			k,
			W,
			634,
			'Cluster and standalone behave identically for APPLICATION clients: there is nothing to forward between nodes.',
			{ size: 12 }
		)
	);
	P.push(
		k.legend(60, 668, [
			{ type: 'flow', label: 'message flow' },
			{ type: 'ack', label: 'offset commit (ack)' },
		])
	);
	return k.frame(W, H, P);
}

// =============================================================================
// A13 — Actor system
// =============================================================================
export function actorSystem(k) {
	const W = 1300,
		H = 700;
	const P = [];
	P.push(
		k.groupBox({
			x: 40,
			y: 56,
			w: 1220,
			h: 500,
			label: 'DefaultTbActorSystem — ActorType { CLIENT, PERSISTED_DEVICE }',
			kind: 'core',
		})
	);

	const mailbox = (x, y, n, kind) => {
		const kk = k.T.kinds[kind];
		let s = '';
		for (let i = 0; i < n; i++) {
			s += `<rect x="${x + i * 26}" y="${y}" width="22" height="22" rx="4" fill="${i < 2 ? kk.fill : k.T.canvas}" stroke="${kk.stroke}" stroke-width="1.2"/>`;
		}
		s += k.text(x, y + 38, 'mailbox — one thread at a time (CAS)', { size: 10.5, weight: 600, fill: k.T.inkMuted });
		return s;
	};

	const ca = rectC(90, 120, 330, 120);
	P.push(k.card({ ...ca, kind: 'core', icon: 'actor', title: 'Client actor', sub: 'one per connected client' }));
	P.push(mailbox(100, 254, 6, 'core'));
	const cHandles = rectC(500, 108, 470, 150);
	noteBox(
		k,
		P,
		cHandles.x,
		cHandles.y,
		cHandles.w,
		'Handles',
		[
			'CONNECT / DISCONNECT · keep-alive',
			'SUBSCRIBE / UNSUBSCRIBE',
			'PUBLISH · PUBACK / PUBREC / PUBREL / PUBCOMP',
			'channel writability (backpressure)',
		],
		'core'
	);
	const cDisp = rectC(1020, 130, 200, 100);
	P.push(k.card({ ...cDisp, kind: 'transport', title: 'client-dispatcher', sub: 'pool size 8', titleSize: 13 }));
	P.push(k.connector({ from: right(ca), to: [cHandles.x, ca.cy], type: 'flow' }));
	P.push(k.connector({ from: [cHandles.x + cHandles.w, cDisp.cy], to: left(cDisp), type: 'ack' }));

	const da = rectC(90, 350, 330, 120);
	P.push(
		k.card({
			...da,
			kind: 'redis',
			icon: 'device',
			title: 'Persisted-DEVICE actor',
			sub: 'one per persistent DEVICE',
			titleSize: 14,
		})
	);
	P.push(mailbox(100, 484, 6, 'redis'));
	const dHandles = rectC(500, 338, 470, 150);
	noteBox(
		k,
		P,
		dHandles.x,
		dHandles.y,
		dHandles.w,
		'Handles',
		[
			'retrieve & deliver offline messages',
			'track in-flight packet ids',
			'update / remove in Redis on ack',
			'shared-subscription retrieval',
		],
		'redis'
	);
	const dDisp = rectC(1020, 360, 200, 100);
	P.push(
		k.card({ ...dDisp, kind: 'transport', title: 'persisted-device-', sub: 'dispatcher · pool 8', titleSize: 12.5 })
	);
	P.push(k.connector({ from: right(da), to: [dHandles.x, da.cy], type: 'flow' }));
	P.push(k.connector({ from: [dHandles.x + dHandles.w, dDisp.cy], to: left(dDisp), type: 'ack' }));

	P.push(
		k.connector({
			from: [ca.x + ca.w - 60, ca.y + ca.h],
			to: [da.x + da.w - 60, da.y],
			type: 'flow',
			label: 'persistent DEVICE only',
			labelSide: 'right',
		})
	);

	P.push(
		cap(
			k,
			W,
			594,
			'Sibling root actors on two dispatcher pools. A CAS-guarded mailbox admits at most one thread per actor — per-client ordering and isolation with no locks on the hot path.'
		)
	);
	P.push(
		cap(
			k,
			W,
			622,
			'A persistent DEVICE client therefore has two actors: the Client actor for protocol, the Persisted-DEVICE actor for its stored messages.',
			{ size: 12 }
		)
	);
	return k.frame(W, H, P);
}

// =============================================================================
// A14 — Subscription Trie walkthrough
// =============================================================================
export function subscriptionTrie(k) {
	const W = 1320,
		H = 740;
	const P = [];
	const M = k.T.kinds.core;

	function tnode(x, y, label, { matched = false, w = 130 } = {}) {
		const h = 46;
		const r = rectC(x - w / 2, y, w, h);
		const stroke = matched ? M.stroke : k.T.neutralStroke;
		const fill = matched ? M.fill : k.T.neutralFill;
		const ink = matched ? M.ink : k.T.inkMuted;
		P.push(
			`<rect x="${r.x}" y="${r.y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="${matched ? 2.1 : 1.4}" ${matched ? '' : 'stroke-dasharray="5 4"'}/>`
		);
		P.push(k.text(r.cx, r.cy, label, { anchor: 'middle', size: 13, weight: 650, mono: true, fill: ink }));
		return r;
	}
	const edge = (a, b, matched) =>
		P.push(
			`<path d="M ${a.cx} ${a.y + a.h} L ${b.cx} ${b.y}" stroke="${matched ? M.stroke : k.T.neutralStroke}" stroke-width="${matched ? 2.2 : 1.4}" ${matched ? '' : 'stroke-dasharray="5 4"'}/>`
		);

	const root = tnode(750, 108, 'root', { matched: true, w: 100 });
	const sensors = tnode(750, 212, 'sensors', { matched: true });
	const plus = tnode(480, 330, '+', { matched: true, w: 96 });
	const room1 = tnode(670, 330, 'room1', { matched: true });
	const room2 = tnode(880, 330, 'room2', { matched: false });
	const hash = tnode(1080, 330, '#', { matched: true, w: 96 });
	const tA = tnode(480, 452, 'temperature', { matched: true, w: 160 });
	const tC = tnode(670, 452, 'temperature', { matched: true, w: 160 });
	const tD = tnode(880, 452, 'temperature', { matched: false, w: 160 });

	edge(root, sensors, true);
	edge(sensors, plus, true);
	edge(sensors, room1, true);
	edge(sensors, room2, false);
	edge(sensors, hash, true);
	edge(plus, tA, true);
	edge(room1, tC, true);
	edge(room2, tD, false);

	P.push(k.text(880, 528, '✗ pruned — never visited', { anchor: 'middle', size: 11, weight: 600, fill: k.T.inkMuted }));
	P.push(k.text(1080, 392, '✔ sub B', { anchor: 'middle', size: 11, weight: 700, fill: M.ink }));
	P.push(k.text(480, 528, '✔ sub A', { anchor: 'middle', size: 11, weight: 700, fill: M.ink }));
	P.push(k.text(670, 528, '✔ sub C', { anchor: 'middle', size: 11, weight: 700, fill: M.ink }));

	P.push(
		`<rect x="60" y="88" width="330" height="78" rx="12" fill="${k.T.kinds.kafka.fill}" stroke="${k.T.kinds.kafka.stroke}" stroke-width="1.6"/>`
	);
	P.push(k.text(225, 112, 'PUBLISH', { anchor: 'middle', size: 12, weight: 700, fill: k.T.kinds.kafka.ink }));
	P.push(
		k.text(225, 138, 'sensors/room1/temperature', {
			anchor: 'middle',
			size: 13,
			weight: 650,
			mono: true,
			fill: k.T.kinds.kafka.ink,
		})
	);

	noteBox(
		k,
		P,
		60,
		210,
		330,
		'Matched subscriptions',
		[
			{ t: 'A  sensors/+/temperature', mono: true },
			{ t: 'B  sensors/#', mono: true },
			{ t: 'C  sensors/room1/temperature', mono: true },
		],
		'core'
	);
	noteBox(
		k,
		P,
		60,
		380,
		330,
		'Traversal rule',
		['at each level follow: exact, "+", "#"', 'everything else is pruned', 'cost ∝ topic depth, not #subs'],
		'transport'
	);

	P.push(cap(k, W, 620, 'One PUBLISH matches three filters at once; the sensors/room2 branch is never walked.'));
	P.push(
		cap(
			k,
			W,
			648,
			'Subscriptions are consumed from tbmq.client.subscriptions into the in-memory ConcurrentMapSubscriptionTrie on every node.',
			{ size: 12 }
		)
	);
	return k.frame(W, H, P);
}

// =============================================================================
// A15 — Standalone vs cluster
// =============================================================================
export function standaloneVsCluster(k) {
	const W = 1360,
		H = 700;
	const P = [];

	const sp = rectC(40, 60, 540, 540);
	P.push(k.groupBox({ ...sp, label: 'Standalone', kind: 'client' }));
	const sClients = rectC(210, 96, 200, 74);
	const sNode = rectC(180, 230, 260, 96);
	const sKafka = rectC(70, 400, 150, 88);
	const sRedis = rectC(235, 400, 150, 88);
	const sPg = rectC(400, 400, 150, 88);
	P.push(k.connector({ from: bottom(sClients), to: top(sNode), type: 'flow', label: 'MQTT' }));
	P.push(
		k.connector({
			from: [sNode.cx - 70, sNode.y + sNode.h],
			to: top(sKafka),
			route: [
				[sNode.cx - 70, 366],
				[sKafka.cx, 366],
			],
			type: 'flow',
		})
	);
	P.push(k.connector({ from: bottom(sNode), to: top(sRedis), type: 'flow' }));
	P.push(
		k.connector({
			from: [sNode.cx + 70, sNode.y + sNode.h],
			to: top(sPg),
			route: [
				[sNode.cx + 70, 366],
				[sPg.cx, 366],
			],
			type: 'flow',
		})
	);
	P.push(k.card({ ...sClients, kind: 'client', icon: 'clients', title: 'MQTT clients' }));
	P.push(k.card({ ...sNode, kind: 'core', icon: 'actor', title: 'TBMQ node' }));
	P.push(k.card({ ...sKafka, kind: 'kafka', icon: 'kafka', title: 'Kafka' }));
	P.push(k.card({ ...sRedis, kind: 'redis', icon: 'redis', title: 'Redis' }));
	P.push(k.card({ ...sPg, kind: 'pg', icon: 'pg', title: 'Postgres' }));
	P.push(k.caption(sp.cx, 528, 'One node terminates every connection'));
	P.push(k.caption(sp.cx, 552, 'and runs every consumer.'));

	const cp = rectC(620, 60, 700, 540);
	P.push(k.groupBox({ ...cp, label: 'Cluster — identical nodes, no master', kind: 'core' }));
	const lb = rectC(800, 96, 340, 66);
	const n1 = rectC(660, 226, 180, 88);
	const n2 = rectC(880, 226, 180, 88);
	const n3 = rectC(1100, 226, 180, 88);
	// Each store shares its centre with the node column above it, so the drop off
	// the rail continues that node's own vertical instead of jogging sideways.
	const storeCol = (cx, w) => rectC(cx - w / 2, 420, w, 88);
	const cKafka = storeCol(n1.cx, 200);
	const cRedis = storeCol(n2.cx, 180);
	const cPg = storeCol(n3.cx, 180);
	P.push(
		k.connector({
			from: bottom(lb),
			to: top(n1),
			route: [
				[lb.cx, 196],
				[n1.cx, 196],
			],
			type: 'flow',
		})
	);
	P.push(k.connector({ from: bottom(lb), to: top(n2), type: 'flow' }));
	P.push(
		k.connector({
			from: bottom(lb),
			to: top(n3),
			route: [
				[lb.cx, 196],
				[n3.cx, 196],
			],
			type: 'flow',
		})
	);
	// Every node uses ALL THREE shared services, so the nodes drop onto one
	// shared rail that then feeds Kafka, Redis and Postgres. Three separate 1:1
	// arrows would wrongly imply node 1 → Kafka, node 2 → Redis, node N → Postgres.
	const RAIL = 386;
	for (const n of [n1, n2, n3]) P.push(stub(k, n.cx, n.y + n.h, n.cx, RAIL));
	// the rail spans the outermost columns, so every drop lands ON it
	P.push(stub(k, n1.cx, RAIL, n3.cx, RAIL));
	for (const store of [cKafka, cRedis, cPg]) {
		P.push(k.connector({ from: [store.cx, RAIL], to: top(store), type: 'flow' }));
	}
	// mask the descending node lines behind the annotation
	P.push(`<rect x="${cp.cx - 182}" y="322" width="364" height="48" fill="${k.T.canvas}"/>`);
	P.push(
		k.text(cp.cx, 336, 'state rehydrated from compacted topics:', {
			anchor: 'middle',
			size: 11.5,
			weight: 600,
			fill: k.T.inkMuted,
		})
	);
	P.push(
		k.text(cp.cx, 354, 'tbmq.client.session · tbmq.client.subscriptions', {
			anchor: 'middle',
			size: 11.5,
			weight: 600,
			mono: true,
			fill: k.T.kinds.kafka.ink,
		})
	);
	P.push(k.card({ ...lb, kind: 'transport', icon: 'lb', title: 'Load balancer' }));
	P.push(k.card({ ...n1, kind: 'core', icon: 'actor', title: 'node 1' }));
	P.push(k.card({ ...n2, kind: 'core', icon: 'actor', title: 'node 2' }));
	P.push(k.card({ ...n3, kind: 'core', icon: 'actor', title: 'node N' }));
	P.push(k.card({ ...cKafka, kind: 'kafka', icon: 'kafka', title: 'Kafka', sub: 'shared' }));
	P.push(k.card({ ...cRedis, kind: 'redis', icon: 'redis', title: 'Redis', sub: 'shared' }));
	P.push(k.card({ ...cPg, kind: 'pg', icon: 'pg', title: 'Postgres', sub: 'shared' }));
	P.push(k.caption(cp.cx, 528, 'Reconnect to any node · a new node rehydrates from Kafka'));
	P.push(k.caption(cp.cx, 552, 'and joins the consumer groups.'));

	P.push(
		cap(
			k,
			W,
			646,
			'Same components in both modes — clustering adds a load balancer and more identical nodes over the same Kafka / Redis / PostgreSQL.'
		)
	);
	return k.frame(W, H, P);
}

// =============================================================================
// A16 — Integration Executor
// =============================================================================
export function integrationExecutor(k) {
	const W = 1340,
		H = 640;
	const P = [];
	const broker = rectC(50, 96, 230, 356);
	const ie = rectC(760, 170, 260, 200);
	const http = rectC(1090, 90, 200, 90);
	const mqtt = rectC(1090, 216, 200, 90);
	const kext = rectC(1090, 342, 200, 90);

	const t1 = rectC(330, 96, 380, 62);
	const t2 = rectC(330, 186, 380, 62);
	const t3 = rectC(330, 300, 380, 62);
	const t4 = rectC(330, 390, 380, 62);

	P.push(k.connector({ from: [broker.x + broker.w, 127], to: left(t1), type: 'flow' }));
	P.push(k.connector({ from: right(t1), to: [ie.x, 210], type: 'flow' }));
	P.push(k.connector({ from: [broker.x + broker.w, 217], to: left(t2), type: 'flow' }));
	P.push(k.connector({ from: right(t2), to: [ie.x, 240], type: 'flow' }));
	P.push(k.connector({ from: [ie.x, 300], to: right(t3), type: 'ack' }));
	P.push(k.connector({ from: left(t3), to: [broker.x + broker.w, 300], type: 'ack' }));
	P.push(k.connector({ from: [ie.x, 330], to: right(t4), type: 'ack' }));
	P.push(k.connector({ from: left(t4), to: [broker.x + broker.w, 330], type: 'ack' }));

	P.push(k.connector({ from: [ie.x + ie.w, 210], to: left(http), type: 'flow', label: 'push', labelSide: 'above' }));
	P.push(k.connector({ from: right(ie), to: left(mqtt), type: 'flow' }));
	P.push(k.connector({ from: [ie.x + ie.w, 330], to: left(kext), type: 'flow' }));

	// scaling hint
	P.push(
		`<rect x="${ie.x + 14}" y="${ie.y - 14}" width="${ie.w}" height="${ie.h}" rx="14" fill="none" stroke="${k.T.kinds.ie.stroke}" stroke-width="1.2" opacity="0.45"/>`
	);

	P.push(k.card({ ...broker, kind: 'core', icon: 'actor', title: 'TBMQ broker', sub: 'cluster' }));
	P.push(k.kafkaTopic({ ...t1, name: 'tbmq.msg.ie', note: 'integration data' }));
	P.push(k.kafkaTopic({ ...t2, name: 'tbmq.ie.downlink.{http,kafka,mqtt}', note: 'config / validation' }));
	P.push(k.kafkaTopic({ ...t3, name: 'tbmq.ie.uplink', note: 'results → broker' }));
	P.push(k.kafkaTopic({ ...t4, name: 'tbmq.ie.event', note: 'lifecycle events' }));
	P.push(
		k.card({
			...ie,
			kind: 'ie',
			icon: 'ie',
			title: 'Integration Executor',
			sub: 'separate microservice · own JVM',
			topic: ':8082 · scales independently',
		})
	);
	P.push(k.card({ ...http, kind: 'transport', icon: 'webui', title: 'HTTP', sub: 'endpoint' }));
	P.push(k.card({ ...mqtt, kind: 'transport', icon: 'netty', title: 'MQTT', sub: 'external broker' }));
	P.push(k.card({ ...kext, kind: 'transport', icon: 'kafka', title: 'Kafka', sub: 'external cluster' }));

	P.push(
		cap(
			k,
			W,
			500,
			'Integrations never run inside the broker: everything crosses Kafka, so a slow or failing endpoint cannot back-pressure MQTT traffic.'
		)
	);
	P.push(
		cap(
			k,
			W,
			528,
			'Integration types in CE: HTTP · MQTT · KAFKA. Throughput scales by running more executor instances.',
			{ size: 12 }
		)
	);
	P.push(
		k.legend(60, 570, [
			{ type: 'flow', label: 'broker → executor → external' },
			{ type: 'ack', label: 'uplink (results / lifecycle)' },
		])
	);
	return k.frame(W, H, P);
}
