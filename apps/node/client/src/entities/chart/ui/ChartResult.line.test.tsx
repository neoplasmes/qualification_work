import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChartResult } from './ChartResult';

vi.mock('./LineChart', () => ({
    LineChart: ({ showLegend }: { showLegend?: boolean }) => (
        <div data-testid={showLegend ? 'line-chart-legend' : 'line-chart-no-legend'} />
    ),
}));

const lineRows = [
    ['2026-03-01T00:00:00.000Z', 'Alice', 12000],
    ['2026-04-01T00:00:00.000Z', 'Bob', 14000],
];

describe('ChartResult line legends', () => {
    it('shows the line legend only when a breakdown column is present', async () => {
        render(
            <ChartResult
                ariaLabel="Line breakdown"
                kind="line"
                hideTable
                data={{
                    columns: [
                        { name: 'date', role: 'dim', timeGranularity: 'month' },
                        { name: 'manager', role: 'series' },
                        { name: 'm0', role: 'measure', valueFormat: 'rub' },
                    ],
                    rows: lineRows,
                    truncated: false,
                }}
            />
        );

        expect(await screen.findByTestId('line-chart-legend')).toBeVisible();
    });

    it('does not show the line legend without breakdown', async () => {
        render(
            <ChartResult
                ariaLabel="Line plain"
                kind="line"
                hideTable
                data={{
                    columns: [
                        { name: 'date', role: 'dim', timeGranularity: 'month' },
                        { name: 'm0', role: 'measure', valueFormat: 'rub' },
                    ],
                    rows: lineRows.map(([date, , value]) => [date, value]),
                    truncated: false,
                }}
            />
        );

        expect(await screen.findByTestId('line-chart-no-legend')).toBeVisible();
        expect(screen.queryByTestId('line-chart-legend')).not.toBeInTheDocument();
    });
});
