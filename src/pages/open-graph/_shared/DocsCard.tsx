// src/pages/open-graph/_shared/DocsCard.tsx
//
// Variant A: docs cards. Slab carries the TBMQ brand lockup + optional
// edition label ("Professional" for /docs/pe/**).

import { Background } from '@root/pages/open-graph/_shared/Background';
import { Slab } from '@root/pages/open-graph/_shared/Slab';
import { StackedLogo } from '@root/pages/open-graph/_shared/StackedLogo';
import type { DocsProductMeta } from '@root/pages/open-graph/_shared/product-meta';
import { pickTitleSize } from '@root/pages/open-graph/_shared/text-block';

const TEXT_COLOR = '#ffffff';
const URL_COLOR = 'rgba(255,255,255,0.62)';

export interface DocsCardProps {
	variant: 'docs';
	meta: DocsProductMeta;
	eyebrow: string;
	title: string;
}

export function DocsCard({ meta, eyebrow, title }: DocsCardProps) {
	const titleSize = pickTitleSize(title);

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
			<Slab cls={meta.slabClass}>
				<StackedLogo />
				{meta.secondaryLabel && (
					<div
						style={{
							marginTop: 20,
							fontSize: 20,
							fontWeight: 700,
							letterSpacing: '0.16em',
							textTransform: 'uppercase',
							lineHeight: 1.1,
							opacity: 0.85,
							textAlign: 'center',
							display: 'flex',
						}}
					>
						{meta.secondaryLabel}
					</div>
				)}
			</Slab>

			{/* Text block — top:25%, left:40%, right:80px */}
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
			</div>

			{/* Footer URL */}
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
