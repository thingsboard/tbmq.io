import { TBMQ_LITE_VER } from './versions.ts';

/**
 * What the TBMQ Lite product page (`/product/lite/`) and the TBMQ Lite docs both state. Each is
 * written once here, so a changed install command or a re-measured capacity reaches every place
 * that shows it. The docs remain the reference: the capacity run is described in
 * `docs/lite/guarantees-and-limits` ("Capacity"), the command in `docs/lite/installation`.
 */

// The parts every way of starting the broker shares.
const NAME = 'tbmq-lite';
const IMAGE = 'thingsboard/tbmq-lite';
const RESTART = 'unless-stopped';
/** MQTT over TCP; HTTP (the UI, the REST API, health); MQTT over WebSocket. */
const PORTS = [1883, 8083, 8084];
/** The named volume, and where the broker keeps its data in the container. */
const VOLUME = 'tbmq-lite';
const DATA_DIR = '/data';

export interface LiteRunOptions {
	/** `-e` values, one line each: `STORE_WAL_SYNC=always`. */
	env?: string[];
	/** What is mounted at `/data`: the named volume unless a host directory is given. */
	volume?: string;
	/** Further `-v` values, after the data mount. */
	mounts?: string[];
	/** The image tag, `TBMQ_LITE_VER` unless given. */
	tag?: string;
}

/**
 * The `docker run` command that starts the broker. Every variant the docs show (a password, a bind
 * mount, extra settings, an upgrade) is this command with options, so a port, the volume or the
 * image is changed once, above.
 */
export function liteRunCmd({
	env = [],
	volume = VOLUME,
	mounts = [],
	tag = TBMQ_LITE_VER,
}: LiteRunOptions = {}): string {
	const image = `${IMAGE}:${tag}`;
	const data = `-v ${volume}:${DATA_DIR}`;
	return [
		`docker run -d --name ${NAME} --restart ${RESTART}`,
		PORTS.map((port) => `-p ${port}:${port}`).join(' '),
		...env.map((value) => `-e ${value}`),
		// The image closes the data mount's line, unless more mounts come between them.
		...(mounts.length ? [data, ...mounts.map((mount) => `-v ${mount}`), image] : [`${data} ${image}`]),
	].join(' \\\n  ');
}

/** The same container as a Compose file. `env` maps a variable to its value. */
export function liteComposeFile(env: Record<string, string> = {}): string {
	const settings = Object.entries(env);
	return [
		'services:',
		`  ${NAME}:`,
		`    image: ${IMAGE}:${TBMQ_LITE_VER}`,
		`    restart: ${RESTART}`,
		'    ports:',
		...PORTS.map((port) => `      - "${port}:${port}"`),
		...(settings.length ? ['    environment:', ...settings.map(([name, value]) => `      ${name}: "${value}"`)] : []),
		'    volumes:',
		`      - ${VOLUME}:${DATA_DIR}`,
		'',
		'volumes:',
		`  ${VOLUME}:`,
	].join('\n');
}

/**
 * The upgrade: pull the image of `tag`, remove the container, and start it again on the same volume.
 * Built here so the image pulled is the image run.
 */
export function liteUpgradeCmd(tag: string): string {
	return [`docker pull ${IMAGE}:${tag}`, `docker stop ${NAME}`, `docker rm ${NAME}`, liteRunCmd({ tag })].join('\n');
}

/** The command the install guide leads with, and the one the product page's hero offers to copy. */
export const LITE_RUN_CMD = liteRunCmd();

/** Measured capacity: the highest sustained rate per container size, and the ack latency at it. */
export const LITE_CAPACITY = {
	/** The container the broker is sized for. */
	reference: {
		container: '2 CPUs, 2 GB',
		/** The same size, worded for a sentence. */
		containerInText: '2 CPUs and 2 GB',
		/** msg/s */
		rate: '7,500',
		/** Ack p99 over the run's 10-second windows: the median window and the worst one. */
		ackP99MedianMs: 17,
		ackP99WorstMs: 52,
	},
	bestEffort: {
		container: '1 CPU, 2 GB',
		/** msg/s */
		rate: '3,750',
	},
} as const;
