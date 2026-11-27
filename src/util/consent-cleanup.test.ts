import test from 'node:test';
import assert from 'node:assert/strict';
import { clearRefusedCategories } from './consent-cleanup.ts';

// A cookie jar that behaves like the browser's `document.cookie` for what the cleanup does: cookies are keyed by
// name and domain (`host` for host-only), and a write with `max-age=0` deletes only the cookie with that exact
// name and domain attribute.
class CookieJar {
	store = new Map<string, string>();

	seed(name: string, domain = 'host', value = '1') {
		this.store.set(`${name}|${domain}`, value);
	}

	names(): string[] {
		return [...this.store.keys()].sort();
	}

	get cookie(): string {
		return [...this.store.entries()].map(([key, value]) => `${key.split('|')[0]}=${value}`).join('; ');
	}

	set cookie(header: string) {
		const [pair, ...attrs] = header.split(';').map((part) => part.trim());
		const [name, value] = pair.split('=');
		const attr = (key: string) => attrs.find((a) => a.toLowerCase().startsWith(`${key}=`))?.slice(key.length + 1);
		const domain = attr('domain')?.replace(/^\./, '') ?? 'host';
		const key = `${name}|${domain}`;
		if (attr('max-age') === '0') this.store.delete(key);
		else this.store.set(key, value);
	}
}

function mapStorage(entries: Record<string, string> = {}) {
	const map = new Map(Object.entries(entries));
	return {
		map,
		getItem: (k: string) => map.get(k) ?? null,
		setItem: (k: string, v: string) => void map.set(k, v),
		removeItem: (k: string) => void map.delete(k),
	};
}

const throwingStorage = {
	getItem() {
		throw new Error('blocked');
	},
	setItem() {
		throw new Error('blocked');
	},
	removeItem() {
		throw new Error('blocked');
	},
};

function setup(consent: TbConsent | null, storage: object = mapStorage()) {
	const jar = new CookieJar();
	Object.assign(globalThis, {
		location: { hostname: 'tbmq.io' },
		window: { tbConsent: consent },
		document: jar,
		localStorage: storage,
	});
	return jar;
}

test('refused analytics deletes _ga and _ga_* host-only and on .tbmq.io', () => {
	const jar = setup(null);
	jar.seed('_ga');
	jar.seed('_ga', 'tbmq.io');
	jar.seed('_ga_2H1PYS19HL', 'tbmq.io');
	jar.seed('tb_consent');
	jar.seed('starlight-x');

	clearRefusedCategories();

	assert.deepEqual(jar.names(), ['starlight-x|host', 'tb_consent|host']);
});

test('granted categories are kept', () => {
	const storage = mapStorage({ _gcl_ls: 'x', 'starlight-theme': 'dark' });
	const jar = setup({ v: 1, analytics: true, marketing: false }, storage);
	jar.seed('_ga', 'tbmq.io');
	jar.seed('_gcl_au', 'tbmq.io');

	clearRefusedCategories();

	assert.deepEqual(jar.names(), ['_ga|tbmq.io']);
	assert.deepEqual([...storage.map.keys()], ['starlight-theme']);
});

test('refused media deletes __gsas', () => {
	const jar = setup({ v: 1, analytics: true, marketing: true });
	jar.seed('__gsas');
	jar.seed('_ga', 'tbmq.io');

	clearRefusedCategories();

	assert.deepEqual(jar.names(), ['_ga|tbmq.io']);
});

test('refused marketing deletes the stored campaign and partner attribution', () => {
	const storage = mapStorage({
		utm: '{"utm_source":"s"}',
		fpr: 'p',
		utm_source: 'legacy',
		_gcl_ls: 'x',
		'starlight-theme': 'dark',
	});
	setup({ v: 1, analytics: true, marketing: false, media: true }, storage);

	clearRefusedCategories();

	assert.deepEqual([...storage.map.keys()], ['starlight-theme']);
});

test('throwing localStorage does not throw', () => {
	const jar = setup(null, throwingStorage);
	jar.seed('_ga', 'tbmq.io');

	assert.doesNotThrow(clearRefusedCategories);
	assert.deepEqual(jar.names(), []);
});
