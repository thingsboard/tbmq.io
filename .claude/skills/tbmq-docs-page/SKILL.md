---
name: tbmq-docs-page
description: Review, improve, or create a TBMQ reference doc under /docs/mqtt-broker/. Verifies technical correctness against BOTH the MQTT spec AND the TBMQ broker source (config defaults, listener ports, packet handling) at ~/projects/tbmq (CE) and ~/projects/tbmq-pe (PE), fills gaps with TBMQ-specific parameters/behaviors/instructions, and authors new pages for missing topics. The technical counterpart to the mqtt-learn-topic skill — docs are complementary to the /mqtt learn hub, never duplicating it. Use whenever someone wants to audit, correct, deepen, or extend the mqtt-broker docs, add a missing doc page, or verify a documented claim against TBMQ code.
---

# TBMQ Docs Page

`/docs/mqtt-broker/` is TBMQ's **reference documentation** — the how-to/technical tree that a person *operating* TBMQ relies on. This skill governs three jobs on that tree: **review** an existing page for correctness, **improve** a thin one, or **create** a new page for a topic that has none. The bar is accuracy against two sources of truth at once: the **MQTT spec** and the **actual TBMQ source code**.

**Companion skill — `mqtt-learn-topic`.** Each doc has (or should have) a marketing counterpart on the `/mqtt/` learn hub. The two are deliberately **complementary, never duplicative**:

| | `/mqtt/` learn page (`mqtt-learn-topic`) | `/docs/mqtt-broker/` doc page (this skill) |
|---|---|---|
| Intent | informational ("what it is, why it matters") | how-to / reference (task intent) |
| Audience | cold searcher, evaluating | someone deploying/operating TBMQ |
| Content | the general MQTT concept, spec-level, vendor-neutral | **TBMQ-specific** params, defaults, behaviors, UI/config steps |
| Framing | benefit-first, conversational | precise, technical, exhaustive |

When you touch a doc, keep the **concept explanation in the learn page** and the **TBMQ specifics in the doc**. If a doc starts re-teaching the generic concept, or a learn page starts listing config keys, they've drifted into duplication — the split exists precisely to prevent that. Cross-link them.

## Principles

