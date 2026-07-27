/**
 * The added architecture diagrams (beyond the seven redraws):
 *   N1 publish-lifecycle   — sequence, makes the "ack only after Kafka" gate visible
 *   N2 client-type-tree    — decision tree for session/type → storage path
 *   N3 subscription-trie    — worked example with +/# traced
 *   N4 kafka-topics-map     — topics grouped by function + scope
 *   N5 standalone-vs-cluster— side-by-side topology
 *   N6 actor-system         — the two actor types + handled control messages
 *   N7 qos-durability       — QoS 0/1/2 handshake vs the persistence gate
 *   N8 persistence-model    — DEVICE (Redis sorted set) vs APPLICATION (dedicated Kafka topic)
 *   N9 integration-executor — TBMQ → Kafka → IE → external
 */
import { rectC, top, bottom, left, right } from './kit.mjs';

const cap = (k, W, y, str) => k.caption(W / 2, y, str);

// A dashed vertical lifeline for the sequence diagrams.
function lifeline(k, x, y1, y2) {
	return `<path d="M ${x} ${y1} L ${x} ${y2}" stroke="${k.T.neutralStroke}" stroke-width="1.4" stroke-dasharray="4 5"/>`;
}

/** Plain connector line with no arrowhead — for shared rails and elbow stubs. */
const stub = (k, x1, y1, x2, y2) =>
	`<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="${k.T.flow}" stroke-width="1.9" stroke-linecap="round"/>`;

// =============================================================================
// N1 — PUBLISH lifecycle (sequence)
// =============================================================================
export function publishLifecycle(k) {
	const W = 1340,
		H = 720;
	const P = [];
	// Header lanes. Each card is sized to its own label (so nothing overflows),
	// and the GAPS between cards are equal — the row is laid out from a single
	// gap constant with symmetric side margins rather than hand-placed x values.
	const laneDefs = [
		{ w: 124, title: 'Publisher', kind: 'client', icon: 'device' },
		{ w: 144, title: 'Client actor', kind: 'core', icon: 'actor' },
		{ w: 184, title: 'Message dispatcher', kind: 'core', icon: 'dispatch' },
		{ w: 136, title: 'Kafka', sub: 'tbmq.msg.all', kind: 'kafka', icon: 'kafka' },
		{ w: 178, title: 'Subscription Trie', kind: 'core', icon: 'trie' },
		{ w: 130, title: 'Subscriber', kind: 'client', icon: 'device' },
	];
	const LANE_GAP = 72;
	let laneX = (W - laneDefs.reduce((a, l) => a + l.w, 0) - LANE_GAP * (laneDefs.length - 1)) / 2;
	const lanes = laneDefs.map((l) => {
		const lane = { ...l, cardX: laneX, x: laneX + l.w / 2 };
		laneX += l.w + LANE_GAP;
		return lane;
	});
	const yTop = 40,
		yBot = 640;
	for (const l of lanes) P.push(lifeline(k, l.x, yTop + 56, yBot));

	// durability-gate band
	const gateY = 300;
	P.push(
		`<rect x="70" y="${gateY - 22}" width="${W - 140}" height="44" rx="10" fill="${k.T.kinds.core.fill}" stroke="${k.T.kinds.core.stroke}" stroke-width="1.3" stroke-dasharray="7 5" opacity="0.9"/>`
	);
	P.push(
		k.text(W / 2, gateY, 'Durability gate — the publisher is acknowledged ONLY after Kafka persists the message', {
			anchor: 'middle',
			size: 12.5,
			weight: 700,
			fill: k.T.kinds.core.ink,
		})
	);

	const X = Object.fromEntries(lanes.map((l, i) => [i, l.x]));
	const msg = (a, b, y, label, type = 'flow') =>
		P.push(k.connector({ from: [X[a], y], to: [X[b], y], type, label, labelSide: 'above' }));

	// First row starts at 134, not 120: its label chip sits 22px above the arrow,
	// which at 120 would have collided with the header cards (they end at y=90).
	msg(0, 1, 134, 'PUBLISH (QoS 1/2)');
	msg(1, 2, 174, 'persist');
	msg(2, 3, 214, 'produce → tbmq.msg.all');
	msg(3, 2, 256, 'persisted (offset committed)', 'ack');
	// below the gate: the ack path back to the publisher
	msg(2, 1, 350, '', 'ack');
	msg(1, 0, 390, 'PUBACK / PUBREC', 'ack');
	// async fan-out — centred in the first lane gap so no lifeline crosses it
	P.push(
		k.text((lanes[0].x + lanes[1].x) / 2, 445, 'asynchronous fan-out', {
			size: 12,
			weight: 700,
			fill: k.T.inkMuted,
			anchor: 'middle',
		})
	);
	msg(3, 2, 480, 'consume', 'flow');
	msg(2, 4, 520, 'match(topic)');
	msg(4, 2, 560, 'subscribers', 'ack');
	msg(2, 5, 610, 'deliver (by client type)');

	for (const l of lanes)
		P.push(
			k.card({
				x: l.cardX,
				y: yTop,
				w: l.w,
				h: 50,
				kind: l.kind,
				icon: l.icon,
				title: l.title,
				sub: l.sub,
				titleSize: 12.5,
			})
		);

	P.push(
		cap(
			k,
			W,
			672,
			'For QoS 0 no acknowledgement is sent; the message is still persisted to tbmq.msg.all before fan-out.'
		)
	);
	P.push(
		k.legend(80, 698, [
			{ type: 'flow', label: 'message / command' },
			{ type: 'ack', label: 'acknowledgement / response' },
		])
	);
	return k.frame(W, H, P);
}

