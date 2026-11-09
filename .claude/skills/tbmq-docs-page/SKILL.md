---
name: tbmq-docs-page
description: Reviews, improves, or creates TBMQ reference docs under /docs/ (CE) and /docs/pe/ (PE) — user guide, installation and cluster setup, security, integrations, concepts, architecture, and performance pages — checking every claim against the MQTT spec and the TBMQ broker source (config defaults, env vars, listener ports, packet handling). Use when someone wants to audit, correct, deepen, or extend a TBMQ docs page, add a missing page, document a config parameter or feature, find documentation gaps, or verify a documented claim against TBMQ code. When the trigger is a specific PR, ticket, or branch that just landed, use tbmq-docs-sync instead.
---

# TBMQ docs page

`/docs/` is TBMQ's reference documentation for people *operating* the broker; PE renders the same
content at `/docs/pe/`. This skill covers three jobs on that tree: **review** a page for correctness,
**improve** a thin one, or **create** a page for an undocumented topic. The bar is accuracy against
the TBMQ source code (always) and the MQTT spec (wherever the page touches protocol behavior). A doc
that says "the default is X" when the code says Y is worse than no doc.

## Live repo state

Loaded when this skill starts, so it is current. If a block is empty, run the same command yourself.

Version constants (`src/data/versions.ts`):

```!
grep -hE '^export const' "${CLAUDE_SKILL_DIR}/../../../src/data/versions.ts" || true
```

Pages that exist in only one edition (every other page ships in both):

```!
(cd "${CLAUDE_SKILL_DIR}/../../../src/content/docs/docs" && comm -3 <(find . -name '*.mdx' -not -path './pe/*' | sed 's#^\./##' | sort) <(find pe -name '*.mdx' | sed 's#^pe/##' | sort) | sed 's#^\t#PE-only: #; /^PE-only/!s#^#CE-only: #') || true
```

## Workflow

Copy this checklist and tick it off:

```
- [ ] 1. Locate: for a "new" page, first check it doesn't already exist (search the stub tree and includes). For an existing page, open the stub and read its `import PageContent from '@includes/…'` line — the include path often differs from the slug
- [ ] 2. Read a neighbour page in the same section; conventions differ by section
- [ ] 3. Decide the edition from the live split above (both / PE-only / CE-only)
- [ ] 4. Verify every claim against source on the right ref, and the spec where it applies; audit for omissions too
- [ ] 5. Write in the shared include; gate partial PE-only content with <ShowFor>
- [ ] 6. New page: stubs + sidebar entry. Renamed page: redirect
- [ ] 7. Run the checks in Verification
```

To find what to write next rather than fix a given page, read `references/finding-gaps.md`.

## Rules

- **Verify against source, never memory.** Every default, parameter name, port, command and behavioral claim must match the broker code. If you can't verify it in source or the spec, don't write it — flag the gap.
- **Read the right ref, not the working tree.** The sibling checkouts `../tbmq` (CE) and `../tbmq-pe` (PE) usually sit on feature branches. `git fetch`, then read with `git show origin/main:<path>` (CE) or `git show origin/license:<path>` (PE) — this site's `develop` branch describes the upcoming release, which those broker branches carry. When a claim must hold for what is live today, read the tag `v<TBMQ_VER>` / `v<TBMQ_PE_VER>` instead. If a sibling is missing, ask for its path.
- **Verify each edition on its own repo.** PE's `license` branch is not strictly "CE plus extras" — it can drop or replace CE code and lag CE features. A PE claim is checked on `tbmq-pe`, even when CE has the same feature.
- **Decide the edition from the stub tree, not from feature category.** Some integrations are CE (HTTP, MQTT, Kafka) and others are PE-only (the database sinks, RabbitMQ, the source integrations); the live split above is authoritative. Leaking a PE feature into CE docs is a real error; over-gating a CE feature hides it from CE readers.
- **TBMQ-specific and task-shaped.** Document what TBMQ does and how to operate it: the env var, its default, the UI path, the commands, the edge cases, the CE/PE difference. Explain a concept only as far as the task needs; if a `/mqtt/` learn page owns the concept, link to it.
- **Write once, render twice.** Content lives in one shared include rendered by both stubs. Handle edition differences inline with `<ShowFor>` / `<ConditionalHeading>`, not by forking the content.
- **Default to no screenshots.** Describe the exact page, button, field and toggle labels in `<Steps>`. Never bulk-remove the older annotated galleries from a page you are editing — that is the user's call, page by page.

## Page anatomy

```
src/content/_includes/docs/mqtt-broker/<include-path>.mdx   ← the content, shared by CE + PE, no frontmatter
src/content/docs/docs/<slug>.mdx                            ← CE stub: frontmatter + import, passes Products.TBMQ
src/content/docs/docs/pe/<slug>.mdx                         ← PE stub: same, passes Products.TBMQ_PE
astro.sidebar.ts                                            ← one entry, usually in a prefix-parameterized helper
```

