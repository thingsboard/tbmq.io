/**
 * The six message-flow diagrams (redraws of the original PNGs), at higher
 * fidelity: exact Kafka topic names on the arrows, the ack shown as a distinct
 * dashed edge, consumer-group vs dedicated-consumer paths distinguished, and
 * node boundaries marked in the cluster variants.
 *
 * Convention (matches the original diagrams): publishers/subscribers at the
 * bottom, the TBMQ node(s) in the middle band, Kafka/Redis at the top,
 * numbered step badges on the arrows, one caption line summarising the point.
 */
import { rectC, top, bottom } from './kit.mjs';

const cap = (k, W, y, str) => k.caption(W / 2, y, str);
const legendFlow = (k, x, y, xnode = false) =>
	k.legend(x, y, [
		{ type: 'flow', label: 'message flow' },
		{ type: 'ack', label: 'ack (after Kafka persist)' },
		...(xnode ? [{ type: 'xnode', label: 'cross-node forwarding' }] : []),
	]);

// --- 2. Non-persistent DEVICE — single node --------------------------------
export function nonPersistentDev(k) {
	const W = 820,
		H = 600;
	const P = [];
	// Vertical spine — publisher on top, subscriber at the bottom — with the
	// Kafka topic set off to the right of the node it round-trips through.
	const pub = rectC(100, 40, 200, 92);
	const node = rectC(100, 230, 200, 96);
	const sub = rectC(90, 424, 220, 92);
	const kafka = rectC(470, 232, 280, 92); // vertically centred on the node

	// 1 publish / 4 ack — parallel verticals in the publisher ↔ node gap
	P.push(
		k.connector({
			from: [node.cx - 30, pub.y + pub.h],
			to: [node.cx - 30, node.y],
			type: 'flow',
			badge: 1,
			label: 'PUBLISH',
			labelSide: 'left',
			badgeShift: [0, -30],
		})
	);
	P.push(k.connector({ from: [node.cx + 30, node.y], to: [node.cx + 30, pub.y + pub.h], type: 'ack', badge: 4 }));

	// 2 produce / 3 consume — parallel horizontals out to the topic and back
	P.push(
		k.connector({
			from: [node.x + node.w, node.cy - 16],
			to: [kafka.x, node.cy - 16],
			type: 'flow',
			badge: 2,
			label: 'produce',
			labelSide: 'above',
			badgeShift: [-70, 0],
		})
	);
	P.push(
		k.connector({
			from: [kafka.x, node.cy + 16],
			to: [node.x + node.w, node.cy + 16],
			type: 'flow',
			badge: 3,
			label: 'consume',
			labelSide: 'below',
			badgeShift: [70, 0],
		})
	);

	// 5 deliver — straight down the spine to the subscriber
	P.push(
		k.connector({
			from: bottom(node),
			to: top(sub),
			type: 'flow',
			badge: 5,
			label: 'deliver',
			labelSide: 'right',
			badgeShift: [0, -30],
		})
	);

	P.push(k.kafkaTopic({ ...kafka, name: 'tbmq.msg.all', note: 'every PUBLISH lands here first' }));
	P.push(k.card({ ...node, kind: 'core', icon: 'actor', title: 'TBMQ node' }));
	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Publisher' }));
	P.push(k.card({ ...sub, kind: 'client', icon: 'device', title: 'Subscriber', sub: 'non-persistent DEVICE' }));

	P.push(
		cap(
			k,
			W,
			552,
			'Non-persistent subscriber: the message is delivered while it stays connected — nothing is queued for the client.'
		)
	);
	P.push(legendFlow(k, 40, 578));
	return k.frame(W, H, P);
}