// =============================================================================
// N2 — Client-type decision tree
// =============================================================================
export function clientTypeTree(k) {
	const W = 1080,
		H = 648;
	const P = [];
	const connect = rectC(440, 40, 200, 64);
	const dSession = rectC(430, 168, 220, 74);
	// Both level-2 nodes share a top edge (320) so the two branches out of
	// "Persistent session?" drop the same distance onto the same line.
	const nonPersist = rectC(120, 320, 320, 96);
	const devLeaf = rectC(560, 470, 200, 110);
	const appLeaf = rectC(800, 470, 240, 110);
	// "Client type?" is sized and centred so its bottom edge spans BOTH leaf
	// centres (660 / 920) — that is what lets each type branch run as a plain
	// vertical, with no sideways elbow on either side.
	const dType = rectC(devLeaf.cx - 30, 320, appLeaf.cx - devLeaf.cx + 60, 74);

	// Level-1 branches: one shared elbow line at y=290, symmetric exits.
	const ELBOW = 290;
	P.push(k.connector({ from: bottom(connect), to: top(dSession), type: 'flow' }));
	P.push(
		k.connector({
			from: [dSession.x + 30, dSession.y + dSession.h],
			to: top(nonPersist),
			route: [
				[dSession.x + 30, ELBOW],
				[nonPersist.cx, ELBOW],
			],
			type: 'flow',
			label: 'no',
			labelSide: 'above',
		})
	);
	P.push(
		k.connector({
			from: [dSession.x + dSession.w - 30, dSession.y + dSession.h],
			to: top(dType),
			route: [
				[dSession.x + dSession.w - 30, ELBOW],
				[dType.cx, ELBOW],
			],
			type: 'flow',
			label: 'yes',
			labelSide: 'above',
		})
	);
	// Level-2 branches: straight verticals, labels centred on the same line.
	for (const [leaf, label] of [
		[devLeaf, 'DEVICE'],
		[appLeaf, 'APPLICATION'],
	]) {
		P.push(
			k.connector({
				from: [leaf.cx, dType.y + dType.h],
				to: top(leaf),
				type: 'flow',
				label,
			})
		);
	}

	P.push(k.card({ ...connect, kind: 'client', title: 'MQTT CONNECT', titleSize: 14 }));
	P.push(
		k.card({
			...dSession,
			kind: 'transport',
			title: 'Persistent session?',
			sub: 'cleanStart + sessionExpiryInterval',
			titleSize: 14,
		})
	);
	P.push(
		k.card({
			...nonPersist,
			kind: 'client',
			icon: 'device',
			title: 'Non-persistent',
			// Not "nothing stored" — the message is still appended to
			// tbmq.msg.all; what is missing is the per-client queue.
			sub: 'delivered while connected · nothing queued',
		})
	);
	// Credentials carry `clientType`; the JWT / HTTP auth providers set it too
	// (`defaultClientType`, and for JWT `clientTypeClaims`).
	P.push(
		k.card({
			...dType,
			kind: 'transport',
			title: 'Client type?',
			sub: 'set by credentials or auth provider',
			titleSize: 14,
		})
	);
	P.push(
		k.card({
			...devLeaf,
			kind: 'redis',
			icon: 'redis',
			title: 'Persistent',
			sub: 'DEVICE',
			topic: 'Redis / Valkey queue',
		})
	);
	P.push(
		k.card({
			...appLeaf,
			kind: 'kafka',
			icon: 'kafka',
			title: 'Persistent',
			sub: 'APPLICATION',
			topic: 'tbmq.msg.app.$CLIENT_ID',
		})
	);

	// Two lines: the one-liner no longer fits the 1080px canvas.
	P.push(
		cap(
			k,
			W,
			604,
			'Client type (DEVICE / APPLICATION) is set by the client credentials or by the authentication provider, independent of the session.'
		)
	);
	P.push(cap(k, W, 624, 'APPLICATION clients are designed to run with persistent sessions.'));
	return k.frame(W, H, P);
}

