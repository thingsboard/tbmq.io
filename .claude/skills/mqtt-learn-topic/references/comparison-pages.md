# Comparison pages

Read this when the topic compares two protocols ("MQTT vs Y") or compares TBMQ with another broker
("<broker> alternative"). Neither follows the guide content model in SKILL.md.

## Contents
1. Protocol comparisons ("MQTT vs Y")
2. Broker comparisons ("<broker> alternative")

---

## 1. Protocol comparisons ("MQTT vs Y")

The shipped comparisons (`mqtt-vs-http`, `mqtt-vs-kafka`, `mqtt-vs-amqp`, `mqtt-vs-coap`) share one
skeleton:

1. Intro paragraph framing the two as built for different situations, not as winner and loser.
2. `<h2>What each is for</h2>` (or `Two different models`) — one paragraph defining both, bolding each protocol name on first use.
3. `<MqttDiagram>` contrasting the two models side by side, or showing them in one pipeline.
4. `<h2>MQTT vs <Y> at a glance</h2>` — **required** feature-by-feature table in `<div class="overflow-x">`. First column header is `&nbsp;`; rows are the comparison axes (model, transport, overhead, delivery, best for).
5. `<h2>When to use which</h2>` — one paragraph; say plainly when the answer is "both" (it usually is).
6. `<h2>MQTT in TBMQ</h2>` — comparisons use this title, not `<Topic> in TBMQ`. Short and non-triumphal. `mqtt-vs-kafka` is the one variant: it closes on `Using them together`, because the pipeline pattern *is* the TBMQ story.

Registry: `eyebrow: 'MQTT COMPARISON'`, category `comparisons`. Cross-link the sibling comparisons in
the body — each one points at at least one other. The companion-doc link may be the bare `/docs/`
root when no dedicated doc can exist for the comparison.

## 2. Broker comparisons ("<broker> alternative")

A broker comparison sets TBMQ against another broker for a team deciding whether to move. It is a
decision page, deliberately long-form. `mosquitto-alternative` is the model; follow its shape for
the next one, and don't "fix" it back to the guide skeleton in a review pass.

**Registry:** category `broker-comparisons` (label "Broker comparisons", tag `Brokers`, accent
`rose`) and `eyebrow: 'BROKER COMPARISON'`. Never file one under `comparisons` with the
'MQTT COMPARISON' eyebrow — that category is for protocols.

**Shape** — eight `<h2>`s, sub-points as `<h3>`s (which stay out of the TOC):

1. `What <Broker> is built for` — its genuine strengths, plus a scoping note: the comparison is open source vs open source; a commercial edition appears only in scoping notes.
2. `The three walls` — one `<h3>` per limit that pushes teams off it.
3. `How TBMQ answers each one` — one `<h3>` per wall, with the first `MqttDiagram` (TBMQ's delivery paths).
4. `What else you get` — differences that aren't answers to a wall, and the CE / Professional Edition note.
5. `What the architecture is built to do` — the published benchmark figures in a `LearnIconRows` block, with tested versions and a methodology note.
6. `At a glance` — the comparison table (first header `&nbsp;`, wrapped in `<div class="overflow-x">`).
7. `Where <Broker> still fits` — the cases where moving isn't worth it. Keep it; it is what makes the page fair.
8. `Moving over without a flag day` — the second `MqttDiagram` (the migration path), one `<h3>` per step, then a `LearnIconRows` checklist of easy-to-forget items.

**Differences from a guide:** two diagrams, about eight FAQs, no `<Topic> in TBMQ` section (its
`/docs/` links sit inline in the sections), and the migration section is last.

**The accuracy bar is higher than for a guide.**

- Every claim about the other broker must hold for its **open-source edition at its latest release tag**. Cite tag + commit, and read its source, not just its docs.
- Every TBMQ claim must hold for the **CE release tag** (`v<TBMQ_VER>` in `../tbmq`), because the page makes claims about what users can run today.
- Hold TBMQ to the same standard you hold the competitor to, and make no unsupported third-party claims.
- FAQ answers ship standalone in the FAQPage JSON-LD, so scope each one on its own ("open-source Mosquitto"), not through a note elsewhere on the page.
