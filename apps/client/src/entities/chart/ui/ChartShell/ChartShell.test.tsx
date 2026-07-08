import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChartShell } from './ChartShell';

describe('ChartShell', () => {
    it('renders heatmap data as chart', async () => {
        render(
            <ChartShell
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
        expect(screen.getByText('2 result rows')).toBeVisible();
    });

    it('shows a friendly empty state when chart rows are not plottable', () => {
        render(
            <ChartShell
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
});
