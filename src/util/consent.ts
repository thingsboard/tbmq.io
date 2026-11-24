// The stored choice. GtmHead.astro's inline script reads it before any module loads (it gets these through
// `define:vars`); CookieConsent.astro writes it. Bump the version when the stored shape changes: older choices
// then count as no choice and the banner asks again.
export const CONSENT_COOKIE = 'tb_consent';
export const CONSENT_VERSION = 1;
// How long a choice is kept. The Cookie Policy and the Privacy Policy state it from here.
export const CONSENT_MAX_AGE_DAYS = 180;

// Fired by `CookieConsent.astro` after a choice is saved; `window.tbConsent` already holds it.
const CONSENT_CHANGE_EVENT = 'tb:consent-change';

export const notifyConsentChange = () => window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));

export const onConsentChange = (callback: () => void) => window.addEventListener(CONSENT_CHANGE_EVENT, callback);
