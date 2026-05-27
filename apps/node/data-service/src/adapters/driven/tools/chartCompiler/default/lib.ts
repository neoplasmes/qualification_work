import type {
    AxisGrouping,
    ChartConfig,
    FilterClause,
    Measure,
    MeasureValueFormat,
    TimeGranularity,
} from '@qualification-work/types';

import type { ChartCompilationContext } from '@/core/ports/driven/repos';

export type ColumnMeta = ChartCompilationContext['columns'][number];

// Describes a column SQL expression: the full expression for SELECT/GROUP BY and its result type.
export type ColumnExpr = {
    sql: string; // full expression for SELECT/GROUP BY
    resultType: 'number' | 'string' | 'date' | 'day_of_week';
    columnKey: string;
    sortExpressions: string[];
    hasCategorySort: boolean;
    timeGranularity?: TimeGranularity;
};

// —————————————————————————————————— helpers ——————————————————————————————————————

/**
 * @param columnsById
 * @param columnId
 * @returns
 */
export function getColumn(
    columnsById: Map<string, ColumnMeta>,
    columnId: string
): ColumnMeta {
    const col = columnsById.get(columnId);
    if (!col) {
        throw new Error(`Unknown columnId: ${columnId}`);
    }

    return col;
}

// handles both ISO 8601 and DD.MM.YYYY date formats stored as plain strings
const dateColExpr = (k: string) =>
    `CASE WHEN NULLIF(data->>${k}, '') ~ '^\\d{1,2}\\.\\d{1,2}\\.\\d{4}'` +
    ` THEN to_timestamp(NULLIF(data->>${k}, ''), 'DD.MM.YYYY')` +
    ` ELSE NULLIF(data->>${k}, '')::timestamptz END`;

const dayOfWeekOrderExpr = (valueSql: string) => {
    const normalized = `regexp_replace(lower(btrim(${valueSql})), '\\.$', '')`;

    return (
        `CASE ${normalized}` +
        ` WHEN 'monday' THEN 1 WHEN 'mon' THEN 1` +
        ` WHEN 'понедельник' THEN 1 WHEN 'пн' THEN 1` +
        ` WHEN 'tuesday' THEN 2 WHEN 'tue' THEN 2 WHEN 'tues' THEN 2` +
        ` WHEN 'вторник' THEN 2 WHEN 'вт' THEN 2` +
        ` WHEN 'wednesday' THEN 3 WHEN 'wed' THEN 3` +
        ` WHEN 'среда' THEN 3 WHEN 'ср' THEN 3` +
        ` WHEN 'thursday' THEN 4 WHEN 'thu' THEN 4` +
        ` WHEN 'thur' THEN 4 WHEN 'thurs' THEN 4` +
        ` WHEN 'четверг' THEN 4 WHEN 'чт' THEN 4` +
        ` WHEN 'friday' THEN 5 WHEN 'fri' THEN 5` +
        ` WHEN 'пятница' THEN 5 WHEN 'пт' THEN 5` +
        ` WHEN 'saturday' THEN 6 WHEN 'sat' THEN 6` +
        ` WHEN 'суббота' THEN 6 WHEN 'сб' THEN 6` +
        ` WHEN 'sunday' THEN 7 WHEN 'sun' THEN 7` +
        ` WHEN 'воскресенье' THEN 7 WHEN 'вс' THEN 7` +
        ` ELSE NULL END`
    );
};

const categoricalSortExpressions = (valueSql: string) => [
    dayOfWeekOrderExpr(valueSql),
    `lower(btrim(${valueSql}))`,
];

const colTypeExprs: Record<
    string,
    { sql: (k: string) => string; resultType: ColumnExpr['resultType'] }
> = {
    number: { sql: k => `NULLIF(data->>${k}, '')::numeric`, resultType: 'number' },
    date: { sql: dateColExpr, resultType: 'date' },
    bool: { sql: k => `NULLIF(data->>${k}, '')::boolean::text`, resultType: 'string' },
    string: { sql: k => `data->>${k}`, resultType: 'string' },
    day_of_week: { sql: k => `data->>${k}`, resultType: 'day_of_week' },
};

const makeColumnExpr = ({
    sql,
    resultType,
    columnKey,
    timeGranularity,
}: {
    sql: string;
    resultType: ColumnExpr['resultType'];
    columnKey: string;
    timeGranularity?: TimeGranularity;
}): ColumnExpr => {
    const hasCategorySort = resultType === 'string' || resultType === 'day_of_week';

    return {
        sql,
        resultType,
        columnKey,
        sortExpressions: hasCategorySort ? categoricalSortExpressions(sql) : [sql],
        hasCategorySort,
        timeGranularity,
    };
};

/**
 *
 *
 * @param col
 * @param grouping
 * @returns
 */