// --- 3. Non-persistent DEVICE — cluster ------------------------------------
export function nonPersistDevCluster(k) {
	const W = 1140,
		H = 650;
	const P = [];
	const kAll = rectC(150, 44, 300, 96);
	const kDown = rectC(590, 44, 440, 96);
	// 16px inset above and below the node cards — the old 258/150 box put its
	// bottom border straight through the PUBLISH and deliver label chips.
	const cluster = rectC(120, 276, 900, 116);
	const nodeA = rectC(180, 292, 300, 84);
	const nodeB = rectC(720, 292, 300, 84);
	const pub = rectC(210, 500, 240, 92);
	const sub = rectC(720, 500, 300, 92);

	// 1 publish / 4 ack — parallel verticals in the publisher gap. Clustering
	// does not change the acknowledgement: the publisher is still acked once
	// Kafka has persisted, exactly as in the single-node flow.
	P.push(
		k.connector({
			from: [nodeA.cx - 30, pub.y],
			to: [nodeA.cx - 30, nodeA.y + nodeA.h],
			type: 'flow',
			badge: 1,
			label: 'PUBLISH',
			labelSide: 'above',
			badgeShift: [0, 20],
		})
	);
	P.push(
		k.connector({
			from: [nodeA.cx + 30, nodeA.y + nodeA.h],
			to: [nodeA.cx + 30, pub.y],
			type: 'ack',
			badge: 4,
		})
	);
	// 2 / 3 / 6 are all plain verticals on the same band, so the three topic
	// hops read as parallel; only the cross-node hop (5) bends, exactly once.
	P.push(
		k.connector({
			from: [nodeA.cx - 45, nodeA.y],
			to: [nodeA.cx - 45, kAll.y + kAll.h],
			type: 'flow',
			badge: 2,
			label: 'produce',
			labelSide: 'above',
			badgeShift: [0, 22],
		})
	);
	P.push(
		k.connector({
			from: [nodeA.cx + 45, kAll.y + kAll.h],
			to: [nodeA.cx + 45, nodeA.y],
			type: 'flow',
			badge: 3,
			label: 'consume',
			labelSide: 'above',
			badgeShift: [0, 22],
		})
	);
	// One bend (step 5): right out of node A, then straight up into the downlink topic.
	// The horizontal sits 22px below node A's top edge so it clears the "···".
	P.push(
		k.connector({
			from: [nodeA.x + nodeA.w, nodeA.y + 22],
			to: [kDown.x + 40, kDown.y + kDown.h],
			route: [[kDown.x + 40, nodeA.y + 22]],
			type: 'xnode',
			badge: 5, // badge lands on the elbow (no label to offset it against)
		})
	);
	P.push(
		k.connector({
			from: [kDown.cx + 60, kDown.y + kDown.h],
			to: top(nodeB),
			type: 'xnode',
			badge: 6,
			label: 'route to owner node',
			labelSide: 'above',
			badgeShift: [0, 22],
		})
	);
	P.push(
		k.connector({
			from: bottom(nodeB),
			to: [sub.cx, sub.y],
			type: 'flow',
			badge: 7,
			label: 'deliver',
			labelSide: 'above',
			badgeShift: [0, 20],
		})
	);

	P.push(k.kafkaTopic({ ...kAll, name: 'tbmq.msg.all', note: 'shared consumer group across nodes' }));
	P.push(k.kafkaTopic({ ...kDown, name: 'tbmq.msg.downlink.basic.$SERVICE_ID', note: 'per-node routing topic' }));
	P.push(k.groupBox({ ...cluster, label: 'TBMQ cluster', kind: 'core' }));
	// centred in the node gap, low enough to sit under the cross-node hop
	P.push(k.text(600, 350, '···', { anchor: 'middle', size: 26, weight: 700, fill: k.T.inkMuted }));
	P.push(k.card({ ...nodeA, kind: 'core', icon: 'actor', title: 'TBMQ node A' }));
	P.push(k.card({ ...nodeB, kind: 'core', icon: 'actor', title: 'TBMQ node B' }));
	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Publisher', sub: 'node A' }));
	P.push(k.card({ ...sub, kind: 'client', icon: 'device', title: 'Subscriber', sub: 'non-persistent → node B' }));

	P.push(
		cap(
			k,
			W,
			612,
			'A message may be consumed by any node; the owner node of the subscriber is reached via tbmq.msg.downlink.basic.$SERVICE_ID.'
		)
	);
	P.push(legendFlow(k, 40, 634, true));
	return k.frame(W, H, P);
}

