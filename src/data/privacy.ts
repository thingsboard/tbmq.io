// Privacy copy for the footers, the cookie banner and dialog, the search notice and the form privacy line, plus the
// tbmq.io Privacy Policy and Cookie Policy links, so legal can edit it in one place.

// The tbmq.io website's policy. demo.tbmq.io has its own at `/product/privacy-policy/`.
export const WEBSITE_PRIVACY_HREF = '/privacy-policy/';

export const COOKIE_POLICY_HREF = '/cookie-policy/';

// Form privacy line: `lead`, then the link, then a full stop.
export const formPrivacyNote = (noun: 'message' | 'request') => ({
	lead: `We use these details only to answer your ${noun}. See our`,
	linkLabel: 'Privacy Policy',
});

// Privacy Policy link required by GDPR Art. 13 and CalOPPA (Cal. Bus. & Prof. Code §22575), the Cookie Policy, and
// the demo.tbmq.io policies.
export const footerLegalLinks: { href: string; label: string }[] = [
	{ href: WEBSITE_PRIVACY_HREF, label: 'Privacy Policy' },
	{ href: COOKIE_POLICY_HREF, label: 'Cookie Policy' },
	{ href: '/product/privacy-policy/', label: 'Demo Privacy Policy' },
	{ href: '/product/terms-of-use/', label: 'Demo Terms of Use' },
];

// Opens the cookie preferences dialog (CCPA regs §7015 opt-out link).
export const PRIVACY_CHOICES_LABEL = 'Your Privacy Choices';

// Under the Marketing switch when the browser sends Global Privacy Control (CCPA regs §7025).
export const GPC_MARKETING_NOTE = 'Your browser sent a Global Privacy Control signal, so Marketing stays off.';

// The Cookie Policy link follows it in the markup.
export const CONSENT_BANNER_TEXT = `We use cookies for site analytics, to remember the campaign or partner link you arrived from and, if you allow it, to load the site search from Google. Nothing optional is set until you choose. You can change your choice anytime in ${PRIVACY_CHOICES_LABEL} at the bottom of every page.`;

// The sentence with the Cookie Policy and Privacy Policy links follows it in the markup.
export const CONSENT_DIALOG_INTRO =
	'We use cookies for our own analytics, to see how our campaigns perform and, if you allow it, to load the site search from Google. We never sell your data. Necessary cookies keep the site working and cannot be switched off.';

export const NECESSARY_COOKIES_DESCRIPTION = 'Security, load balancing and remembering your cookie choice.';

export const CONSENT_CATEGORIES: { id: TbConsentCategory; title: string; description: string }[] = [
	{
		id: 'analytics',
		title: 'Analytics',
		description:
			'Show us which pages people read, how they find the site and where they get stuck, so we can improve it (Google Analytics).',
	},
	{
		id: 'marketing',
		title: 'Marketing',
		description:
			'Remember the campaign or partner link you arrived from, so we know which campaign or partner brought you when you sign up or contact us (partner program). We do not use it to build advertising profiles.',
	},
	{
		id: 'media',
		title: 'External media',
		description:
			'Load the site search from Google when you use it. Google sets its own cookies and shows ads in the search results.',
	},
];

// On the search consent notice (`SearchConsentNotice.astro`); the note is followed by the Cookie settings button.
export const SEARCH_CONSENT_TEXT =
	'Site search is provided by Google, which sets cookies and shows ads in the results.';
export const SEARCH_CONSENT_NOTE = 'This allows External media for the whole site. You can change it anytime in';
// The notice's buttons. The Cookie Policy and the Privacy Policy quote the first one.
export const SEARCH_CONSENT_LOAD_LABEL = 'Load Google search';
export const SEARCH_CONSENT_GOOGLE_LABEL = 'Search on Google instead';
export const SEARCH_CONSENT_SETTINGS_LABEL = 'Cookie settings';
