# TBMQ Architecture Diagram — Iteration v1

**Date:** 2026-07-16
**Source of truth:** code analysis of `~/projects/tbmq` (application, common, dao modules)
**Covers:** Netty transport · custom actor system · Kafka · subscription Trie · Redis · masterless cluster · device/application message flow

---

```
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                       T B M Q  —  Distributed MQTT Broker  ·  Architecture & Message Flow              ║
║          MQTT 3.1 / 3.1.1 / 5.0   ·   masterless cluster   ·   Kafka (transport+coordination) + Redis  ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

## FIG 1 — Data plane: the full lifecycle of one PUBLISH (ingest → durability → match → fan-out → delivery)

```
   ┌──────────────┐                                                              ┌──────────────────┐
   │   DEVICES    │  connect / PUB / SUB                          connect / SUB   │   APPLICATIONS   │
   │  (millions,  │─────────────────────────┐            ┌─────────────────────► │  (few, backend   │
   │  small queue)│                          │            │                       │   consumers)     │
   └──────────────┘                          ▼            │                       └──────────────────┘
                       ┌───────────────────────────────────────────────────────┐
              ①        │  NETTY TRANSPORT                                        │   4 listeners, own thread pools
     ───────────────►  │   tcp 1883 · ssl 8883 · ws 8084 · wss 8085             │   NioEventLoopGroup (boss/worker)
                       │   pipeline: [proxy/ip]→[SSL]→[WS codec]                 │   AbstractMqttServerBootstrap
                       │            →MqttDecoder→MqttEncoder→MqttSessionHandler  │   MqttDecoder = Netty MQTT codec
                       │   1 MqttSessionHandler + ClientSessionCtx per socket    │
                       └───────────────────────────────┬───────────────────────┘
                    ②  decode → NettyMqttConverter → ClientMqttActorManager.tell(clientId)
                                                        ▼
                       ┌───────────────────────────────────────────────────────┐
              ③        │  ACTOR SYSTEM   (custom TbActorSystem — NOT Akka)       │   common/actor
                       │   ┌───────────────────────────────────────────────┐   │
                       │   │ ClientActor  ·  one per clientId               │   │   mailbox = AtomicBoolean(busy)
                       │   │  mailbox = CAS-guarded single-thread loop  ◄───┼───┼── CAS ⇒ at most 1 thread/actor
                       │   │  ⇒ per-client ISOLATION · FIFO · lock-free    │   │      = per-client concurrency
                       │   │  owns: QoS state machine, subs, acks,         │   │      isolation on a shared pool
                       │   │        connect/disconnect, backpressure       │   │
                       │   └───────────────────────────────────────────────┘   │   dispatchers:
                       │      MqttPublishHandler validates topic + authz        │    client-dispatcher
                       └───────────────────────────────┬───────────────────────┘    persisted-device-dispatcher
                    ④  MsgDispatcherService.persistPublishMsg → TbKafkaProducerTemplate.send(cb)
                                                        ▼
   ┌──────────────────────────────────────────────────────────────────────┐         ┌═══════════════════════════┐
   │  DURABILITY GATE                                                       │   ④     ║       APACHE  KAFKA        ║
   │   producer send ─────────────────────────────────────────────────────┼────────►║  tbmq.msg.all   (16 part.) ║
   │   ⑤ onSuccess(offset)  ◄───────────── message durably stored ─────────┼─────────║  ← every PUBLISH first     ║
   │      → PUBACK (QoS1) / PUBREC (QoS2) sent to the PUBLISHER             │   ⑤ ack ║    lands here, replicated  ║
   │      ►►► ack is emitted ONLY after Kafka persists — zero message loss  │         ╚═════════════╤═════════════╝
   └──────────────────────────────────────────────────────────────────────┘            ⑥ consume  │  (shared consumer
                                                                                                    ▼   group, rebalances)
                       ┌───────────────────────────────────────────────────────┐
              ⑥        │  PublishMsgConsumerService → MsgDispatcher.processPublishMsg
                       │                                                         │
              ⑦        │  SUBSCRIPTION MATCHING                                   │
                       │   ConcurrentMapSubscriptionTrie.get(topic)              │   node-per-level, ≤3 branches
                       │    • traversal = O(topic levels), branches: exact / +/# │   (exact, '+', '#')
                       │    • cost INDEPENDENT of total subscription count        │   all subs of a filter share
                       │   + SharedSubscriptionCache  ($share/… → round-robin)   │   one node's value-set
                       │   + ClientSessionCache       (clientId → serviceId,QoS) │
                       └───────────────────────────────┬───────────────────────┘
                    ⑧  split subscribers by session type + QoS
       ┌───────────────────────────────┬───────────────────────────────┬───────────────────────────────┐
       ▼ ⑧a NON-PERSISTENT             ▼ ⑧b PERSISTENT · DEVICE         ▼ ⑧c PERSISTENT · APPLICATION    │
  ┌─────────────────────────┐   ┌─────────────────────────────┐  ┌──────────────────────────────┐       │
  │ QoS0 or clean session   │   │ millions of clients,        │  │ few, high-throughput streams  │       │
  │ DownLinkProxy.sendBasic │   │ small per-client backlog    │  │ dedicated Kafka topic /client │       │
  │  • local  → write chan  │   │ →Kafka tbmq.msg.persisted   │  │ →Kafka tbmq.msg.app.<clientId>│       │
  │  • remote → Kafka       │   │   (12p, key = clientId)     │  │ ApplicationPersistenceProc.:  │       │
  │    downlink.basic.<svc> │   │ DeviceMsgQueueConsumer      │  │  ONE consumer thread PER      │       │
  │                         │   │ → DeviceMsgService ══► REDIS│  │  app client · offset = acks   │       │
  │                         │   │ → downlink.persisted.<svc>  │  │  (topic itself = durable inbox)│      │
  │                         │   │ → PersistedDeviceActor      │  │                               │       │
  └────────────┬────────────┘   └──────────────┬──────────────┘  └───────────────┬──────────────┘       │
               └──────────────────────┬────────┴─────────────────────────────────┘                      │
                    ⑨  DefaultMqttMsgDeliveryService → write PUBLISH down each subscriber's Netty channel │
                        (per-subscriber QoS1/2 ack state machine; backpressure via channel writability)  │
               └─────────────────────────────────────────────────────────────────────────────────────► delivered to
                                                                                              DEVICES / APPLICATIONS
   ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
   │  REDIS  (Lettuce; standalone / cluster / sentinel)   —  durable store for DEVICE offline queues     │
   │   per client:  ZSET  {clientId}_messages   +   String {clientId}_messages_<packetId> (+TTL)         │
   │                String {clientId}_last_packet_id       •  atomic multi-key Lua via EVALSHA           │
   │   {clientId} hash-tag pins keys to one slot ⇒ scripts stay atomic even on Redis Cluster             │
   └──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## FIG 2 — Control plane: masterless cluster (Kafka is the only coordinator — no Zookeeper, no leader)

