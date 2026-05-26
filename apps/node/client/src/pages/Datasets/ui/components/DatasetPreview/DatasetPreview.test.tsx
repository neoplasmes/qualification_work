import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatasetColumn, DatasetMetadata, DatasetRow } from '@/entities/dataset';

import { datasetsTestIds } from '../../../const';

import type { DatasetGridProps } from '../DatasetGrid/types';
import { DatasetPreview } from './DatasetPreview';

const mocks = vi.hoisted(() => ({
    updateRow: vi.fn(),
    insertRow: vi.fn(),
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
    useGetDatasetRowsQuery: () => ({
        data: {
            rows: [mockRow],
            totalRows: selectedDataset.totalRows,
            offset: 0,
            limit: 200,
        },
        isLoading: false,
        isFetching: false,
    }),
    useUpdateRowMutation: () => [mocks.updateRow],
    useInsertRowMutation: () => [mocks.insertRow, { isLoading: false }],
}));

vi.mock('../DatasetGrid', () => ({
    DatasetGrid: ({
        columns,
        isInsertingRow,
        onCellCommit,
        onNewRowValueChange,
    }: DatasetGridProps) => (
        <div data-testid="mock-grid">
            <button type="button" onClick={() => onCellCommit('row-1', columns[0], '42')}>
                Commit amount
            </button>
            {isInsertingRow && (
                <button
                    type="button"
                    onClick={() => onNewRowValueChange({ amount: '12', name: 'Alice' })}
                >
                    Fill new row
                </button>
            )}
        </div>
    ),
}));

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
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows loaded row count for selected dataset', () => {
        render(<DatasetPreview selectedDataset={selectedDataset} />);

        expect(screen.getByText('1 of 1 rows')).toBeInTheDocument();
    });

    it('flushes edited cells and inserts valid rows', async () => {
        const { container } = render(
            <DatasetPreview selectedDataset={selectedDataset} />
        );

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

        fireEvent.click(getByDataTestId(container, datasetsTestIds.addRowButton));
        fireEvent.click(screen.getByRole('button', { name: 'Fill new row' }));
        fireEvent.click(getByDataTestId(container, datasetsTestIds.confirmInsertButton));

        expect(mocks.insertRow).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            orgId: 'org-1',
            data: { amount: 12, name: 'Alice' },
        });
    });
});
