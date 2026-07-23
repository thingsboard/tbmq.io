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
	/** One crisp sentence for the hub-grid card blurb (clamped to 2 lines) */
	cardSummary: string;
	/** One-line "how TBMQ relates" summary (hub card + How-TBMQ block) */
	tbmqTieIn: string;
	/** Slugs shown in the related-topics grid */
	related: string[];
	/** 'full' = flagship article, 'short' = short-form scaffold */
	status: 'full' | 'short';
	/** Marks the single entry-point card on the hub grid ("Start here" badge) */
	startHere?: boolean;
	/** Meta description */
	seoDescription: string;
}

export const mqttTopics: MqttTopic[] = [
	{
		slug: 'what-is-mqtt',
		title: "What Is MQTT? A Beginner's Guide to the Protocol",
		navLabel: 'What is MQTT?',
		cardSummary:
			'A lightweight publish/subscribe messaging protocol built for constrained devices and unreliable networks.',
		icon: '/src/assets/images/landings/nav/learn-what-is-mqtt.svg',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT (Message Queuing Telemetry Transport) is a lightweight publish/subscribe messaging protocol built for constrained devices and low-bandwidth, unreliable networks. Clients publish messages to named topics on a central broker, which forwards each message to every client subscribed to that topic — decoupling senders from receivers.',
		tbmqTieIn:
			'TBMQ is an open-source MQTT broker (3.1, 3.1.1 and 5.0) engineered to scale to 100M+ concurrent connections.',
		related: ['mqtt-broker', 'mqtt-client', 'publish-subscribe', 'mqtt-vs-kafka'],
		status: 'full',
		startHere: true,
		seoDescription:
			"What is MQTT? An introductory guide to the lightweight publish/subscribe protocol behind modern IoT — how it works, why it's used, and how it compares to HTTP.",
	},
	{
		slug: 'mqtt-vs-kafka',
		title: 'MQTT vs Kafka: Key Differences and When to Use Each',
		navLabel: 'MQTT vs Kafka',
		cardSummary: 'A device-edge protocol paired with a high-throughput backend event log.',
		eyebrow: 'MQTT COMPARISON',
		quickAnswer:
			'MQTT is a lightweight pub/sub protocol for connecting devices over unreliable networks; Apache Kafka is a distributed event-streaming log for high-throughput backend data pipelines. They solve different problems and are frequently used together — MQTT at the edge, Kafka in the data center.',
		tbmqTieIn:
			'TBMQ uses Kafka as its internal backbone for message durability, and can bridge MQTT traffic straight into your own Kafka topics.',
		related: ['what-is-mqtt', 'mqtt-vs-http', 'persistent-session'],
		status: 'full',
		seoDescription:
			'MQTT vs Kafka compared: pub/sub protocol vs event-streaming log, delivery guarantees, scale, and when to use each — or both together.',
	},
	{
		slug: 'shared-subscriptions',
		title: 'MQTT Shared Subscriptions Explained',
		navLabel: 'Shared subscriptions',
		cardSummary: 'Load-balance a subscription across a group so each message reaches only one member.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'A shared subscription lets a group of MQTT clients share one subscription so each message is delivered to only one member of the group, instead of to all of them. That turns MQTT’s broadcast model into a load-balanced work queue for scaling consumers horizontally.',
		tbmqTieIn:
			'TBMQ implements shared subscriptions and pairs them with dedicated per-application Kafka topics, so you can add consumer instances to absorb high load and scale throughput horizontally.',
		related: ['what-is-mqtt', 'mqtt-5', 'subscription-options', 'mqtt-vs-kafka'],
		status: 'full',
		seoDescription:
			'How MQTT shared subscriptions work: the $share syntax, load balancing across a consumer group, MQTT 5.0 vs 3.1.1, and common pitfalls.',
	},
	{
		slug: 'subscription-options',
		title: 'MQTT Subscription Options and Identifiers',
		navLabel: 'Subscription options & IDs',
		cardSummary: 'Per-subscription delivery flags, plus an identifier the broker echoes back on every match.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'Subscription options are per-subscription settings a client sends in the SUBSCRIBE packet that control how the broker delivers matching messages — the maximum QoS, and in MQTT 5.0 the No Local, Retain As Published, and Retain Handling flags. MQTT 5.0 also adds an optional Subscription Identifier: a number the client assigns to a subscription that the broker then stamps on every matching message it delivers, so the client can tell which subscription a message matched.',
		tbmqTieIn:
			'TBMQ honors all four subscription options and MQTT 5.0 subscription identifiers — echoing the identifier on every matching message — and lets you view and edit them per subscription in its UI.',
		related: ['mqtt-5', 'shared-subscriptions', 'retained-messages', 'topics'],
		status: 'full',
		seoDescription:
			'MQTT subscription options and identifiers explained — the No Local, Retain As Published and Retain Handling flags, the per-subscription maximum QoS, and the MQTT 5.0 subscription identifier the broker echoes back.',
	},
	{
		slug: 'qos',
		title: 'MQTT QoS 0, 1 and 2 Explained',
		navLabel: 'QoS levels',
		cardSummary: 'Per-message delivery guarantees: at most once, at least once, and exactly once.',
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
		cardSummary: 'The latest protocol version: reason codes, user properties, topic aliases, and more.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT 5.0 is the latest version of the protocol. It keeps the lightweight pub/sub core of 3.1.1 and adds reason codes, user properties, topic aliases, shared subscriptions, message and session expiry, and flow control — giving you far better error reporting and control.',
		tbmqTieIn:
			'TBMQ fully supports MQTT 5.0 alongside 3.1 and 3.1.1, including reason codes, topic aliases, session/message expiry and flow control.',
		related: ['mqtt-reason-codes', 'mqtt-user-properties', 'mqtt-message-expiry', 'shared-subscriptions'],
		status: 'full',
		seoDescription:
			'MQTT 5.0 vs 3.1.1: the key new features — reason codes, user properties, topic aliases, expiry, shared subscriptions and flow control.',
	},
	{
		slug: 'mqtt-message-expiry',
		title: 'MQTT Session and Message Expiry',
		navLabel: 'Session & message expiry',
		cardSummary: 'Controls for how long the broker keeps a session and its queued messages.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT 5.0 adds two expiry controls. The Session Expiry Interval sets how long the broker keeps a disconnected client’s session — its subscriptions and queued messages — before discarding it. The Message Expiry Interval sets how long an individual message stays valid while queued; if it expires before it can be delivered, the broker drops it.',
		tbmqTieIn:
			'TBMQ honors both: it caps the session expiry interval at one week, and when it finally delivers a queued message it reduces the message’s remaining expiry by the time it waited in the broker.',
		related: ['mqtt-5', 'persistent-session', 'retained-messages'],
		status: 'full',
		seoDescription:
			'MQTT session expiry and message expiry intervals explained — how MQTT 5.0 controls how long a disconnected session is kept and how long a queued message stays valid.',
	},
	{
		slug: 'mqtt-reason-codes',
		title: 'MQTT Reason Codes',
		navLabel: 'Reason codes',
		cardSummary: 'Single-byte status values attached to control packets to report outcomes.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'A reason code is a single-byte status value MQTT 5.0 attaches to control packets that report an outcome (CONNACK, PUBACK, SUBACK, DISCONNECT and more). Values below 0x80 mean success or a normal outcome; 0x80 and above signal a failure and say why. It replaces MQTT 3.1.1’s near-silent failures with actionable feedback.',
		tbmqTieIn:
			'TBMQ returns MQTT 5.0 reason codes across its acknowledgement packets, so a client learns exactly why a connect, publish, or subscribe was refused instead of just seeing the connection drop.',
		related: ['mqtt-5', 'mqtt-connection', 'qos'],
		status: 'full',
		seoDescription:
			'MQTT reason codes explained — the single-byte MQTT 5.0 result codes on CONNACK, PUBACK, SUBACK and DISCONNECT, the success vs failure ranges, and common codes.',
	},
	{
		slug: 'mqtt-user-properties',
		title: 'MQTT User Properties',
		navLabel: 'User properties',
		cardSummary: 'Arbitrary key–value pairs that travel with a message, like custom headers.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'User Properties are arbitrary UTF-8 key–value pairs you can attach to MQTT 5.0 packets — the MQTT equivalent of custom HTTP headers. They travel with the message and let you carry metadata such as a content type, tenant ID, or tracing token without encoding it into the topic or payload.',
		tbmqTieIn:
			'TBMQ passes User Properties through end to end, from the publishing client to every subscriber, untouched — so you can rely on them for routing hints and metadata.',
		related: ['mqtt-5', 'mqtt-payload-format', 'publish-subscribe', 'mqtt-request-response'],
		status: 'full',
		seoDescription:
			'MQTT user properties explained — the MQTT 5.0 key–value metadata you attach to messages like HTTP headers, how they are carried end to end, and what to use them for.',
	},
	{
		slug: 'mqtt-topic-alias',
		title: 'MQTT Topic Alias',
		navLabel: 'Topic alias',
		cardSummary: 'Replace a long topic name with a small integer for the life of a connection.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'A Topic Alias lets a client or broker replace a long topic name with a small integer for the life of a connection. The first PUBLISH sends the full topic plus an alias number; later PUBLISHes to the same topic send only the number, cutting bandwidth on repetitive, long topic names.',
		tbmqTieIn:
			'TBMQ supports topic aliases and advertises a Topic Alias Maximum of 10 by default (configurable, and 0 disables it), so a client can map its busiest topics to short integers.',
		related: ['mqtt-5', 'topics', 'mqtt-packets'],
		status: 'full',
		seoDescription:
			'MQTT topic alias explained — how MQTT 5.0 replaces a long topic string with a short integer per connection to save bandwidth, and how Topic Alias Maximum is negotiated.',
	},
	{
		slug: 'mqtt-flow-control',
		title: 'MQTT Flow Control',
		navLabel: 'Flow control',
		cardSummary: 'The Receive Maximum property caps in-flight QoS 1 and 2 messages per side.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT 5.0 flow control uses the Receive Maximum property: each side tells the other how many QoS 1 and QoS 2 messages it will accept without acknowledgement at once. The sender stops when that many are in flight and resumes as acknowledgements arrive, so a fast sender can’t overwhelm a slower receiver.',
		tbmqTieIn:
			'TBMQ enables flow control and advertises a Receive Maximum of 1000, so a client may have up to 1000 unacknowledged QoS 1/2 publishes in flight to the broker before it must wait for acknowledgements.',
		related: ['mqtt-5', 'qos', 'persistent-session'],
		status: 'full',
		seoDescription:
			'MQTT flow control explained — how the MQTT 5.0 Receive Maximum limits unacknowledged QoS 1 and 2 messages in flight so a fast sender cannot overwhelm a receiver.',
	},
	{
		slug: 'mqtt-payload-format',
		title: 'MQTT Payload Format Indicator and Content Type',
		navLabel: 'Payload format & content type',
		cardSummary: 'Flag a payload as UTF-8 text or bytes and give it a MIME-like content type.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'The MQTT 5.0 Payload Format Indicator and Content Type are two optional PUBLISH properties that describe a message’s payload. The Payload Format Indicator is a single byte — 0 for an unspecified byte stream, 1 for UTF-8 text — and the Content Type is a free-form UTF-8 string, usually a MIME type such as application/json. Both travel with the message to every subscriber, so a receiver can tell how to read a payload without inspecting it.',
		tbmqTieIn:
			'TBMQ carries both the Payload Format Indicator and Content Type end to end, from the publishing client through to every subscriber, untouched.',
		related: ['mqtt-5', 'mqtt-user-properties', 'mqtt-request-response'],
		status: 'full',
		seoDescription:
			'MQTT payload format indicator and content type explained — the MQTT 5.0 properties that flag a payload as UTF-8 or bytes and label it with a MIME-like content type.',
	},
	{
		slug: 'persistent-session',
		title: 'MQTT Persistent Sessions and Clean Start',
		navLabel: 'Persistent sessions',
		cardSummary: 'Letting the broker remember subscriptions and queue messages while a client is offline.',
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
		cardSummary: 'Hierarchical, slash-separated strings and the wildcards used to subscribe across them.',
		icon: '/src/assets/images/landings/nav/learn-topics.svg',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT topics are hierarchical, slash-separated strings (e.g. sensors/floor1/temp) that messages are published to and clients subscribe to. Subscriptions can use wildcards: + matches a single level and # matches all remaining levels.',
		tbmqTieIn:
			'TBMQ matches subscriptions with an in-memory topic trie, so match cost scales with a topic’s depth rather than its total subscription count.',
		related: ['what-is-mqtt', 'shared-subscriptions', 'subscription-options', 'retained-messages'],
		status: 'full',
		seoDescription:
			'MQTT topics and wildcards explained — topic hierarchy, single-level (+) and multi-level (#) wildcards, and topic naming best practices.',
	},
	{
		slug: 'retained-messages',
		title: 'MQTT Retained Messages',
		navLabel: 'Retained messages',
		cardSummary: 'The last message on a topic, delivered immediately to any new subscriber.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'A retained message is the last message the broker stored for a topic with the retain flag set. Any client that subscribes later immediately receives that last known value instead of waiting for the next publish — ideal for state like a device’s current status.',
		tbmqTieIn:
			'TBMQ keeps retained messages in an in-memory trie backed by a compacted Kafka topic, so new subscribers get the latest value instantly and it survives restarts.',
		related: ['topics', 'subscription-options', 'what-is-mqtt', 'last-will'],
		status: 'full',
		seoDescription:
			'MQTT retained messages explained — how the retain flag stores the last value on a topic so new subscribers get current state immediately.',
	},
	{
		slug: 'last-will',
		title: 'MQTT Last Will and Testament (LWT)',
		navLabel: 'Last Will & Testament',
		cardSummary: 'A message the broker publishes when a client disconnects unexpectedly.',
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
		cardSummary: 'The three layers: transport encryption, authentication, and authorization.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT security has three layers: transport encryption with TLS (port 8883), client authentication (username/password, client certificates, or tokens), and authorization that controls which topics a client may publish to or subscribe from.',
		tbmqTieIn:
			'TBMQ supports TLS, mutual TLS (X.509), basic username/password, JWT and SCRAM authentication, with per-client topic authorization.',
		related: ['mqtt-tls', 'mqtt-authentication', 'mqtt-authorization', 'mqtt-client-certificates'],
		status: 'full',
		seoDescription:
			'MQTT security explained — TLS encryption, authentication (passwords, client certificates, tokens) and topic authorization for a hardened broker.',
	},
	{
		slug: 'mqtt-tls',
		title: 'MQTT over TLS/SSL',
		navLabel: 'TLS / SSL',
		cardSummary: 'Wrapping the MQTT connection in an encrypted channel on port 8883.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT over TLS (often written MQTTS) wraps the MQTT connection in a TLS-encrypted channel, so credentials and payloads can’t be read or tampered with on the wire. It runs on port 8883 by default, versus 1883 for plaintext MQTT. TLS can also authenticate the client with a certificate (mutual TLS).',
		tbmqTieIn:
			'TBMQ exposes TLS listeners for MQTT on port 8883 and secure WebSocket (WSS) on 8085; both are provided but ship disabled until you configure a server certificate.',
		related: ['security', 'mqtt-client-certificates', 'mqtt-connection'],
		status: 'full',
		seoDescription:
			'MQTT over TLS/SSL explained — how MQTTS encrypts the connection on port 8883, the TLS handshake, one-way vs mutual TLS, and why plaintext 1883 should not face the internet.',
	},
	{
		slug: 'mqtt-authentication',
		title: 'MQTT Authentication',
		navLabel: 'Authentication',
		cardSummary: 'How the broker verifies a client’s identity: passwords, tokens, or certificates.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT authentication is how the broker verifies a client’s identity when it connects. Common methods are username/password, signed tokens such as JWT, and challenge-response schemes like SCRAM; client certificates (mutual TLS) are a separate option. The broker checks the credential on CONNECT and refuses the connection if it fails.',
		tbmqTieIn:
			'TBMQ ships pluggable authentication providers — Basic (username/password), JWT, SCRAM over the MQTT 5.0 AUTH packet, X.509 client certificates, and an HTTP provider that defers to your own service. OAuth 2.0 identity providers are used indirectly, by issuing a JWT the client presents.',
		related: ['security', 'mqtt-client-certificates', 'mqtt-authorization'],
		status: 'full',
		seoDescription:
			'MQTT authentication explained — verifying clients with username/password, JWT tokens and SCRAM challenge-response, how the broker checks credentials on CONNECT, and how OAuth fits in.',
	},
	{
		slug: 'mqtt-client-certificates',
		title: 'MQTT Client Certificate Authentication (X.509)',
		navLabel: 'Client certificates',
		cardSummary: 'Mutual TLS, where the client presents an X.509 certificate during the handshake.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'Client certificate authentication uses mutual TLS (mTLS): as well as the broker proving its identity, the client presents an X.509 certificate during the TLS handshake. The broker trusts it if it chains to a trusted CA and identifies the client from the certificate — so no password is ever sent.',
		tbmqTieIn:
			'TBMQ supports X.509 client certificate authentication over a mutual-TLS listener, matching the certificate’s common name (CN) against stored credentials by exact value or a regular expression.',
		related: ['security', 'mqtt-tls', 'mqtt-authentication'],
		status: 'full',
		seoDescription:
			'MQTT client certificate authentication explained — how mutual TLS (mTLS) uses an X.509 client certificate to identify a client during the handshake, with no password sent.',
	},
	{
		slug: 'mqtt-authorization',
		title: 'MQTT Authorization and ACLs',
		navLabel: 'Authorization',
		cardSummary: 'Deciding which topics an authenticated client may publish to and subscribe from.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'Authorization decides what an authenticated MQTT client is allowed to do — which topics it may publish to and which it may subscribe to. Brokers enforce this with access-control rules (ACLs) attached to each client’s credentials, so being connected doesn’t mean a client can touch every topic.',
		tbmqTieIn:
			'TBMQ authorizes publish and subscribe separately, per client credentials, using regular-expression topic patterns; the default rule allows all topics, so you tighten it to scope each client to exactly what it needs.',
		related: ['security', 'mqtt-authentication', 'topics'],
		status: 'full',
		seoDescription:
			'MQTT authorization and ACLs explained — how brokers restrict which topics an authenticated client may publish to or subscribe from, and why authentication alone is not enough.',
	},
	{
		slug: 'mqtt-payload-encryption',
		title: 'MQTT Payload Encryption',
		navLabel: 'Payload encryption',
		cardSummary: 'End-to-end encryption of the payload itself, independent of the transport.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'Payload encryption means encrypting the message payload itself, inside the MQTT packet, so only the intended recipients can read it — end to end, independent of the transport. It complements TLS: TLS protects data in transit to and from the broker, while payload encryption keeps it unreadable even to the broker.',
		tbmqTieIn:
			'TBMQ treats every payload as opaque bytes — it never inspects or modifies message content — so client-side payload encryption passes through the broker unchanged, end to end.',
		related: ['security', 'mqtt-tls', 'mqtt-user-properties'],
		status: 'full',
		seoDescription:
			'MQTT payload encryption explained — encrypting the message payload end to end so it stays private even from the broker, how it differs from TLS, and where it fits.',
	},
	{
		slug: 'websocket',
		title: 'MQTT over WebSocket',
		navLabel: 'MQTT over WebSocket',
		cardSummary: 'Carrying MQTT inside a WebSocket so browsers can publish and subscribe.',
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
		cardSummary: 'The central server that receives every published message and routes it to matching subscribers.',
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
		cardSummary: 'Any device or app that connects to a broker to publish, subscribe, or both.',
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
		cardSummary: 'The messaging model MQTT is built on: senders and receivers share only a topic.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT uses a publish/subscribe model: clients publish messages to named topics on a broker, and the broker delivers each message to every client subscribed to a matching topic. Publishers and subscribers are decoupled — they interact only through topics, never directly. The three core operations are PUBLISH, SUBSCRIBE, and UNSUBSCRIBE.',
		tbmqTieIn:
			'TBMQ matches every PUBLISH against subscriptions held in an in-memory topic trie and fans it out to all matching subscribers, so match cost scales with a topic’s depth rather than its total subscription count.',
		related: ['what-is-mqtt', 'topics', 'shared-subscriptions', 'mqtt-request-response'],
		status: 'full',
		seoDescription:
			'MQTT publish/subscribe explained — how the pub/sub model decouples publishers and subscribers through topics, and how the PUBLISH, SUBSCRIBE and UNSUBSCRIBE operations work.',
	},
	{
		slug: 'mqtt-connection',
		title: 'MQTT Connection: CONNECT and CONNACK',
		navLabel: 'Connection (CONNECT)',
		cardSummary: 'How a session begins: the CONNECT packet, CONNACK, clean-start flag, and keep-alive.',
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
		cardSummary: 'The unique string that identifies a client and links it to its session state.',
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
		cardSummary: 'The control packets clients and brokers exchange, from CONNECT to PUBLISH.',
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
		cardSummary: 'A first-class reply pattern over pub/sub using a response topic.',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'The request-response pattern lets a requester get a reply over MQTT’s publish/subscribe transport. Made first-class in MQTT 5.0, the requester publishes with a Response Topic (where the reply should go) and Correlation Data (an ID to match the reply to the request); the responder publishes its answer to that topic, echoing the same Correlation Data.',
		tbmqTieIn:
			'TBMQ fully supports MQTT 5.0, carrying Response Topic, Correlation Data and User Properties through end to end, so request/response flows run over the same broker as the rest of your traffic.',
		related: ['mqtt-5', 'topics', 'mqtt-payload-format', 'publish-subscribe'],
		status: 'full',
		seoDescription:
			'MQTT request-response pattern explained — how MQTT 5.0 Response Topic and Correlation Data let a client send a request and correlate the reply over pub/sub.',
	},
	{
		slug: 'keep-alive',
		title: 'MQTT Keep-Alive and Ping Explained',
		navLabel: 'Keep-alive',
		cardSummary: 'The heartbeat that keeps a connection alive and detects dead peers.',
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
		cardSummary: 'Push-based pub/sub versus short-lived request/response — and when each fits.',
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
		cardSummary: 'Two messaging protocols aimed at different problems and fleet sizes.',
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
		cardSummary: 'Broker-based pub/sub over TCP versus a lightweight request model over UDP.',
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

// Grouping for the /mqtt hub grid. The order of categories here is the section
// order on the page, and the slug order within each category is the card order.
// This is the single place the hub taxonomy lives; the completeness guard below
// fails the build if it ever drifts from the topic registry.
// Per-category accent color for the hub grid (filter pill dot, section chip +
// rule, and card tag). Resolved to concrete CSS custom properties in TopicGrid.
export type MqttAccent = 'green' | 'blue' | 'purple' | 'amber' | 'teal';

export interface MqttCategory {
	id: string;
	label: string;
	/** Short label shown on the card tag (e.g. "Fundamentals") */
	tag: string;
	/** Accent color applied across the category's grid section */
	accent: MqttAccent;
	slugs: string[];
}

export const mqttCategories: MqttCategory[] = [
	{
		id: 'fundamentals',
		label: 'MQTT fundamentals',
		tag: 'Fundamentals',
		accent: 'green',
		slugs: [
			'what-is-mqtt',
			'mqtt-broker',
			'mqtt-client',
			'publish-subscribe',
			'topics',
			'retained-messages',
			'qos',
			'mqtt-packets',
		],
	},
	{
		id: 'connections',
		label: 'Connections & sessions',
		tag: 'Connections',
		accent: 'blue',
		slugs: ['mqtt-connection', 'mqtt-client-id', 'keep-alive', 'persistent-session', 'last-will'],
	},
	{
		id: 'mqtt-5',
		label: 'MQTT 5.0 features',
		tag: 'MQTT 5.0',
		accent: 'purple',
		slugs: [
			'mqtt-5',
			'shared-subscriptions',
			'subscription-options',
			'mqtt-request-response',
			'mqtt-reason-codes',
			'mqtt-user-properties',
			'mqtt-payload-format',
			'mqtt-topic-alias',
			'mqtt-flow-control',
			'mqtt-message-expiry',
		],
	},
	{
		id: 'security',
		label: 'Security',
		tag: 'Security',
		accent: 'amber',
		slugs: [
			'security',
			'mqtt-tls',
			'mqtt-authentication',
			'mqtt-client-certificates',
			'mqtt-authorization',
			'mqtt-payload-encryption',
		],
	},
	{
		id: 'comparisons',
		label: 'Transports & comparisons',
		tag: 'Transports',
		accent: 'teal',
		slugs: ['websocket', 'mqtt-vs-http', 'mqtt-vs-kafka', 'mqtt-vs-amqp', 'mqtt-vs-coap'],
	},
];

// Guard: every topic must appear in exactly one category. This fails the build
// loudly if a newly added topic is left out of the grid, or a slug is duplicated
// or misspelled — the same fail-fast contract getTopic() gives related[].
{
	const seen = new Set<string>();
	for (const category of mqttCategories) {
		for (const slug of category.slugs) {
			if (seen.has(slug)) throw new Error(`MQTT category slug listed twice: ${slug}`);
			seen.add(slug);
			getTopic(slug); // throws on an unknown slug
		}
	}
	for (const topic of mqttTopics) {
		if (!seen.has(topic.slug)) {
			throw new Error(`MQTT topic missing from mqttCategories: ${topic.slug}`);
		}
	}
}

export interface MqttCategoryGroup {
	id: string;
	label: string;
	tag: string;
	accent: MqttAccent;
	topics: MqttTopic[];
}

// Topics resolved and grouped for the hub grid, in category → slug order.
export const mqttCategoryGroups: MqttCategoryGroup[] = mqttCategories.map((category) => ({
	id: category.id,
	label: category.label,
	tag: category.tag,
	accent: category.accent,
	topics: category.slugs.map((slug) => getTopic(slug)),
}));
