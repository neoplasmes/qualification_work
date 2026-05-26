import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { actionsTestIds } from '../../../const';
import {
    actionsPageSlice,
    selectActionsFilterDatasetIds,
    selectActionsSearchText,
} from '../../../model';

import { ActionsFilters } from './ActionsFilters';

vi.mock('@/features/authenticate', () => ({
    useGetMeQuery: () => ({ data: { id: 'user-1' }, isLoading: false }),
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
                totalRows: 8,
            },
        ],
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
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
        reducer: combineReducers({ [actionsPageSlice.name]: actionsPageSlice.reducer }),
    });

describe('ActionsFilters', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('dispatches search and dataset filters from central controls', async () => {
        const user = userEvent.setup();
        const store = makeStore();
        const { container } = render(
            <Provider store={store}>
                <ActionsFilters />
            </Provider>
        );

        await user.type(
            getByDataTestId(container, actionsTestIds.filtersSearchInput),
            'pay'
        );
        await user.click(getByDataTestId(container, actionsTestIds.filterChip));

        expect(selectActionsSearchText(store.getState())).toBe('pay');
        expect(selectActionsFilterDatasetIds(store.getState())).toEqual(['dataset-1']);
    });
});
