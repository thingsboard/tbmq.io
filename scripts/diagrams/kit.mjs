/**
 * Shared visual toolkit for the TBMQ Architecture diagrams.
 *
 * Every architecture diagram is authored ONCE here and rendered to a
 * theme-aware light/dark SVG pair (`{base}.svg` + `{base}-dark.svg`) that the
 * site's `ImageGallery` swaps via `[data-theme='dark']`. The palette tracks the
 * site's design tokens (see `src/styles/_variables.scss` / `_theme.scss`) so the
 * diagrams read as part of the theme rather than pasted-in raster images.
 *
 * All text is real `<text>` (not outlined paths) so the source stays diffable
 * and greppable — a reader can grep an SVG for `tbmq.msg.all`.
 *
 * This is the editable SOURCE for the rendered assets in
 * `src/assets/images/docs/mqtt-broker/architecture/`. Run `pnpm diagrams:arch`
 * (see build.mjs) to regenerate them.
 */

export const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace";

/**
 * Two full palettes. Subsystem "kinds" get a border / fill / ink triple so a
 * card's colour identifies its subsystem at a glance and stays legible in both
 * themes. Colours are drawn from the site tokens + the platform reference
 * diagrams (green = TBMQ core, blue = Kafka, amber = Redis/Valkey, teal =
 * PostgreSQL, slate = transport/UI, purple = Integration Executor).
 */
export const THEMES = {
	light: {
		name: 'light',
		canvas: '#ffffff',
		dot: '#c3c7cd',
		dotOpacity: 0.55,
		ink: '#17181c',
		inkSub: '#585b62',
		inkMuted: '#797c82',
		neutralStroke: '#c8ccd2',
		neutralFill: '#ffffff',
		neutralSoft: '#f3f5f8',
		flow: '#3a4250',
		ack: '#3a4250',
		xnode: '#e08a1e',
		legendBg: '#ffffff',
		kinds: {
			core: { stroke: '#1f8b4d', fill: '#e7f7ee', ink: '#166c37' },
			kafka: { stroke: '#3d50f5', fill: '#eaecfe', ink: '#2c39bd' },
			redis: { stroke: '#d29a1f', fill: '#fbf0d4', ink: '#8a6410' },
			pg: { stroke: '#0f9e91', fill: '#dbf1ee', ink: '#046a60' },
			client: { stroke: '#c1c6cd', fill: '#f6f8fb', ink: '#3a4250' },
			transport: { stroke: '#6a7280', fill: '#eef1f5', ink: '#3f4652' },
			ie: { stroke: '#8a56d6', fill: '#f0e9fb', ink: '#6a3fb0' },
		},
	},
	dark: {
		name: 'dark',
		canvas: '#16171a',
		dot: '#33363d',
		dotOpacity: 0.7,
		ink: '#e6e7ea',
		inkSub: '#a6a8ae',
		inkMuted: '#83868c',
		neutralStroke: '#3b3e45',
		neutralFill: '#1e1f23',
		neutralSoft: '#25272c',
		flow: '#c3c7cd',
		ack: '#c3c7cd',
		xnode: '#e6a94b',
		legendBg: '#1e1f23',
		kinds: {
			core: { stroke: '#37d67f', fill: '#12301f', ink: '#74e6a4' },
			kafka: { stroke: '#6b8cff', fill: '#182148', ink: '#aebfff' },
			redis: { stroke: '#e6b23f', fill: '#3a2f14', ink: '#f2d488' },
			pg: { stroke: '#3fd9d1', fill: '#0f2f2d', ink: '#82e9e3' },
			client: { stroke: '#41454d', fill: '#212327', ink: '#c3c7cd' },
			transport: { stroke: '#5c6572', fill: '#23262b', ink: '#b7bcc4' },
			ie: { stroke: '#b491e8', fill: '#271d3a', ink: '#ccb3f0' },
		},
	},
};