- **Accuracy is the product — verified against source, not memory.** Every default value, parameter name, port, and behavioral claim must match the current TBMQ source (see [Verify against the TBMQ source](#verify-against-the-tbmq-source)). Plausible-but-wrong is the failure mode; a doc that says "the default is X" when the code says Y is worse than no doc. If you can't verify it in source or the spec, don't write it.
- **TBMQ-specific, not a concept re-explainer.** A doc's job is what TBMQ *does*: the env var that controls a behavior, its default, the UI path to change it, the edge cases, the CE-vs-PE difference. Hand the "what is this concept" job to the paired learn page and link to it.
- **One include, two editions.** Content is written once in a shared `_includes` file and rendered for both CE and PE via thin stubs. Product differences are handled inline with `<ShowFor>` / `<ConditionalHeading>`, not by forking the content.
- **Spec-precise.** MQTT 3.1.1 vs 5.0 differences, QoS semantics, packet names, reason codes, wildcard rules — state them exactly, and scope any claim to the version it applies to.

## A doc page = 3 files + 1 sidebar entry

```
src/content/_includes/docs/mqtt-broker/<path>/<page>.mdx   ← the actual content (SHARED by CE + PE). No frontmatter.
src/content/docs/docs/mqtt-broker/<path>/<page>.mdx        ← CE stub: frontmatter + imports include, passes Products.TBMQ
src/content/docs/docs/mqtt-broker/pe/<path>/<page>.mdx     ← PE stub: same, passes Products.TBMQ_PE
astro.sidebar.ts                                            ← one entry in tbmqGuideItems (serves CE + PE via the prefix arg)
```

URL: `/docs/mqtt-broker/<path>/<page>/` (CE) and `/docs/mqtt-broker/pe/<path>/<page>/` (PE). `trailingSlash: 'always'`.

Existing pages are the best reference. A model paired doc: `src/content/_includes/docs/mqtt-broker/user-guide/keep-alive.mdx` — note how it stays TBMQ-technical (the `MQTT_KEEP_ALIVE_MONITORING_DELAY_MS` env var, the `KEEP_ALIVE_TIMEOUT` reason, client-takeover + will-delay nuance) rather than re-explaining the ping concept the learn page owns.

### The stubs (nearly boilerplate)

CE stub (`.../docs/mqtt-broker/<path>/<page>.mdx`):

```mdx
---
title: Keep Alive
description: MQTT Keep Alive mechanism in TBMQ — connection timeout detection and PING request/response behavior.
---

import PageContent from '@includes/docs/mqtt-broker/<path>/<page>.mdx'
import { Products } from '~/models/site.models'

<PageContent product={Products.TBMQ}/>
```

PE stub (`.../docs/mqtt-broker/pe/<path>/<page>.mdx`): **identical**, except the last line passes `Products.TBMQ_PE`. Both stubs are required for the page to exist in both editions' sidebars. Frontmatter is the `base` schema (`title` + `description`; `type` defaults to `base`). `description` is the meta description — benefit-framed, ~150–160 chars, includes the key term.

### The shared include (where the work is)

No frontmatter. Import what you use, then write Markdown. `props.product` is available for product-conditional content.

```mdx
import { Aside, Code, Tabs, TabItem } from '@astrojs/starlight/components';
import { Products } from '~/models/site.models';
import ShowFor from '~/components/ShowFor.astro';
import ConditionalHeading from '~/components/ConditionalHeading.astro';
import DocLink from '@components/DocLink.astro';
import { TBMQ_VER } from '~/data/versions';

Intro paragraph — what this page covers in TBMQ terms.

## How it works in TBMQ

The keep-alive timeout check runs every second by default, controlled by the
`MQTT_KEEP_ALIVE_MONITORING_DELAY_MS` environment variable. On timeout the broker
closes the connection with reason `KEEP_ALIVE_TIMEOUT` and fires the client's
<DocLink product={props.product} path="user-guide/last-will">Last Will</DocLink>.

<Aside type="caution">
  Keep the mechanism enabled unless you fully understand the implications.
</Aside>

<ShowFor product={props.product} show={[Products.TBMQ_PE]}>
PE-only detail written as **normal Markdown** — lists, `code`, `<Tabs>`, `<Aside>` all work here.
</ShowFor>
```

**Product-conditional content** (per repo CLAUDE.md):
- Wrap PE-only (or CE-only) blocks in `<ShowFor product={props.product} show={[Products.TBMQ_PE]}>…</ShowFor>` and write **normal Markdown** inside. Do **not** use `{props.product === … && (<>…</>)}` with hand-written HTML — a JSX `{…}` expression disables Markdown parsing.
- Conditional **headings** use `<ConditionalHeading … showFor="…">`, not `##` — the TOC plugin needs that metadata to include them conditionally.
- Internal doc links use **`<DocLink product={props.product} path="user-guide/…">`** (product-aware; always prefer over a bare Markdown link). Use `useTbDocs` to point a link at the core ThingsBoard docs instead of the TBMQ subtree.
- **Never hardcode version strings** — import `TBMQ_VER` / `TBMQ_PE_VER` / `TBMQ_BRANCH` from `~/data/versions`.

### Sidebar

Add one entry to the right group in `tbmqGuideItems` (or `tbmqInstallItems` / `tbmqReferenceItems`) in `astro.sidebar.ts` — the `${prefix}` arg makes a single entry serve **both** CE (`docs/mqtt-broker`) and PE (`docs/mqtt-broker/pe`):

```ts
{ label: 'Keep alive', slug: `${prefix}/user-guide/keep-alive` },
```

Groups you'll usually target: **MQTT essentials** (protocol concepts), **Broker operations**, **Security**, **Integrations**. Put PE-only pages behind the `isPE` conditional already used in that file.

## Verify against the TBMQ source

Both repos share the Maven layout and package root `org.thingsboard.mqtt.broker`; the broker app is the `application/` module. **PE is a superset of CE — verify common behavior against the CE files, which PE inherits; verify PE-only features against the PE repo.**

- CE: `/home/dlandiak/projects/tbmq`
- PE: `/home/dlandiak/projects/tbmq-pe`

### Config defaults — the single source of truth

**`application/src/main/resources/thingsboard-mqtt-broker.yml`** (in each repo) defines every default. Values use Spring's `${ENV_VAR:default}` syntax, one per line with a comment — **the `:default` portion is the source of truth for any "the default is X" claim.** Examples (CE):

- `port: "${HTTP_BIND_PORT:8083}"` · `bind_port: "${LISTENER_TCP_BIND_PORT:1883}"`
- `max-keep-alive: "${MQTT_KEEP_ALIVE_MAX_KEEP_ALIVE_SEC:600}"` · `acks: "${TB_KAFKA_DEFAULT_PRODUCER_ACKS:1}"`
- Nested fallback form occurs too: `"${A:${b.c:${B:10000}}}"`.

Section jump-table in the CE yml: `server:` (HTTP/REST + SSL) L18–60 · `listener:` (MQTT TCP/SSL/WS/WSS, Netty, proxy) L63–248 · `queue:` (Kafka consumers/acks + topic names) L251–653 · `actors:` L668–694 · `mqtt:` (connect threads, flow-control, keep-alive, topic/alias, wildcard toggle, shared-subs, session-expiry, persistent-session, rate-limits) L875–1055 · `security:` (JWT, unauthorized clients) L852–872 · `sql/datasource/redis/cache/stats/management:` L709–1218. (Integration-executor microservice has its own file: `integration/executor/src/main/resources/tbmq-integration-executor.yml`.)

### Listener / port defaults (confirmed in current source)

| Purpose | YAML key (env var) | Default | Enabled by default? |
|---|---|---|---|
| MQTT TCP | `listener.tcp.bind_port` (`LISTENER_TCP_BIND_PORT`) | **1883** | yes |
| MQTTS (SSL) | `listener.ssl.bind_port` (`LISTENER_SSL_BIND_PORT`) | **8883** | **no** (`LISTENER_SSL_ENABLED:false`) |
| MQTT over WS | `listener.ws.bind_port` (`LISTENER_WS_BIND_PORT`) | **8084** | yes |
| MQTT over WSS | `listener.wss.bind_port` (`LISTENER_WSS_BIND_PORT`) | **8085** | **no** (`LISTENER_WSS_ENABLED:false`) |
| HTTP / REST / Web UI | `server.port` (`HTTP_BIND_PORT`) | **8083** | yes |

`8083` is the HTTP/UI/REST port — **not** an MQTT-over-WS port (a classic mistake). Cross-check deployment mappings in CE `docker/docker-compose.yml`.

### MQTT-handling package map (under `application/src/main/java/org/thingsboard/mqtt/broker/`)

| Concept | Where | Key classes |
|---|---|---|
| Netty pipeline / packet entry / decode | `server/` | `MqttSessionHandler`, `MqttChannelInitializer` |
| MQTT ↔ proto conversion | `adaptor/` | `NettyMqttConverter`, `ProtoConverter` |
| CONNECT/CONNACK, takeover, keep-alive negotiation | `actors/client/service/connect/` | `ConnectServiceImpl` |
| Per-packet handlers (PUBLISH, SUB/UNSUB, PUBACK/REC/REL/COMP, PINGREQ) — QoS flows | `actors/client/service/handlers/` | `MqttMessageHandlers`, `MqttPublishHandler`, `MqttPubRelHandler`, `MqttPingHandler` |
| Keep-alive monitoring | `service/mqtt/keepalive/` | `KeepAliveServiceImpl` |
| Last Will | `service/mqtt/will/` | `DefaultLastWillService` |
| Retained messages | `service/mqtt/retain/` | `RetainedMsgServiceImpl`, `RetainMsgTrie` |
| MQTT 5 flow control (Receive Maximum) | `service/mqtt/flow/control/` | `FlowControlServiceImpl` |
| Subscriptions / wildcard trie | `service/subscription/` | `SubscriptionTrie`, `ClientSubscriptionCache` |
| Shared subscriptions | `service/subscription/shared/`, `service/processing/shared/` | `SharedSubscriptionProcessorImpl`, `RoundRobinStrategy` |
| Sessions (state, cache, persistence, expiry) | `service/mqtt/client/session/`, `actors/client/service/session/` | `ClientSessionCache`, `SessionClusterManagerImpl` |
| Persistence: DEVICE vs APPLICATION clients | `service/mqtt/persistence/device/`, `.../application/` | — |
| Authentication (basic/http/jwt/ssl) | `service/auth/providers/` | `MqttClientAuthProvider` + `basic/http/jwt/ssl/` impls |
| MQTT 5 enhanced auth (SCRAM) | `service/auth/enhanced/` | `DefaultEnhancedAuthenticationService` |
| TLS / listener transport | `server/{tcp,tls,ws,wss}/` | `*ServerBootstrap`, `MqttSslHandlerProvider` |
| Topic name validation | `common/dao-api/.../dao/topic/TopicValidationService.java` | — |

### Version

Root `pom.xml` `<version>` — CE `2.4.0-SNAPSHOT`, PE `2.4.0PE-SNAPSHOT` (Maven build; exposed at runtime as `app.version`). Use this to *verify* behavior against the right version, but **write version strings in docs via the `~/data/versions` constants**, never hardcoded.

### CE vs PE — what's actually PE-only

The **entire MQTT protocol core** (listeners, QoS, retained, LWT, shared subs, sessions, keep-alive, flow control, rate limits) **and the HTTP/MQTT/Kafka integrations** are in **both** editions — integrations are **not** PE-only in current source. Gate only these **PE-only** features behind `<ShowFor … show={[Products.TBMQ_PE]}>`: **audit logs, OAuth2/SSO login, RBAC roles & permissions, white-labeling, domain management, image/resource storage, dropped-message reporting** (packages `service/security/auth/oauth2/`, `service/security/permission/`, `service/entity/wl/`, `service/entity/domain/`, `service/resource/`, `service/mqtt/dropped/`; PE-only controllers `AuditLogController`, `OAuth2Controller`, `RoleController`, `WhiteLabelingController`, `DomainController`, `ImageController`, `DroppedMsgController`; PE-only yml sections `audit-log:`, `security.oauth2:`, `mqtt.dropped-msg:`).

### Verify claim → read file (cheat sheet)

- Default value / env-var name → matching key in `thingsboard-mqtt-broker.yml` (CE; PE only if PE-only section).
- Port → `listener.*` / `server.port` keys + `server/{tcp,tls,ws,wss}/*ServerBootstrap.java`.
- QoS PUBACK/PUBREC/PUBREL/PUBCOMP → `actors/client/service/handlers/`.
- CONNECT/keep-alive negotiation → `actors/client/service/connect/ConnectServiceImpl` + `service/mqtt/keepalive/KeepAliveServiceImpl`.
- Retained / LWT / shared-subs / wildcard → `service/mqtt/retain/`, `service/mqtt/will/`, `service/subscription/`.
- Auth → `service/auth/providers/` + `service/auth/enhanced/`.
- "Is this PE-only?" → the PE-only lists above.

## Verify against the MQTT spec

- Protocol claims must match **MQTT 3.1.1 / 5.0**. QoS semantics, packet names, reason codes, wildcard rules, retain semantics, session/expiry behavior, version differences — state them precisely and scope to the version.
- **Cautionary examples** (all plausible and wrong):
  - *WebSocket ports:* `8083` is HTTP/UI/REST; MQTT-over-WS defaults are **8084 (WS)** / **8085 (WSS)**.
  - *QoS durability:* TBMQ acks a QoS 1/2 publish only after Kafka accepts it, but the shipped defaults are `acks=1` / `replication.factor=1`. Scope the claim — survives a TBMQ-node failure; needs a replicated Kafka cluster to survive a Kafka-node failure. Don't say "never lost even if a node fails" unconditionally.
  - *Retain:* the `retain` flag stores the **last value**, not a replayable history/log.
- When two phrasings compete, pick the one true under TBMQ's **default** configuration.

## Complementarity with the learn hub (do this before writing)

1. Check for a paired learn page (`src/pages/mqtt/<slug>.astro` + `src/data/mqttLearn.ts`). If the learn page already explains the concept, the doc should **not** repeat it — open with a one-line concept recap that links back to the learn page (via a plain marketing link `/mqtt/<slug>/`), then go straight to TBMQ specifics.
2. Ensure the learn page links **into** this doc (that's the `mqtt-learn-topic` "<Topic> in TBMQ" rule). If it points at the generic `/docs/mqtt-broker/` root because this page didn't exist yet, upgrade that link to the new specific page.
3. Split by intent: concept/why → learn; parameters/defaults/behavior/steps/UI → doc. Overlap of a sentence is fine; overlap of whole sections is the duplication to avoid.

## Finding gaps (what to create next)

Don't hardcode a gap list — derive it. Compare the MQTT concepts covered on the learn hub (`src/data/mqttLearn.ts` slugs) against the docs inventory:

```bash
# docs that exist under mqtt-broker (CE)
find src/content/docs/docs/mqtt-broker -name '*.mdx' -not -path '*/pe/*' | sed -E 's#.*/mqtt-broker/##; s#\.mdx$##' | sort
# learn topics (each ideally has a technical counterpart)
grep -oE "slug: '[^']+'" src/data/mqttLearn.ts | sed "s/slug: //; s/'//g" | sort
```

MQTT-5-feature concepts that currently have a learn page but **no dedicated doc** (they fall back to `user-guide/mqtt-protocol` or `concepts/sessions`) are prime "create a new doc" candidates — e.g. reason codes, user properties, topic alias, flow control, message/session expiry, request/response. Confirm the gap before creating (the tree evolves).

## Verification

Dev server on `http://localhost:4321` (`NODE_OPTIONS=--max-old-space-size=8192 pnpm dev` if not running — the repo OOMs on the default heap).

```bash
pnpm check                 # astro type-check — expect 0 errors
pnpm lint:eslint           # expect clean
pnpm lint:slugcheck        # slugs consistent across editions
pnpm exec prettier --write "src/content/**/mqtt-broker/**/<page>.mdx" && pnpm exec prettier --check "src/content/**/mqtt-broker/**/<page>.mdx"
curl -s http://localhost:4321/docs/mqtt-broker/<path>/<page>/     | grep -o '<title>'   # CE page renders
curl -s http://localhost:4321/docs/mqtt-broker/pe/<path>/<page>/  | grep -o '<title>'   # PE page renders
pnpm lint:linkcheck        # builds + validates all internal links — run after adding/renaming pages, especially new DocLink targets
```

Ask the user before running `pnpm build:fast` (repo build policy: always ask "run build:fast to verify, or skip?").

## Gotchas

- **Indentation flips vs the learn skill: MDX/YAML use SPACES**, not tabs. (Tabs are only for `.ts`/`.astro` in this repo; `.mdx`, `.json`, `.yaml` use spaces — prettier enforces it.)
- **Both CE and PE stubs are required.** A missing PE stub means the page 404s under `/docs/mqtt-broker/pe/…` and breaks its sidebar entry. The sidebar entry itself is added once (via `${prefix}`) and serves both.
- **`<ShowFor>` for product-conditional prose, not JSX `{props.product === …}`** — the latter disables Markdown parsing and forces raw HTML. Conditional headings use `<ConditionalHeading>`, not `##`.
- **`<DocLink>` for internal doc links**, never bare Markdown links — it resolves the correct CE/PE prefix from `props.product`.
- **Never hardcode versions / image tags** — import from `~/data/versions`.
- **Trailing slash everywhere:** `/docs/mqtt-broker/…/`, and `DocLink` `path` values are prefix-relative (`"user-guide/last-will"`), not absolute.
- **Verify, don't assume.** The most likely way to ship a wrong doc is to state a default from memory. Open `thingsboard-mqtt-broker.yml` and read the `:default`.
- **Don't over-gate.** Integrations (HTTP/MQTT/Kafka) are in CE too — only the PE-only list above goes behind `<ShowFor>`.
- **Don't restructure shared files gratuitously** — `astro.sidebar.ts`, the `Products` enum, and schemas are kept upstream-merge-compatible; add entries, don't reshape.
