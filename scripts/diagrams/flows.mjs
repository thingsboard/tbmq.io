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
	const W = 900,
		H = 580;
	const P = [];
	const kafka = rectC(340, 44, 220, 92);
	const node = rectC(350, 250, 200, 96);
	const pub = rectC(96, 432, 190, 92);
	const sub = rectC(614, 432, 210, 92);

	P.push(
		k.connector({
			from: [pub.x + 150, pub.y],
			to: [node.x + 60, node.y + node.h],
			type: 'flow',
			badge: 1,
			label: 'PUBLISH',
			labelSide: 'above',
			badgeShift: [26, -6],
		})
	);
	P.push(
		k.connector({
			from: [node.cx - 55, node.y],
			to: [kafka.cx - 55, kafka.y + kafka.h],
			type: 'flow',
			badge: 2,
			label: 'store',
			labelSide: 'left',
		})
	);
	P.push(
		k.connector({
			from: [kafka.cx + 55, kafka.y + kafka.h],
			to: [node.cx + 55, node.y],
			type: 'flow',
			badge: 3,
			label: 'consume',
			labelSide: 'right',
		})
	);
	P.push(k.connector({ from: [node.x + 34, node.y + node.h], to: [pub.x, pub.y], type: 'ack', badge: 4 }));
	P.push(
		k.connector({
			from: [node.x + node.w - 44, node.y + node.h],
			to: [sub.cx - 16, sub.y],
			type: 'flow',
			badge: 5,
			label: 'deliver',
			labelSide: 'above',
			badgeShift: [22, 6],
		})
	);

	P.push(k.kafkaTopic({ ...kafka, name: 'tbmq.msg.all', note: 'every PUBLISH lands here first' }));
	P.push(k.card({ ...node, kind: 'core', icon: 'actor', title: 'TBMQ node' }));
	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Device', sub: 'publisher' }));
	P.push(k.card({ ...sub, kind: 'client', icon: 'device', title: 'Subscriber', sub: 'non-persistent DEVICE' }));

	P.push(
		cap(
			k,
			W,
			538,
			'Non-persistent subscriber: the message is delivered straight from memory — nothing is stored for the client.'
		)
	);
	P.push(legendFlow(k, 40, 562));
	return k.frame(W, H, P);
}