```
     ┌───────────┐          ┌───────────┐          ┌───────────┐     Every node is symmetric.
     │  NODE 1   │          │  NODE 2   │   ...    │  NODE N   │     identity = serviceId (TB_SERVICE_ID)
     │  tbmq-1   │          │  tbmq-2   │          │  tbmq-n   │     Each holds IN-MEMORY replicas:
     └─────┬─────┘          └─────┬─────┘          └─────┬─────┘       • ClientSessionCache  (clientId → serviceId)
           │  produce / consume (partitions rebalance    │             • ClientSubscriptionCache + SubscriptionTrie
           │   automatically when a node joins/leaves     │            • RetainedMsg trie
           ▼          = horizontal scale, zero downtime   ▼
  ╔═══════════════════════════════ APACHE  KAFKA  (coordination substrate) ═══════════════════════════════╗
  ║  SHARED consumer groups  → work partitioned & auto-rebalanced across nodes:                            ║
  ║     tbmq.msg.all                    16p   publish fan-out                                              ║
  ║     tbmq.msg.persisted              12p   device persistence           (key = clientId)                ║
  ║     tbmq.client.session.event.request 24p connect/disconnect           (key = clientId ⇒ ONE node      ║
  ║                                            owns a client's session events → clean takeover, ordering)  ║
  ║  COMPACTED topics → full state replicated into every node's in-memory maps (rebuilt on boot):          ║
  ║     tbmq.client.session         (clientId → {serviceId, connected})   ← "which node owns this client"  ║
  ║     tbmq.client.subscriptions   (clientId → subscription set)         ← feeds each node's local trie   ║
  ║     tbmq.msg.retained           (retained messages)                                                    ║
  ║  PER-NODE addressed (suffix .<serviceId>, NOT rebalanced → targeted cross-node delivery):              ║
  ║     tbmq.msg.downlink.basic.<svc> · tbmq.msg.downlink.persisted.<svc> · tbmq.client.disconnect.<svc>   ║
  ╚════════════════════════════════════════════════════════════════════════════════════════════════════════╝
     Cross-node routing:  a node reads target serviceId from its local session cache.  Same node → deliver
     locally;  different node → publish to that node's per-node downlink topic.  No central lookup, no master.
```

