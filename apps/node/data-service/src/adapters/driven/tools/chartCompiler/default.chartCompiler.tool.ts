import type { Pool } from 'pg';

import type {
    AxisBin,
    BarChartConfig,
    ChartConfig,
    ChartResultColumn,
    ChartResultDTO,
    ChartResultRow,
    FilterClause,
    HeatmapChartConfig,
    LineChartConfig,
    Measure,
    PieChartConfig,
} from '@qualification-work/types';

import type { ChartCompilationContext } from '@/core/ports/driven/repos';
import type { ChartCompilerTool, CompileOverrides } from '@/core/ports/driven/tools';

const DEFAULT_LIMIT = 1000;

type ColumnMeta = ChartCompilationContext['columns'][number];

// Describes a column SQL expression: the full expression for SELECT/GROUP BY and its result type.
type ColumnExpr = {
    sql: string; // full expression for SELECT/GROUP BY
    resultType: 'number' | 'string' | 'date';
    columnKey: string;
};

/**
 * Default compiler: ChartConfig + dataset_rows JSONB -> single GROUP BY SQL query.
 * Not trying to be Vega/Cube - only what bar/line/pie/heatmap need.
 *
 * Security: column names come from dataset_columns (our controlled source),
 * never from user input. All user-supplied values go through parameterized $N placeholders.
 */
export class DefaultChartCompilerTool implements ChartCompilerTool {
    constructor(private readonly pool: Pool) {}

    async compileAndExecute(
        ctx: ChartCompilationContext,
        overrides?: CompileOverrides
    ): Promise<ChartResultDTO> {
        const config = ctx.chart.config;
        const columnsById = new Map(ctx.columns.map(c => [c.id, c]));

        const filters = mergeFilters(config.filters, overrides?.filterOverrides);
        const limit = config.limit ?? DEFAULT_LIMIT;

        switch (config.kind) {
            case 'bar':
            case 'line':
                return this.runBarOrLine(ctx, config, columnsById, filters, limit);
            case 'pie':
                return this.runPie(ctx, config, columnsById, filters, limit);
            case 'heatmap':
                return this.runHeatmap(ctx, config, columnsById, filters, limit);
        }
    }

    // ---------- bar / line ----------

