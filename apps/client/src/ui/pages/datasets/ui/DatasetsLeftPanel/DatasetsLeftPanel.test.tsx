import type * as readModule from '@/env/cache/useRead';
import { createUiTestRuntime, UiTestProvider as Provider } from '@/test/uiRuntime';
import type { DatasetMetadata as DatasetMetadataFixture } from '@qualification-work/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { datasetsTestIds } from '../../const';
import { DatasetsLeftPanel } from './DatasetsLeftPanel';

vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: { id: 'user-1' } }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: 'owner' },
    }),
}));

const datasetMetadataFixtures: DatasetMetadataFixture[] = [
    {
        dataset: {
            id: 'dataset-1',
            orgId: 'org-1',
            name: 'Invoices',
            sourceType: 'manual',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        },
        columns: [],
        totalRows: 3,
    },
    {
        dataset: {
            id: 'dataset-2',
            orgId: 'org-1',
            name: 'Payments',
            sourceType: 'manual',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        },
        columns: [],
        totalRows: 1,
    },
];

vi.mock('@/env/cache/useRead', async importOriginal => {
    const actual = await importOriginal<typeof readModule>();

    return {
        ...actual,
        useRead: (query: { name: string }, input: unknown, options: unknown) => {
            if (query.name === 'listCharts') {
                return {
                    data: [
                        {
                            id: 'chart-1',
                            orgId: 'org-1',
                            datasetId: 'dataset-1',
                            name: 'Revenue',
                            chartType: 'bar',
                            config: {
                                kind: 'bar',
                                dimension: { columnId: 'column-1' },
                                measures: [{ aggregate: 'count' }],
                            },
                            createdAt: '2026-01-01T00:00:00.000Z',
                            updatedAt: '2026-01-01T00:00:00.000Z',
                        },
                    ],
                    isPending: false,
                };
            }
            if (query.name === 'getChartData') {
                return {
                    data: undefined,
                    isPending: false,
                    isFetching: false,
                    error: null,
                };
            }

            return actual.useRead(query as never, input, options as never);
        },
    };
});

vi.mock('@/entities/dashboard', () => ({
    useListDashboardsQuery: () => ({ data: [] }),
}));

const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element = container.querySelector<T>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as T;
};

const makeStore = (withFilter = false) => {
    const store = createUiTestRuntime({ datasetMetadata: datasetMetadataFixtures });

    if (withFilter) {
        store.ui.filters.getState().toggleFilterApplicationValue({
            scope: 'datasets',
            entity: 'charts',
            value: 'chart-1',
        });
    }

    return store;
};

describe('DatasetsLeftPanel', () => {
    it('selects a dataset and opens upload modal state', async () => {
        const user = userEvent.setup();
        const store = makeStore();
        const { container } = render(
            <Provider store={store}>
                <DatasetsLeftPanel />
            </Provider>
        );

        await user.click(await screen.findByRole('button', { name: /Invoices/ }));
        await user.click(getByDataTestId(container, datasetsTestIds.uploadButton));

        expect(store.ui.datasets.getState().selectedDatasetId).toBe('dataset-1');
        expect(store.ui.datasets.getState().showUpload).toBe(true);
    });

    it('renders datasets filtered by chart relationships', async () => {
        render(
            <Provider store={makeStore(true)}>
                <DatasetsLeftPanel />
            </Provider>
        );

        expect(
            await screen.findByRole('button', { name: /Invoices/ })
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /Payments/ })
        ).not.toBeInTheDocument();
    });
});
