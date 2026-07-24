# TBMQ Architecture — ASCII blueprints (clean-room, code-grounded)

Text blueprints for all **16** architecture diagrams, in page (ToC) order. Every blueprint is designed from the
**TBMQ source and the architecture**, not traced from the existing SVGs — so you can render these and compare them
against the committed diagrams to pick the best. Each carries a `code:` line with the classes/topics it derives from.

All names verified against `thingsboard/tbmq` (CE). `$CLIENT_ID` / `$SERVICE_ID` / `$TOPIC_FILTER` are **documentation
placeholders** — the real suffix is a code-concatenated, sanitised-or-SHA-256-hashed id (`MqttApplicationClientUtil`,
`DownLinkPublisherHelperImpl`). The committed SVGs referenced by `svg:` are **unchanged**; these blueprints are the
independent candidates.

Common ingest path (shared by all message flows): `MqttPublishHandler` → `MsgDispatcherService.persistPublishMsg`
→ `PublishMsgQueuePublisher` → **`tbmq.msg.all`** → `PublishMsgConsumerService` → `MsgDispatcherService.processPublishMsg`
→ Subscription Trie. Split rule (`PersistentMsgSubscriptions`): a subscriber takes the persistent path only if
`session.isPersistent() && subQoS != 0`; otherwise (or for a QoS-0 publish) it takes the basic/immediate path.

Accent legend:
```
«client» MQTT clients   «transport» Netty listeners / LB   «core» actors, dispatcher, trie
«kafka»  Kafka topics   «redis» Redis/Valkey               «pg» PostgreSQL   «ie» Integration Executor
───▶ data flow   ═(gate)═ Kafka persist   ╌╌▶ ack / return   ····▶ cross-node Kafka hop
```

---

## 1 · Top-level layered map · `svg: tbmq-architecture` · ToC: Architecture diagram
Purpose: one node + the services around it, and where a message enters and leaves.
```
┌─────────────────── clients «client» ───────────────────┐
│  Devices (publishers)            Applications (subs)     │
└───────┬───────────────────────────────────▲─────────────┘
        │ MQTT 3.1.1 / 5.0                    │ deliver (MqttMsgDeliveryService)
        ▼                                     │
┌── Netty listeners «transport» (MqttChannelInitializer) ──┐
│  TCP 1883 · WS 8084  [on]      SSL 8883 · WSS 8085 [off]  │
└───────┬───────────────────────────────────────────────────┘
        ▼  Client actor (per connection)
┌── TBMQ node «core» ──────────────────────────────────────┐
│  MsgDispatcherService ─▶ Subscription Trie ─▶ persist/route│      ┌ Web UI / REST «core» ┐
└──┬─────────────────────────────────────────────┬──────────┘      └───────────▲───────────┘
   │ produce / consume                             │ manage ─────────────────────┘
   ▼                                               ▼
┌── Apache Kafka «kafka» — durability backbone ──────────────┐
│ tbmq.msg.all · tbmq.msg.persisted · tbmq.msg.app.$CLIENT_ID · tbmq.msg.ie │
└──┬───────────────┬────────────────┬────────────────────────┘
   ▼               ▼                ▼
┌ Redis/Valkey ┐ ┌ PostgreSQL ┐ ┌ Integration Executor «ie» ┐──▶ HTTP · MQTT · Kafka
│ DEVICE msgs   │ │ metadata    │ │ separate JVM (:8082)       │    (external systems)
│ ZSET/client   │ │ no payloads │ └────────────────────────────┘
└───────────────┘ └─────────────┘
code: server/MqttChannelInitializer · processing/MsgDispatcherServiceImpl · subscription/ConcurrentMapSubscriptionTrie · dao/DeviceMsgServiceImpl(Redis)
```

