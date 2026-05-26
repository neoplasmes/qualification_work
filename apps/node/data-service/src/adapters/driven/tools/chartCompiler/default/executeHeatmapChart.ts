import type { Pool } from 'pg';

import type {
    ChartResponse,
    FilterClause,
    HeatmapChartConfig,
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
    measureExpr,
    numberOrNull,
    type ColumnMeta,
} from './lib';

export async function executeHeatmapChart(
    pool: Pool,
    ctx: ChartCompilationContext,
    config: HeatmapChartConfig,
    columnsById: Map<string, ColumnMeta>,
    filters: FilterClause[],
    limit: number
): Promise<ChartResponse> {
    const params: unknown[] = [];
    const x = columnExpr(getColumn(columnsById, config.x.columnId), config.x.grouping);
    const y = columnExpr(getColumn(columnsById, config.y.columnId), config.y.grouping);
    const whereSql = buildWhere(filters, columnsById, params, ctx.datasetId);
    const m = measureExpr(config.measure, columnsById, 'm0');
    const xSortSelects = buildSortSelects(x, 'x');
    const ySortSelects = buildSortSelects(y, 'y');
    const groupCols = [
        'x',
        ...buildSortGroupBy('x', x),
        'y',
        ...buildSortGroupBy('y', y),
    ];
    const orderSql = buildSortOrderBy([
        { expr: x, prefix: 'x' },
        { expr: y, prefix: 'y' },
    ]);

    const sql = `
        SELECT ${x.sql} AS x
            ${xSortSelects.map(select => `, ${select}`).join('')}
            , ${y.sql} AS y
            ${ySortSelects.map(select => `, ${select}`).join('')}
            , ${m.sql} AS m0
        FROM data.dataset_rows
        WHERE ${whereSql}
        GROUP BY ${groupCols.join(', ')}
        ORDER BY ${orderSql}
        LIMIT $${params.length + 1}
        `;
    params.push(limit + 1);

    const { rows } = await pool.query<Record<string, unknown>>(sql, params);
    const truncated = rows.length > limit;
    const trimmed = truncated ? rows.slice(0, limit) : rows;

    return {
        kind: 'heatmap',
        columns: [
            {
                name: 'x',
                role: 'dim',
                type: x.resultType,
                timeGranularity: x.timeGranularity,
            },
            {
                name: 'y',
                role: 'dim',
                type: y.resultType,
                timeGranularity: y.timeGranularity,
            },
            {
                name: 'm0',
                role: 'measure',
                type: 'number',
                valueFormat: m.valueFormat,
            },
        ],
        rows: trimmed.map(r => [
            coerce(r.x, x.resultType),
            coerce(r.y, y.resultType),
            numberOrNull(r.m0),
        ]),
        truncated,
        aggregatedAt: new Date().toISOString(),
    };
}
