import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChartResult } from './ChartResult';

describe('ChartResult', () => {
    it('renders heatmap data as chart and table', async () => {
        render(
            <ChartResult
                ariaLabel="Heatmap result"
                kind="heatmap"
                data={{
                    columns: [
                        { name: 'city', role: 'dim' },
                        { name: 'segment', role: 'dim' },
                        { name: 'score', role: 'measure' },
                    ],
                    rows: [
                        ['Paris', 'Enterprise', 42],
                        ['Berlin', 'SMB', 18],
                    ],
                    truncated: false,
                }}
            />
        );

        expect(screen.getByLabelText('Heatmap result')).toBeVisible();
        expect(await screen.findByTestId('heatmap-chart-svg')).toBeVisible();
        expect(screen.getByRole('cell', { name: 'Paris' })).toBeVisible();
        expect(screen.getByRole('cell', { name: 'Enterprise' })).toBeVisible();
        expect(screen.getByText('2 result rows')).toBeVisible();
    });

    it('shows a friendly empty state when chart rows are not plottable', () => {
        render(
            <ChartResult
                ariaLabel="Empty result"
                kind="bar"
                data={{
                    columns: [
                        { name: 'dim', role: 'dim' },
                        { name: 'm0', role: 'measure' },
                    ],
                    rows: [],
                    truncated: false,
                }}
            />
        );

        expect(screen.getByText('No plottable values for this chart.')).toBeVisible();
    });

    it('formats table cells with result column metadata', () => {
        render(
            <ChartResult
                ariaLabel="Formatted result"
                kind="bar"
                data={{
                    columns: [
                        {
                            name: 'dim',
                            role: 'dim',
                            type: 'date',
                            timeGranularity: 'month',
                        },
                        {
                            name: 'm0',
                            role: 'measure',
                            type: 'number',
                            valueFormat: 'rub',
                        },
                    ],
                    rows: [['2026-05-01T00:00:00.000Z', 1500000]],
                    truncated: false,
                }}
            />
        );

        expect(screen.getByRole('cell', { name: '05.2026' })).toBeVisible();
        expect(screen.getByRole('cell', { name: '1 500 000 ₽' })).toBeVisible();
    });
});
