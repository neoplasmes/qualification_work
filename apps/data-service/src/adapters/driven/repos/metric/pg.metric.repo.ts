import type { Pool } from 'pg';

import type {
    MetricAggTerm,
    MetricExpressionTool,
    MetricTermKey,
} from '@qualification-work/microservice-utils/metricExpression';
import type { MetricTimeBucket } from '@qualification-work/types';

import type {
    MetricColumnMeta,
    MetricDataset,
    MetricRepo,
    MetricTrendBucket,
} from '@/core/ports/driven/repos';

// whitelist guarding the inlined date_trunc unit
const timeBucketUnits: Record<MetricTimeBucket, string> = {
    day: 'day',
    week: 'week',
    month: 'month',
};
// mirrors chart date grouping: stored date strings may be ISO or DD.MM.YYYY
const buildDateValueExpression = (valueSql: string) =>
    `CASE` +
    ` WHEN ${valueSql} ~ '^\\d{1,2}\\.\\d{1,2}\\.\\d{4}$'` +
    ` THEN to_timestamp(${valueSql}, 'DD.MM.YYYY')` +
    ` WHEN ${valueSql} ~ '^\\d{4}-\\d{2}-\\d{2}'` +
    ` THEN ${valueSql}::timestamptz` +
    ` ELSE NULL END`;

type TermRow = Record<string, string | number | null>;

export class PgMetricRepo implements MetricRepo {
    constructor(
        private readonly pool: Pool,
        private readonly expressionTool: MetricExpressionTool
    ) {}

    async findDatasets(datasetIds: string[]): Promise<Map<string, MetricDataset>> {
        const datasets = new Map<string, MetricDataset>();
        if (datasetIds.length === 0) {
            return datasets;
        }

        const { rows } = await this.pool.query<{
            id: string;
            org_id: string;
            key: string | null;
            data_type: string | null;
            is_analyzable: boolean | null;
        }>(
            `SELECT d.id, d.org_id, c.key, c.data_type, c.is_analyzable
            FROM data.datasets d
            LEFT JOIN data.dataset_columns c ON c.dataset_id = d.id
            WHERE d.id = ANY($1::uuid[])
            ORDER BY d.id, c.order_index`,
            [datasetIds]
        );

        for (const row of rows) {
            let dataset = datasets.get(row.id);
            if (!dataset) {
                dataset = {
                    id: row.id,
                    orgId: row.org_id,
                    columns: new Map<string, MetricColumnMeta>(),
                    firstDateColumn: null,
                };
                datasets.set(row.id, dataset);
            }

            if (row.key === null) {
                continue;
            }

            dataset.columns.set(row.key, {
                dataType: row.data_type!,
                isAnalyzable: row.is_analyzable!,
            });
            if (dataset.firstDateColumn === null && row.data_type === 'date') {
                dataset.firstDateColumn = row.key;
            }
        }

        return datasets;
    }

    async computeScalars(
        datasetId: string,
        terms: MetricAggTerm[]
    ): Promise<Map<MetricTermKey, number | null>> {
        const values = new Map<MetricTermKey, number | null>();
        if (terms.length === 0) {
            return values;
        }

        const built = this.buildAggregateSelect(terms, 2);

        try {
            const { rows } = await this.pool.query<TermRow>(
                `SELECT ${built.selects.join(', ')}
                FROM data.dataset_rows
                WHERE dataset_id = $1`,
                [datasetId, ...built.params]
            );
            this.readTermValues(rows[0], built.aliasByKey, values);
        } catch {
            // a malformed value fails the whole scan, empty values turn into null metrics
        }

        return values;
    }

    async computeTrend(
        datasetId: string,
        timeColumn: string,
        bucket: MetricTimeBucket,
        terms: MetricAggTerm[]
    ): Promise<MetricTrendBucket[] | null> {
        const built = this.buildAggregateSelect(terms, 3);
        const dateValueExpr = `NULLIF(btrim(data->>$2), '')`;

        try {
            const { rows } = await this.pool.query<{ bucket: Date | null } & TermRow>(
                `SELECT
                    date_trunc('${timeBucketUnits[bucket]}', ${buildDateValueExpression(dateValueExpr)}) AS bucket,
                    ${built.selects.join(', ')}
                FROM data.dataset_rows
                WHERE dataset_id = $1 AND ${dateValueExpr} IS NOT NULL
                GROUP BY bucket
                ORDER BY bucket`,
                [datasetId, timeColumn, ...built.params]
            );

            const buckets: MetricTrendBucket[] = [];
            for (const row of rows) {
                if (row.bucket === null) {
                    continue;
                }

                const values = new Map<MetricTermKey, number | null>();
                this.readTermValues(row, built.aliasByKey, values);
                buckets.push({ bucket: row.bucket.toISOString(), values });
            }

            return buckets;
        } catch {
            // bad date values must not break the dashboard read
            return null;
        }
    }

    private buildAggregateSelect(
        terms: MetricAggTerm[],
        firstParamIndex: number
    ): {
        selects: string[];
        params: string[];
        aliasByKey: Map<MetricTermKey, string>;
    } {
        const selects: string[] = [];
        const params: string[] = [];
        const aliasByKey = new Map<MetricTermKey, string>();
        let paramIndex = firstParamIndex;

        terms.forEach((term, index) => {
            const alias = `t${index}`;
            aliasByKey.set(this.expressionTool.termKey(term), alias);

            if (term.column === null) {
                selects.push(`count(*)::numeric AS ${alias}`);

                return;
            }

            const valueExpr = `NULLIF(data->>$${paramIndex}, '')`;
            params.push(term.column);
            paramIndex += 1;

            if (term.aggregate === 'count') {
                selects.push(`count(${valueExpr})::numeric AS ${alias}`);
            } else if (term.aggregate === 'count_distinct') {
                selects.push(`count(distinct ${valueExpr})::numeric AS ${alias}`);
            } else {
                selects.push(`${term.aggregate}(${valueExpr}::numeric) AS ${alias}`);
            }
        });

        return { selects, params, aliasByKey };
    }

    private readTermValues(
        row: TermRow | undefined,
        aliasByKey: Map<MetricTermKey, string>,
        out: Map<MetricTermKey, number | null>
    ): void {
        if (!row) {
            return;
        }

        for (const [key, alias] of aliasByKey) {
            const raw = row[alias];
            out.set(key, raw === null || raw === undefined ? null : Number(raw));
        }
    }
}
