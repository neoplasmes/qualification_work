import type { Pool } from 'pg';

import type {
    ChartResponse,
    FilterClause,
    PieChartConfig,
} from '@qualification-work/types';

import type { ChartCompilationContext } from '@/core/ports/driven/repos';

import {
    buildSortGroupBy,
    buildSortOrderBy,
    buildSortSelects,
    buildWhere,
    coerce,
    columnExpr,
    getColumn,
    measureColumnKey,
    measureExpr,
    numberOrNull,
    type ColumnMeta,
} from './lib';

export async function executePieChart(
    pool: Pool,
    ctx: ChartCompilationContext,
    config: PieChartConfig,
    columnsById: Map<string, ColumnMeta>,
    filters: FilterClause[],
    limit: number
): Promise<ChartResponse> {
    const params: unknown[] = [];
    const slice = columnExpr(getColumn(columnsById, config.slice.columnId), null);
    const m = measureExpr(config.measure, columnsById, 'm0');
    const measureKey = measureColumnKey(config.measure, columnsById);
    const whereSql = buildWhere(filters, columnsById, params, ctx.datasetId, [
        slice.columnKey,
        ...(measureKey ? [measureKey] : []),
    ]);
    const sliceSortSelects = buildSortSelects(slice, 'slice');
    const sliceSortColumns = buildSortGroupBy('slice', slice);
    const sliceSortOrder = buildSortOrderBy([{ expr: slice, prefix: 'slice' }]);

    const topN = config.slice.topN ?? limit;
    const other = config.slice.otherBucket ?? false;

    const inner = `
            SELECT ${slice.sql} AS slice
                ${sliceSortSelects.map(select => `, ${select}`).join('')}
                , ${m.sql} AS m0
            FROM data.dataset_rows
            WHERE ${whereSql}
            GROUP BY slice, ${sliceSortColumns.join(', ')}
        `;

    const sql = other
        ? `
            WITH base AS (${inner}),
            ranked AS (
                SELECT
                    slice,
                    ${sliceSortColumns.join(', ')},
                    m0,
                    ROW_NUMBER() OVER (ORDER BY m0 DESC NULLS LAST) AS rn
                FROM base
            ),
            selected AS (
                SELECT slice, ${sliceSortColumns.join(', ')}, m0
                FROM ranked
                WHERE rn <= $${params.length + 1}
                UNION ALL
                SELECT
                    '__other__'::text AS slice,
                    ${sliceSortColumns.map(column => `NULL AS ${column}`).join(', ')},
                    COALESCE(SUM(m0), 0) AS m0
                FROM ranked
                WHERE rn > $${params.length + 1}
            )
            SELECT slice, m0 FROM selected
            ORDER BY ${sliceSortOrder}, m0 DESC NULLS LAST
            `
        : `
            WITH base AS (${inner}),
            ranked AS (
                SELECT
                    slice,
                    ${sliceSortColumns.join(', ')},
                    m0,
                    ROW_NUMBER() OVER (ORDER BY m0 DESC NULLS LAST) AS rn
                FROM base
            )
            SELECT slice, m0 FROM ranked
            WHERE rn <= $${params.length + 1}
            ORDER BY ${sliceSortOrder}, m0 DESC NULLS LAST
        `;

    params.push(other ? topN : limit + 1);

    const { rows } = await pool.query<Record<string, unknown>>(sql, params);
    const truncated = !other && rows.length > limit;
    const trimmed = truncated ? rows.slice(0, limit) : rows;

    return {
        kind: 'pie',
        columns: [
            {
                name: 'slice',
                role: 'dim',
                type: slice.resultType,
                timeGranularity: slice.timeGranularity,
            },
            {
                name: 'm0',
                role: 'measure',
                type: 'number',
                valueFormat: m.valueFormat,
            },
        ],
        rows: trimmed.map(r => [coerce(r.slice, slice.resultType), numberOrNull(r.m0)]),
        truncated,
        aggregatedAt: new Date().toISOString(),
    };
}
