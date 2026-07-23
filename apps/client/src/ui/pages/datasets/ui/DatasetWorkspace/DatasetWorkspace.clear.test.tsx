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

it.each(['Commit amount', 'Commit invalid amount'])(
    'supersedes unsent input on clear and preserves unrelated rows: %s',
    async button => {
        fireEvent.click(screen.getByRole('button', { name: button }));
        fireEvent.click(screen.getByRole('button', { name: 'Commit unrelated amount' }));
        clearSelection();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(10);
        });
        expect(screen.getByLabelText('first amount')).toHaveTextContent(/^$/);
        expect(screen.getByLabelText('first invalid')).toHaveTextContent('false');
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });
        expect(write.mock.calls.map(([input]) => [input.rowIds, input.values])).toEqual([
            [['row-1', 'row-2'], { amount: null, name: null }],
            [['row-3'], { amount: 99 }],
        ]);
    }
);

it('orders an in-flight update before clear and retires its queued older edit', async () => {
    let release!: () => void;
    write.mockImplementationOnce(
        input =>
            new Promise(resolve => {
                release = () => {
                    rows[0] = { ...rows[0]!, data: input.values };
                    resolve([rows[0]]);
                };
            })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Commit amount' }));
    await act(async () => {
        await vi.advanceTimersByTimeAsync(700);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commit newer amount' }));
    await act(async () => {
        await vi.advanceTimersByTimeAsync(700);
    });
    clearSelection();
    await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
    });
    expect(write).toHaveBeenCalledTimes(1);
    await act(async () => {
        release();
        await vi.advanceTimersByTimeAsync(1000);
    });
    expect(write.mock.calls.map(([input]) => [input.rowIds, input.values])).toEqual([
        [['row-1'], { amount: 42 }],
        [['row-1', 'row-2'], { amount: null, name: null }],
    ]);
    expect(screen.getByLabelText('first amount')).toHaveTextContent(/^$/);
});

it('preserves a newer edit during clear and sends it only after clear confirms', async () => {
    let releaseClear!: () => void;
    let releaseEdit!: () => void;
    write
        .mockImplementationOnce(
            () =>
                new Promise(resolve => {
                    releaseClear = () => {
                        rows = rows.map(row =>
                            row.id === 'row-3' ? row : { ...row, data: {} }
                        );
                        resolve(rows.slice(0, 2));
                    };
                })
        )
        .mockImplementationOnce(
            input =>
                new Promise(resolve => {
                    releaseEdit = () => {
                        rows[0] = { ...rows[0]!, data: input.values };
                        resolve([rows[0]]);
                    };
                })
        );
    fireEvent.click(screen.getByRole('button', { name: 'Commit amount' }));
    clearSelection();
    await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commit newer amount' }));
    await act(async () => {
        await vi.advanceTimersByTimeAsync(700);
    });
    expect(write).toHaveBeenCalledTimes(1);
    await act(async () => {
        releaseClear();
        await vi.advanceTimersByTimeAsync(10);
    });
    expect(screen.getByLabelText('first amount')).toHaveTextContent('84');
    expect(write.mock.calls.map(([input]) => [input.rowIds, input.values])).toEqual([
        [['row-1', 'row-2'], { amount: null, name: null }],
        [['row-1'], { amount: 84 }],
    ]);
    await act(async () => {
        releaseEdit();
        await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByLabelText('first amount')).toHaveTextContent('84');
    expect(write).toHaveBeenCalledTimes(2);
});

it.each([
    ['Commit amount', '42', 'false'],
    ['Commit invalid amount', 'oops', 'true'],
])('retains failed clear input without retry: %s', async (button, value, invalid) => {
    write.mockRejectedValueOnce(new Error('Cannot clear'));
    fireEvent.click(screen.getByRole('button', { name: button }));
    clearSelection();
    await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByLabelText('first amount')).toHaveTextContent(value!);
    expect(screen.getByLabelText('first invalid')).toHaveTextContent(invalid!);
    expect(write).toHaveBeenCalledTimes(1);
});

it('keeps a newer invalid correction when clear fails', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Commit invalid amount' }));
    await act(async () => {
        reject(new Error('Cannot clear'));
        await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByLabelText('first amount')).toHaveTextContent('oops');
    expect(screen.getByLabelText('first invalid')).toHaveTextContent('true');
    expect(write).toHaveBeenCalledTimes(1);
});

it.each(['Commit amount', 'Commit invalid amount'])(
    'prevents repeated clear attempts before confirmation: %s',
    async button => {
        let release!: () => void;
        write
            .mockImplementationOnce(
                () =>
                    new Promise(resolve => {
                        release = () => {
                            rows = rows.map(row =>
                                row.id === 'row-3' ? row : { ...row, data: {} }
                            );
                            resolve(rows.slice(0, 2));
                        };
                    })
            )
            .mockRejectedValueOnce(new Error('A second clear would fail'));
        fireEvent.click(screen.getByRole('button', { name: button }));
        clearSelection();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(10);
        });
        clearSelection();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(10);
        });
        expect(write).toHaveBeenCalledTimes(1);
        await act(async () => {
            release();
            await vi.advanceTimersByTimeAsync(1000);
        });
        expect(screen.getByLabelText('first amount')).toHaveTextContent(/^$/);
        expect(screen.getByLabelText('first invalid')).toHaveTextContent('false');
        expect(write.mock.calls.map(([input]) => [input.rowIds, input.values])).toEqual([
            [['row-1', 'row-2'], { amount: null, name: null }],
        ]);
    }
);

it.each([700, 100])(
    'sends only the newer field after clear fails with timer elapsed %d',
    async elapsed => {
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
        fireEvent.click(screen.getByRole('button', { name: 'Commit name' }));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(elapsed);
        });
        await act(async () => {
            reject(new Error('Cannot clear'));
            await vi.advanceTimersByTimeAsync(1000);
        });
        expect(write.mock.calls.map(([input]) => [input.rowIds, input.values])).toEqual([
            [['row-1', 'row-2'], { amount: null, name: null }],
            [['row-1'], { name: 'new' }],
        ]);
        expect(rows[0]!.data).toEqual({ amount: 1, name: 'new' });
        expect(screen.getByLabelText('first amount')).toHaveTextContent('42');
        fireEvent.click(screen.getByRole('button', { name: 'Commit newer amount' }));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });
        expect(write.mock.calls.at(-1)![0].values).toEqual({ amount: 84 });
        expect(write).toHaveBeenCalledTimes(3);
        expect(screen.getByLabelText('first amount')).toHaveTextContent('84');
    }
);
