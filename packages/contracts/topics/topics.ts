export type TopicSpec = {
    name: string;
    partitions: number;
    cleanupPolicy: 'compact' | 'delete';
};

export const topics = {
    identityOrg: { name: 'identity.org.v1', partitions: 3, cleanupPolicy: 'compact' },
    dataDataset: { name: 'data.dataset.v1', partitions: 6, cleanupPolicy: 'compact' },
    analyticsChart: {
        name: 'analytics.chart.v1',
        partitions: 6,
        cleanupPolicy: 'compact',
    },
} as const satisfies Record<string, TopicSpec>;

export const consumerGroups = {
    dataServiceOrgCleanup: 'data-service.org-cleanup',
    serverOrgCleanup: 'server.org-cleanup',
    serverDatasetRefs: 'server.dataset-refs',
    serverChartRefs: 'server.chart-refs',
} as const;

/**
 * dead letter topic for messages a consumer group failed to process
 *
 * @param topic
 * @returns
 */
export const dlqTopic = (topic: string): TopicSpec => ({
    name: `${topic}.dlq`,
    partitions: 1,
    cleanupPolicy: 'delete',
});
