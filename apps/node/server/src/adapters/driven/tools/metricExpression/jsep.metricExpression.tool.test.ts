import { describe, expect, it } from 'vitest';

import { ValidationError } from '@qualification-work/microservice-utils';

import type { MetricTermKey } from '@/core/ports/driven/tools';

import { JsepMetricExpressionTool } from './jsep.metricExpression.tool';

const tool = new JsepMetricExpressionTool();

const values = (entries: Record<string, number | null>) =>
    new Map<MetricTermKey, number | null>(Object.entries(entries));

describe('JsepMetricExpressionTool', () => {
    it('parses a single aggregate', () => {
        expect(tool.parse('sum(amount)')).toEqual({
            kind: 'agg',
            aggregate: 'sum',
            column: 'amount',
        });
    });

    it('parses a quoted aggregate column name', () => {
        expect(tool.parse('sum("Визитов за месяц")')).toEqual({
            kind: 'agg',
            aggregate: 'sum',
            column: 'Визитов за месяц',
        });
    });

    it('parses count(*) as count over all rows', () => {
        expect(tool.parse('count(*)')).toEqual({
            kind: 'agg',
            aggregate: 'count',
            column: null,
        });
    });

    it('parses a binary ratio', () => {
        const ast = tool.parse('sum(revenue) / sum(orders)');
        expect(ast).toEqual({
            kind: 'binary',
            op: '/',
            left: { kind: 'agg', aggregate: 'sum', column: 'revenue' },
            right: { kind: 'agg', aggregate: 'sum', column: 'orders' },
        });
    });

    it('rejects unknown functions', () => {
        expect(() => tool.parse('median(x)')).toThrow(ValidationError);
    });

    it('rejects non-column aggregate arguments', () => {
        expect(() => tool.parse('sum(a + b)')).toThrow(ValidationError);
    });

    it('rejects unsupported operators', () => {
        expect(() => tool.parse('sum(a) % sum(b)')).toThrow(ValidationError);
    });

    it('collects deduplicated terms', () => {
        const ast = tool.parse('sum(a) / sum(a) + count(*)');
        expect(tool.collectTerms(ast)).toEqual([
            { aggregate: 'sum', column: 'a' },
            { aggregate: 'count', column: null },
        ]);
    });

    it('evaluates arithmetic over term values', () => {
        const ast = tool.parse('sum(revenue) / sum(orders)');
        const result = tool.evaluate(
            ast,
            values({ 'sum:revenue': 100, 'sum:orders': 4 })
        );
        expect(result).toBe(25);
    });

    it('returns null on division by zero', () => {
        const ast = tool.parse('sum(a) / sum(b)');
        expect(tool.evaluate(ast, values({ 'sum:a': 10, 'sum:b': 0 }))).toBeNull();
    });

    it('returns null when an operand is null', () => {
        const ast = tool.parse('sum(a) + sum(b)');
        expect(tool.evaluate(ast, values({ 'sum:a': 10, 'sum:b': null }))).toBeNull();
    });
});
