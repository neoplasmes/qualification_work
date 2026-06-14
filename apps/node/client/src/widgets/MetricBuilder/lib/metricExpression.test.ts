import { describe, expect, it } from 'vitest';

import type { DatasetColumn } from '@/entities/dataset';

import {
    buildMetricExpression,
    formatMetricColumnRef,
    parseMetricBuilderExpression,
} from './metricExpression';

const column = (key: string): DatasetColumn => ({
    id: key,
    datasetId: 'dataset-1',
    key,
    displayName: key,
    dataType: 'number',
    orderIndex: 0,
    isAnalyzable: true,
});

describe('metricExpression', () => {
    it('keeps simple column keys unquoted', () => {
        expect(buildMetricExpression('sum', column('amount'))).toBe('sum(amount)');
    });

    it('quotes column keys that are not simple identifiers', () => {
        expect(buildMetricExpression('sum', column('Визитов за месяц'))).toBe(
            'sum("Визитов за месяц")'
        );
    });

    it('escapes quoted column refs with JSON string escaping', () => {
        expect(formatMetricColumnRef('gross "amount"')).toBe('"gross \\"amount\\""');
    });

    it('parses a saved builder expression with a quoted column key', () => {
        expect(parseMetricBuilderExpression('avg("Средний чек")')).toEqual({
            aggregate: 'avg',
            columnKey: 'Средний чек',
        });
    });

    it('parses legacy builder expressions with raw unicode column keys', () => {
        expect(parseMetricBuilderExpression('sum(Скидка)')).toEqual({
            aggregate: 'sum',
            columnKey: 'Скидка',
        });
    });

    it('does not parse formulas as builder expressions', () => {
        expect(parseMetricBuilderExpression('sum(revenue) / sum(orders)')).toBeNull();
        expect(parseMetricBuilderExpression('sum(revenue + orders)')).toBeNull();
    });
});
