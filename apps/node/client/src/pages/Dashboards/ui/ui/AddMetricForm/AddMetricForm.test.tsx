import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DatasetMetadata } from '@/entities/dataset';

import { dashboardsTestIds } from '../../../const';

import type { MetricConfigForm } from '../../lib';
import { AddMetricForm } from './AddMetricForm';

vi.mock('@/features/manageDashboards', () => ({
    usePreviewDashboardMetricQuery: () => ({
        data: { value: 396.48 },
        isFetching: false,
        error: undefined,
    }),
}));

const datasets: DatasetMetadata[] = [
    {
        dataset: {
            id: 'dataset-1',
            orgId: 'org-1',
            name: 'Revenue',
            sourceType: 'manual',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        },
        columns: [
            {
                id: 'column-visits',
                datasetId: 'dataset-1',
                key: 'Визитов за месяц',
                displayName: 'Визитов за месяц',
                dataType: 'number',
                orderIndex: 0,
                isAnalyzable: true,
            },
            {
                id: 'column-average-check',
                datasetId: 'dataset-1',
                key: 'Средний чек',
                displayName: 'Средний чек',
                dataType: 'number',
                orderIndex: 1,
                isAnalyzable: true,
            },
            {
                id: 'column-date',
                datasetId: 'dataset-1',
                key: 'Дата',
                displayName: 'Дата',
                dataType: 'date',
                orderIndex: 2,
                isAnalyzable: true,
            },
        ],
        totalRows: 10,
    },
];

const config: MetricConfigForm = {
    target: '350',
    targetDirection: 'higher',
    showTrend: true,
    timeColumn: 'Дата',
    timeBucket: 'month',
};

const renderForm = (expression = 'avg("Средний чек")') =>
    render(
        <AddMetricForm
            datasets={datasets}
            datasetId="dataset-1"
            metricName="Average Средний чек"
            metricExpression={expression}
            metricFormat="₽"
            metricValueMultiplier="1"
            config={config}
            editing
            onDatasetChange={vi.fn()}
            onNameChange={vi.fn()}
            onExpressionChange={vi.fn()}
            onFormatChange={vi.fn()}
            onValueMultiplierChange={vi.fn()}
            onConfigChange={vi.fn()}
            onSubmit={vi.fn()}
        />
    );

const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element = container.querySelector(`[data-test-id="${testId}"]`);
    if (!element) {
        throw new Error(`Unable to find data-test-id="${testId}"`);
    }

    return element as T;
};

describe('AddMetricForm', () => {
    it('selects the column saved in the builder expression when editing', async () => {
        const { container } = renderForm();

        await waitFor(() =>
            expect(
                getByDataTestId<HTMLSelectElement>(
                    container,
                    dashboardsTestIds.metricColumnSelect
                )
            ).toHaveValue('column-average-check')
        );
        expect(
            getByDataTestId(container, dashboardsTestIds.metricExpressionInput)
        ).toHaveValue('avg("Средний чек")');
    });

    it('keeps formula expressions in formula mode instead of overwriting them', async () => {
        const { container } = renderForm('sum("Средний чек") / count("Средний чек")');

        await waitFor(() =>
            expect(
                getByDataTestId(container, dashboardsTestIds.metricExpressionInput)
            ).toHaveValue('sum("Средний чек") / count("Средний чек")')
        );
    });
});
