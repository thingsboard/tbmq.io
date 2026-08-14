import type { SelfManagedData } from './types';

export const tbmqSelfManagedData: SelfManagedData = {
	perpetual: {
		benefits: [
			{
				icon: 'tabler:currency-dollar',
				title: 'Predictable CAPEX',
				description: 'A single, transparent license fee simplifies long-term financial planning.',
			},
			{
				icon: 'tabler:trending-down',
				title: 'Lower TCO',
				description:
					'Eliminates recurring subscription fees, offering a lower total cost of ownership for long-term projects.',
			},
			{
				icon: 'tabler:server',
				title: 'On-Premises & Offline Mode',
				description: 'Deploy anywhere, including fully offline or isolated networks for 100% data sovereignty.',
			},
			{
				icon: 'tabler:settings',
				title: 'Customizable License',
				description: 'A flexible license that can be tailored to your exact business strategy.',
			},
		],
	},
};