## 2 · PUBLISH lifecycle · `svg: tbmq-publish-lifecycle` · ToC: How TBMQ works
Purpose: the ack is emitted only after Kafka persists; fan-out is asynchronous.
```
── synchronous (blocks the PUBACK) ───────────────────────────────────────────────
Publisher ─PUBLISH─▶ Client actor ─▶ MsgDispatcher.persistPublishMsg
                                         │ PublishMsgQueuePublisher.sendMsg
                                         ▼
                               Kafka: append to tbmq.msg.all
                                         │ producer ack (offset committed)
                     ┌───────────────────┘  ◀── DURABILITY GATE
                     ▼
Publisher ◀╌ PUBACK (QoS1) / PUBREC (QoS2) ╌ Client actor           (QoS 0: no ack)

── asynchronous (independent of the ack) ─────────────────────────────────────────
PublishMsgConsumerService.consume(tbmq.msg.all)
          │ MsgDispatcher.processPublishMsg → Subscription Trie (getSubscriptions)
          ▼ split: non-persistent → deliver now · persistent → collect
route by subscriber type (flows 5–11) ─▶ MqttMsgDeliveryService ─▶ Subscriber(s)
code: server/MqttPublishHandler:225 · MsgDispatcherServiceImpl.persistPublishMsg/processPublishMsg · PublishMsgQueuePublisherImpl · PublishMsgConsumerServiceImpl
```

## 3 · QoS / durability timeline · `svg: tbmq-qos-durability` · ToC: How TBMQ works
Purpose: QoS 0/1/2 handshakes aligned to the single Kafka persistence gate.
```
              ┌──────── Kafka persistence gate: append to tbmq.msg.all ────────┐
 QoS 0  Client ─PUBLISH─▶ TBMQ │ store │ (no ack)                                │
 QoS 1  Client ─PUBLISH─▶ TBMQ │ store │═▶ PUBACK ╌╌▶ Client                     │
 QoS 2  Client ─PUBLISH─▶ TBMQ │ store │═▶ PUBREC ╌╌▶ Client                     │
                                        Client ─PUBREL─▶ TBMQ ─PUBCOMP╌╌▶ Client │
              └─────────────────────────────────────────────────────────────────┘
   every acknowledgement is emitted only AFTER the append to tbmq.msg.all.
   survives a broker-node failure; shipped defaults acks=1 / replication.factor=1
   ⇒ run a replicated Kafka cluster to also survive a Kafka-broker failure.
code: actors/client/service/handlers/MqttPublishHandler (+PubAck/PubRec/PubRel/PubComp) · TB_KAFKA_DEFAULT_PRODUCER_ACKS:1
```

## 4 · Client-type decision tree · `svg: tbmq-client-type-decision` · ToC: How TBMQ works
Purpose: how session flags + client type + sub-QoS pick the storage/delivery path.
```
                ┌──── PUBLISH matched to a subscriber (PersistentMsgSubscriptions) ────┐
                └──────────────────────────┬───────────────────────────────────────────┘
                       session.isPersistent() AND subQoS > 0 ?
                    no │                                        │ yes
                       ▼                                        ▼
             ┌ BASIC path ┐                        ┌ client type (from credentials) ┐
             │ deliver now │                        └──────┬──────────────────┬───────┘
             │ nothing kept│                            DEVICE            APPLICATION
             └─────────────┘                              ▼                    ▼
   (clean session, OR any QoS-0 sub,         ┌ tbmq.msg.persisted ┐  ┌ tbmq.msg.app.$CLIENT_ID ┐
    OR QoS-0 publish → always basic)         │ → Redis/Valkey ZSET │  │ dedicated Kafka topic    │
                                             └─────────────────────┘  └──────────────────────────┘
code: processing/data/PersistentMsgSubscriptions (isPersistent && subQoS!=0) · MsgPersistenceManagerImpl (DEVICE/APP split)
```

## 5 · Non-persistent DEVICE — single node · `svg: tbmq-non-persistent-dev` · ToC: Non-persistent client
Purpose: fastest path — deliver in memory, store nothing.
```
Publisher ─PUBLISH─▶ Client actor ─▶ MsgDispatcher.persistPublishMsg
                                          │ produce
                                          ▼
                                 Kafka tbmq.msg.all ═(gate)═╌╌▶ PUBACK ▶ Publisher
                                          │ PublishMsgConsumerService.consume
                                          ▼
                                 processPublishMsg → Subscription Trie
                                          │ subscriber non-persistent → DownLinkProxy.sendBasicMsg
                                          ▼ same node ⇒ NO Kafka hop
                                 BasicDownLinkProcessor → MqttMsgDeliveryService ─deliver─▶ Subscriber
   storage: none (never enters msgPersistenceManager).
code: DownLinkProxyImpl.sendBasicMsg(local, belongsToThisNode) · BasicDownLinkProcessorImpl.process(Subscription)
```

