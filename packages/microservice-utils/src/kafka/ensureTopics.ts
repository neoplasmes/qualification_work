import { Admin } from '@platformatic/kafka';

import type { TopicSpec } from '@qualification-work/contracts';

/**
 * creates missing topics, existing ones are left untouched
 *
 * @param brokers
 * @param specs
 * @param replicas
 * @returns
 */
export async function ensureTopics(
    brokers: string[],
    specs: TopicSpec[],
    replicas: number
): Promise<void> {
    const admin = new Admin({ clientId: 'topics-bootstrap', bootstrapBrokers: brokers });

    try {
        const existing = new Set(await admin.listTopics());

        for (const spec of specs) {
            if (existing.has(spec.name)) {
                continue;
            }

            await admin.createTopics({
                topics: [spec.name],
                partitions: spec.partitions,
                replicas,
                configs: [{ name: 'cleanup.policy', value: spec.cleanupPolicy }],
            });
        }
    } finally {
        await admin.close();
    }
}