## Legend — the numbered publish flow

| # | Step | Key components |
|---|------|----------------|
| ① | Client connects over TCP/TLS/WS/WSS; MQTT packets decoded | `MqttSessionHandler`, `MqttDecoder` |
| ② | Decoded packet → per-client actor by clientId | `NettyMqttConverter`, `ClientMqttActorManager` |
| ③ | Actor validates topic/authz, runs QoS state machine | `ClientActor`, `MqttPublishHandler` |
| ④ | Message produced to the main Kafka topic | `MsgDispatcherService`, `tbmq.msg.all` |
| ⑤ | **PUBACK/PUBREC only after Kafka confirms the write** → no message loss | `TbKafkaProducerTemplate` callback |
| ⑥ | A consumer (shared group) reads the topic back | `PublishMsgConsumerService` |
| ⑦ | Subscription trie lookup — O(topic-levels), not O(#subs) | `ConcurrentMapSubscriptionTrie`, `SharedSubscriptionCache` |
| ⑧ | Subscribers split: non-persistent / device / application | `MsgPersistenceManager` |
| ⑧b | Device queues stored in **Redis**; delivered via device actor | `DeviceMsgService` (Redis), `PersistedDeviceActor` |
| ⑧c | Application clients get a **dedicated Kafka topic + consumer** | `ApplicationPersistenceProcessor` |
| ⑨ | Message written down each subscriber's Netty channel | `DefaultMqttMsgDeliveryService` |

## Why the split matters (the scaling story the diagram encodes)

- **Devices → Redis, Applications → Kafka:** millions of devices each keep a small bounded queue → a Redis sorted-set per client (Kafka can't scale to millions of topics). A handful of application clients are high-throughput backends → each gets its own ordered, replayable, offset-committed Kafka topic.
- **Per-client actor = isolation:** a CAS-serialized single-thread mailbox per client means one slow client can't block or corrupt another, with no locks on the hot path.
- **Kafka is the coordinator:** compacted topics replicate session/subscription state to every node; shared consumer groups rebalance on node join/leave — masterless, zero single point of failure, zero-downtime scaling.
- **Durability gate:** the publisher's PUBACK/PUBREC is emitted strictly after Kafka has durably stored the message, so a node crash never loses an acknowledged publish — another node resumes from Kafka.

---

## Changelog

- **v1 (2026-07-16):** Initial diagram from 6-way parallel codebase analysis. Data-plane publish lifecycle (①–⑨), device/application persistence split, masterless cluster control plane, numbered legend, scaling rationale.
