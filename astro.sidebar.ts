import type { StarlightUserConfig } from '@astrojs/starlight/types';

type SidebarConfig = NonNullable<StarlightUserConfig['sidebar']>;

const tbmqGuideItems = (prefix: string): SidebarConfig => {
	const isPE = prefix.includes('/pe');
	return [
		{
			label: 'Security',
			collapsed: true,
			items: [
				{ label: 'Overview', slug: `${prefix}/security/overview` },
				{ label: 'MQTTS', slug: `${prefix}/security/mqtts` },
				{ label: 'HTTPS', slug: `${prefix}/security/https` },
				{ label: 'MQTT listeners', slug: `${prefix}/security/listeners` },
				{
					label: 'Authentication',
					collapsed: true,
					items: [
						{ label: 'Basic', slug: `${prefix}/security/authentication/basic` },
						{ label: 'X.509 certificate chain', slug: `${prefix}/security/authentication/x509` },
						{ label: 'JWT', slug: `${prefix}/security/authentication/jwt` },
						{ label: 'SCRAM', slug: `${prefix}/security/authentication/scram` },
						{ label: 'HTTP', slug: `${prefix}/security/authentication/http` },
					],
				},
				...(isPE
					? [
							{ label: 'OAuth 2.0', slug: `${prefix}/security/oauth-2-support` },
							{ label: 'Domains', slug: `${prefix}/security/domains` },
							{ label: 'Role-based access control', slug: `${prefix}/security/rbac` },
							{ label: 'Audit logs', slug: `${prefix}/security/audit-log` },
						]
					: []),
			],
		},
		{
			label: 'MQTT essentials',
			collapsed: true,
			items: [
				{ label: 'MQTT protocol', slug: `${prefix}/user-guide/mqtt-protocol` },
				{ label: 'MQTT broker', slug: `${prefix}/user-guide/mqtt-broker` },
				{ label: 'Client ID', slug: `${prefix}/user-guide/mqtt-client-id` },
				{ label: 'Topics and wildcards', slug: `${prefix}/user-guide/topics` },
				{ label: 'Quality of service (QoS)', slug: `${prefix}/user-guide/qos` },
				{
					label: 'Non-persistent and persistent sessions',
					slug: `${prefix}/user-guide/clean-persistent-sessions`,
				},
				{ label: 'MQTT over WebSocket', slug: `${prefix}/user-guide/mqtt-over-ws` },
				{ label: 'Shared subscriptions', slug: `${prefix}/user-guide/shared-subscriptions` },
				{ label: 'Retained messages', slug: `${prefix}/user-guide/retained-messages` },
				{ label: 'Last will and testament', slug: `${prefix}/user-guide/last-will` },
				{ label: 'Keep alive', slug: `${prefix}/user-guide/keep-alive` },
			],
		},
		{
			label: 'Integration with ThingsBoard',
			slug: `${prefix}/user-guide/integrations/how-to-connect-thingsboard-to-tbmq`,
		},
		{
			label: 'Broker operations',
			collapsed: true,
			items: [
				{ label: 'TBMQ client type', slug: `${prefix}/user-guide/mqtt-client-type` },
				{ label: 'Blocked clients', slug: `${prefix}/other/blocked-client` },
				{ label: 'Backpressure', slug: `${prefix}/user-guide/backpressure` },
				{ label: 'Msg delivery strategies', slug: `${prefix}/other/msg-delivery-strategy` },
				{ label: 'PROXY protocol', slug: `${prefix}/other/proxy-protocol` },
				{ label: 'Health API', slug: `${prefix}/other/health` },
				{ label: 'Bulk provisioning', slug: `${prefix}/other/bulk-provisioning` },
			],
		},
		{
			label: 'Integrations',
			collapsed: true,
			items: [
				{ label: 'Overview', slug: `${prefix}/integrations` },
				{ label: 'HTTP', slug: `${prefix}/integrations/http` },
				{ label: 'MQTT', slug: `${prefix}/integrations/mqtt` },
				{ label: 'Kafka', slug: `${prefix}/integrations/kafka` },
			],
		},
		{
			label: 'Management console',
			collapsed: true,
			items: [
				{ label: 'Monitoring', slug: `${prefix}/user-guide/ui/monitoring` },
				{ label: 'Sessions', slug: `${prefix}/user-guide/ui/sessions` },
				{ label: 'Subscriptions', slug: `${prefix}/user-guide/ui/subscriptions` },
				{
					label: 'MQTT client credentials',
					slug: `${prefix}/user-guide/ui/mqtt-client-credentials`,
				},
				{ label: 'Unauthorized clients', slug: `${prefix}/user-guide/ui/unauthorized-clients` },
				{ label: 'WebSocket client', slug: `${prefix}/user-guide/ui/websocket-client` },
				{
					label: 'Application shared subscriptions',
					slug: `${prefix}/user-guide/ui/shared-subscriptions`,
				},
				{ label: 'Users', slug: `${prefix}/user-guide/ui/users` },
				{ label: 'Settings', slug: `${prefix}/user-guide/ui/settings` },
			],
		},
		...(isPE
			? [
					{
						label: 'White Labeling',
						collapsed: true,
						items: [
							{ label: 'Overview', slug: `${prefix}/white-labeling` },
							{ label: 'Image gallery', slug: `${prefix}/image-gallery` },
						],
					},
					{ label: 'Private Cloud subscription', slug: `${prefix}/subscription` },
				]
			: []),
	];
};