## 6 · Non-persistent DEVICE — cluster · `svg: tbmq-non-persist-dev-cluster` · ToC: Non-persistent client
Purpose: subscriber lives on another node → forward over Kafka.
```
       NODE A — consumes tbmq.msg.all                       NODE B — owns the subscriber connection
Publisher ─▶ MsgDispatcher ─produce─▶ Kafka tbmq.msg.all ═(gate)═╌╌▶ PUBACK ▶ Publisher
                                          │ consume → processPublishMsg → Trie
                                          ▼ subscriber serviceId = B (remote)
                                 DownLinkProxy.sendBasicMsg(remote)
                                          │ DownLinkQueuePublisher.publishBasicMsg
                                          ▼
                    Kafka tbmq.msg.downlink.basic.$SERVICE_ID(B) ····▶ BasicDownLinkConsumer (on B)
                                                                            │ BasicDownLinkProcessor.process(clientId)
                                                                            ▼
                                                             MqttMsgDeliveryService ─deliver─▶ Subscriber
   storage: none. cross-node hop = tbmq.msg.downlink.basic.<serviceId> (payload ClientPublishMsgProto).
code: DownLinkQueuePublisherImpl.publishBasicMsg · BasicDownLinkConsumerImpl · DownLinkPublisherHelperImpl
```

## 7 · Persistence model · `svg: tbmq-persistence-model` [BUILT — new] · ToC: Persistent client
Purpose: storage internals — DEVICE (Redis sorted set) vs APPLICATION (dedicated Kafka topic).
```
┌──── Persistent DEVICE «redis» ─────────────┐   ┌──── Persistent APPLICATION «kafka» ────────────┐
│ ┌ tbmq.msg.persisted «kafka» ┐             │   │ ┌ tbmq.msg.app.$CLIENT_ID «kafka» ┐            │
│ │ ingest buffer · 12 partitions│            │   │ │ dedicated · durable, replayable log│          │
│ └──────────────┬───────────────┘            │   │ └───────────────┬────────────────────┘          │
│    consume → store ▼                         │   │  partition(offset →) ▓▓▓▓▓░░░ ↑ committed offset │
│ ┌ Redis / Valkey — sorted set per client ┐  │   │ ┌ Per-app consumer group ┐                      │
│ │ {clientId}_messages                     │  │   │ │ application-persisted-msg-              │      │
│ │ score = packet id → message key         │  │   │ │ consumer-group-$CLIENT_ID               │      │
│ │ packet 7 → msg:2f9c · packet 8 → msg:6b1a│  │   │ │ one consumer per APPLICATION client     │      │
│ │ each value: SET msgKey … EX = TTL       │  │   │ │ ack = commit offset (no per-msg delete) │      │
│ │ {clientId}_last_packet_id (counter)     │  │   │ └──────────────────────────────────────────┘   │
│ └──────────────────────────────────────────┘  │   │ ┌ Shared subs: tbmq.msg.app.shared.$TOPIC_FILTER ┐│
│ ┌ On reconnect: ZRANGE(REV)→redeliver unacked ┐│   │ └──────────────────────────────────────────────────┘│
│ └─────────────────────────────────────────────┘│   └─────────────────────────────────────────────────┘
└──────────────────────────────────────────────┘
code: dao/DeviceMsgServiceImpl (Lettuce+Lua ZADD/SET) · ClientIdMessagesCacheKey · ApplicationMsgQueuePublisherImpl · MqttApplicationClientUtil
```

