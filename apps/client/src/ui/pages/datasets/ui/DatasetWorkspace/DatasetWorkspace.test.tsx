import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { CompactSelection } from '@glideapps/glide-data-grid';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { datasetsTestIds } from '../../const';
import type { DatasetGridProps } from '../DatasetGrid/types';
import { DatasetWorkspace } from './DatasetWorkspace';
import { columns, mockRows, selectedDataset } from './test';

const mocks = vi.hoisted(() => ({
    updateRow: vi.fn(),
    insertRow: vi.fn(),
    deleteRow: vi.fn(),
    patchColumn: vi.fn(),
}));

vi.mock('../DatasetGrid', () => ({
    DatasetGrid: ({
        columns,
        onCellCommit,
        onRowContextMenu,
        onColumnContextMenu,
        onGridSelectionChange,
    }: DatasetGridProps) => {
        return (
            <div data-testid="mock-grid">
                <button
                    type="button"
                    onClick={() => onCellCommit('row-1', columns[0], '42')}
                >
                    Commit amount
                </button>
                <button
                    type="button"
                    onClick={() => onCellCommit('row-1', columns[0], 'oops')}
                >
                    Commit invalid amount
                </button>
                <button
                    type="button"
                    onClick={() => onCellCommit('row-1', columns[0], '')}
                >
                    Clear amount
                </button>
                <button
                    type="button"
                    onClick={() =>
                        onGridSelectionChange({
                            columns: CompactSelection.empty(),
                            rows: CompactSelection.empty(),
                            current: {
                                cell: [0, 0],
                                range: { x: 0, y: 0, width: 1, height: 2 },
                                rangeStack: [],
                            },
                        })
                    }
                >
                    Select two rows
                </button>
                <button
                    type="button"
                    onClick={() => onRowContextMenu(0, { x: 12, y: 24 })}
                >
                    Open row menu
                </button>
                <button
                    type="button"
                    onClick={() => onColumnContextMenu(columns[0], { x: 20, y: 36 })}
                >
                    Open column menu
                </button>
            </div>
        );
    },
}));

const flushPromises = () =>
    act(async () => {
        await vi.advanceTimersByTimeAsync(10);
    });

const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element = container.querySelector<T>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as T;
};

let wrapper: (props: PropsWithChildren) => React.ReactNode;