// =============================================================================
// N3 — Subscription Trie worked example
// =============================================================================
export function subscriptionTrie(k) {
	const W = 1060,
		H = 660;
	const P = [];
	const M = k.T.kinds.core; // matched highlight colour

	// node helper: returns rect meta and pushes a pill
	function tnode(x, y, label, { matched = false, w = 118 } = {}) {
		const h = 44;
		const r = rectC(x - w / 2, y, w, h);
		const stroke = matched ? M.stroke : k.T.neutralStroke;
		const fill = matched ? M.fill : k.T.neutralFill;
		const ink = matched ? M.ink : k.T.ink;
		P.push(
			`<rect x="${r.x}" y="${r.y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="${matched ? 2 : 1.5}"/>`
		);
		P.push(k.text(r.cx, r.cy, label, { anchor: 'middle', size: 13, weight: 650, mono: true, fill: ink }));
		return r;
	}
	function edge(a, b, matched) {
		P.push(
			`<path d="M ${a.cx} ${a.y + a.h} L ${b.cx} ${b.y}" stroke="${matched ? M.stroke : k.T.neutralStroke}" stroke-width="${matched ? 2.2 : 1.5}" ${matched ? '' : 'stroke-dasharray="1 0"'}/>`
		);
	}
	function subTag(node, who, matched) {
		P.push(
			k.text(node.cx, node.y + node.h + 16, who, {
				anchor: 'middle',
				size: 11,
				weight: 600,
				fill: matched ? M.ink : k.T.inkMuted,
			})
		);
	}

	const root = tnode(560, 70, 'root', { matched: true, w: 96 });
	const sensors = tnode(560, 170, 'sensors', { matched: true });
	const plus = tnode(280, 290, '+', { matched: true, w: 90 });
	const room1 = tnode(470, 290, 'room1', { matched: true });
	const room2 = tnode(660, 290, 'room2', { matched: false });
	const hash = tnode(840, 290, '#', { matched: true, w: 90 });
	const tempA = tnode(280, 410, 'temperature', { matched: true, w: 150 });
	const tempC = tnode(470, 410, 'temperature', { matched: true, w: 150 });
	const tempD = tnode(660, 410, 'temperature', { matched: false, w: 150 });

	edge(root, sensors, true);
	edge(sensors, plus, true);
	edge(sensors, room1, true);
	edge(sensors, room2, false);
	edge(sensors, hash, true);
	edge(plus, tempA, true);
	edge(room1, tempC, true);
	edge(room2, tempD, false);

	subTag(tempA, 'sub A: sensors/+/temperature', true);
	subTag(tempC, 'sub C: sensors/room1/temperature', true);
	subTag(tempD, 'sub D: sensors/room2/temperature', false);
	subTag(hash, 'sub B: sensors/#', true);

	// publish banner
	P.push(
		`<rect x="70" y="60" width="300" height="64" rx="12" fill="${k.T.kinds.kafka.fill}" stroke="${k.T.kinds.kafka.stroke}" stroke-width="1.6"/>`
	);
	P.push(k.text(220, 84, 'PUBLISH', { anchor: 'middle', size: 12, weight: 700, fill: k.T.kinds.kafka.ink }));
	P.push(
		k.text(220, 104, 'sensors/room1/temperature', {
			anchor: 'middle',
			size: 13,
			weight: 650,
			mono: true,
			fill: k.T.kinds.kafka.ink,
		})
	);

	P.push(
		cap(
			k,
			W,
			590,
			'One PUBLISH matches three subscriptions: exact (sub C), single-level "+" (sub A), multi-level "#" (sub B). The room2 branch is pruned — never visited.'
		)
	);
	P.push(
		cap(
			k,
			W,
			616,
			'Lookup cost scales with the topic depth (levels traversed), not with the total number of subscriptions.',
			{ size: 12 }
		)
	);
	return k.frame(W, H, P);
}