## 8 · Persistent DEVICE — single node · `svg: tbmq-persistent-dev` · ToC: Persistent DEVICE client
Purpose: store in Redis first, then deliver; survives offline.
```
Publisher ─▶ MsgDispatcher ─produce─▶ Kafka tbmq.msg.all ═(gate)═╌╌▶ PUBACK ▶ Publisher
                                          │ consume → Trie → persistent DEVICE (subQoS>0)
                                          ▼ MsgPersistenceManager → DeviceMsgQueuePublisher.sendMsg
                                 Kafka tbmq.msg.persisted   (key = clientId)
                                          │ DeviceMsgQueueConsumer
                                          ▼
                       ① STORE  DeviceMsgProcessor → DeviceMsgService (Lettuce+Lua)
                                «redis» ZSET {clientId}_messages (ZADD score=packetId · SET msg EX=TTL)
                                          │ only after store succeeds
                                          ▼
                       ② DELIVER DownLinkProxy.sendPersistentMsg(local)
                                → PersistentDownLinkProcessor → DeviceActorManager
                                → Persisted-DEVICE actor → MqttMsgDeliveryService ─deliver─▶ Subscriber
   order: STORE-then-DELIVER. offline → redelivered from Redis on reconnect (ZRANGE REV).
code: MsgPersistenceManagerImpl.sendDeviceMsg · DeviceMsgQueuePublisherImpl · DeviceMsgQueueConsumerImpl · DeviceMsgProcessorImpl · actors PersistedDeviceActor
```

## 9 · Persistent DEVICE — cluster · `svg: tbmq-persist-dev-cluster` · ToC: Persistent DEVICE client
Purpose: the consuming node stores; delivery is routed to the subscriber's owner node.
```
     NODE A — consumes tbmq.msg.persisted (key=clientId)         NODE B — device is connected here
Publisher ─▶ … Kafka tbmq.msg.all ═(gate)═╌╌▶ PUBACK ▶ Publisher
                   │ consume → Trie → persistent DEVICE
                   ▼ DeviceMsgQueuePublisher.sendMsg
         Kafka tbmq.msg.persisted
                   │ DeviceMsgQueueConsumer (on A)
                   ▼
  ① STORE  DeviceMsgProcessor → «redis» ZSET {clientId}_messages    (A stores; B never re-stores)
                   │ deliver routed by session.serviceId = B ⇒ DownLinkProxy.sendPersistentMsg(remote)
                   │ DownLinkQueuePublisher.publishPersistentMsg
                   ▼
  Kafka tbmq.msg.downlink.persisted.$SERVICE_ID(B) ····▶ PersistentDownLinkConsumer (on B)
                                                              │ PersistentDownLinkProcessor
                                                              ▼ DeviceActorManager → Persisted-DEVICE actor
                                                         MqttMsgDeliveryService ─deliver─▶ Subscriber
   nuance: the node that consumes tbmq.msg.persisted may differ from the device's node — store-then-forward.
code: DownLinkQueuePublisherImpl.publishPersistentMsg · PersistentDownLinkConsumerImpl · PersistentDownLinkProcessorImpl
```

## 10 · Persistent APPLICATION — single node · `svg: tbmq-app` · ToC: Persistent APPLICATION client
Purpose: a dedicated per-client Kafka topic as a replayable inbox.
```
Publisher ─▶ MsgDispatcher ─produce─▶ Kafka tbmq.msg.all ═(gate)═╌╌▶ PUBACK ▶ Publisher
                                          │ consume → Trie → persistent APPLICATION
                                          ▼ MsgPersistenceManager → ApplicationMsgQueuePublisher.sendMsg (partition 0)
                                 Kafka tbmq.msg.app.$CLIENT_ID   (dedicated topic)
                                          │ ApplicationPersistenceProcessor — dedicated per-app consumer
                                          ▼
                                 MqttMsgDeliveryService ─deliver─▶ APPLICATION client
   ack = commit Kafka offset (no per-message delete). offline → messages wait in the topic.
code: MsgPersistenceManagerImpl.sendApplicationMsg · ApplicationMsgQueuePublisherImpl · ApplicationPersistenceProcessorImpl (commitSync)
```

