/**
 * Data and geometry for the homepage hero's TBMQ cluster visual (`HeroClusterVisual.astro`).
 *
 * One source for both variants: every coordinate, the `viewBox`, the aspect ratio, the text
 * sizes and the CSS thresholds that keep text at or above 10 px are computed here, so no
 * number is repeated in the component's template or styles.
 *
 * - Horizontal (720 × 540): publishers on the left, the cluster frame with three broker cards
 *   in the middle, subscribers on the right.
 * - Vertical (360 × 436): publishers in a row on top, the cluster frame, subscribers below.
 *   Card titles and the tag are its only text. Used on phones and in panels too small for
 *   the horizontal card titles.
 */
import { TBMQ_LOGO_WHITE } from '../../pages/open-graph/_assets/icons.ts';

export type Glyph = 'sensor' | 'gateway' | 'vehicle' | 'meter' | 'app' | 'dashboard' | 'analytics';
export type TextRole = 'title' | 'sub' | 'label' | 'caption' | 'tag';

export interface Box {
	w: number;
	h: number;
}

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
	rx: number;
}

export interface Client {
	icon: Glyph;
	label: string;
	/** Centre. */
	x: number;
	y: number;
	r: number;
}

export interface Card extends Rect {
	/** Vertical centre. */
	cy: number;
	title: string;
}

export interface Lane {
	/** Cubic curve, drawn in the direction the message travels. */
	d: string;
	/** Pulse duration and (negative) start offset, in seconds. */
	dur: number;
	delay: number;
}

export interface Variant {
	key: 'h' | 'v';
	box: Box;
	frame: Rect;
	/** The "TBMQ CLUSTER" pill on the frame's top edge, with its text anchor. */
	tag: Rect & { tx: number; ty: number };
	cards: Card[];
	/** Dashed peer links between consecutive cards; none in the vertical variant. */
	peers: string[];
	/** Publishers first, then subscribers. */
	clients: Client[];
	/** None in the vertical variant. */
	captions: { text: string; x: number; y: number }[];
	/** Publisher lanes first, in client order. */
	lanes: Lane[];
	/** Font size per text role, in `viewBox` units. A role the variant does not draw is absent. */
	text: { title: number } & Partial<Record<Exclude<TextRole, 'title'>, number>>;
}

/** No text in the visual renders smaller than this. */
export const TEXT_FLOOR_PX = 10;
/** `Hero.astro`'s phone breakpoint (`max-width: 599px`): phones get the vertical variant. */
export const PHONE_BELOW = 600;

/** Size-container names. `root` is also the class prefix of the two variant wrappers. */
export const CONTAINERS = {
	panel: 'hero-panel',
	root: 'hero-cluster',
	h: 'hero-cluster-h',
	v: 'hero-cluster-v',
} as const;

export const TEXT_CLASS: Record<TextRole, string> = {
	title: 'card-title',
	sub: 'card-sub',
	label: 'lbl',
	caption: 'cap',
	tag: 'tag',
};

/** 24 × 24 glyph bodies, from Tabler Icons (MIT). */
const stroke = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"';
export const GLYPHS: Record<Glyph, string> = {
	sensor: `<path ${stroke} d="M10 13.5a4 4 0 1 0 4 0V5a2 2 0 0 0-4 0zM10 9h4"/>`,
	gateway: `<path ${stroke} d="M3 15a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm14 2v.01M13 17v.01M15 13v-2m-3.25-2.25a4 4 0 0 1 6.5 0M8.5 6.5a8 8 0 0 1 13 0"/>`,
	vehicle: `<g ${stroke}><path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0m10 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9m-6-6h15m-6 0V6"/></g>`,
	meter: `<g ${stroke}><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0"/><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0m2.41-1.41L16 8m-9 4a5 5 0 0 1 5-5"/></g>`,
	app: `<path ${stroke} d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm3 1h.01M9 8h.01"/>`,
	dashboard: `<path ${stroke} d="M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1m0 12h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1m10-4h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1m0-8h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1"/>`,
	analytics: `<g ${stroke}><path d="M3 3v18h18m-1-3v3m-4-5v5m-4-8v8m-4-5v5"/><path d="M3 11c6 0 5-5 9-5s3 5 9 5"/></g>`,
};

/** The round TBMQ mark: the first `<path>` of the white logo (the wordmark is the second). */
export const MARK_PATH: string = TBMQ_LOGO_WHITE.match(/<path d="([^"]+)"/)![1];
/** The mark spans 0..39 on both axes. */
export const MARK_BOX = 39;

