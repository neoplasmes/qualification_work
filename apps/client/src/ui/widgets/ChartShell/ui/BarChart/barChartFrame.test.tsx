import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BarChart } from './BarChart';

vi.mock('../../lib/useRafChartSize', () => ({
    useRafChartSize: () => ({ ref: { current: null }, width: 320, height: 20 }),
}));

const series = {
    name: 'Value',
    points: [
        { label: 'A', value: 15 },
        { label: 'B', value: 35 },
    ],
};

describe('bar chart measured frame', () => {
    it.each([1, 2])('waits for a valid plotting area with %i series', async count => {
        const data = count === 1 ? [series] : [series, { ...series, name: 'Second' }];
        const { container, rerender } = render(
            <BarChart series={data} labels={['A', 'B']} height="fill" />
        );
        expect(container.querySelector('svg')).toBeNull();

        rerender(<BarChart series={data} labels={['A', 'B']} height={120} />);
        await waitFor(() =>
            expect(container.querySelectorAll('.visx-bar')).toHaveLength(count * 2)
        );
        const maximumLabel = [...container.querySelectorAll('text')].find(
            label => label.textContent === '35'
        );
        expect(maximumLabel).toBeDefined();
        expect(Number(maximumLabel!.getAttribute('y'))).toBeGreaterThanOrEqual(14);
        for (const rect of container.querySelectorAll('rect')) {
            expect(Number(rect.getAttribute('height'))).toBeGreaterThanOrEqual(0);
        }
    });
});
