# Content block components

Read this before writing any list in a learn-page body. Bold-lead lists read better as designed
blocks than as raw `<ul>`s, and the hub almost never ships a plain list: `LearnIconRows` is the
workhorse, the other three are deliberately rarer, and plain `<ul>` / `<ol>` are close to absent.
If you have written a `<strong>Label:</strong> …` bullet list, you almost certainly wanted a block.

All four use the repo tokens (green tints, tabler icons via `astro-icon`, `--shadow-sm`, a
reduced-motion-gated hover lift), so they stay on-brand with no new hex.

## Choosing one

| The list's shape | Component | Authoring |
|---|---|---|
| `Label: description` facets or responsibilities, possibly with links ("what the broker manages", "what CONNECT carries") | `LearnIconRows` + `LearnIconRow` | `<LearnIconRow icon="tabler:…" title="Label">description with <a href="…">links</a></LearnIconRow>` per item; the row renders the em-dash |
| Kinds or variants of the thing ("types of brokers", "one-way vs mutual TLS") | `LearnTypeCards` | `cards={[{ icon, title, text, highlight?, badge? }]}` — on the option TBMQ *is*, set `highlight: true` + `badge: "You're here — TBMQ"` |
| Selling-point benefits ("why X for IoT") | `LearnFeatureGrid` | `features={[{ icon, title, text }]}` |
| Links to other guides | `LearnCardGrid` | `cards={[{ href, title, blurb }]}` |
| Label-less simple bullets | plain `<ul>` | — |
| Many-column comparison data | `<table>` in `<div class="overflow-x">` | — |

## Rules

- **`text` in `LearnTypeCards` and `LearnFeatureGrid` is plain — no markup, no links.** If a card needs a doc link (mTLS → client-certificate auth), keep the card text plain and put the link in a short `<p>` right after the grid. Only `LearnIconRow` descriptions take inline links.
- **Verify every tabler icon name exists** in `@iconify-json/tabler` before using it — a missing name fails the build. Pick icons that match each item's meaning.
- **Where the props live:** short arrays inline in the markup are fine (`mqtt-broker`, `mqtt-tls`); pull longer ones into a frontmatter `const` and pass it by name (`features={whyFeatures}`, as `what-is-mqtt` does).
- **Reuse across guides.** Apply the blocks wherever the same shape recurs, not only on the page you're editing.
- **New block components use `<div>` / `<span>` for text, not `<p>` / `<h3>`.** The layout's `.learn-body :global(p|h3|ul|li|a|…)` prose rules out-specify a component's scoped class, so a `<p>` inside a block inherits the 17px body sizing. Only real inline links stay `<a>`.
