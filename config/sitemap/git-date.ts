import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { getRepoRoot, gitEnvTrustingRepo } from '../sitemap-source-registry';

/** Generous ceiling for the one-shot `git log` buffer (output is a few MB for `src/`). */
const GIT_LOG_MAX_BUFFER = 256 * 1024 * 1024;

/** Ceiling for the unshallow fetch — a blobless fetch of this repo takes seconds. */
const UNSHALLOW_TIMEOUT_MS = 180_000;

function git(args: string[], opts: { timeout?: number; maxBuffer?: number } = {}): string {
	return execFileSync('git', args, {
		encoding: 'utf8',
		cwd: getRepoRoot(),
		env: gitEnvTrustingRepo(), // trust other-user checkouts (CI)
		stdio: ['ignore', 'pipe', 'ignore'],
		...opts,
	});
}

/**
 * Deploy hosts check out with `--depth 1`. In a shallow clone the boundary
 * commit has no parent, so `git log --name-only` lists every file under it and
 * every page gets HEAD's date. Fetch the missing history first — commits and
 * trees only (`--filter=blob:none`), which is all `--name-only` needs. Failure
 * (no network, no remote) is non-fatal: `getShallowBoundaries` covers it.
 */
function unshallow(): void {
	try {
		if (git(['rev-parse', '--is-shallow-repository']).trim() !== 'true') return;
		git(['fetch', '--quiet', '--no-tags', '--unshallow', '--filter=blob:none', 'origin'], {
			timeout: UNSHALLOW_TIMEOUT_MS,
		});
	} catch {
		// leave the repo shallow; boundary commits are ignored below
	}
}

/**
 * SHAs of the shallow-boundary commits (empty for a full clone). A file whose
 * newest commit in the truncated history is a boundary commit has an unknown
 * real date, so it gets no `<lastmod>` rather than a wrong one.
 */
function getShallowBoundaries(): Set<string> {
	try {
		const shallowFile = git(['rev-parse', '--path-format=absolute', '--git-path', 'shallow']).trim();
		if (!existsSync(shallowFile)) return new Set();
		return new Set(readFileSync(shallowFile, 'utf8').split('\n').filter(Boolean));
	} catch {
		return new Set();
	}
}

/**
 * Map of repo-relative path → last-commit epoch (ms), from a single `git log`
 * pass instead of one subprocess per file. Commits are newest-first, so a path's
 * first appearance is its latest commit. The `\x1f` prefix marks commit lines (file
 * paths never contain it). Scoped to `src/`, where every sitemap source lives, to
 * keep the output and map small. `core.quotePath=false` keeps non-ASCII/spaced
 * paths unquoted so they match the unquoted keys in the source registry.
 */
let gitDateMap: Map<string, number> | null = null;
export function getGitDateMap(): Map<string, number> {
	if (gitDateMap !== null) return gitDateMap;
	const dates = new Map<string, number>();
	try {
		unshallow();
		const boundaries = getShallowBoundaries();
		const out = git(
			['-c', 'core.quotePath=false', 'log', '--no-renames', '--format=\x1f%H %cI', '--name-only', '--', 'src/'],
			{ maxBuffer: GIT_LOG_MAX_BUFFER }
		);
		let current = 0;
		for (const line of out.split('\n')) {
			if (line.startsWith('\x1f')) {
				const [sha, date] = line.slice(1).split(' ');
				current = boundaries.has(sha) ? 0 : Date.parse(date);
			} else if (line && current > 0 && !dates.has(line)) {
				dates.set(line, current);
			}
		}
	} catch {
		// git unavailable — leave empty; every entry then renders without
		// <lastmod> rather than failing the build.
	}
	gitDateMap = dates;
	return gitDateMap;
}