const tbmqInstallItems = (prefix: string): SidebarConfig => {
	const isPE = prefix.includes('/pe');
	return [
		{ label: 'Live demo', slug: `${prefix}/installation/live-demo` },
		{
			label: 'On-premises',
			collapsed: true,
			items: [
				{
					label: 'Standalone',
					collapsed: true,
					items: [
						{ label: 'Docker (Linux & macOS)', slug: `${prefix}/installation/docker` },
						{ label: 'Docker (Windows)', slug: `${prefix}/installation/docker-windows` },
						...(!isPE ? [{ label: 'Building from source', slug: `${prefix}/installation/building-from-source` }] : []),
					],
				},
				{
					label: 'Cluster',
					collapsed: true,
					items: [
						{ label: 'Docker Compose', slug: `${prefix}/installation/cluster/docker-compose-setup` },
						{ label: 'Minikube', slug: `${prefix}/installation/cluster/minikube-cluster-setup` },
					],
				},
			],
		},
		{
			label: 'Cloud',
			collapsed: true,
			items: [
				{ label: 'AWS', slug: `${prefix}/installation/cluster/aws-cluster-setup` },
				{ label: 'Azure', slug: `${prefix}/installation/cluster/azure-cluster-setup` },
				{ label: 'GCP', slug: `${prefix}/installation/cluster/gcp-cluster-setup` },
			],
		},
		{
			label: 'Helm',
			collapsed: true,
			items: [
				{ label: 'Minikube', slug: `${prefix}/installation/cluster/helm-cluster-setup-minikube` },
				{ label: 'AWS EKS', slug: `${prefix}/installation/cluster/helm-cluster-setup-aws` },
				{ label: 'Azure AKS', slug: `${prefix}/installation/cluster/helm-cluster-setup-azure` },
				{ label: 'GCP GKE', slug: `${prefix}/installation/cluster/helm-cluster-setup-gcp` },
			],
		},
		{ label: 'Upgrade instructions', slug: `${prefix}/installation/upgrade-instructions` },
	];
};

const tbmqReferenceItems = (prefix: string): SidebarConfig => [
	{
		label: 'Architecture',
		collapsed: true,
		items: [
			{ label: 'Overview', slug: `${prefix}/architecture` },
			{
				label: 'Details',
				collapsed: true,
				items: [
					{
						label: 'Persistent DEVICE client',
						slug: `${prefix}/architecture-details/persistent-device-client`,
					},
					{
						label: 'Persistent APPLICATION client',
						slug: `${prefix}/architecture-details/persistent-app-client`,
					},
				],
			},
		],
	},
	{
		label: 'Configuration',
		collapsed: true,
		items: [
			{ label: 'How to change configuration', slug: `${prefix}/installation/how-to-change-config` },
			{ label: 'MQTT broker', slug: `${prefix}/installation/config` },
			{ label: 'Integration executor', slug: `${prefix}/installation/ie-config` },
		],
	},
	{
		label: 'Performance tests',
		collapsed: true,
		items: [
			{
				label: 'Point-to-point: 1M msg/sec throughput',
				slug: `${prefix}/reference/1m-throughput-p2p-performance-test`,
			},
			{
				label: 'Fan-out: 3M msg/sec throughput',
				slug: `${prefix}/reference/3m-throughput-single-node-performance-test`,
			},
			{
				label: 'Fan-in: 100M concurrent connections',
				slug: `${prefix}/reference/100m-connections-performance-test`,
			},
		],
	},
	{
		label: 'REST APIs',
		collapsed: true,
		items: [
			{ label: 'Administration REST API', slug: `${prefix}/rest-api` },
			{ label: 'User management', slug: `${prefix}/user-management` },
			{
				label: 'MQTT client credentials management',
				slug: `${prefix}/mqtt-client-credentials-management`,
			},
			{
				label: 'Application shared subscriptions management',
				slug: `${prefix}/application-shared-subscription`,
			},
		],
	},
];

