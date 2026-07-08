import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChartShell } from './ChartShell';

vi.mock('./ui/LineChart/LineChart', () => ({
    LineChart: ({ showLegend }: { showLegend?: boolean }) => (
        <div data-testid={showLegend ? 'line-chart-legend' : 'line-chart-no-legend'} />
    ),
}));

// two points per series; single-point series are filtered out from line charts
const lineRows = [
    ['2026-03-01T00:00:00.000Z', 'Alice', 12000],
    ['2026-04-01T00:00:00.000Z', 'Alice', 13000],
    ['2026-03-01T00:00:00.000Z', 'Bob', 14000],
    ['2026-04-01T00:00:00.000Z', 'Bob', 15000],
];

describe('ChartShell line legends', () => {
    it('shows the line legend only when a breakdown column is present', async () => {
        render(
            <ChartShell
                ariaLabel="Line breakdown"
                kind="line"
                showResultSummary={false}
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
            <ChartShell
                ariaLabel="Line plain"
                kind="line"
                showResultSummary={false}
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

    it('can suppress the line legend even with a breakdown column', async () => {
        render(
            <ChartShell
                ariaLabel="Line breakdown compact"
                kind="line"
                showResultSummary={false}
                showLegend={false}
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

        expect(await screen.findByTestId('line-chart-no-legend')).toBeVisible();
        expect(screen.queryByTestId('line-chart-legend')).not.toBeInTheDocument();
    });
});
