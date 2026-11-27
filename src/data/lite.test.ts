import test from 'node:test';
import assert from 'node:assert/strict';
import { LITE_RUN_CMD, liteComposeFile, liteRunCmd } from './lite.ts';
import { TBMQ_LITE_VER } from './versions.ts';

// The docs show the command in several variants. Each is built by `liteRunCmd`, and these pin the
// text a reader copies, line by line.

const RUN = 'docker run -d --name tbmq-lite --restart unless-stopped \\';
const PORTS = '  -p 1883:1883 -p 8083:8083 -p 8084:8084 \\';
const IMAGE = `thingsboard/tbmq-lite:${TBMQ_LITE_VER}`;

test('the lead command: the ports, the named volume and the released image', () => {
	assert.equal(liteRunCmd(), [RUN, PORTS, `  -v tbmq-lite:/data ${IMAGE}`].join('\n'));
	assert.equal(LITE_RUN_CMD, liteRunCmd());
});

test('settings go on their own lines, between the ports and the volume', () => {
	assert.equal(
		liteRunCmd({ env: ['STORE_WAL_SYNC=always', "TBMQ_METRICS_TOKEN='a-long-random-token'"] }),
		[
			RUN,
			PORTS,
			'  -e STORE_WAL_SYNC=always \\',
			"  -e TBMQ_METRICS_TOKEN='a-long-random-token' \\",
			`  -v tbmq-lite:/data ${IMAGE}`,
		].join('\n')
	);
});

test('a host directory replaces the named volume', () => {
	assert.equal(liteRunCmd({ volume: '/srv/tbmq-lite' }), [RUN, PORTS, `  -v /srv/tbmq-lite:/data ${IMAGE}`].join('\n'));
});

test('a further mount follows the data mount, and the image moves to its own line', () => {
	assert.equal(
		liteRunCmd({ mounts: ['"$PWD/logback.xml:/config/logback.xml:ro"'] }),
		[RUN, PORTS, '  -v tbmq-lite:/data \\', '  -v "$PWD/logback.xml:/config/logback.xml:ro" \\', `  ${IMAGE}`].join(
			'\n'
		)
	);
});

test('another tag replaces the released one', () => {
	assert.equal(
		liteRunCmd({ tag: '<new version>' }),
		[RUN, PORTS, '  -v tbmq-lite:/data thingsboard/tbmq-lite:<new version>'].join('\n')
	);
});

test('the Compose file publishes the ports of the run command and mounts the same volume', () => {
	assert.equal(
		liteComposeFile({ TBMQ_ADMIN_PASSWORD: 'choose-a-strong-password' }),
		[
			'services:',
			'  tbmq-lite:',
			`    image: ${IMAGE}`,
			'    restart: unless-stopped',
			'    ports:',
			'      - "1883:1883"',
			'      - "8083:8083"',
			'      - "8084:8084"',
			'    environment:',
			'      TBMQ_ADMIN_PASSWORD: "choose-a-strong-password"',
			'    volumes:',
			'      - tbmq-lite:/data',
			'',
			'volumes:',
			'  tbmq-lite:',
		].join('\n')
	);
	assert.ok(!liteComposeFile().includes('environment:'), 'no environment block without settings');
});
