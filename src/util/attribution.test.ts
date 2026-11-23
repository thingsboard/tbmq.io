import test from 'node:test';
import assert from 'node:assert/strict';

// `attribution.ts` reads the page URL once, at import: each case imports a fresh copy after setting up the page.
type AttributionModule = typeof import('./attribution.ts');
let caseNo = 0;

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

async function loadPage({
	search = '',
	consent = null,
	storage = mapStorage(),
	cookie = '',
}: {
	search?: string;
	consent?: TbConsent | null;
	storage?: object;
	cookie?: string;
}): Promise<AttributionModule> {
	Object.assign(globalThis, {
		window: { location: { search }, tbConsent: consent },
		localStorage: storage,
		document: { cookie },
	});
	return import(`./attribution.ts?case=${++caseNo}`);
}

// A form whose hidden inputs are found by name, as `fillTrackingFields` looks them up.
function fakeForm() {
	const inputs = new Map<string, { value: string }>();
	return {
		inputs,
		querySelector(selector: string) {
			const name = /name="([^"]+)"/.exec(selector)?.[1] ?? '';
			if (!inputs.has(name)) inputs.set(name, { value: 'stale' });
			return inputs.get(name);
		},
	} as unknown as HTMLFormElement & { inputs: Map<string, { value: string }> };
}

test('no marketing consent stores nothing and deletes stale keys', async () => {
	const storage = mapStorage({ utm: '{"utm_source":"old"}', fpr: 'old', utm_source: 'old' });
	const { syncAttributionStorage, attributionQuery } = await loadPage({
		search: '?utm_source=a&fpr=b',
		consent: { v: 1, analytics: true, marketing: false },
		storage,
	});

	syncAttributionStorage();

	assert.deepEqual([...storage.map.keys()], []);
	assert.equal(attributionQuery(), '');
});

test('marketing consent stores the URL campaign whole', async () => {
	const storage = mapStorage({ utm: '{"utm_source":"old","utm_term":"t"}' });
	const { syncAttributionStorage } = await loadPage({
		search: '?utm_source=new&utm_medium=m',
		consent: { v: 1, marketing: true },
		storage,
	});

	syncAttributionStorage();

	assert.deepEqual(JSON.parse(storage.map.get('utm')!), { utm_source: 'new', utm_medium: 'm' });
});

test('only the five utm keys and fpr pass', async () => {
	const { attributionQuery } = await loadPage({
		search: '?utm_source=a&utm_evil=x&fpr=p',
		consent: { v: 1, marketing: true },
	});

	assert.equal(attributionQuery(), 'utm_source=a&fpr=p');
});

test('client id only with analytics consent', async () => {
	const cookie = 'tb_consent=x; _ga=GA1.1.111.222';
	const granted = await loadPage({ consent: { v: 1, analytics: true }, cookie });
	const form = fakeForm();
	assert.equal(granted.fillTrackingFields(form).client_id, '111.222');
	assert.equal(form.inputs.get('client_id')?.value, '111.222');

	const refused = await loadPage({ consent: { v: 1, analytics: false }, cookie });
	const form2 = fakeForm();
	assert.equal('client_id' in refused.fillTrackingFields(form2), false);
	assert.equal(form2.inputs.get('client_id')?.value, '');
});

test('throwing localStorage', async () => {
	const { syncAttributionStorage, attributionQuery } = await loadPage({
		search: '?utm_source=a',
		consent: { v: 1, marketing: true },
		storage: throwingStorage,
	});

	assert.doesNotThrow(syncAttributionStorage);
	assert.doesNotThrow(attributionQuery);
});