// --- 4. Persistent DEVICE — single node ------------------------------------
export function persistentDev(k) {
	const W = 820,
		H = 650;
	const P = [];
	// Same spine as the non-persistent single-node flow: publisher on top,
	// subscriber at the bottom, storage off to the right. `tbmq.msg.all` is
	// deliberately NOT drawn here — the shared ingest hop is already covered by
	// the publish-lifecycle diagram, and repeating it made this one hard to read.
	const pub = rectC(100, 40, 200, 92);
	const node = rectC(100, 230, 200, 110);
	const sub = rectC(90, 450, 220, 92);
	const kPers = rectC(430, 214, 320, 92);
	const redis = rectC(430, 380, 260, 92);

	// 1 publish / 2 ack — parallel verticals. The ack fires once the (off-diagram)
	// ingest into tbmq.msg.all is persisted, so it precedes the queue hops below.
	P.push(
		k.connector({
			from: [node.cx - 30, pub.y + pub.h],
			to: [node.cx - 30, node.y],
			type: 'flow',
			badge: 1,
			label: 'PUBLISH',
			labelSide: 'left',
			badgeShift: [0, -30],
		})
	);
	P.push(k.connector({ from: [node.cx + 30, node.y], to: [node.cx + 30, pub.y + pub.h], type: 'ack', badge: 2 }));

	// 3 produce / 4 consume — parallel horizontals to the DEVICE queue topic
	P.push(
		k.connector({
			from: [node.x + node.w, 250],
			to: [kPers.x, 250],
			type: 'flow',
			badge: 3,
			label: 'produce',
			labelSide: 'above',
			badgeShift: [-46, 0],
		})
	);
	P.push(
		k.connector({
			from: [kPers.x, 286],
			to: [node.x + node.w, 286],
			type: 'flow',
			badge: 4,
			label: 'consume',
			labelSide: 'below',
			badgeShift: [46, 0],
		})
	);
	// 5 store — one bend, out of the node and down into Redis
	P.push(
		k.connector({
			from: [node.x + node.w, 330],
			to: [500, redis.y],
			route: [[500, 330]],
			type: 'flow',
			badge: 5,
			label: 'store',
			labelSide: 'right',
			badgeShift: [-90, 0],
		})
	);
	// 6 deliver — straight down the spine
	P.push(
		k.connector({
			from: bottom(node),
			to: top(sub),
			type: 'flow',
			badge: 6,
			label: 'deliver',
			labelSide: 'right',
			badgeShift: [0, -30],
		})
	);

	P.push(k.kafkaTopic({ ...kPers, name: 'tbmq.msg.persisted', note: 'messages for persistent DEVICE clients' }));
	P.push(k.card({ ...redis, kind: 'redis', icon: 'redis', title: 'Redis / Valkey', sub: 'sorted set per client' }));
	P.push(k.card({ ...node, kind: 'core', icon: 'actor', title: 'TBMQ node' }));
	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Publisher' }));
	P.push(k.card({ ...sub, kind: 'client', icon: 'device', title: 'Subscriber', sub: 'persistent DEVICE' }));

	P.push(
		cap(
			k,
			W,
			578,
			'Persistent DEVICE messages are stored in a Redis / Valkey sorted set per client and kept until delivery is acknowledged.'
		)
	);
	P.push(
		cap(k, W, 598, 'The shared ingest into tbmq.msg.all is omitted here — every PUBLISH still lands there first.')
	);
	P.push(legendFlow(k, 40, 624));
	return k.frame(W, H, P);
}

