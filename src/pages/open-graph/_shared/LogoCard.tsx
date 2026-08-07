// src/pages/open-graph/_shared/LogoCard.tsx
//
// Variant B: shared TBMQ-green slab with the stacked TBMQ lockup + optional
// section name. Used for blog, marketing landings and collection indexes.

import { Background } from '@root/pages/open-graph/_shared/Background';
import { Slab } from '@root/pages/open-graph/_shared/Slab';
import { StackedLogo } from '@root/pages/open-graph/_shared/StackedLogo';
import { pickTitleSize } from '@root/pages/open-graph/_shared/text-block';

const TEXT_COLOR = '#ffffff';
const URL_COLOR = 'rgba(255,255,255,0.62)';

export interface LogoCardProps {
	variant: 'logo';
	/** Word rendered under the logo on the slab (omit for homepage). */
	sectionName?: string;
	/** Use 22 px / 0.14em "tight" version (for two-word labels). */
	sectionTight?: boolean;
	/** Optional uppercase line above the title. Omit for self-explanatory titles. */
	eyebrow?: string;
	title: string;
	/** Optional small line below the title — used for blog "By {Author}". */
	authorLine?: string;
}

export function LogoCard({ sectionName, sectionTight, eyebrow, title, authorLine }: LogoCardProps) {
	const titleSize = pickTitleSize(title);
	const sectionSize = sectionTight ? 22 : 26;
	const sectionSpacing = sectionTight ? '0.14em' : '0.18em';

	return (
		<div
			style={{
				width: 1200,
				height: 630,
				display: 'flex',
				background: '#171a23',
				color: TEXT_COLOR,
				fontFamily: '"Roboto", "Noto Sans Symbols"',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			<Background />
			<Slab cls="tbmq">
				<StackedLogo />
				{sectionName && (
					<div
						style={{
							marginTop: 22,
							fontSize: sectionSize,
							fontWeight: 700,
							letterSpacing: sectionSpacing,
							textTransform: 'uppercase',
							lineHeight: 1.1,
							opacity: 0.92,
							textAlign: 'center',
							display: 'flex',
						}}
					>
						{sectionName}
					</div>
				)}
			</Slab>

			<div
				style={{
					position: 'absolute',
					top: '25%',
					left: '40%',
					right: 80,
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{eyebrow && (
					<div
						style={{
							fontSize: 21,
							fontWeight: 700,
							letterSpacing: '0.16em',
							textTransform: 'uppercase',
							opacity: 0.82,
						}}
					>
						{eyebrow}
					</div>
				)}
				<div
					style={{
						fontSize: titleSize,
						fontWeight: 500,
						lineHeight: 1.22,
						letterSpacing: '-0.018em',
						marginTop: 22,
						maxWidth: 600,
						display: 'flex',
					}}
				>
					{title}
				</div>
				{authorLine && (
					<div
						style={{
							marginTop: 26,
							fontSize: 20,
							fontWeight: 500,
							opacity: 0.78,
							display: 'flex',
						}}
					>
						{authorLine}
					</div>
				)}
			</div>

			<div
				style={{
					position: 'absolute',
					bottom: 32,
					right: 80,
					fontSize: 18,
					fontWeight: 600,
					letterSpacing: '0.04em',
					color: URL_COLOR,
					display: 'flex',
				}}
			>
				tbmq.io
			</div>
		</div>
	);
}
