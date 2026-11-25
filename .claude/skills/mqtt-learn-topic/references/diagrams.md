# Diagrams

Read this before authoring or editing a learn-page diagram. `MqttDiagram` is the standard: exactly
one per guide, two on a broker comparison. You pass an inline `<svg>` in its slot; the component
frames it, centers it and wires click-to-enlarge (one shared `<dialog>`), so you only author the SVG.
`AsciiDiagram` is legacy and unused.

## Contents
1. Worked example
2. The canvas
3. The `.d-*` class vocabulary
4. Arrowheads and layouts
5. Astro/JSX SVG rules
6. Layout without collisions
7. Visual QA

---

## 1. Worked example

The keep-alive cycle — two actors, lifelines, a request and a reply, and a note:

```astro
<MqttDiagram caption="Keep-alive ping cycle and dead-client detection">
	<svg
		viewBox="0 0 680 196"
		role="img"
		aria-label="MQTT keep-alive: the client sends PINGREQ within the interval, the broker replies PINGRESP; after 1.5x the interval with no packet the broker drops the client"
	>
		<rect class="d-actor" x="90" y="24" width="120" height="34" rx="9"></rect>
		<text class="d-alabel d-mid" x="150" y="46">Client</text>
		<rect class="d-actor d-actor--hero" x="470" y="24" width="120" height="34" rx="9"></rect>
		<text class="d-alabel d-alabel--hero d-mid" x="530" y="46">Broker</text>
		<line class="d-life" x1="150" y1="58" x2="150" y2="176"></line>
		<line class="d-life" x1="530" y1="58" x2="530" y2="176"></line>
		<line class="d-line" x1="150" y1="92" x2="527" y2="92" marker-end="url(#arGray)"></line>
		<rect class="d-chip" x="292" y="81" width="96" height="22" rx="11"></rect>
		<text class="d-ctext d-mid" x="340" y="96">PINGREQ</text>
		<line class="d-line d-line--green" x1="530" y1="122" x2="153" y2="122" marker-end="url(#arGreen)"></line>
		<rect class="d-chip d-chip--green" x="290" y="111" width="100" height="22" rx="11"></rect>
		<text class="d-ctext d-ctext--green d-mid" x="340" y="126">PINGRESP</text>
		<text class="d-note d-mid" x="340" y="164"
			>no packet for 1.5× keep-alive → broker drops the client &amp; fires the Last Will</text
		>
	</svg>
</MqttDiagram>
```

## 2. The canvas

`/mqtt` pages are `forceLightTheme`, so colours are light-locked. Give the `<svg>` a
`viewBox="0 0 680 H"`, `role="img"` and a descriptive `aria-label`. The canvas renders at
`max-width: 680px` (min 520px), so design on a ~680-wide grid and choose `H` to fit the content
snugly.

## 3. The `.d-*` class vocabulary

Defined once in `MqttDiagram.astro`, scoped under `.mqtt-diagram`:

| Role | Classes |
|---|---|
| Actors (boxes) | `.d-actor`, `.d-actor--hero` (green — use for the broker) |
| Actor labels | `.d-alabel`, `.d-alabel--hero` |
| Packet / monospace text | `.d-ctext`, `.d-ctext--green` |
| Chips behind packet labels | `.d-chip`, `.d-chip--green` |
| Connectors | `.d-line`, `.d-line--green`, `.d-line--red`; lifelines `.d-life` |
| Group / scenario headings | `.d-glabel` (bold 12px, labels the halves of a before/after or columns), `.d-panelttl`, `.d-head` |
| Region brackets | `.d-brk` + `.d-brklabel` |
| Annotations | `.d-note`, `.d-feat`, `.d-tiny`, `.d-em` (green emphasis), `.d-danger` (red); verdicts `.d-yes` / `.d-no` |
| Text anchoring | `.d-mid` (middle), `.d-end` |

**`.d-brk` sets only a dashed stroke, no fill.** Shipped diagrams use it on bracket `<line>`s (with
a `.d-brklabel` beside them) and on open `<path fill="none">` brackets. On a `<rect>` it renders as
a solid black block unless you add `fill="none"`.

Don't invent a class name — if none fits, add it to `MqttDiagram.astro`. **Shapes and semantics
come from `.d-*`; one-off geometry may use an inline `style`**, which is common
(`style="font-size:10.5px"` on a dense three-column layout, `style="fill:#166c37"` to tint a
`.d-glabel` green for the "good" half).

## 4. Arrowheads and layouts

- Put `marker-end="url(#arGray)"` (neutral), `url(#arGreen)` (success, accept) or `url(#arRed)` (failure, deny) on a `<line>` or `<path>`. The three markers are defined in the component.
- **Before/after diagrams** (3.1.1 vs 5.0, allowed vs refused) stack two mini-sequences separated by a plain rule: `<line x1="40" y1="118" x2="640" y2="118" stroke="#eef0f3" stroke-width="1"></line>`. Column layouts use the same hairline vertically. See `mqtt-5`, `mqtt-reason-codes`, `qos`.

## 5. Astro/JSX SVG rules

These break the Astro parse, and the build error points at the diagram:

- Every element needs an **explicit closing tag** (`</rect>`, `</line>`, `</text>`, `</path>`). No self-closing `/>` on SVG children in the slot.
- Inside `<text>`, escape `&` as `&amp;` and `'` as `&apos;`. Use literal unicode glyphs (`→ × · ✓ ✗ —`), not entities like `&rarr;`.

## 6. Layout without collisions

Give arrows and labels room so no connector crosses its own text. `.d-*` label text has no
background or halo to mask an overlap, so place each label clear of *every* nearby path, straight
and curved. Curves near a fan-out point are the usual culprit: a label that clears the straight
connectors can still sit exactly where a delivery curve rises through it. Move such a label into the
open wedge between arrows.

## 7. Visual QA

The inline canvas and the enlarge modal are separate DOM. Screenshot the **inline page** with
headless Chrome, not just the opened modal.
