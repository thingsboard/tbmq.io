// Single source of truth for the /mqtt/ learn hub: drives the hub grid, the
// Learn nav dropdown, related-topics, and per-page SEO.

export interface MqttTopic {
	/** URL slug → /mqtt/<slug>/ */
	slug: string;
	/** H1 + <title> (before the ' | TBMQ' suffix BaseLayout adds) */
	title: string;
	/** Short label for the nav dropdown + hub card */
	navLabel: string;
	/** Optional nav-dropdown icon: path under /src/assets/images/landings/nav/ (inlined + tinted). */
	icon?: string;
	/** Hero eyebrow */
	eyebrow: string;
	/** 2–3 sentence boxed definition (featured-snippet target) */
	quickAnswer: string;
	/** One-line "how TBMQ relates" summary (hub card + How-TBMQ block) */
	tbmqTieIn: string;
	/** Slugs shown in the related-topics grid */
	related: string[];
	/** 'full' = flagship article, 'short' = short-form scaffold */
	status: 'full' | 'short';
	/** Meta description */
	seoDescription: string;
}

export const mqttTopics: MqttTopic[] = [
	{
		slug: 'what-is-mqtt',
		title: "What Is MQTT? A Beginner's Guide to the Protocol",
		navLabel: 'What is MQTT?',
		icon: '/src/assets/images/landings/nav/learn-what-is-mqtt.svg',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT (Message Queuing Telemetry Transport) is a lightweight publish/subscribe messaging protocol built for constrained devices and low-bandwidth, unreliable networks. Clients publish messages to named topics on a central broker, which forwards each message to every client subscribed to that topic — decoupling senders from receivers.',
		tbmqTieIn:
			'TBMQ is an open-source MQTT broker (3.1, 3.1.1 and 5.0) engineered to scale to 100M+ concurrent connections.',
		related: ['mqtt-broker', 'mqtt-client', 'publish-subscribe', 'mqtt-vs-kafka'],
		status: 'full',
		seoDescription:
			"What is MQTT? A plain-English guide to the lightweight publish/subscribe protocol behind modern IoT — how it works, why it's used, and how it compares to HTTP.",
	},
	{
		slug: 'mqtt-vs-kafka',
		title: 'MQTT vs Kafka: Key Differences and When to Use Each',
		navLabel: 'MQTT vs Kafka',
		eyebrow: 'MQTT COMPARISON',
		quickAnswer:
			'MQTT is a lightweight pub/sub protocol for connecting devices over unreliable networks; Apache Kafka is a distributed event-streaming log for high-throughput backend data pipelines. They solve different problems and are frequently used together — MQTT at the edge, Kafka in the data center.',
		tbmqTieIn:
			'TBMQ uses Kafka as its internal backbone for durability and zero message loss, and can bridge MQTT traffic straight into your Kafka topics.',
		related: ['what-is-mqtt', 'mqtt-vs-http', 'persistent-session'],
		status: 'full',
		seoDescription:
			'MQTT vs Kafka compared: pub/sub protocol vs event-streaming log, delivery guarantees, scale, and when to use each — or both together.',
	},
	{
		slug: 'shared-subscriptions',
		title: 'MQTT Shared Subscriptions Explained',
		navLabel: 'Shared subscriptions',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'A shared subscription lets a group of MQTT clients share one subscription so each message is delivered to only one member of the group, instead of to all of them. That turns MQTT’s broadcast model into a load-balanced work queue for scaling consumers horizontally.',
		tbmqTieIn:
			'TBMQ implements shared subscriptions and pairs them with dedicated per-application Kafka topics, so you can add consumer instances to absorb high load and scale throughput horizontally.',
		related: ['what-is-mqtt', 'mqtt-5', 'mqtt-vs-kafka'],
		status: 'full',
		seoDescription:
			'How MQTT shared subscriptions work: the $share syntax, load balancing across a consumer group, MQTT 5.0 vs 3.1.1, and common pitfalls.',
	},
	{
		slug: 'qos',
		title: 'MQTT QoS 0, 1 and 2 Explained',
		navLabel: 'QoS levels',
		icon: '/src/assets/images/landings/nav/learn-qos.svg',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT Quality of Service (QoS) sets the delivery guarantee for each message: QoS 0 delivers at most once (fire-and-forget), QoS 1 at least once (may duplicate), and QoS 2 exactly once (handshaked). Higher QoS means stronger guarantees and more overhead.',
		tbmqTieIn:
			'TBMQ acknowledges a QoS 1/2 publish only after the message is persisted to Kafka — so an accepted message survives a TBMQ node failure, and with a replicated Kafka cluster it is not lost even if a Kafka node fails.',
		related: ['what-is-mqtt', 'persistent-session', 'mqtt-5'],
		status: 'full',
		seoDescription:
			'MQTT QoS levels 0, 1 and 2 explained simply — at-most-once, at-least-once and exactly-once delivery, with trade-offs and when to use each.',
	},
	{
		slug: 'mqtt-5',
		title: "MQTT 5.0: What's New vs MQTT 3.1.1",
		navLabel: 'MQTT 5.0',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT 5.0 is the latest version of the protocol. It keeps the lightweight pub/sub core of 3.1.1 and adds reason codes, user properties, topic aliases, shared subscriptions, message and session expiry, and flow control — giving you far better error reporting and control.',
		tbmqTieIn:
			'TBMQ fully supports MQTT 5.0 alongside 3.1 and 3.1.1, including reason codes, topic aliases, session/message expiry and flow control.',
		related: ['what-is-mqtt', 'mqtt-request-response', 'shared-subscriptions', 'topics'],
		status: 'full',
		seoDescription:
			'MQTT 5.0 vs 3.1.1: the key new features — reason codes, user properties, topic aliases, expiry, shared subscriptions and flow control.',
	},
	{
		slug: 'persistent-session',
		title: 'MQTT Persistent Sessions and Clean Start',
		navLabel: 'Persistent sessions',
		icon: '/src/assets/images/landings/nav/learn-session.svg',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'A persistent MQTT session lets the broker remember a client’s subscriptions and queue its messages while it is offline, so nothing is missed across reconnects. The Clean Start flag (MQTT 5.0) and Clean Session flag (3.1.1) control whether a fresh session is created or an existing one resumed.',
		tbmqTieIn:
			'TBMQ persists sessions differently per client type — DEVICE clients use Redis-backed queues, APPLICATION clients get a dedicated Kafka topic — so offline delivery scales to millions of devices.',
		related: ['qos', 'what-is-mqtt', 'shared-subscriptions'],
		status: 'full',
		seoDescription:
			'MQTT persistent sessions and clean start / clean session explained — how brokers queue messages for offline clients and resume state on reconnect.',
	},
	{
		slug: 'topics',
		title: 'MQTT Topics and Wildcards',
		navLabel: 'Topics & wildcards',
		icon: '/src/assets/images/landings/nav/learn-topics.svg',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT topics are hierarchical, slash-separated strings (e.g. sensors/floor1/temp) that messages are published to and clients subscribe to. Subscriptions can use wildcards: + matches a single level and # matches all remaining levels.',
		tbmqTieIn:
			'TBMQ matches subscriptions with an in-memory topic trie, so match cost scales with a topic’s depth rather than its total subscription count.',
		related: ['what-is-mqtt', 'shared-subscriptions', 'retained-messages'],
		status: 'full',
		seoDescription:
			'MQTT topics and wildcards explained — topic hierarchy, single-level (+) and multi-level (#) wildcards, and topic naming best practices.',
	},
	{
		slug: 'retained-messages',
		title: 'MQTT Retained Messages',
		navLabel: 'Retained messages',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'A retained message is the last message the broker stored for a topic with the retain flag set. Any client that subscribes later immediately receives that last known value instead of waiting for the next publish — ideal for state like a device’s current status.',
		tbmqTieIn:
			'TBMQ keeps retained messages in an in-memory trie backed by a compacted Kafka topic, so new subscribers get the latest value instantly and it survives restarts.',
		related: ['topics', 'what-is-mqtt', 'last-will'],
		status: 'full',
		seoDescription:
			'MQTT retained messages explained — how the retain flag stores the last value on a topic so new subscribers get current state immediately.',
	},
	{
		slug: 'last-will',
		title: 'MQTT Last Will and Testament (LWT)',
		navLabel: 'Last Will & Testament',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'The Last Will and Testament (LWT) is a message a client registers when it connects; if the client disconnects unexpectedly, the broker publishes that message on its behalf. It’s how MQTT signals that a device dropped off ungracefully.',
		tbmqTieIn:
			'TBMQ supports Last Will messages, so your applications can react the moment a device disconnects unexpectedly.',
		related: ['what-is-mqtt', 'retained-messages', 'persistent-session'],
		status: 'full',
		seoDescription:
			'MQTT Last Will and Testament (LWT) explained — how the broker publishes a client’s will message on unexpected disconnect to signal presence.',
	},
	{
		slug: 'security',
		title: 'MQTT Security: TLS and Authentication',
		navLabel: 'Security',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT security has three layers: transport encryption with TLS (port 8883), client authentication (username/password, client certificates, or tokens), and authorization that controls which topics a client may publish to or subscribe from.',
		tbmqTieIn:
			'TBMQ supports TLS, mutual TLS (X.509), basic username/password, JWT and SCRAM authentication, with per-client topic authorization.',
		related: ['what-is-mqtt', 'websocket', 'persistent-session'],
		status: 'full',
		seoDescription:
			'MQTT security explained — TLS encryption, authentication (passwords, client certificates, tokens) and topic authorization for a hardened broker.',
	},
	{
		slug: 'websocket',
		title: 'MQTT over WebSocket',
		navLabel: 'MQTT over WebSocket',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT over WebSocket carries the same MQTT protocol inside a WebSocket connection, so browsers and other HTTP-only clients can publish and subscribe directly. Brokers commonly expose it on port 8084 (WS) or 8085 (WSS).',
		tbmqTieIn:
			'TBMQ ships a built-in WebSocket MQTT client in its UI, so you can publish and subscribe straight from the browser — try it in the live demo.',
		related: ['mqtt-client', 'what-is-mqtt', 'security'],
		status: 'full',
		seoDescription:
			'MQTT over WebSocket explained — how the MQTT protocol runs inside a WebSocket so browser clients can publish and subscribe in real time.',
	},
	{
		slug: 'mqtt-broker',
		title: 'What Is an MQTT Broker?',
		navLabel: 'MQTT broker',
		icon: '/src/assets/images/landings/nav/learn-broker.svg',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'An MQTT broker is the central server that sits between MQTT clients: it receives every published message and routes it to the clients subscribed to the matching topic. The broker manages connections, subscriptions, per-QoS delivery, session state, and authentication — so publishers and subscribers never talk to each other directly.',
		tbmqTieIn:
			'TBMQ is an open-source MQTT broker (3.1, 3.1.1 and 5.0) engineered to scale to 100M+ concurrent connections on a single cluster.',
		related: ['what-is-mqtt', 'mqtt-client', 'mqtt-vs-kafka'],
		status: 'full',
		seoDescription:
			'What is an MQTT broker? How the central MQTT server routes messages between clients, manages sessions and QoS, and what to look for when choosing one.',
	},
	{
		slug: 'mqtt-client',
		title: 'What Is an MQTT Client?',
		navLabel: 'MQTT client',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'An MQTT client is any device or application that connects to an MQTT broker to publish messages, subscribe to topics, or both. Anything from an 8-bit microcontroller to a backend service or a browser tab can be a client, as long as it speaks the MQTT protocol over a supported transport.',
		tbmqTieIn:
			'TBMQ works with any standard MQTT client library and ships a built-in WebSocket MQTT client in its UI, so you can publish and subscribe straight from the browser.',
		related: ['mqtt-broker', 'what-is-mqtt', 'mqtt-client-id', 'websocket'],
		status: 'full',
		seoDescription:
			'What is an MQTT client? How devices and apps connect to a broker to publish and subscribe, the connect handshake, client IDs, and MQTT client libraries.',
	},
	{
		slug: 'publish-subscribe',
		title: 'MQTT Publish/Subscribe Explained',
		navLabel: 'Publish/subscribe',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT uses a publish/subscribe model: clients publish messages to named topics on a broker, and the broker delivers each message to every client subscribed to a matching topic. Publishers and subscribers are decoupled — they interact only through topics, never directly. The three core operations are PUBLISH, SUBSCRIBE, and UNSUBSCRIBE.',
		tbmqTieIn:
			'TBMQ matches every PUBLISH against subscriptions held in an in-memory topic trie and fans it out to all matching subscribers, so match cost scales with a topic’s depth rather than its total subscription count.',
		related: ['what-is-mqtt', 'topics', 'shared-subscriptions'],
		status: 'full',
		seoDescription:
			'MQTT publish/subscribe explained — how the pub/sub model decouples publishers and subscribers through topics, and how the PUBLISH, SUBSCRIBE and UNSUBSCRIBE operations work.',
	},
	{
		slug: 'mqtt-connection',
		title: 'MQTT Connection: CONNECT and CONNACK',
		navLabel: 'Connection (CONNECT)',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'An MQTT session begins with the client sending a CONNECT packet and the broker replying with CONNACK. CONNECT carries the client ID, the clean-start flag, the keep-alive interval, optional credentials and a Last Will; CONNACK returns a reason code and a session-present flag that tells the client whether the broker resumed an existing session.',
		tbmqTieIn:
			'TBMQ accepts MQTT 3.1, 3.1.1 and 5.0 CONNECTs, honors Clean Start and the session-present flag, and enforces one live connection per client ID — a second CONNECT with the same ID takes over, disconnecting the old session.',
		related: ['mqtt-client-id', 'keep-alive', 'persistent-session'],
		status: 'full',
		seoDescription:
			'MQTT CONNECT and CONNACK explained — the connection handshake, clean start vs session present, keep-alive negotiation, credentials, and CONNACK reason codes.',
	},
	{
		slug: 'mqtt-client-id',
		title: 'MQTT Client ID and Client Take-Over',
		navLabel: 'Client ID',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'The MQTT client ID is a string that uniquely identifies a client to the broker and links it to its session state. Only one connection per client ID may be active at a time: if a second client connects with an ID already in use, the broker performs a take-over — disconnecting the existing connection and keeping the new one.',
		tbmqTieIn:
			'TBMQ enforces one live connection per client ID across the whole cluster: a conflicting CONNECT takes over the session and disconnects the previous connection with reason SESSION_TAKEN_OVER, even when the two clients land on different nodes.',
		related: ['mqtt-connection', 'mqtt-client', 'persistent-session'],
		status: 'full',
		seoDescription:
			'MQTT client ID explained — what it is, uniqueness rules, how it maps to session state, and what happens on a client ID collision (client take-over).',
	},
	{
		slug: 'mqtt-packets',
		title: 'MQTT Packets: Control Packet Types',
		navLabel: 'MQTT packets',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT control packets are the messages exchanged between client and broker. Each has a fixed header of at least 2 bytes (packet type, flags and remaining length), an optional variable header, and an optional payload. The types include CONNECT/CONNACK, PUBLISH with its acknowledgements, SUBSCRIBE/SUBACK, UNSUBSCRIBE/UNSUBACK, PINGREQ/PINGRESP, DISCONNECT and — in MQTT 5.0 — AUTH.',
		tbmqTieIn:
			'TBMQ implements the full MQTT 3.1 / 3.1.1 / 5.0 control-packet set, including the MQTT 5.0 AUTH packet used for enhanced (SCRAM) authentication.',
		related: ['mqtt-connection', 'qos', 'publish-subscribe'],
		status: 'full',
		seoDescription:
			'MQTT packets explained — the control packet types (CONNECT, PUBLISH, SUBSCRIBE, PINGREQ, DISCONNECT, AUTH), the fixed and variable header structure, and the 2-byte minimum overhead.',
	},
	{
		slug: 'mqtt-request-response',
		title: 'MQTT Request-Response Pattern',
		navLabel: 'Request-response',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'The request-response pattern lets a requester get a reply over MQTT’s publish/subscribe transport. Made first-class in MQTT 5.0, the requester publishes with a Response Topic (where the reply should go) and Correlation Data (an ID to match the reply to the request); the responder publishes its answer to that topic, echoing the same Correlation Data.',
		tbmqTieIn:
			'TBMQ fully supports MQTT 5.0, carrying Response Topic, Correlation Data and User Properties through end to end, so request/response flows run over the same broker as the rest of your traffic.',
		related: ['mqtt-5', 'topics', 'publish-subscribe'],
		status: 'full',
		seoDescription:
			'MQTT request-response pattern explained — how MQTT 5.0 Response Topic and Correlation Data let a client send a request and correlate the reply over pub/sub.',
	},
	{
		slug: 'keep-alive',
		title: 'MQTT Keep-Alive and Ping Explained',
		navLabel: 'Keep-alive',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT keep-alive is a heartbeat between client and broker. The client promises to send at least one packet within each keep-alive interval; if it has nothing else to send, it sends a PINGREQ and the broker replies with PINGRESP. If the broker receives nothing for 1.5× the interval, it assumes the client is gone and closes the connection.',
		tbmqTieIn:
			'TBMQ monitors keep-alive per connection and, on timeout, closes it with reason KEEP_ALIVE_TIMEOUT and publishes the client’s Last Will if one was configured.',
		related: ['persistent-session', 'last-will', 'mqtt-connection', 'mqtt-client'],
		status: 'full',
		seoDescription:
			'MQTT keep-alive and ping explained — the PINGREQ/PINGRESP heartbeat, the 1.5× keep-alive timeout, half-open connections, and how brokers detect dead clients.',
	},
	{
		slug: 'mqtt-vs-http',
		title: 'MQTT vs HTTP: Which to Use for IoT',
		navLabel: 'MQTT vs HTTP',
		eyebrow: 'MQTT COMPARISON',
		quickAnswer:
			'HTTP is a request/response protocol built for the web: the client asks and the server answers, and it must ask again to get anything new. MQTT is a publish/subscribe protocol built for devices: a long-lived connection lets the broker push messages the instant they are published, with far less per-message overhead. For frequent, small, bidirectional IoT messaging, MQTT usually wins.',
		tbmqTieIn:
			'TBMQ speaks MQTT — including MQTT over WebSocket — so browsers and devices get real-time push instead of repeatedly polling an HTTP endpoint.',
		related: ['what-is-mqtt', 'mqtt-vs-kafka', 'mqtt-client'],
		status: 'full',
		seoDescription:
			'MQTT vs HTTP compared for IoT — pub/sub vs request/response, per-message overhead, push vs polling, and when each protocol is the right choice.',
	},
	{
		slug: 'mqtt-vs-amqp',
		title: 'MQTT vs AMQP: Differences and When to Use Each',
		navLabel: 'MQTT vs AMQP',
		eyebrow: 'MQTT COMPARISON',
		quickAnswer:
			'MQTT and AMQP are both messaging protocols aimed at different problems. MQTT is a lightweight publish/subscribe protocol optimized for large fleets of constrained devices over unreliable networks. AMQP is a richer, heavier protocol with queues, exchanges, and transactions, aimed at enterprise application-to-application messaging and interoperability.',
		tbmqTieIn:
			'TBMQ is a purpose-built MQTT broker focused on connecting massive device fleets, rather than a general-purpose AMQP message broker.',
		related: ['mqtt-vs-kafka', 'mqtt-vs-http', 'what-is-mqtt'],
		status: 'full',
		seoDescription:
			'MQTT vs AMQP compared — lightweight device pub/sub vs enterprise queues and exchanges, overhead, feature set, and when to use each protocol.',
	},
	{
		slug: 'mqtt-vs-coap',
		title: 'MQTT vs CoAP: Differences and When to Use Each',
		navLabel: 'MQTT vs CoAP',
		eyebrow: 'MQTT COMPARISON',
		quickAnswer:
			'MQTT and CoAP are both lightweight IoT protocols with different models. MQTT is a broker-based publish/subscribe protocol over long-lived TCP connections, ideal for pushing events to many subscribers. CoAP is a RESTful request/response protocol over UDP, ideal for occasional, one-to-one interactions with very constrained devices.',
		tbmqTieIn:
			'TBMQ is an MQTT broker built for large-scale pub/sub messaging; CoAP’s request/response model targets a different pattern for a different job.',
		related: ['mqtt-vs-http', 'what-is-mqtt', 'qos'],
		status: 'full',
		seoDescription:
			'MQTT vs CoAP compared — broker-based pub/sub over TCP vs RESTful request/response over UDP, and when to choose each for constrained IoT devices.',
	},
];

const bySlug = new Map(mqttTopics.map((t) => [t.slug, t]));

export function getTopic(slug: string): MqttTopic {
	const topic = bySlug.get(slug);
	if (!topic) throw new Error(`Unknown MQTT topic slug: ${slug}`);
	return topic;
}

export function topicHref(slug: string): string {
	return `/mqtt/${slug}/`;
}

export function relatedTopics(slug: string): MqttTopic[] {
	return getTopic(slug).related.map((s) => getTopic(s));
}

// Curated, ordered set shown in the "Learn" nav dropdown. This is independent of
// the hub grid order (which follows the mqttTopics array) — edit this list to
// change which topics appear in the dropdown and in what order.
export const learnNavSlugs = ['what-is-mqtt', 'mqtt-broker', 'qos', 'persistent-session', 'topics'];
export const learnNavTopics: MqttTopic[] = learnNavSlugs.map((slug) => getTopic(slug));
