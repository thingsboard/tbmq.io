import { collectPages } from './collect.ts';
import { runChecks } from './checks.ts';
import { isIndexable, type AuditReport, type Finding, type PageFacts, type Severity } from './types.ts';

const MAX_EXAMPLES = 10;
const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/**
 * Resolves the `--dist=` CLI flag to a directory to audit.
 * Absent or empty (`--dist=`) falls back to `./dist`. A bare `--dist` with no
 * `=value` is a usage error, not a silent default, so it throws.
 */
export function resolveDistDir(args: string[]): string {
	if (args.includes('--dist')) {
		throw new Error('--dist requires a value, e.g. --dist=./dist');
	}
	const distArg = args.find((arg) => arg.startsWith('--dist='));
	const value = distArg?.slice('--dist='.length) ?? '';
	return value === '' ? './dist' : value;
}

/**
 * The page census: indexable pages by section, plus what was left out and why.
 * A page that is both a redirect stub and noindex counts once, as a redirect.
 */
export function summarise(pages: PageFacts[]): Pick<AuditReport, 'pageCount' | 'sectionCounts' | 'skipped'> {
	const sectionCounts: Record<string, number> = {};
	const skipped = { noindex: 0, redirect: 0 };
	for (const page of pages) {
		if (isIndexable(page)) sectionCounts[page.section] = (sectionCounts[page.section] ?? 0) + 1;
		else if (page.isRedirect) skipped.redirect += 1;
		else skipped.noindex += 1;
	}
	const pageCount = Object.values(sectionCounts).reduce((total, count) => total + count, 0);
	return { pageCount, sectionCounts, skipped };
}

export function buildReport(buildOutputDir: string): AuditReport {
	const pages = collectPages(buildOutputDir);
	return { generatedFor: buildOutputDir, ...summarise(pages), findings: runChecks(pages) };
}

export function toJson(report: AuditReport): string {
	return `${JSON.stringify(report, null, 2)}\n`;
}

export function formatText(report: AuditReport): string {
	const census = Object.entries(report.sectionCounts)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([section, count]) => `${section}=${count}`)
		.join(' ');
	const { noindex, redirect } = report.skipped;
	const skipped = noindex || redirect ? `, skipped ${noindex} noindex + ${redirect} redirect` : '';
	const lines = [`SEO audit of ${report.generatedFor}`, `${report.pageCount} pages (${census})${skipped}`, ''];

	if (report.findings.length === 0) {
		lines.push('no issues found');
		return `${lines.join('\n')}\n`;
	}

	const groups = new Map<string, Finding[]>();
	for (const item of report.findings) groups.set(item.check, [...(groups.get(item.check) ?? []), item]);

	const ordered = [...groups.entries()].sort(
		([, a], [, b]) =>
			SEVERITY_RANK[a[0].severity] - SEVERITY_RANK[b[0].severity] ||
			b.length - a.length ||
			a[0].check.localeCompare(b[0].check)
	);

	for (const [check, items] of ordered) {
		lines.push(`[${items[0].severity}] ${check} — ${items.length}`);
		for (const item of items.slice(0, MAX_EXAMPLES)) {
			lines.push(`    ${item.pathname || '(site-wide)'}  ${item.detail}`);
		}
		if (items.length > MAX_EXAMPLES) lines.push(`    … and ${items.length - MAX_EXAMPLES} more`);
		lines.push('');
	}

	return `${lines.join('\n')}\n`;
}
