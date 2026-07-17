# TBMQ Architecture Diagram — Iteration v4

**Date:** 2026-07-17
**Goal:** Redraw FIG 1 as a single **top-to-bottom pipeline** that reads as one story — a device publishes at the top, an application receives at the bottom.

Changes requested for v4:

- **Top = DEVICES only** (the publishers); **bottom = APPLICATIONS only** (the subscribers that receive the published messages).
- Show the storage blocks explicitly: **Redis** nested inside `PERSISTENT · DEVICE`, **dedicated Kafka topics** nested inside `PERSISTENT · APPLICATION`.
- Bring back **NETTY** as a second (delivery) layer, and run the delivery arrow **Netty → Applications**.

**Source of truth:** re-verified against `~/projects/tbmq`. Netty is the *same* layer inbound and outbound (`ClientSessionCtx.getChannel()`). App delivery: `ApplicationPersistenceProcessor → AppMsgFlushedDeliveryStrategy → DefaultMqttPublishMsgDeliveryService.ctx.getChannel().write`. Device delivery: `Redis → DownLinkProxy → PersistedDeviceActor →` the same channel write.

---

## FIG 1 — Data plane: one PUBLISH, top (device) → bottom (application)

```
                            ┌────────────────────────────────┐
                            │ DEVICES                        │  publishers
                            │ millions of MQTT clients       │
                            └────────────────┬───────────────┘
                                             │  ① PUBLISH  (QoS 0/1/2)
                                             ▼
        ┌──────────────────────────────────────────────────────────────────────────┐
        │ NETTY TRANSPORT · ingest                                                 │
        │   tcp / ssl / ws / wss  →  MqttDecoder  →  MqttSessionHandler            │
        │   one channel + ClientSessionCtx per socket                              │
        └────────────────────────────────────┬─────────────────────────────────────┘
                                             │  ② decode → route to per-client actor
                                             ▼
        ┌──────────────────────────────────────────────────────────────────────────┐
        │ ACTOR SYSTEM                                                             │
        │   ClientActor — one per client · single-thread mailbox                   │
        │   ⇒ per-client isolation · FIFO ordering · lock-free                     │
        └────────────────────────────────────┬─────────────────────────────────────┘
                                             │  ③ persist
                                             ▼
        ┌────────────────────────────────────────────┐        ╔════════════════════════════╗
        │ DURABILITY GATE                            │── ③ ─► ║ APACHE  KAFKA              ║
        │   PUBACK / PUBREC sent only AFTER          │        ║ tbmq.msg.all               ║
        │   Kafka persists  ⇒  zero message loss     │◄─ ④ ── ║ every PUBLISH lands here   ║
        └────────────────────────────────────────────┘        ╚══════════════┬═════════════╝ ⑤ consume
                                                                             │
                                             ┌───────────────────────────────┘
                                             ▼
        ┌──────────────────────────────────────────────────────────────────────────┐
        │ MESSAGE DISPATCHER  +  SUBSCRIPTION TRIE                                 │
        │   match topic → subscribers   ·   $share/… → round-robin                 │
        └────────────────────────────────────┬─────────────────────────────────────┘
                                             │  ⑥ split subscribers by session type
              ┌────────────────────────────┬─┴─────────────────────────────────┐
              ▼ NON-PERSISTENT             ▼ PERSISTENT · DEVICE               ▼ PERSISTENT · APPLICATION
   ┌────────────────────┐  ┌───────────────────────────────┐  ┌─────────────────────────────────┐
   │                    │  │ durable per-client queue      │  │ dedicated Kafka topic per app   │
   │ QoS0 / clean       │  │  ┌──────────────────────────┐ │  │  ╔═══════════════════════════╗  │
   │ session            │  │  │ R E D I S                │ │  │  ║ tbmq.msg.app.<clientId-1> ║  │
   │ deliver in-memory  │  │  │ ZSET · {clientId} queue  │ │  │  ║ tbmq.msg.app.<clientId-2> ║  │
   │ (nothing stored)   │  │  └──────────────────────────┘ │  │  ║ tbmq.msg.app.<clientId-N> ║  │
   │                    │  │                               │  │  ╚═══════════════════════════╝  │
   │                    │  │ PersistedDeviceActor drains   │  │ 1 dedicated consumer per app    │
   │                    │  │ the queue → hands to Netty    │  │ offset commit = MQTT ack        │
   └──────────┴─────────┘  └───────────────┴───────────────┘  └────────────────┴────────────────┘
              └────────────────────────────┴─┬─────────────────────────────────┘
                                             │  ⑦ write PUBLISH down each subscriber's channel
                                             ▼
        ┌──────────────────────────────────────────────────────────────────────────┐
        │ NETTY TRANSPORT · delivery                                               │
        │   DefaultMqttMsgDeliveryService → ctx.getChannel().writeAndFlush         │
        │   same channels / event loops as ingest (outbound writes)                │
        └────────────────────────────────────┬─────────────────────────────────────┘
                                             │  ⑧ PUBLISH down-link
                                             ▼
                            ┌────────────────────────────────┐
                            │ APPLICATIONS                   │  subscribers
                            │ backend consumers receive msgs │
                            └────────────────────────────────┘
```