// --- 5. Persistent DEVICE — cluster ----------------------------------------
export function persistDevCluster(k) {
	const W = 1270,
		H = 720;
	const P = [];
	// `tbmq.msg.all` is omitted (see the publish lifecycle) — with it there were
	// four top-row blocks and eight diagonals crossing each other. Storage sits
	// on the top row, each node's own hops run as verticals beneath it, and only
	// the two hops that must cross the diagram bend, once each.
	const kPers = rectC(150, 44, 320, 92);
	const redis = rectC(530, 44, 200, 92);
	const kDown = rectC(770, 44, 450, 92);
	const cluster = rectC(110, 284, 1060, 132);
	const nodeA = rectC(150, 300, 320, 100);
	const nodeB = rectC(810, 300, 320, 100);
	const pub = rectC(190, 520, 240, 92);
	const sub = rectC(830, 520, 280, 92);

	// 1 publish / 2 ack — parallel verticals under node A
	P.push(
		k.connector({
			from: [nodeA.cx - 30, pub.y],
			to: [nodeA.cx - 30, nodeA.y + nodeA.h],
			type: 'flow',
			badge: 1,
			label: 'PUBLISH',
			labelSide: 'above',
			badgeShift: [0, 20],
		})
	);
	P.push(k.connector({ from: [nodeA.cx + 30, nodeA.y + nodeA.h], to: [nodeA.cx + 30, pub.y], type: 'ack', badge: 2 }));

	// 3 produce / 4 consume — parallel verticals into the DEVICE queue topic
	P.push(
		k.connector({
			from: [nodeA.cx - 40, nodeA.y],
			to: [nodeA.cx - 40, kPers.y + kPers.h],
			type: 'flow',
			badge: 3,
			label: 'produce',
			labelSide: 'above',
			badgeShift: [0, 22],
		})
	);
	P.push(
		k.connector({
			from: [nodeA.cx + 40, kPers.y + kPers.h],
			to: [nodeA.cx + 40, nodeA.y],
			type: 'flow',
			badge: 4,
			label: 'consume',
			labelSide: 'above',
			badgeShift: [0, 22],
		})
	);

	// 5 store — one bend, right out of node A then up into Redis
	P.push(
		k.connector({
			from: [nodeA.x + nodeA.w, 320],
			to: [redis.cx + 10, redis.y + redis.h],
			route: [[redis.cx + 10, 320]],
			type: 'flow',
			badge: 5,
			label: 'store',
			labelSide: 'right',
			badgeShift: [-90, 0],
		})
	);
	// 6 forward — one bend, stopping short of node B before turning up
	P.push(
		k.connector({
			from: [nodeA.x + nodeA.w, 380],
			to: [790, kDown.y + kDown.h],
			route: [[790, 380]],
			type: 'xnode',
			badge: 6, // badge lands on the elbow (no label to offset it against)
		})
	);
	// 7 route / 8 deliver — verticals down node B's own column
	P.push(
		k.connector({
			from: [nodeB.cx, kDown.y + kDown.h],
			to: top(nodeB),
			type: 'xnode',
			badge: 7,
			label: 'route to owner node',
			labelSide: 'above',
			badgeShift: [0, 22],
		})
	);
	P.push(
		k.connector({
			from: bottom(nodeB),
			to: [sub.cx, sub.y],
			type: 'flow',
			badge: 8,
			label: 'deliver',
			labelSide: 'above',
			badgeShift: [0, 20],
		})
	);

	P.push(k.kafkaTopic({ ...kPers, name: 'tbmq.msg.persisted', note: 'messages for persistent DEVICE clients' }));
	P.push(k.card({ ...redis, kind: 'redis', icon: 'redis', title: 'Redis / Valkey', sub: 'sorted set per client' }));
	P.push(k.kafkaTopic({ ...kDown, name: 'tbmq.msg.downlink.persisted.$SERVICE_ID', note: 'per-node routing topic' }));
	P.push(k.groupBox({ ...cluster, label: 'TBMQ cluster', kind: 'core' }));
	P.push(k.text(640, 350, '···', { anchor: 'middle', size: 26, weight: 700, fill: k.T.inkMuted }));
	P.push(k.card({ ...nodeA, kind: 'core', icon: 'actor', title: 'TBMQ node A' }));
	P.push(k.card({ ...nodeB, kind: 'core', icon: 'actor', title: 'TBMQ node B' }));
	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Publisher', sub: 'node A' }));
	P.push(k.card({ ...sub, kind: 'client', icon: 'device', title: 'Subscriber', sub: 'persistent DEVICE → node B' }));

	P.push(
		cap(
			k,
			W,
			648,
			'tbmq.msg.downlink.persisted.$SERVICE_ID forwards the persisted message to the node that owns the subscriber connection.'
		)
	);
	P.push(
		cap(k, W, 668, 'The shared ingest into tbmq.msg.all is omitted here — every PUBLISH still lands there first.')
	);
	P.push(legendFlow(k, 40, 694, true));
	return k.frame(W, H, P);
}

// --- 6. Persistent APPLICATION — single node -------------------------------
export function app(k) {
	const W = 840,
		H = 620;
	const P = [];
	// Same spine as the other single-node flows; `tbmq.msg.all` omitted (see the
	// publish lifecycle). APPLICATION clients need no Redis — the client's own
	// topic IS the queue, so there is a single block on the right.
	const pub = rectC(100, 40, 200, 92);
	const node = rectC(100, 230, 200, 96);
	const sub = rectC(85, 424, 230, 92);
	const kApp = rectC(430, 232, 360, 92); // vertically centred on the node

	// 1 publish / 2 ack — parallel verticals in the publisher gap
	P.push(
		k.connector({
			from: [node.cx - 30, pub.y + pub.h],
			to: [node.cx - 30, node.y],
			type: 'flow',
			badge: 1,
			label: 'PUBLISH',
			labelSide: 'left',
			badgeShift: [0, -30],
		})
	);
	P.push(k.connector({ from: [node.cx + 30, node.y], to: [node.cx + 30, pub.y + pub.h], type: 'ack', badge: 2 }));

	// 3 produce / 4 consume — parallel horizontals to the client's own topic
	P.push(
		k.connector({
			from: [node.x + node.w, node.cy - 16],
			to: [kApp.x, node.cy - 16],
			type: 'flow',
			badge: 3,
			label: 'produce',
			labelSide: 'above',
			badgeShift: [-46, 0],
		})
	);
	P.push(
		k.connector({
			from: [kApp.x, node.cy + 16],
			to: [node.x + node.w, node.cy + 16],
			type: 'flow',
			badge: 4,
			label: 'consume',
			labelSide: 'below',
			badgeShift: [46, 0],
		})
	);

	// 5 deliver — straight down the spine
	P.push(
		k.connector({
			from: bottom(node),
			to: top(sub),
			type: 'flow',
			badge: 5,
			label: 'deliver',
			labelSide: 'right',
			badgeShift: [0, -30],
		})
	);

	P.push(
		k.kafkaTopic({
			...kApp,
			name: 'tbmq.msg.app.$CLIENT_ID',
			note: 'dedicated topic + consumer per APPLICATION client',
		})
	);
	P.push(k.card({ ...node, kind: 'core', icon: 'actor', title: 'TBMQ node' }));
	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Publisher' }));
	P.push(k.card({ ...sub, kind: 'client', icon: 'app', title: 'Subscriber', sub: 'persistent APPLICATION' }));

	P.push(
		cap(
			k,
			W,
			552,
			'Each APPLICATION client gets its own Kafka topic and dedicated consumer — the topic is the durable, replayable inbox.'
		)
	);
	P.push(
		cap(k, W, 572, 'The shared ingest into tbmq.msg.all is omitted here — every PUBLISH still lands there first.')
	);
	P.push(legendFlow(k, 40, 598));
	return k.frame(W, H, P);
}

