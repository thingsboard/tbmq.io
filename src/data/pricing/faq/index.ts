import type { FaqCategory } from '../types';

import { tbmqCeFaq } from './tbmq-ce';
import { tbmqSelfManagedPaygFaq } from './tbmq-self-managed-payg';
import { tbmqSelfManagedPerpFaq } from './tbmq-self-managed-perp';
import { tbmqPrivateCloudFaq } from './tbmq-private-cloud';

export interface FaqContextData {
	contextId: string;
	title: string;
	categories: FaqCategory[];
}

export const pricingFaqData: FaqContextData[] = [
	{ contextId: 'tbmq-ce', title: 'TBMQ Community Edition FAQs', categories: tbmqCeFaq },
	{ contextId: 'tbmq-pe-payg', title: 'TBMQ Self-managed Pay-as-you-go FAQs', categories: tbmqSelfManagedPaygFaq },
	{ contextId: 'tbmq-pe-perpetual', title: 'TBMQ Self-managed Perpetual FAQs', categories: tbmqSelfManagedPerpFaq },
	{ contextId: 'tbmq-private-cloud', title: 'TBMQ Private Cloud FAQs', categories: tbmqPrivateCloudFaq },
];
