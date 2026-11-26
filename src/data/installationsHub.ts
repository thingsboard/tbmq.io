import { DEMO_SIGNUP } from './cta-destinations';

/** The ways to get a broker on the installations hub (`/installations/`), one section each. */

export interface InstallLink {
	label: string;
	href: string;
	/** Analytics id: rendered as the link's `id`, together with the `gtm_button` class. */
	id?: string;
}

export interface InstallOption {
	label: string;
	note?: string;
	logo: string;
	href: string;
}

export interface InstallOptionGroup {
	title: string;
	items: InstallOption[];
}

export interface InstallAside {
	title: string;
	text: string;
	links: InstallLink[];
}

export interface InstallSection {
	id: 'live-demo' | 'tbmq' | 'tbmq-lite';
	name: string;
	label: string;
	/** Small badge beside the title, e.g. "Beta". */
	tag?: string;
	description: string;
	tile: 'tbmq' | 'tbmq-lite';
	/** Tinted full-width band instead of the plain section background. */
	band?: boolean;
	/** One "Try now" row: a hosted broker to open instead of a guide to follow. */
	tryNow?: InstallLink;
	primary?: InstallLink;
	links: InstallLink[];
	options?: InstallOptionGroup[];
	aside?: InstallAside;
}

const logo = (name: string) => `/src/assets/images/installation/${name}`;
const PE = '/docs/pe/installation';

export const installSections: InstallSection[] = [
	{
		id: 'live-demo',
		name: 'Live demo',
		label: 'Nothing to install',
		description: 'A public TBMQ broker at demo.tbmq.io: connect any MQTT client, or sign up to open the TBMQ UI.',
		tile: 'tbmq',
		band: true,
		tryNow: { label: 'Sign up', href: DEMO_SIGNUP },
		links: [{ label: 'How to connect', href: '/live-demo/' }],
		aside: {
			title: 'Private Cloud',
			// Worded from the pricing page's Private Cloud section; claims nothing it does not.
			text: 'Your own private MQTT broker instance, hosted for you by the ThingsBoard team, so you can focus on building your solutions.',
			links: [
				{ label: 'Contact us', href: '/contact-us/?subject=TBMQ' },
				{ label: 'See plans', href: '/pricing/?section=tbmq-options&product=tbmq-private-cloud' },
			],
		},
	},
	{
		id: 'tbmq',
		name: 'TBMQ',
		label: 'Self-managed, one node to a cluster',
		description:
			'The broker on Kafka, Valkey and PostgreSQL: one container set to evaluate or develop, a cluster of broker nodes for production.',
		tile: 'tbmq',
		primary: { label: 'Installation guide', href: `${PE}/`, id: 'TryItNow_TBMQ_Install_PE' },
		links: [
			{ label: 'Community Edition', href: '/docs/installation/', id: 'TryItNow_TBMQ_Install_CE' },
			{ label: 'See plans', href: '/pricing/' },
			{ label: 'Explore TBMQ', href: '/product/' },
		],
		// Grouped as on the docs installation index.
		options: [
			{
				title: 'On your servers',
				items: [
					{ label: 'Docker', note: '(Linux, macOS)', logo: logo('docker-linux-mac.svg'), href: `${PE}/docker/` },
					{ label: 'Docker', note: '(Windows)', logo: logo('docker-windows.svg'), href: `${PE}/docker-windows/` },
					{
						label: 'Building from source',
						logo: logo('sources.svg'),
						href: '/docs/installation/building-from-source/',
					},
				],
			},
			{
				title: 'As a cluster',
				items: [
					{
						label: 'Docker Compose',
						logo: logo('docker-compose.svg'),
						href: `${PE}/cluster/docker-compose-setup/`,
					},
					{ label: 'Minikube', logo: logo('minikube.svg'), href: `${PE}/cluster/minikube-cluster-setup/` },
				],
			},
			{
				title: 'In your cloud account',
				items: [
					{ label: 'AWS', logo: logo('aws.svg'), href: `${PE}/cluster/aws-cluster-setup/` },
					{ label: 'Azure', logo: logo('azure.svg'), href: `${PE}/cluster/azure-cluster-setup/` },
					{ label: 'GCP', logo: logo('gcp.svg'), href: `${PE}/cluster/gcp-cluster-setup/` },
				],
			},
			{
				title: 'With Helm',
				items: [
					{ label: 'Minikube', logo: logo('minikube.svg'), href: `${PE}/cluster/helm-cluster-setup-minikube/` },
					{ label: 'AWS EKS', logo: logo('eks.svg'), href: `${PE}/cluster/helm-cluster-setup-aws/` },
					{
						label: 'Azure AKS',
						logo: logo('azure-kubernetes.svg'),
						href: `${PE}/cluster/helm-cluster-setup-azure/`,
					},
					{ label: 'GCP GKE', logo: logo('gcp-kubernetes.svg'), href: `${PE}/cluster/helm-cluster-setup-gcp/` },
				],
			},
		],
	},
	{
		id: 'tbmq-lite',
		name: 'TBMQ Lite',
		label: 'Single container',
		tag: 'Beta',
		description:
			'One container and one data volume, with no Kafka, PostgreSQL or Valkey beside it. For sites that fit one machine, the edge, labs and laptops.',
		tile: 'tbmq-lite',
		primary: { label: 'Installation guide', href: '/docs/lite/installation/' },
		links: [
			{ label: 'Explore TBMQ Lite', href: '/product/lite/' },
			{ label: 'Compare with TBMQ', href: '/docs/lite/lite-vs-tbmq/' },
		],
		options: [
			{
				title: 'With Docker',
				items: [
					{ label: 'Docker', logo: logo('docker-linux-mac.svg'), href: '/docs/lite/installation/#install' },
					{
						label: 'Docker Compose',
						logo: logo('docker-compose.svg'),
						href: '/docs/lite/installation/#docker-compose',
					},
				],
			},
		],
	},
];
