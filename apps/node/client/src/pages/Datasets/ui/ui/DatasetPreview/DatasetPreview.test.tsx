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
            },
            {
                id: 'column-2',
                datasetId: 'dataset-1',
                key: 'name',
                displayName: 'Name',
                dataType: 'string',
                orderIndex: 1,
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
            totalRows: 1,
        }) satisfies DatasetMetadata
);

const mockRow = vi.hoisted(
    (): DatasetRow => ({
        id: 'row-1',
        datasetId: 'dataset-1',
        rowIndex: 1,
        data: { amount: 1, name: 'Row 1' },
    })
);

vi.mock('@/entities/dataset', () => ({
    useLazyGetDatasetRowsQuery: () => [
        (arg: { datasetId: string; offset?: number; limit?: number }) => ({
            unwrap: () =>
                Promise.resolve({
                    rows: [mockRow],
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
}));

vi.mock('../DatasetGrid', () => ({
    DatasetGrid: ({
        columns,
        insertDraft,
        onCellCommit,
        onDraftValueChange,
        onRowContextMenu,
        onDraftRowBoundsChange,
    }: DatasetGridProps) => {
        // emulate the real grid reporting draft row bounds
        useEffect(() => {
            onDraftRowBoundsChange(insertDraft ? { y: 100, height: ROW_H_MOCK } : null);
        }, [insertDraft, onDraftRowBoundsChange]);

        // NOTE: getRowAt is also passed, but the test interacts with row index 0
        // and the lazy hook mock fills loadedChunks[0] with [mockRow], so getRowAt(0)
        // will return mockRow once the initial chunk fetch resolves.

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
                    onClick={() => onRowContextMenu(0, { x: 12, y: 24 })}
                >
                    Open row menu
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
        mocks.insertRow.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
        mocks.deleteRow.mockReturnValue({
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
            rowId: 'row-1',
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
            rowId: 'row-1',
        });
    });
});