// =============================================================================
// N4 — Kafka topics map
// =============================================================================
export function kafkaTopicsMap(k) {
	const W = 1280,
		H = 970;
	const P = [];
	const groups = [
		{
			x: 40,
			y: 56,
			w: 590,
			h: 250,
			kind: 'kafka',
			label: 'Message flow',
			rows: [
				['tbmq.msg.all', 'global', '16 partitions'],
				['tbmq.msg.persisted', 'global', '12 partitions'],
				['tbmq.msg.app.$CLIENT_ID', 'per-client', 'dedicated'],
				['tbmq.msg.app.shared.$TOPIC_FILTER', 'per-filter', 'shared subs'],
				['tbmq.msg.retained', 'global', 'compacted'],
			],
		},
		{
			x: 650,
			y: 56,
			w: 590,
			h: 250,
			kind: 'pg',
			label: 'Session & subscription state',
			rows: [
				['tbmq.client.session', 'global', 'compacted'],
				['tbmq.client.subscriptions', 'global', 'compacted'],
				['tbmq.client.session.event.request', 'global', '24 partitions'],
				['tbmq.client.session.event.response.$SERVICE_ID', 'per-node', ''],
			],
		},
		{
			x: 40,
			y: 340,
			w: 590,
			h: 250,
			kind: 'core',
			label: 'Cross-node routing (per-node)',
			rows: [
				['tbmq.msg.downlink.basic.$SERVICE_ID', 'per-node', ''],
				['tbmq.msg.downlink.persisted.$SERVICE_ID', 'per-node', ''],
				['tbmq.client.disconnect.$SERVICE_ID', 'per-node', ''],
				['tbmq.sys.internode.notifications.$SERVICE_ID', 'per-node', ''],
			],
		},
		{
			x: 650,
			y: 340,
			w: 590,
			h: 250,
			kind: 'transport',
			label: 'System & housekeeping',
			rows: [
				['tbmq.sys.historical.data', 'global', 'stats'],
				['tbmq.sys.app.removed', 'global', ''],
				['tbmq.client.blocked', 'global', 'compacted'],
			],
		},
		{
			x: 40,
			y: 624,
			w: 1200,
			h: 250,
			kind: 'ie',
			label: 'Integration Executor',
			rows: [
				['tbmq.msg.ie.$INTEGRATION_ID', 'per-integration', 'broker → executor'],
				['tbmq.ie.downlink.{http,kafka,mqtt}', 'per-type', 'downlink config · compacted'],
				['tbmq.ie.uplink', 'global', 'events → broker'],
				['tbmq.ie.uplink.notifications.$SERVICE_ID', 'per-node', ''],
				['tbmq.ie.event.$INTEGRATION_ID', 'per-integration', 'client lifecycle events'],
			],
		},
	];

	for (const g of groups) {
		P.push(k.groupBox({ x: g.x, y: g.y, w: g.w, h: g.h, label: g.label, kind: g.kind, labelKind: g.kind }));
		const kk = k.T.kinds[g.kind];
		let ry = g.y + 34;
		for (const [name, scope, note] of g.rows) {
			const rw = g.w - 40;
			P.push(
				`<rect x="${g.x + 20}" y="${ry}" width="${rw}" height="38" rx="9" fill="${kk.fill}" stroke="${kk.stroke}" stroke-width="1.3"/>`
			);
			P.push(k.text(g.x + 34, ry + 19, name, { size: 12.5, weight: 600, mono: true, fill: kk.ink }));
			// scope tag (right-aligned)
			const tagW = scope.length * 6.6 + 16;
			const tagX = g.x + g.w - 24 - tagW;
			P.push(
				`<rect x="${tagX}" y="${ry + 8}" width="${tagW}" height="22" rx="7" fill="${k.T.canvas}" stroke="${kk.stroke}" stroke-width="1.1"/>`
			);
			P.push(k.text(tagX + tagW / 2, ry + 19, scope, { anchor: 'middle', size: 10.5, weight: 600, fill: k.T.inkSub }));
			if (note)
				P.push(k.text(tagX - 10, ry + 19, note, { anchor: 'end', size: 10.5, weight: 500, fill: k.T.inkMuted }));
			ry += 44;
		}
	}

	P.push(
		cap(
			k,
			W,
			906,
			// Names every scope tag used above rather than only three of them, and stays
			// short enough to keep the caption clear of the canvas edges.
			'Global topics are shared by all nodes (consumer groups rebalance across them); per-node, per-client, per-filter and per-integration topics each name their single owner in the suffix.'
		)
	);
	P.push(
		cap(
			k,
			W,
			936,
			'All topic names carry an optional queue.kafka.kafka-prefix (empty by default). Client IDs / topic filters in suffixes are sanitised or SHA-256 hashed.',
			{ size: 12 }
		)
	);
	return k.frame(W, H, P);
}

