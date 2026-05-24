import { describe, expect, it } from 'vitest';

import { columnExpr } from './lib';

describe('columnExpr - Cyrillic column keys', () => {
    it('wraps Cyrillic key in single-quoted JSONB accessor', () => {
        const col = { id: 'c1', key: 'Город', dataType: 'string' as const, displayName: 'Город' };
        const result = columnExpr(col, undefined);

        expect(result.sql).toBe(`data->>'Город'`);
        expect(result.resultType).toBe('string');
        expect(result.columnKey).toBe('Город');
    });

    it('escapes single quotes in Cyrillic key', () => {
        const col = { id: 'c1', key: "О'брат", dataType: 'string' as const, displayName: "О'брат" };
        const result = columnExpr(col, undefined);

        expect(result.sql).toBe(`data->>'О''брат'`);
    });

    it('handles Cyrillic date column with time grouping', () => {
        const col = { id: 'c1', key: 'Дата', dataType: 'date' as const, displayName: 'Дата' };
        const result = columnExpr(col, { kind: 'time', granularity: 'month' });

        expect(result.sql).toContain(`'Дата'`);
        expect(result.sql).toContain('date_trunc');
        expect(result.resultType).toBe('date');
    });
});
