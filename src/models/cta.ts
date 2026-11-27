/** A call to action rendered by `CtaButton`. */
export interface Cta {
	text: string;
	href: string;
	/** Leading icon, e.g. `tabler:download`. */
	icon?: string;
	variant: 'brand' | 'outline';
	ariaLabel?: string;
	target?: string;
}
