import test from 'node:test';
import assert from 'node:assert/strict';
import {
	GLYPHS,
	MARK_PATH,
	PUBLISHERS,
	SUBSCRIBERS,
	horizontalVariant,
	minHeightFor,
	minWidthFor,
	pace,
	verticalVariant,
	visibilityCss,
} from './hero-cluster.ts';

test('data matches the approved mockup', () => {
	assert.deepEqual(
		PUBLISHERS.map((p) => p.label),
		['Sensors', 'Gateways', 'Vehicles', 'Meters']
	);
	assert.deepEqual(
		SUBSCRIBERS.map((s) => s.label),
		['Applications', 'Dashboards', 'Analytics']
	);
	assert.deepEqual(Object.keys(GLYPHS).sort(), [
		'analytics',
		'app',
		'dashboard',
		'gateway',
		'meter',
		'sensor',
		'vehicle',
	]);
	assert.ok(MARK_PATH.startsWith('M37.8721 19.4043'));
});

test('horizontal variant geometry', () => {
	const h = horizontalVariant();
	assert.deepEqual(h.box, { w: 720, h: 540 });
	assert.deepEqual(h.frame, { x: 190, y: 70, w: 340, h: 400, rx: 22 });
	assert.deepEqual(
		h.cards.map((c) => [c.x, c.y, c.w, c.h, c.rx]),
		[
			[230, 108, 260, 88, 14],
			[230, 226, 260, 88, 14],
			[230, 344, 260, 88, 14],
		]
	);
	assert.deepEqual(
		h.cards.map((c) => c.title),
		['TBMQ node 1', 'TBMQ node 2', 'TBMQ node 3']
	);
	assert.deepEqual(
		h.clients.map((c) => [c.x, c.y]),
		[
			[62, 120],
			[62, 220],
			[62, 320],
			[62, 420],
			[658, 160],
			[658, 270],
			[658, 380],
		]
	);
	assert.equal(h.lanes.length, 7);
	assert.equal(h.lanes[0].d, 'M86 120C158 120 158 138 230 138'); // publisher 0 → node 1
	assert.equal(h.lanes[2].d, 'M86 320C158 320 158 284 230 284'); // publisher 2 → node 2 (wiring [0,1,1,2])
	assert.equal(h.lanes[4].d, 'M490 152C562 152 562 160 634 160'); // node 1 → subscriber 0
	assert.deepEqual(h.peers, ['M290 196V226M430 196V226', 'M290 314V344M430 314V344']);
	assert.deepEqual(h.text, { title: 18, sub: 12.5, label: 13, caption: 12, tag: 11 });
});

test('vertical variant geometry', () => {
	const v = verticalVariant();
	assert.deepEqual(v.box, { w: 360, h: 436 });
	assert.deepEqual(v.frame, { x: 28, y: 104, w: 304, h: 236, rx: 18 });
	assert.deepEqual(
		v.cards.map((c) => [c.x, c.y, c.w, c.h]),
		[
			[60, 122, 240, 56],
			[60, 194, 240, 56],
			[60, 266, 240, 56],
		]
	);
	assert.deepEqual(
		v.clients.map((c) => [c.x, c.y]),
		[
			[60, 40],
			[140, 40],
			[220, 40],
			[300, 40],
			[90, 406],
			[180, 406],
			[270, 406],
		]
	);
	assert.equal(v.lanes.length, 7);
	assert.deepEqual(v.peers, []);
	assert.deepEqual(v.captions, []);
	assert.deepEqual(v.text, { title: 18, tag: 12 }); // tag 12, not the mockup's 11, so it holds the floor down to a 300 px render
});

test('everything lies inside its box', () => {
	for (const v of [horizontalVariant(), verticalVariant()]) {
		for (const c of v.clients) {
			assert.ok(
				c.x - c.r >= 0 && c.x + c.r <= v.box.w && c.y - c.r >= 0 && c.y + c.r <= v.box.h,
				`${v.key} ${c.label}`
			);
		}
		for (const r of [v.frame, ...v.cards])
			assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= v.box.w && r.y + r.h <= v.box.h);
		assert.ok(v.tag.y >= 0);
	}
	const h = horizontalVariant();
	const labelDy = h.labelDy ?? Number.NaN;
	assert.equal(labelDy, 44); // labels sit this far below the node centre
	for (const c of h.clients) assert.ok(c.y + labelDy + 4 <= h.box.h, 'label baseline + descent');
});

test('label floor thresholds derive from the data', () => {
	const h = horizontalVariant().box;
	assert.equal(minWidthFor(h, 18), 400);
	assert.equal(minWidthFor(h, 13), 554);
	assert.equal(minWidthFor(h, 12.5), 576);
	assert.equal(minWidthFor(h, 12), 600);
	assert.equal(minWidthFor(h, 11), 655);
	assert.equal(minHeightFor(h, 18), 300);
	const v = verticalVariant().box;
	assert.equal(minWidthFor(v, 18), 200);
	assert.equal(minWidthFor(v, 12), 300);
});

test('visibilityCss emits defaults, swaps and floors', () => {
	const css = visibilityCss(horizontalVariant(), verticalVariant());
	const swap = '{.hero-cluster__h{display:none}.hero-cluster__v{display:block}}';
	assert.ok(css.startsWith('.hero-cluster__v{display:none}'));
	assert.ok(css.includes(`@media (width < 600px)${swap}`));
	assert.ok(css.includes(`@container hero-cluster (width < 400px)${swap}`));
	assert.ok(css.includes(`@container hero-panel (height < 300px)${swap}`));
	assert.ok(css.includes('@container hero-cluster-h (width < 554px){.hero-cluster__h .lbl{display:none}}'));
	assert.ok(css.includes('@container hero-cluster-h (width < 576px){.hero-cluster__h .card-sub{display:none}}'));
	assert.ok(css.includes('@container hero-cluster-h (width < 600px){.hero-cluster__h .cap{display:none}}'));
	assert.ok(css.includes('@container hero-cluster-h (width < 655px){.hero-cluster__h .tag{display:none}}'));
	assert.ok(css.includes('@container hero-cluster-v (width < 300px){.hero-cluster__v .tag{display:none}}'));
	assert.ok(!css.includes('.card-title{display:none}'));
});

test('card titles re-centre when the status line hides', () => {
	const h = horizontalVariant();
	const v = verticalVariant();
	assert.deepEqual(h.inner.title, { dx: 70, dy: -3, soloDy: 6 });
	assert.equal(v.inner.title.dy, v.inner.title.soloDy); // vertical cards never carry a status line
	const css = visibilityCss(h, v);
	assert.ok(
		css.includes('@container hero-cluster-h (width < 576px){.hero-cluster__h .card-title{transform:translateY(9px)}}')
	);
	assert.ok(!css.includes('.hero-cluster__v .card-title{transform'));
});

test('pace is deterministic and staggered', () => {
	assert.deepEqual(pace(0), { dur: 3.1, delay: -0.01 });
	assert.deepEqual(pace(1), { dur: 3.7, delay: -1.28 });
	assert.deepEqual(pace(5), { dur: 3.1, delay: -0.16 }); // (5*1.27) % 3.1 = 0.15, +0.01
});
