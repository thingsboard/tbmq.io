---
name: tbmq-docs-page
description: Review, improve, or create any TBMQ reference doc under /docs/ (CE) or /docs/pe/ (PE) — user guide, installation and cluster setup, security, integrations, concepts, architecture, or performance reference. Verifies technical correctness against BOTH the MQTT spec AND the TBMQ broker source (config defaults, env vars, listener ports, packet handling) in the sibling tbmq / tbmq-pe checkouts, fills gaps with TBMQ-specific parameters, behaviors and instructions, and authors new pages for undocumented topics. Use whenever someone wants to audit, correct, deepen, or extend the TBMQ docs, add a missing doc page, document a config parameter or feature, or verify a documented claim against TBMQ code.
---

# TBMQ Docs Page

`/docs/` is TBMQ's **reference documentation** — the how-to/technical tree that a person *operating* TBMQ relies on. PE renders the same content at `/docs/pe/`. This skill governs three jobs on that tree: **review** an existing page for correctness, **improve** a thin one, or **create** a new page for a topic that has none. The bar is accuracy against two sources of truth at once: the **MQTT spec** (where the page touches protocol behavior) and the **actual TBMQ source code** (always).

> **URL note.** The docs used to live at `/docs/mqtt-broker/` and `/docs/mqtt-broker/pe/`. They are now `/docs/` and `/docs/pe/`. The old shape survives in two non-URL places, both correct: the **`_includes` directory path** (`src/content/_includes/docs/mqtt-broker/…`, kept so upstream cherry-picks stay clean — see [File map](#a-doc-page--3-files--1-sidebar-entry)) and the **image asset tree** (`src/assets/images/docs/mqtt-broker/…`). Never write `/docs/mqtt-broker/` as a *URL*; the repo's redirect arrays are empty because thingsboard.io's edge redirects already map every legacy URL one-hop to its final tbmq.io page.

**Scope: the whole tree, not just protocol topics.** 88 CE pages / 94 PE pages are in scope, and the sections differ in character — write to the one you're in:

| Section | Character | What "accurate" means here |
|---|---|---|
| `user-guide/` (incl. `user-guide/ui/`) | operating the broker, UI paths, per-feature behavior | env var + default + UI path + edge cases |
| `installation/` (incl. `cluster/`) | runnable setup — Docker, compose, k8s, helm, AWS/Azure/GCP, upgrades | commands and manifests that actually work, versions from `~/data/versions` |
| `security/` (incl. `security/authentication/`) | listeners, TLS, the auth providers | which listener/provider, its yml keys, its default enabled state |
| `integrations/` | HTTP / Kafka / MQTT integrations (**in CE too**) | config fields, payload handling, failure behavior |
| `concepts/`, `architecture`, `architecture-details/` | how TBMQ is built — clustering, sessions, client types, persistence | the real components and data flow, not an idealized diagram |
| `reference/`, `other/` | performance results, blocked clients, proxy protocol, msg-delivery strategies, health, bulk provisioning | the actual measured numbers and their conditions |

Most of the tree has **no** `/mqtt/` learn-page counterpart — only **9 of 82** CE page names overlap (`keep-alive`, `last-will`, `mqtt-broker`, `mqtt-client-id`, `qos`, `retained-messages`, `security`, `shared-subscriptions`, `topics`). Treat pairing as the exception it is — see [If the page has a learn-hub counterpart](#if-the-page-has-a-learn-hub-counterpart), and skip that section entirely when it doesn't.

## Principles

- **Accuracy is the product — verified against source, not memory.** Every default value, parameter name, port, command, and behavioral claim must match the current TBMQ source (see [Verify against the TBMQ source](#verify-against-the-tbmq-source)). Plausible-but-wrong is the failure mode; a doc that says "the default is X" when the code says Y is worse than no doc. If you can't verify it in source or the spec, don't write it.
- **TBMQ-specific and task-shaped.** A doc's job is what TBMQ *does* and how to operate it: the env var that controls a behavior, its default, the UI path to change it, the commands to run, the edge cases, the CE-vs-PE difference. Explain the underlying concept only as far as the reader needs to complete the task — a paragraph of orientation is right, a tutorial on the concept is not. (When a `/mqtt/` learn page already owns that concept, link to it instead of restating it.)
- **One include, two editions.** Content is written once in a shared `_includes` file and rendered for both CE and PE via thin stubs. Product differences are handled inline with `<ShowFor>` / `<ConditionalHeading>`, not by forking the content.
- **Spec-precise where the spec applies.** For pages that touch protocol behavior — MQTT 3.1.1 vs 5.0 differences, QoS semantics, packet names, reason codes, wildcard rules — state them exactly and scope any claim to the version it applies to. Installation and performance pages have no spec dimension; their equivalent bar is that the commands and numbers are real.

## A doc page = 3 files + 1 sidebar entry

```
src/content/_includes/docs/mqtt-broker/<include-path>.mdx   ← the actual content (SHARED by CE + PE). No frontmatter.
src/content/docs/docs/<slug>.mdx                            ← CE stub: frontmatter + imports include, passes Products.TBMQ
src/content/docs/docs/pe/<slug>.mdx                         ← PE stub: same, passes Products.TBMQ_PE
astro.sidebar.ts                                            ← one entry in tbmqGuideItems (serves CE + PE via the prefix arg)
```

URL: `/docs/<slug>/` (CE) and `/docs/pe/<slug>/` (PE). `trailingSlash: 'always'`.

**The include path is decoupled from the URL slug — don't assume they match.** The include tree mirrors the *upstream thingsboard.io* layout so cherry-picks stay clean; the stub slug is whatever this site wants the URL to be. Real pairs in the repo:

| CE stub (→ URL) | Include it imports |
|---|---|
| `other/blocked-client` | `user-guide/blocked-clients.mdx` |
| `other/health` | `user-guide/health-api.mdx` |
| `other/msg-delivery-strategy` | `user-guide/msg-delivery-strategies.mdx` |
| `other/proxy-protocol` | `user-guide/proxy-protocol.mdx` |
| `security/https` | `security/enable-https.mdx` |
| `architecture-details/persistent-app-client` | `reference/architecture/persistent-application-client.mdx` |
| `user-guide/ui/shared-subscriptions` | `user-guide/ui/application-shared-subscriptions.mdx` |
| `user-guide/integrations/how-to-connect-thingsboard-to-tbmq` | `user-guide/integration-with-thingsboard.mdx` |
| `application-shared-subscription` | `reference/rest-api/application-shared-subscriptions-management.mdx` |
| `subscription` (PE-only) | `user-guide/private-cloud-subscription.mdx` |

When editing an existing page, **open the stub first** and read its `import PageContent from '@includes/…'` line — that is the only reliable way to find the file the content lives in. For a *new* page, pick the include path that matches where upstream would put it (usually mirroring the slug is fine).

**Exception — a wholly PE-only page** (the feature does not exist in CE at all): create the include and the **PE stub only**, *no* CE stub, and gate the sidebar entry with `isPE`. That is 2 files + 1 gated entry. The 8 PE-only pages today:

`white-labeling` · `image-gallery` · `subscription` · `security/rbac` · `security/audit-log` · `security/domains` · `security/oauth-2-support` · `user-guide/dropped-messages`

Adding a CE stub for one of these publishes a PE feature to CE readers — the error the edition split exists to prevent.

**The mirror case — CE-only.** Two pages have no PE stub: `installation/building-from-source` (gated `!isPE` in `tbmqInstallItems`) and `newsletter-thanks` (a standalone page with no include and no sidebar entry). Everything else ships in both.

Choosing between the two shapes: use `<ShowFor>` inside a **shared** page when only *part* of the content is PE-only; use a **PE-only page** when the whole topic is. Check the PE-only list above and [CE vs PE](#ce-vs-pe--whats-actually-pe-only) before deciding, and ask if it isn't clear-cut.

Existing pages are the best reference — read a neighbour in the same section before writing, since conventions differ by section. Models worth copying:

- `_includes/docs/mqtt-broker/user-guide/keep-alive.mdx` — a feature page that stays TBMQ-technical (the `MQTT_KEEP_ALIVE_MONITORING_DELAY_MS` env var, the `KEEP_ALIVE_TIMEOUT` reason, client-takeover + will-delay nuance) instead of re-teaching the ping concept.
- `_includes/docs/mqtt-broker/installation/docker.mdx` — the setup-page convention: multi-line commands are declared as `export const` template literals at the top of the include, interpolating `TBMQ_VER` / `TBMQ_BRANCH`, then rendered with `<Code code={theConst} lang="bash" />`. That is how versioned commands stay out of hardcoded strings — follow it rather than pasting a fenced block with a literal version in it. Short one-liners can go inline: `<Code code="./tbmq-install-and-run.sh" lang="bash" />`.
- `_includes/docs/mqtt-broker/security/authentication/x509.mdx` — a provider page: yml keys, default enabled state, and `<Steps>` for the configuration walkthrough.
- `_includes/docs/mqtt-broker/integrations/kafka.mdx` — an integration page (present in CE **and** PE; don't gate these).

**`<Steps>` is rarer than it looks — match the section, don't sprinkle it.** Current usage across the include tree: `integrations/` 3 of 3 files, `security/` 3 of 13, `user-guide/` 4 of 30, and **zero** in `installation/`, `concepts/`, and `reference/`. Installation sequences with headings and `<Code>` blocks instead. Reach for `<Steps>` only for a genuinely ordered UI/config walkthrough.

### The stubs (nearly boilerplate)

CE stub (`src/content/docs/docs/<slug>.mdx`):

```mdx
---
title: Keep Alive
description: MQTT Keep Alive mechanism in TBMQ — connection timeout detection and PING request/response behavior.
---

import PageContent from '@includes/docs/mqtt-broker/<include-path>.mdx'
import { Products } from '~/models/site.models'

<PageContent product={Products.TBMQ}/>
```

PE stub (`src/content/docs/docs/pe/<slug>.mdx`): **identical**, except the last line passes `Products.TBMQ_PE`. For a page that ships in **both** editions, both stubs are required — each edition resolves its own. A wholly PE-only page has the PE stub only (see the exception above). Frontmatter is the `base` schema in `src/content.config.ts` (`title` + `description`; `type` defaults to `base` — never declare it). `description` is the meta description — benefit-framed, ~150–160 chars, includes the key term.

The docs collection is `docsSchema({ extend: baseSchema })`, so **Starlight's own frontmatter is available too** — `tableOfContents: false`, `editUrl: false`, `sidebar`, `slug`, `hero` (see `search.mdx` / `newsletter-thanks.mdx`). Extra `baseSchema` fields you may legitimately need: `wrapTableCode: true` (opt in to breaking long inline-code tokens inside that page's tables — use only when a code column is otherwise unreadable), `selfCanonical` / `canonicalUrl`, `customDocsTitle`.

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

- Wrap PE-only (or CE-only) blocks in `<ShowFor product={props.product} show={[Products.TBMQ_PE]}>…</ShowFor>` and write **normal Markdown** inside. Do **not** use `{props.product === … && (<>…</>)}` with hand-written HTML — a JSX `{…}` expression disables Markdown parsing. (A handful of `installation/` includes still use the old JSX form; don't copy them, and don't mass-convert them either.)
- Conditional **headings** use `<ConditionalHeading level={2|3} id="…" showFor="…">`, not `##` — the TOC plugin (`config/plugins/rehype-mdx-include-headings.ts`) reads the raw tag to decide whether the heading enters that edition's TOC.
  - **The product ids are `mqtt-broker` (CE) and `mqtt-broker-pe` (PE)** — derived from the stub path (`docs/pe/…` → `mqtt-broker-pe`). Not `ce`/`pe`. So PE-only is `showFor="mqtt-broker-pe"` and CE-only is `exclude="mqtt-broker-pe"`. The component's own docstring shows a stale `Products.CE` example — ignore it and follow the shipped usage in `getting-started.mdx` / `roadmap.mdx`.
  - `id` is required and must be the slugified heading text, so the TOC anchor resolves.
- Internal doc links use **`<DocLink product={props.product} path="user-guide/…">`** (product-aware; always prefer over a bare Markdown link). It builds `/docs/{prefix}{path}/`, so `path` is **prefix-relative and slash-free at the front** (`"user-guide/last-will"`, not `"/docs/user-guide/last-will"`). It supports `#anchor` and `?query` inside `path`, a `target` prop, and **`bold` which defaults to `true`** — pass `bold={false}` when the link sits mid-sentence and shouldn't render bold. There is **no** `useTbDocs` prop; every `DocLink` resolves inside this site's docs tree.
- **Never hardcode version strings** — import `TBMQ_VER` / `TBMQ_PE_VER` / `TBMQ_BRANCH` from `~/data/versions`.

### Sidebar

`astro.sidebar.ts` builds both editions from three prefix-parameterized helpers — `tbmqGuideItems(prefix)`, `tbmqInstallItems(prefix)`, `tbmqReferenceItems(prefix)` — called with **`'docs'`** for CE and **`'docs/pe'`** for PE. One entry therefore serves both:

```ts
{ label: 'Keep alive', slug: `${prefix}/user-guide/keep-alive` },
```

Groups inside the helpers: **Security**, **MQTT features**, **Integration with ThingsBoard**, **Operating TBMQ**, **Integrations**, **Management console**, **Troubleshooting**, **Prometheus metrics**, plus PE-gated **White Labeling** / **Private Cloud subscription** (`tbmqGuideItems`); **Live demo / On-premises / Cloud / Helm / Upgrade instructions** (`tbmqInstallItems`); **Architecture / Configuration / Performance tests / REST APIs** (`tbmqReferenceItems`). PE-only entries go behind the `isPE` conditional already used in the file; the one CE-only entry uses `!isPE`.

**The `Getting Started`, `Core concepts` and `Releases` groups are NOT parameterized** — `tbmqSidebar` and `tbmqPeSidebar` each spell those slugs out by hand (`'docs/why-tbmq'` vs `'docs/pe/why-tbmq'`). Adding a page to one of those three groups means **two** edits, one per array. Everything else is a single edit inside a helper.

## Verify against the TBMQ source

Both repos share the Maven layout and package root `org.thingsboard.mqtt.broker`; the broker app is the `application/` module. **PE is a superset of CE — verify common behavior against the CE files, which PE inherits; verify PE-only features against the PE repo.**

The broker repos are checked out as **siblings of this repo**, so resolve them relative to the tbmq.io root instead of hardcoding a home directory:

- CE: `../tbmq`
- PE: `../tbmq-pe`

Confirm before relying on either: `ls ../tbmq/application/src/main/resources/thingsboard-mqtt-broker.yml`. If a sibling is missing, **ask for the checkout path** — never fall back to stating a default you haven't read.

**Audit for omissions, not only errors.** When reviewing or improving a page, read the relevant source (the yml defaults, the handler/service classes in the package map below) and check for important params, defaults, or behaviors the page *doesn't mention yet* — the completeness counterpart to verifying the claims it does make. (This is per-page; the tree-level "which page is missing" audit stays in the "Finding gaps" section.)

### Config defaults — the single source of truth

**`application/src/main/resources/thingsboard-mqtt-broker.yml`** (in each repo) defines every default. Values use Spring's `${ENV_VAR:default}` syntax, one per line with a comment — **the `:default` portion is the source of truth for any "the default is X" claim.** Examples (CE):

- `port: "${HTTP_BIND_PORT:8083}"` · `bind_port: "${LISTENER_TCP_BIND_PORT:1883}"`
- `max-keep-alive: "${MQTT_KEEP_ALIVE_MAX_KEEP_ALIVE_SEC:600}"` · `acks: "${TB_KAFKA_DEFAULT_PRODUCER_ACKS:1}"`
- Nested fallback form occurs too: `"${A:${b.c:${B:10000}}}"`.

**Don't navigate by line number — line numbers drift with every release.** Jump by top-level key instead:

```bash
grep -nE '^[a-z][a-z0-9_-]*:' ../tbmq/application/src/main/resources/thingsboard-mqtt-broker.yml   # section map
grep -n 'MQTT_KEEP_ALIVE' ../tbmq/application/src/main/resources/thingsboard-mqtt-broker.yml       # a specific knob
```

The CE file is ~1300 lines with these top-level sections: `server:` (HTTP/REST + SSL) · `listener:` (MQTT TCP/SSL/WS/WSS, Netty, proxy) · `queue:` (Kafka consumers/acks + topic names) · `service:` · `actors:` · `integrations:` · `database:` / `sql:` / `lettuce:` / `spring:` · `security:` (JWT, unauthorized clients) · `mqtt:` (connect threads, flow-control, keep-alive, topic/alias, wildcard toggle, shared-subs, session-expiry, persistent-session, rate-limits) · `device:` / `cache:` / `redis:` · `stats:` / `historical-data-report:` / `management:` · `springdoc:` / `swagger:` / `app:` / `analysis:`.

PE adds `audit-log:` at the top level plus `security.oauth2:`, `mqtt.dropped-msg:` and `queue.dropped-msg:`. The integration-executor microservice has its own file: `integration/executor/src/main/resources/tbmq-integration-executor.yml` (documented at `installation/ie-config`).

### Listener / port defaults (confirmed in current source)

| Purpose | YAML key (env var) | Default | Enabled by default? |
|---|---|---|---|
| MQTT TCP | `listener.tcp.bind_port` (`LISTENER_TCP_BIND_PORT`) | **1883** | yes (`LISTENER_TCP_ENABLED:true`) |
| MQTTS (SSL) | `listener.ssl.bind_port` (`LISTENER_SSL_BIND_PORT`) | **8883** | **no** (`LISTENER_SSL_ENABLED:false`) |
| MQTT over WS | `listener.ws.bind_port` (`LISTENER_WS_BIND_PORT`) | **8084** | yes (`LISTENER_WS_ENABLED:true`) |
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

Root `pom.xml` `<version>` — CE `2.4.0-SNAPSHOT`, PE `2.4.0PE-SNAPSHOT` (Maven build; exposed at runtime as `app.version`). The **published** version the docs target is lower: `src/data/versions.ts` currently ships `TBMQ_VER = '2.3.0'`, `TBMQ_PE_VER = '2.3.0PE'`, `TBMQ_BRANCH = 'release-2.3.0'`. Use the pom to *verify* behavior against the right source tree, but **write version strings in docs via the `~/data/versions` constants**, never hardcoded. If a behavior exists only on the SNAPSHOT and not in the released version, don't document it yet.

### CE vs PE — what's actually PE-only

The **entire MQTT protocol core** (listeners, QoS, retained, LWT, shared subs, sessions, keep-alive, flow control, rate limits) **and the HTTP/MQTT/Kafka integrations** are in **both** editions — integrations are **not** PE-only in current source. Gate only these **PE-only** features behind `<ShowFor … show={[Products.TBMQ_PE]}>`: **audit logs, OAuth2/SSO login, domain management, RBAC roles & permissions, white-labeling, image/resource storage, dropped-message reporting, Private Cloud subscription** (packages `service/security/auth/oauth2/`, `service/security/permission/`, `service/entity/wl/`, `service/entity/domain/`, `service/resource/`, `service/mqtt/dropped/`; PE-only controllers `AuditLogController`, `OAuth2Controller`, `RoleController`, `WhiteLabelingController`, `DomainController`, `ImageController`, `DroppedMsgController`; PE-only yml sections `audit-log:`, `security.oauth2:`, `mqtt.dropped-msg:`).

### Verify claim → read file (cheat sheet)

- Default value / env-var name → matching key in `thingsboard-mqtt-broker.yml` (CE; PE only if PE-only section).
- Port → `listener.*` / `server.port` keys + `server/{tcp,tls,ws,wss}/*ServerBootstrap.java`.
- QoS PUBACK/PUBREC/PUBREL/PUBCOMP → `actors/client/service/handlers/`.
- CONNECT/keep-alive negotiation → `actors/client/service/connect/ConnectServiceImpl` + `service/mqtt/keepalive/KeepAliveServiceImpl`.
- Retained / LWT / shared-subs / wildcard → `service/mqtt/retain/`, `service/mqtt/will/`, `service/subscription/`.
- Auth → `service/auth/providers/` + `service/auth/enhanced/`.
- Integration executor config → `integration/executor/src/main/resources/tbmq-integration-executor.yml`.
- "Is this PE-only?" → the PE-only lists above.

## Verify against the MQTT spec

- Protocol claims must match **MQTT 3.1.1 / 5.0**. QoS semantics, packet names, reason codes, wildcard rules, retain semantics, session/expiry behavior, version differences — state them precisely and scope to the version.
- **Cautionary examples** (all plausible and wrong):
  - *WebSocket ports:* `8083` is HTTP/UI/REST; MQTT-over-WS defaults are **8084 (WS)** / **8085 (WSS)**.
  - *QoS durability:* TBMQ acks a QoS 1/2 publish only after Kafka accepts it, but the shipped defaults are `acks=1` / `replication.factor=1`. Scope the claim — survives a TBMQ-node failure; needs a replicated Kafka cluster to survive a Kafka-node failure. Don't say "never lost even if a node fails" unconditionally.
  - *Retain:* the `retain` flag stores the **last value**, not a replayable history/log.
- When two phrasings compete, pick the one true under TBMQ's **default** configuration.

## If the page has a learn-hub counterpart

**Optional — most pages don't** (9 of 82; the list is in the Scope section). Skip this section unless the page is one of them. Installation, cluster setup, integrations, performance reference and `other/` pages have no counterpart, and nothing here applies to them.

Check with `ls src/pages/mqtt/ | grep <topic>`. If a learn page exists:

1. **Don't re-teach the concept.** Open with a one-line recap that links back via a plain marketing link (`/mqtt/<slug>/`), then go straight to TBMQ specifics.
2. **Split by intent** — concept/why → learn page; parameters/defaults/behavior/steps/UI → this doc. A sentence of overlap is fine; a whole duplicated section is not.
3. **Point the learn page at this doc** if it currently links only the generic `/docs/` root because this page didn't exist yet (only `mqtt-vs-amqp` and `mqtt-vs-coap` legitimately do). That's the `mqtt-learn-topic` skill's rule; use that skill if the learn page itself needs work.

## Finding gaps (what to create or fix next)

Don't hardcode a gap list — derive it. Several angles, in rough order of yield:

**Undocumented config.** The highest-yield sweep: diff the yml's env vars against what the docs mention.

```bash
# env vars defined in the broker config
grep -ohE '\$\{[A-Z0-9_]+' ../tbmq/application/src/main/resources/thingsboard-mqtt-broker.yml | tr -d '${' | sort -u
# env vars the docs mention
grep -rohE '[A-Z][A-Z0-9_]{6,}' src/content/_includes/docs/mqtt-broker | sort -u
```

`comm -23` the two lists to see the difference. Expect ~90 hits, most of them **intentional internal knobs** (thread-pool sizes, `ACTORS_*` dispatcher tuning) that should stay undocumented — so judge per parameter and only document what an operator would plausibly tune. A gap that matters looks like a rate limit, timeout, or feature toggle, not a pool size.

**Thin or stale pages.** Short includes are candidates for deepening; a page whose defaults no longer match the yml is a correctness bug:

```bash
wc -l $(find src/content/_includes/docs/mqtt-broker -name '*.mdx') | sort -n | head -20
```

**Missing section coverage.** Compare the sidebar groups in `astro.sidebar.ts` against the actual tree — a feature with a UI page but no doc, a new integration, a cluster target with no setup guide.

**Orphaned includes / stubs.** An include nothing imports, or a stub whose include was renamed:

```bash
# includes with no importing stub
for f in $(find src/content/_includes/docs/mqtt-broker -name '*.mdx' | sed 's#src/content/_includes/##; s#\.mdx$##'); do
  grep -rq "@includes/$f.mdx" src/content/docs || echo "orphan include: $f"
done
```

**Learn-hub topics with no technical doc** (only relevant to protocol concepts):

```bash
find src/content/docs/docs -name '*.mdx' -not -path '*/pe/*' | sed -E 's#.*/docs/docs/##; s#\.mdx$##' | sort
grep -oE "slug: '[^']+'" src/data/mqttLearn.ts | sed "s/slug: //; s/'//g" | sort
```

MQTT-5 features that fall back to `user-guide/mqtt-protocol` — reason codes, user properties, topic alias, flow control, message/session expiry, request/response — are standing candidates. Confirm any gap before creating; the tree evolves.

## Verification

Dev server on `http://localhost:4321` (`NODE_OPTIONS=--max-old-space-size=8192 pnpm dev` if not running — the repo OOMs on the default heap).

```bash
pnpm check                 # astro type-check — expect 0 errors
pnpm lint:eslint           # expect clean
pnpm lint:slugcheck        # slugs consistent across editions
pnpm lint:steps            # catches a markdown list inside <Steps> inside a JSX {…} block
pnpm exec prettier --write "src/content/**/docs/**/<page>.mdx" && pnpm exec prettier --check "src/content/**/docs/**/<page>.mdx"
curl -s http://localhost:4321/docs/<slug>/     | grep -o '<title>[^<]*'   # CE page renders
curl -s http://localhost:4321/docs/pe/<slug>/  | grep -o '<title>[^<]*'   # PE page renders
pnpm lint:linkcheck        # builds + validates all internal links — run after adding/renaming pages, especially new DocLink targets
```

If you **rename or move** an existing page, add the old→new pair to `SINGLE_REDIRECTS` (or `CATCH_ALL_REDIRECTS` for a whole prefix) in `src/data/redirects.ts`, run `pnpm generate:redirects`, and commit the regenerated `public/_redirects` + `public/redirects.json`. Do not create an `.astro` redirect stub under `src/pages/docs/`.

Ask the user before running `pnpm build:fast` (repo build policy: always ask "run build:fast to verify, or skip?").

## Gotchas

- **The URL is `/docs/…`, the include directory is `_includes/docs/mqtt-broker/…`.** Both are correct; don't "fix" the include path, and don't let it leak into a link.
- **Indentation flips vs the learn skill: MDX/YAML use SPACES**, not tabs. (Tabs are only for `.ts`/`.astro` in this repo; `.mdx`, `.json`, `.yaml` use spaces — prettier enforces it.)
- **Both CE and PE stubs are required** for a page that ships in both editions. A missing PE stub means the page 404s under `/docs/pe/…` and breaks its sidebar entry. The sidebar entry itself is added once (via `${prefix}`) and serves both — **except** in the `Getting Started` / `Core concepts` / `Releases` groups, which are hand-duplicated per edition. **A wholly PE-only page is the other exception:** PE stub only, no CE stub, sidebar entry gated with `isPE`.
- **`<ShowFor>` for product-conditional prose, not JSX `{props.product === …}`** — the latter disables Markdown parsing and forces raw HTML. It also breaks `<Steps>`: a markdown numbered list inside a JSX expression never compiles to `<ol>`, and Starlight throws during `llms-full.txt` generation, far from the source. That's what `pnpm lint:steps` guards.
- **`<ConditionalHeading>` product ids are `mqtt-broker` / `mqtt-broker-pe`**, not `ce`/`pe`. A wrong id silently drops the heading from the TOC — no build error.
- **`<DocLink>` for internal doc links**, never bare Markdown links — it resolves the correct CE/PE prefix from `props.product`. Its `path` is prefix-relative (`"user-guide/last-will"`), and `bold` defaults to **true**.
- **Never hardcode versions / image tags** — import from `~/data/versions`.
- **Trailing slash everywhere:** `/docs/…/`, `/docs/pe/…/`.
- **Verify, don't assume.** The most likely way to ship a wrong doc is to state a default from memory. Open `thingsboard-mqtt-broker.yml` and read the `:default`.
- **Don't over-gate.** Integrations (HTTP/MQTT/Kafka) are in CE too — only the PE-only list above goes behind `<ShowFor>`.
- **Default to no screenshots** (repo CLAUDE.md): describe the exact page, button, field and toggle labels in `<Steps>` instead. Never bulk-remove the older annotated galleries from a page you happen to be editing — that's the user's call, page by page.
- **Asset references fail silently.** A missing image makes `ImageGallery` swap in a CDN URL instead of erroring, so `astro check` and the build both pass. Grep the built site for `img.thingsboard.io` to catch it (the one legitimate hit is `support-ukraine-banner.webp`).
- **Don't restructure shared files gratuitously** — `astro.sidebar.ts`, the `Products` enum, and the schemas are kept upstream-merge-compatible; add entries, don't reshape.