URLs are `/docs/<slug>/` and `/docs/pe/<slug>/` (`trailingSlash: 'always'`). The `mqtt-broker`
segment exists only in the include directory (and the image tree `src/assets/images/docs/mqtt-broker/`)
— never write `/docs/mqtt-broker/` as a URL.

**The include path is decoupled from the slug.** The include tree mirrors upstream thingsboard.io so
cherry-picks stay clean; for example the stub `other/blocked-client` imports
`user-guide/blocked-clients.mdx`. For a new page, mirroring the slug is fine.

**Edition shapes:**

| Shape | Files | Sidebar |
|---|---|---|
| Both editions (the default) | include + CE stub + PE stub | one entry |
| Wholly PE-only feature | include + PE stub only | entry gated with `isPE` |
| CE-only | include + CE stub only | entry gated with `!isPE` |

Use `<ShowFor>` inside a shared page when only *part* of the content is PE-only; use a PE-only page
when the whole topic is. Ask when it isn't clear-cut.

### Stub

```mdx
---
title: Keep Alive
description: MQTT Keep Alive mechanism in TBMQ — connection timeout detection and PING request/response behavior.
---

import PageContent from '@includes/docs/mqtt-broker/<include-path>.mdx'
import { Products } from '~/models/site.models'

<PageContent product={Products.TBMQ}/>
```

