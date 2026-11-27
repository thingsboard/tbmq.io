// Deletes the first-party cookies and storage of every consent category not granted (GDPR Art. 7(3)).
// Third-party cookies (google.com `NID`) belong to their own domain and cannot be deleted here.

import { ATTRIBUTION_STORAGE_KEYS } from './tracking-fields.ts';

interface CategoryStorage {
	cookies: string[];
	cookiePrefixes: string[];
	localStorage: string[];
}

const CATEGORY_STORAGE: Record<TbConsentCategory, CategoryStorage> = {
	analytics: {
		// Google Analytics.
		cookies: ['_ga', '_gid', '_gat'],
		cookiePrefixes: ['_ga_', '_gat_'],
		localStorage: [],
	},
	marketing: {
		// Google Ads click storage. tbmq.io never grants `ad_storage`, so these come only from the old always-on GTM.
		cookies: [],
		cookiePrefixes: ['_gcl_', '_gac_'],
		// Plus our own campaign and partner attribution (`attribution.ts`).
		localStorage: ['_gcl_ls', ...ATTRIBUTION_STORAGE_KEYS],
	},
	media: {
		// Google site search writes AdSense for Search cookies on our host. Only `__gsas` has been seen on tbmq.io (and
		// is the one the Cookie Policy lists); `__gads`, `__gpi` and `__eoi` are a safety net. Its google.com cookies are
		// third-party, disclosed in the Cookie Policy.
		cookies: ['__gsas', '__gads', '__gpi', '__eoi'],
		cookiePrefixes: [],
		localStorage: [],
	},
};

// Google writes its cookies on the widest domain it may (`.tbmq.io` from any subdomain), so every parent
// domain of the host is tried, plus the host-only variant. The browser ignores the variants that do not apply.
function cookieDomains(): (string | null)[] {
	const labels = location.hostname.split('.');
	const domains: (string | null)[] = [null];
	for (let i = 0; i < labels.length - 1; i++) domains.push(labels.slice(i).join('.'));
	return domains;
}

function deleteCookie(name: string, domains: (string | null)[]): void {
	domains.forEach((domain) => {
		document.cookie = `${name}=; max-age=0; path=/${domain ? `; domain=${domain}` : ''}`;
	});
}

export function clearRefusedCategories(): void {
	const consent = window.tbConsent;
	const refused = (Object.keys(CATEGORY_STORAGE) as TbConsentCategory[]).filter((c) => consent?.[c] !== true);
	if (refused.length === 0) return;

	const present = document.cookie
		.split('; ')
		.map((pair) => pair.split('=')[0])
		.filter(Boolean);
	const domains = cookieDomains();

	refused.forEach((category) => {
		const { cookies, cookiePrefixes, localStorage: keys } = CATEGORY_STORAGE[category];
		present
			.filter((name) => cookies.includes(name) || cookiePrefixes.some((prefix) => name.startsWith(prefix)))
			.forEach((name) => deleteCookie(name, domains));
		try {
			keys.forEach((key) => localStorage.removeItem(key));
		} catch {
			/**/
		}
	});
}