// --- 3. Non-persistent DEVICE — cluster ------------------------------------
export function nonPersistDevCluster(k) {
	const W = 1140,
		H = 650;
	const P = [];
	const kAll = rectC(150, 44, 300, 96);
	const kDown = rectC(590, 44, 440, 96);
	const cluster = rectC(120, 258, 900, 150);
	const nodeA = rectC(180, 292, 300, 84);
	const nodeB = rectC(720, 292, 300, 84);
	const pub = rectC(210, 500, 240, 92);
	const sub = rectC(720, 500, 300, 92);

	P.push(
		k.connector({
			from: [pub.cx, pub.y],
			to: bottom(nodeA),
			type: 'flow',
			badge: 1,
			label: 'PUBLISH',
			labelSide: 'above',
			badgeShift: [0, 20],
		})
	);
	P.push(
		k.connector({
			from: [nodeA.cx - 45, nodeA.y],
			to: [kAll.cx - 30, kAll.y + kAll.h],
			type: 'flow',
			badge: 2,
			label: 'store',
			labelSide: 'left',
		})
	);
	P.push(
		k.connector({
			from: [kAll.cx + 30, kAll.y + kAll.h],
			to: [nodeA.cx + 45, nodeA.y],
			type: 'flow',
			badge: 3,
			label: 'consume',
			labelSide: 'right',
		})
	);
	P.push(
		k.connector({
			from: [nodeA.x + nodeA.w, nodeA.cy],
			to: [kDown.x + 40, kDown.y + kDown.h],
			route: [
				[600, nodeA.cy],
				[600, 200],
				[kDown.x + 40, 200],
			],
			type: 'xnode',
			badge: 4,
		})
	);
	P.push(
		k.connector({
			from: [kDown.cx + 60, kDown.y + kDown.h],
			to: top(nodeB),
			type: 'xnode',
			badge: 5,
			label: 'route to owner node',
			labelSide: 'above',
			badgeShift: [-10, 22],
		})
	);
	P.push(
		k.connector({
			from: bottom(nodeB),
			to: [sub.cx, sub.y],
			type: 'flow',
			badge: 6,
			label: 'deliver',
			labelSide: 'above',
			badgeShift: [0, 20],
		})
	);

	P.push(k.kafkaTopic({ ...kAll, name: 'tbmq.msg.all', note: 'shared consumer group across nodes' }));
	P.push(k.kafkaTopic({ ...kDown, name: 'tbmq.msg.downlink.basic.$SERVICE_ID', note: 'per-node routing topic' }));
	P.push(k.groupBox({ ...cluster, label: 'TBMQ cluster', kind: 'core' }));
	P.push(k.text(cluster.cx, cluster.cy, '···', { anchor: 'middle', size: 26, weight: 700, fill: k.T.inkMuted }));
	P.push(k.card({ ...nodeA, kind: 'core', icon: 'actor', title: 'TBMQ node A' }));
	P.push(k.card({ ...nodeB, kind: 'core', icon: 'actor', title: 'TBMQ node B' }));
	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Device', sub: 'publisher → node A' }));
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
	const W = 1000,
		H = 600;
	const P = [];
	const kAll = rectC(110, 44, 210, 92);
	const kPers = rectC(360, 44, 250, 92);
	const redis = rectC(700, 44, 200, 92);
	const node = rectC(400, 250, 240, 100);
	const pub = rectC(110, 450, 200, 92);
	const sub = rectC(720, 450, 220, 92);

	P.push(
		k.connector({
			from: [pub.x + 160, pub.y],
			to: [node.x + 50, node.y + node.h],
			type: 'flow',
			badge: 1,
			label: 'PUBLISH',
			labelSide: 'above',
			badgeShift: [24, -6],
		})
	);
	P.push(
		k.connector({
			from: [node.cx - 90, node.y],
			to: [kAll.cx, kAll.y + kAll.h],
			type: 'flow',
			badge: 2,
			label: 'store',
			labelSide: 'left',
		})
	);
	P.push(
		k.connector({
			from: [node.cx - 30, node.y],
			to: [kPers.cx - 40, kPers.y + kPers.h],
			type: 'flow',
			badge: 3,
			label: 'route',
			labelSide: 'left',
		})
	);
	P.push(
		k.connector({
			from: [kPers.cx + 40, kPers.y + kPers.h],
			to: [node.cx + 30, node.y],
			type: 'flow',
			badge: 4,
			label: 'consume',
			labelSide: 'right',
		})
	);
	P.push(
		k.connector({
			from: [node.x + node.w, node.y + 28],
			to: [redis.cx, redis.y + redis.h],
			route: [[redis.cx, node.y + 28]],
			type: 'flow',
			badge: 5,
			label: 'store',
			labelSide: 'above',
		})
	);
	P.push(
		k.connector({
			from: [node.x + node.w - 44, node.y + node.h],
			to: [sub.cx, sub.y],
			type: 'flow',
			badge: 6,
			label: 'deliver',
			labelSide: 'above',
			badgeShift: [22, 6],
		})
	);

	P.push(k.kafkaTopic({ ...kAll, name: 'tbmq.msg.all' }));
	P.push(k.kafkaTopic({ ...kPers, name: 'tbmq.msg.persisted', note: 'DEVICE queue' }));
	P.push(k.card({ ...redis, kind: 'redis', icon: 'redis', title: 'Redis / Valkey', sub: 'per-client queue' }));
	P.push(k.card({ ...node, kind: 'core', icon: 'actor', title: 'TBMQ node' }));
	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Device', sub: 'publisher' }));
	P.push(k.card({ ...sub, kind: 'client', icon: 'device', title: 'Subscriber', sub: 'persistent DEVICE' }));

	P.push(
		cap(
			k,
			W,
			558,
			'Persistent DEVICE messages are stored in Redis/Valkey and kept until the client acknowledges delivery.'
		)
	);
	P.push(legendFlow(k, 40, 580));
	return k.frame(W, H, P);
}

