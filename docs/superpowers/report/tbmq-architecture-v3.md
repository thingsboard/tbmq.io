# TBMQ Architecture Diagram — Iteration v3

**Date:** 2026-07-16
**Goal:** v1's structure and depth (data-plane lanes + cluster plane + ①–⑨ flow), with the noisy annotations removed — no ports, partition counts, qualifiers, or side class-name columns.

---

## FIG 1 — Data plane: lifecycle of one PUBLISH

```
   ┌──────────────┐                                                        ┌──────────────────┐
   │   DEVICES    │             publish / subscribe                        │   APPLICATIONS   │
   └──────┬───────┘                                                        └────────┬─────────┘
          │                                                                         │
          └──────────────────────────────┐   ①   ┌──────────────────────────────────┘
                                          ▼       ▼
              ┌─────────────────────────────────────────────────────────────┐
        ①     │  NETTY TRANSPORT                                             │
              │    pipeline → MqttSessionHandler  (one session per socket)   │
              └───────────────────────────────┬─────────────────────────────┘
                          ②  → per-client actor │
                                                ▼
              ┌─────────────────────────────────────────────────────────────┐
        ③     │  ACTOR SYSTEM   (custom TbActorSystem)                        │
              │    ClientActor — one per client — single-thread mailbox       │
              │    ⇒ per-client isolation                                     │
              └───────────────────────────────┬─────────────────────────────┘
                          ④  persist            │
                                                ▼
   ┌──────────────────────────────────────────────────┐        ┌═══════════════════════════┐
   │  DURABILITY GATE                                   │   ④    ║       APACHE  KAFKA        ║
   │    ⑤ PUBACK / PUBREC only after Kafka persists     │───────►║  tbmq.msg.all             ║
   │       ⇒ zero message loss                          │◄───────║  (every PUBLISH lands here)║
   └────────────────────────────────────────────────────  ⑤     ╚═════════════╤═════════════╝
                                                                    ⑥ consume  │
                                                                                ▼
              ┌─────────────────────────────────────────────────────────────┐
        ⑥     │  MESSAGE DISPATCHER                                          │
        ⑦     │  SUBSCRIPTION TRIE — match topic → subscribers               │
              │    + shared subscriptions ($share → round-robin)             │
              └───────────────────────────────┬─────────────────────────────┘
                          ⑧  split subscribers │
       ┌────────────────────────────┬──────────┴─────────────────┬────────────────────────────┐
       ▼ NON-PERSISTENT             ▼ PERSISTENT · DEVICE         ▼ PERSISTENT · APPLICATION    │
  ┌──────────────────────┐   ┌──────────────────────────┐  ┌──────────────────────────────┐   │
  │ deliver in-memory    │   │ → tbmq.msg.persisted      │  │ → tbmq.msg.app.<clientId>     │   │
  │ (down-link)          │   │ → REDIS queue             │  │ → dedicated consumer          │   │
  │                      │   │ → PersistedDeviceActor    │  │                               │   │
  └───────────┬──────────┘   └─────────────┬────────────┘  └──────────────┬────────────────┘   │
              └───────────────────┬────────┴──────────────────────────────┘                    │
                          ⑨  write PUBLISH down each subscriber's Netty channel                 │
              └───────────────────────────────────────────────────────────────► subscribers ───┘

   ┌────────────────────────────────────────────────────────────────────────────────────────┐
   │  REDIS  —  durable per-device message queues                                             │
   └────────────────────────────────────────────────────────────────────────────────────────┘
```

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
  ║  per-node routing:  tbmq.msg.downlink.*.<serviceId>                       ║
  ╚═══════════════════════════════╤══════════════════════════════════════════╝
                                   │
                          ┌────────┴────────┐
                          │      REDIS      │   device message queues
                          └─────────────────┘
```

## Flow

① connect / publish / subscribe → ② decode → ③ per-client actor → ④ persist to Kafka → ⑤ ack (only after durable write) → ⑥ consume → ⑦ match in the Trie → ⑧ split subscribers → ⑨ deliver.

---

## Changelog

- **v3 (2026-07-16):** v1 structure, decluttered — removed ports, partition counts, qualifiers (e.g. "millions, small queue"), and the side class-name annotations; kept both figures and the ①–⑨ flow.
- **v2 (2026-07-16):** Minimal single-figure version.
- **v1 (2026-07-16):** Initial detailed diagram.
