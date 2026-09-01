/** Thresholds shared by the checks and their tests, so both move together. */
export const TITLE_MIN = 30;
export const TITLE_MAX = 60;
export const DESC_MIN = 70;
export const DESC_MAX = 160;
export const THIN_WORDS = 300;

export type Section = 'docs' | 'mqtt' | 'other';

export type Severity = 'high' | 'medium' | 'low';

/** Everything one built page contributes to the audit. Parsed once, checked many times. */
export interface PageFacts {
	/** Pathname with a trailing slash, e.g. `/mqtt/qos/`. */
	pathname: string;
	section: Section;
	/** True when the page is a meta-refresh redirect stub; every check skips those. */
	isRedirect: boolean;
	/** Empty string when absent, never null, so length checks need no guard. */
	title: string;
	/** Empty string when absent. */
	description: string;
	h1Count: number;
	/** Words in `<main>`, falling back to `<body>`. */
	wordCount: number;
	hasJsonLd: boolean;
	/** Raw `<link rel="canonical">` href, or null when absent. */
	canonical: string | null;
	/**
	 * Unique, normalised, same-origin page pathnames linked from anywhere in the
	 * document, site chrome included. This is the right set for inbound counting:
	 * a page reachable only from the footer is still reachable.
	 */
	outboundPathnames: string[];
	/**
	 * The same, restricted to links inside `<main>` (falling back to `<body>`).
	 * Header, sidebar and footer link to the same handful of pages from every page,
	 * so a check asking "does *this page* point at X" must use this set — against
	 * the full one it is answered by the chrome and can never fire.
	 */
	mainOutboundPathnames: string[];
}

export interface Finding {
	/** Stable kebab-case id, e.g. `title-too-long`. Groups the report. */
	check: string;
	severity: Severity;
	/** Empty string for site-wide findings that name no single page. */
	pathname: string;
	detail: string;
}

export interface AuditReport {
	/** The `dist/` directory audited, echoed for traceability. */
	generatedFor: string;
	pageCount: number;
	sectionCounts: Record<string, number>;
	findings: Finding[];
}
