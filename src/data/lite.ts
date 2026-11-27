import { TBMQ_LITE_VER } from './versions.ts';

/**
 * What the TBMQ Lite product page (`/product/lite/`) and the TBMQ Lite docs both state. Each is
 * written once here, so a changed install command or a re-measured capacity reaches every place
 * that shows it. The docs remain the reference: the capacity run is described in
 * `docs/lite/guarantees-and-limits` ("Capacity"), the command in `docs/lite/installation`.
 */

/** The command the install guide leads with, and the one the product page's hero offers to copy. */
export const LITE_RUN_CMD = `docker run -d --name tbmq-lite --restart unless-stopped \\
  -p 1883:1883 -p 8083:8083 -p 8084:8084 \\
  -v tbmq-lite:/data thingsboard/tbmq-lite:${TBMQ_LITE_VER}`;

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
