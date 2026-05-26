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
});
