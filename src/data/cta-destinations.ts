/** Where the site's "sign in" and "try it" calls to action lead: the public TBMQ demo. */
export const DEMO_SIGNIN = 'https://demo.tbmq.io/';
export const DEMO_SIGNUP = 'https://demo.tbmq.io/signup';

const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' } as const;

/**
 * "Sign in": straight to the demo, in a new tab. There is one place an account can be, so nothing to ask.
 *
 * `attrs` returns a new object on every read: Astro writes a component's scoped class into the object
 * it spreads, so one shared object would gain another class on every page built.
 */
export const SIGN_IN = {
	href: DEMO_SIGNIN,
	get attrs(): Record<string, string> {
		return { ...NEW_TAB };
	},
};

/**
 * "Try for free": `data-demo-dialog` opens `DemoDialog`, which offers the demo or an installation.
 * The href is what the link does without JavaScript, and on a modified click.
 */
export const TRY_FREE = {
	href: DEMO_SIGNUP,
	get attrs(): Record<string, string> {
		return { ...NEW_TAB, 'data-demo-dialog': '' };
	},
};