// =============================================================================
// N5 — Standalone vs cluster topology
// =============================================================================
export function standaloneVsCluster(k) {
	const W = 1320,
		H = 640;
	const P = [];

	// --- Standalone panel ---
	const sp = rectC(40, 60, 560, 520);
	P.push(k.groupBox({ ...sp, label: 'Standalone', kind: 'client' }));
	const sNode = rectC(200, 210, 240, 90);
	const sKafka = rectC(90, 400, 150, 84);
	const sRedis = rectC(255, 400, 140, 84);
	const sPg = rectC(410, 400, 140, 84);
	const sClients = rectC(230, 90, 180, 74);
	P.push(k.connector({ from: bottom(sClients), to: top(sNode), type: 'flow', label: 'MQTT' }));
	P.push(
		k.connector({
			from: [sNode.cx - 60, sNode.y + sNode.h],
			to: top(sKafka),
			route: [[sKafka.cx, sNode.y + sNode.h + 30]],
			type: 'flow',
		})
	);
	P.push(k.connector({ from: bottom(sNode), to: top(sRedis), type: 'flow' }));
	P.push(
		k.connector({
			from: [sNode.cx + 60, sNode.y + sNode.h],
			to: top(sPg),
			route: [[sPg.cx, sNode.y + sNode.h + 30]],
			type: 'flow',
		})
	);
	P.push(k.card({ ...sClients, kind: 'client', icon: 'clients', title: 'MQTT clients' }));
	P.push(k.card({ ...sNode, kind: 'core', icon: 'actor', title: 'TBMQ node' }));
	P.push(k.card({ ...sKafka, kind: 'kafka', icon: 'kafka', title: 'Kafka' }));
	P.push(k.card({ ...sRedis, kind: 'redis', icon: 'redis', title: 'Redis' }));
	P.push(k.card({ ...sPg, kind: 'pg', icon: 'pg', title: 'Postgres' }));
	P.push(k.caption(sp.cx, 560, 'One node handles everything.'));

	// --- Cluster panel ---
	const cp = rectC(640, 60, 640, 520);
	P.push(k.groupBox({ ...cp, label: 'Cluster', kind: 'core' }));
	const lb = rectC(830, 90, 240, 62);
	const n1 = rectC(680, 210, 150, 80);
	const n2 = rectC(855, 210, 150, 80);
	const n3 = rectC(1030, 210, 150, 80);
	const cKafka = rectC(700, 410, 180, 80);
	const cRedis = rectC(910, 410, 150, 80);
	const cPg = rectC(1090, 410, 150, 80);
	P.push(
		k.connector({
			from: bottom(lb),
			to: top(n1),
			route: [
				[lb.cx, 180],
				[n1.cx, 180],
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
				[lb.cx, 180],
				[n3.cx, 180],
			],
			type: 'flow',
		})
	);
	for (const n of [n1, n2, n3]) {
		P.push(
			k.connector({
				from: bottom(n),
				to: [cKafka.cx, cKafka.y],
				route: [
					[n.cx, 380],
					[cKafka.cx, 380],
				],
				type: 'flow',
			})
		);
	}
	P.push(
		k.text(cp.cx, 330, 'sessions & subscriptions replicated to every node via Kafka', {
			anchor: 'middle',
			size: 11.5,
			weight: 600,
			fill: k.T.inkMuted,
		})
	);
	P.push(k.card({ ...lb, kind: 'transport', icon: 'lb', title: 'Load balancer' }));
	P.push(k.card({ ...n1, kind: 'core', icon: 'actor', title: 'node 1' }));
	P.push(k.card({ ...n2, kind: 'core', icon: 'actor', title: 'node 2' }));
	P.push(k.card({ ...n3, kind: 'core', icon: 'actor', title: 'node N' }));
	P.push(k.card({ ...cKafka, kind: 'kafka', icon: 'kafka', title: 'Kafka', sub: 'shared' }));
	P.push(k.card({ ...cRedis, kind: 'redis', icon: 'redis', title: 'Redis', sub: 'shared' }));
	P.push(k.card({ ...cPg, kind: 'pg', icon: 'pg', title: 'Postgres', sub: 'shared' }));
	P.push(
		k.caption(cp.cx, 560, 'Identical nodes · no master · reconnect to any node · new nodes rehydrate state from Kafka.')
	);

	P.push(
		cap(
			k,
			W,
			612,
			'The same components everywhere — clustering adds a load balancer and more identical nodes over shared Kafka / Redis / PostgreSQL.'
		)
	);
	return k.frame(W, H, P);
}

// =============================================================================
// N6 — Actor system
// =============================================================================
export function actorSystem(k) {
	const W = 1180,
		H = 650;
	const P = [];
	const node = rectC(40, 56, 1100, 500);
	P.push(
		k.groupBox({ ...node, label: 'TBMQ node · custom actor system (single-thread-at-a-time mailboxes)', kind: 'core' })
	);

	/**
	 * Mailbox strip: a short queue of message slots, the leading two filled, to
	 * show that a CAS-guarded mailbox admits one thread at a time. This replaces
	 * an offset "stacked shadow" rect that read as a second border on the card
	 * (and was always drawn in the core green, even on the amber DEVICE card).
	 */
	const mailbox = (x, y, kind, n = 6) => {
		const kk = k.T.kinds[kind];
		let s = '';
		for (let i = 0; i < n; i++) {
			s += `<rect x="${x + i * 26}" y="${y}" width="22" height="22" rx="4" fill="${i < 2 ? kk.fill : k.T.canvas}" stroke="${kk.stroke}" stroke-width="1.2"/>`;
		}
		s += k.text(x, y + 38, 'mailbox — one thread at a time (CAS)', {
			size: 10.5,
			weight: 600,
			fill: k.T.inkMuted,
		});
		return s;
	};

	const client = rectC(120, 130, 300, 120);
	const dev = rectC(120, 350, 300, 120);
	P.push(k.card({ ...client, kind: 'core', icon: 'actor', title: 'Client actor', sub: 'one per connected client' }));
	P.push(mailbox(client.x + 10, client.y + client.h + 14, 'core'));
	P.push(
		k.card({
			...dev,
			kind: 'redis',
			icon: 'device',
			title: 'Persisted DEVICE actor',
			sub: 'one per persistent DEVICE client',
		})
	);
	P.push(mailbox(dev.x + 10, dev.y + dev.h + 14, 'redis'));

	const msgBox = (x, y, w, title, items, kind) => {
		const h = 34 + items.length * 24;
		P.push(
			`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${k.T.neutralSoft}" stroke="${k.T.kinds[kind].stroke}" stroke-width="1.4"/>`
		);
		P.push(k.text(x + 16, y + 22, title, { size: 12.5, weight: 700, fill: k.T.kinds[kind].ink }));
		let iy = y + 46;
		for (const it of items) {
			P.push(k.text(x + 20, iy, '• ' + it, { size: 12, weight: 500, fill: k.T.ink }));
			iy += 24;
		}
		return rectC(x, y, w, h);
	};

	// Each Handles box is centred on its own actor card, so both connectors are
	// plain horizontals on the card centrelines — and therefore parallel.
	const BOX_H = 34 + 4 * 24;
	const cBox = msgBox(
		560,
		client.cy - BOX_H / 2,
		540,
		'Handles',
		[
			'CONNECT / DISCONNECT · keep-alive',
			'SUBSCRIBE / UNSUBSCRIBE',
			'PUBLISH · PUBACK / PUBREC / PUBREL / PUBCOMP',
			'channel writability (backpressure)',
		],
		'core'
	);
	const dBox = msgBox(
		560,
		dev.cy - BOX_H / 2,
		540,
		'Handles',
		[
			'retrieve & deliver offline-persisted messages',
			'track in-flight packet ids',
			'update / remove messages in Redis on ack',
			'shared-subscription retrieval',
		],
		'redis'
	);

	P.push(k.connector({ from: right(client), to: [cBox.x, client.cy], type: 'flow' }));
	P.push(k.connector({ from: right(dev), to: [dBox.x, dev.cy], type: 'flow' }));

	P.push(
		cap(
			k,
			W,
			594,
			'Two actor types, created as sibling root actors on the client-dispatcher and persisted-device-dispatcher pools.'
		)
	);
	P.push(
		cap(
			k,
			W,
			622,
			'A CAS-guarded mailbox lets at most one thread process an actor at a time — per-client isolation and ordering with no locks on the hot path.',
			{ size: 12 }
		)
	);
	return k.frame(W, H, P);
}

