import type { IdentityOrgEvent } from '@qualification-work/contracts';
import type { EventHandler } from '@qualification-work/microservice-utils/kafka';
import type { RedisCache } from '@qualification-work/microservice-utils/redis';

/**
 * removes everything data-service keeps for a deleted org
 * outbox triggers turn the cascade into DatasetDeleted and ChartDeleted for server
 *
 * @param cache
 * @returns
 */
export function createOrgCleanupHandler(
    cache: RedisCache
): EventHandler<IdentityOrgEvent> {
    return async (client, event) => {
        if (event.type !== 'OrgDeleted') {
            return;
        }

        const { rows: datasets } = await client.query<{ id: string }>(
            `DELETE FROM data.datasets WHERE org_id = $1 RETURNING id`,
            [event.orgId]
        );
        const { rows: charts } = await client.query<{ id: string }>(
            `DELETE FROM charts.charts WHERE org_id = $1 RETURNING id`,
            [event.orgId]
        );
        const { rows: actions } = await client.query<{ id: string }>(
            `DELETE FROM actions.actions WHERE org_id = $1 RETURNING id`,
            [event.orgId]
        );
        await client.query(`DELETE FROM actions.action_runs WHERE org_id = $1`, [
            event.orgId,
        ]);

        return () =>
            cache.invalidateTags([
                `org:${event.orgId}:datasets`,
                `org:${event.orgId}:charts`,
                `org:${event.orgId}:actions`,
                ...datasets.map(row => `dataset:${row.id}`),
                ...charts.map(row => `chart:${row.id}`),
                ...actions.map(row => `action:${row.id}`),
            ]);
    };
}
