import type { IdentityOrgEvent } from '@qualification-work/contracts';
import type { EventHandler } from '@qualification-work/microservice-utils/kafka';
import type { RedisCache } from '@qualification-work/microservice-utils/redis';

/**
 * removes dashboards and read models of a deleted org
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

        const { rows } = await client.query<{ id: string }>(
            `DELETE FROM dashboards.dashboards WHERE org_id = $1 RETURNING id`,
            [event.orgId]
        );
        await client.query(`DELETE FROM dashboards.chart_refs WHERE org_id = $1`, [
            event.orgId,
        ]);
        await client.query(`DELETE FROM dashboards.dataset_refs WHERE org_id = $1`, [
            event.orgId,
        ]);

        return () =>
            cache.invalidateTags([
                `org:${event.orgId}:dashboards`,
                ...rows.map(row => `dashboard:${row.id}`),
            ]);
    };
}