export const PUBLISHERS: { icon: Glyph; label: string }[] = [
	{ icon: 'sensor', label: 'Sensors' },
	{ icon: 'gateway', label: 'Gateways' },
	{ icon: 'vehicle', label: 'Vehicles' },
	{ icon: 'meter', label: 'Meters' },
];

export const SUBSCRIBERS: { icon: Glyph; label: string }[] = [
	{ icon: 'app', label: 'Applications' },
	{ icon: 'dashboard', label: 'Dashboards' },
	{ icon: 'analytics', label: 'Analytics' },
];

export const BROKER_SUBLABEL = 'broker · active';

const BROKERS = ['TBMQ node 1', 'TBMQ node 2', 'TBMQ node 3'];
/** Publisher i sends to broker `PUBLISHER_TO_BROKER[i]`; broker i delivers to subscriber i. */
const PUBLISHER_TO_BROKER = [0, 1, 1, 2];

const DURATIONS = [3.1, 3.7, 2.8, 3.4, 3.0];

/** Pulse timing for lane `i` (publishers, then subscribers): varied, and already mid-flight on load. */
export function pace(i: number): { dur: number; delay: number } {
	const dur = DURATIONS[i % DURATIONS.length];
	return { dur, delay: -Number((((i * 1.27) % dur) + 0.01).toFixed(2)) };
}

/** `count` positions `step` apart, centred on `mid`. */
const spread = (count: number, mid: number, step: number) =>
	Array.from({ length: count }, (_, i) => mid + (i - (count - 1) / 2) * step);

/** Three cards stacked in the middle of `frame`, `inset` from its sides. */
function stackCards(frame: Rect, card: { h: number; gap: number; inset: number; rx: number }): Card[] {
	const x = frame.x + card.inset;
	const w = frame.w - 2 * card.inset;
	const firstY = frame.y + (frame.h - (BROKERS.length * card.h + (BROKERS.length - 1) * card.gap)) / 2;
	return BROKERS.map((title, i) => {
		const y = firstY + i * (card.h + card.gap);
		return { x, y, w, h: card.h, rx: card.rx, cy: y + card.h / 2, title };
	});
}

function withPace(paths: string[]): Lane[] {
	return paths.map((d, i) => ({ d, ...pace(i) }));
}

export function horizontalVariant(): Variant {
	const box = { w: 720, h: 540 };
	const frame = { x: 190, y: 70, w: 340, h: 400, rx: 22 };
	const cards = stackCards(frame, { h: 88, gap: 30, inset: 40, rx: 14 });
	const midY = frame.y + frame.h / 2;
	const r = 24;
	const sideX = 62;

	const pubs = spread(PUBLISHERS.length, midY, 100).map((y, i) => ({ ...PUBLISHERS[i], x: sideX, y, r }));
	const subs = spread(SUBSCRIBERS.length, midY, 110).map((y, i) => ({ ...SUBSCRIBERS[i], x: box.w - sideX, y, r }));

	const cardL = cards[0].x;
	const cardR = cards[0].x + cards[0].w;
	const inLanes = pubs.map((p, i) => {
		const c = cards[PUBLISHER_TO_BROKER[i]];
		// Lanes arriving from above or below land 14 units off the card's centre line.
		const ty = c.cy + Math.sign(p.y - c.cy) * 14;
		const x0 = p.x + r;
		const mx = (x0 + cardL) / 2;
		return `M${x0} ${p.y}C${mx} ${p.y} ${mx} ${ty} ${cardL} ${ty}`;
	});
	const outLanes = subs.map((s, i) => {
		const c = cards[i];
		const x1 = s.x - r;
		const mx = (cardR + x1) / 2;
		return `M${cardR} ${c.cy}C${mx} ${c.cy} ${mx} ${s.y} ${x1} ${s.y}`;
	});
	const peers = cards.slice(1).map((next, i) => {
		const y0 = cards[i].y + cards[i].h;
		return `M${cardL + 60} ${y0}V${next.y}M${cardR - 60} ${y0}V${next.y}`;
	});

	const tag = { x: frame.x + 24, y: frame.y - 11, w: 118, h: 22, rx: 11 };
	const captionY = pubs[0].y - 46;

	return {
		key: 'h',
		box,
		frame,
		tag: { ...tag, tx: tag.x + tag.w / 2, ty: frame.y + 4 },
		cards,
		peers,
		clients: [...pubs, ...subs],
		captions: [
			{ text: 'PUBLISHERS', x: sideX, y: captionY },
			{ text: 'SUBSCRIBERS', x: box.w - sideX, y: captionY },
		],
		lanes: withPace([...inLanes, ...outLanes]),
		text: { title: 18, sub: 12.5, label: 13, caption: 12, tag: 11 },
	};
}

