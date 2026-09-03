/**
 * Reports mechanical SEO defects in the build output.
 *
 * Usage:
 *   pnpm seo:audit                     # build, then audit
 *   pnpm seo:audit:nobuild             # audit an existing dist/
 *   pnpm seo:audit:nobuild --json      # machine-readable, byte-stable output
 *   pnpm seo:audit:nobuild --dist=./x  # audit another directory
 *
 * Exit code 0 regardless of what it finds — this is a report, not a CI gate.
 * Exits 1 only if the audit itself fails (bad arguments, an unreadable
 * dist/), so an unattended run cannot mistake a crash for a clean result.
 */
import { buildReport, formatText, resolveDistDir, toJson } from './lib/seo/report.ts';

const args = process.argv.slice(2);

try {
	const distDir = resolveDistDir(args);
	const report = buildReport(distDir);
	process.stdout.write(args.includes('--json') ? toJson(report) : formatText(report));
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`seo-audit: ${message}\n`);
	process.exit(1);
}
