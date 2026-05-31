import { CompactSelection } from '@glideapps/glide-data-grid';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatasetColumn, DatasetMetadata, DatasetRow } from '@/entities/dataset';

import { datasetsTestIds } from '../../../const';

import type { DatasetGridProps } from '../DatasetGrid/types';
import { DatasetPreview } from './DatasetPreview';

const mocks = vi.hoisted(() => ({
    updateRow: vi.fn(),
    insertRow: vi.fn(),
    deleteRow: vi.fn(),
    patchColumn: vi.fn(),
}));

const columns = vi.hoisted(
    () =>
        [
            {
                id: 'column-1',
                datasetId: 'dataset-1',
                key: 'amount',
                displayName: 'Amount',
                dataType: 'number',
                orderIndex: 0,
                isAnalyzable: true,
            },
            {
                id: 'column-2',
                datasetId: 'dataset-1',
                key: 'name',
                displayName: 'Name',
                dataType: 'string',
                orderIndex: 1,
                isAnalyzable: true,
            },
        ] satisfies DatasetColumn[]
);

const selectedDataset = vi.hoisted(
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
            columns,
            totalRows: 2,
        }) satisfies DatasetMetadata
);

const mockRows = vi.hoisted((): DatasetRow[] => [
    {
        id: 'row-1',
        datasetId: 'dataset-1',
        rowIndex: 0,
        data: { amount: 1, name: 'Row 1' },
    },
    {
        id: 'row-2',
        datasetId: 'dataset-1',
        rowIndex: 1,
        data: { amount: 2, name: 'Row 2' },
    },
]);

vi.mock('@/entities/dataset', () => ({
    useLazyGetDatasetRowsQuery: () => [
        (arg: { datasetId: string; offset?: number; limit?: number }) => ({
            unwrap: () =>
                Promise.resolve({
                    rows: mockRows,
                    totalRows: selectedDataset.totalRows,
                    offset: arg.offset ?? 0,
                    limit: arg.limit ?? 200,
                }),
        }),
        { isLoading: false, isFetching: false },
    ],
    useUpdateRowMutation: () => [mocks.updateRow],
    useInsertRowMutation: () => [mocks.insertRow, { isLoading: false }],
    useDeleteRowMutation: () => [mocks.deleteRow, { isLoading: false }],
    usePatchDatasetColumnMutation: () => [mocks.patchColumn, { isLoading: false }],
}));

vi.mock('../DatasetGrid', () => ({
    DatasetGrid: ({
        columns,
        insertDraft,
        onCellCommit,
        onDraftValueChange,
        onRowContextMenu,
        onColumnContextMenu,
        onDraftRowBoundsChange,
        onGridSelectionChange,
    }: DatasetGridProps) => {
        // emulate the real grid reporting draft row bounds
        useEffect(() => {
            onDraftRowBoundsChange(insertDraft ? { y: 100, height: ROW_H_MOCK } : null);
        }, [insertDraft, onDraftRowBoundsChange]);

        // NOTE: getRowAt is also passed, but the test interacts with row index 0
        // and the lazy hook mock fills loadedChunks[0] with mockRows, so getRowAt(0/1)
        // resolve once the initial chunk fetch lands

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
                    // emulate a native range drag covering the first two rows
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
                {insertDraft && (
                    <button
                        type="button"
                        onClick={() =>
                            onDraftValueChange({ amount: '12', name: 'Alice' })
                        }
                    >
                        Fill new row
                    </button>
                )}
            </div>
        );
    },
}));

const ROW_H_MOCK = 32;

// flush microtasks queued by the chunk fetch promise so loadedChunks state catches up
const flushPromises = () =>
    act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });

const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element = container.querySelector<T>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as T;
};

describe('DatasetPreview', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        mocks.updateRow.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue([]),
        });
        mocks.insertRow.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
        mocks.deleteRow.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
        mocks.patchColumn.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not show loaded row count for selected dataset', () => {
        render(<DatasetPreview selectedDataset={selectedDataset} />);

        expect(screen.queryByText('1 of 1 rows')).not.toBeInTheDocument();
    });

    it('flushes edited cells and inserts a draft row below the selected row', async () => {
        const { container } = render(
            <DatasetPreview selectedDataset={selectedDataset} />
        );

        // wait for the initial chunk fetch (mocked) to land in loadedChunks
        await flushPromises();

        fireEvent.click(screen.getByRole('button', { name: 'Commit amount' }));

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(mocks.updateRow).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            orgId: 'org-1',
            rowIds: ['row-1'],
            values: { amount: 42 },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Open row menu' }));
        fireEvent.click(getByDataTestId(container, datasetsTestIds.insertRowMenuItem));
        fireEvent.click(screen.getByRole('button', { name: 'Fill new row' }));
        expect(mocks.insertRow).not.toHaveBeenCalled();

        fireEvent.click(getByDataTestId(container, datasetsTestIds.confirmInsertButton));

        expect(mocks.insertRow).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            orgId: 'org-1',
            afterRowId: 'row-1',
            data: { amount: 12, name: 'Alice' },
        });
    });

    it('confirms row deletion from the context menu before calling backend', async () => {
        const { container } = render(
            <DatasetPreview selectedDataset={selectedDataset} />
        );

        // wait for the initial chunk fetch (mocked) to land in loadedChunks
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Open row menu' }));
        fireEvent.click(getByDataTestId(container, datasetsTestIds.deleteRowMenuItem));
        expect(mocks.deleteRow).not.toHaveBeenCalled();

        fireEvent.click(
            getByDataTestId(container, datasetsTestIds.confirmDeleteRowButton)
        );

        expect(mocks.deleteRow).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            orgId: 'org-1',
            rowIds: ['row-1'],
        });
    });

    it('shows bulk actions for a multi-row selection and clears every selected row', async () => {
        const { container } = render(
            <DatasetPreview selectedDataset={selectedDataset} />
        );

        await flushPromises();

        fireEvent.click(screen.getByRole('button', { name: 'Select two rows' }));
        fireEvent.click(screen.getByRole('button', { name: 'Open row menu' }));

        // single-row item is gone, both bulk items are present
        expect(
            container.querySelector(
                `[data-test-id="${datasetsTestIds.insertRowMenuItem}"]`
            )
        ).toBeNull();
        fireEvent.click(
            getByDataTestId(container, datasetsTestIds.clearSelectedMenuItem)
        );

        expect(mocks.updateRow).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            orgId: 'org-1',
            rowIds: ['row-1', 'row-2'],
            values: { amount: null, name: null },
        });
    });

    it('deletes every selected row from the bulk confirm step', async () => {
        const { container } = render(
            <DatasetPreview selectedDataset={selectedDataset} />
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

        expect(mocks.deleteRow).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            orgId: 'org-1',
            rowIds: ['row-1', 'row-2'],
        });
    });

    it('opens the column context menu and toggles analysis inclusion', async () => {
        render(<DatasetPreview selectedDataset={selectedDataset} />);

        await flushPromises();

        fireEvent.click(screen.getByRole('button', { name: 'Open column menu' }));
        fireEvent.click(screen.getByLabelText('Include in analysis'));

        expect(mocks.patchColumn).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            columnId: 'column-1',
            orgId: 'org-1',
            isAnalyzable: false,
        });
    });
});