// =============================================================================
// N7 — QoS durability handshake timeline
// =============================================================================
export function qosDurability(k) {
	const W = 1260,
		H = 620;
	const P = [];
	const cols = [
		{ x: 60, w: 340, title: 'QoS 0 — at most once', steps: [['PUBLISH', 'flow', 'c2b']], ack: [] },
		{
			x: 460,
			w: 340,
			title: 'QoS 1 — at least once',
			steps: [['PUBLISH', 'flow', 'c2b']],
			ack: [['PUBACK', 'ack', 'b2c']],
		},
		{
			x: 860,
			w: 340,
			title: 'QoS 2 — exactly once',
			steps: [['PUBLISH', 'flow', 'c2b']],
			ack: [
				['PUBREC', 'ack', 'b2c'],
				['PUBREL', 'flow', 'c2b'],
				['PUBCOMP', 'ack', 'b2c'],
			],
		},
	];
	const gateY = 250;

	for (const col of cols) {
		const cx = col.x,
			lc = cx + 70,
			lb = cx + col.w - 70;
		// header
		P.push(k.text(cx + col.w / 2, 46, col.title, { anchor: 'middle', size: 13.5, weight: 700, fill: k.T.ink }));
		P.push(k.card({ x: lc - 60, y: 62, w: 120, h: 40, kind: 'client', title: 'Client', titleSize: 12.5 }));
		P.push(k.card({ x: lb - 60, y: 62, w: 120, h: 40, kind: 'core', title: 'TBMQ', titleSize: 12.5 }));
		P.push(lifeline(k, lc, 108, 560));
		P.push(lifeline(k, lb, 108, 560));

		let y = 150;
		P.push(k.connector({ from: [lc, y], to: [lb, y], type: 'flow', label: 'PUBLISH', labelSide: 'above' }));
		y = 205;
		// store to Kafka: small self-loop on the broker lifeline + centred label
		P.push(
			`<path d="M ${lb} ${y - 9} h 22 v 18 h -22" fill="none" stroke="${k.T.flow}" stroke-width="1.6" stroke-linejoin="round"/>`
		);
		P.push(
			k.text((lc + lb) / 2, y, 'store → tbmq.msg.all', {
				anchor: 'middle',
				size: 11,
				weight: 600,
				fill: k.T.kinds.kafka.ink,
			})
		);

		let ay = gateY + 62;
		for (const [label, type] of col.ack) {
			const c2b = label === 'PUBREL';
			P.push(k.connector({ from: [c2b ? lc : lb, ay], to: [c2b ? lb : lc, ay], type, label, labelSide: 'above' }));
			ay += 55;
		}
		if (col.ack.length === 0) {
			P.push(
				k.text((lc + lb) / 2, gateY + 60, 'no acknowledgement', {
					anchor: 'middle',
					size: 11.5,
					weight: 600,
					fill: k.T.inkMuted,
				})
			);
		}
	}

	// gate band across all columns
	P.push(
		`<rect x="40" y="${gateY - 20}" width="${W - 80}" height="40" rx="10" fill="${k.T.kinds.core.fill}" stroke="${k.T.kinds.core.stroke}" stroke-width="1.3" stroke-dasharray="7 5" opacity="0.9"/>`
	);
	P.push(
		k.text(W / 2, gateY, 'Kafka persistence gate — acknowledgements are emitted only below this line', {
			anchor: 'middle',
			size: 12.5,
			weight: 700,
			fill: k.T.kinds.core.ink,
		})
	);

	P.push(
		cap(
			k,
			W,
			590,
			'Once TBMQ acknowledges a QoS 1/2 publish the message is already durable in Kafka — it survives a broker-node failure (use a replicated Kafka cluster to also survive a Kafka-node failure).'
		)
	);
	return k.frame(W, H, P);
}