export function verticalVariant(): Variant {
	const frame = { x: 28, y: 104, w: 304, h: 236, rx: 18 };
	const box = { w: 360, h: frame.y + frame.h + 96 };
	const cards = stackCards(frame, { h: 56, gap: 16, inset: 32, rx: 12 });
	const midX = frame.x + frame.w / 2;
	const r = 20;
	const top = frame.y;
	const bottom = frame.y + frame.h;

	const pubs = spread(PUBLISHERS.length, box.w / 2, 80).map((x, i) => ({ ...PUBLISHERS[i], x, y: 40, r }));
	const subs = spread(SUBSCRIBERS.length, box.w / 2, 90).map((x, i) => ({ ...SUBSCRIBERS[i], x, y: bottom + 66, r }));

	// Lanes run into ports spread along the frame's top and bottom edges.
	const inPorts = spread(pubs.length, midX, 44);
	const inLanes = pubs.map((p, i) => {
		const my = (p.y + r + top) / 2;
		return `M${p.x} ${p.y + r}C${p.x} ${my} ${inPorts[i]} ${my} ${inPorts[i]} ${top}`;
	});
	const outPorts = spread(subs.length, midX, 56);
	const outLanes = subs.map((s, i) => {
		const my = (bottom + s.y - r) / 2;
		return `M${outPorts[i]} ${bottom}C${outPorts[i]} ${my} ${s.x} ${my} ${s.x} ${s.y - r}`;
	});

	const tag = { x: frame.x + 18, y: frame.y - 11, w: 124, h: 22, rx: 11 };

	return {
		key: 'v',
		box,
		frame,
		tag: { ...tag, tx: tag.x + tag.w / 2, ty: frame.y + 4 },
		cards,
		peers: [],
		clients: [...pubs, ...subs],
		captions: [],
		lanes: withPace([...inLanes, ...outLanes]),
		// The tag is 12, not the horizontal 11, so it holds the floor down to a 300 px render.
		text: { title: 18, tag: 12 },
	};
}

/** The narrowest render of `box` at which text of `fontSize` units stays at or above the floor. */
export function minWidthFor(box: Box, fontSize: number): number {
	return Math.ceil((TEXT_FLOOR_PX * box.w) / fontSize);
}

/** The same rule on the height axis. */
export function minHeightFor(box: Box, fontSize: number): number {
	return Math.ceil((TEXT_FLOOR_PX * box.h) / fontSize);
}

const variantClass = (key: Variant['key']) => `${CONTAINERS.root}__${key}`;

/**
 * The stylesheet that picks the variant and hides text that would render under the floor.
 *
 * Text of `size` units renders at `size × renderedWidth / box.w` px, so it stays at or above
 * TEXT_FLOOR_PX iff `renderedWidth ≥ TEXT_FLOOR_PX × box.w / size` (`minWidthFor`). Each role
 * is hidden below its own threshold, measured on its variant's wrapper (an inline-size
 * container). The card titles are the largest text and are never hidden: below their
 * threshold the horizontal variant gives way to the vertical one, either because the cluster
 * is too narrow or because the side-by-side panel is too short to draw it that wide (the same
 * rule on the height axis, `minHeightFor`). Phones always get the vertical variant.
 */
export function visibilityCss(h: Variant, v: Variant): string {
	const swap = `{.${variantClass('h')}{display:none}.${variantClass('v')}{display:block}}`;
	const rules = [
		`.${variantClass('v')}{display:none}`,
		`@media (width < ${PHONE_BELOW}px)${swap}`,
		`@container ${CONTAINERS.root} (width < ${minWidthFor(h.box, h.text.title)}px)${swap}`,
		`@container ${CONTAINERS.panel} (height < ${minHeightFor(h.box, h.text.title)}px)${swap}`,
	];
	for (const variant of [h, v]) {
		for (const [role, size] of Object.entries(variant.text) as [TextRole, number][]) {
			if (role === 'title') continue;
			rules.push(
				`@container ${CONTAINERS[variant.key]} (width < ${minWidthFor(variant.box, size)}px)` +
					`{.${variantClass(variant.key)} .${TEXT_CLASS[role]}{display:none}}`
			);
		}
	}
	return rules.join('');
}