/** TBMQ Community Broker sidebar (pages at /docs/mqtt-broker/) */
export const tbmqSidebar: SidebarConfig = [
	{
		label: 'Getting Started',
		translations: { uk: 'Початок роботи' },
		items: [
			{
				label: 'Welcome to MQTT!',
				translations: { uk: 'Новий проєкт' },
				items: [
					{ label: 'Why TBMQ?', slug: 'docs/mqtt-broker/why-tbmq' },
					{ label: 'Getting Started', slug: 'docs/mqtt-broker/getting-started' },
				],
			},
			{
				label: 'Core concepts',
				items: [
					{ label: 'Client types', slug: 'docs/mqtt-broker/concepts/client-types' },
					{ label: 'Sessions', slug: 'docs/mqtt-broker/concepts/sessions' },
					{ label: 'Topics and wildcards', slug: 'docs/mqtt-broker/concepts/topics' },
					{ label: 'Delivery guarantees', slug: 'docs/mqtt-broker/concepts/qos' },
					{ label: 'Security model', slug: 'docs/mqtt-broker/concepts/security' },
					{ label: 'Clustering', slug: 'docs/mqtt-broker/concepts/clustering' },
				],
			},
		],
	},
	{
		label: 'Guides',
		collapsed: true,
		items: tbmqGuideItems('docs/mqtt-broker'),
	},
	{
		label: 'Installation',
		collapsed: true,
		items: tbmqInstallItems('docs/mqtt-broker'),
	},
	{
		label: 'Reference',
		collapsed: true,
		items: tbmqReferenceItems('docs/mqtt-broker'),
	},
	{
		label: 'Releases',
		items: [
			{ label: 'Release notes', slug: 'docs/mqtt-broker/releases' },
			{ label: 'Roadmap', slug: 'docs/mqtt-broker/roadmap' },
			{ label: 'Getting support', slug: 'docs/mqtt-broker/help' },
		],
	},
];

/** TBMQ PE Broker sidebar (pages at /docs/mqtt-broker/pe/) */
export const tbmqPeSidebar: SidebarConfig = [
	{
		label: 'Getting Started',
		translations: { uk: 'Початок роботи' },
		items: [
			{
				label: 'Welcome to MQTT!',
				translations: { uk: 'Новий проєкт' },
				items: [
					{ label: 'Why TBMQ?', slug: 'docs/mqtt-broker/pe/why-tbmq' },
					{ label: 'Getting Started', slug: 'docs/mqtt-broker/pe/getting-started' },
				],
			},
			{
				label: 'Core concepts',
				items: [
					{ label: 'Client types', slug: 'docs/mqtt-broker/pe/concepts/client-types' },
					{ label: 'Sessions', slug: 'docs/mqtt-broker/pe/concepts/sessions' },
					{ label: 'Topics and wildcards', slug: 'docs/mqtt-broker/pe/concepts/topics' },
					{ label: 'Delivery guarantees', slug: 'docs/mqtt-broker/pe/concepts/qos' },
					{ label: 'Security model', slug: 'docs/mqtt-broker/pe/concepts/security' },
					{ label: 'Clustering', slug: 'docs/mqtt-broker/pe/concepts/clustering' },
				],
			},
		],
	},
	{
		label: 'Guides',
		collapsed: true,
		items: tbmqGuideItems('docs/mqtt-broker/pe'),
	},
	{
		label: 'Installation',
		collapsed: true,
		items: tbmqInstallItems('docs/mqtt-broker/pe'),
	},
	{
		label: 'Reference',
		collapsed: true,
		items: tbmqReferenceItems('docs/mqtt-broker/pe'),
	},
	{
		label: 'Releases',
		items: [
			{ label: 'Release notes', slug: 'docs/mqtt-broker/pe/releases' },
			{ label: 'Roadmap', slug: 'docs/mqtt-broker/pe/roadmap' },
			{ label: 'Getting support', slug: 'docs/mqtt-broker/pe/help' },
		],
	},
];

/** Maps tab group label → URL to navigate when the tab is clicked (optional per-group). */
export type SidebarTabLinks = Partial<Record<string, string>>;
export const tbmqSidebarTabLinks: SidebarTabLinks = {
	'Getting Started': '/docs/mqtt-broker/',
	Guides: '/docs/mqtt-broker/user-guide/',
	Installation: '/docs/mqtt-broker/installation/',
	Reference: '/docs/mqtt-broker/reference/',
	Releases: '/docs/mqtt-broker/changelog/',
};
export const tbmqPeSidebarTabLinks: SidebarTabLinks = {
	'Getting Started': '/docs/mqtt-broker/pe/',
	Guides: '/docs/mqtt-broker/pe/user-guide/',
	Installation: '/docs/mqtt-broker/pe/installation/',
	Reference: '/docs/mqtt-broker/pe/reference/',
	Releases: '/docs/mqtt-broker/pe/changelog/',
};

/**
 * Maps URL prefix → tab navigation links for that product's sidebar.
 * Order matters: more specific prefixes must come before less specific ones.
 */
export const sidebarTabLinksByPrefix: ReadonlyArray<[string, SidebarTabLinks]> = [
	['/docs/mqtt-broker/pe/', tbmqPeSidebarTabLinks],
	['/docs/mqtt-broker/', tbmqSidebarTabLinks],
];

/**
 * Combined sidebar configuration.
 * Route middleware in routeData.ts filters this to show only
 * the relevant version's sidebar items.
 */
export const sidebar: SidebarConfig = [...tbmqSidebar, ...tbmqPeSidebar];
