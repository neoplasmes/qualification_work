import { describe, expect, it } from 'vitest';

import { parseChartResult } from './parseChartData';

describe('parseChartResult', () => {
    it('preserves backend category order for labels and points', () => {
        const result = parseChartResult(
            {
                columns: [
                    { name: 'dim', role: 'dim', type: 'day_of_week' },
                    { name: 'm0', role: 'measure', type: 'number' },
                ],
                rows: [
                    ['Monday', 10],
                    ['Tuesday', 5],
                    ['Wednesday', 8],
                ],
            },
            'bar',
            10
        );

        expect(result.labels).toEqual(['Monday', 'Tuesday', 'Wednesday']);
        expect(result.points.map(point => point.label)).toEqual([
            'Monday',
            'Tuesday',
            'Wednesday',
        ]);
    });

    it('drops single-point series for line charts', () => {
        const result = parseChartResult(
            {
                columns: [
                    { name: 'date', role: 'dim' },
                    { name: 'who', role: 'series' },
                    { name: 'm0', role: 'measure' },
                ],
                rows: [
                    ['2026-01-01', 'Alice', 10],
                    ['2026-02-01', 'Alice', 12],
                    ['2026-01-01', 'Bob', 99],
                ],
            },
            'line',
            10
        );

        expect(result.series.map(s => s.name)).toEqual(['Alice']);
        expect(result.labels).toEqual(['2026-01-01', '2026-02-01']);
    });

    it('removes zero-value bars and drops empty series', () => {
        const result = parseChartResult(
            {
                columns: [
                    { name: 'dim', role: 'dim' },
                    { name: 'who', role: 'series' },
                    { name: 'm0', role: 'measure' },
                ],
                rows: [
                    ['A', 'Alice', 10],
                    ['B', 'Alice', 0],
                    ['A', 'Bob', 0],
                    ['B', 'Bob', 0],
                ],
            },
            'bar',
            10
        );

        expect(result.series.map(s => s.name)).toEqual(['Alice']);
        expect(result.series[0].points.map(p => p.value)).toEqual([10]);
        expect(result.labels).toEqual(['A']);
    });
});
