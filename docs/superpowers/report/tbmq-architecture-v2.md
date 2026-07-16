# TBMQ Architecture Diagram — Iteration v2 (simplified)

**Date:** 2026-07-16
**Goal:** same components as v1, less detail/text — the shape of the system at a glance.

---

```
  ┌────────────┐    ┌──────────┐    ┌───────────────┐    ┌───────────────┐    ┌─────────────┐
  │  Devices   │ ①  │  Netty   │ ②  │ Actor System  │ ③  │    Message    │ ④  │    Kafka    │
  │     +      │───►│transport │───►│ 1 per client  │───►│  Dispatcher   │───►│  msg.all    │
  │Applications│    └──────────┘    │ (isolation)   │    │               │◄───│ (durable)   │
  └────────────┘                    └───────────────┘    └───────┬───────┘ ⑤  └─────────────┘
        ▲                                                 match   │  consume
        │                                                         ▼
        │ ⑥ deliver                                       ┌───────────────┐
        │                                                 │  Subscription │
        │                                                 │     Trie      │
        │                                                 └───────┬───────┘
        │                                    ┌────────────────────┴───────────────────┐
        │                              Device subscribers                     App subscribers
        │                              ┌──────────────┐                    ┌──────────────────┐
        └──────────────────────────────┤    Redis     │                    │  per-app Kafka   │
                                       │   (queues)   │                    │      topic       │
                                       └──────────────┘                    └──────────────────┘

  Cluster: symmetric nodes, coordinated only by Kafka — no master, no single point of failure.
```

**Flow:** ① publish/subscribe → ② decode → ③ per-client actor → ④ persist to Kafka (ack only after durable write) → ⑤ consume + match subscribers in the Trie → ⑥ deliver (devices via Redis queues, applications via a dedicated Kafka topic).

---

## Changelog

- **v2 (2026-07-16):** Simplified from v1 — removed class names, ports, pipeline internals, and prose; kept every architectural component and the ①–⑥ message flow.
- **v1 (2026-07-16):** Initial detailed diagram (data-plane lifecycle, device/application split, masterless cluster plane, full legend, scaling rationale).
