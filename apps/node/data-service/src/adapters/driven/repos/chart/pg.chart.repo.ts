import type { Pool } from 'pg';

import type { ChartConfig, ChartType } from '@qualification-work/types';

import type { Chart } from '@/core/domain';
import type {
    ChartCompilationContext,
    ChartRepo,
    CreateChartPayload,
    UpdateChartPayload,
} from '@/core/ports/driven/repos';

type ChartRow = {
    id: string;
    orgId: string;
    datasetId: string;
    name: string;
    chartType: ChartType;
    config: ChartConfig;
    createdAt: Date;
    updatedAt: Date;
};

const SELECT_CHART = `
    SELECT
        id,
        org_id      AS "orgId",
        dataset_id  AS "datasetId",
        name,
        chart_type  AS "chartType",
        config,
        created_at  AS "createdAt",
        updated_at  AS "updatedAt"
    FROM charts.charts
`;

export class PgChartRepo implements ChartRepo {
    constructor(private readonly pool: Pool) {}

    async create(data: CreateChartPayload): Promise<{ id: string }> {
        const [row] = await this.pool
            .query<{ id: string }>(
                `INSERT INTO charts.charts (org_id, dataset_id, name, chart_type, config)
                 VALUES ($1, $2, $3, $4, $5::jsonb)
                 RETURNING id`,
                [
                    data.orgId,
                    data.datasetId,
                    data.name,
                    data.chartType,
                    JSON.stringify(data.config),
                ]
            )
            .then(r => r.rows);

        return { id: row.id };
    }

    async update(chartId: string, data: UpdateChartPayload): Promise<void> {
        // Build SET clause dynamically to include only the provided fields
        const sets: string[] = [];
        const params: unknown[] = [];
        let i = 1;

        if (data.name !== undefined) {
            sets.push(`name = $${i++}`);
            params.push(data.name);
        }
        if (data.chartType !== undefined) {
            sets.push(`chart_type = $${i++}`);
            params.push(data.chartType);
        }
        if (data.config !== undefined) {
            sets.push(`config = $${i++}::jsonb`);
            params.push(JSON.stringify(data.config));
        }

        if (sets.length === 0) {
            return;
        }

        params.push(chartId);
        await this.pool.query(
            `UPDATE charts.charts SET ${sets.join(', ')} WHERE id = $${i}`,
            params
        );
    }

    async getById(chartId: string): Promise<Chart | null> {
        const [row] = await this.pool
            .query<ChartRow>(`${SELECT_CHART} WHERE id = $1`, [chartId])
            .then(r => r.rows);

        return row ?? null;
    }

    async getByOrgId(orgId: string): Promise<Chart[]> {
        const { rows } = await this.pool.query<ChartRow>(
            `${SELECT_CHART} WHERE org_id = $1 ORDER BY created_at DESC, name ASC`,
            [orgId]
        );

        return rows;
    }

    async delete(chartId: string): Promise<void> {
        await this.pool.query(`DELETE FROM charts.charts WHERE id = $1`, [chartId]);
    }

    async getCompilationContext(
        chartId: string
    ): Promise<ChartCompilationContext | null> {
        const [chart] = await this.pool
            .query<ChartRow>(`${SELECT_CHART} WHERE id = $1`, [chartId])
            .then(r => r.rows);

        if (!chart) {
            return null;
        }

        const [versionRow] = await this.pool
            .query<{ dataVersion: string }>(
                `SELECT data_version::text AS "dataVersion"
                 FROM data.datasets WHERE id = $1`,
                [chart.datasetId]
            )
            .then(r => r.rows);

        if (!versionRow) {
            return null;
        }

        const { rows: columns } = await this.pool.query<{
            id: string;
            key: string;
            dataType: 'number' | 'string' | 'date' | 'bool';
        }>(
            `SELECT id, key, data_type AS "dataType"
             FROM data.dataset_columns
             WHERE dataset_id = $1
             ORDER BY order_index`,
            [chart.datasetId]
        );

        return {
            chart,
            datasetId: chart.datasetId,
            dataVersion: Number(versionRow.dataVersion),
            columns,
        };
    }
}