> The Netty delivery layer writes down **every** subscriber's channel — application subscribers (foregrounded here at the bottom) and any subscribing devices alike. This view traces the canonical **device → application** path; the `PERSISTENT · DEVICE` lane exists because devices can subscribe too, and its `PersistedDeviceActor` uses the very same Netty layer to write back to those device channels.

## FIG 2 — Control plane: masterless cluster

```
     ┌───────────┐     ┌───────────┐     ┌───────────┐     Symmetric nodes — no master, no Zookeeper.
     │  NODE 1   │     │  NODE 2   │ ... │  NODE N   │     Each holds in-memory session +
     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘     subscription replicas.
           │                 │                 │
           ▼                 ▼                 ▼
  ╔══════════════════ APACHE KAFKA  (the only coordinator) ══════════════════╗
  ║  shared groups (auto-rebalance on node join / leave):                     ║
  ║     tbmq.msg.all · tbmq.msg.persisted · tbmq.client.session.event.request ║
  ║  compacted state (replicated to every node):                             ║
  ║     tbmq.client.session · tbmq.client.subscriptions · tbmq.msg.retained  ║
  ║  per-node routing:  tbmq.msg.downlink.{basic,persisted}.<serviceId>       ║
  ╚═══════════════════════════════╤══════════════════════════════════════════╝
                                   │
                          ┌────────┴────────┐
                          │      REDIS      │   device message queues
                          └─────────────────┘
```

## Flow

① device PUBLISH → ② Netty decodes, routes to the per-client actor → ③ actor persists to Kafka `tbmq.msg.all` → ④ Kafka stores it → ⑤ ack to the publisher (only after the durable write) + a consumer reads it back → ⑥ the Trie matches subscribers, split by session type → ⑦ device subscribers drain from **Redis**, application subscribers drain from their **dedicated Kafka topic**, both handed to Netty → ⑧ Netty writes the PUBLISH down each channel → **applications receive**.

---

## Changelog

- **v4 (2026-07-17):** Re-drawn as a single vertical device→application pipeline. DEVICES alone at the top, APPLICATIONS alone at the bottom. Redis shown as a nested block inside `PERSISTENT · DEVICE`; dedicated `tbmq.msg.app.<clientId>` topics shown as a nested block inside `PERSISTENT · APPLICATION`. NETTY reintroduced as an explicit delivery layer with the delivery arrow running Netty → Applications. Flow renumbered ①–⑧. (Diagram generated on a coordinate grid so every connector aligns to the column.)
- **v3 (2026-07-16):** v1 structure, decluttered — removed ports, partition counts, qualifiers, and side class-name annotations; kept both figures and the ①–⑨ flow.
- **v2 (2026-07-16):** Minimal single-figure version.
- **v1 (2026-07-16):** Initial detailed diagram.
```
