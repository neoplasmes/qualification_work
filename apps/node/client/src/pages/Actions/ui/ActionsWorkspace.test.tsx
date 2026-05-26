import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Action } from '@/entities/action';
import type { DatasetMetadata } from '@/entities/dataset';

import { actionsTestIds } from '../const';
import { actionsPageInitialState, actionsPageSlice } from '../model';
import { ActionsWorkspace } from './ActionsWorkspace';

const mocks = vi.hoisted(() => ({
    createAction: vi.fn(),
    patchAction: vi.fn(),
    archiveAction: vi.fn(),
    executeAction: vi.fn(),
    refetchActions: vi.fn(),
}));

const action = vi.hoisted(
    () =>
        ({
            id: 'action-1',
            orgId: 'org-1',
            name: 'Receive payment',
            description: null,
            parameters: [
                { key: 'amount', label: 'Amount', type: 'number', required: true },
                { key: 'paid', label: 'Paid', type: 'bool', required: false },
            ],
            effects: [
                {
                    kind: 'insertRow',
                    datasetId: 'dataset-1',
                    values: { status: { kind: 'literal', value: 'paid' } },
                },
            ],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            archivedAt: null,
        }) satisfies Action
);

const dataset = vi.hoisted(
    () =>
        ({
            dataset: {
                id: 'dataset-1',
                orgId: 'org-1',
                name: 'Invoices',
                sourceType: 'manual',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
            columns: [
                {
                    id: 'column-1',
                    datasetId: 'dataset-1',
                    key: 'status',
                    displayName: 'Status',
                    dataType: 'string',
                    orderIndex: 0,
                },
            ],
            totalRows: 4,
        }) satisfies DatasetMetadata
);

vi.mock('@/features/authenticate', () => ({
    useGetMeQuery: () => ({ data: { id: 'user-1' }, isLoading: false }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: 'owner' },
    }),
}));

vi.mock('@/entities/dataset', () => ({
    useListDatasetsQuery: () => ({
        data: [dataset],
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
    }),
}));

vi.mock('@/entities/action', () => ({
    useListActionsQuery: () => ({
        data: [action],
        isLoading: false,
        isFetching: false,
        refetch: mocks.refetchActions,
    }),
    useArchiveActionMutation: () => [mocks.archiveAction, { isLoading: false }],
}));

vi.mock('@/features/manageActions', () => ({
    useCreateActionMutation: () => [mocks.createAction, { isLoading: false }],
    usePatchActionMutation: () => [mocks.patchAction, { isLoading: false }],
    useExecuteActionMutation: () => [mocks.executeAction, { isLoading: false }],
}));

const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element = container.querySelector<T>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as T;
};

type ActionsPageState = typeof actionsPageInitialState;

const renderWorkspace = (statePatch: Partial<ActionsPageState>) => {
    const store = configureStore({
        reducer: combineReducers({ [actionsPageSlice.name]: actionsPageSlice.reducer }),
        preloadedState: {
            [actionsPageSlice.name]: {
                ...actionsPageInitialState,
                ...statePatch,
            },
        },
    });

    return {
        store,
        ...render(
            <Provider store={store}>
                <ActionsWorkspace />
            </Provider>
        ),
    };
};

describe('ActionsWorkspace', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createAction.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({ ...action, id: 'created-action' }),
        });
        mocks.patchAction.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
        mocks.archiveAction.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
        mocks.executeAction.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({
                id: 'run-1',
                actionId: 'action-1',
                orgId: 'org-1',
                userId: 'user-1',
                parameters: {},
                changes: [],
                status: 'success',
                errorMessage: null,
                executedAt: '2026-01-01T00:00:00.000Z',
            }),
        });
        mocks.refetchActions.mockResolvedValue(undefined);
    });

    it('creates an action from central configure inputs and selects', async () => {
        const user = userEvent.setup();
        const { container } = renderWorkspace({ isCreatingAction: true });

        await user.click(getByDataTestId(container, actionsTestIds.renameButton));
        const nameInput = getByDataTestId<HTMLInputElement>(
            container,
            actionsTestIds.renameInput
        );
        await user.clear(nameInput);
        await user.type(nameInput, 'Close invoice');
        await user.keyboard('{Enter}');

        await user.type(
            getByDataTestId(container, actionsTestIds.parameterLabelInput),
            'Invoice ID'
        );
        await user.selectOptions(
            getByDataTestId(container, actionsTestIds.effectDatasetSelect),
            'dataset-1'
        );
        await user.selectOptions(
            getByDataTestId(container, actionsTestIds.mappingColumnSelect),
            'status'
        );
        await user.selectOptions(
            getByDataTestId(container, actionsTestIds.mappingParameterSelect),
            'invoice_id'
        );
        await user.click(getByDataTestId(container, actionsTestIds.saveButton));

        await waitFor(() => expect(mocks.createAction).toHaveBeenCalledTimes(1));
        expect(mocks.createAction).toHaveBeenCalledWith(
            expect.objectContaining({
                orgId: 'org-1',
                name: 'Close invoice',
                parameters: [
                    expect.objectContaining({
                        key: 'invoice_id',
                        label: 'Invoice ID',
                    }),
                ],
                effects: [
                    expect.objectContaining({
                        datasetId: 'dataset-1',
                        values: { status: { kind: 'parameter', key: 'invoice_id' } },
                    }),
                ],
            })
        );
    });

    it('renames existing action from workspace title', async () => {
        const user = userEvent.setup();
        const { container } = renderWorkspace({ selectedActionId: 'action-1' });

        await user.click(getByDataTestId(container, actionsTestIds.renameButton));
        const nameInput = getByDataTestId<HTMLInputElement>(
            container,
            actionsTestIds.renameInput
        );
        await user.clear(nameInput);
        await user.type(nameInput, 'Post payment');
        await user.keyboard('{Enter}');

        await waitFor(() => expect(mocks.patchAction).toHaveBeenCalledTimes(1));
        expect(mocks.patchAction).toHaveBeenCalledWith({
            actionId: 'action-1',
            name: 'Post payment',
        });
    });

    it('runs selected action with coerced input values', async () => {
        const user = userEvent.setup();
        const { container } = renderWorkspace({
            selectedActionId: 'action-1',
            workspaceTab: 'run',
        });

        await user.type(getByDataTestId(container, actionsTestIds.runInput), '15');
        await user.selectOptions(
            getByDataTestId(container, actionsTestIds.runBoolSelect),
            'false'
        );
        await user.click(getByDataTestId(container, actionsTestIds.runButton));

        await waitFor(() => expect(mocks.executeAction).toHaveBeenCalledTimes(1));
        expect(mocks.executeAction).toHaveBeenCalledWith({
            actionId: 'action-1',
            parameters: { amount: 15, paid: false },
        });
    });

    it('maps View tab to run and Edit tab to configure', async () => {
        const user = userEvent.setup();
        const { container } = renderWorkspace({ selectedActionId: 'action-1' });

        await user.click(getByDataTestId(container, actionsTestIds.workspaceViewTab));
        expect(getByDataTestId(container, actionsTestIds.runForm)).toBeInTheDocument();

        await user.click(getByDataTestId(container, actionsTestIds.workspaceEditTab));
        expect(
            getByDataTestId(container, actionsTestIds.configureForm)
        ).toBeInTheDocument();
    });
});
