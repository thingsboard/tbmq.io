// Which links are a way into a License Portal account. UtmTracker.astro adds the visitor's campaign to them.
// tbmq.io links to no ThingsBoard Cloud sign-up, so the Cloud hosts of thingsboard.io's version are left out.

const SIGN_UP_ORIGINS: string[] = ['https://license.thingsboard.io'];

// Other links to the same host (API reference) are not sign-up links.
const SIGN_UP_PATHS = ['/', '/signup', '/login'];

export const isSignUpLink = ({ origin, pathname }: Pick<URL, 'origin' | 'pathname'>): boolean =>
	SIGN_UP_ORIGINS.includes(origin) && SIGN_UP_PATHS.includes(pathname.replace(/(.)\/$/, '$1'));
