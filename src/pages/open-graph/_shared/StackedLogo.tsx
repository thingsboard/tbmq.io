// src/pages/open-graph/_shared/StackedLogo.tsx
//
// Stacked TBMQ lockup: the shared ThingsBoard chip mark above the "TBMQ"
// wordmark, both cropped out of the white brand logo via tight viewBoxes.
// Shared by the LogoCard and DocsCard slabs so every card carries the same
// brand mark.

import { html } from 'satori-html';
import { TBMQ_LOGO_WHITE } from '@root/pages/open-graph/_assets/icons';

const MARK_VIEWBOX = '0 0 38.75 38.75';
const WORD_VIEWBOX = '44.5 10 71 22';

/** Rewrite the lockup's root <svg> to a crop region with explicit pixel
 *  dimensions (Satori's Yoga layout doesn't honour `width:100%`). */
function cropLogo(viewBox: string, w: number, h: number): string {
	return TBMQ_LOGO_WHITE.replace(/<svg([^>]*)>/, (_match, attrs: string) => {
		const cleaned = attrs.replace(/\s+(width|height|viewBox)="[^"]*"(?=[\s>]|$)/g, ' ');
		return `<svg width="${w}" height="${h}" viewBox="${viewBox}"${cleaned}>`;
	});
}

export function StackedLogo() {
	const MARK_W = 136;
	const WORD_W = 186;
	const WORD_H = Math.round((WORD_W * 22) / 71);
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				alignSelf: 'center',
			}}
		>
			<div style={{ width: MARK_W, height: MARK_W, display: 'flex', overflow: 'hidden' }}>
				{html(cropLogo(MARK_VIEWBOX, MARK_W, MARK_W))}
			</div>
			<div style={{ marginTop: 20, width: WORD_W, height: WORD_H, display: 'flex', overflow: 'hidden' }}>
				{html(cropLogo(WORD_VIEWBOX, WORD_W, WORD_H))}
			</div>
		</div>
	);
}
