export interface HeroButton {
	id: string;
	label: string;
	href: string;
	target?: '_blank';
	secondary?: boolean;
}

export interface HeroImage {
	src: string;
	alt: string;
	position: 'bg' | 'main';
	extraClass?: string;
}

export interface Feature {
	title: string;
	href: string;
	target?: '_blank';
	description: string;
}

export interface DeployCard {
	logo: string;
	logoAlt: string;
	title: string;
	href: string;
	target?: '_blank';
}

export interface DeployGroup {
	/** 'premise' | 'cloud' | undefined — no heading */
	type?: 'premise' | 'cloud';
	cards: DeployCard[];
}

export interface ProductData {
	id: string;
	title: string;
	description: string;
	buttons: HeroButton[];
	heroImages: HeroImage[];
	/** Two columns of features */
	features: [Feature[], Feature[]];
	deployGroups: DeployGroup[];
}

// ---------------------------------------------------------------------------
// Image path helpers
// ---------------------------------------------------------------------------

const install = (name: string) => `/src/assets/images/installation/${name}`;
const mqttBroker = (name: string) => `/src/assets/images/landings/mqtt-broker/${name}`;

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const products: ProductData[] = [
	// ── MQTT Broker ───────────────────────────────────────────────────────────
	{
		id: 'mqtt-broker',
		title: 'MQTT Broker',
		description:
			'<b>TBMQ</b> is a highly scalable and durable <a href="/" target="_blank" rel="noopener noreferrer">MQTT message broker</a> built for real-time data processing across IoT ecosystems of any scale. It efficiently handles millions of concurrent client connections and processes millions of messages per second while maintaining low latency and reliable delivery. Designed for horizontal scalability, TBMQ seamlessly expands across cluster nodes to support massive deployments with millions of connected devices. <a href="/docs/pe/" target="_blank" rel="noopener noreferrer">Read more<span class="sr-only"> about TBMQ MQTT Broker</span></a>.',
		buttons: [
			{
				id: 'TryItNow_TBMQ_Demo',
				label: 'Live Demo',
				href: 'https://demo.tbmq.io/signup',
				target: '_blank',
			},
			{
				id: 'TryItNow_TBMQ_Install_PE',
				label: 'Start PE Trial',
				href: '/docs/pe/installation/',
				target: '_blank',
				secondary: true,
			},
			{
				id: 'TryItNow_TBMQ_Install_CE',
				label: 'Download CE',
				href: '/docs/installation/',
				target: '_blank',
				secondary: true,
			},
		],
		heroImages: [
			{
				src: mqttBroker('tbmq-try-2.png'),
				alt: 'ThingsBoard MQTT Broker Home Page',
				position: 'bg',
			},
			{
				src: mqttBroker('tbmq-try-1.png'),
				alt: 'ThingsBoard MQTT Broker Sessions Page',
				position: 'main',
			},
		],
		features: [
			[
				{
					title: 'Unlimited Horizontal Scaling',
					href: '/docs/pe/reference/100m-connections-performance-test/',
					target: '_blank',
					description: 'Scale horizontally to manage more than 100M MQTT connections on a single cluster',
				},
				{
					title: 'Million-Message Throughput',
					href: '/docs/pe/reference/3m-throughput-single-node-performance-test/',
					target: '_blank',
					description:
						'Process millions of messages per second with 1 TBMQ server and single-digit latency',
				},
				{
					title: 'Masterless High Availability',
					href: '/docs/pe/architecture/',
					target: '_blank',
					description: 'Prevent single point of failure with masterless nodes in the cluster',
				},
			],
			[
				{
					title: 'Universal MQTT Support',
					href: '/docs/pe/getting-started/',
					target: '_blank',
					description: 'MQTT 3.x and 5.0 compatible for a seamless and secure connection experience',
				},
				{
					title: 'Zero Data Loss Guarantee',
					href: '/docs/pe/architecture/',
					target: '_blank',
					description:
						'Guarantee the persistence and replication of your data to ensure it\'s never lost',
				},
				{
					title: 'K8s & Cloud Agnostic',
					href: '/docs/pe/installation/',
					target: '_blank',
					description: 'Deploy in cloud or on-premises using K8s scripts with ease',
				},
			],
		],
		deployGroups: [
			{
				type: 'premise',
				cards: [
					{
						logo: install('docker-linux-mac.svg'),
						logoAlt: 'Docker (Linux or Mac OS)',
						title: 'Docker (Linux or Mac OS)',
						href: '/docs/pe/installation/docker/',
						target: '_blank',
					},
					{
						logo: install('docker-windows.svg'),
						logoAlt: 'Docker (Windows)',
						title: 'Docker (Windows)',
						href: '/docs/pe/installation/docker-windows/',
						target: '_blank',
					},
					{
						logo: install('docker-compose.svg'),
						logoAlt: 'Cluster setup with Docker Compose',
						title: 'Cluster with Docker Compose',
						href: '/docs/pe/installation/cluster/docker-compose-setup/',
						target: '_blank',
					},
					{
						logo: install('minikube.svg'),
						logoAlt: 'Cluster setup with Minikube',
						title: 'Cluster setup with Minikube',
						href: '/docs/pe/installation/cluster/minikube-cluster-setup/',
						target: '_blank',
					},
				],
			},
			{
				type: 'cloud',
				cards: [
					{
						logo: install('eks.svg'),
						logoAlt: 'Cluster setup on EKS',
						title: 'Cluster setup on EKS',
						href: '/docs/pe/installation/cluster/aws-cluster-setup/',
						target: '_blank',
					},
					{
						logo: install('azure.svg'),
						logoAlt: 'Cluster setup on AKS',
						title: 'Cluster setup on AKS',
						href: '/docs/pe/installation/cluster/azure-cluster-setup/',
						target: '_blank',
					},
					{
						logo: install('gcp.svg'),
						logoAlt: 'Cluster setup on GCP',
						title: 'Cluster setup on GCP',
						href: '/docs/pe/installation/cluster/gcp-cluster-setup/',
						target: '_blank',
					},
					{
						logo: install('helm.svg'),
						logoAlt: 'Cluster setup using Helm',
						title: 'Cluster setup using Helm',
						href: '/docs/pe/installation/?installationType=helm',
						target: '_blank',
					},
				],
			},
		],
	},
];