// ---- geometry helpers (shared by all diagram modules) ----------------------
export const rectC = (x, y, w, h) => ({ x, y, w, h, cx: x + w / 2, cy: y + h / 2 });
export const top = (c) => [c.cx, c.y];
export const bottom = (c) => [c.cx, c.y + c.h];
export const left = (c) => [c.x, c.cy];
export const right = (c) => [c.x + c.w, c.cy];
export const pt = (c, fx, fy) => [c.x + c.w * fx, c.y + c.h * fy];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Small, recognisable line-icons drawn in a 24×24 box, stroked in `color`. */
function iconPaths(name) {
	switch (name) {
		case 'device': // chip
			return `<rect x="6" y="6" width="12" height="12" rx="2.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 6V3.5M15 6V3.5M9 20.5V18M15 20.5V18M6 9H3.5M6 15H3.5M20.5 9H18M20.5 15H18"/>`;
		case 'app': // stacked service bars
			return `<rect x="3.5" y="5" width="17" height="4.5" rx="1.5"/><rect x="3.5" y="14.5" width="17" height="4.5" rx="1.5"/><circle cx="7" cy="7.25" r="0.9" fill="currentColor" stroke="none"/><circle cx="7" cy="16.75" r="0.9" fill="currentColor" stroke="none"/>`;
		case 'netty': // globe
			return `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17M5 6.5c4 2.5 10 2.5 14 0M5 17.5c4-2.5 10-2.5 14 0"/>`;
		case 'actor': // concurrent mailboxes (grid of rounded cells)
			return `<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.6"/>`;
		case 'dispatch': // fan-out
			return `<circle cx="5" cy="12" r="2.2"/><circle cx="19" cy="5.5" r="2.2"/><circle cx="19" cy="12" r="2.2"/><circle cx="19" cy="18.5" r="2.2"/><path d="M7.1 11.1 16.9 6.2M7.2 12H16.8M7.1 12.9 16.9 17.8"/>`;
		case 'trie': // tree
			return `<circle cx="12" cy="4.5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="19.5" r="2"/><circle cx="18" cy="19.5" r="2"/><path d="M10.7 6.1 7.1 10.4M13.3 6.1l3.6 4.3M6 14v3.5M18 14v3.5"/>`;
		case 'kafka': // three connected nodes
			return `<circle cx="6" cy="12" r="2.3"/><circle cx="17.5" cy="6" r="2.3"/><circle cx="17.5" cy="18" r="2.3"/><path d="M8 10.9 15.6 6.9M8 13.1l7.6 4"/>`;
		case 'redis': // stacked db layers
			return `<ellipse cx="12" cy="6" rx="7.5" ry="2.6"/><path d="M4.5 6v5c0 1.4 3.4 2.6 7.5 2.6s7.5-1.2 7.5-2.6V6M4.5 11v5c0 1.4 3.4 2.6 7.5 2.6s7.5-1.2 7.5-2.6v-5"/>`;
		case 'pg': // database cylinder
			return `<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13"/>`;
		case 'webui': // browser window
			return `<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9h17"/><circle cx="6.4" cy="6.8" r="0.8" fill="currentColor" stroke="none"/><circle cx="8.9" cy="6.8" r="0.8" fill="currentColor" stroke="none"/>`;
		case 'ie': // plug / integrate
			return `<path d="M4 12h6M14 12h6"/><rect x="9.5" y="7.5" width="5" height="9" rx="1.6"/><path d="M4 9.5v5M20 9.5v5"/>`;
		case 'lb': // load balancer (split)
			return `<circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="19" r="2.2"/><circle cx="12" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/><path d="M12 7.2v3.3M12 10.5 5.6 16.9M12 10.5v6.3M12 10.5l6.4 6.4"/>`;
		case 'clients': // stacked chips (many)
			return `<rect x="6.5" y="6.5" width="12" height="12" rx="2.2"/><path d="M4 9v9.5A1.5 1.5 0 0 0 5.5 20H15"/><rect x="9.8" y="9.8" width="5.4" height="5.4" rx="1"/>`;
		default:
			return `<circle cx="12" cy="12" r="8"/>`;
	}
}