// =============================================================================
// N9 — Integration Executor data flow
// =============================================================================
export function integrationExecutor(k) {
	const W = 1300,
		H = 524;
	const P = [];
	// Two straight, parallel lanes: the forward path (broker → tbmq.msg.ie →
	// executor) on top, the uplink (executor → tbmq.ie.uplink → broker) below.
	// The broker and the executor are the same height so both lanes stay
	// horizontal end to end — no elbows, nothing to bend around.
	const COL_Y = 94,
		COL_H = 240;
	const LANE_FWD = COL_Y + 40,
		LANE_UP = COL_Y + COL_H - 40;
	const broker = rectC(60, COL_Y, 210, COL_H);
	const kDown = rectC(340, LANE_FWD - 34, 300, 68);
	const kUp = rectC(340, LANE_UP - 34, 300, 68);
	const ie = rectC(720, COL_Y, 220, COL_H);
	// External systems share a column, evenly spaced around the executor's
	// centreline, so every delivery arrow is horizontal too.
	const EXT_X = 1060,
		EXT_W = 190,
		EXT_GAP = 130;
	const extCol = (cy) => rectC(EXT_X, cy - 40, EXT_W, 80);
	const http = extCol(ie.cy - EXT_GAP);
	const mqtt = extCol(ie.cy);
	const kext = extCol(ie.cy + EXT_GAP);

	// The topic cards already spell each topic name, so these arrows carry no
	// label chips — the chips used to overlap the cards they pointed at.
	P.push(k.connector({ from: [broker.x + broker.w, LANE_FWD], to: left(kDown), type: 'flow' }));
	P.push(k.connector({ from: right(kDown), to: [ie.x, LANE_FWD], type: 'flow' }));
	P.push(k.connector({ from: [ie.x, LANE_UP], to: right(kUp), type: 'ack' }));
	P.push(k.connector({ from: left(kUp), to: [broker.x + broker.w, LANE_UP], type: 'ack' }));

	// One executor output fans out to whichever external systems the configured
	// integrations target — drawn as a shared rail rather than three diagonals
	// from the card, which would imply three simultaneous dedicated links.
	const RAIL = ie.x + ie.w + 50;
	P.push(stub(k, ie.x + ie.w, ie.cy, RAIL, ie.cy));
	P.push(stub(k, RAIL, http.cy, RAIL, kext.cy));
	for (const ext of [http, mqtt, kext]) {
		P.push(k.connector({ from: [RAIL, ext.cy], to: left(ext), type: 'flow' }));
	}

	P.push(k.card({ ...broker, kind: 'core', icon: 'actor', title: 'TBMQ cluster' }));
	P.push(k.kafkaTopic({ ...kDown, name: 'tbmq.msg.ie.$INTEGRATION_ID', note: 'matched publish messages' }));
	P.push(k.kafkaTopic({ ...kUp, name: 'tbmq.ie.uplink', note: 'integration events → broker' }));
	P.push(
		k.card({
			...ie,
			kind: 'ie',
			icon: 'ie',
			title: 'Integration Executor',
			sub: 'separate microservice',
			topic: 'scales independently',
		})
	);
	P.push(k.card({ ...http, kind: 'transport', icon: 'webui', title: 'HTTP', sub: 'endpoint' }));
	P.push(k.card({ ...mqtt, kind: 'transport', icon: 'netty', title: 'MQTT', sub: 'external broker' }));
	P.push(k.card({ ...kext, kind: 'transport', icon: 'kafka', title: 'Kafka', sub: 'external cluster' }));

	// Two lines: the single-line version was wider than the canvas and clipped.
	P.push(
		cap(
			k,
			W,
			428,
			'The Integration Executor runs as its own microservice (its own JVM) and consumes messages from Kafka,'
		)
	);
	P.push(
		cap(
			k,
			W,
			452,
			'delivering them to external HTTP / MQTT / Kafka systems — isolated from the broker and scaled independently.'
		)
	);
	P.push(
		k.legend(60, 494, [
			{ type: 'flow', label: 'broker → executor → external' },
			{ type: 'ack', label: 'uplink (lifecycle · stats · errors)' },
		])
	);
	return k.frame(W, H, P);
}

