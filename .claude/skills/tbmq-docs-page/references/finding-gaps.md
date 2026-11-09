# Finding documentation gaps

Read this when the task is "what should we document next?" rather than fixing a given page. Don't
keep a hardcoded gap list — derive it, because the tree changes every release. Confirm any gap
before creating a page. Run everything from the tbmq.io root; `Y` is the broker yml on the release
line (see `source-map.md` §1 for choosing the ref).

```bash
Y=application/src/main/resources/thingsboard-mqtt-broker.yml
```

## 1. Undocumented config (highest yield)

Diff the env vars the broker defines against the ones the docs mention:

```bash
comm -23 \
  <(git -C ../tbmq show origin/main:$Y | grep -ohE '\$\{[A-Z0-9_]+' | tr -d '${' | sort -u) \
  <(grep -rohE '[A-Z][A-Z0-9_]{6,}' src/content/_includes/docs/mqtt-broker | sort -u)
```

Expect a long list, mostly intentional internal knobs (thread-pool sizes, `ACTORS_*` dispatcher
tuning) that should stay undocumented. Document what an operator would plausibly tune: a rate
limit, timeout, or feature toggle — not a pool size. Repeat against `../tbmq-pe` `origin/license`
for PE-only keys.

The generated `installation/config.mdx` / `ie-config.mdx` pages list every key already; a gap here
means no *prose* page explains the key.

## 2. Thin or stale pages

Short includes are candidates for deepening; a page whose defaults no longer match the yml is a
correctness bug.

```bash
wc -l $(find src/content/_includes/docs/mqtt-broker -name '*.mdx') | sort -n | head -20
```

## 3. Missing section coverage

Compare the sidebar groups in `astro.sidebar.ts` against the product: a feature with a UI but no
doc, a new integration type in the source with no page, a cluster target with no setup guide.

## 4. Orphaned includes

An include no stub imports, or a stub whose include was renamed:

```bash
for f in $(find src/content/_includes/docs/mqtt-broker -name '*.mdx' | sed 's#src/content/_includes/##; s#\.mdx$##'); do
  grep -rq "@includes/$f.mdx" src/content/docs || echo "orphan include: $f"
done
```

## 5. Learn-hub topics with no technical doc

Only relevant to protocol concepts:

```bash
find src/content/docs/docs -name '*.mdx' -not -path '*/pe/*' | sed -E 's#.*/docs/docs/##; s#\.mdx$##' | sort
grep -oE "slug: '[^']+'" src/data/mqttLearn.ts | sed "s/slug: //; s/'//g" | sort
```

MQTT 5 features that fall back to `user-guide/mqtt-protocol` — reason codes, user properties, topic
alias, flow control, message and session expiry, request/response — are standing candidates.