export function makeKit(theme) {
	const T = theme;
	const markerIds = new Set();

	function text(x, y, str, opts = {}) {
		const { size = 13.5, weight = 500, anchor = 'start', fill = T.ink, mono = false, opacity = 1, dy = 0 } = opts;
		return `<text x="${x}" y="${y + dy}" font-family="${mono ? MONO : FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}" dominant-baseline="middle">${esc(str)}</text>`;
	}

	/** Multi-line label, centred. lines: array of {t, size, weight, fill, mono}. */
	function lines(cx, cy, arr, gap = 16) {
		const total = (arr.length - 1) * gap;
		let y = cy - total / 2;
		let out = '';
		for (const l of arr) {
			out += text(cx, y, l.t, {
				anchor: 'middle',
				size: l.size ?? 13.5,
				weight: l.weight ?? 500,
				fill: l.fill ?? T.ink,
				mono: l.mono ?? false,
			});
			y += gap;
		}
		return out;
	}

	function icon(name, cx, cy, size = 22, color = T.ink) {
		const s = size / 24;
		return `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${s})" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${iconPaths(name)}</g>`;
	}

	/**
	 * Rounded component card with an optional leading icon and 1–3 text lines.
	 * kind selects the subsystem colour. `topic` (mono) renders as a subtitle.
	 */
	function card(o) {
		const { x, y, w, h, kind = 'core', title, sub, topic, icon: ic, r = 12, titleSize = 15 } = o;
		const k = T.kinds[kind];
		const cy = y + h / 2;
		let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${k.fill}" stroke="${k.stroke}" stroke-width="1.6"/>`;
		if (ic) {
			// icon sits left of the centred text block
			body += icon(ic, x + 26, cy, 24, k.ink);
		}
		const textLines = [];
		if (title) textLines.push({ t: title, size: titleSize, weight: 650, fill: k.ink });
		if (sub) textLines.push({ t: sub, size: 11.5, weight: 500, fill: T.inkSub });
		if (topic)
			textLines.push({
				t: topic,
				size: 11.5,
				weight: 500,
				fill: k.ink,
				mono: true,
			});
		const textCx = ic ? x + (w + 38) / 2 : x + w / 2;
		body += lines(textCx, cy, textLines, 16);
		return body;
	}

	/**
	 * Kafka-topic card: kafka icon + a mono topic NAME as the headline + an
	 * optional plain-text note. Used across the message-flow diagrams so every
	 * topic on the page is spelled exactly as in the source.
	 */
	function kafkaTopic(o) {
		const { x, y, w, h, name, note, kind = 'kafka', r = 12 } = o;
		const k = T.kinds[kind];
		const cy = y + h / 2;
		let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${k.fill}" stroke="${k.stroke}" stroke-width="1.6"/>`;
		body += icon('kafka', x + 24, cy, 22, k.ink);
		const tl = [{ t: name, size: 13, weight: 650, fill: k.ink, mono: true }];
		if (note) tl.push({ t: note, size: 11, weight: 500, fill: T.inkSub });
		body += lines(x + (w + 40) / 2, cy, tl, 15);
		return body;
	}

	/** Centred caption / note line under a diagram. */
	function caption(cx, y, str, opts = {}) {
		return text(cx, y, str, {
			anchor: 'middle',
			size: opts.size ?? 12.5,
			weight: 500,
			fill: opts.fill ?? T.inkMuted,
		});
	}

	/** Kafka pill (rounded-stadium) with icon + label + optional mono topic line. */
	function pill(o) {
		const { x, y, w, h, title = 'Kafka', topic, sub, kind = 'kafka' } = o;
		const k = T.kinds[kind];
		const cy = y + h / 2;
		const r = h / 2;
		let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${k.fill}" stroke="${k.stroke}" stroke-width="1.6"/>`;
		body += icon('kafka', x + 28, cy, 24, k.ink);
		const tl = [{ t: title, size: 15, weight: 650, fill: k.ink }];
		if (topic) tl.push({ t: topic, size: 11.5, weight: 500, fill: k.ink, mono: true });
		if (sub) tl.push({ t: sub, size: 11, weight: 500, fill: T.inkSub });
		body += lines(x + (w + 44) / 2, cy, tl, 15);
		return body;
	}

	/** Dashed grouping container with a labelled tab. */
	function groupBox(o) {
		const { x, y, w, h, label, kind, r = 16, dash = '7 5', labelKind } = o;
		const stroke = kind ? T.kinds[kind].stroke : T.neutralStroke;
		const lk = labelKind ? T.kinds[labelKind] : kind ? T.kinds[kind] : null;
		let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="${dash}" opacity="0.9"/>`;
		if (label) {
			const padX = 12;
			const tw = label.length * 7.6 + padX * 2;
			const lx = x + 18;
			const ly = y - 0.5;
			const fill = lk ? lk.fill : T.neutralSoft;
			const ink = lk ? lk.ink : T.inkSub;
			body += `<rect x="${lx}" y="${ly - 12}" width="${tw}" height="24" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="1.3"/>`;
			body += text(lx + tw / 2, ly, label, {
				anchor: 'middle',
				size: 12,
				weight: 700,
				fill: ink,
			});
		}
		return body;
	}

	function markerFor(color) {
		const id = `ah-${color.replace('#', '')}`;
		if (!markerIds.has(id)) markerIds.add(id);
		return id;
	}

	/**
	 * Orthogonal / straight connector with an arrowhead.
	 * from/to: [x,y]. route: 'straight' | 'hv' | 'vh' | 'h' | 'v' | points[].
	 * type: 'flow' (solid) | 'ack' (dashed) | 'xnode' (orange solid).
	 * label: text chip at midpoint; badge: number in a circle at start-ish.
	 */
	function connector(o) {
		const { from, to, route = 'straight', type = 'flow', label, labelSide = 'mid', badge, dashArr, bidir = false } = o;
		let color = type === 'xnode' ? T.xnode : type === 'ack' ? T.ack : T.flow;
		const dash = type === 'ack' ? (dashArr ?? '6 5') : dashArr ? dashArr : 'none';
		const mid = [];
		let d;
		if (Array.isArray(route)) {
			const pts = [from, ...route, to];
			d =
				`M ${pts[0][0]} ${pts[0][1]} ` +
				pts
					.slice(1)
					.map((p) => `L ${p[0]} ${p[1]}`)
					.join(' ');
			mid[0] = route.length
				? route[Math.floor((route.length - 1) / 2)]
				: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
		} else if (route === 'hv') {
			d = `M ${from[0]} ${from[1]} L ${to[0]} ${from[1]} L ${to[0]} ${to[1]}`;
			mid[0] = [to[0], from[1]];
		} else if (route === 'vh') {
			d = `M ${from[0]} ${from[1]} L ${from[0]} ${to[1]} L ${to[0]} ${to[1]}`;
			mid[0] = [from[0], to[1]];
		} else {
			d = `M ${from[0]} ${from[1]} L ${to[0]} ${to[1]}`;
			mid[0] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
		}
		const mk = markerFor(color);
		const startMarker = bidir ? ` marker-start="url(#${mk})"` : '';
		let body = `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.9" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${mk})"${startMarker}/>`;
		let [mx, my] = mid[0];
		// When a badge and a label share the midpoint, nudge the badge along the
		// path so the two never overlap.
		if (badge != null && label) {
			const bx = o.badgeShift?.[0] ?? 0;
			const by = o.badgeShift?.[1] ?? 0;
			body += stepBadge(mx + bx, my + by, badge);
		} else if (badge != null) {
			body += stepBadge(mx, my, badge);
		}
		if (label) {
			const dyOff = labelSide === 'above' ? -22 : labelSide === 'below' ? 22 : 0;
			const dxOff = labelSide === 'left' ? -34 : labelSide === 'right' ? 34 : 0;
			body += chip(mx + dxOff, my + dyOff, label);
		}
		return body;
	}

	/** Small rounded label chip (for arrow labels like Publish / Subscribe). */
	function chip(cx, cy, str, opts = {}) {
		const { mono = /[.$_]/.test(str) && /tbmq|msg|client|sys/.test(str), fill } = opts;
		const size = 11.5;
		const charW = mono ? 7.2 : 6.7;
		const w = str.length * charW + 18;
		const h = 22;
		const bg = fill ?? T.legendBg;
		let body = `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="7" fill="${bg}" stroke="${T.neutralStroke}" stroke-width="1.2"/>`;
		body += text(cx, cy, str, {
			anchor: 'middle',
			size,
			weight: 600,
			mono,
			fill: mono ? T.kinds.kafka.ink : T.inkSub,
		});
		return body;
	}

	function stepBadge(cx, cy, n) {
		return (
			`<circle cx="${cx}" cy="${cy}" r="11" fill="${T.canvas}" stroke="${T.flow}" stroke-width="1.6"/>` +
			text(cx, cy, String(n), {
				anchor: 'middle',
				size: 12,
				weight: 700,
				fill: T.flow,
			})
		);
	}

	/** Legend row of arrow types, drawn at (x,y) top-left. */
	function legend(x, y, items) {
		let body = '';
		let cx = x;
		for (const it of items) {
			const color = it.type === 'xnode' ? T.xnode : it.type === 'ack' ? T.ack : it.type === 'flow' ? T.flow : it.color;
			if (it.swatch === 'card') {
				const k = T.kinds[it.kind];
				body += `<rect x="${cx}" y="${y - 8}" width="20" height="16" rx="4" fill="${k.fill}" stroke="${k.stroke}" stroke-width="1.4"/>`;
				cx += 28;
			} else {
				const dash = it.type === 'ack' ? '6 5' : 'none';
				const mk = markerFor(color);
				body += `<path d="M ${cx} ${y} L ${cx + 26} ${y}" stroke="${color}" stroke-width="1.9" stroke-dasharray="${dash}" stroke-linecap="round" marker-end="url(#${mk})"/>`;
				cx += 34;
			}
			body += text(cx, y, it.label, { size: 12, weight: 500, fill: T.inkSub });
			cx += it.label.length * 6.6 + 26;
		}
		return body;
	}

	/** Section/lane heading text. */
	function heading(x, y, str, opts = {}) {
		return text(x, y, str, {
			size: opts.size ?? 12.5,
			weight: 700,
			fill: opts.fill ?? T.inkMuted,
			anchor: opts.anchor ?? 'start',
		});
	}

	function defs() {
		let m = '';
		for (const id of markerIds) {
			const color = '#' + id.slice(3);
			m += `<marker id="${id}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${color}"/></marker>`;
		}
		const dotId = 'dots';
		m += `<pattern id="${dotId}" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.4" cy="1.4" r="1.4" fill="${T.dot}" opacity="${T.dotOpacity}"/></pattern>`;
		return `<defs>${m}</defs>`;
	}

	/**
	 * Wrap the diagram body. `bodyFn` returns the inner markup; it is invoked
	 * AFTER markers referenced by connectors are known (two-pass), so we build
	 * the body first, then prepend defs.
	 */
	function frame(w, h, body, opts = {}) {
		const inner = Array.isArray(body) ? body.join('\n') : body;
		const bg = opts.transparent
			? ''
			: `<rect x="0" y="0" width="${w}" height="${h}" fill="${T.canvas}"/>` +
				`<rect x="0" y="0" width="${w}" height="${h}" fill="url(#dots)"/>`;
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="${FONT}">${defs()}${bg}${inner}</svg>\n`;
	}

	return {
		T,
		text,
		lines,
		icon,
		card,
		pill,
		kafkaTopic,
		caption,
		groupBox,
		connector,
		chip,
		stepBadge,
		legend,
		heading,
		frame,
	};
}
