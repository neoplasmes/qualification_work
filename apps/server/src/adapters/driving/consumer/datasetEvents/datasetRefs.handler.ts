import type { DataDatasetEvent } from '@qualification-work/contracts';
import type { EventHandler } from '@qualification-work/microservice-utils/kafka';
import type { RedisCache } from '@qualification-work/microservice-utils/redis';

/**
 * keeps dashboards.dataset_refs in sync with data-service datasets
 * deletion cascades to metric items, so affected dashboards are invalidated
 *
 * @param cache
 * @returns
 */
export function createDatasetRefsHandler(
    cache: RedisCache
): EventHandler<DataDatasetEvent> {
    return async (client, event) => {
        if (event.type === 'DatasetChanged') {
            // older versions are ignored, redelivery after a newer event must not roll back
            await client.query(
                `INSERT INTO dashboards.dataset_refs (id, org_id, name, columns, data_version)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO UPDATE
                SET name = EXCLUDED.name, columns = EXCLUDED.columns,
                    data_version = EXCLUDED.data_version
                WHERE dashboards.dataset_refs.data_version <= EXCLUDED.data_version`,
                [
                    event.aggregateId,
                    event.orgId,
                    event.payload.name,
                    JSON.stringify(event.payload.columns),
                    event.payload.dataVersion,
                ]
            );

            return;
        }

        const { rows } = await client.query<{ dashboard_id: string }>(
            `SELECT DISTINCT di.dashboard_id
            FROM dashboards.item_metrics im
            JOIN dashboards.dashboard_items di ON di.id = im.item_id
            WHERE im.dataset_id = $1`,
            [event.aggregateId]
        );
        // item_metrics cascade only removes the link, the grid item itself must go too
        await client.query(
            `DELETE FROM dashboards.dashboard_items di
            USING dashboards.item_metrics im
            WHERE im.item_id = di.id AND im.dataset_id = $1`,
            [event.aggregateId]
        );
        await client.query(`DELETE FROM dashboards.dataset_refs WHERE id = $1`, [
            event.aggregateId,
        ]);

        return () =>
            cache.invalidateTags([
                `org:${event.orgId}:dashboards`,
                ...rows.map(row => `dashboard:${row.dashboard_id}`),
            ]);
    };
}
