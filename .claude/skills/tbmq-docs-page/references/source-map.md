# TBMQ source map — where to verify a docs claim

Read this when you need to check a default, port, env var, packet behavior, or edition split
against the broker code. Every path below is relative to a broker repo root.

## Contents
1. Reading the right ref
2. Config defaults (the yml)
3. Listener and port defaults
4. MQTT-handling package map
5. PE-only code
6. Claim → file cheat sheet

---

## 1. Reading the right ref

The sibling checkouts (`../tbmq`, `../tbmq-pe`) usually sit on a feature branch, so never trust the
working tree. Fetch, then read with `git show`:

```bash
git -C ../tbmq fetch -q origin && git -C ../tbmq-pe fetch -q origin
git -C ../tbmq    show origin/main:application/src/main/resources/thingsboard-mqtt-broker.yml    | grep -n 'MQTT_KEEP_ALIVE'
git -C ../tbmq-pe show origin/license:application/src/main/resources/thingsboard-mqtt-broker.yml | grep -n 'MQTT_KEEP_ALIVE'
```

| Claim must hold for | CE ref (`../tbmq`) | PE ref (`../tbmq-pe`) |
|---|---|---|
| The upcoming release (default — `develop` docs ship with it) | `origin/main` | `origin/license` |
| What is live today (a fix on a released page, a broker comparison) | tag `v<TBMQ_VER>` | tag `v<TBMQ_PE_VER>` |

PE's `license` branch is not "CE plus extras": it can drop or replace CE code and can lag CE
features. Verify a PE claim on PE, even when CE has the same feature.

## 2. Config defaults (the yml)

`application/src/main/resources/thingsboard-mqtt-broker.yml` defines every broker default, in
Spring's `${ENV_VAR:default}` form. **The `:default` part is the source of truth for any "the
default is X" claim.** A nested fallback form also occurs: `"${A:${b.c:${B:10000}}}"`. Read the
comment above the key too — it often says what a sentinel such as `0` means (for example
`MQTT_TOPIC_MAX_SEGMENTS_COUNT:0` means *no limit*, not a limit of zero).

Line numbers drift with every release; jump by key instead:

```bash
Y=application/src/main/resources/thingsboard-mqtt-broker.yml
git -C ../tbmq show origin/main:$Y | grep -nE '^[a-z][a-z0-9_-]*:'   # top-level section map
git -C ../tbmq show origin/main:$Y | grep -n -B3 'MQTT_TOPIC_MAX'     # one knob with its comment
```

Top-level sections (CE): `server:` (HTTP/REST + SSL) · `listener:` (MQTT TCP/SSL/WS/WSS, Netty,
proxy) · `queue:` (Kafka consumers/acks, topic names) · `service:` · `actors:` · `integrations:` ·
`database:` / `sql:` / `lettuce:` / `spring:` · `security:` (JWT, unauthorized clients) · `mqtt:`
(connect threads, flow control, keep-alive, topic/alias, wildcard toggle, shared subs, session
expiry, persistent session, rate limits) · `device:` / `cache:` / `redis:` · `stats:` /
`historical-data-report:` / `management:` · `springdoc:` / `swagger:` / `app:` / `analysis:`.

PE adds the top-level `audit-log:` and `license:` sections plus nested `security.oauth2:`,
`mqtt.dropped-msg:` and `queue.dropped-msg:`. Re-derive with
`diff <(git -C ../tbmq show origin/main:$Y | grep -oE '^[a-z][a-z0-9_-]*:') <(git -C ../tbmq-pe show origin/license:$Y | grep -oE '^[a-z][a-z0-9_-]*:')`.

The integration executor has its own file,
`integration/executor/src/main/resources/tbmq-integration-executor.yml` (documented at
`installation/ie-config`).

## 3. Listener and port defaults

| Purpose | YAML key (env var) | Default | Enabled by default? |
|---|---|---|---|
| MQTT TCP | `listener.tcp.bind_port` (`LISTENER_TCP_BIND_PORT`) | 1883 | yes (`LISTENER_TCP_ENABLED:true`) |
| MQTTS (SSL) | `listener.ssl.bind_port` (`LISTENER_SSL_BIND_PORT`) | 8883 | no (`LISTENER_SSL_ENABLED:false`) |
| MQTT over WS | `listener.ws.bind_port` (`LISTENER_WS_BIND_PORT`) | 8084 | yes (`LISTENER_WS_ENABLED:true`) |
| MQTT over WSS | `listener.wss.bind_port` (`LISTENER_WSS_BIND_PORT`) | 8085 | no (`LISTENER_WSS_ENABLED:false`) |
| HTTP / REST / Web UI | `server.port` (`HTTP_BIND_PORT`) | 8083 | yes |

`8083` is the HTTP/UI/REST port, not an MQTT-over-WS port. Cross-check deployment mappings in CE
`docker/docker-compose.yml`. Re-verify the table with
`git -C ../tbmq show origin/main:$Y | grep -nE 'LISTENER_[A-Z]+_(BIND_PORT|ENABLED)|HTTP_BIND_PORT'`.

