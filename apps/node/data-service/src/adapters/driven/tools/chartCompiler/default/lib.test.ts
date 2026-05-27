import { describe, expect, it } from 'vitest';

import {
    buildDimensionOrderBy,
    buildOrderBy,
    buildSortOrderBy,
    buildSortSelects,
    columnExpr,
} from './lib';

describe('columnExpr - Cyrillic column keys', () => {
    it('wraps Cyrillic key in single-quoted JSONB accessor', () => {
        const col = {
            id: 'c1',
            key: 'Город',
            dataType: 'string' as const,
            displayName: 'Город',
        };
        const result = columnExpr(col, undefined);

        expect(result.sql).toBe(`data->>'Город'`);
        expect(result.resultType).toBe('string');
        expect(result.columnKey).toBe('Город');
    });

    it('escapes single quotes in Cyrillic key', () => {
        const col = {
            id: 'c1',
            key: "О'брат",
            dataType: 'string' as const,
            displayName: "О'брат",
        };
        const result = columnExpr(col, undefined);

        expect(result.sql).toBe(`data->>'О''брат'`);
    });

    it('handles Cyrillic date column with time grouping', () => {
        const col = {
            id: 'c1',
            key: 'Дата',
            dataType: 'date' as const,
            displayName: 'Дата',
        };
        const result = columnExpr(col, { kind: 'time', granularity: 'month' });

        expect(result.sql).toContain(`'Дата'`);
        expect(result.sql).toContain('date_trunc');
        expect(result.resultType).toBe('date');
    });

    it('builds weekday sort expressions for day_of_week columns', () => {
        const col = { id: 'c1', key: 'День', dataType: 'day_of_week' as const };
        const result = columnExpr(col, undefined);

        expect(result.resultType).toBe('day_of_week');
        expect(result.hasCategorySort).toBe(true);
        expect(result.sortExpressions[0]).toContain(`WHEN 'monday' THEN 1`);
        expect(result.sortExpressions[0]).toContain(`WHEN 'пн' THEN 1`);
    });

    it('uses category order before measure order for string dimensions', () => {
        const dim = columnExpr(
            { id: 'c1', key: 'weekday', dataType: 'string' as const },
            undefined
        );
        const result = buildOrderBy(
            { ref: 'measure', index: 0, dir: 'desc' },
            dim,
            null,
            [{ alias: 'm0' }]
        );

        expect(result).toBe('dim_sort_0 ASC NULLS LAST, dim_sort_1 ASC NULLS LAST');
    });

    it('builds stable sort selects and order clauses', () => {
        const dim = columnExpr(
            { id: 'c1', key: 'city', dataType: 'string' as const },
            undefined
        );

        expect(buildSortSelects(dim, 'dim')).toHaveLength(2);
        expect(buildSortOrderBy([{ expr: dim, prefix: 'dim' }])).toBe(
            'dim_sort_0 ASC NULLS LAST, dim_sort_1 ASC NULLS LAST'
        );
    });

    it('builds dimension order for date dimensions', () => {
        const dim = columnExpr(
            { id: 'c1', key: 'date', dataType: 'date' as const },
            undefined
        );

        expect(buildDimensionOrderBy(dim, null)).toBe('dim_sort_0 ASC NULLS LAST');
    });
});