// --- 7. Persistent APPLICATION — cluster -----------------------------------
export function appCluster(k) {
	const W = 1140,
		H = 684;
	const P = [];
	// With `tbmq.msg.all` gone, the client's own topic can sit centred and wide
	// enough to span BOTH nodes' columns. Node A writes into it and node B reads
	// straight out of it — so the "no internode hop" point is now visible in the
	// geometry (there is no node-to-node arrow at all) rather than only stated.
	const kApp = rectC(360, 44, 480, 96);
	const cluster = rectC(120, 276, 900, 116);
	const nodeA = rectC(180, 292, 300, 84);
	const nodeB = rectC(720, 292, 300, 84);
	const pub = rectC(210, 500, 240, 92);
	const sub = rectC(720, 500, 300, 92);

	// 1 publish / 2 ack — parallel verticals in the publisher gap
	P.push(
		k.connector({
			from: [nodeA.cx - 30, pub.y],
			to: [nodeA.cx - 30, nodeA.y + nodeA.h],
			type: 'flow',
			badge: 1,
			label: 'PUBLISH',
			labelSide: 'above',
			badgeShift: [0, 20],
		})
	);
	P.push(k.connector({ from: [nodeA.cx + 30, nodeA.y + nodeA.h], to: [nodeA.cx + 30, pub.y], type: 'ack', badge: 2 }));

	// 3 produce (node A) / 4 consume (node B) — verticals into the same topic
	P.push(
		k.connector({
			from: [400, nodeA.y],
			to: [400, kApp.y + kApp.h],
			type: 'flow',
			badge: 3,
			label: 'produce',
			labelSide: 'above',
			badgeShift: [0, 22],
		})
	);
	P.push(
		k.connector({
			from: [780, kApp.y + kApp.h],
			to: [780, nodeB.y],
			type: 'flow',
			badge: 4,
			label: 'consume',
			labelSide: 'above',
			badgeShift: [0, 22],
		})
	);
	P.push(
		k.connector({
			from: bottom(nodeB),
			to: [sub.cx, sub.y],
			type: 'flow',
			badge: 5,
			label: 'deliver',
			labelSide: 'above',
			badgeShift: [0, 20],
		})
	);

	P.push(k.kafkaTopic({ ...kApp, name: 'tbmq.msg.app.$CLIENT_ID', note: 'dedicated topic per APPLICATION client' }));
	P.push(k.groupBox({ ...cluster, label: 'TBMQ cluster', kind: 'core' }));
	P.push(k.text(600, 350, '···', { anchor: 'middle', size: 26, weight: 700, fill: k.T.inkMuted }));
	P.push(k.card({ ...nodeA, kind: 'core', icon: 'actor', title: 'TBMQ node A' }));
	P.push(k.card({ ...nodeB, kind: 'core', icon: 'actor', title: 'TBMQ node B', sub: 'APPLICATION connects here' }));
	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Publisher', sub: 'node A' }));
	P.push(k.card({ ...sub, kind: 'client', icon: 'app', title: 'Subscriber', sub: 'persistent APPLICATION → node B' }));

	P.push(
		cap(
			k,
			W,
			612,
			'No internode hop: the dedicated consumer is created on the node where the APPLICATION client connects, so it reads its topic locally.'
		)
	);
	P.push(
		cap(k, W, 632, 'The shared ingest into tbmq.msg.all is omitted here — every PUBLISH still lands there first.')
	);
	P.push(legendFlow(k, 40, 658));
	return k.frame(W, H, P);
}