## 11 · Persistent APPLICATION — cluster · `svg: tbmq-app-cluster` · ToC: Persistent APPLICATION client
Purpose: no internode hop — the consumer runs on the node the client connects to.
```
     (publish may be consumed on any node)                NODE where the APP client is connected
Publisher ─▶ … Kafka tbmq.msg.all ═(gate)═╌╌▶ PUBACK ▶ Publisher
                   │ consume → Trie → APPLICATION
                   ▼ ApplicationMsgQueuePublisher.sendMsg
         Kafka tbmq.msg.app.$CLIENT_ID ─────────────────────▶ ApplicationPersistenceProcessor
                                                             (dedicated consumer, STARTED on CONNECT,
                                                              STOPPED on DISCONNECT — reads locally)
                                                                  │
                                                                  ▼
                                                     MqttMsgDeliveryService ─deliver─▶ APP client
   NO DownLinkProxy / downlink topic on the APPLICATION path. offset commit = ack.
   client connected nowhere ⇒ no consumer runs; messages accumulate in tbmq.msg.app.$CLIENT_ID.
code: ConnectServiceImpl:220 → startProcessingPersistedMessages · DisconnectServiceImpl:179 → stopProcessingPersistedMessages
```

## 12 · Kafka topics map · `svg: tbmq-kafka-topics` [BUILT — 5th group added] · ToC: Kafka topics
Purpose: topics grouped by function + scope, with default partition counts.
```
┌ Message flow «kafka» ─────────────────────┐  ┌ Session & subscription state «pg» ───────┐
│ tbmq.msg.all             [global] p=16     │  │ tbmq.client.session          [global]      │
│ tbmq.msg.persisted       [global] p=12     │  │ tbmq.client.subscriptions    [global]      │
│ tbmq.msg.app.$CLIENT_ID  [per-client]      │  │ tbmq.client.session.event.request  p=24    │
│ tbmq.msg.app.shared.$TOPIC_FILTER [filter] │  │ tbmq.client.session.event.response.$SVC    │
│ tbmq.msg.retained        [global]          │  │                              [per-node]     │
└────────────────────────────────────────────┘  └────────────────────────────────────────────┘
┌ Cross-node routing «core» [per-node] ──────┐  ┌ System & housekeeping «transport» [global] ┐
│ tbmq.msg.downlink.basic.$SERVICE_ID        │  │ tbmq.sys.historical.data                    │
│ tbmq.msg.downlink.persisted.$SERVICE_ID    │  │ tbmq.sys.app.removed                        │
│ tbmq.client.disconnect.$SERVICE_ID         │  │ tbmq.client.blocked                         │
│ tbmq.sys.internode.notifications.$SVC_ID   │  └─────────────────────────────────────────────┘
└────────────────────────────────────────────┘
┌ Integration Executor «ie» ─────────────────────────────────────────────────────────────────┐
│ tbmq.msg.ie                              [global]   broker → executor                         │
│ tbmq.ie.downlink.{http,kafka,mqtt}       [per-type] downlink config                           │
│ tbmq.ie.uplink                           [global]   results → broker                          │
│ tbmq.ie.uplink.notifications.$SERVICE_ID [per-node]                                           │
│ tbmq.ie.event                            [global]   lifecycle                                 │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
Scope: [global]=all nodes share · [per-node]=$SERVICE_ID suffix · [per-client]/[filter]=dedicated
code: thingsboard-mqtt-broker.yml queue: section (topic names + partitions) · TB_KAFKA_PREFIX (empty default)
```

## 13 · Actor system · `svg: tbmq-actor-system` · ToC: Actor system
Purpose: the two actor types, the messages each handles, and their dispatchers.
```
┌──────────── DefaultTbActorSystem «core» ────────────────────────────┐
│  ActorType { CLIENT, PERSISTED_DEVICE } · sibling root actors        │
│  ┌ Client actor — 1 per connection ┐   on client-dispatcher (pool 8) │
│  │ CONNECT/DISCONNECT · keep-alive   │                               │
│  │ SUBSCRIBE/UNSUBSCRIBE · PUBLISH    │                               │
│  │ PUBACK/PUBREC/PUBREL/PUBCOMP       │                               │
│  │ channel writability (backpressure) │                              │
│  └───────────────┬────────────────────┘                              │
│    created alongside, for persistent DEVICE only ▼                    │
│  ┌ Persisted-DEVICE actor — 1 per persistent DEVICE ┐ on persisted-   │
│  │ retrieve & deliver offline messages               │ device-        │
│  │ track in-flight packet ids                        │ dispatcher     │
│  │ update Redis/Valkey on ack                         │ (pool 8)       │
│  └────────────────────────────────────────────────────┘              │
│  CAS-guarded mailbox ⇒ ≤ 1 thread per actor: per-client isolation +   │
│  message ordering, no locks on the hot path.                          │
└────────────────────────────────────────────────────────────────────────┘
code: actors/DefaultTbActorSystem · common/data id/ActorType {CLIENT, PERSISTED_DEVICE} · actors/config/ActorSystemLifecycle (dispatchers, pool 8)
```

