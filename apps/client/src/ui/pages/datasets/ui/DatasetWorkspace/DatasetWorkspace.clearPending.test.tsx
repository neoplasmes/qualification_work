import type { DatasetRow } from '@/core/entities/datasetRow';
import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi, type MockInstance } from 'vitest';

import { datasetsTestIds } from '../../const';
import { DatasetWorkspace } from './DatasetWorkspace';
import { mockRows, selectedDataset } from './test';

vi.mock('../DatasetGrid', async () => ({
    DatasetGrid: (await import('./test')).DatasetWorkspaceTestGrid,
}));

let store: ReturnType<typeof createUiTestRuntime>;
let rows: DatasetRow[];
let container: HTMLElement;
let write: MockInstance<typeof store.runtime.dependencies.updateDatasetRows.execute>;

function Wrapper({ children }: PropsWithChildren) {
    return <UiTestProvider store={store}>{children}</UiTestProvider>;
}

function clearSelection() {
    fireEvent.click(screen.getByRole('button', { name: 'Select two rows' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open row menu' }));
    fireEvent.click(
        container.querySelector(
            `[data-test-id="${datasetsTestIds.clearSelectedMenuItem}"]`
        )!
    );
}

beforeEach(async () => {
    vi.useFakeTimers();
    store = createUiTestRuntime();
    rows = [
        ...mockRows,
        {
            ...mockRows[0]!,
            id: 'row-3',
            ref: 'datasetRow:org-1/dataset-1/row-3',
            rowIndex: 2,
        },
    ];
    store.runtime.dependencies.getDatasetRows.execute = async () => ({
        rows,
        totalRows: 3,
        offset: 0,
        limit: 200,
    });
    write = vi
        .spyOn(store.runtime.dependencies.updateDatasetRows, 'execute')
        .mockImplementation(async input => {
            rows = rows.map(row =>
                input.rowIds.includes(row.id)
                    ? {
                          ...row,
                          data: Object.fromEntries(
                              Object.entries({ ...row.data, ...input.values }).filter(
                                  ([, value]) => value !== null
                              )
                          ),
                      }
                    : row
            );

            return rows.filter(row => input.rowIds.includes(row.id));
        });
    ({ container } = render(<DatasetWorkspace selectedDataset={selectedDataset} />, {
        wrapper: Wrapper,
    }));
    await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
    });
});

afterEach(() => vi.useRealTimers());

it.each([700, 100])(
    'prevents another clear after a newer edit with timer elapsed %d',
    async elapsed => {
        let confirm!: () => void;
        write.mockImplementationOnce(
            () =>
                new Promise(resolve => {
                    confirm = () => {
                        rows = rows.map(row =>
                            row.id === 'row-3' ? row : { ...row, data: {} }
                        );
                        resolve(rows.slice(0, 2));
                    };
                })
        );
        fireEvent.click(screen.getByRole('button', { name: 'Commit amount' }));
        clearSelection();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(10);
        });
        expect(
            container.querySelector(
                `[data-test-id="${datasetsTestIds.clearSelectedMenuItem}"]`
            )
        ).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Commit newer amount' }));
        fireEvent.pointerDown(document.body);
        fireEvent.click(screen.getByRole('button', { name: 'Select three rows' }));
        fireEvent.click(screen.getByRole('button', { name: 'Open second row menu' }));
        const blocked = container.querySelector(
            `[data-test-id="${datasetsTestIds.clearSelectedMenuItem}"]`
        )!;
        expect(blocked).toBeDisabled();
        expect(blocked).toHaveAttribute('aria-busy', 'true');
        fireEvent.click(blocked);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(elapsed);
        });
        expect(write).toHaveBeenCalledTimes(1);
        await act(async () => {
            confirm();
            await vi.advanceTimersByTimeAsync(1000);
        });
        expect(write.mock.calls.map(([input]) => [input.rowIds, input.values])).toEqual([
            [['row-1', 'row-2'], { amount: null, name: null }],
            [['row-1'], { amount: 84 }],
        ]);
        expect(screen.getByLabelText('first amount')).toHaveTextContent('84');
        fireEvent.click(screen.getByRole('button', { name: 'Select three rows' }));
        fireEvent.click(screen.getByRole('button', { name: 'Open second row menu' }));
        expect(
            container.querySelector(
                `[data-test-id="${datasetsTestIds.clearSelectedMenuItem}"]`
            )
        ).toBeEnabled();
    }
);

it('re-enables a failed clear and allows deliberate retry', async () => {
    let reject!: (error: Error) => void;
    write.mockImplementationOnce(
        () =>
            new Promise((_, fail) => {
                reject = fail;
            })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Commit amount' }));
    clearSelection();
    await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
    });
    const button = container.querySelector(
        `[data-test-id="${datasetsTestIds.clearSelectedMenuItem}"]`
    )!;
    expect(button).toBeDisabled();
    await act(async () => {
        reject(new Error('Cannot clear'));
        await vi.advanceTimersByTimeAsync(10);
    });
    expect(button).toBeEnabled();
    expect(screen.getByLabelText('first amount')).toHaveTextContent('42');
    fireEvent.click(button);
    await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
    });
    expect(write.mock.calls.map(([input]) => [input.rowIds, input.values])).toEqual([
        [['row-1', 'row-2'], { amount: null, name: null }],
        [['row-1', 'row-2'], { amount: null, name: null }],
    ]);
    expect(screen.getByLabelText('first amount')).toHaveTextContent(/^$/);
});
