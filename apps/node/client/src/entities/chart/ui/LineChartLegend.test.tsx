import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ChartSeries } from '../lib/parseChartData';
import { LineChartLegend } from './LineChartLegend';

const series: ChartSeries[] = [
    { name: 'Менеджер A', points: [{ label: '03.2026', value: 12000 }] },
    { name: 'Менеджер B', points: [{ label: '03.2026', value: 15000 }] },
];

describe('LineChartLegend', () => {
    it('renders series labels with color markers', () => {
        render(<LineChartLegend series={series} color="#a12a6d" />);

        expect(screen.getByTestId('line-chart-legend')).toBeVisible();
        expect(screen.getByText('Менеджер A')).toBeVisible();
        expect(screen.getByText('Менеджер B')).toBeVisible();
    });

    it('stays hidden for a single series', () => {
        render(<LineChartLegend series={series.slice(0, 1)} color="#a12a6d" />);

        expect(screen.queryByTestId('line-chart-legend')).not.toBeInTheDocument();
    });
});
