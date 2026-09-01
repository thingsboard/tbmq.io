/**
 * Reports mechanical SEO defects in the build output.
 *
 * Usage:
 *   pnpm seo:audit                     # build, then audit
 *   pnpm seo:audit:nobuild             # audit an existing dist/
 *   pnpm seo:audit:nobuild --json      # machine-readable, byte-stable output
 *   pnpm seo:audit:nobuild --dist=./x  # audit another directory
 *
 * Always exits 0: this is a report, not a CI gate.
 */
import { buildReport, formatText, toJson } from './lib/seo/report.ts';

const args = process.argv.slice(2);
const distArg = args.find((arg) => arg.startsWith('--dist='));
const report = buildReport(distArg ? distArg.slice('--dist='.length) : './dist');
process.stdout.write(args.includes('--json') ? toJson(report) : formatText(report));
