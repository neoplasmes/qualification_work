import { describe, expect, it } from 'vitest';

import { formatAxisNumber, formatChartCell } from './formatChartCell';

describe('formatChartCell', () => {
    it('formats dates by chart time granularity', () => {
        const value = '2026-05-25T00:00:00.000Z';

        expect(formatChartCell(value, { timeGranularity: 'day' })).toBe('25.05.2026');
        expect(formatChartCell(value, { timeGranularity: 'week' })).toBe('25.05.2026');
        expect(formatChartCell(value, { timeGranularity: 'month' })).toBe('05.2026');
        expect(formatChartCell(value, { timeGranularity: 'quarter' })).toBe('Q2 2026');
        expect(formatChartCell(value, { timeGranularity: 'year' })).toBe('2026');
        expect(formatChartCell(value, { timeGranularity: 'hour' })).toBe(
            '25.05.2026 00:00'
        );
    });

    it('formats values with measure presets', () => {
        expect(formatChartCell(1200, { valueFormat: 'rub' })).toBe('1 200 ₽');
        expect(formatChartCell(1200, { valueFormat: 'usd' })).toBe('$1 200');
        expect(formatChartCell(12.5, { valueFormat: 'percent' })).toBe('12.50%');
        expect(formatChartCell(1_000_000_000_000_000)).toBe('1 000 000 000 000 000');
    });
});

describe('formatAxisNumber', () => {
    it('keeps compact axis suffixes with measure presets', () => {
        expect(formatAxisNumber(1_500_000, 'rub')).toBe('1.5M ₽');
        expect(formatAxisNumber(75_000, 'usd')).toBe('$75K');
        expect(formatAxisNumber(42, 'percent')).toBe('42%');
    });
});
