import type { AnalyticsChartEvent } from '@qualification-work/contracts';
import type { EventHandler } from '@qualification-work/microservice-utils/kafka';
import type { RedisCache } from '@qualification-work/microservice-utils/redis';

/**
 * keeps dashboards.chart_refs in sync with data-service charts
 *
 * @param cache
 * @returns
 */
export function createChartRefsHandler(
    cache: RedisCache
): EventHandler<AnalyticsChartEvent> {
    return async (client, event) => {
        if (event.type === 'ChartChanged') {
            await client.query(
                `INSERT INTO dashboards.chart_refs (id, org_id, dataset_id, name)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO UPDATE
                SET dataset_id = EXCLUDED.dataset_id, name = EXCLUDED.name`,
                [
                    event.aggregateId,
                    event.orgId,
                    event.payload.datasetId,
                    event.payload.name,
                ]
            );

            return;
        }

        const { rows } = await client.query<{ dashboard_id: string }>(
            `DELETE FROM dashboards.dashboard_items di
            USING dashboards.item_charts ic
            WHERE ic.item_id = di.id AND ic.chart_id = $1
            RETURNING di.dashboard_id`,
            [event.aggregateId]
        );
        await client.query(`DELETE FROM dashboards.chart_refs WHERE id = $1`, [
            event.aggregateId,
        ]);

        return () =>
            cache.invalidateTags([
                `org:${event.orgId}:dashboards`,
                ...rows.map(row => `dashboard:${row.dashboard_id}`),
            ]);
    };
}