describe('DatasetWorkspace', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        const store = createUiTestRuntime();
        store.runtime.dependencies.getDatasetRows.execute = async input => ({
            rows: mockRows,
            totalRows: 2,
            offset: input.offset ?? 0,
            limit: 200,
        });
        store.runtime.dependencies.updateDatasetRows.execute =
            mocks.updateRow.mockImplementation(async input =>
                mockRows
                    .filter(row => input.rowIds.includes(row.id))
                    .map(row => ({ ...row, data: input.values }))
            );
        store.runtime.dependencies.insertDatasetRow.execute =
            mocks.insertRow.mockResolvedValue({
                ...mockRows[0],
                id: 'inserted',
                ref: 'datasetRow:org-1/dataset-1/inserted',
            });
        store.runtime.dependencies.deleteDatasetRows.execute =
            mocks.deleteRow.mockResolvedValue([]);
        store.runtime.dependencies.patchDatasetColumn.execute =
            mocks.patchColumn.mockResolvedValue({ ...columns[0], isAnalyzable: false });
        wrapper = function Wrapper({ children }: PropsWithChildren) {
            return <UiTestProvider store={store}>{children}</UiTestProvider>;
        };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not show loaded row count for selected dataset', () => {
        render(<DatasetWorkspace selectedDataset={selectedDataset} />, { wrapper });

        expect(screen.queryByText('1 of 1 rows')).not.toBeInTheDocument();
    });

    it('flushes edited cells and inserts an empty row below the selected row', async () => {
        const { container } = render(
            <DatasetWorkspace selectedDataset={selectedDataset} />,
            { wrapper }
        );

        await flushPromises();

        fireEvent.click(screen.getByRole('button', { name: 'Commit amount' }));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(700);
        });

        await flushPromises();
        expect(mocks.updateRow).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            orgId: 'org-1',
            rowIds: ['row-1'],
            values: { amount: 42 },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Open row menu' }));
        fireEvent.click(getByDataTestId(container, datasetsTestIds.insertRowMenuItem));

        await flushPromises();
        expect(mocks.insertRow).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            orgId: 'org-1',
            afterRowId: 'row-1',
            data: {},
        });
    });

    it('keeps invalid cell edits local until the value becomes valid', async () => {
        render(<DatasetWorkspace selectedDataset={selectedDataset} />, { wrapper });

        await flushPromises();

        fireEvent.click(screen.getByRole('button', { name: 'Commit invalid amount' }));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(700);
        });

        expect(mocks.updateRow).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Commit amount' }));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(700);
        });

        await flushPromises();
        expect(mocks.updateRow).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            orgId: 'org-1',
            rowIds: ['row-1'],
            values: { amount: 42 },
        });
    });

    it('patches empty cell edits as null', async () => {
        render(<DatasetWorkspace selectedDataset={selectedDataset} />, { wrapper });

        await flushPromises();

        fireEvent.click(screen.getByRole('button', { name: 'Clear amount' }));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(700);
        });

        await flushPromises();
        expect(mocks.updateRow).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            orgId: 'org-1',
            rowIds: ['row-1'],
            values: { amount: null },
        });
    });

    it('confirms row deletion from the context menu before calling backend', async () => {
        const { container } = render(
            <DatasetWorkspace selectedDataset={selectedDataset} />,
            { wrapper }
        );

        await flushPromises();

        fireEvent.click(screen.getByRole('button', { name: 'Open row menu' }));
        fireEvent.click(getByDataTestId(container, datasetsTestIds.deleteRowMenuItem));
        expect(mocks.deleteRow).not.toHaveBeenCalled();

        fireEvent.click(
            getByDataTestId(container, datasetsTestIds.confirmDeleteRowButton)
        );

        await flushPromises();
        expect(mocks.deleteRow).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            orgId: 'org-1',
            rowIds: ['row-1'],
        });
    });

    it('shows bulk actions for a multi-row selection and clears every selected row', async () => {
        const { container } = render(
            <DatasetWorkspace selectedDataset={selectedDataset} />,
            { wrapper }
        );

        await flushPromises();

        fireEvent.click(screen.getByRole('button', { name: 'Select two rows' }));
        fireEvent.click(screen.getByRole('button', { name: 'Open row menu' }));

        expect(
            container.querySelector(
                `[data-test-id="${datasetsTestIds.insertRowMenuItem}"]`
            )
        ).toBeNull();
        fireEvent.click(
            getByDataTestId(container, datasetsTestIds.clearSelectedMenuItem)
        );

        await flushPromises();
        expect(mocks.updateRow).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            orgId: 'org-1',
            rowIds: ['row-1', 'row-2'],
            values: { amount: null, name: null },
        });
    });

    it('deletes every selected row from the bulk confirm step', async () => {
        const { container } = render(
            <DatasetWorkspace selectedDataset={selectedDataset} />,
            { wrapper }
        );

        await flushPromises();

        fireEvent.click(screen.getByRole('button', { name: 'Select two rows' }));
        fireEvent.click(screen.getByRole('button', { name: 'Open row menu' }));
        fireEvent.click(
            getByDataTestId(container, datasetsTestIds.deleteSelectedRowsMenuItem)
        );
        expect(mocks.deleteRow).not.toHaveBeenCalled();

        fireEvent.click(
            getByDataTestId(container, datasetsTestIds.confirmDeleteRowButton)
        );

        await flushPromises();
        expect(mocks.deleteRow).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            orgId: 'org-1',
            rowIds: ['row-1', 'row-2'],
        });
    });

    it('opens the column context menu and toggles analysis inclusion', async () => {
        render(<DatasetWorkspace selectedDataset={selectedDataset} />, { wrapper });

        await flushPromises();

        fireEvent.click(screen.getByRole('button', { name: 'Open column menu' }));
        fireEvent.click(screen.getByLabelText('Использовать в анализе'));

        await flushPromises();
        expect(mocks.patchColumn).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            columnId: 'column-1',
            orgId: 'org-1',
            isAnalyzable: false,
        });
    });
});