// --- 5. Persistent DEVICE — cluster ----------------------------------------
export function persistDevCluster(k) {
	const W = 1300,
		H = 700;
	const P = [];
	const kAll = rectC(120, 40, 200, 90);
	const kPers = rectC(360, 40, 240, 90);
	const redis = rectC(660, 40, 200, 90);
	const kDown = rectC(910, 40, 350, 90);
	const cluster = rectC(160, 310, 980, 150);
	const nodeA = rectC(220, 344, 320, 84);
	const nodeB = rectC(820, 344, 320, 84);
	const pub = rectC(240, 560, 300, 92);
	const sub = rectC(820, 560, 320, 92);

	P.push(
		k.connector({
			from: [pub.cx, pub.y],
			to: bottom(nodeA),
			type: 'flow',
			badge: 1,
			label: 'PUBLISH',
			labelSide: 'above',
			badgeShift: [0, 20],
		})
	);
	P.push(
		k.connector({
			from: [nodeA.cx - 40, nodeA.y],
			to: [kAll.cx, kAll.y + kAll.h],
			type: 'flow',
			badge: 2,
			label: 'store',
			labelSide: 'left',
		})
	);
	P.push(
		k.connector({
			from: [nodeA.cx + 10, nodeA.y],
			to: [kPers.cx - 40, kPers.y + kPers.h],
			type: 'flow',
			badge: 3,
			label: 'route',
			labelSide: 'left',
		})
	);
	P.push(
		k.connector({
			from: [kPers.cx + 40, kPers.y + kPers.h],
			to: [nodeA.cx + 60, nodeA.y],
			type: 'flow',
			badge: 4,
			label: 'consume',
			labelSide: 'right',
		})
	);
	P.push(
		k.connector({
			from: [nodeA.x + nodeA.w - 30, nodeA.y],
			to: [redis.cx, redis.y + redis.h],
			type: 'flow',
			badge: 5,
			label: 'store',
			labelSide: 'right',
		})
	);
	P.push(
		k.connector({
			from: [nodeA.x + nodeA.w, nodeA.cy],
			to: [kDown.x + 60, kDown.y + kDown.h],
			route: [
				[680, nodeA.cy],
				[680, 160],
				[kDown.x + 60, 160],
			],
			type: 'xnode',
			badge: 6,
		})
	);
	P.push(
		k.connector({
			from: [kDown.cx, kDown.y + kDown.h],
			to: top(nodeB),
			type: 'xnode',
			badge: 7,
			label: 'route to owner node',
			labelSide: 'above',
			badgeShift: [-8, 22],
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

	P.push(k.kafkaTopic({ ...kAll, name: 'tbmq.msg.all' }));
	P.push(k.kafkaTopic({ ...kPers, name: 'tbmq.msg.persisted' }));
	P.push(k.card({ ...redis, kind: 'redis', icon: 'redis', title: 'Redis / Valkey' }));
	P.push(k.kafkaTopic({ ...kDown, name: 'tbmq.msg.downlink.persisted.$SERVICE_ID' }));
	P.push(k.groupBox({ ...cluster, label: 'TBMQ cluster', kind: 'core' }));
	P.push(k.text(cluster.cx, cluster.cy, '···', { anchor: 'middle', size: 26, weight: 700, fill: k.T.inkMuted }));
	P.push(k.card({ ...nodeA, kind: 'core', icon: 'actor', title: 'TBMQ node A' }));
	P.push(k.card({ ...nodeB, kind: 'core', icon: 'actor', title: 'TBMQ node B' }));
	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Device', sub: 'publisher → node A' }));
	P.push(k.card({ ...sub, kind: 'client', icon: 'device', title: 'Subscriber', sub: 'persistent DEVICE → node B' }));

	P.push(
		cap(
			k,
			W,
			662,
			'tbmq.msg.downlink.persisted.$SERVICE_ID forwards the persisted message to the node that owns the subscriber connection.'
		)
	);
	P.push(legendFlow(k, 40, 684, true));
	return k.frame(W, H, P);
}

// --- 6. Persistent APPLICATION — single node -------------------------------
export function app(k) {
	const W = 980,
		H = 580;
	const P = [];
	const kAll = rectC(140, 44, 210, 92);
	const kApp = rectC(430, 44, 360, 92);
	const node = rectC(370, 250, 230, 100);
	const pub = rectC(110, 450, 200, 92);
	const sub = rectC(660, 450, 220, 92);

	P.push(
		k.connector({
			from: [pub.x + 160, pub.y],
			to: [node.x + 50, node.y + node.h],
			type: 'flow',
			badge: 1,
			label: 'PUBLISH',
			labelSide: 'above',
			badgeShift: [24, -6],
		})
	);
	P.push(
		k.connector({
			from: [node.cx - 70, node.y],
			to: [kAll.cx, kAll.y + kAll.h],
			type: 'flow',
			badge: 2,
			label: 'store',
			labelSide: 'left',
		})
	);
	P.push(
		k.connector({
			from: [node.cx - 10, node.y],
			to: [kApp.cx - 90, kApp.y + kApp.h],
			type: 'flow',
			badge: 3,
			label: 'route',
			labelSide: 'left',
		})
	);
	P.push(
		k.connector({
			from: [kApp.cx + 10, kApp.y + kApp.h],
			to: [node.cx + 55, node.y],
			type: 'flow',
			badge: 4,
			label: 'consume',
			labelSide: 'right',
		})
	);
	P.push(
		k.connector({
			from: [node.x + node.w - 44, node.y + node.h],
			to: [sub.cx, sub.y],
			type: 'flow',
			badge: 5,
			label: 'deliver',
			labelSide: 'above',
			badgeShift: [22, 6],
		})
	);

	P.push(k.kafkaTopic({ ...kAll, name: 'tbmq.msg.all' }));
	P.push(
		k.kafkaTopic({
			...kApp,
			name: 'tbmq.msg.app.$CLIENT_ID',
			note: 'dedicated topic + consumer per APPLICATION client',
		})
	);
	P.push(k.card({ ...node, kind: 'core', icon: 'actor', title: 'TBMQ node' }));
	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Device', sub: 'publisher' }));
	P.push(k.card({ ...sub, kind: 'client', icon: 'app', title: 'Application', sub: 'persistent subscriber' }));

	P.push(
		cap(
			k,
			W,
			538,
			'Each APPLICATION client gets its own Kafka topic + dedicated consumer — the topic itself is the durable, replayable inbox.'
		)
	);
	P.push(legendFlow(k, 40, 560));
	return k.frame(W, H, P);
}

// --- 7. Persistent APPLICATION — cluster -----------------------------------
export function appCluster(k) {
	const W = 1140,
		H = 620;
	const P = [];
	const kAll = rectC(180, 44, 210, 96);
	const kApp = rectC(470, 44, 360, 96);
	const cluster = rectC(120, 258, 900, 150);
	const nodeA = rectC(180, 292, 300, 84);
	const nodeB = rectC(720, 292, 300, 84);
	const pub = rectC(210, 490, 240, 92);
	const sub = rectC(720, 490, 300, 92);

	P.push(
		k.connector({
			from: [pub.cx, pub.y],
			to: bottom(nodeA),
			type: 'flow',
			badge: 1,
			label: 'PUBLISH',
			labelSide: 'above',
			badgeShift: [0, 20],
		})
	);
	P.push(
		k.connector({
			from: [nodeA.cx, nodeA.y],
			to: [kAll.cx, kAll.y + kAll.h],
			type: 'flow',
			badge: 2,
			label: 'store',
			labelSide: 'left',
		})
	);
	P.push(
		k.connector({
			from: [nodeA.x + nodeA.w, nodeA.y + 20],
			to: [kApp.x + 80, kApp.y + kApp.h],
			route: [
				[600, nodeA.y + 20],
				[600, 190],
				[kApp.x + 80, 190],
			],
			type: 'flow',
			badge: 3,
			label: 'route to app topic',
			labelSide: 'above',
			badgeShift: [-40, 0],
		})
	);
	P.push(
		k.connector({
			from: [kApp.cx + 70, kApp.y + kApp.h],
			to: top(nodeB),
			type: 'flow',
			badge: 4,
			label: 'consumer on connect node',
			labelSide: 'above',
			badgeShift: [-20, 22],
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

	P.push(k.kafkaTopic({ ...kAll, name: 'tbmq.msg.all' }));
	P.push(k.kafkaTopic({ ...kApp, name: 'tbmq.msg.app.$CLIENT_ID' }));
	P.push(k.groupBox({ ...cluster, label: 'TBMQ cluster', kind: 'core' }));
	P.push(k.text(cluster.cx, cluster.cy, '···', { anchor: 'middle', size: 26, weight: 700, fill: k.T.inkMuted }));
	P.push(k.card({ ...nodeA, kind: 'core', icon: 'actor', title: 'TBMQ node A' }));
	P.push(k.card({ ...nodeB, kind: 'core', icon: 'actor', title: 'TBMQ node B', sub: 'APPLICATION connects here' }));
	P.push(k.card({ ...pub, kind: 'client', icon: 'device', title: 'Device', sub: 'publisher → node A' }));
	P.push(k.card({ ...sub, kind: 'client', icon: 'app', title: 'Application', sub: 'connects to node B' }));

	P.push(
		cap(
			k,
			W,
			582,
			'No internode hop: the dedicated consumer is created on the node where the APPLICATION client connects, so it reads its topic locally.'
		)
	);
	P.push(legendFlow(k, 40, 604));
	return k.frame(W, H, P);
}