export function columnExpr(
    col: ColumnMeta,
    grouping: AxisGrouping | undefined
): ColumnExpr {
    const key = col.key;
    // escape single quotes
    const safeKey = sqlString(key);

    if (grouping?.kind === 'time') {
        const sql = `date_trunc('${grouping.granularity}', ${dateColExpr(safeKey)})`;

        return makeColumnExpr({
            sql,
            resultType: 'date',
            columnKey: key,
            timeGranularity: grouping.granularity,
        });
    }

    if (grouping?.kind === 'numeric') {
        const step = Number(grouping.step);
        if (!Number.isFinite(step) || step <= 0) {
            throw new Error(`Invalid grouping step: ${grouping.step}`);
        }
        const sql = `floor(NULLIF(data->>${safeKey}, '')::numeric / ${step}) * ${step}`;

        return makeColumnExpr({ sql, resultType: 'number', columnKey: key });
    }

    const expr = colTypeExprs[col.dataType] ?? colTypeExprs.string;

    return makeColumnExpr({
        sql: expr.sql(safeKey),
        resultType: expr.resultType,
        columnKey: key,
    });
}

const aggFns: Record<string, (e: string) => string> = {
    sum: e => `sum(${e})`,
    avg: e => `avg(${e})`,
    min: e => `min(${e})`,
    max: e => `max(${e})`,
    count_distinct: e => `count(distinct ${e})::numeric`,
};

export function measureExpr(
    m: Measure,
    columnsById: Map<string, ColumnMeta>,
    alias: string
): { sql: string; alias: string; valueFormat?: MeasureValueFormat } {
    if (m.aggregate === 'count') {
        return { sql: `count(*)::numeric`, alias, valueFormat: m.valueFormat };
    }

    if (!m.columnId) {
        throw new Error(`Measure with aggregate=${m.aggregate} requires columnId`);
    }
    const col = getColumn(columnsById, m.columnId);
    // count_distinct works on any type - don't cast the column expression
    const valueExpr =
        m.aggregate === 'count_distinct'
            ? `NULLIF(data->>${sqlString(col.key)}, '')`
            : `NULLIF(data->>${sqlString(col.key)}, '')::numeric`;
    const fn = aggFns[m.aggregate];
    if (!fn) {
        throw new Error(`Unsupported aggregate: ${m.aggregate}`);
    }

    return { sql: fn(valueExpr), alias, valueFormat: m.valueFormat };
}

export function buildWhere(
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

const castedSql: Record<string, (k: string) => string> = {
    number: k => `NULLIF(data->>${k}, '')::numeric`,
    date: dateColExpr,
    bool: k => `NULLIF(data->>${k}, '')::boolean`,
    string: k => `data->>${k}`,
    day_of_week: k => `data->>${k}`,
};

function castedValueExpr(col: ColumnMeta): string {
    const key = sqlString(col.key);

    return (castedSql[col.dataType] ?? castedSql.string)(key);
}

const sqlOps: Partial<Record<FilterClause['op'], string>> = {
    eq: '=',
    neq: '<>',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
};

function sqlOp(op: FilterClause['op']): string {
    const result = sqlOps[op];
    if (!result) {
        throw new Error(`Unsupported op for binary comparison: ${op}`);
    }

    return result;
}

export function buildOrderBy(
    orderBy: ChartConfig['orderBy'],
    dim: ColumnExpr,
    series: ColumnExpr | null,
    measures: Array<{ alias: string }>
): string {
    if (dim.hasCategorySort || series?.hasCategorySort) {
        return buildSortOrderBy([
            { expr: dim, prefix: 'dim' },
            ...(series ? [{ expr: series, prefix: 'series' }] : []),
        ]);
    }

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

    const target = orderBy.index === 1 && series ? 'series' : 'dim';

    return `${target} ${dir}`;
}

export function buildDimensionOrderBy(
    dim: ColumnExpr,
    series: ColumnExpr | null
): string {
    return buildSortOrderBy([
        { expr: dim, prefix: 'dim' },
        ...(series ? [{ expr: series, prefix: 'series' }] : []),
    ]);
}

export function buildSortSelects(expr: ColumnExpr, prefix: string): string[] {
    return expr.sortExpressions.map((sql, index) => `${sql} AS ${prefix}_sort_${index}`);
}

export function buildSortGroupBy(prefix: string, expr: ColumnExpr): string[] {
    return expr.sortExpressions.map((_, index) => `${prefix}_sort_${index}`);
}

export function buildSortOrderBy(
    items: Array<{ expr: ColumnExpr; prefix: string }>
): string {
    return items
        .flatMap(({ expr, prefix }) =>
            expr.sortExpressions.map(
                (_, index) => `${prefix}_sort_${index} ASC NULLS LAST`
            )
        )
        .join(', ');
}

function pushParam(params: unknown[], value: unknown): number {
    params.push(value);

    return params.length;
}

function sqlString(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}

export function mergeFilters(
    base: FilterClause[] | undefined,
    overrides: FilterClause[] | undefined
): FilterClause[] {
    if (!overrides || overrides.length === 0) {
        return base ?? [];
    }
    if (!base || base.length === 0) {
        return overrides;
    }

    const map = new Map<string, FilterClause>();
    for (const f of base) {
        map.set(`${f.columnId}:${f.op}`, f);
    }

    for (const f of overrides) {
        map.set(`${f.columnId}:${f.op}`, f);
    }

    return [...map.values()];
}

export function coerce(
    value: unknown,
    type: 'number' | 'string' | 'date' | 'day_of_week'
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

export function numberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) {
        return null;
    }

    const n = typeof value === 'number' ? value : Number(value);

    return Number.isFinite(n) ? n : null;
}