The PE stub is identical except for `Products.TBMQ_PE`. Frontmatter: `title` and `description`
(the meta description — benefit-framed, ~150–160 chars, includes the key term). Never declare
`type:`. Starlight's own frontmatter also works (`tableOfContents`, `editUrl`, `sidebar`, `slug`,
`hero`), as do `wrapTableCode: true` (only when a table's code column is otherwise unreadable),
`selfCanonical` / `canonicalUrl` and `customDocsTitle`.

### Shared include

```mdx
import { Aside, Code, Tabs, TabItem } from '@astrojs/starlight/components';
import { Products } from '~/models/site.models';
import ShowFor from '~/components/ShowFor.astro';
import ConditionalHeading from '~/components/ConditionalHeading.astro';
import DocLink from '@components/DocLink.astro';
import { TBMQ_VER } from '~/data/versions';

Intro paragraph — what this page covers in TBMQ terms.

## How it works in TBMQ

The keep-alive check runs every second by default, controlled by
`MQTT_KEEP_ALIVE_MONITORING_DELAY_MS`. On timeout the broker closes the connection with reason
`KEEP_ALIVE_TIMEOUT` and fires the client's
<DocLink product={props.product} path="user-guide/last-will" bold={false}>Last Will</DocLink>.

<ShowFor product={props.product} show={[Products.TBMQ_PE]}>
PE-only detail written as **normal Markdown** — lists, `code`, `<Tabs>`, `<Aside>` all work here.
</ShowFor>
```

- **`<ShowFor>` with Markdown inside, never `{props.product === … && (<>…</>)}`.** A JSX expression disables Markdown parsing and breaks `<Steps>` (a list inside it never becomes `<ol>`, and Starlight throws during `llms-full.txt` generation). A few old `installation/` includes still use the JSX form; don't copy them and don't mass-convert them.
- **A `<ShowFor>` block cannot add one item to a list or one row to a table** — the parser closes the list at the block. Duplicate the whole list/table per edition, or reword so it is edition-neutral.
- **Conditional headings** use `<ConditionalHeading level={2|3} id="…" showFor="mqtt-broker-pe">` (CE-only: `exclude="mqtt-broker-pe"`), not `##`. The ids are `mqtt-broker` / `mqtt-broker-pe`, not `ce`/`pe`; a wrong id silently drops the heading from the TOC. `id` must be the slugified heading text. Follow the shipped usage in `getting-started.mdx` / `roadmap.mdx`, not the component's stale docstring.
- **`<DocLink>` for every internal doc link.** `path` is prefix-relative with no leading slash (`"user-guide/last-will"`, `#anchor` and `?query` allowed). `bold` defaults to `true` — pass `bold={false}` mid-sentence.
- **Versioned commands:** declare multi-line commands as `export const` template literals at the top of the include, then render with `<Code code={theConst} lang="bash" />`. Never type a version by hand. Interpolate `TBMQ_VER` in CE (and shared) commands, `TBMQ_PE_VER` in PE-only ones (inside `<ShowFor … show={[Products.TBMQ_PE]}>`), and `TBMQ_BRANCH` in script/raw-file URLs. Model: `installation/cluster/helm-cluster-setup-minikube.mdx` (`peImagesYaml`). Don't copy `installation/docker.mdx`: it still switches editions with the JSX form.
- **`<Steps>` only for a genuinely ordered UI or config walkthrough.** It is common in `integrations/`, occasional in `security/` and `user-guide/`, and absent from `installation/`, `concepts/` and `reference/`, which sequence with headings and `<Code>` blocks. Check with `grep -rl '<Steps' src/content/_includes/docs/mqtt-broker/<section>`.

Models worth copying: `user-guide/keep-alive.mdx` (feature page that stays TBMQ-technical),
`installation/cluster/helm-cluster-setup-minikube.mdx` (versioned config), `security/authentication/x509.mdx` (provider page:
yml keys, default enabled state, `<Steps>`), `integrations/kafka.mdx` (integration page).

### Sidebar

`astro.sidebar.ts` builds both editions from `tbmqGuideItems(prefix)`, `tbmqInstallItems(prefix)`
and `tbmqReferenceItems(prefix)`, called with `'docs'` (CE) and `'docs/pe'` (PE), so one entry
serves both:

```ts
{ label: 'Keep alive', slug: `${prefix}/user-guide/keep-alive` },
```

Gate single-edition entries with the `isPE` constant already in each helper. The **Getting
Started** group (all its subgroups, e.g. *Welcome to MQTT!*, *Core concepts*) and **Releases** are not parameterized —
`tbmqSidebar` and `tbmqPeSidebar` each spell them out, so a page there needs two edits. Add entries;
don't restructure the file.

## Verify against the TBMQ source

`references/source-map.md` has the details: the yml section map, listener defaults, the
MQTT-handling package map, PE-only code, and a claim → file cheat sheet. The essentials:

- `application/src/main/resources/thingsboard-mqtt-broker.yml` defines every default as `${ENV_VAR:default}`; **the `:default` part is the truth**, and the comment above a key says what sentinels like `0` mean. Jump by key with `grep`, never by line number.
- **Audit for omissions, not only errors.** When reviewing or improving a page, read the relevant yml keys and handler classes and check for important parameters, defaults or behaviors the page doesn't mention yet. Judge per parameter: rate limits, timeouts and feature toggles matter; thread-pool sizes don't.

## Verify against the MQTT spec

- Protocol claims must match MQTT 3.1.1 / 5.0 — QoS semantics, packet names, reason codes, wildcard rules, retain semantics, session expiry. State them precisely and scope each to its version.
- When two phrasings compete, pick the one true under TBMQ's **default** configuration.
- Plausible-but-wrong claims that have shipped before:
  - **WebSocket ports.** `8083` is HTTP/UI/REST. MQTT over WS is `8084`, WSS `8085`.
  - **QoS durability.** TBMQ acks a QoS 1/2 publish only after Kafka accepts it, but the defaults are `acks=1` / `replication.factor=1`. It survives a TBMQ-node failure; surviving a Kafka-node failure needs a replicated Kafka cluster. Never say "never lost" unconditionally.
  - **Retain.** The `retain` flag stores the last value, not a replayable history.

## If the page has a learn-hub counterpart

Most pages don't; skip this unless `ls src/pages/mqtt/ | grep <topic>` finds one. If it does:

1. Don't re-teach the concept. Open with a one-line recap linking `/mqtt/<slug>/` (a plain link), then go straight to TBMQ specifics.
2. Split by intent: concept and "why" belong on the learn page; parameters, defaults, behavior, steps and UI belong here. A sentence of overlap is fine; a duplicated section is not.
3. If the learn page links only the generic `/docs/` root because this page didn't exist yet, point it here — that edit follows the `mqtt-learn-topic` skill.

## Verification

Dev server: `http://localhost:4321` (`NODE_OPTIONS=--max-old-space-size=8192 pnpm dev` if not
running — the default heap OOMs).

```bash
pnpm check                 # astro type-check — expect 0 errors
pnpm lint:eslint
pnpm lint:slugcheck        # slugs consistent across editions
pnpm lint:steps            # a markdown list inside <Steps> inside a JSX {…} block
pnpm exec prettier --write <files you touched> && pnpm exec prettier --check <files you touched>
curl -s http://localhost:4321/docs/<slug>/     | grep -o '<title>[^<]*'
curl -s http://localhost:4321/docs/pe/<slug>/  | grep -o '<title>[^<]*'
```

Builds need the user's go-ahead first (repo policy: ask "Run `pnpm build:fast` to verify, or
skip?"). That includes `pnpm lint:linkcheck`, which builds — it must pass after adding or renaming
pages or `DocLink` targets. If you check a TOC in `pnpm dev` after editing an include, restart the
dev server first: injected include headings stay stale until the stub recompiles.

Renaming or moving a page: add the old → new pair to `SINGLE_REDIRECTS` (or `CATCH_ALL_REDIRECTS`
for a prefix) in `src/data/redirects.ts`, run `pnpm generate:redirects`, and commit the regenerated
`public/_redirects` + `public/redirects.json`. Never create an `.astro` redirect stub.

## Gotchas

- **MDX uses spaces, not tabs** (tabs only in `.ts` / `.astro`).
- **A page that ships in both editions needs both stubs.** A missing PE stub 404s under `/docs/pe/…` and breaks its sidebar entry.
- **Never start an MDX line with `>`.** A JSX tag whose closing `>` sits on its own line reads as a blockquote and fails the build with `mdx-jsx:unexpected-character`.
- **Asset references fail silently.** A missing image makes `ImageGallery` fall back to a CDN URL, so `astro check` and the build both pass. Grep the built site for `img.thingsboard.io`; the only legitimate hit is `support-ukraine-banner.webp`.
- **Don't restructure shared files** (`astro.sidebar.ts`, the `Products` enum, the schemas) — they stay upstream-merge-compatible.
