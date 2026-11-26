/**
 * TBMQ version constants.
 * Import these in MDX or Astro files to reference Docker image tags,
 * download links, and other version-dependent content.
 *
 * Update this file when a new release is published.
 */

/** TBMQ Broker */
export const TBMQ_VER = '2.4.2';

/** Previous TBMQ Broker release — the version an upgrade to TBMQ_VER starts from */
export const TBMQ_PREV_VER = '2.4.1';

/** TBMQ Broker Professional Edition */
export const TBMQ_PE_VER = '2.4.2PE';

/** TBMQ Broker release branch (for installation scripts) */
export const TBMQ_BRANCH = 'release-2.4.2';

/** TBMQ Lite Docker image tag (thingsboard/tbmq-lite) */
export const TBMQ_LITE_VER = '2.5.0-beta';
