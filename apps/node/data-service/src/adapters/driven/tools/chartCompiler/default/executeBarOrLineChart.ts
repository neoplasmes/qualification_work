import type { Pool } from 'pg';

import type {
    BarChartConfig,
    ChartResponse,
    ChartResultColumn,
    ChartResultRow,
    FilterClause,
    LineChartConfig,
} from '@qualification-work/types';

import type { ChartCompilationContext } from '@/core/ports/driven/repos';

import {
    buildOrderBy,
    buildWhere,
    coerce,
    columnExpr,
    getColumn,
    measureExpr,
    numberOrNull,
    type ColumnMeta,
} from './lib';

export async function executeBarOrLineChart(
    pool: Pool,
    ctx: ChartCompilationContext,
    config: BarChartConfig | LineChartConfig,
    columnsById: Map<string, ColumnMeta>,
    filters: FilterClause[],
    limit: number
): Promise<ChartResponse> {
    const params: unknown[] = [];
    const dim = columnExpr(
        getColumn(columnsById, config.dimension.columnId),
        config.dimension.grouping
    );
    const series = config.series
        ? columnExpr(getColumn(columnsById, config.series.columnId), null)
        : null;

    const whereSql = buildWhere(filters, columnsById, params, ctx.datasetId);

    const measureExprs = config.measures.map((m, i) =>
        measureExpr(m, columnsById, `m${i}`)
    );

    const groupCols = series ? [dim.sql, series.sql] : [dim.sql];
    const orderSql = buildOrderBy(config.orderBy, dim, series, measureExprs);

    const sql = `
        SELECT
            ${dim.sql} AS dim
            ${series ? `, ${series.sql} AS series` : ''}
            ${measureExprs.map(e => `, ${e.sql} AS ${e.alias}`).join('')}
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

    const columns: ChartResultColumn[] = [
        { name: 'dim', role: 'dim', type: dim.resultType },
        ...(series
            ? [{ name: 'series', role: 'series', type: series.resultType } as const]
            : []),
        ...measureExprs.map<ChartResultColumn>(e => ({
            name: e.alias,
            role: 'measure',
            type: 'number',
        })),
    ];

    const resultRows: ChartResultRow[] = trimmed.map(r => {
        const out: ChartResultRow = [coerce(r.dim, dim.resultType)];
        if (series) {
            out.push(coerce(r.series, series.resultType));
        }
        for (const e of measureExprs) {
            out.push(numberOrNull(r[e.alias]));
        }

        return out;
    });

    return {
        kind: config.kind,
        columns,
        rows: resultRows,
        truncated,
        aggregatedAt: new Date().toISOString(),
    };
}
