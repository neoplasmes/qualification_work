import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { chartsTestIds } from '../../../const';
import {
    chartsPageSlice,
    selectFilterDashboardIds,
    selectFilterDatasetIds,
} from '../../../model';

import { ChartsFilterPanel } from './ChartsFilterPanel';

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
                    updatedAt: '2026-01-01T00:00:00.000Z',
                },
                columns: [],
                totalRows: 3,
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
        reducer: combineReducers({ [chartsPageSlice.name]: chartsPageSlice.reducer }),
    });

describe('ChartsFilterPanel', () => {
    it('toggles dataset and dashboard filters from panel controls', async () => {
        const user = userEvent.setup();
        const store = makeStore();
        const { container } = render(
            <Provider store={store}>
                <ChartsFilterPanel />
            </Provider>
        );

        await user.click(getByDataTestId(container, chartsTestIds.filterChip));

        expect(selectFilterDatasetIds(store.getState())).toEqual(['dataset-1']);

        await user.click(getByDataTestId(container, chartsTestIds.filterTabDashboards));
        await user.click(getByDataTestId(container, chartsTestIds.filterChip));

        expect(selectFilterDashboardIds(store.getState())).toEqual(['dashboard-1']);
    });
});