## 4. MQTT-handling package map

Under `application/src/main/java/org/thingsboard/mqtt/broker/` in both repos:

| Concept | Where | Key classes |
|---|---|---|
| Netty pipeline, packet entry, decode | `server/` | `MqttSessionHandler`, `MqttChannelInitializer` |
| MQTT ↔ proto conversion | `adaptor/` | `NettyMqttConverter`, `ProtoConverter` |
| CONNECT/CONNACK, takeover, keep-alive negotiation | `actors/client/service/connect/` | `ConnectServiceImpl` |
| Per-packet handlers (PUBLISH, SUB/UNSUB, PUBACK/REC/REL/COMP, PINGREQ) | `actors/client/service/handlers/` | `MqttMessageHandlers`, `MqttPublishHandler`, `MqttPubRelHandler`, `MqttPingHandler` |
| Keep-alive monitoring | `service/mqtt/keepalive/` | `KeepAliveServiceImpl` |
| Last Will | `service/mqtt/will/` | `DefaultLastWillService` |
| Retained messages | `service/mqtt/retain/` | `RetainedMsgServiceImpl`, `RetainMsgTrie` |
| MQTT 5 flow control (Receive Maximum) | `service/mqtt/flow/control/` | `FlowControlServiceImpl` |
| Subscriptions, wildcard trie | `service/subscription/` | `SubscriptionTrie`, `ClientSubscriptionCache` |
| Shared subscriptions | `service/subscription/shared/`, `service/processing/shared/` | `SharedSubscriptionProcessorImpl`, `RoundRobinStrategy` |
| Sessions (state, cache, persistence, expiry) | `service/mqtt/client/session/`, `actors/client/service/session/` | `ClientSessionCache`, `SessionClusterManagerImpl` |
| Persistence: DEVICE vs APPLICATION clients | `service/mqtt/persistence/device/`, `.../application/` | — |
| Authentication (basic/http/jwt/ssl) | `service/auth/providers/` | `MqttClientAuthProvider` + impls |
| MQTT 5 enhanced auth (SCRAM) | `service/auth/enhanced/` | `DefaultEnhancedAuthenticationService` |
| TLS / listener transport | `server/{tcp,tls,ws,wss}/` | `*ServerBootstrap`, `MqttSslHandlerProvider` |
| Topic name validation | `common/dao-api/.../dao/topic/` | `TopicValidationService` |

If a class has moved, find it with `git -C ../tbmq ls-tree -r --name-only origin/main | grep '/<Class>.java$'`.

## 5. PE-only code

The authoritative edition split for *pages* is the stub tree (see SKILL.md). For *code*, these are
PE-only:

- Packages: `service/security/auth/oauth2/`, `service/security/permission/`, `service/entity/wl/`,
  `service/entity/domain/`, `service/resource/`, `service/mqtt/dropped/`.
- Controllers: `AuditLogController`, `OAuth2Controller`, `RoleController`,
  `WhiteLabelingController`, `DomainController`, `ImageController`, `DroppedMsgController`.
- Integrations: CE ships HTTP, MQTT and Kafka. Everything else — the MongoDB, PostgreSQL,
  TimescaleDB, Redis and RabbitMQ sinks and the Kafka/MQTT *source* integrations — is PE-only,
  under `integration/executor/src/main/java/org/thingsboard/mqtt/broker/integration/service/integration/`.
  The enum of types per edition is
  `common/data/src/main/java/org/thingsboard/mqtt/broker/common/data/integration/IntegrationType.java`
  — compare `git -C ../tbmq show origin/main:<that path>` with `git -C ../tbmq-pe show origin/license:<that path>`.

To find what PE adds or removes in a package:
`comm -3 <(git -C ../tbmq ls-tree -r --name-only origin/main -- <dir> | sort) <(git -C ../tbmq-pe ls-tree -r --name-only origin/license -- <dir> | sort)`.

## 6. Claim → file cheat sheet

- Default value or env-var name → its key in `thingsboard-mqtt-broker.yml` (CE ref; PE ref for a PE-only section or a PE page).
- Port → `listener.*` / `server.port` keys + `server/{tcp,tls,ws,wss}/*ServerBootstrap.java`.
- QoS PUBACK/PUBREC/PUBREL/PUBCOMP → `actors/client/service/handlers/`.
- CONNECT / keep-alive negotiation → `ConnectServiceImpl` + `KeepAliveServiceImpl`.
- Retained / LWT / shared subs / wildcard → `service/mqtt/retain/`, `service/mqtt/will/`, `service/subscription/`.
- Auth → `service/auth/providers/` + `service/auth/enhanced/`.
- Integration config → `tbmq-integration-executor.yml` + the integration's package (section 5).
- "Is this PE-only?" → the live edition split in SKILL.md, then section 5.
