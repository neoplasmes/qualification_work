import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import {
    filterApplicationEntitiesSlice,
    selectFilterApplicationValues,
    type FilterApplicationEntity,
    type FilterApplicationScope,
} from '@/features/filterApplicationEntities';

import { FilterPanel } from './FilterPanel';

vi.mock('@/features/authenticate', () => ({
    useGetMeQuery: () => ({ data: { id: 'user-1' } }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: 'owner' },
    }),
}));

vi.mock('@/entities/dataset', () => ({
    useListDatasetsQuery: () => ({
        data: [
            {
                dataset: {
                    id: 'dataset-1',
                    orgId: 'org-1',
                    name: 'Invoices',
                    sourceType: 'manual',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-02T00:00:00.000Z',
                },
                columns: [],
                totalRows: 3,
            },
        ],
    }),
}));

vi.mock('@/entities/chart', () => ({
    useListChartsQuery: () => ({
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
    }),
}));

vi.mock('@/entities/dashboard', () => ({
    useListDashboardsQuery: () => ({
        data: [
            {
                id: 'dashboard-1',
                orgId: 'org-1',
                name: 'Sales',
                items: [],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
    }),
}));

const testIds = {
    chip: 'filter-chip',
    clearButton: 'clear-filter',
    tabs: {
        charts: 'tab-charts',
        dashboards: 'tab-dashboards',
        datasets: 'tab-datasets',
        effects: 'tab-effects',
        runs: 'tab-runs',
    },
} satisfies {
    chip: string;
    clearButton: string;
    tabs: Record<FilterApplicationEntity, string>;
};

const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element = container.querySelector<T>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as T;
};

const makeStore = () =>
    configureStore({
        reducer: combineReducers({
            [filterApplicationEntitiesSlice.name]: filterApplicationEntitiesSlice.reducer,
        }),
    });

const renderPanel = (scope: FilterApplicationScope) => {
    const store = makeStore();
    const result = render(
        <Provider store={store}>
            <FilterPanel scope={scope} testIds={testIds} />
        </Provider>
    );

    return { store, ...result };
};

describe('FilterPanel', () => {
    it('toggles action dataset, effect and run filters', async () => {
        const user = userEvent.setup();
        const { container, store } = renderPanel('actions');

        await user.click(getByDataTestId(container, testIds.chip));
        await user.click(getByDataTestId(container, testIds.tabs.effects));
        await user.click(getByDataTestId(container, testIds.chip));
        await user.click(getByDataTestId(container, testIds.tabs.runs));
        await user.click(getByDataTestId(container, testIds.chip));

        expect(selectFilterApplicationValues('actions')(store.getState())).toMatchObject({
            datasets: ['dataset-1'],
            effects: ['insertRow'],
            runs: ['success'],
        });
    });

    it('toggles and clears chart filters', async () => {
        const user = userEvent.setup();
        const { container, store } = renderPanel('charts');

        await user.click(getByDataTestId(container, testIds.chip));
        await user.click(getByDataTestId(container, testIds.tabs.dashboards));
        await user.click(getByDataTestId(container, testIds.chip));
        await user.click(getByDataTestId(container, testIds.clearButton));

        expect(selectFilterApplicationValues('charts')(store.getState())).toMatchObject({
            datasets: ['dataset-1'],
            dashboards: [],
        });
    });

    it('toggles dashboard filters', async () => {
        const user = userEvent.setup();
        const { container, store } = renderPanel('dashboards');

        await user.click(getByDataTestId(container, testIds.chip));
        await user.click(getByDataTestId(container, testIds.tabs.datasets));
        await user.click(getByDataTestId(container, testIds.chip));

        expect(
            selectFilterApplicationValues('dashboards')(store.getState())
        ).toMatchObject({
            charts: ['chart-1'],
            datasets: ['dataset-1'],
        });
    });

    it('toggles dataset filters', async () => {
        const user = userEvent.setup();
        const { container, store } = renderPanel('datasets');

        await user.click(getByDataTestId(container, testIds.chip));
        await user.click(getByDataTestId(container, testIds.tabs.dashboards));
        await user.click(getByDataTestId(container, testIds.chip));

        expect(selectFilterApplicationValues('datasets')(store.getState())).toMatchObject(
            {
                charts: ['chart-1'],
                dashboards: ['dashboard-1'],
            }
        );
    });
});