// =============================================================================
// N8 — Persistence model: DEVICE (Redis sorted set) vs APPLICATION (Kafka topic)
// =============================================================================
export function persistenceModel(k) {
	const W = 1240,
		H = 706;
	const P = [];

	const pDev = rectC(40, 56, 560, 548);
	const pApp = rectC(640, 56, 560, 548);
	P.push(k.groupBox({ ...pDev, label: 'Persistent DEVICE', kind: 'redis', labelKind: 'redis' }));
	P.push(k.groupBox({ ...pApp, label: 'Persistent APPLICATION', kind: 'kafka', labelKind: 'kafka' }));

	// Local stacked structure box: coloured header + left-aligned rows (mono or muted).
	const structBox = (x, y, w, title, kind, rows) => {
		const rh = 23;
		const headH = 34;
		const h = headH + rows.length * rh + 14;
		const kk = k.T.kinds[kind];
		P.push(
			`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${k.T.neutralSoft}" stroke="${kk.stroke}" stroke-width="1.4"/>`
		);
		P.push(k.text(x + 16, y + 21, title, { size: 12.5, weight: 700, fill: kk.ink }));
		let iy = y + headH + 14;
		for (const r of rows) {
			P.push(
				k.text(x + 18, iy, r.t, {
					size: r.mono ? 12 : 11.5,
					weight: r.mono ? 600 : 500,
					mono: !!r.mono,
					fill: r.mono ? kk.ink : k.T.inkSub,
				})
			);
			iy += rh;
		}
		return rectC(x, y, w, h);
	};

	// ---- LEFT: persistent DEVICE → Redis / Valkey sorted set ----
	const devIngest = { x: 120, y: 110, w: 400, h: 58 };
	P.push(k.kafkaTopic({ ...devIngest, name: 'tbmq.msg.persisted', note: 'ingest buffer · 12 partitions' }));
	// Member = the message key, score = a monotonic sequence (NOT the packet id,
	// which wraps at 0xffff); the body lives under its own key with a TTL.
	const devStore = structBox(90, 250, 460, 'Redis / Valkey — sorted set per client', 'redis', [
		{ t: '{clientId}_messages', mono: true },
		{ t: 'member = message key · score = monotonic seq', mono: false },
		{ t: '{clientId}_messages_7    ·    {clientId}_messages_8', mono: true },
		{ t: 'body: SET msgKey … EX = message expiry or TTL', mono: false },
		{ t: '{clientId}_last_packet_id', mono: true },
		{ t: 'packet-id counter · oldest evicted past messages-limit', mono: false },
	]);
	P.push(
		k.connector({
			from: [pDev.cx, devIngest.y + devIngest.h],
			to: [pDev.cx, devStore.y],
			type: 'flow',
			label: 'consume → store',
		})
	);
	structBox(90, 470, 460, 'On reconnect', 'redis', [
		{ t: 'ZRANGE oldest → newest, redeliver unacked', mono: false },
		{ t: 'each message removed from the set on ack', mono: false },
	]);

	// ---- RIGHT: persistent APPLICATION → dedicated Kafka topic ----
	const appTopic = { x: 700, y: 110, w: 440, h: 58 };
	P.push(k.kafkaTopic({ ...appTopic, name: 'tbmq.msg.app.$CLIENT_ID', note: 'dedicated · durable, replayable log' }));

	// partition / offset bar — filled cells before the committed offset, empty after
	const barY = 214,
		cellW = 46,
		cellH = 30,
		gap = 5,
		n = 8,
		filled = 5;
	const barX = pApp.cx - (n * (cellW + gap) - gap) / 2;
	const kk = k.T.kinds.kafka;
	for (let i = 0; i < n; i++) {
		const cx = barX + i * (cellW + gap);
		const isF = i < filled;
		P.push(
			`<rect x="${cx}" y="${barY}" width="${cellW}" height="${cellH}" rx="5" fill="${isF ? kk.fill : k.T.canvas}" stroke="${kk.stroke}" stroke-width="1.3" opacity="${isF ? 1 : 0.6}"/>`
		);
	}
	P.push(k.text(barX, barY - 12, 'partition (offset →)', { size: 10.5, weight: 600, fill: k.T.inkMuted }));
	const offX = barX + filled * (cellW + gap) - gap / 2;
	P.push(k.connector({ from: [offX, barY + cellH + 34], to: [offX, barY + cellH + 4], type: 'ack' }));
	P.push(
		k.text(offX, barY + cellH + 48, 'committed offset', { anchor: 'middle', size: 11, weight: 600, fill: k.T.inkSub })
	);

	P.push(k.connector({ from: [pApp.cx, appTopic.y + appTopic.h], to: [pApp.cx, barY], type: 'flow' }));
	structBox(690, 322, 460, 'Per-app consumer group', 'kafka', [
		{ t: 'application-persisted-msg-', mono: true },
		{ t: 'consumer-group-$CLIENT_ID', mono: true },
		{ t: 'one consumer per APPLICATION client', mono: false },
		{ t: 'ack = commit offset (no per-message delete)', mono: false },
	]);
	structBox(690, 470, 460, 'Shared subscriptions', 'kafka', [
		{ t: 'tbmq.msg.app.shared.$TOPIC_FILTER', mono: true },
		{ t: 'one group shared across APPLICATION clients', mono: false },
	]);

	P.push(
		cap(
			k,
			W,
			628,
			'Both types survive restarts but store differently: DEVICE messages in a per-client Redis/Valkey sorted set; APPLICATION messages in a dedicated per-client Kafka topic that acts as a replayable log.'
		)
	);
	P.push(
		cap(
			k,
			W,
			654,
			'DEVICE delivery removes messages on acknowledgement; APPLICATION delivery advances a committed offset.',
			{ size: 12 }
		)
	);
	P.push(
		cap(
			k,
			W,
			678,
			'$CLIENT_ID / $TOPIC_FILTER are documentation placeholders — the real suffix is the sanitised or SHA-256-hashed id.',
			{ size: 12 }
		)
	);
	return k.frame(W, H, P);
}
