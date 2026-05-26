import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { actionsPageSlice } from '../model/actionsPageSlice';
import { ActionsLeftPanel } from './ActionsLeftPanel';

let orgRole = 'owner';

vi.mock('@/features/authenticate', () => ({
    useGetMeQuery: () => ({ data: { id: 'user-1' }, isLoading: false }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: orgRole },
    }),
}));

vi.mock('@/entities/action', () => ({
    useListActionsQuery: () => ({
        data: [
            {
                id: 'action-1',
                orgId: 'org-1',
                name: 'Receive payment',
                description: 'Mark invoice paid',
                parameters: [{ key: 'invoice', label: 'Invoice', type: 'string' }],
                effects: [
                    {
                        kind: 'updateRowsByMatch',
                        datasetId: 'dataset-1',
                        match: { columnKey: 'id', parameterKey: 'invoice' },
                        values: { status: { kind: 'literal', value: 'paid' } },
                    },
                ],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
                archivedAt: null,
            },
        ],
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
    }),
    useListActionRunsQuery: () => ({
        data: [],
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
    }),
}));

const makeStore = () =>
    configureStore({
        reducer: combineReducers({ [actionsPageSlice.name]: actionsPageSlice.reducer }),
    });

const renderPanel = () =>
    render(
        <Provider store={makeStore()}>
            <ActionsLeftPanel />
        </Provider>
    );

describe('ActionsLeftPanel', () => {
    beforeEach(() => {
        orgRole = 'owner';
    });

    it('shows actions and opens a new draft', async () => {
        const user = userEvent.setup();
        renderPanel();

        expect(
            screen.getByRole('button', { name: /Receive payment/ })
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /New action/i }));

        expect(
            screen.getByRole('button', { name: /New action Draft.*Not saved/i })
        ).toBeInTheDocument();
    });

    it('disables creation for viewer role', () => {
        orgRole = 'viewer';
        renderPanel();

        expect(screen.getByRole('button', { name: /New action/i })).toBeDisabled();
    });
});