    private async runBarOrLine(
        ctx: ChartCompilationContext,
        config: BarChartConfig | LineChartConfig,
        columnsById: Map<string, ColumnMeta>,
        filters: FilterClause[],
        limit: number
    ): Promise<ChartResultDTO> {
        const params: unknown[] = [];
        const dim = columnExpr(
            getColumn(columnsById, config.dimension.columnId),
            config.dimension.bin
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

        const { rows } = await this.pool.query<Record<string, unknown>>(sql, params);
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

    // ---------- pie ----------

    private async runPie(
        ctx: ChartCompilationContext,
        config: PieChartConfig,
        columnsById: Map<string, ColumnMeta>,
        filters: FilterClause[],
        limit: number
    ): Promise<ChartResultDTO> {
        const params: unknown[] = [];
        const slice = columnExpr(getColumn(columnsById, config.slice.columnId), null);
        const whereSql = buildWhere(filters, columnsById, params, ctx.datasetId);
        const m = measureExpr(config.measure, columnsById, 'm0');

        // top-N + other bucket: aggregate everything first, then rank and cap at topN.
        const topN = config.slice.topN ?? limit;
        const other = config.slice.otherBucket ?? false;

        const inner = `
            SELECT ${slice.sql} AS slice, ${m.sql} AS m0
            FROM data.dataset_rows
            WHERE ${whereSql}
            GROUP BY slice
        `;

        const sql = other
            ? `
                WITH base AS (${inner}),
                ranked AS (
                    SELECT slice, m0, ROW_NUMBER() OVER (ORDER BY m0 DESC NULLS LAST) AS rn FROM base
                )
                SELECT slice, m0 FROM ranked WHERE rn <= $${params.length + 1}
                UNION ALL
                SELECT '__other__'::text AS slice, COALESCE(SUM(m0), 0) AS m0
                FROM ranked WHERE rn > $${params.length + 1}
                ORDER BY m0 DESC NULLS LAST
            `
            : `${inner} ORDER BY m0 DESC NULLS LAST LIMIT $${params.length + 1}`;

        params.push(other ? topN : limit + 1);

        const { rows } = await this.pool.query<Record<string, unknown>>(sql, params);
        const truncated = !other && rows.length > limit;
        const trimmed = truncated ? rows.slice(0, limit) : rows;

        return {
            kind: 'pie',
            columns: [
                { name: 'slice', role: 'dim', type: slice.resultType },
                { name: 'm0', role: 'measure', type: 'number' },
            ],
            rows: trimmed.map(r => [
                coerce(r.slice, slice.resultType),
                numberOrNull(r.m0),
            ]),
            truncated,
            aggregatedAt: new Date().toISOString(),
        };
    }

    // ---------- heatmap ----------

    private async runHeatmap(
        ctx: ChartCompilationContext,
        config: HeatmapChartConfig,
        columnsById: Map<string, ColumnMeta>,
        filters: FilterClause[],
        limit: number
    ): Promise<ChartResultDTO> {
        const params: unknown[] = [];
        const x = columnExpr(getColumn(columnsById, config.x.columnId), config.x.bin);
        const y = columnExpr(getColumn(columnsById, config.y.columnId), config.y.bin);
        const whereSql = buildWhere(filters, columnsById, params, ctx.datasetId);
        const m = measureExpr(config.measure, columnsById, 'm0');

        const sql = `
            SELECT ${x.sql} AS x, ${y.sql} AS y, ${m.sql} AS m0
            FROM data.dataset_rows
            WHERE ${whereSql}
            GROUP BY x, y
            ORDER BY x, y
            LIMIT $${params.length + 1}
        `;
        params.push(limit + 1);

        const { rows } = await this.pool.query<Record<string, unknown>>(sql, params);
        const truncated = rows.length > limit;
        const trimmed = truncated ? rows.slice(0, limit) : rows;

        return {
            kind: 'heatmap',
            columns: [
                { name: 'x', role: 'dim', type: x.resultType },
                { name: 'y', role: 'dim', type: y.resultType },
                { name: 'm0', role: 'measure', type: 'number' },
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
}

// ---------- helpers ----------

function getColumn(columnsById: Map<string, ColumnMeta>, columnId: string): ColumnMeta {
    const col = columnsById.get(columnId);
    if (!col) {
        throw new Error(`Unknown columnId: ${columnId}`);
    }

    return col;
}

// Builds the SQL expression for a column value given its dataType and optional bin config.
function columnExpr(col: ColumnMeta, bin: AxisBin | undefined): ColumnExpr {
    const key = col.key;
    const safeKey = sqlString(key); // escape single quotes in key

    if (bin?.kind === 'time') {
        const sql = `date_trunc('${bin.granularity}', NULLIF(data->>${safeKey}, '')::timestamptz)`;

        return { sql, resultType: 'date', columnKey: key };
    }

    if (bin?.kind === 'numeric') {
        const step = Number(bin.step);
        if (!Number.isFinite(step) || step <= 0) {
            throw new Error(`Invalid bin step: ${bin.step}`);
        }
        const sql = `floor(NULLIF(data->>${safeKey}, '')::numeric / ${step}) * ${step}`;

        return { sql, resultType: 'number', columnKey: key };
    }

    switch (col.dataType) {
        case 'number':
            return {
                sql: `NULLIF(data->>${safeKey}, '')::numeric`,
                resultType: 'number',
                columnKey: key,
            };
        case 'date':
            return {
                sql: `NULLIF(data->>${safeKey}, '')::timestamptz`,
                resultType: 'date',
                columnKey: key,
            };
        case 'bool':
            return {
                sql: `NULLIF(data->>${safeKey}, '')::boolean::text`,
                resultType: 'string',
                columnKey: key,
            };
        case 'string':
        default:
            return { sql: `data->>${safeKey}`, resultType: 'string', columnKey: key };
    }
}

function measureExpr(
    m: Measure,
    columnsById: Map<string, ColumnMeta>,
    alias: string
): { sql: string; alias: string } {
    if (m.aggregate === 'count') {
        return { sql: `count(*)::numeric`, alias };
    }

    if (!m.columnId) {
        throw new Error(`Measure with aggregate=${m.aggregate} requires columnId`);
    }
    const col = getColumn(columnsById, m.columnId);
    const valueExpr = `NULLIF(data->>${sqlString(col.key)}, '')::numeric`;

    switch (m.aggregate) {
        case 'sum':
            return { sql: `sum(${valueExpr})`, alias };
        case 'avg':
            return { sql: `avg(${valueExpr})`, alias };
        case 'min':
            return { sql: `min(${valueExpr})`, alias };
        case 'max':
            return { sql: `max(${valueExpr})`, alias };
        case 'count_distinct':
            return { sql: `count(distinct ${valueExpr})::numeric`, alias };
    }
}

function buildWhere(
    filters: FilterClause[],
    columnsById: Map<string, ColumnMeta>,
    params: unknown[],
    datasetId: string
): string {
    const parts: string[] = [`dataset_id = $${pushParam(params, datasetId)}`];

    for (const f of filters) {
        const col = getColumn(columnsById, f.columnId);
        const valueExpr = castedValueExpr(col);

        switch (f.op) {
            case 'is_null':
                parts.push(`(data->>${sqlString(col.key)}) IS NULL`);

                break;
            case 'not_null':
                parts.push(`(data->>${sqlString(col.key)}) IS NOT NULL`);

                break;
            case 'in':
            case 'nin': {
                if (!Array.isArray(f.value) || f.value.length === 0) {
                    parts.push(f.op === 'in' ? 'FALSE' : 'TRUE');

                    break;
                }
                const placeholders = f.value
                    .map(v => `$${pushParam(params, v)}`)
                    .join(', ');
                parts.push(
                    f.op === 'in'
                        ? `${valueExpr} IN (${placeholders})`
                        : `${valueExpr} NOT IN (${placeholders})`
                );

                break;
            }
            case 'between': {
                if (!Array.isArray(f.value) || f.value.length !== 2) {
                    throw new Error(`'between' filter requires [min, max]`);
                }
                const a = pushParam(params, f.value[0]);
                const b = pushParam(params, f.value[1]);
                parts.push(`${valueExpr} BETWEEN $${a} AND $${b}`);

                break;
            }
            default: {
                const op = sqlOp(f.op);
                const i = pushParam(params, f.value);
                parts.push(`${valueExpr} ${op} $${i}`);
            }
        }
    }

    return parts.join(' AND ');
}

function castedValueExpr(col: ColumnMeta): string {
    const key = sqlString(col.key);
    switch (col.dataType) {
        case 'number':
            return `NULLIF(data->>${key}, '')::numeric`;
        case 'date':
            return `NULLIF(data->>${key}, '')::timestamptz`;
        case 'bool':
            return `NULLIF(data->>${key}, '')::boolean`;
        case 'string':
        default:
            return `data->>${key}`;
    }
}

function sqlOp(op: FilterClause['op']): string {
    switch (op) {
        case 'eq':
            return '=';
        case 'neq':
            return '<>';
        case 'gt':
            return '>';
        case 'gte':
            return '>=';
        case 'lt':
            return '<';
        case 'lte':
            return '<=';
        default:
            throw new Error(`Unsupported op for binary comparison: ${op}`);
    }
}

function buildOrderBy(
    orderBy: ChartConfig['orderBy'],
    dim: ColumnExpr,
    series: ColumnExpr | null,
    measures: Array<{ alias: string }>
): string {
    if (!orderBy) {
        return measures[0] ? `${measures[0].alias} DESC NULLS LAST` : 'dim';
    }

    const dir = orderBy.dir === 'asc' ? 'ASC' : 'DESC';

    if (orderBy.ref === 'measure') {
        const m = measures[orderBy.index ?? 0];
        if (!m) {
            throw new Error('orderBy.measure index out of range');
        }

        return `${m.alias} ${dir} NULLS LAST`;
    }

    // ref === 'dim'
    const target = orderBy.index === 1 && series ? 'series' : 'dim';

    return `${target} ${dir}`;
}

function pushParam(params: unknown[], value: unknown): number {
    params.push(value);

    return params.length;
}

// Escapes a string for use inside a SQL single-quoted literal (JSON key names).
// Safe only because the value always comes from dataset_columns.key - our controlled source.
function sqlString(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}

function mergeFilters(
    base: FilterClause[] | undefined,
    overrides: FilterClause[] | undefined
): FilterClause[] {
    if (!overrides || overrides.length === 0) {
        return base ?? [];
    }
    if (!base || base.length === 0) {
        return overrides;
    }
    // overrides win over base filters with the same columnId+op key
    const map = new Map<string, FilterClause>();
    for (const f of base) {
        map.set(`${f.columnId}:${f.op}`, f);
    }
    for (const f of overrides) {
        map.set(`${f.columnId}:${f.op}`, f);
    }

    return [...map.values()];
}

function coerce(
    value: unknown,
    type: 'number' | 'string' | 'date'
): string | number | null {
    if (value === null || value === undefined) {
        return null;
    }
    if (type === 'number') {
        return numberOrNull(value);
    }
    if (type === 'date') {
        if (value instanceof Date) {
            return value.toISOString();
        }

        return String(value);
    }

    return String(value);
}

function numberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) {
        return null;
    }
    const n = typeof value === 'number' ? value : Number(value);

    return Number.isFinite(n) ? n : null;
}