## 14 · Subscription Trie · `svg: tbmq-subscription-trie` · ToC: Subscriptions Trie
Purpose: worked example — one PUBLISH matched against exact + `+` + `#`, with a pruned branch.
```
PUBLISH  sensors/room1/temperature   →  ConcurrentMapSubscriptionTrie.get(topic)

                       (root)
                          │  at each level, follow exact + "+" + "#", prune the rest
                     ┌ "sensors" ┐───────────── "#"  ✔ sub B: sensors/#
                     │           │
                  "room1"       "+"            "room2"  ✗ pruned (≠ room1, not visited)
                     │           │
              "temperature"  "temperature"
                  ✔              ✔
           sub C (exact)   sub A (single-level +)
           sensors/room1/  sensors/+/temperature
           temperature

   result: 3 matches {A, B, C}. lookup cost ∝ topic depth, not number of subscriptions.
   subscriptions loaded from Kafka tbmq.client.subscriptions into the in-memory trie.
code: service/subscription/ConcurrentMapSubscriptionTrie · SubscriptionServiceImpl.getSubscriptions
```

## 15 · Standalone vs cluster · `svg: tbmq-standalone-vs-cluster` · ToC: Standalone vs cluster mode
Purpose: side-by-side topology.
```
        STANDALONE                                   CLUSTER  (no master · identical nodes)
   ┌ clients «client» ┐                         ┌ clients «client» ┐
          │                                             │
          ▼                                     ┌ Load balancer «transport» ┐
                                                   │       │       │
          ▼                                        ▼       ▼       ▼
   ┌ TBMQ node «core» ┐                         node1   node2   nodeN  «core»
          │                                        └───────┼───────┘
          ▼                                                ▼  state rehydrated from Kafka:
   Kafka«kafka» Redis«redis»                    Kafka«kafka» Redis«redis» PostgreSQL«pg»  tbmq.client.session /
   PostgreSQL«pg»                               (all shared)                              tbmq.client.subscriptions
   one node does everything.                    reconnect to any node · new node rehydrates from Kafka.
code: identical process per node; state via compacted Kafka topics tbmq.client.session / .subscriptions
```

## 16 · Integration Executor · `svg: tbmq-integration-executor` · ToC: Integration Executor
Purpose: broker → Kafka → separate IE microservice → external systems; results back to broker.
```
┌ TBMQ broker «core» (cluster) ┐                    ┌ Integration Executor «ie» — separate JVM, :8082 ┐
│ matched messages              │  tbmq.msg.ie        │  consume tbmq.msg.ie (integration data)          │
│                               │───────────────────▶ │        │                                          │
│                               │  tbmq.ie.downlink.   │        │ push                                     │
│                               │  {http,kafka,mqtt}   │        ▼                                          │
│                               │───(config)─────────▶ │  ┌ HTTP ┐ ┌ MQTT ┐ ┌ Kafka ┐ ──▶ external systems  │
│                               │  tbmq.ie.uplink      │  └──────┘ └──────┘ └───────┘                      │
│                               │◀──(results)────────  │  tbmq.ie.event (lifecycle)                        │
└───────────────────────────────┘                    └───────────────────────────────────────────────────┘
   own JVM ⇒ a slow endpoint never back-pressures MQTT traffic. scale by running more executors.
   integration types (CE): HTTP · MQTT · KAFKA.
code: integration/executor (tbmq-integration-executor.yml, :8082) · topics tbmq.msg.ie / tbmq.ie.downlink.* / tbmq.ie.uplink / tbmq.ie.event
```
